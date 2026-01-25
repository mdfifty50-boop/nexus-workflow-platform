/**
 * ToolRegistry.ts
 *
 * SINGLE SOURCE OF TRUTH for all Composio tool mappings, action verbs,
 * parameter definitions, and support levels.
 *
 * This service solves:
 * - Problem 2: Tool Not Found errors (FIX-019, FIX-020 enhancement)
 * - Problem 3: Unsupported tool detection with alternatives
 *
 * Architecture:
 * 1. Rich ToolDefinition with verified Composio slugs
 * 2. Action verb mapping ("save" → DROPBOX_UPLOAD_FILE)
 * 3. 3-tier support level (native, api_key, alternative)
 * 4. Parameter aliases for natural language flexibility
 *
 * @NEXUS-FIX-034: ToolRegistry - Single source of truth for tool mappings - DO NOT REMOVE
 */

// ================================
// TYPE DEFINITIONS
// ================================

export type ToolCategory =
  | 'storage'
  | 'communication'
  | 'productivity'
  | 'crm'
  | 'payment'
  | 'social'
  | 'project'
  | 'calendar'
  | 'dev'
  | 'analytics'
  | 'ai';

export type SupportLevel =
  | 'native'      // Full Composio OAuth support
  | 'api_key'     // CustomIntegrationService has API key setup
  | 'alternative' // Use a different tool instead
  | 'unsupported'; // No support available

export type ParamInputType =
  | 'string'
  | 'email'
  | 'phone'
  | 'url'
  | 'number'
  | 'textarea'
  | 'select';

export interface QuickAction {
  label: string;
  value: string;
}

export interface ParamDefinition {
  name: string;
  friendly: string;
  type: ParamInputType;
  placeholder?: string;
  validation?: RegExp;
  quickAction?: QuickAction;
}

export interface ToolDefinition {
  slug: string;                           // Verified Composio slug e.g., "DROPBOX_UPLOAD_FILE"
  integration: string;                    // Toolkit name e.g., "dropbox"
  category: ToolCategory;
  displayName: string;                    // User-friendly name
  description: string;
  actions: string[];                      // Verbs that map to this tool: ['upload', 'save', 'store']
  requiredParams: ParamDefinition[];
  optionalParams?: ParamDefinition[];
  paramAliases: Record<string, string[]>; // {path: ['file_path', 'destination']}
  isDefault: boolean;                     // Use when action verb is ambiguous
  supportLevel: SupportLevel;
}

export interface Alternative {
  toolkit: string;
  name: string;
  description: string;
  confidence: number;
}

export interface SupportResolution {
  level: SupportLevel;
  tool?: ToolDefinition;
  alternatives?: Alternative[];
  apiKeyInfo?: {
    displayName: string;
    apiDocsUrl: string;
    steps: string[];
    keyPattern?: string;
  };
  message: string;
}

export interface ToolResolutionResult {
  success: boolean;
  slug: string;
  definition: ToolDefinition;
  confidence: number;
  alternativesTried?: string[];
}

// ================================
// TOOL REGISTRY DATA
// ================================

/**
 * @NEXUS-FIX-034: Complete tool registry with verified Composio slugs
 */
export const TOOL_REGISTRY: Record<string, ToolDefinition[]> = {
  // ============== STORAGE ==============
  dropbox: [
    {
      slug: 'DROPBOX_UPLOAD_FILE',
      integration: 'dropbox',
      category: 'storage',
      displayName: 'Upload to Dropbox',
      description: 'Upload or save a file to Dropbox',
      actions: ['upload', 'save', 'store', 'write', 'put', 'backup', 'sync'],
      requiredParams: [
        { name: 'path', friendly: 'Where should I save the file?', type: 'string', placeholder: '/Documents/file.txt' },
        { name: 'content', friendly: 'What content should I save?', type: 'textarea' }
      ],
      paramAliases: { path: ['file_path', 'destination', 'folder', 'location', 'to'] },
      isDefault: true,
      supportLevel: 'native'
    },
    {
      slug: 'DROPBOX_DOWNLOAD_FILE',
      integration: 'dropbox',
      category: 'storage',
      displayName: 'Download from Dropbox',
      description: 'Download a file from Dropbox',
      actions: ['download', 'get', 'fetch', 'retrieve', 'read'],
      requiredParams: [
        { name: 'path', friendly: 'Which file to download?', type: 'string', placeholder: '/Documents/file.txt' }
      ],
      paramAliases: { path: ['file_path', 'file', 'source', 'from'] },
      isDefault: false,
      supportLevel: 'native'
    },
    {
      slug: 'DROPBOX_LIST_FOLDER',
      integration: 'dropbox',
      category: 'storage',
      displayName: 'List Dropbox Folder',
      description: 'List files in a Dropbox folder',
      actions: ['list', 'show', 'display', 'browse', 'view'],
      requiredParams: [
        {
          name: 'path',
          friendly: 'Which folder to list?',
          type: 'string',
          placeholder: '/Documents',
          quickAction: { label: 'Root folder', value: '' }
        }
      ],
      paramAliases: { path: ['folder', 'directory', 'dir'] },
      isDefault: false,
      supportLevel: 'native'
    }
  ],

  googledrive: [
    {
      slug: 'GOOGLEDRIVE_UPLOAD_FILE',
      integration: 'googledrive',
      category: 'storage',
      displayName: 'Upload to Google Drive',
      description: 'Upload a file to Google Drive',
      actions: ['upload', 'save', 'store', 'write', 'put', 'backup', 'sync'],
      requiredParams: [
        { name: 'name', friendly: 'What should the file be called?', type: 'string', placeholder: 'document.txt' },
        { name: 'content', friendly: 'What content should I save?', type: 'textarea' }
      ],
      optionalParams: [
        { name: 'folder_id', friendly: 'Which folder? (optional)', type: 'string' }
      ],
      paramAliases: { name: ['filename', 'file_name', 'title'], folder_id: ['folder', 'parent'] },
      isDefault: true,
      supportLevel: 'native'
    },
    {
      slug: 'GOOGLEDRIVE_LIST_FILES',
      integration: 'googledrive',
      category: 'storage',
      displayName: 'List Google Drive Files',
      description: 'List files in Google Drive',
      actions: ['list', 'show', 'display', 'browse', 'view'],
      requiredParams: [],
      optionalParams: [
        { name: 'folder_id', friendly: 'Which folder?', type: 'string' }
      ],
      paramAliases: { folder_id: ['folder', 'directory'] },
      isDefault: false,
      supportLevel: 'native'
    }
  ],

  onedrive: [
    {
      slug: 'ONEDRIVE_UPLOAD_FILE',
      integration: 'onedrive',
      category: 'storage',
      displayName: 'Upload to OneDrive',
      description: 'Upload a file to OneDrive',
      actions: ['upload', 'save', 'store', 'write', 'put', 'backup', 'sync'],
      requiredParams: [
        { name: 'path', friendly: 'Where should I save the file?', type: 'string', placeholder: '/Documents/file.txt' },
        { name: 'content', friendly: 'What content?', type: 'textarea' }
      ],
      paramAliases: { path: ['file_path', 'destination', 'folder'] },
      isDefault: true,
      supportLevel: 'native'
    }
  ],

  // ============== COMMUNICATION ==============
  gmail: [
    {
      slug: 'GMAIL_SEND_EMAIL',
      integration: 'gmail',
      category: 'communication',
      displayName: 'Send Email',
      description: 'Send an email via Gmail',
      actions: ['send', 'email', 'deliver', 'mail', 'notify', 'alert'],
      requiredParams: [
        {
          name: 'to',
          friendly: 'Who should receive this email?',
          type: 'email',
          placeholder: 'recipient@example.com',
          quickAction: { label: 'Send to Myself', value: '{{user_email}}' }
        },
        { name: 'subject', friendly: 'What should the subject say?', type: 'string', placeholder: 'Subject line' },
        { name: 'body', friendly: 'What should the email say?', type: 'textarea', placeholder: 'Email content...' }
      ],
      paramAliases: { to: ['recipient', 'email', 'address'], body: ['message', 'content', 'text'] },
      isDefault: true,
      supportLevel: 'native'
    },
    {
      slug: 'GMAIL_GET_MESSAGE',
      integration: 'gmail',
      category: 'communication',
      displayName: 'Get Email',
      description: 'Retrieve a specific email',
      actions: ['get', 'read', 'fetch', 'retrieve'],
      requiredParams: [
        { name: 'message_id', friendly: 'Which email?', type: 'string' }
      ],
      paramAliases: { message_id: ['id', 'email_id'] },
      isDefault: false,
      supportLevel: 'native'
    },
    {
      slug: 'GMAIL_LIST_MESSAGES',
      integration: 'gmail',
      category: 'communication',
      displayName: 'List Emails',
      description: 'List emails from Gmail',
      actions: ['list', 'show', 'display', 'view'],
      requiredParams: [],
      optionalParams: [
        { name: 'query', friendly: 'Search query?', type: 'string', placeholder: 'from:example@gmail.com' },
        { name: 'max_results', friendly: 'How many?', type: 'number' }
      ],
      paramAliases: { query: ['search', 'filter'], max_results: ['limit', 'count'] },
      isDefault: false,
      supportLevel: 'native'
    }
  ],

  slack: [
    {
      slug: 'SLACK_SEND_MESSAGE',
      integration: 'slack',
      category: 'communication',
      displayName: 'Send Slack Message',
      description: 'Post a message to a Slack channel',
      actions: ['send', 'post', 'message', 'notify', 'alert', 'chat'],
      requiredParams: [
        {
          name: 'channel',
          friendly: 'Which Slack channel?',
          type: 'string',
          placeholder: '#general',
          quickAction: { label: '#general', value: 'general' }
        },
        { name: 'text', friendly: 'What message?', type: 'textarea', placeholder: 'Your message...' }
      ],
      paramAliases: { channel: ['channel_name', 'room', 'to'], text: ['message', 'content', 'body'] },
      isDefault: true,
      supportLevel: 'native'
    },
    {
      slug: 'SLACK_LIST_CHANNELS',
      integration: 'slack',
      category: 'communication',
      displayName: 'List Slack Channels',
      description: 'List available Slack channels',
      actions: ['list', 'show', 'display', 'view', 'get'],
      requiredParams: [],
      paramAliases: {},
      isDefault: false,
      supportLevel: 'native'
    }
  ],

  whatsapp: [
    {
      slug: 'WHATSAPP_SEND_MESSAGE',
      integration: 'whatsapp',
      category: 'communication',
      displayName: 'Send WhatsApp Message',
      description: 'Send a WhatsApp message',
      actions: ['send', 'message', 'notify', 'text', 'alert', 'chat'],
      requiredParams: [
        {
          name: 'to',
          friendly: 'Who should receive this message?',
          type: 'phone',
          placeholder: '+965 xxxx xxxx'
        },
        {
          name: 'message',
          friendly: 'What message should I send?',
          type: 'textarea',
          placeholder: 'Your message...'
        }
      ],
      paramAliases: { to: ['phone', 'number', 'recipient', 'phone_number'], message: ['text', 'body', 'content'] },
      isDefault: true,
      supportLevel: 'native'
    }
  ],

  discord: [
    {
      slug: 'DISCORD_SEND_MESSAGE',
      integration: 'discord',
      category: 'communication',
      displayName: 'Send Discord Message',
      description: 'Send a message to a Discord channel',
      actions: ['send', 'post', 'message', 'notify', 'alert'],
      requiredParams: [
        { name: 'channel_id', friendly: 'Which Discord channel?', type: 'string' },
        { name: 'content', friendly: 'What message?', type: 'textarea' }
      ],
      paramAliases: { channel_id: ['channel', 'room'], content: ['message', 'text', 'body'] },
      isDefault: true,
      supportLevel: 'native'
    }
  ],

  telegram: [
    {
      slug: 'TELEGRAM_SEND_MESSAGE',
      integration: 'telegram',
      category: 'communication',
      displayName: 'Send Telegram Message',
      description: 'Send a message via Telegram',
      actions: ['send', 'message', 'notify', 'text', 'alert'],
      requiredParams: [
        { name: 'chat_id', friendly: 'Which chat?', type: 'string' },
        { name: 'text', friendly: 'What message?', type: 'textarea' }
      ],
      paramAliases: { chat_id: ['chat', 'to', 'recipient'], text: ['message', 'body', 'content'] },
      isDefault: true,
      supportLevel: 'native'
    }
  ],

  // ============== PRODUCTIVITY ==============
  googlesheets: [
    {
      slug: 'GOOGLESHEETS_APPEND_DATA',
      integration: 'googlesheets',
      category: 'productivity',
      displayName: 'Add Row to Google Sheets',
      description: 'Append a row to a Google Sheet',
      actions: ['append', 'add', 'insert', 'create', 'save', 'store', 'write', 'log'],
      requiredParams: [
        {
          name: 'spreadsheet_id',
          friendly: 'Which Google Sheet?',
          type: 'url',
          placeholder: 'Paste Google Sheets URL...'
        },
        { name: 'range', friendly: 'Which cells?', type: 'string', placeholder: 'Sheet1!A:D' },
        { name: 'values', friendly: 'What data to add?', type: 'textarea' }
      ],
      paramAliases: { spreadsheet_id: ['sheet_id', 'sheet', 'document'], range: ['cells'], values: ['data', 'rows'] },
      isDefault: true,
      supportLevel: 'native'
    },
    {
      slug: 'GOOGLESHEETS_GET_DATA',
      integration: 'googlesheets',
      category: 'productivity',
      displayName: 'Read Google Sheets',
      description: 'Read data from a Google Sheet',
      actions: ['get', 'read', 'fetch', 'retrieve', 'list', 'view'],
      requiredParams: [
        { name: 'spreadsheet_id', friendly: 'Which Google Sheet?', type: 'url' },
        { name: 'range', friendly: 'Which cells?', type: 'string', placeholder: 'Sheet1!A1:D10' }
      ],
      paramAliases: { spreadsheet_id: ['sheet_id', 'sheet'], range: ['cells'] },
      isDefault: false,
      supportLevel: 'native'
    }
  ],

  notion: [
    {
      slug: 'NOTION_CREATE_PAGE',
      integration: 'notion',
      category: 'productivity',
      displayName: 'Create Notion Page',
      description: 'Create a new page in Notion',
      actions: ['create', 'add', 'new', 'make', 'save', 'store', 'write'],
      requiredParams: [
        { name: 'parent_id', friendly: 'Where should I create the page?', type: 'string' },
        { name: 'title', friendly: 'What should the title be?', type: 'string' }
      ],
      optionalParams: [
        { name: 'content', friendly: 'What content?', type: 'textarea' }
      ],
      paramAliases: { parent_id: ['parent', 'page_id', 'database_id'], title: ['name'], content: ['body', 'text'] },
      isDefault: true,
      supportLevel: 'native'
    },
    {
      slug: 'NOTION_UPDATE_PAGE',
      integration: 'notion',
      category: 'productivity',
      displayName: 'Update Notion Page',
      description: 'Update an existing Notion page',
      actions: ['update', 'edit', 'modify', 'change'],
      requiredParams: [
        { name: 'page_id', friendly: 'Which page?', type: 'string' }
      ],
      paramAliases: { page_id: ['id', 'page'] },
      isDefault: false,
      supportLevel: 'native'
    }
  ],

  airtable: [
    {
      slug: 'AIRTABLE_CREATE_RECORD',
      integration: 'airtable',
      category: 'productivity',
      displayName: 'Create Airtable Record',
      description: 'Add a new record to an Airtable base',
      actions: ['create', 'add', 'new', 'insert', 'save', 'store'],
      requiredParams: [
        { name: 'base_id', friendly: 'Which Airtable base?', type: 'string' },
        { name: 'table_name', friendly: 'Which table?', type: 'string' },
        { name: 'fields', friendly: 'What data?', type: 'textarea' }
      ],
      paramAliases: { base_id: ['base'], table_name: ['table'], fields: ['data', 'record'] },
      isDefault: true,
      supportLevel: 'native'
    }
  ],

  // ============== PROJECT MANAGEMENT ==============
  trello: [
    {
      slug: 'TRELLO_CREATE_CARD',
      integration: 'trello',
      category: 'project',
      displayName: 'Create Trello Card',
      description: 'Create a new card in Trello',
      actions: ['create', 'add', 'new', 'make'],
      requiredParams: [
        { name: 'list_id', friendly: 'Which list?', type: 'string' },
        { name: 'name', friendly: 'Card name?', type: 'string' }
      ],
      optionalParams: [
        { name: 'desc', friendly: 'Description?', type: 'textarea' }
      ],
      paramAliases: { list_id: ['list'], name: ['title', 'card_name'], desc: ['description', 'body'] },
      isDefault: true,
      supportLevel: 'native'
    }
  ],

  asana: [
    {
      slug: 'ASANA_CREATE_TASK',
      integration: 'asana',
      category: 'project',
      displayName: 'Create Asana Task',
      description: 'Create a new task in Asana',
      actions: ['create', 'add', 'new', 'make'],
      requiredParams: [
        { name: 'project_id', friendly: 'Which project?', type: 'string' },
        { name: 'name', friendly: 'Task name?', type: 'string' }
      ],
      optionalParams: [
        { name: 'notes', friendly: 'Notes?', type: 'textarea' }
      ],
      paramAliases: { project_id: ['project'], name: ['title', 'task_name'], notes: ['description', 'body'] },
      isDefault: true,
      supportLevel: 'native'
    }
  ],

  linear: [
    {
      slug: 'LINEAR_CREATE_ISSUE',
      integration: 'linear',
      category: 'project',
      displayName: 'Create Linear Issue',
      description: 'Create a new issue in Linear',
      actions: ['create', 'add', 'new', 'make'],
      requiredParams: [
        { name: 'team_id', friendly: 'Which team?', type: 'string' },
        { name: 'title', friendly: 'Issue title?', type: 'string' }
      ],
      optionalParams: [
        { name: 'description', friendly: 'Description?', type: 'textarea' }
      ],
      paramAliases: { team_id: ['team'], title: ['name'], description: ['body', 'notes'] },
      isDefault: true,
      supportLevel: 'native'
    }
  ],

  jira: [
    {
      slug: 'JIRA_CREATE_ISSUE',
      integration: 'jira',
      category: 'project',
      displayName: 'Create Jira Issue',
      description: 'Create a new issue in Jira',
      actions: ['create', 'add', 'new', 'make'],
      requiredParams: [
        { name: 'project_key', friendly: 'Which project?', type: 'string' },
        { name: 'summary', friendly: 'Issue summary?', type: 'string' },
        { name: 'issue_type', friendly: 'Issue type?', type: 'string', quickAction: { label: 'Task', value: 'Task' } }
      ],
      optionalParams: [
        { name: 'description', friendly: 'Description?', type: 'textarea' }
      ],
      paramAliases: { project_key: ['project'], summary: ['title', 'name'], description: ['body', 'notes'] },
      isDefault: true,
      supportLevel: 'native'
    }
  ],

  // ============== CRM ==============
  hubspot: [
    {
      slug: 'HUBSPOT_CREATE_CONTACT',
      integration: 'hubspot',
      category: 'crm',
      displayName: 'Create HubSpot Contact',
      description: 'Create a new contact in HubSpot',
      actions: ['create', 'add', 'new', 'make'],
      requiredParams: [
        { name: 'email', friendly: 'Contact email?', type: 'email' }
      ],
      optionalParams: [
        { name: 'firstname', friendly: 'First name?', type: 'string' },
        { name: 'lastname', friendly: 'Last name?', type: 'string' }
      ],
      paramAliases: { firstname: ['first_name', 'name'], lastname: ['last_name'] },
      isDefault: true,
      supportLevel: 'native'
    }
  ],

  salesforce: [
    {
      slug: 'SALESFORCE_CREATE_LEAD',
      integration: 'salesforce',
      category: 'crm',
      displayName: 'Create Salesforce Lead',
      description: 'Create a new lead in Salesforce',
      actions: ['create', 'add', 'new', 'make'],
      requiredParams: [
        { name: 'LastName', friendly: 'Last name?', type: 'string' },
        { name: 'Company', friendly: 'Company name?', type: 'string' }
      ],
      optionalParams: [
        { name: 'Email', friendly: 'Email?', type: 'email' }
      ],
      paramAliases: { LastName: ['last_name', 'name'], Company: ['company_name'] },
      isDefault: true,
      supportLevel: 'native'
    }
  ],

  // ============== SOCIAL ==============
  twitter: [
    {
      slug: 'TWITTER_CREATE_TWEET',
      integration: 'twitter',
      category: 'social',
      displayName: 'Post Tweet',
      description: 'Post a tweet to Twitter/X',
      actions: ['post', 'tweet', 'send', 'publish', 'create'],
      requiredParams: [
        { name: 'text', friendly: 'What should I tweet?', type: 'textarea', placeholder: 'Max 280 characters...' }
      ],
      paramAliases: { text: ['message', 'content', 'body', 'tweet'] },
      isDefault: true,
      supportLevel: 'native'
    }
  ],

  linkedin: [
    {
      slug: 'LINKEDIN_CREATE_POST',
      integration: 'linkedin',
      category: 'social',
      displayName: 'Post to LinkedIn',
      description: 'Create a post on LinkedIn',
      actions: ['post', 'share', 'publish', 'create'],
      requiredParams: [
        { name: 'text', friendly: 'What should I post?', type: 'textarea' }
      ],
      paramAliases: { text: ['content', 'body', 'message'] },
      isDefault: true,
      supportLevel: 'native'
    }
  ],

  // ============== PAYMENTS ==============
  stripe: [
    {
      slug: 'STRIPE_CREATE_INVOICE',
      integration: 'stripe',
      category: 'payment',
      displayName: 'Create Stripe Invoice',
      description: 'Create an invoice in Stripe',
      actions: ['create', 'send', 'generate', 'make'],
      requiredParams: [
        { name: 'customer', friendly: 'Which customer?', type: 'string' }
      ],
      paramAliases: { customer: ['customer_id', 'client'] },
      isDefault: true,
      supportLevel: 'native'
    }
  ],

  // ============== DEV ==============
  github: [
    {
      slug: 'GITHUB_CREATE_ISSUE',
      integration: 'github',
      category: 'dev',
      displayName: 'Create GitHub Issue',
      description: 'Create a new issue on GitHub',
      actions: ['create', 'add', 'new', 'make', 'open', 'report'],
      requiredParams: [
        { name: 'owner', friendly: 'Repository owner?', type: 'string' },
        { name: 'repo', friendly: 'Repository name?', type: 'string' },
        { name: 'title', friendly: 'Issue title?', type: 'string' }
      ],
      optionalParams: [
        { name: 'body', friendly: 'Issue description?', type: 'textarea' }
      ],
      paramAliases: { owner: ['username', 'org'], repo: ['repository'], body: ['description', 'content'] },
      isDefault: true,
      supportLevel: 'native'
    },
    {
      slug: 'GITHUB_LIST_ISSUES',
      integration: 'github',
      category: 'dev',
      displayName: 'List GitHub Issues',
      description: 'List issues from a repository',
      actions: ['list', 'get', 'show', 'view', 'fetch'],
      requiredParams: [
        { name: 'owner', friendly: 'Repository owner?', type: 'string' },
        { name: 'repo', friendly: 'Repository name?', type: 'string' }
      ],
      paramAliases: { owner: ['username', 'org'], repo: ['repository'] },
      isDefault: false,
      supportLevel: 'native'
    }
  ],

  gitlab: [
    {
      slug: 'GITLAB_CREATE_ISSUE',
      integration: 'gitlab',
      category: 'dev',
      displayName: 'Create GitLab Issue',
      description: 'Create a new issue on GitLab',
      actions: ['create', 'add', 'new', 'make'],
      requiredParams: [
        { name: 'project_id', friendly: 'Which project?', type: 'string' },
        { name: 'title', friendly: 'Issue title?', type: 'string' }
      ],
      paramAliases: { project_id: ['project'], title: ['name'] },
      isDefault: true,
      supportLevel: 'native'
    }
  ],

  // ============== CALENDAR ==============
  googlecalendar: [
    {
      slug: 'GOOGLECALENDAR_CREATE_EVENT',
      integration: 'googlecalendar',
      category: 'calendar',
      displayName: 'Create Calendar Event',
      description: 'Create an event in Google Calendar',
      actions: ['create', 'add', 'schedule', 'book', 'new'],
      requiredParams: [
        { name: 'summary', friendly: 'Event title?', type: 'string' },
        { name: 'start_time', friendly: 'Start time?', type: 'string' },
        { name: 'end_time', friendly: 'End time?', type: 'string' }
      ],
      optionalParams: [
        { name: 'description', friendly: 'Description?', type: 'textarea' }
      ],
      paramAliases: { summary: ['title', 'name', 'event'], start_time: ['start', 'from'], end_time: ['end', 'to'] },
      isDefault: true,
      supportLevel: 'native'
    }
  ],

  // ============== AI ==============
  openai: [
    {
      slug: 'OPENAI_CHAT_COMPLETION',
      integration: 'openai',
      category: 'ai',
      displayName: 'Chat with OpenAI',
      description: 'Generate text using OpenAI',
      actions: ['generate', 'create', 'ask', 'chat', 'complete'],
      requiredParams: [
        { name: 'prompt', friendly: 'What should I ask?', type: 'textarea' }
      ],
      paramAliases: { prompt: ['message', 'input', 'query'] },
      isDefault: true,
      supportLevel: 'native'
    }
  ]
};

// ================================
// INTEGRATION ALIASES
// ================================

/**
 * Maps common names/typos to canonical integration names
 */
export const INTEGRATION_ALIASES: Record<string, string> = {
  // Email
  'email': 'gmail',
  'mail': 'gmail',
  'google mail': 'gmail',
  'google email': 'gmail',

  // Storage
  'drive': 'googledrive',
  'google drive': 'googledrive',
  'gdrive': 'googledrive',

  // Sheets
  'sheets': 'googlesheets',
  'google sheets': 'googlesheets',
  'spreadsheet': 'googlesheets',
  'spreadsheets': 'googlesheets',

  // Calendar
  'calendar': 'googlecalendar',
  'google calendar': 'googlecalendar',
  'gcal': 'googlecalendar',

  // Social
  'x': 'twitter',
  'x.com': 'twitter',

  // Messaging
  'wa': 'whatsapp',
  'whats app': 'whatsapp',
  'tg': 'telegram',
};

// ================================
// ALTERNATIVE MAPPINGS
// ================================

/**
 * Fallback alternatives when a tool isn't supported
 */
export const ALTERNATIVE_MAP: Record<string, Alternative[]> = {
  tally: [
    { toolkit: 'zoho_books', name: 'Zoho Books', description: 'Full accounting software', confidence: 0.85 },
    { toolkit: 'xero', name: 'Xero', description: 'Cloud accounting', confidence: 0.85 },
    { toolkit: 'quickbooks', name: 'QuickBooks', description: 'Popular accounting', confidence: 0.8 },
    { toolkit: 'gmail', name: 'Email', description: 'Send data via email', confidence: 0.5 }
  ],
  wave: [
    { toolkit: 'zoho_books', name: 'Zoho Books', description: 'Full accounting', confidence: 0.85 },
    { toolkit: 'xero', name: 'Xero', description: 'Cloud accounting', confidence: 0.85 },
    { toolkit: 'quickbooks', name: 'QuickBooks', description: 'Popular accounting', confidence: 0.8 }
  ],
  knet: [
    { toolkit: 'tap', name: 'Tap Payments', description: 'Supports KNET in Kuwait', confidence: 0.9 },
    { toolkit: 'stripe', name: 'Stripe', description: 'Global payments', confidence: 0.7 }
  ],
  sap: [
    { toolkit: 'odoo', name: 'Odoo', description: 'Open-source ERP', confidence: 0.6 },
    { toolkit: 'googlesheets', name: 'Google Sheets', description: 'Export data to sheets', confidence: 0.5 }
  ],
  zoom: [
    { toolkit: 'google_meet', name: 'Google Meet', description: 'Video conferencing', confidence: 0.9 },
    { toolkit: 'teams', name: 'Microsoft Teams', description: 'Video + collaboration', confidence: 0.85 }
  ],
  teams: [
    { toolkit: 'slack', name: 'Slack', description: 'Team messaging', confidence: 0.9 },
    { toolkit: 'discord', name: 'Discord', description: 'Group chat', confidence: 0.7 }
  ]
};

// ================================
// API KEY INFO (for Tier 2 support)
// ================================

/**
 * Apps that can be connected via API key
 */
export const API_KEY_APPS: Record<string, {
  displayName: string;
  apiDocsUrl: string;
  steps: string[];
  keyPattern?: string;
}> = {
  wave: {
    displayName: 'Wave Accounting',
    apiDocsUrl: 'https://developer.waveapps.com/hc/en-us/articles/360019968212-API-Key',
    steps: [
      'Go to Wave → Settings → Integrations',
      'Click "API & Webhooks"',
      'Click "Create API Key"',
      'Copy your API key and paste below'
    ],
    keyPattern: '^[A-Za-z0-9_-]{32,64}$'
  },
  freshbooks: {
    displayName: 'FreshBooks',
    apiDocsUrl: 'https://www.freshbooks.com/api',
    steps: [
      'Go to FreshBooks → Settings → Developer Portal',
      'Create a new application',
      'Copy your Client ID and Secret'
    ]
  },
  // Add more API key apps as needed
};

// ================================
// SERVICE CLASS
// ================================

/**
 * ToolRegistryService - Central service for tool resolution
 */
export class ToolRegistryService {

  /**
   * Resolve an integration name to its canonical form
   */
  static normalizeIntegration(integration: string): string {
    const lower = integration.toLowerCase().trim();
    return INTEGRATION_ALIASES[lower] || lower;
  }

  /**
   * Resolve a tool slug from integration + action verb
   *
   * @param integration - The integration name (e.g., 'dropbox')
   * @param actionVerb - The action verb (e.g., 'save', 'upload', 'send')
   * @param nodeName - The node name for additional context
   * @returns ToolResolutionResult with resolved slug
   */
  static resolveToolSlug(
    integration: string,
    actionVerb: string = '',
    nodeName: string = ''
  ): ToolResolutionResult | null {
    const normalized = this.normalizeIntegration(integration);
    const tools = TOOL_REGISTRY[normalized];

    if (!tools?.length) {
      return null;
    }

    // Step 1: Try to match by action verb
    const verbLower = actionVerb.toLowerCase();
    if (verbLower) {
      for (const tool of tools) {
        if (tool.actions.some(a => a === verbLower || verbLower.includes(a))) {
          return {
            success: true,
            slug: tool.slug,
            definition: tool,
            confidence: 0.95
          };
        }
      }
    }

    // Step 2: Parse node name for action hints
    if (nodeName) {
      const nodeWords = nodeName.toLowerCase().split(/[\s_-]+/);
      for (const tool of tools) {
        if (tool.actions.some(a => nodeWords.includes(a))) {
          return {
            success: true,
            slug: tool.slug,
            definition: tool,
            confidence: 0.85
          };
        }
      }
    }

    // Step 3: Return default tool
    const defaultTool = tools.find(t => t.isDefault);
    if (defaultTool) {
      return {
        success: true,
        slug: defaultTool.slug,
        definition: defaultTool,
        confidence: 0.7
      };
    }

    // Step 4: Return first tool as fallback
    return {
      success: true,
      slug: tools[0].slug,
      definition: tools[0],
      confidence: 0.5
    };
  }

  /**
   * Get tool definition by exact slug
   */
  static getToolBySlug(slug: string): ToolDefinition | null {
    for (const tools of Object.values(TOOL_REGISTRY)) {
      const tool = tools.find(t => t.slug === slug);
      if (tool) return tool;
    }
    return null;
  }

  /**
   * Get all tools for an integration
   */
  static getToolsForIntegration(integration: string): ToolDefinition[] {
    const normalized = this.normalizeIntegration(integration);
    return TOOL_REGISTRY[normalized] || [];
  }

  /**
   * Resolve support level for an integration
   */
  static resolveSupportLevel(integration: string): SupportResolution {
    const normalized = this.normalizeIntegration(integration);

    // Tier 1: Native Composio support
    const nativeTools = TOOL_REGISTRY[normalized];
    if (nativeTools?.some(t => t.supportLevel === 'native')) {
      const defaultTool = nativeTools.find(t => t.isDefault && t.supportLevel === 'native');
      return {
        level: 'native',
        tool: defaultTool || nativeTools.find(t => t.supportLevel === 'native'),
        message: `${integration} is fully supported with one-click connection.`
      };
    }

    // Tier 2: API Key support
    const apiInfo = API_KEY_APPS[normalized];
    if (apiInfo) {
      return {
        level: 'api_key',
        apiKeyInfo: apiInfo,
        message: `${apiInfo.displayName} can be connected with your API key.`
      };
    }

    // Tier 3: Alternatives available
    const alternatives = ALTERNATIVE_MAP[normalized];
    if (alternatives?.length) {
      return {
        level: 'alternative',
        alternatives,
        message: `${integration} isn't directly supported, but here are some alternatives...`
      };
    }

    // Tier 4: Unsupported
    return {
      level: 'unsupported',
      message: `${integration} isn't available yet. We're always adding new integrations!`,
      alternatives: [
        { toolkit: 'gmail', name: 'Email', description: 'Send data via email instead', confidence: 0.5 }
      ]
    };
  }

  /**
   * Check if an integration is supported at any tier
   */
  static isSupported(integration: string): boolean {
    const resolution = this.resolveSupportLevel(integration);
    return resolution.level !== 'unsupported';
  }

  /**
   * Get friendly prompt for a parameter
   */
  static getParamPrompt(integration: string, paramName: string): ParamDefinition | null {
    const tools = this.getToolsForIntegration(integration);

    for (const tool of tools) {
      // Check required params
      const required = tool.requiredParams.find(p => p.name === paramName);
      if (required) return required;

      // Check optional params
      const optional = tool.optionalParams?.find(p => p.name === paramName);
      if (optional) return optional;

      // Check aliases
      for (const [actualName, aliases] of Object.entries(tool.paramAliases)) {
        if (aliases.includes(paramName)) {
          const actual = tool.requiredParams.find(p => p.name === actualName) ||
                        tool.optionalParams?.find(p => p.name === actualName);
          if (actual) return actual;
        }
      }
    }

    return null;
  }

  /**
   * Resolve a parameter alias to its canonical name
   */
  static resolveParamAlias(integration: string, paramName: string): string {
    const tools = this.getToolsForIntegration(integration);

    for (const tool of tools) {
      for (const [actualName, aliases] of Object.entries(tool.paramAliases)) {
        if (aliases.includes(paramName.toLowerCase())) {
          return actualName;
        }
      }
    }

    return paramName;
  }

  /**
   * Get all supported integrations
   */
  static getAllSupportedIntegrations(): string[] {
    return Object.keys(TOOL_REGISTRY);
  }

  /**
   * Get integrations by category
   */
  static getIntegrationsByCategory(category: ToolCategory): string[] {
    const integrations: string[] = [];

    for (const [integration, tools] of Object.entries(TOOL_REGISTRY)) {
      if (tools.some(t => t.category === category)) {
        integrations.push(integration);
      }
    }

    return integrations;
  }
}

export default ToolRegistryService;
