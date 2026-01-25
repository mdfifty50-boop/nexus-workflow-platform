// Session 10: Form validation utilities

export interface ValidationResult {
  valid: boolean
  error?: string
}

// Email validation
export function validateEmail(email: string): ValidationResult {
  if (!email.trim()) {
    return { valid: false, error: 'Email is required' }
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' }
  }
  return { valid: true }
}

// Required field validation
export function validateRequired(value: string, fieldName: string): ValidationResult {
  if (!value.trim()) {
    return { valid: false, error: `${fieldName} is required` }
  }
  return { valid: true }
}

// Min length validation
export function validateMinLength(value: string, minLength: number, fieldName: string): ValidationResult {
  if (value.trim().length < minLength) {
    return { valid: false, error: `${fieldName} must be at least ${minLength} characters` }
  }
  return { valid: true }
}

// Max length validation
export function validateMaxLength(value: string, maxLength: number, fieldName: string): ValidationResult {
  if (value.length > maxLength) {
    return { valid: false, error: `${fieldName} must be no more than ${maxLength} characters` }
  }
  return { valid: true }
}

// Password strength validation
export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong'
  color: string
  feedback: string[]
}

export function validatePassword(password: string): PasswordStrength {
  const feedback: string[] = []
  let score = 0

  if (password.length >= 8) {
    score++
  } else {
    feedback.push('At least 8 characters')
  }

  if (/[A-Z]/.test(password)) {
    score++
  } else {
    feedback.push('One uppercase letter')
  }

  if (/[a-z]/.test(password)) {
    score++
  } else {
    feedback.push('One lowercase letter')
  }

  if (/\d/.test(password)) {
    score++
  } else {
    feedback.push('One number')
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score++
  } else {
    feedback.push('One special character')
  }

  // Clamp score to max 4
  const clampedScore = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4

  const labels: Record<0 | 1 | 2 | 3 | 4, PasswordStrength['label']> = {
    0: 'Very Weak',
    1: 'Weak',
    2: 'Fair',
    3: 'Strong',
    4: 'Very Strong'
  }

  const colors: Record<0 | 1 | 2 | 3 | 4, string> = {
    0: '#ef4444', // red
    1: '#f97316', // orange
    2: '#eab308', // yellow
    3: '#22c55e', // green
    4: '#06b6d4'  // cyan
  }

  return {
    score: clampedScore,
    label: labels[clampedScore],
    color: colors[clampedScore],
    feedback
  }
}

// Passwords match validation
export function validatePasswordsMatch(password: string, confirmPassword: string): ValidationResult {
  if (password !== confirmPassword) {
    return { valid: false, error: 'Passwords do not match' }
  }
  return { valid: true }
}

// 2FA code validation (6 digits)
export function validate2FACode(code: string): ValidationResult {
  if (!code.trim()) {
    return { valid: false, error: 'Verification code is required' }
  }
  if (!/^\d{6}$/.test(code)) {
    return { valid: false, error: 'Code must be exactly 6 digits' }
  }
  return { valid: true }
}

// API key validation (checks prefix and min length)
export function validateAPIKey(key: string, expectedPrefix?: string): ValidationResult {
  if (!key.trim()) {
    return { valid: false, error: 'API key is required' }
  }
  if (key.length < 20) {
    return { valid: false, error: 'API key appears too short' }
  }
  if (expectedPrefix && !key.startsWith(expectedPrefix)) {
    return { valid: false, error: `API key should start with "${expectedPrefix}"` }
  }
  return { valid: true }
}

// Project name validation
export function validateProjectName(name: string): ValidationResult {
  const trimmed = name.trim()
  if (!trimmed) {
    return { valid: false, error: 'Project name is required' }
  }
  if (trimmed.length < 2) {
    return { valid: false, error: 'Project name must be at least 2 characters' }
  }
  if (trimmed.length > 50) {
    return { valid: false, error: 'Project name must be 50 characters or less' }
  }
  return { valid: true }
}

// Combined validator helper
export function validateField(
  value: string,
  validators: Array<(value: string) => ValidationResult>
): ValidationResult {
  for (const validator of validators) {
    const result = validator(value)
    if (!result.valid) {
      return result
    }
  }
  return { valid: true }
}
