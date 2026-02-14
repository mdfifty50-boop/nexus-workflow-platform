/**
 * Dashboard Panel
 *
 * Dashboard content displayed within the chat sidebar.
 * Contains workflow stats, quick actions, recent workflows, and usage info.
 */

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { QuickStatsWidget, type WorkflowStats } from './QuickStatsWidget'
import { RecentWorkflowsList, type RecentWorkflow, WORKFLOW_STATUS } from './RecentWorkflowsList'
import { SidebarNavigation } from './SidebarNavigation'
import { useChatState } from './useChatState'

// =============================================================================
// TYPES
// =============================================================================

export interface QuickAction {
  /** Unique identifier */
  id: string
  /** Display label */
  label: string
  /** Icon component or emoji */
  icon: React.ReactNode
  /** Click handler or route path */
  action: string | (() => void)
  /** Gradient colors for the action button */
  gradient?: string
}

export interface DashboardPanelProps {
  /** Custom workflow stats (will use mock if not provided) */
  stats?: WorkflowStats
  /** Custom recent workflows (will use mock if not provided) */
  recentWorkflows?: RecentWorkflow[]
  /** Whether data is loading */
  loading?: boolean
  /** Callback when sidebar should close (for mobile) */
  onCloseSidebar?: () => void
  /** Callback when a workflow is clicked */
  onWorkflowClick?: (workflow: RecentWorkflow) => void
  /** Additional CSS classes */
  className?: string
}

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_STATS: WorkflowStats = {
  active: 3,
  completed: 47,
  failed: 2,
  total: 52
}

const MOCK_WORKFLOWS: RecentWorkflow[] = [
  {
    id: '1',
    name: 'Email Automation',
    status: WORKFLOW_STATUS.RUNNING,
    updatedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
    progress: { completed: 3, total: 5 }
  },
  {
    id: '2',
    name: 'Lead Qualification',
    status: WORKFLOW_STATUS.COMPLETED,
    updatedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
    progress: { completed: 4, total: 4 }
  },
  {
    id: '3',
    name: 'Data Sync Pipeline',
    status: WORKFLOW_STATUS.RUNNING,
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    progress: { completed: 7, total: 10 }
  },
  {
    id: '4',
    name: 'Report Generator',
    status: WORKFLOW_STATUS.FAILED,
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    progress: { completed: 2, total: 6 }
  },
  {
    id: '5',
    name: 'Customer Onboarding',
    status: WORKFLOW_STATUS.COMPLETED,
    updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
    progress: { completed: 8, total: 8 }
  }
]

// =============================================================================
// QUICK ACTIONS
// =============================================================================

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'new-workflow',
    label: 'workflow.create',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    action: '/workflow-demo',
    gradient: 'from-cyan-500 to-blue-500'
  },
  {
    id: 'templates',
    label: 'navigation.templates',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
      </svg>
    ),
    action: '/templates',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    id: 'integrations',
    label: 'navigation.integrations',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    action: '/integrations',
    gradient: 'from-emerald-500 to-teal-500'
  },
  {
    id: 'settings',
    label: 'navigation.settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    action: '/settings',
    gradient: 'from-orange-500 to-amber-500'
  }
]

// =============================================================================
// COMPONENT
// =============================================================================

export function DashboardPanel({
  stats,
  recentWorkflows,
  loading = false,
  onCloseSidebar,
  onWorkflowClick,
  className
}: DashboardPanelProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [dataLoading, setDataLoading] = useState(loading)
  const [workflowStats, setWorkflowStats] = useState<WorkflowStats>(stats || MOCK_STATS)
  const [workflows, setWorkflows] = useState<RecentWorkflow[]>(recentWorkflows || MOCK_WORKFLOWS)

  // Get chat sessions for sidebar navigation
  const { getSessions, currentSession } = useChatState()
  const chatSessions = getSessions()

  // Simulate data loading if no data provided
  useEffect(() => {
    if (!stats || !recentWorkflows) {
      setDataLoading(true)
      const timer = setTimeout(() => {
        setWorkflowStats(MOCK_STATS)
        setWorkflows(MOCK_WORKFLOWS)
        setDataLoading(false)
      }, 800)
      return () => clearTimeout(timer)
    } else {
      setWorkflowStats(stats)
      setWorkflows(recentWorkflows)
      setDataLoading(false)
    }
  }, [stats, recentWorkflows])

  // Handle quick action click
  const handleQuickAction = useCallback((action: QuickAction) => {
    if (typeof action.action === 'string') {
      navigate(action.action)
      onCloseSidebar?.()
    } else {
      action.action()
    }
  }, [navigate, onCloseSidebar])

  // Handle stat click
  const handleStatClick = useCallback((statType: keyof WorkflowStats) => {
    // Navigate to workflows filtered by status
    navigate(`/workflows?status=${statType}`)
    onCloseSidebar?.()
  }, [navigate, onCloseSidebar])

  // Handle workflow click
  const handleWorkflowClick = useCallback((workflow: RecentWorkflow) => {
    if (onWorkflowClick) {
      onWorkflowClick(workflow)
    } else {
      navigate(`/workflow-demo?id=${workflow.id}`)
    }
    onCloseSidebar?.()
  }, [navigate, onWorkflowClick, onCloseSidebar])

  // Handle view all workflows
  const handleViewAllWorkflows = useCallback(() => {
    navigate('/workflows')
    onCloseSidebar?.()
  }, [navigate, onCloseSidebar])

  // Handle chat session selection - use localStorage event to communicate with ChatContainer
  const handleSelectSession = useCallback((sessionId: string) => {
    // Save the selected session ID to localStorage for ChatContainer to pick up
    localStorage.setItem('nexus-pending-session', sessionId)
    // Dispatch a storage event for same-window communication
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'nexus-pending-session',
      newValue: sessionId
    }))
    navigate('/chat-demo')
    onCloseSidebar?.()
  }, [navigate, onCloseSidebar])

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Navigation Section */}
      <div className="px-3 py-4 border-b border-border">
        <SidebarNavigation
          onCloseSidebar={onCloseSidebar}
          closeSidebarOnNavigate
          chatSessions={chatSessions}
          currentSessionId={currentSession?.id}
          onSelectSession={handleSelectSession}
        />
      </div>

      {/* Quick Actions Grid */}
      <div className="px-4 py-4 border-b border-border">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-3">
          {t('dashboard.quickActions')}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_ACTIONS.map(action => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action)}
              className={cn(
                'flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl',
                'transition-all hover:scale-105 active:scale-95',
                `bg-gradient-to-br ${action.gradient} text-white`,
                'shadow-lg shadow-black/10'
              )}
            >
              {action.icon}
              <span className="text-xs font-medium">{t(action.label)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="px-4 py-4 border-b border-border">
        <QuickStatsWidget
          stats={workflowStats}
          loading={dataLoading}
          onStatClick={handleStatClick}
        />
      </div>

      {/* Recent Workflows Section */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <RecentWorkflowsList
          workflows={workflows}
          loading={dataLoading}
          maxItems={5}
          onWorkflowClick={handleWorkflowClick}
          onViewAllClick={handleViewAllWorkflows}
        />
      </div>

      {/* Usage/Quota Section */}
      <div className="px-4 py-3 border-t border-border bg-muted/20">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{t('dashboard.workflowsThisMonth')}</span>
          <span className="font-medium">
            <span className="text-foreground">{workflowStats.total}</span>
            <span className="text-muted-foreground"> / 100</span>
          </span>
        </div>
        <div className="mt-2 h-1.5 bg-muted/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (workflowStats.total / 100) * 100)}%` }}
          />
        </div>
        <button
          onClick={() => { navigate('/settings/billing'); onCloseSidebar?.() }}
          className="mt-2 text-xs text-primary hover:underline"
        >
          {t('dashboard.upgradeUnlimited')}
        </button>
      </div>
    </div>
  )
}

export default DashboardPanel
