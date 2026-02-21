/**
 * WhatsApp Service - DEPRECATED
 *
 * ⚠️ This service has been deprecated. The whatsapp-web.js approach has been removed because:
 * 1. It violates WhatsApp's Terms of Service
 * 2. The "Can't link new devices" error makes it unusable
 * 3. It only works for developers, not end users
 *
 * Please use AiSensyService instead:
 * - Located at: server/services/AiSensyService.ts
 * - Uses legitimate WhatsApp Business API via AiSensy BSP
 * - Supports template messages for business outreach
 * - 24-hour session window for customer service replies
 * - $0 platform fee - only pay Meta per-message rates
 *
 * Routes have been migrated to:
 * - POST /api/whatsapp-business/connect - Start Embedded Signup
 * - GET /api/whatsapp-business/status - Get connection status
 * - POST /api/whatsapp-business/send - Send template message
 * - POST /api/whatsapp-business/reply - Send session reply (24h window)
 */
// Deprecation error for any attempted use
const DEPRECATION_ERROR = new Error('WhatsAppService is deprecated. Use AiSensyService instead. ' +
    'See server/services/AiSensyService.ts for the new WhatsApp Business integration.');
class WhatsAppService {
    async initializeSession() {
        throw DEPRECATION_ERROR;
    }
    getSession() {
        console.warn('WhatsAppService.getSession() is deprecated. Use AiSensyService.');
        return null;
    }
    isConnected() {
        console.warn('WhatsAppService.isConnected() is deprecated. Use AiSensyService.');
        return false;
    }
    async sendMessage() {
        return {
            success: false,
            error: 'WhatsAppService is deprecated. Use AiSensyService instead.'
        };
    }
    async disconnectSession() {
        console.warn('WhatsAppService.disconnectSession() is deprecated.');
    }
    onMessage() {
        console.warn('WhatsAppService.onMessage() is deprecated. Use WhatsAppBusinessTriggerService.');
    }
    getAllSessions() {
        console.warn('WhatsAppService.getAllSessions() is deprecated.');
        return [];
    }
}
// Export deprecated singleton that throws/warns on use
export const whatsAppService = new WhatsAppService();
export default whatsAppService;
//# sourceMappingURL=WhatsAppService.js.map