/**
 * Tool Selector - Optimal Composio Tool Selection for Workflow Intents
 *
 * This module queries 500+ Composio tools and selects the BEST tools for a given intent.
 * It handles:
 * - Semantic tool search across all Composio apps
 * - Tool ranking based on intent match quality
 * - Automatic tool chaining (output of one tool -> input of next)
 * - Input/output mapping between chained tools
 * - Parallel vs sequential execution planning
 *
 * Usage:
 * ```typescript
 * import { toolSelector } from './tool-selector'
 *
 * const result = await toolSelector.selectTools({
 *   intent: parsedIntent,
 *   userEmail: 'user@example.com'
 * })
 *
 * // Result includes:
 * // - Selected tools with input schemas
 * // - Execution order (sequential/parallel)
 * // - Input mappings from previous steps
 * // - Required connections
 * ```
 */

import { composioLogger } from '../monitoring'
import type { ParsedIntent } from '../../types/workflow-execution'

// ============================================================================
// Types
// ============================================================================

export interface ToolSelectionRequest {
  /** Parsed intent from intent-parser */
  intent: ParsedIntent
  /** User email for auto-OAuth matching */
  userEmail?: string
  /** Maximum number of tools to select */
  maxTools?: number
  /** Whether to enable parallel execution where possible */
  enableParallel?: boolean
  /** Known fields from user context */
  knownFields?: Record<string, unknown>
}

export interface SelectedTool {
  /** Tool slug (e.g., GMAIL_SEND_EMAIL) */
  slug: string
  /** Parent toolkit (e.g., gmail) */
  toolkit: string
  /** Tool name for display */
  name: string
  /** Tool description */
  description: string
  /** Input schema for the tool */
  inputSchema: ToolInputSchema
  /** Match confidence (0-1) */
  confidence: number
  /** Reason for selection */
  reason: string
  /** Step ID in the workflow */
  stepId: string
  /** Steps this tool depends on */
  dependsOn: string[]
  /** Input mappings from previous steps */
  inputMappings: InputMapping[]
  /** Whether this tool can run in parallel with others */
  canRunParallel: boolean
}

export interface ToolInputSchema {
  required: string[]
  optional: string[]
  properties: Record<string, ToolInputProperty>
}

export interface ToolInputProperty {
  type: string
  description: string
  format?: string
  enum?: string[]
  default?: unknown
}

export interface InputMapping {
  /** Target parameter name for this tool */
  targetParam: string
  /** Source: 'intent' | 'context' | 'step_output' */
  source: 'intent' | 'context' | 'step_output'
  /** Source path (e.g., 'entities.location' or 'step_1.data.email') */
  sourcePath: string
  /** Optional transform function name */
  transform?: string
}

export interface ToolSelectionResult {
  success: boolean
  /** Selected tools in execution order */
  tools: SelectedTool[]
  /** Execution plan */
  executionPlan: ExecutionPlan
  /** Required connections (toolkits) */
  requiredConnections: string[]
  /** Missing information that needs clarification */
  missingInfo: string[]
  /** Error message if selection failed */
  error?: string
}

export interface ExecutionPlan {
  /** Execution stages (parallel groups) */
  stages: ExecutionStage[]
  /** Total estimated execution time in ms */
  estimatedTimeMs: number
  /** Whether this plan has any parallel execution */
  hasParallelExecution: boolean
}

export interface ExecutionStage {
  /** Stage number (0-indexed) */
  stage: number
  /** Tools that can execute in parallel in this stage */
  tools: string[]
  /** Whether tools in this stage can run in parallel */
  parallel: boolean
}

// ============================================================================
// Tool Category Mappings
// ============================================================================

/**
 * Maps intent categories to likely Composio toolkits
 */
const CATEGORY_TO_TOOLKITS: Record<string, string[]> = {
  food_delivery: ['talabat', 'deliveroo', 'ubereats', 'doordash'],
  travel: ['booking', 'expedia', 'amadeus', 'skyscanner'],
  communication: ['gmail', 'slack', 'discord', 'whatsapp', 'telegram'],
  scheduling: ['googlecalendar', 'outlook', 'calendly'],
  shopping: ['shopify', 'amazon', 'ebay', 'stripe'],
  finance: ['stripe', 'paypal', 'quickbooks', 'xero'],
  productivity: ['notion', 'asana', 'trello', 'monday'],
  research: ['perplexity', 'serper', 'tavily'],
  document_analysis: ['claude', 'openai', 'anthropic'],
  custom: [], // Will search all toolkits
}

// Note: ACTION_TO_OPERATIONS mapping reserved for future semantic tool matching

// ============================================================================
// Tool Selector Class
// ============================================================================

export class ToolSelector {
  // Reserved for future MCP tool catalog caching
  // private mcpTools: Map<string, SelectedTool> = new Map()
  private initialized = false

  /**
   * Initialize tool selector (load tool catalog from MCP)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // In a real implementation, this would query Rube MCP's RUBE_SEARCH_TOOLS
      // For now, we'll use a static catalog based on known tools
      composioLogger.info('ToolSelector initialized with Composio tool catalog')
      this.initialized = true
    } catch (error) {
      composioLogger.error('Failed to initialize ToolSelector', error)
      throw error
    }
  }

  /**
   * Select optimal tools for a given intent
   */
  async selectTools(request: ToolSelectionRequest): Promise<ToolSelectionResult> {
    await this.initialize()

    const {
      intent,
      maxTools = 10,
      enableParallel = true,
      knownFields = {},
    } = request

    const logger = composioLogger.child({ intentId: intent.id, category: intent.category })
    logger.info('Selecting tools for intent', {
      action: intent.action,
      entities: intent.entities.length,
      constraints: intent.constraints.length,
    })

    try {
      // Step 1: Identify candidate toolkits based on category
      const candidateToolkits = this.getCandidateToolkits(intent)
      logger.debug('Candidate toolkits identified', { toolkits: candidateToolkits })

      // Step 2: Search for relevant tools within candidate toolkits
      const candidateTools = await this.searchTools(intent, candidateToolkits)
      logger.debug('Candidate tools found', { count: candidateTools.length })

      // Step 3: Rank and filter tools by relevance
      const rankedTools = this.rankTools(candidateTools, intent)
      const selectedTools = rankedTools.slice(0, maxTools)

      // Step 4: Build execution plan with dependencies
      const toolsWithDependencies = this.buildDependencies(selectedTools, intent)

      // Step 5: Create input mappings for each tool
      const toolsWithMappings = this.createInputMappings(toolsWithDependencies, intent, knownFields)

      // Step 6: Generate execution plan (parallel stages)
      const executionPlan = this.createExecutionPlan(toolsWithMappings, enableParallel)

      // Step 7: Identify required connections
      const toolkitSet = new Set(toolsWithMappings.map(t => t.toolkit))
      const requiredConnections = Array.from(toolkitSet)

      // Step 8: Check for missing information
      const missingInfo = this.identifyMissingInfo(toolsWithMappings, intent, knownFields)

      logger.info('Tool selection completed', {
        selectedTools: toolsWithMappings.length,
        requiredConnections: requiredConnections.length,
        stages: executionPlan.stages.length,
        hasParallel: executionPlan.hasParallelExecution,
      })

      return {
        success: true,
        tools: toolsWithMappings,
        executionPlan,
        requiredConnections,
        missingInfo,
      }
    } catch (error) {
      logger.error('Tool selection failed', error)
      return {
        success: false,
        tools: [],
        executionPlan: { stages: [], estimatedTimeMs: 0, hasParallelExecution: false },
        requiredConnections: [],
        missingInfo: [],
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Get candidate toolkits based on intent category
   */
  private getCandidateToolkits(intent: ParsedIntent): string[] {
    const categoryToolkits = CATEGORY_TO_TOOLKITS[intent.category] || []

    // Add toolkits mentioned in entities
    const entityToolkits: string[] = []
    for (const entity of intent.entities) {
      if (entity.type === 'product' || entity.type === 'organization') {
        const normalized = entity.value.toLowerCase()
        // Check if entity mentions a known service
        if (normalized.includes('gmail') || normalized.includes('email')) entityToolkits.push('gmail')
        if (normalized.includes('slack')) entityToolkits.push('slack')
        if (normalized.includes('calendar')) entityToolkits.push('googlecalendar')
        if (normalized.includes('sheet')) entityToolkits.push('googlesheets')
        if (normalized.includes('github')) entityToolkits.push('github')
      }
    }

    const allToolkits = new Set([...categoryToolkits, ...entityToolkits])
    return Array.from(allToolkits)
  }

  /**
   * Search for tools matching the intent
   * In a real implementation, this would call Rube MCP's RUBE_SEARCH_TOOLS
   */
  private async searchTools(intent: ParsedIntent, toolkits: string[]): Promise<SelectedTool[]> {
    // Build search query from intent (reserved for Rube MCP integration)
    // const searchQuery = this.buildSearchQuery(intent)

    // For now, return mock tools based on intent category
    // In production, this would call:
    // const result = await mcpClient.call('RUBE_SEARCH_TOOLS', {
    //   queries: [{ use_case: searchQuery, known_fields: this.extractKnownFields(intent) }]
    // })

    return this.getMockToolsForIntent(intent, toolkits)
  }

  /**
   * Build search query from intent for Rube MCP
   * (Reserved for production implementation)
   */
  // @ts-expect-error Reserved for production implementation with Rube MCP
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _buildSearchQuery(intent: ParsedIntent): string {
    const action = intent.action
    const category = intent.category
    const entities = intent.entities.map(e => e.value).join(', ')

    // Build natural language query
    return `${action} in ${category} with ${entities}`
  }

  /**
   * Mock tool search - Replace with real Rube MCP call in production
   * @param toolkits - Candidate toolkits to filter tools (reserved for production filtering)
   */
  private getMockToolsForIntent(intent: ParsedIntent, _toolkits: string[]): SelectedTool[] {
    const tools: SelectedTool[] = []

    // Communication intent -> Email/Slack tools
    if (intent.category === 'communication') {
      if (intent.action === 'send') {
        tools.push({
          slug: 'GMAIL_SEND_EMAIL',
          toolkit: 'gmail',
          name: 'Send Email',
          description: 'Send an email via Gmail',
          inputSchema: {
            required: ['to', 'subject', 'body'],
            optional: ['cc', 'bcc', 'attachments'],
            properties: {
              to: { type: 'string', description: 'Recipient email address' },
              subject: { type: 'string', description: 'Email subject' },
              body: { type: 'string', description: 'Email body content' },
            },
          },
          confidence: 0.95,
          reason: 'Direct match for sending email communication',
          stepId: 'step_1',
          dependsOn: [],
          inputMappings: [],
          canRunParallel: false,
        })
      }
    }

    // Scheduling intent -> Calendar tools
    if (intent.category === 'scheduling') {
      if (intent.action === 'create') {
        tools.push({
          slug: 'GOOGLECALENDAR_CREATE_EVENT',
          toolkit: 'googlecalendar',
          name: 'Create Calendar Event',
          description: 'Create a new event in Google Calendar',
          inputSchema: {
            required: ['summary', 'start_datetime'],
            optional: ['end_datetime', 'description', 'attendees', 'location'],
            properties: {
              summary: { type: 'string', description: 'Event title' },
              start_datetime: { type: 'string', description: 'Start time (ISO 8601)', format: 'date-time' },
              end_datetime: { type: 'string', description: 'End time (ISO 8601)', format: 'date-time' },
            },
          },
          confidence: 0.9,
          reason: 'Direct match for creating calendar event',
          stepId: 'step_1',
          dependsOn: [],
          inputMappings: [],
          canRunParallel: false,
        })
      }
    }

    // Document analysis -> Claude AI tools
    if (intent.category === 'document_analysis') {
      tools.push({
        slug: 'CLAUDE_ANALYZE_DOCUMENT',
        toolkit: 'claude',
        name: 'Analyze Document with Claude',
        description: 'Analyze and extract information from documents using Claude AI',
        inputSchema: {
          required: ['document_content'],
          optional: ['analysis_type', 'extract_fields'],
          properties: {
            document_content: { type: 'string', description: 'Document text or URL' },
            analysis_type: { type: 'string', description: 'Type of analysis', enum: ['summarize', 'extract', 'compare'] },
          },
        },
        confidence: 0.85,
        reason: 'AI-powered document analysis',
        stepId: 'step_1',
        dependsOn: [],
        inputMappings: [],
        canRunParallel: false,
      })
    }

    return tools
  }

  /**
   * Rank tools by relevance to intent
   */
  private rankTools(tools: SelectedTool[], _intent: ParsedIntent): SelectedTool[] {
    // Already ranked by confidence in mock implementation
    // In production, this would use semantic similarity scoring
    return tools.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Build dependencies between tools
   */
  private buildDependencies(tools: SelectedTool[], _intent: ParsedIntent): SelectedTool[] {
    // Simple heuristic: Tools that search/fetch data come before tools that create/update
    const readTools = tools.filter(t => t.slug.includes('GET') || t.slug.includes('SEARCH') || t.slug.includes('FETCH'))
    const writeTools = tools.filter(t => !readTools.includes(t))

    // Write tools depend on read tools if present
    const toolsWithDeps = tools.map(tool => {
      if (writeTools.includes(tool) && readTools.length > 0) {
        return {
          ...tool,
          dependsOn: readTools.map(t => t.stepId),
        }
      }
      return tool
    })

    return toolsWithDeps
  }

  /**
   * Create input mappings for each tool from intent and previous steps
   */
  private createInputMappings(
    tools: SelectedTool[],
    intent: ParsedIntent,
    knownFields: Record<string, unknown>
  ): SelectedTool[] {
    return tools.map(tool => {
      const mappings: InputMapping[] = []

      // Map required inputs from intent entities
      for (const param of tool.inputSchema.required) {
        const mapping = this.findInputMapping(param, tool, intent, knownFields)
        if (mapping) {
          mappings.push(mapping)
        }
      }

      return {
        ...tool,
        inputMappings: mappings,
      }
    })
  }

  /**
   * Find input mapping for a parameter
   */
  private findInputMapping(
    param: string,
    tool: SelectedTool,
    intent: ParsedIntent,
    knownFields: Record<string, unknown>
  ): InputMapping | null {
    // Check if parameter is in known fields
    if (param in knownFields) {
      return {
        targetParam: param,
        source: 'context',
        sourcePath: param,
      }
    }

    // Map common parameters to intent entities
    const paramLower = param.toLowerCase()

    // Email parameters
    if (paramLower.includes('email') || paramLower === 'to' || paramLower === 'recipient') {
      const emailEntity = intent.entities.find(e => e.type === 'person' || e.value.includes('@'))
      if (emailEntity) {
        return {
          targetParam: param,
          source: 'intent',
          sourcePath: `entities.${emailEntity.type}`,
        }
      }
    }

    // Location parameters
    if (paramLower.includes('location') || paramLower.includes('address')) {
      const locationEntity = intent.entities.find(e => e.type === 'location')
      if (locationEntity) {
        return {
          targetParam: param,
          source: 'intent',
          sourcePath: `entities.location`,
        }
      }
    }

    // Date/time parameters
    if (paramLower.includes('date') || paramLower.includes('time') || paramLower.includes('datetime')) {
      const dateEntity = intent.entities.find(e => e.type === 'date' || e.type === 'time')
      if (dateEntity) {
        return {
          targetParam: param,
          source: 'intent',
          sourcePath: `entities.${dateEntity.type}`,
        }
      }
    }

    // Message/content parameters
    if (paramLower.includes('message') || paramLower.includes('body') || paramLower.includes('content')) {
      return {
        targetParam: param,
        source: 'intent',
        sourcePath: 'rawInput',
      }
    }

    // Title/subject parameters
    if (paramLower.includes('title') || paramLower.includes('subject') || paramLower.includes('summary')) {
      return {
        targetParam: param,
        source: 'intent',
        sourcePath: 'rawInput',
        transform: 'summarize',
      }
    }

    // Check if previous step output can provide this
    const dependencyStep = tool.dependsOn[0]
    if (dependencyStep) {
      return {
        targetParam: param,
        source: 'step_output',
        sourcePath: `${dependencyStep}.data.${param}`,
      }
    }

    return null
  }

  /**
   * Create execution plan with parallel stages
   */
  private createExecutionPlan(tools: SelectedTool[], enableParallel: boolean): ExecutionPlan {
    const stages: ExecutionStage[] = []
    const processed = new Set<string>()

    // Build dependency graph
    let stageNumber = 0
    while (processed.size < tools.length) {
      const stageTools: string[] = []

      // Find tools whose dependencies are all processed
      for (const tool of tools) {
        if (processed.has(tool.stepId)) continue

        const allDepsProcessed = tool.dependsOn.every(dep => processed.has(dep))
        if (allDepsProcessed) {
          stageTools.push(tool.stepId)
        }
      }

      if (stageTools.length === 0) {
        // Circular dependency or missing dependency
        break
      }

      // Check if tools in this stage can run in parallel
      const canRunParallel = enableParallel && stageTools.length > 1 &&
        stageTools.every(id => {
          const tool = tools.find(t => t.stepId === id)
          return tool?.canRunParallel ?? false
        })

      stages.push({
        stage: stageNumber++,
        tools: stageTools,
        parallel: canRunParallel,
      })

      // Mark tools as processed
      stageTools.forEach(id => processed.add(id))
    }

    // Estimate execution time (rough heuristic)
    const estimatedTimeMs = stages.reduce((total, stage) => {
      const stageTimeMs = stage.parallel ? 2000 : stage.tools.length * 2000
      return total + stageTimeMs
    }, 0)

    return {
      stages,
      estimatedTimeMs,
      hasParallelExecution: stages.some(s => s.parallel),
    }
  }

  /**
   * Identify missing information needed for execution
   */
  private identifyMissingInfo(
    tools: SelectedTool[],
    _intent: ParsedIntent,
    _knownFields: Record<string, unknown>
  ): string[] {
    const missing: string[] = []

    for (const tool of tools) {
      for (const param of tool.inputSchema.required) {
        // Check if we have a mapping for this parameter
        const hasMapping = tool.inputMappings.some(m => m.targetParam === param)
        if (!hasMapping) {
          missing.push(`${tool.name}: ${param}`)
        }
      }
    }

    return missing
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const toolSelector = new ToolSelector()
