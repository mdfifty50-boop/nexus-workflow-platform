// AI Meeting Room - Real Nexus Party Mode Implementation
// Uses actual Nexus methodology with intelligent agent selection and in-character responses
// Powered by nexus-party-mode-service.ts
// Enhanced with human-like TTS (OpenAI/ElevenLabs style voices) and queue-based speech
// V2: Visual improvements - prominence, emotions, typing indicators, @ mentions
// V3: Mobile-responsive with bottom sheet on mobile, keyboard avoidance, sticky chat input
// V4: Enhanced mobile UX - larger avatars, swipe gestures, haptics, pull-to-refresh, improved scrolling
// V5: OpenAI UI polish - visual hierarchy, bottom sheet snap points, message card differentiation, simplified header, touch improvements

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

// Hook to detect if we're on mobile
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

// Hook for keyboard visibility detection
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

// Haptic feedback utility (works on supported devices)
function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if ('vibrate' in navigator) {
    const duration = type === 'light' ? 10 : type === 'medium' ? 20 : 50
    navigator.vibrate(duration)
  }
}

// Hook for swipe between tabs
function useSwipeToSwitchTabs(
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  enabled: boolean
) {
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return
    touchStartX.current = e.touches[0].clientX
  }, [enabled])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled) return
    touchEndX.current = e.touches[0].clientX
  }, [enabled])

  const handleTouchEnd = useCallback(() => {
    if (!enabled) return
    const swipeDistance = touchStartX.current - touchEndX.current
    const threshold = 50

    if (Math.abs(swipeDistance) > threshold) {
      if (swipeDistance > 0) {
        // Swiped left
        onSwipeLeft()
        triggerHaptic('light')
      } else {
        // Swiped right
        onSwipeRight()
        triggerHaptic('light')
      }
    }
  }, [enabled, onSwipeLeft, onSwipeRight])

  useEffect(() => {
    if (!enabled) return

    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd])
}

// Hook for pull-to-refresh
function usePullToRefresh(onRefresh: () => void, enabled: boolean) {
  const touchStartY = useRef(0)
  const pullDistance = useRef(0)
  const [isPulling, setIsPulling] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || !containerRef.current) return
    const container = containerRef.current
    if (container.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY
    }
  }, [enabled])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !containerRef.current || touchStartY.current === 0) return
    const container = containerRef.current
    if (container.scrollTop > 0) return

    const touchY = e.touches[0].clientY
    const distance = touchY - touchStartY.current

    if (distance > 0 && distance < 150) {
      pullDistance.current = distance
      setIsPulling(true)
      e.preventDefault()
    }
  }, [enabled])

  const handleTouchEnd = useCallback(() => {
    if (!enabled) return
    if (pullDistance.current > 80) {
      triggerHaptic('medium')
      onRefresh()
    }
    touchStartY.current = 0
    pullDistance.current = 0
    setIsPulling(false)
  }, [enabled, onRefresh])

  useEffect(() => {
    const container = containerRef.current
    if (!enabled || !container) return

    container.addEventListener('touchstart', handleTouchStart)
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd])

  return { containerRef, isPulling }
}

// Bottom sheet snap points: peek (20%), half (50%), full (90%)
type SnapPoint = 'peek' | 'half' | 'full'

function useBottomSheetSnap() {
  const [snapPoint, setSnapPoint] = useState<SnapPoint>('full')
  const [isDragging, setIsDragging] = useState(false)
  const startY = useRef(0)
  const currentY = useRef(0)
  const sheetRef = useRef<HTMLDivElement>(null)

  const snapToPoint = useCallback((point: SnapPoint) => {
    setSnapPoint(point)
    triggerHaptic('light')
  }, [])

  const handleDragStart = useCallback((clientY: number) => {
    startY.current = clientY
    currentY.current = clientY
    setIsDragging(true)
  }, [])

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDragging) return
    currentY.current = clientY
  }, [isDragging])

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)

    const dragDistance = currentY.current - startY.current
    const threshold = 100

    if (Math.abs(dragDistance) < threshold) return

    // Dragging down
    if (dragDistance > 0) {
      if (snapPoint === 'full') {
        snapToPoint('half')
      } else if (snapPoint === 'half') {
        snapToPoint('peek')
      }
    }
    // Dragging up
    else {
      if (snapPoint === 'peek') {
        snapToPoint('half')
      } else if (snapPoint === 'half') {
        snapToPoint('full')
      }
    }
  }, [isDragging, snapPoint, snapToPoint])

  const getHeightClass = useCallback(() => {
    switch (snapPoint) {
      case 'peek': return 'h-[20vh]'
      case 'half': return 'h-[50vh]'
      case 'full': return 'h-[90vh]'
    }
  }, [snapPoint])

  return {
    snapPoint,
    snapToPoint,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    getHeightClass,
    sheetRef,
    isDragging
  }
}

// Position calculations for circular table layout
const getAgentPosition = (index: number, total: number, tableRadius: number) => {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2 // Start from top
  return {
    x: Math.cos(angle) * tableRadius,
    y: Math.sin(angle) * tableRadius,
  }
}

// Emotion detection from text for visual indicators
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

interface AIMeetingRoomProps {
  isOpen: boolean
  onClose: () => void
  workflowContext?: string
  workflowTitle?: string
  workflowId?: string // For workflow-specific audio tracking
  mode?: 'optimization' | 'troubleshooting' | 'brainstorm'
}

export function AIMeetingRoom({
  isOpen,
  onClose,
  workflowContext,
  workflowTitle,
  workflowId,
  mode = 'optimization'
}: AIMeetingRoomProps) {
  const [messages, setMessages] = useState<PartyModeMessage[]>([])
  const [userInput, setUserInput] = useState('')
  const [isDiscussing, setIsDiscussing] = useState(false)
  const [activeAgent, setActiveAgent] = useState<string | null>(null)
  const [currentSpeech, setCurrentSpeech] = useState<string>('')
  const [isTTSEnabled, setIsTTSEnabled] = useState(true)
  const [isAPIConfigured, setIsAPIConfigured] = useState(false)
  const [typingAgent, setTypingAgent] = useState<string | null>(null) // Agent preparing to speak
  const [currentEmotion, setCurrentEmotion] = useState<{ emoji: string; color: string; label: string } | null>(null)
  const [mentionedAgent, setMentionedAgent] = useState<string | null>(null) // For @ mentions
  const [showAgentPicker, setShowAgentPicker] = useState(false)
  const [mobileView, setMobileView] = useState<'chat' | 'agents'>('chat') // Mobile tab view
  const [replyToMessage, setReplyToMessage] = useState<PartyModeMessage | null>(null) // For swipe-to-reply
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const discussionRef = useRef<boolean>(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Mobile responsive hooks
  const isMobile = useIsMobile()
  const keyboard = useKeyboardVisible()
  const bottomSheet = useBottomSheetSnap()

  // Swipe between tabs (Chat ↔ Agents)
  useSwipeToSwitchTabs(
    () => setMobileView('agents'), // Swipe left → Agents
    () => setMobileView('chat'), // Swipe right → Chat
    isMobile && isOpen
  )

  // Pull-to-refresh on chat
  const handleRefresh = useCallback(() => {
    if (messages.length === 0) return
    // Simulate refresh - could re-run last discussion or show notification
    triggerHaptic('medium')
    // Just scroll to top for now (messages already loaded)
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const { containerRef: pullToRefreshRef, isPulling } = usePullToRefresh(
    handleRefresh,
    isMobile && mobileView === 'chat'
  )

  // Get all Nexus agents for display
  const agents = Object.values(NEXUS_AGENTS)

  // Check API configuration on mount
  useEffect(() => {
    setIsAPIConfigured(nexusPartyModeService.canMakeAPICalls())
  }, [])

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Audio lifecycle: Set workflow context and cleanup on unmount
  useEffect(() => {
    // Set the active workflow when component mounts or workflowId changes
    if (isOpen) {
      humanTTSService.setActiveWorkflow(workflowId || 'default-meeting-room')
    }

    // Cleanup: Stop all audio when component unmounts or closes
    return () => {
      humanTTSService.stopAllAudio()
      humanTTSService.setActiveWorkflow(null)
    }
  }, [isOpen, workflowId])

  // Audio lifecycle: Stop audio when meeting room closes
  useEffect(() => {
    if (!isOpen) {
      humanTTSService.stopAllAudio()
    }
  }, [isOpen])

  // Audio lifecycle: Stop audio when minimized to peek on mobile
  useEffect(() => {
    if (isMobile && bottomSheet.snapPoint === 'peek') {
      humanTTSService.stopAllAudio()
    }
  }, [isMobile, bottomSheet.snapPoint])

  // Human-like TTS using queue-based service (prevents overlapping)
  // Supports OpenAI TTS, ElevenLabs, with browser fallback
  const speakText = useCallback(async (text: string, agent: NexusAgentPersona): Promise<void> => {
    if (!isTTSEnabled) return

    // Use queue-based TTS service for natural, non-overlapping speech
    return new Promise((resolve) => {
      humanTTSService.queueSpeech(text, agent.id, {
        priority: 0,
        onEnd: () => resolve()
      })
    })
  }, [isTTSEnabled])

  // Update TTS mute state when toggled
  useEffect(() => {
    humanTTSService.setMuted(!isTTSEnabled)
  }, [isTTSEnabled])

  // Run a real Nexus Party Mode discussion round
  const runDiscussion = useCallback(async (userPrompt: string) => {
    setIsDiscussing(true)
    discussionRef.current = true

    try {
      // Run discussion using real Nexus Party Mode service
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

      // Display each agent's response sequentially with speaking animation
      for (const message of result.messages) {
        if (!discussionRef.current) break

        // Find the agent persona
        const agent = NEXUS_AGENTS[message.agentId]
        if (!agent) continue

        // Show typing indicator first (agent is thinking)
        setTypingAgent(message.agentId)
        setActiveAgent(null)
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 600))

        // Clean the response text - remove any action descriptions like *nods thoughtfully*
        const cleanedText = cleanAgentResponse(message.text)
        const cleanedMessage = { ...message, text: cleanedText }

        // Detect emotion from the response
        const emotion = detectEmotion(cleanedText)
        setCurrentEmotion(emotion)

        // Clear typing, set active agent for visual highlighting
        setTypingAgent(null)
        setActiveAgent(message.agentId)
        setCurrentSpeech(cleanedText)

        // Add message to the transcript
        setMessages(prev => [...prev, cleanedMessage])

        // Speak the text
        if (agent) {
          await speakText(cleanedText, agent)
        }

        // Wait between responses for natural pacing
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Clear emotion after transition
        setCurrentEmotion(null)
      }
    } catch (error) {
      console.error('Discussion error:', error)
      // Add error message
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

  // Auto-start discussion when opened with workflow context absorption
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Generate smart welcome that incorporates workflow context
      const hasWorkflow = workflowContext || workflowTitle

      // Create personalized welcome message that absorbs workflow context
      const welcomeMessage: PartyModeMessage = {
        id: 'welcome-' + Date.now(),
        agentId: 'system',
        agentName: 'Nexus Party Mode',
        agentIcon: '🎉',
        role: 'System',
        text: hasWorkflow
          ? `Welcome! The entire Nexus team is here and ready to help with "${workflowTitle || 'your workflow'}". Our 8 experts are standing by. What would you like to know or discuss?`
          : `Welcome! All 8 Nexus agents are here and ready for a dynamic group discussion. What would you like to discuss?`,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])

      // Just show welcome - DON'T auto-start any discussion
      // Wait for user to ask their actual question
      humanTTSService.queueSpeech(welcomeMessage.text, 'system')
    }
  }, [isOpen, workflowContext, workflowTitle]) // Include workflow dependencies

  // Handle user message submission
  const handleSendMessage = () => {
    if (!userInput.trim() || isDiscussing) return

    // Add user message
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

  // Stop the current discussion and TTS
  const handleStopDiscussion = () => {
    discussionRef.current = false
    setIsDiscussing(false)
    setActiveAgent(null)
    setCurrentSpeech('')
    // Stop all audio immediately (clears queue and stops playback)
    humanTTSService.stopAllAudio()
  }

  // Session 8: Focus trap for accessibility
  const modalRef = useRef<HTMLDivElement>(null)

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!isOpen) return

    const modalElement = modalRef.current
    if (!modalElement) return

    // Store the previously focused element
    const previouslyFocused = document.activeElement as HTMLElement

    // Focus the modal container
    modalElement.focus()

    // Handle escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
      // Focus trap
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

  // Swipe down to dismiss on mobile
  const { ref: swipeDismissRef } = useSwipeToDismiss({
    direction: 'down',
    threshold: 100,
    onDismiss: onClose,
    enabled: isOpen && typeof window !== 'undefined' && window.innerWidth < 768,
    hapticFeedback: true
  })

  // Combine refs
  const combinedRef = useCallback((node: HTMLDivElement | null) => {
    modalRef.current = node
    swipeDismissRef(node)
  }, [swipeDismissRef])

  if (!isOpen) return null

  // Calculate height considering keyboard on mobile
  const mobileHeight = keyboard.isVisible
    ? `calc(100vh - ${keyboard.height}px)`
    : '100vh'

  return (
    <div
      className={`fixed inset-0 z-50 flex bg-black/80 backdrop-blur-sm ${
        isMobile ? 'items-end' : 'items-center justify-center'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="meeting-room-title"
    >
      <div
        ref={combinedRef}
        tabIndex={-1}
        className={`relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 outline-none ${
          isMobile
            ? 'w-full rounded-t-3xl'
            : 'w-full max-w-7xl h-[90vh] rounded-2xl'
        }`}
        style={isMobile ? {
          height: mobileHeight,
          maxHeight: '95vh',
          paddingBottom: `env(safe-area-inset-bottom, 0px)`
        } : undefined}
      >
        {/* Mobile drag handle */}
        {isMobile && (
          <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
            <div className="w-10 h-1 rounded-full bg-slate-600 hover:bg-slate-500 transition-colors" aria-hidden="true" />
          </div>
        )}

        {/* Header - Responsive */}
        <div className={`${isMobile ? 'relative' : 'absolute top-0 left-0 right-0'} z-20 flex items-center justify-between px-4 md:px-6 ${isMobile ? 'py-2' : 'py-4'} bg-gradient-to-b from-slate-900/95 to-transparent`}>
          <div className="flex items-center gap-2 md:gap-4 flex-wrap min-w-0">
            {/* Compact mobile header */}
            {isMobile ? (
              <>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isDiscussing ? 'bg-green-500 animate-pulse' : 'bg-red-500 animate-pulse'}`} aria-hidden="true" />
                  <h2 id="meeting-room-title" className="font-bold text-white text-sm">
                    {isDiscussing ? 'AI Team Discussing...' : 'AI Team Chat'}
                  </h2>
                </div>
                {activeAgent && NEXUS_AGENTS[activeAgent] && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-cyan-500/20 rounded-full border border-cyan-500/30">
                    <span className="text-xs">{NEXUS_AGENTS[activeAgent].icon}</span>
                    <span className="text-xs text-cyan-400">{NEXUS_AGENTS[activeAgent].displayName}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse flex-shrink-0" aria-hidden="true" />
                <h2 id="meeting-room-title" className="font-bold text-white truncate text-xl">
                  {mode === 'optimization' ? 'Workflow Setup Assistant' : mode === 'troubleshooting' ? 'Troubleshoot Workflow' : 'AI Brainstorm'}
                </h2>
                <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded-full border border-cyan-500/30 flex-shrink-0">
                  AI Team
                </span>
                {!isAPIConfigured && (
                  <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded border border-yellow-500/30">
                    Simulation Mode
                  </span>
                )}
                {humanTTSService.hasHighQualityTTS() && (
                  <span className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">
                    HD Voice ({humanTTSService.getProvider() === 'openai' ? 'OpenAI' : 'ElevenLabs'})
                  </span>
                )}
                {workflowTitle && (
                  <>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-300">{workflowTitle}</span>
                  </>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <button
              onClick={() => {
                setIsTTSEnabled(!isTTSEnabled)
                triggerHaptic('light')
              }}
              className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors ${isTTSEnabled ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-400'}`}
              title={isTTSEnabled ? 'Mute voices' : 'Enable voices'}
              aria-label={isTTSEnabled ? 'Mute voice output' : 'Enable voice output'}
              aria-pressed={isTTSEnabled}
            >
              <span aria-hidden="true">{isTTSEnabled ? '🔊' : '🔇'}</span>
            </button>
            <button
              onClick={() => {
                triggerHaptic('light')
                onClose()
              }}
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors"
              aria-label="Close meeting room"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>
        </div>

        {/* Mobile Tab Switcher with swipe hint */}
        {isMobile && (
          <div className="relative">
            <div className="flex border-b border-slate-700/50">
              <button
                onClick={() => {
                  setMobileView('chat')
                  triggerHaptic('light')
                }}
                className={`flex-1 py-3 text-sm font-medium transition-all ${
                  mobileView === 'chat'
                    ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                💬 Chat
              </button>
              <button
                onClick={() => {
                  setMobileView('agents')
                  triggerHaptic('light')
                }}
                className={`flex-1 py-3 text-sm font-medium transition-all ${
                  mobileView === 'agents'
                    ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                👥 Agents ({agents.length})
              </button>
            </div>
            {/* Swipe hint */}
            <div className="absolute -bottom-5 left-0 right-0 flex justify-center opacity-50">
              <div className="text-[10px] text-slate-500 px-2 py-0.5 bg-slate-800/80 rounded-full">
                ← Swipe to switch →
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={`flex h-full ${isMobile ? 'flex-col mt-6' : 'pt-16'}`}>
          {/* Meeting Room Visualization - Left Side (or full on mobile agents tab) */}
          <div className={`${
            isMobile
              ? mobileView === 'agents' ? 'flex-1' : 'hidden'
              : 'w-1/2'
          } relative flex items-center justify-center ${isMobile ? 'p-4 overflow-y-auto' : 'p-8'}`}>
            {/* Mobile Agent Grid or Desktop Circular Table */}
            {isMobile && mobileView === 'agents' ? (
              /* Mobile: Large Grid Layout */
              <div className="w-full space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-white mb-1">AI Team Members</h3>
                  <p className="text-sm text-slate-400">{agents.length} expert agents ready to help</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {agents.map((agent) => {
                    const isActive = activeAgent === agent.id
                    const isTyping = typingAgent === agent.id

                    return (
                      <div
                        key={agent.id}
                        className={`relative p-4 rounded-2xl border-2 transition-all ${
                          isActive
                            ? 'bg-gradient-to-br from-cyan-900/40 to-purple-900/40 border-cyan-400 shadow-lg shadow-cyan-500/30'
                            : isTyping
                            ? 'bg-slate-800/80 border-cyan-500/50 shadow-md'
                            : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {/* Avatar - Larger on mobile */}
                        <div className="flex flex-col items-center text-center gap-3">
                          <div
                            className={`relative rounded-full flex items-center justify-center transition-all duration-300 ${
                              isActive ? 'animate-pulse' : ''
                            }`}
                            style={{
                              backgroundColor: `${agent.color}30`,
                              borderColor: agent.color,
                              borderWidth: isActive ? 4 : 2,
                              width: 80,
                              height: 80,
                              boxShadow: isActive ? `0 0 30px ${agent.color}60` : 'none'
                            }}
                          >
                            <span className="text-4xl">{agent.icon}</span>

                            {/* Status indicator */}
                            <div
                              className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-800 ${
                                isActive ? 'bg-green-500' : isTyping ? 'bg-yellow-500 animate-pulse' : 'bg-slate-600'
                              }`}
                            />
                          </div>

                          <div className="w-full">
                            <div className={`font-semibold text-sm mb-1 ${isActive ? 'text-cyan-300' : 'text-white'}`}>
                              {agent.displayName}
                            </div>
                            <div className="text-xs text-slate-400 line-clamp-2">
                              {agent.title.split(' + ')[0]}
                            </div>
                          </div>

                          {/* Status text */}
                          {isTyping && (
                            <div className="text-xs text-cyan-400 animate-pulse">
                              Thinking...
                            </div>
                          )}
                          {isActive && (
                            <div className="text-xs text-green-400 flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                              Speaking
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              /* Desktop: Circular Table Layout */
              <div className="relative w-full max-w-lg aspect-square">
                {/* Table Surface */}
                <div className="absolute inset-[20%] rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-4 border-slate-600 shadow-2xl">
                  {/* Central Screen/Hologram - Enhanced */}
                  <div className="absolute inset-4 rounded-full bg-gradient-to-br from-cyan-900/30 to-purple-900/30 border border-cyan-500/20 flex items-center justify-center overflow-hidden">
                    <div className="text-center p-4">
                      {activeAgent && NEXUS_AGENTS[activeAgent] ? (
                        <div className="animate-fade-in">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="text-2xl">{NEXUS_AGENTS[activeAgent].icon}</span>
                            <div className="text-cyan-400 text-sm font-semibold">
                              {NEXUS_AGENTS[activeAgent].displayName}
                            </div>
                          </div>
                          <p className="text-white text-xs leading-relaxed max-h-28 overflow-y-auto px-2">
                            {currentSpeech.slice(0, 120)}{currentSpeech.length > 120 ? '...' : ''}
                          </p>
                          {currentEmotion && (
                            <div className="mt-2 text-lg" title={currentEmotion.label}>
                              {currentEmotion.emoji}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-slate-500">
                          <div className="text-4xl mb-2">{mode === 'optimization' ? '⚙️' : mode === 'troubleshooting' ? '🔧' : '💡'}</div>
                          <div className="text-sm font-medium">
                            {mode === 'optimization' ? 'Ready for Questions' : mode === 'troubleshooting' ? 'Ready to Help' : 'Ready to Brainstorm'}
                          </div>
                          <div className="text-xs text-slate-600 mt-1">AI Team Ready</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nexus Agents around the table (desktop only) */}
                {agents.map((agent, index) => {
                  const pos = getAgentPosition(index, agents.length, 45)
                  const isActive = activeAgent === agent.id
                  const isTyping = typingAgent === agent.id
                  const isMentioned = mentionedAgent === agent.id

                  return (
                    <div
                      key={agent.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out"
                      style={{
                        left: `${50 + pos.x}%`,
                        top: `${50 + pos.y}%`,
                        zIndex: isActive ? 20 : isTyping ? 15 : isMentioned ? 10 : 1,
                      }}
                    >
                    <div className={`relative transition-all duration-500 ease-out ${isActive ? 'scale-150' : isTyping ? 'scale-125' : 'scale-100'}`}>
                      {/* Pulsing ring for active/speaking agent */}
                      {isActive && (
                        <div
                          className="absolute inset-0 rounded-full animate-ping opacity-30"
                          style={{
                            backgroundColor: currentEmotion?.color || agent.color,
                            width: 80,
                            height: 80,
                            marginLeft: -8,
                            marginTop: -8
                          }}
                        />
                      )}

                      {/* Avatar with agent icon */}
                      <div
                        className={`relative rounded-full transition-all duration-300`}
                        style={{
                          boxShadow: isActive
                            ? `0 0 40px ${currentEmotion?.color || agent.color}80, 0 0 80px ${currentEmotion?.color || agent.color}40`
                            : isTyping
                            ? `0 0 20px ${agent.color}60`
                            : 'none'
                        }}
                      >
                        <div
                          className={`rounded-full flex items-center justify-center transition-all duration-300 border-3`}
                          style={{
                            backgroundColor: `${agent.color}${isActive ? '40' : '20'}`,
                            borderColor: isActive ? (currentEmotion?.color || agent.color) : `${agent.color}${isTyping ? '80' : '50'}`,
                            borderWidth: isActive ? 4 : 2,
                            width: isActive ? 72 : isTyping ? 56 : 48,
                            height: isActive ? 72 : isTyping ? 56 : 48,
                          }}
                        >
                          <span className={`transition-all duration-300 ${isActive ? 'text-3xl' : 'text-xl'}`}>
                            {agent.icon}
                          </span>
                        </div>

                        {/* Emotion indicator badge */}
                        {isActive && currentEmotion && (
                          <div
                            className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm border-2 border-slate-800 animate-bounce"
                            style={{ backgroundColor: currentEmotion.color }}
                            title={currentEmotion.label}
                          >
                            {currentEmotion.emoji}
                          </div>
                        )}

                        {/* Typing indicator (thinking dots) */}
                        {isTyping && (
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1 px-2 py-1 bg-slate-700 rounded-full">
                            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        )}

                        {/* Speaking indicator - audio wave animation */}
                        {isActive && !isTyping && (
                          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-end gap-0.5 h-4">
                            <div className="w-1 bg-cyan-400 rounded-full animate-pulse" style={{ height: '40%', animationDelay: '0ms' }} />
                            <div className="w-1 bg-cyan-400 rounded-full animate-pulse" style={{ height: '100%', animationDelay: '100ms' }} />
                            <div className="w-1 bg-cyan-400 rounded-full animate-pulse" style={{ height: '60%', animationDelay: '200ms' }} />
                            <div className="w-1 bg-cyan-400 rounded-full animate-pulse" style={{ height: '80%', animationDelay: '300ms' }} />
                            <div className="w-1 bg-cyan-400 rounded-full animate-pulse" style={{ height: '50%', animationDelay: '400ms' }} />
                          </div>
                        )}
                      </div>

                      {/* Name Tag with Role */}
                      <div className={`absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-center transition-all duration-300 ${isActive ? 'text-cyan-300 font-semibold' : isTyping ? 'text-cyan-400' : 'text-slate-400'}`}>
                        <div className={`text-xs ${isActive ? 'text-sm' : ''}`}>{agent.displayName}</div>
                        <div className="text-[10px] text-slate-500">{agent.title.split(' + ')[0]}</div>
                        {isTyping && <div className="text-[10px] text-cyan-500 animate-pulse">thinking...</div>}
                      </div>

                      {/* Speech Bubble (when active) - Enhanced design */}
                      {isActive && currentSpeech && (
                        <div
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-56 p-3 bg-slate-800/95 backdrop-blur-sm rounded-xl border-2 shadow-2xl animate-fade-in"
                          style={{
                            borderColor: currentEmotion?.color || agent.color,
                            boxShadow: `0 8px 32px ${currentEmotion?.color || agent.color}30`
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm">{currentEmotion?.emoji || '💬'}</span>
                            <span className="text-xs font-medium" style={{ color: currentEmotion?.color || agent.color }}>
                              {currentEmotion?.label || 'Speaking'}
                            </span>
                          </div>
                          <p className="text-white text-sm leading-relaxed line-clamp-3">
                            {currentSpeech.slice(0, 120)}{currentSpeech.length > 120 ? '...' : ''}
                          </p>
                          <div
                            className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent"
                            style={{ borderTopColor: currentEmotion?.color || agent.color }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  )
                })}
              </div>
            )}

            {/* Status Bar - Desktop only */}
            {!isMobile && (
              <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isDiscussing ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
                  <span className="text-sm text-slate-400">
                    {isDiscussing ? 'Agents discussing...' : 'Ready for questions'}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {agents.length} Nexus agents active
                </div>
              </div>
                {isDiscussing && (
                  <button
                    onClick={handleStopDiscussion}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30"
                  >
                    Stop Discussion
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Chat/Transcript - Right Side (or full on mobile chat tab) */}
          <div className={`${
            isMobile
              ? mobileView === 'chat' ? 'flex-1' : 'hidden'
              : 'w-1/2 border-l border-slate-700/50'
          } flex flex-col`}>
            {/* Transcript Header - Hide on mobile (tabs handle this) */}
            {!isMobile && (
              <div className="p-4 border-b border-slate-700/50 bg-slate-800/50">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span>📝</span> Discussion Transcript
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  {messages.length} messages • Real Nexus methodology
                </p>
              </div>
            )}

            {/* Messages Area with pull-to-refresh on mobile */}
            <div
              ref={pullToRefreshRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 relative"
              role="log"
              aria-live="polite"
              aria-label="Discussion transcript"
            >
              {/* Pull to refresh indicator */}
              {isPulling && isMobile && (
                <div className="absolute top-4 left-0 right-0 flex justify-center z-10">
                  <div className="px-3 py-2 bg-cyan-500/20 rounded-full border border-cyan-500/40 text-cyan-400 text-xs flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    Pull to refresh
                  </div>
                </div>
              )}
              {messages.map((message) => {
                const agent = NEXUS_AGENTS[message.agentId]
                const isUser = message.agentId === 'user'
                const isSystem = message.agentId === 'system'

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {isUser ? (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold">
                          U
                        </div>
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-lg border-2"
                          style={{
                            backgroundColor: agent ? `${agent.color}20` : '#475569',
                            borderColor: agent?.color || '#64748b'
                          }}
                        >
                          {message.agentIcon || agent?.icon || '🤖'}
                        </div>
                      )}
                    </div>

                    {/* Message Content */}
                    <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
                      <div className={`flex items-center gap-2 mb-1 ${isUser ? 'justify-end' : ''}`}>
                        <span className={`font-medium ${isUser ? 'text-cyan-400' : isSystem ? 'text-yellow-400' : 'text-white'}`}>
                          {message.agentName}
                        </span>
                        <span className="text-xs text-slate-500">
                          {message.role}
                        </span>
                        <span className="text-xs text-slate-600">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div
                        className={`${isMobile ? 'p-4' : 'p-3'} rounded-lg transition-all ${
                          isUser
                            ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-100'
                            : isSystem
                            ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-100'
                            : 'bg-slate-800 border border-slate-700 text-slate-200'
                        } ${isMobile && !isUser && !isSystem ? 'active:bg-slate-700/80' : ''}`}
                        style={!isUser && !isSystem && agent ? { borderLeftColor: agent.color, borderLeftWidth: '3px' } : {}}
                        onClick={() => {
                          if (isMobile && !isUser && !isSystem) {
                            triggerHaptic('light')
                            setReplyToMessage(message)
                          }
                        }}
                      >
                        {/* Reply indicator */}
                        {replyToMessage?.id === message.id && isMobile && (
                          <div className="mb-2 text-xs text-cyan-400 flex items-center gap-1">
                            <span>↩</span> Tap message to reply
                          </div>
                        )}
                        <p className={`${isMobile ? 'text-base' : 'text-sm'} leading-relaxed whitespace-pre-wrap`}>
                          {message.text}
                        </p>
                        {/* Show referenced agents */}
                        {message.referencedAgents && message.referencedAgents.length > 0 && (
                          <div className="mt-2 flex gap-1">
                            {message.referencedAgents.map(refId => {
                              const refAgent = NEXUS_AGENTS[refId]
                              return refAgent ? (
                                <span key={refId} className="text-xs px-1.5 py-0.5 bg-slate-700 rounded text-slate-400">
                                  @ {refAgent.displayName}
                                </span>
                              ) : null
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Enhanced typing indicator for mobile */}
              {typingAgent && NEXUS_AGENTS[typingAgent] && (
                <div className="flex gap-3 animate-fade-in">
                  <div className="flex-shrink-0">
                    <div
                      className={`${isMobile ? 'w-12 h-12' : 'w-10 h-10'} rounded-full flex items-center justify-center ${isMobile ? 'text-2xl' : 'text-lg'} border-2`}
                      style={{
                        backgroundColor: `${NEXUS_AGENTS[typingAgent].color}20`,
                        borderColor: NEXUS_AGENTS[typingAgent].color
                      }}
                    >
                      {NEXUS_AGENTS[typingAgent].icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-medium text-cyan-400 ${isMobile ? 'text-sm' : 'text-xs'}`}>
                        {NEXUS_AGENTS[typingAgent].displayName}
                      </span>
                      <span className={`text-slate-500 ${isMobile ? 'text-xs' : 'text-[10px]'}`}>
                        is thinking...
                      </span>
                    </div>
                    <div className={`${isMobile ? 'p-4' : 'p-3'} bg-slate-800 border border-slate-700 rounded-lg w-fit`}>
                      <div className="flex gap-1.5">
                        <div className={`${isMobile ? 'w-2.5 h-2.5' : 'w-2 h-2'} bg-cyan-400 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }} />
                        <div className={`${isMobile ? 'w-2.5 h-2.5' : 'w-2 h-2'} bg-cyan-400 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }} />
                        <div className={`${isMobile ? 'w-2.5 h-2.5' : 'w-2 h-2'} bg-cyan-400 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area with @ Mentions - Sticky on mobile with keyboard avoidance */}
            <div
              className={`${isMobile ? 'sticky bottom-0' : ''} p-4 border-t border-slate-700/50 bg-slate-800/95 backdrop-blur-sm`}
              style={isMobile ? {
                paddingBottom: keyboard.isVisible
                  ? '8px'
                  : `calc(env(safe-area-inset-bottom, 0px) + 16px)`,
                transform: keyboard.isVisible ? `translateY(-${Math.max(0, keyboard.height - 100)}px)` : 'none',
                transition: 'transform 0.2s ease-out'
              } : undefined}
            >
              {/* Agent Picker Dropdown */}
              {showAgentPicker && (
                <div className="mb-3 p-2 bg-slate-700/80 rounded-lg border border-slate-600 max-h-48 overflow-y-auto">
                  <div className="text-xs text-slate-400 mb-2 px-2">Select an agent to mention:</div>
                  <div className="grid grid-cols-4 gap-1">
                    {agents.map(agent => (
                      <button
                        key={agent.id}
                        onClick={() => {
                          const atMention = `@${agent.displayName} `
                          setUserInput(prev => prev.replace(/@$/, atMention))
                          setShowAgentPicker(false)
                          setMentionedAgent(agent.id)
                          inputRef.current?.focus()
                        }}
                        className="flex items-center gap-2 p-2 rounded hover:bg-slate-600 transition-colors text-left"
                      >
                        <span className="text-lg">{agent.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-white font-medium truncate">{agent.displayName}</div>
                          <div className="text-[10px] text-slate-400 truncate">{agent.title.split(' + ')[0]}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reply context banner */}
              {replyToMessage && isMobile && (
                <div className="mb-2 p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-cyan-400 text-xs">↩</span>
                    <span className="text-xs text-slate-400 truncate">
                      Replying to {replyToMessage.agentName}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setReplyToMessage(null)
                      triggerHaptic('light')
                    }}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={(e) => {
                      setUserInput(e.target.value)
                      // Show agent picker when @ is typed
                      if (e.target.value.endsWith('@')) {
                        setShowAgentPicker(true)
                      } else if (showAgentPicker && !e.target.value.includes('@')) {
                        setShowAgentPicker(false)
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !showAgentPicker) {
                        handleSendMessage()
                      }
                      if (e.key === 'Escape' && showAgentPicker) {
                        setShowAgentPicker(false)
                      }
                      // Keyboard shortcuts
                      if (e.key === 'Tab' && e.ctrlKey) {
                        e.preventDefault()
                        setShowAgentPicker(!showAgentPicker)
                      }
                    }}
                    placeholder={isDiscussing ? "Agents are discussing..." : (replyToMessage ? "Type your reply..." : "Ask the team... (type @ to mention an agent)")}
                    disabled={isDiscussing}
                    className={`w-full px-4 ${isMobile ? 'py-4 text-base' : 'py-3 text-sm'} bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 disabled:opacity-50`}
                  />
                  {/* @ mention button */}
                  <button
                    onClick={() => setShowAgentPicker(!showAgentPicker)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                    title="Mention an agent (Ctrl+Tab)"
                  >
                    @
                  </button>
                </div>
                <button
                  onClick={() => {
                    triggerHaptic('medium')
                    handleSendMessage()
                    if (replyToMessage) setReplyToMessage(null)
                  }}
                  disabled={isDiscussing || !userInput.trim()}
                  className={`${isMobile ? 'px-8 py-4 text-base' : 'px-6 py-3'} bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 min-w-[80px]`}
                >
                  {isMobile ? '→' : 'Send'}
                </button>
              </div>

              {/* Quick action chips - Snap scroll on mobile */}
              <div className={`flex gap-2 mt-3 ${isMobile ? 'overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide' : 'flex-wrap'}`}
                style={isMobile ? { scrollSnapType: 'x mandatory' } : undefined}
              >
                <button
                  onClick={() => {
                    triggerHaptic('light')
                    setUserInput('How can we improve this workflow\'s performance?')
                  }}
                  className={`${isMobile ? 'px-4 py-2 text-sm snap-start' : 'px-3 py-1.5 text-xs'} bg-slate-700/50 text-slate-300 rounded-full hover:bg-slate-700 active:bg-slate-600 transition-all whitespace-nowrap min-h-[40px] touch-manipulation flex items-center gap-2`}
                >
                  <span>⚡</span> Performance
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('light')
                    setUserInput('What are the potential failure points and risks?')
                  }}
                  className={`${isMobile ? 'px-4 py-2 text-sm snap-start' : 'px-3 py-1.5 text-xs'} bg-slate-700/50 text-slate-300 rounded-full hover:bg-slate-700 active:bg-slate-600 transition-all whitespace-nowrap min-h-[40px] touch-manipulation flex items-center gap-2`}
                >
                  <span>⚠️</span> Risk Analysis
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('light')
                    setUserInput('How can we improve the user experience?')
                  }}
                  className={`${isMobile ? 'px-4 py-2 text-sm snap-start' : 'px-3 py-1.5 text-xs'} bg-slate-700/50 text-slate-300 rounded-full hover:bg-slate-700 active:bg-slate-600 transition-all whitespace-nowrap min-h-[40px] touch-manipulation flex items-center gap-2`}
                >
                  <span>✨</span> UX
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('light')
                    setUserInput('What tests should we add for better coverage?')
                  }}
                  className={`${isMobile ? 'px-4 py-2 text-sm snap-start' : 'px-3 py-1.5 text-xs'} bg-slate-700/50 text-slate-300 rounded-full hover:bg-slate-700 active:bg-slate-600 transition-all whitespace-nowrap min-h-[40px] touch-manipulation flex items-center gap-2`}
                >
                  <span>🧪</span> Testing
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('light')
                    setUserInput('How can we reduce costs while maintaining quality?')
                  }}
                  className={`${isMobile ? 'px-4 py-2 text-sm snap-start' : 'px-3 py-1.5 text-xs'} bg-slate-700/50 text-slate-300 rounded-full hover:bg-slate-700 active:bg-slate-600 transition-all whitespace-nowrap min-h-[40px] touch-manipulation flex items-center gap-2`}
                >
                  <span>💰</span> Cost
                </button>
              </div>

              {/* Keyboard shortcuts hint - Desktop only */}
              {!isMobile && (
                <div className="mt-2 flex gap-4 text-[10px] text-slate-500">
                  <span><kbd className="px-1 bg-slate-700 rounded">Enter</kbd> Send</span>
                  <span><kbd className="px-1 bg-slate-700 rounded">@</kbd> Mention agent</span>
                  <span><kbd className="px-1 bg-slate-700 rounded">Ctrl+Tab</kbd> Agent picker</span>
                  <span><kbd className="px-1 bg-slate-700 rounded">Esc</kbd> Close</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Mini Meeting Room button for dashboard/workflow pages
export function MeetingRoomButton({
  onClick,
  variant = 'default'
}: {
  onClick: () => void
  variant?: 'default' | 'compact' | 'floating'
}) {
  if (variant === 'floating') {
    return (
      <button
        onClick={onClick}
        className="fixed bottom-28 right-4 md:bottom-24 md:right-6 z-40 group flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-full shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all hover:scale-105"
      >
        <span className="text-lg md:text-xl">🤖</span>
        <span className="font-medium text-sm md:text-base hidden sm:inline">AI Team Chat</span>
        <span className="font-medium text-sm sm:hidden">AI Team</span>
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      </button>
    )
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-white rounded-lg border border-purple-500/30 hover:border-purple-500/50 transition-colors"
      >
        <span>🤖</span>
        <span className="text-sm">AI Team</span>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] group"
    >
      <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
        <span className="text-2xl">🤖</span>
      </div>
      <div className="text-left">
        <div className="font-semibold">AI Team Chat</div>
        <div className="text-sm text-white/70">Multi-agent workflow assistance</div>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-sm text-white/70">Live</span>
      </div>
    </button>
  )
}

export default AIMeetingRoom
