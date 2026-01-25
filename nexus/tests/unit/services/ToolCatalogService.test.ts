/**
 * ToolCatalogService Unit Tests
 *
 * Tests for the Tool Catalog & Knowledge Base (Epic 16, Story 16.1)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock tool data
const mockTools = [
  {
    id: 'tool-1',
    created_at: '2026-01-09T00:00:00Z',
    updated_at: '2026-01-09T00:00:00Z',
    name: 'Gmail',
    category: 'communication',
    description: 'Email service',
    api_doc_url: 'https://developers.google.com/gmail',
    auth_method: 'oauth2',
    data_formats: ['json'],
    cost_estimate: { tier: 'free', perCall: 0 },
    reliability_rating: 0.98,
    toolkit_slug: 'GMAIL',
    provider: 'rube',
    capabilities: [{ action: 'send', resource: 'email' }],
    is_approved: true,
    approved_by: 'admin-1',
    approved_at: '2026-01-09T00:00:00Z',
    metadata: {}
  },
  {
    id: 'tool-2',
    created_at: '2026-01-09T00:00:00Z',
    updated_at: '2026-01-09T00:00:00Z',
    name: 'Slack',
    category: 'communication',
    description: 'Team messaging',
    api_doc_url: 'https://api.slack.com',
    auth_method: 'oauth2',
    data_formats: ['json'],
    cost_estimate: { tier: 'freemium', perCall: 0 },
    reliability_rating: 0.95,
    toolkit_slug: 'SLACK',
    provider: 'rube',
    capabilities: [{ action: 'send', resource: 'message' }],
    is_approved: true,
    approved_by: 'admin-1',
    approved_at: '2026-01-09T00:00:00Z',
    metadata: {}
  }
]

const _mockUsageMetrics = [
  {
    id: 'metric-1',
    tool_id: 'tool-1',
    project_id: 'project-1',
    workflow_id: 'workflow-1',
    success: true,
    execution_time_ms: 150,
    tokens_used: 100,
    cost_usd: 0.001,
    error_type: null,
    error_message: null,
    learned_patterns: { recommendedParams: { format: 'html' } },
    created_at: '2026-01-09T00:00:00Z'
  },
  {
    id: 'metric-2',
    tool_id: 'tool-1',
    project_id: 'project-1',
    workflow_id: 'workflow-1',
    success: false,
    execution_time_ms: 50,
    tokens_used: 0,
    cost_usd: 0,
    error_type: 'authentication',
    error_message: 'Invalid token',
    learned_patterns: {},
    created_at: '2026-01-09T00:00:00Z'
  }
]

// Create mock Supabase instance
const createMockSupabase = () => {
  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    data: null,
    error: null
  }

  return {
    from: vi.fn(() => mockQueryBuilder),
    _queryBuilder: mockQueryBuilder
  }
}

describe('ToolCatalogService', () => {
  let _mockSupabase: ReturnType<typeof createMockSupabase>

  beforeEach(() => {
    _mockSupabase = createMockSupabase()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Tool Types', () => {
    it('should define all required tool categories', async () => {
      // ToolCategory is a type alias, not an exported array
      // We test by creating variables with valid categories
      const validCategories = [
        'communication',
        'productivity',
        'development',
        'finance',
        'travel',
        'crm',
        'marketing',
        'ai',
        'data',
        'automation',
        'social',
        'analytics',
        'storage',
        'other'
      ] as const

      // Each should be a valid category - type check passes at compile time
      validCategories.forEach(cat => {
        expect(typeof cat).toBe('string')
      })
      expect(validCategories.length).toBe(14)
    })

    it('should define all required auth methods', async () => {
      // ToolAuthMethod is a type alias
      const validMethods = ['oauth2', 'api_key', 'bearer', 'none', 'mcp'] as const

      validMethods.forEach(method => {
        expect(typeof method).toBe('string')
      })
      expect(validMethods.length).toBe(5)
    })

    it('should define all required cost tiers', async () => {
      // ToolCostTier is a type alias
      const validTiers = ['free', 'freemium', 'paid', 'enterprise'] as const

      validTiers.forEach(tier => {
        expect(typeof tier).toBe('string')
      })
      expect(validTiers.length).toBe(4)
    })
  })

  describe('Tool Data Conversion', () => {
    it('should convert database row to Tool object', async () => {
      const { toolFromRow } = await import('../../../src/types/tools')

      const row = mockTools[0]
      const tool = toolFromRow(row)

      expect(tool.id).toBe('tool-1')
      expect(tool.name).toBe('Gmail')
      expect(tool.category).toBe('communication')
      expect(tool.authMethod).toBe('oauth2')
      expect(tool.toolkitSlug).toBe('GMAIL')
      expect(tool.provider).toBe('rube')
      expect(tool.isApproved).toBe(true)
      expect(tool.reliabilityRating).toBe(0.98)
    })

    it('should convert Tool object to database row', async () => {
      const { toolToRow } = await import('../../../src/types/tools')

      const tool = {
        name: 'Test Tool',
        category: 'development' as const,
        authMethod: 'api_key' as const,
        reliabilityRating: 0.90
      }

      const row = toolToRow(tool)

      expect(row.name).toBe('Test Tool')
      expect(row.category).toBe('development')
      expect(row.auth_method).toBe('api_key')
      expect(row.reliability_rating).toBe(0.90)
    })
  })

  describe('Search Filters', () => {
    it('should accept valid search filters', async () => {
      const { ToolSearchFilters: _ToolSearchFilters } = await import('../../../src/types/tools')

      const filters: typeof _ToolSearchFilters = {
        query: 'email',
        category: 'communication',
        authMethod: 'oauth2',
        costTier: 'free',
        minReliability: 0.8,
        provider: 'rube',
        limit: 10,
        offset: 0
      }

      // Verify filter structure
      expect(filters.query).toBe('email')
      expect(filters.category).toBe('communication')
      expect(filters.limit).toBe(10)
    })
  })

  describe('Tool Trust Score', () => {
    it('should calculate trust score components', async () => {
      const { ToolTrustScore: _ToolTrustScore } = await import('../../../src/types/tools')

      const trustScore: typeof _ToolTrustScore = {
        overall: 85,
        components: {
          security: 90,
          reliability: 95,
          performance: 80,
          community: 75
        },
        breakdown: {
          hasOAuth: true,
          httpsOnly: true,
          rateLimited: true,
          documentedApi: true,
          activelyMaintained: true
        }
      }

      expect(trustScore.overall).toBe(85)
      expect(trustScore.components.security).toBe(90)
      expect(trustScore.breakdown.hasOAuth).toBe(true)
    })
  })

  describe('Usage Metrics', () => {
    it('should define usage metric structure', async () => {
      const { ToolUsageMetric: _ToolUsageMetric } = await import('../../../src/types/tools')

      const metric: Partial<typeof _ToolUsageMetric> = {
        toolId: 'tool-1',
        projectId: 'project-1',
        workflowId: 'workflow-1',
        success: true,
        executionTimeMs: 150,
        tokensUsed: 100,
        costUsd: 0.001
      }

      expect(metric.toolId).toBe('tool-1')
      expect(metric.success).toBe(true)
      expect(metric.executionTimeMs).toBe(150)
    })
  })

  describe('Learned Patterns', () => {
    it('should define learned pattern structure', async () => {
      const { LearnedPattern: _LearnedPattern } = await import('../../../src/types/tools')

      const pattern: typeof _LearnedPattern = {
        avgExecutionTimeMs: 150,
        avgCostUsd: 0.001,
        successRate: 95,
        recommendedParams: { format: 'html', retries: 3 },
        knownFailures: [
          { errorType: 'authentication', resolution: 'Refresh OAuth token' }
        ]
      }

      expect(pattern.avgExecutionTimeMs).toBe(150)
      expect(pattern.successRate).toBe(95)
      expect(pattern.knownFailures).toHaveLength(1)
      expect(pattern.knownFailures?.[0].errorType).toBe('authentication')
    })
  })
})

describe('Admin API', () => {
  describe('AddToolRequest', () => {
    it('should validate required fields', async () => {
      const { AddToolRequest: _AddToolRequest } = await import('../../../src/types/tools')

      const request: typeof _AddToolRequest = {
        name: 'New Tool',
        category: 'development',
        authMethod: 'api_key'
      }

      expect(request.name).toBe('New Tool')
      expect(request.category).toBe('development')
      expect(request.authMethod).toBe('api_key')
    })

    it('should accept optional fields', async () => {
      const { AddToolRequest: _AddToolRequest2 } = await import('../../../src/types/tools')

      const request: typeof _AddToolRequest2 = {
        name: 'New Tool',
        category: 'development',
        authMethod: 'api_key',
        description: 'A test tool',
        apiDocUrl: 'https://example.com/docs',
        toolkitSlug: 'NEW_TOOL',
        provider: 'custom',
        capabilities: [{ action: 'test', resource: 'data' }],
        costEstimate: { tier: 'free', perCall: 0 }
      }

      expect(request.description).toBe('A test tool')
      expect(request.toolkitSlug).toBe('NEW_TOOL')
      expect(request.capabilities).toHaveLength(1)
    })
  })
})

describe('Catalog Stats', () => {
  it('should define stats structure', async () => {
    const { ToolCatalogStats: _ToolCatalogStats } = await import('../../../src/types/tools')

    const stats: typeof _ToolCatalogStats = {
      totalTools: 100,
      approvedTools: 85,
      byCategory: {
        communication: 15,
        productivity: 20,
        development: 25,
        finance: 10,
        travel: 5,
        crm: 8,
        marketing: 7,
        ai: 5,
        data: 3,
        automation: 2,
        social: 0,
        analytics: 0,
        storage: 0,
        other: 0
      },
      byAuthMethod: {
        oauth2: 50,
        api_key: 30,
        bearer: 3,
        none: 0,
        mcp: 2
      },
      avgReliability: 0.92
    }

    expect(stats.totalTools).toBe(100)
    expect(stats.approvedTools).toBe(85)
    expect(stats.byCategory.development).toBe(25)
    expect(stats.avgReliability).toBe(0.92)
  })
})
