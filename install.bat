@echo off
title Nexora Setup Wizard
color 0B
cls

echo ====================================================
echo         NEXORA SYSTEM DEPENDENCY SETUP WIZARD
echo ====================================================
echo.
echo Checking environment, installing python packages,
echo running migrations, and downloading node modules.
echo.

echo ----------------------------------------------------
echo [STEP 1/4] Checking system requirements...
echo ----------------------------------------------------

REM Check Python
python --version >nul 2>&1
if %errorlevel% equ 0 goto :python_ok
color 0C
echo ERROR: Python is not installed or not in your system PATH.
echo Please install Python 3.10+ and check "Add Python to PATH" during setup.
echo Website: https://www.python.org/
echo.
pause
exit /b

:python_ok
echo Python found:
python --version
echo.

REM Check Node.js and NPM
call npm -v >nul 2>&1
if %errorlevel% equ 0 goto :npm_ok
color 0C
echo ERROR: Node.js / NPM is not installed or not in your system PATH.
echo Please install Node.js (LTS version recommended).
echo Website: https://nodejs.org/
echo.
pause
exit /b

:npm_ok
echo NPM found:
call npm -v
echo.

echo ----------------------------------------------------
echo [STEP 2/4] Installing Django Backend Requirements...
echo ----------------------------------------------------
echo Installing python packages from requirements.txt...
cd backend
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
if %errorlevel% equ 0 goto :pip_ok
color 0C
echo ERROR: Failed to install python packages. Please check internet connection.
cd ..
pause
exit /b

:pip_ok
echo Backend dependencies installed successfully!
echo.

echo ----------------------------------------------------
echo [STEP 3/4] Running Database Migrations...
echo ----------------------------------------------------
echo Preparing database models and creating missing tables...
python manage.py makemigrations
python manage.py migrate
if %errorlevel% equ 0 goto :migrate_ok
color 0C
echo ERROR: Django migration failed. Check database configurations.
cd ..
pause
exit /b

:migrate_ok
echo Database is up-to-date!
cd ..
echo.

echo ----------------------------------------------------
echo [STEP 4/4] Installing React Frontend Dependencies...
echo ----------------------------------------------------
echo Installing npm packages for Vite/React (this may take a minute)...
cd frontend
call npm install
if %errorlevel% equ 0 goto :npm_install_ok
color 0C
echo ERROR: Failed to install node modules. Please check connection.
cd ..
pause
exit /b

:npm_install_ok
cd ..
echo Frontend dependencies installed successfully!
echo.

color 0A
echo ====================================================
echo          SETUP COMPLETED SUCCESSFULLY!
echo ====================================================
echo.
echo All backend packages, migrations, and node modules are ready.
echo.
echo Next step:
echo Double-click 'run.bat' in the project folder to start Nexora!
echo.
echo Window will close in 5 seconds...
ping 127.0.0.1 -n 6 >nul
exit
