# models/train.py
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
from models.save_load import save_model
from utils.logger import get_logger
from config import FEATURES_PARQUET
import os

logger = get_logger("train")

def train_models(features_file=FEATURES_PARQUET):
    if not os.path.exists(features_file):
        logger.error("Features file not found: %s", features_file)
        return
    df = pd.read_parquet(features_file)
    exclude = ["timestamp", "water_required_mm", "irrigation_minutes"]
    X = df[[c for c in df.columns if c not in exclude]]
    y_amount = df["water_required_mm"]
    y_minutes = df["irrigation_minutes"]

    split = int(len(df) * 0.8)
    X_train, X_test = X.iloc[:split], X.iloc[split:]
    y_train_a, y_test_a = y_amount.iloc[:split], y_amount.iloc[split:]
    y_train_m, y_test_m = y_minutes.iloc[:split], y_minutes.iloc[split:]

    model_amount = RandomForestRegressor(n_estimators=200, random_state=42, n_jobs=-1)
    model_amount.fit(X_train, y_train_a)
    pred_a = model_amount.predict(X_test)
    logger.info("Amount MAE: %.3f mm", mean_absolute_error(y_test_a, pred_a))
    save_model(model_amount, "rf_amount.joblib")
    logger.info("Saved amount model")

    model_time = RandomForestRegressor(n_estimators=200, random_state=42, n_jobs=-1)
    model_time.fit(X_train, y_train_m)
    pred_m = model_time.predict(X_test)
    logger.info("Time MAE: %.2f minutes", mean_absolute_error(y_test_m, pred_m))
    save_model(model_time, "rf_time.joblib")
    logger.info("Saved time model")

if __name__ == "__main__":
    train_models()
