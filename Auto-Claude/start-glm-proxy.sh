#!/bin/bash
# Start LiteLLM proxy for GLM API integration
# This script starts a local proxy that translates between Anthropic and GLM API formats

echo "============================================================"
echo "Starting LiteLLM Proxy for GLM (Z.AI) Integration"
echo "============================================================"
echo ""
echo "This proxy will:"
echo "  - Listen on http://127.0.0.1:8000"
echo "  - Translate Anthropic API calls to GLM API format"
echo "  - Route requests to https://api.z.ai/api/paas/v4"
echo ""
echo "Keep this terminal open while using Autoclaude with GLM"
echo "Press Ctrl+C to stop the proxy"
echo "============================================================"
echo ""

# Check if litellm is installed
if ! python -c "import litellm" 2>/dev/null; then
    echo "LiteLLM is not installed. Installing now..."
    pip install "litellm[proxy]"
    if [ $? -ne 0 ]; then
        echo ""
        echo "ERROR: Failed to install LiteLLM"
        echo "Please run: pip install 'litellm[proxy]'"
        exit 1
    fi
fi

# Start the proxy
echo "Starting proxy server..."
echo ""
litellm --config litellm_config.yaml --port 8000 --detailed_debug
