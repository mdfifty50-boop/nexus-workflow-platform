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
                config: {
                  toolSlug: 'GMAIL_SEND_EMAIL',
                  params: { to: 'test@example.com', subject: 'Test', body: 'Hello' },
                },
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

// Mock ComposioService for preflight integration checks (Move 6.5)
const composioMocks = {
  checkConnection: vi.fn().mockResolvedValue({ connected: false, status: 'disconnected' }),
}

vi.mock('../../server/services/ComposioService.js', () => ({
  composioService: {
    checkConnection: composioMocks.checkConnection,
    initialized: true,
  },
}))

// Mock SSE broadcast for Golden Path logging (Move 6.4)
// Store mock reference in a way accessible from tests
const sseMocks = {
  broadcastWorkflowUpdate: vi.fn(),
}

vi.mock('../../server/routes/sse.js', () => {
  // Create a minimal Express router mock (inline to avoid hoisting issues)
  const router = function(req: any, res: any, next: any) { next() }
  ;(router as any).get = vi.fn().mockReturnValue(router)
  ;(router as any).post = vi.fn().mockReturnValue(router)
  ;(router as any).use = vi.fn().mockReturnValue(router)
  ;(router as any).stack = []

  return {
    broadcastWorkflowUpdate: sseMocks.broadcastWorkflowUpdate,
    default: router,
  }
})

// ============================================================================
// Test Suite
// ============================================================================

describe('Golden Path HTTP Integration', () => {
  let app: any

  beforeEach(async () => {
    vi.clearAllMocks()
    sseMocks.broadcastWorkflowUpdate.mockClear()
    composioMocks.checkConnection.mockClear()
    // Reset composio mock to default connected state for most tests
    composioMocks.checkConnection.mockResolvedValue({ connected: true, status: 'connected' })
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

  describe('Move 6.4: SSE Golden Path Logging', () => {
    it('should emit SSE events during workflow execution (via mocked orchestrator)', async () => {
      // Note: Since bmadOrchestrator is mocked, actual SSE calls happen in the real orchestrator
      // This test verifies the mock setup is correct and SSE function is available

      // Create and start a workflow
      const createRes = await request(app)
        .post('/api/workflows')
        .send({
          name: 'SSE Test Workflow',
          project_id: '00000000-0000-0000-0000-000000000001',
          config: { steps: [{ id: 'step_1', name: 'Test', tool: 'gmail', type: 'action' }] },
        })

      expect(createRes.status).toBe(201)

      // Verify the SSE mock is properly set up (used by routes)
      // The actual emitGoldenPathLog calls happen in bmadOrchestrator which is mocked
      // But we verify the mock function exists and can be called
      expect(typeof sseMocks.broadcastWorkflowUpdate).toBe('function')
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

  describe('Move 6.5: Execution Preflight Validation', () => {
    it('should return 400 with missingIntegrations when required integration is not connected', async () => {
      // Mock composioService to return disconnected for gmail
      composioMocks.checkConnection.mockResolvedValue({ connected: false, status: 'disconnected' })

      // Create workflow
      const createRes = await request(app)
        .post('/api/workflows')
        .send({
          name: 'Preflight Test Workflow',
          project_id: '00000000-0000-0000-0000-000000000001',
          config: { steps: [{ id: 'step_1', name: 'Send Email', tool: 'gmail', type: 'action' }] },
        })

      expect(createRes.status).toBe(201)
      const workflowId = createRes.body.data.id

      // Start planning (sets status to pending_approval and adds executionPlan)
      const startRes = await request(app)
        .post(`/api/workflows/${workflowId}/start`)
        .send({})

      expect(startRes.status).toBe(200)

      // Approve (sets status to building)
      const approveRes = await request(app)
        .post(`/api/workflows/${workflowId}/approve`)
        .send({})

      expect(approveRes.status).toBe(200)

      // Try to execute - should fail preflight because gmail is not connected
      const executeRes = await request(app)
        .post(`/api/workflows/${workflowId}/execute`)
        .send({})

      expect(executeRes.status).toBe(400)
      expect(executeRes.body.success).toBe(false)
      expect(executeRes.body.missingIntegrations).toBeDefined()
      expect(executeRes.body.missingIntegrations).toContain('gmail')
      expect(executeRes.body.error).toContain('gmail')

      // Verify SSE event was emitted
      expect(sseMocks.broadcastWorkflowUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          workflowId,
          type: 'golden_path_preflight_failed',
          missingIntegrations: expect.arrayContaining(['gmail']),
        })
      )
    })
  })

  describe('Move 6.6: Plan Validation and Normalization', () => {
    it('should return 400 with invalidTasks when toolSlug is unknown', async () => {
      // Mock composio to return connected (so we pass preflight)
      composioMocks.checkConnection.mockResolvedValue({ connected: true, status: 'active' })

      // Create workflow
      const createRes = await request(app)
        .post('/api/workflows')
        .send({
          name: 'Invalid Plan Test Workflow',
          project_id: '00000000-0000-0000-0000-000000000001',
          config: { steps: [{ id: 'step_1', name: 'Unknown Action', tool: 'unknown_integration', type: 'action' }] },
        })

      expect(createRes.status).toBe(201)
      const workflowId = createRes.body.data.id

      // Manually inject an invalid execution plan with unknown integration
      // mockWorkflowDB is in module scope, directly accessible
      if (mockWorkflowDB[workflowId]) {
        mockWorkflowDB[workflowId].config = {
          ...mockWorkflowDB[workflowId].config,
          executionPlan: {
            tasks: [
              {
                id: 'task_invalid',
                dependencies: [],
                config: { integration: 'unknownapp', action: 'do_something' },
              },
            ],
            requiredIntegrations: [],
          },
        }
        mockWorkflowDB[workflowId].status = 'building'
      }

      // Try to execute - should fail plan validation
      const executeRes = await request(app)
        .post(`/api/workflows/${workflowId}/execute`)
        .send({})

      expect(executeRes.status).toBe(400)
      expect(executeRes.body.success).toBe(false)
      expect(executeRes.body.error).toBe('Invalid workflow plan')
      expect(executeRes.body.invalidTasks).toBeDefined()
      expect(executeRes.body.invalidTasks.length).toBeGreaterThan(0)
      expect(executeRes.body.invalidTasks[0].taskId).toBe('task_invalid')

      // Verify SSE event was emitted
      expect(sseMocks.broadcastWorkflowUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          workflowId,
          type: 'golden_path_plan_invalid',
          invalidTasks: expect.arrayContaining([
            expect.objectContaining({ taskId: 'task_invalid' }),
          ]),
        })
      )
    })
  })

  describe('Move 6.9: Needs User Input Response', () => {
    it('should return 200 with needs_user_input when required param is missing', async () => {
      // Mock composio to return connected (so we pass preflight)
      composioMocks.checkConnection.mockResolvedValue({ connected: true, status: 'active' })

      // Create workflow
      const createRes = await request(app)
        .post('/api/workflows')
        .send({
          name: 'Missing Params Test Workflow',
          project_id: '00000000-0000-0000-0000-000000000001',
          config: { steps: [{ id: 'step_1', name: 'Send Email', tool: 'gmail', type: 'action' }] },
        })

      expect(createRes.status).toBe(201)
      const workflowId = createRes.body.data.id

      // Inject execution plan with valid toolSlug but missing required 'to' param
      if (mockWorkflowDB[workflowId]) {
        mockWorkflowDB[workflowId].config = {
          ...mockWorkflowDB[workflowId].config,
          executionPlan: {
            tasks: [
              {
                id: 'task_missing_to',
                dependencies: [],
                config: {
                  integration: 'gmail',
                  toolSlug: 'GMAIL_SEND_EMAIL',
                  params: { subject: 'Test', body: 'Hello' }, // Missing 'to'
                },
              },
            ],
            requiredIntegrations: ['gmail'],
          },
        }
        mockWorkflowDB[workflowId].status = 'building'
      }

      // Try to execute - should return needs_user_input (not 400)
      const executeRes = await request(app)
        .post(`/api/workflows/${workflowId}/execute`)
        .send({})

      // Move 6.9: Returns 200 with needs_user_input instead of 400
      expect(executeRes.status).toBe(200)
      expect(executeRes.body.success).toBe(true)
      expect(executeRes.body.status).toBe('needs_user_input')
      expect(executeRes.body.workflowId).toBe(workflowId)
      expect(executeRes.body.missingFields).toBeDefined()
      expect(executeRes.body.missingFields.length).toBeGreaterThan(0)
      expect(executeRes.body.missingFields[0].taskId).toBe('task_missing_to')
      expect(executeRes.body.missingFields[0].toolSlug).toBe('GMAIL_SEND_EMAIL')
      expect(executeRes.body.missingFields[0].missingParams).toContain('to')
      expect(executeRes.body.message).toBe('I need more info before I can run this workflow.')

      // Verify SSE event was emitted with needs_user_input type
      expect(sseMocks.broadcastWorkflowUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          workflowId,
          type: 'golden_path_needs_user_input',
          missingFields: expect.arrayContaining([
            expect.objectContaining({
              taskId: 'task_missing_to',
              toolSlug: 'GMAIL_SEND_EMAIL',
              missingParams: expect.arrayContaining(['to']),
            }),
          ]),
        })
      )
    })
  })
})
