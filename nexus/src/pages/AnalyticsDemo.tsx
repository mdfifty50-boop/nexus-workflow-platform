/**
 * Analytics Demo Page
 *
 * Temporary demo page to showcase the new analytics components.
 * This page can be removed after verification.
 */

import {
  ExecutionChart,
  UsageGauge,
  UsageGaugeCompact,
  WorkflowLeaderboard,
  InsightsPanel,
  MetricTrend,
  TREND_DIRECTIONS,
} from '@/components/dashboard/analytics'

export default function AnalyticsDemo() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Analytics Components Demo</h1>
          <p className="text-slate-400">
            Dashboard analytics visualization components for Nexus
          </p>
        </div>

        {/* Metric Trend Examples */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">MetricTrend Component</h2>
          <div className="flex flex-wrap gap-4 items-center">
            <MetricTrend
              direction={TREND_DIRECTIONS.UP}
              percentage={12.5}
              comparisonLabel="vs last week"
              size="sm"
            />
            <MetricTrend
              direction={TREND_DIRECTIONS.DOWN}
              percentage={8.3}
              comparisonLabel="vs last month"
              size="md"
            />
            <MetricTrend
              direction={TREND_DIRECTIONS.NEUTRAL}
              percentage={0.2}
              comparisonLabel="vs yesterday"
              size="lg"
            />
            <MetricTrend
              direction={TREND_DIRECTIONS.DOWN}
              percentage={15.7}
              positiveIsGood={false}
              size="md"
            />
          </div>
        </section>

        {/* Usage Gauges */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">UsageGauge Component</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <UsageGauge
              current={450}
              limit={1000}
              label="Monthly Executions"
              unit="used"
            />
            <UsageGauge
              current={780}
              limit={1000}
              label="API Calls"
              unit="calls"
            />
            <UsageGauge
              current={950}
              limit={1000}
              label="Storage"
              unit="MB used"
            />
          </div>

          <h3 className="text-lg font-medium mt-6">Compact Variant</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UsageGaugeCompact
              current={120}
              limit={500}
              label="Workflows"
            />
            <UsageGaugeCompact
              current={890}
              limit={1000}
              label="Integrations"
            />
          </div>
        </section>

        {/* Execution Chart */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">ExecutionChart Component</h2>
          <ExecutionChart />
        </section>

        {/* Workflow Leaderboard */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">WorkflowLeaderboard Component</h2>
          <WorkflowLeaderboard
            onWorkflowClick={(id) => console.log('Clicked workflow:', id)}
          />
        </section>

        {/* Insights Panel */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">InsightsPanel Component</h2>
          <InsightsPanel
            onActionClick={(insight) => console.log('Action clicked:', insight)}
            onDismiss={(id) => console.log('Dismissed:', id)}
          />
        </section>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500 pt-8 border-t border-slate-700">
          <p>Dashboard Analytics Components - Nexus</p>
        </div>
      </div>
    </div>
  )
}
