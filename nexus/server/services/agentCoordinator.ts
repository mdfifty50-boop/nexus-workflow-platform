import { workflowService } from './workflowService.js'
import { callClaudeWithTiering, tieredCalls, recordTieringMetrics } from './claudeProxy.js'

// Agent role definitions
export interface AgentRole {
  id: string
  name: string
  title: string
  avatar: string
  color: string
  systemPrompt: string
  capabilities: string[]
  model: string
}

// Agent execution result
export interface AgentExecutionResult {
  success: boolean
  output: string
  tokensUsed: number
  costUSD: number
  agentId: string
  error?: string
}

// Supervisor decision
export interface SupervisorDecision {
  action: 'continue' | 'retry' | 'escalate' | 'skip' | 'abort'
  reason: string
  nextAgentId?: string
  modifiedInput?: string
}

// BMAD Agent Roles
export const BMAD_AGENTS: Record<string, AgentRole> = {
  director: {
    id: 'director',
    name: 'Nexus',
    title: 'Director',
    avatar: '🎯',
    color: '#14B8A6',
    model: 'claude-sonnet-4-20250514',
    capabilities: ['planning', 'delegation', 'orchestration', 'analysis'],
    systemPrompt: `You are the BMAD Director, responsible for high-level workflow orchestration.

Your responsibilities:
1. Analyze user requests and break them into discrete tasks
2. Delegate tasks to specialized agents
3. Monitor overall workflow progress
4. Make strategic decisions about workflow execution
5. Communicate status updates to users

When delegating, specify:
- Which agent should handle the task
- Clear instructions for the task
- Expected outputs
- Dependencies on other tasks

Always maintain context across the workflow and ensure tasks are executed in the correct order.`,
  },

  supervisor: {
    id: 'supervisor',
    name: 'Sara',
    title: 'Supervisor',
    avatar: '👁️',
    color: '#8B5CF6',
    model: 'claude-sonnet-4-20250514',
    capabilities: ['monitoring', 'error-handling', 'quality-assurance', 'escalation'],
    systemPrompt: `You are the BMAD Supervisor, responsible for monitoring agent work quality.

Your responsibilities:
1. Review outputs from specialized agents
2. Detect errors or issues in execution
3. Decide whether to retry, skip, escalate, or continue
4. Ensure quality standards are met
5. Report issues to the Director when necessary

For each task result you review, respond with a JSON decision:
{
  "action": "continue" | "retry" | "escalate" | "skip" | "abort",
  "reason": "explanation of your decision",
  "nextAgentId": "optional - if escalating or reassigning",
  "modifiedInput": "optional - if retrying with modifications"
}

Be strict about quality but pragmatic about progress.`,
  },

  salesforce: {
    id: 'salesforce',
    name: 'Steve',
    title: 'Salesforce Specialist',
    avatar: '☁️',
    color: '#00A1E0',
    model: 'claude-sonnet-4-20250514',
    capabilities: ['salesforce-queries', 'salesforce-updates', 'salesforce-reports', 'soql'],
    systemPrompt: `You are a Salesforce specialist agent. You handle all Salesforce CRM operations.

Your capabilities:
1. Query Salesforce data using SOQL
2. Create, update, and delete Salesforce records
3. Generate Salesforce reports
4. Manage Salesforce workflows and processes
5. Handle Salesforce integrations

When executing tasks:
- Generate proper SOQL queries
- Validate data before updates
- Handle API limits appropriately
- Return structured results

Always respond with actionable outputs that can be executed against the Salesforce API.`,
  },

  hubspot: {
    id: 'hubspot',
    name: 'Hannah',
    title: 'HubSpot Specialist',
    avatar: '🔶',
    color: '#FF7A59',
    model: 'claude-sonnet-4-20250514',
    capabilities: ['hubspot-contacts', 'hubspot-deals', 'hubspot-marketing', 'hubspot-automation'],
    systemPrompt: `You are a HubSpot specialist agent. You handle all HubSpot CRM and marketing operations.

Your capabilities:
1. Manage HubSpot contacts and companies
2. Handle deals and pipeline management
3. Configure marketing automation
4. Generate HubSpot reports
5. Manage email campaigns

When executing tasks:
- Use proper HubSpot API conventions
- Handle associations correctly
- Respect rate limits
- Return structured data

Always respond with actionable outputs that can be executed against the HubSpot API.`,
  },

  email: {
    id: 'email',
    name: 'Emma',
    title: 'Email Specialist',
    avatar: '📧',
    color: '#10B981',
    model: 'claude-sonnet-4-20250514',
    capabilities: ['email-compose', 'email-templates', 'email-automation', 'email-analytics'],
    systemPrompt: `You are an email specialist agent. You handle all email-related operations.

Your capabilities:
1. Compose professional emails
2. Create email templates
3. Set up email automation sequences
4. Analyze email performance
5. Handle email integrations (Gmail, Outlook, etc.)

When executing tasks:
- Write clear, professional copy
- Use proper email formatting
- Include appropriate CTAs
- Consider deliverability best practices

Always respond with properly formatted email content ready for sending.`,
  },

  data_transform: {
    id: 'data_transform',
    name: 'Derek',
    title: 'Data Engineer',
    avatar: '🔄',
    color: '#F59E0B',
    model: 'claude-sonnet-4-20250514',
    capabilities: ['data-mapping', 'data-cleaning', 'data-enrichment', 'data-validation'],
    systemPrompt: `You are a data transformation specialist. You handle all data processing operations.

Your capabilities:
1. Transform data between formats
2. Clean and normalize data
3. Map fields between systems
4. Validate data integrity
5. Enrich data with additional context

When executing tasks:
- Preserve data integrity
- Handle edge cases gracefully
- Document transformations
- Return clean, validated data

Always respond with the transformed data and any validation results.`,
  },

  calendar: {
    id: 'calendar',
    name: 'Carlos',
    title: 'Calendar Specialist',
    avatar: '📅',
    color: '#3B82F6',
    model: 'claude-sonnet-4-20250514',
    capabilities: ['calendar-events', 'scheduling', 'availability', 'reminders'],
    systemPrompt: `You are a calendar specialist agent. You handle all calendar and scheduling operations.

Your capabilities:
1. Create and manage calendar events
2. Check availability and suggest times
3. Set up recurring events
4. Manage calendar integrations (Google, Outlook)
5. Send meeting invitations

When executing tasks:
- Consider timezone differences
- Check for conflicts
- Include all necessary details
- Handle recurring patterns

Always respond with properly formatted event data ready for calendar APIs.`,
  },
}

// Agent Coordinator - manages multi-agent execution
export const agentCoordinator = {
  /**
   * Execute a task with the appropriate specialized agent
   */
  async executeWithAgent(
    agentId: string,
    task: {
      id: string
      name: string
      description: string
      input: Record<string, unknown>
      context?: string
    },
    workflowId?: string
  ): Promise<AgentExecutionResult> {
    const agent = BMAD_AGENTS[agentId] || BMAD_AGENTS.director
    const startTime = Date.now()

    try {
      const userMessage = `Execute the following task:

Task: ${task.name}
Description: ${task.description}

Input Data:
${JSON.stringify(task.input, null, 2)}

${task.context ? `Additional Context:\n${task.context}` : ''}

Provide your response with the completed work.`

      // Use intelligent model tiering based on task content
      console.log(`[agentCoordinator] Agent ${agentId} executing task: ${task.name} with intelligent tiering...`)
      const claudeResult = await callClaudeWithTiering({
        systemPrompt: agent.systemPrompt,
        userMessage,
        maxTokens: 4096
        // Let the classifier determine the appropriate tier based on task content
      })

      // Record tiering metrics
      recordTieringMetrics(claudeResult.tier, claudeResult.taskType, claudeResult.costUSD, claudeResult.savingsVsSonnet)
      console.log(`[agentCoordinator] Task routed to ${claudeResult.tier} tier (${claudeResult.taskType})`)

      const output = claudeResult.text
      const tokensUsed = claudeResult.tokensUsed
      const costUSD = claudeResult.costUSD

      // Create checkpoint if workflow context exists
      if (workflowId) {
        await workflowService.createCheckpoint({
          workflow_id: workflowId,
          checkpoint_name: `agent_${agentId}_task_${task.id}`,
          state_snapshot: {
            agentId,
            taskId: task.id,
            output,
            executionTimeMs: Date.now() - startTime,
          },
          tokens_used_in_step: tokensUsed,
          cost_usd_in_step: costUSD,
        })

        await workflowService.addUsage(workflowId, tokensUsed, costUSD)
      }

      return {
        success: true,
        output,
        tokensUsed,
        costUSD,
        agentId,
      }
    } catch (error: any) {
      console.error(`Agent ${agentId} execution error:`, error)
      return {
        success: false,
        output: '',
        tokensUsed: 0,
        costUSD: 0,
        agentId,
        error: error.message,
      }
    }
  },

  /**
   * Have the Supervisor review an agent's work
   * Uses Haiku tier for cost-effective classification/decision making
   */
  async supervisorReview(
    taskResult: AgentExecutionResult,
    taskContext: {
      taskName: string
      expectedOutput: string
      previousAttempts?: number
    }
  ): Promise<SupervisorDecision> {
    const supervisor = BMAD_AGENTS.supervisor

    try {
      const reviewPrompt = `Review the following agent execution result:

Task: ${taskContext.taskName}
Expected Output: ${taskContext.expectedOutput}
Agent: ${taskResult.agentId}
Success: ${taskResult.success}
Previous Attempts: ${taskContext.previousAttempts || 0}

Agent Output:
${taskResult.output || taskResult.error || 'No output'}

Provide your decision as a JSON object with:
- action: "continue" | "retry" | "escalate" | "skip" | "abort"
- reason: explanation
- nextAgentId: (optional) if reassigning
- modifiedInput: (optional) if retrying with changes`

      // Use Haiku tier for supervisor review - it's a classification task
      // This saves 12x cost vs Sonnet for a simple pass/fail decision
      console.log(`[agentCoordinator] Supervisor reviewing task via Haiku tier: ${taskContext.taskName}...`)
      const claudeResult = await tieredCalls.classify(
        supervisor.systemPrompt,
        reviewPrompt,
        1024
      )

      // Record metrics
      recordTieringMetrics(claudeResult.tier, claudeResult.taskType, claudeResult.costUSD, claudeResult.savingsVsSonnet)

      const outputText = claudeResult.text

      // Parse decision from response
      try {
        const jsonMatch = outputText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]) as SupervisorDecision
        }
      } catch {
        // If parsing fails, default to continue if task succeeded
        return {
          action: taskResult.success ? 'continue' : 'retry',
          reason: 'Could not parse supervisor response',
        }
      }

      // Default decision based on task success
      return {
        action: taskResult.success ? 'continue' : 'retry',
        reason: taskResult.success ? 'Task completed successfully' : 'Task failed - recommending retry',
      }
    } catch (error: any) {
      console.error('Supervisor review error:', error)
      return {
        action: taskResult.success ? 'continue' : 'skip',
        reason: `Supervisor error: ${error.message}`,
      }
    }
  },

  /**
   * Director delegates a task to the appropriate agent
   */
  async directorDelegate(
    task: {
      id: string
      name: string
      type: string
      description: string
      integrationId?: string
      agentId?: string
      config: Record<string, unknown>
    },
    workflowContext?: {
      workflowId: string
      previousTaskOutputs: Record<string, unknown>
    }
  ): Promise<{ agentId: string; modifiedTask: typeof task }> {
    // Map task type/integration to appropriate agent
    let targetAgentId = task.agentId || 'director'

    if (task.integrationId) {
      switch (task.integrationId.toLowerCase()) {
        case 'salesforce':
          targetAgentId = 'salesforce'
          break
        case 'hubspot':
          targetAgentId = 'hubspot'
          break
        case 'gmail':
        case 'outlook':
        case 'email':
          targetAgentId = 'email'
          break
        case 'google_calendar':
        case 'outlook_calendar':
        case 'calendar':
          targetAgentId = 'calendar'
          break
        default:
          targetAgentId = 'data_transform'
      }
    } else if (task.type === 'transform') {
      targetAgentId = 'data_transform'
    }

    // Enrich task with previous context if available
    const modifiedTask = { ...task }
    if (workflowContext?.previousTaskOutputs) {
      modifiedTask.config = {
        ...task.config,
        previousOutputs: workflowContext.previousTaskOutputs,
      }
    }

    return { agentId: targetAgentId, modifiedTask }
  },

  /**
   * Execute a full workflow with multi-agent coordination
   */
  async executeWorkflowWithCoordination(
    workflowId: string,
    tasks: Array<{
      id: string
      name: string
      type: string
      description: string
      integrationId?: string
      agentId?: string
      config: Record<string, unknown>
      dependencies: string[]
    }>
  ): Promise<{
    success: boolean
    completedTasks: string[]
    failedTasks: string[]
    results: Record<string, unknown>
    totalTokens: number
    totalCost: number
  }> {
    const completedTasks: string[] = []
    const failedTasks: string[] = []
    const results: Record<string, unknown> = {}
    let totalTokens = 0
    let totalCost = 0

    // Sort tasks by dependencies (topological sort)
    const sortedTasks = this.topologicalSort(tasks)

    for (const task of sortedTasks) {
      // Check dependencies are met
      const depsComplete = task.dependencies.every((dep) => completedTasks.includes(dep))
      if (!depsComplete) {
        failedTasks.push(task.id)
        continue
      }

      // Director delegates to appropriate agent
      const { agentId, modifiedTask } = await this.directorDelegate(task, {
        workflowId,
        previousTaskOutputs: results,
      })

      // Execute with specialized agent
      let attempts = 0
      const maxAttempts = 3
      let lastResult: AgentExecutionResult | null = null

      while (attempts < maxAttempts) {
        attempts++

        lastResult = await this.executeWithAgent(
          agentId,
          {
            id: modifiedTask.id,
            name: modifiedTask.name,
            description: modifiedTask.description,
            input: modifiedTask.config,
            context: attempts > 1 ? `Retry attempt ${attempts}` : undefined,
          },
          workflowId
        )

        totalTokens += lastResult.tokensUsed
        totalCost += lastResult.costUSD

        // Supervisor reviews the result
        const decision = await this.supervisorReview(lastResult, {
          taskName: task.name,
          expectedOutput: task.description,
          previousAttempts: attempts - 1,
        })

        if (decision.action === 'continue') {
          completedTasks.push(task.id)
          results[task.id] = lastResult.output
          break
        } else if (decision.action === 'skip') {
          completedTasks.push(task.id) // Mark as done but with no output
          results[task.id] = { skipped: true, reason: decision.reason }
          break
        } else if (decision.action === 'abort') {
          failedTasks.push(task.id)
          break
        } else if (decision.action === 'retry') {
          // Continue loop for retry
          if (decision.modifiedInput) {
            modifiedTask.config = {
              ...modifiedTask.config,
              supervisorInput: decision.modifiedInput,
            }
          }
        } else if (decision.action === 'escalate' && decision.nextAgentId) {
          // Try with a different agent
          const escalatedResult = await this.executeWithAgent(
            decision.nextAgentId,
            {
              id: modifiedTask.id,
              name: modifiedTask.name,
              description: modifiedTask.description,
              input: modifiedTask.config,
              context: `Escalated from ${agentId}`,
            },
            workflowId
          )

          totalTokens += escalatedResult.tokensUsed
          totalCost += escalatedResult.costUSD

          if (escalatedResult.success) {
            completedTasks.push(task.id)
            results[task.id] = escalatedResult.output
          } else {
            failedTasks.push(task.id)
          }
          break
        }
      }

      // If we exhausted retries
      if (attempts >= maxAttempts && !completedTasks.includes(task.id)) {
        failedTasks.push(task.id)
      }
    }

    return {
      success: failedTasks.length === 0,
      completedTasks,
      failedTasks,
      results,
      totalTokens,
      totalCost,
    }
  },

  /**
   * Topological sort for task dependencies
   */
  topologicalSort<T extends { id: string; dependencies: string[] }>(tasks: T[]): T[] {
    const sorted: T[] = []
    const visited = new Set<string>()
    const taskMap = new Map(tasks.map((t) => [t.id, t]))

    const visit = (taskId: string) => {
      if (visited.has(taskId)) return
      visited.add(taskId)

      const task = taskMap.get(taskId)
      if (task) {
        for (const dep of task.dependencies) {
          visit(dep)
        }
        sorted.push(task)
      }
    }

    for (const task of tasks) {
      visit(task.id)
    }

    return sorted
  },

  /**
   * Calculate cost based on model and token usage
   */
  calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing: Record<string, { input: number; output: number }> = {
      'claude-opus-4-20250514': { input: 15.0, output: 75.0 },
      'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 },
      'claude-3-5-haiku-20241022': { input: 1.0, output: 5.0 },
    }

    const modelPricing = pricing[model] || pricing['claude-sonnet-4-20250514']
    const inputCost = (inputTokens / 1_000_000) * modelPricing.input
    const outputCost = (outputTokens / 1_000_000) * modelPricing.output

    return Number((inputCost + outputCost).toFixed(6))
  },

  /**
   * Get available agents for UI display
   */
  getAvailableAgents(): AgentRole[] {
    return Object.values(BMAD_AGENTS)
  },

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): AgentRole | undefined {
    return BMAD_AGENTS[agentId]
  },
}
