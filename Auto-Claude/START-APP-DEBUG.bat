@echo off
SETLOCAL EnableDelayedExpansion

echo.
echo ================================================================================
echo   AUTO-CLAUDE STARTUP WITH DEBUG LOGGING
echo ================================================================================
echo.

cd /d "%~dp0"

echo [1/4] Checking environment...
echo.

:: Check if .env exists
if exist "apps\backend\.env" (
    echo [OK] .env file exists
) else (
    echo [WARNING] .env file missing - creating minimal config...
    echo DEBUG=true > apps\backend\.env
    echo DEBUG_LEVEL=2 >> apps\backend\.env
    echo [OK] Created minimal .env file
)
echo.

echo [2/4] Checking Node.js and npm...
node --version
npm --version
echo.

echo [3/4] Checking if frontend is built...
if exist "apps\frontend\out" (
    echo [OK] Frontend build exists
) else (
    echo [INFO] No build found - will use dev mode
)
echo.

echo [4/4] Starting Auto-Claude...
echo.
echo THIS WINDOW WILL STAY OPEN - DO NOT CLOSE IT
echo.
echo If the app crashes, you'll see the error here.
echo Press Ctrl+C to stop the app.
echo.
echo ================================================================================
echo   APP OUTPUT:
echo ================================================================================
echo.

:: Keep window open and show all output
cmd /k npm run dev
