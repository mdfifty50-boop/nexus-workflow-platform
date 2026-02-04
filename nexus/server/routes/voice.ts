/**
 * Voice Configuration API Routes
 *
 * Endpoints for managing user voice preferences and workflow-specific voice settings.
 */

import { Router, Request, Response } from 'express'
import {
  ElevenLabsVoiceService,
  type UserVoicePreferences,
  type WorkflowVoiceConfig,
} from '../services/ElevenLabsVoiceService'

const router = Router()

// ============================================================================
// Voice Profile Endpoints
// ============================================================================

/**
 * GET /api/voice/profiles
 * List all available voice profiles
 */
router.get('/profiles', (_req: Request, res: Response) => {
  try {
    const profiles = ElevenLabsVoiceService.getAvailableVoices()
    res.json({
      success: true,
      profiles,
      count: profiles.length,
    })
  } catch (error) {
    console.error('[Voice API] Error fetching profiles:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch voice profiles',
    })
  }
})

/**
 * GET /api/voice/profiles/filter
 * Get voices filtered by language, domain, or gender
 */
router.get('/profiles/filter', (req: Request, res: Response) => {
  try {
    const { language, domain, gender } = req.query

    const profiles = ElevenLabsVoiceService.getVoicesByFilter({
      language: language as 'en' | 'ar' | undefined,
      domain: domain as string | undefined,
      gender: gender as 'male' | 'female' | undefined,
    })

    res.json({
      success: true,
      profiles,
      count: profiles.length,
      filters: { language, domain, gender },
    })
  } catch (error) {
    console.error('[Voice API] Error filtering profiles:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to filter voice profiles',
    })
  }
})

// ============================================================================
// Domain Configuration Endpoints
// ============================================================================

/**
 * GET /api/voice/domains
 * List all domain configurations
 */
router.get('/domains', (_req: Request, res: Response) => {
  try {
    const domains = ElevenLabsVoiceService.getDomainConfigs()

    // Return simplified domain list for UI
    const domainList = domains.map(d => ({
      id: d.domain,
      name: d.displayName,
      name_ar: d.displayName_ar,
      voiceSettings: d.voiceSettings,
    }))

    res.json({
      success: true,
      domains: domainList,
      count: domainList.length,
    })
  } catch (error) {
    console.error('[Voice API] Error fetching domains:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch domain configurations',
    })
  }
})

/**
 * GET /api/voice/domains/:domain
 * Get a specific domain configuration with full details
 */
router.get('/domains/:domain', (req: Request, res: Response) => {
  try {
    const { domain } = req.params
    const config = ElevenLabsVoiceService.getDomainConfig(domain)

    if (!config) {
      return res.status(404).json({
        success: false,
        error: `Domain "${domain}" not found`,
      })
    }

    res.json({
      success: true,
      domain: config,
    })
  } catch (error) {
    console.error('[Voice API] Error fetching domain config:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch domain configuration',
    })
  }
})

// ============================================================================
// User Preferences Endpoints
// ============================================================================

/**
 * GET /api/voice/config
 * Get user's voice configuration
 * TODO: Integrate with actual user authentication
 */
router.get('/config', (req: Request, res: Response) => {
  try {
    // For now, return default configuration
    // TODO: Fetch from database using authenticated user ID
    const userId = req.headers['x-user-id'] as string || 'default'

    // Default preferences
    const preferences: UserVoicePreferences = {
      userId,
      domain: 'business',
      language: 'auto',
      preferredGender: 'no_preference',
    }

    // Get recommended voices based on preferences
    const recommendation = ElevenLabsVoiceService.getRecommendedVoice(preferences)

    res.json({
      success: true,
      config: {
        preferences,
        recommendation: {
          englishVoice: recommendation.englishVoice,
          arabicVoice: recommendation.arabicVoice,
          settings: recommendation.settings,
        },
      },
    })
  } catch (error) {
    console.error('[Voice API] Error fetching user config:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch voice configuration',
    })
  }
})

/**
 * POST /api/voice/config
 * Save user's voice configuration
 */
router.post('/config', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'default'
    const {
      domain,
      language,
      preferredGender,
      voiceIdEn,
      voiceIdAr,
      customSettings,
    } = req.body

    // Validate domain
    if (domain && !ElevenLabsVoiceService.getDomainConfig(domain)) {
      return res.status(400).json({
        success: false,
        error: `Invalid domain: ${domain}`,
      })
    }

    // Validate voice IDs
    if (voiceIdEn && !ElevenLabsVoiceService.getVoiceById(voiceIdEn)) {
      return res.status(400).json({
        success: false,
        error: `Invalid English voice ID: ${voiceIdEn}`,
      })
    }
    if (voiceIdAr && !ElevenLabsVoiceService.getVoiceById(voiceIdAr)) {
      return res.status(400).json({
        success: false,
        error: `Invalid Arabic voice ID: ${voiceIdAr}`,
      })
    }

    // Build preferences object
    const preferences: UserVoicePreferences = {
      userId,
      domain: domain || 'business',
      language: language || 'auto',
      preferredGender: preferredGender || 'no_preference',
      voiceIdEn,
      voiceIdAr,
      customSettings,
    }

    // TODO: Save to database
    // await saveUserVoicePreferences(preferences)

    // Get updated recommendation
    const recommendation = ElevenLabsVoiceService.getRecommendedVoice(preferences)

    res.json({
      success: true,
      message: 'Voice configuration saved',
      config: {
        preferences,
        recommendation: {
          englishVoice: recommendation.englishVoice,
          arabicVoice: recommendation.arabicVoice,
          settings: recommendation.settings,
        },
      },
    })
  } catch (error) {
    console.error('[Voice API] Error saving user config:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to save voice configuration',
    })
  }
})

// ============================================================================
// Workflow Voice Settings Endpoints
// ============================================================================

/**
 * GET /api/voice/workflow/:workflowId
 * Get voice configuration for a specific workflow
 */
router.get('/workflow/:workflowId', (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params
    const userId = req.headers['x-user-id'] as string || 'default'

    // TODO: Fetch workflow-specific config from database
    // For now, return user's default config
    const preferences: UserVoicePreferences = {
      userId,
      domain: 'business',
      language: 'auto',
      preferredGender: 'no_preference',
    }

    const recommendation = ElevenLabsVoiceService.getRecommendedVoice(preferences)

    res.json({
      success: true,
      workflowId,
      voiceConfig: {
        ...recommendation,
        workflowOverrides: null, // No overrides yet
      },
    })
  } catch (error) {
    console.error('[Voice API] Error fetching workflow config:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workflow voice configuration',
    })
  }
})

/**
 * POST /api/voice/workflow/:workflowId
 * Save voice configuration for a specific workflow
 */
router.post('/workflow/:workflowId', async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params
    const {
      nodeId,
      voiceId,
      language,
      tone,
      customPrompt,
      settings,
    } = req.body

    // Build workflow config
    const workflowConfig: WorkflowVoiceConfig = {
      workflowId,
      nodeId,
      voiceId,
      language,
      tone,
      customPrompt,
      settings,
    }

    // TODO: Save to database
    // await saveWorkflowVoiceConfig(workflowConfig)

    res.json({
      success: true,
      message: 'Workflow voice configuration saved',
      config: workflowConfig,
    })
  } catch (error) {
    console.error('[Voice API] Error saving workflow config:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to save workflow voice configuration',
    })
  }
})

// ============================================================================
// Voice Call Endpoints
// ============================================================================

/**
 * POST /api/voice/call/config
 * Build complete voice call configuration for execution
 */
router.post('/call/config', async (req: Request, res: Response) => {
  try {
    const {
      preferences,
      workflowConfig,
      context,
    } = req.body

    // Validate preferences
    if (!preferences || !preferences.domain) {
      return res.status(400).json({
        success: false,
        error: 'User preferences required',
      })
    }

    // Build voice call configuration
    const callConfig = ElevenLabsVoiceService.buildVoiceCallConfig(
      preferences,
      workflowConfig,
      context
    )

    res.json({
      success: true,
      callConfig,
    })
  } catch (error) {
    console.error('[Voice API] Error building call config:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to build voice call configuration',
    })
  }
})

/**
 * GET /api/voice/call/url
 * Get signed URL for initiating a voice call
 */
router.get('/call/url', async (_req: Request, res: Response) => {
  try {
    const result = await ElevenLabsVoiceService.getSignedCallUrl()

    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error,
      })
    }

    res.json({
      success: true,
      url: result.url,
    })
  } catch (error) {
    console.error('[Voice API] Error getting call URL:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get voice call URL',
    })
  }
})

// ============================================================================
// Language Detection Endpoint
// ============================================================================

/**
 * POST /api/voice/detect-language
 * Detect language from text
 */
router.post('/detect-language', (req: Request, res: Response) => {
  try {
    const { text } = req.body

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required',
      })
    }

    const language = ElevenLabsVoiceService.detectLanguage(text)
    const isBilingual = ElevenLabsVoiceService.isBilingual(text)

    res.json({
      success: true,
      language,
      isBilingual,
    })
  } catch (error) {
    console.error('[Voice API] Error detecting language:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to detect language',
    })
  }
})

// ============================================================================
// Voice Preview Endpoint
// ============================================================================

/**
 * POST /api/voice/preview
 * Generate voice preview audio (placeholder - requires ElevenLabs TTS API)
 */
router.post('/preview', async (req: Request, res: Response) => {
  try {
    const { voiceId, text, language } = req.body

    if (!voiceId || !text) {
      return res.status(400).json({
        success: false,
        error: 'Voice ID and text are required',
      })
    }

    // Get voice profile
    const voice = ElevenLabsVoiceService.getVoiceById(voiceId)
    if (!voice) {
      return res.status(404).json({
        success: false,
        error: `Voice "${voiceId}" not found`,
      })
    }

    // TODO: Implement actual TTS preview using ElevenLabs TTS API
    // For now, return voice info without audio
    res.json({
      success: true,
      voice: {
        id: voice.id,
        name: voice.name,
        language: voice.language,
        characteristics: voice.characteristics,
      },
      message: 'Voice preview not yet implemented. Use ElevenLabs dashboard to test voices.',
      previewText: text,
      previewLanguage: language || voice.language,
    })
  } catch (error) {
    console.error('[Voice API] Error generating preview:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate voice preview',
    })
  }
})

export default router
