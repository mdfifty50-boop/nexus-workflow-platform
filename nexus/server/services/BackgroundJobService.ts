/**
 * Background Job Service
 *
 * Orchestrates scheduled jobs for the AI Suggestions system.
 * Uses a quality-first approach - only generates suggestions when we're confident.
 *
 * JOB SCHEDULE:
 * - Hourly: Pattern detection (rule-based, no LLM) - FREE
 * - Daily: Suggestion generation (Sonnet) - ~$0.10/user
 * - Weekly: Strategic analysis (Opus) - ~$0.50/user
 * - Continuous: Data archival, analytics rollup
 *
 * QUALITY GATES:
 * - Only generate suggestions for users with enough data
 * - Only surface suggestions above 0.85 confidence
 * - Track acceptance rates to improve quality
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import { userIntelligenceService } from './UserIntelligenceService.js'
import { aiSuggestionsService, UserContext } from './AISuggestionsService.js'
import { patternDetectionService } from './PatternDetectionService.js'
import { tieredCalls } from './claudeProxy.js'

// =============================================================================
// TYPES
// =============================================================================

export type JobType =
  | 'pattern_detection'     // Hourly pattern scan
  | 'daily_suggestions'     // Daily AI suggestion generation
  | 'weekly_analysis'       // Weekly deep analysis
  | 'analytics_rollup'      // Aggregate analytics
  | 'data_archival'         // Archive old data
  | 'suggestion_expiry'     // Mark old suggestions as expired

export interface BackgroundJob {
  id: string
  job_type: JobType
  user_id?: string // NULL = system-wide
  scheduled_for: string
  started_at?: string
  completed_at?: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  result?: Record<string, unknown>
  error_message?: string
  retry_count: number
  max_retries: number
}

export interface JobMetrics {
  jobType: JobType
  totalRuns: number
  successfulRuns: number
  failedRuns: number
  avgDurationMs: number
  avgCostUsd: number
  lastRunAt: string
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

// =============================================================================
// JOB INTERVALS
// =============================================================================

const JOB_INTERVALS = {
  pattern_detection: 60 * 60 * 1000,      // 1 hour
  daily_suggestions: 24 * 60 * 60 * 1000,  // 24 hours
  weekly_analysis: 7 * 24 * 60 * 60 * 1000, // 7 days
  analytics_rollup: 60 * 60 * 1000,         // 1 hour
  data_archival: 24 * 60 * 60 * 1000,       // 24 hours
  suggestion_expiry: 6 * 60 * 60 * 1000     // 6 hours
}

// Minimum confidence to generate suggestions
const MIN_SUGGESTION_CONFIDENCE = 0.85

// =============================================================================
// BACKGROUND JOB SERVICE
// =============================================================================

export const backgroundJobService = {
  // Running job intervals
  intervals: new Map<JobType, NodeJS.Timeout>(),
  isRunning: false,

  /**
   * Start all background jobs
   */
  start(): void {
    if (this.isRunning) {
      console.log('[BackgroundJobs] Already running')
      return
    }

    console.log('[BackgroundJobs] Starting job scheduler')
    this.isRunning = true

    // Schedule all job types
    this.scheduleJob('pattern_detection')
    this.scheduleJob('daily_suggestions')
    this.scheduleJob('weekly_analysis')
    this.scheduleJob('analytics_rollup')
    this.scheduleJob('data_archival')
    this.scheduleJob('suggestion_expiry')

    console.log('[BackgroundJobs] All jobs scheduled')
  },

  /**
   * Stop all background jobs
   */
  stop(): void {
    console.log('[BackgroundJobs] Stopping job scheduler')

    for (const [jobType, interval] of this.intervals) {
      clearInterval(interval)
      console.log(`[BackgroundJobs] Stopped ${jobType}`)
    }

    this.intervals.clear()
    this.isRunning = false
  },

  /**
   * Schedule a specific job type
   */
  scheduleJob(jobType: JobType): void {
    const interval = JOB_INTERVALS[jobType]

    // Run immediately, then on interval
    this.runJob(jobType).catch(err =>
      console.error(`[BackgroundJobs] Initial run of ${jobType} failed:`, err)
    )

    const timer = setInterval(() => {
      this.runJob(jobType).catch(err =>
        console.error(`[BackgroundJobs] Scheduled run of ${jobType} failed:`, err)
      )
    }, interval)

    this.intervals.set(jobType, timer)
    console.log(`[BackgroundJobs] Scheduled ${jobType} every ${interval / 60000} minutes`)
  },

  /**
   * Run a specific job
   */
  async runJob(jobType: JobType, userId?: string): Promise<void> {
    const startTime = Date.now()
    const jobId = randomUUID()

    console.log(`[BackgroundJobs] Starting ${jobType} job ${jobId}`)

    // Record job start
    await this.recordJobStart(jobId, jobType, userId)

    try {
      let result: Record<string, unknown>

      switch (jobType) {
        case 'pattern_detection':
          result = await this.runPatternDetection(userId)
          break
        case 'daily_suggestions':
          result = await this.runDailySuggestions(userId)
          break
        case 'weekly_analysis':
          result = await this.runWeeklyAnalysis(userId)
          break
        case 'analytics_rollup':
          result = await this.runAnalyticsRollup(userId)
          break
        case 'data_archival':
          result = await this.runDataArchival()
          break
        case 'suggestion_expiry':
          result = await this.runSuggestionExpiry()
          break
        default:
          throw new Error(`Unknown job type: ${jobType}`)
      }

      const duration = Date.now() - startTime
      await this.recordJobComplete(jobId, result, duration)

      console.log(`[BackgroundJobs] Completed ${jobType} in ${duration}ms`)
    } catch (error: any) {
      const duration = Date.now() - startTime
      await this.recordJobFailed(jobId, error.message, duration)

      console.error(`[BackgroundJobs] ${jobType} failed:`, error.message)
    }
  },

  // =============================================================================
  // JOB IMPLEMENTATIONS
  // =============================================================================

  /**
   * Pattern Detection Job (Hourly, FREE)
   * Rule-based pattern detection without LLM calls
   */
  async runPatternDetection(userId?: string): Promise<Record<string, unknown>> {
    console.log('[BackgroundJobs] Running pattern detection')

    if (userId) {
      const result = await patternDetectionService.detectAllPatterns(userId)
      return {
        usersProcessed: 1,
        patternsFound: result.patterns.length,
        executionsAnalyzed: result.executionsAnalyzed
      }
    }

    // Run for all active users
    const result = await patternDetectionService.runForAllUsers()
    return result
  },

  /**
   * Daily Suggestions Job (24h, Sonnet tier)
   * Generates personalized suggestions for users with enough data
   */
  async runDailySuggestions(userId?: string): Promise<Record<string, unknown>> {
    console.log('[BackgroundJobs] Running daily suggestions generation')

    const users = userId
      ? [{ id: userId }]
      : await this.getActiveUsers()

    let suggestionsGenerated = 0
    let usersProcessed = 0
    let usersSkipped = 0
    let totalCost = 0

    for (const user of users) {
      try {
        // Check if user has enough data for quality suggestions
        const readiness = await userIntelligenceService.hasEnoughDataForSuggestions(user.id)

        if (!readiness.ready) {
          console.log(`[BackgroundJobs] Skipping user ${user.id}: ${readiness.reason}`)
          usersSkipped++
          continue
        }

        // Build intelligence profile
        const intelligence = await userIntelligenceService.buildIntelligence(user.id)

        // Only generate if we have good data quality
        if (intelligence.dataQuality === 'insufficient' || intelligence.overallConfidence < 0.6) {
          console.log(`[BackgroundJobs] Skipping user ${user.id}: Low data quality`)
          usersSkipped++
          continue
        }

        // Get high-confidence opportunities
        const opportunities = await userIntelligenceService.getHighConfidenceOpportunities(
          user.id,
          MIN_SUGGESTION_CONFIDENCE
        )

        if (opportunities.length === 0) {
          console.log(`[BackgroundJobs] No high-confidence opportunities for user ${user.id}`)
          usersSkipped++
          continue
        }

        // Build context for suggestion generation
        const context: UserContext = {
          userId: user.id,
          industry: intelligence.profile.industry,
          subscriptionTier: intelligence.profile.subscriptionTier,
          workflows: [], // Will be fetched by aiSuggestionsService
          recentExecutions: [],
          connectedIntegrations: intelligence.integrationAffinity.connectedIntegrations,
          patterns: await aiSuggestionsService.getUserPatterns(user.id)
        }

        // Generate quality suggestions
        const suggestions = await this.generateQualitySuggestions(context, intelligence, opportunities)

        suggestionsGenerated += suggestions.length
        usersProcessed++

        // Track cost (estimated)
        totalCost += 0.05 // ~$0.05 per user for Sonnet calls

      } catch (error: any) {
        console.error(`[BackgroundJobs] Error processing user ${user.id}:`, error.message)
      }
    }

    console.log(`[BackgroundJobs] Daily suggestions: ${suggestionsGenerated} generated for ${usersProcessed} users`)

    return {
      usersProcessed,
      usersSkipped,
      suggestionsGenerated,
      estimatedCostUsd: totalCost.toFixed(4)
    }
  },

  /**
   * Generate quality suggestions using intelligence and opportunities
   */
  async generateQualitySuggestions(
    context: UserContext,
    intelligence: any,
    opportunities: any[]
  ): Promise<any[]> {
    // Only generate suggestions for top opportunities
    const topOpportunities = opportunities
      .filter(o => o.confidence >= MIN_SUGGESTION_CONFIDENCE)
      .slice(0, 3) // Max 3 high-quality suggestions

    if (topOpportunities.length === 0) {
      return []
    }

    // Build a focused prompt based on specific opportunities
    const opportunityDescriptions = topOpportunities
      .map((o, i) => `${i + 1}. ${o.description} (saves ~${o.estimatedTimeSavings} min/week)`)
      .join('\n')

    const focusedPrompt = `Based on deep analysis of this user's behavior:

USER PROFILE:
- Automation Maturity: ${intelligence.automationMaturity}
- Primary Use Case: ${intelligence.primaryUseCase}
- Most Used: ${intelligence.integrationAffinity.mostUsedIntegrations.slice(0, 3).map((i: any) => i.name).join(', ')}
- Data Quality: ${intelligence.dataQuality}

HIGH-CONFIDENCE OPPORTUNITIES IDENTIFIED:
${opportunityDescriptions}

Generate EXACTLY ${topOpportunities.length} specific, actionable workflow suggestions.
Each must be:
1. Directly addressing one of the opportunities above
2. Using integrations the user already has or commonly pairs with theirs
3. Providing realistic time savings estimates
4. Including complete workflow specification

Quality requirement: Only suggest if you're 90%+ confident this will help them.`

    const suggestions = await aiSuggestionsService.generateSuggestions({
      ...context,
      patterns: await aiSuggestionsService.getUserPatterns(context.userId)
    }, topOpportunities.length)

    // Filter to only truly high-confidence suggestions
    return suggestions.filter(s => s.confidence >= MIN_SUGGESTION_CONFIDENCE)
  },

  /**
   * Weekly Analysis Job (7 days, Opus tier)
   * Deep strategic analysis for power users
   */
  async runWeeklyAnalysis(userId?: string): Promise<Record<string, unknown>> {
    console.log('[BackgroundJobs] Running weekly strategic analysis')

    // Only run for Pro/Enterprise users to control costs
    const users = userId
      ? [{ id: userId }]
      : await this.getPremiumUsers()

    let analysesCompleted = 0
    let insightsGenerated = 0
    let totalCost = 0

    for (const user of users) {
      try {
        const context: UserContext = {
          userId: user.id,
          subscriptionTier: 'pro', // Will be refined
          workflows: [],
          recentExecutions: [],
          connectedIntegrations: [],
          patterns: await aiSuggestionsService.getUserPatterns(user.id)
        }

        const analysis = await aiSuggestionsService.generateStrategicAnalysis(context)

        analysesCompleted++
        insightsGenerated += analysis.insights.length + analysis.recommendedNextSteps.length
        totalCost += 0.5 // ~$0.50 per user for Opus

      } catch (error: any) {
        console.error(`[BackgroundJobs] Weekly analysis failed for user ${user.id}:`, error.message)
      }
    }

    return {
      analysesCompleted,
      insightsGenerated,
      estimatedCostUsd: totalCost.toFixed(4)
    }
  },

  /**
   * Analytics Rollup Job (Hourly)
   * Pre-compute metrics for fast dashboard loading
   */
  async runAnalyticsRollup(userId?: string): Promise<Record<string, unknown>> {
    console.log('[BackgroundJobs] Running analytics rollup')

    if (!supabase) {
      return { status: 'skipped', reason: 'No database connection' }
    }

    // Get users to process
    const users = userId
      ? [{ id: userId }]
      : await this.getActiveUsers()

    let metricsUpdated = 0
    const today = new Date().toISOString().split('T')[0]

    for (const user of users) {
      try {
        // Fetch execution counts for today
        const { data: executions } = await supabase
          .from('workflow_executions')
          .select('status')
          .gte('created_at', today)
          .eq('user_id', user.id)

        const totalExecs = executions?.length || 0
        const successfulExecs = executions?.filter(e => e.status === 'success').length || 0
        const failedExecs = executions?.filter(e => e.status === 'failed').length || 0

        // Fetch suggestion metrics
        const { data: suggestions } = await supabase
          .from('ai_suggestions')
          .select('status')
          .eq('user_id', user.id)
          .gte('created_at', today)

        const suggestionsShown = suggestions?.filter(s => s.status === 'shown').length || 0
        const suggestionsAccepted = suggestions?.filter(s => s.status === 'accepted').length || 0
        const suggestionsRejected = suggestions?.filter(s => s.status === 'rejected').length || 0

        // Upsert daily analytics
        await supabase
          .from('user_analytics')
          .upsert({
            user_id: user.id,
            period_type: 'daily',
            period_start: today,
            total_executions: totalExecs,
            successful_executions: successfulExecs,
            failed_executions: failedExecs,
            suggestions_shown: suggestionsShown,
            suggestions_accepted: suggestionsAccepted,
            suggestions_rejected: suggestionsRejected,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,period_type,period_start'
          })

        metricsUpdated++
      } catch (error: any) {
        console.error(`[BackgroundJobs] Analytics rollup failed for user ${user.id}:`, error.message)
      }
    }

    return { metricsUpdated }
  },

  /**
   * Data Archival Job (Daily)
   * Compress old execution data to save storage
   */
  async runDataArchival(): Promise<Record<string, unknown>> {
    console.log('[BackgroundJobs] Running data archival')

    if (!supabase) {
      return { status: 'skipped', reason: 'No database connection' }
    }

    // Archive executions older than 30 days
    const { data, error } = await supabase
      .rpc('archive_old_executions', { days_old: 30 })

    if (error) {
      throw new Error(`Archival failed: ${error.message}`)
    }

    return {
      executionsArchived: data || 0
    }
  },

  /**
   * Suggestion Expiry Job (6 hours)
   * Mark old suggestions as expired
   */
  async runSuggestionExpiry(): Promise<Record<string, unknown>> {
    console.log('[BackgroundJobs] Running suggestion expiry')

    if (!supabase) {
      return { status: 'skipped', reason: 'No database connection' }
    }

    // Expire suggestions older than 14 days
    const { data, error } = await supabase
      .rpc('expire_old_suggestions')

    if (error) {
      throw new Error(`Expiry failed: ${error.message}`)
    }

    return {
      suggestionsExpired: data || 0
    }
  },

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  async getActiveUsers(): Promise<{ id: string }[]> {
    if (!supabase) return []

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('users')
      .select('id')
      .gte('last_active_at', sevenDaysAgo)

    if (error) {
      console.error('[BackgroundJobs] Error fetching active users:', error)
      return []
    }

    return data || []
  },

  async getPremiumUsers(): Promise<{ id: string }[]> {
    if (!supabase) return []

    const { data, error } = await supabase
      .from('users')
      .select('id')
      .in('subscription_tier', ['pro', 'enterprise'])
      .gte('last_active_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    if (error) {
      console.error('[BackgroundJobs] Error fetching premium users:', error)
      return []
    }

    return data || []
  },

  async recordJobStart(jobId: string, jobType: JobType, userId?: string): Promise<void> {
    if (!supabase) return

    await supabase
      .from('background_jobs')
      .insert({
        id: jobId,
        job_type: jobType,
        user_id: userId,
        scheduled_for: new Date().toISOString(),
        started_at: new Date().toISOString(),
        status: 'running',
        retry_count: 0,
        max_retries: 3
      })
  },

  async recordJobComplete(jobId: string, result: Record<string, unknown>, durationMs: number): Promise<void> {
    if (!supabase) return

    await supabase
      .from('background_jobs')
      .update({
        completed_at: new Date().toISOString(),
        status: 'completed',
        result: { ...result, durationMs }
      })
      .eq('id', jobId)
  },

  async recordJobFailed(jobId: string, errorMessage: string, durationMs: number): Promise<void> {
    if (!supabase) return

    await supabase
      .from('background_jobs')
      .update({
        completed_at: new Date().toISOString(),
        status: 'failed',
        error_message: errorMessage,
        result: { durationMs }
      })
      .eq('id', jobId)
  },

  /**
   * Get job metrics for monitoring
   */
  async getJobMetrics(): Promise<Record<JobType, JobMetrics>> {
    const metrics: Record<JobType, JobMetrics> = {} as any

    const jobTypes: JobType[] = [
      'pattern_detection',
      'daily_suggestions',
      'weekly_analysis',
      'analytics_rollup',
      'data_archival',
      'suggestion_expiry'
    ]

    for (const jobType of jobTypes) {
      metrics[jobType] = {
        jobType,
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        avgDurationMs: 0,
        avgCostUsd: 0,
        lastRunAt: 'Never'
      }
    }

    if (!supabase) return metrics

    // Fetch job stats from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data } = await supabase
      .from('background_jobs')
      .select('*')
      .gte('created_at', sevenDaysAgo)

    if (!data) return metrics

    for (const job of data) {
      const m = metrics[job.job_type as JobType]
      if (!m) continue

      m.totalRuns++
      if (job.status === 'completed') m.successfulRuns++
      if (job.status === 'failed') m.failedRuns++

      if (job.result?.durationMs) {
        m.avgDurationMs = (m.avgDurationMs * (m.totalRuns - 1) + job.result.durationMs) / m.totalRuns
      }

      if (job.result?.estimatedCostUsd) {
        m.avgCostUsd = (m.avgCostUsd * (m.totalRuns - 1) + parseFloat(job.result.estimatedCostUsd)) / m.totalRuns
      }

      if (new Date(job.completed_at) > new Date(m.lastRunAt === 'Never' ? 0 : m.lastRunAt)) {
        m.lastRunAt = job.completed_at
      }
    }

    return metrics
  },

  /**
   * Manually trigger a job for a specific user
   */
  async triggerForUser(userId: string, jobType: JobType): Promise<void> {
    console.log(`[BackgroundJobs] Manually triggering ${jobType} for user ${userId}`)
    await this.runJob(jobType, userId)
  }
}

export default backgroundJobService
