/**
 * Workflow Execution Types - Core types for real workflow execution
 *
 * This module defines the type system for:
 * - Natural language intent parsing
 * - Workflow generation from intents
 * - External service integrations
 * - User context and preferences
 */

// ========================================
// Intent Types - What the user wants to do
// ========================================

/**
 * Categories of user intents that Nexus can handle
 */
export type IntentCategory =
  | 'food_delivery'      // Order food, meals, groceries
  | 'document_analysis'  // Analyze PDFs, images, documents
  | 'travel'             // Book flights, hotels, analyze travel packages
  | 'communication'      // Send messages, emails, notifications
  | 'scheduling'         // Calendar events, reminders
  | 'shopping'           // E-commerce, price comparison
  | 'finance'            // Payments, transfers, expense tracking
  | 'productivity'       // Task management, note-taking
  | 'research'           // Web search, data gathering
  | 'custom'             // User-defined workflows

/**
 * Extracted entities from natural language
 */
export interface ExtractedEntity {
  type: 'location' | 'time' | 'date' | 'quantity' | 'price' | 'person' | 'organization' | 'product' | 'preference' | 'constraint' | 'message' | 'channel' | 'email' | 'url'
  value: string
  confidence: number
  normalized?: string  // Standardized format (e.g., ISO date, currency amount)
  source?: 'user_input' | 'context' | 'inferred'
}

/**
 * Parsed intent from natural language command
 */
export interface ParsedIntent {
  id: string
  rawInput: string
  category: IntentCategory
  action: string  // Specific action within category (e.g., 'order', 'analyze', 'book')
  entities: ExtractedEntity[]
  confidence: number

  // Contextual information
  urgency: 'immediate' | 'today' | 'scheduled' | 'flexible'
  constraints: IntentConstraint[]
  preferences: IntentPreference[]

  // Required information tracking
  missingInfo: MissingInformation[]
  canExecute: boolean  // Whether we have enough info to proceed

  // Timestamp
  parsedAt: string

  // Intelligence Analysis (CEO Directive: Smart workflow recommendations)
  intelligence?: {
    implicitRequirements: ImplicitRequirement[]
    clarifyingQuestions: SmartQuestion[]
    recommendedTools: ToolRecommendation[]
    workflowChain: WorkflowChainStep[]
    detectedLanguage?: string
    detectedDialect?: string
    regionalContext?: string
    confidenceScore: number
  }
}

/**
 * Implicit requirement detected from user request
 * (Things needed but not explicitly stated)
 */
export interface ImplicitRequirement {
  category: string
  description: string
  reason: string
  priority: 'critical' | 'important' | 'optional'
  suggestedTools: string[]
}

/**
 * Smart clarifying question to ask user
 */
export interface SmartQuestion {
  id: string
  question: string
  category: 'language' | 'frequency' | 'audience' | 'format' | 'platform' | 'region' | 'integration'
  options: { value: string; label: string; description?: string }[]
  required: boolean
  relevanceScore: number
}

/**
 * Optimal tool recommendation based on context
 */
export interface ToolRecommendation {
  toolSlug: string
  toolName: string
  score: number
  reasons: string[]
  regionalFit: number
  accuracyRating?: string
  dialectSupport?: string[]
}

/**
 * Step in the complete workflow chain
 */
export interface WorkflowChainStep {
  step: number
  layer: 'input' | 'processing' | 'output' | 'notification'
  description: string
  requiredCapability: string
  suggestedTools: string[]
  isResolved: boolean
}

/**
 * Constraints on how the intent should be executed
 */
export interface IntentConstraint {
  type: 'budget' | 'time_limit' | 'location' | 'dietary' | 'quality' | 'custom'
  field: string
  operator: 'equals' | 'less_than' | 'greater_than' | 'contains' | 'excludes' | 'between'
  value: string | number | [number, number]
  priority: 'required' | 'preferred' | 'nice_to_have'
}

/**
 * User preferences relevant to the intent
 */
export interface IntentPreference {
  category: string
  key: string
  value: unknown
  source: 'saved_profile' | 'conversation' | 'inferred' | 'default'
}

/**
 * Information we still need to gather
 */
export interface MissingInformation {
  field: string
  description: string
  required: boolean
  suggestedQuestion: string
  possibleValues?: string[]
  canInfer: boolean  // Can we infer from context?
}

// ========================================
// Workflow Types - How to execute the intent
// ========================================

/**
 * Types of workflow steps
 */
export type WorkflowStepType =
  | 'ai_reasoning'       // AI analysis or decision making
  | 'api_call'           // External API integration
  | 'user_confirmation'  // Ask user for confirmation
  | 'data_transform'     // Transform or process data
  | 'condition'          // Branching logic
  | 'parallel'           // Execute multiple steps in parallel
  | 'loop'               // Iterate over items
  | 'wait'               // Wait for external event or time
  | 'notification'       // Notify user of progress/completion

/**
 * Individual step in a workflow
 */
export interface WorkflowStep {
  id: string
  type: WorkflowStepType
  name: string
  description: string

  // Configuration
  config: WorkflowStepConfig

  // Execution flow
  dependsOn: string[]  // Step IDs this depends on
  timeout?: number     // Max execution time in ms
  retryPolicy?: RetryPolicy

  // For conditional steps
  condition?: string
  branches?: { condition: string; targetStepId: string }[]

  // Status tracking
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  output?: unknown
  error?: string
}

/**
 * Configuration for different step types
 */
export interface WorkflowStepConfig {
  // For AI reasoning steps
  prompt?: string
  model?: string
  contextKeys?: string[]  // Keys from context to include

  // For Composio MCP integration
  composioTool?: string   // Composio tool slug (e.g., GMAIL_SEND_EMAIL)
  tool?: string           // Alias for composioTool
  toolkit?: string        // Toolkit name (e.g., gmail, slack)

  // For API calls
  service?: string
  endpoint?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  payload?: Record<string, unknown>
  headers?: Record<string, string>

  // For user confirmation
  message?: string
  options?: string[]
  defaultOption?: string
  autoApproveAfter?: number  // Auto-approve after X seconds

  // For data transforms
  transformOperations?: TransformOperation[]

  // For notifications
  notificationType?: 'info' | 'success' | 'warning' | 'error'
  channels?: ('app' | 'email' | 'sms' | 'whatsapp')[]
}

export interface TransformOperation {
  type: 'pick' | 'omit' | 'rename' | 'map' | 'filter' | 'default' | 'flatten' | 'merge' | 'expression'
  config: Record<string, unknown>
}

export interface RetryPolicy {
  maxRetries: number
  delayMs: number
  exponentialBackoff: boolean
  retryOn: ('network' | 'timeout' | 'server_error' | 'rate_limit')[]
}

/**
 * Complete generated workflow
 */
export interface GeneratedWorkflow {
  id: string
  name: string
  description: string
  intent: ParsedIntent

  // Workflow structure
  steps: WorkflowStep[]
  startStepId: string

  // Integrations required
  requiredIntegrations: IntegrationRequirement[]

  // Context requirements
  requiredContext: ContextRequirement[]

  // Execution metadata
  estimatedDuration?: number  // Estimated time in ms
  estimatedCost?: number      // Estimated cost in USD

  // OAuth scopes required for execution
  requiredOAuthScopes?: Record<string, string[]>  // service -> scopes

  // Execution readiness validation
  executionReadiness?: {
    isExecutable: boolean
    missingRequirements: string[]
    warnings: string[]
  }

  // Status
  status: 'draft' | 'ready' | 'executing' | 'completed' | 'failed'
  createdAt: string
  updatedAt: string
}

export interface IntegrationRequirement {
  service: string
  reason: string
  required: boolean
  connected: boolean
  setupUrl?: string
}

export interface ContextRequirement {
  key: string
  type: 'address' | 'payment' | 'preference' | 'credential' | 'custom'
  description: string
  required: boolean
  available: boolean
}

// ========================================
// Service Integration Types
// ========================================

/**
 * Categories of external services
 */
export type ServiceCategory =
  | 'food_delivery'
  | 'transportation'
  | 'document_processing'
  | 'communication'
  | 'payment'
  | 'calendar'
  | 'storage'
  | 'ai'
  | 'custom'

/**
 * Service integration configuration
 */
export interface ServiceIntegration {
  id: string
  name: string
  category: ServiceCategory
  description: string

  // Capabilities
  actions: ServiceAction[]

  // Authentication
  authType: 'oauth2' | 'api_key' | 'basic' | 'bearer' | 'none'
  authConfig?: Record<string, unknown>

  // Connection status
  connected: boolean
  lastConnectedAt?: string

  // Regional availability
  availableRegions: string[]

  // Metadata
  logoUrl?: string
  docsUrl?: string
  setupInstructions?: string
}

/**
 * Action that a service can perform
 */
export interface ServiceAction {
  id: string
  name: string
  description: string

  // Input/output schema
  inputSchema: Record<string, FieldSchema>
  outputSchema: Record<string, FieldSchema>

  // Execution
  endpoint?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'

  // Pricing
  costPerCall?: number
  rateLimit?: number
}

export interface FieldSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date'
  required: boolean
  description?: string
  enum?: unknown[]
  default?: unknown
  example?: unknown
}

// ========================================
// User Context Types
// ========================================

/**
 * User's saved context and preferences
 */
export interface UserContext {
  userId: string

  // Locations
  addresses: SavedAddress[]
  defaultAddressId?: string

  // Payment methods (references only - actual data stored securely)
  paymentMethods: PaymentMethodReference[]
  defaultPaymentMethodId?: string

  // Preferences
  preferences: UserPreferences

  // Recent activity (for inference)
  recentActivity: RecentActivity[]

  // Connected services
  connectedServices: ConnectedService[]

  // Metadata
  createdAt: string
  updatedAt: string
}

export interface SavedAddress {
  id: string
  label: string  // 'home', 'work', 'gym', etc.
  fullAddress: string
  components: {
    street?: string
    city?: string
    state?: string
    country?: string
    postalCode?: string
    building?: string
    floor?: string
    apartment?: string
    instructions?: string
  }
  coordinates?: {
    latitude: number
    longitude: number
  }
  isDefault: boolean
  createdAt: string
}

export interface PaymentMethodReference {
  id: string
  type: 'card' | 'wallet' | 'bank' | 'cash'
  label: string
  lastFour?: string  // Last 4 digits for cards
  provider?: string  // e.g., 'visa', 'apple_pay'
  isDefault: boolean
  createdAt: string
}

export interface UserPreferences {
  // Dietary preferences
  dietary?: {
    restrictions: string[]  // 'vegetarian', 'vegan', 'halal', 'kosher', etc.
    allergies: string[]
    favorites: string[]
    dislikes: string[]
  }

  // Communication preferences
  communication?: {
    preferredChannels: ('email' | 'sms' | 'whatsapp' | 'app')[]
    quietHours?: { start: string; end: string }
    language: string
    timezone: string
  }

  // Spending preferences
  budget?: {
    dailyLimit?: number
    monthlyLimit?: number
    preferredPriceRange?: 'budget' | 'moderate' | 'premium'
    currency: string
  }

  // Travel preferences
  travel?: {
    preferredAirlines: string[]
    seatPreference?: 'window' | 'aisle' | 'middle'
    mealPreference?: string
    loyaltyPrograms: { provider: string; memberId: string }[]
  }

  // Custom preferences
  custom?: Record<string, unknown>
}

export interface RecentActivity {
  id: string
  type: string
  action: string
  data: Record<string, unknown>
  timestamp: string
}

export interface ConnectedService {
  serviceId: string
  serviceName: string
  category: ServiceCategory
  connectedAt: string
  lastUsedAt?: string
  status: 'active' | 'expired' | 'revoked'
}

// ========================================
// Execution Types
// ========================================

/**
 * Real-time execution state
 */
export interface ExecutionState {
  executionId: string
  workflowId: string

  // Progress
  status: 'initializing' | 'running' | 'paused' | 'waiting_user' | 'completed' | 'failed' | 'cancelled'
  currentStepId?: string
  completedSteps: string[]

  // Results
  stepResults: Record<string, StepResult>
  finalResult?: unknown

  // Context accumulated during execution
  context: Record<string, unknown>

  // Metrics
  startedAt: string
  updatedAt: string
  completedAt?: string
  tokensUsed: number
  costUsd: number

  // Error handling
  errors: ExecutionError[]
  recoveryAttempts: number
}

export interface StepResult {
  stepId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  output?: unknown
  error?: string
  startedAt?: string
  completedAt?: string
  tokensUsed?: number
  costUsd?: number
  retryCount?: number
}

export interface ExecutionError {
  stepId: string
  code: string
  message: string
  recoverable: boolean
  timestamp: string
  details?: Record<string, unknown>
}

// ========================================
// Food Delivery Specific Types
// ========================================

export interface FoodDeliveryOrder {
  restaurant?: string
  cuisine?: string
  items?: OrderItem[]
  deliveryAddress: SavedAddress
  paymentMethod: PaymentMethodReference
  specialInstructions?: string
  scheduledFor?: string
  estimatedDelivery?: string
  totalAmount?: number
}

export interface OrderItem {
  name: string
  quantity: number
  customizations?: string[]
  price?: number
}

// ========================================
// Document Analysis Specific Types
// ========================================

export interface DocumentAnalysis {
  documentType: 'pdf' | 'image' | 'text' | 'spreadsheet'
  sourceUrl?: string
  sourceFile?: string

  // Analysis results
  extractedText?: string
  entities?: DocumentEntity[]
  tables?: DocumentTable[]
  summary?: string

  // For travel/price documents
  prices?: ExtractedPrice[]
  dates?: ExtractedDate[]
  locations?: ExtractedLocation[]

  // Comparison results
  comparison?: ComparisonResult
}

export interface DocumentEntity {
  type: string
  value: string
  confidence: number
  boundingBox?: { x: number; y: number; width: number; height: number }
}

export interface DocumentTable {
  headers: string[]
  rows: string[][]
}

export interface ExtractedPrice {
  amount: number
  currency: string
  context: string
  category?: string
}

export interface ExtractedDate {
  date: string
  type: 'departure' | 'arrival' | 'checkin' | 'checkout' | 'deadline' | 'other'
  context: string
}

export interface ExtractedLocation {
  name: string
  type: 'origin' | 'destination' | 'hotel' | 'activity' | 'other'
  coordinates?: { latitude: number; longitude: number }
}

export interface ComparisonResult {
  compared: string[]
  criteria: { name: string; weight: number }[]
  scores: Record<string, Record<string, number>>
  recommendation: string
  reasoning: string
}

// ========================================
// Event Types for Real-time Updates
// ========================================

export interface WorkflowEvent {
  type: 'step_started' | 'step_completed' | 'step_failed' | 'user_action_required' | 'workflow_completed' | 'workflow_failed'
  workflowId: string
  executionId: string
  stepId?: string
  data: unknown
  timestamp: string
}

export interface UserActionRequest {
  id: string
  type: 'confirmation' | 'selection' | 'input' | 'payment'
  title: string
  message: string
  options?: { id: string; label: string; description?: string }[]
  inputFields?: { name: string; type: string; required: boolean; placeholder?: string }[]
  timeout?: number
  default?: string
}

// ========================================
// Orchestrator Types (Re-exported for hook usage)
// ========================================

/** Event types emitted by the orchestrator */
export type OrchestratorEventType =
  | 'intent_parsed'
  | 'workflow_generated'
  | 'execution_started'
  | 'step_started'
  | 'step_completed'
  | 'step_failed'
  | 'user_action_required'
  | 'execution_paused'
  | 'execution_resumed'
  | 'execution_completed'
  | 'execution_failed'
  | 'context_updated'
  | 'clarification_needed'
  | 'progress_update'

/** Orchestrator event payload */
export interface OrchestratorEvent {
  type: OrchestratorEventType
  timestamp: string
  sessionId: string
  data: unknown
  metadata?: {
    stepId?: string
    progress?: number
    tokensUsed?: number
    costUsd?: number
    duration?: number
  }
}

/** Session state for tracking active executions */
export interface OrchestratorSession {
  id: string
  userId?: string
  input: string
  intent: ParsedIntent | null
  workflow: GeneratedWorkflow | null
  execution: ExecutionState | null
  status: 'initializing' | 'parsing' | 'clarifying' | 'generating' | 'ready' | 'executing' | 'paused' | 'completed' | 'failed'
  pendingAction: UserActionRequest | null
  messages: string[]
  createdAt: string
  updatedAt: string
}

/** Configuration options for orchestrator */
export interface OrchestratorConfig {
  maxClarificationQuestions?: number
  autoExecute?: boolean
  simplifyWorkflows?: boolean
  enableContextExtraction?: boolean
  defaultTimeout?: number
  retryOnFailure?: boolean
  maxRetries?: number
}
