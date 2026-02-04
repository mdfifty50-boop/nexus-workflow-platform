/**
 * VoiceConfigService
 *
 * Client-side service for managing voice configuration.
 * Communicates with the /api/voice endpoints.
 */

// ============================================================================
// Types
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

export interface DomainOption {
  id: string
  name: string
  name_ar: string
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

export interface VoiceRecommendation {
  englishVoice: VoiceProfile
  arabicVoice: VoiceProfile
  settings: {
    stability: number
    speed: number
    similarity: number
  }
}

export interface UserVoiceConfig {
  preferences: UserVoicePreferences
  recommendation: VoiceRecommendation
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

// ============================================================================
// API Functions
// ============================================================================

const API_BASE = '/api/voice'

/**
 * Fetch all available voice profiles
 */
export async function getVoiceProfiles(): Promise<VoiceProfile[]> {
  const response = await fetch(`${API_BASE}/profiles`)
  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch voice profiles')
  }

  return data.profiles
}

/**
 * Fetch voice profiles filtered by criteria
 */
export async function getFilteredVoiceProfiles(options: {
  language?: 'en' | 'ar'
  domain?: string
  gender?: 'male' | 'female'
}): Promise<VoiceProfile[]> {
  const params = new URLSearchParams()
  if (options.language) params.append('language', options.language)
  if (options.domain) params.append('domain', options.domain)
  if (options.gender) params.append('gender', options.gender)

  const response = await fetch(`${API_BASE}/profiles/filter?${params}`)
  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch filtered voice profiles')
  }

  return data.profiles
}

/**
 * Fetch all domain configurations
 */
export async function getDomains(): Promise<DomainOption[]> {
  const response = await fetch(`${API_BASE}/domains`)
  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch domains')
  }

  return data.domains
}

/**
 * Get user's voice configuration
 */
export async function getUserVoiceConfig(): Promise<UserVoiceConfig> {
  const response = await fetch(`${API_BASE}/config`)
  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch voice configuration')
  }

  return data.config
}

/**
 * Save user's voice configuration
 */
export async function saveUserVoiceConfig(
  preferences: Partial<UserVoicePreferences>
): Promise<UserVoiceConfig> {
  const response = await fetch(`${API_BASE}/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferences),
  })
  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Failed to save voice configuration')
  }

  return data.config
}

/**
 * Get workflow-specific voice configuration
 */
export async function getWorkflowVoiceConfig(
  workflowId: string
): Promise<{ voiceConfig: VoiceRecommendation & { workflowOverrides: WorkflowVoiceConfig | null } }> {
  const response = await fetch(`${API_BASE}/workflow/${workflowId}`)
  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch workflow voice configuration')
  }

  return { voiceConfig: data.voiceConfig }
}

/**
 * Save workflow-specific voice configuration
 */
export async function saveWorkflowVoiceConfig(
  config: WorkflowVoiceConfig
): Promise<WorkflowVoiceConfig> {
  const response = await fetch(`${API_BASE}/workflow/${config.workflowId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })
  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Failed to save workflow voice configuration')
  }

  return data.config
}

/**
 * Detect language from text
 */
export async function detectLanguage(
  text: string
): Promise<{ language: 'en' | 'ar'; isBilingual: boolean }> {
  const response = await fetch(`${API_BASE}/detect-language`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Failed to detect language')
  }

  return { language: data.language, isBilingual: data.isBilingual }
}

/**
 * Preview a voice (placeholder - returns voice info)
 */
export async function previewVoice(
  voiceId: string,
  text: string,
  language?: 'en' | 'ar'
): Promise<{ voice: VoiceProfile; message: string }> {
  const response = await fetch(`${API_BASE}/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voiceId, text, language }),
  })
  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Failed to generate voice preview')
  }

  return { voice: data.voice, message: data.message }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get display name for a domain
 */
export function getDomainDisplayName(domain: string, locale: 'en' | 'ar' = 'en'): string {
  const domainNames: Record<string, { en: string; ar: string }> = {
    legal: { en: 'Legal', ar: 'القانوني' },
    healthcare: { en: 'Healthcare', ar: 'الرعاية الصحية' },
    sales: { en: 'Sales & Customer Service', ar: 'المبيعات وخدمة العملاء' },
    finance: { en: 'Finance & Banking', ar: 'المالية والمصرفية' },
    real_estate: { en: 'Real Estate', ar: 'العقارات' },
    education: { en: 'Education & Training', ar: 'التعليم والتدريب' },
    hospitality: { en: 'Hospitality & Travel', ar: 'الضيافة والسفر' },
    business: { en: 'General Business', ar: 'الأعمال العامة' },
  }

  return domainNames[domain]?.[locale] || domain
}

/**
 * Get language display name
 */
export function getLanguageDisplayName(lang: 'en' | 'ar' | 'auto'): string {
  const names: Record<string, string> = {
    en: 'English',
    ar: 'Arabic (Gulf)',
    auto: 'Auto-detect',
  }
  return names[lang] || lang
}

/**
 * Get gender display name
 */
export function getGenderDisplayName(gender: 'male' | 'female' | 'no_preference'): string {
  const names: Record<string, string> = {
    male: 'Male Voice',
    female: 'Female Voice',
    no_preference: 'No Preference',
  }
  return names[gender] || gender
}

// ============================================================================
// Voice Config Service Singleton
// ============================================================================

class VoiceConfigServiceClass {
  private cachedDomains: DomainOption[] | null = null
  private cachedProfiles: VoiceProfile[] | null = null
  private userConfig: UserVoiceConfig | null = null

  /**
   * Initialize service and load data
   */
  async initialize(): Promise<void> {
    await Promise.all([
      this.loadDomains(),
      this.loadProfiles(),
      this.loadUserConfig(),
    ])
  }

  /**
   * Load and cache domains
   */
  async loadDomains(): Promise<DomainOption[]> {
    if (this.cachedDomains) return this.cachedDomains
    this.cachedDomains = await getDomains()
    return this.cachedDomains
  }

  /**
   * Load and cache voice profiles
   */
  async loadProfiles(): Promise<VoiceProfile[]> {
    if (this.cachedProfiles) return this.cachedProfiles
    this.cachedProfiles = await getVoiceProfiles()
    return this.cachedProfiles
  }

  /**
   * Load user's voice configuration
   */
  async loadUserConfig(): Promise<UserVoiceConfig> {
    this.userConfig = await getUserVoiceConfig()
    return this.userConfig
  }

  /**
   * Get current user config (from cache)
   */
  getUserConfig(): UserVoiceConfig | null {
    return this.userConfig
  }

  /**
   * Save user preferences and refresh cache
   */
  async savePreferences(preferences: Partial<UserVoicePreferences>): Promise<UserVoiceConfig> {
    this.userConfig = await saveUserVoiceConfig(preferences)
    return this.userConfig
  }

  /**
   * Get domains (from cache)
   */
  getDomains(): DomainOption[] {
    return this.cachedDomains || []
  }

  /**
   * Get voice profiles (from cache)
   */
  getProfiles(): VoiceProfile[] {
    return this.cachedProfiles || []
  }

  /**
   * Get profiles for a specific domain
   */
  getProfilesForDomain(domain: string): VoiceProfile[] {
    return (this.cachedProfiles || []).filter(p => p.domains.includes(domain))
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cachedDomains = null
    this.cachedProfiles = null
    this.userConfig = null
  }
}

export const VoiceConfigService = new VoiceConfigServiceClass()

// Export all types and functions
export default VoiceConfigService
