import os

# ── Data paths ────────────────────────────────────────────────
# Set AUDIO_DIR to the folder containing your generated .wav files
AUDIO_DIR    = os.path.join("data", "audio")
FEATURES_DIR = os.path.join("data", "features")
RESULTS_DIR  = os.path.join("data", "results")

# ── Audio settings (must match Whisper's expectations) ────────
SAMPLE_RATE = 16000
N_MELS      = 80
HOP_LENGTH  = 160
N_FFT       = 400

# ── Spark ─────────────────────────────────────────────────────
SPARK_APP_NAME = "DysarthriaASR"
SPARK_MASTER   = "local[*]"   # uses all CPU cores on the machine
