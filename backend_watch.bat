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
echo [%TIME%] Starting Django server on http://localhost:8000 ...
echo.

cd /d "%~dp0backend"
python manage.py runserver

echo.
echo ============================================================
echo   [!] Django server stopped or crashed at %TIME%
echo   [*] Restarting in 3 seconds... (Press Ctrl+C to cancel)
echo ============================================================
timeout /t 3 /nobreak >nul

goto START
