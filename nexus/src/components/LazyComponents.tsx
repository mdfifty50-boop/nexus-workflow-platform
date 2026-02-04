/**
 * Lazy-Loaded Heavy Components
 * ============================
 * This module provides lazy-loaded versions of heavy components to reduce
 * initial bundle size. These components are code-split into separate chunks
 * and only loaded when needed.
 *
 * Usage:
 * import { LazyAIMeetingRoom, LazyWorkflowFlowChart } from '@/components/LazyComponents'
 *
 * <LazyAIMeetingRoom isOpen={isOpen} onClose={onClose} />
 *
 * ARCHIVED (see src/_archived/):
 * - WorkflowCanvas - Visual drag-and-drop editor (not suited for non-tech users)
 * - WorkflowCanvasLegacy - Legacy canvas implementation
 */

import { lazy, Suspense, type ComponentProps } from 'react'

// =============================================================================
// LOADING FALLBACKS
// =============================================================================

/**
 * Inline loading fallback for smaller components
 */
function InlineLoading() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
    </div>
  )
}

/**
 * Modal loading fallback
 */
function ModalLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin" />
        <p className="text-white text-lg">Loading AI Meeting Room...</p>
      </div>
    </div>
  )
}

// =============================================================================
// LAZY LOADED COMPONENTS
// =============================================================================

/**
 * Lazy-loaded AIMeetingRoom V2
 * Simplified navigation with ChatGPT-style UX
 * Heavy component (~800 lines) with TTS, animations, and real-time AI chat
 */
const LazyAIMeetingRoomInner = lazy(() =>
  import('./AIMeetingRoomV2').then(m => ({
    default: m.AIMeetingRoomV2
  }))
)

/**
 * Lazy-loaded MeetingRoomButton
 * Companion button for AIMeetingRoom
 */
const LazyMeetingRoomButtonInner = lazy(() =>
  import('./AIMeetingRoom').then(m => ({
    default: m.MeetingRoomButton
  }))
)

/**
 * Lazy-loaded WorkflowFlowChart
 * Recharts-based flow visualization
 */
const LazyWorkflowFlowChartInner = lazy(() =>
  import('./WorkflowFlowChart').then(m => ({
    default: m.default
  }))
)

// =============================================================================
// WRAPPED COMPONENTS WITH SUSPENSE
// =============================================================================

// Type for AIMeetingRoom props
type AIMeetingRoomProps = {
  isOpen: boolean
  onClose: () => void
  workflowContext?: string
  workflowTitle?: string
  mode?: 'optimization' | 'troubleshooting' | 'brainstorm'
}

/**
 * Lazy AIMeetingRoom with automatic Suspense boundary
 * Only renders when isOpen is true to defer loading until needed
 */
export function LazyAIMeetingRoom(props: AIMeetingRoomProps) {
  // Don't load the component until it's actually needed
  if (!props.isOpen) return null

  return (
    <Suspense fallback={<ModalLoading />}>
      <LazyAIMeetingRoomInner {...props} />
    </Suspense>
  )
}

// Type for MeetingRoomButton props
type MeetingRoomButtonProps = {
  onClick: () => void
  variant?: 'default' | 'compact' | 'floating'
}

/**
 * Lazy MeetingRoomButton with automatic Suspense boundary
 */
export function LazyMeetingRoomButton(props: MeetingRoomButtonProps) {
  return (
    <Suspense fallback={<InlineLoading />}>
      <LazyMeetingRoomButtonInner {...props} />
    </Suspense>
  )
}

// Type for WorkflowFlowChart props
type WorkflowFlowChartProps = ComponentProps<typeof LazyWorkflowFlowChartInner>

/**
 * Lazy WorkflowFlowChart with automatic Suspense boundary
 */
export function LazyWorkflowFlowChart(props: WorkflowFlowChartProps) {
  return (
    <Suspense fallback={<InlineLoading />}>
      <LazyWorkflowFlowChartInner {...props} />
    </Suspense>
  )
}

// =============================================================================
// PRELOAD FUNCTIONS
// =============================================================================

/**
 * Preload AIMeetingRoom V2 for faster display when user hovers over button
 */
export function preloadAIMeetingRoom() {
  import('./AIMeetingRoomV2')
}

// WorkflowCanvas preloaders removed - Canvas archived in favor of Chat Cards
