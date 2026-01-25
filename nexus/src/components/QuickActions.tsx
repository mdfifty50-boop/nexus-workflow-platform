import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

interface QuickAction {
  id: string
  label: string
  icon: React.ReactNode
  action: () => void
  color: string
}

export function QuickActions() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const menuRef = useRef<HTMLDivElement>(null)
  const firstActionRef = useRef<HTMLButtonElement>(null)
  const mainButtonRef = useRef<HTMLButtonElement>(null)

  const actions: QuickAction[] = [
    {
      id: 'new-project',
      label: 'New Project',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      action: () => {
        navigate('/projects')
        // Trigger new project modal after navigation
        setTimeout(() => window.dispatchEvent(new CustomEvent('openNewProjectModal')), 100)
      },
      color: 'from-cyan-500 to-blue-500'
    },
    {
      id: 'new-workflow',
      label: 'New Workflow',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      action: () => navigate('/workflow-demo'),
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'templates',
      label: 'Browse Templates',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
      action: () => navigate('/templates'),
      color: 'from-amber-500 to-orange-500'
    },
    {
      id: 'search',
      label: 'Search',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      action: () => window.dispatchEvent(new CustomEvent('toggleCommandPalette')),
      color: 'from-emerald-500 to-teal-500'
    }
  ]

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return

    if (e.key === 'Escape') {
      setIsOpen(false)
      mainButtonRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Focus first action when menu opens
  useEffect(() => {
    if (isOpen) {
      // Delay to allow animation to start
      setTimeout(() => {
        firstActionRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  return (
    <div className="fixed bottom-6 left-6 z-40" ref={menuRef}>
      {/* Actions */}
      <div
        className={`absolute bottom-16 left-0 flex flex-col gap-3 transition-all duration-300 ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        role="menu"
        aria-label="Quick actions"
        aria-hidden={!isOpen}
      >
        {actions.map((action, index) => (
          <div
            key={action.id}
            className="flex items-center gap-3"
            style={{
              transitionDelay: isOpen ? `${index * 50}ms` : '0ms'
            }}
          >
            <span
              className={`
                px-3 py-1.5 bg-slate-800 text-white text-sm rounded-lg shadow-lg
                whitespace-nowrap opacity-0 -translate-x-2
                transition-all duration-200
                ${isOpen ? 'opacity-100 translate-x-0' : ''}
              `}
              style={{ transitionDelay: isOpen ? `${index * 50 + 100}ms` : '0ms' }}
              aria-hidden="true"
              id={`quick-action-label-${action.id}`}
            >
              {action.label}
            </span>
            <button
              ref={index === 0 ? firstActionRef : undefined}
              onClick={() => {
                action.action()
                setIsOpen(false)
              }}
              className={`
                w-12 h-12 min-w-[44px] min-h-[44px] rounded-full bg-gradient-to-br ${action.color}
                flex items-center justify-center text-white shadow-lg
                hover:scale-110 active:scale-95
                transition-all duration-200
                transform
                focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900
                ${isOpen ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}
              `}
              style={{ transitionDelay: isOpen ? `${index * 50}ms` : '0ms' }}
              role="menuitem"
              aria-label={action.label}
              tabIndex={isOpen ? 0 : -1}
            >
              {action.icon}
            </button>
          </div>
        ))}
      </div>

      {/* Main FAB */}
      <button
        ref={mainButtonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-14 h-14 min-w-[44px] min-h-[44px] rounded-full bg-gradient-to-br from-cyan-500 to-blue-600
          flex items-center justify-center text-white shadow-xl
          hover:shadow-cyan-500/30 hover:scale-105
          active:scale-95
          transition-all duration-300
          focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900
          ${isOpen ? 'rotate-45' : 'rotate-0'}
        `}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={isOpen ? 'Close quick actions menu' : 'Open quick actions menu'}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 -z-10"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  )
}

// Compact speed dial for mobile
export function MobileQuickActions() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const actions = [
    { icon: '+', label: 'New Project', action: () => navigate('/projects'), color: 'bg-cyan-500' },
    { icon: '⚡', label: 'New Workflow', action: () => navigate('/workflow-demo'), color: 'bg-purple-500' },
    { icon: '🔍', label: 'Search', action: () => window.dispatchEvent(new CustomEvent('toggleCommandPalette')), color: 'bg-emerald-500' },
  ]

  return (
    <div className="fixed bottom-20 right-4 z-40 md:hidden">
      <div
        className={`flex flex-col-reverse gap-2 mb-2 transition-all duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        role="menu"
        aria-label="Mobile quick actions"
        aria-hidden={!isOpen}
      >
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={() => {
              action.action()
              setIsOpen(false)
            }}
            className={`w-10 h-10 min-w-[44px] min-h-[44px] rounded-full ${action.color} text-white flex items-center justify-center shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900`}
            role="menuitem"
            aria-label={action.label}
            tabIndex={isOpen ? 0 : -1}
          >
            <span aria-hidden="true">{action.icon}</span>
          </button>
        ))}
      </div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 min-w-[44px] min-h-[44px] rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-xl transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${
          isOpen ? 'rotate-45' : ''
        }`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={isOpen ? 'Close quick actions menu' : 'Open quick actions menu'}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
    </div>
  )
}
