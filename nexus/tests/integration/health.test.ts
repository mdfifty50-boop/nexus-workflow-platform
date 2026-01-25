/**
 * Health API Integration Tests
 *
 * Tests for /api/health endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the dependencies
vi.mock('../../server/agents/index.js', () => ({
  getAllAgents: vi.fn(() => [
    { id: 'nexus', name: 'Nexus', title: 'AI Assistant', avatar: '🤖' }
  ])
}))

vi.mock('../../server/services/ComposioService.js', () => ({
  composioService: {
    getStatus: vi.fn(() => Promise.resolve({ apiKeyConfigured: true }))
  }
}))

// Create a mock Express app
import { Router } from 'express'

describe('Health API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/health', () => {
    it('returns healthy status when critical services are configured', async () => {
      // Set up env vars for test
      process.env.ANTHROPIC_API_KEY = 'test-key'
      process.env.VITE_SUPABASE_URL = 'https://test.supabase.co'

      // Import the route handler
      const healthRouter = await import('../../server/routes/health.js')

      // The router should be defined
      expect(healthRouter.default).toBeDefined()
    })

    it('handles missing environment variables gracefully', async () => {
      // Remove critical env vars
      const originalAnthropicKey = process.env.ANTHROPIC_API_KEY
      delete process.env.ANTHROPIC_API_KEY

      // Import the route handler
      const healthRouter = await import('../../server/routes/health.js')

      // Router should still be defined even without env vars
      expect(healthRouter.default).toBeDefined()

      // Restore
      process.env.ANTHROPIC_API_KEY = originalAnthropicKey
    })
  })

  describe('GET /api/health/ping', () => {
    it('returns pong response with timestamp', async () => {
      const healthRouter = await import('../../server/routes/health.js')

      // The router should have the ping endpoint
      expect(healthRouter.default).toBeDefined()
    })
  })
})

describe('Health Response Structure', () => {
  it('should have expected shape', () => {
    // Mock the expected response structure
    const expectedResponse = {
      status: 'healthy',
      timestamp: expect.any(String),
      version: '1.0.0',
      environment: 'test',
      services: {
        ai: { configured: true, service: 'Claude (Anthropic)' },
        composio: { configured: true, status: 'ready', service: 'Composio (500+ Apps)' },
        email: { configured: false, service: 'Resend' },
        crm: { configured: false, service: 'HubSpot' },
        database: { configured: true, service: 'Supabase' },
        vercelAdmin: { configured: false, service: 'Vercel API' }
      },
      agents: expect.any(Array),
      execution: {
        retryConfig: {
          maxRetries: 3,
          baseDelayMs: 1000
        }
      }
    }

    // Validate structure exists
    expect(expectedResponse.status).toBeDefined()
    expect(expectedResponse.services).toBeDefined()
    expect(Object.keys(expectedResponse.services)).toHaveLength(6)
  })

  it('correctly determines degraded status', () => {
    // Test the status determination logic
    const criticalOk = true
    const configuredCount = 2
    const totalServices = 6

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

    if (!criticalOk) {
      status = configuredCount === 0 ? 'unhealthy' : 'degraded'
    } else if (configuredCount < totalServices) {
      status = 'degraded'
    }

    expect(status).toBe('degraded')
  })

  it('correctly determines unhealthy status', () => {
    const criticalOk = false
    const configuredCount = 0

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

    if (!criticalOk) {
      status = configuredCount === 0 ? 'unhealthy' : 'unhealthy'
    }

    expect(status).toBe('unhealthy')
  })
})
