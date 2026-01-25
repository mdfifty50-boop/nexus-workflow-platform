/**
 * UX IMPROVEMENT #4: Enhanced form input with validation feedback
 * Clear visual states for validation, focus, and errors
 */

import { useState, forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  success?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      error,
      helperText,
      success,
      leftIcon,
      rightIcon,
      className,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false)

    const hasError = !!error
    const showSuccess = success && !hasError

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id}
            className={cn(
              'block text-sm font-medium mb-2 transition-colors',
              hasError
                ? 'text-red-500'
                : showSuccess
                ? 'text-emerald-500'
                : isFocused
                ? 'text-primary'
                : 'text-foreground'
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            disabled={disabled}
            className={cn(
              'w-full px-4 py-3 rounded-lg border-2 transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'placeholder:text-muted-foreground/50',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              hasError
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 bg-red-500/5'
                : showSuccess
                ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20 bg-emerald-500/5'
                : 'border-border focus:border-primary focus:ring-primary/20 bg-background',
              className
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />

          {/* Success checkmark */}
          {showSuccess && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 animate-scale-in">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}

          {/* Error icon */}
          {hasError && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 animate-shake">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          )}

          {rightIcon && !hasError && !showSuccess && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Helper text or error message */}
        {(error || helperText) && (
          <p
            className={cn(
              'text-sm mt-2 transition-colors',
              hasError ? 'text-red-500 font-medium' : 'text-muted-foreground'
            )}
            role={hasError ? 'alert' : undefined}
          >
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'

// Textarea variant
export interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  maxLength?: number
  showCount?: boolean
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  (
    {
      label,
      error,
      helperText,
      maxLength,
      showCount = true,
      className,
      disabled,
      required,
      value,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false)
    const currentLength = String(value || '').length

    const hasError = !!error

    return (
      <div className="w-full">
        {label && (
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor={props.id}
              className={cn(
                'block text-sm font-medium transition-colors',
                hasError
                  ? 'text-red-500'
                  : isFocused
                  ? 'text-primary'
                  : 'text-foreground'
              )}
            >
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {showCount && maxLength && (
              <span
                className={cn(
                  'text-xs transition-colors',
                  currentLength > maxLength
                    ? 'text-red-500 font-medium'
                    : 'text-muted-foreground'
                )}
              >
                {currentLength}/{maxLength}
              </span>
            )}
          </div>
        )}

        <textarea
          ref={ref}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          className={cn(
            'w-full px-4 py-3 rounded-lg border-2 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'placeholder:text-muted-foreground/50',
            'resize-none',
            hasError
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 bg-red-500/5'
              : 'border-border focus:border-primary focus:ring-primary/20 bg-background',
            className
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {(error || helperText) && (
          <p
            className={cn(
              'text-sm mt-2 transition-colors',
              hasError ? 'text-red-500 font-medium' : 'text-muted-foreground'
            )}
            role={hasError ? 'alert' : undefined}
          >
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)

FormTextarea.displayName = 'FormTextarea'
