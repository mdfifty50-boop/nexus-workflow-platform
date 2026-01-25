/**
 * ToolDiscoveryService - Dynamic Tool Discovery Engine for Story 16.2
 *
 * Discovers tools beyond the pre-approved catalog when workflows require
 * specialized capabilities. Integrates with:
 * - Local Tool Catalog (primary source)
 * - Rube MCP SEARCH_TOOLS (external discovery fallback)
 *
 * Features:
 * - Capability-to-tool matching algorithm
 * - 5-second timeout with partial results (NFR-16.1.1)
 * - Trust score calculation for discovered tools
 * - 24-hour caching for approved tools
 * - User approval flow for unapproved tools
 */

import { supabase } from '../lib/supabase'
import { toolCatalogService } from './ToolCatalogService'
import { trustScoreService, type TrustScoreInput } from './TrustScoreService'
import type {
  Tool,
  ToolCategory,
  ToolAuthMethod,
  DiscoveredTool,
  DiscoverySearchRequest,
  DiscoverySearchResult,
  ToolTrustScore,
  ToolApproval,
  ToolDiscoveryCacheRow
} from '../types/tools'

// Configuration
const DISCOVERY_TIMEOUT_MS = 5000 // 5 seconds (NFR-16.1.1)
const DISCOVERY_CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const MAX_RESULTS = 10 // Top 10 most relevant results
const LOCAL_SEARCH_WEIGHT = 1.2 // Boost local catalog results

interface RubeToolResult {
  tool_slug: string
  name: string
  description?: string
  toolkit?: string
  input_schema?: Record<string, unknown>
  relevance_score?: number
}

interface RubeSearchResponse {
  session_id: string
  tools?: RubeToolResult[]
  error?: string
}

class ToolDiscoveryServiceClass {
  private sessionId: string | null = null
  private discoveryCache: Map<string, { results: DiscoverySearchResult[]; timestamp: number }> = new Map()

  /**
   * Discover tools for a capability request
   *
   * Flow:
   * 1. Check local catalog first
   * 2. If insufficient results, query external sources (Rube MCP)
   * 3. Calculate trust scores for discovered tools
   * 4. Return combined results sorted by relevance
   *
   * @param request Discovery search request
   * @returns Combined results from catalog and external discovery
   */
  async discoverTools(request: DiscoverySearchRequest): Promise<DiscoverySearchResult[]> {
    const startTime = Date.now()
    const { capability, category, minTrustScore = 0, includeUnapproved = true, limit = MAX_RESULTS } = request

    // Generate cache key
    const cacheKey = this.generateCacheKey(request)

    // Check cache first
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return this.filterResults(cached, minTrustScore, includeUnapproved, limit)
    }

    // Results collection
    const results: DiscoverySearchResult[] = []
    let externalSearchCompleted = false

    // Step 1: Search local catalog (primary source)
    const localResults = await this.searchLocalCatalog(capability, category)
    results.push(...localResults)

    // Step 2: If we don't have enough results, search external sources
    if (results.length < limit) {
      try {
        // Set up timeout for external search
        const timeoutPromise = new Promise<DiscoverySearchResult[]>((_, reject) => {
          setTimeout(() => reject(new Error('Discovery timeout')), DISCOVERY_TIMEOUT_MS - (Date.now() - startTime))
        })

        const externalPromise = this.searchExternalSources(capability, category)

        const externalResults = await Promise.race([externalPromise, timeoutPromise])
        results.push(...externalResults)
        externalSearchCompleted = true
      } catch (error) {
        // Timeout or error - proceed with partial results
        if ((error as Error).message !== 'Discovery timeout') {
          console.error('[ToolDiscoveryService] External search error:', error)
        }
      }
    }

    // Step 3: Deduplicate and sort by relevance
    const deduplicatedResults = this.deduplicateResults(results)
    const sortedResults = this.sortByRelevance(deduplicatedResults)

    // Cache results if external search completed
    if (externalSearchCompleted) {
      this.setCache(cacheKey, sortedResults)
    }

    const elapsed = Date.now() - startTime
    if (elapsed > DISCOVERY_TIMEOUT_MS) {
      console.warn(`[ToolDiscoveryService] Discovery took ${elapsed}ms (target: <${DISCOVERY_TIMEOUT_MS}ms)`)
    }

    return this.filterResults(sortedResults, minTrustScore, includeUnapproved, limit)
  }

  /**
   * Search local tool catalog
   */
  private async searchLocalCatalog(
    capability: string,
    category?: ToolCategory
  ): Promise<DiscoverySearchResult[]> {
    try {
      const searchResults = await toolCatalogService.searchTools({
        query: capability,
        category,
        limit: MAX_RESULTS
      })

      return searchResults.map(result => ({
        tool: result.tool,
        relevanceScore: result.relevanceScore * LOCAL_SEARCH_WEIGHT, // Boost local results
        matchReason: result.matchReason,
        source: 'catalog' as const,
        requiresApproval: false
      }))
    } catch (error) {
      console.error('[ToolDiscoveryService] Local catalog search error:', error)
      return []
    }
  }

  /**
   * Search external sources (Rube MCP SEARCH_TOOLS)
   */
  private async searchExternalSources(
    capability: string,
    category?: ToolCategory
  ): Promise<DiscoverySearchResult[]> {
    try {
      // Search via Rube MCP
      const rubeResults = await this.searchRubeMCP(capability, category)
      return rubeResults
    } catch (error) {
      console.error('[ToolDiscoveryService] External search error:', error)
      return []
    }
  }

  /**
   * Search tools via Rube MCP SEARCH_TOOLS
   */
  private async searchRubeMCP(
    capability: string,
    category?: ToolCategory
  ): Promise<DiscoverySearchResult[]> {
    // Note: In production, this would call the actual Rube MCP server
    // For now, we simulate the response structure
    try {
      const response = await this.callRubeSearchTools(capability, category)

      if (!response.tools || response.error) {
        return []
      }

      // Convert Rube results to DiscoveredTools
      const discoveredTools = await Promise.all(
        response.tools.map(async (rubeTool) => {
          const tool = this.rubeToolToDiscoveredTool(rubeTool)
          const trustScore = await this.calculateTrustScoreForTool(tool, rubeTool)

          return {
            ...tool,
            trustScore,
            recommendationBadge: trustScoreService.getRecommendationBadge(trustScore.overall)
          } as DiscoveredTool
        })
      )

      return discoveredTools.map((tool, index) => ({
        tool,
        relevanceScore: tool.trustScore.overall * 0.5 + (100 - index * 10) * 0.5, // Combine trust and position
        matchReason: `Discovered via Rube MCP for "${capability}"`,
        source: 'discovered' as const,
        requiresApproval: tool.trustScore.overall < 70
      }))
    } catch (error) {
      console.error('[ToolDiscoveryService] Rube MCP error:', error)
      return []
    }
  }

  /**
   * Call Rube MCP SEARCH_TOOLS API
   */
  private async callRubeSearchTools(
    _capability: string,
    _category?: ToolCategory
  ): Promise<RubeSearchResponse> {
    void _capability
    // In production, this would make an actual MCP call
    // For development, we return a simulated response

    // Check if we have an MCP connection available
    // This would typically be done via the MCP client
    const hasMCPConnection = typeof window !== 'undefined' && (window as unknown as { __MCP_AVAILABLE__?: boolean }).__MCP_AVAILABLE__

    if (!hasMCPConnection) {
      // Return empty results if no MCP connection
      // In production, this would actually call the MCP server
      console.log('[ToolDiscoveryService] No MCP connection available, skipping external discovery')
      return { session_id: 'mock-session', tools: [] }
    }

    // Simulated response for development
    // Real implementation would use MCP client to call RUBE_SEARCH_TOOLS
    return {
      session_id: this.sessionId || 'new-session',
      tools: []
    }
  }

  /**
   * Convert Rube tool result to DiscoveredTool
   */
  private rubeToolToDiscoveredTool(rubeTool: RubeToolResult): Partial<DiscoveredTool> {
    // Map Rube toolkit to category
    const category = this.mapToolkitToCategory(rubeTool.toolkit)

    return {
      id: `discovered-${rubeTool.tool_slug}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      name: rubeTool.name,
      category,
      description: rubeTool.description || null,
      apiDocUrl: null,
      authMethod: 'oauth2' as ToolAuthMethod, // Rube tools typically use OAuth
      dataFormats: ['json'],
      costEstimate: { tier: 'freemium', perCall: 0 },
      reliabilityRating: 0.8, // Default rating for discovered tools
      toolkitSlug: rubeTool.tool_slug,
      provider: 'rube',
      capabilities: rubeTool.input_schema
        ? [{ action: rubeTool.tool_slug, description: rubeTool.description || '', inputSchema: rubeTool.input_schema }]
        : [],
      isApproved: false,
      approvedBy: null,
      approvedAt: null,
      metadata: { rubeToolkit: rubeTool.toolkit },
      discoverySource: 'rube',
      discoveredAt: new Date().toISOString(),
      userApprovalRequired: true
    }
  }

  /**
   * Calculate trust score for a discovered tool
   */
  private async calculateTrustScoreForTool(
    tool: Partial<DiscoveredTool>,
    _rubeTool: RubeToolResult
  ): Promise<ToolTrustScore> {
    const input: TrustScoreInput = {
      authMethod: tool.authMethod || 'oauth2',
      apiDocUrl: tool.apiDocUrl || null,
      hasHttpsEndpoint: true, // Assume HTTPS for Rube tools
      hasRateLimiting: true, // Rube tools typically have rate limiting
      encryptedTransit: true,
      // For new discoveries, we don't have usage data yet
      successRate: undefined,
      avgLatencyMs: undefined,
      usageCount: undefined,
      lastUpdated: new Date().toISOString()
    }

    return trustScoreService.calculateTrustScore(tool.id || 'unknown', input)
  }

  /**
   * Map Rube toolkit name to ToolCategory
   */
  private mapToolkitToCategory(toolkit?: string): ToolCategory {
    if (!toolkit) return 'other'

    const toolkitLower = toolkit.toLowerCase()

    const categoryMap: Record<string, ToolCategory> = {
      gmail: 'communication',
      slack: 'communication',
      outlook: 'communication',
      teams: 'communication',
      zoom: 'communication',
      notion: 'productivity',
      todoist: 'productivity',
      asana: 'productivity',
      trello: 'productivity',
      github: 'development',
      gitlab: 'development',
      jira: 'development',
      linear: 'development',
      stripe: 'finance',
      quickbooks: 'finance',
      salesforce: 'crm',
      hubspot: 'crm',
      pipedrive: 'crm',
      mailchimp: 'marketing',
      twitter: 'social',
      linkedin: 'social',
      googlesheets: 'data',
      airtable: 'data',
      zapier: 'automation',
      openai: 'ai',
      anthropic: 'ai',
      googledrive: 'storage',
      dropbox: 'storage',
      googleanalytics: 'analytics'
    }

    return categoryMap[toolkitLower] || 'other'
  }

  /**
   * Deduplicate results by tool slug/name
   */
  private deduplicateResults(results: DiscoverySearchResult[]): DiscoverySearchResult[] {
    const seen = new Map<string, DiscoverySearchResult>()

    for (const result of results) {
      const key = result.tool.toolkitSlug || result.tool.name.toLowerCase()

      // Keep the higher-scored version
      if (!seen.has(key) || seen.get(key)!.relevanceScore < result.relevanceScore) {
        seen.set(key, result)
      }
    }

    return Array.from(seen.values())
  }

  /**
   * Sort results by relevance score
   */
  private sortByRelevance(results: DiscoverySearchResult[]): DiscoverySearchResult[] {
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  /**
   * Filter results by trust score and approval status
   */
  private filterResults(
    results: DiscoverySearchResult[],
    minTrustScore: number,
    includeUnapproved: boolean,
    limit: number
  ): DiscoverySearchResult[] {
    return results
      .filter(result => {
        // Filter by trust score for discovered tools
        if ('trustScore' in result.tool) {
          const discoveredTool = result.tool as DiscoveredTool
          if (discoveredTool.trustScore.overall < minTrustScore) {
            return false
          }
        }

        // Filter unapproved tools if requested
        if (!includeUnapproved && result.requiresApproval) {
          return false
        }

        return true
      })
      .slice(0, limit)
  }

  // ==================== APPROVAL FLOW ====================

  /**
   * Approve a discovered tool for use in a project
   */
  async approveDiscoveredTool(
    tool: DiscoveredTool,
    projectId: string,
    userId: string,
    reason?: string
  ): Promise<ToolApproval> {
    const approval: Omit<ToolApproval, 'id' | 'createdAt' | 'updatedAt'> = {
      toolId: tool.id,
      projectId,
      userId,
      status: 'approved',
      trustScoreAtApproval: tool.trustScore.overall,
      approvalReason: reason,
      expiresAt: new Date(Date.now() + DISCOVERY_CACHE_TTL_MS).toISOString()
    }

    // Store approval in database
    const { data, error } = await supabase
      .from('tool_discovery_cache')
      .upsert({
        tool_data: tool,
        capability_hash: this.hashCapability(tool.name),
        project_id: projectId,
        user_id: userId,
        approval_status: 'approved',
        expires_at: approval.expiresAt
      })
      .select()
      .single()

    if (error) {
      console.error('[ToolDiscoveryService] Failed to approve tool:', error)
      throw new Error(`Failed to approve tool: ${error.message}`)
    }

    return {
      ...approval,
      id: data.id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  /**
   * Reject a discovered tool
   */
  async rejectDiscoveredTool(
    toolId: string,
    projectId: string,
    userId: string,
    reason?: string
  ): Promise<void> {
    await supabase
      .from('tool_discovery_cache')
      .upsert({
        tool_data: { id: toolId },
        capability_hash: toolId,
        project_id: projectId,
        user_id: userId,
        approval_status: 'rejected',
        rejection_reason: reason,
        expires_at: new Date(Date.now() + DISCOVERY_CACHE_TTL_MS).toISOString()
      })
  }

  /**
   * Check if a tool is approved for a project
   */
  async isToolApproved(toolId: string, projectId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('tool_discovery_cache')
      .select('approval_status, expires_at')
      .eq('tool_data->>id', toolId)
      .eq('project_id', projectId)
      .single()

    if (error || !data) {
      return false
    }

    // Check if approval has expired
    if (new Date(data.expires_at) < new Date()) {
      return false
    }

    return data.approval_status === 'approved'
  }

  /**
   * Get user's approval history for a project
   */
  async getApprovalHistory(projectId: string, userId?: string): Promise<ToolApproval[]> {
    let query = supabase
      .from('tool_discovery_cache')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) {
      console.error('[ToolDiscoveryService] Failed to get approval history:', error)
      return []
    }

    return (data || []).map((row: ToolDiscoveryCacheRow) => ({
      id: row.id,
      toolId: row.tool_data.id,
      projectId: row.project_id || '',
      userId: row.user_id,
      status: row.approval_status,
      trustScoreAtApproval: row.tool_data.trustScore?.overall || 0,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  }

  /**
   * Add approved tool to the permanent catalog
   */
  async addToCatalog(tool: DiscoveredTool, approvedBy: string): Promise<Tool> {
    const addedTool = await toolCatalogService.addTool({
      name: tool.name,
      category: tool.category,
      description: tool.description || undefined,
      apiDocUrl: tool.apiDocUrl || undefined,
      authMethod: tool.authMethod,
      dataFormats: tool.dataFormats,
      costEstimate: tool.costEstimate || undefined,
      toolkitSlug: tool.toolkitSlug || undefined,
      provider: tool.provider,
      capabilities: tool.capabilities,
      metadata: {
        ...tool.metadata,
        addedFromDiscovery: true,
        originalTrustScore: tool.trustScore.overall
      }
    })

    // Approve the tool in catalog
    return await toolCatalogService.approveTool(addedTool.id, approvedBy)
  }

  // ==================== CACHE MANAGEMENT ====================

  private generateCacheKey(request: DiscoverySearchRequest): string {
    return `discovery_${request.capability}_${request.category || 'all'}`
  }

  private hashCapability(capability: string): string {
    // Simple hash for capability string
    let hash = 0
    for (let i = 0; i < capability.length; i++) {
      const char = capability.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(16)
  }

  private getFromCache(key: string): DiscoverySearchResult[] | null {
    const entry = this.discoveryCache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > DISCOVERY_CACHE_TTL_MS) {
      this.discoveryCache.delete(key)
      return null
    }

    return entry.results
  }

  private setCache(key: string, results: DiscoverySearchResult[]): void {
    this.discoveryCache.set(key, {
      results,
      timestamp: Date.now()
    })
  }

  /**
   * Clear discovery cache
   */
  clearCache(): void {
    this.discoveryCache.clear()
  }

  /**
   * Set MCP session ID for Rube integration
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId
  }
}

// Export singleton instance
export const toolDiscoveryService = new ToolDiscoveryServiceClass()

// Export class for type reference
export const ToolDiscoveryService = ToolDiscoveryServiceClass
