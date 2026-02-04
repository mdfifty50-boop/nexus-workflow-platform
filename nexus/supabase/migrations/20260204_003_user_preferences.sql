-- Migration: User Preferences Table
-- Plan B: User Account System - Phase 1.3: User Preferences
-- Date: 2026-02-04
--
-- Purpose: Unified storage for all user settings (theme, notifications, etc.)
-- Design: Single JSONB column for flexible preferences + indexed fields for common queries
-- Security: Server-side access via service_role key (RLS disabled)

-- ============================================================================
-- USER PREFERENCES TABLE
-- Stores all user settings in one place for cross-device sync
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  -- Primary key is the Clerk user ID (one row per user)
  clerk_user_id TEXT PRIMARY KEY,

  -- Appearance settings (indexed for potential filtering)
  theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'system')),
  accent_color TEXT DEFAULT 'nexus',
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'Asia/Kuwait',

  -- Notification preferences
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT false,
  workflow_alerts BOOLEAN DEFAULT true,

  -- Privacy settings
  analytics_enabled BOOLEAN DEFAULT true,
  share_usage_data BOOLEAN DEFAULT false,

  -- Workflow defaults (what to apply when creating workflows)
  workflow_defaults JSONB DEFAULT '{
    "autoExecute": false,
    "defaultTimeout": 30000,
    "retryCount": 3
  }'::jsonb,

  -- Voice/AI preferences
  voice_preferences JSONB DEFAULT '{
    "provider": "elevenlabs",
    "voiceId": null,
    "speed": 1.0,
    "autoTranscribe": true
  }'::jsonb,

  -- Accessibility settings
  accessibility JSONB DEFAULT '{
    "reduceMotion": false,
    "highContrast": false,
    "fontSize": "medium",
    "screenReader": false
  }'::jsonb,

  -- Flexible extension field for future settings
  custom_settings JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index on theme for potential analytics queries
CREATE INDEX IF NOT EXISTS idx_user_preferences_theme
  ON user_preferences(theme);

-- Index on language for potential analytics
CREATE INDEX IF NOT EXISTS idx_user_preferences_language
  ON user_preferences(language);

-- ============================================================================
-- AUTOMATIC UPDATED_AT TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_updated_at_column();

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE user_preferences IS 'User preferences for cross-device sync (Plan B: User Account System Phase 1.3)';
COMMENT ON COLUMN user_preferences.clerk_user_id IS 'Clerk user ID - one row per user';
COMMENT ON COLUMN user_preferences.workflow_defaults IS 'Default settings for new workflows';
COMMENT ON COLUMN user_preferences.voice_preferences IS 'Voice/TTS settings for AI interactions';
COMMENT ON COLUMN user_preferences.accessibility IS 'Accessibility settings (motion, contrast, etc.)';
COMMENT ON COLUMN user_preferences.custom_settings IS 'Flexible JSONB for future settings';
