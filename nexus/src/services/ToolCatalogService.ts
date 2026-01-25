/**
 * ToolCatalogService - Tool Catalog & Knowledge Base for Epic 16
 *
 * Provides searchable access to pre-approved tools and learns from
 * tool usage patterns to improve recommendations over time.
 *
 * Features:
 * - Full-text search with filters (category, auth method, cost tier)
 * - Tool usage metric tracking for learning patterns
 * - Automatic reliability rating updates based on usage
 * - Integration with Rube/Composio toolkit slugs
 */

import { supabase } from '../lib/supabase'
import {
  toolFromRow,
  toolToRow
} from '../types/tools'
import type {
  Tool,
  ToolSearchFilters,
  ToolSearchResult,
  ToolUsageMetric,
  ToolCatalogStats,
  AddToolRequest,
  ToolCategory,
  ToolAuthMethod,
  // ToolCostTier - reserved for future cost filtering
  LearnedPattern,
  ToolCatalogRow,
  ToolUsageMetricRow
} from '../types/tools'

// Cache configuration
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const POPULAR_TOOLS_CACHE_KEY = 'popular_tools'

interface CacheEntry<T> {
  data: T
  timestamp: number
}

class ToolCatalogServiceClass {
  private cache: Map<string, CacheEntry<unknown>> = new Map()
  private statsListeners: Array<(stats: ToolCatalogStats) => void> = []

  // ==================== SEARCH & DISCOVERY ====================

  /**
   * Search tools with full-text search and filters
   * Performance target: < 5 seconds (NFR-16.1.1)
   */
  async searchTools(filters: ToolSearchFilters = {}): Promise<ToolSearchResult[]> {
    const {
      query,
      category,
      authMethod,
      costTier,
      minReliability,
      provider,
      hasCapability,
      limit = 20,
      offset = 0
    } = filters

    let queryBuilder = supabase
      .from('tool_catalog')
      .select('*')
      .eq('is_approved', true)
      .order('reliability_rating', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (category) {
      queryBuilder = queryBuilder.eq('category', category)
    }

    if (authMethod) {
      queryBuilder = queryBuilder.eq('auth_method', authMethod)
    }

    if (minReliability !== undefined) {
      queryBuilder = queryBuilder.gte('reliability_rating', minReliability)
    }

    if (provider) {
      queryBuilder = queryBuilder.eq('provider', provider)
    }

    if (costTier) {
      queryBuilder = queryBuilder.contains('cost_estimate', { tier: costTier })
    }

    if (hasCapability) {
      queryBuilder = queryBuilder.contains('capabilities', [{ action: hasCapability }])
    }

    // Full-text search using Postgres ts_vector
    if (query) {
      queryBuilder = queryBuilder.textSearch('name', query, {
        type: 'websearch',
        config: 'english'
      })
    }

    const { data, error } = await queryBuilder

    if (error) {
      console.error('[ToolCatalogService] Search error:', error)
      throw new Error(`Tool search failed: ${error.message}`)
    }

    // Convert rows to Tool objects with relevance scoring
    return (data || []).map((row: ToolCatalogRow, index: number) => ({
      tool: toolFromRow(row),
      relevanceScore: Math.max(0, 100 - index * 5), // Simple positional relevance
      matchReason: query
        ? `Matches search term "${query}"`
        : `Top ${category || 'all'} tool by reliability`
    }))
  }

  /**
   * Get a single tool by ID
   */
  async getToolById(id: string): Promise<Tool | null> {
    const cacheKey = `tool_${id}`
    const cached = this.getFromCache<Tool>(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from('tool_catalog')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    const tool = toolFromRow(data)
    this.setCache(cacheKey, tool)
    return tool
  }

  /**
   * Get tool by Rube/Composio toolkit slug
   */
  async getToolBySlug(toolkitSlug: string): Promise<Tool | null> {
    const cacheKey = `tool_slug_${toolkitSlug}`
    const cached = this.getFromCache<Tool>(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from('tool_catalog')
      .select('*')
      .eq('toolkit_slug', toolkitSlug)
      .single()

    if (error || !data) {
      return null
    }

    const tool = toolFromRow(data)
    this.setCache(cacheKey, tool)
    return tool
  }

  /**
   * Get tools by category
   */
  async getToolsByCategory(category: ToolCategory): Promise<Tool[]> {
    const results = await this.searchTools({ category, limit: 100 })
    return results.map(r => r.tool)
  }

  /**
   * Get popular/frequently used tools
   */
  async getPopularTools(limit = 10): Promise<Tool[]> {
    const cached = this.getFromCache<Tool[]>(POPULAR_TOOLS_CACHE_KEY)
    if (cached) return cached.slice(0, limit)

    // Query from tool_statistics view
    const { data, error } = await supabase
      .from('tool_statistics')
      .select('tool_id')
      .order('total_usages', { ascending: false })
      .limit(limit)

    if (error || !data) {
      // Fallback to highest reliability
      const results = await this.searchTools({ limit })
      return results.map(r => r.tool)
    }

    // Fetch full tool details
    const toolIds = data.map(d => d.tool_id)
    const { data: tools } = await supabase
      .from('tool_catalog')
      .select('*')
      .in('id', toolIds)

    const popularTools = (tools || []).map(toolFromRow)
    this.setCache(POPULAR_TOOLS_CACHE_KEY, popularTools)
    return popularTools
  }

  // ==================== CATALOG MANAGEMENT ====================

  /**
   * Add a new tool to the catalog (admin only)
   */
  async addTool(request: AddToolRequest): Promise<Tool> {
    const row = {
      name: request.name,
      category: request.category,
      description: request.description || null,
      api_doc_url: request.apiDocUrl || null,
      auth_method: request.authMethod,
      data_formats: request.dataFormats || ['json'],
      cost_estimate: request.costEstimate || null,
      toolkit_slug: request.toolkitSlug || null,
      provider: request.provider || 'custom',
      capabilities: request.capabilities || [],
      is_approved: false, // Requires approval
      metadata: request.metadata || {}
    }

    const { data, error } = await supabase
      .from('tool_catalog')
      .insert(row)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to add tool: ${error.message}`)
    }

    return toolFromRow(data)
  }

  /**
   * Approve a tool (admin only)
   */
  async approveTool(toolId: string, approvedBy: string): Promise<Tool> {
    const { data, error } = await supabase
      .from('tool_catalog')
      .update({
        is_approved: true,
        approved_by: approvedBy,
        approved_at: new Date().toISOString()
      })
      .eq('id', toolId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to approve tool: ${error.message}`)
    }

    // Invalidate caches
    this.invalidateCache(`tool_${toolId}`)
    this.invalidateCache(POPULAR_TOOLS_CACHE_KEY)

    return toolFromRow(data)
  }

  /**
   * Update tool metadata
   */
  async updateTool(toolId: string, updates: Partial<Tool>): Promise<Tool> {
    const row = toolToRow(updates)

    const { data, error } = await supabase
      .from('tool_catalog')
      .update(row)
      .eq('id', toolId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update tool: ${error.message}`)
    }

    // Invalidate cache
    this.invalidateCache(`tool_${toolId}`)

    return toolFromRow(data)
  }

  // ==================== USAGE METRICS & LEARNING ====================

  /**
   * Record tool usage metric after workflow execution
   */
  async recordUsage(metric: Omit<ToolUsageMetric, 'id' | 'createdAt'>): Promise<void> {
    const row: Partial<ToolUsageMetricRow> = {
      tool_id: metric.toolId,
      project_id: metric.projectId,
      workflow_id: metric.workflowId,
      success: metric.success,
      execution_time_ms: metric.executionTimeMs,
      tokens_used: metric.tokensUsed,
      cost_usd: metric.costUsd,
      error_type: metric.errorType,
      error_message: metric.errorMessage,
      learned_patterns: metric.learnedPatterns || {}
    }

    const { error } = await supabase
      .from('tool_usage_metrics')
      .insert(row)

    if (error) {
      console.error('[ToolCatalogService] Failed to record usage:', error)
      // Don't throw - this is non-critical
    }

    // The database trigger will auto-update reliability rating
  }

  /**
   * Get learned patterns for a tool
   */
  async getLearnedPatterns(toolId: string, projectId?: string): Promise<LearnedPattern> {
    let query = supabase
      .from('tool_usage_metrics')
      .select('learned_patterns, success, execution_time_ms, cost_usd')
      .eq('tool_id', toolId)

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(100)

    if (error || !data || data.length === 0) {
      return {}
    }

    // Aggregate patterns
    const successfulRuns = data.filter(d => d.success)
    const failedRuns = data.filter(d => !d.success)

    const avgExecutionTime = successfulRuns.length > 0
      ? successfulRuns.reduce((sum, d) => sum + (d.execution_time_ms || 0), 0) / successfulRuns.length
      : undefined

    const avgCost = successfulRuns.length > 0
      ? successfulRuns.reduce((sum, d) => sum + (d.cost_usd || 0), 0) / successfulRuns.length
      : undefined

    const successRate = data.length > 0
      ? (successfulRuns.length / data.length) * 100
      : undefined

    // Extract unique learned patterns from recent runs
    const allPatterns = data
      .map(d => d.learned_patterns)
      .filter(p => p && Object.keys(p).length > 0)

    return {
      avgExecutionTimeMs: avgExecutionTime,
      avgCostUsd: avgCost,
      successRate,
      recommendedParams: allPatterns[0]?.recommendedParams,
      knownFailures: failedRuns.slice(0, 5).map(f => ({
        errorType: f.learned_patterns?.knownFailures?.[0]?.errorType || 'unknown',
        resolution: f.learned_patterns?.knownFailures?.[0]?.resolution || ''
      })).filter(f => f.errorType !== 'unknown')
    }
  }

  /**
   * Get tool statistics for the catalog
   */
  async getCatalogStats(): Promise<ToolCatalogStats> {
    const cacheKey = 'catalog_stats'
    const cached = this.getFromCache<ToolCatalogStats>(cacheKey)
    if (cached) return cached

    const { data: tools, error } = await supabase
      .from('tool_catalog')
      .select('category, auth_method, reliability_rating, is_approved')

    if (error || !tools) {
      return {
        totalTools: 0,
        approvedTools: 0,
        byCategory: {} as Record<ToolCategory, number>,
        byAuthMethod: {} as Record<ToolAuthMethod, number>,
        avgReliability: 0
      }
    }

    const approvedTools = tools.filter(t => t.is_approved)

    const byCategory = approvedTools.reduce((acc, t) => {
      acc[t.category as ToolCategory] = (acc[t.category as ToolCategory] || 0) + 1
      return acc
    }, {} as Record<ToolCategory, number>)

    const byAuthMethod = approvedTools.reduce((acc, t) => {
      acc[t.auth_method as ToolAuthMethod] = (acc[t.auth_method as ToolAuthMethod] || 0) + 1
      return acc
    }, {} as Record<ToolAuthMethod, number>)

    const avgReliability = approvedTools.length > 0
      ? approvedTools.reduce((sum, t) => sum + t.reliability_rating, 0) / approvedTools.length
      : 0

    const stats: ToolCatalogStats = {
      totalTools: tools.length,
      approvedTools: approvedTools.length,
      byCategory,
      byAuthMethod,
      avgReliability: Math.round(avgReliability * 100) / 100
    }

    this.setCache(cacheKey, stats)
    return stats
  }

  // ==================== CACHE MANAGEMENT ====================

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined
    if (!entry) return null

    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  private invalidateCache(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear()
  }

  // ==================== STATS LISTENERS ====================

  onStatsChange(callback: (stats: ToolCatalogStats) => void): () => void {
    this.statsListeners.push(callback)
    return () => {
      this.statsListeners = this.statsListeners.filter(cb => cb !== callback)
    }
  }
}

// Export singleton instance
export const toolCatalogService = new ToolCatalogServiceClass()

// Alias for class type
export const ToolCatalogService = ToolCatalogServiceClass
