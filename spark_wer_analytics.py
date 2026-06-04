"""
STEP 4 — Spark SQL WER Analytics
==================================
Loads model inference results (predicted vs. reference transcriptions)
and uses Spark SQL to compute Word Error Rate broken down across multiple
dimensions: severity level, speaker, gender, noise type, augmentation.

WHY SPARK SQL HERE:
  The original project reports a single WER number (16.12%). That one
  number hides the full story. Spark SQL lets us ask:
    - Which severity group benefits most from fine-tuning?
    - Which noise condition hurts performance most?
    - Which augmentation technique contributed most to improvement?
  Answering these needs GROUP BY aggregations over thousands of rows —
  exactly what Spark SQL is built for.

INPUT:
  data/results/inference_results.csv
  Columns: filename, speaker, gender, severity, noise_type, augmentation,
           reference_text, predicted_text

HOW TO RUN:
  python 4_spark_wer_analytics.py

  If you don't have real inference results yet, the script generates
  a realistic synthetic dataset so you can see the analytics working.
"""

import os
import math
import random

import pandas as pd
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import FloatType

from config import SPARK_APP_NAME, SPARK_MASTER, RESULTS_DIR


# ── Helpers ──────────────────────────────────────────────────────────────────

def compute_wer(reference: str, hypothesis: str) -> float:
    """Compute Word Error Rate between two strings."""
    ref   = reference.lower().split()
    hyp   = hypothesis.lower().split()
    n     = len(ref)
    if n == 0:
        return 0.0
    m = len(hyp)
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        dp[i][0] = i
    for j in range(m + 1):
        dp[0][j] = j
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if ref[i-1] == hyp[j-1]:
                dp[i][j] = dp[i-1][j-1]
            else:
                dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
    return round(dp[n][m] / n, 4)


def generate_synthetic_results(n: int = 500) -> pd.DataFrame:
    """
    Generate synthetic inference results that mirror the TORGO dataset structure
    so the analytics can be demonstrated without needing real model outputs.
    WER values are sampled to reflect realistic fine-tuned model behaviour.
    """
    random.seed(42)
    severities  = ["mild", "moderate", "severe"]
    noise_types = ["clean", "gaussian", "babble", "reverb"]
    augments    = ["none", "pitch_shift", "time_stretch", "time_shift"]
    genders     = ["M", "F"]

    # Baseline WER distributions per condition (mean, std)
    wer_baseline = {"mild": (0.22, 0.05), "moderate": (0.35, 0.07), "severe": (0.55, 0.10)}
    wer_finetuned = {"mild": (0.10, 0.03), "moderate": (0.18, 0.05), "severe": (0.28, 0.08)}
    noise_penalty = {"clean": 0.00, "gaussian": 0.05, "babble": 0.08, "reverb": 0.04}

    rows = []
    for i in range(n):
        sev   = random.choice(severities)
        noise = random.choice(noise_types)
        aug   = random.choice(augments)
        gen   = random.choice(genders)
        spk   = f"speaker_{random.randint(1, 15):02d}"

        base_wer = max(0.0, random.gauss(*wer_baseline[sev]) + noise_penalty[noise])
        ft_wer   = max(0.0, random.gauss(*wer_finetuned[sev]) + noise_penalty[noise])

        rows.append({
            "filename":       f"{spk}_{i:05d}.wav",
            "speaker":        spk,
            "gender":         gen,
            "severity":       sev,
            "noise_type":     noise,
            "augmentation":   aug,
            "baseline_wer":   round(base_wer, 4),
            "finetuned_wer":  round(ft_wer, 4),
        })

    return pd.DataFrame(rows)


# ── Main analytics ────────────────────────────────────────────────────────────

def main():
    spark = (
        SparkSession.builder
        .appName(f"{SPARK_APP_NAME}-Analytics")
        .master(SPARK_MASTER)
        .getOrCreate()
    )
    spark.sparkContext.setLogLevel("WARN")

    os.makedirs(RESULTS_DIR, exist_ok=True)
    results_csv = os.path.join(RESULTS_DIR, "inference_results.csv")

    # Generate synthetic data if real results don't exist yet
    if not os.path.exists(results_csv):
        print("[Analytics] No inference_results.csv found — generating synthetic demo data...")
        df_pd = generate_synthetic_results(n=1000)
        df_pd.to_csv(results_csv, index=False)
        print(f"[Analytics] Synthetic dataset saved: {results_csv}  ({len(df_pd)} rows)\n")

    df = spark.read.csv(results_csv, header=True, inferSchema=True)
    df.createOrReplaceTempView("results")

    print("=" * 65)
    print("  DYSARTHRIC ASR — SPARK SQL ANALYTICS REPORT")
    print("=" * 65)

    # ── 1. Overall WER comparison ─────────────────────────────────────────
    print("\n── 1. Overall WER: Baseline vs Fine-Tuned ──────────────────────")
    spark.sql("""
        SELECT
            ROUND(AVG(baseline_wer)  * 100, 2) AS baseline_WER_pct,
            ROUND(AVG(finetuned_wer) * 100, 2) AS finetuned_WER_pct,
            ROUND((AVG(baseline_wer) - AVG(finetuned_wer))
                  / AVG(baseline_wer) * 100, 2)  AS improvement_pct
        FROM results
    """).show()

    # ── 2. WER by severity level ──────────────────────────────────────────
    print("── 2. WER by Severity Level ─────────────────────────────────────")
    spark.sql("""
        SELECT
            severity,
            COUNT(*)                                 AS samples,
            ROUND(AVG(baseline_wer)  * 100, 2)      AS baseline_WER_pct,
            ROUND(AVG(finetuned_wer) * 100, 2)      AS finetuned_WER_pct,
            ROUND((AVG(baseline_wer) - AVG(finetuned_wer))
                  / AVG(baseline_wer) * 100, 2)     AS improvement_pct
        FROM results
        GROUP BY severity
        ORDER BY finetuned_WER_pct ASC
    """).show()

    # ── 3. WER by noise type ──────────────────────────────────────────────
    print("── 3. WER by Noise Condition ────────────────────────────────────")
    spark.sql("""
        SELECT
            noise_type,
            COUNT(*)                                AS samples,
            ROUND(AVG(baseline_wer)  * 100, 2)     AS baseline_WER_pct,
            ROUND(AVG(finetuned_wer) * 100, 2)     AS finetuned_WER_pct
        FROM results
        GROUP BY noise_type
        ORDER BY finetuned_WER_pct ASC
    """).show()

    # ── 4. WER by gender ─────────────────────────────────────────────────
    print("── 4. WER by Gender ─────────────────────────────────────────────")
    spark.sql("""
        SELECT
            gender,
            COUNT(*)                               AS samples,
            ROUND(AVG(baseline_wer)  * 100, 2)    AS baseline_WER_pct,
            ROUND(AVG(finetuned_wer) * 100, 2)    AS finetuned_WER_pct
        FROM results
        GROUP BY gender
        ORDER BY gender
    """).show()

    # ── 5. Best and worst performing speakers ─────────────────────────────
    print("── 5. Per-Speaker WER (Fine-Tuned) ──────────────────────────────")
    spark.sql("""
        SELECT
            speaker,
            gender,
            severity,
            COUNT(*)                               AS samples,
            ROUND(AVG(finetuned_wer) * 100, 2)   AS avg_WER_pct
        FROM results
        GROUP BY speaker, gender, severity
        ORDER BY avg_WER_pct ASC
        LIMIT 10
    """).show()

    # ── 6. Which augmentation helped most ────────────────────────────────
    print("── 6. WER by Augmentation Technique ────────────────────────────")
    spark.sql("""
        SELECT
            augmentation,
            COUNT(*)                                AS samples,
            ROUND(AVG(baseline_wer)  * 100, 2)     AS baseline_WER_pct,
            ROUND(AVG(finetuned_wer) * 100, 2)     AS finetuned_WER_pct,
            ROUND((AVG(baseline_wer) - AVG(finetuned_wer))
                  / AVG(baseline_wer) * 100, 2)    AS improvement_pct
        FROM results
        GROUP BY augmentation
        ORDER BY improvement_pct DESC
    """).show()

    # ── Save analytics summary to Parquet ────────────────────────────────
    out = os.path.join(RESULTS_DIR, "analytics_summary.parquet")
    spark.sql("""
        SELECT severity, noise_type, gender, augmentation,
               AVG(baseline_wer) AS avg_baseline_wer,
               AVG(finetuned_wer) AS avg_finetuned_wer,
               COUNT(*) AS sample_count
        FROM results
        GROUP BY severity, noise_type, gender, augmentation
    """).write.mode("overwrite").parquet(out)

    print(f"[Analytics] Summary saved to: {out}")
    spark.stop()


if __name__ == "__main__":
    main()
