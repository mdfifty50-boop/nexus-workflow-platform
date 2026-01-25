/**
 * NL Workflow Engine Demo
 *
 * Demonstrates the Natural Language to Workflow JSON conversion.
 *
 * Run: npx ts-node --esm src/services/NLWorkflowEngine.demo.ts
 */

// Pattern matching functions (extracted from NLWorkflowEngine for demo)

interface WorkflowTrigger {
  type: 'webhook' | 'schedule' | 'event' | 'manual'
  source: string
  event: string
  composioTool?: string
}

interface WorkflowAction {
  id: string
  name: string
  tool: string
  toolkit: string
  inputs: Record<string, unknown>
  dependsOn: string[]
}

interface GeneratedWorkflowJSON {
  id: string
  name: string
  description: string
  version: '1.0'
  trigger: WorkflowTrigger
  actions: WorkflowAction[]
  metadata: {
    generatedAt: string
    inputLanguage: string
    translatedFrom?: string
    originalInput: string
    confidence: number
    requiredConnections: string[]
  }
}

const TRIGGER_PATTERNS = [
  {
    source: 'shopify',
    events: [
      {
        name: 'new_order',
        patterns: [
          /(?:when|whenever|if)\s+(?:i\s+)?(?:get|receive|have)\s+(?:a\s+)?(?:new\s+)?(?:shopify\s+)?order/i,
          /(?:new|incoming)\s+shopify\s+order/i,
          /shopify\s+(?:order|sale)\s+(?:comes\s+in|arrives|received)/i,
        ],
        composioTool: 'SHOPIFY_NEW_ORDER_TRIGGER',
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
        ],
        composioTool: 'STRIPE_PAYMENT_RECEIVED_TRIGGER',
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
          /(?:when|whenever)\s+(?:a\s+)?(?:new\s+)?email\s+(?:arrives|comes)/i,
        ],
        composioTool: 'GMAIL_NEW_EMAIL_TRIGGER',
      },
    ],
  },
]

const ACTION_PATTERNS = [
  {
    toolkit: 'googlesheets',
    actions: [
      {
        name: 'add_row',
        patterns: [
          /add\s+(?:it\s+)?(?:to\s+)?(?:a\s+)?(?:google\s+)?(?:sheets?|spreadsheet)/i,
          /(?:log|record|save|store)\s+(?:it\s+)?(?:in|to)\s+(?:a\s+)?(?:google\s+)?(?:sheets?|spreadsheet)/i,
        ],
        toolSlug: 'GOOGLESHEETS_APPEND_DATA',
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
          /notify\s+(?:on\s+)?slack/i,
          /post\s+to\s+slack/i,
        ],
        toolSlug: 'SLACK_SEND_MESSAGE',
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
        ],
        toolSlug: 'GMAIL_SEND_EMAIL',
      },
    ],
  },
]

function detectTrigger(input: string): WorkflowTrigger | null {
  const normalizedInput = input.toLowerCase()

  for (const pattern of TRIGGER_PATTERNS) {
    for (const event of pattern.events) {
      for (const regex of event.patterns) {
        if (regex.test(normalizedInput)) {
          return {
            type: 'event',
            source: pattern.source,
            event: event.name,
            composioTool: event.composioTool,
          }
        }
      }
    }
  }
  return null
}

function detectActions(input: string): WorkflowAction[] {
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
            tool: action.toolSlug,
            toolkit: pattern.toolkit,
            inputs: {},
            dependsOn: actionIndex > 1 ? [`action_${actionIndex - 1}`] : [],
          })
          break
        }
      }
    }
  }
  return actions
}

function isArabic(text: string): boolean {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/
  return arabicRegex.test(text)
}

function parseWorkflow(input: string): GeneratedWorkflowJSON | null {
  const trigger = detectTrigger(input)
  const actions = detectActions(input)

  if (!trigger && actions.length === 0) {
    return null
  }

  const requiredConnections: string[] = []
  if (trigger?.source) requiredConnections.push(trigger.source)
  actions.forEach(a => {
    if (!requiredConnections.includes(a.toolkit)) {
      requiredConnections.push(a.toolkit)
    }
  })

  return {
    id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: trigger ? `${trigger.source} ${trigger.event} workflow` : 'Custom workflow',
    description: `Workflow triggered by ${trigger?.source || 'manual'} with ${actions.length} actions`,
    version: '1.0',
    trigger: trigger || { type: 'manual', source: 'manual', event: 'trigger' },
    actions,
    metadata: {
      generatedAt: new Date().toISOString(),
      inputLanguage: isArabic(input) ? 'ar' : 'en',
      originalInput: input,
      confidence: trigger && actions.length > 0 ? 0.9 : 0.5,
      requiredConnections,
    },
  }
}

// ============================================================================
// Demo
// ============================================================================

console.log('========================================')
console.log('NL Workflow Engine Demo')
console.log('========================================\n')

const testCases = [
  // English - E-commerce workflows
  'When I get a Shopify order, add to Google Sheets and notify on Slack',
  'Whenever I receive a Stripe payment, send an email notification',
  'When a new email arrives, post to Slack',

  // Arabic
  'عندما احصل على طلب شوبيفاي، اضفه الى جوجل شيت و ابلغني على سلاك',
]

for (const input of testCases) {
  console.log(`Input: "${input}"`)
  console.log(`Language: ${isArabic(input) ? 'Arabic' : 'English'}`)
  console.log('')

  const workflow = parseWorkflow(input)

  if (workflow) {
    console.log('Generated Workflow JSON:')
    console.log(JSON.stringify(workflow, null, 2))
  } else {
    console.log('Could not parse workflow')
  }

  console.log('\n----------------------------------------\n')
}

console.log('Demo complete!')
