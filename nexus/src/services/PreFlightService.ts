/**
 * PreFlightService.ts
 *
 * Pre-flight check system that validates ALL required parameters
 * BEFORE execution. Eliminates crash-and-retry loops.
 *
 * Architecture:
 * 1. Scan all workflow nodes
 * 2. Get required params for each tool
 * 3. Check what's already collected
 * 4. Return ordered list of missing params
 * 5. Block execution until list is empty
 *
 * @NEXUS-FIX-033: Pre-flight validation system - DO NOT REMOVE
 * @NEXUS-FIX-074: Backend pre-flight with dynamic schema fetching - DO NOT REMOVE
 *
 * FIX-074 ENHANCEMENT:
 * This service now calls the backend /api/preflight/check endpoint which:
 * - Fetches REAL schemas from Composio SDK (500+ integrations)
 * - Falls back to enhanced local schemas if backend unavailable
 * - Covers integrations like ClickUp, Monday, Jira, HubSpot, Airtable, etc.
 */

import { ParameterResolutionService } from './ParameterResolutionService';

export interface PreFlightQuestion {
  id: string;
  nodeId: string;
  nodeName: string;
  integration: string;
  paramName: string;
  displayName: string;
  prompt: string;
  quickActions: Array<{ label: string; value: string }>;
  inputType: 'text' | 'phone' | 'email' | 'url' | 'select' | 'textarea';
  placeholder: string;
  validators?: Array<(value: string) => boolean>;
  required: boolean;
}

export interface PreFlightResult {
  ready: boolean;
  questions: PreFlightQuestion[];
  connections: Array<{
    toolkit: string;
    connected: boolean;
    authUrl?: string;
  }>;
  summary: {
    totalQuestions: number;
    answeredQuestions: number;
    totalConnections: number;
    connectedCount: number;
  };
}

export interface WorkflowNode {
  id: string;
  name: string;
  type: 'trigger' | 'action';
  tool?: string;
  integration?: string;
  params?: Record<string, unknown>;
}

/**
 * Tool-specific required parameters
 * This is the SINGLE SOURCE OF TRUTH for what each tool needs
 */
const TOOL_REQUIREMENTS: Record<string, {
  requiredParams: string[];
  optionalParams?: string[];
  paramConfig: Record<string, {
    displayName: string;
    prompt: string;
    inputType: 'text' | 'phone' | 'email' | 'url' | 'select' | 'textarea';
    placeholder: string;
    quickActions?: Array<{ label: string; value: string }>;
  }>;
}> = {
  // WhatsApp
  whatsapp: {
    requiredParams: ['to', 'message'],
    paramConfig: {
      to: {
        displayName: 'Phone Number',
        prompt: 'What phone number should receive the WhatsApp message?',
        inputType: 'phone',
        placeholder: '+965 xxxx xxxx',
        quickActions: [
          { label: 'My Phone', value: '{{user_phone}}' }
        ]
      },
      message: {
        displayName: 'Message',
        prompt: 'What message should I send?',
        inputType: 'textarea',
        placeholder: 'Type your message here...',
        quickActions: [
          { label: 'Use Email Content', value: '{{trigger.subject}}: {{trigger.body}}' }
        ]
      }
    }
  },

  // Gmail / Email
  gmail: {
    requiredParams: ['to', 'subject', 'body'],
    paramConfig: {
      to: {
        displayName: 'Recipient',
        prompt: 'Who should receive this email?',
        inputType: 'email',
        placeholder: 'email@example.com',
        quickActions: [
          { label: 'Send to Myself', value: '{{user_email}}' }
        ]
      },
      subject: {
        displayName: 'Subject',
        prompt: 'What should the subject line say?',
        inputType: 'text',
        placeholder: 'Enter subject...'
      },
      body: {
        displayName: 'Email Body',
        prompt: 'What should the email say?',
        inputType: 'textarea',
        placeholder: 'Type your email content...'
      }
    }
  },

  // Slack
  slack: {
    requiredParams: ['channel', 'text'],
    paramConfig: {
      channel: {
        displayName: 'Channel',
        prompt: 'Which Slack channel should I post to?',
        inputType: 'text',
        placeholder: '#general',
        quickActions: [
          { label: '#general', value: 'general' },
          { label: '#team', value: 'team' },
          { label: '#alerts', value: 'alerts' }
        ]
      },
      text: {
        displayName: 'Message',
        prompt: 'What message should I post?',
        inputType: 'textarea',
        placeholder: 'Type your message...'
      }
    }
  },

  // Google Sheets
  googlesheets: {
    requiredParams: ['spreadsheet_id'],
    optionalParams: ['sheet_name', 'range'],
    paramConfig: {
      spreadsheet_id: {
        displayName: 'Spreadsheet',
        prompt: 'Which Google Sheet should I use?',
        inputType: 'url',
        placeholder: 'Paste Google Sheets URL or ID...',
        quickActions: [
          { label: 'Create New Sheet', value: '{{create_new}}' }
        ]
      },
      sheet_name: {
        displayName: 'Sheet Tab',
        prompt: 'Which tab in the spreadsheet?',
        inputType: 'text',
        placeholder: 'Sheet1',
        quickActions: [
          { label: 'First Sheet', value: 'Sheet1' }
        ]
      },
      range: {
        displayName: 'Cell Range',
        prompt: 'Which cells should I use?',
        inputType: 'text',
        placeholder: 'A1:D10'
      }
    }
  },

  // Dropbox
  dropbox: {
    requiredParams: ['path'],
    paramConfig: {
      path: {
        displayName: 'Folder Path',
        prompt: 'Which Dropbox folder should I use?',
        inputType: 'text',
        placeholder: '/Documents/Nexus',
        quickActions: [
          { label: 'Root Folder', value: '/' },
          { label: 'Documents', value: '/Documents' }
        ]
      }
    }
  },

  // OneDrive
  onedrive: {
    requiredParams: ['path'],
    paramConfig: {
      path: {
        displayName: 'Folder Path',
        prompt: 'Which OneDrive folder should I use?',
        inputType: 'text',
        placeholder: '/Documents/Nexus',
        quickActions: [
          { label: 'Root Folder', value: '/' },
          { label: 'Documents', value: '/Documents' }
        ]
      }
    }
  },

  // Notion
  notion: {
    requiredParams: ['page_id'],
    optionalParams: ['title', 'content'],
    paramConfig: {
      page_id: {
        displayName: 'Page',
        prompt: 'Which Notion page should I use?',
        inputType: 'url',
        placeholder: 'Paste Notion page URL...'
      },
      title: {
        displayName: 'Title',
        prompt: 'What should the title be?',
        inputType: 'text',
        placeholder: 'Enter title...'
      },
      content: {
        displayName: 'Content',
        prompt: 'What content should I add?',
        inputType: 'textarea',
        placeholder: 'Type content...'
      }
    }
  },

  // Discord
  discord: {
    requiredParams: ['channel_id', 'content'],
    paramConfig: {
      channel_id: {
        displayName: 'Channel',
        prompt: 'Which Discord channel?',
        inputType: 'text',
        placeholder: 'Channel name or ID'
      },
      content: {
        displayName: 'Message',
        prompt: 'What message should I send?',
        inputType: 'textarea',
        placeholder: 'Type your message...'
      }
    }
  },

  // GitHub
  github: {
    requiredParams: ['owner', 'repo'],
    optionalParams: ['title', 'body'],
    paramConfig: {
      owner: {
        displayName: 'Repository Owner',
        prompt: 'What is the GitHub username or organization?',
        inputType: 'text',
        placeholder: 'username or org-name'
      },
      repo: {
        displayName: 'Repository',
        prompt: 'Which repository?',
        inputType: 'text',
        placeholder: 'repository-name'
      },
      title: {
        displayName: 'Title',
        prompt: 'What should the title be?',
        inputType: 'text',
        placeholder: 'Enter title...'
      },
      body: {
        displayName: 'Description',
        prompt: 'What should the description say?',
        inputType: 'textarea',
        placeholder: 'Enter description...'
      }
    }
  },

  // Trello
  trello: {
    requiredParams: ['board_id', 'list_id'],
    optionalParams: ['name', 'desc'],
    paramConfig: {
      board_id: {
        displayName: 'Board',
        prompt: 'Which Trello board?',
        inputType: 'text',
        placeholder: 'Board name or URL'
      },
      list_id: {
        displayName: 'List',
        prompt: 'Which list on the board?',
        inputType: 'text',
        placeholder: 'List name'
      },
      name: {
        displayName: 'Card Name',
        prompt: 'What should the card be called?',
        inputType: 'text',
        placeholder: 'Card name...'
      },
      desc: {
        displayName: 'Description',
        prompt: 'What description should the card have?',
        inputType: 'textarea',
        placeholder: 'Card description...'
      }
    }
  },

  // Asana
  // @NEXUS-FIX-118: Aligned with validateRequiredParams — workspace + name required, not project_id
  asana: {
    requiredParams: ['workspace', 'name'],
    optionalParams: ['notes', 'project_id'],
    paramConfig: {
      workspace: {
        displayName: 'Workspace',
        prompt: 'Which Asana workspace should I use?',
        inputType: 'text',
        placeholder: 'Workspace name or ID',
        quickActions: [
          { label: 'Default Workspace', value: '{{default_workspace}}' }
        ]
      },
      name: {
        displayName: 'Task Name',
        prompt: 'What should the task be called?',
        inputType: 'text',
        placeholder: 'Task name...'
      },
      notes: {
        displayName: 'Notes',
        prompt: 'Any notes for this task?',
        inputType: 'textarea',
        placeholder: 'Task notes...'
      }
    }
  },

  // Twitter/X
  twitter: {
    requiredParams: ['text'],
    paramConfig: {
      text: {
        displayName: 'Tweet',
        prompt: 'What should I tweet?',
        inputType: 'textarea',
        placeholder: 'Type your tweet (280 chars max)...'
      }
    }
  },

  // @NEXUS-FIX-075: ClickUp - Missing from original list causing execution failures - DO NOT REMOVE
  clickup: {
    requiredParams: ['list_id', 'name'],
    paramConfig: {
      list_id: {
        displayName: 'ClickUp List',
        prompt: 'Which ClickUp list should I create the task in?',
        inputType: 'text',
        placeholder: 'List name or ID',
        quickActions: [
          { label: 'Inbox', value: 'Inbox' },
          { label: 'To Do', value: 'To Do' }
        ]
      },
      name: {
        displayName: 'Task Name',
        prompt: 'What should the task be called?',
        inputType: 'text',
        placeholder: 'Enter task name...'
      }
    }
  },

  // Jira
  jira: {
    requiredParams: ['project_key', 'summary'],
    optionalParams: ['issue_type', 'description'],
    paramConfig: {
      project_key: {
        displayName: 'Project',
        prompt: 'Which Jira project?',
        inputType: 'text',
        placeholder: 'Project key (e.g., PROJ)'
      },
      summary: {
        displayName: 'Issue Title',
        prompt: 'What should the issue be called?',
        inputType: 'text',
        placeholder: 'Enter issue summary...'
      },
      issue_type: {
        displayName: 'Issue Type',
        prompt: 'What type of issue?',
        inputType: 'text',
        placeholder: 'Bug, Task, Story...',
        quickActions: [
          { label: 'Task', value: 'Task' },
          { label: 'Bug', value: 'Bug' },
          { label: 'Story', value: 'Story' }
        ]
      },
      description: {
        displayName: 'Description',
        prompt: 'Any additional details?',
        inputType: 'textarea',
        placeholder: 'Issue description...'
      }
    }
  },

  // Linear
  linear: {
    requiredParams: ['team_id', 'title'],
    optionalParams: ['description'],
    paramConfig: {
      team_id: {
        displayName: 'Team',
        prompt: 'Which Linear team?',
        inputType: 'text',
        placeholder: 'Team name or ID'
      },
      title: {
        displayName: 'Issue Title',
        prompt: 'What should the issue be called?',
        inputType: 'text',
        placeholder: 'Enter issue title...'
      },
      description: {
        displayName: 'Description',
        prompt: 'Any additional details?',
        inputType: 'textarea',
        placeholder: 'Issue description...'
      }
    }
  },

  // Monday.com
  monday: {
    requiredParams: ['board_id', 'item_name'],
    paramConfig: {
      board_id: {
        displayName: 'Board',
        prompt: 'Which Monday.com board?',
        inputType: 'text',
        placeholder: 'Board name or ID'
      },
      item_name: {
        displayName: 'Item Name',
        prompt: 'What should the item be called?',
        inputType: 'text',
        placeholder: 'Enter item name...'
      }
    }
  },

  // HubSpot
  hubspot: {
    requiredParams: ['email'],
    optionalParams: ['firstname', 'lastname', 'company'],
    paramConfig: {
      email: {
        displayName: 'Email',
        prompt: 'What is the contact\'s email?',
        inputType: 'email',
        placeholder: 'contact@example.com'
      },
      firstname: {
        displayName: 'First Name',
        prompt: 'Contact\'s first name?',
        inputType: 'text',
        placeholder: 'First name...'
      },
      lastname: {
        displayName: 'Last Name',
        prompt: 'Contact\'s last name?',
        inputType: 'text',
        placeholder: 'Last name...'
      },
      company: {
        displayName: 'Company',
        prompt: 'What company do they work for?',
        inputType: 'text',
        placeholder: 'Company name...'
      }
    }
  },

  // Airtable
  airtable: {
    requiredParams: ['base_id', 'table_name'],
    paramConfig: {
      base_id: {
        displayName: 'Base',
        prompt: 'Which Airtable base?',
        inputType: 'text',
        placeholder: 'Base name or ID'
      },
      table_name: {
        displayName: 'Table',
        prompt: 'Which table in the base?',
        inputType: 'text',
        placeholder: 'Table name...'
      }
    }
  },

  // @NEXUS-FIX-118: Missing integrations that caused execution failures - DO NOT REMOVE
  // These were in validateRequiredParams() (execution-level) but missing from pre-flight,
  // causing params to be missed during Quick Setup and then failing at execution time.

  // Zoom
  zoom: {
    requiredParams: ['topic'],
    optionalParams: ['duration', 'start_time'],
    paramConfig: {
      topic: {
        displayName: 'Meeting Topic',
        prompt: 'What should the meeting be called?',
        inputType: 'text',
        placeholder: 'Enter meeting topic...',
        quickActions: [
          { label: 'Quick Sync', value: 'Quick Sync' },
          { label: 'Team Meeting', value: 'Team Meeting' }
        ]
      }
    }
  },

  // Google Calendar
  googlecalendar: {
    requiredParams: ['summary'],
    optionalParams: ['start_datetime', 'end_datetime', 'description', 'attendees'],
    paramConfig: {
      summary: {
        displayName: 'Event Name',
        prompt: 'What should the calendar event be called?',
        inputType: 'text',
        placeholder: 'Enter event name...',
        quickActions: [
          { label: 'Meeting', value: 'Meeting' },
          { label: 'Follow-up', value: 'Follow-up' }
        ]
      }
    }
  },

  // Microsoft Teams
  teams: {
    requiredParams: ['channel_id', 'message'],
    paramConfig: {
      channel_id: {
        displayName: 'Channel',
        prompt: 'Which Teams channel?',
        inputType: 'text',
        placeholder: 'Channel name or ID'
      },
      message: {
        displayName: 'Message',
        prompt: 'What message should I send?',
        inputType: 'textarea',
        placeholder: 'Type your message...'
      }
    }
  },

  // SendGrid
  sendgrid: {
    requiredParams: ['to', 'subject'],
    optionalParams: ['body'],
    paramConfig: {
      to: {
        displayName: 'Recipient',
        prompt: 'Who should receive this email?',
        inputType: 'email',
        placeholder: 'email@example.com',
        quickActions: [
          { label: 'Send to Myself', value: '{{user_email}}' }
        ]
      },
      subject: {
        displayName: 'Subject',
        prompt: 'What should the subject line say?',
        inputType: 'text',
        placeholder: 'Enter subject...'
      }
    }
  },

  // Salesforce
  salesforce: {
    requiredParams: ['object_type'],
    paramConfig: {
      object_type: {
        displayName: 'Record Type',
        prompt: 'What type of Salesforce record?',
        inputType: 'text',
        placeholder: 'Lead, Contact, Account...',
        quickActions: [
          { label: 'Lead', value: 'Lead' },
          { label: 'Contact', value: 'Contact' },
          { label: 'Account', value: 'Account' }
        ]
      }
    }
  },

  // Pipedrive
  pipedrive: {
    requiredParams: ['title'],
    paramConfig: {
      title: {
        displayName: 'Deal Title',
        prompt: 'What should the deal be called?',
        inputType: 'text',
        placeholder: 'Enter deal title...'
      }
    }
  },

  // Stripe
  stripe: {
    requiredParams: ['email'],
    optionalParams: ['name', 'description'],
    paramConfig: {
      email: {
        displayName: 'Customer Email',
        prompt: 'What is the customer\'s email?',
        inputType: 'email',
        placeholder: 'customer@example.com'
      }
    }
  },

  // Mailchimp
  mailchimp: {
    requiredParams: ['list_id', 'email'],
    paramConfig: {
      list_id: {
        displayName: 'Audience',
        prompt: 'Which Mailchimp audience/list?',
        inputType: 'text',
        placeholder: 'Audience name or ID'
      },
      email: {
        displayName: 'Subscriber Email',
        prompt: 'What email should be subscribed?',
        inputType: 'email',
        placeholder: 'subscriber@example.com'
      }
    }
  },

  // LinkedIn
  linkedin: {
    requiredParams: ['text'],
    paramConfig: {
      text: {
        displayName: 'Post Content',
        prompt: 'What should the LinkedIn post say?',
        inputType: 'textarea',
        placeholder: 'Type your post content...'
      }
    }
  },

  // Zendesk
  zendesk: {
    requiredParams: ['subject'],
    optionalParams: ['description'],
    paramConfig: {
      subject: {
        displayName: 'Ticket Subject',
        prompt: 'What should the support ticket be about?',
        inputType: 'text',
        placeholder: 'Enter ticket subject...'
      }
    }
  },

  // Freshdesk
  freshdesk: {
    requiredParams: ['subject', 'email'],
    paramConfig: {
      subject: {
        displayName: 'Ticket Subject',
        prompt: 'What should the support ticket be about?',
        inputType: 'text',
        placeholder: 'Enter ticket subject...'
      },
      email: {
        displayName: 'Requester Email',
        prompt: 'What is the requester\'s email?',
        inputType: 'email',
        placeholder: 'requester@example.com'
      }
    }
  },

  // Intercom
  intercom: {
    requiredParams: ['body'],
    optionalParams: ['user_id'],
    paramConfig: {
      body: {
        displayName: 'Message',
        prompt: 'What message should I send?',
        inputType: 'textarea',
        placeholder: 'Type your message...'
      }
    }
  },

  // Google Drive
  googledrive: {
    requiredParams: [],
    optionalParams: ['file_id', 'folder_id'],
    paramConfig: {
      file_id: {
        displayName: 'File',
        prompt: 'Which Google Drive file?',
        inputType: 'text',
        placeholder: 'File name or ID'
      }
    }
  },
  // @NEXUS-FIX-118-END

  // Default fallback for unknown integrations
  _default: {
    requiredParams: [],
    paramConfig: {}
  }
};

// Trigger nodes usually don't require user params - they pull FROM services
const TRIGGER_INTEGRATIONS = ['gmail', 'slack', 'github', 'stripe', 'webhook'];

// @NEXUS-FIX-050: Semantic param aliases - DO NOT REMOVE
// Maps semantic/user-friendly param names (what AI collects) to actual API param names
// This allows pre-flight to recognize that "notification_details" satisfies the "text" requirement
const PARAM_ALIASES: Record<string, string[]> = {
  // text/message params - AI often uses descriptive names
  // @NEXUS-FIX-050 extension: Added notification_content for AI Quick Questions compatibility
  text: ['notification_details', 'notification_content', 'message', 'message_text', 'notification_message', 'slack_message', 'content', 'body'],
  message: ['notification_details', 'message_text', 'notification_message', 'content', 'body', 'text'],
  body: ['email_body', 'message_body', 'content', 'text', 'message'],
  content: ['message', 'text', 'body', 'post_content'],

  // channel/destination params
  channel: ['slack_channel', 'channel_name', 'destination_channel'],
  channel_id: ['slack_channel', 'channel_name', 'channel'],

  // email params
  to: ['recipient', 'recipient_email', 'email_to', 'send_to', 'email_address'],
  subject: ['email_subject', 'subject_line'],

  // file/path params
  path: ['file_path', 'folder_path', 'dropbox_path', 'onedrive_path'],
  spreadsheet_id: ['sheet_id', 'google_sheet', 'spreadsheet_url', 'sheet_url'],

  // identifiers
  page_id: ['notion_page', 'page_url'],
  repo: ['repository', 'github_repo', 'repo_name'],
};

/**
 * PreFlightService - Validates workflow readiness before execution
 */
export class PreFlightService {

  /**
   * @NEXUS-FIX-074: Backend pre-flight check with REAL schema fetching
   * This is the PREFERRED method - calls backend which fetches from Composio SDK
   *
   * Falls back to local check() if backend is unavailable
   */
  static async checkAsync(
    nodes: WorkflowNode[],
    collectedParams: Record<string, string>,
    connectedIntegrations: string[]
  ): Promise<PreFlightResult> {
    try {
      console.log('[PreFlightService] Calling backend /api/preflight/check...');

      const response = await fetch('/api/preflight/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodes,
          collectedParams,
          connectedIntegrations,
        }),
      });

      if (!response.ok) {
        console.warn('[PreFlightService] Backend returned error, falling back to local check');
        return PreFlightService.check(nodes, collectedParams, connectedIntegrations);
      }

      const data = await response.json();

      if (!data.success) {
        console.warn('[PreFlightService] Backend check failed, falling back to local check');
        return PreFlightService.check(nodes, collectedParams, connectedIntegrations);
      }

      console.log(`[PreFlightService] Backend check result: ready=${data.ready}, questions=${data.questions?.length || 0}, source=${data.schemaSource}`);

      return {
        ready: data.ready,
        questions: data.questions || [],
        connections: data.connections || [],
        summary: data.summary || {
          totalQuestions: data.questions?.length || 0,
          answeredQuestions: 0,
          totalConnections: data.connections?.length || 0,
          connectedCount: data.connections?.filter((c: { connected: boolean }) => c.connected).length || 0,
        },
      };

    } catch (error) {
      console.warn('[PreFlightService] Backend unavailable, using local fallback:', error);
      return PreFlightService.check(nodes, collectedParams, connectedIntegrations);
    }
  }

  /**
   * Run pre-flight check on a workflow (LOCAL FALLBACK)
   * Returns all questions that need answers before execution can proceed
   *
   * NOTE: Prefer checkAsync() which uses backend with REAL schema fetching
   */
  static check(
    nodes: WorkflowNode[],
    collectedParams: Record<string, string>,
    connectedIntegrations: string[]
  ): PreFlightResult {
    const questions: PreFlightQuestion[] = [];
    const connections: PreFlightResult['connections'] = [];
    const seenIntegrations = new Set<string>();

    // Process each node
    for (const node of nodes) {
      const integration = (node.integration || node.tool || '').toLowerCase();

      if (!integration) continue;

      // Check connection status
      if (!seenIntegrations.has(integration)) {
        seenIntegrations.add(integration);
        connections.push({
          toolkit: integration,
          connected: connectedIntegrations.map(i => i.toLowerCase()).includes(integration)
        });
      }

      // Skip param requirements for trigger nodes (they PULL data, don't need input)
      if (node.type === 'trigger' && TRIGGER_INTEGRATIONS.includes(integration)) {
        continue;
      }

      // Get tool requirements
      const requirements = TOOL_REQUIREMENTS[integration] || TOOL_REQUIREMENTS._default;

      // Check each required param
      for (const paramName of requirements.requiredParams) {
        // Check if already collected (check multiple possible keys)
        // @NEXUS-FIX-050: Include semantic aliases - DO NOT REMOVE
        const aliases = PARAM_ALIASES[paramName] || [];
        const possibleKeys = [
          paramName,
          `${integration}_${paramName}`,
          `${node.id}_${paramName}`,
          // Add all semantic aliases
          ...aliases,
          // Also check integration-prefixed aliases
          ...aliases.map(a => `${integration}_${a}`),
        ];

        const isCollected = possibleKeys.some(key =>
          collectedParams[key] !== undefined && collectedParams[key] !== ''
        );

        // Also check node's existing params - handle both direct and extractedParams formats
        // @NEXUS-FIX-049: Support AI's extractedParams format - DO NOT REMOVE
        const directValue = node.params?.[paramName];
        // AI stores params in extractedParams.param.value format
        const paramsObj = node.params as Record<string, unknown> | undefined;
        const extractedParams = paramsObj?.extractedParams as Record<string, { value?: unknown }> | undefined;
        const extractedValue = extractedParams?.[paramName]?.value;
        const nodeHasParam = (directValue !== undefined && directValue !== '') ||
                            (extractedValue !== undefined && extractedValue !== '');

        if (!isCollected && !nodeHasParam) {
          const config = requirements.paramConfig[paramName];

          if (config) {
            questions.push({
              id: `${node.id}_${paramName}`,
              nodeId: node.id,
              nodeName: node.name,
              integration,
              paramName,
              displayName: config.displayName,
              prompt: config.prompt,
              quickActions: config.quickActions || [],
              inputType: config.inputType,
              placeholder: config.placeholder,
              required: true
            });
          } else {
            // Fallback to ParameterResolutionService
            const promptInfo = ParameterResolutionService.getCollectionPrompt(paramName);
            questions.push({
              id: `${node.id}_${paramName}`,
              nodeId: node.id,
              nodeName: node.name,
              integration,
              paramName,
              displayName: promptInfo.displayName,
              prompt: promptInfo.prompt,
              quickActions: promptInfo.quickActions,
              inputType: 'text',
              placeholder: `Enter ${promptInfo.displayName.toLowerCase()}...`,
              required: true
            });
          }
        }
      }
    }

    // Calculate summary
    const totalConnections = connections.length;
    const connectedCount = connections.filter(c => c.connected).length;
    const allConnected = connectedCount === totalConnections;
    const allAnswered = questions.length === 0;

    return {
      ready: allConnected && allAnswered,
      questions,
      connections,
      summary: {
        totalQuestions: questions.length,
        answeredQuestions: 0, // This will be tracked by the UI
        totalConnections,
        connectedCount
      }
    };
  }

  /**
   * Get the next unanswered question
   */
  static getNextQuestion(
    preFlightResult: PreFlightResult,
    answeredQuestions: Set<string>
  ): PreFlightQuestion | null {
    for (const question of preFlightResult.questions) {
      if (!answeredQuestions.has(question.id)) {
        return question;
      }
    }
    return null;
  }

  /**
   * Check if all questions are answered
   */
  static isComplete(
    preFlightResult: PreFlightResult,
    answeredQuestions: Set<string>
  ): boolean {
    return preFlightResult.questions.every(q => answeredQuestions.has(q.id));
  }

  /**
   * Get required integrations for a workflow
   */
  static getRequiredIntegrations(nodes: WorkflowNode[]): string[] {
    const integrations = new Set<string>();

    for (const node of nodes) {
      const integration = (node.integration || node.tool || '').toLowerCase();
      if (integration) {
        integrations.add(integration);
      }
    }

    return Array.from(integrations);
  }

  /**
   * Validate a single answer
   */
  static validateAnswer(question: PreFlightQuestion, value: string): {
    valid: boolean;
    error?: string;
  } {
    if (!value || value.trim() === '') {
      return { valid: false, error: 'This field is required' };
    }

    // Type-specific validation
    switch (question.inputType) {
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return { valid: false, error: 'Please enter a valid email address' };
        }
        break;

      case 'phone':
        // Allow various phone formats
        if (!/^\+?[\d\s-()]{8,}$/.test(value.replace(/\s/g, ''))) {
          return { valid: false, error: 'Please enter a valid phone number with country code' };
        }
        break;

      case 'url':
        // Allow URLs or IDs
        if (value.includes('.') && !value.match(/^https?:\/\//)) {
          return { valid: false, error: 'Please enter a valid URL starting with http:// or https://' };
        }
        break;
    }

    return { valid: true };
  }
}

export default PreFlightService;
