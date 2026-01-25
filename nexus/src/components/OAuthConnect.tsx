import { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'

interface OAuthProvider {
  id: string
  name: string
  icon: string
  color: string
  scopes: string[]
  description: string
}

interface OAuthConnectProps {
  provider: OAuthProvider
  redirectUri?: string
  mode?: 'popup' | 'redirect'
  state?: string
  onSuccess: (code: string, state: string) => void
  onError: (error: string) => void
  onCancel?: () => void
  customScopes?: string[]
  showScopeSelector?: boolean
}

type ConnectionStatus = 'idle' | 'connecting' | 'awaiting' | 'success' | 'error'

// Provider color mapping
const PROVIDER_STYLES: Record<string, { gradient: string; hover: string }> = {
  google: {
    gradient: 'from-red-500 via-yellow-500 to-green-500',
    hover: 'hover:shadow-red-500/25',
  },
  github: {
    gradient: 'from-slate-700 to-slate-900',
    hover: 'hover:shadow-slate-500/25',
  },
  microsoft: {
    gradient: 'from-blue-500 to-cyan-500',
    hover: 'hover:shadow-blue-500/25',
  },
  slack: {
    gradient: 'from-purple-500 to-pink-500',
    hover: 'hover:shadow-purple-500/25',
  },
  salesforce: {
    gradient: 'from-blue-400 to-blue-600',
    hover: 'hover:shadow-blue-400/25',
  },
  hubspot: {
    gradient: 'from-orange-500 to-orange-600',
    hover: 'hover:shadow-orange-500/25',
  },
  default: {
    gradient: 'from-primary to-primary/80',
    hover: 'hover:shadow-primary/25',
  },
}

export function OAuthConnect({
  provider,
  redirectUri,
  mode = 'popup',
  state: externalState,
  onSuccess,
  onError,
  onCancel,
  customScopes,
  showScopeSelector = false,
}: OAuthConnectProps) {
  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const [selectedScopes, setSelectedScopes] = useState<string[]>(customScopes || provider.scopes)
  const [error, setError] = useState<string | null>(null)
  const popupRef = useRef<Window | null>(null)
  const pollIntervalRef = useRef<number | null>(null)

  const styles = PROVIDER_STYLES[provider.id] || PROVIDER_STYLES.default

  // Clean up popup and interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close()
      }
    }
  }, [])

  // Listen for messages from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin
      if (event.origin !== window.location.origin) return

      const { type, code, state, error: msgError } = event.data

      if (type === 'oauth_callback') {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
        }

        if (code && state) {
          setStatus('success')
          onSuccess(code, state)
        } else if (msgError) {
          setStatus('error')
          setError(msgError)
          onError(msgError)
        }

        if (popupRef.current && !popupRef.current.closed) {
          popupRef.current.close()
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onSuccess, onError])

  const generateState = useCallback(() => {
    return externalState || crypto.randomUUID()
  }, [externalState])

  const buildAuthUrl = useCallback(() => {
    const baseUrl = `/api/oauth/${provider.id}/authorize`
    const params = new URLSearchParams({
      redirect_uri: redirectUri || `${window.location.origin}/oauth/callback`,
      scope: selectedScopes.join(' '),
      state: generateState(),
      response_type: 'code',
    })

    return `${baseUrl}?${params.toString()}`
  }, [provider.id, redirectUri, selectedScopes, generateState])

  const handleConnect = useCallback(async () => {
    setStatus('connecting')
    setError(null)

    const authUrl = buildAuthUrl()
    const state = generateState()

    // Store state for verification
    sessionStorage.setItem('oauth_state', state)
    sessionStorage.setItem('oauth_provider', provider.id)

    if (mode === 'popup') {
      // Open popup window
      const width = 500
      const height = 700
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2

      popupRef.current = window.open(
        authUrl,
        `oauth_${provider.id}`,
        `width=${width},height=${height},left=${left},top=${top},popup=yes,toolbar=no,menubar=no`
      )

      if (!popupRef.current) {
        setStatus('error')
        setError('Popup was blocked. Please allow popups for this site.')
        onError('Popup blocked')
        return
      }

      setStatus('awaiting')

      // Poll for popup close (fallback if message doesn't come through)
      pollIntervalRef.current = window.setInterval(() => {
        if (popupRef.current?.closed) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
          }

          // Check if we got a response via localStorage
          const storedCode = sessionStorage.getItem('oauth_code')
          const storedState = sessionStorage.getItem('oauth_state_response')

          if (storedCode && storedState) {
            sessionStorage.removeItem('oauth_code')
            sessionStorage.removeItem('oauth_state_response')
            setStatus('success')
            onSuccess(storedCode, storedState)
          } else if (status === 'awaiting') {
            // User closed popup without completing
            setStatus('idle')
            onCancel?.()
          }
        }
      }, 500)
    } else {
      // Redirect mode
      window.location.href = authUrl
    }
  }, [buildAuthUrl, generateState, mode, onCancel, onError, onSuccess, provider.id, status])

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    )
  }

  const handleCancel = () => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close()
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }
    setStatus('idle')
    onCancel?.()
  }

  return (
    <div className="space-y-4">
      {/* Provider header */}
      <div className="flex items-center gap-3">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${styles.gradient} flex items-center justify-center text-2xl text-white shadow-lg`}
        >
          {provider.icon}
        </div>
        <div>
          <h3 className="font-semibold">{provider.name}</h3>
          <p className="text-sm text-muted-foreground">{provider.description}</p>
        </div>
      </div>

      {/* Scope selector */}
      {showScopeSelector && status === 'idle' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Permissions</label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {provider.scopes.map((scope) => (
              <label
                key={scope}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedScopes.includes(scope)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedScopes.includes(scope)}
                  onChange={() => toggleScope(scope)}
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm font-mono">{scope}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {selectedScopes.length} of {provider.scopes.length} permissions selected
          </p>
        </div>
      )}

      {/* Status display */}
      {status === 'connecting' && (
        <div className="p-4 rounded-lg bg-muted/50 text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Preparing connection...</span>
          </div>
        </div>
      )}

      {status === 'awaiting' && (
        <div className="p-4 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-blue-700 dark:text-blue-300">
              Waiting for authorization...
            </span>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Complete the sign-in in the popup window
          </p>
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      )}

      {status === 'success' && (
        <div className="p-4 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl text-emerald-600">OK</span>
            <span className="text-sm text-emerald-700 dark:text-emerald-300">
              Successfully connected to {provider.name}!
            </span>
          </div>
        </div>
      )}

      {status === 'error' && error && (
        <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/30 text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl text-red-600">X</span>
            <span className="text-sm text-red-700 dark:text-red-300">Connection failed</span>
          </div>
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          <Button variant="outline" size="sm" onClick={() => setStatus('idle')}>
            Try Again
          </Button>
        </div>
      )}

      {/* Connect button */}
      {status === 'idle' && (
        <Button
          onClick={handleConnect}
          className={`w-full bg-gradient-to-r ${styles.gradient} text-white shadow-lg ${styles.hover} hover:shadow-xl transition-all`}
          size="lg"
        >
          <span className="mr-2">{provider.icon}</span>
          Connect with {provider.name}
        </Button>
      )}

      {/* Mode indicator */}
      <p className="text-xs text-center text-muted-foreground">
        {mode === 'popup' ? 'Opens in a popup window' : 'Redirects to authorization page'}
      </p>
    </div>
  )
}

// OAuth callback handler component for use in callback pages
export function OAuthCallbackHandler() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState('Processing authorization...')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const error = params.get('error')
    const errorDescription = params.get('error_description')

    // Verify state
    const storedState = sessionStorage.getItem('oauth_state')

    // Process callback asynchronously to avoid effect synchronous setState issues
    const processCallback = () => {
      if (error) {
        setStatus('error')
        setMessage(errorDescription || error)

        // Send error to opener
        if (window.opener) {
          window.opener.postMessage({ type: 'oauth_callback', error: errorDescription || error }, '*')
          setTimeout(() => window.close(), 2000)
        }
        return
      }

      if (!code) {
        setStatus('error')
        setMessage('No authorization code received')
        return
      }

      if (storedState && state !== storedState) {
        setStatus('error')
        setMessage('Invalid state parameter')
        return
      }

      // Success - send code to opener
      if (window.opener) {
        window.opener.postMessage({ type: 'oauth_callback', code, state }, '*')
        setStatus('success')
        setMessage('Authorization successful! You can close this window.')
        setTimeout(() => window.close(), 1500)
      } else {
        // Store for parent to pick up
        sessionStorage.setItem('oauth_code', code)
        sessionStorage.setItem('oauth_state_response', state || '')
        setStatus('success')
        setMessage('Authorization successful! Redirecting...')

        // Redirect back
        const returnUrl = sessionStorage.getItem('oauth_return_url') || '/'
        setTimeout(() => (window.location.href = returnUrl), 1000)
      }
    }

    // Use requestAnimationFrame to defer state updates
    requestAnimationFrame(processCallback)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 text-center space-y-4">
        {status === 'processing' && (
          <>
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl text-emerald-600">OK</span>
            </div>
            <h2 className="text-xl font-semibold text-emerald-600">Success!</h2>
            <p className="text-muted-foreground">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl text-red-600">X</span>
            </div>
            <h2 className="text-xl font-semibold text-red-600">Authorization Failed</h2>
            <p className="text-muted-foreground">{message}</p>
            <Button variant="outline" onClick={() => window.close()}>
              Close Window
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

// Multi-provider OAuth selector
interface OAuthProvidersProps {
  providers: OAuthProvider[]
  onProviderSelect: (provider: OAuthProvider) => void
}

export function OAuthProviders({ providers, onProviderSelect }: OAuthProvidersProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-sm text-muted-foreground">Connect an Account</h3>
      <div className="grid gap-2">
        {providers.map((provider) => {
          const styles = PROVIDER_STYLES[provider.id] || PROVIDER_STYLES.default
          return (
            <button
              key={provider.id}
              onClick={() => onProviderSelect(provider)}
              className={`flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors ${styles.hover}`}
            >
              <div
                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${styles.gradient} flex items-center justify-center text-lg text-white`}
              >
                {provider.icon}
              </div>
              <div className="text-left">
                <span className="font-medium">{provider.name}</span>
                <p className="text-xs text-muted-foreground">{provider.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
