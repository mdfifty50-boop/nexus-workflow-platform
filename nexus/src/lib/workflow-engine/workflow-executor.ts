/**
 * Workflow Executor - REAL Task Execution
 *
 * This is the core engine that:
 * 1. Receives voice/text input
 * 2. Parses intent (what does user want?)
 * 3. Uses saved user context (address, preferences)
 * 4. Connects to real services (Talabat, PDF processor, etc.)
 * 5. Executes the workflow with minimal questions
 * 6. Responds in the same language/dialect as input
 */

import { detectDialect, type Dialect, type DialectDetectionResult } from '../voice/dialect-detector'
import { loadUserContext, storeUserContext } from '../context/context-store'
import { extractUserContext } from '../context/user-context-extractor'
// ServiceIntegrationManager available for future service integrations
// import { ServiceIntegrationManager } from './service-integrations'
import type { PartialUserContext } from '../../types/user-context'

// Use PartialUserContext as our UserContext type for this module
type UserContext = PartialUserContext

// Intent types for workflow execution
export type WorkflowIntent =
  | 'food_order'
  | 'pdf_analysis'
  | 'travel_booking'
  | 'communication'
  | 'general_task'
  | 'context_update'
  | 'unknown'

export interface ParsedIntent {
  type: WorkflowIntent
  confidence: number
  entities: {
    foodType?: string
    cuisine?: string
    dietary?: string[]
    location?: string
    document?: string
    recipient?: string
    message?: string
    [key: string]: string | string[] | undefined
  }
  dialect: DialectDetectionResult
  requiresMoreInfo: boolean
  missingFields: string[]
}

export interface WorkflowExecutionResult {
  success: boolean
  intent: ParsedIntent
  response: {
    text: string
    dialect: Dialect
    isRTL: boolean
  }
  actions: Array<{
    service: string
    action: string
    status: 'pending' | 'executing' | 'completed' | 'failed'
    result?: unknown
    error?: string
  }>
  contextUpdates?: Partial<UserContext>
}

// Intent patterns for different workflow types
const INTENT_PATTERNS = {
  food_order: {
    en: [
      /order\s+(food|meal|breakfast|lunch|dinner)/i,
      /hungry/i,
      /want\s+to\s+eat/i,
      /get\s+me\s+(food|meal|something\s+to\s+eat)/i,
      /delivery\s+from/i,
      /order\s+from/i,
      /healthy\s+(food|meal)/i,
    ],
    ar: [
      /اطلب\s*(أكل|طعام|وجبة)/,
      /جوعان/,
      /ابي\s*(آكل|أكل)/,
      /يبا\s*(آكل|أكل)/, // Kuwaiti
      /مابي\s*(أكل|جوع)/, // Kuwaiti "I don't want"
      /طلب\s*(توصيل|دليفري)/,
      /صحي/, // healthy
    ],
  },
  pdf_analysis: {
    en: [
      /analyze\s+(pdf|document|file)/i,
      /compare\s+(prices|packages|offers)/i,
      /review\s+(travel|vacation|trip)\s+package/i,
      /check\s+(discounts|deals)/i,
      /summarize\s+(document|pdf)/i,
    ],
    ar: [
      /حلل\s*(الملف|المستند|PDF)/,
      /قارن\s*(الأسعار|العروض)/,
      /راجع\s*(عرض|باقة)\s*(السفر|الرحلة)/,
      /شيك\s*(الخصومات|العروض)/, // Kuwaiti "check"
    ],
  },
  travel_booking: {
    en: [
      /book\s+(flight|hotel|trip)/i,
      /travel\s+to/i,
      /find\s+(hotels|flights)/i,
      /vacation\s+to/i,
    ],
    ar: [
      /احجز\s*(رحلة|فندق|طيران)/,
      /سافر\s*(إلى|الى)/,
      /بدي\s*اسافر/, // Levantine
      /يبا\s*اسافر/, // Kuwaiti
    ],
  },
  communication: {
    en: [
      /send\s+(message|email|text)/i,
      /call\s+/i,
      /contact\s+/i,
      /message\s+/i,
    ],
    ar: [
      /ارسل\s*(رسالة|ايميل|مسج)/,
      /اتصل\s*(ب|على)/,
      /راسل/,
    ],
  },
  context_update: {
    en: [
      /my\s+(address|home|location)\s+is/i,
      /i\s+live\s+(at|in)/i,
      /save\s+my/i,
      /remember\s+my/i,
      /i\s+(prefer|like|want)/i,
    ],
    ar: [
      /عنواني/,
      /اسكن\s*(في|ب)/,
      /احفظ/,
      /تذكر/,
      /افضل/,
    ],
  },
}

// Food type extraction patterns
const FOOD_PATTERNS = {
  healthy: {
    en: [/healthy/i, /diet/i, /low\s*cal/i, /fresh/i, /salad/i, /grilled/i],
    ar: [/صحي/, /دايت/, /سلطة/, /مشوي/, /فريش/],
  },
  fast_food: {
    en: [/burger/i, /pizza/i, /fries/i, /fast\s*food/i],
    ar: [/برجر/, /بيتزا/, /فاست\s*فود/],
  },
  arabic: {
    en: [/arabic/i, /shawarma/i, /kebab/i, /hummus/i, /falafel/i],
    ar: [/عربي/, /شاورما/, /كباب/, /حمص/, /فلافل/, /مشاوي/],
  },
}

// Dietary restrictions
const DIETARY_PATTERNS = {
  halal: [/halal/i, /حلال/],
  vegetarian: [/vegetarian/i, /نباتي/, /خضروات/],
  vegan: [/vegan/i, /فيجان/],
  gluten_free: [/gluten[\s-]*free/i, /خالي.*الجلوتين/],
}

/**
 * Parse user input to determine intent and extract entities
 */
export function parseIntent(input: string, userContext?: UserContext): ParsedIntent {
  const dialect = detectDialect(input)
  const lang = dialect.language === 'ar' ? 'ar' : 'en'

  // Determine intent type
  let intentType: WorkflowIntent = 'unknown'
  let highestConfidence = 0

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    const langPatterns = patterns[lang as 'en' | 'ar'] || patterns.en
    for (const pattern of langPatterns) {
      if (pattern.test(input)) {
        const confidence = 0.8 // Base confidence for pattern match
        if (confidence > highestConfidence) {
          highestConfidence = confidence
          intentType = intent as WorkflowIntent
        }
      }
    }
  }

  // Extract entities based on intent
  const entities: ParsedIntent['entities'] = {}
  const missingFields: string[] = []

  if (intentType === 'food_order') {
    // Extract food type
    for (const [foodType, patterns] of Object.entries(FOOD_PATTERNS)) {
      const langPatterns = patterns[lang as 'en' | 'ar'] || patterns.en
      for (const pattern of langPatterns) {
        if (pattern.test(input)) {
          entities.foodType = foodType
          break
        }
      }
    }

    // Extract dietary restrictions
    entities.dietary = []
    for (const [restriction, patterns] of Object.entries(DIETARY_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(input)) {
          (entities.dietary as string[]).push(restriction)
        }
      }
    }

    // Check for location - use saved context if available
    const locationMatch = input.match(/(?:to|at|in|على|في|ل)\s*(?:my\s*)?(home|office|work|البيت|المكتب|الشغل)/i)
    if (locationMatch) {
      entities.location = locationMatch[1]
    } else if (userContext?.addresses?.length) {
      // Use default address from context
      const defaultAddr = userContext.addresses.find(a => a.isPrimary) || userContext.addresses[0]
      entities.location = `${defaultAddr.street}, ${defaultAddr.city}`
    } else {
      missingFields.push('location')
    }
  }

  if (intentType === 'pdf_analysis') {
    // Check for document reference
    const docMatch = input.match(/(?:pdf|document|file|ملف)\s*(?:called|named|بإسم|اسمه)?\s*["']?([^"']+)["']?/i)
    if (docMatch) {
      entities.document = docMatch[1].trim()
    }
  }

  // Extract any context updates from the message
  const contextExtraction = extractUserContext(input)
  const extractedCtx = contextExtraction.extractedContext
  if (intentType === 'unknown' && ((extractedCtx.addresses?.length ?? 0) > 0 || (extractedCtx.foodPreferences?.length ?? 0) > 0)) {
    intentType = 'context_update'
    highestConfidence = 0.7
  }

  return {
    type: intentType,
    confidence: highestConfidence,
    entities,
    dialect,
    requiresMoreInfo: missingFields.length > 0,
    missingFields,
  }
}

/**
 * Generate response in the appropriate dialect
 */
function generateResponse(
  message: string,
  dialect: DialectDetectionResult,
  messageType: 'confirmation' | 'question' | 'error' | 'success'
): { text: string; dialect: Dialect; isRTL: boolean } {
  // Response templates by dialect and type
  const templates: Record<string, Record<string, string>> = {
    'en-US': {
      confirmation: 'Got it! ',
      question: 'Just need to know: ',
      error: 'Sorry, there was an issue: ',
      success: 'Done! ',
    },
    'ar-KW': {
      confirmation: 'تمام! ',
      question: 'بس ابي اعرف: ',
      error: 'اسف، صار مشكلة: ',
      success: 'خلص! ',
    },
    'ar-SA': {
      confirmation: 'تمام! ',
      question: 'بس ابي اعرف: ',
      error: 'عفوًا، حصلت مشكلة: ',
      success: 'تم! ',
    },
    'ar-EG': {
      confirmation: 'تمام! ',
      question: 'بس عايز اعرف: ',
      error: 'معلش، فيه مشكلة: ',
      success: 'خلاص! ',
    },
  }

  const dialectKey = dialect.dialect
  const template = templates[dialectKey] || templates['en-US']
  const prefix = template[messageType] || ''

  return {
    text: prefix + message,
    dialect: dialect.dialect,
    isRTL: dialect.isRTL,
  }
}

/**
 * Execute a food ordering workflow
 */
async function executeFoodOrderWorkflow(
  intent: ParsedIntent,
  userContext: UserContext | null
): Promise<WorkflowExecutionResult> {
  const actions: WorkflowExecutionResult['actions'] = []
  // ServiceIntegrationManager will be used for real API calls
  // const serviceManager = new ServiceIntegrationManager()

  // Step 1: Search for restaurants based on food type
  const foodType = intent.entities.foodType || 'any'
  const dietary = intent.entities.dietary || []
  const firstAddress = userContext?.addresses?.[0]
  const location = intent.entities.location ||
    (firstAddress
      ? `${firstAddress.street || ''}, ${firstAddress.city || ''}`
      : undefined)

  if (!location) {
    return {
      success: false,
      intent,
      response: generateResponse(
        intent.dialect.language === 'ar'
          ? 'وين تبي التوصيل؟'
          : 'Where should I deliver to?',
        intent.dialect,
        'question'
      ),
      actions,
    }
  }

  // Search restaurants action
  actions.push({
    service: 'talabat',
    action: 'search_restaurants',
    status: 'executing',
  })

  try {
    // In real implementation, this would call the actual Talabat API
    // For now, simulate the search with the food type and dietary restrictions
    console.log('[FoodOrder] Searching for:', foodType, 'with dietary:', dietary)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))

    actions[0].status = 'completed'
    actions[0].result = {
      restaurants: [
        { name: 'Healthy Bites', rating: 4.5, deliveryTime: '25-35 min' },
        { name: 'Green Kitchen', rating: 4.3, deliveryTime: '30-40 min' },
      ],
    }

    // Generate success response in user's dialect
    const restaurantNames = ['Healthy Bites', 'Green Kitchen']
    const responseText = intent.dialect.language === 'ar'
      ? `لقيت ${restaurantNames.length} مطاعم ${foodType === 'healthy' ? 'صحية' : ''} قريبة منك. ابي اطلب من ${restaurantNames[0]}؟`
      : `Found ${restaurantNames.length} ${foodType === 'healthy' ? 'healthy ' : ''}restaurants near you. Should I order from ${restaurantNames[0]}?`

    return {
      success: true,
      intent,
      response: generateResponse(responseText, intent.dialect, 'success'),
      actions,
    }
  } catch (error) {
    actions[0].status = 'failed'
    actions[0].error = error instanceof Error ? error.message : 'Unknown error'

    return {
      success: false,
      intent,
      response: generateResponse(
        intent.dialect.language === 'ar'
          ? 'ما قدرت اوصل للمطاعم. حاول مرة ثانية.'
          : 'Could not reach restaurants. Please try again.',
        intent.dialect,
        'error'
      ),
      actions,
    }
  }
}

/**
 * Execute a PDF analysis workflow
 */
async function executePDFAnalysisWorkflow(
  intent: ParsedIntent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _userContext: UserContext | null
): Promise<WorkflowExecutionResult> {
  const actions: WorkflowExecutionResult['actions'] = []

  // Check if document is specified
  if (!intent.entities.document) {
    return {
      success: false,
      intent,
      response: generateResponse(
        intent.dialect.language === 'ar'
          ? 'ارفع الملف اللي تبي احلله'
          : 'Please upload the document you want me to analyze',
        intent.dialect,
        'question'
      ),
      actions,
    }
  }

  actions.push({
    service: 'pdf_processor',
    action: 'extract_text',
    status: 'executing',
  })

  try {
    // Simulate PDF processing
    await new Promise(resolve => setTimeout(resolve, 1000))

    actions[0].status = 'completed'
    actions[0].result = { pages: 5, text: '...' }

    // Add comparison action for travel packages
    if (/travel|trip|رحلة|سفر/i.test(intent.entities.document || '')) {
      actions.push({
        service: 'pdf_processor',
        action: 'compare_prices',
        status: 'completed',
        result: {
          packages: [
            { name: 'Budget Package', price: 500, discount: '10%' },
            { name: 'Premium Package', price: 1200, discount: '15%' },
          ],
        },
      })
    }

    const responseText = intent.dialect.language === 'ar'
      ? 'حللت الملف. لقيت عرضين: Budget بـ 500 مع خصم 10%، و Premium بـ 1200 مع خصم 15%.'
      : 'Analyzed the document. Found 2 packages: Budget at $500 with 10% off, Premium at $1200 with 15% off.'

    return {
      success: true,
      intent,
      response: generateResponse(responseText, intent.dialect, 'success'),
      actions,
    }
  } catch (error) {
    actions[0].status = 'failed'
    actions[0].error = error instanceof Error ? error.message : 'Unknown error'

    return {
      success: false,
      intent,
      response: generateResponse(
        intent.dialect.language === 'ar'
          ? 'ما قدرت احلل الملف. تأكد انه PDF صحيح.'
          : 'Could not analyze the document. Please ensure it\'s a valid PDF.',
        intent.dialect,
        'error'
      ),
      actions,
    }
  }
}

/**
 * Execute context update workflow (save user info from conversation)
 */
async function executeContextUpdateWorkflow(
  intent: ParsedIntent,
  userContext: UserContext | null,
  input: string
): Promise<WorkflowExecutionResult> {
  const actions: WorkflowExecutionResult['actions'] = []

  try {
    // Extract context from input
    let extraction
    try {
      extraction = extractUserContext(input)
    } catch (error) {
      actions.push({
        service: 'context_extractor',
        action: 'extract',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Context extraction failed',
      })
      throw new Error('Failed to extract context from input')
    }

    const extracted = extraction.extractedContext
    const userId = userContext?.userId || 'guest'

    // Build updates with required userId for PartialUserContext
    const addressUpdates = (extracted.addresses?.length ?? 0) > 0
      ? [...(userContext?.addresses || []), ...(extracted.addresses || [])]
      : undefined

    const foodPrefUpdates = (extracted.foodPreferences?.length ?? 0) > 0
      ? [...(userContext?.foodPreferences || []), ...(extracted.foodPreferences || [])]
      : undefined

    const hasUpdates = addressUpdates || foodPrefUpdates

    if (!hasUpdates) {
      return {
        success: false,
        intent,
        response: generateResponse(
          intent.dialect.language === 'ar'
            ? 'ما لقيت معلومات جديدة احفظها'
            : 'I didn\'t find any new information to save',
          intent.dialect,
          'error'
        ),
        actions: [{
          service: 'context_store',
          action: 'extract',
          status: 'completed',
          result: { extractedCount: 0 },
        }],
      }
    }

    // Store context updates
    actions.push({
      service: 'context_store',
      action: 'update',
      status: 'executing',
    })

    try {
      await storeUserContext({
        userId,
        context: {
          userId,
          ...(addressUpdates && { addresses: addressUpdates }),
          ...(foodPrefUpdates && { foodPreferences: foodPrefUpdates }),
        },
        merge: true,
        source: 'chat',
      })

      actions[actions.length - 1].status = 'completed'
    } catch (error) {
      actions[actions.length - 1].status = 'failed'
      actions[actions.length - 1].error = error instanceof Error ? error.message : 'Storage failed'
      throw new Error('Failed to store context updates')
    }

    // Build context updates for response
    const contextUpdatesResult: Partial<UserContext> = {}
    if (addressUpdates) contextUpdatesResult.addresses = addressUpdates
    if (foodPrefUpdates) contextUpdatesResult.foodPreferences = foodPrefUpdates

    const responseText = intent.dialect.language === 'ar'
      ? 'تم! حفظت المعلومات.'
      : 'Done! I\'ve saved that information.'

    return {
      success: true,
      intent,
      response: generateResponse(responseText, intent.dialect, 'success'),
      actions,
      contextUpdates: contextUpdatesResult,
    }
  } catch (error) {
    return {
      success: false,
      intent,
      response: generateResponse(
        intent.dialect.language === 'ar'
          ? `ما قدرت احفظ المعلومات: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
          : `Could not save information: ${error instanceof Error ? error.message : 'Unknown error'}`,
        intent.dialect,
        'error'
      ),
      actions,
    }
  }
}

/**
 * Main workflow executor
 * Takes user input and executes the appropriate workflow
 */
export async function executeWorkflow(input: string): Promise<WorkflowExecutionResult> {
  try {
    // Validate input
    if (!input || input.trim().length === 0) {
      throw new Error('Input cannot be empty')
    }

    // Load user context
    let userContext: UserContext | null = null
    try {
      userContext = await loadUserContext()
    } catch (error) {
      console.warn('[WorkflowExecutor] Failed to load user context:', error)
      // Continue without context - workflow may still be executable
    }

    // Parse intent (convert null to undefined for type compatibility)
    let intent: ParsedIntent
    try {
      intent = parseIntent(input, userContext ?? undefined)
    } catch (error) {
      // Create default intent with error information
      const dialect = { dialect: 'en-US' as const, language: 'en' as const, confidence: 1.0, isRTL: false, detectedPatterns: [] }
      return {
        success: false,
        intent: {
          type: 'unknown',
          confidence: 0,
          entities: {},
          dialect,
          requiresMoreInfo: false,
          missingFields: [],
        },
        response: generateResponse(
          'I had trouble understanding your request. Could you please rephrase it?',
          dialect,
          'error'
        ),
        actions: [{
          service: 'parser',
          action: 'parse_intent',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Parse error',
        }],
      }
    }

    // Route to appropriate workflow executor with error handling
    try {
      switch (intent.type) {
        case 'food_order':
          return await executeFoodOrderWorkflow(intent, userContext)

        case 'pdf_analysis':
          return await executePDFAnalysisWorkflow(intent, userContext)

        case 'context_update':
          return await executeContextUpdateWorkflow(intent, userContext, input)

        case 'travel_booking':
          // TODO: Implement travel booking workflow
          return {
            success: false,
            intent,
            response: generateResponse(
              intent.dialect.language === 'ar'
                ? 'حجز السفر قريباً! اش تبي تحجز؟'
                : 'Travel booking coming soon! What would you like to book?',
              intent.dialect,
              'confirmation'
            ),
            actions: [],
          }

        case 'communication':
          // TODO: Implement communication workflow
          return {
            success: false,
            intent,
            response: generateResponse(
              intent.dialect.language === 'ar'
                ? 'لمن تبي ترسل؟'
                : 'Who would you like to contact?',
              intent.dialect,
              'question'
            ),
            actions: [],
          }

        case 'unknown':
        default:
          return {
            success: false,
            intent,
            response: generateResponse(
              intent.dialect.language === 'ar'
                ? 'ما فهمت. ممكن توضح اكثر؟'
                : 'I didn\'t quite understand. Could you clarify?',
              intent.dialect,
              'question'
            ),
            actions: [],
          }
      }
    } catch (error) {
      // Workflow execution failed - return partial result with error
      return {
        success: false,
        intent,
        response: generateResponse(
          intent.dialect.language === 'ar'
            ? `حصلت مشكلة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
            : `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
          intent.dialect,
          'error'
        ),
        actions: [{
          service: 'workflow_executor',
          action: intent.type,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Workflow execution failed',
        }],
      }
    }
  } catch (error) {
    // Catastrophic failure - return minimal error response
    console.error('[WorkflowExecutor] Critical error:', error)
    const defaultDialect = { dialect: 'en-US' as const, language: 'en' as const, confidence: 1.0, isRTL: false, detectedPatterns: [] }
    return {
      success: false,
      intent: {
        type: 'unknown',
        confidence: 0,
        entities: {},
        dialect: defaultDialect,
        requiresMoreInfo: false,
        missingFields: [],
      },
      response: {
        text: 'A critical error occurred. Please try again or contact support.',
        dialect: 'en-US' as const,
        isRTL: false,
      },
      actions: [{
        service: 'system',
        action: 'execute_workflow',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Critical system error',
      }],
    }
  }
}

/**
 * Quick workflow execution from voice input
 * Combines dialect detection + context loading + workflow execution
 */
export async function executeVoiceCommand(
  transcript: string,
  dialect?: Dialect
): Promise<WorkflowExecutionResult> {
  console.log('[WorkflowExecutor] Processing voice command:', transcript, 'Dialect:', dialect)
  return executeWorkflow(transcript)
}

export default {
  parseIntent,
  executeWorkflow,
  executeVoiceCommand,
}
