/**
 * Workflow Presets
 *
 * Pre-defined triggers and actions for the conversational workflow creator.
 */

import type { PresetTrigger, PresetAction, ConfigField } from './workflow-creator-types'

// ============================================================================
// Common Config Fields
// ============================================================================

const CHANNEL_FIELD: ConfigField = {
  id: 'channel',
  name: 'Channel',
  type: 'text',
  required: true,
  placeholder: '#general',
  description: 'The channel to post to',
}

const MESSAGE_FIELD: ConfigField = {
  id: 'message',
  name: 'Message',
  type: 'textarea',
  required: true,
  placeholder: 'Enter your message...',
  description: 'The message content',
}

const EMAIL_TO_FIELD: ConfigField = {
  id: 'to',
  name: 'To',
  type: 'text',
  required: true,
  placeholder: 'recipient@example.com',
  description: 'Recipient email address',
}

const EMAIL_SUBJECT_FIELD: ConfigField = {
  id: 'subject',
  name: 'Subject',
  type: 'text',
  required: true,
  placeholder: 'Email subject',
}

const EMAIL_BODY_FIELD: ConfigField = {
  id: 'body',
  name: 'Body',
  type: 'textarea',
  required: true,
  placeholder: 'Email content...',
}

const SPREADSHEET_FIELD: ConfigField = {
  id: 'spreadsheetId',
  name: 'Spreadsheet',
  type: 'text',
  required: true,
  placeholder: 'Spreadsheet URL or ID',
}

const SHEET_FIELD: ConfigField = {
  id: 'sheetName',
  name: 'Sheet Name',
  type: 'text',
  required: false,
  placeholder: 'Sheet1',
  defaultValue: 'Sheet1',
}

const REPOSITORY_FIELD: ConfigField = {
  id: 'repository',
  name: 'Repository',
  type: 'text',
  required: true,
  placeholder: 'owner/repo',
  description: 'GitHub repository (owner/repo format)',
}

// ============================================================================
// Preset Triggers
// ============================================================================

export const PRESET_TRIGGERS: PresetTrigger[] = [
  // GitHub Triggers
  {
    id: 'github-new-issue',
    integration: 'github',
    type: 'new_issue',
    name: 'New GitHub Issue',
    description: 'Triggers when a new issue is created in a repository',
    icon: '🐙',
    popular: true,
    configFields: [
      REPOSITORY_FIELD,
      {
        id: 'labels',
        name: 'Labels',
        type: 'text',
        required: false,
        placeholder: 'bug, enhancement',
        description: 'Filter by labels (comma-separated)',
      },
    ],
  },
  {
    id: 'github-new-pr',
    integration: 'github',
    type: 'new_pr',
    name: 'New Pull Request',
    description: 'Triggers when a new pull request is opened',
    icon: '🔀',
    popular: true,
    configFields: [
      REPOSITORY_FIELD,
      {
        id: 'baseBranch',
        name: 'Base Branch',
        type: 'text',
        required: false,
        placeholder: 'main',
      },
    ],
  },
  {
    id: 'github-push',
    integration: 'github',
    type: 'push',
    name: 'Code Push',
    description: 'Triggers when code is pushed to a branch',
    icon: '📤',
    popular: false,
    configFields: [
      REPOSITORY_FIELD,
      {
        id: 'branch',
        name: 'Branch',
        type: 'text',
        required: false,
        placeholder: 'main',
      },
    ],
  },

  // Slack Triggers
  {
    id: 'slack-new-message',
    integration: 'slack',
    type: 'new_message',
    name: 'New Slack Message',
    description: 'Triggers when a message is posted to a channel',
    icon: '💬',
    popular: true,
    configFields: [
      CHANNEL_FIELD,
      {
        id: 'keywords',
        name: 'Keywords',
        type: 'text',
        required: false,
        placeholder: 'urgent, help',
        description: 'Filter by keywords (comma-separated)',
      },
    ],
  },
  {
    id: 'slack-mention',
    integration: 'slack',
    type: 'mention',
    name: 'User Mentioned',
    description: 'Triggers when you or a bot is mentioned',
    icon: '@',
    popular: false,
    configFields: [CHANNEL_FIELD],
  },

  // Email Triggers
  {
    id: 'gmail-new-email',
    integration: 'gmail',
    type: 'new_email',
    name: 'New Email Received',
    description: 'Triggers when a new email arrives in your inbox',
    icon: '📧',
    popular: true,
    configFields: [
      {
        id: 'from',
        name: 'From',
        type: 'text',
        required: false,
        placeholder: 'sender@example.com',
        description: 'Filter by sender',
      },
      {
        id: 'subject',
        name: 'Subject Contains',
        type: 'text',
        required: false,
        placeholder: 'Invoice',
        description: 'Filter by subject keywords',
      },
      {
        id: 'label',
        name: 'Label',
        type: 'text',
        required: false,
        placeholder: 'INBOX',
      },
    ],
  },

  // Calendar Triggers
  {
    id: 'calendar-new-event',
    integration: 'calendar',
    type: 'new_event',
    name: 'New Calendar Event',
    description: 'Triggers when a new event is added to your calendar',
    icon: '📅',
    popular: true,
    configFields: [
      {
        id: 'calendarId',
        name: 'Calendar',
        type: 'text',
        required: false,
        placeholder: 'primary',
        defaultValue: 'primary',
      },
    ],
  },
  {
    id: 'calendar-event-start',
    integration: 'calendar',
    type: 'event_start',
    name: 'Event Starting Soon',
    description: 'Triggers before a calendar event starts',
    icon: '⏰',
    popular: false,
    configFields: [
      {
        id: 'minutesBefore',
        name: 'Minutes Before',
        type: 'number',
        required: true,
        placeholder: '15',
        defaultValue: 15,
      },
    ],
  },

  // Schedule Triggers
  {
    id: 'schedule-recurring',
    integration: 'schedule',
    type: 'recurring',
    name: 'Scheduled Time',
    description: 'Triggers on a recurring schedule',
    icon: '🔄',
    popular: true,
    configFields: [
      {
        id: 'frequency',
        name: 'Frequency',
        type: 'select',
        required: true,
        options: [
          { value: 'hourly', label: 'Every hour' },
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'monthly', label: 'Monthly' },
        ],
        defaultValue: 'daily',
      },
      {
        id: 'time',
        name: 'Time',
        type: 'text',
        required: false,
        placeholder: '09:00',
        description: 'Time of day (HH:MM)',
      },
      {
        id: 'timezone',
        name: 'Timezone',
        type: 'text',
        required: false,
        placeholder: 'America/New_York',
        defaultValue: 'UTC',
      },
    ],
  },

  // Webhook Trigger
  {
    id: 'webhook-custom',
    integration: 'webhook',
    type: 'custom_webhook',
    name: 'Custom Webhook',
    description: 'Triggers when a webhook URL receives a request',
    icon: '🔗',
    popular: true,
    configFields: [
      {
        id: 'method',
        name: 'HTTP Method',
        type: 'select',
        required: true,
        options: [
          { value: 'POST', label: 'POST' },
          { value: 'GET', label: 'GET' },
          { value: 'PUT', label: 'PUT' },
        ],
        defaultValue: 'POST',
      },
    ],
  },

  // Form Trigger
  {
    id: 'forms-submit',
    integration: 'forms',
    type: 'form_submit',
    name: 'Form Submission',
    description: 'Triggers when a form is submitted',
    icon: '📋',
    popular: false,
    configFields: [
      {
        id: 'formId',
        name: 'Form ID',
        type: 'text',
        required: true,
        placeholder: 'form-123',
      },
    ],
  },

  // CRM Trigger
  {
    id: 'crm-new-contact',
    integration: 'crm',
    type: 'new_contact',
    name: 'New Lead/Contact',
    description: 'Triggers when a new lead or contact is added',
    icon: '👤',
    popular: true,
    configFields: [
      {
        id: 'source',
        name: 'Source',
        type: 'text',
        required: false,
        placeholder: 'Website',
        description: 'Filter by lead source',
      },
    ],
  },

  // Payment Trigger
  {
    id: 'stripe-payment',
    integration: 'stripe',
    type: 'payment_received',
    name: 'Payment Received',
    description: 'Triggers when a Stripe payment is completed',
    icon: '💳',
    popular: false,
    configFields: [
      {
        id: 'minAmount',
        name: 'Minimum Amount',
        type: 'number',
        required: false,
        placeholder: '100',
        description: 'Minimum payment amount (in cents)',
      },
    ],
  },
]

// ============================================================================
// Preset Actions
// ============================================================================

export const PRESET_ACTIONS: PresetAction[] = [
  // Slack Actions
  {
    id: 'slack-send-message',
    integration: 'slack',
    type: 'send_message',
    name: 'Send Slack Message',
    description: 'Post a message to a Slack channel',
    icon: '💬',
    popular: true,
    configFields: [CHANNEL_FIELD, MESSAGE_FIELD],
  },
  {
    id: 'slack-send-dm',
    integration: 'slack',
    type: 'send_dm',
    name: 'Send Direct Message',
    description: 'Send a direct message to a Slack user',
    icon: '📩',
    popular: false,
    configFields: [
      {
        id: 'userId',
        name: 'User',
        type: 'text',
        required: true,
        placeholder: '@username',
      },
      MESSAGE_FIELD,
    ],
  },

  // Email Actions
  {
    id: 'gmail-send-email',
    integration: 'gmail',
    type: 'send_email',
    name: 'Send Email',
    description: 'Send an email via Gmail',
    icon: '📧',
    popular: true,
    configFields: [EMAIL_TO_FIELD, EMAIL_SUBJECT_FIELD, EMAIL_BODY_FIELD],
  },
  {
    id: 'gmail-reply',
    integration: 'gmail',
    type: 'reply_email',
    name: 'Reply to Email',
    description: 'Send a reply to an email thread',
    icon: '↩️',
    popular: false,
    configFields: [
      {
        id: 'threadId',
        name: 'Thread ID',
        type: 'text',
        required: true,
        placeholder: 'From trigger data',
      },
      EMAIL_BODY_FIELD,
    ],
  },

  // Google Sheets Actions
  {
    id: 'sheets-add-row',
    integration: 'sheets',
    type: 'add_row',
    name: 'Add Row to Sheet',
    description: 'Append a new row to a Google Sheet',
    icon: '📊',
    popular: true,
    configFields: [
      SPREADSHEET_FIELD,
      SHEET_FIELD,
      {
        id: 'values',
        name: 'Row Values',
        type: 'textarea',
        required: true,
        placeholder: 'Value1, Value2, Value3',
        description: 'Comma-separated values for the row',
      },
    ],
  },
  {
    id: 'sheets-update-row',
    integration: 'sheets',
    type: 'update_row',
    name: 'Update Sheet Row',
    description: 'Update an existing row in a Google Sheet',
    icon: '✏️',
    popular: false,
    configFields: [
      SPREADSHEET_FIELD,
      SHEET_FIELD,
      {
        id: 'range',
        name: 'Cell Range',
        type: 'text',
        required: true,
        placeholder: 'A1:D1',
      },
      {
        id: 'values',
        name: 'New Values',
        type: 'textarea',
        required: true,
        placeholder: 'Value1, Value2',
      },
    ],
  },

  // Notion Actions
  {
    id: 'notion-create-page',
    integration: 'notion',
    type: 'create_page',
    name: 'Create Notion Page',
    description: 'Create a new page in Notion',
    icon: '📝',
    popular: true,
    configFields: [
      {
        id: 'parentId',
        name: 'Parent Page/Database',
        type: 'text',
        required: true,
        placeholder: 'Page or database ID',
      },
      {
        id: 'title',
        name: 'Title',
        type: 'text',
        required: true,
        placeholder: 'Page title',
      },
      {
        id: 'content',
        name: 'Content',
        type: 'textarea',
        required: false,
        placeholder: 'Page content (markdown)',
      },
    ],
  },
  {
    id: 'notion-add-database-item',
    integration: 'notion',
    type: 'add_database_item',
    name: 'Add to Notion Database',
    description: 'Add a new item to a Notion database',
    icon: '📋',
    popular: false,
    configFields: [
      {
        id: 'databaseId',
        name: 'Database ID',
        type: 'text',
        required: true,
        placeholder: 'Database ID',
      },
      {
        id: 'properties',
        name: 'Properties',
        type: 'json',
        required: true,
        placeholder: '{"Name": "Value"}',
      },
    ],
  },

  // Trello Actions
  {
    id: 'trello-create-card',
    integration: 'trello',
    type: 'create_card',
    name: 'Create Trello Card',
    description: 'Create a new card on a Trello board',
    icon: '🗂️',
    popular: true,
    configFields: [
      {
        id: 'listId',
        name: 'List',
        type: 'text',
        required: true,
        placeholder: 'List ID or name',
      },
      {
        id: 'name',
        name: 'Card Name',
        type: 'text',
        required: true,
        placeholder: 'Card title',
      },
      {
        id: 'description',
        name: 'Description',
        type: 'textarea',
        required: false,
        placeholder: 'Card description',
      },
    ],
  },

  // Task Actions
  {
    id: 'tasks-create-task',
    integration: 'tasks',
    type: 'create_task',
    name: 'Create Task',
    description: 'Create a new task in your task manager',
    icon: '✅',
    popular: true,
    configFields: [
      {
        id: 'title',
        name: 'Task Title',
        type: 'text',
        required: true,
        placeholder: 'Task name',
      },
      {
        id: 'dueDate',
        name: 'Due Date',
        type: 'text',
        required: false,
        placeholder: 'YYYY-MM-DD',
      },
      {
        id: 'priority',
        name: 'Priority',
        type: 'select',
        required: false,
        options: [
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
        ],
        defaultValue: 'medium',
      },
    ],
  },

  // Twitter/X Actions
  {
    id: 'twitter-post',
    integration: 'twitter',
    type: 'post_tweet',
    name: 'Post to X/Twitter',
    description: 'Post a new tweet',
    icon: '🐦',
    popular: false,
    configFields: [
      {
        id: 'text',
        name: 'Tweet Text',
        type: 'textarea',
        required: true,
        placeholder: 'What\'s happening?',
        description: 'Maximum 280 characters',
      },
    ],
  },

  // AI Actions
  {
    id: 'ai-summarize',
    integration: 'ai',
    type: 'summarize',
    name: 'AI Summarize',
    description: 'Generate an AI summary of the content',
    icon: '🤖',
    popular: true,
    configFields: [
      {
        id: 'content',
        name: 'Content to Summarize',
        type: 'textarea',
        required: true,
        placeholder: 'Content from previous step',
      },
      {
        id: 'maxLength',
        name: 'Max Length',
        type: 'number',
        required: false,
        placeholder: '200',
        defaultValue: 200,
        description: 'Maximum summary length in words',
      },
    ],
  },
  {
    id: 'ai-analyze',
    integration: 'ai',
    type: 'analyze',
    name: 'AI Analyze',
    description: 'Analyze content using AI',
    icon: '🔍',
    popular: true,
    configFields: [
      {
        id: 'content',
        name: 'Content to Analyze',
        type: 'textarea',
        required: true,
        placeholder: 'Content from previous step',
      },
      {
        id: 'analysisType',
        name: 'Analysis Type',
        type: 'select',
        required: true,
        options: [
          { value: 'sentiment', label: 'Sentiment Analysis' },
          { value: 'entities', label: 'Entity Extraction' },
          { value: 'classification', label: 'Classification' },
          { value: 'custom', label: 'Custom Analysis' },
        ],
        defaultValue: 'sentiment',
      },
    ],
  },
  {
    id: 'ai-translate',
    integration: 'ai',
    type: 'translate',
    name: 'AI Translate',
    description: 'Translate content to another language',
    icon: '🌐',
    popular: false,
    configFields: [
      {
        id: 'content',
        name: 'Content to Translate',
        type: 'textarea',
        required: true,
        placeholder: 'Content from previous step',
      },
      {
        id: 'targetLanguage',
        name: 'Target Language',
        type: 'select',
        required: true,
        options: [
          { value: 'es', label: 'Spanish' },
          { value: 'fr', label: 'French' },
          { value: 'de', label: 'German' },
          { value: 'zh', label: 'Chinese' },
          { value: 'ja', label: 'Japanese' },
          { value: 'pt', label: 'Portuguese' },
        ],
      },
    ],
  },
  {
    id: 'ai-generate',
    integration: 'ai',
    type: 'generate',
    name: 'AI Generate Content',
    description: 'Generate content using AI',
    icon: '✨',
    popular: true,
    configFields: [
      {
        id: 'prompt',
        name: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Write a professional response to...',
      },
      {
        id: 'tone',
        name: 'Tone',
        type: 'select',
        required: false,
        options: [
          { value: 'professional', label: 'Professional' },
          { value: 'friendly', label: 'Friendly' },
          { value: 'formal', label: 'Formal' },
          { value: 'casual', label: 'Casual' },
        ],
        defaultValue: 'professional',
      },
    ],
  },

  // HTTP/API Actions
  {
    id: 'http-request',
    integration: 'http',
    type: 'http_request',
    name: 'HTTP Request',
    description: 'Make an HTTP request to any API',
    icon: '🌐',
    popular: false,
    configFields: [
      {
        id: 'url',
        name: 'URL',
        type: 'text',
        required: true,
        placeholder: 'https://api.example.com/endpoint',
      },
      {
        id: 'method',
        name: 'Method',
        type: 'select',
        required: true,
        options: [
          { value: 'GET', label: 'GET' },
          { value: 'POST', label: 'POST' },
          { value: 'PUT', label: 'PUT' },
          { value: 'DELETE', label: 'DELETE' },
          { value: 'PATCH', label: 'PATCH' },
        ],
        defaultValue: 'POST',
      },
      {
        id: 'headers',
        name: 'Headers',
        type: 'json',
        required: false,
        placeholder: '{"Authorization": "Bearer token"}',
      },
      {
        id: 'body',
        name: 'Body',
        type: 'json',
        required: false,
        placeholder: '{"key": "value"}',
      },
    ],
  },

  // Delay Action
  {
    id: 'delay-wait',
    integration: 'system',
    type: 'delay',
    name: 'Wait/Delay',
    description: 'Pause the workflow for a specified time',
    icon: '⏱️',
    popular: false,
    configFields: [
      {
        id: 'duration',
        name: 'Duration',
        type: 'number',
        required: true,
        placeholder: '5',
      },
      {
        id: 'unit',
        name: 'Unit',
        type: 'select',
        required: true,
        options: [
          { value: 'seconds', label: 'Seconds' },
          { value: 'minutes', label: 'Minutes' },
          { value: 'hours', label: 'Hours' },
          { value: 'days', label: 'Days' },
        ],
        defaultValue: 'minutes',
      },
    ],
  },
]

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get popular triggers
 */
export function getPopularTriggers(): PresetTrigger[] {
  return PRESET_TRIGGERS.filter(t => t.popular)
}

/**
 * Get popular actions
 */
export function getPopularActions(): PresetAction[] {
  return PRESET_ACTIONS.filter(a => a.popular)
}

/**
 * Get triggers by integration
 */
export function getTriggersByIntegration(integration: string): PresetTrigger[] {
  return PRESET_TRIGGERS.filter(t => t.integration === integration)
}

/**
 * Get actions by integration
 */
export function getActionsByIntegration(integration: string): PresetAction[] {
  return PRESET_ACTIONS.filter(a => a.integration === integration)
}

/**
 * Get all unique integrations from triggers
 */
export function getTriggerIntegrations(): string[] {
  return [...new Set(PRESET_TRIGGERS.map(t => t.integration))]
}

/**
 * Get all unique integrations from actions
 */
export function getActionIntegrations(): string[] {
  return [...new Set(PRESET_ACTIONS.map(a => a.integration))]
}

/**
 * Search triggers by keyword
 */
export function searchTriggers(query: string): PresetTrigger[] {
  const lowerQuery = query.toLowerCase()
  return PRESET_TRIGGERS.filter(t =>
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.integration.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Search actions by keyword
 */
export function searchActions(query: string): PresetAction[] {
  const lowerQuery = query.toLowerCase()
  return PRESET_ACTIONS.filter(a =>
    a.name.toLowerCase().includes(lowerQuery) ||
    a.description.toLowerCase().includes(lowerQuery) ||
    a.integration.toLowerCase().includes(lowerQuery)
  )
}
