/**
 * Payment Link Routes - Kuwait Payment Gateway Integration
 * @NEXUS-FIX-048: Kuwait payment link workflow step - DO NOT REMOVE
 *
 * Endpoints:
 * - POST /api/payment-links/generate         - Generate a payment link
 * - GET  /api/payment-links/:id/status       - Check payment status
 * - GET  /api/payment-links                  - List payments
 * - GET  /api/payment-links/stats            - Payment statistics
 * - POST /api/payment-links/webhook/myfatoorah - MyFatoorah webhook callback
 * - POST /api/payment-links/webhook/knet     - KNET webhook callback
 *
 * Webhooks update payment status and trigger notifications
 * (WhatsApp receipt, order status update, etc.)
 */

import { Router, Request, Response } from 'express'
import {
  paymentLinkService,
  type PaymentLinkOptions,
  type PaymentListFilters,
  type SupportedCurrency,
} from '../services/PaymentLinkService.js'

const router = Router()

// =============================================================================
// PAYMENT LINK GENERATION
// =============================================================================

/**
 * POST /api/payment-links/generate
 * Generate a new payment link
 *
 * Body: {
 *   amount: number (required),
 *   currency?: 'KWD' | 'USD' | 'SAR' | 'AED' | 'BHD',
 *   description?: string,
 *   customerPhone?: string,
 *   customerEmail?: string,
 *   orderId?: string,
 *   callbackUrl?: string,
 *   expiresInHours?: number,
 *   language?: 'en' | 'ar',
 *   provider?: 'myfatoorah' | 'knet' | 'mock'
 * }
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const {
      amount,
      currency,
      description,
      customerPhone,
      customerEmail,
      orderId,
      callbackUrl,
      expiresInHours,
      language,
      provider,
    } = req.body

    // Validate required fields
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'amount is required and must be a positive number',
      })
    }

    // Validate currency if provided
    const validCurrencies: SupportedCurrency[] = ['KWD', 'USD', 'SAR', 'AED', 'BHD']
    if (currency && !validCurrencies.includes(currency)) {
      return res.status(400).json({
        success: false,
        error: `Invalid currency. Must be one of: ${validCurrencies.join(', ')}`,
      })
    }

    const options: PaymentLinkOptions = {
      amount,
      currency,
      description,
      customerPhone,
      customerEmail,
      orderId,
      callbackUrl,
      expiresInHours,
      language,
      provider,
    }

    const result = await paymentLinkService.generatePaymentLink(options)

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      })
    }

    res.json({
      success: true,
      payment: result.payment,
    })
  } catch (error: unknown) {
    console.error('[PaymentLinks] Error generating link:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate payment link',
    })
  }
})

// =============================================================================
// PAYMENT STATUS
// =============================================================================

/**
 * GET /api/payment-links/:id/status
 * Check payment status
 */
router.get('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const result = await paymentLinkService.getPaymentStatus(id)

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error,
      })
    }

    res.json({
      success: true,
      payment: result.payment,
    })
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payment status',
    })
  }
})

// =============================================================================
// LIST PAYMENTS
// =============================================================================

/**
 * GET /api/payment-links
 * List payments with optional filters
 *
 * Query params: status, provider, orderId, customerPhone, fromDate, toDate, limit, offset
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { status, provider, orderId, customerPhone, fromDate, toDate, limit, offset } = req.query

    const filters: PaymentListFilters = {}
    if (status && typeof status === 'string') filters.status = status as any
    if (provider && typeof provider === 'string') filters.provider = provider as any
    if (orderId && typeof orderId === 'string') filters.orderId = orderId
    if (customerPhone && typeof customerPhone === 'string') filters.customerPhone = customerPhone
    if (fromDate && typeof fromDate === 'string') filters.fromDate = fromDate
    if (toDate && typeof toDate === 'string') filters.toDate = toDate
    if (limit) filters.limit = parseInt(String(limit), 10)
    if (offset) filters.offset = parseInt(String(offset), 10)

    const payments = paymentLinkService.listPayments(filters)

    res.json({
      success: true,
      payments,
      count: payments.length,
    })
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list payments',
    })
  }
})

/**
 * GET /api/payment-links/stats
 * Payment statistics
 */
router.get('/stats', (_req: Request, res: Response) => {
  try {
    const stats = paymentLinkService.getStats()

    res.json({
      success: true,
      ...stats,
    })
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payment stats',
    })
  }
})

// =============================================================================
// WEBHOOKS - Payment Provider Callbacks
// =============================================================================

/**
 * POST /api/payment-links/webhook/myfatoorah
 * MyFatoorah payment callback
 *
 * Called by MyFatoorah when payment status changes.
 * Body varies - typically includes InvoiceId, InvoiceStatus, etc.
 */
router.post('/webhook/myfatoorah', async (req: Request, res: Response) => {
  try {
    console.log('[PaymentLinks] MyFatoorah webhook received:', JSON.stringify(req.body).substring(0, 200))

    const { InvoiceId, InvoiceStatus, CustomerReference, UserDefinedField } = req.body

    // CustomerReference = our paymentId
    // UserDefinedField = our orderId
    const paymentId = CustomerReference || UserDefinedField

    if (!paymentId) {
      console.warn('[PaymentLinks] MyFatoorah webhook: no payment reference found')
      return res.status(200).json({ success: true, message: 'No reference found' })
    }

    if (InvoiceStatus === 'Paid') {
      const result = await paymentLinkService.confirmPayment(paymentId, {
        myFatoorahInvoiceId: InvoiceId,
        myFatoorahStatus: InvoiceStatus,
        webhookData: req.body,
      })

      if (result.success && result.payment) {
        // Trigger post-payment actions (order update, WhatsApp notification)
        await handlePaymentConfirmed(result.payment)
      }

      console.log(`[PaymentLinks] MyFatoorah payment confirmed: ${paymentId}`)
    } else if (InvoiceStatus === 'Expired' || InvoiceStatus === 'Canceled') {
      paymentLinkService.markFailed(paymentId, `MyFatoorah: ${InvoiceStatus}`)
      console.log(`[PaymentLinks] MyFatoorah payment ${InvoiceStatus}: ${paymentId}`)
    }

    // Always return 200 to acknowledge webhook
    res.status(200).json({ success: true })
  } catch (error: unknown) {
    console.error('[PaymentLinks] MyFatoorah webhook error:', error)
    // Return 200 even on error to prevent retries
    res.status(200).json({ success: false, error: error instanceof Error ? error.message : 'Webhook processing error' })
  }
})

/**
 * POST /api/payment-links/webhook/knet
 * KNET payment callback
 *
 * Called by KNET when payment completes.
 * Typically includes: trackId, responseCode, paymentId, authCode
 */
router.post('/webhook/knet', async (req: Request, res: Response) => {
  try {
    console.log('[PaymentLinks] KNET webhook received:', JSON.stringify(req.body).substring(0, 200))

    const { trackId, responseCode, paymentId: knetPaymentId, authCode, cardType } = req.body

    // trackId = our paymentId
    if (!trackId) {
      console.warn('[PaymentLinks] KNET webhook: no trackId found')
      return res.status(200).json({ success: true, message: 'No trackId found' })
    }

    if (responseCode === '00') {
      // Success
      const result = await paymentLinkService.confirmPayment(trackId, {
        knetPaymentId,
        knetAuthCode: authCode,
        knetCardType: cardType,
        knetResponseCode: responseCode,
        webhookData: req.body,
      })

      if (result.success && result.payment) {
        await handlePaymentConfirmed(result.payment)
      }

      console.log(`[PaymentLinks] KNET payment confirmed: ${trackId}`)
    } else {
      // Failed
      const { knetService: knet } = await import('../services/KNETService.js')
      const responseInfo = (await import('../services/KNETService.js')).KNET_RESPONSE_CODES[responseCode]
      paymentLinkService.markFailed(trackId, responseInfo?.message || `KNET error: ${responseCode}`)
      console.log(`[PaymentLinks] KNET payment failed: ${trackId} (code: ${responseCode})`)
    }

    res.status(200).json({ success: true })
  } catch (error: unknown) {
    console.error('[PaymentLinks] KNET webhook error:', error)
    res.status(200).json({ success: false, error: error instanceof Error ? error.message : 'Webhook processing error' })
  }
})

// =============================================================================
// POST-PAYMENT ACTIONS
// =============================================================================

/**
 * Handle confirmed payment - update order, send notifications
 * @NEXUS-FIX-048: Post-payment notification flow - DO NOT REMOVE
 */
async function handlePaymentConfirmed(payment: import('../services/PaymentLinkService.js').PaymentRecord): Promise<void> {
  try {
    // 1. Update order status if we have an orderId
    if (payment.orderId) {
      try {
        const { orderService } = await import('../services/OrderService.js')
        const order = orderService.getOrder(payment.orderId)
        if (order && order.status !== 'cancelled') {
          orderService.updateOrderStatus(payment.orderId, 'confirmed')
          console.log(`[PaymentLinks] Order ${payment.orderId} status updated to confirmed`)
        }
      } catch (err) {
        console.warn('[PaymentLinks] Failed to update order status:', err)
      }
    }

    // 2. Send receipt via WhatsApp if phone available
    if (payment.customerPhone) {
      try {
        const { whatsAppComposioService } = await import('../services/WhatsAppComposioService.js')
        const receiptMessage = paymentLinkService.formatReceiptMessage(payment, payment.language)

        await whatsAppComposioService.sendMessage({
          to: payment.customerPhone,
          text: receiptMessage,
        })
        console.log(`[PaymentLinks] Receipt sent to ${payment.customerPhone}`)
      } catch (err) {
        console.warn('[PaymentLinks] Failed to send WhatsApp receipt:', err)
        // Non-critical - payment was still processed
      }
    }
  } catch (error) {
    console.error('[PaymentLinks] Error in post-payment actions:', error)
  }
}

export default router
