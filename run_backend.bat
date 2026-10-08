@echo off
echo Starting HealthTriage AI Backend...
cd /d "%~dp0"
call .\venv\Scripts\activate
python api.py
pause
