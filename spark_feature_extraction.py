"""
STEP 2 — PySpark Parallel Feature Extraction (Batch)
======================================================
This script uses PySpark to extract log-Mel spectrograms from all .wav
files in parallel — using every CPU core on the machine simultaneously.

WHY PYSPARK HERE:
  The original pipeline processes files one by one in a Python loop.
  With 16,000 files this takes hours. PySpark splits the file list
  across all available CPU cores (local[*]) and processes many files
  at the same time. Same output, significantly less waiting.

  Each file is independent of the others — this is called an
  'embarrassingly parallel' problem and is exactly what Spark excels at.

OUTPUT:
  Parquet file at data/features/mel_features.parquet
  Columns: filename, speaker, gender, mel_features (flattened array), duration_s

HOW TO RUN:
  python 2_spark_feature_extraction.py
"""

import os
import json
import glob
import numpy as np

from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import (
    StructType, StructField,
    StringType, FloatType, ArrayType, IntegerType
)

from config import (
    SPARK_APP_NAME, SPARK_MASTER,
    AUDIO_DIR, FEATURES_DIR,
    SAMPLE_RATE, N_MELS, HOP_LENGTH, N_FFT
)


# ── Schema for the output DataFrame ──────────────────────────────────────────
SCHEMA = StructType([
    StructField("filename",     StringType(),          False),
    StructField("speaker",      StringType(),          True),
    StructField("gender",       StringType(),          True),
    StructField("duration_s",   FloatType(),           True),
    StructField("n_frames",     IntegerType(),         True),
    StructField("mel_features", ArrayType(FloatType()), True),
])


def build_manifest(audio_dir: str) -> list[dict]:
    """Collect all .wav paths and their metadata into a list of dicts."""
    wav_files = sorted(glob.glob(os.path.join(audio_dir, "**", "*.wav"), recursive=True))
    rows = []
    for path in wav_files:
        parts = path.replace("\\", "/").split("/")
        speaker = parts[-2] if len(parts) >= 2 else "unknown"
        gender  = "M" if "male" in path.lower() and "female" not in path.lower() else "F"
        rows.append({"path": os.path.abspath(path), "speaker": speaker, "gender": gender})
    return rows


def extract_mel_for_row(row):
    """
    Spark worker function — runs on each partition independently.
    Reads the .wav file and returns log-Mel spectrogram features.
    """
    import librosa  # imported inside worker so each executor has its own instance

    try:
        y, sr = librosa.load(row["path"], sr=SAMPLE_RATE, mono=True)

        mel = librosa.feature.melspectrogram(
            y=y, sr=sr,
            n_mels=N_MELS,
            hop_length=HOP_LENGTH,
            n_fft=N_FFT,
        )
        log_mel    = librosa.power_to_db(mel, ref=np.max)
        flat       = log_mel.flatten().tolist()
        duration_s = float(len(y) / sr)
        n_frames   = int(mel.shape[1])

        return (
            os.path.basename(row["path"]),
            row["speaker"],
            row["gender"],
            duration_s,
            n_frames,
            flat,
        )
    except Exception as e:
        return (os.path.basename(row["path"]), row["speaker"], row["gender"], -1.0, -1, [])


def main():
    spark = (
        SparkSession.builder
        .appName(SPARK_APP_NAME)
        .master(SPARK_MASTER)
        # allow librosa's numpy usage inside UDFs
        .config("spark.python.worker.reuse", "false")
        .getOrCreate()
    )
    spark.sparkContext.setLogLevel("WARN")

    print(f"[Spark] Running on master: {SPARK_MASTER}")
    print(f"[Spark] Available cores: {spark.sparkContext.defaultParallelism}")

    # Build manifest and create RDD
    manifest = build_manifest(AUDIO_DIR)
    if not manifest:
        print(f"[Warning] No .wav files found in '{AUDIO_DIR}'. Set AUDIO_DIR in config.py.")
        spark.stop()
        return

    print(f"[Spark] Processing {len(manifest)} audio files in parallel...")

    rdd = spark.sparkContext.parallelize(manifest, numSlices=spark.sparkContext.defaultParallelism)

    # Map each file through the extraction function across all cores
    results_rdd = rdd.map(extract_mel_for_row)

    # Convert to DataFrame
    df = spark.createDataFrame(results_rdd, schema=SCHEMA)

    # Show summary stats
    print("\n── Feature Extraction Summary ─────────────────────────────────────")
    df.groupBy("gender", "speaker") \
      .agg(
          F.count("filename").alias("file_count"),
          F.round(F.avg("duration_s"), 2).alias("avg_duration_s"),
          F.round(F.avg("n_frames"), 0).alias("avg_frames"),
      ) \
      .orderBy("speaker") \
      .show(truncate=False)

    total = df.count()
    failed = df.filter(F.col("duration_s") < 0).count()
    print(f"Total processed : {total}")
    print(f"Successful      : {total - failed}")
    print(f"Failed          : {failed}")

    # Save as Parquet — efficient columnar storage, fast for downstream training
    os.makedirs(FEATURES_DIR, exist_ok=True)
    out_path = os.path.join(FEATURES_DIR, "mel_features.parquet")
    df.filter(F.col("duration_s") > 0) \
      .write.mode("overwrite") \
      .parquet(out_path)

    print(f"\n[Spark] Features saved to: {out_path}")
    spark.stop()


if __name__ == "__main__":
    main()
