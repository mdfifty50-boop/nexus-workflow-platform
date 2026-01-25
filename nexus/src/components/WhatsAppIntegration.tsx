import { useState } from 'react'
import { Button } from './ui/button'

interface WhatsAppTrigger {
  id: string
  keyword: string
  workflow: string
  workflowId: string
  isActive: boolean
  usageCount: number
  lastTriggered?: Date
}

const SAMPLE_TRIGGERS: WhatsAppTrigger[] = [
  {
    id: '1',
    keyword: 'report',
    workflow: 'Generate Weekly Report',
    workflowId: 'wf-1',
    isActive: true,
    usageCount: 23,
    lastTriggered: new Date('2026-01-06'),
  },
  {
    id: '2',
    keyword: 'sync',
    workflow: 'CRM Data Sync',
    workflowId: 'wf-2',
    isActive: true,
    usageCount: 45,
    lastTriggered: new Date('2026-01-07'),
  },
  {
    id: '3',
    keyword: 'meeting',
    workflow: 'Schedule Meeting',
    workflowId: 'wf-3',
    isActive: false,
    usageCount: 12,
  },
]

interface WhatsAppConnectionProps {
  isConnected: boolean
  phoneNumber?: string
  onConnect: () => void
  onDisconnect: () => void
}

export function WhatsAppConnection({ isConnected, phoneNumber, onConnect, onDisconnect }: WhatsAppConnectionProps) {
  return (
    <div className={`
      rounded-2xl border-2 p-6 transition-all
      ${isConnected
        ? 'border-emerald-500/30 bg-emerald-500/5'
        : 'border-slate-700 bg-slate-800/50'
      }
    `}>
      <div className="flex items-start gap-4">
        <div className={`
          w-14 h-14 rounded-2xl flex items-center justify-center
          ${isConnected ? 'bg-emerald-500' : 'bg-slate-700'}
        `}>
          <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">WhatsApp Business</h3>
            {isConnected && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                Connected
              </span>
            )}
          </div>

          {isConnected ? (
            <>
              <p className="text-sm text-slate-400 mt-1">
                Connected to <span className="text-white font-medium">{phoneNumber}</span>
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Send messages to this number to trigger workflows
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-400 mt-1">
              Connect WhatsApp to trigger workflows via messages
            </p>
          )}
        </div>

        <Button
          onClick={isConnected ? onDisconnect : onConnect}
          variant={isConnected ? 'outline' : 'default'}
          className={isConnected ? '' : 'bg-emerald-600 hover:bg-emerald-500'}
        >
          {isConnected ? 'Disconnect' : 'Connect'}
        </Button>
      </div>

      {/* How it works */}
      {!isConnected && (
        <div className="mt-6 grid grid-cols-3 gap-4">
          {[
            { step: '1', icon: '📱', title: 'Scan QR Code', desc: 'Link your WhatsApp' },
            { step: '2', icon: '⚙️', title: 'Set Keywords', desc: 'Define trigger words' },
            { step: '3', icon: '🚀', title: 'Send Messages', desc: 'Run workflows on-the-go' },
          ].map((item) => (
            <div key={item.step} className="text-center p-4 rounded-xl bg-slate-800/50">
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="text-sm font-medium text-white">{item.title}</div>
              <div className="text-xs text-slate-400">{item.desc}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface WhatsAppTriggerCardProps {
  trigger: WhatsAppTrigger
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

function WhatsAppTriggerCard({ trigger, onToggle, onEdit, onDelete }: WhatsAppTriggerCardProps) {
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
            ${trigger.isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-400'}
          `}>
            /{trigger.keyword}
          </div>
          <div>
            <h4 className="font-medium text-white">{trigger.workflow}</h4>
            <p className="text-xs text-slate-400">
              {trigger.usageCount} triggers • {trigger.lastTriggered
                ? `Last: ${trigger.lastTriggered.toLocaleDateString()}`
                : 'Never triggered'}
            </p>
          </div>
        </div>

        {/* Toggle */}
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

      {/* Example */}
      <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
        <p className="text-xs text-slate-500 mb-1">Send this message:</p>
        <code className="text-sm text-cyan-400">{trigger.keyword}</code>
      </div>

      {/* Actions */}
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
            Set a keyword to trigger a workflow from WhatsApp
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Keyword Input */}
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
                className="w-full pl-7 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Users will type <code className="text-cyan-400">{keyword || 'keyword'}</code> to trigger
            </p>
          </div>

          {/* Workflow Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Workflow to Run
            </label>
            <select
              value={selectedWorkflow}
              onChange={(e) => setSelectedWorkflow(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">Select a workflow...</option>
              {workflows.map(wf => (
                <option key={wf.id} value={wf.id}>{wf.name}</option>
              ))}
            </select>
          </div>

          {/* Preview */}
          <div className="bg-slate-800/50 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-2">Preview</p>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="bg-emerald-500/20 rounded-lg rounded-tl-none p-3">
                  <p className="text-sm text-white font-mono">{keyword || 'keyword'}</p>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  → Triggers: {workflows.find(w => w.id === selectedWorkflow)?.name || 'No workflow selected'}
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
                onClose()
              }
            }}
            disabled={!keyword || !selectedWorkflow}
            className="flex-1"
          >
            Create Trigger
          </Button>
        </div>
      </div>
    </div>
  )
}

interface WhatsAppIntegrationPanelProps {
  className?: string
}

export function WhatsAppIntegrationPanel({ className = '' }: WhatsAppIntegrationPanelProps) {
  const [isConnected, setIsConnected] = useState(true)
  const [triggers, setTriggers] = useState<WhatsAppTrigger[]>(SAMPLE_TRIGGERS)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleConnect = () => {
    // Show QR code modal
    setIsConnected(true)
  }

  const handleDisconnect = () => {
    setIsConnected(false)
  }

  const handleToggleTrigger = (id: string) => {
    setTriggers(prev =>
      prev.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t)
    )
  }

  const handleDeleteTrigger = (id: string) => {
    setTriggers(prev => prev.filter(t => t.id !== id))
  }

  const handleCreateTrigger = ({ keyword, workflowId }: { keyword: string; workflowId: string }) => {
    const newTrigger: WhatsAppTrigger = {
      id: Date.now().toString(),
      keyword,
      workflow: `Workflow ${workflowId}`,
      workflowId,
      isActive: true,
      usageCount: 0,
    }
    setTriggers(prev => [...prev, newTrigger])
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Connection Status */}
      <WhatsAppConnection
        isConnected={isConnected}
        phoneNumber="+965 1234 5678"
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />

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
            <Button onClick={() => setShowCreateModal(true)}>
              + Add Trigger
            </Button>
          </div>

          <div className="p-6 grid md:grid-cols-2 gap-4">
            {triggers.map(trigger => (
              <WhatsAppTriggerCard
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
                <span className="text-3xl">💬</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">No triggers yet</h4>
              <p className="text-sm text-slate-400 mb-4">
                Create your first trigger to run workflows from WhatsApp
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                Create First Trigger
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      {isConnected && (
        <div className="bg-slate-800/50 rounded-xl p-4 flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div>
            <p className="text-sm text-white font-medium mb-1">Pro Tip</p>
            <p className="text-sm text-slate-400">
              You can also send parameters with your trigger! Try: <code className="text-cyan-400">report sales Q1</code>
            </p>
          </div>
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
