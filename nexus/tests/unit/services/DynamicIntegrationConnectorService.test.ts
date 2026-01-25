/**
 * Unit Tests for DynamicIntegrationConnectorService
 *
 * Tests connection establishment, data flow execution, and chain execution
 * with a target of 90% coverage for the 99% first-attempt success rate (NFR-16.2.1).
 *
 * Story 16.5 Implementation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { dynamicIntegrationConnectorService } from '../../../src/services/DynamicIntegrationConnectorService'
import { toolCatalogService } from '../../../src/services/ToolCatalogService'
import { integrationSchemaAnalyzerService } from '../../../src/services/IntegrationSchemaAnalyzerService'
import type {
  Tool,
  ToolChain,
  ChainStep,
  IntegrationConnection,
  TransformationMap,
  EstablishConnectionRequest
} from '../../../src/types/tools'

// Mock dependencies
vi.mock('../../../src/services/ToolCatalogService', () => ({
  toolCatalogService: {
    getToolById: vi.fn()
  }
}))

vi.mock('../../../src/services/IntegrationSchemaAnalyzerService', () => ({
  integrationSchemaAnalyzerService: {
    analyzeToolPair: vi.fn()
  }
}))

// Helper to create mock tool
function createMockTool(overrides: Partial<Tool> = {}): Tool {
  return {
    id: 'tool-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    name: 'Test Tool',
    category: 'productivity',
    description: 'A test tool',
    apiDocUrl: 'https://api.example.com/docs',
    authMethod: 'api_key',
    dataFormats: ['json'],
    costEstimate: { tier: 'free' },
    reliabilityRating: 0.95,
    toolkitSlug: 'test-tool',
    provider: 'custom',
    capabilities: [
      { action: 'getData', description: 'Get data' },
      { action: 'sendData', description: 'Send data' }
    ],
    isApproved: true,
    approvedBy: 'admin',
    approvedAt: new Date().toISOString(),
    metadata: { baseUrl: 'https://api.example.com' },
    ...overrides
  }
}

// Helper to create mock chain
function createMockChain(steps: Partial<ChainStep>[] = []): ToolChain {
  const defaultSteps: ChainStep[] = steps.length > 0
    ? steps.map((s, i) => ({
        order: i + 1,
        tool: createMockTool({ id: `tool-${i + 1}`, name: `Tool ${i + 1}` }),
        capability: s.capability || 'getData',
        estimatedTimeMs: s.estimatedTimeMs || 1000,
        estimatedCostUsd: s.estimatedCostUsd || 0.01,
        requiresTransformation: s.requiresTransformation || false,
        ...s
      }))
    : [
        {
          order: 1,
          tool: createMockTool({ id: 'tool-1', name: 'Source Tool' }),
          capability: 'getData',
          estimatedTimeMs: 1000,
          estimatedCostUsd: 0.01,
          requiresTransformation: false
        },
        {
          order: 2,
          tool: createMockTool({ id: 'tool-2', name: 'Target Tool' }),
          capability: 'sendData',
          estimatedTimeMs: 1500,
          estimatedCostUsd: 0.02,
          requiresTransformation: true
        }
      ]

  return {
    id: 'chain-1',
    name: 'Test Chain',
    description: 'A test chain',
    steps: defaultSteps,
    totalEstimatedTimeMs: defaultSteps.reduce((sum, s) => sum + s.estimatedTimeMs, 0),
    totalEstimatedCostUsd: defaultSteps.reduce((sum, s) => sum + s.estimatedCostUsd, 0),
    reliabilityScore: 90,
    optimizationScore: 85,
    canParallelize: false,
    metadata: {
      generatedAt: new Date().toISOString(),
      optimizationType: 'balanced',
      complexityLevel: 'simple',
      capabilitiesCovered: ['getData', 'sendData'],
      toolCount: defaultSteps.length,
      hasExternalTools: false,
      requiresApproval: false
    }
  }
}

// Helper to create mock connection
function createMockConnection(overrides: Partial<IntegrationConnection> = {}): IntegrationConnection {
  return {
    id: 'conn-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toolId: 'tool-1',
    toolName: 'Test Tool',
    config: {
      authType: 'api_key',
      apiKey: {
        apiKey: 'test-api-key',
        keyLocation: 'header',
        keyName: 'X-API-Key'
      },
      timeout: 30000
    },
    endpoints: {
      getData: { name: 'getData', method: 'GET', path: '/data' },
      healthCheck: { name: 'healthCheck', method: 'GET', path: '/health' }
    },
    status: 'connected',
    lastConnectedAt: new Date().toISOString(),
    lastTestedAt: new Date().toISOString(),
    metrics: {
      successCount: 100,
      failureCount: 1,
      totalRequests: 101,
      avgLatencyMs: 250,
      lastLatencyMs: 200,
      successRate: 0.99,
      uptime: 99,
      lastSuccessAt: new Date().toISOString(),
      lastFailureAt: null
    },
    projectId: null,
    userId: 'user-1',
    metadata: {},
    ...overrides
  }
}

// Helper to create mock transformation map
function createMockTransformationMap(): TransformationMap {
  return {
    id: 'transform-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceToolId: 'tool-1',
    sourceToolName: 'Source Tool',
    targetToolId: 'tool-2',
    targetToolName: 'Target Tool',
    fieldMappings: [
      {
        sourceField: 'id',
        targetField: 'sourceId',
        transformationType: 'direct',
        confidence: 1.0,
        matchType: 'exact'
      },
      {
        sourceField: 'name',
        targetField: 'displayName',
        transformationType: 'direct',
        confidence: 0.9,
        matchType: 'fuzzy'
      }
    ],
    typeConversions: [],
    defaultValues: {},
    transformFunction: 'function transform(data) { return { sourceId: data.id, displayName: data.name }; }',
    confidenceScore: 0.95,
    coverageScore: 1.0,
    complexityScore: 0.1,
    usageCount: 10,
    successRate: 0.99
  }
}

describe('DynamicIntegrationConnectorService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dynamicIntegrationConnectorService.clearCache()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ============================================================================
  // Connection Establishment Tests
  // ============================================================================

  describe('establishConnection', () => {
    it('should establish connection successfully with API key auth', async () => {
      const mockTool = createMockTool()
      vi.mocked(toolCatalogService.getToolById).mockResolvedValue(mockTool)

      const request: EstablishConnectionRequest = {
        toolId: 'tool-1',
        userId: 'user-1',
        config: {
          authType: 'api_key',
          apiKey: {
            apiKey: 'test-key',
            keyLocation: 'header',
            keyName: 'X-API-Key'
          }
        },
        testAfterConnect: false
      }

      const result = await dynamicIntegrationConnectorService.establishConnection(request)

      expect(result.success).toBe(true)
      expect(result.connection).toBeDefined()
      expect(result.connection?.toolId).toBe('tool-1')
      expect(result.connection?.status).toBe('connected')
      expect(result.establishTimeMs).toBeGreaterThanOrEqual(0)
    })

    it('should establish connection with OAuth2 auth', async () => {
      const mockTool = createMockTool({ authMethod: 'oauth2' })
      vi.mocked(toolCatalogService.getToolById).mockResolvedValue(mockTool)

      const request: EstablishConnectionRequest = {
        toolId: 'tool-1',
        userId: 'user-1',
        config: {
          authType: 'oauth2',
          oauth2: {
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            tokenType: 'Bearer',
            expiresAt: new Date(Date.now() + 3600000).toISOString()
          }
        },
        testAfterConnect: false
      }

      const result = await dynamicIntegrationConnectorService.establishConnection(request)

      expect(result.success).toBe(true)
      expect(result.connection?.config.authType).toBe('oauth2')
    })

    it('should establish connection with bearer token', async () => {
      const mockTool = createMockTool({ authMethod: 'bearer' })
      vi.mocked(toolCatalogService.getToolById).mockResolvedValue(mockTool)

      const request: EstablishConnectionRequest = {
        toolId: 'tool-1',
        userId: 'user-1',
        config: {
          authType: 'bearer',
          bearer: {
            token: 'bearer-token'
          }
        },
        testAfterConnect: false
      }

      const result = await dynamicIntegrationConnectorService.establishConnection(request)

      expect(result.success).toBe(true)
    })

    it('should establish MCP connection', async () => {
      const mockTool = createMockTool({ provider: 'rube', authMethod: 'mcp' })
      vi.mocked(toolCatalogService.getToolById).mockResolvedValue(mockTool)

      const request: EstablishConnectionRequest = {
        toolId: 'tool-1',
        userId: 'user-1',
        testAfterConnect: false
      }

      const result = await dynamicIntegrationConnectorService.establishConnection(request)

      expect(result.success).toBe(true)
      expect(result.connection?.config.authType).toBe('mcp')
      expect(result.connection?.config.mcp?.server).toBe('rube')
    })

    it('should return cached connection if available', async () => {
      const mockTool = createMockTool({ authMethod: 'none' })
      vi.mocked(toolCatalogService.getToolById).mockResolvedValue(mockTool)

      const request: EstablishConnectionRequest = {
        toolId: 'tool-1',
        userId: 'user-1',
        testAfterConnect: false
      }

      // First connection
      const result1 = await dynamicIntegrationConnectorService.establishConnection(request)
      expect(result1.success).toBe(true)

      // Second connection should be cached
      const result2 = await dynamicIntegrationConnectorService.establishConnection(request)
      expect(result2.success).toBe(true)
      expect(result2.connection?.id).toBe(result1.connection?.id)
    })

    it('should fail when tool not found', async () => {
      vi.mocked(toolCatalogService.getToolById).mockResolvedValue(null)

      const request: EstablishConnectionRequest = {
        toolId: 'non-existent',
        userId: 'user-1'
      }

      const result = await dynamicIntegrationConnectorService.establishConnection(request)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error?.userMessage).toContain('unexpected error')
    })

    it('should fail with missing OAuth2 config', async () => {
      const mockTool = createMockTool({ authMethod: 'oauth2' })
      vi.mocked(toolCatalogService.getToolById).mockResolvedValue(mockTool)

      const request: EstablishConnectionRequest = {
        toolId: 'tool-1',
        userId: 'user-1',
        config: {
          authType: 'oauth2'
          // Missing oauth2 config
        },
        testAfterConnect: false
      }

      const result = await dynamicIntegrationConnectorService.establishConnection(request)

      expect(result.success).toBe(false)
      expect(result.error?.errorType).toBe('INVALID_CONFIG')
    })

    it('should require user auth when OAuth token expired', async () => {
      const mockTool = createMockTool({ authMethod: 'oauth2' })
      vi.mocked(toolCatalogService.getToolById).mockResolvedValue(mockTool)

      const request: EstablishConnectionRequest = {
        toolId: 'tool-1',
        userId: 'user-1',
        config: {
          authType: 'oauth2',
          oauth2: {
            accessToken: 'expired-token',
            tokenType: 'Bearer',
            expiresAt: new Date(Date.now() - 3600000).toISOString() // Expired
            // No refresh token
          }
        },
        testAfterConnect: false
      }

      const result = await dynamicIntegrationConnectorService.establishConnection(request)

      expect(result.success).toBe(false)
      expect(result.requiresUserAuth).toBe(true)
    })
  })

  // ============================================================================
  // Connection Testing Tests
  // ============================================================================

  describe('testConnection', () => {
    it('should pass all tests for healthy connection', async () => {
      const connection = createMockConnection()

      const result = await dynamicIntegrationConnectorService.testConnection(connection)

      expect(result.success).toBe(true)
      expect(result.passedCount).toBeGreaterThan(0)
      expect(result.failedCount).toBe(0)
      expect(result.testsRun.length).toBeGreaterThan(0)
    })

    it('should fail authentication test with missing credentials', async () => {
      const connection = createMockConnection({
        config: {
          authType: 'api_key'
          // Missing apiKey config
        }
      })

      const result = await dynamicIntegrationConnectorService.testConnection(connection)

      expect(result.success).toBe(false)
      const authTest = result.testsRun.find(t => t.name === 'authentication')
      expect(authTest?.passed).toBe(false)
    })

    it('should include recommendations for failed tests', async () => {
      const connection = createMockConnection({
        config: {
          authType: 'api_key'
        }
      })

      const result = await dynamicIntegrationConnectorService.testConnection(connection)

      expect(result.recommendations).toBeDefined()
      expect(result.recommendations?.length).toBeGreaterThan(0)
    })

    it('should test multiple connections in parallel', async () => {
      const connections = [
        createMockConnection({ id: 'conn-1' }),
        createMockConnection({ id: 'conn-2' }),
        createMockConnection({ id: 'conn-3' })
      ]

      const results = await dynamicIntegrationConnectorService.testConnectionsParallel(connections)

      expect(results.length).toBe(3)
      results.forEach(result => {
        expect(result.success).toBe(true)
      })
    })
  })

  // ============================================================================
  // Data Flow Execution Tests
  // ============================================================================

  describe('executeDataFlow', () => {
    it('should execute data flow successfully', async () => {
      const sourceConnection = createMockConnection({ id: 'source', toolId: 'tool-1' })
      const targetConnection = createMockConnection({ id: 'target', toolId: 'tool-2' })
      const transformationMap = createMockTransformationMap()

      const result = await dynamicIntegrationConnectorService.executeDataFlow({
        sourceConnection,
        targetConnection,
        transformationMap
      })

      expect(result.status).toBe('completed')
      expect(result.recordsExtracted).toBeGreaterThan(0)
      expect(result.recordsInjected).toBeGreaterThan(0)
      expect(result.dataIntegrityValid).toBe(true)
    })

    it('should execute data flow with explicit source data', async () => {
      const sourceConnection = createMockConnection({ id: 'source' })
      const targetConnection = createMockConnection({ id: 'target' })
      const sourceData = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' }
      ]

      const result = await dynamicIntegrationConnectorService.executeDataFlow({
        sourceConnection,
        targetConnection,
        sourceData
      })

      expect(result.status).toBe('completed')
      expect(result.recordsExtracted).toBe(2)
      expect(result.recordsTransformed).toBe(2)
    })

    it('should apply transformations correctly', async () => {
      const sourceConnection = createMockConnection({ id: 'source' })
      const targetConnection = createMockConnection({ id: 'target' })
      const transformationMap = createMockTransformationMap()
      const sourceData = [{ id: '1', name: 'Test Item' }]

      const result = await dynamicIntegrationConnectorService.executeDataFlow({
        sourceConnection,
        targetConnection,
        transformationMap,
        sourceData
      })

      expect(result.status).toBe('completed')
      expect(result.transformedData).toBeDefined()
      expect(result.transformedData?.[0]).toHaveProperty('sourceId', '1')
      expect(result.transformedData?.[0]).toHaveProperty('displayName', 'Test Item')
    })

    it('should handle empty source data gracefully', async () => {
      const sourceConnection = createMockConnection({ id: 'source' })
      const targetConnection = createMockConnection({ id: 'target' })

      const result = await dynamicIntegrationConnectorService.executeDataFlow({
        sourceConnection,
        targetConnection,
        sourceData: []
      })

      expect(result.status).toBe('completed')
      expect(result.recordsExtracted).toBe(0)
      expect(result.recordsInjected).toBe(0)
    })

    it('should validate data integrity', async () => {
      const sourceConnection = createMockConnection({ id: 'source' })
      const targetConnection = createMockConnection({ id: 'target' })
      const sourceData = [{ id: '1', name: 'Test' }]

      const result = await dynamicIntegrationConnectorService.executeDataFlow({
        sourceConnection,
        targetConnection,
        sourceData,
        options: { validateIntegrity: true }
      })

      expect(result.dataIntegrityValid).toBe(true)
      expect(result.integrityErrors.length).toBe(0)
    })

    it('should track execution timing', async () => {
      const sourceConnection = createMockConnection({ id: 'source' })
      const targetConnection = createMockConnection({ id: 'target' })
      const sourceData = [{ id: '1' }]

      const result = await dynamicIntegrationConnectorService.executeDataFlow({
        sourceConnection,
        targetConnection,
        sourceData
      })

      expect(result.extractTimeMs).toBeGreaterThanOrEqual(0)
      expect(result.transformTimeMs).toBeGreaterThanOrEqual(0)
      expect(result.injectTimeMs).toBeGreaterThanOrEqual(0)
      expect(result.totalTimeMs).toBeGreaterThanOrEqual(0)
    })
  })

  // ============================================================================
  // Chain Execution Tests
  // ============================================================================

  describe('runPreflightChecks', () => {
    it('should pass preflight for valid chain', async () => {
      const chain = createMockChain()
      // Use authMethod: 'none' so connections succeed without auth config
      vi.mocked(toolCatalogService.getToolById).mockResolvedValue(createMockTool({ authMethod: 'none' }))
      vi.mocked(integrationSchemaAnalyzerService.analyzeToolPair).mockResolvedValue({
        sourceToolId: 'tool-1',
        targetToolId: 'tool-2',
        sourceSchema: { toolId: 'tool-1', direction: 'output', fields: [] },
        targetSchema: { toolId: 'tool-2', direction: 'input', fields: [] },
        isCompatible: true,
        requiresTransformation: false,
        fieldMappings: [],
        unmappedSourceFields: [],
        unmappedTargetFields: [],
        requiredButMissing: [],
        compatibilityScore: 1.0,
        dataIntegrityRisk: 'none',
        warnings: [],
        suggestions: []
      })

      const result = await dynamicIntegrationConnectorService.runPreflightChecks(chain)

      expect(result.success).toBe(true)
      expect(result.readyForExecution).toBe(true)
      expect(result.blockers.length).toBe(0)
      expect(result.connectionTests.length).toBe(2)
    })

    it('should fail preflight when connection fails', async () => {
      const chain = createMockChain()
      vi.mocked(toolCatalogService.getToolById).mockResolvedValue(null)

      const result = await dynamicIntegrationConnectorService.runPreflightChecks(chain)

      expect(result.success).toBe(false)
      expect(result.readyForExecution).toBe(false)
      expect(result.blockers.length).toBeGreaterThan(0)
    })

    it('should include schema validation results', async () => {
      const chain = createMockChain()
      // Use authMethod: 'none' so connections succeed without auth config
      vi.mocked(toolCatalogService.getToolById).mockResolvedValue(createMockTool({ authMethod: 'none' }))
      vi.mocked(integrationSchemaAnalyzerService.analyzeToolPair).mockResolvedValue({
        sourceToolId: 'tool-1',
        targetToolId: 'tool-2',
        sourceSchema: { toolId: 'tool-1', direction: 'output', fields: [] },
        targetSchema: { toolId: 'tool-2', direction: 'input', fields: [] },
        isCompatible: false,
        requiresTransformation: true,
        fieldMappings: [],
        unmappedSourceFields: ['extraField'],
        unmappedTargetFields: [],
        requiredButMissing: ['requiredField'],
        compatibilityScore: 0.5,
        dataIntegrityRisk: 'medium',
        warnings: ['Schema mismatch detected'],
        suggestions: ['Add field mapping for requiredField']
      })

      const result = await dynamicIntegrationConnectorService.runPreflightChecks(chain)

      expect(result.schemaValidations.length).toBe(1)
      expect(result.warnings.length).toBeGreaterThan(0)
    })
  })

  describe('executeChain', () => {
    it('should execute chain successfully', async () => {
      const chain = createMockChain()
      // Use authMethod: 'none' so connections succeed without auth config
      vi.mocked(toolCatalogService.getToolById).mockResolvedValue(createMockTool({ authMethod: 'none' }))
      vi.mocked(integrationSchemaAnalyzerService.analyzeToolPair).mockResolvedValue({
        sourceToolId: 'tool-1',
        targetToolId: 'tool-2',
        sourceSchema: { toolId: 'tool-1', direction: 'output', fields: [] },
        targetSchema: { toolId: 'tool-2', direction: 'input', fields: [] },
        isCompatible: true,
        requiresTransformation: false,
        fieldMappings: [],
        unmappedSourceFields: [],
        unmappedTargetFields: [],
        requiredButMissing: [],
        compatibilityScore: 1.0,
        dataIntegrityRisk: 'none',
        warnings: [],
        suggestions: [],
        transformationMap: createMockTransformationMap()
      })

      const result = await dynamicIntegrationConnectorService.executeChain(chain, 'user-1')

      expect(result.status).toBe('completed')
      expect(result.completedSteps).toBe(2)
      expect(result.totalSteps).toBe(2)
      expect(result.errors.length).toBe(0)
    })

    it('should handle partial execution', async () => {
      const chain = createMockChain([
        { capability: 'step1' },
        { capability: 'step2' },
        { capability: 'step3' }
      ])

      // First two tools succeed, third fails
      vi.mocked(toolCatalogService.getToolById)
        .mockResolvedValueOnce(createMockTool({ id: 'tool-1' }))
        .mockResolvedValueOnce(createMockTool({ id: 'tool-2' }))
        .mockResolvedValue(null)

      vi.mocked(integrationSchemaAnalyzerService.analyzeToolPair).mockResolvedValue({
        sourceToolId: 'tool-1',
        targetToolId: 'tool-2',
        sourceSchema: { toolId: 'tool-1', direction: 'output', fields: [] },
        targetSchema: { toolId: 'tool-2', direction: 'input', fields: [] },
        isCompatible: true,
        requiresTransformation: false,
        fieldMappings: [],
        unmappedSourceFields: [],
        unmappedTargetFields: [],
        requiredButMissing: [],
        compatibilityScore: 1.0,
        dataIntegrityRisk: 'none',
        warnings: [],
        suggestions: []
      })

      const result = await dynamicIntegrationConnectorService.executeChain(chain, 'user-1')

      // Should fail at preflight since tool-3 doesn't exist
      expect(result.status).toBe('failed')
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should track execution metrics', async () => {
      const chain = createMockChain()
      // Use authMethod: 'none' so connections succeed without auth config
      vi.mocked(toolCatalogService.getToolById).mockResolvedValue(createMockTool({ authMethod: 'none' }))
      vi.mocked(integrationSchemaAnalyzerService.analyzeToolPair).mockResolvedValue({
        sourceToolId: 'tool-1',
        targetToolId: 'tool-2',
        sourceSchema: { toolId: 'tool-1', direction: 'output', fields: [] },
        targetSchema: { toolId: 'tool-2', direction: 'input', fields: [] },
        isCompatible: true,
        requiresTransformation: false,
        fieldMappings: [],
        unmappedSourceFields: [],
        unmappedTargetFields: [],
        requiredButMissing: [],
        compatibilityScore: 1.0,
        dataIntegrityRisk: 'none',
        warnings: [],
        suggestions: []
      })

      const result = await dynamicIntegrationConnectorService.executeChain(chain, 'user-1')

      expect(result.totalTimeMs).toBeGreaterThanOrEqual(0)
      expect(result.totalCostUsd).toBeGreaterThanOrEqual(0)
      expect(result.totalRecordsProcessed).toBeGreaterThanOrEqual(0)
    })

    it('should include step results', async () => {
      const chain = createMockChain()
      // Use authMethod: 'none' so connections succeed without auth config
      vi.mocked(toolCatalogService.getToolById).mockResolvedValue(createMockTool({ authMethod: 'none' }))
      vi.mocked(integrationSchemaAnalyzerService.analyzeToolPair).mockResolvedValue({
        sourceToolId: 'tool-1',
        targetToolId: 'tool-2',
        sourceSchema: { toolId: 'tool-1', direction: 'output', fields: [] },
        targetSchema: { toolId: 'tool-2', direction: 'input', fields: [] },
        isCompatible: true,
        requiresTransformation: false,
        fieldMappings: [],
        unmappedSourceFields: [],
        unmappedTargetFields: [],
        requiredButMissing: [],
        compatibilityScore: 1.0,
        dataIntegrityRisk: 'none',
        warnings: [],
        suggestions: []
      })

      const result = await dynamicIntegrationConnectorService.executeChain(chain, 'user-1')

      expect(result.stepResults.length).toBe(2)
      result.stepResults.forEach((step, index) => {
        expect(step.stepIndex).toBe(index)
        expect(step.status).toBe('completed')
      })
    })
  })

  // ============================================================================
  // Metrics and Performance Tests
  // ============================================================================

  describe('metrics', () => {
    it('should track connection metrics', async () => {
      // Use authMethod: 'none' so connections succeed without auth config
      vi.mocked(toolCatalogService.getToolById).mockResolvedValue(createMockTool({ authMethod: 'none' }))

      await dynamicIntegrationConnectorService.establishConnection({
        toolId: 'tool-1',
        userId: 'user-1',
        testAfterConnect: false
      })

      const metrics = dynamicIntegrationConnectorService.getMetrics()

      expect(metrics.totalConnections).toBeGreaterThan(0)
      expect(metrics.successfulConnections).toBeGreaterThan(0)
    })

    it('should calculate first-attempt success rate', async () => {
      // Use authMethod: 'none' so connections succeed without auth config
      vi.mocked(toolCatalogService.getToolById).mockResolvedValue(createMockTool({ authMethod: 'none' }))

      // Establish successful connection
      await dynamicIntegrationConnectorService.establishConnection({
        toolId: 'tool-1',
        userId: 'user-1',
        testAfterConnect: false
      })

      const successRate = dynamicIntegrationConnectorService.getFirstAttemptSuccessRate()

      expect(successRate).toBeGreaterThanOrEqual(0)
      expect(successRate).toBeLessThanOrEqual(1)
    })

    it('should track average connection time', async () => {
      // Use authMethod: 'none' so connections succeed without auth config
      vi.mocked(toolCatalogService.getToolById).mockResolvedValue(createMockTool({ authMethod: 'none' }))

      await dynamicIntegrationConnectorService.establishConnection({
        toolId: 'tool-1',
        userId: 'user-1',
        testAfterConnect: false
      })

      const metrics = dynamicIntegrationConnectorService.getMetrics()

      expect(metrics.avgConnectionTimeMs).toBeGreaterThanOrEqual(0)
    })
  })

  // ============================================================================
  // Cache Management Tests
  // ============================================================================

  describe('cache management', () => {
    it('should clear cache', async () => {
      // Use authMethod: 'none' so connections succeed without auth config
      vi.mocked(toolCatalogService.getToolById).mockResolvedValue(createMockTool({ authMethod: 'none' }))

      await dynamicIntegrationConnectorService.establishConnection({
        toolId: 'tool-1',
        userId: 'user-1',
        testAfterConnect: false
      })

      dynamicIntegrationConnectorService.clearCache()

      const connection = await dynamicIntegrationConnectorService.getConnection('tool-1', 'user-1')
      expect(connection).toBeNull()
    })

    it('should disconnect connection', async () => {
      // Use authMethod: 'none' so connection succeeds without auth config
      vi.mocked(toolCatalogService.getToolById).mockResolvedValue(createMockTool({ authMethod: 'none' }))

      const result = await dynamicIntegrationConnectorService.establishConnection({
        toolId: 'tool-1',
        userId: 'user-1',
        testAfterConnect: false
      })

      expect(result.success).toBe(true)
      expect(result.connection).toBeDefined()

      await dynamicIntegrationConnectorService.disconnectConnection(result.connection!.id)

      // Connection should no longer be in cache
      const connection = await dynamicIntegrationConnectorService.getConnection('tool-1', 'user-1')
      expect(connection).toBeNull()
    })
  })

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('error handling', () => {
    it('should classify errors correctly', async () => {
      vi.mocked(toolCatalogService.getToolById).mockRejectedValue(new Error('Network error'))

      const result = await dynamicIntegrationConnectorService.establishConnection({
        toolId: 'tool-1',
        userId: 'user-1'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error?.isRetryable).toBeDefined()
    })

    it('should provide user-friendly error messages', async () => {
      vi.mocked(toolCatalogService.getToolById).mockResolvedValue(null)

      const result = await dynamicIntegrationConnectorService.establishConnection({
        toolId: 'non-existent',
        userId: 'user-1'
      })

      expect(result.error?.userMessage).toBeDefined()
      expect(result.error?.userMessage).not.toBe('')
    })
  })

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('edge cases', () => {
    it('should handle tool with no capabilities', async () => {
      // Use authMethod: 'none' and no capabilities
      const toolWithoutCapabilities = createMockTool({ capabilities: undefined, authMethod: 'none' })
      vi.mocked(toolCatalogService.getToolById).mockResolvedValue(toolWithoutCapabilities)

      const result = await dynamicIntegrationConnectorService.establishConnection({
        toolId: 'tool-1',
        userId: 'user-1',
        testAfterConnect: false
      })

      expect(result.success).toBe(true)
      expect(result.connection?.endpoints).toHaveProperty('healthCheck')
    })

    it('should handle empty chain', async () => {
      const emptyChain: ToolChain = {
        id: 'empty-chain',
        name: 'Empty Chain',
        description: 'A chain with no steps',
        steps: [],
        totalEstimatedTimeMs: 0,
        totalEstimatedCostUsd: 0,
        reliabilityScore: 100,
        optimizationScore: 100,
        canParallelize: false,
        metadata: {
          generatedAt: new Date().toISOString(),
          optimizationType: 'balanced',
          complexityLevel: 'simple',
          capabilitiesCovered: [],
          toolCount: 0,
          hasExternalTools: false,
          requiresApproval: false
        }
      }

      const result = await dynamicIntegrationConnectorService.runPreflightChecks(emptyChain)

      expect(result.success).toBe(true)
      expect(result.connectionTests.length).toBe(0)
    })

    it('should handle connection with no auth type', async () => {
      const toolNoAuth = createMockTool({ authMethod: 'none' })
      vi.mocked(toolCatalogService.getToolById).mockResolvedValue(toolNoAuth)

      const result = await dynamicIntegrationConnectorService.establishConnection({
        toolId: 'tool-1',
        userId: 'user-1',
        testAfterConnect: false
      })

      expect(result.success).toBe(true)
      expect(result.connection?.config.authType).toBe('none')
    })
  })
})
