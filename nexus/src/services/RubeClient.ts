/**
 * RubeClient - Frontend client for Rube MCP integration
 *
 * This client interfaces with the backend Rube API routes
 * to provide OAuth connections and workflow execution via Rube MCP.
 */

// Types matching backend RubeMCPService
export interface RubeConnectionStatus {
  app: string
  connected: boolean
  authUrl?: string
  connectionId?: string
  user_info?: {
    email?: string
    name?: string
  }
}

export interface RubeToolExecutionResult {
  success: boolean
  data?: unknown
  error?: string
  toolName: string
  executionTimeMs: number
}

export interface RubeSearchResult {
  tools: Array<{
    name: string
    slug: string
    description: string
    toolkit: string
    inputSchema?: Record<string, unknown>
  }>
  connection_statuses: Record<
    string,
    {
      connected: boolean
      authUrl?: string
    }
  >
  session_id?: string
}

class RubeClientService {
  private baseUrl = '/api/rube'
  private sessionId: string | null = null

  /**
   * Get or generate a session ID for Rube MCP
   */
  getSessionId(): string {
    if (!this.sessionId) {
      this.sessionId = `nexus_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
    }
    return this.sessionId
  }

  /**
   * Set session ID (e.g., from search results)
   */
  setSessionId(id: string): void {
    this.sessionId = id
  }

  /**
   * Search for tools by use case
   */
  async searchTools(
    queries: Array<{ use_case: string; known_fields?: string }>
  ): Promise<RubeSearchResult> {
    const response = await fetch(`${this.baseUrl}/search-tools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queries, session_id: this.getSessionId() }),
    })

    if (!response.ok) {
      throw new Error(`Search tools failed: ${response.statusText}`)
    }

    const data = await response.json()

    // Update session ID if returned
    if (data.session_id) {
      this.sessionId = data.session_id
    }

    return data
  }

  /**
   * Check connection status for a toolkit
   */
  async checkConnection(toolkit: string): Promise<RubeConnectionStatus> {
    const response = await fetch(`${this.baseUrl}/connection-status/${toolkit}`)

    if (!response.ok) {
      throw new Error(`Connection check failed: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      app: toolkit,
      connected: data.connected ?? false,
      authUrl: data.authUrl,
      connectionId: data.connectionId,
      user_info: data.user_info,
    }
  }

  /**
   * Initiate OAuth connection for toolkits
   * Returns auth URLs for toolkits that need connection
   */
  async initiateConnection(
    toolkits: string[]
  ): Promise<Record<string, RubeConnectionStatus>> {
    const response = await fetch(`${this.baseUrl}/manage-connections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toolkits,
        session_id: this.getSessionId(),
      }),
    })

    if (!response.ok) {
      throw new Error(`Connection initiation failed: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'Connection initiation failed')
    }

    // Convert results to RubeConnectionStatus map
    const results: Record<string, RubeConnectionStatus> = {}
    for (const [toolkit, status] of Object.entries(data.results || {})) {
      const s = status as { status: string; redirect_url?: string }
      results[toolkit] = {
        app: toolkit,
        connected: s.status === 'active' || s.status === 'connected',
        authUrl: s.redirect_url,
      }
    }

    return results
  }

  /**
   * Execute a single tool
   */
  async executeTool(
    toolSlug: string,
    params: Record<string, unknown>
  ): Promise<RubeToolExecutionResult> {
    const startTime = Date.now()

    const response = await fetch(`${this.baseUrl}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tools: [{ tool_slug: toolSlug, arguments: params }],
        session_id: this.getSessionId(),
      }),
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Execution failed: ${response.statusText}`,
        toolName: toolSlug,
        executionTimeMs: Date.now() - startTime,
      }
    }

    const data = await response.json()
    const result = data.results?.[0]

    return {
      success: result?.success ?? false,
      data: result?.data,
      error: result?.error,
      toolName: toolSlug,
      executionTimeMs: Date.now() - startTime,
    }
  }

  /**
   * Execute multiple tools in parallel
   */
  async executeMultipleTools(
    tools: Array<{ tool_slug: string; arguments: Record<string, unknown> }>
  ): Promise<RubeToolExecutionResult[]> {
    const startTime = Date.now()

    const response = await fetch(`${this.baseUrl}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tools,
        session_id: this.getSessionId(),
      }),
    })

    if (!response.ok) {
      return tools.map((t) => ({
        success: false,
        error: `Execution failed: ${response.statusText}`,
        toolName: t.tool_slug,
        executionTimeMs: Date.now() - startTime,
      }))
    }

    const data = await response.json()

    return (data.results || []).map(
      (
        result: { success: boolean; data?: unknown; error?: string; tool_slug?: string },
        index: number
      ) => ({
        success: result.success ?? false,
        data: result.data,
        error: result.error,
        toolName: result.tool_slug || tools[index]?.tool_slug || 'unknown',
        executionTimeMs: Date.now() - startTime,
      })
    )
  }

  /**
   * Get Rube MCP service status
   */
  async getStatus(): Promise<{
    initialized: boolean
    available: boolean
    message?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/status`)
      if (!response.ok) {
        return { initialized: false, available: false, message: response.statusText }
      }
      return await response.json()
    } catch (error) {
      return {
        initialized: false,
        available: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Poll for connection status until connected or timeout
   */
  async pollConnection(
    toolkit: string,
    options: {
      maxAttempts?: number
      intervalMs?: number
      onProgress?: (attempt: number, maxAttempts: number) => void
    } = {}
  ): Promise<RubeConnectionStatus> {
    const { maxAttempts = 40, intervalMs = 3000, onProgress } = options

    return new Promise((resolve, reject) => {
      let attempts = 0

      const poll = async () => {
        attempts++
        onProgress?.(attempts, maxAttempts)

        if (attempts > maxAttempts) {
          reject(new Error(`Connection timeout for ${toolkit}`))
          return
        }

        try {
          const status = await this.checkConnection(toolkit)
          if (status.connected) {
            resolve(status)
            return
          }
        } catch {
          // Continue polling on error
        }

        setTimeout(poll, intervalMs)
      }

      poll()
    })
  }
}

// Export singleton instance
export const rubeClient = new RubeClientService()
