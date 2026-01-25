/**
 * Intent Parser Verification Script
 *
 * Verifies the actual intent parser implementation with comprehensive test cases
 */

// Mock localStorage for Node.js environment
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
  }
}

// Mock apiClient for testing without actual API calls
type Message = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

type APIResponse = {
  success: boolean
  output?: string
  error?: string
}

const mockApiClient = {
  chat: async (_params: {
    messages: Message[]
    systemPrompt?: string
    model?: string
    maxTokens?: number
  }): Promise<APIResponse> => {
    return {
      success: false,
      output: '',
      error: 'Mock client - no actual API call',
    }
  },
}

// Replace the real apiClient with mock
import * as apiClientModule from '../api-client'
;(apiClientModule as any).apiClient = mockApiClient

// Now import the intent parser
import { IntentParser } from './intent-parser'
import type { ExtractedEntity } from '../../types/workflow-execution'

// Test cases
const TEST_CASES = [
  {
    name: 'Email sending with recipient and message',
    input: 'Send email to john@test.com saying hello',
    expected: {
      category: 'communication',
      action: 'send_email',
      entities: {
        person: 'john@test.com',
        message: 'hello',
      },
      minConfidence: 0.5,
    },
  },
  {
    name: 'Slack posting with channel and message',
    input: "Post 'Hello team' to #general on Slack",
    expected: {
      category: 'communication',
      action: 'slack_post',
      entities: {
        message: 'Hello team',
        channel: 'general',
      },
      minConfidence: 0.5,
    },
  },
  {
    name: 'Get emails with quantity',
    input: 'Get my last 5 emails',
    expected: {
      category: 'communication',
      action: 'get_emails',
      entities: {
        quantity: '5',
      },
      minConfidence: 0.5,
    },
  },
  {
    name: 'Create calendar event with time',
    input: 'Create a Google Calendar event for tomorrow 3pm',
    expected: {
      category: 'scheduling',
      action: 'create',
      entities: {
        time: 'tomorrow 3pm',
      },
      minConfidence: 0.5,
    },
  },
  {
    name: 'Order food delivery',
    input: 'Order healthy meal to my home',
    expected: {
      category: 'food_delivery',
      action: 'order',
      minConfidence: 0.5,
    },
  },
  {
    name: 'Book flight',
    input: 'Book cheapest flight to Dubai tomorrow',
    expected: {
      category: 'travel',
      action: 'book',
      minConfidence: 0.5,
    },
  },
]

async function runVerification() {
  console.log('🔍 Intent Parser Verification\n')
  console.log('='.repeat(70))

  const parser = new IntentParser()
  let passed = 0
  let failed = 0

  for (const testCase of TEST_CASES) {
    console.log(`\n📝 Test: ${testCase.name}`)
    console.log(`   Input: "${testCase.input}"`)

    try {
      // Parse without AI (deterministic, faster)
      const result = await parser.parse(testCase.input, {
        useAI: false,
        includeContext: false,
      })

      console.log(`\n   ✓ Parsed successfully`)
      console.log(`     Category: ${result.category}`)
      console.log(`     Action: ${result.action}`)
      console.log(`     Confidence: ${(result.confidence * 100).toFixed(1)}%`)
      console.log(`     Can Execute: ${result.canExecute}`)
      console.log(`     Entities: ${result.entities.length}`)

      // Display entities
      if (result.entities.length > 0) {
        result.entities.forEach(entity => {
          console.log(`       - ${entity.type}: "${entity.value}" (${(entity.confidence * 100).toFixed(0)}% confidence)`)
        })
      }

      // Display missing info
      if (result.missingInfo.length > 0) {
        console.log(`     Missing Info: ${result.missingInfo.map(m => m.field).join(', ')}`)
      }

      // Verify expectations
      const checks: Array<{ name: string; pass: boolean; expected?: any; actual?: any }> = []

      // Check category
      if (testCase.expected.category) {
        const categoryMatch = result.category === testCase.expected.category
        checks.push({
          name: 'Category',
          pass: categoryMatch,
          expected: testCase.expected.category,
          actual: result.category,
        })
      }

      // Check action (partial match)
      if (testCase.expected.action) {
        const actionMatch =
          result.action === testCase.expected.action ||
          result.action.includes(testCase.expected.action) ||
          testCase.expected.action.includes(result.action)
        checks.push({
          name: 'Action',
          pass: actionMatch,
          expected: testCase.expected.action,
          actual: result.action,
        })
      }

      // Check confidence
      if (testCase.expected.minConfidence) {
        const confidenceOk = result.confidence >= testCase.expected.minConfidence
        checks.push({
          name: 'Confidence',
          pass: confidenceOk,
          expected: `>= ${testCase.expected.minConfidence}`,
          actual: result.confidence.toFixed(2),
        })
      }

      // Check entities
      if (testCase.expected.entities) {
        for (const [entityKey, expectedValue] of Object.entries(testCase.expected.entities)) {
          const entityFound = result.entities.some((e: ExtractedEntity) => {
            // Normalize for comparison
            const normalizedValue = e.value.toLowerCase().trim()
            const normalizedExpected = String(expectedValue).toLowerCase().trim()

            // Type-based matching
            if (entityKey === 'person' && e.type === 'person') {
              return normalizedValue === normalizedExpected || normalizedValue.includes(normalizedExpected)
            }
            if (entityKey === 'message' && e.type === 'message') {
              return normalizedValue === normalizedExpected || normalizedValue.includes(normalizedExpected)
            }
            if (entityKey === 'channel' && e.type === 'channel') {
              return normalizedValue === normalizedExpected || normalizedValue.includes(normalizedExpected)
            }
            if (entityKey === 'quantity' && e.type === 'quantity') {
              return e.value === String(expectedValue)
            }
            if (entityKey === 'time' && e.type === 'time') {
              return normalizedValue === normalizedExpected || normalizedValue.includes(normalizedExpected)
            }

            // Fallback: check if entity value matches
            return normalizedValue === normalizedExpected || normalizedValue.includes(normalizedExpected)
          })

          checks.push({
            name: `Entity: ${entityKey}`,
            pass: entityFound,
            expected: expectedValue,
            actual: entityFound ? 'Found' : 'Not found',
          })
        }
      }

      // Display verification results
      console.log(`\n   Verification:`)
      let testPassed = true

      for (const check of checks) {
        const symbol = check.pass ? '✓' : '✗'
        console.log(`     ${symbol} ${check.name}: ${check.actual}`)
        if (!check.pass) {
          console.log(`       Expected: ${check.expected}`)
          testPassed = false
        }
      }

      if (testPassed) {
        console.log(`\n   ✅ Test PASSED`)
        passed++
      } else {
        console.log(`\n   ❌ Test FAILED`)
        failed++
      }
    } catch (error) {
      console.log(`\n   ❌ Test FAILED - Error: ${error}`)
      failed++
    }

    console.log('   ' + '-'.repeat(66))
  }

  console.log('\n' + '='.repeat(70))
  console.log(`\n📊 Results: ${passed}/${TEST_CASES.length} tests passed`)

  if (failed > 0) {
    console.log(`\n⚠️  ${failed} test(s) failed`)
    console.log('\nReview the failures above to identify any remaining gaps.')
  } else {
    console.log('\n✅ All tests passed! Intent parser is working correctly.')
  }

  console.log('\n' + '='.repeat(70))

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0)
}

// Run verification
runVerification().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
