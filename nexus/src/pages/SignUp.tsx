import { SignUp as ClerkSignUp, useAuth } from '@clerk/clerk-react'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export function SignUp() {
  const { isLoaded } = useAuth()

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-2xl font-bold text-white">N</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold gradient-text">Nexus</h1>
          <p className="text-muted-foreground mt-2">Create your account</p>
        </div>

        {/* Show loading spinner while Clerk initializes — isLoaded + LoadingSpinner */}
        {!isLoaded && (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner variant="gradient" size="md" label="Loading sign up..." center />
          </div>
        )}

        {/* Only render SignUp when Clerk is loaded */}
        {isLoaded && (
          <ClerkSignUp
            appearance={{
              layout: {
                socialButtonsVariant: 'blockButton',
              },
              elements: {
                rootBox: 'w-full',
                card: 'rounded-xl border-2 border-border shadow-2xl bg-white',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                formButtonPrimary: 'bg-gradient-to-r from-primary to-secondary hover:opacity-90',
                footerActionLink: 'text-primary hover:text-primary/80',
              },
            }}
            routing="path"
            path="/sign-up"
            signInUrl="/login"
            fallbackRedirectUrl="/dashboard"
            forceRedirectUrl="/dashboard"
          />
        )}
      </div>
    </div>
  )
}
