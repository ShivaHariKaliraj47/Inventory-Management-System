@echo off
title InvenPro Launcher
echo ===================================================
echo   Starting InvenPro (Backend + Frontend)
echo ===================================================
echo.
start "InvenPro Backend" cmd /k "python -m uvicorn main:app --reload --port 8000 --app-dir public/backend"
start "InvenPro Frontend" cmd /k "npm run dev"
echo Servers started successfully!
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173

