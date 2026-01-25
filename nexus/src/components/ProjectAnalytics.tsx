import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface AnalyticsData {
  totalWorkflows: number
  activeWorkflows: number
  completedExecutions: number
  failedExecutions: number
  totalTokensUsed: number
  totalCostUsd: number
  recentActivity: Array<{
    id: string
    type: 'workflow_created' | 'execution_completed' | 'execution_failed'
    name: string
    timestamp: string
  }>
}

interface ProjectAnalyticsProps {
  projectId: string
}

export function ProjectAnalytics({ projectId }: ProjectAnalyticsProps) {
  const { userId } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [projectId, userId])

  const loadAnalytics = async () => {
    if (!userId) return

    try {
      const response = await fetch(`/api/projects/${projectId}/analytics`, {
        headers: {
          'X-Clerk-User-Id': userId,
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setAnalytics(result.data)
        }
      }
    } catch (err) {
      console.error('Error loading analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-muted rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  // Default values if no analytics data
  const data = analytics || {
    totalWorkflows: 0,
    activeWorkflows: 0,
    completedExecutions: 0,
    failedExecutions: 0,
    totalTokensUsed: 0,
    totalCostUsd: 0,
    recentActivity: [],
  }

  const successRate =
    data.completedExecutions + data.failedExecutions > 0
      ? Math.round((data.completedExecutions / (data.completedExecutions + data.failedExecutions)) * 100)
      : 100

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Workflows</p>
          <p className="text-2xl font-bold">{data.totalWorkflows}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {data.activeWorkflows} active
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Executions</p>
          <p className="text-2xl font-bold">{data.completedExecutions + data.failedExecutions}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {successRate}% success rate
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Tokens Used</p>
          <p className="text-2xl font-bold">
            {data.totalTokensUsed > 1000000
              ? `${(data.totalTokensUsed / 1000000).toFixed(1)}M`
              : data.totalTokensUsed > 1000
              ? `${(data.totalTokensUsed / 1000).toFixed(1)}K`
              : data.totalTokensUsed}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            All time
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Cost</p>
          <p className="text-2xl font-bold">${data.totalCostUsd.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            USD
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      {data.recentActivity.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Recent Activity</h3>
          <div className="space-y-2">
            {data.recentActivity.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      activity.type === 'execution_completed'
                        ? 'bg-green-500'
                        : activity.type === 'execution_failed'
                        ? 'bg-red-500'
                        : 'bg-blue-500'
                    }`}
                  />
                  <span>{activity.name}</span>
                </div>
                <span className="text-muted-foreground">
                  {new Date(activity.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
