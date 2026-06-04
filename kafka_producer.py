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

from kafka import KafkaProducer
from kafka.errors import NoBrokersAvailable
from tqdm import tqdm

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


def create_producer(retries: int = 5) -> KafkaProducer:
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


def stream_audio_files(producer: KafkaProducer, audio_dir: str):
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
    producer = create_producer()
    stream_audio_files(producer, AUDIO_DIR)
    producer.close()
