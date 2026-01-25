/**
 * NodeSuggestionCard Component
 *
 * Displays a suggested node (trigger or action) as a clickable card.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import type { NodeSuggestion } from './workflow-creator-types'
import { NODE_CATEGORIES } from './workflow-creator-types'

// ============================================================================
// Types
// ============================================================================

interface NodeSuggestionCardProps {
  suggestion: NodeSuggestion
  onSelect: (suggestion: NodeSuggestion) => void
  selected?: boolean
  compact?: boolean
  className?: string
}

// ============================================================================
// Integration Colors
// ============================================================================

const INTEGRATION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  github: { bg: 'bg-gray-800', text: 'text-white', border: 'border-gray-700' },
  slack: { bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-500' },
  gmail: { bg: 'bg-red-500', text: 'text-white', border: 'border-red-400' },
  sheets: { bg: 'bg-green-600', text: 'text-white', border: 'border-green-500' },
  calendar: { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-400' },
  notion: { bg: 'bg-gray-900', text: 'text-white', border: 'border-gray-800' },
  trello: { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-500' },
  ai: { bg: 'bg-gradient-to-r from-cyan-500 to-blue-500', text: 'text-white', border: 'border-cyan-400' },
  webhook: { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-400' },
  schedule: { bg: 'bg-indigo-500', text: 'text-white', border: 'border-indigo-400' },
  twitter: { bg: 'bg-sky-500', text: 'text-white', border: 'border-sky-400' },
  stripe: { bg: 'bg-violet-600', text: 'text-white', border: 'border-violet-500' },
  crm: { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-500' },
  forms: { bg: 'bg-pink-500', text: 'text-white', border: 'border-pink-400' },
  tasks: { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-400' },
  http: { bg: 'bg-gray-600', text: 'text-white', border: 'border-gray-500' },
  system: { bg: 'bg-slate-600', text: 'text-white', border: 'border-slate-500' },
}

const DEFAULT_COLORS = { bg: 'bg-muted', text: 'text-foreground', border: 'border-border' }

// ============================================================================
// Component
// ============================================================================

export function NodeSuggestionCard({
  suggestion,
  onSelect,
  selected = false,
  compact = false,
  className,
}: NodeSuggestionCardProps) {
  const colors = suggestion.integration
    ? INTEGRATION_COLORS[suggestion.integration] || DEFAULT_COLORS
    : DEFAULT_COLORS

  const isTrigger = suggestion.category === NODE_CATEGORIES.TRIGGER

  const handleClick = React.useCallback(() => {
    onSelect(suggestion)
  }, [onSelect, suggestion])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onSelect(suggestion)
      }
    },
    [onSelect, suggestion]
  )

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
          'hover:scale-[1.02] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          selected
            ? 'border-primary bg-primary/10 shadow-md'
            : 'border-border bg-card hover:border-primary/50',
          className
        )}
      >
        <span className="text-lg">{suggestion.icon}</span>
        <span className="text-sm font-medium truncate">{suggestion.name}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'group relative flex flex-col p-4 rounded-xl border transition-all',
        'hover:scale-[1.02] hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected
          ? 'border-primary bg-primary/10 shadow-lg ring-2 ring-primary/20'
          : 'border-border bg-card hover:border-primary/50 hover:bg-card/80',
        className
      )}
    >
      {/* Category Badge */}
      <div className="absolute top-2 right-2">
        <span
          className={cn(
            'text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full',
            isTrigger
              ? 'bg-cyan-500/20 text-cyan-400'
              : 'bg-purple-500/20 text-purple-400'
          )}
        >
          {isTrigger ? 'Trigger' : 'Action'}
        </span>
      </div>

      {/* Icon */}
      <div
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3',
          colors.bg,
          colors.border,
          'border shadow-sm'
        )}
      >
        {suggestion.icon}
      </div>

      {/* Name */}
      <h4 className="text-sm font-semibold text-foreground mb-1 text-left">
        {suggestion.name}
      </h4>

      {/* Description */}
      <p className="text-xs text-muted-foreground text-left line-clamp-2">
        {suggestion.description}
      </p>

      {/* Integration Tag */}
      {suggestion.integration && (
        <div className="mt-3 flex items-center gap-1.5">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              colors.bg
            )}
          />
          <span className="text-[10px] text-muted-foreground capitalize">
            {suggestion.integration}
          </span>
        </div>
      )}

      {/* Confidence Indicator */}
      {suggestion.confidence > 0.7 && (
        <div className="absolute bottom-2 right-2">
          <span className="text-[10px] text-emerald-400 font-medium">
            Best match
          </span>
        </div>
      )}

      {/* Hover Effect */}
      <div
        className={cn(
          'absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none',
          'bg-gradient-to-br from-primary/5 to-transparent'
        )}
      />
    </button>
  )
}

// ============================================================================
// Grid Component for Multiple Suggestions
// ============================================================================

interface NodeSuggestionGridProps {
  suggestions: NodeSuggestion[]
  onSelect: (suggestion: NodeSuggestion) => void
  selectedId?: string
  compact?: boolean
  columns?: 2 | 3 | 4
  className?: string
}

export function NodeSuggestionGrid({
  suggestions,
  onSelect,
  selectedId,
  compact = false,
  columns = 3,
  className,
}: NodeSuggestionGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No suggestions available</p>
      </div>
    )
  }

  return (
    <div className={cn('grid gap-3', gridCols[columns], className)}>
      {suggestions.map((suggestion) => (
        <NodeSuggestionCard
          key={`${suggestion.integration}-${suggestion.nodeType}`}
          suggestion={suggestion}
          onSelect={onSelect}
          selected={selectedId === `${suggestion.integration}-${suggestion.nodeType}`}
          compact={compact}
        />
      ))}
    </div>
  )
}

// ============================================================================
// Horizontal Scroll List for Compact Display
// ============================================================================

interface NodeSuggestionListProps {
  suggestions: NodeSuggestion[]
  onSelect: (suggestion: NodeSuggestion) => void
  selectedId?: string
  className?: string
}

export function NodeSuggestionList({
  suggestions,
  onSelect,
  selectedId,
  className,
}: NodeSuggestionListProps) {
  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted',
        className
      )}
    >
      {suggestions.map((suggestion) => (
        <NodeSuggestionCard
          key={`${suggestion.integration}-${suggestion.nodeType}`}
          suggestion={suggestion}
          onSelect={onSelect}
          selected={selectedId === `${suggestion.integration}-${suggestion.nodeType}`}
          compact
          className="flex-shrink-0"
        />
      ))}
    </div>
  )
}
