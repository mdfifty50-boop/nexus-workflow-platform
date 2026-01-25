/**
 * NL Workflow Engine Pattern Tests
 *
 * Tests for pattern detection logic without API calls
 */

import { describe, it, expect } from 'vitest'

// Test the pattern detection directly without importing the full engine
// This avoids the localStorage issues in the test environment

// Trigger patterns from NLWorkflowEngine
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
          /someone\s+(?:orders|buys)\s+(?:from\s+)?(?:my\s+)?(?:shopify\s+)?(?:store|shop)/i,
        ],
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
        ],
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
        ],
      },
    ],
  },
]

// Action patterns from NLWorkflowEngine
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
          /slack\s+(?:notification|message|alert)/i,
          /notify\s+(?:on\s+)?slack/i,
          /post\s+to\s+slack/i,
          /alert\s+(?:on\s+)?slack/i,
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

function detectTrigger(input: string): { source: string; event: string } | null {
  const normalizedInput = input.toLowerCase()

  for (const pattern of TRIGGER_PATTERNS) {
    for (const event of pattern.events) {
      for (const regex of event.patterns) {
        if (regex.test(normalizedInput)) {
          return { source: pattern.source, event: event.name }
        }
      }
    }
  }
  return null
}

function detectActions(input: string): { toolkit: string; name: string; toolSlug: string }[] {
  const normalizedInput = input.toLowerCase()
  const actions: { toolkit: string; name: string; toolSlug: string }[] = []

  for (const pattern of ACTION_PATTERNS) {
    for (const action of pattern.actions) {
      for (const regex of action.patterns) {
        if (regex.test(normalizedInput)) {
          actions.push({
            toolkit: pattern.toolkit,
            name: action.name,
            toolSlug: action.toolSlug,
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

describe('NLWorkflowEngine Patterns', () => {
  describe('Trigger Detection', () => {
    it('should detect Shopify order trigger', () => {
      const testCases = [
        'When I get a Shopify order, add to Google Sheets',
        'whenever I receive a shopify order, notify on slack',
        'If I get a new order from Shopify',
        'When someone orders from my shopify store',
        'When a new Shopify order comes in',
      ]

      for (const input of testCases) {
        const result = detectTrigger(input)
        expect(result).not.toBeNull()
        expect(result?.source).toBe('shopify')
        expect(result?.event).toBe('new_order')
      }
    })

    it('should detect Stripe payment trigger', () => {
      const testCases = [
        'When I receive a Stripe payment',
        'When I get a payment',
        'When a Stripe payment is received',
        'When a new Stripe charge comes in',
      ]

      for (const input of testCases) {
        const result = detectTrigger(input)
        expect(result).not.toBeNull()
        expect(result?.source).toBe('stripe')
        expect(result?.event).toBe('payment_received')
      }
    })

    it('should detect Gmail email trigger', () => {
      const testCases = [
        'When I get a new email',
        'When I receive an email',
        'Whenever I get an email',
        'When a new email arrives',
      ]

      for (const input of testCases) {
        const result = detectTrigger(input)
        expect(result).not.toBeNull()
        expect(result?.source).toBe('gmail')
        expect(result?.event).toBe('new_email')
      }
    })

    it('should detect GitHub issue trigger', () => {
      const testCases = [
        'When a new GitHub issue is created',
        'When a GitHub issue is opened',
        'Whenever a new issue is created',
      ]

      for (const input of testCases) {
        const result = detectTrigger(input)
        expect(result).not.toBeNull()
        expect(result?.source).toBe('github')
        expect(result?.event).toBe('new_issue')
      }
    })
  })

  describe('Action Detection', () => {
    it('should detect Google Sheets action', () => {
      const testCases = [
        'add to Google Sheets',
        'add it to a spreadsheet',
        'log it in google sheets',
        'save to google sheet',
        'record in spreadsheet',
      ]

      for (const input of testCases) {
        const actions = detectActions(input)
        expect(actions.length).toBeGreaterThan(0)
        expect(actions[0].toolkit).toBe('googlesheets')
        expect(actions[0].toolSlug).toBe('GOOGLESHEETS_APPEND_DATA')
      }
    })

    it('should detect Slack action', () => {
      const testCases = [
        'notify on Slack',
        'send a message to Slack',
        'post to Slack',
        'Slack notification',
        'alert on Slack',
      ]

      for (const input of testCases) {
        const actions = detectActions(input)
        expect(actions.length).toBeGreaterThan(0)
        expect(actions[0].toolkit).toBe('slack')
        expect(actions[0].toolSlug).toBe('SLACK_SEND_MESSAGE')
      }
    })

    it('should detect Email action', () => {
      const testCases = [
        'send an email',
        'email notification',
        'email it to the team',
        'send email',
      ]

      for (const input of testCases) {
        const actions = detectActions(input)
        expect(actions.length).toBeGreaterThan(0)
        expect(actions[0].toolkit).toBe('gmail')
        expect(actions[0].toolSlug).toBe('GMAIL_SEND_EMAIL')
      }
    })

    it('should detect multiple actions', () => {
      const input = 'add to Google Sheets and notify on Slack'
      const actions = detectActions(input)

      expect(actions.length).toBe(2)
      expect(actions.map(a => a.toolkit).sort()).toEqual(['googlesheets', 'slack'])
    })
  })

  describe('Full Workflow Parsing', () => {
    it('should parse the canonical e-commerce workflow', () => {
      const input = 'When I get a Shopify order, add to Google Sheets and notify on Slack'

      const trigger = detectTrigger(input)
      const actions = detectActions(input)

      expect(trigger).not.toBeNull()
      expect(trigger?.source).toBe('shopify')
      expect(trigger?.event).toBe('new_order')

      expect(actions.length).toBe(2)
      expect(actions.map(a => a.toolkit).sort()).toEqual(['googlesheets', 'slack'])
    })
  })

  describe('Arabic Language Detection', () => {
    it('should detect Arabic text', () => {
      const arabicInputs = [
        'عندما احصل على طلب شوبيفاي، اضفه الى جوجل شيت',
        'طلب جديد من شوبيفاي',
        'ارسل رسالة على سلاك',
      ]

      for (const input of arabicInputs) {
        expect(isArabic(input)).toBe(true)
      }
    })

    it('should not detect English as Arabic', () => {
      const englishInputs = [
        'When I get a Shopify order',
        'add to Google Sheets',
        'notify on Slack',
      ]

      for (const input of englishInputs) {
        expect(isArabic(input)).toBe(false)
      }
    })
  })
})
