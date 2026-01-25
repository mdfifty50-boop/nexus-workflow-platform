/**
 * CompetitiveAdvantages.tsx
 *
 * Displays Nexus's competitive differentiation vs Zapier, ChatGPT, and n8n.
 * Key messaging: "Results, not conversations"
 *
 * Components:
 * - ResultsNotConversationsBadge: Prominent hero badge
 * - TokenSavingsIndicator: Shows $ saved vs competitors
 * - ExecutionTimeComparison: Speed comparison widget
 * - CompetitiveAdvantagesPanel: Full comparison panel (for landing page)
 * - CompetitiveStatsBanner: Dashboard summary banner
 */

import { useState, useMemo } from 'react'
import {
  nexusAdvantages,
  competitors,
  tokenSavingsEstimates,
  executionTimeComparisons,
  featureComparison,
  calculateCompetitiveStats,
  tokensToDollars,
  competitiveMessaging,
  averageTokenSavings,
  type NexusAdvantage,
  type Competitor,
} from '@/data/competitive-comparison'

// ============================================
// BADGE COMPONENTS
// ============================================

/**
 * "Results, Not Conversations" Badge
 * Prominent messaging component for hero sections
 */
export function ResultsNotConversationsBadge({
  variant = 'default',
  showTooltip = true,
}: {
  variant?: 'default' | 'compact' | 'large' | 'animated'
  showTooltip?: boolean
}) {
  const [showDetails, setShowDetails] = useState(false)

  if (variant === 'compact') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-medium">
        <span>🎯</span>
        <span>Execution-First</span>
      </span>
    )
  }

  if (variant === 'large') {
    return (
      <div className="relative inline-block group">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition-opacity" />
        <div className="relative flex items-center gap-3 px-6 py-3 bg-slate-900/90 rounded-xl border border-cyan-500/30">
          <span className="text-3xl">🎯</span>
          <div>
            <div className="text-lg font-bold text-white">{competitiveMessaging.tagline}</div>
            <div className="text-sm text-cyan-400">{competitiveMessaging.subTagline}</div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'animated') {
    return (
      <div
        className="relative inline-flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer overflow-hidden"
        onMouseEnter={() => setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 animate-pulse" />
        <div className="absolute inset-0 border border-cyan-500/30 rounded-xl" />

        <span className="relative text-xl animate-bounce" style={{ animationDuration: '2s' }}>🎯</span>
        <div className="relative">
          <span className="text-white font-semibold">{competitiveMessaging.tagline}</span>
          {showDetails && showTooltip && (
            <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-slate-800 rounded-lg border border-slate-700 shadow-xl z-50 text-sm text-slate-300">
              {competitiveMessaging.badges.resultsFirst.tooltip}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div
      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl border border-cyan-500/20 cursor-default"
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
    >
      <span className="text-xl">🎯</span>
      <span className="text-white font-medium">{competitiveMessaging.tagline}</span>
      {showDetails && showTooltip && (
        <div className="absolute mt-12 w-48 p-2 bg-slate-800 rounded-lg border border-slate-700 shadow-lg z-50 text-xs text-slate-300">
          {competitiveMessaging.badges.resultsFirst.tooltip}
        </div>
      )}
    </div>
  )
}

// ============================================
// TOKEN SAVINGS INDICATOR
// ============================================

interface TokenSavingsIndicatorProps {
  workflowsCompleted: number
  tasksAutomated: number
  variant?: 'dashboard' | 'compact' | 'detailed'
  showComparison?: boolean
}

/**
 * Shows estimated $ saved vs ChatGPT-based workflows
 */
export function TokenSavingsIndicator({
  workflowsCompleted,
  tasksAutomated,
  variant = 'dashboard',
  showComparison = true,
}: TokenSavingsIndicatorProps) {
  const stats = useMemo(
    () => calculateCompetitiveStats(workflowsCompleted, tasksAutomated),
    [workflowsCompleted, tasksAutomated]
  )

  const dollarsSaved = useMemo(
    () => tokensToDollars(stats.totalTokensSaved),
    [stats.totalTokensSaved]
  )

  if (variant === 'compact') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
        <span className="text-emerald-400 text-lg">💰</span>
        <span className="text-emerald-400 font-semibold">${dollarsSaved.toFixed(2)} saved</span>
        {showComparison && (
          <span className="text-slate-400 text-xs">vs ChatGPT</span>
        )}
      </div>
    )
  }

  if (variant === 'detailed') {
    return (
      <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-2xl border border-emerald-500/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <span className="text-2xl">💰</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Token Savings</h3>
            <p className="text-sm text-slate-400">vs ChatGPT conversation-based workflows</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-slate-900/50 rounded-xl">
            <div className="text-2xl font-bold text-emerald-400">
              ${dollarsSaved.toFixed(2)}
            </div>
            <div className="text-xs text-slate-400">Total Saved</div>
          </div>
          <div className="text-center p-3 bg-slate-900/50 rounded-xl">
            <div className="text-2xl font-bold text-cyan-400">
              {stats.avgCostSavingsPercent}%
            </div>
            <div className="text-xs text-slate-400">Avg. Reduction</div>
          </div>
        </div>

        <div className="text-center text-sm text-slate-500">
          {stats.totalTokensSaved.toLocaleString()} tokens saved across{' '}
          {workflowsCompleted} workflows
        </div>
      </div>
    )
  }

  // Dashboard variant (default)
  return (
    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <span className="text-xl">💰</span>
        </div>
        <div>
          <div className="text-sm text-slate-400">AI Cost Savings</div>
          <div className="text-lg font-bold text-emerald-400">${dollarsSaved.toFixed(2)}</div>
        </div>
      </div>
      {showComparison && (
        <div className="text-right">
          <div className="text-xs text-slate-500">vs ChatGPT</div>
          <div className="text-sm font-medium text-cyan-400">{stats.avgCostSavingsPercent}% less</div>
        </div>
      )}
    </div>
  )
}

// ============================================
// EXECUTION TIME COMPARISON
// ============================================

interface ExecutionTimeComparisonProps {
  variant?: 'compact' | 'detailed' | 'table'
  highlightedTask?: string
}

/**
 * Shows speed comparison vs competitors
 */
export function ExecutionTimeComparisonWidget({
  variant = 'compact',
  highlightedTask,
}: ExecutionTimeComparisonProps) {
  const [selectedTask, setSelectedTask] = useState(
    highlightedTask || executionTimeComparisons[0].taskType
  )

  const currentComparison = useMemo(
    () => executionTimeComparisons.find(c => c.taskType === selectedTask) || executionTimeComparisons[0],
    [selectedTask]
  )

  if (variant === 'compact') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 rounded-lg border border-purple-500/20">
        <span className="text-purple-400 text-lg">⚡</span>
        <span className="text-purple-400 font-semibold">5-10x Faster</span>
        <span className="text-slate-400 text-xs">vs sequential</span>
      </div>
    )
  }

  if (variant === 'table') {
    return (
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="text-lg font-bold text-white">Execution Time Comparison</h3>
          <p className="text-sm text-slate-400">How fast tasks get done</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Task</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-400">ChatGPT</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-400">Zapier</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-cyan-400">Nexus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {executionTimeComparisons.map((comparison) => (
                <tr key={comparison.taskType} className="hover:bg-slate-700/30">
                  <td className="px-4 py-3">
                    <div className="text-sm text-white">{comparison.taskType}</div>
                    <div className="text-xs text-slate-500">{comparison.description}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-slate-400">{comparison.chatGptTime}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-slate-400">{comparison.zapierTime}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-cyan-400 font-semibold">{comparison.nexusTime}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // Detailed variant (default)
  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <span className="text-2xl">⚡</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Execution Speed</h3>
          <p className="text-sm text-slate-400">Parallel multi-agent processing</p>
        </div>
      </div>

      {/* Task selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {executionTimeComparisons.map((comparison) => (
          <button
            key={comparison.taskType}
            onClick={() => setSelectedTask(comparison.taskType)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              selectedTask === comparison.taskType
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-slate-900/50 text-slate-400 hover:text-white'
            }`}
          >
            {comparison.taskType}
          </button>
        ))}
      </div>

      {/* Comparison display */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* ChatGPT */}
        <div className="p-3 bg-slate-900/50 rounded-xl text-center">
          <div className="text-slate-500 mb-1">🤖</div>
          <div className="text-lg font-bold text-slate-400">{currentComparison.chatGptTime}</div>
          <div className="text-xs text-slate-500">ChatGPT</div>
        </div>

        {/* Zapier */}
        <div className="p-3 bg-slate-900/50 rounded-xl text-center">
          <div className="text-slate-500 mb-1">⚡</div>
          <div className="text-lg font-bold text-slate-400">{currentComparison.zapierTime}</div>
          <div className="text-xs text-slate-500">Zapier</div>
        </div>

        {/* n8n */}
        <div className="p-3 bg-slate-900/50 rounded-xl text-center">
          <div className="text-slate-500 mb-1">🔧</div>
          <div className="text-lg font-bold text-slate-400">{currentComparison.n8nTime}</div>
          <div className="text-xs text-slate-500">n8n</div>
        </div>

        {/* Nexus */}
        <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl text-center border border-cyan-500/30">
          <div className="text-cyan-400 mb-1">✨</div>
          <div className="text-lg font-bold text-cyan-400">{currentComparison.nexusTime}</div>
          <div className="text-xs text-cyan-400">Nexus</div>
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-3 text-center">
        {currentComparison.nexusDetails}
      </p>
    </div>
  )
}

// ============================================
// COMPETITIVE STATS BANNER (Dashboard)
// ============================================

interface CompetitiveStatsBannerProps {
  workflowsCompleted: number
  tasksAutomated: number
  variant?: 'full' | 'compact'
}

/**
 * Summary banner showing all competitive advantages
 * Ideal for dashboard placement
 */
export function CompetitiveStatsBanner({
  workflowsCompleted,
  tasksAutomated,
  variant = 'full',
}: CompetitiveStatsBannerProps) {
  const stats = useMemo(
    () => calculateCompetitiveStats(workflowsCompleted, tasksAutomated),
    [workflowsCompleted, tasksAutomated]
  )

  const dollarsSaved = useMemo(
    () => tokensToDollars(stats.totalTokensSaved),
    [stats.totalTokensSaved]
  )

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-800/80 to-slate-900/80 rounded-xl border border-slate-700/50">
        <ResultsNotConversationsBadge variant="compact" />
        <div className="h-6 w-px bg-slate-700" />
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">💰</span>
          <span className="text-sm text-white">${dollarsSaved.toFixed(2)} saved</span>
        </div>
        <div className="h-6 w-px bg-slate-700" />
        <div className="flex items-center gap-2">
          <span className="text-purple-400">⚡</span>
          <span className="text-sm text-white">{stats.avgSpeedMultiplier}x faster</span>
        </div>
      </div>
    )
  }

  // Full variant
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-slate-800/80 via-slate-800/60 to-slate-800/80 rounded-2xl border border-slate-700/50 p-6">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <ResultsNotConversationsBadge variant="default" showTooltip={false} />
          <span className="text-xs text-slate-500">vs ChatGPT, Zapier, n8n</span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Token Savings */}
          <div className="p-4 bg-slate-900/50 rounded-xl text-center">
            <div className="text-3xl font-bold text-emerald-400">${dollarsSaved.toFixed(0)}</div>
            <div className="text-xs text-slate-400 mt-1">AI Cost Saved</div>
            <div className="text-[10px] text-emerald-400/60 mt-1">
              {stats.avgCostSavingsPercent}% vs ChatGPT
            </div>
          </div>

          {/* Speed */}
          <div className="p-4 bg-slate-900/50 rounded-xl text-center">
            <div className="text-3xl font-bold text-purple-400">{stats.avgSpeedMultiplier}x</div>
            <div className="text-xs text-slate-400 mt-1">Faster Execution</div>
            <div className="text-[10px] text-purple-400/60 mt-1">Parallel agents</div>
          </div>

          {/* Time Saved */}
          <div className="p-4 bg-slate-900/50 rounded-xl text-center">
            <div className="text-3xl font-bold text-cyan-400">
              {Math.round(stats.totalTimeSavedMinutes / 60)}h
            </div>
            <div className="text-xs text-slate-400 mt-1">Time Saved</div>
            <div className="text-[10px] text-cyan-400/60 mt-1">
              {stats.totalTimeSavedMinutes} minutes
            </div>
          </div>

          {/* Completion Rate */}
          <div className="p-4 bg-slate-900/50 rounded-xl text-center">
            <div className="text-3xl font-bold text-amber-400">100%</div>
            <div className="text-xs text-slate-400 mt-1">Auto-Execution</div>
            <div className="text-[10px] text-amber-400/60 mt-1">vs 0% in ChatGPT</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// FULL COMPARISON PANEL (Landing Page)
// ============================================

interface CompetitiveAdvantagesPanelProps {
  showAllFeatures?: boolean
  highlightAdvantage?: string
}

/**
 * Full comparison panel for landing page or detailed view
 */
export function CompetitiveAdvantagesPanel({
  showAllFeatures = false,
  highlightAdvantage,
}: CompetitiveAdvantagesPanelProps) {
  const [selectedAdvantage, setSelectedAdvantage] = useState<NexusAdvantage | null>(
    highlightAdvantage
      ? nexusAdvantages.find(a => a.id === highlightAdvantage) || null
      : null
  )
  const [activeTab, setActiveTab] = useState<'advantages' | 'comparison'>('advantages')

  return (
    <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-b border-slate-700/50">
        <ResultsNotConversationsBadge variant="large" />
        <p className="mt-4 text-slate-300 max-w-2xl">
          Nexus combines the intelligence of ChatGPT with the automation of Zapier -
          and does what neither can: <strong className="text-cyan-400">execute complex workflows end-to-end</strong>.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700/50">
        <button
          onClick={() => setActiveTab('advantages')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'advantages'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Why Nexus
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'comparison'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Feature Comparison
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'advantages' && (
          <div className="space-y-6">
            {/* Advantage cards */}
            <div className="grid md:grid-cols-2 gap-4">
              {nexusAdvantages.map((advantage) => (
                <button
                  key={advantage.id}
                  onClick={() => setSelectedAdvantage(
                    selectedAdvantage?.id === advantage.id ? null : advantage
                  )}
                  className={`p-4 rounded-xl text-left transition-all ${
                    selectedAdvantage?.id === advantage.id
                      ? 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-2 border-cyan-500/50'
                      : 'bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{advantage.icon}</span>
                    <div>
                      <h4 className="font-semibold text-white">{advantage.title}</h4>
                      <p className="text-sm text-slate-400 mt-1">{advantage.description}</p>
                      {advantage.metric && (
                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-slate-900/50 rounded-lg">
                          <span className="text-lg font-bold text-cyan-400">{advantage.metric.value}</span>
                          <span className="text-xs text-slate-400">{advantage.metric.label}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Expanded advantage detail */}
            {selectedAdvantage && (
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 animate-in fade-in duration-200">
                <h4 className="font-semibold text-white mb-3">vs Competitors</h4>
                <div className="space-y-2">
                  {selectedAdvantage.vsCompetitors.map((comparison) => {
                    const competitor = competitors.find(c => c.id === comparison.competitorId)
                    return (
                      <div key={comparison.competitorId} className="flex items-start gap-3 p-2 rounded-lg bg-slate-900/50">
                        <span className="text-lg">{competitor?.logo}</span>
                        <div>
                          <span className="text-sm font-medium text-slate-300">{competitor?.name}: </span>
                          <span className="text-sm text-slate-400">{comparison.comparison}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'comparison' && (
          <div className="space-y-4">
            {/* Feature comparison table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Feature</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-cyan-400">Nexus</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-400">🤖 ChatGPT</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-400">⚡ Zapier</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-400">🔧 n8n</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {(showAllFeatures ? featureComparison : featureComparison.slice(0, 8)).map((feature) => (
                    <tr key={feature.feature} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-sm text-white">{feature.feature}</td>
                      <td className="px-4 py-3 text-center">
                        <FeatureStatusBadge status={feature.nexus} highlight />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <FeatureStatusBadge status={feature.chatgpt} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <FeatureStatusBadge status={feature.zapier} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <FeatureStatusBadge status={feature.n8n} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper component for feature status badges
function FeatureStatusBadge({
  status,
  highlight = false,
}: {
  status: 'full' | 'partial' | 'none' | 'planned'
  highlight?: boolean
}) {
  const config = {
    full: { icon: '✓', color: highlight ? 'text-cyan-400' : 'text-emerald-400', bg: highlight ? 'bg-cyan-500/20' : 'bg-emerald-500/20' },
    partial: { icon: '◐', color: 'text-amber-400', bg: 'bg-amber-500/20' },
    none: { icon: '✗', color: 'text-slate-500', bg: 'bg-slate-500/20' },
    planned: { icon: '◯', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  }

  const { icon, color, bg } = config[status]

  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${bg} ${color} text-sm`}>
      {icon}
    </span>
  )
}

// ============================================
// QUICK COMPETITIVE BADGES (for headers/CTAs)
// ============================================

export function CompetitiveBadges({ variant = 'horizontal' }: { variant?: 'horizontal' | 'vertical' }) {
  const badges = [
    competitiveMessaging.badges.resultsFirst,
    competitiveMessaging.badges.tokenSavings,
    competitiveMessaging.badges.executionSpeed,
  ]

  if (variant === 'vertical') {
    return (
      <div className="space-y-2">
        {badges.map((badge, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50"
          >
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs">
              ✓
            </span>
            <span className="text-sm text-white">{badge.label}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {badges.map((badge, i) => (
        <div
          key={i}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 rounded-full border border-slate-700/50"
          title={badge.tooltip}
        >
          <span className="w-4 h-4 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-[10px]">
            ✓
          </span>
          <span className="text-xs text-slate-300">{badge.label}</span>
        </div>
      ))}
    </div>
  )
}

// ============================================
// EXPORTS
// ============================================

export {
  nexusAdvantages,
  competitors,
  tokenSavingsEstimates,
  executionTimeComparisons,
  featureComparison,
  calculateCompetitiveStats,
  tokensToDollars,
  competitiveMessaging,
  averageTokenSavings,
}

export type {
  NexusAdvantage,
  Competitor,
}
