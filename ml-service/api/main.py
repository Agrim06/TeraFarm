# api/main.py
from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
from models.save_load import load_model
from utils.logger import get_logger
from config import IRRIGATION_RATE_MM_PER_HR
import numpy as np

logger = get_logger("api")
app = FastAPI(title="Local Irrigation Predictor")

model_amount = None
model_time = None

@app.on_event("startup")
def startup():
    global model_amount, model_time
    model_amount = load_model("rf_amount.joblib")
    model_time = load_model("rf_time.joblib")
    logger.info("Models loaded into API")

class InputPayload(BaseModel):
    timestamp: str
    soil_moisture: float
    temperature_C: float
    # optional: lags
    soil_moisture_lag_1: float = None
    temp_lag_1: float = None

@app.post("/predict")
def predict(payload: InputPayload):
    features = {
        "soil_moisture": payload.soil_moisture,
        "temperature_C": payload.temperature_C,
    }
    features["soil_moisture_lag_1"] = payload.soil_moisture_lag_1 if payload.soil_moisture_lag_1 is not None else payload.soil_moisture
    features["temp_lag_1"] = payload.temp_lag_1 if payload.temp_lag_1 is not None else payload.temperature_C

    df = pd.DataFrame([features])
    model_features = getattr(model_amount, "feature_names_in_", None)
    if model_features is not None:
        for c in model_features:
            if c not in df.columns:
                df[c] = 0.0
        df = df[model_features]

    pred_mm = float(model_amount.predict(df)[0])
    pred_min = float(model_time.predict(df)[0])

    return {
        "predicted_water_mm": pred_mm,
        "predicted_irrigation_minutes": pred_min,
        "assumed_irrigation_rate_mm_per_hr": IRRIGATION_RATE_MM_PER_HR
    }
