-- =============================================================================
-- AI SUGGESTIONS SYSTEM - Migration 20260203_001
-- =============================================================================
-- Purpose: Create tables for personalized AI workflow suggestions
-- Dependencies: users, workflows, workflow_executions tables
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. EXTEND USERS TABLE WITH SUBSCRIPTION AND INDUSTRY
-- -----------------------------------------------------------------------------

-- Add subscription and industry columns to users if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE public.users
      ADD COLUMN subscription_tier TEXT DEFAULT 'free'
        CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
      ADD COLUMN industry TEXT,
      ADD COLUMN last_active_at TIMESTAMPTZ DEFAULT now(),
      ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. AI SUGGESTIONS TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ownership
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Suggestion content
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN (
    'new_workflow',      -- Brand new workflow suggestion
    'optimization',      -- Improve existing workflow
    'integration',       -- Connect a new app
    'automation',        -- Automate a manual task
    'time_pattern',      -- Schedule-based suggestion
    'failure_fix'        -- Fix a failing workflow
  )),

  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- If it's a workflow suggestion, include the spec
  workflow_spec JSONB,

  -- Targeting
  related_workflow_id UUID REFERENCES public.workflows(id) ON DELETE SET NULL,
  related_integrations TEXT[], -- e.g., ['gmail', 'slack']

  -- Quality metrics
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  estimated_time_saved_minutes INTEGER, -- per week
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),

  -- User interaction tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',    -- Not yet shown
    'shown',      -- Displayed to user
    'accepted',   -- User clicked to implement
    'rejected',   -- User dismissed
    'ignored',    -- Shown but no action for 7+ days
    'expired'     -- Too old, no longer relevant
  )),
  shown_at TIMESTAMPTZ,
  acted_at TIMESTAMPTZ,

  -- Generation metadata
  model_used TEXT, -- 'haiku', 'sonnet', 'opus'
  generation_cost_usd DECIMAL(10,6),
  prompt_tokens INTEGER,
  completion_tokens INTEGER
);

-- Index for fast user queries
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_status
  ON public.ai_suggestions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_created
  ON public.ai_suggestions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_pending
  ON public.ai_suggestions(status) WHERE status = 'pending';

-- -----------------------------------------------------------------------------
-- 3. USER BEHAVIOR PATTERNS TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ownership
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Pattern identification
  pattern_type TEXT NOT NULL CHECK (pattern_type IN (
    'peak_usage_time',       -- When user is most active
    'repeated_manual',       -- Manually triggered workflows
    'workflow_sequence',     -- Workflows often run together
    'integration_combo',     -- Integrations used together
    'failure_pattern',       -- Recurring failures
    'time_of_week',          -- Day-of-week patterns
    'execution_volume',      -- High/low volume periods
    'response_time'          -- How fast user acts on suggestions
  )),

  -- Pattern data (flexible structure)
  pattern_data JSONB NOT NULL,

  -- Quality metrics
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  sample_count INTEGER NOT NULL DEFAULT 1, -- How many observations

  -- Lifecycle
  first_detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true,

  -- Prevent duplicates
  UNIQUE(user_id, pattern_type, (pattern_data->>'key'))
);

-- Index for pattern queries
CREATE INDEX IF NOT EXISTS idx_user_patterns_user_type
  ON public.user_patterns(user_id, pattern_type);
CREATE INDEX IF NOT EXISTS idx_user_patterns_active
  ON public.user_patterns(is_active) WHERE is_active = true;

-- -----------------------------------------------------------------------------
-- 4. CHAT HISTORY TABLE (for AI context)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ownership
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL, -- Group messages in a session

  -- Message content
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,

  -- If this message generated a workflow
  workflow_generated JSONB,
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE SET NULL,

  -- Metadata
  tokens_used INTEGER,
  model_used TEXT,
  response_time_ms INTEGER
);

-- Index for chat queries
CREATE INDEX IF NOT EXISTS idx_chat_history_user_session
  ON public.chat_history(user_id, session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_recent
  ON public.chat_history(user_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 5. SUGGESTION FEEDBACK TABLE (for learning)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.suggestion_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Links
  suggestion_id UUID NOT NULL REFERENCES public.ai_suggestions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Feedback
  action TEXT NOT NULL CHECK (action IN (
    'clicked',      -- User clicked to view details
    'implemented',  -- User implemented the suggestion
    'modified',     -- User implemented with changes
    'rejected',     -- User explicitly rejected
    'reported'      -- User reported as bad suggestion
  )),

  -- Optional feedback
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,

  -- What the user actually did
  modifications JSONB -- If they modified the suggestion
);

-- Index for feedback queries
CREATE INDEX IF NOT EXISTS idx_suggestion_feedback_suggestion
  ON public.suggestion_feedback(suggestion_id);

-- -----------------------------------------------------------------------------
-- 6. ANALYTICS AGGREGATES TABLE (pre-computed for dashboard)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ownership
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Time period
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  period_start DATE NOT NULL,

  -- Metrics
  total_workflows INTEGER DEFAULT 0,
  active_workflows INTEGER DEFAULT 0,
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,
  total_time_saved_minutes INTEGER DEFAULT 0,

  -- AI metrics
  suggestions_shown INTEGER DEFAULT 0,
  suggestions_accepted INTEGER DEFAULT 0,
  suggestions_rejected INTEGER DEFAULT 0,

  -- Integrations
  integrations_connected INTEGER DEFAULT 0,
  most_used_integrations TEXT[],

  -- Cost
  ai_cost_usd DECIMAL(10,4) DEFAULT 0,

  UNIQUE(user_id, period_type, period_start)
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_period
  ON public.user_analytics(user_id, period_type, period_start DESC);

-- -----------------------------------------------------------------------------
-- 7. BACKGROUND JOBS TABLE (for scheduling)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.background_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Job definition
  job_type TEXT NOT NULL CHECK (job_type IN (
    'pattern_detection',     -- Hourly pattern scan
    'daily_suggestions',     -- Daily AI suggestion generation
    'weekly_analysis',       -- Weekly deep analysis
    'analytics_rollup',      -- Aggregate analytics
    'data_archival',         -- Archive old data
    'suggestion_expiry'      -- Mark old suggestions as expired
  )),

  -- Targeting
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- NULL = system-wide

  -- Scheduling
  scheduled_for TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'running',
    'completed',
    'failed',
    'cancelled'
  )),

  -- Results
  result JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3
);

-- Index for job scheduling
CREATE INDEX IF NOT EXISTS idx_background_jobs_pending
  ON public.background_jobs(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_background_jobs_user_type
  ON public.background_jobs(user_id, job_type);

-- -----------------------------------------------------------------------------
-- 8. TRIGGERS FOR UPDATED_AT
-- -----------------------------------------------------------------------------

CREATE TRIGGER update_ai_suggestions_updated_at
  BEFORE UPDATE ON public.ai_suggestions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_patterns_updated_at
  BEFORE UPDATE ON public.user_patterns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_analytics_updated_at
  BEFORE UPDATE ON public.user_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_background_jobs_updated_at
  BEFORE UPDATE ON public.background_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------

ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestion_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.background_jobs ENABLE ROW LEVEL SECURITY;

-- AI Suggestions: Users see own suggestions
CREATE POLICY "Users can view own suggestions" ON public.ai_suggestions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage suggestions" ON public.ai_suggestions
  FOR ALL USING (true); -- Backend manages these

-- User Patterns: Users see own patterns
CREATE POLICY "Users can view own patterns" ON public.user_patterns
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage patterns" ON public.user_patterns
  FOR ALL USING (true);

-- Chat History: Users see own chat
CREATE POLICY "Users can view own chat" ON public.chat_history
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own chat" ON public.chat_history
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can manage chat" ON public.chat_history
  FOR ALL USING (true);

-- Suggestion Feedback: Users manage own feedback
CREATE POLICY "Users can manage own feedback" ON public.suggestion_feedback
  FOR ALL USING (user_id = auth.uid());

-- User Analytics: Users see own analytics
CREATE POLICY "Users can view own analytics" ON public.user_analytics
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage analytics" ON public.user_analytics
  FOR ALL USING (true);

-- Background Jobs: System only
CREATE POLICY "System can manage jobs" ON public.background_jobs
  FOR ALL USING (true);

-- -----------------------------------------------------------------------------
-- 10. HELPER FUNCTIONS
-- -----------------------------------------------------------------------------

-- Function to get user's active suggestion count
CREATE OR REPLACE FUNCTION get_pending_suggestions_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.ai_suggestions
    WHERE user_id = p_user_id
      AND status IN ('pending', 'shown')
      AND created_at > now() - interval '7 days'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark old suggestions as expired
CREATE OR REPLACE FUNCTION expire_old_suggestions()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.ai_suggestions
  SET status = 'expired', updated_at = now()
  WHERE status IN ('pending', 'shown')
    AND created_at < now() - interval '14 days';

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to archive old executions (keep summary, remove details)
CREATE OR REPLACE FUNCTION archive_old_executions(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  -- Move detailed execution_data to summary
  UPDATE public.workflow_executions
  SET execution_data = jsonb_build_object(
    'archived', true,
    'archived_at', now(),
    'original_status', status,
    'summary', execution_data->'summary'
  )
  WHERE created_at < now() - (days_old || ' days')::interval
    AND NOT (execution_data ? 'archived');

  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
