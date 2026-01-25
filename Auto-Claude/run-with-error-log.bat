@echo off
SETLOCAL EnableDelayedExpansion

echo.
echo ================================================================================
echo   RUNNING AUTO-CLAUDE WITH ERROR LOGGING
echo ================================================================================
echo.

cd /d "%~dp0"

echo Starting Auto-Claude and capturing all output...
echo This window will stay open to show errors.
echo.
echo Press Ctrl+C to stop the app.
echo.
echo ================================================================================
echo.

:: Run with output capture and keep window open
npm run dev 2>&1 | tee run-error-log.txt

echo.
echo ================================================================================
echo   APP STOPPED
echo ================================================================================
echo.
echo Error log saved to: run-error-log.txt
echo.

pause

:: Open the log file
notepad run-error-log.txt
