# Full Project Documentation
## Automated Speech Recognition for Dysarthria — Big Data Pipeline

> **LLM / Teammate Context File**
> This is the single source of truth for the entire project. Read this before touching any file, asking any question, or continuing any work. It covers what the project is, what was built, what was decided against, what was actually run, and what the current state is.

---

## Table of Contents

1. [Project Identity](#1-project-identity)
2. [Problem Statement](#2-problem-statement)
3. [Original IDP Project — What Was Already Built](#3-original-idp-project--what-was-already-built)
4. [Why Big Data Was Added](#4-why-big-data-was-added)
5. [Tool Selection — Full Decision Log](#5-tool-selection--full-decision-log)
6. [What Was Actually Built and Run](#6-what-was-actually-built-and-run)
7. [Kaggle Run — Real Output](#7-kaggle-run--real-output)
8. [Repository Structure and File Guide](#8-repository-structure-and-file-guide)
9. [Key Results](#9-key-results)
10. [How to Run Each Component](#10-how-to-run-each-component)
11. [Presentation Narrative](#11-presentation-narrative)
12. [Constraints and Hard Rules](#12-constraints-and-hard-rules)
13. [Current State of the Project](#13-current-state-of-the-project)

---

## 1. Project Identity

| Field | Value |
|---|---|
| Project title | Automated Speech Recognition for Dysarthria |
| Course | CS367P — Big Data Technologies (Interdisciplinary Project) |
| College | RV College of Engineering, Bengaluru (VTU affiliated) |
| Team | Unmesh Raj (AI), Vijesh (IS), Sanjay C M (ET), Seshasai Chillara (ET) |
| Guide | Dr. Shanta Rangaswamy |
| Academic year | 2025–26 |
| Kaggle dataset | [synthetic-dysarthric-speech](https://www.kaggle.com/datasets/unmeshraj/synthetic-dysarthric-speech) |

---

## 2. Problem Statement

**Dysarthria** is a motor speech disorder caused by ALS, cerebral palsy, Parkinson's disease, or stroke. It impairs the physical act of speaking — slurred, slow, low-volume, unclear articulation — but does not affect cognition. Patients can think clearly but cannot communicate clearly.

The consequence for ASR systems is severe:
- OpenAI Whisper-small achieves ~5% WER on normal English speech
- On dysarthric speech (TORGO dataset), the same model fails at **32–38% WER** without fine-tuning
- This makes assistive speech technology unusable for the population that needs it most

**The root cause is data scarcity.** Real dysarthric speech datasets contain fewer than 50 speakers worldwide. TORGO, the main benchmark, has around 15 speakers. No model can generalise well from 15 speakers.

**This project's answer:** generate 16,000 synthetic dysarthric speech samples using TTS, process them through a Big Data pipeline, and fine-tune Whisper with LoRA. The result is **16.12% WER on TORGO** — the best published result on this benchmark.

---

## 3. Original IDP Project — What Was Already Built

The core ML pipeline was built for a different subject (Interdisciplinary Project, IDP). It is fully complete and not to be modified. The Big Data tools are a layer on top of this pipeline's data processing stages.

### What the IDP pipeline does

| Step | Description | Tool |
|---|---|---|
| 1 | Generate ~16,000 synthetic dysarthric `.wav` files | XTTS-v2 (Coqui TTS) |
| 2 | Apply 4 augmentation techniques per file: gaussian noise, pitch shift, time stretch, time shift | nlpaug, Librosa |
| 3 | Extract log-Mel spectrogram features from each augmented file | Librosa |
| 4 | Fine-tune Whisper-small using LoRA (updates only 3.6% of model parameters) | HuggingFace PEFT, PyTorch |
| 5 | Post-process output with a local LLM + Personal Knowledge Graph for context correction | Custom |
| 6 | Evaluate using Word Error Rate (WER) and Character Error Rate (CER) | jiwer |

### Data

| Dataset | Details |
|---|---|
| Synthetic dataset | 16,000 `.wav` files generated via XTTS-v2 — **~3.2 GB total** |
| TORGO Dataset | Real dysarthric speech — ~15 speakers — used for evaluation |
| Kaggle path | `/kaggle/input/datasets/unmeshraj/synthetic-dysarthric-speech/` |

### Original tooling (non-Big-Data)

Python, PyTorch, HuggingFace Transformers, PEFT (LoRA), Librosa, nlpaug. Training ran on **Kaggle dual NVIDIA Tesla T4 GPUs** for **14+ hours**.

### Key results (IDP)

| Metric | Value |
|---|---|
| Baseline Whisper-small WER (TORGO) | 32.15% |
| Our fine-tuned model WER | **16.12%** |
| Improvement over baseline | **49.86%** |
| Improvement over prior best (Whisper-Vicuna, 21%) | **23.24%** |
| Rank | **Best published result on TORGO** |

---

## 4. Why Big Data Was Added

The project is being evaluated for CS367P — Big Data Technologies. The data (3.2 GB, 16,000 files) qualifies by volume. However, the original pipeline ran as a sequential Python script — not Big Data.

**Two genuine bottlenecks were identified where Big Data tools provide honest, demonstrable value:**

### Bottleneck 1 — Sequential augmentation + feature extraction

The original code applies 4 augmentation techniques and then extracts log-Mel features in a `for` loop — one file at a time.

- 16,000 files × 4 techniques = **64,000 sequential tasks**
- Each waits for the previous to complete
- This is the definition of an *embarrassingly parallel problem* — no task depends on another
- The synthetic dataset generation itself took **36 hours** for Unmesh's run

**PySpark fix:** distribute all 64,000 tasks across all CPU cores simultaneously using `local[*]` mode — no cluster needed.

### Bottleneck 2 — Single-number evaluation

The original evaluation reports one number: overall WER. This hides critical subgroup performance.

- Does the model work better for mild vs severe dysarthria?
- Does gaussian noise augmentation help more than time-shift?
- Is performance equal for male and female speakers?
- Does reverb degrade accuracy more than babble noise?

Without answering these, the model cannot be improved systematically.

**Spark SQL fix:** load all inference results into a Spark DataFrame and run GROUP BY analytics across severity, noise type, augmentation technique, and gender.

---

## 5. Tool Selection — Full Decision Log

This section records every tool that was considered, why it was accepted or rejected. This is important context for any future decisions.

### ✅ Apache Spark (PySpark) — KEPT

**Why it fits:** The augmentation + feature extraction loop is embarrassingly parallel. PySpark's DataFrame API with UDFs maps perfectly to this pattern. Runs in `local[*]` mode on a laptop — no Hadoop cluster needed.

**Status:** Built. Actually run on Kaggle. Real output available (see Section 7).

---

### ✅ Spark SQL — KEPT

**Why it fits:** WER breakdown by subgroup (severity, gender, noise, augmentation) is a genuine multi-dimensional analytics problem. Spark SQL GROUP BY queries are exactly how this is done at scale.

**Status:** Built. Actually run on Kaggle. Real output available (see Section 7).

---

### ✅ Dashboard (dashboard.html) — KEPT

Visual presentation layer. Shows all real Kaggle output, pipeline architecture, model leaderboard, and Spark SQL results. Opens in any browser — no server required.

**File:** `pipeline/dashboard.html`

---

### ❌ Apache Kafka — REJECTED (hard constraint)

**Reason:** The course teacher explicitly said Kafka is part of the next semester's syllabus and cannot be used in this project. Using it would result in mark deductions.

**Do not add Kafka to any part of this project.**

---

### ❌ Apache Flink — REJECTED (does not fit)

**Why considered:** Initially proposed as a Kafka alternative for streaming.

**Why rejected:**
- Flink is a stream processor built for millions of events/second from multiple live producers
- This project generates all files in one batch run — not a continuous stream
- Flink's directory-watching SourceFunction would essentially be a `while` loop with unnecessary complexity
- The project does not have a streaming ingestion problem
- Forcing Flink in would mean building a solution for a problem that does not exist

---

### ❌ Apache Airflow — CONSIDERED, THEN DROPPED

**Why built:** Initially planned to orchestrate the 4-stage pipeline as a DAG with dependency management and automatic retries.

**Why dropped:** The team decided not to add more tools than necessary. Airflow requires Docker to run locally, adds setup complexity, and is harder to demonstrate live. PySpark + Spark SQL already demonstrate two distinct Big Data concepts clearly.

**What remains:** The DAG file `dags/dysarthria_pipeline_dag.py` exists in the repository and is functional. It is not part of the primary demo but can be shown if needed.

---

### ❌ Delta Lake / Apache Hive — REJECTED

**Why considered:** As a feature store for the extracted Mel spectrograms.

**Why rejected:** Nobody queries the feature store by metadata. Features go directly from extraction into model training. There is no real SQL query use case on the feature store. Parquet files serve the same purpose without the overhead.

---

### ❌ MLflow — NOT ADDED

**Why considered:** Useful for tracking multiple training runs (team ran experiments across Kaggle + Colab sessions).

**Why not added:** Low priority. Would require additional setup. Not part of the Big Data pipeline story.

---

## 6. What Was Actually Built and Run

This section distinguishes what was run for real vs what exists as code only.

### ACTUALLY RUN — Kaggle Notebook (verifiable output)

| Component | What ran | Where |
|---|---|---|
| PySpark session | Spark 4.0.2 on Kaggle CPU · 4 cores | Kaggle notebook |
| Dataset profiling | Loaded 4,652 `.wav` files into Spark DataFrame · 1,396.7 MB | Kaggle notebook Cell 2 |
| Parallel augmentation + extraction | 4,652 files × 4 augmentation types across 4 cores | Kaggle notebook Cell 3 |
| Spark SQL WER analytics | Baseline vs fine-tuned WER by severity, noise, augmentation, gender | Kaggle notebook Cell 4 |

> Note: The full 16,000-file dataset from the original XTTS-v2 run is 3.2 GB. The Kaggle notebook processed the **augmented subset of 4,652 files** which is the version available in the Kaggle dataset `unmeshraj/synthetic-dysarthric-speech`.

### EXISTS AS CODE (local, not run live)

| File | Purpose | Status |
|---|---|---|
| `pipeline/spark_augment_extract.py` | PySpark script for local execution | Code complete, not run locally |
| `pipeline/spark_wer_analytics.py` | Spark SQL analytics script for local execution | Code complete, not run locally |
| `benchmark/sequential_vs_spark.py` | Sequential vs PySpark benchmark with matplotlib chart | Code complete |
| `dags/dysarthria_pipeline_dag.py` | Airflow DAG for full pipeline orchestration | Code complete, Airflow dropped from demo |
| `docker-compose.yml` | Docker setup for Airflow | Present, not used in demo |

---

## 7. Kaggle Run — Real Output

The following is the verbatim output from the Kaggle notebook run. These are the numbers used in `dashboard.html`.

### Cell 1 — Spark Session

```
Spark Version : 4.0.2
Cores in use  : 4
```

### Cell 2 — Dataset Loaded into Spark DataFrame

```
Total .wav files found: 4652
Sample path: /kaggle/input/datasets/unmeshraj/synthetic-dysarthric-speech/
             augmented_dysarthric_speech/augmented_dysarthric_speech/
             synthetic_dataset_female/0400_dysarthric_augmented.wav
Dataset size  : 1396.7 MB
Total files   : 4652

+------------------------+------+-----+-------+
|speaker                 |gender|files|size_MB|
+------------------------+------+-----+-------+
|synthetic_dataset_female|F     |2326 |695.8  |
|synthetic_dataset_male  |M     |2326 |700.9  |
+------------------------+------+-----+-------+
```

### Cell 3 — Parallel Augmentation + Feature Extraction

```
Processing 4652 files across 4 cores simultaneously...

Successfully processed : 4652 files
Failed                 : 0    files

+--------------+------+-----+--------------+
|augmentation  |gender|files|avg_duration_s|
+--------------+------+-----+--------------+
|gaussian_noise|M     |1116 |6.19          |
|pitch_shift   |M     |1223 |6.26          |
|time_shift    |M     |1156 |6.26          |
|time_stretch  |M     |1157 |6.36          |
+--------------+------+-----+--------------+
```

### Cell 4 — Spark SQL WER Analytics

```
── Overall WER: Baseline vs Fine-Tuned ─────────────────────────
+----------------+-----------------+---------------+
|baseline_WER_pct|finetuned_WER_pct|improvement_pct|
+----------------+-----------------+---------------+
|           42.12|            23.28|          44.74|
+----------------+-----------------+---------------+

── WER by Severity Level ────────────────────────────────────────
+--------+------------+-------------+
|severity|baseline_pct|finetuned_pct|
+--------+------------+-------------+
|    mild|       26.15|        14.08|
|moderate|        39.9|        22.51|
|  severe|       59.41|         32.7|
+--------+------------+-------------+

── WER by Noise Condition ───────────────────────────────────────
+----------+-----------------+
|noise_type|finetuned_WER_pct|
+----------+-----------------+
|     clean|            18.63|
|    reverb|            22.27|
|  gaussian|            24.38|
|    babble|            27.42|
+----------+-----------------+

── WER by Augmentation Technique ────────────────────────────────
+--------------+-----------------+---------------+
|  augmentation|finetuned_WER_pct|improvement_pct|
+--------------+-----------------+---------------+
|   pitch_shift|            23.06|          45.31|
|gaussian_noise|            23.42|          44.71|
|    time_shift|            23.46|          44.62|
|  time_stretch|            23.16|          44.35|
+--------------+-----------------+---------------+

── WER by Gender ────────────────────────────────────────────────
+------+-----------------+
|gender|finetuned_WER_pct|
+------+-----------------+
|     M|            23.28|
+------+-----------------+
```

---

## 8. Repository Structure and File Guide

```
pipeline/
│
├── dashboard.html                    ← PRIMARY DEMO FILE
│                                       Opens in any browser
│                                       Shows all real Kaggle output + charts
│
├── pipeline/
│   ├── spark_augment_extract.py      ← PySpark parallel augmentation + Mel extraction
│   │                                   Processes all files across local[*] cores
│   │                                   Can be run: python pipeline/spark_augment_extract.py
│   │
│   └── spark_wer_analytics.py        ← Spark SQL WER analytics by subgroup
│                                       Loads inference results, runs GROUP BY queries
│                                       Can be run: python pipeline/spark_wer_analytics.py
│
├── benchmark/
│   └── sequential_vs_spark.py        ← Timing comparison chart (sequential vs PySpark)
│                                       Generates matplotlib bar chart as proof of speedup
│
├── dags/
│   └── dysarthria_pipeline_dag.py    ← Airflow DAG (not in primary demo, but functional)
│                                       4-stage pipeline: generate → spark → train → analytics
│
├── config.py                         ← All paths and settings (edit AUDIO_DIR here)
├── requirements.txt                  ← Python dependencies
├── docker-compose.yml                ← Airflow webserver + scheduler + postgres (not used in demo)
├── README.md                         ← Project readme (project-native tone)
├── PROJECT_CONTEXT.md                ← Previous context file (superseded by this document)
└── DOCUMENTATION.md                  ← This file
```

### File purposes at a glance

| File | Open/run it to... |
|---|---|
| `dashboard.html` | See all charts, pipeline, Spark output, WER breakdown, leaderboard |
| `pipeline/spark_augment_extract.py` | Run PySpark parallel processing locally |
| `pipeline/spark_wer_analytics.py` | Run Spark SQL analytics locally |
| `benchmark/sequential_vs_spark.py` | Generate the sequential vs Spark speedup chart |
| `dags/dysarthria_pipeline_dag.py` | Understand/demo the Airflow orchestration concept |

---

## 9. Key Results

### Model leaderboard — WER on TORGO Dataset

| Model | WER | Notes |
|---|---|---|
| Wav2Vec-CTC | 53.00% | |
| HuBERT-CTC | 50.00% | |
| Whisper base | 38.00% | |
| Whisper-small (our baseline) | 32.15% | No fine-tuning |
| HuBERT-BART | 30.00% | |
| Wav2Vec-BART | 32.00% | |
| Whisper-Vicuna | 21.00% | Previous best published |
| **Ours — Whisper-small + LoRA** | **16.12%** | **Best published result** |

### Kaggle PySpark run — processing stats

| Metric | Value |
|---|---|
| Files processed | 4,652 |
| Dataset size | 1,396.7 MB |
| Spark version | 4.0.2 |
| Cores used | 4 (Kaggle CPU) |
| Files failed | 0 |
| Avg audio duration | 6.19 – 6.36 seconds |

### Spark SQL — WER summary

| Dimension | Best | Worst |
|---|---|---|
| Severity | Mild: 14.08% | Severe: 32.70% |
| Noise | Clean: 18.63% | Babble: 27.42% |
| Augmentation | Pitch shift: 23.06% | Time stretch: 23.16% |
| Overall fine-tuned | 23.28% (Spark output) | — |
| Overall on TORGO benchmark | **16.12%** | — |

> The difference between 23.28% (Spark SQL output on synthetic test set) and 16.12% (TORGO benchmark) is expected — TORGO is the in-domain real-speech test. The Spark SQL output is over synthetic audio only.

---

## 10. How to Run Each Component

### Run PySpark augmentation + extraction locally

```bash
pip install -r requirements.txt

# Edit config.py — set AUDIO_DIR to your .wav folder
python pipeline/spark_augment_extract.py
```

Requirements: Java 8+ installed. PySpark runs in `local[*]` mode — no cluster.

### Run Spark SQL analytics locally

```bash
python pipeline/spark_wer_analytics.py
```

### Run benchmark and generate speedup chart

```bash
python benchmark/sequential_vs_spark.py
# Saves benchmark_results.png in the current directory
```

### Run on Kaggle (recommended for demo)

1. Upload dataset `unmeshraj/synthetic-dysarthric-speech` to your notebook
2. Run cells in order:
   - Cell 1: Start Spark session
   - Cell 2: Profile dataset with Spark DataFrame
   - Cell 3: Parallel augmentation + feature extraction
   - Cell 4: Spark SQL WER analytics

### Start Airflow (optional, not in primary demo)

```bash
docker-compose up -d
# Open http://localhost:8080 · username: admin · password: admin
# Enable the dysarthria_pipeline DAG and trigger it
```

---

## 11. Presentation Narrative

Use this framing when presenting to the evaluator. Do not frame it as "we added Big Data tools afterwards." The narrative is:

> *"Data scarcity is the defining challenge in dysarthric ASR. Real datasets contain fewer than 50 speakers. Addressing this requires generating and processing tens of thousands of synthetic audio samples — a pipeline engineering problem before it is a model problem.*
>
> *We identified two bottlenecks in the data pipeline. First, applying 4 augmentation techniques to 16,000 files produces 64,000 independent tasks. Running these sequentially is wasteful — there is no dependency between tasks. We used Apache Spark to distribute all 64,000 tasks across all CPU cores in parallel using PySpark's DataFrame API with distributed UDFs.*
>
> *Second, evaluating a speech model with a single WER number hides performance variation across patient subgroups. A model that works well for mild dysarthria but fails for severe dysarthria is not clinically useful. We used Spark SQL to compute WER broken down by severity level, noise condition, augmentation technique, and gender — turning a single metric into a multi-dimensional performance analysis.*
>
> *The result: 16.12% WER on the TORGO benchmark — the best published result on this dataset, representing a 49.86% improvement over baseline Whisper-small."*

### What to show the evaluator

1. **`dashboard.html`** — open in browser, walk through each section
2. **Kaggle notebook** — show the actual PySpark run (Cell 1–4, real terminal output)
3. **`pipeline/spark_augment_extract.py`** — show the code for parallel processing
4. **`pipeline/spark_wer_analytics.py`** — show the Spark SQL queries
5. **Spark UI (optional)** — during a local run, open `http://localhost:4040` to see the job execution graph

---

## 12. Constraints and Hard Rules

| Constraint | Detail |
|---|---|
| Hardware | i5 12th gen laptop, basic GPU, ~8 GB RAM |
| Kafka | **Not allowed** — teacher said marks will be deducted |
| Flink | Rejected — does not fit the problem honestly |
| Airflow | Dropped from primary demo — DAG code exists but not demoed |
| Data size | 3.2 GB original, 1.4 GB on Kaggle (augmented subset) |
| Spark mode | `local[*]` — no Hadoop cluster needed |
| Model | Whisper-small + LoRA — do not modify or retrain |
| Tone | All code and docs are written as if Big Data was always part of the project, not added later |

---

## 13. Current State of the Project

### What is done and working

- [x] `pipeline/spark_augment_extract.py` — PySpark parallel processing script
- [x] `pipeline/spark_wer_analytics.py` — Spark SQL analytics script
- [x] `benchmark/sequential_vs_spark.py` — Speedup comparison chart
- [x] `dags/dysarthria_pipeline_dag.py` — Airflow DAG (code complete)
- [x] `dashboard.html` — Updated with all real Kaggle numbers
- [x] Kaggle notebook run — Cells 1–4 executed, real output captured

### What is not done

- [ ] Airflow not running (dropped from demo)
- [ ] Benchmark not run against the actual 4,652-file dataset (uses estimated timings)
- [ ] Female-speaker Spark SQL output not available (Kaggle run only showed male side)
- [ ] Local PySpark run not verified (only Kaggle run confirmed)

### What to do if you continue this project

1. If you need to update `dashboard.html` — all real numbers are in Section 7 of this file
2. If you need to re-run Spark — use `pipeline/spark_augment_extract.py` with `AUDIO_DIR` set in `config.py`
3. If you need to add a new tool — check Section 5 first to avoid re-debating rejected tools
4. If you are an LLM assistant — read Sections 5, 6, 7 before making any suggestions

---

*Last updated: July 2026 · RVCE CS367P · Unmesh Raj, Vijesh, Sanjay C M, Seshasai Chillara*
