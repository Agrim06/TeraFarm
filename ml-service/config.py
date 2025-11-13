# config.py
import os
from dotenv import load_dotenv
load_dotenv()

DATA_DIR = os.getenv("DATA_DIR", "data")
os.makedirs(DATA_DIR, exist_ok=True)

MODEL_DIR = os.getenv("MODEL_DIR", "models/models")
os.makedirs(MODEL_DIR, exist_ok=True)

INPUT_CSV = os.path.join(DATA_DIR, "potato_water_requirement.csv")
TIMESERIES_PARQUET = os.path.join(DATA_DIR, "timeseries_clean.parquet")
FEATURES_PARQUET = os.path.join(DATA_DIR, "features_train.parquet")

RESAMPLE_FREQ = os.getenv("RESAMPLE_FREQ", "1D")   # '1H' or '15T' also possible
IRRIGATION_RATE_MM_PER_HR = float(os.getenv("IRRIGATION_RATE_MM_PER_HR", "8"))
