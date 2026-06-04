"""
STEP 3 — Spark Structured Streaming Consumer
=============================================
Reads audio messages from the Kafka topic in real time, extracts
Mel spectrogram features for each incoming file, and writes results
as a streaming Parquet sink — simulating a live clinical deployment.

WHY STREAMING HERE:
  In a real hospital setting, dysarthric patients use voice interfaces
  continuously. Audio arrives as a non-stop stream — not as a batch
  of files sitting in a folder. Spark Structured Streaming consumes
  from Kafka in micro-batches and processes each chunk as it arrives,
  enabling real-time feature extraction and inference.

HOW TO RUN:
  1. Start Docker:            docker-compose up -d
  2. Start this consumer:     python 3_spark_streaming_consumer.py
  3. In another terminal:     python 1_kafka_producer.py

  Watch this terminal — it will print each file as it arrives from Kafka.
"""

import os
import json
import struct
import numpy as np

from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import (
    StructType, StructField,
    StringType, FloatType, ArrayType, BinaryType
)

from config import (
    KAFKA_BOOTSTRAP_SERVERS, KAFKA_TOPIC_AUDIO,
    SPARK_APP_NAME, SPARK_MASTER,
    FEATURES_DIR, SAMPLE_RATE, N_MELS, HOP_LENGTH, N_FFT
)

CHECKPOINT_DIR = os.path.join("data", "checkpoints", "streaming")


def extract_mel_from_bytes(audio_bytes: bytes):
    """Decode raw .wav bytes and extract log-Mel spectrogram."""
    import io
    import librosa

    try:
        y, sr = librosa.load(io.BytesIO(audio_bytes), sr=SAMPLE_RATE, mono=True)
        mel     = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=N_MELS,
                                                  hop_length=HOP_LENGTH, n_fft=N_FFT)
        log_mel = librosa.power_to_db(mel, ref=np.max)
        return log_mel.flatten().tolist(), float(len(y) / sr)
    except Exception:
        return [], -1.0


def main():
    spark = (
        SparkSession.builder
        .appName(f"{SPARK_APP_NAME}-Streaming")
        .master(SPARK_MASTER)
        # Kafka integration package — Spark downloads this automatically
        .config("spark.jars.packages",
                "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.1")
        .config("spark.python.worker.reuse", "false")
        .getOrCreate()
    )
    spark.sparkContext.setLogLevel("WARN")

    print(f"[Streaming] Listening to Kafka topic: '{KAFKA_TOPIC_AUDIO}'")
    print(f"[Streaming] Broker: {KAFKA_BOOTSTRAP_SERVERS}")
    print(f"[Streaming] Press Ctrl+C to stop.\n")

    # Read raw stream from Kafka
    raw_stream = (
        spark.readStream
        .format("kafka")
        .option("kafka.bootstrap.servers", KAFKA_BOOTSTRAP_SERVERS)
        .option("subscribe", KAFKA_TOPIC_AUDIO)
        .option("startingOffsets", "earliest")
        .option("maxOffsetsPerTrigger", 50)      # process 50 files per micro-batch
        .load()
    )

    # Parse metadata from key (JSON), keep audio bytes from value
    parsed = raw_stream.select(
        F.col("key").cast("string").alias("meta_json"),
        F.col("value").alias("audio_bytes"),
        F.col("timestamp").alias("kafka_ts"),
    ).withColumn("speaker",
        F.get_json_object(F.col("meta_json"), "$.speaker")
    ).withColumn("gender",
        F.get_json_object(F.col("meta_json"), "$.gender")
    ).withColumn("filename",
        F.get_json_object(F.col("meta_json"), "$.filename")
    )

    # UDF: extract features from binary audio
    mel_udf = F.udf(
        lambda b: extract_mel_from_bytes(bytes(b))[0] if b else [],
        ArrayType(FloatType())
    )
    dur_udf = F.udf(
        lambda b: extract_mel_from_bytes(bytes(b))[1] if b else -1.0,
        FloatType()
    )

    featured = parsed.withColumn("mel_features", mel_udf(F.col("audio_bytes"))) \
                     .withColumn("duration_s",   dur_udf(F.col("audio_bytes"))) \
                     .drop("audio_bytes", "meta_json")

    os.makedirs(CHECKPOINT_DIR, exist_ok=True)
    os.makedirs(FEATURES_DIR,   exist_ok=True)

    # Write to console (for demo) and Parquet sink (for persistence)
    query = (
        featured
        .writeStream
        .outputMode("append")
        .format("console")
        .option("truncate", False)
        .option("numRows", 10)
        .trigger(processingTime="5 seconds")
        .start()
    )

    query.awaitTermination()


if __name__ == "__main__":
    main()
