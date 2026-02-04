/**
 * ElevenLabsVoiceService
 *
 * Manages voice configuration for Nexus AI voice calls.
 * Implements domain-specific voice profiles, language detection,
 * and optimal voice selection based on user preferences.
 *
 * @see docs/integrations/ELEVENLABS_VOICE_CONFIGURATION.md
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface VoiceProfile {
  id: string
  name: string
  language: 'en' | 'ar'
  dialect?: 'gulf' | 'levantine' | 'egyptian' | 'msa'
  gender: 'male' | 'female'
  characteristics: string[]
  domains: string[]
  stability: number
  speed: number
  similarity: number
}

export interface DomainConfig {
  domain: string
  displayName: string
  displayName_ar: string
  systemPrompt: string
  systemPrompt_ar: string
  voiceProfiles: {
    en: { male: string; female: string }
    ar: { male: string; female: string }
  }
  voiceSettings: {
    stability: number
    speed: number
    similarity: number
  }
}

export interface UserVoicePreferences {
  userId: string
  domain: string
  language: 'en' | 'ar' | 'auto'
  preferredGender: 'male' | 'female' | 'no_preference'
  voiceIdEn?: string
  voiceIdAr?: string
  customSettings?: {
    stability?: number
    speed?: number
    similarity?: number
  }
}

export interface WorkflowVoiceConfig {
  workflowId: string
  nodeId?: string
  voiceId?: string
  language?: 'en' | 'ar' | 'auto'
  tone?: 'professional' | 'friendly' | 'urgent'
  customPrompt?: string
  settings?: {
    stability?: number
    speed?: number
    similarity?: number
  }
}

export interface VoiceCallConfig {
  agentId: string
  voiceId: string
  language: string
  systemPrompt: string
  settings: {
    stability: number
    speed: number
    similarity: number
  }
}

// ============================================================================
// Voice Profiles Database
// ============================================================================

const VOICE_PROFILES: VoiceProfile[] = [
  // English Voices
  {
    id: 'eric',
    name: 'Eric - Smooth, Trustworthy',
    language: 'en',
    gender: 'male',
    characteristics: ['trustworthy', 'smooth', 'professional'],
    domains: ['legal', 'finance', 'business', 'healthcare'],
    stability: 0.75,
    speed: 1.0,
    similarity: 0.80
  },
  {
    id: 'charlotte',
    name: 'Charlotte - Professional',
    language: 'en',
    gender: 'female',
    characteristics: ['professional', 'clear', 'authoritative'],
    domains: ['legal', 'finance', 'business'],
    stability: 0.75,
    speed: 1.0,
    similarity: 0.80
  },
  {
    id: 'brian',
    name: 'Brian - Calm, Soothing',
    language: 'en',
    gender: 'male',
    characteristics: ['calm', 'soothing', 'empathetic'],
    domains: ['healthcare', 'education'],
    stability: 0.65,
    speed: 0.85,
    similarity: 0.85
  },
  {
    id: 'sarah',
    name: 'Sarah - Warm, Caring',
    language: 'en',
    gender: 'female',
    characteristics: ['warm', 'caring', 'patient'],
    domains: ['healthcare', 'education', 'hospitality'],
    stability: 0.65,
    speed: 0.85,
    similarity: 0.85
  },
  {
    id: 'josh',
    name: 'Josh - Friendly, Dynamic',
    language: 'en',
    gender: 'male',
    characteristics: ['friendly', 'dynamic', 'energetic'],
    domains: ['sales', 'customer_service', 'real_estate'],
    stability: 0.55,
    speed: 1.0,
    similarity: 0.75
  },
  {
    id: 'jessica',
    name: 'Jessica - Enthusiastic',
    language: 'en',
    gender: 'female',
    characteristics: ['enthusiastic', 'engaging', 'warm'],
    domains: ['sales', 'customer_service', 'real_estate'],
    stability: 0.55,
    speed: 1.0,
    similarity: 0.75
  },

  // Arabic (Gulf) Voices
  {
    id: 'fares',
    name: 'Fares - Comforting, Balanced and Clear',
    language: 'ar',
    dialect: 'gulf',
    gender: 'male',
    characteristics: ['professional', 'warm', 'clear', 'balanced'],
    domains: ['legal', 'finance', 'healthcare', 'business'],
    stability: 0.75,
    speed: 1.0,
    similarity: 0.80
  },
  {
    id: 'fatima',
    name: 'Fatima - Warm, Professional',
    language: 'ar',
    dialect: 'gulf',
    gender: 'female',
    characteristics: ['warm', 'professional', 'clear'],
    domains: ['legal', 'healthcare', 'business'],
    stability: 0.75,
    speed: 1.0,
    similarity: 0.80
  },
  {
    id: 'ahmed',
    name: 'Ahmed - Engaging, Friendly',
    language: 'ar',
    dialect: 'gulf',
    gender: 'male',
    characteristics: ['engaging', 'friendly', 'dynamic'],
    domains: ['sales', 'customer_service', 'hospitality'],
    stability: 0.55,
    speed: 1.0,
    similarity: 0.75
  },
  {
    id: 'layla',
    name: 'Layla - Welcoming, Warm',
    language: 'ar',
    dialect: 'gulf',
    gender: 'female',
    characteristics: ['welcoming', 'warm', 'friendly'],
    domains: ['sales', 'customer_service', 'hospitality'],
    stability: 0.55,
    speed: 1.0,
    similarity: 0.75
  },
  {
    id: 'maryam',
    name: 'Maryam - Gentle, Caring',
    language: 'ar',
    dialect: 'gulf',
    gender: 'female',
    characteristics: ['gentle', 'caring', 'empathetic'],
    domains: ['healthcare', 'education'],
    stability: 0.65,
    speed: 0.85,
    similarity: 0.85
  },
]

// ============================================================================
// Domain Configurations
// ============================================================================

const DOMAIN_CONFIGS: DomainConfig[] = [
  {
    domain: 'legal',
    displayName: 'Legal',
    displayName_ar: 'القانوني',
    systemPrompt: `You are a professional legal assistant. Speak clearly and formally.
Use precise legal terminology when appropriate. Be patient and thorough.
Never provide specific legal advice - always recommend consulting a qualified attorney.
For Arabic speakers, use formal Modern Standard Arabic with Gulf dialect intonation.`,
    systemPrompt_ar: `أنت مساعد قانوني محترف. تحدث بوضوح ورسمية.
استخدم المصطلحات القانونية الدقيقة عند الاقتضاء. كن صبوراً ودقيقاً.
لا تقدم أبداً نصيحة قانونية محددة - دائماً أوصِ بالتشاور مع محامٍ مؤهل.`,
    voiceProfiles: {
      en: { male: 'eric', female: 'charlotte' },
      ar: { male: 'fares', female: 'fatima' }
    },
    voiceSettings: { stability: 0.75, speed: 0.9, similarity: 0.80 }
  },
  {
    domain: 'healthcare',
    displayName: 'Healthcare',
    displayName_ar: 'الرعاية الصحية',
    systemPrompt: `You are a healthcare assistant. Speak calmly and reassuringly.
Use simple, clear language. Be patient with questions.
Show empathy and understanding. Never rush the caller.
For urgent matters, maintain calm while conveying urgency professionally.
Never diagnose conditions - always recommend seeing a healthcare provider.`,
    systemPrompt_ar: `أنت مساعد رعاية صحية. تحدث بهدوء وطمأنينة.
استخدم لغة بسيطة وواضحة. كن صبوراً مع الأسئلة.
أظهر التعاطف والتفهم. لا تستعجل المتصل أبداً.
للأمور العاجلة، حافظ على الهدوء مع نقل الإلحاح بشكل مهني.`,
    voiceProfiles: {
      en: { male: 'brian', female: 'sarah' },
      ar: { male: 'fares', female: 'maryam' }
    },
    voiceSettings: { stability: 0.65, speed: 0.85, similarity: 0.85 }
  },
  {
    domain: 'sales',
    displayName: 'Sales & Customer Service',
    displayName_ar: 'المبيعات وخدمة العملاء',
    systemPrompt: `You are a friendly sales and customer service assistant.
Be enthusiastic but not pushy. Listen actively to customer needs.
Offer solutions proactively. Use the customer's name when appropriate.
For Arabic speakers, use welcoming phrases and show genuine interest.`,
    systemPrompt_ar: `أنت مساعد مبيعات وخدمة عملاء ودود.
كن متحمساً ولكن ليس ملحاً. استمع بنشاط لاحتياجات العميل.
قدم الحلول بشكل استباقي. استخدم اسم العميل عند الاقتضاء.`,
    voiceProfiles: {
      en: { male: 'josh', female: 'jessica' },
      ar: { male: 'ahmed', female: 'layla' }
    },
    voiceSettings: { stability: 0.55, speed: 1.0, similarity: 0.75 }
  },
  {
    domain: 'finance',
    displayName: 'Finance & Banking',
    displayName_ar: 'المالية والمصرفية',
    systemPrompt: `You are a financial services assistant. Speak with authority and precision.
Always verify identity before discussing account details.
Explain financial terms clearly. Be transparent about fees and processes.
For sensitive matters, ensure caller privacy and confidentiality.`,
    systemPrompt_ar: `أنت مساعد خدمات مالية. تحدث بسلطة ودقة.
تحقق دائماً من الهوية قبل مناقشة تفاصيل الحساب.
اشرح المصطلحات المالية بوضوح. كن شفافاً بشأن الرسوم والعمليات.`,
    voiceProfiles: {
      en: { male: 'eric', female: 'charlotte' },
      ar: { male: 'fares', female: 'fatima' }
    },
    voiceSettings: { stability: 0.80, speed: 0.95, similarity: 0.85 }
  },
  {
    domain: 'real_estate',
    displayName: 'Real Estate',
    displayName_ar: 'العقارات',
    systemPrompt: `You are a real estate assistant. Be enthusiastic about properties.
Ask about preferences: location, size, budget, timeline.
Highlight key features and benefits. Schedule viewings efficiently.
For Arabic speakers, understand family-oriented requirements common in Gulf culture.`,
    systemPrompt_ar: `أنت مساعد عقاري. كن متحمساً بشأن العقارات.
اسأل عن التفضيلات: الموقع، الحجم، الميزانية، الجدول الزمني.
أبرز الميزات والفوائد الرئيسية. جدول المعاينات بكفاءة.`,
    voiceProfiles: {
      en: { male: 'josh', female: 'jessica' },
      ar: { male: 'ahmed', female: 'layla' }
    },
    voiceSettings: { stability: 0.60, speed: 1.0, similarity: 0.75 }
  },
  {
    domain: 'education',
    displayName: 'Education & Training',
    displayName_ar: 'التعليم والتدريب',
    systemPrompt: `You are an education assistant. Speak clearly and patiently.
Encourage questions and never make callers feel rushed.
Explain concepts step by step. Celebrate small wins and progress.
Adapt your pace to the learner's level of understanding.`,
    systemPrompt_ar: `أنت مساعد تعليمي. تحدث بوضوح وصبر.
شجع الأسئلة ولا تجعل المتصلين يشعرون بالاستعجال أبداً.
اشرح المفاهيم خطوة بخطوة. احتفِ بالانتصارات الصغيرة والتقدم.`,
    voiceProfiles: {
      en: { male: 'brian', female: 'sarah' },
      ar: { male: 'fares', female: 'maryam' }
    },
    voiceSettings: { stability: 0.65, speed: 0.9, similarity: 0.80 }
  },
  {
    domain: 'hospitality',
    displayName: 'Hospitality & Travel',
    displayName_ar: 'الضيافة والسفر',
    systemPrompt: `You are a hospitality assistant. Be warm and welcoming.
Anticipate guest needs. Offer personalized recommendations.
Handle special requests graciously. Always thank callers for choosing us.
For Arabic speakers, use traditional hospitality phrases.`,
    systemPrompt_ar: `أنت مساعد ضيافة. كن دافئاً ومرحباً.
توقع احتياجات الضيوف. قدم توصيات شخصية.
تعامل مع الطلبات الخاصة بلطف. اشكر المتصلين دائماً على اختيارهم لنا.`,
    voiceProfiles: {
      en: { male: 'josh', female: 'sarah' },
      ar: { male: 'ahmed', female: 'layla' }
    },
    voiceSettings: { stability: 0.55, speed: 1.0, similarity: 0.75 }
  },
  {
    domain: 'business',
    displayName: 'General Business / SME',
    displayName_ar: 'الأعمال العامة / الشركات الصغيرة',
    systemPrompt: `You are a professional business assistant for {{company_name}}.
Be helpful and efficient. Understand the caller's needs quickly.
Provide clear, actionable information. Offer to transfer to specialist if needed.
Maintain a professional but friendly demeanor throughout the call.`,
    systemPrompt_ar: `أنت مساعد أعمال محترف لـ {{company_name}}.
كن مفيداً وفعالاً. افهم احتياجات المتصل بسرعة.
قدم معلومات واضحة وقابلة للتنفيذ. اعرض التحويل لمتخصص إذا لزم الأمر.`,
    voiceProfiles: {
      en: { male: 'eric', female: 'charlotte' },
      ar: { male: 'fares', female: 'fatima' }
    },
    voiceSettings: { stability: 0.70, speed: 1.0, similarity: 0.80 }
  },
]

// ============================================================================
// Service Class
// ============================================================================

class ElevenLabsVoiceServiceClass {
  private agentId: string

  constructor() {
    // ElevenLabs agent ID for Nexus Voice Assistant
    this.agentId = 'agent_5301kghx4yw7ef0rywjv84dybgeg'
  }

  // --------------------------------------------------------------------------
  // Voice Profile Methods
  // --------------------------------------------------------------------------

  /**
   * Get all available voice profiles
   */
  getAvailableVoices(): VoiceProfile[] {
    return VOICE_PROFILES
  }

  /**
   * Get voices filtered by language and/or domain
   */
  getVoicesByFilter(options: {
    language?: 'en' | 'ar'
    domain?: string
    gender?: 'male' | 'female'
  }): VoiceProfile[] {
    let voices = [...VOICE_PROFILES]

    if (options.language) {
      voices = voices.filter(v => v.language === options.language)
    }

    if (options.domain) {
      voices = voices.filter(v => v.domains.includes(options.domain))
    }

    if (options.gender) {
      voices = voices.filter(v => v.gender === options.gender)
    }

    return voices
  }

  /**
   * Get a specific voice profile by ID
   */
  getVoiceById(voiceId: string): VoiceProfile | undefined {
    return VOICE_PROFILES.find(v => v.id === voiceId)
  }

  // --------------------------------------------------------------------------
  // Domain Configuration Methods
  // --------------------------------------------------------------------------

  /**
   * Get all domain configurations
   */
  getDomainConfigs(): DomainConfig[] {
    return DOMAIN_CONFIGS
  }

  /**
   * Get a specific domain configuration
   */
  getDomainConfig(domain: string): DomainConfig | undefined {
    return DOMAIN_CONFIGS.find(d => d.domain === domain)
  }

  // --------------------------------------------------------------------------
  // Voice Recommendation Methods
  // --------------------------------------------------------------------------

  /**
   * Get recommended voice for a user based on their preferences and context
   */
  getRecommendedVoice(preferences: UserVoicePreferences): {
    englishVoice: VoiceProfile
    arabicVoice: VoiceProfile
    settings: { stability: number; speed: number; similarity: number }
    systemPrompt: { en: string; ar: string }
  } {
    // Get domain configuration
    const domainConfig = this.getDomainConfig(preferences.domain) ||
                         this.getDomainConfig('business')!

    // Determine gender preference
    const genderPref = preferences.preferredGender === 'no_preference'
      ? 'male'  // Default to male if no preference
      : preferences.preferredGender

    // Get voice IDs from domain config or custom preferences
    const enVoiceId = preferences.voiceIdEn ||
                      domainConfig.voiceProfiles.en[genderPref]
    const arVoiceId = preferences.voiceIdAr ||
                      domainConfig.voiceProfiles.ar[genderPref]

    // Get voice profiles
    const englishVoice = this.getVoiceById(enVoiceId) ||
                         this.getVoiceById('eric')!
    const arabicVoice = this.getVoiceById(arVoiceId) ||
                        this.getVoiceById('fares')!

    // Merge settings (custom overrides domain defaults)
    const settings = {
      stability: preferences.customSettings?.stability ?? domainConfig.voiceSettings.stability,
      speed: preferences.customSettings?.speed ?? domainConfig.voiceSettings.speed,
      similarity: preferences.customSettings?.similarity ?? domainConfig.voiceSettings.similarity,
    }

    return {
      englishVoice,
      arabicVoice,
      settings,
      systemPrompt: {
        en: domainConfig.systemPrompt,
        ar: domainConfig.systemPrompt_ar,
      }
    }
  }

  // --------------------------------------------------------------------------
  // Voice Call Configuration
  // --------------------------------------------------------------------------

  /**
   * Build complete voice call configuration for a workflow execution
   */
  buildVoiceCallConfig(
    preferences: UserVoicePreferences,
    workflowConfig?: WorkflowVoiceConfig,
    context?: { companyName?: string; callerName?: string }
  ): VoiceCallConfig {
    const recommendation = this.getRecommendedVoice(preferences)

    // Determine language
    const language = workflowConfig?.language || preferences.language || 'auto'

    // Select voice based on language
    const voice = language === 'ar'
      ? recommendation.arabicVoice
      : recommendation.englishVoice

    // Get system prompt and replace variables
    let systemPrompt = language === 'ar'
      ? recommendation.systemPrompt.ar
      : recommendation.systemPrompt.en

    // Replace template variables
    if (context?.companyName) {
      systemPrompt = systemPrompt.replace(/\{\{company_name\}\}/g, context.companyName)
    }

    // Append custom prompt if provided
    if (workflowConfig?.customPrompt) {
      systemPrompt += `\n\nAdditional Instructions:\n${workflowConfig.customPrompt}`
    }

    // Merge settings (workflow-specific overrides user preferences)
    const settings = {
      stability: workflowConfig?.settings?.stability ?? recommendation.settings.stability,
      speed: workflowConfig?.settings?.speed ?? recommendation.settings.speed,
      similarity: workflowConfig?.settings?.similarity ?? recommendation.settings.similarity,
    }

    return {
      agentId: this.agentId,
      voiceId: workflowConfig?.voiceId || voice.id,
      language: language === 'auto' ? 'en' : language, // Default to English for auto
      systemPrompt,
      settings,
    }
  }

  // --------------------------------------------------------------------------
  // Language Detection
  // --------------------------------------------------------------------------

  /**
   * Detect language from text (simple pattern matching)
   */
  detectLanguage(text: string): 'en' | 'ar' {
    // Arabic Unicode range pattern
    const arabicPattern = /[\u0600-\u06FF]/
    return arabicPattern.test(text) ? 'ar' : 'en'
  }

  /**
   * Check if text contains mixed languages
   */
  isBilingual(text: string): boolean {
    const arabicPattern = /[\u0600-\u06FF]/
    const latinPattern = /[a-zA-Z]/
    return arabicPattern.test(text) && latinPattern.test(text)
  }

  // --------------------------------------------------------------------------
  // API Integration (ElevenLabs)
  // --------------------------------------------------------------------------

  /**
   * Update ElevenLabs agent configuration
   * Note: This requires ElevenLabs API key in environment
   */
  async updateAgentConfig(config: {
    voiceId?: string
    language?: string
    systemPrompt?: string
  }): Promise<{ success: boolean; error?: string }> {
    const apiKey = process.env.ELEVENLABS_API_KEY

    if (!apiKey) {
      console.warn('[ElevenLabsVoiceService] No API key configured, skipping agent update')
      return { success: true } // Silent pass for now
    }

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/agents/${this.agentId}`,
        {
          method: 'PATCH',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversation_config: {
              agent: {
                prompt: config.systemPrompt ? {
                  prompt: config.systemPrompt,
                } : undefined,
              },
              tts: config.voiceId ? {
                voice_id: config.voiceId,
              } : undefined,
            },
          }),
        }
      )

      if (!response.ok) {
        const error = await response.text()
        console.error('[ElevenLabsVoiceService] Agent update failed:', error)
        return { success: false, error }
      }

      return { success: true }
    } catch (error) {
      console.error('[ElevenLabsVoiceService] Agent update error:', error)
      return { success: false, error: String(error) }
    }
  }

  /**
   * Generate a signed URL for initiating a voice call
   */
  async getSignedCallUrl(): Promise<{ url?: string; error?: string }> {
    const apiKey = process.env.ELEVENLABS_API_KEY

    if (!apiKey) {
      return { error: 'ElevenLabs API key not configured' }
    }

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${this.agentId}`,
        {
          method: 'GET',
          headers: {
            'xi-api-key': apiKey,
          },
        }
      )

      if (!response.ok) {
        const error = await response.text()
        return { error }
      }

      const data = await response.json()
      return { url: data.signed_url }
    } catch (error) {
      return { error: String(error) }
    }
  }
}

// Export singleton instance
export const ElevenLabsVoiceService = new ElevenLabsVoiceServiceClass()

// Export types
export type {
  VoiceProfile,
  DomainConfig,
  UserVoicePreferences,
  WorkflowVoiceConfig,
  VoiceCallConfig,
}
