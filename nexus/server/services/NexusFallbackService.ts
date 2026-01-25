/**
 * Nexus Fallback Service
 *
 * Provides fallback alternatives when users don't have accounts for required services.
 * Instead of blocking workflow execution, we offer alternative paths to achieve the same goal.
 *
 * Example: User wants to send Slack notifications but doesn't have Slack
 * → Fallback to email, webhook, or in-app notifications
 *
 * CEO Vision: "Nexus should make business life surprisingly easy"
 * - Never block users with "you need X account"
 * - Always offer alternatives that work with what they have
 * - Make fallbacks feel natural, not like compromises
 */

export interface Alternative {
  toolkit: string
  name: string
  description: string
  requiresAuth: boolean
  confidence: number // 0-1: How well this replaces the original (1 = perfect replacement)
}

export interface FallbackConfig {
  originalToolkit: string
  fallbackToolkit: string
  toolMapping: Record<string, string> // Maps original tool to fallback tool
  transformations: Array<{
    field: string
    transform: (value: any) => any
  }>
}

/**
 * Fallback alternatives mapping
 * Each toolkit maps to ordered array of alternatives (best first)
 */
const FALLBACK_MAP: Record<string, Alternative[]> = {
  // Communication & Collaboration
  slack: [
    {
      toolkit: 'email',
      name: 'Email',
      description: 'Send via email instead of Slack channel',
      requiresAuth: true,
      confidence: 0.85
    },
    {
      toolkit: 'webhook',
      name: 'Webhook',
      description: 'POST to webhook endpoint for custom integrations',
      requiresAuth: false,
      confidence: 0.7
    },
    {
      toolkit: 'nexus-notification',
      name: 'In-App Notification',
      description: 'Notify within Nexus dashboard',
      requiresAuth: false,
      confidence: 0.6
    }
  ],

  discord: [
    {
      toolkit: 'slack',
      name: 'Slack',
      description: 'Use Slack instead of Discord',
      requiresAuth: true,
      confidence: 0.9
    },
    {
      toolkit: 'email',
      name: 'Email',
      description: 'Send via email instead of Discord',
      requiresAuth: true,
      confidence: 0.8
    },
    {
      toolkit: 'webhook',
      name: 'Webhook',
      description: 'POST to webhook endpoint',
      requiresAuth: false,
      confidence: 0.7
    }
  ],

  zoom: [
    {
      toolkit: 'google-meet',
      name: 'Google Meet',
      description: 'Use Google Meet instead of Zoom',
      requiresAuth: true,
      confidence: 0.95
    },
    {
      toolkit: 'microsoft-teams',
      name: 'Microsoft Teams',
      description: 'Use Teams instead of Zoom',
      requiresAuth: true,
      confidence: 0.9
    },
    {
      toolkit: 'google-calendar',
      name: 'Google Calendar Event',
      description: 'Create calendar event with meeting link',
      requiresAuth: true,
      confidence: 0.6
    }
  ],

  // Project Management
  notion: [
    {
      toolkit: 'google-sheets',
      name: 'Google Sheets',
      description: 'Store data in spreadsheet instead of Notion database',
      requiresAuth: true,
      confidence: 0.7
    },
    {
      toolkit: 'airtable',
      name: 'Airtable',
      description: 'Use Airtable instead of Notion',
      requiresAuth: true,
      confidence: 0.85
    },
    {
      toolkit: 'email',
      name: 'Email Summary',
      description: 'Send structured data via email',
      requiresAuth: true,
      confidence: 0.5
    }
  ],

  trello: [
    {
      toolkit: 'asana',
      name: 'Asana',
      description: 'Use Asana instead of Trello',
      requiresAuth: true,
      confidence: 0.9
    },
    {
      toolkit: 'notion',
      name: 'Notion',
      description: 'Use Notion database instead of Trello board',
      requiresAuth: true,
      confidence: 0.8
    },
    {
      toolkit: 'google-sheets',
      name: 'Google Sheets',
      description: 'Track tasks in spreadsheet',
      requiresAuth: true,
      confidence: 0.6
    },
    {
      toolkit: 'email',
      name: 'Email Task List',
      description: 'Send task list via email',
      requiresAuth: true,
      confidence: 0.4
    }
  ],

  asana: [
    {
      toolkit: 'trello',
      name: 'Trello',
      description: 'Use Trello instead of Asana',
      requiresAuth: true,
      confidence: 0.9
    },
    {
      toolkit: 'linear',
      name: 'Linear',
      description: 'Use Linear instead of Asana',
      requiresAuth: true,
      confidence: 0.85
    },
    {
      toolkit: 'notion',
      name: 'Notion',
      description: 'Use Notion database instead of Asana',
      requiresAuth: true,
      confidence: 0.8
    }
  ],

  linear: [
    {
      toolkit: 'asana',
      name: 'Asana',
      description: 'Use Asana instead of Linear',
      requiresAuth: true,
      confidence: 0.85
    },
    {
      toolkit: 'github',
      name: 'GitHub Issues',
      description: 'Use GitHub Issues instead of Linear',
      requiresAuth: true,
      confidence: 0.8
    },
    {
      toolkit: 'trello',
      name: 'Trello',
      description: 'Use Trello instead of Linear',
      requiresAuth: true,
      confidence: 0.75
    }
  ],

  // Storage & Files
  'google-drive': [
    {
      toolkit: 'dropbox',
      name: 'Dropbox',
      description: 'Use Dropbox instead of Google Drive',
      requiresAuth: true,
      confidence: 0.95
    },
    {
      toolkit: 'onedrive',
      name: 'OneDrive',
      description: 'Use OneDrive instead of Google Drive',
      requiresAuth: true,
      confidence: 0.9
    },
    {
      toolkit: 'email',
      name: 'Email Attachment',
      description: 'Send file via email attachment',
      requiresAuth: true,
      confidence: 0.6
    }
  ],

  dropbox: [
    {
      toolkit: 'google-drive',
      name: 'Google Drive',
      description: 'Use Google Drive instead of Dropbox',
      requiresAuth: true,
      confidence: 0.95
    },
    {
      toolkit: 'onedrive',
      name: 'OneDrive',
      description: 'Use OneDrive instead of Dropbox',
      requiresAuth: true,
      confidence: 0.9
    }
  ],

  onedrive: [
    {
      toolkit: 'google-drive',
      name: 'Google Drive',
      description: 'Use Google Drive instead of OneDrive',
      requiresAuth: true,
      confidence: 0.95
    },
    {
      toolkit: 'dropbox',
      name: 'Dropbox',
      description: 'Use Dropbox instead of OneDrive',
      requiresAuth: true,
      confidence: 0.9
    }
  ],

  // CRM & Sales
  hubspot: [
    {
      toolkit: 'salesforce',
      name: 'Salesforce',
      description: 'Use Salesforce instead of HubSpot',
      requiresAuth: true,
      confidence: 0.9
    },
    {
      toolkit: 'google-sheets',
      name: 'Google Sheets CRM',
      description: 'Track contacts in spreadsheet',
      requiresAuth: true,
      confidence: 0.6
    },
    {
      toolkit: 'email',
      name: 'Email',
      description: 'Send contact info via email',
      requiresAuth: true,
      confidence: 0.5
    }
  ],

  salesforce: [
    {
      toolkit: 'hubspot',
      name: 'HubSpot',
      description: 'Use HubSpot instead of Salesforce',
      requiresAuth: true,
      confidence: 0.9
    },
    {
      toolkit: 'google-sheets',
      name: 'Google Sheets CRM',
      description: 'Track contacts in spreadsheet',
      requiresAuth: true,
      confidence: 0.6
    }
  ],

  // Developer Tools
  github: [
    {
      toolkit: 'gitlab',
      name: 'GitLab',
      description: 'Use GitLab instead of GitHub',
      requiresAuth: true,
      confidence: 0.95
    },
    {
      toolkit: 'bitbucket',
      name: 'Bitbucket',
      description: 'Use Bitbucket instead of GitHub',
      requiresAuth: true,
      confidence: 0.9
    },
    {
      toolkit: 'email',
      name: 'Email Notification',
      description: 'Send code updates via email',
      requiresAuth: true,
      confidence: 0.4
    }
  ],

  gitlab: [
    {
      toolkit: 'github',
      name: 'GitHub',
      description: 'Use GitHub instead of GitLab',
      requiresAuth: true,
      confidence: 0.95
    },
    {
      toolkit: 'bitbucket',
      name: 'Bitbucket',
      description: 'Use Bitbucket instead of GitLab',
      requiresAuth: true,
      confidence: 0.9
    }
  ],

  // Productivity & Scheduling
  'google-calendar': [
    {
      toolkit: 'microsoft-outlook',
      name: 'Outlook Calendar',
      description: 'Use Outlook Calendar instead of Google Calendar',
      requiresAuth: true,
      confidence: 0.95
    },
    {
      toolkit: 'email',
      name: 'Email Invite',
      description: 'Send calendar invite via email',
      requiresAuth: true,
      confidence: 0.6
    }
  ],

  'microsoft-outlook': [
    {
      toolkit: 'google-calendar',
      name: 'Google Calendar',
      description: 'Use Google Calendar instead of Outlook',
      requiresAuth: true,
      confidence: 0.95
    },
    {
      toolkit: 'email',
      name: 'Email Invite',
      description: 'Send calendar invite via email',
      requiresAuth: true,
      confidence: 0.6
    }
  ],

  // Payments & Finance
  stripe: [
    {
      toolkit: 'paypal',
      name: 'PayPal',
      description: 'Use PayPal instead of Stripe',
      requiresAuth: true,
      confidence: 0.8
    },
    {
      toolkit: 'knet',
      name: 'KNET',
      description: 'Use KNET payment gateway (Kuwait)',
      requiresAuth: true,
      confidence: 0.9 // High confidence for Kuwait market
    },
    {
      toolkit: 'email',
      name: 'Email Invoice',
      description: 'Send payment request via email',
      requiresAuth: true,
      confidence: 0.5
    }
  ],

  paypal: [
    {
      toolkit: 'stripe',
      name: 'Stripe',
      description: 'Use Stripe instead of PayPal',
      requiresAuth: true,
      confidence: 0.8
    },
    {
      toolkit: 'email',
      name: 'Email Invoice',
      description: 'Send payment request via email',
      requiresAuth: true,
      confidence: 0.5
    }
  ],

  // Social Media
  twitter: [
    {
      toolkit: 'linkedin',
      name: 'LinkedIn',
      description: 'Post to LinkedIn instead of Twitter',
      requiresAuth: true,
      confidence: 0.7
    },
    {
      toolkit: 'facebook',
      name: 'Facebook',
      description: 'Post to Facebook instead of Twitter',
      requiresAuth: true,
      confidence: 0.65
    },
    {
      toolkit: 'email',
      name: 'Email Newsletter',
      description: 'Send content via email',
      requiresAuth: true,
      confidence: 0.5
    }
  ],

  linkedin: [
    {
      toolkit: 'twitter',
      name: 'Twitter/X',
      description: 'Post to Twitter instead of LinkedIn',
      requiresAuth: true,
      confidence: 0.7
    },
    {
      toolkit: 'email',
      name: 'Email',
      description: 'Send content via email',
      requiresAuth: true,
      confidence: 0.5
    }
  ]
}

/**
 * Tool mapping configurations for common fallback scenarios
 * Defines how to map actions from one toolkit to another
 */
const TOOL_MAPPINGS: Record<string, Record<string, string>> = {
  // Slack → Email
  'slack→email': {
    'slack_send_message': 'gmail_send_email',
    'slack_create_channel': 'gmail_create_label',
    'slack_add_reaction': 'gmail_add_star'
  },

  // Discord → Slack
  'discord→slack': {
    'discord_send_message': 'slack_send_message',
    'discord_create_channel': 'slack_create_channel',
    'discord_add_reaction': 'slack_add_reaction'
  },

  // Notion → Google Sheets
  'notion→google-sheets': {
    'notion_create_page': 'sheets_append_row',
    'notion_update_page': 'sheets_update_row',
    'notion_query_database': 'sheets_read_range',
    'notion_search': 'sheets_find_row'
  },

  // Trello → Asana
  'trello→asana': {
    'trello_create_card': 'asana_create_task',
    'trello_move_card': 'asana_move_task',
    'trello_add_comment': 'asana_add_comment',
    'trello_add_label': 'asana_add_tag'
  },

  // Google Drive → Dropbox
  'google-drive→dropbox': {
    'drive_upload_file': 'dropbox_upload_file',
    'drive_create_folder': 'dropbox_create_folder',
    'drive_share_file': 'dropbox_share_file',
    'drive_search_files': 'dropbox_search_files'
  },

  // GitHub → GitLab
  'github→gitlab': {
    'github_create_issue': 'gitlab_create_issue',
    'github_create_pr': 'gitlab_create_merge_request',
    'github_add_comment': 'gitlab_add_comment',
    'github_close_issue': 'gitlab_close_issue'
  },

  // Stripe → PayPal
  'stripe→paypal': {
    'stripe_create_payment': 'paypal_create_payment',
    'stripe_create_invoice': 'paypal_create_invoice',
    'stripe_get_balance': 'paypal_get_balance'
  }
}

class NexusFallbackService {
  /**
   * Get suggested alternatives for a missing toolkit
   * Returns ordered list (best alternatives first)
   */
  getSuggestedAlternatives(missingToolkit: string): Alternative[] {
    const alternatives = FALLBACK_MAP[missingToolkit.toLowerCase()]
    if (!alternatives) {
      // Return generic fallbacks if no specific alternatives defined
      return [
        {
          toolkit: 'email',
          name: 'Email',
          description: 'Send data via email as fallback',
          requiresAuth: true,
          confidence: 0.5
        },
        {
          toolkit: 'webhook',
          name: 'Webhook',
          description: 'POST data to webhook endpoint',
          requiresAuth: false,
          confidence: 0.4
        },
        {
          toolkit: 'nexus-notification',
          name: 'In-App Notification',
          description: 'Notify within Nexus dashboard',
          requiresAuth: false,
          confidence: 0.3
        }
      ]
    }
    return alternatives
  }

  /**
   * Check if we have fallback options for a toolkit
   */
  canFallback(toolkit: string): boolean {
    return toolkit.toLowerCase() in FALLBACK_MAP || true // Generic fallbacks always available
  }

  /**
   * Get fallback configuration for executing with alternative toolkit
   */
  getFallbackConfig(originalToolkit: string, selectedFallback: string): FallbackConfig {
    const mappingKey = `${originalToolkit.toLowerCase()}→${selectedFallback.toLowerCase()}`
    const toolMapping = TOOL_MAPPINGS[mappingKey] || {}

    // Define transformations based on fallback type
    const transformations = this.getTransformations(originalToolkit, selectedFallback)

    return {
      originalToolkit,
      fallbackToolkit: selectedFallback,
      toolMapping,
      transformations
    }
  }

  /**
   * Get data transformations needed for fallback
   * Example: Slack channel → Email subject line
   */
  private getTransformations(originalToolkit: string, fallbackToolkit: string): Array<{
    field: string
    transform: (value: any) => any
  }> {
    const key = `${originalToolkit.toLowerCase()}→${fallbackToolkit.toLowerCase()}`

    const transformationMap: Record<string, Array<{ field: string; transform: (value: any) => any }>> = {
      // Slack → Email transformations
      'slack→email': [
        {
          field: 'channel',
          transform: (channel: string) => `[Slack: ${channel}]` // Add context in subject
        },
        {
          field: 'message',
          transform: (message: string) => message // Keep message as-is
        }
      ],

      // Notion → Google Sheets transformations
      'notion→google-sheets': [
        {
          field: 'properties',
          transform: (properties: Record<string, any>) => {
            // Convert Notion properties object to flat array for spreadsheet row
            return Object.values(properties).map(prop => {
              if (typeof prop === 'object' && prop.value !== undefined) {
                return prop.value
              }
              return prop
            })
          }
        }
      ],

      // Trello → Asana transformations
      'trello→asana': [
        {
          field: 'list',
          transform: (list: string) => ({ section: list }) // Trello list → Asana section
        },
        {
          field: 'labels',
          transform: (labels: string[]) => labels.map(l => ({ tag: l })) // Trello labels → Asana tags
        }
      ]
    }

    return transformationMap[key] || []
  }

  /**
   * Get confidence score for a fallback option
   * Returns 0-1 score indicating how well the fallback replaces original
   */
  getConfidence(originalToolkit: string, fallbackToolkit: string): number {
    const alternatives = this.getSuggestedAlternatives(originalToolkit)
    const match = alternatives.find(alt => alt.toolkit.toLowerCase() === fallbackToolkit.toLowerCase())
    return match?.confidence || 0.3 // Default low confidence if not in predefined list
  }

  /**
   * Get all toolkits that can serve as fallbacks
   * Returns unique list of all fallback options across all toolkits
   */
  getAllFallbackToolkits(): string[] {
    const toolkits = new Set<string>()
    Object.values(FALLBACK_MAP).forEach(alternatives => {
      alternatives.forEach(alt => toolkits.add(alt.toolkit))
    })
    return Array.from(toolkits).sort()
  }

  /**
   * Check if a fallback requires authentication
   */
  requiresAuth(fallbackToolkit: string): boolean {
    // Email and webhooks require auth, in-app notifications don't
    const noAuthToolkits = ['webhook', 'nexus-notification']
    return !noAuthToolkits.includes(fallbackToolkit.toLowerCase())
  }
}

// Export singleton instance
export const nexusFallbackService = new NexusFallbackService()
export default nexusFallbackService
