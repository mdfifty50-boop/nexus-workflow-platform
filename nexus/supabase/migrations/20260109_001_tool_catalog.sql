-- Epic 16, Story 16.1: Tool Catalog & Knowledge Base Setup
-- Migration: Create tool_catalog and tool_usage_metrics tables

-- =====================================================
-- Tool Categories Lookup Table
-- =====================================================
CREATE TABLE IF NOT EXISTS tool_categories (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed categories
INSERT INTO tool_categories (id, display_name, description, icon) VALUES
  ('communication', 'Communication', 'Email, messaging, and collaboration tools', 'MessageSquare'),
  ('productivity', 'Productivity', 'Document management, calendars, and task tracking', 'CheckSquare'),
  ('development', 'Development', 'Code repositories, CI/CD, and developer tools', 'Code'),
  ('finance', 'Finance', 'Accounting, payments, and financial services', 'DollarSign'),
  ('travel', 'Travel', 'Flights, hotels, and transportation booking', 'Plane'),
  ('crm', 'CRM', 'Customer relationship management and sales', 'Users'),
  ('marketing', 'Marketing', 'Advertising, analytics, and campaign management', 'TrendingUp'),
  ('ai', 'AI & ML', 'Artificial intelligence and machine learning services', 'Brain'),
  ('data', 'Data & Storage', 'Databases, data warehouses, and file storage', 'Database'),
  ('automation', 'Automation', 'Workflow automation and integration platforms', 'Zap'),
  ('social', 'Social Media', 'Social networks and content platforms', 'Share2'),
  ('analytics', 'Analytics', 'Business intelligence and reporting tools', 'BarChart'),
  ('storage', 'Cloud Storage', 'File hosting and object storage services', 'HardDrive'),
  ('other', 'Other', 'Miscellaneous tools and services', 'MoreHorizontal')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Tool Catalog Table (Platform-level)
-- =====================================================
CREATE TABLE IF NOT EXISTS tool_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Basic info
  name TEXT NOT NULL,
  category TEXT NOT NULL REFERENCES tool_categories(id),
  description TEXT,

  -- API details
  api_doc_url TEXT,
  auth_method TEXT NOT NULL CHECK (auth_method IN ('oauth2', 'api_key', 'bearer', 'none', 'mcp')),
  data_formats JSONB DEFAULT '["json"]',

  -- Cost and reliability
  cost_estimate JSONB, -- { "perCall": 0.001, "tier": "free|freemium|paid|enterprise" }
  reliability_rating NUMERIC(3,2) DEFAULT 1.00 CHECK (reliability_rating >= 0 AND reliability_rating <= 1),

  -- MCP/Integration mapping
  toolkit_slug TEXT UNIQUE, -- Rube/Composio toolkit identifier
  provider TEXT NOT NULL DEFAULT 'custom' CHECK (provider IN ('rube', 'composio', 'custom', 'native')),

  -- Capabilities (actions this tool can perform)
  capabilities JSONB DEFAULT '[]',

  -- Approval workflow
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,

  -- Flexible metadata
  metadata JSONB DEFAULT '{}'
);

-- Full-text search index for tool discovery
CREATE INDEX IF NOT EXISTS tool_catalog_search_idx ON tool_catalog
  USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Index for category filtering
CREATE INDEX IF NOT EXISTS tool_catalog_category_idx ON tool_catalog(category);

-- Index for provider filtering
CREATE INDEX IF NOT EXISTS tool_catalog_provider_idx ON tool_catalog(provider);

-- Index for approved tools
CREATE INDEX IF NOT EXISTS tool_catalog_approved_idx ON tool_catalog(is_approved) WHERE is_approved = true;

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_tool_catalog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tool_catalog_updated_at
  BEFORE UPDATE ON tool_catalog
  FOR EACH ROW
  EXECUTE FUNCTION update_tool_catalog_updated_at();

-- =====================================================
-- Row Level Security for tool_catalog
-- =====================================================
ALTER TABLE tool_catalog ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read approved tools
CREATE POLICY "Authenticated users can read approved tools"
  ON tool_catalog FOR SELECT
  USING (is_approved = true AND auth.role() = 'authenticated');

-- Admin users can read all tools (including unapproved)
-- Note: Implement admin check via metadata or separate admin table in production
CREATE POLICY "Admins can read all tools"
  ON tool_catalog FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.metadata->>'role' = 'admin'
    )
  );

-- Admin users can insert new tools
CREATE POLICY "Admins can insert tools"
  ON tool_catalog FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.metadata->>'role' = 'admin'
    )
  );

-- Admin users can update tools
CREATE POLICY "Admins can update tools"
  ON tool_catalog FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.metadata->>'role' = 'admin'
    )
  );

-- =====================================================
-- Tool Usage Metrics Table (Per-project learning)
-- =====================================================
CREATE TABLE IF NOT EXISTS tool_usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign keys
  tool_id UUID NOT NULL REFERENCES tool_catalog(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,

  -- Execution details
  success BOOLEAN NOT NULL,
  execution_time_ms INTEGER,
  tokens_used INTEGER,
  cost_usd NUMERIC(10,6),

  -- Error tracking
  error_type TEXT,
  error_message TEXT,

  -- Learning patterns (accumulated insights)
  learned_patterns JSONB DEFAULT '{}'
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS tool_usage_metrics_tool_idx ON tool_usage_metrics(tool_id);
CREATE INDEX IF NOT EXISTS tool_usage_metrics_project_idx ON tool_usage_metrics(project_id);
CREATE INDEX IF NOT EXISTS tool_usage_metrics_workflow_idx ON tool_usage_metrics(workflow_id);
CREATE INDEX IF NOT EXISTS tool_usage_metrics_success_idx ON tool_usage_metrics(tool_id, success);
CREATE INDEX IF NOT EXISTS tool_usage_metrics_created_idx ON tool_usage_metrics(created_at DESC);

-- =====================================================
-- Row Level Security for tool_usage_metrics
-- =====================================================
ALTER TABLE tool_usage_metrics ENABLE ROW LEVEL SECURITY;

-- Users can only see metrics for their own projects
CREATE POLICY "Users see own project metrics"
  ON tool_usage_metrics FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
      UNION
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- Users can insert metrics for their own projects
CREATE POLICY "Users can insert metrics for own projects"
  ON tool_usage_metrics FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
      UNION
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- Aggregated Tool Statistics View
-- =====================================================
CREATE OR REPLACE VIEW tool_statistics AS
SELECT
  tc.id AS tool_id,
  tc.name,
  tc.category,
  tc.reliability_rating,
  COUNT(tum.id) AS total_usages,
  COUNT(CASE WHEN tum.success THEN 1 END) AS successful_usages,
  ROUND(
    COUNT(CASE WHEN tum.success THEN 1 END)::NUMERIC / NULLIF(COUNT(tum.id), 0) * 100,
    2
  ) AS success_rate,
  ROUND(AVG(tum.execution_time_ms)::NUMERIC, 2) AS avg_execution_time_ms,
  ROUND(AVG(tum.cost_usd)::NUMERIC, 6) AS avg_cost_usd,
  MAX(tum.created_at) AS last_used_at
FROM tool_catalog tc
LEFT JOIN tool_usage_metrics tum ON tc.id = tum.tool_id
WHERE tc.is_approved = true
GROUP BY tc.id, tc.name, tc.category, tc.reliability_rating;

-- =====================================================
-- Function to update tool reliability based on usage
-- =====================================================
CREATE OR REPLACE FUNCTION update_tool_reliability()
RETURNS TRIGGER AS $$
DECLARE
  new_reliability NUMERIC(3,2);
  recent_success_rate NUMERIC;
BEGIN
  -- Calculate success rate from last 30 days
  SELECT
    COUNT(CASE WHEN success THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0)
  INTO recent_success_rate
  FROM tool_usage_metrics
  WHERE tool_id = NEW.tool_id
    AND created_at > NOW() - INTERVAL '30 days';

  -- Only update if we have sufficient data (at least 10 usages)
  IF (SELECT COUNT(*) FROM tool_usage_metrics
      WHERE tool_id = NEW.tool_id
      AND created_at > NOW() - INTERVAL '30 days') >= 10
  THEN
    -- Blend current rating with new data (weighted average)
    SELECT
      ROUND(
        (reliability_rating * 0.3 + COALESCE(recent_success_rate, reliability_rating) * 0.7)::NUMERIC,
        2
      )
    INTO new_reliability
    FROM tool_catalog
    WHERE id = NEW.tool_id;

    -- Update the tool's reliability rating
    UPDATE tool_catalog
    SET reliability_rating = new_reliability,
        updated_at = NOW()
    WHERE id = NEW.tool_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update reliability after new usage metric
CREATE TRIGGER update_tool_reliability_trigger
  AFTER INSERT ON tool_usage_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_tool_reliability();
