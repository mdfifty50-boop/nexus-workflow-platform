/**
 * Dialect Detection Library
 *
 * Detects language and dialect from spoken text using:
 * - Character-based detection (Arabic vs Latin scripts)
 * - Dialect-specific vocabulary patterns
 * - Common phrases and idioms
 *
 * Supports:
 * - English (US, UK, AU)
 * - Arabic dialects (Kuwaiti, Saudi, Egyptian, Gulf, Levantine)
 * - Auto-detection from speech content
 */

export type Language = 'en' | 'ar' | 'auto'

export type EnglishDialect = 'en-US' | 'en-GB' | 'en-AU'
export type ArabicDialect = 'ar-KW' | 'ar-SA' | 'ar-EG' | 'ar-AE' | 'ar-JO' | 'ar-LB'
export type Dialect = EnglishDialect | ArabicDialect

export interface DialectDetectionResult {
  language: Language
  dialect: Dialect
  confidence: number // 0-1
  detectedPatterns: string[]
  isRTL: boolean // Right-to-left for Arabic
}

/**
 * Kuwaiti Arabic dialect patterns
 * Common words, phrases, and linguistic markers specific to Kuwait
 */
const KUWAITI_PATTERNS = [
  // Question words
  { pattern: /\bشلون\b/g, weight: 3, label: 'how (Kuwaiti)' },
  { pattern: /\bاشلون\b/g, weight: 3, label: 'how (variant)' },
  { pattern: /\bشنو\b/g, weight: 3, label: 'what (Kuwaiti)' },
  { pattern: /\bوين\b/g, weight: 3, label: 'where (Kuwaiti)' },
  { pattern: /\bشكو\b/g, weight: 3, label: 'what is there' },
  { pattern: /\bشكثر\b/g, weight: 3, label: 'how much' },

  // Common verbs
  { pattern: /\bمابي\b/g, weight: 2, label: 'I don\'t want' },
  { pattern: /\bيبا\b/g, weight: 2, label: 'I want' },
  { pattern: /\bيايب\b/g, weight: 2, label: 'brought' },
  { pattern: /\bموجود\b/g, weight: 1, label: 'exists/present' },

  // Intensifiers and adverbs
  { pattern: /\bوايد\b/g, weight: 3, label: 'very/a lot' },
  { pattern: /\bعادي\b/g, weight: 2, label: 'normal/ok' },
  { pattern: /\bمافي\b/g, weight: 2, label: 'there isn\'t' },
  { pattern: /\bفيه\b/g, weight: 1, label: 'there is' },

  // Location markers
  { pattern: /\bهني\b/g, weight: 2, label: 'here (Kuwaiti)' },
  { pattern: /\bهناك\b/g, weight: 1, label: 'there (Kuwaiti)' },

  // Pronouns
  { pattern: /\bإنت\b/g, weight: 2, label: 'you (Kuwaiti spelling)' },
  { pattern: /\bإنتي\b/g, weight: 2, label: 'you (feminine)' },

  // Common phrases
  { pattern: /\bعباله\b/g, weight: 3, label: 'in his mind' },
  { pattern: /\bشدعوى\b/g, weight: 3, label: 'what\'s the matter' },
  { pattern: /\bدارسين\b/g, weight: 2, label: 'aware/know about' },
]

/**
 * Saudi Arabic dialect patterns
 */
const SAUDI_PATTERNS = [
  { pattern: /\bكيف\b/g, weight: 2, label: 'how (Saudi)' },
  { pattern: /\bوش\b/g, weight: 3, label: 'what (Saudi)' },
  { pattern: /\bوين\b/g, weight: 2, label: 'where (Saudi)' },
  { pattern: /\bمعليش\b/g, weight: 2, label: 'no problem' },
  { pattern: /\bزين\b/g, weight: 2, label: 'good (Saudi)' },
  { pattern: /\bيلا\b/g, weight: 2, label: 'let\'s go' },
  { pattern: /\bإيه\b/g, weight: 1, label: 'yes (Saudi)' },
]

/**
 * Egyptian Arabic dialect patterns
 */
const EGYPTIAN_PATTERNS = [
  { pattern: /\bازيك\b/g, weight: 3, label: 'how are you' },
  { pattern: /\bازيكو\b/g, weight: 3, label: 'how are you (plural)' },
  { pattern: /\bعامل\b/g, weight: 2, label: 'doing' },
  { pattern: /\bايه\b/g, weight: 2, label: 'what (Egyptian)' },
  { pattern: /\bمش\b/g, weight: 3, label: 'not (Egyptian)' },
  { pattern: /\bكده\b/g, weight: 2, label: 'like this' },
  { pattern: /\bفين\b/g, weight: 2, label: 'where (Egyptian)' },
  { pattern: /\bهو\b/g, weight: 1, label: 'it is' },
]

/**
 * English dialect patterns
 */
const US_ENGLISH_PATTERNS = [
  { pattern: /\bcolor\b/gi, weight: 2, label: 'US spelling' },
  { pattern: /\bcenter\b/gi, weight: 2, label: 'US spelling' },
  { pattern: /\bhey\b/gi, weight: 1, label: 'US greeting' },
  { pattern: /\bguy(s)?\b/gi, weight: 1, label: 'US informal' },
  { pattern: /\bawesome\b/gi, weight: 1, label: 'US expression' },
]

const UK_ENGLISH_PATTERNS = [
  { pattern: /\bcolour\b/gi, weight: 2, label: 'UK spelling' },
  { pattern: /\bcentre\b/gi, weight: 2, label: 'UK spelling' },
  { pattern: /\bmate\b/gi, weight: 2, label: 'UK informal' },
  { pattern: /\bcheers\b/gi, weight: 1, label: 'UK expression' },
  { pattern: /\bbrilliant\b/gi, weight: 1, label: 'UK expression' },
]

/**
 * Detect if text contains Arabic characters
 */
export function isArabic(text: string): boolean {
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/
  return arabicPattern.test(text)
}

/**
 * Detect if text contains English characters
 */
export function isEnglish(text: string): boolean {
  const englishPattern = /[a-zA-Z]/
  return englishPattern.test(text)
}

/**
 * Calculate confidence based on pattern matches
 */
function calculateConfidence(
  matches: Array<{ pattern: RegExp; weight: number; label: string }>,
  text: string
): { confidence: number; detectedPatterns: string[] } {
  let totalScore = 0
  const detectedPatterns: string[] = []

  for (const { pattern, weight, label } of matches) {
    const matchCount = (text.match(pattern) || []).length
    if (matchCount > 0) {
      totalScore += weight * matchCount
      detectedPatterns.push(label)
    }
  }

  // Normalize confidence to 0-1 range
  // Higher scores = higher confidence
  const confidence = Math.min(totalScore / 10, 1)

  return { confidence, detectedPatterns }
}

/**
 * Detect Arabic dialect from text
 */
export function detectArabicDialect(text: string): {
  dialect: ArabicDialect
  confidence: number
  detectedPatterns: string[]
} {
  // Try Kuwaiti first
  const kuwaitiResult = calculateConfidence(KUWAITI_PATTERNS, text)
  const saudiResult = calculateConfidence(SAUDI_PATTERNS, text)
  const egyptianResult = calculateConfidence(EGYPTIAN_PATTERNS, text)

  // Find the dialect with highest confidence
  const results = [
    { dialect: 'ar-KW' as ArabicDialect, ...kuwaitiResult },
    { dialect: 'ar-SA' as ArabicDialect, ...saudiResult },
    { dialect: 'ar-EG' as ArabicDialect, ...egyptianResult },
  ]

  results.sort((a, b) => b.confidence - a.confidence)

  // If no patterns matched, default to Saudi (Modern Standard Arabic fallback)
  if (results[0].confidence === 0) {
    return {
      dialect: 'ar-SA',
      confidence: 0.3, // Low confidence for default
      detectedPatterns: ['default: Modern Standard Arabic'],
    }
  }

  return results[0]
}

/**
 * Detect English dialect from text
 */
export function detectEnglishDialect(text: string): {
  dialect: EnglishDialect
  confidence: number
  detectedPatterns: string[]
} {
  const usResult = calculateConfidence(US_ENGLISH_PATTERNS, text)
  const ukResult = calculateConfidence(UK_ENGLISH_PATTERNS, text)

  const results = [
    { dialect: 'en-US' as EnglishDialect, ...usResult },
    { dialect: 'en-GB' as EnglishDialect, ...ukResult },
  ]

  results.sort((a, b) => b.confidence - a.confidence)

  // Default to US English
  if (results[0].confidence === 0) {
    return {
      dialect: 'en-US',
      confidence: 0.4,
      detectedPatterns: ['default: US English'],
    }
  }

  return results[0]
}

/**
 * Main dialect detection function
 * Detects language and dialect from spoken/written text
 */
export function detectDialect(text: string): DialectDetectionResult {
  if (!text || text.trim().length === 0) {
    return {
      language: 'auto',
      dialect: 'en-US',
      confidence: 0,
      detectedPatterns: [],
      isRTL: false,
    }
  }

  const hasArabic = isArabic(text)
  const hasEnglish = isEnglish(text)

  // Arabic text
  if (hasArabic && !hasEnglish) {
    const result = detectArabicDialect(text)
    return {
      language: 'ar',
      dialect: result.dialect,
      confidence: result.confidence,
      detectedPatterns: result.detectedPatterns,
      isRTL: true,
    }
  }

  // English text
  if (hasEnglish && !hasArabic) {
    const result = detectEnglishDialect(text)
    return {
      language: 'en',
      dialect: result.dialect,
      confidence: result.confidence,
      detectedPatterns: result.detectedPatterns,
      isRTL: false,
    }
  }

  // Mixed text - determine primary language by character count
  if (hasArabic && hasEnglish) {
    const arabicCount = (text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) || []).length
    const englishCount = (text.match(/[a-zA-Z]/g) || []).length

    if (arabicCount > englishCount) {
      const result = detectArabicDialect(text)
      return {
        language: 'ar',
        dialect: result.dialect,
        confidence: result.confidence * 0.8, // Reduce confidence for mixed
        detectedPatterns: result.detectedPatterns,
        isRTL: true,
      }
    } else {
      const result = detectEnglishDialect(text)
      return {
        language: 'en',
        dialect: result.dialect,
        confidence: result.confidence * 0.8,
        detectedPatterns: result.detectedPatterns,
        isRTL: false,
      }
    }
  }

  // Fallback
  return {
    language: 'auto',
    dialect: 'en-US',
    confidence: 0.1,
    detectedPatterns: ['no clear patterns detected'],
    isRTL: false,
  }
}

/**
 * Get display name for dialect
 */
export function getDialectDisplayName(dialect: Dialect): string {
  const names: Record<Dialect, string> = {
    'en-US': 'English (US)',
    'en-GB': 'English (UK)',
    'en-AU': 'English (AU)',
    'ar-KW': 'عربي كويتي (Kuwaiti Arabic)',
    'ar-SA': 'العربية السعودية (Saudi Arabic)',
    'ar-EG': 'العربية المصرية (Egyptian Arabic)',
    'ar-AE': 'عربي إماراتي (Emirati Arabic)',
    'ar-JO': 'عربي أردني (Jordanian Arabic)',
    'ar-LB': 'عربي لبناني (Lebanese Arabic)',
  }
  return names[dialect] || dialect
}

/**
 * Get flag emoji for dialect
 */
export function getDialectFlag(dialect: Dialect): string {
  const flags: Record<Dialect, string> = {
    'en-US': '🇺🇸',
    'en-GB': '🇬🇧',
    'en-AU': '🇦🇺',
    'ar-KW': '🇰🇼',
    'ar-SA': '🇸🇦',
    'ar-EG': '🇪🇬',
    'ar-AE': '🇦🇪',
    'ar-JO': '🇯🇴',
    'ar-LB': '🇱🇧',
  }
  return flags[dialect] || '🌐'
}

/**
 * Export all dialect options for UI
 */
export const SUPPORTED_DIALECTS: Array<{
  dialect: Dialect
  language: Language
  displayName: string
  flag: string
}> = [
  { dialect: 'en-US', language: 'en', displayName: 'English (US)', flag: '🇺🇸' },
  { dialect: 'en-GB', language: 'en', displayName: 'English (UK)', flag: '🇬🇧' },
  { dialect: 'en-AU', language: 'en', displayName: 'English (AU)', flag: '🇦🇺' },
  { dialect: 'ar-KW', language: 'ar', displayName: 'عربي كويتي', flag: '🇰🇼' },
  { dialect: 'ar-SA', language: 'ar', displayName: 'العربية السعودية', flag: '🇸🇦' },
  { dialect: 'ar-EG', language: 'ar', displayName: 'العربية المصرية', flag: '🇪🇬' },
]
