/**
 * Subscriptions API Routes - Server-Side Stripe Subscription Management
 *
 * Handles all subscription-related operations:
 * - Creating checkout sessions for new subscriptions
 * - Managing billing portal sessions
 * - Webhook handling for subscription events
 * - Subscription status queries
 *
 * Environment Variables Required:
 * - STRIPE_SECRET_KEY: Your Stripe secret key
 * - STRIPE_WEBHOOK_SECRET: Webhook signing secret
 * - VITE_STRIPE_LAUNCH_PRICE_ID: Price ID for launch special ($79)
 * - VITE_STRIPE_STANDARD_PRICE_ID: Price ID for standard plan ($99)
 */
import { Router } from 'express';
import Stripe from 'stripe';
const router = Router();
// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-12-18.acacia',
});
const userSubscriptions = new Map();
// =============================================================================
// HELPERS
// =============================================================================
/**
 * Get or create Stripe customer for a user
 */
async function getOrCreateCustomer(userId, email, name) {
    // Check local cache first
    const cached = userSubscriptions.get(userId);
    if (cached?.stripeCustomerId) {
        return cached.stripeCustomerId;
    }
    // Check if customer exists in Stripe
    const existingCustomers = await stripe.customers.list({
        email,
        limit: 1,
    });
    if (existingCustomers.data.length > 0) {
        const customerId = existingCustomers.data[0].id;
        userSubscriptions.set(userId, {
            stripeCustomerId: customerId,
            subscriptionId: null,
            status: 'none',
            priceId: null,
            currentPeriodStart: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
            canceledAt: null,
        });
        return customerId;
    }
    // Create new customer
    const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
            userId,
            source: 'nexus',
        },
    });
    userSubscriptions.set(userId, {
        stripeCustomerId: customer.id,
        subscriptionId: null,
        status: 'none',
        priceId: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        canceledAt: null,
    });
    return customer.id;
}
/**
 * Calculate days remaining in subscription period
 */
function calculateDaysRemaining(periodEnd) {
    const now = new Date();
    const end = new Date(periodEnd);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
}
// =============================================================================
// CHECKOUT SESSION
// =============================================================================
/**
 * Create a Stripe Checkout session for subscription
 */
router.post('/create-checkout-session', async (req, res) => {
    try {
        const { priceId, successUrl, cancelUrl, customerId, customerEmail, metadata = {}, } = req.body;
        if (!priceId) {
            return res.status(400).json({
                success: false,
                error: 'Price ID is required',
            });
        }
        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(500).json({
                success: false,
                error: 'Stripe is not configured',
            });
        }
        // Get or create customer if email provided
        let customer = customerId;
        if (!customer && customerEmail) {
            // For demo, we'll use the email as a pseudo user ID
            customer = await getOrCreateCustomer(customerEmail, customerEmail);
        }
        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            customer,
            customer_email: customer ? undefined : customerEmail,
            success_url: successUrl || `${req.headers.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl || `${req.headers.origin}/checkout/cancel`,
            metadata: {
                ...metadata,
                source: 'nexus',
            },
            subscription_data: {
                metadata: {
                    ...metadata,
                    source: 'nexus',
                },
            },
            allow_promotion_codes: true,
            billing_address_collection: 'required',
        });
        console.log(`[Subscriptions] Created checkout session: ${session.id}`);
        res.json({
            success: true,
            sessionId: session.id,
            url: session.url,
        });
    }
    catch (error) {
        console.error('[Subscriptions] Error creating checkout session:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create checkout session',
        });
    }
});
// =============================================================================
// BILLING PORTAL
// =============================================================================
/**
 * Create a billing portal session for subscription management
 */
router.post('/create-portal-session', async (req, res) => {
    try {
        const { returnUrl, customerId, customerEmail } = req.body;
        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(500).json({
                success: false,
                error: 'Stripe is not configured',
            });
        }
        // Get customer ID
        let customer = customerId;
        if (!customer && customerEmail) {
            const cached = userSubscriptions.get(customerEmail);
            customer = cached?.stripeCustomerId;
            if (!customer) {
                const existingCustomers = await stripe.customers.list({
                    email: customerEmail,
                    limit: 1,
                });
                if (existingCustomers.data.length > 0) {
                    customer = existingCustomers.data[0].id;
                }
            }
        }
        if (!customer) {
            return res.status(400).json({
                success: false,
                error: 'Customer not found',
            });
        }
        const session = await stripe.billingPortal.sessions.create({
            customer,
            return_url: returnUrl || `${req.headers.origin}/settings`,
        });
        console.log(`[Subscriptions] Created portal session for customer: ${customer}`);
        res.json({
            success: true,
            url: session.url,
        });
    }
    catch (error) {
        console.error('[Subscriptions] Error creating portal session:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create portal session',
        });
    }
});
// =============================================================================
// SUBSCRIPTION STATUS
// =============================================================================
/**
 * Get subscription status for current user
 */
router.get('/status', async (req, res) => {
    try {
        // In production, get user ID from auth middleware
        const customerEmail = req.query.email;
        if (!customerEmail) {
            return res.json({
                hasSubscription: false,
                subscription: null,
                isActive: false,
                isPastDue: false,
                isCanceled: false,
                isTrialing: false,
                daysRemaining: 0,
                canAccessFeatures: false,
            });
        }
        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(500).json({
                success: false,
                error: 'Stripe is not configured',
            });
        }
        // Find customer
        const customers = await stripe.customers.list({
            email: customerEmail,
            limit: 1,
            expand: ['data.subscriptions'],
        });
        if (customers.data.length === 0) {
            return res.json({
                hasSubscription: false,
                subscription: null,
                isActive: false,
                isPastDue: false,
                isCanceled: false,
                isTrialing: false,
                daysRemaining: 0,
                canAccessFeatures: false,
            });
        }
        const customer = customers.data[0];
        const subscriptions = customer.subscriptions?.data || [];
        if (subscriptions.length === 0) {
            return res.json({
                hasSubscription: false,
                subscription: null,
                isActive: false,
                isPastDue: false,
                isCanceled: false,
                isTrialing: false,
                daysRemaining: 0,
                canAccessFeatures: false,
            });
        }
        // Get the most recent active subscription
        const subscription = subscriptions.find((sub) => sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due') || subscriptions[0];
        const isActive = subscription.status === 'active' || subscription.status === 'trialing';
        const isPastDue = subscription.status === 'past_due';
        const isCanceled = subscription.cancel_at_period_end;
        const isTrialing = subscription.status === 'trialing';
        const periodEnd = new Date(subscription.current_period_end * 1000);
        const daysRemaining = calculateDaysRemaining(periodEnd);
        // Determine plan ID from price
        const priceId = subscription.items.data[0]?.price.id;
        let planId = 'unknown';
        if (priceId === process.env.VITE_STRIPE_LAUNCH_PRICE_ID) {
            planId = 'launch';
        }
        else if (priceId === process.env.VITE_STRIPE_STANDARD_PRICE_ID) {
            planId = 'standard';
        }
        res.json({
            hasSubscription: true,
            subscription: {
                id: subscription.id,
                status: subscription.status,
                planId,
                priceId,
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: periodEnd,
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                canceledAt: subscription.canceled_at
                    ? new Date(subscription.canceled_at * 1000)
                    : null,
                trialEnd: subscription.trial_end
                    ? new Date(subscription.trial_end * 1000)
                    : null,
            },
            isActive,
            isPastDue,
            isCanceled,
            isTrialing,
            daysRemaining,
            canAccessFeatures: isActive || isPastDue, // Grace period for past due
        });
    }
    catch (error) {
        console.error('[Subscriptions] Error getting status:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get subscription status',
        });
    }
});
// =============================================================================
// CANCEL SUBSCRIPTION
// =============================================================================
/**
 * Cancel subscription at period end
 */
router.post('/cancel', async (req, res) => {
    try {
        const { subscriptionId } = req.body;
        if (!subscriptionId) {
            return res.status(400).json({
                success: false,
                error: 'Subscription ID is required',
            });
        }
        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(500).json({
                success: false,
                error: 'Stripe is not configured',
            });
        }
        const subscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
        });
        console.log(`[Subscriptions] Canceled subscription: ${subscriptionId}`);
        res.json({
            success: true,
            subscription: {
                id: subscription.id,
                status: subscription.status,
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
        });
    }
    catch (error) {
        console.error('[Subscriptions] Error canceling subscription:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to cancel subscription',
        });
    }
});
/**
 * Reactivate a canceled subscription
 */
router.post('/reactivate', async (req, res) => {
    try {
        const { subscriptionId } = req.body;
        if (!subscriptionId) {
            return res.status(400).json({
                success: false,
                error: 'Subscription ID is required',
            });
        }
        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(500).json({
                success: false,
                error: 'Stripe is not configured',
            });
        }
        const subscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: false,
        });
        console.log(`[Subscriptions] Reactivated subscription: ${subscriptionId}`);
        res.json({
            success: true,
            subscription: {
                id: subscription.id,
                status: subscription.status,
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
        });
    }
    catch (error) {
        console.error('[Subscriptions] Error reactivating subscription:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to reactivate subscription',
        });
    }
});
// =============================================================================
// WEBHOOK HANDLER
// =============================================================================
/**
 * Handle Stripe webhook events
 */
router.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.warn('[Subscriptions] Webhook secret not configured');
        return res.status(400).json({ error: 'Webhook secret not configured' });
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
    catch (err) {
        console.error('[Subscriptions] Webhook signature verification failed:', err);
        return res.status(400).json({ error: 'Invalid signature' });
    }
    console.log(`[Subscriptions] Webhook received: ${event.type}`);
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                console.log(`[Subscriptions] Checkout completed: ${session.id}`);
                if (session.mode === 'subscription' && session.subscription) {
                    // Fetch the subscription to get full details
                    const subscription = await stripe.subscriptions.retrieve(session.subscription);
                    // Update local cache
                    const customerEmail = session.customer_email || session.customer_details?.email;
                    if (customerEmail) {
                        userSubscriptions.set(customerEmail, {
                            stripeCustomerId: session.customer,
                            subscriptionId: subscription.id,
                            status: subscription.status,
                            priceId: subscription.items.data[0]?.price.id || null,
                            currentPeriodStart: new Date(subscription.current_period_start * 1000),
                            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                            cancelAtPeriodEnd: subscription.cancel_at_period_end,
                            canceledAt: null,
                        });
                    }
                    // TODO: Update user record in database
                    // TODO: Send welcome email
                    console.log(`[Subscriptions] New subscription created: ${subscription.id}`);
                }
                break;
            }
            case 'customer.subscription.created': {
                const subscription = event.data.object;
                console.log(`[Subscriptions] Subscription created: ${subscription.id}`);
                // TODO: Update user record in database
                break;
            }
            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                console.log(`[Subscriptions] Subscription updated: ${subscription.id} - Status: ${subscription.status}`);
                // Update local cache
                const customer = await stripe.customers.retrieve(subscription.customer);
                if ('email' in customer && customer.email) {
                    userSubscriptions.set(customer.email, {
                        stripeCustomerId: subscription.customer,
                        subscriptionId: subscription.id,
                        status: subscription.status,
                        priceId: subscription.items.data[0]?.price.id || null,
                        currentPeriodStart: new Date(subscription.current_period_start * 1000),
                        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                        cancelAtPeriodEnd: subscription.cancel_at_period_end,
                        canceledAt: subscription.canceled_at
                            ? new Date(subscription.canceled_at * 1000)
                            : null,
                    });
                }
                // TODO: Update user record in database
                // TODO: Handle status changes (active, past_due, canceled, etc.)
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                console.log(`[Subscriptions] Subscription deleted: ${subscription.id}`);
                // Update local cache
                const customer = await stripe.customers.retrieve(subscription.customer);
                if ('email' in customer && customer.email) {
                    const existing = userSubscriptions.get(customer.email);
                    if (existing) {
                        existing.status = 'canceled';
                        existing.subscriptionId = null;
                        userSubscriptions.set(customer.email, existing);
                    }
                }
                // TODO: Update user record in database
                // TODO: Send cancellation email
                // TODO: Handle access revocation
                break;
            }
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object;
                console.log(`[Subscriptions] Invoice paid: ${invoice.id}`);
                // TODO: Update payment history
                // TODO: Send receipt email
                break;
            }
            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                console.log(`[Subscriptions] Invoice payment failed: ${invoice.id}`);
                // TODO: Update subscription status to past_due
                // TODO: Send payment failed email
                // TODO: Implement dunning sequence
                break;
            }
            default:
                console.log(`[Subscriptions] Unhandled event type: ${event.type}`);
        }
    }
    catch (err) {
        console.error(`[Subscriptions] Error handling webhook ${event.type}:`, err);
        // Don't return error - acknowledge receipt to Stripe
    }
    res.json({ received: true });
});
// =============================================================================
// CONFIGURATION STATUS
// =============================================================================
/**
 * Check subscription configuration status
 */
router.get('/config-status', (_req, res) => {
    const hasSecretKey = !!process.env.STRIPE_SECRET_KEY;
    const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET;
    const hasLaunchPrice = !!process.env.VITE_STRIPE_LAUNCH_PRICE_ID;
    const hasStandardPrice = !!process.env.VITE_STRIPE_STANDARD_PRICE_ID;
    res.json({
        configured: hasSecretKey,
        details: {
            secretKey: hasSecretKey ? 'configured' : 'missing',
            webhookSecret: hasWebhookSecret ? 'configured' : 'missing',
            launchPriceId: hasLaunchPrice ? 'configured' : 'missing',
            standardPriceId: hasStandardPrice ? 'configured' : 'missing',
        },
        mode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')
            ? 'live'
            : process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')
                ? 'test'
                : 'unknown',
    });
});
export default router;
//# sourceMappingURL=subscriptions.js.map