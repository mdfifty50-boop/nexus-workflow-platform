/**
 * Chat Sidebar
 *
 * Collapsible sidebar panel for the ChatGPT-style chat interface.
 * Slides in/out from the left side with smooth animation.
 * Overlay on mobile, side-by-side on desktop.
 */

import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Spline3DAvatar } from '@/components/Spline3DAvatar'
import { useChatLayout } from './ChatLayoutContext'
import { DashboardPanel } from './DashboardPanel'
import type { RecentWorkflow } from './RecentWorkflowsList'
import type { WorkflowStats } from './QuickStatsWidget'

// =============================================================================
// TYPES
// =============================================================================

export interface ChatSidebarProps {
  /** Custom workflow stats */
  stats?: WorkflowStats
  /** Custom recent workflows */
  recentWorkflows?: RecentWorkflow[]
  /** Whether data is loading */
  loading?: boolean
  /** Callback when a workflow is clicked */
  onWorkflowClick?: (workflow: RecentWorkflow) => void
  /** Additional CSS classes for the sidebar */
  className?: string
}

// =============================================================================
// ICONS
// =============================================================================

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  )
}

// =============================================================================
// SIDEBAR HEADER
// =============================================================================

interface SidebarHeaderProps {
  onClose: () => void
}

function SidebarHeader({ onClose }: SidebarHeaderProps) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between p-4 border-b border-border">
      {/* Logo with 3D Avatar */}
      <div className="flex items-center gap-3">
        <Spline3DAvatar size="xs" className="rounded-xl" />
        <div>
          <h1 className="font-bold text-lg text-foreground">{t('app.name')}</h1>
          <p className="text-xs text-muted-foreground">{t('chat.aiWorkflowStudio')}</p>
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className={cn(
          'p-2 rounded-lg transition-colors',
          'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
        )}
        aria-label={t('chat.closeSidebar')}
      >
        <CloseIcon className="w-5 h-5" />
      </button>
    </div>
  )
}

// =============================================================================
// TOGGLE BUTTON (for header use)
// =============================================================================

export interface SidebarToggleButtonProps {
  className?: string
}

export function SidebarToggleButton({ className }: SidebarToggleButtonProps) {
  const { t } = useTranslation()
  const { sidebarOpen, toggleSidebar } = useChatLayout()

  return (
    <button
      onClick={toggleSidebar}
      className={cn(
        'p-2 rounded-lg transition-colors',
        'hover:bg-muted/50 text-muted-foreground hover:text-foreground',
        className
      )}
      aria-label={sidebarOpen ? t('chat.closeSidebar') : t('chat.openSidebar')}
      aria-expanded={sidebarOpen}
    >
      <MenuIcon className="w-5 h-5" />
    </button>
  )
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ChatSidebar({
  stats,
  recentWorkflows,
  loading = false,
  onWorkflowClick,
  className
}: ChatSidebarProps) {
  const { t } = useTranslation()
  const { sidebarOpen, sidebarWidth, isMobile, closeSidebar } = useChatLayout()
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Handle clicks outside sidebar on mobile to close
  useEffect(() => {
    if (!isMobile || !sidebarOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        closeSidebar()
      }
    }

    // Add slight delay to avoid immediate closure
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobile, sidebarOpen, closeSidebar])

  // Handle escape key to close sidebar
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && sidebarOpen) {
        closeSidebar()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [sidebarOpen, closeSidebar])

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobile, sidebarOpen])

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isMobile && (
        <div
          className={cn(
            'fixed inset-0 bg-black/50 backdrop-blur-sm z-40',
            'transition-opacity duration-300',
            sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={cn(
          // Base styles
          'flex flex-col bg-card border-r border-border',
          'transition-transform duration-300 ease-in-out',

          // Mobile: fixed overlay
          'fixed md:relative',
          'h-full z-50 md:z-auto',

          // Width
          'w-[260px]',

          // Transform based on open state
          sidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full md:translate-x-0 md:hidden',

          className
        )}
        style={{
          width: isMobile ? 260 : sidebarWidth
        }}
        role="complementary"
        aria-label={t('chat.chatSidebar')}
      >
        {/* Header */}
        <SidebarHeader onClose={closeSidebar} />

        {/* Content */}
        <DashboardPanel
          stats={stats}
          recentWorkflows={recentWorkflows}
          loading={loading}
          onCloseSidebar={isMobile ? closeSidebar : undefined}
          onWorkflowClick={onWorkflowClick}
        />
      </aside>
    </>
  )
}

// =============================================================================
// SIDEBAR CONTAINER (wraps content with sidebar)
// =============================================================================

export interface ChatSidebarContainerProps {
  children: React.ReactNode
  sidebarProps?: ChatSidebarProps
}

export function ChatSidebarContainer({
  children,
  sidebarProps
}: ChatSidebarContainerProps) {
  const { sidebarOpen, isMobile } = useChatLayout()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <ChatSidebar {...sidebarProps} />

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 flex flex-col min-w-0 transition-all duration-300',
          // Adjust margin on desktop when sidebar is open
          !isMobile && sidebarOpen && 'ml-0'
        )}
      >
        {children}
      </main>
    </div>
  )
}

export default ChatSidebar
