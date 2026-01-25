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
import { cn } from '@/lib/utils'
import { MessageSquare, Sparkles, Zap, ArrowRight } from 'lucide-react'
import { ChatHeader } from './ChatHeader'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { WorkflowPreviewCard } from './WorkflowPreviewCard'
import { APIKeyAcquisitionCard } from './APIKeyAcquisitionCard'
import { useChatState } from './useChatState'
import type { EmbeddedContent } from './types'
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

const SUGGESTIONS: SuggestionCard[] = [
  {
    icon: <Zap className="w-5 h-5 text-amber-500" />,
    title: 'Create a workflow',
    description: 'Automate repetitive tasks',
    prompt: 'Help me create a workflow to automate email responses',
  },
  {
    icon: <MessageSquare className="w-5 h-5 text-blue-500" />,
    title: 'Connect apps',
    description: 'Integrate your favorite tools',
    prompt: 'How do I connect Slack with my Gmail?',
  },
  {
    icon: <Sparkles className="w-5 h-5 text-purple-500" />,
    title: 'Explore templates',
    description: 'Start with pre-built automations',
    prompt: 'Show me popular workflow templates',
  },
]

interface EmptyStateProps {
  onSuggestionClick: (prompt: string) => void
}

function EmptyState({ onSuggestionClick }: EmptyStateProps): React.ReactElement {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-nexus-500 to-accent-nexus-500 flex items-center justify-center shadow-lg shadow-nexus-500/30">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-surface-100 mb-3">
          How can I help you today?
        </h1>
        <p className="text-surface-400 max-w-md text-base">
          Create powerful automations with natural language. Just describe what you want to automate.
        </p>
      </div>

      {/* Suggestion Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full">
        {SUGGESTIONS.map((suggestion, index) => (
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
  return (
    <div className="flex gap-3 sm:gap-4 px-3 sm:px-4 py-4 sm:py-6 bg-surface-800/30 border-l-2 border-nexus-500/30">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-nexus-500 to-accent-nexus-500 flex items-center justify-center shadow-lg">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-surface-300 text-sm font-medium">
          Nexus AI is thinking
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
            Send
          </button>
        </div>
        <button
          onClick={() => {
            setShowCustomInput(false)
            setCustomValue('')
          }}
          className="text-xs text-surface-400 hover:text-surface-200 transition-colors"
        >
          ← Back to options
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
        {hasCustomOptionFromAI ? 'Custom...' : 'Other...'}
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
  const {
    messages,
    isLoading,
    currentSession,
    addMessage,
    clearMessages,
    startNewSession,
    setIsLoading,
    loadSession,
  } = useChatState()

  // @NEXUS-FIX-027: Get user email for "Send to Myself" button - DO NOT REMOVE
  const { user, userProfile } = useAuth()
  const userEmail = userProfile?.email || user?.email || null

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

  // Handle sending a message with REAL AI processing
  const handleSend = React.useCallback(
    async (content: string) => {
      console.log('[ChatContainer] handleSend called with:', content)
      // Add user message
      addMessage(content, 'user')
      setIsLoading(true)

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
                  "I encountered an issue creating the workflow. Let me try a different approach.\n\nCould you describe what you'd like to automate in more detail?",
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

        console.log('[ChatContainer] Trying Claude AI first...')

        try {
          // Try Claude AI for natural conversation
          const aiResponse = await nexusAIService.chat(content)
          console.log('[ChatContainer] Claude AI response:', aiResponse)

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

            // SAFETY CHECK: Never display raw JSON to users
            let displayText = aiResponse.text
            if (displayText && displayText.trim().startsWith('{')) {
              console.warn('[ChatContainer] Response looks like JSON, extracting message...')
              try {
                const parsed = JSON.parse(displayText)
                displayText = parsed.message || parsed.text || parsed.response ||
                             "I'm here to help you automate workflows. What would you like to create?"
              } catch {
                // If JSON parse fails, try regex extraction
                const messageMatch = displayText.match(/"message"\s*:\s*"([^"]+)"/i)
                displayText = messageMatch ? messageMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') :
                             "I'm here to help you automate workflows. What would you like to create?"
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
              // Base64 encode the JSON to avoid parsing issues with nested brackets
              const optionsData = {
                field: firstQuestion.field,
                options: firstQuestion.options,
                remainingQuestions: questions.slice(1)
              }
              const encodedData = btoa(JSON.stringify(optionsData))
              displayText += `[CLARIFYING_OPTIONS_B64:${encodedData}]\n`
            }

            // REMOVED: "Additional connections needed" section
            // Custom integrations are ONLY displayed inside WorkflowPreviewCard now.
            // During clarifying questions, the workflow hasn't been generated yet, so
            // showing API key requirements is premature and intimidating to users.
            // The integrations are stored in pendingCustomIntegrations state and will
            // be passed to WorkflowPreviewCard when the workflow is generated.

            addMessage(displayText, 'assistant')
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
            }

            // Set this as the active workflow for future refinements
            setActiveWorkflowId(workflowDisplayId)

            // Adjust message based on confidence and whether there are questions to answer
            const isHighConfidence = (aiResponse.confidence ?? 1) >= 0.85
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

            addMessage(workflowSummary, 'assistant')
            setIsLoading(false)
            return
          }
        } catch (claudeError) {
          console.warn('[ChatContainer] Claude AI failed, falling back to template system:', claudeError)
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
                `I understand you want to: *${intentAnalysis.understanding}*\n\nI can help you set this up! What specific tools or apps would you like to use?`,
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
          "I'm having trouble connecting to the AI engine. Let me help you another way!\n\n" +
          "You can:\n" +
          "1. **Browse templates** - Pre-built workflows ready to use\n" +
          "2. **Connect apps** - Set up your integrations first\n" +
          "3. **Try again** - Describe your automation need\n\n" +
          "What would you like to do?",
          'assistant'
        )
      }

      setIsLoading(false)
    },
    [addMessage, setIsLoading, conversationState, pendingQuestions, currentQuestionIndex, collectedInfo, currentIntent, messages]
  )

  // Handle suggestion click
  const handleSuggestionClick = React.useCallback(
    (prompt: string) => {
      handleSend(prompt)
    },
    [handleSend]
  )

  // Handle new chat
  const handleNewChat = React.useCallback(() => {
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
        onToggleDashboard={onToggleDashboard}
        onClearHistory={handleClearHistory}
        showDashboardButton={showDashboardButton}
        sessionTitle={currentSession?.title}
      />

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
                          addMessage(`🔄 Retrying the workflow...`, 'assistant')
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
                            addMessage(`❌ I couldn't find your email address. Please enter your email address manually.`, 'assistant')
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
            {isLoading && <ThinkingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <EmptyState onSuggestionClick={handleSuggestionClick} />
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-surface-800 bg-surface-900/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <ChatInput
            onSend={handleSend}
            disabled={isLoading}
            placeholder="Describe your workflow..."
          />
        </div>
      </div>
    </div>
  )
}

export default ChatContainer
