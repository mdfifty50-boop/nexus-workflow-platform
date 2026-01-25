/**
 * Context Exports
 *
 * Central export point for all React contexts used in the application.
 */

// Workflow Context (Original - for backward compatibility)
export {
  WorkflowProvider,
  useWorkflowContext,
  useWorkflowState,
  useActiveWorkflow
} from './WorkflowContext'

export type {
  WorkflowContextValue,
  WorkflowContextState,
  WorkflowContextActions,
  WorkflowNode,
  ActiveWorkflow
} from './WorkflowContext'

// Split Workflow Contexts (Performance Optimized)
export {
  WorkflowStateProvider,
  useWorkflowStateContext,
  useWorkflowStateOnly,
  useWorkflowStateSelector,
  useActiveWorkflowState,
  useWorkflowById,
  useConnectionStatus,
  useWorkflowLoading,
  useSessionTotals,
  useAutonomyLevel,
  useWorkflowUpdater,
  useWorkflowList,
  useWorkflowStats,
  useWorkflowProgress
} from './WorkflowStateContext'

export type {
  WorkflowStateValue,
  WorkflowStateContextValue
} from './WorkflowStateContext'

export {
  WorkflowActionsProvider,
  useWorkflowActions,
  useWorkflowAction
} from './WorkflowActionsContext'

export type {
  WorkflowActions
} from './WorkflowActionsContext'

// Auth Context
export { AuthProvider, useAuth } from './AuthContext'
export type { AuthContextType, UserProfile, LegacyUser } from './AuthContext'

// Personalization Context
export {
  PersonalizationProvider,
  usePersonalization,
  PERSONA_DEFINITIONS,
  AGENT_NAMES_BY_PERSONA,
  PERSONA_CATEGORIES,
  ONBOARDING_PERSONAS
} from './PersonalizationContext'

export type {
  PersonaType,
  PersonaInfo,
  AgentNames,
  PersonaCategory
} from './PersonalizationContext'

// Toast Context
export { ToastProvider, useToast } from './ToastContext'

// History Context
export {
  HistoryProvider,
  useHistory,
  useHistoryTrackedValue,
  createHistoryEntry
} from './HistoryContext'

export type {
  HistoryEntry,
  HistoryActionType,
  HistoryContextValue
} from './HistoryContext'
