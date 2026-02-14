import { StrictMode, useState, useEffect, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
// Initialize i18n before app loads
import '@/i18n'
import App from './App.tsx'
import DevApp from './DevApp.tsx'
import { initBrowserCompat, getBrowserWarning } from './lib/browserCompat'

// Initialize browser compatibility (applies CSS classes, loads polyfills)
initBrowserCompat().then(({ browser, features }) => {
  if (import.meta.env.DEV) {
    console.log('[Nexus] Browser compatibility initialized:', browser.name, browser.version)
    console.log('[Nexus] Feature support:', Object.entries(features).filter(([, v]) => !v).map(([k]) => k))
  }

  // Show warning for unsupported browsers
  const warning = getBrowserWarning()
  if (warning) {
    console.warn('[Nexus] Browser warning:', warning)
  }
}).catch((error) => {
  console.error('[Nexus] Browser compatibility initialization failed:', error)
})

// Import Clerk publishable key from environment
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim()

// Check if we have a valid Clerk key
// Both pk_test_ and pk_live_ keys work from any domain — test mode is not domain-restricted
const isPlaceholder = !CLERK_PUBLISHABLE_KEY || CLERK_PUBLISHABLE_KEY === 'pk_test_your_clerk_publishable_key'
const hasClerkKey = !isPlaceholder && (
  CLERK_PUBLISHABLE_KEY.startsWith('pk_test_') || CLERK_PUBLISHABLE_KEY.startsWith('pk_live_')
)

if (!hasClerkKey) {
  console.info('[Auth] No valid Clerk key — running in dev mode')
}

// Register Service Worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      })

      console.log('[SW] Service Worker registered successfully:', registration.scope)

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              console.log('[SW] New version available! Refresh to update.')
              // Optionally dispatch event for UI notification
              window.dispatchEvent(new CustomEvent('nexus:sw-update-available'))
            }
          })
        }
      })

      // Handle controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] New service worker activated')
      })
    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error)
    }
  })
}

// Wrapper that detects Clerk CDN load failure and falls back to DevApp
function ClerkWithFallback({ publishableKey }: { publishableKey: string }) {
  const [clerkFailed, setClerkFailed] = useState(false)

  const handleClerkError = useCallback(() => {
    console.warn('[Auth] Clerk failed to load — falling back to dev mode')
    setClerkFailed(true)
  }, [])

  useEffect(() => {
    // Listen for Clerk script load failures (fires on net::ERR_FAILED)
    const handler = (e: ErrorEvent) => {
      if (e.message?.includes('clerk') || e.filename?.includes('clerk')) {
        handleClerkError()
      }
    }
    window.addEventListener('error', handler)

    // Timeout: if Clerk hasn't loaded after 10s, fall back
    const timeout = window.setTimeout(() => {
      const clerkLoaded = !!(window as unknown as Record<string, unknown>).Clerk
      if (!clerkLoaded) {
        handleClerkError()
      }
    }, 10000)

    return () => {
      window.removeEventListener('error', handler)
      window.clearTimeout(timeout)
    }
  }, [handleClerkError])

  if (clerkFailed) {
    return <DevApp />
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <App />
    </ClerkProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      {hasClerkKey ? (
        <ClerkWithFallback publishableKey={CLERK_PUBLISHABLE_KEY} />
      ) : (
        <DevApp />
      )}
    </HelmetProvider>
  </StrictMode>,
)
