/**
 * Quick Templates - Instant Execution Workflow Templates
 *
 * Designed for TikTok-like instant gratification:
 * - One-tap execution
 * - Minimal required inputs
 * - Pre-filled workflow steps
 * - Visual estimated completion time
 *
 * Loop 8: Consumer-first quick templates for immediate value
 */

export interface QuickTemplateStep {
  id: string
  name: string
  description: string
  agentId: string
  action: string
  estimatedSeconds: number
}

export interface QuickTemplateInput {
  id: string
  label: string
  placeholder: string
  type: 'text' | 'email' | 'select' | 'date' | 'time'
  required: boolean
  defaultValue?: string
  options?: { value: string; label: string }[]
}

export interface QuickTemplate {
  id: string
  name: string
  shortName: string
  description: string
  icon: string
  color: string
  gradient: string
  category: 'email' | 'scheduling' | 'crm' | 'travel' | 'documents'
  popularity: number
  estimatedSeconds: number
  steps: QuickTemplateStep[]
  requiredInputs: QuickTemplateInput[]
  integrations: string[]
  tags: string[]
  successRate: number
  usageCount: number
  aiModel: 'fast' | 'balanced' | 'thorough'
}

/**
 * Pre-built Quick Templates
 * These are the most common workflows that users want to execute instantly
 */
export const QUICK_TEMPLATES: QuickTemplate[] = [
  // 1. Summarize My Emails (Most Common)
  {
    id: 'qt-summarize-emails',
    name: 'Summarize My Emails',
    shortName: 'Email Summary',
    description: 'Get an AI summary of your unread emails with action items highlighted',
    icon: 'mail',
    color: '#3B82F6',
    gradient: 'from-blue-500 to-cyan-500',
    category: 'email',
    popularity: 98,
    estimatedSeconds: 45,
    steps: [
      {
        id: 'step-1',
        name: 'Fetch Emails',
        description: 'Connect to your inbox and retrieve unread emails',
        agentId: 'sam',
        action: 'GMAIL_FETCH_EMAILS',
        estimatedSeconds: 10,
      },
      {
        id: 'step-2',
        name: 'Analyze Content',
        description: 'AI reads and understands email context',
        agentId: 'larry',
        action: 'ANALYZE_EMAIL_CONTENT',
        estimatedSeconds: 15,
      },
      {
        id: 'step-3',
        name: 'Extract Actions',
        description: 'Identify action items and deadlines',
        agentId: 'olivia',
        action: 'EXTRACT_ACTION_ITEMS',
        estimatedSeconds: 10,
      },
      {
        id: 'step-4',
        name: 'Generate Summary',
        description: 'Create prioritized summary report',
        agentId: 'emma',
        action: 'GENERATE_SUMMARY',
        estimatedSeconds: 10,
      },
    ],
    requiredInputs: [
      {
        id: 'timeRange',
        label: 'Time Range',
        placeholder: 'Select time range',
        type: 'select',
        required: true,
        defaultValue: 'today',
        options: [
          { value: 'today', label: 'Today' },
          { value: 'yesterday', label: 'Yesterday' },
          { value: 'week', label: 'Past Week' },
          { value: 'unread', label: 'All Unread' },
        ],
      },
    ],
    integrations: ['Gmail', 'Outlook'],
    tags: ['productivity', 'email', 'summary', 'quick'],
    successRate: 99,
    usageCount: 125000,
    aiModel: 'fast',
  },

  // 2. Schedule a Meeting
  {
    id: 'qt-schedule-meeting',
    name: 'Schedule a Meeting',
    shortName: 'Quick Meeting',
    description: 'AI finds the best time slot and sends invites automatically',
    icon: 'calendar',
    color: '#8B5CF6',
    gradient: 'from-purple-500 to-pink-500',
    category: 'scheduling',
    popularity: 95,
    estimatedSeconds: 30,
    steps: [
      {
        id: 'step-1',
        name: 'Check Availability',
        description: 'Scan your calendar for free slots',
        agentId: 'mary',
        action: 'CALENDAR_CHECK_AVAILABILITY',
        estimatedSeconds: 5,
      },
      {
        id: 'step-2',
        name: 'Find Optimal Time',
        description: 'AI suggests best meeting times',
        agentId: 'larry',
        action: 'OPTIMIZE_MEETING_TIME',
        estimatedSeconds: 8,
      },
      {
        id: 'step-3',
        name: 'Create Event',
        description: 'Set up calendar event with details',
        agentId: 'sam',
        action: 'CALENDAR_CREATE_EVENT',
        estimatedSeconds: 7,
      },
      {
        id: 'step-4',
        name: 'Send Invites',
        description: 'Email meeting invitations to attendees',
        agentId: 'emma',
        action: 'SEND_MEETING_INVITE',
        estimatedSeconds: 10,
      },
    ],
    requiredInputs: [
      {
        id: 'meetingTitle',
        label: 'Meeting Title',
        placeholder: 'Quick sync, Project review...',
        type: 'text',
        required: true,
      },
      {
        id: 'attendees',
        label: 'Attendees',
        placeholder: 'email@example.com',
        type: 'text',
        required: true,
      },
      {
        id: 'duration',
        label: 'Duration',
        placeholder: 'Select duration',
        type: 'select',
        required: true,
        defaultValue: '30',
        options: [
          { value: '15', label: '15 minutes' },
          { value: '30', label: '30 minutes' },
          { value: '45', label: '45 minutes' },
          { value: '60', label: '1 hour' },
        ],
      },
    ],
    integrations: ['Google Calendar', 'Outlook Calendar', 'Zoom'],
    tags: ['scheduling', 'meetings', 'calendar', 'productivity'],
    successRate: 97,
    usageCount: 89000,
    aiModel: 'fast',
  },

  // 3. Automate CRM Update
  {
    id: 'qt-crm-update',
    name: 'Automate CRM Update',
    shortName: 'CRM Sync',
    description: 'Auto-log activities and update contact records from your communications',
    icon: 'users',
    color: '#10B981',
    gradient: 'from-emerald-500 to-teal-500',
    category: 'crm',
    popularity: 92,
    estimatedSeconds: 60,
    steps: [
      {
        id: 'step-1',
        name: 'Scan Communications',
        description: 'Review recent emails and calls',
        agentId: 'sam',
        action: 'SCAN_COMMUNICATIONS',
        estimatedSeconds: 15,
      },
      {
        id: 'step-2',
        name: 'Match Contacts',
        description: 'Link communications to CRM contacts',
        agentId: 'larry',
        action: 'MATCH_CRM_CONTACTS',
        estimatedSeconds: 12,
      },
      {
        id: 'step-3',
        name: 'Extract Insights',
        description: 'AI identifies deal updates and notes',
        agentId: 'olivia',
        action: 'EXTRACT_CRM_INSIGHTS',
        estimatedSeconds: 18,
      },
      {
        id: 'step-4',
        name: 'Update Records',
        description: 'Push updates to your CRM',
        agentId: 'alex',
        action: 'CRM_UPDATE_RECORDS',
        estimatedSeconds: 15,
      },
    ],
    requiredInputs: [
      {
        id: 'crmPlatform',
        label: 'CRM Platform',
        placeholder: 'Select your CRM',
        type: 'select',
        required: true,
        defaultValue: 'salesforce',
        options: [
          { value: 'salesforce', label: 'Salesforce' },
          { value: 'hubspot', label: 'HubSpot' },
          { value: 'pipedrive', label: 'Pipedrive' },
          { value: 'zoho', label: 'Zoho CRM' },
        ],
      },
      {
        id: 'updateScope',
        label: 'What to Update',
        placeholder: 'Select scope',
        type: 'select',
        required: true,
        defaultValue: 'all',
        options: [
          { value: 'all', label: 'All Activities' },
          { value: 'emails', label: 'Emails Only' },
          { value: 'calls', label: 'Calls Only' },
          { value: 'meetings', label: 'Meetings Only' },
        ],
      },
    ],
    integrations: ['Salesforce', 'HubSpot', 'Pipedrive', 'Gmail'],
    tags: ['crm', 'sales', 'automation', 'sync'],
    successRate: 96,
    usageCount: 67000,
    aiModel: 'balanced',
  },

  // 4. Book Travel
  {
    id: 'qt-book-travel',
    name: 'Book Travel',
    shortName: 'Travel Booking',
    description: 'AI searches and books flights, hotels based on your preferences',
    icon: 'plane',
    color: '#F59E0B',
    gradient: 'from-amber-500 to-orange-500',
    category: 'travel',
    popularity: 88,
    estimatedSeconds: 90,
    steps: [
      {
        id: 'step-1',
        name: 'Search Flights',
        description: 'Find best flight options and prices',
        agentId: 'sam',
        action: 'SEARCH_FLIGHTS',
        estimatedSeconds: 25,
      },
      {
        id: 'step-2',
        name: 'Search Hotels',
        description: 'Find accommodation near destination',
        agentId: 'mary',
        action: 'SEARCH_HOTELS',
        estimatedSeconds: 20,
      },
      {
        id: 'step-3',
        name: 'Compare Options',
        description: 'AI ranks options by value and convenience',
        agentId: 'larry',
        action: 'COMPARE_TRAVEL_OPTIONS',
        estimatedSeconds: 15,
      },
      {
        id: 'step-4',
        name: 'Prepare Booking',
        description: 'Generate booking summary for approval',
        agentId: 'emma',
        action: 'PREPARE_BOOKING_SUMMARY',
        estimatedSeconds: 10,
      },
      {
        id: 'step-5',
        name: 'Add to Calendar',
        description: 'Create travel events in your calendar',
        agentId: 'olivia',
        action: 'ADD_TRAVEL_TO_CALENDAR',
        estimatedSeconds: 10,
      },
      {
        id: 'step-6',
        name: 'Confirm Booking',
        description: 'Complete the reservation',
        agentId: 'alex',
        action: 'CONFIRM_BOOKING',
        estimatedSeconds: 10,
      },
    ],
    requiredInputs: [
      {
        id: 'destination',
        label: 'Destination',
        placeholder: 'City or airport code',
        type: 'text',
        required: true,
      },
      {
        id: 'departDate',
        label: 'Departure Date',
        placeholder: 'Select date',
        type: 'date',
        required: true,
      },
      {
        id: 'returnDate',
        label: 'Return Date',
        placeholder: 'Select date',
        type: 'date',
        required: false,
      },
      {
        id: 'travelers',
        label: 'Travelers',
        placeholder: 'Number of travelers',
        type: 'select',
        required: true,
        defaultValue: '1',
        options: [
          { value: '1', label: '1 traveler' },
          { value: '2', label: '2 travelers' },
          { value: '3', label: '3 travelers' },
          { value: '4', label: '4 travelers' },
        ],
      },
    ],
    integrations: ['Google Flights', 'Booking.com', 'Expedia', 'Calendar'],
    tags: ['travel', 'booking', 'flights', 'hotels'],
    successRate: 94,
    usageCount: 45000,
    aiModel: 'thorough',
  },

  // 5. Process Documents
  {
    id: 'qt-process-documents',
    name: 'Process Documents',
    shortName: 'Doc Processor',
    description: 'Extract data from invoices, receipts, contracts using AI OCR',
    icon: 'file-text',
    color: '#EC4899',
    gradient: 'from-pink-500 to-rose-500',
    category: 'documents',
    popularity: 90,
    estimatedSeconds: 75,
    steps: [
      {
        id: 'step-1',
        name: 'Upload Documents',
        description: 'Receive and validate document files',
        agentId: 'sam',
        action: 'UPLOAD_DOCUMENTS',
        estimatedSeconds: 10,
      },
      {
        id: 'step-2',
        name: 'OCR Processing',
        description: 'Extract text from images and PDFs',
        agentId: 'alex',
        action: 'OCR_EXTRACT_TEXT',
        estimatedSeconds: 20,
      },
      {
        id: 'step-3',
        name: 'AI Analysis',
        description: 'Identify document type and key fields',
        agentId: 'larry',
        action: 'ANALYZE_DOCUMENT_CONTENT',
        estimatedSeconds: 15,
      },
      {
        id: 'step-4',
        name: 'Extract Data',
        description: 'Pull structured data from documents',
        agentId: 'olivia',
        action: 'EXTRACT_STRUCTURED_DATA',
        estimatedSeconds: 15,
      },
      {
        id: 'step-5',
        name: 'Generate Report',
        description: 'Create summary with extracted information',
        agentId: 'emma',
        action: 'GENERATE_DATA_REPORT',
        estimatedSeconds: 15,
      },
    ],
    requiredInputs: [
      {
        id: 'documentType',
        label: 'Document Type',
        placeholder: 'Select type',
        type: 'select',
        required: true,
        defaultValue: 'auto',
        options: [
          { value: 'auto', label: 'Auto-detect' },
          { value: 'invoice', label: 'Invoices' },
          { value: 'receipt', label: 'Receipts' },
          { value: 'contract', label: 'Contracts' },
          { value: 'form', label: 'Forms' },
        ],
      },
      {
        id: 'outputFormat',
        label: 'Output Format',
        placeholder: 'Select format',
        type: 'select',
        required: true,
        defaultValue: 'json',
        options: [
          { value: 'json', label: 'JSON Data' },
          { value: 'csv', label: 'CSV Spreadsheet' },
          { value: 'summary', label: 'Text Summary' },
        ],
      },
    ],
    integrations: ['Google Drive', 'Dropbox', 'OneDrive', 'QuickBooks'],
    tags: ['documents', 'ocr', 'data-extraction', 'automation'],
    successRate: 95,
    usageCount: 78000,
    aiModel: 'balanced',
  },
]

/**
 * Get template by ID
 */
export function getQuickTemplateById(id: string): QuickTemplate | undefined {
  return QUICK_TEMPLATES.find(t => t.id === id)
}

/**
 * Get templates by category
 */
export function getQuickTemplatesByCategory(category: QuickTemplate['category']): QuickTemplate[] {
  return QUICK_TEMPLATES.filter(t => t.category === category)
}

/**
 * Get most popular templates
 */
export function getPopularQuickTemplates(limit: number = 3): QuickTemplate[] {
  return [...QUICK_TEMPLATES]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit)
}

/**
 * Format estimated time for display
 */
export function formatEstimatedTime(seconds: number): string {
  if (seconds < 60) {
    return `~${seconds}s`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (remainingSeconds === 0) {
    return `~${minutes}m`
  }
  return `~${minutes}m ${remainingSeconds}s`
}

/**
 * Get icon component name for the template
 */
export function getTemplateIconName(template: QuickTemplate): string {
  const iconMap: Record<string, string> = {
    mail: 'Mail',
    calendar: 'Calendar',
    users: 'Users',
    plane: 'Plane',
    'file-text': 'FileText',
  }
  return iconMap[template.icon] || 'Zap'
}

/**
 * Category metadata for UI
 */
export const QUICK_TEMPLATE_CATEGORIES = [
  { id: 'email', label: 'Email', icon: 'Mail', color: '#3B82F6' },
  { id: 'scheduling', label: 'Scheduling', icon: 'Calendar', color: '#8B5CF6' },
  { id: 'crm', label: 'CRM', icon: 'Users', color: '#10B981' },
  { id: 'travel', label: 'Travel', icon: 'Plane', color: '#F59E0B' },
  { id: 'documents', label: 'Documents', icon: 'FileText', color: '#EC4899' },
] as const
