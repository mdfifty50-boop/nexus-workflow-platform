/**
 * Voice Synthesis Service for AI Meeting Room
 *
 * Provides actual speech synthesis for AI employees in the meeting room.
 * Integrates with human-tts.ts for multi-provider TTS and employee-voices.ts
 * for persona-specific voice configurations.
 *
 * Features:
 * - Context-aware voice synthesis (adjusts for meeting type)
 * - Per-employee voice characteristics
 * - Queue management for turn-taking in meetings
 * - Emotion modulation based on content
 * - Multi-language support with dialect detection
 */

import { HumanTTSService, humanTTSService, detectEmotion } from './human-tts'
import {
  type MeetingContext,
  type EmployeeVoiceConfig,
  getEmployeeVoiceConfig,
  getEmployeeSpeakingStyle,
  getEmployeeContextEmotion,
  SPEAKING_STYLE_CONFIGS
} from './employee-voices'
import { type VoiceEmotion, type SupportedLanguage } from '../../config/voice-profiles'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface SynthesisOptions {
  /** Employee ID speaking */
  employeeId: string
  /** Meeting context for style adjustment */
  context?: MeetingContext
  /** Override detected emotion */
  emotion?: VoiceEmotion
  /** Override language */
  language?: SupportedLanguage
  /** Priority in speech queue (higher = sooner) */
  priority?: number
  /** Callback when speech starts */
  onStart?: () => void
  /** Callback when speech ends */
  onEnd?: () => void
  /** Callback on error */
  onError?: (error: Error) => void
  /** Whether to add characteristic phrases */
  addCharacteristicIntro?: boolean
}

export interface MeetingSpeechItem {
  id: string
  employeeId: string
  text: string
  context: MeetingContext
  emotion: VoiceEmotion
  timestamp: number
  status: 'pending' | 'speaking' | 'completed' | 'cancelled'
}

export interface VoiceSynthesisState {
  isActive: boolean
  currentSpeaker: string | null
  meetingContext: MeetingContext
  speechQueue: MeetingSpeechItem[]
  volumeLevels: Map<string, number>
  mutedEmployees: Set<string>
}

// =============================================================================
// VOICE SYNTHESIS SERVICE
// =============================================================================

/**
 * Voice Synthesis Service
 *
 * Orchestrates speech synthesis for AI Meeting Room employees.
 * Handles voice characteristics, turn-taking, and context adaptation.
 */
export class VoiceSynthesisService {
  private static instance: VoiceSynthesisService

  private ttsService: HumanTTSService
  private state: VoiceSynthesisState

  private constructor() {
    this.ttsService = humanTTSService
    this.state = {
      isActive: false,
      currentSpeaker: null,
      meetingContext: 'team_standup',
      speechQueue: [],
      volumeLevels: new Map(),
      mutedEmployees: new Set()
    }
  }

  static getInstance(): VoiceSynthesisService {
    if (!VoiceSynthesisService.instance) {
      VoiceSynthesisService.instance = new VoiceSynthesisService()
    }
    return VoiceSynthesisService.instance
  }

  // ===========================================================================
  // MEETING MANAGEMENT
  // ===========================================================================

  /**
   * Start a meeting session
   */
  startMeeting(meetingId: string, context: MeetingContext = 'team_standup'): void {
    this.state.isActive = true
    this.state.meetingContext = context
    this.state.speechQueue = []
    this.state.currentSpeaker = null
    this.ttsService.setActiveWorkflow(meetingId)
    console.log(`[VoiceSynthesis] Meeting started: ${meetingId}, context: ${context}`)
  }

  /**
   * End meeting session
   */
  endMeeting(): void {
    this.state.isActive = false
    this.state.currentSpeaker = null
    this.state.speechQueue = []
    this.ttsService.stopAllAudio()
    this.ttsService.setActiveWorkflow(null)
    console.log('[VoiceSynthesis] Meeting ended')
  }

  /**
   * Update meeting context (affects speaking styles)
   */
  setMeetingContext(context: MeetingContext): void {
    this.state.meetingContext = context
    console.log(`[VoiceSynthesis] Context changed to: ${context}`)
  }

  /**
   * Get current meeting context
   */
  getMeetingContext(): MeetingContext {
    return this.state.meetingContext
  }

  /**
   * Check if meeting is active
   */
  isMeetingActive(): boolean {
    return this.state.isActive
  }

  // ===========================================================================
  // SPEECH SYNTHESIS
  // ===========================================================================

  /**
   * Synthesize and speak text as an employee
   */
  async speak(text: string, options: SynthesisOptions): Promise<void> {
    const { employeeId, context, emotion, priority, onStart, onEnd, onError } = options

    // Check if employee is muted
    if (this.state.mutedEmployees.has(employeeId)) {
      console.log(`[VoiceSynthesis] ${employeeId} is muted, skipping speech`)
      onStart?.()
      onEnd?.()
      return
    }

    // Get employee configuration
    const employeeConfig = getEmployeeVoiceConfig(employeeId)
    if (!employeeConfig) {
      console.warn(`[VoiceSynthesis] No config for employee: ${employeeId}, using default`)
    }

    // Determine speaking context
    const meetingContext = context || this.state.meetingContext

    // Get style configuration for this context
    const styleConfig = getEmployeeSpeakingStyle(employeeId, meetingContext)

    // Determine emotion (auto-detect or use override/context default)
    const finalEmotion = emotion ||
      getEmployeeContextEmotion(employeeId, meetingContext) ||
      detectEmotion(text)

    // Get voice profile ID
    const voiceProfileId = employeeConfig?.voiceProfileId || 'system'

    // Create speech item for tracking
    const speechItem: MeetingSpeechItem = {
      id: `${employeeId}-${Date.now()}`,
      employeeId,
      text,
      context: meetingContext,
      emotion: finalEmotion,
      timestamp: Date.now(),
      status: 'pending'
    }
    this.state.speechQueue.push(speechItem)

    // Prepare text with style adjustments
    const processedText = this.processTextForStyle(text, employeeConfig, styleConfig)

    console.log(`[VoiceSynthesis] ${employeeConfig?.name || employeeId} speaking:`, {
      context: meetingContext,
      emotion: finalEmotion,
      style: employeeConfig?.defaultStyle,
      voiceProfile: voiceProfileId
    })

    // Queue speech with TTS service
    await this.ttsService.queueSpeech(processedText, {
      agentId: voiceProfileId,
      emotion: finalEmotion,
      language: options.language || employeeConfig?.primaryLanguage,
      priority: priority ?? 0,
      onStart: () => {
        speechItem.status = 'speaking'
        this.state.currentSpeaker = employeeId
        onStart?.()
      },
      onEnd: () => {
        speechItem.status = 'completed'
        this.state.currentSpeaker = null
        onEnd?.()
      },
      onError: (error) => {
        speechItem.status = 'cancelled'
        this.state.currentSpeaker = null
        onError?.(error)
      }
    })
  }

  /**
   * Process text based on employee style
   */
  private processTextForStyle(
    text: string,
    _employeeConfig: EmployeeVoiceConfig | null,
    styleConfig: typeof SPEAKING_STYLE_CONFIGS[keyof typeof SPEAKING_STYLE_CONFIGS]
  ): string {
    let processed = text

    // Add pauses for formal speech
    if (styleConfig.formal) {
      // Add slight pauses after commas and periods for more deliberate speech
      processed = processed.replace(/\.\s/g, '. ')
      processed = processed.replace(/,\s/g, ', ')
    }

    // Truncate very long text
    if (processed.length > 800) {
      processed = processed.substring(0, 800) + '...'
    }

    return processed
  }

  /**
   * Speak with characteristic intro phrase
   */
  async speakWithIntro(text: string, options: SynthesisOptions): Promise<void> {
    const employeeConfig = getEmployeeVoiceConfig(options.employeeId)
    if (employeeConfig && employeeConfig.characteristicPhrases.length > 0) {
      const randomIndex = Math.floor(Math.random() * employeeConfig.characteristicPhrases.length)
      const introPhrase = employeeConfig.characteristicPhrases[randomIndex]
      const fullText = `${introPhrase}. ${text}`
      return this.speak(fullText, options)
    }
    return this.speak(text, options)
  }

  // ===========================================================================
  // VOLUME & MUTE CONTROLS
  // ===========================================================================

  /**
   * Set volume for an employee (0-100)
   */
  setEmployeeVolume(employeeId: string, volume: number): void {
    const clampedVolume = Math.max(0, Math.min(100, volume))
    this.state.volumeLevels.set(employeeId, clampedVolume)
    console.log(`[VoiceSynthesis] ${employeeId} volume set to ${clampedVolume}%`)
  }

  /**
   * Get volume for an employee
   */
  getEmployeeVolume(employeeId: string): number {
    return this.state.volumeLevels.get(employeeId) ?? 100
  }

  /**
   * Mute an employee
   */
  muteEmployee(employeeId: string): void {
    this.state.mutedEmployees.add(employeeId)
    console.log(`[VoiceSynthesis] ${employeeId} muted`)
  }

  /**
   * Unmute an employee
   */
  unmuteEmployee(employeeId: string): void {
    this.state.mutedEmployees.delete(employeeId)
    console.log(`[VoiceSynthesis] ${employeeId} unmuted`)
  }

  /**
   * Check if employee is muted
   */
  isEmployeeMuted(employeeId: string): boolean {
    return this.state.mutedEmployees.has(employeeId)
  }

  /**
   * Mute all employees
   */
  muteAll(): void {
    this.ttsService.setMuted(true)
    console.log('[VoiceSynthesis] All employees muted')
  }

  /**
   * Unmute all employees
   */
  unmuteAll(): void {
    this.ttsService.setMuted(false)
    console.log('[VoiceSynthesis] All employees unmuted')
  }

  // ===========================================================================
  // QUEUE MANAGEMENT
  // ===========================================================================

  /**
   * Get current speaker
   */
  getCurrentSpeaker(): string | null {
    return this.state.currentSpeaker
  }

  /**
   * Get speech queue
   */
  getSpeechQueue(): MeetingSpeechItem[] {
    return [...this.state.speechQueue]
  }

  /**
   * Cancel all pending speech
   */
  cancelAllPending(): void {
    this.state.speechQueue.forEach(item => {
      if (item.status === 'pending') {
        item.status = 'cancelled'
      }
    })
    this.ttsService.clearQueue()
    console.log('[VoiceSynthesis] All pending speech cancelled')
  }

  /**
   * Stop current speech immediately
   */
  stopCurrentSpeech(): void {
    this.ttsService.stop()
    this.state.currentSpeaker = null
    console.log('[VoiceSynthesis] Current speech stopped')
  }

  // ===========================================================================
  // STATUS & DIAGNOSTICS
  // ===========================================================================

  /**
   * Get full state (for debugging/UI)
   */
  getState(): VoiceSynthesisState {
    return {
      ...this.state,
      volumeLevels: new Map(this.state.volumeLevels),
      mutedEmployees: new Set(this.state.mutedEmployees)
    }
  }

  /**
   * Check if high-quality TTS is available
   */
  hasHighQualityTTS(): boolean {
    return this.ttsService.hasHighQualityTTS()
  }

  /**
   * Get active TTS provider
   */
  getActiveProvider(): string {
    return this.ttsService.getProvider()
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const voiceSynthesisService = VoiceSynthesisService.getInstance()

export default voiceSynthesisService
