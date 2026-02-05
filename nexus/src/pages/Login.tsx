import { SignIn, useAuth } from '@clerk/clerk-react'

export function Login() {
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
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>

        {/* Show loading spinner while Clerk initializes */}
        {!isLoaded && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-muted-foreground text-sm">Loading sign in...</p>
          </div>
        )}

        {/* Only render SignIn when Clerk is loaded */}
        {isLoaded && (
          <SignIn
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'glass rounded-xl border-2 border-border shadow-2xl',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'bg-background hover:bg-muted border-2 border-border',
                formButtonPrimary: 'bg-gradient-to-r from-primary to-secondary hover:opacity-90',
                footerActionLink: 'text-primary hover:text-primary/80',
              },
            }}
            routing="path"
            path="/login"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/dashboard"
          />
        )}
      </div>
    </div>
  )
}
