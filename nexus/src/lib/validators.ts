/**
 * Form Validation Library
 *
 * Comprehensive validators using Zod-like patterns with simple functions.
 * Provides composable validation for forms and data input.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface ValidationResult {
  valid: boolean
  error?: string
  errors?: string[]
}

export type Validator<T = string> = (value: T) => ValidationResult

export interface ValidatorOptions {
  message?: string
}

// =============================================================================
// CORE VALIDATORS
// =============================================================================

/**
 * Validates that a value is not empty
 */
export function required(options?: ValidatorOptions): Validator<string> {
  return (value: string) => {
    const trimmed = typeof value === 'string' ? value.trim() : ''
    if (!trimmed) {
      return { valid: false, error: options?.message || 'This field is required' }
    }
    return { valid: true }
  }
}

/**
 * Validates email format
 */
export function email(options?: ValidatorOptions): Validator<string> {
  return (value: string) => {
    if (!value || !value.trim()) {
      return { valid: true } // Use required() for empty check
    }
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    if (!emailRegex.test(value)) {
      return { valid: false, error: options?.message || 'Please enter a valid email address' }
    }
    return { valid: true }
  }
}

/**
 * Validates URL format
 */
export function url(options?: ValidatorOptions): Validator<string> {
  return (value: string) => {
    if (!value || !value.trim()) {
      return { valid: true } // Use required() for empty check
    }
    try {
      const urlObj = new URL(value)
      // Must have http or https protocol
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { valid: false, error: options?.message || 'URL must use http or https protocol' }
      }
      return { valid: true }
    } catch {
      return { valid: false, error: options?.message || 'Please enter a valid URL' }
    }
  }
}

/**
 * Validates minimum string length
 */
export function minLength(min: number, options?: ValidatorOptions): Validator<string> {
  return (value: string) => {
    const trimmed = typeof value === 'string' ? value.trim() : ''
    if (trimmed.length < min) {
      return {
        valid: false,
        error: options?.message || `Must be at least ${min} character${min !== 1 ? 's' : ''}`
      }
    }
    return { valid: true }
  }
}

/**
 * Validates maximum string length
 */
export function maxLength(max: number, options?: ValidatorOptions): Validator<string> {
  return (value: string) => {
    const str = typeof value === 'string' ? value : ''
    if (str.length > max) {
      return {
        valid: false,
        error: options?.message || `Must be no more than ${max} character${max !== 1 ? 's' : ''}`
      }
    }
    return { valid: true }
  }
}

/**
 * Validates against a regex pattern
 */
export function pattern(regex: RegExp, options?: ValidatorOptions): Validator<string> {
  return (value: string) => {
    if (!value || !value.trim()) {
      return { valid: true } // Use required() for empty check
    }
    if (!regex.test(value)) {
      return { valid: false, error: options?.message || 'Invalid format' }
    }
    return { valid: true }
  }
}

/**
 * Validates numeric range (for string numbers)
 */
export function numericRange(min?: number, max?: number, options?: ValidatorOptions): Validator<string> {
  return (value: string) => {
    if (!value || !value.trim()) {
      return { valid: true }
    }
    const num = Number(value)
    if (isNaN(num)) {
      return { valid: false, error: options?.message || 'Must be a valid number' }
    }
    if (min !== undefined && num < min) {
      return { valid: false, error: options?.message || `Must be at least ${min}` }
    }
    if (max !== undefined && num > max) {
      return { valid: false, error: options?.message || `Must be no more than ${max}` }
    }
    return { valid: true }
  }
}

/**
 * Validates that value matches another value
 */
export function matches(getValue: () => string, fieldName: string, options?: ValidatorOptions): Validator<string> {
  return (value: string) => {
    const compareValue = getValue()
    if (value !== compareValue) {
      return { valid: false, error: options?.message || `Must match ${fieldName}` }
    }
    return { valid: true }
  }
}

// =============================================================================
// SPECIALIZED VALIDATORS
// =============================================================================

/**
 * Validates alphanumeric strings (letters and numbers only)
 */
export function alphanumeric(options?: ValidatorOptions): Validator<string> {
  return pattern(/^[a-zA-Z0-9]*$/, {
    message: options?.message || 'Only letters and numbers are allowed'
  })
}

/**
 * Validates slug format (lowercase letters, numbers, hyphens)
 */
export function slug(options?: ValidatorOptions): Validator<string> {
  return pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: options?.message || 'Must be a valid slug (lowercase letters, numbers, and hyphens)'
  })
}

/**
 * Validates phone number format
 */
export function phone(options?: ValidatorOptions): Validator<string> {
  return (value: string) => {
    if (!value || !value.trim()) {
      return { valid: true }
    }
    // Remove common separators for validation
    const cleaned = value.replace(/[\s\-().]/g, '')
    // Check for valid phone pattern (10-15 digits, optionally starting with +)
    if (!/^\+?\d{10,15}$/.test(cleaned)) {
      return { valid: false, error: options?.message || 'Please enter a valid phone number' }
    }
    return { valid: true }
  }
}

/**
 * Validates date string format (ISO or common formats)
 */
export function date(options?: ValidatorOptions): Validator<string> {
  return (value: string) => {
    if (!value || !value.trim()) {
      return { valid: true }
    }
    const parsed = Date.parse(value)
    if (isNaN(parsed)) {
      return { valid: false, error: options?.message || 'Please enter a valid date' }
    }
    return { valid: true }
  }
}

/**
 * Validates JSON string
 */
export function json(options?: ValidatorOptions): Validator<string> {
  return (value: string) => {
    if (!value || !value.trim()) {
      return { valid: true }
    }
    try {
      JSON.parse(value)
      return { valid: true }
    } catch {
      return { valid: false, error: options?.message || 'Must be valid JSON' }
    }
  }
}

/**
 * Validates UUID format
 */
export function uuid(options?: ValidatorOptions): Validator<string> {
  return pattern(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    { message: options?.message || 'Must be a valid UUID' }
  )
}

/**
 * Validates credit card number (Luhn algorithm)
 */
export function creditCard(options?: ValidatorOptions): Validator<string> {
  return (value: string) => {
    if (!value || !value.trim()) {
      return { valid: true }
    }
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length < 13 || cleaned.length > 19) {
      return { valid: false, error: options?.message || 'Invalid card number' }
    }
    // Luhn algorithm
    let sum = 0
    let isEven = false
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10)
      if (isEven) {
        digit *= 2
        if (digit > 9) digit -= 9
      }
      sum += digit
      isEven = !isEven
    }
    if (sum % 10 !== 0) {
      return { valid: false, error: options?.message || 'Invalid card number' }
    }
    return { valid: true }
  }
}

// =============================================================================
// COMPOSITION UTILITIES
// =============================================================================

/**
 * Combines multiple validators into one (runs all, returns first error)
 */
export function compose<T = string>(...validators: Validator<T>[]): Validator<T> {
  return (value: T) => {
    for (const validator of validators) {
      const result = validator(value)
      if (!result.valid) {
        return result
      }
    }
    return { valid: true }
  }
}

/**
 * Combines multiple validators and returns all errors
 */
export function composeAll<T = string>(...validators: Validator<T>[]): Validator<T> {
  return (value: T) => {
    const errors: string[] = []
    for (const validator of validators) {
      const result = validator(value)
      if (!result.valid && result.error) {
        errors.push(result.error)
      }
    }
    if (errors.length > 0) {
      return { valid: false, error: errors[0], errors }
    }
    return { valid: true }
  }
}

/**
 * Makes a validator optional (passes if value is empty)
 */
export function optional<T = string>(validator: Validator<T>): Validator<T> {
  return (value: T) => {
    const strValue = typeof value === 'string' ? value : ''
    if (!strValue || !strValue.trim()) {
      return { valid: true }
    }
    return validator(value)
  }
}

/**
 * Custom validator factory
 */
export function custom<T = string>(
  validate: (value: T) => boolean,
  message: string
): Validator<T> {
  return (value: T) => {
    if (!validate(value)) {
      return { valid: false, error: message }
    }
    return { valid: true }
  }
}

// =============================================================================
// FORM VALIDATION HELPERS
// =============================================================================

export interface FormValidationSchema {
  [field: string]: Validator<string> | Validator<string>[]
}

export interface FormErrors {
  [field: string]: string | undefined
}

/**
 * Validates an entire form against a schema
 */
export function validateForm(
  values: Record<string, string>,
  schema: FormValidationSchema
): { valid: boolean; errors: FormErrors } {
  const errors: FormErrors = {}
  let valid = true

  for (const [field, validator] of Object.entries(schema)) {
    const value = values[field] || ''
    const validators = Array.isArray(validator) ? compose(...validator) : validator
    const result = validators(value)

    if (!result.valid) {
      valid = false
      errors[field] = result.error
    }
  }

  return { valid, errors }
}

/**
 * Validates a single field
 */
export function validateField(
  value: string,
  validators: Validator<string> | Validator<string>[]
): ValidationResult {
  const combinedValidator = Array.isArray(validators) ? compose(...validators) : validators
  return combinedValidator(value)
}

// =============================================================================
// COMMON PRESETS
// =============================================================================

export const presets = {
  /** Required email */
  requiredEmail: compose(required(), email()),

  /** Required URL */
  requiredUrl: compose(required(), url()),

  /** Username: 3-20 alphanumeric characters */
  username: compose(
    required({ message: 'Username is required' }),
    minLength(3, { message: 'Username must be at least 3 characters' }),
    maxLength(20, { message: 'Username must be 20 characters or less' }),
    alphanumeric({ message: 'Username can only contain letters and numbers' })
  ),

  /** Strong password: 8+ chars, uppercase, lowercase, number, special */
  strongPassword: composeAll(
    required({ message: 'Password is required' }),
    minLength(8, { message: 'Password must be at least 8 characters' }),
    pattern(/[A-Z]/, { message: 'Password must contain an uppercase letter' }),
    pattern(/[a-z]/, { message: 'Password must contain a lowercase letter' }),
    pattern(/\d/, { message: 'Password must contain a number' }),
    pattern(/[!@#$%^&*(),.?":{}|<>]/, { message: 'Password must contain a special character' })
  ),

  /** Project name: 2-50 characters */
  projectName: compose(
    required({ message: 'Project name is required' }),
    minLength(2, { message: 'Project name must be at least 2 characters' }),
    maxLength(50, { message: 'Project name must be 50 characters or less' })
  ),

  /** Description: optional, max 500 characters */
  description: maxLength(500, { message: 'Description must be 500 characters or less' }),

  /** API key: required, 20+ characters */
  apiKey: compose(
    required({ message: 'API key is required' }),
    minLength(20, { message: 'API key appears too short' })
  )
}
