import { Router, Request, Response } from 'express'
import { Webhook } from 'svix'
import { userProfileService } from '../services/userProfile.js'
// @NEXUS-FIX-110: Welcome email system - DO NOT REMOVE
import { sendWelcomeEmail, isEmailServiceConfigured } from '../services/EmailService.js'

const router = Router()

// Clerk webhook secret - get from Clerk Dashboard
const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

interface ClerkWebhookEvent {
  type: string
  data: {
    id: string
    email_addresses: Array<{ email_address: string; id: string }>
    first_name: string | null
    last_name: string | null
    image_url: string | null
    created_at: number
    updated_at: number
  }
}

/**
 * Clerk Webhook Handler
 * Syncs user data from Clerk to Supabase user_profiles table
 *
 * Events handled:
 * - user.created: Create new user_profile
 * - user.updated: Update existing user_profile
 * - user.deleted: Soft delete or remove user_profile
 */
router.post('/clerk', async (req: Request, res: Response) => {
  // Get the headers
  const svix_id = req.headers['svix-id'] as string
  const svix_timestamp = req.headers['svix-timestamp'] as string
  const svix_signature = req.headers['svix-signature'] as string

  // If webhook secret not configured, log warning but process anyway in dev
  if (!CLERK_WEBHOOK_SECRET) {
    console.warn('⚠️ CLERK_WEBHOOK_SECRET not configured - skipping signature verification')
  } else {
    // Verify the webhook signature
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return res.status(400).json({ error: 'Missing svix headers' })
    }

    try {
      const wh = new Webhook(CLERK_WEBHOOK_SECRET)
      wh.verify(JSON.stringify(req.body), {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      })
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err)
      return res.status(400).json({ error: 'Invalid signature' })
    }
  }

  const event = req.body as ClerkWebhookEvent
  console.log(`📨 Clerk webhook received: ${event.type}`)

  try {
    switch (event.type) {
      case 'user.created': {
        const primaryEmail = event.data.email_addresses[0]?.email_address
        if (!primaryEmail) {
          console.error('No email found for new user')
          return res.status(400).json({ error: 'No email found' })
        }

        const fullName = [event.data.first_name, event.data.last_name]
          .filter(Boolean)
          .join(' ') || null

        await userProfileService.createProfile({
          clerk_user_id: event.data.id,
          email: primaryEmail,
          full_name: fullName,
          avatar_url: event.data.image_url,
        })

        console.log(`✅ Created user profile for ${primaryEmail}`)

        // @NEXUS-FIX-110: Send welcome email to new users - DO NOT REMOVE
        if (isEmailServiceConfigured()) {
          try {
            const emailResult = await sendWelcomeEmail({
              email: primaryEmail,
              fullName: fullName || undefined,
              userId: event.data.id,
            })

            if (emailResult.success) {
              console.log(`📧 Welcome email sent to ${primaryEmail}`)
              // Update user profile to mark welcome email as sent
              await userProfileService.updateProfile(event.data.id, {
                welcome_email_sent: true,
                welcome_email_sent_at: new Date().toISOString(),
              })
            } else {
              console.error(`❌ Failed to send welcome email: ${emailResult.error}`)
            }
          } catch (emailError) {
            // Don't fail the webhook if email fails - user is still created
            console.error('❌ Welcome email error (non-fatal):', emailError)
          }
        } else {
          console.warn('⚠️ Email service not configured - skipping welcome email')
        }

        break
      }

      case 'user.updated': {
        const primaryEmail = event.data.email_addresses[0]?.email_address
        if (!primaryEmail) {
          console.error('No email found for updated user')
          return res.status(400).json({ error: 'No email found' })
        }

        await userProfileService.updateProfile(event.data.id, {
          email: primaryEmail,
          full_name: [event.data.first_name, event.data.last_name]
            .filter(Boolean)
            .join(' ') || null,
          avatar_url: event.data.image_url,
        })

        console.log(`✅ Updated user profile for ${primaryEmail}`)
        break
      }

      case 'user.deleted': {
        await userProfileService.deleteProfile(event.data.id)
        console.log(`✅ Deleted user profile for Clerk ID: ${event.data.id}`)
        break
      }

      default:
        console.log(`ℹ️ Unhandled webhook event type: ${event.type}`)
    }

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('❌ Error processing webhook:', error)
    res.status(500).json({ error: 'Failed to process webhook' })
  }
})

export default router
