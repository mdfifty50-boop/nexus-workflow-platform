/**
 * AI Service Proxy Routes
 *
 * SECURITY: These routes proxy requests to external AI services with API keys
 * attached server-side. This prevents exposing sensitive API keys in the browser.
 *
 * Supported services:
 * - HeyGen (streaming avatar)
 * - ElevenLabs (TTS)
 * - OpenAI (TTS)
 * - Anthropic/Claude (chat) - Already handled by chat.ts and claudeProxy.ts
 */
import { Router } from 'express';
const router = Router();
// =============================================================================
// HEYGEN PROXY ENDPOINTS
// =============================================================================
/**
 * POST /api/ai-proxy/heygen/token
 * Generate a streaming session access token
 */
router.post('/heygen/token', async (req, res) => {
    const apiKey = process.env.HEYGEN_API_KEY;
    if (!apiKey) {
        return res.status(503).json({
            success: false,
            error: 'HeyGen not configured',
            hint: 'Add HEYGEN_API_KEY to server environment'
        });
    }
    try {
        const response = await fetch('https://api.heygen.com/v1/streaming.create_token', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
            },
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[AI Proxy] HeyGen token error:', errorText);
            return res.status(response.status).json({
                success: false,
                error: `HeyGen API error: ${response.statusText}`
            });
        }
        const data = await response.json();
        res.json({
            success: true,
            token: data.data?.token || data.token
        });
    }
    catch (error) {
        console.error('[AI Proxy] HeyGen token error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get HeyGen token'
        });
    }
});
/**
 * GET /api/ai-proxy/heygen/avatars
 * List available HeyGen avatars
 */
router.get('/heygen/avatars', async (req, res) => {
    const apiKey = process.env.HEYGEN_API_KEY;
    if (!apiKey) {
        return res.status(503).json({
            success: false,
            error: 'HeyGen not configured',
            hint: 'Add HEYGEN_API_KEY to server environment'
        });
    }
    try {
        const response = await fetch('https://api.heygen.com/v2/avatars', {
            method: 'GET',
            headers: {
                'x-api-key': apiKey,
                'Accept': 'application/json',
            },
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[AI Proxy] HeyGen avatars error:', errorText);
            return res.status(response.status).json({
                success: false,
                error: `HeyGen API error: ${response.statusText}`
            });
        }
        const data = await response.json();
        res.json({
            success: true,
            avatars: data.data?.avatars || []
        });
    }
    catch (error) {
        console.error('[AI Proxy] HeyGen avatars error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to list HeyGen avatars'
        });
    }
});
/**
 * GET /api/ai-proxy/heygen/status
 * Check if HeyGen is configured
 */
router.get('/heygen/status', (req, res) => {
    const apiKey = process.env.HEYGEN_API_KEY;
    res.json({
        success: true,
        configured: !!apiKey
    });
});
// =============================================================================
// ELEVENLABS PROXY ENDPOINTS
// =============================================================================
/**
 * POST /api/ai-proxy/elevenlabs/tts
 * Text-to-speech using ElevenLabs
 */
router.post('/elevenlabs/tts', async (req, res) => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
        return res.status(503).json({
            success: false,
            error: 'ElevenLabs not configured',
            hint: 'Add ELEVENLABS_API_KEY to server environment'
        });
    }
    const { text, voiceId, modelId = 'eleven_turbo_v2_5', stability = 0.5, similarityBoost = 0.75, style = 0.0, useSpeakerBoost = true } = req.body;
    if (!text || !voiceId) {
        return res.status(400).json({
            success: false,
            error: 'text and voiceId are required'
        });
    }
    try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text,
                model_id: modelId,
                voice_settings: {
                    stability,
                    similarity_boost: similarityBoost,
                    style,
                    use_speaker_boost: useSpeakerBoost
                }
            })
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[AI Proxy] ElevenLabs TTS error:', errorText);
            return res.status(response.status).json({
                success: false,
                error: `ElevenLabs API error: ${response.statusText}`
            });
        }
        // Return audio as binary
        const audioBuffer = await response.arrayBuffer();
        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.byteLength.toString()
        });
        res.send(Buffer.from(audioBuffer));
    }
    catch (error) {
        console.error('[AI Proxy] ElevenLabs TTS error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to generate speech'
        });
    }
});
/**
 * GET /api/ai-proxy/elevenlabs/status
 * Check if ElevenLabs is configured
 */
router.get('/elevenlabs/status', (req, res) => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    res.json({
        success: true,
        configured: !!apiKey
    });
});
// =============================================================================
// OPENAI PROXY ENDPOINTS
// =============================================================================
/**
 * POST /api/ai-proxy/openai/tts
 * Text-to-speech using OpenAI
 */
router.post('/openai/tts', async (req, res) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return res.status(503).json({
            success: false,
            error: 'OpenAI not configured',
            hint: 'Add OPENAI_API_KEY to server environment'
        });
    }
    const { text, voice = 'alloy', model = 'tts-1-hd', speed = 1.0 } = req.body;
    if (!text) {
        return res.status(400).json({
            success: false,
            error: 'text is required'
        });
    }
    try {
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model,
                input: text,
                voice,
                response_format: 'mp3',
                speed
            })
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[AI Proxy] OpenAI TTS error:', errorText);
            return res.status(response.status).json({
                success: false,
                error: `OpenAI API error: ${response.statusText}`
            });
        }
        // Return audio as binary
        const audioBuffer = await response.arrayBuffer();
        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.byteLength.toString()
        });
        res.send(Buffer.from(audioBuffer));
    }
    catch (error) {
        console.error('[AI Proxy] OpenAI TTS error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to generate speech'
        });
    }
});
/**
 * GET /api/ai-proxy/openai/status
 * Check if OpenAI is configured
 */
router.get('/openai/status', (req, res) => {
    const apiKey = process.env.OPENAI_API_KEY;
    res.json({
        success: true,
        configured: !!apiKey
    });
});
// =============================================================================
// GENERAL STATUS ENDPOINT
// =============================================================================
/**
 * GET /api/ai-proxy/status
 * Get status of all AI services
 */
router.get('/status', (req, res) => {
    res.json({
        success: true,
        services: {
            heygen: {
                configured: !!process.env.HEYGEN_API_KEY,
                description: 'Streaming avatar'
            },
            elevenlabs: {
                configured: !!process.env.ELEVENLABS_API_KEY,
                description: 'Human-like TTS'
            },
            openai: {
                configured: !!process.env.OPENAI_API_KEY,
                description: 'TTS and chat'
            },
            anthropic: {
                configured: !!process.env.ANTHROPIC_API_KEY,
                description: 'Claude AI'
            }
        }
    });
});
export default router;
//# sourceMappingURL=ai-proxy.js.map