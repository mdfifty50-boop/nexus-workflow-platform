/**
 * ErrorClassifier.ts
 *
 * Intelligent error classification system that categorizes errors
 * and determines the appropriate recovery action.
 *
 * This service solves Problem 5 from the architecture:
 * - Different errors need different recovery strategies
 * - Users should never see raw technical errors
 * - Auto-recovery where possible, graceful fallback otherwise
 *
 * @NEXUS-FIX-036: ErrorClassifier - Intelligent error recovery - DO NOT REMOVE
 */

import { ToolRegistryService } from './ToolRegistry';
import type { Alternative } from './ToolRegistry';

// ================================
// TYPE DEFINITIONS
// ================================

export type ErrorCategory =
  | 'missing_param'       // Need to collect a parameter
  | 'tool_not_found'      // Tool doesn't exist in Composio
  | 'connection_expired'  // OAuth token expired or revoked
  | 'connection_missing'  // No connection established yet
  | 'rate_limited'        // Too many requests
  | 'api_error'           // External API returned an error
  | 'network_error'       // Network/connectivity issue
  | 'permission_denied'   // User lacks permission
  | 'invalid_param'       // Parameter value is invalid
  | 'quota_exceeded'      // API quota/limit exceeded
  | 'service_unavailable' // External service is down
  | 'timeout'             // Request timed out
  | 'unknown';            // Unexpected error

export interface ClassifiedError {
  category: ErrorCategory;
  message: string;              // User-friendly message
  recoveryAction: RecoveryAction;
  canAutoRecover: boolean;
  retryAfter?: number;          // Seconds until retry (for rate limiting)
  technicalDetails?: string;    // For logging only (never shown to user)
}

export type RecoveryAction =
  | CollectParamAction
  | ShowAlternativesAction
  | ReconnectAction
  | RetryAction
  | SkipNodeAction
  | AbortAction
  | ContactSupportAction;

export interface CollectParamAction {
  type: 'collect_param';
  nodeId: string;
  paramName: string;
  prompt: string;
  inputType?: 'text' | 'email' | 'phone' | 'url' | 'textarea';
  quickAction?: { label: string; value: string };
}

export interface ShowAlternativesAction {
  type: 'show_alternatives';
  nodeId: string;
  requestedTool: string;
  alternatives: Alternative[];
}

export interface ReconnectAction {
  type: 'reconnect';
  toolkit: string;
  message: string;
}

export interface RetryAction {
  type: 'retry';
  delay: number;       // Milliseconds
  maxRetries?: number;
  currentRetry?: number;
}

export interface SkipNodeAction {
  type: 'skip_node';
  nodeId: string;
  reason: string;
}

export interface AbortAction {
  type: 'abort';
  message: string;
}

export interface ContactSupportAction {
  type: 'contact_support';
  errorCode?: string;
  message: string;
}

export interface ExecutionContext {
  nodeId: string;
  nodeName: string;
  toolkit: string;
  toolSlug?: string;
  action?: string;
  currentRetry?: number;
  maxRetries?: number;
}

// ================================
// ERROR PATTERNS
// ================================

/**
 * Patterns to detect missing parameter errors
 */
const MISSING_PARAM_PATTERNS = [
  /missing required param(?:eter)?[s]?:?\s*[`'"]?(\w+)[`'"]?/i,
  /required (?:field|param(?:eter)?)[s]?:?\s*[`'"]?(\w+)[`'"]?/i,
  /param(?:eter)? [`'"]?(\w+)[`'"]? is required/i,
  /[`'"]?(\w+)[`'"]? is (?:a )?required (?:field|param)/i,
  /\[param:(\w+)\]/i,  // Our own marker format from FIX-031
  /no (?:value )?(?:provided|specified) for [`'"]?(\w+)[`'"]?/i
];

/**
 * Patterns to detect tool not found errors
 */
const TOOL_NOT_FOUND_PATTERNS = [
  /tool[s]? not found/i,
  /action[s]? not found/i,
  /unknown tool/i,
  /invalid tool/i,
  /tool does not exist/i,
  /no (?:such )?tool/i,
  /could not find tool/i,
  /unsupported tool/i
];

/**
 * Patterns to detect connection/auth errors
 */
const CONNECTION_PATTERNS = [
  /unauthorized/i,
  /token expired/i,
  /invalid (?:access )?token/i,
  /authentication (?:failed|error|required)/i,
  /401/,
  /403/,
  /not authenticated/i,
  /session expired/i,
  /refresh token/i,
  /oauth error/i,
  /connection expired/i,
  /no (?:active )?connection/i
];

/**
 * Patterns to detect rate limiting
 */
const RATE_LIMIT_PATTERNS = [
  /rate limit/i,
  /too many requests/i,
  /429/,
  /throttl/i,
  /quota exceeded/i,
  /api limit/i,
  /slow down/i
];

/**
 * Patterns to detect network errors
 */
const NETWORK_PATTERNS = [
  /network error/i,
  /connection refused/i,
  /econnrefused/i,
  /enotfound/i,
  /dns/i,
  /timeout/i,
  /timed out/i,
  /socket/i,
  /fetch failed/i,
  /failed to fetch/i
];

/**
 * Patterns to detect permission errors
 */
const PERMISSION_PATTERNS = [
  /permission denied/i,
  /access denied/i,
  /forbidden/i,
  /not authorized/i,
  /insufficient permission/i,
  /scope/i
];

/**
 * Patterns to detect invalid parameter errors
 */
const INVALID_PARAM_PATTERNS = [
  /invalid (?:value|param|argument)/i,
  /validation (?:failed|error)/i,
  /malformed/i,
  /bad request/i,
  /400/,
  /invalid format/i,
  /must be/i,
  /expected/i
];

/**
 * Patterns to detect service unavailable errors
 */
const SERVICE_UNAVAILABLE_PATTERNS = [
  /service unavailable/i,
  /503/,
  /502/,
  /bad gateway/i,
  /temporarily unavailable/i,
  /maintenance/i,
  /down for/i,
  /server error/i,
  /500/
];

// ================================
// USER-FRIENDLY MESSAGES
// ================================

/**
 * Friendly messages for each error category
 */
const FRIENDLY_MESSAGES: Record<ErrorCategory, string> = {
  missing_param: "Need a bit more information to continue...",
  tool_not_found: "Let me find another way to do this...",
  connection_expired: "Need to reconnect to continue...",
  connection_missing: "Let's connect your account first...",
  rate_limited: "Taking a short break, will retry shortly...",
  api_error: "The service returned an error. Let me try again...",
  network_error: "Having trouble connecting. Please check your internet...",
  permission_denied: "Looks like we need additional permissions...",
  invalid_param: "The value entered isn't quite right...",
  quota_exceeded: "You've reached your usage limit for now...",
  service_unavailable: "The service is temporarily unavailable...",
  timeout: "The request took too long. Let me try again...",
  unknown: "Something unexpected happened. Let me try a different approach..."
};

/**
 * Param-specific friendly prompts
 */
const PARAM_FRIENDLY_PROMPTS: Record<string, { prompt: string; inputType: 'text' | 'email' | 'phone' | 'url' | 'textarea' }> = {
  to: { prompt: "Who should receive this?", inputType: 'email' },
  email: { prompt: "What email address?", inputType: 'email' },
  recipient: { prompt: "Who should receive this?", inputType: 'email' },
  phone: { prompt: "What phone number?", inputType: 'phone' },
  phone_number: { prompt: "What phone number?", inputType: 'phone' },
  number: { prompt: "What phone number?", inputType: 'phone' },
  message: { prompt: "What message should I send?", inputType: 'textarea' },
  body: { prompt: "What content should I include?", inputType: 'textarea' },
  text: { prompt: "What text should I use?", inputType: 'textarea' },
  content: { prompt: "What content?", inputType: 'textarea' },
  subject: { prompt: "What should the subject say?", inputType: 'text' },
  channel: { prompt: "Which channel?", inputType: 'text' },
  channel_id: { prompt: "Which channel?", inputType: 'text' },
  path: { prompt: "Where should I save this?", inputType: 'text' },
  folder: { prompt: "Which folder?", inputType: 'text' },
  spreadsheet_id: { prompt: "Which spreadsheet? (paste URL)", inputType: 'url' },
  sheet_id: { prompt: "Which sheet? (paste URL)", inputType: 'url' },
  page_id: { prompt: "Which page? (paste URL)", inputType: 'url' },
  url: { prompt: "What URL?", inputType: 'url' },
  title: { prompt: "What should the title be?", inputType: 'text' },
  name: { prompt: "What name?", inputType: 'text' },
  description: { prompt: "What description?", inputType: 'textarea' },
  notes: { prompt: "Any notes to add?", inputType: 'textarea' }
};

// ================================
// SERVICE CLASS
// ================================

export class ErrorClassifierService {

  /**
   * Classify an error and determine recovery action
   */
  static classify(error: Error | string, context: ExecutionContext): ClassifiedError {
    const errorMessage = typeof error === 'string' ? error : error.message;

    // Try to classify in order of specificity
    return (
      this.checkMissingParam(errorMessage, context) ||
      this.checkToolNotFound(errorMessage, context) ||
      this.checkConnectionError(errorMessage, context) ||
      this.checkRateLimit(errorMessage, context) ||
      this.checkInvalidParam(errorMessage, context) ||
      this.checkPermissionDenied(errorMessage, context) ||
      this.checkNetworkError(errorMessage, context) ||
      this.checkServiceUnavailable(errorMessage, context) ||
      this.checkTimeout(errorMessage, context) ||
      this.fallbackClassification(errorMessage, context)
    );
  }

  /**
   * Check for missing parameter errors
   */
  private static checkMissingParam(
    message: string,
    context: ExecutionContext
  ): ClassifiedError | null {
    for (const pattern of MISSING_PARAM_PATTERNS) {
      const match = message.match(pattern);
      if (match) {
        const paramName = match[1] || 'value';
        const promptInfo = PARAM_FRIENDLY_PROMPTS[paramName.toLowerCase()] ||
                          this.getParamPromptFromRegistry(context.toolkit, paramName) ||
                          { prompt: `What ${paramName.replace(/_/g, ' ')}?`, inputType: 'text' as const };

        return {
          category: 'missing_param',
          message: FRIENDLY_MESSAGES.missing_param,
          recoveryAction: {
            type: 'collect_param',
            nodeId: context.nodeId,
            paramName,
            prompt: promptInfo.prompt,
            inputType: promptInfo.inputType
          },
          canAutoRecover: false,
          technicalDetails: message
        };
      }
    }
    return null;
  }

  /**
   * Check for tool not found errors
   */
  private static checkToolNotFound(
    message: string,
    context: ExecutionContext
  ): ClassifiedError | null {
    if (TOOL_NOT_FOUND_PATTERNS.some(p => p.test(message))) {
      const alternatives = ToolRegistryService.resolveSupportLevel(context.toolkit).alternatives || [];

      return {
        category: 'tool_not_found',
        message: FRIENDLY_MESSAGES.tool_not_found,
        recoveryAction: {
          type: 'show_alternatives',
          nodeId: context.nodeId,
          requestedTool: context.toolkit,
          alternatives: alternatives.length > 0 ? alternatives : [
            { toolkit: 'gmail', name: 'Email', description: 'Send via email instead', confidence: 0.5 }
          ]
        },
        canAutoRecover: false,
        technicalDetails: message
      };
    }
    return null;
  }

  /**
   * Check for connection/auth errors
   */
  private static checkConnectionError(
    message: string,
    context: ExecutionContext
  ): ClassifiedError | null {
    if (CONNECTION_PATTERNS.some(p => p.test(message))) {
      const isExpired = /expired|refresh|revoked/i.test(message);

      return {
        category: isExpired ? 'connection_expired' : 'connection_missing',
        message: FRIENDLY_MESSAGES[isExpired ? 'connection_expired' : 'connection_missing'],
        recoveryAction: {
          type: 'reconnect',
          toolkit: context.toolkit,
          message: isExpired
            ? `Your ${context.toolkit} connection needs to be refreshed.`
            : `Please connect your ${context.toolkit} account to continue.`
        },
        canAutoRecover: true, // Can auto-trigger OAuth
        technicalDetails: message
      };
    }
    return null;
  }

  /**
   * Check for rate limiting errors
   */
  private static checkRateLimit(
    message: string,
    context: ExecutionContext
  ): ClassifiedError | null {
    if (RATE_LIMIT_PATTERNS.some(p => p.test(message))) {
      // Try to extract retry-after
      const retryMatch = message.match(/retry.?after[:\s]*(\d+)/i);
      const retryAfter = retryMatch ? parseInt(retryMatch[1]) : 30;

      return {
        category: 'rate_limited',
        message: FRIENDLY_MESSAGES.rate_limited,
        recoveryAction: {
          type: 'retry',
          delay: retryAfter * 1000,
          maxRetries: 3,
          currentRetry: context.currentRetry || 0
        },
        canAutoRecover: true,
        retryAfter,
        technicalDetails: message
      };
    }
    return null;
  }

  /**
   * Check for invalid parameter errors
   */
  private static checkInvalidParam(
    message: string,
    context: ExecutionContext
  ): ClassifiedError | null {
    if (INVALID_PARAM_PATTERNS.some(p => p.test(message))) {
      // Try to extract which parameter is invalid
      const paramMatch = message.match(/[`'"]?(\w+)[`'"]? (?:is invalid|must be|expected)/i);
      const paramName = paramMatch?.[1];

      if (paramName) {
        const promptInfo = PARAM_FRIENDLY_PROMPTS[paramName.toLowerCase()] ||
                          { prompt: `Please re-enter ${paramName.replace(/_/g, ' ')}`, inputType: 'text' as const };

        return {
          category: 'invalid_param',
          message: FRIENDLY_MESSAGES.invalid_param,
          recoveryAction: {
            type: 'collect_param',
            nodeId: context.nodeId,
            paramName,
            prompt: promptInfo.prompt,
            inputType: promptInfo.inputType
          },
          canAutoRecover: false,
          technicalDetails: message
        };
      }

      return {
        category: 'invalid_param',
        message: FRIENDLY_MESSAGES.invalid_param,
        recoveryAction: {
          type: 'abort',
          message: 'Please check your inputs and try again.'
        },
        canAutoRecover: false,
        technicalDetails: message
      };
    }
    return null;
  }

  /**
   * Check for permission errors
   */
  private static checkPermissionDenied(
    message: string,
    context: ExecutionContext
  ): ClassifiedError | null {
    if (PERMISSION_PATTERNS.some(p => p.test(message))) {
      return {
        category: 'permission_denied',
        message: FRIENDLY_MESSAGES.permission_denied,
        recoveryAction: {
          type: 'reconnect',
          toolkit: context.toolkit,
          message: `We need additional permissions for ${context.toolkit}. Please reconnect to grant access.`
        },
        canAutoRecover: true,
        technicalDetails: message
      };
    }
    return null;
  }

  /**
   * Check for network errors
   */
  private static checkNetworkError(
    message: string,
    context: ExecutionContext
  ): ClassifiedError | null {
    if (NETWORK_PATTERNS.some(p => p.test(message))) {
      return {
        category: 'network_error',
        message: FRIENDLY_MESSAGES.network_error,
        recoveryAction: {
          type: 'retry',
          delay: 3000,
          maxRetries: 3,
          currentRetry: context.currentRetry || 0
        },
        canAutoRecover: true,
        technicalDetails: message
      };
    }
    return null;
  }

  /**
   * Check for service unavailable errors
   */
  private static checkServiceUnavailable(
    message: string,
    context: ExecutionContext
  ): ClassifiedError | null {
    if (SERVICE_UNAVAILABLE_PATTERNS.some(p => p.test(message))) {
      return {
        category: 'service_unavailable',
        message: FRIENDLY_MESSAGES.service_unavailable,
        recoveryAction: {
          type: 'retry',
          delay: 10000,
          maxRetries: 2,
          currentRetry: context.currentRetry || 0
        },
        canAutoRecover: true,
        technicalDetails: message
      };
    }
    return null;
  }

  /**
   * Check for timeout errors
   */
  private static checkTimeout(
    message: string,
    context: ExecutionContext
  ): ClassifiedError | null {
    if (/timeout|timed out/i.test(message)) {
      return {
        category: 'timeout',
        message: FRIENDLY_MESSAGES.timeout,
        recoveryAction: {
          type: 'retry',
          delay: 5000,
          maxRetries: 2,
          currentRetry: context.currentRetry || 0
        },
        canAutoRecover: true,
        technicalDetails: message
      };
    }
    return null;
  }

  /**
   * Fallback classification for unknown errors
   */
  private static fallbackClassification(
    message: string,
    _context: ExecutionContext
  ): ClassifiedError {
    return {
      category: 'unknown',
      message: FRIENDLY_MESSAGES.unknown,
      recoveryAction: {
        type: 'abort',
        message: 'Unable to complete this step. Please try again or contact support.'
      },
      canAutoRecover: false,
      technicalDetails: message
    };
  }

  /**
   * Get param prompt from ToolRegistry
   */
  private static getParamPromptFromRegistry(
    toolkit: string,
    paramName: string
  ): { prompt: string; inputType: 'text' | 'email' | 'phone' | 'url' | 'textarea' } | null {
    const paramDef = ToolRegistryService.getParamPrompt(toolkit, paramName);
    if (!paramDef) return null;

    return {
      prompt: paramDef.friendly,
      inputType: paramDef.type === 'string' ? 'text' :
                 paramDef.type === 'textarea' ? 'textarea' :
                 paramDef.type as 'text' | 'email' | 'phone' | 'url' | 'textarea'
    };
  }

  /**
   * Determine if error should trigger auto-retry
   */
  static shouldAutoRetry(classified: ClassifiedError): boolean {
    if (!classified.canAutoRecover) return false;

    if (classified.recoveryAction.type === 'retry') {
      const { currentRetry = 0, maxRetries = 3 } = classified.recoveryAction;
      return currentRetry < maxRetries;
    }

    return false;
  }

  /**
   * Get the delay before retrying
   */
  static getRetryDelay(classified: ClassifiedError): number {
    if (classified.recoveryAction.type === 'retry') {
      return classified.recoveryAction.delay;
    }
    return 0;
  }

  /**
   * Quick check if error is recoverable
   */
  static isRecoverable(error: Error | string, context: ExecutionContext): boolean {
    const classified = this.classify(error, context);
    return classified.category !== 'unknown' && classified.category !== 'api_error';
  }

  /**
   * Get user-friendly message for any error
   */
  static getFriendlyMessage(error: Error | string, context: ExecutionContext): string {
    const classified = this.classify(error, context);
    return classified.message;
  }
}

export default ErrorClassifierService;
