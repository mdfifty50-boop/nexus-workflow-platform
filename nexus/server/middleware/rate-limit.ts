/**
 * Shared Rate Limiting Middleware for Nexus API
 *
 * Pre-configured rate limiters for different endpoint types.
 * All limiters follow the FIX-102 pattern: user-ID-based keying
 * with IPv6 validation disabled.
 *
 * Usage:
 *   import { executionLimiter, discoveryLimiter } from '../middleware/rate-limit.js'
 *   router.post('/execute', executionLimiter, handler)
 */

import rateLimit from 'express-rate-limit'
import { Request, Response } from 'express'

// Shared key generator - extract user ID from various sources
// Matches the pattern from chat.ts @NEXUS-FIX-102
const getUserKey = (req: Request): string => {
  const userId = req.headers['x-user-id'] as string ||
                 req.headers['x-clerk-user-id'] as string ||
                 (req as any).auth?.userId
  return userId || req.ip || 'anonymous'
}

// Shared skip function - disable rate limiting when DISABLE_RATE_LIMIT=true
const shouldSkip = (_req: Request): boolean => {
  return process.env.DISABLE_RATE_LIMIT === 'true'
}

// Helper to create a 429 JSON handler with a custom message
const make429Handler = (message: string, hint: string) => {
  return (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: message,
      hint,
      retryAfter: 60
    })
  }
}

/**
 * Execution limiter - for tool/workflow execution endpoints.
 * 10 requests per minute (execution is expensive and hits external APIs).
 */
export const executionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: getUserKey,
  handler: make429Handler(
    'Too many execution requests. Please wait before running more workflows.',
    'Workflow execution is resource-intensive. Wait a moment and try again.'
  ),
  skip: shouldSkip
})

/**
 * Discovery limiter - for tool search and discovery endpoints.
 * 30 requests per minute (lighter than execution but still hits APIs).
 */
export const discoveryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 30 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: getUserKey,
  handler: make429Handler(
    'Too many discovery requests. Please slow down.',
    'Wait a moment before searching for more tools.'
  ),
  skip: shouldSkip
})

/**
 * Connection limiter - for OAuth connection management endpoints.
 * 10 requests per minute (OAuth flows should be infrequent).
 */
export const connectionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: getUserKey,
  handler: make429Handler(
    'Too many connection requests. Please wait before managing more connections.',
    'OAuth flows are rate-limited for security. Wait a moment and try again.'
  ),
  skip: shouldSkip
})

/**
 * General API limiter - for general-purpose API endpoints.
 * 60 requests per minute (generous but prevents abuse).
 */
export const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 60 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: getUserKey,
  handler: make429Handler(
    'Too many requests. Please slow down.',
    'Wait a moment before making more requests.'
  ),
  skip: shouldSkip
})
