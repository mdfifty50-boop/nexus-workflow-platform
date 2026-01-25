@echo off
echo ========================================
echo   YOUTUBE ABSORBER - DEPENDENCY INSTALLER
echo ========================================
echo.

echo Checking for winget...
where winget >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: winget not found. Please install App Installer from Microsoft Store.
    pause
    exit /b 1
)

echo.
echo [1/3] Installing yt-dlp (YouTube downloader)...
winget install yt-dlp.yt-dlp --accept-source-agreements --accept-package-agreements

echo.
echo [2/3] Installing FFmpeg (video processing)...
winget install Gyan.FFmpeg --accept-source-agreements --accept-package-agreements

echo.
echo [3/3] Installing Whisper (speech-to-text)...
pip install -U openai-whisper

echo.
echo ========================================
echo   INSTALLATION COMPLETE
echo ========================================
echo.
echo You may need to restart your terminal for PATH changes to take effect.
echo.
echo Test with:
echo   yt-dlp --version
echo   ffmpeg -version
echo   whisper --help
echo.
echo Then use in Claude:
echo   "Absorb this video: https://youtube.com/watch?v=xxxxx"
echo.
pause
