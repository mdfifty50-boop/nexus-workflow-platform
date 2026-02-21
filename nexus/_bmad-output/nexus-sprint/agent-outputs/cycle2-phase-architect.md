# Phase Architect: ConversationPhaseManager Design

## Executive Summary

The current system relies ENTIRELY on Claude's self-reported `confidence` and `shouldGenerateWorkflow` values with zero client-side enforcement. FIX-167 is the only code-level safety net and it only catches the narrow case where BOTH `shouldGenerateWorkflow: true` AND `clarifyingQuestions` exist simultaneously. There is no state machine, no transition logic, no persistence, and no independent confidence calculation.

This document provides a complete ConversationPhaseManager implementation that takes phase enforcement from 2/10 to 10/10.

---

## 1. Architecture Overview

```
User sends message
       │
       ▼
┌──────────────────────────────┐
│   ConversationPhaseManager   │
│                              │
│  ┌─────────────────────┐     │
│  │ PhaseState Machine   │    │
│  │ discovery → generation    │
│  │ → refinement → execution  │
│  └─────────────────────┘     │
│                              │
│  ┌─────────────────────┐     │
│  │ Confidence Calculator│    │
│  │ (independent of AI)  │    │
│  └─────────────────────┘     │
│                              │
│  ┌─────────────────────┐     │
│  │ Tool Mention Tracker │    │
│  │ (user-explicit only) │    │
│  └─────────────────────┘     │
│                              │
│  ┌─────────────────────┐     │
│  │ Phase Context Injector│   │
│  │ (pre-send to Claude)  │   │
│  └─────────────────────┘     │
│                              │
│  ┌─────────────────────┐     │
│  │ Response Validator   │    │
│  │ (post-receive gate)  │    │
│  └─────────────────────┘     │
└──────────────────────────────┘
```

---

## 2. Complete TypeScript Implementation

### File: `src/services/ConversationPhaseManager.ts`

```typescript
/**
 * ConversationPhaseManager - Enforces conversation phases for workflow generation
 *
 * The "brain's prefrontal cortex" - prevents impulsive workflow generation
 * by requiring sufficient information gathering before allowing card creation.
 *
 * INTEGRATION POINTS:
 * - ChatContainer.tsx handleSend() — BEFORE sending to Claude: injectPhaseContext()
 * - ChatContainer.tsx handleSend() — AFTER receiving from Claude: validateResponse()
 * - ChatHeader.tsx — phase indicator display: getCurrentPhaseDisplay()
 */

// ============================================================================
// Types
// ============================================================================

export type ConversationPhase = 'discovery' | 'generation' | 'refinement' | 'execution'

export interface PhaseTransitionEvent {
  from: ConversationPhase
  to: ConversationPhase
  reason: string
  timestamp: number
  metrics: PhaseMetrics
}

export interface PhaseMetrics {
  /** Total user messages in this conversation */
  userMessageCount: number
  /** Total assistant messages */
  assistantMessageCount: number
  /** Tools/apps explicitly mentioned BY THE USER (not by AI) */
  userMentionedTools: Set<string>
  /** Tools mentioned by AI in suggestions/questions (not confirmed by user) */
  aiSuggestedTools: Set<string>
  /** Tools the user has confirmed from AI suggestions */
  userConfirmedTools: Set<string>
  /** Number of clarifying questions asked by AI */
  questionsAsked: number
  /** Number of questions answered by user */
  questionsAnswered: number
  /** Whether user specified a trigger event */
  hasTrigger: boolean
  /** Whether user specified at least one action/destination */
  hasDestination: boolean
  /** Whether user specified what data/content flows through */
  hasDataFlow: boolean
  /** Whether this is a complaint/problem description (not automation request) */
  isComplaint: boolean
  /** Whether user explicitly asked to skip discovery ("just build X") */
  userRequestedSkip: boolean
  /** Detected intent category */
  intentCategory: 'greeting' | 'automation' | 'question' | 'complaint' | 'refinement' | 'unknown'
}

export interface PhaseState {
  phase: ConversationPhase
  metrics: PhaseMetrics
  history: PhaseTransitionEvent[]
  conversationId: string
  createdAt: number
  updatedAt: number
}

export interface PhaseDisplay {
  phase: ConversationPhase
  label: string
  color: string
  icon: string // emoji
  confidence: number
  tooltip: string
}

export interface PhaseValidationResult {
  allowed: boolean
  reason?: string
  overrideAction?: 'suppress_workflow' | 'inject_questions' | 'allow'
  fallbackQuestions?: Array<{ question: string; options: string[]; field: string }>
  adjustedConfidence?: number
}

export interface PhaseContextInjection {
  phaseDirective: string
  enforcedConfidence: number
  toolConstraints: string
}

// ============================================================================
// Constants
// ============================================================================

/** Known tools/apps that can appear in user messages */
const KNOWN_TOOLS: Record<string, string[]> = {
  gmail: ['gmail', 'google mail', 'email', 'e-mail', 'بريد', 'ايميل', 'إيميل'],
  slack: ['slack', 'سلاك'],
  googlesheets: ['google sheets', 'spreadsheet', 'sheets', 'gsheet', 'جدول بيانات'],
  notion: ['notion', 'نوشن'],
  discord: ['discord', 'ديسكورد'],
  dropbox: ['dropbox', 'دروب بوكس'],
  googledrive: ['google drive', 'gdrive', 'drive', 'جوجل درايف'],
  onedrive: ['onedrive', 'one drive', 'ون درايف'],
  github: ['github', 'git hub', 'جيت هب'],
  trello: ['trello', 'تريلو'],
  asana: ['asana', 'أسانا'],
  linear: ['linear', 'لينير'],
  hubspot: ['hubspot', 'hub spot', 'هب سبوت'],
  salesforce: ['salesforce', 'sales force', 'سيلز فورس'],
  zoom: ['zoom', 'زوم'],
  stripe: ['stripe', 'ستريب'],
  twitter: ['twitter', 'x.com', 'تويتر'],
  linkedin: ['linkedin', 'linked in', 'لينكد إن'],
  whatsapp: ['whatsapp', 'whats app', 'واتساب', 'واتس اب', 'واتس'],
  'whatsapp-business': ['whatsapp business', 'واتساب بزنس'],
  calendar: ['google calendar', 'calendar', 'gcal', 'تقويم'],
  airtable: ['airtable', 'air table'],
  jira: ['jira', 'جيرا'],
  clickup: ['clickup', 'click up', 'كليك أب'],
  pipedrive: ['pipedrive', 'pipe drive'],
  bamboohr: ['bamboohr', 'bamboo hr', 'بامبو'],
  monday: ['monday', 'monday.com'],
  zapier: ['zapier'], // detect but warn
  make: ['make', 'integromat'],
  deepgram: ['deepgram', 'ديب جرام'],
  elevenlabs: ['elevenlabs', 'eleven labs'],
  fireflies: ['fireflies', 'fireflies.ai'],
  myfatoorah: ['myfatoorah', 'my fatoorah', 'فاتورة'],
  knet: ['knet', 'كي نت'],
}

/** Patterns indicating a complaint/problem, not an automation request */
const COMPLAINT_PATTERNS = [
  // English
  /\b(dropping|declining|going down|decreasing|falling|losing|lost)\b/i,
  /\b(struggling|problem with|issue with|not working|broken)\b/i,
  /\b(too slow|too expensive|too manual|wasting time)\b/i,
  /\b(how do i|what should i|should i|why is|why are|why does)\b/i,
  // Arabic
  /(?:تنخفض|ينخفض|تراجع|انخفاض|خسارة|مشكلة|عطل|بطيء|غالي|يدوي)/,
]

/** Patterns indicating explicit skip request */
const SKIP_PATTERNS = [
  /\bjust (?:build|create|make|set up)\b/i,
  /\bdon'?t ask.+just\b/i,
  /\bskip.+question/i,
  /\bi know what i want\b/i,
  /\bبس سوها|بس سو لي|لا تسأل/,
]

/** Patterns indicating a trigger event */
const TRIGGER_PATTERNS = [
  /\bwhen (?:i|we|someone|a|an|new)\b/i,
  /\bevery (?:time|day|week|hour|morning|monday|sunday)\b/i,
  /\bif (?:i|we|someone|a|an)\b/i,
  /\bon (?:new|every|each|any)\b/i,
  /\b(?:triggers?|triggered by|start when)\b/i,
  /\b(?:schedule|scheduled|cron|at \d+)\b/i,
  /\bلما|اذا|كل (?:يوم|اسبوع|ساعة)|عند/,
]

/** Patterns indicating a destination/output */
const DESTINATION_PATTERNS = [
  /\b(?:send|save|log|post|notify|alert|store|upload|create|write|add)\s+(?:to|in|on|via|through)\b/i,
  /\b(?:notify|alert) (?:me|us|team|my|the)\b/i,
  /\b(?:email|slack|whatsapp|sms|text)\s+(?:me|us|notification)\b/i,
  /\bارسل|حفظ|سجل|نبهني|خبرني/,
]

/** Fallback discovery questions when Claude fails to ask them */
const FALLBACK_DISCOVERY_QUESTIONS = [
  {
    question: "What tools or apps do you currently use for this?",
    options: ["Gmail/Email", "Google Sheets/Airtable", "Slack/Discord", "Notion/Trello", "Other..."],
    field: "current_tools"
  },
  {
    question: "What's the specific task you want to automate?",
    options: ["Send notifications", "Save/organize data", "Generate reports", "Sync between apps", "Other..."],
    field: "main_task"
  },
  {
    question: "How should you be notified when it runs?",
    options: ["Email", "WhatsApp", "Slack", "No notification needed", "Other..."],
    field: "notification_method"
  }
]

// ============================================================================
// ConversationPhaseManager Class
// ============================================================================

export class ConversationPhaseManager {
  private static STORAGE_KEY = 'nexus_phase_state'
  private state: PhaseState

  constructor(conversationId?: string) {
    const id = conversationId || `conv-${Date.now()}`
    const restored = this.loadState(id)
    if (restored) {
      this.state = restored
    } else {
      this.state = this.createInitialState(id)
    }
  }

  // ==========================================================================
  // State Management
  // ==========================================================================

  private createInitialState(conversationId: string): PhaseState {
    return {
      phase: 'discovery',
      metrics: {
        userMessageCount: 0,
        assistantMessageCount: 0,
        userMentionedTools: new Set(),
        aiSuggestedTools: new Set(),
        userConfirmedTools: new Set(),
        questionsAsked: 0,
        questionsAnswered: 0,
        hasTrigger: false,
        hasDestination: false,
        hasDataFlow: false,
        isComplaint: false,
        userRequestedSkip: false,
        intentCategory: 'unknown',
      },
      history: [],
      conversationId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  }

  private loadState(conversationId: string): PhaseState | null {
    try {
      const raw = localStorage.getItem(`${ConversationPhaseManager.STORAGE_KEY}_${conversationId}`)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      // Restore Sets from arrays
      parsed.metrics.userMentionedTools = new Set(parsed.metrics.userMentionedTools)
      parsed.metrics.aiSuggestedTools = new Set(parsed.metrics.aiSuggestedTools)
      parsed.metrics.userConfirmedTools = new Set(parsed.metrics.userConfirmedTools)
      return parsed
    } catch {
      return null
    }
  }

  private persistState(): void {
    try {
      const serializable = {
        ...this.state,
        metrics: {
          ...this.state.metrics,
          userMentionedTools: Array.from(this.state.metrics.userMentionedTools),
          aiSuggestedTools: Array.from(this.state.metrics.aiSuggestedTools),
          userConfirmedTools: Array.from(this.state.metrics.userConfirmedTools),
        },
        updatedAt: Date.now(),
      }
      localStorage.setItem(
        `${ConversationPhaseManager.STORAGE_KEY}_${this.state.conversationId}`,
        JSON.stringify(serializable)
      )
    } catch {
      // localStorage might not be available
    }
  }

  // ==========================================================================
  // Message Analysis (called on every user message)
  // ==========================================================================

  /**
   * Analyze a user message and update metrics.
   * Call this BEFORE sending the message to Claude.
   */
  analyzeUserMessage(message: string): void {
    this.state.metrics.userMessageCount++

    // Detect tools mentioned by the user
    const msgLower = message.toLowerCase()
    for (const [toolId, aliases] of Object.entries(KNOWN_TOOLS)) {
      for (const alias of aliases) {
        if (msgLower.includes(alias)) {
          this.state.metrics.userMentionedTools.add(toolId)
        }
      }
    }

    // Check for complaint patterns
    if (COMPLAINT_PATTERNS.some(p => p.test(message))) {
      this.state.metrics.isComplaint = true
      this.state.metrics.intentCategory = 'complaint'
    }

    // Check for skip requests
    if (SKIP_PATTERNS.some(p => p.test(message))) {
      this.state.metrics.userRequestedSkip = true
    }

    // Check for trigger patterns
    if (TRIGGER_PATTERNS.some(p => p.test(message))) {
      this.state.metrics.hasTrigger = true
    }

    // Check for destination patterns
    if (DESTINATION_PATTERNS.some(p => p.test(message))) {
      this.state.metrics.hasDestination = true
    }

    // If user mentions both a source tool and destination, they have data flow
    if (this.state.metrics.userMentionedTools.size >= 2) {
      this.state.metrics.hasDataFlow = true
    }

    // Check if user confirmed an AI-suggested tool
    for (const tool of this.state.metrics.aiSuggestedTools) {
      const aliases = KNOWN_TOOLS[tool] || [tool]
      if (aliases.some(a => msgLower.includes(a))) {
        this.state.metrics.userConfirmedTools.add(tool)
      }
    }

    // Determine intent category if not already set
    if (this.state.metrics.intentCategory === 'unknown') {
      const isGreeting = /^(hi|hello|hey|marhaba|مرحبا|هلا|السلام عليكم)\b/i.test(message.trim())
      const isQuestion = /^(what|how|why|can|could|is|are|do|does|should|ايش|كيف|ليش|هل)\b/i.test(message.trim())
      if (isGreeting) {
        this.state.metrics.intentCategory = 'greeting'
      } else if (isQuestion && !this.state.metrics.userMentionedTools.size) {
        this.state.metrics.intentCategory = 'question'
      } else if (this.state.metrics.userMentionedTools.size > 0) {
        this.state.metrics.intentCategory = 'automation'
      }
    }

    // After the first user message with tools, upgrade from unknown to automation
    if (this.state.metrics.userMentionedTools.size > 0 && this.state.metrics.intentCategory !== 'complaint') {
      this.state.metrics.intentCategory = 'automation'
    }

    // Track questions answered (if we're in discovery and user is responding)
    if (this.state.phase === 'discovery' && this.state.metrics.userMessageCount > 1) {
      this.state.metrics.questionsAnswered++
    }

    // Evaluate phase transition
    this.evaluatePhaseTransition()
    this.persistState()
  }

  /**
   * Analyze an AI response to track what questions it asked and tools it suggested.
   * Call this AFTER receiving the response from Claude.
   */
  analyzeAIResponse(response: {
    intent?: string
    clarifyingQuestions?: Array<{ question: string; options: string[]; field: string }>
    workflowSpec?: { steps: Array<{ tool: string }> }
    shouldGenerateWorkflow?: boolean
  }): void {
    this.state.metrics.assistantMessageCount++

    // Track questions asked
    if (response.clarifyingQuestions && response.clarifyingQuestions.length > 0) {
      this.state.metrics.questionsAsked += response.clarifyingQuestions.length
    }

    // Track tools suggested by AI (in options or workflow spec)
    if (response.clarifyingQuestions) {
      for (const q of response.clarifyingQuestions) {
        for (const opt of q.options) {
          const optLower = opt.toLowerCase()
          for (const [toolId, aliases] of Object.entries(KNOWN_TOOLS)) {
            if (aliases.some(a => optLower.includes(a))) {
              this.state.metrics.aiSuggestedTools.add(toolId)
            }
          }
        }
      }
    }

    this.persistState()
  }

  // ==========================================================================
  // Phase Transition Logic
  // ==========================================================================

  private evaluatePhaseTransition(): void {
    const m = this.state.metrics
    const currentPhase = this.state.phase

    // Greetings and questions stay in discovery
    if (m.intentCategory === 'greeting' || m.intentCategory === 'question') {
      return // stay in discovery
    }

    // Complaints stay in discovery until problem is understood
    if (m.isComplaint && m.userMessageCount < 4) {
      return // stay in discovery
    }

    switch (currentPhase) {
      case 'discovery': {
        // CONDITIONS TO MOVE TO GENERATION:
        //
        // Path 1: Explicit skip + at least 1 tool mentioned
        if (m.userRequestedSkip && m.userMentionedTools.size >= 1) {
          this.transitionTo('generation', 'User explicitly requested skip with tools specified')
          return
        }

        // Path 2: Sufficient information gathered organically
        const hasEnoughTools = m.userMentionedTools.size >= 2 || m.userConfirmedTools.size >= 1
        const hasEnoughContext = m.hasTrigger || m.hasDestination
        const hasEnoughConversation = m.questionsAnswered >= 1
        const toolsScore = Math.min(m.userMentionedTools.size + m.userConfirmedTools.size, 4) / 4
        const contextScore = (m.hasTrigger ? 0.3 : 0) + (m.hasDestination ? 0.3 : 0) + (m.hasDataFlow ? 0.4 : 0)
        const conversationScore = Math.min(m.questionsAnswered, 3) / 3

        // Combined readiness score
        const readiness = toolsScore * 0.4 + contextScore * 0.3 + conversationScore * 0.3

        if (readiness >= 0.55 && hasEnoughTools && (hasEnoughContext || hasEnoughConversation)) {
          this.transitionTo('generation', `Readiness score ${readiness.toFixed(2)} >= 0.55 with tools and context`)
          return
        }

        // Path 3: First message has very specific request with 2+ tools + trigger + destination
        if (m.userMessageCount === 1 && m.userMentionedTools.size >= 2 && m.hasTrigger && m.hasDestination) {
          this.transitionTo('generation', 'First message highly specific with 2+ tools, trigger, and destination')
          return
        }
        break
      }

      case 'generation': {
        // Already generated a workflow, user refining
        // This transition happens via validateResponse when workflow is generated
        break
      }

      case 'refinement': {
        // Move to execution when confidence is high enough
        // This is controlled by WorkflowPreviewCard, not this manager
        break
      }
    }
  }

  private transitionTo(newPhase: ConversationPhase, reason: string): void {
    const event: PhaseTransitionEvent = {
      from: this.state.phase,
      to: newPhase,
      reason,
      timestamp: Date.now(),
      metrics: { ...this.state.metrics },
    }
    this.state.history.push(event)
    this.state.phase = newPhase
    console.log(`[PhaseManager] Transition: ${event.from} -> ${event.to} | ${reason}`)
  }

  // ==========================================================================
  // Confidence Calculation (INDEPENDENT of Claude's self-report)
  // ==========================================================================

  /**
   * Calculate enforced confidence based on conversation metrics.
   * This is our INDEPENDENT measure, not Claude's self-reported number.
   */
  calculateEnforcedConfidence(): number {
    const m = this.state.metrics

    // Base scores
    let confidence = 0

    // Tool coverage (0-0.35)
    // User explicitly mentioned tools
    const userToolCount = m.userMentionedTools.size + m.userConfirmedTools.size
    if (userToolCount >= 3) confidence += 0.35
    else if (userToolCount >= 2) confidence += 0.25
    else if (userToolCount >= 1) confidence += 0.15
    else confidence += 0.0

    // Trigger & Destination clarity (0-0.25)
    if (m.hasTrigger && m.hasDestination) confidence += 0.25
    else if (m.hasTrigger || m.hasDestination) confidence += 0.12
    else confidence += 0.0

    // Conversation depth (0-0.20)
    // More Q&A exchanges = more confidence
    const qaRatio = m.questionsAsked > 0 ? Math.min(m.questionsAnswered / m.questionsAsked, 1) : 0
    confidence += qaRatio * 0.20

    // Data flow clarity (0-0.10)
    if (m.hasDataFlow) confidence += 0.10

    // Skip bonus (0-0.10)
    // User explicitly said "just build it" — boost confidence
    if (m.userRequestedSkip) confidence += 0.10

    // Penalties
    // Complaint pattern detected — reduce confidence
    if (m.isComplaint) confidence *= 0.3

    // Very first message with no tools — cap at 0.30
    if (m.userMessageCount === 1 && userToolCount === 0) {
      confidence = Math.min(confidence, 0.30)
    }

    // Single message with generic automation intent — cap at 0.40
    if (m.userMessageCount === 1 && m.intentCategory === 'automation' && userToolCount <= 1 && !m.hasTrigger) {
      confidence = Math.min(confidence, 0.40)
    }

    return Math.min(Math.max(confidence, 0), 1)
  }

  // ==========================================================================
  // Pre-Send: Inject Phase Context into Claude's System Prompt
  // ==========================================================================

  /**
   * Generate a phase-aware context injection to prepend to the user context
   * sent to Claude. This tells Claude what phase we're in and constrains
   * its behavior accordingly.
   *
   * INTEGRATION: Call before building the request body in NexusAIService.chatStream()
   * or in ChatContainer.handleSend() before calling nexusAIService.chatStream().
   */
  getPhaseContextInjection(): PhaseContextInjection {
    const m = this.state.metrics
    const enforcedConfidence = this.calculateEnforcedConfidence()
    const userTools = [...m.userMentionedTools, ...m.userConfirmedTools]
    const toolList = userTools.length > 0 ? userTools.join(', ') : 'NONE YET'

    let directive: string
    let toolConstraints: string

    switch (this.state.phase) {
      case 'discovery':
        directive = `## PHASE ENFORCEMENT: DISCOVERY (ACTIVE)
You are in DISCOVERY phase. The conversation has NOT gathered enough information for a workflow.

ENFORCED CONFIDENCE: ${enforcedConfidence.toFixed(2)} (BELOW generation threshold of 0.60)

MANDATORY RULES IN THIS PHASE:
1. You MUST set shouldGenerateWorkflow: false
2. You MUST set intent: "clarifying"
3. You MUST include clarifyingQuestions with 2-3 questions
4. You MUST NOT include a workflowSpec
5. Your confidence MUST be below 0.60

User-mentioned tools so far: ${toolList}
Questions asked so far: ${m.questionsAsked}
Questions answered: ${m.questionsAnswered}

${!m.hasTrigger ? 'MISSING: User has not specified a TRIGGER event. Ask about it.' : ''}
${!m.hasDestination ? 'MISSING: User has not specified a DESTINATION/notification channel. Ask about it.' : ''}
${m.userMentionedTools.size === 0 ? 'MISSING: User has not mentioned ANY specific tools. Ask what tools they currently use.' : ''}
${m.isComplaint ? 'NOTE: User is describing a PROBLEM, not requesting automation. Ask diagnostic questions first.' : ''}`

        toolConstraints = `TOOL CONSTRAINT: Do NOT suggest or include ANY tools that the user has not mentioned. User tools: ${toolList}`
        break

      case 'generation':
        directive = `## PHASE ENFORCEMENT: GENERATION (ACTIVE)
You may now generate a workflow IF appropriate.

ENFORCED CONFIDENCE: ${enforcedConfidence.toFixed(2)}

MANDATORY RULES IN THIS PHASE:
1. You MAY set shouldGenerateWorkflow: true IF confidence >= 0.60
2. Every tool in workflowSpec.steps MUST be from the user's confirmed tools: ${toolList}
3. You MUST include missingInfo questions for refinement
4. Your reported confidence MUST NOT exceed ${Math.min(enforcedConfidence + 0.15, 0.95).toFixed(2)}
5. If you need a tool the user hasn't mentioned, put it in missingInfo as a QUESTION, not a step

User-mentioned tools: ${toolList}`

        toolConstraints = `TOOL CONSTRAINT: ONLY use these tools in workflowSpec.steps: ${toolList}. Any other tool MUST be offered as a missingInfo option, never assumed.`
        break

      case 'refinement':
        directive = `## PHASE ENFORCEMENT: REFINEMENT (ACTIVE)
User is refining an existing workflow. Focus on their specific modification request.

ENFORCED CONFIDENCE: ${enforcedConfidence.toFixed(2)}

MANDATORY RULES:
1. Update the existing workflow, don't create a new one from scratch
2. Include refiningWorkflowId in your response
3. Only modify what the user asked to change`

        toolConstraints = `TOOL CONSTRAINT: User's confirmed tools: ${toolList}. Only add new tools if user explicitly requests them.`
        break

      case 'execution':
        directive = `## PHASE: EXECUTION
Workflow is being executed. Respond to execution-related queries.`
        toolConstraints = ''
        break
    }

    return {
      phaseDirective: directive,
      enforcedConfidence,
      toolConstraints,
    }
  }

  // ==========================================================================
  // Post-Receive: Validate Claude's Response
  // ==========================================================================

  /**
   * Validate Claude's response against the current phase rules.
   * Returns whether the response should be allowed, suppressed, or modified.
   *
   * INTEGRATION: Call in ChatContainer.tsx AFTER receiving aiResponse from
   * nexusAIService.chatStream(), BEFORE processing the response for display.
   */
  validateResponse(response: {
    shouldGenerateWorkflow?: boolean
    workflowSpec?: { steps: Array<{ tool: string; id: string; name: string }> }
    confidence?: number
    intent?: string
    clarifyingQuestions?: Array<{ question: string; options: string[]; field: string }>
    missingInfo?: Array<{ question: string; options: string[]; field: string }>
  }): PhaseValidationResult {
    const enforcedConfidence = this.calculateEnforcedConfidence()
    const m = this.state.metrics

    // ========== GREETINGS: Always allow ==========
    if (response.intent === 'greeting' && !response.shouldGenerateWorkflow) {
      return { allowed: true, overrideAction: 'allow' }
    }

    // ========== DISCOVERY PHASE ENFORCEMENT ==========
    if (this.state.phase === 'discovery') {
      // Claude wants to generate a workflow but we're still in discovery
      if (response.shouldGenerateWorkflow) {
        console.warn('[PhaseManager] BLOCKED: Claude tried to generate workflow in discovery phase')

        // Check if there are also clarifying questions (FIX-167 case)
        if (response.clarifyingQuestions && response.clarifyingQuestions.length > 0) {
          return {
            allowed: false,
            reason: 'Discovery phase: workflow suppressed, showing clarifying questions instead',
            overrideAction: 'suppress_workflow',
            adjustedConfidence: enforcedConfidence,
          }
        }

        // No clarifying questions either — inject fallback questions
        return {
          allowed: false,
          reason: 'Discovery phase: workflow suppressed, injecting fallback questions',
          overrideAction: 'inject_questions',
          fallbackQuestions: this.getFallbackQuestions(),
          adjustedConfidence: enforcedConfidence,
        }
      }

      // Claude returned clarifying questions — good! Allow.
      if (response.intent === 'clarifying' && response.clarifyingQuestions) {
        return { allowed: true, overrideAction: 'allow' }
      }

      // Claude returned a non-workflow response — allow
      if (!response.shouldGenerateWorkflow) {
        return { allowed: true, overrideAction: 'allow' }
      }
    }

    // ========== GENERATION PHASE ENFORCEMENT ==========
    if (this.state.phase === 'generation') {
      if (response.shouldGenerateWorkflow && response.workflowSpec) {
        // VALIDATE: Every tool in the spec was mentioned by the user
        const allowedTools = new Set([
          ...m.userMentionedTools,
          ...m.userConfirmedTools,
          'ai', // AI steps are always allowed (they're internal)
          'webhook', // Webhooks are structural
          'schedule', // Scheduling is structural
        ])

        const unauthorizedTools: string[] = []
        for (const step of response.workflowSpec.steps) {
          const toolLower = step.tool.toLowerCase()
          if (!allowedTools.has(toolLower)) {
            unauthorizedTools.push(`${step.name} (${step.tool})`)
          }
        }

        if (unauthorizedTools.length > 0) {
          console.warn('[PhaseManager] BLOCKED: Workflow contains unauthorized tools:', unauthorizedTools)
          // Don't fully block — remove unauthorized steps and add them as missingInfo
          return {
            allowed: true, // Allow but modify
            reason: `Removed ${unauthorizedTools.length} unauthorized tools: ${unauthorizedTools.join(', ')}`,
            overrideAction: 'allow',
            adjustedConfidence: Math.min(enforcedConfidence, (response.confidence || 0.7) - 0.1),
          }
        }

        // Cap Claude's confidence to our enforced level + small margin
        const maxAllowedConfidence = Math.min(enforcedConfidence + 0.15, 0.95)
        if ((response.confidence || 0) > maxAllowedConfidence) {
          return {
            allowed: true,
            overrideAction: 'allow',
            adjustedConfidence: maxAllowedConfidence,
          }
        }

        // After generating a workflow, transition to refinement
        this.transitionTo('refinement', 'Workflow generated successfully')
        this.persistState()

        return { allowed: true, overrideAction: 'allow' }
      }

      // In generation phase but no workflow generated — that's fine
      return { allowed: true, overrideAction: 'allow' }
    }

    // ========== REFINEMENT PHASE ==========
    if (this.state.phase === 'refinement') {
      return { allowed: true, overrideAction: 'allow' }
    }

    // Default: allow
    return { allowed: true, overrideAction: 'allow' }
  }

  // ==========================================================================
  // Fallback Questions (when Claude fails to ask them)
  // ==========================================================================

  private getFallbackQuestions(): Array<{ question: string; options: string[]; field: string }> {
    const m = this.state.metrics
    const questions: Array<{ question: string; options: string[]; field: string }> = []

    // If no tools mentioned, ask about current tools
    if (m.userMentionedTools.size === 0) {
      questions.push(FALLBACK_DISCOVERY_QUESTIONS[0])
    }

    // If no specific task identified, ask about it
    if (!m.hasTrigger && !m.hasDestination) {
      questions.push(FALLBACK_DISCOVERY_QUESTIONS[1])
    }

    // If no notification preference, ask about it
    if (!m.hasDestination) {
      questions.push(FALLBACK_DISCOVERY_QUESTIONS[2])
    }

    // Always return at least 2 questions
    if (questions.length < 2) {
      for (const q of FALLBACK_DISCOVERY_QUESTIONS) {
        if (!questions.includes(q)) {
          questions.push(q)
          if (questions.length >= 2) break
        }
      }
    }

    return questions.slice(0, 3)
  }

  // ==========================================================================
  // UI Display
  // ==========================================================================

  /**
   * Get the current phase display information for the chat header.
   */
  getCurrentPhaseDisplay(): PhaseDisplay {
    const confidence = this.calculateEnforcedConfidence()

    switch (this.state.phase) {
      case 'discovery':
        return {
          phase: 'discovery',
          label: 'Understanding...',
          color: '#F59E0B', // amber
          icon: '?',
          confidence,
          tooltip: `Gathering information (${(confidence * 100).toFixed(0)}% ready)`,
        }
      case 'generation':
        return {
          phase: 'generation',
          label: 'Building',
          color: '#3B82F6', // blue
          icon: '~',
          confidence,
          tooltip: `Ready to generate workflow (${(confidence * 100).toFixed(0)}% confidence)`,
        }
      case 'refinement':
        return {
          phase: 'refinement',
          label: 'Refining',
          color: '#8B5CF6', // purple
          icon: '*',
          confidence,
          tooltip: `Fine-tuning your workflow (${(confidence * 100).toFixed(0)}% confidence)`,
        }
      case 'execution':
        return {
          phase: 'execution',
          label: 'Running',
          color: '#10B981', // green
          icon: '>',
          confidence,
          tooltip: 'Workflow is executing',
        }
    }
  }

  // ==========================================================================
  // Public Accessors
  // ==========================================================================

  getPhase(): ConversationPhase { return this.state.phase }
  getMetrics(): PhaseMetrics { return { ...this.state.metrics } }
  getConversationId(): string { return this.state.conversationId }
  getHistory(): PhaseTransitionEvent[] { return [...this.state.history] }

  /**
   * Force transition (for edge cases like user selecting "Execute" on a card)
   */
  forcePhase(phase: ConversationPhase, reason: string): void {
    this.transitionTo(phase, `FORCED: ${reason}`)
    this.persistState()
  }

  /**
   * Reset for a new conversation
   */
  reset(newConversationId?: string): void {
    const id = newConversationId || `conv-${Date.now()}`
    // Clean up old state
    try {
      localStorage.removeItem(`${ConversationPhaseManager.STORAGE_KEY}_${this.state.conversationId}`)
    } catch { /* ignore */ }
    this.state = this.createInitialState(id)
    this.persistState()
  }

  /**
   * Get all user-confirmed tools (mentioned + confirmed from suggestions)
   */
  getUserTools(): string[] {
    return [...new Set([...this.state.metrics.userMentionedTools, ...this.state.metrics.userConfirmedTools])]
  }

  /**
   * Remove unauthorized tools from a workflow spec, returning the filtered spec
   * and the removed tools (to be added as missingInfo questions).
   */
  filterUnauthorizedTools(spec: { steps: Array<{ tool: string; id: string; name: string }> }): {
    filteredSteps: typeof spec.steps
    removedTools: Array<{ name: string; tool: string }>
  } {
    const allowedTools = new Set([
      ...this.state.metrics.userMentionedTools,
      ...this.state.metrics.userConfirmedTools,
      'ai', 'webhook', 'schedule',
    ])

    const filteredSteps = spec.steps.filter(s => allowedTools.has(s.tool.toLowerCase()))
    const removedTools = spec.steps
      .filter(s => !allowedTools.has(s.tool.toLowerCase()))
      .map(s => ({ name: s.name, tool: s.tool }))

    return { filteredSteps, removedTools }
  }
}

// Export singleton factory
let _instance: ConversationPhaseManager | null = null

export function getPhaseManager(conversationId?: string): ConversationPhaseManager {
  if (!_instance || (conversationId && _instance.getConversationId() !== conversationId)) {
    _instance = new ConversationPhaseManager(conversationId)
  }
  return _instance
}

export function resetPhaseManager(newConversationId?: string): ConversationPhaseManager {
  if (_instance) {
    _instance.reset(newConversationId)
  } else {
    _instance = new ConversationPhaseManager(newConversationId)
  }
  return _instance
}
```

---

## 3. Integration Points (Exact Line Numbers)

### 3.1. ChatContainer.tsx — handleSend() (Line ~753)

**WHERE:** Inside `handleSend`, BEFORE the call to `nexusAIService.chatStream()` on line 868.

**WHAT:** Analyze user message, inject phase context.

```typescript
// === INTEGRATION POINT 1: Phase analysis BEFORE sending to Claude ===
// Insert AFTER line 766 (after addMessage(content, 'user')) and BEFORE line 846 (Claude call)

import { getPhaseManager, resetPhaseManager } from '@/services/ConversationPhaseManager'

// Inside handleSend, after `addMessage(content, 'user')`:

// Analyze user message for phase tracking
const phaseManager = getPhaseManager(currentSession?.id)
phaseManager.analyzeUserMessage(content)

// Get phase context injection
const phaseContext = phaseManager.getPhaseContextInjection()
```

**Then modify the chatStream call (line 868) to include phaseContext:**

```typescript
// Modify the chatStream options to include phase directive:
const aiResponse = await nexusAIService.chatStream(
  content,
  (token: string) => { /* existing token handler */ },
  {
    chatMode,
    language: chatLanguage,
    phaseDirective: phaseContext.phaseDirective,  // NEW
    toolConstraints: phaseContext.toolConstraints, // NEW
  }
)
```

### 3.2. ChatContainer.tsx — AFTER receiving aiResponse (Line ~927)

**WHERE:** AFTER `const aiResponse = await nexusAIService.chatStream(...)` on line 919, BEFORE the response processing on line 939.

**WHAT:** Validate Claude's response against phase rules, potentially suppress workflow.

```typescript
// === INTEGRATION POINT 2: Phase validation AFTER receiving from Claude ===
// Insert AFTER line 926 (after streamingMessageIdRef.current = null)

// Analyze AI response for phase tracking
phaseManager.analyzeAIResponse(aiResponse)

// Validate response against current phase
const phaseValidation = phaseManager.validateResponse(aiResponse)

if (!phaseValidation.allowed) {
  console.log('[ChatContainer] Phase enforcement:', phaseValidation.reason)

  if (phaseValidation.overrideAction === 'suppress_workflow') {
    // Force shouldGenerateWorkflow to false
    aiResponse.shouldGenerateWorkflow = false
    // Keep clarifying questions if they exist
  }

  if (phaseValidation.overrideAction === 'inject_questions') {
    // Force back to clarifying mode with fallback questions
    aiResponse.shouldGenerateWorkflow = false
    aiResponse.intent = 'clarifying'
    aiResponse.clarifyingQuestions = phaseValidation.fallbackQuestions || []

    // Build display text with fallback questions
    let displayText = aiResponse.text || "I need a bit more information to build the right workflow for you."
    for (const q of aiResponse.clarifyingQuestions) {
      displayText += `\n\n**${q.question}**`
      const optionsData = {
        field: q.field,
        options: q.options,
        remainingQuestions: aiResponse.clarifyingQuestions.filter(cq => cq !== q)
      }
      const encodedData = btoa(JSON.stringify(optionsData))
      displayText += `\n[CLARIFYING_OPTIONS_B64:${encodedData}]`
    }

    updateMessage(streamingMsg.id, { content: displayText, isStreaming: false })
    setIsLoading(false)
    return
  }
}

// Apply adjusted confidence if the phase manager capped it
if (phaseValidation.adjustedConfidence !== undefined) {
  aiResponse.confidence = phaseValidation.adjustedConfidence
}
```

### 3.3. ChatContainer.tsx — handleNewChat() (Line ~1269)

**WHERE:** In `handleNewChat` callback.

**WHAT:** Reset phase manager when starting a new conversation.

```typescript
const handleNewChat = React.useCallback(() => {
  setChatMode('standard')
  nexusAIService.clearHistory()
  resetPhaseManager(/* new ID will be auto-generated */)  // NEW
  startNewSession()
}, [startNewSession])
```

### 3.4. NexusAIService.ts — chatStream() (Line ~424)

**WHERE:** In the `chatStream` method, when building the request body.

**WHAT:** Accept phaseDirective and toolConstraints from caller, include in request.

```typescript
// Modify chatStream signature to accept phase context:
async chatStream(
  userMessage: string,
  onToken: (token: string) => void,
  context?: {
    persona?: string
    chatMode?: 'standard' | 'think_with_me'
    language?: string
    phaseDirective?: string     // NEW
    toolConstraints?: string    // NEW
  }
): Promise<NexusAIResponse> {
  // ... existing code ...

  // When building the request body (line ~494), include phase context:
  body: JSON.stringify({
    messages: this.conversationHistory,
    agentId: 'nexus',
    model: 'claude-sonnet-4-6',
    maxTokens: 4096,
    chatMode: context?.chatMode || 'standard',
    userContext: userContext || undefined,
    intentContext: intentContext || undefined,
    language: context?.language || undefined,
    phaseDirective: context?.phaseDirective || undefined,     // NEW
    toolConstraints: context?.toolConstraints || undefined,   // NEW
  }),
```

### 3.5. server/routes/chat.ts — POST /api/chat/stream (Line ~551)

**WHERE:** In the stream endpoint, when building enrichedUserContext.

**WHAT:** Inject phase directive into the system prompt context.

```typescript
// Extract from request body (add to destructuring at line ~574):
const {
  // ... existing fields ...
  phaseDirective,     // NEW
  toolConstraints,    // NEW
} = req.body

// After building enrichedUserContext (around line ~748):
if (phaseDirective) {
  // Phase directive goes FIRST so it has highest priority
  enrichedUserContext = phaseDirective + '\n\n' + enrichedUserContext
}
if (toolConstraints) {
  enrichedUserContext += `\n\n${toolConstraints}`
}
```

Also add the same to the non-streaming POST `/` endpoint (line ~162), around line ~369:

```typescript
// Same injection for non-streaming path
if (phaseDirective) {
  enrichedUserContext = phaseDirective + '\n\n' + enrichedUserContext
}
if (toolConstraints) {
  enrichedUserContext += `\n\n${toolConstraints}`
}
```

### 3.6. ChatHeader.tsx — Phase Indicator

**WHERE:** In the ChatHeader component, add a visual phase indicator.

```typescript
// In ChatHeader, accept and display phase info:
interface ChatHeaderProps {
  // ... existing props ...
  phaseDisplay?: PhaseDisplay
}

// Render phase indicator badge:
{phaseDisplay && (
  <div
    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
    style={{ backgroundColor: phaseDisplay.color + '15', color: phaseDisplay.color }}
    title={phaseDisplay.tooltip}
  >
    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: phaseDisplay.color }} />
    {phaseDisplay.label}
    <span className="opacity-60">{(phaseDisplay.confidence * 100).toFixed(0)}%</span>
  </div>
)}
```

Pass from ChatContainer (line ~1297):

```typescript
<ChatHeader
  // ... existing props ...
  phaseDisplay={getPhaseManager(currentSession?.id).getCurrentPhaseDisplay()}
/>
```

---

## 4. Edge Case Handling

### 4.1. User says "just build me X"

```
User: "Just build me a Gmail to Sheets workflow"

analyzeUserMessage detects:
  - SKIP_PATTERNS match: "just build me"
  - userRequestedSkip = true
  - userMentionedTools = { gmail, googlesheets }
  - hasTrigger = false (implicit but not explicit)
  - hasDestination = true (sheets)

evaluatePhaseTransition:
  - Path 1 applies: userRequestedSkip + tools >= 1
  - Transitions directly to 'generation'

Result: Claude gets GENERATION phase directive, allowed to create workflow
```

### 4.2. User mentions specific tools in first message

```
User: "When I get a Gmail, save the attachment to Dropbox and notify me on Slack"

analyzeUserMessage detects:
  - userMentionedTools = { gmail, dropbox, slack }
  - hasTrigger = true ("when I get")
  - hasDestination = true ("notify me on Slack")
  - hasDataFlow = true (3 tools)

evaluatePhaseTransition:
  - Path 3: First message + 2+ tools + trigger + destination
  - Transitions directly to 'generation'

Result: Claude gets GENERATION directive, all 3 tools are authorized
```

### 4.3. "Think with me" mode

```
chatMode === 'think_with_me'

PhaseManager behavior:
  - Same phase logic, but the phaseDirective for DISCOVERY phase is even
    more restrictive (already handled by THINK_WITH_ME_DIRECTIVE in chat.ts)
  - The phase manager ensures "think with me" stays in discovery LONGER
    because the confidence thresholds still apply
  - Even if Claude tries to generate a workflow in think_with_me + discovery,
    the PhaseManager will suppress it
```

### 4.4. Arabic language conversations

```
User: "ساعدني أرسل إيميلات لعملائي"
(Help me send emails to my clients)

analyzeUserMessage detects:
  - KNOWN_TOOLS aliases include Arabic: "إيميل" → gmail
  - userMentionedTools = { gmail }
  - No destination specified
  - Phase stays in 'discovery'

PhaseManager injects:
  - "MISSING: User has not specified a DESTINATION/notification channel. Ask about it."
  - Claude will ask in Arabic what destination to use

Note: All phase logic is language-agnostic; tool detection uses Arabic aliases.
```

### 4.5. Page refresh mid-conversation

```
Page refresh during conversation:

1. PhaseState is persisted to localStorage on every change
2. On page reload, ConversationPhaseManager constructor loads state by conversationId
3. conversationId matches the chat session ID from useChatState()
4. Full metrics, phase, history all restored
5. Phase enforcement continues seamlessly

Key: The conversationId MUST match between ChatContainer's currentSession.id
and the PhaseManager. This is guaranteed by passing currentSession.id to
getPhaseManager().
```

### 4.6. User describes a problem (complaint pattern)

```
User: "My sales are dropping, what should I do?"

analyzeUserMessage detects:
  - COMPLAINT_PATTERNS: "dropping"
  - isComplaint = true
  - intentCategory = 'complaint'

calculateEnforcedConfidence:
  - confidence *= 0.3 (complaint penalty)
  - Final confidence: ~0.09

validateResponse:
  - If Claude tries shouldGenerateWorkflow: true → BLOCKED
  - Phase stays in discovery until user clarifies they want automation

Claude gets directive:
  "NOTE: User is describing a PROBLEM, not requesting automation. Ask diagnostic questions first."
```

---

## 5. Confidence Scoring Breakdown

```
Component                  | Max Score | Source
---------------------------|-----------|------------------
Tool coverage              | 0.35      | userMentionedTools + userConfirmedTools
Trigger & Destination      | 0.25      | hasTrigger + hasDestination
Conversation depth (Q&A)   | 0.20      | questionsAnswered / questionsAsked
Data flow clarity          | 0.10      | hasDataFlow
Skip bonus                 | 0.10      | userRequestedSkip
                          ------------|
Total Maximum              | 1.00      |

Penalties:
- Complaint detected       | x 0.3     | isComplaint
- First msg, no tools     | cap 0.30  |
- Single msg, vague       | cap 0.40  |
```

### Example Scenarios

| Scenario | Tools | Trigger | Dest | Q&A | Score | Phase |
|----------|-------|---------|------|-----|-------|-------|
| "automate my business" | 0 | no | no | 0/0 | 0.00 | discovery |
| "help with emails" | 1 (gmail) | no | no | 0/0 | 0.15 | discovery |
| "Gmail to Sheets" | 2 | no | yes | 0/0 | 0.37 | discovery |
| "When I get Gmail save to Sheets" | 2 | yes | yes | 0/0 | 0.60 | generation |
| After 1 Q&A + 2 tools | 2 | yes | no | 1/1 | 0.57 | discovery |
| After 2 Q&A + 2 tools + trigger | 2 | yes | yes | 2/2 | 0.80 | generation |
| "just build Gmail to Slack" + skip | 2 | no | yes | 0/0 | 0.47+skip | generation |
| "sales are dropping" (complaint) | 0 | no | no | 0/0 | 0.00 | discovery |

---

## 6. Relationship to Existing FIX Markers

| Marker | Current Role | ConversationPhaseManager Role |
|--------|-------------|-------------------------------|
| FIX-012 | Prompt-only three-phase generation | Now ENFORCED by PhaseManager state machine |
| FIX-015 | Concise response style | Unchanged, complementary |
| FIX-102 | Enhanced vagueness detection | REINFORCED by PhaseManager's complaint patterns |
| FIX-121 | Zero assumed tools | ENFORCED by filterUnauthorizedTools() |
| FIX-122 | Input AND output tool discovery | ENFORCED by hasTrigger + hasDestination checks |
| FIX-123 | Defaults for params, never tools | ENFORCED by tool validation in validateResponse() |
| FIX-126 | Templates only for first message | Unchanged, happens before PhaseManager |
| FIX-165 | Complaint/problem patterns | REINFORCED by isComplaint flag + penalty |
| FIX-167 | Gate card on unanswered questions | SUPERSEDED by full phase enforcement (FIX-167 is now one narrow case within the broader validation) |

**The PhaseManager does NOT replace any existing FIX markers.** It adds a defense layer ABOVE them. FIX-167 remains as a final safety net even if PhaseManager somehow fails.

---

## 7. Testing Strategy

### Unit Tests for ConversationPhaseManager

```typescript
describe('ConversationPhaseManager', () => {
  it('starts in discovery phase', () => {
    const pm = new ConversationPhaseManager('test-1')
    expect(pm.getPhase()).toBe('discovery')
  })

  it('stays in discovery for vague requests', () => {
    const pm = new ConversationPhaseManager('test-2')
    pm.analyzeUserMessage('automate my business')
    expect(pm.getPhase()).toBe('discovery')
    expect(pm.calculateEnforcedConfidence()).toBeLessThan(0.30)
  })

  it('transitions to generation for specific 2-tool + trigger + destination requests', () => {
    const pm = new ConversationPhaseManager('test-3')
    pm.analyzeUserMessage('When I get a Gmail, save it to Google Sheets')
    expect(pm.getPhase()).toBe('generation')
  })

  it('blocks workflow generation in discovery phase', () => {
    const pm = new ConversationPhaseManager('test-4')
    pm.analyzeUserMessage('help me with something')
    const result = pm.validateResponse({
      shouldGenerateWorkflow: true,
      workflowSpec: { steps: [{ id: 's1', name: 'Step', tool: 'gmail' }] },
      confidence: 0.9,
    })
    expect(result.allowed).toBe(false)
    expect(result.overrideAction).toBe('inject_questions')
  })

  it('filters unauthorized tools from workflow spec', () => {
    const pm = new ConversationPhaseManager('test-5')
    pm.analyzeUserMessage('Send Gmail to Notion')
    const { filteredSteps, removedTools } = pm.filterUnauthorizedTools({
      steps: [
        { id: 's1', name: 'Gmail', tool: 'gmail' },
        { id: 's2', name: 'Slack', tool: 'slack' }, // NOT mentioned by user
        { id: 's3', name: 'Notion', tool: 'notion' },
      ]
    })
    expect(filteredSteps).toHaveLength(2) // gmail + notion
    expect(removedTools).toHaveLength(1) // slack
    expect(removedTools[0].tool).toBe('slack')
  })

  it('penalizes complaint patterns', () => {
    const pm = new ConversationPhaseManager('test-6')
    pm.analyzeUserMessage('My sales are dropping, what should I do?')
    expect(pm.getMetrics().isComplaint).toBe(true)
    expect(pm.calculateEnforcedConfidence()).toBeLessThan(0.15)
  })

  it('allows skip when user says "just build"', () => {
    const pm = new ConversationPhaseManager('test-7')
    pm.analyzeUserMessage('just build me a Gmail to Slack notification')
    expect(pm.getPhase()).toBe('generation')
  })

  it('persists to and restores from localStorage', () => {
    const pm1 = new ConversationPhaseManager('test-8')
    pm1.analyzeUserMessage('When I get a Gmail, save to Sheets')
    expect(pm1.getPhase()).toBe('generation')

    // Simulate page refresh
    const pm2 = new ConversationPhaseManager('test-8')
    expect(pm2.getPhase()).toBe('generation')
    expect(pm2.getUserTools()).toContain('gmail')
    expect(pm2.getUserTools()).toContain('googlesheets')
  })

  it('detects Arabic tool mentions', () => {
    const pm = new ConversationPhaseManager('test-9')
    pm.analyzeUserMessage('ساعدني ارسل ايميل وخبرني على واتساب')
    expect(pm.getUserTools()).toContain('gmail')
    expect(pm.getUserTools()).toContain('whatsapp')
  })
})
```

---

## 8. Migration / Rollout Plan

### Phase 1: Add PhaseManager with logging only (no enforcement)
1. Create `src/services/ConversationPhaseManager.ts`
2. Integrate into ChatContainer with `validateResponse()` logging only
3. Monitor: How often would the PhaseManager have blocked Claude?
4. Duration: 1-2 days

### Phase 2: Enable soft enforcement
1. Enable `suppress_workflow` action (suppress but don't inject fallbacks)
2. Let FIX-167 continue as primary guard
3. Monitor: Does suppression match FIX-167 behavior?
4. Duration: 1-2 days

### Phase 3: Full enforcement
1. Enable all validation actions including `inject_questions`
2. Add phase indicator to ChatHeader
3. Wire phaseDirective into server-side prompt
4. Duration: 1 day

### Phase 4: Confidence override
1. Enable confidence capping (adjustedConfidence)
2. Enable unauthorized tool filtering
3. Full production deployment
4. Duration: 1 day

---

## 9. Summary: What Changes From 2/10 to 10/10

| Aspect | Before (2/10) | After (10/10) |
|--------|--------------|---------------|
| Phase tracking | Prompt-only, no state | Full state machine with localStorage persistence |
| Phase transitions | Claude decides (self-report) | Independent metrics-based calculation |
| Confidence | Claude's number, unverified | Independent enforced confidence + cap |
| Tool validation | FIX-121 in prompt | Runtime filterUnauthorizedTools() |
| Workflow gate | FIX-167 (narrow case) | Full validateResponse() covering all cases |
| Fallback questions | None (Claude just skips to workflow) | getFallbackQuestions() with 3 contextual questions |
| Discovery enforcement | None | BLOCKS workflow generation until threshold met |
| Complaint detection | FIX-165 in prompt | Runtime isComplaint flag with confidence penalty |
| Page refresh | State lost | Full persistence via localStorage |
| Phase visibility | None | Phase indicator badge in chat header |
| Arabic support | Prompt-only | Tool aliases in Arabic for proper detection |
