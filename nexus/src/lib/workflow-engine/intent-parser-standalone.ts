/**
 * Standalone Intent Parser Test
 *
 * Tests pattern matching without requiring API client or localStorage
 */

// Mock the required types
type IntentCategory = 'communication' | 'scheduling' | 'food_delivery' | 'document_analysis' | 'travel' | 'shopping' | 'finance' | 'productivity' | 'research' | 'custom'

interface ExtractedEntity {
  type: string
  value: string
  confidence: number
  normalized?: string
  source: string
}

interface MissingInformation {
  field: string
  description: string
  required: boolean
  suggestedQuestion: string
  possibleValues?: string[]
  canInfer: boolean
}

interface IntentConstraint {
  type: string
  field: string
  operator: string
  value: string | number
  priority: string
}

interface ParsedIntent {
  id: string
  rawInput: string
  category: IntentCategory
  action: string
  entities: ExtractedEntity[]
  confidence: number
  urgency: 'immediate' | 'today' | 'scheduled' | 'flexible'
  constraints: IntentConstraint[]
  preferences: Array<{ category: string; key: string; value: any; source: string }>
  missingInfo: MissingInformation[]
  canExecute: boolean
  parsedAt: string
}

// Enhanced pattern definitions with communication support
// Disabled to avoid unused variable warnings - can be re-enabled when needed
// const COMMUNICATION_PATTERNS = {
//   category: 'communication' as IntentCategory,
//   patterns: [
//     // Email patterns
//     /send\s+(?:an?\s+)?email\s+to\s+([^\s]+@[^\s]+)\s+saying\s+(.+)/i,
//     /email\s+([^\s]+@[^\s]+)\s+(?:that|saying|about)\s+(.+)/i,
//     /send\s+(?:to\s+)?([^\s]+@[^\s]+):\s*(.+)/i,
//
//     // Slack patterns
//     /post\s+['"](.+)['"]\s+to\s+[#]?(\w+)\s+on\s+slack/i,
//     /send\s+['"](.+)['"]\s+to\s+slack\s+channel\s+[#]?(\w+)/i,
//     /slack\s+[#]?(\w+):\s*(.+)/i,
//
//     // Get emails pattern
//     /get\s+(?:my\s+)?last\s+(\d+)\s+emails?/i,
//     /fetch\s+(\d+)\s+(?:recent\s+)?emails?/i,
//     /show\s+(?:me\s+)?(\d+)\s+emails?/i,
//   ],
//   keywords: ['send', 'email', 'slack', 'post', 'message', 'get', 'fetch'],
// }

// const SCHEDULING_PATTERNS = {
//   category: 'scheduling' as IntentCategory,
//   patterns: [
//     /create\s+(?:a\s+)?(?:google\s+)?calendar\s+event\s+for\s+(.+)/i,
//     /schedule\s+(?:a\s+)?(?:meeting|event)\s+(?:for\s+)?(.+)/i,
//     /add\s+(?:to\s+)?calendar:\s*(.+)/i,
//   ],
//   keywords: ['create', 'schedule', 'calendar', 'event', 'meeting', 'google calendar'],
// }
// Patterns commented out to avoid unused variable warnings

// Simple pattern matcher
function matchPattern(input: string): ParsedIntent {
  const normalized = input.toLowerCase().trim()
  const entities: ExtractedEntity[] = []
  let category: IntentCategory = 'custom'
  let action = 'execute'
  let confidence = 0.3

  // Test email sending
  const emailMatch = normalized.match(/send\s+(?:an?\s+)?email\s+to\s+([^\s]+@[^\s]+)\s+saying\s+(.+)/i)
  if (emailMatch) {
    category = 'communication'
    action = 'send_email'
    confidence = 0.9

    entities.push({
      type: 'recipient',
      value: emailMatch[1],
      confidence: 0.95,
      source: 'user_input',
    })

    entities.push({
      type: 'message',
      value: emailMatch[2],
      confidence: 0.95,
      source: 'user_input',
    })
  }

  // Test Slack posting
  const slackMatch = normalized.match(/post\s+['"](.+)['"]\s+to\s+[#]?(\w+)\s+on\s+slack/i)
  if (slackMatch) {
    category = 'communication'
    action = 'slack_post'
    confidence = 0.9

    entities.push({
      type: 'message',
      value: slackMatch[1],
      confidence: 0.95,
      source: 'user_input',
    })

    entities.push({
      type: 'channel',
      value: slackMatch[2],
      confidence: 0.95,
      source: 'user_input',
    })
  }

  // Test get emails
  const getEmailsMatch = normalized.match(/get\s+(?:my\s+)?last\s+(\d+)\s+emails?/i)
  if (getEmailsMatch) {
    category = 'communication'
    action = 'get_emails'
    confidence = 0.9

    entities.push({
      type: 'quantity',
      value: getEmailsMatch[1],
      confidence: 0.95,
      normalized: getEmailsMatch[1],
      source: 'user_input',
    })
  }

  // Test calendar event
  const calendarMatch = normalized.match(/create\s+(?:a\s+)?(?:google\s+)?calendar\s+event\s+for\s+(.+)/i)
  if (calendarMatch) {
    category = 'scheduling'
    action = 'create_event'
    confidence = 0.9

    entities.push({
      type: 'time',
      value: calendarMatch[1],
      confidence: 0.85,
      source: 'user_input',
    })
  }

  return {
    id: `intent_${Date.now()}`,
    rawInput: input,
    category,
    action,
    entities,
    confidence,
    urgency: 'flexible',
    constraints: [],
    preferences: [],
    missingInfo: [],
    canExecute: entities.length > 0,
    parsedAt: new Date().toISOString(),
  }
}

// Test cases
const TEST_CASES = [
  {
    name: 'Email sending',
    input: 'Send email to john@test.com saying hello',
    expected: {
      action: 'send_email',
      category: 'communication',
      entities: {
        recipient: 'john@test.com',
        message: 'hello',
      },
    },
  },
  {
    name: 'Slack posting',
    input: "Post 'Hello team' to #general on Slack",
    expected: {
      action: 'slack_post',
      category: 'communication',
      entities: {
        channel: 'general',
        message: 'Hello team',
      },
    },
  },
  {
    name: 'Email retrieval',
    input: 'Get my last 5 emails',
    expected: {
      action: 'get_emails',
      category: 'communication',
      entities: {
        quantity: '5',
      },
    },
  },
  {
    name: 'Calendar event creation',
    input: 'Create a Google Calendar event for tomorrow 3pm',
    expected: {
      action: 'create_event',
      category: 'scheduling',
      entities: {
        time: 'tomorrow 3pm',
      },
    },
  },
]

// Run tests
console.log('🧪 Intent Parser Pattern Tests\n')
console.log('='.repeat(70))

let passed = 0
let failed = 0

for (const testCase of TEST_CASES) {
  console.log(`\n📝 Test: ${testCase.name}`)
  console.log(`   Input: "${testCase.input}"`)

  const result = matchPattern(testCase.input)

  console.log(`\n   ✓ Parsed successfully`)
  console.log(`     Category: ${result.category}`)
  console.log(`     Action: ${result.action}`)
  console.log(`     Confidence: ${(result.confidence * 100).toFixed(1)}%`)
  console.log(`     Entities: ${result.entities.length}`)

  if (result.entities.length > 0) {
    result.entities.forEach(entity => {
      console.log(`       - ${entity.type}: "${entity.value}"`)
    })
  }

  // Verify
  const checks = []
  let testPassed = true

  // Check category
  if (result.category === testCase.expected.category) {
    checks.push('✓ Category matches')
  } else {
    checks.push(`✗ Category: expected ${testCase.expected.category}, got ${result.category}`)
    testPassed = false
  }

  // Check action
  if (result.action === testCase.expected.action) {
    checks.push('✓ Action matches')
  } else {
    checks.push(`✗ Action: expected ${testCase.expected.action}, got ${result.action}`)
    testPassed = false
  }

  // Check entities
  for (const [entityType, expectedValue] of Object.entries(testCase.expected.entities)) {
    const entity = result.entities.find(e => e.type === entityType)
    if (entity && entity.value === expectedValue) {
      checks.push(`✓ Entity ${entityType} = "${expectedValue}"`)
    } else {
      checks.push(`✗ Entity ${entityType}: expected "${expectedValue}", got ${entity ? entity.value : 'NOT FOUND'}`)
      testPassed = false
    }
  }

  console.log(`\n   Verification:`)
  checks.forEach(check => console.log(`     ${check}`))

  if (testPassed) {
    console.log(`\n   ✅ Test PASSED`)
    passed++
  } else {
    console.log(`\n   ❌ Test FAILED`)
    failed++
  }

  console.log('   ' + '-'.repeat(66))
}

console.log('\n' + '='.repeat(70))
console.log(`\n📊 Test Results: ${passed}/${TEST_CASES.length} passed`)

if (failed > 0) {
  console.log(`\n⚠️  ${failed} test(s) failed`)
  console.log('\n🔧 Required Implementation:')
  console.log('   1. Add email extraction patterns to communication category')
  console.log('   2. Add Slack-specific patterns (channel, message)')
  console.log('   3. Add quantity extraction for "get N emails"')
  console.log('   4. Add message content extraction')
  console.log('   5. Enhance action determination for email/slack operations')
} else {
  console.log('\n✅ All tests passed!')
}
