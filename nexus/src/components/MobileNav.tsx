/**
 * MobileNav Component - Bottom tab navigation for mobile
 *
 * A fixed bottom navigation bar optimized for mobile viewports,
 * with icons and labels for main sections.
 */

import { useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useHaptics } from '@/hooks/useHaptics'

interface NavItem {
  path: string
  labelKey: string
  icon: React.ReactNode
  activeIcon?: React.ReactNode
  badge?: number | string
}

interface MobileNavProps {
  /** Custom navigation items (overrides defaults) */
  items?: NavItem[]
  /** Additional class names */
  className?: string
  /** Hide on certain routes */
  hideOnRoutes?: string[]
  /** Show labels under icons */
  showLabels?: boolean
}

/**
 * Default navigation items - Updated per requirements:
 * Dashboard, My Workflows, Templates, Connected Apps (Integrations), Settings
 */
const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    path: '/dashboard',
    labelKey: 'navigation.dashboard',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    activeIcon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
      </svg>
    )
  },
  {
    path: '/workflows',
    labelKey: 'navigation.workflows',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    activeIcon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
      </svg>
    )
  },
  {
    path: '/workflow-demo',
    labelKey: 'navigation.create',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    )
  },
  {
    path: '/integrations',
    labelKey: 'navigation.integrations',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    activeIcon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
      </svg>
    )
  },
  {
    path: '/settings',
    labelKey: 'navigation.settings',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    activeIcon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
      </svg>
    )
  }
]

/**
 * MobileNav - Bottom tab navigation for mobile viewports
 *
 * Features:
 * - Fixed bottom position with safe area support
 * - Active state indicators
 * - Haptic feedback on tap
 * - Badge support for notifications
 * - Central elevated action button
 *
 * @example
 * ```tsx
 * // Basic usage - renders on mobile only
 * <MobileNav />
 *
 * // Custom items
 * <MobileNav items={customItems} />
 *
 * // Hide on specific routes
 * <MobileNav hideOnRoutes={['/landing', '/login']} />
 * ```
 */
export function MobileNav({
  items = DEFAULT_NAV_ITEMS,
  className = '',
  hideOnRoutes = ['/login', '/signup', '/'],
  showLabels = true
}: MobileNavProps) {
  const location = useLocation()
  const { t } = useTranslation()
  const { trigger } = useHaptics()

  // Check if current route should hide nav
  const shouldHide = hideOnRoutes.some(route => location.pathname === route)
  if (shouldHide) return null

  // Check if path is active
  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/dashboard/'
    }
    return location.pathname.startsWith(path)
  }

  // Handle nav click with haptic feedback
  const handleClick = () => {
    trigger('light')
  }

  return (
    <>
      {/* Spacer to prevent content from being hidden behind nav */}
      <div className="h-20 md:hidden" aria-hidden="true" />

      {/* Navigation bar */}
      <nav
        className={`
          fixed bottom-0 left-0 right-0 z-50
          bg-slate-900/95 backdrop-blur-xl
          border-t border-slate-700/50
          md:hidden
          ${className}
        `}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-around h-16 px-1">
          {items.map((item, index) => {
            const active = isActive(item.path)
            const isCenter = index === Math.floor(items.length / 2)

            // Center item gets special treatment (elevated action button)
            if (isCenter) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleClick}
                  className={`
                    relative -mt-6 flex flex-col items-center justify-center
                    min-w-[64px] min-h-[64px] rounded-full
                    bg-gradient-to-br from-cyan-500 to-purple-600
                    shadow-lg shadow-cyan-500/30
                    active:scale-95 transition-transform
                  `}
                  aria-label={t(item.labelKey)}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="text-white">
                    {item.icon}
                  </span>
                  {/* Animated ring on hover/active */}
                  <span className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 opacity-0 hover:opacity-30 active:opacity-50 transition-opacity" />
                </Link>
              )
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleClick}
                className={`
                  relative flex flex-col items-center justify-center
                  min-w-[56px] min-h-[48px] rounded-xl
                  transition-all duration-200
                  active:scale-95
                  ${active
                    ? 'text-cyan-400'
                    : 'text-slate-400 hover:text-slate-300'
                  }
                `}
                aria-label={t(item.labelKey)}
                aria-current={active ? 'page' : undefined}
              >
                {/* Icon */}
                <span className="relative">
                  {active && item.activeIcon ? item.activeIcon : item.icon}

                  {/* Badge */}
                  {item.badge !== undefined && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold bg-red-500 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </span>

                {/* Label */}
                {showLabels && (
                  <span className={`
                    mt-0.5 text-[10px] font-medium
                    transition-all duration-200
                    ${active ? 'opacity-100' : 'opacity-70'}
                  `}>
                    {t(item.labelKey)}
                  </span>
                )}

                {/* Active indicator */}
                {active && (
                  <span className="absolute bottom-0 w-4 h-0.5 rounded-full bg-cyan-400" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}

/**
 * MobileNavSpacer - Use when you need just the spacer without the nav
 */
export function MobileNavSpacer() {
  return <div className="h-20 md:hidden" aria-hidden="true" />
}

export default MobileNav
