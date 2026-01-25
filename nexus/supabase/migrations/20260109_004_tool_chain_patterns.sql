-- Tool Chain Patterns Migration
-- Epic 16, Story 16.3: Tool Chain Optimizer Agent
-- Created: 2026-01-09
--
-- This migration creates the tool_chain_patterns table for learning from
-- successful chain executions and improving future recommendations.

-- =============================================================================
-- Tool Chain Patterns Table
-- =============================================================================
-- Stores successful chain patterns for learning and future recommendations

CREATE TABLE IF NOT EXISTS tool_chain_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Pattern identification
  capability_signature TEXT NOT NULL,  -- Hash of sorted capabilities
  workflow_type TEXT,                  -- e.g., 'data-pipeline', 'notification'

  -- Chain data
  chain_steps JSONB NOT NULL,          -- Array of {toolId, toolName, capability, order}

  -- Success metrics
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  avg_execution_time_ms INTEGER,
  avg_cost_usd DECIMAL(10, 6),

  -- User preference tracking
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID,  -- References projects table if exists

  -- Usage tracking
  last_used_at TIMESTAMPTZ,

  -- Flexible metadata
  metadata JSONB DEFAULT '{}'
);

-- =============================================================================
-- Indexes for Performance
-- =============================================================================

-- Fast lookup by capability signature
CREATE INDEX idx_chain_patterns_capability ON tool_chain_patterns(capability_signature);

-- User-specific pattern queries
CREATE INDEX idx_chain_patterns_user ON tool_chain_patterns(user_id);

-- Project-specific pattern queries
CREATE INDEX idx_chain_patterns_project ON tool_chain_patterns(project_id);

-- Combined index for common query pattern
CREATE INDEX idx_chain_patterns_user_capability ON tool_chain_patterns(user_id, capability_signature);

-- Order by success rate
CREATE INDEX idx_chain_patterns_success ON tool_chain_patterns(success_count DESC);

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================

ALTER TABLE tool_chain_patterns ENABLE ROW LEVEL SECURITY;

-- Users can view patterns they created or global patterns (user_id IS NULL)
CREATE POLICY "Users can view own or global patterns"
  ON tool_chain_patterns
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR user_id IS NULL
  );

-- Users can insert their own patterns
CREATE POLICY "Users can insert own patterns"
  ON tool_chain_patterns
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR user_id IS NULL
  );

-- Users can update their own patterns
CREATE POLICY "Users can update own patterns"
  ON tool_chain_patterns
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own patterns
CREATE POLICY "Users can delete own patterns"
  ON tool_chain_patterns
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =============================================================================
-- Trigger for updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION update_chain_patterns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_chain_patterns_updated_at
  BEFORE UPDATE ON tool_chain_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_chain_patterns_updated_at();

-- =============================================================================
-- Helper function to calculate success rate
-- =============================================================================

CREATE OR REPLACE FUNCTION chain_pattern_success_rate(pattern tool_chain_patterns)
RETURNS DECIMAL AS $$
BEGIN
  IF (pattern.success_count + pattern.failure_count) = 0 THEN
    RETURN 0;
  END IF;
  RETURN pattern.success_count::DECIMAL / (pattern.success_count + pattern.failure_count)::DECIMAL * 100;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE tool_chain_patterns IS 'Stores successful tool chain patterns for learning and recommendations';
COMMENT ON COLUMN tool_chain_patterns.capability_signature IS 'Hash of sorted capability names for pattern matching';
COMMENT ON COLUMN tool_chain_patterns.chain_steps IS 'JSON array of {toolId, toolName, capability, order}';
COMMENT ON COLUMN tool_chain_patterns.success_count IS 'Number of successful executions with this pattern';
COMMENT ON COLUMN tool_chain_patterns.failure_count IS 'Number of failed executions with this pattern';
COMMENT ON COLUMN tool_chain_patterns.avg_execution_time_ms IS 'Rolling average execution time';
COMMENT ON COLUMN tool_chain_patterns.avg_cost_usd IS 'Rolling average cost per execution';
