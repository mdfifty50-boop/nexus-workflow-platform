/**
 * NexusWorkflowEngine - AI-powered intelligent workflow generation
 *
 * Nexus methodology:
 * 1. Director: Understand user intent through AI reasoning
 * 2. Analyst: Generate smart questions for missing information
 * 3. Builder: Construct optimal workflows based on collected context
 *
 * Uses Claude Code proxy for AI capabilities (FREE with Max subscription)
 */

import { smartWorkflowEngine, type GeneratedWorkflow, EMBEDDED_TOOLS } from './SmartWorkflowEngine'

// Re-export GeneratedWorkflow for consumers
export type { GeneratedWorkflow }

// Intent analysis result from Nexus Director
export interface IntentAnalysis {
  intent: string
  domain: string
  confidence: number
  understanding: string
  extractedInfo: Record<string, string>
  missingInfo: string[]
  suggestedTools: string[]
  complexity: 'simple' | 'medium' | 'complex'
}

// Smart question from Nexus Analyst
export interface SmartNexusQuestion {
  id: string
  question: string
  purpose: string
  type: 'text' | 'choice' | 'multi-select' | 'date' | 'number'
  placeholder?: string
  options?: Array<{ value: string; label: string }>
  required: boolean
}

// Build workflow parameters
interface BuildWorkflowParams {
  intent: IntentAnalysis
  collectedInfo: Record<string, string>
  userMessage: string
  persona: string
}

// Claude Code proxy configuration - uses env var, skips entirely if not configured in production
const PROXY_URL = import.meta.env.VITE_PROXY_URL || (import.meta.env.PROD ? '' : 'http://localhost:4567')

export class NexusWorkflowEngine {
  private proxyAvailable: boolean | null = null
  private lastProxyCheck = 0
  private readonly PROXY_CHECK_INTERVAL = 30000 // 30 seconds

  /**
   * Check if Claude Code proxy is available
   * Skips check entirely in production when no proxy URL is configured
   */
  private async checkProxyHealth(): Promise<boolean> {
    // No proxy configured (production without VITE_PROXY_URL) — skip entirely
    if (!PROXY_URL) {
      this.proxyAvailable = false
      return false
    }

    const now = Date.now()
    if (this.proxyAvailable !== null && (now - this.lastProxyCheck) < this.PROXY_CHECK_INTERVAL) {
      return this.proxyAvailable
    }

    try {
      this.lastProxyCheck = now
      const response = await fetch(`${PROXY_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      })
      this.proxyAvailable = response.ok
      if (this.proxyAvailable) {
        console.log('[NexusWorkflowEngine] Claude Code Proxy available - using Max subscription (FREE)')
      }
      return this.proxyAvailable
    } catch {
      this.proxyAvailable = false
      return false
    }
  }

  /**
   * Call Claude via proxy
   */
  private async callProxy(prompt: string, systemPrompt?: string): Promise<string> {
    const response = await fetch(`${PROXY_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        systemPrompt,
        maxTokens: 2000
      })
    })

    if (!response.ok) {
      throw new Error(`Proxy error: ${response.status}`)
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || 'Proxy call failed')
    }

    return result.output
  }

  /**
   * Nexus Director: Analyze user intent using AI reasoning
   */
  async analyzeIntent(
    message: string,
    options: { persona?: string; history?: string[] } = {}
  ): Promise<IntentAnalysis> {
    // First try AI-powered analysis via proxy
    const proxyAvailable = await this.checkProxyHealth()
    if (proxyAvailable) {
      try {
        const prompt = `Analyze this user request and extract their intent:
"${message}"

${options.persona ? `User persona: ${options.persona}` : ''}
${options.history?.length ? `Recent context: ${options.history.slice(-2).join(' | ')}` : ''}

Available tools: ${EMBEDDED_TOOLS.map(t => t.id).join(', ')}

Respond with JSON only:
{
  "intent": "short_intent_name",
  "domain": "business|travel|productivity|communication|data|finance",
  "confidence": 0.0-1.0,
  "understanding": "One sentence summary of what user wants",
  "extractedInfo": {"key": "value extracted from message"},
  "missingInfo": ["info_needed_1", "info_needed_2"],
  "suggestedTools": ["tool_id_1", "tool_id_2"],
  "complexity": "simple|medium|complex"
}`

        const output = await this.callProxy(
          prompt,
          'You are Nexus Director, an AI that understands user workflow automation needs. Always respond with valid JSON only.'
        )

        const jsonMatch = output.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          console.log('[NexusWorkflowEngine] Intent analysis via AI (FREE)')
          return {
            intent: parsed.intent || 'general_automation',
            domain: parsed.domain || 'productivity',
            confidence: Math.min(1, Math.max(0, parsed.confidence || 0.7)),
            understanding: parsed.understanding || 'Automate a task',
            extractedInfo: parsed.extractedInfo || {},
            missingInfo: parsed.missingInfo || [],
            suggestedTools: parsed.suggestedTools || ['gmail', 'google_sheets'],
            complexity: parsed.complexity || 'medium'
          }
        }
      } catch (e) {
        console.warn('[NexusWorkflowEngine] Proxy call failed, using fallback:', e)
      }
    }

    // Fallback: keyword-based intent detection
    return this.fallbackIntentAnalysis(message, options)
  }

  /**
   * Fallback intent analysis using keyword matching
   */
  private fallbackIntentAnalysis(
    message: string,
    _options: { persona?: string; history?: string[] } = {}
  ): IntentAnalysis {
    void _options
    const messageLower = message.toLowerCase()
    const extractedInfo: Record<string, string> = {}

    // Extract common entities
    const emailMatch = message.match(/[\w.-]+@[\w.-]+\.\w+/)
    if (emailMatch) extractedInfo.email = emailMatch[0]

    const urlMatch = message.match(/https?:\/\/[^\s]+/)
    if (urlMatch) extractedInfo.url = urlMatch[0]

    const dateMatch = message.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\/\d{1,2}|\d{1,2}-\d{1,2}|tomorrow|next week)\b/i)
    if (dateMatch) extractedInfo.date = dateMatch[0]

    // Detect intent categories - ORDER MATTERS (more specific intents first)
    let intent = 'general_automation'
    let domain = 'productivity'
    let suggestedTools: string[] = ['gmail', 'google_sheets']
    let complexity: 'simple' | 'medium' | 'complex' = 'medium'

    // Calendar & Meeting Management (HIGH PRIORITY - check first)
    if (messageLower.includes('meeting') || messageLower.includes('calendar') ||
        messageLower.includes('schedule') || messageLower.includes('appointment') ||
        messageLower.includes('manage my time') || messageLower.includes('agenda') ||
        messageLower.includes('availability') || messageLower.includes('organize my day')) {
      intent = 'calendar_management'
      domain = 'productivity'
      suggestedTools = ['google_calendar', 'gmail', 'slack', 'notion']
    // Email automation
    } else if (messageLower.includes('email') || messageLower.includes('mail')) {
      intent = 'email_automation'
      domain = 'communication'
      suggestedTools = ['gmail', 'google_sheets', 'slack']
    // Travel - only for explicit travel keywords (not just "meeting")
    } else if (messageLower.includes('flight') || messageLower.includes('travel') ||
               messageLower.includes('trip') || messageLower.includes('ski') ||
               messageLower.includes('vacation') || messageLower.includes('hotel')) {
      intent = 'trip_planning'
      domain = 'travel'
      suggestedTools = ['skyscanner', 'booking', 'google_calendar', 'gmail']
      complexity = 'complex'
    // Conference travel - requires explicit conference/business trip context
    } else if ((messageLower.includes('conference') && messageLower.includes('trip')) ||
               messageLower.includes('business trip')) {
      intent = 'conference_travel'
      domain = 'travel'
      suggestedTools = ['skyscanner', 'booking_hotels', 'google_calendar', 'yelp']
      complexity = 'complex'
    } else if (messageLower.includes('sales') || messageLower.includes('lead') || messageLower.includes('customer')) {
      intent = 'sales_growth'
      domain = 'business'
      suggestedTools = ['gmail', 'google_sheets', 'linkedin', 'slack']
    } else if (messageLower.includes('social') || messageLower.includes('post') || messageLower.includes('instagram') || messageLower.includes('linkedin')) {
      intent = 'social_media_marketing'
      domain = 'business'
      suggestedTools = ['instagram', 'linkedin', 'facebook', 'playwright']
    } else if (messageLower.includes('scrape') || messageLower.includes('monitor') || messageLower.includes('track')) {
      intent = 'web_scraping'
      domain = 'data'
      suggestedTools = ['playwright', 'google_sheets', 'gmail']
    } else if (messageLower.includes('report') || messageLower.includes('summarize') || messageLower.includes('data')) {
      intent = 'data_tracking'
      domain = 'data'
      suggestedTools = ['google_sheets', 'gmail', 'slack']
    }

    // Determine missing info based on intent
    const missingInfo: string[] = []
    if (intent === 'calendar_management') missingInfo.push('meeting_type')
    if (intent === 'trip_planning' && !extractedInfo.destination) missingInfo.push('destination')
    if (intent === 'trip_planning' && !extractedInfo.date) missingInfo.push('dates')
    if (intent === 'conference_travel' && !extractedInfo.destination) missingInfo.push('location', 'dates')
    if (intent === 'email_automation' && !extractedInfo.email) missingInfo.push('recipients')
    if (intent === 'sales_growth') missingInfo.push('target_audience', 'sales_strategy')

    return {
      intent,
      domain,
      confidence: Object.keys(extractedInfo).length > 0 ? 0.6 : 0.4,
      understanding: this.generateUnderstanding(intent, extractedInfo),
      extractedInfo,
      missingInfo,
      suggestedTools,
      complexity
    }
  }

  private generateUnderstanding(intent: string, info: Record<string, string>): string {
    const understandings: Record<string, string> = {
      calendar_management: 'Intelligently manage your meetings, schedule, and calendar',
      email_automation: 'Automate email workflows for better communication',
      trip_planning: `Plan a trip${info.destination ? ` to ${info.destination}` : ''}`,
      conference_travel: `Plan conference travel${info.destination ? ` to ${info.destination}` : ''}`,
      sales_growth: 'Grow sales through automated outreach and lead generation',
      social_media_marketing: 'Automate social media presence and engagement',
      web_scraping: 'Extract and monitor data from websites automatically',
      data_tracking: 'Track changes in data and generate automated reports',
      general_automation: 'Create an automated workflow to save you time'
    }
    return understandings[intent] || understandings.general_automation
  }

  /**
   * Nexus Analyst: Generate smart questions for missing information
   * Uses AI when available to generate contextual questions
   */
  async generateQuestions(
    intent: IntentAnalysis,
    extractedInfo: Record<string, string>
  ): Promise<SmartNexusQuestion[]> {
    // First, try AI-powered question generation for better context
    const proxyAvailable = await this.checkProxyHealth()
    if (proxyAvailable && intent.missingInfo.length > 0) {
      try {
        const prompt = `Generate 2-3 essential questions to gather missing information for this workflow:

Intent: ${intent.intent}
Understanding: ${intent.understanding}
Domain: ${intent.domain}
Missing info needed: ${intent.missingInfo.join(', ')}
Already have: ${JSON.stringify(extractedInfo)}

For each question, I need SPECIFIC details that make the workflow actionable.
For example:
- If monitoring prices: ask for the SPECIFIC website URL
- If sending alerts: ask for the SPECIFIC Slack channel name
- If tracking sales: ask for the data source (spreadsheet URL, CRM name)

Respond with JSON array only:
[
  {
    "id": "unique_id",
    "question": "Clear, specific question",
    "purpose": "Why this is needed",
    "type": "text",
    "placeholder": "Example answer",
    "required": true
  }
]`

        const output = await this.callProxy(
          prompt,
          'You are Nexus Analyst. Generate minimal but essential questions to create a working workflow. Always ask for SPECIFIC URLs, names, or identifiers - never generic questions. Respond with JSON only.'
        )

        const jsonMatch = output.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log('[NexusWorkflowEngine] Questions generated via AI (FREE)')
            return parsed.slice(0, 3).map((q: any) => ({
              id: q.id || `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              question: q.question,
              purpose: q.purpose || 'To customize your workflow',
              type: q.type || 'text',
              placeholder: q.placeholder,
              options: q.options,
              required: q.required !== false
            }))
          }
        }
      } catch (e) {
        console.warn('[NexusWorkflowEngine] AI question generation failed, using fallback:', e)
      }
    }

    // Fallback: Use template-based questions
    const questions: SmartNexusQuestion[] = []

    // Generate questions based on missing info
    for (const missing of intent.missingInfo) {
      // Skip if we already have this info
      if (extractedInfo[missing]) continue

      const question = this.createQuestionForMissing(missing, intent)
      if (question) questions.push(question)
    }

    // If no template questions but we have missing info, create generic but useful questions
    if (questions.length === 0 && intent.missingInfo.length > 0) {
      // Create context-aware fallback questions
      const domainQuestions = this.createDomainSpecificQuestions(intent)
      questions.push(...domainQuestions)
    }

    // Limit to 3 most important questions
    return questions.slice(0, 3)
  }

  /**
   * Create domain-specific fallback questions when templates don't match
   */
  private createDomainSpecificQuestions(intent: IntentAnalysis): SmartNexusQuestion[] {
    const questions: SmartNexusQuestion[] = []

    // Web scraping / monitoring intents
    if (intent.intent.includes('monitor') || intent.intent.includes('scrape') ||
        intent.intent.includes('track') || intent.intent.includes('price')) {
      questions.push({
        id: 'target_url',
        question: "What's the specific website URL to monitor?",
        purpose: 'To set up the monitoring automation',
        type: 'text',
        placeholder: 'e.g., https://competitor.com/pricing',
        required: true
      })
    }

    // Notification / alert intents
    if (intent.intent.includes('alert') || intent.intent.includes('notify') ||
        intent.suggestedTools.includes('slack')) {
      questions.push({
        id: 'notification_channel',
        question: "Which Slack channel should receive alerts?",
        purpose: 'To send notifications to the right place',
        type: 'text',
        placeholder: 'e.g., #alerts, #sales-team',
        required: true
      })
    }

    // Email intents
    if (intent.suggestedTools.includes('gmail') &&
        (intent.intent.includes('email') || intent.intent.includes('send'))) {
      questions.push({
        id: 'email_recipients',
        question: "Who should receive the emails?",
        purpose: 'To set up email recipients',
        type: 'text',
        placeholder: 'e.g., team@company.com or a list description',
        required: true
      })
    }

    // Data/spreadsheet intents
    if (intent.suggestedTools.includes('google_sheets')) {
      questions.push({
        id: 'spreadsheet_url',
        question: "What's the Google Sheets URL to use?",
        purpose: 'To connect to your spreadsheet',
        type: 'text',
        placeholder: 'e.g., https://docs.google.com/spreadsheets/d/...',
        required: false
      })
    }

    // Frequency for recurring tasks
    if (intent.complexity !== 'simple' && questions.length < 3) {
      questions.push({
        id: 'frequency',
        question: "How often should this run?",
        purpose: 'To schedule the automation',
        type: 'choice',
        options: [
          { value: 'hourly', label: 'Every hour' },
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'realtime', label: 'Real-time (when changes occur)' }
        ],
        required: true
      })
    }

    return questions
  }

  private createQuestionForMissing(missing: string, _intent: IntentAnalysis): SmartNexusQuestion | null {
    void _intent
    const questionTemplates: Record<string, SmartNexusQuestion> = {
      destination: {
        id: 'destination',
        question: "Where would you like to go?",
        purpose: 'To search for the best flights and hotels',
        type: 'text',
        placeholder: 'e.g., Tokyo, Paris, New York',
        required: true
      },
      dates: {
        id: 'dates',
        question: "When are you planning to travel?",
        purpose: 'To find available options for your dates',
        type: 'text',
        placeholder: 'e.g., March 15-22, next weekend',
        required: true
      },
      recipients: {
        id: 'recipients',
        question: "Who should receive these emails?",
        purpose: 'To set up the email automation',
        type: 'text',
        placeholder: 'e.g., team@company.com, client list',
        required: true
      },
      target_audience: {
        id: 'target_audience',
        question: "Who is your target customer?",
        purpose: 'To personalize outreach for better results',
        type: 'text',
        placeholder: 'e.g., small business owners, tech startups',
        required: true
      },
      sales_strategy: {
        id: 'sales_strategy',
        question: "What's your primary sales approach?",
        purpose: 'To build the right automation flow',
        type: 'choice',
        options: [
          { value: 'cold_outreach', label: 'Cold email/LinkedIn outreach' },
          { value: 'lead_nurturing', label: 'Nurture existing leads' },
          { value: 'follow_up', label: 'Automated follow-ups' },
          { value: 'referral', label: 'Referral requests' }
        ],
        required: true
      },
      platform: {
        id: 'platform',
        question: "Which platform(s) do you want to focus on?",
        purpose: 'To set up the right integrations',
        type: 'choice',
        options: [
          { value: 'linkedin', label: 'LinkedIn' },
          { value: 'instagram', label: 'Instagram' },
          { value: 'twitter', label: 'Twitter/X' },
          { value: 'all', label: 'All platforms' }
        ],
        required: true
      },
      frequency: {
        id: 'frequency',
        question: "How often should this run?",
        purpose: 'To schedule the automation',
        type: 'choice',
        options: [
          { value: 'hourly', label: 'Every hour' },
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'monthly', label: 'Monthly' }
        ],
        required: true
      },
      target_url: {
        id: 'target_url',
        question: "What website or page should be monitored?",
        purpose: 'To set up the scraping automation',
        type: 'text',
        placeholder: 'e.g., https://competitor.com/pricing',
        required: true
      },
      data_source: {
        id: 'data_source',
        question: "Where is the data you want to track?",
        purpose: 'To connect to your data source',
        type: 'choice',
        options: [
          { value: 'google_sheets', label: 'Google Sheets' },
          { value: 'excel', label: 'Excel files' },
          { value: 'database', label: 'Database' },
          { value: 'api', label: 'API endpoint' }
        ],
        required: true
      },
      task_details: {
        id: 'task_details',
        question: "What specific task would you like to automate?",
        purpose: 'To create the right workflow for you',
        type: 'text',
        placeholder: 'e.g., send weekly reports, monitor prices',
        required: true
      },
      // Calendar & Meeting Management
      meeting_type: {
        id: 'meeting_type',
        question: "What types of meetings do you want to manage?",
        purpose: 'To customize your meeting automation',
        type: 'choice',
        options: [
          { value: 'all', label: 'All my meetings' },
          { value: 'team', label: 'Team meetings' },
          { value: 'one_on_one', label: '1:1 meetings' },
          { value: 'client', label: 'Client meetings' },
          { value: 'external', label: 'External meetings' }
        ],
        required: true
      },
      notification_preferences: {
        id: 'notification_preferences',
        question: "How would you like to receive reminders?",
        purpose: 'To set up notifications',
        type: 'choice',
        options: [
          { value: 'email', label: 'Email only' },
          { value: 'slack', label: 'Slack only' },
          { value: 'both', label: 'Both email and Slack' }
        ],
        required: false
      }
    }

    return questionTemplates[missing] || null
  }

  /**
   * Nexus Builder: Construct the optimal workflow
   */
  async buildWorkflow(params: BuildWorkflowParams): Promise<GeneratedWorkflow> {
    const { intent, collectedInfo, userMessage } = params

    // Try AI-powered workflow generation
    const proxyAvailable = await this.checkProxyHealth()
    if (proxyAvailable) {
      try {
        const prompt = `Create a workflow for this intent:
- Intent: ${intent.intent}
- Domain: ${intent.domain}
- Understanding: ${intent.understanding}
- User message: "${userMessage}"
- Collected info: ${JSON.stringify(collectedInfo)}
- Available tools: ${intent.suggestedTools.join(', ')}

Generate a workflow with 3-6 steps. Respond with JSON only:
{
  "name": "Workflow Name",
  "description": "What this workflow does",
  "nodes": [
    {
      "id": "1",
      "type": "trigger|action|condition|output",
      "tool": "tool_id",
      "toolIcon": "emoji",
      "name": "Step Name",
      "description": "What this step does",
      "config": {},
      "position": {"x": 100, "y": 200}
    }
  ],
  "connections": [{"from": "1", "to": "2"}],
  "requiredIntegrations": ["tool_id_1"],
  "estimatedTimeSaved": "X hours/week",
  "complexity": "simple|medium|complex"
}`

        const output = await this.callProxy(
          prompt,
          'You are Nexus Builder, an AI that creates workflow automations. Always respond with valid JSON only.'
        )

        const jsonMatch = output.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          console.log('[NexusWorkflowEngine] Workflow built via AI (FREE)')
          return {
            id: `workflow-${Date.now()}`,
            name: parsed.name || 'Custom Workflow',
            description: parsed.description || intent.understanding,
            nodes: parsed.nodes || [],
            connections: parsed.connections || [],
            requiredIntegrations: parsed.requiredIntegrations || intent.suggestedTools,
            estimatedTimeSaved: parsed.estimatedTimeSaved || '2 hours/week',
            complexity: parsed.complexity || intent.complexity
          }
        }
      } catch (e) {
        console.warn('[NexusWorkflowEngine] AI workflow generation failed, using fallback:', e)
      }
    }

    // Fallback: Use SmartWorkflowEngine's pattern-based generation
    const detectedIntent = smartWorkflowEngine.detectIntent(userMessage)
    if (detectedIntent) {
      return smartWorkflowEngine.generateWorkflow(detectedIntent, collectedInfo)
    }

    // Ultimate fallback: Generate generic workflow
    return this.generateGenericWorkflow(intent, collectedInfo)
  }

  private generateGenericWorkflow(intent: IntentAnalysis, info: Record<string, string>): GeneratedWorkflow {
    const tools = EMBEDDED_TOOLS.filter(t => intent.suggestedTools.includes(t.id))

    return {
      id: `workflow-${Date.now()}`,
      name: intent.understanding,
      description: `Automated workflow for ${intent.domain}`,
      nodes: tools.slice(0, 4).map((tool, i) => ({
        id: String(i + 1),
        type: i === 0 ? 'trigger' as const : i === tools.length - 1 ? 'output' as const : 'action' as const,
        tool: tool.id,
        toolIcon: tool.icon,
        name: tool.name,
        description: tool.description,
        config: info,
        position: { x: 100 + i * 200, y: 200 }
      })),
      connections: tools.slice(0, 3).map((_, i) => ({
        from: String(i + 1),
        to: String(i + 2)
      })),
      requiredIntegrations: tools.map(t => t.id),
      estimatedTimeSaved: '2 hours/week',
      complexity: intent.complexity
    }
  }
}

// Singleton instance
export const nexusWorkflowEngine = new NexusWorkflowEngine()
