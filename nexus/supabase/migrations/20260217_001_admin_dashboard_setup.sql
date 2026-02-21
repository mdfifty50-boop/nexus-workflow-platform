-- Migration: Admin Dashboard Setup (Adapted for production schema)
-- Purpose: Add role + last_active_at columns to users table,
--          create analytics_events table, set CEO as admin
-- Date: 2026-02-17
--
-- PRODUCTION NOTE: The production database has a `users` table (not user_profiles)
-- with columns: id (uuid), email, full_name, avatar_url, created_at, updated_at,
-- preferred_language, timezone, metadata (jsonb).
-- Other tables (chat_conversations, user_workflows) use clerk_user_id (text).

-- ============================================================================
-- 1. ADD COLUMNS TO USERS TABLE
-- ============================================================================

-- Role column for admin dashboard auth
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Add CHECK constraint separately (IF NOT EXISTS not supported for constraints)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'user', 'viewer'));
  END IF;
END $$;

-- Last active tracking for activity metrics
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

-- Clerk user ID to link with chat_conversations, user_workflows, etc.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_last_active_at ON users(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================================
-- 2. SET CEO ACCOUNT AS ADMIN
-- ============================================================================

UPDATE users
SET role = 'admin'
WHERE email = 'nexus.agii@gmail.com';

-- ============================================================================
-- 3. CREATE ANALYTICS_EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference (nullable for anonymous events)
  clerk_user_id TEXT,

  -- Event data
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,

  -- Context
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  session_id TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_clerk_user_id
  ON analytics_events(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type
  ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at
  ON analytics_events(created_at DESC);

-- ============================================================================
-- 4. CREATE USER_BUSINESS_PROFILES TABLE (for AI insights)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT,
  user_id UUID REFERENCES users(id),
  industry TEXT,
  company_name TEXT,
  company_size TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_business_profiles_clerk_user_id
  ON user_business_profiles(clerk_user_id);

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN users.role IS 'User role: admin, user, or viewer. Used by admin dashboard auth.';
COMMENT ON COLUMN users.last_active_at IS 'Last user activity timestamp for admin analytics.';
COMMENT ON COLUMN users.clerk_user_id IS 'Clerk authentication user ID linking to chat/workflow tables.';
COMMENT ON TABLE analytics_events IS 'Client-side analytics events for admin dashboard metrics.';
COMMENT ON TABLE user_business_profiles IS 'User business profile data for AI insights and segmentation.';
