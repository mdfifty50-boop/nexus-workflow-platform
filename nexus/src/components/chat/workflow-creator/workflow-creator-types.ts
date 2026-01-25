/**
 * Workflow Creator Types
 *
 * Type definitions for the conversational workflow creation system.
 */

// ============================================================================
// Creation Step Constants
// ============================================================================

export const CREATION_STEPS = {
  TRIGGER: 'trigger',
  ACTIONS: 'actions',
  CONFIGURE: 'configure',
  REVIEW: 'review',
  COMPLETE: 'complete',
} as const

export type CreationStep = typeof CREATION_STEPS[keyof typeof CREATION_STEPS]

// ============================================================================
// Node Type Constants
// ============================================================================

export const NODE_CATEGORIES = {
  TRIGGER: 'trigger',
  ACTION: 'action',
  CONDITION: 'condition',
  TRANSFORM: 'transform',
  LOOP: 'loop',
  DELAY: 'delay',
} as const

export type NodeCategory = typeof NODE_CATEGORIES[keyof typeof NODE_CATEGORIES]

// ============================================================================
// Validation Error Types
// ============================================================================

export const VALIDATION_ERROR_TYPES = {
  MISSING_TRIGGER: 'missing_trigger',
  MISSING_ACTIONS: 'missing_actions',
  INCOMPLETE_CONFIG: 'incomplete_config',
  INVALID_CONNECTION: 'invalid_connection',
  MISSING_INTEGRATION: 'missing_integration',
} as const

export type ValidationErrorType = typeof VALIDATION_ERROR_TYPES[keyof typeof VALIDATION_ERROR_TYPES]

// ============================================================================
// Integration Categories
// ============================================================================

export const INTEGRATION_CATEGORIES = {
  COMMUNICATION: 'communication',
  PRODUCTIVITY: 'productivity',
  CRM: 'crm',
  DEVELOPER: 'developer',
  MARKETING: 'marketing',
  STORAGE: 'storage',
  SOCIAL: 'social',
  AI: 'ai',
  CUSTOM: 'custom',
} as const

export type IntegrationCategory = typeof INTEGRATION_CATEGORIES[keyof typeof INTEGRATION_CATEGORIES]

// ============================================================================
// Core Types
// ============================================================================

/**
 * Node suggestion based on user input context
 */
export interface NodeSuggestion {
  nodeType: string
  name: string
  description: string
  icon: string
  category: NodeCategory
  confidence: number
  integration?: string
  requiredConfig?: string[]
}

/**
 * Trigger node configuration
 */
export interface TriggerNode {
  id: string
  type: string
  name: string
  icon: string
  integration: string
  config: Record<string, unknown>
  description?: string
}

/**
 * Action node configuration
 */
export interface ActionNode {
  id: string
  type: string
  name: string
  icon: string
  integration: string
  config: Record<string, unknown>
  order: number
  description?: string
}

/**
 * Connection between nodes
 */
export interface Connection {
  id: string
  sourceId: string
  targetId: string
  label?: string
}

/**
 * Validation error for workflow
 */
export interface ValidationError {
  type: ValidationErrorType
  message: string
  nodeId?: string
  field?: string
}

/**
 * Workflow draft being built
 */
export interface WorkflowDraft {
  name: string
  description?: string
  trigger?: TriggerNode
  actions: ActionNode[]
  connections: Connection[]
}

/**
 * Current state of workflow creation
 */
export interface WorkflowCreationState {
  currentStep: CreationStep
  workflowDraft: WorkflowDraft
  suggestions: NodeSuggestion[]
  validationErrors: ValidationError[]
  isProcessing: boolean
  conversationHistory: ConversationMessage[]
}

// ============================================================================
// Conversation Types
// ============================================================================

export const MESSAGE_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
} as const

export type MessageRole = typeof MESSAGE_ROLES[keyof typeof MESSAGE_ROLES]

export const MESSAGE_TYPES = {
  TEXT: 'text',
  SUGGESTION: 'suggestion',
  TRIGGER_SELECT: 'trigger_select',
  ACTION_SELECT: 'action_select',
  CONFIG_PROMPT: 'config_prompt',
  PREVIEW: 'preview',
  VALIDATION: 'validation',
  COMPLETE: 'complete',
} as const

export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES]

/**
 * Message in the conversation
 */
export interface ConversationMessage {
  id: string
  role: MessageRole
  type: MessageType
  content: string
  timestamp: Date
  metadata?: {
    suggestions?: NodeSuggestion[]
    trigger?: TriggerNode
    action?: ActionNode
    validationErrors?: ValidationError[]
    workflowPreview?: WorkflowDraft
  }
}

// ============================================================================
// Integration Types
// ============================================================================

/**
 * Available integration for triggers and actions
 */
export interface Integration {
  id: string
  name: string
  icon: string
  category: IntegrationCategory
  description: string
  connected: boolean
  triggers: IntegrationTrigger[]
  actions: IntegrationAction[]
}

/**
 * Trigger available from an integration
 */
export interface IntegrationTrigger {
  id: string
  name: string
  description: string
  icon: string
  configFields: ConfigField[]
}

/**
 * Action available from an integration
 */
export interface IntegrationAction {
  id: string
  name: string
  description: string
  icon: string
  configFields: ConfigField[]
}

/**
 * Configuration field for triggers/actions
 */
export interface ConfigField {
  id: string
  name: string
  type: 'text' | 'select' | 'multiselect' | 'boolean' | 'number' | 'textarea' | 'json'
  required: boolean
  placeholder?: string
  description?: string
  options?: { value: string; label: string }[]
  defaultValue?: unknown
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * Return type for useWorkflowCreator hook
 */
export interface UseWorkflowCreatorReturn {
  // State
  state: WorkflowCreationState

  // Actions
  processUserInput: (input: string) => Promise<void>
  setTrigger: (trigger: TriggerNode) => void
  addAction: (action: Omit<ActionNode, 'id' | 'order'>) => void
  removeAction: (actionId: string) => void
  updateActionConfig: (actionId: string, config: Record<string, unknown>) => void
  updateTriggerConfig: (config: Record<string, unknown>) => void
  reorderActions: (fromIndex: number, toIndex: number) => void

  // Navigation
  goToStep: (step: CreationStep) => void
  nextStep: () => void
  previousStep: () => void

  // Validation
  validateWorkflow: () => ValidationError[]
  canProceed: () => boolean

  // Finalization
  saveWorkflow: () => Promise<{ success: boolean; workflowId?: string; error?: string }>
  saveDraft: () => void
  loadDraft: () => WorkflowDraft | null
  clearDraft: () => void

  // Suggestions
  getSuggestions: (context: string) => NodeSuggestion[]

  // Reset
  reset: () => void
}

// ============================================================================
// Preset Trigger and Action Definitions
// ============================================================================

export interface PresetTrigger {
  id: string
  integration: string
  type: string
  name: string
  description: string
  icon: string
  popular: boolean
  configFields: ConfigField[]
}

export interface PresetAction {
  id: string
  integration: string
  type: string
  name: string
  description: string
  icon: string
  popular: boolean
  configFields: ConfigField[]
}

// ============================================================================
// Workflow Creation Events
// ============================================================================

export const WORKFLOW_EVENTS = {
  TRIGGER_SELECTED: 'trigger_selected',
  ACTION_ADDED: 'action_added',
  ACTION_REMOVED: 'action_removed',
  CONFIG_UPDATED: 'config_updated',
  STEP_CHANGED: 'step_changed',
  VALIDATION_RUN: 'validation_run',
  WORKFLOW_SAVED: 'workflow_saved',
  DRAFT_SAVED: 'draft_saved',
} as const

export type WorkflowEvent = typeof WORKFLOW_EVENTS[keyof typeof WORKFLOW_EVENTS]
