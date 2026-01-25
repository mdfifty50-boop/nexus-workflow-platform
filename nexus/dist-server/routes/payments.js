/**
 * Payments API Routes - Server-Side Stripe Integration
 *
 * This module handles all payment processing through Stripe.
 * The secret key is stored server-side and never exposed to the frontend.
 *
 * Endpoints:
 * - POST /api/payments/create-intent - Create a PaymentIntent
 * - POST /api/payments/create-customer - Create a Stripe customer
 * - POST /api/payments/webhook - Handle Stripe webhooks
 * - GET /api/payments/status/:id - Get payment status
 */
import { Router } from 'express';
import Stripe from 'stripe';
const router = Router();
// Initialize Stripe with secret key from environment
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-12-15.clover',
});
// In-memory store for demo (use database in production)
const customers = new Map(); // userId -> stripeCustomerId
/**
 * Create a PaymentIntent for secure payment collection
 */
router.post('/create-intent', async (req, res) => {
    try {
        const { amount, currency = 'usd', description, customerEmail, customerName, metadata = {}, } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid amount',
            });
        }
        // Check if Stripe is configured
        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(500).json({
                success: false,
                error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to environment.',
            });
        }
        // Create or retrieve customer if email provided
        let customerId;
        if (customerEmail) {
            // Check if we have a customer with this email
            const existingCustomers = await stripe.customers.list({
                email: customerEmail,
                limit: 1,
            });
            if (existingCustomers.data.length > 0) {
                customerId = existingCustomers.data[0].id;
            }
            else {
                // Create new customer
                const newCustomer = await stripe.customers.create({
                    email: customerEmail,
                    name: customerName,
                    metadata: { source: 'nexus' },
                });
                customerId = newCustomer.id;
            }
        }
        // Create PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount), // Amount should already be in cents
            currency: currency.toLowerCase(),
            customer: customerId,
            description,
            metadata: {
                ...metadata,
                source: 'nexus',
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });
        console.log(`[Payments] Created PaymentIntent: ${paymentIntent.id} for ${amount / 100} ${currency.toUpperCase()}`);
        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
        });
    }
    catch (error) {
        console.error('[Payments] Error creating PaymentIntent:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create payment intent',
        });
    }
});
/**
 * Create a Stripe customer
 */
router.post('/create-customer', async (req, res) => {
    try {
        const { email, name, userId, metadata = {} } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required',
            });
        }
        // Check if Stripe is configured
        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(500).json({
                success: false,
                error: 'Stripe is not configured',
            });
        }
        // Check for existing customer
        const existingCustomers = await stripe.customers.list({
            email,
            limit: 1,
        });
        if (existingCustomers.data.length > 0) {
            const customer = existingCustomers.data[0];
            if (userId) {
                customers.set(userId, customer.id);
            }
            return res.json({
                success: true,
                customerId: customer.id,
                isExisting: true,
            });
        }
        // Create new customer
        const customer = await stripe.customers.create({
            email,
            name,
            metadata: {
                ...metadata,
                userId,
                source: 'nexus',
            },
        });
        if (userId) {
            customers.set(userId, customer.id);
        }
        console.log(`[Payments] Created customer: ${customer.id} for ${email}`);
        res.json({
            success: true,
            customerId: customer.id,
            isExisting: false,
        });
    }
    catch (error) {
        console.error('[Payments] Error creating customer:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create customer',
        });
    }
});
/**
 * Get payment status
 */
router.get('/status/:paymentIntentId', async (req, res) => {
    try {
        const { paymentIntentId } = req.params;
        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(500).json({
                success: false,
                error: 'Stripe is not configured',
            });
        }
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        res.json({
            success: true,
            status: paymentIntent.status,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency.toUpperCase(),
            description: paymentIntent.description,
            receiptUrl: paymentIntent.latest_charge
                ? (await stripe.charges.retrieve(paymentIntent.latest_charge)).receipt_url
                : null,
        });
    }
    catch (error) {
        console.error('[Payments] Error getting payment status:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get payment status',
        });
    }
});
/**
 * Create a payment link for sharing
 */
router.post('/create-link', async (req, res) => {
    try {
        const { amount, currency = 'usd', productName, description: _description } = req.body;
        if (!amount || !productName) {
            return res.status(400).json({
                success: false,
                error: 'Amount and productName are required',
            });
        }
        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(500).json({
                success: false,
                error: 'Stripe is not configured',
            });
        }
        // Create a price
        const price = await stripe.prices.create({
            unit_amount: Math.round(amount),
            currency: currency.toLowerCase(),
            product_data: {
                name: productName,
            },
        });
        // Create payment link
        const paymentLink = await stripe.paymentLinks.create({
            line_items: [
                {
                    price: price.id,
                    quantity: 1,
                },
            ],
        });
        console.log(`[Payments] Created payment link: ${paymentLink.url}`);
        res.json({
            success: true,
            url: paymentLink.url,
            id: paymentLink.id,
        });
    }
    catch (error) {
        console.error('[Payments] Error creating payment link:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create payment link',
        });
    }
});
/**
 * Process refund
 */
router.post('/refund', async (req, res) => {
    try {
        const { paymentIntentId, amount, reason } = req.body;
        if (!paymentIntentId) {
            return res.status(400).json({
                success: false,
                error: 'paymentIntentId is required',
            });
        }
        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(500).json({
                success: false,
                error: 'Stripe is not configured',
            });
        }
        const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: amount ? Math.round(amount) : undefined, // Full refund if no amount
            reason: reason || undefined,
        });
        console.log(`[Payments] Created refund: ${refund.id} for ${paymentIntentId}`);
        res.json({
            success: true,
            refundId: refund.id,
            amount: refund.amount / 100,
            status: refund.status,
        });
    }
    catch (error) {
        console.error('[Payments] Error creating refund:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create refund',
        });
    }
});
/**
 * Stripe webhook handler
 */
router.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.warn('[Payments] Webhook secret not configured');
        return res.status(400).json({ error: 'Webhook secret not configured' });
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
    catch (err) {
        console.error('[Payments] Webhook signature verification failed:', err);
        return res.status(400).json({ error: 'Invalid signature' });
    }
    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log(`[Payments] Payment succeeded: ${paymentIntent.id}`);
            // TODO: Update booking status, send confirmation email, etc.
            break;
        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            console.log(`[Payments] Payment failed: ${failedPayment.id}`);
            // TODO: Notify user, update booking status
            break;
        case 'charge.refunded':
            const refund = event.data.object;
            console.log(`[Payments] Refund processed: ${refund.id}`);
            // TODO: Update booking status
            break;
        default:
            console.log(`[Payments] Unhandled event type: ${event.type}`);
    }
    res.json({ received: true });
});
/**
 * Check Stripe configuration status
 */
router.get('/config-status', (req, res) => {
    const hasSecretKey = !!process.env.STRIPE_SECRET_KEY;
    const hasPublishableKey = !!process.env.VITE_STRIPE_PUBLISHABLE_KEY;
    const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET;
    res.json({
        configured: hasSecretKey,
        details: {
            secretKey: hasSecretKey ? 'configured' : 'missing',
            publishableKey: hasPublishableKey ? 'configured' : 'missing',
            webhookSecret: hasWebhookSecret ? 'configured' : 'missing',
        },
    });
});
export default router;
//# sourceMappingURL=payments.js.map