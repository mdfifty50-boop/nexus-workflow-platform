/**
 * ChatDemo Page
 *
 * Demo page for the ChatGPT-style chat interface with sidebar.
 * Shows the ChatContainer component with full functionality and
 * the collapsible ChatSidebar with dashboard widgets.
 */

import { useCallback, type ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChatContainer,
  ChatLayoutProvider,
  ChatSidebarContainer,
  type RecentWorkflow,
  type WorkflowStats
} from '@/components/chat'

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_STATS: WorkflowStats = {
  active: 12,
  completed: 847,
  failed: 3,
  total: 862
}

const MOCK_WORKFLOWS: RecentWorkflow[] = [
  {
    id: 'wf-1',
    name: 'Email to Slack Notification',
    status: 'running',
    updatedAt: new Date(Date.now() - 1000 * 60 * 5) // 5 mins ago
  },
  {
    id: 'wf-2',
    name: 'Daily Report Generator',
    status: 'completed',
    updatedAt: new Date(Date.now() - 1000 * 60 * 30) // 30 mins ago
  },
  {
    id: 'wf-3',
    name: 'Customer Onboarding Flow',
    status: 'completed',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
  },
  {
    id: 'wf-4',
    name: 'Inventory Sync',
    status: 'failed',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4) // 4 hours ago
  },
  {
    id: 'wf-5',
    name: 'Social Media Scheduler',
    status: 'paused',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
  }
]

// =============================================================================
// COMPONENT
// =============================================================================

export function ChatDemo(): ReactElement {
  const navigate = useNavigate()

  const handleToggleDashboard = useCallback(() => {
    navigate('/dashboard')
  }, [navigate])

  const handleWorkflowClick = useCallback((workflow: RecentWorkflow) => {
    navigate(`/workflows/${workflow.id}`)
  }, [navigate])

  return (
    <ChatLayoutProvider>
      <ChatSidebarContainer
        sidebarProps={{
          stats: MOCK_STATS,
          recentWorkflows: MOCK_WORKFLOWS,
          loading: false,
          onWorkflowClick: handleWorkflowClick
        }}
      >
        <ChatContainer
          onToggleDashboard={handleToggleDashboard}
          showDashboardButton={true}
        />
      </ChatSidebarContainer>
    </ChatLayoutProvider>
  )
}

export default ChatDemo
