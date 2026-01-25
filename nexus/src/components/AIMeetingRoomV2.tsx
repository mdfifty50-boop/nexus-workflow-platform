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
  type NexusAgentPersona,
  type PartyModeMessage
} from '../lib/nexus-party-mode-service'
import { humanTTSService } from '../lib/human-tts-service'
import { useSwipeToDismiss } from '../hooks/useSwipeNavigation'

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

interface AIMeetingRoomV2Props {
  isOpen: boolean
  onClose: () => void
  workflowContext?: string
  workflowTitle?: string
  workflowId?: string
  mode?: 'optimization' | 'troubleshooting' | 'brainstorm'
}

export function AIMeetingRoomV2({
  isOpen,
  onClose,
  workflowContext,
  workflowTitle,
  workflowId,
  mode = 'optimization'
}: AIMeetingRoomV2Props) {
  const [messages, setMessages] = useState<PartyModeMessage[]>([])
  const [userInput, setUserInput] = useState('')
  const [isDiscussing, setIsDiscussing] = useState(false)
  const [activeAgent, setActiveAgent] = useState<string | null>(null)
  const [isTTSEnabled, setIsTTSEnabled] = useState(true)
  const [typingAgent, setTypingAgent] = useState<string | null>(null)
  const [showAgentsList, setShowAgentsList] = useState(false) // Show/hide agents panel
  const [_isAPIConfigured, setIsAPIConfigured] = useState(false)
  const [_currentEmotion, setCurrentEmotion] = useState<{ emoji: string; color: string; label: string } | null>(null)
  const [_currentSpeech, setCurrentSpeech] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const discussionRef = useRef<boolean>(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isMobile = useIsMobile()
  const keyboard = useKeyboardVisible()

  const agents = Object.values(NEXUS_AGENTS)

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
      const result = await nexusPartyModeService.runDiscussionRound(
        {
          topic: workflowTitle || 'workflow optimization',
          mode,
          workflowContext,
          maxRoundsPerResponse: 3
        },
        messages,
        userPrompt || undefined
      )

      for (const message of result.messages) {
        if (!discussionRef.current) break

        const agent = NEXUS_AGENTS[message.agentId]
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

        setMessages(prev => [...prev, cleanedMessage])

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
    }
  }, [mode, workflowTitle, workflowContext, messages, speakText])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const hasWorkflow = workflowContext || workflowTitle

      const welcomeMessage: PartyModeMessage = {
        id: 'welcome-' + Date.now(),
        agentId: 'system',
        agentName: 'Nexus AI Team',
        agentIcon: '🎉',
        role: 'System',
        text: hasWorkflow
          ? `Welcome! Our 8 expert agents are ready to help with "${workflowTitle || 'your workflow'}". What would you like to know or discuss?`
          : `Welcome! All 8 Nexus agents are here. What would you like to discuss?`,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])

      // Just show welcome - DON'T auto-start any discussion
      // Wait for user to ask their actual question
      humanTTSService.queueSpeech(welcomeMessage.text, 'system')
    }
  }, [isOpen, workflowContext, workflowTitle])

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
      className="fixed inset-0 z-50 flex bg-black/70 backdrop-blur-sm items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="meeting-room-title"
    >
      <div
        ref={combinedRef}
        tabIndex={-1}
        className={`relative bg-white dark:bg-slate-900 overflow-hidden shadow-2xl outline-none flex flex-col ${
          isMobile
            ? 'w-full h-full'
            : 'w-full max-w-5xl h-[85vh] rounded-2xl border border-slate-200 dark:border-slate-700'
        }`}
        style={isMobile ? {
          height: mobileHeight,
          paddingBottom: `env(safe-area-inset-bottom, 0px)`
        } : undefined}
      >
        {/* SIMPLIFIED HEADER - ChatGPT Style */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            {/* Back button on mobile */}
            {isMobile && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div>
              <h2 id="meeting-room-title" className="font-semibold text-slate-900 dark:text-white">
                AI Team Chat
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isDiscussing ? 'Discussing...' : `${agents.length} agents available`}
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
                  ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
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
                  ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
              title={isTTSEnabled ? 'Mute voices' : 'Enable voices'}
              aria-label={isTTSEnabled ? 'Mute voice output' : 'Enable voice output'}
            >
              {isTTSEnabled ? '🔊' : '🔇'}
            </button>

            {/* 3. Stop (when discussing) */}
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
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
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
                const agent = NEXUS_AGENTS[message.agentId]
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
                        <span className="font-medium text-sm text-slate-900 dark:text-white">
                          {message.agentName}
                        </span>
                        <span className="text-xs text-slate-500">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div
                        className={`p-3 rounded-2xl ${
                          isUser
                            ? 'bg-cyan-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Typing indicator */}
              {typingAgent && NEXUS_AGENTS[typingAgent] && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg border-2"
                      style={{
                        backgroundColor: `${NEXUS_AGENTS[typingAgent].color}20`,
                        borderColor: NEXUS_AGENTS[typingAgent].color
                      }}
                    >
                      {NEXUS_AGENTS[typingAgent].icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-medium text-sm text-slate-900 dark:text-white">
                        {NEXUS_AGENTS[typingAgent].displayName}
                      </span>
                      <span className="text-xs text-slate-500">thinking...</span>
                    </div>
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Sticky */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
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
                  placeholder={isDiscussing ? "Agents are discussing..." : "Ask the team..."}
                  disabled={isDiscussing}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isDiscussing || !userInput.trim()}
                  className="px-6 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>

              {/* Quick Actions - Reduced to 5 */}
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                <button
                  onClick={() => setUserInput('How can we improve performance?')}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm whitespace-nowrap"
                >
                  ⚡ Performance
                </button>
                <button
                  onClick={() => setUserInput('What are the risks?')}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm whitespace-nowrap"
                >
                  ⚠️ Risks
                </button>
                <button
                  onClick={() => setUserInput('How can we improve UX?')}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm whitespace-nowrap"
                >
                  ✨ UX
                </button>
                <button
                  onClick={() => setUserInput('What tests should we add?')}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm whitespace-nowrap"
                >
                  🧪 Testing
                </button>
                <button
                  onClick={() => setUserInput('How can we reduce costs?')}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm whitespace-nowrap"
                >
                  💰 Cost
                </button>
              </div>
            </div>
          </div>

          {/* Agents Panel - Sidebar (Desktop) / Overlay (Mobile) */}
          {showAgentsList && (
            <div
              className={`${
                isMobile
                  ? 'absolute inset-0 bg-white dark:bg-slate-900 z-10'
                  : 'w-80 border-l border-slate-200 dark:border-slate-700'
              } flex flex-col`}
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white">AI Team ({agents.length})</h3>
                <button
                  onClick={() => setShowAgentsList(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
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
                            ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950'
                            : isTyping
                            ? 'border-cyan-300 dark:border-cyan-700 bg-cyan-50/50 dark:bg-cyan-950/50'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
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
                            <div className="font-medium text-sm text-slate-900 dark:text-white">
                              {agent.displayName}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {agent.title.split(' + ')[0]}
                            </div>
                          </div>
                          {isTyping && (
                            <div className="text-xs text-cyan-600 dark:text-cyan-400">
                              Thinking...
                            </div>
                          )}
                          {isActive && (
                            <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
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
