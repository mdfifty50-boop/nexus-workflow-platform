/**
 * DocuSignService - E-Signature Integration via Composio
 *
 * Provides document signing, status tracking, and envelope management
 * for lawyer workflows requiring legal document signatures.
 *
 * @NEXUS-FIX-084: DocuSign service for lawyer signature workflows
 */

import { composioService } from './ComposioService'

// =============================================================================
// TYPES
// =============================================================================

export interface Recipient {
  email: string
  name: string
  role?: 'signer' | 'cc' | 'in_person_signer' | 'certified_delivery'
  routingOrder?: number
}

export interface SignatureTab {
  anchorString?: string
  anchorUnits?: 'pixels' | 'inches' | 'centimeters'
  anchorXOffset?: number
  anchorYOffset?: number
  pageNumber?: number
  xPosition?: number
  yPosition?: number
}

export interface DocumentInfo {
  documentId: string
  name: string
  fileExtension?: string
  documentBase64?: string
  uri?: string
}

export interface EnvelopeRequest {
  documents: DocumentInfo[]
  recipients: Recipient[]
  subject: string
  message?: string
  expirationDays?: number
  reminderEnabled?: boolean
  reminderDelay?: number
  reminderFrequency?: number
}

export interface EnvelopeResult {
  success: boolean
  envelopeId?: string
  status?: EnvelopeStatus
  sentDateTime?: string
  error?: string
}

export type EnvelopeStatus =
  | 'created'
  | 'sent'
  | 'delivered'
  | 'signed'
  | 'completed'
  | 'declined'
  | 'voided'

export interface RecipientStatus {
  recipientId: string
  email: string
  name: string
  status: 'sent' | 'delivered' | 'completed' | 'declined' | 'auto_responded'
  signedDateTime?: string
  deliveredDateTime?: string
}

export interface EnvelopeStatusResult {
  success: boolean
  envelopeId?: string
  status?: EnvelopeStatus
  recipients?: RecipientStatus[]
  sentDateTime?: string
  completedDateTime?: string
  documentsUri?: string
  error?: string
}

export interface DownloadResult {
  success: boolean
  documents?: Array<{
    documentId: string
    name: string
    content?: Buffer
    contentBase64?: string
  }>
  combinedPdfBase64?: string
  error?: string
}

export interface TemplateInfo {
  templateId: string
  name: string
  description?: string
  folderId?: string
  folderName?: string
}

// =============================================================================
// SERVICE
// =============================================================================

class DocuSignServiceClass {
  private initialized: boolean = false

  /**
   * Initialize the DocuSign service
   * Requires Composio to be configured with DocuSign OAuth connection
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if Composio is initialized
      const composioInitialized = await composioService.initialize()
      if (!composioInitialized) {
        console.log('[DocuSignService] Composio not initialized - demo mode')
        return false
      }

      // Check if DocuSign is connected via Composio
      const connection = await composioService.checkConnection('docusign')
      if (!connection.connected) {
        console.log('[DocuSignService] DocuSign not connected via Composio')
        console.log('[DocuSignService] Connect at: https://app.composio.dev/ → Integrations → DocuSign')
        return false
      }

      this.initialized = true
      console.log('[DocuSignService] Initialized via Composio')
      return true
    } catch (error) {
      console.error('[DocuSignService] Initialization error:', error)
      return false
    }
  }

  /**
   * Send a document for signature
   *
   * @param request - The envelope request containing documents and recipients
   */
  async sendForSignature(request: EnvelopeRequest): Promise<EnvelopeResult> {
    if (!this.initialized) {
      console.log('[DocuSignService] Demo mode - simulating signature request')
      return {
        success: true,
        envelopeId: `demo_envelope_${Date.now()}`,
        status: 'sent',
        sentDateTime: new Date().toISOString(),
      }
    }

    try {
      // Create and send envelope via Composio
      const result = await composioService.executeTool('DOCUSIGN_CREATE_ENVELOPE', {
        emailSubject: request.subject,
        emailBlurb: request.message,
        documents: request.documents.map((doc, idx) => ({
          documentId: doc.documentId || String(idx + 1),
          name: doc.name,
          fileExtension: doc.fileExtension || 'pdf',
          documentBase64: doc.documentBase64,
          uri: doc.uri,
        })),
        recipients: {
          signers: request.recipients
            .filter(r => r.role === 'signer' || !r.role)
            .map((r, idx) => ({
              recipientId: String(idx + 1),
              email: r.email,
              name: r.name,
              routingOrder: r.routingOrder || String(idx + 1),
            })),
          carbonCopies: request.recipients
            .filter(r => r.role === 'cc')
            .map((r, idx) => ({
              recipientId: String(100 + idx),
              email: r.email,
              name: r.name,
              routingOrder: r.routingOrder || '99',
            })),
        },
        status: 'sent', // Send immediately
        notification: request.reminderEnabled ? {
          useAccountDefaults: false,
          reminders: {
            reminderEnabled: true,
            reminderDelay: request.reminderDelay || 3,
            reminderFrequency: request.reminderFrequency || 3,
          },
          expirations: {
            expireEnabled: !!request.expirationDays,
            expireAfter: request.expirationDays || 30,
            expireWarn: 3,
          },
        } : undefined,
      })

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to create envelope' }
      }

      const data = result.data as Record<string, unknown>
      return {
        success: true,
        envelopeId: data.envelopeId as string,
        status: (data.status as EnvelopeStatus) || 'sent',
        sentDateTime: data.sentDateTime as string,
      }
    } catch (error) {
      console.error('[DocuSignService] Send for signature error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send for signature',
      }
    }
  }

  /**
   * Get the status of an envelope
   *
   * @param envelopeId - The envelope ID to check
   */
  async getSignatureStatus(envelopeId: string): Promise<EnvelopeStatusResult> {
    if (!this.initialized) {
      console.log('[DocuSignService] Demo mode - simulating status check')
      return {
        success: true,
        envelopeId,
        status: 'sent',
        recipients: [
          {
            recipientId: '1',
            email: 'demo@example.com',
            name: 'Demo Signer',
            status: 'sent',
          },
        ],
        sentDateTime: new Date().toISOString(),
      }
    }

    try {
      const result = await composioService.executeTool('DOCUSIGN_GET_ENVELOPE', {
        envelopeId,
      })

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to get envelope status' }
      }

      const data = result.data as Record<string, unknown>
      const recipients = data.recipients as Record<string, unknown> | undefined
      const signers = recipients?.signers as Array<Record<string, unknown>> | undefined

      return {
        success: true,
        envelopeId: data.envelopeId as string,
        status: data.status as EnvelopeStatus,
        recipients: signers?.map(s => ({
          recipientId: s.recipientId as string,
          email: s.email as string,
          name: s.name as string,
          status: s.status as RecipientStatus['status'],
          signedDateTime: s.signedDateTime as string | undefined,
          deliveredDateTime: s.deliveredDateTime as string | undefined,
        })),
        sentDateTime: data.sentDateTime as string,
        completedDateTime: data.completedDateTime as string | undefined,
        documentsUri: data.documentsUri as string | undefined,
      }
    } catch (error) {
      console.error('[DocuSignService] Get status error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get signature status',
      }
    }
  }

  /**
   * Download signed documents from an envelope
   *
   * @param envelopeId - The envelope ID to download from
   * @param documentId - Specific document ID, or 'combined' for all
   */
  async downloadSignedDocument(
    envelopeId: string,
    documentId: string = 'combined'
  ): Promise<DownloadResult> {
    if (!this.initialized) {
      console.log('[DocuSignService] Demo mode - simulating download')
      return {
        success: true,
        combinedPdfBase64: 'demo_pdf_base64_content',
      }
    }

    try {
      const result = await composioService.executeTool('DOCUSIGN_GET_DOCUMENT', {
        envelopeId,
        documentId,
      })

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to download document' }
      }

      const data = result.data as Record<string, unknown>
      return {
        success: true,
        combinedPdfBase64: data.documentBase64 as string | undefined,
        documents: data.documents as DownloadResult['documents'],
      }
    } catch (error) {
      console.error('[DocuSignService] Download error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to download document',
      }
    }
  }

  /**
   * Void (cancel) an envelope
   *
   * @param envelopeId - The envelope ID to void
   * @param reason - Reason for voiding
   */
  async voidEnvelope(envelopeId: string, reason: string): Promise<EnvelopeResult> {
    if (!this.initialized) {
      console.log('[DocuSignService] Demo mode - simulating void')
      return {
        success: true,
        envelopeId,
        status: 'voided',
      }
    }

    try {
      const result = await composioService.executeTool('DOCUSIGN_UPDATE_ENVELOPE', {
        envelopeId,
        status: 'voided',
        voidedReason: reason,
      })

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to void envelope' }
      }

      return {
        success: true,
        envelopeId,
        status: 'voided',
      }
    } catch (error) {
      console.error('[DocuSignService] Void error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to void envelope',
      }
    }
  }

  /**
   * Send a reminder for an envelope
   *
   * @param envelopeId - The envelope ID to send reminder for
   */
  async sendReminder(envelopeId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.initialized) {
      console.log('[DocuSignService] Demo mode - simulating reminder')
      return { success: true }
    }

    try {
      const result = await composioService.executeTool('DOCUSIGN_RESEND_ENVELOPE', {
        envelopeId,
      })

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to send reminder' }
      }

      return { success: true }
    } catch (error) {
      console.error('[DocuSignService] Reminder error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send reminder',
      }
    }
  }

  /**
   * Get list of templates
   */
  async getTemplates(): Promise<{ success: boolean; templates?: TemplateInfo[]; error?: string }> {
    if (!this.initialized) {
      console.log('[DocuSignService] Demo mode - simulating templates')
      return {
        success: true,
        templates: [
          { templateId: 'demo_1', name: 'Contract Template', description: 'Standard contract' },
          { templateId: 'demo_2', name: 'NDA Template', description: 'Non-disclosure agreement' },
        ],
      }
    }

    try {
      const result = await composioService.executeTool('DOCUSIGN_LIST_TEMPLATES', {})

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to list templates' }
      }

      const data = result.data as Record<string, unknown>
      const templates = data.envelopeTemplates as Array<Record<string, unknown>> | undefined

      return {
        success: true,
        templates: templates?.map(t => ({
          templateId: t.templateId as string,
          name: t.name as string,
          description: t.description as string | undefined,
          folderId: t.folderId as string | undefined,
          folderName: t.folderName as string | undefined,
        })),
      }
    } catch (error) {
      console.error('[DocuSignService] Get templates error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get templates',
      }
    }
  }

  /**
   * Send envelope from template
   *
   * @param templateId - Template ID to use
   * @param recipients - Recipients to fill in
   * @param subject - Email subject
   * @param message - Optional message
   */
  async sendFromTemplate(
    templateId: string,
    recipients: Recipient[],
    subject: string,
    message?: string
  ): Promise<EnvelopeResult> {
    if (!this.initialized) {
      console.log('[DocuSignService] Demo mode - simulating template send')
      return {
        success: true,
        envelopeId: `demo_template_${Date.now()}`,
        status: 'sent',
        sentDateTime: new Date().toISOString(),
      }
    }

    try {
      const result = await composioService.executeTool('DOCUSIGN_CREATE_ENVELOPE_FROM_TEMPLATE', {
        templateId,
        emailSubject: subject,
        emailBlurb: message,
        templateRoles: recipients.map((r, idx) => ({
          roleName: r.role || 'signer',
          email: r.email,
          name: r.name,
          routingOrder: r.routingOrder || String(idx + 1),
        })),
        status: 'sent',
      })

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to create from template' }
      }

      const data = result.data as Record<string, unknown>
      return {
        success: true,
        envelopeId: data.envelopeId as string,
        status: 'sent',
        sentDateTime: data.sentDateTime as string,
      }
    } catch (error) {
      console.error('[DocuSignService] Send from template error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send from template',
      }
    }
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.initialized
  }
}

// =============================================================================
// EXPORT
// =============================================================================

const DocuSignService = new DocuSignServiceClass()
export default DocuSignService
