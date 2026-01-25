/**
 * SmartWorkflowEngine - Intelligent workflow generation with minimal questions
 *
 * Embeds productivity tools (Playwright, Composio/Rube, etc.) directly into Nexus
 * for users to create powerful automations through natural conversation.
 */

// Tool categories and their capabilities
export interface IntegrationTool {
  id: string
  name: string
  category: 'browser_automation' | 'api_integration' | 'data_processing' | 'communication' | 'scheduling' | 'finance' | 'travel' | 'productivity'
  description: string
  capabilities: string[]
  requiredAuth?: 'oauth' | 'api_key' | 'none'
  provider?: string
  icon: string
}

// Available tools embedded in Nexus
export const EMBEDDED_TOOLS: IntegrationTool[] = [
  // Browser Automation (Playwright)
  {
    id: 'playwright',
    name: 'Browser Automation',
    category: 'browser_automation',
    description: 'Automate any website - scraping, form filling, testing, monitoring',
    capabilities: ['web_scraping', 'form_automation', 'screenshot', 'pdf_generation', 'monitoring', 'testing'],
    requiredAuth: 'none',
    provider: 'Playwright',
    icon: '🌐'
  },

  // API Integrations via Composio/Rube
  {
    id: 'gmail',
    name: 'Gmail',
    category: 'communication',
    description: 'Send, read, organize emails automatically',
    capabilities: ['send_email', 'read_email', 'create_draft', 'add_label', 'search_emails'],
    requiredAuth: 'oauth',
    provider: 'Composio',
    icon: '📧'
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    category: 'scheduling',
    description: 'Create events, check availability, send invites',
    capabilities: ['create_event', 'check_availability', 'send_invite', 'get_events'],
    requiredAuth: 'oauth',
    provider: 'Composio',
    icon: '📅'
  },
  {
    id: 'google_sheets',
    name: 'Google Sheets',
    category: 'data_processing',
    description: 'Read, write, analyze spreadsheet data',
    capabilities: ['read_data', 'write_data', 'create_sheet', 'analyze_data', 'export'],
    requiredAuth: 'oauth',
    provider: 'Composio',
    icon: '📊'
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'communication',
    description: 'Send messages, create channels, manage notifications',
    capabilities: ['send_message', 'create_channel', 'upload_file', 'search_messages'],
    requiredAuth: 'oauth',
    provider: 'Composio',
    icon: '💬'
  },
  {
    id: 'notion',
    name: 'Notion',
    category: 'productivity',
    description: 'Create pages, databases, manage content',
    capabilities: ['create_page', 'update_database', 'search_content', 'create_block'],
    requiredAuth: 'oauth',
    provider: 'Composio',
    icon: '📝'
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'productivity',
    description: 'Create issues, PRs, manage repositories',
    capabilities: ['create_issue', 'create_pr', 'list_repos', 'commit_code'],
    requiredAuth: 'oauth',
    provider: 'Composio',
    icon: '🐙'
  },

  // Travel & Booking
  {
    id: 'skyscanner',
    name: 'Flight Search',
    category: 'travel',
    description: 'Search and compare flight prices',
    capabilities: ['search_flights', 'compare_prices', 'track_prices', 'get_cheapest'],
    requiredAuth: 'api_key',
    provider: 'Skyscanner API',
    icon: '✈️'
  },
  {
    id: 'booking_hotels',
    name: 'Hotel Booking',
    category: 'travel',
    description: 'Search hotels, resorts, vacation rentals',
    capabilities: ['search_hotels', 'check_availability', 'compare_prices', 'get_reviews'],
    requiredAuth: 'api_key',
    provider: 'Booking.com API',
    icon: '🏨'
  },
  {
    id: 'google_maps',
    name: 'Google Maps',
    category: 'travel',
    description: 'Find places, restaurants, directions',
    capabilities: ['search_places', 'get_directions', 'find_restaurants', 'get_reviews'],
    requiredAuth: 'api_key',
    provider: 'Google Maps',
    icon: '🗺️'
  },
  {
    id: 'yelp',
    name: 'Yelp',
    category: 'travel',
    description: 'Find restaurants, activities, local businesses',
    capabilities: ['search_restaurants', 'search_activities', 'get_reviews', 'filter_by_rating'],
    requiredAuth: 'api_key',
    provider: 'Yelp Fusion',
    icon: '⭐'
  },

  // Finance & Accounting
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    category: 'finance',
    description: 'Manage invoices, expenses, financial reports',
    capabilities: ['create_invoice', 'track_expenses', 'generate_report', 'sync_transactions'],
    requiredAuth: 'oauth',
    provider: 'Composio',
    icon: '💰'
  },
  {
    id: 'excel_processor',
    name: 'Excel Processor',
    category: 'data_processing',
    description: 'Parse, analyze, and summarize Excel files',
    capabilities: ['parse_excel', 'extract_changes', 'compare_versions', 'generate_summary'],
    requiredAuth: 'none',
    provider: 'Local',
    icon: '📈'
  }
]

// Intent patterns for smart detection
export interface IntentPattern {
  intent: string
  keywords: string[]
  requiredInfo: string[]
  optionalInfo: string[]
  suggestedTools: string[]
  workflowType: 'travel' | 'business' | 'personal' | 'productivity' | 'finance' | 'communication'
}

export const INTENT_PATTERNS: IntentPattern[] = [
  // Calendar & Meeting Management (HIGH PRIORITY - check first)
  {
    intent: 'calendar_management',
    keywords: ['meeting', 'meetings', 'calendar', 'schedule', 'appointment', 'appointments', 'manage my time', 'organize my day', 'time management', 'agenda', 'availability', 'book time', 'schedule meeting'],
    requiredInfo: ['meeting_type'],
    optionalInfo: ['frequency', 'duration', 'attendees', 'notification_preferences'],
    suggestedTools: ['google_calendar', 'gmail', 'slack', 'notion'],
    workflowType: 'productivity'
  },

  // Travel Planning
  {
    intent: 'trip_planning',
    keywords: ['trip', 'vacation', 'travel', 'visit', 'go to', 'flying', 'anniversary', 'honeymoon', 'getaway'],
    requiredInfo: ['destination', 'dates'],
    optionalInfo: ['budget', 'travelers', 'preferences', 'activities'],
    suggestedTools: ['skyscanner', 'booking_hotels', 'google_maps', 'yelp', 'google_calendar'],
    workflowType: 'travel'
  },
  {
    intent: 'ski_trip',
    keywords: ['ski', 'skiing', 'snowboard', 'snow', 'winter sport', 'slopes', 'mountain'],
    requiredInfo: ['destination', 'dates'],
    optionalInfo: ['skill_level', 'equipment_needed', 'lessons', 'budget'],
    suggestedTools: ['skyscanner', 'booking_hotels', 'google_maps', 'yelp'],
    workflowType: 'travel'
  },
  {
    intent: 'conference_travel',
    keywords: ['conference trip', 'business trip', 'conference', 'summit trip', 'convention trip', 'seminar trip', 'attending conference'],
    requiredInfo: ['location', 'dates', 'conference_venue'],
    optionalInfo: ['budget', 'preferences', 'free_time_activities'],
    suggestedTools: ['skyscanner', 'booking_hotels', 'google_calendar', 'yelp', 'google_maps'],
    workflowType: 'business'
  },

  // Trading & Finance
  {
    intent: 'trading_strategy',
    keywords: ['trading', 'trade', 'stock', 'stocks', 'crypto', 'cryptocurrency', 'forex', 'market', 'invest', 'investment', 'portfolio', 'buy', 'sell', 'price alert', 'trading strategy'],
    requiredInfo: ['asset_type', 'strategy_goal'],
    optionalInfo: ['risk_tolerance', 'timeframe', 'capital', 'indicators'],
    suggestedTools: ['playwright', 'google_sheets', 'gmail', 'slack'],
    workflowType: 'finance'
  },
  {
    intent: 'price_monitoring',
    keywords: ['price', 'prices', 'competitor', 'competitors', 'pricing', 'cost', 'deal', 'deals', 'discount', 'sale'],
    requiredInfo: ['target_url', 'frequency'],
    optionalInfo: ['price_threshold', 'notifications', 'comparison'],
    suggestedTools: ['playwright', 'google_sheets', 'gmail', 'slack'],
    workflowType: 'business'
  },

  // Business Automation
  {
    intent: 'data_tracking',
    keywords: ['track', 'monitor', 'changes', 'updates', 'excel', 'spreadsheet', 'accounting', 'report'],
    requiredInfo: ['data_source', 'frequency'],
    optionalInfo: ['recipients', 'format', 'filters'],
    suggestedTools: ['excel_processor', 'gmail', 'slack', 'google_sheets'],
    workflowType: 'business'
  },
  {
    intent: 'email_automation',
    keywords: ['email', 'send', 'notify', 'newsletter', 'followup', 'remind', 'outreach', 'campaign'],
    requiredInfo: ['trigger', 'recipients'],
    optionalInfo: ['template', 'schedule', 'conditions'],
    suggestedTools: ['gmail', 'google_sheets', 'google_calendar'],
    workflowType: 'communication'
  },
  {
    intent: 'web_scraping',
    keywords: ['scrape', 'extract', 'monitor website', 'price tracking', 'data from website', 'crawl', 'collect data'],
    requiredInfo: ['target_url', 'data_to_extract'],
    optionalInfo: ['frequency', 'output_format', 'notifications'],
    suggestedTools: ['playwright', 'google_sheets', 'gmail', 'slack'],
    workflowType: 'productivity'
  },
  {
    intent: 'testing_monitoring',
    keywords: ['test', 'check', 'verify', 'broken', 'working', 'monitor', 'uptime', 'alert'],
    requiredInfo: ['target'],
    optionalInfo: ['frequency', 'alerts', 'screenshot'],
    suggestedTools: ['playwright', 'gmail', 'slack'],
    workflowType: 'productivity'
  },

  // Content & Social
  {
    intent: 'content_automation',
    keywords: ['content', 'post', 'social', 'twitter', 'linkedin', 'blog', 'publish', 'schedule post', 'automate posts'],
    requiredInfo: ['platform', 'content_type'],
    optionalInfo: ['schedule', 'audience', 'hashtags'],
    suggestedTools: ['playwright', 'notion', 'google_sheets', 'gmail'],
    workflowType: 'productivity'
  },

  // Research & Analysis
  {
    intent: 'research_automation',
    keywords: ['research', 'analyze', 'analysis', 'study', 'investigate', 'find information', 'gather data', 'market research'],
    requiredInfo: ['topic', 'sources'],
    optionalInfo: ['depth', 'format', 'deadline'],
    suggestedTools: ['playwright', 'google_sheets', 'notion', 'gmail'],
    workflowType: 'productivity'
  },

  // Lead & CRM
  {
    intent: 'lead_management',
    keywords: ['lead', 'leads', 'crm', 'prospect', 'prospects', 'sales', 'customer', 'pipeline', 'qualification'],
    requiredInfo: ['lead_source', 'qualification_criteria'],
    optionalInfo: ['follow_up_schedule', 'assignment_rules', 'scoring'],
    suggestedTools: ['gmail', 'google_sheets', 'slack', 'google_calendar'],
    workflowType: 'business'
  }
]

// Smart question generator
export interface SmartQuestion {
  id: string
  question: string
  type: 'text' | 'date' | 'select' | 'multiselect' | 'number' | 'confirm'
  options?: string[]
  required: boolean
  inferFrom?: string // Can be inferred from previous answers
  defaultValue?: string | number
  placeholder?: string
}

// Workflow node definition
export interface WorkflowNode {
  id: string
  type: 'trigger' | 'action' | 'condition' | 'output' | 'ai'
  tool: string
  toolIcon: string
  name: string
  description: string
  config: Record<string, unknown>
  position: { x: number; y: number }
}

export interface MissingInfoItem {
  question: string
  options: string[]
  field: string
}

export interface GeneratedWorkflow {
  id: string
  name: string
  description: string
  nodes: WorkflowNode[]
  connections: Array<{ from: string; to: string }>
  requiredIntegrations: string[]
  estimatedTimeSaved: string
  complexity: 'simple' | 'medium' | 'complex'
  // New fields for confidence-based execution
  confidence?: number  // 0.0-1.0, >= 0.85 means ready to execute
  assumptions?: string[]  // List of defaults that were assumed
  missingInfo?: MissingInfoItem[]  // Questions to increase confidence
  // @NEXUS-FIX-026: Collected parameters from missingInfo answers
  collectedParams?: Record<string, string>  // User answers to missingInfo questions
}

// The main engine class
export class SmartWorkflowEngine {
  // Detect intent from natural language
  detectIntent(message: string): IntentPattern | null {
    const messageLower = message.toLowerCase()

    let bestMatch: IntentPattern | null = null
    let maxScore = 0

    for (const pattern of INTENT_PATTERNS) {
      const score = pattern.keywords.filter(kw => messageLower.includes(kw)).length
      if (score > maxScore) {
        maxScore = score
        bestMatch = pattern
      }
    }

    return maxScore > 0 ? bestMatch : null
  }

  // Extract information from user message
  extractInfo(message: string): Record<string, string> {
    const info: Record<string, string> = {}
    const messageLower = message.toLowerCase()

    // Date extraction
    const datePatterns = [
      /in (\d+) (day|week|month)s?/i,
      /after (\d+) (day|week|month)s?/i,
      /(next|this) (week|month|weekend)/i,
      /on (\w+ \d+)/i,
      /(\d{1,2}\/\d{1,2}\/\d{2,4})/
    ]

    for (const pattern of datePatterns) {
      const match = message.match(pattern)
      if (match) {
        info.dates = match[0]
        break
      }
    }

    // Location extraction
    const locationPatterns = [
      /(?:to|in|at|visit|go to) ([A-Z][a-zA-Z\s]+?)(?:\.|,|$| for| and| in)/,
      /([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*) (?:trip|vacation|conference)/
    ]

    for (const pattern of locationPatterns) {
      const match = message.match(pattern)
      if (match) {
        info.destination = match[1].trim()
        break
      }
    }

    // Activity extraction
    if (messageLower.includes('ski')) info.activity = 'skiing'
    if (messageLower.includes('conference')) info.activity = 'conference'
    if (messageLower.includes('anniversary')) info.occasion = 'anniversary'
    if (messageLower.includes('honeymoon')) info.occasion = 'honeymoon'

    // Budget hints
    const budgetMatch = message.match(/budget[:\s]+\$?(\d+)/i)
    if (budgetMatch) info.budget = budgetMatch[1]

    // People count
    const peopleMatch = message.match(/(\d+)\s*(?:people|persons|guests|travelers)/i)
    if (peopleMatch) info.travelers = peopleMatch[1]

    return info
  }

  // Generate minimal smart questions based on what we already know
  generateSmartQuestions(intent: IntentPattern, knownInfo: Record<string, string>): SmartQuestion[] {
    const questions: SmartQuestion[] = []

    // Only ask for truly required info we don't have
    for (const required of intent.requiredInfo) {
      if (!knownInfo[required]) {
        questions.push(this.createQuestion(required, intent))
      }
    }

    // Add one optional question if it would significantly improve the workflow
    if (questions.length < 2 && intent.optionalInfo.length > 0) {
      const importantOptional = intent.optionalInfo[0]
      if (!knownInfo[importantOptional]) {
        const q = this.createQuestion(importantOptional, intent)
        q.required = false
        questions.push(q)
      }
    }

    return questions.slice(0, 3) // Max 3 questions
  }

  private createQuestion(field: string, _intent: IntentPattern): SmartQuestion {
    const questionMap: Record<string, Partial<SmartQuestion>> = {
      destination: {
        question: "Where would you like to go?",
        type: 'text',
        placeholder: 'e.g., Aspen, Colorado'
      },
      dates: {
        question: "When are you planning to go?",
        type: 'text',
        placeholder: 'e.g., March 15-22, 2025'
      },
      budget: {
        question: "What's your approximate budget?",
        type: 'select',
        options: ['Budget-friendly ($)', 'Moderate ($$)', 'Luxury ($$$)', 'No limit']
      },
      travelers: {
        question: "How many travelers?",
        type: 'number',
        defaultValue: 2
      },
      skill_level: {
        question: "What's your skiing experience?",
        type: 'select',
        options: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
      },
      equipment_needed: {
        question: "Do you need equipment rentals?",
        type: 'confirm'
      },
      location: {
        question: "Where is the event?",
        type: 'text',
        placeholder: 'e.g., Chicago, IL'
      },
      conference_venue: {
        question: "What's the venue/hotel name?",
        type: 'text',
        placeholder: 'e.g., Hilton Chicago'
      },
      data_source: {
        question: "Where is the data coming from?",
        type: 'select',
        options: ['Excel files', 'Google Sheets', 'Database', 'Website', 'API']
      },
      frequency: {
        question: "How often should this run?",
        type: 'select',
        options: ['Real-time', 'Every hour', 'Daily', 'Weekly']
      },
      recipients: {
        question: "Who should receive the results?",
        type: 'text',
        placeholder: 'e.g., team@company.com'
      },
      target_url: {
        question: "What website do you want to automate?",
        type: 'text',
        placeholder: 'https://...'
      },
      target: {
        question: "What do you want to test or monitor?",
        type: 'text',
        placeholder: 'URL or description'
      },
      // Trading & Finance
      asset_type: {
        question: "What assets are you trading?",
        type: 'select',
        options: ['Stocks', 'Crypto', 'Forex', 'Options', 'Commodities', 'Mixed']
      },
      strategy_goal: {
        question: "What's your trading strategy goal?",
        type: 'select',
        options: ['Day trading signals', 'Swing trade alerts', 'Portfolio rebalancing', 'Price alerts', 'News-based trading', 'Technical analysis']
      },
      risk_tolerance: {
        question: "What's your risk tolerance?",
        type: 'select',
        options: ['Conservative', 'Moderate', 'Aggressive']
      },
      timeframe: {
        question: "What's your trading timeframe?",
        type: 'select',
        options: ['Scalping (minutes)', 'Day trading (hours)', 'Swing (days)', 'Position (weeks)', 'Long-term (months)']
      },
      // Content & Research
      platform: {
        question: "Which platform will you use?",
        type: 'select',
        options: ['Twitter/X', 'LinkedIn', 'Blog', 'Multiple']
      },
      content_type: {
        question: "What type of content?",
        type: 'select',
        options: ['Text posts', 'Images', 'Videos', 'Articles', 'Mixed']
      },
      topic: {
        question: "What topic should I research?",
        type: 'text',
        placeholder: 'e.g., market trends, competitor analysis'
      },
      sources: {
        question: "Where should I gather information from?",
        type: 'select',
        options: ['Web search', 'News sites', 'Social media', 'Industry reports', 'All sources']
      },
      // Lead Management
      lead_source: {
        question: "Where do your leads come from?",
        type: 'select',
        options: ['Website forms', 'LinkedIn', 'Cold outreach', 'Referrals', 'Events', 'Multiple sources']
      },
      qualification_criteria: {
        question: "How do you qualify leads?",
        type: 'text',
        placeholder: 'e.g., company size, budget, timeline'
      },
      // Calendar & Meeting Management
      meeting_type: {
        question: "What types of meetings do you want to manage?",
        type: 'select',
        options: ['All meetings', 'Team meetings', '1:1s', 'Client meetings', 'External meetings', 'Recurring meetings']
      },
      notification_preferences: {
        question: "How do you want to be reminded?",
        type: 'select',
        options: ['Email only', 'Slack only', 'Both email and Slack', 'Calendar notifications only']
      },
      attendees: {
        question: "Who are the typical attendees?",
        type: 'text',
        placeholder: 'e.g., team members, clients, specific people'
      },
      duration: {
        question: "What's the typical meeting duration?",
        type: 'select',
        options: ['15 minutes', '30 minutes', '1 hour', 'Varies']
      }
    }

    const base = questionMap[field] || {
      question: `What is the ${field.replace(/_/g, ' ')}?`,
      type: 'text' as const
    }

    return {
      id: field,
      required: true,
      ...base
    } as SmartQuestion
  }

  // Generate the actual workflow based on collected info
  generateWorkflow(intent: IntentPattern, info: Record<string, string>): GeneratedWorkflow {
    // Get relevant tools for workflow generation
    const tools = EMBEDDED_TOOLS.filter(t => intent.suggestedTools.includes(t.id))

    // Generate workflow based on intent type
    switch (intent.intent) {
      case 'calendar_management':
        return this.generateCalendarWorkflow(intent, info, tools)
      case 'ski_trip':
      case 'trip_planning':
        return this.generateTravelWorkflow(intent, info, tools)
      case 'conference_travel':
        return this.generateConferenceWorkflow(intent, info, tools)
      case 'data_tracking':
        return this.generateDataTrackingWorkflow(intent, info, tools)
      case 'web_scraping':
        return this.generateScrapingWorkflow(intent, info, tools)
      case 'price_monitoring':
        return this.generatePriceMonitoringWorkflow(intent, info, tools)
      case 'testing_monitoring':
        return this.generateMonitoringWorkflow(intent, info, tools)
      case 'trading_strategy':
        return this.generateTradingWorkflow(intent, info, tools)
      case 'content_automation':
        return this.generateContentWorkflow(intent, info, tools)
      case 'research_automation':
        return this.generateResearchWorkflow(intent, info, tools)
      case 'lead_management':
        return this.generateLeadWorkflow(intent, info, tools)
      default:
        return this.generateGenericWorkflow(intent, info, tools)
    }
  }

  private generateTravelWorkflow(intent: IntentPattern, info: Record<string, string>, _tools: IntegrationTool[]): GeneratedWorkflow {
    const destination = info.destination || 'your destination'
    const dates = info.dates || 'your dates'
    const isSkiTrip = intent.intent === 'ski_trip'

    const nodes: WorkflowNode[] = [
      {
        id: '1',
        type: 'trigger',
        tool: 'user_input',
        toolIcon: '🎯',
        name: 'Trip Request',
        description: `${isSkiTrip ? 'Ski trip' : 'Trip'} to ${destination}`,
        config: { destination, dates, occasion: info.occasion },
        position: { x: 100, y: 200 }
      },
      {
        id: '2',
        type: 'action',
        tool: 'skyscanner',
        toolIcon: '✈️',
        name: 'Search Flights',
        description: `Find best flights to ${destination}`,
        config: { destination, dates, class: 'economy', flexible: true },
        position: { x: 300, y: 100 }
      },
      {
        id: '3',
        type: 'action',
        tool: 'booking_hotels',
        toolIcon: '🏨',
        name: isSkiTrip ? 'Find Ski Resorts' : 'Find Hotels',
        description: `Search ${isSkiTrip ? 'ski resorts' : 'hotels'} near ${destination}`,
        config: { location: destination, dates, type: isSkiTrip ? 'ski_resort' : 'hotel' },
        position: { x: 300, y: 300 }
      },
      {
        id: '4',
        type: 'action',
        tool: 'google_maps',
        toolIcon: '🗺️',
        name: 'Find Local Spots',
        description: 'Discover restaurants & attractions',
        config: { location: destination, types: ['restaurant', 'attraction'] },
        position: { x: 500, y: 100 }
      }
    ]

    if (isSkiTrip) {
      nodes.push({
        id: '5',
        type: 'action',
        tool: 'playwright',
        toolIcon: '🎿',
        name: 'Equipment Rentals',
        description: 'Search ski equipment rentals',
        config: { search: `ski rentals ${destination}`, scrape: true },
        position: { x: 500, y: 200 }
      })
      nodes.push({
        id: '6',
        type: 'action',
        tool: 'playwright',
        toolIcon: '📚',
        name: 'Ski Lessons',
        description: 'Find ski/snowboard lessons',
        config: { search: `ski lessons ${destination}`, level: info.skill_level || 'beginner' },
        position: { x: 500, y: 300 }
      })
    }

    nodes.push({
      id: '7',
      type: 'action',
      tool: 'yelp',
      toolIcon: '🍽️',
      name: 'Fine Dining',
      description: 'Find top-rated restaurants',
      config: { location: destination, category: 'restaurants', price: info.budget || '$$' },
      position: { x: 700, y: 200 }
    })

    nodes.push({
      id: '8',
      type: 'action',
      tool: 'google_calendar',
      toolIcon: '📅',
      name: 'Create Itinerary',
      description: 'Build your trip calendar',
      config: { title: `${destination} Trip`, dates },
      position: { x: 900, y: 200 }
    })

    nodes.push({
      id: '9',
      type: 'output',
      tool: 'gmail',
      toolIcon: '📧',
      name: 'Send Itinerary',
      description: 'Email complete trip plan',
      config: { template: 'trip_summary' },
      position: { x: 1100, y: 200 }
    })

    return {
      id: `workflow-${Date.now()}`,
      name: `${info.occasion ? info.occasion.charAt(0).toUpperCase() + info.occasion.slice(1) + ' ' : ''}${isSkiTrip ? 'Ski Trip' : 'Trip'} to ${destination}`,
      description: `Complete travel automation for your ${isSkiTrip ? 'ski trip' : 'trip'} - flights, ${isSkiTrip ? 'resorts' : 'hotels'}, dining, and activities`,
      nodes,
      connections: [
        { from: '1', to: '2' },
        { from: '1', to: '3' },
        { from: '2', to: '4' },
        { from: '3', to: '4' },
        { from: '4', to: '5' },
        { from: '5', to: '6' },
        { from: '6', to: '7' },
        { from: '7', to: '8' },
        { from: '8', to: '9' }
      ],
      requiredIntegrations: ['skyscanner', 'booking_hotels', 'google_maps', 'yelp', 'google_calendar', 'gmail'],
      estimatedTimeSaved: '4-6 hours',
      complexity: 'medium'
    }
  }

  private generateCalendarWorkflow(_intent: IntentPattern, info: Record<string, string>, _tools: IntegrationTool[]): GeneratedWorkflow {
    const meetingType = info.meeting_type || 'all meetings'
    const frequency = info.frequency || 'daily'

    return {
      id: `workflow-${Date.now()}`,
      name: 'Smart Meeting Manager',
      description: `Intelligent automation to help you manage ${meetingType} - scheduling, reminders, prep, and follow-ups`,
      nodes: [
        {
          id: '1',
          type: 'trigger',
          tool: 'google_calendar',
          toolIcon: '📅',
          name: 'Calendar Monitor',
          description: `Track ${meetingType} on your calendar`,
          config: { monitorType: meetingType, frequency },
          position: { x: 100, y: 200 }
        },
        {
          id: '2',
          type: 'action',
          tool: 'google_calendar',
          toolIcon: '📅',
          name: 'Daily Agenda',
          description: 'Generate daily meeting summary each morning',
          config: {
            action: 'get_events',
            period: 'today',
            includeDetails: true
          },
          position: { x: 300, y: 100 }
        },
        {
          id: '3',
          type: 'action',
          tool: 'gmail',
          toolIcon: '📧',
          name: 'Meeting Prep',
          description: 'Find relevant emails & docs for each meeting',
          config: {
            search: 'meeting participants and topics',
            extractAttachments: true
          },
          position: { x: 300, y: 300 }
        },
        {
          id: '4',
          type: 'action',
          tool: 'notion',
          toolIcon: '📝',
          name: 'Create Meeting Notes',
          description: 'Auto-generate meeting notes template',
          config: {
            template: 'meeting_notes',
            includeAgenda: true,
            includeAttendees: true
          },
          position: { x: 500, y: 100 }
        },
        {
          id: '5',
          type: 'action',
          tool: 'slack',
          toolIcon: '💬',
          name: 'Meeting Reminders',
          description: 'Send reminders 15 min before meetings',
          config: {
            reminderTime: '15 minutes before',
            includeAgenda: true,
            channel: '#meetings'
          },
          position: { x: 500, y: 300 }
        },
        {
          id: '6',
          type: 'action',
          tool: 'google_calendar',
          toolIcon: '📅',
          name: 'Optimize Schedule',
          description: 'Find optimal meeting times & reduce conflicts',
          config: {
            action: 'find_optimal_slots',
            bufferTime: '15 minutes',
            preferredHours: '9am-5pm'
          },
          position: { x: 700, y: 100 }
        },
        {
          id: '7',
          type: 'action',
          tool: 'gmail',
          toolIcon: '📧',
          name: 'Follow-up Actions',
          description: 'Send automated follow-up emails after meetings',
          config: {
            template: 'meeting_followup',
            includeNotes: true,
            triggerAfter: '1 hour'
          },
          position: { x: 700, y: 300 }
        },
        {
          id: '8',
          type: 'output',
          tool: 'gmail',
          toolIcon: '📧',
          name: 'Daily Summary',
          description: 'End-of-day meeting summary email',
          config: {
            template: 'daily_meeting_summary',
            frequency: 'daily',
            time: '5pm'
          },
          position: { x: 900, y: 200 }
        }
      ],
      connections: [
        { from: '1', to: '2' },
        { from: '1', to: '3' },
        { from: '2', to: '4' },
        { from: '3', to: '4' },
        { from: '4', to: '5' },
        { from: '5', to: '6' },
        { from: '5', to: '7' },
        { from: '6', to: '8' },
        { from: '7', to: '8' }
      ],
      requiredIntegrations: ['google_calendar', 'gmail', 'notion', 'slack'],
      estimatedTimeSaved: '3-5 hours per week',
      complexity: 'medium'
    }
  }

  private generateConferenceWorkflow(_intent: IntentPattern, info: Record<string, string>, _tools: IntegrationTool[]): GeneratedWorkflow {
    const location = info.location || info.destination || 'conference location'
    const venue = info.conference_venue || 'conference venue'

    return {
      id: `workflow-${Date.now()}`,
      name: `Conference Trip: ${location}`,
      description: 'Automated conference travel - flights, nearby hotels, and local events',
      nodes: [
        {
          id: '1',
          type: 'trigger',
          tool: 'user_input',
          toolIcon: '🎯',
          name: 'Conference Details',
          description: `Conference at ${venue}`,
          config: { venue, location, dates: info.dates },
          position: { x: 100, y: 200 }
        },
        {
          id: '2',
          type: 'action',
          tool: 'skyscanner',
          toolIcon: '✈️',
          name: 'Best Flight Deals',
          description: `Find optimal flights to ${location}`,
          config: { destination: location, dates: info.dates, flexibility: 'low' },
          position: { x: 300, y: 100 }
        },
        {
          id: '3',
          type: 'action',
          tool: 'booking_hotels',
          toolIcon: '🏨',
          name: 'Hotels Near Venue',
          description: `Hotels within walking distance of ${venue}`,
          config: { near: venue, location, sortBy: 'distance' },
          position: { x: 300, y: 300 }
        },
        {
          id: '4',
          type: 'action',
          tool: 'playwright',
          toolIcon: '🌐',
          name: 'Local Events',
          description: 'Scrape local events during your stay',
          config: { search: `events ${location} ${info.dates}`, sources: ['eventbrite', 'meetup'] },
          position: { x: 500, y: 100 }
        },
        {
          id: '5',
          type: 'action',
          tool: 'yelp',
          toolIcon: '🍽️',
          name: 'Restaurant Reservations',
          description: 'Top-rated dining near venue',
          config: { near: venue, category: 'restaurants', reservations: true },
          position: { x: 500, y: 300 }
        },
        {
          id: '6',
          type: 'action',
          tool: 'google_calendar',
          toolIcon: '📅',
          name: 'Schedule Everything',
          description: 'Add flights, hotel, events to calendar',
          config: { createEvents: true },
          position: { x: 700, y: 200 }
        },
        {
          id: '7',
          type: 'output',
          tool: 'gmail',
          toolIcon: '📧',
          name: 'Trip Summary',
          description: 'Email with all bookings & recommendations',
          config: { template: 'conference_trip' },
          position: { x: 900, y: 200 }
        }
      ],
      connections: [
        { from: '1', to: '2' },
        { from: '1', to: '3' },
        { from: '2', to: '4' },
        { from: '3', to: '5' },
        { from: '4', to: '6' },
        { from: '5', to: '6' },
        { from: '6', to: '7' }
      ],
      requiredIntegrations: ['skyscanner', 'booking_hotels', 'playwright', 'yelp', 'google_calendar', 'gmail'],
      estimatedTimeSaved: '3-4 hours',
      complexity: 'medium'
    }
  }

  private generateDataTrackingWorkflow(_intent: IntentPattern, info: Record<string, string>, _tools: IntegrationTool[]): GeneratedWorkflow {
    const source = info.data_source || 'Excel files'
    const frequency = info.frequency || 'Daily'

    return {
      id: `workflow-${Date.now()}`,
      name: 'Automated Change Tracking & Summary',
      description: `Track changes in ${source}, summarize updates, and email reports ${frequency.toLowerCase()}`,
      nodes: [
        {
          id: '1',
          type: 'trigger',
          tool: 'scheduler',
          toolIcon: '⏰',
          name: `${frequency} Trigger`,
          description: `Runs ${frequency.toLowerCase()}`,
          config: { frequency },
          position: { x: 100, y: 200 }
        },
        {
          id: '2',
          type: 'action',
          tool: 'playwright',
          toolIcon: '🌐',
          name: 'Scan Devices/Folders',
          description: 'Detect new and modified files',
          config: { scanPath: info.target_url || '/shared/accounting', fileTypes: ['.xlsx', '.xls'] },
          position: { x: 300, y: 200 }
        },
        {
          id: '3',
          type: 'action',
          tool: 'excel_processor',
          toolIcon: '📈',
          name: 'Extract Changes',
          description: 'Compare with previous version, extract deltas',
          config: { compareVersions: true, extractChanges: true },
          position: { x: 500, y: 100 }
        },
        {
          id: '4',
          type: 'action',
          tool: 'ai_summarizer',
          toolIcon: '🤖',
          name: 'AI Summary',
          description: 'Generate human-readable change summary',
          config: { model: 'gpt-4', format: 'bullet_points' },
          position: { x: 500, y: 300 }
        },
        {
          id: '5',
          type: 'action',
          tool: 'google_sheets',
          toolIcon: '📊',
          name: 'Log Changes',
          description: 'Store change history in central sheet',
          config: { append: true, sheet: 'Change_Log' },
          position: { x: 700, y: 100 }
        },
        {
          id: '6',
          type: 'output',
          tool: 'gmail',
          toolIcon: '📧',
          name: 'Email Summary',
          description: `Send summary to ${info.recipients || 'stakeholders'}`,
          config: { to: info.recipients, subject: `${frequency} Accounting Updates`, template: 'change_summary' },
          position: { x: 700, y: 300 }
        },
        {
          id: '7',
          type: 'output',
          tool: 'slack',
          toolIcon: '💬',
          name: 'Slack Notification',
          description: 'Post to team channel',
          config: { channel: '#accounting-updates', format: 'summary' },
          position: { x: 900, y: 200 }
        }
      ],
      connections: [
        { from: '1', to: '2' },
        { from: '2', to: '3' },
        { from: '3', to: '4' },
        { from: '4', to: '5' },
        { from: '4', to: '6' },
        { from: '5', to: '7' },
        { from: '6', to: '7' }
      ],
      requiredIntegrations: ['playwright', 'excel_processor', 'google_sheets', 'gmail', 'slack'],
      estimatedTimeSaved: '2-3 hours per day',
      complexity: 'medium'
    }
  }

  private generateScrapingWorkflow(_intent: IntentPattern, info: Record<string, string>, _tools: IntegrationTool[]): GeneratedWorkflow {
    return {
      id: `workflow-${Date.now()}`,
      name: 'Automated Web Scraping',
      description: `Extract data from ${info.target_url || 'website'} and process results`,
      nodes: [
        {
          id: '1',
          type: 'trigger',
          tool: 'scheduler',
          toolIcon: '⏰',
          name: 'Schedule',
          description: `Runs ${info.frequency || 'daily'}`,
          config: { frequency: info.frequency || 'daily' },
          position: { x: 100, y: 200 }
        },
        {
          id: '2',
          type: 'action',
          tool: 'playwright',
          toolIcon: '🌐',
          name: 'Browser Automation',
          description: 'Navigate and extract data',
          config: { url: info.target_url, selectors: info.data_to_extract },
          position: { x: 300, y: 200 }
        },
        {
          id: '3',
          type: 'action',
          tool: 'google_sheets',
          toolIcon: '📊',
          name: 'Store Data',
          description: 'Save extracted data',
          config: { append: true },
          position: { x: 500, y: 200 }
        },
        {
          id: '4',
          type: 'output',
          tool: 'gmail',
          toolIcon: '📧',
          name: 'Notify',
          description: 'Send results via email',
          config: { to: info.recipients },
          position: { x: 700, y: 200 }
        }
      ],
      connections: [
        { from: '1', to: '2' },
        { from: '2', to: '3' },
        { from: '3', to: '4' }
      ],
      requiredIntegrations: ['playwright', 'google_sheets', 'gmail'],
      estimatedTimeSaved: '1-2 hours per run',
      complexity: 'simple'
    }
  }

  private generatePriceMonitoringWorkflow(_intent: IntentPattern, info: Record<string, string>, _tools: IntegrationTool[]): GeneratedWorkflow {
    const targetUrl = info.target_url || 'competitor website'
    const frequency = info.frequency || 'Every hour'
    const threshold = info.price_threshold || '5%'

    return {
      id: `workflow-${Date.now()}`,
      name: 'Competitor Price Monitoring',
      description: `Track prices on ${targetUrl} and alert on changes`,
      nodes: [
        {
          id: '1',
          type: 'trigger',
          tool: 'scheduler',
          toolIcon: '⏰',
          name: 'Price Check Schedule',
          description: `Runs ${frequency}`,
          config: { frequency, timezone: 'local' },
          position: { x: 100, y: 200 }
        },
        {
          id: '2',
          type: 'action',
          tool: 'playwright',
          toolIcon: '🌐',
          name: 'Scrape Competitor Prices',
          description: `Extract prices from ${targetUrl}`,
          config: { url: targetUrl, selectors: 'price elements' },
          position: { x: 300, y: 100 }
        },
        {
          id: '3',
          type: 'action',
          tool: 'google_sheets',
          toolIcon: '📊',
          name: 'Load Historical Prices',
          description: 'Get previous price data for comparison',
          config: { action: 'read', range: 'PriceHistory' },
          position: { x: 300, y: 300 }
        },
        {
          id: '4',
          type: 'action',
          tool: 'ai_analysis',
          toolIcon: '🤖',
          name: 'Compare Prices',
          description: `Detect changes > ${threshold}`,
          config: { threshold, comparison: 'percentage_change' },
          position: { x: 500, y: 200 }
        },
        {
          id: '5',
          type: 'condition',
          tool: 'condition',
          toolIcon: '🔀',
          name: 'Price Changed?',
          description: 'Check if significant change detected',
          config: { condition: 'price_change > threshold' },
          position: { x: 700, y: 200 }
        },
        {
          id: '6',
          type: 'action',
          tool: 'google_sheets',
          toolIcon: '📊',
          name: 'Update Price History',
          description: 'Store new prices with timestamp',
          config: { action: 'append', sheet: 'PriceHistory' },
          position: { x: 900, y: 100 }
        },
        {
          id: '7',
          type: 'action',
          tool: 'slack',
          toolIcon: '💬',
          name: 'Price Alert',
          description: 'Notify team of price changes',
          config: { channel: '#price-alerts' },
          position: { x: 900, y: 200 }
        },
        {
          id: '8',
          type: 'output',
          tool: 'gmail',
          toolIcon: '📧',
          name: 'Email Report',
          description: 'Send detailed price change report',
          config: { to: info.recipients || 'team' },
          position: { x: 900, y: 300 }
        }
      ],
      connections: [
        { from: '1', to: '2' },
        { from: '1', to: '3' },
        { from: '2', to: '4' },
        { from: '3', to: '4' },
        { from: '4', to: '5' },
        { from: '5', to: '6' },
        { from: '5', to: '7' },
        { from: '5', to: '8' }
      ],
      requiredIntegrations: ['playwright', 'google_sheets', 'slack', 'gmail'],
      estimatedTimeSaved: '3-5 hours per week',
      complexity: 'medium'
    }
  }

  private generateMonitoringWorkflow(_intent: IntentPattern, info: Record<string, string>, _tools: IntegrationTool[]): GeneratedWorkflow {
    return {
      id: `workflow-${Date.now()}`,
      name: 'Automated Testing & Monitoring',
      description: `Monitor ${info.target || 'your application'} and alert on issues`,
      nodes: [
        {
          id: '1',
          type: 'trigger',
          tool: 'scheduler',
          toolIcon: '⏰',
          name: 'Monitor Schedule',
          description: `Check every ${info.frequency || 'hour'}`,
          config: { frequency: info.frequency || 'hourly' },
          position: { x: 100, y: 200 }
        },
        {
          id: '2',
          type: 'action',
          tool: 'playwright',
          toolIcon: '🌐',
          name: 'Run Tests',
          description: 'Execute automated browser tests',
          config: { target: info.target, actions: ['navigate', 'screenshot', 'check_elements'] },
          position: { x: 300, y: 200 }
        },
        {
          id: '3',
          type: 'condition',
          tool: 'logic',
          toolIcon: '🔀',
          name: 'Check Results',
          description: 'Evaluate test outcomes',
          config: { condition: 'all_tests_pass' },
          position: { x: 500, y: 200 }
        },
        {
          id: '4',
          type: 'output',
          tool: 'slack',
          toolIcon: '💬',
          name: 'Alert Team',
          description: 'Notify on failures',
          config: { channel: '#alerts', urgency: 'high' },
          position: { x: 700, y: 100 }
        },
        {
          id: '5',
          type: 'output',
          tool: 'gmail',
          toolIcon: '📧',
          name: 'Email Report',
          description: 'Send detailed report',
          config: { includeScreenshots: true },
          position: { x: 700, y: 300 }
        }
      ],
      connections: [
        { from: '1', to: '2' },
        { from: '2', to: '3' },
        { from: '3', to: '4' },
        { from: '3', to: '5' }
      ],
      requiredIntegrations: ['playwright', 'slack', 'gmail'],
      estimatedTimeSaved: '1-2 hours per day',
      complexity: 'simple'
    }
  }

  private generateTradingWorkflow(_intent: IntentPattern, info: Record<string, string>, _tools: IntegrationTool[]): GeneratedWorkflow {
    const assetType = info.asset_type || 'Stocks'
    const strategyGoal = info.strategy_goal || 'Price alerts'
    const timeframe = info.timeframe || 'Day trading (hours)'
    const riskTolerance = info.risk_tolerance || 'Moderate'

    return {
      id: `workflow-${Date.now()}`,
      name: `${assetType} Trading Strategy - ${strategyGoal}`,
      description: `Automated ${assetType.toLowerCase()} trading workflow for ${strategyGoal.toLowerCase()} with ${riskTolerance.toLowerCase()} risk`,
      nodes: [
        {
          id: '1',
          type: 'trigger',
          tool: 'scheduler',
          toolIcon: '⏰',
          name: 'Market Monitor',
          description: `Monitor ${assetType} markets based on ${timeframe}`,
          config: { frequency: this.getFrequencyFromTimeframe(timeframe), markets: assetType },
          position: { x: 100, y: 200 }
        },
        {
          id: '2',
          type: 'action',
          tool: 'playwright',
          toolIcon: '📈',
          name: 'Fetch Market Data',
          description: `Scrape real-time ${assetType.toLowerCase()} prices and indicators`,
          config: {
            sources: this.getMarketSources(assetType),
            indicators: ['price', 'volume', 'rsi', 'macd'],
            assetType
          },
          position: { x: 300, y: 100 }
        },
        {
          id: '3',
          type: 'action',
          tool: 'playwright',
          toolIcon: '📰',
          name: 'News & Sentiment',
          description: 'Gather market news and sentiment analysis',
          config: {
            sources: ['finviz', 'reuters', 'bloomberg'],
            sentiment: true,
            assetType
          },
          position: { x: 300, y: 300 }
        },
        {
          id: '4',
          type: 'action',
          tool: 'ai_analyzer',
          toolIcon: '🤖',
          name: 'AI Analysis',
          description: `Analyze data for ${strategyGoal.toLowerCase()} signals`,
          config: {
            strategy: strategyGoal,
            riskTolerance,
            indicators: ['technical', 'fundamental', 'sentiment']
          },
          position: { x: 500, y: 200 }
        },
        {
          id: '5',
          type: 'condition',
          tool: 'logic',
          toolIcon: '🔀',
          name: 'Signal Check',
          description: 'Evaluate trading signals against criteria',
          config: {
            conditions: ['price_threshold', 'indicator_alignment', 'risk_check'],
            riskTolerance
          },
          position: { x: 700, y: 200 }
        },
        {
          id: '6',
          type: 'action',
          tool: 'google_sheets',
          toolIcon: '📊',
          name: 'Log & Track',
          description: 'Record signals and portfolio performance',
          config: {
            sheets: ['Signals', 'Portfolio', 'Performance'],
            append: true
          },
          position: { x: 900, y: 100 }
        },
        {
          id: '7',
          type: 'output',
          tool: 'slack',
          toolIcon: '💬',
          name: 'Trading Alerts',
          description: 'Send real-time trading signals to Slack',
          config: {
            channel: '#trading-signals',
            urgency: 'high',
            includeChart: true
          },
          position: { x: 900, y: 200 }
        },
        {
          id: '8',
          type: 'output',
          tool: 'gmail',
          toolIcon: '📧',
          name: 'Daily Summary',
          description: 'Email daily trading summary and performance',
          config: {
            template: 'trading_summary',
            frequency: 'daily',
            includeMetrics: true
          },
          position: { x: 900, y: 300 }
        }
      ],
      connections: [
        { from: '1', to: '2' },
        { from: '1', to: '3' },
        { from: '2', to: '4' },
        { from: '3', to: '4' },
        { from: '4', to: '5' },
        { from: '5', to: '6' },
        { from: '5', to: '7' },
        { from: '6', to: '8' }
      ],
      requiredIntegrations: ['playwright', 'google_sheets', 'slack', 'gmail'],
      estimatedTimeSaved: '3-5 hours per day',
      complexity: 'complex'
    }
  }

  private getFrequencyFromTimeframe(timeframe: string): string {
    if (timeframe.includes('minutes') || timeframe.includes('Scalping')) return 'every 5 minutes'
    if (timeframe.includes('hours') || timeframe.includes('Day')) return 'every hour'
    if (timeframe.includes('days') || timeframe.includes('Swing')) return 'every 4 hours'
    if (timeframe.includes('weeks') || timeframe.includes('Position')) return 'daily'
    return 'daily'
  }

  private getMarketSources(assetType: string): string[] {
    const sources: Record<string, string[]> = {
      'Stocks': ['yahoo-finance', 'tradingview', 'finviz'],
      'Crypto': ['coingecko', 'coinmarketcap', 'tradingview'],
      'Forex': ['forex-factory', 'investing.com', 'tradingview'],
      'Options': ['yahoo-finance', 'barchart', 'tradingview'],
      'Commodities': ['investing.com', 'tradingview', 'kitco'],
      'Mixed': ['tradingview', 'yahoo-finance', 'coingecko']
    }
    return sources[assetType] || sources['Mixed']
  }

  private generateContentWorkflow(_intent: IntentPattern, info: Record<string, string>, _tools: IntegrationTool[]): GeneratedWorkflow {
    const platform = info.platform || 'Multiple'
    const contentType = info.content_type || 'Text posts'

    return {
      id: `workflow-${Date.now()}`,
      name: `${platform} Content Automation`,
      description: `Automated ${contentType.toLowerCase()} creation and publishing for ${platform}`,
      nodes: [
        {
          id: '1',
          type: 'trigger',
          tool: 'scheduler',
          toolIcon: '⏰',
          name: 'Content Schedule',
          description: `Run ${info.schedule || 'daily'} for content creation`,
          config: { frequency: info.schedule || 'daily' },
          position: { x: 100, y: 200 }
        },
        {
          id: '2',
          type: 'action',
          tool: 'playwright',
          toolIcon: '🔍',
          name: 'Research Trends',
          description: 'Gather trending topics and hashtags',
          config: {
            sources: ['twitter-trends', 'google-trends', 'reddit'],
            platform
          },
          position: { x: 300, y: 100 }
        },
        {
          id: '3',
          type: 'action',
          tool: 'notion',
          toolIcon: '📝',
          name: 'Content Ideas',
          description: 'Pull content ideas from Notion database',
          config: { database: 'content_calendar', status: 'ready' },
          position: { x: 300, y: 300 }
        },
        {
          id: '4',
          type: 'action',
          tool: 'ai_generator',
          toolIcon: '🤖',
          name: 'Generate Content',
          description: `Create ${contentType.toLowerCase()} with AI`,
          config: {
            type: contentType,
            platform,
            tone: info.audience || 'professional',
            hashtags: info.hashtags || 'auto'
          },
          position: { x: 500, y: 200 }
        },
        {
          id: '5',
          type: 'action',
          tool: 'google_sheets',
          toolIcon: '📊',
          name: 'Track Content',
          description: 'Log content and schedule in spreadsheet',
          config: { sheet: 'Content_Calendar', append: true },
          position: { x: 700, y: 100 }
        },
        {
          id: '6',
          type: 'action',
          tool: 'playwright',
          toolIcon: '📤',
          name: 'Publish Content',
          description: `Post to ${platform}`,
          config: {
            platform,
            autoPost: true,
            scheduledTime: info.schedule
          },
          position: { x: 700, y: 300 }
        },
        {
          id: '7',
          type: 'output',
          tool: 'gmail',
          toolIcon: '📧',
          name: 'Performance Report',
          description: 'Email weekly content performance summary',
          config: {
            template: 'content_performance',
            frequency: 'weekly'
          },
          position: { x: 900, y: 200 }
        }
      ],
      connections: [
        { from: '1', to: '2' },
        { from: '1', to: '3' },
        { from: '2', to: '4' },
        { from: '3', to: '4' },
        { from: '4', to: '5' },
        { from: '4', to: '6' },
        { from: '5', to: '7' },
        { from: '6', to: '7' }
      ],
      requiredIntegrations: ['playwright', 'notion', 'google_sheets', 'gmail'],
      estimatedTimeSaved: '2-4 hours per day',
      complexity: 'medium'
    }
  }

  private generateResearchWorkflow(_intent: IntentPattern, info: Record<string, string>, _tools: IntegrationTool[]): GeneratedWorkflow {
    const topic = info.topic || 'your topic'
    const sources = info.sources || 'All sources'

    return {
      id: `workflow-${Date.now()}`,
      name: `Research Automation: ${topic}`,
      description: `Comprehensive research on ${topic} from ${sources.toLowerCase()}`,
      nodes: [
        {
          id: '1',
          type: 'trigger',
          tool: 'user_input',
          toolIcon: '🎯',
          name: 'Research Request',
          description: `Research topic: ${topic}`,
          config: { topic, depth: info.depth || 'comprehensive' },
          position: { x: 100, y: 200 }
        },
        {
          id: '2',
          type: 'action',
          tool: 'playwright',
          toolIcon: '🔍',
          name: 'Web Search',
          description: 'Search major search engines and databases',
          config: {
            engines: ['google', 'bing', 'duckduckgo'],
            query: topic,
            depth: 3
          },
          position: { x: 300, y: 100 }
        },
        {
          id: '3',
          type: 'action',
          tool: 'playwright',
          toolIcon: '📰',
          name: 'News Sources',
          description: 'Gather news articles and press releases',
          config: {
            sources: ['google-news', 'reuters', 'industry-specific'],
            topic
          },
          position: { x: 300, y: 300 }
        },
        {
          id: '4',
          type: 'action',
          tool: 'playwright',
          toolIcon: '📊',
          name: 'Data Sources',
          description: 'Extract data from reports and databases',
          config: {
            sources: ['statista', 'industry-reports', 'government-data'],
            topic
          },
          position: { x: 500, y: 100 }
        },
        {
          id: '5',
          type: 'action',
          tool: 'ai_analyzer',
          toolIcon: '🤖',
          name: 'AI Analysis',
          description: 'Synthesize findings and generate insights',
          config: {
            format: info.format || 'report',
            insights: true,
            citations: true
          },
          position: { x: 500, y: 300 }
        },
        {
          id: '6',
          type: 'action',
          tool: 'notion',
          toolIcon: '📝',
          name: 'Document Findings',
          description: 'Create research document in Notion',
          config: {
            database: 'Research',
            template: 'research_report'
          },
          position: { x: 700, y: 100 }
        },
        {
          id: '7',
          type: 'action',
          tool: 'google_sheets',
          toolIcon: '📊',
          name: 'Data Export',
          description: 'Export data and statistics to spreadsheet',
          config: {
            createNew: true,
            includeCharts: true
          },
          position: { x: 700, y: 300 }
        },
        {
          id: '8',
          type: 'output',
          tool: 'gmail',
          toolIcon: '📧',
          name: 'Deliver Report',
          description: 'Email research report with attachments',
          config: {
            template: 'research_delivery',
            attachments: ['notion_pdf', 'data_spreadsheet']
          },
          position: { x: 900, y: 200 }
        }
      ],
      connections: [
        { from: '1', to: '2' },
        { from: '1', to: '3' },
        { from: '2', to: '4' },
        { from: '3', to: '5' },
        { from: '4', to: '5' },
        { from: '5', to: '6' },
        { from: '5', to: '7' },
        { from: '6', to: '8' },
        { from: '7', to: '8' }
      ],
      requiredIntegrations: ['playwright', 'notion', 'google_sheets', 'gmail'],
      estimatedTimeSaved: '4-8 hours per research project',
      complexity: 'complex'
    }
  }

  private generateLeadWorkflow(_intent: IntentPattern, info: Record<string, string>, _tools: IntegrationTool[]): GeneratedWorkflow {
    const leadSource = info.lead_source || 'Website forms'
    const criteria = info.qualification_criteria || 'standard criteria'

    return {
      id: `workflow-${Date.now()}`,
      name: 'Lead Management Automation',
      description: `Automated lead capture, qualification, and nurturing from ${leadSource}`,
      nodes: [
        {
          id: '1',
          type: 'trigger',
          tool: 'webhook',
          toolIcon: '🎯',
          name: 'Lead Capture',
          description: `New lead from ${leadSource}`,
          config: { source: leadSource, captureFields: ['name', 'email', 'company', 'phone'] },
          position: { x: 100, y: 200 }
        },
        {
          id: '2',
          type: 'action',
          tool: 'playwright',
          toolIcon: '🔍',
          name: 'Enrich Lead Data',
          description: 'Research company and contact information',
          config: {
            sources: ['linkedin', 'company-website', 'crunchbase'],
            enrichFields: ['company_size', 'industry', 'revenue']
          },
          position: { x: 300, y: 100 }
        },
        {
          id: '3',
          type: 'action',
          tool: 'ai_scorer',
          toolIcon: '🤖',
          name: 'Lead Scoring',
          description: `Qualify lead against ${criteria}`,
          config: {
            criteria: info.qualification_criteria,
            scoring: info.scoring || 'auto',
            threshold: 70
          },
          position: { x: 300, y: 300 }
        },
        {
          id: '4',
          type: 'condition',
          tool: 'logic',
          toolIcon: '🔀',
          name: 'Qualification Check',
          description: 'Route based on lead score',
          config: {
            conditions: {
              hot: 'score >= 80',
              warm: 'score >= 50',
              cold: 'score < 50'
            }
          },
          position: { x: 500, y: 200 }
        },
        {
          id: '5',
          type: 'action',
          tool: 'google_sheets',
          toolIcon: '📊',
          name: 'CRM Update',
          description: 'Add/update lead in CRM spreadsheet',
          config: {
            sheet: 'Leads_Pipeline',
            updateIfExists: true
          },
          position: { x: 700, y: 100 }
        },
        {
          id: '6',
          type: 'action',
          tool: 'gmail',
          toolIcon: '📧',
          name: 'Automated Outreach',
          description: 'Send personalized follow-up email',
          config: {
            template: 'lead_nurture',
            personalize: true,
            sequence: info.follow_up_schedule || 'standard'
          },
          position: { x: 700, y: 200 }
        },
        {
          id: '7',
          type: 'action',
          tool: 'google_calendar',
          toolIcon: '📅',
          name: 'Schedule Follow-up',
          description: 'Create follow-up task/meeting',
          config: {
            eventType: 'follow_up',
            assignTo: info.assignment_rules || 'auto'
          },
          position: { x: 700, y: 300 }
        },
        {
          id: '8',
          type: 'output',
          tool: 'slack',
          toolIcon: '💬',
          name: 'Sales Alert',
          description: 'Notify sales team of hot leads',
          config: {
            channel: '#sales-leads',
            onlyHotLeads: true,
            includeDetails: true
          },
          position: { x: 900, y: 200 }
        }
      ],
      connections: [
        { from: '1', to: '2' },
        { from: '2', to: '3' },
        { from: '3', to: '4' },
        { from: '4', to: '5' },
        { from: '4', to: '6' },
        { from: '5', to: '7' },
        { from: '6', to: '7' },
        { from: '7', to: '8' }
      ],
      requiredIntegrations: ['playwright', 'google_sheets', 'gmail', 'google_calendar', 'slack'],
      estimatedTimeSaved: '2-4 hours per day',
      complexity: 'complex'
    }
  }

  private generateGenericWorkflow(_intent: IntentPattern, _info: Record<string, string>, tools: IntegrationTool[]): GeneratedWorkflow {
    return {
      id: `workflow-${Date.now()}`,
      name: 'Custom Automation',
      description: 'Tailored workflow based on your requirements',
      nodes: tools.map((tool, i) => ({
        id: String(i + 1),
        type: i === 0 ? 'trigger' as const : i === tools.length - 1 ? 'output' as const : 'action' as const,
        tool: tool.id,
        toolIcon: tool.icon,
        name: tool.name,
        description: tool.description,
        config: {},
        position: { x: 100 + (i * 200), y: 200 }
      })),
      connections: tools.slice(0, -1).map((_, i) => ({
        from: String(i + 1),
        to: String(i + 2)
      })),
      requiredIntegrations: tools.map(t => t.id),
      estimatedTimeSaved: '1-3 hours',
      complexity: 'simple'
    }
  }

  // Proactive tool detection - finds gaps between expected and actual behavior
  detectMissingTools(userContext: string): IntegrationTool[] {
    const suggestions: IntegrationTool[] = []
    const contextLower = userContext.toLowerCase()

    // If user mentions testing/verification issues, suggest Playwright
    if (contextLower.includes('not working') || contextLower.includes('broken') ||
        contextLower.includes('verify') || contextLower.includes("doesn't work")) {
      const playwright = EMBEDDED_TOOLS.find(t => t.id === 'playwright')
      if (playwright) suggestions.push(playwright)
    }

    // If user mentions APIs or integrations, suggest Composio tools
    if (contextLower.includes('api') || contextLower.includes('integrate') ||
        contextLower.includes('connect to') || contextLower.includes('sync with')) {
      suggestions.push(...EMBEDDED_TOOLS.filter(t => t.provider === 'Composio').slice(0, 3))
    }

    // If user mentions data/spreadsheets, suggest data tools
    if (contextLower.includes('excel') || contextLower.includes('spreadsheet') ||
        contextLower.includes('data') || contextLower.includes('report')) {
      suggestions.push(...EMBEDDED_TOOLS.filter(t => t.category === 'data_processing'))
    }

    return suggestions
  }
}

// Export singleton instance
export const smartWorkflowEngine = new SmartWorkflowEngine()
