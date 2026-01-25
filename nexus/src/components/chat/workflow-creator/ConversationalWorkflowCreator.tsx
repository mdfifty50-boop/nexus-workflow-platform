/**
 * ConversationalWorkflowCreator Component
 *
 * Main orchestrator that guides users through workflow creation via chat.
 * Parses user intent and suggests workflow steps with inline previews.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useWorkflowCreator } from './useWorkflowCreator'
import { WorkflowBuilderChat } from './WorkflowBuilderChat'
import { WorkflowPreviewInline } from './WorkflowPreviewInline'
import { TriggerSelector } from './TriggerSelector'
import { ActionSelector } from './ActionSelector'
import type {
  TriggerNode,
  ActionNode,
  NodeSuggestion,
  WorkflowDraft,
  ValidationError,
} from './workflow-creator-types'
import {
  NODE_CATEGORIES,
} from './workflow-creator-types'
import { PRESET_TRIGGERS, PRESET_ACTIONS } from './workflow-presets'

// ============================================================================
// Types
// ============================================================================

interface ConversationalWorkflowCreatorProps {
  /** Initial prompt to process (e.g., from chat) */
  initialPrompt?: string
  /** Callback when workflow is created */
  onWorkflowCreated?: (workflow: WorkflowDraft) => void
  /** Callback when creation is cancelled */
  onCancel?: () => void
  /** Show in compact mode */
  compact?: boolean
  /** Additional class name */
  className?: string
}

type ViewMode = 'chat' | 'trigger-picker' | 'action-picker'

// ============================================================================
// Header Component
// ============================================================================

interface HeaderProps {
  draft: WorkflowDraft
  onReset: () => void
  onSave: () => void
  canSave: boolean
  isSaving: boolean
}

function Header({ draft, onReset, onSave, canSave, isSaving }: HeaderProps) {
  const stepCount = (draft.trigger ? 1 : 0) + draft.actions.length

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <div>
          <h2 className="font-semibold text-sm">
            {draft.name || 'New Workflow'}
          </h2>
          <p className="text-xs text-muted-foreground">
            {stepCount === 0
              ? 'Start by adding a trigger'
              : `${stepCount} step${stepCount !== 1 ? 's' : ''} configured`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onReset}>
          Reset
        </Button>
        <Button
          size="sm"
          onClick={onSave}
          disabled={!canSave || isSaving}
          className="gap-1.5"
        >
          {isSaving ? (
            <>
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Create Workflow
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// Sidebar Preview Component
// ============================================================================

interface SidebarPreviewProps {
  draft: WorkflowDraft
  validationErrors: ValidationError[]
  onEditTrigger: () => void
  onEditAction: (actionId: string) => void
  onRemoveAction: (actionId: string) => void
  onReorderActions: (fromIndex: number, toIndex: number) => void
}

function SidebarPreview({
  draft,
  validationErrors,
  onEditTrigger,
  onEditAction,
  onRemoveAction,
  onReorderActions,
}: SidebarPreviewProps) {
  return (
    <div className="h-full flex flex-col border-l border-border bg-muted/10">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-sm">Workflow Preview</h3>
        <p className="text-xs text-muted-foreground">
          Your automation at a glance
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <WorkflowPreviewInline
          draft={draft}
          validationErrors={validationErrors}
          onEditTrigger={onEditTrigger}
          onEditAction={onEditAction}
          onRemoveAction={onRemoveAction}
          onReorderActions={onReorderActions}
        />
      </div>
    </div>
  )
}

// ============================================================================
// View Mode Switcher Component
// ============================================================================

interface ViewModeSwitcherProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  currentStep: string
}

function ViewModeSwitcher({
  viewMode,
  onViewModeChange,
  currentStep: _currentStep,
}: ViewModeSwitcherProps) {
  void _currentStep
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
      <button
        type="button"
        onClick={() => onViewModeChange('chat')}
        className={cn(
          'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
          viewMode === 'chat'
            ? 'bg-background shadow-sm text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Chat
      </button>
      <button
        type="button"
        onClick={() => onViewModeChange('trigger-picker')}
        className={cn(
          'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
          viewMode === 'trigger-picker'
            ? 'bg-background shadow-sm text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Triggers
      </button>
      <button
        type="button"
        onClick={() => onViewModeChange('action-picker')}
        className={cn(
          'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
          viewMode === 'action-picker'
            ? 'bg-background shadow-sm text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Actions
      </button>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function ConversationalWorkflowCreator({
  initialPrompt,
  onWorkflowCreated,
  onCancel,
  compact = false,
  className,
}: ConversationalWorkflowCreatorProps) {
  const [viewMode, setViewMode] = React.useState<ViewMode>('chat')
  const [isSaving, setIsSaving] = React.useState(false)
  const [hasProcessedInitialPrompt, setHasProcessedInitialPrompt] = React.useState(false)

  const {
    state,
    processUserInput,
    setTrigger,
    addAction,
    removeAction,
    reorderActions,
    validateWorkflow,
    saveWorkflow,
    reset,
  } = useWorkflowCreator()

  const { workflowDraft, conversationHistory, isProcessing, currentStep, validationErrors } = state

  // Process initial prompt on mount
  React.useEffect(() => {
    if (initialPrompt && !hasProcessedInitialPrompt) {
      setHasProcessedInitialPrompt(true)
      processUserInput(initialPrompt)
    }
  }, [initialPrompt, hasProcessedInitialPrompt, processUserInput])

  // Handle trigger selection from picker
  const handleSelectTrigger = React.useCallback(
    (trigger: TriggerNode) => {
      setTrigger(trigger)
      setViewMode('chat')
    },
    [setTrigger]
  )

  // Handle action selection from picker
  const handleSelectAction = React.useCallback(
    (action: Omit<ActionNode, 'id' | 'order'>) => {
      addAction(action)
      setViewMode('chat')
    },
    [addAction]
  )

  // Handle suggestion selection
  const handleSelectSuggestion = React.useCallback(
    (suggestion: NodeSuggestion) => {
      if (suggestion.category === NODE_CATEGORIES.TRIGGER) {
        // Find the preset trigger
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
          setTrigger(trigger)
        }
      } else {
        // Find the preset action
        const preset = PRESET_ACTIONS.find(
          (a) => a.integration === suggestion.integration && a.type === suggestion.nodeType
        )
        if (preset) {
          addAction({
            type: preset.type,
            name: preset.name,
            icon: preset.icon,
            integration: preset.integration,
            config: {},
            description: preset.description,
          })
        }
      }
    },
    [setTrigger, addAction]
  )

  // Handle workflow save
  const handleSave = React.useCallback(async () => {
    const errors = validateWorkflow()
    if (errors.length > 0) {
      return
    }

    setIsSaving(true)
    const result = await saveWorkflow()
    setIsSaving(false)

    if (result.success) {
      onWorkflowCreated?.(workflowDraft)
    }
  }, [validateWorkflow, saveWorkflow, workflowDraft, onWorkflowCreated])

  // Handle reset
  const handleReset = React.useCallback(() => {
    reset()
    setHasProcessedInitialPrompt(false)
  }, [reset])

  // Check if can save
  const canSave = workflowDraft.trigger && workflowDraft.actions.length > 0

  // Compact mode renders just the chat
  if (compact) {
    return (
      <div className={cn('h-full', className)}>
        <WorkflowBuilderChat
          messages={conversationHistory}
          isProcessing={isProcessing}
          currentStep={currentStep}
          workflowDraft={workflowDraft}
          onSendMessage={processUserInput}
          onSelectTrigger={handleSelectTrigger}
          onSelectAction={handleSelectAction}
          onSelectSuggestion={handleSelectSuggestion}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-background rounded-xl border border-border overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <Header
        draft={workflowDraft}
        onReset={handleReset}
        onSave={handleSave}
        canSave={!!canSave}
        isSaving={isSaving}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat or Picker */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* View Mode Switcher */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border">
            <ViewModeSwitcher
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              currentStep={currentStep}
            />

            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {viewMode === 'chat' && (
              <WorkflowBuilderChat
                messages={conversationHistory}
                isProcessing={isProcessing}
                currentStep={currentStep}
                workflowDraft={workflowDraft}
                onSendMessage={processUserInput}
                onSelectTrigger={handleSelectTrigger}
                onSelectAction={handleSelectAction}
                onSelectSuggestion={handleSelectSuggestion}
                className="h-full rounded-none border-0"
              />
            )}

            {viewMode === 'trigger-picker' && (
              <div className="h-full overflow-y-auto p-4">
                <TriggerSelector
                  onSelect={handleSelectTrigger}
                  selectedTrigger={workflowDraft.trigger}
                />
              </div>
            )}

            {viewMode === 'action-picker' && (
              <div className="h-full overflow-y-auto p-4">
                <ActionSelector
                  onSelect={handleSelectAction}
                  selectedActions={workflowDraft.actions}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Preview (hidden on small screens) */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <SidebarPreview
            draft={workflowDraft}
            validationErrors={validationErrors}
            onEditTrigger={() => setViewMode('trigger-picker')}
            onEditAction={(_actionId) => {
              void _actionId
              setViewMode('action-picker')
            }}
            onRemoveAction={removeAction}
            onReorderActions={reorderActions}
          />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Standalone Compact Creator
// ============================================================================

interface CompactWorkflowCreatorProps {
  initialPrompt?: string
  onWorkflowCreated?: (workflow: WorkflowDraft) => void
  className?: string
}

export function CompactWorkflowCreator({
  initialPrompt,
  onWorkflowCreated,
  className,
}: CompactWorkflowCreatorProps) {
  return (
    <ConversationalWorkflowCreator
      initialPrompt={initialPrompt}
      onWorkflowCreated={onWorkflowCreated}
      compact
      className={className}
    />
  )
}

// ============================================================================
// Inline Workflow Creator for Chat Messages
// ============================================================================

interface InlineWorkflowCreatorProps {
  initialPrompt: string
  onComplete: (workflow: WorkflowDraft) => void
  onCancel: () => void
}

export function InlineWorkflowCreator({
  initialPrompt,
  onComplete,
  onCancel,
}: InlineWorkflowCreatorProps) {
  return (
    <div className="rounded-xl border border-border overflow-hidden bg-background">
      <ConversationalWorkflowCreator
        initialPrompt={initialPrompt}
        onWorkflowCreated={onComplete}
        onCancel={onCancel}
        compact
        className="h-[400px]"
      />
    </div>
  )
}
