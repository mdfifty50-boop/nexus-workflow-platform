/**
 * WhatsApp Composio Webhook Routes
 *
 * Handles WhatsApp Business API webhooks via Composio integration.
 * Connects incoming messages to Nexus AI for intelligent responses.
 *
 * Endpoints:
 * - GET /api/whatsapp-composio/webhook - Meta webhook verification
 * - POST /api/whatsapp-composio/webhook - Receive incoming messages
 * - GET /api/whatsapp-composio/status - Get connection status
 * - POST /api/whatsapp-composio/connect - Initiate OAuth connection
 * - POST /api/whatsapp-composio/send - Send message (direct API)
 * - POST /api/whatsapp-composio/template - Send template message
 */

import { Router, Request, Response } from 'express'
import crypto from 'crypto'
import {
  whatsAppComposioService,
  IncomingMessageWebhook,
  MessageValue,
} from '../services/WhatsAppComposioService.js'
import { getAgent, routeToAgent } from '../agents/index.js'
import { callClaudeWithCaching } from '../services/claudeProxy.js'
import VoiceNoteHandler from '../services/VoiceNoteHandler.js'

// @NEXUS-FIX-083: Initialize voice note handler for WhatsApp audio processing
VoiceNoteHandler.initialize().then(ready => {
  console.log('[WhatsApp Webhook] Voice note handler:', ready ? 'ready' : 'demo mode')
})

// @NEXUS-FIX-084: Voice response preferences per user
// In production, this should be stored in a database
const voiceResponsePreferences = new Map<string, {
  enabled: boolean
  language: 'ar' | 'en' | 'auto'
}>()

/**
 * Check if voice responses are enabled for a user
 */
function isVoiceResponseEnabled(phone: string): boolean {
  const prefs = voiceResponsePreferences.get(phone)
  return prefs?.enabled ?? false
}

/**
 * Get preferred language for voice responses
 */
function getVoiceResponseLanguage(phone: string, detectedLang: string): 'ar' | 'en' {
  const prefs = voiceResponsePreferences.get(phone)
  if (prefs?.language === 'auto') {
    return detectedLang.startsWith('ar') ? 'ar' : 'en'
  }
  return prefs?.language || 'en'
}

const router = Router()

// =============================================================================
// @NEXUS-FIX-080: WhatsApp Workflow Creation State Management
// =============================================================================

interface WorkflowStep {
  id: string
  name: string
  tool: string
  type: 'trigger' | 'action'
  config?: Record<string, unknown>
}

interface PendingWorkflow {
  workflowSpec: {
    name: string
    description: string
    steps: WorkflowStep[]
    requiredIntegrations: string[]
    estimatedTimeSaved?: string
  }
  createdAt: number
  contactName?: string
}

// In-memory store for pending workflows (keyed by phone number)
// In production, this should be persisted to a database
const pendingWorkflows = new Map<string, PendingWorkflow>()

// Confirmation keywords in English and Arabic
const CONFIRM_KEYWORDS = [
  'yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'confirm', 'create', 'create it', 'do it', 'go ahead', 'proceed',
  'نعم', 'اي', 'ايوا', 'تمام', 'اوكي', 'موافق', 'انشئ', 'انشئها', 'سوها', 'يلا'
]

const CANCEL_KEYWORDS = [
  'no', 'nope', 'cancel', 'stop', 'nevermind', 'forget it',
  'لا', 'الغي', 'الغاء', 'لغي', 'وقف', 'خلاص'
]

const MODIFY_KEYWORDS = [
  'change', 'modify', 'edit', 'update', 'different', 'instead',
  'غير', 'عدل', 'بدل', 'تعديل'
]

/**
 * Check if user is confirming a pending workflow
 */
function isConfirmation(text: string): boolean {
  const lower = text.toLowerCase().trim()
  return CONFIRM_KEYWORDS.some(kw => lower === kw || lower.startsWith(kw + ' '))
}

/**
 * Check if user is cancelling a pending workflow
 */
function isCancellation(text: string): boolean {
  const lower = text.toLowerCase().trim()
  return CANCEL_KEYWORDS.some(kw => lower === kw || lower.startsWith(kw + ' '))
}

/**
 * Check if user wants to modify a pending workflow
 */
function isModification(text: string): boolean {
  const lower = text.toLowerCase().trim()
  return MODIFY_KEYWORDS.some(kw => lower.includes(kw))
}

/**
 * Format workflow preview for WhatsApp
 */
function formatWorkflowForWhatsApp(workflow: PendingWorkflow['workflowSpec'], lang: 'en' | 'ar' = 'en'): string {
  if (lang === 'ar') {
    let preview = `🔄 *${workflow.name}*\n\n`
    preview += `${workflow.description}\n\n`
    preview += `📋 *الخطوات:*\n`

    workflow.steps.forEach((step, i) => {
      const icon = step.type === 'trigger' ? '⚡' : '▶️'
      preview += `${i + 1}. ${icon} ${step.name} (${step.tool})\n`
    })

    preview += `\n🔗 *التطبيقات المطلوبة:* ${workflow.requiredIntegrations.join(', ')}\n`

    if (workflow.estimatedTimeSaved) {
      preview += `⏱️ *الوقت الموفر:* ${workflow.estimatedTimeSaved}\n`
    }

    preview += `\n✅ رد *نعم* لإنشاء الworkflow`
    preview += `\n❌ رد *لا* للإلغاء`
    preview += `\n✏️ أو اكتب تعديلاتك`

    return preview
  }

  // English (default)
  let preview = `🔄 *${workflow.name}*\n\n`
  preview += `${workflow.description}\n\n`
  preview += `📋 *Steps:*\n`

  workflow.steps.forEach((step, i) => {
    const icon = step.type === 'trigger' ? '⚡' : '▶️'
    preview += `${i + 1}. ${icon} ${step.name} (${step.tool})\n`
  })

  preview += `\n🔗 *Required apps:* ${workflow.requiredIntegrations.join(', ')}\n`

  if (workflow.estimatedTimeSaved) {
    preview += `⏱️ *Time saved:* ${workflow.estimatedTimeSaved}\n`
  }

  preview += `\n✅ Reply *Yes* to create this workflow`
  preview += `\n❌ Reply *No* to cancel`
  preview += `\n✏️ Or describe what you'd like to change`

  return preview
}

/**
 * Detect language from text (simple heuristic)
 */
function detectLanguage(text: string): 'en' | 'ar' {
  // Check for Arabic characters
  const arabicPattern = /[\u0600-\u06FF]/
  return arabicPattern.test(text) ? 'ar' : 'en'
}

/**
 * Parse AI response for workflow intent
 */
function parseAIResponse(responseText: string): {
  message: string
  shouldGenerateWorkflow: boolean
  workflowSpec?: PendingWorkflow['workflowSpec']
} {
  try {
    // Try to parse as JSON
    const parsed = JSON.parse(responseText)
    return {
      message: parsed.message || responseText,
      shouldGenerateWorkflow: parsed.shouldGenerateWorkflow === true,
      workflowSpec: parsed.workflowSpec
    }
  } catch {
    // Not JSON, return as plain message
    return {
      message: responseText,
      shouldGenerateWorkflow: false
    }
  }
}

// Environment variables
const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'nexus-whatsapp-composio-verify'
const WEBHOOK_SECRET = process.env.WHATSAPP_WEBHOOK_SECRET || ''

/**
 * Verify webhook signature from Meta
 */
function verifySignature(payload: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn('[WhatsApp Webhook] No WEBHOOK_SECRET configured, skipping signature verification')
    return true
  }

  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex')

  return `sha256=${expectedSignature}` === signature
}

/**
 * Process incoming message through Nexus AI
 * Returns structured response with optional workflow spec
 */
async function processMessageWithNexus(
  from: string,
  messageText: string,
  contactName?: string
): Promise<{
  text: string
  workflowSpec?: PendingWorkflow['workflowSpec']
}> {
  try {
    // Get the Nexus agent
    const nexusAgent = getAgent('nexus')
    if (!nexusAgent) {
      console.error('[WhatsApp Webhook] Nexus agent not found')
      return { text: "I'm having trouble processing your request. Please try again." }
    }

    // Build conversation for Claude
    const messages = [
      {
        role: 'user' as const,
        content: messageText,
      },
    ]

    // Add WhatsApp-specific system context
    // @NEXUS-FIX-079: WhatsApp context injection for optimized responses
    const whatsappContext = `
## WhatsApp Context - ACTIVE
- Platform: "whatsapp" (USE WHATSAPP RESPONSE MODE)
- User phone: ${from}
- User name: ${contactName || 'Unknown'}

**CRITICAL WHATSAPP RULES:**
1. MAX 4096 characters - aim for 200-500 chars (mobile-friendly)
2. NO markdown links - plain text only
3. Detect language and respond in SAME language
4. If Arabic input → respond in Arabic (Gulf dialect)
5. If English input → respond in English
6. Use emojis sparingly (1-3 max)
7. Use *bold* and _italic_ only for formatting

**IMPORTANT: For workflow requests, STILL return valid JSON with workflowSpec.**
The WhatsApp handler will format the workflow preview appropriately.

**Response must be CONCISE and ACTIONABLE.**
`

    // Call Claude with the Nexus personality
    // Use systemBlocks format (array of text blocks) as expected by callClaudeWithCaching
    const systemBlocks = [{ type: 'text' as const, text: nexusAgent.personality + whatsappContext }]

    const response = await callClaudeWithCaching({
      systemBlocks,
      messages,
      model: 'claude-sonnet-4-20250514',
      maxTokens: 1024, // Shorter for WhatsApp
    })

    console.log('[WhatsApp Webhook] Claude response received:', {
      hasText: !!response.text,
      textLength: response.text?.length || 0,
      tokensUsed: response.tokensUsed,
      preview: response.text?.substring(0, 100)
    })

    // Extract text response - callClaudeWithCaching returns { text: string, ... }
    if (response.text) {
      const rawText = response.text

      // Try to parse as JSON workflow response
      const parsed = parseAIResponse(rawText)

      if (parsed.shouldGenerateWorkflow && parsed.workflowSpec) {
        // Return workflow spec for preview
        return {
          text: parsed.message,
          workflowSpec: parsed.workflowSpec
        }
      }

      // Plain text response - ensure it fits WhatsApp limits
      let text = parsed.message
      if (text.length > 4096) {
        text = text.substring(0, 4090) + '...'
      }
      return { text }
    }

    return { text: "I received your message but couldn't generate a response. Please try again." }
  } catch (error) {
    console.error('[WhatsApp Webhook] Error processing with Nexus:', error)
    return { text: "I'm experiencing technical difficulties. Please try again in a moment." }
  }
}

/**
 * Execute a confirmed workflow
 */
async function executeWorkflow(
  from: string,
  workflow: PendingWorkflow['workflowSpec'],
  lang: 'en' | 'ar'
): Promise<string> {
  // TODO: Integrate with actual workflow execution service
  // For now, return a confirmation message
  console.log(`[WhatsApp Webhook] Executing workflow "${workflow.name}" for ${from}`)

  if (lang === 'ar') {
    return `✅ *تم إنشاء الworkflow!*\n\n` +
      `📛 *الاسم:* ${workflow.name}\n` +
      `📋 *الخطوات:* ${workflow.steps.length}\n` +
      `🔗 *التطبيقات:* ${workflow.requiredIntegrations.join(', ')}\n\n` +
      `سيتم تنفيذ الworkflow تلقائياً عند تفعيل المشغل.\n` +
      `أرسل لي رسالة إذا احتجت أي شيء آخر! 🚀`
  }

  return `✅ *Workflow Created!*\n\n` +
    `📛 *Name:* ${workflow.name}\n` +
    `📋 *Steps:* ${workflow.steps.length}\n` +
    `🔗 *Apps:* ${workflow.requiredIntegrations.join(', ')}\n\n` +
    `Your workflow will run automatically when the trigger fires.\n` +
    `Message me if you need anything else! 🚀`
}

/**
 * Handle incoming WhatsApp message
 */
async function handleIncomingMessage(messageValue: MessageValue): Promise<void> {
  if (!messageValue.messages || messageValue.messages.length === 0) {
    return
  }

  for (const message of messageValue.messages) {
    const from = message.from
    const contactName = messageValue.contacts?.[0]?.profile?.name

    console.log(`[WhatsApp Webhook] Incoming message from ${from} (${contactName || 'Unknown'})`)

    // Handle different message types
    let messageText = ''

    switch (message.type) {
      case 'text':
        messageText = message.text?.body || ''
        break

      case 'interactive':
        // Handle button/list replies
        if (message.interactive?.button_reply) {
          messageText = `Selected: ${message.interactive.button_reply.title}`
        } else if (message.interactive?.list_reply) {
          messageText = `Selected: ${message.interactive.list_reply.title}`
        }
        break

      case 'button':
        // Quick reply button
        messageText = 'Button pressed'
        break

      case 'audio':
        // @NEXUS-FIX-083: Voice note transcription via Deepgram
        if (message.audio?.id) {
          console.log(`[WhatsApp Webhook] Processing voice note from ${from}`)

          const voiceResult = await VoiceNoteHandler.processVoiceNote(
            message.audio.id,
            message.audio.mime_type || 'audio/ogg',
            'auto' // Auto-detect Arabic or English
          )

          if (voiceResult.success && voiceResult.transcription) {
            console.log(`[WhatsApp Webhook] Voice note transcribed:`, {
              language: voiceResult.language,
              confidence: voiceResult.confidence,
              processingTimeMs: voiceResult.processingTimeMs,
              preview: voiceResult.transcription.substring(0, 50)
            })
            messageText = voiceResult.transcription
          } else {
            console.error(`[WhatsApp Webhook] Voice note transcription failed:`, voiceResult.error)
            messageText = `[Voice Note] - Sorry, I couldn't transcribe your voice message. ${voiceResult.error || 'Please try again or send a text message.'}`
          }
        } else {
          messageText = `[Voice Note] - I received your voice message but couldn't access the audio. Please try again.`
        }
        break

      case 'image':
      case 'document':
      case 'video':
        // For other media messages, acknowledge but explain limitations
        messageText = `[User sent ${message.type}] - I received your ${message.type}, but I can only process text and voice messages at the moment. Please describe what you need in text or send a voice note.`
        break

      default:
        console.log(`[WhatsApp Webhook] Unhandled message type: ${message.type}`)
        return
    }

    if (!messageText) {
      return
    }

    const lang = detectLanguage(messageText)
    let responseText: string

    // Check if user has a pending workflow
    const pendingWorkflow = pendingWorkflows.get(from)

    if (pendingWorkflow) {
      // User has a pending workflow - check for confirmation/cancellation/modification
      if (isConfirmation(messageText)) {
        // User confirmed - execute the workflow
        console.log(`[WhatsApp Webhook] User ${from} confirmed workflow: ${pendingWorkflow.workflowSpec.name}`)
        responseText = await executeWorkflow(from, pendingWorkflow.workflowSpec, lang)
        pendingWorkflows.delete(from)
      } else if (isCancellation(messageText)) {
        // User cancelled
        console.log(`[WhatsApp Webhook] User ${from} cancelled workflow: ${pendingWorkflow.workflowSpec.name}`)
        pendingWorkflows.delete(from)
        responseText = lang === 'ar'
          ? '❌ تم إلغاء الworkflow. أخبرني إذا تريد إنشاء شيء آخر!'
          : '❌ Workflow cancelled. Let me know if you want to create something else!'
      } else if (isModification(messageText)) {
        // User wants to modify - pass the modification request with context
        console.log(`[WhatsApp Webhook] User ${from} wants to modify workflow`)
        const modifyContext = `User has a pending workflow "${pendingWorkflow.workflowSpec.name}" and wants to modify it. Their request: ${messageText}`
        const response = await processMessageWithNexus(from, modifyContext, contactName)

        if (response.workflowSpec) {
          // Store updated workflow
          pendingWorkflows.set(from, {
            workflowSpec: response.workflowSpec,
            createdAt: Date.now(),
            contactName
          })
          responseText = formatWorkflowForWhatsApp(response.workflowSpec, lang)
        } else {
          responseText = response.text
        }
      } else {
        // Treat as a new request - clear pending and process
        console.log(`[WhatsApp Webhook] User ${from} sent new request, clearing pending workflow`)
        pendingWorkflows.delete(from)

        const response = await processMessageWithNexus(from, messageText, contactName)

        if (response.workflowSpec) {
          // Store new pending workflow
          pendingWorkflows.set(from, {
            workflowSpec: response.workflowSpec,
            createdAt: Date.now(),
            contactName
          })
          responseText = formatWorkflowForWhatsApp(response.workflowSpec, lang)
        } else {
          responseText = response.text
        }
      }
    } else {
      // No pending workflow - process normally
      const response = await processMessageWithNexus(from, messageText, contactName)

      if (response.workflowSpec) {
        // Store as pending workflow
        pendingWorkflows.set(from, {
          workflowSpec: response.workflowSpec,
          createdAt: Date.now(),
          contactName
        })
        // Send workflow preview
        responseText = formatWorkflowForWhatsApp(response.workflowSpec, lang)
        console.log(`[WhatsApp Webhook] Created pending workflow for ${from}: ${response.workflowSpec.name}`)
      } else {
        responseText = response.text
      }
    }

    // Send response back to user
    const result = await whatsAppComposioService.sendMessage({
      to: from,
      text: responseText,
    })

    if (!result.success) {
      console.error(`[WhatsApp Webhook] Failed to send response: ${result.error}`)

      // If session window is closed, try with a fallback template
      if (result.error?.includes('Session window expired')) {
        console.log('[WhatsApp Webhook] Session window expired, cannot send template without template setup')
        // In production, you would send a template message here
      }
    } else {
      console.log(`[WhatsApp Webhook] Response sent successfully: ${result.messageId}`)

      // @NEXUS-FIX-084: Optionally send voice response if enabled
      if (isVoiceResponseEnabled(from) && responseText.length < 500) {
        try {
          const voiceLang = getVoiceResponseLanguage(from, lang)
          const voiceResult = await VoiceNoteHandler.generateVoiceResponse(responseText, voiceLang)

          if (voiceResult.success && voiceResult.audioUrl) {
            const audioResult = await whatsAppComposioService.sendMedia({
              to: from,
              mediaUrl: voiceResult.audioUrl,
              mediaType: 'audio',
              caption: voiceLang === 'ar' ? '🎙️ رسالة صوتية' : '🎙️ Voice message',
            })

            if (audioResult.success) {
              console.log(`[WhatsApp Webhook] Voice response sent: ${audioResult.messageId}`)
            }
          }
        } catch (error) {
          console.warn('[WhatsApp Webhook] Voice response failed:', error)
          // Non-critical - text message was already sent
        }
      }
    }
  }
}

// =============================================================================
// ROUTES
// =============================================================================

/**
 * GET /api/whatsapp-composio/webhook
 * Webhook verification (required by Meta)
 */
router.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  console.log('[WhatsApp Webhook] Verification request:', { mode, token: token ? '***' : undefined })

  if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
    console.log('[WhatsApp Webhook] Verification successful')
    res.status(200).send(challenge)
  } else {
    console.warn('[WhatsApp Webhook] Verification failed - invalid token')
    res.status(403).send('Verification failed')
  }
})

/**
 * POST /api/whatsapp-composio/webhook
 * Receive incoming messages and status updates
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    // Verify signature if secret is configured
    const signature = req.headers['x-hub-signature-256'] as string
    const rawBody = JSON.stringify(req.body)

    if (WEBHOOK_SECRET && !verifySignature(rawBody, signature)) {
      console.warn('[WhatsApp Webhook] Invalid signature')
      return res.status(401).json({ success: false, error: 'Invalid signature' })
    }

    const payload = req.body as IncomingMessageWebhook

    // Process webhook through our service (updates session windows, etc.)
    await whatsAppComposioService.handleWebhook(payload)

    // Process messages for AI response
    if (payload.object === 'whatsapp_business_account') {
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            const messageValue = change.value as MessageValue

            // Handle incoming messages (async, don't block webhook response)
            if (messageValue.messages && messageValue.messages.length > 0) {
              // Process in background
              handleIncomingMessage(messageValue).catch((error) => {
                console.error('[WhatsApp Webhook] Background processing error:', error)
              })
            }

            // Log status updates
            if (messageValue.statuses) {
              for (const status of messageValue.statuses) {
                console.log(`[WhatsApp Webhook] Message ${status.id}: ${status.status}`)
              }
            }
          }
        }
      }
    }

    // Always respond 200 to acknowledge receipt (Meta requirement)
    res.status(200).json({ success: true })
  } catch (error: unknown) {
    console.error('[WhatsApp Webhook] Processing error:', error)
    // Still return 200 to prevent Meta from retrying
    res.status(200).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
  }
})

/**
 * GET /api/whatsapp-composio/status
 * Get current connection status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await whatsAppComposioService.checkConnection()

    res.json({
      success: true,
      ...status,
    })
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * POST /api/whatsapp-composio/connect
 * Initiate OAuth connection via Composio
 */
router.post('/connect', async (req: Request, res: Response) => {
  try {
    const { redirectUrl } = req.body

    // Check if already connected
    const status = await whatsAppComposioService.checkConnection()
    if (status.connected) {
      return res.json({
        success: true,
        alreadyConnected: true,
        account: {
          businessName: status.businessName,
          phoneNumberId: status.phoneNumberId,
        },
      })
    }

    // Initiate OAuth
    const result = await whatsAppComposioService.initiateConnection(redirectUrl)

    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error,
      })
    }

    res.json({
      success: true,
      authUrl: result.authUrl,
      instructions: [
        'Open the auth URL to connect your WhatsApp Business account',
        'Complete the Meta Business verification if required',
        'Once connected, you can send and receive messages',
      ],
    })
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * POST /api/whatsapp-composio/send
 * Send a direct message (within 24-hour window)
 */
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { to, text, previewUrl } = req.body

    if (!to || !text) {
      return res.status(400).json({
        success: false,
        error: 'to and text are required',
      })
    }

    const result = await whatsAppComposioService.sendMessage({
      to,
      text,
      previewUrl,
    })

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      })
    }

    res.json({
      success: true,
      messageId: result.messageId,
      timestamp: result.timestamp,
    })
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * POST /api/whatsapp-composio/template
 * Send a template message (outside 24-hour window)
 */
router.post('/template', async (req: Request, res: Response) => {
  try {
    const { to, templateName, language, components } = req.body

    if (!to || !templateName) {
      return res.status(400).json({
        success: false,
        error: 'to and templateName are required',
      })
    }

    const result = await whatsAppComposioService.sendTemplate({
      to,
      templateName,
      language,
      components,
    })

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      })
    }

    res.json({
      success: true,
      messageId: result.messageId,
      timestamp: result.timestamp,
    })
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * POST /api/whatsapp-composio/buttons
 * Send interactive buttons
 */
router.post('/buttons', async (req: Request, res: Response) => {
  try {
    const { to, bodyText, buttons, headerText, footerText } = req.body

    if (!to || !bodyText || !buttons) {
      return res.status(400).json({
        success: false,
        error: 'to, bodyText, and buttons are required',
      })
    }

    const result = await whatsAppComposioService.sendButtons({
      to,
      bodyText,
      buttons,
      headerText,
      footerText,
    })

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      })
    }

    res.json({
      success: true,
      messageId: result.messageId,
      timestamp: result.timestamp,
    })
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * POST /api/whatsapp-composio/list
 * Send interactive list menu
 */
router.post('/list', async (req: Request, res: Response) => {
  try {
    const { to, bodyText, buttonText, sections, headerText, footerText } = req.body

    if (!to || !bodyText || !buttonText || !sections) {
      return res.status(400).json({
        success: false,
        error: 'to, bodyText, buttonText, and sections are required',
      })
    }

    const result = await whatsAppComposioService.sendList({
      to,
      bodyText,
      buttonText,
      sections,
      headerText,
      footerText,
    })

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      })
    }

    res.json({
      success: true,
      messageId: result.messageId,
      timestamp: result.timestamp,
    })
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * GET /api/whatsapp-composio/templates
 * Get available message templates
 */
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const templates = await whatsAppComposioService.getTemplates()

    res.json({
      success: true,
      templates,
      count: templates.length,
    })
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * GET /api/whatsapp-composio/session/:phone
 * Get session window status for a phone number
 */
router.get('/session/:phone', (req: Request, res: Response) => {
  try {
    const { phone } = req.params
    const window = whatsAppComposioService.getConversationWindow(phone)

    res.json({
      success: true,
      ...window,
    })
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * GET /api/whatsapp-composio/pending/:phone
 * Check if user has a pending workflow
 */
router.get('/pending/:phone', (req: Request, res: Response) => {
  try {
    const { phone } = req.params
    const pending = pendingWorkflows.get(phone)

    if (pending) {
      res.json({
        success: true,
        hasPending: true,
        workflow: pending.workflowSpec,
        createdAt: pending.createdAt,
        contactName: pending.contactName
      })
    } else {
      res.json({
        success: true,
        hasPending: false
      })
    }
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * DELETE /api/whatsapp-composio/pending/:phone
 * Clear pending workflow for a user
 */
router.delete('/pending/:phone', (req: Request, res: Response) => {
  try {
    const { phone } = req.params
    const had = pendingWorkflows.has(phone)
    pendingWorkflows.delete(phone)

    res.json({
      success: true,
      cleared: had
    })
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * GET /api/whatsapp-composio/voice-prefs/:phone
 * Get voice response preferences for a user
 * @NEXUS-FIX-084: Voice response preferences
 */
router.get('/voice-prefs/:phone', (req: Request, res: Response) => {
  try {
    const { phone } = req.params
    const prefs = voiceResponsePreferences.get(phone)

    res.json({
      success: true,
      phone,
      voiceResponse: {
        enabled: prefs?.enabled ?? false,
        language: prefs?.language ?? 'auto',
      },
    })
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * POST /api/whatsapp-composio/voice-prefs/:phone
 * Set voice response preferences for a user
 * @NEXUS-FIX-084: Voice response preferences
 *
 * Body: { enabled: boolean, language?: 'ar' | 'en' | 'auto' }
 */
router.post('/voice-prefs/:phone', (req: Request, res: Response) => {
  try {
    const { phone } = req.params
    const { enabled, language } = req.body

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'enabled must be a boolean',
      })
    }

    const validLanguages = ['ar', 'en', 'auto']
    const lang = language && validLanguages.includes(language) ? language : 'auto'

    voiceResponsePreferences.set(phone, {
      enabled,
      language: lang as 'ar' | 'en' | 'auto',
    })

    console.log(`[WhatsApp Webhook] Voice preferences updated for ${phone}:`, { enabled, language: lang })

    res.json({
      success: true,
      phone,
      voiceResponse: {
        enabled,
        language: lang,
      },
      message: enabled
        ? (lang === 'ar' ? 'Voice responses enabled (Arabic)' : lang === 'en' ? 'Voice responses enabled (English)' : 'Voice responses enabled (auto-detect)')
        : 'Voice responses disabled',
    })
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * DELETE /api/whatsapp-composio/voice-prefs/:phone
 * Disable and remove voice response preferences for a user
 */
router.delete('/voice-prefs/:phone', (req: Request, res: Response) => {
  try {
    const { phone } = req.params
    const had = voiceResponsePreferences.has(phone)
    voiceResponsePreferences.delete(phone)

    res.json({
      success: true,
      removed: had,
    })
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * Cleanup expired pending workflows (older than 1 hour)
 * Runs every 10 minutes
 */
const PENDING_WORKFLOW_TTL = 60 * 60 * 1000 // 1 hour
setInterval(() => {
  const now = Date.now()
  let cleaned = 0

  for (const [phone, pending] of pendingWorkflows) {
    if (now - pending.createdAt > PENDING_WORKFLOW_TTL) {
      pendingWorkflows.delete(phone)
      cleaned++
    }
  }

  if (cleaned > 0) {
    console.log(`[WhatsApp Webhook] Cleaned up ${cleaned} expired pending workflows`)
  }
}, 10 * 60 * 1000) // Run every 10 minutes

export default router
