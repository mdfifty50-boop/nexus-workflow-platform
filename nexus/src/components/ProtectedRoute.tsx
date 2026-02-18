import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

// @NEXUS-FIX-160: App-shell skeleton shown during auth loading so Clerk CDN
// failures (which trigger a 2s fallback) don't show a jarring blank screen.
// The skeleton mimics the sidebar + main area layout so the transition is seamless.
function AppShellSkeleton() {
  return (
    <div className="flex min-h-screen bg-background" aria-hidden="true">
      {/* Sidebar skeleton */}
      <div className="hidden md:flex flex-col w-64 border-r border-border bg-card/50 p-4 gap-3 shrink-0">
        {/* Logo area */}
        <div className="h-8 w-32 rounded-md bg-muted animate-pulse mb-4" />
        {/* Nav items */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-9 w-full rounded-md bg-muted animate-pulse" style={{ opacity: 1 - i * 0.1 }} />
        ))}
        {/* Spacer */}
        <div className="flex-1" />
        {/* User avatar area */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse shrink-0" />
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        </div>
      </div>
      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="h-14 border-b border-border bg-card/50 flex items-center px-6 gap-4">
          <div className="h-6 w-48 rounded bg-muted animate-pulse" />
          <div className="flex-1" />
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        </div>
        {/* Content area */}
        <div className="flex-1 p-6 grid gap-4">
          <div className="h-32 rounded-xl bg-muted/60 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-muted/60 animate-pulse" />
            ))}
          </div>
          <div className="h-48 rounded-xl bg-muted/60 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

// @NEXUS-FIX-151: Mandatory onboarding gate — redirect to /onboarding if no business profile
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isSignedIn, isLoaded, profileLoading } = useAuth()
  const location = useLocation()

  if (!isLoaded || profileLoading) {
    // @NEXUS-FIX-160: Show app-shell skeleton instead of blank spinner so the
    // 2s Clerk CDN fallback window is visually seamless for the user.
    return <AppShellSkeleton />
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />
  }

  // @NEXUS-FIX-151: Check if user has completed onboarding
  const isOnboardingPage = location.pathname.startsWith('/onboarding')
  if (!isOnboardingPage) {
    const hasBusinessProfile = localStorage.getItem('nexus_business_profile')
    const hasOnboarded = localStorage.getItem('nexus_onboarding_wizard_completed') ||
                         localStorage.getItem('nexus_onboarding_completed')
    if (!hasBusinessProfile && !hasOnboarded) {
      return <Navigate to="/onboarding" replace />
    }
  }

  return <>{children}</>
}
