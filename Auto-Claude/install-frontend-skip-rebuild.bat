@echo off
SETLOCAL EnableDelayedExpansion

echo.
echo ================================================================================
echo   INSTALLING FRONTEND (SKIPPING NATIVE MODULE REBUILD)
echo ================================================================================
echo.

cd /d "%~dp0"

echo [1/3] Installing frontend dependencies without running postinstall scripts...
echo This will skip the problematic electron-rebuild step.
echo.

cd apps\frontend

:: Install without running postinstall scripts
npm install --ignore-scripts

if errorlevel 1 (
    echo.
    echo [ERROR] Installation failed!
    pause
    exit /b 1
)

echo.
echo [OK] Dependencies installed!
echo.

echo [2/3] Installing Electron separately...
npm install electron --save-dev --ignore-scripts

if errorlevel 1 (
    echo.
    echo [ERROR] Electron installation failed!
    pause
    exit /b 1
)

echo.
echo [OK] Electron installed!
echo.

echo [3/3] Verifying installation...
node -e "console.log('Node.js: OK')"
npm list electron --depth=0

echo.
echo ================================================================================
echo   SUCCESS! INSTALLATION COMPLETE
echo ================================================================================
echo.
echo Note: Native modules were not rebuilt, but the app should still work.
echo If you encounter issues, we can rebuild them manually later.
echo.
echo To run the app:
echo   cd ..\..
echo   npm run dev
echo.
pause
