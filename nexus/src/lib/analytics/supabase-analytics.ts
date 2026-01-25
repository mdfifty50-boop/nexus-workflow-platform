/**
 * Supabase Analytics Integration
 *
 * SQL schema, queries, and functions for analytics data storage and aggregation.
 * This file contains the schema definition and query functions for analytics.
 */

import { supabase, isSupabaseConfigured } from '../supabase';

// =============================================================================
// Schema Definition (for reference - execute in Supabase SQL Editor)
// =============================================================================

export const ANALYTICS_SCHEMA = `
-- Analytics Events Table
CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  category TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id TEXT NOT NULL,
  anonymous_id TEXT NOT NULL,
  hashed_user_id TEXT,
  platform TEXT DEFAULT 'web',
  locale TEXT,
  timezone TEXT,
  user_agent TEXT,
  pathname TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_category ON analytics_events(category);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(hashed_user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_pathname ON analytics_events(pathname);

-- Sessions Table
CREATE TABLE IF NOT EXISTS analytics_sessions (
  id TEXT PRIMARY KEY,
  anonymous_id TEXT NOT NULL,
  hashed_user_id TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  events_count INTEGER DEFAULT 0,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  is_first_session BOOLEAN DEFAULT FALSE,
  platform TEXT DEFAULT 'web',
  locale TEXT,
  timezone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_started ON analytics_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user ON analytics_sessions(hashed_user_id);

-- Funnel Progress Table
CREATE TABLE IF NOT EXISTS analytics_funnel_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_name TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  anonymous_id TEXT NOT NULL,
  hashed_user_id TEXT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(funnel_name, step_number, anonymous_id)
);

CREATE INDEX IF NOT EXISTS idx_funnel_progress_funnel ON analytics_funnel_progress(funnel_name);
CREATE INDEX IF NOT EXISTS idx_funnel_progress_user ON analytics_funnel_progress(hashed_user_id);

-- Daily Aggregates Table (for dashboard performance)
CREATE TABLE IF NOT EXISTS analytics_daily_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  dimensions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, metric_name, dimensions)
);

CREATE INDEX IF NOT EXISTS idx_daily_aggregates_date ON analytics_daily_aggregates(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_aggregates_metric ON analytics_daily_aggregates(metric_name);

-- Enable Row Level Security
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_funnel_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily_aggregates ENABLE ROW LEVEL SECURITY;

-- RLS Policies (for service role access)
CREATE POLICY "Service role can manage analytics_events" ON analytics_events
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage analytics_sessions" ON analytics_sessions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage analytics_funnel_progress" ON analytics_funnel_progress
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage analytics_daily_aggregates" ON analytics_daily_aggregates
  FOR ALL USING (true) WITH CHECK (true);
`;

// =============================================================================
// Types
// =============================================================================

export interface AnalyticsMetrics {
  // Active users in structured format
  activeUsers: {
    dau: number;
    wau: number;
    mau: number;
  };
  // Legacy fields for compatibility
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  // Workflow metrics
  totalWorkflows: number;
  totalExecutions: number;
  workflowExecutions: number;
  workflowSuccessRate: number;
  successRate: number;
  // Time metrics
  avgTimeToFirstWorkflow: number;
  averageTimeToFirstWorkflow: number | null;
  // Event tracking
  totalEvents: number;
  // Additional data
  popularTemplates: Array<{ templateId: string; name: string; usageCount: number }>;
  integrationUsage: Array<{ provider: string; connectionCount: number }>;
}

export interface TimeSeriesData {
  date: string;
  value: number;
}

export interface FunnelData {
  step: string;
  stepNumber: number;
  count: number;
  conversionRate?: number;
  dropoffRate?: number;
}

export interface TopEvent {
  eventName: string;
  count: number;
  percentage: number;
}

export interface DashboardData {
  metrics: AnalyticsMetrics;
  activeUsersTimeSeries: TimeSeriesData[];
  workflowExecutionsTimeSeries: TimeSeriesData[];
  signupToWorkflowFunnel: FunnelData[];
  topEvents: TopEvent[];
  recentActivity: Array<{
    eventName: string;
    timestamp: string;
    pathname: string;
  }>;
}

// =============================================================================
// Query Functions
// =============================================================================

/**
 * Get active users count for a time period
 */
export async function getActiveUsers(
  startDate: Date,
  endDate: Date
): Promise<number> {
  if (!isSupabaseConfigured()) return 0;

  const { error } = await supabase
    .from('analytics_events')
    .select('anonymous_id', { count: 'exact', head: true })
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString());

  if (error) {
    console.error('Error fetching active users:', error);
    return 0;
  }

  // Get distinct count
  const { count } = await supabase
    .from('analytics_events')
    .select('anonymous_id')
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString());

  return count || 0;
}

/**
 * Get daily active users for the last N days
 */
export async function getDailyActiveUsersTimeSeries(
  days: number = 30
): Promise<TimeSeriesData[]> {
  if (!isSupabaseConfigured()) return [];

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .rpc('get_daily_active_users', {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    });

  if (error) {
    console.error('Error fetching DAU time series:', error);
    return [];
  }

  return (data || []).map((row: { date: string; count: number }) => ({
    date: row.date,
    value: row.count,
  }));
}

/**
 * Get workflow execution statistics
 */
export async function getWorkflowStats(
  startDate: Date,
  endDate: Date
): Promise<{
  total: number;
  successful: number;
  failed: number;
  successRate: number;
}> {
  if (!isSupabaseConfigured()) {
    return { total: 0, successful: 0, failed: 0, successRate: 0 };
  }

  const { data, error } = await supabase
    .from('analytics_events')
    .select('properties')
    .in('event_name', ['workflow_execution_completed', 'workflow_execution_failed'])
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString());

  if (error) {
    console.error('Error fetching workflow stats:', error);
    return { total: 0, successful: 0, failed: 0, successRate: 0 };
  }

  const successful = (data || []).filter(e =>
    e.properties?.executionStatus === 'success'
  ).length;
  const failed = (data || []).filter(e =>
    e.properties?.executionStatus === 'failed'
  ).length;
  const total = successful + failed;

  return {
    total,
    successful,
    failed,
    successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
  };
}

/**
 * Get workflow execution time series
 */
export async function getWorkflowExecutionsTimeSeries(
  days: number = 30
): Promise<TimeSeriesData[]> {
  if (!isSupabaseConfigured()) return [];

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('analytics_events')
    .select('timestamp')
    .eq('event_name', 'workflow_executed')
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString())
    .order('timestamp', { ascending: true });

  if (error) {
    console.error('Error fetching workflow executions:', error);
    return [];
  }

  // Group by date
  const countByDate: Record<string, number> = {};
  (data || []).forEach(event => {
    const date = new Date(event.timestamp).toISOString().split('T')[0];
    countByDate[date] = (countByDate[date] || 0) + 1;
  });

  // Fill in missing dates
  const result: TimeSeriesData[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    result.push({
      date: dateStr,
      value: countByDate[dateStr] || 0,
    });
    current.setDate(current.getDate() + 1);
  }

  return result;
}

/**
 * Get funnel conversion data
 */
export async function getFunnelData(
  funnelName: string,
  startDate: Date,
  endDate: Date
): Promise<FunnelData[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('analytics_funnel_progress')
    .select('step_number, step_name, anonymous_id')
    .eq('funnel_name', funnelName)
    .gte('completed_at', startDate.toISOString())
    .lte('completed_at', endDate.toISOString());

  if (error) {
    console.error('Error fetching funnel data:', error);
    return [];
  }

  // Count unique users at each step
  const stepCounts: Record<number, { name: string; users: Set<string> }> = {};

  (data || []).forEach(row => {
    if (!stepCounts[row.step_number]) {
      stepCounts[row.step_number] = { name: row.step_name, users: new Set() };
    }
    stepCounts[row.step_number].users.add(row.anonymous_id);
  });

  const steps = Object.entries(stepCounts)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([stepNumber, { name, users }], index, arr) => {
      const count = users.size;
      const prevCount = index > 0 ? arr[index - 1][1].users.size : count;
      const firstStepCount = arr[0][1].users.size;

      return {
        step: name,
        stepNumber: parseInt(stepNumber),
        count,
        conversionRate: firstStepCount > 0 ? Math.round((count / firstStepCount) * 100) : 0,
        dropoffRate: prevCount > 0 ? Math.round(((prevCount - count) / prevCount) * 100) : 0,
      };
    });

  return steps;
}

/**
 * Get top events by frequency
 */
export async function getTopEvents(
  startDate: Date,
  endDate: Date,
  limit: number = 10
): Promise<TopEvent[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('analytics_events')
    .select('event_name')
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString());

  if (error) {
    console.error('Error fetching top events:', error);
    return [];
  }

  // Count events
  const eventCounts: Record<string, number> = {};
  (data || []).forEach(row => {
    eventCounts[row.event_name] = (eventCounts[row.event_name] || 0) + 1;
  });

  const total = Object.values(eventCounts).reduce((sum, count) => sum + count, 0);

  return Object.entries(eventCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([eventName, count]) => ({
      eventName,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
}

/**
 * Get popular templates
 */
export async function getPopularTemplates(
  startDate: Date,
  endDate: Date,
  limit: number = 5
): Promise<Array<{ templateId: string; name: string; usageCount: number }>> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('analytics_events')
    .select('properties')
    .eq('event_name', 'template_selected')
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString());

  if (error) {
    console.error('Error fetching popular templates:', error);
    return [];
  }

  // Count template usage
  const templateCounts: Record<string, { name: string; count: number }> = {};
  (data || []).forEach(row => {
    const templateId = row.properties?.templateId as string;
    const templateName = row.properties?.templateName as string;
    if (templateId) {
      if (!templateCounts[templateId]) {
        templateCounts[templateId] = { name: templateName || templateId, count: 0 };
      }
      templateCounts[templateId].count++;
    }
  });

  return Object.entries(templateCounts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, limit)
    .map(([templateId, { name, count }]) => ({
      templateId,
      name,
      usageCount: count,
    }));
}

/**
 * Get integration usage statistics
 */
export async function getIntegrationUsage(
  startDate: Date,
  endDate: Date
): Promise<Array<{ provider: string; connectionCount: number }>> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('analytics_events')
    .select('properties')
    .eq('event_name', 'integration_connected')
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString());

  if (error) {
    console.error('Error fetching integration usage:', error);
    return [];
  }

  // Count integrations by provider
  const providerCounts: Record<string, number> = {};
  (data || []).forEach(row => {
    const provider = row.properties?.provider as string;
    if (provider) {
      providerCounts[provider] = (providerCounts[provider] || 0) + 1;
    }
  });

  return Object.entries(providerCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([provider, connectionCount]) => ({
      provider,
      connectionCount,
    }));
}

/**
 * Get recent activity
 */
export async function getRecentActivity(
  limit: number = 20
): Promise<Array<{ eventName: string; timestamp: string; pathname: string }>> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('analytics_events')
    .select('event_name, timestamp, pathname')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }

  return (data || []).map(row => ({
    eventName: row.event_name,
    timestamp: row.timestamp,
    pathname: row.pathname || '/',
  }));
}

/**
 * Get average time to first workflow (in hours)
 */
export async function getAverageTimeToFirstWorkflow(
  _startDate?: Date,
  _endDate?: Date
): Promise<number | null> {
  if (!isSupabaseConfigured()) return null;

  // This would require a custom RPC function in Supabase
  // For now, return null to indicate data not available
  return null;
}

/**
 * Get complete dashboard data
 */
export async function getDashboardData(
  days: number = 30
): Promise<DashboardData> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  // Fetch all data in parallel
  const [
    dauTimeSeries,
    workflowTimeSeries,
    workflowStats,
    funnel,
    topEvents,
    templates,
    integrations,
    recentActivity,
    avgTimeToWorkflow,
  ] = await Promise.all([
    getDailyActiveUsersTimeSeries(days),
    getWorkflowExecutionsTimeSeries(days),
    getWorkflowStats(startDate, endDate),
    getFunnelData('SIGNUP_TO_FIRST_WORKFLOW', startDate, endDate),
    getTopEvents(startDate, endDate),
    getPopularTemplates(startDate, endDate),
    getIntegrationUsage(startDate, endDate),
    getRecentActivity(),
    getAverageTimeToFirstWorkflow(startDate, endDate),
  ]);

  // Calculate DAU, WAU, MAU
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dau = dauTimeSeries.find(d => d.date === today.toISOString().split('T')[0])?.value || 0;
  const wau = dauTimeSeries.slice(-7).reduce((sum, d) => sum + d.value, 0);
  const mau = dauTimeSeries.reduce((sum, d) => sum + d.value, 0);

  // Calculate total events from topEvents
  const totalEvents = topEvents.reduce((sum, e) => sum + e.count, 0);

  return {
    metrics: {
      // Active users in structured format
      activeUsers: {
        dau,
        wau,
        mau,
      },
      // Legacy fields for compatibility
      dailyActiveUsers: dau,
      weeklyActiveUsers: wau,
      monthlyActiveUsers: mau,
      // Workflow metrics
      totalWorkflows: workflowStats.total,
      totalExecutions: workflowStats.total,
      workflowExecutions: workflowStats.total,
      workflowSuccessRate: workflowStats.successRate,
      successRate: workflowStats.successRate,
      // Time metrics (convert to seconds, default to 300 if null)
      avgTimeToFirstWorkflow: avgTimeToWorkflow !== null ? avgTimeToWorkflow * 3600 : 300,
      averageTimeToFirstWorkflow: avgTimeToWorkflow,
      // Event tracking
      totalEvents,
      // Additional data
      popularTemplates: templates,
      integrationUsage: integrations,
    },
    activeUsersTimeSeries: dauTimeSeries,
    workflowExecutionsTimeSeries: workflowTimeSeries,
    signupToWorkflowFunnel: funnel,
    topEvents,
    recentActivity,
  };
}

// =============================================================================
// Aggregation Functions (to be run via Supabase cron)
// =============================================================================

export const AGGREGATION_FUNCTIONS = `
-- Function to aggregate daily metrics
CREATE OR REPLACE FUNCTION aggregate_daily_analytics()
RETURNS void AS $$
DECLARE
  yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
  -- Daily Active Users
  INSERT INTO analytics_daily_aggregates (date, metric_name, metric_value, dimensions)
  SELECT
    yesterday,
    'daily_active_users',
    COUNT(DISTINCT anonymous_id),
    '{}'::jsonb
  FROM analytics_events
  WHERE timestamp >= yesterday AND timestamp < CURRENT_DATE
  ON CONFLICT (date, metric_name, dimensions)
  DO UPDATE SET metric_value = EXCLUDED.metric_value;

  -- Workflow Executions
  INSERT INTO analytics_daily_aggregates (date, metric_name, metric_value, dimensions)
  SELECT
    yesterday,
    'workflow_executions',
    COUNT(*),
    '{}'::jsonb
  FROM analytics_events
  WHERE event_name = 'workflow_executed'
    AND timestamp >= yesterday AND timestamp < CURRENT_DATE
  ON CONFLICT (date, metric_name, dimensions)
  DO UPDATE SET metric_value = EXCLUDED.metric_value;

  -- Page Views by Path
  INSERT INTO analytics_daily_aggregates (date, metric_name, metric_value, dimensions)
  SELECT
    yesterday,
    'page_views',
    COUNT(*),
    jsonb_build_object('pathname', pathname)
  FROM analytics_events
  WHERE event_name = 'engagement_page_viewed'
    AND timestamp >= yesterday AND timestamp < CURRENT_DATE
  GROUP BY pathname
  ON CONFLICT (date, metric_name, dimensions)
  DO UPDATE SET metric_value = EXCLUDED.metric_value;
END;
$$ LANGUAGE plpgsql;

-- Function to get daily active users (for RPC call)
CREATE OR REPLACE FUNCTION get_daily_active_users(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE (date DATE, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(timestamp) as date,
    COUNT(DISTINCT anonymous_id) as count
  FROM analytics_events
  WHERE timestamp >= start_date AND timestamp <= end_date
  GROUP BY DATE(timestamp)
  ORDER BY date;
END;
$$ LANGUAGE plpgsql;

-- Cron job to run daily aggregation (requires pg_cron extension)
-- SELECT cron.schedule('aggregate-analytics', '0 1 * * *', 'SELECT aggregate_daily_analytics()');
`;

export default {
  getDashboardData,
  getActiveUsers,
  getDailyActiveUsersTimeSeries,
  getWorkflowStats,
  getWorkflowExecutionsTimeSeries,
  getFunnelData,
  getTopEvents,
  getPopularTemplates,
  getIntegrationUsage,
  getRecentActivity,
  getAverageTimeToFirstWorkflow,
  ANALYTICS_SCHEMA,
  AGGREGATION_FUNCTIONS,
};
