import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { useToast } from '@/contexts/ToastContext'
import { useNavigate } from 'react-router-dom'

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface SystemConfig {
  // Theme & Appearance
  defaultTheme: 'light' | 'dark' | 'system'
  accentColor: string
  compactMode: boolean
  animationsEnabled: boolean

  // Notifications
  emailNotifications: boolean
  pushNotifications: boolean
  slackIntegration: boolean
  webhookUrl: string
  notificationFrequency: 'realtime' | 'hourly' | 'daily'

  // Defaults
  defaultWorkflowTimeout: number
  defaultRetryAttempts: number
  maxConcurrentExecutions: number
  autoSaveInterval: number
  sessionTimeout: number

  // Security
  requireMFA: boolean
  ipWhitelist: string[]
  allowPublicSignup: boolean
  passwordMinLength: number
  sessionIdleTimeout: number

  // Storage & Limits
  maxFileUploadSize: number
  retentionDays: number
  maxWorkflowsPerUser: number
  maxExecutionsPerDay: number
}

const DEFAULT_CONFIG: SystemConfig = {
  defaultTheme: 'dark',
  accentColor: '#06b6d4',
  compactMode: false,
  animationsEnabled: true,
  emailNotifications: true,
  pushNotifications: false,
  slackIntegration: false,
  webhookUrl: '',
  notificationFrequency: 'realtime',
  defaultWorkflowTimeout: 300,
  defaultRetryAttempts: 3,
  maxConcurrentExecutions: 5,
  autoSaveInterval: 30,
  sessionTimeout: 3600,
  requireMFA: false,
  ipWhitelist: [],
  allowPublicSignup: true,
  passwordMinLength: 8,
  sessionIdleTimeout: 1800,
  maxFileUploadSize: 50,
  retentionDays: 90,
  maxWorkflowsPerUser: 100,
  maxExecutionsPerDay: 1000,
}

// =============================================================================
// SYSTEM SETTINGS PAGE
// =============================================================================

export function SystemSettings() {
  const toast = useToast()
  const navigate = useNavigate()
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('appearance')
  const [hasChanges, setHasChanges] = useState(false)
  const [newIp, setNewIp] = useState('')

  // Load config from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('nexus_system_config')
    if (saved) {
      try {
        setConfig(JSON.parse(saved))
      } catch {
        // Use defaults if parse fails
      }
    }
  }, [])

  const updateConfig = <K extends keyof SystemConfig>(key: K, value: SystemConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))
    localStorage.setItem('nexus_system_config', JSON.stringify(config))
    setSaving(false)
    setHasChanges(false)
    toast.success('Settings saved', 'System configuration has been updated')
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      setConfig(DEFAULT_CONFIG)
      localStorage.removeItem('nexus_system_config')
      setHasChanges(false)
      toast.info('Settings reset', 'All settings have been restored to defaults')
    }
  }

  const handleAddIp = () => {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/
    if (!ipRegex.test(newIp.trim())) {
      toast.error('Invalid IP', 'Please enter a valid IP address or CIDR range')
      return
    }
    if (config.ipWhitelist.includes(newIp.trim())) {
      toast.warning('Duplicate IP', 'This IP is already in the whitelist')
      return
    }
    updateConfig('ipWhitelist', [...config.ipWhitelist, newIp.trim()])
    setNewIp('')
  }

  const handleRemoveIp = (ip: string) => {
    updateConfig('ipWhitelist', config.ipWhitelist.filter(i => i !== ip))
  }

  const sections = [
    { id: 'appearance', label: 'Appearance', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    )},
    { id: 'notifications', label: 'Notifications', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    )},
    { id: 'defaults', label: 'Defaults', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
    { id: 'security', label: 'Security', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )},
    { id: 'limits', label: 'Limits & Storage', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    )},
  ]

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/settings')}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              System Settings
            </h1>
          </div>
          <p className="text-slate-400">Configure global platform settings and defaults</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="md:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeSection === section.id
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  {section.icon}
                  <span className="font-medium">{section.label}</span>
                </button>
              ))}
            </nav>

            {/* Quick Actions */}
            <div className="mt-8 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
              <h3 className="font-medium text-white mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={handleReset}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset to Defaults
                </button>
                <button
                  onClick={() => {
                    const data = JSON.stringify(config, null, 2)
                    navigator.clipboard.writeText(data)
                    toast.success('Copied', 'Configuration exported to clipboard')
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Export Config
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            {/* Appearance Section */}
            {activeSection === 'appearance' && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Appearance</h2>
                <div className="space-y-6">
                  {/* Default Theme */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Default Theme</label>
                    <div className="flex gap-3">
                      {(['light', 'dark', 'system'] as const).map(theme => (
                        <button
                          key={theme}
                          onClick={() => updateConfig('defaultTheme', theme)}
                          className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
                            config.defaultTheme === theme
                              ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                              : 'border-slate-600 text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          <div className="font-medium capitalize">{theme}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Accent Color</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        value={config.accentColor}
                        onChange={(e) => updateConfig('accentColor', e.target.value)}
                        className="w-12 h-12 rounded-lg cursor-pointer border border-slate-600"
                      />
                      <input
                        type="text"
                        value={config.accentColor}
                        onChange={(e) => updateConfig('accentColor', e.target.value)}
                        className="flex-1 px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-sm font-mono"
                      />
                    </div>
                  </div>

                  {/* Compact Mode */}
                  <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                    <div>
                      <p className="font-medium text-white">Compact Mode</p>
                      <p className="text-sm text-slate-400">Reduce spacing and padding throughout the UI</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.compactMode}
                        onChange={(e) => updateConfig('compactMode', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                  </div>

                  {/* Animations */}
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-white">Enable Animations</p>
                      <p className="text-sm text-slate-400">Show smooth transitions and animations</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.animationsEnabled}
                        onChange={(e) => updateConfig('animationsEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Notifications</h2>
                <div className="space-y-6">
                  {/* Email Notifications */}
                  <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                    <div>
                      <p className="font-medium text-white">Email Notifications</p>
                      <p className="text-sm text-slate-400">Send notifications via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.emailNotifications}
                        onChange={(e) => updateConfig('emailNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                  </div>

                  {/* Push Notifications */}
                  <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                    <div>
                      <p className="font-medium text-white">Push Notifications</p>
                      <p className="text-sm text-slate-400">Browser push notifications</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.pushNotifications}
                        onChange={(e) => updateConfig('pushNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                  </div>

                  {/* Slack Integration */}
                  <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                    <div>
                      <p className="font-medium text-white">Slack Integration</p>
                      <p className="text-sm text-slate-400">Send notifications to Slack</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.slackIntegration}
                        onChange={(e) => updateConfig('slackIntegration', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                  </div>

                  {/* Webhook URL */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Webhook URL</label>
                    <input
                      type="url"
                      value={config.webhookUrl}
                      onChange={(e) => updateConfig('webhookUrl', e.target.value)}
                      placeholder="https://your-webhook-url.com/endpoint"
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                    <p className="text-xs text-slate-500 mt-1">Receive notifications via webhook</p>
                  </div>

                  {/* Notification Frequency */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Notification Frequency</label>
                    <select
                      value={config.notificationFrequency}
                      onChange={(e) => updateConfig('notificationFrequency', e.target.value as 'realtime' | 'hourly' | 'daily')}
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    >
                      <option value="realtime">Real-time</option>
                      <option value="hourly">Hourly digest</option>
                      <option value="daily">Daily digest</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Defaults Section */}
            {activeSection === 'defaults' && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Default Settings</h2>
                <div className="space-y-6">
                  {/* Workflow Timeout */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Default Workflow Timeout (seconds)
                    </label>
                    <input
                      type="number"
                      value={config.defaultWorkflowTimeout}
                      onChange={(e) => updateConfig('defaultWorkflowTimeout', parseInt(e.target.value) || 300)}
                      min={30}
                      max={3600}
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                    <p className="text-xs text-slate-500 mt-1">Maximum execution time for workflows (30-3600s)</p>
                  </div>

                  {/* Retry Attempts */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Default Retry Attempts
                    </label>
                    <input
                      type="number"
                      value={config.defaultRetryAttempts}
                      onChange={(e) => updateConfig('defaultRetryAttempts', parseInt(e.target.value) || 3)}
                      min={0}
                      max={10}
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                    <p className="text-xs text-slate-500 mt-1">Number of retry attempts on failure (0-10)</p>
                  </div>

                  {/* Max Concurrent Executions */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Max Concurrent Executions
                    </label>
                    <input
                      type="number"
                      value={config.maxConcurrentExecutions}
                      onChange={(e) => updateConfig('maxConcurrentExecutions', parseInt(e.target.value) || 5)}
                      min={1}
                      max={50}
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                    <p className="text-xs text-slate-500 mt-1">Maximum workflows running at once per user (1-50)</p>
                  </div>

                  {/* Auto-save Interval */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Auto-save Interval (seconds)
                    </label>
                    <input
                      type="number"
                      value={config.autoSaveInterval}
                      onChange={(e) => updateConfig('autoSaveInterval', parseInt(e.target.value) || 30)}
                      min={10}
                      max={300}
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                    <p className="text-xs text-slate-500 mt-1">How often to auto-save workflow changes (10-300s)</p>
                  </div>
                </div>
              </div>
            )}

            {/* Security Section */}
            {activeSection === 'security' && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Security</h2>
                <div className="space-y-6">
                  {/* Require MFA */}
                  <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                    <div>
                      <p className="font-medium text-white">Require MFA</p>
                      <p className="text-sm text-slate-400">Force all users to enable two-factor auth</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.requireMFA}
                        onChange={(e) => updateConfig('requireMFA', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                  </div>

                  {/* Allow Public Signup */}
                  <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                    <div>
                      <p className="font-medium text-white">Allow Public Signup</p>
                      <p className="text-sm text-slate-400">Let anyone create an account</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.allowPublicSignup}
                        onChange={(e) => updateConfig('allowPublicSignup', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                  </div>

                  {/* Password Min Length */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Minimum Password Length
                    </label>
                    <input
                      type="number"
                      value={config.passwordMinLength}
                      onChange={(e) => updateConfig('passwordMinLength', parseInt(e.target.value) || 8)}
                      min={6}
                      max={32}
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                  </div>

                  {/* Session Idle Timeout */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Session Idle Timeout (seconds)
                    </label>
                    <input
                      type="number"
                      value={config.sessionIdleTimeout}
                      onChange={(e) => updateConfig('sessionIdleTimeout', parseInt(e.target.value) || 1800)}
                      min={300}
                      max={86400}
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                    <p className="text-xs text-slate-500 mt-1">Auto-logout after inactivity (5min-24hr)</p>
                  </div>

                  {/* IP Whitelist */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">IP Whitelist</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newIp}
                        onChange={(e) => setNewIp(e.target.value)}
                        placeholder="192.168.1.0/24"
                        className="flex-1 px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                      />
                      <Button onClick={handleAddIp} variant="outline">Add</Button>
                    </div>
                    {config.ipWhitelist.length > 0 ? (
                      <div className="space-y-2">
                        {config.ipWhitelist.map(ip => (
                          <div key={ip} className="flex items-center justify-between px-3 py-2 bg-slate-900/50 rounded-lg">
                            <code className="text-sm font-mono text-slate-300">{ip}</code>
                            <button
                              onClick={() => handleRemoveIp(ip)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">No IP restrictions. All IPs are allowed.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Limits Section */}
            {activeSection === 'limits' && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Limits & Storage</h2>
                <div className="space-y-6">
                  {/* Max File Upload Size */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Max File Upload Size (MB)
                    </label>
                    <input
                      type="number"
                      value={config.maxFileUploadSize}
                      onChange={(e) => updateConfig('maxFileUploadSize', parseInt(e.target.value) || 50)}
                      min={1}
                      max={500}
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                  </div>

                  {/* Data Retention */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Data Retention (days)
                    </label>
                    <input
                      type="number"
                      value={config.retentionDays}
                      onChange={(e) => updateConfig('retentionDays', parseInt(e.target.value) || 90)}
                      min={7}
                      max={365}
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                    <p className="text-xs text-slate-500 mt-1">How long to keep execution logs and history</p>
                  </div>

                  {/* Max Workflows Per User */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Max Workflows Per User
                    </label>
                    <input
                      type="number"
                      value={config.maxWorkflowsPerUser}
                      onChange={(e) => updateConfig('maxWorkflowsPerUser', parseInt(e.target.value) || 100)}
                      min={1}
                      max={1000}
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                  </div>

                  {/* Max Executions Per Day */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Max Executions Per Day
                    </label>
                    <input
                      type="number"
                      value={config.maxExecutionsPerDay}
                      onChange={(e) => updateConfig('maxExecutionsPerDay', parseInt(e.target.value) || 1000)}
                      min={10}
                      max={100000}
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                    <p className="text-xs text-slate-500 mt-1">Per-user daily execution limit</p>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-6 flex items-center justify-between">
              <div>
                {hasChanges && (
                  <span className="text-sm text-amber-400">You have unsaved changes</span>
                )}
              </div>
              <Button onClick={handleSave} disabled={saving || !hasChanges}>
                {saving ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </span>
                ) : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
