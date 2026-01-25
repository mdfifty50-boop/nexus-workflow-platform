-- Exception Queue Table for Human-in-the-Loop Workflow Decisions
-- Stores pending decisions that require human review/approval

-- Create exception_queue table
CREATE TABLE public.exception_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ownership and workflow context
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE SET NULL,
  execution_id UUID REFERENCES public.workflow_executions(id) ON DELETE SET NULL,
  step_id TEXT,

  -- Exception classification
  exception_type TEXT NOT NULL CHECK (exception_type IN (
    'uncertain_decision',    -- AI confidence < 70%
    'high_value_action',     -- Payments > $100, bulk operations
    'missing_information',   -- Required info that can't be inferred
    'service_error',         -- External service failures needing intervention
    'policy_violation',      -- Action violates configured policies
    'approval_required',     -- Action explicitly requires approval
    'custom'                 -- Custom exception types
  )),

  -- Urgency level
  urgency TEXT NOT NULL DEFAULT 'today' CHECK (urgency IN (
    'immediate',  -- Needs attention now (blocking workflow)
    'today',      -- Should be handled today
    'flexible'    -- Can be handled when convenient
  )),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',     -- Awaiting human decision
    'in_review',   -- Currently being reviewed
    'approved',    -- Approved to proceed
    'rejected',    -- Rejected/cancelled
    'modified',    -- Modified and approved
    'expired',     -- Timed out without action
    'auto_resolved' -- Resolved automatically (e.g., retry succeeded)
  )),

  -- Exception details
  title TEXT NOT NULL,
  title_ar TEXT,  -- Arabic title for RTL support
  description TEXT NOT NULL,
  description_ar TEXT,  -- Arabic description for RTL support

  -- Context for decision making
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Structure: {
  --   workflowName: string,
  --   stepName: string,
  --   aiConfidence?: number,
  --   actionType?: string,
  --   estimatedValue?: number,
  --   currency?: string,
  --   affectedRecords?: number,
  --   originalInput?: any,
  --   aiReasoning?: string,
  --   alternatives?: { id: string, label: string, description?: string }[],
  --   requiredFields?: { name: string, type: string, required: boolean }[],
  --   serviceError?: { service: string, errorCode: string, message: string }
  -- }

  -- Proposed action and alternatives
  proposed_action JSONB,
  -- Structure: {
  --   type: string,
  --   payload: any,
  --   estimatedImpact: string,
  --   reversible: boolean
  -- }

  -- Decision outcome
  decision JSONB,
  -- Structure: {
  --   action: 'approve' | 'reject' | 'modify',
  --   modifiedPayload?: any,
  --   reason?: string,
  --   decidedBy: UUID,
  --   decidedAt: timestamp
  -- }

  -- Timing
  expires_at TIMESTAMPTZ,  -- When this exception should auto-expire
  reviewed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,

  -- Metadata
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create trigger for updated_at
CREATE TRIGGER update_exception_queue_updated_at
  BEFORE UPDATE ON public.exception_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.exception_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exception_queue table
CREATE POLICY "Users can view own exceptions" ON public.exception_queue
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own exceptions" ON public.exception_queue
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own exceptions" ON public.exception_queue
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own exceptions" ON public.exception_queue
  FOR DELETE USING (user_id = auth.uid());

-- Allow project members to view and act on project exceptions
CREATE POLICY "Project members can view project exceptions" ON public.exception_queue
  FOR SELECT USING (
    project_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = exception_queue.project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project admins can update project exceptions" ON public.exception_queue
  FOR UPDATE USING (
    project_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = exception_queue.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
    )
  );

-- Create indexes for performance
CREATE INDEX idx_exception_queue_user_id ON public.exception_queue(user_id);
CREATE INDEX idx_exception_queue_status ON public.exception_queue(status);
CREATE INDEX idx_exception_queue_urgency ON public.exception_queue(urgency);
CREATE INDEX idx_exception_queue_type ON public.exception_queue(exception_type);
CREATE INDEX idx_exception_queue_workflow_id ON public.exception_queue(workflow_id);
CREATE INDEX idx_exception_queue_project_id ON public.exception_queue(project_id);
CREATE INDEX idx_exception_queue_created_at ON public.exception_queue(created_at DESC);
CREATE INDEX idx_exception_queue_pending ON public.exception_queue(user_id, status)
  WHERE status = 'pending';

-- Composite index for common query patterns
CREATE INDEX idx_exception_queue_user_pending_urgency
  ON public.exception_queue(user_id, status, urgency, created_at DESC)
  WHERE status IN ('pending', 'in_review');

-- Function to auto-expire old exceptions
CREATE OR REPLACE FUNCTION expire_old_exceptions()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.exception_queue
  SET
    status = 'expired',
    resolved_at = now()
  WHERE
    status IN ('pending', 'in_review')
    AND expires_at IS NOT NULL
    AND expires_at < now();

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get exception statistics for a user
CREATE OR REPLACE FUNCTION get_exception_stats(p_user_id UUID)
RETURNS TABLE (
  total_pending BIGINT,
  immediate_count BIGINT,
  today_count BIGINT,
  flexible_count BIGINT,
  resolved_today BIGINT,
  avg_resolution_time_hours NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status = 'pending') as total_pending,
    COUNT(*) FILTER (WHERE status = 'pending' AND urgency = 'immediate') as immediate_count,
    COUNT(*) FILTER (WHERE status = 'pending' AND urgency = 'today') as today_count,
    COUNT(*) FILTER (WHERE status = 'pending' AND urgency = 'flexible') as flexible_count,
    COUNT(*) FILTER (
      WHERE status IN ('approved', 'rejected', 'modified')
      AND resolved_at >= CURRENT_DATE
    ) as resolved_today,
    ROUND(
      AVG(
        EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600
      ) FILTER (WHERE resolved_at IS NOT NULL),
      2
    ) as avg_resolution_time_hours
  FROM public.exception_queue
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION expire_old_exceptions() TO authenticated;
GRANT EXECUTE ON FUNCTION get_exception_stats(UUID) TO authenticated;
