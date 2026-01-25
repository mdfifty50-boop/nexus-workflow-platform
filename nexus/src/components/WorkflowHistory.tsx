import { useState, useEffect, useCallback, useMemo } from 'react'
import { ProfessionalAvatar } from './ProfessionalAvatar'
import { Button } from './ui/button'

// Workflow version types
interface WorkflowVersion {
  id: string
  version: number
  name: string
  description?: string
  definition: Record<string, unknown>
  createdAt: string
  createdBy: string
  changeType: 'create' | 'update' | 'restore' | 'auto-save'
  changeSummary?: string
  isCurrentVersion: boolean
}

interface WorkflowHistoryProps {
  workflowId: string
  currentVersion?: Record<string, unknown>
  onRestore?: (version: WorkflowVersion) => void
  onCompare?: (v1: WorkflowVersion, v2: WorkflowVersion) => void
}

// Storage key for workflow versions
const getStorageKey = (workflowId: string) => `nexus_workflow_history_${workflowId}`

// Load versions from localStorage
function loadVersions(workflowId: string): WorkflowVersion[] {
  try {
    const stored = localStorage.getItem(getStorageKey(workflowId))
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (err) {
    console.error('[WorkflowHistory] Failed to load versions:', err)
  }
  return []
}

// Save versions to localStorage
function saveVersions(workflowId: string, versions: WorkflowVersion[]): void {
  try {
    // Keep only last 50 versions
    const trimmedVersions = versions.slice(0, 50)
    localStorage.setItem(getStorageKey(workflowId), JSON.stringify(trimmedVersions))
  } catch (err) {
    console.error('[WorkflowHistory] Failed to save versions:', err)
  }
}

// Generate a new version
function createVersion(
  workflowId: string,
  definition: Record<string, unknown>,
  changeType: WorkflowVersion['changeType'],
  changeSummary?: string
): WorkflowVersion {
  const versions = loadVersions(workflowId)
  const nextVersion = versions.length > 0 ? versions[0].version + 1 : 1

  return {
    id: `v${nextVersion}_${Date.now()}`,
    version: nextVersion,
    name: (definition.name as string) || `Version ${nextVersion}`,
    description: definition.description as string,
    definition,
    createdAt: new Date().toISOString(),
    createdBy: 'user', // In production, get from auth context
    changeType,
    changeSummary,
    isCurrentVersion: true,
  }
}

// Hook for managing workflow history
export function useWorkflowHistory(workflowId: string) {
  const [versions, setVersions] = useState<WorkflowVersion[]>([])
  const [loading, setLoading] = useState(true)

  // Load versions on mount
  useEffect(() => {
    const loaded = loadVersions(workflowId)
    setVersions(loaded)
    setLoading(false)
  }, [workflowId])

  // Save a new version
  const saveVersion = useCallback(
    (
      definition: Record<string, unknown>,
      changeType: WorkflowVersion['changeType'] = 'update',
      changeSummary?: string
    ) => {
      const newVersion = createVersion(workflowId, definition, changeType, changeSummary)

      // Mark all previous versions as not current
      const updatedVersions = versions.map(v => ({ ...v, isCurrentVersion: false }))

      // Add new version at the beginning
      const allVersions = [newVersion, ...updatedVersions]

      setVersions(allVersions)
      saveVersions(workflowId, allVersions)

      return newVersion
    },
    [workflowId, versions]
  )

  // Restore a previous version
  const restoreVersion = useCallback(
    (version: WorkflowVersion) => {
      const restoredVersion = createVersion(
        workflowId,
        version.definition,
        'restore',
        `Restored from version ${version.version}`
      )

      const updatedVersions = versions.map(v => ({ ...v, isCurrentVersion: false }))
      const allVersions = [restoredVersion, ...updatedVersions]

      setVersions(allVersions)
      saveVersions(workflowId, allVersions)

      return restoredVersion
    },
    [workflowId, versions]
  )

  // Get current version
  const currentVersion = useMemo(
    () => versions.find(v => v.isCurrentVersion) || versions[0],
    [versions]
  )

  return {
    versions,
    currentVersion,
    loading,
    saveVersion,
    restoreVersion,
    versionCount: versions.length,
  }
}

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Change type icons and colors
const CHANGE_TYPE_CONFIG: Record<
  WorkflowVersion['changeType'],
  { icon: string; color: string; label: string }
> = {
  create: { icon: '✨', color: 'bg-emerald-500/20 text-emerald-400', label: 'Created' },
  update: { icon: '📝', color: 'bg-cyan-500/20 text-cyan-400', label: 'Updated' },
  restore: { icon: '🔄', color: 'bg-purple-500/20 text-purple-400', label: 'Restored' },
  'auto-save': { icon: '💾', color: 'bg-slate-500/20 text-slate-400', label: 'Auto-saved' },
}

// Version Item Component
function VersionItem({
  version,
  isSelected,
  onSelect,
  onRestore,
  onPreview,
}: {
  version: WorkflowVersion
  isSelected: boolean
  onSelect: () => void
  onRestore: () => void
  onPreview: () => void
}) {
  const config = CHANGE_TYPE_CONFIG[version.changeType]

  return (
    <div
      className={`
        p-4 rounded-xl border transition-all cursor-pointer
        ${isSelected
          ? 'bg-cyan-500/10 border-cyan-500/30'
          : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-600/50'}
        ${version.isCurrentVersion ? 'ring-2 ring-emerald-500/30' : ''}
      `}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
            {config.icon} {config.label}
          </span>
          {version.isCurrentVersion && (
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-medium">
              Current
            </span>
          )}
        </div>
        <span className="text-xs text-slate-500">v{version.version}</span>
      </div>

      <h4 className="text-sm font-medium text-white mb-1 truncate">
        {version.name}
      </h4>

      {version.changeSummary && (
        <p className="text-xs text-slate-400 mb-2 line-clamp-2">
          {version.changeSummary}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ProfessionalAvatar agentId={version.createdBy} size={16} />
          <span>{formatDate(version.createdAt)}</span>
        </div>

        {!version.isCurrentVersion && (
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <button
              onClick={onPreview}
              className="px-2 py-1 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Preview
            </button>
            <button
              onClick={onRestore}
              className="px-2 py-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Restore
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Version Preview Modal
function VersionPreviewModal({
  version,
  onClose,
  onRestore,
}: {
  version: WorkflowVersion
  onClose: () => void
  onRestore: () => void
}) {
  const config = CHANGE_TYPE_CONFIG[version.changeType]

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-3xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
                  {config.icon} {config.label}
                </span>
                <span className="text-sm text-slate-400">Version {version.version}</span>
              </div>
              <h2 className="text-xl font-bold text-white">{version.name}</h2>
              <p className="text-sm text-slate-400 mt-1">
                {formatDate(version.createdAt)}
                {version.changeSummary && ` - ${version.changeSummary}`}
              </p>
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
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 200px)' }}>
          <h3 className="text-sm font-medium text-white mb-3">Workflow Definition</h3>
          <pre className="bg-slate-800 rounded-xl p-4 overflow-x-auto text-xs text-slate-300 font-mono">
            {JSON.stringify(version.definition, null, 2)}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex gap-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
          {!version.isCurrentVersion && (
            <Button onClick={onRestore} className="flex-1">
              <span className="mr-2">🔄</span>
              Restore This Version
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Main WorkflowHistory Component
export function WorkflowHistory({
  workflowId,
  currentVersion: _currentDef,
  onRestore,
}: WorkflowHistoryProps) {
  const { versions, loading, restoreVersion } = useWorkflowHistory(workflowId)
  const [selectedVersion, setSelectedVersion] = useState<WorkflowVersion | null>(null)
  const [previewVersion, setPreviewVersion] = useState<WorkflowVersion | null>(null)
  const [filter, setFilter] = useState<'all' | 'update' | 'restore' | 'auto-save'>('all')

  // Filter versions
  const filteredVersions = useMemo(() => {
    if (filter === 'all') return versions
    return versions.filter(v => v.changeType === filter)
  }, [versions, filter])

  // Handle restore
  const handleRestore = useCallback(
    (version: WorkflowVersion) => {
      const restoredVersion = restoreVersion(version)
      onRestore?.(restoredVersion)
      setPreviewVersion(null)
    },
    [restoreVersion, onRestore]
  )

  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-slate-700 rounded" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-700/50 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>📚</span> Version History
        </h3>
        <span className="text-sm text-slate-400">{versions.length} versions</span>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        {(['all', 'update', 'restore', 'auto-save'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'bg-slate-700/50 text-slate-400 hover:text-white'
            }`}
          >
            {f === 'all' ? 'All' : CHANGE_TYPE_CONFIG[f].label}
          </button>
        ))}
      </div>

      {/* Version List */}
      {filteredVersions.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-4xl mb-4 block">📝</span>
          <p className="text-slate-400 text-sm">No version history yet</p>
          <p className="text-slate-500 text-xs mt-1">
            Versions are saved automatically as you edit
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {filteredVersions.map(version => (
            <VersionItem
              key={version.id}
              version={version}
              isSelected={selectedVersion?.id === version.id}
              onSelect={() => setSelectedVersion(version)}
              onRestore={() => handleRestore(version)}
              onPreview={() => setPreviewVersion(version)}
            />
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewVersion && (
        <VersionPreviewModal
          version={previewVersion}
          onClose={() => setPreviewVersion(null)}
          onRestore={() => handleRestore(previewVersion)}
        />
      )}
    </div>
  )
}

// Export hook for external use
export { useWorkflowHistory as useWorkflowVersions }
export type { WorkflowVersion, WorkflowHistoryProps }
