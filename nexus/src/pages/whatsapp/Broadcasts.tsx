/**
 * WhatsApp Broadcasts Page
 *
 * Send marketing and transactional campaigns via WhatsApp Business.
 * Features:
 * - Create broadcast campaigns
 * - Select message templates
 * - Choose target audience (contacts/tags)
 * - Schedule or send immediately
 * - View campaign history
 * - Track delivery status
 *
 * Uses AiSensy Campaign API for broadcast functionality.
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

// =============================================================================
// TYPES
// =============================================================================

interface Template {
  id: string
  name: string
  language: string
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
  status: 'APPROVED' | 'PENDING' | 'REJECTED'
  bodyText: string
  headerType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  headerText?: string
  footerText?: string
  buttons?: { type: string; text: string }[]
  variables: string[]
}

interface Campaign {
  id: string
  name: string
  templateName: string
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed'
  targetCount: number
  sentCount: number
  deliveredCount: number
  readCount: number
  failedCount: number
  createdAt: string
  scheduledFor?: string
  completedAt?: string
}

interface Contact {
  id: string
  name: string
  phoneNumber: string
  tags: string[]
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

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
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

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function MegaphoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  )
}

function WhatsAppLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

// =============================================================================
// CREATE CAMPAIGN MODAL
// =============================================================================

interface CreateCampaignModalProps {
  isOpen: boolean
  onClose: () => void
  onSend: (campaign: {
    name: string
    templateId: string
    recipients: string[]
    variables: Record<string, string>
    scheduleTime?: string
  }) => Promise<void>
  templates: Template[]
  contacts: Contact[]
  allTags: string[]
}

function CreateCampaignModal({
  isOpen,
  onClose,
  onSend,
  templates,
  contacts,
  allTags
}: CreateCampaignModalProps) {
  const [step, setStep] = useState(1)
  const [campaignName, setCampaignName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [targetType, setTargetType] = useState<'all' | 'tags' | 'manual'>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [scheduleType, setScheduleType] = useState<'now' | 'scheduled'>('now')
  const [scheduleTime, setScheduleTime] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setCampaignName('')
      setSelectedTemplate(null)
      setTargetType('all')
      setSelectedTags([])
      setSelectedContacts(new Set())
      setVariables({})
      setScheduleType('now')
      setScheduleTime('')
      setError('')
    }
  }, [isOpen])

  // Get recipients based on selection
  const getRecipients = useCallback(() => {
    if (targetType === 'all') {
      return contacts.map(c => c.phoneNumber)
    }
    if (targetType === 'tags') {
      return contacts
        .filter(c => c.tags.some(t => selectedTags.includes(t)))
        .map(c => c.phoneNumber)
    }
    return Array.from(selectedContacts)
  }, [targetType, contacts, selectedTags, selectedContacts])

  const recipientCount = getRecipients().length

  const handleSend = async () => {
    if (!campaignName.trim()) {
      setError('Campaign name is required')
      return
    }
    if (!selectedTemplate) {
      setError('Please select a template')
      return
    }
    if (recipientCount === 0) {
      setError('Please select at least one recipient')
      return
    }

    setIsSending(true)
    setError('')

    try {
      await onSend({
        name: campaignName.trim(),
        templateId: selectedTemplate.id,
        recipients: getRecipients(),
        variables,
        scheduleTime: scheduleType === 'scheduled' ? scheduleTime : undefined
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to send campaign')
    } finally {
      setIsSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Create Broadcast</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={cn(
                    'w-8 h-1 rounded-full transition-colors',
                    s <= step ? 'bg-green-500' : 'bg-slate-700'
                  )}
                />
              ))}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Campaign Name */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Campaign Details</h3>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Campaign Name *</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g., January Sale Announcement"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          )}

          {/* Step 2: Select Template */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Select Template</h3>
              <p className="text-sm text-slate-400">
                Choose an approved WhatsApp template for your broadcast
              </p>

              {templates.filter(t => t.status === 'APPROVED').length === 0 ? (
                <div className="p-6 bg-slate-800/50 rounded-lg text-center">
                  <p className="text-slate-400">No approved templates available</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Create templates in AiSensy dashboard and wait for Meta approval
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {templates
                    .filter(t => t.status === 'APPROVED')
                    .map((template) => (
                      <button
                        key={template.id}
                        onClick={() => {
                          setSelectedTemplate(template)
                          // Initialize variables
                          const vars: Record<string, string> = {}
                          template.variables.forEach((_v, i) => {
                            vars[`{{${i + 1}}}`] = ''
                          })
                          setVariables(vars)
                        }}
                        className={cn(
                          'w-full p-4 rounded-lg border text-left transition-colors',
                          selectedTemplate?.id === template.id
                            ? 'border-green-500 bg-green-500/10'
                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">{template.name}</span>
                          <span className={cn(
                            'px-2 py-0.5 rounded text-xs',
                            template.category === 'MARKETING' ? 'bg-purple-500/20 text-purple-400' :
                            template.category === 'UTILITY' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-orange-500/20 text-orange-400'
                          )}>
                            {template.category}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 line-clamp-2">{template.bodyText}</p>
                        {template.variables.length > 0 && (
                          <p className="text-xs text-slate-500 mt-2">
                            {template.variables.length} variable(s)
                          </p>
                        )}
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Select Recipients */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Select Recipients</h3>

              <div className="space-y-2">
                <button
                  onClick={() => setTargetType('all')}
                  className={cn(
                    'w-full p-4 rounded-lg border text-left transition-colors',
                    targetType === 'all'
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <UsersIcon className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="font-medium text-white">All Contacts</p>
                      <p className="text-sm text-slate-400">{contacts.length} contacts</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setTargetType('tags')}
                  className={cn(
                    'w-full p-4 rounded-lg border text-left transition-colors',
                    targetType === 'tags'
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  )}
                >
                  <p className="font-medium text-white">By Tags</p>
                  <p className="text-sm text-slate-400">Select contacts with specific tags</p>
                </button>

                <button
                  onClick={() => setTargetType('manual')}
                  className={cn(
                    'w-full p-4 rounded-lg border text-left transition-colors',
                    targetType === 'manual'
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  )}
                >
                  <p className="font-medium text-white">Manual Selection</p>
                  <p className="text-sm text-slate-400">Choose individual contacts</p>
                </button>
              </div>

              {/* Tag Selection */}
              {targetType === 'tags' && (
                <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
                  <p className="text-sm text-slate-400 mb-2">Select tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setSelectedTags(prev =>
                            prev.includes(tag)
                              ? prev.filter(t => t !== tag)
                              : [...prev, tag]
                          )
                        }}
                        className={cn(
                          'px-3 py-1 rounded-lg text-sm transition-colors',
                          selectedTags.includes(tag)
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual Contact Selection */}
              {targetType === 'manual' && (
                <div className="mt-4 max-h-60 overflow-y-auto space-y-1">
                  {contacts.map((contact) => (
                    <label
                      key={contact.id}
                      className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedContacts.has(contact.phoneNumber)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedContacts)
                          if (e.target.checked) {
                            newSelected.add(contact.phoneNumber)
                          } else {
                            newSelected.delete(contact.phoneNumber)
                          }
                          setSelectedContacts(newSelected)
                        }}
                        className="w-4 h-4 rounded border-slate-600 text-green-500 focus:ring-green-500 bg-slate-700"
                      />
                      <div>
                        <p className="text-white">{contact.name}</p>
                        <p className="text-sm text-slate-400">{contact.phoneNumber}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <div className="mt-4 p-3 bg-slate-800 rounded-lg">
                <p className="text-sm text-slate-400">
                  Selected: <span className="text-white font-medium">{recipientCount} recipients</span>
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Variables & Schedule */}
          {step === 4 && (
            <div className="space-y-6">
              {/* Variables */}
              {selectedTemplate && selectedTemplate.variables.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Template Variables</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    Fill in the dynamic content for your template
                  </p>
                  <div className="space-y-3">
                    {selectedTemplate.variables.map((_, index) => (
                      <div key={index}>
                        <label className="block text-sm text-slate-400 mb-1">
                          Variable {index + 1}
                        </label>
                        <input
                          type="text"
                          value={variables[`{{${index + 1}}}`] || ''}
                          onChange={(e) => setVariables(prev => ({
                            ...prev,
                            [`{{${index + 1}}}`]: e.target.value
                          }))}
                          placeholder={`Value for {{${index + 1}}}`}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Schedule */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Send Options</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setScheduleType('now')}
                    className={cn(
                      'w-full p-4 rounded-lg border text-left transition-colors',
                      scheduleType === 'now'
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <SendIcon className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="font-medium text-white">Send Now</p>
                        <p className="text-sm text-slate-400">Send immediately</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setScheduleType('scheduled')}
                    className={cn(
                      'w-full p-4 rounded-lg border text-left transition-colors',
                      scheduleType === 'scheduled'
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <ClockIcon className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="font-medium text-white">Schedule</p>
                        <p className="text-sm text-slate-400">Send at a specific time</p>
                      </div>
                    </div>
                  </button>
                </div>

                {scheduleType === 'scheduled' && (
                  <div className="mt-4">
                    <input
                      type="datetime-local"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <h4 className="font-medium text-white mb-2">Summary</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-slate-400">
                    Campaign: <span className="text-white">{campaignName}</span>
                  </p>
                  <p className="text-slate-400">
                    Template: <span className="text-white">{selectedTemplate?.name}</span>
                  </p>
                  <p className="text-slate-400">
                    Recipients: <span className="text-white">{recipientCount}</span>
                  </p>
                  <p className="text-slate-400">
                    Send: <span className="text-white">{scheduleType === 'now' ? 'Immediately' : scheduleTime}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-between">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="px-4 py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !campaignName.trim()) ||
                (step === 2 && !selectedTemplate) ||
                (step === 3 && recipientCount === 0)
              }
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={isSending}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SendIcon className="w-4 h-4" />
              {isSending ? 'Sending...' : scheduleType === 'now' ? 'Send Now' : 'Schedule'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function WhatsAppBroadcasts() {
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [allTags, setAllTags] = useState<string[]>([])

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [campaignsRes, templatesRes, contactsRes] = await Promise.all([
        fetch('/api/whatsapp-business/campaigns'),
        fetch('/api/whatsapp-business/templates'),
        fetch('/api/whatsapp-business/contacts')
      ])

      if (campaignsRes.ok) {
        const data = await campaignsRes.json()
        setCampaigns(data.campaigns || [])
      }

      if (templatesRes.ok) {
        const data = await templatesRes.json()
        setTemplates(data.templates || [])
      }

      if (contactsRes.ok) {
        const data = await contactsRes.json()
        const contactsList = data.contacts || []
        setContacts(contactsList)

        // Extract tags
        const tags = new Set<string>()
        contactsList.forEach((c: Contact) => c.tags.forEach(t => tags.add(t)))
        setAllTags(Array.from(tags))
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Send campaign
  const handleSendCampaign = async (campaign: {
    name: string
    templateId: string
    recipients: string[]
    variables: Record<string, string>
    scheduleTime?: string
  }) => {
    const response = await fetch('/api/whatsapp-business/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaign)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create campaign')
    }

    await fetchData()
  }

  // Get status badge
  const getStatusBadge = (status: Campaign['status']) => {
    const badges = {
      draft: { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'Draft' },
      scheduled: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Scheduled' },
      sending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Sending' },
      completed: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Completed' },
      failed: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Failed' }
    }
    const badge = badges[status]
    return (
      <span className={cn('px-2 py-0.5 rounded text-xs', badge.bg, badge.text)}>
        {badge.label}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/whatsapp')}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <BackIcon className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <WhatsAppLogo className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-white">Broadcasts</h1>
                  <p className="text-xs text-slate-400">{campaigns.length} campaigns</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              New Broadcast
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 bg-slate-800/50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <MegaphoneIcon className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No broadcasts yet</h3>
            <p className="text-slate-400 mb-4">
              Create your first broadcast campaign to reach your contacts
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              New Broadcast
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-white">{campaign.name}</h3>
                    <p className="text-sm text-slate-400">{campaign.templateName}</p>
                  </div>
                  {getStatusBadge(campaign.status)}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-5 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-slate-500">Target</p>
                    <p className="text-sm text-white">{campaign.targetCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Sent</p>
                    <p className="text-sm text-white">{campaign.sentCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Delivered</p>
                    <p className="text-sm text-green-400">{campaign.deliveredCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Read</p>
                    <p className="text-sm text-blue-400">{campaign.readCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Failed</p>
                    <p className="text-sm text-red-400">{campaign.failedCount}</p>
                  </div>
                </div>

                {/* Progress bar */}
                {campaign.status === 'sending' && campaign.targetCount > 0 && (
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{
                        width: `${(campaign.sentCount / campaign.targetCount) * 100}%`
                      }}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
                  <p className="text-xs text-slate-500">
                    {campaign.scheduledFor
                      ? `Scheduled: ${new Date(campaign.scheduledFor).toLocaleString()}`
                      : `Created: ${new Date(campaign.createdAt).toLocaleString()}`
                    }
                  </p>
                  {campaign.status === 'completed' && (
                    <div className="flex items-center gap-1 text-green-400 text-xs">
                      <CheckIcon className="w-3 h-3" />
                      Completed
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      <CreateCampaignModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSend={handleSendCampaign}
        templates={templates}
        contacts={contacts}
        allTags={allTags}
      />
    </div>
  )
}

export default WhatsAppBroadcasts
