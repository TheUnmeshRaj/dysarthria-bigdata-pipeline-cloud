# Dysarthric ASR — Big Data Pipeline

Big Data pipeline layer for the **Automated Speech Recognition for Dysarthria** project.  
Wraps the existing Whisper-LoRA model with Kafka streaming ingestion and PySpark parallel processing.

---

## What this adds to the existing project

| Component | Tool | What it solves |
|---|---|---|
| Audio stream ingestion | Apache Kafka | Files stream into processing the moment they are ready — no waiting for all 16,000 files to finish |
| Parallel feature extraction | PySpark `local[*]` | All CPU cores process audio files simultaneously instead of one by one |
| Real-time stream processing | Spark Structured Streaming | Simulates live clinical deployment — audio arrives continuously |
| Multi-dimensional analytics | Spark SQL | WER broken down by severity, gender, noise type, augmentation |

---

## Project structure

```
dysarthria-bigdata-pipeline/
├── docker-compose.yml              # Kafka + Zookeeper + Kafka UI
├── requirements.txt
├── config.py                       # All paths and settings in one place
│
├── 1_kafka_producer.py             # Streams .wav files into Kafka topic
├── 2_spark_feature_extraction.py   # PySpark parallel Mel spectrogram extraction
├── 3_spark_streaming_consumer.py   # Spark Structured Streaming from Kafka
├── 4_spark_wer_analytics.py        # Spark SQL WER analytics by subgroup
│
└── data/
    ├── audio/                      ← put your .wav files here
    ├── features/                   ← Parquet output from script 2
    └── results/                    ← inference results CSV + analytics Parquet
```

---

## Setup

### 1. Install Python dependencies
```bash
pip install -r requirements.txt
```

### 2. Start Kafka with Docker
```bash
docker-compose up -d
```

Kafka UI is available at **http://localhost:8080** — you can watch messages flowing in real time.

### 3. Point to your audio data
Edit `config.py` and set `AUDIO_DIR` to the folder containing your generated `.wav` files from XTTS-v2.

---

## Running the pipeline

### Step 1 — Stream audio files into Kafka
```bash
python 1_kafka_producer.py
```
Reads every `.wav` file in `AUDIO_DIR` and publishes it to the `dysarthric-audio-stream` Kafka topic.

### Step 2 — Parallel feature extraction (batch)
```bash
python 2_spark_feature_extraction.py
```
PySpark reads all audio files in parallel across all CPU cores, extracts log-Mel spectrograms, and saves to `data/features/mel_features.parquet`.

### Step 3 — Live streaming consumer (demo)
Open a second terminal. Start the producer in terminal 1, run this in terminal 2:
```bash
python 3_spark_streaming_consumer.py
```
Spark reads from Kafka in real time and prints each incoming file as it arrives — simulating a live clinical deployment.

### Step 4 — WER analytics
```bash
python 4_spark_wer_analytics.py
```
Runs Spark SQL queries on inference results and prints WER broken down by severity, gender, noise type, and augmentation technique.

---

## Architecture

```
XTTS-v2 generated .wav files (3.2 GB, 16,000 files)
              │
              ▼
    ┌─────────────────────┐
    │   Kafka Producer    │  ← streams each file as a message
    │  (1_kafka_producer) │
    └──────────┬──────────┘
               │  topic: dysarthric-audio-stream
    ┌──────────▼──────────────────────────────────┐
    │              PySpark local[*]               │
    │  ┌──────────────────────────────────────┐   │
    │  │  Batch: Parallel Mel extraction      │   │  ← script 2
    │  │  (all CPU cores simultaneously)      │   │
    │  └─────────────────┬────────────────────┘   │
    │                    │ Parquet                 │
    │  ┌─────────────────▼────────────────────┐   │
    │  │  Streaming: Spark Structured Stream  │   │  ← script 3
    │  │  (processes Kafka topic live)        │   │
    │  └─────────────────┬────────────────────┘   │
    │                    │ results                 │
    │  ┌─────────────────▼────────────────────┐   │
    │  │  Spark SQL WER Analytics             │   │  ← script 4
    │  │  GROUP BY severity/gender/noise      │   │
    │  └──────────────────────────────────────┘   │
    └─────────────────────────────────────────────┘
```

---

## Results (from existing Whisper-LoRA model)

| Model | WER |
|---|---|
| Baseline Whisper-small | 32.15% |
| Fine-tuned Whisper-small (LoRA) | **16.12%** |
| Improvement | **49.86%** |

Outperforms all published baselines on TORGO including Whisper-Vicuna (21%).

---

## Tech stack

| Layer | Tool |
|---|---|
| Streaming ingestion | Apache Kafka 7.4 |
| Distributed processing | Apache Spark 3.5 / PySpark |
| Real-time streaming | Spark Structured Streaming |
| Analytics | Spark SQL |
| Storage | Parquet (columnar) |
| Infra | Docker Compose (single machine) |
| ASR model | OpenAI Whisper-small + LoRA |
| Post-processing | LLM semantic correction + Knowledge Graph |
