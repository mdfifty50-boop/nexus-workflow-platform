import { Router } from 'express';
import { getAllAgents } from '../agents/index.js';
import { composioService } from '../services/ComposioService.js';
const router = Router();
// GET /api/health - Health check and service status
router.get('/', async (req, res) => {
    // Check Composio service status
    let composioStatus;
    try {
        const composioInfo = await composioService.getStatus();
        composioStatus = {
            configured: composioInfo.apiKeyConfigured,
            status: composioInfo.apiKeyConfigured ? 'ready' : 'demo_mode',
            service: 'Composio (500+ Apps)'
        };
    }
    catch {
        composioStatus = {
            configured: false,
            status: 'error',
            service: 'Composio (500+ Apps)'
        };
    }
    const status = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
            ai: {
                configured: !!process.env.ANTHROPIC_API_KEY,
                service: 'Claude (Anthropic)'
            },
            composio: composioStatus,
            email: {
                configured: !!process.env.RESEND_API_KEY,
                service: 'Resend'
            },
            crm: {
                configured: !!process.env.HUBSPOT_ACCESS_TOKEN,
                service: 'HubSpot'
            },
            database: {
                configured: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
                service: 'Supabase'
            },
            vercelAdmin: {
                configured: !!process.env.VERCEL_TOKEN,
                service: 'Vercel API'
            }
        },
        agents: getAllAgents().map(a => ({
            id: a.id,
            name: a.name,
            title: a.title,
            avatar: a.avatar
        })),
        execution: {
            retryConfig: {
                maxRetries: 3,
                baseDelayMs: 1000
            }
        }
    };
    // Determine overall status
    // Critical services: AI and Composio (must be configured for workflows to work)
    const criticalOk = status.services.ai.configured && status.services.composio.configured;
    const configuredCount = Object.values(status.services).filter(s => 'configured' in s && s.configured).length;
    const totalServices = Object.keys(status.services).length;
    if (!criticalOk) {
        status.status = configuredCount === 0 ? 'unhealthy' : 'degraded';
    }
    else if (configuredCount < totalServices) {
        status.status = 'degraded';
    }
    res.json(status);
});
// GET /api/health/ping - Simple ping for uptime monitoring
router.get('/ping', (req, res) => {
    res.json({ pong: true, timestamp: Date.now() });
});
export default router;
//# sourceMappingURL=health.js.map