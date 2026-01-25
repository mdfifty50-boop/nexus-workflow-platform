/**
 * Input Sanitization Utility
 * Security hardening for user inputs to prevent XSS, injection attacks, and data corruption
 */

// Maximum lengths for common field types
export const MAX_LENGTHS = {
  shortText: 100,      // Names, titles
  mediumText: 500,     // Descriptions, summaries
  longText: 5000,      // Content, messages
  email: 254,          // RFC 5321 limit
  url: 2048,           // Common browser limit
  password: 128,       // Reasonable upper limit
  id: 64,              // UUIDs, IDs
  searchQuery: 200,    // Search inputs
  filename: 255,       // Common filesystem limit
} as const

// Dangerous patterns to strip
const SCRIPT_PATTERN = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi
const EVENT_HANDLER_PATTERN = /\s*on\w+\s*=\s*["'][^"']*["']/gi
const JAVASCRIPT_URL_PATTERN = /javascript\s*:/gi
const DATA_URL_PATTERN = /data\s*:/gi
const EXPRESSION_PATTERN = /expression\s*\(/gi
const VB_SCRIPT_PATTERN = /vbscript\s*:/gi

// SQL injection patterns (for additional defense layer)
const SQL_INJECTION_PATTERNS = [
  /('|"|;|--|\/\*|\*\/|xp_|sp_|exec|execute|insert|delete|update|drop|alter|create|truncate|union|select)/gi,
]

// Path traversal patterns
const PATH_TRAVERSAL_PATTERN = /\.\.[\\/]/g

/**
 * Strip HTML tags and dangerous content from a string
 */
export function stripHtml(input: string): string {
  if (!input || typeof input !== 'string') return ''

  return input
    .replace(SCRIPT_PATTERN, '')
    .replace(EVENT_HANDLER_PATTERN, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
}

/**
 * Escape HTML special characters for safe display
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== 'string') return ''

  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  }

  return input.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char] || char)
}

/**
 * Sanitize a string for safe use, removing dangerous characters
 */
export function sanitizeString(
  input: string,
  options: {
    maxLength?: number
    allowHtml?: boolean
    stripNewlines?: boolean
    trim?: boolean
  } = {}
): string {
  const {
    maxLength = MAX_LENGTHS.mediumText,
    allowHtml = false,
    stripNewlines = false,
    trim = true,
  } = options

  if (!input || typeof input !== 'string') return ''

  let result = input

  // Strip HTML if not allowed
  if (!allowHtml) {
    result = stripHtml(result)
  }

  // Remove dangerous patterns regardless of HTML setting
  result = result
    .replace(JAVASCRIPT_URL_PATTERN, '')
    .replace(DATA_URL_PATTERN, 'data:')
    .replace(EXPRESSION_PATTERN, '')
    .replace(VB_SCRIPT_PATTERN, '')

  // Strip newlines if requested
  if (stripNewlines) {
    result = result.replace(/[\r\n]+/g, ' ')
  }

  // Trim whitespace
  if (trim) {
    result = result.trim()
  }

  // Enforce max length
  if (result.length > maxLength) {
    result = result.substring(0, maxLength)
  }

  // Remove null bytes and other control characters (except newlines/tabs)
  result = result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  return result
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return ''

  // Basic email sanitization
  let result = email.trim().toLowerCase()
  result = result.substring(0, MAX_LENGTHS.email)

  // Remove any characters that shouldn't be in emails
  result = result.replace(/[<>'";\s]/g, '')

  return result
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return ''

  let result = url.trim()
  result = result.substring(0, MAX_LENGTHS.url)

  // Remove dangerous URL schemes
  if (JAVASCRIPT_URL_PATTERN.test(result) || VB_SCRIPT_PATTERN.test(result)) {
    return ''
  }

  // Only allow http, https, mailto protocols
  try {
    const parsed = new URL(result)
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return ''
    }
    return parsed.href
  } catch {
    // If not a valid URL, return empty
    return ''
  }
}

/**
 * Sanitize filename to prevent path traversal and invalid characters
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') return ''

  let result = filename.trim()

  // Remove path traversal attempts
  result = result.replace(PATH_TRAVERSAL_PATTERN, '')

  // Remove directory separators
  result = result.replace(/[/\\]/g, '')

  // Remove other dangerous characters for filenames
  result = result.replace(/[<>:"|?*\x00-\x1F]/g, '')

  // Enforce max length
  result = result.substring(0, MAX_LENGTHS.filename)

  return result || 'unnamed'
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') return ''

  let result = query.trim()

  // Remove potential SQL injection patterns for defense in depth
  // (Primary defense should be parameterized queries on backend)
  for (const pattern of SQL_INJECTION_PATTERNS) {
    result = result.replace(pattern, '')
  }

  // Strip HTML and dangerous content
  result = stripHtml(result)

  // Enforce max length
  result = result.substring(0, MAX_LENGTHS.searchQuery)

  return result
}

/**
 * Sanitize ID (UUIDs, database IDs, etc.)
 */
export function sanitizeId(id: string): string {
  if (!id || typeof id !== 'string') return ''

  // Only allow alphanumeric, hyphens, and underscores
  let result = id.trim().replace(/[^a-zA-Z0-9_-]/g, '')
  result = result.substring(0, MAX_LENGTHS.id)

  return result
}

/**
 * Sanitize JSON string to ensure it's valid and safe
 */
export function sanitizeJson<T = unknown>(
  jsonString: string,
  validator?: (data: unknown) => data is T
): T | null {
  if (!jsonString || typeof jsonString !== 'string') return null

  try {
    const parsed = JSON.parse(jsonString)

    // If a validator is provided, use it
    if (validator && !validator(parsed)) {
      return null
    }

    return parsed as T
  } catch {
    return null
  }
}

/**
 * Sanitize object by applying string sanitization to all string properties
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: {
    maxStringLength?: number
    allowHtml?: boolean
  } = {}
): T {
  const { maxStringLength = MAX_LENGTHS.mediumText, allowHtml = false } = options

  if (!obj || typeof obj !== 'object') return obj

  const result = { ...obj }

  for (const key of Object.keys(result)) {
    const value = result[key]

    if (typeof value === 'string') {
      (result as Record<string, unknown>)[key] = sanitizeString(value, {
        maxLength: maxStringLength,
        allowHtml,
      })
    } else if (Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = value.map((item) =>
        typeof item === 'string'
          ? sanitizeString(item, { maxLength: maxStringLength, allowHtml })
          : typeof item === 'object' && item !== null
          ? sanitizeObject(item as Record<string, unknown>, options)
          : item
      )
    } else if (typeof value === 'object' && value !== null) {
      (result as Record<string, unknown>)[key] = sanitizeObject(
        value as Record<string, unknown>,
        options
      )
    }
  }

  return result
}

/**
 * Validate string length is within bounds
 */
export function validateLength(
  input: string,
  min: number,
  max: number
): { valid: boolean; error?: string } {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: 'Input is required' }
  }

  if (input.length < min) {
    return { valid: false, error: `Must be at least ${min} characters` }
  }

  if (input.length > max) {
    return { valid: false, error: `Must be no more than ${max} characters` }
  }

  return { valid: true }
}

/**
 * Form sanitization helper - sanitize all form fields at once
 */
export function sanitizeFormData(
  formData: FormData | Record<string, unknown>,
  schema: Record<string, {
    type: 'string' | 'email' | 'url' | 'id' | 'search' | 'filename'
    maxLength?: number
    required?: boolean
  }>
): { data: Record<string, string>; errors: Record<string, string> } {
  const data: Record<string, string> = {}
  const errors: Record<string, string> = {}

  // Convert FormData to object if needed
  const inputData: Record<string, unknown> = formData instanceof FormData
    ? Object.fromEntries(formData.entries())
    : formData

  for (const [key, config] of Object.entries(schema)) {
    const value = inputData[key]

    if (config.required && (!value || (typeof value === 'string' && !value.trim()))) {
      errors[key] = `${key} is required`
      data[key] = ''
      continue
    }

    if (!value) {
      data[key] = ''
      continue
    }

    const stringValue = String(value)

    switch (config.type) {
      case 'email':
        data[key] = sanitizeEmail(stringValue)
        if (config.required && !data[key]) {
          errors[key] = 'Invalid email address'
        }
        break
      case 'url':
        data[key] = sanitizeUrl(stringValue)
        if (config.required && !data[key]) {
          errors[key] = 'Invalid URL'
        }
        break
      case 'id':
        data[key] = sanitizeId(stringValue)
        break
      case 'search':
        data[key] = sanitizeSearchQuery(stringValue)
        break
      case 'filename':
        data[key] = sanitizeFilename(stringValue)
        break
      case 'string':
      default:
        data[key] = sanitizeString(stringValue, {
          maxLength: config.maxLength || MAX_LENGTHS.mediumText,
        })
        break
    }
  }

  return { data, errors }
}
