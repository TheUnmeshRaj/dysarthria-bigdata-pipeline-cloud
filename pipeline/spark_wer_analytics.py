"""
Spark SQL — Multi-Dimensional WER Analytics
=============================================
Loads inference results and computes Word Error Rate broken down across
severity level, gender, noise condition, and augmentation technique.

Turns a single WER number into a full performance breakdown that reveals
where the model succeeds and where it needs improvement — across thousands
of result rows using Spark SQL GROUP BY aggregations.

Run:  python pipeline/spark_wer_analytics.py
"""

import os
import random
import pandas as pd

from pyspark.sql import SparkSession
from pyspark.sql import functions as F

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from config import SPARK_APP_NAME, SPARK_MASTER, RESULTS_DIR


def generate_demo_results(n: int = 1000) -> pd.DataFrame:
    """
    Generates realistic inference results mirroring TORGO dataset structure.
    Used for demonstration when actual model inference results are not yet available.
    """
    random.seed(42)
    wer_baseline  = {"mild": (0.22, 0.05), "moderate": (0.35, 0.07), "severe": (0.55, 0.10)}
    wer_finetuned = {"mild": (0.10, 0.03), "moderate": (0.18, 0.05), "severe": (0.28, 0.08)}
    noise_penalty = {"clean": 0.00, "gaussian": 0.05, "babble": 0.08, "reverb": 0.04}

    rows = []
    for i in range(n):
        sev   = random.choice(["mild", "moderate", "severe"])
        noise = random.choice(["clean", "gaussian", "babble", "reverb"])
        aug   = random.choice(["gaussian_noise", "pitch_shift", "time_stretch", "time_shift"])
        gen   = random.choice(["M", "F"])
        spk   = f"speaker_{random.randint(1, 15):02d}"
        rows.append({
            "filename":      f"{spk}_{i:05d}.wav",
            "speaker":       spk,
            "gender":        gen,
            "severity":      sev,
            "noise_type":    noise,
            "augmentation":  aug,
            "baseline_wer":  round(max(0, random.gauss(*wer_baseline[sev])  + noise_penalty[noise]), 4),
            "finetuned_wer": round(max(0, random.gauss(*wer_finetuned[sev]) + noise_penalty[noise]), 4),
        })
    return pd.DataFrame(rows)


def main():
    spark = (
        SparkSession.builder
        .appName(f"{SPARK_APP_NAME}-Analytics")
        .master(SPARK_MASTER)
        .getOrCreate()
    )
    spark.sparkContext.setLogLevel("WARN")

    os.makedirs(RESULTS_DIR, exist_ok=True)
    csv_path = os.path.join(RESULTS_DIR, "inference_results.csv")

    if not os.path.exists(csv_path):
        print("[Analytics] No inference_results.csv found — using demo data.")
        generate_demo_results(1000).to_csv(csv_path, index=False)

    df = spark.read.csv(csv_path, header=True, inferSchema=True)
    df.createOrReplaceTempView("results")

    total = df.count()
    print(f"\n[Spark SQL] Loaded {total} inference results")
    print("=" * 58)
    print("  DYSARTHRIC ASR — WER ANALYTICS REPORT")
    print("=" * 58)

    print("\n── 1. Overall: Baseline vs Fine-Tuned ──────────────────")
    spark.sql("""
        SELECT
          ROUND(AVG(baseline_wer)  * 100, 2) AS baseline_WER_pct,
          ROUND(AVG(finetuned_wer) * 100, 2) AS finetuned_WER_pct,
          ROUND((AVG(baseline_wer) - AVG(finetuned_wer))
                / AVG(baseline_wer) * 100, 2) AS improvement_pct
        FROM results
    """).show()

    print("── 2. WER by Severity Level ─────────────────────────────")
    spark.sql("""
        SELECT severity,
          COUNT(*) AS samples,
          ROUND(AVG(baseline_wer)  * 100, 2) AS baseline_pct,
          ROUND(AVG(finetuned_wer) * 100, 2) AS finetuned_pct,
          ROUND((AVG(baseline_wer) - AVG(finetuned_wer))
                / AVG(baseline_wer) * 100, 2) AS improvement_pct
        FROM results
        GROUP BY severity
        ORDER BY finetuned_pct ASC
    """).show()

    print("── 3. WER by Noise Condition ────────────────────────────")
    spark.sql("""
        SELECT noise_type,
          COUNT(*) AS samples,
          ROUND(AVG(finetuned_wer) * 100, 2) AS finetuned_WER_pct
        FROM results
        GROUP BY noise_type
        ORDER BY finetuned_WER_pct ASC
    """).show()

    print("── 4. WER by Augmentation Technique ────────────────────")
    spark.sql("""
        SELECT augmentation,
          COUNT(*) AS samples,
          ROUND(AVG(finetuned_wer) * 100, 2) AS finetuned_WER_pct,
          ROUND((AVG(baseline_wer) - AVG(finetuned_wer))
                / AVG(baseline_wer) * 100, 2) AS improvement_pct
        FROM results
        GROUP BY augmentation
        ORDER BY improvement_pct DESC
    """).show()

    print("── 5. WER by Gender ─────────────────────────────────────")
    spark.sql("""
        SELECT gender, COUNT(*) AS samples,
          ROUND(AVG(finetuned_wer) * 100, 2) AS finetuned_WER_pct
        FROM results GROUP BY gender ORDER BY gender
    """).show()

    out = os.path.join(RESULTS_DIR, "analytics_summary.parquet")
    spark.sql("""
        SELECT severity, noise_type, gender, augmentation,
               AVG(baseline_wer)  AS avg_baseline_wer,
               AVG(finetuned_wer) AS avg_finetuned_wer,
               COUNT(*)           AS sample_count
        FROM results
        GROUP BY severity, noise_type, gender, augmentation
    """).write.mode("overwrite").parquet(out)

    print(f"\n[Spark SQL] Summary saved → {out}")
    spark.stop()


if __name__ == "__main__":
    main()
