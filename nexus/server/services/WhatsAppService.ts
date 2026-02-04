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

// This file is kept for reference only - DO NOT USE

export interface WhatsAppSession {
  id: string
  userId: string
  phoneNumber?: string
  status: 'initializing' | 'qr_pending' | 'pairing_pending' | 'connected' | 'disconnected' | 'error'
  qrCode?: string
  pairingCode?: string
  lastActivity?: Date
  error?: string
}

export interface IncomingMessage {
  from: string
  body: string
  timestamp: Date
  isGroup: boolean
  groupName?: string
}

// Deprecation error for any attempted use
const DEPRECATION_ERROR = new Error(
  'WhatsAppService is deprecated. Use AiSensyService instead. ' +
  'See server/services/AiSensyService.ts for the new WhatsApp Business integration.'
)

class WhatsAppService {
  async initializeSession(): Promise<never> {
    throw DEPRECATION_ERROR
  }

  getSession(): null {
    console.warn('WhatsAppService.getSession() is deprecated. Use AiSensyService.')
    return null
  }

  isConnected(): boolean {
    console.warn('WhatsAppService.isConnected() is deprecated. Use AiSensyService.')
    return false
  }

  async sendMessage(): Promise<{ success: false; error: string }> {
    return {
      success: false,
      error: 'WhatsAppService is deprecated. Use AiSensyService instead.'
    }
  }

  async disconnectSession(): Promise<void> {
    console.warn('WhatsAppService.disconnectSession() is deprecated.')
  }

  onMessage(): void {
    console.warn('WhatsAppService.onMessage() is deprecated. Use WhatsAppBusinessTriggerService.')
  }

  getAllSessions(): WhatsAppSession[] {
    console.warn('WhatsAppService.getAllSessions() is deprecated.')
    return []
  }
}

// Export deprecated singleton that throws/warns on use
export const whatsAppService = new WhatsAppService()
export default whatsAppService
