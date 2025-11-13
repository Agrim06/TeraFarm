@echo off
echo Training models...
setlocal
set PYTHONPATH=%CD%

REM Run as a module so relative imports / package imports work
python -m models.train

endlocal
echo Training completed.
pause
