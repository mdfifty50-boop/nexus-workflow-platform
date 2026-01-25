import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Show a clear button when input has value */
  clearable?: boolean
  /** Callback when clear button is clicked */
  onClear?: () => void
  /** Input variant for different sizing */
  inputSize?: "default" | "mobile"
}

/**
 * Get appropriate inputMode based on input type
 */
function getInputMode(type: string | undefined): React.HTMLAttributes<HTMLInputElement>['inputMode'] {
  switch (type) {
    case 'email':
      return 'email'
    case 'tel':
      return 'tel'
    case 'number':
      return 'numeric'
    case 'url':
      return 'url'
    case 'search':
      return 'search'
    default:
      return undefined
  }
}

/**
 * Get appropriate autocomplete attribute based on input type and name
 */
function getAutoComplete(
  type: string | undefined,
  name: string | undefined,
  autoComplete: string | undefined
): string | undefined {
  // If explicitly set, use that value
  if (autoComplete) return autoComplete

  // Auto-detect based on type
  switch (type) {
    case 'email':
      return 'email'
    case 'tel':
      return 'tel'
    case 'password':
      return 'current-password'
    case 'url':
      return 'url'
    default:
      break
  }

  // Auto-detect based on common field names
  const nameLower = name?.toLowerCase() || ''
  if (nameLower.includes('name') && nameLower.includes('first')) return 'given-name'
  if (nameLower.includes('name') && nameLower.includes('last')) return 'family-name'
  if (nameLower.includes('name') && nameLower.includes('full')) return 'name'
  if (nameLower.includes('company') || nameLower.includes('organization')) return 'organization'
  if (nameLower.includes('address')) return 'street-address'
  if (nameLower.includes('city')) return 'address-level2'
  if (nameLower.includes('zip') || nameLower.includes('postal')) return 'postal-code'
  if (nameLower.includes('country')) return 'country-name'

  return undefined
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type,
    name,
    autoComplete,
    inputMode: inputModeProp,
    clearable,
    onClear,
    inputSize = "default",
    value,
    onChange,
    ...props
  }, ref) => {
    const [internalValue, setInternalValue] = React.useState('')

    // Use controlled value if provided, otherwise internal state
    const displayValue = value !== undefined ? value : internalValue
    const hasValue = displayValue !== '' && displayValue !== undefined && displayValue !== null

    // Determine inputMode (explicit prop takes precedence)
    const computedInputMode = inputModeProp || getInputMode(type)

    // Determine autoComplete
    const computedAutoComplete = getAutoComplete(type, name, autoComplete)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (value === undefined) {
        setInternalValue(e.target.value)
      }
      onChange?.(e)
    }

    const handleClear = () => {
      if (value === undefined) {
        setInternalValue('')
      }
      onClear?.()
    }

    // Size classes for mobile-friendly inputs
    const sizeClasses = inputSize === "mobile"
      ? "h-12 text-base px-4 py-3" // Larger touch targets for mobile
      : "h-10 text-sm px-3 py-2"   // Default size

    // If clearable, wrap in a relative container
    if (clearable) {
      return (
        <div className="relative">
          <input
            type={type}
            name={name}
            inputMode={computedInputMode}
            autoComplete={computedAutoComplete}
            className={cn(
              "flex w-full rounded-md border border-input bg-input ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
              sizeClasses,
              // Add padding for clear button
              hasValue && "pr-10",
              className
            )}
            ref={ref}
            value={displayValue}
            onChange={handleChange}
            {...props}
          />
          {hasValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Clear input"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      )
    }

    return (
      <input
        type={type}
        name={name}
        inputMode={computedInputMode}
        autoComplete={computedAutoComplete}
        className={cn(
          "flex w-full rounded-md border border-input bg-input ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
          sizeClasses,
          className
        )}
        ref={ref}
        value={value}
        onChange={onChange}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"

export { Input }
