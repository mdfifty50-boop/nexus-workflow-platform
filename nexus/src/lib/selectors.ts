/**
 * STATE SELECTORS
 *
 * Memoized selectors for deriving state from context values.
 * Prevents unnecessary recalculations on every render by caching
 * derived values based on their inputs.
 *
 * Features:
 * - Memoization with configurable cache size
 * - Automatic cache invalidation
 * - Type-safe selector composition
 * - Performance monitoring
 */

// ============================================================================
// TYPES
// ============================================================================

export type Selector<TState, TResult> = (state: TState) => TResult

export type ParametricSelector<TState, TParams, TResult> = (
  state: TState,
  params: TParams
) => TResult

interface MemoizedSelector<TState, TResult> extends Selector<TState, TResult> {
  /** Clear the memoization cache */
  clearCache: () => void
  /** Get cache statistics */
  getCacheStats: () => { hits: number; misses: number; size: number }
  /** Get the last computed result without recomputing */
  peek: () => TResult | undefined
}

interface MemoizedParametricSelector<TState, TParams, TResult>
  extends ParametricSelector<TState, TParams, TResult> {
  clearCache: () => void
  getCacheStats: () => { hits: number; misses: number; size: number }
}

// ============================================================================
// MEMOIZATION HELPERS
// ============================================================================

/**
 * Simple equality check for inputs
 */
function shallowEqual<T>(a: T, b: T): boolean {
  if (a === b) return true
  if (a == null || b == null) return false
  if (typeof a !== 'object' || typeof b !== 'object') return false

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)

  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if ((a as Record<string, unknown>)[key] !== (b as Record<string, unknown>)[key]) {
      return false
    }
  }

  return true
}

/**
 * Create a memoized selector with single cache entry
 */
export function createSelector<TState, TResult>(
  selector: Selector<TState, TResult>,
  equalityFn: (a: TResult, b: TResult) => boolean = shallowEqual
): MemoizedSelector<TState, TResult> {
  let lastState: TState | undefined
  let lastResult: TResult | undefined
  let stats = { hits: 0, misses: 0 }

  const memoized = (state: TState): TResult => {
    if (lastState !== undefined && lastState === state) {
      stats.hits++
      return lastResult!
    }

    const result = selector(state)

    // Check if result actually changed (for reference stability)
    if (lastResult !== undefined && equalityFn(lastResult, result)) {
      stats.hits++
      lastState = state
      return lastResult
    }

    stats.misses++
    lastState = state
    lastResult = result
    return result
  }

  memoized.clearCache = () => {
    lastState = undefined
    lastResult = undefined
    stats = { hits: 0, misses: 0 }
  }

  memoized.getCacheStats = () => ({
    ...stats,
    size: lastResult !== undefined ? 1 : 0
  })

  memoized.peek = () => lastResult

  return memoized
}

/**
 * Create a memoized selector with LRU cache for parametric selectors
 */
export function createParametricSelector<TState, TParams, TResult>(
  selector: ParametricSelector<TState, TParams, TResult>,
  options: {
    cacheSize?: number
    keyFn?: (params: TParams) => string
  } = {}
): MemoizedParametricSelector<TState, TParams, TResult> {
  const { cacheSize = 10, keyFn = (p) => JSON.stringify(p) } = options

  const cache = new Map<string, { state: TState; result: TResult }>()
  const keyOrder: string[] = []
  let stats = { hits: 0, misses: 0 }

  const memoized = (state: TState, params: TParams): TResult => {
    const key = keyFn(params)
    const cached = cache.get(key)

    if (cached && cached.state === state) {
      stats.hits++
      return cached.result
    }

    stats.misses++
    const result = selector(state, params)

    // Update cache with LRU eviction
    if (cache.size >= cacheSize) {
      const oldestKey = keyOrder.shift()
      if (oldestKey) cache.delete(oldestKey)
    }

    cache.set(key, { state, result })
    keyOrder.push(key)

    return result
  }

  memoized.clearCache = () => {
    cache.clear()
    keyOrder.length = 0
    stats = { hits: 0, misses: 0 }
  }

  memoized.getCacheStats = () => ({
    ...stats,
    size: cache.size
  })

  return memoized
}

/**
 * Compose multiple selectors
 */
export function composeSelectors<TState, T1, TResult>(
  selector1: Selector<TState, T1>,
  combiner: (r1: T1) => TResult
): Selector<TState, TResult>

export function composeSelectors<TState, T1, T2, TResult>(
  selector1: Selector<TState, T1>,
  selector2: Selector<TState, T2>,
  combiner: (r1: T1, r2: T2) => TResult
): Selector<TState, TResult>

export function composeSelectors<TState, T1, T2, T3, TResult>(
  selector1: Selector<TState, T1>,
  selector2: Selector<TState, T2>,
  selector3: Selector<TState, T3>,
  combiner: (r1: T1, r2: T2, r3: T3) => TResult
): Selector<TState, TResult>

export function composeSelectors(...args: unknown[]): unknown {
  const combiner = args.pop() as (...inputs: unknown[]) => unknown
  const selectors = args as Selector<unknown, unknown>[]

  let lastInputs: unknown[] | undefined
  let lastResult: unknown

  return (state: unknown) => {
    const inputs = selectors.map(s => s(state))

    // Check if any input changed
    if (lastInputs && inputs.every((input, i) => input === lastInputs![i])) {
      return lastResult
    }

    lastInputs = inputs
    lastResult = combiner(...inputs)
    return lastResult
  }
}

// ============================================================================
// WORKFLOW SELECTORS
// ============================================================================

import type { WorkflowContextState, ActiveWorkflow, WorkflowNode } from '@/contexts/WorkflowContext'

/**
 * Select active workflow
 */
export const selectActiveWorkflow = createSelector(
  (state: WorkflowContextState) => state.activeWorkflow
)

/**
 * Select workflow by ID
 */
export const selectWorkflowById = createParametricSelector(
  (state: WorkflowContextState, id: string) => state.workflows.get(id)
)

/**
 * Select all completed workflows
 */
export const selectCompletedWorkflows = createSelector(
  (state: WorkflowContextState): ActiveWorkflow[] => {
    const completed: ActiveWorkflow[] = []
    state.workflows.forEach(w => {
      if (w.status === 'completed') completed.push(w)
    })
    return completed
  }
)

/**
 * Select running workflows
 */
export const selectRunningWorkflows = createSelector(
  (state: WorkflowContextState): ActiveWorkflow[] => {
    const running: ActiveWorkflow[] = []
    state.workflows.forEach(w => {
      if (w.status === 'running' || w.status === 'orchestrating' || w.status === 'planning') {
        running.push(w)
      }
    })
    return running
  }
)

/**
 * Select workflow nodes as array
 */
export const selectWorkflowNodes = createParametricSelector(
  (state: WorkflowContextState, workflowId: string): WorkflowNode[] => {
    const workflow = state.workflows.get(workflowId)
    if (!workflow) return []
    return Array.from(workflow.nodes.values())
  }
)

/**
 * Select pending nodes for a workflow
 */
export const selectPendingNodes = createParametricSelector(
  (state: WorkflowContextState, workflowId: string): WorkflowNode[] => {
    const workflow = state.workflows.get(workflowId)
    if (!workflow) return []

    const pending: WorkflowNode[] = []
    workflow.nodes.forEach(node => {
      if (node.status === 'pending') pending.push(node)
    })
    return pending
  }
)

/**
 * Select total cost across all workflows
 */
export const selectTotalCost = createSelector(
  (state: WorkflowContextState): number => {
    let total = 0
    state.workflows.forEach(w => {
      total += w.totalCostUsd
    })
    return total
  }
)

/**
 * Select total tokens used across all workflows
 */
export const selectTotalTokens = createSelector(
  (state: WorkflowContextState): number => {
    let total = 0
    state.workflows.forEach(w => {
      total += w.totalTokensUsed
    })
    return total
  }
)

/**
 * Select workflow statistics
 */
export const selectWorkflowStats = createSelector(
  (state: WorkflowContextState) => {
    let total = 0
    let completed = 0
    let failed = 0
    let running = 0

    state.workflows.forEach(w => {
      total++
      if (w.status === 'completed') completed++
      else if (w.status === 'failed') failed++
      else if (w.status === 'running' || w.status === 'orchestrating') running++
    })

    return {
      total,
      completed,
      failed,
      running,
      successRate: total > 0 ? (completed / total) * 100 : 0
    }
  }
)

/**
 * Select workflow progress percentage
 */
export const selectWorkflowProgress = createParametricSelector(
  (state: WorkflowContextState, workflowId: string): number => {
    const workflow = state.workflows.get(workflowId)
    if (!workflow || workflow.nodes.size === 0) return 0

    let completed = 0
    workflow.nodes.forEach(node => {
      if (node.status === 'completed') completed++
    })

    return (completed / workflow.nodes.size) * 100
  }
)

// ============================================================================
// AUTH SELECTORS
// ============================================================================

import type { AuthContextType } from '@/contexts/AuthContext'

/**
 * Select whether user is authenticated
 */
export const selectIsAuthenticated = createSelector(
  (state: AuthContextType) => state.isSignedIn && !state.loading
)

/**
 * Select user display name
 */
export const selectUserDisplayName = createSelector(
  (state: AuthContextType): string => {
    if (state.userProfile?.full_name) return state.userProfile.full_name
    if (state.user?.user_metadata?.full_name) return state.user.user_metadata.full_name
    if (state.userProfile?.email) return state.userProfile.email.split('@')[0]
    return 'User'
  }
)

/**
 * Select user avatar URL
 */
export const selectUserAvatar = createSelector(
  (state: AuthContextType): string | null => {
    return state.userProfile?.avatar_url || state.user?.user_metadata?.avatar_url || null
  }
)

// ============================================================================
// PERSONALIZATION SELECTORS
// ============================================================================

import type { PersonaType } from '@/contexts/PersonalizationContext'

interface PersonalizationState {
  persona: PersonaType
  isOnboarded: boolean
  customPersonaLabel: string | null
}

/**
 * Select workflow terminology based on persona
 */
export const selectWorkflowTerm = createParametricSelector(
  (_state: PersonalizationState, term: 'workflow' | 'task' | 'team' | 'results'): string => {
    // This would normally look up from PERSONA_DEFINITIONS
    const defaults: Record<string, string> = {
      workflow: 'Workflows',
      task: 'Tasks',
      team: 'AI Team',
      results: 'Results'
    }
    return defaults[term]
  }
)

/**
 * Select if user needs onboarding
 */
export const selectNeedsOnboarding = createSelector(
  (state: PersonalizationState) => !state.isOnboarded
)

// ============================================================================
// UTILITY SELECTORS
// ============================================================================

/**
 * Create a selector that filters an array
 */
export function createFilterSelector<TState, TItem>(
  arraySelector: Selector<TState, TItem[]>,
  predicate: (item: TItem) => boolean
): MemoizedSelector<TState, TItem[]> {
  let lastArray: TItem[] | undefined
  let lastResult: TItem[] | undefined
  let stats = { hits: 0, misses: 0 }

  const memoized = (state: TState): TItem[] => {
    const array = arraySelector(state)

    if (array === lastArray && lastResult !== undefined) {
      stats.hits++
      return lastResult
    }

    stats.misses++
    lastArray = array
    lastResult = array.filter(predicate)
    return lastResult
  }

  memoized.clearCache = () => {
    lastArray = undefined
    lastResult = undefined
    stats = { hits: 0, misses: 0 }
  }

  memoized.getCacheStats = () => ({
    ...stats,
    size: lastResult !== undefined ? 1 : 0
  })

  memoized.peek = () => lastResult

  return memoized
}

/**
 * Create a selector that sorts an array
 */
export function createSortSelector<TState, TItem>(
  arraySelector: Selector<TState, TItem[]>,
  compareFn: (a: TItem, b: TItem) => number
): MemoizedSelector<TState, TItem[]> {
  let lastArray: TItem[] | undefined
  let lastResult: TItem[] | undefined
  let stats = { hits: 0, misses: 0 }

  const memoized = (state: TState): TItem[] => {
    const array = arraySelector(state)

    if (array === lastArray && lastResult !== undefined) {
      stats.hits++
      return lastResult
    }

    stats.misses++
    lastArray = array
    lastResult = [...array].sort(compareFn)
    return lastResult
  }

  memoized.clearCache = () => {
    lastArray = undefined
    lastResult = undefined
    stats = { hits: 0, misses: 0 }
  }

  memoized.getCacheStats = () => ({
    ...stats,
    size: lastResult !== undefined ? 1 : 0
  })

  memoized.peek = () => lastResult

  return memoized
}

// ============================================================================
// SELECTOR COLLECTION FOR DEBUGGING
// ============================================================================

const allSelectors = new Map<string, { clearCache: () => void; getCacheStats: () => unknown }>()

/**
 * Register a selector for debugging/monitoring
 */
export function registerSelector(
  name: string,
  selector: { clearCache: () => void; getCacheStats: () => unknown }
): void {
  allSelectors.set(name, selector)
}

/**
 * Get all selector cache stats
 */
export function getAllSelectorStats(): Record<string, unknown> {
  const stats: Record<string, unknown> = {}
  allSelectors.forEach((selector, name) => {
    stats[name] = selector.getCacheStats()
  })
  return stats
}

/**
 * Clear all selector caches
 */
export function clearAllSelectorCaches(): void {
  allSelectors.forEach(selector => selector.clearCache())
}

// Register built-in selectors
registerSelector('activeWorkflow', selectActiveWorkflow)
registerSelector('completedWorkflows', selectCompletedWorkflows)
registerSelector('runningWorkflows', selectRunningWorkflows)
registerSelector('totalCost', selectTotalCost)
registerSelector('totalTokens', selectTotalTokens)
registerSelector('workflowStats', selectWorkflowStats)
