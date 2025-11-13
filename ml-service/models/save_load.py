# models/save_load.py
import joblib
import os
from config import MODEL_DIR

def save_model(model, name="rf_amount.joblib"):
    os.makedirs(MODEL_DIR, exist_ok=True)
    path = os.path.join(MODEL_DIR, name)
    joblib.dump(model, path)
    return path

def load_model(name="rf_amount.joblib"):
    path = os.path.join(MODEL_DIR, name)
    if not os.path.exists(path):
        raise FileNotFoundError(f"Model not found: {path}")
    return joblib.load(path)
