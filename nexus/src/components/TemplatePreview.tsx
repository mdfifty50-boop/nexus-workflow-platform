import { useState } from 'react'
import { Button } from './ui/button'
import { ProfessionalAvatar } from './ProfessionalAvatar'
import type { WorkflowTemplate } from './TemplatesMarketplace'

// =============================================================================
// TYPES
// =============================================================================

export interface TemplateComplexityDetails {
  level: 'simple' | 'moderate' | 'complex' | 'advanced'
  score: number // 1-10
  factors: string[]
}

export interface TemplateEstimatedCost {
  monthlyMin: number
  monthlyMax: number
  currency: string
  breakdown: Array<{
    item: string
    cost: number
    unit: string
  }>
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function calculateComplexity(template: WorkflowTemplate): TemplateComplexityDetails {
  const factors: string[] = []
  let score = 0

  // Steps complexity
  if (template.steps <= 3) {
    score += 1
    factors.push('Few workflow steps')
  } else if (template.steps <= 5) {
    score += 2
    factors.push('Moderate workflow steps')
  } else if (template.steps <= 8) {
    score += 3
    factors.push('Multiple workflow steps')
  } else {
    score += 4
    factors.push('Many workflow steps')
  }

  // Integrations complexity
  if (template.integrations.length <= 2) {
    score += 1
    factors.push('Few integrations required')
  } else if (template.integrations.length <= 4) {
    score += 2
    factors.push('Multiple integrations')
  } else {
    score += 3
    factors.push('Many integrations needed')
  }

  // Agents complexity
  if (template.agents.length <= 2) {
    score += 1
  } else if (template.agents.length <= 4) {
    score += 2
    factors.push('Multiple AI agents')
  } else {
    score += 3
    factors.push('Large AI agent team')
  }

  // Premium complexity
  if (template.isPremium) {
    score += 1
    factors.push('Premium features')
  }

  // Determine level
  let level: TemplateComplexityDetails['level']
  if (score <= 4) {
    level = 'simple'
  } else if (score <= 6) {
    level = 'moderate'
  } else if (score <= 8) {
    level = 'complex'
  } else {
    level = 'advanced'
  }

  return { level, score: Math.min(score, 10), factors }
}

function estimateCost(template: WorkflowTemplate): TemplateEstimatedCost {
  const breakdown: TemplateEstimatedCost['breakdown'] = []
  let monthlyMin = 0
  let monthlyMax = 0

  // Base platform cost
  if (template.isPremium) {
    breakdown.push({ item: 'Pro Plan', cost: 49, unit: '/month' })
    monthlyMin += 49
    monthlyMax += 49
  } else {
    breakdown.push({ item: 'Starter Plan', cost: 0, unit: '/month' })
  }

  // Integration costs (estimated)
  const premiumIntegrations = ['Salesforce', 'HubSpot', 'Zendesk', 'ServiceNow', 'SAP', 'NetSuite']
  const midTierIntegrations = ['Zoom', 'Teams', 'Slack', 'Intercom', 'QuickBooks']

  let integrationCost = 0
  template.integrations.forEach(integration => {
    if (premiumIntegrations.some(p => integration.includes(p))) {
      integrationCost += 25
    } else if (midTierIntegrations.some(m => integration.includes(m))) {
      integrationCost += 10
    }
  })

  if (integrationCost > 0) {
    breakdown.push({ item: 'Integration connectors', cost: integrationCost, unit: '/month' })
    monthlyMin += integrationCost * 0.5
    monthlyMax += integrationCost
  }

  // AI processing costs (based on steps and complexity)
  const aiCostBase = template.steps * 5
  breakdown.push({ item: 'AI processing', cost: aiCostBase, unit: '/month (est.)' })
  monthlyMin += aiCostBase * 0.3
  monthlyMax += aiCostBase * 1.5

  return {
    monthlyMin: Math.round(monthlyMin),
    monthlyMax: Math.round(monthlyMax),
    currency: 'USD',
    breakdown
  }
}

// =============================================================================
// COMPLEXITY BADGE
// =============================================================================

function ComplexityBadge({ complexity }: { complexity: TemplateComplexityDetails }) {
  const colors = {
    simple: 'bg-green-500/20 text-green-400 border-green-500/30',
    moderate: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    complex: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    advanced: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  }

  const labels = {
    simple: 'Simple',
    moderate: 'Moderate',
    complex: 'Complex',
    advanced: 'Advanced'
  }

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${colors[complexity.level]}`}>
      {labels[complexity.level]}
    </span>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface TemplatePreviewProps {
  template: WorkflowTemplate
  onClose: () => void
  onUse: () => void
  canUsePremium?: boolean
}

export function TemplatePreview({ template, onClose, onUse, canUsePremium = true }: TemplatePreviewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'cost'>('overview')

  const complexity = calculateComplexity(template)
  const estimatedCost = estimateCost(template)

  const isPremiumBlocked = template.isPremium && !canUsePremium

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center text-3xl">
                {template.icon}
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-bold text-white">{template.name}</h2>
                  {template.isPremium && (
                    <span className="px-2 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 text-xs font-medium border border-amber-500/30">
                      PRO
                    </span>
                  )}
                  {template.isNew && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                      NEW
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2">
                  {template.rating && (
                    <div className="flex items-center gap-1">
                      <span className="text-amber-400">&#9733;</span>
                      <span className="text-slate-300">{template.rating}</span>
                      <span className="text-slate-500">({template.reviewCount} reviews)</span>
                    </div>
                  )}
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-400">{template.usageCount?.toLocaleString()} uses</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-700 flex-shrink-0">
          <div className="flex gap-1 px-6">
            {(['overview', 'details', 'cost'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab
                    ? 'text-cyan-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <p className="text-slate-300">{template.description}</p>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-cyan-400">{template.timeSaved}</div>
                  <div className="text-xs text-slate-500 mt-1">Time Saved</div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-400">{template.successRate}%</div>
                  <div className="text-xs text-slate-500 mt-1">Success Rate</div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">{template.steps}</div>
                  <div className="text-xs text-slate-500 mt-1">Steps</div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <ComplexityBadge complexity={complexity} />
                  <div className="text-xs text-slate-500 mt-2">Complexity</div>
                </div>
              </div>

              {/* Agents */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">AI Agents Involved</h3>
                <div className="flex items-center gap-3 flex-wrap">
                  {template.agents.map(agent => (
                    <div key={agent} className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2">
                      <ProfessionalAvatar agentId={agent} size={28} />
                      <span className="text-white capitalize">{agent}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Required Integrations */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Required Integrations</h3>
                <div className="flex flex-wrap gap-2">
                  {template.integrations.map(integration => (
                    <span key={integration} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-sm">
                      {integration}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Workflow Steps */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Workflow Steps</h3>
                <div className="space-y-3">
                  {template.agents.map((agent, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
                        {i + 1}
                      </div>
                      <ProfessionalAvatar agentId={agent} size={40} />
                      <div className="flex-1">
                        <p className="text-white font-medium capitalize">{agent}</p>
                        <p className="text-sm text-slate-400">Processes step {i + 1} of the workflow</p>
                      </div>
                      {i < template.agents.length - 1 && (
                        <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Complexity Factors */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Complexity Analysis</h3>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <ComplexityBadge complexity={complexity} />
                    <span className="text-slate-400">Score: {complexity.score}/10</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-green-500 via-amber-500 to-red-500"
                      style={{ width: `${complexity.score * 10}%` }}
                    />
                  </div>
                  <ul className="space-y-2">
                    {complexity.factors.map((factor, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-400">
                        <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Template Source */}
              {template.createdBy && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Template Source</h3>
                  <div className="flex items-center gap-3 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      template.createdBy.type === 'nexus' ? 'bg-cyan-500/20 text-cyan-400' :
                      template.createdBy.type === 'partner' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {template.createdBy.type === 'nexus' ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {template.createdBy.type === 'nexus' ? 'Official Nexus Template' :
                         template.createdBy.type === 'partner' ? `Partner: ${template.createdBy.name || 'Verified Partner'}` :
                         `Community: ${template.createdBy.name || 'Community Member'}`}
                      </p>
                      <p className="text-sm text-slate-400">
                        {template.createdBy.type === 'nexus' ? 'Built and maintained by the Nexus team' :
                         template.createdBy.type === 'partner' ? 'Verified and trusted partner template' :
                         'Created and shared by the community'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'cost' && (
            <div className="space-y-6">
              {/* Estimated Monthly Cost */}
              <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-xl p-6 border border-cyan-500/20">
                <h3 className="text-lg font-semibold text-white mb-2">Estimated Monthly Cost</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-cyan-400">
                    ${estimatedCost.monthlyMin}
                  </span>
                  <span className="text-slate-400">-</span>
                  <span className="text-4xl font-bold text-cyan-400">
                    ${estimatedCost.monthlyMax}
                  </span>
                  <span className="text-slate-400">/month</span>
                </div>
                <p className="text-sm text-slate-400 mt-2">
                  Based on typical usage patterns. Actual costs may vary.
                </p>
              </div>

              {/* Cost Breakdown */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Cost Breakdown</h3>
                <div className="space-y-3">
                  {estimatedCost.breakdown.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                      <span className="text-slate-300">{item.item}</span>
                      <span className="text-white font-medium">
                        ${item.cost}{item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ROI Estimate */}
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4">Estimated ROI</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Time Saved</p>
                    <p className="text-2xl font-bold text-emerald-400">{template.timeSaved}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Labor Cost Saved*</p>
                    <p className="text-2xl font-bold text-emerald-400">~$400-800/mo</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-4">
                  *Based on average hourly rate of $50/hr
                </p>
              </div>

              {/* Premium Notice */}
              {template.isPremium && (
                <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-amber-400 font-medium">Pro Plan Required</p>
                      <p className="text-sm text-slate-400 mt-1">
                        This template requires a Pro subscription to use. Upgrade to unlock all premium templates.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex gap-4 flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={onUse}
            disabled={isPremiumBlocked}
            className="flex-1"
          >
            {isPremiumBlocked ? 'Upgrade to Use' : 'Use This Template'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default TemplatePreview
