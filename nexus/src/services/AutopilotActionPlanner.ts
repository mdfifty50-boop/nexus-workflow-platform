/**
 * AutopilotActionPlanner - Converts workflow specs into human-readable action plans
 *
 * Takes a WorkflowSpec (from AI-generated workflow) and produces a structured
 * ActionPlan that the UI can display to the user before Autopilot execution.
 * Determines which services can be configured via API vs. requiring browser automation.
 */

import type { WorkflowSpec, AutopilotStep } from './AutopilotService'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface ActionPlan {
  steps: PlannedAction[]
  /** Total estimated duration in seconds */
  estimatedDuration: number
  /** Services that will prompt the user for credentials */
  requiresCredentials: string[]
  /** Services that can be configured entirely via Composio API (no browser needed) */
  apiResolvable: string[]
  /** Services that require Playwright browser automation */
  browserRequired: string[]
}

export interface PlannedAction {
  /** Integration key (e.g., 'gmail', 'slack') */
  service: string
  /** Human-friendly display name (e.g., 'Gmail', 'Slack') */
  serviceName: string
  /** What Autopilot will do (e.g., 'connect', 'configure') */
  action: string
  /** User-facing description of this step */
  description: string
  /** Whether this step uses API or browser automation */
  method: 'api' | 'browser'
  /** Estimated time for this step in seconds */
  estimatedTime: number
  /** Whether this step will ask the user for credentials */
  requiresCredentials: boolean
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Human-friendly display names for integration services.
 * Keys are lowercase tool identifiers matching Composio toolkit names.
 */
const SERVICE_DISPLAY_NAMES: Record<string, string> = {
  gmail: 'Gmail',
  slack: 'Slack',
  googlesheets: 'Google Sheets',
  google_sheets: 'Google Sheets',
  google_calendar: 'Google Calendar',
  googlecalendar: 'Google Calendar',
  googledrive: 'Google Drive',
  google_drive: 'Google Drive',
  dropbox: 'Dropbox',
  github: 'GitHub',
  notion: 'Notion',
  discord: 'Discord',
  trello: 'Trello',
  asana: 'Asana',
  linear: 'Linear',
  hubspot: 'HubSpot',
  stripe: 'Stripe',
  zoom: 'Zoom',
  twitter: 'Twitter / X',
  x: 'Twitter / X',
  linkedin: 'LinkedIn',
  jira: 'Jira',
  confluence: 'Confluence',
  onedrive: 'OneDrive',
  microsoft_teams: 'Microsoft Teams',
  teams: 'Microsoft Teams',
  airtable: 'Airtable',
  clickup: 'ClickUp',
  monday: 'Monday.com',
  salesforce: 'Salesforce',
  freshdesk: 'Freshdesk',
  zendesk: 'Zendesk',
  intercom: 'Intercom',
  mailchimp: 'Mailchimp',
  sendgrid: 'SendGrid',
  twilio: 'Twilio',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  shopify: 'Shopify',
  woocommerce: 'WooCommerce',
  firebase: 'Firebase',
  supabase: 'Supabase',
  deepgram: 'Deepgram',
  elevenlabs: 'ElevenLabs',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
}

/**
 * Services that can be fully configured via Composio API without needing
 * Playwright browser automation. These use standard OAuth flows that
 * Composio handles natively.
 */
const API_RESOLVABLE_SERVICES = new Set<string>([
  'gmail',
  'slack',
  'googlesheets',
  'google_sheets',
  'google_calendar',
  'googlecalendar',
  'googledrive',
  'google_drive',
  'discord',
  'github',
  'notion',
  'trello',
  'asana',
  'linear',
  'dropbox',
  'onedrive',
  'hubspot',
  'stripe',
  'airtable',
  'clickup',
  'jira',
  'zoom',
  'twilio',
  'sendgrid',
  'mailchimp',
])

/** Estimated seconds for an API-based configuration step */
const API_STEP_DURATION = 30

/** Estimated seconds for a browser-automation configuration step */
const BROWSER_STEP_DURATION = 90

// =============================================================================
// SERVICE IMPLEMENTATION
// =============================================================================

class AutopilotActionPlanner {
  /**
   * Convert a WorkflowSpec into a user-presentable ActionPlan.
   *
   * For each step in the workflow:
   * - Trigger steps become "Connect your [Service]" actions
   * - Action steps become "Configure [Service] to [action description]" actions
   * - Method (api vs browser) is determined by API_RESOLVABLE_SERVICES membership
   */
  planActions(workflowSpec: WorkflowSpec): ActionPlan {
    const steps: PlannedAction[] = []
    const credentialServices: Set<string> = new Set()
    const apiServices: Set<string> = new Set()
    const browserServices: Set<string> = new Set()

    for (const step of workflowSpec.steps) {
      const service = step.tool.toLowerCase()
      const serviceName = this.getServiceDisplayName(service)
      const method = this.resolveMethod(service)
      const isTrigger = step.type === 'trigger'

      // Determine the action description
      let action: string
      let description: string

      if (isTrigger) {
        action = 'connect'
        description = `Connect your ${serviceName} account`
      } else {
        action = 'configure'
        description = `Configure ${serviceName} to ${this.describeAction(step.name, serviceName)}`
      }

      const estimatedTime = method === 'api' ? API_STEP_DURATION : BROWSER_STEP_DURATION

      steps.push({
        service,
        serviceName,
        action,
        description,
        method,
        estimatedTime,
        requiresCredentials: true, // All integrations need OAuth credentials
      })

      // Track categorization
      credentialServices.add(service)
      if (method === 'api') {
        apiServices.add(service)
      } else {
        browserServices.add(service)
      }
    }

    const estimatedDuration = steps.reduce((sum, s) => sum + s.estimatedTime, 0)

    return {
      steps,
      estimatedDuration,
      requiresCredentials: Array.from(credentialServices),
      apiResolvable: Array.from(apiServices),
      browserRequired: Array.from(browserServices),
    }
  }

  /**
   * Convert an AutopilotStep array into PlannedAction array (for re-planning).
   * Useful when displaying step info from an existing session.
   */
  stepsToActions(autopilotSteps: AutopilotStep[]): PlannedAction[] {
    return autopilotSteps.map((step) => ({
      service: step.service,
      serviceName: this.getServiceDisplayName(step.service),
      action: step.action,
      description: step.description,
      method: step.method,
      estimatedTime: step.method === 'api' ? API_STEP_DURATION : BROWSER_STEP_DURATION,
      requiresCredentials: step.status === 'credential_wait' || step.status === 'pending',
    }))
  }

  /**
   * Get the human-friendly display name for a service.
   * Falls back to capitalizing the first letter if not in the map.
   */
  getServiceDisplayName(service: string): string {
    const normalized = service.toLowerCase()
    if (SERVICE_DISPLAY_NAMES[normalized]) {
      return SERVICE_DISPLAY_NAMES[normalized]
    }
    // Fallback: capitalize first letter of each word
    return normalized
      .split(/[_-]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  /**
   * Determine whether a service should use API or browser method.
   */
  private resolveMethod(service: string): 'api' | 'browser' {
    return API_RESOLVABLE_SERVICES.has(service.toLowerCase()) ? 'api' : 'browser'
  }

  /**
   * Extract a human-readable action description from a step name.
   * Strips common prefixes like "Action:", "Trigger:", etc.
   */
  private describeAction(stepName: string, _serviceName: string): string {
    // Remove common prefixes
    let cleaned = stepName
      .replace(/^(Action|Trigger|Step):\s*/i, '')
      .replace(/^(Send|Create|Update|Delete|Get|List|Upload|Download)\s+/i, (match) =>
        match.toLowerCase()
      )
      .trim()

    // If the description already starts with a verb, return as-is
    if (/^[a-z]/.test(cleaned)) {
      return cleaned
    }

    // Default: lowercase the cleaned name
    return cleaned.toLowerCase() || `perform the configured action`
  }

  /**
   * Estimate total duration for a workflow spec without building a full plan.
   */
  estimateDuration(workflowSpec: WorkflowSpec): number {
    return workflowSpec.steps.reduce((sum, step) => {
      const method = this.resolveMethod(step.tool)
      return sum + (method === 'api' ? API_STEP_DURATION : BROWSER_STEP_DURATION)
    }, 0)
  }

  /**
   * Format a duration in seconds into a human-readable string.
   */
  formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds} seconds`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (remainingSeconds === 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`
    }
    return `${minutes}m ${remainingSeconds}s`
  }
}

// Export singleton instance
export const autopilotActionPlanner = new AutopilotActionPlanner()
