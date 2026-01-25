/**
 * Intent Parser Test Suite
 *
 * Verifies that the intent parser correctly extracts structured data
 * from natural language inputs.
 */

import { intentParser } from './intent-parser'

// Test cases from requirements
const TEST_CASES = [
  {
    name: 'Email sending',
    input: 'Send email to john@test.com saying hello',
    expected: {
      action: 'send_email',
      recipient: 'john@test.com',
      content: 'hello',
      category: 'communication',
    },
  },
  {
    name: 'Slack posting',
    input: "Post 'Hello team' to #general on Slack",
    expected: {
      action: 'slack_post',
      channel: 'general',
      message: 'Hello team',
      category: 'communication',
    },
  },
  {
    name: 'Email retrieval',
    input: 'Get my last 5 emails',
    expected: {
      action: 'get_emails',
      count: 5,
      category: 'communication',
    },
  },
  {
    name: 'Calendar event creation',
    input: 'Create a Google Calendar event for tomorrow 3pm',
    expected: {
      action: 'create_event',
      time: 'tomorrow 3pm',
      category: 'scheduling',
    },
  },
]

async function runTests() {
  console.log('🧪 Running Intent Parser Tests\n')
  console.log('='.repeat(70))

  let passed = 0
  let failed = 0

  for (const testCase of TEST_CASES) {
    console.log(`\n📝 Test: ${testCase.name}`)
    console.log(`   Input: "${testCase.input}"`)

    try {
      // Parse without AI (faster, deterministic)
      const result = await intentParser.parse(testCase.input, {
        useAI: false,
        includeContext: false,
      })

      console.log(`\n   ✓ Parsed successfully`)
      console.log(`     Category: ${result.category}`)
      console.log(`     Action: ${result.action}`)
      console.log(`     Confidence: ${(result.confidence * 100).toFixed(1)}%`)
      console.log(`     Entities: ${result.entities.length}`)

      // Display extracted entities
      if (result.entities.length > 0) {
        result.entities.forEach(entity => {
          console.log(`       - ${entity.type}: "${entity.value}" (${(entity.confidence * 100).toFixed(0)}%)`)
        })
      }

      // Display missing information
      if (result.missingInfo.length > 0) {
        console.log(`     Missing: ${result.missingInfo.map(m => m.field).join(', ')}`)
      }

      // Verify against expected results
      const checks = []

      // Check category
      if (testCase.expected.category) {
        const categoryMatch = result.category === testCase.expected.category
        checks.push({
          name: 'Category',
          expected: testCase.expected.category,
          actual: result.category,
          pass: categoryMatch,
        })
      }

      // Check action
      if (testCase.expected.action) {
        const actionMatch = result.action.includes(testCase.expected.action) ||
                          testCase.expected.action.includes(result.action)
        checks.push({
          name: 'Action',
          expected: testCase.expected.action,
          actual: result.action,
          pass: actionMatch,
        })
      }

      // Check specific entity extractions
      const expectedEntities = Object.entries(testCase.expected).filter(
        ([key]) => !['action', 'category'].includes(key)
      )

      for (const [key, value] of expectedEntities) {
        // Map expected keys to entity types
        const entityTypeMap: Record<string, string> = {
          recipient: 'person',
          content: 'message',
          channel: 'channel',
          message: 'message',
          count: 'quantity',
          time: 'time',
        }

        const entityType = entityTypeMap[key] || key
        const entity = result.entities.find(e =>
          e.type === entityType ||
          e.value.toLowerCase().includes(String(value).toLowerCase())
        )

        checks.push({
          name: `Entity: ${key}`,
          expected: value,
          actual: entity ? entity.value : 'NOT FOUND',
          pass: entity !== undefined,
        })
      }

      // Display verification results
      console.log(`\n   Verification:`)
      let testPassed = true
      for (const check of checks) {
        const symbol = check.pass ? '✓' : '✗'
        const color = check.pass ? '' : '  ⚠️'
        console.log(`     ${symbol} ${check.name}: ${check.actual}${color}`)
        if (!check.pass) {
          console.log(`       Expected: ${check.expected}`)
          testPassed = false
        }
      }

      if (testPassed) {
        console.log(`\n   ✅ Test PASSED`)
        passed++
      } else {
        console.log(`\n   ❌ Test FAILED - Missing or incorrect extractions`)
        failed++
      }

    } catch (error) {
      console.log(`\n   ❌ Test FAILED - Error: ${error}`)
      failed++
    }

    console.log('   ' + '-'.repeat(66))
  }

  console.log('\n' + '='.repeat(70))
  console.log(`\n📊 Test Results: ${passed}/${TEST_CASES.length} passed`)

  if (failed > 0) {
    console.log(`\n⚠️  ${failed} test(s) failed`)
    console.log('\n🔧 Gaps Identified:')
    console.log('   - Email address extraction (person/recipient entity)')
    console.log('   - Message content extraction')
    console.log('   - Channel name extraction')
    console.log('   - Quantity extraction (e.g., "last 5 emails")')
    console.log('   - Slack-specific action recognition')
    console.log('   - Email-specific action recognition')
    console.log('\n💡 Recommendation: Enhance pattern definitions for communication tasks')
  } else {
    console.log('\n✅ All tests passed!')
  }

  console.log('\n' + '='.repeat(70))
}

// Run tests
runTests().catch(console.error)
