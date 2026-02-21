import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

const CEO_EMAIL = 'nexus.agii@gmail.com'

export function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { userProfile, isSignedIn, profileLoading, isLoaded } = useAuth()

  if (!isLoaded || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/dashboard" replace />
  }

  const isAdmin =
    userProfile?.role === 'admin' ||
    userProfile?.email === CEO_EMAIL

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
