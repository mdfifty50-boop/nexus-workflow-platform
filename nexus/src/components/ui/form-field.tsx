/**
 * FormField Component - Accessible Form Input Wrapper
 *
 * Provides consistent accessible form field implementation including:
 * - Proper label association
 * - Error message announcements
 * - Required field indicators
 * - Helper text support
 * - Live validation feedback
 *
 * WCAG Compliance:
 * - 1.3.1 Info and Relationships (label association)
 * - 3.3.1 Error Identification (error messages)
 * - 3.3.2 Labels or Instructions
 * - 4.1.2 Name, Role, Value
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { useLiveRegion } from '../LiveRegion'

export interface FormFieldProps {
  /** Unique ID for the input (required for label association) */
  id: string
  /** Label text */
  label: string
  /** Whether the field is required */
  required?: boolean
  /** Helper text shown below the input */
  helperText?: string
  /** Error message (shows error state when provided) */
  error?: string
  /** Success message */
  success?: string
  /** Children should be the form input */
  children: React.ReactElement<{ className?: string; [key: string]: unknown }>
  /** Additional className for the wrapper */
  className?: string
  /** Hide the label visually (still accessible to screen readers) */
  hideLabel?: boolean
  /** Show character count */
  showCharCount?: boolean
  /** Maximum characters for character count */
  maxLength?: number
  /** Current character count */
  currentLength?: number
}

/**
 * Wrapper component for form inputs with proper accessibility
 *
 * @example
 * ```tsx
 * <FormField
 *   id="email"
 *   label="Email Address"
 *   required
 *   error={errors.email}
 *   helperText="We'll never share your email"
 * >
 *   <Input
 *     id="email"
 *     type="email"
 *     value={email}
 *     onChange={(e) => setEmail(e.target.value)}
 *   />
 * </FormField>
 * ```
 */
export function FormField({
  id,
  label,
  required = false,
  helperText,
  error,
  success,
  children,
  className,
  hideLabel = false,
  showCharCount = false,
  maxLength,
  currentLength = 0,
}: FormFieldProps) {
  const { announceError, announceSuccess } = useLiveRegion()
  const prevErrorRef = React.useRef<string | undefined>(undefined)
  const prevSuccessRef = React.useRef<string | undefined>(undefined)

  // Generate IDs for aria-describedby
  const errorId = `${id}-error`
  const helperId = `${id}-helper`
  const charCountId = `${id}-char-count`

  // Build aria-describedby string
  const describedByParts: string[] = []
  if (error) describedByParts.push(errorId)
  if (helperText && !error) describedByParts.push(helperId)
  if (showCharCount) describedByParts.push(charCountId)
  const ariaDescribedBy = describedByParts.length > 0 ? describedByParts.join(' ') : undefined

  // Announce errors and successes to screen readers
  React.useEffect(() => {
    if (error && error !== prevErrorRef.current) {
      announceError(`${label}: ${error}`)
    }
    prevErrorRef.current = error
  }, [error, label, announceError])

  React.useEffect(() => {
    if (success && success !== prevSuccessRef.current) {
      announceSuccess(`${label}: ${success}`)
    }
    prevSuccessRef.current = success
  }, [success, label, announceSuccess])

  // Clone child with additional accessibility props
  const enhancedChild = React.cloneElement(children, {
    id,
    'aria-invalid': !!error,
    'aria-required': required,
    'aria-describedby': ariaDescribedBy,
    className: cn(
      children.props.className,
      error && 'border-destructive focus-visible:ring-destructive',
      success && 'border-emerald-500 focus-visible:ring-emerald-500'
    ),
  })

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      <label
        htmlFor={id}
        className={cn(
          'block text-sm font-medium',
          error ? 'text-destructive' : 'text-foreground',
          hideLabel && 'sr-only'
        )}
      >
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only">(required)</span>}
      </label>

      {/* Input */}
      {enhancedChild}

      {/* Helper text / Error message / Success message */}
      <div className="flex items-start justify-between gap-2 min-h-[1.25rem]">
        <div className="flex-1">
          {/* Error message */}
          {error && (
            <p
              id={errorId}
              role="alert"
              aria-live="polite"
              className="text-sm text-destructive flex items-center gap-1"
            >
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </p>
          )}

          {/* Success message */}
          {success && !error && (
            <p
              id={`${id}-success`}
              role="status"
              className="text-sm text-emerald-500 flex items-center gap-1"
            >
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>{success}</span>
            </p>
          )}

          {/* Helper text */}
          {helperText && !error && !success && (
            <p
              id={helperId}
              className="text-sm text-muted-foreground"
            >
              {helperText}
            </p>
          )}
        </div>

        {/* Character count */}
        {showCharCount && maxLength && (
          <p
            id={charCountId}
            className={cn(
              'text-xs tabular-nums',
              currentLength > maxLength
                ? 'text-destructive'
                : currentLength > maxLength * 0.9
                ? 'text-amber-500'
                : 'text-muted-foreground'
            )}
            aria-live="polite"
          >
            <span className="sr-only">
              {currentLength} of {maxLength} characters used
            </span>
            <span aria-hidden="true">
              {currentLength}/{maxLength}
            </span>
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Fieldset component for grouping related form fields
 *
 * @example
 * ```tsx
 * <FormFieldset legend="Personal Information" required>
 *   <FormField id="firstName" label="First Name" required>
 *     <Input ... />
 *   </FormField>
 *   <FormField id="lastName" label="Last Name" required>
 *     <Input ... />
 *   </FormField>
 * </FormFieldset>
 * ```
 */
export interface FormFieldsetProps {
  /** Legend text for the fieldset */
  legend: string
  /** Whether all fields in the group are required */
  required?: boolean
  /** Description for the fieldset */
  description?: string
  /** Hide the legend visually */
  hideLegend?: boolean
  /** Children */
  children: React.ReactNode
  /** Additional className */
  className?: string
}

export function FormFieldset({
  legend,
  required,
  description,
  hideLegend = false,
  children,
  className,
}: FormFieldsetProps) {
  return (
    <fieldset className={cn('space-y-4', className)}>
      <legend
        className={cn(
          'text-base font-semibold',
          hideLegend && 'sr-only'
        )}
      >
        {legend}
        {required && (
          <>
            <span className="text-destructive ml-1" aria-hidden="true">
              *
            </span>
            <span className="sr-only">(all fields required)</span>
          </>
        )}
      </legend>
      {description && (
        <p className="text-sm text-muted-foreground -mt-2">
          {description}
        </p>
      )}
      {children}
    </fieldset>
  )
}

/**
 * RadioGroup component with proper accessibility
 */
export interface RadioGroupProps {
  /** Group name for radio inputs */
  name: string
  /** Legend/label for the group */
  legend: string
  /** Radio options */
  options: Array<{
    value: string
    label: string
    description?: string
    disabled?: boolean
  }>
  /** Currently selected value */
  value?: string
  /** Change handler */
  onChange?: (value: string) => void
  /** Error message */
  error?: string
  /** Required */
  required?: boolean
  /** Orientation */
  orientation?: 'horizontal' | 'vertical'
  /** Additional className */
  className?: string
}

export function RadioGroup({
  name,
  legend,
  options,
  value,
  onChange,
  error,
  required,
  orientation = 'vertical',
  className,
}: RadioGroupProps) {
  const groupId = `${name}-group`
  const errorId = `${name}-error`

  return (
    <fieldset
      className={cn('space-y-3', className)}
      aria-describedby={error ? errorId : undefined}
    >
      <legend className="text-sm font-medium">
        {legend}
        {required && (
          <>
            <span className="text-destructive ml-1" aria-hidden="true">
              *
            </span>
            <span className="sr-only">(required)</span>
          </>
        )}
      </legend>

      <div
        role="radiogroup"
        id={groupId}
        aria-label={legend}
        aria-required={required}
        className={cn(
          orientation === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-2'
        )}
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'relative flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-all',
              'hover:bg-accent',
              'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
              value === option.value && 'border-primary bg-primary/5',
              option.disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange?.(e.target.value)}
              disabled={option.disabled}
              className={cn(
                'h-4 w-4 mt-0.5',
                'border-2 border-input',
                'text-primary',
                'focus:ring-primary focus:ring-offset-0',
                'disabled:cursor-not-allowed'
              )}
              aria-describedby={
                option.description ? `${name}-${option.value}-desc` : undefined
              }
            />
            <div className="flex-1">
              <span className="font-medium">{option.label}</span>
              {option.description && (
                <p
                  id={`${name}-${option.value}-desc`}
                  className="text-sm text-muted-foreground mt-0.5"
                >
                  {option.description}
                </p>
              )}
            </div>
          </label>
        ))}
      </div>

      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-sm text-destructive flex items-center gap-1"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </fieldset>
  )
}

export default FormField
