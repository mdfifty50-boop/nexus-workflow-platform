import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

// Routes
import chatRoutes from './routes/chat.js'
import workflowRoutes from './routes/workflow.js'
import workflowsRoutes from './routes/workflows.js'
import integrationRoutes from './routes/integrations.js'
import adminRoutes from './routes/admin.js'
import healthRoutes from './routes/health.js'
import webhookRoutes from './routes/webhooks.js'
import projectRoutes from './routes/projects.js'
import sseRoutes from './routes/sse.js'
import meetingRoutes from './routes/meetings.js'
import errorRoutes from './routes/errors.js'
import tokenRoutes from './routes/tokens.js'
import resultsRoutes from './routes/results.js'
import paymentRoutes from './routes/payments.js'
import subscriptionRoutes from './routes/subscriptions.js'
import composioRoutes from './routes/composio.js'
import browserRoutes from './routes/browser.js'
import mcpProvidersRoutes from './routes/mcp-providers.js'
import aiProxyRoutes from './routes/ai-proxy.js'
import rubeRoutes from './routes/rube.js'
import oauthRoutes from './routes/oauth.js'
import customIntegrationsRoutes from './routes/customIntegrations.js'
import preflightRoutes from './routes/preflight.js'
import whatsappRoutes from './routes/whatsapp.js'
import whatsappBusinessRoutes from './routes/whatsapp-business.js'
import whatsappComposioRoutes from './routes/whatsapp-composio.js'
import whatsappWebRoutes from './routes/whatsapp-web.js'
import suggestionsRoutes from './routes/suggestions.js'
import voiceRoutes from './routes/voice.js'
import chatPersistenceRoutes from './routes/chat-persistence.js'
import workflowPersistenceRoutes from './routes/workflow-persistence.js'
import userPreferencesRoutes from './routes/user-preferences.js'
import userProfileRoutes from './routes/user-profile.js'
import adminAnalyticsRoutes from './routes/admin-analytics.js'

// WhatsApp Business trigger service (auto-initializes and registers message handler)
import './services/WhatsAppBusinessTriggerService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 4567

// Middleware
app.use(cors())

// Stripe webhooks require raw body for signature verification
// This must be before express.json() middleware
app.use('/api/subscriptions/webhook', express.raw({ type: 'application/json' }))

// JSON parsing for all other routes
app.use(express.json({ limit: '10mb' }))

// API Routes
app.use('/api/chat', chatRoutes)
app.use('/api/workflow', workflowRoutes)
app.use('/api/workflows', workflowsRoutes)
app.use('/api/integrations', integrationRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/health', healthRoutes)
app.use('/api/webhooks', webhookRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/sse', sseRoutes)
app.use('/api/meetings', meetingRoutes)
app.use('/api/errors', errorRoutes)
app.use('/api/tokens', tokenRoutes)
app.use('/api/results', resultsRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/subscriptions', subscriptionRoutes)
app.use('/api/composio', composioRoutes)
app.use('/api/browser', browserRoutes)
app.use('/api/mcp', mcpProvidersRoutes)
app.use('/api/ai-proxy', aiProxyRoutes)
app.use('/api/rube', rubeRoutes)
app.use('/api/oauth', oauthRoutes)
app.use('/api/custom-integrations', customIntegrationsRoutes)
app.use('/api/preflight', preflightRoutes)
app.use('/api/whatsapp', whatsappRoutes)
app.use('/api/whatsapp-business', whatsappBusinessRoutes)
app.use('/api/whatsapp-composio', whatsappComposioRoutes)
app.use('/api/whatsapp-web', whatsappWebRoutes)
app.use('/api/suggestions', suggestionsRoutes)
app.use('/api/voice', voiceRoutes)
app.use('/api/chat-persistence', chatPersistenceRoutes)
app.use('/api/workflow-persistence', workflowPersistenceRoutes)
app.use('/api/user-preferences', userPreferencesRoutes)
app.use('/api/user-profile', userProfileRoutes)
app.use('/api/admin-analytics', adminAnalyticsRoutes)

// Serve static frontend in production
const distPath = path.resolve(process.cwd(), 'dist')
console.log(`📁 Static files path: ${distPath}`)

// Debug endpoint to check dist contents
app.get('/api/debug/dist', (req, res) => {
  const fs = require('fs')
  try {
    const exists = fs.existsSync(distPath)
    const files = exists ? fs.readdirSync(distPath) : []
    const assetsPath = path.join(distPath, 'assets')
    const assets = fs.existsSync(assetsPath) ? fs.readdirSync(assetsPath) : []
    res.json({
      cwd: process.cwd(),
      distPath,
      exists,
      files,
      assets,
      nodeEnv: process.env.NODE_ENV
    })
  } catch (err: any) {
    res.json({ error: err.message, distPath, cwd: process.cwd() })
  }
})

// Always serve static files (not just in production)
app.use(express.static(distPath))

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'))
  }
})

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err)
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  })
})

// Graceful shutdown handling for production
let server: ReturnType<typeof app.listen> | null = null

function gracefulShutdown(signal: string) {
  console.log(`\n⚠️ ${signal} received. Starting graceful shutdown...`)

  if (server) {
    server.close((err) => {
      if (err) {
        console.error('❌ Error during shutdown:', err)
        process.exit(1)
      }
      console.log('✓ HTTP server closed')
      console.log('✓ Graceful shutdown complete')
      process.exit(0)
    })

    // Force shutdown after 30 seconds if graceful shutdown fails
    setTimeout(() => {
      console.error('⚠️ Forcing shutdown after 30s timeout')
      process.exit(1)
    }, 30000)
  } else {
    process.exit(0)
  }
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Handle uncaught exceptions in production
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err)
  if (process.env.NODE_ENV === 'production') {
    // In production, log the error and attempt graceful shutdown
    gracefulShutdown('uncaughtException')
  }
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
})

// Only start listener when not running under Vitest (for supertest compatibility)
if (!process.env.VITEST) {
  server = app.listen(PORT, () => {
    console.log(`🚀 Nexus server running on port ${PORT}`)
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`)
    console.log(`   AI Services (proxied - keys secure):`)
    console.log(`     - Anthropic/Claude: ${process.env.ANTHROPIC_API_KEY ? '✓ Configured' : '✗ Not configured'}`)
    console.log(`     - HeyGen Avatar: ${process.env.HEYGEN_API_KEY ? '✓ Configured' : '⚠ Not configured'}`)
    console.log(`     - ElevenLabs TTS: ${process.env.ELEVENLABS_API_KEY ? '✓ Configured' : '⚠ Not configured'}`)
    console.log(`     - OpenAI TTS: ${process.env.OPENAI_API_KEY ? '✓ Configured' : '⚠ Not configured'}`)
    console.log(`   MCP Providers:`)
    console.log(`     - Composio: ${process.env.COMPOSIO_API_KEY ? '✓ Configured' : '⚠ Demo mode'} (500+ apps)`)
    console.log(`     - Google Cloud: ${process.env.GOOGLE_CLIENT_ID ? '✓ Configured' : '⚠ Not configured'} (FREE for GCP)`)
    console.log(`     - Zapier: ${process.env.ZAPIER_CLIENT_ID ? '✓ Configured' : '⚠ Not configured'} (8,000+ apps)`)
    console.log(`   Payments:`)
    console.log(`     - Stripe: ${process.env.STRIPE_SECRET_KEY ? '✓ Configured' : '⚠ Not configured'}`)
    console.log(`     - Subscriptions: ${process.env.VITE_STRIPE_LAUNCH_PRICE_ID ? '✓ Price IDs configured' : '⚠ Price IDs not set'}`)
    console.log(`   OAuth (White-Labeled):`)
    console.log(`     - Google: ${process.env.GOOGLE_CLIENT_ID ? '✓ Direct OAuth' : '→ Via Composio proxy'}`)
    console.log(`     - Slack: ${process.env.SLACK_CLIENT_ID ? '✓ Direct OAuth' : '→ Via Composio proxy'}`)
    console.log(`     - GitHub: ${process.env.GITHUB_CLIENT_ID ? '✓ Direct OAuth' : '→ Via Composio proxy'}`)
    console.log(`   Browser: ✓ Playwright available`)
    console.log(`   WhatsApp Business: ${process.env.AISENSY_PARTNER_ID ? '✓ AiSensy configured' : '⚠ Configure AISENSY_PARTNER_ID for Embedded Signup'}`)
    console.log(`   WhatsApp Web: ✓ QR Code integration available`)
  })
}

export default app
