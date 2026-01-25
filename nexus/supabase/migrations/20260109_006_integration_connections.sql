-- Migration: Integration Connections
-- Story 16.5: Dynamic Integration Connector
-- Created: 2026-01-09

-- ============================================================================
-- Integration Connections Table
-- Stores established connections to external tools and APIs
-- ============================================================================

CREATE TABLE IF NOT EXISTS integration_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Tool identification
  tool_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,

  -- Authentication configuration
  auth_type TEXT NOT NULL CHECK (auth_type IN ('oauth2', 'api_key', 'bearer', 'basic', 'mcp', 'none')),
  config JSONB NOT NULL DEFAULT '{}',           -- Encrypted auth config
  endpoints JSONB DEFAULT '{}',                 -- API endpoint definitions

  -- Connection state
  status TEXT DEFAULT 'disconnected' CHECK (status IN (
    'disconnected', 'connecting', 'authenticating', 'testing',
    'connected', 'active', 'error', 'stale'
  )),
  last_connected_at TIMESTAMPTZ,
  last_tested_at TIMESTAMPTZ,
  last_error JSONB,                             -- ErrorClassification if any

  -- Health metrics
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  total_requests INTEGER DEFAULT 0,
  avg_latency_ms INTEGER,
  success_rate NUMERIC(5,4) DEFAULT 1.0000,     -- 0.0000-1.0000

  -- Ownership
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Unique constraint: one connection per tool per user per project
CREATE UNIQUE INDEX IF NOT EXISTS idx_connections_tool_user_project
  ON integration_connections(tool_id, user_id, COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Index for tool lookups
CREATE INDEX IF NOT EXISTS idx_connections_tool
  ON integration_connections(tool_id);

-- Index for project connections
CREATE INDEX IF NOT EXISTS idx_connections_project
  ON integration_connections(project_id) WHERE project_id IS NOT NULL;

-- Index for user connections
CREATE INDEX IF NOT EXISTS idx_connections_user
  ON integration_connections(user_id);

-- Index for connection status
CREATE INDEX IF NOT EXISTS idx_connections_status
  ON integration_connections(status);

-- Index for healthy connections (for quick lookups)
CREATE INDEX IF NOT EXISTS idx_connections_healthy
  ON integration_connections(user_id, tool_id)
  WHERE status IN ('connected', 'active');

-- ============================================================================
-- Data Flow Executions Table
-- Tracks data flow executions between tools
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_flow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Source and target
  source_tool_id TEXT NOT NULL,
  source_tool_name TEXT NOT NULL,
  target_tool_id TEXT NOT NULL,
  target_tool_name TEXT NOT NULL,

  -- Source and target connections
  source_connection_id UUID REFERENCES integration_connections(id) ON DELETE SET NULL,
  target_connection_id UUID REFERENCES integration_connections(id) ON DELETE SET NULL,

  -- Transformation map used
  transformation_map_id UUID REFERENCES transformation_maps(id) ON DELETE SET NULL,

  -- Execution status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'extracting', 'transforming', 'injecting', 'completed', 'failed'
  )),

  -- Record counts
  records_extracted INTEGER DEFAULT 0,
  records_transformed INTEGER DEFAULT 0,
  records_injected INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,

  -- Timing
  extract_time_ms INTEGER,
  transform_time_ms INTEGER,
  inject_time_ms INTEGER,
  total_time_ms INTEGER,

  -- Data integrity
  data_integrity_valid BOOLEAN DEFAULT TRUE,
  integrity_errors JSONB DEFAULT '[]',

  -- Error tracking
  error JSONB,                                   -- ErrorClassification if any
  retry_count INTEGER DEFAULT 0,

  -- Ownership
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_data_flows_status
  ON data_flow_executions(status);

-- Index for user data flows
CREATE INDEX IF NOT EXISTS idx_data_flows_user
  ON data_flow_executions(user_id);

-- Index for project data flows
CREATE INDEX IF NOT EXISTS idx_data_flows_project
  ON data_flow_executions(project_id) WHERE project_id IS NOT NULL;

-- Index for recent executions
CREATE INDEX IF NOT EXISTS idx_data_flows_recent
  ON data_flow_executions(started_at DESC);

-- Index for tool pair executions
CREATE INDEX IF NOT EXISTS idx_data_flows_tool_pair
  ON data_flow_executions(source_tool_id, target_tool_id);

-- ============================================================================
-- Chain Executions Table
-- Tracks complete chain execution results
-- ============================================================================

CREATE TABLE IF NOT EXISTS chain_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Execution status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'testing', 'executing', 'completed', 'partial', 'failed'
  )),

  -- Step tracking
  completed_steps INTEGER DEFAULT 0,
  total_steps INTEGER NOT NULL,
  step_results JSONB DEFAULT '[]',              -- Array of ChainStepExecutionResult

  -- Metrics
  total_time_ms INTEGER,
  total_cost_usd NUMERIC(10,4) DEFAULT 0,
  total_records_processed INTEGER DEFAULT 0,

  -- Error tracking
  errors JSONB DEFAULT '[]',                    -- Array of ChainExecutionError
  has_recoverable_error BOOLEAN DEFAULT FALSE,

  -- Final output
  final_output JSONB,

  -- Ownership
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Index for chain lookups
CREATE INDEX IF NOT EXISTS idx_chain_executions_chain
  ON chain_executions(chain_id);

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_chain_executions_status
  ON chain_executions(status);

-- Index for user executions
CREATE INDEX IF NOT EXISTS idx_chain_executions_user
  ON chain_executions(user_id);

-- Index for project executions
CREATE INDEX IF NOT EXISTS idx_chain_executions_project
  ON chain_executions(project_id) WHERE project_id IS NOT NULL;

-- Index for recent executions
CREATE INDEX IF NOT EXISTS idx_chain_executions_recent
  ON chain_executions(started_at DESC);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_flow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chain_executions ENABLE ROW LEVEL SECURITY;

-- Integration Connections Policies
CREATE POLICY "Users can view own connections"
  ON integration_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own connections"
  ON integration_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections"
  ON integration_connections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections"
  ON integration_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Project members can view project connections
CREATE POLICY "Project members can view project connections"
  ON integration_connections FOR SELECT
  USING (
    project_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = integration_connections.project_id
        AND project_members.user_id = auth.uid()
    )
  );

-- Data Flow Executions Policies
CREATE POLICY "Users can view own data flows"
  ON data_flow_executions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own data flows"
  ON data_flow_executions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data flows"
  ON data_flow_executions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Project members can view project data flows
CREATE POLICY "Project members can view project data flows"
  ON data_flow_executions FOR SELECT
  USING (
    project_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = data_flow_executions.project_id
        AND project_members.user_id = auth.uid()
    )
  );

-- Chain Executions Policies
CREATE POLICY "Users can view own chain executions"
  ON chain_executions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chain executions"
  ON chain_executions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chain executions"
  ON chain_executions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Project members can view project chain executions
CREATE POLICY "Project members can view project chain executions"
  ON chain_executions FOR SELECT
  USING (
    project_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = chain_executions.project_id
        AND project_members.user_id = auth.uid()
    )
  );

-- Service role can manage all
CREATE POLICY "Service role can manage all connections"
  ON integration_connections FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all data flows"
  ON data_flow_executions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all chain executions"
  ON chain_executions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to update connection metrics after a request
CREATE OR REPLACE FUNCTION update_connection_metrics(
  p_connection_id UUID,
  p_success BOOLEAN,
  p_latency_ms INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_current_success INTEGER;
  v_current_failure INTEGER;
  v_current_total INTEGER;
  v_current_avg_latency INTEGER;
BEGIN
  -- Get current values
  SELECT success_count, failure_count, total_requests, avg_latency_ms
  INTO v_current_success, v_current_failure, v_current_total, v_current_avg_latency
  FROM integration_connections
  WHERE id = p_connection_id;

  IF FOUND THEN
    -- Calculate new values
    IF p_success THEN
      v_current_success := v_current_success + 1;
    ELSE
      v_current_failure := v_current_failure + 1;
    END IF;
    v_current_total := v_current_total + 1;

    -- Calculate rolling average latency
    IF p_latency_ms IS NOT NULL AND v_current_avg_latency IS NOT NULL THEN
      v_current_avg_latency := (v_current_avg_latency * (v_current_total - 1) + p_latency_ms) / v_current_total;
    ELSIF p_latency_ms IS NOT NULL THEN
      v_current_avg_latency := p_latency_ms;
    END IF;

    -- Update the connection
    UPDATE integration_connections
    SET
      success_count = v_current_success,
      failure_count = v_current_failure,
      total_requests = v_current_total,
      avg_latency_ms = v_current_avg_latency,
      success_rate = v_current_success::NUMERIC / v_current_total::NUMERIC,
      updated_at = NOW()
    WHERE id = p_connection_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get connection success rate
CREATE OR REPLACE FUNCTION get_connection_success_rate(
  p_tool_id TEXT,
  p_user_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  v_success_rate NUMERIC;
BEGIN
  SELECT success_rate INTO v_success_rate
  FROM integration_connections
  WHERE tool_id = p_tool_id AND user_id = p_user_id
  ORDER BY updated_at DESC
  LIMIT 1;

  RETURN COALESCE(v_success_rate, 1.0000);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get healthy connections for a user
CREATE OR REPLACE FUNCTION get_healthy_connections(
  p_user_id UUID,
  p_project_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  tool_id TEXT,
  tool_name TEXT,
  status TEXT,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ic.id,
    ic.tool_id,
    ic.tool_name,
    ic.status,
    ic.success_rate
  FROM integration_connections ic
  WHERE ic.user_id = p_user_id
    AND (p_project_id IS NULL OR ic.project_id = p_project_id)
    AND ic.status IN ('connected', 'active')
    AND ic.success_rate >= 0.9
  ORDER BY ic.success_rate DESC, ic.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Trigger for updated_at on integration_connections
CREATE OR REPLACE FUNCTION update_integration_connections_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER integration_connections_updated_at
  BEFORE UPDATE ON integration_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_integration_connections_timestamp();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE integration_connections IS 'Stores established connections to external tools and APIs for dynamic integration';
COMMENT ON COLUMN integration_connections.config IS 'Encrypted authentication configuration (OAuth tokens, API keys, etc.)';
COMMENT ON COLUMN integration_connections.endpoints IS 'API endpoint definitions for the connected tool';
COMMENT ON COLUMN integration_connections.success_rate IS 'Rolling success rate based on actual requests (0-1)';

COMMENT ON TABLE data_flow_executions IS 'Tracks individual data flow executions between tool pairs';
COMMENT ON COLUMN data_flow_executions.integrity_errors IS 'List of data integrity validation errors if any';

COMMENT ON TABLE chain_executions IS 'Tracks complete tool chain execution results';
COMMENT ON COLUMN chain_executions.step_results IS 'Array of ChainStepExecutionResult objects for each step';
COMMENT ON COLUMN chain_executions.errors IS 'Array of ChainExecutionError objects for any errors encountered';
