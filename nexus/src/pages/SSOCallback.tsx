/**
 * SSO Callback Page
 *
 * Handles OAuth/SSO redirect callbacks from Clerk.
 * This page is required for social login (Google, Apple, Facebook, etc.) to work properly.
 *
 * When using social login, Clerk redirects to this page after the OAuth provider
 * authenticates the user. The AuthenticateWithRedirectCallback component completes
 * the authentication flow and redirects to the final destination.
 */

import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react'

export function SSOCallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <span className="text-2xl font-bold text-white">N</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold gradient-text mb-2">Nexus</h1>
        <p className="text-muted-foreground mb-4">Completing sign in...</p>
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>

        {/* This component handles the OAuth callback and completes authentication */}
        <AuthenticateWithRedirectCallback />
      </div>
    </div>
  )
}
