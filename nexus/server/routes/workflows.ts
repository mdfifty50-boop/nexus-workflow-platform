import { Router, Request, Response } from 'express'
import { workflowService } from '../services/workflowService.js'
import { bmadOrchestrator } from '../services/bmadOrchestrator.js'
import { composioService } from '../services/ComposioService.js'
import { broadcastWorkflowUpdate } from './sse.js'

const router = Router()

// ============================================================================
// Move 6.14: ACTION_CATALOG - Single source of truth for validation + autofill
// Consolidates TOOL_SLUGS, REQUIRED_PARAMS, autofill rules, and human labels
// ============================================================================
interface ActionDefinition {
  toolSlug: string
  integrationId: string
  requiredParams: string[]
  autofillRules: Array<{ param: string; type: 'email' | 'phone' | 'default'; value?: string }>
  humanLabel: string
}

export const ACTION_CATALOG: Record<string, ActionDefinition> = {
  // Gmail
  GMAIL_SEND_EMAIL: { toolSlug: 'GMAIL_SEND_EMAIL', integrationId: 'gmail', requiredParams: ['to'], autofillRules: [{ param: 'to', type: 'email' }], humanLabel: 'Send Email' },
  GMAIL_FETCH_EMAILS: { toolSlug: 'GMAIL_FETCH_EMAILS', integrationId: 'gmail', requiredParams: [], autofillRules: [], humanLabel: 'Fetch Emails' },
  // Slack
  SLACK_SEND_MESSAGE: { toolSlug: 'SLACK_SEND_MESSAGE', integrationId: 'slack', requiredParams: ['channel'], autofillRules: [{ param: 'channel', type: 'default', value: '#general' }], humanLabel: 'Send Slack Message' },
  // Google Sheets
  GOOGLESHEETS_BATCH_UPDATE: { toolSlug: 'GOOGLESHEETS_BATCH_UPDATE', integrationId: 'googlesheets', requiredParams: ['spreadsheet_id'], autofillRules: [], humanLabel: 'Update Spreadsheet' },
  GOOGLESHEETS_BATCH_GET: { toolSlug: 'GOOGLESHEETS_BATCH_GET', integrationId: 'googlesheets', requiredParams: ['spreadsheet_id'], autofillRules: [], humanLabel: 'Read Spreadsheet' },
  // Calendar
  GOOGLECALENDAR_CREATE_EVENT: { toolSlug: 'GOOGLECALENDAR_CREATE_EVENT', integrationId: 'googlecalendar', requiredParams: ['summary'], autofillRules: [], humanLabel: 'Create Calendar Event' },
  GOOGLECALENDAR_EVENTS_LIST: { toolSlug: 'GOOGLECALENDAR_EVENTS_LIST', integrationId: 'googlecalendar', requiredParams: [], autofillRules: [], humanLabel: 'List Calendar Events' },
  // WhatsApp
  WHATSAPP_SEND_MESSAGE: { toolSlug: 'WHATSAPP_SEND_MESSAGE', integrationId: 'whatsapp', requiredParams: ['to'], autofillRules: [{ param: 'to', type: 'phone' }], humanLabel: 'Send WhatsApp Message' },
  // HubSpot
  HUBSPOT_CREATE_CONTACT: { toolSlug: 'HUBSPOT_CREATE_CONTACT', integrationId: 'hubspot', requiredParams: ['email'], autofillRules: [{ param: 'email', type: 'email' }], humanLabel: 'Create HubSpot Contact' },
  // Stripe
  STRIPE_CREATE_CUSTOMER: { toolSlug: 'STRIPE_CREATE_CUSTOMER', integrationId: 'stripe', requiredParams: ['email'], autofillRules: [{ param: 'email', type: 'email' }], humanLabel: 'Create Stripe Customer' },
  STRIPE_CREATE_CHARGE: { toolSlug: 'STRIPE_CREATE_CHARGE', integrationId: 'stripe', requiredParams: ['amount'], autofillRules: [], humanLabel: 'Create Stripe Charge' },
  STRIPE_CREATE_INVOICE: { toolSlug: 'STRIPE_CREATE_INVOICE', integrationId: 'stripe', requiredParams: ['customer'], autofillRules: [], humanLabel: 'Create Stripe Invoice' },
  // Discord
  DISCORD_SEND_MESSAGE: { toolSlug: 'DISCORD_SEND_MESSAGE', integrationId: 'discord', requiredParams: ['channel_id'], autofillRules: [], humanLabel: 'Send Discord Message' },
  // Notion
  NOTION_CREATE_PAGE: { toolSlug: 'NOTION_CREATE_PAGE', integrationId: 'notion', requiredParams: ['parent_id'], autofillRules: [], humanLabel: 'Create Notion Page' },
  NOTION_UPDATE_PAGE: { toolSlug: 'NOTION_UPDATE_PAGE', integrationId: 'notion', requiredParams: ['page_id'], autofillRules: [], humanLabel: 'Update Notion Page' },
  // GitHub
  GITHUB_CREATE_ISSUE: { toolSlug: 'GITHUB_CREATE_ISSUE', integrationId: 'github', requiredParams: ['repo', 'title'], autofillRules: [], humanLabel: 'Create GitHub Issue' },
  GITHUB_LIST_REPOSITORY_ISSUES: { toolSlug: 'GITHUB_LIST_REPOSITORY_ISSUES', integrationId: 'github', requiredParams: ['repo'], autofillRules: [], humanLabel: 'List GitHub Issues' },
  // Trello
  TRELLO_CREATE_CARD: { toolSlug: 'TRELLO_CREATE_CARD', integrationId: 'trello', requiredParams: ['idList'], autofillRules: [], humanLabel: 'Create Trello Card' },
  // Twitter
  TWITTER_CREATE_TWEET: { toolSlug: 'TWITTER_CREATE_TWEET', integrationId: 'twitter', requiredParams: ['text'], autofillRules: [], humanLabel: 'Post Tweet' },
  // Linear
  LINEAR_CREATE_ISSUE: { toolSlug: 'LINEAR_CREATE_ISSUE', integrationId: 'linear', requiredParams: ['title'], autofillRules: [], humanLabel: 'Create Linear Issue' },
  // Jira
  JIRA_CREATE_ISSUE: { toolSlug: 'JIRA_CREATE_ISSUE', integrationId: 'jira', requiredParams: ['summary'], autofillRules: [], humanLabel: 'Create Jira Issue' },
}

// Build TOOL_SLUGS from ACTION_CATALOG for backwards compatibility
const TOOL_SLUGS: Record<string, Record<string, string>> = {}
for (const action of Object.values(ACTION_CATALOG)) {
  if (!TOOL_SLUGS[action.integrationId]) {
    TOOL_SLUGS[action.integrationId] = { default: action.toolSlug }
  }
  // Map action keywords to slugs
  const actionName = action.toolSlug.split('_').slice(1).join('_').toLowerCase()
  TOOL_SLUGS[action.integrationId][actionName] = action.toolSlug
}
// Add aliases
TOOL_SLUGS['sheets'] = TOOL_SLUGS['googlesheets']
TOOL_SLUGS['calendar'] = TOOL_SLUGS['googlecalendar']

/**
 * Validate and normalize a tool slug for a task
 * Returns { valid: true, normalizedSlug } or { valid: false, reason }
 */
function validateAndNormalizeToolSlug(task: any): { valid: boolean; normalizedSlug?: string; reason?: string } {
  const toolSlug = task.config?.toolSlug
  const integration = task.config?.integration?.toLowerCase()

  // If toolSlug already looks valid (uppercase with underscores), accept it
  if (toolSlug && /^[A-Z]+_[A-Z_]+$/.test(toolSlug)) {
    return { valid: true, normalizedSlug: toolSlug }
  }

  // Try to resolve from integration + action
  if (integration && TOOL_SLUGS[integration]) {
    const action = task.config?.action?.toLowerCase() || 'default'
    const resolved = TOOL_SLUGS[integration][action] || TOOL_SLUGS[integration].default
    if (resolved) {
      return { valid: true, normalizedSlug: resolved }
    }
  }

  // Could not resolve
  return {
    valid: false,
    reason: `Unknown tool slug for task ${task.id}: integration=${integration || 'missing'}, toolSlug=${toolSlug || 'missing'}`
  }
}

// ============================================================================
// Move 6.8/6.14: Validate required params using ACTION_CATALOG
// ============================================================================
/**
 * Validate required params for a task using ACTION_CATALOG
 * Returns { valid: true } or { valid: false, missingParams: [...] }
 */
function validateRequiredParams(task: any): { valid: boolean; missingParams?: string[] } {
  const toolSlug = task.config?.toolSlug
  if (!toolSlug) return { valid: true } // No toolSlug = skip param validation

  const action = ACTION_CATALOG[toolSlug]
  if (!action || action.requiredParams.length === 0) {
    return { valid: true } // Unknown tool or no required params
  }

  const params = task.config?.params || {}
  const missingParams: string[] = []

  for (const param of action.requiredParams) {
    const value = params[param]
    if (value === undefined || value === null || value === '') {
      missingParams.push(param)
    }
  }

  if (missingParams.length > 0) {
    return { valid: false, missingParams }
  }

  return { valid: true }
}

// ============================================================================
// Move 6.10: Safe param autofill from user context
// Only fills high-confidence matches (email/phone regex, safe defaults)
// ============================================================================
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
const PHONE_REGEX = /\+?[1-9]\d{6,14}/ // Simple international phone format

interface AutoFillResult {
  filled: boolean
  filledParams: Array<{ taskId: string; param: string; value: string; source: string }>
}

/**
 * Move 6.10/6.14: Auto-fill missing params using ACTION_CATALOG autofillRules
 * Only fills if confidence is high (regex match or safe default)
 */
function autoFillParams(
  tasks: any[],
  missingParamTasks: Array<{ taskId: string; toolSlug: string; missingParams: string[] }>,
  userInput: string | undefined
): AutoFillResult {
  const filledParams: AutoFillResult['filledParams'] = []
  const inputText = userInput || ''

  for (const missing of missingParamTasks) {
    const task = tasks.find((t: any) => t.id === missing.taskId)
    if (!task || !task.config) continue
    if (!task.config.params) task.config.params = {}

    const action = ACTION_CATALOG[missing.toolSlug]
    if (!action) continue

    for (const param of missing.missingParams) {
      const rule = action.autofillRules.find(r => r.param === param)
      if (!rule) continue

      if (rule.type === 'email') {
        const emailMatch = inputText.match(EMAIL_REGEX)
        if (emailMatch) {
          task.config.params[param] = emailMatch[0]
          filledParams.push({ taskId: task.id, param, value: emailMatch[0], source: 'user_input' })
        }
      } else if (rule.type === 'phone') {
        const phoneMatch = inputText.match(PHONE_REGEX)
        if (phoneMatch) {
          task.config.params[param] = phoneMatch[0]
          filledParams.push({ taskId: task.id, param, value: phoneMatch[0], source: 'user_input' })
        }
      } else if (rule.type === 'default' && rule.value) {
        task.config.params[param] = rule.value
        filledParams.push({ taskId: task.id, param, value: rule.value, source: 'safe_default' })
      }
    }
  }

  return { filled: filledParams.length > 0, filledParams }
}

/**
 * Move 6.11: Generate demo results for verified template execution
 * Returns mock data based on tool slug for demo mode
 */
function generateDemoResult(toolSlug: string): Record<string, unknown> {
  const demoResults: Record<string, Record<string, unknown>> = {
    WHATSAPP_SEND_MESSAGE: { messageId: 'demo_msg_001', status: 'sent', recipient: '+1234567890' },
    HUBSPOT_CREATE_CONTACT: { contactId: 'demo_contact_001', email: 'demo@example.com', created: true },
    GMAIL_SEND_EMAIL: { messageId: 'demo_email_001', threadId: 'demo_thread_001', status: 'sent' },
    SLACK_SEND_MESSAGE: { messageId: 'demo_slack_001', channel: '#general', timestamp: Date.now() },
    GOOGLESHEETS_BATCH_UPDATE: { updatedCells: 10, spreadsheetId: 'demo_sheet_001' },
    NOTION_CREATE_PAGE: { pageId: 'demo_page_001', url: 'https://notion.so/demo' },
  }
  return demoResults[toolSlug] || { status: 'completed', result: 'Demo execution successful' }
}

/**
 * Move 6.12: Generate user-friendly prompt for missing fields
 * Converts technical missing params into ONE natural-language question
 */
function generateUserPrompt(missingFields: Array<{ taskId: string; toolSlug: string; missingParams: string[] }>): {
  userPrompt: string
  exampleAnswer: string
} {
  // Param-specific prompts and examples
  const paramPrompts: Record<string, { question: string; example: string }> = {
    // Email params
    to: { question: 'What email address should I send this to?', example: 'john@example.com' },
    recipient: { question: 'Who should receive this message?', example: '+1 (555) 123-4567' },
    subject: { question: 'What should the email subject be?', example: 'Weekly Report' },
    body: { question: 'What message would you like to send?', example: 'Hi, here is the update...' },
    // Slack params
    channel: { question: 'Which Slack channel should I post to?', example: '#general' },
    message: { question: 'What message would you like to send?', example: 'Hello team!' },
    // Google Sheets params
    spreadsheet_id: { question: 'Which Google Sheet should I use? (paste the URL or ID)', example: 'https://docs.google.com/spreadsheets/d/abc123' },
    range: { question: 'Which cells should I update?', example: 'Sheet1!A1:B10' },
    // Calendar params
    title: { question: 'What should the event be called?', example: 'Team Meeting' },
    start_time: { question: 'When should this start?', example: 'Tomorrow at 2pm' },
    // HubSpot params
    email: { question: 'What is the contact\'s email address?', example: 'contact@company.com' },
    firstname: { question: 'What is the contact\'s first name?', example: 'Jane' },
    // Generic
    name: { question: 'What name should I use?', example: 'My Workflow Item' },
    url: { question: 'What URL should I use?', example: 'https://example.com' },
  }

  // Get the first missing param to ask about
  if (missingFields.length === 0 || missingFields[0].missingParams.length === 0) {
    return {
      userPrompt: 'I need a bit more information to continue. What would you like to do?',
      exampleAnswer: 'Send an email to john@example.com',
    }
  }

  const firstTask = missingFields[0]
  const firstParam = firstTask.missingParams[0]
  const toolName = firstTask.toolSlug.split('_')[0].toLowerCase()

  // Look up specific prompt
  const specific = paramPrompts[firstParam]
  if (specific) {
    return {
      userPrompt: specific.question,
      exampleAnswer: specific.example,
    }
  }

  // Generate generic prompt based on param name
  const readableParam = firstParam.replace(/_/g, ' ')
  return {
    userPrompt: `What ${readableParam} should I use for ${toolName}?`,
    exampleAnswer: `your-${firstParam}-here`,
  }
}

// ============================================================================
// Move 6.15: Workflow Clarifier (single-question mode)
// Detects broad requests and asks one clarification question at a time
// ============================================================================

interface ClarificationQuestion {
  key: string
  question: string
  choices: string[]
  reason: string
}

// Clarification questions for broad workflow requests
const CLARIFICATION_QUESTIONS: Record<string, ClarificationQuestion[]> = {
  onboard: [
    { key: 'crm', question: 'Which CRM should I use for the client record?', choices: ['hubspot', 'notion', 'sheets'], reason: 'Needed to store client data.' },
    { key: 'notification', question: 'How should I notify your team about new clients?', choices: ['slack', 'email', 'discord'], reason: 'Needed for team alerts.' },
  ],
  lead: [
    { key: 'source', question: 'Where do leads come from?', choices: ['whatsapp', 'email', 'form'], reason: 'Needed to capture lead source.' },
    { key: 'crm', question: 'Which CRM should I save leads to?', choices: ['hubspot', 'notion', 'sheets'], reason: 'Needed to store lead data.' },
  ],
  invoice: [
    { key: 'payment', question: 'Which payment system do you use?', choices: ['stripe', 'manual', 'other'], reason: 'Needed for payment tracking.' },
    { key: 'accounting', question: 'Where should I update accounting records?', choices: ['sheets', 'notion', 'email'], reason: 'Needed for record keeping.' },
  ],
}

interface ClarificationState {
  pendingQuestions: ClarificationQuestion[]
  answers: Record<string, string>
  currentQuestionIndex: number
}

/**
 * Detect if a user request is broad and needs clarification
 * Returns the category if broad, null otherwise
 */
function detectBroadRequest(userInput: string): string | null {
  const input = userInput.toLowerCase()
  for (const category of Object.keys(CLARIFICATION_QUESTIONS)) {
    if (input.includes(category)) {
      return category
    }
  }
  return null
}

/**
 * Generate clarification state for a broad request
 */
function initClarificationState(category: string): ClarificationState {
  return {
    pendingQuestions: [...CLARIFICATION_QUESTIONS[category]],
    answers: {},
    currentQuestionIndex: 0,
  }
}

/**
 * Get the next clarification question or null if all answered
 */
function getNextClarificationQuestion(state: ClarificationState): ClarificationQuestion | null {
  if (state.currentQuestionIndex >= state.pendingQuestions.length) {
    return null
  }
  return state.pendingQuestions[state.currentQuestionIndex]
}

/**
 * Build execution plan from clarification answers
 * Returns a minimal plan using the chosen integrations
 */
function buildPlanFromClarification(category: string, answers: Record<string, string>): any {
  const tasks: any[] = []
  let taskId = 1

  // Build tasks based on category and answers
  if (category === 'onboard') {
    const crm = answers.crm || 'notion'
    const notification = answers.notification || 'slack'

    tasks.push({
      id: `task_${taskId++}`,
      name: 'Create Client Record',
      dependencies: [],
      config: {
        integration: crm,
        toolSlug: ACTION_CATALOG[`${crm.toUpperCase()}_CREATE_${crm === 'hubspot' ? 'CONTACT' : 'PAGE'}`]?.toolSlug || `${crm.toUpperCase()}_CREATE_PAGE`,
        params: {},
      },
    })
    tasks.push({
      id: `task_${taskId++}`,
      name: 'Notify Team',
      dependencies: [`task_${taskId - 2}`],
      config: {
        integration: notification,
        toolSlug: notification === 'email' ? 'GMAIL_SEND_EMAIL' : `${notification.toUpperCase()}_SEND_MESSAGE`,
        params: {},
      },
    })
  } else if (category === 'lead') {
    const crm = answers.crm || 'hubspot'
    tasks.push({
      id: `task_${taskId++}`,
      name: 'Save Lead to CRM',
      dependencies: [],
      config: {
        integration: crm,
        toolSlug: crm === 'hubspot' ? 'HUBSPOT_CREATE_CONTACT' : `${crm.toUpperCase()}_CREATE_PAGE`,
        params: {},
      },
    })
  } else if (category === 'invoice') {
    const accounting = answers.accounting || 'sheets'
    tasks.push({
      id: `task_${taskId++}`,
      name: 'Update Accounting',
      dependencies: [],
      config: {
        integration: accounting === 'sheets' ? 'googlesheets' : accounting,
        toolSlug: accounting === 'sheets' ? 'GOOGLESHEETS_BATCH_UPDATE' : `${accounting.toUpperCase()}_CREATE_PAGE`,
        params: {},
      },
    })
  }

  return {
    tasks,
    requiredIntegrations: [...new Set(tasks.map(t => t.config.integration))],
  }
}

/**
 * Workflows API Routes
 * All routes require clerk_user_id in headers
 */

// Middleware to extract clerk_user_id
const extractClerkUserId = (req: Request, res: Response, next: Function) => {
  const clerkUserId = req.headers['x-clerk-user-id'] as string || req.body?.clerk_user_id

  // In development mode, allow requests without authentication
  const isDev = process.env.NODE_ENV !== 'production'
  if (!clerkUserId) {
    if (isDev) {
      // Use dev mode user ID for local testing
      req.body.clerk_user_id = 'dev-user-local'
      console.log('[DEV MODE] Using dev-user-local for authentication')
      return next()
    }
    return res.status(401).json({ error: 'Authentication required' })
  }
  req.body.clerk_user_id = clerkUserId
  next()
}

/**
 * GET /api/workflows
 * List all workflows for the current user (for dashboard display)
 */
router.get('/', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.body.clerk_user_id

    // Get all workflows for the user across all projects
    const allWorkflows = await workflowService.getAllWorkflowsForUser(clerkUserId)

    res.json({
      success: true,
      data: allWorkflows || [],
      count: allWorkflows?.length || 0
    })
  } catch (error: any) {
    console.error('Error fetching all workflows:', error)
    // Return empty array on error (graceful degradation)
    res.json({
      success: true,
      data: [],
      count: 0,
      error: error.message
    })
  }
})

/**
 * POST /api/workflows
 * Create a new workflow from approved proposal (Story 4.1)
 * Move 6.15: Supports clarification mode for broad requests
 */
router.post('/', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const { name, description, workflow_type, user_input, config, clerk_user_id, executionMode, enableClarification } = req.body
    // In dev mode, use a default project_id UUID if not provided
    const isDev = process.env.NODE_ENV !== 'production'
    // Use a fixed UUID for dev mode that can be referenced consistently
    const DEV_PROJECT_UUID = '00000000-0000-0000-0000-000000000001'
    const project_id = req.body.project_id || (isDev ? DEV_PROJECT_UUID : null)

    if (!project_id || !name) {
      return res.status(400).json({ success: false, error: 'project_id and name are required' })
    }

    // Move 6.15: Check if this is a broad request needing clarification
    if (enableClarification && user_input) {
      const broadCategory = detectBroadRequest(user_input)
      if (broadCategory) {
        const clarificationState = initClarificationState(broadCategory)
        const firstQuestion = getNextClarificationQuestion(clarificationState)

        if (firstQuestion) {
          // Create workflow with clarification state
          const workflowConfig = {
            ...config,
            clarificationState,
            clarificationCategory: broadCategory,
          }

          const workflow = await workflowService.createWorkflow({
            project_id,
            name,
            description,
            workflow_type: workflow_type || 'BMAD',
            user_input: user_input || '',
            config: workflowConfig,
            created_by: clerk_user_id,
          })

          if (!workflow) {
            return res.status(500).json({ success: false, error: 'Failed to create workflow' })
          }

          return res.status(200).json({
            success: true,
            status: 'needs_clarification',
            workflowId: workflow.id,
            question: firstQuestion.question,
            choices: firstQuestion.choices,
            reason: firstQuestion.reason,
            data: workflow,
          })
        }
      }
    }

    // Move 6.11: Store executionMode in config for verified templates
    const workflowConfig = {
      ...config,
      ...(executionMode && { executionMode }),
    }

    const workflow = await workflowService.createWorkflow({
      project_id,
      name,
      description,
      workflow_type: workflow_type || 'BMAD',
      user_input: user_input || '',
      config: workflowConfig,
      created_by: clerk_user_id,
    })

    if (!workflow) {
      return res.status(500).json({ success: false, error: 'Failed to create workflow' })
    }

    res.status(201).json({ success: true, data: workflow })
  } catch (error: any) {
    console.error('Error creating workflow:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to create workflow' })
  }
})

/**
 * GET /api/workflows/project/:projectId
 * Get all workflows for a project
 */
router.get('/project/:projectId', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.body.clerk_user_id
    const workflows = await workflowService.getWorkflowsForProject(req.params.projectId, clerkUserId)
    res.json({ success: true, data: workflows })
  } catch (error: any) {
    console.error('Error fetching workflows:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch workflows' })
  }
})

/**
 * GET /api/workflows/:id
 * Get a single workflow by ID
 */
router.get('/:id', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.body.clerk_user_id
    const workflow = await workflowService.getWorkflowById(req.params.id, clerkUserId)

    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found or access denied' })
    }

    res.json({ success: true, data: workflow })
  } catch (error: any) {
    console.error('Error fetching workflow:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch workflow' })
  }
})

/**
 * POST /api/workflows/:id/clarify
 * Move 6.15: Handle clarification answer and continue planning
 */
router.post('/:id/clarify', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const { answer } = req.body
    const clerkUserId = req.body.clerk_user_id
    const workflow = await workflowService.getWorkflowById(req.params.id, clerkUserId)

    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found' })
    }

    const config = workflow.config as any
    if (!config?.clarificationState) {
      return res.status(400).json({ success: false, error: 'Workflow is not in clarification mode' })
    }

    const state = config.clarificationState as ClarificationState
    const currentQuestion = state.pendingQuestions[state.currentQuestionIndex]

    if (!currentQuestion) {
      return res.status(400).json({ success: false, error: 'No pending clarification question' })
    }

    // Record answer and advance
    state.answers[currentQuestion.key] = answer
    state.currentQuestionIndex++

    // Check if there are more questions
    const nextQuestion = getNextClarificationQuestion(state)

    // Emit SSE event for answer received
    broadcastWorkflowUpdate({
      workflowId: req.params.id,
      type: 'golden_path_clarification_answered',
      timestamp: new Date().toISOString(),
      questionKey: currentQuestion.key,
      answer,
    })

    if (nextQuestion) {
      // More questions to ask - update workflow and return next question
      await workflowService.updateWorkflow(req.params.id, {
        config: { ...config, clarificationState: state },
      })

      // Emit SSE event for next question
      broadcastWorkflowUpdate({
        workflowId: req.params.id,
        type: 'golden_path_clarification_asked',
        timestamp: new Date().toISOString(),
        question: nextQuestion.question,
        choices: nextQuestion.choices,
      })

      return res.status(200).json({
        success: true,
        status: 'needs_clarification',
        workflowId: req.params.id,
        question: nextQuestion.question,
        choices: nextQuestion.choices,
        reason: nextQuestion.reason,
      })
    }

    // All questions answered - build execution plan
    const category = config.clarificationCategory as string
    const executionPlan = buildPlanFromClarification(category, state.answers)

    // Emit SSE event for clarification complete
    broadcastWorkflowUpdate({
      workflowId: req.params.id,
      type: 'golden_path_clarification_complete',
      timestamp: new Date().toISOString(),
      answers: state.answers,
      executionPlan,
    })

    // Move 6.16: Run validation pipeline (same as /execute)
    const missingParamTasks: Array<{ taskId: string; toolSlug: string; missingParams: string[] }> = []
    for (const task of executionPlan.tasks) {
      const paramValidation = validateRequiredParams(task)
      if (!paramValidation.valid && paramValidation.missingParams) {
        missingParamTasks.push({
          taskId: task.id,
          toolSlug: task.config?.toolSlug || 'UNKNOWN',
          missingParams: paramValidation.missingParams,
        })
      }
    }

    // Try autofill if we have missing params
    // Convert answers object to string for autofill regex matching
    const answersAsString = Object.values(state.answers).join(' ')
    if (missingParamTasks.length > 0) {
      const autoFillResult = autoFillParams(executionPlan.tasks, missingParamTasks, answersAsString)

      if (autoFillResult.filled) {
        broadcastWorkflowUpdate({
          workflowId: req.params.id,
          type: 'golden_path_autofill_applied',
          timestamp: new Date().toISOString(),
          filledParams: autoFillResult.filledParams.map(p => ({ taskId: p.taskId, param: p.param, source: p.source })),
        })
      }

      // Re-validate after autofill to check if all params are now filled
      const stillMissing: typeof missingParamTasks = []
      for (const task of executionPlan.tasks) {
        const paramValidation = validateRequiredParams(task)
        if (!paramValidation.valid && paramValidation.missingParams) {
          stillMissing.push({
            taskId: task.id,
            toolSlug: task.config?.toolSlug || 'UNKNOWN',
            missingParams: paramValidation.missingParams,
          })
        }
      }

      // Check if still missing after autofill
      if (stillMissing.length > 0) {
        const { userPrompt, exampleAnswer } = generateUserPrompt(stillMissing)

        await workflowService.updateWorkflow(req.params.id, {
          config: { ...config, executionPlan, clarificationState: undefined, clarificationCategory: undefined },
          status: 'pending',
        })

        return res.status(200).json({
          success: true,
          status: 'needs_user_input',
          workflowId: req.params.id,
          executionPlan,
          missingParams: stillMissing,
          userPrompt,
          exampleAnswer,
          message: 'Workflow plan ready but needs additional input.',
        })
      }
    }

    // All validation passed - ready to execute
    await workflowService.updateWorkflow(req.params.id, {
      config: {
        ...config,
        executionPlan,
        clarificationState: undefined,
        clarificationCategory: undefined,
        clarificationComplete: true,
      },
      status: 'ready',
    })

    broadcastWorkflowUpdate({
      workflowId: req.params.id,
      type: 'golden_path_ready_to_execute',
      timestamp: new Date().toISOString(),
      executionPlan,
    })

    return res.status(200).json({
      success: true,
      status: 'ready_to_execute',
      workflowId: req.params.id,
      executionPlan,
      message: 'Clarification complete. Workflow is ready to execute.',
    })
  } catch (error: any) {
    console.error('Error processing clarification:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to process clarification' })
  }
})

/**
 * PUT /api/workflows/:id
 * Update a workflow
 */
router.put('/:id', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const { name, description, status, config, clerk_user_id } = req.body

    const workflow = await workflowService.updateWorkflow(req.params.id, clerk_user_id, {
      name,
      description,
      status,
      config,
    })

    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found or access denied' })
    }

    res.json({ success: true, data: workflow })
  } catch (error: any) {
    console.error('Error updating workflow:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to update workflow' })
  }
})

/**
 * POST /api/workflows/:id/cancel
 * Cancel a running workflow (Story 4.7)
 */
router.post('/:id/cancel', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.body.clerk_user_id
    const result = await workflowService.cancelWorkflow(req.params.id, clerkUserId)

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error })
    }

    res.json({ success: true, message: 'Workflow cancelled successfully' })
  } catch (error: any) {
    console.error('Error cancelling workflow:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to cancel workflow' })
  }
})

/**
 * POST /api/workflows/:id/retry
 * Retry a failed workflow from last checkpoint (Story 4.8)
 */
router.post('/:id/retry', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.body.clerk_user_id
    const result = await workflowService.retryWorkflow(req.params.id, clerkUserId)

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error })
    }

    res.json({ success: true, message: 'Workflow retry initiated', checkpoint: result.checkpoint })
  } catch (error: any) {
    console.error('Error retrying workflow:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to retry workflow' })
  }
})

/**
 * GET /api/workflows/:id/checkpoints
 * Get all checkpoints for a workflow
 */
router.get('/:id/checkpoints', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.body.clerk_user_id

    // Verify access
    const workflow = await workflowService.getWorkflowById(req.params.id, clerkUserId)
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found or access denied' })
    }

    const checkpoints = await workflowService.getCheckpoints(req.params.id)
    res.json({ success: true, data: checkpoints })
  } catch (error: any) {
    console.error('Error fetching checkpoints:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch checkpoints' })
  }
})

/**
 * DELETE /api/workflows/:id
 * Delete a workflow
 */
router.delete('/:id', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.body.clerk_user_id
    const success = await workflowService.deleteWorkflow(req.params.id, clerkUserId)

    if (!success) {
      return res.status(404).json({ success: false, error: 'Workflow not found or access denied' })
    }

    res.json({ success: true, message: 'Workflow deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting workflow:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to delete workflow' })
  }
})

// =============================================================================
// BMAD Orchestration Routes (Story 4.2 & 4.4)
// =============================================================================

/**
 * POST /api/workflows/:id/start
 * Start the BMAD planning stage - Director analyzes and creates execution plan
 */
router.post('/:id/start', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.body.clerk_user_id

    // Verify access
    const workflow = await workflowService.getWorkflowById(req.params.id, clerkUserId)
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found or access denied' })
    }

    // Update to planning status
    await workflowService.updateWorkflowStatus(req.params.id, 'planning')

    // Run planning stage
    const result = await bmadOrchestrator.runPlanningStage(req.params.id)

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error })
    }

    res.json({
      success: true,
      message: 'Planning complete - awaiting approval',
      plan: result.plan,
    })
  } catch (error: any) {
    console.error('Error starting workflow:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to start workflow' })
  }
})

/**
 * GET /api/workflows/:id/plan
 * Get the execution plan for a workflow
 */
router.get('/:id/plan', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.body.clerk_user_id

    const workflow = await workflowService.getWorkflowById(req.params.id, clerkUserId)
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found or access denied' })
    }

    const plan = workflow.config?.executionPlan
    if (!plan) {
      return res.status(404).json({ success: false, error: 'No execution plan found - workflow may not have been started' })
    }

    res.json({ success: true, data: plan })
  } catch (error: any) {
    console.error('Error fetching plan:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch plan' })
  }
})

/**
 * POST /api/workflows/:id/approve
 * Approve the execution plan and begin orchestrating stage
 */
router.post('/:id/approve', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.body.clerk_user_id

    const workflow = await workflowService.getWorkflowById(req.params.id, clerkUserId)
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found or access denied' })
    }

    if (workflow.status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        error: `Cannot approve workflow in '${workflow.status}' status. Expected 'pending_approval'.`,
      })
    }

    // Run orchestrating stage
    const result = await bmadOrchestrator.runOrchestratingStage(req.params.id)

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error })
    }

    res.json({
      success: true,
      message: 'Plan approved - workflow is now building',
    })
  } catch (error: any) {
    console.error('Error approving workflow:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to approve workflow' })
  }
})

/**
 * POST /api/workflows/:id/execute
 * Execute all tasks in the workflow (Story 4.4)
 */
router.post('/:id/execute', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.body.clerk_user_id

    const workflow = await workflowService.getWorkflowById(req.params.id, clerkUserId)
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found or access denied' })
    }

    if (workflow.status !== 'building') {
      return res.status(400).json({
        success: false,
        error: `Cannot execute workflow in '${workflow.status}' status. Expected 'building'.`,
      })
    }

    const plan = workflow.config?.executionPlan as any
    if (!plan?.tasks) {
      return res.status(400).json({ success: false, error: 'No execution plan found' })
    }

    // =========================================================================
    // Move 6.16b: Merge user-provided params into tasks BEFORE validation
    // This fixes the loop where needs_user_input keeps asking for the same field
    // =========================================================================
    const providedParams = req.body.providedParams as Record<string, Record<string, unknown>> | undefined
    if (providedParams) {
      for (const task of plan.tasks) {
        const taskParams = providedParams[task.id]
        if (taskParams) {
          // Ensure config.params exists
          if (!task.config) task.config = {}
          if (!task.config.params) task.config.params = {}
          // Merge provided params into task params
          Object.assign(task.config.params, taskParams)
          console.log(`[Execute] Merged providedParams for ${task.id}:`, taskParams)
        }
      }
    }

    // =========================================================================
    // Move 6.5 + 6.11: Execution Preflight - Check required integrations
    // For verified_template mode, missing integrations trigger demo mode instead of failure
    // =========================================================================
    const requiredIntegrations: string[] = plan.requiredIntegrations || []
    const isVerifiedTemplate = workflow.config?.executionMode === 'verified_template'

    if (requiredIntegrations.length > 0) {
      const missingIntegrations: string[] = []

      for (const integration of requiredIntegrations) {
        try {
          const status = await composioService.checkConnection(integration)
          if (!status.connected) {
            missingIntegrations.push(integration)
          }
        } catch {
          // If check fails, assume disconnected
          missingIntegrations.push(integration)
        }
      }

      if (missingIntegrations.length > 0) {
        // Move 6.11: Verified templates run in demo mode instead of failing
        if (isVerifiedTemplate) {
          console.log(`[Workflows] Verified template running in demo mode (missing: ${missingIntegrations.join(', ')})`)

          // Generate demo results for all tasks
          const demoResults: Record<string, any> = {}
          for (const task of plan.tasks) {
            const toolSlug = task.config?.toolSlug || 'UNKNOWN_TOOL'
            demoResults[task.id] = {
              success: true,
              demo: true,
              toolSlug,
              mockOutput: generateDemoResult(toolSlug),
              message: `[DEMO] ${task.name || task.id} - simulated execution`,
            }
          }

          // Emit SSE event for demo mode
          broadcastWorkflowUpdate({
            workflowId: req.params.id,
            type: 'golden_path_demo_mode_used',
            timestamp: new Date().toISOString(),
            missingIntegrations,
            taskCount: plan.tasks.length,
          })

          // Mark workflow as completed (demo)
          await workflowService.updateWorkflowStatus(req.params.id, 'completed')

          return res.json({
            success: true,
            status: 'completed_demo',
            demo: true,
            message: 'Workflow executed in demo mode (integrations not connected)',
            missingIntegrations,
            taskResults: demoResults,
          })
        } else {
          // Emit SSE event for preflight failure
          broadcastWorkflowUpdate({
            workflowId: req.params.id,
            type: 'golden_path_preflight_failed',
            timestamp: new Date().toISOString(),
            missingIntegrations,
          })

          return res.status(400).json({
            success: false,
            error: `Connect ${missingIntegrations.join(', ')} before execution`,
            missingIntegrations,
          })
        }
      }
    }

    // =========================================================================
    // Move 6.6 + 6.8 + 6.9: Plan Validation with user-friendly missing param handling
    // - Invalid toolSlug: hard 400 error (can't auto-fix)
    // - Missing params: soft 200 with needs_user_input (can prompt user)
    // =========================================================================
    const invalidSlugTasks: Array<{ taskId: string; reason: string }> = []
    const missingParamTasks: Array<{ taskId: string; toolSlug: string; missingParams: string[] }> = []

    for (const task of plan.tasks) {
      // Step 1: Validate and normalize tool slug
      const slugValidation = validateAndNormalizeToolSlug(task)
      if (!slugValidation.valid) {
        invalidSlugTasks.push({ taskId: task.id, reason: slugValidation.reason || 'Unknown error' })
        continue // Skip param validation if slug is invalid
      }

      // Auto-normalize the tool slug
      if (slugValidation.normalizedSlug && task.config) {
        task.config.toolSlug = slugValidation.normalizedSlug
      }

      // Step 2 (Move 6.8): Validate required params
      const paramValidation = validateRequiredParams(task)
      if (!paramValidation.valid && paramValidation.missingParams) {
        missingParamTasks.push({
          taskId: task.id,
          toolSlug: task.config?.toolSlug || 'unknown',
          missingParams: paramValidation.missingParams,
        })
      }
    }

    // Invalid toolSlug = hard failure (can't fix without code change)
    if (invalidSlugTasks.length > 0) {
      broadcastWorkflowUpdate({
        workflowId: req.params.id,
        type: 'golden_path_plan_invalid',
        timestamp: new Date().toISOString(),
        invalidTasks: invalidSlugTasks,
      })

      return res.status(400).json({
        success: false,
        error: 'Invalid workflow plan',
        invalidTasks: invalidSlugTasks,
      })
    }

    // =========================================================================
    // Move 6.16b: Helper to add inputKey to missing fields for stable UI binding
    // =========================================================================
    const addInputKeys = (fields: typeof missingParamTasks) => {
      return fields.map(f => ({
        ...f,
        inputKeys: f.missingParams.map(param => `${f.taskId}.${param}`),
      }))
    }

    // =========================================================================
    // Move 6.10: Try autofill before returning needs_user_input
    // =========================================================================
    if (missingParamTasks.length > 0) {
      // Try to auto-fill from user_input and safe defaults
      const userInput = workflow.user_input as string | undefined
      const autoFillResult = autoFillParams(plan.tasks, missingParamTasks, userInput)

      if (autoFillResult.filled) {
        // Emit SSE event for autofill (no secrets in payload)
        broadcastWorkflowUpdate({
          workflowId: req.params.id,
          type: 'golden_path_autofill_applied',
          timestamp: new Date().toISOString(),
          filledParams: autoFillResult.filledParams.map(p => ({
            taskId: p.taskId,
            param: p.param,
            source: p.source,
          })),
        })

        // Re-validate after autofill to check if all params are now filled
        const stillMissing: typeof missingParamTasks = []
        for (const task of plan.tasks) {
          const paramValidation = validateRequiredParams(task)
          if (!paramValidation.valid && paramValidation.missingParams) {
            stillMissing.push({
              taskId: task.id,
              toolSlug: task.config?.toolSlug || 'unknown',
              missingParams: paramValidation.missingParams,
            })
          }
        }

        // If all params filled, continue to execution
        if (stillMissing.length === 0) {
          // Fall through to execution below
        } else {
          // Move 6.12: Generate user-friendly prompt for missing fields
          const { userPrompt, exampleAnswer } = generateUserPrompt(stillMissing)

          // Still missing some params after autofill
          broadcastWorkflowUpdate({
            workflowId: req.params.id,
            type: 'golden_path_needs_user_input',
            timestamp: new Date().toISOString(),
            missingFields: stillMissing,
          })

          // Move 6.12: Emit prompt generated event
          broadcastWorkflowUpdate({
            workflowId: req.params.id,
            type: 'golden_path_user_prompt_generated',
            timestamp: new Date().toISOString(),
            userPrompt,
            exampleAnswer,
          })

          return res.status(200).json({
            success: true,
            status: 'needs_user_input',
            workflowId: req.params.id,
            missingFields: addInputKeys(stillMissing),
            userPrompt,
            exampleAnswer,
            message: 'I need more info before I can run this workflow.',
          })
        }
      } else {
        // Move 6.12: Generate user-friendly prompt for missing fields
        const { userPrompt, exampleAnswer } = generateUserPrompt(missingParamTasks)

        // Move 6.9: No autofill possible, prompt user for input
        broadcastWorkflowUpdate({
          workflowId: req.params.id,
          type: 'golden_path_needs_user_input',
          timestamp: new Date().toISOString(),
          missingFields: missingParamTasks,
        })

        // Move 6.12: Emit prompt generated event
        broadcastWorkflowUpdate({
          workflowId: req.params.id,
          type: 'golden_path_user_prompt_generated',
          timestamp: new Date().toISOString(),
          userPrompt,
          exampleAnswer,
        })

        return res.status(200).json({
          success: true,
          status: 'needs_user_input',
          workflowId: req.params.id,
          missingFields: addInputKeys(missingParamTasks),
          userPrompt,
          exampleAnswer,
          message: 'I need more info before I can run this workflow.',
        })
      }
    }

    // Execute tasks in dependency order
    const completedTasks: string[] = []
    const taskResults: Record<string, any> = {}

    for (const task of plan.tasks) {
      // Check dependencies are met
      const depsComplete = task.dependencies.every((dep: string) => completedTasks.includes(dep))
      if (!depsComplete) {
        return res.status(400).json({
          success: false,
          error: `Task ${task.id} dependencies not met`,
        })
      }

      const result = await bmadOrchestrator.executeTask(req.params.id, task.id)
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: `Task ${task.id} failed: ${result.error}`,
          completedTasks,
        })
      }

      completedTasks.push(task.id)
      taskResults[task.id] = result.output
    }

    // Complete workflow
    await bmadOrchestrator.completeWorkflow(req.params.id)

    res.json({
      success: true,
      message: 'Workflow execution completed',
      taskResults,
    })
  } catch (error: any) {
    console.error('Error executing workflow:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to execute workflow' })
  }
})

/**
 * POST /api/workflows/:id/execute-coordinated
 * Execute workflow with multi-agent coordination (Story 4.5)
 * Uses Director, Supervisor, and specialized agents
 */
router.post('/:id/execute-coordinated', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.body.clerk_user_id

    const workflow = await workflowService.getWorkflowById(req.params.id, clerkUserId)
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found or access denied' })
    }

    if (workflow.status !== 'building' && workflow.status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        error: `Cannot execute workflow in '${workflow.status}' status. Expected 'building' or 'pending_approval'.`,
      })
    }

    // If pending approval, first approve it
    if (workflow.status === 'pending_approval') {
      const approveResult = await bmadOrchestrator.runOrchestratingStage(req.params.id)
      if (!approveResult.success) {
        return res.status(400).json({ success: false, error: approveResult.error })
      }
    }

    // Execute with multi-agent coordination
    const result = await bmadOrchestrator.executeWithCoordination(req.params.id)

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        results: result.results,
      })
    }

    res.json({
      success: true,
      message: 'Workflow completed with multi-agent coordination',
      results: result.results,
    })
  } catch (error: any) {
    console.error('Error executing coordinated workflow:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to execute workflow' })
  }
})

/**
 * GET /api/workflows/:id/nodes
 * Get workflow nodes for visualization (Epic 5)
 */
router.get('/:id/nodes', extractClerkUserId, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.body.clerk_user_id

    const workflow = await workflowService.getWorkflowById(req.params.id, clerkUserId)
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found or access denied' })
    }

    // Get nodes from database
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: nodes, error } = await supabase
      .from('workflow_nodes')
      .select('*')
      .eq('workflow_id', req.params.id)
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    res.json({ success: true, data: nodes || [] })
  } catch (error: any) {
    console.error('Error fetching nodes:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch nodes' })
  }
})

export default router
