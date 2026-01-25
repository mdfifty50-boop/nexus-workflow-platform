import { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'

interface ConnectionWizardProps {
  integration: {
    id: string
    name: string
    icon: string
    description: string
    setupUrl?: string
    envVar: string
    features: string[]
  }
  onClose: () => void
  onConnect: (apiKey: string) => Promise<boolean>
}

type WizardStep = 'intro' | 'get-key' | 'enter-key' | 'testing' | 'success' | 'error'

// Integration-specific setup guides
const SETUP_GUIDES: Record<string, {
  steps: string[]
  keyFormat: string
  keyPrefix: string
  placeholder: string
  helpUrl: string
  videoUrl?: string
}> = {
  anthropic: {
    steps: [
      'Go to console.anthropic.com',
      'Sign in or create an account',
      'Navigate to "API Keys"',
      'Click "Create Key"',
      'Copy your new API key'
    ],
    keyFormat: 'Starts with "sk-ant-"',
    keyPrefix: 'sk-ant-',
    placeholder: 'sk-ant-api03-xxxxxxxx...',
    helpUrl: 'https://docs.anthropic.com/claude/docs/getting-access-to-claude',
  },
  resend: {
    steps: [
      'Go to resend.com',
      'Sign in or create an account',
      'Navigate to "API Keys"',
      'Click "Create API Key"',
      'Copy your new API key'
    ],
    keyFormat: 'Starts with "re_"',
    keyPrefix: 're_',
    placeholder: 're_xxxxxxxx...',
    helpUrl: 'https://resend.com/docs/api-reference/api-keys/create-api-key',
  },
  hubspot: {
    steps: [
      'Go to app.hubspot.com',
      'Navigate to Settings → Integrations',
      'Click "Private Apps"',
      'Create a new private app',
      'Copy your access token'
    ],
    keyFormat: 'Starts with "pat-"',
    keyPrefix: 'pat-',
    placeholder: 'pat-xxxxxxxx...',
    helpUrl: 'https://developers.hubspot.com/docs/api/private-apps',
  },
  supabase: {
    steps: [
      'Go to supabase.com',
      'Open your project',
      'Navigate to Project Settings',
      'Click "API" in the sidebar',
      'Copy the "anon/public" key'
    ],
    keyFormat: 'JWT token',
    keyPrefix: 'eyJ',
    placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    helpUrl: 'https://supabase.com/docs/guides/api',
  },
}

export function ConnectionWizard({ integration, onClose, onConnect }: ConnectionWizardProps) {
  const [step, setStep] = useState<WizardStep>('intro')
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [error, setError] = useState('')

  const guide = SETUP_GUIDES[integration.id] || SETUP_GUIDES.anthropic

  // Session 8: Accessibility - focus trap
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const modalElement = modalRef.current
    if (!modalElement) return

    const previouslyFocused = document.activeElement as HTMLElement
    modalElement.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
      if (e.key === 'Tab') {
        const focusableElements = modalElement.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [onClose])

  const handleTest = useCallback(async () => {
    if (!apiKey.trim()) {
      setError('Please enter your API key')
      return
    }

    // Validate key format
    if (guide.keyPrefix && !apiKey.startsWith(guide.keyPrefix)) {
      setError(`API key should start with "${guide.keyPrefix}"`)
      return
    }

    setStep('testing')
    setError('')

    try {
      const success = await onConnect(apiKey)
      if (success) {
        setStep('success')
      } else {
        setStep('error')
        setError('Connection failed. Please check your API key and try again.')
      }
    } catch (err) {
      setStep('error')
      setError(err instanceof Error ? err.message : 'Connection failed')
    }
  }, [apiKey, guide.keyPrefix, onConnect])

  const renderStep = () => {
    switch (step) {
      case 'intro':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">
                {integration.icon}
              </div>
              <h2 id="connection-wizard-title" className="text-2xl font-bold">Connect {integration.name}</h2>
              <p className="text-muted-foreground mt-2">{integration.description}</p>
            </div>

            <div className="bg-accent/50 rounded-xl p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="text-lg">✨</span> What you'll get
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {integration.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                className="w-full"
                onClick={() => setStep('get-key')}
              >
                I have an API key
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => {
                  window.open(integration.setupUrl, '_blank')
                  setStep('get-key')
                }}
              >
                I need to get an API key
              </Button>
            </div>
          </div>
        )

      case 'get-key':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => setStep('intro')}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                ←
              </button>
              <h2 className="text-xl font-bold">Get your {integration.name} API Key</h2>
            </div>

            <div className="bg-accent/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Quick Setup Guide</h3>
                <a
                  href={guide.helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Full docs →
                </a>
              </div>
              <ol className="space-y-3">
                {guide.steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm pt-0.5">{s}</span>
                  </li>
                ))}
              </ol>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                window.open(integration.setupUrl, '_blank')
              }}
            >
              Open {integration.name} Console
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => setStep('enter-key')}
            >
              I have my API key ready
            </Button>
          </div>
        )

      case 'enter-key':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => setStep('get-key')}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                ←
              </button>
              <h2 className="text-xl font-bold">Enter your API Key</h2>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">
                {integration.name} API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value)
                    setError('')
                  }}
                  placeholder={guide.placeholder}
                  className="w-full px-4 py-3 bg-accent/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? '🙈' : '👁️'}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {guide.keyFormat}
              </p>
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-lg">🔒</span>
                <div>
                  <h4 className="font-medium text-emerald-400">Your key is secure</h4>
                  <p className="text-sm text-muted-foreground">
                    API keys are encrypted and stored securely. They're never shared or exposed.
                  </p>
                </div>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={handleTest}
              disabled={!apiKey.trim()}
            >
              Test Connection
            </Button>
          </div>
        )

      case 'testing':
        return (
          <div className="space-y-6 text-center py-8">
            <div className="w-20 h-20 mx-auto relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <div className="absolute inset-2 bg-primary/30 rounded-full animate-pulse" />
              <div className="absolute inset-4 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                <span className="text-2xl animate-spin">⚙️</span>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold">Testing Connection</h2>
              <p className="text-muted-foreground mt-2">
                Verifying your API key with {integration.name}...
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span>This usually takes a few seconds</span>
            </div>
          </div>
        )

      case 'success':
        return (
          <div className="space-y-6 text-center py-8">
            <div className="w-24 h-24 mx-auto relative">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" style={{ animationDuration: '1.5s' }} />
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center">
                <span className="text-4xl">✓</span>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-emerald-400">Connected!</h2>
              <p className="text-muted-foreground mt-2">
                {integration.name} is now ready to use in your workflows.
              </p>
            </div>

            <div className="bg-accent/50 rounded-xl p-4">
              <h3 className="font-semibold mb-3">You can now:</h3>
              <div className="space-y-2 text-left">
                {integration.features.slice(0, 3).map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm">
                    <span className="text-emerald-500">✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={onClose}
            >
              Done
            </Button>
          </div>
        )

      case 'error':
        return (
          <div className="space-y-6 text-center py-8">
            <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
              <span className="text-4xl">✕</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-400">Connection Failed</h2>
              <p className="text-muted-foreground mt-2">{error}</p>
            </div>

            <div className="bg-accent/50 rounded-xl p-4 text-left">
              <h3 className="font-semibold mb-2">Troubleshooting tips:</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Make sure your API key is correct</li>
                <li>• Check that the key has the required permissions</li>
                <li>• Verify your {integration.name} account is active</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => setStep('enter-key')}
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => window.open(guide.helpUrl, '_blank')}
              >
                Get Help
              </Button>
            </div>
          </div>
        )
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="connection-wizard-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto outline-none"
      >
        <div className="p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close connection wizard"
            className="absolute top-4 right-4 p-2 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          >
            <span aria-hidden="true">✕</span>
          </button>

          {/* Progress indicator */}
          {step !== 'testing' && step !== 'success' && step !== 'error' && (
            <div className="flex items-center gap-2 mb-6">
              {['intro', 'get-key', 'enter-key'].map((s, i) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    ['intro', 'get-key', 'enter-key'].indexOf(step) >= i
                      ? 'bg-primary'
                      : 'bg-accent'
                  }`}
                />
              ))}
            </div>
          )}

          {renderStep()}
        </div>
      </div>
    </div>
  )
}
