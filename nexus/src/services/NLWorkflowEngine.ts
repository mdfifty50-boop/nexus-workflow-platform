/**
 * NL Workflow Engine - Natural Language to Workflow JSON
 *
 * Converts natural language commands (English or Arabic) into executable
 * workflow JSON with correct Composio tool references.
 *
 * Success Criteria:
 * - Parse "When I get a Shopify order, add to Google Sheets and notify on Slack"
 * - Generate valid workflow JSON with Composio tool slugs
 * - Handle Arabic input (detect, translate, generate English workflow)
 * - Response time <30 seconds
 * - Works 90%+ on common e-commerce workflows
 *
 * @module NLWorkflowEngine
 */

import { apiClient } from '../lib/api-client'
import { TOOL_SLUGS } from './ComposioClient'

// ============================================================================
// Types
// ============================================================================

export interface WorkflowTrigger {
  type: 'webhook' | 'schedule' | 'event' | 'manual'
  source: string // e.g., 'shopify', 'gmail', 'stripe'
  event: string  // e.g., 'new_order', 'new_email', 'payment_received'
  composioTool?: string // Composio tool slug for trigger
  config?: Record<string, unknown>
}

export interface WorkflowAction {
  id: string
  name: string
  description: string
  tool: string // Composio tool slug
  toolkit: string // e.g., 'googlesheets', 'slack', 'gmail'
  inputs: Record<string, unknown>
  dependsOn: string[]
  retryConfig?: {
    maxRetries: number
    retryDelayMs: number
  }
}

export interface GeneratedWorkflowJSON {
  id: string
  name: string
  description: string
  version: '1.0'
  trigger: WorkflowTrigger
  actions: WorkflowAction[]
  variables: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array'
    description: string
    defaultValue?: unknown
  }>
  metadata: {
    generatedAt: string
    inputLanguage: string
    translatedFrom?: string
    originalInput: string
    confidence: number
    estimatedDurationMs: number
    requiredConnections: string[]
    parseTimeMs?: number
  }
}

export interface NLParseResult {
  success: boolean
  workflow?: GeneratedWorkflowJSON
  error?: string
  warnings?: string[]
  suggestedQuestions?: string[] // If we need more info
  parseTimeMs: number
}

// ============================================================================
// Trigger Patterns - "When X happens" detection
// ============================================================================

interface TriggerPattern {
  source: string
  events: {
    name: string
    patterns: RegExp[]
    composioTrigger?: string
  }[]
}

const TRIGGER_PATTERNS: TriggerPattern[] = [
  {
    source: 'shopify',
    events: [
      {
        name: 'new_order',
        patterns: [
          /(?:when|whenever|if)\s+(?:i\s+)?(?:get|receive|have)\s+(?:a\s+)?(?:new\s+)?(?:shopify\s+)?order/i,
          /(?:new|incoming)\s+shopify\s+order/i,
          /shopify\s+(?:order|sale)\s+(?:comes\s+in|arrives|received)/i,
          /someone\s+(?:orders|buys)\s+(?:from\s+)?(?:my\s+)?(?:shopify\s+)?(?:store|shop)/i,
        ],
        composioTrigger: 'SHOPIFY_NEW_ORDER_TRIGGER',
      },
      {
        name: 'order_paid',
        patterns: [
          /(?:when|whenever)\s+(?:a\s+)?(?:shopify\s+)?order\s+(?:is\s+)?paid/i,
          /(?:shopify\s+)?payment\s+(?:received|confirmed)/i,
        ],
        composioTrigger: 'SHOPIFY_ORDER_PAID_TRIGGER',
      },
      {
        name: 'order_fulfilled',
        patterns: [
          /(?:when|whenever)\s+(?:a\s+)?(?:shopify\s+)?order\s+(?:is\s+)?(?:fulfilled|shipped)/i,
        ],
        composioTrigger: 'SHOPIFY_ORDER_FULFILLED_TRIGGER',
      },
    ],
  },
  {
    source: 'stripe',
    events: [
      {
        name: 'payment_received',
        patterns: [
          /(?:when|whenever|if)\s+(?:i\s+)?(?:get|receive)\s+(?:a\s+)?(?:stripe\s+)?payment/i,
          /(?:when\s+)?(?:a\s+)?(?:stripe\s+)?payment\s+(?:is\s+)?(?:received|successful|completed)/i,
          /(?:new|incoming)\s+(?:stripe\s+)?(?:payment|charge)/i,
        ],
        composioTrigger: 'STRIPE_PAYMENT_RECEIVED_TRIGGER',
      },
      {
        name: 'subscription_created',
        patterns: [
          /(?:when|whenever)\s+(?:a\s+)?(?:new\s+)?(?:stripe\s+)?subscription/i,
          /(?:new|incoming)\s+(?:stripe\s+)?subscriber/i,
        ],
        composioTrigger: 'STRIPE_SUBSCRIPTION_CREATED_TRIGGER',
      },
    ],
  },
  {
    source: 'gmail',
    events: [
      {
        name: 'new_email',
        patterns: [
          /(?:when|whenever|if)\s+(?:i\s+)?(?:get|receive)\s+(?:a\s+|an\s+)?(?:new\s+)?email/i,
          /(?:when|whenever)\s+(?:a\s+)?(?:new\s+)?email\s+(?:arrives|comes|is\s+received)/i,
          /(?:new|incoming)\s+(?:email|message)\s+(?:arrives|received)/i,
          /email\s+(?:comes\s+in|arrives)/i,
        ],
        composioTrigger: 'GMAIL_NEW_EMAIL_TRIGGER',
      },
    ],
  },
  {
    source: 'github',
    events: [
      {
        name: 'new_issue',
        patterns: [
          /(?:when|whenever)\s+(?:a\s+)?(?:new\s+)?(?:github\s+)?issue\s+(?:is\s+)?(?:created|opened)/i,
          /(?:new|incoming)\s+(?:github\s+)?issue/i,
        ],
        composioTrigger: 'GITHUB_ISSUE_CREATED_TRIGGER',
      },
      {
        name: 'new_pr',
        patterns: [
          /(?:when|whenever)\s+(?:a\s+)?(?:new\s+)?(?:pr|pull\s+request)\s+(?:is\s+)?(?:created|opened)/i,
          /(?:new|incoming)\s+(?:pr|pull\s+request)/i,
        ],
        composioTrigger: 'GITHUB_PR_CREATED_TRIGGER',
      },
    ],
  },
  {
    source: 'woocommerce',
    events: [
      {
        name: 'new_order',
        patterns: [
          /(?:when|whenever|if)\s+(?:i\s+)?(?:get|receive)\s+(?:a\s+)?(?:new\s+)?(?:woocommerce\s+)?order/i,
          /(?:new|incoming)\s+woocommerce\s+order/i,
        ],
        composioTrigger: 'WOOCOMMERCE_NEW_ORDER_TRIGGER',
      },
    ],
  },
  {
    source: 'typeform',
    events: [
      {
        name: 'form_submitted',
        patterns: [
          /(?:when|whenever)\s+(?:someone\s+)?(?:submits|fills\s+out)\s+(?:a\s+)?(?:typeform|form)/i,
          /(?:new\s+)?(?:typeform|form)\s+(?:submission|response)/i,
        ],
        composioTrigger: 'TYPEFORM_RESPONSE_TRIGGER',
      },
    ],
  },
]

// ============================================================================
// Action Patterns - "do Y and Z" detection
// ============================================================================

interface ActionPattern {
  toolkit: string
  actions: {
    name: string
    patterns: RegExp[]
    toolSlug: string
    defaultInputs?: Record<string, unknown>
  }[]
}

const ACTION_PATTERNS: ActionPattern[] = [
  {
    toolkit: 'googlesheets',
    actions: [
      {
        name: 'add_row',
        patterns: [
          /add\s+(?:it\s+)?(?:to\s+)?(?:a\s+)?(?:google\s+)?(?:sheets?|spreadsheet)/i,
          /(?:log|record|save|store)\s+(?:it\s+)?(?:in|to)\s+(?:a\s+)?(?:google\s+)?(?:sheets?|spreadsheet)/i,
          /(?:update|append\s+to)\s+(?:a\s+)?(?:google\s+)?(?:sheets?|spreadsheet)/i,
          /(?:google\s+)?sheets?\s+(?:entry|row|record)/i,
        ],
        toolSlug: TOOL_SLUGS.googleSheets.append,
        defaultInputs: {
          range: 'A1',
        },
      },
      {
        name: 'read_data',
        patterns: [
          /(?:read|get|fetch)\s+(?:data\s+)?(?:from\s+)?(?:google\s+)?(?:sheets?|spreadsheet)/i,
        ],
        toolSlug: TOOL_SLUGS.googleSheets.read,
      },
    ],
  },
  {
    toolkit: 'slack',
    actions: [
      {
        name: 'send_message',
        patterns: [
          /(?:notify|alert|message|post\s+(?:to|on)|send\s+(?:a\s+)?(?:message\s+)?(?:to|on))\s+(?:a\s+)?slack/i,
          /slack\s+(?:notification|message|alert)/i,
          /(?:tell|inform)\s+(?:the\s+)?team\s+(?:on\s+)?slack/i,
          /(?:post|share)\s+(?:it\s+)?(?:on|to|in)\s+slack/i,
          /notify\s+(?:on\s+)?slack/i,
          /post\s+to\s+slack/i,
          /alert\s+(?:on\s+)?slack/i,
        ],
        toolSlug: TOOL_SLUGS.slack.send,
        defaultInputs: {
          channel: '#general',
        },
      },
    ],
  },
  {
    toolkit: 'gmail',
    actions: [
      {
        name: 'send_email',
        patterns: [
          /(?:send|email|mail)\s+(?:an?\s+)?(?:email|notification)/i,
          /email\s+(?:it\s+)?(?:to|the)/i,
          /(?:notify|alert)\s+(?:via\s+)?email/i,
        ],
        toolSlug: TOOL_SLUGS.gmail.send,
      },
    ],
  },
  {
    toolkit: 'github',
    actions: [
      {
        name: 'create_issue',
        patterns: [
          /(?:create|open|file)\s+(?:a\s+)?(?:github\s+)?issue/i,
          /(?:github\s+)?issue\s+(?:for|about)/i,
        ],
        toolSlug: TOOL_SLUGS.github.createIssue,
      },
    ],
  },
  {
    toolkit: 'hubspot',
    actions: [
      {
        name: 'create_contact',
        patterns: [
          /(?:add|create)\s+(?:a\s+)?(?:hubspot\s+)?contact/i,
          /(?:save|store)\s+(?:customer|lead)\s+(?:in|to)\s+hubspot/i,
        ],
        toolSlug: TOOL_SLUGS.hubspot.createContact,
      },
      {
        name: 'create_deal',
        patterns: [
          /(?:create|add)\s+(?:a\s+)?(?:hubspot\s+)?deal/i,
        ],
        toolSlug: TOOL_SLUGS.hubspot.createDeal,
      },
    ],
  },
  {
    toolkit: 'discord',
    actions: [
      {
        name: 'send_message',
        patterns: [
          /(?:notify|message|post\s+to|send\s+to)\s+discord/i,
          /discord\s+(?:notification|message)/i,
        ],
        toolSlug: 'DISCORD_SEND_MESSAGE',
      },
    ],
  },
  {
    toolkit: 'notion',
    actions: [
      {
        name: 'add_page',
        patterns: [
          /(?:add|create)\s+(?:a\s+)?(?:notion\s+)?(?:page|entry)/i,
          /(?:save|log)\s+(?:to|in)\s+notion/i,
        ],
        toolSlug: 'NOTION_CREATE_PAGE',
      },
    ],
  },
  {
    toolkit: 'airtable',
    actions: [
      {
        name: 'add_record',
        patterns: [
          /(?:add|create)\s+(?:a\s+)?(?:airtable\s+)?record/i,
          /(?:save|log)\s+(?:to|in)\s+airtable/i,
        ],
        toolSlug: TOOL_SLUGS.zapier.airtableCreate,
      },
    ],
  },
  {
    toolkit: 'twilio',
    actions: [
      {
        name: 'send_sms',
        patterns: [
          /(?:send|text)\s+(?:a\s+)?(?:sms|text\s+message)/i,
          /sms\s+(?:notification|alert)/i,
        ],
        toolSlug: TOOL_SLUGS.zapier.twilioSms,
      },
    ],
  },
]

// ============================================================================
// Arabic Language Detection & Translation
// ============================================================================

/**
 * Detects if text contains Arabic characters
 */
function isArabic(text: string): boolean {
  // Arabic Unicode range: \u0600-\u06FF (includes Arabic, Arabic Extended-A)
  // Also includes Arabic Presentation Forms-A and B
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/
  return arabicRegex.test(text)
}

/**
 * Common Arabic e-commerce phrases for quick translation
 */
const ARABIC_QUICK_TRANSLATIONS: Record<string, string> = {
  // Triggers
  'عندما احصل على طلب': 'when I get an order',
  'طلب جديد': 'new order',
  'طلب شوبيفاي': 'Shopify order',
  'عند استلام طلب': 'when receiving an order',
  'لما يجي طلب': 'when an order comes',

  // Actions
  'اضف الى': 'add to',
  'اضفه الى': 'add it to',
  'جداول البيانات': 'spreadsheet',
  'جوجل شيت': 'Google Sheets',
  'اشعرني': 'notify me',
  'ابلغني': 'notify me',
  'ارسل رسالة': 'send a message',
  'سلاك': 'Slack',

  // Connectors
  'و': 'and',
  'ثم': 'then',
  'بعد ذلك': 'after that',
}

/**
 * Translates Arabic text to English using Claude API
 */
async function translateArabicToEnglish(arabicText: string): Promise<{
  english: string
  wasTranslated: boolean
}> {
  // Quick translation for common phrases
  let quickTranslated = arabicText
  for (const [arabic, english] of Object.entries(ARABIC_QUICK_TRANSLATIONS)) {
    quickTranslated = quickTranslated.replace(new RegExp(arabic, 'gi'), english)
  }

  // If no Arabic remains after quick translation, use it
  if (!isArabic(quickTranslated)) {
    return { english: quickTranslated, wasTranslated: true }
  }

  // Full AI translation for complex phrases
  try {
    const response = await apiClient.chat({
      messages: [
        {
          role: 'user',
          content: `Translate this Arabic workflow automation request to English. Keep the intent clear for a workflow system to parse:

Arabic: "${arabicText}"

Translate to natural English that describes the workflow trigger and actions. For example:
- "عندما احصل على طلب شوبيفاي، اضفه الى جوجل شيت و ابلغني على سلاك"
→ "When I get a Shopify order, add it to Google Sheets and notify me on Slack"

Respond with ONLY the English translation, nothing else.`,
        },
      ],
      model: 'claude-3-5-haiku-20241022', // Fast for translation
      maxTokens: 500,
    })

    if (response.success && response.output) {
      return { english: response.output.trim(), wasTranslated: true }
    }
  } catch (error) {
    console.error('[NLWorkflowEngine] Translation failed:', error)
  }

  // Fallback: return the quick translation attempt
  return { english: quickTranslated, wasTranslated: true }
}

// ============================================================================
// NL Workflow Engine Class
// ============================================================================

export class NLWorkflowEngine {
  /**
   * Parse natural language input and generate workflow JSON
   *
   * @param input - Natural language command (English or Arabic)
   * @returns ParseResult with workflow JSON or error
   */
  async parse(input: string): Promise<NLParseResult> {
    const startTime = Date.now()

    try {
      let processedInput = input.trim()
      let inputLanguage = 'en'
      let translatedFrom: string | undefined

      // Step 1: Detect and translate Arabic
      if (isArabic(processedInput)) {
        inputLanguage = 'ar'
        const translation = await translateArabicToEnglish(processedInput)
        if (translation.wasTranslated) {
          translatedFrom = processedInput
          processedInput = translation.english
        }
      }

      // Step 2: Pattern-based parsing (fast)
      const patternResult = this.parseWithPatterns(processedInput)

      // Step 3: AI parsing for better understanding
      const aiResult = await this.parseWithAI(processedInput, patternResult)

      // Step 4: Merge results
      const workflow = this.mergeAndValidate(
        patternResult,
        aiResult,
        input,
        inputLanguage,
        translatedFrom
      )

      const parseTimeMs = Date.now() - startTime

      if (!workflow.trigger || workflow.actions.length === 0) {
        return {
          success: false,
          error: 'Could not parse workflow. Please specify a trigger (When X happens) and at least one action (do Y).',
          suggestedQuestions: [
            'What should trigger this workflow? (e.g., "When I get a Shopify order")',
            'What actions should happen? (e.g., "add to Google Sheets and notify on Slack")',
          ],
          parseTimeMs,
        }
      }

      workflow.metadata.parseTimeMs = parseTimeMs

      return {
        success: true,
        workflow,
        parseTimeMs,
        warnings: this.getWarnings(workflow),
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parsing error',
        parseTimeMs: Date.now() - startTime,
      }
    }
  }

  /**
   * Pattern-based parsing (fast, deterministic)
   */
  private parseWithPatterns(input: string): Partial<GeneratedWorkflowJSON> {
    const trigger = this.detectTrigger(input)
    const actions = this.detectActions(input)

    return {
      trigger: trigger || undefined,
      actions,
    }
  }

  /**
   * Detect trigger from input using patterns
   */
  private detectTrigger(input: string): WorkflowTrigger | null {
    const normalizedInput = input.toLowerCase()

    for (const pattern of TRIGGER_PATTERNS) {
      for (const event of pattern.events) {
        for (const regex of event.patterns) {
          if (regex.test(normalizedInput)) {
            return {
              type: 'event',
              source: pattern.source,
              event: event.name,
              composioTool: event.composioTrigger,
            }
          }
        }
      }
    }

    // Check for schedule triggers
    const scheduleMatch = normalizedInput.match(
      /(?:every|each)\s+(hour|day|week|month|morning|evening|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
    )
    if (scheduleMatch) {
      return {
        type: 'schedule',
        source: 'cron',
        event: scheduleMatch[1].toLowerCase(),
        config: { schedule: scheduleMatch[1] },
      }
    }

    return null
  }

  /**
   * Detect actions from input using patterns
   */
  private detectActions(input: string): WorkflowAction[] {
    const normalizedInput = input.toLowerCase()
    const actions: WorkflowAction[] = []
    let actionIndex = 0

    for (const pattern of ACTION_PATTERNS) {
      for (const action of pattern.actions) {
        for (const regex of action.patterns) {
          if (regex.test(normalizedInput)) {
            actionIndex++
            actions.push({
              id: `action_${actionIndex}`,
              name: action.name.replace(/_/g, ' '),
              description: `${action.name} via ${pattern.toolkit}`,
              tool: action.toolSlug,
              toolkit: pattern.toolkit,
              inputs: { ...action.defaultInputs },
              dependsOn: actionIndex > 1 ? [`action_${actionIndex - 1}`] : [],
            })
            break // Only match once per action type per toolkit
          }
        }
      }
    }

    return actions
  }

  /**
   * AI-powered parsing for complex inputs
   */
  private async parseWithAI(
    input: string,
    patternResult: Partial<GeneratedWorkflowJSON>
  ): Promise<Partial<GeneratedWorkflowJSON>> {
    const systemPrompt = `You are a workflow automation expert. Parse this natural language command into a structured workflow.

Current understanding from pattern matching:
- Trigger: ${patternResult.trigger ? `${patternResult.trigger.source}/${patternResult.trigger.event}` : 'not detected'}
- Actions found: ${patternResult.actions?.map(a => a.toolkit + '/' + a.name).join(', ') || 'none'}

AVAILABLE TOOLS (use exact tool slugs):

Triggers:
- SHOPIFY_NEW_ORDER_TRIGGER - When a new Shopify order is placed
- SHOPIFY_ORDER_PAID_TRIGGER - When a Shopify order is paid
- STRIPE_PAYMENT_RECEIVED_TRIGGER - When a Stripe payment is received
- GMAIL_NEW_EMAIL_TRIGGER - When a new email arrives
- GITHUB_ISSUE_CREATED_TRIGGER - When a GitHub issue is created
- TYPEFORM_RESPONSE_TRIGGER - When a Typeform is submitted

Actions:
- GOOGLESHEETS_BATCH_UPDATE - Add/update rows in Google Sheets
- SLACK_SEND_MESSAGE - Send Slack message
- GMAIL_SEND_EMAIL - Send email via Gmail
- GITHUB_CREATE_ISSUE - Create GitHub issue
- HUBSPOT_CREATE_CONTACT - Create HubSpot contact
- HUBSPOT_CREATE_DEAL - Create HubSpot deal
- DISCORD_SEND_MESSAGE - Send Discord message
- NOTION_CREATE_PAGE - Create Notion page
- ZAPIER_AIRTABLE_CREATE_RECORD - Add Airtable record
- ZAPIER_TWILIO_SEND_SMS - Send SMS

Respond with JSON ONLY, no explanation:
{
  "trigger": {
    "type": "event|schedule|webhook|manual",
    "source": "app name",
    "event": "event name",
    "composioTool": "TOOL_SLUG"
  },
  "actions": [
    {
      "id": "action_1",
      "name": "human readable name",
      "description": "what this does",
      "tool": "EXACT_TOOL_SLUG",
      "toolkit": "app name",
      "inputs": {},
      "dependsOn": []
    }
  ],
  "workflowName": "Brief workflow name",
  "workflowDescription": "What this workflow does"
}`

    try {
      const response = await apiClient.chat({
        messages: [{ role: 'user', content: input }],
        systemPrompt,
        model: 'claude-3-5-haiku-20241022',
        maxTokens: 1500,
      })

      if (response.success && response.output) {
        const jsonMatch = response.output.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
      }
    } catch (error) {
      console.warn('[NLWorkflowEngine] AI parsing failed:', error)
    }

    return {}
  }

  /**
   * Merge pattern and AI results, validate, and create final workflow
   */
  private mergeAndValidate(
    patternResult: Partial<GeneratedWorkflowJSON>,
    aiResult: Partial<GeneratedWorkflowJSON> & { workflowName?: string; workflowDescription?: string },
    originalInput: string,
    inputLanguage: string,
    translatedFrom?: string
  ): GeneratedWorkflowJSON {
    // Prefer AI results when pattern matching failed
    const trigger = patternResult.trigger || aiResult.trigger
    const actions = (patternResult.actions?.length ?? 0) > 0
      ? patternResult.actions!
      : (aiResult.actions || [])

    // Generate workflow ID
    const id = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Determine required connections
    const requiredConnections: string[] = []
    if (trigger?.source) {
      requiredConnections.push(trigger.source)
    }
    actions.forEach(a => {
      if (!requiredConnections.includes(a.toolkit)) {
        requiredConnections.push(a.toolkit)
      }
    })

    // Calculate confidence
    const confidence = this.calculateConfidence(trigger, actions, patternResult, aiResult)

    // Estimate duration (10s per action + 5s overhead)
    const estimatedDurationMs = 5000 + (actions.length * 10000)

    return {
      id,
      name: aiResult.workflowName || this.generateWorkflowName(trigger, actions),
      description: aiResult.workflowDescription || this.generateDescription(trigger, actions),
      version: '1.0',
      trigger: trigger || {
        type: 'manual',
        source: 'manual',
        event: 'trigger',
      },
      actions,
      variables: this.extractVariables(trigger, actions),
      metadata: {
        generatedAt: new Date().toISOString(),
        inputLanguage,
        translatedFrom,
        originalInput,
        confidence,
        estimatedDurationMs,
        requiredConnections,
      },
    }
  }

  /**
   * Generate a workflow name from trigger and actions
   */
  private generateWorkflowName(
    trigger: WorkflowTrigger | null | undefined,
    actions: WorkflowAction[]
  ): string {
    const triggerPart = trigger?.source
      ? `${trigger.source.charAt(0).toUpperCase() + trigger.source.slice(1)} ${trigger.event.replace(/_/g, ' ')}`
      : 'Manual trigger'

    const actionPart = actions.length > 0
      ? actions.map(a => a.toolkit).slice(0, 2).join(' + ')
      : 'workflow'

    return `${triggerPart} -> ${actionPart}`
  }

  /**
   * Generate a description from trigger and actions
   */
  private generateDescription(
    trigger: WorkflowTrigger | null | undefined,
    actions: WorkflowAction[]
  ): string {
    const triggerDesc = trigger
      ? `When ${trigger.event.replace(/_/g, ' ')} from ${trigger.source}`
      : 'Manual workflow'

    const actionDescs = actions.map(a => a.description || a.name).join(', then ')

    return `${triggerDesc}: ${actionDescs}`
  }

  /**
   * Extract variables that need to be configured
   */
  private extractVariables(
    trigger: WorkflowTrigger | null | undefined,
    actions: WorkflowAction[]
  ): GeneratedWorkflowJSON['variables'] {
    const variables: GeneratedWorkflowJSON['variables'] = {}

    // Add trigger variables
    if (trigger?.source === 'shopify') {
      variables['order_data'] = {
        type: 'object',
        description: 'Shopify order data from trigger',
      }
    }

    // Add action-specific variables
    for (const action of actions) {
      if (action.toolkit === 'googlesheets') {
        variables['spreadsheet_id'] = {
          type: 'string',
          description: 'Google Sheets spreadsheet ID',
        }
        variables['sheet_range'] = {
          type: 'string',
          description: 'Sheet range (e.g., A1 or Sheet1!A1)',
          defaultValue: 'A1',
        }
      }

      if (action.toolkit === 'slack') {
        variables['slack_channel'] = {
          type: 'string',
          description: 'Slack channel name or ID',
          defaultValue: '#general',
        }
      }
    }

    return variables
  }

  /**
   * Calculate confidence score for the parse
   */
  private calculateConfidence(
    trigger: WorkflowTrigger | null | undefined,
    actions: WorkflowAction[],
    patternResult: Partial<GeneratedWorkflowJSON>,
    _aiResult: Partial<GeneratedWorkflowJSON>
  ): number {
    let confidence = 0.5 // Base

    // Trigger confidence
    if (trigger) {
      confidence += 0.2
      if (patternResult.trigger) confidence += 0.1 // Pattern matched
    }

    // Actions confidence
    if (actions.length > 0) {
      confidence += 0.15
      if ((patternResult.actions?.length ?? 0) > 0) confidence += 0.1 // Pattern matched
    }

    // Tool slugs are valid
    const validTools = actions.every(a => a.tool && a.tool.length > 0)
    if (validTools) confidence += 0.1

    return Math.min(confidence, 1.0)
  }

  /**
   * Get warnings for the generated workflow
   */
  private getWarnings(workflow: GeneratedWorkflowJSON): string[] {
    const warnings: string[] = []

    if (workflow.metadata.confidence < 0.7) {
      warnings.push('Low confidence parse - please review the workflow carefully')
    }

    if (workflow.metadata.requiredConnections.length > 0) {
      warnings.push(`Required connections: ${workflow.metadata.requiredConnections.join(', ')}`)
    }

    if (workflow.actions.some(a => !a.tool)) {
      warnings.push('Some actions do not have Composio tool mappings')
    }

    return warnings
  }

  /**
   * Validate if a workflow JSON is valid
   */
  validateWorkflow(workflow: GeneratedWorkflowJSON): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!workflow.id) errors.push('Missing workflow ID')
    if (!workflow.name) errors.push('Missing workflow name')
    if (!workflow.trigger) errors.push('Missing trigger')
    if (!workflow.actions || workflow.actions.length === 0) {
      errors.push('No actions defined')
    }

    // Check action dependencies
    const actionIds = new Set(workflow.actions.map(a => a.id))
    for (const action of workflow.actions) {
      for (const dep of action.dependsOn) {
        if (!actionIds.has(dep)) {
          errors.push(`Action ${action.id} depends on non-existent action ${dep}`)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}

// Export singleton
export const nlWorkflowEngine = new NLWorkflowEngine()
