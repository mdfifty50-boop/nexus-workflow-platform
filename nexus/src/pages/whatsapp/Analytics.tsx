/**
 * WhatsApp Analytics Page
 *
 * View message statistics and campaign performance.
 * Features:
 * - Message delivery/read rates
 * - Campaign performance metrics
 * - Contact growth trends
 * - Time-based analytics
 *
 * Uses mock data for demo mode.
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

// =============================================================================
// TYPES
// =============================================================================

interface AnalyticsData {
  overview: {
    totalMessagesSent: number
    totalMessagesReceived: number
    totalDelivered: number
    totalRead: number
    totalFailed: number
    deliveryRate: number
    readRate: number
    responseRate: number
  }
  trends: {
    messagesSentTrend: number
    deliveryRateTrend: number
    readRateTrend: number
    responseRateTrend: number
  }
  campaigns: {
    total: number
    active: number
    completed: number
    scheduled: number
    avgDeliveryRate: number
    avgReadRate: number
  }
  contacts: {
    total: number
    active: number
    newThisMonth: number
    optedOut: number
  }
  messagesByDay: Array<{
    date: string
    sent: number
    delivered: number
    read: number
    received: number
  }>
  topCampaigns: Array<{
    id: string
    name: string
    sent: number
    delivered: number
    read: number
    deliveryRate: number
    readRate: number
  }>
}

type DateRange = '7d' | '30d' | '90d' | 'all'

// =============================================================================
// ICONS
// =============================================================================

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  )
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  )
}

function CheckCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  )
}

function TrendingDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

// =============================================================================
// HELPERS
// =============================================================================

const getMockAnalytics = (): AnalyticsData => ({
  overview: {
    totalMessagesSent: 12456,
    totalMessagesReceived: 8234,
    totalDelivered: 11890,
    totalRead: 9567,
    totalFailed: 234,
    deliveryRate: 95.4,
    readRate: 80.4,
    responseRate: 66.1,
  },
  trends: {
    messagesSentTrend: 12.5,
    deliveryRateTrend: 2.3,
    readRateTrend: -1.2,
    responseRateTrend: 5.8,
  },
  campaigns: {
    total: 24,
    active: 3,
    completed: 18,
    scheduled: 3,
    avgDeliveryRate: 94.2,
    avgReadRate: 78.5,
  },
  contacts: {
    total: 3456,
    active: 2890,
    newThisMonth: 234,
    optedOut: 67,
  },
  messagesByDay: [
    { date: '2024-01-20', sent: 456, delivered: 432, read: 367, received: 234 },
    { date: '2024-01-21', sent: 523, delivered: 498, read: 412, received: 289 },
    { date: '2024-01-22', sent: 389, delivered: 371, read: 298, received: 201 },
    { date: '2024-01-23', sent: 612, delivered: 589, read: 478, received: 345 },
    { date: '2024-01-24', sent: 478, delivered: 456, read: 389, received: 267 },
    { date: '2024-01-25', sent: 534, delivered: 512, read: 423, received: 312 },
    { date: '2024-01-26', sent: 401, delivered: 389, read: 312, received: 198 },
  ],
  topCampaigns: [
    { id: '1', name: 'January Sale Promotion', sent: 2500, delivered: 2375, read: 1900, deliveryRate: 95, readRate: 80 },
    { id: '2', name: 'New Year Greetings', sent: 3200, delivered: 3040, read: 2560, deliveryRate: 95, readRate: 84 },
    { id: '3', name: 'Product Launch Announcement', sent: 1800, delivered: 1710, read: 1368, deliveryRate: 95, readRate: 80 },
    { id: '4', name: 'Customer Feedback Request', sent: 1500, delivered: 1425, read: 997, deliveryRate: 95, readRate: 70 },
    { id: '5', name: 'Weekly Newsletter', sent: 2200, delivered: 2090, read: 1672, deliveryRate: 95, readRate: 80 },
  ],
})

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

// =============================================================================
// COMPONENT
// =============================================================================

export function WhatsAppAnalytics() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)

  const fetchAnalytics = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const response = await fetch(`/api/whatsapp-business/analytics?range=${dateRange}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      } else {
        setAnalytics(getMockAnalytics())
      }
    } catch {
      setAnalytics(getMockAnalytics())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [dateRange])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const handleExportReport = () => {
    if (!analytics) return

    const csvContent = [
      ['WhatsApp Analytics Report'],
      [`Date Range: ${dateRange}`],
      [''],
      ['Overview'],
      ['Metric', 'Value'],
      ['Messages Sent', analytics.overview.totalMessagesSent],
      ['Messages Received', analytics.overview.totalMessagesReceived],
      ['Delivered', analytics.overview.totalDelivered],
      ['Read', analytics.overview.totalRead],
      ['Failed', analytics.overview.totalFailed],
      ['Delivery Rate', `${analytics.overview.deliveryRate}%`],
      ['Read Rate', `${analytics.overview.readRate}%`],
      ['Response Rate', `${analytics.overview.responseRate}%`],
      [''],
      ['Daily Messages'],
      ['Date', 'Sent', 'Delivered', 'Read', 'Received'],
      ...analytics.messagesByDay.map(d => [d.date, d.sent, d.delivered, d.read, d.received]),
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `whatsapp-analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const TrendIndicator = ({ value }: { value: number }) => {
    const isPositive = value > 0
    return (
      <span className={cn('flex items-center text-sm', isPositive ? 'text-green-600' : 'text-red-600')}>
        {isPositive ? <TrendingUpIcon className="h-4 w-4" /> : <TrendingDownIcon className="h-4 w-4" />}
        {Math.abs(value).toFixed(1)}%
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-slate-200 border-t-green-500 rounded-full" />
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <ChartIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">Failed to load analytics</p>
          <button onClick={() => fetchAnalytics()} className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/whatsapp')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <BackIcon className="h-5 w-5 text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
            <p className="text-slate-600">Track your WhatsApp Business performance</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRange)}
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none bg-white"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>
            <button
              onClick={() => fetchAnalytics(true)}
              disabled={refreshing}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshIcon className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            </button>
            <button
              onClick={handleExportReport}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              <DownloadIcon className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Messages Sent</p>
                <p className="text-3xl font-bold text-slate-900">
                  {formatNumber(analytics.overview.totalMessagesSent)}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <SendIcon className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-2">
              <TrendIndicator value={analytics.trends.messagesSentTrend} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Delivery Rate</p>
                <p className="text-3xl font-bold text-slate-900">
                  {analytics.overview.deliveryRate}%
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCheckIcon className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-2">
              <TrendIndicator value={analytics.trends.deliveryRateTrend} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Read Rate</p>
                <p className="text-3xl font-bold text-slate-900">
                  {analytics.overview.readRate}%
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <EyeIcon className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-2">
              <TrendIndicator value={analytics.trends.readRateTrend} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Response Rate</p>
                <p className="text-3xl font-bold text-slate-900">
                  {analytics.overview.responseRate}%
                </p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <MessageIcon className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <div className="mt-2">
              <TrendIndicator value={analytics.trends.responseRateTrend} />
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <h4 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
              <ActivityIcon className="h-4 w-4 text-blue-500" />
              Campaign Performance
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold">{analytics.campaigns.total}</p>
                <p className="text-sm text-slate-500">Total Campaigns</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{analytics.campaigns.active}</p>
                <p className="text-sm text-slate-500">Active</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.campaigns.avgDeliveryRate}%</p>
                <p className="text-sm text-slate-500">Avg Delivery</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.campaigns.avgReadRate}%</p>
                <p className="text-sm text-slate-500">Avg Read</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <h4 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
              <UsersIcon className="h-4 w-4 text-purple-500" />
              Contact Stats
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold">{formatNumber(analytics.contacts.total)}</p>
                <p className="text-sm text-slate-500">Total Contacts</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{formatNumber(analytics.contacts.active)}</p>
                <p className="text-sm text-slate-500">Active</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">+{analytics.contacts.newThisMonth}</p>
                <p className="text-sm text-slate-500">New This Month</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{analytics.contacts.optedOut}</p>
                <p className="text-sm text-slate-500">Opted Out</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <h4 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
              <ChartIcon className="h-4 w-4 text-amber-500" />
              Message Breakdown
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Delivered</span>
                <span className="font-medium text-green-600">{formatNumber(analytics.overview.totalDelivered)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Read</span>
                <span className="font-medium text-blue-600">{formatNumber(analytics.overview.totalRead)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Failed</span>
                <span className="font-medium text-red-600">{formatNumber(analytics.overview.totalFailed)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Received</span>
                <span className="font-medium text-purple-600">{formatNumber(analytics.overview.totalMessagesReceived)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 mb-6">
          <h4 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
            <ChartIcon className="h-5 w-5 text-blue-500" />
            Message Activity (Last 7 Days)
          </h4>
          <div className="h-48 flex items-end gap-2">
            {analytics.messagesByDay.map((day) => {
              const maxSent = Math.max(...analytics.messagesByDay.map(d => d.sent))
              const heightPercent = (day.sent / maxSent) * 100

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center">
                    <span className="text-xs text-slate-500 mb-1">{day.sent}</span>
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                      style={{ height: `${heightPercent}px`, minHeight: '20px', maxHeight: '120px' }}
                    />
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Campaigns */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h4 className="font-medium text-slate-900 flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5 text-green-500" />
              Top Performing Campaigns
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Campaign</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Sent</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Delivered</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Read</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Delivery Rate</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Read Rate</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topCampaigns.map((campaign, index) => (
                  <tr key={campaign.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <span className="font-medium">{campaign.name}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4">{formatNumber(campaign.sent)}</td>
                    <td className="text-right py-3 px-4">{formatNumber(campaign.delivered)}</td>
                    <td className="text-right py-3 px-4">{formatNumber(campaign.read)}</td>
                    <td className="text-right py-3 px-4">
                      <span className={cn(
                        'px-2 py-1 text-xs font-medium rounded-full',
                        campaign.deliveryRate >= 95 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                      )}>
                        {campaign.deliveryRate}%
                      </span>
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className={cn(
                        'px-2 py-1 text-xs font-medium rounded-full',
                        campaign.readRate >= 75 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                      )}>
                        {campaign.readRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
          <h4 className="font-medium text-green-900 mb-2">💡 Tips to Improve Engagement</h4>
          <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
            <li>Send messages during peak hours (9 AM - 12 PM and 4 PM - 8 PM)</li>
            <li>Use personalized templates with the recipient's name</li>
            <li>Keep promotional messages under 160 characters</li>
            <li>Include clear call-to-action buttons</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
