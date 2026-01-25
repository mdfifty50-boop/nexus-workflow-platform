/**
 * Composio Mock - Mock implementations for E2E workflow testing
 *
 * This file provides mocks for:
 * - Composio tool execution
 * - Connection checking
 * - OAuth flow simulation
 */

import { vi } from 'vitest'

// ============================================================================
// Types
// ============================================================================

export interface MockToolResult {
  success: boolean
  data?: unknown
  error?: string
  executionTimeMs: number
}

export interface MockConnectionStatus {
  connected: boolean
  authUrl?: string
  lastChecked?: string
}

export interface MockOAuthResult {
  success: boolean
  accessToken?: string
  refreshToken?: string
  expiresAt?: string
  error?: string
}

// ============================================================================
// Mock Data
// ============================================================================

export const MOCK_TOOL_RESPONSES: Record<string, MockToolResult> = {
  // Gmail tools
  GMAIL_SEND_EMAIL: {
    success: true,
    data: {
      messageId: 'msg_123abc',
      threadId: 'thread_456def',
      labelIds: ['SENT'],
    },
    executionTimeMs: 450,
  },
  GMAIL_FETCH_EMAILS: {
    success: true,
    data: {
      messages: [
        {
          id: 'msg_001',
          threadId: 'thread_001',
          subject: 'Meeting Tomorrow',
          from: 'alice@example.com',
          date: new Date().toISOString(),
          snippet: 'Just confirming our meeting for tomorrow at 3pm.',
          isUnread: true,
        },
        {
          id: 'msg_002',
          threadId: 'thread_002',
          subject: 'Project Update',
          from: 'bob@example.com',
          date: new Date().toISOString(),
          snippet: 'Here is the latest update on the project.',
          isUnread: true,
        },
      ],
      resultSizeEstimate: 2,
    },
    executionTimeMs: 320,
  },

  // Google Calendar tools
  GOOGLECALENDAR_CREATE_EVENT: {
    success: true,
    data: {
      eventId: 'evt_789ghi',
      htmlLink: 'https://calendar.google.com/event?eid=evt_789ghi',
      status: 'confirmed',
      start: { dateTime: new Date().toISOString() },
      end: { dateTime: new Date(Date.now() + 3600000).toISOString() },
    },
    executionTimeMs: 380,
  },
  GOOGLECALENDAR_GET_EVENTS: {
    success: true,
    data: {
      events: [
        {
          id: 'evt_existing_1',
          summary: 'Team Standup',
          start: { dateTime: new Date().toISOString() },
          end: { dateTime: new Date(Date.now() + 1800000).toISOString() },
        },
      ],
    },
    executionTimeMs: 250,
  },

  // Slack tools
  SLACK_SEND_MESSAGE: {
    success: true,
    data: {
      ok: true,
      channel: 'C1234567890',
      ts: '1234567890.123456',
      message: {
        text: 'Message sent successfully',
        user: 'U1234567890',
        ts: '1234567890.123456',
      },
    },
    executionTimeMs: 280,
  },

  // GitHub tools
  GITHUB_CREATE_ISSUE: {
    success: true,
    data: {
      id: 12345,
      number: 42,
      title: 'New Issue',
      html_url: 'https://github.com/owner/repo/issues/42',
      state: 'open',
    },
    executionTimeMs: 420,
  },

  // Notion tools
  NOTION_CREATE_PAGE: {
    success: true,
    data: {
      id: 'page_abc123',
      url: 'https://notion.so/page_abc123',
      created_time: new Date().toISOString(),
    },
    executionTimeMs: 350,
  },
}

export const MOCK_CONNECTION_STATUS: Record<string, MockConnectionStatus> = {
  gmail: { connected: true, lastChecked: new Date().toISOString() },
  googlecalendar: { connected: true, lastChecked: new Date().toISOString() },
  slack: { connected: true, lastChecked: new Date().toISOString() },
  github: { connected: true, lastChecked: new Date().toISOString() },
  notion: { connected: false, authUrl: 'https://api.notion.com/v1/oauth/authorize?...' },
}

// ============================================================================
// Mock Factory Functions
// ============================================================================

/**
 * Create a mock ComposioClient
 */
export function createMockComposioClient() {
  const mockClient = {
    // Track if initialized
    initialized: false,
    isDemoMode: false,
    lastError: null as { code: string; message: string; isRetryable: boolean; suggestedAction?: string } | null,

    // Initialize
    initialize: vi.fn().mockResolvedValue(undefined),

    // Check connection
    checkConnection: vi.fn().mockImplementation((toolkit: string) => {
      const status = MOCK_CONNECTION_STATUS[toolkit.toLowerCase()]
      return Promise.resolve({
        connected: status?.connected ?? false,
        authUrl: status?.authUrl,
      })
    }),

    // Execute tool
    executeTool: vi.fn().mockImplementation((toolSlug: string, _inputs: Record<string, unknown>) => {
      const response = MOCK_TOOL_RESPONSES[toolSlug]
      if (response) {
        return Promise.resolve(response)
      }
      return Promise.resolve({
        success: false,
        error: `Unknown tool: ${toolSlug}`,
        executionTimeMs: 50,
      })
    }),

    // Execute tool for user
    executeToolForUser: vi.fn().mockImplementation((_userId: string, toolSlug: string, _inputs: Record<string, unknown>) => {
      const response = MOCK_TOOL_RESPONSES[toolSlug]
      if (response) {
        return Promise.resolve(response)
      }
      return Promise.resolve({
        success: false,
        error: `Unknown tool: ${toolSlug}`,
        executionTimeMs: 50,
      })
    }),

    // Initiate connection
    initiateConnection: vi.fn().mockImplementation((toolkit: string) => {
      return Promise.resolve({
        authUrl: `https://oauth.composio.dev/${toolkit}/authorize?state=test`,
      })
    }),
  }

  return mockClient
}

/**
 * Create a mock ComposioExecutor
 */
export function createMockComposioExecutor() {
  const mockExecutor = {
    initialized: false,
    isDemoMode: false,
    lastError: null,

    initialize: vi.fn().mockResolvedValue(undefined),

    checkConnections: vi.fn().mockImplementation((workflow: { actions: Array<{ tool?: string; toolkit?: string }> }) => {
      const missingConnections: string[] = []
      const authUrls: Record<string, string> = {}

      for (const action of workflow.actions || []) {
        const toolkit = action.toolkit || ''
        const status = MOCK_CONNECTION_STATUS[toolkit.toLowerCase()]
        if (status && !status.connected) {
          missingConnections.push(toolkit)
          if (status.authUrl) {
            authUrls[toolkit] = status.authUrl
          }
        }
      }

      return Promise.resolve({
        connected: missingConnections.length === 0,
        missingConnections,
        authUrls,
      })
    }),

    executeTool: vi.fn().mockImplementation((config: { tool: string; toolkit: string; inputs: Record<string, unknown> }) => {
      const response = MOCK_TOOL_RESPONSES[config.tool]
      if (response) {
        return Promise.resolve({
          ...response,
          toolSlug: config.tool,
        })
      }
      return Promise.resolve({
        success: false,
        error: `Unknown tool: ${config.tool}`,
        errorCode: 'UNKNOWN_TOOL',
        isRetryable: false,
        toolSlug: config.tool,
        executionTimeMs: 50,
      })
    }),

    executeAction: vi.fn().mockImplementation((action: { tool: string; toolkit: string; inputs: Record<string, unknown> }) => {
      return mockExecutor.executeTool({
        tool: action.tool,
        toolkit: action.toolkit,
        inputs: action.inputs,
      })
    }),

    executeStep: vi.fn().mockImplementation((step: { config: { composioTool?: string; tool?: string } }) => {
      const tool = step.config.composioTool || step.config.tool || ''
      const response = MOCK_TOOL_RESPONSES[tool]
      if (response) {
        return Promise.resolve({
          ...response,
          toolSlug: tool,
        })
      }
      return Promise.resolve({
        success: false,
        error: `Unknown tool: ${tool}`,
        toolSlug: tool,
        executionTimeMs: 50,
      })
    }),

    executeWorkflow: vi.fn().mockImplementation((workflow: { actions: Array<{ id: string; tool: string; toolkit: string; inputs: Record<string, unknown> }> }) => {
      const results: Array<{ actionId: string; result: MockToolResult & { toolSlug: string } }> = []
      const context: Record<string, unknown> = {}

      for (const action of workflow.actions || []) {
        const response = MOCK_TOOL_RESPONSES[action.tool]
        if (response) {
          results.push({
            actionId: action.id,
            result: { ...response, toolSlug: action.tool },
          })

          // Stop workflow on failure
          if (!response.success) {
            return Promise.resolve({
              success: false,
              results,
              context,
              totalExecutionTimeMs: results.reduce((sum, r) => sum + r.result.executionTimeMs, 0),
            })
          }

          context[action.id] = response.data
        } else {
          // Unknown tool - fail
          results.push({
            actionId: action.id,
            result: {
              success: false,
              error: `Unknown tool: ${action.tool}`,
              executionTimeMs: 50,
              toolSlug: action.tool,
            },
          })
          return Promise.resolve({
            success: false,
            results,
            context,
            totalExecutionTimeMs: results.reduce((sum, r) => sum + r.result.executionTimeMs, 0),
          })
        }
      }

      return Promise.resolve({
        success: true,
        results,
        context,
        totalExecutionTimeMs: results.reduce((sum, r) => sum + r.result.executionTimeMs, 0),
      })
    }),

    initiateConnection: vi.fn().mockImplementation((toolkit: string) => {
      return Promise.resolve({
        authUrl: `https://oauth.composio.dev/${toolkit}/authorize?state=test`,
      })
    }),

    clearConnectionCache: vi.fn(),
  }

  return mockExecutor
}

/**
 * Create a mock API client for intent parsing
 */
export function createMockApiClient() {
  return {
    chat: vi.fn().mockImplementation(({ messages }: { messages: Array<{ role: string; content: string }> }) => {
      const input = messages[0]?.content || ''

      // Simulate AI parsing response
      if (input.toLowerCase().includes('email')) {
        return Promise.resolve({
          success: true,
          output: JSON.stringify({
            category: 'communication',
            action: 'send',
            entities: [
              { type: 'person', value: 'john@example.com', confidence: 0.95 },
            ],
            urgency: 'immediate',
            constraints: [],
            missingInfo: [],
          }),
        })
      }

      if (input.toLowerCase().includes('task') || input.toLowerCase().includes('project')) {
        return Promise.resolve({
          success: true,
          output: JSON.stringify({
            category: 'productivity',
            action: 'create',
            entities: [
              { type: 'product', value: 'review documentation', confidence: 0.85 },
            ],
            urgency: 'flexible',
            constraints: [],
            missingInfo: [],
          }),
        })
      }

      if (input.toLowerCase().includes('meeting') || input.toLowerCase().includes('schedule')) {
        return Promise.resolve({
          success: true,
          output: JSON.stringify({
            category: 'scheduling',
            action: 'create',
            entities: [
              { type: 'time', value: '3pm', confidence: 0.9 },
              { type: 'date', value: 'tomorrow', confidence: 0.9 },
            ],
            urgency: 'scheduled',
            constraints: [],
            missingInfo: [],
          }),
        })
      }

      if (input.toLowerCase().includes('summarize') || input.toLowerCase().includes('unread')) {
        return Promise.resolve({
          success: true,
          output: JSON.stringify({
            category: 'communication',
            action: 'summarize',
            entities: [],
            urgency: 'immediate',
            constraints: [
              { type: 'time_limit', field: 'date', operator: 'equals', value: 'today', priority: 'required' },
            ],
            missingInfo: [],
          }),
        })
      }

      // Default fallback
      return Promise.resolve({
        success: true,
        output: JSON.stringify({
          category: 'custom',
          action: 'execute',
          entities: [],
          urgency: 'flexible',
          constraints: [],
          missingInfo: [],
        }),
      })
    }),
  }
}

// ============================================================================
// Mock Setup Utilities
// ============================================================================

/**
 * Set a specific tool to return a custom response
 */
export function setMockToolResponse(toolSlug: string, response: MockToolResult): void {
  MOCK_TOOL_RESPONSES[toolSlug] = response
}

/**
 * Set a specific connection status
 */
export function setMockConnectionStatus(toolkit: string, status: MockConnectionStatus): void {
  MOCK_CONNECTION_STATUS[toolkit.toLowerCase()] = status
}

/**
 * Reset all mocks to their default state
 */
export function resetMocks(): void {
  // Reset tool responses
  Object.keys(MOCK_TOOL_RESPONSES).forEach(key => {
    delete MOCK_TOOL_RESPONSES[key]
  })

  // Restore default responses
  Object.assign(MOCK_TOOL_RESPONSES, {
    GMAIL_SEND_EMAIL: {
      success: true,
      data: { messageId: 'msg_123abc', threadId: 'thread_456def', labelIds: ['SENT'] },
      executionTimeMs: 450,
    },
    GMAIL_FETCH_EMAILS: {
      success: true,
      data: {
        messages: [
          { id: 'msg_001', subject: 'Meeting Tomorrow', from: 'alice@example.com', isUnread: true },
          { id: 'msg_002', subject: 'Project Update', from: 'bob@example.com', isUnread: true },
        ],
        resultSizeEstimate: 2,
      },
      executionTimeMs: 320,
    },
    GOOGLECALENDAR_CREATE_EVENT: {
      success: true,
      data: { eventId: 'evt_789ghi', htmlLink: 'https://calendar.google.com/event?eid=evt_789ghi', status: 'confirmed' },
      executionTimeMs: 380,
    },
    SLACK_SEND_MESSAGE: {
      success: true,
      data: { ok: true, channel: 'C1234567890', ts: '1234567890.123456' },
      executionTimeMs: 280,
    },
    GITHUB_CREATE_ISSUE: {
      success: true,
      data: { id: 12345, number: 42, title: 'New Issue', html_url: 'https://github.com/owner/repo/issues/42' },
      executionTimeMs: 420,
    },
    NOTION_CREATE_PAGE: {
      success: true,
      data: { id: 'page_abc123', url: 'https://notion.so/page_abc123' },
      executionTimeMs: 350,
    },
  })

  // Reset connection status
  Object.assign(MOCK_CONNECTION_STATUS, {
    gmail: { connected: true },
    googlecalendar: { connected: true },
    slack: { connected: true },
    github: { connected: true },
    notion: { connected: false, authUrl: 'https://api.notion.com/v1/oauth/authorize?...' },
  })
}

/**
 * Simulate a tool failure
 */
export function simulateToolFailure(toolSlug: string, errorMessage: string, _isRetryable = false): void {
  MOCK_TOOL_RESPONSES[toolSlug] = {
    success: false,
    error: errorMessage,
    executionTimeMs: 100,
  }
}

/**
 * Simulate a connection failure
 */
export function simulateConnectionFailure(toolkit: string, authUrl?: string): void {
  MOCK_CONNECTION_STATUS[toolkit.toLowerCase()] = {
    connected: false,
    authUrl: authUrl || `https://oauth.composio.dev/${toolkit}/authorize`,
  }
}

// ============================================================================
// OAuth Flow Mocks
// ============================================================================

/**
 * Simulate OAuth callback completion
 */
export function simulateOAuthCallback(toolkit: string): MockOAuthResult {
  MOCK_CONNECTION_STATUS[toolkit.toLowerCase()] = {
    connected: true,
    lastChecked: new Date().toISOString(),
  }

  return {
    success: true,
    accessToken: `access_token_${toolkit}_${Date.now()}`,
    refreshToken: `refresh_token_${toolkit}_${Date.now()}`,
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  }
}

/**
 * Simulate OAuth failure
 */
export function simulateOAuthFailure(errorMessage: string): MockOAuthResult {
  return {
    success: false,
    error: errorMessage,
  }
}
