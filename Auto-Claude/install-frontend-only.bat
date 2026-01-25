@echo off
SETLOCAL EnableDelayedExpansion

echo.
echo ================================================================================
echo   INSTALLING FRONTEND DEPENDENCIES ONLY
echo ================================================================================
echo.

cd /d "%~dp0"

echo Installing frontend dependencies...
echo This may take 5-10 minutes. Please be patient...
echo.

cd apps\frontend
npm install

if errorlevel 1 (
    echo.
    echo [ERROR] Frontend installation failed!
    echo.
    echo Detailed error log has been saved.
    echo.
    pause
    exit /b 1
) else (
    echo.
    echo ================================================================================
    echo [SUCCESS] Frontend dependencies installed!
    echo ================================================================================
    echo.
    echo Backend was already installed (without real_ladybug).
    echo.
    echo You can now run the application with: npm run dev
    echo.
    pause
)
