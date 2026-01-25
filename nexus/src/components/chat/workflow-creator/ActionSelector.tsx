/**
 * ActionSelector Component
 *
 * Allows users to select and add actions to their workflow.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ActionNode, NodeSuggestion } from './workflow-creator-types'
import { NODE_CATEGORIES } from './workflow-creator-types'
import { NodeSuggestionGrid, NodeSuggestionList } from './NodeSuggestionCard'
import {
  PRESET_ACTIONS,
  getPopularActions,
  getActionsByIntegration,
  searchActions,
  getActionIntegrations,
} from './workflow-presets'

// ============================================================================
// Types
// ============================================================================

interface ActionSelectorProps {
  onSelect: (action: Omit<ActionNode, 'id' | 'order'>) => void
  selectedActions?: ActionNode[]
  contextSuggestions?: NodeSuggestion[]
  className?: string
}

// ============================================================================
// Integration Icons
// ============================================================================

const INTEGRATION_ICONS: Record<string, { icon: string; label: string }> = {
  slack: { icon: '💬', label: 'Slack' },
  gmail: { icon: '📧', label: 'Email' },
  sheets: { icon: '📊', label: 'Sheets' },
  notion: { icon: '📝', label: 'Notion' },
  trello: { icon: '🗂️', label: 'Trello' },
  tasks: { icon: '✅', label: 'Tasks' },
  ai: { icon: '🤖', label: 'AI' },
  twitter: { icon: '🐦', label: 'X/Twitter' },
  http: { icon: '🌐', label: 'HTTP' },
  system: { icon: '⚙️', label: 'System' },
}

// ============================================================================
// Action Category Groups
// ============================================================================

const ACTION_CATEGORIES = [
  { id: 'communication', label: 'Communication', integrations: ['slack', 'gmail'] },
  { id: 'productivity', label: 'Productivity', integrations: ['notion', 'trello', 'sheets', 'tasks'] },
  { id: 'ai', label: 'AI & Automation', integrations: ['ai'] },
  { id: 'social', label: 'Social Media', integrations: ['twitter'] },
  { id: 'other', label: 'Other', integrations: ['http', 'system'] },
]

// ============================================================================
// Component
// ============================================================================

export function ActionSelector({
  onSelect,
  selectedActions = [],
  contextSuggestions,
  className,
}: ActionSelectorProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedIntegration, setSelectedIntegration] = React.useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null)

  // Get available integrations
  const allIntegrations = getActionIntegrations()

  // Get actions to display
  const displayActions = React.useMemo(() => {
    if (searchQuery) {
      return searchActions(searchQuery)
    }
    if (selectedIntegration) {
      return getActionsByIntegration(selectedIntegration)
    }
    if (selectedCategory) {
      const category = ACTION_CATEGORIES.find((c) => c.id === selectedCategory)
      if (category) {
        return PRESET_ACTIONS.filter((a) => category.integrations.includes(a.integration))
      }
    }
    return getPopularActions()
  }, [searchQuery, selectedIntegration, selectedCategory])

  // Convert presets to suggestions for the grid
  const suggestions: NodeSuggestion[] = displayActions.map((action) => ({
    nodeType: action.type,
    name: action.name,
    description: action.description,
    icon: action.icon,
    category: NODE_CATEGORIES.ACTION,
    confidence: action.popular ? 0.8 : 0.5,
    integration: action.integration,
  }))

  // Handle action selection
  const handleSelect = React.useCallback(
    (suggestion: NodeSuggestion) => {
      const preset = PRESET_ACTIONS.find(
        (a) => a.integration === suggestion.integration && a.type === suggestion.nodeType
      )
      if (preset) {
        const action: Omit<ActionNode, 'id' | 'order'> = {
          type: preset.type,
          name: preset.name,
          icon: preset.icon,
          integration: preset.integration,
          config: {},
          description: preset.description,
        }
        onSelect(action)
      }
    },
    [onSelect]
  )

  // Handle integration filter click
  const handleIntegrationClick = React.useCallback((integration: string) => {
    setSelectedIntegration((prev) => (prev === integration ? null : integration))
    setSelectedCategory(null)
    setSearchQuery('')
  }, [])

  // Handle category click
  const handleCategoryClick = React.useCallback((categoryId: string) => {
    setSelectedCategory((prev) => (prev === categoryId ? null : categoryId))
    setSelectedIntegration(null)
    setSearchQuery('')
  }, [])

  // Handle search input
  const handleSearchChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value)
      setSelectedIntegration(null)
      setSelectedCategory(null)
    },
    []
  )

  // Clear filters
  const clearFilters = React.useCallback(() => {
    setSearchQuery('')
    setSelectedIntegration(null)
    setSelectedCategory(null)
  }, [])

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-1">What should happen next?</h3>
        <p className="text-sm text-muted-foreground">
          Choose actions to add to your workflow
        </p>
      </div>

      {/* Context Suggestions (if provided) */}
      {contextSuggestions && contextSuggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Suggested based on your trigger
          </p>
          <NodeSuggestionList
            suggestions={contextSuggestions}
            onSelect={handleSelect}
          />
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Input
          type="search"
          placeholder="Search actions... (e.g., 'send email', 'create task')"
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

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {ACTION_CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => handleCategoryClick(category.id)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
              'border',
              selectedCategory === category.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-muted-foreground border-transparent hover:border-primary/50'
            )}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Integration Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {allIntegrations.slice(0, 8).map((integration) => {
          const info = INTEGRATION_ICONS[integration] || { icon: '🔌', label: integration }
          const isSelected = selectedIntegration === integration
          return (
            <button
              key={integration}
              type="button"
              onClick={() => handleIntegrationClick(integration)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all',
                'border hover:scale-105',
                isSelected
                  ? 'bg-primary/20 text-primary border-primary/50'
                  : 'bg-transparent text-muted-foreground border-border hover:border-primary/30'
              )}
            >
              <span>{info.icon}</span>
              <span>{info.label}</span>
            </button>
          )
        })}
      </div>

      {/* Action Grid */}
      <ScrollArea className="max-h-[350px]">
        {suggestions.length > 0 ? (
          <NodeSuggestionGrid
            suggestions={suggestions}
            onSelect={handleSelect}
            columns={3}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              {searchQuery
                ? `No actions found for "${searchQuery}"`
                : 'No actions available'}
            </p>
            <Button variant="link" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        )}
      </ScrollArea>

      {/* Selected Actions Summary */}
      {selectedActions.length > 0 && (
        <div className="mt-2 p-3 rounded-xl bg-muted/30 border border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Actions in your workflow ({selectedActions.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedActions.map((action) => (
              <div
                key={action.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs"
              >
                <span>{action.icon}</span>
                <span className="font-medium">{action.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Add Buttons */}
      <div className="flex gap-2 pt-2 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="flex-1"
        >
          <span className="mr-1">⭐</span>
          Popular
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleIntegrationClick('ai')}
          className="flex-1"
        >
          <span className="mr-1">🤖</span>
          AI Actions
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleIntegrationClick('slack')}
          className="flex-1"
        >
          <span className="mr-1">💬</span>
          Slack
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// Compact Action Selector for Inline Use
// ============================================================================

interface CompactActionSelectorProps {
  onSelect: (action: Omit<ActionNode, 'id' | 'order'>) => void
  triggerIntegration?: string
  className?: string
}

export function CompactActionSelector({
  onSelect,
  triggerIntegration,
  className,
}: CompactActionSelectorProps) {
  // Get contextually relevant actions based on trigger
  const relevantActions = React.useMemo(() => {
    const contextMappings: Record<string, string[]> = {
      github: ['slack', 'gmail', 'notion', 'ai'],
      slack: ['gmail', 'sheets', 'notion', 'ai'],
      gmail: ['slack', 'sheets', 'tasks', 'ai'],
      calendar: ['slack', 'gmail', 'tasks'],
      webhook: ['slack', 'gmail', 'sheets', 'http'],
      schedule: ['gmail', 'slack', 'sheets'],
    }

    const relevantIntegrations = triggerIntegration
      ? contextMappings[triggerIntegration] || ['slack', 'gmail', 'ai']
      : ['slack', 'gmail', 'ai', 'sheets']

    return PRESET_ACTIONS.filter(
      (a) => relevantIntegrations.includes(a.integration) && a.popular
    ).slice(0, 4)
  }, [triggerIntegration])

  const suggestions: NodeSuggestion[] = relevantActions.map((action) => ({
    nodeType: action.type,
    name: action.name,
    description: action.description,
    icon: action.icon,
    category: NODE_CATEGORIES.ACTION,
    confidence: 0.8,
    integration: action.integration,
  }))

  const handleSelect = React.useCallback(
    (suggestion: NodeSuggestion) => {
      const preset = PRESET_ACTIONS.find(
        (a) => a.integration === suggestion.integration && a.type === suggestion.nodeType
      )
      if (preset) {
        const action: Omit<ActionNode, 'id' | 'order'> = {
          type: preset.type,
          name: preset.name,
          icon: preset.icon,
          integration: preset.integration,
          config: {},
          description: preset.description,
        }
        onSelect(action)
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
