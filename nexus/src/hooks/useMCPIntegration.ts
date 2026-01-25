/**
 * useMCPIntegration - React Hooks for MCP Server Integration
 *
 * Provides reactive access to MCP server connections:
 * - Connection management
 * - Tool discovery and execution
 * - Real-time status monitoring
 * - Cost tracking
 *
 * Story 16.7 Implementation
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { mcpServerIntegrationService } from '../services/MCPServerIntegrationService'
import type {
  MCPProvider,
  MCPServerConfig,
  MCPConnection,
  MCPConnectionState,
  MCPToolMapping,
  MCPExecutionRequest,
  MCPExecutionResult,
  MCPToolDiscoveryResult,
  MCPDiscoveredTool,
  MCPIntegrationMetrics,
  MCPAvailabilityCheck,
  MCPConnectionRequest,
  MCPConnectionResult,
  MCPServerHealth,
  MCPSession
} from '../types/tools'
import { MCP_OPERATION_MESSAGES } from '../types/tools'

// ============================================================================
// MAIN HOOK - useMCPIntegration
// ============================================================================

interface UseMCPIntegrationOptions {
  autoConnect?: boolean
  provider?: MCPProvider
  onConnectionChange?: (connection: MCPConnection) => void
  onError?: (error: Error) => void
  onCostWarning?: (cost: number, threshold: number) => void
}

interface UseMCPIntegrationReturn {
  // State
  isConnecting: boolean
  isConnected: boolean
  connection: MCPConnection | null
  error: string | null

  // Actions
  connect: (request?: MCPConnectionRequest) => Promise<MCPConnectionResult>
  disconnect: () => void
  executeTool: (request: MCPExecutionRequest) => Promise<MCPExecutionResult>
  refreshToken: () => Promise<boolean>

  // Availability
  checkAvailability: (toolId: string) => Promise<MCPAvailabilityCheck>

  // Metrics
  metrics: MCPIntegrationMetrics

  // Utilities
  clearError: () => void
}

/**
 * Main hook for MCP integration
 */
export function useMCPIntegration(options: UseMCPIntegrationOptions = {}): UseMCPIntegrationReturn {
  const {
    autoConnect = false,
    provider = 'composio',
    onConnectionChange,
    onError,
    onCostWarning
  } = options

  // State
  const [isConnecting, setIsConnecting] = useState(false)
  const [connection, setConnection] = useState<MCPConnection | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<MCPIntegrationMetrics>(
    mcpServerIntegrationService.getMetrics()
  )

  // Refs to prevent stale closures
  const connectionRef = useRef<MCPConnection | null>(null)

  // Register callbacks
  useEffect(() => {
    mcpServerIntegrationService.onConnectionChanged((conn) => {
      if (conn.provider === provider) {
        setConnection(conn)
        connectionRef.current = conn
        onConnectionChange?.(conn)
      }
    })

    if (onCostWarning) {
      mcpServerIntegrationService.onCostWarningCallback(onCostWarning)
    }
  }, [provider, onConnectionChange, onCostWarning])

  // Auto-connect if enabled
  useEffect(() => {
    if (autoConnect && !connection && !isConnecting) {
      connect({ provider })
    }
  }, [autoConnect, provider])

  // Update metrics periodically
  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(mcpServerIntegrationService.getMetrics())
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, 5000)
    return () => clearInterval(interval)
  }, [])

  /**
   * Connect to MCP server
   */
  const connect = useCallback(async (request?: MCPConnectionRequest): Promise<MCPConnectionResult> => {
    setIsConnecting(true)
    setError(null)

    try {
      const result = await mcpServerIntegrationService.connectViaMCP(
        request ?? { provider }
      )

      if (result.success && result.connection) {
        setConnection(result.connection)
        connectionRef.current = result.connection
      } else if (result.error) {
        setError(result.error.message)
        onError?.(new Error(result.error.message))
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed'
      setError(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))

      return {
        success: false,
        error: {
          code: 'CONNECTION_FAILED',
          message: errorMessage,
          isRetryable: true,
          fallbackAvailable: true
        },
        durationMs: 0
      }
    } finally {
      setIsConnecting(false)
      setMetrics(mcpServerIntegrationService.getMetrics())
    }
  }, [provider, onError])

  /**
   * Disconnect from MCP server
   */
  const disconnect = useCallback(() => {
    if (connectionRef.current) {
      mcpServerIntegrationService.closeConnection(connectionRef.current.id)
      setConnection(null)
      connectionRef.current = null
    }
  }, [])

  /**
   * Execute a tool via MCP
   */
  const executeTool = useCallback(async (request: MCPExecutionRequest): Promise<MCPExecutionResult> => {
    if (!connectionRef.current) {
      // Try to connect first
      const connectResult = await connect({ provider: request.toolMapping.provider })
      if (!connectResult.success) {
        return {
          success: false,
          requestId: '',
          toolSlug: request.toolMapping.mcpToolSlug,
          provider: request.toolMapping.provider,
          error: {
            code: 'CONNECTION_FAILED',
            message: 'Not connected to MCP server',
            isRetryable: true,
            fallbackAvailable: true
          },
          durationMs: 0,
          costUsd: 0,
          retryCount: 0,
          timestamp: new Date().toISOString()
        }
      }
    }

    try {
      const result = await mcpServerIntegrationService.executeTool(request)
      setMetrics(mcpServerIntegrationService.getMetrics())
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Execution failed'
      onError?.(err instanceof Error ? err : new Error(errorMessage))

      return {
        success: false,
        requestId: '',
        toolSlug: request.toolMapping.mcpToolSlug,
        provider: request.toolMapping.provider,
        error: {
          code: 'UNKNOWN',
          message: errorMessage,
          isRetryable: false,
          fallbackAvailable: true
        },
        durationMs: 0,
        costUsd: 0,
        retryCount: 0,
        timestamp: new Date().toISOString()
      }
    }
  }, [connect, provider, onError])

  /**
   * Refresh authentication token
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (!connectionRef.current) {
      return false
    }

    return mcpServerIntegrationService.refreshMCPToken(connectionRef.current.id)
  }, [])

  /**
   * Check tool availability
   */
  const checkAvailability = useCallback(async (toolId: string): Promise<MCPAvailabilityCheck> => {
    return mcpServerIntegrationService.checkMCPAvailability(toolId)
  }, [])

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isConnecting,
    isConnected: connection?.state === 'authenticated',
    connection,
    error,
    connect,
    disconnect,
    executeTool,
    refreshToken,
    checkAvailability,
    metrics,
    clearError
  }
}

// ============================================================================
// TOOL DISCOVERY HOOK - useMCPTools
// ============================================================================

interface UseMCPToolsOptions {
  serverId?: string
  category?: string
  autoDiscover?: boolean
}

interface UseMCPToolsReturn {
  // State
  isDiscovering: boolean
  tools: MCPDiscoveredTool[]
  error: string | null

  // Actions
  discover: (options?: { forceRefresh?: boolean; category?: string }) => Promise<MCPToolDiscoveryResult>
  searchTools: (query: string) => MCPDiscoveredTool[]
  getToolBySlug: (slug: string) => MCPDiscoveredTool | null

  // Mapping
  mapTool: (catalogToolId: string, mcpToolSlug: string, provider: MCPProvider) => MCPToolMapping
  getMapping: (catalogToolId: string) => MCPToolMapping | null
}

/**
 * Hook for MCP tool discovery
 */
export function useMCPTools(options: UseMCPToolsOptions = {}): UseMCPToolsReturn {
  const {
    serverId = 'composio-default',
    category,
    autoDiscover = false
  } = options

  // State
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [tools, setTools] = useState<MCPDiscoveredTool[]>([])
  const [error, setError] = useState<string | null>(null)

  // Refs
  const hasDiscoveredRef = useRef(false)

  // Auto-discover on mount
  useEffect(() => {
    if (autoDiscover && !hasDiscoveredRef.current) {
      hasDiscoveredRef.current = true
      discover()
    }
  }, [autoDiscover])

  /**
   * Discover tools from MCP server
   */
  const discover = useCallback(async (
    opts?: { forceRefresh?: boolean; category?: string }
  ): Promise<MCPToolDiscoveryResult> => {
    setIsDiscovering(true)
    setError(null)

    try {
      const result = await mcpServerIntegrationService.discoverMCPTools(serverId, {
        forceRefresh: opts?.forceRefresh,
        category: opts?.category ?? category
      })

      setTools(result.tools)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Discovery failed'
      setError(errorMessage)

      return {
        provider: 'composio',
        serverId,
        tools: [],
        totalCount: 0,
        discoveredAt: new Date().toISOString()
      }
    } finally {
      setIsDiscovering(false)
    }
  }, [serverId, category])

  /**
   * Search tools by query
   */
  const searchTools = useCallback((query: string): MCPDiscoveredTool[] => {
    const lowerQuery = query.toLowerCase()
    return tools.filter(tool =>
      tool.slug.toLowerCase().includes(lowerQuery) ||
      tool.name.toLowerCase().includes(lowerQuery) ||
      tool.description.toLowerCase().includes(lowerQuery) ||
      tool.category.toLowerCase().includes(lowerQuery)
    )
  }, [tools])

  /**
   * Get tool by slug
   */
  const getToolBySlug = useCallback((slug: string): MCPDiscoveredTool | null => {
    return tools.find(t => t.slug === slug) ?? null
  }, [tools])

  /**
   * Map a catalog tool to MCP tool
   */
  const mapTool = useCallback((
    catalogToolId: string,
    mcpToolSlug: string,
    provider: MCPProvider
  ): MCPToolMapping => {
    return mcpServerIntegrationService.mapToolToMCP(catalogToolId, mcpToolSlug, provider)
  }, [])

  /**
   * Get existing mapping
   */
  const getMapping = useCallback((catalogToolId: string): MCPToolMapping | null => {
    return mcpServerIntegrationService.getToolMapping(catalogToolId)
  }, [])

  return {
    isDiscovering,
    tools,
    error,
    discover,
    searchTools,
    getToolBySlug,
    mapTool,
    getMapping
  }
}

// ============================================================================
// CONNECTION STATUS HOOK - useMCPConnectionStatus
// ============================================================================

interface UseMCPConnectionStatusReturn {
  // State
  state: MCPConnectionState
  isConnected: boolean
  isConnecting: boolean
  isError: boolean

  // Connection info
  connectionId: string | null
  provider: MCPProvider | null
  connectedAt: string | null
  expiresAt: string | null

  // Metrics
  requestCount: number
  errorCount: number
  avgLatencyMs: number
  totalCostUsd: number

  // Token state
  needsRefresh: boolean
  lastRefreshed: string | null

  // Status message
  statusMessage: string
  statusColor: string
}

/**
 * Hook for monitoring MCP connection status
 */
export function useMCPConnectionStatus(connectionId: string | null): UseMCPConnectionStatusReturn {
  const [state, setState] = useState<MCPConnectionState>('disconnected')
  const [connection, setConnection] = useState<MCPConnection | null>(null)

  useEffect(() => {
    if (!connectionId) {
      setState('disconnected')
      setConnection(null)
      return
    }

    const updateStatus = () => {
      const conn = mcpServerIntegrationService.getConnection(connectionId)
      if (conn) {
        setState(conn.state)
        setConnection(conn)
      } else {
        setState('disconnected')
        setConnection(null)
      }
    }

    updateStatus()
    const interval = setInterval(updateStatus, 2000)
    return () => clearInterval(interval)
  }, [connectionId])

  const getStatusMessage = (): string => {
    if (!connection) return 'Disconnected'

    switch (state) {
      case 'connecting':
        return MCP_OPERATION_MESSAGES.connecting[connection.provider]
      case 'connected':
      case 'authenticated':
        return MCP_OPERATION_MESSAGES.connected[connection.provider]
      case 'error':
        return 'Connection error'
      case 'rate_limited':
        return 'Rate limited - waiting...'
      default:
        return 'Disconnected'
    }
  }

  const getStatusColor = (): string => {
    switch (state) {
      case 'authenticated':
        return 'green'
      case 'connected':
        return 'blue'
      case 'connecting':
        return 'yellow'
      case 'rate_limited':
        return 'orange'
      case 'error':
        return 'red'
      default:
        return 'gray'
    }
  }

  return {
    state,
    isConnected: state === 'authenticated' || state === 'connected',
    isConnecting: state === 'connecting',
    isError: state === 'error',
    connectionId,
    provider: connection?.provider ?? null,
    connectedAt: connection?.connectedAt ?? null,
    expiresAt: connection?.expiresAt ?? null,
    requestCount: connection?.requestCount ?? 0,
    errorCount: connection?.errorCount ?? 0,
    avgLatencyMs: connection?.avgLatencyMs ?? 0,
    totalCostUsd: connection?.totalCostUsd ?? 0,
    needsRefresh: connection?.authState.needsRefresh ?? false,
    lastRefreshed: connection?.authState.lastRefreshed ?? null,
    statusMessage: getStatusMessage(),
    statusColor: getStatusColor()
  }
}

// ============================================================================
// SERVER HEALTH HOOK - useMCPServerHealth
// ============================================================================

interface UseMCPServerHealthOptions {
  autoCheck?: boolean
  checkInterval?: number // ms
}

interface UseMCPServerHealthReturn {
  // State
  isChecking: boolean
  health: MCPServerHealth | null
  isHealthy: boolean

  // Actions
  checkHealth: () => Promise<MCPServerHealth>

  // Helpers
  getHealthColor: () => string
  getHealthLabel: () => string
}

/**
 * Hook for monitoring MCP server health
 */
export function useMCPServerHealth(
  serverId: string,
  options: UseMCPServerHealthOptions = {}
): UseMCPServerHealthReturn {
  const { autoCheck = true, checkInterval = 30000 } = options

  const [isChecking, setIsChecking] = useState(false)
  const [health, setHealth] = useState<MCPServerHealth | null>(null)

  const checkHealth = useCallback(async (): Promise<MCPServerHealth> => {
    setIsChecking(true)

    try {
      const result = await mcpServerIntegrationService.checkServerHealth(serverId)
      setHealth(result)
      return result
    } finally {
      setIsChecking(false)
    }
  }, [serverId])

  // Auto-check on mount and at interval
  useEffect(() => {
    if (!autoCheck) return

    checkHealth()

    const interval = setInterval(checkHealth, checkInterval)
    return () => clearInterval(interval)
  }, [autoCheck, checkInterval, checkHealth])

  const getHealthColor = useCallback((): string => {
    if (!health) return 'gray'
    if (health.isHealthy && health.responseTimeMs < 500) return 'green'
    if (health.isHealthy) return 'yellow'
    return 'red'
  }, [health])

  const getHealthLabel = useCallback((): string => {
    if (!health) return 'Unknown'
    if (health.isHealthy && health.responseTimeMs < 500) return 'Healthy'
    if (health.isHealthy) return 'Slow'
    return 'Unhealthy'
  }, [health])

  return {
    isChecking,
    health,
    isHealthy: health?.isHealthy ?? false,
    checkHealth,
    getHealthColor,
    getHealthLabel
  }
}

// ============================================================================
// MCP METRICS HOOK - useMCPMetrics
// ============================================================================

interface UseMCPMetricsReturn {
  metrics: MCPIntegrationMetrics

  // Computed values
  successRate: number
  avgCostPerExecution: number
  isCostEfficient: boolean // Under $0.25 per connection (NFR-16.4.2)

  // By provider
  getProviderMetrics: (provider: MCPProvider) => {
    executions: number
    cost: number
  }

  // Actions
  resetMetrics: () => void
}

/**
 * Hook for tracking MCP integration metrics
 */
export function useMCPMetrics(): UseMCPMetricsReturn {
  const [metrics, setMetrics] = useState<MCPIntegrationMetrics>(
    mcpServerIntegrationService.getMetrics()
  )

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(mcpServerIntegrationService.getMetrics())
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, 5000)
    return () => clearInterval(interval)
  }, [])

  const successRate = metrics.totalExecutions > 0
    ? metrics.successfulExecutions / metrics.totalExecutions
    : 0

  const avgCostPerExecution = metrics.totalExecutions > 0
    ? metrics.totalCostUsd / metrics.totalExecutions
    : 0

  // NFR-16.4.2: $0.25 max per connection
  const isCostEfficient = metrics.avgCostPerConnection <= 0.25

  const getProviderMetrics = useCallback((provider: MCPProvider) => {
    return {
      executions: metrics.toolsExecuted, // Simplified - in real impl would track per provider
      cost: metrics.costByProvider[provider]
    }
  }, [metrics])

  const resetMetrics = useCallback(() => {
    mcpServerIntegrationService.resetMetrics()
    setMetrics(mcpServerIntegrationService.getMetrics())
  }, [])

  return {
    metrics,
    successRate,
    avgCostPerExecution,
    isCostEfficient,
    getProviderMetrics,
    resetMetrics
  }
}

// ============================================================================
// MCP SESSION HOOK - useMCPSession
// ============================================================================

interface UseMCPSessionOptions {
  connectionId: string
  autoCreate?: boolean
}

interface UseMCPSessionReturn {
  // State
  session: MCPSession | null
  isActive: boolean

  // Actions
  createSession: () => MCPSession
  addResult: (result: MCPExecutionResult) => void
  endSession: () => void

  // Session info
  operationCount: number
  sessionCostUsd: number
  results: MCPExecutionResult[]
}

/**
 * Hook for managing MCP sessions
 */
export function useMCPSession(options: UseMCPSessionOptions): UseMCPSessionReturn {
  const { connectionId, autoCreate = false } = options

  const [session, setSession] = useState<MCPSession | null>(null)

  // Auto-create session
  useEffect(() => {
    if (autoCreate && connectionId && !session) {
      const newSession = mcpServerIntegrationService.createSession(connectionId)
      setSession(newSession)
    }
  }, [autoCreate, connectionId])

  const createSession = useCallback((): MCPSession => {
    const newSession = mcpServerIntegrationService.createSession(connectionId)
    setSession(newSession)
    return newSession
  }, [connectionId])

  const addResult = useCallback((result: MCPExecutionResult) => {
    if (session) {
      mcpServerIntegrationService.addSessionResult(session.id, result)
      setSession(mcpServerIntegrationService.getSession(session.id))
    }
  }, [session])

  const endSession = useCallback(() => {
    if (session) {
      mcpServerIntegrationService.endSession(session.id)
      setSession(prev => prev ? { ...prev, isActive: false } : null)
    }
  }, [session])

  return {
    session,
    isActive: session?.isActive ?? false,
    createSession,
    addResult,
    endSession,
    operationCount: session?.operationCount ?? 0,
    sessionCostUsd: session?.sessionCostUsd ?? 0,
    results: session?.results ?? []
  }
}

// ============================================================================
// SERVERS HOOK - useMCPServers
// ============================================================================

interface UseMCPServersReturn {
  servers: MCPServerConfig[]
  getServer: (serverId: string) => MCPServerConfig | null
  getServersByProvider: (provider: MCPProvider) => MCPServerConfig[]
  addServer: (config: MCPServerConfig) => void
  removeServer: (serverId: string) => void
}

/**
 * Hook for managing MCP server configurations
 */
export function useMCPServers(): UseMCPServersReturn {
  const [servers, setServers] = useState<MCPServerConfig[]>(
    mcpServerIntegrationService.getServers()
  )

  const getServer = useCallback((serverId: string): MCPServerConfig | null => {
    return mcpServerIntegrationService.getServer(serverId)
  }, [])

  const getServersByProvider = useCallback((provider: MCPProvider): MCPServerConfig[] => {
    return mcpServerIntegrationService.getServersByProvider(provider)
  }, [])

  const addServer = useCallback((config: MCPServerConfig) => {
    mcpServerIntegrationService.addServer(config)
    setServers(mcpServerIntegrationService.getServers())
  }, [])

  const removeServer = useCallback((serverId: string) => {
    mcpServerIntegrationService.removeServer(serverId)
    setServers(mcpServerIntegrationService.getServers())
  }, [])

  return {
    servers,
    getServer,
    getServersByProvider,
    addServer,
    removeServer
  }
}
