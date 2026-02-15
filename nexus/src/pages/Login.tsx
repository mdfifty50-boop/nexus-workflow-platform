import { SignIn, useAuth } from '@clerk/clerk-react'
import { useTranslation } from 'react-i18next'

export function Login() {
  const { t } = useTranslation()
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
          <h1 className="text-3xl font-bold gradient-text">{t('app.name')}</h1>
          <p className="text-muted-foreground mt-2">{t('auth.signInToContinue')}</p>
        </div>

        {/* Show loading spinner while Clerk initializes */}
        {!isLoaded && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
          </div>
        )}

        {/* Only render SignIn when Clerk is loaded */}
        {isLoaded && (
          <SignIn
            appearance={{
              layout: {
                socialButtonsVariant: 'blockButton',
              },
              elements: {
                rootBox: 'w-full',
                card: 'rounded-xl border-2 border-border shadow-2xl bg-white',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'border border-gray-300 hover:bg-gray-50 text-gray-700',
                socialButtonsProviderIcon: 'w-5 h-5',
                formButtonPrimary: 'bg-gradient-to-r from-primary to-secondary hover:opacity-90',
                footerActionLink: 'text-primary hover:text-primary/80',
              },
            }}
            routing="path"
            path="/login"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/dashboard"
            forceRedirectUrl="/dashboard"
          />
        )}
      </div>
    </div>
  )
}
