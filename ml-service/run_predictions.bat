@echo off

REM ---- CONFIG ----
SET MODEL_PATH=models\soil_moisture_pump_model.pkl
SET CSV_PATH=data\crop_irrigation.csv
SET CROP=Potato- Drip Irrigation
SET IRRIGATION_RATE=8.0
SET MONGO_URI=mongodb://127.0.0.1:27017

REM Optional device ID (passed as first argument)
SET DEVICE_ID=%~1

REM Script directory of this BAT file
SET SCRIPT_DIR=%~dp0
REM -----------------

echo Starting Water Prediction Service...
echo Prediction interval is controlled INSIDE Python (no loop in BAT).
echo Press Ctrl+C to stop the service.
echo.

IF "%DEVICE_ID%"=="" (
    python "%SCRIPT_DIR%src\prediction_service.py" ^
        --model "%MODEL_PATH%" ^
        --csv "%CSV_PATH%" ^
        --crop "%CROP%" ^
        --mongo-uri "%MONGO_URI%" ^
        --irrigation-rate %IRRIGATION_RATE% ^
        --script-dir "%SCRIPT_DIR%"
) ELSE (
    python "%SCRIPT_DIR%src\prediction_service.py" ^
        --model "%MODEL_PATH%" ^
        --csv "%CSV_PATH%" ^
        --crop "%CROP%" ^
        --device-id "%DEVICE_ID%" ^
        --mongo-uri "%MONGO_URI%" ^
        --irrigation-rate %IRRIGATION_RATE% ^
        --script-dir "%SCRIPT_DIR%"
)

pause
