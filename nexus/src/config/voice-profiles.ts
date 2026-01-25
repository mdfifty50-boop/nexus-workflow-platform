/**
 * Voice Profiles Configuration
 *
 * Defines voice characteristics for each AI agent in Nexus meeting room.
 * Supports multiple TTS providers with human-like voice quality.
 *
 * Provider Priority:
 * 1. ElevenLabs (eleven_multilingual_v2) - Most human-like, premium conversational voices
 * 2. Azure Neural TTS - High quality neural voices with emotion support
 * 3. Google WaveNet - Natural sounding voices with prosody control
 * 4. OpenAI TTS (tts-1-hd) - Good quality backup
 * 5. Browser SpeechSynthesis - Final fallback
 *
 * Key Design Principles:
 * - Each agent has a DISTINCT, recognizable voice personality
 * - Voices sound HUMAN, not robotic - with natural prosody and emotion
 * - Multi-language support with dialect detection for Arabic variants
 * - Voice characteristics match agent personality (authoritative, warm, energetic, etc.)
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type TTSProvider = 'elevenlabs' | 'azure' | 'google' | 'openai' | 'browser'

export type VoicePersonality =
  | 'warm'          // Friendly, approachable
  | 'professional'  // Clear, business-like
  | 'energetic'     // Upbeat, enthusiastic
  | 'calm'          // Measured, patient
  | 'authoritative' // Commanding, confident
  | 'friendly'      // Casual, personable
  | 'expressive'    // Animated, creative
  | 'patient'       // Slow, clear, educational

export type VoiceEmotion =
  | 'neutral'
  | 'cheerful'
  | 'empathetic'
  | 'excited'
  | 'serious'
  | 'friendly'
  | 'hopeful'
  | 'sad'
  | 'angry'
  | 'fearful'
  | 'unfriendly'

export type SupportedLanguage =
  | 'en-US'   // American English
  | 'en-GB'   // British English
  | 'en-AU'   // Australian English
  | 'ar-SA'   // Saudi Arabic (Gulf)
  | 'ar-KW'   // Kuwaiti Arabic (Gulf dialect)
  | 'ar-AE'   // UAE Arabic (Gulf)
  | 'ar-EG'   // Egyptian Arabic
  | 'ar-LB'   // Lebanese Arabic (Levantine)
  | 'ar-SY'   // Syrian Arabic (Levantine)
  | 'ar-JO'   // Jordanian Arabic (Levantine)
  | 'ar-MA'   // Moroccan Arabic (Maghrebi)
  | 'ar'      // Modern Standard Arabic

export type ArabicDialect =
  | 'gulf'      // Kuwait, Saudi, UAE, Qatar, Bahrain
  | 'levantine' // Lebanon, Syria, Jordan, Palestine
  | 'egyptian'  // Egypt
  | 'maghrebi'  // Morocco, Algeria, Tunisia
  | 'msa'       // Modern Standard Arabic (formal)

// =============================================================================
// VOICE CONFIGURATION INTERFACES
// =============================================================================

export interface ElevenLabsVoiceConfig {
  voiceId: string
  voiceName: string
  modelId: 'eleven_multilingual_v2' | 'eleven_turbo_v2' | 'eleven_monolingual_v1'
  settings: {
    stability: number        // 0.0-1.0: Lower = more expressive
    similarityBoost: number  // 0.0-1.0: Higher = closer to original voice
    style: number           // 0.0-1.0: Style exaggeration
    useSpeakerBoost: boolean // Enhanced clarity
  }
}

export interface AzureVoiceConfig {
  voiceName: string
  locale: string
  style?: string           // E.g., "cheerful", "empathetic", "excited"
  styleDegree?: number     // 0.01-2.0: Intensity of style
  role?: string           // E.g., "Girl", "Boy", "YoungAdultFemale"
  pitch?: string          // E.g., "+5%", "-10%", "medium"
  rate?: string           // E.g., "1.1", "slow", "medium"
  contour?: string        // Pitch contour for natural intonation
}

export interface GoogleVoiceConfig {
  name: string             // E.g., "en-US-Wavenet-J"
  languageCode: string
  ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL'
  audioConfig: {
    speakingRate: number   // 0.25-4.0
    pitch: number          // -20.0 to 20.0 semitones
    volumeGainDb: number   // -96.0 to 16.0
  }
}

export interface OpenAIVoiceConfig {
  voice: 'alloy' | 'ash' | 'coral' | 'sage' | 'ballad' | 'verse' | 'shimmer' | 'echo' | 'fable' | 'onyx' | 'nova'
  model: 'tts-1' | 'tts-1-hd'
  speed: number            // 0.25-4.0
}

export interface BrowserVoiceConfig {
  gender: 'male' | 'female'
  preferredVoiceNames: string[]  // Priority list of voice names
  pitch: number            // 0-2
  rate: number             // 0.1-10
  volume: number           // 0-1
}

// Complete voice profile for an agent
export interface AgentVoiceProfile {
  agentId: string
  agentName: string
  personality: VoicePersonality
  defaultEmotion: VoiceEmotion

  // Language support
  primaryLanguage: SupportedLanguage
  supportedLanguages: SupportedLanguage[]
  arabicDialect?: ArabicDialect

  // Provider-specific configurations
  elevenlabs: ElevenLabsVoiceConfig
  azure: AzureVoiceConfig
  google: GoogleVoiceConfig
  openai: OpenAIVoiceConfig
  browser: BrowserVoiceConfig

  // Voice characteristics description (for UI/documentation)
  description: string
}

// =============================================================================
// AGENT VOICE PROFILES
// =============================================================================

export const AGENT_VOICE_PROFILES: Record<string, AgentVoiceProfile> = {
  // Mary - Business Analyst (Warm, analytical female)
  'analyst': {
    agentId: 'analyst',
    agentName: 'Mary',
    personality: 'warm',
    defaultEmotion: 'friendly',
    primaryLanguage: 'en-US',
    supportedLanguages: ['en-US', 'en-GB', 'ar-SA', 'ar-KW', 'ar-EG'],
    description: 'Warm British conversational voice - thoughtful analysis with friendly delivery',

    elevenlabs: {
      voiceId: 'XB0fDUnXU5powFXDhCwa',  // Charlotte
      voiceName: 'Charlotte',
      modelId: 'eleven_multilingual_v2',
      settings: {
        stability: 0.4,
        similarityBoost: 0.85,
        style: 0.4,
        useSpeakerBoost: true
      }
    },
    azure: {
      voiceName: 'en-GB-SoniaNeural',
      locale: 'en-GB',
      style: 'friendly',
      styleDegree: 1.2,
      rate: '0.95'
    },
    google: {
      name: 'en-GB-Wavenet-C',
      languageCode: 'en-GB',
      ssmlGender: 'FEMALE',
      audioConfig: {
        speakingRate: 0.95,
        pitch: 0,
        volumeGainDb: 0
      }
    },
    openai: {
      voice: 'coral',
      model: 'tts-1-hd',
      speed: 0.95
    },
    browser: {
      gender: 'female',
      preferredVoiceNames: ['Microsoft Zira', 'Samantha', 'Karen', 'Victoria'],
      pitch: 1.0,
      rate: 0.95,
      volume: 0.9
    }
  },

  // Winston - Architect (Deep, authoritative male)
  'architect': {
    agentId: 'architect',
    agentName: 'Winston',
    personality: 'authoritative',
    defaultEmotion: 'serious',
    primaryLanguage: 'en-GB',
    supportedLanguages: ['en-GB', 'en-US', 'ar-SA', 'ar-KW'],
    description: 'Deep authoritative British voice - commands respect with measured gravitas',

    elevenlabs: {
      voiceId: 'onwK4e9ZLuTAKqWW03F9',  // Daniel
      voiceName: 'Daniel',
      modelId: 'eleven_multilingual_v2',
      settings: {
        stability: 0.55,
        similarityBoost: 0.85,
        style: 0.3,
        useSpeakerBoost: true
      }
    },
    azure: {
      voiceName: 'en-GB-RyanNeural',
      locale: 'en-GB',
      style: 'calm',
      styleDegree: 1.0,
      rate: '0.9'
    },
    google: {
      name: 'en-GB-Wavenet-B',
      languageCode: 'en-GB',
      ssmlGender: 'MALE',
      audioConfig: {
        speakingRate: 0.9,
        pitch: -2,
        volumeGainDb: 0
      }
    },
    openai: {
      voice: 'onyx',
      model: 'tts-1-hd',
      speed: 0.9
    },
    browser: {
      gender: 'male',
      preferredVoiceNames: ['Microsoft David', 'Daniel', 'James', 'George'],
      pitch: 0.8,
      rate: 0.9,
      volume: 0.9
    }
  },

  // Amelia - Developer (Quick, precise female)
  'dev': {
    agentId: 'dev',
    agentName: 'Amelia',
    personality: 'professional',
    defaultEmotion: 'neutral',
    primaryLanguage: 'en-US',
    supportedLanguages: ['en-US', 'en-GB', 'ar-SA', 'ar-EG'],
    description: 'Clear American professional voice - focused and technically articulate',

    elevenlabs: {
      voiceId: 'LcfcDJNUP1GQjkzn1xUU',  // Emily
      voiceName: 'Emily',
      modelId: 'eleven_multilingual_v2',
      settings: {
        stability: 0.5,
        similarityBoost: 0.85,
        style: 0.35,
        useSpeakerBoost: true
      }
    },
    azure: {
      voiceName: 'en-US-JennyNeural',
      locale: 'en-US',
      style: 'assistant',
      styleDegree: 1.0,
      rate: '1.1'
    },
    google: {
      name: 'en-US-Wavenet-F',
      languageCode: 'en-US',
      ssmlGender: 'FEMALE',
      audioConfig: {
        speakingRate: 1.1,
        pitch: 1,
        volumeGainDb: 0
      }
    },
    openai: {
      voice: 'shimmer',
      model: 'tts-1-hd',
      speed: 1.1
    },
    browser: {
      gender: 'female',
      preferredVoiceNames: ['Microsoft Zira', 'Samantha', 'Victoria'],
      pitch: 1.05,
      rate: 1.1,
      volume: 0.9
    }
  },

  // John - Product Manager (Confident, persuasive male)
  'pm': {
    agentId: 'pm',
    agentName: 'John',
    personality: 'professional',
    defaultEmotion: 'friendly',
    primaryLanguage: 'en-US',
    supportedLanguages: ['en-US', 'en-GB', 'ar-SA', 'ar-KW', 'ar-EG'],
    description: 'Confident American male voice - natural leadership with persuasive warmth',

    elevenlabs: {
      voiceId: 'TX3LPaxmHKxFdv7VOQHJ',  // Liam
      voiceName: 'Liam',
      modelId: 'eleven_multilingual_v2',
      settings: {
        stability: 0.45,
        similarityBoost: 0.85,
        style: 0.4,
        useSpeakerBoost: true
      }
    },
    azure: {
      voiceName: 'en-US-GuyNeural',
      locale: 'en-US',
      style: 'newscast-casual',
      styleDegree: 1.1,
      rate: '1.0'
    },
    google: {
      name: 'en-US-Wavenet-J',
      languageCode: 'en-US',
      ssmlGender: 'MALE',
      audioConfig: {
        speakingRate: 1.0,
        pitch: 0,
        volumeGainDb: 0
      }
    },
    openai: {
      voice: 'echo',
      model: 'tts-1-hd',
      speed: 1.0
    },
    browser: {
      gender: 'male',
      preferredVoiceNames: ['Microsoft Mark', 'David', 'Alex'],
      pitch: 0.95,
      rate: 1.0,
      volume: 0.9
    }
  },

  // Bob - Scrum Master (Energetic, motivating male)
  'sm': {
    agentId: 'sm',
    agentName: 'Bob',
    personality: 'energetic',
    defaultEmotion: 'cheerful',
    primaryLanguage: 'en-US',
    supportedLanguages: ['en-US', 'ar-SA', 'ar-KW'],
    description: 'Energetic friendly male voice - upbeat and motivating team coach',

    elevenlabs: {
      voiceId: 'GBv7mTt0atIp3Br8iCZE',  // Thomas
      voiceName: 'Thomas',
      modelId: 'eleven_multilingual_v2',
      settings: {
        stability: 0.35,
        similarityBoost: 0.8,
        style: 0.5,
        useSpeakerBoost: true
      }
    },
    azure: {
      voiceName: 'en-US-JasonNeural',
      locale: 'en-US',
      style: 'cheerful',
      styleDegree: 1.3,
      rate: '1.05'
    },
    google: {
      name: 'en-US-Wavenet-D',
      languageCode: 'en-US',
      ssmlGender: 'MALE',
      audioConfig: {
        speakingRate: 1.05,
        pitch: 1,
        volumeGainDb: 0
      }
    },
    openai: {
      voice: 'fable',
      model: 'tts-1-hd',
      speed: 1.05
    },
    browser: {
      gender: 'male',
      preferredVoiceNames: ['Alex', 'Microsoft Mark', 'Daniel'],
      pitch: 0.95,
      rate: 1.05,
      volume: 0.9
    }
  },

  // Murat - Test Architect (Calm, methodical male)
  'tea': {
    agentId: 'tea',
    agentName: 'Murat',
    personality: 'calm',
    defaultEmotion: 'neutral',
    primaryLanguage: 'en-US',
    supportedLanguages: ['en-US', 'en-GB', 'ar-SA', 'ar-KW', 'ar-EG'],
    description: 'Calm measured male voice - patient and thorough with quiet confidence',

    elevenlabs: {
      voiceId: 'wViXBPUzp2ZZixB1xQuM',  // Ryan
      voiceName: 'Ryan',
      modelId: 'eleven_multilingual_v2',
      settings: {
        stability: 0.6,
        similarityBoost: 0.85,
        style: 0.25,
        useSpeakerBoost: true
      }
    },
    azure: {
      voiceName: 'en-US-DavisNeural',
      locale: 'en-US',
      style: 'calm',
      styleDegree: 1.0,
      rate: '0.95'
    },
    google: {
      name: 'en-US-Wavenet-A',
      languageCode: 'en-US',
      ssmlGender: 'MALE',
      audioConfig: {
        speakingRate: 0.95,
        pitch: -1,
        volumeGainDb: 0
      }
    },
    openai: {
      voice: 'ash',
      model: 'tts-1-hd',
      speed: 0.95
    },
    browser: {
      gender: 'male',
      preferredVoiceNames: ['Microsoft David', 'Daniel', 'Alex'],
      pitch: 0.9,
      rate: 0.95,
      volume: 0.9
    }
  },

  // Sally - UX Designer (Warm, expressive female)
  'ux-designer': {
    agentId: 'ux-designer',
    agentName: 'Sally',
    personality: 'expressive',
    defaultEmotion: 'cheerful',
    primaryLanguage: 'en-US',
    supportedLanguages: ['en-US', 'en-GB', 'ar-SA', 'ar-EG'],
    description: 'Expressive warm female voice - creative and engaging with empathetic delivery',

    elevenlabs: {
      voiceId: 'pFZP5JQG7iQjIQuC4Bku',  // Lily
      voiceName: 'Lily',
      modelId: 'eleven_multilingual_v2',
      settings: {
        stability: 0.35,
        similarityBoost: 0.8,
        style: 0.5,
        useSpeakerBoost: true
      }
    },
    azure: {
      voiceName: 'en-US-AriaNeural',
      locale: 'en-US',
      style: 'hopeful',
      styleDegree: 1.2,
      rate: '1.0'
    },
    google: {
      name: 'en-US-Wavenet-H',
      languageCode: 'en-US',
      ssmlGender: 'FEMALE',
      audioConfig: {
        speakingRate: 1.0,
        pitch: 2,
        volumeGainDb: 0
      }
    },
    openai: {
      voice: 'nova',
      model: 'tts-1-hd',
      speed: 1.0
    },
    browser: {
      gender: 'female',
      preferredVoiceNames: ['Samantha', 'Microsoft Zira', 'Victoria'],
      pitch: 1.1,
      rate: 1.0,
      volume: 0.9
    }
  },

  // Paige - Tech Writer (Clear, articulate female)
  'tech-writer': {
    agentId: 'tech-writer',
    agentName: 'Paige',
    personality: 'patient',
    defaultEmotion: 'friendly',
    primaryLanguage: 'en-US',
    supportedLanguages: ['en-US', 'en-GB', 'ar-SA', 'ar-EG'],
    description: 'Clear patient female voice - educational and accessible with warm clarity',

    elevenlabs: {
      voiceId: 'oWAxZDx7w5VEj9dCyTzz',  // Grace
      voiceName: 'Grace',
      modelId: 'eleven_multilingual_v2',
      settings: {
        stability: 0.55,
        similarityBoost: 0.85,
        style: 0.35,
        useSpeakerBoost: true
      }
    },
    azure: {
      voiceName: 'en-US-SaraNeural',
      locale: 'en-US',
      style: 'friendly',
      styleDegree: 1.0,
      rate: '0.95'
    },
    google: {
      name: 'en-US-Wavenet-E',
      languageCode: 'en-US',
      ssmlGender: 'FEMALE',
      audioConfig: {
        speakingRate: 0.95,
        pitch: 0,
        volumeGainDb: 0
      }
    },
    openai: {
      voice: 'sage',
      model: 'tts-1-hd',
      speed: 0.95
    },
    browser: {
      gender: 'female',
      preferredVoiceNames: ['Microsoft Zira', 'Karen', 'Victoria', 'Samantha'],
      pitch: 1.05,
      rate: 0.95,
      volume: 0.9
    }
  },

  // System - Default/Neutral voice for announcements
  'system': {
    agentId: 'system',
    agentName: 'System',
    personality: 'professional',
    defaultEmotion: 'neutral',
    primaryLanguage: 'en-US',
    supportedLanguages: ['en-US', 'en-GB', 'ar-SA', 'ar-KW', 'ar-EG', 'ar-LB', 'ar'],
    description: 'Neutral professional voice for system announcements',

    elevenlabs: {
      voiceId: 'XB0fDUnXU5powFXDhCwa',  // Charlotte (neutral default)
      voiceName: 'Charlotte',
      modelId: 'eleven_multilingual_v2',
      settings: {
        stability: 0.5,
        similarityBoost: 0.85,
        style: 0.3,
        useSpeakerBoost: true
      }
    },
    azure: {
      voiceName: 'en-US-JennyNeural',
      locale: 'en-US',
      style: 'assistant',
      styleDegree: 1.0,
      rate: '1.0'
    },
    google: {
      name: 'en-US-Wavenet-C',
      languageCode: 'en-US',
      ssmlGender: 'FEMALE',
      audioConfig: {
        speakingRate: 1.0,
        pitch: 0,
        volumeGainDb: 0
      }
    },
    openai: {
      voice: 'alloy',
      model: 'tts-1-hd',
      speed: 1.0
    },
    browser: {
      gender: 'female',
      preferredVoiceNames: ['Microsoft Zira', 'Samantha', 'Google US English'],
      pitch: 1.0,
      rate: 1.0,
      volume: 0.9
    }
  }
}

// =============================================================================
// ARABIC VOICE PROFILES
// =============================================================================

// Arabic voice configurations for multilingual support
export const ARABIC_VOICE_PROFILES: Record<ArabicDialect, {
  elevenlabs: { voiceId: string; voiceName: string }
  azure: { voiceName: string; locale: string }
  google: { name: string; languageCode: string }
}> = {
  gulf: {
    elevenlabs: { voiceId: 'your_gulf_voice_id', voiceName: 'Khalid (Gulf)' },
    azure: { voiceName: 'ar-SA-HamedNeural', locale: 'ar-SA' },
    google: { name: 'ar-XA-Wavenet-B', languageCode: 'ar-XA' }
  },
  levantine: {
    elevenlabs: { voiceId: 'your_levantine_voice_id', voiceName: 'Layla (Levantine)' },
    azure: { voiceName: 'ar-SY-AmanyNeural', locale: 'ar-SY' },
    google: { name: 'ar-XA-Wavenet-A', languageCode: 'ar-XA' }
  },
  egyptian: {
    elevenlabs: { voiceId: 'your_egyptian_voice_id', voiceName: 'Omar (Egyptian)' },
    azure: { voiceName: 'ar-EG-SalmaNeural', locale: 'ar-EG' },
    google: { name: 'ar-XA-Wavenet-C', languageCode: 'ar-XA' }
  },
  maghrebi: {
    elevenlabs: { voiceId: 'your_maghrebi_voice_id', voiceName: 'Fatima (Maghrebi)' },
    azure: { voiceName: 'ar-MA-MounaNeural', locale: 'ar-MA' },
    google: { name: 'ar-XA-Wavenet-D', languageCode: 'ar-XA' }
  },
  msa: {
    elevenlabs: { voiceId: 'your_msa_voice_id', voiceName: 'Ahmad (MSA)' },
    azure: { voiceName: 'ar-SA-ZariyahNeural', locale: 'ar-SA' },
    google: { name: 'ar-XA-Standard-A', languageCode: 'ar-XA' }
  }
}

// =============================================================================
// KUWAITI ARABIC SLANG PATTERNS
// =============================================================================

// Common Kuwaiti Arabic slang/dialect words and phrases for detection
export const KUWAITI_SLANG_PATTERNS = {
  // Common Kuwaiti words and expressions
  words: [
    // Greetings and expressions
    'هلا', 'هلا والله', 'شخبارك', 'شلونك', 'شلون', 'زين', 'واجد', 'مره',
    'ايوا', 'لا', 'هاه', 'شو', 'ليش', 'وين', 'متى', 'شكثر', 'جم',
    // Common verbs (Kuwaiti conjugation)
    'يبي', 'ابي', 'تبي', 'يبون', 'قاعد', 'قاعدين', 'راح', 'ماراح', 'يله',
    // Adjectives and adverbs
    'حلو', 'زين', 'مب', 'مو', 'اوكي', 'تمام', 'ماشي', 'فاهم',
    // Kuwaiti-specific expressions
    'دقيقة', 'يا الغالي', 'يا الحبيب', 'الحين', 'هالحين', 'توني', 'لسه',
    'خلاص', 'يالله', 'عيل', 'عاد', 'بعدين', 'اشوي', 'شوي'
  ],
  // Kuwaiti grammar patterns
  patterns: [
    /ش(و|ن|لون|كثر|فيه)/,  // Question words with ش
    /مب\s/,                 // Negation "مب"
    /يب(ي|ون)\s/,          // "want" conjugation
    /قاعد(ين)?\s/,         // Progressive marker
    /توني?\s/,             // "just now"
    /الحين/,               // "now"
  ]
}

// Gulf Arabic (Saudi, UAE) patterns
export const GULF_ARABIC_PATTERNS = {
  words: [
    'وش', 'ايش', 'كيفك', 'زين', 'تمام', 'ما شاء الله', 'ان شاء الله',
    'يالله', 'خلاص', 'عادي', 'حبيبي', 'اخوي', 'يا رجال', 'الحين'
  ],
  patterns: [
    /وش\s/,
    /ايش\s/,
  ]
}

// Egyptian Arabic patterns
export const EGYPTIAN_ARABIC_PATTERNS = {
  words: [
    'ايه', 'ازيك', 'ازاي', 'كويس', 'خالص', 'جدا', 'قوي', 'ده', 'دي',
    'بتاع', 'بتاعي', 'يعني', 'طب', 'بس', 'كده', 'ليه', 'فين', 'امتى'
  ],
  patterns: [
    /ازاي\s/,
    /ده\s/,
    /دي\s/,
    /بتاع/,
    /كده/,
  ]
}

// Levantine Arabic patterns
export const LEVANTINE_ARABIC_PATTERNS = {
  words: [
    'كيفك', 'شو', 'هيك', 'هلق', 'ليش', 'وين', 'شي', 'منيح', 'كتير',
    'هلأ', 'يلا', 'خلص', 'بس', 'هاي', 'حبيبي', 'يا زلمة'
  ],
  patterns: [
    /شو\s/,
    /هيك/,
    /هلق/,
    /منيح/,
  ]
}

// =============================================================================
// EMOTION TO SSML MAPPING
// =============================================================================

// Maps voice emotions to SSML prosody configurations
export const EMOTION_PROSODY: Record<VoiceEmotion, {
  rate: string
  pitch: string
  volume: string
}> = {
  neutral: { rate: 'medium', pitch: 'medium', volume: 'medium' },
  cheerful: { rate: '110%', pitch: '+5%', volume: 'loud' },
  empathetic: { rate: '90%', pitch: '-2%', volume: 'medium' },
  excited: { rate: '120%', pitch: '+10%', volume: 'loud' },
  serious: { rate: '90%', pitch: '-5%', volume: 'medium' },
  friendly: { rate: 'medium', pitch: '+2%', volume: 'medium' },
  hopeful: { rate: '105%', pitch: '+3%', volume: 'medium' },
  sad: { rate: '85%', pitch: '-8%', volume: 'soft' },
  angry: { rate: '115%', pitch: '+8%', volume: 'loud' },
  fearful: { rate: '95%', pitch: '+5%', volume: 'soft' },
  unfriendly: { rate: '95%', pitch: '-3%', volume: 'medium' }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get voice profile for an agent, with fallback to system voice
 */
export function getVoiceProfile(agentId: string): AgentVoiceProfile {
  return AGENT_VOICE_PROFILES[agentId] || AGENT_VOICE_PROFILES['system']
}

/**
 * Get all agent voice profiles
 */
export function getAllVoiceProfiles(): AgentVoiceProfile[] {
  return Object.values(AGENT_VOICE_PROFILES)
}

/**
 * Get voice profile by agent name (case-insensitive)
 */
export function getVoiceProfileByName(name: string): AgentVoiceProfile | null {
  const profile = Object.values(AGENT_VOICE_PROFILES).find(
    p => p.agentName.toLowerCase() === name.toLowerCase()
  )
  return profile || null
}

/**
 * Check if a language is supported by an agent
 */
export function isLanguageSupported(agentId: string, language: SupportedLanguage): boolean {
  const profile = getVoiceProfile(agentId)
  return profile.supportedLanguages.includes(language)
}

/**
 * Get Arabic voice configuration for a dialect
 */
export function getArabicVoiceConfig(dialect: ArabicDialect) {
  return ARABIC_VOICE_PROFILES[dialect]
}

export default AGENT_VOICE_PROFILES
