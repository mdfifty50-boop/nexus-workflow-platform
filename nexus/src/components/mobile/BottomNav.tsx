/**
 * BottomNav - Mobile Bottom Navigation
 *
 * A native-feeling bottom navigation bar for mobile devices.
 * Features:
 * - Fixed at bottom on mobile only
 * - Key nav items: Home, Workflows, Create, Settings
 * - Active state indicators with smooth animations
 * - Safe area padding for notched devices
 * - Haptic feedback on interaction
 */

import { useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// Haptic feedback utility
const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30, 10, 30]
    }
    navigator.vibrate(patterns[type])
  }
}

// Navigation items configuration
interface NavItem {
  path: string
  label: string
  labelKey?: string
  icon: React.ReactNode
  activeIcon?: React.ReactNode
  isCreate?: boolean
}

// Icons
const HomeIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg className="w-6 h-6" fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
    {filled ? (
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    )}
  </svg>
)

const WorkflowIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg className="w-6 h-6" fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
    {filled ? (
      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    )}
  </svg>
)

const CreateIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
  </svg>
)

const IntegrationsIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg className="w-6 h-6" fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
    {filled ? (
      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    )}
  </svg>
)

const ProfileIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg className="w-6 h-6" fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
    {filled ? (
      <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
    ) : (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </>
    )}
  </svg>
)


interface BottomNavProps {
  className?: string
}

export function BottomNav({ className = '' }: BottomNavProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const navItems: NavItem[] = [
    {
      path: '/dashboard',
      label: 'Home',
      labelKey: 'navigation.dashboard',
      icon: <HomeIcon />,
      activeIcon: <HomeIcon filled />
    },
    {
      path: '/workflows',
      label: 'Workflows',
      icon: <WorkflowIcon />,
      activeIcon: <WorkflowIcon filled />
    },
    {
      path: '/workflow-demo',
      label: 'Create',
      icon: <CreateIcon />,
      isCreate: true
    },
    {
      path: '/integrations',
      label: 'Apps',
      icon: <IntegrationsIcon />,
      activeIcon: <IntegrationsIcon filled />
    },
    {
      path: '/profile',
      label: 'Profile',
      icon: <ProfileIcon />,
      activeIcon: <ProfileIcon filled />
    }
  ]

  // Check if path is active
  const isActive = useCallback((path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard'
    }
    if (path === '/workflows') {
      return location.pathname === '/workflows' || location.pathname.startsWith('/workflows/')
    }
    if (path === '/integrations') {
      return location.pathname === '/integrations' || location.pathname.startsWith('/integrations/')
    }
    if (path === '/profile') {
      return location.pathname === '/profile' || location.pathname.startsWith('/profile/')
    }
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }, [location.pathname])

  // Handle navigation with haptic feedback
  const handleNavClick = useCallback((path: string, isCreate: boolean = false) => {
    triggerHaptic(isCreate ? 'medium' : 'light')
    navigate(path)
  }, [navigate])

  return (
    <>
      {/* Bottom Nav - Mobile Only */}
      <nav
        className={`
          md:hidden fixed bottom-0 left-0 right-0 z-40
          bg-slate-900/95 backdrop-blur-xl
          border-t border-slate-700/50
          ${className}
        `}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
        role="navigation"
        aria-label="Bottom navigation"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const active = isActive(item.path)

            // Create button is special - centered FAB style
            if (item.isCreate) {
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path, true)}
                  className="relative -mt-6 group"
                  aria-label={item.label}
                >
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 blur-lg opacity-50 group-active:opacity-75 transition-opacity" />

                  {/* Button */}
                  <div className="relative w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 active:scale-95 transition-transform">
                    {item.icon}
                  </div>

                  {/* Label */}
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-cyan-400 font-medium whitespace-nowrap">
                    {item.label}
                  </span>
                </button>
              )
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => triggerHaptic('light')}
                className={`
                  relative flex flex-col items-center justify-center
                  min-w-[64px] min-h-[48px] py-1 px-3
                  rounded-xl transition-all duration-200
                  active:scale-95
                  ${active
                    ? 'text-cyan-400'
                    : 'text-slate-400 hover:text-slate-300 active:text-slate-200'
                  }
                `}
                aria-current={active ? 'page' : undefined}
              >
                {/* Active indicator dot */}
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-400" />
                )}

                {/* Icon */}
                <span className={`transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
                  {active && item.activeIcon ? item.activeIcon : item.icon}
                </span>

                {/* Label */}
                <span className={`text-[10px] mt-0.5 font-medium transition-colors ${active ? 'text-cyan-400' : ''}`}>
                  {item.labelKey ? t(item.labelKey) : item.label}
                </span>

                {/* Active background glow */}
                {active && (
                  <span className="absolute inset-0 rounded-xl bg-cyan-500/10" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Spacer to prevent content from being hidden behind bottom nav on mobile */}
      <div
        className="md:hidden h-16"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
        aria-hidden="true"
      />
    </>
  )
}

export default BottomNav
