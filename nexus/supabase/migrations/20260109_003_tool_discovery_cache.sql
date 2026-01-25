-- Tool Discovery Cache for Story 16.2: Dynamic Tool Discovery Engine
-- Caches discovered tools and tracks user approval status

-- Tool Discovery Cache Table
CREATE TABLE IF NOT EXISTS tool_discovery_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Tool data (stored as JSONB for flexibility with discovered tool schema)
  tool_data JSONB NOT NULL,

  -- Search context
  capability_hash TEXT NOT NULL,  -- Hash of the search capability

  -- Ownership
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Approval status
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'expired')),
  approval_reason TEXT,
  rejection_reason TEXT,

  -- TTL (24-hour cache as per NFR-16.1.3)
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_discovery_cache_tool_id ON tool_discovery_cache ((tool_data->>'id'));
CREATE INDEX IF NOT EXISTS idx_discovery_cache_capability ON tool_discovery_cache (capability_hash);
CREATE INDEX IF NOT EXISTS idx_discovery_cache_project ON tool_discovery_cache (project_id);
CREATE INDEX IF NOT EXISTS idx_discovery_cache_user ON tool_discovery_cache (user_id);
CREATE INDEX IF NOT EXISTS idx_discovery_cache_status ON tool_discovery_cache (approval_status);
CREATE INDEX IF NOT EXISTS idx_discovery_cache_expires ON tool_discovery_cache (expires_at);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_discovery_cache_project_status ON tool_discovery_cache (project_id, approval_status);

-- Enable RLS
ALTER TABLE tool_discovery_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own project's cached tools
CREATE POLICY "Users can view project discovery cache" ON tool_discovery_cache
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
      UNION
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- Users can insert into their own project's cache
CREATE POLICY "Users can insert discovery cache" ON tool_discovery_cache
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      project_id IS NULL
      OR project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
        UNION
        SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role IN ('owner', 'collaborator')
      )
    )
  );

-- Users can update their own cache entries
CREATE POLICY "Users can update own discovery cache" ON tool_discovery_cache
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own cache entries
CREATE POLICY "Users can delete own discovery cache" ON tool_discovery_cache
  FOR DELETE
  USING (user_id = auth.uid());

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_discovery_cache_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_discovery_cache_updated
  BEFORE UPDATE ON tool_discovery_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_discovery_cache_timestamp();

-- Cleanup function for expired entries (can be called by cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_discovery_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM tool_discovery_cache
  WHERE expires_at < NOW()
  AND approval_status != 'approved';  -- Keep approved tools until manually removed

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Tool Approval Audit Log (for tracking approval history)
CREATE TABLE IF NOT EXISTS tool_approval_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  tool_id TEXT NOT NULL,  -- Can be discovered tool ID
  tool_name TEXT NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Action details
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'add_to_catalog', 'expire')),
  trust_score_at_action INTEGER,
  reason TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Index for audit log queries
CREATE INDEX IF NOT EXISTS idx_approval_audit_tool ON tool_approval_audit (tool_id);
CREATE INDEX IF NOT EXISTS idx_approval_audit_project ON tool_approval_audit (project_id);
CREATE INDEX IF NOT EXISTS idx_approval_audit_user ON tool_approval_audit (user_id);
CREATE INDEX IF NOT EXISTS idx_approval_audit_created ON tool_approval_audit (created_at DESC);

-- RLS for audit log
ALTER TABLE tool_approval_audit ENABLE ROW LEVEL SECURITY;

-- Users can view their project's audit log
CREATE POLICY "Users can view project approval audit" ON tool_approval_audit
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
      UNION
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- Users can insert audit entries for their actions
CREATE POLICY "Users can insert approval audit" ON tool_approval_audit
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Comment for documentation
COMMENT ON TABLE tool_discovery_cache IS 'Caches discovered tools from external sources (Rube MCP) with 24-hour TTL and user approval status';
COMMENT ON TABLE tool_approval_audit IS 'Audit log for tool approval/rejection actions for compliance and analytics';
