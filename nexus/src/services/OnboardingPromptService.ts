/**
 * OnboardingPromptService.ts
 *
 * Generates a personalized workflow suggestion based on the user's
 * business profile, connected apps, and industry persona.
 *
 * Returns a ready-to-send prompt string that can be displayed as a
 * "suggested prompt" card in the chat interface.
 *
 * This uses LOCAL pattern matching only - no LLM call required.
 */

// ============================================================================
// Types
// ============================================================================

export interface OnboardingSuggestion {
  /** The prompt text the user can send with one tap */
  prompt: string
  /** Short human-readable description of what this workflow does */
  description: string
  /** The apps involved (for display) */
  apps: string[]
}

// ============================================================================
// Industry + App Workflow Templates
// ============================================================================

interface WorkflowTemplate {
  prompt: string
  description: string
  apps: string[]
  /** Required apps - at least one must be in user's connected/preferred list */
  requiredApps?: string[]
}

/**
 * Templates keyed by industry. Each industry has an ordered list of
 * workflow suggestions. The first one whose required apps overlap
 * with the user's connected apps will be selected.
 */
const INDUSTRY_TEMPLATES: Record<string, WorkflowTemplate[]> = {
  ecommerce: [
    {
      prompt: 'When I get a new order notification email, save the order details to a Google Sheet and notify me on Slack',
      description: 'Auto-track new orders from email to spreadsheet with Slack alerts',
      apps: ['gmail', 'googlesheets', 'slack'],
      requiredApps: ['gmail', 'googlesheets'],
    },
    {
      prompt: 'When I get a WhatsApp message with a food order, save it to a Google Sheet and send a confirmation reply',
      description: 'Capture WhatsApp orders into a spreadsheet automatically',
      apps: ['whatsapp', 'googlesheets'],
      requiredApps: ['whatsapp'],
    },
    {
      prompt: 'Monitor my store email for refund requests and create a tracking entry in Google Sheets',
      description: 'Auto-log refund requests from email to a spreadsheet',
      apps: ['gmail', 'googlesheets'],
    },
    {
      prompt: 'When a new product review comes in via email, post a summary to our team Slack channel',
      description: 'Keep your team updated on new customer reviews',
      apps: ['gmail', 'slack'],
    },
  ],
  saas: [
    {
      prompt: 'Summarize my unread emails every morning and send me a Slack digest',
      description: 'Daily email digest delivered to Slack',
      apps: ['gmail', 'slack'],
      requiredApps: ['gmail', 'slack'],
    },
    {
      prompt: 'When a new GitHub issue is created, post it to our team Slack channel and log it in Google Sheets',
      description: 'Auto-track GitHub issues in Slack and spreadsheet',
      apps: ['github', 'slack', 'googlesheets'],
      requiredApps: ['github'],
    },
    {
      prompt: 'When I receive a support email, create a task in Linear and notify the team on Slack',
      description: 'Route support emails to issue tracker with Slack alerts',
      apps: ['gmail', 'linear', 'slack'],
      requiredApps: ['linear'],
    },
    {
      prompt: 'Track new sign-up notification emails in a Google Sheet and send a welcome Slack message',
      description: 'Log new signups and celebrate in Slack',
      apps: ['gmail', 'googlesheets', 'slack'],
    },
  ],
  agency: [
    {
      prompt: 'When a client emails a brief, save the attachment to Google Drive and notify the team on Slack',
      description: 'Auto-file client briefs and alert your team',
      apps: ['gmail', 'googledrive', 'slack'],
      requiredApps: ['gmail'],
    },
    {
      prompt: 'Every Monday morning, pull my Google Calendar events for the week and send a summary to Slack',
      description: 'Weekly schedule digest for the team',
      apps: ['googlecalendar', 'slack'],
      requiredApps: ['googlecalendar', 'slack'],
    },
    {
      prompt: 'When I receive a new project inquiry email, create a Trello card and send me a Slack notification',
      description: 'Auto-create project cards from inquiry emails',
      apps: ['gmail', 'trello', 'slack'],
      requiredApps: ['trello'],
    },
  ],
  consulting: [
    {
      prompt: 'Summarize my unread emails every morning and send me a Slack digest',
      description: 'Daily email intelligence briefing',
      apps: ['gmail', 'slack'],
      requiredApps: ['gmail'],
    },
    {
      prompt: 'When a new meeting is scheduled on Google Calendar, send a WhatsApp reminder 1 hour before',
      description: 'Never miss a client meeting with WhatsApp reminders',
      apps: ['googlecalendar', 'whatsapp'],
      requiredApps: ['googlecalendar', 'whatsapp'],
    },
    {
      prompt: 'When I get an email from a client, save the key details to a Google Sheet for tracking',
      description: 'Auto-log client communications for easy reference',
      apps: ['gmail', 'googlesheets'],
    },
  ],
  healthcare: [
    {
      prompt: 'When I receive a patient inquiry email, create a follow-up task in Google Sheets and send a Slack alert',
      description: 'Track patient inquiries with team notifications',
      apps: ['gmail', 'googlesheets', 'slack'],
      requiredApps: ['gmail'],
    },
    {
      prompt: 'Send me a daily Slack summary of all new appointment-related emails',
      description: 'Daily appointment email digest',
      apps: ['gmail', 'slack'],
    },
  ],
  finance: [
    {
      prompt: 'When I receive a payment notification email, log it in Google Sheets and notify me on Slack',
      description: 'Auto-track payments with Slack alerts',
      apps: ['gmail', 'googlesheets', 'slack'],
      requiredApps: ['gmail'],
    },
    {
      prompt: 'Summarize my unread financial emails every morning and send me a digest on Slack',
      description: 'Daily financial email briefing',
      apps: ['gmail', 'slack'],
    },
  ],
  education: [
    {
      prompt: 'When I get an email from a student, save it to a Google Sheet and send me a Slack reminder to follow up',
      description: 'Track student communications with follow-up reminders',
      apps: ['gmail', 'googlesheets', 'slack'],
      requiredApps: ['gmail'],
    },
    {
      prompt: 'Every morning, send me a Slack summary of today\'s Google Calendar events',
      description: 'Daily class and meeting schedule digest',
      apps: ['googlecalendar', 'slack'],
      requiredApps: ['googlecalendar'],
    },
  ],
  realestate: [
    {
      prompt: 'When a new meeting is scheduled on Google Calendar, send a WhatsApp reminder 1 hour before',
      description: 'Automated showing and meeting reminders via WhatsApp',
      apps: ['googlecalendar', 'whatsapp'],
      requiredApps: ['googlecalendar'],
    },
    {
      prompt: 'When I get a property inquiry email, save the lead details to Google Sheets and notify me on Slack',
      description: 'Auto-capture property leads from email',
      apps: ['gmail', 'googlesheets', 'slack'],
      requiredApps: ['gmail'],
    },
  ],
  manufacturing: [
    {
      prompt: 'When I receive a supplier email, log it in Google Sheets and alert the team on Slack',
      description: 'Track supplier communications automatically',
      apps: ['gmail', 'googlesheets', 'slack'],
      requiredApps: ['gmail'],
    },
  ],
  retail: [
    {
      prompt: 'When I get a customer complaint email, create a tracking entry in Google Sheets and notify the manager on Slack',
      description: 'Auto-escalate customer complaints with tracking',
      apps: ['gmail', 'googlesheets', 'slack'],
      requiredApps: ['gmail'],
    },
  ],
  nonprofit: [
    {
      prompt: 'When I receive a donation notification email, log it in Google Sheets and send a thank-you via Gmail',
      description: 'Auto-track donations and send thank-you emails',
      apps: ['gmail', 'googlesheets'],
      requiredApps: ['gmail'],
    },
  ],
}

/**
 * Generic templates for when no industry is set or no industry-specific
 * template matches the user's apps. Ordered by popularity.
 */
const GENERIC_TEMPLATES: WorkflowTemplate[] = [
  {
    prompt: 'Summarize my unread emails every morning and send me a Slack digest',
    description: 'Daily email summary delivered to Slack',
    apps: ['gmail', 'slack'],
    requiredApps: ['gmail', 'slack'],
  },
  {
    prompt: 'When I receive an important email, save it to Google Sheets and notify me on Slack',
    description: 'Track important emails in a spreadsheet with Slack alerts',
    apps: ['gmail', 'googlesheets', 'slack'],
    requiredApps: ['gmail'],
  },
  {
    prompt: 'When a new Google Calendar event is created, send me a WhatsApp reminder 30 minutes before',
    description: 'Never miss a meeting with WhatsApp reminders',
    apps: ['googlecalendar', 'whatsapp'],
    requiredApps: ['googlecalendar', 'whatsapp'],
  },
  {
    prompt: 'When I get an email with an attachment, save it to Google Drive and notify me on Slack',
    description: 'Auto-file email attachments to Google Drive',
    apps: ['gmail', 'googledrive', 'slack'],
    requiredApps: ['gmail', 'googledrive'],
  },
  {
    prompt: 'Create a workflow that sends me a daily summary of my Google Calendar events via email',
    description: 'Daily schedule delivered to your inbox',
    apps: ['googlecalendar', 'gmail'],
    requiredApps: ['googlecalendar', 'gmail'],
  },
]

/**
 * App-pair specific templates when we know the user has exactly these apps.
 * Keyed by sorted pair joined with '+'.
 */
const APP_PAIR_TEMPLATES: Record<string, WorkflowTemplate> = {
  'discord+github': {
    prompt: 'When a new GitHub issue is created, post a notification in my Discord server',
    description: 'Track GitHub issues in Discord',
    apps: ['github', 'discord'],
  },
  'gmail+notion': {
    prompt: 'When I get an important email, save a summary to a Notion database for reference',
    description: 'Archive important emails to Notion',
    apps: ['gmail', 'notion'],
  },
  'gmail+trello': {
    prompt: 'When I get a task-related email, create a Trello card automatically',
    description: 'Turn emails into Trello cards',
    apps: ['gmail', 'trello'],
  },
  'googlesheets+slack': {
    prompt: 'When a new row is added to my Google Sheet, send a Slack notification',
    description: 'Get Slack alerts for spreadsheet updates',
    apps: ['googlesheets', 'slack'],
  },
  'gmail+discord': {
    prompt: 'Summarize my unread emails and post a daily digest in my Discord channel',
    description: 'Email digest delivered to Discord',
    apps: ['gmail', 'discord'],
  },
  'dropbox+gmail': {
    prompt: 'When I receive an email with an attachment, automatically save it to Dropbox',
    description: 'Auto-save email attachments to Dropbox',
    apps: ['gmail', 'dropbox'],
  },
  'asana+gmail': {
    prompt: 'When I get a project email, create an Asana task and assign it to me',
    description: 'Convert emails to Asana tasks',
    apps: ['gmail', 'asana'],
  },
  'gmail+linear': {
    prompt: 'When I receive a bug report email, create a Linear issue with the details',
    description: 'Route bug reports from email to Linear',
    apps: ['gmail', 'linear'],
  },
}

// ============================================================================
// Service
// ============================================================================

const DISMISS_KEY = 'nexus_onboarding_prompt_dismissed'

export class OnboardingPromptService {
  /**
   * Generate a personalized workflow suggestion based on user profile.
   * Returns a ready-to-send prompt, or null if not enough data.
   */
  static generateSuggestion(): OnboardingSuggestion | null {
    // If user already dismissed, don't show again this session
    if (sessionStorage.getItem(DISMISS_KEY) === 'true') {
      return null
    }

    const profile = this.loadBusinessProfile()
    const connectedApps = this.getConnectedApps()
    const industry = profile?.industry?.toLowerCase() || null

    // Strategy 1: Industry + connected apps match
    if (industry) {
      const industryTemplates = INDUSTRY_TEMPLATES[industry]
      if (industryTemplates) {
        const match = this.findBestTemplate(industryTemplates, connectedApps)
        if (match) return this.templateToSuggestion(match)
      }
    }

    // Strategy 2: App-pair match from connected apps
    if (connectedApps.length >= 2) {
      const pairMatch = this.findAppPairTemplate(connectedApps)
      if (pairMatch) return this.templateToSuggestion(pairMatch)
    }

    // Strategy 3: Generic templates matched against connected apps
    {
      const match = this.findBestTemplate(GENERIC_TEMPLATES, connectedApps)
      if (match) return this.templateToSuggestion(match)
    }

    // Strategy 4: If we have a profile but no connected apps, use first industry template
    if (industry && INDUSTRY_TEMPLATES[industry]?.length) {
      const fallback = INDUSTRY_TEMPLATES[industry][INDUSTRY_TEMPLATES[industry].length - 1]
      return this.templateToSuggestion(fallback)
    }

    // Not enough data to suggest anything useful
    return null
  }

  /**
   * Mark the suggestion as dismissed so it won't show again this session.
   */
  static dismiss(): void {
    sessionStorage.setItem(DISMISS_KEY, 'true')
  }

  // ==========================================================================
  // Private helpers
  // ==========================================================================

  private static loadBusinessProfile(): {
    industry: string | null
    automationPriorities: string[]
    painPoints: string[]
    businessName: string
  } | null {
    try {
      const raw = localStorage.getItem('nexus_business_profile')
      if (!raw) return null
      const data = JSON.parse(raw)
      return {
        industry: data.industry || null,
        automationPriorities: Array.isArray(data.automationPriorities) ? data.automationPriorities : [],
        painPoints: Array.isArray(data.painPoints) ? data.painPoints : [],
        businessName: data.businessName || '',
      }
    } catch {
      return null
    }
  }

  private static getConnectedApps(): string[] {
    const apps = new Set<string>()

    // From user context
    try {
      const raw = localStorage.getItem('nexus_user_context')
      if (raw) {
        const data = JSON.parse(raw)
        if (Array.isArray(data.connectedApps)) {
          data.connectedApps.forEach((a: string) => apps.add(a.toLowerCase()))
        }
      }
    } catch { /* ignore */ }

    // From onboarding state
    try {
      const raw = localStorage.getItem('nexus_onboarding_wizard_state')
      if (raw) {
        const data = JSON.parse(raw)
        if (Array.isArray(data.connectedApps)) {
          data.connectedApps.forEach((a: string) => apps.add(a.toLowerCase()))
        }
      }
    } catch { /* ignore */ }

    // From preferred apps in memory
    try {
      const raw = localStorage.getItem('nexus_user_context')
      if (raw) {
        const data = JSON.parse(raw)
        if (Array.isArray(data.preferredApps)) {
          data.preferredApps.forEach((a: string) => apps.add(a.toLowerCase()))
        }
      }
    } catch { /* ignore */ }

    return Array.from(apps)
  }

  /**
   * Find the best template from a list, preferring ones whose requiredApps
   * overlap with the user's connected apps. Falls back to templates with
   * no requiredApps constraint.
   */
  private static findBestTemplate(
    templates: WorkflowTemplate[],
    connectedApps: string[]
  ): WorkflowTemplate | null {
    if (connectedApps.length === 0) {
      // No connected apps info - return the first template without requiredApps,
      // or the last template (most generic fallback) if all have requirements
      return templates.find(t => !t.requiredApps) || templates[templates.length - 1] || null
    }

    const connectedSet = new Set(connectedApps)

    // Best match: all requiredApps are connected
    for (const template of templates) {
      if (template.requiredApps && template.requiredApps.every(a => connectedSet.has(a))) {
        return template
      }
    }

    // Partial match: at least one requiredApp is connected
    for (const template of templates) {
      if (template.requiredApps && template.requiredApps.some(a => connectedSet.has(a))) {
        return template
      }
    }

    // No match on required - return first template without requirements
    return templates.find(t => !t.requiredApps) || null
  }

  /**
   * Check if any pair of connected apps has a specific template.
   */
  private static findAppPairTemplate(connectedApps: string[]): WorkflowTemplate | null {
    const sorted = [...connectedApps].sort()

    // Try every pair
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const pairKey = `${sorted[i]}+${sorted[j]}`
        const template = APP_PAIR_TEMPLATES[pairKey]
        if (template) return template
      }
    }

    return null
  }

  private static templateToSuggestion(template: WorkflowTemplate): OnboardingSuggestion {
    return {
      prompt: template.prompt,
      description: template.description,
      apps: template.apps,
    }
  }
}
