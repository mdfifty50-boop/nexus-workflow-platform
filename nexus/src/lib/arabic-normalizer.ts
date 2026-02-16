/**
 * Arabic text normalization for NLP preprocessing.
 * Handles common variations in Arabic text that would otherwise
 * prevent pattern matching in IntentResolver.
 */

/**
 * Normalize Arabic text for intent matching
 * - Removes tashkeel (diacritical marks: fatha, damma, kasra, shadda, sukun, tanwin)
 * - Normalizes hamza variants (أ إ آ → ا)
 * - Normalizes ta marbuta (ة → ه)
 * - Normalizes alef maksura (ى → ي)
 * - Removes tatweel/kashida (ـ elongation character)
 * - Strips zero-width characters
 */
export function normalizeArabic(text: string): string {
  if (!text) return text

  let normalized = text

  // Remove tashkeel (diacritical marks) - Unicode range 064B-065F
  normalized = normalized.replace(/[\u064B-\u065F]/g, '')

  // Remove tatweel/kashida
  normalized = normalized.replace(/\u0640/g, '')

  // Normalize hamza variants to bare alef
  normalized = normalized.replace(/[أإآ]/g, 'ا')

  // Normalize ta marbuta to ha
  normalized = normalized.replace(/ة/g, 'ه')

  // Normalize alef maksura to ya
  normalized = normalized.replace(/ى/g, 'ي')

  // Remove zero-width characters
  normalized = normalized.replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, '')

  return normalized
}

/**
 * Detect if text contains Arabic characters
 */
export function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text)
}

/**
 * Common Arabic workflow keywords mapped to English equivalents
 * Used to help IntentResolver match Arabic requests
 */
export const ARABIC_KEYWORD_MAP: Record<string, string> = {
  // Actions
  'ارسل': 'send',
  'أرسل': 'send',
  'ارسال': 'send',
  'إرسال': 'send',
  'احفظ': 'save',
  'حفظ': 'save',
  'انشئ': 'create',
  'إنشاء': 'create',
  'حذف': 'delete',
  'امسح': 'delete',
  'حدث': 'update',
  'تحديث': 'update',
  'نقل': 'move',
  'انقل': 'move',
  'نسخ': 'copy',
  'بحث': 'search',
  'ابحث': 'search',

  // Apps/Services
  'بريد': 'email',
  'ايميل': 'email',
  'إيميل': 'email',
  'رسالة': 'message',
  'رسائل': 'messages',
  'جدول': 'spreadsheet',
  'ملف': 'file',
  'ملفات': 'files',
  'مجلد': 'folder',
  'تقويم': 'calendar',
  'موعد': 'meeting',
  'مواعيد': 'meetings',
  'اجتماع': 'meeting',
  'واتساب': 'whatsapp',
  'واتس': 'whatsapp',
  'سلاك': 'slack',
  'جيميل': 'gmail',
  'قوقل': 'google',
  'دروبوكس': 'dropbox',

  // Triggers
  'عندما': 'when',
  'لما': 'when',
  'اذا': 'if',
  'إذا': 'if',
  'كل': 'every',
  'يومياً': 'daily',
  'يوميا': 'daily',
  'اسبوعياً': 'weekly',
  'اسبوعيا': 'weekly',

  // Connectors
  'الى': 'to',
  'إلى': 'to',
  'من': 'from',
  'في': 'in',
  'على': 'on',
  'مع': 'with',
}

/**
 * Transliterate Arabic keywords in text to English equivalents
 * to help IntentResolver match patterns
 */
export function transliterateArabicKeywords(text: string): string {
  if (!containsArabic(text)) return text

  const normalized = normalizeArabic(text)
  let result = normalized

  // Replace known Arabic keywords with English equivalents
  // Sort by length descending so longer phrases match first
  const sortedEntries = Object.entries(ARABIC_KEYWORD_MAP)
    .sort(([a], [b]) => b.length - a.length)

  for (const [arabic, english] of sortedEntries) {
    const normalizedKey = normalizeArabic(arabic)
    result = result.replace(new RegExp(normalizedKey, 'g'), english)
  }

  return result
}
