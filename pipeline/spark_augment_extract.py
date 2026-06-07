"""
PySpark Parallel Augmentation + Feature Extraction
====================================================
Processes all .wav files in AUDIO_DIR simultaneously across all CPU cores.
Each file goes through augmentation and log-Mel spectrogram extraction
in parallel — replacing a sequential loop that processed one file at a time.

Run:  python pipeline/spark_augment_extract.py
"""

import os
import glob
import random
import numpy as np

from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import (
    StructType, StructField,
    StringType, FloatType, ArrayType, IntegerType
)

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from config import SPARK_APP_NAME, SPARK_MASTER, AUDIO_DIR, FEATURES_DIR
from config import SAMPLE_RATE, N_MELS, HOP_LENGTH, N_FFT

AUGMENTATION_TECHNIQUES = ["gaussian_noise", "pitch_shift", "time_stretch", "time_shift"]

OUTPUT_SCHEMA = StructType([
    StructField("filename",      StringType(),           False),
    StructField("speaker",       StringType(),           True),
    StructField("gender",        StringType(),           True),
    StructField("augmentation",  StringType(),           True),
    StructField("duration_s",    FloatType(),            True),
    StructField("n_frames",      IntegerType(),          True),
    StructField("mel_features",  ArrayType(FloatType()), True),
    StructField("status",        StringType(),           True),
])


def build_manifest(audio_dir: str) -> list:
    """Build list of (path, speaker, gender, augmentation) for every file × technique."""
    wav_files = sorted(glob.glob(os.path.join(audio_dir, "**", "*.wav"), recursive=True))
    rows = []
    for path in wav_files:
        parts   = path.replace("\\", "/").split("/")
        speaker = parts[-2] if len(parts) >= 2 else "unknown"
        gender  = "M" if "male" in path.lower() and "female" not in path.lower() else "F"
        for technique in AUGMENTATION_TECHNIQUES:
            rows.append({
                "path":        os.path.abspath(path),
                "speaker":     speaker,
                "gender":      gender,
                "augmentation": technique,
            })
    return rows


def process_row(row: dict) -> tuple:
    """
    Worker function — runs independently on each partition.
    Applies augmentation then extracts log-Mel spectrogram features.
    """
    import librosa

    path      = row["path"]
    technique = row["augmentation"]

    try:
        y, sr = librosa.load(path, sr=SAMPLE_RATE, mono=True)

        # ── Augmentation ────────────────────────────────────────
        if technique == "gaussian_noise":
            y = y + np.random.normal(0, 0.005, y.shape)

        elif technique == "pitch_shift":
            y = librosa.effects.pitch_shift(y, sr=sr, n_steps=random.uniform(-2.0, 2.0))

        elif technique == "time_stretch":
            y = librosa.effects.time_stretch(y, rate=random.uniform(0.85, 1.15))

        elif technique == "time_shift":
            shift = int(sr * random.uniform(0.05, 0.15))
            y     = np.roll(y, shift)

        # ── Feature extraction ───────────────────────────────────
        mel     = librosa.feature.melspectrogram(
            y=y, sr=sr, n_mels=N_MELS, hop_length=HOP_LENGTH, n_fft=N_FFT
        )
        log_mel = librosa.power_to_db(mel, ref=np.max)

        return (
            os.path.basename(path),
            row["speaker"],
            row["gender"],
            technique,
            float(len(y) / sr),
            int(mel.shape[1]),
            log_mel.flatten().tolist(),
            "ok",
        )

    except Exception as e:
        return (os.path.basename(path), row["speaker"], row["gender"],
                technique, -1.0, -1, [], f"error: {e}")


def main():
    spark = (
        SparkSession.builder
        .appName(SPARK_APP_NAME)
        .master(SPARK_MASTER)
        .config("spark.python.worker.reuse", "false")
        .getOrCreate()
    )
    spark.sparkContext.setLogLevel("WARN")

    cores = spark.sparkContext.defaultParallelism
    print(f"\n[Spark] Master  : {SPARK_MASTER}")
    print(f"[Spark] Cores   : {cores}")

    manifest = build_manifest(AUDIO_DIR)
    if not manifest:
        print(f"[Warning] No .wav files found in '{AUDIO_DIR}'")
        spark.stop()
        return

    total_tasks = len(manifest)
    print(f"[Spark] Tasks   : {total_tasks} ({total_tasks // len(AUGMENTATION_TECHNIQUES)} files × {len(AUGMENTATION_TECHNIQUES)} augmentations)")
    print(f"[Spark] Processing in parallel across {cores} cores...\n")

    rdd = spark.sparkContext.parallelize(manifest, numSlices=cores)
    df  = spark.createDataFrame(rdd.map(process_row), schema=OUTPUT_SCHEMA)

    # Summary
    success = df.filter(F.col("status") == "ok").count()
    failed  = df.filter(F.col("status") != "ok").count()

    print("── Augmentation × Speaker Summary ───────────────────────────")
    df.filter(F.col("status") == "ok") \
      .groupBy("augmentation", "gender") \
      .agg(
          F.count("filename").alias("files"),
          F.round(F.avg("duration_s"), 2).alias("avg_dur_s"),
      ) \
      .orderBy("augmentation", "gender") \
      .show(truncate=False)

    print(f"Total tasks : {total_tasks}")
    print(f"Successful  : {success}")
    print(f"Failed      : {failed}")

    os.makedirs(FEATURES_DIR, exist_ok=True)
    out = os.path.join(FEATURES_DIR, "mel_features.parquet")
    df.filter(F.col("status") == "ok") \
      .drop("status") \
      .write.mode("overwrite") \
      .parquet(out)

    print(f"\n[Spark] Features saved → {out}")
    spark.stop()


if __name__ == "__main__":
    main()
