/**
 * TrustScoreService Unit Tests
 *
 * Tests for the Trust Score Calculator (Epic 16, Story 16.2)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { trustScoreService, TrustScoreInput } from '../../../src/services/TrustScoreService'

describe('TrustScoreService', () => {
  beforeEach(() => {
    trustScoreService.clearCache()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('calculateTrustScore', () => {
    it('should calculate high trust score for secure, reliable tool', () => {
      const input: TrustScoreInput = {
        authMethod: 'oauth2',
        apiDocUrl: 'https://api.example.com/docs',
        hasHttpsEndpoint: true,
        hasRateLimiting: true,
        encryptedTransit: true,
        successRate: 98,
        avgLatencyMs: 100,
        usageCount: 10000,
        lastUpdated: new Date().toISOString()
      }

      const score = trustScoreService.calculateTrustScore('test-tool-1', input)

      expect(score.overall).toBeGreaterThanOrEqual(70)
      expect(score.components.security).toBe(100) // All security factors present
      expect(score.components.reliability).toBe(98) // 98% success rate
      expect(score.breakdown.hasOAuth).toBe(true)
      expect(score.breakdown.httpsOnly).toBe(true)
      expect(score.breakdown.rateLimited).toBe(true)
    })

    it('should calculate low trust score for insecure tool', () => {
      const input: TrustScoreInput = {
        authMethod: 'none',
        apiDocUrl: null,
        hasHttpsEndpoint: false,
        hasRateLimiting: false,
        encryptedTransit: false,
        successRate: 50,
        avgLatencyMs: 3000,
        usageCount: 10
      }

      const score = trustScoreService.calculateTrustScore('test-tool-2', input)

      expect(score.overall).toBeLessThan(40)
      expect(score.components.security).toBe(0)
      expect(score.breakdown.hasOAuth).toBe(false)
      expect(score.breakdown.httpsOnly).toBe(false)
    })

    it('should give partial credit for API key authentication', () => {
      const input: TrustScoreInput = {
        authMethod: 'api_key',
        apiDocUrl: 'https://api.example.com/docs',
        hasHttpsEndpoint: true,
        hasRateLimiting: false
      }

      const score = trustScoreService.calculateTrustScore('test-tool-3', input)

      // API key gets 15 points instead of 25 for OAuth
      expect(score.components.security).toBe(55) // 15 (api_key) + 25 (https) + 15 (inferred encrypted)
    })

    it('should calculate performance score based on latency', () => {
      // Fast tool (100ms latency)
      const fastInput: TrustScoreInput = {
        authMethod: 'none',
        apiDocUrl: null,
        avgLatencyMs: 100
      }
      const fastScore = trustScoreService.calculateTrustScore('fast-tool', fastInput)

      // Slow tool (4000ms latency)
      const slowInput: TrustScoreInput = {
        authMethod: 'none',
        apiDocUrl: null,
        avgLatencyMs: 4000
      }
      const slowScore = trustScoreService.calculateTrustScore('slow-tool', slowInput)

      expect(fastScore.components.performance).toBeGreaterThan(slowScore.components.performance)
      expect(fastScore.components.performance).toBe(98) // 100 - (100/50) = 98
      expect(slowScore.components.performance).toBe(20) // 100 - (4000/50) = 20
    })

    it('should calculate community score based on usage', () => {
      const popularInput: TrustScoreInput = {
        authMethod: 'none',
        apiDocUrl: 'https://docs.example.com',
        usageCount: 10000,
        lastUpdated: new Date().toISOString()
      }
      const popularScore = trustScoreService.calculateTrustScore('popular-tool', popularInput)

      const newInput: TrustScoreInput = {
        authMethod: 'none',
        apiDocUrl: null,
        usageCount: 10
      }
      const newScore = trustScoreService.calculateTrustScore('new-tool', newInput)

      expect(popularScore.components.community).toBeGreaterThan(newScore.components.community)
    })

    it('should use default scores when no data available', () => {
      const input: TrustScoreInput = {
        authMethod: 'oauth2',
        apiDocUrl: null
        // No reliability, performance, or community data
      }

      const score = trustScoreService.calculateTrustScore('unknown-tool', input)

      // Should get default moderate scores
      expect(score.components.reliability).toBe(60) // Default
      expect(score.components.performance).toBe(70) // Default
      expect(score.overall).toBeGreaterThan(0)
    })

    it('should cache trust scores', () => {
      const input: TrustScoreInput = {
        authMethod: 'oauth2',
        apiDocUrl: 'https://api.example.com'
      }

      const firstScore = trustScoreService.calculateTrustScore('cached-tool', input)
      const secondScore = trustScoreService.calculateTrustScore('cached-tool', input)

      // Second call should return cached result
      expect(secondScore.overall).toBe(firstScore.overall)
      expect(secondScore.lastEvaluated).toBe(firstScore.lastEvaluated)
    })

    it('should complete within 100ms performance target', () => {
      const input: TrustScoreInput = {
        authMethod: 'oauth2',
        apiDocUrl: 'https://api.example.com',
        hasHttpsEndpoint: true,
        hasRateLimiting: true,
        successRate: 95,
        avgLatencyMs: 200,
        usageCount: 1000
      }

      const start = Date.now()
      trustScoreService.calculateTrustScore('perf-test-tool', input)
      const elapsed = Date.now() - start

      expect(elapsed).toBeLessThan(100)
    })
  })

  describe('getRecommendationBadge', () => {
    it('should return "recommended" for score >= 70', () => {
      expect(trustScoreService.getRecommendationBadge(70)).toBe('recommended')
      expect(trustScoreService.getRecommendationBadge(85)).toBe('recommended')
      expect(trustScoreService.getRecommendationBadge(100)).toBe('recommended')
    })

    it('should return "caution" for score 40-69', () => {
      expect(trustScoreService.getRecommendationBadge(40)).toBe('caution')
      expect(trustScoreService.getRecommendationBadge(55)).toBe('caution')
      expect(trustScoreService.getRecommendationBadge(69)).toBe('caution')
    })

    it('should return "not_recommended" for score < 40', () => {
      expect(trustScoreService.getRecommendationBadge(0)).toBe('not_recommended')
      expect(trustScoreService.getRecommendationBadge(20)).toBe('not_recommended')
      expect(trustScoreService.getRecommendationBadge(39)).toBe('not_recommended')
    })
  })

  describe('getBadgeDisplay', () => {
    it('should return correct display for recommended badge', () => {
      const display = trustScoreService.getBadgeDisplay('recommended')

      expect(display.emoji).toBe('✅')
      expect(display.text).toBe('Recommended')
      expect(display.color).toBe('green')
    })

    it('should return correct display for caution badge', () => {
      const display = trustScoreService.getBadgeDisplay('caution')

      expect(display.emoji).toBe('⚠️')
      expect(display.text).toBe('Use with caution')
      expect(display.color).toBe('yellow')
    })

    it('should return correct display for not_recommended badge', () => {
      const display = trustScoreService.getBadgeDisplay('not_recommended')

      expect(display.emoji).toBe('❌')
      expect(display.text).toBe('Not recommended')
      expect(display.color).toBe('red')
    })
  })

  describe('Cache Management', () => {
    it('should invalidate specific cache entry', async () => {
      const input: TrustScoreInput = {
        authMethod: 'oauth2',
        apiDocUrl: 'https://api.example.com'
      }

      const firstScore = trustScoreService.calculateTrustScore('cache-test', input)
      trustScoreService.invalidateCache('cache-test')

      // Small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10))

      // Calculate again - should get new timestamp
      const secondScore = trustScoreService.calculateTrustScore('cache-test', input)

      expect(secondScore.lastEvaluated).not.toBe(firstScore.lastEvaluated)
    })

    it('should clear all cache entries', () => {
      const input: TrustScoreInput = {
        authMethod: 'oauth2',
        apiDocUrl: 'https://api.example.com'
      }

      trustScoreService.calculateTrustScore('tool-1', input)
      trustScoreService.calculateTrustScore('tool-2', input)

      const statsBefore = trustScoreService.getCacheStats()
      expect(statsBefore.size).toBe(2)

      trustScoreService.clearCache()

      const statsAfter = trustScoreService.getCacheStats()
      expect(statsAfter.size).toBe(0)
    })

    it('should report cache statistics', () => {
      const input: TrustScoreInput = {
        authMethod: 'oauth2',
        apiDocUrl: 'https://api.example.com'
      }

      trustScoreService.calculateTrustScore('stats-test', input)
      const stats = trustScoreService.getCacheStats()

      expect(stats.size).toBeGreaterThanOrEqual(1)
      expect(stats.oldestEntry).toBeLessThanOrEqual(Date.now())
    })
  })

  describe('Security Score Calculation', () => {
    it('should give max security score for all security features', () => {
      const input: TrustScoreInput = {
        authMethod: 'oauth2',
        apiDocUrl: 'https://secure.example.com',
        hasHttpsEndpoint: true,
        hasRateLimiting: true,
        encryptedTransit: true
      }

      const score = trustScoreService.calculateTrustScore('max-security', input)

      expect(score.components.security).toBe(100)
      expect(score.breakdown.hasOAuth).toBe(true)
      expect(score.breakdown.httpsOnly).toBe(true)
      expect(score.breakdown.rateLimited).toBe(true)
    })

    it('should infer HTTPS from documentation URL', () => {
      const httpsInput: TrustScoreInput = {
        authMethod: 'none',
        apiDocUrl: 'https://api.example.com/docs'
      }
      const httpsScore = trustScoreService.calculateTrustScore('https-infer', httpsInput)

      const httpInput: TrustScoreInput = {
        authMethod: 'none',
        apiDocUrl: 'http://api.example.com/docs'
      }
      const httpScore = trustScoreService.calculateTrustScore('http-infer', httpInput)

      expect(httpsScore.breakdown.httpsOnly).toBe(true)
      expect(httpScore.breakdown.httpsOnly).toBe(false)
    })
  })

  describe('Active Maintenance Detection', () => {
    it('should detect actively maintained tools', () => {
      const recentInput: TrustScoreInput = {
        authMethod: 'oauth2',
        apiDocUrl: 'https://api.example.com',
        lastUpdated: new Date().toISOString() // Today
      }

      const score = trustScoreService.calculateTrustScore('recent-tool', recentInput)

      expect(score.breakdown.activelyMaintained).toBe(true)
    })

    it('should detect unmaintained tools', () => {
      const oldDate = new Date()
      oldDate.setFullYear(oldDate.getFullYear() - 1) // 1 year ago

      const oldInput: TrustScoreInput = {
        authMethod: 'oauth2',
        apiDocUrl: 'https://api.example.com',
        lastUpdated: oldDate.toISOString()
      }

      const score = trustScoreService.calculateTrustScore('old-tool', oldInput)

      expect(score.breakdown.activelyMaintained).toBe(false)
    })
  })
})
