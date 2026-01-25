/**
 * RubeAIExecutor - Execute workflows through Claude AI + Rube MCP
 *
 * ARCHITECTURE:
 * User clicks Execute → Frontend sends workflow to /api/chat with execution flag
 * → Backend forwards to Claude → Claude calls Rube MCP directly → Real execution
 * → Claude returns results → Frontend displays
 *
 * WHY THIS WORKS:
 * - Claude has direct access to Rube MCP tools (RUBE_MULTI_EXECUTE_TOOL, etc.)
 * - OAuth connections are already managed by Rube
 * - No COMPOSIO_API_KEY needed - uses Claude's MCP access
 * - Real API calls to Gmail, Slack, Sheets, Calendar, GitHub, etc.
 *
 * SUPPORTED INTEGRATIONS (via Rube MCP):
 * - Gmail: send, fetch, draft, reply
 * - Slack: send message, list channels
 * - Google Sheets: read, append, update
 * - Google Calendar: create event, list events
 * - GitHub: create issue, list PRs
 * - HubSpot: create contact, search
 * - Notion: create page, update
 * - And 500+ more apps
 */

export interface WorkflowNode {
  id: string
  name: string
  type: 'trigger' | 'action' | 'output'
  integration?: string
  params?: Record<string, unknown>
  status?: 'pending' | 'connecting' | 'success' | 'error'
  result?: unknown
  error?: string
}

export interface ExecutionRequest {
  workflowId: string
  workflowName: string
  nodes: WorkflowNode[]
  executeNow: true  // Flag to indicate this is an execution request
  sessionId?: string
}

export interface NodeExecutionResult {
  nodeId: string
  success: boolean
  data?: unknown
  error?: string
  executionTimeMs: number
}

export interface ExecutionResponse {
  success: boolean
  results: NodeExecutionResult[]
  message?: string
  totalTimeMs: number
}

/**
 * Execute a workflow by sending it to the AI chat endpoint
 * Claude will process this and call Rube MCP for real execution
 */
export async function executeWorkflowViaAI(
  workflow: {
    id: string
    name: string
    nodes: WorkflowNode[]
  },
  onNodeUpdate?: (nodeId: string, status: 'connecting' | 'success' | 'error', result?: unknown, error?: string) => void
): Promise<ExecutionResponse> {
  const startTime = Date.now()

  try {
    // Build execution message for Claude
    const executionMessage = buildExecutionMessage(workflow)

    console.log('[RubeAIExecutor] Sending execution request to AI...')

    // Send to AI chat endpoint with execute flag
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: executionMessage,
        executeWorkflow: true,  // Special flag for execution
        workflowData: workflow,
      }),
    })

    if (!response.ok) {
      throw new Error(`AI execution request failed: ${response.status}`)
    }

    const data = await response.json()
    console.log('[RubeAIExecutor] AI response:', data)

    // Parse execution results from AI response
    const results = parseExecutionResults(data, workflow.nodes)

    // Call node update callbacks
    if (onNodeUpdate) {
      for (const result of results) {
        onNodeUpdate(
          result.nodeId,
          result.success ? 'success' : 'error',
          result.data,
          result.error
        )
      }
    }

    return {
      success: results.every(r => r.success),
      results,
      message: data.message || 'Workflow executed',
      totalTimeMs: Date.now() - startTime,
    }
  } catch (error) {
    console.error('[RubeAIExecutor] Execution error:', error)
    return {
      success: false,
      results: workflow.nodes.map(n => ({
        nodeId: n.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: Date.now() - startTime,
      })),
      message: error instanceof Error ? error.message : 'Execution failed',
      totalTimeMs: Date.now() - startTime,
    }
  }
}

/**
 * Build a clear execution message for Claude
 */
function buildExecutionMessage(workflow: {
  id: string
  name: string
  nodes: WorkflowNode[]
}): string {
  const nodeDescriptions = workflow.nodes.map((node, i) => {
    const params = node.params ? JSON.stringify(node.params) : '{}'
    return `${i + 1}. [${node.type}] ${node.name} (${node.integration || 'unknown'}) - params: ${params}`
  }).join('\n')

  return `EXECUTE WORKFLOW NOW:

Workflow: ${workflow.name}
ID: ${workflow.id}

Nodes to execute:
${nodeDescriptions}

Please execute each node using Rube MCP tools (RUBE_MULTI_EXECUTE_TOOL, etc.).
For each node:
1. Map the integration+action to the correct Rube tool slug
2. Call the Rube tool with the provided params
3. Return the actual API response

Return results in JSON format:
{
  "executed": true,
  "results": [
    { "nodeId": "...", "success": true/false, "data": {...}, "error": "..." }
  ]
}`
}

/**
 * Parse execution results from Claude's response
 */
function parseExecutionResults(
  aiResponse: { message?: string; text?: string; results?: NodeExecutionResult[] },
  nodes: WorkflowNode[]
): NodeExecutionResult[] {
  // If AI returned structured results, use them
  if (aiResponse.results && Array.isArray(aiResponse.results)) {
    return aiResponse.results
  }

  // Try to parse JSON from message
  const text = aiResponse.message || aiResponse.text || ''
  const jsonMatch = text.match(/\{[\s\S]*"executed"[\s\S]*\}/)

  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed.results && Array.isArray(parsed.results)) {
        return parsed.results
      }
    } catch {
      // Fall through to default
    }
  }

  // Default: mark all nodes as executed based on AI response content
  const hasSuccess = text.toLowerCase().includes('success') ||
                     text.toLowerCase().includes('completed') ||
                     text.toLowerCase().includes('executed')

  return nodes.map(node => ({
    nodeId: node.id,
    success: hasSuccess,
    data: hasSuccess ? { message: 'Executed via AI' } : undefined,
    error: hasSuccess ? undefined : 'No execution confirmation received',
    executionTimeMs: 0,
  }))
}

/**
 * Check if an integration is connected via Rube MCP
 */
export async function checkRubeConnection(toolkit: string): Promise<{
  connected: boolean
  authUrl?: string
}> {
  try {
    const response = await fetch('/api/rube/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolkits: [toolkit] }),
    })

    if (!response.ok) {
      return { connected: false }
    }

    const data = await response.json()
    const connection = data.connections?.[toolkit]

    return {
      connected: connection?.connected ?? false,
      authUrl: connection?.authUrl,
    }
  } catch {
    return { connected: false }
  }
}

/**
 * Get OAuth URL for an integration that needs connection
 */
export async function getRubeAuthUrl(toolkit: string): Promise<string | null> {
  try {
    const response = await fetch('/api/rube/oauth/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolkit }),
    })

    const data = await response.json()
    return data.authUrl || null
  } catch {
    return null
  }
}

export default {
  executeWorkflowViaAI,
  checkRubeConnection,
  getRubeAuthUrl,
}
