/**
 * User Intelligence Service
 *
 * Builds deep understanding of each user through multi-signal analysis.
 * This is the BRAIN that powers high-quality AI suggestions.
 *
 * QUALITY PHILOSOPHY:
 * - Only surface suggestions we're CONFIDENT about (>0.85 confidence)
 * - Learn from every user action to improve over time
 * - Combine multiple signals before making recommendations
 * - Prefer fewer, better suggestions over many mediocre ones
 *
 * INTELLIGENCE SIGNALS:
 * 1. Workflow Patterns - What they build, how they structure it
 * 2. Execution Behavior - When, how often, what triggers
 * 3. Integration Affinity - Which apps they connect, how they use them
 * 4. Failure Recovery - How they respond to errors
 * 5. Time Patterns - Work hours, peak days, timezone
 * 6. Industry Context - Domain-specific needs
 * 7. Suggestion History - What they've accepted/rejected
 * 8. Chat History - How they describe their needs
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

// =============================================================================
// TYPES
// =============================================================================

export interface UserIntelligence {
  userId: string
  lastUpdated: string

  // Core Profile
  profile: UserProfile

  // Behavioral Signals
  workflowPatterns: WorkflowPatternSignal
  executionBehavior: ExecutionBehaviorSignal
  integrationAffinity: IntegrationAffinitySignal
  temporalPatterns: TemporalPatternSignal

  // Learning Signals
  suggestionHistory: SuggestionHistorySignal
  communicationStyle: CommunicationStyleSignal

  // Derived Insights
  automationMaturity: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  primaryUseCase: string
  painPoints: PainPoint[]
  opportunities: Opportunity[]

  // Confidence in our understanding
  overallConfidence: number
  dataQuality: 'insufficient' | 'partial' | 'good' | 'excellent'
}

interface UserProfile {
  industry?: string
  companySize?: string
  role?: string
  subscriptionTier: 'free' | 'pro' | 'enterprise'
  timezone?: string
  primaryLanguage: string
  accountAge: number // days
  lastActiveAt: string
}

interface WorkflowPatternSignal {
  totalWorkflows: number
  activeWorkflows: number
  avgStepsPerWorkflow: number
  preferredTriggerTypes: Record<string, number>
  commonActionTypes: Record<string, number>
  complexityDistribution: { simple: number; moderate: number; complex: number }
  confidence: number
}

interface ExecutionBehaviorSignal {
  totalExecutions: number
  successRate: number
  manualTriggerRate: number
  avgExecutionsPerDay: number
  peakUsageHour: number
  preferredDays: number[]
  confidence: number
}

interface IntegrationAffinitySignal {
  connectedIntegrations: string[]
  mostUsedIntegrations: { name: string; usageCount: number; lastUsed: string }[]
  integrationCombinations: { combo: string[]; frequency: number }[]
  unusedConnectedIntegrations: string[]
  potentialIntegrations: string[]
  confidence: number
}

interface TemporalPatternSignal {
  peakHours: number[]
  peakDays: number[]
  weekdayVsWeekend: { weekday: number; weekend: number }
  averageSessionDuration: number // minutes
  consistency: number // 0-1, how regular are patterns
  confidence: number
}

interface SuggestionHistorySignal {
  totalSuggestions: number
  acceptedCount: number
  rejectedCount: number
  implementedCount: number
  acceptanceRate: number
  preferredSuggestionTypes: string[]
  rejectedSuggestionTypes: string[]
  avgTimeToAct: number // hours
  confidence: number
}

interface CommunicationStyleSignal {
  avgMessageLength: number
  usesNaturalLanguage: boolean
  prefersTechnicalTerms: boolean
  commonPhrases: string[]
  requestedIntegrations: string[]
  expressedFrustrations: string[]
  confidence: number
}

interface PainPoint {
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  frequency: number // how often encountered
  relatedWorkflows?: string[]
  potentialSolution?: string
  confidence: number
}

interface Opportunity {
  description: string
  estimatedTimeSavings: number // minutes per week
  requiredIntegrations: string[]
  complexity: 'simple' | 'moderate' | 'complex'
  relevanceScore: number // 0-1
  confidence: number
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

// In-memory cache for user intelligence
const intelligenceCache: Map<string, { data: UserIntelligence; timestamp: number }> = new Map()
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

// =============================================================================
// USER INTELLIGENCE SERVICE
// =============================================================================

export const userIntelligenceService = {
  /**
   * Build comprehensive intelligence profile for a user
   * This is the foundation for high-quality suggestions
   */
  async buildIntelligence(userId: string, forceRefresh: boolean = false): Promise<UserIntelligence> {
    console.log(`[UserIntelligence] Building intelligence for user ${userId}`)

    // Check cache first
    if (!forceRefresh) {
      const cached = intelligenceCache.get(userId)
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        console.log(`[UserIntelligence] Returning cached intelligence`)
        return cached.data
      }
    }

    // Gather all signals in parallel
    const [
      profile,
      workflows,
      executions,
      suggestions,
      chatHistory,
      integrations
    ] = await Promise.all([
      this.fetchUserProfile(userId),
      this.fetchUserWorkflows(userId),
      this.fetchRecentExecutions(userId),
      this.fetchSuggestionHistory(userId),
      this.fetchChatHistory(userId),
      this.fetchIntegrations(userId)
    ])

    // Analyze each signal
    const workflowPatterns = this.analyzeWorkflowPatterns(workflows)
    const executionBehavior = this.analyzeExecutionBehavior(executions)
    const integrationAffinity = this.analyzeIntegrationAffinity(integrations, executions, workflows)
    const temporalPatterns = this.analyzeTemporalPatterns(executions)
    const suggestionHistory = this.analyzeSuggestionHistory(suggestions)
    const communicationStyle = this.analyzeCommunicationStyle(chatHistory)

    // Derive higher-level insights
    const automationMaturity = this.calculateAutomationMaturity(
      workflows.length,
      executionBehavior.successRate,
      workflowPatterns.avgStepsPerWorkflow
    )

    const primaryUseCase = this.inferPrimaryUseCase(
      workflows,
      integrationAffinity.mostUsedIntegrations,
      profile.industry
    )

    const painPoints = this.identifyPainPoints(
      executions,
      workflows,
      suggestionHistory,
      communicationStyle
    )

    const opportunities = this.identifyOpportunities(
      workflows,
      integrationAffinity,
      executionBehavior,
      suggestionHistory
    )

    // Calculate overall data quality
    const dataQuality = this.assessDataQuality(
      workflows.length,
      executions.length,
      chatHistory.length
    )

    // Calculate overall confidence in our understanding
    const overallConfidence = this.calculateOverallConfidence([
      workflowPatterns.confidence,
      executionBehavior.confidence,
      integrationAffinity.confidence,
      temporalPatterns.confidence
    ])

    const intelligence: UserIntelligence = {
      userId,
      lastUpdated: new Date().toISOString(),
      profile,
      workflowPatterns,
      executionBehavior,
      integrationAffinity,
      temporalPatterns,
      suggestionHistory,
      communicationStyle,
      automationMaturity,
      primaryUseCase,
      painPoints,
      opportunities,
      overallConfidence,
      dataQuality
    }

    // Cache the result
    intelligenceCache.set(userId, { data: intelligence, timestamp: Date.now() })

    // Store in database for persistence
    await this.storeIntelligence(intelligence)

    console.log(`[UserIntelligence] Built intelligence with ${dataQuality} quality, ${(overallConfidence * 100).toFixed(0)}% confidence`)

    return intelligence
  },

  /**
   * Get high-confidence opportunities for suggestion generation
   * ONLY returns opportunities we're very confident about
   */
  async getHighConfidenceOpportunities(
    userId: string,
    minConfidence: number = 0.85
  ): Promise<Opportunity[]> {
    const intelligence = await this.buildIntelligence(userId)

    // Filter to high-confidence opportunities
    const highConfidence = intelligence.opportunities
      .filter(opp => opp.confidence >= minConfidence && opp.relevanceScore >= 0.8)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)

    console.log(`[UserIntelligence] Found ${highConfidence.length} high-confidence opportunities (>= ${minConfidence})`)

    return highConfidence
  },

  /**
   * Check if we have enough data to make quality suggestions
   */
  async hasEnoughDataForSuggestions(userId: string): Promise<{
    ready: boolean
    reason?: string
    requiredActions?: string[]
  }> {
    const intelligence = await this.buildIntelligence(userId)

    if (intelligence.dataQuality === 'insufficient') {
      return {
        ready: false,
        reason: 'Not enough data to generate personalized suggestions',
        requiredActions: [
          'Create at least 3 workflows',
          'Run your workflows a few times',
          'Connect your most-used apps'
        ]
      }
    }

    if (intelligence.overallConfidence < 0.5) {
      return {
        ready: false,
        reason: 'Still learning your patterns',
        requiredActions: [
          'Keep using Nexus for a few more days',
          'Try different workflow types'
        ]
      }
    }

    return { ready: true }
  },

  /**
   * Learn from user action on a suggestion
   * This improves future suggestion quality
   */
  async learnFromAction(
    userId: string,
    suggestionType: string,
    action: 'accepted' | 'rejected' | 'modified' | 'ignored',
    context?: {
      suggestionTitle?: string
      modifications?: Record<string, unknown>
      reason?: string
    }
  ): Promise<void> {
    console.log(`[UserIntelligence] Learning: ${action} on ${suggestionType}`)

    // This data will be used to refine future suggestions
    // For now, we store it and let the analysis functions use it

    if (!supabase) return

    await supabase
      .from('suggestion_feedback')
      .insert({
        id: randomUUID(),
        user_id: userId,
        suggestion_id: null, // Generic learning event
        action,
        feedback_text: context?.reason,
        modifications: {
          suggestion_type: suggestionType,
          ...context
        }
      })

    // Invalidate cache to incorporate new learning
    intelligenceCache.delete(userId)
  },

  // =============================================================================
  // DATA FETCHING METHODS
  // =============================================================================

  async fetchUserProfile(userId: string): Promise<UserProfile> {
    if (!supabase) {
      return {
        subscriptionTier: 'free',
        primaryLanguage: 'en',
        accountAge: 0,
        lastActiveAt: new Date().toISOString()
      }
    }

    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    const accountCreated = data?.created_at ? new Date(data.created_at) : new Date()
    const accountAge = Math.floor((Date.now() - accountCreated.getTime()) / (24 * 60 * 60 * 1000))

    return {
      industry: data?.industry,
      subscriptionTier: data?.subscription_tier || 'free',
      timezone: data?.timezone,
      primaryLanguage: data?.language || 'en',
      accountAge,
      lastActiveAt: data?.last_active_at || new Date().toISOString()
    }
  },

  async fetchUserWorkflows(userId: string): Promise<any[]> {
    if (!supabase) return []

    const { data } = await supabase
      .from('workflows')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)

    return data || []
  },

  async fetchRecentExecutions(userId: string): Promise<any[]> {
    if (!supabase) return []

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data } = await supabase
      .from('workflow_executions')
      .select(`
        *,
        workflows!inner (
          name,
          config,
          user_id
        )
      `)
      .eq('workflows.user_id', userId)
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(500)

    return data || []
  },

  async fetchSuggestionHistory(userId: string): Promise<any[]> {
    if (!supabase) return []

    const { data } = await supabase
      .from('ai_suggestions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    return data || []
  },

  async fetchChatHistory(userId: string): Promise<any[]> {
    if (!supabase) return []

    const { data } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)

    return data || []
  },

  async fetchIntegrations(userId: string): Promise<any[]> {
    if (!supabase) return []

    const { data } = await supabase
      .from('integration_credentials')
      .select('*')
      .eq('user_id', userId)

    return data || []
  },

  // =============================================================================
  // SIGNAL ANALYSIS METHODS
  // =============================================================================

  analyzeWorkflowPatterns(workflows: any[]): WorkflowPatternSignal {
    if (workflows.length === 0) {
      return {
        totalWorkflows: 0,
        activeWorkflows: 0,
        avgStepsPerWorkflow: 0,
        preferredTriggerTypes: {},
        commonActionTypes: {},
        complexityDistribution: { simple: 0, moderate: 0, complex: 0 },
        confidence: 0
      }
    }

    const triggerTypes: Record<string, number> = {}
    const actionTypes: Record<string, number> = {}
    let totalSteps = 0
    const complexity = { simple: 0, moderate: 0, complex: 0 }

    for (const wf of workflows) {
      const steps = wf.config?.steps || []
      totalSteps += steps.length

      // Count trigger types
      const trigger = steps.find((s: any) => s.type === 'trigger')
      if (trigger) {
        triggerTypes[trigger.tool] = (triggerTypes[trigger.tool] || 0) + 1
      }

      // Count action types
      for (const step of steps.filter((s: any) => s.type === 'action')) {
        actionTypes[step.tool] = (actionTypes[step.tool] || 0) + 1
      }

      // Categorize complexity
      if (steps.length <= 2) complexity.simple++
      else if (steps.length <= 5) complexity.moderate++
      else complexity.complex++
    }

    const activeWorkflows = workflows.filter(wf => wf.status === 'active').length

    return {
      totalWorkflows: workflows.length,
      activeWorkflows,
      avgStepsPerWorkflow: totalSteps / workflows.length,
      preferredTriggerTypes: triggerTypes,
      commonActionTypes: actionTypes,
      complexityDistribution: complexity,
      confidence: Math.min(workflows.length / 10, 0.95)
    }
  },

  analyzeExecutionBehavior(executions: any[]): ExecutionBehaviorSignal {
    if (executions.length === 0) {
      return {
        totalExecutions: 0,
        successRate: 0,
        manualTriggerRate: 0,
        avgExecutionsPerDay: 0,
        peakUsageHour: 9,
        preferredDays: [],
        confidence: 0
      }
    }

    const successful = executions.filter(e => e.status === 'success').length
    const manual = executions.filter(e => e.execution_data?.trigger_type === 'manual').length

    // Find peak hour
    const hourCounts: Record<number, number> = {}
    for (const exec of executions) {
      const hour = new Date(exec.created_at).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    }
    const peakHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || '9'

    // Find preferred days
    const dayCounts: Record<number, number> = {}
    for (const exec of executions) {
      const day = new Date(exec.created_at).getDay()
      dayCounts[day] = (dayCounts[day] || 0) + 1
    }
    const avgDayCount = executions.length / 7
    const preferredDays = Object.entries(dayCounts)
      .filter(([, count]) => count > avgDayCount)
      .map(([day]) => parseInt(day))

    // Calculate average executions per day
    const firstExec = new Date(executions[executions.length - 1].created_at)
    const lastExec = new Date(executions[0].created_at)
    const daySpan = Math.max(1, Math.ceil((lastExec.getTime() - firstExec.getTime()) / (24 * 60 * 60 * 1000)))

    return {
      totalExecutions: executions.length,
      successRate: successful / executions.length,
      manualTriggerRate: manual / executions.length,
      avgExecutionsPerDay: executions.length / daySpan,
      peakUsageHour: parseInt(peakHour),
      preferredDays,
      confidence: Math.min(executions.length / 50, 0.95)
    }
  },

  analyzeIntegrationAffinity(integrations: any[], executions: any[], workflows: any[]): IntegrationAffinitySignal {
    const connected = integrations.map(i => i.toolkit || i.integration_name)

    // Count usage per integration
    const usageCounts: Record<string, { count: number; lastUsed: string }> = {}
    for (const exec of executions) {
      const tools = exec.workflows?.config?.steps?.map((s: any) => s.tool) || []
      for (const tool of tools) {
        if (!usageCounts[tool]) {
          usageCounts[tool] = { count: 0, lastUsed: exec.created_at }
        }
        usageCounts[tool].count++
        if (new Date(exec.created_at) > new Date(usageCounts[tool].lastUsed)) {
          usageCounts[tool].lastUsed = exec.created_at
        }
      }
    }

    const mostUsed = Object.entries(usageCounts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 5)
      .map(([name, data]) => ({ name, usageCount: data.count, lastUsed: data.lastUsed }))

    // Find unused connected integrations
    const unused = connected.filter(int => !usageCounts[int])

    // Identify integration combinations
    const combos: Record<string, number> = {}
    for (const wf of workflows) {
      const tools = (wf.config?.steps || []).map((s: any) => s.tool).sort()
      if (tools.length >= 2) {
        const key = tools.join('+')
        combos[key] = (combos[key] || 0) + 1
      }
    }

    const topCombos = Object.entries(combos)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([combo, freq]) => ({ combo: combo.split('+'), frequency: freq }))

    // Identify potential integrations based on patterns
    const potentialIntegrations = this.inferPotentialIntegrations(mostUsed.map(m => m.name), connected)

    return {
      connectedIntegrations: connected,
      mostUsedIntegrations: mostUsed,
      integrationCombinations: topCombos,
      unusedConnectedIntegrations: unused,
      potentialIntegrations,
      confidence: Math.min(connected.length / 5, 0.9)
    }
  },

  analyzeTemporalPatterns(executions: any[]): TemporalPatternSignal {
    if (executions.length === 0) {
      return {
        peakHours: [9, 10, 11],
        peakDays: [1, 2, 3, 4, 5],
        weekdayVsWeekend: { weekday: 0, weekend: 0 },
        averageSessionDuration: 0,
        consistency: 0,
        confidence: 0
      }
    }

    const hourCounts: Record<number, number> = {}
    const dayCounts: Record<number, number> = {}
    let weekdayCount = 0
    let weekendCount = 0

    for (const exec of executions) {
      const date = new Date(exec.created_at)
      const hour = date.getHours()
      const day = date.getDay()

      hourCounts[hour] = (hourCounts[hour] || 0) + 1
      dayCounts[day] = (dayCounts[day] || 0) + 1

      if (day === 0 || day === 6) weekendCount++
      else weekdayCount++
    }

    const avgHourCount = executions.length / 24
    const peakHours = Object.entries(hourCounts)
      .filter(([, count]) => count > avgHourCount * 1.5)
      .map(([hour]) => parseInt(hour))

    const avgDayCount = executions.length / 7
    const peakDays = Object.entries(dayCounts)
      .filter(([, count]) => count > avgDayCount * 1.2)
      .map(([day]) => parseInt(day))

    // Calculate consistency (standard deviation of daily executions)
    const dailyExecs: Record<string, number> = {}
    for (const exec of executions) {
      const dateKey = exec.created_at.split('T')[0]
      dailyExecs[dateKey] = (dailyExecs[dateKey] || 0) + 1
    }
    const dailyValues = Object.values(dailyExecs)
    const mean = dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length
    const variance = dailyValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / dailyValues.length
    const stdDev = Math.sqrt(variance)
    const consistency = 1 - Math.min(stdDev / mean, 1)

    return {
      peakHours,
      peakDays,
      weekdayVsWeekend: { weekday: weekdayCount, weekend: weekendCount },
      averageSessionDuration: 0, // Would need session tracking
      consistency,
      confidence: Math.min(executions.length / 100, 0.9)
    }
  },

  analyzeSuggestionHistory(suggestions: any[]): SuggestionHistorySignal {
    if (suggestions.length === 0) {
      return {
        totalSuggestions: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        implementedCount: 0,
        acceptanceRate: 0,
        preferredSuggestionTypes: [],
        rejectedSuggestionTypes: [],
        avgTimeToAct: 0,
        confidence: 0
      }
    }

    const accepted = suggestions.filter(s => s.status === 'accepted')
    const rejected = suggestions.filter(s => s.status === 'rejected')

    // Find preferred types
    const acceptedTypes: Record<string, number> = {}
    for (const s of accepted) {
      acceptedTypes[s.suggestion_type] = (acceptedTypes[s.suggestion_type] || 0) + 1
    }
    const preferredTypes = Object.entries(acceptedTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type)

    // Find rejected types
    const rejectedTypes: Record<string, number> = {}
    for (const s of rejected) {
      rejectedTypes[s.suggestion_type] = (rejectedTypes[s.suggestion_type] || 0) + 1
    }
    const dislikedTypes = Object.entries(rejectedTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type)

    // Calculate average time to act
    let totalTimeToAct = 0
    let actedCount = 0
    for (const s of suggestions) {
      if (s.shown_at && s.acted_at) {
        const diff = new Date(s.acted_at).getTime() - new Date(s.shown_at).getTime()
        totalTimeToAct += diff / (60 * 60 * 1000) // Convert to hours
        actedCount++
      }
    }

    return {
      totalSuggestions: suggestions.length,
      acceptedCount: accepted.length,
      rejectedCount: rejected.length,
      implementedCount: accepted.filter(s => s.status === 'implemented').length,
      acceptanceRate: accepted.length / suggestions.length,
      preferredSuggestionTypes: preferredTypes,
      rejectedSuggestionTypes: dislikedTypes,
      avgTimeToAct: actedCount > 0 ? totalTimeToAct / actedCount : 0,
      confidence: Math.min(suggestions.length / 20, 0.9)
    }
  },

  analyzeCommunicationStyle(chatHistory: any[]): CommunicationStyleSignal {
    if (chatHistory.length === 0) {
      return {
        avgMessageLength: 0,
        usesNaturalLanguage: true,
        prefersTechnicalTerms: false,
        commonPhrases: [],
        requestedIntegrations: [],
        expressedFrustrations: [],
        confidence: 0
      }
    }

    const userMessages = chatHistory.filter(m => m.role === 'user')
    const totalLength = userMessages.reduce((sum, m) => sum + (m.content?.length || 0), 0)
    const avgLength = totalLength / userMessages.length

    // Detect technical terms
    const technicalTerms = ['API', 'webhook', 'endpoint', 'JSON', 'OAuth', 'SDK']
    const technicalCount = userMessages.reduce((count, m) => {
      return count + technicalTerms.filter(term =>
        m.content?.toLowerCase().includes(term.toLowerCase())
      ).length
    }, 0)

    // Extract integration requests
    const integrationKeywords = ['connect', 'integrate', 'sync with', 'use', 'add']
    const requestedIntegrations: string[] = []
    // Would need more sophisticated NLP here

    // Detect frustrations
    const frustrationKeywords = ['doesn\'t work', 'broken', 'error', 'failed', 'can\'t', 'help']
    const frustrations = userMessages
      .filter(m => frustrationKeywords.some(k => m.content?.toLowerCase().includes(k)))
      .map(m => m.content)
      .slice(0, 3)

    return {
      avgMessageLength: avgLength,
      usesNaturalLanguage: avgLength > 20,
      prefersTechnicalTerms: technicalCount > userMessages.length * 0.3,
      commonPhrases: [], // Would need NLP
      requestedIntegrations,
      expressedFrustrations: frustrations,
      confidence: Math.min(chatHistory.length / 20, 0.8)
    }
  },

  // =============================================================================
  // INSIGHT DERIVATION METHODS
  // =============================================================================

  calculateAutomationMaturity(
    workflowCount: number,
    successRate: number,
    avgSteps: number
  ): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    const score =
      (Math.min(workflowCount / 20, 1) * 30) +
      (successRate * 40) +
      (Math.min(avgSteps / 5, 1) * 30)

    if (score >= 80) return 'expert'
    if (score >= 60) return 'advanced'
    if (score >= 30) return 'intermediate'
    return 'beginner'
  },

  inferPrimaryUseCase(
    workflows: any[],
    mostUsedIntegrations: { name: string }[],
    industry?: string
  ): string {
    const topIntegrations = mostUsedIntegrations.slice(0, 3).map(i => i.name)

    // Infer from integrations
    if (topIntegrations.some(i => ['gmail', 'outlook', 'sendgrid'].includes(i))) {
      return 'Email Automation'
    }
    if (topIntegrations.some(i => ['slack', 'discord', 'teams'].includes(i))) {
      return 'Team Communication'
    }
    if (topIntegrations.some(i => ['hubspot', 'salesforce', 'pipedrive'].includes(i))) {
      return 'CRM & Sales'
    }
    if (topIntegrations.some(i => ['googlesheets', 'airtable', 'notion'].includes(i))) {
      return 'Data Management'
    }
    if (topIntegrations.some(i => ['github', 'gitlab', 'jira'].includes(i))) {
      return 'Development Workflow'
    }

    return industry || 'General Automation'
  },

  identifyPainPoints(
    executions: any[],
    workflows: any[],
    suggestionHistory: SuggestionHistorySignal,
    communicationStyle: CommunicationStyleSignal
  ): PainPoint[] {
    const painPoints: PainPoint[] = []

    // High failure rate workflows
    const failureRates: Record<string, { failed: number; total: number; name: string }> = {}
    for (const exec of executions) {
      const wfId = exec.workflow_id
      if (!failureRates[wfId]) {
        failureRates[wfId] = { failed: 0, total: 0, name: exec.workflows?.name || 'Unknown' }
      }
      failureRates[wfId].total++
      if (exec.status === 'failed') failureRates[wfId].failed++
    }

    for (const [wfId, data] of Object.entries(failureRates)) {
      const rate = data.failed / data.total
      if (rate > 0.2 && data.total >= 5) {
        painPoints.push({
          description: `"${data.name}" fails ${(rate * 100).toFixed(0)}% of the time`,
          severity: rate > 0.5 ? 'high' : 'medium',
          frequency: data.failed,
          relatedWorkflows: [wfId],
          potentialSolution: 'Review workflow configuration and error handling',
          confidence: Math.min(data.total / 20, 0.9)
        })
      }
    }

    // Low suggestion acceptance = we're not understanding them
    if (suggestionHistory.acceptanceRate < 0.3 && suggestionHistory.totalSuggestions > 5) {
      painPoints.push({
        description: 'AI suggestions not matching your needs',
        severity: 'medium',
        frequency: suggestionHistory.rejectedCount,
        potentialSolution: 'Help us understand you better by providing feedback',
        confidence: 0.7
      })
    }

    // Expressed frustrations in chat
    for (const frustration of communicationStyle.expressedFrustrations) {
      painPoints.push({
        description: frustration.slice(0, 100),
        severity: 'medium',
        frequency: 1,
        confidence: 0.6
      })
    }

    return painPoints.slice(0, 5)
  },

  identifyOpportunities(
    workflows: any[],
    integrationAffinity: IntegrationAffinitySignal,
    executionBehavior: ExecutionBehaviorSignal,
    suggestionHistory: SuggestionHistorySignal
  ): Opportunity[] {
    const opportunities: Opportunity[] = []

    // Manual triggers that could be scheduled
    if (executionBehavior.manualTriggerRate > 0.5 && executionBehavior.totalExecutions > 10) {
      opportunities.push({
        description: 'Schedule your frequently manual-triggered workflows',
        estimatedTimeSavings: Math.round(executionBehavior.totalExecutions * 0.5 * 2), // 2 min per manual trigger
        requiredIntegrations: [],
        complexity: 'simple',
        relevanceScore: Math.min(executionBehavior.manualTriggerRate, 0.95),
        confidence: 0.9
      })
    }

    // Unused connected integrations
    for (const unused of integrationAffinity.unusedConnectedIntegrations.slice(0, 2)) {
      opportunities.push({
        description: `Put your ${unused} connection to work`,
        estimatedTimeSavings: 30, // Estimated
        requiredIntegrations: [unused],
        complexity: 'moderate',
        relevanceScore: 0.75,
        confidence: 0.7
      })
    }

    // Integration combinations they might benefit from
    for (const potential of integrationAffinity.potentialIntegrations.slice(0, 2)) {
      const relevance = this.calculateIntegrationRelevance(
        potential,
        integrationAffinity.mostUsedIntegrations.map(m => m.name)
      )
      if (relevance > 0.7) {
        opportunities.push({
          description: `Connect ${potential} to enhance your workflows`,
          estimatedTimeSavings: 60,
          requiredIntegrations: [potential],
          complexity: 'moderate',
          relevanceScore: relevance,
          confidence: 0.75
        })
      }
    }

    // Based on accepted suggestion types
    for (const preferredType of suggestionHistory.preferredSuggestionTypes) {
      opportunities.push({
        description: `More ${preferredType.replace('_', ' ')} opportunities`,
        estimatedTimeSavings: 45,
        requiredIntegrations: [],
        complexity: 'moderate',
        relevanceScore: 0.85,
        confidence: 0.8
      })
    }

    return opportunities
      .filter(o => o.confidence >= 0.7)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5)
  },

  inferPotentialIntegrations(usedIntegrations: string[], connectedIntegrations: string[]): string[] {
    // Integration affinity map (which integrations are commonly used together)
    const affinityMap: Record<string, string[]> = {
      gmail: ['googlesheets', 'slack', 'hubspot', 'notion'],
      slack: ['gmail', 'github', 'jira', 'notion'],
      googlesheets: ['gmail', 'hubspot', 'slack', 'airtable'],
      github: ['slack', 'jira', 'discord', 'notion'],
      hubspot: ['gmail', 'slack', 'googlesheets', 'salesforce'],
      notion: ['slack', 'gmail', 'github', 'todoist']
    }

    const potential = new Set<string>()

    for (const used of usedIntegrations) {
      const related = affinityMap[used] || []
      for (const r of related) {
        if (!connectedIntegrations.includes(r)) {
          potential.add(r)
        }
      }
    }

    return Array.from(potential).slice(0, 3)
  },

  calculateIntegrationRelevance(integration: string, usedIntegrations: string[]): number {
    const affinityScores: Record<string, Record<string, number>> = {
      gmail: { googlesheets: 0.9, slack: 0.85, hubspot: 0.8, notion: 0.7 },
      slack: { gmail: 0.85, github: 0.9, jira: 0.85, notion: 0.8 },
      googlesheets: { gmail: 0.9, hubspot: 0.85, slack: 0.75 },
      github: { slack: 0.9, jira: 0.85, discord: 0.7 }
    }

    let maxScore = 0
    for (const used of usedIntegrations) {
      const score = affinityScores[used]?.[integration] || 0
      if (score > maxScore) maxScore = score
    }

    return maxScore
  },

  assessDataQuality(
    workflowCount: number,
    executionCount: number,
    chatCount: number
  ): 'insufficient' | 'partial' | 'good' | 'excellent' {
    const score =
      (Math.min(workflowCount / 5, 1) * 30) +
      (Math.min(executionCount / 30, 1) * 50) +
      (Math.min(chatCount / 10, 1) * 20)

    if (score >= 80) return 'excellent'
    if (score >= 50) return 'good'
    if (score >= 20) return 'partial'
    return 'insufficient'
  },

  calculateOverallConfidence(confidences: number[]): number {
    if (confidences.length === 0) return 0
    const validConfidences = confidences.filter(c => c > 0)
    if (validConfidences.length === 0) return 0
    return validConfidences.reduce((a, b) => a + b, 0) / validConfidences.length
  },

  async storeIntelligence(intelligence: UserIntelligence): Promise<void> {
    if (!supabase) return

    // Store in user_analytics or a dedicated table
    // For now, we just log it
    console.log(`[UserIntelligence] Intelligence stored for user ${intelligence.userId}`)
  }
}

export default userIntelligenceService
