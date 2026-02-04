/**
 * AI Suggestions Service
 *
 * Generates personalized workflow suggestions using tiered LLM models.
 * Uses the claudeProxy tiering system for cost optimization:
 * - Haiku: Pattern detection, classification (~$0.25/1M tokens)
 * - Sonnet: Daily suggestions, workflow generation (~$3/1M tokens)
 * - Opus: Weekly deep analysis, strategic recommendations (~$15/1M tokens)
 *
 * Integrates with Supabase tables:
 * - ai_suggestions: Stores generated suggestions
 * - user_patterns: Stores detected behavior patterns
 * - suggestion_feedback: Tracks user actions for learning
 * - user_analytics: Pre-computed metrics
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import { tieredCalls, callClaudeWithTiering, ModelTier } from './claudeProxy.js'

// =============================================================================
// TYPES
// =============================================================================

export interface AISuggestion {
  id: string
  user_id: string
  suggestion_type: SuggestionType
  title: string
  description: string
  workflow_spec?: WorkflowSpec
  related_workflow_id?: string
  related_integrations?: string[]
  confidence: number
  estimated_time_saved_minutes?: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: SuggestionStatus
  model_used?: string
  generation_cost_usd?: number
  created_at: string
}

export type SuggestionType =
  | 'new_workflow'      // Brand new workflow suggestion
  | 'optimization'      // Improve existing workflow
  | 'integration'       // Connect a new app
  | 'automation'        // Automate a manual task
  | 'time_pattern'      // Schedule-based suggestion
  | 'failure_fix'       // Fix a failing workflow

export type SuggestionStatus =
  | 'pending'    // Not yet shown
  | 'shown'      // Displayed to user
  | 'accepted'   // User clicked to implement
  | 'rejected'   // User dismissed
  | 'ignored'    // Shown but no action for 7+ days
  | 'expired'    // Too old, no longer relevant

export interface UserPattern {
  id: string
  user_id: string
  pattern_type: PatternType
  pattern_data: Record<string, unknown>
  confidence: number
  sample_count: number
  first_detected_at: string
  last_observed_at: string
  is_active: boolean
}

export type PatternType =
  | 'peak_usage_time'       // When user is most active
  | 'repeated_manual'       // Manually triggered workflows
  | 'workflow_sequence'     // Workflows often run together
  | 'integration_combo'     // Integrations used together
  | 'failure_pattern'       // Recurring failures
  | 'time_of_week'          // Day-of-week patterns
  | 'execution_volume'      // High/low volume periods
  | 'response_time'         // How fast user acts on suggestions

export interface WorkflowSpec {
  name: string
  description: string
  steps: Array<{
    id: string
    name: string
    tool: string
    type: 'trigger' | 'action'
    config?: Record<string, unknown>
  }>
  requiredIntegrations: string[]
  estimatedTimeSaved?: string
}

export interface UserContext {
  userId: string
  industry?: string
  subscriptionTier: 'free' | 'pro' | 'enterprise'
  workflows: WorkflowSummary[]
  recentExecutions: ExecutionSummary[]
  connectedIntegrations: string[]
  patterns?: UserPattern[]
}

interface WorkflowSummary {
  id: string
  name: string
  description?: string
  status: string
  trigger_type?: string
  integrations: string[]
  execution_count: number
  success_rate: number
  last_executed_at?: string
}

interface ExecutionSummary {
  workflow_id: string
  workflow_name: string
  status: 'success' | 'failed' | 'partial'
  executed_at: string
  duration_ms?: number
  error_message?: string
}

// =============================================================================
// SUPABASE CLIENT
// =============================================================================

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const isValidServiceKey = supabaseServiceKey.startsWith('eyJ')
const hasValidCredentials = supabaseUrl && isValidServiceKey

let supabase: SupabaseClient | null = null

if (hasValidCredentials) {
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// In-memory fallback storage
const inMemorySuggestions: Map<string, AISuggestion[]> = new Map()
const inMemoryPatterns: Map<string, UserPattern[]> = new Map()

// =============================================================================
// PROMPT TEMPLATES
// =============================================================================

const SUGGESTION_SYSTEM_PROMPT = `You are Nexus AI, an intelligent workflow automation assistant. Your job is to analyze user's workflow patterns and suggest personalized automations that will save them time.

GUIDELINES:
1. Suggest PRACTICAL automations the user will actually use
2. Consider the user's industry and connected integrations
3. Prioritize high-impact, easy-to-implement suggestions
4. Be specific - include tool names and clear steps
5. Estimate realistic time savings

OUTPUT FORMAT (JSON):
{
  "suggestions": [
    {
      "type": "new_workflow|optimization|integration|automation|time_pattern|failure_fix",
      "title": "Short descriptive title",
      "description": "Clear explanation of what this does and why it helps",
      "workflow_spec": {
        "name": "Workflow Name",
        "description": "What it does",
        "steps": [
          {"id": "step_1", "name": "Step Name", "tool": "integration", "type": "trigger|action"}
        ],
        "requiredIntegrations": ["integration1"],
        "estimatedTimeSaved": "X hours/week"
      },
      "confidence": 0.85,
      "priority": "low|medium|high|critical",
      "estimated_time_saved_minutes": 60
    }
  ]
}`

const PATTERN_DETECTION_PROMPT = `Analyze the following user workflow data and identify behavioral patterns.

Look for:
1. Peak usage times (when they're most active)
2. Repeated manual triggers (workflows they run by hand often)
3. Workflow sequences (workflows that run together)
4. Integration combinations (apps used together)
5. Failure patterns (recurring issues)
6. Day-of-week patterns (Monday vs Friday behavior)

OUTPUT FORMAT (JSON):
{
  "patterns": [
    {
      "type": "peak_usage_time|repeated_manual|workflow_sequence|integration_combo|failure_pattern|time_of_week|execution_volume|response_time",
      "key": "unique_pattern_identifier",
      "data": { "details": "here" },
      "confidence": 0.85,
      "insight": "What this means for the user"
    }
  ]
}`

// =============================================================================
// SERVICE IMPLEMENTATION
// =============================================================================

export const aiSuggestionsService = {
  /**
   * Generate personalized suggestions for a user
   * Uses Sonnet tier for balanced cost/quality
   */
  async generateSuggestions(
    context: UserContext,
    maxSuggestions: number = 3
  ): Promise<AISuggestion[]> {
    try {
      console.log(`[AISuggestions] Generating suggestions for user ${context.userId}`)

      // Build the user context prompt
      const contextPrompt = this.buildContextPrompt(context)

      // Call Claude with Sonnet tier (balanced cost/quality)
      const result = await callClaudeWithTiering({
        systemPrompt: SUGGESTION_SYSTEM_PROMPT,
        userMessage: contextPrompt,
        maxTokens: 2048,
        forceTier: 'sonnet',
        taskType: 'workflow_planning'
      })

      console.log(`[AISuggestions] Generated with ${result.tier} model, cost: $${result.costUSD.toFixed(6)}`)

      // Parse the response
      const suggestions = this.parseSuggestions(result.text, context.userId, result.tier, result.costUSD)

      // Store suggestions in database
      await this.storeSuggestions(suggestions.slice(0, maxSuggestions))

      return suggestions.slice(0, maxSuggestions)
    } catch (error) {
      console.error('[AISuggestions] Error generating suggestions:', error)
      return []
    }
  },

  /**
   * Generate quick suggestions using Haiku (cheapest tier)
   * Good for simple pattern-based recommendations
   */
  async generateQuickSuggestions(
    context: UserContext
  ): Promise<AISuggestion[]> {
    try {
      const simplePrompt = `User has ${context.workflows.length} workflows using ${context.connectedIntegrations.join(', ')}.
Recent failures: ${context.recentExecutions.filter(e => e.status === 'failed').length}.
Suggest 2 quick wins.`

      const result = await tieredCalls.classify(
        'Suggest 2 simple workflow improvements. JSON format: {"suggestions": [{"title": "...", "description": "..."}]}',
        simplePrompt,
        500
      )

      const suggestions = this.parseSuggestions(result.text, context.userId, result.tier, result.costUSD)
      return suggestions.slice(0, 2)
    } catch (error) {
      console.error('[AISuggestions] Error generating quick suggestions:', error)
      return []
    }
  },

  /**
   * Deep analysis using Opus (most capable, expensive)
   * Run weekly for strategic recommendations
   */
  async generateStrategicAnalysis(
    context: UserContext
  ): Promise<{
    suggestions: AISuggestion[]
    insights: string[]
    recommendedNextSteps: string[]
  }> {
    try {
      console.log(`[AISuggestions] Running strategic analysis for user ${context.userId}`)

      const deepPrompt = `Perform a comprehensive analysis of this user's automation setup.

USER CONTEXT:
${JSON.stringify(context, null, 2)}

Provide:
1. Strategic suggestions for workflow improvements
2. Insights about their automation maturity
3. Recommended next steps for scaling their automation

Output JSON: {
  "suggestions": [...],
  "insights": ["insight1", "insight2"],
  "recommendedNextSteps": ["step1", "step2"]
}`

      const result = await tieredCalls.complexReasoning(
        SUGGESTION_SYSTEM_PROMPT,
        deepPrompt,
        4096
      )

      const parsed = JSON.parse(result.text)
      const suggestions = this.parseSuggestions(
        JSON.stringify({ suggestions: parsed.suggestions || [] }),
        context.userId,
        result.tier,
        result.costUSD
      )

      return {
        suggestions,
        insights: parsed.insights || [],
        recommendedNextSteps: parsed.recommendedNextSteps || []
      }
    } catch (error) {
      console.error('[AISuggestions] Error in strategic analysis:', error)
      return { suggestions: [], insights: [], recommendedNextSteps: [] }
    }
  },

  /**
   * Detect patterns in user behavior
   * Uses Haiku for cost-effective analysis
   */
  async detectPatterns(
    userId: string,
    executions: ExecutionSummary[],
    workflows: WorkflowSummary[]
  ): Promise<UserPattern[]> {
    try {
      if (executions.length < 5) {
        console.log('[AISuggestions] Not enough executions for pattern detection')
        return []
      }

      const dataPrompt = `Analyze this workflow execution data:

WORKFLOWS: ${JSON.stringify(workflows.slice(0, 10), null, 2)}
RECENT EXECUTIONS: ${JSON.stringify(executions.slice(0, 50), null, 2)}

Identify patterns.`

      const result = await tieredCalls.extract(
        PATTERN_DETECTION_PROMPT,
        dataPrompt,
        1000
      )

      const patterns = this.parsePatterns(result.text, userId)

      // Store patterns
      await this.storePatterns(patterns)

      return patterns
    } catch (error) {
      console.error('[AISuggestions] Error detecting patterns:', error)
      return []
    }
  },

  /**
   * Get pending suggestions for a user
   */
  async getPendingSuggestions(userId: string): Promise<AISuggestion[]> {
    if (!supabase) {
      return inMemorySuggestions.get(userId)?.filter(s => s.status === 'pending') || []
    }

    const { data, error } = await supabase
      .from('ai_suggestions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['pending', 'shown'])
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('[AISuggestions] Error fetching suggestions:', error)
      return []
    }

    return data || []
  },

  /**
   * Mark a suggestion as shown
   */
  async markSuggestionShown(suggestionId: string): Promise<void> {
    if (!supabase) {
      // Update in-memory
      for (const [userId, suggestions] of inMemorySuggestions) {
        const suggestion = suggestions.find(s => s.id === suggestionId)
        if (suggestion) {
          suggestion.status = 'shown'
          break
        }
      }
      return
    }

    await supabase
      .from('ai_suggestions')
      .update({ status: 'shown', shown_at: new Date().toISOString() })
      .eq('id', suggestionId)
  },

  /**
   * Record user feedback on a suggestion
   */
  async recordFeedback(
    suggestionId: string,
    userId: string,
    action: 'clicked' | 'implemented' | 'modified' | 'rejected' | 'reported',
    feedback?: { rating?: number; text?: string; modifications?: Record<string, unknown> }
  ): Promise<void> {
    if (!supabase) {
      console.log(`[AISuggestions] Feedback recorded (in-memory): ${action}`)
      return
    }

    // Update suggestion status
    const statusMap = {
      clicked: 'shown',
      implemented: 'accepted',
      modified: 'accepted',
      rejected: 'rejected',
      reported: 'rejected'
    }

    await supabase
      .from('ai_suggestions')
      .update({
        status: statusMap[action],
        acted_at: new Date().toISOString()
      })
      .eq('id', suggestionId)

    // Record detailed feedback
    await supabase
      .from('suggestion_feedback')
      .insert({
        suggestion_id: suggestionId,
        user_id: userId,
        action,
        rating: feedback?.rating,
        feedback_text: feedback?.text,
        modifications: feedback?.modifications
      })
  },

  /**
   * Get user patterns for context building
   */
  async getUserPatterns(userId: string): Promise<UserPattern[]> {
    if (!supabase) {
      return inMemoryPatterns.get(userId)?.filter(p => p.is_active) || []
    }

    const { data, error } = await supabase
      .from('user_patterns')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('confidence', { ascending: false })

    if (error) {
      console.error('[AISuggestions] Error fetching patterns:', error)
      return []
    }

    return data || []
  },

  /**
   * Get suggestion acceptance rate for learning
   */
  async getSuggestionMetrics(userId: string): Promise<{
    total: number
    accepted: number
    rejected: number
    acceptanceRate: number
  }> {
    if (!supabase) {
      const suggestions = inMemorySuggestions.get(userId) || []
      const accepted = suggestions.filter(s => s.status === 'accepted').length
      const rejected = suggestions.filter(s => s.status === 'rejected').length
      return {
        total: suggestions.length,
        accepted,
        rejected,
        acceptanceRate: suggestions.length > 0 ? accepted / suggestions.length : 0
      }
    }

    const { data } = await supabase
      .from('ai_suggestions')
      .select('status')
      .eq('user_id', userId)

    if (!data) return { total: 0, accepted: 0, rejected: 0, acceptanceRate: 0 }

    const accepted = data.filter(s => s.status === 'accepted').length
    const rejected = data.filter(s => s.status === 'rejected').length

    return {
      total: data.length,
      accepted,
      rejected,
      acceptanceRate: data.length > 0 ? accepted / data.length : 0
    }
  },

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  buildContextPrompt(context: UserContext): string {
    const workflowSummary = context.workflows
      .slice(0, 10)
      .map(w => `- ${w.name} (${w.integrations.join(', ')}) - ${w.execution_count} runs, ${(w.success_rate * 100).toFixed(0)}% success`)
      .join('\n')

    const recentFailures = context.recentExecutions
      .filter(e => e.status === 'failed')
      .slice(0, 5)
      .map(e => `- ${e.workflow_name}: ${e.error_message || 'Unknown error'}`)
      .join('\n')

    const patternInsights = context.patterns
      ?.map(p => `- ${p.pattern_type}: ${JSON.stringify(p.pattern_data)}`)
      .join('\n') || 'No patterns detected yet'

    return `USER PROFILE:
- Industry: ${context.industry || 'Not specified'}
- Subscription: ${context.subscriptionTier}
- Connected Apps: ${context.connectedIntegrations.join(', ') || 'None'}

CURRENT WORKFLOWS:
${workflowSummary || 'No workflows yet'}

RECENT FAILURES:
${recentFailures || 'No recent failures'}

DETECTED PATTERNS:
${patternInsights}

Based on this context, suggest ${context.subscriptionTier === 'free' ? '2' : '3'} high-value automation opportunities.`
  },

  parseSuggestions(
    response: string,
    userId: string,
    model: string,
    costUsd: number
  ): AISuggestion[] {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.error('[AISuggestions] No JSON found in response')
        return []
      }

      const parsed = JSON.parse(jsonMatch[0])
      const suggestions = parsed.suggestions || []

      return suggestions.map((s: any) => ({
        id: randomUUID(),
        user_id: userId,
        suggestion_type: s.type || 'new_workflow',
        title: s.title || 'Untitled Suggestion',
        description: s.description || '',
        workflow_spec: s.workflow_spec,
        related_integrations: s.workflow_spec?.requiredIntegrations,
        confidence: s.confidence || 0.5,
        estimated_time_saved_minutes: s.estimated_time_saved_minutes,
        priority: s.priority || 'medium',
        status: 'pending' as SuggestionStatus,
        model_used: model,
        generation_cost_usd: costUsd / suggestions.length, // Distribute cost
        created_at: new Date().toISOString()
      }))
    } catch (error) {
      console.error('[AISuggestions] Error parsing suggestions:', error)
      return []
    }
  },

  parsePatterns(response: string, userId: string): UserPattern[] {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return []

      const parsed = JSON.parse(jsonMatch[0])
      const patterns = parsed.patterns || []

      return patterns.map((p: any) => ({
        id: randomUUID(),
        user_id: userId,
        pattern_type: p.type,
        pattern_data: { ...p.data, key: p.key, insight: p.insight },
        confidence: p.confidence || 0.5,
        sample_count: 1,
        first_detected_at: new Date().toISOString(),
        last_observed_at: new Date().toISOString(),
        is_active: true
      }))
    } catch (error) {
      console.error('[AISuggestions] Error parsing patterns:', error)
      return []
    }
  },

  async storeSuggestions(suggestions: AISuggestion[]): Promise<void> {
    if (suggestions.length === 0) return

    const userId = suggestions[0].user_id

    if (!supabase) {
      const existing = inMemorySuggestions.get(userId) || []
      inMemorySuggestions.set(userId, [...suggestions, ...existing])
      console.log(`[AISuggestions] Stored ${suggestions.length} suggestions (in-memory)`)
      return
    }

    const { error } = await supabase
      .from('ai_suggestions')
      .insert(suggestions.map(s => ({
        id: s.id,
        user_id: s.user_id,
        suggestion_type: s.suggestion_type,
        title: s.title,
        description: s.description,
        workflow_spec: s.workflow_spec,
        related_integrations: s.related_integrations,
        confidence: s.confidence,
        estimated_time_saved_minutes: s.estimated_time_saved_minutes,
        priority: s.priority,
        status: s.status,
        model_used: s.model_used,
        generation_cost_usd: s.generation_cost_usd
      })))

    if (error) {
      console.error('[AISuggestions] Error storing suggestions:', error)
    } else {
      console.log(`[AISuggestions] Stored ${suggestions.length} suggestions`)
    }
  },

  async storePatterns(patterns: UserPattern[]): Promise<void> {
    if (patterns.length === 0) return

    const userId = patterns[0].user_id

    if (!supabase) {
      const existing = inMemoryPatterns.get(userId) || []
      // Merge with existing patterns
      const merged = [...patterns]
      for (const ep of existing) {
        if (!patterns.find(p => p.pattern_type === ep.pattern_type &&
            JSON.stringify(p.pattern_data) === JSON.stringify(ep.pattern_data))) {
          merged.push(ep)
        }
      }
      inMemoryPatterns.set(userId, merged)
      console.log(`[AISuggestions] Stored ${patterns.length} patterns (in-memory)`)
      return
    }

    // Upsert patterns (update if exists, insert if not)
    for (const pattern of patterns) {
      const { error } = await supabase
        .from('user_patterns')
        .upsert({
          id: pattern.id,
          user_id: pattern.user_id,
          pattern_type: pattern.pattern_type,
          pattern_data: pattern.pattern_data,
          confidence: pattern.confidence,
          sample_count: pattern.sample_count,
          last_observed_at: pattern.last_observed_at,
          is_active: pattern.is_active
        }, {
          onConflict: 'user_id,pattern_type,(pattern_data->>\'key\')'
        })

      if (error) {
        console.error('[AISuggestions] Error storing pattern:', error)
      }
    }
  },

  // =============================================================================
  // ADDITIONAL API METHODS
  // =============================================================================

  /**
   * Get suggestions with filtering options
   */
  async getSuggestions(
    userId: string,
    status?: string,
    limit: number = 10
  ): Promise<AISuggestion[]> {
    if (!supabase) {
      let suggestions = inMemorySuggestions.get(userId) || []
      if (status) {
        suggestions = suggestions.filter(s => s.status === status)
      }
      return suggestions.slice(0, limit)
    }

    let query = supabase
      .from('ai_suggestions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    } else {
      // Default to pending and shown
      query = query.in('status', ['pending', 'shown'])
    }

    const { data, error } = await query

    if (error) {
      console.error('[AISuggestions] Error fetching suggestions:', error)
      return []
    }

    return data || []
  },

  /**
   * Get a single suggestion by ID
   */
  async getSuggestionById(
    suggestionId: string,
    userId: string
  ): Promise<AISuggestion | null> {
    if (!supabase) {
      const suggestions = inMemorySuggestions.get(userId) || []
      return suggestions.find(s => s.id === suggestionId) || null
    }

    const { data, error } = await supabase
      .from('ai_suggestions')
      .select('*')
      .eq('id', suggestionId)
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('[AISuggestions] Error fetching suggestion:', error)
      return null
    }

    return data
  },

  /**
   * Update suggestion status
   */
  async updateSuggestionStatus(
    suggestionId: string,
    status: string
  ): Promise<void> {
    if (!supabase) {
      for (const [, suggestions] of inMemorySuggestions) {
        const suggestion = suggestions.find(s => s.id === suggestionId)
        if (suggestion) {
          suggestion.status = status as SuggestionStatus
          if (status === 'shown') {
            (suggestion as any).shown_at = new Date().toISOString()
          } else if (['accepted', 'rejected'].includes(status)) {
            (suggestion as any).acted_at = new Date().toISOString()
          }
          break
        }
      }
      return
    }

    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'shown') {
      updates.shown_at = new Date().toISOString()
    } else if (['accepted', 'rejected'].includes(status)) {
      updates.acted_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('ai_suggestions')
      .update(updates)
      .eq('id', suggestionId)

    if (error) {
      console.error('[AISuggestions] Error updating suggestion status:', error)
    }
  },

  /**
   * Get suggestion statistics for a user
   */
  async getSuggestionStats(userId: string): Promise<{
    total: number
    pending: number
    shown: number
    accepted: number
    rejected: number
    acceptanceRate: number
    avgConfidence: number
    totalTimeSavedMinutes: number
    topTypes: { type: string; count: number }[]
  }> {
    if (!supabase) {
      const suggestions = inMemorySuggestions.get(userId) || []
      const accepted = suggestions.filter(s => s.status === 'accepted')
      const rejected = suggestions.filter(s => s.status === 'rejected')
      const timeSaved = accepted.reduce((acc, s) => acc + (s.estimated_time_saved_minutes || 0), 0)
      const avgConf = suggestions.length > 0
        ? suggestions.reduce((acc, s) => acc + s.confidence, 0) / suggestions.length
        : 0

      // Count by type
      const typeCounts: Record<string, number> = {}
      for (const s of suggestions) {
        typeCounts[s.suggestion_type] = (typeCounts[s.suggestion_type] || 0) + 1
      }
      const topTypes = Object.entries(typeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      return {
        total: suggestions.length,
        pending: suggestions.filter(s => s.status === 'pending').length,
        shown: suggestions.filter(s => s.status === 'shown').length,
        accepted: accepted.length,
        rejected: rejected.length,
        acceptanceRate: (accepted.length + rejected.length) > 0
          ? accepted.length / (accepted.length + rejected.length)
          : 0,
        avgConfidence: avgConf,
        totalTimeSavedMinutes: timeSaved,
        topTypes
      }
    }

    const { data, error } = await supabase
      .from('ai_suggestions')
      .select('status, confidence, estimated_time_saved_minutes, suggestion_type')
      .eq('user_id', userId)

    if (error || !data) {
      return {
        total: 0,
        pending: 0,
        shown: 0,
        accepted: 0,
        rejected: 0,
        acceptanceRate: 0,
        avgConfidence: 0,
        totalTimeSavedMinutes: 0,
        topTypes: []
      }
    }

    const pending = data.filter(s => s.status === 'pending').length
    const shown = data.filter(s => s.status === 'shown').length
    const accepted = data.filter(s => s.status === 'accepted').length
    const rejected = data.filter(s => s.status === 'rejected').length
    const timeSaved = data
      .filter(s => s.status === 'accepted')
      .reduce((acc, s) => acc + (s.estimated_time_saved_minutes || 0), 0)
    const avgConf = data.length > 0
      ? data.reduce((acc, s) => acc + (s.confidence || 0), 0) / data.length
      : 0

    // Count by type
    const typeCounts: Record<string, number> = {}
    for (const s of data) {
      typeCounts[s.suggestion_type] = (typeCounts[s.suggestion_type] || 0) + 1
    }
    const topTypes = Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      total: data.length,
      pending,
      shown,
      accepted,
      rejected,
      acceptanceRate: (accepted + rejected) > 0 ? accepted / (accepted + rejected) : 0,
      avgConfidence: avgConf,
      totalTimeSavedMinutes: timeSaved,
      topTypes
    }
  },

  /**
   * Build user context for suggestion generation
   */
  async buildUserContext(userId: string): Promise<UserContext> {
    // Get workflows
    let workflows: WorkflowSummary[] = []
    let executions: ExecutionSummary[] = []
    let connectedIntegrations: string[] = []
    let industry: string | undefined
    let subscriptionTier: 'free' | 'pro' | 'enterprise' = 'free'

    if (supabase) {
      // Fetch user profile
      const { data: user } = await supabase
        .from('users')
        .select('industry, subscription_tier')
        .eq('clerk_user_id', userId)
        .single()

      if (user) {
        industry = user.industry
        subscriptionTier = user.subscription_tier || 'free'
      }

      // Fetch workflows
      const { data: wfData } = await supabase
        .from('workflows')
        .select('id, name, description, status, config')
        .eq('created_by', userId)
        .order('updated_at', { ascending: false })
        .limit(20)

      if (wfData) {
        workflows = wfData.map(w => ({
          id: w.id,
          name: w.name,
          description: w.description,
          status: w.status,
          integrations: w.config?.requiredIntegrations || [],
          execution_count: 0,
          success_rate: 0
        }))
      }

      // Fetch recent executions
      const { data: execData } = await supabase
        .from('workflow_executions')
        .select('workflow_id, status, created_at, execution_data')
        .order('created_at', { ascending: false })
        .limit(100)

      if (execData) {
        executions = execData.map(e => ({
          workflow_id: e.workflow_id,
          workflow_name: workflows.find(w => w.id === e.workflow_id)?.name || 'Unknown',
          status: e.status === 'completed' ? 'success' : e.status === 'failed' ? 'failed' : 'partial',
          executed_at: e.created_at,
          error_message: e.execution_data?.error
        }))

        // Calculate execution counts and success rates per workflow
        for (const wf of workflows) {
          const wfExecs = executions.filter(e => e.workflow_id === wf.id)
          wf.execution_count = wfExecs.length
          wf.success_rate = wfExecs.length > 0
            ? wfExecs.filter(e => e.status === 'success').length / wfExecs.length
            : 0
        }
      }

      // Fetch connected integrations
      const { data: connData } = await supabase
        .from('user_integrations')
        .select('integration_name')
        .eq('user_id', userId)
        .eq('status', 'active')

      if (connData) {
        connectedIntegrations = connData.map(c => c.integration_name)
      }
    }

    // Get patterns
    const patterns = await this.getUserPatterns(userId)

    return {
      userId,
      industry,
      subscriptionTier,
      workflows,
      recentExecutions: executions,
      connectedIntegrations,
      patterns
    }
  }
}

export default aiSuggestionsService
