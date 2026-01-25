@echo off
REM ytabsorb - YouTube Content Absorber
REM Usage: ytabsorb "https://www.youtube.com/watch?v=VIDEO_ID"

if "%~1"=="" (
    echo Usage: ytabsorb "youtube_url"
    exit /b 1
)

powershell -ExecutionPolicy Bypass -File "%~dp0ytabsorb.ps1" -URL "%~1"
