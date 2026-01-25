/**
 * UsageAnalytics
 *
 * Comprehensive usage analytics widget for the dashboard.
 * Displays execution charts, limit tracking, breakdown tables, and export options.
 * Features tab-based navigation for different analytics views.
 */

import { useState, useMemo, useCallback } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  LineChartIcon,
  PieChartIcon,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Clock,
  Zap,
  CheckCircle,
  XCircle,
  FileText,
  Table,
  Activity,
  RefreshCw
} from 'lucide-react'

// ==================== Types ====================

type TimeRange = 'today' | '7days' | '30days' | 'custom'
type TabView = 'overview' | 'charts' | 'tables' | 'limits'

interface ExecutionData {
  date: string
  executions: number
  successful: number
  failed: number
}

interface WorkflowUsage {
  name: string
  executions: number
  successRate: number
  avgDuration: number
}

interface IntegrationUsage {
  name: string
  calls: number
  errors: number
}

interface HourlyUsage {
  hour: number
  count: number
}

interface PlanLimits {
  workflows: { current: number; max: number }
  executions: { current: number; max: number; period: string }
  integrations: { current: number; max: number }
}

interface UsageAnalyticsProps {
  className?: string
  userId?: string
}

// ==================== Mock Data Generation ====================

function generateMockExecutionData(days: number): ExecutionData[] {
  const data: ExecutionData[] = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const total = Math.floor(Math.random() * 50) + 10
    const successful = Math.floor(total * (0.85 + Math.random() * 0.1))

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      executions: total,
      successful,
      failed: total - successful
    })
  }

  return data
}

function generateMockWorkflowUsage(): WorkflowUsage[] {
  const workflows = [
    'Email Automation',
    'Data Sync Pipeline',
    'Customer Onboarding',
    'Invoice Processing',
    'Report Generator',
    'Lead Nurture Flow',
    'Inventory Alerts',
    'Social Media Poster'
  ]

  return workflows.map((name) => ({
    name,
    executions: Math.floor(Math.random() * 200) + 20,
    successRate: 85 + Math.random() * 14,
    avgDuration: Math.floor(Math.random() * 5000) + 500
  }))
}

function generateMockIntegrationUsage(): IntegrationUsage[] {
  const integrations = [
    'Gmail',
    'Slack',
    'Google Sheets',
    'Salesforce',
    'HubSpot',
    'Stripe',
    'Twilio',
    'OpenAI'
  ]

  return integrations.map((name) => ({
    name,
    calls: Math.floor(Math.random() * 500) + 50,
    errors: Math.floor(Math.random() * 20)
  }))
}

function generateMockHourlyUsage(): HourlyUsage[] {
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count:
      hour >= 9 && hour <= 18
        ? Math.floor(Math.random() * 30) + 15
        : Math.floor(Math.random() * 10) + 2
  }))
}

const MOCK_PLAN_LIMITS: PlanLimits = {
  workflows: { current: 12, max: 25 },
  executions: { current: 847, max: 1000, period: 'month' },
  integrations: { current: 8, max: 15 }
}

// ==================== Chart Colors ====================

const CHART_COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#06b6d4',
  muted: '#64748b'
}

const PIE_COLORS = [CHART_COLORS.success, CHART_COLORS.error]

// ==================== Custom Tooltip ====================

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; color?: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-sm font-medium text-slate-200 mb-2">{label}</p>
      {payload.map((entry: { name?: string; value?: number; color?: string }, index: number) => (
        <p
          key={index}
          className="text-sm"
          style={{ color: entry.color || CHART_COLORS.primary }}
        >
          {entry.name}: {entry.value?.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

// ==================== Tab Button Component ====================

interface TabButtonProps {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all',
        active
          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
          : 'text-muted-foreground hover:text-foreground hover:bg-slate-800/50'
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

// ==================== Time Range Selector ====================

interface TimeRangeSelectorProps {
  value: TimeRange
  onChange: (range: TimeRange) => void
}

function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const ranges: { key: TimeRange; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: '7days', label: '7 Days' },
    { key: '30days', label: '30 Days' },
    { key: 'custom', label: 'Custom' }
  ]

  return (
    <div className="flex items-center gap-1 p-1 bg-slate-800/50 rounded-lg">
      {ranges.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
            value === key
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-slate-700/50'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ==================== Heatmap Component ====================

interface HeatmapProps {
  data: HourlyUsage[]
}

function UsageHeatmap({ data }: HeatmapProps) {
  const maxCount = Math.max(...data.map((d) => d.count))

  const getIntensity = (count: number) => {
    const ratio = count / maxCount
    if (ratio < 0.25) return 'bg-emerald-900/30'
    if (ratio < 0.5) return 'bg-emerald-700/50'
    if (ratio < 0.75) return 'bg-emerald-500/70'
    return 'bg-emerald-400'
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>12 AM</span>
        <span>Peak Hours</span>
        <span>11 PM</span>
      </div>
      <div className="grid grid-cols-12 gap-1">
        {data.map(({ hour, count }) => (
          <div
            key={hour}
            className={cn(
              'aspect-square rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-primary/50',
              getIntensity(count)
            )}
            title={`${hour}:00 - ${count} executions`}
          />
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-emerald-900/30" />
          <div className="w-3 h-3 rounded-sm bg-emerald-700/50" />
          <div className="w-3 h-3 rounded-sm bg-emerald-500/70" />
          <div className="w-3 h-3 rounded-sm bg-emerald-400" />
        </div>
        <span>More</span>
      </div>
    </div>
  )
}

// ==================== Limit Progress Card ====================

interface LimitProgressProps {
  label: string
  current: number
  max: number
  icon: React.ReactNode
  period?: string
}

function LimitProgress({
  label,
  current,
  max,
  icon,
  period
}: LimitProgressProps) {
  const percentage = (current / max) * 100
  const isWarning = percentage >= 80
  const isCritical = percentage >= 95

  return (
    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        {isCritical && (
          <Badge variant="destructive" className="text-xs">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Critical
          </Badge>
        )}
        {isWarning && !isCritical && (
          <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-400">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Warning
          </Badge>
        )}
      </div>

      <Progress
        value={current}
        max={max}
        className={cn(
          'h-2',
          isCritical && '[&>div]:bg-red-500',
          isWarning && !isCritical && '[&>div]:bg-amber-500'
        )}
      />

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {current.toLocaleString()} / {max.toLocaleString()} used
        </span>
        <span
          className={cn(
            isCritical
              ? 'text-red-400'
              : isWarning
              ? 'text-amber-400'
              : 'text-emerald-400'
          )}
        >
          {percentage.toFixed(1)}%
        </span>
      </div>

      {period && (
        <p className="text-xs text-muted-foreground">Resets each {period}</p>
      )}
    </div>
  )
}

// ==================== Workflow Table ====================

interface WorkflowTableProps {
  data: WorkflowUsage[]
  type: 'top' | 'failing' | 'slowest'
}

function WorkflowTable({ data, type }: WorkflowTableProps) {
  const sortedData = useMemo(() => {
    const sorted = [...data]
    switch (type) {
      case 'top':
        return sorted.sort((a, b) => b.executions - a.executions).slice(0, 5)
      case 'failing':
        return sorted
          .sort((a, b) => a.successRate - b.successRate)
          .slice(0, 5)
      case 'slowest':
        return sorted.sort((a, b) => b.avgDuration - a.avgDuration).slice(0, 5)
      default:
        return sorted.slice(0, 5)
    }
  }, [data, type])

  const getTitle = () => {
    switch (type) {
      case 'top':
        return 'Most Used Workflows'
      case 'failing':
        return 'Highest Failure Rate'
      case 'slowest':
        return 'Slowest Workflows'
    }
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold flex items-center gap-2">
        {type === 'top' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
        {type === 'failing' && <XCircle className="w-4 h-4 text-red-400" />}
        {type === 'slowest' && <Clock className="w-4 h-4 text-amber-400" />}
        {getTitle()}
      </h4>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                Workflow
              </th>
              <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                Executions
              </th>
              <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                {type === 'slowest' ? 'Avg Time' : 'Success'}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((workflow, index) => (
              <tr
                key={workflow.name}
                className="border-b border-slate-700/50 hover:bg-slate-800/30"
              >
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                      #{index + 1}
                    </span>
                    <span className="truncate max-w-[150px]">{workflow.name}</span>
                  </div>
                </td>
                <td className="text-right py-2 px-3">
                  {workflow.executions.toLocaleString()}
                </td>
                <td className="text-right py-2 px-3">
                  {type === 'slowest' ? (
                    <span className="text-amber-400">
                      {(workflow.avgDuration / 1000).toFixed(1)}s
                    </span>
                  ) : (
                    <span
                      className={cn(
                        workflow.successRate >= 95
                          ? 'text-emerald-400'
                          : workflow.successRate >= 85
                          ? 'text-amber-400'
                          : 'text-red-400'
                      )}
                    >
                      {workflow.successRate.toFixed(1)}%
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ==================== Integration Table ====================

interface IntegrationTableProps {
  data: IntegrationUsage[]
}

function IntegrationTable({ data }: IntegrationTableProps) {
  const sortedData = useMemo(
    () => [...data].sort((a, b) => b.calls - a.calls).slice(0, 5),
    [data]
  )

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold flex items-center gap-2">
        <Zap className="w-4 h-4 text-primary" />
        Integration Usage
      </h4>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                Integration
              </th>
              <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                API Calls
              </th>
              <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                Errors
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((integration) => (
              <tr
                key={integration.name}
                className="border-b border-slate-700/50 hover:bg-slate-800/30"
              >
                <td className="py-2 px-3">{integration.name}</td>
                <td className="text-right py-2 px-3">
                  {integration.calls.toLocaleString()}
                </td>
                <td className="text-right py-2 px-3">
                  <span
                    className={cn(
                      integration.errors > 10
                        ? 'text-red-400'
                        : integration.errors > 0
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    )}
                  >
                    {integration.errors}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ==================== Export Options ====================

interface ExportOptionsProps {
  onExportPDF: () => void
  onExportCSV: () => void
  onScheduleReport: () => void
}

function ExportOptions({
  onExportPDF,
  onExportCSV,
  onScheduleReport
}: ExportOptionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={onExportPDF}>
        <FileText className="w-4 h-4 mr-2" />
        PDF
      </Button>
      <Button variant="outline" size="sm" onClick={onExportCSV}>
        <Table className="w-4 h-4 mr-2" />
        CSV
      </Button>
      <Button variant="outline" size="sm" onClick={onScheduleReport}>
        <Calendar className="w-4 h-4 mr-2" />
        Schedule
      </Button>
    </div>
  )
}

// ==================== Loading State ====================

function UsageAnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton height={32} width={200} />
        <Skeleton height={36} width={180} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={120} />
        ))}
      </div>
      <Skeleton height={300} />
    </div>
  )
}

// ==================== Overview Tab ====================

interface OverviewTabProps {
  executionData: ExecutionData[]
  hourlyData: HourlyUsage[]
  limits: PlanLimits
}

function OverviewTab({ executionData, hourlyData, limits }: OverviewTabProps) {
  const totals = useMemo(() => {
    const total = executionData.reduce((sum, d) => sum + d.executions, 0)
    const successful = executionData.reduce((sum, d) => sum + d.successful, 0)
    const failed = executionData.reduce((sum, d) => sum + d.failed, 0)
    return { total, successful, failed }
  }, [executionData])

  const successRate = ((totals.successful / totals.total) * 100).toFixed(1)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Activity className="w-4 h-4" />
            Total Executions
          </div>
          <p className="text-2xl font-bold">{totals.total.toLocaleString()}</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 rounded-lg border border-emerald-500/20">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <CheckCircle className="w-4 h-4" />
            Successful
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            {totals.successful.toLocaleString()}
          </p>
        </div>

        <div className="p-4 bg-gradient-to-br from-red-500/20 to-red-500/5 rounded-lg border border-red-500/20">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <XCircle className="w-4 h-4" />
            Failed
          </div>
          <p className="text-2xl font-bold text-red-400">
            {totals.failed.toLocaleString()}
          </p>
        </div>

        <div className="p-4 bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 rounded-lg border border-cyan-500/20">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <TrendingUp className="w-4 h-4" />
            Success Rate
          </div>
          <p className="text-2xl font-bold text-cyan-400">{successRate}%</p>
        </div>
      </div>

      {/* Executions Over Time */}
      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <LineChartIcon className="w-4 h-4 text-primary" />
          Executions Over Time
        </h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={executionData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
            />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="successful"
              name="Successful"
              stroke={CHART_COLORS.success}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="failed"
              name="Failed"
              stroke={CHART_COLORS.error}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Peak Hours + Limits Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Peak Usage Hours
          </h4>
          <UsageHeatmap data={hourlyData} />
        </div>

        <div className="space-y-4">
          <LimitProgress
            label="Workflows"
            current={limits.workflows.current}
            max={limits.workflows.max}
            icon={<Zap className="w-4 h-4 text-primary" />}
          />
          <LimitProgress
            label="Executions"
            current={limits.executions.current}
            max={limits.executions.max}
            period={limits.executions.period}
            icon={<Activity className="w-4 h-4 text-cyan-400" />}
          />
        </div>
      </div>
    </div>
  )
}

// ==================== Charts Tab ====================

interface ChartsTabProps {
  executionData: ExecutionData[]
  workflowData: WorkflowUsage[]
  hourlyData: HourlyUsage[]
}

function ChartsTab({ executionData, workflowData, hourlyData }: ChartsTabProps) {
  const pieData = useMemo(() => {
    const successful = executionData.reduce((sum, d) => sum + d.successful, 0)
    const failed = executionData.reduce((sum, d) => sum + d.failed, 0)
    return [
      { name: 'Successful', value: successful },
      { name: 'Failed', value: failed }
    ]
  }, [executionData])

  const barData = useMemo(
    () =>
      [...workflowData]
        .sort((a, b) => b.executions - a.executions)
        .slice(0, 8)
        .map((w) => ({
          name: w.name.length > 15 ? w.name.substring(0, 12) + '...' : w.name,
          executions: w.executions
        })),
    [workflowData]
  )

  return (
    <div className="space-y-6">
      {/* Line Chart - Executions Over Time */}
      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <LineChartIcon className="w-4 h-4 text-primary" />
          Executions Over Time
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={executionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="executions"
              name="Total"
              stroke={CHART_COLORS.primary}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="successful"
              name="Successful"
              stroke={CHART_COLORS.success}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="failed"
              name="Failed"
              stroke={CHART_COLORS.error}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Executions by Workflow */}
        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-secondary" />
            Executions by Workflow
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#64748b" fontSize={12} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#64748b"
                fontSize={11}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="executions"
                name="Executions"
                fill={CHART_COLORS.primary}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Success vs Failure */}
        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-cyan-400" />
            Success vs Failure Rate
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }: { name?: string; percent?: number }) =>
                  `${name ?? ''}: ${((percent ?? 0) * 100).toFixed(1)}%`
                }
                labelLine={false}
              >
                {pieData.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heatmap */}
      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          Peak Usage Hours (24h Distribution)
        </h4>
        <UsageHeatmap data={hourlyData} />
      </div>
    </div>
  )
}

// ==================== Tables Tab ====================

interface TablesTabProps {
  workflowData: WorkflowUsage[]
  integrationData: IntegrationUsage[]
}

function TablesTab({ workflowData, integrationData }: TablesTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <WorkflowTable data={workflowData} type="top" />
        </div>

        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <WorkflowTable data={workflowData} type="failing" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <WorkflowTable data={workflowData} type="slowest" />
        </div>

        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <IntegrationTable data={integrationData} />
        </div>
      </div>
    </div>
  )
}

// ==================== Limits Tab ====================

interface LimitsTabProps {
  limits: PlanLimits
  executionData: ExecutionData[]
}

function LimitsTab({ limits, executionData }: LimitsTabProps) {
  const projectedUsage = useMemo(() => {
    const avg =
      executionData.reduce((sum, d) => sum + d.executions, 0) /
      executionData.length
    const daysInMonth = 30
    const daysElapsed = executionData.length
    const projected = (avg * daysInMonth).toFixed(0)
    const isOverLimit = Number(projected) > limits.executions.max
    return { avg: avg.toFixed(1), projected, isOverLimit, daysElapsed }
  }, [executionData, limits.executions.max])

  return (
    <div className="space-y-6">
      {/* Current Plan Limits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <LimitProgress
          label="Active Workflows"
          current={limits.workflows.current}
          max={limits.workflows.max}
          icon={<Zap className="w-4 h-4 text-primary" />}
        />
        <LimitProgress
          label="Monthly Executions"
          current={limits.executions.current}
          max={limits.executions.max}
          period={limits.executions.period}
          icon={<Activity className="w-4 h-4 text-cyan-400" />}
        />
        <LimitProgress
          label="Connected Integrations"
          current={limits.integrations.current}
          max={limits.integrations.max}
          icon={<Zap className="w-4 h-4 text-emerald-400" />}
        />
      </div>

      {/* Projected Usage */}
      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Projected Usage (End of Period)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-slate-700/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">
              Daily Average
            </p>
            <p className="text-xl font-semibold">{projectedUsage.avg}</p>
            <p className="text-xs text-muted-foreground">executions/day</p>
          </div>

          <div className="p-3 bg-slate-700/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">
              Days Tracked
            </p>
            <p className="text-xl font-semibold">{projectedUsage.daysElapsed}</p>
            <p className="text-xs text-muted-foreground">days this period</p>
          </div>

          <div
            className={cn(
              'p-3 rounded-lg',
              projectedUsage.isOverLimit
                ? 'bg-red-500/20 border border-red-500/30'
                : 'bg-emerald-500/20 border border-emerald-500/30'
            )}
          >
            <p className="text-xs text-muted-foreground mb-1">
              Projected Monthly Total
            </p>
            <p
              className={cn(
                'text-xl font-semibold',
                projectedUsage.isOverLimit ? 'text-red-400' : 'text-emerald-400'
              )}
            >
              {Number(projectedUsage.projected).toLocaleString()}
            </p>
            {projectedUsage.isOverLimit ? (
              <div className="flex items-center gap-1 text-xs text-red-400">
                <AlertTriangle className="w-3 h-3" />
                Over limit by{' '}
                {(
                  Number(projectedUsage.projected) - limits.executions.max
                ).toLocaleString()}
              </div>
            ) : (
              <p className="text-xs text-emerald-400">Within limits</p>
            )}
          </div>
        </div>
      </div>

      {/* Overage Warning */}
      {projectedUsage.isOverLimit && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-400 mb-1">
              Usage Alert
            </h4>
            <p className="text-sm text-muted-foreground">
              Based on current usage patterns, you are projected to exceed your
              monthly execution limit. Consider upgrading your plan or optimizing
              workflow execution frequency to avoid overage charges.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
            >
              View Upgrade Options
            </Button>
          </div>
        </div>
      )}

      {/* Upgrade CTA */}
      <div className="p-4 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 rounded-lg border border-primary/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h4 className="font-semibold mb-1">Need More Capacity?</h4>
            <p className="text-sm text-muted-foreground">
              Upgrade your plan for unlimited workflows and higher execution limits.
            </p>
          </div>
          <Button variant="default" size="sm">
            Upgrade Plan
          </Button>
        </div>
      </div>
    </div>
  )
}

// ==================== Main Component ====================

export function UsageAnalytics({ className }: UsageAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<TabView>('overview')
  const [timeRange, setTimeRange] = useState<TimeRange>('7days')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Generate mock data based on time range
  const getDaysForRange = useCallback((range: TimeRange): number => {
    switch (range) {
      case 'today':
        return 1
      case '7days':
        return 7
      case '30days':
        return 30
      case 'custom':
        return 14 // Default custom range
      default:
        return 7
    }
  }, [])

  const executionData = useMemo(
    () => generateMockExecutionData(getDaysForRange(timeRange)),
    [timeRange, getDaysForRange]
  )
  const workflowData = useMemo(() => generateMockWorkflowUsage(), [])
  const integrationData = useMemo(() => generateMockIntegrationUsage(), [])
  const hourlyData = useMemo(() => generateMockHourlyUsage(), [])

  // Simulate initial load
  useState(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  })

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }, [])

  const handleExportPDF = useCallback(() => {
    console.log('Exporting PDF...')
    // Placeholder for PDF export functionality
  }, [])

  const handleExportCSV = useCallback(() => {
    console.log('Exporting CSV...')
    // Placeholder for CSV export functionality
  }, [])

  const handleScheduleReport = useCallback(() => {
    console.log('Opening schedule dialog...')
    // Placeholder for schedule report functionality
  }, [])

  if (isLoading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Usage Analytics
          </CardTitle>
          <CardDescription>Loading analytics data...</CardDescription>
        </CardHeader>
        <CardContent>
          <UsageAnalyticsLoading />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Usage Analytics
            </CardTitle>
            <CardDescription>
              Monitor workflow executions, limits, and performance
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={cn('w-4 h-4 mr-2', isRefreshing && 'animate-spin')}
              />
              Refresh
            </Button>
            <ExportOptions
              onExportPDF={handleExportPDF}
              onExportCSV={handleExportCSV}
              onScheduleReport={handleScheduleReport}
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 pt-4 border-t border-slate-700/50">
          <div className="flex items-center gap-1 p-1 bg-slate-800/30 rounded-lg overflow-x-auto">
            <TabButton
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              icon={<Activity className="w-4 h-4" />}
              label="Overview"
            />
            <TabButton
              active={activeTab === 'charts'}
              onClick={() => setActiveTab('charts')}
              icon={<BarChart3 className="w-4 h-4" />}
              label="Charts"
            />
            <TabButton
              active={activeTab === 'tables'}
              onClick={() => setActiveTab('tables')}
              icon={<Table className="w-4 h-4" />}
              label="Tables"
            />
            <TabButton
              active={activeTab === 'limits'}
              onClick={() => setActiveTab('limits')}
              icon={<Zap className="w-4 h-4" />}
              label="Limits"
            />
          </div>

          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        </div>
      </CardHeader>

      <CardContent>
        {activeTab === 'overview' && (
          <OverviewTab
            executionData={executionData}
            hourlyData={hourlyData}
            limits={MOCK_PLAN_LIMITS}
          />
        )}

        {activeTab === 'charts' && (
          <ChartsTab
            executionData={executionData}
            workflowData={workflowData}
            hourlyData={hourlyData}
          />
        )}

        {activeTab === 'tables' && (
          <TablesTab
            workflowData={workflowData}
            integrationData={integrationData}
          />
        )}

        {activeTab === 'limits' && (
          <LimitsTab limits={MOCK_PLAN_LIMITS} executionData={executionData} />
        )}
      </CardContent>
    </Card>
  )
}

export default UsageAnalytics
