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

// Chat mode type for "Think with me" feature
export type ChatMode = 'standard' | 'think_with_me'

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

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
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

function BrainIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
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
    id: 'whatsapp',
    label: 'WhatsApp',
    path: '/whatsapp',
    icon: WhatsAppIcon,
    badge: 'NEW'
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
  const [showNewChatSubmenu, setShowNewChatSubmenu] = React.useState(false)

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

  const handleNewChat = (mode: ChatMode = 'standard') => {
    setChatDropdownOpen(false)
    setShowNewChatSubmenu(false)
    // Store the chat mode BEFORE the trigger so ChatContainer can read it
    localStorage.setItem('nexus-chat-mode', mode)
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
                {/* New Chat section with submenu */}
                <div className="relative">
                  <button
                    onClick={() => setShowNewChatSubmenu(!showNewChatSubmenu)}
                    className={cn(
                      'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm',
                      'text-primary hover:bg-primary/10 transition-colors'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">+</span>
                      <span>New Chat</span>
                    </div>
                    <ChevronIcon className="w-3 h-3" expanded={showNewChatSubmenu} />
                  </button>

                  {/* New Chat Options Submenu */}
                  {showNewChatSubmenu && (
                    <div className="mt-1 ml-2 pl-2 border-l border-muted/50 space-y-1">
                      {/* Standard Chat */}
                      <button
                        onClick={() => handleNewChat('standard')}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                          'text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors'
                        )}
                      >
                        <MessageIcon className="w-4 h-4" />
                        <span>New Chat</span>
                      </button>

                      {/* Think with me */}
                      <button
                        onClick={() => handleNewChat('think_with_me')}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                          'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors'
                        )}
                      >
                        <BrainIcon className="w-4 h-4" />
                        <span>Think with me</span>
                      </button>
                    </div>
                  )}
                </div>

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
