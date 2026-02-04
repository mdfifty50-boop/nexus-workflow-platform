import Anthropic from '@anthropic-ai/sdk'

// Nexus Workflow Execution Service
// Integrates with Claude Code Proxy (Max subscription) or direct API

// Production-ready: Use env var or fallback to localhost for development
const PROXY_URL = import.meta.env.VITE_PROXY_URL || 'http://localhost:4567'

export interface NexusWorkflowConfig {
  type: 'Nexus' | 'Simple' | 'Scheduled'
  prompt: string
  model?: string
  maxTokens?: number
  temperature?: number
}

export interface NexusExecutionResult {
  success: boolean
  output: string
  tokensUsed: number
  costUSD: number
  error?: string
  source?: 'proxy' | 'api' | 'simulation'
}

class NexusService {
  private client: Anthropic | null = null
  private proxyAvailable: boolean | null = null
  private lastProxyCheck: number = 0
  private readonly PROXY_CHECK_INTERVAL = 30000 // Check every 30 seconds

  constructor() {
    // Initialize Anthropic client only if API key is available
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
    if (apiKey) {
      this.client = new Anthropic({
        apiKey,
        dangerouslyAllowBrowser: true,
      })
    }

    // Check proxy availability on startup
    this.checkProxyHealth()
  }

  /**
   * Check if the Claude Code proxy is available
   */
  private async checkProxyHealth(): Promise<boolean> {
    const now = Date.now()

    // Use cached result if recent
    if (this.proxyAvailable !== null && (now - this.lastProxyCheck) < this.PROXY_CHECK_INTERVAL) {
      return this.proxyAvailable
    }

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3000)

      const response = await fetch(`${PROXY_URL}/health`, {
        signal: controller.signal
      })
      clearTimeout(timeout)

      this.proxyAvailable = response.ok
      this.lastProxyCheck = now

      if (this.proxyAvailable) {
        console.log('[Nexus] Claude Code Proxy is available - using Max subscription')
      }

      return this.proxyAvailable
    } catch {
      this.proxyAvailable = false
      this.lastProxyCheck = now
      return false
    }
  }

  /**
   * Execute via Claude Code Proxy (uses Max subscription)
   */
  private async executeViaProxy(config: NexusWorkflowConfig): Promise<NexusExecutionResult> {
    const response = await fetch(`${PROXY_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: this.buildNexusPrompt(config),
        systemPrompt: config.type === 'Nexus' ? 'You are a Nexus workflow assistant.' : undefined,
        maxTokens: config.maxTokens || 4096
      })
    })

    if (!response.ok) {
      throw new Error(`Proxy error: ${response.status}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Proxy execution failed')
    }

    // Estimate tokens from output length (rough approximation)
    const estimatedTokens = Math.ceil(result.output.length / 4) + 500

    return {
      success: true,
      output: result.output,
      tokensUsed: estimatedTokens,
      costUSD: 0, // Free via Max subscription!
      source: 'proxy'
    }
  }

  /**
   * Execute via direct Anthropic API
   */
  private async executeViaAPI(config: NexusWorkflowConfig): Promise<NexusExecutionResult> {
    if (!this.client) {
      throw new Error('No API client configured')
    }

    const model = config.model || 'claude-sonnet-4-20250514'
    const maxTokens = config.maxTokens || 4096
    const temperature = config.temperature || 1.0

    const message = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [
        {
          role: 'user',
          content: this.buildNexusPrompt(config),
        },
      ],
    })

    const tokensUsed = message.usage.input_tokens + message.usage.output_tokens
    const costUSD = this.calculateCost(model, message.usage.input_tokens, message.usage.output_tokens)

    const output = message.content
      .filter((block) => block.type === 'text')
      .map((block) => ('text' in block ? block.text : ''))
      .join('\n')

    return {
      success: true,
      output,
      tokensUsed,
      costUSD,
      source: 'api'
    }
  }

  /**
   * Execute a Nexus workflow - tries proxy first, then API, then simulation
   */
  async executeWorkflow(config: NexusWorkflowConfig): Promise<NexusExecutionResult> {
    // Try 1: Claude Code Proxy (free via Max subscription)
    const proxyAvailable = await this.checkProxyHealth()
    if (proxyAvailable) {
      try {
        console.log('[Nexus] Executing via Claude Code Proxy (Max subscription)...')
        return await this.executeViaProxy(config)
      } catch (error: any) {
        console.warn('[Nexus] Proxy failed, trying API:', error.message)
      }
    }

    // Try 2: Direct Anthropic API (if configured and has credits)
    if (this.client) {
      try {
        console.log('[Nexus] Executing via Anthropic API...')
        return await this.executeViaAPI(config)
      } catch (error: any) {
        console.warn('[Nexus] API failed:', error.message)
        // If it's a credits issue, don't retry
        if (error.message?.includes('credit balance')) {
          console.log('[Nexus] No API credits, falling back to simulation')
        }
      }
    }

    // Try 3: Simulation (fallback)
    console.log('[Nexus] Using simulation mode')
    return this.simulateExecution(config)
  }

  /**
   * Build Nexus-structured prompt for Claude
   */
  private buildNexusPrompt(config: NexusWorkflowConfig): string {
    if (config.type === 'Nexus') {
      return `You are an AI assistant executing a Nexus AI workflow.

Nexus AI Methodology Guidelines:
- **Business-focused**: Align all outputs with business objectives
- **Modular**: Break complex tasks into discrete, reusable components
- **Actionable**: Provide clear, executable steps
- **Data-driven**: Base decisions on concrete data and metrics

Workflow Task:
${config.prompt}

Please execute this workflow following Nexus AI principles and provide:
1. Analysis of business context
2. Modular breakdown of the task
3. Actionable steps with expected outcomes
4. Data points or metrics to track success

Your response:`
    } else if (config.type === 'Simple') {
      return config.prompt
    } else {
      return `Execute the following scheduled task:

${config.prompt}

Provide a summary of the execution and any relevant results.`
    }
  }

  /**
   * Calculate cost based on Claude pricing (as of 2025)
   */
  private calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing: Record<string, { input: number; output: number }> = {
      'claude-opus-4-5-20251101': { input: 15.0, output: 75.0 },
      'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 },
      'claude-3-5-haiku-20241022': { input: 1.0, output: 5.0 },
    }

    const modelPricing = pricing[model] || pricing['claude-sonnet-4-20250514']
    const inputCost = (inputTokens / 1_000_000) * modelPricing.input
    const outputCost = (outputTokens / 1_000_000) * modelPricing.output

    return Number((inputCost + outputCost).toFixed(4))
  }

  /**
   * Simulate execution when no backend is available
   */
  private async simulateExecution(config: NexusWorkflowConfig): Promise<NexusExecutionResult> {
    await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 2000))

    const estimatedTokens = Math.floor(500 + Math.random() * 3000)

    return {
      success: true,
      output: `[SIMULATION MODE]

To enable real AI:
1. Start Claude Code Proxy: cd claude-proxy && npm start
2. Or add API credits at console.anthropic.com

Task: ${config.prompt}

Simulated Results:
- Analysis completed
- Recommendations generated
- Metrics identified`,
      tokensUsed: estimatedTokens,
      costUSD: 0,
      source: 'simulation'
    }
  }

  /**
   * Get current service status
   */
  async getStatus(): Promise<{
    proxyAvailable: boolean
    apiConfigured: boolean
    mode: 'proxy' | 'api' | 'simulation'
  }> {
    const proxyAvailable = await this.checkProxyHealth()
    const apiConfigured = this.client !== null

    let mode: 'proxy' | 'api' | 'simulation' = 'simulation'
    if (proxyAvailable) mode = 'proxy'
    else if (apiConfigured) mode = 'api'

    return { proxyAvailable, apiConfigured, mode }
  }

  isConfigured(): boolean {
    return this.client !== null || this.proxyAvailable === true
  }
}

export const nexusService = new NexusService()
