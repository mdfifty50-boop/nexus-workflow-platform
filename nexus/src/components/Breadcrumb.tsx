import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useRTL } from './RTLProvider'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  className?: string
  showBackButton?: boolean
  /** Compact mode for mobile - shows only current page */
  compact?: boolean
}

// Auto-generate breadcrumbs from URL path
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const pathSegments = pathname.split('/').filter(Boolean)

  // Label map with user-friendly names per requirements
  const labelMap: Record<string, string> = {
    dashboard: 'Dashboard',
    projects: 'Projects',
    workflows: 'My Workflows',
    templates: 'Templates',
    integrations: 'Connected Apps',
    profile: 'Profile',
    admin: 'Admin',
    settings: 'Settings',
    builder: 'Builder',
    execution: 'Execution',
    'workflow-demo': 'Create Workflow',
    'advanced-workflows': 'Advanced Workflows',
    'my-apps': 'My Apps',
    analytics: 'Analytics',
    help: 'Help',
  }

  const breadcrumbs: BreadcrumbItem[] = []
  let currentPath = ''

  for (let i = 0; i < pathSegments.length; i++) {
    const segment = pathSegments[i]
    currentPath += `/${segment}`

    // Check if this segment is a dynamic ID (UUID or numeric)
    const isId = /^[0-9a-f-]{36}$|^\d+$/.test(segment)

    if (isId) {
      // For IDs, we'll just show a shortened version or skip
      breadcrumbs.push({
        label: `#${segment.substring(0, 8)}...`,
        href: i < pathSegments.length - 1 ? currentPath : undefined,
      })
    } else {
      const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
      breadcrumbs.push({
        label,
        href: i < pathSegments.length - 1 ? currentPath : undefined,
      })
    }
  }

  return breadcrumbs
}

export function Breadcrumb({ items, className = '', showBackButton = false, compact = false }: BreadcrumbProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { isRTL } = useRTL()
  const breadcrumbs = items || generateBreadcrumbs(location.pathname)

  if (breadcrumbs.length <= 1) {
    return null // Don't show breadcrumb for root-level pages
  }

  const handleBack = () => {
    navigate(-1)
  }

  // In compact mode (mobile), show only back button and current page
  if (compact) {
    const currentPage = breadcrumbs[breadcrumbs.length - 1]
    const parentPage = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2] : null

    return (
      <nav
        className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''} ${className}`}
        aria-label="Breadcrumb"
      >
        {/* Back button with parent page name */}
        {parentPage && (
          <button
            onClick={handleBack}
            className={`
              flex items-center gap-1.5 px-2 py-1.5 rounded-lg
              text-slate-400 hover:text-white hover:bg-slate-800
              active:bg-slate-700 active:scale-95
              transition-all touch-manipulation min-h-[36px]
              ${isRTL ? 'flex-row-reverse' : ''}
            `}
            aria-label={`Back to ${parentPage.label}`}
          >
            <svg className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm max-w-[100px] truncate">{parentPage.label}</span>
          </button>
        )}

        {/* Current page indicator */}
        <span className="text-sm font-medium text-white truncate max-w-[150px]">
          {currentPage.label}
        </span>
      </nav>
    )
  }

  // Full breadcrumb (desktop)
  return (
    <nav
      className={`flex items-center text-sm gap-1 ${isRTL ? 'flex-row-reverse' : ''} ${className}`}
      aria-label="Breadcrumb"
    >
      {/* Optional back button */}
      {showBackButton && (
        <button
          onClick={handleBack}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all mr-2 ${isRTL ? 'rotate-180' : ''}`}
          aria-label={t('common.back')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Home icon link */}
      <Link
        to="/dashboard"
        className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
        aria-label="Go to Dashboard"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </Link>

      {/* Desktop: Show all breadcrumbs, Mobile: Show abbreviated */}
      <div className="hidden sm:contents">
        {breadcrumbs.map((item, index) => (
          <div key={index} className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Separator chevron */}
            <svg
              className={`w-4 h-4 text-slate-600 mx-1 ${isRTL ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>

            {item.href ? (
              <Link
                to={item.href}
                className="px-1.5 py-0.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 rounded transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="px-1.5 py-0.5 text-white font-medium bg-cyan-500/10 rounded">
                {item.label}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Mobile: Show only ellipsis and current page */}
      <div className="sm:hidden flex items-center">
        {breadcrumbs.length > 1 && (
          <>
            <svg className="w-4 h-4 text-slate-600 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-slate-500 mx-1">...</span>
          </>
        )}
        <svg className="w-4 h-4 text-slate-600 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="px-1.5 py-0.5 text-white font-medium bg-cyan-500/10 rounded truncate max-w-[120px]">
          {breadcrumbs[breadcrumbs.length - 1].label}
        </span>
      </div>
    </nav>
  )
}

// Page header component with breadcrumb
interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbItems?: BreadcrumbItem[]
  actions?: React.ReactNode
}

export function PageHeader({ title, description, breadcrumbItems, actions }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <Breadcrumb items={breadcrumbItems} className="mb-3" />
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {description && (
            <p className="text-slate-400 mt-1">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
