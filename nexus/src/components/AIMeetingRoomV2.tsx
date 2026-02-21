// AI Meeting Room V2 - Simplified Navigation & Voice-Ready
// FIXES:
// ✓ Removed nested tabs (confusing)
// ✓ Flat navigation structure
// ✓ Consistent display modes (ChatGPT-style)
// ✓ Max 5 primary actions
// ✓ Voice integration ready for human-like AI employees
// ✓ Clean background (no distracting custom backgrounds)

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  nexusPartyModeService,
  NEXUS_AGENTS,
  cleanAgentResponse,
  getIndustryRelevantAgentOrder,
  type NexusAgentPersona,
  type PartyModeMessage
} from '../lib/nexus-party-mode-service'
// @NEXUS-FIX-157: Industry-specific agent lookup for dedicated names/titles/icons
import { getIndustryAgent } from '../lib/industry-agents'
import { humanTTSService } from '../lib/human-tts-service'
import { useSwipeToDismiss } from '../hooks/useSwipeNavigation'
import { useBusinessProfile } from '../hooks/useBusinessProfile'
import { FEATURE_FLAGS } from '../config/feature-flags'
import { AutopilotPanel } from './autopilot/AutopilotPanel'

// =============================================================================
// MOBILE HOOKS & UTILITIES
// =============================================================================

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

function useKeyboardVisible() {
  const [keyboardState, setKeyboardState] = useState({
    isVisible: false,
    height: 0
  })

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    let initialHeight = viewport.height

    const handleResize = () => {
      const currentHeight = viewport.height
      const heightDiff = initialHeight - currentHeight

      if (heightDiff > 150) {
        setKeyboardState({ isVisible: true, height: heightDiff })
      } else {
        setKeyboardState({ isVisible: false, height: 0 })
        initialHeight = currentHeight
      }
    }

    viewport.addEventListener('resize', handleResize)
    return () => viewport.removeEventListener('resize', handleResize)
  }, [])

  return keyboardState
}

function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if ('vibrate' in navigator) {
    const duration = type === 'light' ? 10 : type === 'medium' ? 20 : 50
    navigator.vibrate(duration)
  }
}

// Emotion detection for voice personality
const detectEmotion = (text: string): { emoji: string; color: string; label: string } => {
  const textLower = text.toLowerCase()

  if (textLower.includes('great') || textLower.includes('excellent') || textLower.includes('love') || textLower.includes('excited')) {
    return { emoji: '😊', color: '#10B981', label: 'Positive' }
  }
  if (textLower.includes('concern') || textLower.includes('risk') || textLower.includes('careful') || textLower.includes('warning')) {
    return { emoji: '🤔', color: '#F59E0B', label: 'Cautious' }
  }
  if (textLower.includes('disagree') || textLower.includes('however') || textLower.includes('but ') || textLower.includes('issue')) {
    return { emoji: '💭', color: '#8B5CF6', label: 'Thoughtful' }
  }
  if (textLower.includes('question') || textLower.includes('why') || textLower.includes('how') || textLower.includes('what if')) {
    return { emoji: '❓', color: '#3B82F6', label: 'Curious' }
  }
  if (textLower.includes('agree') || textLower.includes('yes') || textLower.includes('exactly') || textLower.includes('right')) {
    return { emoji: '👍', color: '#22C55E', label: 'Agreeing' }
  }
  if (textLower.includes('implement') || textLower.includes('build') || textLower.includes('code') || textLower.includes('create')) {
    return { emoji: '🔧', color: '#06B6D4', label: 'Building' }
  }
  return { emoji: '💬', color: '#64748B', label: 'Neutral' }
}

/** Extract service names mentioned in discussion text for Autopilot hint */
function extractServicesFromDiscussion(text: string): string[] {
  const serviceKeywords: Record<string, string> = {
    'gmail': 'Gmail', 'google mail': 'Gmail', 'email': 'Gmail',
    'slack': 'Slack', 'slack channel': 'Slack',
    'google sheets': 'Google Sheets', 'spreadsheet': 'Google Sheets',
    'google calendar': 'Google Calendar', 'calendar': 'Google Calendar',
    'dropbox': 'Dropbox', 'google drive': 'Google Drive',
    'github': 'GitHub', 'notion': 'Notion', 'discord': 'Discord',
    'trello': 'Trello', 'asana': 'Asana', 'linear': 'Linear',
    'hubspot': 'HubSpot', 'stripe': 'Stripe', 'zoom': 'Zoom',
    'whatsapp': 'WhatsApp', 'quickbooks': 'QuickBooks',
    'jira': 'Jira', 'salesforce': 'Salesforce',
  }
  const found = new Set<string>()
  const lower = text.toLowerCase()
  for (const [keyword, displayName] of Object.entries(serviceKeywords)) {
    if (lower.includes(keyword)) found.add(displayName)
  }
  return Array.from(found)
}

interface AIMeetingRoomV2Props {
  isOpen: boolean
  onClose: () => void
  workflowContext?: string
  workflowTitle?: string
  workflowId?: string
  mode?: 'optimization' | 'troubleshooting' | 'brainstorm'
  /** When true, renders as full-page layout instead of modal overlay (for /ai-consultancy route) */
  fullPage?: boolean
}

export function AIMeetingRoomV2({
  isOpen,
  onClose,
  workflowContext,
  workflowTitle,
  workflowId,
  mode = 'optimization',
  fullPage = false
}: AIMeetingRoomV2Props) {
  const [messages, setMessages] = useState<PartyModeMessage[]>([])
  const messagesRef = useRef<PartyModeMessage[]>([])
  messagesRef.current = messages
  const [userInput, setUserInput] = useState('')
  const [isDiscussing, setIsDiscussing] = useState(false)
  const [activeAgent, setActiveAgent] = useState<string | null>(null)
  const [isTTSEnabled, setIsTTSEnabled] = useState(true)
  const [typingAgent, setTypingAgent] = useState<string | null>(null)
  const [showAgentsList, setShowAgentsList] = useState(false) // Show/hide agents panel
  const [showAutopilot, setShowAutopilot] = useState(false) // Autopilot browser panel
  const [autopilotSpec, setAutopilotSpec] = useState<{
    name: string; description: string;
    steps: Array<{ id: string; name: string; tool: string; type: string }>;
    requiredIntegrations: string[]; estimatedTimeSaved?: string;
  } | null>(null)
  const [_isAPIConfigured, setIsAPIConfigured] = useState(false)
  const [_currentEmotion, setCurrentEmotion] = useState<{ emoji: string; color: string; label: string } | null>(null)
  const [_currentSpeech, setCurrentSpeech] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const discussionRef = useRef<boolean>(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isMobile = useIsMobile()
  const keyboard = useKeyboardVisible()
  // @NEXUS-FIX-155: Domain-connected consultancy — read industry + inject into agent context
  const { industry, industryName } = useBusinessProfile()

  // @NEXUS-FIX-155 + @NEXUS-FIX-157: Reorder agents by industry relevance with dedicated names/titles
  const agents = getIndustryRelevantAgentOrder(industry)

  // @NEXUS-FIX-157: Agent lookup resolves industry-specific agents (unique names, icons, titles)
  const lookupAgent = useCallback((agentId: string): NexusAgentPersona | undefined => {
    return getIndustryAgent(agentId, industry, NEXUS_AGENTS)
  }, [industry])

  useEffect(() => {
    setIsAPIConfigured(nexusPartyModeService.canMakeAPICalls())
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Audio lifecycle
  useEffect(() => {
    if (isOpen) {
      humanTTSService.setActiveWorkflow(workflowId || 'default-meeting-room')
    }

    return () => {
      humanTTSService.stopAllAudio()
      humanTTSService.setActiveWorkflow(null)
    }
  }, [isOpen, workflowId])

  useEffect(() => {
    if (!isOpen) {
      humanTTSService.stopAllAudio()
    }
  }, [isOpen])

  const speakText = useCallback(async (text: string, agent: NexusAgentPersona): Promise<void> => {
    if (!isTTSEnabled) return

    return new Promise((resolve) => {
      humanTTSService.queueSpeech(text, agent.id, {
        priority: 0,
        onEnd: () => resolve()
      })
    })
  }, [isTTSEnabled])

  useEffect(() => {
    humanTTSService.setMuted(!isTTSEnabled)
  }, [isTTSEnabled])

  const runDiscussion = useCallback(async (userPrompt: string) => {
    setIsDiscussing(true)
    discussionRef.current = true

    try {
      // @NEXUS-FIX-155: Explicit industry injection into discussion context
      const result = await nexusPartyModeService.runDiscussionRound(
        {
          topic: workflowTitle || 'workflow optimization',
          mode,
          workflowContext,
          industry: industry || undefined,
          maxRoundsPerResponse: 3
        },
        messages,
        userPrompt || undefined
      )

      // Generate industry-aware responses for each agent
      for (const message of result.messages) {
        if (!discussionRef.current) break

        // @NEXUS-FIX-157: Use industry-specific agent for display
        const agent = lookupAgent(message.agentId)
        if (!agent) continue

        setTypingAgent(message.agentId)
        setActiveAgent(null)
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 600))

        const cleanedText = cleanAgentResponse(message.text)
        const cleanedMessage = { ...message, text: cleanedText }

        const emotion = detectEmotion(cleanedText)
        setCurrentEmotion(emotion)

        setTypingAgent(null)
        setActiveAgent(message.agentId)
        setCurrentSpeech(cleanedText)

        setMessages(prev => {
          const updated = [...prev, cleanedMessage]
          // @NEXUS-FIX-176: Persist discussion for "Back to Chat with Insights" - DO NOT REMOVE
          try {
            const forStorage = updated.filter(m => m.agentId !== 'system').map(m => ({
              agentName: m.agentName,
              content: m.text
            }))
            localStorage.setItem('nexus-consultancy-discussion', JSON.stringify(forStorage))
          } catch { /* ignore storage errors */ }
          return updated
        })

        if (agent) {
          await speakText(cleanedText, agent)
        }

        await new Promise(resolve => setTimeout(resolve, 2000))

        setCurrentEmotion(null)
      }
    } catch (error) {
      console.error('Discussion error:', error)
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        agentId: 'system',
        agentName: 'System',
        agentIcon: '⚠️',
        role: 'System',
        text: 'There was an error during the discussion. Please try again.',
        timestamp: new Date()
      }])
    } finally {
      setIsDiscussing(false)
      setActiveAgent(null)
      setCurrentSpeech('')

      // Smart Autopilot hint: Only offer Autopilot AFTER the consultancy has served
      // its primary purpose — deep discussion, understanding needs, and creating a
      // tailored solution. Autopilot is the "cherry on top", not a shortcut.
      // Requirements:
      //   1. Feature enabled + not already shown
      //   2. User has had 3+ back-and-forth messages (real conversation depth)
      //   3. 2+ full rounds of agent responses (6+ agent messages for 3 agents)
      //   4. Discussion contains automation/workflow context
      //   5. 2+ distinct services mentioned
      if (FEATURE_FLAGS.AUTOPILOT_ENABLED && !autopilotSpec) {
        const currentMessages = messagesRef.current
        const allText = currentMessages.map(m => m.text).join(' ').toLowerCase()
        const userMessages = currentMessages.filter(m => m.agentId === 'user').length
        const agentResponses = currentMessages.filter(m => m.agentId !== 'user' && m.agentId !== 'system').length
        const hasAutomationContext = [
          'workflow', 'automate', 'automation', 'integrate', 'connect',
          'configure', 'set up', 'setup', 'api', 'oauth', 'webhook'
        ].some(kw => allText.includes(kw))
        // Require genuine conversation: 3+ user messages AND 6+ agent responses
        // This means at least 2-3 full rounds of back-and-forth discussion
        const deepEnoughDiscussion = userMessages >= 3 && agentResponses >= 6

        if (hasAutomationContext && deepEnoughDiscussion) {
          const detectedServices = extractServicesFromDiscussion(allText)
          if (detectedServices.length >= 2) {
            const spec = {
              name: workflowTitle || 'Consultancy Workflow',
              description: workflowContext || 'Workflow designed during AI Consultancy session',
              steps: detectedServices.map((svc, i) => ({
                id: `step_${i + 1}`,
                name: i === 0 ? `Trigger: ${svc}` : `Action: ${svc}`,
                tool: svc.toLowerCase(),
                type: i === 0 ? 'trigger' : 'action'
              })),
              requiredIntegrations: detectedServices.map(s => s.toLowerCase()),
              estimatedTimeSaved: '2+ hours/week'
            }
            setAutopilotSpec(spec)

            // Show hint message
            setMessages(prev => [...prev, {
              id: `autopilot-hint-${Date.now()}`,
              agentId: 'system',
              agentName: 'Nexus Autopilot',
              agentIcon: '🤖',
              role: 'System',
              text: `I notice this involves ${detectedServices.join(', ')} integration. I can configure all of these services for you automatically while you watch. Click the 🤖 button above to open Autopilot.`,
              timestamp: new Date()
            }])
          }
        }
      }
    }
  }, [mode, workflowTitle, workflowContext, messages, speakText, autopilotSpec])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const hasWorkflow = workflowContext || workflowTitle

      const industryGreeting = industryName
        ? ` Our consultants are specialized for the ${industryName} industry.`
        : ''

      const welcomeMessage: PartyModeMessage = {
        id: 'welcome-' + Date.now(),
        agentId: 'system',
        agentName: 'Nexus AI Consultancy',
        agentIcon: '🏢',
        role: 'System',
        text: hasWorkflow
          ? `Welcome to your AI Consultancy session.${industryGreeting} Our 8 expert consultants are ready to help with "${workflowTitle || 'your project'}". What would you like to explore?`
          : `Welcome to the Nexus AI Consultancy.${industryGreeting} You have 8 expert consultants spanning strategy, architecture, automation, analytics, operations, compliance, customer experience, and knowledge management. What challenge can we help you with?`,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])

      // Just show welcome - DON'T auto-start any discussion
      // Wait for user to ask their actual question
      humanTTSService.queueSpeech(welcomeMessage.text, 'system')
    }
  }, [isOpen, workflowContext, workflowTitle, industryName])

  const handleSendMessage = () => {
    if (!userInput.trim() || isDiscussing) return

    const userMessage: PartyModeMessage = {
      id: `user-${Date.now()}`,
      agentId: 'user',
      agentName: 'You',
      agentIcon: '👤',
      role: 'User',
      text: userInput,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    const prompt = userInput
    setUserInput('')
    runDiscussion(prompt)
  }

  const handleStopDiscussion = () => {
    discussionRef.current = false
    setIsDiscussing(false)
    setActiveAgent(null)
    setCurrentSpeech('')
    humanTTSService.stopAllAudio()
  }

  // Focus trap and keyboard handling
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const modalElement = modalRef.current
    if (!modalElement) return

    const previouslyFocused = document.activeElement as HTMLElement

    modalElement.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
      if (e.key === 'Tab') {
        const focusableElements = modalElement.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [isOpen, onClose])

  const { ref: swipeDismissRef } = useSwipeToDismiss({
    direction: 'down',
    threshold: 100,
    onDismiss: onClose,
    enabled: isOpen && typeof window !== 'undefined' && window.innerWidth < 768,
    hapticFeedback: true
  })

  const combinedRef = useCallback((node: HTMLDivElement | null) => {
    modalRef.current = node
    swipeDismissRef(node)
  }, [swipeDismissRef])

  if (!isOpen) return null

  const mobileHeight = keyboard.isVisible
    ? `calc(100vh - ${keyboard.height}px)`
    : '100vh'

  return (
    <div
      className={fullPage
        ? "w-full h-screen flex items-center justify-center bg-surface-950"
        : "fixed inset-0 z-50 flex bg-black/70 backdrop-blur-sm items-center justify-center"
      }
      role={fullPage ? undefined : "dialog"}
      aria-modal={fullPage ? undefined : true}
      aria-labelledby="meeting-room-title"
    >
      <div
        ref={combinedRef}
        tabIndex={-1}
        className={`relative bg-surface-900 overflow-hidden shadow-2xl outline-none flex flex-col ${
          fullPage
            ? 'w-full h-full'
            : isMobile
              ? 'w-full h-full'
              : 'w-full max-w-5xl h-[85vh] rounded-2xl border border-surface-700'
        }`}
        style={(isMobile && !fullPage) ? {
          height: mobileHeight,
          paddingBottom: `env(safe-area-inset-bottom, 0px)`
        } : undefined}
      >
        {/* SIMPLIFIED HEADER - ChatGPT Style */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700 bg-surface-900">
          <div className="flex items-center gap-3">
            {/* Back button on mobile */}
            {isMobile && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-surface-800 rounded-lg transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 id="meeting-room-title" className="font-semibold text-white">
                  AI Consultancy
                </h2>
                {/* @NEXUS-FIX-155: Industry badge when domain is known */}
                {industryName && (
                  <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">
                    {industryName} Specialists
                  </span>
                )}
              </div>
              <p className="text-xs text-surface-400">
                {isDiscussing ? 'Consulting...' : `${agents.length} expert consultants`}
              </p>
            </div>
          </div>

          {/* PRIMARY ACTIONS (MAX 5) */}
          <div className="flex items-center gap-2">
            {/* 1. Show Agents */}
            <button
              onClick={() => {
                setShowAgentsList(!showAgentsList)
                triggerHaptic('light')
              }}
              className={`p-2 rounded-lg transition-colors ${
                showAgentsList
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'hover:bg-surface-800 text-surface-400'
              }`}
              title="Show agents"
              aria-label="Toggle agents panel"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>

            {/* 2. Voice Toggle */}
            <button
              onClick={() => {
                setIsTTSEnabled(!isTTSEnabled)
                triggerHaptic('light')
              }}
              className={`p-2 rounded-lg transition-colors ${
                isTTSEnabled
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'bg-surface-800 text-surface-400'
              }`}
              title={isTTSEnabled ? 'Mute voices' : 'Enable voices'}
              aria-label={isTTSEnabled ? 'Mute voice output' : 'Enable voice output'}
            >
              {isTTSEnabled ? '🔊' : '🔇'}
            </button>

            {/* 3. Autopilot Toggle (feature-flagged) */}
            {FEATURE_FLAGS.AUTOPILOT_ENABLED && (
              <button
                onClick={() => {
                  setShowAutopilot(!showAutopilot)
                  if (!showAutopilot) setShowAgentsList(false) // Close agents when opening autopilot
                  triggerHaptic('medium')
                }}
                className={`p-2 rounded-lg transition-colors ${
                  showAutopilot
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'hover:bg-surface-800 text-surface-400'
                }`}
                title={showAutopilot ? 'Hide Autopilot' : 'Autopilot - AI configures for you'}
                aria-label="Toggle Autopilot panel"
              >
                🤖
              </button>
            )}

            {/* 4. Stop (when discussing) */}
            {isDiscussing && (
              <button
                onClick={handleStopDiscussion}
                className="px-3 py-1.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm font-medium"
              >
                Stop
              </button>
            )}

            {/* 4. Close (desktop only) */}
            {!isMobile && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-surface-800 rounded-lg transition-colors text-surface-400"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* MAIN CONTENT - FLAT STRUCTURE (NO NESTED TABS) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat Area - Always Visible */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => {
                // @NEXUS-FIX-157: Resolve industry-specific agent for display
                const agent = lookupAgent(message.agentId)
                const isUser = message.agentId === 'user'

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg border-2"
                        style={{
                          backgroundColor: agent ? `${agent.color}20` : isUser ? '#0ea5e9' : '#475569',
                          borderColor: agent?.color || (isUser ? '#0ea5e9' : '#64748b')
                        }}
                      >
                        {message.agentIcon || agent?.icon || (isUser ? '👤' : '🤖')}
                      </div>
                    </div>

                    {/* Message */}
                    <div className={`flex-1 max-w-[75%] ${isUser ? 'text-right' : ''}`}>
                      <div className={`flex items-baseline gap-2 mb-1 ${isUser ? 'justify-end' : ''}`}>
                        <span className="font-medium text-sm text-white">
                          {message.agentName}
                        </span>
                        <span className="text-xs text-surface-500">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div
                        className={`p-3 rounded-2xl ${
                          isUser
                            ? 'bg-cyan-500 text-white'
                            : 'bg-surface-800 text-white'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Typing indicator — @NEXUS-FIX-157: uses industry-specific agent */}
              {typingAgent && lookupAgent(typingAgent) && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg border-2"
                      style={{
                        backgroundColor: `${lookupAgent(typingAgent)!.color}20`,
                        borderColor: lookupAgent(typingAgent)!.color
                      }}
                    >
                      {lookupAgent(typingAgent)!.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-medium text-sm text-white">
                        {lookupAgent(typingAgent)!.displayName}
                      </span>
                      <span className="text-xs text-surface-500">thinking...</span>
                    </div>
                    <div className="p-3 bg-surface-800 rounded-2xl w-fit">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Sticky */}
            <div className="p-4 border-t border-surface-700 bg-surface-900">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage()
                    }
                  }}
                  placeholder={isDiscussing ? "Consultants are analyzing..." : "Ask your consultants anything..."}
                  disabled={isDiscussing}
                  className="flex-1 px-4 py-3 bg-surface-800 border border-surface-700 rounded-xl text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isDiscussing || !userInput.trim()}
                  className="px-6 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>

              {/* Quick Actions - Full text visible, wrapped */}
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={() => setUserInput('What AI strategy should we adopt for our business?')}
                  className="px-4 py-2 bg-surface-800 border border-surface-600 text-surface-200 rounded-xl hover:bg-surface-700 hover:border-nexus-500/50 transition-colors text-sm"
                >
                  🎯 AI Strategy for our business
                </button>
                <button
                  onClick={() => setUserInput('What processes should we automate first for maximum ROI?')}
                  className="px-4 py-2 bg-surface-800 border border-surface-600 text-surface-200 rounded-xl hover:bg-surface-700 hover:border-nexus-500/50 transition-colors text-sm"
                >
                  ⚡ What to automate first for max ROI
                </button>
                <button
                  onClick={() => setUserInput('How can we use data analytics to improve our decision making?')}
                  className="px-4 py-2 bg-surface-800 border border-surface-600 text-surface-200 rounded-xl hover:bg-surface-700 hover:border-nexus-500/50 transition-colors text-sm"
                >
                  📊 Data analytics for better decisions
                </button>
                <button
                  onClick={() => setUserInput('What compliance and risk considerations do we need for AI?')}
                  className="px-4 py-2 bg-surface-800 border border-surface-600 text-surface-200 rounded-xl hover:bg-surface-700 hover:border-nexus-500/50 transition-colors text-sm"
                >
                  🛡️ Compliance & risk for AI
                </button>
                <button
                  onClick={() => setUserInput('How can we improve our customer experience using AI?')}
                  className="px-4 py-2 bg-surface-800 border border-surface-600 text-surface-200 rounded-xl hover:bg-surface-700 hover:border-nexus-500/50 transition-colors text-sm"
                >
                  ✨ Improve customer experience with AI
                </button>
              </div>
            </div>
          </div>

          {/* Autopilot Panel - Right Side (Desktop) / Overlay (Mobile) */}
          {showAutopilot && FEATURE_FLAGS.AUTOPILOT_ENABLED && (
            <div
              className={`${
                isMobile
                  ? 'absolute inset-0 bg-surface-950 z-20'
                  : 'w-[480px] border-l border-surface-700 bg-surface-950'
              } flex flex-col overflow-hidden`}
            >
              <AutopilotPanel
                workflowSpec={autopilotSpec}
                onClose={() => setShowAutopilot(false)}
                onComplete={() => {
                  setShowAutopilot(false)
                  // Add a success message to the consultancy chat
                  setMessages(prev => [...prev, {
                    id: `autopilot-done-${Date.now()}`,
                    agentId: 'system',
                    agentName: 'Nexus Autopilot',
                    agentIcon: '🤖',
                    role: 'System',
                    text: 'All services have been configured successfully! Your workflow is ready to run.',
                    timestamp: new Date()
                  }])
                }}
              />
            </div>
          )}

          {/* Agents Panel - Sidebar (Desktop) / Overlay (Mobile) */}
          {showAgentsList && (
            <div
              className={`${
                isMobile
                  ? 'absolute inset-0 bg-surface-900 z-10'
                  : 'w-80 border-l border-surface-700'
              } flex flex-col`}
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between p-4 border-b border-surface-700">
                <h3 className="font-semibold text-white">Consultants ({agents.length})</h3>
                <button
                  onClick={() => setShowAgentsList(false)}
                  className="p-2 hover:bg-surface-800 rounded-lg transition-colors"
                  aria-label="Close agents panel"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Agents Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-3">
                  {agents.map((agent) => {
                    const isActive = activeAgent === agent.id
                    const isTyping = typingAgent === agent.id

                    return (
                      <div
                        key={agent.id}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          isActive
                            ? 'border-cyan-500 bg-cyan-950'
                            : isTyping
                            ? 'border-cyan-700 bg-cyan-950/50'
                            : 'border-surface-700 bg-surface-800'
                        }`}
                      >
                        <div className="flex flex-col items-center text-center gap-2">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2"
                            style={{
                              backgroundColor: `${agent.color}20`,
                              borderColor: agent.color
                            }}
                          >
                            {agent.icon}
                          </div>
                          <div>
                            <div className="font-medium text-sm text-white">
                              {agent.displayName}
                            </div>
                            <div className="text-xs text-surface-400">
                              {agent.title.split(' + ')[0]}
                            </div>
                          </div>
                          {isTyping && (
                            <div className="text-xs text-cyan-400">
                              Thinking...
                            </div>
                          )}
                          {isActive && (
                            <div className="text-xs text-green-400 flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                              Speaking
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Export the same button components for backwards compatibility
export { MeetingRoomButton } from './AIMeetingRoom'

export default AIMeetingRoomV2
