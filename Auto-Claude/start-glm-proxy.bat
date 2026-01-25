@echo off
REM Start LiteLLM proxy for GLM API integration
REM This script starts a local proxy that translates between Anthropic and GLM API formats

echo ============================================================
echo Starting LiteLLM Proxy for GLM (Z.AI) Integration
echo ============================================================
echo.
echo This proxy will:
echo   - Listen on http://127.0.0.1:8000
echo   - Translate Anthropic API calls to GLM API format
echo   - Route requests to https://api.z.ai/api/paas/v4
echo.
echo Keep this window open while using Autoclaude with GLM
echo Press Ctrl+C to stop the proxy
echo ============================================================
echo.

REM Check if litellm is installed
python -c "import litellm" 2>nul
if %errorlevel% neq 0 (
    echo LiteLLM is not installed. Installing now...
    pip install "litellm[proxy]"
    if %errorlevel% neq 0 (
        echo.
        echo ERROR: Failed to install LiteLLM
        echo Please run: pip install "litellm[proxy]"
        pause
        exit /b 1
    )
)

REM Start the proxy
echo Starting proxy server...
echo.
litellm --config litellm_config.yaml --port 8000 --detailed_debug

pause
