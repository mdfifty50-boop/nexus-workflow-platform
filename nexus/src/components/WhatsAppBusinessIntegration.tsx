/**
 * WhatsApp Business Integration Component
 *
 * Legitimate WhatsApp Business automation via AiSensy BSP.
 *
 * Features:
 * - Embedded Signup for WABA creation (no existing account needed)
 * - API Key registration for existing accounts
 * - Template message management
 * - Trigger configuration for workflow automation
 * - Real-time connection status
 *
 * Architecture:
 * - Nexus = Brain (all workflow logic, triggers, actions)
 * - AiSensy = Dumb Pipe (send/receive API only)
 */

import { useState, useEffect, useCallback } from 'react'
import { Button } from './ui/button'

// Types
interface WhatsAppBusinessAccount {
  id: string
  phoneNumber: string
  displayName: string
  status: 'pending' | 'active' | 'suspended' | 'disconnected'
  lastActivity?: string
}

// WhatsAppTemplate interface - available for future use
// interface WhatsAppTemplate {
//   id: string
//   name: string
//   language: string
//   category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
//   status: 'APPROVED' | 'PENDING' | 'REJECTED'
// }

interface WhatsAppBusinessTrigger {
  id: string
  keyword: string
  workflow: string
  workflowId: string
  isActive: boolean
  usageCount: number
  lastTriggered?: Date
}

// Storage keys
const WHATSAPP_TRIGGERS_KEY = 'nexus_whatsapp_business_triggers'

// Load triggers from localStorage
function loadTriggers(): WhatsAppBusinessTrigger[] {
  try {
    const stored = localStorage.getItem(WHATSAPP_TRIGGERS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save triggers to localStorage
function saveTriggers(triggers: WhatsAppBusinessTrigger[]): void {
  localStorage.setItem(WHATSAPP_TRIGGERS_KEY, JSON.stringify(triggers))
}

// ============================================
// Connection Methods
// ============================================

interface ConnectionMethodProps {
  onEmbeddedSignup: () => void
  onApiKeyMode: () => void
  isLoading: boolean
}

function ConnectionMethods({ onEmbeddedSignup, onApiKeyMode, isLoading }: ConnectionMethodProps) {
  return (
    <div className="space-y-4">
      {/* Primary: Embedded Signup */}
      <button
        onClick={onEmbeddedSignup}
        disabled={isLoading}
        className="w-full p-4 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all text-left group"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-white font-semibold">Create WhatsApp Business Account</h4>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                Recommended
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Quick setup via Meta's Embedded Signup. No existing account needed.
            </p>
            <ul className="mt-2 text-xs text-slate-500 space-y-1">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Free platform fee
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Only pay Meta per-message rates
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Takes 2-3 minutes
              </li>
            </ul>
          </div>
          <div className="text-slate-400 group-hover:text-emerald-400 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Secondary: API Key */}
      <button
        onClick={onApiKeyMode}
        disabled={isLoading}
        className="w-full p-4 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-800/50 hover:bg-slate-800 transition-all text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-white font-medium">I have an AiSensy API key</h4>
            <p className="text-sm text-slate-400">Connect existing WhatsApp Business account</p>
          </div>
        </div>
      </button>
    </div>
  )
}

// ============================================
// API Key Registration Form
// ============================================

interface ApiKeyFormProps {
  onSubmit: (apiKey: string, phoneNumber: string, displayName: string) => void
  onBack: () => void
  isLoading: boolean
  error?: string
}

function ApiKeyForm({ onSubmit, onBack, isLoading, error }: ApiKeyFormProps) {
  const [apiKey, setApiKey] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [displayName, setDisplayName] = useState('')

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            AiSensy API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your AiSensy API key"
            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <p className="text-xs text-slate-500 mt-1">
            Find this in your AiSensy dashboard under API Settings
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            WhatsApp Business Phone Number
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+965 9XXX XXXX"
            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Display Name (optional)
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your Business Name"
            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <Button
          onClick={() => onSubmit(apiKey, phoneNumber, displayName)}
          disabled={!apiKey || !phoneNumber || isLoading}
          className="w-full bg-emerald-600 hover:bg-emerald-500"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Connecting...
            </span>
          ) : (
            'Connect WhatsApp Business'
          )}
        </Button>
      </div>
    </div>
  )
}

// ============================================
// Connected Status Display
// ============================================

interface ConnectedStatusProps {
  account: WhatsAppBusinessAccount
  onDisconnect: () => void
}

function ConnectedStatus({ account, onDisconnect }: ConnectedStatusProps) {
  return (
    <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-emerald-500">
          <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">WhatsApp Business Connected</h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
              Active
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            <span className="text-white font-medium">{account.displayName}</span>
            <span className="mx-2">•</span>
            <span>{account.phoneNumber}</span>
          </p>
          {account.lastActivity && (
            <p className="text-xs text-slate-500 mt-1">
              Last activity: {new Date(account.lastActivity).toLocaleString()}
            </p>
          )}
        </div>

        <Button
          onClick={onDisconnect}
          variant="outline"
          className="text-red-400 border-red-400/30 hover:bg-red-500/10"
        >
          Disconnect
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="mt-4 pt-4 border-t border-emerald-500/20 grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">$0</p>
          <p className="text-xs text-slate-400">Platform Fee</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-emerald-400">24h</p>
          <p className="text-xs text-slate-400">Reply Window</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-white">Unlimited</p>
          <p className="text-xs text-slate-400">Free Replies</p>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Trigger Card Component
// ============================================

interface TriggerCardProps {
  trigger: WhatsAppBusinessTrigger
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

function TriggerCard({ trigger, onToggle, onEdit, onDelete }: TriggerCardProps) {
  return (
    <div className={`
      rounded-xl border p-4 transition-all
      ${trigger.isActive
        ? 'border-slate-700 bg-slate-800/50'
        : 'border-slate-800 bg-slate-900/50 opacity-60'
      }
    `}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center font-mono text-sm
            ${trigger.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}
          `}>
            /{trigger.keyword}
          </div>
          <div>
            <h4 className="font-medium text-white">{trigger.workflow}</h4>
            <p className="text-xs text-slate-400">
              {trigger.usageCount} triggers • {trigger.lastTriggered
                ? `Last: ${new Date(trigger.lastTriggered).toLocaleDateString()}`
                : 'Never triggered'}
            </p>
          </div>
        </div>

        <button
          onClick={onToggle}
          className={`
            relative w-12 h-6 rounded-full transition-all
            ${trigger.isActive ? 'bg-emerald-500' : 'bg-slate-700'}
          `}
        >
          <div className={`
            absolute top-1 w-4 h-4 rounded-full bg-white transition-all
            ${trigger.isActive ? 'left-7' : 'left-1'}
          `} />
        </button>
      </div>

      <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
        <p className="text-xs text-slate-500 mb-1">Customer sends:</p>
        <code className="text-sm text-emerald-400">{trigger.keyword}</code>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 py-2 text-sm text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-lg transition-colors"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="flex-1 py-2 text-sm text-slate-400 hover:text-red-400 bg-slate-800/50 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

// ============================================
// Create Trigger Modal
// ============================================

interface CreateTriggerModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (trigger: { keyword: string; workflowId: string }) => void
}

function CreateTriggerModal({ isOpen, onClose, onCreate }: CreateTriggerModalProps) {
  const [keyword, setKeyword] = useState('')
  const [selectedWorkflow, setSelectedWorkflow] = useState('')

  const workflows = [
    { id: 'wf-1', name: 'Generate Weekly Report' },
    { id: 'wf-2', name: 'CRM Data Sync' },
    { id: 'wf-3', name: 'Schedule Meeting' },
    { id: 'wf-4', name: 'Send Status Update' },
    { id: 'wf-5', name: 'Create Task' },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-md w-full">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Create WhatsApp Trigger</h2>
          <p className="text-sm text-slate-400 mt-1">
            Set a keyword to trigger a workflow when customers message you
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Trigger Keyword
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">/</span>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value.toLowerCase().replace(/\s/g, ''))}
                placeholder="report"
                className="w-full pl-7 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Customer messages <code className="text-emerald-400">{keyword || 'keyword'}</code> to trigger
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Workflow to Run
            </label>
            <select
              value={selectedWorkflow}
              onChange={(e) => setSelectedWorkflow(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">Select a workflow...</option>
              {workflows.map(wf => (
                <option key={wf.id} value={wf.id}>{wf.name}</option>
              ))}
            </select>
          </div>

          {/* Preview */}
          <div className="bg-slate-800/50 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-3">Preview</p>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="bg-emerald-500/20 rounded-lg rounded-tl-none p-3">
                  <p className="text-sm text-white font-mono">{keyword || 'keyword'}</p>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Nexus responds: Running {workflows.find(w => w.id === selectedWorkflow)?.name || '...'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-700 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (keyword && selectedWorkflow) {
                onCreate({ keyword, workflowId: selectedWorkflow })
                setKeyword('')
                setSelectedWorkflow('')
                onClose()
              }
            }}
            disabled={!keyword || !selectedWorkflow}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500"
          >
            Create Trigger
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Pricing Info Card
// ============================================

function PricingInfo() {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <span className="text-emerald-400">$</span>
        Meta WhatsApp Pricing (July 2025)
      </h4>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between text-slate-400">
          <span>Marketing messages</span>
          <span className="text-white">~$0.025/message</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Utility messages</span>
          <span className="text-white">~$0.004/message</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Service conversations</span>
          <span className="text-emerald-400 font-medium">FREE</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>AiSensy platform fee</span>
          <span className="text-emerald-400 font-medium">$0</span>
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-700">
        Service conversations (replies within 24h) are free. Template messages are billed by Meta.
      </p>
    </div>
  )
}

// ============================================
// Main Component
// ============================================

interface WhatsAppBusinessIntegrationPanelProps {
  className?: string
  userId?: string
}

export function WhatsAppBusinessIntegrationPanel({ className = '', userId }: WhatsAppBusinessIntegrationPanelProps) {
  // Connection state
  const [account, setAccount] = useState<WhatsAppBusinessAccount | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [connectionMode, setConnectionMode] = useState<'select' | 'apiKey'>('select')

  // Triggers state
  const [triggers, setTriggers] = useState<WhatsAppBusinessTrigger[]>(() => loadTriggers())
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Check connection status on mount
  useEffect(() => {
    checkStatus()
  }, [])

  // Persist triggers
  useEffect(() => {
    saveTriggers(triggers)
  }, [triggers])

  // API calls
  const checkStatus = useCallback(async () => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (userId) headers['x-user-id'] = userId

      const response = await fetch('/api/whatsapp-business/status', { headers })
      const data = await response.json()

      if (data.success && data.connected && data.account) {
        setAccount(data.account)
      }
    } catch (error) {
      console.error('Failed to check WhatsApp Business status:', error)
    }
  }, [userId])

  const handleEmbeddedSignup = useCallback(async () => {
    setConnectionError(null)
    setIsConnecting(true)

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (userId) headers['x-user-id'] = userId

      const response = await fetch('/api/whatsapp-business/connect', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          redirectUrl: `${window.location.origin}/whatsapp-callback`
        })
      })

      const data = await response.json()

      if (data.success) {
        if (data.alreadyConnected) {
          setAccount({
            id: 'existing',
            phoneNumber: data.account.phoneNumber,
            displayName: data.account.displayName,
            status: 'active'
          })
        } else if (data.signupUrl) {
          // Open Embedded Signup in popup
          const popup = window.open(
            data.signupUrl,
            'whatsapp-signup',
            'width=600,height=700,scrollbars=yes'
          )

          // Poll for completion
          const pollInterval = setInterval(async () => {
            if (popup?.closed) {
              clearInterval(pollInterval)
              await checkStatus()
              setIsConnecting(false)
            }
          }, 1000)
        }
      } else {
        throw new Error(data.error || 'Failed to start Embedded Signup')
      }
    } catch (error: any) {
      setConnectionError(error.message)
      setIsConnecting(false)
    }
  }, [userId, checkStatus])

  const handleApiKeySubmit = useCallback(async (apiKey: string, phoneNumber: string, displayName: string) => {
    setConnectionError(null)
    setIsConnecting(true)

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (userId) headers['x-user-id'] = userId

      const response = await fetch('/api/whatsapp-business/register-key', {
        method: 'POST',
        headers,
        body: JSON.stringify({ apiKey, phoneNumber, displayName })
      })

      const data = await response.json()

      if (data.success) {
        setAccount({
          id: 'manual',
          phoneNumber: data.account.phoneNumber,
          displayName: data.account.displayName,
          status: 'active'
        })
        setConnectionMode('select')
      } else {
        throw new Error(data.error || 'Failed to register API key')
      }
    } catch (error: any) {
      setConnectionError(error.message)
    } finally {
      setIsConnecting(false)
    }
  }, [userId])

  const handleDisconnect = useCallback(async () => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (userId) headers['x-user-id'] = userId

      await fetch('/api/whatsapp-business/disconnect', {
        method: 'POST',
        headers
      })
    } catch (error) {
      // Best effort
    }

    setAccount(null)
  }, [userId])

  // Trigger handlers
  const handleToggleTrigger = useCallback((id: string) => {
    setTriggers(prev =>
      prev.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t)
    )
  }, [])

  const handleDeleteTrigger = useCallback((id: string) => {
    setTriggers(prev => prev.filter(t => t.id !== id))
  }, [])

  const handleCreateTrigger = useCallback(({ keyword, workflowId }: { keyword: string; workflowId: string }) => {
    const workflows = [
      { id: 'wf-1', name: 'Generate Weekly Report' },
      { id: 'wf-2', name: 'CRM Data Sync' },
      { id: 'wf-3', name: 'Schedule Meeting' },
      { id: 'wf-4', name: 'Send Status Update' },
      { id: 'wf-5', name: 'Create Task' },
    ]

    const newTrigger: WhatsAppBusinessTrigger = {
      id: Date.now().toString(),
      keyword,
      workflow: workflows.find(w => w.id === workflowId)?.name || `Workflow ${workflowId}`,
      workflowId,
      isActive: true,
      usageCount: 0,
    }
    setTriggers(prev => [...prev, newTrigger])
  }, [])

  const isConnected = account?.status === 'active'

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Connection Error */}
      {connectionError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <span className="text-red-400">!</span>
          <div className="flex-1">
            <p className="text-sm text-red-400 font-medium">Connection Error</p>
            <p className="text-xs text-red-300/80 mt-0.5">{connectionError}</p>
          </div>
          <button
            onClick={() => setConnectionError(null)}
            className="text-red-400 hover:text-red-300"
          >
            X
          </button>
        </div>
      )}

      {/* Connection Status */}
      {isConnected && account ? (
        <ConnectedStatus
          account={account}
          onDisconnect={handleDisconnect}
        />
      ) : (
        <div className="rounded-2xl border-2 border-slate-700 bg-slate-800/50 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">WhatsApp Business</h3>
                <p className="text-sm text-slate-400">
                  Official WhatsApp Business API - No more "Can't link device" errors
                </p>
              </div>
            </div>
          </div>

          {/* Connection Content */}
          <div className="p-6">
            {connectionMode === 'select' ? (
              <ConnectionMethods
                onEmbeddedSignup={handleEmbeddedSignup}
                onApiKeyMode={() => setConnectionMode('apiKey')}
                isLoading={isConnecting}
              />
            ) : (
              <ApiKeyForm
                onSubmit={handleApiKeySubmit}
                onBack={() => setConnectionMode('select')}
                isLoading={isConnecting}
                error={connectionError || undefined}
              />
            )}
          </div>

          {/* Pricing Info */}
          {connectionMode === 'select' && (
            <div className="p-6 pt-0">
              <PricingInfo />
            </div>
          )}
        </div>
      )}

      {/* Triggers Section */}
      {isConnected && (
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Message Triggers</h3>
              <p className="text-sm text-slate-400">
                {triggers.filter(t => t.isActive).length} active triggers
              </p>
            </div>
            <Button onClick={() => setShowCreateModal(true)} className="bg-emerald-600 hover:bg-emerald-500">
              + Add Trigger
            </Button>
          </div>

          <div className="p-6 grid md:grid-cols-2 gap-4">
            {triggers.map(trigger => (
              <TriggerCard
                key={trigger.id}
                trigger={trigger}
                onToggle={() => handleToggleTrigger(trigger.id)}
                onEdit={() => console.log('Edit', trigger.id)}
                onDelete={() => handleDeleteTrigger(trigger.id)}
              />
            ))}
          </div>

          {triggers.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center">
                <span className="text-3xl">?</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">No triggers yet</h4>
              <p className="text-sm text-slate-400 mb-4">
                Create your first trigger to run workflows from WhatsApp
              </p>
              <Button onClick={() => setShowCreateModal(true)} className="bg-emerald-600 hover:bg-emerald-500">
                Create First Trigger
              </Button>
            </div>
          )}
        </div>
      )}

      {/* How It Works */}
      {isConnected && (
        <div className="bg-slate-800/50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-cyan-400">?</span>
            How It Works
          </h4>
          <ol className="text-sm text-slate-400 space-y-2">
            <li className="flex gap-3">
              <span className="text-emerald-400 font-mono">1.</span>
              Customer sends a keyword (e.g., "report") to your WhatsApp Business number
            </li>
            <li className="flex gap-3">
              <span className="text-emerald-400 font-mono">2.</span>
              Nexus matches the keyword to your configured trigger
            </li>
            <li className="flex gap-3">
              <span className="text-emerald-400 font-mono">3.</span>
              The linked workflow executes automatically
            </li>
            <li className="flex gap-3">
              <span className="text-emerald-400 font-mono">4.</span>
              Results are sent back to the customer via WhatsApp
            </li>
          </ol>
        </div>
      )}

      {/* Create Modal */}
      <CreateTriggerModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateTrigger}
      />
    </div>
  )
}

// Named exports
export { ConnectedStatus as WhatsAppBusinessConnection }
export default WhatsAppBusinessIntegrationPanel
