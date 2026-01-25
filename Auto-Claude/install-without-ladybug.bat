@echo off
SETLOCAL EnableDelayedExpansion

echo.
echo ================================================================================
echo   AUTO-CLAUDE INSTALLATION (WITHOUT REAL_LADYBUG)
echo ================================================================================
echo.
echo This script will install Auto-Claude WITHOUT the real_ladybug package.
echo.
echo Note: This means some memory/graph database features may not work,
echo       but the core application should still function.
echo.
echo ================================================================================
echo.

cd /d "%~dp0"

pause
echo.

:: Create modified requirements file
echo [1/5] Creating modified requirements.txt without real_ladybug...
cd apps\backend

:: Backup original requirements
if not exist requirements.txt.backup (
    copy requirements.txt requirements.txt.backup >nul
    echo [OK] Backed up original requirements.txt
)

:: Create new requirements without real_ladybug
echo # Auto-Build Framework Dependencies > requirements-no-ladybug.txt
echo claude-agent-sdk^>=0.1.16 >> requirements-no-ladybug.txt
echo python-dotenv^>=1.0.0 >> requirements-no-ladybug.txt
echo. >> requirements-no-ladybug.txt
echo # Memory Integration - graphiti only (no real_ladybug) >> requirements-no-ladybug.txt
echo graphiti-core^>=0.5.0; python_version ^>= "3.12" >> requirements-no-ladybug.txt
echo. >> requirements-no-ladybug.txt
echo # Google AI (optional - for Gemini LLM and embeddings) >> requirements-no-ladybug.txt
echo google-generativeai^>=0.8.0 >> requirements-no-ladybug.txt
echo. >> requirements-no-ladybug.txt
echo # Pydantic for structured output schemas >> requirements-no-ladybug.txt
echo pydantic^>=2.0.0 >> requirements-no-ladybug.txt

echo [OK] Created requirements-no-ladybug.txt
echo.

:: Install dependencies
echo [2/5] Installing Python dependencies (without real_ladybug)...
call .venv\Scripts\activate.bat
pip install -r requirements-no-ladybug.txt

if errorlevel 1 (
    echo [ERROR] Installation failed!
    pause
    exit /b 1
)

echo [OK] Backend dependencies installed!
echo.

cd ..\..

:: Install frontend
echo [3/5] Installing frontend dependencies...
call npm run install:frontend

if errorlevel 1 (
    echo [ERROR] Frontend installation failed!
    pause
    exit /b 1
)

echo [OK] Frontend dependencies installed!
echo.

echo.
echo ================================================================================
echo   SUCCESS! AUTO-CLAUDE INSTALLED (LIMITED MODE)
echo ================================================================================
echo.
echo Installation complete! The app is ready to run.
echo.
echo NOTE: real_ladybug was skipped. Some features may be limited:
echo   - Graph database memory features
echo   - Advanced knowledge graph capabilities
echo.
echo The core application should still work fine!
echo.
echo ================================================================================
echo.

set /p RUN_APP="Would you like to run Auto-Claude now? (y/n): "
if /i "%RUN_APP%"=="y" (
    echo.
    echo Starting Auto-Claude...
    cd ..\..
    call npm run dev
) else (
    echo.
    echo To run Auto-Claude later, use: npm run dev
    echo.
)

pause
