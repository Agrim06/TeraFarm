# preprocess/features.py
import sys
import os
# Ensure project root is on sys.path so imports like `config` work when running script directly
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import pandas as pd
import numpy as np
from config import TIMESERIES_PARQUET, FEATURES_PARQUET, IRRIGATION_RATE_MM_PER_HR
from utils.logger import get_logger

logger = get_logger("features")

def build_features(infile=TIMESERIES_PARQUET, outfile=FEATURES_PARQUET, lags=(1,2,3,7), rolling=(3,7)):
    if not os.path.exists(infile):
        logger.error("Timeseries file not found: %s", infile)
        return None
    df = pd.read_parquet(infile).sort_values("timestamp").reset_index(drop=True)
    for lag in lags:
        df[f"soil_moisture_lag_{lag}"] = df["soil_moisture"].shift(lag)
        df[f"temp_lag_{lag}"] = df["temperature_C"].shift(lag)
    for w in rolling:
        df[f"soil_moisture_roll_{w}"] = df["soil_moisture"].rolling(window=w, min_periods=1).mean()
        df[f"temp_roll_{w}"] = df["temperature_C"].rolling(window=w, min_periods=1).mean()
    df["day_of_year"] = df["timestamp"].dt.dayofyear
    # target (same formula used to generate synthetic)
    setpoint = 0.30
    df["water_required_mm"] = np.clip((setpoint - df["soil_moisture"])*100 + np.maximum(0, df["temperature_C"] - 18)*1.5, 0, None)
    df["irrigation_minutes"] = (df["water_required_mm"] / IRRIGATION_RATE_MM_PER_HR) * 60
    df = df.dropna().reset_index(drop=True)
    os.makedirs(os.path.dirname(outfile), exist_ok=True)
    df.to_parquet(outfile, index=False)
    logger.info("Saved features to %s (%d rows)", outfile, len(df))
    return df

if __name__ == "__main__":
    build_features()
