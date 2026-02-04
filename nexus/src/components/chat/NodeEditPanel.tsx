import * as React from 'react'
import { X, Plus, GripVertical, AlertTriangle, Trash2 } from 'lucide-react'

// Integration icons mapping (reuse from existing code patterns)
const INTEGRATION_ICONS: Record<string, string> = {
  gmail: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/gmail.svg',
  slack: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/slack.svg',
  googlesheets: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/googlesheets.svg',
  notion: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/notion.svg',
  discord: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/discord.svg',
  dropbox: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/dropbox.svg',
  github: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/github.svg',
  trello: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/trello.svg',
  asana: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/asana.svg',
  hubspot: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/hubspot.svg',
  whatsapp: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/whatsapp.svg',
  twitter: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/x.svg',
  linkedin: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linkedin.svg',
  zoom: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/zoom.svg',
  stripe: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/stripe.svg',
}

// Default actions for auto-detection
const DEFAULT_ACTIONS: Record<string, string> = {
  slack: 'send_message',
  gmail: 'send_email',
  googlesheets: 'append_row',
  notion: 'create_page',
  discord: 'send_message',
  dropbox: 'upload_file',
  github: 'create_issue',
  trello: 'create_card',
  asana: 'create_task',
  hubspot: 'create_contact',
  whatsapp: 'send_message',
  twitter: 'post_tweet',
  linkedin: 'post_update',
  zoom: 'create_meeting',
  stripe: 'create_payment',
}

// Popular integrations for the add picker
const POPULAR_INTEGRATIONS = [
  { id: 'slack', name: 'Slack', icon: INTEGRATION_ICONS.slack },
  { id: 'gmail', name: 'Gmail', icon: INTEGRATION_ICONS.gmail },
  { id: 'googlesheets', name: 'Google Sheets', icon: INTEGRATION_ICONS.googlesheets },
  { id: 'notion', name: 'Notion', icon: INTEGRATION_ICONS.notion },
  { id: 'discord', name: 'Discord', icon: INTEGRATION_ICONS.discord },
  { id: 'dropbox', name: 'Dropbox', icon: INTEGRATION_ICONS.dropbox },
  { id: 'github', name: 'GitHub', icon: INTEGRATION_ICONS.github },
  { id: 'whatsapp', name: 'WhatsApp', icon: INTEGRATION_ICONS.whatsapp },
]

// Node type from WorkflowPreviewCard (simplified for this component)
interface WorkflowNode {
  id: string
  name: string
  type: 'trigger' | 'action' | 'output'
  integration?: string
  status: 'idle' | 'pending' | 'connecting' | 'success' | 'error'
}

interface NodeEditPanelProps {
  nodes: WorkflowNode[]
  workflowName: string
  onRemoveNode: (nodeId: string) => void
  onAddNode: (integration: string, actionType: string) => void
  onClose: () => void
  disabled?: boolean
}

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'warning'
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  variant = 'danger',
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-lg p-6 max-w-md mx-4 border border-slate-700 shadow-xl">
        <div className="flex items-start gap-3 mb-4">
          <div className={`p-2 rounded-full ${variant === 'danger' ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
            <AlertTriangle className={`w-5 h-5 ${variant === 'danger' ? 'text-red-400' : 'text-amber-400'}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-sm text-slate-400 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-amber-600 hover:bg-amber-500'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export const NodeEditPanel: React.FC<NodeEditPanelProps> = ({
  nodes,
  workflowName,
  onRemoveNode,
  onAddNode,
  onClose,
  disabled = false,
}) => {
  const [showAddPicker, setShowAddPicker] = React.useState(false)
  const [confirmDialog, setConfirmDialog] = React.useState<{
    isOpen: boolean
    nodeId: string
    nodeName: string
    isTrigger: boolean
  }>({
    isOpen: false,
    nodeId: '',
    nodeName: '',
    isTrigger: false,
  })

  const handleRemoveClick = (node: WorkflowNode) => {
    if (disabled) return

    const isTrigger = node.type === 'trigger'
    const isLastAction = nodes.filter((n) => n.type === 'action').length === 1 && node.type === 'action'

    setConfirmDialog({
      isOpen: true,
      nodeId: node.id,
      nodeName: node.name,
      isTrigger: isTrigger || isLastAction,
    })
  }

  const handleConfirmRemove = () => {
    onRemoveNode(confirmDialog.nodeId)
    setConfirmDialog({ isOpen: false, nodeId: '', nodeName: '', isTrigger: false })
  }

  const handleAddIntegration = (integration: string) => {
    const actionType = DEFAULT_ACTIONS[integration] || 'action'
    onAddNode(integration, actionType)
    setShowAddPicker(false)
  }

  const getIntegrationIcon = (integration?: string) => {
    if (!integration) return null
    const iconUrl = INTEGRATION_ICONS[integration.toLowerCase()]
    if (iconUrl) {
      return (
        <img
          src={iconUrl}
          alt={integration}
          className="w-5 h-5 invert opacity-80"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      )
    }
    return (
      <div className="w-5 h-5 rounded bg-slate-600 flex items-center justify-center text-xs font-medium text-slate-300">
        {integration.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Panel - Slide in from right */}
      <div className="fixed right-0 top-0 h-full w-80 max-w-full bg-slate-900 border-l border-slate-700 z-50 flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <div>
            <h3 className="text-sm font-semibold text-white">Edit Workflow</h3>
            <p className="text-xs text-slate-400 truncate max-w-[200px]">{workflowName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Node List */}
        <div className="flex-1 overflow-y-auto p-4">
          {disabled && (
            <div className="mb-4 p-3 bg-amber-900/30 border border-amber-700/50 rounded-lg">
              <p className="text-xs text-amber-300">
                Editing is disabled while workflow is running.
              </p>
            </div>
          )}

          <div className="space-y-2">
            {nodes.map((node, index) => (
              <div
                key={node.id}
                className={`group relative flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  disabled
                    ? 'bg-slate-800/50 border-slate-700/50 opacity-60'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                }`}
              >
                {/* Drag Handle (visual only for now) */}
                <div className="text-slate-600">
                  <GripVertical className="w-4 h-4" />
                </div>

                {/* Node Number */}
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">
                  <span className="text-xs font-medium text-slate-300">{index + 1}</span>
                </div>

                {/* Integration Icon */}
                <div className="flex-shrink-0">{getIntegrationIcon(node.integration)}</div>

                {/* Node Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{node.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{node.type}</p>
                </div>

                {/* Remove Button */}
                {!disabled && (
                  <button
                    onClick={() => handleRemoveClick(node)}
                    className="flex-shrink-0 p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    title="Remove this step"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Step Button */}
          {!disabled && (
            <button
              onClick={() => setShowAddPicker(!showAddPicker)}
              className="mt-4 w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-800/50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Add Step</span>
            </button>
          )}

          {/* Integration Picker */}
          {showAddPicker && !disabled && (
            <div className="mt-3 p-3 bg-slate-800 rounded-lg border border-slate-700">
              <p className="text-xs text-slate-400 mb-3">Select an integration to add:</p>
              <div className="grid grid-cols-2 gap-2">
                {POPULAR_INTEGRATIONS.map((integration) => (
                  <button
                    key={integration.id}
                    onClick={() => handleAddIntegration(integration.id)}
                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-left transition-colors"
                  >
                    {integration.icon ? (
                      <img
                        src={integration.icon}
                        alt={integration.name}
                        className="w-4 h-4 invert opacity-80"
                      />
                    ) : (
                      <div className="w-4 h-4 rounded bg-slate-600" />
                    )}
                    <span className="text-xs text-slate-300">{integration.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-700">
          <p className="text-xs text-slate-500 text-center">
            {nodes.length} step{nodes.length !== 1 ? 's' : ''} in workflow
          </p>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.isTrigger ? 'Remove Trigger?' : 'Remove Step?'}
        message={
          confirmDialog.isTrigger
            ? `Removing "${confirmDialog.nodeName}" will disable this workflow's trigger. The workflow won't start automatically.`
            : `Are you sure you want to remove "${confirmDialog.nodeName}" from this workflow?`
        }
        confirmLabel="Remove"
        cancelLabel="Cancel"
        onConfirm={handleConfirmRemove}
        onCancel={() => setConfirmDialog({ isOpen: false, nodeId: '', nodeName: '', isTrigger: false })}
        variant={confirmDialog.isTrigger ? 'warning' : 'danger'}
      />

      {/* Animation styles */}
      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.2s ease-out;
        }
      `}</style>
    </>
  )
}

export default NodeEditPanel
