/**
 * Hands-Free Mode Context
 *
 * Provides a hands-free operation mode for the application:
 * - Auto-listen after actions complete
 * - Announce all state changes via TTS
 * - Voice command integration
 * - Continuous listening mode
 * - Configurable verbosity levels
 *
 * This context integrates speech recognition, text-to-speech,
 * and voice commands into a unified hands-free experience.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode
} from 'react'
import { useNavigate } from 'react-router-dom'
import { useSpeechRecognition, type SpeechLanguage } from '@/hooks/useSpeechRecognition'
import { useTextToSpeech, type TTSLanguage } from '@/hooks/useTextToSpeech'
import {
  VoiceCommandParser,
  type VoiceCommandType,
  type VoiceCommandMatch,
  getCommandHelpText
} from '@/lib/voice-commands'

// Verbosity levels for announcements
export type VerbosityLevel = 'minimal' | 'normal' | 'verbose'

// Configuration for hands-free mode
export interface HandsFreeConfig {
  enabled: boolean
  autoListen: boolean
  announceChanges: boolean
  verbosity: VerbosityLevel
  language: 'en' | 'ar'
  confirmActions: boolean
  pauseBetweenCommands: number // ms
}

// State for hands-free mode
export interface HandsFreeState {
  isEnabled: boolean
  isListening: boolean
  isSpeaking: boolean
  currentTranscript: string
  lastCommand: VoiceCommandMatch | null
  lastAnnouncement: string
  error: string | null
  config: HandsFreeConfig
}

// Actions for hands-free mode
export interface HandsFreeActions {
  enable: () => void
  disable: () => void
  toggle: () => void
  startListening: () => Promise<void>
  stopListening: () => void
  speak: (text: string, priority?: 'low' | 'normal' | 'high') => Promise<void>
  announce: (message: string, verbosityRequired?: VerbosityLevel) => Promise<void>
  executeCommand: (transcript: string) => Promise<VoiceCommandMatch>
  setConfig: (config: Partial<HandsFreeConfig>) => void
  setLanguage: (language: 'en' | 'ar') => void
  clearTranscript: () => void
  clearError: () => void
  registerCommandHandler: (
    type: VoiceCommandType,
    handler: (params: Record<string, string>) => void | Promise<void>
  ) => () => void
}

// Combined context type
interface HandsFreeContextValue extends HandsFreeState, HandsFreeActions {}

// Default configuration
const DEFAULT_CONFIG: HandsFreeConfig = {
  enabled: false,
  autoListen: true,
  announceChanges: true,
  verbosity: 'normal',
  language: 'en',
  confirmActions: false,
  pauseBetweenCommands: 500
}

// Create context
const HandsFreeContext = createContext<HandsFreeContextValue | null>(null)

// Provider props
interface HandsFreeProviderProps {
  children: ReactNode
  initialConfig?: Partial<HandsFreeConfig>
  onCommandExecuted?: (command: VoiceCommandMatch) => void
  onError?: (error: string) => void
}

/**
 * Hands-Free Mode Provider
 */
export function HandsFreeProvider({
  children,
  initialConfig = {},
  onCommandExecuted,
  onError
}: HandsFreeProviderProps) {
  const navigate = useNavigate()

  // Initialize config
  const [config, setConfigState] = useState<HandsFreeConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig
  })

  // State
  const [isEnabled, setIsEnabled] = useState(config.enabled)
  const [lastCommand, setLastCommand] = useState<VoiceCommandMatch | null>(null)
  const [lastAnnouncement, setLastAnnouncement] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Voice command parser
  const commandParserRef = useRef(new VoiceCommandParser(config.language))

  // Get speech language from config
  const speechLanguage: SpeechLanguage = config.language === 'ar' ? 'ar-SA' : 'en-US'
  const ttsLanguage: TTSLanguage = speechLanguage

  // Speech recognition hook
  const {
    isListening,
    transcript: currentTranscript,
    error: speechError,
    startListening: startSpeechRecognition,
    stopListening: stopSpeechRecognition,
    resetTranscript,
    setLanguage: setSpeechLanguage
  } = useSpeechRecognition({
    language: speechLanguage,
    continuous: true,
    interimResults: true
  })

  // Text-to-speech hook
  const {
    isSpeaking,
    speak: ttsSpeak,
    cancel: ttsCancel,
    setLanguage: setTTSLanguage,
    announceStatus: _announceStatus
  } = useTextToSpeech({
    language: ttsLanguage
  })

  // Handle speech errors
  useEffect(() => {
    if (speechError) {
      const errorMessage = speechError.message
      setError(errorMessage)
      onError?.(errorMessage)

      // Announce error if verbose
      if (config.verbosity === 'verbose' && config.announceChanges) {
        ttsSpeak(errorMessage)
      }
    }
  }, [speechError, config.verbosity, config.announceChanges, ttsSpeak, onError])

  // Register default command handlers
  useEffect(() => {
    const parser = commandParserRef.current

    // Navigation handler
    parser.registerHandler('navigate', (params) => {
      const destination = params.destination
      const routes: Record<string, string> = {
        dashboard: '/dashboard',
        workflows: '/workflows',
        templates: '/templates',
        integrations: '/integrations',
        settings: '/settings',
        profile: '/profile',
        projects: '/projects'
      }
      const route = routes[destination]
      if (route) {
        navigate(route)
        if (config.announceChanges) {
          ttsSpeak(`Navigating to ${destination}`)
        }
      }
    })

    // Help handler
    parser.registerHandler('help', () => {
      const helpText = getCommandHelpText(config.language)
      ttsSpeak(helpText)
    })

    // Mute handler
    parser.registerHandler('mute', () => {
      ttsCancel()
      if (config.verbosity !== 'minimal') {
        // Brief confirmation before muting
        ttsSpeak('Voice feedback muted')
      }
    })

    // Unmute handler
    parser.registerHandler('unmute', () => {
      ttsSpeak('Voice feedback enabled')
    })

    // Stop handler
    parser.registerHandler('stop', () => {
      stopSpeechRecognition()
      ttsCancel()
    })

    // Clear handler
    parser.registerHandler('clear', () => {
      resetTranscript()
      if (config.announceChanges) {
        ttsSpeak('Transcript cleared')
      }
    })

    // Save handler (dispatch event for components to handle)
    parser.registerHandler('save', () => {
      window.dispatchEvent(new CustomEvent('nexus:save'))
      if (config.announceChanges) {
        ttsSpeak('Saving')
      }
    })

    // Undo handler
    parser.registerHandler('undo', () => {
      window.dispatchEvent(new CustomEvent('nexus:undo'))
      if (config.announceChanges && config.verbosity === 'verbose') {
        ttsSpeak('Undo')
      }
    })

    // Redo handler
    parser.registerHandler('redo', () => {
      window.dispatchEvent(new CustomEvent('nexus:redo'))
      if (config.announceChanges && config.verbosity === 'verbose') {
        ttsSpeak('Redo')
      }
    })

    // Status handler (dispatch event for workflow context to handle)
    parser.registerHandler('status', () => {
      window.dispatchEvent(new CustomEvent('nexus:statusRequest'))
    })
  }, [config.language, config.announceChanges, config.verbosity, navigate, ttsSpeak, ttsCancel, stopSpeechRecognition, resetTranscript])

  // Process transcript when it changes
  useEffect(() => {
    if (!isEnabled || !currentTranscript || isSpeaking) return

    // Wait for pause in speech before processing
    const timeoutId = setTimeout(async () => {
      // Only process final transcripts (those that end with common end patterns)
      const trimmed = currentTranscript.trim()
      if (trimmed.length < 2) return

      try {
        const command = await commandParserRef.current.execute(trimmed)
        setLastCommand(command)
        onCommandExecuted?.(command)

        // Reset transcript after command
        resetTranscript()

        // Auto-restart listening after command if enabled
        if (config.autoListen && !isListening) {
          setTimeout(() => {
            startSpeechRecognition()
          }, config.pauseBetweenCommands)
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Command execution failed'
        setError(errorMsg)
        onError?.(errorMsg)
      }
    }, 1500) // Wait for pause in speech

    return () => clearTimeout(timeoutId)
  }, [
    isEnabled,
    currentTranscript,
    isSpeaking,
    isListening,
    config.autoListen,
    config.pauseBetweenCommands,
    resetTranscript,
    startSpeechRecognition,
    onCommandExecuted,
    onError
  ])

  // Enable hands-free mode
  const enable = useCallback(() => {
    setIsEnabled(true)
    setConfigState(prev => ({ ...prev, enabled: true }))

    if (config.announceChanges) {
      ttsSpeak(config.language === 'ar'
        ? 'وضع التحكم الصوتي مفعل'
        : 'Hands-free mode enabled')
    }

    // Auto-start listening
    if (config.autoListen) {
      setTimeout(() => {
        startSpeechRecognition()
      }, 1000)
    }
  }, [config.announceChanges, config.autoListen, config.language, ttsSpeak, startSpeechRecognition])

  // Disable hands-free mode
  const disable = useCallback(() => {
    stopSpeechRecognition()
    ttsCancel()
    setIsEnabled(false)
    setConfigState(prev => ({ ...prev, enabled: false }))
  }, [stopSpeechRecognition, ttsCancel])

  // Toggle hands-free mode
  const toggle = useCallback(() => {
    if (isEnabled) {
      disable()
    } else {
      enable()
    }
  }, [isEnabled, enable, disable])

  // Start listening wrapper
  const startListening = useCallback(async () => {
    if (!isEnabled) {
      enable()
    }
    await startSpeechRecognition()
  }, [isEnabled, enable, startSpeechRecognition])

  // Stop listening wrapper
  const stopListening = useCallback(() => {
    stopSpeechRecognition()
  }, [stopSpeechRecognition])

  // Speak with priority
  const speak = useCallback(async (text: string, priority: 'low' | 'normal' | 'high' = 'normal') => {
    if (!config.announceChanges && priority !== 'high') return

    if (priority === 'high') {
      ttsCancel()
    }

    await ttsSpeak(text)
    setLastAnnouncement(text)
  }, [config.announceChanges, ttsCancel, ttsSpeak])

  // Announce with verbosity check
  const announce = useCallback(async (message: string, verbosityRequired: VerbosityLevel = 'normal') => {
    if (!config.announceChanges) return

    const verbosityLevels: VerbosityLevel[] = ['minimal', 'normal', 'verbose']
    const currentLevel = verbosityLevels.indexOf(config.verbosity)
    const requiredLevel = verbosityLevels.indexOf(verbosityRequired)

    if (currentLevel >= requiredLevel) {
      await ttsSpeak(message)
      setLastAnnouncement(message)
    }
  }, [config.announceChanges, config.verbosity, ttsSpeak])

  // Execute command manually
  const executeCommand = useCallback(async (transcript: string): Promise<VoiceCommandMatch> => {
    const command = await commandParserRef.current.execute(transcript)
    setLastCommand(command)
    onCommandExecuted?.(command)
    return command
  }, [onCommandExecuted])

  // Set config
  const setConfig = useCallback((newConfig: Partial<HandsFreeConfig>) => {
    setConfigState(prev => ({ ...prev, ...newConfig }))

    // Update enabled state if changed
    if (newConfig.enabled !== undefined) {
      setIsEnabled(newConfig.enabled)
    }
  }, [])

  // Set language
  const setLanguage = useCallback((language: 'en' | 'ar') => {
    const speechLang: SpeechLanguage = language === 'ar' ? 'ar-SA' : 'en-US'
    const ttsLang: TTSLanguage = speechLang

    setSpeechLanguage(speechLang)
    setTTSLanguage(ttsLang)
    commandParserRef.current.setLanguage(language)

    setConfigState(prev => ({ ...prev, language }))
  }, [setSpeechLanguage, setTTSLanguage])

  // Clear transcript
  const clearTranscript = useCallback(() => {
    resetTranscript()
  }, [resetTranscript])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Register command handler
  const registerCommandHandler = useCallback((
    type: VoiceCommandType,
    handler: (params: Record<string, string>) => void | Promise<void>
  ) => {
    return commandParserRef.current.registerHandler(type, handler)
  }, [])

  // Context value
  const value: HandsFreeContextValue = {
    // State
    isEnabled,
    isListening,
    isSpeaking,
    currentTranscript,
    lastCommand,
    lastAnnouncement,
    error,
    config,
    // Actions
    enable,
    disable,
    toggle,
    startListening,
    stopListening,
    speak,
    announce,
    executeCommand,
    setConfig,
    setLanguage,
    clearTranscript,
    clearError,
    registerCommandHandler
  }

  return (
    <HandsFreeContext.Provider value={value}>
      {children}
    </HandsFreeContext.Provider>
  )
}

/**
 * Hook to use hands-free context
 */
export function useHandsFree(): HandsFreeContextValue {
  const context = useContext(HandsFreeContext)

  if (!context) {
    throw new Error('useHandsFree must be used within a HandsFreeProvider')
  }

  return context
}

/**
 * Hook for hands-free state only
 */
export function useHandsFreeState(): HandsFreeState {
  const context = useHandsFree()

  return {
    isEnabled: context.isEnabled,
    isListening: context.isListening,
    isSpeaking: context.isSpeaking,
    currentTranscript: context.currentTranscript,
    lastCommand: context.lastCommand,
    lastAnnouncement: context.lastAnnouncement,
    error: context.error,
    config: context.config
  }
}

/**
 * Hook for quick voice status
 */
export function useVoiceStatus(): {
  isListening: boolean
  isSpeaking: boolean
  isEnabled: boolean
} {
  const context = useHandsFree()

  return {
    isListening: context.isListening,
    isSpeaking: context.isSpeaking,
    isEnabled: context.isEnabled
  }
}

// Export types
export type { HandsFreeContextValue }
