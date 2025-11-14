@echo off
REM Run water prediction with sensor data from MongoDB
REM This uses water_predict.py which combines prediction + crop irrigation calculation
REM
REM Usage:
REM   predict.bat                          - Fetch from any device, use default crop
REM   predict.bat device_01                - Fetch from specific device
REM   predict.bat device_01 "Wheat- Drip Irrigation"  - Specify device and crop
REM   predict.bat device_01 "Wheat- Drip Irrigation" mongodb://custom:27017  - Custom MongoDB URI

REM ---- EDIT THESE IF NEEDED ----
SET MODEL_PATH=models\soil_moisture_pump_model.pkl
SET CSV_PATH=data\crop_irrigation.csv
SET CROP=Potato- Drip Irrigation
SET IRRIGATION_RATE=8.0
SET SCRIPT_DIR=%~dp0
SET MONGO_URI=mongodb://127.0.0.1:27017
REM --------------------------------

REM Optional: device-id as first argument
SET DEVICE_ID=%~1
REM Optional: crop as second argument
IF NOT "%~2"=="" SET CROP=%~2
REM Optional: mongo-uri as third argument
IF NOT "%~3"=="" SET MONGO_URI=%~3

echo Fetching latest sensor data from MongoDB...
echo Using crop: %CROP%
echo.

IF "%~1"=="" (
    REM No device-id specified, fetch latest from any device
    python "%SCRIPT_DIR%src\water_predict.py" ^
        --model "%SCRIPT_DIR%%MODEL_PATH%" ^
        --csv "%SCRIPT_DIR%%CSV_PATH%" ^
        --crop "%CROP%" ^
        --from-db ^
        --mongo-uri "%MONGO_URI%" ^
        --irrigation-rate %IRRIGATION_RATE%
) ELSE (
    REM Device-id specified, fetch latest from specific device
    python "%SCRIPT_DIR%src\water_predict.py" ^
        --model "%SCRIPT_DIR%%MODEL_PATH%" ^
        --csv "%SCRIPT_DIR%%CSV_PATH%" ^
        --crop "%CROP%" ^
        --from-db ^
        --device-id "%DEVICE_ID%" ^
        --mongo-uri "%MONGO_URI%" ^
        --irrigation-rate %IRRIGATION_RATE%
)

pause
