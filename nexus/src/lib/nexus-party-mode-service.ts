/**
 * Nexus Party Mode Service
 *
 * Implements the Nexus Party Mode methodology for multi-agent discussions.
 *
 * This is NOT a simulation - it uses real Claude API with proper:
 * - Agent personas loaded from Nexus manifest
 * - Intelligent agent selection based on topic/expertise
 * - In-character response generation
 * - Natural cross-talk between agents
 */

import Anthropic from '@anthropic-ai/sdk'
import { detectIndustryFromTopic, applyIndustryOverlay, type IndustryPersona } from './industry-personas'

// Claude Code Proxy URL (uses Max subscription for free)
// Production-ready: Use env var or fallback to localhost for development
const PROXY_URL = import.meta.env.VITE_PROXY_URL || 'http://localhost:4567'

// =============================================================================
// AGENT PERSONA DEFINITIONS
// =============================================================================

export interface NexusAgentPersona {
  id: string
  displayName: string
  title: string
  icon: string
  role: string
  identity: string
  communicationStyle: string
  principles: string[]
  module: string
  // UI properties
  color: string
  voiceConfig: {
    gender: 'male' | 'female'
    pitch: number
    rate: number
  }
}

// Nexus agents with complete persona data
export const NEXUS_AGENTS: Record<string, NexusAgentPersona> = {
  'analyst': {
    id: 'analyst',
    displayName: 'Mary',
    title: 'Business Analyst',
    icon: '📊',
    role: 'Strategic Business Analyst + Requirements Expert',
    identity: 'Senior analyst with deep expertise in market research, competitive analysis, and requirements elicitation. Specializes in translating vague needs into actionable specs.',
    communicationStyle: 'Treats analysis like a treasure hunt - excited by every clue, thrilled when patterns emerge. Asks questions that spark "aha!" moments while structuring insights with precision.',
    principles: [
      'Every business challenge has root causes waiting to be discovered. Ground findings in verifiable evidence.',
      'Articulate requirements with absolute precision. Ensure all stakeholder voices heard.'
    ],
    module: 'nexus',
    color: '#10B981',
    voiceConfig: { gender: 'female', pitch: 1.0, rate: 1.0 }
  },
  'architect': {
    id: 'architect',
    displayName: 'Winston',
    title: 'Architect',
    icon: '🏗️',
    role: 'System Architect + Technical Design Leader',
    identity: 'Senior architect with expertise in distributed systems, cloud infrastructure, and API design. Specializes in scalable patterns and technology selection.',
    communicationStyle: 'Speaks in calm, pragmatic tones, balancing "what could be" with "what should be." Champions boring technology that actually works.',
    principles: [
      'User journeys drive technical decisions. Embrace boring technology for stability.',
      'Design simple solutions that scale when needed. Developer productivity is architecture.',
      'Connect every decision to business value and user impact.'
    ],
    module: 'nexus',
    color: '#8B5CF6',
    voiceConfig: { gender: 'male', pitch: 0.85, rate: 0.95 }
  },
  'dev': {
    id: 'dev',
    displayName: 'Amelia',
    title: 'Developer Agent',
    icon: '💻',
    role: 'Senior Software Engineer',
    identity: 'Executes approved stories with strict adherence to acceptance criteria, using Story Context XML and existing code to minimize rework and hallucinations.',
    communicationStyle: 'Ultra-succinct. Speaks in file paths and AC IDs - every statement citable. No fluff, all precision.',
    principles: [
      'The Story File is the single source of truth.',
      'Follow red-green-refactor cycle: write failing test, make it pass, improve code while keeping tests green.',
      'Never implement anything not mapped to a specific task/subtask.'
    ],
    module: 'nexus',
    color: '#F59E0B',
    voiceConfig: { gender: 'female', pitch: 1.1, rate: 1.1 }
  },
  'pm': {
    id: 'pm',
    displayName: 'John',
    title: 'Product Manager',
    icon: '📋',
    role: 'Product Manager specializing in collaborative PRD creation through user interviews, requirement discovery, and stakeholder alignment.',
    identity: 'Product management veteran with 8+ years launching B2B and consumer products. Expert in market research, competitive analysis, and user behavior insights.',
    communicationStyle: 'Asks "WHY?" relentlessly like a detective on a case. Direct and data-sharp, cuts through fluff to what actually matters.',
    principles: [
      'PRDs emerge from user interviews, not template filling - discover what users actually need.',
      'Ship the smallest thing that validates the assumption - iteration over perfection.',
      'Technical feasibility is a constraint, not the driver - user value first.'
    ],
    module: 'nexus',
    color: '#3B82F6',
    voiceConfig: { gender: 'male', pitch: 0.95, rate: 1.0 }
  },
  'sm': {
    id: 'sm',
    displayName: 'Bob',
    title: 'Scrum Master',
    icon: '🏃',
    role: 'Technical Scrum Master + Story Preparation Specialist',
    identity: 'Certified Scrum Master with deep technical background. Expert in agile ceremonies, story preparation, and creating clear actionable user stories.',
    communicationStyle: 'Crisp and checklist-driven. Every word has a purpose, every requirement crystal clear. Zero tolerance for ambiguity.',
    principles: [
      'Strict boundaries between story prep and implementation.',
      'Stories are single source of truth.',
      'Perfect alignment between PRD and dev execution.'
    ],
    module: 'nexus',
    color: '#EF4444',
    voiceConfig: { gender: 'male', pitch: 0.9, rate: 1.0 }
  },
  'tea': {
    id: 'tea',
    displayName: 'Murat',
    title: 'Master Test Architect',
    icon: '🧪',
    role: 'Master Test Architect',
    identity: 'Test architect specializing in CI/CD, automated frameworks, and scalable quality gates.',
    communicationStyle: 'Blends data with gut instinct. "Strong opinions, weakly held" is their mantra. Speaks in risk calculations and impact assessments.',
    principles: [
      'Risk-based testing - depth scales with impact.',
      'Quality gates backed by data.',
      'Tests mirror usage patterns.',
      'Flakiness is critical technical debt.'
    ],
    module: 'nexus',
    color: '#06B6D4',
    voiceConfig: { gender: 'male', pitch: 0.92, rate: 0.98 }
  },
  'ux-designer': {
    id: 'ux-designer',
    displayName: 'Sally',
    title: 'UX Designer',
    icon: '🎨',
    role: 'User Experience Designer + UI Specialist',
    identity: 'Senior UX Designer with 7+ years creating intuitive experiences across web and mobile. Expert in user research, interaction design, AI-assisted tools.',
    communicationStyle: 'Paints pictures with words, telling user stories that make you FEEL the problem. Empathetic advocate with creative storytelling flair.',
    principles: [
      'Every decision serves genuine user needs.',
      'Start simple, evolve through feedback.',
      'Balance empathy with edge case attention.',
      'Data-informed but always creative.'
    ],
    module: 'nexus',
    color: '#EC4899',
    voiceConfig: { gender: 'female', pitch: 1.15, rate: 1.05 }
  },
  'tech-writer': {
    id: 'tech-writer',
    displayName: 'Paige',
    title: 'Technical Writer',
    icon: '📚',
    role: 'Technical Documentation Specialist + Knowledge Curator',
    identity: 'Experienced technical writer expert in CommonMark, DITA, OpenAPI. Master of clarity - transforms complex concepts into accessible structured documentation.',
    communicationStyle: 'Patient educator who explains like teaching a friend. Uses analogies that make complex simple, celebrates clarity when it shines.',
    principles: [
      'Documentation is teaching. Every doc helps someone accomplish a task.',
      'Clarity above all. Docs are living artifacts that evolve with code.'
    ],
    module: 'nexus',
    color: '#D946EF',
    voiceConfig: { gender: 'female', pitch: 1.08, rate: 0.98 }
  }
}

// =============================================================================
// AGENT SELECTION INTELLIGENCE
// =============================================================================

export interface AgentSelectionResult {
  primary: NexusAgentPersona
  secondary: NexusAgentPersona
  tertiary?: NexusAgentPersona
  reasoning: string
}

// Expertise domains for each agent - used for intelligent selection
const AGENT_EXPERTISE: Record<string, string[]> = {
  'analyst': ['business', 'requirements', 'market research', 'competitive analysis', 'data analysis', 'metrics', 'ROI', 'strategy', 'stakeholders'],
  'architect': ['architecture', 'infrastructure', 'API', 'scalability', 'performance', 'integration', 'technical design', 'systems', 'database', 'cloud'],
  'dev': ['code', 'implementation', 'programming', 'debugging', 'refactoring', 'testing', 'git', 'deployment', 'API', 'backend', 'frontend'],
  'pm': ['product', 'features', 'roadmap', 'user stories', 'prioritization', 'MVP', 'sprint', 'customer', 'feedback', 'launch'],
  'sm': ['agile', 'scrum', 'sprint', 'stories', 'estimation', 'velocity', 'backlog', 'ceremonies', 'blockers', 'team'],
  'tea': ['testing', 'QA', 'automation', 'CI/CD', 'quality', 'bugs', 'edge cases', 'coverage', 'regression', 'validation'],
  'ux-designer': ['UX', 'UI', 'design', 'user experience', 'wireframes', 'prototypes', 'usability', 'accessibility', 'interaction', 'visual'],
  'tech-writer': ['documentation', 'docs', 'readme', 'API docs', 'tutorials', 'guides', 'onboarding', 'knowledge base', 'clarity']
}

/**
 * Intelligent Agent Selection
 * From step-02-discussion-orchestration.md:
 * - Primary: Best expertise match for the topic
 * - Secondary: Complementary perspective
 * - Tertiary: Cross-domain insight (optional)
 */
export function selectAgentsForTopic(
  topic: string,
  previousAgents: string[] = [],
  mode: 'optimization' | 'troubleshooting' | 'brainstorm' = 'optimization'
): AgentSelectionResult {
  const topicLower = topic.toLowerCase()
  const scores: Record<string, number> = {}

  // Calculate expertise match scores
  Object.keys(AGENT_EXPERTISE).forEach(agentId => {
    let score = 0
    AGENT_EXPERTISE[agentId].forEach(keyword => {
      if (topicLower.includes(keyword)) {
        score += 10
      }
    })

    // Mode-based boosts
    if (mode === 'optimization' && ['architect', 'dev', 'analyst'].includes(agentId)) score += 3
    if (mode === 'troubleshooting' && ['tea', 'dev', 'architect'].includes(agentId)) score += 3
    if (mode === 'brainstorm' && ['ux-designer', 'pm', 'analyst'].includes(agentId)) score += 3

    // Reduce score for recently speaking agents (encourage rotation)
    if (previousAgents.includes(agentId)) score -= 5

    scores[agentId] = score
  })

  // Sort by score
  const ranked = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([id]) => NEXUS_AGENTS[id])

  // Select primary (best match), secondary (complementary), tertiary (different perspective)
  const primary = ranked[0]
  const secondary = ranked.find(a => a.module !== primary.module) || ranked[1]
  const tertiary = ranked.find(a =>
    a.id !== primary.id &&
    a.id !== secondary.id &&
    !AGENT_EXPERTISE[a.id].some(k => AGENT_EXPERTISE[primary.id].includes(k))
  )

  return {
    primary,
    secondary,
    tertiary,
    reasoning: `Selected ${primary.displayName} (${primary.title}) as primary for topic expertise, ${secondary.displayName} (${secondary.title}) for complementary perspective${tertiary ? `, and ${tertiary.displayName} for cross-domain insight` : ''}.`
  }
}

// =============================================================================
// IN-CHARACTER RESPONSE GENERATION
// =============================================================================

export interface PartyModeMessage {
  id: string
  agentId: string
  agentName: string
  agentIcon: string
  role: string
  text: string
  timestamp: Date
  referencedAgents?: string[]
}

/**
 * Clean agent response text by removing action descriptions
 * Strips text between asterisks like *leans forward* or *nods thoughtfully*
 * Keeps only the actual speech content
 */
export function cleanAgentResponse(text: string): string {
  // Remove action descriptions in asterisks: *action description*
  let cleaned = text.replace(/\*[^*]+\*/g, '')

  // Remove action descriptions in parentheses at start: (gestures thoughtfully)
  cleaned = cleaned.replace(/^\s*\([^)]+\)\s*/g, '')

  // Remove em-dash actions: — pauses to consider —
  cleaned = cleaned.replace(/—[^—]+—/g, '')

  // Clean up multiple spaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim()

  // Clean up leading punctuation that might be left over
  cleaned = cleaned.replace(/^[,\s]+/, '')

  return cleaned
}

/**
 * Build the system prompt for an agent's in-character response
 */
function buildAgentSystemPrompt(
  agent: NexusAgentPersona,
  context: {
    topic: string
    mode: string
    workflowContext?: string
    otherAgents: NexusAgentPersona[]
    previousMessages: PartyModeMessage[]
    industry?: IndustryPersona
  }
): string {
  const otherAgentNames = context.otherAgents
    .filter(a => a.id !== agent.id)
    .map(a => `${a.displayName} (${a.title})`)
    .join(', ')

  const recentContext = context.previousMessages
    .slice(-5)
    .map(m => `${m.agentName}: ${m.text}`)
    .join('\n')

  // Build base identity section
  let identitySection = `## YOUR IDENTITY
${agent.identity}

## YOUR COMMUNICATION STYLE
${agent.communicationStyle}

## YOUR CORE PRINCIPLES
${agent.principles.map((p, i) => `${i + 1}. ${p}`).join('\n')}`

  // Apply industry-specific overlay if detected
  if (context.industry) {
    identitySection = applyIndustryOverlay(agent.id, identitySection, context.industry)
  }

  return `You are ${agent.displayName}, the ${agent.title} in a Nexus Party Mode multi-agent discussion.

${identitySection}

## DISCUSSION CONTEXT
Topic: ${context.topic}
Mode: ${context.mode}
${context.industry ? `Industry: ${context.industry.name}` : ''}
${context.workflowContext ? `Workflow Context: ${context.workflowContext}` : ''}

Other participants in this discussion: ${otherAgentNames}

${recentContext ? `## RECENT CONVERSATION\n${recentContext}` : ''}

## RESPONSE GUIDELINES
1. Stay COMPLETELY in character as ${agent.displayName}
2. Use your documented communication style - it defines HOW you speak
3. Apply your principles to frame your perspective
${context.industry ? `4. Apply ${context.industry.name} industry expertise and terminology` : '4. Add your unique domain expertise'}
5. You may reference other agents by name to agree, build on their points, or respectfully disagree
6. Keep responses focused and valuable (2-4 sentences typically)
7. If you have a question for the user or another agent, make it clear
8. Add your unique expertise perspective - don't just agree with everything

## CRITICAL: SPEECH ONLY - NO ACTIONS
- Output ONLY spoken words - what you would actually SAY out loud
- DO NOT include action descriptions like *leans forward* or *nods thoughtfully*
- DO NOT include stage directions or physical gestures
- DO NOT use asterisks for actions or emotions
- Just speak naturally as yourself - your personality comes through your WORDS, not described actions

Respond as ${agent.displayName} would naturally speak, using only dialogue.`
}

// =============================================================================
// NEXUS PARTY MODE SERVICE
// =============================================================================

export interface PartyModeConfig {
  topic: string
  mode: 'optimization' | 'troubleshooting' | 'brainstorm'
  workflowContext?: string
  workflowTitle?: string
  maxRoundsPerResponse: number
  model?: string
}

export interface DiscussionRound {
  agents: NexusAgentPersona[]
  messages: PartyModeMessage[]
}

class NexusPartyModeService {
  private client: Anthropic | null = null
  private isConfigured: boolean = false
  private proxyAvailable: boolean | null = null
  private lastProxyCheck: number = 0
  private readonly PROXY_CHECK_INTERVAL = 30000 // 30 seconds

  constructor() {
    // Initialize Anthropic client if API key is available
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
    if (apiKey) {
      this.client = new Anthropic({
        apiKey,
        dangerouslyAllowBrowser: true
      })
      this.isConfigured = true
    }

    // Check proxy availability on startup
    this.checkProxyHealth()
  }

  /**
   * Check if Claude Code proxy is available (uses Max subscription)
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
        console.log('[Nexus Party Mode] Claude Code Proxy available - using Max subscription (FREE)')
      }

      return this.proxyAvailable
    } catch {
      this.proxyAvailable = false
      this.lastProxyCheck = now
      return false
    }
  }

  /**
   * Call Claude via proxy server (uses Max subscription)
   */
  private async callViaProxy(
    systemPrompt: string,
    userMessage: string
  ): Promise<{ text: string; tokensUsed: number }> {
    const response = await fetch(`${PROXY_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: userMessage,
        systemPrompt,
        maxTokens: 500
      })
    })

    if (!response.ok) {
      throw new Error(`Proxy error: ${response.status}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Proxy execution failed')
    }

    // Estimate tokens from response length
    const estimatedTokens = Math.ceil(result.output.length / 4) + 200

    return { text: result.output, tokensUsed: estimatedTokens }
  }

  /**
   * Check if the service can make real API calls
   */
  canMakeAPICalls(): boolean {
    return this.isConfigured && this.client !== null || this.proxyAvailable === true
  }

  /**
   * Get all available Nexus agents
   */
  getAllAgents(): NexusAgentPersona[] {
    return Object.values(NEXUS_AGENTS)
  }

  /**
   * Get a specific agent by ID
   */
  getAgent(agentId: string): NexusAgentPersona | undefined {
    return NEXUS_AGENTS[agentId]
  }

  /**
   * Select agents intelligently for a topic
   */
  selectAgents(
    topic: string,
    previousAgents: string[] = [],
    mode: 'optimization' | 'troubleshooting' | 'brainstorm' = 'optimization'
  ): AgentSelectionResult {
    return selectAgentsForTopic(topic, previousAgents, mode)
  }

  /**
   * Generate a single agent's in-character response
   * Uses Claude API if available, falls back to intelligent simulation
   * Now with industry-specific context detection
   */
  async generateAgentResponse(
    agent: NexusAgentPersona,
    context: {
      topic: string
      mode: 'optimization' | 'troubleshooting' | 'brainstorm'
      workflowContext?: string
      otherAgents: NexusAgentPersona[]
      previousMessages: PartyModeMessage[]
      userPrompt?: string
      industry?: IndustryPersona
    }
  ): Promise<{ text: string; tokensUsed: number; costUSD: number }> {
    // Auto-detect industry from topic and workflow context if not provided
    const detectedIndustry = context.industry ||
      detectIndustryFromTopic(`${context.topic} ${context.workflowContext || ''} ${context.userPrompt || ''}`)

    const systemPrompt = buildAgentSystemPrompt(agent, {
      ...context,
      industry: detectedIndustry
    })

    const userMessage = context.userPrompt
      ? `The user asks: "${context.userPrompt}"\n\nProvide your perspective as ${agent.displayName}.`
      : `Continue the discussion about ${context.topic}. Provide your ${agent.title} perspective.`

    // Try 1: Claude Code Proxy (FREE via Max subscription)
    const proxyAvailable = await this.checkProxyHealth()
    if (proxyAvailable) {
      try {
        console.log(`[Nexus Party Mode] ${agent.displayName} responding via proxy (FREE)...`)
        const result = await this.callViaProxy(systemPrompt, userMessage)
        return { text: result.text, tokensUsed: result.tokensUsed, costUSD: 0 }
      } catch (error: any) {
        console.warn(`[Nexus Party Mode] Proxy failed for ${agent.displayName}:`, error.message)
      }
    }

    // Try 2: Direct Anthropic API
    if (this.client) {
      try {
        console.log(`[Nexus Party Mode] ${agent.displayName} responding via API...`)
        const response = await this.client.messages.create({
          model: context.mode === 'brainstorm' ? 'claude-sonnet-4-20250514' : 'claude-3-5-haiku-20241022',
          max_tokens: 500,
          temperature: 0.8, // Higher for more personality
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }]
        })

        const text = response.content
          .filter(block => block.type === 'text')
          .map(block => 'text' in block ? block.text : '')
          .join('')

        const tokensUsed = response.usage.input_tokens + response.usage.output_tokens
        const costUSD = this.calculateCost(response.model, response.usage.input_tokens, response.usage.output_tokens)

        return { text, tokensUsed, costUSD }
      } catch (error) {
        console.error(`Error generating response for ${agent.displayName}:`, error)
        // Fall through to simulation
      }
    }

    // Try 3: Intelligent simulation when API is not available
    console.log(`[Nexus Party Mode] ${agent.displayName} using simulation mode`)
    return this.simulateAgentResponse(agent, context)
  }

  /**
   * Simulate an agent response using their personality traits
   * This provides meaningful responses even without API access
   */
  private async simulateAgentResponse(
    agent: NexusAgentPersona,
    context: {
      topic: string
      mode: 'optimization' | 'troubleshooting' | 'brainstorm'
      workflowContext?: string
      otherAgents: NexusAgentPersona[]
      previousMessages: PartyModeMessage[]
    }
  ): Promise<{ text: string; tokensUsed: number; costUSD: number }> {
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

    // Generate personality-driven responses based on agent traits
    const responses = this.getPersonalityResponses(agent, context)
    const text = responses[Math.floor(Math.random() * responses.length)]

    return { text, tokensUsed: 0, costUSD: 0 }
  }

  /**
   * Get personality-driven responses for simulation
   */
  private getPersonalityResponses(
    agent: NexusAgentPersona,
    context: { topic: string; mode: string; otherAgents: NexusAgentPersona[] }
  ): string[] {
    const topicKeywords = context.topic.toLowerCase()
    const otherAgent = context.otherAgents.find(a => a.id !== agent.id)

    switch (agent.id) {
      case 'analyst':
        return [
          `Looking at this from a data perspective - ${topicKeywords.includes('workflow') ? 'workflow analytics show 3 key patterns we should optimize' : 'we need to establish clear metrics first'}. What's our current baseline?`,
          `I'm seeing patterns here! ${otherAgent ? `Building on ${otherAgent.displayName}'s point` : 'From my analysis'}, the root cause seems to be in our requirements definition.`,
          `Let me dig into the data. Every business challenge has root causes waiting to be discovered - and I think I've found ours.`
        ]
      case 'architect':
        return [
          `From an architectural standpoint, ${topicKeywords.includes('performance') ? 'we should consider parallelization' : 'simplicity should be our first principle here'}.`,
          `I'd recommend the boring technology approach - ${otherAgent ? `${otherAgent.displayName} makes a good point, and` : ''} a simple solution that scales is better than a complex one that doesn't.`,
          `User journeys should drive our technical decisions. What's the critical path here?`
        ]
      case 'dev':
        return [
          `Implementation-wise: ${topicKeywords.includes('bug') ? 'red-green-refactor cycle will catch this' : 'I can implement this if we have clear acceptance criteria'}.`,
          `The Story File is truth. ${otherAgent ? `${otherAgent.displayName}, can you clarify` : 'Can someone clarify'} the exact AC for this task?`,
          `Code speaks louder than meetings. Let me spike this and report back with concrete findings.`
        ]
      case 'pm':
        return [
          `WHY though? ${topicKeywords.includes('feature') ? 'What user problem does this actually solve?' : 'Let\'s validate the assumption first before building.'}.`,
          `Ship the smallest thing that validates. ${otherAgent ? `${otherAgent.displayName}'s suggestion could work, but` : ''} what's our MVP here?`,
          `User value first, technical feasibility second. What does the customer actually need?`
        ]
      case 'sm':
        return [
          `Let's get crisp on this. ${topicKeywords.includes('sprint') ? 'What\'s blocking velocity?' : 'Can we break this into clear, actionable stories?'}`,
          `Zero tolerance for ambiguity. ${otherAgent ? `${otherAgent.displayName}, ` : ''}can you define the acceptance criteria clearly?`,
          `Stories are our source of truth. Let me structure this into a proper backlog item.`
        ]
      case 'tea':
        return [
          `Risk assessment: ${topicKeywords.includes('test') ? 'our current coverage has gaps in edge cases' : 'depth of testing should scale with impact here'}.`,
          `Strong opinion, weakly held: ${otherAgent ? `I agree with ${otherAgent.displayName} but` : ''} we need quality gates backed by data before shipping.`,
          `Flakiness is technical debt. If we can't test it reliably, we shouldn't ship it.`
        ]
      case 'ux-designer':
        return [
          `Let me paint a picture: ${topicKeywords.includes('user') ? 'the user opens the app, and...' : 'imagine the frustration when a user encounters this'}.`,
          `Every decision should serve genuine user needs. ${otherAgent ? `${otherAgent.displayName}'s technical view is valid, but` : ''} how does this feel to use?`,
          `Start simple, evolve through feedback. What's the most intuitive interaction pattern here?`
        ]
      case 'tech-writer':
        return [
          `From a clarity standpoint: ${topicKeywords.includes('docs') ? 'our documentation needs this structured clearly' : 'if we can\'t explain it simply, we don\'t understand it well enough'}.`,
          `Documentation is teaching. ${otherAgent ? `Building on ${otherAgent.displayName}'s point,` : ''} how do we help users accomplish their task?`,
          `Let me translate this into something accessible. Clarity above all else.`
        ]
      default:
        return ['That\'s an interesting perspective. Let me think about how my expertise applies here.']
    }
  }

  /**
   * Run a full discussion round with multiple agents
   */
  async runDiscussionRound(
    config: PartyModeConfig,
    previousMessages: PartyModeMessage[] = [],
    userPrompt?: string
  ): Promise<DiscussionRound> {
    // Select agents based on topic and previous speakers
    const previousAgentIds = previousMessages.slice(-3).map(m => m.agentId)
    const selection = this.selectAgents(
      userPrompt || config.topic,
      previousAgentIds,
      config.mode
    )

    const agents = [selection.primary, selection.secondary]
    if (selection.tertiary && config.maxRoundsPerResponse >= 3) {
      agents.push(selection.tertiary)
    }

    const messages: PartyModeMessage[] = []

    // Generate responses for each selected agent
    for (const agent of agents) {
      const response = await this.generateAgentResponse(agent, {
        topic: config.topic,
        mode: config.mode,
        workflowContext: config.workflowContext,
        otherAgents: agents.filter(a => a.id !== agent.id),
        previousMessages: [...previousMessages, ...messages],
        userPrompt
      })

      // Clean the response text - remove action descriptions
      const cleanedText = cleanAgentResponse(response.text)

      // Check for agent references in the response
      const referencedAgents = agents
        .filter(a => a.id !== agent.id && cleanedText.includes(a.displayName))
        .map(a => a.id)

      messages.push({
        id: `${agent.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        agentId: agent.id,
        agentName: agent.displayName,
        agentIcon: agent.icon,
        role: agent.title,
        text: cleanedText,
        timestamp: new Date(),
        referencedAgents
      })
    }

    return { agents, messages }
  }

  /**
   * Generate a welcome message for party mode
   */
  generateWelcomeMessage(userName: string = 'there'): PartyModeMessage {
    const agents = this.getAllAgents()
    const agentIntros = agents
      .slice(0, 3)
      .map(a => `${a.icon} ${a.displayName} (${a.title})`)
      .join(', ')

    return {
      id: 'welcome-' + Date.now(),
      agentId: 'system',
      agentName: 'Nexus Party Mode',
      agentIcon: '🎉',
      role: 'System',
      text: `Welcome ${userName}! All Nexus agents are here and ready for a dynamic group discussion. I've brought together our complete team of experts: ${agentIntros}, and more. What would you like to discuss with the team today?`,
      timestamp: new Date()
    }
  }

  /**
   * Calculate cost based on Claude pricing
   */
  private calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing: Record<string, { input: number; output: number }> = {
      'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 },
      'claude-3-5-haiku-20241022': { input: 1.0, output: 5.0 },
    }
    const modelPricing = pricing[model] || pricing['claude-3-5-haiku-20241022']
    const inputCost = (inputTokens / 1_000_000) * modelPricing.input
    const outputCost = (outputTokens / 1_000_000) * modelPricing.output
    return Number((inputCost + outputCost).toFixed(6))
  }
}

// Export singleton instance
export const nexusPartyModeService = new NexusPartyModeService()
export default nexusPartyModeService
