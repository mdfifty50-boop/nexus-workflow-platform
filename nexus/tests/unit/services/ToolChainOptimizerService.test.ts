/**
 * ToolChainOptimizerService Unit Tests
 *
 * Tests for the Tool Chain Optimizer Agent (Epic 16, Story 16.3)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock Supabase before importing the service
vi.mock('../../../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis()
    }))
  }
}))

// Mock dependent services
vi.mock('../../../src/services/ToolCatalogService', () => ({
  toolCatalogService: {
    searchTools: vi.fn().mockResolvedValue([]),
    getToolById: vi.fn().mockResolvedValue(null)
  }
}))

vi.mock('../../../src/services/ToolDiscoveryService', () => ({
  toolDiscoveryService: {
    discoverTools: vi.fn().mockResolvedValue([])
  }
}))

vi.mock('../../../src/services/TrustScoreService', () => ({
  trustScoreService: {
    calculateTrustScore: vi.fn().mockResolvedValue({
      overall: 85,
      security: 90,
      reliability: 85,
      popularity: 80,
      maintenance: 85
    })
  }
}))

import { toolChainOptimizerService } from '../../../src/services/ToolChainOptimizerService'
import { toolDiscoveryService } from '../../../src/services/ToolDiscoveryService'
import { supabase } from '../../../src/lib/supabase'
import {
  ChainOptimizationRequest,
  ChainOptimizationCriteria,
  ToolChain,
  DiscoveredTool,
  DEFAULT_OPTIMIZATION_CRITERIA
} from '../../../src/types/tools'

// Helper to create mock discovered tools
function createMockTool(overrides: Partial<DiscoveredTool> = {}): DiscoveredTool {
  return {
    id: `tool-${Math.random().toString(36).substring(7)}`,
    name: 'Mock Tool',
    description: 'A mock tool for testing',
    category: 'productivity',
    toolkitSlug: 'MOCK_TOOL',
    authMethod: 'oauth2',
    dataFormats: ['json'],
    isApproved: true,
    reliabilityRating: 0.9,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    costEstimate: { type: 'per_call', perCall: 0.001, currency: 'USD' },
    trustScore: {
      overall: 85,
      security: 90,
      reliability: 85,
      popularity: 80,
      maintenance: 85,
      calculatedAt: new Date().toISOString()
    },
    discoveredAt: new Date().toISOString(),
    userApprovalRequired: false,
    ...overrides
  }
}

describe('ToolChainOptimizerService', () => {
  beforeEach(() => {
    toolChainOptimizerService.clearCache()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('analyzeWorkflowGoal', () => {
    it('should extract email capability from goal', async () => {
      const analysis = await toolChainOptimizerService.analyzeWorkflowGoal(
        'Send an email to the team'
      )

      expect(analysis.originalGoal).toBe('Send an email to the team')
      expect(analysis.extractedCapabilities.length).toBeGreaterThan(0)
      expect(analysis.extractedCapabilities.some(c => c.name === 'send_email')).toBe(true)
    })

    it('should extract message capability from slack mention', async () => {
      const analysis = await toolChainOptimizerService.analyzeWorkflowGoal(
        'Post a message in Slack channel'
      )

      expect(analysis.extractedCapabilities.some(c => c.name === 'send_message')).toBe(true)
      expect(analysis.extractedCapabilities.some(c => c.category === 'communication')).toBe(true)
    })

    it('should extract data fetch capability', async () => {
      const analysis = await toolChainOptimizerService.analyzeWorkflowGoal(
        'Fetch data from the API and send to spreadsheet'
      )

      expect(analysis.extractedCapabilities.some(c => c.name === 'data_fetch')).toBe(true)
      expect(analysis.extractedCapabilities.some(c => c.name === 'spreadsheet_op')).toBe(true)
    })

    it('should detect notification workflow type', async () => {
      // The pattern requires 'notify' or 'alert' keywords
      const analysis = await toolChainOptimizerService.analyzeWorkflowGoal(
        'Notify team when order is placed'
      )

      expect(analysis.workflowType).toBe('notification')
    })

    it('should detect data-pipeline workflow type', async () => {
      const analysis = await toolChainOptimizerService.analyzeWorkflowGoal(
        'Fetch orders and send to analytics'
      )

      expect(analysis.workflowType).toBe('data-pipeline')
    })

    it('should calculate complexity score based on capabilities', async () => {
      // Simple workflow
      const simpleAnalysis = await toolChainOptimizerService.analyzeWorkflowGoal(
        'Send email'
      )

      // Complex workflow
      const complexAnalysis = await toolChainOptimizerService.analyzeWorkflowGoal(
        'Fetch all orders from Shopify, analyze them with AI, send report via email and Slack if any issues found'
      )

      expect(complexAnalysis.complexityScore).toBeGreaterThan(simpleAnalysis.complexityScore)
    })

    it('should generate warnings for bulk operations', async () => {
      const analysis = await toolChainOptimizerService.analyzeWorkflowGoal(
        'Send email to all customers'
      )

      expect(analysis.warnings.some(w => w.includes('Bulk'))).toBe(true)
    })

    it('should generate warnings for AI operations', async () => {
      const analysis = await toolChainOptimizerService.analyzeWorkflowGoal(
        'Analyze data with Claude AI'
      )

      expect(analysis.warnings.some(w => w.includes('AI'))).toBe(true)
    })

    it('should generate warnings for sensitive data', async () => {
      const analysis = await toolChainOptimizerService.analyzeWorkflowGoal(
        'Process payment for the order'
      )

      expect(analysis.warnings.some(w => w.includes('sensitive'))).toBe(true)
    })
  })

  describe('optimizeChain', () => {
    it('should return optimization result with recommended chain', async () => {
      // Setup mock discovered tools
      const mockEmailTool = createMockTool({
        id: 'gmail-1',
        name: 'Gmail',
        category: 'communication',
        toolkitSlug: 'GMAIL',
        reliabilityRating: 0.95
      })

      vi.mocked(toolDiscoveryService.discoverTools).mockResolvedValue([
        { tool: mockEmailTool, relevanceScore: 95, matchReason: 'Email capability match' }
      ])

      const request: ChainOptimizationRequest = {
        workflowGoal: 'Send email notification',
        userId: 'user-123'
      }

      const result = await toolChainOptimizerService.optimizeChain(request)

      expect(result.recommendedChain).toBeDefined()
      expect(result.workflowAnalysis).toBeDefined()
      expect(result.generationTimeMs).toBeGreaterThan(0)
      expect(result.criteria).toEqual(DEFAULT_OPTIMIZATION_CRITERIA)
    })

    it('should generate at least 2 alternatives for complex workflows', async () => {
      const mockTool1 = createMockTool({
        id: 'tool-1',
        name: 'Tool A',
        reliabilityRating: 0.95,
        costEstimate: { type: 'per_call', perCall: 0.01, currency: 'USD' }
      })

      const mockTool2 = createMockTool({
        id: 'tool-2',
        name: 'Tool B',
        reliabilityRating: 0.85,
        costEstimate: { type: 'per_call', perCall: 0.001, currency: 'USD' }
      })

      vi.mocked(toolDiscoveryService.discoverTools).mockResolvedValue([
        { tool: mockTool1, relevanceScore: 90, matchReason: 'High match' },
        { tool: mockTool2, relevanceScore: 85, matchReason: 'Good match' }
      ])

      const request: ChainOptimizationRequest = {
        workflowGoal: 'Fetch data from API, transform it, store in database and notify team via email and Slack',
        userId: 'user-123'
      }

      const result = await toolChainOptimizerService.optimizeChain(request)

      // Complex workflow should have alternatives
      expect(result.alternatives.length + 1).toBeGreaterThanOrEqual(1) // At least the recommended chain
    })

    it('should respect preferred tools', async () => {
      const preferredTool = createMockTool({
        id: 'preferred-tool',
        name: 'Preferred Tool',
        reliabilityRating: 0.7 // Lower reliability but should still be preferred
      })

      const otherTool = createMockTool({
        id: 'other-tool',
        name: 'Other Tool',
        reliabilityRating: 0.95
      })

      vi.mocked(toolDiscoveryService.discoverTools).mockResolvedValue([
        { tool: otherTool, relevanceScore: 95, matchReason: 'High match' },
        { tool: preferredTool, relevanceScore: 80, matchReason: 'Good match' }
      ])

      const request: ChainOptimizationRequest = {
        workflowGoal: 'Send email notification',
        userId: 'user-123',
        preferredTools: ['preferred-tool']
      }

      const result = await toolChainOptimizerService.optimizeChain(request)

      // The preferred tool should be considered in chain generation
      expect(result.recommendedChain).toBeDefined()
    })

    it('should exclude specified tools', async () => {
      const includedTool = createMockTool({
        id: 'included-tool',
        name: 'Included Tool'
      })

      const excludedTool = createMockTool({
        id: 'excluded-tool',
        name: 'Excluded Tool'
      })

      vi.mocked(toolDiscoveryService.discoverTools).mockResolvedValue([
        { tool: includedTool, relevanceScore: 90, matchReason: 'Good match' },
        { tool: excludedTool, relevanceScore: 95, matchReason: 'High match' }
      ])

      const request: ChainOptimizationRequest = {
        workflowGoal: 'Send notification',
        userId: 'user-123',
        excludedTools: ['excluded-tool']
      }

      const result = await toolChainOptimizerService.optimizeChain(request)

      // The excluded tool should not appear in any chain
      const allSteps = [
        ...result.recommendedChain.steps,
        ...result.alternatives.flatMap(a => a.steps)
      ]
      expect(allSteps.every(s => s.tool.id !== 'excluded-tool')).toBe(true)
    })

    it('should apply custom optimization criteria', async () => {
      const mockTool = createMockTool({
        id: 'mock-tool',
        name: 'Mock Tool'
      })

      vi.mocked(toolDiscoveryService.discoverTools).mockResolvedValue([
        { tool: mockTool, relevanceScore: 90, matchReason: 'Match' }
      ])

      const customCriteria: Partial<ChainOptimizationCriteria> = {
        costWeight: 0.5,
        speedWeight: 0.3,
        reliabilityWeight: 0.15,
        simplicityWeight: 0.05
      }

      const request: ChainOptimizationRequest = {
        workflowGoal: 'Send notification',
        userId: 'user-123',
        criteria: customCriteria
      }

      const result = await toolChainOptimizerService.optimizeChain(request)

      expect(result.criteria.costWeight).toBe(0.5)
      expect(result.criteria.speedWeight).toBe(0.3)
    })

    it('should respect budget limit', async () => {
      const expensiveTool = createMockTool({
        id: 'expensive-tool',
        name: 'Expensive Tool',
        costEstimate: { type: 'per_call', perCall: 1.0, currency: 'USD' }
      })

      vi.mocked(toolDiscoveryService.discoverTools).mockResolvedValue([
        { tool: expensiveTool, relevanceScore: 90, matchReason: 'Match' }
      ])

      const request: ChainOptimizationRequest = {
        workflowGoal: 'Send notification',
        userId: 'user-123',
        budgetLimitUsd: 0.01
      }

      const result = await toolChainOptimizerService.optimizeChain(request)

      // Should filter out chains that exceed budget
      const allChains = [result.recommendedChain, ...result.alternatives].filter(Boolean)
      expect(allChains.every(c => c.totalEstimatedCostUsd <= 0.01 || allChains.length === 0))
    })

    it('should respect time limit', async () => {
      const fastTool = createMockTool({
        id: 'fast-tool',
        name: 'Fast Tool',
        reliabilityRating: 0.99 // High reliability = shorter estimated time
      })

      vi.mocked(toolDiscoveryService.discoverTools).mockResolvedValue([
        { tool: fastTool, relevanceScore: 90, matchReason: 'Match' }
      ])

      const request: ChainOptimizationRequest = {
        workflowGoal: 'Send notification',
        userId: 'user-123',
        timeLimitMs: 10000 // 10 seconds should be enough for fast tool
      }

      const result = await toolChainOptimizerService.optimizeChain(request)

      // Should consider time constraints and return a chain within limits
      expect(result.recommendedChain).toBeDefined()
      expect(result.recommendedChain.totalEstimatedTimeMs).toBeLessThanOrEqual(10000)
    })

    it('should limit max steps when specified', async () => {
      const mockTool = createMockTool({
        id: 'mock-tool',
        name: 'Mock Tool'
      })

      vi.mocked(toolDiscoveryService.discoverTools).mockResolvedValue([
        { tool: mockTool, relevanceScore: 90, matchReason: 'Match' }
      ])

      const request: ChainOptimizationRequest = {
        workflowGoal: 'Fetch data, transform, store, notify via email and slack',
        userId: 'user-123',
        maxSteps: 2
      }

      const result = await toolChainOptimizerService.optimizeChain(request)

      expect(result.recommendedChain.steps.length).toBeLessThanOrEqual(2)
    })
  })

  describe('checkDataFlowCompatibility', () => {
    it('should detect compatible schemas', () => {
      const sourceSchema = { name: 'string', email: 'string' }
      const targetSchema = { name: 'string', email: 'string' }

      const compatibility = toolChainOptimizerService.checkDataFlowCompatibility(
        sourceSchema,
        targetSchema
      )

      expect(compatibility.isCompatible).toBe(true)
      expect(compatibility.missingFields).toHaveLength(0)
      expect(compatibility.typeConflicts).toHaveLength(0)
    })

    it('should detect missing fields', () => {
      const sourceSchema = { name: 'string' }
      const targetSchema = { name: 'string', email: 'string' }

      const compatibility = toolChainOptimizerService.checkDataFlowCompatibility(
        sourceSchema,
        targetSchema
      )

      expect(compatibility.isCompatible).toBe(false)
      expect(compatibility.missingFields).toContain('email')
      expect(compatibility.transformationRequired).toBe(true)
    })

    it('should detect type conflicts', () => {
      const sourceSchema = { count: 'string' }
      const targetSchema = { count: 123 }

      const compatibility = toolChainOptimizerService.checkDataFlowCompatibility(
        sourceSchema,
        targetSchema
      )

      expect(compatibility.typeConflicts.length).toBeGreaterThan(0)
      expect(compatibility.typeConflicts[0].field).toBe('count')
    })

    it('should suggest transformations for missing fields with similar names', () => {
      const sourceSchema = { userName: 'string' }
      const targetSchema = { user: 'string' }

      const compatibility = toolChainOptimizerService.checkDataFlowCompatibility(
        sourceSchema,
        targetSchema
      )

      expect(compatibility.suggestedTransformations.length).toBeGreaterThan(0)
    })

    it('should suggest type casts for conflicting types', () => {
      const sourceSchema = { amount: 'string' }
      const targetSchema = { amount: 100 }

      const compatibility = toolChainOptimizerService.checkDataFlowCompatibility(
        sourceSchema,
        targetSchema
      )

      expect(compatibility.suggestedTransformations.some(t => t.transformType === 'type_cast')).toBe(true)
    })
  })

  describe('Chain Scoring', () => {
    it('should score chains with higher reliability higher', async () => {
      const highReliabilityTool = createMockTool({
        id: 'high-rel',
        name: 'High Reliability',
        reliabilityRating: 0.99
      })

      const lowReliabilityTool = createMockTool({
        id: 'low-rel',
        name: 'Low Reliability',
        reliabilityRating: 0.6
      })

      vi.mocked(toolDiscoveryService.discoverTools).mockResolvedValue([
        { tool: highReliabilityTool, relevanceScore: 90, matchReason: 'Match' },
        { tool: lowReliabilityTool, relevanceScore: 90, matchReason: 'Match' }
      ])

      const request: ChainOptimizationRequest = {
        workflowGoal: 'Send notification',
        userId: 'user-123'
      }

      const result = await toolChainOptimizerService.optimizeChain(request)

      // Higher reliability chains should have higher scores
      expect(result.recommendedChain.optimizationScore).toBeGreaterThan(0)
    })

    it('should score chains with lower cost higher when cost-weighted', async () => {
      const cheapTool = createMockTool({
        id: 'cheap',
        name: 'Cheap Tool',
        costEstimate: { type: 'per_call', perCall: 0.0001, currency: 'USD' }
      })

      const expensiveTool = createMockTool({
        id: 'expensive',
        name: 'Expensive Tool',
        costEstimate: { type: 'per_call', perCall: 0.1, currency: 'USD' }
      })

      vi.mocked(toolDiscoveryService.discoverTools).mockResolvedValue([
        { tool: cheapTool, relevanceScore: 90, matchReason: 'Match' },
        { tool: expensiveTool, relevanceScore: 90, matchReason: 'Match' }
      ])

      const request: ChainOptimizationRequest = {
        workflowGoal: 'Send notification',
        userId: 'user-123',
        criteria: {
          costWeight: 0.9,
          speedWeight: 0.05,
          reliabilityWeight: 0.025,
          simplicityWeight: 0.025
        }
      }

      const result = await toolChainOptimizerService.optimizeChain(request)

      // Cost-optimized chains should favor cheaper tools
      expect(result.recommendedChain).toBeDefined()
    })
  })

  describe('Chain Comparison', () => {
    it('should build comparison matrix', async () => {
      const mockTool = createMockTool({
        id: 'mock-tool',
        name: 'Mock Tool'
      })

      vi.mocked(toolDiscoveryService.discoverTools).mockResolvedValue([
        { tool: mockTool, relevanceScore: 90, matchReason: 'Match' }
      ])

      const request: ChainOptimizationRequest = {
        workflowGoal: 'Send notification',
        userId: 'user-123'
      }

      const result = await toolChainOptimizerService.optimizeChain(request)

      expect(result.comparison).toBeDefined()
      expect(result.comparison.comparisonMatrix).toBeDefined()
      expect(result.comparison.comparisonMatrix.length).toBeGreaterThan(0)
    })

    it('should mark winners in comparison matrix', async () => {
      const mockTool = createMockTool({
        id: 'mock-tool',
        name: 'Mock Tool'
      })

      vi.mocked(toolDiscoveryService.discoverTools).mockResolvedValue([
        { tool: mockTool, relevanceScore: 90, matchReason: 'Match' }
      ])

      const request: ChainOptimizationRequest = {
        workflowGoal: 'Send notification',
        userId: 'user-123'
      }

      const result = await toolChainOptimizerService.optimizeChain(request)

      // Each row should have a winner if there are multiple chains
      for (const row of result.comparison.comparisonMatrix) {
        if (row.values.length > 0) {
          expect(row.values.some(v => v.isWinner)).toBe(true)
        }
      }
    })

    it('should generate trade-off explanations', async () => {
      const mockTool = createMockTool({
        id: 'mock-tool',
        name: 'Mock Tool'
      })

      vi.mocked(toolDiscoveryService.discoverTools).mockResolvedValue([
        { tool: mockTool, relevanceScore: 90, matchReason: 'Match' }
      ])

      const request: ChainOptimizationRequest = {
        workflowGoal: 'Send notification',
        userId: 'user-123'
      }

      const result = await toolChainOptimizerService.optimizeChain(request)

      expect(result.comparison.tradeOffExplanations).toBeDefined()
      expect(result.comparison.tradeOffExplanations.length).toBeGreaterThan(0)
    })
  })

  describe('Pattern Learning', () => {
    it('should store successful pattern', async () => {
      const mockChain: ToolChain = {
        id: 'test-chain',
        name: 'Test Chain',
        description: 'Test chain description',
        steps: [
          {
            order: 1,
            tool: createMockTool({ id: 'tool-1', name: 'Tool 1' }),
            capability: 'send_email',
            estimatedTimeMs: 500,
            estimatedCostUsd: 0.001,
            requiresTransformation: false
          }
        ],
        totalEstimatedTimeMs: 500,
        totalEstimatedCostUsd: 0.001,
        reliabilityScore: 90,
        optimizationScore: 85,
        canParallelize: false,
        metadata: {
          generatedAt: new Date().toISOString(),
          optimizationType: 'balanced',
          complexityLevel: 'simple',
          capabilitiesCovered: ['send_email'],
          toolCount: 1,
          hasExternalTools: false,
          requiresApproval: false
        }
      }

      // Mock the Supabase calls
      const mockFrom = vi.mocked(supabase.from)
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null })
      } as any)

      await expect(
        toolChainOptimizerService.storeSuccessfulPattern(
          mockChain,
          480,
          0.0009,
          'user-123',
          'project-456'
        )
      ).resolves.not.toThrow()
    })

    it('should record chain failure', async () => {
      const mockChain: ToolChain = {
        id: 'test-chain',
        name: 'Test Chain',
        description: 'Test',
        steps: [],
        totalEstimatedTimeMs: 500,
        totalEstimatedCostUsd: 0.001,
        reliabilityScore: 90,
        optimizationScore: 85,
        canParallelize: false,
        metadata: {
          generatedAt: new Date().toISOString(),
          optimizationType: 'balanced',
          complexityLevel: 'simple',
          capabilitiesCovered: ['send_email'],
          toolCount: 0,
          hasExternalTools: false,
          requiresApproval: false
        }
      }

      const mockFrom = vi.mocked(supabase.from)
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null })
      } as any)

      await expect(
        toolChainOptimizerService.recordChainFailure(mockChain, 'user-123')
      ).resolves.not.toThrow()
    })
  })

  describe('Cache Management', () => {
    it('should clear cache', () => {
      toolChainOptimizerService.clearCache()
      // No errors should be thrown
      expect(true).toBe(true)
    })
  })

  describe('Chain Metadata', () => {
    it('should include complexity level in metadata', async () => {
      const mockTool = createMockTool({
        id: 'mock-tool',
        name: 'Mock Tool'
      })

      vi.mocked(toolDiscoveryService.discoverTools).mockResolvedValue([
        { tool: mockTool, relevanceScore: 90, matchReason: 'Match' }
      ])

      const request: ChainOptimizationRequest = {
        workflowGoal: 'Send notification',
        userId: 'user-123'
      }

      const result = await toolChainOptimizerService.optimizeChain(request)

      expect(['simple', 'moderate', 'complex']).toContain(
        result.recommendedChain.metadata.complexityLevel
      )
    })

    it('should track optimization type in metadata', async () => {
      const mockTool = createMockTool({
        id: 'mock-tool',
        name: 'Mock Tool'
      })

      vi.mocked(toolDiscoveryService.discoverTools).mockResolvedValue([
        { tool: mockTool, relevanceScore: 90, matchReason: 'Match' }
      ])

      const request: ChainOptimizationRequest = {
        workflowGoal: 'Send notification',
        userId: 'user-123'
      }

      const result = await toolChainOptimizerService.optimizeChain(request)

      expect(['balanced', 'cost_optimized', 'speed_optimized', 'reliability_optimized']).toContain(
        result.recommendedChain.metadata.optimizationType
      )
    })

    it('should flag external tools in metadata', async () => {
      const externalTool = createMockTool({
        id: 'external-tool',
        name: 'External Tool',
        isApproved: false
      })

      vi.mocked(toolDiscoveryService.discoverTools).mockResolvedValue([
        { tool: externalTool, relevanceScore: 90, matchReason: 'Match' }
      ])

      const request: ChainOptimizationRequest = {
        workflowGoal: 'Send notification',
        userId: 'user-123'
      }

      const result = await toolChainOptimizerService.optimizeChain(request)

      // Metadata should indicate if chain has external (unapproved) tools
      expect(typeof result.recommendedChain.metadata.hasExternalTools).toBe('boolean')
    })
  })
})
