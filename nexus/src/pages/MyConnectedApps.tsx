/**
 * My Connected Apps - Super Simple User OAuth Page
 *
 * Designed to be easy enough for anyone to use:
 * - Big, colorful app icons
 * - One-click connect buttons
 * - Clear status indicators
 * - No technical jargon
 */

import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { useToast } from '@/contexts/ToastContext'
import { useAuth } from '@/contexts/AuthContext'

// App data with friendly names and big icons
const APPS = [
  // Email & Communication
  { id: 'gmail', name: 'Gmail', description: 'Send and read your emails', icon: '📧', color: '#EA4335', category: 'Email' },
  { id: 'slack', name: 'Slack', description: 'Send messages to your team', icon: '💬', color: '#4A154B', category: 'Communication' },
  { id: 'discord', name: 'Discord', description: 'Chat with your community', icon: '🎮', color: '#5865F2', category: 'Communication' },

  // Calendar & Tasks
  { id: 'googlecalendar', name: 'Google Calendar', description: 'Create and manage events', icon: '📅', color: '#4285F4', category: 'Calendar' },
  { id: 'zoom', name: 'Zoom', description: 'Schedule video meetings', icon: '📹', color: '#2D8CFF', category: 'Meetings' },

  // Documents & Files
  { id: 'googlesheets', name: 'Google Sheets', description: 'Work with spreadsheets', icon: '📊', color: '#0F9D58', category: 'Documents' },
  { id: 'notion', name: 'Notion', description: 'Access your notes and docs', icon: '📝', color: '#000000', category: 'Documents' },
  { id: 'dropbox', name: 'Dropbox', description: 'Access your cloud files', icon: '📦', color: '#0061FF', category: 'Storage' },

  // Work Tools
  { id: 'github', name: 'GitHub', description: 'Manage code and projects', icon: '🐙', color: '#181717', category: 'Development' },
  { id: 'trello', name: 'Trello', description: 'Organize your tasks', icon: '📋', color: '#0079BF', category: 'Tasks' },
  { id: 'asana', name: 'Asana', description: 'Track your projects', icon: '✅', color: '#F06A6A', category: 'Tasks' },
  { id: 'linear', name: 'Linear', description: 'Track issues and bugs', icon: '🔷', color: '#5E6AD2', category: 'Development' },

  // Business
  { id: 'hubspot', name: 'HubSpot', description: 'Manage your contacts', icon: '🧡', color: '#FF7A59', category: 'CRM' },
  { id: 'stripe', name: 'Stripe', description: 'Handle payments', icon: '💳', color: '#635BFF', category: 'Payments' },

  // Social
  { id: 'twitter', name: 'Twitter / X', description: 'Post to your account', icon: '🐦', color: '#1DA1F2', category: 'Social' },
  { id: 'linkedin', name: 'LinkedIn', description: 'Post professionally', icon: '💼', color: '#0A66C2', category: 'Social' },
]

interface AppStatus {
  id: string
  connected: boolean
  loading?: boolean
}

export function MyConnectedApps() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const toast = useToast()
  const [appStatuses, setAppStatuses] = useState<AppStatus[]>(
    APPS.map(app => ({ id: app.id, connected: false }))
  )
  const [loading, setLoading] = useState(true)
  const [connectingApp, setConnectingApp] = useState<string | null>(null)
  const [justConnected, setJustConnected] = useState<string | null>(null)
  const [pollingApp, setPollingApp] = useState<string | null>(null)

  // Check if we just connected an app (from OAuth callback)
  useEffect(() => {
    const connectedApp = searchParams.get('connected')
    if (connectedApp) {
      setJustConnected(connectedApp)
      // Refresh status after a moment
      setTimeout(() => {
        fetchAppStatuses()
        setJustConnected(null)
      }, 2000)
    }
  }, [searchParams])

  // Polling mechanism - check for connection status while OAuth is in progress
  useEffect(() => {
    if (!pollingApp || !user?.id) return

    let pollCount = 0
    const maxPolls = 60 // Poll for up to 2 minutes (60 * 2 seconds)

    const pollForConnection = async () => {
      try {
        const response = await fetch(`/api/composio/user/${user.id}/apps`)
        const data = await response.json()

        if (data.success && data.apps) {
          const connectedApp = data.apps.find(
            (a: { id: string; connected: boolean }) => a.id === pollingApp && a.connected
          )

          if (connectedApp) {
            // App is now connected!
            setJustConnected(pollingApp)
            setPollingApp(null)
            setConnectingApp(null)

            // Update local state
            setAppStatuses(prev =>
              prev.map(app =>
                app.id === pollingApp ? { ...app, connected: true } : app
              )
            )

            toast.success(`${APPS.find(a => a.id === pollingApp)?.name || pollingApp} connected successfully!`)

            // Clear success message after 3 seconds
            setTimeout(() => setJustConnected(null), 3000)
            return // Stop polling
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
      }

      pollCount++
      if (pollCount >= maxPolls) {
        // Stop polling after timeout
        setPollingApp(null)
        setConnectingApp(null)
        console.log('OAuth polling timeout - user may need to retry')
      }
    }

    // Poll every 2 seconds
    const pollInterval = setInterval(pollForConnection, 2000)

    // Initial poll
    pollForConnection()

    return () => clearInterval(pollInterval)
  }, [pollingApp, user?.id, toast])

  // Fetch user's connected apps
  const fetchAppStatuses = async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/composio/user/${user.id}/apps`)
      const data = await response.json()

      if (data.success && data.apps) {
        setAppStatuses(
          APPS.map(app => ({
            id: app.id,
            connected: data.apps.find((a: { id: string; connected: boolean }) => a.id === app.id)?.connected || false,
          }))
        )
      }
    } catch (error) {
      console.error('Failed to fetch app statuses:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchAppStatuses()
    } else {
      setLoading(false)
    }
  }, [user?.id])

  // Connect an app
  const connectApp = async (appId: string) => {
    if (!user?.id) return

    setConnectingApp(appId)

    try {
      const response = await fetch(`/api/composio/user/${user.id}/connect/${appId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callbackUrl: `${window.location.origin}/my-apps?connected=${appId}`,
        }),
      })

      const data = await response.json()

      if (data.authUrl) {
        // Open OAuth in a new window
        window.open(data.authUrl, '_blank', 'width=600,height=700')

        // Start polling to detect when OAuth completes
        // This handles the case where the popup doesn't redirect back to our page
        setPollingApp(appId)

        toast.success(`Authorization window opened for ${APPS.find(a => a.id === appId)?.name}. Complete the sign-in and we'll detect it automatically!`)
      } else if (data.error) {
        toast.error(data.error)
        setConnectingApp(null)
      }
    } catch (error) {
      console.error('Failed to connect app:', error)
      toast.error('Connection failed. Please check your internet and try again.')
      setConnectingApp(null)
    }
    // Note: Don't reset connectingApp here - polling will handle that
  }

  // Disconnect an app
  const disconnectApp = async (appId: string) => {
    if (!user?.id) return

    const confirmed = window.confirm('Are you sure you want to disconnect this app?')
    if (!confirmed) return

    try {
      const response = await fetch(`/api/composio/user/${user.id}/disconnect/${appId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setAppStatuses(prev =>
          prev.map(app => (app.id === appId ? { ...app, connected: false } : app))
        )
        toast.success('App disconnected successfully')
      } else {
        toast.error(data.error || 'Failed to disconnect. Please try again.')
      }
    } catch (error) {
      console.error('Failed to disconnect:', error)
      toast.error('Disconnect failed. Please try again.')
    }
  }

  const connectedCount = appStatuses.filter(a => a.connected).length

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        {/* Header - Big and Friendly */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            My Connected Apps
          </h1>
          <p className="text-lg text-muted-foreground">
            Connect your favorite apps to automate your work
          </p>
        </div>

        {/* Status Summary - Clear and Simple */}
        <div className="mb-8 p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl border-2 border-green-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <span className="text-3xl">🔗</span>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {loading ? '...' : `${connectedCount} Apps Connected`}
                </div>
                <p className="text-muted-foreground">
                  {connectedCount === 0
                    ? 'Click any app below to connect it'
                    : 'Your workflows can now use these apps'}
                </p>
              </div>
            </div>
            <button
              onClick={fetchAppStatuses}
              disabled={loading}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
            >
              {loading ? 'Checking...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Success Message */}
        {justConnected && (
          <div className="mb-6 p-4 bg-green-500/20 border-2 border-green-500/40 rounded-xl flex items-center gap-3 animate-pulse">
            <span className="text-2xl">✅</span>
            <span className="text-lg font-medium">
              {APPS.find(a => a.id === justConnected)?.name || justConnected} connected successfully!
            </span>
          </div>
        )}

        {/* App Grid - Big Cards, Easy to Click */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {APPS.map(app => {
            const status = appStatuses.find(s => s.id === app.id)
            const isConnected = status?.connected || false
            const isConnecting = connectingApp === app.id

            const isPolling = pollingApp === app.id

            return (
              <div
                key={app.id}
                className={`
                  relative p-6 rounded-2xl border-2 transition-all duration-200
                  ${isConnected
                    ? 'bg-green-500/10 border-green-500/40 shadow-lg shadow-green-500/10'
                    : isPolling
                    ? 'bg-yellow-500/10 border-yellow-500/40 animate-pulse'
                    : 'bg-card border-border hover:border-primary/50 hover:shadow-lg'
                  }
                `}
              >
                {/* Connected Badge */}
                {isConnected && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg">✓</span>
                  </div>
                )}

                {/* App Icon - Big and Colorful */}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-4xl"
                  style={{ backgroundColor: `${app.color}20` }}
                >
                  {app.icon}
                </div>

                {/* App Name */}
                <h3 className="text-xl font-bold mb-1">{app.name}</h3>

                {/* Category Badge */}
                <span className="inline-block px-2 py-0.5 text-xs bg-muted rounded-full mb-2">
                  {app.category}
                </span>

                {/* Description */}
                <p className="text-muted-foreground text-sm mb-4">
                  {app.description}
                </p>

                {/* Connect/Disconnect Button - Big and Clear */}
                {isConnected ? (
                  <div className="flex gap-2">
                    <div className="flex-1 py-3 px-4 bg-green-500/20 rounded-xl text-center">
                      <span className="text-green-500 font-semibold">Connected</span>
                    </div>
                    <button
                      onClick={() => disconnectApp(app.id)}
                      className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors"
                      title="Disconnect"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => connectApp(app.id)}
                    disabled={isConnecting || isPolling || loading}
                    className={`
                      w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all
                      ${isConnecting || isPolling
                        ? 'bg-primary/50 cursor-wait'
                        : 'bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]'
                      }
                      text-primary-foreground shadow-lg
                    `}
                  >
                    {isPolling ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-pulse">🔄</span>
                        Waiting for authorization...
                      </span>
                    ) : isConnecting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span>
                        Opening sign-in...
                      </span>
                    ) : (
                      'Connect'
                    )}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Help Section - Simple Instructions */}
        <div className="mt-12 p-6 bg-blue-500/10 rounded-2xl border border-blue-500/20">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>💡</span> How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                1
              </div>
              <h3 className="font-semibold mb-1">Click Connect</h3>
              <p className="text-sm text-muted-foreground">
                Click the Connect button on any app you want to use
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                2
              </div>
              <h3 className="font-semibold mb-1">Sign In</h3>
              <p className="text-sm text-muted-foreground">
                A window will open - sign in with your account
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                3
              </div>
              <h3 className="font-semibold mb-1">Done!</h3>
              <p className="text-sm text-muted-foreground">
                Your workflows can now use this app automatically
              </p>
            </div>
          </div>
        </div>

        {/* FAQ - Common Questions */}
        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-bold">Common Questions</h2>

          <details className="p-4 bg-card rounded-xl border border-border group">
            <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
              Is my data safe?
              <span className="group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-3 text-muted-foreground">
              Yes! We never store your passwords. We use secure OAuth - the same technology used by Google, Apple, and banks. You can disconnect any app anytime.
            </p>
          </details>

          <details className="p-4 bg-card rounded-xl border border-border group">
            <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
              What can the app access?
              <span className="group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-3 text-muted-foreground">
              Each app only gets the minimum access needed. For example, Gmail access lets us send emails on your behalf - we can't change your password or access unrelated data.
            </p>
          </details>

          <details className="p-4 bg-card rounded-xl border border-border group">
            <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
              Can I disconnect anytime?
              <span className="group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-3 text-muted-foreground">
              Absolutely! Click the X button on any connected app to disconnect it instantly. You can also revoke access from within the app itself (like Google Account settings).
            </p>
          </details>
        </div>
      </div>
    </Layout>
  )
}
