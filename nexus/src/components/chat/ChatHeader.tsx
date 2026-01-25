/**
 * ChatHeader Component
 *
 * Top header with navigation:
 * - Sidebar toggle button on left (hamburger menu)
 * - Nexus logo/brand
 * - New Chat button
 * - Dashboard toggle button (PROMINENT - key feature)
 * - Settings/menu dropdown
 *
 * Integrates with ChatLayoutContext for sidebar control.
 * Keyboard shortcut: Cmd/Ctrl + B to toggle sidebar
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Plus,
  Settings,
  ChevronDown,
  Sparkles,
  History,
  Trash2,
  Moon,
  Sun,
  Menu,
  PanelLeftClose,
} from 'lucide-react'
import { useChatLayout } from './ChatLayoutContext'

// ============================================================================
// Types
// ============================================================================

interface ChatHeaderProps {
  onNewChat?: () => void
  onToggleDashboard?: () => void
  onOpenSettings?: () => void
  onClearHistory?: () => void
  showDashboardButton?: boolean
  showSidebarToggle?: boolean
  sessionTitle?: string
  className?: string
}

// ============================================================================
// Logo Component
// ============================================================================

function NexusLogo(): React.ReactElement {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-nexus-500 to-accent-nexus-500 flex items-center justify-center shadow-lg shadow-nexus-500/30">
        <Sparkles className="w-5 h-5 text-white" />
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold text-surface-100">
          Nexus
        </span>
        <span className="text-[10px] text-nexus-400 font-medium -mt-0.5">AI Workflows</span>
      </div>
    </div>
  )
}

// ============================================================================
// Settings Dropdown
// ============================================================================

interface SettingsDropdownProps {
  onOpenSettings?: () => void
  onClearHistory?: () => void
}

function SettingsDropdown({
  onOpenSettings,
  onClearHistory,
}: SettingsDropdownProps): React.ReactElement {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isDark, setIsDark] = React.useState(() =>
    document.documentElement.classList.contains('dark')
  )
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleTheme = React.useCallback(() => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    if (newIsDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  const menuItems = [
    {
      icon: isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />,
      label: isDark ? 'Light Mode' : 'Dark Mode',
      onClick: toggleTheme,
    },
    {
      icon: <History className="w-4 h-4" />,
      label: 'Chat History',
      onClick: () => {
        void 0
      },
    },
    {
      icon: <Settings className="w-4 h-4" />,
      label: 'Settings',
      onClick: () => {
        onOpenSettings?.()
        setIsOpen(false)
      },
    },
    {
      icon: <Trash2 className="w-4 h-4 text-red-500" />,
      label: 'Clear History',
      onClick: () => {
        onClearHistory?.()
        setIsOpen(false)
      },
      danger: true,
    },
  ]

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1 px-3 py-2 rounded-xl',
          'text-surface-400',
          'hover:bg-surface-800 hover:text-surface-200',
          'transition-all duration-200'
        )}
        aria-label="Settings menu"
        aria-expanded={isOpen}
      >
        <Settings className="w-5 h-5" />
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute right-0 top-full mt-2 w-48',
            'bg-surface-800/95 backdrop-blur-xl',
            'border border-surface-700/50',
            'rounded-xl shadow-xl shadow-black/20',
            'py-1 z-50',
            'animate-in fade-in slide-in-from-top-2 duration-200'
          )}
        >
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5',
                'text-sm text-left',
                item.danger
                  ? 'text-red-400 hover:bg-red-500/10'
                  : 'text-surface-200 hover:bg-surface-700/50',
                'transition-colors'
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// ChatHeader Component
// ============================================================================

export function ChatHeader({
  onNewChat,
  onToggleDashboard,
  onOpenSettings,
  onClearHistory,
  showDashboardButton = true,
  showSidebarToggle = true,
  sessionTitle,
  className,
}: ChatHeaderProps): React.ReactElement {
  // Try to get ChatLayoutContext - may not exist if not wrapped in provider
  let chatLayout: ReturnType<typeof useChatLayout> | null = null
  try {
    chatLayout = useChatLayout()
  } catch {
    // Context not available - that's okay, we'll just hide the toggle
  }

  const handleSidebarToggle = React.useCallback(() => {
    if (chatLayout) {
      chatLayout.toggleSidebar()
    } else if (onToggleDashboard) {
      // Fallback to old behavior
      onToggleDashboard()
    }
  }, [chatLayout, onToggleDashboard])

  return (
    <header
      className={cn(
        'flex items-center justify-between px-3 sm:px-4 py-3',
        'border-b border-surface-800',
        'bg-surface-900/80 backdrop-blur-xl',
        className
      )}
    >
      {/* Left: Sidebar Toggle + Logo */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Sidebar Toggle Button */}
        {showSidebarToggle && chatLayout && (
          <button
            onClick={handleSidebarToggle}
            className={cn(
              'p-2 rounded-lg',
              'text-surface-400',
              'hover:bg-surface-800 hover:text-surface-200',
              'transition-all duration-200'
            )}
            aria-label={chatLayout.sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            aria-expanded={chatLayout.sidebarOpen}
            title="Toggle sidebar (Ctrl+B)"
          >
            {chatLayout.sidebarOpen ? (
              <PanelLeftClose className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        )}

        <NexusLogo />

        {/* Session Title (optional) */}
        {sessionTitle && (
          <div className="hidden md:block">
            <span className="text-sm text-surface-400 truncate max-w-[200px] block">
              {sessionTitle}
            </span>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl',
            'text-surface-300',
            'hover:bg-surface-800 hover:text-surface-100',
            'transition-all duration-200'
          )}
          aria-label="Start new chat"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline text-sm font-medium">New Chat</span>
        </button>

        {/* PROMINENT Dashboard Button */}
        {showDashboardButton && (
          <button
            onClick={onToggleDashboard}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl',
              'bg-gradient-to-r from-nexus-500 to-accent-nexus-500',
              'text-white font-medium',
              'hover:shadow-lg hover:shadow-nexus-500/30',
              'transition-all duration-300',
              'active:scale-95'
            )}
            aria-label="Open dashboard"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-sm">Dashboard</span>
          </button>
        )}

        {/* Settings Dropdown */}
        <SettingsDropdown
          onOpenSettings={onOpenSettings}
          onClearHistory={onClearHistory}
        />
      </div>
    </header>
  )
}

export default ChatHeader
