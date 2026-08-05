@echo off
title Nexora Development Suite
echo.
echo ====================================================
echo               STARTING NEXORA SUITE
echo ====================================================
echo.

echo [1/3] Starting Django Backend (with auto-restart)...
start "Nexora Backend" cmd /k "%~dp0backend_watch.bat"

echo [2/3] Starting React Frontend...
start "Nexora Frontend" cmd /k "cd /d "%~dp0frontend" && npx vite"

echo [3/3] Waiting for Django Backend & Vite Frontend to initialize...
timeout /t 8 >nul

echo Launching web browser...
start http://localhost:5173

echo.
echo ====================================================
echo  Nexora is up and running!
echo  - Backend window: AUTO-RESTARTS on crash
echo  - Frontend window: Vite dev server
echo  Keep both windows open.
echo  You can close this window now.
echo ====================================================
timeout /t 3 >nul
exit
