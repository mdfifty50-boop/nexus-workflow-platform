/**
 * Intent Parser - Natural Language to Structured Intent
 *
 * Parses natural language commands into structured intents that can be
 * converted into executable workflows.
 *
 * Examples:
 * - "Order healthy meal to my home" -> FoodDeliveryIntent
 * - "Analyze this PDF travel package" -> DocumentAnalysisIntent
 * - "Book cheapest flight to Dubai tomorrow" -> TravelBookingIntent
 */

import { apiClient } from '../api-client'
import type {
  ParsedIntent,
  IntentCategory,
  ExtractedEntity,
  IntentConstraint,
  MissingInformation,
} from '../../types/workflow-execution'
import { contextManager, type UserContext } from './context-manager'
import { WorkflowIntelligence } from './workflow-intelligence'

// ========================================
// Intent Pattern Definitions
// ========================================

interface IntentPattern {
  category: IntentCategory
  patterns: RegExp[]
  keywords: string[]
  extractors: EntityExtractor[]
  requiredEntities: string[]
}

interface EntityExtractor {
  type: ExtractedEntity['type']
  patterns: RegExp[]
  normalizer?: (value: string) => string
}

/**
 * Predefined intent patterns for common use cases
 */
const INTENT_PATTERNS: IntentPattern[] = [
  // Food Delivery
  {
    category: 'food_delivery',
    patterns: [
      /order\s+(?:me\s+)?(?:a\s+)?(.+?)(?:\s+to\s+|\s+at\s+|\s+for\s+)?(.+)?/i,
      /(?:i\s+want|i'd\s+like|get\s+me|deliver)\s+(.+?)(?:\s+to\s+)?(.+)?/i,
      /(?:food|meal|lunch|dinner|breakfast)\s+(?:delivery|order)/i,
    ],
    keywords: ['order', 'deliver', 'food', 'meal', 'eat', 'restaurant', 'cuisine', 'hungry', 'lunch', 'dinner', 'breakfast'],
    extractors: [
      {
        type: 'product',
        patterns: [
          /(?:order|get|want|like)\s+(?:a\s+)?(.+?)(?:\s+to\s+|\s+at\s+|$)/i,
          /(healthy|vegetarian|vegan|halal|chinese|indian|italian|mexican|thai|japanese|pizza|burger|sushi)/i,
        ],
      },
      {
        type: 'location',
        patterns: [
          /(?:to|at)\s+(my\s+home|my\s+office|work|home|.+?(?:street|ave|road|blvd|building))/i,
          /deliver(?:y)?\s+(?:to\s+)?(.+)/i,
        ],
      },
      {
        type: 'preference',
        patterns: [
          /(healthy|quick|cheap|fast|nearby|best\s+rated|top\s+rated)/i,
          /(vegetarian|vegan|halal|kosher|gluten.?free)/i,
        ],
      },
      {
        type: 'constraint',
        patterns: [
          /(?:under|less\s+than|max(?:imum)?)\s*\$?\s*(\d+)/i,
          /within\s+(\d+)\s*(?:minutes?|mins?|hours?|hrs?)/i,
        ],
      },
    ],
    requiredEntities: ['product', 'location'],
  },

  // Document Analysis
  {
    category: 'document_analysis',
    patterns: [
      /(?:analyze|review|check|read|summarize|compare)\s+(?:this\s+)?(.+?)(?:\s+document|\s+pdf|\s+file)?/i,
      /(?:what's\s+in|look\s+at|extract\s+from)\s+(?:this\s+)?(.+)/i,
    ],
    keywords: ['analyze', 'review', 'pdf', 'document', 'compare', 'extract', 'summarize', 'prices', 'travel', 'package'],
    extractors: [
      {
        type: 'product',
        patterns: [
          /(pdf|document|file|image|screenshot|travel\s+package|quote|invoice|contract)/i,
        ],
      },
      {
        type: 'preference',
        patterns: [
          /(compare\s+prices|find\s+cheapest|extract\s+dates|summarize|detailed)/i,
        ],
      },
    ],
    requiredEntities: ['product'],
  },

  // Travel
  {
    category: 'travel',
    patterns: [
      /(?:book|find|search|get)\s+(?:a\s+)?(?:flight|hotel|trip|vacation)\s+(?:to\s+)?(.+)/i,
      /(?:travel|go|fly)\s+to\s+(.+)/i,
    ],
    keywords: ['book', 'flight', 'hotel', 'travel', 'vacation', 'trip', 'fly', 'ticket', 'reservation'],
    extractors: [
      {
        type: 'location',
        patterns: [
          /(?:to|from)\s+(.+?)(?:\s+on|\s+for|\s+tomorrow|$)/i,
        ],
      },
      {
        type: 'date',
        patterns: [
          /(tomorrow|today|next\s+\w+|on\s+\w+\s+\d+|\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/i,
        ],
        normalizer: (value) => {
          // Simple date normalization - would use a proper date library in production
          if (value.toLowerCase() === 'tomorrow') {
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            return tomorrow.toISOString().split('T')[0]
          }
          if (value.toLowerCase() === 'today') {
            return new Date().toISOString().split('T')[0]
          }
          return value
        },
      },
      {
        type: 'constraint',
        patterns: [
          /(cheapest|cheapest|budget|luxury|business\s+class|economy|first\s+class)/i,
        ],
      },
    ],
    requiredEntities: ['location'],
  },

  // Communication
  {
    category: 'communication',
    patterns: [
      // Email patterns
      /send\s+(?:an?\s+)?email\s+to\s+([^\s]+@[^\s]+)\s+saying\s+(.+)/i,
      /email\s+([^\s]+@[^\s]+)\s+(?:that|saying|about)\s+(.+)/i,
      /send\s+(?:to\s+)?([^\s]+@[^\s]+):\s*(.+)/i,

      // Slack patterns
      /post\s+['"](.+)['"]\s+to\s+[#]?(\w+)\s+on\s+slack/i,
      /send\s+['"](.+)['"]\s+to\s+slack\s+channel\s+[#]?(\w+)/i,
      /slack\s+[#]?(\w+):\s*(.+)/i,

      // Get emails pattern
      /get\s+(?:my\s+)?last\s+(\d+)\s+emails?/i,
      /fetch\s+(\d+)\s+(?:recent\s+)?emails?/i,
      /show\s+(?:me\s+)?(\d+)\s+emails?/i,

      // Generic communication
      /(?:send|message|text|call|notify)\s+(.+)/i,
      /(?:tell|remind|inform)\s+(.+)\s+(?:that|about|to)/i,
    ],
    keywords: ['send', 'message', 'email', 'text', 'call', 'notify', 'remind', 'whatsapp', 'slack', 'post', 'get', 'fetch'],
    extractors: [
      {
        type: 'person',
        patterns: [
          /(?:email|to)\s+([^\s]+@[^\s]+)/i,
          /(?:send|message|text|call)\s+(.+?)(?:\s+that|\s+about|\s+to\s+say|$)/i,
        ],
      },
      {
        type: 'product' as const, // message content
        patterns: [
          /saying\s+(.+)$/i,
          /post\s+['"](.+)['"]/i,
          /:\s*(.+)$/i,
        ],
      },
      {
        type: 'location' as const, // channel location
        patterns: [
          /to\s+[#]?(\w+)\s+on\s+slack/i,
          /slack\s+channel\s+[#]?(\w+)/i,
          /[#](\w+)/i,
        ],
      },
      {
        type: 'quantity',
        patterns: [
          /(?:last|fetch|get|show)\s+(\d+)\s+emails?/i,
        ],
      },
    ],
    requiredEntities: [],
  },

  // Shopping
  {
    category: 'shopping',
    patterns: [
      /(?:buy|purchase|shop\s+for|find|compare)\s+(.+)/i,
      /(?:looking\s+for|need\s+to\s+buy|want\s+to\s+buy)\s+(.+)/i,
    ],
    keywords: ['buy', 'purchase', 'shop', 'compare', 'price', 'deal', 'discount', 'amazon', 'order'],
    extractors: [
      {
        type: 'product',
        patterns: [
          /(?:buy|purchase|find|compare)\s+(.+?)(?:\s+for|\s+under|$)/i,
        ],
      },
      {
        type: 'price',
        patterns: [
          /(?:under|less\s+than|max|budget\s+of)\s*\$?\s*(\d+(?:\.\d{2})?)/i,
        ],
      },
    ],
    requiredEntities: ['product'],
  },

  // Scheduling
  {
    category: 'scheduling',
    patterns: [
      /create\s+(?:a\s+)?(?:google\s+)?calendar\s+event\s+for\s+(.+)/i,
      /(?:schedule|set|create|add)\s+(?:a\s+)?(?:meeting|appointment|reminder|event)/i,
      /(?:remind\s+me|don't\s+let\s+me\s+forget)\s+(?:to\s+)?(.+)/i,
    ],
    keywords: ['schedule', 'meeting', 'appointment', 'reminder', 'calendar', 'event', 'remind', 'create', 'google'],
    extractors: [
      {
        type: 'time',
        patterns: [
          /(?:event\s+for|at|for)\s+(.*?(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)|tomorrow|today|next\s+\w+).*)/i,
          /(?:at|for)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
        ],
      },
      {
        type: 'date',
        patterns: [
          /(?:on|for)\s+(tomorrow|today|next\s+\w+|\w+day|\d{1,2}[\/\-]\d{1,2})/i,
        ],
      },
    ],
    requiredEntities: [],
  },
]

// ========================================
// Intent Parser Class
// ========================================

export class IntentParser {
  private userContext: UserContext | null = null

  /**
   * Load user context for preference-aware parsing
   */
  async loadUserContext(userId: string): Promise<void> {
    this.userContext = await contextManager.loadContext(userId)
  }

  /**
   * Parse natural language input into structured intent
   */
  async parse(input: string, options?: {
    useAI?: boolean
    includeContext?: boolean
    userId?: string
  }): Promise<ParsedIntent> {
    const { useAI = true, includeContext = true, userId } = options || {}

    // Load user context if available
    if (userId && includeContext) {
      await this.loadUserContext(userId)
    }

    // Step 1: Rule-based pattern matching (fast, deterministic)
    const patternResult = this.matchPatterns(input)

    // Step 2: AI-powered parsing for complex cases
    let aiResult: Partial<ParsedIntent> | null = null
    if (useAI && (patternResult.confidence < 0.7 || patternResult.missingInfo.length > 0)) {
      aiResult = await this.aiParse(input, patternResult)
    }

    // Step 3: Merge results, preferring higher-confidence extractions
    const mergedIntent = this.mergeResults(patternResult, aiResult)

    // Step 4: Enrich with user context
    if (includeContext && this.userContext) {
      this.enrichWithContext(mergedIntent)
    }

    // Step 5: Determine if we can execute or need more info
    mergedIntent.canExecute = mergedIntent.missingInfo.filter(m => m.required).length === 0

    // Step 6: Add Intelligence Analysis (CEO Directive)
    // "Nexus should intuitively provide intelligent solutions"
    const intelligence = new WorkflowIntelligence('kuwait') // Default to Kuwait regional context
    const analysis = intelligence.analyzeRequest(input)

    mergedIntent.intelligence = {
      implicitRequirements: analysis.implicitRequirements,
      clarifyingQuestions: analysis.clarifyingQuestions.map(q => ({
        id: q.id,
        question: q.question,
        category: q.category,
        options: q.options.map(o => ({
          value: o.value,
          label: o.label,
          description: o.description
        })),
        required: q.required,
        relevanceScore: q.relevanceScore
      })),
      recommendedTools: analysis.recommendedTools.map(t => ({
        toolSlug: t.toolSlug,
        toolName: t.toolName,
        score: t.score,
        reasons: t.reasons,
        regionalFit: t.regionalFit,
        accuracyRating: t.accuracyRating,
        dialectSupport: t.dialectSupport
      })),
      workflowChain: analysis.workflowChain,
      detectedLanguage: analysis.regionalContext?.language,
      detectedDialect: analysis.regionalContext?.dialect,
      regionalContext: analysis.regionalContext?.region,
      confidenceScore: analysis.confidenceScore
    }

    return mergedIntent
  }

  /**
   * Pattern-based intent matching
   */
  private matchPatterns(input: string): ParsedIntent {
    const normalizedInput = input.toLowerCase().trim()

    let bestMatch: { pattern: IntentPattern; score: number } | null = null

    // Score each pattern
    for (const pattern of INTENT_PATTERNS) {
      let score = 0

      // Check regex patterns
      for (const regex of pattern.patterns) {
        if (regex.test(normalizedInput)) {
          score += 0.4
          break
        }
      }

      // Check keywords
      const keywordMatches = pattern.keywords.filter(kw =>
        normalizedInput.includes(kw.toLowerCase())
      )
      score += (keywordMatches.length / pattern.keywords.length) * 0.3

      // Prefer longer keyword matches
      if (keywordMatches.some(kw => kw.length > 5)) {
        score += 0.1
      }

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { pattern, score }
      }
    }

    // Extract entities using the best matching pattern
    const entities: ExtractedEntity[] = []
    if (bestMatch) {
      for (const extractor of bestMatch.pattern.extractors) {
        for (const regex of extractor.patterns) {
          const match = normalizedInput.match(regex)
          if (match && match[1]) {
            entities.push({
              type: extractor.type,
              value: match[1].trim(),
              confidence: 0.7,
              normalized: extractor.normalizer ? extractor.normalizer(match[1].trim()) : undefined,
              source: 'user_input',
            })
            break
          }
        }
      }
    }

    // Determine missing information
    const missingInfo: MissingInformation[] = []
    if (bestMatch) {
      for (const required of bestMatch.pattern.requiredEntities) {
        if (!entities.some(e => e.type === required)) {
          missingInfo.push(this.createMissingInfo(required, bestMatch.pattern.category))
        }
      }
    }

    // Extract constraints
    const constraints = this.extractConstraints(input, entities)

    // Determine action from input
    const action = this.determineAction(input, bestMatch?.pattern.category || 'custom')

    return {
      id: `intent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      rawInput: input,
      category: bestMatch?.pattern.category || 'custom',
      action,
      entities,
      confidence: bestMatch?.score || 0.3,
      urgency: this.determineUrgency(input),
      constraints,
      preferences: [],
      missingInfo,
      canExecute: false,
      parsedAt: new Date().toISOString(),
    }
  }

  /**
   * AI-powered parsing for complex inputs
   */
  private async aiParse(input: string, patternResult: ParsedIntent): Promise<Partial<ParsedIntent>> {
    const systemPrompt = `You are an intent parser for a workflow automation system. Parse the user's natural language command and extract structured information.

Current understanding:
- Category: ${patternResult.category}
- Confidence: ${patternResult.confidence}
- Entities found: ${JSON.stringify(patternResult.entities)}
- Missing info: ${JSON.stringify(patternResult.missingInfo)}

User context available: ${this.userContext ? 'Yes' : 'No'}
${this.userContext ? `User has saved addresses: ${this.userContext.addresses.map(a => a.label).join(', ')}` : ''}

Respond with a JSON object containing:
{
  "category": "food_delivery|document_analysis|travel|communication|scheduling|shopping|finance|productivity|research|custom",
  "action": "specific action verb",
  "entities": [{"type": "location|time|date|quantity|price|person|organization|product|preference|constraint", "value": "extracted value", "confidence": 0.0-1.0}],
  "urgency": "immediate|today|scheduled|flexible",
  "constraints": [{"type": "budget|time_limit|location|dietary|quality", "field": "field name", "operator": "equals|less_than|greater_than|contains", "value": "constraint value", "priority": "required|preferred"}],
  "missingInfo": [{"field": "field name", "description": "what's missing", "required": true/false, "suggestedQuestion": "question to ask user"}]
}`

    try {
      const response = await apiClient.chat({
        messages: [{ role: 'user', content: input }],
        systemPrompt,
        model: 'claude-3-5-haiku-20241022',  // Fast model for parsing
        maxTokens: 1000,
      })

      if (response.success && response.output) {
        // Extract JSON from response
        const jsonMatch = response.output.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          return {
            category: parsed.category,
            action: parsed.action,
            entities: parsed.entities || [],
            urgency: parsed.urgency,
            constraints: parsed.constraints || [],
            missingInfo: parsed.missingInfo || [],
          }
        }
      }
    } catch (error) {
      console.warn('[IntentParser] AI parsing failed, using pattern-only results:', error)
    }

    return {}
  }

  /**
   * Merge pattern-based and AI results
   */
  private mergeResults(
    patternResult: ParsedIntent,
    aiResult: Partial<ParsedIntent> | null
  ): ParsedIntent {
    if (!aiResult) return patternResult

    // Prefer AI category if confidence is low
    const category = patternResult.confidence < 0.5 && aiResult.category
      ? aiResult.category
      : patternResult.category

    // Merge entities, avoiding duplicates
    const mergedEntities = [...patternResult.entities]
    for (const aiEntity of (aiResult.entities || [])) {
      if (!mergedEntities.some(e => e.type === aiEntity.type && e.value === aiEntity.value)) {
        mergedEntities.push({
          ...aiEntity,
          source: 'inferred',
        })
      }
    }

    // Merge missing info
    const mergedMissing = [...patternResult.missingInfo]
    for (const aiMissing of (aiResult.missingInfo || [])) {
      if (!mergedMissing.some(m => m.field === aiMissing.field)) {
        mergedMissing.push(aiMissing)
      }
    }

    return {
      ...patternResult,
      category,
      action: aiResult.action || patternResult.action,
      entities: mergedEntities,
      urgency: aiResult.urgency || patternResult.urgency,
      constraints: [...patternResult.constraints, ...(aiResult.constraints || [])],
      missingInfo: mergedMissing,
      confidence: Math.max(patternResult.confidence, 0.8), // Boost confidence if AI helped
    }
  }

  /**
   * Enrich intent with user context
   */
  private enrichWithContext(intent: ParsedIntent): void {
    if (!this.userContext) return

    // Resolve location references
    const locationEntity = intent.entities.find(e => e.type === 'location')
    if (locationEntity) {
      const resolvedAddress = this.resolveLocationReference(locationEntity.value)
      if (resolvedAddress) {
        locationEntity.normalized = resolvedAddress.fullAddress
        locationEntity.confidence = 1.0
        locationEntity.source = 'context'

        // Remove from missing info if it was there
        intent.missingInfo = intent.missingInfo.filter(m => m.field !== 'location')
      }
    }

    // Add default location if missing and required
    if (!locationEntity && intent.missingInfo.some(m => m.field === 'location')) {
      const defaultAddress = this.userContext.addresses.find(a => a.isDefault)
      if (defaultAddress) {
        intent.entities.push({
          type: 'location',
          value: defaultAddress.label,
          normalized: defaultAddress.fullAddress,
          confidence: 0.9,
          source: 'context',
        })
        intent.missingInfo = intent.missingInfo.filter(m => m.field !== 'location')
      }
    }

    // Apply user preferences
    const prefs = this.userContext.preferences
    if (prefs.dietary && intent.category === 'food_delivery') {
      intent.preferences.push({
        category: 'dietary',
        key: 'restrictions',
        value: prefs.dietary.restrictions,
        source: 'saved_profile',
      })
    }

    if (prefs.budget) {
      intent.preferences.push({
        category: 'budget',
        key: 'preferredPriceRange',
        value: prefs.budget.preferredPriceRange,
        source: 'saved_profile',
      })
    }
  }

  /**
   * Resolve location references like "home", "work", "office"
   */
  private resolveLocationReference(value: string): { label: string; fullAddress: string } | null {
    if (!this.userContext) return null

    const normalizedValue = value.toLowerCase().trim()

    // Direct label match
    for (const addr of this.userContext.addresses) {
      if (addr.label.toLowerCase() === normalizedValue) {
        return { label: addr.label, fullAddress: addr.fullAddress }
      }
    }

    // Common aliases
    const aliases: Record<string, string[]> = {
      'home': ['my home', 'my house', 'my place', 'residence'],
      'work': ['my work', 'office', 'my office', 'the office', 'workplace'],
    }

    for (const [label, aliasList] of Object.entries(aliases)) {
      if (aliasList.includes(normalizedValue) || normalizedValue.includes(label)) {
        const addr = this.userContext.addresses.find(a => a.label.toLowerCase() === label)
        if (addr) {
          return { label: addr.label, fullAddress: addr.fullAddress }
        }
      }
    }

    return null
  }

  /**
   * Extract constraints from input
   */
  private extractConstraints(input: string, entities: ExtractedEntity[]): IntentConstraint[] {
    const constraints: IntentConstraint[] = []
    const normalized = input.toLowerCase()

    // Budget constraints
    const budgetMatch = normalized.match(/(?:under|less\s+than|max(?:imum)?|budget(?:\s+of)?)\s*\$?\s*(\d+(?:\.\d{2})?)/i)
    if (budgetMatch) {
      constraints.push({
        type: 'budget',
        field: 'totalAmount',
        operator: 'less_than',
        value: parseFloat(budgetMatch[1]),
        priority: 'preferred',
      })
    }

    // Time constraints
    const timeMatch = normalized.match(/(?:within|in\s+less\s+than|under)\s*(\d+)\s*(?:minutes?|mins?|hours?|hrs?)/i)
    if (timeMatch) {
      constraints.push({
        type: 'time_limit',
        field: 'deliveryTime',
        operator: 'less_than',
        value: parseInt(timeMatch[1]),
        priority: 'preferred',
      })
    }

    // Dietary constraints from entities
    const dietaryEntity = entities.find(e =>
      e.type === 'preference' &&
      ['vegetarian', 'vegan', 'halal', 'kosher', 'gluten-free'].some(d =>
        e.value.toLowerCase().includes(d)
      )
    )
    if (dietaryEntity) {
      constraints.push({
        type: 'dietary',
        field: 'cuisine',
        operator: 'contains',
        value: dietaryEntity.value,
        priority: 'required',
      })
    }

    return constraints
  }

  /**
   * Determine the specific action from input
   */
  private determineAction(input: string, category: IntentCategory): string {
    const normalized = input.toLowerCase()

    const actionMap: Record<IntentCategory, Record<string, string[]>> = {
      food_delivery: {
        order: ['order', 'get', 'deliver', 'want', 'need'],
        reorder: ['reorder', 'order again', 'same as last'],
        browse: ['browse', 'show', 'what', 'menu'],
      },
      document_analysis: {
        analyze: ['analyze', 'review', 'check', 'look at'],
        summarize: ['summarize', 'summary', 'tldr', 'brief'],
        extract: ['extract', 'find', 'get', 'pull out'],
        compare: ['compare', 'versus', 'vs', 'difference'],
      },
      travel: {
        book: ['book', 'reserve', 'get'],
        search: ['search', 'find', 'look for'],
        compare: ['compare', 'cheapest', 'best'],
      },
      communication: {
        send_email: ['send email', 'email to'],
        slack_post: ['post to slack', 'slack', 'post'],
        get_emails: ['get emails', 'fetch emails', 'show emails', 'last emails'],
        send: ['send', 'message', 'text'],
        call: ['call', 'phone', 'ring'],
        notify: ['notify', 'remind', 'tell', 'inform'],
      },
      scheduling: {
        create: ['schedule', 'set', 'create', 'add'],
        remind: ['remind', 'remember'],
        reschedule: ['reschedule', 'move', 'change'],
      },
      shopping: {
        buy: ['buy', 'purchase', 'order'],
        compare: ['compare', 'find best', 'cheapest'],
        search: ['search', 'find', 'look for', 'browse'],
      },
      finance: {
        pay: ['pay', 'transfer', 'send money'],
        track: ['track', 'expense', 'budget'],
      },
      productivity: {
        create: ['create', 'add', 'new'],
        organize: ['organize', 'sort', 'clean'],
      },
      research: {
        search: ['search', 'find', 'research', 'look up'],
        summarize: ['summarize', 'explain', 'what is'],
      },
      custom: {
        execute: ['run', 'do', 'execute', 'perform'],
      },
    }

    const actions = actionMap[category] || actionMap.custom
    for (const [action, keywords] of Object.entries(actions)) {
      if (keywords.some(kw => normalized.includes(kw))) {
        return action
      }
    }

    return 'execute'  // Default action
  }

  /**
   * Determine urgency from input
   */
  private determineUrgency(input: string): ParsedIntent['urgency'] {
    const normalized = input.toLowerCase()

    if (/(?:now|immediately|asap|urgent|right\s+away|quickly)/i.test(normalized)) {
      return 'immediate'
    }
    if (/(?:today|tonight|this\s+(?:morning|afternoon|evening))/i.test(normalized)) {
      return 'today'
    }
    if (/(?:tomorrow|next\s+\w+|on\s+\w+day|scheduled\s+for)/i.test(normalized)) {
      return 'scheduled'
    }
    return 'flexible'
  }

  /**
   * Create missing info object for a required field
   */
  private createMissingInfo(field: string, _category: IntentCategory): MissingInformation {
    const infoMap: Record<string, Partial<MissingInformation>> = {
      location: {
        description: 'Delivery or destination address',
        suggestedQuestion: 'Where would you like this delivered?',
        possibleValues: this.userContext?.addresses.map(a => a.label),
        canInfer: true,
      },
      product: {
        description: 'What to order or analyze',
        suggestedQuestion: 'What would you like to order?',
        canInfer: false,
      },
      person: {
        description: 'Who to contact or notify',
        suggestedQuestion: 'Who should I send this to?',
        canInfer: false,
      },
      date: {
        description: 'Date for the action',
        suggestedQuestion: 'When would you like this?',
        canInfer: true,  // Can default to today
      },
      time: {
        description: 'Time for the action',
        suggestedQuestion: 'What time works for you?',
        canInfer: true,  // Can default to now or business hours
      },
    }

    const info = infoMap[field] || {
      description: `Missing ${field}`,
      suggestedQuestion: `What is the ${field}?`,
      canInfer: false,
    }

    return {
      field,
      description: info.description!,
      required: true,
      suggestedQuestion: info.suggestedQuestion!,
      possibleValues: info.possibleValues,
      canInfer: info.canInfer!,
    }
  }

  /**
   * Ask a clarifying question based on missing info
   */
  async askClarification(intent: ParsedIntent): Promise<{
    question: string
    options?: string[]
    field: string
  }> {
    const missing = intent.missingInfo.find(m => m.required) || intent.missingInfo[0]

    if (!missing) {
      return {
        question: 'Could you tell me more about what you need?',
        field: 'general',
      }
    }

    return {
      question: missing.suggestedQuestion,
      options: missing.possibleValues,
      field: missing.field,
    }
  }

  /**
   * Update intent with user's answer to clarifying question
   */
  updateWithAnswer(intent: ParsedIntent, field: string, value: string): ParsedIntent {
    // Add the new entity
    intent.entities.push({
      type: field as ExtractedEntity['type'],
      value,
      confidence: 1.0,
      source: 'user_input',
    })

    // Remove from missing info
    intent.missingInfo = intent.missingInfo.filter(m => m.field !== field)

    // Re-check if we can execute
    intent.canExecute = intent.missingInfo.filter(m => m.required).length === 0

    return intent
  }
}

// Export singleton instance
export const intentParser = new IntentParser()
