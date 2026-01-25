/**
 * UXPatterns.ts
 *
 * Pattern-based UX translation rules that convert ANY parameter name
 * into user-friendly prompts. This is the KEY INNOVATION that enables
 * Nexus to work with 500+ tools without hardcoding.
 *
 * Patterns are evaluated in ORDER - first match wins.
 * The fallback pattern at the end catches everything.
 *
 * @NEXUS-GENERIC-ORCHESTRATION
 */

import type { UXPattern, QuickAction } from '../types';

/**
 * Convert snake_case or camelCase to Title Case
 * "spreadsheet_id" -> "Spreadsheet"
 * "channelId" -> "Channel"
 */
export function humanize(str: string): string {
  return str
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

/**
 * Common quick actions for reuse across patterns
 */
const QUICK_ACTIONS = {
  sendToMyself: [{ label: 'Send to Myself', value: '{{user_email}}' }] as QuickAction[],
  myPhone: [{ label: 'My Phone', value: '{{user_phone}}' }] as QuickAction[],
  rootFolder: [
    { label: 'Root Folder', value: '/' },
    { label: 'Documents', value: '/Documents' }
  ] as QuickAction[],
};

/**
 * UX Pattern Definitions
 *
 * Each pattern has:
 * - match: RegExp to test parameter names
 * - displayName: Function to generate user-friendly label
 * - prompt: Function to generate the question text
 * - inputType: Type of input field to show
 * - placeholder: Optional placeholder text
 * - quickActions: Optional shortcut buttons
 * - autoResolve: Optional auto-lookup configuration
 */
export const UX_PATTERNS: UXPattern[] = [
  // ============================================================
  // ID PATTERNS - Highest priority for *_id parameters
  // ============================================================
  {
    // spreadsheet_id, channel_id, folder_id, board_id, etc.
    match: /^(.+)_id$/i,
    displayName: (match) => humanize(match[1]),
    prompt: (match) => `Which ${humanize(match[1]).toLowerCase()}?`,
    inputType: 'text',
    autoResolve: (match, toolkit) => ({
      lookupTool: `${toolkit.toUpperCase()}_LIST_${match[1].toUpperCase()}S`,
      searchField: 'name',
      returnField: 'id'
    })
  },

  // ============================================================
  // EMAIL PATTERNS
  // ============================================================
  {
    // to, recipient, recipient_email, send_to, email_address
    match: /^(to|recipient|recipient_email|send_to|email_address|email_to)$/i,
    displayName: () => 'Recipient',
    prompt: () => 'Who should receive this?',
    inputType: 'email',
    placeholder: 'email@example.com',
    quickActions: QUICK_ACTIONS.sendToMyself
  },
  {
    // from, sender, from_email
    match: /^(from|sender|from_email|sender_email)$/i,
    displayName: () => 'Sender',
    prompt: () => 'Who is this from?',
    inputType: 'email',
    quickActions: QUICK_ACTIONS.sendToMyself
  },
  {
    // cc, bcc, cc_emails
    match: /^(cc|bcc|cc_emails?|bcc_emails?)$/i,
    displayName: (match) => match[1].toUpperCase(),
    prompt: (match) => `${match[1].toUpperCase()} recipients (optional)`,
    inputType: 'email',
    placeholder: 'email1@example.com, email2@example.com'
  },

  // ============================================================
  // PHONE PATTERNS
  // ============================================================
  {
    // phone, phone_number, to_phone, recipient_phone, mobile
    match: /^(phone|phone_number|to_phone|recipient_phone|mobile|mobile_number)$/i,
    displayName: () => 'Phone Number',
    prompt: () => 'What phone number?',
    inputType: 'phone',
    placeholder: '+965 xxxx xxxx',
    quickActions: QUICK_ACTIONS.myPhone
  },

  // ============================================================
  // URL PATTERNS
  // ============================================================
  {
    // *_url, *_link patterns
    match: /^(.+)_(url|link)$/i,
    displayName: (match) => `${humanize(match[1])} URL`,
    prompt: (match) => `Enter the ${humanize(match[1]).toLowerCase()} URL`,
    inputType: 'url',
    placeholder: 'https://'
  },
  {
    // url, link, href (standalone)
    match: /^(url|link|href|website)$/i,
    displayName: () => 'URL',
    prompt: () => 'Enter the URL',
    inputType: 'url',
    placeholder: 'https://'
  },

  // ============================================================
  // CONTENT PATTERNS (Long text - textarea)
  // ============================================================
  {
    // body, message, content, text, description, notes
    match: /^(body|message|content|text|description|notes|memo|comment)$/i,
    displayName: (match) => humanize(match[1]),
    prompt: (match) => `What should the ${match[1].toLowerCase()} say?`,
    inputType: 'textarea',
    placeholder: 'Type your content here...'
  },
  {
    // html_body, message_body, email_body
    match: /^(.+)_(body|content|text|message)$/i,
    displayName: (match) => humanize(match[1]),
    prompt: (match) => `What should the ${humanize(match[1]).toLowerCase()} say?`,
    inputType: 'textarea',
    placeholder: 'Type your content here...'
  },

  // ============================================================
  // PATH PATTERNS (File/Folder paths)
  // ============================================================
  {
    // path, file_path, folder_path, directory, destination
    match: /^(path|file_path|folder_path|directory|destination|source|target)$/i,
    displayName: () => 'Path',
    prompt: () => 'Which folder or file path?',
    inputType: 'text',
    placeholder: '/Documents/Nexus',
    quickActions: QUICK_ACTIONS.rootFolder
  },
  {
    // file, filename, file_name
    match: /^(file|filename|file_name)$/i,
    displayName: () => 'File',
    prompt: () => 'Which file?',
    inputType: 'text',
    placeholder: 'document.pdf'
  },

  // ============================================================
  // NAME/TITLE PATTERNS
  // ============================================================
  {
    // name, title, subject, label, heading
    match: /^(name|title|subject|label|heading|headline)$/i,
    displayName: (match) => humanize(match[1]),
    prompt: (match) => `What should the ${match[1].toLowerCase()} be?`,
    inputType: 'text'
  },
  {
    // *_name, *_title patterns
    match: /^(.+)_(name|title)$/i,
    displayName: (match) => `${humanize(match[1])} ${humanize(match[2])}`,
    prompt: (match) => `What should the ${humanize(match[1]).toLowerCase()} ${match[2].toLowerCase()} be?`,
    inputType: 'text'
  },

  // ============================================================
  // CHANNEL PATTERNS (Slack, Discord, etc.)
  // ============================================================
  {
    // channel, channel_name
    match: /^(channel|channel_name)$/i,
    displayName: () => 'Channel',
    prompt: () => 'Which channel?',
    inputType: 'text',
    placeholder: '#general',
    quickActions: [
      { label: '#general', value: 'general' },
      { label: '#team', value: 'team' }
    ]
  },

  // ============================================================
  // USER PATTERNS
  // ============================================================
  {
    // user, user_id, username, assignee
    match: /^(user|user_name|username|assignee|owner|author|creator)$/i,
    displayName: (match) => humanize(match[1]),
    prompt: (match) => `Which ${match[1].replace(/_/g, ' ')}?`,
    inputType: 'text'
  },

  // ============================================================
  // DATE/TIME PATTERNS
  // ============================================================
  {
    // date, due_date, start_date, end_date
    match: /^(date|due_date|start_date|end_date|deadline|scheduled_date)$/i,
    displayName: (match) => humanize(match[1]),
    prompt: (match) => `When? (${humanize(match[1])})`,
    inputType: 'text',
    placeholder: 'YYYY-MM-DD or "tomorrow"'
  },
  {
    // time, start_time, end_time
    match: /^(time|start_time|end_time|scheduled_time)$/i,
    displayName: (match) => humanize(match[1]),
    prompt: (match) => `What time? (${humanize(match[1])})`,
    inputType: 'text',
    placeholder: 'HH:MM or "3pm"'
  },

  // ============================================================
  // QUANTITY/NUMBER PATTERNS
  // ============================================================
  {
    // count, limit, max, min, amount, quantity
    match: /^(count|limit|max|min|amount|quantity|number|size)$/i,
    displayName: (match) => humanize(match[1]),
    prompt: (match) => `What ${match[1].toLowerCase()}?`,
    inputType: 'number'
  },
  {
    // max_results, page_size, etc.
    match: /^(max|min|page)_(.+)$/i,
    displayName: (match) => `${humanize(match[1])} ${humanize(match[2])}`,
    prompt: (match) => `${humanize(match[1])} ${humanize(match[2])}?`,
    inputType: 'number'
  },

  // ============================================================
  // BOOLEAN PATTERNS (rendered as select)
  // ============================================================
  {
    // is_*, has_*, include_*, enable_*
    match: /^(is|has|include|enable|allow|show|hide)_(.+)$/i,
    displayName: (match) => `${humanize(match[1])} ${humanize(match[2])}`,
    prompt: (match) => `${humanize(match[1])} ${humanize(match[2])}?`,
    inputType: 'select'
  },

  // ============================================================
  // QUERY/SEARCH PATTERNS
  // ============================================================
  {
    // query, search, filter, keyword
    match: /^(query|search|filter|keyword|term|q)$/i,
    displayName: () => 'Search',
    prompt: () => 'What to search for?',
    inputType: 'text',
    placeholder: 'Enter search terms...'
  },

  // ============================================================
  // RANGE PATTERNS (Sheets, etc.)
  // ============================================================
  {
    // range, cell_range, data_range
    match: /^(range|cell_range|data_range)$/i,
    displayName: () => 'Range',
    prompt: () => 'Which cell range?',
    inputType: 'text',
    placeholder: 'A1:D10'
  },

  // ============================================================
  // REPOSITORY PATTERNS (GitHub, etc.)
  // ============================================================
  {
    // repo, repository
    match: /^(repo|repository)$/i,
    displayName: () => 'Repository',
    prompt: () => 'Which repository?',
    inputType: 'text',
    placeholder: 'owner/repo-name'
  },
  {
    // owner, org, organization
    match: /^(owner|org|organization)$/i,
    displayName: (match) => humanize(match[1]),
    prompt: (match) => `Which ${match[1].toLowerCase()}?`,
    inputType: 'text'
  },

  // ============================================================
  // PRIORITY/STATUS PATTERNS
  // ============================================================
  {
    // priority, status, state, type, category
    match: /^(priority|status|state|type|category|level|stage)$/i,
    displayName: (match) => humanize(match[1]),
    prompt: (match) => `What ${match[1].toLowerCase()}?`,
    inputType: 'select'
  },

  // ============================================================
  // FALLBACK PATTERN - Catches everything else
  // ============================================================
  {
    // Any unmatched parameter - always last
    match: /.*/,
    displayName: (_, paramName) => humanize(paramName),
    prompt: (_, paramName) => `Enter ${humanize(paramName).toLowerCase()}`,
    inputType: 'text'
  }
];

/**
 * Find the matching pattern for a parameter name
 */
export function findPattern(paramName: string): UXPattern | null {
  for (const pattern of UX_PATTERNS) {
    if (pattern.match.test(paramName)) {
      return pattern;
    }
  }
  return null;
}

/**
 * Get the pattern index (for debugging/logging)
 */
export function getPatternIndex(paramName: string): number {
  for (let i = 0; i < UX_PATTERNS.length; i++) {
    if (UX_PATTERNS[i].match.test(paramName)) {
      return i;
    }
  }
  return -1;
}
