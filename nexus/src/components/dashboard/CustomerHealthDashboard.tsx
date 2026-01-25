/**
 * CustomerHealthDashboard
 *
 * Comprehensive health monitoring dashboard showing:
 * - Overall health scores with color-coded indicators
 * - Key metrics (workflows, executions, error rates)
 * - Active alerts requiring attention
 * - Quick action buttons for common tasks
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  RefreshCw,
  Activity,
  Zap,
  Link2,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  CreditCard,
  HeadphonesIcon,
  ArrowUpRight,
  Plug,
  Eye,
  Sparkles,
} from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

interface HealthScore {
  overall: number
  workflowReliability: number
  integrationConnectivity: number
  executionSuccessRate: number
}

interface UsageMetrics {
  activeWorkflows: number
  executionsThisPeriod: number
  executionLimit: number
  averageExecutionTime: number // in seconds
  errorRate: number
  errorRateTrend: 'up' | 'down' | 'stable'
}

interface Alert {
  id: string
  type: 'failed_workflow' | 'integration_disconnected' | 'usage_limit' | 'billing'
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  actionLabel?: string
  actionType?: 'view' | 'reconnect' | 'upgrade' | 'support'
  relatedId?: string
  timestamp: Date
}

interface CustomerHealthDashboardProps {
  className?: string
  onViewFailedExecutions?: () => void
  onReconnectIntegration?: (integrationId: string) => void
  onUpgradePlan?: () => void
  onContactSupport?: () => void
}

// ============================================================================
// Mock Data Generator (replace with real API calls)
// ============================================================================

function generateMockHealthData(): { scores: HealthScore; metrics: UsageMetrics; alerts: Alert[] } {
  const overall = Math.floor(Math.random() * 40) + 60 // 60-100
  const scores: HealthScore = {
    overall,
    workflowReliability: Math.floor(Math.random() * 30) + 70,
    integrationConnectivity: Math.floor(Math.random() * 20) + 80,
    executionSuccessRate: Math.floor(Math.random() * 15) + 85,
  }

  const metrics: UsageMetrics = {
    activeWorkflows: Math.floor(Math.random() * 20) + 5,
    executionsThisPeriod: Math.floor(Math.random() * 800) + 200,
    executionLimit: 1000,
    averageExecutionTime: Math.random() * 10 + 2,
    errorRate: Math.random() * 10,
    errorRateTrend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
  }

  const alerts: Alert[] = []

  // Generate random alerts
  if (Math.random() > 0.5) {
    alerts.push({
      id: 'alert-1',
      type: 'failed_workflow',
      severity: 'critical',
      title: 'Workflow Failed: Order Processing',
      description: 'Failed 3 times in the last 24 hours',
      actionLabel: 'View Details',
      actionType: 'view',
      relatedId: 'wf-123',
      timestamp: new Date(Date.now() - 3600000),
    })
  }

  if (Math.random() > 0.6) {
    alerts.push({
      id: 'alert-2',
      type: 'integration_disconnected',
      severity: 'warning',
      title: 'Slack Integration Disconnected',
      description: 'Authentication expired 2 hours ago',
      actionLabel: 'Reconnect',
      actionType: 'reconnect',
      relatedId: 'int-slack',
      timestamp: new Date(Date.now() - 7200000),
    })
  }

  if (metrics.executionsThisPeriod / metrics.executionLimit > 0.8) {
    alerts.push({
      id: 'alert-3',
      type: 'usage_limit',
      severity: 'warning',
      title: 'Approaching Usage Limit',
      description: `${Math.round((metrics.executionsThisPeriod / metrics.executionLimit) * 100)}% of monthly executions used`,
      actionLabel: 'Upgrade Plan',
      actionType: 'upgrade',
      timestamp: new Date(),
    })
  }

  if (Math.random() > 0.7) {
    alerts.push({
      id: 'alert-4',
      type: 'billing',
      severity: 'info',
      title: 'Upcoming Renewal',
      description: 'Your subscription renews in 5 days',
      actionLabel: 'View Billing',
      actionType: 'view',
      timestamp: new Date(Date.now() - 86400000),
    })
  }

  return { scores, metrics, alerts }
}

// ============================================================================
// Utility Functions
// ============================================================================

function getHealthColor(score: number): string {
  if (score >= 80) return 'text-emerald-500'
  if (score >= 50) return 'text-amber-500'
  return 'text-red-500'
}

function getHealthGradient(score: number): string {
  if (score >= 80) return 'from-emerald-500 to-green-400'
  if (score >= 50) return 'from-amber-500 to-yellow-400'
  return 'from-red-500 to-rose-400'
}

function getHealthLabel(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 50) return 'Needs Attention'
  return 'Critical'
}

function getHealthIcon(score: number) {
  if (score >= 80) return CheckCircle
  if (score >= 50) return AlertTriangle
  return XCircle
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}m ${secs.toFixed(0)}s`
}

function formatNumber(num: number): string {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return num.toString()
}

// ============================================================================
// Sub-components
// ============================================================================

interface AnimatedCounterProps {
  value: number
  duration?: number
  decimals?: number
  suffix?: string
  prefix?: string
}

function AnimatedCounter({
  value,
  duration = 1000,
  decimals = 0,
  suffix = '',
  prefix = '',
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const startTimeRef = useRef<number | null>(null)
  const startValueRef = useRef(0)

  useEffect(() => {
    startValueRef.current = displayValue
    startTimeRef.current = null

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1)

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentValue = startValueRef.current + (value - startValueRef.current) * easeOut

      setDisplayValue(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return (
    <span>
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  )
}

interface HealthScoreCardProps {
  title: string
  score: number
  icon: React.ReactNode
  description?: string
}

function HealthScoreCard({ title, score, icon, description }: HealthScoreCardProps) {
  const HealthIcon = getHealthIcon(score)

  return (
    <Card className="relative overflow-hidden">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${getHealthGradient(score)} opacity-5`}
      />
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            {icon}
            <span className="text-sm font-medium">{title}</span>
          </div>
          <HealthIcon className={`w-5 h-5 ${getHealthColor(score)}`} />
        </div>

        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold ${getHealthColor(score)}`}>
            <AnimatedCounter value={score} />
          </span>
          <span className="text-sm text-muted-foreground">/ 100</span>
        </div>

        <Progress
          value={score}
          className="h-2 mt-3"
        />

        {description && (
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        )}

        <Badge
          variant={score >= 80 ? 'default' : score >= 50 ? 'secondary' : 'destructive'}
          className="mt-3"
        >
          {getHealthLabel(score)}
        </Badge>
      </CardContent>
    </Card>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'stable'
  trendIsGood?: boolean
  progress?: { current: number; max: number }
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendIsGood,
  progress,
}: MetricCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <div className="p-2 rounded-lg bg-muted">{icon}</div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">
            {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
          </span>
          {trend && TrendIcon && (
            <div
              className={`flex items-center gap-1 text-xs ${
                (trend === 'down' && trendIsGood) || (trend === 'up' && !trendIsGood)
                  ? 'text-emerald-500'
                  : (trend === 'up' && trendIsGood) || (trend === 'down' && !trendIsGood)
                  ? 'text-red-500'
                  : 'text-muted-foreground'
              }`}
            >
              <TrendIcon className="w-3 h-3" />
              <span>{trend === 'up' ? 'Up' : 'Down'}</span>
            </div>
          )}
        </div>

        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}

        {progress && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>{formatNumber(progress.current)}</span>
              <span>{formatNumber(progress.max)}</span>
            </div>
            <Progress value={(progress.current / progress.max) * 100} className="h-1.5" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface AlertItemProps {
  alert: Alert
  onAction?: (alert: Alert) => void
}

function AlertItem({ alert, onAction }: AlertItemProps) {
  const severityConfig = {
    critical: {
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
    },
    info: {
      icon: AlertCircle,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
    },
  }

  const config = severityConfig[alert.severity]
  const Icon = config.icon

  const timeAgo = getTimeAgo(alert.timestamp)

  return (
    <div
      className={`p-3 rounded-lg border ${config.bgColor} ${config.borderColor} transition-all hover:shadow-md`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-medium truncate">{alert.title}</h4>
            <span className="text-xs text-muted-foreground flex-shrink-0">{timeAgo}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
          {alert.actionLabel && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-7 px-2 text-xs"
              onClick={() => onAction?.(alert)}
            >
              {alert.actionLabel}
              <ArrowUpRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

// ============================================================================
// Main Component
// ============================================================================

export function CustomerHealthDashboard({
  className = '',
  onViewFailedExecutions,
  onReconnectIntegration,
  onUpgradePlan,
  onContactSupport,
}: CustomerHealthDashboardProps) {
  const [healthData, setHealthData] = useState<{
    scores: HealthScore
    metrics: UsageMetrics
    alerts: Alert[]
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  const fetchHealthData = useCallback(async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800))
    const data = generateMockHealthData()
    setHealthData(data)
    setLastRefreshed(new Date())
  }, [])

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await fetchHealthData()
      setIsLoading(false)
    }
    loadData()
  }, [fetchHealthData])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchHealthData()
    setIsRefreshing(false)
  }

  const handleAlertAction = (alert: Alert) => {
    switch (alert.actionType) {
      case 'view':
        if (alert.type === 'failed_workflow') {
          onViewFailedExecutions?.()
        }
        break
      case 'reconnect':
        if (alert.relatedId) {
          onReconnectIntegration?.(alert.relatedId)
        }
        break
      case 'upgrade':
        onUpgradePlan?.()
        break
      case 'support':
        onContactSupport?.()
        break
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Customer Health Dashboard
          </CardTitle>
          <CardDescription>Loading health metrics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!healthData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Customer Health Dashboard
          </CardTitle>
          <CardDescription>Unable to load health data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <AlertCircle className="w-12 h-12 text-muted-foreground" />
            <Button onClick={handleRefresh}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { scores, metrics, alerts } = healthData
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical')
  const warningAlerts = alerts.filter((a) => a.severity === 'warning')

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Customer Health Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor your workflow health and system status
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-xs text-muted-foreground">
              Last updated: {lastRefreshed.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Health Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <HealthScoreCard
          title="Overall Health"
          score={scores.overall}
          icon={<Sparkles className="w-4 h-4" />}
          description="Combined health across all metrics"
        />
        <HealthScoreCard
          title="Workflow Reliability"
          score={scores.workflowReliability}
          icon={<Zap className="w-4 h-4" />}
          description="Workflow execution stability"
        />
        <HealthScoreCard
          title="Integration Status"
          score={scores.integrationConnectivity}
          icon={<Link2 className="w-4 h-4" />}
          description="Connected integrations health"
        />
        <HealthScoreCard
          title="Success Rate"
          score={scores.executionSuccessRate}
          icon={<CheckCircle className="w-4 h-4" />}
          description="Execution success percentage"
        />
      </div>

      {/* Key Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Key Metrics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Active Workflows"
            value={metrics.activeWorkflows}
            subtitle="Currently enabled"
            icon={<Zap className="w-4 h-4 text-primary" />}
          />
          <MetricCard
            title="Executions This Period"
            value={metrics.executionsThisPeriod}
            subtitle={`of ${formatNumber(metrics.executionLimit)} limit`}
            icon={<Activity className="w-4 h-4 text-primary" />}
            progress={{
              current: metrics.executionsThisPeriod,
              max: metrics.executionLimit,
            }}
          />
          <MetricCard
            title="Avg Execution Time"
            value={formatTime(metrics.averageExecutionTime)}
            subtitle="Per workflow run"
            icon={<Clock className="w-4 h-4 text-primary" />}
          />
          <MetricCard
            title="Error Rate"
            value={`${metrics.errorRate.toFixed(1)}%`}
            subtitle="Last 7 days"
            icon={<AlertTriangle className="w-4 h-4 text-primary" />}
            trend={metrics.errorRateTrend}
            trendIsGood={false}
          />
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Alerts
              {criticalAlerts.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {criticalAlerts.length} Critical
                </Badge>
              )}
              {warningAlerts.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {warningAlerts.length} Warning
                </Badge>
              )}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts
              .sort((a, b) => {
                const severityOrder = { critical: 0, warning: 1, info: 2 }
                return severityOrder[a.severity] - severityOrder[b.severity]
              })
              .map((alert) => (
                <AlertItem key={alert.id} alert={alert} onAction={handleAlertAction} />
              ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Common tasks to maintain system health</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={onViewFailedExecutions}
            >
              <Eye className="w-5 h-5" />
              <span className="text-xs">View Failed</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => onReconnectIntegration?.('')}
            >
              <Plug className="w-5 h-5" />
              <span className="text-xs">Reconnect</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={onUpgradePlan}
            >
              <CreditCard className="w-5 h-5" />
              <span className="text-xs">Upgrade Plan</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={onContactSupport}
            >
              <HeadphonesIcon className="w-5 h-5" />
              <span className="text-xs">Get Support</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CustomerHealthDashboard
