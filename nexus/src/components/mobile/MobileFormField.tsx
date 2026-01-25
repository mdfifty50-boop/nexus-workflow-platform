import * as React from 'react'
import { cn } from '@/lib/utils'
import { Input, type InputProps } from '@/components/ui/input'

export interface MobileFormFieldProps extends Omit<InputProps, 'inputSize'> {
  /** Label text for the field */
  label: string
  /** Optional hint text shown below the label */
  hint?: string
  /** Error message to display */
  error?: string
  /** Whether the field is required */
  required?: boolean
  /** Label style: 'floating' shows label above when focused or has value, 'top' always shows above */
  labelStyle?: 'floating' | 'top'
  /** Additional class names for the wrapper */
  wrapperClassName?: string
  /** Show character count (requires maxLength to be set) */
  showCharCount?: boolean
}

/**
 * MobileFormField - A mobile-optimized form field wrapper
 *
 * Features:
 * - Floating or top labels that don't overlap with input
 * - Larger touch targets (48px minimum height)
 * - Inline error display without scroll jumping
 * - Clear button support
 * - Character count display
 * - Proper inputMode and autocomplete attributes (inherited from Input)
 * - Accessible with proper label association
 */
export const MobileFormField = React.forwardRef<HTMLInputElement, MobileFormFieldProps>(
  ({
    label,
    hint,
    error,
    required = false,
    labelStyle = 'top',
    wrapperClassName,
    showCharCount = false,
    maxLength,
    value,
    className,
    id,
    ...props
  }, ref) => {
    const inputId = id || React.useId()
    const errorId = `${inputId}-error`
    const hintId = `${inputId}-hint`

    const [isFocused, setIsFocused] = React.useState(false)
    const hasValue = value !== undefined && value !== '' && value !== null
    const valueLength = typeof value === 'string' ? value.length : 0

    // Determine if label should be raised (floating style)
    const isLabelRaised = labelStyle === 'top' || isFocused || hasValue

    // Build aria-describedby
    const describedBy = [
      hint && !error ? hintId : null,
      error ? errorId : null,
    ].filter(Boolean).join(' ') || undefined

    return (
      <div className={cn('relative', wrapperClassName)}>
        {/* Top Label Style */}
        {labelStyle === 'top' && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground mb-2"
          >
            {label}
            {required && <span className="text-destructive ml-0.5" aria-hidden="true">*</span>}
            {!required && hint && (
              <span className="text-muted-foreground font-normal ml-1">({hint})</span>
            )}
          </label>
        )}

        {/* Floating Label Container */}
        <div className="relative">
          {/* Floating Label Style */}
          {labelStyle === 'floating' && (
            <label
              htmlFor={inputId}
              className={cn(
                'absolute left-3 transition-all duration-200 pointer-events-none z-10',
                isLabelRaised
                  ? '-top-2 text-xs bg-background px-1 font-medium text-primary'
                  : 'top-1/2 -translate-y-1/2 text-base text-muted-foreground'
              )}
            >
              {label}
              {required && <span className="text-destructive ml-0.5" aria-hidden="true">*</span>}
            </label>
          )}

          <Input
            ref={ref}
            id={inputId}
            inputSize="mobile"
            clearable
            value={value}
            maxLength={maxLength}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            aria-required={required}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            className={cn(
              'transition-all',
              labelStyle === 'floating' && 'pt-4 pb-2',
              error && 'border-destructive focus-visible:ring-destructive',
              className
            )}
            {...props}
          />
        </div>

        {/* Bottom Row: Error/Hint and Character Count */}
        <div className="flex justify-between items-start mt-1.5 min-h-[20px]">
          <div className="flex-1">
            {/* Error Message - Inline, no scroll jumping */}
            {error && (
              <p
                id={errorId}
                role="alert"
                className="text-sm text-destructive flex items-center gap-1.5 animate-in fade-in duration-200"
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
                {error}
              </p>
            )}

            {/* Hint (only shown when no error, for top label style) */}
            {!error && hint && labelStyle !== 'top' && (
              <p
                id={hintId}
                className="text-xs text-muted-foreground"
              >
                {hint}
              </p>
            )}
          </div>

          {/* Character Count */}
          {showCharCount && maxLength && (
            <span
              className={cn(
                'text-xs tabular-nums',
                valueLength >= maxLength
                  ? 'text-destructive'
                  : valueLength >= maxLength * 0.8
                  ? 'text-amber-500'
                  : 'text-muted-foreground'
              )}
            >
              {valueLength}/{maxLength}
            </span>
          )}
        </div>
      </div>
    )
  }
)

MobileFormField.displayName = 'MobileFormField'

// Re-export common input types for convenience
export type { InputProps }
