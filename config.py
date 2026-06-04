import os

# Kafka settings
KAFKA_BOOTSTRAP_SERVERS = "localhost:9092"
KAFKA_TOPIC_AUDIO      = "dysarthric-audio-stream"
KAFKA_TOPIC_RESULTS    = "transcription-results"

# Data directories — point AUDIO_DIR to your folder of .wav files
AUDIO_DIR    = os.path.join("data", "audio")
FEATURES_DIR = os.path.join("data", "features")
RESULTS_DIR  = os.path.join("data", "results")

# Audio settings (must match what Whisper expects)
SAMPLE_RATE = 16000
N_MELS      = 80
HOP_LENGTH  = 160
N_FFT       = 400

# Spark settings
SPARK_APP_NAME = "DysarthriaASR-BigData"
SPARK_MASTER   = "local[*]"          # uses all CPU cores on your machine
