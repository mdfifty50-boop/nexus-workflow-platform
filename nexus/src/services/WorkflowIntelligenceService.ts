/**
 * WorkflowIntelligenceService.ts
 *
 * UNIFIED SERVICE that combines all new intelligent workflow handling:
 * - ToolRegistry: Tool definitions, support levels, alternatives
 * - IntentResolver: Natural language parsing
 * - ErrorClassifier: Error recovery strategies
 *
 * This provides a single entry point for WorkflowPreviewCard to use
 * without requiring major changes to the existing protected code.
 *
 * @NEXUS-FIX-039: WorkflowIntelligenceService - Unified workflow intelligence - DO NOT REMOVE
 */

import { ToolRegistryService, type SupportResolution, type Alternative } from './ToolRegistry'
import { IntentResolverService, type ResolvedIntent } from './IntentResolver'
import { ErrorClassifierService, type ClassifiedError, type RecoveryAction } from './ErrorClassifier'

// ================================
// RE-EXPORT TYPES FOR CONVENIENCE
// ================================

export type {
  SupportResolution,
  Alternative,
  ResolvedIntent,
  ClassifiedError,
  RecoveryAction,
}

// ================================
// COMBINED RESULT TYPES
// ================================

export interface WorkflowAnalysis {
  /** Parsed intent from user input */
  intent: ResolvedIntent | null;
  /** Support status for each integration */
  integrationSupport: Map<string, SupportResolution>;
  /** Integrations that need attention */
  unsupportedIntegrations: Array<{
    integration: string;
    resolution: SupportResolution;
  }>;
  /** Integrations that need API key setup */
  apiKeyIntegrations: Array<{
    integration: string;
    resolution: SupportResolution;
  }>;
  /** Ready to execute? */
  ready: boolean;
  /** Issues to address before execution */
  issues: string[];
}

export interface ErrorAnalysis {
  /** Classified error with recovery action */
  classification: ClassifiedError;
  /** User-friendly message */
  friendlyMessage: string;
  /** Should auto-retry? */
  shouldAutoRetry: boolean;
  /** Retry delay in ms (if auto-retry) */
  retryDelay?: number;
}

// ================================
// MAIN SERVICE
// ================================

export class WorkflowIntelligenceService {
  /**
   * Analyze user input for workflow intent
   */
  static analyzeInput(input: string): ResolvedIntent {
    return IntentResolverService.resolve(input)
  }

  /**
   * Check if input is a workflow request
   */
  static isWorkflowRequest(input: string): boolean {
    return IntentResolverService.isWorkflowRequest(input)
  }

  /**
   * Get integrations mentioned in input
   */
  static getMentionedIntegrations(input: string): string[] {
    return IntentResolverService.getMentionedIntegrations(input)
  }

  /**
   * Check support level for an integration
   */
  static checkIntegrationSupport(integration: string): SupportResolution {
    return ToolRegistryService.resolveSupportLevel(integration)
  }

  /**
   * Resolve a tool slug for an integration and action
   */
  static resolveToolSlug(
    integration: string,
    action: string,
    nodeName: string
  ): { slug: string; definition?: unknown } | null {
    return ToolRegistryService.resolveToolSlug(integration, action, nodeName)
  }

  /**
   * Get user-friendly prompt for a parameter
   */
  static getParamPrompt(toolkit: string, paramName: string): string {
    const paramDef = ToolRegistryService.getParamPrompt(toolkit, paramName)
    return paramDef?.friendly || `What ${paramName.replace(/_/g, ' ')}?`
  }

  /**
   * Resolve parameter alias to actual param name
   */
  static resolveParamAlias(toolkit: string, alias: string): string {
    return ToolRegistryService.resolveParamAlias(toolkit, alias)
  }

  /**
   * Normalize integration name (handle variations)
   */
  static normalizeIntegration(name: string): string {
    return ToolRegistryService.normalizeIntegration(name)
  }

  /**
   * Analyze a full workflow specification for issues
   */
  static analyzeWorkflow(
    nodes: Array<{ integration?: string; name?: string }>,
    userInput?: string
  ): WorkflowAnalysis {
    // Parse user input if provided
    const intent = userInput ? IntentResolverService.resolve(userInput) : null

    // Check each integration
    const integrationSupport = new Map<string, SupportResolution>()
    const unsupportedIntegrations: WorkflowAnalysis['unsupportedIntegrations'] = []
    const apiKeyIntegrations: WorkflowAnalysis['apiKeyIntegrations'] = []
    const issues: string[] = []

    for (const node of nodes) {
      const integration = node.integration || node.name || ''
      if (!integration) continue

      const normalized = ToolRegistryService.normalizeIntegration(integration)

      // Skip if already checked
      if (integrationSupport.has(normalized)) continue

      const support = ToolRegistryService.resolveSupportLevel(normalized)
      integrationSupport.set(normalized, support)

      if (support.level === 'unsupported') {
        unsupportedIntegrations.push({ integration: normalized, resolution: support })
        issues.push(`${normalized} is not supported`)
      } else if (support.level === 'alternative') {
        unsupportedIntegrations.push({ integration: normalized, resolution: support })
        issues.push(`${normalized} needs an alternative`)
      } else if (support.level === 'api_key') {
        apiKeyIntegrations.push({ integration: normalized, resolution: support })
        // API key is not blocking, just needs setup
      }
    }

    // Check for unsupported from intent
    if (intent?.unsupportedTools) {
      for (const unsupported of intent.unsupportedTools) {
        if (!integrationSupport.has(unsupported.requested)) {
          const support = ToolRegistryService.resolveSupportLevel(unsupported.requested)
          integrationSupport.set(unsupported.requested, support)
          unsupportedIntegrations.push({ integration: unsupported.requested, resolution: support })
          issues.push(`${unsupported.requested} is not supported`)
        }
      }
    }

    return {
      intent,
      integrationSupport,
      unsupportedIntegrations,
      apiKeyIntegrations,
      ready: unsupportedIntegrations.length === 0,
      issues,
    }
  }

  /**
   * Classify an error and get recovery strategy
   */
  static classifyError(
    error: Error | string,
    context: {
      nodeId?: string;
      toolkit?: string;
      nodeName?: string;
      action?: string;
    }
  ): ErrorAnalysis {
    const errorMessage = typeof error === 'string' ? error : error.message

    // Build ExecutionContext for ErrorClassifier
    const executionContext = {
      nodeId: context.nodeId || '',
      nodeName: context.nodeName || '',
      toolkit: context.toolkit || '',
      action: context.action
    }

    const classification = ErrorClassifierService.classify(errorMessage, executionContext)

    // Use classification.message directly since we already have the classification
    const friendlyMessage = classification.message
    const shouldAutoRetry = ErrorClassifierService.shouldAutoRetry(classification)

    return {
      classification,
      friendlyMessage,
      shouldAutoRetry,
      retryDelay: shouldAutoRetry ?
        (classification.recoveryAction.type === 'retry' ? classification.recoveryAction.delay : 2000) :
        undefined,
    }
  }

  /**
   * Get suggested alternatives for an integration
   */
  static getAlternatives(integration: string): Alternative[] {
    const support = ToolRegistryService.resolveSupportLevel(integration)
    return support.alternatives || []
  }

  /**
   * Check if an error is recoverable
   */
  static isRecoverableError(error: Error | string): boolean {
    const errorMessage = typeof error === 'string' ? error : error.message
    const classification = ErrorClassifierService.classify(errorMessage, {
      nodeId: '',
      nodeName: '',
      toolkit: ''
    })
    return classification.canAutoRecover
  }

  /**
   * Quick check: Does this integration need API key setup?
   */
  static needsAPIKeySetup(integration: string): boolean {
    const support = ToolRegistryService.resolveSupportLevel(integration)
    return support.level === 'api_key'
  }

  /**
   * Quick check: Is this integration natively supported?
   */
  static isNativelySupported(integration: string): boolean {
    const support = ToolRegistryService.resolveSupportLevel(integration)
    return support.level === 'native'
  }

  /**
   * Get API key setup info for an integration
   */
  static getAPIKeyInfo(integration: string): SupportResolution['apiKeyInfo'] | undefined {
    const support = ToolRegistryService.resolveSupportLevel(integration)
    return support.apiKeyInfo
  }
}

// ================================
// CONVENIENCE HOOKS FOR REACT
// ================================

/**
 * Hook-style function to analyze workflow on mount
 * Returns analysis result and re-analyze function
 */
export function useWorkflowAnalysis(
  nodes: Array<{ integration?: string; name?: string }>,
  userInput?: string
): WorkflowAnalysis {
  return WorkflowIntelligenceService.analyzeWorkflow(nodes, userInput)
}

// ================================
// DEFAULT EXPORT
// ================================

export default WorkflowIntelligenceService
