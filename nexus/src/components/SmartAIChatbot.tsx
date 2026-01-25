/**
 * SmartAIChatbot - Nexus-powered intelligent workflow generator
 *
 * Features:
 * - Nexus AI methodology for intelligent intent understanding
 * - AI-driven question generation (not keyword matching)
 * - Dynamic workflow building based on reasoning
 * - Real integrations via Composio/Rube OAuth
 * - Browser automation via embedded Playwright
 * - REAL workflow execution via WorkflowOrchestrator & ComposioExecutor
 *
 * Nexus = AI-Driven Workflow Automation Platform
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { usePersonalization } from '@/contexts/PersonalizationContext'
import { useWorkflowContext } from '@/contexts/WorkflowContext'
import {
  nexusWorkflowEngine,
  type IntentAnalysis,
  type SmartNexusQuestion,
} from '@/services/NexusWorkflowEngine'
import {
  type GeneratedWorkflow,
  EMBEDDED_TOOLS
} from '@/services/SmartWorkflowEngine'
// NEW: Real Claude AI service
import { nexusAIService } from '@/services/NexusAIService'
import { WorkflowFlowChart } from './WorkflowFlowChart'
// Real-world execution imports - types only for reference
import type {
  ExecutionEvent,
  WorkflowExecutionResult
} from '@/services/WorkflowExecutionEngine'
// User context extraction
import { useUserContext } from '@/lib/context/useUserContext'
// Voice input
import { useVoiceInput, type VoiceLanguage } from '@/hooks/useVoiceInput'
// REAL workflow engine for actual execution
import {
  workflowOrchestrator,
  type OrchestratorEvent,
  type GeneratedWorkflowJSON,
} from '@/lib/workflow-engine/orchestrator'

// Conversation states
type ConversationState =
  | 'greeting'
  | 'listening'
  | 'asking_questions'
  | 'generating_workflow'
  | 'presenting_workflow'
  | 'confirming_integrations'
  | 'executing_workflow'
  | 'execution_complete'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  type?: 'text' | 'workflow' | 'questions' | 'integrations' | 'analysis' | 'execution' | 'execution_result'
  workflow?: GeneratedWorkflow
  questions?: SmartNexusQuestion[]
  integrations?: string[]
  actions?: Array<{ label: string; action: string; primary?: boolean }>
  intentAnalysis?: IntentAnalysis // Nexus intent analysis
  executionResult?: WorkflowExecutionResult // Real execution result
  executionEvents?: ExecutionEvent[] // Live execution events
}

interface SmartAIChatbotProps {
  position?: 'bottom-right' | 'bottom-left' | 'side-panel'
}

// Storage keys for persistence across page navigation
const STORAGE_KEYS = {
  isOpen: 'nexus_chatbot_open',
  messages: 'nexus_chatbot_messages',
  conversationState: 'nexus_chatbot_state',
  currentIntent: 'nexus_chatbot_intent',
  collectedInfo: 'nexus_chatbot_info',
  pendingQuestions: 'nexus_chatbot_questions',
  currentQuestionIndex: 'nexus_chatbot_question_index',
}

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Uses DOMPurify with strict allowlist configuration.
 *
 * @param dirty - Untrusted HTML string to sanitize
 * @returns Sanitized HTML string safe for rendering
 */
const sanitizeHTML = (dirty: string): string => {
  // Configure DOMPurify for safe HTML sanitization
  // Allow only safe inline tags - no scripts, event handlers, or dangerous elements
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['strong', 'em', 'b', 'i', 'span', 'br'],
    ALLOWED_ATTR: ['class'],
    KEEP_CONTENT: true,
    // Disallow data: and javascript: URIs
    ALLOW_DATA_ATTR: false,
  }) as unknown as string
}

// Helper to safely parse JSON from localStorage
const getStoredValue = <T,>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Convert date strings back to Date objects for messages
      if (key === STORAGE_KEYS.messages && Array.isArray(parsed)) {
        return parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })) as T
      }
      return parsed
    }
  } catch (e) {
    console.warn(`Failed to parse stored value for ${key}:`, e)
  }
  return defaultValue
}

export function SmartAIChatbot({ position = 'bottom-right' }: SmartAIChatbotProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { persona, customPersonaLabel } = usePersonalization()
  // Get WorkflowContext for real backend execution
  const workflowContext = useWorkflowContext()
  // User context extraction hook
  const { extractFromMessage } = useUserContext({
    autoSave: true,
    minConfidence: 0.3,
  })

  // Hide chatbot for first-time users until onboarding is complete
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(() => {
    return localStorage.getItem('nexus_onboarding_complete') === 'true'
  })

  // Listen for onboarding completion
  useEffect(() => {
    const checkOnboarding = () => {
      const complete = localStorage.getItem('nexus_onboarding_complete') === 'true'
      if (complete !== isOnboardingComplete) {
        setIsOnboardingComplete(complete)
      }
    }
    // Check on storage changes (cross-tab) and periodically (same tab)
    window.addEventListener('storage', checkOnboarding)
    const interval = setInterval(checkOnboarding, 1000)
    return () => {
      window.removeEventListener('storage', checkOnboarding)
      clearInterval(interval)
    }
  }, [isOnboardingComplete])

  // Don't render chatbot until onboarding is complete
  if (!isOnboardingComplete) {
    return null
  }

  // Initialize state from localStorage for persistence across navigation
  // Note: AuthContext.signOut() clears all chatbot localStorage before re-render,
  // so we can simply read from localStorage without checking user IDs
  const [isOpen, setIsOpen] = useState(() => getStoredValue(STORAGE_KEYS.isOpen, false))
  const [messages, setMessages] = useState<Message[]>(() => getStoredValue(STORAGE_KEYS.messages, []))
  const [inputValue, setInputValue] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [conversationState, setConversationState] = useState<ConversationState>(() => {
    const stored = getStoredValue<ConversationState>(STORAGE_KEYS.conversationState, 'greeting')
    // Don't restore transient states - reset to listening if stuck in mid-process
    const transientStates: ConversationState[] = ['generating_workflow', 'executing_workflow']
    if (transientStates.includes(stored)) {
      return 'listening'
    }
    return stored
  })
  const [currentIntent, setCurrentIntent] = useState<IntentAnalysis | null>(() =>
    getStoredValue(STORAGE_KEYS.currentIntent, null)
  )
  const [collectedInfo, setCollectedInfo] = useState<Record<string, string>>(() =>
    getStoredValue(STORAGE_KEYS.collectedInfo, {})
  )
  const [pendingQuestions, setPendingQuestions] = useState<SmartNexusQuestion[]>(() =>
    getStoredValue(STORAGE_KEYS.pendingQuestions, [])
  )
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() =>
    getStoredValue(STORAGE_KEYS.currentQuestionIndex, 0)
  )
  const [executionProgress, setExecutionProgress] = useState<{
    completed: number
    total: number
    currentNode: string
    cost: number
  } | null>(null)

  // Workflow execution now handled by WorkflowContext (real backend execution)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Voice input integration
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    audioLevel: _audioLevel,
  } = useVoiceInput({
    defaultLanguage: 'en-US',
    autoDetectLanguage: true,
    onTranscript: (text: string, _lang: VoiceLanguage) => {
      setInputValue(text)
      // Auto-submit after voice input
      setTimeout(() => {
        if (text.trim() && !isProcessing) {
          processMessage(text.trim())
          setInputValue('')
        }
      }, 100)
    },
  })

  // Update input value with transcript as user speaks
  useEffect(() => {
    if (isListening && transcript) {
      setInputValue(transcript)
    }
  }, [isListening, transcript])

  // Persona display name
  const personaDisplayName = useMemo(() => {
    if (persona === 'custom' && customPersonaLabel) return customPersonaLabel
    const names: Record<string, string> = {
      doctor: 'Doctor', nurse: 'Nurse', therapist: 'Therapist',
      lawyer: 'Counselor', accountant: 'Accountant', executive: 'Executive',
      real_estate_agent: 'Agent', marketing_manager: 'Marketing Pro',
      software_developer: 'Developer', recruiter: 'Recruiter'
    }
    return names[persona] || 'there'
  }, [persona, customPersonaLabel])

  // Time-based greeting that stays in sync with dashboard
  const [currentTimeGreeting, setCurrentTimeGreeting] = useState(() => {
    const hour = new Date().getHours()
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  })

  // Update time greeting when period changes (check every minute)
  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours()
      const newGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
      setCurrentTimeGreeting(prev => prev !== newGreeting ? newGreeting : prev)
    }
    const interval = setInterval(checkTime, 60000)
    return () => clearInterval(interval)
  }, [])

  // Smart greeting based on time and persona - Enhanced conversational interface
  const getGreeting = useCallback(() => {
    const timeGreeting = currentTimeGreeting

    // Industry-specific examples based on persona
    const industryExamples: Record<string, string[]> = {
      doctor: [
        '"Send me a daily summary of patient appointments"',
        '"Auto-schedule follow-up reminders for patients"',
        '"Sync patient notes to our EMR when I complete a visit"',
      ],
      nurse: [
        '"Alert me when lab results come in for my patients"',
        '"Generate shift handoff reports automatically"',
        '"Track medication schedules and remind me before rounds"',
      ],
      lawyer: [
        '"Track billable hours and generate weekly invoices"',
        '"Alert me when court filing deadlines are approaching"',
        '"Summarize new case documents as they come in"',
      ],
      accountant: [
        '"Reconcile transactions from multiple bank accounts daily"',
        '"Generate monthly financial reports for all clients"',
        '"Alert me when invoices are overdue by 30 days"',
      ],
      executive: [
        '"Compile KPI dashboards from all departments weekly"',
        '"Schedule and prepare briefs for my upcoming meetings"',
        '"Track competitor news and summarize key updates"',
      ],
      marketing_manager: [
        '"Post our new blog content across all social channels"',
        '"Generate weekly campaign performance reports"',
        '"Track competitor social media mentions and trends"',
      ],
      software_developer: [
        '"Notify Slack when builds fail in CI/CD"',
        '"Generate sprint reports from JIRA every Friday"',
        '"Sync GitHub issues to our project management board"',
      ],
      real_estate_agent: [
        '"Alert me when new listings match my clients criteria"',
        '"Send follow-up emails to prospects after showings"',
        '"Generate monthly market reports for my newsletter"',
      ],
      recruiter: [
        '"Screen resumes and rank candidates by fit"',
        '"Schedule interviews and send calendar invites"',
        '"Send rejection emails to candidates not selected"',
      ],
      default: [
        '"Text me when someone emails me something urgent"',
        '"Save my Instagram photos to Google Drive automatically"',
        '"Remind me to call Mom every Sunday at 6pm"',
        '"Post my YouTube videos to Twitter when I upload"',
      ]
    }

    const examples = industryExamples[persona] || industryExamples.default

    return `${timeGreeting}, ${personaDisplayName}! I'm your AI workflow assistant.

**Just tell me what you'd like to automate in plain English:**

${examples.map(ex => `• ${ex}`).join('\n')}

I'll understand what you need, ask a few quick questions if needed, and build a working automation. What would you like to automate today?`
  }, [personaDisplayName, persona, currentTimeGreeting])

  // Initialize conversation
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'greeting',
        role: 'assistant',
        content: getGreeting(),
        timestamp: new Date(),
        type: 'text'
      }])
    }
  }, [isOpen, messages.length, getGreeting])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Detect when we just navigated to workflow-demo and show welcome message
  useEffect(() => {
    const justNavigated = localStorage.getItem('nexus_workflow_just_navigated')
    const isOnWorkflowDemo = location.pathname === '/workflow-demo'

    if (justNavigated === 'true' && isOnWorkflowDemo) {
      // Clear the flag immediately to prevent duplicate messages
      localStorage.removeItem('nexus_workflow_just_navigated')

      // Get the workflow name from localStorage
      try {
        const pendingWorkflow = localStorage.getItem('nexus_pending_workflow')
        const workflowData = pendingWorkflow ? JSON.parse(pendingWorkflow) : null
        const workflowName = workflowData?.name || 'Your workflow'

        // Add welcome message with slight delay for smooth transition
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: `welcome_review_${Date.now()}`,
            role: 'assistant',
            content: `**Welcome to your workflow!** 🎉\n\n` +
              `I've loaded **${workflowName}** for you to review.\n\n` +
              `Feel free to:\n` +
              `• **Ask me to make changes** - "Move the email step before Slack"\n` +
              `• **Add new steps** - "Add a filter for urgent messages only"\n` +
              `• **Adjust settings** - "Change the time to 9am instead"\n` +
              `• **Execute when ready** - Just click the Execute button!\n\n` +
              `What would you like to adjust?`,
            timestamp: new Date(),
            type: 'text'
          }])
          setConversationState('listening')
        }, 500)
      } catch (e) {
        console.error('[SmartAIChatbot] Failed to parse workflow for welcome message:', e)
      }
    }
  }, [location.pathname])

  // Focus input
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Persist state to localStorage for cross-page navigation
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.isOpen, JSON.stringify(isOpen))
  }, [isOpen])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.conversationState, JSON.stringify(conversationState))
  }, [conversationState])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.currentIntent, JSON.stringify(currentIntent))
  }, [currentIntent])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.collectedInfo, JSON.stringify(collectedInfo))
  }, [collectedInfo])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.pendingQuestions, JSON.stringify(pendingQuestions))
  }, [pendingQuestions])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.currentQuestionIndex, JSON.stringify(currentQuestionIndex))
  }, [currentQuestionIndex])


  // Detect if message is a simple greeting (not a task request)
  const isGreeting = useCallback((message: string): boolean => {
    const normalized = message.toLowerCase().trim()

    // Simple greetings (1-3 words)
    const simpleGreetings = [
      'hey', 'hi', 'hello', 'yo', 'sup', 'howdy', 'greetings',
      'good morning', 'good afternoon', 'good evening',
      'hey there', 'hi there', 'hello there',
      'whats up', "what's up", 'how are you', "how's it going"
    ]

    // Check if message is just a greeting
    if (simpleGreetings.some(greeting => normalized === greeting)) {
      return true
    }

    // Check if message is greeting + question (but not task)
    const greetingPhrases = ['hey', 'hi', 'hello', 'yo', 'howdy']
    const startsWithGreeting = greetingPhrases.some(g => normalized.startsWith(g + ' ') || normalized.startsWith(g + ','))

    // If starts with greeting AND no workflow keywords, it's conversational
    const workflowKeywords = [
      'automate', 'workflow', 'create', 'build', 'make', 'send', 'schedule',
      'remind', 'notify', 'post', 'sync', 'track', 'analyze', 'generate',
      'email', 'message', 'slack', 'gmail', 'calendar', 'sheets'
    ]

    const hasWorkflowKeyword = workflowKeywords.some(kw => normalized.includes(kw))

    if (startsWithGreeting && !hasWorkflowKeyword && normalized.length < 50) {
      return true
    }

    return false
  }, [])

  // Process user message using REAL Claude AI
  const processMessage = useCallback(async (message: string) => {
    console.log('[SmartAIChatbot] *** processMessage called with:', message)
    setIsProcessing(true)

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
      type: 'text'
    }
    setMessages(prev => [...prev, userMessage])

    // Try Claude AI first for ALL messages (including greetings)
    try {
      console.log('[SmartAIChatbot] *** About to call Claude AI...')
      const aiResponse = await nexusAIService.chat(message, { persona: personaDisplayName })

      // Check if Claude wants to generate a workflow
      if (aiResponse.shouldGenerateWorkflow && aiResponse.workflowSpec) {
        // Convert spec to GeneratedWorkflow and present it
        const workflow = nexusAIService.specToWorkflow(aiResponse.workflowSpec)

        // Create intent analysis for workflow context
        const intentAnalysis: IntentAnalysis = {
          intent: aiResponse.intent || 'workflow_request',
          domain: 'productivity',
          confidence: aiResponse.confidence || 0.85,
          understanding: aiResponse.workflowSpec.description,
          extractedInfo: {},
          missingInfo: [],
          suggestedTools: aiResponse.workflowSpec.requiredIntegrations,
          complexity: workflow.nodes.length <= 3 ? 'simple' : workflow.nodes.length <= 6 ? 'medium' : 'complex'
        }

        setCurrentIntent(intentAnalysis)
        setConversationState('presenting_workflow')

        // Present the workflow
        const integrationsList = workflow.requiredIntegrations
          .map(id => EMBEDDED_TOOLS.find(t => t.id === id))
          .filter(Boolean)
          .map(t => `${t!.icon} ${t!.name}`)
          .join(', ')

        // SAFETY CHECK: Never display raw JSON to users
        let workflowIntro = aiResponse.text
        if (workflowIntro && workflowIntro.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(workflowIntro)
            workflowIntro = parsed.message || parsed.text || "Here's your workflow:"
          } catch {
            workflowIntro = "Here's your workflow:"
          }
        }

        const workflowResponse = `${workflowIntro}\n\n` +
          `**${workflow.name}**\n` +
          `${workflow.description}\n\n` +
          `${workflow.nodes.length} steps using: ${integrationsList || workflow.requiredIntegrations.join(', ')}`

        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: workflowResponse,
          timestamp: new Date(),
          type: 'workflow',
          workflow,
          intentAnalysis,
          actions: [
            { label: '✨ Preview & Execute', action: 'activate', primary: true },
            { label: 'Customize', action: 'customize' },
            { label: 'Start Over', action: 'reset' }
          ]
        }])

        setConversationState('listening')
        setIsProcessing(false)
        return
      }

      // Claude responded with text (natural conversation or asking questions)
      // SAFETY CHECK: Never display raw JSON to users
      let displayText = aiResponse.text
      if (displayText && displayText.trim().startsWith('{')) {
        console.warn('[SmartAIChatbot] Response looks like JSON, extracting message...')
        try {
          const parsed = JSON.parse(displayText)
          displayText = parsed.message || parsed.text || parsed.response ||
                       "I'm here to help you automate workflows. What would you like to create?"
        } catch {
          const messageMatch = displayText.match(/"message"\s*:\s*"([^"]+)"/i)
          displayText = messageMatch ? messageMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') :
                       "I'm here to help you automate workflows. What would you like to create?"
        }
      }

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: displayText,
        timestamp: new Date(),
        type: 'text'
      }])

      setConversationState('listening')
      setIsProcessing(false)
      return

    } catch (claudeError) {
      console.warn('[SmartAIChatbot] Claude AI failed, falling back to template system:', claudeError)
      // Fall through to template-based system below
    }

    // FALLBACK: Template-based system when Claude is unavailable
    // Check for greetings FIRST before any workflow processing
    if (isGreeting(message)) {
      await simulateTyping(400)

      const greetingResponses = [
        `${currentTimeGreeting}! How can I help you automate your work today?`,
        `Hey there! Ready to build some powerful automations?`,
        `Hi! What would you like to automate? I can help with emails, scheduling, data sync, and much more.`,
        `Hello! Tell me what repetitive task you'd like to eliminate, and I'll build you an automation.`
      ]

      const response = greetingResponses[Math.floor(Math.random() * greetingResponses.length)]

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        type: 'text'
      }])

      setIsProcessing(false)
      return
    }

    // Extract user context from message (auto-saves if confidence > threshold)
    try {
      await extractFromMessage(message)
    } catch (error) {
      console.error('[SmartAIChatbot] Context extraction error:', error)
      // Continue processing even if extraction fails
    }

    // If we're in question-asking mode, collect the answer
    if (conversationState === 'asking_questions' && pendingQuestions.length > 0) {
      const currentQuestion = pendingQuestions[currentQuestionIndex]
      const updatedInfo = { ...collectedInfo, [currentQuestion.id]: message }
      setCollectedInfo(updatedInfo)

      // Check if we have more questions
      if (currentQuestionIndex < pendingQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
        await simulateTyping()

        const nextQuestion = pendingQuestions[currentQuestionIndex + 1]
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: nextQuestion.question,
          timestamp: new Date(),
          type: 'questions',
          questions: [nextQuestion]
        }])
      } else {
        // All questions answered, generate workflow using Nexus Builder
        await generateAndPresentWorkflow(currentIntent!, updatedInfo)
      }

      setIsProcessing(false)
      return
    }

    // Nexus Director: Analyze intent using intelligent understanding
    await simulateTyping(600)

    const intentAnalysis = await nexusWorkflowEngine.analyzeIntent(message, {
      persona: personaDisplayName,
      history: messages.filter(m => m.role === 'user').map(m => m.content).slice(-3)
    })

    // Check if we have a confident understanding
    if (intentAnalysis.confidence > 0.3) {
      setCurrentIntent(intentAnalysis)
      setCollectedInfo(intentAnalysis.extractedInfo)

      // Nexus Analyst: Generate smart questions for missing info
      const questions = await nexusWorkflowEngine.generateQuestions(intentAnalysis, intentAnalysis.extractedInfo)

      if (questions.length === 0) {
        // We have enough info, generate workflow directly using Nexus Builder
        await generateAndPresentWorkflow(intentAnalysis, intentAnalysis.extractedInfo)
      } else {
        // Ask minimal questions
        setConversationState('asking_questions')
        setPendingQuestions(questions)
        setCurrentQuestionIndex(0)

        await simulateTyping()

        // Show friendly acknowledgment and ask first question
        let acknowledgment = `**Got it!** I'll help you ${intentAnalysis.understanding.toLowerCase()}.\n\n`
        acknowledgment += `Just ${questions.length} quick question${questions.length > 1 ? 's' : ''} to set this up:\n\n`
        acknowledgment += questions[0].question

        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: acknowledgment,
          timestamp: new Date(),
          type: 'analysis',
          questions: [questions[0]],
          intentAnalysis
        }])
      }
    } else {
      // Low confidence - BE PROACTIVE! Don't show generic "tell me more"
      // Instead, make an intelligent guess and either:
      // 1. Propose a workflow based on partial understanding
      // 2. Ask ONE targeted question
      await simulateTyping()

      // Try to understand what the user might want based on keywords
      const messageLower = message.toLowerCase()

      // Business/sales keywords - propose sales growth workflow
      if (messageLower.includes('sales') || messageLower.includes('customer') ||
          messageLower.includes('business') || messageLower.includes('grow') ||
          messageLower.includes('lead') || messageLower.includes('client') ||
          messageLower.includes('revenue') || messageLower.includes('marketing')) {

        // Extract any business info from the message
        const businessMatch = message.match(/(?:my|our)\s+(\w+(?:\s+\w+)?)\s+(?:company|business|firm|agency|startup)/i)
        // Fixed regex: word boundary + explicit case handling for prepositions, capital-starting location
        const locationMatch = message.match(/\b(?:based |located )?(?:[Ii]n|[Aa]t|[Ff]rom)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)(?:[.,!?\s]|$)/)

        const extractedInfo: Record<string, string> = {}
        if (businessMatch) extractedInfo.business_type = businessMatch[1]
        if (locationMatch) extractedInfo.location = locationMatch[1].trim()

        // Create a proactive sales growth intent
        const proactiveIntent: IntentAnalysis = {
          intent: 'sales_growth',
          domain: 'business',
          confidence: 0.6, // Boost confidence since we're being proactive
          understanding: `Grow sales${extractedInfo.business_type ? ` for your ${extractedInfo.business_type}` : ''}${extractedInfo.location ? ` in ${extractedInfo.location}` : ''} through automated outreach and lead generation`,
          extractedInfo,
          missingInfo: Object.keys(extractedInfo).length > 0 ? ['sales_strategy'] : ['business_type', 'sales_strategy'],
          suggestedTools: ['gmail', 'google_sheets', 'linkedin', 'whatsapp', 'playwright', 'slack'],
          complexity: 'medium'
        }

        setCurrentIntent(proactiveIntent)
        setCollectedInfo(extractedInfo)

        // If we have enough info, just ask ONE question
        const questions = await nexusWorkflowEngine.generateQuestions(proactiveIntent, extractedInfo)

        if (questions.length <= 2) {
          // Few questions - ask them and proceed
          setConversationState('asking_questions')
          setPendingQuestions(questions)
          setCurrentQuestionIndex(0)

          let response = `**Great! Let's boost your sales!** 🚀\n\n`
          response += `I understand you want to: **${proactiveIntent.understanding}**\n\n`

          if (Object.keys(extractedInfo).length > 0) {
            const infoStr = Object.entries(extractedInfo).map(([k, v]) => `${k.replace(/_/g, ' ')}: **${v}**`).join(', ')
            response += `Got it: ${infoStr}\n\n`
          }

          response += `Quick question to customize your workflow:\n\n`
          response += questions[0].question

          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: response,
            timestamp: new Date(),
            type: 'analysis',
            questions: [questions[0]],
            intentAnalysis: proactiveIntent
          }])
        } else {
          // No questions needed - propose workflow directly
          await generateAndPresentWorkflow(proactiveIntent, extractedInfo)
        }

        setIsProcessing(false)
        return
      }

      // Social media keywords
      if (messageLower.includes('social') || messageLower.includes('instagram') ||
          messageLower.includes('facebook') || messageLower.includes('linkedin') ||
          messageLower.includes('post') || messageLower.includes('content')) {

        const proactiveIntent: IntentAnalysis = {
          intent: 'social_media_marketing',
          domain: 'business',
          confidence: 0.6,
          understanding: 'Build social media presence with automated posting and engagement tracking',
          extractedInfo: {},
          missingInfo: ['platform'],
          suggestedTools: ['instagram', 'facebook', 'linkedin', 'playwright', 'google_sheets'],
          complexity: 'medium'
        }

        setCurrentIntent(proactiveIntent)
        setConversationState('asking_questions')

        const questions = await nexusWorkflowEngine.generateQuestions(proactiveIntent, {})
        setPendingQuestions(questions)
        setCurrentQuestionIndex(0)

        let response = `**Let's grow your social media presence!** 📱\n\n`
        response += `I can help automate your social media marketing.\n\n`
        response += questions[0].question

        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: response,
          timestamp: new Date(),
          type: 'analysis',
          questions: [questions[0]],
          intentAnalysis: proactiveIntent
        }])

        setIsProcessing(false)
        return
      }

      // Default: Still be proactive - pick the most likely intent and ask ONE targeted question
      const bestGuessIntent: IntentAnalysis = {
        intent: 'general_automation',
        domain: 'productivity',
        confidence: 0.4,
        understanding: 'Automate a task to save you time',
        extractedInfo: {},
        missingInfo: ['task_details'],
        suggestedTools: intentAnalysis.suggestedTools.length > 0 ? intentAnalysis.suggestedTools : ['gmail', 'google_sheets', 'playwright'],
        complexity: 'medium'
      }

      setCurrentIntent(bestGuessIntent)
      setConversationState('asking_questions')

      // Ask ONE smart question instead of generic response
      const smartQuestion: SmartNexusQuestion = {
        id: 'task_goal',
        question: "What's the main outcome you want? For example: 'get more customers', 'save time on reports', 'stay updated on competitors'",
        purpose: 'To create the perfect automation for you',
        type: 'text',
        placeholder: 'e.g., get more sales leads, automate invoicing',
        required: true
      }

      setPendingQuestions([smartQuestion])
      setCurrentQuestionIndex(0)

      let response = `**I'd love to help automate that!** ⚡\n\n`
      response += `To build the perfect workflow for you:\n\n`
      response += smartQuestion.question

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        type: 'questions',
        questions: [smartQuestion],
        intentAnalysis: bestGuessIntent
      }])
    }

    setIsProcessing(false)
  }, [conversationState, pendingQuestions, currentQuestionIndex, collectedInfo, currentIntent, personaDisplayName, messages, extractFromMessage, isGreeting, currentTimeGreeting])

  // Confidence threshold for auto-navigation
  const AUTO_NAVIGATE_CONFIDENCE = 0.85

  // Generate and present workflow using Nexus Builder
  const generateAndPresentWorkflow = useCallback(async (intent: IntentAnalysis, info: Record<string, string>) => {
    setConversationState('generating_workflow')

    await simulateTyping(1500)

    // Nexus Builder: Generate the workflow through intelligent reasoning
    const workflow = await nexusWorkflowEngine.buildWorkflow({
      intent,
      collectedInfo: info,
      userMessage: messages.filter(m => m.role === 'user').pop()?.content || '',
      persona: personaDisplayName
    })

    setConversationState('presenting_workflow')

    // Check if confidence is high enough for auto-navigation
    const isHighConfidence = intent.confidence >= AUTO_NAVIGATE_CONFIDENCE

    // Present the workflow with user-friendly summary
    const integrationsList = workflow.requiredIntegrations
      .map(id => EMBEDDED_TOOLS.find(t => t.id === id))
      .filter(Boolean)
      .map(t => `${t!.icon} ${t!.name}`)
      .join(', ')

    // Different message based on confidence
    const response = isHighConfidence
      ? `**✨ Your workflow is ready to execute!**\n\n` +
        `**${workflow.name}**\n` +
        `${workflow.description}\n\n` +
        `${workflow.nodes.length} steps using: ${integrationsList}\n\n` +
        `**Confidence: ${Math.round(intent.confidence * 100)}%** — Taking you to the workflow now...`
      : `**Your workflow is ready!**\n\n` +
        `**${workflow.name}**\n` +
        `${workflow.description}\n\n` +
        `${workflow.nodes.length} steps using: ${integrationsList}\n\n` +
        `Preview it to make sure everything looks right.`

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      type: 'workflow',
      workflow,
      intentAnalysis: intent,
      actions: isHighConfidence
        ? [] // No buttons needed - auto-navigating
        : [
            { label: '✨ Preview & Customize', action: 'activate', primary: true },
            { label: 'Start Over', action: 'reset' }
          ]
    }])

    // Auto-navigate when confidence is high
    if (isHighConfidence) {
      // Brief pause to show the message, then navigate
      await simulateTyping(1200)

      // Persist workflow and navigate
      try {
        const workflowSteps = workflow.nodes.map(node => ({
          id: node.id,
          type: node.type,
          tool: node.tool,
          name: node.name,
          description: node.description,
          config: node.config || {},
          integrationId: workflow.requiredIntegrations.find(i =>
            node.tool.toLowerCase().includes(i.toLowerCase())
          ) || node.tool
        }))

        const workflowId = await workflowContext.createWorkflow(
          workflow.name,
          workflow.description,
          workflowSteps
        )

        localStorage.setItem('nexus_active_workflow_id', workflowId)
        localStorage.setItem('nexus_pending_workflow', JSON.stringify({
          ...workflow,
          confidence: intent.confidence,
          missingInfo: intent.missingInfo || [],
          intentAnalysis: intent
        }))
        // Flag that we just navigated with a workflow - chat should show welcome
        localStorage.setItem('nexus_workflow_just_navigated', 'true')
        // Ensure chat stays open after navigation
        setIsOpen(true)
        navigate(`/workflow-demo?mode=execute&source=ai&id=${workflowId}`)
      } catch (e) {
        console.error('[SmartAIChatbot] Failed to persist workflow:', e)
        // Fallback to localStorage only
        localStorage.setItem('nexus_pending_workflow', JSON.stringify({
          ...workflow,
          confidence: intent.confidence,
          missingInfo: intent.missingInfo || [],
          intentAnalysis: intent
        }))
        // Flag that we just navigated with a workflow - chat should show welcome
        localStorage.setItem('nexus_workflow_just_navigated', 'true')
        // Ensure chat stays open after navigation
        setIsOpen(true)
        navigate('/workflow-demo?mode=execute&source=ai')
      }
      // Chat stays open - welcome message will be added after navigation
    }

    // Reset conversation state
    setConversationState('listening')
    setPendingQuestions([])
    setCurrentQuestionIndex(0)
  }, [messages, personaDisplayName, navigate, workflowContext])

  // Execute workflow in real-time via REAL WorkflowOrchestrator + ComposioExecutor
  const executeWorkflowNow = useCallback(async (workflow: GeneratedWorkflow) => {
    setConversationState('executing_workflow')
    setExecutionProgress({ completed: 0, total: workflow.nodes.length, currentNode: '', cost: 0 })

    // Add execution start message
    setMessages(prev => [...prev, {
      id: `exec_start_${Date.now()}`,
      role: 'assistant',
      content: `**🚀 Executing Workflow: ${workflow.name}**\n\nConnecting to REAL integrations via Composio...`,
      timestamp: new Date(),
      type: 'execution'
    }])

    // Subscribe to orchestrator events for real-time updates
    const unsubscribe = workflowOrchestrator.subscribe((event: OrchestratorEvent) => {
      console.log('[SmartAIChatbot] Orchestrator event:', event.type, event.data)

      switch (event.type) {
        case 'step_started':
          const stepData = event.data as { step?: { name?: string } }
          setExecutionProgress(prev => prev ? {
            ...prev,
            currentNode: stepData.step?.name || 'Processing...'
          } : null)
          break

        case 'step_completed':
          const completedData = event.data as { step?: { name?: string } }
          setExecutionProgress(prev => prev ? {
            ...prev,
            completed: prev.completed + 1,
            currentNode: completedData.step?.name || ''
          } : null)
          break

        case 'progress_update':
          if (event.metadata?.progress !== undefined) {
            setExecutionProgress(prev => prev ? {
              ...prev,
              completed: Math.floor((event.metadata!.progress! / 100) * prev.total)
            } : null)
          }
          if (event.metadata?.costUsd !== undefined) {
            setExecutionProgress(prev => prev ? {
              ...prev,
              cost: event.metadata!.costUsd!
            } : null)
          }
          break
      }
    })

    try {
      // Convert GeneratedWorkflow to NL Workflow JSON format for orchestrator
      const nlWorkflowJSON: GeneratedWorkflowJSON = {
        id: `wf_${Date.now()}`,
        name: workflow.name,
        description: workflow.description,
        version: '1.0',
        trigger: {
          type: 'manual',
          source: 'chatbot',
          event: 'user_command',
          composioTool: undefined,
        },
        actions: workflow.nodes.map((node, index) => ({
          id: node.id,
          name: node.name,
          description: node.description,
          tool: node.tool.toUpperCase().replace(/-/g, '_'), // Convert to Composio slug format
          toolkit: workflow.requiredIntegrations.find(i =>
            node.tool.toLowerCase().includes(i.toLowerCase())
          ) || node.tool.split('_')[0]?.toLowerCase() || 'unknown',
          inputs: node.config || {},
          dependsOn: index > 0 ? [workflow.nodes[index - 1].id] : [],
          retryConfig: { maxRetries: 2, retryDelayMs: 1000 },
        })),
        variables: {}, // No workflow-level variables for chatbot-generated workflows
        metadata: {
          generatedAt: new Date().toISOString(),
          inputLanguage: 'en',
          originalInput: workflow.description,
          confidence: 0.85,
          estimatedDurationMs: 60000, // Default 1 minute estimate
          requiredConnections: workflow.requiredIntegrations,
        },
      }

      console.log('[SmartAIChatbot] Executing via REAL orchestrator:', nlWorkflowJSON)

      // Also persist to backend for tracking (optional)
      try {
        const workflowSteps = workflow.nodes.map(node => ({
          id: node.id,
          type: node.type,
          tool: node.tool,
          name: node.name,
          description: node.description,
          config: node.config || {},
          integrationId: workflow.requiredIntegrations.find(i =>
            node.tool.toLowerCase().includes(i.toLowerCase())
          ) || node.tool
        }))

        const backendWorkflowId = await workflowContext.createWorkflow(
          workflow.name,
          workflow.description,
          workflowSteps
        )
        localStorage.setItem('nexus_active_workflow_id', backendWorkflowId)
        console.log('[SmartAIChatbot] Workflow persisted to backend:', backendWorkflowId)
      } catch (persistError) {
        console.warn('[SmartAIChatbot] Backend persistence failed (continuing with execution):', persistError)
      }

      // Execute via REAL WorkflowOrchestrator which uses ComposioExecutor
      const executionResult = await workflowOrchestrator.executeNLWorkflow(nlWorkflowJSON, {
        userId: undefined, // Could get from auth context if needed
      })

      // Unsubscribe from events
      unsubscribe()

      setConversationState(executionResult.success ? 'execution_complete' : 'listening')
      setExecutionProgress(null)

      if (executionResult.success) {
        // Calculate totals from results
        const totalTime = executionResult.totalExecutionTimeMs
        const successCount = executionResult.results.filter(r => r.result.success).length

        const resultContent = `**✅ Workflow Execution Complete!**\n\n` +
          `**Results:**\n` +
          `- Status: ✅ Success\n` +
          `- Steps executed: ${successCount}/${workflow.nodes.length}\n` +
          `- Total time: ${(totalTime / 1000).toFixed(2)}s\n\n` +
          `**Execution Log:**\n` +
          executionResult.messages.map(m => `- ${m}`).join('\n')

        setMessages(prev => [...prev, {
          id: `exec_result_${Date.now()}`,
          role: 'assistant',
          content: resultContent,
          timestamp: new Date(),
          type: 'execution_result',
          actions: [
            { label: 'Run Again', action: 'execute', primary: false },
            { label: 'New Workflow', action: 'reset' }
          ]
        }])
      } else {
        // Check for missing connections
        const missingConnections = executionResult.context.missingConnections as string[] | undefined
        const authUrls = executionResult.context.authUrls as Record<string, string> | undefined

        let errorContent = `**❌ Execution Failed**\n\n`

        if (missingConnections && missingConnections.length > 0) {
          errorContent += `**Missing Connections:**\n` +
            missingConnections.map(c => `- ${c}`).join('\n') + '\n\n' +
            `Please connect these services first to enable execution.\n\n`

          if (authUrls && Object.keys(authUrls).length > 0) {
            errorContent += `**Connect now:**\n` +
              Object.entries(authUrls).map(([toolkit, url]) =>
                `- [Connect ${toolkit}](${url})`
              ).join('\n') + '\n\n'
          }
        } else {
          // Get error from last failed result
          const failedResult = executionResult.results.find(r => !r.result.success)
          errorContent += `${failedResult?.result.error || 'Unknown error'}\n\n`

          if (failedResult?.result.suggestedAction) {
            errorContent += `**Suggestion:** ${failedResult.result.suggestedAction}\n\n`
          }
        }

        errorContent += `Would you like to try again or modify the workflow?`

        setMessages(prev => [...prev, {
          id: `exec_error_${Date.now()}`,
          role: 'assistant',
          content: errorContent,
          timestamp: new Date(),
          type: 'text',
          workflow: workflow, // Include workflow for retry
          actions: [
            { label: 'Connect Services', action: 'connect', primary: true },
            { label: 'Try Again', action: 'execute', primary: false },
            { label: 'Customize', action: 'customize' },
            { label: 'Start Over', action: 'reset' }
          ]
        }])
      }

    } catch (error) {
      // Unsubscribe on error
      unsubscribe()

      setConversationState('listening')
      setExecutionProgress(null)

      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error('[SmartAIChatbot] Execution error:', error)

      setMessages(prev => [...prev, {
        id: `exec_error_${Date.now()}`,
        role: 'assistant',
        content: `**❌ Execution Failed**\n\n${errorMsg}\n\nWould you like to try again or modify the workflow?`,
        timestamp: new Date(),
        type: 'text',
        workflow: workflow, // Include workflow for retry
        actions: [
          { label: 'Try Again', action: 'execute', primary: true },
          { label: 'Customize', action: 'customize' },
          { label: 'Start Over', action: 'reset' }
        ]
      }])
    }
  }, [workflowContext])

  // Handle actions
  const handleAction = useCallback(async (action: string, workflow?: GeneratedWorkflow, intentAnalysis?: IntentAnalysis) => {
    switch (action) {
      case 'execute':
        if (workflow) {
          await executeWorkflowNow(workflow)
        }
        break

      case 'activate':
        if (workflow) {
          // Persist workflow to database and navigate to demo
          try {
            const workflowSteps = workflow.nodes.map(node => ({
              id: node.id,
              type: node.type,
              tool: node.tool,
              name: node.name,
              description: node.description,
              config: node.config || {},
              integrationId: workflow.requiredIntegrations.find(i =>
                node.tool.toLowerCase().includes(i.toLowerCase())
              ) || node.tool
            }))

            const workflowId = await workflowContext.createWorkflow(
              workflow.name,
              workflow.description,
              workflowSteps
            )

            // Store both for compatibility - workflow ID for backend, full workflow for UI
            // Include confidence and intentAnalysis for optimization panel
            localStorage.setItem('nexus_active_workflow_id', workflowId)
            localStorage.setItem('nexus_pending_workflow', JSON.stringify({
              ...workflow,
              confidence: intentAnalysis?.confidence || 0.7,
              missingInfo: intentAnalysis?.missingInfo || [],
              intentAnalysis: intentAnalysis
            }))
            navigate(`/workflow-demo?mode=execute&source=ai&id=${workflowId}`)
          } catch (e) {
            console.error('[SmartAIChatbot] Failed to persist workflow:', e)
            // Fallback to localStorage only - include confidence data
            localStorage.setItem('nexus_pending_workflow', JSON.stringify({
              ...workflow,
              confidence: intentAnalysis?.confidence || 0.7,
              missingInfo: intentAnalysis?.missingInfo || [],
              intentAnalysis: intentAnalysis
            }))
            navigate('/workflow-demo?mode=execute&source=ai')
          }
          setIsOpen(false)
        }
        break

      case 'customize':
        if (workflow) {
          // Persist workflow to database and navigate to editor
          try {
            const workflowSteps = workflow.nodes.map(node => ({
              id: node.id,
              type: node.type,
              tool: node.tool,
              name: node.name,
              description: node.description,
              config: node.config || {},
              integrationId: workflow.requiredIntegrations.find(i =>
                node.tool.toLowerCase().includes(i.toLowerCase())
              ) || node.tool
            }))

            const workflowId = await workflowContext.createWorkflow(
              workflow.name,
              workflow.description,
              workflowSteps
            )

            localStorage.setItem('nexus_active_workflow_id', workflowId)
            localStorage.setItem('nexus_pending_workflow', JSON.stringify({
              ...workflow,
              confidence: intentAnalysis?.confidence || 0.7,
              missingInfo: intentAnalysis?.missingInfo || [],
              intentAnalysis: intentAnalysis
            }))
            navigate(`/workflow-demo?mode=edit&source=ai&id=${workflowId}`)
          } catch (e) {
            console.error('[SmartAIChatbot] Failed to persist workflow:', e)
            localStorage.setItem('nexus_pending_workflow', JSON.stringify({
              ...workflow,
              confidence: intentAnalysis?.confidence || 0.7,
              missingInfo: intentAnalysis?.missingInfo || [],
              intentAnalysis: intentAnalysis
            }))
            navigate('/workflow-demo?mode=edit&source=ai')
          }
          setIsOpen(false)
        }
        break

      case 'connect':
        // Navigate to My Connected Apps page for user-level OAuth connections
        navigate('/my-apps')
        setIsOpen(false)
        break

      case 'reset':
        setMessages([{
          id: 'greeting',
          role: 'assistant',
          content: getGreeting(),
          timestamp: new Date(),
          type: 'text'
        }])
        setConversationState('greeting')
        setCurrentIntent(null)
        setCollectedInfo({})
        setPendingQuestions([])
        break

      default:
        if (action.startsWith('select:')) {
          const value = action.replace('select:', '')
          processMessage(value)
        }
    }
  }, [navigate, getGreeting, processMessage])

  // Handle keyboard submit
  const handleSubmit = useCallback(() => {
    if (inputValue.trim() && !isProcessing) {
      processMessage(inputValue.trim())
      setInputValue('')
    }
  }, [inputValue, isProcessing, processMessage])

  // Simulate typing delay
  const simulateTyping = (delay = 800) => new Promise(resolve => setTimeout(resolve, delay + Math.random() * 500))

  // Position classes - responsive for mobile
  const positionClasses = {
    'bottom-right': 'fixed bottom-4 right-4 md:bottom-6 md:right-6',
    'bottom-left': 'fixed bottom-4 left-4 md:bottom-6 md:left-6',
    'side-panel': 'fixed right-0 top-14 h-[calc(100vh-3.5rem)]'
  }

  const chatWindowClasses = {
    'bottom-right': 'bottom-16 md:bottom-20 right-0',
    'bottom-left': 'bottom-16 md:bottom-20 left-0',
    'side-panel': 'top-0 right-0 h-full rounded-none'
  }

  return (
    <div className={`${positionClasses[position]} z-[60]`}>
      {/* Chat Window - Full width on mobile */}
      {isOpen && (
        <div
          className={`absolute ${chatWindowClasses[position]} w-[calc(100vw-2rem)] md:w-[420px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] md:max-h-none`}
          style={{ height: position === 'side-panel' ? '100%' : undefined, maxHeight: position === 'side-panel' ? '100%' : 'min(600px, 80vh)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="chatbot-title"
          aria-describedby="chatbot-description"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 border-b border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
                    <span className="text-lg">🤖</span>
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></span>
                </div>
                <div>
                  <h3 id="chatbot-title" className="font-semibold text-white">Nexus Smart AI</h3>
                  <p id="chatbot-description" className="text-xs text-slate-400">
                    {conversationState === 'executing_workflow'
                      ? '🟢 Executing workflow...'
                      : conversationState === 'generating_workflow'
                      ? 'Building your workflow...'
                      : conversationState === 'execution_complete'
                      ? '✅ Execution complete'
                      : 'Workflow automation assistant'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Progress indicator for workflow generation */}
            {conversationState === 'generating_workflow' && (
              <div className="mt-3">
                <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 animate-pulse" style={{ width: '60%' }}></div>
                </div>
                <p className="text-xs text-slate-400 mt-1 text-center">Connecting integrations & building automation...</p>
              </div>
            )}

            {/* Real-time execution progress */}
            {conversationState === 'executing_workflow' && executionProgress && (
              <div className="mt-3">
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${(executionProgress.completed / executionProgress.total) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-slate-400">
                    {executionProgress.currentNode ? `Running: ${executionProgress.currentNode}` : 'Starting...'}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-green-400">{executionProgress.completed}/{executionProgress.total} nodes</span>
                    <span className="text-xs text-amber-400">${executionProgress.cost.toFixed(4)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl p-4 ${
                    message.role === 'user'
                      ? 'bg-cyan-500/20 text-white ml-4'
                      : 'bg-slate-800 text-slate-200 mr-4'
                  }`}
                >
                  {/* Text content with markdown-like formatting */}
                  {/* SECURITY: All HTML content is sanitized via DOMPurify before rendering */}
                  <div className="text-sm whitespace-pre-wrap">
                    {message.content.split('\n').map((line, i) => {
                      // Bold text - escape content first, then apply formatting
                      // DOMPurify sanitizes the entire output to prevent XSS
                      const boldFormatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                      const sanitized = sanitizeHTML(boldFormatted)
                      return (
                        <p
                          key={i}
                          className={line.startsWith('-') ? 'ml-2 my-0.5' : 'my-1'}
                          dangerouslySetInnerHTML={{ __html: sanitized }}
                        />
                      )
                    })}
                  </div>

                  {/* Workflow visualization preview */}
                  {message.type === 'workflow' && message.workflow && (
                    <div className="mt-4">
                      <WorkflowFlowChart
                        nodes={message.workflow.nodes}
                        connections={message.workflow.connections}
                        workflowName={message.workflow.name}
                        compact={true}
                      />
                    </div>
                  )}

                  {/* Quick answer options for questions */}
                  {message.type === 'questions' && message.questions && message.questions[0].options && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.questions[0].options.map((option, i) => (
                        <button
                          key={i}
                          onClick={() => handleAction(`select:${option.value}`, undefined)}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-full transition-colors"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Action buttons */}
                  {message.actions && message.actions.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {message.actions.map((action, i) => (
                        <button
                          key={i}
                          onClick={() => handleAction(action.action, message.workflow, message.intentAnalysis)}
                          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                            action.primary
                              ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:opacity-90 shadow-lg shadow-cyan-500/20'
                              : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {(isProcessing || conversationState === 'executing_workflow') && (
              <div className="flex justify-start">
                <div className="bg-slate-800 rounded-2xl p-4 mr-4">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className={`w-2 h-2 ${conversationState === 'executing_workflow' ? 'bg-green-500' : 'bg-cyan-500'} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></span>
                      <span className={`w-2 h-2 ${conversationState === 'executing_workflow' ? 'bg-emerald-500' : 'bg-purple-500'} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></span>
                      <span className={`w-2 h-2 ${conversationState === 'executing_workflow' ? 'bg-teal-500' : 'bg-pink-500'} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {conversationState === 'executing_workflow'
                        ? `Executing: ${executionProgress?.currentNode || 'Starting...'}`
                        : conversationState === 'generating_workflow'
                        ? 'Creating your workflow...'
                        : 'Thinking...'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Available integrations indicator */}
          <div className="px-4 py-2 border-t border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs text-slate-500 whitespace-nowrap">Powered by:</span>
              {EMBEDDED_TOOLS.slice(0, 8).map(tool => (
                <span
                  key={tool.id}
                  className="text-sm opacity-60 hover:opacity-100 transition-opacity cursor-default"
                  title={tool.name}
                >
                  {tool.icon}
                </span>
              ))}
              <span className="text-xs text-slate-500">+{EMBEDDED_TOOLS.length - 8} more</span>
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-slate-700 p-4">
            <div className="flex gap-2">
              {/* Input with integrated voice button */}
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder={
                    isListening
                      ? 'Listening...'
                      : conversationState === 'asking_questions'
                      ? pendingQuestions[currentQuestionIndex]?.placeholder || 'Type your answer...'
                      : 'Describe what you want to automate...'
                  }
                  className={`w-full bg-slate-800 border ${
                    isListening ? 'border-cyan-500' : 'border-slate-700'
                  } rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm transition-colors`}
                  disabled={isProcessing}
                />
                {/* Voice button inside input */}
                <button
                  onClick={() => (isListening ? stopListening() : startListening())}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                    isListening
                      ? 'bg-cyan-500 text-white animate-pulse'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                  }`}
                  title={isListening ? 'Stop listening' : 'Voice input'}
                  aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                >
                  {isListening ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  )}
                </button>
              </div>
              {/* Send button */}
              <button
                onClick={handleSubmit}
                disabled={!inputValue.trim() || isProcessing}
                className="p-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                aria-label="Send message"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      {position !== 'side-panel' && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`group relative w-16 h-16 rounded-full shadow-lg transition-all duration-300 ${
            isOpen
              ? 'bg-slate-800 rotate-0'
              : 'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:scale-110'
          }`}
        >
          {isOpen ? (
            <svg className="w-6 h-6 text-white mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              {/* Animated rings */}
              <span className="absolute inset-0 rounded-full border-2 border-cyan-500 animate-ping opacity-30"></span>
              <span className="absolute inset-2 rounded-full border border-purple-500 animate-pulse opacity-40"></span>
            </>
          )}

          {/* Tooltip */}
          {!isOpen && (
            <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-slate-800 text-white text-sm rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
              <span className="font-medium">Create AI Workflow</span>
              <br />
              <span className="text-xs text-slate-400">Describe your goal, get automation</span>
            </span>
          )}
        </button>
      )}
    </div>
  )
}

export default SmartAIChatbot
