/**
 * OpenAI Codex Integration Service
 *
 * Supplements Claude with fast, cheap code generation for repetitive tasks.
 * Uses the OpenAI Responses API with codex-mini-latest model.
 *
 * USE CASES:
 * - code-completion: Boilerplate, interfaces, CRUD patterns
 * - code-review-assist: Quick static analysis for Ralph QA
 * - test-generation: Unit test scaffolding from function signatures
 * - documentation-generation: JSDoc/TSDoc from implementations
 *
 * ROUTING:
 * - Codex: Boilerplate, tests, docs, simple refactoring, pattern completion
 * - Claude: Complex logic, architecture, multi-file refactoring, domain knowledge
 *
 * FALLBACK: If Codex is unavailable, gracefully falls back to Claude via claudeProxy.
 *
 * Config: nexus/config/codex-integration.json
 */

import { callClaude } from './claudeProxy.js'

// =============================================================================
// TYPES
// =============================================================================

export type CodexUseCase =
  | 'code-completion'
  | 'code-review-assist'
  | 'test-generation'
  | 'documentation-generation'

export interface CodexRequest {
  useCase: CodexUseCase
  input: string
  context?: string
  maxTokens?: number
  temperature?: number
}

export interface CodexResponse {
  text: string
  model: string
  provider: 'codex' | 'claude-fallback'
  tokensUsed?: number
  durationMs: number
}

interface CodexUseCaseConfig {
  model: string
  maxTokens: number
  temperature: number
  description: string
}

interface ResponsesAPIOutput {
  type: string
  content?: Array<{ type: string; text?: string }>
  text?: string
}

interface ResponsesAPIResponse {
  id: string
  output: ResponsesAPIOutput[]
  usage?: { input_tokens: number; output_tokens: number }
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const CODEX_ENDPOINT = 'https://api.openai.com/v1/responses'
const DEFAULT_MODEL = process.env.CODEX_MODEL || 'codex-mini-latest'
const CODEX_ENABLED = process.env.CODEX_ENABLED !== 'false'
const CODEX_API_KEY = process.env.OPENAI_CODEX_API_KEY || process.env.OPENAI_API_KEY

const USE_CASE_CONFIG: Record<CodexUseCase, CodexUseCaseConfig> = {
  'code-completion': {
    model: DEFAULT_MODEL,
    maxTokens: 4096,
    temperature: 0.2,
    description: 'Fast code completions for boilerplate and repetitive patterns',
  },
  'code-review-assist': {
    model: DEFAULT_MODEL,
    maxTokens: 2048,
    temperature: 0.1,
    description: 'Quick static analysis and pattern detection',
  },
  'test-generation': {
    model: DEFAULT_MODEL,
    maxTokens: 4096,
    temperature: 0.3,
    description: 'Generate unit test boilerplate from function signatures',
  },
  'documentation-generation': {
    model: DEFAULT_MODEL,
    maxTokens: 2048,
    temperature: 0.2,
    description: 'Generate JSDoc/TSDoc from function implementations',
  },
}

// System prompts per use case
const USE_CASE_PROMPTS: Record<CodexUseCase, string> = {
  'code-completion': [
    'You are a code completion assistant. Generate clean, idiomatic TypeScript code.',
    'Follow existing patterns in the codebase. Use proper types, no `any`.',
    'Only output the code, no explanations unless the user asks.',
  ].join(' '),

  'code-review-assist': [
    'You are a code review assistant. Analyze code for:',
    '- Potential bugs and edge cases',
    '- Type safety issues',
    '- Performance concerns',
    '- Security vulnerabilities (OWASP top 10)',
    '- React anti-patterns (if applicable)',
    'Be concise. List issues with severity (high/medium/low) and line references.',
  ].join(' '),

  'test-generation': [
    'You are a test generation assistant. Generate unit tests using Vitest syntax.',
    'Include: happy path, edge cases, error cases, and boundary conditions.',
    'Use describe/it blocks. Mock external dependencies.',
    'Only output the test code, ready to run.',
  ].join(' '),

  'documentation-generation': [
    'You are a documentation generator. Produce JSDoc/TSDoc comments.',
    'Include: @param, @returns, @throws, @example where appropriate.',
    'Keep descriptions concise but complete. Match existing doc style.',
    'Only output the documented code, no extra commentary.',
  ].join(' '),
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

let codexAvailable: boolean | null = null
let lastHealthCheck = 0
const HEALTH_CHECK_INTERVAL = 60_000 // 1 minute

async function checkCodexHealth(): Promise<boolean> {
  if (!CODEX_API_KEY) return false
  if (!CODEX_ENABLED) return false

  const now = Date.now()
  if (codexAvailable !== null && now - lastHealthCheck < HEALTH_CHECK_INTERVAL) {
    return codexAvailable
  }

  try {
    const res = await fetch(CODEX_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CODEX_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        input: 'return 1',
        max_output_tokens: 16,
      }),
      signal: AbortSignal.timeout(10_000),
    })

    codexAvailable = res.ok
    lastHealthCheck = now
    if (!res.ok) {
      console.warn(`[CodexService] Health check failed: ${res.status} ${res.statusText}`)
    }
    return codexAvailable
  } catch (err) {
    codexAvailable = false
    lastHealthCheck = now
    console.warn('[CodexService] Health check error:', (err as Error).message)
    return false
  }
}

// =============================================================================
// CORE: Call Codex Responses API
// =============================================================================

async function callCodexAPI(
  useCase: CodexUseCase,
  input: string,
  context?: string,
  overrides?: { maxTokens?: number; temperature?: number }
): Promise<{ text: string; tokensUsed?: number }> {
  const config = USE_CASE_CONFIG[useCase]
  const systemPrompt = USE_CASE_PROMPTS[useCase]

  const fullInput = context
    ? `${systemPrompt}\n\nContext:\n${context}\n\nTask:\n${input}`
    : `${systemPrompt}\n\nTask:\n${input}`

  const res = await fetch(CODEX_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CODEX_API_KEY}`,
    },
    body: JSON.stringify({
      model: config.model,
      input: fullInput,
      max_output_tokens: overrides?.maxTokens ?? config.maxTokens,
      temperature: overrides?.temperature ?? config.temperature,
    }),
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Codex API error ${res.status}: ${body}`)
  }

  const data: ResponsesAPIResponse = await res.json()

  // Extract text from Responses API output format
  let text = ''
  for (const output of data.output) {
    if (output.type === 'message' && output.content) {
      for (const block of output.content) {
        if (block.type === 'output_text' && block.text) {
          text += block.text
        }
      }
    }
  }

  const tokensUsed = data.usage
    ? data.usage.input_tokens + data.usage.output_tokens
    : undefined

  return { text: text.trim(), tokensUsed }
}

// =============================================================================
// FALLBACK: Route to Claude when Codex unavailable
// =============================================================================

async function fallbackToClaude(
  useCase: CodexUseCase,
  input: string,
  context?: string
): Promise<{ text: string }> {
  const systemPrompt = USE_CASE_PROMPTS[useCase]
  const config = USE_CASE_CONFIG[useCase]

  const userMessage = context
    ? `Context:\n${context}\n\nTask:\n${input}`
    : input

  const result = await callClaude({
    systemPrompt,
    userMessage,
    maxTokens: config.maxTokens,
  })

  return { text: result.text }
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Execute a Codex request. Falls back to Claude if Codex is unavailable.
 */
export async function executeCodex(request: CodexRequest): Promise<CodexResponse> {
  const start = Date.now()
  const isHealthy = await checkCodexHealth()

  if (isHealthy) {
    try {
      const result = await callCodexAPI(
        request.useCase,
        request.input,
        request.context,
        { maxTokens: request.maxTokens, temperature: request.temperature }
      )

      return {
        text: result.text,
        model: USE_CASE_CONFIG[request.useCase].model,
        provider: 'codex',
        tokensUsed: result.tokensUsed,
        durationMs: Date.now() - start,
      }
    } catch (err) {
      console.warn(
        `[CodexService] Codex failed for ${request.useCase}, falling back to Claude:`,
        (err as Error).message
      )
      // Fall through to Claude fallback
    }
  }

  // Fallback to Claude
  const result = await fallbackToClaude(
    request.useCase,
    request.input,
    request.context
  )

  return {
    text: result.text,
    model: 'claude-fallback',
    provider: 'claude-fallback',
    durationMs: Date.now() - start,
  }
}

/**
 * Generate code completion (boilerplate, interfaces, CRUD patterns).
 */
export async function completeCode(
  input: string,
  context?: string
): Promise<CodexResponse> {
  return executeCodex({ useCase: 'code-completion', input, context })
}

/**
 * Run quick code review / static analysis.
 */
export async function reviewCode(
  code: string,
  context?: string
): Promise<CodexResponse> {
  return executeCodex({ useCase: 'code-review-assist', input: code, context })
}

/**
 * Generate unit test boilerplate from function signatures.
 */
export async function generateTests(
  code: string,
  context?: string
): Promise<CodexResponse> {
  return executeCodex({ useCase: 'test-generation', input: code, context })
}

/**
 * Generate JSDoc/TSDoc documentation from implementations.
 */
export async function generateDocs(
  code: string,
  context?: string
): Promise<CodexResponse> {
  return executeCodex({ useCase: 'documentation-generation', input: code, context })
}

/**
 * Check if Codex is enabled and reachable.
 */
export async function isCodexAvailable(): Promise<boolean> {
  return checkCodexHealth()
}

/**
 * Get service status for monitoring/debugging.
 */
export function getCodexStatus(): {
  enabled: boolean
  apiKeyConfigured: boolean
  lastHealthy: boolean | null
  model: string
} {
  return {
    enabled: CODEX_ENABLED,
    apiKeyConfigured: !!CODEX_API_KEY,
    lastHealthy: codexAvailable,
    model: DEFAULT_MODEL,
  }
}
