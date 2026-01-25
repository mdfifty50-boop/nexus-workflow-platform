import { useState, type ReactNode } from 'react'
import { Tooltip, InfoTooltip } from './Tooltip'

// =============================================================================
// HELP TOOLTIP SYSTEM
// =============================================================================
// Provides contextual help through info icons with tooltips.
// Used throughout the UI to explain complex features without cluttering the interface.
// =============================================================================

interface HelpTooltipProps {
  /** The help text to display */
  content: ReactNode
  /** Optional title for the tooltip */
  title?: string
  /** Position of the tooltip relative to the icon */
  position?: 'top' | 'bottom' | 'left' | 'right'
  /** Icon style variant */
  variant?: 'default' | 'subtle' | 'highlighted'
  /** Additional CSS classes */
  className?: string
}

/**
 * Enhanced help tooltip with optional title and styling variants.
 * Use this component to add contextual help to complex UI elements.
 */
export function HelpTooltip({
  content,
  title,
  position = 'top',
  variant = 'default',
  className = ''
}: HelpTooltipProps) {
  const variantStyles = {
    default: 'text-slate-400 bg-slate-700 hover:bg-slate-600',
    subtle: 'text-muted-foreground bg-transparent hover:bg-muted/50',
    highlighted: 'text-primary bg-primary/10 hover:bg-primary/20'
  }

  const tooltipContent = title ? (
    <div className="space-y-1">
      <div className="font-semibold text-white">{title}</div>
      <div className="text-slate-300">{content}</div>
    </div>
  ) : content

  return (
    <Tooltip content={tooltipContent} position={position} className={className}>
      <span
        className={`
          inline-flex items-center justify-center w-4 h-4 text-xs rounded-full
          cursor-help transition-colors ${variantStyles[variant]}
        `}
        aria-label="Help information"
      >
        ?
      </span>
    </Tooltip>
  )
}

// Re-export InfoTooltip for convenience
export { InfoTooltip }

// =============================================================================
// CONTEXTUAL HELP FOR WORKFLOW BUILDER
// =============================================================================

interface WorkflowFieldHelpProps {
  field: 'trigger' | 'action' | 'condition' | 'variable' | 'prompt' | 'model' | 'api' | 'transform'
}

const FIELD_HELP: Record<WorkflowFieldHelpProps['field'], { title: string; content: string }> = {
  trigger: {
    title: 'Workflow Trigger',
    content: 'The event that starts your workflow. Can be scheduled, webhook-based, or manual.'
  },
  action: {
    title: 'Workflow Action',
    content: 'An operation performed by the workflow, such as sending an email or calling an API.'
  },
  condition: {
    title: 'Condition Node',
    content: 'Routes the workflow based on data conditions. Uses JavaScript expressions to evaluate.'
  },
  variable: {
    title: 'Variables',
    content: 'Store and reference data between steps. Use {{variable_name}} syntax to access.'
  },
  prompt: {
    title: 'AI Prompt',
    content: 'Instructions for the AI agent. Be specific about the task, format, and expected output.'
  },
  model: {
    title: 'AI Model',
    content: 'The AI model to use. Claude Sonnet is recommended for most tasks. Opus for complex reasoning.'
  },
  api: {
    title: 'API Endpoint',
    content: 'The URL to call. Supports GET, POST, PUT, DELETE methods. Use variables in the URL.'
  },
  transform: {
    title: 'Data Transform',
    content: 'JavaScript code to transform data. Input is available as "input" variable.'
  }
}

/**
 * Pre-configured help tooltip for workflow builder fields.
 */
export function WorkflowFieldHelp({ field }: WorkflowFieldHelpProps) {
  const help = FIELD_HELP[field]
  return (
    <HelpTooltip
      title={help.title}
      content={help.content}
      position="right"
      variant="subtle"
    />
  )
}

// =============================================================================
// INLINE HELP LINK
// =============================================================================

interface LearnMoreLinkProps {
  /** Topic identifier for the help article */
  topic: string
  /** Custom link text */
  text?: string
  className?: string
}

/**
 * "Learn more" link that opens help documentation.
 */
export function LearnMoreLink({ topic, text = 'Learn more', className = '' }: LearnMoreLinkProps) {
  return (
    <a
      href={`/help?topic=${topic}`}
      className={`
        text-sm text-primary hover:text-primary/80 underline-offset-2
        hover:underline transition-colors ${className}
      `}
      target="_blank"
      rel="noopener noreferrer"
    >
      {text}
      <svg
        className="w-3 h-3 ml-1 inline-block"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
    </a>
  )
}

// =============================================================================
// HELP POPOVER (For longer content)
// =============================================================================

interface HelpPopoverProps {
  title: string
  children: ReactNode
  trigger?: ReactNode
  className?: string
}

/**
 * A popover-style help component for longer explanations.
 * Supports rich content including images and code examples.
 */
export function HelpPopover({ title, children, trigger, className = '' }: HelpPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center w-5 h-5 text-xs text-muted-foreground bg-muted rounded-full hover:bg-muted/80 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        {trigger || '?'}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Popover */}
          <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-80 max-w-[90vw]">
            <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-4 bg-muted/50 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold">{title}</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="min-w-[44px] min-h-[44px] p-1 hover:bg-muted rounded-lg transition-colors flex items-center justify-center touch-manipulation active:scale-95"
                  aria-label="Close"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4 text-sm text-muted-foreground space-y-2">
                {children}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// =============================================================================
// FIELD LABEL WITH HELP
// =============================================================================

interface LabelWithHelpProps {
  label: string
  helpContent: ReactNode
  helpTitle?: string
  required?: boolean
  htmlFor?: string
}

/**
 * Form field label with integrated help tooltip.
 */
export function LabelWithHelp({
  label,
  helpContent,
  helpTitle,
  required = false,
  htmlFor
}: LabelWithHelpProps) {
  return (
    <label htmlFor={htmlFor} className="flex items-center gap-2 text-sm font-medium">
      {label}
      {required && <span className="text-red-500">*</span>}
      <HelpTooltip content={helpContent} title={helpTitle} variant="subtle" />
    </label>
  )
}
