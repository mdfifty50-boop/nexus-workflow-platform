/**
 * Voice Utilities
 *
 * Export all voice-related utilities
 */

export type {
  Language,
  EnglishDialect,
  ArabicDialect,
  Dialect,
  DialectDetectionResult,
} from './dialect-detector'

export {
  isArabic,
  isEnglish,
  detectArabicDialect,
  detectEnglishDialect,
  detectDialect,
  getDialectDisplayName,
  getDialectFlag,
  SUPPORTED_DIALECTS,
} from './dialect-detector'
