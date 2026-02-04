-- Migration: User Workflow Persistence Tables
-- Plan B: User Account System - Workflow History Persistence
-- Date: 2026-02-04
--
-- Purpose: Enable cross-device workflow persistence using Clerk user IDs
-- Design: Simpler than original workflows table, doesn't require project hierarchy
-- Security: All access through server API using service_role key
--           RLS is disabled since server handles authorization

-- ============================================================================
-- USER WORKFLOWS TABLE
-- Stores saved workflows for each user
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_workflows (
  -- Primary key - use TEXT to match frontend-generated IDs
  id TEXT PRIMARY KEY,

  -- User reference (using clerk_user_id to match chat_conversations)
  clerk_user_id TEXT NOT NULL,

  -- Workflow metadata
  name TEXT NOT NULL,
  description TEXT,
  workflow_type TEXT NOT NULL DEFAULT 'chat_generated',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'failed', 'archived')),

  -- Workflow definition (JSONB for flexibility)
  -- Stores: trigger node, action nodes, connections
  trigger_config JSONB,
  action_configs JSONB DEFAULT '[]'::jsonb,
  required_integrations TEXT[] DEFAULT '{}',
  estimated_time_saved TEXT,

  -- Execution tracking
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_workflows_clerk_user_id
  ON user_workflows(clerk_user_id);

CREATE INDEX IF NOT EXISTS idx_user_workflows_updated_at
  ON user_workflows(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_workflows_status
  ON user_workflows(status);

-- ============================================================================
-- USER WORKFLOW EXECUTIONS TABLE
-- Stores execution history for each workflow
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_workflow_executions (
  -- Primary key - use TEXT to match frontend-generated IDs
  id TEXT PRIMARY KEY,

  -- Foreign key to workflow (CASCADE delete for data cleanup)
  workflow_id TEXT NOT NULL REFERENCES user_workflows(id) ON DELETE CASCADE,

  -- Execution metadata
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,

  -- Execution data (inputs, outputs, step results)
  execution_data JSONB DEFAULT '{}'::jsonb,

  -- Usage tracking
  token_usage INTEGER DEFAULT 0,
  cost_usd DECIMAL(10, 4) DEFAULT 0,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_workflow_executions_workflow_id
  ON user_workflow_executions(workflow_id);

CREATE INDEX IF NOT EXISTS idx_user_workflow_executions_status
  ON user_workflow_executions(status);

CREATE INDEX IF NOT EXISTS idx_user_workflow_executions_created_at
  ON user_workflow_executions(created_at DESC);

-- ============================================================================
-- AUTOMATIC UPDATED_AT TRIGGER
-- ============================================================================

-- Trigger for user_workflows
DROP TRIGGER IF EXISTS update_user_workflows_updated_at ON user_workflows;
CREATE TRIGGER update_user_workflows_updated_at
  BEFORE UPDATE ON user_workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- Disabled: All access via server with service_role key
-- Server validates clerk_user_id before all operations
-- ============================================================================

-- RLS is intentionally NOT enabled for these tables
-- Access control is handled at the application layer

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE user_workflows IS 'User workflows for cross-device persistence (Plan B: User Account System)';
COMMENT ON COLUMN user_workflows.id IS 'Frontend-generated ID (timestamp-based)';
COMMENT ON COLUMN user_workflows.clerk_user_id IS 'Clerk user ID - links to chat_conversations';
COMMENT ON COLUMN user_workflows.trigger_config IS 'JSONB object with trigger node configuration';
COMMENT ON COLUMN user_workflows.action_configs IS 'JSONB array of action node configurations';
COMMENT ON COLUMN user_workflows.required_integrations IS 'Array of integration names (gmail, slack, etc.)';

COMMENT ON TABLE user_workflow_executions IS 'Execution history for user workflows';
COMMENT ON COLUMN user_workflow_executions.execution_data IS 'JSONB with inputs, outputs, and step results';
