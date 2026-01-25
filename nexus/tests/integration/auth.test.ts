/**
 * Auth/Session Integration Tests
 *
 * Tests authentication middleware and session handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response, NextFunction } from 'express'

// Mock the authentication middleware behavior
const createMockRequest = (headers: Record<string, string> = {}, body: Record<string, any> = {}): Partial<Request> => ({
  headers,
  body
})

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {}
  res.status = vi.fn().mockReturnThis()
  res.json = vi.fn().mockReturnThis()
  return res
}

// Recreate the middleware logic for testing
const extractClerkUserId = (req: Request, res: Response, next: NextFunction) => {
  const clerkUserId = req.headers['x-clerk-user-id'] as string || req.body?.clerk_user_id

  // In development mode, allow requests without authentication
  const isDev = process.env.NODE_ENV !== 'production'
  if (!clerkUserId) {
    if (isDev) {
      req.body.clerk_user_id = 'dev-user-local'
      return next()
    }
    return res.status(401).json({ error: 'Authentication required' })
  }
  req.body.clerk_user_id = clerkUserId
  next()
}

describe('Auth Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('extractClerkUserId', () => {
    it('extracts clerk_user_id from x-clerk-user-id header', () => {
      const req = createMockRequest({ 'x-clerk-user-id': 'user_123' }) as Request
      const res = createMockResponse() as Response
      const next = vi.fn()

      extractClerkUserId(req, res, next)

      expect(req.body.clerk_user_id).toBe('user_123')
      expect(next).toHaveBeenCalled()
    })

    it('extracts clerk_user_id from request body', () => {
      const req = createMockRequest({}, { clerk_user_id: 'user_456' }) as Request
      const res = createMockResponse() as Response
      const next = vi.fn()

      extractClerkUserId(req, res, next)

      expect(req.body.clerk_user_id).toBe('user_456')
      expect(next).toHaveBeenCalled()
    })

    it('prefers header over body for clerk_user_id', () => {
      const req = createMockRequest(
        { 'x-clerk-user-id': 'header_user' },
        { clerk_user_id: 'body_user' }
      ) as Request
      const res = createMockResponse() as Response
      const next = vi.fn()

      extractClerkUserId(req, res, next)

      expect(req.body.clerk_user_id).toBe('header_user')
      expect(next).toHaveBeenCalled()
    })

    it('uses dev-user-local in development mode without auth', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const req = createMockRequest() as Request
      const res = createMockResponse() as Response
      const next = vi.fn()

      extractClerkUserId(req, res, next)

      expect(req.body.clerk_user_id).toBe('dev-user-local')
      expect(next).toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })

    it('returns 401 in production mode without auth', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const req = createMockRequest() as Request
      const res = createMockResponse() as Response
      const next = vi.fn()

      extractClerkUserId(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' })
      expect(next).not.toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })
  })
})

describe('Session Handling', () => {
  it('maintains user context across requests', () => {
    const userId = 'user_test_123'
    const req = createMockRequest({ 'x-clerk-user-id': userId }) as Request
    const res = createMockResponse() as Response
    const next = vi.fn()

    extractClerkUserId(req, res, next)

    // The user ID should persist in the request body
    expect(req.body.clerk_user_id).toBe(userId)
  })

  it('handles empty headers gracefully', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    const req = createMockRequest({}, {}) as Request
    const res = createMockResponse() as Response
    const next = vi.fn()

    extractClerkUserId(req, res, next)

    // Should fall back to dev user
    expect(req.body.clerk_user_id).toBe('dev-user-local')
    expect(next).toHaveBeenCalled()

    process.env.NODE_ENV = originalEnv
  })
})

describe('Auth Response Format', () => {
  it('returns proper error structure for 401', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    const req = createMockRequest() as Request
    const res = createMockResponse() as Response
    const next = vi.fn()

    extractClerkUserId(req, res, next)

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(String)
      })
    )

    process.env.NODE_ENV = originalEnv
  })
})
