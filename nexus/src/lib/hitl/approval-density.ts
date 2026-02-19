/**
 * Approval Density Guard
 * Enforces the 20% rule: at most 1 approval node per 5 action nodes
 * @NEXUS-FIX-180: Approval density enforcement - DO NOT REMOVE
 */

export interface ApprovalDensityResult {
  totalNodes: number
  actionNodes: number
  approvalNodes: number
  density: number
  isHighDensity: boolean
  maxAllowed: number
  warningMessage?: string
  suggestedRemovals?: string[]
}

interface StepLike {
  id: string
  name: string
  type: string
  config?: Record<string, unknown>
}

/**
 * Calculate approval density for a workflow
 */
export function calculateApprovalDensity(steps: StepLike[]): ApprovalDensityResult {
  const totalNodes = steps.length
  const approvalNodes = steps.filter(s => s.type === 'approval').length
  const actionNodes = steps.filter(s => s.type === 'action').length
  const triggerNodes = steps.filter(s => s.type === 'trigger').length

  // Density is approvalNodes / (actionNodes + triggerNodes), not including approvals themselves
  const nonApprovalNodes = actionNodes + triggerNodes
  const density = nonApprovalNodes > 0 ? approvalNodes / nonApprovalNodes : 0
  const maxAllowed = Math.max(1, Math.ceil(nonApprovalNodes / 5))
  const isHighDensity = density > 0.20

  const result: ApprovalDensityResult = {
    totalNodes,
    actionNodes,
    approvalNodes,
    density: Math.round(density * 100) / 100,
    isHighDensity,
    maxAllowed,
  }

  if (isHighDensity) {
    const pct = Math.round(density * 100)
    result.warningMessage = `High human involvement (${pct}% of steps need approval). Consider reducing to ${maxAllowed} approval gate${maxAllowed > 1 ? 's' : ''}.`

    // Suggest which approvals to remove (lowest risk first)
    if (approvalNodes > maxAllowed) {
      const approvalSteps = steps
        .filter(s => s.type === 'approval')
        .map(s => ({
          id: s.id,
          name: s.name,
          riskLevel: (s.config as Record<string, unknown>)?.riskLevel as string || 'medium',
        }))
        .sort((a, b) => {
          const riskOrder: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 }
          return (riskOrder[a.riskLevel] || 1) - (riskOrder[b.riskLevel] || 1)
        })

      result.suggestedRemovals = approvalSteps
        .slice(0, approvalNodes - maxAllowed)
        .map(s => s.id)
    }
  }

  return result
}

/**
 * Trim approval nodes to respect the 20% guard
 * Keeps highest-risk approvals, removes lowest-risk ones
 */
export function trimApprovalNodes<T extends StepLike>(steps: T[]): T[] {
  const approvalSteps = steps.filter(s => s.type === 'approval')
  const actionCount = steps.filter(s => s.type === 'action').length
  const maxApprovals = Math.max(1, Math.ceil(actionCount / 5))

  if (approvalSteps.length <= maxApprovals) {
    return steps // No trimming needed
  }

  // Sort by risk level descending - keep highest risk
  const sorted = [...approvalSteps].sort((a, b) => {
    const riskOrder: Record<string, number> = { critical: 3, high: 2, medium: 1, low: 0 }
    const riskA = (a.config as Record<string, unknown>)?.riskLevel as string || 'medium'
    const riskB = (b.config as Record<string, unknown>)?.riskLevel as string || 'medium'
    return (riskOrder[riskB] || 1) - (riskOrder[riskA] || 1)
  })

  const keptApprovals = new Set(sorted.slice(0, maxApprovals).map(s => s.id))

  // Return steps in original order, filtering out trimmed approvals
  return steps.filter(s => s.type !== 'approval' || keptApprovals.has(s.id))
}
