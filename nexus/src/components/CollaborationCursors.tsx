/**
 * CollaborationCursors Component
 *
 * Placeholder component for showing other users' cursors in real-time.
 * Ready for WebSocket/real-time implementation.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'

// =============================================================================
// TYPES
// =============================================================================

export interface CursorPosition {
  x: number
  y: number
  timestamp: number
}

export interface CollaboratorCursor {
  userId: string
  name: string
  color: string
  position: CursorPosition
  isActive: boolean
  avatarUrl?: string
}

export interface CollaborationCursorsProps {
  /** List of collaborator cursors */
  cursors: CollaboratorCursor[]
  /** Current user ID (to exclude from display) */
  currentUserId?: string
  /** Whether real-time sync is enabled */
  isConnected?: boolean
  /** Container element ref for relative positioning */
  containerRef?: React.RefObject<HTMLElement>
  /** Callback when local cursor position changes */
  onCursorMove?: (position: CursorPosition) => void
  /** Show cursor labels */
  showLabels?: boolean
  /** Cursor fade timeout in ms (cursors fade after inactivity) */
  fadeTimeout?: number
  /** Optional class name */
  className?: string
}

// =============================================================================
// CURSOR COLORS
// =============================================================================

const CURSOR_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#14B8A6', // teal
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#6366F1', // indigo
  '#F43F5E'  // rose
]

// =============================================================================
// COMPONENT
// =============================================================================

export function CollaborationCursors({
  cursors,
  currentUserId,
  isConnected = false,
  containerRef,
  onCursorMove,
  showLabels = true,
  fadeTimeout = 5000,
  className = ''
}: CollaborationCursorsProps) {
  const [localPosition, setLocalPosition] = useState<CursorPosition | null>(null)

  // Filter out current user's cursor
  const otherCursors = useMemo(
    () => cursors.filter((c) => c.userId !== currentUserId),
    [cursors, currentUserId]
  )

  // Track local cursor position
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!containerRef?.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const position: CursorPosition = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        timestamp: Date.now()
      }

      setLocalPosition(position)
      onCursorMove?.(position)
    },
    [containerRef, onCursorMove]
  )

  // Attach mouse move listener
  useEffect(() => {
    if (!containerRef?.current || !onCursorMove) return

    const container = containerRef.current
    container.addEventListener('mousemove', handleMouseMove)

    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
    }
  }, [containerRef, handleMouseMove, onCursorMove])

  // Determine if a cursor is stale (faded)
  const isStale = (timestamp: number): boolean => {
    return Date.now() - timestamp > fadeTimeout
  }

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {/* Connection status indicator */}
      {!isConnected && (
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-xs text-yellow-500 pointer-events-auto">
          <DisconnectedIcon className="w-4 h-4" />
          <span>Offline mode</span>
        </div>
      )}

      {/* Collaborator cursors */}
      {otherCursors.map((cursor) => (
        <CollaboratorCursorElement
          key={cursor.userId}
          cursor={cursor}
          showLabel={showLabels}
          isStale={isStale(cursor.position.timestamp)}
        />
      ))}

      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && localPosition && (
        <div className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded pointer-events-auto">
          Local: ({Math.round(localPosition.x)}, {Math.round(localPosition.y)})
        </div>
      )}
    </div>
  )
}

// =============================================================================
// COLLABORATOR CURSOR ELEMENT
// =============================================================================

interface CollaboratorCursorElementProps {
  cursor: CollaboratorCursor
  showLabel: boolean
  isStale: boolean
}

function CollaboratorCursorElement({
  cursor,
  showLabel,
  isStale
}: CollaboratorCursorElementProps) {
  const { position, name, color, isActive } = cursor

  return (
    <div
      className={`absolute transition-all duration-75 ${
        isStale || !isActive ? 'opacity-30' : 'opacity-100'
      }`}
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-2px, -2px)'
      }}
    >
      {/* Cursor arrow */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
      >
        <path
          d="M5.65376 12.4563L5.41137 20.1968C5.38652 20.9499 6.26312 21.3982 6.87078 20.9288L11.5571 17.3025C11.7579 17.147 12.0177 17.0889 12.2664 17.1431L18.1572 18.4298C18.8836 18.5881 19.4649 17.8089 19.0627 17.1855L12.0972 5.95098C11.6951 5.32763 10.7688 5.49021 10.5994 6.19763L8.45276 15.1655"
          fill={color}
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Name label */}
      {showLabel && (
        <div
          className="absolute left-4 top-4 px-2 py-0.5 rounded text-xs text-white font-medium whitespace-nowrap"
          style={{ backgroundColor: color }}
        >
          {name}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// HOOKS FOR REAL-TIME INTEGRATION
// =============================================================================

/**
 * Hook placeholder for WebSocket-based cursor synchronization.
 * Replace with actual implementation when connecting to backend.
 */
export function useCollaborationCursors(workflowId: string, userId: string) {
  const [cursors, _setCursors] = useState<CollaboratorCursor[]>([])
  const [isConnected, setIsConnected] = useState(false)

  // Simulate connection state (replace with actual WebSocket logic)
  useEffect(() => {
    // Placeholder: In real implementation, connect to WebSocket here
    const timer = setTimeout(() => {
      setIsConnected(true)
    }, 1000)

    return () => {
      clearTimeout(timer)
      setIsConnected(false)
    }
  }, [workflowId])

  // Update local cursor position (broadcasts to other users)
  const updateCursorPosition = useCallback(
    (position: CursorPosition) => {
      // Placeholder: In real implementation, send to WebSocket
      console.log('Cursor position update:', { userId, position, workflowId })
    },
    [userId, workflowId]
  )

  // Generate a consistent color for a user
  const getUserColor = useCallback((id: string): string => {
    const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return CURSOR_COLORS[index % CURSOR_COLORS.length]
  }, [])

  return {
    cursors,
    isConnected,
    updateCursorPosition,
    getUserColor,
    // Placeholder methods for real implementation
    connect: () => setIsConnected(true),
    disconnect: () => setIsConnected(false)
  }
}

// =============================================================================
// DEMO CURSORS (FOR DEVELOPMENT/PREVIEW)
// =============================================================================

/**
 * Generates demo cursors for testing the UI.
 */
export function useDemoCursors(enabled: boolean = false): CollaboratorCursor[] {
  const [demoCursors, setDemoCursors] = useState<CollaboratorCursor[]>([])

  useEffect(() => {
    if (!enabled) {
      setDemoCursors([])
      return
    }

    // Create demo collaborators
    const collaborators = [
      { userId: 'demo-1', name: 'Alice', color: CURSOR_COLORS[0] },
      { userId: 'demo-2', name: 'Bob', color: CURSOR_COLORS[2] },
      { userId: 'demo-3', name: 'Charlie', color: CURSOR_COLORS[4] }
    ]

    // Animate cursors randomly
    const interval = setInterval(() => {
      setDemoCursors(
        collaborators.map((c) => ({
          ...c,
          isActive: true,
          position: {
            x: Math.random() * 800 + 100,
            y: Math.random() * 400 + 100,
            timestamp: Date.now()
          }
        }))
      )
    }, 2000)

    return () => clearInterval(interval)
  }, [enabled])

  return demoCursors
}

// =============================================================================
// ICONS
// =============================================================================

function DisconnectedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
      />
    </svg>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default CollaborationCursors
export { CURSOR_COLORS }
