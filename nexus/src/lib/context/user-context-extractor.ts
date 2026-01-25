/**
 * User Context Extractor
 *
 * Intelligently extracts user context (addresses, preferences, contacts) from AI chat messages.
 * Uses pattern matching and natural language understanding to identify actionable information.
 */

import type {
  UserAddress,
  FrequentContact,
  FoodPreference,
  CommunicationPreferences,
  ContextExtractionResult,
  PartialUserContext,
} from '@/types/user-context'

/**
 * Address extraction patterns
 */
const ADDRESS_PATTERNS = {
  // "my home address is 123 Main St, San Francisco, CA 94102"
  full: /(?:my |our )?(?:home |work |office )?address (?:is |:|=)\s*([^,]+,\s*[^,]+,\s*[A-Z]{2}\s*\d{5})/i,

  // "I live at 123 Main St"
  liveAt: /(?:I |we )?(?:live|reside|located) (?:at|in)\s+([^,]+,\s*[^,]+(?:,\s*[A-Z]{2})?)/i,

  // "123 Main St, San Francisco, CA 94102"
  standalone: /(\d+\s+[A-Za-z0-9\s,.-]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Court|Ct|Place|Pl)[^,]*,\s*[^,]+,\s*[A-Z]{2}\s*\d{5})/i,

  // City, State pattern
  cityState: /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})/,

  // ZIP code
  zip: /\b(\d{5}(?:-\d{4})?)\b/,
}

/**
 * Food preference patterns
 */
const FOOD_PREFERENCE_PATTERNS = {
  vegan: /\b(vegan|plant-based)\b/i,
  vegetarian: /\b(vegetarian)\b/i,
  glutenFree: /\b(gluten[- ]free|celiac)\b/i,
  dairyFree: /\b(dairy[- ]free|lactose[- ]intolerant)\b/i,
  nutAllergy: /\b(nut allerg(?:y|ies)|peanut allerg(?:y|ies))\b/i,
  halal: /\b(halal)\b/i,
  kosher: /\b(kosher)\b/i,
  preferences: /(?:I |we )?(?:prefer|like|love|enjoy)\s+([\w\s,-]+?)(?:\s+food|\s+cuisine)?/i,
  restrictions: /(?:I |we )?(?:can'?t|cannot|don'?t|avoid|allergic to)\s+(?:eat|have|consume)\s+([\w\s,-]+)/i,
}

/**
 * Contact extraction patterns
 */
const CONTACT_PATTERNS = {
  // "call my mom at 555-1234" or "email my boss at john@company.com"
  contactAction: /(?:call|text|email|message|reach|contact)\s+(?:my |our )?(\w+(?:\s+\w+)?)\s+(?:at|on)\s+([\w@.+-]+)/i,

  // "my mom's email is mary@example.com"
  emailMention: /(?:my |our )?(\w+(?:\s+\w+)?)'?s?\s+email\s+(?:is|:|=)\s+([\w.+-]+@[\w.-]+\.\w+)/i,

  // "my mom's phone is 555-1234"
  phoneMention: /(?:my |our )?(\w+(?:\s+\w+)?)'?s?\s+(?:phone|number)\s+(?:is|:|=)\s+([\d\s()+-]+)/i,

  // Relationship indicators
  relationships: {
    family: /\b(mom|mother|dad|father|parent|spouse|husband|wife|partner|son|daughter|child|kid|sibling|sister|brother|grandma|grandpa|grandmother|grandfather|aunt|uncle|cousin)\b/i,
    work: /\b(boss|manager|supervisor|colleague|coworker|assistant|employee|team|direct report)\b/i,
    friend: /\b(friend|buddy|pal|best friend|roommate)\b/i,
  },
}

/**
 * Language preference patterns
 */
const LANGUAGE_PATTERNS = {
  preferred: /(?:I |we )?(?:speak|prefer|use)\s+(English|Spanish|French|German|Italian|Portuguese|Chinese|Japanese|Korean|Arabic|Hindi|Russian)/i,
  native: /(?:my |our )?(?:native|primary|first)\s+language\s+(?:is|:|=)\s+(English|Spanish|French|German|Italian|Portuguese|Chinese|Japanese|Korean|Arabic|Hindi|Russian)/i,
}

/**
 * Time and timezone patterns
 */
const TIMEZONE_PATTERNS = {
  explicit: /(?:my |our )?timezone\s+(?:is|:|=)\s+([A-Za-z_\/]+)/i,
  implicit: /\b(PST|PDT|MST|MDT|CST|CDT|EST|EDT|GMT|UTC|CET|CEST|JST|AEST)\b/,
}

/**
 * Extract addresses from message text
 */
function extractAddresses(text: string): Partial<UserAddress>[] {
  const addresses: Partial<UserAddress>[] = []

  // Try full address pattern
  let match = text.match(ADDRESS_PATTERNS.full)
  if (match) {
    const parsed = parseAddress(match[1])
    if (parsed) {
      const label = text.toLowerCase().includes('work') || text.toLowerCase().includes('office') ? 'work' : 'home'
      addresses.push({ ...parsed, label, isPrimary: addresses.length === 0 })
    }
  }

  // Try "live at" pattern
  match = text.match(ADDRESS_PATTERNS.liveAt)
  if (match) {
    const parsed = parseAddress(match[1])
    if (parsed) {
      addresses.push({ ...parsed, label: 'home', isPrimary: addresses.length === 0 })
    }
  }

  // Try standalone address
  match = text.match(ADDRESS_PATTERNS.standalone)
  if (match) {
    const parsed = parseAddress(match[1])
    if (parsed) {
      addresses.push({ ...parsed, label: 'home', isPrimary: addresses.length === 0 })
    }
  }

  return addresses
}

/**
 * Parse address string into structured components
 */
function parseAddress(addressStr: string): Partial<UserAddress> | null {
  const parts = addressStr.split(',').map(p => p.trim())
  if (parts.length < 2) return null

  const cityStateMatch = addressStr.match(ADDRESS_PATTERNS.cityState)
  const zipMatch = addressStr.match(ADDRESS_PATTERNS.zip)

  const street = parts[0]
  const city = cityStateMatch ? cityStateMatch[1] : parts[1]
  const state = cityStateMatch ? cityStateMatch[2] : undefined
  const postalCode = zipMatch ? zipMatch[1] : undefined

  return {
    id: `addr_${Date.now()}`,
    fullAddress: addressStr,
    street,
    city,
    state,
    postalCode,
    country: 'US', // Default to US, could be enhanced with better detection
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Extract food preferences from message text
 */
function extractFoodPreferences(text: string): FoodPreference[] {
  const preferences: FoodPreference[] = []

  // Check for common dietary restrictions
  for (const [key, pattern] of Object.entries(FOOD_PREFERENCE_PATTERNS)) {
    const match = text.match(pattern)
    if (match && key !== 'preferences' && key !== 'restrictions') {
      const isRestriction = key.includes('Allergy') || key === 'glutenFree' || key === 'dairyFree'
      preferences.push({
        id: `pref_${Date.now()}_${key}`,
        category: key.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, ''),
        isRestriction,
        severity: isRestriction ? 'moderate' : undefined,
      })
    }
  }

  // Extract general preferences
  const prefMatch = text.match(FOOD_PREFERENCE_PATTERNS.preferences)
  if (prefMatch) {
    const items = prefMatch[1].split(/[,&]/).map(s => s.trim())
    items.forEach(item => {
      if (item.length > 2) {
        preferences.push({
          id: `pref_${Date.now()}_${item.replace(/\s+/g, '_')}`,
          category: 'custom',
          description: item,
          isRestriction: false,
        })
      }
    })
  }

  // Extract restrictions
  const restrictMatch = text.match(FOOD_PREFERENCE_PATTERNS.restrictions)
  if (restrictMatch) {
    const items = restrictMatch[1].split(/[,&]/).map(s => s.trim())
    items.forEach(item => {
      if (item.length > 2) {
        preferences.push({
          id: `pref_${Date.now()}_${item.replace(/\s+/g, '_')}`,
          category: 'custom',
          description: item,
          isRestriction: true,
          severity: 'moderate',
        })
      }
    })
  }

  return preferences
}

/**
 * Extract contacts from message text
 */
function extractContacts(text: string): Partial<FrequentContact>[] {
  const contacts: Partial<FrequentContact>[] = []

  // Extract contact action mentions (call/email)
  let match = text.match(CONTACT_PATTERNS.contactAction)
  if (match) {
    const [, name, contact] = match
    const isEmail = contact.includes('@')
    const relationship = detectRelationship(name)
    contacts.push({
      id: `contact_${Date.now()}`,
      name,
      relationship,
      email: isEmail ? contact : undefined,
      phone: isEmail ? undefined : contact,
      priority: relationship === 'family' ? 'high' : 'medium',
      lastInteraction: new Date().toISOString(),
    })
  }

  // Extract email mentions
  match = text.match(CONTACT_PATTERNS.emailMention)
  if (match) {
    const [, name, email] = match
    const relationship = detectRelationship(name)
    contacts.push({
      id: `contact_${Date.now()}`,
      name,
      relationship,
      email,
      priority: relationship === 'family' ? 'high' : 'medium',
      lastInteraction: new Date().toISOString(),
    })
  }

  // Extract phone mentions
  match = text.match(CONTACT_PATTERNS.phoneMention)
  if (match) {
    const [, name, phone] = match
    const relationship = detectRelationship(name)
    contacts.push({
      id: `contact_${Date.now()}`,
      name,
      relationship,
      phone: phone.replace(/[\s()-]/g, ''),
      priority: relationship === 'family' ? 'high' : 'medium',
      lastInteraction: new Date().toISOString(),
    })
  }

  return contacts
}

/**
 * Detect relationship type from name/context
 */
function detectRelationship(name: string): string {
  const nameLower = name.toLowerCase()

  for (const [type, pattern] of Object.entries(CONTACT_PATTERNS.relationships)) {
    if (pattern.test(nameLower)) {
      return type
    }
  }

  return 'custom'
}

/**
 * Extract language preferences
 */
function extractLanguagePreferences(text: string): Partial<CommunicationPreferences> | null {
  let match = text.match(LANGUAGE_PATTERNS.preferred)
  if (match) {
    return {
      preferredLanguage: `${match[1].toLowerCase()}-US` as any, // Simplified
    }
  }

  match = text.match(LANGUAGE_PATTERNS.native)
  if (match) {
    return {
      preferredLanguage: `${match[1].toLowerCase()}-US` as any,
    }
  }

  return null
}

/**
 * Extract timezone information
 */
function extractTimezone(text: string): string | null {
  let match = text.match(TIMEZONE_PATTERNS.explicit)
  if (match) {
    return match[1]
  }

  match = text.match(TIMEZONE_PATTERNS.implicit)
  if (match) {
    // Convert common abbreviations to IANA timezone
    const timezoneMap: Record<string, string> = {
      PST: 'America/Los_Angeles',
      PDT: 'America/Los_Angeles',
      MST: 'America/Denver',
      MDT: 'America/Denver',
      CST: 'America/Chicago',
      CDT: 'America/Chicago',
      EST: 'America/New_York',
      EDT: 'America/New_York',
      GMT: 'Europe/London',
      UTC: 'UTC',
      CET: 'Europe/Paris',
      CEST: 'Europe/Paris',
      JST: 'Asia/Tokyo',
      AEST: 'Australia/Sydney',
    }
    return timezoneMap[match[1]] || null
  }

  return null
}

/**
 * Main extraction function - analyzes message and extracts all context
 */
export function extractUserContext(message: string): ContextExtractionResult {
  const addresses = extractAddresses(message)
  const foodPreferences = extractFoodPreferences(message)
  const frequentContacts = extractContacts(message)
  const languagePrefs = extractLanguagePreferences(message)
  const timezone = extractTimezone(message)

  // Calculate confidence based on what was extracted
  let confidence = 0
  if (addresses.length > 0) confidence += 0.3
  if (foodPreferences.length > 0) confidence += 0.2
  if (frequentContacts.length > 0) confidence += 0.3
  if (languagePrefs) confidence += 0.1
  if (timezone) confidence += 0.1

  // Build partial context
  const extractedContext: PartialUserContext = {
    userId: '', // Will be set by caller
  }

  if (addresses.length > 0) {
    extractedContext.addresses = addresses as UserAddress[]
  }

  if (foodPreferences.length > 0) {
    extractedContext.foodPreferences = foodPreferences
  }

  if (frequentContacts.length > 0) {
    extractedContext.frequentContacts = frequentContacts as FrequentContact[]
  }

  if (languagePrefs || timezone) {
    extractedContext.communicationPreferences = {
      preferredLanguage: languagePrefs?.preferredLanguage || 'en-US',
      timeZone: timezone || 'UTC',
      preferredContactMethods: ['email'],
    }
  }

  const missingFields: string[] = []
  if (addresses.length === 0 && message.toLowerCase().includes('address')) {
    missingFields.push('address')
  }

  return {
    success: confidence > 0,
    extractedContext,
    confidence: Math.min(confidence, 1),
    missingFields,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Batch extract context from multiple messages
 */
export function extractUserContextFromHistory(messages: string[]): ContextExtractionResult {
  const allAddresses: Partial<UserAddress>[] = []
  const allPreferences: FoodPreference[] = []
  const allContacts: Partial<FrequentContact>[] = []
  let languagePrefs: Partial<CommunicationPreferences> | null = null
  let timezone: string | null = null

  for (const message of messages) {
    const result = extractUserContext(message)
    if (result.extractedContext.addresses) {
      allAddresses.push(...result.extractedContext.addresses)
    }
    if (result.extractedContext.foodPreferences) {
      allPreferences.push(...result.extractedContext.foodPreferences)
    }
    if (result.extractedContext.frequentContacts) {
      allContacts.push(...result.extractedContext.frequentContacts)
    }
    if (result.extractedContext.communicationPreferences) {
      languagePrefs = result.extractedContext.communicationPreferences
      if (result.extractedContext.communicationPreferences.timeZone !== 'UTC') {
        timezone = result.extractedContext.communicationPreferences.timeZone
      }
    }
  }

  // Deduplicate
  const uniqueAddresses = deduplicateAddresses(allAddresses as UserAddress[])
  const uniqueContacts = deduplicateContacts(allContacts as FrequentContact[])

  const extractedContext: PartialUserContext = {
    userId: '',
  }

  if (uniqueAddresses.length > 0) extractedContext.addresses = uniqueAddresses
  if (allPreferences.length > 0) extractedContext.foodPreferences = allPreferences
  if (uniqueContacts.length > 0) extractedContext.frequentContacts = uniqueContacts
  if (languagePrefs || timezone) {
    extractedContext.communicationPreferences = {
      preferredLanguage: languagePrefs?.preferredLanguage || 'en-US',
      timeZone: timezone || 'UTC',
      preferredContactMethods: ['email'],
    }
  }

  const confidence = Math.min(
    (uniqueAddresses.length > 0 ? 0.3 : 0) +
    (allPreferences.length > 0 ? 0.2 : 0) +
    (uniqueContacts.length > 0 ? 0.3 : 0) +
    (languagePrefs ? 0.1 : 0) +
    (timezone ? 0.1 : 0),
    1
  )

  return {
    success: confidence > 0,
    extractedContext,
    confidence,
    missingFields: [],
    timestamp: new Date().toISOString(),
  }
}

/**
 * Deduplicate addresses by similarity
 */
function deduplicateAddresses(addresses: UserAddress[]): UserAddress[] {
  const unique: UserAddress[] = []

  for (const addr of addresses) {
    const isDuplicate = unique.some(existing =>
      existing.fullAddress.toLowerCase() === addr.fullAddress.toLowerCase() ||
      (existing.street === addr.street && existing.city === addr.city)
    )
    if (!isDuplicate) {
      unique.push(addr)
    }
  }

  return unique
}

/**
 * Deduplicate contacts by name/email/phone
 */
function deduplicateContacts(contacts: FrequentContact[]): FrequentContact[] {
  const unique: FrequentContact[] = []

  for (const contact of contacts) {
    const isDuplicate = unique.some(existing =>
      existing.name.toLowerCase() === contact.name.toLowerCase() ||
      (existing.email && contact.email && existing.email === contact.email) ||
      (existing.phone && contact.phone && existing.phone === contact.phone)
    )
    if (!isDuplicate) {
      unique.push(contact)
    } else {
      // Merge with existing
      const existing = unique.find(e =>
        e.name.toLowerCase() === contact.name.toLowerCase() ||
        (e.email && contact.email && e.email === contact.email) ||
        (e.phone && contact.phone && e.phone === contact.phone)
      )
      if (existing) {
        if (contact.email && !existing.email) existing.email = contact.email
        if (contact.phone && !existing.phone) existing.phone = contact.phone
        if (contact.relationship && !existing.relationship) existing.relationship = contact.relationship
      }
    }
  }

  return unique
}
