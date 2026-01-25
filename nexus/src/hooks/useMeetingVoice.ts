/**
 * useMeetingVoice Hook
 *
 * React hook for integrating voice synthesis with Meeting Room components.
 * Provides easy-to-use interface for controlling AI employee voices.
 *
 * Features:
 * - Per-employee voice controls (mute, volume)
 * - Meeting context management
 * - Speaking state tracking
 * - Automatic cleanup on unmount
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  voiceSynthesisService,
  type SynthesisOptions
} from '../lib/voice/voice-synthesis'
import { type MeetingContext } from '../lib/voice/employee-voices'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface EmployeeVoiceState {
  employeeId: string
  volume: number
  isMuted: boolean
  isSpeaking: boolean
}

export interface MeetingVoiceControls {
  /** Start a meeting session */
  startMeeting: (meetingId: string, context?: MeetingContext) => void
  /** End the current meeting */
  endMeeting: () => void
  /** Have an employee speak */
  speak: (employeeId: string, text: string, options?: Partial<SynthesisOptions>) => Promise<void>
  /** Have an employee speak with characteristic intro */
  speakWithIntro: (employeeId: string, text: string, options?: Partial<SynthesisOptions>) => Promise<void>
  /** Set volume for an employee (0-100) */
  setVolume: (employeeId: string, volume: number) => void
  /** Mute/unmute an employee */
  toggleMute: (employeeId: string) => void
  /** Mute all employees */
  muteAll: () => void
  /** Unmute all employees */
  unmuteAll: () => void
  /** Change meeting context */
  setContext: (context: MeetingContext) => void
  /** Stop current speech */
  stopSpeaking: () => void
  /** Cancel all pending speech */
  cancelAll: () => void
}

export interface MeetingVoiceState {
  /** Whether a meeting is active */
  isActive: boolean
  /** Current meeting context */
  context: MeetingContext
  /** Currently speaking employee ID */
  currentSpeaker: string | null
  /** Set of speaking employee IDs */
  speakingEmployees: Set<string>
  /** Voice states per employee */
  employeeStates: Map<string, EmployeeVoiceState>
  /** Whether high-quality TTS is available */
  hasHighQualityTTS: boolean
  /** Active TTS provider name */
  activeProvider: string
}

export interface UseMeetingVoiceReturn {
  controls: MeetingVoiceControls
  state: MeetingVoiceState
  /** Get voice state for a specific employee */
  getEmployeeState: (employeeId: string) => EmployeeVoiceState
  /** Check if an employee is currently speaking */
  isSpeaking: (employeeId: string) => boolean
  /** Check if an employee is muted */
  isMuted: (employeeId: string) => boolean
  /** Get volume for an employee */
  getVolume: (employeeId: string) => number
  /** List of currently speaking employee IDs */
  speakingIds: string[]
}

// =============================================================================
// DEFAULT EMPLOYEES
// =============================================================================

const DEFAULT_EMPLOYEE_IDS = [
  'zara', 'ava', 'winston', 'larry', 'mary',
  'alex', 'sam', 'emma', 'david', 'olivia', 'nexus'
]

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * React hook for Meeting Room voice integration
 *
 * @param employeeIds - List of employee IDs to track (defaults to all employees)
 * @param defaultContext - Initial meeting context
 */
export function useMeetingVoice(
  employeeIds: string[] = DEFAULT_EMPLOYEE_IDS,
  defaultContext: MeetingContext = 'team_standup'
): UseMeetingVoiceReturn {
  // State
  const [isActive, setIsActive] = useState(false)
  const [context, setContextState] = useState<MeetingContext>(defaultContext)
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null)
  const [speakingEmployees, setSpeakingEmployees] = useState<Set<string>>(new Set())
  const [employeeStates, setEmployeeStates] = useState<Map<string, EmployeeVoiceState>>(
    () => initializeEmployeeStates(employeeIds)
  )

  // Refs for tracking
  const meetingIdRef = useRef<string | null>(null)

  // Initialize employee states
  function initializeEmployeeStates(ids: string[]): Map<string, EmployeeVoiceState> {
    const states = new Map<string, EmployeeVoiceState>()
    ids.forEach(id => {
      states.set(id, {
        employeeId: id,
        volume: 75,
        isMuted: false,
        isSpeaking: false
      })
    })
    return states
  }

  // Update employee state helper
  const updateEmployeeState = useCallback((
    employeeId: string,
    updates: Partial<EmployeeVoiceState>
  ) => {
    setEmployeeStates(prev => {
      const newStates = new Map(prev)
      const current = newStates.get(employeeId) || {
        employeeId,
        volume: 75,
        isMuted: false,
        isSpeaking: false
      }
      newStates.set(employeeId, { ...current, ...updates })
      return newStates
    })
  }, [])

  // ===========================================================================
  // CONTROLS
  // ===========================================================================

  const startMeeting = useCallback((meetingId: string, meetingContext?: MeetingContext) => {
    meetingIdRef.current = meetingId
    voiceSynthesisService.startMeeting(meetingId, meetingContext || defaultContext)
    setIsActive(true)
    if (meetingContext) {
      setContextState(meetingContext)
    }
  }, [defaultContext])

  const endMeeting = useCallback(() => {
    voiceSynthesisService.endMeeting()
    meetingIdRef.current = null
    setIsActive(false)
    setCurrentSpeaker(null)
    setSpeakingEmployees(new Set())
  }, [])

  const speak = useCallback(async (
    employeeId: string,
    text: string,
    options?: Partial<SynthesisOptions>
  ): Promise<void> => {
    if (!isActive) {
      console.warn('[useMeetingVoice] Cannot speak - no active meeting')
      return
    }

    const fullOptions: SynthesisOptions = {
      employeeId,
      context,
      ...options,
      onStart: () => {
        setCurrentSpeaker(employeeId)
        setSpeakingEmployees(prev => new Set([...prev, employeeId]))
        updateEmployeeState(employeeId, { isSpeaking: true })
        options?.onStart?.()
      },
      onEnd: () => {
        setCurrentSpeaker(prev => prev === employeeId ? null : prev)
        setSpeakingEmployees(prev => {
          const next = new Set(prev)
          next.delete(employeeId)
          return next
        })
        updateEmployeeState(employeeId, { isSpeaking: false })
        options?.onEnd?.()
      },
      onError: (error) => {
        setCurrentSpeaker(prev => prev === employeeId ? null : prev)
        setSpeakingEmployees(prev => {
          const next = new Set(prev)
          next.delete(employeeId)
          return next
        })
        updateEmployeeState(employeeId, { isSpeaking: false })
        options?.onError?.(error)
      }
    }

    await voiceSynthesisService.speak(text, fullOptions)
  }, [isActive, context, updateEmployeeState])

  const speakWithIntro = useCallback(async (
    employeeId: string,
    text: string,
    options?: Partial<SynthesisOptions>
  ): Promise<void> => {
    if (!isActive) {
      console.warn('[useMeetingVoice] Cannot speak - no active meeting')
      return
    }

    const fullOptions: SynthesisOptions = {
      employeeId,
      context,
      addCharacteristicIntro: true,
      ...options,
      onStart: () => {
        setCurrentSpeaker(employeeId)
        setSpeakingEmployees(prev => new Set([...prev, employeeId]))
        updateEmployeeState(employeeId, { isSpeaking: true })
        options?.onStart?.()
      },
      onEnd: () => {
        setCurrentSpeaker(prev => prev === employeeId ? null : prev)
        setSpeakingEmployees(prev => {
          const next = new Set(prev)
          next.delete(employeeId)
          return next
        })
        updateEmployeeState(employeeId, { isSpeaking: false })
        options?.onEnd?.()
      },
      onError: (error) => {
        setCurrentSpeaker(prev => prev === employeeId ? null : prev)
        updateEmployeeState(employeeId, { isSpeaking: false })
        options?.onError?.(error)
      }
    }

    await voiceSynthesisService.speakWithIntro(text, fullOptions)
  }, [isActive, context, updateEmployeeState])

  const setVolume = useCallback((employeeId: string, volume: number) => {
    voiceSynthesisService.setEmployeeVolume(employeeId, volume)
    updateEmployeeState(employeeId, { volume })
  }, [updateEmployeeState])

  const toggleMute = useCallback((employeeId: string) => {
    const state = employeeStates.get(employeeId)
    const newMuted = !state?.isMuted

    if (newMuted) {
      voiceSynthesisService.muteEmployee(employeeId)
    } else {
      voiceSynthesisService.unmuteEmployee(employeeId)
    }

    updateEmployeeState(employeeId, { isMuted: newMuted })
  }, [employeeStates, updateEmployeeState])

  const muteAll = useCallback(() => {
    voiceSynthesisService.muteAll()
    employeeIds.forEach(id => {
      updateEmployeeState(id, { isMuted: true })
    })
  }, [employeeIds, updateEmployeeState])

  const unmuteAll = useCallback(() => {
    voiceSynthesisService.unmuteAll()
    employeeIds.forEach(id => {
      updateEmployeeState(id, { isMuted: false })
    })
  }, [employeeIds, updateEmployeeState])

  const setContext = useCallback((newContext: MeetingContext) => {
    voiceSynthesisService.setMeetingContext(newContext)
    setContextState(newContext)
  }, [])

  const stopSpeaking = useCallback(() => {
    voiceSynthesisService.stopCurrentSpeech()
    setCurrentSpeaker(null)
    setSpeakingEmployees(new Set())
    employeeIds.forEach(id => {
      updateEmployeeState(id, { isSpeaking: false })
    })
  }, [employeeIds, updateEmployeeState])

  const cancelAll = useCallback(() => {
    voiceSynthesisService.cancelAllPending()
  }, [])

  // ===========================================================================
  // GETTERS
  // ===========================================================================

  const getEmployeeState = useCallback((employeeId: string): EmployeeVoiceState => {
    return employeeStates.get(employeeId) || {
      employeeId,
      volume: 75,
      isMuted: false,
      isSpeaking: false
    }
  }, [employeeStates])

  const isSpeakingFn = useCallback((employeeId: string): boolean => {
    return speakingEmployees.has(employeeId)
  }, [speakingEmployees])

  const isMutedFn = useCallback((employeeId: string): boolean => {
    return employeeStates.get(employeeId)?.isMuted || false
  }, [employeeStates])

  const getVolumeFn = useCallback((employeeId: string): number => {
    return employeeStates.get(employeeId)?.volume || 75
  }, [employeeStates])

  // ===========================================================================
  // CLEANUP
  // ===========================================================================

  useEffect(() => {
    return () => {
      if (meetingIdRef.current) {
        voiceSynthesisService.endMeeting()
      }
    }
  }, [])

  // ===========================================================================
  // RETURN
  // ===========================================================================

  const controls: MeetingVoiceControls = {
    startMeeting,
    endMeeting,
    speak,
    speakWithIntro,
    setVolume,
    toggleMute,
    muteAll,
    unmuteAll,
    setContext,
    stopSpeaking,
    cancelAll
  }

  const state: MeetingVoiceState = {
    isActive,
    context,
    currentSpeaker,
    speakingEmployees,
    employeeStates,
    hasHighQualityTTS: voiceSynthesisService.hasHighQualityTTS(),
    activeProvider: voiceSynthesisService.getActiveProvider()
  }

  return {
    controls,
    state,
    getEmployeeState,
    isSpeaking: isSpeakingFn,
    isMuted: isMutedFn,
    getVolume: getVolumeFn,
    speakingIds: Array.from(speakingEmployees)
  }
}

export default useMeetingVoice
