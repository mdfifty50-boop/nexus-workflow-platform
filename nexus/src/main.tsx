import { StrictMode } from 'react'
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
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Check if we have a valid Clerk key
// TEMPORARY: Force dev mode for testing (bypass auth)
const BYPASS_AUTH = true // Set to false when auth is fixed
const hasClerkKey = !BYPASS_AUTH && !!CLERK_PUBLISHABLE_KEY && CLERK_PUBLISHABLE_KEY !== 'pk_test_your_clerk_publishable_key'

if (!hasClerkKey) {
  console.warn('⚠️ DEVELOPMENT MODE: Running without Clerk authentication')
  console.warn('   Add VITE_CLERK_PUBLISHABLE_KEY to .env for full authentication')
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      {hasClerkKey ? (
        <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
          <App />
        </ClerkProvider>
      ) : (
        <DevApp />
      )}
    </HelmetProvider>
  </StrictMode>,
)
