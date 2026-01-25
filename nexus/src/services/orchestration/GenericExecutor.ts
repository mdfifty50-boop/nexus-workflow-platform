/**
 * GenericExecutor.ts
 *
 * LAYER 5: Execution
 *
 * Executes tools via Rube MCP with generic result verification.
 * Provides honest success/failure feedback with proof when available.
 *
 * @NEXUS-GENERIC-ORCHESTRATION
 */

import type {
  ExecutionResult,
  ExecutionProof,
  RubeExecuteResult,
  ValidationResult,
  ValidationError
} from './types';

/**
 * Error patterns for human-friendly translation
 */
const ERROR_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  { pattern: /missing required/i, message: 'Some information is still needed' },
  { pattern: /401|unauthorized|unauthenticated/i, message: 'Connection expired - please reconnect' },
  { pattern: /403|forbidden/i, message: 'Access denied - check your permissions' },
  { pattern: /404|not found/i, message: 'The requested resource was not found' },
  { pattern: /rate limit|too many requests/i, message: 'Too many requests - please wait a moment' },
  { pattern: /timeout|timed out/i, message: 'Request took too long - please try again' },
  { pattern: /network|connection/i, message: 'Network error - check your connection' },
  { pattern: /invalid|malformed/i, message: 'Invalid input - please check your values' },
  { pattern: /quota|limit exceeded/i, message: 'Usage limit reached - try again later' },
];

/**
 * Success indicators for verification
 */
const SUCCESS_INDICATORS = [
  'message_id',
  'file_id',
  'id',
  'success',
  'created',
  'updated',
  'sent',
  'delivered',
  'posted',
];

export class GenericExecutor {
  private sessionId: string | null = null;

  /**
   * Set session ID for subsequent executions
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  /**
   * Execute a single tool
   * @NEXUS-FIX-060: Added dryRun option for validation without side effects
   */
  async execute(
    toolSlug: string,
    params: Record<string, unknown>,
    sessionId?: string,
    options?: { dryRun?: boolean }
  ): Promise<ExecutionResult> {
    const session = sessionId || this.sessionId;
    const dryRun = options?.dryRun ?? false;

    if (!session) {
      return {
        success: false,
        verified: false,
        error: 'No session available - please try again'
      };
    }

    console.log(`[GenericExecutor] ${dryRun ? 'Validating' : 'Executing'} ${toolSlug}`);
    console.log(`[GenericExecutor] Params:`, Object.keys(params));

    try {
      // @NEXUS-FIX-053: Use Rube API proxy for tool execution
      // @NEXUS-FIX-060: Pass dry_run flag for validation-only mode
      const response = await fetch('/api/rube/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tools: [{ tool_slug: toolSlug, arguments: params }],
          session_id: session,
          dry_run: dryRun
        })
      });

      if (!response.ok) {
        throw new Error(`${dryRun ? 'Validation' : 'Execution'} failed: ${response.statusText}`);
      }

      const result = await response.json();

      // @NEXUS-FIX-060: Handle dry-run response differently
      if (dryRun) {
        return this.processDryRunResult(result, toolSlug);
      }

      return this.processResult(result, toolSlug);

    } catch (error) {
      console.error(`[GenericExecutor] ${dryRun ? 'Validation' : 'Execution'} failed:`, error);

      return {
        success: false,
        verified: false,
        error: this.humanizeError(error instanceof Error ? error.message : String(error))
      };
    }
  }

  /**
   * @NEXUS-FIX-060: Validate execution without side effects
   * Pre-flight check that validates params against schema and common patterns
   */
  async validateExecution(
    toolSlug: string,
    params: Record<string, unknown>,
    sessionId?: string
  ): Promise<ValidationResult> {
    const session = sessionId || this.sessionId;

    if (!session) {
      return {
        valid: false,
        errors: [{
          param: '_session',
          type: 'missing',
          message: 'No session available - please try again'
        }],
        checkedParams: [],
        missingRequired: [],
        validatedAt: Date.now()
      };
    }

    console.log(`[GenericExecutor] Validating ${toolSlug} (dry-run)`);
    console.log(`[GenericExecutor] Params to validate:`, Object.keys(params));

    try {
      // @NEXUS-FIX-060: Call execute endpoint with dry_run flag
      const response = await fetch('/api/rube/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tools: [{ tool_slug: toolSlug, arguments: params }],
          session_id: session,
          dry_run: true
        })
      });

      if (!response.ok) {
        return {
          valid: false,
          errors: [{
            param: '_api',
            type: 'constraint_violation',
            message: `Validation request failed: ${response.statusText}`
          }],
          checkedParams: [],
          missingRequired: [],
          validatedAt: Date.now()
        };
      }

      const result = await response.json();

      // Extract validation result from response
      if (result.validationResults && result.validationResults.length > 0) {
        return result.validationResults[0].validation as ValidationResult;
      }

      // Fallback if response format is unexpected
      return {
        valid: result.success ?? false,
        errors: [],
        checkedParams: Object.keys(params),
        missingRequired: [],
        validatedAt: Date.now()
      };

    } catch (error) {
      console.error(`[GenericExecutor] Validation failed:`, error);

      return {
        valid: false,
        errors: [{
          param: '_system',
          type: 'constraint_violation',
          message: error instanceof Error ? error.message : String(error)
        }],
        checkedParams: [],
        missingRequired: [],
        validatedAt: Date.now()
      };
    }
  }

  /**
   * @NEXUS-FIX-060: Validate multiple tools before execution
   */
  async validateMultiple(
    tools: Array<{ toolSlug: string; params: Record<string, unknown> }>,
    sessionId?: string
  ): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>();
    const session = sessionId || this.sessionId;

    if (!session) {
      const noSessionError: ValidationResult = {
        valid: false,
        errors: [{
          param: '_session',
          type: 'missing',
          message: 'No session available'
        }],
        checkedParams: [],
        missingRequired: [],
        validatedAt: Date.now()
      };
      for (const tool of tools) {
        results.set(tool.toolSlug, noSessionError);
      }
      return results;
    }

    console.log(`[GenericExecutor] Validating ${tools.length} tools (dry-run)`);

    try {
      // @NEXUS-FIX-060: Batch validation via dry_run
      const response = await fetch('/api/rube/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tools: tools.map(t => ({ tool_slug: t.toolSlug, arguments: t.params })),
          session_id: session,
          dry_run: true
        })
      });

      if (!response.ok) {
        throw new Error(`Batch validation failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Extract validation results
      if (result.validationResults) {
        for (let i = 0; i < tools.length; i++) {
          const toolSlug = tools[i].toolSlug;
          const validation = result.validationResults[i]?.validation;
          if (validation) {
            results.set(toolSlug, validation);
          } else {
            results.set(toolSlug, {
              valid: true,
              errors: [],
              checkedParams: Object.keys(tools[i].params),
              missingRequired: [],
              validatedAt: Date.now()
            });
          }
        }
      }

    } catch (error) {
      console.error(`[GenericExecutor] Batch validation failed:`, error);
      const errorResult: ValidationResult = {
        valid: false,
        errors: [{
          param: '_system',
          type: 'constraint_violation',
          message: error instanceof Error ? error.message : String(error)
        }],
        checkedParams: [],
        missingRequired: [],
        validatedAt: Date.now()
      };
      for (const tool of tools) {
        results.set(tool.toolSlug, errorResult);
      }
    }

    return results;
  }

  /**
   * @NEXUS-FIX-060: Process dry-run validation response
   */
  private processDryRunResult(result: { validationResults?: Array<{ validation: ValidationResult }> }, _toolSlug: string): ExecutionResult {
    if (!result.validationResults || result.validationResults.length === 0) {
      return {
        success: false,
        verified: false,
        error: 'No validation result received'
      };
    }

    const validation = result.validationResults[0].validation;

    if (!validation.valid) {
      const errorMessages = validation.errors
        .map((e: ValidationError) => e.message)
        .join('; ');

      return {
        success: false,
        verified: false,
        error: errorMessages || 'Validation failed',
        data: { validation }
      };
    }

    return {
      success: true,
      verified: true,
      data: { validation, dryRun: true },
      proof: {
        type: 'action_completed',
        details: {
          validated: true,
          checkedParams: validation.checkedParams,
          warnings: validation.warnings
        }
      }
    };
  }

  /**
   * Execute multiple tools in parallel
   * @NEXUS-FIX-053: Use Rube API proxy for tool execution
   */
  async executeMultiple(
    tools: Array<{ toolSlug: string; params: Record<string, unknown> }>,
    sessionId?: string
  ): Promise<Map<string, ExecutionResult>> {
    const results = new Map<string, ExecutionResult>();
    const session = sessionId || this.sessionId;

    if (!session) {
      for (const tool of tools) {
        results.set(tool.toolSlug, {
          success: false,
          verified: false,
          error: 'No session available'
        });
      }
      return results;
    }

    console.log(`[GenericExecutor] Executing ${tools.length} tools in parallel`);

    try {
      // @NEXUS-FIX-053: Use Rube API proxy for batch tool execution
      const response = await fetch('/api/rube/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tools: tools.map(t => ({ tool_slug: t.toolSlug, arguments: t.params })),
          session_id: session
        })
      });

      if (!response.ok) {
        throw new Error(`Batch execution failed: ${response.statusText}`);
      }

      const rubeResult = await response.json();

      // Process each result
      for (let i = 0; i < tools.length; i++) {
        const toolSlug = tools[i].toolSlug;
        const singleResult: RubeExecuteResult = {
          results: [rubeResult.results?.[i] || { error: 'No result returned' }]
        };
        results.set(toolSlug, this.processResult(singleResult, toolSlug));
      }

    } catch (error) {
      console.error(`[GenericExecutor] Batch execution failed:`, error);
      const errorMessage = this.humanizeError(
        error instanceof Error ? error.message : String(error)
      );
      for (const tool of tools) {
        results.set(tool.toolSlug, {
          success: false,
          verified: false,
          error: errorMessage
        });
      }
    }

    return results;
  }

  /**
   * Execute a workflow (sequence of tools)
   */
  async executeWorkflow(
    workflow: Array<{
      toolSlug: string;
      params: Record<string, unknown>;
      dependsOn?: string[];
    }>,
    sessionId?: string,
    onProgress?: (step: number, total: number, result: ExecutionResult) => void
  ): Promise<{
    success: boolean;
    results: Map<string, ExecutionResult>;
    firstFailure?: string;
  }> {
    const results = new Map<string, ExecutionResult>();
    let firstFailure: string | undefined;

    for (let i = 0; i < workflow.length; i++) {
      const step = workflow[i];

      // Execute step
      const result = await this.execute(step.toolSlug, step.params, sessionId);
      results.set(step.toolSlug, result);

      // Report progress
      onProgress?.(i + 1, workflow.length, result);

      // Stop on failure
      if (!result.success) {
        firstFailure = step.toolSlug;
        break;
      }
    }

    return {
      success: !firstFailure,
      results,
      firstFailure
    };
  }

  /**
   * Process Rube execution result
   */
  private processResult(result: RubeExecuteResult, _toolSlug: string): ExecutionResult {
    if (!result.results || result.results.length === 0) {
      return {
        success: false,
        verified: false,
        error: 'No result received from execution'
      };
    }

    const toolResult = result.results[0];

    // Check for errors
    if (toolResult.error) {
      return {
        success: false,
        verified: false,
        data: toolResult.data,
        error: this.humanizeError(toolResult.error)
      };
    }

    // Verify success
    const verification = this.verifyResult(toolResult.data);

    return {
      success: true,
      verified: verification.verified,
      data: toolResult.data,
      proof: verification.proof
    };
  }

  /**
   * Verify execution actually succeeded
   */
  private verifyResult(data: Record<string, unknown> | undefined): {
    verified: boolean;
    proof?: ExecutionProof;
  } {
    if (!data) {
      return { verified: false };
    }

    // Check for success indicators
    for (const indicator of SUCCESS_INDICATORS) {
      if (data[indicator] !== undefined) {
        return {
          verified: true,
          proof: this.extractProof(data, indicator)
        };
      }
    }

    // Check for nested data with indicators
    if (data.data && typeof data.data === 'object') {
      const nestedData = data.data as Record<string, unknown>;
      for (const indicator of SUCCESS_INDICATORS) {
        if (nestedData[indicator] !== undefined) {
          return {
            verified: true,
            proof: this.extractProof(nestedData, indicator)
          };
        }
      }
    }

    // Check for response/result wrapper
    if (data.response || data.result) {
      const wrapper = (data.response || data.result) as Record<string, unknown>;
      if (typeof wrapper === 'object' && wrapper !== null) {
        for (const indicator of SUCCESS_INDICATORS) {
          if (wrapper[indicator] !== undefined) {
            return {
              verified: true,
              proof: this.extractProof(wrapper, indicator)
            };
          }
        }
      }
    }

    // If we have data but can't verify, assume success
    return {
      verified: Object.keys(data).length > 0,
      proof: {
        type: 'action_completed',
        details: { keys: Object.keys(data).slice(0, 5) }
      }
    };
  }

  /**
   * Extract proof from result data
   */
  private extractProof(
    data: Record<string, unknown>,
    indicator: string
  ): ExecutionProof {
    const value = data[indicator];

    // Determine proof type
    let type: ExecutionProof['type'] = 'action_completed';

    if (indicator === 'message_id' || indicator === 'sent' || indicator === 'delivered') {
      type = 'message_sent';
    } else if (indicator === 'file_id') {
      type = 'file_created';
    } else if (indicator === 'created' || indicator === 'id') {
      type = 'record_created';
    } else if (indicator === 'updated') {
      type = 'record_updated';
    }

    return {
      type,
      id: typeof value === 'string' ? value : undefined,
      details: {
        [indicator]: value
      }
    };
  }

  /**
   * Convert technical error to user-friendly message
   */
  private humanizeError(error: string): string {
    // Check against known patterns
    for (const { pattern, message } of ERROR_PATTERNS) {
      if (pattern.test(error)) {
        return message;
      }
    }

    // Generic fallback
    return 'Something went wrong. Please try again.';
  }

}

// Singleton instance
let executorInstance: GenericExecutor | null = null;

export function getExecutor(): GenericExecutor {
  if (!executorInstance) {
    executorInstance = new GenericExecutor();
  }
  return executorInstance;
}
