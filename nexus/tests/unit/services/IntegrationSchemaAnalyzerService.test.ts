/**
 * IntegrationSchemaAnalyzerService Unit Tests
 *
 * Tests for schema analysis, field mapping, and transformation generation.
 * Story 16.4 Implementation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Supabase before importing the service
vi.mock('../../../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
    })),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null })
  }
}))

// Mock ToolCatalogService
vi.mock('../../../src/services/ToolCatalogService', () => ({
  toolCatalogService: {
    searchTools: vi.fn().mockResolvedValue([]),
    getTool: vi.fn().mockResolvedValue(null)
  }
}))

import { integrationSchemaAnalyzerService } from '../../../src/services/IntegrationSchemaAnalyzerService'
import { Tool, ToolChain, ChainStep, ToolCategory, DiscoveredTool } from '../../../src/types/tools'

// ============================================================================
// Test Fixtures
// ============================================================================

const createMockTool = (overrides: Partial<Tool> = {}): Tool => ({
  id: 'tool_' + Math.random().toString(36).substring(7),
  name: 'Test Tool',
  category: 'productivity' as ToolCategory,
  description: 'A test tool',
  apiDocUrl: 'https://api.example.com/docs',
  authMethod: 'oauth2' as const,
  dataFormats: ['json'],
  costEstimate: { perCall: 0.01, tier: 'paid' as const },
  reliabilityRating: 0.95,
  toolkitSlug: 'test_toolkit',
  isApproved: true,
  approvedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  inputSchema: {},
  outputSchema: {},
  ...overrides
})

const createMockDiscoveredTool = (overrides: Partial<DiscoveredTool> = {}): DiscoveredTool => ({
  id: 'discovered_' + Math.random().toString(36).substring(7),
  name: 'Discovered Tool',
  description: 'A discovered tool',
  category: 'productivity' as ToolCategory,
  source: 'mcp_rube' as const,
  discoveredAt: new Date().toISOString(),
  capabilities: ['data_fetch'],
  apiEndpoint: 'https://api.example.com',
  authMethods: ['oauth2'],
  estimatedCost: { perCall: 0.01, tier: 'paid' as const },
  trustScore: 0.8,
  trustFactors: {
    documentationQuality: 0.8,
    communityAdoption: 0.7,
    securityAssessment: 0.9,
    reliabilityHistory: 0.8,
    vendorReputation: 0.8
  },
  lastVerified: new Date().toISOString(),
  inputSchema: {},
  outputSchema: {},
  metadata: {},
  ...overrides
})

const createMockChain = (steps: ChainStep[]): ToolChain => ({
  id: 'chain_' + Math.random().toString(36).substring(7),
  name: 'Test Chain',
  description: 'A test chain',
  steps,
  totalEstimatedTimeMs: 1000,
  totalEstimatedCostUsd: 0.05,
  reliabilityScore: 90,
  optimizationScore: 85,
  metadata: {
    generatedAt: new Date().toISOString(),
    optimizationType: 'balanced',
    complexityLevel: 'moderate',
    capabilitiesCovered: ['data_fetch', 'notification'],
    toolCount: steps.length,
    parallelizable: false
  }
})

// ============================================================================
// Test Suites
// ============================================================================

describe('IntegrationSchemaAnalyzerService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    integrationSchemaAnalyzerService.clearCaches()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // Schema Extraction Tests
  // ==========================================================================

  describe('extractSchema', () => {
    it('should extract schema from tool with JSON Schema format', async () => {
      const tool = createMockTool({
        outputSchema: {
          type: 'object',
          properties: {
            orderId: { type: 'string', description: 'Order ID' },
            amount: { type: 'number', description: 'Total amount' },
            status: { type: 'string', enum: ['pending', 'completed'] }
          },
          required: ['orderId', 'amount']
        }
      })

      const schema = await integrationSchemaAnalyzerService.extractSchema(tool, 'output')

      expect(schema.toolId).toBe(tool.id)
      expect(schema.direction).toBe('output')
      expect(schema.fields).toHaveLength(3)

      const orderIdField = schema.fields.find(f => f.name === 'orderId')
      expect(orderIdField).toBeDefined()
      expect(orderIdField?.type).toBe('string')
      expect(orderIdField?.required).toBe(true)

      const amountField = schema.fields.find(f => f.name === 'amount')
      expect(amountField).toBeDefined()
      expect(amountField?.type).toBe('number')
      expect(amountField?.required).toBe(true)

      const statusField = schema.fields.find(f => f.name === 'status')
      expect(statusField).toBeDefined()
      expect(statusField?.required).toBe(false)
    })

    it('should extract schema from simple object format', async () => {
      const tool = createMockTool({
        outputSchema: {
          name: 'string',
          count: 123,
          active: true
        }
      })

      const schema = await integrationSchemaAnalyzerService.extractSchema(tool, 'output')

      expect(schema.fields).toHaveLength(3)
      expect(schema.fields.find(f => f.name === 'name')?.type).toBe('string')
      expect(schema.fields.find(f => f.name === 'count')?.type).toBe('number')
      expect(schema.fields.find(f => f.name === 'active')?.type).toBe('boolean')
    })

    it('should handle nested object schemas', async () => {
      const tool = createMockTool({
        outputSchema: {
          type: 'object',
          properties: {
            customer: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string', format: 'email' }
              }
            }
          }
        }
      })

      const schema = await integrationSchemaAnalyzerService.extractSchema(tool, 'output')

      const customerField = schema.fields.find(f => f.name === 'customer')
      expect(customerField).toBeDefined()
      expect(customerField?.type).toBe('object')
      expect(customerField?.nested).toHaveLength(2)
    })

    it('should handle array schemas', async () => {
      const tool = createMockTool({
        outputSchema: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      })

      const schema = await integrationSchemaAnalyzerService.extractSchema(tool, 'output')

      const itemsField = schema.fields.find(f => f.name === 'items')
      expect(itemsField).toBeDefined()
      expect(itemsField?.type).toBe('array')
      expect(itemsField?.items?.type).toBe('string')
    })

    it('should cache extracted schemas', async () => {
      const tool = createMockTool({
        outputSchema: { name: 'test' }
      })

      // First call
      const schema1 = await integrationSchemaAnalyzerService.extractSchema(tool, 'output')

      // Second call should return cached version
      const schema2 = await integrationSchemaAnalyzerService.extractSchema(tool, 'output')

      expect(schema1).toEqual(schema2)
    })

    it('should handle empty schemas', async () => {
      const tool = createMockTool({
        outputSchema: {}
      })

      const schema = await integrationSchemaAnalyzerService.extractSchema(tool, 'output')

      expect(schema.fields).toHaveLength(0)
    })
  })

  // ==========================================================================
  // Field Mapping Tests
  // ==========================================================================

  describe('field mapping', () => {
    it('should find exact field matches', async () => {
      const sourceTool = createMockTool({
        id: 'source_tool',
        name: 'Source Tool',
        outputSchema: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            name: { type: 'string' }
          }
        }
      })

      const targetTool = createMockTool({
        id: 'target_tool',
        name: 'Target Tool',
        inputSchema: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            name: { type: 'string' }
          }
        }
      })

      const analysis = await integrationSchemaAnalyzerService.analyzeToolPair(
        sourceTool,
        targetTool,
        false
      )

      expect(analysis.fieldMappings).toHaveLength(2)
      expect(analysis.fieldMappings.every(m => m.matchType === 'exact')).toBe(true)
      expect(analysis.fieldMappings.every(m => m.confidence === 1)).toBe(true)
    })

    it('should find fuzzy matches (camelCase vs snake_case)', async () => {
      const sourceTool = createMockTool({
        id: 'source_tool',
        name: 'Source Tool',
        outputSchema: {
          type: 'object',
          properties: {
            first_name: { type: 'string' },
            last_name: { type: 'string' }
          }
        }
      })

      const targetTool = createMockTool({
        id: 'target_tool',
        name: 'Target Tool',
        inputSchema: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' }
          }
        }
      })

      const analysis = await integrationSchemaAnalyzerService.analyzeToolPair(
        sourceTool,
        targetTool,
        false
      )

      expect(analysis.fieldMappings.length).toBeGreaterThan(0)

      const firstNameMapping = analysis.fieldMappings.find(m => m.targetField === 'firstName')
      expect(firstNameMapping).toBeDefined()
      expect(firstNameMapping?.matchType).toBe('fuzzy')
      expect(firstNameMapping?.confidence).toBeLessThan(1)
    })

    it('should find semantic matches using variations', async () => {
      const sourceTool = createMockTool({
        id: 'source_tool',
        name: 'Source Tool',
        outputSchema: {
          type: 'object',
          properties: {
            mail: { type: 'string' }
          }
        }
      })

      const targetTool = createMockTool({
        id: 'target_tool',
        name: 'Target Tool',
        inputSchema: {
          type: 'object',
          properties: {
            emailAddress: { type: 'string' }
          }
        }
      })

      const analysis = await integrationSchemaAnalyzerService.analyzeToolPair(
        sourceTool,
        targetTool,
        false
      )

      const emailMapping = analysis.fieldMappings.find(m => m.targetField === 'emailAddress')
      expect(emailMapping).toBeDefined()
      expect(emailMapping?.matchType).toBe('semantic')
    })

    it('should detect type mismatches', async () => {
      const sourceTool = createMockTool({
        id: 'source_tool',
        name: 'Source Tool',
        outputSchema: {
          type: 'object',
          properties: {
            amount: { type: 'string' }
          }
        }
      })

      const targetTool = createMockTool({
        id: 'target_tool',
        name: 'Target Tool',
        inputSchema: {
          type: 'object',
          properties: {
            amount: { type: 'number' }
          },
          required: ['amount']
        }
      })

      const analysis = await integrationSchemaAnalyzerService.analyzeToolPair(
        sourceTool,
        targetTool,
        false
      )

      const amountMapping = analysis.fieldMappings.find(m => m.targetField === 'amount')
      expect(amountMapping).toBeDefined()
      expect(amountMapping?.transformationType).toBe('type_cast')
      expect(amountMapping?.conversionRule).toContain('string')
      expect(amountMapping?.conversionRule).toContain('number')
    })

    it('should identify unmapped fields', async () => {
      const sourceTool = createMockTool({
        id: 'source_tool',
        name: 'Source Tool',
        outputSchema: {
          type: 'object',
          properties: {
            commonField: { type: 'string' },
            sourceOnly: { type: 'string' }
          }
        }
      })

      const targetTool = createMockTool({
        id: 'target_tool',
        name: 'Target Tool',
        inputSchema: {
          type: 'object',
          properties: {
            commonField: { type: 'string' },
            targetOnly: { type: 'string' }
          }
        }
      })

      const analysis = await integrationSchemaAnalyzerService.analyzeToolPair(
        sourceTool,
        targetTool,
        false
      )

      expect(analysis.unmappedSourceFields).toContain('sourceOnly')
      expect(analysis.unmappedTargetFields).toContain('targetOnly')
    })

    it('should identify required but missing fields', async () => {
      const sourceTool = createMockTool({
        id: 'source_tool',
        name: 'Source Tool',
        outputSchema: {
          type: 'object',
          properties: {
            partialData: { type: 'string' }
          }
        }
      })

      const targetTool = createMockTool({
        id: 'target_tool',
        name: 'Target Tool',
        inputSchema: {
          type: 'object',
          properties: {
            partialData: { type: 'string' },
            requiredField: { type: 'string' }
          },
          required: ['partialData', 'requiredField']
        }
      })

      const analysis = await integrationSchemaAnalyzerService.analyzeToolPair(
        sourceTool,
        targetTool,
        false
      )

      expect(analysis.requiredButMissing).toContain('requiredField')
      expect(analysis.isCompatible).toBe(false)
    })
  })

  // ==========================================================================
  // Transformation Generation Tests
  // ==========================================================================

  describe('transformation generation', () => {
    it('should generate transformation map with field mappings', async () => {
      const sourceTool = createMockTool({
        id: 'source_tool',
        name: 'Source Tool',
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            value: { type: 'number' }
          }
        }
      })

      const targetTool = createMockTool({
        id: 'target_tool',
        name: 'Target Tool',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            value: { type: 'number' }
          }
        }
      })

      const analysis = await integrationSchemaAnalyzerService.analyzeToolPair(
        sourceTool,
        targetTool,
        true // Generate code
      )

      expect(analysis.transformationMap).toBeDefined()
      expect(analysis.transformationMap?.fieldMappings).toHaveLength(2)
      expect(analysis.transformationMap?.transformFunction).toBeDefined()
      expect(analysis.transformationMap?.transformFunction).toContain('function transform')
    })

    it('should generate type conversion code', async () => {
      const sourceTool = createMockTool({
        id: 'source_tool',
        name: 'Source Tool',
        outputSchema: {
          type: 'object',
          properties: {
            count: { type: 'string' }
          }
        }
      })

      const targetTool = createMockTool({
        id: 'target_tool',
        name: 'Target Tool',
        inputSchema: {
          type: 'object',
          properties: {
            count: { type: 'number' }
          }
        }
      })

      const analysis = await integrationSchemaAnalyzerService.analyzeToolPair(
        sourceTool,
        targetTool,
        true
      )

      expect(analysis.transformationMap?.typeConversions.length).toBeGreaterThan(0)

      const stringToNumber = analysis.transformationMap?.typeConversions.find(
        tc => tc.sourceType === 'string' && tc.targetType === 'number'
      )
      expect(stringToNumber).toBeDefined()
      expect(stringToNumber?.conversionFunction).toContain('parseFloat')
    })

    it('should generate default values for missing required fields', async () => {
      const sourceTool = createMockTool({
        id: 'source_tool',
        name: 'Source Tool',
        outputSchema: {
          type: 'object',
          properties: {
            data: { type: 'string' }
          }
        }
      })

      const targetTool = createMockTool({
        id: 'target_tool',
        name: 'Target Tool',
        inputSchema: {
          type: 'object',
          properties: {
            data: { type: 'string' },
            status: { type: 'string', default: 'pending' }
          },
          required: ['data', 'status']
        }
      })

      const analysis = await integrationSchemaAnalyzerService.analyzeToolPair(
        sourceTool,
        targetTool,
        true
      )

      expect(analysis.transformationMap?.defaultValues).toBeDefined()
      expect(analysis.transformationMap?.defaultValues.status).toBe('pending')
    })

    it('should generate reverse transformation when possible', async () => {
      const sourceTool = createMockTool({
        id: 'source_tool',
        name: 'Source Tool',
        outputSchema: {
          type: 'object',
          properties: {
            a: { type: 'string' },
            b: { type: 'number' }
          }
        }
      })

      const targetTool = createMockTool({
        id: 'target_tool',
        name: 'Target Tool',
        inputSchema: {
          type: 'object',
          properties: {
            a: { type: 'string' },
            b: { type: 'number' }
          }
        }
      })

      const analysis = await integrationSchemaAnalyzerService.analyzeToolPair(
        sourceTool,
        targetTool,
        true
      )

      // Direct mappings should allow reverse transformation
      expect(analysis.transformationMap?.reverseFunction).toBeDefined()
      expect(analysis.transformationMap?.reverseFunction).toContain('reverseTransform')
    })
  })

  // ==========================================================================
  // Chain Analysis Tests
  // ==========================================================================

  describe('analyzeChain', () => {
    it('should analyze entire chain of tools', async () => {
      const tool1 = createMockTool({
        id: 'tool_1',
        name: 'Tool 1',
        outputSchema: {
          type: 'object',
          properties: {
            orderId: { type: 'string' },
            amount: { type: 'number' }
          }
        }
      })

      const tool2 = createMockTool({
        id: 'tool_2',
        name: 'Tool 2',
        inputSchema: {
          type: 'object',
          properties: {
            orderId: { type: 'string' },
            amount: { type: 'number' }
          }
        },
        outputSchema: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      })

      const tool3 = createMockTool({
        id: 'tool_3',
        name: 'Tool 3',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string' }
          }
        }
      })

      const chain = createMockChain([
        {
          order: 1,
          tool: tool1,
          capability: 'data_fetch',
          requiresTransformation: false
        },
        {
          order: 2,
          tool: tool2,
          capability: 'transform',
          requiresTransformation: false
        },
        {
          order: 3,
          tool: tool3,
          capability: 'notification',
          requiresTransformation: true
        }
      ])

      const result = await integrationSchemaAnalyzerService.analyzeChain({
        chain,
        generateCode: true
      })

      expect(result.chainId).toBe(chain.id)
      expect(result.pairAnalyses).toHaveLength(2) // 3 tools = 2 pairs
      expect(result.transformationMaps.length).toBeGreaterThan(0)
    })

    it('should calculate overall compatibility score', async () => {
      const tool1 = createMockTool({
        id: 'tool_1',
        name: 'Tool 1',
        outputSchema: {
          type: 'object',
          properties: {
            field1: { type: 'string' }
          }
        }
      })

      const tool2 = createMockTool({
        id: 'tool_2',
        name: 'Tool 2',
        inputSchema: {
          type: 'object',
          properties: {
            field1: { type: 'string' }
          }
        }
      })

      const chain = createMockChain([
        { order: 1, tool: tool1, capability: 'step1', requiresTransformation: false },
        { order: 2, tool: tool2, capability: 'step2', requiresTransformation: false }
      ])

      const result = await integrationSchemaAnalyzerService.analyzeChain({
        chain,
        generateCode: true
      })

      expect(result.overallCompatibilityScore).toBeGreaterThan(0)
      expect(result.overallCompatibilityScore).toBeLessThanOrEqual(1)
    })

    it('should detect chain incompatibility', async () => {
      const tool1 = createMockTool({
        id: 'tool_1',
        name: 'Tool 1',
        outputSchema: {
          type: 'object',
          properties: {
            unrelatedField: { type: 'string' }
          }
        }
      })

      const tool2 = createMockTool({
        id: 'tool_2',
        name: 'Tool 2',
        inputSchema: {
          type: 'object',
          properties: {
            requiredField: { type: 'string' }
          },
          required: ['requiredField']
        }
      })

      const chain = createMockChain([
        { order: 1, tool: tool1, capability: 'step1', requiresTransformation: false },
        { order: 2, tool: tool2, capability: 'step2', requiresTransformation: true }
      ])

      const result = await integrationSchemaAnalyzerService.analyzeChain({
        chain,
        generateCode: true
      })

      expect(result.isChainCompatible).toBe(false)
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('should throw in strict mode when required fields missing', async () => {
      const tool1 = createMockTool({
        id: 'tool_1',
        name: 'Tool 1',
        outputSchema: {
          type: 'object',
          properties: {}
        }
      })

      const tool2 = createMockTool({
        id: 'tool_2',
        name: 'Tool 2',
        inputSchema: {
          type: 'object',
          properties: {
            requiredField: { type: 'string' }
          },
          required: ['requiredField']
        }
      })

      const chain = createMockChain([
        { order: 1, tool: tool1, capability: 'step1', requiresTransformation: false },
        { order: 2, tool: tool2, capability: 'step2', requiresTransformation: true }
      ])

      await expect(
        integrationSchemaAnalyzerService.analyzeChain({
          chain,
          generateCode: true,
          strictMode: true
        })
      ).rejects.toThrow('Schema analysis failed')
    })

    it('should calculate data integrity risk', async () => {
      const tool1 = createMockTool({
        id: 'tool_1',
        name: 'Tool 1',
        outputSchema: {
          type: 'object',
          properties: {
            field1: { type: 'string' }
          }
        }
      })

      const tool2 = createMockTool({
        id: 'tool_2',
        name: 'Tool 2',
        inputSchema: {
          type: 'object',
          properties: {
            field1: { type: 'string' },
            required1: { type: 'string' },
            required2: { type: 'string' },
            required3: { type: 'string' }
          },
          required: ['field1', 'required1', 'required2', 'required3']
        }
      })

      const chain = createMockChain([
        { order: 1, tool: tool1, capability: 'step1', requiresTransformation: false },
        { order: 2, tool: tool2, capability: 'step2', requiresTransformation: true }
      ])

      const result = await integrationSchemaAnalyzerService.analyzeChain({
        chain,
        generateCode: true
      })

      expect(result.overallDataIntegrityRisk).toBe('high')
    })
  })

  // ==========================================================================
  // Score Calculation Tests
  // ==========================================================================

  describe('score calculations', () => {
    it('should calculate high compatibility score for exact matches', async () => {
      const sourceTool = createMockTool({
        id: 'source_tool',
        name: 'Source Tool',
        outputSchema: {
          type: 'object',
          properties: {
            a: { type: 'string' },
            b: { type: 'number' },
            c: { type: 'boolean' }
          }
        }
      })

      const targetTool = createMockTool({
        id: 'target_tool',
        name: 'Target Tool',
        inputSchema: {
          type: 'object',
          properties: {
            a: { type: 'string' },
            b: { type: 'number' },
            c: { type: 'boolean' }
          }
        }
      })

      const analysis = await integrationSchemaAnalyzerService.analyzeToolPair(
        sourceTool,
        targetTool,
        false
      )

      expect(analysis.compatibilityScore).toBe(1)
    })

    it('should calculate lower compatibility score for fuzzy matches', async () => {
      const sourceTool = createMockTool({
        id: 'source_tool',
        name: 'Source Tool',
        outputSchema: {
          type: 'object',
          properties: {
            user_name: { type: 'string' },
            user_email: { type: 'string' }
          }
        }
      })

      const targetTool = createMockTool({
        id: 'target_tool',
        name: 'Target Tool',
        inputSchema: {
          type: 'object',
          properties: {
            userName: { type: 'string' },
            userEmail: { type: 'string' }
          }
        }
      })

      const analysis = await integrationSchemaAnalyzerService.analyzeToolPair(
        sourceTool,
        targetTool,
        false
      )

      expect(analysis.compatibilityScore).toBeLessThan(1)
      expect(analysis.compatibilityScore).toBeGreaterThan(0.5)
    })

    it('should calculate complexity score based on transformations', async () => {
      const sourceTool = createMockTool({
        id: 'source_tool',
        name: 'Source Tool',
        outputSchema: {
          type: 'object',
          properties: {
            stringNum: { type: 'string' },
            stringBool: { type: 'string' },
            stringDate: { type: 'string' }
          }
        }
      })

      const targetTool = createMockTool({
        id: 'target_tool',
        name: 'Target Tool',
        inputSchema: {
          type: 'object',
          properties: {
            stringNum: { type: 'number' },
            stringBool: { type: 'boolean' },
            stringDate: { type: 'string', format: 'date-time' }
          }
        }
      })

      const analysis = await integrationSchemaAnalyzerService.analyzeToolPair(
        sourceTool,
        targetTool,
        true
      )

      expect(analysis.transformationMap?.complexityScore).toBeGreaterThan(0)
    })
  })

  // ==========================================================================
  // Warning & Suggestion Tests
  // ==========================================================================

  describe('warnings and suggestions', () => {
    it('should generate warnings for missing required fields', async () => {
      const sourceTool = createMockTool({
        id: 'source_tool',
        name: 'Source Tool',
        outputSchema: {
          type: 'object',
          properties: {}
        }
      })

      const targetTool = createMockTool({
        id: 'target_tool',
        name: 'Target Tool',
        inputSchema: {
          type: 'object',
          properties: {
            required1: { type: 'string' },
            required2: { type: 'string' }
          },
          required: ['required1', 'required2']
        }
      })

      const analysis = await integrationSchemaAnalyzerService.analyzeToolPair(
        sourceTool,
        targetTool,
        false
      )

      expect(analysis.warnings.length).toBeGreaterThan(0)
      expect(analysis.warnings.some(w => w.includes('Missing required'))).toBe(true)
    })

    it('should generate suggestions for unmapped fields', async () => {
      const sourceTool = createMockTool({
        id: 'source_tool',
        name: 'Source Tool',
        outputSchema: {
          type: 'object',
          properties: {
            sourceField: { type: 'string' }
          }
        }
      })

      const targetTool = createMockTool({
        id: 'target_tool',
        name: 'Target Tool',
        inputSchema: {
          type: 'object',
          properties: {
            targetField: { type: 'string' }
          }
        }
      })

      const analysis = await integrationSchemaAnalyzerService.analyzeToolPair(
        sourceTool,
        targetTool,
        false
      )

      expect(analysis.suggestions.length).toBeGreaterThan(0)
    })

    it('should warn about high data integrity risk', async () => {
      const sourceTool = createMockTool({
        id: 'source_tool',
        name: 'Source Tool',
        outputSchema: {
          type: 'object',
          properties: {}
        }
      })

      const targetTool = createMockTool({
        id: 'target_tool',
        name: 'Target Tool',
        inputSchema: {
          type: 'object',
          properties: {
            r1: { type: 'string' },
            r2: { type: 'string' },
            r3: { type: 'string' }
          },
          required: ['r1', 'r2', 'r3']
        }
      })

      const analysis = await integrationSchemaAnalyzerService.analyzeToolPair(
        sourceTool,
        targetTool,
        false
      )

      expect(analysis.dataIntegrityRisk).toBe('high')
      expect(analysis.warnings.some(w => w.includes('High risk'))).toBe(true)
    })
  })

  // ==========================================================================
  // Cache Management Tests
  // ==========================================================================

  describe('cache management', () => {
    it('should cache transformation maps', async () => {
      const sourceTool = createMockTool({
        id: 'source_tool',
        name: 'Source Tool',
        outputSchema: {
          type: 'object',
          properties: { field: { type: 'string' } }
        }
      })

      const targetTool = createMockTool({
        id: 'target_tool',
        name: 'Target Tool',
        inputSchema: {
          type: 'object',
          properties: { field: { type: 'string' } }
        }
      })

      // First analysis
      const analysis1 = await integrationSchemaAnalyzerService.analyzeToolPair(
        sourceTool,
        targetTool,
        true
      )

      // Second analysis should use cache
      const analysis2 = await integrationSchemaAnalyzerService.analyzeToolPair(
        sourceTool,
        targetTool,
        true
      )

      expect(analysis1.transformationMap?.id).toBe(analysis2.transformationMap?.id)
    })

    it('should clear caches', async () => {
      const tool = createMockTool({
        outputSchema: { field: 'value' }
      })

      // Populate cache
      await integrationSchemaAnalyzerService.extractSchema(tool, 'output')

      // Clear caches
      integrationSchemaAnalyzerService.clearCaches()

      // No error should occur - cache should be empty
      const schema = await integrationSchemaAnalyzerService.extractSchema(tool, 'output')
      expect(schema).toBeDefined()
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle tools with no schemas', async () => {
      const sourceTool = createMockTool({
        id: 'source_tool',
        name: 'Source Tool',
        outputSchema: undefined
      })

      const targetTool = createMockTool({
        id: 'target_tool',
        name: 'Target Tool',
        inputSchema: undefined
      })

      const analysis = await integrationSchemaAnalyzerService.analyzeToolPair(
        sourceTool,
        targetTool,
        false
      )

      expect(analysis.fieldMappings).toHaveLength(0)
      expect(analysis.isCompatible).toBe(true) // No requirements to fail
    })

    it('should handle discovered tools', async () => {
      const sourceTool = createMockDiscoveredTool({
        id: 'discovered_source',
        name: 'Discovered Source',
        outputSchema: {
          type: 'object',
          properties: {
            data: { type: 'string' }
          }
        }
      })

      const targetTool = createMockDiscoveredTool({
        id: 'discovered_target',
        name: 'Discovered Target',
        inputSchema: {
          type: 'object',
          properties: {
            data: { type: 'string' }
          }
        }
      })

      const analysis = await integrationSchemaAnalyzerService.analyzeToolPair(
        sourceTool,
        targetTool,
        true
      )

      expect(analysis.fieldMappings).toHaveLength(1)
      expect(analysis.isCompatible).toBe(true)
    })

    it('should handle chain with single tool', async () => {
      const tool = createMockTool({
        id: 'only_tool',
        name: 'Only Tool'
      })

      const chain = createMockChain([
        { order: 1, tool, capability: 'single', requiresTransformation: false }
      ])

      const result = await integrationSchemaAnalyzerService.analyzeChain({
        chain,
        generateCode: true
      })

      expect(result.pairAnalyses).toHaveLength(0)
      expect(result.isChainCompatible).toBe(true)
    })

    it('should handle deeply nested schemas', async () => {
      const sourceTool = createMockTool({
        id: 'source_tool',
        name: 'Source Tool',
        outputSchema: {
          type: 'object',
          properties: {
            level1: {
              type: 'object',
              properties: {
                level2: {
                  type: 'object',
                  properties: {
                    level3: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      })

      const schema = await integrationSchemaAnalyzerService.extractSchema(sourceTool, 'output')

      expect(schema.fields.length).toBeGreaterThan(0)
      const level1 = schema.fields.find(f => f.name === 'level1')
      expect(level1?.nested).toBeDefined()
    })
  })
})
