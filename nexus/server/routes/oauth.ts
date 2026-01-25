/**
 * OAuth Routes - White-label OAuth that hides Rube/Composio from users
 *
 * These routes handle:
 * - Initiating OAuth with direct provider URLs
 * - Handling OAuth callbacks
 * - Connection status checks
 *
 * Users see: Google/Slack/GitHub OAuth screens
 * Users DON'T see: rube.app, composio.dev
 */

import { Router, Request, Response } from 'express'
import { oauthProxyService } from '../services/OAuthProxyService'
import { composioService } from '../services/ComposioService'

const router = Router()

/**
 * POST /api/oauth/initiate
 * Start OAuth flow for a toolkit - returns DIRECT provider URL
 *
 * Request: { toolkit: string, userId?: string, sessionId?: string }
 * Response: { authUrl: string, state: string }
 */
router.post('/initiate', (req: Request, res: Response) => {
  const { toolkit, userId = 'anonymous', sessionId } = req.body

  if (!toolkit) {
    return res.status(400).json({
      success: false,
      error: 'toolkit is required',
    })
  }

  // Get base URL for callback
  const protocol = req.secure ? 'https' : 'http'
  const baseUrl = `${protocol}://${req.get('host')}`

  const result = oauthProxyService.generateAuthUrl(
    toolkit,
    userId,
    sessionId || `session_${Date.now()}`,
    baseUrl
  )

  if ('error' in result) {
    return res.status(400).json({
      success: false,
      error: result.error,
    })
  }

  console.log(`[OAuth] Initiated ${toolkit} OAuth for user ${userId}`)

  res.json({
    success: true,
    authUrl: result.authUrl,
    state: result.state,
    // Include metadata for frontend
    provider: toolkit,
    message: `Click to authorize ${toolkit}`,
  })
})

/**
 * GET /api/oauth/callback
 * FIX-072: Handle OAuth callback from providers
 * Shows success page that auto-closes popup and notifies parent window
 *
 * Query: { code: string, state: string, error?: string }
 */
router.get('/callback', async (req: Request, res: Response) => {
  const { code, state, error, error_description, toolkit: queryToolkit } = req.query

  console.log(`[OAuth] FIX-072: Callback received (toolkit: ${queryToolkit || 'unknown'}, has_code: ${!!code}, has_state: ${!!state})`)

  // Handle OAuth errors from provider
  if (error) {
    console.error(`[OAuth] Provider returned error: ${error} - ${error_description}`)

    // Show error page that auto-closes
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Connection Error</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; text-align: center; background: #f9fafb; }
          .container { max-width: 400px; margin: 60px auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .icon { font-size: 48px; margin-bottom: 16px; }
          h2 { color: #dc2626; margin-bottom: 8px; }
          p { color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">❌</div>
          <h2>Connection Failed</h2>
          <p>${String(error_description || error)}</p>
          <p style="font-size: 14px; margin-top: 16px;">This window will close automatically...</p>
        </div>
        <script>
          // Notify parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'oauth-error',
              error: ${JSON.stringify(String(error))},
              description: ${JSON.stringify(String(error_description || ''))}
            }, '*');
          }
          setTimeout(() => window.close(), 2500);
        </script>
      </body>
      </html>
    `)
  }

  if (!code || !state) {
    // Missing params - show error page
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Connection Error</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; text-align: center; background: #f9fafb; }
          .container { max-width: 400px; margin: 60px auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .icon { font-size: 48px; margin-bottom: 16px; }
          h2 { color: #dc2626; margin-bottom: 8px; }
          p { color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">❌</div>
          <h2>Connection Incomplete</h2>
          <p>Missing required parameters. Please try connecting again.</p>
          <p style="font-size: 14px; margin-top: 16px;">This window will close automatically...</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'oauth-error', error: 'missing_params' }, '*');
          }
          setTimeout(() => window.close(), 2500);
        </script>
      </body>
      </html>
    `)
  }

  try {
    const result = await oauthProxyService.handleCallback(
      String(state),
      String(code)
    )

    if (!result.success) {
      console.error(`[OAuth] Callback processing failed: ${result.error}`)
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Connection Error</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; text-align: center; background: #f9fafb; }
            .container { max-width: 400px; margin: 60px auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .icon { font-size: 48px; margin-bottom: 16px; }
            h2 { color: #dc2626; margin-bottom: 8px; }
            p { color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">❌</div>
            <h2>Connection Failed</h2>
            <p>${result.error || 'Unable to complete connection'}</p>
            <p style="font-size: 14px; margin-top: 16px;">This window will close automatically...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'oauth-error', error: ${JSON.stringify(result.error || 'unknown')} }, '*');
            }
            setTimeout(() => window.close(), 2500);
          </script>
        </body>
        </html>
      `)
    }

    // Success!
    const connectedToolkit = result.toolkit || queryToolkit || 'your app'
    console.log(`[OAuth] FIX-072: Successfully connected ${connectedToolkit} for user ${result.userId}`)

    // Show success page that auto-closes and notifies parent
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Connected!</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; text-align: center; background: #f9fafb; }
          .container { max-width: 400px; margin: 60px auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .icon { font-size: 64px; margin-bottom: 16px; animation: pop 0.3s ease-out; }
          @keyframes pop { 0% { transform: scale(0); } 100% { transform: scale(1); } }
          h2 { color: #059669; margin-bottom: 8px; }
          p { color: #6b7280; }
          .toolkit { font-weight: 600; color: #1f2937; text-transform: capitalize; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">✅</div>
          <h2>Successfully Connected!</h2>
          <p><span class="toolkit">${connectedToolkit}</span> is now connected to your account.</p>
          <p style="font-size: 14px; margin-top: 16px;">This window will close automatically...</p>
        </div>
        <script>
          // Notify parent window of success
          if (window.opener) {
            window.opener.postMessage({
              type: 'oauth-success',
              toolkit: ${JSON.stringify(connectedToolkit)},
              userId: ${JSON.stringify(result.userId || 'unknown')}
            }, '*');
          }
          // Close after 1.5 seconds
          setTimeout(() => window.close(), 1500);
        </script>
      </body>
      </html>
    `)

  } catch (err) {
    console.error('[OAuth] Callback error:', err)
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Connection Error</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; text-align: center; background: #f9fafb; }
          .container { max-width: 400px; margin: 60px auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .icon { font-size: 48px; margin-bottom: 16px; }
          h2 { color: #dc2626; margin-bottom: 8px; }
          p { color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">❌</div>
          <h2>Something went wrong</h2>
          <p>Please try connecting again.</p>
          <p style="font-size: 14px; margin-top: 16px;">This window will close automatically...</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'oauth-error', error: 'unknown' }, '*');
          }
          setTimeout(() => window.close(), 2500);
        </script>
      </body>
      </html>
    `)
  }
})

/**
 * GET /api/oauth/proxy/:toolkit
 * FIX-072: Proxy endpoint for Composio-managed OAuth
 * Fetches OAuth URL from Composio, redirects user to provider (Google, Slack, etc.)
 * User never sees composio.dev URL - we handle the redirect seamlessly
 */
router.get('/proxy/:toolkit', async (req: Request, res: Response) => {
  const { toolkit } = req.params
  const { state, session } = req.query

  if (!state) {
    return res.status(400).json({ error: 'state is required' })
  }

  console.log(`[OAuth] FIX-072: Proxy ${toolkit} OAuth request (state: ${String(state).substring(0, 16)}...)`)

  try {
    // Build callback URL that points back to Nexus
    const protocol = req.secure || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http'
    const baseUrl = `${protocol}://${req.get('host')}`
    const callbackUrl = `${baseUrl}/api/oauth/callback`

    console.log(`[OAuth] Callback URL: ${callbackUrl}`)

    // Initialize Composio if needed
    if (!composioService.initialized) {
      const apiKey = process.env.COMPOSIO_API_KEY
      if (apiKey) {
        await composioService.initialize(apiKey)
        console.log('[OAuth] ComposioService initialized for proxy')
      }
    }

    // Get OAuth URL from Composio with our callback
    const authResult = await composioService.initiateConnection(toolkit, callbackUrl)

    if (authResult.error || !authResult.authUrl) {
      console.error(`[OAuth] Failed to get OAuth URL for ${toolkit}:`, authResult.error)

      // Return a user-friendly error page
      return res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Connection Error</title></head>
        <body style="font-family: system-ui; padding: 40px; text-align: center;">
          <h2>Unable to connect ${toolkit}</h2>
          <p>Please close this window and try again.</p>
          <script>
            // Notify parent window of failure
            if (window.opener) {
              window.opener.postMessage({ type: 'oauth-error', toolkit: '${toolkit}' }, '*');
            }
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
        </html>
      `)
    }

    console.log(`[OAuth] Got OAuth URL for ${toolkit}: ${authResult.authUrl.substring(0, 80)}...`)

    // Check if this is going through Composio's platform (not ideal, but functional)
    if (authResult.authUrl.includes('composio.dev') || authResult.authUrl.includes('platform.composio')) {
      console.warn(`[OAuth] WARNING: ${toolkit} OAuth goes through Composio platform - connection will work but UX not ideal`)
    }

    // Redirect to the OAuth URL
    res.redirect(authResult.authUrl)

  } catch (err) {
    console.error(`[OAuth] Proxy error for ${toolkit}:`, err)
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Connection Error</title></head>
      <body style="font-family: system-ui; padding: 40px; text-align: center;">
        <h2>Unable to connect ${toolkit}</h2>
        <p>Please close this window and try again.</p>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'oauth-error', toolkit: '${toolkit}' }, '*');
          }
          setTimeout(() => window.close(), 3000);
        </script>
      </body>
      </html>
    `)
  }
})

/**
 * GET /api/oauth/status/:toolkit
 * Check if a toolkit is connected for the current user
 */
router.get('/status/:toolkit', (req: Request, res: Response) => {
  const { toolkit } = req.params
  const userId = req.query.userId as string || 'anonymous'

  const connected = oauthProxyService.isConnected(toolkit, userId)

  res.json({
    toolkit,
    connected,
    // If not connected, provide the initiate endpoint
    ...(connected ? {} : {
      connectUrl: `/api/oauth/initiate`,
    }),
  })
})

/**
 * GET /api/oauth/connections
 * Get all connected toolkits for a user
 */
router.get('/connections', (req: Request, res: Response) => {
  const userId = req.query.userId as string || 'anonymous'

  const connections = oauthProxyService.getUserConnections(userId)

  res.json({
    userId,
    connections,
    count: connections.length,
  })
})

/**
 * DELETE /api/oauth/disconnect/:toolkit
 * Disconnect a toolkit
 */
router.delete('/disconnect/:toolkit', (req: Request, res: Response) => {
  const { toolkit } = req.params
  const userId = req.query.userId as string || 'anonymous'

  const success = oauthProxyService.disconnect(toolkit, userId)

  if (success) {
    console.log(`[OAuth] Disconnected ${toolkit} for user ${userId}`)
  }

  res.json({
    success,
    toolkit,
    message: success ? `Disconnected ${toolkit}` : `${toolkit} was not connected`,
  })
})

/**
 * GET /api/oauth/providers
 * Get list of supported OAuth providers
 */
router.get('/providers', (_req: Request, res: Response) => {
  const providers = oauthProxyService.getSupportedProviders()

  res.json({
    providers,
    count: providers.length,
  })
})

export default router
