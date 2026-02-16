/**
 * WorkflowPreviewCard Constants
 *
 * All constant objects used by WorkflowPreviewCard: TOOL_SLUGS, ACTION_KEYWORDS,
 * statusColors, integrationIcons, PARAM_ALIASES, etc.
 * Extracted for code organization - all @NEXUS-FIX markers preserved.
 */

import type { NodeStatus } from './wpc-types'

// ============================================================================
// Status Colors & Icons
// ============================================================================

export const statusColors: Record<NodeStatus, { bg: string; border: string; dot: string; line: string }> = {
  idle: { bg: 'bg-slate-800', border: 'border-slate-600', dot: 'bg-slate-500', line: 'bg-slate-600' },
  pending: { bg: 'bg-slate-700', border: 'border-slate-500', dot: 'bg-slate-400', line: 'bg-slate-500' },
  connecting: { bg: 'bg-amber-900/30', border: 'border-amber-500', dot: 'bg-amber-500', line: 'bg-amber-500' },
  success: { bg: 'bg-emerald-900/30', border: 'border-emerald-500', dot: 'bg-emerald-500', line: 'bg-emerald-500' },
  error: { bg: 'bg-red-900/30', border: 'border-red-500', dot: 'bg-red-500', line: 'bg-red-500' },
}

export const integrationIcons: Record<string, string> = {
  gmail: '📧',
  slack: '💬',
  sheets: '📊',
  google_sheets: '📊',
  drive: '📁',
  google_drive: '📁',
  calendar: '📅',
  google_calendar: '📅',
  notion: '📝',
  hubspot: '🔶',
  salesforce: '☁️',
  zapier: '⚡',
  webhook: '🔗',
  api: '🔌',
  github: '🐙',
  trello: '📋',
  asana: '✅',
  knet: '💳',
  myfatoorah: '💳',
  default: '⚙️',
}

export function getIcon(integration?: string): string {
  if (!integration) return integrationIcons.default
  const key = integration.toLowerCase().replace(/\s+/g, '_')
  return integrationIcons[key] || integrationIcons.default
}

// ============================================================================
// @NEXUS-FIX-103: Semantic parameter aliases for deduplication - DO NOT REMOVE
// Maps different param names that mean the same thing
// ============================================================================

export const PARAM_ALIASES: Record<string, string[]> = {
  // Text/message content - all these mean "the content to send"
  text: ['message', 'content', 'body', 'notification_details', 'notification_content', 'message_text', 'email_body'],
  message: ['text', 'content', 'body', 'notification_details', 'notification_content', 'message_text'],
  body: ['text', 'message', 'content', 'email_body', 'notification_details'],
  content: ['text', 'message', 'body', 'notification_content'],

  // Recipients - all these mean "who to send to"
  to: ['recipient', 'recipient_email', 'email_to', 'send_to', 'email_address', 'to_email'],
  recipient: ['to', 'recipient_email', 'email_to', 'send_to', 'email_address'],
  channel: ['slack_channel', 'channel_name', 'channel_id', 'slack_channel_id'],

  // Identifiers - all these mean "which resource"
  spreadsheet_id: ['sheet_id', 'google_sheet', 'spreadsheet_url', 'sheet_url', 'googlesheets_spreadsheet_id'],
  list_id: ['clickup_list', 'list', 'trello_list'],
  task_id: ['clickup_task', 'task', 'task_identifier'],
  board_id: ['trello_board', 'monday_board', 'board'],
  project_id: ['asana_project', 'project', 'project_key'],

  // Phone numbers
  phone: ['phone_number', 'to', 'recipient_phone', 'whatsapp_number', 'mobile'],
  phone_number: ['phone', 'to', 'recipient_phone', 'mobile'],

  // Names/Titles
  name: ['title', 'subject', 'summary', 'task_name', 'item_name'],
  title: ['name', 'subject', 'summary', 'event_title'],
  subject: ['title', 'name', 'email_subject'],

  // @NEXUS-FIX-109: File/folder paths - all these mean "where to store/access" - DO NOT REMOVE
  // FIX-109b: Added dropbox_folder to path AND dropbox_path to folder for full bidirectional mapping
  path: ['folder', 'folder_path', 'directory', 'dropbox_path', 'dropbox_folder', 'file_path', 'location', 'destination'],
  folder: ['path', 'folder_path', 'directory', 'dropbox_folder', 'dropbox_path', 'destination'],
}

// ============================================================================
// Tool Mapping Constants
// ============================================================================

// Composio tool slugs for real API execution
// @NEXUS-FIX-007: TOOL_SLUGS static mapping - DO NOT REMOVE OR MODIFY WITHOUT /validate
export const TOOL_SLUGS: Record<string, Record<string, string>> = {
  // Email
  gmail: {
    // Outbound
    send: 'GMAIL_SEND_EMAIL',
    draft: 'GMAIL_CREATE_EMAIL_DRAFT',
    // Inbound/Reading
    fetch: 'GMAIL_FETCH_EMAILS',
    read: 'GMAIL_FETCH_EMAILS',
    get: 'GMAIL_FETCH_EMAILS',
    list: 'GMAIL_FETCH_EMAILS',
    // Triggers (polling-based or webhook)
    trigger: 'GMAIL_NEW_EMAIL_TRIGGER',
    receive: 'GMAIL_NEW_EMAIL_TRIGGER',
    capture: 'GMAIL_NEW_EMAIL_TRIGGER',
    listen: 'GMAIL_NEW_EMAIL_TRIGGER',
    incoming: 'GMAIL_NEW_EMAIL_TRIGGER',
    watch: 'GMAIL_WATCH',
  },
  // Messaging & Communication
  slack: {
    // Outbound
    send: 'SLACK_SEND_MESSAGE',
    notify: 'SLACK_SEND_MESSAGE',
    message: 'SLACK_SEND_MESSAGE',
    post: 'SLACK_SEND_MESSAGE',
    // Listing/Reading
    list: 'SLACK_LIST_CHANNELS',
    fetch: 'SLACK_FETCH_CONVERSATION_HISTORY',
    read: 'SLACK_FETCH_CONVERSATION_HISTORY',
    history: 'SLACK_FETCH_CONVERSATION_HISTORY',
    // Triggers
    trigger: 'SLACK_NEW_MESSAGE_TRIGGER',
    receive: 'SLACK_NEW_MESSAGE_TRIGGER',
    capture: 'SLACK_NEW_MESSAGE_TRIGGER',
    listen: 'SLACK_NEW_MESSAGE_TRIGGER',
    incoming: 'SLACK_NEW_MESSAGE_TRIGGER',
    watch: 'SLACK_NEW_MESSAGE_TRIGGER',
  },
  whatsapp: {
    // Outbound
    send: 'WHATSAPP_SEND_MESSAGE',
    message: 'WHATSAPP_SEND_MESSAGE',
    notify: 'WHATSAPP_SEND_MESSAGE',
    template: 'WHATSAPP_SEND_TEMPLATE_MESSAGE',
    // Triggers/Inbound (via WhatsApp Business API webhooks)
    trigger: 'WHATSAPP_NEW_MESSAGE_TRIGGER',
    receive: 'WHATSAPP_NEW_MESSAGE_TRIGGER',
    capture: 'WHATSAPP_NEW_MESSAGE_TRIGGER',
    listen: 'WHATSAPP_NEW_MESSAGE_TRIGGER',
    incoming: 'WHATSAPP_NEW_MESSAGE_TRIGGER',
    webhook: 'WHATSAPP_WEBHOOK_TRIGGER',
  },
  discord: {
    send: 'DISCORD_SEND_MESSAGE',
    message: 'DISCORD_SEND_MESSAGE',
    post: 'DISCORD_SEND_MESSAGE',
    webhook: 'DISCORD_SEND_WEBHOOK',
  },
  teams: {
    send: 'TEAMS_SEND_MESSAGE',
    message: 'TEAMS_SEND_MESSAGE',
    post: 'TEAMS_SEND_MESSAGE',
    notify: 'TEAMS_SEND_MESSAGE',
  },
  zoom: {
    create: 'ZOOM_CREATE_MEETING',
    schedule: 'ZOOM_CREATE_MEETING',
    meeting: 'ZOOM_CREATE_MEETING',
    list: 'ZOOM_LIST_MEETINGS',
  },
  // Google Workspace
  googlesheets: {
    // @NEXUS-FIX-022: Added create/add mappings for "Add to Sheet" workflows - DO NOT REMOVE
    create: 'GOOGLESHEETS_BATCH_UPDATE',
    add: 'GOOGLESHEETS_BATCH_UPDATE',
    read: 'GOOGLESHEETS_BATCH_GET',
    get: 'GOOGLESHEETS_BATCH_GET',
    write: 'GOOGLESHEETS_BATCH_UPDATE',
    append: 'GOOGLESHEETS_BATCH_UPDATE',
    update: 'GOOGLESHEETS_BATCH_UPDATE',
    save: 'GOOGLESHEETS_BATCH_UPDATE',
  },
  // @NEXUS-FIX-025: Added get/fetch/find/today actions for calendar events
  googlecalendar: {
    create: 'GOOGLECALENDAR_CREATE_EVENT',
    list: 'GOOGLECALENDAR_EVENTS_LIST',
    get: 'GOOGLECALENDAR_EVENTS_LIST',
    fetch: 'GOOGLECALENDAR_EVENTS_LIST',
    find: 'GOOGLECALENDAR_EVENTS_LIST',
    today: 'GOOGLECALENDAR_EVENTS_LIST',
    check: 'GOOGLECALENDAR_EVENTS_LIST',
    schedule: 'GOOGLECALENDAR_CREATE_EVENT',
  },
  googledrive: {
    upload: 'GOOGLEDRIVE_UPLOAD_FILE',
    list: 'GOOGLEDRIVE_LIST_FILES',
    download: 'GOOGLEDRIVE_DOWNLOAD_FILE',
    create: 'GOOGLEDRIVE_CREATE_FOLDER',
  },
  // CRM & Sales
  hubspot: {
    search: 'HUBSPOT_SEARCH_CONTACTS_BY_CRITERIA',
    list: 'HUBSPOT_LIST_CONTACTS',
    create: 'HUBSPOT_CREATE_CONTACT',
    read: 'HUBSPOT_READ_CONTACT',
  },
  salesforce: {
    search: 'SALESFORCE_SEARCH_RECORDS',
    list: 'SALESFORCE_GET_RECORDS',
    create: 'SALESFORCE_CREATE_RECORD',
    update: 'SALESFORCE_UPDATE_RECORD',
    query: 'SALESFORCE_SOQL_QUERY',
  },
  pipedrive: {
    create: 'PIPEDRIVE_CREATE_DEAL',
    list: 'PIPEDRIVE_LIST_DEALS',
    update: 'PIPEDRIVE_UPDATE_DEAL',
    search: 'PIPEDRIVE_SEARCH',
  },
  // Project Management
  github: {
    issue: 'GITHUB_CREATE_ISSUE',
    issues: 'GITHUB_LIST_REPOSITORY_ISSUES',
    pr: 'GITHUB_CREATE_PULL_REQUEST',
    list: 'GITHUB_LIST_REPOSITORY_ISSUES',
    fetch: 'GITHUB_LIST_REPOSITORY_ISSUES',  // "Fetch GitHub Issues" should list issues
    get: 'GITHUB_LIST_REPOSITORY_ISSUES',    // "Get issues" should list issues
    search: 'GITHUB_ISSUES_AND_PULL_REQUESTS', // Search issues/PRs
  },
  clickup: {
    // Creating
    create: 'CLICKUP_CREATE_TASK',
    task: 'CLICKUP_CREATE_TASK',
    add: 'CLICKUP_CREATE_TASK',
    // Reading
    list: 'CLICKUP_GET_TASKS',
    get: 'CLICKUP_GET_TASK',
    fetch: 'CLICKUP_GET_TASKS',
    folder: 'CLICKUP_GET_FOLDERS',
    // Updating
    update: 'CLICKUP_UPDATE_TASK',
    edit: 'CLICKUP_UPDATE_TASK',
    // Triggers
    trigger: 'CLICKUP_NEW_TASK_TRIGGER',
    capture: 'CLICKUP_NEW_TASK_TRIGGER',
    receive: 'CLICKUP_NEW_TASK_TRIGGER',
    watch: 'CLICKUP_TASK_UPDATED_TRIGGER',
    listen: 'CLICKUP_NEW_TASK_TRIGGER',
  },
  linear: {
    create: 'LINEAR_CREATE_ISSUE',
    issue: 'LINEAR_CREATE_ISSUE',
    list: 'LINEAR_LIST_ISSUES',
    update: 'LINEAR_UPDATE_ISSUE',
  },
  monday: {
    create: 'MONDAY_CREATE_ITEM',
    item: 'MONDAY_CREATE_ITEM',
    list: 'MONDAY_GET_ITEMS',
    update: 'MONDAY_UPDATE_ITEM',
  },
  jira: {
    create: 'JIRA_CREATE_ISSUE',
    issue: 'JIRA_CREATE_ISSUE',
    list: 'JIRA_LIST_ISSUES',
    update: 'JIRA_UPDATE_ISSUE',
    search: 'JIRA_JQL_SEARCH',
  },
  // @NEXUS-FIX-024: Notion tool slug mappings - corrected to actual Composio API slugs - DO NOT REMOVE
  notion: {
    create: 'NOTION_CREATE_PAGE',
    update: 'NOTION_UPDATE_PAGE',
    search: 'NOTION_SEARCH_NOTION_PAGE',  // FIXED: Was NOTION_SEARCH which doesn't exist
    database: 'NOTION_QUERY_DATABASE',
    save: 'NOTION_INSERT_ROW_DATABASE',   // For "save to notion" workflows
    add: 'NOTION_INSERT_ROW_DATABASE',    // For "add to notion" workflows
    insert: 'NOTION_INSERT_ROW_DATABASE', // For "insert into notion" workflows
    log: 'NOTION_INSERT_ROW_DATABASE',    // For "log to notion" workflows
    query: 'NOTION_QUERY_DATABASE',
    fetch: 'NOTION_FETCH_DATABASE',
  },
  // @NEXUS-FIX-024-END
  trello: {
    card: 'TRELLO_CREATE_CARD',
    create: 'TRELLO_CREATE_CARD',
    list: 'TRELLO_GET_BOARD_CARDS',
  },
  asana: {
    task: 'ASANA_CREATE_TASK',
    create: 'ASANA_CREATE_TASK',
    list: 'ASANA_GET_TASKS',
  },
  // @NEXUS-FIX-048: Kuwait payment gateway tool slugs - DO NOT REMOVE
  // These route to our PaymentLinkService, NOT real Composio tools
  knet: {
    pay: 'KNET_GENERATE_PAYMENT_LINK',
    generate: 'KNET_GENERATE_PAYMENT_LINK',
    send: 'KNET_GENERATE_PAYMENT_LINK',
    status: 'KNET_CHECK_PAYMENT',
    check: 'KNET_CHECK_PAYMENT',
    list: 'KNET_LIST_PAYMENTS',
  },
  myfatoorah: {
    pay: 'MYFATOORAH_GENERATE_LINK',
    generate: 'MYFATOORAH_GENERATE_LINK',
    send: 'MYFATOORAH_GENERATE_LINK',
    status: 'MYFATOORAH_CHECK_STATUS',
    check: 'MYFATOORAH_CHECK_STATUS',
    list: 'MYFATOORAH_LIST_PAYMENTS',
  },
  // @NEXUS-FIX-048-END

  // Payments & Finance
  stripe: {
    create: 'STRIPE_CREATE_CUSTOMER',
    customer: 'STRIPE_CREATE_CUSTOMER',
    charge: 'STRIPE_CREATE_CHARGE',
    invoice: 'STRIPE_CREATE_INVOICE',
    list: 'STRIPE_LIST_CUSTOMERS',
    subscription: 'STRIPE_CREATE_SUBSCRIPTION',
  },
  quickbooks: {
    create: 'QUICKBOOKS_CREATE_INVOICE',
    invoice: 'QUICKBOOKS_CREATE_INVOICE',
    list: 'QUICKBOOKS_LIST_INVOICES',
    customer: 'QUICKBOOKS_CREATE_CUSTOMER',
  },
  xero: {
    create: 'XERO_CREATE_INVOICE',
    invoice: 'XERO_CREATE_INVOICE',
    list: 'XERO_LIST_INVOICES',
    contact: 'XERO_CREATE_CONTACT',
  },
  // Marketing & Email
  mailchimp: {
    send: 'MAILCHIMP_SEND_CAMPAIGN',
    campaign: 'MAILCHIMP_CREATE_CAMPAIGN',
    add: 'MAILCHIMP_ADD_SUBSCRIBER',
    list: 'MAILCHIMP_LIST_CAMPAIGNS',
  },
  sendgrid: {
    send: 'SENDGRID_SEND_EMAIL',
    email: 'SENDGRID_SEND_EMAIL',
  },
  // Social Media
  twitter: {
    post: 'TWITTER_CREATE_TWEET',
    tweet: 'TWITTER_CREATE_TWEET',
    send: 'TWITTER_CREATE_TWEET',
    list: 'TWITTER_GET_TWEETS',
  },
  linkedin: {
    post: 'LINKEDIN_CREATE_POST',
    share: 'LINKEDIN_CREATE_POST',
    send: 'LINKEDIN_SEND_MESSAGE',
  },
  instagram: {
    post: 'INSTAGRAM_CREATE_POST',
    upload: 'INSTAGRAM_CREATE_POST',
    story: 'INSTAGRAM_CREATE_STORY',
  },
  facebook: {
    post: 'FACEBOOK_CREATE_POST',
    share: 'FACEBOOK_CREATE_POST',
    page: 'FACEBOOK_GET_PAGE',
  },
  // Storage & Documents
  // @NEXUS-FIX-017: Storage action mappings (save/store/write → upload) - DO NOT REMOVE
  dropbox: {
    upload: 'DROPBOX_UPLOAD_FILE',
    save: 'DROPBOX_UPLOAD_FILE',      // Save to Dropbox → upload
    store: 'DROPBOX_UPLOAD_FILE',     // Store in Dropbox → upload
    write: 'DROPBOX_UPLOAD_FILE',     // Write to Dropbox → upload
    create: 'DROPBOX_UPLOAD_FILE',    // Create file → upload
    list: 'DROPBOX_LIST_FOLDER',      // FIXED: LIST_FILES doesn't exist
    download: 'DROPBOX_DOWNLOAD_FILE',
  },
  onedrive: {
    upload: 'ONEDRIVE_UPLOAD_FILE',
    save: 'ONEDRIVE_UPLOAD_FILE',
    store: 'ONEDRIVE_UPLOAD_FILE',
    write: 'ONEDRIVE_UPLOAD_FILE',
    create: 'ONEDRIVE_UPLOAD_FILE',
    list: 'ONEDRIVE_LIST_FILES',
    download: 'ONEDRIVE_DOWNLOAD_FILE',
  },
  // @NEXUS-FIX-017-END
  airtable: {
    create: 'AIRTABLE_CREATE_RECORD',
    list: 'AIRTABLE_LIST_RECORDS',
    update: 'AIRTABLE_UPDATE_RECORD',
    search: 'AIRTABLE_SEARCH_RECORDS',
  },
  // AI & Automation
  openai: {
    generate: 'OPENAI_CHAT_COMPLETION',
    chat: 'OPENAI_CHAT_COMPLETION',
    complete: 'OPENAI_CHAT_COMPLETION',
    image: 'OPENAI_CREATE_IMAGE',
  },
  anthropic: {
    generate: 'ANTHROPIC_CHAT_COMPLETION',
    chat: 'ANTHROPIC_CHAT_COMPLETION',
    complete: 'ANTHROPIC_CHAT_COMPLETION',
  },
  // Voice & Transcription
  deepgram: {
    transcribe: 'DEEPGRAM_TRANSCRIBE',
    audio: 'DEEPGRAM_TRANSCRIBE',
  },
  elevenlabs: {
    generate: 'ELEVENLABS_TEXT_TO_SPEECH',
    speak: 'ELEVENLABS_TEXT_TO_SPEECH',
    voice: 'ELEVENLABS_TEXT_TO_SPEECH',
  },
  // Support
  intercom: {
    send: 'INTERCOM_SEND_MESSAGE',
    message: 'INTERCOM_SEND_MESSAGE',
    create: 'INTERCOM_CREATE_CONVERSATION',
    list: 'INTERCOM_LIST_CONVERSATIONS',
  },
  zendesk: {
    create: 'ZENDESK_CREATE_TICKET',
    ticket: 'ZENDESK_CREATE_TICKET',
    update: 'ZENDESK_UPDATE_TICKET',
    list: 'ZENDESK_LIST_TICKETS',
  },
  freshdesk: {
    create: 'FRESHDESK_CREATE_TICKET',
    ticket: 'FRESHDESK_CREATE_TICKET',
    update: 'FRESHDESK_UPDATE_TICKET',
    list: 'FRESHDESK_LIST_TICKETS',
  },
  // Webhooks (generic - handles via HTTP)
  webhook: {
    send: 'WEBHOOK_TRIGGER',
    trigger: 'WEBHOOK_TRIGGER',
    post: 'WEBHOOK_TRIGGER',
  },

  // @NEXUS-FIX-114: Additional integrations for domain pain points - DO NOT REMOVE
  // These cover the 67 workflow templates across 8 domains (Lawyers, SME Owners, Doctors, etc.)

  // E-commerce
  shopify: {
    create: 'SHOPIFY_CREATE_PRODUCT',
    list: 'SHOPIFY_LIST_PRODUCTS',
    order: 'SHOPIFY_CREATE_ORDER',
    update: 'SHOPIFY_UPDATE_PRODUCT',
    inventory: 'SHOPIFY_UPDATE_INVENTORY',
    trigger: 'SHOPIFY_NEW_ORDER_TRIGGER',
    receive: 'SHOPIFY_NEW_ORDER_TRIGGER',
  },
  woocommerce: {
    create: 'WOOCOMMERCE_CREATE_PRODUCT',
    list: 'WOOCOMMERCE_LIST_PRODUCTS',
    order: 'WOOCOMMERCE_CREATE_ORDER',
    update: 'WOOCOMMERCE_UPDATE_PRODUCT',
    trigger: 'WOOCOMMERCE_NEW_ORDER_TRIGGER',
  },
  square: {
    create: 'SQUARE_CREATE_PAYMENT',
    list: 'SQUARE_LIST_PAYMENTS',
    invoice: 'SQUARE_CREATE_INVOICE',
    customer: 'SQUARE_CREATE_CUSTOMER',
  },

  // Forms & Surveys
  typeform: {
    create: 'TYPEFORM_CREATE_FORM',
    list: 'TYPEFORM_LIST_RESPONSES',
    trigger: 'TYPEFORM_NEW_RESPONSE_TRIGGER',
    receive: 'TYPEFORM_NEW_RESPONSE_TRIGGER',
    response: 'TYPEFORM_LIST_RESPONSES',
  },
  googleforms: {
    create: 'GOOGLEFORMS_CREATE_FORM',
    list: 'GOOGLEFORMS_LIST_RESPONSES',
    trigger: 'GOOGLEFORMS_NEW_RESPONSE_TRIGGER',
    receive: 'GOOGLEFORMS_NEW_RESPONSE_TRIGGER',
  },

  // Scheduling
  calendly: {
    create: 'CALENDLY_CREATE_EVENT',
    list: 'CALENDLY_LIST_EVENTS',
    schedule: 'CALENDLY_CREATE_EVENT',
    trigger: 'CALENDLY_NEW_EVENT_TRIGGER',
    cancel: 'CALENDLY_CANCEL_EVENT',
  },

  // Communication
  twilio: {
    send: 'TWILIO_SEND_SMS',
    sms: 'TWILIO_SEND_SMS',
    call: 'TWILIO_MAKE_CALL',
    message: 'TWILIO_SEND_SMS',
    trigger: 'TWILIO_NEW_SMS_TRIGGER',
  },
  telegram: {
    send: 'TELEGRAM_SEND_MESSAGE',
    message: 'TELEGRAM_SEND_MESSAGE',
    photo: 'TELEGRAM_SEND_PHOTO',
    trigger: 'TELEGRAM_NEW_MESSAGE_TRIGGER',
  },

  // Documents & Signing
  docusign: {
    create: 'DOCUSIGN_CREATE_ENVELOPE',
    send: 'DOCUSIGN_SEND_ENVELOPE',
    sign: 'DOCUSIGN_CREATE_ENVELOPE',
    list: 'DOCUSIGN_LIST_ENVELOPES',
    trigger: 'DOCUSIGN_ENVELOPE_COMPLETED_TRIGGER',
  },

  // Cloud Storage (additional)
  box: {
    upload: 'BOX_UPLOAD_FILE',
    save: 'BOX_UPLOAD_FILE',
    list: 'BOX_LIST_FILES',
    download: 'BOX_DOWNLOAD_FILE',
    create: 'BOX_CREATE_FOLDER',
  },

  // Accounting
  freshbooks: {
    create: 'FRESHBOOKS_CREATE_INVOICE',
    invoice: 'FRESHBOOKS_CREATE_INVOICE',
    list: 'FRESHBOOKS_LIST_INVOICES',
    client: 'FRESHBOOKS_CREATE_CLIENT',
  },

  // Help Desk
  helpscout: {
    create: 'HELPSCOUT_CREATE_CONVERSATION',
    list: 'HELPSCOUT_LIST_CONVERSATIONS',
    send: 'HELPSCOUT_SEND_REPLY',
    trigger: 'HELPSCOUT_NEW_CONVERSATION_TRIGGER',
  },

  // Database
  supabase: {
    create: 'SUPABASE_INSERT_ROW',
    read: 'SUPABASE_SELECT_ROWS',
    update: 'SUPABASE_UPDATE_ROW',
    delete: 'SUPABASE_DELETE_ROW',
    list: 'SUPABASE_SELECT_ROWS',
    insert: 'SUPABASE_INSERT_ROW',
  },
  firebase: {
    create: 'FIREBASE_SET_DATA',
    read: 'FIREBASE_GET_DATA',
    update: 'FIREBASE_UPDATE_DATA',
    delete: 'FIREBASE_DELETE_DATA',
    push: 'FIREBASE_PUSH_DATA',
  },

  // Analytics
  googleanalytics: {
    report: 'GOOGLEANALYTICS_GET_REPORT',
    list: 'GOOGLEANALYTICS_LIST_ACCOUNTS',
    get: 'GOOGLEANALYTICS_GET_REPORT',
    fetch: 'GOOGLEANALYTICS_GET_REPORT',
  },

  // SMS Marketing
  sendinblue: {
    send: 'SENDINBLUE_SEND_EMAIL',
    email: 'SENDINBLUE_SEND_EMAIL',
    sms: 'SENDINBLUE_SEND_SMS',
    campaign: 'SENDINBLUE_CREATE_CAMPAIGN',
  },
  // @NEXUS-FIX-114-END
}

// Common action keywords that hint at the operation type
// COMPREHENSIVE: Includes triggers, listeners, captures, and all common operations
export const ACTION_KEYWORDS: Record<string, string> = {
  // READING/FETCHING - Must come BEFORE nouns like 'email' to avoid false matches
  // "Fetch Recent Emails" should match 'fetch' not 'email'
  read: 'read',
  get: 'get',
  fetch: 'fetch',
  retrieve: 'fetch',
  pull: 'fetch',

  // LISTING/SEARCHING
  list: 'list',
  search: 'search',
  find: 'search',
  query: 'search',
  lookup: 'search',

  // SENDING/OUTBOUND - After fetch/read to prevent "Fetch Emails" matching "email->send"
  send: 'send',
  // NOTE: Removed 'email: send' - too broad, causes "Fetch Emails" to map to SEND
  notify: 'notify',
  alert: 'notify',
  message: 'message',
  post: 'post',
  share: 'post',
  publish: 'post',
  broadcast: 'send',

  // CREATING
  create: 'create',
  add: 'create',
  new: 'create',
  make: 'create',
  generate: 'create',

  // READING/FETCHING and LISTING/SEARCHING moved to top of object for priority matching

  // UPDATING
  update: 'update',
  edit: 'update',
  modify: 'update',
  change: 'update',

  // WRITING/SAVING
  write: 'write',
  save: 'save',
  append: 'append',
  log: 'append',
  record: 'append',

  // FILES
  upload: 'upload',
  download: 'download',
  export: 'download',
  import: 'upload',

  // SCHEDULING
  schedule: 'schedule',
  book: 'schedule',
  reserve: 'schedule',

  // CHECKING
  check: 'check',
  verify: 'check',
  validate: 'check',

  // TRIGGERS/LISTENERS/CAPTURES (NEW - Critical for incoming data)
  capture: 'trigger',
  receive: 'trigger',
  listen: 'trigger',
  watch: 'trigger',
  monitor: 'trigger',
  trigger: 'trigger',
  incoming: 'trigger',
  inbound: 'trigger',
  detect: 'trigger',
  await: 'trigger',
  wait: 'trigger',
  on: 'trigger',  // "on new message", "on email received"
  when: 'trigger', // "when order placed"

  // WEBHOOKS
  webhook: 'webhook',
  hook: 'webhook',
  callback: 'webhook',

  // DELETING
  delete: 'delete',
  remove: 'delete',
  clear: 'delete',
  archive: 'archive',

  // @NEXUS-FIX-048: Payment action keywords - DO NOT REMOVE
  pay: 'pay',
  payment: 'pay',
  charge: 'pay',
  // @NEXUS-FIX-048-END

  // @NEXUS-FIX-114: Additional action verbs for domain workflows - DO NOT REMOVE
  // Workflow verbs
  track: 'create',
  sync: 'update',
  backup: 'upload',
  assign: 'update',
  approve: 'update',
  reject: 'update',
  close: 'update',
  open: 'create',
  convert: 'create',
  classify: 'create',
  tag: 'update',
  label: 'update',
  categorize: 'create',
  route: 'send',
  forward: 'send',
  transfer: 'send',
  submit: 'create',
  request: 'create',
  invite: 'send',
  remind: 'send',
  escalate: 'send',
  summarize: 'get',
  compile: 'get',
  collect: 'list',
  gather: 'list',
  aggregate: 'list',
  // @NEXUS-FIX-114-END
}
