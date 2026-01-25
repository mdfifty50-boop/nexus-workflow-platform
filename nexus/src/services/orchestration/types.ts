/**
 * Generic Orchestration Types
 *
 * Shared type definitions for the 5-layer orchestration system.
 * These types enable Nexus to work with ANY of Rube's 500+ tools
 * without hardcoding tool-specific knowledge.
 *
 * @NEXUS-GENERIC-ORCHESTRATION
 */

// ============================================================
// LAYER 1: Tool Discovery Types
// ============================================================

export interface ToolDiscoveryResult {
  tools: DiscoveredTool[];
  sessionId: string;
  timestamp: number;
}

export interface DiscoveredTool {
  slug: string;           // e.g., "GMAIL_SEND_EMAIL"
  name: string;           // e.g., "Send Email"
  description: string;    // e.g., "Sends an email via Gmail"
  toolkit: string;        // e.g., "gmail"
}

// ============================================================
// LAYER 2: Schema Types
// ============================================================

export interface ToolSchema {
  slug: string;
  toolkit: string;
  name: string;
  description: string;
  properties: Record<string, ParamSchema>;
  required: string[];
}

export interface ParamSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: string[];
  default?: unknown;
}

export interface CachedSchema {
  schema: ToolSchema;
  timestamp: number;
}

// ============================================================
// LAYER 3: UX Translation Types
// ============================================================

export type InputType = 'text' | 'email' | 'phone' | 'url' | 'textarea' | 'select' | 'number';

export interface QuickAction {
  label: string;
  value: string;
}

export interface AutoResolveConfig {
  lookupTool: string;       // e.g., "SLACK_LIST_CHANNELS"
  searchField?: string;     // e.g., "name"
  returnField?: string;     // e.g., "id"
}

export interface UXTranslation {
  displayName: string;      // User-friendly: "Spreadsheet"
  prompt: string;           // "Which Spreadsheet?"
  inputType: InputType;
  placeholder?: string;
  quickActions?: QuickAction[];
  autoResolve?: AutoResolveConfig;
  validators?: Array<(value: string) => boolean>;
}

export interface UXPattern {
  match: RegExp;
  displayName: (match: RegExpMatchArray, paramName: string) => string;
  prompt: (match: RegExpMatchArray, paramName: string) => string;
  inputType: InputType;
  placeholder?: string;
  quickActions?: QuickAction[];
  autoResolve?: (match: RegExpMatchArray, toolkit: string) => AutoResolveConfig;
}

// ============================================================
// LAYER 4: Param Collection Types
// ============================================================

export type CollectionState = 'PENDING' | 'COLLECTING' | 'COMPLETE';

export interface CollectionQuestion {
  id: string;
  paramName: string;
  displayName: string;
  prompt: string;
  inputType: InputType;
  placeholder?: string;
  quickActions?: QuickAction[];
  autoResolve?: AutoResolveConfig;
  answered: boolean;
  value?: string;
}

export interface CollectionProgress {
  state: CollectionState;
  totalQuestions: number;
  answeredQuestions: number;
  currentQuestion: CollectionQuestion | null;
}

// ============================================================
// LAYER 5: Execution Types
// ============================================================

export interface ExecutionResult {
  success: boolean;
  verified: boolean;
  data?: Record<string, unknown>;
  error?: string;
  proof?: ExecutionProof;
}

export interface ExecutionProof {
  type: 'message_sent' | 'file_created' | 'record_created' | 'record_updated' | 'action_completed';
  id?: string;
  details?: Record<string, unknown>;
}

// ============================================================
// Rube MCP Response Types (from actual API)
// ============================================================

export interface RubeSearchResult {
  session_id: string;
  tools: Array<{
    tool_slug: string;
    name: string;
    description: string;
    toolkit?: string;
    input_schema?: Record<string, unknown>;
  }>;
}

export interface RubeSchemaResult {
  schemas: Array<{
    tool_slug: string;
    input_schema: {
      type: string;
      properties: Record<string, {
        type: string;
        description?: string;
        enum?: string[];
        default?: unknown;
      }>;
      required?: string[];
    };
  }>;
}

export interface RubeExecuteResult {
  results: Array<{
    tool_slug: string;
    data?: Record<string, unknown>;
    error?: string;
  }>;
}

// ============================================================
// Orchestration Service Interface
// ============================================================

export interface OrchestrationContext {
  sessionId: string;
  userId?: string;
  userEmail?: string;
}

export interface OrchestrationResult {
  toolSlug: string;
  params: Record<string, unknown>;
  execution: ExecutionResult;
}

// ============================================================
// LAYER 5b: Dry-Run Validation Types
// @NEXUS-FIX-060: Dry-run capability for pre-flight validation
// ============================================================

export interface ValidationError {
  param: string;
  type: 'missing' | 'invalid_type' | 'invalid_format' | 'constraint_violation';
  message: string;
  expected?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings?: string[];
  checkedParams: string[];
  missingRequired: string[];
  validatedAt: number;
}
