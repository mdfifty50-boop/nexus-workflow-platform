import { useState } from 'react'
import { Button } from './ui/button'
import { useToast } from '@/contexts/ToastContext'
import type { WorkflowTemplate } from './TemplatesMarketplace'

// =============================================================================
// TYPES
// =============================================================================

interface WorkflowData {
  id: string
  name: string
  description: string
  agents: string[]
  steps: number
  integrations: string[]
}

interface CustomTemplate extends Omit<WorkflowTemplate, 'rating' | 'reviewCount' | 'usageCount' | 'popularity'> {
  isCustom: true
  createdAt: string
  sourceWorkflowId: string
}

// =============================================================================
// LOCAL STORAGE HELPERS
// =============================================================================

const CUSTOM_TEMPLATES_KEY = 'nexus_custom_templates'

export function getCustomTemplates(): CustomTemplate[] {
  try {
    const stored = localStorage.getItem(CUSTOM_TEMPLATES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function saveCustomTemplate(template: CustomTemplate): void {
  const templates = getCustomTemplates()
  templates.push(template)
  localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates))
}

export function deleteCustomTemplate(id: string): void {
  const templates = getCustomTemplates().filter(t => t.id !== id)
  localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates))
}

// =============================================================================
// CATEGORY OPTIONS
// =============================================================================

const TEMPLATE_CATEGORIES = [
  { id: 'marketing', label: 'Marketing', icon: '📢' },
  { id: 'sales', label: 'Sales', icon: '💼' },
  { id: 'operations', label: 'Operations', icon: '⚙️' },
  { id: 'hr', label: 'HR', icon: '👥' },
  { id: 'development', label: 'Development', icon: '💻' },
  { id: 'finance', label: 'Finance', icon: '💰' },
  { id: 'customer', label: 'Customer Success', icon: '🎯' },
  { id: 'meetings', label: 'Meetings', icon: '📝' },
  { id: 'other', label: 'Other', icon: '📦' },
]

const ICON_OPTIONS = [
  '🚀', '📊', '📧', '🎯', '💡', '🔄', '⚡', '🔔',
  '📱', '💬', '📋', '🗂️', '🔍', '📈', '🛠️', '🎨',
  '📅', '🏷️', '📝', '🔗', '⭐', '🎪', '🧩', '💎',
]

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface SaveAsTemplateProps {
  workflow: WorkflowData
  isOpen: boolean
  onClose: () => void
  onSaved?: (template: CustomTemplate) => void
}

export function SaveAsTemplate({ workflow, isOpen, onClose, onSaved }: SaveAsTemplateProps) {
  const toast = useToast()

  const [name, setName] = useState(workflow.name)
  const [description, setDescription] = useState(workflow.description)
  const [category, setCategory] = useState('other')
  const [icon, setIcon] = useState('📋')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [timeSaved, setTimeSaved] = useState('2 hours/week')
  const [isPublic, setIsPublic] = useState(false)
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name Required', 'Please enter a template name')
      return
    }

    if (!description.trim()) {
      toast.error('Description Required', 'Please enter a template description')
      return
    }

    setSaving(true)

    // Simulate saving delay
    await new Promise(resolve => setTimeout(resolve, 500))

    const template: CustomTemplate = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      category,
      icon,
      timeSaved,
      successRate: 95, // Default for custom templates
      integrations: workflow.integrations,
      steps: workflow.steps,
      agents: workflow.agents,
      isPremium: false,
      isFeatured: false,
      isNew: true,
      isCustom: true,
      createdAt: new Date().toISOString(),
      sourceWorkflowId: workflow.id,
      createdBy: {
        type: 'community',
        name: 'You'
      }
    }

    saveCustomTemplate(template)

    setSaving(false)
    toast.success('Template Saved', `"${name}" has been saved to your templates`)

    if (onSaved) {
      onSaved(template)
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Save as Template</h2>
              <p className="text-slate-400 text-sm mt-1">Create a reusable template from this workflow</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Template Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => setIcon(opt)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                    icon === opt
                      ? 'bg-cyan-500/20 border-2 border-cyan-500'
                      : 'bg-slate-800 border border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Template Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Weekly Sales Report Generator"
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this template does and when to use it..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    category === cat.id
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Time Saved */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Estimated Time Saved
            </label>
            <select
              value={timeSaved}
              onChange={(e) => setTimeSaved(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="30 minutes/week">30 minutes/week</option>
              <option value="1 hour/week">1 hour/week</option>
              <option value="2 hours/week">2 hours/week</option>
              <option value="4 hours/week">4 hours/week</option>
              <option value="8 hours/week">8 hours/week</option>
              <option value="10+ hours/week">10+ hours/week</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Tags (optional)
            </label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-sm"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Add a tag..."
                className="flex-1 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
              />
              <Button variant="outline" size="sm" onClick={handleAddTag}>
                Add
              </Button>
            </div>
          </div>

          {/* Visibility (future feature) */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Share with Community</p>
                <p className="text-sm text-slate-400">Make this template available to other users</p>
              </div>
              <button
                onClick={() => setIsPublic(!isPublic)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  isPublic ? 'bg-cyan-500' : 'bg-slate-600'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    isPublic ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
            {isPublic && (
              <p className="text-xs text-amber-400 mt-3">
                Note: Public templates will be reviewed before being published to the community.
              </p>
            )}
          </div>

          {/* Workflow Info */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <h4 className="text-sm font-medium text-slate-300 mb-3">Workflow Details</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-cyan-400">{workflow.steps}</div>
                <div className="text-xs text-slate-500">Steps</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-400">{workflow.agents.length}</div>
                <div className="text-xs text-slate-500">Agents</div>
              </div>
              <div>
                <div className="text-lg font-bold text-emerald-400">{workflow.integrations.length}</div>
                <div className="text-xs text-slate-500">Integrations</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex gap-4 flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save Template
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SaveAsTemplate
