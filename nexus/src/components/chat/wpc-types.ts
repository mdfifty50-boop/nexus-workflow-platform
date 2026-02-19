/**
 * WorkflowPreviewCard Types
 *
 * TypeScript interfaces and type definitions used by WorkflowPreviewCard
 * and its sub-components. Extracted for code organization.
 */

import type { CollectionQuestion } from '@/services/orchestration'

// ============================================================================
// Core Types
// ============================================================================

export type NodeStatus = 'idle' | 'pending' | 'connecting' | 'success' | 'error' | 'awaiting_approval'
export type CardPhase = 'ready' | 'checking' | 'needs_auth' | 'executing' | 'complete' | 'error' | 'awaiting_approval'

export interface WorkflowNode {
  id: string
  name: string
  type: 'trigger' | 'action' | 'output' | 'approval'
  integration?: string
  status: NodeStatus
  result?: unknown
  error?: string
  config?: Record<string, unknown>
  description?: string
  // @NEXUS-FIX-178: HITL approval node configuration - DO NOT REMOVE
  approvalConfig?: {
    priority?: 'low' | 'medium' | 'high' | 'critical'
    reason?: string
    reviewers?: string[]
    timeoutMs?: number
    timeoutAction?: 'auto_approve' | 'auto_reject' | 'escalate'
    approvalMessage?: string
    riskLevel?: 'low' | 'medium' | 'high' | 'critical'
    // @NEXUS-FIX-182: Multi-mode approval support - DO NOT REMOVE
    mode?: 'binary' | 'review_edit' | 'choose_path'
    editableFields?: Array<{
      field: string
      label: string
      currentValue: unknown
      type: 'text' | 'number' | 'select'
      options?: string[]
    }>
    pathOptions?: Array<{
      id: string
      label: string
      description?: string
      nextStepId?: string
    }>
  }
  approvalRequestId?: string
}

export interface MissingInfoItem {
  question: string
  options: string[]
  field: string
}

export interface ChatWorkflow {
  id: string
  name: string
  description: string
  nodes: Array<{
    id: string
    name: string
    type: string
    integration?: string
  }>
  // Confidence-based execution fields
  confidence?: number  // 0.0-1.0, >= 0.85 means ready to execute
  assumptions?: string[]  // List of defaults that were assumed
  missingInfo?: MissingInfoItem[]  // Questions to increase confidence
  // @NEXUS-FIX-026: Collected parameters from missingInfo answers (for auto-retry) - DO NOT REMOVE
  collectedParams?: Record<string, string>
}

export interface WorkflowPreviewCardProps {
  workflow: ChatWorkflow
  className?: string
  autoExecute?: boolean
  onExecutionComplete?: (success: boolean, results?: unknown[]) => void
  onMissingInfoSelect?: (field: string, value: string) => void  // Callback when user answers a missing info question
  // @NEXUS-FIX-004: Custom integration API key handling - DO NOT REMOVE
  customIntegrations?: Array<{ appName: string; displayName: string; apiDocsUrl: string; apiKeyUrl?: string; steps: string[]; keyHint: string; category?: string }>
  onCustomIntegrationKeySubmit?: (appName: string, apiKey: string) => Promise<boolean>
  // Node editing callbacks (state managed by parent - ChatContainer)
  onNodeRemove?: (nodeId: string) => void
  onNodeAdd?: (integration: string, actionType: string) => void
  // @NEXUS-FIX-161: Chat language for Arabic RTL + translation support - DO NOT REMOVE
  chatLanguage?: string
}

// ============================================================================
// Auth Types
// ============================================================================

export interface AuthState {
  currentIntegration: import('@/services/IntegrationAuthService').IntegrationInfo | null
  connectedIntegrations: Set<string>
  pendingIntegrations: import('@/services/IntegrationAuthService').IntegrationInfo[]
  redirectUrl: string | null
  isChecking: boolean
  isPolling: boolean  // True when polling for OAuth completion
  pollAttempts: number  // Current poll attempt count
}

// Parallel OAuth state tracking
export interface ParallelAuthState {
  [integrationId: string]: {
    status: 'pending' | 'connecting' | 'polling' | 'connected' | 'error'
    authUrl?: string
    pollAttempts: number
    error?: string
  }
}

// ============================================================================
// Orchestration Types
// ============================================================================

export interface OrchestrationResult {
  slug: string
  toolkit: string
  action: string
  displayName: string
  questions: CollectionQuestion[]
  sessionId: string
  source: 'orchestration' | 'legacy'
}

// ============================================================================
// Validation Types
// ============================================================================

export interface NodeValidation {
  nodeId: string
  nodeName: string
  isValid: boolean
  hasToolMapping: boolean
  toolSlug: string | null  // The resolved tool slug
  isDynamicSlug: boolean   // True if constructed dynamically (not from static mapping)
  missingParams: string[]
  suggestedFixes: string[]
  toolkit: string
}

export interface WorkflowValidation {
  isValid: boolean
  allNodesHaveTools: boolean
  allParamsProvided: boolean
  hasDynamicSlugs: boolean  // True if any node uses a dynamically constructed slug
  nodes: NodeValidation[]
  blockers: string[]  // Human-readable blockers
  warnings: string[]  // Non-blocking warnings
  canExecute: boolean
}
