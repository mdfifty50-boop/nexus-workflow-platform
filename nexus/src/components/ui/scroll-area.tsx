/**
 * ScrollArea Component
 *
 * A scrollable container with custom scrollbar styling.
 * Based on shadcn/ui scroll-area pattern.
 */

import * as React from 'react'

// ============================================================================
// Types
// ============================================================================

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'vertical' | 'horizontal' | 'both'
}

// ============================================================================
// ScrollArea Component
// ============================================================================

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className = '', orientation = 'vertical', children, ...props }, ref) => {
    const scrollClasses = {
      vertical: 'overflow-y-auto overflow-x-hidden',
      horizontal: 'overflow-x-auto overflow-y-hidden',
      both: 'overflow-auto',
    }

    return (
      <div
        ref={ref}
        className={`
          relative
          ${scrollClasses[orientation]}
          scrollbar-thin
          scrollbar-track-slate-800
          scrollbar-thumb-slate-600
          hover:scrollbar-thumb-slate-500
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ScrollArea.displayName = 'ScrollArea'

// ============================================================================
// ScrollBar Component (for custom scrollbar styling)
// ============================================================================

interface ScrollBarProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'vertical' | 'horizontal'
}

const ScrollBar = React.forwardRef<HTMLDivElement, ScrollBarProps>(
  ({ className = '', orientation = 'vertical', ...props }, ref) => {
    const orientationClasses =
      orientation === 'vertical'
        ? 'h-full w-2.5 border-l border-l-transparent p-[1px]'
        : 'h-2.5 flex-col border-t border-t-transparent p-[1px]'

    return (
      <div
        ref={ref}
        className={`
          flex touch-none select-none transition-colors
          ${orientationClasses}
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        {...props}
      />
    )
  }
)

ScrollBar.displayName = 'ScrollBar'

// ============================================================================
// Exports
// ============================================================================

export { ScrollArea, ScrollBar }
export type { ScrollAreaProps, ScrollBarProps }
