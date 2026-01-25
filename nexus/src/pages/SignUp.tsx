import { SignUp as ClerkSignUp } from '@clerk/clerk-react'

export function SignUp() {
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

        <ClerkSignUp
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
          path="/sign-up"
          signInUrl="/login"
          fallbackRedirectUrl="/dashboard"
        />
      </div>
    </div>
  )
}
