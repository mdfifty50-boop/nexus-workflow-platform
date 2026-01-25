import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/contexts/ToastContext'

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface FeatureFlag {
  id: string
  key: string
  name: string
  description: string
  enabled: boolean
  category: 'experimental' | 'beta' | 'core' | 'deprecated'
  createdAt: string
  updatedAt: string
  metadata?: {
    rolloutPercentage?: number
    targetUsers?: string[]
    expiresAt?: string
  }
}

const DEFAULT_FLAGS: FeatureFlag[] = [
  {
    id: '1',
    key: 'ai_workflow_suggestions',
    name: 'AI Workflow Suggestions',
    description: 'Enable AI-powered suggestions for workflow improvements and optimizations',
    enabled: true,
    category: 'beta',
    createdAt: '2025-11-15',
    updatedAt: '2026-01-10',
    metadata: { rolloutPercentage: 75 },
  },
  {
    id: '2',
    key: 'dark_mode_v2',
    name: 'Dark Mode V2',
    description: 'New dark theme with improved contrast and accessibility',
    enabled: true,
    category: 'core',
    createdAt: '2025-10-01',
    updatedAt: '2026-01-05',
  },
  {
    id: '3',
    key: 'real_time_collaboration',
    name: 'Real-time Collaboration',
    description: 'Allow multiple users to edit workflows simultaneously with live cursors',
    enabled: false,
    category: 'experimental',
    createdAt: '2025-12-20',
    updatedAt: '2026-01-08',
    metadata: { rolloutPercentage: 10 },
  },
  {
    id: '4',
    key: 'advanced_analytics',
    name: 'Advanced Analytics Dashboard',
    description: 'Detailed execution metrics, performance insights, and custom reports',
    enabled: true,
    category: 'beta',
    createdAt: '2025-11-01',
    updatedAt: '2026-01-12',
    metadata: { rolloutPercentage: 50 },
  },
  {
    id: '5',
    key: 'voice_commands',
    name: 'Voice Commands',
    description: 'Control workflows and navigate using voice commands',
    enabled: false,
    category: 'experimental',
    createdAt: '2026-01-05',
    updatedAt: '2026-01-10',
    metadata: { rolloutPercentage: 5 },
  },
  {
    id: '6',
    key: 'legacy_workflow_editor',
    name: 'Legacy Workflow Editor',
    description: 'Old workflow editor (will be removed in v3.0)',
    enabled: false,
    category: 'deprecated',
    createdAt: '2024-06-01',
    updatedAt: '2025-12-01',
    metadata: { expiresAt: '2026-03-01' },
  },
  {
    id: '7',
    key: 'workflow_templates_v2',
    name: 'Template Gallery V2',
    description: 'Redesigned template gallery with categories and search',
    enabled: true,
    category: 'core',
    createdAt: '2025-09-15',
    updatedAt: '2026-01-01',
  },
  {
    id: '8',
    key: 'ai_chatbot_enhanced',
    name: 'Enhanced AI Chatbot',
    description: 'Upgraded AI assistant with context awareness and multi-turn conversations',
    enabled: true,
    category: 'beta',
    createdAt: '2025-12-01',
    updatedAt: '2026-01-11',
    metadata: { rolloutPercentage: 80 },
  },
  {
    id: '9',
    key: 'custom_integrations',
    name: 'Custom Integration Builder',
    description: 'Build custom integrations with any API using a visual interface',
    enabled: false,
    category: 'experimental',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-08',
    metadata: { rolloutPercentage: 15 },
  },
  {
    id: '10',
    key: 'workflow_versioning',
    name: 'Workflow Version Control',
    description: 'Track changes to workflows with full version history and rollback',
    enabled: false,
    category: 'beta',
    createdAt: '2025-12-15',
    updatedAt: '2026-01-05',
    metadata: { rolloutPercentage: 30 },
  },
]

const STORAGE_KEY = 'nexus_feature_flags'

// =============================================================================
// FEATURE FLAGS COMPONENT
// =============================================================================

export function FeatureFlags() {
  const toast = useToast()
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null)

  // Form state for create/edit
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    category: 'experimental' as FeatureFlag['category'],
    rolloutPercentage: 100,
  })

  // Load flags from localStorage
  useEffect(() => {
    const loadFlags = async () => {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 400))

      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          setFlags(JSON.parse(saved))
        } catch {
          setFlags(DEFAULT_FLAGS)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_FLAGS))
        }
      } else {
        setFlags(DEFAULT_FLAGS)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_FLAGS))
      }
      setLoading(false)
    }
    loadFlags()
  }, [])

  // Save flags to localStorage
  const saveFlags = (newFlags: FeatureFlag[]) => {
    setFlags(newFlags)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newFlags))
  }

  // Toggle flag
  const handleToggle = (flagId: string) => {
    const newFlags = flags.map(flag => {
      if (flag.id === flagId) {
        const newEnabled = !flag.enabled
        toast.success(
          `Flag ${newEnabled ? 'enabled' : 'disabled'}`,
          `"${flag.name}" is now ${newEnabled ? 'enabled' : 'disabled'}`
        )
        return {
          ...flag,
          enabled: newEnabled,
          updatedAt: new Date().toISOString().split('T')[0],
        }
      }
      return flag
    })
    saveFlags(newFlags)
  }

  // Delete flag
  const handleDelete = (flagId: string) => {
    const flag = flags.find(f => f.id === flagId)
    if (!flag) return

    if (!confirm(`Are you sure you want to delete "${flag.name}"? This cannot be undone.`)) {
      return
    }

    const newFlags = flags.filter(f => f.id !== flagId)
    saveFlags(newFlags)
    toast.success('Flag deleted', `"${flag.name}" has been removed`)
  }

  // Create new flag
  const handleCreate = () => {
    if (!formData.key.trim() || !formData.name.trim()) {
      toast.error('Validation error', 'Key and name are required')
      return
    }

    if (flags.some(f => f.key === formData.key)) {
      toast.error('Duplicate key', 'A flag with this key already exists')
      return
    }

    const newFlag: FeatureFlag = {
      id: String(Date.now()),
      key: formData.key.toLowerCase().replace(/\s+/g, '_'),
      name: formData.name,
      description: formData.description,
      enabled: false,
      category: formData.category,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      metadata: formData.rolloutPercentage < 100
        ? { rolloutPercentage: formData.rolloutPercentage }
        : undefined,
    }

    saveFlags([...flags, newFlag])
    setShowCreateModal(false)
    resetForm()
    toast.success('Flag created', `"${newFlag.name}" has been created`)
  }

  // Update existing flag
  const handleUpdate = () => {
    if (!editingFlag) return

    const newFlags = flags.map(flag => {
      if (flag.id === editingFlag.id) {
        return {
          ...flag,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          updatedAt: new Date().toISOString().split('T')[0],
          metadata: {
            ...flag.metadata,
            rolloutPercentage: formData.rolloutPercentage < 100
              ? formData.rolloutPercentage
              : undefined,
          },
        }
      }
      return flag
    })

    saveFlags(newFlags)
    setEditingFlag(null)
    resetForm()
    toast.success('Flag updated', `"${formData.name}" has been updated`)
  }

  const resetForm = () => {
    setFormData({
      key: '',
      name: '',
      description: '',
      category: 'experimental',
      rolloutPercentage: 100,
    })
  }

  const openEditModal = (flag: FeatureFlag) => {
    setEditingFlag(flag)
    setFormData({
      key: flag.key,
      name: flag.name,
      description: flag.description,
      category: flag.category,
      rolloutPercentage: flag.metadata?.rolloutPercentage ?? 100,
    })
  }

  // Filter flags
  const filteredFlags = flags.filter(flag => {
    const matchesSearch =
      flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = categoryFilter === 'all' || flag.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  // Group by category for display
  const groupedFlags = filteredFlags.reduce((acc, flag) => {
    if (!acc[flag.category]) {
      acc[flag.category] = []
    }
    acc[flag.category].push(flag)
    return acc
  }, {} as Record<string, FeatureFlag[]>)

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'experimental': return 'text-purple-400 bg-purple-500/10 border-purple-500/30'
      case 'beta': return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
      case 'core': return 'text-green-400 bg-green-500/10 border-green-500/30'
      case 'deprecated': return 'text-red-400 bg-red-500/10 border-red-500/30'
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'experimental': return 'Experimental'
      case 'beta': return 'Beta'
      case 'core': return 'Core'
      case 'deprecated': return 'Deprecated'
      default: return category
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Loading feature flags...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Feature Flags</h2>
          <p className="text-sm text-slate-400 mt-1">
            Toggle experimental features and control rollouts
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Flag
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search flags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
          />
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        >
          <option value="all">All Categories</option>
          <option value="experimental">Experimental</option>
          <option value="beta">Beta</option>
          <option value="core">Core</option>
          <option value="deprecated">Deprecated</option>
        </select>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-400">
            <span className="text-green-400 font-medium">{flags.filter(f => f.enabled).length}</span> enabled
          </span>
          <span className="text-slate-400">
            <span className="text-slate-300 font-medium">{flags.length}</span> total
          </span>
        </div>
      </div>

      {/* Flags List */}
      {Object.entries(groupedFlags).length > 0 ? (
        <div className="space-y-6">
          {(['core', 'beta', 'experimental', 'deprecated'] as const)
            .filter(cat => groupedFlags[cat]?.length > 0)
            .map(category => (
              <div key={category}>
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
                  {getCategoryLabel(category)} ({groupedFlags[category].length})
                </h3>
                <div className="space-y-3">
                  {groupedFlags[category].map(flag => (
                    <div
                      key={flag.id}
                      className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-slate-600 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        {/* Toggle */}
                        <label className="relative inline-flex items-center cursor-pointer mt-1">
                          <input
                            type="checkbox"
                            checked={flag.enabled}
                            onChange={() => handleToggle(flag.id)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                        </label>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-medium text-white">{flag.name}</h4>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getCategoryColor(flag.category)}`}>
                              {getCategoryLabel(flag.category)}
                            </span>
                            {flag.metadata?.rolloutPercentage !== undefined && flag.metadata.rolloutPercentage < 100 && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full text-amber-400 bg-amber-500/10">
                                {flag.metadata.rolloutPercentage}% rollout
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-400 mb-2">{flag.description}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <code className="px-2 py-0.5 bg-slate-900/50 rounded">{flag.key}</code>
                            <span>Updated {flag.updatedAt}</span>
                            {flag.metadata?.expiresAt && (
                              <span className="text-red-400">Expires {flag.metadata.expiresAt}</span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(flag)}
                            className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(flag.id)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
          </svg>
          <p>No feature flags found matching your filters</p>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-center">
          <div className="text-2xl font-bold text-purple-400">{flags.filter(f => f.category === 'experimental').length}</div>
          <div className="text-sm text-slate-400">Experimental</div>
        </div>
        <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-center">
          <div className="text-2xl font-bold text-blue-400">{flags.filter(f => f.category === 'beta').length}</div>
          <div className="text-sm text-slate-400">Beta</div>
        </div>
        <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-center">
          <div className="text-2xl font-bold text-green-400">{flags.filter(f => f.category === 'core').length}</div>
          <div className="text-sm text-slate-400">Core</div>
        </div>
        <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-center">
          <div className="text-2xl font-bold text-red-400">{flags.filter(f => f.category === 'deprecated').length}</div>
          <div className="text-sm text-slate-400">Deprecated</div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingFlag) && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowCreateModal(false)
            setEditingFlag(null)
            resetForm()
          }}
        >
          <div
            className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">
              {editingFlag ? 'Edit Feature Flag' : 'Create Feature Flag'}
            </h3>
            <div className="space-y-4">
              {/* Key */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Key</label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                  placeholder="my_feature_flag"
                  disabled={!!editingFlag}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 disabled:opacity-50 font-mono"
                />
                <p className="text-xs text-slate-500 mt-1">Unique identifier (snake_case)</p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Feature Flag"
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What does this feature do?"
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 resize-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as FeatureFlag['category'] }))}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                >
                  <option value="experimental">Experimental - Early stage, may change</option>
                  <option value="beta">Beta - Testing with limited users</option>
                  <option value="core">Core - Stable, production ready</option>
                  <option value="deprecated">Deprecated - Being phased out</option>
                </select>
              </div>

              {/* Rollout Percentage */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Rollout Percentage: {formData.rolloutPercentage}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={formData.rolloutPercentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, rolloutPercentage: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingFlag(null)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={editingFlag ? handleUpdate : handleCreate}
              >
                {editingFlag ? 'Update Flag' : 'Create Flag'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
