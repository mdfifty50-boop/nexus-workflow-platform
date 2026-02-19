/**
 * Approval Suggester
 * Post-processes workflow specs to suggest where approvals should go
 * @NEXUS-FIX-180: AI-suggested HITL placement - DO NOT REMOVE
 */

export interface ApprovalSuggestion {
  afterStepId: string
  reason: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  suggestedConfig: {
    priority: string
    approvalReason: string
    riskLevel: string
    mode?: 'binary' | 'review_edit' | 'choose_path'
    approvalMessage?: string
  }
}

interface StepLike {
  id: string
  name: string
  type: string
  tool?: string
  description?: string
  config?: Record<string, unknown>
}

interface SuggestOptions {
  industry?: string
  maxSuggestions?: number
  respectDensityGuard?: boolean
}

// Financial tools that always warrant approval
const FINANCIAL_TOOLS = new Set([
  'stripe', 'knet', 'myfatoorah', 'quickbooks', 'xero', 'freshbooks',
  'square', 'paypal', 'wise', 'revolut',
])

// Keywords that indicate destructive operations
const DESTRUCTIVE_KEYWORDS = [
  'delete', 'remove', 'purge', 'destroy', 'drop', 'truncate', 'wipe',
  'bulk update', 'mass update', 'batch delete', 'clear all',
]

// Keywords that indicate publishing/outreach
const PUBLISH_KEYWORDS = [
  'publish', 'deploy', 'post', 'tweet', 'broadcast', 'send to all',
  'mass email', 'campaign', 'blast', 'go live',
]

// Industry-specific approval triggers
const INDUSTRY_TRIGGERS: Record<string, (step: StepLike) => boolean> = {
  finance: (step) => {
    const text = `${step.name} ${step.description || ''}`.toLowerCase()
    return text.includes('transaction') || text.includes('transfer') || text.includes('payment') || text.includes('invoice')
  },
  healthcare: (step) => {
    const text = `${step.name} ${step.description || ''}`.toLowerCase()
    return text.includes('patient') || text.includes('medical') || text.includes('health') || text.includes('prescription')
  },
  government: (step) => {
    const text = `${step.name} ${step.description || ''}`.toLowerCase()
    return text.includes('procurement') || text.includes('tender') || text.includes('contract') || text.includes('citizen')
  },
  ecommerce: (step) => {
    const text = `${step.name} ${step.description || ''}`.toLowerCase()
    const config = step.config as Record<string, unknown> || {}
    const amount = config.amount as number || 0
    return (text.includes('order') || text.includes('refund')) && amount > 100
  },
}

/**
 * Suggest where approval nodes should be placed in a workflow
 */
export function suggestApprovalNodes(
  steps: StepLike[],
  options: SuggestOptions = {}
): ApprovalSuggestion[] {
  const { industry, respectDensityGuard = true } = options
  const suggestions: ApprovalSuggestion[] = []
  const actionSteps = steps.filter(s => s.type === 'action')

  for (const step of actionSteps) {
    const text = `${step.name} ${step.description || ''}`.toLowerCase()
    const tool = (step.tool || '').toLowerCase()

    // Check financial tools
    if (FINANCIAL_TOOLS.has(tool)) {
      suggestions.push({
        afterStepId: step.id,
        reason: `Financial operation via ${tool}`,
        riskLevel: 'high',
        suggestedConfig: {
          priority: 'high',
          approvalReason: `Review ${step.name} before processing payment`,
          riskLevel: 'high',
          mode: 'review_edit',
          approvalMessage: `Please review this financial transaction before it proceeds.`,
        },
      })
      continue
    }

    // Check destructive keywords
    if (DESTRUCTIVE_KEYWORDS.some(kw => text.includes(kw))) {
      suggestions.push({
        afterStepId: step.id,
        reason: `Destructive operation detected`,
        riskLevel: 'critical',
        suggestedConfig: {
          priority: 'critical',
          approvalReason: `Confirm destructive action: ${step.name}`,
          riskLevel: 'critical',
          mode: 'binary',
          approvalMessage: `This action cannot be undone. Please confirm.`,
        },
      })
      continue
    }

    // Check publish keywords
    if (PUBLISH_KEYWORDS.some(kw => text.includes(kw))) {
      suggestions.push({
        afterStepId: step.id,
        reason: `Public-facing content`,
        riskLevel: 'medium',
        suggestedConfig: {
          priority: 'medium',
          approvalReason: `Review content before publishing`,
          riskLevel: 'medium',
          mode: 'review_edit',
          approvalMessage: `Please review the content before it goes live.`,
        },
      })
      continue
    }

    // Check industry-specific triggers
    if (industry && INDUSTRY_TRIGGERS[industry]) {
      if (INDUSTRY_TRIGGERS[industry](step)) {
        suggestions.push({
          afterStepId: step.id,
          reason: `${industry} industry compliance requirement`,
          riskLevel: 'high',
          suggestedConfig: {
            priority: 'high',
            approvalReason: `${industry} compliance: Review ${step.name}`,
            riskLevel: 'high',
            mode: 'binary',
            approvalMessage: `Industry compliance requires approval for this action.`,
          },
        })
      }
    }
  }

  // Respect 20% density guard
  if (respectDensityGuard) {
    const maxApprovals = Math.max(1, Math.ceil(actionSteps.length / 5))
    if (suggestions.length > maxApprovals) {
      // Sort by risk (critical first) and cap
      const riskOrder: Record<string, number> = { critical: 3, high: 2, medium: 1, low: 0 }
      suggestions.sort((a, b) => (riskOrder[b.riskLevel] || 0) - (riskOrder[a.riskLevel] || 0))
      suggestions.length = maxApprovals
    }
  }

  // Apply maxSuggestions cap
  if (options.maxSuggestions && suggestions.length > options.maxSuggestions) {
    suggestions.length = options.maxSuggestions
  }

  return suggestions
}
