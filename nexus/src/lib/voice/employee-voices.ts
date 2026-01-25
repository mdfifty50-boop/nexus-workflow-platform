/**
 * Employee Voice Configuration for AI Meeting Room
 *
 * Maps AI employee personas (CEO, Designer, Developer, etc.) to voice configurations.
 * Each employee has unique voice characteristics that match their personality and role.
 *
 * Features:
 * - Role-specific speaking styles (formal for CEO, casual for Designer)
 * - Dialect/accent support for multi-language meetings
 * - Emotion presets for different meeting contexts
 * - Integration with human-tts.ts voice profiles
 */

import type {
  VoicePersonality,
  VoiceEmotion,
  SupportedLanguage,
  ArabicDialect
} from '../../config/voice-profiles'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/** Employee role types in the AI Meeting Room */
export type EmployeeRole =
  | 'ceo'
  | 'cto'
  | 'project_lead'
  | 'tech_lead'
  | 'design_lead'
  | 'developer'
  | 'qa_engineer'
  | 'devops'
  | 'product_manager'
  | 'ux_designer'
  | 'data_scientist'
  | 'scrum_master'
  | 'business_analyst'
  | 'architect'
  | 'ai_coordinator'

/** Speaking style for different meeting contexts */
export type SpeakingStyle =
  | 'formal'           // Board meetings, presentations
  | 'professional'     // Standard business communication
  | 'casual'           // Team huddles, brainstorming
  | 'technical'        // Technical deep-dives
  | 'motivational'     // Team rallies, celebrations
  | 'empathetic'       // One-on-ones, sensitive discussions

/** Meeting context affects speech delivery */
export type MeetingContext =
  | 'board_meeting'
  | 'team_standup'
  | 'sprint_planning'
  | 'retrospective'
  | 'design_review'
  | 'code_review'
  | 'brainstorming'
  | 'client_call'
  | 'one_on_one'
  | 'celebration'

/** Configuration for an employee's voice in meetings */
export interface EmployeeVoiceConfig {
  /** Employee identifier matching AgentVoiceCard */
  employeeId: string
  /** Display name */
  name: string
  /** Role in the organization */
  role: EmployeeRole
  /** Maps to voice profile agent ID */
  voiceProfileId: string
  /** Default speaking style */
  defaultStyle: SpeakingStyle
  /** Voice personality type */
  personality: VoicePersonality
  /** Default emotional tone */
  defaultEmotion: VoiceEmotion
  /** Primary language */
  primaryLanguage: SupportedLanguage
  /** Arabic dialect if applicable */
  arabicDialect?: ArabicDialect
  /** Speech rate modifier (0.8 - 1.2) */
  speechRateModifier: number
  /** Pitch adjustment (-0.2 to 0.2) */
  pitchAdjustment: number
  /** Style overrides per meeting context */
  contextStyles: Partial<Record<MeetingContext, SpeakingStyle>>
  /** Emotion overrides per meeting context */
  contextEmotions: Partial<Record<MeetingContext, VoiceEmotion>>
  /** Whether employee uses more technical vocabulary */
  usesTechnicalVocabulary: boolean
  /** Characteristic phrases this employee uses */
  characteristicPhrases: string[]
}

/** Speaking style configuration */
export interface SpeakingStyleConfig {
  /** Rate multiplier (0.8 - 1.3) */
  rateMultiplier: number
  /** Pitch offset (-10% to +10%) */
  pitchOffset: string
  /** Volume level */
  volume: 'soft' | 'medium' | 'loud'
  /** Pause duration after sentences (ms) */
  pauseDuration: number
  /** Use formal vocabulary */
  formal: boolean
  /** Emphasis patterns */
  emphasisLevel: 'low' | 'medium' | 'high'
}

// =============================================================================
// SPEAKING STYLE CONFIGURATIONS
// =============================================================================

export const SPEAKING_STYLE_CONFIGS: Record<SpeakingStyle, SpeakingStyleConfig> = {
  formal: {
    rateMultiplier: 0.95,
    pitchOffset: '-2%',
    volume: 'medium',
    pauseDuration: 400,
    formal: true,
    emphasisLevel: 'low'
  },
  professional: {
    rateMultiplier: 1.0,
    pitchOffset: '0%',
    volume: 'medium',
    pauseDuration: 300,
    formal: true,
    emphasisLevel: 'medium'
  },
  casual: {
    rateMultiplier: 1.05,
    pitchOffset: '+2%',
    volume: 'medium',
    pauseDuration: 250,
    formal: false,
    emphasisLevel: 'medium'
  },
  technical: {
    rateMultiplier: 0.92,
    pitchOffset: '-1%',
    volume: 'medium',
    pauseDuration: 350,
    formal: true,
    emphasisLevel: 'high'
  },
  motivational: {
    rateMultiplier: 1.08,
    pitchOffset: '+5%',
    volume: 'loud',
    pauseDuration: 200,
    formal: false,
    emphasisLevel: 'high'
  },
  empathetic: {
    rateMultiplier: 0.9,
    pitchOffset: '-3%',
    volume: 'soft',
    pauseDuration: 450,
    formal: false,
    emphasisLevel: 'low'
  }
}

// =============================================================================
// EMPLOYEE VOICE CONFIGURATIONS
// =============================================================================

export const EMPLOYEE_VOICE_CONFIGS: Record<string, EmployeeVoiceConfig> = {
  // Zara - CEO/Project Lead (Authoritative, strategic)
  zara: {
    employeeId: 'zara',
    name: 'Zara',
    role: 'ceo',
    voiceProfileId: 'pm', // Uses John's confident voice profile
    defaultStyle: 'formal',
    personality: 'authoritative',
    defaultEmotion: 'serious',
    primaryLanguage: 'en-US',
    speechRateModifier: 0.95,
    pitchAdjustment: -0.05,
    contextStyles: {
      board_meeting: 'formal',
      team_standup: 'professional',
      celebration: 'motivational',
      one_on_one: 'empathetic'
    },
    contextEmotions: {
      board_meeting: 'serious',
      celebration: 'cheerful',
      one_on_one: 'empathetic'
    },
    usesTechnicalVocabulary: false,
    characteristicPhrases: [
      'Let me be direct',
      'From a strategic perspective',
      'The bottom line is',
      'I want to emphasize'
    ]
  },

  // Ava - Design Lead (Creative, expressive)
  ava: {
    employeeId: 'ava',
    name: 'Ava',
    role: 'design_lead',
    voiceProfileId: 'ux-designer', // Uses Sally's expressive voice
    defaultStyle: 'casual',
    personality: 'expressive',
    defaultEmotion: 'cheerful',
    primaryLanguage: 'en-US',
    speechRateModifier: 1.05,
    pitchAdjustment: 0.08,
    contextStyles: {
      design_review: 'professional',
      brainstorming: 'casual',
      client_call: 'professional'
    },
    contextEmotions: {
      design_review: 'friendly',
      brainstorming: 'excited',
      celebration: 'cheerful'
    },
    usesTechnicalVocabulary: false,
    characteristicPhrases: [
      'I love this direction',
      'What if we tried',
      'The user experience here',
      'This feels right'
    ]
  },

  // Winston - Tech Lead (Deep, authoritative)
  winston: {
    employeeId: 'winston',
    name: 'Winston',
    role: 'tech_lead',
    voiceProfileId: 'architect', // Uses Winston's authoritative voice
    defaultStyle: 'technical',
    personality: 'authoritative',
    defaultEmotion: 'neutral',
    primaryLanguage: 'en-GB',
    speechRateModifier: 0.9,
    pitchAdjustment: -0.1,
    contextStyles: {
      code_review: 'technical',
      sprint_planning: 'professional',
      brainstorming: 'casual'
    },
    contextEmotions: {
      code_review: 'serious',
      retrospective: 'empathetic',
      celebration: 'friendly'
    },
    usesTechnicalVocabulary: true,
    characteristicPhrases: [
      'Architecturally speaking',
      'The technical implications',
      'Let me elaborate',
      'Consider the trade-offs'
    ]
  },

  // Larry - Developer (Quick, technical)
  larry: {
    employeeId: 'larry',
    name: 'Larry',
    role: 'developer',
    voiceProfileId: 'dev', // Uses Amelia's professional voice
    defaultStyle: 'technical',
    personality: 'professional',
    defaultEmotion: 'neutral',
    primaryLanguage: 'en-US',
    speechRateModifier: 1.1,
    pitchAdjustment: 0,
    contextStyles: {
      code_review: 'technical',
      team_standup: 'casual',
      sprint_planning: 'professional'
    },
    contextEmotions: {
      code_review: 'neutral',
      brainstorming: 'excited'
    },
    usesTechnicalVocabulary: true,
    characteristicPhrases: [
      'The implementation is',
      'We could refactor this',
      'Looking at the code',
      'Let me check'
    ]
  },

  // Mary - Developer (Analytical, warm)
  mary: {
    employeeId: 'mary',
    name: 'Mary',
    role: 'developer',
    voiceProfileId: 'analyst', // Uses Mary's warm voice
    defaultStyle: 'professional',
    personality: 'warm',
    defaultEmotion: 'friendly',
    primaryLanguage: 'en-GB',
    speechRateModifier: 0.95,
    pitchAdjustment: 0.02,
    contextStyles: {
      code_review: 'technical',
      one_on_one: 'empathetic',
      retrospective: 'casual'
    },
    contextEmotions: {
      code_review: 'neutral',
      retrospective: 'empathetic',
      celebration: 'cheerful'
    },
    usesTechnicalVocabulary: true,
    characteristicPhrases: [
      'From my analysis',
      'The data suggests',
      'I think we should consider',
      'That makes sense'
    ]
  },

  // Alex - QA Engineer (Methodical, calm)
  alex: {
    employeeId: 'alex',
    name: 'Alex',
    role: 'qa_engineer',
    voiceProfileId: 'tea', // Uses Murat's calm voice
    defaultStyle: 'technical',
    personality: 'calm',
    defaultEmotion: 'neutral',
    primaryLanguage: 'en-US',
    speechRateModifier: 0.92,
    pitchAdjustment: -0.03,
    contextStyles: {
      code_review: 'technical',
      retrospective: 'professional',
      sprint_planning: 'professional'
    },
    contextEmotions: {
      code_review: 'serious',
      retrospective: 'empathetic'
    },
    usesTechnicalVocabulary: true,
    characteristicPhrases: [
      'From a testing perspective',
      'I found an edge case',
      'The test coverage shows',
      'We should validate'
    ]
  },

  // Sam - DevOps (Pragmatic, direct)
  sam: {
    employeeId: 'sam',
    name: 'Sam',
    role: 'devops',
    voiceProfileId: 'sm', // Uses Bob's energetic voice
    defaultStyle: 'technical',
    personality: 'professional',
    defaultEmotion: 'neutral',
    primaryLanguage: 'en-US',
    speechRateModifier: 1.02,
    pitchAdjustment: 0,
    contextStyles: {
      sprint_planning: 'technical',
      retrospective: 'casual'
    },
    contextEmotions: {
      celebration: 'cheerful'
    },
    usesTechnicalVocabulary: true,
    characteristicPhrases: [
      'The pipeline shows',
      'Deployment status',
      'Infrastructure-wise',
      'Let me check the logs'
    ]
  },

  // Emma - Product Manager (Confident, persuasive)
  emma: {
    employeeId: 'emma',
    name: 'Emma',
    role: 'product_manager',
    voiceProfileId: 'pm', // Uses John's confident voice
    defaultStyle: 'professional',
    personality: 'professional',
    defaultEmotion: 'friendly',
    primaryLanguage: 'en-US',
    speechRateModifier: 1.0,
    pitchAdjustment: 0.05,
    contextStyles: {
      client_call: 'formal',
      sprint_planning: 'professional',
      retrospective: 'empathetic'
    },
    contextEmotions: {
      client_call: 'friendly',
      celebration: 'excited'
    },
    usesTechnicalVocabulary: false,
    characteristicPhrases: [
      'From a product perspective',
      'User feedback indicates',
      'The roadmap shows',
      'Our priority is'
    ]
  },

  // David - Architect (Deep, thoughtful)
  david: {
    employeeId: 'david',
    name: 'David',
    role: 'architect',
    voiceProfileId: 'architect',
    defaultStyle: 'technical',
    personality: 'calm',
    defaultEmotion: 'neutral',
    primaryLanguage: 'en-GB',
    speechRateModifier: 0.88,
    pitchAdjustment: -0.08,
    contextStyles: {
      code_review: 'technical',
      design_review: 'technical',
      board_meeting: 'formal'
    },
    contextEmotions: {
      code_review: 'serious',
      retrospective: 'empathetic'
    },
    usesTechnicalVocabulary: true,
    characteristicPhrases: [
      'The architecture supports',
      'Long-term implications',
      'System design considerations',
      'Let me explain the rationale'
    ]
  },

  // Olivia - Data Scientist (Analytical, precise)
  olivia: {
    employeeId: 'olivia',
    name: 'Olivia',
    role: 'data_scientist',
    voiceProfileId: 'analyst',
    defaultStyle: 'technical',
    personality: 'professional',
    defaultEmotion: 'neutral',
    primaryLanguage: 'en-US',
    speechRateModifier: 0.95,
    pitchAdjustment: 0.03,
    contextStyles: {
      brainstorming: 'casual',
      board_meeting: 'formal'
    },
    contextEmotions: {
      brainstorming: 'excited'
    },
    usesTechnicalVocabulary: true,
    characteristicPhrases: [
      'The data shows',
      'Statistically significant',
      'Based on our analysis',
      'The model predicts'
    ]
  },

  // Nexus - AI Coordinator (Neutral, helpful)
  nexus: {
    employeeId: 'nexus',
    name: 'Nexus',
    role: 'ai_coordinator',
    voiceProfileId: 'system',
    defaultStyle: 'professional',
    personality: 'friendly',
    defaultEmotion: 'friendly',
    primaryLanguage: 'en-US',
    speechRateModifier: 1.0,
    pitchAdjustment: 0,
    contextStyles: {
      team_standup: 'casual',
      client_call: 'professional'
    },
    contextEmotions: {
      celebration: 'cheerful'
    },
    usesTechnicalVocabulary: false,
    characteristicPhrases: [
      'I can help with that',
      'Let me coordinate',
      'The team suggests',
      'Based on everyone\'s input'
    ]
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get employee voice configuration by ID
 */
export function getEmployeeVoiceConfig(employeeId: string): EmployeeVoiceConfig | null {
  return EMPLOYEE_VOICE_CONFIGS[employeeId] || null
}

/**
 * Get all employee voice configurations
 */
export function getAllEmployeeVoiceConfigs(): EmployeeVoiceConfig[] {
  return Object.values(EMPLOYEE_VOICE_CONFIGS)
}

/**
 * Get speaking style config for an employee in a specific context
 */
export function getEmployeeSpeakingStyle(
  employeeId: string,
  context: MeetingContext
): SpeakingStyleConfig {
  const employee = EMPLOYEE_VOICE_CONFIGS[employeeId]
  if (!employee) return SPEAKING_STYLE_CONFIGS.professional

  const style = employee.contextStyles[context] || employee.defaultStyle
  return SPEAKING_STYLE_CONFIGS[style]
}

/**
 * Get emotion for an employee in a specific context
 */
export function getEmployeeContextEmotion(
  employeeId: string,
  context: MeetingContext
): VoiceEmotion {
  const employee = EMPLOYEE_VOICE_CONFIGS[employeeId]
  if (!employee) return 'neutral'

  return employee.contextEmotions[context] || employee.defaultEmotion
}

/**
 * Get employees by role
 */
export function getEmployeesByRole(role: EmployeeRole): EmployeeVoiceConfig[] {
  return Object.values(EMPLOYEE_VOICE_CONFIGS).filter(e => e.role === role)
}

/**
 * Check if employee uses technical vocabulary
 */
export function employeeUsesTechnicalVocabulary(employeeId: string): boolean {
  const employee = EMPLOYEE_VOICE_CONFIGS[employeeId]
  return employee?.usesTechnicalVocabulary ?? false
}

/**
 * Get characteristic phrases for an employee
 */
export function getEmployeeCharacteristicPhrases(employeeId: string): string[] {
  const employee = EMPLOYEE_VOICE_CONFIGS[employeeId]
  return employee?.characteristicPhrases ?? []
}

export default EMPLOYEE_VOICE_CONFIGS
