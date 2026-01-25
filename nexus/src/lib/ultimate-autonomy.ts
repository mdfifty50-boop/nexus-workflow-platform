/**
 * ULTIMATE AUTONOMY CONFIGURATION
 *
 * This module embeds the autonomous operation mode directly into the Nexus platform.
 * These settings ensure the AI operates without stopping for permissions, confirmations,
 * or unnecessary user interactions.
 *
 * Based on the proven autonomy configuration that enables "working non-stop until
 * delivering the output without informing about major milestones or asking for permissions"
 */

// Autonomy Levels (using const object pattern for TypeScript compatibility)
export const AutonomyLevel = {
  SUPERVISED: 'supervised',     // Requires user approval at each step
  SEMI_AUTONOMOUS: 'semi',      // Requires approval for critical steps only
  AUTONOMOUS: 'autonomous',     // Operates independently, pauses only for critical issues
  ULTIMATE: 'ultimate'          // Full authority, no pauses except unrecoverable errors
} as const

export type AutonomyLevel = typeof AutonomyLevel[keyof typeof AutonomyLevel]

// Critical Intervention Types (when even Ultimate autonomy should pause)
export const CriticalIntervention = {
  UNRECOVERABLE_ERROR: 'unrecoverable_error',
  SECURITY_RISK: 'security_risk',
  PRODUCTION_IMPACT: 'production_impact',
  USER_HALT_REQUEST: 'user_halt'
} as const

export type CriticalIntervention = typeof CriticalIntervention[keyof typeof CriticalIntervention]

// Ultimate Autonomy Configuration
export interface AutonomyConfig {
  level: AutonomyLevel

  // Permission Settings
  permissions: {
    fileOperations: boolean        // Read, write, edit, delete files
    commandExecution: boolean      // Execute shell commands
    apiCalls: boolean              // Make external API calls
    dataModification: boolean      // Modify user data
    integrationAccess: boolean     // Access connected integrations
    workflowCreation: boolean      // Create and execute workflows
    costIncurring: boolean         // Operations that incur cost (API tokens)
  }

  // Behavioral Settings
  behavior: {
    neverAskPermission: boolean    // Execute all actions immediately
    neverStopAndWait: boolean      // Continue until completion or critical error
    skipConfirmations: boolean     // Treat all confirmations as pre-approved
    autoSelectOptions: boolean     // Select most appropriate option when given choices
    selfRecoverFromErrors: boolean // Attempt automatic recovery before halting
    chainWorkflows: boolean        // Chain workflows together without pauses
    completeFullSession: boolean   // Complete entire workflows in one session
    autoProgressTasks: boolean     // Mark tasks complete and move to next automatically
  }

  // Error Handling
  errorHandling: {
    autoFixRecoverableErrors: boolean
    autoFixTestFailures: boolean
    autoFixBuildFailures: boolean
    autoResolveConflicts: boolean
    maxAutoRetries: number
    retryDelayMs: number
  }

  // Critical Intervention Thresholds
  criticalThresholds: {
    maxCostUsd: number            // Pause if cost exceeds this
    maxTokens: number             // Pause if tokens exceed this
    maxDuration: number           // Pause if duration exceeds this (ms)
    maxFailedRetries: number      // Pause after this many failed retries
  }

  // Output Preferences
  output: {
    minimizeVerboseExplanations: boolean
    focusOnAction: boolean
    reportCompletionNotIntentions: boolean
    showProgressThroughActions: boolean
  }
}

// ULTIMATE AUTONOMY - Maximum trust configuration
export const ULTIMATE_AUTONOMY_CONFIG: AutonomyConfig = {
  level: AutonomyLevel.ULTIMATE,

  permissions: {
    fileOperations: true,
    commandExecution: true,
    apiCalls: true,
    dataModification: true,
    integrationAccess: true,
    workflowCreation: true,
    costIncurring: true
  },

  behavior: {
    neverAskPermission: true,
    neverStopAndWait: true,
    skipConfirmations: true,
    autoSelectOptions: true,
    selfRecoverFromErrors: true,
    chainWorkflows: true,
    completeFullSession: true,
    autoProgressTasks: true
  },

  errorHandling: {
    autoFixRecoverableErrors: true,
    autoFixTestFailures: true,
    autoFixBuildFailures: true,
    autoResolveConflicts: true,
    maxAutoRetries: 3,
    retryDelayMs: 1000
  },

  criticalThresholds: {
    maxCostUsd: 50.00,           // Only pause if cost exceeds $50
    maxTokens: 1000000,          // Only pause if tokens exceed 1M
    maxDuration: 3600000,        // Only pause if duration exceeds 1 hour
    maxFailedRetries: 5          // Only pause after 5 failed retries
  },

  output: {
    minimizeVerboseExplanations: true,
    focusOnAction: true,
    reportCompletionNotIntentions: true,
    showProgressThroughActions: true
  }
}

// AUTONOMOUS - Independent operation with some guardrails
export const AUTONOMOUS_CONFIG: AutonomyConfig = {
  level: AutonomyLevel.AUTONOMOUS,

  permissions: {
    fileOperations: true,
    commandExecution: true,
    apiCalls: true,
    dataModification: true,
    integrationAccess: true,
    workflowCreation: true,
    costIncurring: true
  },

  behavior: {
    neverAskPermission: true,
    neverStopAndWait: true,
    skipConfirmations: true,
    autoSelectOptions: true,
    selfRecoverFromErrors: true,
    chainWorkflows: true,
    completeFullSession: true,
    autoProgressTasks: true
  },

  errorHandling: {
    autoFixRecoverableErrors: true,
    autoFixTestFailures: true,
    autoFixBuildFailures: true,
    autoResolveConflicts: true,
    maxAutoRetries: 3,
    retryDelayMs: 1000
  },

  criticalThresholds: {
    maxCostUsd: 20.00,
    maxTokens: 500000,
    maxDuration: 1800000,        // 30 minutes
    maxFailedRetries: 3
  },

  output: {
    minimizeVerboseExplanations: true,
    focusOnAction: true,
    reportCompletionNotIntentions: true,
    showProgressThroughActions: true
  }
}

// SEMI_AUTONOMOUS - Approval for critical steps only
export const SEMI_AUTONOMOUS_CONFIG: AutonomyConfig = {
  level: AutonomyLevel.SEMI_AUTONOMOUS,

  permissions: {
    fileOperations: true,
    commandExecution: true,
    apiCalls: true,
    dataModification: false,     // Requires approval
    integrationAccess: true,
    workflowCreation: true,
    costIncurring: false         // Requires approval
  },

  behavior: {
    neverAskPermission: false,   // Ask for critical operations
    neverStopAndWait: false,
    skipConfirmations: false,
    autoSelectOptions: true,
    selfRecoverFromErrors: true,
    chainWorkflows: false,       // Pause between workflows
    completeFullSession: false,
    autoProgressTasks: true
  },

  errorHandling: {
    autoFixRecoverableErrors: true,
    autoFixTestFailures: true,
    autoFixBuildFailures: false, // Report to user
    autoResolveConflicts: false, // Ask user
    maxAutoRetries: 2,
    retryDelayMs: 2000
  },

  criticalThresholds: {
    maxCostUsd: 5.00,
    maxTokens: 100000,
    maxDuration: 600000,         // 10 minutes
    maxFailedRetries: 2
  },

  output: {
    minimizeVerboseExplanations: false,
    focusOnAction: true,
    reportCompletionNotIntentions: false, // Report intentions too
    showProgressThroughActions: true
  }
}

// SUPERVISED - User approval at each step
export const SUPERVISED_CONFIG: AutonomyConfig = {
  level: AutonomyLevel.SUPERVISED,

  permissions: {
    fileOperations: false,
    commandExecution: false,
    apiCalls: false,
    dataModification: false,
    integrationAccess: false,
    workflowCreation: false,
    costIncurring: false
  },

  behavior: {
    neverAskPermission: false,
    neverStopAndWait: false,
    skipConfirmations: false,
    autoSelectOptions: false,
    selfRecoverFromErrors: false,
    chainWorkflows: false,
    completeFullSession: false,
    autoProgressTasks: false
  },

  errorHandling: {
    autoFixRecoverableErrors: false,
    autoFixTestFailures: false,
    autoFixBuildFailures: false,
    autoResolveConflicts: false,
    maxAutoRetries: 0,
    retryDelayMs: 0
  },

  criticalThresholds: {
    maxCostUsd: 1.00,
    maxTokens: 10000,
    maxDuration: 60000,          // 1 minute
    maxFailedRetries: 0
  },

  output: {
    minimizeVerboseExplanations: false,
    focusOnAction: false,
    reportCompletionNotIntentions: false,
    showProgressThroughActions: false
  }
}

// Configuration presets map
export const AUTONOMY_PRESETS: Record<AutonomyLevel, AutonomyConfig> = {
  [AutonomyLevel.SUPERVISED]: SUPERVISED_CONFIG,
  [AutonomyLevel.SEMI_AUTONOMOUS]: SEMI_AUTONOMOUS_CONFIG,
  [AutonomyLevel.AUTONOMOUS]: AUTONOMOUS_CONFIG,
  [AutonomyLevel.ULTIMATE]: ULTIMATE_AUTONOMY_CONFIG
}

// Helper: Get autonomy config by level
export function getAutonomyConfig(level: AutonomyLevel): AutonomyConfig {
  return AUTONOMY_PRESETS[level]
}

// Helper: Check if action requires approval
export function requiresApproval(
  action: keyof AutonomyConfig['permissions'],
  config: AutonomyConfig
): boolean {
  if (config.behavior.neverAskPermission) return false
  return !config.permissions[action]
}

// Helper: Check if should pause for error
export function shouldPauseForError(
  _error: Error,
  retryCount: number,
  config: AutonomyConfig
): boolean {
  if (!config.behavior.selfRecoverFromErrors) return true
  if (retryCount >= config.errorHandling.maxAutoRetries) return true
  if (retryCount >= config.criticalThresholds.maxFailedRetries) return true
  return false
}

// Helper: Check if critical threshold exceeded
export function isCriticalThresholdExceeded(
  metrics: {
    costUsd?: number
    tokens?: number
    durationMs?: number
    failedRetries?: number
  },
  config: AutonomyConfig
): CriticalIntervention | null {
  if (metrics.costUsd && metrics.costUsd > config.criticalThresholds.maxCostUsd) {
    return CriticalIntervention.UNRECOVERABLE_ERROR
  }
  if (metrics.tokens && metrics.tokens > config.criticalThresholds.maxTokens) {
    return CriticalIntervention.UNRECOVERABLE_ERROR
  }
  if (metrics.durationMs && metrics.durationMs > config.criticalThresholds.maxDuration) {
    return CriticalIntervention.UNRECOVERABLE_ERROR
  }
  if (metrics.failedRetries && metrics.failedRetries > config.criticalThresholds.maxFailedRetries) {
    return CriticalIntervention.UNRECOVERABLE_ERROR
  }
  return null
}

// Autonomy Decision Engine
export class AutonomyEngine {
  private config: AutonomyConfig
  private metrics: {
    costUsd: number
    tokens: number
    startTime: number
    failedRetries: number
  }

  constructor(config: AutonomyConfig = ULTIMATE_AUTONOMY_CONFIG) {
    this.config = config
    this.metrics = {
      costUsd: 0,
      tokens: 0,
      startTime: Date.now(),
      failedRetries: 0
    }
  }

  // Check if action can proceed
  canProceed(action: keyof AutonomyConfig['permissions']): boolean {
    // Check critical thresholds first
    const durationMs = Date.now() - this.metrics.startTime
    const critical = isCriticalThresholdExceeded({
      ...this.metrics,
      durationMs
    }, this.config)

    if (critical) return false

    // Check permission
    return !requiresApproval(action, this.config)
  }

  // Record action cost
  recordCost(tokens: number, costUsd: number) {
    this.metrics.tokens += tokens
    this.metrics.costUsd += costUsd
  }

  // Record failed retry
  recordFailure() {
    this.metrics.failedRetries++
  }

  // Reset failure count (after successful operation)
  resetFailures() {
    this.metrics.failedRetries = 0
  }

  // Get current autonomy level
  getLevel(): AutonomyLevel {
    return this.config.level
  }

  // Set autonomy level
  setLevel(level: AutonomyLevel) {
    this.config = AUTONOMY_PRESETS[level]
  }

  // Get current metrics
  getMetrics() {
    return {
      ...this.metrics,
      durationMs: Date.now() - this.metrics.startTime
    }
  }

  // Check if should auto-retry
  shouldAutoRetry(): boolean {
    return this.config.errorHandling.autoFixRecoverableErrors &&
           this.metrics.failedRetries < this.config.errorHandling.maxAutoRetries
  }

  // Get retry delay
  getRetryDelay(): number {
    return this.config.errorHandling.retryDelayMs
  }
}

// Default global autonomy engine (Ultimate mode for Nexus)
export const globalAutonomy = new AutonomyEngine(ULTIMATE_AUTONOMY_CONFIG)
