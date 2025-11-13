# preprocess/preprocessing.py
import sys
import os
# Ensure project root is on sys.path so imports like `config` work when running script directly
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import pandas as pd
from config import INPUT_CSV, TIMESERIES_PARQUET, RESAMPLE_FREQ
from utils.logger import get_logger

logger = get_logger("preprocessing")

def load_csv():
    if not os.path.exists(INPUT_CSV):
        logger.error("Input CSV not found: %s", INPUT_CSV)
        return None
    df = pd.read_csv(INPUT_CSV, parse_dates=["date"])
    # ensure consistent column names
    if "soil_moisture" not in df.columns or "temperature_C" not in df.columns:
        logger.error("CSV missing required columns: soil_moisture, temperature_C")
        return None
    df = df.rename(columns={"date": "timestamp"})
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    return df

def resample_and_clean(df, freq=RESAMPLE_FREQ):
    df = df.set_index("timestamp").sort_index()
    # If already daily and freq == '1D', this will preserve. Otherwise resample.
    df = df.resample(freq).mean()
    df = df.ffill(limit=2).bfill(limit=1)
    df = df.reset_index()
    os.makedirs(os.path.dirname(TIMESERIES_PARQUET), exist_ok=True)
    df.to_parquet(TIMESERIES_PARQUET, index=False)
    logger.info("Saved timeseries to %s (%d rows)", TIMESERIES_PARQUET, len(df))
    return df

if __name__ == "__main__":
    df = load_csv()
    if df is not None:
        resample_and_clean(df)
