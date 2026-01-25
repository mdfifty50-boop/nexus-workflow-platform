/**
 * Chat Layout Context
 *
 * Manages the sidebar state for the ChatGPT-style chat interface.
 * Handles sidebar toggle, width, view mode, and persistence.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode
} from 'react'

// =============================================================================
// TYPES
// =============================================================================

/** View mode for the chat layout */
export const VIEW_MODES = {
  CHAT: 'chat',
  DASHBOARD: 'dashboard',
  SPLIT: 'split'
} as const

export type ViewMode = typeof VIEW_MODES[keyof typeof VIEW_MODES]

export interface ChatLayoutState {
  /** Whether the sidebar is open */
  sidebarOpen: boolean
  /** Width of the sidebar in pixels */
  sidebarWidth: number
  /** Current view mode */
  viewMode: ViewMode
  /** Whether we're on a mobile device */
  isMobile: boolean
}

export interface ChatLayoutContextType extends ChatLayoutState {
  /** Toggle sidebar open/closed */
  toggleSidebar: () => void
  /** Set sidebar open state */
  setSidebarOpen: (open: boolean) => void
  /** Set the sidebar width */
  setSidebarWidth: (width: number) => void
  /** Set the view mode */
  setViewMode: (mode: ViewMode) => void
  /** Close sidebar (convenience method) */
  closeSidebar: () => void
  /** Open sidebar (convenience method) */
  openSidebar: () => void
}

// =============================================================================
// CONTEXT
// =============================================================================

const ChatLayoutContext = createContext<ChatLayoutContextType | null>(null)

// Storage keys
const STORAGE_KEY_SIDEBAR = 'nexus_chat_sidebar_open'
const STORAGE_KEY_WIDTH = 'nexus_chat_sidebar_width'
const STORAGE_KEY_VIEW = 'nexus_chat_view_mode'

// Default sidebar width (like ChatGPT)
const DEFAULT_SIDEBAR_WIDTH = 260
const MIN_SIDEBAR_WIDTH = 200
const MAX_SIDEBAR_WIDTH = 400

// Breakpoint for mobile detection
const MOBILE_BREAKPOINT = 768

// =============================================================================
// PROVIDER
// =============================================================================

export interface ChatLayoutProviderProps {
  children: ReactNode
  /** Default sidebar state */
  defaultOpen?: boolean
  /** Default sidebar width */
  defaultWidth?: number
  /** Default view mode */
  defaultViewMode?: ViewMode
}

export function ChatLayoutProvider({
  children,
  defaultOpen = true,
  defaultWidth = DEFAULT_SIDEBAR_WIDTH,
  defaultViewMode = VIEW_MODES.CHAT
}: ChatLayoutProviderProps) {
  // Track mobile state
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < MOBILE_BREAKPOINT
  })

  // Initialize sidebar state from localStorage
  const [sidebarOpen, setSidebarOpenState] = useState(() => {
    if (typeof window === 'undefined') return defaultOpen
    // On mobile, default to closed
    if (window.innerWidth < MOBILE_BREAKPOINT) return false
    const stored = localStorage.getItem(STORAGE_KEY_SIDEBAR)
    return stored !== null ? stored === 'true' : defaultOpen
  })

  // Initialize sidebar width from localStorage
  const [sidebarWidth, setSidebarWidthState] = useState(() => {
    if (typeof window === 'undefined') return defaultWidth
    const stored = localStorage.getItem(STORAGE_KEY_WIDTH)
    if (stored) {
      const width = parseInt(stored, 10)
      if (!isNaN(width) && width >= MIN_SIDEBAR_WIDTH && width <= MAX_SIDEBAR_WIDTH) {
        return width
      }
    }
    return defaultWidth
  })

  // Initialize view mode from localStorage
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return defaultViewMode
    const stored = localStorage.getItem(STORAGE_KEY_VIEW) as ViewMode | null
    if (stored && Object.values(VIEW_MODES).includes(stored)) {
      return stored
    }
    return defaultViewMode
  })

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT
      setIsMobile(mobile)
      // Auto-close sidebar on mobile when resizing down
      if (mobile && sidebarOpen) {
        setSidebarOpenState(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [sidebarOpen])

  // Keyboard shortcut: Cmd/Ctrl + B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        toggleSidebar()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Set sidebar open state and persist
  const setSidebarOpen = useCallback((open: boolean) => {
    setSidebarOpenState(open)
    localStorage.setItem(STORAGE_KEY_SIDEBAR, String(open))
  }, [])

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setSidebarOpenState(prev => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY_SIDEBAR, String(next))
      return next
    })
  }, [])

  // Convenience methods
  const closeSidebar = useCallback(() => setSidebarOpen(false), [setSidebarOpen])
  const openSidebar = useCallback(() => setSidebarOpen(true), [setSidebarOpen])

  // Set sidebar width and persist
  const setSidebarWidth = useCallback((width: number) => {
    const clampedWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, width))
    setSidebarWidthState(clampedWidth)
    localStorage.setItem(STORAGE_KEY_WIDTH, String(clampedWidth))
  }, [])

  // Set view mode and persist
  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode)
    localStorage.setItem(STORAGE_KEY_VIEW, mode)
  }, [])

  const value: ChatLayoutContextType = {
    sidebarOpen,
    sidebarWidth,
    viewMode,
    isMobile,
    toggleSidebar,
    setSidebarOpen,
    setSidebarWidth,
    setViewMode,
    closeSidebar,
    openSidebar
  }

  return (
    <ChatLayoutContext.Provider value={value}>
      {children}
    </ChatLayoutContext.Provider>
  )
}

// =============================================================================
// HOOK
// =============================================================================

export function useChatLayout() {
  const context = useContext(ChatLayoutContext)
  if (!context) {
    throw new Error('useChatLayout must be used within a ChatLayoutProvider')
  }
  return context
}

// =============================================================================
// EXPORT DEFAULT
// =============================================================================

export default ChatLayoutProvider
