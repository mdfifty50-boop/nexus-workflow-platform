/**
 * GenericToolDiscovery.ts
 *
 * LAYER 1: Tool Discovery
 *
 * Discovers tools dynamically from Rube MCP based on user intent.
 * No hardcoded tool knowledge - purely dynamic discovery.
 *
 * @NEXUS-GENERIC-ORCHESTRATION
 */

import type {
  ToolDiscoveryResult,
  DiscoveredTool,
  RubeSearchResult
} from './types';

/**
 * Cache for tool discovery results
 * Reduces redundant API calls for same intent
 */
interface DiscoveryCache {
  [key: string]: {
    result: ToolDiscoveryResult;
    timestamp: number;
  };
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export class GenericToolDiscovery {
  private cache: DiscoveryCache = {};

  /**
   * Discover tools matching user intent via Rube MCP
   *
   * @param intent - Natural language description of what user wants to do
   * @param toolkit - Optional specific toolkit to search within
   * @returns Discovered tools with session ID for subsequent calls
   */
  async discoverTools(
    intent: string,
    toolkit?: string
  ): Promise<ToolDiscoveryResult> {
    const cacheKey = `${intent}|${toolkit || ''}`;

    // Check cache
    const cached = this.cache[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.log(`[GenericToolDiscovery] Cache hit for: ${intent}`);
      return cached.result;
    }

    console.log(`[GenericToolDiscovery] Searching Rube for: ${intent}`);

    try {
      // Call Rube MCP SEARCH_TOOLS
      const response = await this.callRubeSearch(intent, toolkit);

      const result: ToolDiscoveryResult = {
        tools: response.tools.map(tool => this.mapToDiscoveredTool(tool)),
        sessionId: response.session_id,
        timestamp: Date.now()
      };

      // Cache result
      this.cache[cacheKey] = { result, timestamp: Date.now() };

      console.log(`[GenericToolDiscovery] Found ${result.tools.length} tools`);
      return result;

    } catch (error) {
      console.error('[GenericToolDiscovery] Search failed:', error);
      throw new Error(`Tool discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Discover multiple intents in parallel
   */
  async discoverMultiple(
    intents: Array<{ intent: string; toolkit?: string }>
  ): Promise<Map<string, ToolDiscoveryResult>> {
    const results = new Map<string, ToolDiscoveryResult>();

    const promises = intents.map(async ({ intent, toolkit }) => {
      const result = await this.discoverTools(intent, toolkit);
      results.set(intent, result);
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Find best matching tool for a specific action
   */
  async findBestTool(
    toolkit: string,
    action: string
  ): Promise<DiscoveredTool | null> {
    const intent = `${action} using ${toolkit}`;
    const result = await this.discoverTools(intent, toolkit);

    if (result.tools.length === 0) {
      return null;
    }

    // Return first match (Rube ranks by relevance)
    return result.tools[0];
  }

  /**
   * Clear discovery cache
   */
  clearCache(): void {
    this.cache = {};
    console.log('[GenericToolDiscovery] Cache cleared');
  }

  /**
   * Call Rube MCP SEARCH_TOOLS via API proxy
   * @NEXUS-FIX-053: Uses /api/rube/search-tools endpoint
   */
  private async callRubeSearch(
    intent: string,
    toolkit?: string
  ): Promise<RubeSearchResult> {
    // Build query for Rube API proxy
    const query = {
      use_case: intent,
      known_fields: toolkit ? `toolkit: ${toolkit}` : undefined
    };

    console.log('[GenericToolDiscovery] Calling Rube API proxy...');

    const response = await fetch('/api/rube/search-tools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queries: [query],
        session_id: this.sessionId
      })
    });

    if (!response.ok) {
      throw new Error(`Rube search failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Search failed');
    }

    // Update session ID if returned
    if (data.session_id) {
      this.sessionId = data.session_id;
    }

    console.log(`[GenericToolDiscovery] Rube API returned ${data.tools?.length || 0} tools`);

    return {
      tools: data.tools || [],
      session_id: data.session_id
    };
  }

  /**
   * Map Rube response to our DiscoveredTool type
   */
  private mapToDiscoveredTool(rubeTool: {
    tool_slug: string;
    name: string;
    description: string;
    toolkit?: string;
  }): DiscoveredTool {
    return {
      slug: rubeTool.tool_slug,
      name: rubeTool.name,
      description: rubeTool.description,
      toolkit: rubeTool.toolkit || this.extractToolkit(rubeTool.tool_slug)
    };
  }

  /**
   * Extract toolkit name from tool slug
   * "GMAIL_SEND_EMAIL" -> "gmail"
   */
  private extractToolkit(slug: string): string {
    const parts = slug.split('_');
    return parts[0]?.toLowerCase() || 'unknown';
  }

  /**
   * Session ID for Rube API
   */
  private sessionId: string | null = null;
}

// Singleton instance
let discoveryInstance: GenericToolDiscovery | null = null;

export function getToolDiscovery(): GenericToolDiscovery {
  if (!discoveryInstance) {
    discoveryInstance = new GenericToolDiscovery();
  }
  return discoveryInstance;
}
