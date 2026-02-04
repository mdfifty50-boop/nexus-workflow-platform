/**
 * Pattern Detection Service
 *
 * Detects user behavior patterns using rule-based algorithms.
 * Runs hourly without LLM calls for cost efficiency.
 * LLM is only used for complex pattern interpretation (via AISuggestionsService).
 *
 * Detected patterns:
 * - Peak usage times (when user is most active)
 * - Repeated manual triggers (workflows run by hand frequently)
 * - Workflow sequences (workflows that run together)
 * - Integration combinations (apps used together)
 * - Failure patterns (recurring issues)
 * - Time-of-week patterns (weekday vs weekend behavior)
 * - Execution volume trends (busy vs quiet periods)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

// =============================================================================
// TYPES
// =============================================================================

export interface DetectedPattern {
  type: PatternType
  key: string
  data: Record<string, unknown>
  confidence: number
  sample_count: number
  insight: string
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

export interface WorkflowExecution {
  id: string
  workflow_id: string
  workflow_name?: string
  status: 'success' | 'failed' | 'partial' | 'running'
  trigger_type: 'manual' | 'scheduled' | 'webhook' | 'api'
  created_at: string
  completed_at?: string
  execution_data?: Record<string, unknown>
  integrations?: string[]
  error_message?: string
}

export interface PatternDetectionResult {
  userId: string
  patterns: DetectedPattern[]
  analysisTimestamp: string
  executionsAnalyzed: number
  recommendations: string[]
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
// PATTERN DETECTION SERVICE
// =============================================================================

export const patternDetectionService = {
  /**
   * Run full pattern detection for a user
   * This should be called hourly or when significant activity occurs
   */
  async detectAllPatterns(userId: string): Promise<PatternDetectionResult> {
    console.log(`[PatternDetection] Starting analysis for user ${userId}`)

    // Fetch recent executions (last 30 days)
    const executions = await this.getRecentExecutions(userId, 30)

    if (executions.length < 10) {
      console.log(`[PatternDetection] Insufficient data (${executions.length} executions)`)
      return {
        userId,
        patterns: [],
        analysisTimestamp: new Date().toISOString(),
        executionsAnalyzed: executions.length,
        recommendations: ['Keep using Nexus to unlock personalized insights!']
      }
    }

    const patterns: DetectedPattern[] = []

    // Run all pattern detectors
    patterns.push(...this.detectPeakUsageTimes(executions))
    patterns.push(...this.detectRepeatedManual(executions))
    patterns.push(...this.detectWorkflowSequences(executions))
    patterns.push(...this.detectIntegrationCombos(executions))
    patterns.push(...this.detectFailurePatterns(executions))
    patterns.push(...this.detectTimeOfWeekPatterns(executions))
    patterns.push(...this.detectVolumePatterns(executions))

    // Store patterns in database
    await this.storePatterns(userId, patterns)

    // Generate recommendations based on patterns
    const recommendations = this.generateRecommendations(patterns)

    console.log(`[PatternDetection] Found ${patterns.length} patterns for user ${userId}`)

    return {
      userId,
      patterns,
      analysisTimestamp: new Date().toISOString(),
      executionsAnalyzed: executions.length,
      recommendations
    }
  },

  /**
   * Detect peak usage times
   * Finds hours when user is most active
   */
  detectPeakUsageTimes(executions: WorkflowExecution[]): DetectedPattern[] {
    const hourCounts: Record<number, number> = {}

    for (const exec of executions) {
      const hour = new Date(exec.created_at).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    }

    const sortedHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)

    if (sortedHours.length === 0) return []

    const totalExecutions = executions.length
    const peakHour = parseInt(sortedHours[0][0])
    const peakCount = sortedHours[0][1]
    const confidence = Math.min(peakCount / totalExecutions * 3, 0.95)

    return [{
      type: 'peak_usage_time',
      key: `peak_hour_${peakHour}`,
      data: {
        peak_hours: sortedHours.map(([h, c]) => ({
          hour: parseInt(h),
          count: c,
          percentage: ((c / totalExecutions) * 100).toFixed(1)
        })),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      confidence,
      sample_count: totalExecutions,
      insight: `You're most active around ${peakHour}:00 (${((peakCount / totalExecutions) * 100).toFixed(0)}% of activity)`
    }]
  },

  /**
   * Detect workflows that are frequently triggered manually
   * These are candidates for scheduling or automation
   */
  detectRepeatedManual(executions: WorkflowExecution[]): DetectedPattern[] {
    const patterns: DetectedPattern[] = []
    const manualCounts: Record<string, { count: number; name: string }> = {}

    for (const exec of executions) {
      if (exec.trigger_type === 'manual') {
        const key = exec.workflow_id
        if (!manualCounts[key]) {
          manualCounts[key] = { count: 0, name: exec.workflow_name || 'Unknown' }
        }
        manualCounts[key].count++
      }
    }

    const frequentManual = Object.entries(manualCounts)
      .filter(([, data]) => data.count >= 5)
      .sort(([, a], [, b]) => b.count - a.count)

    for (const [workflowId, data] of frequentManual.slice(0, 3)) {
      patterns.push({
        type: 'repeated_manual',
        key: `manual_${workflowId}`,
        data: {
          workflow_id: workflowId,
          workflow_name: data.name,
          manual_trigger_count: data.count
        },
        confidence: Math.min(data.count / 20, 0.9),
        sample_count: data.count,
        insight: `"${data.name}" is triggered manually ${data.count} times. Consider scheduling it.`
      })
    }

    return patterns
  },

  /**
   * Detect workflows that are often run together
   * (within 5 minutes of each other)
   */
  detectWorkflowSequences(executions: WorkflowExecution[]): DetectedPattern[] {
    const patterns: DetectedPattern[] = []
    const sequences: Record<string, { count: number; first: string; second: string }> = {}

    // Sort by timestamp
    const sorted = [...executions].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i]
      const next = sorted[i + 1]

      const timeDiff = new Date(next.created_at).getTime() - new Date(current.created_at).getTime()
      const fiveMinutes = 5 * 60 * 1000

      if (timeDiff <= fiveMinutes && current.workflow_id !== next.workflow_id) {
        const key = `${current.workflow_id}->${next.workflow_id}`
        if (!sequences[key]) {
          sequences[key] = {
            count: 0,
            first: current.workflow_name || current.workflow_id,
            second: next.workflow_name || next.workflow_id
          }
        }
        sequences[key].count++
      }
    }

    const frequentSequences = Object.entries(sequences)
      .filter(([, data]) => data.count >= 3)
      .sort(([, a], [, b]) => b.count - a.count)

    for (const [sequenceKey, data] of frequentSequences.slice(0, 3)) {
      patterns.push({
        type: 'workflow_sequence',
        key: `seq_${sequenceKey}`,
        data: {
          first_workflow: data.first,
          second_workflow: data.second,
          occurrence_count: data.count
        },
        confidence: Math.min(data.count / 10, 0.85),
        sample_count: data.count,
        insight: `"${data.first}" is often followed by "${data.second}". Consider combining them.`
      })
    }

    return patterns
  },

  /**
   * Detect integrations that are frequently used together
   */
  detectIntegrationCombos(executions: WorkflowExecution[]): DetectedPattern[] {
    const patterns: DetectedPattern[] = []
    const comboCounts: Record<string, { count: number; integrations: string[] }> = {}

    for (const exec of executions) {
      const integrations = exec.integrations || []
      if (integrations.length >= 2) {
        // Create a sorted key for the combination
        const key = integrations.slice().sort().join('+')
        if (!comboCounts[key]) {
          comboCounts[key] = { count: 0, integrations }
        }
        comboCounts[key].count++
      }
    }

    const frequentCombos = Object.entries(comboCounts)
      .filter(([, data]) => data.count >= 5)
      .sort(([, a], [, b]) => b.count - a.count)

    for (const [comboKey, data] of frequentCombos.slice(0, 3)) {
      patterns.push({
        type: 'integration_combo',
        key: `combo_${comboKey}`,
        data: {
          integrations: data.integrations,
          usage_count: data.count
        },
        confidence: Math.min(data.count / 15, 0.9),
        sample_count: data.count,
        insight: `${data.integrations.join(' + ')} is your power combo (${data.count} uses)`
      })
    }

    return patterns
  },

  /**
   * Detect recurring failure patterns
   */
  detectFailurePatterns(executions: WorkflowExecution[]): DetectedPattern[] {
    const patterns: DetectedPattern[] = []
    const failureCounts: Record<string, {
      count: number
      workflow_name: string
      errors: string[]
    }> = {}

    for (const exec of executions) {
      if (exec.status === 'failed') {
        const key = exec.workflow_id
        if (!failureCounts[key]) {
          failureCounts[key] = {
            count: 0,
            workflow_name: exec.workflow_name || 'Unknown',
            errors: []
          }
        }
        failureCounts[key].count++
        if (exec.error_message && !failureCounts[key].errors.includes(exec.error_message)) {
          failureCounts[key].errors.push(exec.error_message)
        }
      }
    }

    const frequentFailures = Object.entries(failureCounts)
      .filter(([, data]) => data.count >= 3)
      .sort(([, a], [, b]) => b.count - a.count)

    for (const [workflowId, data] of frequentFailures.slice(0, 3)) {
      const totalForWorkflow = executions.filter(e => e.workflow_id === workflowId).length
      const failureRate = ((data.count / totalForWorkflow) * 100).toFixed(0)

      patterns.push({
        type: 'failure_pattern',
        key: `failure_${workflowId}`,
        data: {
          workflow_id: workflowId,
          workflow_name: data.workflow_name,
          failure_count: data.count,
          failure_rate: parseFloat(failureRate),
          common_errors: data.errors.slice(0, 3)
        },
        confidence: Math.min(data.count / 10, 0.95),
        sample_count: data.count,
        insight: `"${data.workflow_name}" fails ${failureRate}% of the time. Let's fix this!`
      })
    }

    return patterns
  },

  /**
   * Detect day-of-week patterns
   */
  detectTimeOfWeekPatterns(executions: WorkflowExecution[]): DetectedPattern[] {
    const dayCounts: Record<number, number> = {}
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    for (const exec of executions) {
      const day = new Date(exec.created_at).getDay()
      dayCounts[day] = (dayCounts[day] || 0) + 1
    }

    const sortedDays = Object.entries(dayCounts)
      .sort(([, a], [, b]) => b - a)

    if (sortedDays.length < 3) return []

    const totalExecutions = executions.length
    const peakDay = parseInt(sortedDays[0][0])
    const peakCount = sortedDays[0][1]
    const confidence = Math.min(peakCount / totalExecutions * 2.5, 0.9)

    // Check for weekend vs weekday pattern
    const weekdayCount = [1, 2, 3, 4, 5].reduce((sum, d) => sum + (dayCounts[d] || 0), 0)
    const weekendCount = [0, 6].reduce((sum, d) => sum + (dayCounts[d] || 0), 0)
    const isWeekdayFocused = weekdayCount > weekendCount * 4

    return [{
      type: 'time_of_week',
      key: `day_pattern_${peakDay}`,
      data: {
        peak_day: dayNames[peakDay],
        peak_day_number: peakDay,
        day_distribution: sortedDays.map(([d, c]) => ({
          day: dayNames[parseInt(d)],
          count: c,
          percentage: ((c / totalExecutions) * 100).toFixed(1)
        })),
        is_weekday_focused: isWeekdayFocused,
        weekday_percentage: ((weekdayCount / totalExecutions) * 100).toFixed(0)
      },
      confidence,
      sample_count: totalExecutions,
      insight: isWeekdayFocused
        ? `You're a weekday warrior! ${dayNames[peakDay]} is your busiest day.`
        : `${dayNames[peakDay]} is your most active day (${((peakCount / totalExecutions) * 100).toFixed(0)}% of activity)`
    }]
  },

  /**
   * Detect volume trends (increasing/decreasing activity)
   */
  detectVolumePatterns(executions: WorkflowExecution[]): DetectedPattern[] {
    // Group executions by week
    const weekCounts: Record<string, number> = {}

    for (const exec of executions) {
      const date = new Date(exec.created_at)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const weekKey = weekStart.toISOString().split('T')[0]

      weekCounts[weekKey] = (weekCounts[weekKey] || 0) + 1
    }

    const weeks = Object.entries(weekCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, count]) => ({ week, count }))

    if (weeks.length < 2) return []

    // Calculate trend
    const firstHalf = weeks.slice(0, Math.floor(weeks.length / 2))
    const secondHalf = weeks.slice(Math.floor(weeks.length / 2))

    const firstAvg = firstHalf.reduce((sum, w) => sum + w.count, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, w) => sum + w.count, 0) / secondHalf.length

    const changePercent = ((secondAvg - firstAvg) / firstAvg * 100)
    const trend = changePercent > 10 ? 'increasing' : changePercent < -10 ? 'decreasing' : 'stable'

    return [{
      type: 'execution_volume',
      key: `volume_trend_${trend}`,
      data: {
        trend,
        change_percent: changePercent.toFixed(1),
        weekly_average: ((firstAvg + secondAvg) / 2).toFixed(1),
        weeks_analyzed: weeks.length,
        weekly_data: weeks
      },
      confidence: Math.min(weeks.length / 8, 0.85),
      sample_count: executions.length,
      insight: trend === 'increasing'
        ? `Your automation usage is growing! Up ${changePercent.toFixed(0)}% recently.`
        : trend === 'decreasing'
          ? `Activity has slowed down. Need help finding new automations?`
          : `Consistent automation usage - you've found your rhythm!`
    }]
  },

  /**
   * Generate actionable recommendations from patterns
   */
  generateRecommendations(patterns: DetectedPattern[]): string[] {
    const recommendations: string[] = []

    for (const pattern of patterns) {
      switch (pattern.type) {
        case 'repeated_manual':
          recommendations.push(
            `Schedule "${(pattern.data as any).workflow_name}" to run automatically at your peak hour`
          )
          break
        case 'workflow_sequence':
          recommendations.push(
            `Combine "${(pattern.data as any).first_workflow}" and "${(pattern.data as any).second_workflow}" into a single workflow`
          )
          break
        case 'failure_pattern':
          recommendations.push(
            `Fix the recurring issues in "${(pattern.data as any).workflow_name}" - it's failing ${(pattern.data as any).failure_rate}% of the time`
          )
          break
        case 'integration_combo':
          recommendations.push(
            `You use ${(pattern.data as any).integrations.join(' + ')} together often - consider a template for this combo`
          )
          break
      }
    }

    return recommendations.slice(0, 5) // Limit to top 5
  },

  /**
   * Get recent executions for a user
   */
  async getRecentExecutions(userId: string, days: number = 30): Promise<WorkflowExecution[]> {
    if (!supabase) {
      console.log('[PatternDetection] No Supabase client, returning empty executions')
      return []
    }

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const { data, error } = await supabase
      .from('workflow_executions')
      .select(`
        id,
        workflow_id,
        status,
        created_at,
        completed_at,
        execution_data,
        workflows!inner (
          name,
          config
        )
      `)
      .eq('workflows.project_id', userId) // This might need adjustment based on your schema
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(1000)

    if (error) {
      console.error('[PatternDetection] Error fetching executions:', error)
      return []
    }

    // Transform to our format
    return (data || []).map((exec: any) => ({
      id: exec.id,
      workflow_id: exec.workflow_id,
      workflow_name: exec.workflows?.name,
      status: exec.status,
      trigger_type: exec.execution_data?.trigger_type || 'manual',
      created_at: exec.created_at,
      completed_at: exec.completed_at,
      execution_data: exec.execution_data,
      integrations: exec.workflows?.config?.integrations || [],
      error_message: exec.execution_data?.error_message
    }))
  },

  /**
   * Store patterns in database
   */
  async storePatterns(userId: string, patterns: DetectedPattern[]): Promise<void> {
    if (!supabase || patterns.length === 0) return

    for (const pattern of patterns) {
      const { error } = await supabase
        .from('user_patterns')
        .upsert({
          id: randomUUID(),
          user_id: userId,
          pattern_type: pattern.type,
          pattern_data: { ...pattern.data, key: pattern.key, insight: pattern.insight },
          confidence: pattern.confidence,
          sample_count: pattern.sample_count,
          last_observed_at: new Date().toISOString(),
          is_active: true
        }, {
          onConflict: 'user_id,pattern_type,(pattern_data->>\'key\')'
        })

      if (error) {
        console.error('[PatternDetection] Error storing pattern:', error)
      }
    }

    console.log(`[PatternDetection] Stored ${patterns.length} patterns for user ${userId}`)
  },

  /**
   * Run pattern detection for all active users
   * Called by background job scheduler
   */
  async runForAllUsers(): Promise<{
    usersProcessed: number
    patternsFound: number
    errors: number
  }> {
    if (!supabase) {
      console.log('[PatternDetection] No Supabase client, skipping batch run')
      return { usersProcessed: 0, patternsFound: 0, errors: 0 }
    }

    // Get users active in last 7 days
    const { data: users, error } = await supabase
      .from('users')
      .select('id')
      .gte('last_active_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    if (error || !users) {
      console.error('[PatternDetection] Error fetching users:', error)
      return { usersProcessed: 0, patternsFound: 0, errors: 1 }
    }

    let usersProcessed = 0
    let patternsFound = 0
    let errors = 0

    for (const user of users) {
      try {
        const result = await this.detectAllPatterns(user.id)
        usersProcessed++
        patternsFound += result.patterns.length
      } catch (err) {
        console.error(`[PatternDetection] Error processing user ${user.id}:`, err)
        errors++
      }
    }

    console.log(`[PatternDetection] Batch complete: ${usersProcessed} users, ${patternsFound} patterns, ${errors} errors`)
    return { usersProcessed, patternsFound, errors }
  }
}

export default patternDetectionService
