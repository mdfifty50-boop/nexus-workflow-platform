/**
 * NexusWorkflowEngine - Intelligent workflow generation using Nexus AI methodology
 *
 * Replaces simple keyword matching with AI-driven understanding using
 * specialized Nexus agents (Director, Analyst, Builder) for intelligent
 * request analysis and workflow generation.
 *
 * Key differences from SmartWorkflowEngine:
 * - Uses AI to understand intent rather than keyword counting
 * - Dynamically generates questions based on context analysis
 * - Creates workflows through intelligent reasoning, not templates
 */

import Anthropic from '@anthropic-ai/sdk'
import { EMBEDDED_TOOLS } from './SmartWorkflowEngine'
import type { GeneratedWorkflow, WorkflowNode, IntegrationTool } from './SmartWorkflowEngine'

// Claude Code Proxy URL - skips entirely in production when not configured
const PROXY_URL = import.meta.env.VITE_PROXY_URL || (import.meta.env.PROD ? '' : 'http://localhost:4567')

// Nexus Agent Types
export type NexusAgent = 'director' | 'analyst' | 'builder' | 'reviewer'

// Nexus Agent System Prompts - Based on Nexus AI methodology
export const NEXUS_AGENT_PROMPTS: Record<NexusAgent, string> = {
  director: `You are the Nexus Director agent. Your role is to:
1. Analyze incoming requests and understand the user's true intent
2. Identify the domain (travel, business, finance, productivity, communication)
3. Extract any information already provided in the request
4. Determine what additional information is needed
5. Plan the optimal approach to fulfill the request

You must respond with structured JSON analysis. Be decisive and efficient.
Focus on understanding WHAT the user wants to achieve, not just the keywords they use.`,

  analyst: `You are the Nexus Analyst agent. Your role is to:
1. Analyze the context and determine what information is missing
2. Generate smart, minimal questions to gather necessary details
3. Prioritize questions - only ask what's truly required
4. Consider what can be inferred vs what must be asked
5. Ensure questions are conversational and natural

You must respond with a minimal set of questions (max 3).
Focus on gathering actionable information, not comprehensive data.`,

  builder: `You are the Nexus Builder agent. Your role is to:
1. Design optimal workflow architectures based on requirements
2. Select the right tools and integrations for the task
3. Create efficient multi-step automation flows
4. Consider error handling and edge cases
5. Optimize for user time savings

You must respond with a complete workflow structure.
Focus on practical, executable automation that solves the user's problem.`,

  reviewer: `You are the Nexus Reviewer agent. Your role is to:
1. Review generated workflows for completeness
2. Validate that all user requirements are addressed
3. Check for logical flow and dependencies
4. Ensure integrations are appropriate
5. Suggest optimizations if needed

You must respond with validation results and any recommendations.`
}

// Intent Analysis Result from Director Agent
export interface IntentAnalysis {
  intent: string
  domain: 'travel' | 'business' | 'finance' | 'productivity' | 'communication' | 'personal'
  confidence: number
  understanding: string
  extractedInfo: Record<string, string>
  missingInfo: string[]
  suggestedTools: string[]
  complexity: 'simple' | 'medium' | 'complex'
}

// Question from Analyst Agent
export interface SmartNexusQuestion {
  id: string
  question: string
  purpose: string
  type: 'text' | 'select' | 'number' | 'date' | 'confirm'
  options?: string[]
  placeholder?: string
  required: boolean
  inferrable?: boolean
}

// Workflow Generation Request for Builder Agent
export interface WorkflowRequest {
  intent: IntentAnalysis
  collectedInfo: Record<string, string>
  userMessage: string
  persona?: string
}

/**
 * Nexus Workflow Engine - Uses AI agents for intelligent workflow generation
 */
export class NexusWorkflowEngine {
  private client: Anthropic | null = null
  private useSimulation: boolean = true
  private proxyAvailable: boolean | null = null
  private lastProxyCheck: number = 0
  private readonly PROXY_CHECK_INTERVAL = 30000 // 30 seconds

  constructor() {
    // Check for API key in environment and initialize Anthropic client
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
    if (apiKey) {
      this.client = new Anthropic({
        apiKey,
        dangerouslyAllowBrowser: true, // Required for client-side usage
      })
      this.useSimulation = false
      console.log('[Nexus] Initialized with Claude API - Real AI mode active')
    } else {
      console.log('[Nexus] No API key found - will try proxy or simulation')
    }

    // Check proxy availability on startup
    this.checkProxyHealth()
  }

  /**
   * Check if Claude Code proxy is available (uses Max subscription)
   * Skips check entirely in production when no proxy URL is configured
   */
  private async checkProxyHealth(): Promise<boolean> {
    // No proxy configured (production without VITE_PROXY_URL) — skip entirely
    if (!PROXY_URL) {
      this.proxyAvailable = false
      return false
    }

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
        console.log('[Nexus] Claude Code Proxy available - using Max subscription (FREE)')
        this.useSimulation = false
      }

      return this.proxyAvailable
    } catch {
      this.proxyAvailable = false
      this.lastProxyCheck = now
      return false
    }
  }

  /**
   * Director Agent: Analyze user request and understand intent
   * This replaces the keyword-based detectIntent() method
   */
  async analyzeIntent(message: string, context?: { persona?: string; history?: string[] }): Promise<IntentAnalysis> {
    if (this.useSimulation) {
      return this.simulateIntentAnalysis(message, context)
    }

    try {
      const response = await this.callClaudeAPI('director', `
Analyze this user request and provide structured understanding:

User Request: "${message}"
${context?.persona ? `User Persona: ${context.persona}` : ''}
${context?.history?.length ? `Previous conversation: ${context.history.slice(-3).join('\n')}` : ''}

Available automation tools:
${EMBEDDED_TOOLS.map(t => `- ${t.id}: ${t.name} - ${t.description}`).join('\n')}

Respond with JSON in this exact format:
{
  "intent": "primary intent name (e.g., trip_planning, price_monitoring, email_automation)",
  "domain": "one of: travel, business, finance, productivity, communication, personal",
  "confidence": 0.0-1.0,
  "understanding": "one sentence explaining what the user wants to achieve",
  "extractedInfo": { "key": "value" for any information found in the request },
  "missingInfo": ["list", "of", "missing", "required", "information"],
  "suggestedTools": ["tool_ids", "that", "would", "help"],
  "complexity": "simple, medium, or complex"
}`)

      return this.parseIntentAnalysis(response)
    } catch (error) {
      console.error('Nexus Director analysis error:', error)
      return this.simulateIntentAnalysis(message, context)
    }
  }

  /**
   * Analyst Agent: Generate smart questions based on intent analysis
   * This replaces the fixed generateSmartQuestions() method
   */
  async generateQuestions(intent: IntentAnalysis, knownInfo: Record<string, string>): Promise<SmartNexusQuestion[]> {
    if (this.useSimulation) {
      return this.simulateQuestionGeneration(intent, knownInfo)
    }

    try {
      const response = await this.callClaudeAPI('analyst', `
Based on this intent analysis, generate simple questions to gather missing information.

IMPORTANT: The user is NON-TECHNICAL. Questions must be:
- Written in plain, everyday English (no jargon)
- Friendly and conversational (like asking a friend)
- Short and easy to understand
- Using common words instead of technical terms

Intent: ${intent.intent}
Understanding: ${intent.understanding}
Domain: ${intent.domain}
Already Known: ${JSON.stringify(knownInfo)}
Missing Info: ${intent.missingInfo.join(', ')}

Rules:
1. Only ask questions for TRULY required information
2. Maximum 3 questions
3. Prioritize questions that unlock the most value
4. Use simple, everyday language (avoid "trigger", "API", "automation", "URL", etc.)
5. Include friendly options for select-type questions
6. Consider what can be reasonably inferred
7. Write like you're having a casual conversation

Good examples:
- "Where would you like to go?" (not "What is the destination parameter?")
- "How often should I check?" (not "What frequency should the automation run at?")
- "Who should I send the results to?" (not "Configure notification recipients")

Respond with JSON array:
[
  {
    "id": "field_name",
    "question": "Simple, friendly question",
    "purpose": "Simple explanation of why needed",
    "type": "text|select|number|date|confirm",
    "options": ["Friendly option 1", "Friendly option 2"] (only for select type),
    "placeholder": "helpful example",
    "required": true/false,
    "inferrable": true/false if could be inferred from context
  }
]`)

      return this.parseQuestions(response)
    } catch (error) {
      console.error('Nexus Analyst error:', error)
      return this.simulateQuestionGeneration(intent, knownInfo)
    }
  }

  /**
   * Builder Agent: Generate workflow based on collected information
   * This replaces the template-based generateWorkflow() method
   */
  async buildWorkflow(request: WorkflowRequest): Promise<GeneratedWorkflow> {
    if (this.useSimulation) {
      return this.simulateWorkflowGeneration(request)
    }

    try {
      const response = await this.callClaudeAPI('builder', `
Create an optimal automation workflow based on these requirements:

User Intent: ${request.intent.intent}
Understanding: ${request.intent.understanding}
Domain: ${request.intent.domain}
Complexity: ${request.intent.complexity}

Collected Information:
${JSON.stringify(request.collectedInfo, null, 2)}

Available Tools:
${EMBEDDED_TOOLS.map(t => `- ${t.id} (${t.icon}): ${t.name} - ${t.capabilities.join(', ')}`).join('\n')}

Create a workflow that:
1. Solves the user's specific problem efficiently
2. Uses appropriate tools from the available list
3. Has logical flow with proper dependencies - NOT just sequential steps
4. Includes loops for repetitive processes (e.g., "for each item", "retry on failure", "daily monitoring")
5. Uses conditions for decision points (e.g., "if threshold exceeded", "if error occurs")
6. Shows where steps connect back to earlier steps for loops or retries
7. Maximizes time savings

IMPORTANT FLOW DESIGN:
- Connections should reflect ACTUAL workflow logic, not just step 1→2→3→4
- Include loop-backs where a step revisits an earlier step (e.g., "process next item" → back to "get item")
- Show branching for conditions (e.g., success path vs error path)
- A step can have multiple incoming AND outgoing connections

Respond with JSON:
{
  "name": "Workflow name",
  "description": "What this workflow does",
  "nodes": [
    {
      "id": "unique_id",
      "type": "trigger|action|condition|output",
      "tool": "tool_id from available tools",
      "name": "Step name",
      "description": "What this step does",
      "config": { configuration object }
    }
  ],
  "connections": [
    {"from": "node_id", "to": "node_id"},
    {"from": "later_step", "to": "earlier_step", "label": "loop: next item"}
  ],
  "requiredIntegrations": ["tool_ids"],
  "estimatedTimeSaved": "X hours per week/day",
  "complexity": "simple|medium|complex"
}`)

      return this.parseWorkflow(response, request)
    } catch (error) {
      console.error('Nexus Builder error:', error)
      return this.simulateWorkflowGeneration(request)
    }
  }

  /**
   * Call Claude API with agent system prompt - tries proxy first, then direct API
   */
  private async callClaudeAPI(agent: NexusAgent, userMessage: string): Promise<string> {
    // Try 1: Claude Code Proxy (FREE via Max subscription)
    const proxyAvailable = await this.checkProxyHealth()
    if (proxyAvailable) {
      try {
        console.log(`[Nexus ${agent.toUpperCase()}] Using Claude Code Proxy (FREE)...`)
        return await this.callViaProxy(agent, userMessage)
      } catch (error: any) {
        console.warn(`[Nexus] Proxy failed, trying direct API:`, error.message)
      }
    }

    // Try 2: Direct Anthropic API
    if (this.client) {
      try {
        console.log(`[Nexus ${agent.toUpperCase()}] Processing via direct API...`)

        const message = await this.client.messages.create({
          model: 'claude-opus-4-6-20250115',
          max_tokens: 4096,
          system: NEXUS_AGENT_PROMPTS[agent],
          messages: [{ role: 'user', content: userMessage }]
        })

        // Extract text content from response
        const textContent = message.content
          .filter((block): block is Anthropic.TextBlock => block.type === 'text')
          .map(block => block.text)
          .join('\n')

        console.log(`[Nexus ${agent.toUpperCase()}] Response received (${message.usage.output_tokens} tokens)`)

        return textContent
      } catch (error: any) {
        console.warn(`[Nexus] Direct API failed:`, error.message)
        // Fall through to throw
      }
    }

    throw new Error('No API available - will use simulation')
  }

  /**
   * Call Claude via proxy server (uses Max subscription)
   */
  private async callViaProxy(agent: NexusAgent, userMessage: string): Promise<string> {
    const response = await fetch(`${PROXY_URL}/api/nexus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent,
        userMessage,
        context: { systemPrompt: NEXUS_AGENT_PROMPTS[agent] }
      })
    })

    if (!response.ok) {
      throw new Error(`Proxy error: ${response.status}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Proxy execution failed')
    }

    console.log(`[Nexus ${agent.toUpperCase()}] Response via proxy (FREE via Max subscription)`)

    return result.output
  }

  /**
   * Parse intent analysis from Claude response
   */
  private parseIntentAnalysis(response: string): IntentAnalysis {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      throw new Error('No JSON found in response')
    } catch {
      // Return default analysis on parse error
      return {
        intent: 'general_automation',
        domain: 'productivity',
        confidence: 0.5,
        understanding: 'User wants to automate a task',
        extractedInfo: {},
        missingInfo: ['task_details'],
        suggestedTools: ['playwright', 'gmail'],
        complexity: 'medium'
      }
    }
  }

  /**
   * Parse questions from Claude response
   */
  private parseQuestions(response: string): SmartNexusQuestion[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      return []
    } catch {
      return []
    }
  }

  /**
   * Parse workflow from Claude response
   */
  private parseWorkflow(response: string, request: WorkflowRequest): GeneratedWorkflow {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          id: `workflow-${Date.now()}`,
          name: parsed.name || 'Custom Workflow',
          description: parsed.description || request.intent.understanding,
          nodes: this.convertNodes(parsed.nodes || []),
          connections: parsed.connections || [],
          requiredIntegrations: parsed.requiredIntegrations || request.intent.suggestedTools,
          estimatedTimeSaved: parsed.estimatedTimeSaved || '1-2 hours',
          complexity: parsed.complexity || request.intent.complexity
        }
      }
      throw new Error('No JSON found')
    } catch {
      return this.simulateWorkflowGeneration(request)
    }
  }

  /**
   * Convert parsed nodes to proper WorkflowNode format
   */
  private convertNodes(nodes: any[]): WorkflowNode[] {
    return nodes.map((node, index) => {
      const tool = EMBEDDED_TOOLS.find(t => t.id === node.tool)
      return {
        id: node.id || String(index + 1),
        type: node.type || 'action',
        tool: node.tool || 'playwright',
        toolIcon: tool?.icon || '🔧',
        name: node.name || `Step ${index + 1}`,
        description: node.description || '',
        config: node.config || {},
        position: { x: 100 + index * 200, y: 200 }
      }
    })
  }

  // ============================================================
  // SIMULATION METHODS (when API key is not available)
  // These provide intelligent fallback behavior
  // ============================================================

  /**
   * Simulate intent analysis using enhanced pattern matching
   * This is smarter than simple keyword counting
   */
  private simulateIntentAnalysis(message: string, _context?: { persona?: string; history?: string[] }): IntentAnalysis {
    const messageLower = message.toLowerCase()

    // Define intent patterns with semantic understanding
    const intentPatterns = [
      {
        intent: 'trip_planning',
        domain: 'travel' as const,
        patterns: [
          /(?:plan|planning|book|going to|visiting|travel(?:ing)?)\s+(?:to|a)?\s*(?:trip|vacation|holiday)/i,
          /(?:trip|vacation|travel)\s+to\s+(\w+)/i,
          /(?:anniversary|honeymoon|birthday|getaway)/i,
          /(?:ski(?:ing)?|beach|mountain|resort)/i,
          /(?:fly(?:ing)?|flight)\s+to/i
        ],
        extractors: {
          destination: /(?:to|in|at|visit(?:ing)?)\s+([A-Z][a-zA-Z\s]+?)(?:\s+(?:for|in|next|this)|[.,!?]|$)/i,
          dates: /(?:in\s+)?(\d+)\s+(?:day|week|month)s?|(?:next|this)\s+(?:week|month|weekend)|(\w+\s+\d{1,2}(?:st|nd|rd|th)?)/i,
          occasion: /(anniversary|honeymoon|birthday|graduation|retirement)/i
        }
      },
      {
        intent: 'price_monitoring',
        domain: 'business' as const,
        patterns: [
          /(?:monitor|track|watch|check)\s+(?:competitor|product|market)?\s*prices?/i,
          /(?:competitor|pricing|price)\s+(?:analysis|tracking|monitoring|intelligence)/i,
          /(?:alert|notify)\s+(?:me|us)?\s*(?:when|if)\s+price/i,
          /(?:price\s+)?(?:drops?|changes?|fluctuat)/i
        ],
        extractors: {
          target_url: /(https?:\/\/[^\s]+)|(?:on\s+)(\w+\.com)/i,
          frequency: /(hourly|daily|weekly|real.?time|every\s+\d+\s+(?:hour|minute))/i,
          price_threshold: /(\d+%?)\s+(?:change|drop|increase)/i
        }
      },
      {
        intent: 'trading_strategy',
        domain: 'finance' as const,
        patterns: [
          /(?:trading|trade|invest(?:ing)?)\s+(?:strategy|system|bot)/i,
          /(?:stock|crypto|forex|bitcoin|ethereum)\s+(?:trading|signals?|alerts?)/i,
          /(?:buy|sell)\s+(?:signals?|alerts?|when)/i,
          /(?:technical|fundamental)\s+analysis/i,
          /(?:portfolio|market)\s+(?:monitor|track|alert)/i
        ],
        extractors: {
          asset_type: /(stock|crypto|forex|options|commodities|bitcoin|ethereum)/i,
          strategy_goal: /(day\s*trading|swing|scalping|position|long.?term)/i
        }
      },
      {
        intent: 'email_automation',
        domain: 'communication' as const,
        patterns: [
          /(?:automate|schedule|send)\s+(?:emails?|newsletters?)/i,
          /(?:email|mail)\s+(?:campaign|sequence|followup)/i,
          /(?:auto.?reply|out.?of.?office|automated\s+response)/i
        ],
        extractors: {
          trigger: /(daily|weekly|when\s+\w+|after\s+\w+)/i,
          recipients: /(?:to|for)\s+([a-zA-Z@.,\s]+?)(?:\s+(?:about|with)|$)/i
        }
      },
      {
        intent: 'data_tracking',
        domain: 'business' as const,
        patterns: [
          /(?:track|monitor|watch)\s+(?:changes?|updates?|modifications?)/i,
          /(?:excel|spreadsheet|accounting)\s+(?:tracking|changes|updates)/i,
          /(?:daily|weekly)\s+(?:report|summary|digest)/i,
          /(?:notify|alert)\s+(?:me|team)?\s*(?:when|about)\s+(?:changes?|updates?)/i
        ],
        extractors: {
          data_source: /(excel|spreadsheet|google\s*sheets?|database|api)/i,
          frequency: /(hourly|daily|weekly|real.?time)/i
        }
      },
      {
        intent: 'content_automation',
        domain: 'productivity' as const,
        patterns: [
          /(?:automate|schedule|post)\s+(?:content|posts?)/i,
          /(?:social\s*media|twitter|linkedin|instagram)\s+(?:automation|posting|schedule)/i,
          /(?:blog|article)\s+(?:publish|schedule)/i
        ],
        extractors: {
          platform: /(twitter|linkedin|instagram|facebook|blog|tiktok)/i,
          content_type: /(text|image|video|article|thread)/i
        }
      },
      {
        intent: 'research_automation',
        domain: 'productivity' as const,
        patterns: [
          /(?:research|analyze|study|investigate)\s+(?:about|on|into)?/i,
          /(?:market|competitor|industry)\s+(?:research|analysis)/i,
          /(?:gather|collect|find)\s+(?:information|data|insights)/i
        ],
        extractors: {
          topic: /(?:research|analyze|study)\s+(?:about|on)?\s*(.+?)(?:\s+and|\s+to|$)/i,
          sources: /(web|news|social|reports?|all)/i
        }
      },
      {
        intent: 'lead_management',
        domain: 'business' as const,
        patterns: [
          /(?:lead|prospect|customer)\s+(?:management|tracking|nurturing)/i,
          /(?:qualify|score|route)\s+leads?/i,
          /(?:crm|sales)\s+(?:automation|pipeline)/i
        ],
        extractors: {
          lead_source: /(website|linkedin|referral|cold|event)/i,
          qualification_criteria: /(budget|timeline|authority|need)/i
        }
      },
      {
        intent: 'web_scraping',
        domain: 'productivity' as const,
        patterns: [
          /(?:scrape|extract|crawl|collect)\s+(?:data|information)?\s*(?:from)?\s*(?:website|web|page)?/i,
          /(?:website|web)\s+(?:scraping|extraction|monitoring)/i
        ],
        extractors: {
          target_url: /(https?:\/\/[^\s]+)/i,
          data_to_extract: /(?:extract|scrape|get)\s+(.+?)(?:\s+from|$)/i
        }
      },
      {
        intent: 'testing_monitoring',
        domain: 'productivity' as const,
        patterns: [
          /(?:test|check|monitor)\s+(?:my|our|the)?\s*(?:website|app|application|site)/i,
          /(?:uptime|availability)\s+(?:monitoring|check)/i,
          /(?:broken|working|functional)\s+(?:links?|pages?|features?)/i
        ],
        extractors: {
          target: /(https?:\/\/[^\s]+)|(?:my|our)\s+(\w+)/i,
          frequency: /(hourly|daily|every\s+\d+\s+(?:hour|minute))/i
        }
      },
      {
        intent: 'sales_growth',
        domain: 'business' as const,
        patterns: [
          /(?:increase|boost|grow|improve|double|triple)\s+(?:my|our|the)?\s*sales?/i,
          /(?:get|find|generate|capture)\s+(?:more|new)?\s*(?:leads?|customers?|clients?)/i,
          /(?:sales|revenue|income)\s+(?:growth|increase|boost)/i,
          /(?:grow|scale|expand)\s+(?:my|our|the)?\s*(?:business|company|startup)/i,
          /(?:marketing|advertis|promot)\s+(?:my|our)?\s*(?:business|company|product|service)/i,
          /(?:reach|attract|acquire)\s+(?:more|new)?\s*(?:customers?|clients?|prospects?)/i,
          /(?:outreach|prospecting|cold\s*email)/i
        ],
        extractors: {
          business_type: /(?:my|our)\s+(\w+(?:\s+\w+)?)\s+(?:company|business|firm|agency|startup)/i,
          // Fixed: word boundary, explicit case handling, proper capital-starting location capture
          location: /\b(?:based |located )?(?:[Ii]n|[Aa]t|[Ff]rom)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)(?:[.,!?\s]|$)/,
          target_audience: /(?:to|for|targeting)\s+([a-zA-Z\s]+?)(?:\s+(?:in|from|who)|[.,!?]|$)/i,
          goal: /(increase|grow|double|triple|boost|improve)\s+/i
        }
      },
      {
        intent: 'customer_followup',
        domain: 'business' as const,
        patterns: [
          /(?:follow\s*up|check\s*in)\s+(?:with|on)?\s*(?:customers?|clients?|leads?|prospects?)/i,
          /(?:customer|client)\s+(?:retention|engagement|nurturing)/i,
          /(?:remind|notify|alert)\s+(?:customers?|clients?)/i,
          /(?:appointment|meeting)\s+(?:reminders?|follow\s*ups?)/i
        ],
        extractors: {
          trigger: /(daily|weekly|after\s+\w+|when\s+\w+)/i,
          channel: /(email|whatsapp|sms|call|message)/i
        }
      },
      {
        intent: 'social_media_marketing',
        domain: 'business' as const,
        patterns: [
          /(?:post|share|publish)\s+(?:on|to)\s+(?:social|instagram|facebook|linkedin|twitter|tiktok)/i,
          /(?:social\s*media)\s+(?:marketing|presence|strategy|management)/i,
          /(?:grow|build|increase)\s+(?:my|our)?\s*(?:followers?|audience|reach|presence)/i,
          /(?:content|posts?)\s+(?:schedule|planning|calendar)/i
        ],
        extractors: {
          platform: /(instagram|facebook|linkedin|twitter|tiktok|youtube)/i,
          content_type: /(posts?|stories?|reels?|videos?|articles?)/i,
          frequency: /(daily|weekly|every\s+day)/i
        }
      },
      {
        intent: 'competitor_analysis',
        domain: 'business' as const,
        patterns: [
          /(?:track|monitor|watch|spy\s+on)\s+(?:my|our)?\s*competitors?/i,
          /(?:competitor|competitive)\s+(?:analysis|intelligence|tracking|research)/i,
          /(?:what|how)\s+(?:are|is)\s+(?:my|our)?\s*competitors?\s+(?:doing|pricing)/i,
          /(?:market|industry)\s+(?:trends?|analysis|research)/i
        ],
        extractors: {
          competitor_names: /(?:competitors?|companies?|brands?)\s+(?:like|such\s+as|including)\s+([a-zA-Z,\s]+)/i,
          aspect: /(pricing|products?|marketing|social|website)/i
        }
      }
    ]

    // Find best matching intent
    let bestMatch: {
      intent: string
      domain: 'travel' | 'business' | 'finance' | 'productivity' | 'communication' | 'personal'
      confidence: number
      extractedInfo: Record<string, string>
      missingInfo: string[]
      suggestedTools: string[]
    } = {
      intent: 'general_automation',
      domain: 'productivity',
      confidence: 0,
      extractedInfo: {},
      missingInfo: ['task_details'],
      suggestedTools: ['playwright', 'gmail']
    }

    for (const pattern of intentPatterns) {
      let matchScore = 0

      for (const regex of pattern.patterns) {
        if (regex.test(messageLower)) {
          matchScore += 1
        }
      }

      // Extract information using extractors
      const extracted: Record<string, string> = {}
      for (const [key, extractor] of Object.entries(pattern.extractors)) {
        const match = message.match(extractor)
        if (match) {
          extracted[key] = match[1] || match[0]
          matchScore += 0.5 // Bonus for extracted info
        }
      }

      if (matchScore > bestMatch.confidence) {
        bestMatch = {
          intent: pattern.intent,
          domain: pattern.domain,
          confidence: Math.min(matchScore / pattern.patterns.length, 1),
          extractedInfo: extracted,
          missingInfo: this.determineMissingInfo(pattern.intent, extracted),
          suggestedTools: this.getSuggestedTools(pattern.intent)
        }
      }
    }

    // Generate understanding based on analysis
    const understanding = this.generateUnderstanding(bestMatch.intent, bestMatch.extractedInfo)

    return {
      intent: bestMatch.intent,
      domain: bestMatch.domain,
      confidence: bestMatch.confidence,
      understanding,
      extractedInfo: bestMatch.extractedInfo,
      missingInfo: bestMatch.missingInfo,
      suggestedTools: bestMatch.suggestedTools,
      complexity: this.determineComplexity(bestMatch.intent, bestMatch.missingInfo)
    }
  }

  /**
   * Determine what information is still missing
   */
  private determineMissingInfo(intent: string, extracted: Record<string, string>): string[] {
    const requiredFields: Record<string, string[]> = {
      trip_planning: ['destination', 'dates'],
      price_monitoring: ['target_url', 'frequency'],
      trading_strategy: ['asset_type', 'strategy_goal'],
      email_automation: ['trigger', 'recipients'],
      data_tracking: ['data_source', 'frequency'],
      content_automation: ['platform', 'content_type'],
      research_automation: ['topic', 'sources'],
      lead_management: ['lead_source', 'qualification_criteria'],
      web_scraping: ['target_url', 'data_to_extract'],
      testing_monitoring: ['target', 'frequency'],
      sales_growth: ['sales_strategy'], // Only 1 question needed - we can infer the rest
      customer_followup: ['channel'],
      social_media_marketing: ['platform'],
      competitor_analysis: []  // Can build immediately with what we have
    }

    const required = requiredFields[intent] || ['task_details']
    return required.filter(field => !extracted[field])
  }

  /**
   * Get suggested tools for an intent
   */
  private getSuggestedTools(intent: string): string[] {
    const toolMap: Record<string, string[]> = {
      trip_planning: ['skyscanner', 'booking_hotels', 'google_maps', 'yelp', 'google_calendar', 'gmail'],
      price_monitoring: ['playwright', 'google_sheets', 'slack', 'gmail'],
      trading_strategy: ['playwright', 'google_sheets', 'slack', 'gmail'],
      email_automation: ['gmail', 'google_sheets', 'google_calendar'],
      data_tracking: ['excel_processor', 'gmail', 'slack', 'google_sheets'],
      content_automation: ['playwright', 'notion', 'google_sheets', 'gmail'],
      research_automation: ['playwright', 'notion', 'google_sheets', 'gmail'],
      lead_management: ['gmail', 'google_sheets', 'slack', 'google_calendar'],
      web_scraping: ['playwright', 'google_sheets', 'gmail'],
      testing_monitoring: ['playwright', 'slack', 'gmail'],
      // New business/sales intents
      sales_growth: ['gmail', 'google_sheets', 'linkedin', 'whatsapp', 'playwright', 'slack'],
      customer_followup: ['gmail', 'whatsapp', 'google_calendar', 'google_sheets', 'slack'],
      social_media_marketing: ['instagram', 'facebook', 'linkedin', 'playwright', 'google_sheets', 'notion'],
      competitor_analysis: ['playwright', 'google_sheets', 'slack', 'gmail', 'notion']
    }
    return toolMap[intent] || ['playwright', 'gmail', 'google_sheets']
  }

  /**
   * Generate human-readable understanding
   */
  private generateUnderstanding(intent: string, info: Record<string, string>): string {
    const templates: Record<string, (info: Record<string, string>) => string> = {
      trip_planning: (i) => `Plan a trip${i.destination ? ` to ${i.destination}` : ''}${i.dates ? ` around ${i.dates}` : ''}${i.occasion ? ` for ${i.occasion}` : ''}`,
      price_monitoring: (i) => `Monitor and track${i.target_url ? ` prices on ${i.target_url}` : ' competitor prices'}${i.frequency ? ` ${i.frequency}` : ''}`,
      trading_strategy: (i) => `Set up ${i.asset_type || 'trading'} ${i.strategy_goal || 'alerts and signals'}`,
      email_automation: (i) => `Automate email ${i.trigger || 'workflow'}${i.recipients ? ` for ${i.recipients}` : ''}`,
      data_tracking: (i) => `Track changes in ${i.data_source || 'data sources'}${i.frequency ? ` ${i.frequency}` : ''}`,
      content_automation: (i) => `Automate ${i.content_type || 'content'} posting${i.platform ? ` on ${i.platform}` : ''}`,
      research_automation: (i) => `Research and analyze${i.topic ? ` ${i.topic}` : ' the topic'}`,
      lead_management: (i) => `Manage and qualify leads${i.lead_source ? ` from ${i.lead_source}` : ''}`,
      web_scraping: (i) => `Extract data${i.target_url ? ` from ${i.target_url}` : ' from websites'}`,
      testing_monitoring: (i) => `Monitor and test${i.target ? ` ${i.target}` : ' your application'}`,
      // New business/sales intents
      sales_growth: (i) => `Grow sales${i.business_type ? ` for your ${i.business_type}` : ''}${i.location ? ` in ${i.location}` : ''} through automated outreach and lead generation`,
      customer_followup: (i) => `Automate customer follow-ups${i.channel ? ` via ${i.channel}` : ''} to improve retention and close more deals`,
      social_media_marketing: (i) => `Build social media presence${i.platform ? ` on ${i.platform}` : ''} with automated posting and engagement tracking`,
      competitor_analysis: (i) => `Track and analyze competitor activity${i.aspect ? ` (${i.aspect})` : ''} to stay ahead in the market`
    }

    const template = templates[intent]
    return template ? template(info) : 'Create an automation workflow'
  }

  /**
   * Determine workflow complexity
   */
  private determineComplexity(intent: string, missingInfo: string[]): 'simple' | 'medium' | 'complex' {
    const complexIntents = ['trading_strategy', 'research_automation', 'lead_management']
    const simpleIntents = ['web_scraping', 'testing_monitoring']

    if (complexIntents.includes(intent) || missingInfo.length > 3) return 'complex'
    if (simpleIntents.includes(intent) && missingInfo.length < 2) return 'simple'
    return 'medium'
  }

  /**
   * Simulate question generation based on intent
   */
  private simulateQuestionGeneration(intent: IntentAnalysis, knownInfo: Record<string, string>): SmartNexusQuestion[] {
    const questions: SmartNexusQuestion[] = []

    // Question templates based on missing info - Simple, non-technical language
    const questionTemplates: Record<string, Partial<SmartNexusQuestion>> = {
      destination: {
        question: "Where would you like to go?",
        type: 'text',
        placeholder: 'e.g., Aspen, Colorado',
        purpose: 'To find the best travel options for you'
      },
      dates: {
        question: "When are you planning this?",
        type: 'text',
        placeholder: 'e.g., March 15-22, 2025',
        purpose: 'To check availability and make reservations'
      },
      target_url: {
        question: "Which website should I watch for you?",
        type: 'text',
        placeholder: 'e.g., amazon.com/product-page',
        purpose: 'So I know where to look for changes'
      },
      frequency: {
        question: "How often should I check?",
        type: 'select',
        options: ['Every few minutes', 'Every hour', 'Once a day', 'Once a week'],
        purpose: 'To know when to run your task'
      },
      asset_type: {
        question: "What are you interested in trading?",
        type: 'select',
        options: ['Stocks', 'Cryptocurrency', 'Currency exchange', 'Options', 'A mix of these'],
        purpose: 'To set up the right monitoring for you'
      },
      strategy_goal: {
        question: "What would you like help with?",
        type: 'select',
        options: ['Quick buy/sell alerts', 'Finding good opportunities', 'Tracking my investments', 'Price notifications', 'Market analysis'],
        purpose: 'To customize your workflow'
      },
      platform: {
        question: "Where would you like to post?",
        type: 'select',
        options: ['Twitter/X', 'LinkedIn', 'Instagram', 'Multiple places'],
        purpose: 'To connect to the right accounts'
      },
      content_type: {
        question: "What kind of posts?",
        type: 'select',
        options: ['Text only', 'With images', 'Videos', 'Blog articles', 'Different types'],
        purpose: 'To prepare the right format'
      },
      topic: {
        question: "What would you like me to research?",
        type: 'text',
        placeholder: 'e.g., industry trends, competitor news',
        purpose: 'To find relevant information for you'
      },
      sources: {
        question: "Where should I look for information?",
        type: 'select',
        options: ['Search the web', 'News websites', 'Social media', 'Business reports', 'Everywhere'],
        purpose: 'To know where to search'
      },
      lead_source: {
        question: "How do people usually contact you?",
        type: 'select',
        options: ['Through my website', 'On LinkedIn', 'I reach out to them', 'Through referrals', 'At events', 'Multiple ways'],
        purpose: 'To capture leads from the right places'
      },
      qualification_criteria: {
        question: "What makes a lead worth following up on?",
        type: 'text',
        placeholder: 'e.g., interested in premium service, budget over $5000',
        purpose: 'To identify your best opportunities'
      },
      data_source: {
        question: "Where is your information stored?",
        type: 'select',
        options: ['Excel files', 'Google Sheets', 'A company system', 'On a website', 'Other software'],
        purpose: 'To connect to your data'
      },
      trigger: {
        question: "When should this start running?",
        type: 'select',
        options: ['On a schedule (daily/weekly)', 'When I get a new email', 'When someone fills a form', 'When I tell it to'],
        purpose: 'To know when to start your task'
      },
      recipients: {
        question: "Who should I send the results to?",
        type: 'text',
        placeholder: 'e.g., your email or team@company.com',
        purpose: 'So you get notified of results'
      },
      target: {
        question: "What should I keep an eye on?",
        type: 'text',
        placeholder: 'e.g., competitor website, news page',
        purpose: 'To monitor the right thing for you'
      },
      data_to_extract: {
        question: "What information do you need from there?",
        type: 'text',
        placeholder: 'e.g., prices, headlines, contact info',
        purpose: 'So I grab the right details'
      },
      budget: {
        question: "What's your budget for this?",
        type: 'text',
        placeholder: 'e.g., $500-1000',
        purpose: 'To find options within your range'
      },
      travelers: {
        question: "How many people are going?",
        type: 'text',
        placeholder: 'e.g., 2 adults, 1 child',
        purpose: 'To book the right capacity'
      },
      preferences: {
        question: "Any special preferences or requirements?",
        type: 'text',
        placeholder: 'e.g., vegetarian meals, window seat',
        purpose: 'To customize to your needs'
      },
      email_address: {
        question: "What's your email address?",
        type: 'text',
        placeholder: 'your@email.com',
        purpose: 'To send you updates and confirmations'
      },
      channel: {
        question: "How would you like to reach your customers?",
        type: 'select',
        options: ['Email', 'WhatsApp', 'SMS', 'Phone call', 'Multiple channels'],
        purpose: 'To set up the right communication method'
      },
      // New fields for business/sales intents
      sales_strategy: {
        question: "What approach works best for your business?",
        type: 'select',
        options: ['Cold outreach (find new leads)', 'Follow up with existing contacts', 'Social media marketing', 'Content & SEO', 'All of the above'],
        purpose: 'To create the most effective sales automation'
      },
      business_type: {
        question: "What type of business do you run?",
        type: 'text',
        placeholder: 'e.g., interior design, restaurant, consulting',
        purpose: 'To customize the workflow for your industry'
      },
      location: {
        question: "Where are you based or targeting?",
        type: 'text',
        placeholder: 'e.g., Kuwait, Dubai, New York',
        purpose: 'To focus on the right market'
      },
      competitor_names: {
        question: "Which competitors would you like to track?",
        type: 'text',
        placeholder: 'e.g., Company A, Company B',
        purpose: 'To monitor specific businesses'
      },
      aspect: {
        question: "What aspect of competitors interests you most?",
        type: 'select',
        options: ['Their pricing', 'Their marketing', 'Their products/services', 'Their social media', 'Everything'],
        purpose: 'To focus the analysis'
      }
    }

    // Generate questions only for missing info
    for (const field of intent.missingInfo) {
      if (!knownInfo[field] && questionTemplates[field]) {
        const template = questionTemplates[field]
        questions.push({
          id: field,
          question: template.question || `What is the ${field.replace(/_/g, ' ')}?`,
          purpose: template.purpose || 'Required for workflow',
          type: template.type as any || 'text',
          options: template.options,
          placeholder: template.placeholder,
          required: true
        })
      }
    }

    // Limit to 3 questions max
    return questions.slice(0, 3)
  }

  /**
   * Simulate workflow generation
   */
  private simulateWorkflowGeneration(request: WorkflowRequest): GeneratedWorkflow {
    const { intent, collectedInfo } = request

    // Build workflow dynamically based on intent and tools
    const nodes: WorkflowNode[] = []
    const connections: Array<{ from: string; to: string; label?: string }> = []
    let nodeId = 1

    // Add trigger node
    const triggerTool = this.getTriggerTool(intent.intent, collectedInfo)
    nodes.push({
      id: String(nodeId),
      type: 'trigger',
      tool: triggerTool.id,
      toolIcon: triggerTool.icon,
      name: this.getTriggerName(intent.intent, collectedInfo),
      description: this.getTriggerDescription(intent.intent, collectedInfo),
      config: { ...collectedInfo },
      position: { x: 100, y: 200 }
    })

    // Add action nodes based on suggested tools
    const actionTools = intent.suggestedTools.filter(t => t !== triggerTool.id).slice(0, 5)
    let conditionNodeId: string | null = null
    let loopStartId: string | null = null

    for (let i = 0; i < actionTools.length; i++) {
      const toolId = actionTools[i]
      const tool = EMBEDDED_TOOLS.find(t => t.id === toolId)
      if (tool) {
        nodeId++
        const prevId = String(nodeId - 1)
        const isCondition = i === Math.floor(actionTools.length / 2) && actionTools.length > 3
        const isLoopStart = i === 1 && actionTools.length > 2

        // Mark loop start for later
        if (isLoopStart) {
          loopStartId = String(nodeId)
        }

        nodes.push({
          id: String(nodeId),
          type: isCondition ? 'condition' : (i === actionTools.length - 1 ? 'output' : 'action'),
          tool: tool.id,
          toolIcon: tool.icon,
          name: isCondition ? `Check ${this.getConditionName(intent.intent)}` : this.getActionName(tool, intent.intent),
          description: this.getActionDescription(tool, intent.intent, collectedInfo),
          config: { ...collectedInfo },
          position: { x: 100 + (nodeId - 1) * 200, y: isCondition ? 150 : 200 }
        })

        if (isCondition) {
          conditionNodeId = String(nodeId)
        }

        connections.push({ from: prevId, to: String(nodeId) })
      }
    }

    // Add loop-back connection for iterative workflows
    if (loopStartId && nodes.length > 3) {
      const lastActionNode = nodes[nodes.length - 2] // Node before output
      if (lastActionNode && lastActionNode.type === 'action') {
        connections.push({
          from: lastActionNode.id,
          to: loopStartId,
          label: 'loop: next item'
        })
      }
    }

    // Add branch from condition if exists
    if (conditionNodeId && nodes.length > 2) {
      // Condition can skip to output on failure
      const outputNode = nodes.find(n => n.type === 'output')
      if (outputNode) {
        connections.push({
          from: conditionNodeId,
          to: outputNode.id,
          label: 'skip on error'
        })
      }
    }

    return {
      id: `workflow-${Date.now()}`,
      name: this.getWorkflowName(intent, collectedInfo),
      description: intent.understanding,
      nodes,
      connections,
      requiredIntegrations: intent.suggestedTools,
      estimatedTimeSaved: this.estimateTimeSaved(intent.intent),
      complexity: intent.complexity
    }
  }

  /**
   * Get condition name based on intent
   */
  private getConditionName(intent: string): string {
    const names: Record<string, string> = {
      trip_planning: 'Availability',
      price_monitoring: 'Price Threshold',
      trading_strategy: 'Trading Signal',
      email_automation: 'Response Status',
      data_tracking: 'Data Changed',
      content_automation: 'Content Ready',
      research_automation: 'Results Found',
      lead_management: 'Lead Qualified',
      web_scraping: 'Data Valid',
      testing_monitoring: 'Test Passed'
    }
    return names[intent] || 'Condition'
  }

  /**
   * Get appropriate trigger tool
   */
  private getTriggerTool(intent: string, _info: Record<string, string>): IntegrationTool {
    const triggerMap: Record<string, string> = {
      trip_planning: 'user_input',
      price_monitoring: 'scheduler',
      trading_strategy: 'scheduler',
      email_automation: 'gmail',
      data_tracking: 'scheduler',
      content_automation: 'scheduler',
      research_automation: 'user_input',
      lead_management: 'webhook',
      web_scraping: 'scheduler',
      testing_monitoring: 'scheduler',
      // New business/sales intents
      sales_growth: 'scheduler',
      customer_followup: 'scheduler',
      social_media_marketing: 'scheduler',
      competitor_analysis: 'scheduler'
    }

    const toolId = triggerMap[intent] || 'scheduler'
    return EMBEDDED_TOOLS.find(t => t.id === toolId) || {
      id: 'scheduler',
      name: 'Scheduler',
      category: 'scheduling',
      description: 'Schedule automated tasks',
      capabilities: ['schedule'],
      icon: '⏰'
    }
  }

  /**
   * Get trigger node name
   */
  private getTriggerName(intent: string, info: Record<string, string>): string {
    const names: Record<string, string> = {
      trip_planning: 'Trip Request',
      price_monitoring: `Price Check (${info.frequency || 'Hourly'})`,
      trading_strategy: 'Market Monitor',
      email_automation: 'Email Trigger',
      data_tracking: `${info.frequency || 'Daily'} Scan`,
      content_automation: 'Content Schedule',
      research_automation: 'Research Request',
      lead_management: 'Lead Capture',
      web_scraping: 'Scrape Schedule',
      testing_monitoring: 'Monitor Schedule',
      // New business/sales intents
      sales_growth: 'Daily Sales Outreach',
      customer_followup: 'Follow-up Schedule',
      social_media_marketing: 'Content Calendar',
      competitor_analysis: 'Competitor Watch'
    }
    return names[intent] || 'Trigger'
  }

  /**
   * Get trigger description
   */
  private getTriggerDescription(intent: string, info: Record<string, string>): string {
    if (intent === 'trip_planning') {
      return `Trip to ${info.destination || 'destination'}`
    }
    return `Runs ${info.frequency || 'on schedule'}`
  }

  /**
   * Get action node name
   */
  private getActionName(tool: IntegrationTool, intent: string): string {
    const contextNames: Record<string, Record<string, string>> = {
      price_monitoring: {
        playwright: 'Scrape Prices',
        google_sheets: 'Log Price Data',
        slack: 'Price Alert',
        gmail: 'Price Report'
      },
      trading_strategy: {
        playwright: 'Fetch Market Data',
        google_sheets: 'Track Portfolio',
        slack: 'Trading Signal',
        gmail: 'Daily Summary'
      },
      trip_planning: {
        skyscanner: 'Search Flights',
        booking_hotels: 'Find Hotels',
        google_maps: 'Local Spots',
        yelp: 'Restaurants',
        google_calendar: 'Create Itinerary',
        gmail: 'Send Plan'
      }
    }

    return contextNames[intent]?.[tool.id] || tool.name
  }

  /**
   * Get action description
   */
  private getActionDescription(tool: IntegrationTool, intent: string, info: Record<string, string>): string {
    if (tool.id === 'playwright' && intent === 'price_monitoring') {
      return `Extract prices from ${info.target_url || 'target website'}`
    }
    if (tool.id === 'google_sheets') {
      return 'Store and analyze data'
    }
    if (tool.id === 'slack') {
      return 'Send team notification'
    }
    if (tool.id === 'gmail') {
      return 'Email report'
    }
    return tool.description
  }

  /**
   * Generate workflow name
   */
  private getWorkflowName(intent: IntentAnalysis, info: Record<string, string>): string {
    const nameTemplates: Record<string, (info: Record<string, string>) => string> = {
      trip_planning: (i) => `${i.occasion ? i.occasion.charAt(0).toUpperCase() + i.occasion.slice(1) + ' ' : ''}Trip to ${i.destination || 'Destination'}`,
      price_monitoring: () => 'Competitor Price Monitoring',
      trading_strategy: (i) => `${i.asset_type || 'Trading'} Strategy - ${i.strategy_goal || 'Signals'}`,
      email_automation: () => 'Automated Email Campaign',
      data_tracking: () => 'Automated Change Tracking',
      content_automation: (i) => `${i.platform || 'Social'} Content Automation`,
      research_automation: (i) => `Research: ${i.topic || 'Topic'}`,
      lead_management: () => 'Lead Management Automation',
      web_scraping: () => 'Automated Web Scraping',
      testing_monitoring: () => 'Automated Testing & Monitoring',
      // New business/sales intents
      sales_growth: (i) => `Sales Growth${i.business_type ? ` - ${i.business_type}` : ''}${i.location ? ` (${i.location})` : ''}`,
      customer_followup: (i) => `Customer Follow-up${i.channel ? ` via ${i.channel}` : ' Automation'}`,
      social_media_marketing: (i) => `${i.platform || 'Social Media'} Marketing Automation`,
      competitor_analysis: () => 'Competitor Intelligence Dashboard'
    }

    const template = nameTemplates[intent.intent]
    return template ? template(info) : 'Custom Workflow'
  }

  /**
   * Estimate time saved
   */
  private estimateTimeSaved(intent: string): string {
    const estimates: Record<string, string> = {
      trip_planning: '4-6 hours',
      price_monitoring: '3-5 hours per week',
      trading_strategy: '3-5 hours per day',
      email_automation: '2-4 hours per week',
      data_tracking: '2-3 hours per day',
      content_automation: '2-4 hours per day',
      research_automation: '4-8 hours per project',
      lead_management: '2-4 hours per day',
      web_scraping: '1-2 hours per run',
      testing_monitoring: '1-2 hours per day',
      // New business/sales intents
      sales_growth: '5-10 hours per week',
      customer_followup: '3-5 hours per week',
      social_media_marketing: '4-8 hours per week',
      competitor_analysis: '2-4 hours per week'
    }
    return estimates[intent] || '1-3 hours'
  }

  /**
   * Check if engine is configured with API client or proxy
   */
  isConfigured(): boolean {
    return !!this.client || this.proxyAvailable === true
  }

  /**
   * Get engine status
   */
  getStatus(): { configured: boolean; mode: 'proxy' | 'api' | 'simulation'; proxyAvailable: boolean } {
    let mode: 'proxy' | 'api' | 'simulation' = 'simulation'
    if (this.proxyAvailable) mode = 'proxy'
    else if (this.client && !this.useSimulation) mode = 'api'

    return {
      configured: this.isConfigured(),
      mode,
      proxyAvailable: this.proxyAvailable === true
    }
  }
}

// Export singleton instance
export const nexusWorkflowEngine = new NexusWorkflowEngine()
