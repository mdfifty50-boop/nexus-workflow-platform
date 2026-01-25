/**
 * Workflow Creator Module
 *
 * Exports all components and utilities for the conversational workflow creation system.
 */

// Main Components
export {
  ConversationalWorkflowCreator,
  CompactWorkflowCreator,
  InlineWorkflowCreator,
} from './ConversationalWorkflowCreator'

export {
  WorkflowBuilderChat,
  MessageBubble,
  StepIndicator,
  QuickActions,
  ChatInput,
} from './WorkflowBuilderChat'

export {
  WorkflowPreviewInline,
  WorkflowFlowVisual,
} from './WorkflowPreviewInline'

export {
  NodeSuggestionCard,
  NodeSuggestionGrid,
  NodeSuggestionList,
} from './NodeSuggestionCard'

export {
  TriggerSelector,
  CompactTriggerSelector,
} from './TriggerSelector'

export {
  ActionSelector,
  CompactActionSelector,
} from './ActionSelector'

// Hook
export { useWorkflowCreator } from './useWorkflowCreator'

// Presets
export {
  PRESET_TRIGGERS,
  PRESET_ACTIONS,
  getPopularTriggers,
  getPopularActions,
  getTriggersByIntegration,
  getActionsByIntegration,
  searchTriggers,
  searchActions,
  getTriggerIntegrations,
  getActionIntegrations,
} from './workflow-presets'

// Types
export type {
  WorkflowCreationState,
  WorkflowDraft,
  TriggerNode,
  ActionNode,
  NodeSuggestion,
  ValidationError,
  CreationStep,
  NodeCategory,
  ValidationErrorType,
  IntegrationCategory,
  ConversationMessage,
  MessageRole,
  MessageType,
  Connection,
  Integration,
  IntegrationTrigger,
  IntegrationAction,
  ConfigField,
  UseWorkflowCreatorReturn,
  PresetTrigger,
  PresetAction,
  WorkflowEvent,
} from './workflow-creator-types'

// Constants
export {
  CREATION_STEPS,
  NODE_CATEGORIES,
  VALIDATION_ERROR_TYPES,
  INTEGRATION_CATEGORIES,
  MESSAGE_ROLES,
  MESSAGE_TYPES,
  WORKFLOW_EVENTS,
} from './workflow-creator-types'
