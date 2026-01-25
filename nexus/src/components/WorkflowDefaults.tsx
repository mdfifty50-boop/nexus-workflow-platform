import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/contexts/ToastContext'

interface WorkflowDefaultsProps {
  className?: string
}

interface WorkflowDefaultSettings {
  defaultModel: string
  defaultProvider: string
  maxCostLimit: number
  maxTokens: number
  timeout: number
  retryAttempts: number
  notifyOnComplete: boolean
  notifyOnError: boolean
  notifyOnCostWarning: boolean
  costWarningThreshold: number
  autoSave: boolean
  autoSaveInterval: number
  defaultDescription: string
  defaultTags: string[]
  enableLogging: boolean
  logRetentionDays: number
}

const AI_MODELS = [
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'OpenAI' },
  { value: 'gpt-4', label: 'GPT-4', provider: 'OpenAI' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'OpenAI' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus', provider: 'Anthropic' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet', provider: 'Anthropic' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku', provider: 'Anthropic' },
  { value: 'gemini-pro', label: 'Gemini Pro', provider: 'Google' },
  { value: 'gemini-ultra', label: 'Gemini Ultra', provider: 'Google' },
]

const PROVIDERS = ['OpenAI', 'Anthropic', 'Google']

export function WorkflowDefaults({ className }: WorkflowDefaultsProps) {
  const toast = useToast()
  const [saving, setSaving] = useState(false)

  // Load saved settings
  const [settings, setSettings] = useState<WorkflowDefaultSettings>(() => {
    const saved = localStorage.getItem('nexus_workflow_defaults')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        // Return defaults if parse fails
      }
    }
    return {
      defaultModel: 'gpt-4-turbo',
      defaultProvider: 'OpenAI',
      maxCostLimit: 10,
      maxTokens: 4096,
      timeout: 300,
      retryAttempts: 3,
      notifyOnComplete: true,
      notifyOnError: true,
      notifyOnCostWarning: true,
      costWarningThreshold: 5,
      autoSave: true,
      autoSaveInterval: 60,
      defaultDescription: '',
      defaultTags: [],
      enableLogging: true,
      logRetentionDays: 30,
    }
  })

  const [tagInput, setTagInput] = useState('')

  // Auto-save settings
  useEffect(() => {
    localStorage.setItem('nexus_workflow_defaults', JSON.stringify(settings))
  }, [settings])

  const updateSetting = <K extends keyof WorkflowDefaultSettings>(
    key: K,
    value: WorkflowDefaultSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 800))
    localStorage.setItem('nexus_workflow_defaults', JSON.stringify(settings))
    setSaving(false)
    toast.success('Defaults saved', 'Your workflow default settings have been updated')
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all workflow defaults?')) {
      const defaults: WorkflowDefaultSettings = {
        defaultModel: 'gpt-4-turbo',
        defaultProvider: 'OpenAI',
        maxCostLimit: 10,
        maxTokens: 4096,
        timeout: 300,
        retryAttempts: 3,
        notifyOnComplete: true,
        notifyOnError: true,
        notifyOnCostWarning: true,
        costWarningThreshold: 5,
        autoSave: true,
        autoSaveInterval: 60,
        defaultDescription: '',
        defaultTags: [],
        enableLogging: true,
        logRetentionDays: 30,
      }
      setSettings(defaults)
      toast.success('Defaults reset', 'Workflow defaults have been reset')
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !settings.defaultTags.includes(tagInput.trim())) {
      updateSetting('defaultTags', [...settings.defaultTags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    updateSetting('defaultTags', settings.defaultTags.filter(t => t !== tag))
  }

  const filteredModels = AI_MODELS.filter(m => m.provider === settings.defaultProvider)

  const ToggleRow = ({
    label,
    description,
    checked,
    onChange
  }: {
    label: string
    description: string
    checked: boolean
    onChange: (checked: boolean) => void
  }) => (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
      <div className="flex-1 pr-4">
        <Label className="font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
      </label>
    </div>
  )

  return (
    <div className={className}>
      <div className="space-y-8">
        {/* AI Model Settings */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Default AI Model</h3>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="provider">AI Provider</Label>
              <select
                id="provider"
                value={settings.defaultProvider}
                onChange={(e) => {
                  updateSetting('defaultProvider', e.target.value)
                  // Reset model when provider changes
                  const firstModel = AI_MODELS.find(m => m.provider === e.target.value)
                  if (firstModel) {
                    updateSetting('defaultModel', firstModel.value)
                  }
                }}
                className="w-full px-3 py-2 bg-input border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {PROVIDERS.map(provider => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="model">Default Model</Label>
              <select
                id="model"
                value={settings.defaultModel}
                onChange={(e) => updateSetting('defaultModel', e.target.value)}
                className="w-full px-3 py-2 bg-input border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {filteredModels.map(model => (
                  <option key={model.value} value={model.value}>{model.label}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                This model will be used by default for new AI nodes in workflows
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="maxTokens">Max Tokens</Label>
              <Input
                id="maxTokens"
                type="number"
                value={settings.maxTokens}
                onChange={(e) => updateSetting('maxTokens', parseInt(e.target.value) || 0)}
                min={1}
                max={128000}
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of tokens for AI responses (1 - 128,000)
              </p>
            </div>
          </div>
        </div>

        {/* Cost Limits */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Cost Management</h3>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="maxCost">Maximum Cost Limit ($)</Label>
              <Input
                id="maxCost"
                type="number"
                value={settings.maxCostLimit}
                onChange={(e) => updateSetting('maxCostLimit', parseFloat(e.target.value) || 0)}
                min={0}
                step={0.5}
              />
              <p className="text-xs text-muted-foreground">
                Workflow execution will pause if estimated cost exceeds this limit
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="costWarning">Cost Warning Threshold ($)</Label>
              <Input
                id="costWarning"
                type="number"
                value={settings.costWarningThreshold}
                onChange={(e) => updateSetting('costWarningThreshold', parseFloat(e.target.value) || 0)}
                min={0}
                step={0.5}
              />
              <p className="text-xs text-muted-foreground">
                You will be notified when cost reaches this amount
              </p>
            </div>

            {/* Cost visualization */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Cost limits</span>
                <span className="font-medium">${settings.costWarningThreshold} / ${settings.maxCostLimit}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
                  style={{ width: `${(settings.costWarningThreshold / settings.maxCostLimit) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>$0</span>
                <span className="text-yellow-500">Warning</span>
                <span className="text-red-500">Limit</span>
              </div>
            </div>
          </div>
        </div>

        {/* Execution Settings */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Execution Settings</h3>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="timeout">Timeout (seconds)</Label>
              <Input
                id="timeout"
                type="number"
                value={settings.timeout}
                onChange={(e) => updateSetting('timeout', parseInt(e.target.value) || 0)}
                min={30}
                max={3600}
              />
              <p className="text-xs text-muted-foreground">
                Maximum time a workflow can run before timing out (30 - 3600 seconds)
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="retries">Retry Attempts</Label>
              <Input
                id="retries"
                type="number"
                value={settings.retryAttempts}
                onChange={(e) => updateSetting('retryAttempts', parseInt(e.target.value) || 0)}
                min={0}
                max={10}
              />
              <p className="text-xs text-muted-foreground">
                Number of times to retry failed steps (0 - 10)
              </p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Workflow Notifications</h3>
          <div className="space-y-0">
            <ToggleRow
              label="Notify on Completion"
              description="Get notified when a workflow finishes successfully"
              checked={settings.notifyOnComplete}
              onChange={(checked) => updateSetting('notifyOnComplete', checked)}
            />
            <ToggleRow
              label="Notify on Error"
              description="Get notified when a workflow encounters an error"
              checked={settings.notifyOnError}
              onChange={(checked) => updateSetting('notifyOnError', checked)}
            />
            <ToggleRow
              label="Notify on Cost Warning"
              description="Get notified when cost reaches the warning threshold"
              checked={settings.notifyOnCostWarning}
              onChange={(checked) => updateSetting('notifyOnCostWarning', checked)}
            />
          </div>
        </div>

        {/* Auto-Save Settings */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Auto-Save</h3>
          <div className="space-y-4">
            <ToggleRow
              label="Enable Auto-Save"
              description="Automatically save workflow changes while editing"
              checked={settings.autoSave}
              onChange={(checked) => updateSetting('autoSave', checked)}
            />
            {settings.autoSave && (
              <div className="grid gap-2 pt-2">
                <Label htmlFor="autoSaveInterval">Auto-Save Interval (seconds)</Label>
                <Input
                  id="autoSaveInterval"
                  type="number"
                  value={settings.autoSaveInterval}
                  onChange={(e) => updateSetting('autoSaveInterval', parseInt(e.target.value) || 30)}
                  min={10}
                  max={300}
                />
              </div>
            )}
          </div>
        </div>

        {/* Default Tags */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Default Tags</h3>
          <p className="text-sm text-muted-foreground mb-4">
            These tags will be automatically applied to new workflows
          </p>

          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Add a tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTag()}
            />
            <Button variant="outline" onClick={addTag}>Add</Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {settings.defaultTags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="hover:text-destructive transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
            {settings.defaultTags.length === 0 && (
              <span className="text-sm text-muted-foreground">No default tags set</span>
            )}
          </div>
        </div>

        {/* Logging Settings */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Logging</h3>
          <div className="space-y-4">
            <ToggleRow
              label="Enable Execution Logs"
              description="Keep detailed logs of workflow executions"
              checked={settings.enableLogging}
              onChange={(checked) => updateSetting('enableLogging', checked)}
            />
            {settings.enableLogging && (
              <div className="grid gap-2 pt-2">
                <Label htmlFor="logRetention">Log Retention (days)</Label>
                <Input
                  id="logRetention"
                  type="number"
                  value={settings.logRetentionDays}
                  onChange={(e) => updateSetting('logRetentionDays', parseInt(e.target.value) || 7)}
                  min={1}
                  max={365}
                />
                <p className="text-xs text-muted-foreground">
                  Logs older than this will be automatically deleted
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Workflow Defaults'}
          </Button>
        </div>
      </div>
    </div>
  )
}
