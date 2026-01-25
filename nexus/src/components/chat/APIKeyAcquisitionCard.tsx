/**
 * API Key Acquisition Card
 *
 * A smart card that helps users get API keys for apps that require manual authentication.
 *
 * Flow:
 * 1. Initial: Shows app info + "Get API Key" button
 * 2. Waiting: User clicked button, shows steps + paste input with clipboard detection
 * 3. Validating: Key pasted, validating format
 * 4. Testing: Format valid, testing connection
 * 5. Success: Connected! Ready to use
 * 6. Error: Shows error with retry option
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ExternalLink, Key, Check, X, Loader2, ClipboardPaste, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

interface APIKeyAcquisitionCardProps {
  appName: string
  displayName: string
  apiDocsUrl: string
  apiKeyUrl?: string
  steps: string[]
  keyHint: string
  category?: string
  onConnected?: (appName: string) => void
  onDismiss?: () => void
}

type CardState = 'initial' | 'waiting' | 'validating' | 'testing' | 'success' | 'error'

export function APIKeyAcquisitionCard({
  appName,
  displayName,
  apiDocsUrl,
  apiKeyUrl,
  steps,
  keyHint,
  category,
  onConnected,
  onDismiss,
}: APIKeyAcquisitionCardProps) {
  const [state, setState] = useState<CardState>('initial')
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showSteps, setShowSteps] = useState(false)
  const [clipboardAvailable, setClipboardAvailable] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Check clipboard API availability
  useEffect(() => {
    setClipboardAvailable(!!navigator.clipboard?.readText)
  }, [])

  // Focus input when entering waiting state
  useEffect(() => {
    if (state === 'waiting' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [state])

  // Handle opening API docs
  const handleGetApiKey = useCallback(() => {
    // Open API key page in new tab
    window.open(apiKeyUrl || apiDocsUrl, '_blank', 'noopener,noreferrer')
    setState('waiting')
    setShowSteps(true)
  }, [apiDocsUrl, apiKeyUrl])

  // Handle paste from clipboard
  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text.trim()) {
        setApiKey(text.trim())
        validateAndSave(text.trim())
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err)
      // Fall back to manual paste
      inputRef.current?.focus()
    }
  }, [])

  // Handle manual input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim()
    setApiKey(value)
    setError(null)
  }, [])

  // Handle Enter key
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && apiKey) {
      validateAndSave(apiKey)
    }
  }, [apiKey])

  // Validate and save the API key
  const validateAndSave = async (key: string) => {
    if (!key) return

    setState('validating')
    setError(null)

    try {
      // First validate format
      const validateRes = await fetch('/api/custom-integrations/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appName, apiKey: key }),
      })
      const validateData = await validateRes.json()

      if (!validateData.formatValid) {
        setState('error')
        setError(validateData.error || 'Invalid key format')
        return
      }

      // Test the connection
      setState('testing')
      const testRes = await fetch('/api/custom-integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appName, apiKey: key }),
      })
      const testData = await testRes.json()

      if (!testData.valid) {
        setState('error')
        setError(testData.error || 'Connection test failed')
        return
      }

      // Save the credentials
      const saveRes = await fetch('/api/custom-integrations/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appName, apiKey: key, skipValidation: true }),
      })
      const saveData = await saveRes.json()

      if (!saveData.success) {
        setState('error')
        setError(saveData.error || 'Failed to save credentials')
        return
      }

      // Success!
      setState('success')
      onConnected?.(appName)
    } catch (err) {
      setState('error')
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  // Retry after error
  const handleRetry = useCallback(() => {
    setState('waiting')
    setError(null)
    setApiKey('')
  }, [])

  // Get category icon
  const getCategoryIcon = () => {
    switch (category?.toUpperCase()) {
      case 'ACCOUNTING':
        return '💰'
      case 'CRM':
        return '👥'
      case 'ERP':
        return '🏢'
      case 'ECOMMERCE':
        return '🛒'
      case 'PROJECT':
        return '📋'
      case 'HR':
        return '👔'
      case 'SUPPORT':
        return '🎧'
      case 'ANALYTICS':
        return '📊'
      case 'PAYMENTS':
        return '💳'
      default:
        return '🔌'
    }
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 max-w-md">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getCategoryIcon()}</span>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{displayName}</h3>
            <p className="text-xs text-amber-600 dark:text-amber-400">Custom API Integration</p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Initial State */}
      {state === 'initial' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This app isn't natively supported, but you can connect it with your API key.
          </p>
          <button
            onClick={handleGetApiKey}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            <Key className="w-4 h-4" />
            Get {displayName} API Key
            <ExternalLink className="w-3 h-3 ml-1" />
          </button>
        </div>
      )}

      {/* Waiting for Key */}
      {state === 'waiting' && (
        <div className="space-y-3">
          {/* Steps */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-amber-100 dark:border-amber-900">
            <button
              onClick={() => setShowSteps(!showSteps)}
              className="flex items-center justify-between w-full text-left"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Setup Steps
              </span>
              {showSteps ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            {showSteps && (
              <ol className="mt-2 space-y-1">
                {steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span className="flex-shrink-0 w-4 h-4 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Input */}
          <div className="space-y-2">
            <label className="text-xs text-gray-500 dark:text-gray-400 block">
              Paste your API key here ({keyHint})
            </label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="password"
                value={apiKey}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Paste API key..."
                className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              {clipboardAvailable && (
                <button
                  onClick={handlePasteFromClipboard}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  title="Paste from clipboard"
                >
                  <ClipboardPaste className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={() => validateAndSave(apiKey)}
            disabled={!apiKey}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <Key className="w-4 h-4" />
            Connect {displayName}
          </button>

          {/* Open docs again */}
          <a
            href={apiKeyUrl || apiDocsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
          >
            Open API page again
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Validating */}
      {state === 'validating' && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Validating key format...</span>
        </div>
      )}

      {/* Testing */}
      {state === 'testing' && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Testing connection...</span>
        </div>
      )}

      {/* Success */}
      {state === 'success' && (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <Check className="w-5 h-5" />
            <span className="font-medium">Connected to {displayName}!</span>
          </div>
          <p className="text-xs text-green-600 dark:text-green-500 mt-1">
            You can now include {displayName} in your workflows.
          </p>
        </div>
      )}

      {/* Error */}
      {state === 'error' && (
        <div className="space-y-3">
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <X className="w-5 h-5" />
              <span className="font-medium">Connection Failed</span>
            </div>
            <p className="text-xs text-red-600 dark:text-red-500 mt-1">{error}</p>
          </div>
          <button
            onClick={handleRetry}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}

export default APIKeyAcquisitionCard
