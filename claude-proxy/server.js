/**
 * Claude Code Proxy Server
 *
 * Uses your Claude Code Max subscription to process API requests for Nexus.
 * This allows Nexus to leverage your unlimited Claude access without needing
 * separate API credits.
 *
 * Usage:
 *   npm install
 *   npm start
 *
 * Endpoints:
 *   POST /api/chat - Send a prompt, get Claude response
 *   GET /health - Health check
 */

import express from 'express'
import cors from 'cors'
import { spawn } from 'child_process'
import { randomUUID } from 'crypto'

const app = express()
const PORT = process.env.PORT || 4568

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Request queue for managing concurrent requests
class RequestQueue {
  constructor(maxConcurrent = 2) {
    this.maxConcurrent = maxConcurrent
    this.running = 0
    this.queue = []
  }

  async add(task) {
    return new Promise((resolve, reject) => {
      const execute = async () => {
        this.running++
        try {
          const result = await task()
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          this.running--
          this.processNext()
        }
      }

      if (this.running < this.maxConcurrent) {
        execute()
      } else {
        this.queue.push(execute)
      }
    })
  }

  processNext() {
    if (this.queue.length > 0 && this.running < this.maxConcurrent) {
      const next = this.queue.shift()
      next()
    }
  }

  getStatus() {
    return {
      running: this.running,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent
    }
  }
}

const requestQueue = new RequestQueue(2) // Max 2 concurrent Claude calls

// Stats tracking
const stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  startTime: new Date()
}

/**
 * Execute Claude Code CLI with the given prompt
 * Uses stdin to pass prompt (more reliable on Windows)
 */
async function executeClaudeCode(prompt, options = {}) {
  const {
    systemPrompt = '',
    maxTokens = 4096,
    timeout = 120000 // 2 minutes default timeout
  } = options

  return new Promise((resolve, reject) => {
    const requestId = randomUUID().slice(0, 8)
    console.log(`[${requestId}] Starting Claude Code execution...`)

    // Build the full prompt with system context if provided
    let fullPrompt = prompt
    if (systemPrompt) {
      fullPrompt = `${systemPrompt}\n\n---\n\nUser Request:\n${prompt}`
    }

    // Use claude CLI with --print flag for non-interactive output
    // Pass prompt via stdin for better Windows compatibility
    const claude = spawn('claude', [
      '--print',
      '--dangerously-skip-permissions'
    ], {
      shell: true,
      timeout,
      env: { ...process.env }
    })

    let stdout = ''
    let stderr = ''

    claude.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    claude.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    // Write prompt to stdin and close it
    claude.stdin.write(fullPrompt)
    claude.stdin.end()

    // Set timeout handler
    const timeoutId = setTimeout(() => {
      claude.kill('SIGTERM')
      reject(new Error(`Request ${requestId} timed out after ${timeout}ms`))
    }, timeout)

    claude.on('close', (code) => {
      clearTimeout(timeoutId)

      if (code === 0) {
        console.log(`[${requestId}] Completed successfully (${stdout.length} chars)`)
        resolve({
          success: true,
          output: stdout.trim(),
          requestId
        })
      } else {
        console.error(`[${requestId}] Failed with code ${code}: ${stderr}`)
        reject(new Error(stderr || `Claude exited with code ${code}`))
      }
    })

    claude.on('error', (error) => {
      clearTimeout(timeoutId)
      console.error(`[${requestId}] Spawn error:`, error)
      reject(error)
    })
  })
}

// Health check endpoint
app.get('/health', (req, res) => {
  const uptime = Math.floor((new Date() - stats.startTime) / 1000)
  res.json({
    status: 'healthy',
    uptime: `${uptime}s`,
    queue: requestQueue.getStatus(),
    stats: {
      total: stats.totalRequests,
      successful: stats.successfulRequests,
      failed: stats.failedRequests,
      successRate: stats.totalRequests > 0
        ? `${((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1)}%`
        : 'N/A'
    }
  })
})

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
  const { prompt, systemPrompt, maxTokens, model } = req.body

  if (!prompt) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: prompt'
    })
  }

  stats.totalRequests++
  const startTime = Date.now()

  try {
    const result = await requestQueue.add(() =>
      executeClaudeCode(prompt, { systemPrompt, maxTokens })
    )

    stats.successfulRequests++
    const duration = Date.now() - startTime

    res.json({
      success: true,
      output: result.output,
      requestId: result.requestId,
      model: 'claude-code-max', // Indicate this used Max subscription
      duration: `${duration}ms`,
      queue: requestQueue.getStatus()
    })

  } catch (error) {
    stats.failedRequests++
    console.error('Chat error:', error.message)

    res.status(500).json({
      success: false,
      error: error.message,
      queue: requestQueue.getStatus()
    })
  }
})

// BMAD-specific endpoint with structured prompts
app.post('/api/bmad', async (req, res) => {
  const { agent, userMessage, context } = req.body

  if (!agent || !userMessage) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: agent, userMessage'
    })
  }

  // BMAD agent system prompts
  const agentPrompts = {
    director: `You are the BMAD Director agent. Analyze the user's request and respond with JSON containing:
{
  "intent": "string - main intent",
  "domain": "travel|business|finance|productivity|communication|personal",
  "confidence": 0.0-1.0,
  "understanding": "string - what user wants",
  "extractedInfo": { "key": "value" },
  "missingInfo": ["list of missing info"],
  "suggestedTools": ["list of tools"],
  "complexity": "simple|medium|complex"
}
Be decisive and efficient. Respond ONLY with valid JSON.`,

    analyst: `You are the BMAD Analyst agent. Generate minimal smart questions (max 3) to gather missing info.
Respond with JSON array:
[
  {
    "id": "unique_id",
    "question": "the question text",
    "purpose": "why this is needed",
    "type": "text|select|number|date|confirm",
    "options": ["if select type"],
    "required": true/false
  }
]
Respond ONLY with valid JSON array.`,

    builder: `You are the BMAD Builder agent. Design an optimal workflow based on requirements.
Respond with JSON:
{
  "name": "workflow name",
  "description": "what it does",
  "nodes": [
    { "id": "1", "type": "trigger|action|condition", "tool": "tool_name", "config": {} }
  ],
  "edges": [
    { "from": "1", "to": "2" }
  ],
  "estimatedTime": "X minutes saved per run"
}
Respond ONLY with valid JSON.`
  }

  const systemPrompt = agentPrompts[agent] || agentPrompts.director

  let fullPrompt = userMessage
  if (context) {
    fullPrompt = `Context: ${JSON.stringify(context)}\n\nUser Message: ${userMessage}`
  }

  stats.totalRequests++
  const startTime = Date.now()

  try {
    const result = await requestQueue.add(() =>
      executeClaudeCode(fullPrompt, { systemPrompt, maxTokens: 4096 })
    )

    stats.successfulRequests++
    const duration = Date.now() - startTime

    // Try to parse JSON from response
    let parsed = null
    try {
      const jsonMatch = result.output.match(/[\[{][\s\S]*[\]}]/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      }
    } catch {
      // If parsing fails, return raw output
    }

    res.json({
      success: true,
      output: result.output,
      parsed,
      agent,
      requestId: result.requestId,
      duration: `${duration}ms`
    })

  } catch (error) {
    stats.failedRequests++
    console.error('BMAD error:', error.message)

    res.status(500).json({
      success: false,
      error: error.message,
      agent
    })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║         Claude Code Proxy Server                          ║
╠═══════════════════════════════════════════════════════════╣
║  Status:  RUNNING                                         ║
║  Port:    ${PORT}                                            ║
║  Mode:    Claude Code Max Subscription                    ║
╠═══════════════════════════════════════════════════════════╣
║  Endpoints:                                               ║
║    POST /api/chat  - General chat                         ║
║    POST /api/bmad  - BMAD agent calls                     ║
║    GET  /health    - Health check                         ║
╚═══════════════════════════════════════════════════════════╝
  `)
})
