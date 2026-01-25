/**
 * Chat Components
 *
 * ChatGPT-style chat interface components with sidebar integration.
 */

// =============================================================================
// Layout Context
// =============================================================================
export {
  ChatLayoutProvider,
  useChatLayout,
  VIEW_MODES,
  type ViewMode,
  type ChatLayoutState,
  type ChatLayoutContextType,
  type ChatLayoutProviderProps
} from './ChatLayoutContext'

// =============================================================================
// Sidebar Components
// =============================================================================
export {
  ChatSidebar,
  SidebarToggleButton,
  ChatSidebarContainer,
  type ChatSidebarProps,
  type SidebarToggleButtonProps,
  type ChatSidebarContainerProps
} from './ChatSidebar'

export {
  DashboardPanel,
  type DashboardPanelProps,
  type QuickAction
} from './DashboardPanel'

export {
  QuickStatsWidget,
  type WorkflowStats,
  type QuickStatsWidgetProps
} from './QuickStatsWidget'

export {
  RecentWorkflowsList,
  WORKFLOW_STATUS,
  type WorkflowStatus,
  type RecentWorkflow,
  type RecentWorkflowsListProps
} from './RecentWorkflowsList'

export {
  SidebarNavigation,
  type NavItem,
  type SidebarNavigationProps
} from './SidebarNavigation'

// =============================================================================
// Chat Container Components (existing)
// =============================================================================
export { ChatContainer } from './ChatContainer'
export { ChatHeader } from './ChatHeader'
export { ChatMessage } from './ChatMessage'
export { ChatInput } from './ChatInput'
export { useChatState } from './useChatState'

// Re-export types explicitly to avoid conflicts
export {
  MESSAGE_ROLES,
  EMBEDDED_CONTENT_TYPES,
  type MessageRole,
  type EmbeddedContentType,
  type EmbeddedContent,
  type ChatMessage as ChatMessageType,
  type ChatSession,
  type ChatContainerProps,
  type ChatMessageProps,
  type ChatInputProps,
  type ChatHeaderProps as ChatHeaderPropsType,
  type UseChatStateReturn
} from './types'

// =============================================================================
// Embed Components (existing)
// =============================================================================
export { EmbedContainer } from './embeds/EmbedContainer'
export { WorkflowPreviewEmbed } from './embeds/WorkflowPreviewEmbed'
export { TemplatePreviewEmbed } from './embeds/TemplatePreviewEmbed'
export { IntegrationPreviewEmbed } from './embeds/IntegrationPreviewEmbed'
export { WorkflowDiagramMini } from './embeds/WorkflowDiagramMini'

// Re-export embed types explicitly to avoid conflicts with RecentWorkflowsList exports
export {
  WORKFLOW_STATUS as EMBED_WORKFLOW_STATUS,
  EXECUTION_STATUS,
  CONNECTION_STATUS,
  NODE_TYPE,
  type WorkflowStatus as EmbedWorkflowStatus,
  type ExecutionStatus,
  type ConnectionStatus,
  type NodeType,
  type NodePreview,
  type WorkflowPreviewData,
  type TemplatePreviewData,
  type IntegrationPreviewData,
  type ExecutionResultData,
  type EmbedActions,
  type BaseEmbedProps,
  type WorkflowPreviewEmbedProps,
  type TemplatePreviewEmbedProps,
  type IntegrationPreviewEmbedProps,
  type ExecutionResultEmbedProps,
  type WorkflowDiagramMiniProps,
  type EmbedContainerProps
} from './embeds/embed-types'

// =============================================================================
// Workflow Preview Card (live execution visualization)
// =============================================================================
export { WorkflowPreviewCard } from './WorkflowPreviewCard'

// =============================================================================
// Workflow Creator (existing)
// =============================================================================
export { useWorkflowCreator } from './workflow-creator/useWorkflowCreator'
export { NodeSuggestionCard } from './workflow-creator/NodeSuggestionCard'
export * from './workflow-creator/workflow-creator-types'
export * from './workflow-creator/workflow-presets'
