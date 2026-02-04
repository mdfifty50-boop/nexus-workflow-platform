/**
 * WhatsAppComposioService - WhatsApp Business API via Composio
 *
 * This service provides WhatsApp Business API integration through Composio:
 * - Send text messages (session window)
 * - Send template messages (marketing/utility)
 * - Send interactive buttons and lists
 * - Send media (images, documents, audio, video)
 * - Handle incoming webhooks
 * - Manage message templates
 *
 * @see docs/integrations/whatsapp-composio-spec.md for full specification
 *
 * IMPORTANT: WhatsApp Business has a 24-hour messaging window rule:
 * - Within 24h of customer message: Free-form messages allowed
 * - After 24h: Must use pre-approved templates (charged per message)
 */

import { composioService, ToolExecutionResult } from './ComposioService'

// =============================================================================
// TYPES
// =============================================================================

export interface WhatsAppMessageResult {
  success: boolean
  messageId?: string
  timestamp?: string
  error?: string
  raw?: unknown
}

export interface WhatsAppConnectionStatus {
  connected: boolean
  phoneNumberId?: string
  businessName?: string
  accountId?: string
  tier?: 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4'
}

export interface SendMessageParams {
  to: string                    // Recipient phone (E.164: +96550123456)
  text: string                  // Message body (max 4096 chars)
  previewUrl?: boolean          // Show link previews
}

export interface SendTemplateParams {
  to: string                    // Recipient phone
  templateName: string          // Pre-approved template name
  language?: string             // Language code (default: 'en')
  components?: TemplateComponent[]
}

export interface TemplateComponent {
  type: 'header' | 'body' | 'button'
  parameters: TemplateParameter[]
}

export interface TemplateParameter {
  type: 'text' | 'image' | 'document' | 'video'
  text?: string
  image?: { link: string }
  document?: { link: string; filename: string }
  video?: { link: string }
}

export interface SendButtonsParams {
  to: string
  bodyText: string
  buttons: Array<{
    id: string
    title: string   // Max 20 chars
  }>
  headerText?: string
  footerText?: string
}

export interface SendListParams {
  to: string
  bodyText: string
  buttonText: string           // Menu button text
  sections: Array<{
    title: string
    rows: Array<{
      id: string
      title: string            // Max 24 chars
      description?: string
    }>
  }>
  headerText?: string
  footerText?: string
}

export interface SendMediaParams {
  to: string
  mediaUrl: string
  mediaType: 'image' | 'document' | 'audio' | 'video'
  caption?: string
  filename?: string            // Required for documents
}

export interface IncomingMessageWebhook {
  object: 'whatsapp_business_account'
  entry: Array<{
    id: string
    changes: Array<{
      field: 'messages' | 'message_template_status_update'
      value: MessageValue | TemplateStatusValue
    }>
  }>
}

export interface MessageValue {
  messaging_product: 'whatsapp'
  metadata: {
    display_phone_number: string
    phone_number_id: string
  }
  contacts?: Array<{
    profile: { name: string }
    wa_id: string
  }>
  messages?: Array<{
    from: string
    id: string
    timestamp: string
    type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'interactive' | 'button'
    text?: { body: string }
    image?: { id: string; mime_type: string; sha256: string }
    document?: { id: string; mime_type: string; sha256: string; filename: string }
    audio?: { id: string; mime_type: string; sha256: string }  // @NEXUS-FIX-083: Voice note support
    video?: { id: string; mime_type: string; sha256: string }
    interactive?: {
      type: 'button_reply' | 'list_reply'
      button_reply?: { id: string; title: string }
      list_reply?: { id: string; title: string; description: string }
    }
  }>
  statuses?: Array<{
    id: string
    status: 'sent' | 'delivered' | 'read' | 'failed'
    timestamp: string
    recipient_id: string
  }>
}

export interface TemplateStatusValue {
  event: 'APPROVED' | 'REJECTED' | 'PENDING'
  message_template_id: string
  message_template_name: string
}

export interface ConversationWindow {
  recipientPhone: string
  lastCustomerMessageAt: Date
  isOpen: boolean              // True if within 24-hour window
  expiresAt: Date
}

// =============================================================================
// CONSTANTS
// =============================================================================

const WHATSAPP_TOOLKIT = 'whatsapp'
const SESSION_WINDOW_MS = 24 * 60 * 60 * 1000  // 24 hours

// Tool slugs from Composio
const TOOL_SLUGS = {
  SEND_MESSAGE: 'WHATSAPP_SEND_MESSAGE',
  SEND_TEMPLATE: 'WHATSAPP_SEND_TEMPLATE_MESSAGE',
  SEND_MEDIA: 'WHATSAPP_SEND_MEDIA',
  SEND_MEDIA_BY_ID: 'WHATSAPP_SEND_MEDIA_BY_ID',
  SEND_REPLY: 'WHATSAPP_SEND_REPLY',
  SEND_BUTTONS: 'WHATSAPP_SEND_INTERACTIVE_BUTTONS',
  SEND_LIST: 'WHATSAPP_SEND_INTERACTIVE_LIST',
  SEND_LOCATION: 'WHATSAPP_SEND_LOCATION',
  SEND_CONTACTS: 'WHATSAPP_SEND_CONTACTS',
  CREATE_TEMPLATE: 'WHATSAPP_CREATE_MESSAGE_TEMPLATE',
  DELETE_TEMPLATE: 'WHATSAPP_DELETE_MESSAGE_TEMPLATE',
  GET_TEMPLATES: 'WHATSAPP_GET_MESSAGE_TEMPLATES',
  GET_TEMPLATE_STATUS: 'WHATSAPP_GET_TEMPLATE_STATUS',
  GET_BUSINESS_PROFILE: 'WHATSAPP_GET_BUSINESS_PROFILE',
  GET_PHONE_NUMBER: 'WHATSAPP_GET_PHONE_NUMBER',
  GET_PHONE_NUMBERS: 'WHATSAPP_GET_PHONE_NUMBERS',
  GET_MEDIA: 'WHATSAPP_GET_MEDIA',
  GET_MEDIA_INFO: 'WHATSAPP_GET_MEDIA_INFO',
  UPLOAD_MEDIA: 'WHATSAPP_UPLOAD_MEDIA',
}

// Pre-built template names for Nexus workflows
export const NEXUS_TEMPLATES = {
  // Lawyer templates
  SIGNATURE_REMINDER: 'nexus_signature_reminder',
  COURT_REMINDER: 'nexus_court_reminder',
  DOCUMENT_READY: 'nexus_document_ready',
  PAYMENT_REMINDER_LEGAL: 'nexus_payment_reminder_legal',

  // Doctor templates
  APPOINTMENT_CONFIRM: 'nexus_appointment_confirm',
  APPOINTMENT_REMINDER: 'nexus_appointment_reminder',
  LAB_RESULTS_READY: 'nexus_lab_results_ready',
  PRESCRIPTION_READY: 'nexus_prescription_ready',

  // SME templates
  INVOICE_SENT: 'nexus_invoice_sent',
  PAYMENT_REMINDER: 'nexus_payment_reminder',
  ORDER_CONFIRMATION: 'nexus_order_confirmation',
  SHIPPING_UPDATE: 'nexus_shipping_update',
}

// =============================================================================
// SERVICE CLASS
// =============================================================================

class WhatsAppComposioServiceClass {
  private phoneNumberId: string | null = null
  private conversationWindows: Map<string, ConversationWindow> = new Map()
  private messageCallbacks: Array<(message: MessageValue) => void> = []

  // ===========================================================================
  // CONNECTION MANAGEMENT
  // ===========================================================================

  /**
   * Check if WhatsApp Business is connected via Composio
   */
  async checkConnection(): Promise<WhatsAppConnectionStatus> {
    const status = await composioService.checkConnection(WHATSAPP_TOOLKIT)

    if (!status.connected) {
      return { connected: false }
    }

    // Get business profile for additional info
    try {
      const profile = await this.getBusinessProfile()
      return {
        connected: true,
        accountId: status.accountId,
        businessName: profile?.name,
        phoneNumberId: this.phoneNumberId || undefined,
      }
    } catch {
      return {
        connected: true,
        accountId: status.accountId,
      }
    }
  }

  /**
   * Initiate WhatsApp Business OAuth connection
   */
  async initiateConnection(redirectUrl?: string): Promise<{ authUrl?: string; error?: string }> {
    return composioService.initiateConnection(WHATSAPP_TOOLKIT, redirectUrl)
  }

  /**
   * Get business profile information
   */
  async getBusinessProfile(): Promise<{ name?: string; description?: string; address?: string } | null> {
    const result = await composioService.executeTool(TOOL_SLUGS.GET_BUSINESS_PROFILE, {})

    if (!result.success) {
      console.error('[WhatsAppComposioService] Failed to get business profile:', result.error)
      return null
    }

    return result.data as { name?: string; description?: string; address?: string }
  }

  // ===========================================================================
  // MESSAGING - SESSION (Free-form within 24-hour window)
  // ===========================================================================

  /**
   * Send a text message (requires active session window)
   *
   * @param params.to - Recipient phone in E.164 format (+96550123456)
   * @param params.text - Message body (max 4096 characters)
   */
  async sendMessage(params: SendMessageParams): Promise<WhatsAppMessageResult> {
    // Check session window
    const window = this.getConversationWindow(params.to)
    if (!window.isOpen) {
      return {
        success: false,
        error: 'Session window expired. Use sendTemplate() for messages outside the 24-hour window.',
      }
    }

    // Validate message length
    if (params.text.length > 4096) {
      console.warn('[WhatsAppComposioService] Message truncated to 4096 characters')
      params.text = params.text.substring(0, 4096)
    }

    const result = await composioService.executeTool(TOOL_SLUGS.SEND_MESSAGE, {
      to: this.normalizePhoneNumber(params.to),
      text: params.text,
      preview_url: params.previewUrl ?? true,
    })

    return this.formatMessageResult(result)
  }

  /**
   * Send interactive buttons (max 3 buttons)
   */
  async sendButtons(params: SendButtonsParams): Promise<WhatsAppMessageResult> {
    // Validate button count
    if (params.buttons.length > 3) {
      return {
        success: false,
        error: 'Maximum 3 buttons allowed. Use sendList() for more options.',
      }
    }

    // Validate button titles
    for (const btn of params.buttons) {
      if (btn.title.length > 20) {
        return {
          success: false,
          error: `Button title "${btn.title}" exceeds 20 character limit.`,
        }
      }
    }

    const result = await composioService.executeTool(TOOL_SLUGS.SEND_BUTTONS, {
      to: this.normalizePhoneNumber(params.to),
      interactive: {
        type: 'button',
        header: params.headerText ? { type: 'text', text: params.headerText } : undefined,
        body: { text: params.bodyText },
        footer: params.footerText ? { text: params.footerText } : undefined,
        action: {
          buttons: params.buttons.map(btn => ({
            type: 'reply',
            reply: { id: btn.id, title: btn.title },
          })),
        },
      },
    })

    return this.formatMessageResult(result)
  }

  /**
   * Send interactive list menu (max 10 sections, 10 rows each)
   */
  async sendList(params: SendListParams): Promise<WhatsAppMessageResult> {
    // Validate sections
    if (params.sections.length > 10) {
      return {
        success: false,
        error: 'Maximum 10 sections allowed in a list.',
      }
    }

    for (const section of params.sections) {
      if (section.rows.length > 10) {
        return {
          success: false,
          error: `Section "${section.title}" exceeds 10 row limit.`,
        }
      }
      for (const row of section.rows) {
        if (row.title.length > 24) {
          return {
            success: false,
            error: `Row title "${row.title}" exceeds 24 character limit.`,
          }
        }
      }
    }

    const result = await composioService.executeTool(TOOL_SLUGS.SEND_LIST, {
      to: this.normalizePhoneNumber(params.to),
      interactive: {
        type: 'list',
        header: params.headerText ? { type: 'text', text: params.headerText } : undefined,
        body: { text: params.bodyText },
        footer: params.footerText ? { text: params.footerText } : undefined,
        action: {
          button: params.buttonText,
          sections: params.sections,
        },
      },
    })

    return this.formatMessageResult(result)
  }

  /**
   * Send media (image, document, audio, video)
   */
  async sendMedia(params: SendMediaParams): Promise<WhatsAppMessageResult> {
    const result = await composioService.executeTool(TOOL_SLUGS.SEND_MEDIA, {
      to: this.normalizePhoneNumber(params.to),
      type: params.mediaType,
      [params.mediaType]: {
        link: params.mediaUrl,
        caption: params.caption,
        filename: params.filename,
      },
    })

    return this.formatMessageResult(result)
  }

  // ===========================================================================
  // MESSAGING - TEMPLATES (Required outside 24-hour window)
  // ===========================================================================

  /**
   * Send a template message (required outside 24-hour window, charged per message)
   *
   * @param params.to - Recipient phone in E.164 format
   * @param params.templateName - Pre-approved template name
   * @param params.language - Language code (default: 'en')
   * @param params.components - Template variable values
   */
  async sendTemplate(params: SendTemplateParams): Promise<WhatsAppMessageResult> {
    const result = await composioService.executeTool(TOOL_SLUGS.SEND_TEMPLATE, {
      to: this.normalizePhoneNumber(params.to),
      template: {
        name: params.templateName,
        language: { code: params.language || 'en' },
        components: params.components,
      },
    })

    return this.formatMessageResult(result)
  }

  /**
   * Send a Nexus pre-built template (convenience method)
   */
  async sendNexusTemplate(
    templateKey: keyof typeof NEXUS_TEMPLATES,
    to: string,
    variables: Record<string, string>,
    language: string = 'en'
  ): Promise<WhatsAppMessageResult> {
    const templateName = NEXUS_TEMPLATES[templateKey]

    // Convert variables to template components
    const components: TemplateComponent[] = [
      {
        type: 'body',
        parameters: Object.entries(variables).map(([, value]) => ({
          type: 'text' as const,
          text: value,
        })),
      },
    ]

    return this.sendTemplate({
      to,
      templateName,
      language,
      components,
    })
  }

  // ===========================================================================
  // TEMPLATE MANAGEMENT
  // ===========================================================================

  /**
   * List all message templates
   */
  async getTemplates(): Promise<Array<{
    name: string
    status: string
    category: string
    language: string
  }>> {
    const result = await composioService.executeTool(TOOL_SLUGS.GET_TEMPLATES, {})

    if (!result.success) {
      console.error('[WhatsAppComposioService] Failed to get templates:', result.error)
      return []
    }

    const data = result.data as { data?: Array<Record<string, unknown>> }
    return (data?.data || []).map((t) => ({
      name: t.name as string,
      status: t.status as string,
      category: t.category as string,
      language: t.language as string,
    }))
  }

  /**
   * Check template approval status
   */
  async getTemplateStatus(templateName: string): Promise<{
    status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'UNKNOWN'
    reason?: string
  }> {
    const result = await composioService.executeTool(TOOL_SLUGS.GET_TEMPLATE_STATUS, {
      name: templateName,
    })

    if (!result.success) {
      return { status: 'UNKNOWN' }
    }

    const data = result.data as { status?: string; rejected_reason?: string }
    return {
      status: (data?.status as 'APPROVED' | 'PENDING' | 'REJECTED') || 'UNKNOWN',
      reason: data?.rejected_reason,
    }
  }

  // ===========================================================================
  // WEBHOOK HANDLING
  // ===========================================================================

  /**
   * Process incoming webhook from WhatsApp
   */
  async handleWebhook(payload: IncomingMessageWebhook): Promise<void> {
    if (payload.object !== 'whatsapp_business_account') {
      console.warn('[WhatsAppComposioService] Unknown webhook object:', payload.object)
      return
    }

    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.field === 'messages') {
          await this.handleMessageWebhook(change.value as MessageValue)
        } else if (change.field === 'message_template_status_update') {
          await this.handleTemplateStatusWebhook(change.value as TemplateStatusValue)
        }
      }
    }
  }

  /**
   * Handle incoming message webhook
   */
  private async handleMessageWebhook(value: MessageValue): Promise<void> {
    // Store phone number ID for future use
    if (value.metadata?.phone_number_id) {
      this.phoneNumberId = value.metadata.phone_number_id
    }

    // Process incoming messages
    if (value.messages) {
      for (const message of value.messages) {
        // Update conversation window - customer initiated message opens 24h window
        this.updateConversationWindow(message.from)

        console.log(`[WhatsAppComposioService] Incoming message from ${message.from}:`, {
          type: message.type,
          text: message.text?.body?.substring(0, 50),
        })

        // Notify registered callbacks
        for (const callback of this.messageCallbacks) {
          try {
            callback(value)
          } catch (error) {
            console.error('[WhatsAppComposioService] Callback error:', error)
          }
        }
      }
    }

    // Process status updates
    if (value.statuses) {
      for (const status of value.statuses) {
        console.log(`[WhatsAppComposioService] Message ${status.id} status: ${status.status}`)
      }
    }
  }

  /**
   * Handle template status webhook
   */
  private async handleTemplateStatusWebhook(value: TemplateStatusValue): Promise<void> {
    console.log(`[WhatsAppComposioService] Template ${value.message_template_name} status: ${value.event}`)
  }

  /**
   * Register a callback for incoming messages
   */
  onMessage(callback: (message: MessageValue) => void): void {
    this.messageCallbacks.push(callback)
  }

  /**
   * Remove a message callback
   */
  offMessage(callback: (message: MessageValue) => void): void {
    const index = this.messageCallbacks.indexOf(callback)
    if (index !== -1) {
      this.messageCallbacks.splice(index, 1)
    }
  }

  // ===========================================================================
  // SESSION WINDOW MANAGEMENT
  // ===========================================================================

  /**
   * Get the conversation window status for a recipient
   */
  getConversationWindow(phone: string): ConversationWindow {
    const normalized = this.normalizePhoneNumber(phone)
    const existing = this.conversationWindows.get(normalized)

    if (!existing) {
      return {
        recipientPhone: normalized,
        lastCustomerMessageAt: new Date(0),
        isOpen: false,
        expiresAt: new Date(0),
      }
    }

    // Check if window is still open
    const now = new Date()
    const isOpen = existing.expiresAt > now

    return {
      ...existing,
      isOpen,
    }
  }

  /**
   * Update conversation window when customer sends a message
   */
  private updateConversationWindow(phone: string): void {
    const normalized = this.normalizePhoneNumber(phone)
    const now = new Date()

    this.conversationWindows.set(normalized, {
      recipientPhone: normalized,
      lastCustomerMessageAt: now,
      isOpen: true,
      expiresAt: new Date(now.getTime() + SESSION_WINDOW_MS),
    })
  }

  /**
   * Manually open a session window (e.g., after customer initiates via other channel)
   */
  openSessionWindow(phone: string): void {
    this.updateConversationWindow(phone)
  }

  // ===========================================================================
  // UTILITIES
  // ===========================================================================

  /**
   * Normalize phone number to E.164 format
   */
  private normalizePhoneNumber(phone: string): string {
    // Remove all non-digit characters except leading +
    let normalized = phone.replace(/[^\d+]/g, '')

    // Ensure it starts with +
    if (!normalized.startsWith('+')) {
      // Assume Kuwait if no country code
      if (normalized.length === 8) {
        normalized = '+965' + normalized
      } else if (!normalized.startsWith('00')) {
        normalized = '+' + normalized
      } else {
        normalized = '+' + normalized.substring(2)
      }
    }

    return normalized
  }

  /**
   * Format Composio result to WhatsApp message result
   */
  private formatMessageResult(result: ToolExecutionResult): WhatsAppMessageResult {
    if (!result.success) {
      return {
        success: false,
        error: this.formatError(result.error || 'Unknown error'),
      }
    }

    const data = result.data as { messages?: Array<{ id: string }>; message_id?: string }
    const messageId = data?.messages?.[0]?.id || data?.message_id

    return {
      success: true,
      messageId,
      timestamp: new Date().toISOString(),
      raw: result.data,
    }
  }

  /**
   * Format error message to be user-friendly
   */
  private formatError(error: string): string {
    // Map common WhatsApp API errors to user-friendly messages
    if (error.includes('131047') || error.includes('re-engagement')) {
      return 'This contact needs to message you first before you can send them messages.'
    }
    if (error.includes('131051') || error.includes('window')) {
      return 'The 24-hour messaging window has expired. Please use a template message.'
    }
    if (error.includes('130429') || error.includes('rate')) {
      return 'Too many messages sent. Please wait a moment and try again.'
    }
    if (error.includes('131009') || error.includes('too long')) {
      return 'Message is too long. Maximum 4096 characters allowed.'
    }
    if (error.includes('100') || error.includes('invalid')) {
      return 'Invalid request. Please check the phone number format.'
    }

    return error
  }

  /**
   * Smart send - automatically chooses session or template based on window status
   */
  async smartSend(
    to: string,
    text: string,
    fallbackTemplate?: keyof typeof NEXUS_TEMPLATES,
    templateVariables?: Record<string, string>
  ): Promise<WhatsAppMessageResult> {
    const window = this.getConversationWindow(to)

    if (window.isOpen) {
      // Within 24-hour window - send free-form message
      return this.sendMessage({ to, text })
    } else if (fallbackTemplate && templateVariables) {
      // Window expired - use template
      return this.sendNexusTemplate(fallbackTemplate, to, templateVariables)
    } else {
      // No template provided - cannot send
      return {
        success: false,
        error: 'Session window expired and no fallback template provided.',
      }
    }
  }
}

// =============================================================================
// EXPORT
// =============================================================================

export const whatsAppComposioService = new WhatsAppComposioServiceClass()
export default whatsAppComposioService
