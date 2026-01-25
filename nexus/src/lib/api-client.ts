// Secure API client for calling backend endpoints
// All AI and integration calls go through the server, not directly from browser

import {
  apiCache,
  createCacheKey,
  CacheTTL,
  StaleTime,
  CacheKeys,
  invalidateWorkflowCache,
  invalidateUserCache,
  invalidateTemplateCache
} from './cache'
import { monitoring } from './monitoring'

const API_BASE = import.meta.env.VITE_API_URL || ''

// Nexus Agent types
export interface NexusAgent {
  id: string
  name: string
  title: string
  avatar: string
  color: string
}

// Alias for backwards compatibility
export type BMADAgent = NexusAgent

interface ImageContent {
  type: 'image'
  source: {
    type: 'base64'
    media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
    data: string
  }
}

interface ChatRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  systemPrompt?: string
  model?: 'claude-3-5-haiku-20241022' | 'claude-sonnet-4-20250514' | 'claude-opus-4-5-20251101'
  maxTokens?: number
  agentId?: string  // Specific Nexus agent to use
  autoRoute?: boolean  // Let backend auto-route to best agent
  images?: ImageContent[]  // Images attached to the latest message
}

interface ChatResponse {
  success: boolean
  output: string
  tokensUsed?: number
  inputTokens?: number
  outputTokens?: number
  model?: string
  agent?: NexusAgent  // Which agent responded
  usage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
    // Prompt caching metrics (when available)
    cacheCreationInputTokens?: number  // Tokens written to cache (first request)
    cacheReadInputTokens?: number      // Tokens read from cache (cache hit)
    totalInputTokens?: number          // Total input tokens including cached
  }
  viaProxy?: boolean  // Whether the response came from the proxy
  costUSD?: number    // Estimated cost in USD
  error?: string
}

interface WorkflowStep {
  id: string
  type: 'ai-agent' | 'email' | 'http' | 'data-transform' | 'condition'
  config: Record<string, any>
  label: string
}

interface WorkflowExecutionRequest {
  workflowId: string
  executionId: string
  steps: WorkflowStep[]
  input: Record<string, any>
  variables: Record<string, any>
}

interface WorkflowExecutionResponse {
  success: boolean
  workflowId: string
  executionId: string
  results: Array<{
    stepId: string
    status: 'success' | 'error'
    output: any
    tokensUsed?: number
    costUSD?: number
    error?: string
    duration: number
  }>
  finalOutput: any
  totalTokens: number
  totalCost: number
  error?: string
}

interface EmailRequest {
  to: string | string[]
  subject: string
  body: string
  from?: string
  replyTo?: string
}

interface EmailResponse {
  success: boolean
  emailId?: string
  message?: string
  to?: string[]
  subject?: string
  sentAt?: string
  error?: string
}

interface HubSpotRequest {
  action: 'createContact' | 'updateContact' | 'getContact' | 'searchContacts' | 'createDeal' | 'listContacts'
  data?: Record<string, any>
  contactId?: string
  query?: string
  limit?: number
}

interface HubSpotResponse {
  success: boolean
  action: string
  result: any
  error?: string
}

// Admin API Types
interface VercelAdminRequest {
  action: 'getProject' | 'getDeployments' | 'redeploy' | 'getEnvVars' | 'setEnvVar' | 'deleteEnvVar'
  deploymentId?: string
  envKey?: string
  envValue?: string
  target?: 'production' | 'preview' | 'development'
}

interface VercelAdminResponse {
  success: boolean
  action: string
  result: any
  error?: string
  hint?: string
  setupSteps?: string[]
}

interface SupabaseAdminRequest {
  action: 'getProject' | 'getUsage' | 'getTables' | 'getTableData' | 'runSql'
  sql?: string
  tableName?: string
  limit?: number
  offset?: number
}

interface SupabaseAdminResponse {
  success: boolean
  action?: string
  result?: any
  error?: string
  hint?: string
  manualSteps?: string[]
  sql?: string
  createFunction?: string
}

// Error types for better error handling
export class APIError extends Error {
  readonly statusCode: number
  readonly errorType: 'network' | 'auth' | 'rate_limit' | 'server' | 'client' | 'timeout' | 'unknown'
  readonly retryable: boolean
  readonly retryAfter?: number

  constructor(
    message: string,
    statusCode: number,
    errorType: 'network' | 'auth' | 'rate_limit' | 'server' | 'client' | 'timeout' | 'unknown',
    retryable: boolean = false,
    retryAfter?: number
  ) {
    super(message)
    this.name = 'APIError'
    this.statusCode = statusCode
    this.errorType = errorType
    this.retryable = retryable
    this.retryAfter = retryAfter
  }

  static fromResponse(response: Response, data: { error?: string }): APIError {
    const status = response.status
    let type: APIError['errorType'] = 'unknown'
    let retryable = false
    let retryAfter: number | undefined

    // Classify error
    if (status === 401) {
      type = 'auth'
    } else if (status === 429) {
      type = 'rate_limit'
      retryable = true
      retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10) * 1000
    } else if (status >= 500) {
      type = 'server'
      retryable = true
    } else if (status >= 400) {
      type = 'client'
    }

    const message = data.error || `Request failed with status ${status}`
    return new APIError(message, status, type, retryable, retryAfter)
  }

  static networkError(_originalError: Error): APIError {
    return new APIError(
      'Network connection failed. Please check your internet.',
      0,
      'network',
      true
    )
  }

  static timeoutError(): APIError {
    return new APIError(
      'Request timed out. Please try again.',
      0,
      'timeout',
      true
    )
  }
}

// Retry configuration
interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  retryOn: APIError['errorType'][]
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryOn: ['network', 'timeout', 'server', 'rate_limit'],
}

class APIClient {
  private baseUrl: string

  constructor() {
    // Use relative URLs for Vercel - the /api routes are handled by Vercel Functions
    this.baseUrl = API_BASE
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit,
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<T> {
    const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig }
    const url = `${this.baseUrl}/api${endpoint}`
    const method = options.method || 'GET'
    const startTime = performance.now()

    let lastError: APIError | null = null

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        // Check if online
        if (!navigator.onLine) {
          throw APIError.networkError(new Error('Offline'))
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        })

        clearTimeout(timeoutId)

        const data = await response.json()
        const duration = performance.now() - startTime

        if (!response.ok && !data.success) {
          const apiError = APIError.fromResponse(response, data)

          // Track failed request
          monitoring.trackAPIRequest({
            endpoint,
            method,
            duration,
            status: response.status,
            success: false,
            errorType: apiError.errorType,
          })

          throw apiError
        }

        // Track successful request
        monitoring.trackAPIRequest({
          endpoint,
          method,
          duration,
          status: response.status,
          success: true,
        })

        return data
      } catch (error) {
        const duration = performance.now() - startTime

        // Convert to APIError if needed
        if (error instanceof APIError) {
          lastError = error
        } else if (error instanceof Error) {
          if (error.name === 'AbortError') {
            lastError = APIError.timeoutError()
          } else if (error.message.includes('fetch') || error.message.includes('network')) {
            lastError = APIError.networkError(error)
          } else {
            lastError = new APIError(error.message, 0, 'unknown', false)
          }
        } else {
          lastError = new APIError('An unknown error occurred', 0, 'unknown', false)
        }

        // Track error on final attempt or non-retryable errors
        const shouldRetry =
          attempt < config.maxRetries &&
          lastError.retryable &&
          config.retryOn.includes(lastError.errorType)

        if (!shouldRetry) {
          // Track final failure
          monitoring.trackAPIRequest({
            endpoint,
            method,
            duration,
            status: lastError.statusCode,
            success: false,
            errorType: lastError.errorType,
          })

          throw lastError
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          lastError.retryAfter || config.baseDelay * Math.pow(2, attempt),
          config.maxDelay
        )

        console.log(`[API] Retry ${attempt + 1}/${config.maxRetries} after ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    throw lastError || new APIError('Request failed after retries', 0, 'unknown', false)
  }

  /**
   * Send a chat message to Claude through secure backend
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  /**
   * Execute a complete workflow through the backend
   */
  async executeWorkflow(request: WorkflowExecutionRequest): Promise<WorkflowExecutionResponse> {
    return this.request<WorkflowExecutionResponse>('/execute-workflow', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  /**
   * Send an email through the backend
   */
  async sendEmail(request: EmailRequest): Promise<EmailResponse> {
    return this.request<EmailResponse>('/send-email', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  /**
   * Perform HubSpot CRM operations
   */
  async hubspot(request: HubSpotRequest): Promise<HubSpotResponse> {
    return this.request<HubSpotResponse>('/integrations/hubspot', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  /**
   * Quick helper to run a single AI prompt
   */
  async runPrompt(prompt: string, options?: {
    model?: ChatRequest['model']
    maxTokens?: number
    systemPrompt?: string
  }): Promise<string> {
    const response = await this.chat({
      messages: [{ role: 'user', content: prompt }],
      ...options,
    })

    if (!response.success) {
      throw new Error(response.error || 'AI request failed')
    }

    return response.output
  }

  /**
   * Check if backend APIs are configured and available
   */
  async healthCheck(): Promise<{
    chat: boolean
    email: boolean
    hubspot: boolean
  }> {
    const results = {
      chat: false,
      email: false,
      hubspot: false,
    }

    try {
      // Simple ping to chat endpoint
      await this.chat({
        messages: [{ role: 'user', content: 'ping' }],
        maxTokens: 10,
      })
      results.chat = true
    } catch {
      // Chat API not available
    }

    // Email and HubSpot checks would need their own health endpoints
    // For now, we'll assume they're available if chat is
    results.email = results.chat
    results.hubspot = results.chat

    return results
  }

  // ===============================
  // Admin API Methods
  // ===============================

  /**
   * Vercel admin operations
   */
  async vercelAdmin(request: VercelAdminRequest): Promise<VercelAdminResponse> {
    return this.request<VercelAdminResponse>('/admin/vercel', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  /**
   * Supabase admin operations
   */
  async supabaseAdmin(request: SupabaseAdminRequest): Promise<SupabaseAdminResponse> {
    return this.request<SupabaseAdminResponse>('/admin/supabase', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  /**
   * Get Vercel deployments
   */
  async getDeployments(): Promise<any[]> {
    const response = await this.vercelAdmin({ action: 'getDeployments' })
    return response.result?.deployments || []
  }

  /**
   * Trigger a redeploy
   */
  async redeploy(deploymentId: string): Promise<any> {
    return this.vercelAdmin({
      action: 'redeploy',
      deploymentId,
      target: 'production',
    })
  }

  /**
   * Get environment variables
   */
  async getEnvVars(): Promise<any[]> {
    const response = await this.vercelAdmin({ action: 'getEnvVars' })
    return response.result?.envs || []
  }

  /**
   * Set an environment variable
   */
  async setEnvVar(key: string, value: string): Promise<any> {
    return this.vercelAdmin({
      action: 'setEnvVar',
      envKey: key,
      envValue: value,
    })
  }

  /**
   * Get Supabase tables
   */
  async getTables(): Promise<any[]> {
    const response = await this.supabaseAdmin({ action: 'getTables' })
    return Array.isArray(response.result) ? response.result : []
  }

  /**
   * Run SQL query
   */
  async runSql(sql: string): Promise<SupabaseAdminResponse> {
    return this.supabaseAdmin({ action: 'runSql', sql })
  }

  /**
   * Get list of available Nexus agents
   */
  async getAgents(): Promise<{ success: boolean; agents: NexusAgent[] }> {
    return this.request<{ success: boolean; agents: NexusAgent[] }>('/chat/agents', {
      method: 'GET',
    })
  }

  /**
   * Send email through integrations API
   */
  async sendEmailViaIntegrations(request: EmailRequest): Promise<EmailResponse> {
    return this.request<EmailResponse>('/integrations/email', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  /**
   * Extract YouTube video info
   */
  async extractYouTube(url: string): Promise<{
    success: boolean
    video?: {
      videoId: string
      title?: string
      author?: string
      thumbnail?: string
    }
    error?: string
  }> {
    return this.request<any>('/integrations/youtube', {
      method: 'POST',
      body: JSON.stringify({ url }),
    })
  }

  // ===============================
  // Nexus Workflow Methods
  // ===============================

  /**
   * Create a new Nexus workflow
   */
  async createNexusWorkflow(request: {
    name: string
    description: string
    workflow_definition: Record<string, unknown>
    autonomyLevel?: 'supervised' | 'semi' | 'autonomous' | 'ultimate'
  }): Promise<{
    success: boolean
    data?: { id: string; status: string }
    error?: string
  }> {
    return this.request('/workflows', {
      method: 'POST',
      body: JSON.stringify({
        ...request,
        status: 'draft'
      }),
    })
  }

  /**
   * Start Nexus workflow planning stage
   */
  async startNexusWorkflow(workflowId: string): Promise<{
    success: boolean
    data?: { stage: string; tasks: unknown[] }
    error?: string
  }> {
    return this.request(`/workflows/${workflowId}/start`, {
      method: 'POST',
    })
  }

  /**
   * Approve Nexus workflow plan
   */
  async approveNexusWorkflow(workflowId: string): Promise<{
    success: boolean
    data?: { status: string }
    error?: string
  }> {
    return this.request(`/workflows/${workflowId}/approve`, {
      method: 'POST',
    })
  }

  /**
   * Execute Nexus workflow
   */
  async executeNexusWorkflow(workflowId: string, options?: {
    autonomyLevel?: 'supervised' | 'semi' | 'autonomous' | 'ultimate'
  }): Promise<{
    success: boolean
    data?: { status: string; executionId: string }
    error?: string
  }> {
    return this.request(`/workflows/${workflowId}/execute`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    })
  }

  /**
   * Execute Nexus workflow with multi-agent coordination
   */
  async executeNexusWorkflowCoordinated(workflowId: string, options?: {
    autonomyLevel?: 'supervised' | 'semi' | 'autonomous' | 'ultimate'
  }): Promise<{
    success: boolean
    data?: { status: string; agents: unknown[]; executionId: string }
    error?: string
  }> {
    return this.request(`/workflows/${workflowId}/execute-coordinated`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    })
  }

  /**
   * Get Nexus workflow status
   */
  async getNexusWorkflowStatus(workflowId: string): Promise<{
    success: boolean
    data?: {
      id: string
      name: string
      status: string
      stage: string
      totalTokensUsed: number
      totalCostUsd: number
      nodes: unknown[]
      checkpoints: unknown[]
    }
    error?: string
  }> {
    return this.request(`/workflows/${workflowId}`, {
      method: 'GET',
    })
  }

  /**
   * Get all user workflows
   */
  async listNexusWorkflows(): Promise<{
    success: boolean
    data?: Array<{
      id: string
      name: string
      status: string
      created_at: string
      updated_at: string
    }>
    error?: string
  }> {
    return this.request('/workflows', {
      method: 'GET',
    })
  }

  /**
   * Recover Nexus workflow from checkpoint
   */
  async recoverNexusWorkflow(workflowId: string, checkpointName?: string): Promise<{
    success: boolean
    data?: { status: string; recoveredFrom: string }
    error?: string
  }> {
    return this.request(`/workflows/${workflowId}/recover`, {
      method: 'POST',
      body: JSON.stringify({ checkpointName }),
    })
  }

  /**
   * Request a secure SSE ticket for real-time updates
   *
   * SECURITY: This method replaces the deprecated getSSEConnectionUrl which
   * exposed tokens in URLs. The ticket system uses:
   * 1. Short-lived tickets (60 seconds)
   * 2. Single-use (invalidated after connection)
   * 3. Cryptographically secure random tokens
   *
   * @returns A ticket that can be used in the SSE URL
   */
  async getSSETicket(workflowId: string, userId?: string): Promise<{
    success: boolean
    ticket?: string
    expiresIn?: number
    error?: string
  }> {
    return this.request('/sse/ticket', {
      method: 'POST',
      body: JSON.stringify({ workflowId }),
      headers: userId ? { 'X-Clerk-User-Id': userId } : {},
    })
  }

  /**
   * Get secure SSE connection URL using ticket-based authentication
   *
   * @param workflowId - The workflow to subscribe to
   * @param ticket - The ticket obtained from getSSETicket()
   * @returns URL for EventSource connection (no sensitive tokens exposed)
   */
  getSecureSSEConnectionUrl(workflowId: string, ticket: string): string {
    return `${this.baseUrl}/api/sse/workflow/${workflowId}?ticket=${ticket}`
  }

  /**
   * @deprecated Use getSSETicket() + getSecureSSEConnectionUrl() instead.
   * This method exposes tokens in URLs which leak to browser history,
   * server logs, and referrer headers.
   */
  getSSEConnectionUrl(workflowId: string, _token: string, _userId: string): string {
    console.warn(
      '[DEPRECATION WARNING] getSSEConnectionUrl is deprecated and insecure. ' +
      'Use getSSETicket() + getSecureSSEConnectionUrl() instead.'
    )
    // Return URL without token for safety - will require ticket authentication
    return `${this.baseUrl}/api/sse/workflow/${workflowId}`
  }

  // ===============================
  // Cached API Methods
  // ===============================

  /**
   * Get list of available Nexus agents (cached - 1 hour TTL)
   * Agents rarely change, so we cache aggressively
   */
  async getAgentsCached(options?: { forceRefresh?: boolean }): Promise<{ success: boolean; agents: NexusAgent[] }> {
    const cacheKey = `${CacheKeys.AGENTS}list`
    return apiCache.fetch(
      cacheKey,
      () => this.getAgents(),
      {
        ttl: CacheTTL.EXTENDED,
        staleTime: StaleTime.LONG,
        forceRefresh: options?.forceRefresh
      }
    )
  }

  /**
   * Get all user workflows (cached - 5 min TTL with stale-while-revalidate)
   */
  async listNexusWorkflowsCached(options?: { forceRefresh?: boolean }): Promise<{
    data: { success: boolean; data?: Array<{ id: string; name: string; status: string; created_at: string; updated_at: string }>; error?: string };
    fromCache: boolean;
    isStale: boolean;
  }> {
    const cacheKey = `${CacheKeys.WORKFLOWS}list`
    return apiCache.fetchWithSWR(
      cacheKey,
      () => this.listNexusWorkflows(),
      {
        ttl: CacheTTL.MEDIUM,
        staleTime: StaleTime.SHORT,
        forceRefresh: options?.forceRefresh
      }
    )
  }

  /**
   * Get Nexus workflow status (cached - 1 min TTL for active tracking)
   */
  async getNexusWorkflowStatusCached(workflowId: string, options?: { forceRefresh?: boolean }): Promise<{
    success: boolean
    data?: {
      id: string
      name: string
      status: string
      stage: string
      totalTokensUsed: number
      totalCostUsd: number
      nodes: unknown[]
      checkpoints: unknown[]
    }
    error?: string
  }> {
    const cacheKey = `${CacheKeys.WORKFLOWS}status:${workflowId}`
    return apiCache.fetch(
      cacheKey,
      () => this.getNexusWorkflowStatus(workflowId),
      {
        ttl: CacheTTL.SHORT,
        staleTime: StaleTime.VERY_SHORT,
        forceRefresh: options?.forceRefresh
      }
    )
  }

  /**
   * Get workflow templates (cached - 15 min TTL)
   * Templates are relatively static, can cache longer
   */
  async getTemplatesCached<T>(
    fetcher: () => Promise<T>,
    templateType?: string,
    options?: { forceRefresh?: boolean }
  ): Promise<T> {
    const cacheKey = createCacheKey(`${CacheKeys.TEMPLATES}list`, { type: templateType })
    return apiCache.fetch(
      cacheKey,
      fetcher,
      {
        ttl: CacheTTL.LONG,
        staleTime: StaleTime.MEDIUM,
        forceRefresh: options?.forceRefresh
      }
    )
  }

  /**
   * Get user profile (cached - 10 min TTL)
   */
  async getUserProfileCached<T>(
    userId: string,
    fetcher: () => Promise<T>,
    options?: { forceRefresh?: boolean }
  ): Promise<T> {
    const cacheKey = `${CacheKeys.USER_PROFILE}${userId}`
    return apiCache.fetch(
      cacheKey,
      fetcher,
      {
        ttl: CacheTTL.MEDIUM * 2, // 10 minutes
        staleTime: StaleTime.MEDIUM,
        forceRefresh: options?.forceRefresh
      }
    )
  }

  /**
   * Get integrations list (cached - 15 min TTL)
   */
  async getIntegrationsCached<T>(
    fetcher: () => Promise<T>,
    options?: { forceRefresh?: boolean }
  ): Promise<T> {
    const cacheKey = `${CacheKeys.INTEGRATIONS}list`
    return apiCache.fetch(
      cacheKey,
      fetcher,
      {
        ttl: CacheTTL.LONG,
        staleTime: StaleTime.MEDIUM,
        forceRefresh: options?.forceRefresh
      }
    )
  }

  /**
   * Get tool catalog (cached - 1 hour TTL)
   * Tool definitions are very static
   */
  async getToolsCached<T>(
    fetcher: () => Promise<T>,
    category?: string,
    options?: { forceRefresh?: boolean }
  ): Promise<T> {
    const cacheKey = createCacheKey(`${CacheKeys.TOOLS}list`, { category })
    return apiCache.fetch(
      cacheKey,
      fetcher,
      {
        ttl: CacheTTL.EXTENDED,
        staleTime: StaleTime.LONG,
        forceRefresh: options?.forceRefresh
      }
    )
  }

  // ===============================
  // Workflow Command Execution
  // ===============================

  /**
   * Execute a natural language command through the workflow orchestrator
   *
   * This connects the chat interface to the actual workflow execution engine.
   * User says "Send email to X" → This actually sends the email.
   *
   * @param request - Command execution request
   * @returns Orchestrator session with execution results
   */
  async executeCommand(request: {
    command: string
    userId?: string
    autoExecute?: boolean
    skipClarification?: boolean
  }): Promise<{
    success: boolean
    session?: {
      id: string
      status: string
      intent?: unknown
      workflow?: unknown
      execution?: unknown
      isSimpleTask?: boolean
      simpleTaskConfirmation?: unknown
      messages: string[]
    }
    error?: string
  }> {
    return this.request('/execute-command', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  // ===============================
  // Cache Invalidation Methods
  // ===============================

  /**
   * Invalidate workflow caches after mutations
   * Call after creating, updating, or deleting workflows
   */
  invalidateWorkflows(): void {
    invalidateWorkflowCache()
  }

  /**
   * Invalidate a specific workflow's cache
   */
  invalidateWorkflow(workflowId: string): void {
    apiCache.invalidate(`${CacheKeys.WORKFLOWS}status:${workflowId}`)
    apiCache.invalidate(`${CacheKeys.WORKFLOWS}list`)
  }

  /**
   * Invalidate user-related caches
   * Call on logout
   */
  invalidateUserCaches(): void {
    invalidateUserCache()
  }

  /**
   * Invalidate template caches
   */
  invalidateTemplates(): void {
    invalidateTemplateCache()
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    apiCache.clear()
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats() {
    return apiCache.getStats()
  }
}

// Export singleton instance
export const apiClient = new APIClient()

// Export types for use in components
export type {
  ChatRequest,
  ChatResponse,
  WorkflowStep,
  WorkflowExecutionRequest,
  WorkflowExecutionResponse,
  EmailRequest,
  EmailResponse,
  HubSpotRequest,
  HubSpotResponse,
  VercelAdminRequest,
  VercelAdminResponse,
  SupabaseAdminRequest,
  SupabaseAdminResponse,
}
