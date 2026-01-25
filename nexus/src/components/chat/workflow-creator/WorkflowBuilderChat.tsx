/**
 * WorkflowBuilderChat Component
 *
 * Chat-based workflow builder UI that displays the conversation
 * and handles user interactions.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import type {
  ConversationMessage,
  NodeSuggestion,
  WorkflowDraft,
  TriggerNode,
  ActionNode,
} from './workflow-creator-types'
import { MESSAGE_ROLES, MESSAGE_TYPES, CREATION_STEPS } from './workflow-creator-types'
import { NodeSuggestionList } from './NodeSuggestionCard'
import { WorkflowFlowVisual } from './WorkflowPreviewInline'
import { CompactTriggerSelector } from './TriggerSelector'
import { CompactActionSelector } from './ActionSelector'

// ============================================================================
// Types
// ============================================================================

interface WorkflowBuilderChatProps {
  messages: ConversationMessage[]
  isProcessing: boolean
  currentStep: string
  workflowDraft: WorkflowDraft
  onSendMessage: (message: string) => void
  onSelectTrigger: (trigger: TriggerNode) => void
  onSelectAction: (action: Omit<ActionNode, 'id' | 'order'>) => void
  onSelectSuggestion: (suggestion: NodeSuggestion) => void
  className?: string
}

// ============================================================================
// Message Bubble Component
// ============================================================================

interface MessageBubbleProps {
  message: ConversationMessage
  onSelectTrigger?: (trigger: TriggerNode) => void
  onSelectAction?: (action: Omit<ActionNode, 'id' | 'order'>) => void
  onSelectSuggestion?: (suggestion: NodeSuggestion) => void
}

function MessageBubble({
  message,
  onSelectTrigger: _onSelectTrigger,
  onSelectAction: _onSelectAction,
  onSelectSuggestion,
}: MessageBubbleProps) {
  void _onSelectTrigger
  void _onSelectAction
  const isUser = message.role === MESSAGE_ROLES.USER
  const isAssistant = message.role === MESSAGE_ROLES.ASSISTANT

  // Parse markdown-like content
  const formatContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      // Bold text
      const formattedLine = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      return (
        <span
          key={i}
          className="block"
          dangerouslySetInnerHTML={{ __html: formattedLine }}
        />
      )
    })
  }

  return (
    <div
      className={cn(
        'flex w-full',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted/50 border border-border rounded-bl-md'
        )}
      >
        {/* Message Content */}
        <div className={cn('text-sm', isUser ? 'text-primary-foreground' : 'text-foreground')}>
          {formatContent(message.content)}
        </div>

        {/* Suggestions for Trigger Select */}
        {isAssistant &&
          message.type === MESSAGE_TYPES.TRIGGER_SELECT &&
          message.metadata?.suggestions && (
            <div className="mt-4">
              <NodeSuggestionList
                suggestions={message.metadata.suggestions}
                onSelect={(suggestion) => {
                  if (onSelectSuggestion) {
                    onSelectSuggestion(suggestion)
                  }
                }}
              />
            </div>
          )}

        {/* Suggestions for Action Select */}
        {isAssistant &&
          message.type === MESSAGE_TYPES.ACTION_SELECT &&
          message.metadata?.suggestions && (
            <div className="mt-4">
              <NodeSuggestionList
                suggestions={message.metadata.suggestions}
                onSelect={(suggestion) => {
                  if (onSelectSuggestion) {
                    onSelectSuggestion(suggestion)
                  }
                }}
              />
            </div>
          )}

        {/* Workflow Preview */}
        {isAssistant &&
          message.type === MESSAGE_TYPES.PREVIEW &&
          message.metadata?.workflowPreview && (
            <div className="mt-4 p-3 rounded-xl bg-background/50 border border-border">
              <WorkflowFlowVisual draft={message.metadata.workflowPreview} />
            </div>
          )}

        {/* Completion Badge */}
        {message.type === MESSAGE_TYPES.COMPLETE && (
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Workflow Created
            </span>
          </div>
        )}

        {/* Timestamp */}
        <div
          className={cn(
            'text-[10px] mt-2',
            isUser ? 'text-primary-foreground/60' : 'text-muted-foreground'
          )}
        >
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Step Indicator Component
// ============================================================================

interface StepIndicatorProps {
  currentStep: string
  draft: WorkflowDraft
}

function StepIndicator({ currentStep, draft: _draft }: StepIndicatorProps) {
  void _draft
  const steps = [
    { key: CREATION_STEPS.TRIGGER, label: 'Trigger', icon: '⚡' },
    { key: CREATION_STEPS.ACTIONS, label: 'Actions', icon: '🔧' },
    { key: CREATION_STEPS.CONFIGURE, label: 'Configure', icon: '⚙️' },
    { key: CREATION_STEPS.REVIEW, label: 'Review', icon: '👀' },
  ]

  const currentIndex = steps.findIndex((s) => s.key === currentStep)

  return (
    <div className="flex items-center justify-center gap-2 py-3 px-4 bg-muted/30 border-b border-border">
      {steps.map((step, index) => {
        const isActive = step.key === currentStep
        const isComplete = index < currentIndex
        const isFuture = index > currentIndex

        return (
          <React.Fragment key={step.key}>
            <div
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                isActive && 'bg-primary text-primary-foreground',
                isComplete && 'bg-emerald-500/20 text-emerald-400',
                isFuture && 'bg-muted text-muted-foreground'
              )}
            >
              <span>{step.icon}</span>
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'w-4 h-0.5 rounded-full',
                  isComplete ? 'bg-emerald-500' : 'bg-border'
                )}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ============================================================================
// Quick Actions Component
// ============================================================================

interface QuickActionsProps {
  currentStep: string
  onSelectTrigger: (trigger: TriggerNode) => void
  onSelectAction: (action: Omit<ActionNode, 'id' | 'order'>) => void
  triggerIntegration?: string
}

function QuickActions({
  currentStep,
  onSelectTrigger,
  onSelectAction,
  triggerIntegration,
}: QuickActionsProps) {
  if (currentStep === CREATION_STEPS.TRIGGER) {
    return (
      <div className="px-4 py-3 border-t border-border bg-muted/20">
        <p className="text-xs text-muted-foreground mb-2">Quick picks:</p>
        <CompactTriggerSelector onSelect={onSelectTrigger} />
      </div>
    )
  }

  if (currentStep === CREATION_STEPS.ACTIONS) {
    return (
      <div className="px-4 py-3 border-t border-border bg-muted/20">
        <p className="text-xs text-muted-foreground mb-2">Popular actions:</p>
        <CompactActionSelector
          onSelect={onSelectAction}
          triggerIntegration={triggerIntegration}
        />
      </div>
    )
  }

  return null
}

// ============================================================================
// Chat Input Component
// ============================================================================

interface ChatInputProps {
  onSend: (message: string) => void
  isProcessing: boolean
  placeholder?: string
}

function ChatInput({ onSend, isProcessing, placeholder }: ChatInputProps) {
  const [input, setInput] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (input.trim() && !isProcessing) {
        onSend(input.trim())
        setInput('')
      }
    },
    [input, isProcessing, onSend]
  )

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit(e as unknown as React.FormEvent)
      }
    },
    [handleSubmit]
  )

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t border-border bg-background">
      <Input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || 'Describe your workflow...'}
        disabled={isProcessing}
        className="flex-1"
        autoFocus
      />
      <Button type="submit" disabled={!input.trim() || isProcessing} size="icon">
        {isProcessing ? (
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
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        )}
      </Button>
    </form>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function WorkflowBuilderChat({
  messages,
  isProcessing,
  currentStep,
  workflowDraft,
  onSendMessage,
  onSelectTrigger,
  onSelectAction,
  onSelectSuggestion,
  className,
}: WorkflowBuilderChatProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Generate placeholder based on current step
  const getPlaceholder = () => {
    switch (currentStep) {
      case CREATION_STEPS.TRIGGER:
        return 'What should trigger this workflow? (e.g., "When I receive an email...")'
      case CREATION_STEPS.ACTIONS:
        return 'What should happen next? (e.g., "Send a Slack message")'
      case CREATION_STEPS.CONFIGURE:
        return 'Provide configuration details...'
      case CREATION_STEPS.REVIEW:
        return 'Say "create" to save or describe changes...'
      default:
        return 'Describe your workflow...'
    }
  }

  return (
    <div className={cn('flex flex-col h-full bg-background rounded-xl border border-border overflow-hidden', className)}>
      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} draft={workflowDraft} />

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-primary"
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
              <h3 className="text-lg font-semibold mb-2">Create Your Workflow</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Tell me what you want to automate. For example: "When I get a new GitHub issue,
                send a Slack notification."
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onSelectTrigger={onSelectTrigger}
                onSelectAction={onSelectAction}
                onSelectSuggestion={onSelectSuggestion}
              />
            ))
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-muted/50 border border-border rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      <QuickActions
        currentStep={currentStep}
        onSelectTrigger={onSelectTrigger}
        onSelectAction={onSelectAction}
        triggerIntegration={workflowDraft.trigger?.integration}
      />

      {/* Chat Input */}
      <ChatInput
        onSend={onSendMessage}
        isProcessing={isProcessing}
        placeholder={getPlaceholder()}
      />
    </div>
  )
}

// ============================================================================
// Export Standalone Components
// ============================================================================

export { MessageBubble, StepIndicator, QuickActions, ChatInput }
