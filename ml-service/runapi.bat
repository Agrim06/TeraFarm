@echo off
echo Starting FastAPI server...
setlocal
set PYTHONPATH=%CD%

uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload

endlocal
pause
