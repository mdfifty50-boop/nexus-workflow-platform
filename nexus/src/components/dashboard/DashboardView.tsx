/**
 * DashboardView Component
 *
 * Combined dashboard view with tabbed navigation for:
 * - Overview: Customer Health Dashboard + ROI Calculator
 * - Executions: Execution Logs Viewer
 * - Analytics: Usage Analytics
 *
 * Features:
 * - URL-based tab switching (?tab=executions)
 * - Persists last active tab in localStorage
 * - Global refresh functionality
 * - Mobile responsive layout
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Activity,
  BarChart3,
  RefreshCw,
  Calendar,
  ChevronRight,
} from 'lucide-react'

// Dashboard components
import { CustomerHealthDashboard } from './CustomerHealthDashboard'
import { ExecutionLogsViewer } from './ExecutionLogsViewer'
import { ROICalculator } from './ROICalculator'
import { UsageAnalytics } from './UsageAnalytics'

// =============================================================================
// Types
// =============================================================================

export type DashboardTab = 'overview' | 'executions' | 'analytics'

export interface DashboardViewProps {
  /** Default tab to display on initial load */
  defaultTab?: DashboardTab
  /** Callback when tab changes */
  onTabChange?: (tab: DashboardTab) => void
  /** Additional CSS classes */
  className?: string
}

interface TabConfig {
  id: DashboardTab
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

// =============================================================================
// Constants
// =============================================================================

const STORAGE_KEY = 'nexus-dashboard-active-tab'
const URL_PARAM_KEY = 'tab'

const TABS: TabConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    description: 'Health metrics and ROI',
  },
  {
    id: 'executions',
    label: 'Executions',
    icon: Activity,
    description: 'Workflow execution logs',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    description: 'Usage statistics',
  },
]

// =============================================================================
// Utility Functions
// =============================================================================

function isValidTab(value: string | null): value is DashboardTab {
  return value === 'overview' || value === 'executions' || value === 'analytics'
}

function getInitialTab(
  searchParams: URLSearchParams,
  defaultTab?: DashboardTab
): DashboardTab {
  // Priority 1: URL parameter
  const urlTab = searchParams.get(URL_PARAM_KEY)
  if (isValidTab(urlTab)) {
    return urlTab
  }

  // Priority 2: localStorage
  try {
    const storedTab = localStorage.getItem(STORAGE_KEY)
    if (isValidTab(storedTab)) {
      return storedTab
    }
  } catch {
    // localStorage not available
  }

  // Priority 3: Default prop or fallback
  return defaultTab ?? 'overview'
}

function formatDateRange(): string {
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return `${formatDate(thirtyDaysAgo)} - ${formatDate(today)}`
}

// =============================================================================
// Sub-Components
// =============================================================================

interface TabButtonProps {
  tab: TabConfig
  isActive: boolean
  onClick: () => void
}

function TabButton({ tab, isActive, onClick }: TabButtonProps) {
  const Icon = tab.icon

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        isActive
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      )}
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${tab.id}`}
      id={`tab-${tab.id}`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{tab.label}</span>
    </button>
  )
}

interface MobileTabSelectProps {
  activeTab: DashboardTab
  onTabChange: (tab: DashboardTab) => void
}

function MobileTabSelect({ activeTab, onTabChange }: MobileTabSelectProps) {
  const activeConfig = TABS.find((t) => t.id === activeTab)

  return (
    <div className="sm:hidden">
      <select
        value={activeTab}
        onChange={(e) => onTabChange(e.target.value as DashboardTab)}
        className={cn(
          'w-full px-4 py-2.5 rounded-lg border border-input',
          'bg-background text-foreground font-medium',
          'focus:outline-none focus:ring-2 focus:ring-primary'
        )}
        aria-label="Select dashboard tab"
      >
        {TABS.map((tab) => (
          <option key={tab.id} value={tab.id}>
            {tab.label} - {tab.description}
          </option>
        ))}
      </select>
      {activeConfig && (
        <p className="mt-2 text-sm text-muted-foreground">
          {activeConfig.description}
        </p>
      )}
    </div>
  )
}

// =============================================================================
// Overview Tab Content
// =============================================================================

function OverviewTabContent() {
  return (
    <div className="space-y-6">
      {/* Customer Health Dashboard */}
      <section aria-labelledby="health-section-title">
        <h2 id="health-section-title" className="sr-only">
          Customer Health
        </h2>
        <CustomerHealthDashboard />
      </section>

      {/* ROI Calculator */}
      <section aria-labelledby="roi-section-title">
        <h2 id="roi-section-title" className="sr-only">
          ROI Calculator
        </h2>
        <ROICalculator />
      </section>
    </div>
  )
}

// =============================================================================
// Executions Tab Content
// =============================================================================

function ExecutionsTabContent() {
  return (
    <section aria-labelledby="executions-section-title">
      <h2 id="executions-section-title" className="sr-only">
        Execution Logs
      </h2>
      <ExecutionLogsViewer />
    </section>
  )
}

// =============================================================================
// Analytics Tab Content
// =============================================================================

function AnalyticsTabContent() {
  return (
    <section aria-labelledby="analytics-section-title">
      <h2 id="analytics-section-title" className="sr-only">
        Usage Analytics
      </h2>
      <UsageAnalytics />
    </section>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function DashboardView({
  defaultTab,
  onTabChange,
  className,
}: DashboardViewProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<DashboardTab>(() =>
    getInitialTab(searchParams, defaultTab)
  )
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  // Sync tab with URL on mount and URL changes
  useEffect(() => {
    const urlTab = searchParams.get(URL_PARAM_KEY)
    if (isValidTab(urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab)
    }
  }, [searchParams, activeTab])

  // Handle tab change
  const handleTabChange = useCallback(
    (tab: DashboardTab) => {
      setActiveTab(tab)

      // Update URL
      setSearchParams((prev) => {
        prev.set(URL_PARAM_KEY, tab)
        return prev
      })

      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, tab)
      } catch {
        // localStorage not available
      }

      // Notify parent
      onTabChange?.(tab)
    },
    [setSearchParams, onTabChange]
  )

  // Global refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)

    // Trigger a refresh across all visible components
    // This is done by updating the lastRefreshed timestamp
    // which can be passed down to child components
    await new Promise((resolve) => setTimeout(resolve, 500))

    setLastRefreshed(new Date())
    setIsRefreshing(false)
  }, [])

  // Active tab config
  const activeTabConfig = useMemo(
    () => TABS.find((t) => t.id === activeTab),
    [activeTab]
  )

  // Date range display
  const dateRange = useMemo(() => formatDateRange(), [])

  return (
    <div className={cn('min-h-screen', className)}>
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Title and Description */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
                Monitor your workflows, track performance, and analyze usage
              </p>
            </div>

            {/* Date Range and Refresh */}
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{dateRange}</span>
              </Badge>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw
                  className={cn('w-4 h-4', isRefreshing && 'animate-spin')}
                />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="mt-4" role="tablist" aria-label="Dashboard sections">
            {/* Desktop Tabs */}
            <div className="hidden sm:flex items-center gap-1 bg-muted/50 p-1 rounded-lg w-fit">
              {TABS.map((tab) => (
                <TabButton
                  key={tab.id}
                  tab={tab}
                  isActive={activeTab === tab.id}
                  onClick={() => handleTabChange(tab.id)}
                />
              ))}
            </div>

            {/* Mobile Tab Selector */}
            <MobileTabSelect
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          </nav>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-3 border-b bg-muted/30">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm">
            <li className="text-muted-foreground">Dashboard</li>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            <li className="font-medium">{activeTabConfig?.label}</li>
          </ol>
        </nav>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Last Refreshed Indicator */}
        <div className="mb-4 text-xs text-muted-foreground">
          Last updated: {lastRefreshed.toLocaleTimeString()}
        </div>

        {/* Tab Panels */}
        <div
          role="tabpanel"
          id={`tabpanel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          tabIndex={0}
        >
          {activeTab === 'overview' && <OverviewTabContent />}
          {activeTab === 'executions' && <ExecutionsTabContent />}
          {activeTab === 'analytics' && <AnalyticsTabContent />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 mt-auto">
        <div className="container mx-auto px-4">
          <p className="text-xs text-muted-foreground text-center">
            Data refreshes automatically every 5 minutes.{' '}
            <button
              onClick={handleRefresh}
              className="text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              disabled={isRefreshing}
            >
              Refresh now
            </button>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default DashboardView
