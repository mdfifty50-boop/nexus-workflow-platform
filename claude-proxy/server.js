/**
 * Claude Code Proxy Server v4 — Max Plan Native + Process Pre-Warming
 *
 * Routes API calls through Claude Code CLI to use your Max Plan ($0).
 * Pre-spawns CLI processes so they're already initialized when requests arrive.
 *
 * Performance:
 *   ~2.5s pre-warmed via Max plan (FREE) — 0s init + 2.5s API
 *   ~5s   cold spawn via Max plan (FREE) — 2.5s init + 2.5s API
 *   ~2-3s fallback via API key (PAID) — only if CLI fails
 *
 * Endpoints:
 *   POST /api/chat   - Send a prompt, get Claude response
 *   POST /api/bmad   - BMAD agent calls
 *   GET  /health     - Health check + pool status + rate limit info
 */

import express from 'express'
import cors from 'cors'
import { spawn } from 'child_process'
import { randomUUID } from 'crypto'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Configuration ───────────────────────────────────────────────

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const DEFAULT_MODEL = 'claude-sonnet-4-20250514'
const CLI_TIMEOUT_MS = 45000
const MAX_CONCURRENT = 3
const POOL_SIZE = 3         // Total pre-warmed processes (2 sonnet + 1 haiku)
const HAIKU_MODEL = 'claude-haiku-4-5-20251001'
const POOL_MAX_AGE_MS = 300000  // 5 min max age before recycling
const POOL_READY_MS = 3000     // Time to consider process "warm" (past init)
const SANDBOX_DIR = 'C:/tmp/claude-proxy-sandbox'  // Isolated dir — no CLAUDE.md ancestry

// Model alias resolution — backends may send short names like 'claude-sonnet-4-6'
// but the CLI and pool use full IDs like 'claude-sonnet-4-20250514'
const MODEL_ALIASES = {
  'claude-sonnet-4-6':   'claude-sonnet-4-20250514',
  'claude-sonnet-4.6':   'claude-sonnet-4-20250514',
  'claude-sonnet-4':     'claude-sonnet-4-20250514',
  'claude-haiku-4-5':    'claude-haiku-4-5-20251001',
  'claude-haiku-4.5':    'claude-haiku-4-5-20251001',
  'claude-opus-4-6':     'claude-opus-4-20250514',
  'claude-opus-4.6':     'claude-opus-4-20250514',
  'claude-opus-4':       'claude-opus-4-20250514',
}

function normalizeModel(model) {
  return MODEL_ALIASES[model] || model
}

// ── Utility Functions ───────────────────────────────────────────

function loadApiKey() {
  const envPaths = [
    resolve(__dirname, '../nexus/.env'),
    resolve(__dirname, '.env'),
  ]
  for (const envPath of envPaths) {
    try {
      const content = readFileSync(envPath, 'utf-8')
      const match = content.match(/^ANTHROPIC_API_KEY=(.+)$/m)
      if (match) return match[1].trim()
    } catch { /* skip */ }
  }
  return process.env.ANTHROPIC_API_KEY || null
}

/**
 * Build a clean environment for Claude Code subprocess.
 * Removes CLAUDECODE and CLAUDE_CODE_ENTRYPOINT to prevent
 * "cannot be launched inside another Claude Code session" error.
 */
function getCleanEnv() {
  const env = { ...process.env }
  delete env.CLAUDECODE
  delete env.CLAUDE_CODE_ENTRYPOINT
  delete env.ANTHROPIC_API_KEY
  return env
}

// ── Stream-JSON Output Parser ────────────────────────────────────

/**
 * Parse NDJSON stream-json output from Claude CLI.
 * Extracts text, usage, rate limit info, and timing.
 */
function parseStreamJsonOutput(stdout) {
  const lines = stdout.trim().split('\n')
  let text = ''
  let inputTokens = 0
  let outputTokens = 0
  let model = ''
  let apiDuration = 0
  let rateLimitInfo = null
  let sessionId = ''

  for (const line of lines) {
    if (!line.trim()) continue
    try {
      const msg = JSON.parse(line)

      if (msg.type === 'rate_limit_event' && msg.rate_limit_info) {
        rateLimitInfo = msg.rate_limit_info
      }

      if (msg.type === 'result') {
        text = msg.result || text
        inputTokens = msg.usage?.input_tokens || 0
        outputTokens = msg.usage?.output_tokens || 0
        apiDuration = msg.duration_api_ms || 0
        model = Object.keys(msg.modelUsage || {})[0] || ''
        sessionId = msg.session_id || ''
      }
    } catch { /* skip non-JSON lines */ }
  }

  return { text, inputTokens, outputTokens, model, apiDuration, rateLimitInfo, sessionId }
}

// ── Process Pool (Pre-Warming) ──────────────────────────────────

/**
 * Maintains a pool of pre-spawned Claude CLI processes.
 * Each process is initialized with stream-json I/O and waits on stdin.
 * When a request arrives, grab a warm process (skip init overhead).
 */
class ProcessPool {
  constructor(size = POOL_SIZE, defaultModel = DEFAULT_MODEL) {
    this.size = size
    this.defaultModel = defaultModel
    this.pool = []        // { child, spawnedAt, model, alive }
    this.warming = 0
    this.totalSpawned = 0
    this.totalAcquired = 0
    this.totalExpired = 0
    this.totalErrors = 0

    // Start filling
    this.fill()

    // Periodic cleanup of stale processes
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000)
  }

  fill() {
    // Target: 2 sonnet + 1 haiku
    const sonnetCount = this.pool.filter(p => p.model === this.defaultModel && p.alive).length
    const haikuCount = this.pool.filter(p => p.model === HAIKU_MODEL && p.alive).length

    const sonnetNeeded = Math.max(0, 2 - sonnetCount - this.warming)
    const haikuNeeded = Math.max(0, 1 - haikuCount)

    for (let i = 0; i < sonnetNeeded; i++) {
      this.spawnOne(this.defaultModel)
    }
    for (let i = 0; i < haikuNeeded; i++) {
      this.spawnOne(HAIKU_MODEL)
    }
  }

  spawnOne(model) {
    this.warming++
    this.totalSpawned++

    const child = spawn('claude', [
      '-p',
      '--input-format', 'stream-json',
      '--output-format', 'stream-json',
      '--verbose',
      '--model', model,
      '--tools', '',         // Disable all tools — saves ~20K tokens per request
      '--dangerously-skip-permissions',
      '--no-session-persistence',
      '--strict-mcp-config',
    ], {
      env: getCleanEnv(),
      cwd: SANDBOX_DIR,  // Isolated dir — prevents CLAUDE.md context injection
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    })

    const entry = { child, spawnedAt: Date.now(), model, alive: true }

    child.on('error', () => {
      entry.alive = false
      this.warming--
      this.totalErrors++
      this.pool = this.pool.filter(p => p !== entry)
    })

    // If child exits while still in pool (before being acquired), remove it
    child.on('close', () => {
      entry.alive = false
      const idx = this.pool.indexOf(entry)
      if (idx !== -1) {
        this.pool.splice(idx, 1)
        this.totalErrors++
        // Try to replenish
        process.nextTick(() => this.fill())
      }
    })

    // Add to pool immediately — stdin writes are buffered
    this.pool.push(entry)
    this.warming--

    console.log(`[Pool] Spawned process for ${model} (pool: ${this.pool.length}/${this.size})`)
  }

  /**
   * Acquire a pre-warmed process for the given model.
   * Prefers the oldest process (most likely fully initialized).
   * Returns null if no matching process available.
   */
  acquire(model = this.defaultModel) {
    // Find matching model, prefer oldest (most warm)
    const idx = this.pool.findIndex(p => p.model === model && p.alive)
    if (idx === -1) return null

    const entry = this.pool.splice(idx, 1)[0]
    this.totalAcquired++

    const warmTime = Date.now() - entry.spawnedAt
    const isWarm = warmTime >= POOL_READY_MS

    console.log(`[Pool] Acquired process (warm: ${warmTime}ms, isWarm: ${isWarm}, remaining: ${this.pool.length})`)

    // Replenish pool
    process.nextTick(() => this.fill())

    return { ...entry, warmTime, isWarm }
  }

  /** Remove stale processes that have been sitting too long */
  cleanup() {
    const now = Date.now()
    const expired = this.pool.filter(p => now - p.spawnedAt > POOL_MAX_AGE_MS)
    for (const entry of expired) {
      entry.alive = false
      try { entry.child.kill('SIGTERM') } catch {}
      this.pool = this.pool.filter(p => p !== entry)
      this.totalExpired++
    }
    if (expired.length > 0) {
      console.log(`[Pool] Cleaned up ${expired.length} stale processes`)
      this.fill()
    }
  }

  getStatus() {
    return {
      available: this.pool.length,
      warming: this.warming,
      targetSize: this.size,
      totalSpawned: this.totalSpawned,
      totalAcquired: this.totalAcquired,
      totalExpired: this.totalExpired,
      totalErrors: this.totalErrors,
      processes: this.pool.map(p => ({
        model: p.model,
        age: `${Math.round((Date.now() - p.spawnedAt) / 1000)}s`,
        alive: p.alive,
        warm: (Date.now() - p.spawnedAt) >= POOL_READY_MS,
      })),
    }
  }

  shutdown() {
    clearInterval(this.cleanupInterval)
    for (const entry of this.pool) {
      try { entry.child.kill('SIGTERM') } catch {}
    }
    this.pool = []
  }
}

// ── Pre-Warmed CLI Call (Max Plan — FASTEST) ─────────────────────

/**
 * Call Claude via a pre-warmed CLI process.
 * Eliminates ~2.5s init overhead. Response in ~2-3s.
 */
function callClaudePreWarmed(prompt, options = {}) {
  const {
    systemPrompt = '',
    model = DEFAULT_MODEL,
  } = options

  const proc = processPool.acquire(model)
  if (!proc) return Promise.reject(new Error('No pre-warmed process available'))

  const { child, warmTime, isWarm } = proc

  return new Promise((resolve, reject) => {
    const requestId = randomUUID().slice(0, 8)
    const startTime = Date.now()
    console.log(`[${requestId}] Pre-warmed call (warm: ${warmTime}ms, model: ${model})...`)

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data) => { stdout += data.toString() })
    child.stderr.on('data', (data) => { stderr += data.toString() })

    const timeout = setTimeout(() => {
      child.kill('SIGTERM')
      reject(new Error(`Pre-warmed CLI timeout after ${CLI_TIMEOUT_MS}ms`))
    }, CLI_TIMEOUT_MS)

    child.on('close', (code) => {
      clearTimeout(timeout)
      const duration = Date.now() - startTime

      if (code !== 0) {
        console.warn(`[${requestId}] Pre-warmed exited with code ${code} (${duration}ms)`)
        if (stderr) console.warn(`[${requestId}] stderr: ${stderr.substring(0, 200)}`)
        return reject(new Error(`Pre-warmed exit code ${code}: ${stderr.substring(0, 200)}`))
      }

      try {
        const result = parseStreamJsonOutput(stdout)

        console.log(`[${requestId}] Done in ${duration}ms (api: ${result.apiDuration}ms, warm: ${warmTime}ms, ${result.inputTokens}+${result.outputTokens} tokens) [PRE-WARMED/FREE]`)

        // Update global rate limit info
        if (result.rateLimitInfo) {
          latestRateLimitInfo = result.rateLimitInfo
        }

        resolve({
          success: true,
          output: result.text,
          requestId,
          model: result.model || model,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          duration,
          apiDuration: result.apiDuration,
          authMethod: isWarm ? 'max-plan-prewarmed' : 'max-plan-warming',
          cost: 0,
          warmTime,
          rateLimitInfo: result.rateLimitInfo,
          sessionId: result.sessionId,
        })
      } catch (e) {
        console.warn(`[${requestId}] Parse failed, using raw stdout (${duration}ms)`)
        resolve({
          success: true,
          output: stdout.trim(),
          requestId,
          model,
          inputTokens: 0,
          outputTokens: 0,
          duration,
          apiDuration: 0,
          authMethod: 'max-plan-prewarmed',
          cost: 0,
          warmTime,
        })
      }
    })

    child.on('error', (err) => {
      clearTimeout(timeout)
      reject(new Error(`Pre-warmed CLI error: ${err.message}`))
    })

    // Build the prompt with system context if needed
    let fullContent = prompt
    if (systemPrompt) {
      fullContent = `<system_instructions>\n${systemPrompt}\n</system_instructions>\n\n${prompt}`
    }

    // Write message via stream-json protocol
    const message = JSON.stringify({
      type: 'user',
      message: { role: 'user', content: fullContent }
    })
    child.stdin.write(message + '\n')
    child.stdin.end()
  })
}

// ── Cold CLI Call (Max Plan — FREE) ──────────────────────────────

/**
 * Call Claude via a fresh CLI spawn (no pre-warming).
 * Used when pre-warmed pool is exhausted. ~5s total.
 */
function callClaudeCLI(prompt, options = {}) {
  const {
    systemPrompt = '',
    maxTokens = 4096,
    model = DEFAULT_MODEL,
  } = options

  return new Promise((resolve, reject) => {
    const requestId = randomUUID().slice(0, 8)
    const startTime = Date.now()
    console.log(`[${requestId}] Cold CLI call (model: ${model})...`)

    const args = [
      '-p', prompt,
      '--model', model,
      '--output-format', 'json',
      '--tools', '',         // Disable tools — saves ~20K tokens, matches production behavior
      '--dangerously-skip-permissions',
      '--no-session-persistence',
      '--strict-mcp-config',
    ]

    if (systemPrompt) {
      args.push('--system-prompt', systemPrompt)
    }

    const child = spawn('claude', args, {
      env: getCleanEnv(),
      cwd: SANDBOX_DIR,  // Isolated dir — no CLAUDE.md ancestry
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data) => { stdout += data.toString() })
    child.stderr.on('data', (data) => { stderr += data.toString() })

    const timeout = setTimeout(() => {
      child.kill('SIGTERM')
      reject(new Error(`CLI timeout after ${CLI_TIMEOUT_MS}ms`))
    }, CLI_TIMEOUT_MS)

    child.on('close', (code) => {
      clearTimeout(timeout)
      const duration = Date.now() - startTime

      if (code !== 0) {
        console.warn(`[${requestId}] CLI exited with code ${code} (${duration}ms)`)
        if (stderr) console.warn(`[${requestId}] stderr: ${stderr.substring(0, 200)}`)
        return reject(new Error(`CLI exit code ${code}: ${stderr.substring(0, 200)}`))
      }

      try {
        const result = JSON.parse(stdout)
        const text = result.result || ''
        const inputTokens = result.usage?.input_tokens || 0
        const outputTokens = result.usage?.output_tokens || 0
        const apiDuration = result.duration_api_ms || 0

        console.log(`[${requestId}] Done in ${duration}ms (api: ${apiDuration}ms, ${inputTokens}+${outputTokens} tokens) [COLD CLI/FREE]`)

        resolve({
          success: true,
          output: text,
          requestId,
          model: Object.keys(result.modelUsage || {})[0] || model,
          inputTokens,
          outputTokens,
          duration,
          apiDuration,
          authMethod: 'max-plan-cold',
          cost: 0,
          sessionId: result.session_id,
        })
      } catch (e) {
        console.warn(`[${requestId}] JSON parse failed, using raw output (${duration}ms)`)
        resolve({
          success: true,
          output: stdout.trim(),
          requestId,
          model,
          inputTokens: 0,
          outputTokens: 0,
          duration,
          apiDuration: 0,
          authMethod: 'max-plan-cold',
          cost: 0,
        })
      }
    })

    child.on('error', (err) => {
      clearTimeout(timeout)
      reject(new Error(`CLI spawn error: ${err.message}`))
    })

    child.stdin.end()
  })
}

// ── Direct API Call (Paid Fallback) ─────────────────────────────

async function callClaudeApiKey(prompt, options = {}) {
  const {
    systemPrompt = '',
    maxTokens = 4096,
    model = DEFAULT_MODEL,
  } = options

  const apiKey = loadApiKey()
  if (!apiKey) throw new Error('No API key available for fallback')

  const requestId = randomUUID().slice(0, 8)
  const startTime = Date.now()
  console.log(`[${requestId}] API key fallback (model: ${model})...`)

  const body = {
    model,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  }
  if (systemPrompt) body.system = systemPrompt

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`API ${res.status}: ${errBody.substring(0, 200)}`)
  }

  const data = await res.json()
  const text = data.content?.find(c => c.type === 'text')?.text || ''
  const inputTokens = data.usage?.input_tokens || 0
  const outputTokens = data.usage?.output_tokens || 0
  const duration = Date.now() - startTime
  const cost = inputTokens * 0.000003 + outputTokens * 0.000015

  console.log(`[${requestId}] Done in ${duration}ms (${inputTokens}+${outputTokens} tokens) [API Key/PAID ~$${cost.toFixed(4)}]`)

  return {
    success: true,
    output: text,
    requestId,
    model: data.model,
    inputTokens,
    outputTokens,
    duration,
    apiDuration: duration,
    authMethod: 'apikey',
    cost,
  }
}

// ── Combined Call with 3-Tier Fallback ──────────────────────────

/**
 * 3-tier call strategy:
 * 1. Pre-warmed CLI (fastest, ~2.5s, FREE)
 * 2. Cold CLI spawn (reliable, ~5s, FREE)
 * 3. Direct API key (paid fallback, ~2-3s, PAID)
 */
async function callClaude(prompt, options = {}) {
  // Normalize model aliases (e.g., 'claude-sonnet-4-6' → 'claude-sonnet-4-20250514')
  if (options.model) {
    const normalized = normalizeModel(options.model)
    if (normalized !== options.model) {
      console.log(`[Model] Alias resolved: ${options.model} → ${normalized}`)
      options.model = normalized
    }
  }

  // Tier 1: Pre-warmed process (fastest)
  try {
    return await callClaudePreWarmed(prompt, options)
  } catch (preWarmErr) {
    console.warn(`[Fallback] Pre-warmed failed: ${preWarmErr.message}`)
  }

  // Tier 2: Cold CLI spawn (still free)
  try {
    return await callClaudeCLI(prompt, options)
  } catch (cliErr) {
    console.warn(`[Fallback] Cold CLI failed: ${cliErr.message}`)
  }

  // Tier 3: API key (paid)
  console.warn('[Fallback] Using API key (PAID)')
  return await callClaudeApiKey(prompt, options)
}

// ── Request Queue ───────────────────────────────────────────────

class RequestQueue {
  constructor(maxConcurrent = MAX_CONCURRENT) {
    this.maxConcurrent = maxConcurrent
    this.running = 0
    this.queue = []
  }
  async add(task) {
    return new Promise((resolve, reject) => {
      const execute = async () => {
        this.running++
        try { resolve(await task()) }
        catch (e) { reject(e) }
        finally { this.running--; this.processNext() }
      }
      if (this.running < this.maxConcurrent) execute()
      else this.queue.push(execute)
    })
  }
  processNext() {
    if (this.queue.length > 0 && this.running < this.maxConcurrent) {
      this.queue.shift()()
    }
  }
  getStatus() {
    return { running: this.running, queued: this.queue.length, maxConcurrent: this.maxConcurrent }
  }
}

// ── Express Server ──────────────────────────────────────────────

const app = express()
const PORT = process.env.PORT || 4568
const requestQueue = new RequestQueue(MAX_CONCURRENT)
const processPool = new ProcessPool(POOL_SIZE, DEFAULT_MODEL)

// Track latest rate limit info from stream-json events
let latestRateLimitInfo = null

app.use(cors())
app.use(express.json({ limit: '10mb' }))

const stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalTokens: 0,
  prewarmedRequests: 0,
  coldCliRequests: 0,
  apikeyRequests: 0,
  estimatedSaved: 0,
  responseTimes: [],
  startTime: new Date(),
}

const apiKeyAvailable = !!loadApiKey()

// Health check
app.get('/health', (req, res) => {
  const uptime = Math.floor((new Date() - stats.startTime) / 1000)
  const avgTime = stats.responseTimes.length > 0
    ? Math.round(stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length)
    : 0

  res.json({
    status: 'healthy',
    version: 'v4-prewarmed',
    primaryAuth: 'max-plan-prewarmed (FREE, ~2.5s)',
    fallbackAuth: [
      'max-plan-cold (FREE, ~5s)',
      apiKeyAvailable ? 'api-key (PAID, ~2-3s)' : 'none',
    ],
    uptime: `${uptime}s`,
    pool: processPool.getStatus(),
    queue: requestQueue.getStatus(),
    rateLimit: latestRateLimitInfo,
    stats: {
      total: stats.totalRequests,
      successful: stats.successfulRequests,
      failed: stats.failedRequests,
      totalTokens: stats.totalTokens,
      prewarmedCalls: stats.prewarmedRequests,
      coldCliCalls: stats.coldCliRequests,
      apikeyCalls: stats.apikeyRequests,
      estimatedSaved: `$${stats.estimatedSaved.toFixed(4)}`,
      avgResponseTimeMs: avgTime,
      successRate: stats.totalRequests > 0
        ? `${((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1)}%`
        : 'N/A',
    },
  })
})

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
  const { prompt, systemPrompt, maxTokens, model } = req.body

  if (!prompt) {
    return res.status(400).json({ success: false, error: 'Missing required field: prompt' })
  }

  stats.totalRequests++
  const startTime = Date.now()

  try {
    const result = await requestQueue.add(() =>
      callClaude(prompt, { systemPrompt, maxTokens, model })
    )

    stats.successfulRequests++
    stats.totalTokens += (result.inputTokens + result.outputTokens)
    stats.responseTimes.push(result.duration)
    if (stats.responseTimes.length > 100) stats.responseTimes.shift()

    if (result.authMethod.startsWith('max-plan-pre') || result.authMethod === 'max-plan-warming') {
      stats.prewarmedRequests++
      stats.estimatedSaved += result.inputTokens * 0.000003 + result.outputTokens * 0.000015
    } else if (result.authMethod === 'max-plan-cold') {
      stats.coldCliRequests++
      stats.estimatedSaved += result.inputTokens * 0.000003 + result.outputTokens * 0.000015
    } else {
      stats.apikeyRequests++
    }

    const totalDuration = Date.now() - startTime
    res.json({
      success: true,
      output: result.output,
      requestId: result.requestId,
      model: result.model,
      duration: `${totalDuration}ms`,
      apiDuration: `${result.apiDuration}ms`,
      tokens: { input: result.inputTokens, output: result.outputTokens },
      authMethod: result.authMethod,
      cost: result.authMethod === 'apikey' ? `~$${result.cost?.toFixed(4) || '?'}` : '$0 (Max Plan)',
      warmTime: result.warmTime ? `${result.warmTime}ms` : undefined,
      queue: requestQueue.getStatus(),
    })
  } catch (error) {
    stats.failedRequests++
    console.error('Chat error:', error.message)
    res.status(500).json({
      success: false,
      error: error.message,
      queue: requestQueue.getStatus(),
    })
  }
})

// BMAD agent endpoint
app.post('/api/bmad', async (req, res) => {
  const { agent, userMessage, context } = req.body

  if (!agent || !userMessage) {
    return res.status(400).json({ success: false, error: 'Missing required fields: agent, userMessage' })
  }

  const agentPrompts = {
    director: `You are the BMAD Director agent. Analyze the user's request and respond with JSON containing:
{"intent":"string","domain":"travel|business|finance|productivity|communication|personal","confidence":0.0-1.0,"understanding":"string","extractedInfo":{},"missingInfo":[],"suggestedTools":[],"complexity":"simple|medium|complex"}
Respond ONLY with valid JSON.`,
    analyst: `You are the BMAD Analyst agent. Generate minimal smart questions (max 3) to gather missing info. Respond with JSON array of question objects. Respond ONLY with valid JSON array.`,
    builder: `You are the BMAD Builder agent. Design an optimal workflow. Respond with JSON containing name, description, nodes, edges, estimatedTime. Respond ONLY with valid JSON.`,
  }

  const systemPrompt = agentPrompts[agent] || agentPrompts.director
  let fullPrompt = userMessage
  if (context) {
    fullPrompt = `Context: ${JSON.stringify(context)}\n\nUser Message: ${userMessage}`
  }

  stats.totalRequests++

  try {
    const result = await requestQueue.add(() =>
      callClaude(fullPrompt, { systemPrompt, maxTokens: 4096 })
    )

    stats.successfulRequests++
    stats.totalTokens += (result.inputTokens + result.outputTokens)
    if (result.authMethod.startsWith('max-plan')) {
      if (result.authMethod.includes('prewarm') || result.authMethod === 'max-plan-warming') {
        stats.prewarmedRequests++
      } else {
        stats.coldCliRequests++
      }
      stats.estimatedSaved += result.inputTokens * 0.000003 + result.outputTokens * 0.000015
    } else {
      stats.apikeyRequests++
    }

    let parsed = null
    try {
      const jsonMatch = result.output.match(/[\[{][\s\S]*[\]}]/)
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
    } catch { /* parse failed */ }

    res.json({
      success: true,
      output: result.output,
      parsed,
      agent,
      requestId: result.requestId,
      authMethod: result.authMethod,
      duration: `${result.duration}ms`,
    })
  } catch (error) {
    stats.failedRequests++
    console.error('BMAD error:', error.message)
    res.status(500).json({ success: false, error: error.message, agent })
  }
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Shutdown] Cleaning up process pool...')
  processPool.shutdown()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('[Shutdown] Cleaning up process pool...')
  processPool.shutdown()
  process.exit(0)
})

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║      Claude Proxy Server v4 (Pre-Warmed + Max Plan)           ║
╠═══════════════════════════════════════════════════════════════╣
║  Status:   RUNNING                                            ║
║  Port:     ${String(PORT).padEnd(51)}║
║  Pool:     ${String(POOL_SIZE + ' pre-warmed processes').padEnd(51)}║
║  Model:    ${DEFAULT_MODEL.padEnd(51)}║
╠═══════════════════════════════════════════════════════════════╣
║  Performance Tiers:                                           ║
║    1. Pre-warmed CLI  ~2.5s (FREE) ← processes ready to go   ║
║    2. Cold CLI spawn  ~5.0s (FREE) ← fresh process spawn     ║
║    3. API key fallback ~2-3s (PAID) ← only if CLI fails      ║
╠═══════════════════════════════════════════════════════════════╣
║  Optimizations:                                               ║
║    Process pre-warming    Skip 2.5s init overhead             ║
║    --strict-mcp-config   Skip MCP servers (-8s)               ║
║    --no-session-persistence Skip session saving               ║
║    Stream-JSON I/O       Rate limit tracking                  ║
╠═══════════════════════════════════════════════════════════════╣
║  Endpoints:                                                   ║
║    POST /api/chat  - Chat (3-tier fallback)                   ║
║    POST /api/bmad  - BMAD agent calls                         ║
║    GET  /health    - Health + pool status + rate limits        ║
╠═══════════════════════════════════════════════════════════════╣
║  Cost: $0 (Max Plan) | API fallback: ~$0.01/req              ║
╚═══════════════════════════════════════════════════════════════╝
  `)
})
