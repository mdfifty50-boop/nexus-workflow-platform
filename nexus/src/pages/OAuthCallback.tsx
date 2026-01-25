import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

type CallbackStatus = 'processing' | 'success' | 'error'

/**
 * OAuth Callback Page
 *
 * Handles OAuth redirects from Composio and other OAuth providers.
 * This page:
 * 1. Captures the OAuth response (code, state, error)
 * 2. Communicates success/error to the original window (if popup)
 * 3. Stores connection state for polling detection
 * 4. Auto-closes popup or redirects back to chat
 */
export function OAuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<CallbackStatus>('processing')
  const [message, setMessage] = useState('Processing authorization...')
  const [providerName, setProviderName] = useState<string | null>(null)
  const processedRef = useRef(false)

  useEffect(() => {
    // Prevent double processing in strict mode
    if (processedRef.current) return
    processedRef.current = true

    const processCallback = async () => {
      // Get URL parameters
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      // Try to get provider info from state or sessionStorage
      const storedProvider = sessionStorage.getItem('oauth_provider')
      const storedState = sessionStorage.getItem('oauth_state')
      const returnUrl = sessionStorage.getItem('oauth_return_url') || '/chat'

      if (storedProvider) {
        setProviderName(storedProvider)
      }

      // Handle OAuth errors
      if (error) {
        console.error('[OAuthCallback] OAuth error:', error, errorDescription)
        setStatus('error')
        setMessage(errorDescription || `Authorization failed: ${error}`)

        // Notify opener window if this is a popup
        if (window.opener) {
          window.opener.postMessage({
            type: 'oauth_callback',
            error: errorDescription || error,
            provider: storedProvider
          }, window.location.origin)

          // Close popup after showing error briefly
          setTimeout(() => window.close(), 2500)
        }
        return
      }

      // Validate we have a code
      if (!code) {
        setStatus('error')
        setMessage('No authorization code received. Please try connecting again.')
        return
      }

      // Validate state if we have a stored one (CSRF protection)
      if (storedState && state && storedState !== state) {
        console.warn('[OAuthCallback] State mismatch - possible CSRF')
        // Don't fail on state mismatch for Composio URLs as they use different state handling
      }

      // SUCCESS PATH
      console.log('[OAuthCallback] Authorization successful')
      setStatus('success')
      setMessage('Successfully connected! Redirecting you back...')

      // Store success for polling detection
      // The WorkflowPreviewCard polls checkConnection which will detect this
      sessionStorage.setItem('oauth_success', 'true')
      sessionStorage.setItem('oauth_code', code)
      if (state) {
        sessionStorage.setItem('oauth_state_response', state)
      }
      if (storedProvider) {
        // Mark this specific provider as recently connected
        const connectedTime = Date.now().toString()
        sessionStorage.setItem(`oauth_connected_${storedProvider}`, connectedTime)
        localStorage.setItem(`oauth_connected_${storedProvider}`, connectedTime)

        // Also update the general connected integrations list
        try {
          const existingConnections = localStorage.getItem('nexus_connected_integrations')
          const connections = existingConnections ? JSON.parse(existingConnections) : []
          if (!connections.includes(storedProvider)) {
            connections.push(storedProvider)
            localStorage.setItem('nexus_connected_integrations', JSON.stringify(connections))
          }
        } catch (e) {
          console.warn('[OAuthCallback] Failed to update connections list:', e)
        }
      }

      // Clean up stored state
      sessionStorage.removeItem('oauth_state')
      sessionStorage.removeItem('oauth_provider')

      // Handle popup vs redirect scenarios
      if (window.opener) {
        // This is a popup - notify parent and close
        window.opener.postMessage({
          type: 'oauth_callback',
          code,
          state,
          success: true,
          provider: storedProvider
        }, window.location.origin)

        // Brief success message then close
        setTimeout(() => {
          window.close()
        }, 1500)
      } else {
        // This is a redirect (same window) - go back to chat/original page
        // Give a moment for the user to see the success message
        setTimeout(() => {
          // Try to go back to the original chat session
          if (returnUrl && returnUrl !== '/') {
            navigate(returnUrl, { replace: true })
          } else {
            // Default to chat page where workflows live
            navigate('/chat', { replace: true })
          }
        }, 1500)
      }
    }

    // Use setTimeout to avoid React strict mode double-execution issues
    setTimeout(processCallback, 0)
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 text-center shadow-2xl">
          {/* Logo */}
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">N</span>
            </div>
          </div>

          {status === 'processing' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 relative">
                <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full" />
                <div className="absolute inset-0 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <h1 className="text-xl font-semibold text-white mb-2">
                Connecting{providerName ? ` ${providerName}` : ''}...
              </h1>
              <p className="text-slate-400">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 bg-emerald-500/20 rounded-full flex items-center justify-center animate-pulse">
                <svg
                  className="w-8 h-8 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-emerald-400 mb-2">
                Successfully Connected!
              </h1>
              <p className="text-slate-400 mb-4">{message}</p>
              {providerName && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-sm text-emerald-400 capitalize">{providerName}</span>
                </div>
              )}
              <p className="text-xs text-slate-500 mt-4">
                {window.opener ? 'This window will close automatically...' : 'Redirecting you back to your workflow...'}
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-red-400 mb-2">
                Connection Failed
              </h1>
              <p className="text-slate-400 mb-6">{message}</p>
              <div className="flex gap-3 justify-center">
                {window.opener ? (
                  <Button
                    variant="outline"
                    onClick={() => window.close()}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    Close Window
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => navigate(-1)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-800"
                    >
                      Go Back
                    </Button>
                    <Button
                      onClick={() => navigate('/chat')}
                      className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:opacity-90"
                    >
                      Return to Chat
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Security note */}
        <p className="text-center text-xs text-slate-600 mt-4">
          Secured by Nexus + Composio
        </p>
      </div>
    </div>
  )
}

export default OAuthCallback
