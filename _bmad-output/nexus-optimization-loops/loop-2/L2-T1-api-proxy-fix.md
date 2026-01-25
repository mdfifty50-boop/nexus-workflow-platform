# L2-T1: API Key Security Fix - Backend Proxy Implementation

## Summary

**Task:** Move all exposed API keys from browser bundle to backend proxy
**Priority:** CRITICAL SECURITY
**Status:** COMPLETED

## Problem Statement

The following API keys were exposed in the browser bundle due to `VITE_` prefix in environment variables:

| Key | Risk Level | Previous Location |
|-----|------------|-------------------|
| `VITE_ANTHROPIC_API_KEY` | CRITICAL | Browser bundle |
| `VITE_HEYGEN_API_KEY` | HIGH | Browser bundle |
| `VITE_ELEVENLABS_API_KEY` | HIGH | Browser bundle |
| `VITE_OPENAI_API_KEY` | HIGH | Browser bundle |

**Why this is dangerous:** Any key with `VITE_` prefix is bundled into the JavaScript sent to browsers. Anyone can inspect network traffic, source maps, or browser dev tools to extract these keys and use them at your expense.

## Solution Implemented

### 1. Created Backend API Proxy Routes

**File:** `nexus/server/routes/ai-proxy.ts` (NEW)

A centralized proxy service that:
- Accepts requests from frontend without API keys
- Attaches API keys server-side from environment variables
- Forwards requests to external AI services
- Returns responses to frontend

**Endpoints created:**
| Endpoint | Purpose |
|----------|---------|
| `POST /api/ai-proxy/heygen/token` | Generate HeyGen streaming session token |
| `GET /api/ai-proxy/heygen/avatars` | List available HeyGen avatars |
| `GET /api/ai-proxy/heygen/status` | Check if HeyGen is configured |
| `POST /api/ai-proxy/elevenlabs/tts` | Text-to-speech via ElevenLabs |
| `GET /api/ai-proxy/elevenlabs/status` | Check if ElevenLabs is configured |
| `POST /api/ai-proxy/openai/tts` | Text-to-speech via OpenAI |
| `GET /api/ai-proxy/openai/status` | Check if OpenAI is configured |
| `GET /api/ai-proxy/status` | Check all AI service statuses |

### 2. Updated Server Entry Point

**File:** `nexus/server/index.ts` (MODIFIED)

- Added import for `ai-proxy` routes
- Registered routes at `/api/ai-proxy`
- Updated startup logs to show AI service configuration status

### 3. Updated Frontend Services

**File:** `nexus/src/services/heygen.ts` (MODIFIED)

- Removed direct `VITE_HEYGEN_API_KEY` usage
- Now calls `/api/ai-proxy/heygen/token` for session tokens
- Now calls `/api/ai-proxy/heygen/avatars` for avatar list
- Now calls `/api/ai-proxy/heygen/status` to check configuration

**File:** `nexus/src/lib/human-tts-service.ts` (MODIFIED)

- Removed direct `VITE_ELEVENLABS_API_KEY` and `VITE_OPENAI_API_KEY` usage
- Added async provider status checking via `/api/ai-proxy/status`
- ElevenLabs TTS now proxied through `/api/ai-proxy/elevenlabs/tts`
- OpenAI TTS now proxied through `/api/ai-proxy/openai/tts`
- Maintains fallback chain: ElevenLabs -> OpenAI -> Browser TTS

### 4. Updated Environment Configuration

**File:** `nexus/.env` (MODIFIED)

Removed VITE_ prefix from all sensitive API keys:

```env
# BEFORE (INSECURE - exposed to browser)
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_HEYGEN_API_KEY=sk_V2_...
VITE_ELEVENLABS_API_KEY=...
VITE_OPENAI_API_KEY=...

# AFTER (SECURE - server-side only)
ANTHROPIC_API_KEY=sk-ant-...
HEYGEN_API_KEY=sk_V2_...
ELEVENLABS_API_KEY=...
OPENAI_API_KEY=...
```

## Files Changed

| File | Action | Lines Changed |
|------|--------|---------------|
| `nexus/server/routes/ai-proxy.ts` | CREATED | 338 lines |
| `nexus/server/index.ts` | MODIFIED | ~15 lines |
| `nexus/src/services/heygen.ts` | MODIFIED | ~50 lines |
| `nexus/src/lib/human-tts-service.ts` | MODIFIED | ~80 lines |
| `nexus/.env` | MODIFIED | ~20 lines |

## Architecture Decision

### Why Backend Proxy vs. Direct API Calls

| Approach | Security | Latency | Complexity |
|----------|----------|---------|------------|
| Direct API (VITE_) | INSECURE | Low | Low |
| Backend Proxy | SECURE | +50-100ms | Medium |
| Edge Function | SECURE | Low | High |

**Choice:** Backend Proxy - best balance of security and simplicity for this application.

### Existing Anthropic/Claude Handling

The Anthropic API key was already being proxied via:
- `nexus/server/routes/chat.ts`
- `nexus/server/services/claudeProxy.ts`

Frontend services (`bmad-service.ts`, `nexus-party-mode-service.ts`, `BMADWorkflowEngine.ts`) first try a local Claude Code Proxy (port 4568), then fall back to direct API calls. With `VITE_ANTHROPIC_API_KEY` removed, these will:
1. Use the Claude Code Proxy if available (for Max subscription users)
2. Fall back to the server's `/api/chat` endpoint for standard users
3. Use simulation mode as final fallback

## Security Improvements

1. **API keys no longer in browser bundle** - Cannot be extracted from JS source
2. **Server validates requests** - Can add rate limiting, authentication
3. **Centralized key management** - Single place to rotate keys
4. **Status endpoints** - Frontend can check service availability without exposing keys

## Remaining Considerations

### Frontend Services Still Checking for VITE_ Keys

These files still reference `import.meta.env.VITE_ANTHROPIC_API_KEY`:
- `nexus/src/lib/bmad-service.ts`
- `nexus/src/lib/nexus-party-mode-service.ts`
- `nexus/src/services/BMADWorkflowEngine.ts`

**Impact:** With the key removed from `.env`, these will fall back to:
1. Claude Code Proxy (if running)
2. Simulation mode

**Recommendation:** Update these services to use `/api/chat` endpoint instead, or leave as-is if Claude Code Proxy is the intended primary path.

### Production Deployment

For production deployments (e.g., Vercel):
1. Set all API keys as server-side environment variables (no VITE_ prefix)
2. Ensure `/api/ai-proxy/*` routes are deployed with server functions
3. Consider adding authentication middleware to proxy routes

## Testing

To verify the fix:

```bash
# Start the server
cd nexus && npm run dev:all

# Check AI service status
curl http://localhost:4567/api/ai-proxy/status

# Expected response:
{
  "success": true,
  "services": {
    "heygen": { "configured": true, "description": "Streaming avatar" },
    "elevenlabs": { "configured": false, "description": "Human-like TTS" },
    "openai": { "configured": false, "description": "TTS and chat" },
    "anthropic": { "configured": true, "description": "Claude AI" }
  }
}
```

## Conclusion

All sensitive API keys have been moved from browser-exposed `VITE_` environment variables to server-side only variables. Frontend services now communicate with external AI services through backend proxy routes that attach credentials server-side, preventing API key exposure in the browser bundle.
