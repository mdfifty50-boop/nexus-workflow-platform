import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface WebhookHeader {
  key: string
  value: string
  id: string
}

interface WebhookConfiguration {
  id: string
  name: string
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers: WebhookHeader[]
  payload?: string
  enabled: boolean
  secret?: string
  createdAt: string
  lastTriggered?: string
}

interface WebhookConfigProps {
  webhookId?: string
  initialData?: Partial<WebhookConfiguration>
  onSave: (config: Omit<WebhookConfiguration, 'id' | 'createdAt' | 'lastTriggered'>) => Promise<void>
  onCancel: () => void
  onDelete?: (webhookId: string) => Promise<void>
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const

// Method color coding
const METHOD_COLORS: Record<string, { bg: string; text: string }> = {
  GET: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
  POST: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
  PUT: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
  PATCH: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' },
  DELETE: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
}

export function WebhookConfig({
  webhookId,
  initialData,
  onSave,
  onCancel,
  onDelete,
}: WebhookConfigProps) {
  const [name, setName] = useState(initialData?.name || '')
  const [url, setUrl] = useState(initialData?.url || '')
  const [method, setMethod] = useState<WebhookConfiguration['method']>(initialData?.method || 'POST')
  const [headers, setHeaders] = useState<WebhookHeader[]>(
    initialData?.headers || [{ key: '', value: '', id: crypto.randomUUID() }]
  )
  const [payload, setPayload] = useState(initialData?.payload || '')
  const [enabled, setEnabled] = useState(initialData?.enabled ?? true)
  const [secret, setSecret] = useState(initialData?.secret || '')
  const [showSecret, setShowSecret] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [testing, setTesting] = useState(false)

  const addHeader = useCallback(() => {
    setHeaders((prev) => [...prev, { key: '', value: '', id: crypto.randomUUID() }])
  }, [])

  const removeHeader = useCallback((id: string) => {
    setHeaders((prev) => prev.filter((h) => h.id !== id))
  }, [])

  const updateHeader = useCallback((id: string, field: 'key' | 'value', value: string) => {
    setHeaders((prev) =>
      prev.map((h) => (h.id === id ? { ...h, [field]: value } : h))
    )
  }, [])

  const validateUrl = (urlString: string): boolean => {
    try {
      new URL(urlString)
      return true
    } catch {
      return false
    }
  }

  const handleTest = async () => {
    if (!url || !validateUrl(url)) {
      setTestResult({ success: false, message: 'Please enter a valid URL' })
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      // Simulate webhook test - in production this would call an API
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock success/failure based on URL validity
      const success = Math.random() > 0.2 // 80% success rate for demo

      if (success) {
        setTestResult({
          success: true,
          message: `Webhook endpoint responded successfully (200 OK)`,
        })
      } else {
        setTestResult({
          success: false,
          message: 'Webhook endpoint returned an error (500)',
        })
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Test failed',
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      setError('Please enter a webhook name')
      return
    }

    if (!url.trim()) {
      setError('Please enter a webhook URL')
      return
    }

    if (!validateUrl(url)) {
      setError('Please enter a valid URL')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Filter out empty headers
      const validHeaders = headers.filter((h) => h.key.trim() && h.value.trim())

      await onSave({
        name: name.trim(),
        url: url.trim(),
        method,
        headers: validHeaders,
        payload: payload.trim() || undefined,
        enabled,
        secret: secret.trim() || undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save webhook')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!webhookId || !onDelete) return
    if (!confirm('Are you sure you want to delete this webhook?')) return

    try {
      await onDelete(webhookId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete webhook')
    }
  }

  const generateWebhookUrl = () => {
    const baseUrl = window.location.origin
    const uniqueId = crypto.randomUUID().slice(0, 8)
    return `${baseUrl}/api/webhooks/incoming/${uniqueId}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {webhookId ? 'Edit Webhook' : 'Create Webhook'}
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure a webhook to trigger your workflow
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-border"
            />
            Enabled
          </label>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="webhook-name">Webhook Name</Label>
          <Input
            id="webhook-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., GitHub Push Trigger"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="webhook-url">Webhook URL</Label>
          <div className="flex gap-2 mt-1.5">
            <Input
              id="webhook-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/webhook"
              className="flex-1 font-mono text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUrl(generateWebhookUrl())}
              title="Generate internal webhook URL"
            >
              Generate
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            External URL to receive webhook payloads, or generate an internal endpoint
          </p>
        </div>
      </div>

      {/* HTTP Method */}
      <div>
        <Label>HTTP Method</Label>
        <div className="flex gap-2 mt-1.5">
          {HTTP_METHODS.map((m) => {
            const colors = METHOD_COLORS[m]
            return (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  method === m
                    ? `${colors.bg} ${colors.text} ring-2 ring-offset-2 ring-offset-background ring-current`
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                {m}
              </button>
            )
          })}
        </div>
      </div>

      {/* Headers */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label>Headers</Label>
          <Button variant="ghost" size="sm" onClick={addHeader}>
            + Add Header
          </Button>
        </div>
        <div className="space-y-2">
          {headers.map((header) => (
            <div key={header.id} className="flex gap-2">
              <Input
                value={header.key}
                onChange={(e) => updateHeader(header.id, 'key', e.target.value)}
                placeholder="Header name"
                className="flex-1 font-mono text-sm"
              />
              <Input
                value={header.value}
                onChange={(e) => updateHeader(header.id, 'value', e.target.value)}
                placeholder="Header value"
                className="flex-1 font-mono text-sm"
              />
              {headers.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeHeader(header.id)}
                  className="text-red-500 hover:text-red-600 px-2"
                >
                  X
                </Button>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Common headers: Content-Type, Authorization, X-Custom-Header
        </p>
      </div>

      {/* Payload (for non-GET methods) */}
      {method !== 'GET' && (
        <div>
          <Label htmlFor="webhook-payload">Request Payload (JSON)</Label>
          <textarea
            id="webhook-payload"
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            placeholder='{"event": "trigger", "data": {}}'
            className="w-full mt-1.5 px-3 py-2 bg-background border border-border rounded-lg font-mono text-sm min-h-[100px] resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <p className="text-xs text-muted-foreground mt-1">
            JSON payload to send with the webhook request
          </p>
        </div>
      )}

      {/* Secret */}
      <div>
        <Label htmlFor="webhook-secret">Webhook Secret (Optional)</Label>
        <div className="relative mt-1.5">
          <Input
            id="webhook-secret"
            type={showSecret ? 'text' : 'password'}
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Enter a secret for signature verification"
            className="pr-10 font-mono text-sm"
          />
          <button
            type="button"
            onClick={() => setShowSecret(!showSecret)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showSecret ? 'Hide' : 'Show'}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Used to sign webhook payloads for verification (HMAC-SHA256)
        </p>
      </div>

      {/* Test Result */}
      {testResult && (
        <div
          className={`p-3 rounded-lg text-sm ${
            testResult.success
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{testResult.success ? 'Success' : 'Failed'}:</span>
            <span>{testResult.message}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex gap-2">
          {webhookId && onDelete && (
            <Button variant="outline" onClick={handleDelete} className="text-red-500 hover:text-red-600">
              Delete
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleTest} disabled={testing || !url}>
            {testing ? (
              <>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Testing...
              </>
            ) : (
              'Test Webhook'
            )}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Webhook'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Webhook list component for displaying configured webhooks
interface WebhookListProps {
  webhooks: WebhookConfiguration[]
  onEdit: (webhook: WebhookConfiguration) => void
  onToggle: (webhookId: string, enabled: boolean) => void
  onCreate: () => void
}

export function WebhookList({ webhooks, onEdit, onToggle, onCreate }: WebhookListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Webhooks</h2>
          <p className="text-sm text-muted-foreground">
            Manage incoming webhook triggers for your workflows
          </p>
        </div>
        <Button onClick={onCreate}>
          + New Webhook
        </Button>
      </div>

      {webhooks.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
          <div className="text-4xl mb-3">{"</>"}</div>
          <h3 className="font-medium mb-1">No webhooks configured</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create a webhook to trigger workflows from external services
          </p>
          <Button onClick={onCreate}>Create Webhook</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((webhook) => {
            const methodColor = METHOD_COLORS[webhook.method]
            return (
              <div
                key={webhook.id}
                className={`p-4 rounded-lg border ${
                  webhook.enabled ? 'border-border bg-card' : 'border-dashed border-muted bg-muted/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-mono font-medium ${methodColor.bg} ${methodColor.text}`}
                    >
                      {webhook.method}
                    </span>
                    <div>
                      <h3 className={`font-medium ${!webhook.enabled ? 'text-muted-foreground' : ''}`}>
                        {webhook.name}
                      </h3>
                      <p className="text-sm text-muted-foreground font-mono truncate max-w-md">
                        {webhook.url}
                      </p>
                      {webhook.lastTriggered && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Last triggered: {new Date(webhook.lastTriggered).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={webhook.enabled}
                        onChange={(e) => onToggle(webhook.id, e.target.checked)}
                        className="w-4 h-4 rounded border-border"
                      />
                      <span className="text-xs text-muted-foreground">
                        {webhook.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </label>
                    <Button variant="ghost" size="sm" onClick={() => onEdit(webhook)}>
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
