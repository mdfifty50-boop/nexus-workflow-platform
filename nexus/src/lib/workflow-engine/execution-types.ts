/**
 * Execution Engine Types
 *
 * Type definitions for the extracted workflow execution engine.
 * These types decouple the execution logic from React component state,
 * enabling:
 * - Testable pure-function execution
 * - Checkpoint/resume for persistent agents (F8)
 * - Abort support via AbortSignal
 * - Dispatch-based state updates (no stale closures)
 *
 * The engine maintains its OWN node state internally and dispatches
 * updates to the host (React component or persistent agent runner).
 */

import type {
  NodeStatus,
  CardPhase,
  WorkflowNode,
  ChatWorkflow,
  OrchestrationResult,
} from '@/components/chat/wpc-types'

import type { IntegrationInfo } from '@/services/IntegrationAuthService'

// ============================================================================
// Execution Checkpoint — Serializable state for pause/resume (R-P0-1)
// ============================================================================

/**
 * Serializable execution state that survives process restarts.
 * Saved to Supabase on every HITL pause. Resume reads checkpoint
 * and re-enters the node loop at the saved index.
 */
export interface ExecutionCheckpoint {
  /** Workflow being executed */
  workflowId: string
  /** Current position in the node array */
  currentNodeIndex: number
  /** Results from completed nodes (serializable) */
  completedNodes: Array<{
    index: number
    nodeId: string
    status: NodeStatus
    result: unknown
  }>
  /** User-collected parameters accumulated during execution */
  collectedParams: Record<string, string>
  /** Phase at time of checkpoint */
  phase: 'executing' | 'paused' | 'awaiting_approval'
  /** Orchestration results discovered during pre-flight */
  orchestrationResults: Array<{
    nodeId: string
    result: OrchestrationResult
  }>
  /** Trigger sample data from first node (if available) */
  triggerSampleData?: unknown
  /** Retry counts per node at checkpoint time */
  retryCounts: Record<string, number>
  /** ISO timestamp of checkpoint creation */
  timestamp: string
}

// ============================================================================
// Execution Actions — Dispatched from engine to host (R-P1-5, R-P1-8)
// ============================================================================

/**
 * Discriminated union of all state updates the engine can dispatch.
 * The host (React component) reduces these into its own state.
 * This pattern eliminates stale closures (FIX-023) because:
 * - Engine never reads React state directly
 * - Engine dispatches intentions, component applies them
 * - React guarantees dispatch identity stability
 */
export type ExecutionAction =
  | NodeStatusAction
  | NodesBatchUpdateAction
  | PhaseChangeAction
  | LogAction
  | TriggerSampleDataAction
  | TriggerDataNeededAction
  | StoreOrchestrationResultAction
  | ApprovalNeededAction
  | CheckpointAction
  | ExecutionCompleteAction

/** Update a single node's status and optional result/error */
export interface NodeStatusAction {
  type: 'NODE_STATUS'
  index: number
  status: NodeStatus
  result?: unknown
  error?: string
}

/**
 * Batch update multiple nodes at once.
 * Used for the common pattern: "mark all nodes up to i as success, rest as pending"
 */
export interface NodesBatchUpdateAction {
  type: 'NODES_BATCH_UPDATE'
  updates: Array<{
    index: number
    status: NodeStatus
    result?: unknown
    error?: string
  }>
}

/** Transition the overall execution phase */
export interface PhaseChangeAction {
  type: 'PHASE_CHANGE'
  phase: CardPhase
}

/** Add a log entry visible to the user */
export interface LogAction {
  type: 'LOG'
  message: string
}

/** Store trigger sample data from the first node's execution */
export interface TriggerSampleDataAction {
  type: 'TRIGGER_SAMPLE_DATA'
  data: unknown
}

/**
 * Signal that a trigger node needs sample data before execution can continue.
 * Engine PAUSES after dispatching this — host must provide sample data
 * and re-invoke the engine with a checkpoint to resume.
 */
export interface TriggerDataNeededAction {
  type: 'TRIGGER_DATA_NEEDED'
  nodeId: string
  nodeIndex: number
}

/** Store a discovered orchestration result for a node */
export interface StoreOrchestrationResultAction {
  type: 'STORE_ORCHESTRATION_RESULT'
  nodeId: string
  result: OrchestrationResult
}

/**
 * Signal that a HITL approval is needed.
 * The engine PAUSES after dispatching this — the host must
 * resume execution after the user approves/rejects.
 */
export interface ApprovalNeededAction {
  type: 'APPROVAL_NEEDED'
  nodeIndex: number
  approvalRequestId: string
  approvalContext: {
    workflowName: string
    stepName: string
    stepIndex: number
    reason: string
    displayMessage: string
    riskLevel: string
    config?: Record<string, unknown>
  }
}

/** Persist a checkpoint (e.g., on HITL pause or periodic save) */
export interface CheckpointAction {
  type: 'CHECKPOINT'
  checkpoint: ExecutionCheckpoint
}

/** Signal that execution has completed (success or failure) */
export interface ExecutionCompleteAction {
  type: 'EXECUTION_COMPLETE'
  success: boolean
  /** Optional workflow name for analytics */
  workflowName?: string
  /** Integration toolkits used (for analytics) */
  integrations?: string[]
}

// ============================================================================
// Execution Context — Everything the engine needs from the host
// ============================================================================

/**
 * Read-only context passed to the engine at invocation time.
 * The engine does NOT hold references to React state — all data
 * flows through this context object.
 */
export interface ExecutionContext {
  /** The workflow definition (from ChatWorkflow prop) */
  workflow: ChatWorkflow
  /** Snapshot of node states at execution start */
  nodes: WorkflowNode[]
  /** Required integrations for connection checking */
  requiredIntegrations: IntegrationInfo[]
  /** Pre-discovered orchestration results from pre-flight */
  orchestrationResults: Map<string, OrchestrationResult>
  /** Trigger sample data (if already available from previous execution) */
  triggerSampleData?: unknown
  /** WhatsApp backend URL for native WhatsApp execution (FIX-146) */
  waBackendUrl: string
}

// ============================================================================
// Engine Configuration — Flags and settings
// ============================================================================

/**
 * Feature flags and configuration for the execution engine.
 */
export interface EngineConfig {
  /** Use orchestration-first path for known toolkits (FIX-062) */
  useOrchestrationFirst: boolean
  /** Enable generic orchestration for unknown toolkits */
  useGenericOrchestration: boolean
}

// ============================================================================
// Engine Run Parameters — Full argument set for engine.run()
// ============================================================================

/**
 * Complete parameter set for launching the execution engine.
 */
export interface EngineRunParams {
  /** Execution context (workflow, nodes, integrations) */
  context: ExecutionContext
  /** Dispatch function to send state updates to host */
  dispatch: (action: ExecutionAction) => void
  /** AbortSignal for cancellation support (R-P2-11) */
  abortSignal: AbortSignal
  /** Resume from checkpoint instead of starting fresh */
  checkpoint?: ExecutionCheckpoint
  /** Feature flags and settings */
  config: EngineConfig
  /** Injectable service dependencies */
  services: EngineServices
}

// ============================================================================
// Internal Engine State — Managed by the engine during execution
// ============================================================================

/**
 * Mutable state that the engine maintains during execution.
 * This is NOT exposed to the host — the host sees only dispatched actions.
 * Having the engine own its state eliminates stale closure issues.
 */
export interface EngineInternalState {
  /** Current node statuses (engine's authoritative copy) */
  nodeStatuses: NodeStatus[]
  /** Results per node index */
  nodeResults: Array<unknown | undefined>
  /** Retry counts per node key */
  retryCounts: Map<string, number>
  /** Orchestration results accumulated during execution */
  orchestrationResults: Map<string, OrchestrationResult>
  /** Trigger sample data set by first node */
  triggerSampleData?: unknown
  /** Whether execution has been aborted */
  aborted: boolean
}

// ============================================================================
// Verified Execution Result (mirrors VerifiedExecutor output)
// ============================================================================

/**
 * Result from the VerifiedExecutor service.
 * Re-declared here to avoid importing the full service in types.
 */
export interface VerifiedExecutionResult {
  success: boolean
  verified: boolean
  rawResponse?: unknown
  proof?: {
    type: string
    details: Record<string, unknown>
  }
  error?: {
    message: string
    code?: string
  }
  executionTimeMs: number
}

// ============================================================================
// Error Classification (mirrors WorkflowIntelligenceService output)
// ============================================================================

/**
 * Classified error from the WorkflowIntelligenceService.
 */
export interface ClassifiedError {
  friendlyMessage: string
  classification?: {
    category: string
    severity: string
    isRecoverable: boolean
  }
}

// ============================================================================
// Pipeline Resolution Result (mirrors _resolveParamsWithPipeline output)
// ============================================================================

/**
 * Result from the parameter resolution pipeline.
 */
export interface PipelineResolutionResult {
  params: Record<string, unknown>
  source: 'pipeline' | 'legacy' | 'default'
  resolved?: {
    missingRequired: string[]
  }
}

// ============================================================================
// Enhanced Missing Param (mirrors _getEnhancedMissingParams output)
// ============================================================================

export interface EnhancedMissingParam {
  param: string
  prompt: string
  toolkit: string
}

// ============================================================================
// Tool Validation Result (mirrors validateToolSlug output)
// ============================================================================

export interface ToolValidationResult {
  valid: boolean
  reason?: string
  suggestion?: string
}

// ============================================================================
// Service Dependencies — Injectable services the engine calls
// ============================================================================

/**
 * All external service dependencies the engine needs.
 * Injected at construction time for testability.
 * In production: real services. In tests: mocks.
 */
export interface EngineServices {
  /** Get integration info (toolkit, name) for a node */
  getIntegrationInfo: (integration: string) => IntegrationInfo

  /** Map a node name + toolkit to a Composio tool slug */
  mapNodeToToolSlug: (nodeName: string, toolkit: string) => string | null

  /** Validate a tool slug before execution */
  validateToolSlug: (toolSlug: string, toolkit: string) => ToolValidationResult

  /** Check if a toolkit is in the known/hardcoded set */
  isToolkitKnown: (toolkit: string) => boolean

  /** Discover a tool via orchestration for unknown toolkits */
  resolveToolViaOrchestration: (nodeName: string, toolkit: string) => Promise<OrchestrationResult | null>

  /** Resolve parameters via the pipeline with legacy fallback */
  resolveParamsWithPipeline: (
    toolSlug: string,
    toolkit: string,
    node: WorkflowNode,
    collectedParams: Record<string, string> | undefined,
    workflowContext: { name: string; description: string },
    previousNodeResults: Array<{ node: WorkflowNode; result: unknown }>
  ) => Promise<PipelineResolutionResult>

  /** Validate required params using hardcoded rules */
  validateRequiredParams: (toolSlug: string, params: Record<string, unknown>) => string[]

  /** Get enhanced missing param info with user-friendly prompts */
  getEnhancedMissingParams: (
    resolved: PipelineResolutionResult['resolved'],
    toolkit: string,
    missingParams: string[]
  ) => EnhancedMissingParam[]

  /** Get schema resolver for dynamic param validation (FIX-062) */
  getSchemaResolver: () => {
    getSchema: (toolSlug: string, sessionId: string) => Promise<{ required?: string[] }>
  }

  /** Execute a tool with verification (FIX-041) */
  verifiedExecute: (
    toolSlug: string,
    params: Record<string, unknown>,
    context: {
      nodeId: string
      nodeName: string
      toolkit: string
      action: string
      workflowName: string
    }
  ) => Promise<VerifiedExecutionResult>

  /** Format execution proof for display */
  formatProofForDisplay: (proof: { type: string; details: Record<string, unknown> }) => string

  /** Classify an error for user-friendly messages (FIX-039) */
  classifyError: (error: Error, context: { nodeId: string; toolkit: string; nodeName: string }) => ClassifiedError

  /** Check if error is a "tool not found" error */
  isToolNotFoundError: (error: Error) => boolean

  /** Get fallback tools when primary tool not found (FIX-020) */
  getFallbackTools: (toolkit: string, toolSlug: string, nodeName: string) => string[]

  /** Check connection status for a toolkit (FIX-115) */
  checkConnection: (toolkit: string) => Promise<{ connected: boolean }>

  /** HITL: Pause execution for approval (FIX-178) */
  pauseForApproval: (
    workflowId: string,
    nodeId: string,
    approvalContext: unknown,
    options: {
      priority: string
      workflowName: string
      stepName: string
      timeoutMs?: number
    }
  ) => Promise<string>

  /** HITL: Get an approval request by ID */
  getApprovalRequest: (requestId: string) => unknown

  /** Record a user memory event (analytics) */
  recordEvent: (type: string, data: Record<string, unknown>) => void

  /** Fetch helper (uses fetchWithTimeout from T0.4) */
  fetch: (url: string, options?: RequestInit) => Promise<Response>
}
