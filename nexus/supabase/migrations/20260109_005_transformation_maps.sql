-- Migration: Transformation Maps
-- Story 16.4: Integration Schema Analyzer
-- Created: 2026-01-09

-- ============================================================================
-- Transformation Maps Table
-- Stores transformation rules between tool pairs for data flow
-- ============================================================================

CREATE TABLE IF NOT EXISTS transformation_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Tool pair identification
  source_tool_id TEXT NOT NULL,
  target_tool_id TEXT NOT NULL,

  -- Transformation data
  field_mappings JSONB NOT NULL DEFAULT '[]',        -- Array of FieldMapping
  type_conversions JSONB DEFAULT '[]',               -- Array of TypeConversionRule
  default_values JSONB DEFAULT '{}',                 -- Default values for missing fields

  -- Generated code
  transform_function TEXT,                           -- Generated TypeScript code
  reverse_function TEXT,                             -- Reverse transformation if available

  -- Metrics
  confidence_score NUMERIC(3,2),                     -- 0.00-1.00
  usage_count INTEGER DEFAULT 0,
  success_rate NUMERIC(3,2) DEFAULT 1.00,

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Unique constraint on tool pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_transform_maps_pair
  ON transformation_maps(source_tool_id, target_tool_id);

-- Index for confidence-based queries
CREATE INDEX IF NOT EXISTS idx_transform_maps_confidence
  ON transformation_maps(confidence_score DESC);

-- Index for usage tracking
CREATE INDEX IF NOT EXISTS idx_transform_maps_usage
  ON transformation_maps(usage_count DESC);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE transformation_maps ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read transformation maps (they are platform-level)
CREATE POLICY "Authenticated users can read transformation maps"
  ON transformation_maps FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only service role can insert/update (via backend)
CREATE POLICY "Service role can manage transformation maps"
  ON transformation_maps FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to increment usage count and update success rate
CREATE OR REPLACE FUNCTION increment_transformation_usage(
  p_source_tool_id TEXT,
  p_target_tool_id TEXT,
  p_success BOOLEAN
)
RETURNS VOID AS $$
DECLARE
  v_current_usage INTEGER;
  v_current_success_rate NUMERIC;
BEGIN
  -- Get current values
  SELECT usage_count, success_rate
  INTO v_current_usage, v_current_success_rate
  FROM transformation_maps
  WHERE source_tool_id = p_source_tool_id
    AND target_tool_id = p_target_tool_id;

  IF FOUND THEN
    -- Update with rolling average for success rate
    UPDATE transformation_maps
    SET
      usage_count = v_current_usage + 1,
      success_rate = (v_current_success_rate * v_current_usage + CASE WHEN p_success THEN 1 ELSE 0 END) / (v_current_usage + 1),
      updated_at = NOW()
    WHERE source_tool_id = p_source_tool_id
      AND target_tool_id = p_target_tool_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get most reliable transformations
CREATE OR REPLACE FUNCTION get_reliable_transformations(
  p_min_confidence NUMERIC DEFAULT 0.7,
  p_min_success_rate NUMERIC DEFAULT 0.9,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  source_tool_id TEXT,
  target_tool_id TEXT,
  confidence_score NUMERIC,
  success_rate NUMERIC,
  usage_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tm.id,
    tm.source_tool_id,
    tm.target_tool_id,
    tm.confidence_score,
    tm.success_rate,
    tm.usage_count
  FROM transformation_maps tm
  WHERE tm.confidence_score >= p_min_confidence
    AND tm.success_rate >= p_min_success_rate
  ORDER BY tm.usage_count DESC, tm.success_rate DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Trigger for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_transformation_maps_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transformation_maps_updated_at
  BEFORE UPDATE ON transformation_maps
  FOR EACH ROW
  EXECUTE FUNCTION update_transformation_maps_timestamp();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE transformation_maps IS 'Stores transformation rules between tool pairs for data flow compatibility';
COMMENT ON COLUMN transformation_maps.field_mappings IS 'Array of FieldMapping objects defining source->target field mappings';
COMMENT ON COLUMN transformation_maps.type_conversions IS 'Array of TypeConversionRule objects for type transformations';
COMMENT ON COLUMN transformation_maps.transform_function IS 'Generated TypeScript code for the transformation function';
COMMENT ON COLUMN transformation_maps.reverse_function IS 'Optional reverse transformation function if bidirectional';
COMMENT ON COLUMN transformation_maps.confidence_score IS 'Overall confidence in the transformation accuracy (0.00-1.00)';
COMMENT ON COLUMN transformation_maps.success_rate IS 'Rolling success rate based on actual usage';
