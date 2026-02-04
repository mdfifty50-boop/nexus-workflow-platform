-- Migration: Add welcome email tracking fields
-- @NEXUS-FIX-110: Welcome email system tracking
-- Created: 2026-02-04

-- Add welcome email tracking columns to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ;

-- Create index for finding users who haven't received welcome emails
CREATE INDEX IF NOT EXISTS idx_user_profiles_welcome_email
ON user_profiles (welcome_email_sent)
WHERE welcome_email_sent = FALSE;

-- Create email_logs table for tracking all sent emails
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  email_address TEXT NOT NULL,
  email_type TEXT NOT NULL, -- 'welcome', 'notification', 'workflow', etc.
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'delivered', 'bounced', 'failed'
  message_id TEXT, -- Resend message ID
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying email logs by user
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs (email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs (created_at DESC);

-- Enable RLS on email_logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own email logs
CREATE POLICY "Users can view own email logs"
ON email_logs
FOR SELECT
USING (
  user_id = (SELECT clerk_user_id FROM user_profiles WHERE id = auth.uid())
);

-- Policy: Service role can insert/update email logs
CREATE POLICY "Service role can manage email logs"
ON email_logs
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Comment on table
COMMENT ON TABLE email_logs IS 'Tracks all transactional emails sent by Nexus';
COMMENT ON COLUMN email_logs.email_type IS 'Type of email: welcome, notification, workflow, marketing';
COMMENT ON COLUMN email_logs.message_id IS 'External message ID from email provider (Resend)';
