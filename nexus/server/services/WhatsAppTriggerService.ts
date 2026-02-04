/**
 * WhatsApp Trigger Service - DEPRECATED
 *
 * ⚠️ This service has been deprecated. The whatsapp-web.js approach has been removed because:
 * 1. It violates WhatsApp's Terms of Service
 * 2. The "Can't link new devices" error makes it unusable
 * 3. It only works for developers, not end users
 *
 * Please use WhatsAppBusinessTriggerService instead:
 * - Located at: server/services/WhatsAppBusinessTriggerService.ts
 * - Uses legitimate WhatsApp Business API via AiSensy BSP
 * - Receives messages via webhook at /api/whatsapp-business/webhook
 * - Supports template messages and 24-hour session replies
 *
 * Migration guide:
 * 1. Set up AiSensy account at https://aisensy.com
 * 2. Complete Meta Embedded Signup for WhatsApp Business
 * 3. Configure webhook URL to point to /api/whatsapp-business/webhook
 * 4. Register triggers using WhatsAppBusinessTriggerService
 */

// This file is kept for reference only - DO NOT USE

export interface WhatsAppTrigger {
  id: string
  userId: string
  keyword: string
  workflowId: string
  workflowName: string
  isActive: boolean
  createdAt: Date
  lastTriggered?: Date
  triggerCount: number
}

// Deprecation warning for any attempted use
const DEPRECATION_WARNING =
  'WhatsAppTriggerService is deprecated. Use WhatsAppBusinessTriggerService instead. ' +
  'See server/services/WhatsAppBusinessTriggerService.ts for the new implementation.'

class WhatsAppTriggerService {
  constructor() {
    console.warn('⚠️ ' + DEPRECATION_WARNING)
  }

  createTrigger(): WhatsAppTrigger {
    console.warn(DEPRECATION_WARNING)
    throw new Error(DEPRECATION_WARNING)
  }

  getTriggers(): WhatsAppTrigger[] {
    console.warn(DEPRECATION_WARNING)
    return []
  }

  updateTrigger(): WhatsAppTrigger | null {
    console.warn(DEPRECATION_WARNING)
    return null
  }

  deleteTrigger(): boolean {
    console.warn(DEPRECATION_WARNING)
    return false
  }

  toggleTrigger(): WhatsAppTrigger | null {
    console.warn(DEPRECATION_WARNING)
    return null
  }
}

// Export deprecated singleton that warns on use
export const whatsAppTriggerService = new WhatsAppTriggerService()
export default whatsAppTriggerService
