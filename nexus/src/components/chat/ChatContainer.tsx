/**
 * ChatContainer Component
 *
 * Main ChatGPT-style chat interface container:
 * - Full-height chat interface
 * - Message list with auto-scroll to bottom
 * - Input area at bottom with expanding textarea
 * - Support for user messages and AI responses
 * - Clean, minimal design matching ChatGPT aesthetic
 * - Dark/light mode support via Tailwind
 * - REAL AI integration via NexusWorkflowEngine
 */

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { MessageSquare, Sparkles, Zap, ArrowRight, Send, X } from 'lucide-react'
import { ChatHeader } from './ChatHeader'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { WorkflowPreviewCard } from './WorkflowPreviewCard'
import { APIKeyAcquisitionCard } from './APIKeyAcquisitionCard'
import { useChatState } from './useChatState'
import type { EmbeddedContent } from './types'
import type { ChatMode } from './SidebarNavigation'
import type { VoiceLanguage } from '@/hooks/useVoiceInput'
// @NEXUS-FIX-027: Get user email for "Send to Myself" button
import { useAuth } from '@/contexts/AuthContext'
import {
  nexusWorkflowEngine,
  type IntentAnalysis,
  type SmartNexusQuestion,
  type GeneratedWorkflow,
} from '@/services/NexusWorkflowEngine'
// Real Claude AI service for natural conversation
import { nexusAIService, type CustomIntegrationInfo } from '@/services/NexusAIService'
// Persistent user memory tracking
import { userMemoryService } from '@/services/UserMemoryService'
// Onboarding prompt suggestion
import { OnboardingPromptService, type OnboardingSuggestion } from '@/services/OnboardingPromptService'
// @NEXUS-FIX-175: Diagnostic tree framework for structured problem diagnosis - DO NOT REMOVE
import { findDiagnosticTree } from '@/lib/diagnostic-trees'
// workflowOrchestrator available for future execution features

// ============================================================================
// Types
// ============================================================================

interface ChatContainerProps {
  className?: string
  onToggleDashboard?: () => void
  showDashboardButton?: boolean
  renderEmbeddedContent?: (content: EmbeddedContent) => React.ReactNode
}

// ============================================================================
// Empty State Component
// ============================================================================

interface SuggestionCard {
  icon: React.ReactNode
  title: string
  description: string
  prompt: string
}

interface EmptyStateProps {
  onSuggestionClick: (prompt: string) => void
}

function EmptyState({ onSuggestionClick }: EmptyStateProps): React.ReactElement {
  const { t } = useTranslation()

  const suggestions: SuggestionCard[] = [
    {
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      title: t('chat.suggestions.createWorkflow'),
      description: t('chat.suggestions.createWorkflowDesc'),
      prompt: t('chat.suggestions.createWorkflowPrompt'),
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-blue-500" />,
      title: t('chat.suggestions.connectApps'),
      description: t('chat.suggestions.connectAppsDesc'),
      prompt: t('chat.suggestions.connectAppsPrompt'),
    },
    {
      icon: <Sparkles className="w-5 h-5 text-purple-500" />,
      title: t('chat.suggestions.exploreTemplates'),
      description: t('chat.suggestions.exploreTemplatesDesc'),
      prompt: t('chat.suggestions.exploreTemplatesPrompt'),
    },
  ]

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-nexus-500 to-accent-nexus-500 flex items-center justify-center shadow-lg shadow-nexus-500/30">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-surface-100 mb-3">
          {t('chat.howCanIHelp')}
        </h1>
        <p className="text-surface-400 max-w-md text-base">
          {t('chat.createPowerful')}
        </p>
      </div>

      {/* Suggestion Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion.prompt)}
            className={cn(
              'group p-5 rounded-xl text-left',
              'bg-surface-800/50 backdrop-blur-sm',
              'border border-surface-700/50',
              'hover:border-nexus-500/50 hover:shadow-lg hover:shadow-nexus-500/10',
              'hover:bg-surface-800/80',
              'transition-all duration-300'
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-surface-700/50">
                {suggestion.icon}
              </div>
              <ArrowRight className="w-4 h-4 text-surface-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:text-nexus-400 transition-all" />
            </div>
            <h3 className="font-semibold text-surface-100 mb-1.5">
              {suggestion.title}
            </h3>
            <p className="text-sm text-surface-400">
              {suggestion.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Loading Indicator
// ============================================================================

function ThinkingIndicator(): React.ReactElement {
  const { t } = useTranslation()
  return (
    <div className="flex gap-3 sm:gap-4 px-3 sm:px-4 py-4 sm:py-6 bg-surface-800/30 border-l-2 border-nexus-500/30">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-nexus-500 to-accent-nexus-500 flex items-center justify-center shadow-lg">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-surface-300 text-sm font-medium">
          {t('chat.thinking')}
        </span>
        <span className="flex gap-1.5">
          <span className="w-2 h-2 bg-nexus-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-nexus-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-accent-nexus-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </span>
      </div>
    </div>
  )
}

// ============================================================================
// Clarifying Options with Inline Custom Input
// ============================================================================

interface ClarifyingOptionsData {
  field: string
  options: string[]
  remainingQuestions: Array<{ question: string; options: string[]; field: string }>
}

interface ClarifyingOptionsWithCustomInputProps {
  data: ClarifyingOptionsData
  onSelect: (value: string) => void
}

function ClarifyingOptionsWithCustomInput({
  data,
  onSelect,
}: ClarifyingOptionsWithCustomInputProps): React.ReactElement {
  const { t } = useTranslation()
  const [showCustomInput, setShowCustomInput] = React.useState(false)
  const [customValue, setCustomValue] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Focus input when custom mode is activated
  React.useEffect(() => {
    if (showCustomInput && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showCustomInput])

  const handleSubmitCustom = () => {
    const value = customValue.trim()
    if (value) {
      onSelect(value)
      setCustomValue('')
      setShowCustomInput(false)
    }
  }

  if (showCustomInput) {
    return (
      <div className="mt-2 space-y-2">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSubmitCustom()
              }
              if (e.key === 'Escape') {
                setShowCustomInput(false)
                setCustomValue('')
              }
            }}
            placeholder={`Type your ${data.field}...`}
            className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-surface-800 text-surface-100 border border-surface-600/50 focus:border-nexus-500 focus:outline-none focus:ring-2 focus:ring-nexus-500/30 placeholder-surface-500 transition-all"
          />
          <button
            onClick={handleSubmitCustom}
            disabled={!customValue.trim()}
            className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-all ${
              customValue.trim()
                ? 'bg-gradient-to-r from-nexus-500 to-accent-nexus-500 text-white hover:shadow-lg hover:shadow-nexus-500/25'
                : 'bg-surface-700 text-surface-500 cursor-not-allowed'
            }`}
          >
            {t('chat.send')}
          </button>
        </div>
        <button
          onClick={() => {
            setShowCustomInput(false)
            setCustomValue('')
          }}
          className="text-xs text-surface-400 hover:text-surface-200 transition-colors"
        >
          ← {t('chat.backToOptions')}
        </button>
      </div>
    )
  }

  // @NEXUS-FIX-014: Custom... option expands to input - DO NOT REMOVE
  // Helper to detect if an option is a "custom/other" type that should trigger inline input
  const isCustomOption = (option: string): boolean => {
    const lower = option.toLowerCase().trim()
    return (
      lower === 'custom' ||
      lower === 'custom...' ||
      lower === 'other' ||
      lower === 'other...' ||
      lower.startsWith('custom ') ||
      lower.startsWith('other ')
    )
  }

  // Filter out custom-type options from regular options (we'll handle them specially)
  const regularOptions = data.options.filter(opt => !isCustomOption(opt))
  const hasCustomOptionFromAI = data.options.some(opt => isCustomOption(opt))

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {regularOptions.map((option, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(option)}
          className="px-4 py-2.5 text-sm font-medium rounded-xl bg-surface-700/50 hover:bg-surface-700 text-surface-200 border border-surface-600/50 hover:border-nexus-500/50 transition-all duration-200"
        >
          {option}
        </button>
      ))}
      {/* "Other/Custom" option for custom input - ALWAYS show, triggers inline input */}
      <button
        onClick={() => setShowCustomInput(true)}
        className="px-4 py-2.5 text-sm font-medium rounded-xl bg-transparent hover:bg-surface-700/30 text-surface-400 border border-dashed border-surface-600/50 hover:border-accent-nexus-500/50 hover:text-accent-nexus-400 transition-all duration-200"
      >
        {hasCustomOptionFromAI ? t('chat.custom') : t('chat.other')}
      </button>
    </div>
  )
}

// ============================================================================
// ChatContainer Component
// ============================================================================

export function ChatContainer({
  className,
  onToggleDashboard,
  showDashboardButton = true,
  renderEmbeddedContent,
}: ChatContainerProps): React.ReactElement {
  const { t } = useTranslation()
  // @NEXUS-FIX-027: Get user email for "Send to Myself" button - DO NOT REMOVE
  // Also provides userId for cloud sync (Plan B: User Account System)
  const { user, userProfile, userId } = useAuth()
  const userEmail = userProfile?.email || user?.email || null

  // Chat state with optional cloud sync (Plan B: User Account System)
  // When userId is provided, chat history syncs to Supabase for cross-device access
  const {
    messages,
    isLoading,
    currentSession,
    addMessage,
    updateMessage,
    clearMessages,
    startNewSession,
    setIsLoading,
    loadSession,
  } = useChatState({ userId })

  // Handle session selection and new chat trigger from localStorage event (triggered by sidebar)
  React.useEffect(() => {
    // Check for pending session on mount
    const pendingSession = localStorage.getItem('nexus-pending-session')
    if (pendingSession && pendingSession !== currentSession?.id) {
      loadSession(pendingSession)
      localStorage.removeItem('nexus-pending-session')
    }

    // Check for new chat trigger on mount
    const newChatTrigger = localStorage.getItem('nexus-new-chat-trigger')
    if (newChatTrigger) {
      // Read chat mode before clearing
      const mode = localStorage.getItem('nexus-chat-mode') as ChatMode || 'standard'
      setChatMode(mode)
      localStorage.removeItem('nexus-chat-mode')

      startNewSession()
      localStorage.removeItem('nexus-new-chat-trigger')
      // Reset conversation state
      setConversationState('idle')
      setCurrentIntent(null)
      setPendingQuestions([])
      setCurrentQuestionIndex(0)
      setCollectedInfo({})
    }

    // Listen for storage events (same-window communication)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'nexus-pending-session' && e.newValue) {
        loadSession(e.newValue)
        localStorage.removeItem('nexus-pending-session')
      }
      if (e.key === 'nexus-new-chat-trigger' && e.newValue) {
        // Read chat mode before clearing
        const mode = localStorage.getItem('nexus-chat-mode') as ChatMode || 'standard'
        setChatMode(mode)
        localStorage.removeItem('nexus-chat-mode')

        startNewSession()
        localStorage.removeItem('nexus-new-chat-trigger')
        // Reset conversation state
        setConversationState('idle')
        setCurrentIntent(null)
        setPendingQuestions([])
        setCurrentQuestionIndex(0)
        setCollectedInfo({})
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [currentSession?.id, loadSession, startNewSession])

  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const messagesContainerRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  React.useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  // Conversation state for multi-turn interactions
  const [conversationState, setConversationState] = React.useState<'idle' | 'asking_questions' | 'generating'>('idle')
  const [currentIntent, setCurrentIntent] = React.useState<IntentAnalysis | null>(null)
  const [pendingQuestions, setPendingQuestions] = React.useState<SmartNexusQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0)
  const [collectedInfo, setCollectedInfo] = React.useState<Record<string, string>>({})

  // "Think with me" mode - focused problem-solving chat mode
  const [chatMode, setChatMode] = React.useState<ChatMode>('standard')

  // @NEXUS-FIX-177: Conversation phase tracking for UX display - DO NOT REMOVE
  const [conversationPhase, setConversationPhase] = React.useState<'discovery' | 'clarifying' | 'generating' | 'refining'>('discovery')

  // Voice language - only affects speech recognition input, NOT the UI layout
  const [chatLanguage, setChatLanguage] = React.useState<VoiceLanguage>('en-US')

  // NOTE: Voice language selection intentionally does NOT change the global i18n language
  // or document direction. The mic language selector is for speech recognition only.
  // Changing document.documentElement.dir breaks the entire app layout.

  // Finding #14: Streaming message state - tracks the assistant message being streamed
  const streamingMessageIdRef = React.useRef<string | null>(null)

  // Active workflow tracking - for refinement mode (update existing card instead of creating new)
  const [activeWorkflowId, setActiveWorkflowId] = React.useState<string | null>(null)

  // Generated workflows to display as preview cards - PERSIST to localStorage
  const [generatedWorkflows, setGeneratedWorkflows] = React.useState<Map<string, GeneratedWorkflow>>(() => {
    // Restore from localStorage on mount
    try {
      const saved = localStorage.getItem('nexus-generated-workflows')
      if (saved) {
        const parsed = JSON.parse(saved)
        return new Map(Object.entries(parsed))
      }
    } catch (e) {
      console.warn('[ChatContainer] Failed to restore workflows from localStorage:', e)
    }
    return new Map()
  })

  // Pending custom integrations (apps that need API keys instead of OAuth)
  const [pendingCustomIntegrations, setPendingCustomIntegrations] = React.useState<Map<string, CustomIntegrationInfo>>(() => {
    try {
      const saved = localStorage.getItem('nexus-pending-integrations')
      if (saved) {
        const parsed = JSON.parse(saved)
        return new Map(Object.entries(parsed))
      }
    } catch (e) {
      console.warn('[ChatContainer] Failed to restore pending integrations from localStorage:', e)
    }
    return new Map()
  })

  // Persist workflows to localStorage when they change
  React.useEffect(() => {
    if (generatedWorkflows.size > 0) {
      const obj = Object.fromEntries(generatedWorkflows)
      localStorage.setItem('nexus-generated-workflows', JSON.stringify(obj))
    }
  }, [generatedWorkflows])

  // Persist pending integrations to localStorage when they change
  React.useEffect(() => {
    if (pendingCustomIntegrations.size > 0) {
      const obj = Object.fromEntries(pendingCustomIntegrations)
      localStorage.setItem('nexus-pending-integrations', JSON.stringify(obj))
    }
  }, [pendingCustomIntegrations])

  // ============================================================================
  // @NEXUS-FIX-176: Consultancy result injection — "Back to Chat with Insights" - DO NOT REMOVE
  // ============================================================================
  React.useEffect(() => {
    try {
      const resultRaw = localStorage.getItem('nexus-consultancy-result')
      if (resultRaw) {
        const result = JSON.parse(resultRaw)
        localStorage.removeItem('nexus-consultancy-result')
        if (result.summary) {
          addMessage(
            `**Insights from your consultancy session:**\n\n${result.summary}\n\n---\n*How would you like to proceed? I can build automations based on these insights.*`,
            'assistant'
          )
        }
      }
    } catch { /* ignore parse errors */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ============================================================================
  // Onboarding Suggested Prompt
  // ============================================================================

  const [onboardingSuggestion, setOnboardingSuggestion] = React.useState<OnboardingSuggestion | null>(null)

  // Generate suggestion when chat is empty and user has profile data
  React.useEffect(() => {
    if (messages.length === 0 && !isLoading) {
      const suggestion = OnboardingPromptService.generateSuggestion()
      setOnboardingSuggestion(suggestion)
    } else {
      setOnboardingSuggestion(null)
    }
  }, [messages.length, isLoading])

  const handleSuggestionDismiss = React.useCallback(() => {
    OnboardingPromptService.dismiss()
    setOnboardingSuggestion(null)
  }, [])

  // ============================================================================
  // Node Edit Commands (chat-based workflow modification)
  // ============================================================================

  // Types for edit commands
  interface NodeEditCommand {
    type: 'remove' | 'add' | 'replace'
    target?: string  // Node name/integration for remove
    integration?: string  // For add or replacement
    suggestAlternative?: boolean  // true for "don't have" patterns
  }

  // Default actions for auto-detection when adding nodes
  const defaultActions: Record<string, string> = {
    slack: 'send_message',
    gmail: 'send_email',
    googlesheets: 'append_row',
    notion: 'create_page',
    discord: 'send_message',
    dropbox: 'upload_file',
    github: 'create_issue',
    trello: 'create_card',
    asana: 'create_task',
    hubspot: 'create_contact',
    whatsapp: 'send_message',
    'whatsapp-business': 'send_message',
    twitter: 'post_tweet',
    linkedin: 'post_update',
    zoom: 'create_meeting',
    stripe: 'create_payment',
  }

  // Parse edit commands from chat (including natural language)
  const parseNodeEditCommand = React.useCallback((message: string): NodeEditCommand | null => {
    const trimmed = message.trim()

    // === REPLACE PATTERNS (check first - most specific) ===

    // "replace Slack with Discord" / "swap Gmail for Outlook" / "change Slack to Discord"
    const replaceWithMatch = trimmed.match(
      /(?:replace|swap|switch|change)\s+(?:the\s+)?["']?(\w+)["']?\s+(?:with|for|to)\s+["']?(\w+)["']?/i
    )
    if (replaceWithMatch) {
      return { type: 'replace', target: replaceWithMatch[1].trim(), integration: replaceWithMatch[2].trim() }
    }

    // "use Discord instead of Slack"
    const useInsteadMatch = trimmed.match(
      /(?:use|try)\s+["']?(\w+)["']?\s+instead\s+of\s+["']?(\w+)["']?/i
    )
    if (useInsteadMatch) {
      return { type: 'replace', target: useInsteadMatch[2].trim(), integration: useInsteadMatch[1].trim() }
    }

    // "instead of Slack, use Discord"
    const insteadOfMatch = trimmed.match(
      /instead\s+of\s+["']?(\w+)["']?\s*,?\s*(?:use|try|add)\s+["']?(\w+)["']?/i
    )
    if (insteadOfMatch) {
      return { type: 'replace', target: insteadOfMatch[1].trim(), integration: insteadOfMatch[2].trim() }
    }

    // "I use WhatsApp, not Slack" / "I prefer Discord not Slack"
    const useNotMatch = trimmed.match(
      /(?:i\s+)?(?:use|prefer|have)\s+["']?(\w+)["']?\s*(?:,\s*|\s+)(?:not|instead\s+of)\s+["']?(\w+)["']?/i
    )
    if (useNotMatch) {
      return { type: 'replace', target: useNotMatch[2].trim(), integration: useNotMatch[1].trim() }
    }

    // === "DON'T HAVE" PATTERNS → remove + suggest alternative ===

    // "I don't have Slack" / "I can't use Gmail" / "I don't use Dropbox"
    const dontHaveMatch = trimmed.match(
      /(?:i\s+)?(?:don'?t|do\s*n'?t|can'?t|cannot|dont)\s+(?:have|use|want|need)\s+(?:a\s+|an?\s+)?(?:account\s+(?:on|with|for)\s+)?["']?(\w+)["']?/i
    )
    if (dontHaveMatch) {
      return { type: 'remove', target: dontHaveMatch[1].trim(), suggestAlternative: true }
    }

    // "but I don't have Slack" (with leading "but")
    const butDontMatch = trimmed.match(
      /^but\s+(?:i\s+)?(?:don'?t|do\s*n'?t|cant|can'?t|cannot|dont)\s+(?:have|use|want|need)\s+["']?(\w+)["']?/i
    )
    if (butDontMatch) {
      return { type: 'remove', target: butDontMatch[1].trim(), suggestAlternative: true }
    }

    // === EXPLICIT REMOVE PATTERNS ===

    const removePatterns = [
      /^(?:remove|delete)\s+(?:the\s+)?(?:node\s+|step\s+)?["']?([^"']+?)["']?(?:\s+(?:step|node))?$/i,
      /^(?:take out|get rid of)\s+(?:the\s+)?["']?(.+?)["']?$/i,
    ]

    for (const pattern of removePatterns) {
      const match = trimmed.match(pattern)
      if (match) return { type: 'remove', target: match[1].trim() }
    }

    // === ADD PATTERNS ===

    const addPatterns = [
      /^add\s+(?:a\s+)?(?:new\s+)?["']?([a-zA-Z]+)["']?\s*(?:step|node|action)?$/i,
    ]

    for (const pattern of addPatterns) {
      const match = trimmed.match(pattern)
      if (match) return { type: 'add', integration: match[1].trim() }
    }

    return null
  }, [])

  // Helper: find matching nodes in a workflow
  const findMatchingNodes = React.useCallback((workflow: { nodes: Array<{ id: string; name: string; tool?: string; type?: string }> }, target: string) => {
    const targetLower = target.toLowerCase()
    return workflow.nodes.filter(n =>
      n.name.toLowerCase().includes(targetLower) ||
      n.tool?.toLowerCase() === targetLower ||
      n.id === target
    )
  }, [])

  // Helper: create a new workflow node
  const createNode = React.useCallback((integration: string, nodeCount: number) => {
    const integrationLower = integration.toLowerCase()
    const actionType = defaultActions[integrationLower] || 'action'
    const capitalizedIntegration = integration.charAt(0).toUpperCase() + integration.slice(1)
    return {
      id: `step_${Date.now()}`,
      name: `${capitalizedIntegration} ${actionType.replace('_', ' ')}`,
      type: 'action' as const,
      tool: integrationLower,
      toolIcon: `https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/${integrationLower}.svg`,
      description: `${actionType.replace('_', ' ')} via ${capitalizedIntegration}`,
      config: {},
      position: { x: 0, y: nodeCount * 100 },
    }
  }, [defaultActions])

  // Suggest alternatives for a removed integration
  const getSimilarIntegrations = React.useCallback((removed: string): string[] => {
    const categories: Record<string, string[]> = {
      messaging: ['slack', 'discord', 'whatsapp', 'whatsapp-business', 'telegram'],
      email: ['gmail', 'outlook'],
      storage: ['dropbox', 'googledrive', 'onedrive'],
      sheets: ['googlesheets', 'airtable', 'notion'],
      tasks: ['trello', 'asana', 'linear', 'github'],
      social: ['twitter', 'linkedin'],
    }
    const removedLower = removed.toLowerCase()
    for (const alts of Object.values(categories)) {
      if (alts.includes(removedLower)) {
        return alts.filter(a => a !== removedLower)
      }
    }
    return []
  }, [])

  // Handle node edit command
  const handleNodeEditCommand = React.useCallback((cmd: NodeEditCommand) => {
    if (!activeWorkflowId) {
      addMessage(t('errors.noActiveWorkflow'), 'assistant')
      return true
    }

    const workflow = generatedWorkflows.get(activeWorkflowId)
    if (!workflow) {
      addMessage(t('errors.workflowNotFound'), 'assistant')
      return true
    }

    // === REPLACE: remove target + add replacement in one step ===
    if (cmd.type === 'replace' && cmd.target && cmd.integration) {
      const matches = findMatchingNodes(workflow, cmd.target)
      const capitalizedReplacement = cmd.integration.charAt(0).toUpperCase() + cmd.integration.slice(1)

      if (matches.length === 0) {
        addMessage(
          `I couldn't find a step matching "${cmd.target}" in your workflow.\n\n` +
          `**Current steps:** ${workflow.nodes.map(n => n.name).join(', ')}`,
          'assistant'
        )
      } else {
        const node = matches[0]
        const updatedNodes = workflow.nodes.filter(n => n.id !== node.id)
        const newNode = createNode(cmd.integration, updatedNodes.length)
        updatedNodes.push(newNode)

        const updatedWorkflow = { ...workflow, nodes: updatedNodes }
        setGeneratedWorkflows(prev => new Map(prev).set(activeWorkflowId, updatedWorkflow))

        addMessage(
          `Done! I've replaced **${node.name}** with **${capitalizedReplacement}** in your workflow.\n\n` +
          `Your workflow now has ${updatedNodes.length} step${updatedNodes.length !== 1 ? 's' : ''}.`,
          'assistant'
        )
      }
      return true
    }

    // === REMOVE (with optional alternative suggestions) ===
    if (cmd.type === 'remove' && cmd.target) {
      const matches = findMatchingNodes(workflow, cmd.target)

      if (matches.length === 0) {
        addMessage(
          `I couldn't find a step matching "${cmd.target}" in your workflow.\n\n` +
          `**Current steps:** ${workflow.nodes.map(n => n.name).join(', ')}`,
          'assistant'
        )
      } else if (matches.length === 1) {
        const node = matches[0]
        const isTrigger = node.type === 'trigger'

        const updatedNodes = workflow.nodes.filter(n => n.id !== node.id)
        const updatedWorkflow = { ...workflow, nodes: updatedNodes }
        setGeneratedWorkflows(prev => new Map(prev).set(activeWorkflowId, updatedWorkflow))

        let responseMsg = `Got it! I've removed **"${node.name}"** from your workflow.`

        if (isTrigger) {
          responseMsg += `\n\n⚠️ **Note:** This was the trigger. Your workflow won't start automatically now.`
        }

        // Suggest alternatives when user says "I don't have X"
        if (cmd.suggestAlternative && node.tool) {
          const alternatives = getSimilarIntegrations(node.tool)
          if (alternatives.length > 0) {
            responseMsg += `\n\nWant to use something else instead? You can say:\n`
            responseMsg += alternatives.map(alt => {
              const cap = alt.charAt(0).toUpperCase() + alt.slice(1)
              return `- "**use ${cap} instead**"`
            }).join('\n')
          }
        }

        responseMsg += `\n\nYour workflow now has ${updatedNodes.length} step${updatedNodes.length !== 1 ? 's' : ''}.`

        addMessage(responseMsg, 'assistant')
      } else {
        addMessage(
          `I found ${matches.length} steps matching "${cmd.target}":\n\n` +
          matches.map((n, i) => `${i + 1}. **${n.name}** (${n.tool || 'unknown'})`).join('\n') +
          `\n\nPlease be more specific, e.g., "remove ${matches[0].name}"`,
          'assistant'
        )
      }
      return true
    }

    // === ADD ===
    if (cmd.type === 'add' && cmd.integration) {
      const newNode = createNode(cmd.integration, workflow.nodes.length)

      const updatedWorkflow = { ...workflow, nodes: [...workflow.nodes, newNode] }
      setGeneratedWorkflows(prev => new Map(prev).set(activeWorkflowId, updatedWorkflow))

      addMessage(
        `✓ Added **${newNode.name}** to your workflow.\n\n` +
        `Your workflow now has ${updatedWorkflow.nodes.length} steps. ` +
        `Click "Execute Workflow" on the card to run it!`,
        'assistant'
      )
      return true
    }

    return false
  }, [activeWorkflowId, generatedWorkflows, addMessage, findMatchingNodes, createNode, getSimilarIntegrations])

  // Handle sending a message with REAL AI processing
  const handleSend = React.useCallback(
    async (content: string) => {
      console.log('[ChatContainer] handleSend called with:', content)

      // Check for node edit command FIRST (before adding message)
      const editCmd = parseNodeEditCommand(content)
      if (editCmd) {
        addMessage(content, 'user')  // Show user message
        handleNodeEditCommand(editCmd)
        setIsLoading(false)
        return
      }

      // Add user message
      addMessage(content, 'user')
      setIsLoading(true)

      // Record chat event for persistent memory
      userMemoryService.recordEvent('chat_sent')

      try {
        // If we're in question-asking mode, collect the answer
        if (conversationState === 'asking_questions' && pendingQuestions.length > 0) {
          const currentQuestion = pendingQuestions[currentQuestionIndex]
          const updatedInfo = { ...collectedInfo, [currentQuestion.id]: content }
          setCollectedInfo(updatedInfo)

          // Check if we have more questions
          if (currentQuestionIndex < pendingQuestions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1)
            const nextQuestion = pendingQuestions[currentQuestionIndex + 1]

            addMessage(nextQuestion.question, 'assistant')
            setIsLoading(false)
            return
          } else {
            // All questions answered - generate workflow
            setConversationState('generating')
            addMessage(
              "**Perfect!** I have all the information I need. Let me build your workflow...",
              'assistant'
            )

            // Generate workflow with collected info
            if (currentIntent) {
              try {
                const workflow = await nexusWorkflowEngine.buildWorkflow({
                  intent: currentIntent,
                  collectedInfo: updatedInfo,
                  userMessage: content,
                  persona: 'User'
                })

                // Store workflow with a unique ID for display
                const workflowDisplayId = `workflow-${Date.now()}`
                setGeneratedWorkflows(prev => new Map(prev).set(workflowDisplayId, workflow))

                const workflowSummary = `**Your workflow is ready!** 🎉\n\n` +
                  `**${workflow.name}**\n\n` +
                  `${workflow.description}\n\n` +
                  `**Steps:**\n${workflow.nodes.map((n, i) => `${i + 1}. ${n.name}`).join('\n')}\n\n` +
                  `[WORKFLOW_PREVIEW:${workflowDisplayId}]\n\n` +
                  `Click **Execute Workflow** to run it now, or open the full visualization!`

                addMessage(workflowSummary, 'assistant')

                // Reset state
                setConversationState('idle')
                setCurrentIntent(null)
                setPendingQuestions([])
                setCurrentQuestionIndex(0)
                setCollectedInfo({})
              } catch (workflowError) {
                console.error('[ChatContainer] Workflow generation error:', workflowError)
                addMessage(
                  t('errors.workflowGenerationFailed'),
                  'assistant'
                )
                setConversationState('idle')
              }
            }
            setIsLoading(false)
            return
          }
        }

        // ======================================================================
        // HYBRID APPROACH: Try Claude AI first, fallback to templates
        // Claude = Natural conversation + understanding
        // Templates = Reliable workflow structure generation
        // ======================================================================

        console.log('[ChatContainer] Trying Claude AI first...', { chatMode })

        try {
          // Finding #13: Sync persisted messages into NexusAIService before every Claude call
          // This fixes post-refresh amnesia - Claude remembers the full conversation
          nexusAIService.setConversationHistory(
            messages.map(m => ({ role: m.role, content: m.content }))
          )

          // Finding #14: Create a placeholder assistant message for streaming updates
          // @NEXUS-FIX-190: Initialize with "Nexus is thinking..." to prevent ANY raw JSON flash - DO NOT REMOVE
          // Previously initialized as empty string (''), which allowed a brief window where raw JSON tokens
          // could render before the detection at FIX-150/FIX-188 kicks in.
          // Now the user always sees a friendly placeholder from the very start.
          const streamingMsg = addMessage('Nexus is thinking...', 'assistant')
          streamingMessageIdRef.current = streamingMsg.id
          updateMessage(streamingMsg.id, { isStreaming: true })
          // Hide the ThinkingIndicator since we have a streaming message
          setIsLoading(false)

          // Accumulate streamed text for the onToken callback
          let streamedText = ''
          // @NEXUS-FIX-150: Track if response looks like workflow JSON to hide raw code from users - DO NOT REMOVE
          let looksLikeWorkflowJSON = false
          // @NEXUS-FIX-190: Track whether we've received the first meaningful token - DO NOT REMOVE
          let firstTokenReceived = false

          // Try streaming first, falls back to non-streaming internally
          const aiResponse = await nexusAIService.chatStream(
            content,
            (token: string) => {
              // Incrementally update the placeholder message with each token
              streamedText += token
              if (streamingMessageIdRef.current) {
                // @NEXUS-FIX-150: Detect JSON workflow responses and show friendly placeholder - DO NOT REMOVE
                // Users should never see raw JSON like {"shouldGenerateWorkflow":true,"workflowSpec":...}
                // @NEXUS-FIX-160: Improved JSON detection - covers ALL AI JSON responses, not just workflow ones - DO NOT REMOVE
                if (!looksLikeWorkflowJSON) {
                  const trimmed = streamedText.trimStart()
                  // Detect ANY JSON response from the AI (all Claude responses are JSON-formatted)
                  // This prevents raw JSON from ever being shown during streaming
                  // @NEXUS-FIX-163: Detect JSON from first character - DO NOT REMOVE
                  // Old code had `trimmed.length > 3` which allowed 1-3 raw JSON tokens to flash
                  // @NEXUS-FIX-188: Also detect ```json wrapper and "``` prefix - DO NOT REMOVE
                  if (trimmed.startsWith('{') || trimmed.startsWith('```') || trimmed.startsWith('"')) {
                    looksLikeWorkflowJSON = true
                  }
                }

                if (looksLikeWorkflowJSON) {
                  // @NEXUS-FIX-160: While streaming JSON, try to extract "message" field progressively - DO NOT REMOVE
                  // This shows the human-readable part in real-time instead of a static placeholder
                  const msgMatch = streamedText.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/i)
                  let placeholder: string
                  if (streamedText.includes('"shouldGenerateWorkflow":true') || streamedText.includes('"shouldGenerateWorkflow": true')) {
                    placeholder = '✨ Building your workflow...'
                  } else if (msgMatch) {
                    // Show the extracted message text during streaming
                    placeholder = msgMatch[1]
                      .replace(/\\"/g, '"')
                      .replace(/\\n/g, '\n')
                      .replace(/\\t/g, '\t')
                      .replace(/\\\\/g, '\\')
                      .replace(/\\u([0-9a-fA-F]{4})/g, (_m: string, hex: string) => String.fromCharCode(parseInt(hex, 16)))
                  } else {
                    placeholder = 'Nexus is thinking...'
                  }
                  updateMessage(streamingMessageIdRef.current, {
                    content: placeholder,
                    isStreaming: true
                  })
                } else {
                  // @NEXUS-FIX-188: Double-check non-JSON stream for late JSON detection - DO NOT REMOVE
                  // Sometimes JSON arrives after initial non-JSON tokens (e.g., whitespace then {)
                  const recheck = streamedText.trimStart()
                  // @NEXUS-FIX-191: Mid-stream JSON detection - DO NOT REMOVE
                  // Claude sometimes outputs a text preamble BEFORE the JSON (e.g., "Great brief.\n```json\n{...}")
                  // The startsWith checks miss this since the text doesn't START with JSON markers.
                  // We add includes() checks for JSON markers that appear mid-stream.
                  if (recheck.startsWith('{') || recheck.startsWith('```') || recheck.includes('"shouldGenerateWorkflow"')
                    || recheck.includes('```json') || recheck.includes('```\n{')
                    || (recheck.includes('"message"') && recheck.includes('"intent"'))) {
                    looksLikeWorkflowJSON = true
                    // @NEXUS-FIX-191: Extract message from preamble text before JSON marker - DO NOT REMOVE
                    // If Claude wrote text before the JSON, show that text as the streaming message
                    const jsonStartIdx = recheck.indexOf('```json') !== -1 ? recheck.indexOf('```json')
                      : recheck.indexOf('```\n{') !== -1 ? recheck.indexOf('```\n{')
                      : recheck.indexOf('{"') !== -1 ? recheck.indexOf('{"')
                      : -1
                    const preamble = jsonStartIdx > 10 ? recheck.substring(0, jsonStartIdx).trim() : ''
                    updateMessage(streamingMessageIdRef.current, {
                      content: preamble || 'Nexus is thinking...',
                      isStreaming: true
                    })
                  } else {
                    // @NEXUS-FIX-190: Only show streaming text after confirming it's NOT JSON - DO NOT REMOVE
                    // Buffer first few characters to give JSON detection time to activate.
                    // For non-JSON (conversational) responses, replace "Nexus is thinking..." with actual text.
                    if (!firstTokenReceived && recheck.length < 3) {
                      // Still accumulating - keep showing "Nexus is thinking..." until we have enough to confirm
                      // This prevents any brief flash of partial tokens like `{` or `"`
                    } else {
                      firstTokenReceived = true
                      // @NEXUS-FIX-191: Strip any trailing JSON from visible streaming text - DO NOT REMOVE
                      // If text is being shown but JSON starts mid-stream, only show the text part
                      let visibleText = streamedText
                      const lateJsonIdx = streamedText.indexOf('```json')
                      if (lateJsonIdx > 0) {
                        visibleText = streamedText.substring(0, lateJsonIdx).trim()
                        looksLikeWorkflowJSON = true
                      }
                      updateMessage(streamingMessageIdRef.current, {
                        content: visibleText,
                        isStreaming: true
                      })
                    }
                  }
                }
              }
            },
            { chatMode, language: chatLanguage }
          )

          // Stream complete - mark message as no longer streaming
          if (streamingMessageIdRef.current) {
            updateMessage(streamingMessageIdRef.current, { isStreaming: false })
          }
          streamingMessageIdRef.current = null

          console.log('[ChatContainer] Claude AI response:', aiResponse)

          // @NEXUS-FIX-177: Update conversation phase from server response with semantic fallback - DO NOT REMOVE
          if ((aiResponse as any).conversationPhase) {
            setConversationPhase((aiResponse as any).conversationPhase)
          } else {
            // Semantic phase derivation: use response content signals, not just message count
            if (aiResponse.shouldGenerateWorkflow && aiResponse.workflowSpec) {
              // Has a workflow spec → either generating or refining
              const hasExistingWorkflow = messages.some(m => m.role === 'assistant' && m.content?.includes('[WORKFLOW_PREVIEW:'))
              setConversationPhase(hasExistingWorkflow ? 'refining' : 'generating')
            } else if (aiResponse.clarifyingQuestions && aiResponse.clarifyingQuestions.length > 0) {
              // Asking clarifying questions → clarifying phase
              setConversationPhase('clarifying')
            } else if (aiResponse.intent === 'consulting' || aiResponse.intent === 'clarifying') {
              // Consulting or clarifying intent → clarifying phase
              setConversationPhase('clarifying')
            } else {
              // Fallback to message count for edge cases
              const userMsgCount = messages.filter(m => m.role === 'user').length + 1
              if (userMsgCount <= 1) setConversationPhase('discovery')
              else if (userMsgCount <= 3) setConversationPhase('clarifying')
              else setConversationPhase('generating')
            }
          }

          // Store any custom integrations for display
          if (aiResponse.customIntegrations && aiResponse.customIntegrations.length > 0) {
            console.log('[ChatContainer] Custom integrations detected:', aiResponse.customIntegrations.map(c => c.displayName))
            for (const integration of aiResponse.customIntegrations) {
              setPendingCustomIntegrations(prev => new Map(prev).set(integration.appName, integration))
            }
          }

          // If Claude provided a pure text response (greeting, question, general chat)
          // and didn't indicate workflow generation is needed, use that directly
          if (!aiResponse.shouldGenerateWorkflow) {
            console.log('[ChatContainer] Claude handled naturally, no workflow needed')
            console.log('[ChatContainer] Intent:', aiResponse.intent, 'ClarifyingQuestions:', aiResponse.clarifyingQuestions)

            // @NEXUS-FIX-160: Arabic-safe JSON stripping - NEVER display raw JSON to users - DO NOT REMOVE
            let displayText = aiResponse.text
            // @NEXUS-FIX-188: Also strip ```json wrapper before JSON check - DO NOT REMOVE
            if (displayText) {
              displayText = displayText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '')
            }
            if (displayText && displayText.trim().startsWith('{')) {
              console.warn('[ChatContainer] Response looks like JSON, extracting message...')
              try {
                const parsed = JSON.parse(displayText)
                displayText = parsed.message || parsed.text || parsed.response ||
                             "I'm here to help you automate workflows. What would you like to create?"
              } catch {
                // If JSON parse fails, try Arabic-safe regex extraction
                // The (?:[^"\\]|\\.)* pattern correctly handles escaped chars AND Arabic Unicode
                const messageMatch = displayText.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/i)
                if (messageMatch) {
                  displayText = messageMatch[1]
                    .replace(/\\"/g, '"')
                    .replace(/\\n/g, '\n')
                    .replace(/\\t/g, '\t')
                    .replace(/\\\\/g, '\\')
                    .replace(/\\u([0-9a-fA-F]{4})/g, (_m: string, hex: string) => String.fromCharCode(parseInt(hex, 16)))
                } else {
                  // Last resort: strip JSON artifacts and keep readable text
                  displayText = displayText
                    .replace(/[{}":\[\]]/g, ' ')
                    .replace(/\\[nrt"\\]/g, ' ')
                    .replace(/\b(shouldGenerateWorkflow|workflowSpec|intent|confidence|steps|requiredIntegrations|estimatedTimeSaved|true|false|null)\b/gi, '')
                    .replace(/\s{2,}/g, ' ')
                    .trim()
                  if (!displayText || displayText.length < 5) {
                    displayText = "I'm here to help! What workflow would you like to create?"
                  }
                }
              }
            }

            // Handle CLARIFYING QUESTIONS - display as clickable options
            if (aiResponse.intent === 'clarifying' && aiResponse.clarifyingQuestions && aiResponse.clarifyingQuestions.length > 0) {
              console.log('[ChatContainer] Displaying clarifying questions:', aiResponse.clarifyingQuestions)

              // Add the questions as clickable chips/buttons using a special marker
              const questions = aiResponse.clarifyingQuestions
              displayText += `\n\n`

              // Show first question with clickable options
              const firstQuestion = questions[0]
              displayText += `**${firstQuestion.question}**\n\n`
              // @NEXUS-FIX-189: Unicode-safe base64 encoding for clarifying questions - DO NOT REMOVE
              // btoa() cannot handle emojis or Arabic text - use TextEncoder for Unicode safety
              const optionsData = {
                field: firstQuestion.field,
                options: firstQuestion.options,
                remainingQuestions: questions.slice(1)
              }
              try {
                const jsonStr = JSON.stringify(optionsData)
                const bytes = new TextEncoder().encode(jsonStr)
                const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('')
                const encodedData = btoa(binString)
                displayText += `[CLARIFYING_OPTIONS_B64:${encodedData}]\n`
              } catch (encodeErr) {
                console.warn('[ChatContainer] Base64 encoding failed, using fallback option display:', encodeErr)
                // Fallback: render options as plain text buttons
                for (const opt of firstQuestion.options) {
                  displayText += `- ${opt}\n`
                }
              }
            }

            // @NEXUS-FIX-175: Diagnostic tree injection for complaint responses without server-provided questions - DO NOT REMOVE
            // If server didn't provide clarifying questions but this is a complaint/diagnostic response,
            // inject structured diagnostic questions from the diagnostic tree framework
            if ((!aiResponse.clarifyingQuestions || aiResponse.clarifyingQuestions.length === 0) &&
                (aiResponse.intent === 'diagnostic' || aiResponse.intent === 'complaint' ||
                 ((aiResponse as any).diagnosticCategory))) {
              try {
                const diagCategory = (aiResponse as any).diagnosticCategory as string | undefined
                // Try to get user's industry from localStorage
                let userIndustry: string | undefined
                try {
                  const profileRaw = localStorage.getItem('nexus_business_profile')
                  if (profileRaw) {
                    const profile = JSON.parse(profileRaw)
                    userIndustry = profile.industry
                  }
                } catch { /* ignore */ }
                const tree = findDiagnosticTree(content, userIndustry, diagCategory)
                if (tree && tree.questions.length > 0) {
                  const firstQ = tree.questions[0]
                  displayText += `\n\n**${firstQ.question}**\n\n`
                  const optionsData = {
                    field: firstQ.field,
                    options: firstQ.options,
                    remainingQuestions: tree.questions.slice(1).map(q => ({
                      question: q.question,
                      options: q.options,
                      field: q.field
                    }))
                  }
                  // @NEXUS-FIX-189: Unicode-safe base64 for diagnostic tree questions - DO NOT REMOVE
                  const diagJsonStr = JSON.stringify(optionsData)
                  const diagBytes = new TextEncoder().encode(diagJsonStr)
                  const diagBinString = Array.from(diagBytes, (byte) => String.fromCodePoint(byte)).join('')
                  const encodedData = btoa(diagBinString)
                  displayText += `[CLARIFYING_OPTIONS_B64:${encodedData}]\n`
                  console.log('[ChatContainer] Injected diagnostic tree questions for category:', diagCategory)
                }
              } catch (e) { console.warn('[ChatContainer] Diagnostic tree injection failed:', e) }
            }

            // REMOVED: "Additional connections needed" section
            // Custom integrations are ONLY displayed inside WorkflowPreviewCard now.
            // During clarifying questions, the workflow hasn't been generated yet, so
            // showing API key requirements is premature and intimidating to users.
            // The integrations are stored in pendingCustomIntegrations state and will
            // be passed to WorkflowPreviewCard when the workflow is generated.

            // @NEXUS-FIX-176: Strategic consulting bridge - add Deep Dive button for complex strategic responses - DO NOT REMOVE
            const isComplexStrategic = aiResponse.intent === 'consulting' &&
              displayText.length > 100 &&
              !aiResponse.shouldGenerateWorkflow
            if (isComplexStrategic) {
              displayText += `\n\n[DEEP_DIVE_BUTTON]`
            }

            // Finding #14: Update the streaming placeholder with final display text
            // instead of adding a new message (we already created one for streaming)
            updateMessage(streamingMsg.id, { content: displayText, isStreaming: false })
            setIsLoading(false)
            return
          }

          // @NEXUS-FIX-160: Validate workflowSpec before creating card - DO NOT REMOVE
          // Prevents invalid/incomplete specs (e.g. from garbled Arabic JSON) from spawning broken cards
          if (aiResponse.workflowSpec) {
            const spec = aiResponse.workflowSpec
            const isValidSpec = spec.name &&
              spec.steps &&
              Array.isArray(spec.steps) &&
              spec.steps.length > 0 &&
              spec.steps.every((s: { id?: string; name?: string; tool?: string }) => s.id && s.name && s.tool)

            if (!isValidSpec) {
              console.warn('[ChatContainer] Invalid workflowSpec detected, suppressing workflow card:', spec)
              aiResponse.shouldGenerateWorkflow = false
              // Show just the message text, fall through to non-workflow display
              const fallbackText = aiResponse.text || "I'm here to help! What workflow would you like to create?"
              updateMessage(streamingMsg.id, { content: fallbackText, isStreaming: false })
              setIsLoading(false)
              return
            }
          }

          // @NEXUS-FIX-167: Gate card creation on unanswered clarifyingQuestions - DO NOT REMOVE
          // If Claude returned BOTH a workflowSpec AND clarifyingQuestions, suppress the card
          // and display the questions first. This prevents premature workflow generation when
          // the user hasn't answered diagnostic questions yet.
          if (aiResponse.shouldGenerateWorkflow && aiResponse.clarifyingQuestions && aiResponse.clarifyingQuestions.length > 0) {
            console.log('[ChatContainer] @NEXUS-FIX-167: Suppressing premature workflow card - clarifying questions pending:', aiResponse.clarifyingQuestions.length)
            aiResponse.shouldGenerateWorkflow = false
            // Fall through to the non-workflow display path which handles clarifyingQuestions
            let displayText = aiResponse.text || ''

            // Encode clarifying questions as clickable options
            for (const q of aiResponse.clarifyingQuestions) {
              const optionsData = {
                question: q.question || q,
                options: q.options || [],
                field: q.field || 'clarification',
                remainingQuestions: aiResponse.clarifyingQuestions.filter((cq: unknown) => cq !== q)
              }
              // @NEXUS-FIX-189: Unicode-safe base64 encoding (FIX-167 path) - DO NOT REMOVE
              const jsonStr167 = JSON.stringify(optionsData)
              const bytes167 = new TextEncoder().encode(jsonStr167)
              const binString167 = Array.from(bytes167, (byte) => String.fromCodePoint(byte)).join('')
              const encodedData = btoa(binString167)
              displayText += `[CLARIFYING_OPTIONS_B64:${encodedData}]\n`
            }

            updateMessage(streamingMsg.id, { content: displayText, isStreaming: false })
            setIsLoading(false)
            return
          }

          // Claude indicated workflow generation - use the workflowSpec if provided
          if (aiResponse.workflowSpec) {
            console.log('[ChatContainer] Claude wants to generate workflow:', aiResponse.workflowSpec)
            console.log('[ChatContainer] Confidence:', aiResponse.confidence, 'Assumptions:', aiResponse.assumptions, 'MissingInfo:', aiResponse.missingInfo)
            console.log('[ChatContainer] RefiningWorkflowId:', aiResponse.refiningWorkflowId, 'ActiveWorkflowId:', activeWorkflowId)

            const baseWorkflow = nexusAIService.specToWorkflow(aiResponse.workflowSpec)

            // Add confidence-based execution fields from AI response
            const workflow = {
              ...baseWorkflow,
              confidence: aiResponse.confidence,
              assumptions: aiResponse.assumptions,
              missingInfo: aiResponse.missingInfo
            }

            // WORKFLOW REFINEMENT: Check if we should update an existing workflow
            // Use refiningWorkflowId from AI response, or activeWorkflowId if user is modifying the active workflow
            const existingWorkflowId = aiResponse.refiningWorkflowId || activeWorkflowId
            const isRefinement = existingWorkflowId && generatedWorkflows.has(existingWorkflowId)

            let workflowDisplayId: string
            if (isRefinement) {
              // UPDATE existing workflow card instead of creating new
              console.log('[ChatContainer] REFINEMENT MODE: Updating existing workflow', existingWorkflowId)
              workflowDisplayId = existingWorkflowId
              setGeneratedWorkflows(prev => new Map(prev).set(workflowDisplayId, workflow))
            } else {
              // Create NEW workflow card
              workflowDisplayId = `workflow-${Date.now()}`
              setGeneratedWorkflows(prev => new Map(prev).set(workflowDisplayId, workflow))
              // Record workflow creation for persistent memory
              userMemoryService.recordEvent('workflow_created', {
                name: workflow.name,
                integrations: workflow.requiredIntegrations,
              })
            }

            // Set this as the active workflow for future refinements
            setActiveWorkflowId(workflowDisplayId)

            // Adjust message based on confidence and whether there are questions to answer
            const isHighConfidence = (aiResponse.confidence ?? 0.5) >= 0.85
            const hasMissingInfo = aiResponse.missingInfo && aiResponse.missingInfo.length > 0

            // Different messages for refinement vs new workflow
            let workflowSummary: string

            if (isRefinement) {
              // @NEXUS-FIX-065: REFINEMENT - Always include WORKFLOW_PREVIEW marker
              // Previously, refinements said "reflected above" without rendering a card,
              // which broke when there was no existing card (e.g., first answer to clarifying question)
              workflowSummary = `**Workflow updated!** ✨\n\n` +
                `I've modified the workflow based on your input.\n\n` +
                `**${workflow.name}** now has ${workflow.nodes.length} steps.\n\n` +
                `[WORKFLOW_PREVIEW:${workflowDisplayId}]`

              if (hasMissingInfo) {
                workflowSummary += `\n\nI still have a question to fine-tune it further.`
              }
            } else {
              // NEW WORKFLOW: Full summary with preview
              let ctaMessage = `Click **Execute Workflow** to run it now!`
              if (!isHighConfidence && hasMissingInfo) {
                ctaMessage = `Answer the questions below to fine-tune your workflow!`
              } else if (!isHighConfidence) {
                ctaMessage = `Review the assumptions above and click **Execute** when ready!`
              }

              workflowSummary = `**Your workflow is ready!** 🎉\n\n` +
                `**${workflow.name}**\n\n` +
                `${workflow.description}\n\n` +
                `**Steps:**\n${workflow.nodes.map((n, i) => `${i + 1}. ${n.name}`).join('\n')}\n\n` +
                `[WORKFLOW_PREVIEW:${workflowDisplayId}]\n\n` +
                ctaMessage

              // Custom integrations are now rendered inside WorkflowPreviewCard (no separate markers needed)
            }

            // Finding #14: Update the streaming placeholder with workflow summary
            updateMessage(streamingMsg.id, { content: workflowSummary, isStreaming: false })
            setIsLoading(false)
            return
          }
        } catch (claudeError) {
          console.warn('[ChatContainer] Claude AI failed, falling back to template system:', claudeError)
          // Finding #14: Clean up streaming message on failure - remove the empty placeholder
          if (streamingMessageIdRef.current) {
            updateMessage(streamingMessageIdRef.current, { content: '', isStreaming: false })
            streamingMessageIdRef.current = null
          }
          // Re-show loading for template fallback
          setIsLoading(true)
          // Fall through to template-based system below
        }

        // ======================================================================
        // FALLBACK: Template-based intent analysis
        // ======================================================================
        console.log('[ChatContainer] Using template-based intent analysis...')

        // Use NexusWorkflowEngine for template-based intent analysis
        const intentAnalysis = await nexusWorkflowEngine.analyzeIntent(content, {
          persona: 'User',
          history: messages.filter(m => m.role === 'user').map(m => m.content).slice(-3)
        })

        // Check confidence level
        if (intentAnalysis.confidence > 0.3) {
          setCurrentIntent(intentAnalysis)
          setCollectedInfo(intentAnalysis.extractedInfo)

          // Generate smart questions for missing info
          const questions = await nexusWorkflowEngine.generateQuestions(
            intentAnalysis,
            intentAnalysis.extractedInfo
          )

          if (questions.length === 0) {
            // Enough info - generate workflow directly
            setConversationState('generating')
            addMessage(
              `**Got it!** I understand you want to: *${intentAnalysis.understanding}*\n\nLet me build the perfect workflow for you...`,
              'assistant'
            )

            try {
              const workflow = await nexusWorkflowEngine.buildWorkflow({
                intent: intentAnalysis,
                collectedInfo: intentAnalysis.extractedInfo,
                userMessage: content,
                persona: 'User'
              })

              // Store workflow with a unique ID for display
              const workflowDisplayId = `workflow-${Date.now()}`
              setGeneratedWorkflows(prev => new Map(prev).set(workflowDisplayId, workflow))

              const workflowSummary = `**Your workflow is ready!** 🎉\n\n` +
                `**${workflow.name}**\n\n` +
                `${workflow.description}\n\n` +
                `**Steps:**\n${workflow.nodes.map((n, i) => `${i + 1}. ${n.name}`).join('\n')}\n\n` +
                `The workflow uses: ${intentAnalysis.suggestedTools.join(', ')}\n\n` +
                `[WORKFLOW_PREVIEW:${workflowDisplayId}]\n\n` +
                `Click **Execute Workflow** to run it now!`

              addMessage(workflowSummary, 'assistant')
              setConversationState('idle')
            } catch (workflowError) {
              console.error('[ChatContainer] Workflow generation error:', workflowError)
              addMessage(
                t('errors.workflowGenerationFallback', { understanding: intentAnalysis.understanding }),
                'assistant'
              )
            }
          } else {
            // Need more info - ask questions
            setConversationState('asking_questions')
            setPendingQuestions(questions)
            setCurrentQuestionIndex(0)

            let acknowledgment = `**Got it!** I'll help you ${intentAnalysis.understanding.toLowerCase()}.\n\n`
            acknowledgment += `Just ${questions.length} quick question${questions.length > 1 ? 's' : ''} to set this up:\n\n`
            acknowledgment += questions[0].question

            addMessage(acknowledgment, 'assistant')
          }
        } else {
          // Low confidence - provide helpful response
          addMessage(
            `I'd love to help with that! To build the perfect automation for you, could you tell me more about:\n\n` +
            `1. **What task** you want to automate?\n` +
            `2. **Which apps** should be involved (Gmail, Slack, Sheets, etc.)?\n` +
            `3. **What triggers** the workflow (time, event, manual)?\n\n` +
            `For example: "When I get an email from a client, save the attachments to Drive and notify me on Slack"`,
            'assistant'
          )
        }
      } catch (error) {
        console.error('[ChatContainer] Error processing message:', error)
        addMessage(
          t('errors.aiEngineFailed'),
          'assistant'
        )
      }

      setIsLoading(false)
    },
    [addMessage, updateMessage, setIsLoading, conversationState, pendingQuestions, currentQuestionIndex, collectedInfo, currentIntent, messages]
  )

  // Handle suggestion click
  const handleSuggestionClick = React.useCallback(
    (prompt: string) => {
      handleSend(prompt)
    },
    [handleSend]
  )

  // Handle onboarding suggested prompt send
  const handleSuggestionSend = React.useCallback(() => {
    if (onboardingSuggestion) {
      OnboardingPromptService.dismiss()
      setOnboardingSuggestion(null)
      handleSend(onboardingSuggestion.prompt)
    }
  }, [onboardingSuggestion, handleSend])

  // Handle new chat - also clear AI service history to prevent cross-session bleed
  const handleNewChat = React.useCallback(() => {
    setChatMode('standard')
    nexusAIService.clearHistory()
    startNewSession()
  }, [startNewSession])

  // Handle "Think with me" mode
  const handleThinkWithMe = React.useCallback(() => {
    setChatMode('think_with_me')
    startNewSession()
  }, [startNewSession])

  // Handle clear history
  const handleClearHistory = React.useCallback(() => {
    clearMessages()
  }, [clearMessages])

  const hasMessages = messages.length > 0

  return (
    <div
      className={cn(
        'flex flex-col h-screen',
        'bg-surface-950',
        className
      )}
    >
      {/* Header */}
      <ChatHeader
        onNewChat={handleNewChat}
        onThinkWithMe={handleThinkWithMe}
        onToggleDashboard={onToggleDashboard}
        onClearHistory={handleClearHistory}
        showDashboardButton={showDashboardButton}
        sessionTitle={currentSession?.title}
        chatLanguage={chatLanguage}
        onLanguageToggle={setChatLanguage}
      />

      {/* Think with me mode indicator */}
      {chatMode === 'think_with_me' && (
        <div className="flex justify-center px-4 py-2 bg-purple-500/5 border-b border-purple-500/20">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full">
            <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-xs text-purple-300 font-medium">{t('chat.thinkWithMe')}</span>
            <span className="text-xs text-purple-400/70">{t('chat.focusedMode')}</span>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-surface-700 hover:scrollbar-thumb-surface-600"
      >
        {hasMessages ? (
          <div className="max-w-4xl mx-auto">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                renderEmbeddedContent={renderEmbeddedContent}
                renderWorkflowPreview={(workflowId: string) => {
                  const workflow = generatedWorkflows.get(workflowId)
                  if (!workflow) return null

                  // Get custom integrations relevant to this workflow
                  const workflowCustomIntegrations = Array.from(pendingCustomIntegrations.values()).filter(
                    integration => workflow.nodes.some(
                      (n: { tool?: string }) => n.tool?.toLowerCase() === integration.appName.toLowerCase() ||
                        n.tool?.toLowerCase().includes(integration.appName.toLowerCase().replace('_', ''))
                    )
                  )

                  return (
                    <WorkflowPreviewCard
                      workflow={{
                        id: workflowId,
                        name: workflow.name,
                        description: workflow.description,
                        nodes: workflow.nodes.map((n: { id: string; name: string; type?: string; tool?: string }) => ({
                          id: n.id,
                          name: n.name,
                          type: n.type || 'action',
                          integration: n.tool,
                        })),
                        confidence: workflow.confidence,
                        assumptions: workflow.assumptions,
                        missingInfo: workflow.missingInfo,
                        // @NEXUS-FIX-026: Pass collectedParams for auto-retry after parameter collection - DO NOT REMOVE
                        collectedParams: workflow.collectedParams,
                      }}
                      customIntegrations={workflowCustomIntegrations}
                      autoExecute={false}
                      chatLanguage={chatLanguage}
                      onExecutionComplete={(success) => {
                        console.log(`[ChatContainer] Workflow ${workflowId} execution:`, success ? 'SUCCESS' : 'FAILED')
                      }}
                      onMissingInfoSelect={(field, value) => {
                        console.log(`[ChatContainer] Missing info answered: ${field} = ${value}`)
                        // @NEXUS-FIX-026: Update workflow locally instead of regenerating - DO NOT REMOVE
                        // Fix: User answers to missingInfo questions were causing infinite workflow regeneration
                        // Solution: Update the workflow's missingInfo and collectedParams directly

                        // @NEXUS-FIX-026: Detect action commands vs actual parameter values - DO NOT REMOVE
                        const valueLower = value.toLowerCase()
                        const isRetryAction = valueLower.includes('retry') || valueLower === 'retry now'
                        const isHelpAction = valueLower.includes('help') || valueLower.includes('describe') || valueLower.includes('troubleshoot')

                        // Handle retry actions - just acknowledge, WorkflowPreviewCard handles the actual retry
                        if (isRetryAction) {
                          console.log(`[ChatContainer] Retry action detected: ${value}`)
                          addMessage(t('chat.retrying'), 'assistant')
                          // Signal retry by updating collectedParams with a retry flag
                          setGeneratedWorkflows(prev => {
                            const updated = new Map(prev)
                            const existingWorkflow = updated.get(workflowId)
                            if (existingWorkflow) {
                              const collectedParams = { ...(existingWorkflow.collectedParams || {}), _retryRequested: Date.now().toString() }
                              updated.set(workflowId, { ...existingWorkflow, collectedParams })
                            }
                            return updated
                          })
                          return
                        }

                        // Handle help actions - send to AI for guidance
                        if (isHelpAction) {
                          console.log(`[ChatContainer] Help action detected: ${value}`)
                          const workflow = generatedWorkflows.get(workflowId)
                          const failedStepInfo = workflow?.nodes?.find((n) => (n as { status?: string }).status === 'error')
                          handleSend(`I need help with my workflow "${workflow?.name || 'workflow'}". The step "${failedStepInfo?.name || 'a step'}" failed. Please help me troubleshoot this.`)
                          return
                        }

                        // @NEXUS-FIX-027: Handle "Send to Myself" - replace placeholder with actual user email - DO NOT REMOVE
                        // Problem: Button sends "Send to my email address" which isn't a valid email, causing infinite retry loop
                        // Solution: Detect this pattern and replace with actual user email from auth context
                        let actualValue = value
                        const isSendToMyselfPattern = valueLower.includes('send to my email') ||
                                                       valueLower.includes('send to myself') ||
                                                       valueLower === 'myself' ||
                                                       valueLower.includes('my email address')

                        if (isSendToMyselfPattern) {
                          if (userEmail) {
                            console.log(`[ChatContainer] "Send to Myself" detected, using user email: ${userEmail}`)
                            actualValue = userEmail
                          } else {
                            console.log(`[ChatContainer] "Send to Myself" detected but no user email available`)
                            addMessage(t('errors.noEmailFound'), 'assistant')
                            return
                          }
                        }

                        // Normal parameter update
                        // @NEXUS-FIX-026: Create NEW object for collectedParams to trigger React state change - DO NOT REMOVE
                        setGeneratedWorkflows(prev => {
                          const updated = new Map(prev)
                          const existingWorkflow = updated.get(workflowId)
                          if (existingWorkflow) {
                            // Remove the answered question from missingInfo
                            const updatedMissingInfo = (existingWorkflow.missingInfo || []).filter(
                              (item: { field: string }) => item.field !== field
                            )
                            // Store the collected parameter value - MUST create new object for React to detect change
                            // @NEXUS-FIX-027: Use actualValue (may be user email if "Send to Myself" was clicked)
                            const collectedParams = {
                              ...(existingWorkflow.collectedParams || {}),
                              [field]: actualValue,
                              _lastUpdated: Date.now().toString() // Force change detection
                            }

                            updated.set(workflowId, {
                              ...existingWorkflow,
                              missingInfo: updatedMissingInfo,
                              collectedParams,
                              // Increase confidence as we collect more info
                              confidence: Math.min(0.95, (existingWorkflow.confidence || 0.7) + 0.05)
                            })
                            console.log(`[ChatContainer] Updated workflow ${workflowId}: ${field}=${actualValue}, remaining questions: ${updatedMissingInfo.length}`)
                          }
                          return updated
                        })

                        // @NEXUS-FIX-061: Keep workflow card at end of chat - DO NOT REMOVE
                        // Problem: Adding chat messages here pushed the workflow card UP in the chat
                        // Solution: Don't add chat messages for parameter collection - the WorkflowPreviewCard
                        // shows collected params internally via the "Collected Information" section.
                        // This keeps the workflow card as the last item in the chat thread.
                        // (Removed: addMessage(`✓ Got it! Setting **${field}** to: ${actualValue}`, 'assistant'))
                      }}
                      onCustomIntegrationKeySubmit={async (appName, apiKey) => {
                        // Submit API key to backend
                        try {
                          const response = await fetch('/api/custom-integrations/store', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ appName, apiKey })
                          })
                          return response.ok
                        } catch {
                          console.error('[ChatContainer] Failed to store API key')
                          return false
                        }
                      }}
                      // Node editing callbacks - state managed by ChatContainer
                      onNodeRemove={(nodeId) => {
                        console.log(`[ChatContainer] Node removed: ${nodeId}`)
                        setGeneratedWorkflows(prev => {
                          const updated = new Map(prev)
                          const existingWorkflow = updated.get(workflowId)
                          if (existingWorkflow) {
                            const updatedNodes = existingWorkflow.nodes.filter(n => n.id !== nodeId)
                            updated.set(workflowId, { ...existingWorkflow, nodes: updatedNodes })
                          }
                          return updated
                        })
                      }}
                      onNodeAdd={(integration, actionType) => {
                        console.log(`[ChatContainer] Node added: ${integration} - ${actionType}`)
                        const capitalizedIntegration = integration.charAt(0).toUpperCase() + integration.slice(1)
                        setGeneratedWorkflows(prev => {
                          const updated = new Map(prev)
                          const existingWorkflow = updated.get(workflowId)
                          if (existingWorkflow) {
                            const newNode = {
                              id: `step_${Date.now()}`,
                              name: `${capitalizedIntegration} ${actionType.replace('_', ' ')}`,
                              type: 'action' as const,
                              tool: integration.toLowerCase(),
                              toolIcon: `https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/${integration.toLowerCase()}.svg`,
                              description: `${actionType.replace('_', ' ')} via ${capitalizedIntegration}`,
                              config: {},
                              position: { x: 0, y: existingWorkflow.nodes.length * 100 },
                            }
                            updated.set(workflowId, { ...existingWorkflow, nodes: [...existingWorkflow.nodes, newNode] })
                          }
                          return updated
                        })
                      }}
                    />
                  )
                }}
                renderClarifyingOptions={(data) => {
                  // Use the new component with inline custom input support
                  return (
                    <ClarifyingOptionsWithCustomInput
                      data={data}
                      onSelect={(value) => handleSend(value)}
                    />
                  )
                }}
                renderCustomIntegration={(appName: string) => {
                  const integration = pendingCustomIntegrations.get(appName)
                  if (!integration) return null
                  return (
                    <APIKeyAcquisitionCard
                      appName={integration.appName}
                      displayName={integration.displayName}
                      apiDocsUrl={integration.apiDocsUrl}
                      apiKeyUrl={integration.apiKeyUrl}
                      steps={integration.steps}
                      keyHint={integration.keyHint}
                      category={integration.category}
                      onConnected={(connectedApp) => {
                        console.log(`[ChatContainer] Custom integration connected: ${connectedApp}`)
                        // Remove from pending integrations
                        setPendingCustomIntegrations(prev => {
                          const updated = new Map(prev)
                          updated.delete(connectedApp)
                          return updated
                        })
                        // Add success message
                        addMessage(`Great news! **${integration.displayName}** is now connected and ready to use in your workflows! 🎉`, 'assistant')
                      }}
                      onDismiss={() => {
                        // Remove from pending integrations
                        setPendingCustomIntegrations(prev => {
                          const updated = new Map(prev)
                          updated.delete(appName)
                          return updated
                        })
                      }}
                    />
                  )
                }}
              />
            ))}
            {/* @NEXUS-FIX-177: Persistent conversation phase indicator - DO NOT REMOVE */}
            {/* Shows during loading AND persists after response until next user input */}
            {(isLoading || (messages.length > 0 && conversationPhase !== 'discovery')) && (
              <div className="px-4 py-1">
                <span className={`text-xs font-medium transition-opacity duration-300 ${isLoading ? 'text-surface-500' : 'text-surface-400'}`}>
                  {conversationPhase === 'discovery' && (isLoading ? '🔍 Understanding your needs...' : '🔍 Discovery phase')}
                  {conversationPhase === 'clarifying' && (isLoading ? '💡 Gathering details...' : '💡 Clarifying your requirements')}
                  {conversationPhase === 'generating' && (isLoading ? '⚡ Building your workflow...' : '⚡ Ready to build')}
                  {conversationPhase === 'refining' && (isLoading ? '✨ Fine-tuning...' : '✨ Refining your workflow')}
                </span>
              </div>
            )}
            {isLoading && <ThinkingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <EmptyState onSuggestionClick={handleSuggestionClick} />
        )}
      </div>

      {/* Onboarding Suggested Prompt Card */}
      {onboardingSuggestion && !hasMessages && (
        <div className="flex-shrink-0 px-3 sm:px-4">
          <div className="max-w-4xl mx-auto">
            <div
              className={cn(
                'relative p-4 rounded-xl mb-2',
                'bg-gradient-to-r from-nexus-500/10 via-accent-nexus-500/10 to-purple-500/10',
                'border border-nexus-500/30',
                'backdrop-blur-sm',
                'animate-in fade-in slide-in-from-bottom-2 duration-500'
              )}
            >
              {/* Dismiss button */}
              <button
                onClick={handleSuggestionDismiss}
                className="absolute top-2.5 right-2.5 p-1 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-700/50 transition-colors"
                aria-label="Dismiss suggestion"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-start gap-3 pr-6">
                <div className="flex-shrink-0 p-2 rounded-lg bg-nexus-500/20">
                  <Sparkles className="w-4 h-4 text-nexus-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-nexus-400 mb-1">
                    Suggested for you
                  </p>
                  <p className="text-sm text-surface-200 leading-relaxed">
                    {onboardingSuggestion.prompt}
                  </p>
                  <p className="text-xs text-surface-400 mt-1.5">
                    {onboardingSuggestion.description}
                  </p>
                </div>
                <button
                  onClick={handleSuggestionSend}
                  className={cn(
                    'flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg',
                    'bg-gradient-to-r from-nexus-500 to-accent-nexus-500',
                    'text-white text-sm font-medium',
                    'hover:shadow-lg hover:shadow-nexus-500/25',
                    'transition-all duration-200',
                    'active:scale-95'
                  )}
                >
                  <Send className="w-3.5 h-3.5" />
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-surface-800 bg-surface-900/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <ChatInput
            onSend={handleSend}
            disabled={isLoading}
            placeholder={t('chat.describeWorkflow')}
            defaultLanguage={chatLanguage}
            onLanguageChange={setChatLanguage}
          />
        </div>
      </div>
    </div>
  )
}

export default ChatContainer
