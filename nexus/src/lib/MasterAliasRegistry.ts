/**
 * MasterAliasRegistry.ts
 *
 * SINGLE CANONICAL SOURCE for all integration name aliases and action verb aliases
 * across the entire Nexus codebase.
 *
 * Previously duplicated in:
 *   - src/services/UnifiedToolRegistry.ts  (TOOLKIT_ALIASES)
 *   - src/services/ToolRegistry.ts         (INTEGRATION_ALIASES)
 *   - src/components/chat/WorkflowPreviewCard.tsx (KNOWN_ALIASES, TOOLKIT_ALIASES, ACTION_KEYWORDS)
 *   - server/services/CustomIntegrationService.ts (APP_NAME_ALIASES - server-side, kept separate)
 *
 * All client-side files should import from here.
 * Server-side files (e.g. CustomIntegrationService.ts) maintain their own copy
 * since they cannot import from src/lib, but the canonical definitions live HERE.
 *
 * @NEXUS-FIX-120: MasterAliasRegistry - Canonical alias source - DO NOT REMOVE
 */

// ================================
// INTEGRATION ALIASES
// ================================

/**
 * Maps alternative/common names to their canonical integration/toolkit name.
 *
 * Merged from:
 *   - UnifiedToolRegistry.ts TOOLKIT_ALIASES
 *   - ToolRegistry.ts INTEGRATION_ALIASES
 *   - WorkflowPreviewCard.tsx KNOWN_ALIASES + TOOLKIT_ALIASES
 *
 * Canonical names are the keys used in TOOL_SLUGS, UNIFIED_REGISTRY, etc.
 */
export const INTEGRATION_ALIASES: Record<string, string> = {
  // ========== EMAIL ==========
  'email': 'gmail',
  'mail': 'gmail',
  'google mail': 'gmail',
  'google email': 'gmail',
  'google_email': 'gmail',

  // ========== STORAGE: Google Drive ==========
  'drive': 'googledrive',
  'google drive': 'googledrive',
  'google_drive': 'googledrive',
  'gdrive': 'googledrive',

  // ========== STORAGE: OneDrive ==========
  'onedrive': 'onedrive',
  'microsoft_onedrive': 'onedrive',
  'microsoft onedrive': 'onedrive',

  // ========== PRODUCTIVITY: Google Sheets ==========
  'sheets': 'googlesheets',
  'google sheets': 'googlesheets',
  'google_sheets': 'googlesheets',
  'spreadsheet': 'googlesheets',
  'spreadsheets': 'googlesheets',

  // ========== CALENDAR ==========
  'calendar': 'googlecalendar',
  'google calendar': 'googlecalendar',
  'google_calendar': 'googlecalendar',
  'gcal': 'googlecalendar',

  // ========== SOCIAL ==========
  'x': 'twitter',
  'x.com': 'twitter',

  // ========== MESSAGING ==========
  'wa': 'whatsapp',
  'whats app': 'whatsapp',
  'tg': 'telegram',
  'microsoft teams': 'teams',
}

// ================================
// ACTION VERB MAP
// ================================

/**
 * Maps natural-language action verbs to their canonical action name.
 *
 * Merged from WorkflowPreviewCard.tsx ACTION_KEYWORDS and the action arrays
 * in UnifiedToolRegistry.ts / ToolRegistry.ts tool definitions.
 *
 * The canonical action name is the key used in TOOL_SLUGS mappings
 * (e.g. TOOL_SLUGS['gmail']['send'] => 'GMAIL_SEND_EMAIL').
 */
export const ACTION_VERB_MAP: Record<string, string> = {
  // ---------- READING / FETCHING ----------
  read: 'read',
  get: 'get',
  fetch: 'fetch',
  retrieve: 'fetch',
  pull: 'fetch',

  // ---------- LISTING / SEARCHING ----------
  list: 'list',
  search: 'search',
  find: 'search',
  query: 'search',
  lookup: 'search',
  show: 'list',
  display: 'list',
  browse: 'list',
  view: 'list',

  // ---------- SENDING / OUTBOUND ----------
  send: 'send',
  deliver: 'send',
  notify: 'notify',
  alert: 'notify',
  message: 'message',
  post: 'post',
  share: 'post',
  publish: 'post',
  broadcast: 'send',
  chat: 'send',
  tweet: 'post',

  // ---------- CREATING ----------
  create: 'create',
  add: 'create',
  new: 'create',
  make: 'create',
  generate: 'create',
  insert: 'create',
  open: 'create',
  report: 'create',

  // ---------- UPDATING ----------
  update: 'update',
  edit: 'update',
  modify: 'update',
  change: 'update',
  sync: 'update',
  assign: 'update',
  approve: 'update',
  reject: 'update',
  close: 'update',

  // ---------- WRITING / SAVING ----------
  write: 'write',
  save: 'save',
  append: 'append',
  log: 'append',
  record: 'append',
  store: 'save',

  // ---------- FILES ----------
  upload: 'upload',
  download: 'download',
  export: 'download',
  import: 'upload',
  backup: 'upload',
  put: 'upload',

  // ---------- SCHEDULING ----------
  schedule: 'schedule',
  book: 'schedule',
  reserve: 'schedule',

  // ---------- CHECKING ----------
  check: 'check',
  verify: 'check',
  validate: 'check',

  // ---------- TRIGGERS / LISTENERS ----------
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
  on: 'trigger',
  when: 'trigger',

  // ---------- WEBHOOKS ----------
  webhook: 'webhook',
  hook: 'webhook',
  callback: 'webhook',

  // ---------- DELETING ----------
  delete: 'delete',
  remove: 'delete',
  clear: 'delete',
  archive: 'archive',

  // ---------- DOMAIN WORKFLOWS ----------
  track: 'create',

  // ---------- DRAFTS ----------
  draft: 'draft',
  template: 'template',

  // ---------- AI ----------
  ask: 'create',
  complete: 'create',
}

// ================================
// REVERSE PARAM ALIASES
// ================================

/**
 * Maps user-friendly / AI-collected parameter names to their canonical API
 * parameter names. Merged from WorkflowPreviewCard.tsx REVERSE_ALIASES and
 * PARAM_ALIASES.
 *
 * E.g. 'notification_details' -> 'text', 'recipient_email' -> 'to'
 */
export const PARAM_REVERSE_ALIASES: Record<string, string> = {
  // Text / message content
  notification_details: 'text',
  notification_content: 'text',
  notification_message: 'text',
  slack_message: 'text',
  message_text: 'text',
  message: 'text',
  content: 'body',
  post_content: 'body',
  email_body: 'body',

  // Channels
  slack_channel: 'channel',
  channel_name: 'channel',
  destination_channel: 'channel',

  // Recipients
  recipient: 'to',
  recipient_email: 'to',
  send_to: 'to',
  email_to: 'to',
  email_address: 'to',

  // Subject
  email_subject: 'subject',
  subject_line: 'subject',

  // Paths / files
  file_path: 'path',
  folder_path: 'path',
  dropbox_path: 'path',
  onedrive_path: 'path',

  // Sheets
  sheet_id: 'spreadsheet_id',
  google_sheet: 'spreadsheet_id',
  spreadsheet_url: 'spreadsheet_id',

  // Notion
  notion_page: 'page_id',
  page_url: 'page_id',

  // GitHub
  repository: 'repo',
  github_repo: 'repo',
  repo_name: 'repo',
}

// ================================
// RESOLVER FUNCTIONS
// ================================

/**
 * Resolve any integration name (including aliases, mixed case, spaces)
 * to its canonical lowercase toolkit name.
 *
 * Examples:
 *   resolveIntegration('Google Mail')  => 'gmail'
 *   resolveIntegration('sheets')       => 'googlesheets'
 *   resolveIntegration('X')            => 'twitter'
 *   resolveIntegration('notion')       => 'notion' (passthrough)
 */
export function resolveIntegration(name: string): string {
  const lower = name.toLowerCase().trim()
  return INTEGRATION_ALIASES[lower] || lower
}

/**
 * Resolve any action verb to its canonical action name.
 *
 * Examples:
 *   resolveAction('save')     => 'save'
 *   resolveAction('retrieve') => 'fetch'
 *   resolveAction('tweet')    => 'post'
 *   resolveAction('unknown')  => 'unknown' (passthrough)
 */
export function resolveAction(verb: string): string {
  const lower = verb.toLowerCase().trim()
  return ACTION_VERB_MAP[lower] || lower
}

/**
 * Resolve a parameter name alias to its canonical API parameter name.
 *
 * Examples:
 *   resolveParam('notification_details') => 'text'
 *   resolveParam('recipient_email')      => 'to'
 *   resolveParam('spreadsheet_id')       => 'spreadsheet_id' (passthrough)
 */
export function resolveParam(paramName: string): string {
  const lower = paramName.toLowerCase().trim()
  return PARAM_REVERSE_ALIASES[lower] || lower
}

// ================================
// DEFAULT EXPORT
// ================================

const MasterAliasRegistry = {
  INTEGRATION_ALIASES,
  ACTION_VERB_MAP,
  PARAM_REVERSE_ALIASES,
  resolveIntegration,
  resolveAction,
  resolveParam,
} as const

export default MasterAliasRegistry
