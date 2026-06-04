"""
STEP 1 — Kafka Producer
========================
This script picks up each generated .wav file the moment it is ready
and streams it into the Kafka topic 'dysarthric-audio-stream'.

WHY KAFKA HERE:
  Without Kafka, the pipeline waits for ALL 16,000 files to be generated
  before processing begins. Kafka acts as a conveyor belt — the moment
  file #1 is ready it flows to the next stage while file #2 is still
  being generated. Generation and processing run in parallel.

HOW TO RUN:
  1. Start Docker:   docker-compose up -d
  2. Run this file:  python 1_kafka_producer.py

  Point AUDIO_DIR in config.py to your folder of .wav files.
"""

import os
import json
import time
import glob
import sys

IS_DEMO = '--demo' in sys.argv 

try:
    if IS_DEMO:
        raise ImportError()
    from kafka import KafkaProducer #type:ignore 
    from kafka.errors import NoBrokersAvailable #type:ignore
    demo_mode = False
except ImportError:
    demo_mode = True

try:
    if IS_DEMO:
        raise ImportError()
    from tqdm import tqdm
except ImportError:
    # Custom simple progress bar if tqdm is not installed
    def tqdm(iterable, desc="", unit="file", total=None):
        if total is None:
            total = len(iterable) if hasattr(iterable, '__len__') else 100
        start_time = time.time()
        for idx, item in enumerate(iterable):
            yield item
            if total > 0 and ((idx + 1) % max(1, total // 20) == 0 or idx + 1 == total):
                percent = int((idx + 1) / total * 100)
                elapsed = time.time() - start_time
                rate = (idx + 1) / elapsed if elapsed > 0 else 0
                bar_len = percent // 5
                bar = '#' * bar_len + '-' * (20 - bar_len)
                sys.stdout.write(f"\r{desc}: {percent}%|{bar}| {idx+1}/{total} [{elapsed:.1f}s, {rate:.1f} {unit}/s]")
                sys.stdout.flush()
        sys.stdout.write("\n")
        sys.stdout.flush()

from config import KAFKA_BOOTSTRAP_SERVERS, KAFKA_TOPIC_AUDIO, AUDIO_DIR


def get_speaker_meta(filepath: str) -> dict:
    """Extract speaker metadata from the file path convention used by XTTS-v2 output."""
    parts = filepath.replace("\\", "/").split("/")
    speaker = parts[-2] if len(parts) >= 2 else "unknown"
    gender  = "M" if "male" in filepath.lower() and "female" not in filepath.lower() else "F"
    return {
        "speaker": speaker,
        "gender":  gender,
        "filename": os.path.basename(filepath),
    }


def create_producer(retries: int = 5):
    if demo_mode:
        print("[Kafka] Connecting to localhost:9092...")
        time.sleep(0.5)
        print(f"[Kafka] Connected to {KAFKA_BOOTSTRAP_SERVERS} (SIMULATED)")
        return "mock_producer"

    for attempt in range(retries):
        try:
            producer = KafkaProducer(
                bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
                # metadata sent as JSON in the message key
                key_serializer=lambda k: json.dumps(k).encode("utf-8"),
                # audio bytes sent raw as the message value
                value_serializer=lambda v: v,
                max_request_size=10_485_760,   # 10 MB per message
            )
            print(f"[Kafka] Connected to {KAFKA_BOOTSTRAP_SERVERS}")
            return producer
        except NoBrokersAvailable:
            wait = 2 ** attempt
            print(f"[Kafka] Broker not ready, retrying in {wait}s... (attempt {attempt+1}/{retries})")
            time.sleep(wait)
    raise RuntimeError("Could not connect to Kafka. Is docker-compose up?")


def stream_audio_files(producer, audio_dir: str):
    if demo_mode:
        print(f"[Producer] Found 1600 .wav files (SIMULATED) — streaming to Kafka topic '{KAFKA_TOPIC_AUDIO}'")
        dummy_files = [f"speaker_{(i % 12) + 1:02d}/audio_{i:05d}.wav" for i in range(1600)]
        
        # Stream files with progress bar
        for _ in tqdm(dummy_files, desc="Streaming audio files", unit="file"):
            # Sleep tiny amount so it updates smoothly and runs in 1-2 seconds
            time.sleep(0.001)
            
        print(f"\n[Producer] Done. Sent: 1600 | Failed: 0")
        print(f"[Producer] Topic '{KAFKA_TOPIC_AUDIO}' now has 1600 audio messages waiting for consumers.")
        return

    wav_files = sorted(glob.glob(os.path.join(audio_dir, "**", "*.wav"), recursive=True))

    if not wav_files:
        print(f"[Warning] No .wav files found in '{audio_dir}'.")
        print("          Set AUDIO_DIR in config.py to your generated audio folder.")
        return

    print(f"[Producer] Found {len(wav_files)} .wav files — streaming to Kafka topic '{KAFKA_TOPIC_AUDIO}'")

    sent = 0
    failed = 0

    for wav_path in tqdm(wav_files, desc="Streaming audio files", unit="file"):
        try:
            with open(wav_path, "rb") as f:
                audio_bytes = f.read()

            meta = get_speaker_meta(wav_path)

            producer.send(
                topic=KAFKA_TOPIC_AUDIO,
                key=meta,
                value=audio_bytes,
            )
            sent += 1

            # Small sleep so we can visually see files being streamed in demo
            time.sleep(0.01)

        except Exception as e:
            print(f"[Error] Could not send {wav_path}: {e}")
            failed += 1

    producer.flush()
    print(f"\n[Producer] Done. Sent: {sent} | Failed: {failed}")
    print(f"[Producer] Topic '{KAFKA_TOPIC_AUDIO}' now has {sent} audio messages waiting for consumers.")


if __name__ == "__main__":
    os.makedirs(AUDIO_DIR, exist_ok=True)
    prod = create_producer()
    stream_audio_files(prod, AUDIO_DIR)
    if not demo_mode and hasattr(prod, 'close'):
        prod.close()
