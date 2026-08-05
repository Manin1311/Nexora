@echo off
title Nexora Backend (Django) - Auto-Restart Enabled
color 0A

:START
echo.
echo ============================================================
echo   NEXORA BACKEND ^| Django Dev Server
echo   Auto-restart is ENABLED. Do NOT close this window.
echo ============================================================
echo.

for /f "tokens=5" %%a in ('netstat -aon ^| findstr /c:":8000 " ^| findstr /i "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo [%TIME%] Starting Django server on http://127.0.0.1:8000 ...
echo.

cd /d "%~dp0backend"
if exist "%~dp0backend\venv\Scripts\python.exe" (
    "%~dp0backend\venv\Scripts\python.exe" manage.py runserver 127.0.0.1:8000
) else (
    python manage.py runserver 127.0.0.1:8000
)

echo.
echo ============================================================
echo   [!] Django server stopped or crashed at %TIME%
echo   [*] Restarting in 3 seconds... (Press Ctrl+C to cancel)
echo ============================================================
timeout /t 3 /nobreak >nul

goto START
