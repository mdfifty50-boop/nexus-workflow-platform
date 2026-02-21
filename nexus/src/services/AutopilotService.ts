/**
 * AutopilotService - Frontend client for Nexus Autopilot API
 *
 * Communicates with the backend Autopilot endpoints to create, control,
 * and monitor Playwright-powered browser automation sessions.
 * Uses SSE (Server-Sent Events) for real-time progress updates.
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type AutopilotState =
  | 'idle'
  | 'planning'
  | 'executing'
  | 'credential_wait'
  | 'paused'
  | 'verifying'
  | 'complete'
  | 'error'
  | 'cancelled'

export interface AutopilotStep {
  id: string
  service: string
  action: string
  method: 'api' | 'browser'
  status: 'pending' | 'executing' | 'credential_wait' | 'complete' | 'error' | 'skipped'
  description: string
  result?: {
    success: boolean
    connectionEstablished?: boolean
    configurationApplied?: Record<string, unknown>
  }
  error?: string
  startedAt?: number
  completedAt?: number
}

export interface AutopilotSessionInfo {
  sessionId: string
  status: AutopilotState
  steps: AutopilotStep[]
  estimatedDuration: number
  requiresCredentials: string[]
}

export interface WorkflowSpec {
  name: string
  description: string
  steps: Array<{
    id: string
    name: string
    tool: string
    type: string
  }>
  requiredIntegrations: string[]
  estimatedTimeSaved?: string
}

// =============================================================================
// SSE EVENT TYPES
// =============================================================================

export interface AutopilotScreenshotEvent {
  /** Base64-encoded JPEG image */
  image: string
  /** Current step number (0-indexed) */
  step: number
  /** Human-readable description of what is shown */
  description: string
  /** Current page URL */
  url: string
  /** Unix timestamp (ms) */
  timestamp: number
}

export interface AutopilotStatusEvent {
  state: AutopilotState
  step: number
  message: string
  /** Service name when state is credential_wait */
  credentialService?: string
}

export interface AutopilotProgressEvent {
  completedSteps: number
  totalSteps: number
  currentStep: string
  /** Estimated seconds remaining */
  estimatedRemaining: number
}

export type AutopilotEventHandler = {
  onScreenshot?: (event: AutopilotScreenshotEvent) => void
  onStatus?: (event: AutopilotStatusEvent) => void
  onProgress?: (event: AutopilotProgressEvent) => void
  onComplete?: (results: unknown) => void
  onError?: (error: { step: number; error: string; fallback: string }) => void
}

// =============================================================================
// SERVICE IMPLEMENTATION
// =============================================================================

class AutopilotService {
  private baseUrl = '/api/autopilot'
  private currentSessionId: string | null = null
  private eventSource: EventSource | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 3
  private reconnectDelayMs = 2000

  /**
   * Create a new Autopilot session from a workflow specification.
   * The backend plans the steps and returns session info.
   */
  async createSession(
    workflowSpec: WorkflowSpec,
    userId?: string
  ): Promise<AutopilotSessionInfo> {
    const response = await fetch(`${this.baseUrl}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflowSpec, userId }),
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => response.statusText)
      throw new Error(`Failed to create Autopilot session: ${errorBody}`)
    }

    // Backend returns { success, session: { id, state, steps, currentStep, createdAt } }
    // Map to frontend's AutopilotSessionInfo shape
    const raw = await response.json()
    const session = raw.session || raw
    const data: AutopilotSessionInfo = {
      sessionId: session.id || session.sessionId || raw.sessionId,
      status: session.state || session.status || 'idle',
      steps: (session.steps || []).map((s: { name?: string; tool?: string; status?: string }, i: number) => ({
        index: i,
        label: s.name || s.tool || `Step ${i + 1}`,
        status: s.status || 'pending',
      })),
      estimatedDuration: session.estimatedDuration || 180,
      requiresCredentials: session.requiresCredentials || [],
    }
    this.currentSessionId = data.sessionId
    return data
  }

  /**
   * Start executing an existing Autopilot session.
   * The session must have been created first via createSession().
   */
  async startSession(sessionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${sessionId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => response.statusText)
      throw new Error(`Failed to start Autopilot session: ${errorBody}`)
    }
  }

  /**
   * Subscribe to real-time events from an Autopilot session via SSE.
   * Routes events to the provided handler callbacks.
   * Automatically reconnects on disconnect (up to 3 retries with 2s delay).
   */
  subscribe(sessionId: string, handlers: AutopilotEventHandler): void {
    // Close any existing connection first
    this.unsubscribe()
    this.reconnectAttempts = 0

    this._openEventSource(sessionId, handlers)
  }

  /**
   * Internal: opens the SSE connection and wires up event listeners.
   */
  private _openEventSource(sessionId: string, handlers: AutopilotEventHandler): void {
    const url = `${this.baseUrl}/stream/${sessionId}`
    this.eventSource = new EventSource(url)

    this.eventSource.addEventListener('screenshot', (event: MessageEvent) => {
      try {
        const data: AutopilotScreenshotEvent = JSON.parse(event.data)
        handlers.onScreenshot?.(data)
      } catch {
        // Ignore malformed screenshot events
      }
    })

    this.eventSource.addEventListener('status', (event: MessageEvent) => {
      try {
        const data: AutopilotStatusEvent = JSON.parse(event.data)
        handlers.onStatus?.(data)
      } catch {
        // Ignore malformed status events
      }
    })

    this.eventSource.addEventListener('progress', (event: MessageEvent) => {
      try {
        const data: AutopilotProgressEvent = JSON.parse(event.data)
        handlers.onProgress?.(data)
      } catch {
        // Ignore malformed progress events
      }
    })

    this.eventSource.addEventListener('complete', (event: MessageEvent) => {
      try {
        const results = JSON.parse(event.data)
        handlers.onComplete?.(results)
      } catch {
        handlers.onComplete?.(null)
      }
      // Session is done; clean up
      this.unsubscribe()
    })

    this.eventSource.addEventListener('error', (event: MessageEvent) => {
      // SSE spec: 'error' event can also be a named event sent by server
      try {
        const data = JSON.parse(event.data)
        handlers.onError?.(data)
      } catch {
        // Likely a connection-level error, not a server-sent error event
      }
    })

    // Handle connection-level errors (network disconnect, server restart)
    this.eventSource.onerror = () => {
      this.eventSource?.close()
      this.eventSource = null

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        setTimeout(() => {
          this._openEventSource(sessionId, handlers)
        }, this.reconnectDelayMs)
      } else {
        // All retries exhausted, notify via error handler
        handlers.onError?.({
          step: -1,
          error: 'Lost connection to Autopilot session after 3 retries',
          fallback: 'Check network connection and refresh the page',
        })
      }
    }
  }

  /**
   * Close the current SSE connection. Safe to call multiple times.
   */
  unsubscribe(): void {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
    this.reconnectAttempts = 0
  }

  /**
   * Pause a running Autopilot session.
   * The session can be resumed later with resume().
   */
  async pause(sessionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${sessionId}/pause`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => response.statusText)
      throw new Error(`Failed to pause Autopilot session: ${errorBody}`)
    }
  }

  /**
   * Resume a paused Autopilot session.
   */
  async resume(sessionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${sessionId}/resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => response.statusText)
      throw new Error(`Failed to resume Autopilot session: ${errorBody}`)
    }
  }

  /**
   * Cancel a running or paused Autopilot session.
   * This terminates the browser automation and cleans up resources.
   */
  async cancel(sessionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${sessionId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => response.statusText)
      throw new Error(`Failed to cancel Autopilot session: ${errorBody}`)
    }

    // Clean up SSE if subscribed to this session
    this.unsubscribe()
  }

  /**
   * Get the current status of an Autopilot session.
   */
  async getStatus(sessionId: string): Promise<{
    state: AutopilotState
    currentStep: number
    totalSteps: number
    lastScreenshot?: string
    message: string
  }> {
    const response = await fetch(`${this.baseUrl}/${sessionId}/status`)

    if (!response.ok) {
      const errorBody = await response.text().catch(() => response.statusText)
      throw new Error(`Failed to get Autopilot status: ${errorBody}`)
    }

    return await response.json()
  }

  /**
   * Get the latest screenshot from the Autopilot browser session.
   * Returns a base64-encoded JPEG string.
   */
  async getScreenshot(sessionId: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${sessionId}/screenshot`)

    if (!response.ok) {
      const errorBody = await response.text().catch(() => response.statusText)
      throw new Error(`Failed to get Autopilot screenshot: ${errorBody}`)
    }

    const data = await response.json()
    return data.image as string
  }

  /**
   * Get the current active session ID, if any.
   */
  getActiveSessionId(): string | null {
    return this.currentSessionId
  }

  /**
   * Check if there is an active SSE subscription.
   */
  isSubscribed(): boolean {
    return this.eventSource !== null && this.eventSource.readyState !== EventSource.CLOSED
  }
}

// Export singleton instance
export const autopilotService = new AutopilotService()
