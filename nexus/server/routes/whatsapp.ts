/**
 * WhatsApp Routes - DEPRECATED
 *
 * ⚠️ This API is deprecated. The old whatsapp-web.js approach has been removed
 * because it violates WhatsApp's Terms of Service and doesn't work reliably.
 *
 * Please use the new WhatsApp Business API instead:
 * - POST /api/whatsapp-business/connect - Start Embedded Signup
 * - GET /api/whatsapp-business/status - Get connection status
 * - POST /api/whatsapp-business/send - Send template message
 * - POST /api/whatsapp-business/reply - Send session reply (24h window)
 *
 * The new API uses AiSensy BSP for legitimate WhatsApp Business access.
 */

import { Router, Request, Response } from 'express'

const router = Router()

// Deprecation message for all old endpoints
const DEPRECATION_MESSAGE = {
  success: false,
  deprecated: true,
  error: 'This API has been deprecated. WhatsApp personal account automation violates WhatsApp ToS.',
  migration: {
    message: 'Please use the WhatsApp Business API instead.',
    newEndpoint: '/api/whatsapp-business',
    documentation: 'WhatsApp Business API uses legitimate AiSensy BSP integration.',
    benefits: [
      'Compliant with WhatsApp Terms of Service',
      'No QR code scanning required',
      'Supports template messages for business outreach',
      '24-hour session window for customer service',
      'Works for all users (not just developers)'
    ]
  }
}

// All old endpoints return deprecation notice
router.all('*', (req: Request, res: Response) => {
  res.status(410).json({
    ...DEPRECATION_MESSAGE,
    originalEndpoint: req.originalUrl,
    method: req.method
  })
})

export default router
