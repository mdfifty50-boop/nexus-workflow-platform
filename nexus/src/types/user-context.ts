// User Context Storage Types
// Stores extracted user information and preferences for workflow automation

export type UserContextSource = 'chat' | 'manual' | 'imported' | 'api'
export type AddressLabel = 'home' | 'work' | 'custom'
export type LanguageDialect = 'en-US' | 'en-GB' | 'en-AU' | 'es-ES' | 'es-MX' | 'fr-FR' | 'de-DE' | 'it-IT' | 'pt-BR' | 'zh-CN' | 'ja-JP' | string

/**
 * Represents a user's physical address with optional geolocation data
 */
export interface UserAddress {
  id: string
  label: AddressLabel
  fullAddress: string
  street: string
  city: string
  state?: string
  postalCode?: string
  country: string
  countryCode?: string
  coordinates?: {
    lat: number
    lng: number
  }
  isPrimary: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Represents a frequent contact (person) that workflows might reference
 */
export interface FrequentContact {
  id: string
  name: string
  relationship?: string // 'family', 'friend', 'colleague', 'custom'
  phone?: string
  email?: string
  address?: UserAddress
  notes?: string
  lastInteraction?: string
  priority: 'high' | 'medium' | 'low'
}

/**
 * Represents dietary restrictions and food preferences
 */
export interface FoodPreference {
  id: string
  category: string // 'vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher', 'custom'
  description?: string
  isRestriction: boolean // true for allergies/restrictions, false for preferences
  severity?: 'mild' | 'moderate' | 'severe' // for allergies
}

/**
 * Represents user communication and interaction preferences
 */
export interface CommunicationPreferences {
  preferredLanguage: LanguageDialect
  preferredDialect?: LanguageDialect
  timeZone: string
  preferredContactMethods: ('email' | 'phone' | 'sms' | 'in_app')[]
  preferredCommunicationTime?: {
    startHour: number
    endHour: number
    daysOfWeek: number[] // 0-6, where 0 is Sunday
  }
  doNotDisturb?: {
    enabled: boolean
    startTime: string // HH:MM
    endTime: string // HH:MM
  }
}

/**
 * Represents user work and professional information
 */
export interface ProfessionalProfile {
  jobTitle?: string
  company?: string
  industry?: string
  workEmail?: string
  workPhone?: string
  workAddress?: UserAddress
  department?: string
  reportingManager?: FrequentContact
  skills: string[]
  experience?: string // years or description
}

/**
 * Represents user behavioral patterns and preferences useful for automation
 */
export interface BehavioralPreferences {
  workHours?: {
    startTime: string // HH:MM
    endTime: string // HH:MM
    daysOfWeek: number[] // 0-6
  }
  preferredPaces: ('urgent' | 'fast' | 'normal' | 'leisurely')[]
  automationLevel: 'minimal' | 'moderate' | 'high' | 'maximum' // How automated they want workflows
  privacyLevel: 'public' | 'friends' | 'private' // Privacy preferences
  notificationFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'never'
  detailedReporting: boolean // Do they want detailed logs/reports?
}

/**
 * Represents subscription and service preferences
 */
export interface ServicePreferences {
  subscribedServices: string[]
  loyaltyPrograms: Array<{
    name: string
    memberId: string
    tier?: string
  }>
  preferredPaymentMethods: ('credit_card' | 'debit_card' | 'paypal' | 'apple_pay' | 'google_pay' | 'bank_transfer')[]
  budgetConstraints?: {
    maxMonthlySpend?: number
    maxPerTransaction?: number
    currency: string
  }
}

/**
 * Core user context - comprehensive profile for workflow automation
 */
export interface UserContext {
  userId: string

  // Basic demographics
  fullName: string
  email: string
  phone?: string
  dateOfBirth?: string
  gender?: 'male' | 'female' | 'non-binary' | 'prefer_not_to_say'
  profileImageUrl?: string

  // Location and contact data
  addresses: UserAddress[]
  frequentContacts: FrequentContact[]

  // Preferences and habits
  foodPreferences: FoodPreference[]
  communicationPreferences: CommunicationPreferences
  behavioralPreferences: BehavioralPreferences

  // Professional information
  professionalProfile?: ProfessionalProfile

  // Service and transaction preferences
  servicePreferences?: ServicePreferences

  // Context metadata
  extractedAt: string
  updatedAt: string
  source: UserContextSource
  extractionMethod?: string // How the information was extracted (e.g., 'chat_analysis', 'form_submission')
  confidenceLevel?: Record<string, number> // Confidence scores for extracted fields (0-1)

  // Linked data
  associatedWorkflowIds?: string[] // Workflows that use this context
  version: number // For migrations and updates
  isActive: boolean

  // Additional extensible metadata
  metadata?: Record<string, unknown>
  tags?: string[] // User-defined tags for organizing context
}

/**
 * Partial user context for updates and incremental extraction
 */
export type PartialUserContext = Partial<UserContext> & { userId: string }

/**
 * User context summary for quick reference in workflows
 */
export interface UserContextSummary {
  userId: string
  fullName: string
  email: string
  primaryAddress?: UserAddress
  primaryContact?: string // Primary phone or email
  timeZone: string
  preferredLanguage: LanguageDialect
  automationLevel: 'minimal' | 'moderate' | 'high' | 'maximum'
}

/**
 * Context extraction result from chat or other sources
 */
export interface ContextExtractionResult {
  success: boolean
  extractedContext: Partial<UserContext>
  confidence: number // 0-1, overall confidence in extraction
  missingFields: string[] // Required fields that couldn't be extracted
  suggestions?: string[] // Suggestions for filling missing data
  rawExtractions?: Record<string, unknown> // Raw data from extraction process
  timestamp: string
}

/**
 * Request to store or update user context
 */
export interface StoreContextRequest {
  userId: string
  context: PartialUserContext
  merge?: boolean // If true, merge with existing context; if false, replace
  source: UserContextSource
  extractionMethod?: string
}

/**
 * Response from context storage
 */
export interface StoreContextResponse {
  success: boolean
  userId: string
  context: UserContext
  message?: string
  errors?: string[]
}

/**
 * Query filters for retrieving user contexts
 */
export interface UserContextQueryFilters {
  userId?: string
  searchText?: string
  source?: UserContextSource
  hasAddress?: boolean
  hasContacts?: boolean
  createdAfter?: string
  updatedAfter?: string
  tags?: string[]
  limit?: number
  offset?: number
}

/**
 * Helper function to create an empty user context
 */
export function createEmptyUserContext(userId: string, source: UserContextSource = 'manual'): UserContext {
  return {
    userId,
    fullName: '',
    email: '',
    addresses: [],
    frequentContacts: [],
    foodPreferences: [],
    communicationPreferences: {
      preferredLanguage: 'en-US',
      timeZone: 'UTC',
      preferredContactMethods: ['email'],
    },
    behavioralPreferences: {
      preferredPaces: ['normal'],
      automationLevel: 'moderate',
      privacyLevel: 'private',
      notificationFrequency: 'daily',
      detailedReporting: true,
    },
    extractedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source,
    version: 1,
    isActive: true,
  }
}

/**
 * Helper function to get a user context summary
 */
export function getUserContextSummary(context: UserContext): UserContextSummary {
  const primaryAddress = context.addresses.find(a => a.isPrimary) || context.addresses[0]
  const primaryContact = context.phone || context.email

  return {
    userId: context.userId,
    fullName: context.fullName,
    email: context.email,
    primaryAddress,
    primaryContact,
    timeZone: context.communicationPreferences.timeZone,
    preferredLanguage: context.communicationPreferences.preferredLanguage,
    automationLevel: context.behavioralPreferences.automationLevel,
  }
}

/**
 * Helper function to validate user context
 */
export function validateUserContext(context: Partial<UserContext>): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!context.userId) errors.push('userId is required')
  if (!context.fullName) errors.push('fullName is required')
  if (!context.email) errors.push('email is required')

  if (context.addresses) {
    context.addresses.forEach((addr, idx) => {
      if (!addr.fullAddress) errors.push(`addresses[${idx}].fullAddress is required`)
      if (!addr.city) errors.push(`addresses[${idx}].city is required`)
      if (!addr.country) errors.push(`addresses[${idx}].country is required`)
    })
  }

  if (context.frequentContacts) {
    context.frequentContacts.forEach((contact, idx) => {
      if (!contact.name) errors.push(`frequentContacts[${idx}].name is required`)
      if (!contact.phone && !contact.email) errors.push(`frequentContacts[${idx}] must have phone or email`)
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
