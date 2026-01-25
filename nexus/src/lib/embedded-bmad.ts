/**
 * EMBEDDED NEXUS AI METHODOLOGY
 *
 * This module embeds the Nexus AI workflow methodology
 * directly into the Nexus platform without requiring external installation.
 *
 * Users do NOT need to:
 * - Install Nexus CLI
 * - Configure Nexus agents manually
 * - Set up Nexus workflows
 * - Manage agent configurations
 *
 * Everything is embedded and ready to use.
 */

// Nexus Workflow Stages (using const object pattern for TypeScript compatibility)
export const NexusStage = {
  PLANNING: 'planning',
  ORCHESTRATING: 'orchestrating',
  BUILDING: 'building',
  REVIEWING: 'reviewing',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const

export type NexusStage = typeof NexusStage[keyof typeof NexusStage]

// Nexus Agent Types (embedded in application)
export const NexusAgentType = {
  DIRECTOR: 'director',       // Coordinates overall workflow
  SUPERVISOR: 'supervisor',   // Reviews and approves critical decisions
  ANALYST: 'analyst',         // Analyzes data and requirements
  BUILDER: 'builder',         // Executes build tasks
  REVIEWER: 'reviewer',       // Reviews outputs for quality
  DEPLOYER: 'deployer'        // Handles deployment and delivery
} as const

export type NexusAgentType = typeof NexusAgentType[keyof typeof NexusAgentType]

// Embedded Agent Configurations (no external config needed)
export const EMBEDDED_AGENTS: Record<NexusAgentType, {
  name: string
  personality: string
  capabilities: string[]
  systemPrompt: string
}> = {
  [NexusAgentType.DIRECTOR]: {
    name: 'Director',
    personality: 'Strategic, organized, decisive',
    capabilities: ['task-decomposition', 'resource-allocation', 'coordination'],
    systemPrompt: `You are the Director agent in the Nexus workflow system. Your role is to:
1. Analyze incoming requests and decompose them into actionable tasks
2. Determine the optimal sequence and dependencies between tasks
3. Assign tasks to appropriate specialized agents
4. Monitor overall progress and handle escalations
5. Ensure the workflow completes successfully

Be decisive, efficient, and focused on delivering results.`
  },
  [NexusAgentType.SUPERVISOR]: {
    name: 'Supervisor',
    personality: 'Thorough, quality-focused, cautious',
    capabilities: ['review', 'approval', 'quality-assurance'],
    systemPrompt: `You are the Supervisor agent in the Nexus workflow system. Your role is to:
1. Review critical decisions before they are executed
2. Validate outputs meet quality standards
3. Approve or reject work based on acceptance criteria
4. Identify potential risks and issues
5. Ensure compliance with requirements

Be thorough but efficient. Only flag genuine concerns.`
  },
  [NexusAgentType.ANALYST]: {
    name: 'Analyst',
    personality: 'Analytical, detail-oriented, methodical',
    capabilities: ['data-analysis', 'requirement-gathering', 'research'],
    systemPrompt: `You are the Analyst agent in the Nexus workflow system. Your role is to:
1. Analyze data and extract insights
2. Gather and clarify requirements
3. Research solutions and best practices
4. Document findings clearly
5. Provide recommendations based on analysis

Be precise and data-driven in your analysis.`
  },
  [NexusAgentType.BUILDER]: {
    name: 'Builder',
    personality: 'Practical, efficient, solution-oriented',
    capabilities: ['execution', 'implementation', 'integration'],
    systemPrompt: `You are the Builder agent in the Nexus workflow system. Your role is to:
1. Execute assigned tasks efficiently
2. Implement solutions according to specifications
3. Integrate with external systems and APIs
4. Handle errors gracefully
5. Report progress and completion status

Focus on getting things done correctly and efficiently.`
  },
  [NexusAgentType.REVIEWER]: {
    name: 'Reviewer',
    personality: 'Critical, constructive, objective',
    capabilities: ['quality-review', 'testing', 'validation'],
    systemPrompt: `You are the Reviewer agent in the Nexus workflow system. Your role is to:
1. Review completed work for quality and correctness
2. Test outputs against requirements
3. Validate data integrity and accuracy
4. Provide constructive feedback
5. Approve or request revisions

Be objective and focus on genuine quality issues.`
  },
  [NexusAgentType.DEPLOYER]: {
    name: 'Deployer',
    personality: 'Careful, systematic, reliable',
    capabilities: ['deployment', 'delivery', 'notification'],
    systemPrompt: `You are the Deployer agent in the Nexus workflow system. Your role is to:
1. Prepare outputs for delivery
2. Execute deployment steps safely
3. Notify stakeholders of completion
4. Document deployment results
5. Handle rollback if needed

Be methodical and ensure safe delivery of results.`
  }
}

// Nexus Stage Transitions
export const STAGE_TRANSITIONS: Record<NexusStage, NexusStage[]> = {
  [NexusStage.PLANNING]: [NexusStage.ORCHESTRATING, NexusStage.FAILED],
  [NexusStage.ORCHESTRATING]: [NexusStage.BUILDING, NexusStage.FAILED],
  [NexusStage.BUILDING]: [NexusStage.REVIEWING, NexusStage.FAILED],
  [NexusStage.REVIEWING]: [NexusStage.COMPLETED, NexusStage.BUILDING, NexusStage.FAILED],
  [NexusStage.COMPLETED]: [],
  [NexusStage.FAILED]: [NexusStage.PLANNING] // Can retry from planning
}

// Embedded Nexus Configuration
export interface EmbeddedNexusConfig {
  // Execution settings
  maxRetries: number
  retryDelayMs: number
  timeoutMs: number

  // Checkpoint settings
  checkpointEnabled: boolean
  checkpointIntervalSteps: number

  // Agent settings
  supervisorApprovalRequired: boolean
  parallelExecutionEnabled: boolean
  maxParallelTasks: number

  // Cost settings
  maxCostUsd: number
  warnCostUsd: number

  // Quality settings
  qualityThreshold: number // 0-1, minimum quality score to pass review
  autoRetryOnFailure: boolean
}

// Default embedded configuration
export const DEFAULT_NEXUS_CONFIG: EmbeddedNexusConfig = {
  maxRetries: 3,
  retryDelayMs: 1000,
  timeoutMs: 300000, // 5 minutes

  checkpointEnabled: true,
  checkpointIntervalSteps: 3,

  supervisorApprovalRequired: false, // For autonomous mode
  parallelExecutionEnabled: true,
  maxParallelTasks: 5,

  maxCostUsd: 10.00,
  warnCostUsd: 5.00,

  qualityThreshold: 0.7,
  autoRetryOnFailure: true
}

// Nexus Task Interface
export interface NexusTask {
  id: string
  name: string
  description: string
  agentType: NexusAgentType
  dependencies: string[] // Task IDs this depends on
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  input?: unknown
  output?: unknown
  startedAt?: Date
  completedAt?: Date
  tokensUsed?: number
  costUsd?: number
  error?: string
}

// Nexus Workflow State
export interface NexusWorkflowState {
  id: string
  name: string
  description: string
  stage: NexusStage
  tasks: NexusTask[]
  currentTaskIndex: number
  config: EmbeddedNexusConfig
  totalTokensUsed: number
  totalCostUsd: number
  startedAt: Date
  completedAt?: Date
  error?: string
  checkpoints: {
    name: string
    state: unknown
    createdAt: Date
  }[]
}

// Helper: Get agent configuration
export function getAgentConfig(agentType: NexusAgentType) {
  return EMBEDDED_AGENTS[agentType]
}

// Helper: Check if stage transition is valid
export function isValidTransition(from: NexusStage, to: NexusStage): boolean {
  return STAGE_TRANSITIONS[from].includes(to)
}

// Helper: Get next stages
export function getNextStages(current: NexusStage): NexusStage[] {
  return STAGE_TRANSITIONS[current]
}

// Helper: Calculate task dependencies (topological sort)
export function sortTasksByDependency(tasks: NexusTask[]): NexusTask[] {
  const sorted: NexusTask[] = []
  const visited = new Set<string>()
  const visiting = new Set<string>()

  function visit(task: NexusTask) {
    if (visited.has(task.id)) return
    if (visiting.has(task.id)) {
      throw new Error(`Circular dependency detected: ${task.id}`)
    }

    visiting.add(task.id)

    for (const depId of task.dependencies) {
      const dep = tasks.find(t => t.id === depId)
      if (dep) visit(dep)
    }

    visiting.delete(task.id)
    visited.add(task.id)
    sorted.push(task)
  }

  for (const task of tasks) {
    visit(task)
  }

  return sorted
}

// Helper: Create initial workflow state
export function createWorkflowState(
  name: string,
  description: string,
  tasks: Omit<NexusTask, 'status' | 'startedAt' | 'completedAt'>[],
  config: Partial<EmbeddedNexusConfig> = {}
): NexusWorkflowState {
  return {
    id: `nexus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    stage: NexusStage.PLANNING,
    tasks: tasks.map(t => ({
      ...t,
      status: 'pending' as const
    })),
    currentTaskIndex: -1,
    config: { ...DEFAULT_NEXUS_CONFIG, ...config },
    totalTokensUsed: 0,
    totalCostUsd: 0,
    startedAt: new Date(),
    checkpoints: []
  }
}
