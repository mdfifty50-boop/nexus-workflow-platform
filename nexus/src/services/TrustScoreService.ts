/**
 * TrustScoreService - Trust Score Calculator for Story 16.2
 *
 * Calculates trust scores for dynamically discovered tools based on:
 * - Security: OAuth, HTTPS, rate limiting, encrypted transit
 * - Reliability: Success rate from historical data
 * - Performance: Average latency measurements
 * - Community: Usage count, active maintenance
 *
 * Trust Score Algorithm (from technical design):
 * overall = (security * 0.35) + (reliability * 0.30) + (performance * 0.20) + (community * 0.15)
 *
 * Recommendation Thresholds:
 * - ✅ Recommended: Trust Score ≥ 70
 * - ⚠️ Use with caution: Trust Score 40-69
 * - ❌ Not recommended: Trust Score < 40
 */

import type {
  ToolTrustScore,
  RecommendationBadge,
  ToolAuthMethod
} from '../types/tools'

// Cache configuration - 24 hours for trust scores (NFR-16.1.3)
const TRUST_SCORE_CACHE_TTL_MS = 24 * 60 * 60 * 1000

// Weight configuration for trust score calculation
const WEIGHTS = {
  security: 0.35,
  reliability: 0.30,
  performance: 0.20,
  community: 0.15
}

// Recommendation thresholds
const THRESHOLDS = {
  recommended: 70,
  caution: 40
}

interface CacheEntry {
  score: ToolTrustScore
  timestamp: number
}

/**
 * Input data for calculating trust score
 */
export interface TrustScoreInput {
  // Security factors
  authMethod: ToolAuthMethod
  apiDocUrl: string | null
  hasHttpsEndpoint?: boolean
  hasRateLimiting?: boolean
  encryptedTransit?: boolean

  // Reliability factors (from usage metrics or external sources)
  successRate?: number      // 0-100 percentage
  uptimePercentage?: number // 0-100 percentage

  // Performance factors
  avgLatencyMs?: number     // Average response time

  // Community factors
  usageCount?: number       // Total usage across platform
  lastUpdated?: string      // Last maintenance/update date
  communityRating?: number  // External rating (0-5 stars)
}

class TrustScoreServiceClass {
  private cache: Map<string, CacheEntry> = new Map()

  /**
   * Calculate trust score for a tool
   * Performance target: < 100ms (NFR-16.1)
   */
  calculateTrustScore(toolId: string, input: TrustScoreInput): ToolTrustScore {
    const startTime = Date.now()

    // Check cache first
    const cached = this.getFromCache(toolId)
    if (cached) {
      return cached
    }

    // Calculate component scores
    const security = this.calculateSecurityScore(input)
    const reliability = this.calculateReliabilityScore(input)
    const performance = this.calculatePerformanceScore(input)
    const community = this.calculateCommunityScore(input)

    // Calculate weighted overall score
    const overall = Math.round(
      (security * WEIGHTS.security) +
      (reliability * WEIGHTS.reliability) +
      (performance * WEIGHTS.performance) +
      (community * WEIGHTS.community)
    )

    const trustScore: ToolTrustScore = {
      overall,
      components: {
        security,
        reliability,
        performance,
        community
      },
      breakdown: {
        hasOAuth: input.authMethod === 'oauth2',
        httpsOnly: input.hasHttpsEndpoint ?? this.inferHttpsFromDocUrl(input.apiDocUrl),
        rateLimited: input.hasRateLimiting ?? false,
        documentedApi: !!input.apiDocUrl,
        activelyMaintained: this.isActivelyMaintained(input.lastUpdated),
        encryptedTransit: input.encryptedTransit,
        successRate: input.successRate,
        avgLatencyMs: input.avgLatencyMs,
        usageCount: input.usageCount
      },
      lastEvaluated: new Date().toISOString()
    }

    // Cache the result
    this.setCache(toolId, trustScore)

    const elapsed = Date.now() - startTime
    if (elapsed > 100) {
      console.warn(`[TrustScoreService] Score calculation took ${elapsed}ms (target: <100ms)`)
    }

    return trustScore
  }

  /**
   * Get recommendation badge based on trust score
   */
  getRecommendationBadge(score: number): RecommendationBadge {
    if (score >= THRESHOLDS.recommended) {
      return 'recommended'
    } else if (score >= THRESHOLDS.caution) {
      return 'caution'
    } else {
      return 'not_recommended'
    }
  }

  /**
   * Get badge display text with emoji
   */
  getBadgeDisplay(badge: RecommendationBadge): { emoji: string; text: string; color: string } {
    switch (badge) {
      case 'recommended':
        return { emoji: '✅', text: 'Recommended', color: 'green' }
      case 'caution':
        return { emoji: '⚠️', text: 'Use with caution', color: 'yellow' }
      case 'not_recommended':
        return { emoji: '❌', text: 'Not recommended', color: 'red' }
    }
  }

  /**
   * Calculate security component score (0-100)
   *
   * Factors:
   * - hasOAuth: 25 points
   * - httpsOnly: 25 points
   * - rateLimited: 25 points
   * - encryptedTransit: 25 points
   */
  private calculateSecurityScore(input: TrustScoreInput): number {
    let score = 0

    // OAuth authentication (25 points)
    if (input.authMethod === 'oauth2') {
      score += 25
    } else if (input.authMethod === 'api_key' || input.authMethod === 'bearer') {
      score += 15 // Partial credit for API key/bearer
    }

    // HTTPS only (25 points)
    const hasHttps = input.hasHttpsEndpoint ?? this.inferHttpsFromDocUrl(input.apiDocUrl)
    if (hasHttps) {
      score += 25
    }

    // Rate limiting (25 points)
    if (input.hasRateLimiting) {
      score += 25
    }

    // Encrypted transit (25 points)
    if (input.encryptedTransit) {
      score += 25
    } else if (hasHttps) {
      // Infer encrypted transit from HTTPS
      score += 15
    }

    return Math.min(100, score)
  }

  /**
   * Calculate reliability component score (0-100)
   *
   * Based on success rate and uptime percentage
   */
  private calculateReliabilityScore(input: TrustScoreInput): number {
    // If we have success rate data, use it directly
    if (input.successRate !== undefined) {
      return Math.round(input.successRate)
    }

    // If we have uptime percentage, use it
    if (input.uptimePercentage !== undefined) {
      return Math.round(input.uptimePercentage)
    }

    // Default to moderate score if no data available
    // New tools get benefit of the doubt
    return 60
  }

  /**
   * Calculate performance component score (0-100)
   *
   * Based on average latency:
   * - 0ms = 100 points
   * - 5000ms+ = 0 points
   * Formula: 100 - min(avgLatencyMs / 50, 100)
   */
  private calculatePerformanceScore(input: TrustScoreInput): number {
    if (input.avgLatencyMs === undefined) {
      // Default to moderate score if no data
      return 70
    }

    // Scale: 0ms = 100, 5000ms = 0
    const score = 100 - Math.min(input.avgLatencyMs / 50, 100)
    return Math.max(0, Math.round(score))
  }

  /**
   * Calculate community component score (0-100)
   *
   * Based on:
   * - Usage count: 10000+ uses = 100 points
   * - Active maintenance bonus
   * - Community rating bonus
   */
  private calculateCommunityScore(input: TrustScoreInput): number {
    let score = 0

    // Usage count (up to 60 points)
    if (input.usageCount !== undefined) {
      // Formula: min(usageCount / 100, 100) but capped at 60
      score += Math.min(Math.round(input.usageCount / 166.67), 60)
    } else {
      // Default moderate score for new tools
      score += 30
    }

    // Active maintenance bonus (up to 20 points)
    if (this.isActivelyMaintained(input.lastUpdated)) {
      score += 20
    }

    // Community rating bonus (up to 20 points)
    if (input.communityRating !== undefined) {
      // Convert 0-5 stars to 0-20 points
      score += Math.round((input.communityRating / 5) * 20)
    } else if (input.apiDocUrl) {
      // Partial credit for having documentation
      score += 10
    }

    return Math.min(100, score)
  }

  /**
   * Check if a tool is actively maintained
   * Considers tools updated within the last 6 months as active
   */
  private isActivelyMaintained(lastUpdated?: string): boolean {
    if (!lastUpdated) {
      return false
    }

    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    try {
      const updateDate = new Date(lastUpdated)
      return updateDate >= sixMonthsAgo
    } catch {
      return false
    }
  }

  /**
   * Infer HTTPS support from API documentation URL
   */
  private inferHttpsFromDocUrl(apiDocUrl: string | null): boolean {
    if (!apiDocUrl) {
      return false
    }
    return apiDocUrl.toLowerCase().startsWith('https://')
  }

  // ==================== CACHE MANAGEMENT ====================

  private getFromCache(toolId: string): ToolTrustScore | null {
    const entry = this.cache.get(toolId)
    if (!entry) return null

    // Check if cache is still valid
    if (Date.now() - entry.timestamp > TRUST_SCORE_CACHE_TTL_MS) {
      this.cache.delete(toolId)
      return null
    }

    return entry.score
  }

  private setCache(toolId: string, score: ToolTrustScore): void {
    this.cache.set(toolId, {
      score,
      timestamp: Date.now()
    })
  }

  /**
   * Invalidate cached trust score for a tool
   */
  invalidateCache(toolId: string): void {
    this.cache.delete(toolId)
  }

  /**
   * Clear all cached trust scores
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; oldestEntry: number | null } {
    let oldestTimestamp: number | null = null

    for (const entry of this.cache.values()) {
      if (oldestTimestamp === null || entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp
      }
    }

    return {
      size: this.cache.size,
      oldestEntry: oldestTimestamp
    }
  }
}

// Export singleton instance
export const trustScoreService = new TrustScoreServiceClass()

// Export class for type reference
export const TrustScoreService = TrustScoreServiceClass
