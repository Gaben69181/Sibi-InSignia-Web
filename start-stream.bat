@echo off
cd /d "%~dp0model"
echo Starting SIBI Detection Streaming Server...
echo.
python stream_server.py

