# GLM API Integration Guide for Autoclaude

This guide explains how to use your GLM subscription from Z.AI with Autoclaude for more efficient token usage.

## Overview

The integration uses **LiteLLM** as a proxy to translate between Anthropic's API format (which Autoclaude expects) and Z.AI's GLM API format. This allows Autoclaude to use GLM models while maintaining full compatibility.

## Model Mapping

The following Anthropic models are mapped to GLM models:

| Autoclaude Model | GLM Model | Use Case |
|------------------|-----------|----------|
| claude-sonnet-4-5-20251101 | glm-4.7 | Main coding model (most capable) |
| claude-3-5-sonnet-20241022 | glm-4.6 | Fallback coding model |
| claude-3-5-haiku-20241022 | glm-4.5-air | Lightweight tasks (free tier, very efficient) |
| claude-opus-4-5-20251101 | glm-4-plus | Complex reasoning tasks |

## Setup Steps

### Step 1: Install LiteLLM

Open a terminal and run:

```bash
pip install "litellm[proxy]"
```

### Step 2: Start the GLM Proxy

**On Windows:**
```bash
cd "Auto-Claude"
start-glm-proxy.bat
```

**On macOS/Linux:**
```bash
cd Auto-Claude
chmod +x start-glm-proxy.sh
./start-glm-proxy.sh
```

**Important:** Keep the proxy window open while using Autoclaude. The proxy runs on `http://127.0.0.1:8000`.

### Step 3: Verify Configuration

Your configuration is already set in `Auto-Claude/apps/backend/.env`:

```bash
GLM_API_KEY=5ba6a4392b8a48d19c0700b9b7006a47.7uLQHdSAmx3MJWd3
ANTHROPIC_BASE_URL=http://127.0.0.1:8000
NO_PROXY=127.0.0.1
DISABLE_TELEMETRY=true
DISABLE_COST_WARNINGS=true
API_TIMEOUT_MS=600000
```

### Step 4: Run Autoclaude

Once the proxy is running, start Autoclaude normally:

```bash
cd "Auto-Claude/apps/backend"
.venv/Scripts/python.exe -m cli.main
```

All API calls will now be routed through GLM instead of Anthropic's API!

## Testing the Integration

To verify the integration is working:

1. **Check proxy logs:** The proxy terminal should show incoming requests
2. **Check Autoclaude output:** Look for successful API responses
3. **Monitor token usage:** GLM models typically use fewer tokens than Claude

### Quick Test Command

```bash
cd "Auto-Claude/apps/backend"
.venv/Scripts/python.exe -c "from core.auth import get_sdk_env_vars; import os; print('ANTHROPIC_BASE_URL:', os.environ.get('ANTHROPIC_BASE_URL')); print('SDK Env:', get_sdk_env_vars())"
```

Expected output:
```
ANTHROPIC_BASE_URL: http://127.0.0.1:8000
SDK Env: {'ANTHROPIC_BASE_URL': 'http://127.0.0.1:8000', 'NO_PROXY': '127.0.0.1', ...}
```

## Troubleshooting

### Issue: "Connection refused" error

**Solution:** Make sure the GLM proxy is running (`start-glm-proxy.bat`)

### Issue: API authentication errors

**Solution:** Verify your GLM API key in `.env` is correct:
```bash
GLM_API_KEY=5ba6a4392b8a48d19c0700b9b7006a47.7uLQHdSAmx3MJWd3
```

### Issue: Model not found errors

**Solution:** Check `litellm_config.yaml` has the correct model mappings. The config uses these GLM models:
- `glm-4.7` (latest, most capable)
- `glm-4.6` (stable)
- `glm-4.5-air` (efficient, free tier)
- `glm-4-plus` (advanced reasoning)

### Issue: Slow responses

**Solution:**
1. Check your internet connection
2. Verify Z.AI API status
3. Try using `glm-4.5-air` for faster responses (set in Autoclaude config)

## Token Efficiency Tips

1. **Use glm-4.5-air for simple tasks:** Set `AUTO_BUILD_MODEL=claude-3-5-haiku-20241022` in `.env` to use the most efficient model
2. **Monitor token usage:** The proxy shows token counts in the terminal
3. **Enable Graphiti memory:** Reduces context tokens by using knowledge graphs

## Advanced Configuration

### Using Different GLM Models

Edit `litellm_config.yaml` to change model mappings:

```yaml
model_list:
  - model_name: claude-sonnet-4-5-20251101
    litellm_params:
      model: openai/glm-4.7  # Change this to any supported GLM model
      api_base: https://api.z.ai/api/paas/v4
      api_key: os.environ/GLM_API_KEY
```

### Running Proxy in Background (Advanced)

**Windows (using `start`):**
```bash
start /B litellm --config litellm_config.yaml --port 8000
```

**Linux/macOS (using `nohup`):**
```bash
nohup litellm --config litellm_config.yaml --port 8000 > litellm.log 2>&1 &
```

## Files Created

- `litellm_config.yaml` - LiteLLM proxy configuration
- `start-glm-proxy.bat` - Windows startup script
- `start-glm-proxy.sh` - macOS/Linux startup script
- `apps/backend/.env` - Updated with GLM configuration
- `GLM-INTEGRATION-GUIDE.md` - This guide

## API Documentation Sources

For more information about GLM API:
- [Z.AI API Documentation](https://docs.z.ai/guides/develop/http/introduction)
- [GLM-4.6 API Guide](https://apidog.com/blog/glm-4-6-api/)
- [Using GLM with Claude Code](https://apidog.com/blog/glm-4-5-with-claude-code-2/)

## Support

If you encounter issues:
1. Check the proxy terminal for error messages
2. Verify your API key is valid on Z.AI dashboard
3. Ensure you have an active GLM subscription
4. Check that port 8000 is not blocked by firewall

---

**Ready to use!** Start the proxy with `start-glm-proxy.bat` and run Autoclaude as normal.
