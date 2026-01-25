/**
 * ROI Calculator Component
 *
 * Displays automation value metrics including:
 * - Time savings calculation
 * - Cost savings estimation
 * - Productivity metrics
 * - Before/After comparison with charts
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Clock,
  DollarSign,
  TrendingUp,
  Zap,
  Settings,
  Download,
  Share2,
  ChevronDown,
  ChevronUp,
  Calculator,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

// Currency configurations
const CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar', rate: 1 },
  EUR: { symbol: '\u20AC', name: 'Euro', rate: 0.92 },
  GBP: { symbol: '\u00A3', name: 'British Pound', rate: 0.79 },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', rate: 1.36 },
  AUD: { symbol: 'A$', name: 'Australian Dollar', rate: 1.53 },
  JPY: { symbol: '\u00A5', name: 'Japanese Yen', rate: 149.5 }
}

type CurrencyCode = keyof typeof CURRENCIES

// Mock data generator for demo
function generateMockData() {
  return {
    timeSavings: {
      hoursSavedThisPeriod: 47.5,
      hoursSavedTotal: 892,
      avgTimePerWorkflow: 12.3,
      tasksAutomated: 156
    },
    costSavings: {
      errorReductionValue: 2340,
      monthlyTrend: [
        { month: 'Jul', savings: 1200 },
        { month: 'Aug', savings: 1850 },
        { month: 'Sep', savings: 2100 },
        { month: 'Oct', savings: 2650 },
        { month: 'Nov', savings: 3200 },
        { month: 'Dec', savings: 3850 }
      ]
    },
    productivity: {
      workflowsExecuted: 1247,
      manualTasksEliminated: 89,
      efficiencyImprovement: 67
    },
    comparison: {
      beforeNexus: {
        hoursPerWeek: 45,
        errorsPerMonth: 23,
        tasksManual: 120
      },
      afterNexus: {
        hoursPerWeek: 28,
        errorsPerMonth: 4,
        tasksManual: 31
      }
    }
  }
}

// Animated counter hook
function useAnimatedCounter(endValue: number, duration: number = 1500) {
  const [count, setCount] = useState(0)
  const countRef = useRef(0)
  const startTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    countRef.current = 0
    startTimeRef.current = null

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1)

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentValue = Math.floor(easeOutQuart * endValue)

      if (currentValue !== countRef.current) {
        countRef.current = currentValue
        setCount(currentValue)
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setCount(endValue)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [endValue, duration])

  return count
}

// Progress ring component
function ProgressRing({
  value,
  maxValue = 100,
  size = 120,
  strokeWidth = 8,
  color = 'var(--primary)'
}: {
  value: number
  maxValue?: number
  size?: number
  strokeWidth?: number
  color?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const progress = Math.min(value / maxValue, 1)
  const offset = circumference - progress * circumference
  const animatedValue = useAnimatedCounter(value)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{animatedValue}%</span>
      </div>
    </div>
  )
}

// Hero stat card component
function HeroStat({
  icon: Icon,
  label,
  value,
  suffix = '',
  prefix = '',
  trend,
  color = 'primary'
}: {
  icon: React.ElementType
  label: string
  value: number
  suffix?: string
  prefix?: string
  trend?: { value: number; isPositive: boolean }
  color?: 'primary' | 'green' | 'blue' | 'purple'
}) {
  const animatedValue = useAnimatedCounter(Math.floor(value))
  const colorClasses = {
    primary: 'from-primary/20 to-primary/5 border-primary/30',
    green: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30'
  }
  const iconColorClasses = {
    primary: 'text-primary',
    green: 'text-emerald-500',
    blue: 'text-blue-500',
    purple: 'text-purple-500'
  }

  return (
    <div className={`relative p-6 rounded-xl bg-gradient-to-br border ${colorClasses[color]} overflow-hidden`}>
      <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
        <Icon className="w-full h-full" />
      </div>
      <div className="relative z-10">
        <div className={`w-10 h-10 rounded-lg bg-background/80 flex items-center justify-center mb-3 ${iconColorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">
            {prefix}{animatedValue.toLocaleString()}{suffix}
          </span>
          {value % 1 !== 0 && (
            <span className="text-xl font-bold text-muted-foreground">
              .{String(value).split('.')[1]?.slice(0, 1) || '0'}
            </span>
          )}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-sm ${trend.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
            <TrendingUp className={`w-4 h-4 ${!trend.isPositive && 'rotate-180'}`} />
            <span>{trend.isPositive ? '+' : ''}{trend.value}% from last month</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Comparison bar component
function ComparisonBar({
  label,
  beforeValue,
  afterValue,
  unit = '',
  isReduction = true
}: {
  label: string
  beforeValue: number
  afterValue: number
  unit?: string
  isReduction?: boolean
}) {
  const maxValue = Math.max(beforeValue, afterValue)
  const improvement = isReduction
    ? Math.round(((beforeValue - afterValue) / beforeValue) * 100)
    : Math.round(((afterValue - beforeValue) / beforeValue) * 100)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <Badge variant={improvement > 0 ? 'default' : 'secondary'} className="gap-1">
          {improvement > 0 ? '-' : '+'}{Math.abs(improvement)}%
        </Badge>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-14">Before</span>
          <div className="flex-1 h-6 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500/70 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2"
              style={{ width: `${(beforeValue / maxValue) * 100}%` }}
            >
              <span className="text-xs font-medium text-white">{beforeValue}{unit}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-14">After</span>
          <div className="flex-1 h-6 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500/70 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2"
              style={{ width: `${(afterValue / maxValue) * 100}%` }}
            >
              <span className="text-xs font-medium text-white">{afterValue}{unit}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ROICalculatorProps {
  subscriptionCost?: number
  className?: string
}

export function ROICalculator({
  subscriptionCost = 79,
  className = ''
}: ROICalculatorProps) {
  // Settings state
  const [hourlyRate, setHourlyRate] = useState(50)
  const [teamSize, setTeamSize] = useState(5)
  const [currency, setCurrency] = useState<CurrencyCode>('USD')
  const [showSettings, setShowSettings] = useState(false)

  // Mock data
  const [data] = useState(generateMockData)

  // Calculated values
  const currencyInfo = CURRENCIES[currency]
  const hourlyRateConverted = hourlyRate * currencyInfo.rate

  const totalTimeSavings = data.timeSavings.hoursSavedTotal * hourlyRateConverted
  const periodTimeSavings = data.timeSavings.hoursSavedThisPeriod * hourlyRateConverted
  const errorSavings = data.costSavings.errorReductionValue * currencyInfo.rate
  const totalSavings = totalTimeSavings + errorSavings
  const monthlySubscriptionCost = subscriptionCost * currencyInfo.rate
  const roiPercentage = Math.round(((totalTimeSavings / 12) - monthlySubscriptionCost) / monthlySubscriptionCost * 100)
  const projectedAnnualSavings = (periodTimeSavings * 12) + (errorSavings * 12)
  const teamHoursFreed = data.timeSavings.hoursSavedThisPeriod * teamSize

  // Format currency
  const formatCurrency = useCallback((value: number) => {
    return `${currencyInfo.symbol}${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  }, [currencyInfo.symbol])

  // Export report handler
  const handleExportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      settings: { hourlyRate, teamSize, currency },
      summary: {
        totalSavings: formatCurrency(totalSavings),
        roiPercentage: `${roiPercentage}%`,
        projectedAnnualSavings: formatCurrency(projectedAnnualSavings)
      },
      timeSavings: data.timeSavings,
      productivity: data.productivity
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nexus-roi-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Share report handler
  const handleShareReport = async () => {
    const shareText = `My Nexus ROI Report: ${formatCurrency(totalSavings)} total savings with ${roiPercentage}% ROI. ${data.timeSavings.hoursSavedTotal} hours saved through automation!`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Nexus ROI Report',
          text: shareText
        })
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(shareText)
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Settings */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="w-6 h-6 text-primary" />
            ROI Calculator
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            See the real value of your automation investment
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleShareReport}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button
            variant={showSettings ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
            {showSettings ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hourly Rate ({currencyInfo.symbol})</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value) || 0)}
                  min={0}
                  max={1000}
                />
                <p className="text-xs text-muted-foreground">Average employee cost per hour</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="teamSize">Team Size</Label>
                <Input
                  id="teamSize"
                  type="number"
                  value={teamSize}
                  onChange={(e) => setTeamSize(Number(e.target.value) || 1)}
                  min={1}
                  max={1000}
                />
                <p className="text-xs text-muted-foreground">Number of team members using Nexus</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {Object.entries(CURRENCIES).map(([code, info]) => (
                    <option key={code} value={code}>
                      {info.symbol} - {info.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">Display currency for calculations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hero Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <HeroStat
          icon={DollarSign}
          label="Total Savings"
          value={totalSavings}
          prefix={currencyInfo.symbol}
          trend={{ value: 23, isPositive: true }}
          color="green"
        />
        <HeroStat
          icon={Clock}
          label="Hours Saved"
          value={data.timeSavings.hoursSavedTotal}
          suffix=" hrs"
          trend={{ value: 15, isPositive: true }}
          color="blue"
        />
        <HeroStat
          icon={Zap}
          label="Tasks Automated"
          value={data.timeSavings.tasksAutomated}
          color="purple"
        />
        <HeroStat
          icon={TrendingUp}
          label="ROI"
          value={roiPercentage}
          suffix="%"
          color="primary"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Time Savings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-blue-500" />
              Time Savings
            </CardTitle>
            <CardDescription>Hours saved through automation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">This Period</span>
              <span className="text-lg font-bold">{data.timeSavings.hoursSavedThisPeriod} hrs</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">All Time</span>
              <span className="text-lg font-bold">{data.timeSavings.hoursSavedTotal} hrs</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Avg per Workflow</span>
              <span className="text-lg font-bold">{data.timeSavings.avgTimePerWorkflow} min</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Team Hours Freed Up</span>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  <Users className="w-4 h-4 mr-1" />
                  {teamHoursFreed} hrs
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost Savings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              Cost Savings
            </CardTitle>
            <CardDescription>Financial impact of automation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Employee Time Saved</span>
              <span className="text-lg font-bold">{formatCurrency(periodTimeSavings)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Error Reduction Value</span>
              <span className="text-lg font-bold">{formatCurrency(errorSavings)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 rounded-lg border border-emerald-500/30">
              <span className="text-sm font-medium">Total Monetary Savings</span>
              <span className="text-xl font-bold text-emerald-500">{formatCurrency(totalSavings)}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Monthly Subscription Cost</span>
                <span>{formatCurrency(monthlySubscriptionCost)}/mo</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-medium">ROI vs Subscription</span>
                <Badge className={roiPercentage > 100 ? 'bg-emerald-500' : ''}>
                  {roiPercentage}% ROI
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Productivity Metrics Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Productivity Metrics
            </CardTitle>
            <CardDescription>Efficiency improvements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center py-2">
              <ProgressRing
                value={data.productivity.efficiencyImprovement}
                color="hsl(var(--primary))"
              />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Efficiency Improvement
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Workflows Executed</span>
                <span className="font-bold">{data.productivity.workflowsExecuted.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Manual Tasks Eliminated</span>
                <span className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {data.productivity.manualTasksEliminated}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ArrowRight className="w-5 h-5" />
            Before vs After Nexus
          </CardTitle>
          <CardDescription>See the transformation in your workflow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Comparison Bars */}
            <div className="space-y-6">
              <ComparisonBar
                label="Hours per Week"
                beforeValue={data.comparison.beforeNexus.hoursPerWeek}
                afterValue={data.comparison.afterNexus.hoursPerWeek}
                unit=" hrs"
              />
              <ComparisonBar
                label="Errors per Month"
                beforeValue={data.comparison.beforeNexus.errorsPerMonth}
                afterValue={data.comparison.afterNexus.errorsPerMonth}
              />
              <ComparisonBar
                label="Manual Tasks"
                beforeValue={data.comparison.beforeNexus.tasksManual}
                afterValue={data.comparison.afterNexus.tasksManual}
              />
            </div>

            {/* Comparison Bar Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      metric: 'Hours/Week',
                      Before: data.comparison.beforeNexus.hoursPerWeek,
                      After: data.comparison.afterNexus.hoursPerWeek
                    },
                    {
                      metric: 'Errors/Month',
                      Before: data.comparison.beforeNexus.errorsPerMonth,
                      After: data.comparison.afterNexus.errorsPerMonth
                    },
                    {
                      metric: 'Manual Tasks',
                      Before: data.comparison.beforeNexus.tasksManual,
                      After: data.comparison.afterNexus.tasksManual
                    }
                  ]}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" />
                  <YAxis dataKey="metric" type="category" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Before" fill="hsl(0, 70%, 50%)" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="After" fill="hsl(142, 70%, 45%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Savings Trend */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
                Monthly Savings Trend
              </CardTitle>
              <CardDescription>Track your growing savings over time</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-emerald-500 border-emerald-500">
                Projected Annual: {formatCurrency(projectedAnnualSavings)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.costSavings.monthlyTrend.map(item => ({
                  ...item,
                  savings: item.savings * currencyInfo.rate
                }))}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 70%, 45%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(142, 70%, 45%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${currencyInfo.symbol}${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => [formatCurrency(typeof value === 'number' ? value : 0), 'Savings']}
                />
                <Line
                  type="monotone"
                  dataKey="savings"
                  stroke="hsl(142, 70%, 45%)"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(142, 70%, 45%)', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  fill="url(#savingsGradient)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ROICalculator
