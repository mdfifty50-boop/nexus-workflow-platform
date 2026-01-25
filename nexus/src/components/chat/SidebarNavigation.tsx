/**
 * Sidebar Navigation
 *
 * Navigation links component for the chat sidebar.
 * Includes Home/Chat (with history dropdown), Dashboard, Workflows, Templates, Integrations, Settings.
 */

import * as React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { ChatSession } from './types'

// =============================================================================
// TYPES
// =============================================================================

export interface NavItem {
  /** Unique identifier */
  id: string
  /** Display label */
  label: string
  /** Route path */
  path: string
  /** Icon component */
  icon: React.ComponentType<{ className?: string }>
  /** Optional badge content */
  badge?: string | number
  /** Whether this is a primary item */
  primary?: boolean
  /** Whether this item has a dropdown */
  hasDropdown?: boolean
}

export interface SidebarNavigationProps {
  /** Click handler for navigation items */
  onNavigate?: (path: string) => void
  /** Close sidebar after navigation (for mobile) */
  closeSidebarOnNavigate?: boolean
  /** Callback when sidebar should close */
  onCloseSidebar?: () => void
  /** Additional CSS classes */
  className?: string
  /** Chat sessions for history dropdown */
  chatSessions?: ChatSession[]
  /** Current session ID */
  currentSessionId?: string
  /** Callback when a chat session is selected */
  onSelectSession?: (sessionId: string) => void
}

// =============================================================================
// ICONS
// =============================================================================

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
      />
    </svg>
  )
}

function WorkflowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h4v4H4zM16 6h4v4h-4zM10 14h4v4h-4z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 8h8M12 12v2"
      />
    </svg>
  )
}

function TemplatesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
      />
    </svg>
  )
}

function IntegrationsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  )
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  )
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  )
}

function ChevronIcon({ className, expanded }: { className?: string; expanded?: boolean }) {
  return (
    <svg
      className={cn(className, 'transition-transform duration-200', expanded && 'rotate-180')}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

// =============================================================================
// NAVIGATION ITEMS
// =============================================================================

const NAV_ITEMS: NavItem[] = [
  {
    id: 'chat',
    label: 'Chat',
    path: '/chat-demo',
    icon: MessageIcon,
    primary: true,
    hasDropdown: true
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: DashboardIcon
  },
  {
    id: 'workflows',
    label: 'Workflows',
    path: '/workflow-demo',
    icon: WorkflowIcon
  },
  {
    id: 'templates',
    label: 'Templates',
    path: '/templates',
    icon: TemplatesIcon
  },
  {
    id: 'integrations',
    label: 'Integrations',
    path: '/integrations',
    icon: IntegrationsIcon
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: SettingsIcon
  }
]

// =============================================================================
// HELPER: Format relative time
// =============================================================================

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SidebarNavigation({
  onNavigate,
  closeSidebarOnNavigate = true,
  onCloseSidebar,
  className,
  chatSessions = [],
  currentSessionId,
  onSelectSession
}: SidebarNavigationProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [chatDropdownOpen, setChatDropdownOpen] = React.useState(false)

  const handleClick = (item: NavItem, e?: React.MouseEvent) => {
    // For chat item, toggle dropdown instead of navigating
    if (item.hasDropdown && item.id === 'chat') {
      e?.preventDefault()
      setChatDropdownOpen(!chatDropdownOpen)
      return
    }

    if (onNavigate) {
      onNavigate(item.path)
    } else {
      navigate(item.path)
    }

    // Close sidebar on mobile after navigation
    if (closeSidebarOnNavigate && onCloseSidebar) {
      onCloseSidebar()
    }
  }

  const handleSessionSelect = (sessionId: string) => {
    if (onSelectSession) {
      onSelectSession(sessionId)
    }
    setChatDropdownOpen(false)
    // Navigate to chat
    if (onNavigate) {
      onNavigate('/chat-demo')
    } else {
      navigate('/chat-demo')
    }
  }

  const handleNewChat = () => {
    setChatDropdownOpen(false)
    // Signal ChatContainer to start a new session via localStorage event
    localStorage.setItem('nexus-new-chat-trigger', Date.now().toString())
    // Dispatch storage event for same-window communication
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'nexus-new-chat-trigger',
      newValue: Date.now().toString()
    }))
    if (onNavigate) {
      onNavigate('/chat-demo')
    } else {
      navigate('/chat-demo')
    }
  }

  const isActive = (path: string) => {
    // Handle root path for chat
    if (path === '/chat-demo' && (location.pathname === '/' || location.pathname === '/chat-demo')) return true
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <nav className={cn('space-y-1', className)}>
      {NAV_ITEMS.map(item => {
        const Icon = item.icon
        const active = isActive(item.path)

        return (
          <div key={item.id}>
            <button
              onClick={(e) => handleClick(item, e)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                'text-left group',
                active ? [
                  'bg-primary/10 text-primary',
                  'border border-primary/20'
                ] : [
                  'text-muted-foreground hover:text-foreground',
                  'hover:bg-muted/50 border border-transparent'
                ],
                item.primary && !active && 'font-medium'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 flex-shrink-0 transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              <span className="flex-1 text-sm">{item.label}</span>
              {item.badge && (
                <span className={cn(
                  'px-2 py-0.5 text-[10px] font-semibold rounded-full',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {item.badge}
                </span>
              )}
              {item.hasDropdown && (
                <ChevronIcon
                  className="w-4 h-4 text-muted-foreground"
                  expanded={chatDropdownOpen}
                />
              )}
            </button>

            {/* Chat History Dropdown */}
            {item.id === 'chat' && chatDropdownOpen && (
              <div className="mt-1 ml-4 pl-4 border-l-2 border-muted space-y-1">
                {/* New Chat button */}
                <button
                  onClick={handleNewChat}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                    'text-primary hover:bg-primary/10 transition-colors'
                  )}
                >
                  <span className="text-lg">+</span>
                  <span>New Chat</span>
                </button>

                {/* History header */}
                {chatSessions.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground">
                    <ClockIcon className="w-3 h-3" />
                    <span>Recent Chats</span>
                  </div>
                )}

                {/* Chat sessions list */}
                {chatSessions.slice(0, 10).map(session => (
                  <button
                    key={session.id}
                    onClick={() => handleSessionSelect(session.id)}
                    className={cn(
                      'w-full flex flex-col items-start px-3 py-2 rounded-lg text-sm',
                      'hover:bg-muted/50 transition-colors text-left',
                      session.id === currentSessionId && 'bg-muted/30'
                    )}
                  >
                    <span className="truncate w-full text-foreground">
                      {session.title || 'New Chat'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatRelativeTime(session.updatedAt)}
                    </span>
                  </button>
                ))}

                {chatSessions.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground italic">
                    No chat history yet
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}

export default SidebarNavigation
