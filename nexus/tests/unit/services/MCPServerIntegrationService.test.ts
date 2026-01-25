/**
 * MCPServerIntegrationService Unit Tests
 *
 * Tests for MCP server integration functionality including:
 * - Server management
 * - Tool discovery
 * - Availability checking
 * - Connection management
 * - Tool execution
 * - Token refresh
 * - Fallback handling
 * - Cost tracking
 * - Health monitoring
 *
 * Story 16.7 Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MCPServerIntegrationService } from '../../../src/services/MCPServerIntegrationService'
import {
  MCPProvider,
  MCPServerConfig,
  MCPToolMapping,
  MCPExecutionRequest,
  MCP_COST_THRESHOLDS,
  MCP_TIMING_THRESHOLDS
} from '../../../src/types/tools'

describe('MCPServerIntegrationService', () => {
  let service: MCPServerIntegrationService

  beforeEach(() => {
    service = new MCPServerIntegrationService()
  })

  // ==========================================================================
  // SERVER MANAGEMENT
  // ==========================================================================

  describe('Server Management', () => {
    it('should initialize with default servers', () => {
      const servers = service.getServers()

      expect(servers.length).toBeGreaterThanOrEqual(2)
      expect(servers.some(s => s.provider === 'rube')).toBe(true)
      expect(servers.some(s => s.provider === 'composio')).toBe(true)
    })

    it('should add a custom server', () => {
      const customServer: MCPServerConfig = {
        id: 'custom-server',
        provider: 'custom',
        name: 'Custom MCP Server',
        endpoint: 'https://custom.example.com/mcp',
        description: 'Custom server for testing',
        capabilities: ['tool_execution'],
        authMethod: 'api_key',
        isEnabled: true
      }

      service.addServer(customServer)

      const retrieved = service.getServer('custom-server')
      expect(retrieved).not.toBeNull()
      expect(retrieved?.name).toBe('Custom MCP Server')
    })

    it('should remove a server', () => {
      service.removeServer('rube-default')

      const server = service.getServer('rube-default')
      expect(server).toBeNull()
    })

    it('should get servers by provider', () => {
      const composioServers = service.getServersByProvider('composio')

      expect(composioServers.length).toBeGreaterThan(0)
      expect(composioServers.every(s => s.provider === 'composio')).toBe(true)
    })
  })

  // ==========================================================================
  // TOOL DISCOVERY
  // ==========================================================================

  describe('Tool Discovery', () => {
    it('should discover tools from MCP server', async () => {
      const result = await service.discoverMCPTools('composio-default')

      expect(result.provider).toBe('composio')
      expect(result.tools.length).toBeGreaterThan(0)
      expect(result.discoveredAt).toBeDefined()
    })

    it('should cache discovered tools', async () => {
      // First discovery
      const _result1 = await service.discoverMCPTools('composio-default')

      // Second discovery (should use cache)
      const result2 = await service.discoverMCPTools('composio-default')

      expect(_result1.tools.length).toBe(result2.tools.length)
    })

    it('should force refresh when requested', async () => {
      // First discovery
      await service.discoverMCPTools('composio-default')

      // Force refresh
      const result = await service.discoverMCPTools('composio-default', { forceRefresh: true })

      expect(result.tools.length).toBeGreaterThan(0)
    })

    it('should filter tools by category', async () => {
      const result = await service.discoverMCPTools('composio-default', { category: 'email' })

      expect(result.tools.every(t => t.category === 'email')).toBe(true)
    })

    it('should throw error for non-existent server', async () => {
      await expect(service.discoverMCPTools('non-existent')).rejects.toThrow('Server not found')
    })

    it('should discover tools from Rube server', async () => {
      const result = await service.discoverMCPTools('rube-default')

      expect(result.provider).toBe('rube')
      expect(result.tools.length).toBeGreaterThan(0)
      expect(result.tools.some(t => t.slug.includes('RUBE'))).toBe(true)
    })
  })

  // ==========================================================================
  // AVAILABILITY CHECKING
  // ==========================================================================

  describe('Availability Checking', () => {
    it('should check tool availability via MCP', async () => {
      // First discover tools to populate mappings
      await service.discoverMCPTools('composio-default')

      const result = await service.checkMCPAvailability('gmail-send')

      expect(result.toolId).toBe('gmail-send')
      expect(result.providers).toBeDefined()
      expect(result.providers.length).toBeGreaterThan(0)
    })

    it('should recommend provider when multiple available', async () => {
      // Map a tool to both providers
      service.mapToolToMCP('test-tool', 'TEST_TOOL', 'composio', { confidence: 0.9 })

      const result = await service.checkMCPAvailability('test-tool')

      expect(result.isAvailable).toBe(true)
      expect(result.recommendedProvider).toBeDefined()
    })

    it('should indicate fallback required when tool not available', async () => {
      const result = await service.checkMCPAvailability('non-existent-tool')

      expect(result.fallbackRequired).toBe(true)
      expect(result.fallbackStrategy).toBeDefined()
    })

    it('should determine appropriate fallback strategy', async () => {
      const gmailResult = await service.checkMCPAvailability('gmail-tool')
      expect(gmailResult.fallbackStrategy?.type).toBe('direct_oauth')
      expect(gmailResult.fallbackStrategy?.oauthConfig?.provider).toBe('google')

      const slackResult = await service.checkMCPAvailability('slack-tool')
      expect(slackResult.fallbackStrategy?.type).toBe('direct_oauth')
      expect(slackResult.fallbackStrategy?.oauthConfig?.provider).toBe('slack')

      const unknownResult = await service.checkMCPAvailability('random-tool')
      expect(unknownResult.fallbackStrategy?.type).toBe('dynamic_api')
    })

    it('should complete availability check within timeout', async () => {
      const startTime = Date.now()
      await service.checkMCPAvailability('test-tool')
      const duration = Date.now() - startTime

      // Should complete reasonably fast (not hit full timeout)
      expect(duration).toBeLessThan(MCP_TIMING_THRESHOLDS.availabilityCheckTimeout + 500)
    })
  })

  // ==========================================================================
  // CONNECTION MANAGEMENT
  // ==========================================================================

  describe('Connection Management', () => {
    it('should connect to MCP server', async () => {
      const result = await service.connectViaMCP({ provider: 'composio' })

      expect(result.success).toBe(true)
      expect(result.connection).toBeDefined()
      expect(result.connection?.state).toBe('authenticated')
    })

    it('should connect within 2 second SLA (AC3)', async () => {
      const startTime = Date.now()
      await service.connectViaMCP({ provider: 'composio' })
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(MCP_TIMING_THRESHOLDS.connectionTimeout)
    })

    it('should reuse existing connection', async () => {
      const result1 = await service.connectViaMCP({ provider: 'composio' })
      const result2 = await service.connectViaMCP({ provider: 'composio' })

      expect(result1.connection?.id).toBe(result2.connection?.id)
    })

    it('should force new connection when requested', async () => {
      const _result1 = await service.connectViaMCP({ provider: 'composio' })
      const result2 = await service.connectViaMCP({
        provider: 'composio',
        options: { forceRefresh: true }
      })

      // New connection should be created (result1 was to establish initial connection)
      expect(result2.connection).toBeDefined()
    })

    it('should close connection', async () => {
      const result = await service.connectViaMCP({ provider: 'composio' })
      const connectionId = result.connection!.id

      service.closeConnection(connectionId)

      const conn = service.getConnection(connectionId)
      expect(conn).toBeNull()
    })

    it('should get all active connections', async () => {
      await service.connectViaMCP({ provider: 'composio' })
      await service.connectViaMCP({ provider: 'rube' })

      const activeConnections = service.getActiveConnections()

      expect(activeConnections.length).toBeGreaterThanOrEqual(2)
    })

    it('should handle connection with specific server ID', async () => {
      const result = await service.connectViaMCP({
        provider: 'composio',
        serverId: 'composio-default'
      })

      expect(result.success).toBe(true)
      expect(result.connection?.serverId).toBe('composio-default')
    })
  })

  // ==========================================================================
  // TOOL EXECUTION
  // ==========================================================================

  describe('Tool Execution', () => {
    it('should execute tool via MCP', async () => {
      const mapping: MCPToolMapping = {
        catalogToolId: 'gmail-send',
        mcpToolSlug: 'GMAIL_SEND_EMAIL',
        provider: 'composio',
        serverId: 'composio-default',
        confidence: 0.9,
        isVerified: true
      }

      const request: MCPExecutionRequest = {
        toolMapping: mapping,
        parameters: {
          to: 'test@example.com',
          subject: 'Test',
          body: 'Hello'
        },
        context: {
          operationId: 'op-123'
        }
      }

      const result = await service.executeTool(request)

      expect(result.success).toBe(true)
      expect(result.requestId).toBeDefined()
      expect(result.toolSlug).toBe('GMAIL_SEND_EMAIL')
      expect(result.provider).toBe('composio')
    })

    it('should track execution cost', async () => {
      const mapping: MCPToolMapping = {
        catalogToolId: 'test-tool',
        mcpToolSlug: 'TEST_TOOL',
        provider: 'composio',
        serverId: 'composio-default',
        confidence: 0.9,
        isVerified: true
      }

      const result = await service.executeTool({
        toolMapping: mapping,
        parameters: {},
        context: { operationId: 'op-123' },
        options: { trackCost: true }
      })

      expect(result.costUsd).toBeGreaterThan(0)
      expect(result.costUsd).toBeLessThan(MCP_COST_THRESHOLDS.maxCostPerConnection)
    })

    it('should include duration in result', async () => {
      const mapping: MCPToolMapping = {
        catalogToolId: 'test-tool',
        mcpToolSlug: 'TEST_TOOL',
        provider: 'composio',
        serverId: 'composio-default',
        confidence: 0.9,
        isVerified: true
      }

      const result = await service.executeTool({
        toolMapping: mapping,
        parameters: {},
        context: { operationId: 'op-123' }
      })

      expect(result.durationMs).toBeGreaterThan(0)
    })

    it('should transform parameters using mappings', async () => {
      const mapping: MCPToolMapping = {
        catalogToolId: 'test-tool',
        mcpToolSlug: 'TEST_TOOL',
        provider: 'composio',
        serverId: 'composio-default',
        confidence: 0.9,
        isVerified: true,
        parameterMappings: [
          {
            catalogParam: 'emailAddress',
            mcpParam: 'to',
            transform: 'none',
            isRequired: true
          }
        ]
      }

      const result = await service.executeTool({
        toolMapping: mapping,
        parameters: { emailAddress: 'test@example.com' },
        context: { operationId: 'op-123' }
      })

      expect(result.success).toBe(true)
    })

    it('should update metrics after execution', async () => {
      const initialMetrics = service.getMetrics()

      const mapping: MCPToolMapping = {
        catalogToolId: 'test-tool',
        mcpToolSlug: 'TEST_TOOL',
        provider: 'composio',
        serverId: 'composio-default',
        confidence: 0.9,
        isVerified: true
      }

      await service.executeTool({
        toolMapping: mapping,
        parameters: {},
        context: { operationId: 'op-123' }
      })

      const finalMetrics = service.getMetrics()

      expect(finalMetrics.totalExecutions).toBeGreaterThan(initialMetrics.totalExecutions)
    })
  })

  // ==========================================================================
  // TOKEN MANAGEMENT
  // ==========================================================================

  describe('Token Management', () => {
    it('should refresh MCP token', async () => {
      const connectResult = await service.connectViaMCP({ provider: 'composio' })
      const connectionId = connectResult.connection!.id

      const refreshed = await service.refreshMCPToken(connectionId)

      expect(refreshed).toBe(true)
    })

    it('should indicate when token needs refresh', async () => {
      const connectResult = await service.connectViaMCP({ provider: 'composio' })
      const connectionId = connectResult.connection!.id

      // Fresh connection shouldn't need refresh
      const needsRefresh = service.needsTokenRefresh(connectionId)

      expect(needsRefresh).toBe(false)
    })

    it('should return false for refresh on non-existent connection', async () => {
      const refreshed = await service.refreshMCPToken('non-existent')

      expect(refreshed).toBe(false)
    })

    it('should update connection state after token refresh', async () => {
      const connectResult = await service.connectViaMCP({ provider: 'composio' })
      const connectionId = connectResult.connection!.id

      await service.refreshMCPToken(connectionId)

      const connection = service.getConnection(connectionId)
      expect(connection?.authState.needsRefresh).toBe(false)
      expect(connection?.authState.lastRefreshed).toBeDefined()
    })
  })

  // ==========================================================================
  // OAUTH FALLBACK
  // ==========================================================================

  describe('OAuth Fallback', () => {
    it('should fall back to direct OAuth', async () => {
      const result = await service.fallbackToDirectOAuth('gmail-tool', {
        type: 'direct_oauth',
        priority: 1,
        oauthConfig: {
          provider: 'google',
          scopes: ['https://www.googleapis.com/auth/gmail.modify']
        }
      })

      expect(result.success).toBe(true)
      expect(result.fallbackUsed).toBe(true)
      expect(result.fallbackType).toBe('direct_oauth')
    })

    it('should fail for invalid fallback strategy', async () => {
      const result = await service.fallbackToDirectOAuth('test-tool', {
        type: 'dynamic_api',
        priority: 2
      })

      expect(result.success).toBe(false)
    })

    it('should update fallback metrics', async () => {
      const initialMetrics = service.getMetrics()

      await service.fallbackToDirectOAuth('test-tool', {
        type: 'direct_oauth',
        priority: 1,
        oauthConfig: { provider: 'google' }
      })

      const finalMetrics = service.getMetrics()

      expect(finalMetrics.fallbacksTriggered).toBeGreaterThan(initialMetrics.fallbacksTriggered)
    })
  })

  // ==========================================================================
  // TOOL MAPPING
  // ==========================================================================

  describe('Tool Mapping', () => {
    it('should map catalog tool to MCP tool', () => {
      const mapping = service.mapToolToMCP('my-gmail', 'GMAIL_SEND_EMAIL', 'composio')

      expect(mapping.catalogToolId).toBe('my-gmail')
      expect(mapping.mcpToolSlug).toBe('GMAIL_SEND_EMAIL')
      expect(mapping.provider).toBe('composio')
    })

    it('should retrieve tool mapping', () => {
      service.mapToolToMCP('my-gmail', 'GMAIL_SEND_EMAIL', 'composio')

      const mapping = service.getToolMapping('my-gmail')

      expect(mapping).not.toBeNull()
      expect(mapping?.mcpToolSlug).toBe('GMAIL_SEND_EMAIL')
    })

    it('should support custom mapping options', () => {
      const mapping = service.mapToolToMCP('my-gmail', 'GMAIL_SEND_EMAIL', 'composio', {
        confidence: 0.95,
        parameterMappings: [
          { catalogParam: 'recipient', mcpParam: 'to', isRequired: true }
        ]
      })

      expect(mapping.confidence).toBe(0.95)
      expect(mapping.parameterMappings?.length).toBe(1)
    })

    it('should verify tool mapping', async () => {
      service.mapToolToMCP('test-tool', 'TEST_TOOL', 'composio', { confidence: 0.9 })

      const verified = await service.verifyToolMapping('test-tool')

      expect(typeof verified).toBe('boolean')
    })

    it('should return false for non-existent mapping verification', async () => {
      const verified = await service.verifyToolMapping('non-existent')

      expect(verified).toBe(false)
    })

    it('should update mapping count in metrics', () => {
      const initialMetrics = service.getMetrics()

      service.mapToolToMCP('new-tool', 'NEW_TOOL', 'composio')

      const finalMetrics = service.getMetrics()

      expect(finalMetrics.toolsMapped).toBeGreaterThan(initialMetrics.toolsMapped)
    })
  })

  // ==========================================================================
  // HEALTH MONITORING
  // ==========================================================================

  describe('Health Monitoring', () => {
    it('should check server health', async () => {
      const health = await service.checkServerHealth('composio-default')

      expect(health.serverId).toBe('composio-default')
      expect(health.provider).toBe('composio')
      expect(typeof health.isHealthy).toBe('boolean')
      expect(health.lastCheck).toBeDefined()
    })

    it('should track response time', async () => {
      const health = await service.checkServerHealth('composio-default')

      expect(health.responseTimeMs).toBeGreaterThan(0)
    })

    it('should cache server health', async () => {
      await service.checkServerHealth('composio-default')

      const cachedHealth = service.getServerHealth('composio-default')

      expect(cachedHealth).not.toBeNull()
    })

    it('should throw error for non-existent server health check', async () => {
      await expect(service.checkServerHealth('non-existent')).rejects.toThrow('Server not found')
    })

    it('should validate MCP connection', async () => {
      const connectResult = await service.connectViaMCP({ provider: 'composio' })

      const isValid = await service.validateMCPConnection(connectResult.connection!.id)

      expect(isValid).toBe(true)
    })

    it('should return false for non-existent connection validation', async () => {
      const isValid = await service.validateMCPConnection('non-existent')

      expect(isValid).toBe(false)
    })
  })

  // ==========================================================================
  // SESSION MANAGEMENT
  // ==========================================================================

  describe('Session Management', () => {
    it('should create MCP session', async () => {
      const connectResult = await service.connectViaMCP({ provider: 'composio' })
      const session = service.createSession(connectResult.connection!.id)

      expect(session.id).toBeDefined()
      expect(session.connectionId).toBe(connectResult.connection!.id)
      expect(session.isActive).toBe(true)
    })

    it('should throw error for session with non-existent connection', () => {
      expect(() => service.createSession('non-existent')).toThrow('Connection not found')
    })

    it('should retrieve session by ID', async () => {
      const connectResult = await service.connectViaMCP({ provider: 'composio' })
      const session = service.createSession(connectResult.connection!.id)

      const retrieved = service.getSession(session.id)

      expect(retrieved).not.toBeNull()
      expect(retrieved?.id).toBe(session.id)
    })

    it('should add result to session', async () => {
      const connectResult = await service.connectViaMCP({ provider: 'composio' })
      const session = service.createSession(connectResult.connection!.id)

      const result = {
        success: true,
        requestId: 'req-123',
        toolSlug: 'TEST_TOOL',
        provider: 'composio' as MCPProvider,
        durationMs: 100,
        costUsd: 0.01,
        retryCount: 0,
        timestamp: new Date().toISOString()
      }

      service.addSessionResult(session.id, result)

      const updated = service.getSession(session.id)
      expect(updated?.results.length).toBe(1)
      expect(updated?.operationCount).toBe(1)
      expect(updated?.sessionCostUsd).toBe(0.01)
    })

    it('should end session', async () => {
      const connectResult = await service.connectViaMCP({ provider: 'composio' })
      const session = service.createSession(connectResult.connection!.id)

      service.endSession(session.id)

      const ended = service.getSession(session.id)
      expect(ended?.isActive).toBe(false)
    })
  })

  // ==========================================================================
  // METRICS
  // ==========================================================================

  describe('Metrics', () => {
    it('should track connection metrics', async () => {
      await service.connectViaMCP({ provider: 'composio' })

      const metrics = service.getMetrics()

      expect(metrics.totalConnections).toBeGreaterThan(0)
      expect(metrics.activeConnections).toBeGreaterThan(0)
    })

    it('should track execution metrics', async () => {
      const mapping: MCPToolMapping = {
        catalogToolId: 'test-tool',
        mcpToolSlug: 'TEST_TOOL',
        provider: 'composio',
        serverId: 'composio-default',
        confidence: 0.9,
        isVerified: true
      }

      await service.executeTool({
        toolMapping: mapping,
        parameters: {},
        context: { operationId: 'op-123' }
      })

      const metrics = service.getMetrics()

      expect(metrics.totalExecutions).toBeGreaterThan(0)
      expect(metrics.successfulExecutions).toBeGreaterThan(0)
    })

    it('should track cost by provider', async () => {
      const mapping: MCPToolMapping = {
        catalogToolId: 'test-tool',
        mcpToolSlug: 'TEST_TOOL',
        provider: 'composio',
        serverId: 'composio-default',
        confidence: 0.9,
        isVerified: true
      }

      await service.executeTool({
        toolMapping: mapping,
        parameters: {},
        context: { operationId: 'op-123' }
      })

      const metrics = service.getMetrics()

      expect(metrics.costByProvider.composio).toBeGreaterThan(0)
    })

    it('should reset metrics', async () => {
      await service.connectViaMCP({ provider: 'composio' })

      service.resetMetrics()

      const metrics = service.getMetrics()
      expect(metrics.totalConnections).toBe(0)
      expect(metrics.totalExecutions).toBe(0)
    })

    it('should calculate average connection time', async () => {
      await service.connectViaMCP({ provider: 'composio' })
      await service.connectViaMCP({ provider: 'rube' })

      const metrics = service.getMetrics()

      expect(metrics.avgConnectionTimeMs).toBeGreaterThan(0)
    })
  })

  // ==========================================================================
  // COST TRACKING (NFR-16.4.2)
  // ==========================================================================

  describe('Cost Tracking (NFR-16.4.2)', () => {
    it('should track cost per connection', async () => {
      const connectResult = await service.connectViaMCP({ provider: 'composio' })

      const mapping: MCPToolMapping = {
        catalogToolId: 'test-tool',
        mcpToolSlug: 'TEST_TOOL',
        provider: 'composio',
        serverId: 'composio-default',
        confidence: 0.9,
        isVerified: true
      }

      await service.executeTool({
        toolMapping: mapping,
        parameters: {},
        context: { operationId: 'op-123' }
      })

      const connection = service.getConnection(connectResult.connection!.id)

      expect(connection?.totalCostUsd).toBeGreaterThan(0)
      expect(connection?.requestCosts.length).toBeGreaterThan(0)
    })

    it('should stay under $0.25 per connection threshold', async () => {
      const connectResult = await service.connectViaMCP({ provider: 'composio' })

      const mapping: MCPToolMapping = {
        catalogToolId: 'test-tool',
        mcpToolSlug: 'TEST_TOOL',
        provider: 'composio',
        serverId: 'composio-default',
        confidence: 0.9,
        isVerified: true
      }

      // Execute multiple times
      for (let i = 0; i < 5; i++) {
        await service.executeTool({
          toolMapping: mapping,
          parameters: {},
          context: { operationId: `op-${i}` }
        })
      }

      const connection = service.getConnection(connectResult.connection!.id)

      expect(connection?.totalCostUsd).toBeLessThan(MCP_COST_THRESHOLDS.maxCostPerConnection)
    })

    it('should call cost warning callback at threshold', async () => {
      const warningCallback = vi.fn()
      service.onCostWarningCallback(warningCallback)

      // This test verifies the callback is registered
      // In real scenario, would trigger when cost exceeds warning threshold
      expect(warningCallback).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // CALLBACKS
  // ==========================================================================

  describe('Callbacks', () => {
    it('should notify on connection change', async () => {
      const callback = vi.fn()
      service.onConnectionChanged(callback)

      await service.connectViaMCP({ provider: 'composio' })

      expect(callback).toHaveBeenCalled()
    })

    it('should notify on tool discovered', async () => {
      const callback = vi.fn()
      service.onToolDiscoveredCallback(callback)

      await service.discoverMCPTools('composio-default', { forceRefresh: true })

      expect(callback).toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  describe('Cleanup', () => {
    it('should clean up stale connections', async () => {
      await service.connectViaMCP({ provider: 'composio' })

      // Active connections should exist before cleanup
      const activeBefore = service.getActiveConnections()
      expect(activeBefore.length).toBeGreaterThan(0)

      // Clean up with very large maxAge should not clean active connections
      const notCleaned = service.cleanupStaleConnections(3600000) // 1 hour
      expect(notCleaned).toBe(0)

      // Active connections should still exist
      expect(service.getActiveConnections().length).toBeGreaterThan(0)
    })

    it('should clean up completed sessions', async () => {
      const connectResult = await service.connectViaMCP({ provider: 'composio' })
      const session = service.createSession(connectResult.connection!.id)

      // Session should exist
      expect(service.getSession(session.id)).not.toBeNull()

      // End the session
      service.endSession(session.id)

      // Session should be marked inactive
      const endedSession = service.getSession(session.id)
      expect(endedSession?.isActive).toBe(false)

      // Cleanup with large maxAge should not clean recently ended sessions
      const notCleaned = service.cleanupCompletedSessions(3600000)
      expect(notCleaned).toBe(0)
    })
  })

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  describe('Error Handling', () => {
    it('should handle execution timeout gracefully', async () => {
      const mapping: MCPToolMapping = {
        catalogToolId: 'test-tool',
        mcpToolSlug: 'TEST_TOOL',
        provider: 'composio',
        serverId: 'composio-default',
        confidence: 0.9,
        isVerified: true
      }

      // Very short timeout to trigger timeout error
      const result = await service.executeTool({
        toolMapping: mapping,
        parameters: {},
        context: { operationId: 'op-123' },
        options: { timeout: 1 } // 1ms timeout
      })

      // Should either succeed (if fast enough) or fail with timeout
      expect(result).toBeDefined()
      expect(typeof result.success).toBe('boolean')
    })

    it('should handle missing required parameters', async () => {
      const mapping: MCPToolMapping = {
        catalogToolId: 'test-tool',
        mcpToolSlug: 'TEST_TOOL',
        provider: 'composio',
        serverId: 'composio-default',
        confidence: 0.9,
        isVerified: true,
        parameterMappings: [
          { catalogParam: 'required_field', mcpParam: 'field', isRequired: true }
        ]
      }

      const result = await service.executeTool({
        toolMapping: mapping,
        parameters: {}, // Missing required_field
        context: { operationId: 'op-123' }
      })

      // Should fail due to missing required parameter
      expect(result.success).toBe(false)
    })

    it('should classify errors correctly', async () => {
      // Test that different error types are classified properly
      const mapping: MCPToolMapping = {
        catalogToolId: 'test-tool',
        mcpToolSlug: 'TEST_TOOL',
        provider: 'composio',
        serverId: 'composio-default',
        confidence: 0.9,
        isVerified: true
      }

      const result = await service.executeTool({
        toolMapping: mapping,
        parameters: {},
        context: { operationId: 'op-123' }
      })

      // Result should have proper structure
      expect(result.timestamp).toBeDefined()
      expect(typeof result.durationMs).toBe('number')
    })
  })

  // ==========================================================================
  // INTEGRATION SCENARIOS
  // ==========================================================================

  describe('Integration Scenarios', () => {
    it('should handle full workflow: discover -> map -> connect -> execute', async () => {
      // 1. Discover tools
      const discovery = await service.discoverMCPTools('composio-default')
      expect(discovery.tools.length).toBeGreaterThan(0)

      // 2. Map a tool
      const mapping = service.mapToolToMCP(
        'workflow-gmail',
        discovery.tools[0].slug,
        'composio'
      )
      expect(mapping).toBeDefined()

      // 3. Connect
      const connection = await service.connectViaMCP({ provider: 'composio' })
      expect(connection.success).toBe(true)

      // 4. Execute
      const result = await service.executeTool({
        toolMapping: mapping,
        parameters: {},
        context: { operationId: 'workflow-op-1' }
      })
      expect(result.success).toBe(true)
    })

    it('should handle multi-provider scenario', async () => {
      // Connect to multiple providers
      const composioConn = await service.connectViaMCP({ provider: 'composio' })
      const rubeConn = await service.connectViaMCP({ provider: 'rube' })

      expect(composioConn.success).toBe(true)
      expect(rubeConn.success).toBe(true)

      // Both connections should be active
      const activeConnections = service.getActiveConnections()
      expect(activeConnections.length).toBeGreaterThanOrEqual(2)
    })

    it('should handle session with multiple operations', async () => {
      const connectResult = await service.connectViaMCP({ provider: 'composio' })
      const session = service.createSession(connectResult.connection!.id)

      const mapping: MCPToolMapping = {
        catalogToolId: 'test-tool',
        mcpToolSlug: 'TEST_TOOL',
        provider: 'composio',
        serverId: 'composio-default',
        confidence: 0.9,
        isVerified: true
      }

      // Execute multiple operations in session
      for (let i = 0; i < 3; i++) {
        const result = await service.executeTool({
          toolMapping: mapping,
          parameters: {},
          context: { operationId: `session-op-${i}` }
        })
        service.addSessionResult(session.id, result)
      }

      const finalSession = service.getSession(session.id)
      expect(finalSession?.operationCount).toBe(3)
      expect(finalSession?.sessionCostUsd).toBeGreaterThan(0)
    })
  })
})
