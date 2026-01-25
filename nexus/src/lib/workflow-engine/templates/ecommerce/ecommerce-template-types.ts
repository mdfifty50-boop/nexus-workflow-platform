/**
 * E-commerce Workflow Template Types
 *
 * Type definitions for e-commerce automation workflows.
 * These templates enable automated order fulfillment, inventory management,
 * customer lifecycle automation, and returns processing.
 */

// ========================================
// Base Template Types
// ========================================

/**
 * E-commerce template categories
 */
export type EcommerceTemplateCategory =
  | 'order-management'
  | 'inventory'
  | 'customer-lifecycle'
  | 'marketing'
  | 'returns-refunds'
  | 'shipping-logistics'
  | 'analytics'

/**
 * Template trigger types
 */
export type TemplateTriggerType =
  | 'webhook'
  | 'schedule'
  | 'manual'
  | 'event'
  | 'threshold'

/**
 * Workflow step types specific to e-commerce
 */
export type EcommerceStepType =
  | 'start'
  | 'end'
  | 'integration'
  | 'ai-agent'
  | 'condition'
  | 'transform'
  | 'loop'
  | 'wait'
  | 'notification'
  | 'parallel'

// ========================================
// Template Step Configuration
// ========================================

/**
 * Condition configuration for branching logic
 * Either (if + then) with optional else, or just else for default branch
 */
export interface ConditionConfig {
  if?: string
  then?: string
  else?: string
}

/**
 * Transform operation for data processing
 */
export interface TransformOperationConfig {
  type: 'pick' | 'omit' | 'rename' | 'map' | 'filter' | 'default' | 'flatten' | 'merge' | 'expression'
  config: Record<string, unknown>
}

/**
 * Wait step configuration
 */
export interface WaitConfig {
  duration?: string  // e.g., '24h', '3d', '1w'
  durationMs?: number
  until?: string     // Condition to wait for
  timeout?: string   // Max wait time
}

/**
 * Integration step configuration (Composio tools)
 */
export interface IntegrationConfig {
  tool: string           // Composio tool slug
  fallback?: string      // Fallback tool if primary fails
  parameters: Record<string, unknown>
}

/**
 * AI agent step configuration
 */
export interface AIAgentConfig {
  prompt: string
  model?: string
  outputFormat?: 'text' | 'json' | 'structured'
  temperature?: number
}

/**
 * Notification step configuration
 */
export interface NotificationConfig {
  channel: 'email' | 'sms' | 'slack' | 'webhook' | 'push'
  template?: string
  parameters: Record<string, unknown>
}

// ========================================
// Template Step Definition
// ========================================

/**
 * Configuration union for all step types
 */
export interface EcommerceStepConfig {
  // Trigger config
  trigger?: string
  source?: string
  event?: string
  interval?: string
  cron?: string
  filter?: Record<string, unknown> | string

  // Integration config
  tool?: string
  fallback?: string
  parameters?: Record<string, unknown>

  // AI agent config
  prompt?: string
  model?: string
  outputFormat?: 'text' | 'json' | 'structured'
  temperature?: number

  // Condition config
  conditions?: ConditionConfig[]

  // Transform config
  operations?: TransformOperationConfig[]

  // Wait config
  duration?: string
  durationMs?: number
  until?: string
  timeout?: string

  // Notification config
  channel?: 'email' | 'sms' | 'slack' | 'webhook' | 'push'
  template?: string

  // Generic extensible config
  [key: string]: unknown
}

/**
 * Workflow step node
 */
export interface EcommerceWorkflowStep {
  id: string
  type: EcommerceStepType
  label: string
  config: EcommerceStepConfig
  position: { x: number; y: number }
}

/**
 * Workflow edge (connection between steps)
 */
export interface EcommerceWorkflowEdge {
  id: string
  source: string
  target: string
  label?: string
  condition?: string  // For conditional branching
}

/**
 * Workflow definition
 */
export interface EcommerceWorkflowDefinition {
  nodes: EcommerceWorkflowStep[]
  edges: EcommerceWorkflowEdge[]
}

// ========================================
// Integration Requirements
// ========================================

/**
 * Required integration for a template
 */
export interface EcommerceIntegration {
  name: string
  slug: string
  required: boolean
  description?: string
  setupUrl?: string
}

/**
 * Input mapping for workflow data flow
 */
export interface InputMapping {
  field: string
  source: 'trigger' | 'previous_step' | 'context' | 'config' | 'user_input'
  path: string
  default?: unknown
  transform?: string
}

/**
 * Output mapping for workflow results
 */
export interface OutputMapping {
  field: string
  destination: 'next_step' | 'context' | 'result' | 'notification'
  path: string
  format?: string
}

// ========================================
// Template Trigger Configuration
// ========================================

/**
 * Trigger configuration for template
 */
export interface EcommerceTriggerConfig {
  type: TemplateTriggerType
  config: {
    // Webhook triggers
    source?: string
    event?: string
    filter?: Record<string, unknown>

    // Schedule triggers
    cron?: string
    interval?: string
    timezone?: string

    // Threshold triggers
    metric?: string
    operator?: 'lt' | 'lte' | 'gt' | 'gte' | 'eq' | 'ne'
    value?: number

    // Manual triggers
    allowManual?: boolean
    requireApproval?: boolean

    [key: string]: unknown
  }
}

// ========================================
// Main Template Interface
// ========================================

/**
 * Complete E-commerce Workflow Template
 */
export interface EcommerceWorkflowTemplate {
  /** Unique template identifier */
  id: string

  /** Template name */
  name: string

  /** Detailed description */
  description: string

  /** Template category */
  category: EcommerceTemplateCategory

  /** Display icon (emoji or icon name) */
  icon: string

  /** Searchable tags */
  tags: string[]

  /** Workflow definition with steps and edges */
  definition: EcommerceWorkflowDefinition

  /** Required integrations */
  requiredIntegrations: EcommerceIntegration[]

  /** Composio tool slugs used */
  composioTools: string[]

  /** Trigger configuration */
  trigger: EcommerceTriggerConfig

  /** Input mappings */
  inputMappings: InputMapping[]

  /** Output mappings */
  outputMappings: OutputMapping[]

  /** Estimated execution time */
  estimatedExecutionTime: string

  /** Complexity level */
  complexity: 'beginner' | 'intermediate' | 'advanced'

  /** Setup time in minutes */
  setupTimeMinutes: number

  /** Example input data for testing */
  exampleInput: Record<string, unknown>

  /** Expected output description */
  expectedOutput: string

  /** Business value metrics */
  businessValue: {
    estimatedTimeSavedPerMonth: string
    estimatedMoneySavedPerMonth: string
    replacesManualProcess: string
  }

  /** Version information */
  version: string

  /** Whether this template is featured/popular */
  isPopular: boolean

  /** Whether this is a new template */
  isNew: boolean
}

// ========================================
// Template Collection Types
// ========================================

/**
 * Template collection with metadata
 */
export interface EcommerceTemplateCollection {
  version: string
  updatedAt: string
  templates: EcommerceWorkflowTemplate[]
}

/**
 * Template filter options
 */
export interface TemplateFilterOptions {
  category?: EcommerceTemplateCategory
  complexity?: 'beginner' | 'intermediate' | 'advanced'
  requiredIntegrations?: string[]
  tags?: string[]
  searchQuery?: string
}

/**
 * Template search result
 */
export interface TemplateSearchResult {
  template: EcommerceWorkflowTemplate
  matchScore: number
  matchedFields: string[]
}
