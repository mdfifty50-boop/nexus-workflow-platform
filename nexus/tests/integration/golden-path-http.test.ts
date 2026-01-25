/**
 * Golden Path HTTP Integration Test (Move 6.3)
 *
 * Tests the complete Nexus workflow execution pipeline via actual HTTP routes:
 * 1. POST /api/chat → Claude returns workflow spec (mocked)
 * 2. POST /api/workflows → Creates workflow in DB (mocked)
 * 3. POST /api/workflows/:id/start → Planning stage
 * 4. POST /api/workflows/:id/approve → Approval (if pending_approval)
 * 5. POST /api/workflows/:id/execute → Execution with results
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import request from 'supertest'

// ============================================================================
// Mocks (must be before imports that use them)
// ============================================================================

// Mock workflow state
const mockWorkflowDB: Record<string, any> = {}

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'bmad_workflows') {
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockImplementation((data: any) => {
            const id = `wf_http_${Date.now()}`
            mockWorkflowDB[id] = {
              id,
              ...data,
              status: 'draft',
              created_at: new Date().toISOString(),
            }
            return {
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: mockWorkflowDB[id],
                error: null,
              }),
            }
          }),
          update: vi.fn().mockImplementation((data: any) => ({
            eq: vi.fn().mockImplementation((field: string, value: string) => {
              if (mockWorkflowDB[value]) {
                mockWorkflowDB[value] = { ...mockWorkflowDB[value], ...data }
              }
              return {
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: mockWorkflowDB[value] || null,
                  error: mockWorkflowDB[value] ? null : { message: 'Not found' },
                }),
              }
            }),
          })),
          eq: vi.fn().mockImplementation((field: string, value: string) => ({
            single: vi.fn().mockResolvedValue({
              data: mockWorkflowDB[value] || null,
              error: mockWorkflowDB[value] ? null : { message: 'Not found' },
            }),
          })),
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
    }),
    auth: { getUser: vi.fn() },
  })),
}))

// Mock Claude proxy to return workflow spec
vi.mock('../../server/services/claudeProxy.js', () => ({
  getClaudeClient: vi.fn(() => null),
  callClaudeWithCaching: vi.fn().mockResolvedValue({
    text: JSON.stringify({
      message: "I'll create a workflow to send that email.",
      shouldGenerateWorkflow: true,
      intent: 'workflow',
      confidence: 0.95,
      workflowSpec: {
        name: 'Send Email Workflow',
        description: 'Send email to specified recipient',
        steps: [
          {
            id: 'step_1',
            name: 'Send Email',
            tool: 'gmail',
            type: 'action',
            config: { to: 'john@example.com', subject: 'Test', body: 'Hello' },
          },
        ],
        requiredIntegrations: ['gmail'],
        estimatedTimeSaved: '5 minutes',
      },
    }),
    tokensUsed: 500,
    viaProxy: false,
    costUSD: 0.003,
    cacheMetrics: {
      cacheCreationInputTokens: 0,
      cacheReadInputTokens: 100,
      uncachedInputTokens: 200,
    },
  }),
}))

// Mock BMAD Orchestrator
vi.mock('../../server/services/bmadOrchestrator.js', () => ({
  bmadOrchestrator: {
    runPlanningStage: vi.fn().mockImplementation(async (workflowId: string) => {
      if (mockWorkflowDB[workflowId]) {
        mockWorkflowDB[workflowId].status = 'pending_approval'
        mockWorkflowDB[workflowId].config = {
          ...mockWorkflowDB[workflowId].config,
          executionPlan: {
            tasks: [
              {
                id: 'task_1',
                name: 'Send Email',
                type: 'integration',
                integrationId: 'gmail',
                description: 'Send email via Gmail',
                dependencies: [],
                config: { toolSlug: 'GMAIL_SEND_EMAIL' },
                estimatedTokens: 100,
              },
            ],
            requiredIntegrations: ['gmail'],
            totalEstimatedTokens: 100,
            totalEstimatedCostUSD: 0.0003,
            complexity: 'simple',
          },
        }
      }
      return { success: true, plan: mockWorkflowDB[workflowId]?.config?.executionPlan }
    }),
    runOrchestratingStage: vi.fn().mockImplementation(async (workflowId: string) => {
      if (mockWorkflowDB[workflowId]) {
        mockWorkflowDB[workflowId].status = 'building'
      }
      return { success: true }
    }),
    executeTask: vi.fn().mockResolvedValue({
      success: true,
      output: { messageId: 'msg_http_001', status: 'sent' },
    }),
    completeWorkflow: vi.fn().mockImplementation(async (workflowId: string) => {
      if (mockWorkflowDB[workflowId]) {
        mockWorkflowDB[workflowId].status = 'completed'
      }
    }),
    executeWithCoordination: vi.fn().mockResolvedValue({
      success: true,
      results: {
        task_1: { success: true, data: { messageId: 'msg_coordinated_001' } },
      },
    }),
  },
}))

// Mock workflowService
vi.mock('../../server/services/workflowService.js', () => ({
  workflowService: {
    createWorkflow: vi.fn().mockImplementation(async (data: any) => {
      const id = `wf_http_${Date.now()}`
      mockWorkflowDB[id] = {
        id,
        ...data,
        status: 'draft',
        created_at: new Date().toISOString(),
      }
      return mockWorkflowDB[id]
    }),
    getWorkflowById: vi.fn().mockImplementation(async (id: string) => {
      return mockWorkflowDB[id] || null
    }),
    getAllWorkflowsForUser: vi.fn().mockResolvedValue([]),
    getWorkflowsForProject: vi.fn().mockResolvedValue([]),
    updateWorkflow: vi.fn().mockImplementation(async (id: string, _userId: string, data: any) => {
      if (mockWorkflowDB[id]) {
        mockWorkflowDB[id] = { ...mockWorkflowDB[id], ...data }
        return mockWorkflowDB[id]
      }
      return null
    }),
    updateWorkflowStatus: vi.fn().mockImplementation(async (id: string, status: string) => {
      if (mockWorkflowDB[id]) {
        mockWorkflowDB[id].status = status
      }
    }),
    deleteWorkflow: vi.fn().mockResolvedValue(true),
    cancelWorkflow: vi.fn().mockResolvedValue({ success: true }),
    retryWorkflow: vi.fn().mockResolvedValue({ success: true }),
    getCheckpoints: vi.fn().mockResolvedValue([]),
  },
}))

// Mock app detection service
vi.mock('../../server/services/AppDetectionService.js', () => ({
  appDetectionService: {
    detectAndAnalyze: vi.fn().mockResolvedValue({
      detectedApps: [],
      hasLimitedSupport: false,
      contextEnrichment: '',
      toolDiscoveryResults: [],
    }),
  },
}))

// Mock custom integration service
vi.mock('../../server/services/CustomIntegrationService.js', () => ({
  customIntegrationService: {
    getAppAPIInfo: vi.fn().mockReturnValue(null),
  },
}))

// Mock PreFlightValidationService
vi.mock('../../server/services/PreFlightValidationService.js', () => ({
  preFlightValidationService: {
    initialized: true,
    initialize: vi.fn().mockResolvedValue(undefined),
    check: vi.fn().mockResolvedValue({
      ready: true,
      questions: [],
      connections: [],
      summary: { totalQuestions: 0, answeredQuestions: 0, totalConnections: 0, connectedCount: 0 },
      schemaSource: 'fallback',
    }),
    getToolSchema: vi.fn().mockResolvedValue(null),
    clearCache: vi.fn(),
  },
  WorkflowNode: class {},
}))

// ============================================================================
// Test Suite
// ============================================================================

describe('Golden Path HTTP Integration', () => {
  let app: any

  beforeEach(async () => {
    vi.clearAllMocks()
    // Clear mock DB
    Object.keys(mockWorkflowDB).forEach(key => delete mockWorkflowDB[key])
    process.env.NODE_ENV = 'development'
    // Import app fresh for each test
    const serverModule = await import('../../server/index.js')
    app = serverModule.default
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('Step 1: POST /api/chat returns workflow spec', () => {
    it('should return valid JSON with shouldGenerateWorkflow flag', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({
          messages: [{ role: 'user', content: 'Send email to john@example.com' }],
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)

      // Parse the output (Claude returns JSON as string)
      const output = JSON.parse(res.body.output)
      expect(output.shouldGenerateWorkflow).toBe(true)
      expect(output.workflowSpec).toBeDefined()
      expect(output.workflowSpec.steps.length).toBeGreaterThan(0)
      expect(output.workflowSpec.requiredIntegrations).toContain('gmail')
    })
  })

  describe('Step 2: POST /api/workflows creates workflow', () => {
    it('should create workflow with valid structure', async () => {
      const res = await request(app)
        .post('/api/workflows')
        .send({
          name: 'Send Email Workflow',
          description: 'Golden path HTTP test workflow',
          workflow_type: 'BMAD',
          user_input: 'Send email to john@example.com',
          project_id: '00000000-0000-0000-0000-000000000001',
          config: {
            steps: [
              { id: 'step_1', name: 'Send Email', tool: 'gmail', type: 'action' },
            ],
          },
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toMatch(/^wf_/)
      expect(res.body.data.status).toBe('draft')
    })
  })

  describe('Step 3-5: Full Pipeline (start → approve → execute)', () => {
    it('should complete full pipeline: create → start → approve → execute', async () => {
      // Step 2: Create workflow
      const createRes = await request(app)
        .post('/api/workflows')
        .send({
          name: 'Full Pipeline Test',
          description: 'Tests the complete execution flow',
          workflow_type: 'BMAD',
          user_input: 'Send email to john@example.com',
          project_id: '00000000-0000-0000-0000-000000000001',
          config: {
            steps: [
              { id: 'step_1', name: 'Send Email', tool: 'gmail', type: 'action' },
            ],
          },
        })

      expect(createRes.status).toBe(201)
      const workflowId = createRes.body.data.id

      // Step 3: Start planning
      const startRes = await request(app)
        .post(`/api/workflows/${workflowId}/start`)
        .send({})

      expect(startRes.status).toBe(200)
      expect(startRes.body.success).toBe(true)
      expect(startRes.body.plan).toBeDefined()

      // Verify status is now pending_approval
      expect(mockWorkflowDB[workflowId].status).toBe('pending_approval')

      // Step 4: Approve
      const approveRes = await request(app)
        .post(`/api/workflows/${workflowId}/approve`)
        .send({})

      expect(approveRes.status).toBe(200)
      expect(approveRes.body.success).toBe(true)

      // Verify status is now building
      expect(mockWorkflowDB[workflowId].status).toBe('building')

      // Step 5: Execute
      const executeRes = await request(app)
        .post(`/api/workflows/${workflowId}/execute`)
        .send({})

      expect(executeRes.status).toBe(200)
      expect(executeRes.body.success).toBe(true)
      expect(executeRes.body.taskResults).toBeDefined()
      expect(executeRes.body.taskResults.task_1).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should return 400 for missing messages in chat', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({})

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
      expect(res.body.error).toContain('messages')
    })

    it('should return 400 for missing required fields in workflow creation', async () => {
      const res = await request(app)
        .post('/api/workflows')
        .send({ description: 'Missing name and project_id' })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })

    it('should return 404 for non-existent workflow', async () => {
      const res = await request(app)
        .post('/api/workflows/wf_nonexistent/start')
        .send({})

      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)
    })

    it('should return 400 when executing workflow not in building status', async () => {
      // Create workflow (starts in draft)
      const createRes = await request(app)
        .post('/api/workflows')
        .send({
          name: 'Status Check Test',
          project_id: '00000000-0000-0000-0000-000000000001',
        })

      const workflowId = createRes.body.data.id

      // Try to execute directly (should fail - wrong status)
      const executeRes = await request(app)
        .post(`/api/workflows/${workflowId}/execute`)
        .send({})

      expect(executeRes.status).toBe(400)
      expect(executeRes.body.error).toContain('status')
    })
  })
})
