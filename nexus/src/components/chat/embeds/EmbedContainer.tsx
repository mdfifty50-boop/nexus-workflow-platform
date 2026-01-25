import React, { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { EmbedContainerProps } from './embed-types'

/**
 * EmbedContainer - Generic wrapper for all embed types
 * Provides consistent styling, loading states, error states, and interaction handling
 */
export function EmbedContainer({
  children,
  className,
  isLoading = false,
  isError = false,
  errorMessage,
  onClick,
  onDoubleClick,
  hoverActions,
}: EmbedContainerProps) {
  const [showActions, setShowActions] = useState(false)

  const handleClick = useCallback((e: React.MouseEvent) => {
    // Prevent triggering if clicking on action buttons
    if ((e.target as HTMLElement).closest('[data-embed-action]')) {
      return
    }
    onClick?.()
  }, [onClick])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-embed-action]')) {
      return
    }
    onDoubleClick?.()
  }, [onDoubleClick])

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          'relative max-w-[400px] w-full rounded-xl border border-border bg-card',
          'shadow-sm overflow-hidden',
          className
        )}
      >
        <div className="p-4 space-y-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
          </div>
          <div className="h-16 rounded-lg bg-muted" />
          <div className="flex gap-2">
            <div className="h-8 w-20 rounded bg-muted" />
            <div className="h-8 w-20 rounded bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div
        className={cn(
          'relative max-w-[400px] w-full rounded-xl border border-destructive/50 bg-destructive/5',
          'shadow-sm overflow-hidden',
          className
        )}
      >
        <div className="p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-destructive">Failed to load preview</p>
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {errorMessage || 'An unexpected error occurred'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative max-w-[400px] w-full rounded-xl border border-border bg-card',
        'shadow-sm hover:shadow-md transition-all duration-200',
        'hover:border-primary/30 cursor-pointer',
        'dark:bg-card/80 dark:backdrop-blur-sm',
        className
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {children}

      {/* Hover actions overlay */}
      {hoverActions && (
        <div
          className={cn(
            'absolute top-2 right-2 flex gap-1 transition-opacity duration-150',
            showActions ? 'opacity-100' : 'opacity-0'
          )}
          data-embed-action
        >
          {hoverActions}
        </div>
      )}
    </div>
  )
}

/**
 * EmbedActionButton - Small action button for embed hover state
 */
export interface EmbedActionButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  variant?: 'default' | 'destructive'
}

export function EmbedActionButton({
  icon,
  label,
  onClick,
  variant = 'default',
}: EmbedActionButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      title={label}
      data-embed-action
      className={cn(
        'p-1.5 rounded-lg transition-colors',
        'backdrop-blur-sm',
        variant === 'default'
          ? 'bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground'
          : 'bg-destructive/10 hover:bg-destructive/20 text-destructive'
      )}
    >
      {icon}
    </button>
  )
}

/**
 * EmbedSection - Collapsible section within an embed
 */
export interface EmbedSectionProps {
  title: string
  children: React.ReactNode
  defaultExpanded?: boolean
  className?: string
}

export function EmbedSection({
  title,
  children,
  defaultExpanded = false,
  className,
}: EmbedSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div className={cn('border-t border-border', className)}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setExpanded(!expanded)
        }}
        className="w-full px-4 py-2 flex items-center justify-between text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
        data-embed-action
      >
        <span>{title}</span>
        <svg
          className={cn(
            'w-4 h-4 transition-transform duration-200',
            expanded && 'rotate-180'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          expanded ? 'max-h-96' : 'max-h-0'
        )}
      >
        <div className="px-4 pb-3">
          {children}
        </div>
      </div>
    </div>
  )
}
