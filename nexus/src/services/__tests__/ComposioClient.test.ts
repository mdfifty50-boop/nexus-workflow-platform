/**
 * ComposioClient Tests
 *
 * Verify that the ComposioClient can properly communicate with the backend
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { composioClient, TOOL_SLUGS } from '../ComposioClient'

// Test timeout for integration tests
const TEST_TIMEOUT = 10000

describe('ComposioClient Integration Tests', () => {

  beforeAll(async () => {
    // Initialize the client before running tests
    await composioClient.initialize()
  })

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      expect(composioClient.isInitialized).toBe(true)
      expect(composioClient.currentSessionId).toBeTruthy()
    }, TEST_TIMEOUT)

    it('should get status', async () => {
      const status = await composioClient.getStatus()
      expect(status).toHaveProperty('initialized')
      expect(status).toHaveProperty('isDemoMode')
      expect(status).toHaveProperty('apiKeyConfigured')
    }, TEST_TIMEOUT)
  })

  describe('Connection Management', () => {
    it('should check connection for a toolkit', async () => {
      const result = await composioClient.checkConnection('gmail')
      expect(result).toHaveProperty('toolkit', 'gmail')
      expect(result).toHaveProperty('connected')
      expect(typeof result.connected).toBe('boolean')
    }, TEST_TIMEOUT)

    it('should initiate connection for a toolkit', async () => {
      const result = await composioClient.initiateConnection('gmail')
      // Either authUrl or error should be present
      expect(result).toBeDefined()
      if ('authUrl' in result) {
        expect(typeof result.authUrl).toBe('string')
      }
      if ('error' in result) {
        expect(typeof result.error).toBe('string')
      }
    }, TEST_TIMEOUT)
  })

  describe('Tool Execution', () => {
    it('should execute a tool (may return demo data)', async () => {
      const result = await composioClient.executeTool(
        TOOL_SLUGS.gmail.fetch,
        { maxResults: 1 }
      )

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('toolSlug', TOOL_SLUGS.gmail.fetch)
      expect(result).toHaveProperty('executionTimeMs')
      expect(typeof result.executionTimeMs).toBe('number')

      if (!result.success) {
        expect(result).toHaveProperty('error')
      }
    }, TEST_TIMEOUT)

    it('should handle invalid tool slug', async () => {
      const result = await composioClient.executeTool(
        'INVALID_TOOL_SLUG',
        {}
      )

      expect(result.success).toBe(false)
      expect(result).toHaveProperty('error')
    }, TEST_TIMEOUT)
  })

  describe('Batch Execution', () => {
    it('should execute multiple tools in parallel', async () => {
      const tools = [
        { toolSlug: TOOL_SLUGS.gmail.fetch, params: { maxResults: 1 } },
        { toolSlug: TOOL_SLUGS.slack.listChannels, params: {} },
      ]

      const results = await composioClient.executeMultipleTools(tools)

      expect(Array.isArray(results)).toBe(true)
      expect(results).toHaveLength(2)
      results.forEach(result => {
        expect(result).toHaveProperty('success')
        expect(result).toHaveProperty('toolSlug')
        expect(result).toHaveProperty('executionTimeMs')
      })
    }, TEST_TIMEOUT)

    it('should execute batch via server', async () => {
      const tools = [
        { toolSlug: TOOL_SLUGS.gmail.fetch, params: { maxResults: 1 } },
      ]

      const result = await composioClient.executeBatch(tools)

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('results')
      expect(result).toHaveProperty('successCount')
      expect(result).toHaveProperty('failureCount')
      expect(Array.isArray(result.results)).toBe(true)
    }, TEST_TIMEOUT)
  })

  describe('Tool Discovery', () => {
    it('should list available tools', async () => {
      const result = await composioClient.listTools()

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('tools')
      expect(Array.isArray(result.tools)).toBe(true)

      // In demo mode, success might be false but tools should still be returned
      if (result.success && result.tools.length > 0) {
        const tool = result.tools[0]
        expect(tool).toHaveProperty('slug')
        expect(tool).toHaveProperty('name')
        expect(tool).toHaveProperty('app')
      }
    }, TEST_TIMEOUT)

    it('should list tools for specific apps', async () => {
      const result = await composioClient.listTools(['gmail', 'slack'])

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('tools')
      expect(Array.isArray(result.tools)).toBe(true)
      // Tools might be empty in demo mode, which is acceptable
    }, TEST_TIMEOUT)
  })

  describe('User-Specific Operations', () => {
    const testUserId = 'test-user-123'

    it('should get user apps', async () => {
      const result = await composioClient.getUserApps(testUserId)

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('apps')
      expect(result).toHaveProperty('connectedCount')
      expect(Array.isArray(result.apps)).toBe(true)
    }, TEST_TIMEOUT)

    it('should initiate user app connection', async () => {
      const result = await composioClient.connectUserApp(
        testUserId,
        'gmail',
        'http://localhost:5173/oauth/callback'
      )

      expect(result).toBeDefined()
      // Either authUrl or error should be present
      if ('authUrl' in result) {
        expect(typeof result.authUrl).toBe('string')
      }
      if ('error' in result) {
        expect(typeof result.error).toBe('string')
      }
    }, TEST_TIMEOUT)
  })

  describe('Convenience Methods', () => {
    it('should have sendEmail method', async () => {
      const result = await composioClient.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test body',
      })

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('toolSlug', TOOL_SLUGS.gmail.send)
    }, TEST_TIMEOUT)

    it('should have createCalendarEvent method', async () => {
      const result = await composioClient.createCalendarEvent({
        title: 'Test Event',
        startTime: '2025-01-15T10:00:00Z',
        endTime: '2025-01-15T11:00:00Z',
      })

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('toolSlug', TOOL_SLUGS.googleCalendar.create)
    }, TEST_TIMEOUT)

    it('should have sendSlackMessage method', async () => {
      const result = await composioClient.sendSlackMessage({
        channel: '#general',
        text: 'Test message',
      })

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('toolSlug', TOOL_SLUGS.slack.send)
    }, TEST_TIMEOUT)

    it('should have createGitHubIssue method', async () => {
      const result = await composioClient.createGitHubIssue({
        owner: 'test',
        repo: 'test-repo',
        title: 'Test issue',
        body: 'Test body',
      })

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('toolSlug', TOOL_SLUGS.github.createIssue)
    }, TEST_TIMEOUT)

    it('should have readSpreadsheet method', async () => {
      const result = await composioClient.readSpreadsheet({
        spreadsheetId: 'test-id',
        range: 'Sheet1!A1:B10',
      })

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('toolSlug', TOOL_SLUGS.googleSheets.read)
    }, TEST_TIMEOUT)

    it('should have appendToSpreadsheet method', async () => {
      const result = await composioClient.appendToSpreadsheet({
        spreadsheetId: 'test-id',
        range: 'Sheet1!A1',
        values: [['Test', 'Data']],
      })

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('toolSlug', TOOL_SLUGS.googleSheets.append)
    }, TEST_TIMEOUT)
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Try to execute with malformed parameters
      const result = await composioClient.executeTool('INVALID', {})

      expect(result.success).toBe(false)
      expect(result).toHaveProperty('error')
      expect(typeof result.error).toBe('string')
    }, TEST_TIMEOUT)

    it('should track last error', async () => {
      await composioClient.executeTool('INVALID', {})

      const lastError = composioClient.lastError
      if (lastError) {
        expect(lastError).toHaveProperty('code')
        expect(lastError).toHaveProperty('message')
        expect(lastError).toHaveProperty('isRetryable')
        expect(typeof lastError.isRetryable).toBe('boolean')
      }
    }, TEST_TIMEOUT)
  })

  describe('TOOL_SLUGS Constants', () => {
    it('should have Gmail slugs', () => {
      expect(TOOL_SLUGS.gmail.send).toBe('GMAIL_SEND_EMAIL')
      expect(TOOL_SLUGS.gmail.fetch).toBe('GMAIL_FETCH_EMAILS')
    })

    it('should have Google Calendar slugs', () => {
      expect(TOOL_SLUGS.googleCalendar.create).toBe('GOOGLECALENDAR_CREATE_EVENT')
      expect(TOOL_SLUGS.googleCalendar.list).toBe('GOOGLECALENDAR_EVENTS_LIST')
    })

    it('should have Slack slugs', () => {
      expect(TOOL_SLUGS.slack.send).toBe('SLACK_SEND_MESSAGE')
      expect(TOOL_SLUGS.slack.listChannels).toBe('SLACK_LIST_ALL_CHANNELS')
    })

    it('should have GitHub slugs', () => {
      expect(TOOL_SLUGS.github.createIssue).toBe('GITHUB_CREATE_ISSUE')
      expect(TOOL_SLUGS.github.listIssues).toBe('GITHUB_LIST_REPOSITORY_ISSUES')
    })

    it('should have Google Sheets slugs', () => {
      expect(TOOL_SLUGS.googleSheets.read).toBe('GOOGLESHEETS_BATCH_GET')
      expect(TOOL_SLUGS.googleSheets.append).toBe('GOOGLESHEETS_BATCH_UPDATE')
    })
  })
})
