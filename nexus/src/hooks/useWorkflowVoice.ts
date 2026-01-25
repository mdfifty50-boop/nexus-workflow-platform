/**
 * Workflow Voice Hook
 *
 * Connects voice input to workflow execution
 * Features:
 * - Continuous listening with Kuwaiti dialect detection
 * - Automatic workflow execution from voice commands
 * - Voice response in the same dialect
 * - Context auto-save from conversations
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useVoiceInput, type VoiceLanguage } from './useVoiceInput'
import {
  executeVoiceCommand,
  type WorkflowExecutionResult,
  type ParsedIntent,
} from '../lib/workflow-engine/workflow-executor'
import { extractUserContext } from '../lib/context/user-context-extractor'
import { storeUserContext } from '../lib/context/context-store'
import type { Dialect } from '../lib/voice/dialect-detector'

export interface WorkflowVoiceConfig {
  // Auto-execute workflows when speech is detected
  autoExecute?: boolean
  // Speak responses using TTS
  speakResponses?: boolean
  // Auto-save context from conversations
  autoSaveContext?: boolean
  // Minimum confidence to execute workflow
  minConfidence?: number
  // Continuous mode - mic stays open
  continuousMode?: boolean
  // Callbacks
  onIntentDetected?: (intent: ParsedIntent) => void
  onWorkflowComplete?: (result: WorkflowExecutionResult) => void
  onContextSaved?: (savedFields: string[]) => void
  onError?: (error: Error) => void
}

export interface WorkflowVoiceState {
  // Voice state
  isListening: boolean
  isProcessing: boolean
  isSpeaking: boolean
  transcript: string
  detectedDialect: Dialect | null
  // Workflow state
  currentIntent: ParsedIntent | null
  lastResult: WorkflowExecutionResult | null
  executionHistory: WorkflowExecutionResult[]
  // Error state
  error: string | null
}

export interface UseWorkflowVoiceReturn extends WorkflowVoiceState {
  // Controls
  startListening: () => Promise<void>
  stopListening: () => void
  toggleListening: () => Promise<void>
  // Manual execution
  executeCommand: (text: string) => Promise<WorkflowExecutionResult>
  // Response
  speakResponse: (text: string, dialect?: Dialect) => Promise<void>
  // Utility
  clearHistory: () => void
  clearError: () => void
}

/**
 * Hook for voice-controlled workflow execution
 */
export function useWorkflowVoice(config: WorkflowVoiceConfig = {}): UseWorkflowVoiceReturn {
  const {
    autoExecute = true,
    speakResponses = true,
    autoSaveContext = true,
    // minConfidence is available for future use when filtering low-confidence intents
    // minConfidence = 0.5,
    continuousMode = true,
    onIntentDetected,
    onWorkflowComplete,
    onContextSaved,
    onError,
  } = config

  // State
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentIntent, setCurrentIntent] = useState<ParsedIntent | null>(null)
  const [lastResult, setLastResult] = useState<WorkflowExecutionResult | null>(null)
  const [executionHistory, setExecutionHistory] = useState<WorkflowExecutionResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [detectedDialect, setDetectedDialect] = useState<Dialect | null>(null)

  // Refs
  const lastProcessedTranscript = useRef<string>('')
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Voice input hook with continuous mode
  const voiceInput = useVoiceInput({
    defaultLanguage: 'en-US',
    autoDetectLanguage: true,
    matchResponseLanguage: true,
    autoClose: !continuousMode,
    silenceTimeout: continuousMode ? 30000 : 5000,
    manualCloseEnabled: true,
    onTranscript: (_text, language) => {
      setDetectedDialect(language as Dialect)
    },
    onLanguageDetected: (language) => {
      setDetectedDialect(language as Dialect)
    },
  })

  /**
   * Execute a workflow command
   */
  const executeCommand = useCallback(async (text: string): Promise<WorkflowExecutionResult> => {
    setIsProcessing(true)
    setError(null)

    try {
      // Execute the workflow
      const result = await executeVoiceCommand(text, detectedDialect || undefined)

      // Update state
      setCurrentIntent(result.intent)
      setLastResult(result)
      setExecutionHistory(prev => [...prev, result])

      // Notify callbacks
      onIntentDetected?.(result.intent)
      onWorkflowComplete?.(result)

      // Auto-save context from conversation
      if (autoSaveContext) {
        const extraction = extractUserContext(text)
        const extracted = extraction.extractedContext
        const userId = extracted.userId || 'guest'
        const savedFields: string[] = []

        if ((extracted.addresses?.length ?? 0) > 0) {
          await storeUserContext({
            userId,
            context: { userId, addresses: extracted.addresses },
            merge: true,
            source: 'chat',
          })
          savedFields.push('address')
        }
        if ((extracted.foodPreferences?.length ?? 0) > 0) {
          await storeUserContext({
            userId,
            context: { userId, foodPreferences: extracted.foodPreferences },
            merge: true,
            source: 'chat',
          })
          savedFields.push('food preferences')
        }
        if ((extracted.frequentContacts?.length ?? 0) > 0) {
          await storeUserContext({
            userId,
            context: { userId, frequentContacts: extracted.frequentContacts },
            merge: true,
            source: 'chat',
          })
          savedFields.push('contacts')
        }

        if (savedFields.length > 0) {
          onContextSaved?.(savedFields)
        }
      }

      // Speak response if enabled
      if (speakResponses && result.response.text) {
        await speakResponse(result.response.text, result.response.dialect)
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
      throw err
    } finally {
      setIsProcessing(false)
    }
  }, [detectedDialect, autoSaveContext, speakResponses, onIntentDetected, onWorkflowComplete, onContextSaved, onError])

  /**
   * Speak a response in the appropriate dialect
   */
  const speakResponse = useCallback(async (text: string, dialect?: Dialect) => {
    // Map dialect to VoiceLanguage
    let language: VoiceLanguage = 'en-US'
    if (dialect?.startsWith('ar')) {
      language = dialect as VoiceLanguage
    }

    await voiceInput.speak(text, language)
  }, [voiceInput])

  /**
   * Process transcript for workflow execution
   */
  const processTranscript = useCallback(async (transcript: string) => {
    if (!transcript || transcript === lastProcessedTranscript.current) return
    if (!autoExecute) return

    // Debounce processing - wait for user to finish speaking
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current)
    }

    processingTimeoutRef.current = setTimeout(async () => {
      lastProcessedTranscript.current = transcript

      try {
        const result = await executeCommand(transcript)

        // If workflow needs more info, keep listening
        if (result.intent.requiresMoreInfo && continuousMode) {
          // Don't reset transcript, user might continue
        }
      } catch {
        // Error already handled in executeCommand
      }
    }, 1500) // Wait 1.5s after last speech before processing
  }, [autoExecute, executeCommand, continuousMode])

  // Watch transcript changes
  useEffect(() => {
    if (voiceInput.transcript && voiceInput.isListening) {
      processTranscript(voiceInput.transcript)
    }
  }, [voiceInput.transcript, voiceInput.isListening, processTranscript])

  // Cleanup
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current)
      }
    }
  }, [])

  /**
   * Start listening for voice commands
   */
  const startListening = useCallback(async () => {
    setError(null)
    lastProcessedTranscript.current = ''
    voiceInput.clearTranscript()
    await voiceInput.startListening()
  }, [voiceInput])

  /**
   * Stop listening
   */
  const stopListening = useCallback(() => {
    voiceInput.stopListening()
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current)
    }
  }, [voiceInput])

  /**
   * Toggle listening
   */
  const toggleListening = useCallback(async () => {
    if (voiceInput.isListening) {
      stopListening()
    } else {
      await startListening()
    }
  }, [voiceInput.isListening, startListening, stopListening])

  /**
   * Clear execution history
   */
  const clearHistory = useCallback(() => {
    setExecutionHistory([])
    setLastResult(null)
    setCurrentIntent(null)
  }, [])

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // Voice state
    isListening: voiceInput.isListening,
    isProcessing,
    isSpeaking: voiceInput.isSpeaking,
    transcript: voiceInput.transcript,
    detectedDialect,
    // Workflow state
    currentIntent,
    lastResult,
    executionHistory,
    // Error state
    error: error || voiceInput.error,
    // Controls
    startListening,
    stopListening,
    toggleListening,
    // Manual execution
    executeCommand,
    // Response
    speakResponse,
    // Utility
    clearHistory,
    clearError,
  }
}

export default useWorkflowVoice
