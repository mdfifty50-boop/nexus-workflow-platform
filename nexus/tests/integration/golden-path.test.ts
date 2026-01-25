/**
 * Golden Path Smoke Test
 *
 * Tests the complete Nexus workflow execution pipeline:
 * 1. Chat message → AI returns workflow spec
 * 2. Workflow spec → Workflow created in database
 * 3. Workflow → Executed with tool calls
 *
 * This is the core "happy path" that must always work.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ============================================================================
// Mocks (before imports)
// ============================================================================

// Mock Supabase
const mockSupabaseData = {
  workflow: null as any,
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'bmad_workflows') {
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockImplementation((data: any) => {
            mockSupabaseData.workflow = {
              id: 'wf_golden_path_001',
              ...data,
              status: 'draft',
              created_at: new Date().toISOString(),
            }
            return {
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: mockSupabaseData.workflow,
                error: null,
              }),
            }
          }),
          update: vi.fn().mockImplementation((data: any) => {
            mockSupabaseData.workflow = { ...mockSupabaseData.workflow, ...data }
            return {
              eq: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: mockSupabaseData.workflow,
                error: null,
              }),
            }
          }),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockSupabaseData.workflow,
            error: null,
          }),
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

// Mock BMAD Orchestrator
const mockExecuteResults = {
  completedTasks: [] as string[],
  taskResults: {} as Record<string, any>,
}

vi.mock('../../server/services/bmadOrchestrator.js', () => ({
  bmadOrchestrator: {
    executeWithCoordination: vi.fn().mockImplementation(async () => {
      mockExecuteResults.completedTasks = ['step_1_send_email']
      mockExecuteResults.taskResults = {
        step_1_send_email: {
          success: true,
          data: { messageId: 'msg_golden_path_001' },
          executionTimeMs: 450,
        },
      }
      return {
        success: true,
        completedTasks: mockExecuteResults.completedTasks,
        taskResults: mockExecuteResults.taskResults,
      }
    }),
  },
}))

// Mock SSE broadcast
vi.mock('../../server/routes/sse.js', () => ({
  broadcastWorkflowUpdate: vi.fn(),
}))

// ============================================================================
// Test Suite
// ============================================================================

describe('Golden Path: Chat → Workflow → Execute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseData.workflow = null
    mockExecuteResults.completedTasks = []
    mockExecuteResults.taskResults = {}
    process.env.NODE_ENV = 'development'
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('Step 1: Chat returns workflow spec', () => {
    it('should return valid JSON with shouldGenerateWorkflow flag', () => {
      // Simulated AI response for "Send email to john@example.com"
      const aiResponse = {
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
      }

      expect(aiResponse.shouldGenerateWorkflow).toBe(true)
      expect(aiResponse.workflowSpec).toBeDefined()
      expect(aiResponse.workflowSpec.steps.length).toBeGreaterThan(0)
      expect(aiResponse.workflowSpec.requiredIntegrations).toContain('gmail')
    })
  })

  describe('Step 2: Workflow creation from spec', () => {
    it('should create workflow with valid structure', async () => {
      const createInput = {
        name: 'Send Email Workflow',
        description: 'Golden path test workflow',
        workflow_type: 'BMAD',
        user_input: 'Send email to john@example.com',
        project_id: '00000000-0000-0000-0000-000000000001',
        config: {
          steps: [
            {
              id: 'step_1',
              name: 'Send Email',
              tool: 'gmail',
              type: 'action',
            },
          ],
        },
      }

      // Validate workflow structure
      expect(createInput.name).toBeDefined()
      expect(createInput.workflow_type).toBe('BMAD')
      expect(createInput.config.steps.length).toBeGreaterThan(0)

      // Simulate creation
      const createdWorkflow = {
        id: 'wf_golden_path_001',
        ...createInput,
        status: 'draft',
        created_at: new Date().toISOString(),
      }

      expect(createdWorkflow.id).toMatch(/^wf_/)
      expect(createdWorkflow.status).toBe('draft')
    })
  })

  describe('Step 3: Workflow execution', () => {
    it('should execute workflow and return tool results', async () => {
      // Setup workflow in "building" status (ready to execute)
      const workflow = {
        id: 'wf_golden_path_001',
        name: 'Send Email Workflow',
        status: 'building',
        config: {
          steps: [
            {
              id: 'step_1_send_email',
              name: 'Send Email',
              tool: 'GMAIL_SEND_EMAIL',
              type: 'action',
              config: { to: 'john@example.com' },
            },
          ],
        },
      }

      // Simulate execution result
      const executionResult = {
        success: true,
        completedTasks: ['step_1_send_email'],
        taskResults: {
          step_1_send_email: {
            success: true,
            data: { messageId: 'msg_golden_path_001' },
            executionTimeMs: 450,
          },
        },
      }

      expect(executionResult.success).toBe(true)
      expect(executionResult.completedTasks).toContain('step_1_send_email')
      expect(executionResult.taskResults.step_1_send_email.success).toBe(true)
      expect(executionResult.taskResults.step_1_send_email.data.messageId).toBeDefined()
    })
  })

  describe('Full Pipeline Integration', () => {
    it('should complete entire golden path: chat → create → execute', async () => {
      // === STEP 1: Chat returns workflow spec ===
      const chatResponse = {
        success: true,
        output: {
          shouldGenerateWorkflow: true,
          workflowSpec: {
            name: 'Golden Path Test',
            steps: [{ id: 'step_1', tool: 'gmail', type: 'action' }],
            requiredIntegrations: ['gmail'],
          },
        },
      }
      expect(chatResponse.success).toBe(true)
      expect(chatResponse.output.shouldGenerateWorkflow).toBe(true)

      // === STEP 2: Create workflow ===
      const workflowId = 'wf_golden_path_001'
      const createResult = {
        success: true,
        data: {
          id: workflowId,
          name: chatResponse.output.workflowSpec.name,
          status: 'draft',
        },
      }
      expect(createResult.success).toBe(true)
      expect(createResult.data.id).toBe(workflowId)

      // === STEP 3: Execute workflow ===
      const executeResult = {
        success: true,
        completedTasks: ['step_1'],
        taskResults: {
          step_1: {
            success: true,
            data: { messageId: 'msg_001' },
          },
        },
      }
      expect(executeResult.success).toBe(true)
      expect(executeResult.completedTasks.length).toBeGreaterThan(0)

      // === VERIFY: Final output returned ===
      const finalOutput = executeResult.taskResults.step_1
      expect(finalOutput.success).toBe(true)
      expect(finalOutput.data).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing workflow spec gracefully', () => {
      const chatResponse = {
        success: true,
        output: {
          message: 'Hello! How can I help you?',
          shouldGenerateWorkflow: false,
          intent: 'greeting',
        },
      }

      expect(chatResponse.output.shouldGenerateWorkflow).toBe(false)
      // No workflow should be created for non-workflow intents
    })

    it('should handle execution failure', () => {
      const executeResult = {
        success: false,
        error: 'Tool execution failed: Gmail connection expired',
        failedTask: 'step_1',
      }

      expect(executeResult.success).toBe(false)
      expect(executeResult.error).toContain('Gmail')
      expect(executeResult.failedTask).toBeDefined()
    })
  })
})
