@echo off
SETLOCAL EnableDelayedExpansion

echo.
echo ================================================================================
echo   RUNNING AUTO-CLAUDE IN DEBUG MODE
echo ================================================================================
echo.

cd /d "%~dp0"

echo Starting Auto-Claude with detailed logging...
echo.

:: Set debug environment variables
set DEBUG=*
set ELECTRON_ENABLE_LOGGING=1

:: Run in dev mode
call npm run dev

echo.
echo ================================================================================
echo   APP CLOSED
echo ================================================================================
echo.
echo If you saw errors above, please copy them and share with me.
echo.
echo Press any key to close this window...
pause >nul
