import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ApiKey {
  id: string
  name: string
  key: string // Masked version
  prefix: string
  scopes: string[]
  createdAt: string
  lastUsedAt?: string
  expiresAt?: string
  status: 'active' | 'expired' | 'revoked'
}

interface ApiKeyManagerProps {
  apiKeys: ApiKey[]
  onCreateKey: (name: string, scopes: string[]) => Promise<{ key: string; id: string }>
  onRevokeKey: (keyId: string) => Promise<void>
  onRegenerateKey: (keyId: string) => Promise<{ key: string }>
  availableScopes?: { id: string; name: string; description: string }[]
}

// Scope definitions
const DEFAULT_SCOPES = [
  { id: 'read:workflows', name: 'Read Workflows', description: 'View workflow configurations' },
  { id: 'write:workflows', name: 'Write Workflows', description: 'Create and modify workflows' },
  { id: 'execute:workflows', name: 'Execute Workflows', description: 'Run and trigger workflows' },
  { id: 'read:integrations', name: 'Read Integrations', description: 'View connected integrations' },
  { id: 'write:integrations', name: 'Write Integrations', description: 'Manage integration connections' },
  { id: 'read:analytics', name: 'Read Analytics', description: 'View usage and analytics data' },
]

// Status styling
const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  active: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    label: 'Active',
  },
  expired: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    label: 'Expired',
  },
  revoked: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    label: 'Revoked',
  },
}

export function ApiKeyManager({
  apiKeys,
  onCreateKey,
  onRevokeKey,
  onRegenerateKey,
  availableScopes = DEFAULT_SCOPES,
}: ApiKeyManagerProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null)
  const [regeneratingKeyId, setRegeneratingKeyId] = useState<string | null>(null)
  const [regeneratedKey, setRegeneratedKey] = useState<{ id: string; key: string } | null>(null)

  const copyToClipboard = useCallback(async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKeyId(keyId)
      setTimeout(() => setCopiedKeyId(null), 2000)
    } catch {
      setError('Failed to copy to clipboard')
    }
  }, [])

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      setError('Please enter a name for the API key')
      return
    }

    if (selectedScopes.length === 0) {
      setError('Please select at least one scope')
      return
    }

    setCreating(true)
    setError(null)

    try {
      const result = await onCreateKey(newKeyName.trim(), selectedScopes)
      setNewlyCreatedKey(result.key)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create API key')
    } finally {
      setCreating(false)
    }
  }

  const handleCloseCreateModal = () => {
    setShowCreateModal(false)
    setNewKeyName('')
    setSelectedScopes([])
    setNewlyCreatedKey(null)
    setError(null)
  }

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return
    }

    try {
      await onRevokeKey(keyId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke API key')
    }
  }

  const handleRegenerateKey = async (keyId: string) => {
    if (
      !confirm(
        'Are you sure you want to regenerate this API key? The old key will stop working immediately.'
      )
    ) {
      return
    }

    setRegeneratingKeyId(keyId)
    setError(null)

    try {
      const result = await onRegenerateKey(keyId)
      setRegeneratedKey({ id: keyId, key: result.key })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate API key')
    } finally {
      setRegeneratingKeyId(null)
    }
  }

  const toggleScope = (scopeId: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scopeId) ? prev.filter((s) => s !== scopeId) : [...prev, scopeId]
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const activeKeys = apiKeys.filter((k) => k.status === 'active')
  const inactiveKeys = apiKeys.filter((k) => k.status !== 'active')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">API Keys</h2>
          <p className="text-sm text-muted-foreground">
            Manage API keys for programmatic access to your workflows
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          + Create API Key
        </Button>
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

      {/* Regenerated key notice */}
      {regeneratedKey && (
        <div className="p-4 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700">
          <div className="flex items-start gap-3">
            <span className="text-2xl">!</span>
            <div className="flex-1">
              <h4 className="font-medium text-amber-800 dark:text-amber-200">
                API Key Regenerated
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Copy your new API key now. You will not be able to see it again.
              </p>
              <div className="mt-3 p-3 bg-amber-200/50 dark:bg-amber-900/50 rounded-lg font-mono text-sm break-all">
                {regeneratedKey.key}
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(regeneratedKey.key, regeneratedKey.id)}
                >
                  {copiedKeyId === regeneratedKey.id ? 'Copied!' : 'Copy Key'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setRegeneratedKey(null)}>
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Keys */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm text-muted-foreground">
          Active Keys ({activeKeys.length})
        </h3>

        {activeKeys.length === 0 ? (
          <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed border-border">
            <div className="text-4xl mb-3">{"< />"}</div>
            <h3 className="font-medium mb-1">No active API keys</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create an API key to access your workflows programmatically
            </p>
            <Button onClick={() => setShowCreateModal(true)}>Create API Key</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {activeKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="p-4 rounded-lg border border-border bg-card"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{apiKey.name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${STATUS_STYLES[apiKey.status].bg} ${STATUS_STYLES[apiKey.status].text}`}
                      >
                        {STATUS_STYLES[apiKey.status].label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                        {apiKey.prefix}...{apiKey.key}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(`${apiKey.prefix}...${apiKey.key}`, apiKey.id)}
                        className="h-7 px-2"
                      >
                        {copiedKeyId === apiKey.id ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {apiKey.scopes.map((scope) => (
                        <span
                          key={scope}
                          className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs"
                        >
                          {scope}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Created: {formatDate(apiKey.createdAt)}</span>
                      {apiKey.lastUsedAt && (
                        <span>Last used: {formatDate(apiKey.lastUsedAt)}</span>
                      )}
                      {apiKey.expiresAt && (
                        <span>Expires: {formatDate(apiKey.expiresAt)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRegenerateKey(apiKey.id)}
                      disabled={regeneratingKeyId === apiKey.id}
                    >
                      {regeneratingKeyId === apiKey.id ? 'Regenerating...' : 'Regenerate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeKey(apiKey.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inactive Keys */}
      {inactiveKeys.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground">
            Inactive Keys ({inactiveKeys.length})
          </h3>
          <div className="space-y-2">
            {inactiveKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="p-3 rounded-lg border border-dashed border-muted bg-muted/20"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground font-medium">{apiKey.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${STATUS_STYLES[apiKey.status].bg} ${STATUS_STYLES[apiKey.status].text}`}
                    >
                      {STATUS_STYLES[apiKey.status].label}
                    </span>
                    <code className="px-2 py-0.5 bg-muted rounded text-xs font-mono text-muted-foreground">
                      {apiKey.prefix}...{apiKey.key}
                    </code>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Created: {formatDate(apiKey.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Create API Key</h2>
                <button
                  onClick={handleCloseCreateModal}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  X
                </button>
              </div>

              {newlyCreatedKey ? (
                /* Success state - show the new key */
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl text-emerald-600">OK</span>
                      <div className="flex-1">
                        <h4 className="font-medium text-emerald-800 dark:text-emerald-200">
                          API Key Created
                        </h4>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                          Make sure to copy your API key now. You will not be able to see it again!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Your API Key</Label>
                    <div className="mt-1.5 p-3 bg-muted rounded-lg font-mono text-sm break-all">
                      {newlyCreatedKey}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => copyToClipboard(newlyCreatedKey, 'new-key')}
                    >
                      {copiedKeyId === 'new-key' ? 'Copied!' : 'Copy API Key'}
                    </Button>
                    <Button variant="outline" onClick={handleCloseCreateModal}>
                      Done
                    </Button>
                  </div>
                </div>
              ) : (
                /* Create form */
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="key-name">Key Name</Label>
                    <Input
                      id="key-name"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g., Production API Key"
                      className="mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      A descriptive name to identify this key
                    </p>
                  </div>

                  <div>
                    <Label>Scopes</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Select the permissions for this API key
                    </p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {availableScopes.map((scope) => (
                        <label
                          key={scope.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedScopes.includes(scope.id)
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:bg-muted/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedScopes.includes(scope.id)}
                            onChange={() => toggleScope(scope.id)}
                            className="mt-0.5 w-4 h-4 rounded border-border"
                          />
                          <div>
                            <span className="font-medium text-sm">{scope.name}</span>
                            <p className="text-xs text-muted-foreground">{scope.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Error in modal */}
                  {error && (
                    <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-border">
                    <Button variant="outline" onClick={handleCloseCreateModal} className="flex-1">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateKey}
                      disabled={creating}
                      className="flex-1"
                    >
                      {creating ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Creating...
                        </>
                      ) : (
                        'Create Key'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
