/**
 * UnifiedToolRegistry.ts
 *
 * PHASE 1 of Architecture Overhaul:
 * SINGLE SOURCE OF TRUTH for all tool definitions, action mappings,
 * parameter schemas, and integration aliases.
 *
 * This consolidates:
 * - TOOL_SLUGS from WorkflowPreviewCard.tsx (~320 lines)
 * - TOOL_REGISTRY from ToolRegistry.ts
 * - TOOL_REQUIREMENTS from PreFlightService.ts
 * - PARAMETER_DEFINITIONS from ParameterResolutionService.ts
 * - INTEGRATION_ALIASES from ToolRegistry.ts
 *
 * The Problem:
 * - Tool definitions scattered across 9+ files
 * - Duplicated param definitions
 * - Inconsistent action→slug mappings
 * - No single place to add new tools
 *
 * The Solution:
 * - ONE registry for all tool contracts
 * - Merges static knowledge with dynamic Rube MCP discovery
 * - Clear interface for tool resolution
 *
 * @NEXUS-FIX-042: UnifiedToolRegistry - Single source of truth for tools - DO NOT REMOVE
 */

// ================================
// TYPES
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
  | 'boolean'
  | 'textarea'
  | 'select';

/** Quick action for parameter collection */
export interface QuickAction {
  label: string;
  value: string;
}

/** Complete parameter definition */
export interface ParamDefinition {
  /** Technical name (what API expects) */
  name: string;
  /** User-friendly display name */
  displayName: string;
  /** User-friendly collection prompt */
  prompt: string;
  /** Input type for UI */
  inputType: ParamInputType;
  /** Placeholder text */
  placeholder?: string;
  /** Quick action buttons */
  quickActions?: QuickAction[];
  /** Validation pattern */
  validation?: RegExp;
  /** Aliases (user might say these instead) */
  aliases?: string[];
  /** Transform function (e.g., extract ID from URL) */
  transform?: (value: string) => string;
  /** Is this required? */
  required?: boolean;
  /** Default value if not provided */
  default?: string | number | boolean;
}

/** Alternative tool suggestion */
export interface Alternative {
  toolkit: string;
  name: string;
  description: string;
  confidence: number;
}

/** API key setup info */
export interface ApiKeyInfo {
  displayName: string;
  apiDocsUrl: string;
  steps: string[];
  keyPattern?: string;
}

/** Complete tool contract */
export interface ToolContract {
  /** Composio tool slug (e.g., GMAIL_SEND_EMAIL) */
  slug: string;
  /** Toolkit name (e.g., gmail) */
  toolkit: string;
  /** Category for grouping */
  category: ToolCategory;
  /** User-friendly display name */
  displayName: string;
  /** Description of what this tool does */
  description: string;
  /** Action verbs that map to this tool */
  actions: string[];
  /** Is this the default tool for the toolkit? */
  isDefault: boolean;
  /** Support level */
  supportLevel: SupportLevel;
  /** Required parameters */
  requiredParams: ParamDefinition[];
  /** Optional parameters */
  optionalParams?: ParamDefinition[];
}

/** Result of tool resolution */
export interface ToolResolutionResult {
  success: boolean;
  slug: string;
  contract: ToolContract;
  confidence: number;
  alternativesTried?: string[];
}

/** Support level resolution result */
export interface SupportResolution {
  level: SupportLevel;
  tool?: ToolContract;
  alternatives?: Alternative[];
  apiKeyInfo?: ApiKeyInfo;
  message: string;
}

// ================================
// UNIFIED TOOL REGISTRY DATA
// ================================

/**
 * MASTER TOOL REGISTRY
 * Consolidates all tool definitions from scattered sources
 *
 * @NEXUS-FIX-042: Complete unified registry
 */
export const UNIFIED_REGISTRY: Record<string, ToolContract[]> = {
  // ============== EMAIL ==============
  gmail: [
    {
      slug: 'GMAIL_SEND_EMAIL',
      toolkit: 'gmail',
      category: 'communication',
      displayName: 'Send Email',
      description: 'Send an email via Gmail',
      actions: ['send', 'email', 'deliver', 'mail', 'notify', 'alert'],
      isDefault: true,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'to',
          displayName: 'Recipient',
          prompt: 'Who should receive this email?',
          inputType: 'email',
          placeholder: 'email@example.com',
          quickActions: [{ label: 'Send to Myself', value: '{{user_email}}' }],
          aliases: ['recipient', 'email', 'address', 'recipient_email', 'send_to', 'destination'],
          required: true,
        },
        {
          name: 'subject',
          displayName: 'Subject',
          prompt: 'What should the subject line say?',
          inputType: 'string',
          placeholder: 'Enter subject...',
          aliases: ['title', 'email_subject'],
          required: true,
        },
        {
          name: 'body',
          displayName: 'Message',
          prompt: 'What should the email say?',
          inputType: 'textarea',
          placeholder: 'Type your email content...',
          aliases: ['message', 'content', 'text', 'email_body', 'html_body'],
          required: true,
        },
      ],
    },
    {
      slug: 'GMAIL_CREATE_EMAIL_DRAFT',
      toolkit: 'gmail',
      category: 'communication',
      displayName: 'Create Draft',
      description: 'Create an email draft in Gmail',
      actions: ['draft'],
      isDefault: false,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'to',
          displayName: 'Recipient',
          prompt: 'Who is this draft for?',
          inputType: 'email',
          placeholder: 'email@example.com',
          required: true,
        },
      ],
    },
    {
      slug: 'GMAIL_FETCH_EMAILS',
      toolkit: 'gmail',
      category: 'communication',
      displayName: 'Fetch Emails',
      description: 'Retrieve emails from Gmail',
      actions: ['fetch', 'read', 'get', 'list'],
      isDefault: false,
      supportLevel: 'native',
      requiredParams: [],
      optionalParams: [
        {
          name: 'query',
          displayName: 'Search Query',
          prompt: 'What emails to search for?',
          inputType: 'string',
          placeholder: 'from:example@gmail.com',
          aliases: ['search', 'filter'],
        },
        {
          name: 'max_results',
          displayName: 'Maximum Results',
          prompt: 'How many emails to retrieve?',
          inputType: 'number',
          placeholder: '10',
          aliases: ['limit', 'count'],
        },
      ],
    },
    {
      slug: 'GMAIL_NEW_EMAIL_TRIGGER',
      toolkit: 'gmail',
      category: 'communication',
      displayName: 'New Email Trigger',
      description: 'Trigger when new email arrives',
      actions: ['trigger', 'receive', 'capture', 'listen', 'incoming'],
      isDefault: false,
      supportLevel: 'native',
      requiredParams: [],
    },
    {
      slug: 'GMAIL_WATCH',
      toolkit: 'gmail',
      category: 'communication',
      displayName: 'Watch Inbox',
      description: 'Watch for new emails',
      actions: ['watch'],
      isDefault: false,
      supportLevel: 'native',
      requiredParams: [],
    },
  ],

  // ============== SLACK ==============
  slack: [
    {
      slug: 'SLACK_SEND_MESSAGE',
      toolkit: 'slack',
      category: 'communication',
      displayName: 'Send Slack Message',
      description: 'Post a message to a Slack channel',
      actions: ['send', 'post', 'message', 'notify', 'alert', 'chat'],
      isDefault: true,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'channel',
          displayName: 'Channel',
          prompt: 'Which Slack channel?',
          inputType: 'string',
          placeholder: '#general',
          quickActions: [
            { label: '#general', value: 'general' },
            { label: '#team', value: 'team' },
            { label: '#alerts', value: 'alerts' },
          ],
          aliases: ['channel_name', 'room', 'to', 'slack_channel', 'channel_id'],
          transform: (v) => v.startsWith('#') ? v.slice(1) : v,
          required: true,
        },
        {
          name: 'text',
          displayName: 'Message',
          prompt: 'What message should I post?',
          inputType: 'textarea',
          placeholder: 'Type your message...',
          aliases: ['message', 'content', 'body'],
          required: true,
        },
      ],
    },
    {
      slug: 'SLACK_LIST_CHANNELS',
      toolkit: 'slack',
      category: 'communication',
      displayName: 'List Channels',
      description: 'List available Slack channels',
      actions: ['list'],
      isDefault: false,
      supportLevel: 'native',
      requiredParams: [],
    },
    {
      slug: 'SLACK_FETCH_CONVERSATION_HISTORY',
      toolkit: 'slack',
      category: 'communication',
      displayName: 'Fetch Messages',
      description: 'Retrieve messages from a channel',
      actions: ['fetch', 'read', 'history'],
      isDefault: false,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'channel',
          displayName: 'Channel',
          prompt: 'Which channel to read?',
          inputType: 'string',
          placeholder: '#general',
          required: true,
        },
      ],
    },
    {
      slug: 'SLACK_NEW_MESSAGE_TRIGGER',
      toolkit: 'slack',
      category: 'communication',
      displayName: 'New Message Trigger',
      description: 'Trigger when new message arrives',
      actions: ['trigger', 'receive', 'capture', 'listen', 'incoming', 'watch'],
      isDefault: false,
      supportLevel: 'native',
      requiredParams: [],
    },
  ],

  // ============== WHATSAPP ==============
  whatsapp: [
    {
      slug: 'WHATSAPP_SEND_MESSAGE',
      toolkit: 'whatsapp',
      category: 'communication',
      displayName: 'Send WhatsApp',
      description: 'Send a WhatsApp message',
      actions: ['send', 'message', 'notify', 'text', 'alert', 'chat'],
      isDefault: true,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'to',
          displayName: 'Phone Number',
          prompt: 'Who should receive this message?',
          inputType: 'phone',
          placeholder: '+965 xxxx xxxx',
          quickActions: [{ label: 'My Phone', value: '{{user_phone}}' }],
          aliases: ['phone', 'number', 'recipient', 'phone_number'],
          required: true,
        },
        {
          name: 'message',
          displayName: 'Message',
          prompt: 'What message should I send?',
          inputType: 'textarea',
          placeholder: 'Type your message...',
          quickActions: [{ label: 'Use Email Content', value: '{{trigger.subject}}: {{trigger.body}}' }],
          aliases: ['text', 'body', 'content'],
          required: true,
        },
      ],
    },
    {
      slug: 'WHATSAPP_SEND_TEMPLATE_MESSAGE',
      toolkit: 'whatsapp',
      category: 'communication',
      displayName: 'Send Template Message',
      description: 'Send a pre-approved template message',
      actions: ['template'],
      isDefault: false,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'to',
          displayName: 'Phone Number',
          prompt: 'Who should receive this message?',
          inputType: 'phone',
          placeholder: '+965 xxxx xxxx',
          required: true,
        },
      ],
    },
    {
      slug: 'WHATSAPP_NEW_MESSAGE_TRIGGER',
      toolkit: 'whatsapp',
      category: 'communication',
      displayName: 'New Message Trigger',
      description: 'Trigger when new WhatsApp message arrives',
      actions: ['trigger', 'receive', 'capture', 'listen', 'incoming'],
      isDefault: false,
      supportLevel: 'native',
      requiredParams: [],
    },
  ],

  // ============== DISCORD ==============
  discord: [
    {
      slug: 'DISCORD_SEND_MESSAGE',
      toolkit: 'discord',
      category: 'communication',
      displayName: 'Send Discord Message',
      description: 'Send a message to a Discord channel',
      actions: ['send', 'message', 'post', 'notify', 'alert'],
      isDefault: true,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'channel_id',
          displayName: 'Channel',
          prompt: 'Which Discord channel?',
          inputType: 'string',
          placeholder: 'Channel name or ID',
          aliases: ['channel', 'room'],
          required: true,
        },
        {
          name: 'content',
          displayName: 'Message',
          prompt: 'What message should I send?',
          inputType: 'textarea',
          placeholder: 'Type your message...',
          aliases: ['message', 'text', 'body'],
          required: true,
        },
      ],
    },
    {
      slug: 'DISCORD_SEND_WEBHOOK',
      toolkit: 'discord',
      category: 'communication',
      displayName: 'Send Webhook',
      description: 'Send a message via Discord webhook',
      actions: ['webhook'],
      isDefault: false,
      supportLevel: 'native',
      requiredParams: [],
    },
  ],

  // ============== MICROSOFT TEAMS ==============
  teams: [
    {
      slug: 'TEAMS_SEND_MESSAGE',
      toolkit: 'teams',
      category: 'communication',
      displayName: 'Send Teams Message',
      description: 'Send a message to Microsoft Teams',
      actions: ['send', 'message', 'post', 'notify'],
      isDefault: true,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'channel_id',
          displayName: 'Channel',
          prompt: 'Which Teams channel?',
          inputType: 'string',
          placeholder: 'Channel name',
          required: true,
        },
        {
          name: 'content',
          displayName: 'Message',
          prompt: 'What message?',
          inputType: 'textarea',
          placeholder: 'Type your message...',
          required: true,
        },
      ],
    },
  ],

  // ============== ZOOM ==============
  zoom: [
    {
      slug: 'ZOOM_CREATE_MEETING',
      toolkit: 'zoom',
      category: 'communication',
      displayName: 'Create Meeting',
      description: 'Create a Zoom meeting',
      actions: ['create', 'schedule', 'meeting'],
      isDefault: true,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'topic',
          displayName: 'Meeting Topic',
          prompt: 'What is the meeting about?',
          inputType: 'string',
          placeholder: 'Meeting topic',
          required: true,
        },
      ],
    },
    {
      slug: 'ZOOM_LIST_MEETINGS',
      toolkit: 'zoom',
      category: 'communication',
      displayName: 'List Meetings',
      description: 'List scheduled Zoom meetings',
      actions: ['list'],
      isDefault: false,
      supportLevel: 'native',
      requiredParams: [],
    },
  ],

  // ============== GOOGLE SHEETS ==============
  googlesheets: [
    {
      slug: 'GOOGLESHEETS_BATCH_UPDATE',
      toolkit: 'googlesheets',
      category: 'productivity',
      displayName: 'Update Sheet',
      description: 'Add or update data in Google Sheets',
      // @NEXUS-FIX-022: Added create/add mappings for "Add to Sheet" workflows
      actions: ['create', 'add', 'write', 'append', 'update', 'save'],
      isDefault: true,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'spreadsheet_id',
          displayName: 'Spreadsheet',
          prompt: 'Which Google Sheet?',
          inputType: 'url',
          placeholder: 'Paste Google Sheets URL or ID...',
          quickActions: [{ label: 'Create New Sheet', value: '{{create_new}}' }],
          aliases: ['sheet_id', 'sheet', 'document', 'spreadsheet'],
          transform: (v) => {
            const match = v.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
            return match ? match[1] : v;
          },
          required: true,
        },
      ],
      optionalParams: [
        {
          name: 'range',
          displayName: 'Cell Range',
          prompt: 'Which cells?',
          inputType: 'string',
          placeholder: 'Sheet1!A:D',
          aliases: ['cells', 'cell_range'],
        },
        {
          name: 'sheet_name',
          displayName: 'Sheet Tab',
          prompt: 'Which tab?',
          inputType: 'string',
          placeholder: 'Sheet1',
          quickActions: [{ label: 'First Sheet', value: 'Sheet1' }],
        },
      ],
    },
    {
      slug: 'GOOGLESHEETS_BATCH_GET',
      toolkit: 'googlesheets',
      category: 'productivity',
      displayName: 'Read Sheet',
      description: 'Read data from Google Sheets',
      actions: ['read', 'get'],
      isDefault: false,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'spreadsheet_id',
          displayName: 'Spreadsheet',
          prompt: 'Which Google Sheet?',
          inputType: 'url',
          placeholder: 'Paste URL or ID...',
          required: true,
        },
      ],
    },
  ],

  // ============== GOOGLE CALENDAR ==============
  // @NEXUS-FIX-025: Added get/fetch/find/today actions for calendar events
  googlecalendar: [
    {
      slug: 'GOOGLECALENDAR_CREATE_EVENT',
      toolkit: 'googlecalendar',
      category: 'calendar',
      displayName: 'Create Event',
      description: 'Create a calendar event',
      actions: ['create', 'schedule'],
      isDefault: true,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'summary',
          displayName: 'Event Title',
          prompt: 'What is the event?',
          inputType: 'string',
          placeholder: 'Event title',
          aliases: ['title', 'name', 'event'],
          required: true,
        },
        {
          name: 'start_time',
          displayName: 'Start Time',
          prompt: 'When does it start?',
          inputType: 'string',
          placeholder: '2024-01-15T10:00:00',
          aliases: ['start', 'from'],
          required: true,
        },
        {
          name: 'end_time',
          displayName: 'End Time',
          prompt: 'When does it end?',
          inputType: 'string',
          placeholder: '2024-01-15T11:00:00',
          aliases: ['end', 'to'],
          required: true,
        },
      ],
    },
    {
      slug: 'GOOGLECALENDAR_EVENTS_LIST',
      toolkit: 'googlecalendar',
      category: 'calendar',
      displayName: 'List Events',
      description: 'List calendar events',
      actions: ['list', 'get', 'fetch', 'find', 'today', 'check'],
      isDefault: false,
      supportLevel: 'native',
      requiredParams: [],
    },
  ],

  // ============== GOOGLE DRIVE ==============
  googledrive: [
    {
      slug: 'GOOGLEDRIVE_UPLOAD_FILE',
      toolkit: 'googledrive',
      category: 'storage',
      displayName: 'Upload to Drive',
      description: 'Upload a file to Google Drive',
      actions: ['upload', 'save', 'store', 'write', 'put', 'backup', 'sync'],
      isDefault: true,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'name',
          displayName: 'File Name',
          prompt: 'What should the file be called?',
          inputType: 'string',
          placeholder: 'document.txt',
          aliases: ['filename', 'file_name', 'title'],
          required: true,
        },
      ],
      optionalParams: [
        {
          name: 'folder_id',
          displayName: 'Folder',
          prompt: 'Which folder?',
          inputType: 'string',
          placeholder: 'Folder ID or leave empty for root',
          aliases: ['folder', 'parent'],
        },
      ],
    },
    {
      slug: 'GOOGLEDRIVE_LIST_FILES',
      toolkit: 'googledrive',
      category: 'storage',
      displayName: 'List Drive Files',
      description: 'List files in Google Drive',
      actions: ['list'],
      isDefault: false,
      supportLevel: 'native',
      requiredParams: [],
    },
    {
      slug: 'GOOGLEDRIVE_DOWNLOAD_FILE',
      toolkit: 'googledrive',
      category: 'storage',
      displayName: 'Download from Drive',
      description: 'Download a file from Google Drive',
      actions: ['download', 'get', 'fetch'],
      isDefault: false,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'file_id',
          displayName: 'File',
          prompt: 'Which file?',
          inputType: 'string',
          required: true,
        },
      ],
    },
    {
      slug: 'GOOGLEDRIVE_CREATE_FOLDER',
      toolkit: 'googledrive',
      category: 'storage',
      displayName: 'Create Folder',
      description: 'Create a folder in Google Drive',
      actions: ['create'],
      isDefault: false,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'name',
          displayName: 'Folder Name',
          prompt: 'Folder name?',
          inputType: 'string',
          required: true,
        },
      ],
    },
  ],

  // ============== DROPBOX ==============
  // @NEXUS-FIX-017: Storage action mappings - save/store/write → upload
  dropbox: [
    {
      slug: 'DROPBOX_UPLOAD_FILE',
      toolkit: 'dropbox',
      category: 'storage',
      displayName: 'Upload to Dropbox',
      description: 'Upload or save a file to Dropbox',
      actions: ['upload', 'save', 'store', 'write', 'put', 'backup', 'sync'],
      isDefault: true,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'path',
          displayName: 'Folder Path',
          prompt: 'Which Dropbox folder?',
          inputType: 'string',
          placeholder: '/Documents/Nexus',
          quickActions: [
            { label: 'Root Folder', value: '/' },
            { label: 'Documents', value: '/Documents' },
          ],
          aliases: ['file_path', 'destination', 'folder', 'location', 'to'],
          required: true,
        },
      ],
    },
    {
      slug: 'DROPBOX_DOWNLOAD_FILE',
      toolkit: 'dropbox',
      category: 'storage',
      displayName: 'Download from Dropbox',
      description: 'Download a file from Dropbox',
      actions: ['download', 'get', 'fetch', 'retrieve', 'read'],
      isDefault: false,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'path',
          displayName: 'File Path',
          prompt: 'Which file?',
          inputType: 'string',
          aliases: ['file_path', 'file', 'source', 'from'],
          required: true,
        },
      ],
    },
    {
      slug: 'DROPBOX_LIST_FOLDER',
      toolkit: 'dropbox',
      category: 'storage',
      displayName: 'List Dropbox Folder',
      description: 'List files in a Dropbox folder',
      actions: ['list', 'show', 'display', 'browse', 'view'],
      isDefault: false,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'path',
          displayName: 'Folder',
          prompt: 'Which folder?',
          inputType: 'string',
          quickActions: [{ label: 'Root folder', value: '' }],
          required: true,
        },
      ],
    },
  ],

  // ============== ONEDRIVE ==============
  onedrive: [
    {
      slug: 'ONEDRIVE_UPLOAD_FILE',
      toolkit: 'onedrive',
      category: 'storage',
      displayName: 'Upload to OneDrive',
      description: 'Upload a file to OneDrive',
      actions: ['upload', 'save', 'store', 'write', 'put', 'backup', 'sync'],
      isDefault: true,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'path',
          displayName: 'Folder Path',
          prompt: 'Which OneDrive folder?',
          inputType: 'string',
          placeholder: '/Documents/Nexus',
          quickActions: [
            { label: 'Root Folder', value: '/' },
            { label: 'Documents', value: '/Documents' },
          ],
          aliases: ['file_path', 'destination', 'folder'],
          required: true,
        },
      ],
    },
  ],

  // ============== NOTION ==============
  notion: [
    {
      slug: 'NOTION_CREATE_PAGE',
      toolkit: 'notion',
      category: 'productivity',
      displayName: 'Create Notion Page',
      description: 'Create a new page in Notion',
      actions: ['create', 'add', 'new', 'make', 'save', 'store', 'write'],
      isDefault: true,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'parent_id',
          displayName: 'Parent Page',
          prompt: 'Where should I create the page?',
          inputType: 'url',
          placeholder: 'Paste Notion page URL...',
          aliases: ['parent', 'page_id', 'database_id'],
          required: true,
        },
        {
          name: 'title',
          displayName: 'Title',
          prompt: 'What should the title be?',
          inputType: 'string',
          aliases: ['name'],
          required: true,
        },
      ],
      optionalParams: [
        {
          name: 'content',
          displayName: 'Content',
          prompt: 'What content?',
          inputType: 'textarea',
          aliases: ['body', 'text'],
        },
      ],
    },
    {
      slug: 'NOTION_UPDATE_PAGE',
      toolkit: 'notion',
      category: 'productivity',
      displayName: 'Update Notion Page',
      description: 'Update an existing Notion page',
      actions: ['update', 'edit', 'modify', 'change'],
      isDefault: false,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'page_id',
          displayName: 'Page',
          prompt: 'Which page?',
          inputType: 'string',
          required: true,
        },
      ],
    },
  ],

  // ============== GITHUB ==============
  github: [
    {
      slug: 'GITHUB_CREATE_ISSUE',
      toolkit: 'github',
      category: 'dev',
      displayName: 'Create Issue',
      description: 'Create a GitHub issue',
      actions: ['create', 'add', 'new', 'make', 'open', 'report'],
      isDefault: true,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'owner',
          displayName: 'Repository Owner',
          prompt: 'GitHub username or organization?',
          inputType: 'string',
          placeholder: 'username or org-name',
          aliases: ['username', 'org', 'organization'],
          required: true,
        },
        {
          name: 'repo',
          displayName: 'Repository',
          prompt: 'Which repository?',
          inputType: 'string',
          placeholder: 'repository-name',
          aliases: ['repository', 'project'],
          transform: (v) => {
            const match = v.match(/github\.com\/([^\/\s]+)\/([^\/\s]+)/);
            return match ? match[2] : v;
          },
          required: true,
        },
        {
          name: 'title',
          displayName: 'Title',
          prompt: 'Issue title?',
          inputType: 'string',
          aliases: ['issue_title', 'name'],
          required: true,
        },
      ],
      optionalParams: [
        {
          name: 'body',
          displayName: 'Description',
          prompt: 'Issue description?',
          inputType: 'textarea',
          aliases: ['description', 'content'],
        },
      ],
    },
    {
      slug: 'GITHUB_LIST_ISSUES',
      toolkit: 'github',
      category: 'dev',
      displayName: 'List Issues',
      description: 'List GitHub issues',
      actions: ['list', 'get', 'show', 'view', 'fetch'],
      isDefault: false,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'owner',
          displayName: 'Repository Owner',
          prompt: 'GitHub username or organization?',
          inputType: 'string',
          required: true,
        },
        {
          name: 'repo',
          displayName: 'Repository',
          prompt: 'Which repository?',
          inputType: 'string',
          required: true,
        },
      ],
    },
  ],

  // ============== PROJECT MANAGEMENT ==============
  trello: [
    {
      slug: 'TRELLO_CREATE_CARD',
      toolkit: 'trello',
      category: 'project',
      displayName: 'Create Trello Card',
      description: 'Create a new card in Trello',
      actions: ['create', 'add', 'new', 'make'],
      isDefault: true,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'list_id',
          displayName: 'List',
          prompt: 'Which list?',
          inputType: 'string',
          aliases: ['list'],
          required: true,
        },
        {
          name: 'name',
          displayName: 'Card Name',
          prompt: 'Card name?',
          inputType: 'string',
          aliases: ['title', 'card_name'],
          required: true,
        },
      ],
      optionalParams: [
        {
          name: 'desc',
          displayName: 'Description',
          prompt: 'Description?',
          inputType: 'textarea',
          aliases: ['description', 'body'],
        },
      ],
    },
  ],

  asana: [
    {
      slug: 'ASANA_CREATE_TASK',
      toolkit: 'asana',
      category: 'project',
      displayName: 'Create Asana Task',
      description: 'Create a new task in Asana',
      actions: ['create', 'add', 'new', 'make'],
      isDefault: true,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'project_id',
          displayName: 'Project',
          prompt: 'Which Asana project?',
          inputType: 'string',
          aliases: ['project'],
          required: true,
        },
        {
          name: 'name',
          displayName: 'Task Name',
          prompt: 'Task name?',
          inputType: 'string',
          aliases: ['title', 'task_name'],
          required: true,
        },
      ],
      optionalParams: [
        {
          name: 'notes',
          displayName: 'Notes',
          prompt: 'Any notes?',
          inputType: 'textarea',
          aliases: ['description', 'body'],
        },
      ],
    },
  ],

  linear: [
    {
      slug: 'LINEAR_CREATE_ISSUE',
      toolkit: 'linear',
      category: 'project',
      displayName: 'Create Linear Issue',
      description: 'Create a new issue in Linear',
      actions: ['create', 'add', 'new', 'make'],
      isDefault: true,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'team_id',
          displayName: 'Team',
          prompt: 'Which team?',
          inputType: 'string',
          aliases: ['team'],
          required: true,
        },
        {
          name: 'title',
          displayName: 'Issue Title',
          prompt: 'Issue title?',
          inputType: 'string',
          aliases: ['name'],
          required: true,
        },
      ],
      optionalParams: [
        {
          name: 'description',
          displayName: 'Description',
          prompt: 'Description?',
          inputType: 'textarea',
          aliases: ['body', 'notes'],
        },
      ],
    },
  ],

  jira: [
    {
      slug: 'JIRA_CREATE_ISSUE',
      toolkit: 'jira',
      category: 'project',
      displayName: 'Create Jira Issue',
      description: 'Create a new issue in Jira',
      actions: ['create', 'add', 'new', 'make'],
      isDefault: true,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'project_key',
          displayName: 'Project',
          prompt: 'Which project?',
          inputType: 'string',
          aliases: ['project'],
          required: true,
        },
        {
          name: 'summary',
          displayName: 'Summary',
          prompt: 'Issue summary?',
          inputType: 'string',
          aliases: ['title', 'name'],
          required: true,
        },
        {
          name: 'issue_type',
          displayName: 'Issue Type',
          prompt: 'Issue type?',
          inputType: 'string',
          quickActions: [{ label: 'Task', value: 'Task' }],
          required: true,
        },
      ],
      optionalParams: [
        {
          name: 'description',
          displayName: 'Description',
          prompt: 'Description?',
          inputType: 'textarea',
          aliases: ['body', 'notes'],
        },
      ],
    },
  ],

  // ============== CRM ==============
  hubspot: [
    {
      slug: 'HUBSPOT_CREATE_CONTACT',
      toolkit: 'hubspot',
      category: 'crm',
      displayName: 'Create HubSpot Contact',
      description: 'Create a new contact in HubSpot',
      actions: ['create', 'add', 'new', 'make'],
      isDefault: true,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'email',
          displayName: 'Email',
          prompt: 'Contact email?',
          inputType: 'email',
          required: true,
        },
      ],
      optionalParams: [
        {
          name: 'firstname',
          displayName: 'First Name',
          prompt: 'First name?',
          inputType: 'string',
          aliases: ['first_name', 'name'],
        },
        {
          name: 'lastname',
          displayName: 'Last Name',
          prompt: 'Last name?',
          inputType: 'string',
          aliases: ['last_name'],
        },
      ],
    },
  ],

  salesforce: [
    {
      slug: 'SALESFORCE_CREATE_LEAD',
      toolkit: 'salesforce',
      category: 'crm',
      displayName: 'Create Salesforce Lead',
      description: 'Create a new lead in Salesforce',
      actions: ['create', 'add', 'new', 'make'],
      isDefault: true,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'LastName',
          displayName: 'Last Name',
          prompt: 'Last name?',
          inputType: 'string',
          aliases: ['last_name', 'name'],
          required: true,
        },
        {
          name: 'Company',
          displayName: 'Company',
          prompt: 'Company name?',
          inputType: 'string',
          aliases: ['company_name'],
          required: true,
        },
      ],
      optionalParams: [
        {
          name: 'Email',
          displayName: 'Email',
          prompt: 'Email?',
          inputType: 'email',
        },
      ],
    },
  ],

  // ============== SOCIAL ==============
  twitter: [
    {
      slug: 'TWITTER_CREATE_TWEET',
      toolkit: 'twitter',
      category: 'social',
      displayName: 'Post Tweet',
      description: 'Post a tweet to Twitter/X',
      actions: ['post', 'tweet', 'send', 'publish', 'create'],
      isDefault: true,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'text',
          displayName: 'Tweet',
          prompt: 'What should I tweet?',
          inputType: 'textarea',
          placeholder: 'Max 280 characters...',
          aliases: ['message', 'content', 'body', 'tweet'],
          required: true,
        },
      ],
    },
  ],

  linkedin: [
    {
      slug: 'LINKEDIN_CREATE_POST',
      toolkit: 'linkedin',
      category: 'social',
      displayName: 'Post to LinkedIn',
      description: 'Create a post on LinkedIn',
      actions: ['post', 'share', 'publish', 'create'],
      isDefault: true,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'text',
          displayName: 'Post',
          prompt: 'What should I post?',
          inputType: 'textarea',
          aliases: ['content', 'body', 'message'],
          required: true,
        },
      ],
    },
  ],

  // ============== PAYMENTS ==============
  stripe: [
    {
      slug: 'STRIPE_CREATE_INVOICE',
      toolkit: 'stripe',
      category: 'payment',
      displayName: 'Create Invoice',
      description: 'Create an invoice in Stripe',
      actions: ['create', 'send', 'generate', 'make'],
      isDefault: true,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'customer',
          displayName: 'Customer',
          prompt: 'Which customer?',
          inputType: 'string',
          aliases: ['customer_id', 'client'],
          required: true,
        },
      ],
    },
  ],

  // ============== AI ==============
  openai: [
    {
      slug: 'OPENAI_CHAT_COMPLETION',
      toolkit: 'openai',
      category: 'ai',
      displayName: 'Chat with OpenAI',
      description: 'Generate text using OpenAI',
      actions: ['generate', 'create', 'ask', 'chat', 'complete'],
      isDefault: true,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'prompt',
          displayName: 'Prompt',
          prompt: 'What should I ask?',
          inputType: 'textarea',
          aliases: ['message', 'input', 'query'],
          required: true,
        },
      ],
    },
  ],

  // ============== AIRTABLE ==============
  airtable: [
    {
      slug: 'AIRTABLE_CREATE_RECORD',
      toolkit: 'airtable',
      category: 'productivity',
      displayName: 'Create Airtable Record',
      description: 'Add a new record to an Airtable base',
      actions: ['create', 'add', 'new', 'insert', 'save', 'store'],
      isDefault: true,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'base_id',
          displayName: 'Base',
          prompt: 'Which Airtable base?',
          inputType: 'string',
          aliases: ['base'],
          required: true,
        },
        {
          name: 'table_name',
          displayName: 'Table',
          prompt: 'Which table?',
          inputType: 'string',
          aliases: ['table'],
          required: true,
        },
      ],
    },
  ],

  // ============== GITLAB ==============
  gitlab: [
    {
      slug: 'GITLAB_CREATE_ISSUE',
      toolkit: 'gitlab',
      category: 'dev',
      displayName: 'Create GitLab Issue',
      description: 'Create a new issue on GitLab',
      actions: ['create', 'add', 'new', 'make'],
      isDefault: true,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'project_id',
          displayName: 'Project',
          prompt: 'Which project?',
          inputType: 'string',
          aliases: ['project'],
          required: true,
        },
        {
          name: 'title',
          displayName: 'Title',
          prompt: 'Issue title?',
          inputType: 'string',
          aliases: ['name'],
          required: true,
        },
      ],
    },
  ],

  // ============== TELEGRAM ==============
  telegram: [
    {
      slug: 'TELEGRAM_SEND_MESSAGE',
      toolkit: 'telegram',
      category: 'communication',
      displayName: 'Send Telegram Message',
      description: 'Send a message via Telegram',
      actions: ['send', 'message', 'notify', 'text', 'alert'],
      isDefault: true,
      supportLevel: 'native',
      requiredParams: [
        {
          name: 'chat_id',
          displayName: 'Chat',
          prompt: 'Which chat?',
          inputType: 'string',
          aliases: ['chat', 'to', 'recipient'],
          required: true,
        },
        {
          name: 'text',
          displayName: 'Message',
          prompt: 'What message?',
          inputType: 'textarea',
          aliases: ['message', 'body', 'content'],
          required: true,
        },
      ],
    },
  ],
};

// ================================
// INTEGRATION ALIASES
// ================================

/**
 * Maps common names/typos to canonical toolkit names
 */
export const TOOLKIT_ALIASES: Record<string, string> = {
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
  'microsoft teams': 'teams',
};

// ================================
// ALTERNATIVE MAPPINGS
// ================================

/**
 * Fallback alternatives when a toolkit isn't supported
 */
export const ALTERNATIVES: Record<string, Alternative[]> = {
  tally: [
    { toolkit: 'zoho_books', name: 'Zoho Books', description: 'Full accounting software', confidence: 0.85 },
    { toolkit: 'xero', name: 'Xero', description: 'Cloud accounting', confidence: 0.85 },
    { toolkit: 'quickbooks', name: 'QuickBooks', description: 'Popular accounting', confidence: 0.8 },
    { toolkit: 'gmail', name: 'Email', description: 'Send data via email', confidence: 0.5 },
  ],
  wave: [
    { toolkit: 'zoho_books', name: 'Zoho Books', description: 'Full accounting', confidence: 0.85 },
    { toolkit: 'xero', name: 'Xero', description: 'Cloud accounting', confidence: 0.85 },
    { toolkit: 'quickbooks', name: 'QuickBooks', description: 'Popular accounting', confidence: 0.8 },
  ],
  knet: [
    { toolkit: 'tap', name: 'Tap Payments', description: 'Supports KNET in Kuwait', confidence: 0.9 },
    { toolkit: 'stripe', name: 'Stripe', description: 'Global payments', confidence: 0.7 },
  ],
  sap: [
    { toolkit: 'odoo', name: 'Odoo', description: 'Open-source ERP', confidence: 0.6 },
    { toolkit: 'googlesheets', name: 'Google Sheets', description: 'Export data to sheets', confidence: 0.5 },
  ],
};

// ================================
// API KEY APPS
// ================================

/**
 * Apps that can be connected via API key
 */
export const API_KEY_APPS: Record<string, ApiKeyInfo> = {
  wave: {
    displayName: 'Wave Accounting',
    apiDocsUrl: 'https://developer.waveapps.com/hc/en-us/articles/360019968212-API-Key',
    steps: [
      'Go to Wave Settings  Integrations',
      'Click "API & Webhooks"',
      'Click "Create API Key"',
      'Copy your API key and paste below',
    ],
    keyPattern: '^[A-Za-z0-9_-]{32,64}$',
  },
  freshbooks: {
    displayName: 'FreshBooks',
    apiDocsUrl: 'https://www.freshbooks.com/api',
    steps: [
      'Go to FreshBooks Settings  Developer Portal',
      'Create a new application',
      'Copy your Client ID and Secret',
    ],
  },
};

// ================================
// SERVICE CLASS
// ================================

/**
 * UnifiedToolRegistryService - Central service for all tool resolution
 *
 * @NEXUS-FIX-042: Single source of truth for tools
 */
export class UnifiedToolRegistryService {

  /**
   * Normalize a toolkit name to its canonical form
   */
  static normalizeToolkit(toolkit: string): string {
    const lower = toolkit.toLowerCase().trim();
    return TOOLKIT_ALIASES[lower] || lower;
  }

  /**
   * Resolve a tool contract from toolkit + action
   *
   * @param toolkit - Toolkit name (e.g., 'gmail', 'slack')
   * @param action - Action verb (e.g., 'send', 'create', 'upload')
   * @param nodeName - Optional node name for additional context
   * @returns ToolResolutionResult or null if not found
   */
  static resolveToolContract(
    toolkit: string,
    action: string = '',
    nodeName: string = ''
  ): ToolResolutionResult | null {
    const normalized = this.normalizeToolkit(toolkit);
    const tools = UNIFIED_REGISTRY[normalized];

    if (!tools?.length) {
      return null;
    }

    const actionLower = action.toLowerCase();

    // Step 1: Try exact action match
    if (actionLower) {
      for (const tool of tools) {
        if (tool.actions.includes(actionLower)) {
          return {
            success: true,
            slug: tool.slug,
            contract: tool,
            confidence: 0.95,
          };
        }
      }
    }

    // Step 2: Try matching from node name
    if (nodeName) {
      const nodeWords = nodeName.toLowerCase().split(/[\s_-]+/);
      for (const tool of tools) {
        const matchingAction = tool.actions.find(a => nodeWords.includes(a));
        if (matchingAction) {
          return {
            success: true,
            slug: tool.slug,
            contract: tool,
            confidence: 0.85,
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
        contract: defaultTool,
        confidence: 0.7,
      };
    }

    // Step 4: Return first tool as fallback
    return {
      success: true,
      slug: tools[0].slug,
      contract: tools[0],
      confidence: 0.5,
    };
  }

  /**
   * Get tool contract by exact slug
   */
  static getContractBySlug(slug: string): ToolContract | null {
    for (const tools of Object.values(UNIFIED_REGISTRY)) {
      const tool = tools.find(t => t.slug === slug);
      if (tool) return tool;
    }
    return null;
  }

  /**
   * Get all tools for a toolkit
   */
  static getToolsForToolkit(toolkit: string): ToolContract[] {
    const normalized = this.normalizeToolkit(toolkit);
    return UNIFIED_REGISTRY[normalized] || [];
  }

  /**
   * Get required parameters for a tool
   */
  static getRequiredParams(contract: ToolContract): ParamDefinition[] {
    return contract.requiredParams.filter(p => p.required !== false);
  }

  /**
   * Get all parameters (required + optional)
   */
  static getAllParams(contract: ToolContract): ParamDefinition[] {
    return [...contract.requiredParams, ...(contract.optionalParams || [])];
  }

  /**
   * Resolve a parameter alias to its canonical name
   */
  static resolveParamAlias(contract: ToolContract, paramName: string): string {
    const lower = paramName.toLowerCase();

    // Check in required params
    for (const param of contract.requiredParams) {
      if (param.name === lower) return param.name;
      if (param.aliases?.includes(lower)) return param.name;
    }

    // Check in optional params
    for (const param of contract.optionalParams || []) {
      if (param.name === lower) return param.name;
      if (param.aliases?.includes(lower)) return param.name;
    }

    return paramName;
  }

  /**
   * Get param definition by name or alias
   */
  static getParamDefinition(contract: ToolContract, paramName: string): ParamDefinition | null {
    const canonicalName = this.resolveParamAlias(contract, paramName);

    const required = contract.requiredParams.find(p => p.name === canonicalName);
    if (required) return required;

    const optional = (contract.optionalParams || []).find(p => p.name === canonicalName);
    if (optional) return optional;

    return null;
  }

  /**
   * Transform a parameter value using its defined transformer
   */
  static transformParam(contract: ToolContract, paramName: string, value: string): string {
    const param = this.getParamDefinition(contract, paramName);
    if (param?.transform) {
      return param.transform(value);
    }
    return value;
  }

  /**
   * Resolve support level for a toolkit
   */
  static resolveSupportLevel(toolkit: string): SupportResolution {
    const normalized = this.normalizeToolkit(toolkit);

    // Tier 1: Native Composio support
    const nativeTools = UNIFIED_REGISTRY[normalized];
    if (nativeTools?.some(t => t.supportLevel === 'native')) {
      const defaultTool = nativeTools.find(t => t.isDefault && t.supportLevel === 'native');
      return {
        level: 'native',
        tool: defaultTool || nativeTools.find(t => t.supportLevel === 'native'),
        message: `${toolkit} is fully supported with one-click connection.`,
      };
    }

    // Tier 2: API Key support
    const apiInfo = API_KEY_APPS[normalized];
    if (apiInfo) {
      return {
        level: 'api_key',
        apiKeyInfo: apiInfo,
        message: `${apiInfo.displayName} can be connected with your API key.`,
      };
    }

    // Tier 3: Alternatives available
    const alternatives = ALTERNATIVES[normalized];
    if (alternatives?.length) {
      return {
        level: 'alternative',
        alternatives,
        message: `${toolkit} isn't directly supported, but here are some alternatives...`,
      };
    }

    // Tier 4: Unsupported
    return {
      level: 'unsupported',
      message: `${toolkit} isn't available yet. We're always adding new integrations!`,
      alternatives: [
        { toolkit: 'gmail', name: 'Email', description: 'Send data via email instead', confidence: 0.5 },
      ],
    };
  }

  /**
   * Check if a toolkit is supported at any tier
   */
  static isSupported(toolkit: string): boolean {
    const resolution = this.resolveSupportLevel(toolkit);
    return resolution.level !== 'unsupported';
  }

  /**
   * Get all supported toolkit names
   */
  static getAllSupportedToolkits(): string[] {
    return Object.keys(UNIFIED_REGISTRY);
  }

  /**
   * Get toolkits by category
   */
  static getToolkitsByCategory(category: ToolCategory): string[] {
    const toolkits: string[] = [];

    for (const [toolkit, tools] of Object.entries(UNIFIED_REGISTRY)) {
      if (tools.some(t => t.category === category)) {
        toolkits.push(toolkit);
      }
    }

    return toolkits;
  }

  /**
   * Map collected params to tool params using the contract
   * This replaces the scattered mapping logic
   */
  static mapCollectedParams(
    contract: ToolContract,
    collected: Record<string, string>
  ): Record<string, string> {
    const mapped: Record<string, string> = {};

    for (const [key, value] of Object.entries(collected)) {
      // Resolve alias to canonical name
      const canonicalName = this.resolveParamAlias(contract, key);

      // Apply any transformation
      const transformedValue = this.transformParam(contract, canonicalName, value);

      mapped[canonicalName] = transformedValue;
    }

    return mapped;
  }
}

// ================================
// CONVENIENCE EXPORTS
// ================================

export const resolveToolContract = UnifiedToolRegistryService.resolveToolContract.bind(UnifiedToolRegistryService);
export const getContractBySlug = UnifiedToolRegistryService.getContractBySlug.bind(UnifiedToolRegistryService);
export const normalizeToolkit = UnifiedToolRegistryService.normalizeToolkit.bind(UnifiedToolRegistryService);

export default UnifiedToolRegistryService;
