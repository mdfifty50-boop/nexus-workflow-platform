-- Migration: Create user_profiles table
-- Epic 1, Story 1.4: User Profile Creation & Cross-Project Intelligence Backend
-- Date: 2026-01-07

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table for cross-project intelligence metadata
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Clerk user ID (external reference)
  clerk_user_id TEXT UNIQUE NOT NULL,

  -- Basic profile info (synced from Clerk)
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,

  -- Cross-project intelligence metadata (FR-8.1 to FR-8.4)
  -- Thinking patterns: How user prefers AI to think
  thinking_patterns JSONB DEFAULT '{
    "prefers_detailed_plans": true,
    "quick_execution_tolerance": 0.5,
    "explanation_depth": "moderate"
  }'::jsonb,

  -- Behavior patterns: User interaction habits
  behavior_patterns JSONB DEFAULT '{
    "typical_workflow_complexity": "medium",
    "average_approval_time_seconds": 30,
    "preferred_confirmation_level": "balanced"
  }'::jsonb,

  -- Emotional responses: What delights/frustrates the user
  emotional_responses JSONB DEFAULT '{
    "frustrated_by": [],
    "delighted_by": [],
    "communication_style": "professional"
  }'::jsonb,

  -- User preferences
  preferences JSONB DEFAULT '{
    "theme": "system",
    "notifications_enabled": true,
    "email_notifications": true,
    "language": "en"
  }'::jsonb,

  -- Privacy settings (FR-8.8)
  privacy_settings JSONB DEFAULT '{
    "allow_personalization": true,
    "allow_cross_project_learning": true,
    "data_retention_days": 365
  }'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups by clerk_user_id
CREATE INDEX IF NOT EXISTS idx_user_profiles_clerk_user_id ON user_profiles(clerk_user_id);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT
  USING (clerk_user_id = current_setting('app.current_user_id', true));

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE
  USING (clerk_user_id = current_setting('app.current_user_id', true));

-- Policy: Service role can do anything (for webhooks)
CREATE POLICY "Service role full access" ON user_profiles
  FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE user_profiles IS 'Cross-project user intelligence and preferences (FR-8.1 to FR-8.8)';
COMMENT ON COLUMN user_profiles.thinking_patterns IS 'AI thinking preferences - detailed plans vs quick execution';
COMMENT ON COLUMN user_profiles.behavior_patterns IS 'User interaction habits - workflow complexity, approval time';
COMMENT ON COLUMN user_profiles.emotional_responses IS 'What frustrates or delights the user';
COMMENT ON COLUMN user_profiles.privacy_settings IS 'User privacy controls for personalization data';
