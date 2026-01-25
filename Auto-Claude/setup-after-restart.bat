@echo off
SETLOCAL EnableDelayedExpansion

echo.
echo ================================================================================
echo   AUTO-CLAUDE POST-RESTART SETUP SCRIPT
echo ================================================================================
echo.
echo This script will:
echo   1. Verify build tools are installed
echo   2. Install backend dependencies (Python packages)
echo   3. Install frontend dependencies (Node packages)
echo   4. Optionally run the application
echo.
echo ================================================================================
echo.

:: Change to the Auto-Claude directory
cd /d "%~dp0"
echo [1/5] Current directory: %CD%
echo.

:: Check if CMake is available
echo [2/5] Checking for CMake...
cmake --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] CMake not found in PATH. Please restart your computer.
    echo         After restart, run this script again.
    pause
    exit /b 1
) else (
    cmake --version
    echo [OK] CMake found!
)
echo.

:: Check if Visual Studio Build Tools are available
echo [3/5] Checking for Visual Studio Build Tools...
where cl.exe >nul 2>&1
if errorlevel 1 (
    echo [WARNING] MSVC compiler not in PATH. Setting up VS environment...
    if exist "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat" (
        call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
        echo [OK] Visual Studio environment loaded!
    ) else if exist "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat" (
        call "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
        echo [OK] Visual Studio environment loaded!
    ) else (
        echo [ERROR] Could not find Visual Studio Build Tools.
        echo         Please ensure Visual Studio Build Tools 2022 is installed.
        pause
        exit /b 1
    )
) else (
    echo [OK] MSVC compiler found!
)
echo.

:: Install all dependencies
echo [4/5] Installing dependencies (this may take 5-10 minutes)...
echo.
echo Installing backend dependencies...
call npm run install:backend
if errorlevel 1 (
    echo.
    echo [ERROR] Backend installation failed!
    echo.
    echo Common fixes:
    echo   - Make sure you restarted your computer after installing build tools
    echo   - Try running this script as Administrator
    echo   - Check the error messages above for specific issues
    echo.
    pause
    exit /b 1
)
echo.
echo [OK] Backend dependencies installed!
echo.

echo Installing frontend dependencies...
call npm run install:frontend
if errorlevel 1 (
    echo.
    echo [ERROR] Frontend installation failed!
    echo         See error messages above for details.
    echo.
    pause
    exit /b 1
)
echo.
echo [OK] Frontend dependencies installed!
echo.

:: Success message
echo.
echo ================================================================================
echo   SUCCESS! AUTO-CLAUDE IS NOW INSTALLED
echo ================================================================================
echo.
echo Next steps:
echo   1. Set up environment variables (see .env.example in apps/backend/)
echo   2. Run the app with: npm run dev
echo.
echo ================================================================================
echo.

:: Ask if user wants to run the app
set /p RUN_APP="Would you like to run Auto-Claude now? (y/n): "
if /i "%RUN_APP%"=="y" (
    echo.
    echo Starting Auto-Claude in development mode...
    echo Press Ctrl+C to stop the application.
    echo.
    call npm run dev
) else (
    echo.
    echo To run Auto-Claude later, use: npm run dev
    echo.
)

pause
