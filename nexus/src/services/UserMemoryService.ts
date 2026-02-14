/**
 * UserMemoryService.ts
 *
 * Aggregates all user data from localStorage into a compact,
 * AI-ready context string for Claude. Replaces the previous
 * ~20 token context with a rich ~800-1200 token memory profile.
 */

// ============================================================================
// Types
// ============================================================================

export interface UserMemoryProfile {
  // Identity
  name: string | null
  email: string | null
  timezone: string | null
  region: string | null
  language: string

  // Business
  industry: string | null
  role: string | null
  companySize: string | null
  businessName: string | null

  // Automation maturity
  totalWorkflows: number
  totalChatSessions: number
  topIntegrations: string[]
  recentWorkflowNames: string[]
  workflowSuccessRate: number
  automationPriorities: string[]
  painPoints: string[]

  // Behavioral patterns
  peakUsageTime: string | null
  preferredWorkflowComplexity: string
  maturityLevel: string

  // Context from conversations
  mentionedEmails: string[]
  mentionedChannels: string[]
  preferredApps: string[]
}

// ============================================================================
// Service
// ============================================================================

class UserMemoryService {
  private static instance: UserMemoryService

  static getInstance(): UserMemoryService {
    if (!UserMemoryService.instance) {
      UserMemoryService.instance = new UserMemoryService()
    }
    return UserMemoryService.instance
  }

  /**
   * Build complete memory profile from all localStorage sources.
   */
  buildMemoryProfile(): UserMemoryProfile {
    const profile: UserMemoryProfile = {
      name: null,
      email: null,
      timezone: null,
      region: null,
      language: 'en',
      industry: null,
      role: null,
      companySize: null,
      businessName: null,
      totalWorkflows: 0,
      totalChatSessions: 0,
      topIntegrations: [],
      recentWorkflowNames: [],
      workflowSuccessRate: 0,
      automationPriorities: [],
      painPoints: [],
      peakUsageTime: null,
      preferredWorkflowComplexity: 'simple',
      maturityLevel: 'new',
      mentionedEmails: [],
      mentionedChannels: [],
      preferredApps: [],
    }

    this.loadBusinessProfile(profile)
    this.loadUserContext(profile)
    this.loadChatHistory(profile)
    this.loadWorkflows(profile)
    this.loadPreferences(profile)
    this.loadOnboardingStatus(profile)
    this.loadEventLog(profile)

    // Compute derived fields
    profile.maturityLevel = this.computeMaturityLevel(
      profile.totalWorkflows,
      profile.totalChatSessions
    )
    profile.preferredWorkflowComplexity = this.computeComplexityPreference(profile)

    return profile
  }

  /**
   * Produce compact AI-ready string (~800-1200 tokens).
   */
  getMemoryForAI(): string {
    const p = this.buildMemoryProfile()
    const sections: string[] = []

    // --- User Profile ---
    const identityParts: string[] = []
    if (p.name) identityParts.push(`Name: ${p.name}`)
    if (p.email) identityParts.push(`Email: ${p.email}`)
    if (p.region) identityParts.push(`Region: ${p.region}`)
    if (p.timezone) identityParts.push(`Timezone: ${p.timezone}`)
    if (identityParts.length > 0) {
      sections.push(`## User Profile\n${identityParts.join(' | ')}`)
    }

    // --- Business Context ---
    const bizParts: string[] = []
    if (p.industry) bizParts.push(`Industry: ${p.industry}`)
    if (p.role) bizParts.push(`Role: ${p.role}`)
    if (p.companySize) bizParts.push(`Company: ${p.companySize} employees`)
    if (p.businessName) bizParts.push(`Business: ${p.businessName}`)
    if (bizParts.length > 0) {
      let bizSection = `## Business Context\n${bizParts.join(' | ')}`
      if (p.automationPriorities.length > 0) {
        bizSection += `\nPriorities: ${p.automationPriorities.join(', ')}`
      }
      if (p.painPoints.length > 0) {
        bizSection += `\nPain points: ${p.painPoints.join(', ')}`
      }
      sections.push(bizSection)
    }

    // --- Automation Maturity ---
    const maturityLabel = p.maturityLevel.toUpperCase()
    const maturityDetails: string[] = [
      `${p.totalWorkflows} workflows`,
      `${p.totalChatSessions} sessions`,
    ]
    let maturitySection = `## Automation Maturity: ${maturityLabel} (${maturityDetails.join(', ')})`
    if (p.topIntegrations.length > 0) {
      maturitySection += `\nTop integrations: ${p.topIntegrations.join(', ')}`
    }
    if (p.recentWorkflowNames.length > 0) {
      maturitySection += `\nRecent workflows: ${p.recentWorkflowNames.map(n => `"${n}"`).join(', ')}`
    }
    if (p.workflowSuccessRate > 0) {
      maturitySection += `\nSuccess rate: ${p.workflowSuccessRate}%`
    }
    // Only show maturity section if there's meaningful data
    if (p.totalWorkflows > 0 || p.totalChatSessions > 0) {
      sections.push(maturitySection)
    }

    // --- Behavioral Patterns ---
    const behaviorParts: string[] = []
    if (p.peakUsageTime) behaviorParts.push(`Peak usage: ${p.peakUsageTime}`)
    behaviorParts.push(`Complexity preference: ${p.preferredWorkflowComplexity}`)
    if (p.preferredApps.length > 0) {
      behaviorParts.push(`Preferred apps: ${p.preferredApps.join(', ')}`)
    }
    if (behaviorParts.length > 1 || p.preferredApps.length > 0) {
      sections.push(`## Behavioral Patterns\n${behaviorParts.join(' | ')}`)
    }

    // --- Known Entities ---
    const entityParts: string[] = []
    if (p.mentionedEmails.length > 0) {
      entityParts.push(`Frequently emails: ${p.mentionedEmails.slice(0, 5).join(', ')}`)
    }
    if (p.mentionedChannels.length > 0) {
      entityParts.push(`Slack channels: ${p.mentionedChannels.slice(0, 5).join(', ')}`)
    }
    if (entityParts.length > 0) {
      sections.push(`## Known Preferences\n${entityParts.join('\n')}`)
    }

    return sections.join('\n\n')
  }

  /**
   * Record a user event for future memory building.
   */
  recordEvent(
    type: 'chat_sent' | 'workflow_created' | 'workflow_executed' | 'suggestion_accepted',
    data?: Record<string, unknown>
  ): void {
    try {
      const raw = localStorage.getItem('nexus_memory_events')
      const events: Array<{ type: string; data?: Record<string, unknown>; ts: number }> =
        raw ? JSON.parse(raw) : []

      events.push({ type, data, ts: Date.now() })

      // Keep last 200 events max
      const trimmed = events.slice(-200)
      localStorage.setItem('nexus_memory_events', JSON.stringify(trimmed))
    } catch {
      // Silently ignore storage errors
    }
  }

  // ==========================================================================
  // Private: Data Source Loaders
  // ==========================================================================

  private loadBusinessProfile(profile: UserMemoryProfile): void {
    try {
      const raw = localStorage.getItem('nexus_business_profile')
      if (!raw) return
      const data = JSON.parse(raw)
      if (data.industry) profile.industry = data.industry
      if (data.primaryRole) profile.role = data.primaryRole
      if (data.companySize) profile.companySize = data.companySize
      if (data.businessName) profile.businessName = data.businessName
      if (Array.isArray(data.automationPriorities)) {
        profile.automationPriorities = data.automationPriorities
      }
      if (Array.isArray(data.painPoints)) {
        profile.painPoints = data.painPoints
      }
    } catch { /* ignore */ }
  }

  private loadUserContext(profile: UserMemoryProfile): void {
    try {
      const raw = localStorage.getItem('nexus_user_context')
      if (!raw) return
      const data = JSON.parse(raw)
      if (data.email) profile.email = data.email
      if (data.name) profile.name = data.name
      if (data.timezone) profile.timezone = data.timezone
      if (data.region) profile.region = data.region
      if (Array.isArray(data.connectedApps)) {
        profile.preferredApps = data.connectedApps
      }
      if (Array.isArray(data.mentionedEmails)) {
        profile.mentionedEmails = data.mentionedEmails
      }
      if (Array.isArray(data.mentionedChannels)) {
        profile.mentionedChannels = data.mentionedChannels
      }
    } catch { /* ignore */ }
  }

  private loadChatHistory(profile: UserMemoryProfile): void {
    try {
      const raw = localStorage.getItem('nexus-chat-sessions')
      if (!raw) return
      const sessions = JSON.parse(raw)
      if (Array.isArray(sessions)) {
        profile.totalChatSessions = sessions.length

        // Compute peak usage time from session timestamps
        const hours: number[] = []
        for (const session of sessions) {
          if (session.createdAt || session.updatedAt) {
            const date = new Date(session.updatedAt || session.createdAt)
            if (!isNaN(date.getTime())) {
              hours.push(date.getHours())
            }
          }
        }
        if (hours.length > 0) {
          profile.peakUsageTime = this.computePeakTime(hours)
        }
      }
    } catch { /* ignore */ }
  }

  private loadWorkflows(profile: UserMemoryProfile): void {
    try {
      const raw = localStorage.getItem('nexus-user-workflows')
      if (!raw) return
      const workflows = JSON.parse(raw)
      if (Array.isArray(workflows)) {
        profile.totalWorkflows = workflows.length

        // Recent workflow names (last 5)
        profile.recentWorkflowNames = workflows
          .slice(-5)
          .map((w: { name?: string }) => w.name || 'Unnamed')
          .reverse()

        // Top integrations by frequency
        const integrationCounts: Record<string, number> = {}
        let successCount = 0
        let executedCount = 0

        for (const wf of workflows) {
          // Count integrations
          if (Array.isArray(wf.integrations)) {
            for (const integration of wf.integrations) {
              integrationCounts[integration] = (integrationCounts[integration] || 0) + 1
            }
          }
          if (Array.isArray(wf.requiredIntegrations)) {
            for (const integration of wf.requiredIntegrations) {
              integrationCounts[integration] = (integrationCounts[integration] || 0) + 1
            }
          }

          // Track success rate
          if (wf.status === 'completed' || wf.status === 'success') {
            successCount++
            executedCount++
          } else if (wf.status === 'failed' || wf.status === 'error') {
            executedCount++
          }
        }

        // Sort integrations by frequency
        profile.topIntegrations = Object.entries(integrationCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([name]) => name)

        // Success rate
        if (executedCount > 0) {
          profile.workflowSuccessRate = Math.round((successCount / executedCount) * 100)
        }
      }
    } catch { /* ignore */ }
  }

  private loadPreferences(profile: UserMemoryProfile): void {
    try {
      const raw = localStorage.getItem('nexus-user-preferences')
      if (!raw) return
      const prefs = JSON.parse(raw)
      if (prefs.language) profile.language = prefs.language
    } catch { /* ignore */ }

    // Also check i18n setting
    try {
      const lang = localStorage.getItem('i18nextLng')
      if (lang) profile.language = lang
    } catch { /* ignore */ }
  }

  private loadOnboardingStatus(_profile: UserMemoryProfile): void {
    // Onboarding completion is a signal of engagement level
    try {
      const completed = localStorage.getItem('nexus_onboarding_wizard_completed')
      if (completed === 'true') {
        // User engaged enough to complete onboarding
        // This influences maturity but is handled in computeMaturityLevel
      }
    } catch { /* ignore */ }
  }

  private loadEventLog(profile: UserMemoryProfile): void {
    try {
      const raw = localStorage.getItem('nexus_memory_events')
      if (!raw) return
      const events: Array<{ type: string; data?: Record<string, unknown>; ts: number }> =
        JSON.parse(raw)

      // Count workflow events for additional maturity signals
      let workflowCreated = 0
      let workflowExecuted = 0
      let workflowSuccess = 0

      for (const event of events) {
        if (event.type === 'workflow_created') workflowCreated++
        if (event.type === 'workflow_executed') {
          workflowExecuted++
          if (event.data?.success) workflowSuccess++
        }
      }

      // Supplement counts if localStorage workflows are stale
      if (workflowCreated > profile.totalWorkflows) {
        profile.totalWorkflows = workflowCreated
      }

      // Better success rate from event log
      if (workflowExecuted > 0) {
        const eventRate = Math.round((workflowSuccess / workflowExecuted) * 100)
        // Use the higher fidelity source
        if (workflowExecuted > 3) {
          profile.workflowSuccessRate = eventRate
        }
      }

      // Extract mentioned integrations from events
      const appMentions: Record<string, number> = {}
      for (const event of events) {
        if (event.data?.integrations && Array.isArray(event.data.integrations)) {
          for (const app of event.data.integrations) {
            if (typeof app === 'string') {
              appMentions[app] = (appMentions[app] || 0) + 1
            }
          }
        }
      }

      // Merge with existing top integrations
      const combined: Record<string, number> = {}
      for (const app of profile.topIntegrations) {
        combined[app] = (combined[app] || 0) + 5 // Base weight from stored workflows
      }
      for (const [app, count] of Object.entries(appMentions)) {
        combined[app] = (combined[app] || 0) + count
      }
      profile.topIntegrations = Object.entries(combined)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name]) => name)
    } catch { /* ignore */ }
  }

  // ==========================================================================
  // Private: Computed Fields
  // ==========================================================================

  private computeMaturityLevel(workflows: number, sessions: number): string {
    if (workflows >= 10 && sessions >= 20) return 'power_user'
    if (workflows >= 4 && sessions >= 5) return 'proficient'
    if (workflows >= 1 && sessions >= 1) return 'learning'
    return 'new'
  }

  private computeComplexityPreference(profile: UserMemoryProfile): string {
    // If they have 3+ step workflows regularly, they prefer complex
    if (profile.totalWorkflows >= 8) return 'complex'
    if (profile.totalWorkflows >= 3) return 'moderate'
    return 'simple'
  }

  private computePeakTime(hours: number[]): string {
    const buckets = { morning: 0, afternoon: 0, evening: 0, night: 0 }
    for (const h of hours) {
      if (h >= 6 && h < 12) buckets.morning++
      else if (h >= 12 && h < 17) buckets.afternoon++
      else if (h >= 17 && h < 22) buckets.evening++
      else buckets.night++
    }
    const peak = Object.entries(buckets).sort(([, a], [, b]) => b - a)[0]
    return peak[1] > 0 ? peak[0] : 'morning'
  }
}

export const userMemoryService = UserMemoryService.getInstance()
export default UserMemoryService
