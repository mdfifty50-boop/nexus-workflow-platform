@echo off
SETLOCAL EnableDelayedExpansion

echo.
echo ================================================================================
echo   REAL_LADYBUG INSTALLATION FIX
echo ================================================================================
echo.

cd /d "%~dp0"

:: Load Visual Studio environment first
echo [1/4] Loading Visual Studio Build Tools environment...
if exist "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat" (
    call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
    echo [OK] VS Environment loaded
) else if exist "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat" (
    call "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
    echo [OK] VS Environment loaded
) else (
    echo [ERROR] Could not find Visual Studio Build Tools
    pause
    exit /b 1
)
echo.

:: Verify compiler is available
echo [2/4] Checking for MSVC compiler...
where cl.exe >nul 2>&1
if errorlevel 1 (
    echo [ERROR] MSVC compiler not found even after loading VS environment
    echo.
    echo Please install Visual Studio Build Tools with these components:
    echo   - Desktop development with C++
    echo   - Windows 10/11 SDK
    echo   - MSVC v143 build tools
    echo.
    pause
    exit /b 1
) else (
    cl.exe 2>&1 | findstr /C:"Compiler Version"
    echo [OK] MSVC compiler found
)
echo.

:: Check CMake
echo [3/4] Checking for CMake...
cmake --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] CMake not found
    echo Please add CMake to your PATH or restart your computer
    pause
    exit /b 1
) else (
    cmake --version | findstr /C:"cmake version"
    echo [OK] CMake found
)
echo.

:: Try to install real_ladybug with verbose output
echo [4/4] Attempting to install real_ladybug with verbose output...
echo This may take a few minutes...
echo.

cd apps\backend

:: Activate virtual environment and install with verbose output
call .venv\Scripts\activate.bat
echo Virtual environment activated
echo.

echo Installing real_ladybug with verbose logging...
pip install --no-cache-dir --verbose real_ladybug>=0.13.0 2>&1 | tee ladybug-install-log.txt

if errorlevel 1 (
    echo.
    echo ================================================================================
    echo [ERROR] Installation failed. Log saved to: apps\backend\ladybug-install-log.txt
    echo ================================================================================
    echo.
    echo Please check the log file for detailed error messages.
    echo.
    echo ALTERNATIVE SOLUTION:
    echo The real_ladybug package is optional for some features.
    echo You may be able to skip it and install remaining dependencies manually.
    echo.
    pause
    exit /b 1
) else (
    echo.
    echo [SUCCESS] real_ladybug installed!
    echo.
    echo Now installing remaining dependencies...
    pip install -r requirements.txt
    echo.
    echo [SUCCESS] All dependencies installed!
    pause
)
