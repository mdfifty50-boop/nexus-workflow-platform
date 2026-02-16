-- Migration: User Business Profiles & User Contexts tables
-- Purpose: Supabase persistence for business profile (onboarding) and user context (auto-inferred)
-- Pattern: Matches user_preferences dual-write pattern (localStorage + cloud sync)
-- Date: 2026-02-15

-- ============================================================================
-- USER BUSINESS PROFILES TABLE
-- Stores onboarding wizard output (industry, role, priorities, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_business_profiles (
  clerk_user_id TEXT PRIMARY KEY,

  -- Basic profile fields (from onboarding wizard)
  business_name TEXT,
  industry TEXT,
  company_size TEXT,
  primary_role TEXT,
  timezone TEXT,

  -- Array/JSONB fields
  automation_priorities JSONB DEFAULT '[]'::jsonb,
  pain_points JSONB DEFAULT '[]'::jsonb,

  -- Industry-specific sub-objects
  ecommerce_fields JSONB DEFAULT '{"platform": null, "orderVolume": null}'::jsonb,
  saas_fields JSONB DEFAULT '{"userBaseSize": null, "techStack": []}'::jsonb,
  agency_fields JSONB DEFAULT '{"clientCount": null, "serviceTypes": []}'::jsonb,
  custom_industry_description TEXT DEFAULT '',

  -- Goals
  time_savings_goal TEXT,
  budget_range TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- USER CONTEXTS TABLE
-- Stores auto-inferred context (emails, channels, preferences, regional data)
-- Uses single JSONB column — the UserContext interface is deeply nested
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_contexts (
  clerk_user_id TEXT PRIMARY KEY,
  context_data JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- Server uses service_role key (bypasses RLS), but enable for defense-in-depth
-- ============================================================================

ALTER TABLE user_business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_contexts ENABLE ROW LEVEL SECURITY;

-- Service role can do anything (server-side access pattern)
CREATE POLICY "Service role full access to business profiles" ON user_business_profiles
  FOR ALL
  USING (current_setting('role', true) = 'service_role');

CREATE POLICY "Service role full access to user contexts" ON user_contexts
  FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- ============================================================================
-- AUTO-UPDATE TRIGGERS
-- ============================================================================

-- Reuse existing update_updated_at_column() or create if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_business_profiles_updated_at
  BEFORE UPDATE ON user_business_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_contexts_updated_at
  BEFORE UPDATE ON user_contexts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE user_business_profiles IS 'Business profile from onboarding wizard — persisted for cross-device sync';
COMMENT ON TABLE user_contexts IS 'Auto-inferred user context (emails, channels, regional defaults) — JSONB store';
COMMENT ON COLUMN user_business_profiles.automation_priorities IS 'JSONB array of automation priority strings';
COMMENT ON COLUMN user_business_profiles.pain_points IS 'JSONB array of pain point strings';
COMMENT ON COLUMN user_contexts.context_data IS 'Full UserContext object stored as JSONB';
