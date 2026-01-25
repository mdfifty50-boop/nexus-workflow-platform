import { useState, useEffect, type ReactNode } from 'react'
import { Navbar } from './Navbar'
import { SmartAIChatbot } from './SmartAIChatbot'
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp'
import { CommandPalette } from './CommandPalette'
import { QuickActions } from './QuickActions'
import { FloatingActionButton } from './mobile/FloatingActionButton'
import { BottomNav } from './mobile/BottomNav'
import { OfflineBanner } from '@/hooks/useNetworkStatus'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useScrollAnimations } from '@/hooks/useScrollAnimations'
import { SkipLink } from './SkipLink'

// Skip Navigation Links Component for Accessibility (WCAG 2.4.1)
function SkipLinks() {
  return (
    <nav aria-label="Skip navigation" className="skip-links-container">
      <SkipLink targetId="main-content">
        Skip to main content
      </SkipLink>
      <SkipLink
        targetId="main-navigation"
        className="focus:left-[calc(50%+120px)]"
      >
        Skip to navigation
      </SkipLink>
    </nav>
  )
}

// Subtle keyboard shortcut hint that appears briefly for new users
function KeyboardHint() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if user has seen the hint before
    const hasSeen = localStorage.getItem('nexus_shortcut_hint_seen')
    if (hasSeen) {
      setDismissed(true)
      return
    }

    // Show hint after 5 seconds, hide after 15 seconds
    const showTimer = setTimeout(() => setVisible(true), 5000)
    const hideTimer = setTimeout(() => {
      setVisible(false)
      localStorage.setItem('nexus_shortcut_hint_seen', 'true')
    }, 20000)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  const handleDismiss = () => {
    setVisible(false)
    setDismissed(true)
    localStorage.setItem('nexus_shortcut_hint_seen', 'true')
  }

  const handleOpenShortcuts = () => {
    window.dispatchEvent(new CustomEvent('toggleShortcutsHelp'))
    handleDismiss()
  }

  if (dismissed || !visible) return null

  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 hidden md:flex items-center gap-3 px-4 py-2.5 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-full shadow-xl animate-in slide-in-from-bottom-4 duration-500"
    >
      <span className="text-sm text-slate-300">Pro tip:</span>
      <button
        onClick={handleOpenShortcuts}
        className="flex items-center gap-2 px-3 py-1 bg-slate-700/80 hover:bg-cyan-500/20 border border-slate-600 hover:border-cyan-500/50 rounded-lg transition-all group"
      >
        <kbd className="text-xs font-mono text-cyan-400">?</kbd>
        <span className="text-xs text-slate-300 group-hover:text-cyan-300">View shortcuts</span>
      </button>
      <span className="text-slate-500">|</span>
      <div className="flex items-center gap-1.5">
        <kbd className="px-1.5 py-0.5 text-xs font-mono bg-slate-700 border border-slate-600 rounded text-cyan-400">⌘K</kbd>
        <span className="text-xs text-slate-400">Quick search</span>
      </div>
      <button
        onClick={handleDismiss}
        className="ml-1 p-1 hover:bg-slate-700 rounded transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

interface LayoutProps {
  children: ReactNode
  showNavbar?: boolean
  showChatbot?: boolean
  showQuickActions?: boolean
  showMobileFAB?: boolean
  chatPosition?: 'bottom-right' | 'bottom-left' | 'side-panel'
  onVoiceCommand?: (transcript: string, language: 'en-US' | 'ar-KW') => void
}

export function Layout({
  children,
  showNavbar = true,
  showChatbot = true,
  showQuickActions = true,
  showMobileFAB = true,
  chatPosition = 'bottom-right',
  onVoiceCommand
}: LayoutProps) {
  // Initialize keyboard shortcuts for this layout
  useKeyboardShortcuts()
  // Initialize scroll-triggered animations
  useScrollAnimations()

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Skip Navigation Links - Accessibility (Loop 26) */}
      <SkipLinks />
      <OfflineBanner />
      {showNavbar && <Navbar />}
      <main
        id="main-content"
        tabIndex={-1}
        className={`outline-none ${showNavbar ? 'pt-14' : ''}`}
        role="main"
        aria-label="Main content"
      >
        {children}
      </main>
      {showChatbot && <SmartAIChatbot position={chatPosition} />}
      {/* Desktop Quick Actions - hidden on mobile */}
      {showQuickActions && <div className="hidden md:block"><QuickActions /></div>}
      {/* Mobile FAB with voice input - hidden on desktop */}
      {showMobileFAB && (
        <div className="md:hidden">
          <FloatingActionButton onVoiceCommand={onVoiceCommand} />
        </div>
      )}
      <KeyboardHint />
      <KeyboardShortcutsHelp />
      <CommandPalette />
      {/* Mobile Bottom Navigation - hidden on desktop */}
      <BottomNav />
    </div>
  )
}

// Layout without navbar for landing/auth pages
export function MinimalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950">
      {children}
    </div>
  )
}
