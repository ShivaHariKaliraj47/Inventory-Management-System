@echo off
title InvenPro Launcher
echo ===================================================
echo   Starting InvenPro (Backend + Frontend)
echo ===================================================
echo.
echo Starting Backend (FastAPI on Port 8000)...
start "InvenPro Backend" cmd /k "python -m uvicorn main:app --reload --port 8000 --app-dir public/backend"

echo Starting Frontend (Vite on Port 5173)...
start "InvenPro Frontend" cmd /k "npm run dev"

echo.
echo Servers started successfully!
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Opening InvenPro in your browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:5173
exit
