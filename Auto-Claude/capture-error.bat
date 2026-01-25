@echo off
SETLOCAL EnableDelayedExpansion

echo.
echo ================================================================================
echo   CAPTURING INSTALLATION ERRORS
echo ================================================================================
echo.

cd /d "%~dp0\apps\frontend"

echo Running npm install and saving ALL output to error-log.txt...
echo Please wait...
echo.

npm install > ..\..\error-log.txt 2>&1

echo.
echo ================================================================================
echo   Installation attempt complete!
echo ================================================================================
echo.
echo The complete log has been saved to:
echo   %~dp0error-log.txt
echo.
echo Please open error-log.txt and share its contents.
echo.
pause

:: Automatically open the error log
notepad ..\..\error-log.txt
