/**
 * EmailService - Centralized email sending for Nexus
 *
 * @NEXUS-FIX-110: Welcome email system - DO NOT REMOVE
 *
 * Uses Resend API for transactional emails.
 * Free tier: 3,000 emails/month, 100 emails/day
 */

import { logger } from '../utils/logger';

// Email configuration
const RESEND_API_URL = 'https://api.resend.com/emails';
// Use Resend's shared domain for now (free tier)
// Update to your own domain once verified: 'Nexus <welcome@yourdomain.com>'
const DEFAULT_FROM = 'Nexus <onboarding@resend.dev>';

// Types
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export interface WelcomeEmailData {
  email: string;
  fullName?: string;
  userId: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Get the Resend API key from environment
 */
function getApiKey(): string | null {
  return process.env.RESEND_API_KEY || null;
}

/**
 * Send an email via Resend API
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const apiKey = getApiKey();

  if (!apiKey) {
    logger.error('[EmailService] RESEND_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options.from || DEFAULT_FROM,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo,
        tags: options.tags,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('[EmailService] Resend API error:', errorData);
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}`
      };
    }

    const data = await response.json();
    logger.info('[EmailService] Email sent successfully:', data.id);

    return { success: true, messageId: data.id };
  } catch (error) {
    logger.error('[EmailService] Failed to send email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate the welcome email HTML template
 */
function generateWelcomeEmailHtml(data: WelcomeEmailData): string {
  const firstName = data.fullName?.split(' ')[0] || 'there';
  const loginUrl = process.env.VITE_APP_URL || 'https://app.nexus-app.com';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Nexus</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0f; color: #ffffff;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0a0a0f;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 255, 255, 0.1);">

          <!-- Header with Logo -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid rgba(0, 255, 255, 0.1);">
              <div style="display: inline-block; background: linear-gradient(135deg, #00ffff, #0080ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 36px; font-weight: 800; letter-spacing: -1px;">
                NEXUS
              </div>
              <p style="margin: 8px 0 0; color: #64748b; font-size: 14px;">AI-Powered Workflow Automation</p>
            </td>
          </tr>

          <!-- Welcome Message -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 20px; font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #00ffff, #ffffff); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                Welcome to Nexus, ${firstName}! 🎉
              </h1>

              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #cbd5e1;">
                You've just unlocked the power of AI-driven automation. Nexus transforms the way you work by letting you describe what you need in plain language — and we build the automation for you.
              </p>

              <!-- Account Info Box -->
              <div style="background: rgba(0, 255, 255, 0.05); border: 1px solid rgba(0, 255, 255, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #00ffff;">Your Account</p>
                <p style="margin: 0; font-size: 18px; font-weight: 600; color: #ffffff;">${data.email}</p>
              </div>

              <!-- Features Section -->
              <h2 style="margin: 0 0 20px; font-size: 18px; font-weight: 600; color: #ffffff;">What You Can Do with Nexus:</h2>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <!-- Feature 1 -->
                <tr>
                  <td style="padding: 12px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width: 50px; vertical-align: top;">
                          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #00ffff, #0080ff); border-radius: 10px; text-align: center; line-height: 40px; font-size: 20px;">🤖</div>
                        </td>
                        <td style="vertical-align: top; padding-left: 12px;">
                          <p style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: #ffffff;">AI Workflow Builder</p>
                          <p style="margin: 0; font-size: 14px; color: #94a3b8;">Describe your automation in plain English. Nexus understands and builds it for you.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Feature 2 -->
                <tr>
                  <td style="padding: 12px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width: 50px; vertical-align: top;">
                          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #8b5cf6, #d946ef); border-radius: 10px; text-align: center; line-height: 40px; font-size: 20px;">🔗</div>
                        </td>
                        <td style="vertical-align: top; padding-left: 12px;">
                          <p style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: #ffffff;">500+ App Integrations</p>
                          <p style="margin: 0; font-size: 14px; color: #94a3b8;">Connect Gmail, Slack, Dropbox, Google Sheets, HubSpot, Stripe, and hundreds more.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Feature 3 -->
                <tr>
                  <td style="padding: 12px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width: 50px; vertical-align: top;">
                          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #10b981, #34d399); border-radius: 10px; text-align: center; line-height: 40px; font-size: 20px;">🎤</div>
                        </td>
                        <td style="vertical-align: top; padding-left: 12px;">
                          <p style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: #ffffff;">Voice Commands</p>
                          <p style="margin: 0; font-size: 14px; color: #94a3b8;">Speak your workflows into existence. Full Arabic & English support.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Feature 4 -->
                <tr>
                  <td style="padding: 12px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width: 50px; vertical-align: top;">
                          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #f59e0b, #fbbf24); border-radius: 10px; text-align: center; line-height: 40px; font-size: 20px;">⚡</div>
                        </td>
                        <td style="vertical-align: top; padding-left: 12px;">
                          <p style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: #ffffff;">One-Click Execution</p>
                          <p style="margin: 0; font-size: 14px; color: #94a3b8;">Connect your apps once, then run any workflow with a single click.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0 30px;">
                <a href="${loginUrl}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #00ffff, #0080ff); color: #000000; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 40px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0, 255, 255, 0.3);">
                  Open Nexus Dashboard →
                </a>
              </div>

              <!-- Getting Started Tips -->
              <div style="background: rgba(255, 255, 255, 0.03); border-radius: 12px; padding: 20px; margin-top: 20px;">
                <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #00ffff;">💡 Quick Start Tips:</p>
                <ol style="margin: 0; padding-left: 20px; font-size: 14px; color: #94a3b8; line-height: 1.8;">
                  <li>Click the chat icon and describe your first automation</li>
                  <li>Connect your apps when prompted (takes 10 seconds)</li>
                  <li>Hit "Run" and watch the magic happen</li>
                </ol>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background: rgba(0, 0, 0, 0.2); border-top: 1px solid rgba(0, 255, 255, 0.1);">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px; font-size: 14px; color: #64748b;">Need help? Reply to this email or visit our docs.</p>
                    <p style="margin: 0; font-size: 12px; color: #475569;">
                      © ${new Date().getFullYear()} Nexus AI. All rights reserved.
                    </p>
                  </td>
                  <td style="text-align: right;">
                    <a href="${loginUrl}/settings" style="font-size: 12px; color: #64748b; text-decoration: none;">Unsubscribe</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of welcome email
 */
function generateWelcomeEmailText(data: WelcomeEmailData): string {
  const firstName = data.fullName?.split(' ')[0] || 'there';
  const loginUrl = process.env.VITE_APP_URL || 'https://app.nexus-app.com';

  return `
Welcome to Nexus, ${firstName}! 🎉

You've just unlocked the power of AI-driven automation.

YOUR ACCOUNT
------------
Email: ${data.email}

WHAT YOU CAN DO WITH NEXUS
--------------------------

🤖 AI Workflow Builder
Describe your automation in plain English. Nexus understands and builds it for you.

🔗 500+ App Integrations
Connect Gmail, Slack, Dropbox, Google Sheets, HubSpot, Stripe, and hundreds more.

🎤 Voice Commands
Speak your workflows into existence. Full Arabic & English support.

⚡ One-Click Execution
Connect your apps once, then run any workflow with a single click.

GET STARTED
-----------
Open your dashboard: ${loginUrl}/dashboard

QUICK START TIPS
----------------
1. Click the chat icon and describe your first automation
2. Connect your apps when prompted (takes 10 seconds)
3. Hit "Run" and watch the magic happen

Need help? Reply to this email or visit our docs.

© ${new Date().getFullYear()} Nexus AI. All rights reserved.
  `.trim();
}

/**
 * Send welcome email to a new user
 *
 * @NEXUS-FIX-110: Welcome email system
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<EmailResult> {
  logger.info('[EmailService] Sending welcome email to:', data.email);

  const result = await sendEmail({
    to: data.email,
    subject: '🎉 Welcome to Nexus - Your AI Automation Journey Starts Now!',
    html: generateWelcomeEmailHtml(data),
    text: generateWelcomeEmailText(data),
    tags: [
      { name: 'type', value: 'welcome' },
      { name: 'user_id', value: data.userId },
    ],
  });

  if (result.success) {
    logger.info('[EmailService] Welcome email sent successfully:', result.messageId);
  } else {
    logger.error('[EmailService] Failed to send welcome email:', result.error);
  }

  return result;
}

/**
 * Check if email service is configured
 */
export function isEmailServiceConfigured(): boolean {
  return !!getApiKey();
}

// Export service object for convenience
export const emailService = {
  send: sendEmail,
  sendWelcome: sendWelcomeEmail,
  isConfigured: isEmailServiceConfigured,
};

export default emailService;
