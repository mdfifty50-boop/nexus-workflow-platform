/**
 * NexusAIService - Real Claude AI integration for Nexus
 *
 * This service calls the backend /api/chat route which uses real Claude AI.
 * Claude handles natural conversation, while we use pattern detection to
 * determine when to generate workflows.
 *
 * HYBRID APPROACH:
 * - Claude AI = Natural conversation, understanding, and reasoning
 * - Template system = Reliable workflow structure generation
 *
 * Updated: Trigger HMR refresh
 */

import { EMBEDDED_TOOLS, type GeneratedWorkflow } from './SmartWorkflowEngine'
import { userMemoryService } from './UserMemoryService'
import { userContextService } from './UserContextService'
// Finding #55: Wire IntentResolver into message pipeline for pre-parse intelligence
import { IntentResolverService } from './IntentResolver'
// Finding #16: Wire industry persona overlays for domain-specific AI behavior
import { INDUSTRY_PERSONAS } from '../lib/industry-personas'
// Finding #19: Retry with exponential backoff for transient API failures
import { withRetry } from '../lib/retry-helper'
// Finding #56: Arabic NLP preprocessing for intent context
import { containsArabic } from '../lib/arabic-normalizer'
// Finding #15: i18n support for error messages - Arabic/English
import i18n from '../i18n'
// Finding #26: Prayer time, Islamic calendar, and regional scheduling awareness
import { regionalSchedulingService } from './RegionalSchedulingService'

// Message format for Claude API
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Missing info item for confidence-based execution
export interface MissingInfoItem {
  question: string
  options: string[]
  field: string
}

// Custom integration info for unsupported apps
export interface CustomIntegrationInfo {
  appName: string
  displayName: string
  apiDocsUrl: string
  apiKeyUrl?: string
  steps: string[]
  keyHint: string
  category?: string
}

// Clarifying question for pre-generation phase
export interface ClarifyingQuestion {
  question: string
  options: string[]
  field: string
}

// Response from the AI service
export interface NexusAIResponse {
  text: string
  shouldGenerateWorkflow: boolean
  workflowSpec?: WorkflowSpec
  suggestedQuestions?: string[]
  intent?: string  // 'greeting' | 'clarifying' | 'workflow' | 'question'
  confidence?: number
  assumptions?: string[]  // What defaults were assumed
  missingInfo?: MissingInfoItem[]  // Questions to increase confidence (post-generation)
  clarifyingQuestions?: ClarifyingQuestion[]  // Questions to ask BEFORE generating (pre-generation)
  refiningWorkflowId?: string  // If set, update existing workflow instead of creating new
  customIntegrations?: CustomIntegrationInfo[]  // Unsupported apps that can use API keys
}

// Workflow specification extracted from Claude's response
export interface WorkflowSpec {
  name: string
  description: string
  steps: WorkflowStep[]
  requiredIntegrations: string[]
  estimatedTimeSaved: string
}

export interface WorkflowStep {
  id: string
  name: string
  description: string
  tool: string
  type: 'trigger' | 'action' | 'condition' | 'ai'
  config?: Record<string, any>
}

class NexusAIService {
  private static HISTORY_STORAGE_KEY = 'nexus_ai_conversation_history'
  private conversationHistory: ChatMessage[] = []

  constructor() {
    // Finding #13: Restore conversation history to prevent post-refresh amnesia
    try {
      const saved = localStorage.getItem(NexusAIService.HISTORY_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          this.conversationHistory = parsed.slice(-10) // Keep last 10
        }
      }
    } catch {
      // localStorage might not be available (Safari Private Browsing)
    }
  }

  /**
   * Finding #13: Persist conversation history to localStorage
   * Called after every push to conversationHistory to prevent post-refresh amnesia.
   */
  private persistHistory(): void {
    try {
      localStorage.setItem(
        NexusAIService.HISTORY_STORAGE_KEY,
        JSON.stringify(this.conversationHistory.slice(-10))
      )
    } catch {
      // Silent fail for Safari Private Browsing
    }
  }

  /**
   * Build user context string from stored business profile and preferences.
   * Uses UserMemoryService to aggregate all data sources into a rich context.
   */
  private buildUserContext(): string {
    // Finding #3: Inject current day/time so Claude can apply Layer 5 predictive intelligence
    const now = new Date()
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayOfWeek = days[now.getDay()]
    const hour = now.getHours()
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    // Kuwait work week: Sunday-Thursday
    const isKuwaitWorkday = now.getDay() >= 0 && now.getDay() <= 4
    let temporalContext = `Current date: ${dateStr} (${dayOfWeek})\nCurrent time: ${timeStr} (${timeOfDay})\nKuwait work day: ${isKuwaitWorkday ? 'Yes' : 'No (weekend)'}`

    // Finding #26: Inject Islamic calendar and prayer time awareness
    try {
      const ctx = regionalSchedulingService.getSchedulingContext()
      const hijri = ctx.hijriDate
      temporalContext += `\nIslamic date: ${hijri.day} ${hijri.monthName} ${hijri.year} AH`
      if (ctx.isRamadan) {
        temporalContext += `\nRAMADAN ACTIVE: Working hours ${ctx.workingHours.startHour}:00-${ctx.workingHours.endHour}:00. Be mindful of fasting hours.`
      }
      const nextPrayer = ctx.prayerTimes.nextPrayer
      if (nextPrayer) {
        const prayerTimeStr = regionalSchedulingService.formatPrayerTime(nextPrayer.time)
        temporalContext += `\nNext prayer: ${nextPrayer.name} at ${prayerTimeStr}`
      }
      if (ctx.upcomingHolidays.length > 0) {
        const holiday = ctx.upcomingHolidays[0]
        temporalContext += `\nUpcoming holiday: ${holiday.name} (${holiday.nameAr})`
      }
    } catch {
      // RegionalSchedulingService not available - non-critical
    }

    try {
      const memory = userMemoryService.getMemoryForAI()
      const contextParts: string[] = [temporalContext]
      if (memory) contextParts.push(memory)

      // Finding #16: Inject industry persona overlay for domain-specific AI behavior
      try {
        const profileRaw = localStorage.getItem('nexus_business_profile')
        if (profileRaw) {
          const profile = JSON.parse(profileRaw)
          const industryKey = profile.industry?.toLowerCase()?.replace(/[\s&]+/g, '') || ''
          const persona = INDUSTRY_PERSONAS[industryKey]
          if (persona) {
            // Use 'analyst' overlay as the general Nexus context (closest to assistant role)
            const overlay = persona.agentOverlays['analyst'] || Object.values(persona.agentOverlays)[0]
            if (overlay) {
              contextParts.push(`## Industry Context: ${persona.name}\n${overlay.industryContext}\nKey principles: ${overlay.specializedPrinciples.join('; ')}`)
            }
          }
        }
      } catch (e) { console.warn('[NexusAIService] Failed to load industry persona:', e) }

      // Finding #51: Adapt AI tone based on user maturity level
      try {
        const memProfile = userMemoryService.buildMemoryProfile()
        const level = memProfile.maturityLevel
        if (level === 'new') {
          contextParts.push('## Communication Style\nUser is NEW to automation. Be extra friendly, explain concepts, use simple language, suggest step-by-step guidance. Avoid jargon.')
        } else if (level === 'learning') {
          contextParts.push('## Communication Style\nUser is LEARNING automation. Be encouraging, explain briefly when introducing new concepts, offer tips proactively.')
        } else if (level === 'proficient') {
          contextParts.push('## Communication Style\nUser is PROFICIENT with automation. Be concise, skip basic explanations, focus on efficiency and advanced options.')
        } else if (level === 'power_user') {
          contextParts.push('## Communication Style\nUser is a POWER USER. Be terse and direct. Skip all explanations. Show advanced options first. Respect their expertise.')
        }
      } catch (e) { console.warn('[NexusAIService] Failed to compute maturity level:', e) }

      // Finding #30 + Finding #61: Detect language mix pattern for bilingual code-switching
      // @NEXUS-FIX-160: SKIP auto-detection when language is explicitly set via UI - DO NOT REMOVE
      // The server-side chat.ts already adds a comprehensive language instruction when
      // the user selects a language from the UI. Adding a second instruction here causes
      // Claude to receive CONFLICTING duplicate language rules, which breaks Arabic JSON responses.
      if (!this._explicitLanguageSet) {
        try {
          const lastUserMsg = this.conversationHistory.filter(m => m.role === 'user').slice(-1)[0]
          if (lastUserMsg && lastUserMsg.content.length > 0) {
            // Count Arabic characters (extended Unicode ranges for Arabic script)
            const arabicChars = (lastUserMsg.content.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length
            // Count Latin/English characters
            const englishChars = (lastUserMsg.content.match(/[a-zA-Z]/g) || []).length
            const totalLangChars = arabicChars + englishChars
            if (totalLangChars > 0) {
              const arabicRatio = arabicChars / totalLangChars
              if (arabicRatio > 0.8) {
                contextParts.push('## Language Preference\nUser prefers Arabic with English technical terms. Respond in Gulf Arabic dialect, keeping tech terms (workflow, automation, trigger, action, API, app) in English. Use Kuwaiti expressions naturally. IMPORTANT: Always maintain JSON response format with English field names.')
              } else if (arabicRatio < 0.2) {
                contextParts.push('## Language Preference\nUser prefers English.')
              } else {
                contextParts.push('## Language Preference\nUser uses Arabic-English code-switching. Match their bilingual mix style: conversational parts in Arabic (Gulf dialect), technical/business terms in English. Keep workflowSpec fields always in English.')
              }
            }
          }
        } catch (e) { console.warn('[NexusAIService] Failed to detect language preference:', e) }
      }

      return contextParts.join('\n\n')
    } catch {
      // Fallback: minimal context if memory service fails
      const parts: string[] = [temporalContext]
      try {
        const profileRaw = localStorage.getItem('nexus_business_profile')
        if (profileRaw) {
          const profile = JSON.parse(profileRaw)
          if (profile.industry) parts.push(`Industry: ${profile.industry}`)
          if (profile.primaryRole) parts.push(`Role: ${profile.primaryRole}`)
        }
      } catch (e) { console.warn('[NexusAIService] Failed to load business profile fallback:', e) }
      try {
        const userCtxRaw = localStorage.getItem('nexus_user_context')
        if (userCtxRaw) {
          const userCtx = JSON.parse(userCtxRaw)
          if (userCtx.email) parts.push(`Email: ${userCtx.email}`)
          if (userCtx.name) parts.push(`Name: ${userCtx.name}`)
        }
      } catch (e) { console.warn('[NexusAIService] Failed to load user context fallback:', e) }
      return parts.join('\n')
    }
  }

  /**
   * Send a message to Claude and get a response
   * @param userMessage The user's message
   * @param context Optional context including chatMode for "Think with me" mode
   */
  // @NEXUS-FIX-160: Track if language was explicitly set via UI to avoid duplicate instructions - DO NOT REMOVE
  private _explicitLanguageSet = false

  async chat(userMessage: string, context?: { persona?: string; chatMode?: 'standard' | 'think_with_me'; language?: string }): Promise<NexusAIResponse> {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    })

    // Keep history manageable (last 10 messages)
    if (this.conversationHistory.length > 10) {
      this.conversationHistory = this.conversationHistory.slice(-10)
    }

    // Finding #13: Persist after adding user message
    this.persistHistory()

    try {
      console.log('[NexusAIService] Calling Claude AI via /api/chat...', { chatMode: context?.chatMode })

      // @NEXUS-FIX-160: Track if language was explicitly set to avoid duplicate Arabic instructions - DO NOT REMOVE
      this._explicitLanguageSet = !!(context?.language && context.language !== 'en-US')

      // Build user context from stored business profile + preferences
      const userContext = this.buildUserContext()

      // Extract entities (emails, names, channels, times) for cross-conversation memory
      userContextService.extractFromMessage(userMessage)

      // Finding #55: Pre-parse user intent before sending to Claude
      // Gives Claude structured integration/action/param data alongside natural language
      let intentContext: string | undefined
      try {
        const resolved = IntentResolverService.resolve(userMessage)
        if (resolved.success && resolved.integrations.length > 0) {
          const parts: string[] = [`Detected integrations: ${resolved.integrations.map(i => `${i.normalizedName}(${i.action})`).join(', ')}`]
          if (resolved.extractedParams.length > 0) {
            parts.push(`Extracted params: ${resolved.extractedParams.map(p => `${p.type}=${p.value}`).join(', ')}`)
          }
          if (resolved.unsupportedTools.length > 0) {
            parts.push(`Unsupported: ${resolved.unsupportedTools.map(u => u.requested).join(', ')}`)
          }
          parts.push(`Intent confidence: ${resolved.confidence}`)
          // Finding #56: Flag Arabic input so backend can apply regional context
          if (containsArabic(userMessage)) {
            parts.push('Language: Arabic detected - apply Gulf dialect awareness and regional context')
          }
          intentContext = parts.join(' | ')
        }
      } catch (e) { console.warn('[NexusAIService] IntentResolver failed (non-blocking):', e) }

      // Finding #56: Even if IntentResolver found no integrations, still flag Arabic for backend
      if (!intentContext && containsArabic(userMessage)) {
        intentContext = 'Language: Arabic detected - apply Gulf dialect awareness and regional context'
      }

      // Call the backend chat API via Vite proxy (which uses real Claude)
      // Finding #4: AbortSignal.timeout prevents indefinite hangs - 30s for standard, 45s for think_with_me
      const timeoutMs = context?.chatMode === 'think_with_me' ? 45000 : 30000

      // Finding #19: Wrap fetch in retry with exponential backoff (1s, 3s delays)
      // Only retries on 5xx server errors or network failures, NOT on 4xx client errors
      const result = await withRetry(
        async () => {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messages: this.conversationHistory,
              agentId: 'nexus',
              model: 'claude-sonnet-4-6',
              maxTokens: 4096,
              chatMode: context?.chatMode || 'standard',
              userContext: userContext || undefined,
              intentContext: intentContext || undefined,
              language: context?.language || undefined
            }),
            signal: AbortSignal.timeout(timeoutMs),
          })

          if (!response.ok) {
            const err = new Error(`API error: ${response.status}`)
            // Only retry on server errors (5xx), not client errors (4xx)
            ;(err as any).statusCode = response.status
            throw err
          }

          return response.json()
        },
        {
          maxRetries: 2,
          baseDelay: 1000,
          maxDelay: 3000,
          backoffMultiplier: 2,
          useJitter: true,
          shouldRetry: (error: Error) => {
            const status = (error as any).statusCode
            // Retry on 5xx, network errors, or timeouts. NOT on 4xx
            return !status || status >= 500
          },
          onRetry: (_error: Error, attempt: number) => {
            console.warn(`[NexusAIService] Retrying chat request (attempt ${attempt})...`)
          }
        }
      )

      if (!result.success) {
        throw new Error(result.error || 'API call failed')
      }

      // Parse Claude's response
      const aiResponse = this.parseResponse(result.output)

      // Add custom integrations from the API response (detected unsupported apps)
      if (result.customIntegrations && result.customIntegrations.length > 0) {
        aiResponse.customIntegrations = result.customIntegrations
        console.log('[NexusAIService] Custom integrations available:', result.customIntegrations.map((c: CustomIntegrationInfo) => c.displayName))
      }

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: aiResponse.text
      })

      // Finding #13: Persist after adding assistant response
      this.persistHistory()

      return aiResponse

    } catch (error) {
      console.error('[NexusAIService] Error calling Claude:', error)

      // Finding #4: Detect timeout vs other errors for user-friendly messaging
      const isTimeout = error instanceof DOMException && error.name === 'TimeoutError'
      const isAbort = error instanceof DOMException && error.name === 'AbortError'

      // Finding #15: Use i18n translations for error messages (Arabic/English)
      const text = isTimeout || isAbort
        ? i18n.t('errors.aiTimeout')
        : i18n.t('errors.aiNetworkError')

      return {
        text,
        shouldGenerateWorkflow: false,
        intent: 'error',
        confidence: 0
      }
    }
  }

  /**
   * Finding #14: Stream a message to Claude via SSE and receive tokens in real-time
   * Falls back to non-streaming chat() on any error.
   *
   * @param userMessage The user's message
   * @param onToken Callback fired for each incremental token received
   * @param context Optional context including chatMode for "Think with me" mode
   * @returns The final parsed NexusAIResponse (same shape as chat())
   */
  async chatStream(
    userMessage: string,
    onToken: (token: string) => void,
    context?: { persona?: string; chatMode?: 'standard' | 'think_with_me'; language?: string }
  ): Promise<NexusAIResponse> {
    // Add user message to history (same as chat())
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    })

    // Keep history manageable (last 10 messages)
    if (this.conversationHistory.length > 10) {
      this.conversationHistory = this.conversationHistory.slice(-10)
    }

    // Finding #13: Persist after adding user message (stream path)
    this.persistHistory()

    try {
      console.log('[NexusAIService] Starting SSE stream via /api/chat/stream...', { chatMode: context?.chatMode })

      // @NEXUS-FIX-160: Track if language was explicitly set to avoid duplicate Arabic instructions (stream path) - DO NOT REMOVE
      this._explicitLanguageSet = !!(context?.language && context.language !== 'en-US')

      // Build user context
      const userContext = this.buildUserContext()

      // Extract entities for cross-conversation memory
      userContextService.extractFromMessage(userMessage)

      // Finding #55: Pre-parse user intent
      let intentContext: string | undefined
      try {
        const resolved = IntentResolverService.resolve(userMessage)
        if (resolved.success && resolved.integrations.length > 0) {
          const parts: string[] = [`Detected integrations: ${resolved.integrations.map(i => `${i.normalizedName}(${i.action})`).join(', ')}`]
          if (resolved.extractedParams.length > 0) {
            parts.push(`Extracted params: ${resolved.extractedParams.map(p => `${p.type}=${p.value}`).join(', ')}`)
          }
          if (resolved.unsupportedTools.length > 0) {
            parts.push(`Unsupported: ${resolved.unsupportedTools.map(u => u.requested).join(', ')}`)
          }
          parts.push(`Intent confidence: ${resolved.confidence}`)
          // Finding #56: Flag Arabic input so backend can apply regional context (stream path)
          if (containsArabic(userMessage)) {
            parts.push('Language: Arabic detected - apply Gulf dialect awareness and regional context')
          }
          intentContext = parts.join(' | ')
        }
      } catch (e) { console.warn('[NexusAIService] IntentResolver failed (non-blocking):', e) }

      // Finding #56: Even if IntentResolver found no integrations, still flag Arabic for backend (stream path)
      if (!intentContext && containsArabic(userMessage)) {
        intentContext = 'Language: Arabic detected - apply Gulf dialect awareness and regional context'
      }

      const timeoutMs = context?.chatMode === 'think_with_me' ? 45000 : 30000
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: this.conversationHistory,
          agentId: 'nexus',
          model: 'claude-sonnet-4-6',
          maxTokens: 4096,
          chatMode: context?.chatMode || 'standard',
          userContext: userContext || undefined,
          intentContext: intentContext || undefined,
          language: context?.language || undefined
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Stream API error: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by this browser')
      }

      // Parse the SSE stream
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let finalResponse: NexusAIResponse | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Process complete SSE events from the buffer
        const lines = buffer.split('\n')
        buffer = '' // Reset buffer; incomplete line goes back

        let currentEvent = ''
        let currentData = ''

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]

          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim()
          } else if (line.startsWith('data: ')) {
            currentData = line.slice(6)
          } else if (line === '' && currentEvent) {
            // Empty line = end of event
            try {
              const parsed = JSON.parse(currentData)

              if (currentEvent === 'token') {
                onToken(parsed.text || '')
              } else if (currentEvent === 'complete') {
                // Final structured response
                const message = parsed.message || ''
                finalResponse = {
                  text: message,
                  shouldGenerateWorkflow: parsed.shouldGenerateWorkflow || false,
                  workflowSpec: parsed.workflowSpec,
                  suggestedQuestions: parsed.suggestedQuestions,
                  intent: parsed.intent,
                  confidence: parsed.confidence,
                  assumptions: parsed.assumptions,
                  missingInfo: parsed.missingInfo,
                  clarifyingQuestions: parsed.clarifyingQuestions,
                  refiningWorkflowId: parsed.refiningWorkflowId,
                  customIntegrations: parsed.customIntegrations
                }
              } else if (currentEvent === 'error') {
                console.error('[NexusAIService] Stream error event:', parsed.error)
                throw new Error(parsed.error || 'Stream error')
              }
              // 'done' event is handled by the stream ending
            } catch (parseErr) {
              // If JSON parse fails for a non-empty data line, skip it
              if (currentData.trim()) {
                console.warn('[NexusAIService] Failed to parse SSE data:', currentData)
              }
            }

            currentEvent = ''
            currentData = ''
          } else if (line !== '' && !line.startsWith('event:') && !line.startsWith('data:')) {
            // Incomplete line - put it back in the buffer for next chunk
            buffer = lines.slice(i).join('\n')
            break
          }
        }
      }

      if (!finalResponse) {
        throw new Error('Stream ended without complete event')
      }

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: finalResponse.text
      })

      // Finding #13: Persist after adding assistant response (stream path)
      this.persistHistory()

      return finalResponse

    } catch (error) {
      console.warn('[NexusAIService] Streaming failed, falling back to non-streaming chat():', error)
      // Remove the user message we already added (chat() will re-add it)
      this.conversationHistory.pop()
      this.persistHistory() // Finding #13: Keep localStorage in sync after pop
      // Fallback to non-streaming
      return this.chat(userMessage, context)
    }
  }

  /**
   * Extract the first complete top-level JSON object from text using brace-depth tracking.
   * Unlike a greedy regex (/\{[\s\S]*\}/), this correctly handles nested braces,
   * string escapes, and avoids capturing unrelated trailing content.
   * @NEXUS-FIX-160: Brace-depth JSON extractor for Arabic-safe parsing - DO NOT REMOVE
   */
  private extractJSON(text: string): string | null {
    const start = text.indexOf('{')
    if (start === -1) return null

    let depth = 0
    let inString = false
    let escaped = false

    for (let i = start; i < text.length; i++) {
      const char = text[i]

      if (escaped) { escaped = false; continue }
      if (char === '\\' && inString) { escaped = true; continue }
      if (char === '"' && !escaped) { inString = !inString; continue }
      if (inString) continue

      if (char === '{') depth++
      if (char === '}') {
        depth--
        if (depth === 0) return text.substring(start, i + 1)
      }
    }
    return null
  }

  /**
   * Validate that a workflowSpec has all minimum required fields.
   * Prevents invalid/incomplete specs from creating broken workflow cards.
   * @NEXUS-FIX-160: Workflow spec validation gate - DO NOT REMOVE
   */
  private isValidWorkflowSpec(spec: unknown): spec is WorkflowSpec {
    if (!spec || typeof spec !== 'object') return false
    const s = spec as Record<string, unknown>
    return (
      typeof s.name === 'string' && s.name.length > 0 &&
      Array.isArray(s.steps) &&
      s.steps.length > 0 &&
      s.steps.every((step: unknown) => {
        if (!step || typeof step !== 'object') return false
        const st = step as Record<string, unknown>
        return typeof st.id === 'string' && typeof st.name === 'string' && typeof st.tool === 'string'
      })
    )
  }

  /**
   * Parse Claude's JSON response into our format
   * CRITICAL: This must NEVER return raw JSON as text - always extract the message field
   * @NEXUS-FIX-160: Arabic-safe JSON parsing with brace-depth extraction - DO NOT REMOVE
   */
  private parseResponse(output: string): NexusAIResponse {
    try {
      // Use brace-depth extractor instead of greedy regex (fixes Arabic text issues)
      const jsonStr = this.extractJSON(output)
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr)

        // CRITICAL: Extract clean message, NEVER return raw JSON to user
        const cleanMessage = parsed.message ||
                            parsed.text ||
                            parsed.response ||
                            parsed.content ||
                            "I understand. How can I help you with workflow automation?"

        // @NEXUS-FIX-160: Only allow shouldGenerateWorkflow if spec is valid - DO NOT REMOVE
        const wantsWorkflow = parsed.shouldGenerateWorkflow === true
        const specIsValid = this.isValidWorkflowSpec(parsed.workflowSpec)

        return {
          text: cleanMessage,
          shouldGenerateWorkflow: wantsWorkflow && specIsValid,
          workflowSpec: specIsValid ? parsed.workflowSpec : undefined,
          suggestedQuestions: parsed.suggestedQuestions,
          intent: parsed.intent,
          confidence: parsed.confidence,
          assumptions: parsed.assumptions,
          missingInfo: parsed.missingInfo,
          clarifyingQuestions: parsed.clarifyingQuestions,  // CRITICAL: Extract for two-phase workflow generation
          refiningWorkflowId: parsed.refiningWorkflowId,    // For workflow refinement mode
          customIntegrations: parsed.customIntegrations
        }
      }
    } catch (e) {
      console.warn('[NexusAIService] Failed to parse JSON response, using recovery path')
    }

    // If JSON parsing fails but output looks like JSON, try to extract message anyway
    if (output.trim().startsWith('{')) {
      console.warn('[NexusAIService] Output looks like JSON but parsing failed, attempting recovery')
      // @NEXUS-FIX-160: Arabic-safe regex for message extraction - DO NOT REMOVE
      // Use a regex that correctly handles escaped characters inside JSON strings,
      // including Arabic Unicode content (the [^"\\] class matches any non-quote/non-backslash char)
      const messageMatch = output.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/i)
      if (messageMatch) {
        // Unescape the JSON string
        const extractedMessage = messageMatch[1]
          .replace(/\\"/g, '"')
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\\\/g, '\\')
          .replace(/\\u([0-9a-fA-F]{4})/g, (_m, hex) => String.fromCharCode(parseInt(hex, 16)))
        return {
          text: extractedMessage,
          shouldGenerateWorkflow: false,
          intent: 'recovered'
        }
      }
      // Fallback: Remove all JSON structure characters to get something readable
      return {
        text: "I'm here to help you automate workflows. What would you like to create?",
        shouldGenerateWorkflow: false,
        intent: 'fallback'
      }
    }

    // If it's plain text, return as-is
    return {
      text: output,
      shouldGenerateWorkflow: false
    }
  }

  /**
   * Convert workflow spec to GeneratedWorkflow format
   */
  specToWorkflow(spec: WorkflowSpec): GeneratedWorkflow {
    const nodes = spec.steps.map((step, index) => ({
      id: step.id || `node_${index + 1}`,
      type: step.type || 'action',
      tool: step.tool,
      name: step.name,
      description: step.description,
      toolIcon: EMBEDDED_TOOLS.find(t => t.id === step.tool)?.icon || '⚡',
      config: step.config || {},
      position: { x: 100, y: 100 + (index * 120) }
    }))

    // Create connections between sequential nodes
    const connections = nodes.slice(0, -1).map((node, index) => ({
      from: node.id,
      to: nodes[index + 1].id
    }))

    return {
      id: `workflow-${Date.now()}`,
      name: spec.name,
      description: spec.description,
      nodes,
      connections,
      requiredIntegrations: spec.requiredIntegrations,
      estimatedTimeSaved: spec.estimatedTimeSaved,
      complexity: nodes.length <= 3 ? 'simple' : nodes.length <= 6 ? 'medium' : 'complex'
    }
  }

  /**
   * Clear conversation history (for new chat)
   * Finding #13: Also clears persisted localStorage to prevent stale amnesia
   */
  clearHistory() {
    this.conversationHistory = []
    try {
      localStorage.removeItem(NexusAIService.HISTORY_STORAGE_KEY)
    } catch {
      // Silent fail for Safari Private Browsing
    }
  }

  /**
   * Get current conversation history
   */
  getHistory(): ChatMessage[] {
    return [...this.conversationHistory]
  }

  /**
   * Finding #13: Set conversation history from persisted messages
   * Fixes post-refresh amnesia - restores Claude's memory of the conversation
   */
  setConversationHistory(messages: Array<{ role: string; content: string }>) {
    this.conversationHistory = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    // Finding #13: Persist restored history so it survives future refreshes
    this.persistHistory()
  }
}

// Export singleton instance
export const nexusAIService = new NexusAIService()
export default nexusAIService
