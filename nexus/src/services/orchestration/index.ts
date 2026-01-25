/**
 * Generic Orchestration Layer
 *
 * 5-Layer architecture for dynamic tool orchestration.
 * Enables Nexus to work with ANY of Rube's 500+ tools
 * without hardcoding tool-specific knowledge.
 *
 * Layers:
 *   1. GenericToolDiscovery - RUBE_SEARCH_TOOLS
 *   2. GenericSchemaResolver - RUBE_GET_TOOL_SCHEMAS + caching
 *   3. GenericUXTranslator - Pattern-based UX translation
 *   4. GenericParamCollector - State machine for collection
 *   5. GenericExecutor - RUBE_MULTI_EXECUTE_TOOL + verification
 *
 * @NEXUS-GENERIC-ORCHESTRATION
 */

// Types
export * from './types';

// Layer 1: Tool Discovery
import { GenericToolDiscovery, getToolDiscovery } from './GenericToolDiscovery';
export { GenericToolDiscovery, getToolDiscovery };

// Layer 2: Schema Resolution
import { GenericSchemaResolver, getSchemaResolver } from './GenericSchemaResolver';
export { GenericSchemaResolver, getSchemaResolver };

// Layer 3: UX Translation
import { GenericUXTranslator, getUXTranslator, humanize } from './GenericUXTranslator';
export { GenericUXTranslator, getUXTranslator, humanize };

// Layer 4: Param Collection
import { GenericParamCollector, createCollector, useParamCollector } from './GenericParamCollector';
export { GenericParamCollector, createCollector, useParamCollector };

// Layer 5: Execution
import { GenericExecutor, getExecutor } from './GenericExecutor';
export { GenericExecutor, getExecutor };

// UX Patterns
export {
  UX_PATTERNS,
  findPattern,
  getPatternIndex,
  humanize as humanizeString
} from './patterns/UXPatterns';

// Import types for the facade
import type { DiscoveredTool, ToolSchema, CollectionQuestion, ExecutionResult } from './types';

/**
 * Orchestration Facade - Simplified API for common use cases
 */
export class OrchestrationService {
  private discovery = getToolDiscovery();
  private schemaResolver = getSchemaResolver();
  private uxTranslator = getUXTranslator();
  private executor = getExecutor();

  /**
   * Full orchestration flow: discover -> resolve -> translate -> collect -> execute
   */
  async orchestrate(
    intent: string,
    toolkit?: string
  ): Promise<{
    tools: DiscoveredTool[];
    sessionId: string;
    getSchema: (toolSlug: string) => Promise<ToolSchema>;
    createCollector: (schema: ToolSchema) => GenericParamCollector;
    execute: (toolSlug: string, params: Record<string, unknown>) => Promise<ExecutionResult>;
  }> {
    // Step 1: Discover tools
    const discovery = await this.discovery.discoverTools(intent, toolkit);

    // Set session for executor
    this.executor.setSessionId(discovery.sessionId);

    // Capture references for closures
    const schemaResolver = this.schemaResolver;
    const executor = this.executor;

    return {
      tools: discovery.tools,
      sessionId: discovery.sessionId,

      // Step 2: Get schema for selected tool
      getSchema: async (toolSlug: string) => {
        return await schemaResolver.getSchema(toolSlug, discovery.sessionId);
      },

      // Step 3 & 4: Create collector with translated UX
      createCollector: (schema: ToolSchema) => {
        return createCollector(schema);
      },

      // Step 5: Execute
      execute: async (toolSlug: string, params: Record<string, unknown>) => {
        return await executor.execute(toolSlug, params, discovery.sessionId);
      }
    };
  }

  /**
   * Quick execution when tool is already known
   */
  async quickExecute(
    toolSlug: string,
    params: Record<string, unknown>,
    sessionId: string
  ): Promise<ExecutionResult> {
    return await this.executor.execute(toolSlug, params, sessionId);
  }

  /**
   * Get user-friendly questions for a tool
   */
  async getQuestions(
    toolSlug: string,
    sessionId: string
  ): Promise<CollectionQuestion[]> {
    const schema = await this.schemaResolver.getSchema(toolSlug, sessionId);
    return this.uxTranslator.translateSchema(schema);
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.discovery.clearCache();
    this.schemaResolver.clearCache();
  }
}

// Singleton facade instance
let orchestrationService: OrchestrationService | null = null;

export function getOrchestrationService(): OrchestrationService {
  if (!orchestrationService) {
    orchestrationService = new OrchestrationService();
  }
  return orchestrationService;
}
