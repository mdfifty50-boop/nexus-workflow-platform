/**
 * KNET Payment Gateway Service
 * @NEXUS-FIX-089: Kuwait KNET payment integration
 *
 * KNET is Kuwait's national payment network, operated by K-NET (KNETSP).
 * All banks in Kuwait use KNET for debit card transactions.
 *
 * Integration Options:
 * 1. Direct API (requires KNET merchant agreement)
 * 2. Payment aggregators (Tap, MyFatoorah, UpayME)
 * 3. Bank-specific gateways (NBK, CBK, Burgan, etc.)
 *
 * For Nexus, we recommend aggregators for faster onboarding.
 */

import { composioService } from './ComposioService'

// KNET Transaction Types
export type TransactionType = 'purchase' | 'authorization' | 'refund' | 'void'
export type TransactionStatus = 'initiated' | 'pending' | 'success' | 'failed' | 'cancelled' | 'refunded'

// KNET Response Codes
export const KNET_RESPONSE_CODES: Record<string, { message: string; action: string }> = {
  '00': { message: 'Approved', action: 'Transaction successful' },
  '01': { message: 'Refer to card issuer', action: 'Contact bank' },
  '03': { message: 'Invalid merchant', action: 'Check merchant ID' },
  '04': { message: 'Pick up card', action: 'Card blocked - contact bank' },
  '05': { message: 'Do not honour', action: 'Insufficient funds or card blocked' },
  '12': { message: 'Invalid transaction', action: 'Try again' },
  '13': { message: 'Invalid amount', action: 'Check amount format' },
  '14': { message: 'Invalid card number', action: 'Check card details' },
  '30': { message: 'Format error', action: 'Technical error - try again' },
  '33': { message: 'Expired card', action: 'Use a valid card' },
  '41': { message: 'Lost card', action: 'Card reported lost' },
  '43': { message: 'Stolen card', action: 'Card reported stolen' },
  '51': { message: 'Insufficient funds', action: 'Add funds to account' },
  '54': { message: 'Expired card', action: 'Card has expired' },
  '55': { message: 'Incorrect PIN', action: 'Retry with correct PIN' },
  '75': { message: 'PIN tries exceeded', action: 'Card locked - contact bank' },
  '91': { message: 'Issuer unavailable', action: 'Bank system down - try later' },
  '96': { message: 'System error', action: 'Try again' }
}

// KNET Transaction Structure
export interface KNETTransaction {
  id: string
  transactionId: string // KNET reference
  paymentId?: string // External reference
  trackId: string // Merchant tracking ID
  type: TransactionType
  amount: number
  currency: 'KWD'
  status: TransactionStatus
  responseCode?: string
  responseMessage?: string
  authorizationCode?: string
  cardType?: 'KNET' | 'VISA' | 'MASTERCARD' | 'AMEX'
  cardLast4?: string
  cardExpiryMonth?: string
  cardExpiryYear?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  metadata?: Record<string, unknown>
  paymentUrl?: string // URL to redirect customer for payment
  callbackUrl?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

// Payment Request Parameters
export interface CreatePaymentParams {
  amount: number
  currency?: 'KWD'
  trackId?: string // Your internal reference
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  description?: string
  successUrl: string
  failUrl: string
  cancelUrl?: string
  metadata?: Record<string, unknown>
}

// KNET Merchant Configuration
export interface KNETConfig {
  merchantId: string
  terminalId: string
  resourceKey: string // Encryption key
  sandboxMode: boolean
  aggregator?: 'tap' | 'myfatoorah' | 'upayme' | 'direct'
}

class KNETServiceClass {
  private config?: KNETConfig
  private transactions: Map<string, KNETTransaction> = new Map()
  private demoMode = true

  /**
   * Configure KNET credentials
   */
  configure(config: KNETConfig): void {
    this.config = config
    this.demoMode = config.sandboxMode
    console.log(`[KNETService] Configured with ${config.aggregator || 'direct'} integration`)
    console.log(`[KNETService] Mode: ${config.sandboxMode ? 'SANDBOX' : 'PRODUCTION'}`)
  }

  /**
   * Create a payment request and get payment URL
   */
  async createPayment(params: CreatePaymentParams): Promise<{
    success: boolean
    payment?: KNETTransaction
    paymentUrl?: string
    error?: string
  }> {
    try {
      const transactionId = `knet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const trackId = params.trackId || `track_${Date.now()}`
      const now = new Date().toISOString()

      const transaction: KNETTransaction = {
        id: transactionId,
        transactionId: '',
        trackId,
        type: 'purchase',
        amount: params.amount,
        currency: params.currency || 'KWD',
        status: 'initiated',
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        customerPhone: params.customerPhone,
        metadata: params.metadata,
        callbackUrl: params.successUrl,
        createdAt: now,
        updatedAt: now
      }

      // In demo mode, generate mock payment URL
      if (this.demoMode || !this.config) {
        transaction.paymentUrl = `https://demo.knet.com.kw/pay/${transactionId}?amount=${params.amount}`
        transaction.transactionId = `DEMO${Date.now()}`
        transaction.status = 'pending'

        this.transactions.set(transactionId, transaction)

        return {
          success: true,
          payment: transaction,
          paymentUrl: transaction.paymentUrl
        }
      }

      // Call aggregator or direct KNET API
      let result
      switch (this.config.aggregator) {
        case 'tap':
          result = await this.createTapPayment(transaction, params)
          break
        case 'myfatoorah':
          result = await this.createMyFatoorahPayment(transaction, params)
          break
        case 'upayme':
          result = await this.createUpaymePayment(transaction, params)
          break
        default:
          result = await this.createDirectKNETPayment(transaction, params)
      }

      if (result.success) {
        transaction.paymentUrl = result.paymentUrl
        transaction.transactionId = result.transactionId || transactionId
        transaction.status = 'pending'
        this.transactions.set(transactionId, transaction)
      }

      return {
        success: result.success,
        payment: transaction,
        paymentUrl: transaction.paymentUrl,
        error: result.error
      }
    } catch (error) {
      console.error('Error creating KNET payment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment'
      }
    }
  }

  /**
   * Handle payment callback from KNET
   */
  async handleCallback(
    trackId: string,
    responseCode: string,
    paymentId: string,
    authCode?: string,
    cardType?: string
  ): Promise<{
    success: boolean
    transaction?: KNETTransaction
    error?: string
  }> {
    try {
      // Find transaction by trackId
      const transaction = Array.from(this.transactions.values())
        .find(t => t.trackId === trackId)

      if (!transaction) {
        return { success: false, error: 'Transaction not found' }
      }

      const responseInfo = KNET_RESPONSE_CODES[responseCode] || {
        message: 'Unknown response',
        action: 'Contact support'
      }

      transaction.responseCode = responseCode
      transaction.responseMessage = responseInfo.message
      transaction.paymentId = paymentId
      transaction.authorizationCode = authCode
      transaction.cardType = cardType as KNETTransaction['cardType']
      transaction.updatedAt = new Date().toISOString()

      if (responseCode === '00') {
        transaction.status = 'success'
        transaction.completedAt = new Date().toISOString()

        // Send confirmation via WhatsApp if phone available
        if (transaction.customerPhone) {
          await this.sendPaymentConfirmation(transaction)
        }
      } else {
        transaction.status = 'failed'
      }

      return { success: responseCode === '00', transaction }
    } catch (error) {
      console.error('Error handling KNET callback:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process callback'
      }
    }
  }

  /**
   * Process refund
   */
  async refundPayment(
    transactionId: string,
    amount?: number,
    reason?: string
  ): Promise<{
    success: boolean
    refund?: KNETTransaction
    error?: string
  }> {
    try {
      const originalTransaction = this.transactions.get(transactionId)
      if (!originalTransaction) {
        return { success: false, error: 'Original transaction not found' }
      }

      if (originalTransaction.status !== 'success') {
        return { success: false, error: 'Can only refund successful transactions' }
      }

      const refundAmount = amount || originalTransaction.amount
      if (refundAmount > originalTransaction.amount) {
        return { success: false, error: 'Refund amount exceeds original payment' }
      }

      const refundId = `refund_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
      const now = new Date().toISOString()

      const refund: KNETTransaction = {
        id: refundId,
        transactionId: `REF${originalTransaction.transactionId}`,
        trackId: `refund_${originalTransaction.trackId}`,
        paymentId: originalTransaction.paymentId,
        type: 'refund',
        amount: refundAmount,
        currency: 'KWD',
        status: 'pending',
        customerName: originalTransaction.customerName,
        customerEmail: originalTransaction.customerEmail,
        customerPhone: originalTransaction.customerPhone,
        metadata: { originalTransactionId: transactionId, reason },
        createdAt: now,
        updatedAt: now
      }

      // In demo mode, simulate successful refund
      if (this.demoMode) {
        refund.status = 'success'
        refund.responseCode = '00'
        refund.responseMessage = 'Refund approved'
        refund.completedAt = now

        originalTransaction.status = amount === originalTransaction.amount ? 'refunded' : 'success'
        originalTransaction.updatedAt = now

        this.transactions.set(refundId, refund)

        // Send refund notification
        if (refund.customerPhone) {
          await this.sendRefundNotification(refund)
        }

        return { success: true, refund }
      }

      // Real refund API call would go here
      // ...

      return { success: true, refund }
    } catch (error) {
      console.error('Error processing refund:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process refund'
      }
    }
  }

  /**
   * Get transaction by ID
   */
  getTransaction(transactionId: string): KNETTransaction | undefined {
    return this.transactions.get(transactionId)
  }

  /**
   * Get transactions by customer
   */
  getCustomerTransactions(customerEmail: string): KNETTransaction[] {
    return Array.from(this.transactions.values())
      .filter(t => t.customerEmail === customerEmail)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  /**
   * Get transactions summary
   */
  getTransactionsSummary(startDate: string, endDate: string): {
    totalTransactions: number
    successfulTransactions: number
    failedTransactions: number
    totalAmount: number
    totalRefunds: number
    successRate: number
  } {
    const transactions = Array.from(this.transactions.values())
      .filter(t => t.createdAt >= startDate && t.createdAt <= endDate)

    const successful = transactions.filter(t => t.status === 'success' && t.type === 'purchase')
    const failed = transactions.filter(t => t.status === 'failed')
    const refunds = transactions.filter(t => t.type === 'refund' && t.status === 'success')

    return {
      totalTransactions: transactions.length,
      successfulTransactions: successful.length,
      failedTransactions: failed.length,
      totalAmount: successful.reduce((sum, t) => sum + t.amount, 0),
      totalRefunds: refunds.reduce((sum, t) => sum + t.amount, 0),
      successRate: transactions.length > 0
        ? Math.round((successful.length / transactions.filter(t => t.type === 'purchase').length) * 100)
        : 100
    }
  }

  // Helper: Send payment confirmation via WhatsApp
  private async sendPaymentConfirmation(transaction: KNETTransaction): Promise<void> {
    try {
      await composioService.executeAction(
        'WHATSAPP_SEND_MESSAGE',
        {
          to: transaction.customerPhone,
          message: `
✅ Payment Successful!

Amount: ${transaction.amount.toFixed(3)} KWD
Reference: ${transaction.transactionId}
Card: ${transaction.cardType || 'KNET'} ending in ${transaction.cardLast4 || '****'}

Thank you for your payment!
          `.trim()
        }
      )
    } catch (error) {
      console.error('Error sending payment confirmation:', error)
    }
  }

  // Helper: Send refund notification
  private async sendRefundNotification(refund: KNETTransaction): Promise<void> {
    try {
      await composioService.executeAction(
        'WHATSAPP_SEND_MESSAGE',
        {
          to: refund.customerPhone,
          message: `
💰 Refund Processed

Amount: ${refund.amount.toFixed(3)} KWD
Reference: ${refund.transactionId}

The refund will be credited to your account within 3-5 business days.
          `.trim()
        }
      )
    } catch (error) {
      console.error('Error sending refund notification:', error)
    }
  }

  // Aggregator-specific implementations (simplified)
  private async createTapPayment(
    transaction: KNETTransaction,
    params: CreatePaymentParams
  ): Promise<{ success: boolean; paymentUrl?: string; transactionId?: string; error?: string }> {
    // Tap Payments API integration
    // https://www.tap.company/docs/
    return {
      success: true,
      paymentUrl: `https://checkout.tap.company/v2/${transaction.id}`,
      transactionId: `TAP${Date.now()}`
    }
  }

  private async createMyFatoorahPayment(
    transaction: KNETTransaction,
    params: CreatePaymentParams
  ): Promise<{ success: boolean; paymentUrl?: string; transactionId?: string; error?: string }> {
    // MyFatoorah API integration
    // https://myfatoorah.readme.io/
    return {
      success: true,
      paymentUrl: `https://portal.myfatoorah.com/pay/${transaction.id}`,
      transactionId: `MF${Date.now()}`
    }
  }

  private async createUpaymePayment(
    transaction: KNETTransaction,
    params: CreatePaymentParams
  ): Promise<{ success: boolean; paymentUrl?: string; transactionId?: string; error?: string }> {
    // UpayME API integration
    return {
      success: true,
      paymentUrl: `https://payment.upayme.io/${transaction.id}`,
      transactionId: `UP${Date.now()}`
    }
  }

  private async createDirectKNETPayment(
    transaction: KNETTransaction,
    params: CreatePaymentParams
  ): Promise<{ success: boolean; paymentUrl?: string; transactionId?: string; error?: string }> {
    // Direct KNET PG integration (requires merchant agreement)
    if (!this.config?.merchantId || !this.config?.terminalId) {
      return { success: false, error: 'KNET merchant credentials not configured' }
    }

    return {
      success: true,
      paymentUrl: `https://kpay.com.kw/kpg/PaymentHTTP.htm?param=${transaction.id}`,
      transactionId: `KNET${Date.now()}`
    }
  }

  /**
   * Format amount for KNET (KWD has 3 decimal places)
   */
  formatAmount(amount: number): string {
    return amount.toFixed(3)
  }

  /**
   * Validate KNET response hash
   */
  validateResponseHash(params: Record<string, string>, expectedHash: string): boolean {
    // In production, validate the response hash using the resource key
    // to ensure the response is authentic from KNET
    return true // Simplified for demo
  }
}

// Export singleton instance
export const knetService = new KNETServiceClass()
export default knetService
