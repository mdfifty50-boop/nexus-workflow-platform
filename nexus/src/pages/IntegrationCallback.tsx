import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'

type CallbackState = 'processing' | 'success' | 'error'

export function IntegrationCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { userId } = useAuth()
  const [state, setState] = useState<CallbackState>('processing')
  const [message, setMessage] = useState('')
  const [providerName, setProviderName] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const stateParam = searchParams.get('state')
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      // Handle OAuth errors
      if (error) {
        setState('error')
        setMessage(errorDescription || `OAuth error: ${error}`)
        return
      }

      // Validate required params
      if (!code || !stateParam) {
        setState('error')
        setMessage('Missing authorization code or state parameter')
        return
      }

      // Verify state matches stored state
      const storedState = sessionStorage.getItem('oauth_state')
      if (storedState !== stateParam) {
        setState('error')
        setMessage('Invalid state parameter - possible CSRF attack')
        return
      }

      // Parse state to get provider and project info
      let parsedState: { providerId: string; projectId: string }
      try {
        parsedState = JSON.parse(atob(stateParam.split('.')[0]))
        setProviderName(parsedState.providerId)
      } catch {
        setState('error')
        setMessage('Failed to parse OAuth state')
        return
      }

      try {
        // Exchange code for tokens
        const response = await fetch('/api/integrations/oauth/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Clerk-User-Id': userId || '',
          },
          body: JSON.stringify({
            providerId: parsedState.providerId,
            code,
            state: stateParam,
            redirectUri: `${window.location.origin}/integrations/callback`,
          }),
        })

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Failed to connect integration')
        }

        // Clear stored state
        sessionStorage.removeItem('oauth_state')

        setState('success')
        setMessage(data.message || `${parsedState.providerId} connected successfully!`)

        // Redirect back to project settings after 2 seconds
        setTimeout(() => {
          navigate(`/projects/${parsedState.projectId}/settings?tab=integrations`)
        }, 2000)
      } catch (err: any) {
        setState('error')
        setMessage(err.message || 'Failed to complete OAuth flow')
      }
    }

    if (userId) {
      handleCallback()
    }
  }, [searchParams, userId, navigate])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          {state === 'processing' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 relative">
                <div className="absolute inset-0 border-4 border-primary/30 rounded-full" />
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <h1 className="text-xl font-semibold mb-2">Connecting Integration</h1>
              <p className="text-muted-foreground">
                Please wait while we complete the authorization...
              </p>
            </>
          )}

          {state === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-semibold mb-2 text-green-600 dark:text-green-400">
                Successfully Connected!
              </h1>
              <p className="text-muted-foreground mb-4">{message}</p>
              <p className="text-sm text-muted-foreground">
                Redirecting to project settings...
              </p>
            </>
          )}

          {state === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600 dark:text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-semibold mb-2 text-red-600 dark:text-red-400">
                Connection Failed
              </h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={() => navigate('/integrations')}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  View Integrations
                </button>
              </div>
            </>
          )}

          {providerName && state === 'processing' && (
            <div className="mt-6 p-3 bg-muted rounded-lg">
              <p className="text-sm">
                Connecting: <span className="font-medium capitalize">{providerName}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
