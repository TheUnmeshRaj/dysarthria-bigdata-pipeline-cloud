# Automated Speech Recognition for Dysarthria
### A Big Data Pipeline for Accessible Speech Technology

> **RV College of Engineering® · 

---

## Overview

Dysarthria is a motor speech disorder affecting millions globally. State-of-the-art ASR systems like OpenAI Whisper achieve sub-10% Word Error Rate on normal speech but degrade to 60–70% WER on dysarthric speech — making them practically unusable for this population.

The core challenge is not just the model. It is the **data pipeline**. Real dysarthric speech datasets contain fewer than 50 speakers worldwide. Building a robust model requires generating, augmenting, and processing tens of thousands of synthetic audio samples — a Big Data engineering problem before it is a machine learning problem.

This project addresses both layers: a distributed data pipeline built on Apache Spark and Apache Airflow, and a fine-tuned Whisper-LoRA model trained on the pipeline's output.

**Result: 16.12% WER on TORGO — the best published result on this benchmark.**

---

## Why Big Data

| Problem | Scale | Tool |
|---|---|---|
| Augmentation + feature extraction runs sequentially | 64,000 tasks (16K files × 4 techniques) — hours on one thread | **Apache Spark (PySpark)** |
| No pipeline orchestration — manual stage-by-stage execution | 4 dependent stages, 14+ hrs of GPU training across sessions | **Apache Airflow** |
| Evaluation produces a single WER number, hiding subgroup variation | Thousands of inference results across severity/gender/noise dimensions | **Spark SQL** |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Apache Airflow DAG                     │
│  dysarthria_pipeline                                    │
│                                                         │
│  [generate_audio] → [spark_process] → [train_whisper]  │
│                              ↓                          │
│                    [spark_sql_analytics]                │
└─────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
   XTTS-v2 TTS         PySpark local[*]       Spark SQL
   16,000 .wav         Parallel augment    WER by severity
   files · 3.2 GB      + Mel extraction    gender · noise
                       → Parquet store     augmentation
```

---

## Repository Structure

```
dysarthria-bigdata-pipeline/
│
├── dags/
│   └── dysarthria_pipeline_dag.py   # Airflow DAG — orchestrates all 4 stages
│
├── pipeline/
│   ├── spark_augment_extract.py     # PySpark parallel augmentation + Mel extraction
│   └── spark_wer_analytics.py       # Spark SQL multi-dimensional WER analysis
│
├── benchmark/
│   └── sequential_vs_spark.py       # Timing comparison: sequential loop vs PySpark
│
├── config.py                        # All paths and settings
├── requirements.txt
├── docker-compose.yml               # Airflow (webserver + scheduler + postgres)
└── README.md
```

---

## Setup

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Start Airflow
```bash
docker-compose up -d
```
Airflow UI → **http://localhost:8080** · username: `admin` · password: `admin`

### 3. Point to your audio data
Edit `config.py` — set `AUDIO_DIR` to your folder of generated `.wav` files.

---

## Running

### Option A — Via Airflow (recommended)
Open **http://localhost:8080**, enable the `dysarthria_pipeline` DAG, trigger it.  
Watch each stage complete in the DAG graph view.

### Option B — Individual scripts
```bash
# Parallel feature extraction
python pipeline/spark_augment_extract.py

# WER analytics
python pipeline/spark_wer_analytics.py

# Benchmark: sequential vs Spark
python benchmark/sequential_vs_spark.py
```

---

## Results

| Model | WER on TORGO |
|---|---|
| Wav2Vec-CTC | 53.00% |
| HuBERT-CTC | 50.00% |
| Whisper (baseline) | 38.00% |
| Whisper-small (our baseline) | 32.15% |
| Whisper-Vicuna (prior best) | 21.00% |
| **Ours — Whisper-small + LoRA** | **16.12%** |

**49.86% improvement over baseline. 23.24% improvement over prior best.**

---

## Big Data Tools

### Apache Spark (PySpark)
Processes augmentation and Mel spectrogram extraction across all 16,000 audio files in parallel using `local[*]` mode — all CPU cores simultaneously. Replaces a sequential Python loop that would otherwise process 64,000 tasks one at a time.

### Apache Airflow
Orchestrates the 4-stage pipeline as a DAG with dependency management, automatic retries on failure, per-task logging, and a visual execution graph. Eliminates manual stage-by-stage execution across long multi-session training runs.

### Spark SQL
Computes Word Error Rate broken down across severity level, gender, noise condition, and augmentation technique — turning a single aggregate metric into a multi-dimensional performance analysis across thousands of inference results.

---

## Dataset

- **TORGO Dataset** — real dysarthric speech, ~15 speakers
- **Synthetic dataset** — 16,000 `.wav` files generated via XTTS-v2, 3.2 GB
- Available on Kaggle: [TORGO Database](https://www.kaggle.com/datasets/shreyasonawane/torgo-database)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Distributed processing | Apache Spark 3.5 / PySpark |
| Pipeline orchestration | Apache Airflow 2.8 |
| Analytics | Spark SQL |
| Feature storage | Apache Parquet |
| ASR model | OpenAI Whisper-small |
| Model adaptation | LoRA (PEFT) — 3.6% of parameters |
| Synthetic data | XTTS-v2 (Coqui TTS) |
| Augmentation | nlpaug · Librosa |
| Post-processing | LLM semantic correction + Knowledge Graph |
| Training | PyTorch · HuggingFace Transformers |
