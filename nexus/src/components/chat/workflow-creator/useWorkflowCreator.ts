/**
 * useWorkflowCreator Hook
 *
 * Manages the state and logic for the conversational workflow creation system.
 */

import { useState, useCallback, useRef } from 'react'
import type {
  WorkflowCreationState,
  WorkflowDraft,
  TriggerNode,
  ActionNode,
  NodeSuggestion,
  ValidationError,
  CreationStep,
  ConversationMessage,
  UseWorkflowCreatorReturn,
} from './workflow-creator-types'
import {
  CREATION_STEPS,
  VALIDATION_ERROR_TYPES,
  NODE_CATEGORIES,
  MESSAGE_ROLES,
  MESSAGE_TYPES,
} from './workflow-creator-types'
import { PRESET_TRIGGERS, PRESET_ACTIONS } from './workflow-presets'

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'nexus_workflow_draft'

const INITIAL_DRAFT: WorkflowDraft = {
  name: '',
  description: '',
  trigger: undefined,
  actions: [],
  connections: [],
}

const INITIAL_STATE: WorkflowCreationState = {
  currentStep: CREATION_STEPS.TRIGGER,
  workflowDraft: INITIAL_DRAFT,
  suggestions: [],
  validationErrors: [],
  isProcessing: false,
  conversationHistory: [],
}

// ============================================================================
// Intent Parsing Utilities
// ============================================================================

interface ParsedIntent {
  triggerIntegration?: string
  triggerType?: string
  actionIntegrations: string[]
  actionTypes: string[]
  workflowName?: string
  description?: string
}

/**
 * Parse user input to extract workflow intent
 */
function parseUserIntent(input: string): ParsedIntent {
  const lowerInput = input.toLowerCase()
  const result: ParsedIntent = {
    actionIntegrations: [],
    actionTypes: [],
  }

  // Detect trigger patterns
  const triggerPatterns = [
    { pattern: /when\s+(?:a\s+)?new\s+(?:github\s+)?issue/i, integration: 'github', type: 'new_issue' },
    { pattern: /when\s+(?:a\s+)?new\s+(?:github\s+)?pull\s*request/i, integration: 'github', type: 'new_pr' },
    { pattern: /when\s+(?:a\s+)?(?:new\s+)?email\s+(?:is\s+)?received/i, integration: 'gmail', type: 'new_email' },
    { pattern: /when\s+(?:a\s+)?new\s+slack\s+message/i, integration: 'slack', type: 'new_message' },
    { pattern: /when\s+(?:a\s+)?new\s+calendar\s+event/i, integration: 'calendar', type: 'new_event' },
    { pattern: /every\s+(?:day|morning|evening|hour|week)/i, integration: 'schedule', type: 'recurring' },
    { pattern: /at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)/i, integration: 'schedule', type: 'scheduled' },
    { pattern: /webhook/i, integration: 'webhook', type: 'custom_webhook' },
    { pattern: /form\s+(?:submission|submit)/i, integration: 'forms', type: 'form_submit' },
    { pattern: /(?:stripe|payment)\s+(?:received|completed)/i, integration: 'stripe', type: 'payment_received' },
    { pattern: /new\s+(?:lead|contact|customer)/i, integration: 'crm', type: 'new_contact' },
  ]

  for (const { pattern, integration, type } of triggerPatterns) {
    if (pattern.test(lowerInput)) {
      result.triggerIntegration = integration
      result.triggerType = type
      break
    }
  }

  // Detect action patterns
  const actionPatterns = [
    { pattern: /send\s+(?:a\s+)?slack\s+message/i, integration: 'slack', type: 'send_message' },
    { pattern: /post\s+(?:to\s+)?slack/i, integration: 'slack', type: 'send_message' },
    { pattern: /notify\s+(?:on\s+)?slack/i, integration: 'slack', type: 'send_message' },
    { pattern: /send\s+(?:an?\s+)?email/i, integration: 'gmail', type: 'send_email' },
    { pattern: /email\s+(?:to|someone|team)/i, integration: 'gmail', type: 'send_email' },
    { pattern: /create\s+(?:a\s+)?(?:notion|doc|page)/i, integration: 'notion', type: 'create_page' },
    { pattern: /add\s+(?:to\s+)?(?:google\s+)?sheet/i, integration: 'sheets', type: 'add_row' },
    { pattern: /update\s+(?:google\s+)?sheet/i, integration: 'sheets', type: 'update_row' },
    { pattern: /create\s+(?:a\s+)?(?:trello\s+)?card/i, integration: 'trello', type: 'create_card' },
    { pattern: /create\s+(?:a\s+)?task/i, integration: 'tasks', type: 'create_task' },
    { pattern: /post\s+(?:to\s+)?(?:twitter|x)/i, integration: 'twitter', type: 'post_tweet' },
    { pattern: /summarize|summary/i, integration: 'ai', type: 'summarize' },
    { pattern: /analyze|analysis/i, integration: 'ai', type: 'analyze' },
    { pattern: /translate/i, integration: 'ai', type: 'translate' },
  ]

  for (const { pattern, integration, type } of actionPatterns) {
    if (pattern.test(lowerInput)) {
      if (!result.actionIntegrations.includes(integration)) {
        result.actionIntegrations.push(integration)
        result.actionTypes.push(type)
      }
    }
  }

  // Try to extract workflow name
  const namePatterns = [
    /create\s+(?:a\s+)?workflow\s+(?:called|named)\s+["']?([^"']+)["']?/i,
    /(?:workflow|automation)\s+for\s+([^.]+)/i,
  ]

  for (const pattern of namePatterns) {
    const match = lowerInput.match(pattern)
    if (match) {
      result.workflowName = match[1].trim()
      break
    }
  }

  // Generate description from input
  if (input.length > 10) {
    result.description = input.length > 100 ? input.substring(0, 100) + '...' : input
  }

  return result
}

/**
 * Generate suggestions based on context
 */
function generateSuggestions(context: string, currentStep: CreationStep): NodeSuggestion[] {
  const lowerContext = context.toLowerCase()
  const suggestions: NodeSuggestion[] = []

  if (currentStep === CREATION_STEPS.TRIGGER) {
    // Suggest triggers based on context
    for (const trigger of PRESET_TRIGGERS) {
      const keywords = [trigger.integration, trigger.type, ...trigger.name.toLowerCase().split(' ')]
      const matchScore = keywords.filter(k => lowerContext.includes(k)).length / keywords.length
      if (matchScore > 0.2 || lowerContext.length < 5) {
        suggestions.push({
          nodeType: trigger.type,
          name: trigger.name,
          description: trigger.description,
          icon: trigger.icon,
          category: NODE_CATEGORIES.TRIGGER,
          confidence: Math.min(0.9, matchScore + 0.3),
          integration: trigger.integration,
        })
      }
    }
  } else {
    // Suggest actions based on context
    for (const action of PRESET_ACTIONS) {
      const keywords = [action.integration, action.type, ...action.name.toLowerCase().split(' ')]
      const matchScore = keywords.filter(k => lowerContext.includes(k)).length / keywords.length
      if (matchScore > 0.2 || lowerContext.length < 5) {
        suggestions.push({
          nodeType: action.type,
          name: action.name,
          description: action.description,
          icon: action.icon,
          category: NODE_CATEGORIES.ACTION,
          confidence: Math.min(0.9, matchScore + 0.3),
          integration: action.integration,
        })
      }
    }
  }

  // Sort by confidence and limit
  return suggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 6)
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useWorkflowCreator(): UseWorkflowCreatorReturn {
  const [state, setState] = useState<WorkflowCreationState>(INITIAL_STATE)
  const messageIdCounter = useRef(0)

  // ========================================================================
  // Helper Functions
  // ========================================================================

  const addMessage = useCallback((
    role: typeof MESSAGE_ROLES[keyof typeof MESSAGE_ROLES],
    type: typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES],
    content: string,
    metadata?: ConversationMessage['metadata']
  ) => {
    const message: ConversationMessage = {
      id: `msg-${++messageIdCounter.current}`,
      role,
      type,
      content,
      timestamp: new Date(),
      metadata,
    }
    setState(prev => ({
      ...prev,
      conversationHistory: [...prev.conversationHistory, message],
    }))
    return message
  }, [])

  // ========================================================================
  // Process User Input
  // ========================================================================

  const processUserInput = useCallback(async (input: string) => {
    setState(prev => ({ ...prev, isProcessing: true }))

    // Add user message
    addMessage(MESSAGE_ROLES.USER, MESSAGE_TYPES.TEXT, input)

    // Parse intent
    const intent = parseUserIntent(input)
    const { currentStep, workflowDraft } = state

    // Generate response based on current step and intent
    if (currentStep === CREATION_STEPS.TRIGGER) {
      if (intent.triggerIntegration && intent.triggerType) {
        // Found a trigger in the input
        const matchingTrigger = PRESET_TRIGGERS.find(
          t => t.integration === intent.triggerIntegration && t.type === intent.triggerType
        )

        if (matchingTrigger) {
          const newTrigger: TriggerNode = {
            id: generateId(),
            type: matchingTrigger.type,
            name: matchingTrigger.name,
            icon: matchingTrigger.icon,
            integration: matchingTrigger.integration,
            config: {},
            description: matchingTrigger.description,
          }

          setState(prev => ({
            ...prev,
            workflowDraft: {
              ...prev.workflowDraft,
              trigger: newTrigger,
              name: intent.workflowName || prev.workflowDraft.name,
              description: intent.description || prev.workflowDraft.description,
            },
          }))

          // Check if we also have actions
          if (intent.actionIntegrations.length > 0) {
            // Add the action(s)
            const newActions: ActionNode[] = []
            intent.actionIntegrations.forEach((integration, index) => {
              const matchingAction = PRESET_ACTIONS.find(
                a => a.integration === integration && a.type === intent.actionTypes[index]
              )
              if (matchingAction) {
                newActions.push({
                  id: generateId(),
                  type: matchingAction.type,
                  name: matchingAction.name,
                  icon: matchingAction.icon,
                  integration: matchingAction.integration,
                  config: {},
                  order: index,
                  description: matchingAction.description,
                })
              }
            })

            if (newActions.length > 0) {
              setState(prev => ({
                ...prev,
                workflowDraft: {
                  ...prev.workflowDraft,
                  actions: newActions,
                },
                currentStep: CREATION_STEPS.ACTIONS,
              }))

              const workflowName = intent.workflowName || `${matchingTrigger.name} Workflow`
              addMessage(
                MESSAGE_ROLES.ASSISTANT,
                MESSAGE_TYPES.PREVIEW,
                `I'll help you create "${workflowName}"! Here's what I suggest:\n\n` +
                `**Trigger:** ${matchingTrigger.icon} ${matchingTrigger.name}\n` +
                `**Actions:** ${newActions.map(a => `${a.icon} ${a.name}`).join(' -> ')}\n\n` +
                `Would you like to:\n` +
                `1. Configure these steps\n` +
                `2. Add more actions\n` +
                `3. Review and create the workflow`,
                {
                  workflowPreview: {
                    ...workflowDraft,
                    trigger: newTrigger,
                    actions: newActions,
                    name: workflowName,
                  },
                }
              )
            }
          } else {
            // Just trigger, ask about actions
            setState(prev => ({
              ...prev,
              currentStep: CREATION_STEPS.ACTIONS,
            }))

            addMessage(
              MESSAGE_ROLES.ASSISTANT,
              MESSAGE_TYPES.ACTION_SELECT,
              `Great choice! Your workflow will be triggered by: ${matchingTrigger.icon} **${matchingTrigger.name}**\n\n` +
              `What should happen when this triggers? For example:\n` +
              `- "Send a Slack message"\n` +
              `- "Add a row to Google Sheets"\n` +
              `- "Send an email notification"`,
              { trigger: newTrigger }
            )
          }
        }
      } else {
        // No trigger detected, show suggestions
        const suggestions = generateSuggestions(input, currentStep)
        setState(prev => ({ ...prev, suggestions }))

        addMessage(
          MESSAGE_ROLES.ASSISTANT,
          MESSAGE_TYPES.TRIGGER_SELECT,
          `I can help you build that workflow! Let's start with what triggers it.\n\n` +
          `What event should start your workflow? Here are some popular options:`,
          { suggestions }
        )
      }
    } else if (currentStep === CREATION_STEPS.ACTIONS) {
      if (intent.actionIntegrations.length > 0) {
        // Found actions in the input
        const newActions: ActionNode[] = [...state.workflowDraft.actions]

        intent.actionIntegrations.forEach((integration, index) => {
          const matchingAction = PRESET_ACTIONS.find(
            a => a.integration === integration && a.type === intent.actionTypes[index]
          )
          if (matchingAction) {
            newActions.push({
              id: generateId(),
              type: matchingAction.type,
              name: matchingAction.name,
              icon: matchingAction.icon,
              integration: matchingAction.integration,
              config: {},
              order: newActions.length,
              description: matchingAction.description,
            })
          }
        })

        setState(prev => ({
          ...prev,
          workflowDraft: {
            ...prev.workflowDraft,
            actions: newActions,
          },
        }))

        addMessage(
          MESSAGE_ROLES.ASSISTANT,
          MESSAGE_TYPES.SUGGESTION,
          `Added: ${newActions.slice(-intent.actionIntegrations.length).map(a => `${a.icon} ${a.name}`).join(', ')}\n\n` +
          `Your workflow now has ${newActions.length} action(s). Would you like to:\n` +
          `- Add more actions\n` +
          `- Configure the actions\n` +
          `- Review and create the workflow`,
          { workflowPreview: { ...state.workflowDraft, actions: newActions } }
        )
      } else if (input.toLowerCase().includes('review') || input.toLowerCase().includes('create') || input.toLowerCase().includes('done')) {
        // User wants to review/create
        setState(prev => ({ ...prev, currentStep: CREATION_STEPS.REVIEW }))
        const { workflowDraft: draft } = state

        addMessage(
          MESSAGE_ROLES.ASSISTANT,
          MESSAGE_TYPES.PREVIEW,
          `Here's your workflow summary:\n\n` +
          `**${draft.name || 'Untitled Workflow'}**\n\n` +
          `**Trigger:** ${draft.trigger?.icon || '?'} ${draft.trigger?.name || 'Not set'}\n\n` +
          `**Actions:**\n${draft.actions.map((a, i) => `${i + 1}. ${a.icon} ${a.name}`).join('\n') || 'No actions added'}\n\n` +
          `Ready to create this workflow? Say "create" to proceed or describe any changes you'd like to make.`,
          { workflowPreview: draft }
        )
      } else {
        // Show action suggestions
        const suggestions = generateSuggestions(input, currentStep)
        setState(prev => ({ ...prev, suggestions }))

        addMessage(
          MESSAGE_ROLES.ASSISTANT,
          MESSAGE_TYPES.ACTION_SELECT,
          `What would you like to add to your workflow? Here are some suggestions:`,
          { suggestions }
        )
      }
    } else if (currentStep === CREATION_STEPS.REVIEW) {
      if (input.toLowerCase().includes('create') || input.toLowerCase().includes('yes') || input.toLowerCase().includes('save')) {
        setState(prev => ({ ...prev, currentStep: CREATION_STEPS.COMPLETE }))

        addMessage(
          MESSAGE_ROLES.ASSISTANT,
          MESSAGE_TYPES.COMPLETE,
          `Your workflow has been created successfully! You can now find it in your Workflows dashboard.\n\n` +
          `Would you like to:\n` +
          `- Create another workflow\n` +
          `- Configure advanced settings\n` +
          `- Test this workflow`
        )
      } else {
        addMessage(
          MESSAGE_ROLES.ASSISTANT,
          MESSAGE_TYPES.TEXT,
          `What would you like to change? You can:\n` +
          `- Change the trigger\n` +
          `- Add or remove actions\n` +
          `- Modify the workflow name`
        )
      }
    }

    setState(prev => ({ ...prev, isProcessing: false }))
  }, [state, addMessage])

  // ========================================================================
  // Trigger Management
  // ========================================================================

  const setTrigger = useCallback((trigger: TriggerNode) => {
    setState(prev => ({
      ...prev,
      workflowDraft: {
        ...prev.workflowDraft,
        trigger,
      },
      currentStep: CREATION_STEPS.ACTIONS,
    }))

    addMessage(
      MESSAGE_ROLES.ASSISTANT,
      MESSAGE_TYPES.ACTION_SELECT,
      `Trigger set: ${trigger.icon} **${trigger.name}**\n\nNow, what should happen when this triggers?`,
      { trigger }
    )
  }, [addMessage])

  const updateTriggerConfig = useCallback((config: Record<string, unknown>) => {
    setState(prev => ({
      ...prev,
      workflowDraft: {
        ...prev.workflowDraft,
        trigger: prev.workflowDraft.trigger
          ? { ...prev.workflowDraft.trigger, config: { ...prev.workflowDraft.trigger.config, ...config } }
          : undefined,
      },
    }))
  }, [])

  // ========================================================================
  // Action Management
  // ========================================================================

  const addAction = useCallback((action: Omit<ActionNode, 'id' | 'order'>) => {
    const newAction: ActionNode = {
      ...action,
      id: generateId(),
      order: state.workflowDraft.actions.length,
    }

    setState(prev => ({
      ...prev,
      workflowDraft: {
        ...prev.workflowDraft,
        actions: [...prev.workflowDraft.actions, newAction],
      },
    }))

    addMessage(
      MESSAGE_ROLES.ASSISTANT,
      MESSAGE_TYPES.SUGGESTION,
      `Added action: ${newAction.icon} **${newAction.name}**\n\nWould you like to add more actions or review the workflow?`
    )
  }, [state.workflowDraft.actions.length, addMessage])

  const removeAction = useCallback((actionId: string) => {
    setState(prev => ({
      ...prev,
      workflowDraft: {
        ...prev.workflowDraft,
        actions: prev.workflowDraft.actions
          .filter(a => a.id !== actionId)
          .map((a, i) => ({ ...a, order: i })),
      },
    }))
  }, [])

  const updateActionConfig = useCallback((actionId: string, config: Record<string, unknown>) => {
    setState(prev => ({
      ...prev,
      workflowDraft: {
        ...prev.workflowDraft,
        actions: prev.workflowDraft.actions.map(a =>
          a.id === actionId ? { ...a, config: { ...a.config, ...config } } : a
        ),
      },
    }))
  }, [])

  const reorderActions = useCallback((fromIndex: number, toIndex: number) => {
    setState(prev => {
      const actions = [...prev.workflowDraft.actions]
      const [removed] = actions.splice(fromIndex, 1)
      actions.splice(toIndex, 0, removed)
      return {
        ...prev,
        workflowDraft: {
          ...prev.workflowDraft,
          actions: actions.map((a, i) => ({ ...a, order: i })),
        },
      }
    })
  }, [])

  // ========================================================================
  // Navigation
  // ========================================================================

  const goToStep = useCallback((step: CreationStep) => {
    setState(prev => ({ ...prev, currentStep: step }))
  }, [])

  const nextStep = useCallback(() => {
    const steps = Object.values(CREATION_STEPS)
    const currentIndex = steps.indexOf(state.currentStep)
    if (currentIndex < steps.length - 1) {
      setState(prev => ({ ...prev, currentStep: steps[currentIndex + 1] }))
    }
  }, [state.currentStep])

  const previousStep = useCallback(() => {
    const steps = Object.values(CREATION_STEPS)
    const currentIndex = steps.indexOf(state.currentStep)
    if (currentIndex > 0) {
      setState(prev => ({ ...prev, currentStep: steps[currentIndex - 1] }))
    }
  }, [state.currentStep])

  // ========================================================================
  // Validation
  // ========================================================================

  const validateWorkflow = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = []
    const { workflowDraft } = state

    if (!workflowDraft.trigger) {
      errors.push({
        type: VALIDATION_ERROR_TYPES.MISSING_TRIGGER,
        message: 'A trigger is required to start your workflow',
      })
    }

    if (workflowDraft.actions.length === 0) {
      errors.push({
        type: VALIDATION_ERROR_TYPES.MISSING_ACTIONS,
        message: 'At least one action is required',
      })
    }

    setState(prev => ({ ...prev, validationErrors: errors }))
    return errors
  }, [state])

  const canProceed = useCallback((): boolean => {
    const { currentStep, workflowDraft } = state

    switch (currentStep) {
      case CREATION_STEPS.TRIGGER:
        return !!workflowDraft.trigger
      case CREATION_STEPS.ACTIONS:
        return workflowDraft.actions.length > 0
      case CREATION_STEPS.CONFIGURE:
        return true
      case CREATION_STEPS.REVIEW:
        return validateWorkflow().length === 0
      default:
        return false
    }
  }, [state, validateWorkflow])

  // ========================================================================
  // Persistence
  // ========================================================================

  const saveWorkflow = useCallback(async (): Promise<{ success: boolean; workflowId?: string; error?: string }> => {
    const errors = validateWorkflow()
    if (errors.length > 0) {
      return { success: false, error: 'Workflow validation failed' }
    }

    // In a real implementation, this would call the API
    const workflowId = generateId()

    // Clear draft after successful save
    localStorage.removeItem(STORAGE_KEY)

    return { success: true, workflowId }
  }, [validateWorkflow])

  const saveDraft = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.workflowDraft))
  }, [state.workflowDraft])

  const loadDraft = useCallback((): WorkflowDraft | null => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const draft = JSON.parse(saved) as WorkflowDraft
        setState(prev => ({ ...prev, workflowDraft: draft }))
        return draft
      } catch {
        return null
      }
    }
    return null
  }, [])

  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // ========================================================================
  // Suggestions
  // ========================================================================

  const getSuggestions = useCallback((context: string): NodeSuggestion[] => {
    return generateSuggestions(context, state.currentStep)
  }, [state.currentStep])

  // ========================================================================
  // Reset
  // ========================================================================

  const reset = useCallback(() => {
    setState(INITIAL_STATE)
    clearDraft()
  }, [clearDraft])

  // ========================================================================
  // Return
  // ========================================================================

  return {
    state,
    processUserInput,
    setTrigger,
    addAction,
    removeAction,
    updateActionConfig,
    updateTriggerConfig,
    reorderActions,
    goToStep,
    nextStep,
    previousStep,
    validateWorkflow,
    canProceed,
    saveWorkflow,
    saveDraft,
    loadDraft,
    clearDraft,
    getSuggestions,
    reset,
  }
}
