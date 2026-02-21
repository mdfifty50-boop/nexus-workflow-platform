/**
 * DocuSignService - E-Signature Integration via Composio
 *
 * Provides document signing, status tracking, and envelope management
 * for lawyer workflows requiring legal document signatures.
 *
 * @NEXUS-FIX-084: DocuSign service for lawyer signature workflows
 */
import { composioService } from './ComposioService';
// =============================================================================
// SERVICE
// =============================================================================
class DocuSignServiceClass {
    initialized = false;
    /**
     * Initialize the DocuSign service
     * Requires Composio to be configured with DocuSign OAuth connection
     */
    async initialize() {
        try {
            // Check if Composio is initialized
            const composioInitialized = await composioService.initialize();
            if (!composioInitialized) {
                console.log('[DocuSignService] Composio not initialized - demo mode');
                return false;
            }
            // Check if DocuSign is connected via Composio
            const connection = await composioService.checkConnection('docusign');
            if (!connection.connected) {
                console.log('[DocuSignService] DocuSign not connected via Composio');
                console.log('[DocuSignService] Connect at: https://app.composio.dev/ → Integrations → DocuSign');
                return false;
            }
            this.initialized = true;
            console.log('[DocuSignService] Initialized via Composio');
            return true;
        }
        catch (error) {
            console.error('[DocuSignService] Initialization error:', error);
            return false;
        }
    }
    /**
     * Send a document for signature
     *
     * @param request - The envelope request containing documents and recipients
     */
    async sendForSignature(request) {
        if (!this.initialized) {
            console.log('[DocuSignService] Demo mode - simulating signature request');
            return {
                success: true,
                envelopeId: `demo_envelope_${Date.now()}`,
                status: 'sent',
                sentDateTime: new Date().toISOString(),
            };
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
            });
            if (!result.success) {
                return { success: false, error: result.error || 'Failed to create envelope' };
            }
            const data = result.data;
            return {
                success: true,
                envelopeId: data.envelopeId,
                status: data.status || 'sent',
                sentDateTime: data.sentDateTime,
            };
        }
        catch (error) {
            console.error('[DocuSignService] Send for signature error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to send for signature',
            };
        }
    }
    /**
     * Get the status of an envelope
     *
     * @param envelopeId - The envelope ID to check
     */
    async getSignatureStatus(envelopeId) {
        if (!this.initialized) {
            console.log('[DocuSignService] Demo mode - simulating status check');
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
            };
        }
        try {
            const result = await composioService.executeTool('DOCUSIGN_GET_ENVELOPE', {
                envelopeId,
            });
            if (!result.success) {
                return { success: false, error: result.error || 'Failed to get envelope status' };
            }
            const data = result.data;
            const recipients = data.recipients;
            const signers = recipients?.signers;
            return {
                success: true,
                envelopeId: data.envelopeId,
                status: data.status,
                recipients: signers?.map(s => ({
                    recipientId: s.recipientId,
                    email: s.email,
                    name: s.name,
                    status: s.status,
                    signedDateTime: s.signedDateTime,
                    deliveredDateTime: s.deliveredDateTime,
                })),
                sentDateTime: data.sentDateTime,
                completedDateTime: data.completedDateTime,
                documentsUri: data.documentsUri,
            };
        }
        catch (error) {
            console.error('[DocuSignService] Get status error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get signature status',
            };
        }
    }
    /**
     * Download signed documents from an envelope
     *
     * @param envelopeId - The envelope ID to download from
     * @param documentId - Specific document ID, or 'combined' for all
     */
    async downloadSignedDocument(envelopeId, documentId = 'combined') {
        if (!this.initialized) {
            console.log('[DocuSignService] Demo mode - simulating download');
            return {
                success: true,
                combinedPdfBase64: 'demo_pdf_base64_content',
            };
        }
        try {
            const result = await composioService.executeTool('DOCUSIGN_GET_DOCUMENT', {
                envelopeId,
                documentId,
            });
            if (!result.success) {
                return { success: false, error: result.error || 'Failed to download document' };
            }
            const data = result.data;
            return {
                success: true,
                combinedPdfBase64: data.documentBase64,
                documents: data.documents,
            };
        }
        catch (error) {
            console.error('[DocuSignService] Download error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to download document',
            };
        }
    }
    /**
     * Void (cancel) an envelope
     *
     * @param envelopeId - The envelope ID to void
     * @param reason - Reason for voiding
     */
    async voidEnvelope(envelopeId, reason) {
        if (!this.initialized) {
            console.log('[DocuSignService] Demo mode - simulating void');
            return {
                success: true,
                envelopeId,
                status: 'voided',
            };
        }
        try {
            const result = await composioService.executeTool('DOCUSIGN_UPDATE_ENVELOPE', {
                envelopeId,
                status: 'voided',
                voidedReason: reason,
            });
            if (!result.success) {
                return { success: false, error: result.error || 'Failed to void envelope' };
            }
            return {
                success: true,
                envelopeId,
                status: 'voided',
            };
        }
        catch (error) {
            console.error('[DocuSignService] Void error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to void envelope',
            };
        }
    }
    /**
     * Send a reminder for an envelope
     *
     * @param envelopeId - The envelope ID to send reminder for
     */
    async sendReminder(envelopeId) {
        if (!this.initialized) {
            console.log('[DocuSignService] Demo mode - simulating reminder');
            return { success: true };
        }
        try {
            const result = await composioService.executeTool('DOCUSIGN_RESEND_ENVELOPE', {
                envelopeId,
            });
            if (!result.success) {
                return { success: false, error: result.error || 'Failed to send reminder' };
            }
            return { success: true };
        }
        catch (error) {
            console.error('[DocuSignService] Reminder error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to send reminder',
            };
        }
    }
    /**
     * Get list of templates
     */
    async getTemplates() {
        if (!this.initialized) {
            console.log('[DocuSignService] Demo mode - simulating templates');
            return {
                success: true,
                templates: [
                    { templateId: 'demo_1', name: 'Contract Template', description: 'Standard contract' },
                    { templateId: 'demo_2', name: 'NDA Template', description: 'Non-disclosure agreement' },
                ],
            };
        }
        try {
            const result = await composioService.executeTool('DOCUSIGN_LIST_TEMPLATES', {});
            if (!result.success) {
                return { success: false, error: result.error || 'Failed to list templates' };
            }
            const data = result.data;
            const templates = data.envelopeTemplates;
            return {
                success: true,
                templates: templates?.map(t => ({
                    templateId: t.templateId,
                    name: t.name,
                    description: t.description,
                    folderId: t.folderId,
                    folderName: t.folderName,
                })),
            };
        }
        catch (error) {
            console.error('[DocuSignService] Get templates error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get templates',
            };
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
    async sendFromTemplate(templateId, recipients, subject, message) {
        if (!this.initialized) {
            console.log('[DocuSignService] Demo mode - simulating template send');
            return {
                success: true,
                envelopeId: `demo_template_${Date.now()}`,
                status: 'sent',
                sentDateTime: new Date().toISOString(),
            };
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
            });
            if (!result.success) {
                return { success: false, error: result.error || 'Failed to create from template' };
            }
            const data = result.data;
            return {
                success: true,
                envelopeId: data.envelopeId,
                status: 'sent',
                sentDateTime: data.sentDateTime,
            };
        }
        catch (error) {
            console.error('[DocuSignService] Send from template error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to send from template',
            };
        }
    }
    /**
     * Check if service is ready
     */
    isReady() {
        return this.initialized;
    }
}
// =============================================================================
// EXPORT
// =============================================================================
const DocuSignService = new DocuSignServiceClass();
export default DocuSignService;
//# sourceMappingURL=DocuSignService.js.map