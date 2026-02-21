/**
 * PaymentLinkService - Kuwait Payment Link Generation
 * @NEXUS-FIX-048: Kuwait payment gateway integration - DO NOT REMOVE
 *
 * Generates payment links for Kuwait commerce via:
 * - MyFatoorah (primary aggregator for Kuwait)
 * - KNET direct (via existing KNETService)
 * - Mock mode (when no API keys configured)
 *
 * Flow:
 * 1. Order received (WhatsApp, web, etc.)
 * 2. Generate payment link via provider
 * 3. Send link to customer (WhatsApp/email)
 * 4. Customer pays externally on KNET page
 * 5. Webhook receives confirmation
 * 6. Update order status, send receipt
 *
 * Supports: KWD (default), USD, SAR, AED, BHD
 */
import { knetService } from './KNETService.js';
// =============================================================================
// SERVICE IMPLEMENTATION
// =============================================================================
class PaymentLinkServiceClass {
    payments = new Map();
    myFatoorahApiKey;
    myFatoorahBaseUrl;
    constructor() {
        this.myFatoorahApiKey = process.env.MYFATOORAH_API_KEY;
        // Use test environment by default, production when MYFATOORAH_PRODUCTION=true
        const isProduction = process.env.MYFATOORAH_PRODUCTION === 'true';
        this.myFatoorahBaseUrl = isProduction
            ? 'https://api.myfatoorah.com'
            : 'https://apitest.myfatoorah.com';
        console.log(`[PaymentLinkService] Initialized:`);
        console.log(`  - MyFatoorah: ${this.myFatoorahApiKey ? 'configured' : 'mock mode'}`);
        console.log(`  - MyFatoorah env: ${isProduction ? 'PRODUCTION' : 'TEST'}`);
        console.log(`  - Default currency: KWD`);
    }
    // ===========================================================================
    // PUBLIC API
    // ===========================================================================
    /**
     * Generate a payment link
     * @NEXUS-FIX-048: Payment link generation - DO NOT REMOVE
     */
    async generatePaymentLink(options) {
        try {
            const provider = this.resolveProvider(options.provider);
            const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
            const currency = options.currency || 'KWD';
            const expiresInHours = options.expiresInHours || 24;
            const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();
            const language = options.language || 'en';
            let result;
            switch (provider) {
                case 'myfatoorah':
                    result = await this.generateMyFatoorahLink(paymentId, options, currency, expiresAt);
                    break;
                case 'knet':
                    result = await this.generateKNETLink(paymentId, options, currency);
                    break;
                case 'mock':
                default:
                    result = this.generateMockLink(paymentId, options, currency);
                    break;
            }
            // Store payment record
            const record = {
                paymentId,
                orderId: options.orderId,
                amount: options.amount,
                currency,
                description: options.description,
                customerPhone: options.customerPhone,
                customerEmail: options.customerEmail,
                paymentUrl: result.paymentUrl,
                provider,
                status: 'pending',
                language,
                createdAt: new Date().toISOString(),
                expiresAt,
                callbackUrl: options.callbackUrl,
                providerRef: result.providerRef,
            };
            this.payments.set(paymentId, record);
            console.log(`[PaymentLinkService] Generated payment link:`, {
                paymentId,
                provider,
                amount: `${options.amount} ${currency}`,
                orderId: options.orderId,
                url: result.paymentUrl.substring(0, 60) + '...',
            });
            return {
                success: true,
                payment: {
                    paymentId,
                    paymentUrl: result.paymentUrl,
                    expiresAt,
                    provider,
                    status: 'pending',
                },
            };
        }
        catch (error) {
            console.error('[PaymentLinkService] Error generating payment link:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to generate payment link',
            };
        }
    }
    /**
     * Get payment status
     */
    async getPaymentStatus(paymentId) {
        const payment = this.payments.get(paymentId);
        if (!payment) {
            return { success: false, error: `Payment ${paymentId} not found` };
        }
        // Check if expired
        if (payment.status === 'pending' && new Date(payment.expiresAt) < new Date()) {
            payment.status = 'expired';
            this.payments.set(paymentId, payment);
        }
        // For MyFatoorah, optionally check live status
        if (payment.provider === 'myfatoorah' && this.myFatoorahApiKey && payment.status === 'pending') {
            try {
                const liveStatus = await this.checkMyFatoorahStatus(payment.providerRef || paymentId);
                if (liveStatus) {
                    payment.status = liveStatus.status;
                    if (liveStatus.paidAt) {
                        payment.paidAt = liveStatus.paidAt;
                    }
                    this.payments.set(paymentId, payment);
                }
            }
            catch (err) {
                // Non-critical, return cached status
                console.warn('[PaymentLinkService] Live status check failed:', err);
            }
        }
        return { success: true, payment };
    }
    /**
     * List payments with optional filters
     */
    listPayments(filters) {
        let payments = Array.from(this.payments.values());
        if (filters) {
            if (filters.status) {
                payments = payments.filter(p => p.status === filters.status);
            }
            if (filters.provider) {
                payments = payments.filter(p => p.provider === filters.provider);
            }
            if (filters.orderId) {
                payments = payments.filter(p => p.orderId === filters.orderId);
            }
            if (filters.customerPhone) {
                payments = payments.filter(p => p.customerPhone === filters.customerPhone);
            }
            if (filters.fromDate) {
                payments = payments.filter(p => p.createdAt >= filters.fromDate);
            }
            if (filters.toDate) {
                payments = payments.filter(p => p.createdAt <= filters.toDate);
            }
        }
        // Sort by creation date, newest first
        payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        // Apply pagination
        const offset = filters?.offset || 0;
        const limit = filters?.limit || 50;
        return payments.slice(offset, offset + limit);
    }
    /**
     * Handle payment confirmation (from webhook)
     * Updates status and returns the payment record
     */
    async confirmPayment(paymentId, providerData) {
        const payment = this.payments.get(paymentId);
        if (!payment) {
            // Try to find by orderId or providerRef
            const found = Array.from(this.payments.values()).find(p => p.providerRef === paymentId || p.orderId === paymentId);
            if (!found) {
                return { success: false, error: `Payment not found: ${paymentId}` };
            }
            return this.confirmPayment(found.paymentId, providerData);
        }
        if (payment.status === 'paid') {
            return { success: true, payment }; // Already paid, idempotent
        }
        payment.status = 'paid';
        payment.paidAt = new Date().toISOString();
        if (providerData) {
            payment.metadata = { ...payment.metadata, ...providerData };
        }
        this.payments.set(paymentId, payment);
        console.log(`[PaymentLinkService] Payment confirmed:`, {
            paymentId,
            orderId: payment.orderId,
            amount: `${payment.amount} ${payment.currency}`,
        });
        return { success: true, payment };
    }
    /**
     * Mark payment as failed
     */
    markFailed(paymentId, reason) {
        const payment = this.payments.get(paymentId);
        if (!payment)
            return undefined;
        payment.status = 'failed';
        if (reason) {
            payment.metadata = { ...payment.metadata, failureReason: reason };
        }
        this.payments.set(paymentId, payment);
        return payment;
    }
    /**
     * Get payment by order ID
     */
    getPaymentByOrderId(orderId) {
        return Array.from(this.payments.values()).find(p => p.orderId === orderId);
    }
    /**
     * Format payment message for WhatsApp
     */
    formatPaymentMessage(payment, lang = 'en') {
        const amount = this.formatAmount(payment.amount, payment.currency);
        if (lang === 'ar') {
            return [
                `💳 *رابط الدفع*`,
                ``,
                payment.orderId ? `📦 الطلب: #${payment.orderId}` : '',
                payment.description ? `📝 ${payment.description}` : '',
                `💰 المبلغ: ${amount}`,
                ``,
                `🔗 ادفع من هنا:`,
                payment.paymentUrl,
                ``,
                `⏰ صالح حتى: ${new Date(payment.expiresAt).toLocaleString('ar-KW')}`,
                ``,
                `✅ بعد الدفع، سيتم تأكيد طلبك تلقائياً`,
            ].filter(Boolean).join('\n');
        }
        return [
            `💳 *Payment Link*`,
            ``,
            payment.orderId ? `📦 Order: #${payment.orderId}` : '',
            payment.description ? `📝 ${payment.description}` : '',
            `💰 Amount: ${amount}`,
            ``,
            `🔗 Pay here:`,
            payment.paymentUrl,
            ``,
            `⏰ Valid until: ${new Date(payment.expiresAt).toLocaleString('en-KW')}`,
            ``,
            `✅ Your order will be confirmed automatically after payment`,
        ].filter(Boolean).join('\n');
    }
    /**
     * Format receipt message for WhatsApp
     */
    formatReceiptMessage(payment, lang = 'en') {
        const amount = this.formatAmount(payment.amount, payment.currency);
        if (lang === 'ar') {
            return [
                `✅ *تم الدفع بنجاح!*`,
                ``,
                payment.orderId ? `📦 الطلب: #${payment.orderId}` : '',
                `💰 المبلغ: ${amount}`,
                `🏷️ رقم المرجع: ${payment.paymentId}`,
                payment.paidAt ? `📅 التاريخ: ${new Date(payment.paidAt).toLocaleString('ar-KW')}` : '',
                ``,
                `شكراً لك! 🙏`,
            ].filter(Boolean).join('\n');
        }
        return [
            `✅ *Payment Successful!*`,
            ``,
            payment.orderId ? `📦 Order: #${payment.orderId}` : '',
            `💰 Amount: ${amount}`,
            `🏷️ Reference: ${payment.paymentId}`,
            payment.paidAt ? `📅 Date: ${new Date(payment.paidAt).toLocaleString('en-KW')}` : '',
            ``,
            `Thank you! 🙏`,
        ].filter(Boolean).join('\n');
    }
    // ===========================================================================
    // PROVIDER IMPLEMENTATIONS
    // ===========================================================================
    /**
     * Resolve which provider to use
     */
    resolveProvider(requested) {
        if (requested) {
            // If myfatoorah requested but no API key, fall back to mock
            if (requested === 'myfatoorah' && !this.myFatoorahApiKey) {
                console.log('[PaymentLinkService] MyFatoorah requested but no API key, using mock');
                return 'mock';
            }
            return requested;
        }
        // Auto-select: MyFatoorah if configured, else mock
        if (this.myFatoorahApiKey)
            return 'myfatoorah';
        return 'mock';
    }
    /**
     * Generate payment link via MyFatoorah API
     */
    async generateMyFatoorahLink(paymentId, options, currency, expiresAt) {
        if (!this.myFatoorahApiKey) {
            throw new Error('MyFatoorah API key not configured');
        }
        const requestBody = {
            NotificationOption: 'LNK', // Link only, we send it ourselves
            InvoiceValue: options.amount,
            DisplayCurrencyIso: currency,
            CustomerName: options.customerPhone ? `Customer ${options.customerPhone}` : undefined,
            CustomerMobile: options.customerPhone,
            CustomerEmail: options.customerEmail,
            MobileCountryCode: options.customerPhone?.startsWith('+965') ? '+965' : undefined,
            CallBackUrl: options.callbackUrl || `${process.env.BASE_URL || 'http://localhost:4567'}/api/payment-links/webhook/myfatoorah`,
            ErrorUrl: options.callbackUrl || `${process.env.BASE_URL || 'http://localhost:4567'}/api/payment-links/webhook/myfatoorah`,
            Language: options.language || 'en',
            CustomerReference: paymentId,
            UserDefinedField: options.orderId,
            ExpiryDate: expiresAt,
        };
        const response = await fetch(`${this.myFatoorahBaseUrl}/v2/SendPayment`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.myFatoorahApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`MyFatoorah API error (${response.status}): ${errorText}`);
        }
        const data = await response.json();
        if (!data.IsSuccess) {
            throw new Error(`MyFatoorah error: ${data.Message}`);
        }
        return {
            paymentUrl: data.Data.InvoiceURL,
            providerRef: String(data.Data.InvoiceId),
        };
    }
    /**
     * Check payment status via MyFatoorah API
     */
    async checkMyFatoorahStatus(invoiceId) {
        if (!this.myFatoorahApiKey)
            return null;
        try {
            const response = await fetch(`${this.myFatoorahBaseUrl}/v2/GetPaymentStatus`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.myFatoorahApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    Key: invoiceId,
                    KeyType: 'InvoiceId',
                }),
            });
            if (!response.ok)
                return null;
            const data = await response.json();
            if (!data.IsSuccess)
                return null;
            const statusMap = {
                'Pending': 'pending',
                'Paid': 'paid',
                'Expired': 'expired',
                'Canceled': 'failed',
            };
            return {
                status: statusMap[data.Data.InvoiceStatus] || 'pending',
                paidAt: data.Data.PaidDate,
            };
        }
        catch {
            return null;
        }
    }
    /**
     * Generate payment link via KNET (uses existing KNETService)
     */
    async generateKNETLink(paymentId, options, _currency) {
        const result = await knetService.createPayment({
            amount: options.amount,
            trackId: paymentId,
            customerName: options.customerPhone ? `Customer` : undefined,
            customerEmail: options.customerEmail,
            customerPhone: options.customerPhone,
            description: options.description,
            successUrl: options.callbackUrl || `${process.env.BASE_URL || 'http://localhost:4567'}/api/payment-links/webhook/knet`,
            failUrl: options.callbackUrl || `${process.env.BASE_URL || 'http://localhost:4567'}/api/payment-links/webhook/knet`,
        });
        if (!result.success || !result.paymentUrl) {
            throw new Error(result.error || 'Failed to create KNET payment');
        }
        return {
            paymentUrl: result.paymentUrl,
            providerRef: result.payment?.transactionId,
        };
    }
    /**
     * Generate mock payment link (for development)
     */
    generateMockLink(paymentId, options, currency) {
        const mockUrl = `https://demo.pay.nexus.kw/${paymentId}?amount=${options.amount}&currency=${currency}&desc=${encodeURIComponent(options.description || '')}`;
        return {
            paymentUrl: mockUrl,
            providerRef: `MOCK_${Date.now()}`,
        };
    }
    // ===========================================================================
    // HELPERS
    // ===========================================================================
    /**
     * Format amount with currency symbol
     */
    formatAmount(amount, currency) {
        const symbols = {
            KWD: 'KD',
            USD: '$',
            SAR: 'SAR',
            AED: 'AED',
            BHD: 'BD',
        };
        const decimals = currency === 'KWD' || currency === 'BHD' ? 3 : 2;
        return `${symbols[currency]} ${amount.toFixed(decimals)}`;
    }
    /**
     * Get summary statistics
     */
    getStats() {
        const payments = Array.from(this.payments.values());
        const byStatus = { pending: 0, paid: 0, expired: 0, refunded: 0, failed: 0 };
        const byProvider = { myfatoorah: 0, knet: 0, mock: 0 };
        let totalCollected = 0;
        for (const p of payments) {
            byStatus[p.status]++;
            byProvider[p.provider]++;
            if (p.status === 'paid') {
                totalCollected += p.amount;
            }
        }
        return {
            total: payments.length,
            byStatus,
            byProvider,
            totalCollected,
            currency: 'KWD',
        };
    }
}
// =============================================================================
// CLEANUP: Expire old pending payments (every 10 minutes)
// =============================================================================
const CLEANUP_INTERVAL = 10 * 60 * 1000;
// Export singleton
export const paymentLinkService = new PaymentLinkServiceClass();
setInterval(() => {
    const now = new Date();
    let expired = 0;
    for (const [id, payment] of paymentLinkService.payments) {
        if (payment.status === 'pending' && new Date(payment.expiresAt) < now) {
            payment.status = 'expired';
            paymentLinkService.payments.set(id, payment);
            expired++;
        }
    }
    if (expired > 0) {
        console.log(`[PaymentLinkService] Expired ${expired} pending payment(s)`);
    }
}, CLEANUP_INTERVAL);
export default paymentLinkService;
//# sourceMappingURL=PaymentLinkService.js.map