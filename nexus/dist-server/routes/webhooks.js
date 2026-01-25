import { Router } from 'express';
import { Webhook } from 'svix';
import { userProfileService } from '../services/userProfile.js';
const router = Router();
// Clerk webhook secret - get from Clerk Dashboard
const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
/**
 * Clerk Webhook Handler
 * Syncs user data from Clerk to Supabase user_profiles table
 *
 * Events handled:
 * - user.created: Create new user_profile
 * - user.updated: Update existing user_profile
 * - user.deleted: Soft delete or remove user_profile
 */
router.post('/clerk', async (req, res) => {
    // Get the headers
    const svix_id = req.headers['svix-id'];
    const svix_timestamp = req.headers['svix-timestamp'];
    const svix_signature = req.headers['svix-signature'];
    // If webhook secret not configured, log warning but process anyway in dev
    if (!CLERK_WEBHOOK_SECRET) {
        console.warn('⚠️ CLERK_WEBHOOK_SECRET not configured - skipping signature verification');
    }
    else {
        // Verify the webhook signature
        if (!svix_id || !svix_timestamp || !svix_signature) {
            return res.status(400).json({ error: 'Missing svix headers' });
        }
        try {
            const wh = new Webhook(CLERK_WEBHOOK_SECRET);
            wh.verify(JSON.stringify(req.body), {
                'svix-id': svix_id,
                'svix-timestamp': svix_timestamp,
                'svix-signature': svix_signature,
            });
        }
        catch (err) {
            console.error('❌ Webhook signature verification failed:', err);
            return res.status(400).json({ error: 'Invalid signature' });
        }
    }
    const event = req.body;
    console.log(`📨 Clerk webhook received: ${event.type}`);
    try {
        switch (event.type) {
            case 'user.created': {
                const primaryEmail = event.data.email_addresses[0]?.email_address;
                if (!primaryEmail) {
                    console.error('No email found for new user');
                    return res.status(400).json({ error: 'No email found' });
                }
                await userProfileService.createProfile({
                    clerk_user_id: event.data.id,
                    email: primaryEmail,
                    full_name: [event.data.first_name, event.data.last_name]
                        .filter(Boolean)
                        .join(' ') || null,
                    avatar_url: event.data.image_url,
                });
                console.log(`✅ Created user profile for ${primaryEmail}`);
                break;
            }
            case 'user.updated': {
                const primaryEmail = event.data.email_addresses[0]?.email_address;
                if (!primaryEmail) {
                    console.error('No email found for updated user');
                    return res.status(400).json({ error: 'No email found' });
                }
                await userProfileService.updateProfile(event.data.id, {
                    email: primaryEmail,
                    full_name: [event.data.first_name, event.data.last_name]
                        .filter(Boolean)
                        .join(' ') || null,
                    avatar_url: event.data.image_url,
                });
                console.log(`✅ Updated user profile for ${primaryEmail}`);
                break;
            }
            case 'user.deleted': {
                await userProfileService.deleteProfile(event.data.id);
                console.log(`✅ Deleted user profile for Clerk ID: ${event.data.id}`);
                break;
            }
            default:
                console.log(`ℹ️ Unhandled webhook event type: ${event.type}`);
        }
        res.status(200).json({ success: true });
    }
    catch (error) {
        console.error('❌ Error processing webhook:', error);
        res.status(500).json({ error: 'Failed to process webhook' });
    }
});
export default router;
//# sourceMappingURL=webhooks.js.map