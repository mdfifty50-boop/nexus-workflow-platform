import type { VercelRequest, VercelResponse } from '@vercel/node'

interface EmailRequest {
  to: string | string[]
  subject: string
  body: string
  from?: string
  replyTo?: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      return res.status(500).json({
        success: false,
        error: 'Email service not configured',
        hint: 'Add RESEND_API_KEY to your Vercel environment variables. Get a free key at https://resend.com',
      })
    }

    const body: EmailRequest = req.body
    const { to, subject, body: emailBody, from, replyTo } = body

    // Validate required fields
    if (!to || !subject || !emailBody) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, body',
      })
    }

    // Build Resend request
    const resendBody: any = {
      from: from || 'Nexus Platform <onboarding@resend.dev>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html: emailBody,
    }

    if (replyTo) {
      resendBody.reply_to = replyTo
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendBody),
    })

    const result = await response.json()

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: result.message || 'Failed to send email',
        details: result,
      })
    }

    return res.status(200).json({
      success: true,
      emailId: result.id,
      message: 'Email sent successfully',
      to: Array.isArray(to) ? to : [to],
      subject,
      sentAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Email API error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send email',
    })
  }
}
