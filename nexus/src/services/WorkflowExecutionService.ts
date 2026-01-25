/**
 * WorkflowExecutionService - Real workflow execution via Composio/Rube
 *
 * This service bridges the visual workflow demo with real API execution.
 * It maps workflow node labels to Composio tool slugs and executes them.
 *
 * For full workflow execution with retry logic and Supabase logging,
 * see WorkflowExecutionEngine.ts
 */

import { composioClient } from './ComposioClient'
import { workflowExecutionEngine } from './WorkflowExecutionEngine'
import type { ExecutionConfig } from './WorkflowExecutionEngine'
// ComposioToolResult type reserved for future use
// import type { ComposioToolResult } from './ComposioClient'

export interface WorkflowNode {
  id: string
  data: {
    label: string
    type: 'trigger' | 'agent' | 'api' | 'output'
    agentId?: string
  }
}

export interface ExecutionResult {
  nodeId: string
  success: boolean
  data?: unknown
  error?: string
  executionTimeMs: number
  toolSlug?: string
  isSimulated: boolean
}

export interface ExecutionCallbacks {
  onNodeStart?: (nodeId: string, toolSlug?: string) => void
  onNodeComplete?: (nodeId: string, result: ExecutionResult) => void
  onNodeError?: (nodeId: string, error: string) => void
  onLog?: (message: string) => void
}

// Correct Rube/Composio tool slugs (verified from RUBE_SEARCH_TOOLS)
const RUBE_TOOL_SLUGS = {
  // HubSpot CRM
  hubspot: {
    searchContacts: 'HUBSPOT_SEARCH_CONTACTS_BY_CRITERIA',
    readContact: 'HUBSPOT_READ_CONTACT',
    listContacts: 'HUBSPOT_LIST_CONTACTS',
    searchObjects: 'HUBSPOT_SEARCH_CRM_OBJECTS_BY_CRITERIA',
  },
  // Slack
  slack: {
    sendMessage: 'SLACK_SEND_MESSAGE',
    findChannels: 'SLACK_FIND_CHANNELS',
    listChannels: 'SLACK_LIST_ALL_CHANNELS',
  },
  // Gmail
  gmail: {
    sendEmail: 'GMAIL_SEND_EMAIL',
    createDraft: 'GMAIL_CREATE_EMAIL_DRAFT',
    sendDraft: 'GMAIL_SEND_DRAFT',
    replyToThread: 'GMAIL_REPLY_TO_THREAD',
    fetchEmails: 'GMAIL_FETCH_EMAILS',
  },
  // Google Calendar (verified from RUBE_SEARCH_TOOLS)
  googleCalendar: {
    createEvent: 'GOOGLECALENDAR_CREATE_EVENT',
    listEvents: 'GOOGLECALENDAR_EVENTS_LIST',  // Correct slug (not LIST_EVENTS)
  },
  // Google Sheets (correct slugs from Rube/Composio)
  googleSheets: {
    getData: 'GOOGLESHEETS_BATCH_GET',
    appendData: 'GOOGLESHEETS_BATCH_UPDATE',
  },
  // GitHub - Use correct Rube/Composio tool slugs
  github: {
    createIssue: 'GITHUB_CREATE_ISSUE',
    listIssues: 'GITHUB_LIST_REPOSITORY_ISSUES',  // Correct slug (not LIST_ISSUES)
    listPRs: 'GITHUB_LIST_PULL_REQUESTS',
    getRepo: 'GITHUB_GET_A_REPOSITORY',
  },
}

// Map workflow node labels to Composio tool slugs
const NODE_LABEL_TO_TOOL: Record<string, { toolSlug: string; defaultParams: Record<string, unknown> }> = {
  // Email operations
  'gmail extract': { toolSlug: RUBE_TOOL_SLUGS.gmail.fetchEmails, defaultParams: { user_id: 'me', max_results: 10 } },
  'gmail send': { toolSlug: RUBE_TOOL_SLUGS.gmail.sendEmail, defaultParams: {} },
  'send email': { toolSlug: RUBE_TOOL_SLUGS.gmail.sendEmail, defaultParams: {} },
  'email notification': { toolSlug: RUBE_TOOL_SLUGS.gmail.sendEmail, defaultParams: {} },
  'sendgrid': { toolSlug: RUBE_TOOL_SLUGS.gmail.sendEmail, defaultParams: {} },
  'email': { toolSlug: RUBE_TOOL_SLUGS.gmail.sendEmail, defaultParams: {} },
  'fetch emails': { toolSlug: RUBE_TOOL_SLUGS.gmail.fetchEmails, defaultParams: { user_id: 'me', max_results: 10 } },
  'read emails': { toolSlug: RUBE_TOOL_SLUGS.gmail.fetchEmails, defaultParams: { user_id: 'me', max_results: 10 } },
  'compose email': { toolSlug: RUBE_TOOL_SLUGS.gmail.createDraft, defaultParams: {} },
  'draft email': { toolSlug: RUBE_TOOL_SLUGS.gmail.createDraft, defaultParams: {} },

  // Slack operations - include text param to avoid API errors
  'slack notify': { toolSlug: RUBE_TOOL_SLUGS.slack.sendMessage, defaultParams: { channel: 'general', text: '✅ Workflow completed successfully via Nexus automation' } },
  'slack alert': { toolSlug: RUBE_TOOL_SLUGS.slack.sendMessage, defaultParams: { channel: 'alerts', text: '🚨 Alert from Nexus workflow' } },
  'slack message': { toolSlug: RUBE_TOOL_SLUGS.slack.sendMessage, defaultParams: { channel: 'general', text: '📢 Message from Nexus workflow' } },
  'slack': { toolSlug: RUBE_TOOL_SLUGS.slack.sendMessage, defaultParams: { channel: 'general', text: '📢 Nexus workflow notification' } },
  'post to slack': { toolSlug: RUBE_TOOL_SLUGS.slack.sendMessage, defaultParams: { channel: 'general', text: '📢 Posted from Nexus workflow' } },
  'notify team': { toolSlug: RUBE_TOOL_SLUGS.slack.sendMessage, defaultParams: { channel: 'general', text: '👋 Team notification from Nexus workflow' } },

  // CRM operations
  'hubspot': { toolSlug: RUBE_TOOL_SLUGS.hubspot.searchContacts, defaultParams: { limit: 10 } },
  'hubspot crm': { toolSlug: RUBE_TOOL_SLUGS.hubspot.searchContacts, defaultParams: { limit: 10 } },
  'create contact': { toolSlug: 'HUBSPOT_CREATE_CONTACT', defaultParams: {} },
  'create deal': { toolSlug: 'HUBSPOT_CREATE_DEAL', defaultParams: {} },
  'salesforce': { toolSlug: RUBE_TOOL_SLUGS.hubspot.searchContacts, defaultParams: { limit: 10 } },
  'crm': { toolSlug: RUBE_TOOL_SLUGS.hubspot.listContacts, defaultParams: { limit: 10 } },
  'list contacts': { toolSlug: RUBE_TOOL_SLUGS.hubspot.listContacts, defaultParams: { limit: 10 } },
  'search contacts': { toolSlug: RUBE_TOOL_SLUGS.hubspot.searchContacts, defaultParams: { limit: 10 } },

  // Calendar operations
  'calendar': { toolSlug: RUBE_TOOL_SLUGS.googleCalendar.listEvents, defaultParams: {} },
  'create event': { toolSlug: RUBE_TOOL_SLUGS.googleCalendar.createEvent, defaultParams: {} },
  'scheduling': { toolSlug: RUBE_TOOL_SLUGS.googleCalendar.createEvent, defaultParams: {} },
  'calendly': { toolSlug: RUBE_TOOL_SLUGS.googleCalendar.listEvents, defaultParams: {} },
  'schedule meeting': { toolSlug: RUBE_TOOL_SLUGS.googleCalendar.createEvent, defaultParams: {} },
  'meeting': { toolSlug: RUBE_TOOL_SLUGS.googleCalendar.createEvent, defaultParams: {} },
  'google calendar': { toolSlug: RUBE_TOOL_SLUGS.googleCalendar.listEvents, defaultParams: {} },
  'list events': { toolSlug: RUBE_TOOL_SLUGS.googleCalendar.listEvents, defaultParams: {} },
  'check calendar': { toolSlug: RUBE_TOOL_SLUGS.googleCalendar.listEvents, defaultParams: {} },

  // Spreadsheets
  'google sheets': { toolSlug: RUBE_TOOL_SLUGS.googleSheets.getData, defaultParams: {} },
  'spreadsheet': { toolSlug: RUBE_TOOL_SLUGS.googleSheets.getData, defaultParams: {} },
  'sheets': { toolSlug: RUBE_TOOL_SLUGS.googleSheets.getData, defaultParams: {} },
  'read spreadsheet': { toolSlug: RUBE_TOOL_SLUGS.googleSheets.getData, defaultParams: {} },
  'write spreadsheet': { toolSlug: RUBE_TOOL_SLUGS.googleSheets.appendData, defaultParams: {} },
  'update spreadsheet': { toolSlug: RUBE_TOOL_SLUGS.googleSheets.appendData, defaultParams: {} },
  'excel': { toolSlug: RUBE_TOOL_SLUGS.googleSheets.getData, defaultParams: {} },
  'log data': { toolSlug: RUBE_TOOL_SLUGS.googleSheets.appendData, defaultParams: {} },
  'save to sheets': { toolSlug: RUBE_TOOL_SLUGS.googleSheets.appendData, defaultParams: {} },

  // GitHub operations - Use demo repo (facebook/react) for valid API calls
  // NOTE: Requires OAuth connection to actually execute - will simulate if not connected
  'github': { toolSlug: RUBE_TOOL_SLUGS.github.listIssues, defaultParams: { owner: 'facebook', repo: 'react', per_page: 5 } },
  'github actions': { toolSlug: RUBE_TOOL_SLUGS.github.listPRs, defaultParams: { owner: 'facebook', repo: 'react', per_page: 5 } },
  'git push': { toolSlug: RUBE_TOOL_SLUGS.github.getRepo, defaultParams: { owner: 'facebook', repo: 'react' } },
  'create issue': { toolSlug: RUBE_TOOL_SLUGS.github.createIssue, defaultParams: { owner: 'facebook', repo: 'react' } },
  'create pr': { toolSlug: 'GITHUB_CREATE_PULL_REQUEST', defaultParams: { owner: 'facebook', repo: 'react' } },
  'pull request': { toolSlug: 'GITHUB_LIST_PULL_REQUESTS', defaultParams: { owner: 'facebook', repo: 'react', per_page: 5 } },
  'github issue': { toolSlug: RUBE_TOOL_SLUGS.github.createIssue, defaultParams: { owner: 'facebook', repo: 'react' } },
  'list issues': { toolSlug: RUBE_TOOL_SLUGS.github.listIssues, defaultParams: { owner: 'facebook', repo: 'react', per_page: 5 } },
  'code review': { toolSlug: RUBE_TOOL_SLUGS.github.listPRs, defaultParams: { owner: 'facebook', repo: 'react', per_page: 5, state: 'open' } },
  'lint': { toolSlug: RUBE_TOOL_SLUGS.github.listIssues, defaultParams: { owner: 'facebook', repo: 'react', per_page: 5, labels: 'Type: Bug' } },
  'sonarqube': { toolSlug: RUBE_TOOL_SLUGS.github.listIssues, defaultParams: { owner: 'facebook', repo: 'react', per_page: 5 } },

  // Generic AI/Analysis nodes
  'ai agent': { toolSlug: 'OPENAI_CHAT_COMPLETION', defaultParams: {} },
  'ai analyze': { toolSlug: 'OPENAI_CHAT_COMPLETION', defaultParams: {} },
  'analyze': { toolSlug: 'OPENAI_CHAT_COMPLETION', defaultParams: {} },
  'summarize': { toolSlug: 'OPENAI_CHAT_COMPLETION', defaultParams: {} },
  'process': { toolSlug: 'OPENAI_CHAT_COMPLETION', defaultParams: {} },
  'generate': { toolSlug: 'OPENAI_CHAT_COMPLETION', defaultParams: {} },

  // Data/Web operations
  'fetch data': { toolSlug: 'FIRECRAWL_SCRAPE', defaultParams: {} },
  'web scrape': { toolSlug: 'FIRECRAWL_SCRAPE', defaultParams: {} },
  'scrape': { toolSlug: 'FIRECRAWL_SCRAPE', defaultParams: {} },
  'api call': { toolSlug: 'HTTP_REQUEST', defaultParams: {} },
  'webhook': { toolSlug: 'HTTP_REQUEST', defaultParams: {} },
}

class WorkflowExecutionServiceClass {
  private initialized = false

  /**
   * Initialize the execution service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      await composioClient.initialize()
      this.initialized = true
      console.log('[WorkflowExecutionService] Initialized')
    } catch (error) {
      console.warn('[WorkflowExecutionService] Failed to initialize Composio, will use simulation mode:', error)
      this.initialized = true // Continue with simulation mode
    }
  }

  /**
   * Execute a single workflow node
   */
  async executeNode(
    node: WorkflowNode,
    context: Record<string, unknown> = {},
    callbacks?: ExecutionCallbacks
  ): Promise<ExecutionResult> {
    const startTime = Date.now()
    const labelLower = node.data.label.toLowerCase()

    callbacks?.onNodeStart?.(node.id)

    // Check if this node type can be mapped to a real tool
    const toolMapping = this.findToolMapping(labelLower)

    if (toolMapping) {
      callbacks?.onLog?.(`Executing real API: ${toolMapping.toolSlug}`)
      callbacks?.onNodeStart?.(node.id, toolMapping.toolSlug)

      try {
        const result = await composioClient.executeTool(
          toolMapping.toolSlug,
          { ...toolMapping.defaultParams, ...context }
        )

        const execResult: ExecutionResult = {
          nodeId: node.id,
          success: result.success,
          data: result.data,
          error: result.error,
          executionTimeMs: result.executionTimeMs,
          toolSlug: toolMapping.toolSlug,
          isSimulated: false,
        }

        callbacks?.onNodeComplete?.(node.id, execResult)
        return execResult

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        callbacks?.onNodeError?.(node.id, errorMsg)

        return {
          nodeId: node.id,
          success: false,
          error: errorMsg,
          executionTimeMs: Date.now() - startTime,
          toolSlug: toolMapping.toolSlug,
          isSimulated: false,
        }
      }
    }

    // No real tool mapping - simulate execution
    callbacks?.onLog?.(`Simulating: ${node.data.label} (no real API mapping)`)

    // Simulate processing time for demo
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500))

    const simulatedResult: ExecutionResult = {
      nodeId: node.id,
      success: true,
      data: { message: `Simulated ${node.data.label} execution`, type: node.data.type },
      executionTimeMs: Date.now() - startTime,
      isSimulated: true,
    }

    callbacks?.onNodeComplete?.(node.id, simulatedResult)
    return simulatedResult
  }

  /**
   * Execute a full workflow with all nodes
   */
  async executeWorkflow(
    nodes: WorkflowNode[],
    edges: { source: string; target: string }[],
    callbacks?: ExecutionCallbacks
  ): Promise<ExecutionResult[]> {
    await this.initialize()

    const results: ExecutionResult[] = []
    const context: Record<string, unknown> = {}

    // Build dependency graph
    const nodeOrder = this.getExecutionOrder(nodes, edges)

    callbacks?.onLog?.(`Starting workflow with ${nodeOrder.length} nodes`)

    for (const nodeId of nodeOrder) {
      const node = nodes.find(n => n.id === nodeId)
      if (!node) continue

      const result = await this.executeNode(node, context, callbacks)
      results.push(result)

      // Pass result to context for dependent nodes
      if (result.success && result.data) {
        context[`node_${nodeId}`] = result.data
      }

      // Small delay between nodes for visual effect
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    callbacks?.onLog?.('Workflow execution complete')
    return results
  }

  /**
   * Find tool mapping for a node label
   */
  private findToolMapping(labelLower: string): { toolSlug: string; defaultParams: Record<string, unknown> } | null {
    // Direct match
    if (NODE_LABEL_TO_TOOL[labelLower]) {
      return NODE_LABEL_TO_TOOL[labelLower]
    }

    // Partial match
    for (const [key, value] of Object.entries(NODE_LABEL_TO_TOOL)) {
      if (labelLower.includes(key) || key.includes(labelLower)) {
        return value
      }
    }

    return null
  }

  /**
   * Get execution order based on edges (topological sort)
   */
  private getExecutionOrder(nodes: WorkflowNode[], edges: { source: string; target: string }[]): string[] {
    const nodeIds = nodes.map(n => n.id)
    const inDegree: Record<string, number> = {}
    const adjacency: Record<string, string[]> = {}

    // Initialize
    for (const nodeId of nodeIds) {
      inDegree[nodeId] = 0
      adjacency[nodeId] = []
    }

    // Build graph
    for (const edge of edges) {
      adjacency[edge.source]?.push(edge.target)
      if (inDegree[edge.target] !== undefined) {
        inDegree[edge.target]++
      }
    }

    // Topological sort using Kahn's algorithm
    const queue = nodeIds.filter(id => inDegree[id] === 0)
    const result: string[] = []

    while (queue.length > 0) {
      const nodeId = queue.shift()!
      result.push(nodeId)

      for (const neighbor of (adjacency[nodeId] || [])) {
        inDegree[neighbor]--
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor)
        }
      }
    }

    // If we couldn't order all nodes (cycle), fall back to input order
    if (result.length !== nodeIds.length) {
      return nodeIds
    }

    return result
  }

  /**
   * Check which tools are available for real execution
   */
  getAvailableTools(): string[] {
    return Object.keys(NODE_LABEL_TO_TOOL)
  }

  /**
   * Check if a specific node can execute with real APIs
   */
  canExecuteReal(nodeLabel: string): boolean {
    return this.findToolMapping(nodeLabel.toLowerCase()) !== null
  }

  /**
   * Execute a full workflow using the WorkflowExecutionEngine
   * with retry logic, exponential backoff, and Supabase logging
   */
  async executeWorkflowWithEngine(
    nodes: WorkflowNode[],
    edges: { source: string; target: string }[],
    options?: {
      projectId?: string
      workflowDbId?: string
      config?: Partial<ExecutionConfig>
    },
    callbacks?: ExecutionCallbacks
  ): Promise<ExecutionResult[]> {
    await this.initialize()

    // Convert to GeneratedWorkflow format
    const workflow = {
      id: options?.workflowDbId || `workflow_${Date.now()}`,
      name: 'Visual Workflow',
      description: 'Workflow from visual builder',
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.data.type as 'trigger' | 'action' | 'condition' | 'output',
        tool: this.findToolMapping(node.data.label.toLowerCase())?.toolSlug || node.data.label,
        toolIcon: '🔧',
        name: node.data.label,
        description: `${node.data.type} node: ${node.data.label}`,
        config: {},
        position: { x: 0, y: 0 }
      })),
      connections: edges.map(e => ({ from: e.source, to: e.target })),
      requiredIntegrations: [],
      estimatedTimeSaved: 'Unknown',
      complexity: 'medium' as const
    }

    // Update engine config if provided
    if (options?.config) {
      workflowExecutionEngine.updateConfig(options.config)
    }

    // Subscribe to events if callbacks provided
    let unsubscribe: (() => void) | null = null
    if (callbacks) {
      unsubscribe = workflowExecutionEngine.subscribe(event => {
        if (event.type === 'node_started') {
          callbacks.onNodeStart?.(event.nodeId, event.nodeName)
        } else if (event.type === 'node_completed') {
          callbacks.onNodeComplete?.(event.nodeId, {
            nodeId: event.nodeId,
            success: event.result.status === 'success',
            data: event.result.output,
            error: event.result.error,
            executionTimeMs: event.result.durationMs,
            toolSlug: event.result.toolSlug,
            isSimulated: false
          })
        } else if (event.type === 'node_failed') {
          callbacks.onNodeError?.(event.nodeId, event.error)
        }
      })
    }

    try {
      callbacks?.onLog?.(`Starting workflow with ${nodes.length} nodes using enhanced engine`)

      const result = await workflowExecutionEngine.executeWorkflow(workflow, {}, {
        projectId: options?.projectId,
        workflowDbId: options?.workflowDbId
      })

      callbacks?.onLog?.('Workflow execution complete')

      // Convert results to ExecutionResult format
      const results: ExecutionResult[] = []
      for (const [nodeId, nodeResult] of result.nodeResults) {
        results.push({
          nodeId,
          success: nodeResult.status === 'success',
          data: nodeResult.output,
          error: nodeResult.error,
          executionTimeMs: nodeResult.durationMs,
          toolSlug: nodeResult.toolSlug,
          isSimulated: false
        })
      }

      return results

    } finally {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }
}

// Export singleton instance
export const workflowExecutionService = new WorkflowExecutionServiceClass()

// Re-export types from engine for convenience
export type { ExecutionConfig } from './WorkflowExecutionEngine'
