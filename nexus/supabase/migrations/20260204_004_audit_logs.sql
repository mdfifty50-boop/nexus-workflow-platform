-- Migration: Audit Logs Table
-- Plan 2: Admin Dashboard - Real Analytics
-- Date: 2026-02-04
--
-- Purpose: Track all user actions for admin audit log
-- Security: All access through server API using service_role key
--           RLS is disabled since server handles authorization

-- ============================================================================
-- AUDIT LOGS TABLE
-- Stores all trackable user actions for compliance and monitoring
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Timestamps
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- User who performed the action (references user_profiles)
  user_id TEXT NOT NULL,
  user_name TEXT,
  user_email TEXT,

  -- Action details
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  details TEXT,

  -- Request metadata
  ip_address TEXT,
  user_agent TEXT,

  -- Outcome
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failure', 'warning')),

  -- Additional context (JSONB for flexibility)
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp
  ON audit_logs(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
  ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_audit_logs_status
  ON audit_logs(status);

-- Composite index for filtered queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp
  ON audit_logs(user_id, timestamp DESC);

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE audit_logs IS 'Audit log for tracking user actions (Plan 2: Admin Dashboard)';
COMMENT ON COLUMN audit_logs.user_id IS 'Clerk user ID of the actor';
COMMENT ON COLUMN audit_logs.action IS 'Action type (e.g., workflow.create, user.login)';
COMMENT ON COLUMN audit_logs.resource IS 'Resource type affected (e.g., workflow, user, settings)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the specific resource affected';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context in JSONB format';
