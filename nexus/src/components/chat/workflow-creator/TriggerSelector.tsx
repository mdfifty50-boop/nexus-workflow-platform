/**
 * TriggerSelector Component
 *
 * Allows users to select a trigger for their workflow through a chat-friendly interface.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { TriggerNode, NodeSuggestion } from './workflow-creator-types'
import { NODE_CATEGORIES } from './workflow-creator-types'
import { NodeSuggestionGrid } from './NodeSuggestionCard'
import {
  PRESET_TRIGGERS,
  getPopularTriggers,
  getTriggersByIntegration,
  searchTriggers,
  getTriggerIntegrations,
} from './workflow-presets'

// ============================================================================
// Types
// ============================================================================

interface TriggerSelectorProps {
  onSelect: (trigger: TriggerNode) => void
  selectedTrigger?: TriggerNode
  className?: string
}

// ============================================================================
// Integration Icons
// ============================================================================

const INTEGRATION_ICONS: Record<string, { icon: string; label: string }> = {
  github: { icon: '🐙', label: 'GitHub' },
  slack: { icon: '💬', label: 'Slack' },
  gmail: { icon: '📧', label: 'Gmail' },
  calendar: { icon: '📅', label: 'Calendar' },
  schedule: { icon: '🔄', label: 'Schedule' },
  webhook: { icon: '🔗', label: 'Webhook' },
  forms: { icon: '📋', label: 'Forms' },
  crm: { icon: '👤', label: 'CRM' },
  stripe: { icon: '💳', label: 'Stripe' },
}

// ============================================================================
// Component
// ============================================================================

export function TriggerSelector({
  onSelect,
  selectedTrigger,
  className,
}: TriggerSelectorProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedIntegration, setSelectedIntegration] = React.useState<string | null>(null)
  const [showAllIntegrations, setShowAllIntegrations] = React.useState(false)

  // Get available integrations
  const allIntegrations = getTriggerIntegrations()
  const visibleIntegrations = showAllIntegrations
    ? allIntegrations
    : allIntegrations.slice(0, 6)

  // Get triggers to display
  const displayTriggers = React.useMemo(() => {
    if (searchQuery) {
      return searchTriggers(searchQuery)
    }
    if (selectedIntegration) {
      return getTriggersByIntegration(selectedIntegration)
    }
    return getPopularTriggers()
  }, [searchQuery, selectedIntegration])

  // Convert presets to suggestions for the grid
  const suggestions: NodeSuggestion[] = displayTriggers.map((trigger) => ({
    nodeType: trigger.type,
    name: trigger.name,
    description: trigger.description,
    icon: trigger.icon,
    category: NODE_CATEGORIES.TRIGGER,
    confidence: trigger.popular ? 0.8 : 0.5,
    integration: trigger.integration,
  }))

  // Handle trigger selection
  const handleSelect = React.useCallback(
    (suggestion: NodeSuggestion) => {
      const preset = PRESET_TRIGGERS.find(
        (t) => t.integration === suggestion.integration && t.type === suggestion.nodeType
      )
      if (preset) {
        const trigger: TriggerNode = {
          id: `trigger-${Date.now()}`,
          type: preset.type,
          name: preset.name,
          icon: preset.icon,
          integration: preset.integration,
          config: {},
          description: preset.description,
        }
        onSelect(trigger)
      }
    },
    [onSelect]
  )

  // Handle integration filter click
  const handleIntegrationClick = React.useCallback((integration: string) => {
    setSelectedIntegration((prev) => (prev === integration ? null : integration))
    setSearchQuery('')
  }, [])

  // Handle search input
  const handleSearchChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value)
      setSelectedIntegration(null)
    },
    []
  )

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-1">What should trigger this workflow?</h3>
        <p className="text-sm text-muted-foreground">
          Choose an event that will start your automation
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Input
          type="search"
          placeholder="Search triggers... (e.g., 'email received', 'new issue')"
          value={searchQuery}
          onChange={handleSearchChange}
          className="pl-10"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Integration Filters */}
      <div className="flex flex-wrap gap-2">
        {visibleIntegrations.map((integration) => {
          const info = INTEGRATION_ICONS[integration] || { icon: '🔌', label: integration }
          const isSelected = selectedIntegration === integration
          return (
            <button
              key={integration}
              type="button"
              onClick={() => handleIntegrationClick(integration)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                'border hover:scale-105',
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/50 text-muted-foreground border-transparent hover:border-primary/50'
              )}
            >
              <span>{info.icon}</span>
              <span>{info.label}</span>
            </button>
          )
        })}
        {allIntegrations.length > 6 && (
          <button
            type="button"
            onClick={() => setShowAllIntegrations(!showAllIntegrations)}
            className="px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAllIntegrations ? 'Show less' : `+${allIntegrations.length - 6} more`}
          </button>
        )}
      </div>

      {/* Trigger Grid */}
      <ScrollArea className="max-h-[400px]">
        {suggestions.length > 0 ? (
          <NodeSuggestionGrid
            suggestions={suggestions}
            onSelect={handleSelect}
            selectedId={
              selectedTrigger
                ? `${selectedTrigger.integration}-${selectedTrigger.type}`
                : undefined
            }
            columns={3}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              No triggers found for "{searchQuery}"
            </p>
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setSelectedIntegration(null)
              }}
            >
              Clear search
            </Button>
          </div>
        )}
      </ScrollArea>

      {/* Quick Action Buttons */}
      <div className="flex gap-2 pt-2 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedIntegration(null)
            setSearchQuery('')
          }}
          className="flex-1"
        >
          <span className="mr-1">🔄</span>
          Show Popular
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleIntegrationClick('webhook')}
          className="flex-1"
        >
          <span className="mr-1">🔗</span>
          Custom Webhook
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleIntegrationClick('schedule')}
          className="flex-1"
        >
          <span className="mr-1">⏰</span>
          Schedule
        </Button>
      </div>

      {/* Selected Trigger Preview */}
      {selectedTrigger && (
        <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl">
              {selectedTrigger.icon}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{selectedTrigger.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {selectedTrigger.integration}
              </p>
            </div>
            <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
              Selected
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Compact Trigger Selector for Inline Use
// ============================================================================

interface CompactTriggerSelectorProps {
  onSelect: (trigger: TriggerNode) => void
  className?: string
}

export function CompactTriggerSelector({
  onSelect,
  className,
}: CompactTriggerSelectorProps) {
  const popularTriggers = getPopularTriggers().slice(0, 4)

  const suggestions: NodeSuggestion[] = popularTriggers.map((trigger) => ({
    nodeType: trigger.type,
    name: trigger.name,
    description: trigger.description,
    icon: trigger.icon,
    category: NODE_CATEGORIES.TRIGGER,
    confidence: 0.8,
    integration: trigger.integration,
  }))

  const handleSelect = React.useCallback(
    (suggestion: NodeSuggestion) => {
      const preset = PRESET_TRIGGERS.find(
        (t) => t.integration === suggestion.integration && t.type === suggestion.nodeType
      )
      if (preset) {
        const trigger: TriggerNode = {
          id: `trigger-${Date.now()}`,
          type: preset.type,
          name: preset.name,
          icon: preset.icon,
          integration: preset.integration,
          config: {},
          description: preset.description,
        }
        onSelect(trigger)
      }
    },
    [onSelect]
  )

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {suggestions.map((suggestion) => (
        <button
          key={`${suggestion.integration}-${suggestion.nodeType}`}
          type="button"
          onClick={() => handleSelect(suggestion)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-card/80 transition-all"
        >
          <span className="text-lg">{suggestion.icon}</span>
          <span className="text-sm font-medium">{suggestion.name}</span>
        </button>
      ))}
    </div>
  )
}
