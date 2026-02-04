/**
 * WhatsApp Chatbots Page
 *
 * Create and manage auto-reply rules and chatbot automation.
 * Features:
 * - Create keyword-based auto-replies
 * - Configure trigger patterns
 * - Set response messages
 * - Enable/disable rules
 * - View trigger statistics
 *
 * Uses local state with mock API integration for demo mode.
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

// =============================================================================
// TYPES
// =============================================================================

interface ChatbotRule {
  id: string
  name: string
  trigger: {
    type: 'keyword' | 'contains' | 'starts_with' | 'regex'
    value: string
    caseSensitive: boolean
  }
  response: {
    type: 'text' | 'template' | 'media'
    content: string
    mediaUrl?: string
    templateName?: string
  }
  isActive: boolean
  priority: number
  createdAt: string
  updatedAt: string
  stats: {
    triggered: number
    lastTriggered?: string
  }
}

// =============================================================================
// ICONS
// =============================================================================

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}

function BotIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
  )
}

function ZapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}

// =============================================================================
// HELPER DATA
// =============================================================================

const getMockRules = (): ChatbotRule[] => [
  {
    id: '1',
    name: 'Welcome Message',
    trigger: { type: 'keyword', value: 'hi|hello|hey', caseSensitive: false },
    response: { type: 'text', content: 'Hello! 👋 Welcome to our business. How can I help you today?' },
    isActive: true,
    priority: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: { triggered: 156, lastTriggered: new Date().toISOString() }
  },
  {
    id: '2',
    name: 'Business Hours',
    trigger: { type: 'contains', value: 'hours|timing|open', caseSensitive: false },
    response: { type: 'text', content: 'Our business hours are:\n📅 Sunday - Thursday\n🕐 9:00 AM - 6:00 PM\n\nWe are closed on Fridays and Saturdays.' },
    isActive: true,
    priority: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: { triggered: 89, lastTriggered: new Date().toISOString() }
  },
  {
    id: '3',
    name: 'Price Inquiry',
    trigger: { type: 'contains', value: 'price|cost|how much', caseSensitive: false },
    response: { type: 'text', content: 'Thank you for your interest! 💰\n\nOur pricing depends on your specific requirements. Please share more details about what you need, and our team will get back to you with a quote.' },
    isActive: true,
    priority: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: { triggered: 234, lastTriggered: new Date().toISOString() }
  },
  {
    id: '4',
    name: 'Support Request',
    trigger: { type: 'keyword', value: 'support|help|issue|problem', caseSensitive: false },
    response: { type: 'text', content: '🔧 We\'re here to help!\n\nPlease describe your issue and our support team will assist you shortly. For urgent matters, call us at +965 XXXX XXXX.' },
    isActive: false,
    priority: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: { triggered: 67 }
  },
]

// =============================================================================
// COMPONENT
// =============================================================================

export function WhatsAppChatbots() {
  const navigate = useNavigate()

  const [rules, setRules] = useState<ChatbotRule[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingRule, setEditingRule] = useState<ChatbotRule | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    triggerType: 'keyword' as ChatbotRule['trigger']['type'],
    triggerValue: '',
    caseSensitive: false,
    responseType: 'text' as ChatbotRule['response']['type'],
    responseContent: '',
    mediaUrl: '',
    templateName: '',
    priority: 1,
  })

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchRules = useCallback(async () => {
    try {
      const response = await fetch('/api/whatsapp-business/chatbot-rules')
      if (response.ok) {
        const data = await response.json()
        setRules(data.rules || [])
      } else {
        setRules(getMockRules())
      }
    } catch {
      setRules(getMockRules())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  const handleCreate = () => {
    setEditingRule(null)
    setFormData({
      name: '',
      triggerType: 'keyword',
      triggerValue: '',
      caseSensitive: false,
      responseType: 'text',
      responseContent: '',
      mediaUrl: '',
      templateName: '',
      priority: rules.length + 1,
    })
    setShowModal(true)
  }

  const handleEdit = (rule: ChatbotRule) => {
    setEditingRule(rule)
    setFormData({
      name: rule.name,
      triggerType: rule.trigger.type,
      triggerValue: rule.trigger.value,
      caseSensitive: rule.trigger.caseSensitive,
      responseType: rule.response.type,
      responseContent: rule.response.content,
      mediaUrl: rule.response.mediaUrl || '',
      templateName: rule.response.templateName || '',
      priority: rule.priority,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.triggerValue.trim()) {
      showToast('Please fill in all required fields', 'error')
      return
    }

    if (formData.responseType === 'text' && !formData.responseContent.trim()) {
      showToast('Please enter a response message', 'error')
      return
    }

    setSaving(true)
    try {
      const ruleData: ChatbotRule = {
        id: editingRule?.id || Date.now().toString(),
        name: formData.name,
        trigger: {
          type: formData.triggerType,
          value: formData.triggerValue,
          caseSensitive: formData.caseSensitive,
        },
        response: {
          type: formData.responseType,
          content: formData.responseContent,
          mediaUrl: formData.mediaUrl || undefined,
          templateName: formData.templateName || undefined,
        },
        isActive: editingRule?.isActive ?? true,
        priority: formData.priority,
        createdAt: editingRule?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: editingRule?.stats || { triggered: 0 },
      }

      if (editingRule) {
        setRules(prev => prev.map(r => r.id === editingRule.id ? ruleData : r))
      } else {
        setRules(prev => [...prev, ruleData])
      }

      showToast(editingRule ? 'Rule updated successfully' : 'Rule created successfully', 'success')
      setShowModal(false)
    } catch {
      showToast('Failed to save rule', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = (rule: ChatbotRule) => {
    const updatedRule = { ...rule, isActive: !rule.isActive }
    setRules(prev => prev.map(r => r.id === rule.id ? updatedRule : r))
    showToast(`"${rule.name}" is now ${updatedRule.isActive ? 'active' : 'inactive'}`, 'success')
  }

  const handleDelete = (rule: ChatbotRule) => {
    if (!confirm(`Are you sure you want to delete "${rule.name}"?`)) return
    setRules(prev => prev.filter(r => r.id !== rule.id))
    showToast('Rule deleted successfully', 'success')
  }

  const handleDuplicate = (rule: ChatbotRule) => {
    const newRule: ChatbotRule = {
      ...rule,
      id: Date.now().toString(),
      name: `${rule.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: { triggered: 0 },
    }
    setRules(prev => [...prev, newRule])
    showToast('Rule duplicated successfully', 'success')
  }

  const filteredRules = rules.filter(rule =>
    rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rule.trigger.value.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeCount = rules.filter(r => r.isActive).length
  const totalTriggers = rules.reduce((sum, r) => sum + r.stats.triggered, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Toast */}
        {toast && (
          <div className={cn(
            'fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all',
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          )}>
            {toast.message}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/whatsapp')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <BackIcon className="h-5 w-5 text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">Chatbots & Automation</h1>
            <p className="text-slate-600">Create auto-reply rules and chatbot flows</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Create Rule
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BotIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Rules</p>
                <p className="text-2xl font-bold">{rules.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Active</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ZapIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Triggers</p>
                <p className="text-2xl font-bold">{totalTriggers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <ClockIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Time Saved</p>
                <p className="text-2xl font-bold">~12h/wk</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Rules List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-slate-200 border-t-green-500 rounded-full" />
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <BotIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No chatbot rules yet</h3>
            <p className="text-slate-600 mb-4">Create your first auto-reply rule to get started</p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <PlusIcon className="h-4 w-4" />
              Create Rule
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRules.map((rule) => (
              <div
                key={rule.id}
                className={cn(
                  'bg-white rounded-xl p-6 border border-slate-200 transition-opacity',
                  !rule.isActive && 'opacity-60'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">{rule.name}</h3>
                      <span className={cn(
                        'px-2 py-1 text-xs font-medium rounded-full',
                        rule.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                      )}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        {rule.trigger.type}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs font-medium text-slate-500 mb-1">TRIGGER</p>
                        <p className="text-sm text-slate-700 font-mono">{rule.trigger.value}</p>
                        {rule.trigger.caseSensitive && (
                          <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-slate-200 rounded">Case Sensitive</span>
                        )}
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs font-medium text-slate-500 mb-1">RESPONSE ({rule.response.type})</p>
                        <p className="text-sm text-slate-700 line-clamp-2">
                          {rule.response.type === 'template'
                            ? `Template: ${rule.response.templateName}`
                            : rule.response.content
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mt-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <ZapIcon className="h-4 w-4" />
                        {rule.stats.triggered} triggers
                      </span>
                      {rule.stats.lastTriggered && (
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          Last: {new Date(rule.stats.lastTriggered).toLocaleDateString()}
                        </span>
                      )}
                      <span>Priority: {rule.priority}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(rule)}
                      className={cn(
                        'relative w-12 h-6 rounded-full transition-colors',
                        rule.isActive ? 'bg-green-500' : 'bg-slate-300'
                      )}
                    >
                      <span className={cn(
                        'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                        rule.isActive ? 'left-7' : 'left-1'
                      )} />
                    </button>
                    <button
                      onClick={() => handleEdit(rule)}
                      className="p-2 hover:bg-slate-100 rounded-lg"
                      title="Edit"
                    >
                      <EditIcon className="h-4 w-4 text-slate-600" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(rule)}
                      className="p-2 hover:bg-slate-100 rounded-lg"
                      title="Duplicate"
                    >
                      <CopyIcon className="h-4 w-4 text-slate-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(rule)}
                      className="p-2 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tips */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 Chatbot Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Use <code className="bg-blue-100 px-1 rounded">|</code> to match multiple keywords (e.g., "hi|hello|hey")</li>
            <li>Rules are processed in priority order - lower numbers run first</li>
            <li>Use "contains" for partial matches, "keyword" for exact matches</li>
            <li>Active rules automatically respond to incoming messages</li>
          </ul>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    {editingRule ? 'Edit Chatbot Rule' : 'Create Chatbot Rule'}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg"
                  >
                    <XIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Rule Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Welcome Message"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Trigger Section */}
                <div className="p-4 bg-slate-50 rounded-lg space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <ZapIcon className="h-4 w-4 text-amber-500" />
                    Trigger Configuration
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Trigger Type
                      </label>
                      <select
                        value={formData.triggerType}
                        onChange={(e) => setFormData({ ...formData, triggerType: e.target.value as ChatbotRule['trigger']['type'] })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="keyword">Keyword (exact match)</option>
                        <option value="contains">Contains</option>
                        <option value="starts_with">Starts with</option>
                        <option value="regex">Regex pattern</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Priority
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Trigger Value * <span className="font-normal text-slate-500">(use | for multiple)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.triggerValue}
                      onChange={(e) => setFormData({ ...formData, triggerValue: e.target.value })}
                      placeholder="e.g., hi|hello|hey"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.caseSensitive}
                      onChange={(e) => setFormData({ ...formData, caseSensitive: e.target.checked })}
                      className="rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-700">Case sensitive matching</span>
                  </label>
                </div>

                {/* Response Section */}
                <div className="p-4 bg-slate-50 rounded-lg space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <MessageIcon className="h-4 w-4 text-green-500" />
                    Response Configuration
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Response Type
                    </label>
                    <select
                      value={formData.responseType}
                      onChange={(e) => setFormData({ ...formData, responseType: e.target.value as ChatbotRule['response']['type'] })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="text">Text Message</option>
                      <option value="template">Template Message</option>
                      <option value="media">Media Message</option>
                    </select>
                  </div>

                  {formData.responseType === 'text' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Message *
                      </label>
                      <textarea
                        value={formData.responseContent}
                        onChange={(e) => setFormData({ ...formData, responseContent: e.target.value })}
                        placeholder="Enter your auto-reply message..."
                        rows={4}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Supports emojis and line breaks. Max 4096 characters.
                      </p>
                    </div>
                  )}

                  {formData.responseType === 'template' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Template Name
                      </label>
                      <input
                        type="text"
                        value={formData.templateName}
                        onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
                        placeholder="Enter template name"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  )}

                  {formData.responseType === 'media' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Media URL *
                        </label>
                        <input
                          type="url"
                          value={formData.mediaUrl}
                          onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                          placeholder="https://example.com/image.jpg"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Caption (optional)
                        </label>
                        <textarea
                          value={formData.responseContent}
                          onChange={(e) => setFormData({ ...formData, responseContent: e.target.value })}
                          placeholder="Optional caption for the media"
                          rows={2}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
