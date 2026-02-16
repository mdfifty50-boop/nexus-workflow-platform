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
// EMPTY STATE DATA - No fake data, real data from services
// =============================================================================

const EMPTY_STATS: WorkflowStats = {
  active: 0,
  completed: 0,
  failed: 0,
  total: 0
}

const EMPTY_WORKFLOWS: RecentWorkflow[] = []

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
          stats: EMPTY_STATS,
          recentWorkflows: EMPTY_WORKFLOWS,
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
