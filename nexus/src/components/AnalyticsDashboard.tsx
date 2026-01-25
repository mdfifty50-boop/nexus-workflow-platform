/**
 * Analytics Dashboard Component
 *
 * Displays key metrics, workflow success rates, popular templates,
 * user engagement metrics, and conversion funnels.
 * Supports RTL layout and Arabic locale.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getDashboardData,
  type DashboardData,
  type TimeSeriesData,
  type FunnelData,
  type TopEvent,
} from '../lib/analytics';

// =============================================================================
// Types
// =============================================================================

interface MetricCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
}

interface ChartProps {
  data: TimeSeriesData[];
  title: string;
  color?: string;
  height?: number;
  isLoading?: boolean;
}

interface FunnelChartProps {
  data: FunnelData[];
  title: string;
  isLoading?: boolean;
}

type DateRange = '7d' | '30d' | '90d';

// =============================================================================
// Utility Functions
// =============================================================================

function formatNumber(num: number, locale: string = 'en'): string {
  return new Intl.NumberFormat(locale, {
    notation: num > 999999 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(num);
}

function formatPercentage(num: number, locale: string = 'en'): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(num / 100);
}

function formatDate(dateStr: string, locale: string = 'en'): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

// =============================================================================
// Skeleton Components
// =============================================================================

function SkeletonCard(): React.ReactElement {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
    </div>
  );
}

function SkeletonChart(): React.ReactElement {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
      <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  );
}

// =============================================================================
// Metric Card Component
// =============================================================================

function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  isLoading,
}: MetricCardProps): React.ReactElement {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const locale = i18n.language;

  if (isLoading) {
    return <SkeletonCard />;
  }

  const formattedValue = typeof value === 'number' ? formatNumber(value, locale) : value;
  const isPositiveChange = change !== undefined && change >= 0;

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </span>
        {icon && (
          <span className="text-gray-400 dark:text-gray-500">
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-gray-900 dark:text-white">
          {formattedValue}
        </span>
        {change !== undefined && (
          <span
            className={`text-sm font-medium ${
              isPositiveChange
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {isPositiveChange ? '+' : ''}
            {formatPercentage(change, locale)}
          </span>
        )}
      </div>
      {changeLabel && (
        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {changeLabel}
        </span>
      )}
    </div>
  );
}

// =============================================================================
// Simple Line Chart Component
// =============================================================================

function SimpleLineChart({
  data,
  title,
  color = '#3b82f6',
  height = 200,
  isLoading,
}: ChartProps): React.ReactElement {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const locale = i18n.language;

  if (isLoading) {
    return <SkeletonChart />;
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
          {title}
        </h3>
        <div
          className="flex items-center justify-center text-gray-400 dark:text-gray-500"
          style={{ height }}
        >
          No data available
        </div>
      </div>
    );
  }

  const values = data.map(d => d.value);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue || 1;

  // Calculate chart dimensions
  const chartWidth = 100; // percentage
  const chartHeight = height - 40; // Leave room for labels
  const pointSpacing = chartWidth / (data.length - 1 || 1);

  // Generate SVG path for the line
  const points = data.map((d, i) => {
    const x = i * pointSpacing;
    const y = ((maxValue - d.value) / range) * chartHeight;
    return `${x},${y}`;
  });

  const linePath = `M ${points.join(' L ')}`;

  // Generate area path
  const areaPath = `M 0,${chartHeight} L ${points.join(' L ')} L ${chartWidth},${chartHeight} Z`;

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
        {title}
      </h3>
      <div className="relative" style={{ height }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(pct => (
            <line
              key={pct}
              x1="0"
              y1={`${pct}%`}
              x2="100%"
              y2={`${pct}%`}
              stroke="currentColor"
              strokeOpacity="0.1"
              className="text-gray-300 dark:text-gray-600"
            />
          ))}

          {/* Area under the line */}
          <path
            d={areaPath}
            fill={color}
            fillOpacity="0.1"
          />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {/* Data points */}
          {data.map((d, i) => {
            const x = i * pointSpacing;
            const y = ((maxValue - d.value) / range) * chartHeight;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="3"
                fill={color}
                className="hover:r-5 transition-all"
              />
            );
          })}
        </svg>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 dark:text-gray-400">
          {data.length > 0 && (
            <>
              <span>{formatDate(data[0].date, locale)}</span>
              <span>{formatDate(data[data.length - 1].date, locale)}</span>
            </>
          )}
        </div>

        {/* Y-axis labels */}
        <div className="absolute top-0 bottom-8 right-0 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{formatNumber(maxValue, locale)}</span>
          <span>{formatNumber(minValue, locale)}</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Funnel Chart Component
// =============================================================================

function FunnelChart({ data, title, isLoading }: FunnelChartProps): React.ReactElement {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const locale = i18n.language;

  if (isLoading) {
    return <SkeletonChart />;
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
          {title}
        </h3>
        <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-500">
          No funnel data available
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
        {title}
      </h3>
      <div className="space-y-3">
        {data.map((step, idx) => {
          const width = (step.count / maxCount) * 100;
          const colors = [
            'bg-blue-500',
            'bg-blue-400',
            'bg-blue-300',
            'bg-blue-200',
            'bg-blue-100',
          ];
          const conversionRate = step.conversionRate ?? 0;
          const dropoffRate = step.dropoffRate ?? 0;

          return (
            <div key={step.stepNumber} className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {step.step}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatNumber(step.count, locale)} ({formatPercentage(conversionRate, locale)})
                </span>
              </div>
              <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                <div
                  className={`h-full ${colors[idx % colors.length]} transition-all duration-500 flex items-center justify-end px-2`}
                  style={{ width: `${width}%` }}
                >
                  {dropoffRate > 0 && idx > 0 && (
                    <span className="text-xs text-white font-medium">
                      -{formatPercentage(dropoffRate, locale)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// Top Events Table Component
// =============================================================================

function TopEventsTable({
  events,
  isLoading,
}: {
  events: TopEvent[];
  isLoading?: boolean;
}): React.ReactElement {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const locale = i18n.language;

  if (isLoading) {
    return <SkeletonChart />;
  }

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
        {t('analytics.topEvents', 'Top Events')}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-200 dark:border-gray-700">
              <th className="pb-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {t('analytics.event', 'Event')}
              </th>
              <th className="pb-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-right">
                {t('analytics.count', 'Count')}
              </th>
              <th className="pb-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-right">
                {t('analytics.percentage', '%')}
              </th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr
                key={event.eventName}
                className="border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <td className="py-3 text-sm text-gray-900 dark:text-white">
                  <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {event.eventName}
                  </span>
                </td>
                <td className="py-3 text-sm text-gray-700 dark:text-gray-300 text-right">
                  {formatNumber(event.count, locale)}
                </td>
                <td className="py-3 text-sm text-gray-700 dark:text-gray-300 text-right">
                  {formatPercentage(event.percentage, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =============================================================================
// Popular Templates Component
// =============================================================================

function PopularTemplates({
  templates,
  isLoading,
}: {
  templates: Array<{ templateId: string; name: string; usageCount: number }>;
  isLoading?: boolean;
}): React.ReactElement {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const locale = i18n.language;

  if (isLoading) {
    return <SkeletonCard />;
  }

  const maxUsage = Math.max(...templates.map(tmpl => tmpl.usageCount), 1);

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
        {t('analytics.popularTemplates', 'Popular Templates')}
      </h3>
      <div className="space-y-4">
        {templates.map((template) => {
          const width = (template.usageCount / maxUsage) * 100;

          return (
            <div key={template.templateId}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[60%]">
                  {template.name}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatNumber(template.usageCount, locale)} {t('analytics.uses', 'uses')}
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
        {templates.length === 0 && (
          <div className="text-center text-gray-400 dark:text-gray-500 py-4">
            {t('analytics.noTemplates', 'No template usage data')}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Integration Usage Component
// =============================================================================

function IntegrationUsage({
  integrations,
  isLoading,
}: {
  integrations: Array<{ provider: string; connectionCount: number }>;
  isLoading?: boolean;
}): React.ReactElement {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const locale = i18n.language;

  if (isLoading) {
    return <SkeletonCard />;
  }

  const providerIcons: Record<string, string> = {
    google: '🔵',
    slack: '💬',
    github: '🐙',
    notion: '📝',
    stripe: '💳',
    zapier: '⚡',
    hubspot: '🧡',
    salesforce: '☁️',
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
        {t('analytics.integrationUsage', 'Integration Usage')}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {integrations.map((integration) => (
          <div
            key={integration.provider}
            className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
          >
            <span className="text-xl">
              {providerIcons[integration.provider.toLowerCase()] || '🔌'}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate capitalize">
                {integration.provider}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatNumber(integration.connectionCount, locale)} {t('analytics.connections', 'connections')}
              </p>
            </div>
          </div>
        ))}
        {integrations.length === 0 && (
          <div className="col-span-2 text-center text-gray-400 dark:text-gray-500 py-4">
            {t('analytics.noIntegrations', 'No integration data')}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Main Dashboard Component
// =============================================================================

export function AnalyticsDashboard(): React.ReactElement {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  void i18n.language; // locale available via i18n.language when needed

  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const days = useMemo(() => {
    switch (dateRange) {
      case '7d': return 7;
      case '90d': return 90;
      default: return 30;
    }
  }, [dateRange]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const dashboardData = await getDashboardData(days);
      setData(dashboardData);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
      setError(t('analytics.loadError', 'Failed to load analytics data'));
    } finally {
      setIsLoading(false);
    }
  }, [days, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Icons for metric cards
  const UserIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const WorkflowIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  );

  const CheckIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  // ClockIcon available for future use with time-related metrics
  // const ClockIcon = () => (
  //   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  //     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  //   </svg>
  // );

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('analytics.title', 'Analytics Dashboard')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('analytics.subtitle', 'Track user behavior and workflow performance')}
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDateRange('7d')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              dateRange === '7d'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {t('analytics.last7Days', '7 Days')}
          </button>
          <button
            onClick={() => setDateRange('30d')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              dateRange === '30d'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {t('analytics.last30Days', '30 Days')}
          </button>
          <button
            onClick={() => setDateRange('90d')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              dateRange === '90d'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {t('analytics.last90Days', '90 Days')}
          </button>
          <button
            onClick={loadData}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title={t('common.refresh', 'Refresh')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-700 dark:text-red-400">{error}</p>
          <button
            onClick={loadData}
            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            {t('common.retry', 'Retry')}
          </button>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title={t('analytics.dailyActiveUsers', 'Daily Active Users')}
          value={data?.metrics.dailyActiveUsers || 0}
          icon={<UserIcon />}
          isLoading={isLoading}
        />
        <MetricCard
          title={t('analytics.weeklyActiveUsers', 'Weekly Active Users')}
          value={data?.metrics.weeklyActiveUsers || 0}
          icon={<UserIcon />}
          isLoading={isLoading}
        />
        <MetricCard
          title={t('analytics.workflowExecutions', 'Workflow Executions')}
          value={data?.metrics.workflowExecutions || 0}
          icon={<WorkflowIcon />}
          isLoading={isLoading}
        />
        <MetricCard
          title={t('analytics.successRate', 'Success Rate')}
          value={`${data?.metrics.successRate || 0}%`}
          icon={<CheckIcon />}
          isLoading={isLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SimpleLineChart
          data={data?.activeUsersTimeSeries || []}
          title={t('analytics.activeUsersOverTime', 'Active Users Over Time')}
          color="#3b82f6"
          isLoading={isLoading}
        />
        <SimpleLineChart
          data={data?.workflowExecutionsTimeSeries || []}
          title={t('analytics.workflowExecutionsOverTime', 'Workflow Executions Over Time')}
          color="#10b981"
          isLoading={isLoading}
        />
      </div>

      {/* Funnel and Events Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <FunnelChart
          data={data?.signupToWorkflowFunnel || []}
          title={t('analytics.signupToWorkflowFunnel', 'Signup to First Workflow')}
          isLoading={isLoading}
        />
        <TopEventsTable
          events={data?.topEvents || []}
          isLoading={isLoading}
        />
      </div>

      {/* Templates and Integrations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PopularTemplates
          templates={data?.metrics.popularTemplates || []}
          isLoading={isLoading}
        />
        <IntegrationUsage
          integrations={data?.metrics.integrationUsage || []}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
