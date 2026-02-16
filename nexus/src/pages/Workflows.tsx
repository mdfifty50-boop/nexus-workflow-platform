import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Search,
  Plus,
  Filter,
  Grid3X3,
  List,
  Play,
  Pause,
  MoreHorizontal,
  AlertCircle,
  ChevronRight,
  Zap,
  Edit,
  MessageSquare,
} from 'lucide-react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { workflowPersistenceService, type SavedWorkflow } from '@/services/WorkflowPersistenceService'

// ============================================================================
// Display types & helpers for converting persisted workflows to page format
// ============================================================================

interface DisplayWorkflow {
  id: string
  name: string
  description: string
  status: 'active' | 'paused' | 'draft' | 'completed' | 'failed' | 'error'
  lastRun: string
  runs: number
  successRate: number
  apps: string[]
  trigger: string
  color: string
}

const GRADIENT_COLORS = [
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-pink-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-red-500',
  'from-indigo-500 to-purple-500',
  'from-amber-500 to-orange-500',
]

const INTEGRATION_ICONS: Record<string, string> = {
  gmail: '📧', email: '📧',
  slack: '💬',
  googlesheets: '📊', sheets: '📊',
  dropbox: '📁', drive: '📁', googledrive: '📁',
  notion: '📝',
  calendar: '📅', googlecalendar: '📅',
  twitter: '🐦', x: '🐦',
  github: '🐙',
  discord: '🎮',
  trello: '📋',
  asana: '✅',
  stripe: '💳',
  hubspot: '🎯',
  zoom: '📹',
  linear: '📐',
  whatsapp: '📱',
}

function getIntegrationIcon(integration: string): string {
  return INTEGRATION_ICONS[integration.toLowerCase()] || '⚡'
}

function formatRelativeTime(date: Date | undefined): string {
  if (!date) return 'Never run'
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function convertSavedToDisplay(wf: SavedWorkflow, index: number): DisplayWorkflow {
  const statusMap: Record<string, DisplayWorkflow['status']> = {
    active: 'active',
    paused: 'paused',
    draft: 'draft',
    completed: 'completed',
    failed: 'failed',
    archived: 'paused',
  }

  const apps = wf.requiredIntegrations.map(getIntegrationIcon)
  const triggerName = wf.triggerConfig?.name || wf.triggerConfig?.type || 'Manual'

  return {
    id: wf.id,
    name: wf.name,
    description: wf.description || 'No description',
    status: statusMap[wf.status] || 'draft',
    lastRun: formatRelativeTime(wf.lastExecutedAt),
    runs: wf.executionCount || 0,
    successRate: wf.executionCount > 0 ? 100 : 0,
    apps,
    trigger: triggerName,
    color: GRADIENT_COLORS[index % GRADIENT_COLORS.length],
  }
}

function computeStats(workflows: DisplayWorkflow[], t: (key: string) => string) {
  const total = workflows.length
  const active = workflows.filter(w => w.status === 'active').length
  const paused = workflows.filter(w => w.status === 'paused' || w.status === 'draft').length
  const errored = workflows.filter(w => w.status === 'error' || w.status === 'failed').length

  return [
    { label: t('workflow.totalRuns'), value: String(total), icon: Zap },
    { label: t('workflow.status.active'), value: String(active), icon: Play },
    { label: t('workflow.paused'), value: String(paused), icon: Pause },
    { label: t('workflow.status.error'), value: String(errored), icon: AlertCircle },
  ]
}

export function Workflows() {
  const { t } = useTranslation()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [, setSelectedWorkflow] = useState<string | null>(null)
  const [workflows, setWorkflows] = useState<DisplayWorkflow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load real workflows from persistence service
  useEffect(() => {
    async function loadWorkflows() {
      try {
        setIsLoading(true)
        const { workflows: saved } = await workflowPersistenceService.loadWorkflows()
        if (saved && saved.length > 0) {
          const display = saved
            .filter(w => w.status !== 'archived')
            .map((w, i) => convertSavedToDisplay(w, i))
          setWorkflows(display)
        } else {
          setWorkflows([])
        }
      } catch (err) {
        console.warn('[Workflows] Failed to load workflows:', err)
        setWorkflows([])
      } finally {
        setIsLoading(false)
      }
    }
    loadWorkflows()
  }, [])

  const stats = useMemo(() => computeStats(workflows, t), [workflows, t])

  const filteredWorkflows = workflows.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('workflow.title')}</h1>
          <p className="text-sm sm:text-base text-surface-400 mt-1">{t('workflow.description')}</p>
        </div>
        <Link to="/chat">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t('workflow.create')}
          </motion.button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card py-3 sm:py-4"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-nexus-500/10 flex items-center justify-center">
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-nexus-400" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs sm:text-sm text-surface-400">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.search') + '...'}
            className="input pl-12"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary flex items-center gap-2 py-3">
            <Filter className="w-4 h-4" />
            {t('common.filter')}
          </button>
          <div className="flex items-center rounded-xl bg-surface-800 border border-surface-700 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                'p-2 rounded-lg transition-all',
                viewMode === 'grid'
                  ? 'bg-surface-700 text-white'
                  : 'text-surface-400 hover:text-white'
              )}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'p-2 rounded-lg transition-all',
                viewMode === 'list'
                  ? 'bg-surface-700 text-white'
                  : 'text-surface-400 hover:text-white'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-nexus-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-surface-400 text-sm">{t('common.loading')}</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && workflows.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 px-6"
        >
          <div className="w-20 h-20 rounded-2xl bg-surface-800 border border-surface-700 flex items-center justify-center mb-6">
            <MessageSquare className="w-10 h-10 text-surface-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">{t('workflow.noWorkflows')}</h3>
          <p className="text-surface-400 text-center max-w-md mb-8">
            {t('workflow.noWorkflowsDescription', 'Create your first automation to get started. Tell Nexus what you want to automate and it will build the workflow for you.')}
          </p>
          <Link to="/chat">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary flex items-center gap-2 px-6 py-3"
            >
              <Plus className="w-5 h-5" />
              {t('workflow.create')}
            </motion.button>
          </Link>
        </motion.div>
      )}

      {/* Workflow grid view */}
      {!isLoading && filteredWorkflows.length > 0 && viewMode === 'grid' && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredWorkflows.map((workflow, index) => (
            <motion.div
              key={workflow.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              className="card-glow group cursor-pointer"
              onClick={() => setSelectedWorkflow(workflow.id)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${workflow.color} flex items-center justify-center shadow-lg`}>
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <span className={clsx(
                    'badge',
                    workflow.status === 'active' && 'badge-success',
                    workflow.status === 'paused' && 'badge-warning',
                    workflow.status === 'error' && 'bg-red-500/20 text-red-400 border-red-500/30'
                  )}>
                    {workflow.status === 'active' && <Play className="w-3 h-3 mr-1" />}
                    {workflow.status === 'paused' && <Pause className="w-3 h-3 mr-1" />}
                    {workflow.status === 'error' && <AlertCircle className="w-3 h-3 mr-1" />}
                    {t(`workflow.status.${workflow.status}`, workflow.status)}
                  </span>
                  <button className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-surface-700 transition-all">
                    <MoreHorizontal className="w-4 h-4 text-surface-400" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-nexus-400 transition-colors">
                {workflow.name}
              </h3>
              <p className="text-sm text-surface-400 mb-4 line-clamp-2">
                {workflow.description}
              </p>

              {/* Apps */}
              <div className="flex items-center gap-2 mb-4">
                {workflow.apps.map((app, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center text-lg"
                  >
                    {app}
                  </div>
                ))}
                <ChevronRight className="w-4 h-4 text-surface-500" />
              </div>

              {/* Footer stats */}
              <div className="pt-4 border-t border-surface-700/50 grid grid-cols-3 gap-2 sm:gap-4">
                <div>
                  <p className="text-base sm:text-lg font-semibold text-white">{workflow.runs.toLocaleString()}</p>
                  <p className="text-[10px] sm:text-xs text-surface-500">{t('workflow.totalRuns')}</p>
                </div>
                <div>
                  <p className="text-base sm:text-lg font-semibold text-emerald-400">{workflow.successRate}%</p>
                  <p className="text-[10px] sm:text-xs text-surface-500">{t('workflow.successRate')}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-surface-300">{workflow.lastRun}</p>
                  <p className="text-[10px] sm:text-xs text-surface-500">{t('workflow.lastRun')}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Workflow list view */}
      {!isLoading && filteredWorkflows.length > 0 && viewMode === 'list' && (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-surface-700">
                <th className="text-left text-sm font-medium text-surface-400 p-4">{t('workflow.name')}</th>
                <th className="text-left text-sm font-medium text-surface-400 p-4">{t('common.status', 'Status')}</th>
                <th className="text-left text-sm font-medium text-surface-400 p-4">{t('workflow.trigger')}</th>
                <th className="text-left text-sm font-medium text-surface-400 p-4">{t('workflow.totalRuns')}</th>
                <th className="text-left text-sm font-medium text-surface-400 p-4">{t('workflow.successRate')}</th>
                <th className="text-left text-sm font-medium text-surface-400 p-4">{t('workflow.lastRun')}</th>
                <th className="text-right text-sm font-medium text-surface-400 p-4">{t('workflow.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkflows.map((workflow) => (
                <motion.tr
                  key={workflow.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-surface-800 hover:bg-surface-800/50 transition-colors cursor-pointer group"
                  onClick={() => setSelectedWorkflow(workflow.id)}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${workflow.color} flex items-center justify-center`}>
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-white group-hover:text-nexus-400 transition-colors">
                          {workflow.name}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {workflow.apps.map((app, i) => (
                            <span key={i} className="text-sm">{app}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={clsx(
                      'badge',
                      workflow.status === 'active' && 'badge-success',
                      workflow.status === 'paused' && 'badge-warning',
                      workflow.status === 'error' && 'bg-red-500/20 text-red-400 border-red-500/30'
                    )}>
                      {t(`workflow.status.${workflow.status}`, workflow.status)}
                    </span>
                  </td>
                  <td className="p-4 text-surface-300 text-sm">{workflow.trigger}</td>
                  <td className="p-4 text-white">{workflow.runs.toLocaleString()}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-surface-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                          style={{ width: `${workflow.successRate}%` }}
                        />
                      </div>
                      <span className="text-sm text-emerald-400">{workflow.successRate}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-surface-400 text-sm">{workflow.lastRun}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white transition-all">
                        <Play className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white transition-all">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white transition-all">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* No search results state */}
      {!isLoading && workflows.length > 0 && filteredWorkflows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <Search className="w-10 h-10 text-surface-500 mb-4" />
          <p className="text-surface-400">{t('workflow.noWorkflowsMatching', 'No workflows matching "{{query}}"', { query: searchQuery })}</p>
        </div>
      )}
    </div>
  )
}
