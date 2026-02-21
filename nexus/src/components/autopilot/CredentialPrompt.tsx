/**
 * CredentialPrompt - Overlay displayed when Autopilot needs the user to
 * enter credentials in the browser panel.
 *
 * Shows the service name, security assurance, and instructions appropriate
 * for either an existing-account login or a new-account sign-up flow.
 * Features a subtle animated amber border to draw attention.
 */

import { useEffect, useState } from 'react'

interface CredentialPromptProps {
  service: string
  serviceName: string
  onResume: () => void
  onCancel: () => void
  isNewAccount?: boolean
}

/** Map common service slugs to a display-friendly emoji/icon. */
function serviceIcon(service: string): string {
  const icons: Record<string, string> = {
    gmail: '📧',
    slack: '💬',
    googlesheets: '📊',
    googledrive: '📁',
    dropbox: '📦',
    github: '🐙',
    notion: '📝',
    discord: '🎮',
    trello: '📋',
    asana: '✅',
    linear: '🔵',
    hubspot: '🟠',
    stripe: '💳',
    zoom: '📹',
    twitter: '🐦',
    linkedin: '💼',
  }
  return icons[service.toLowerCase()] || '🔗'
}

export function CredentialPrompt({
  service,
  serviceName,
  onResume,
  onCancel,
  isNewAccount = false,
}: CredentialPromptProps) {
  // Animate the glow border
  const [glowPhase, setGlowPhase] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setGlowPhase((p) => (p + 1) % 360)
    }, 30)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-surface-950/70 backdrop-blur-sm">
      {/* Card with animated amber border */}
      <div
        className="relative w-full max-w-md mx-4 rounded-2xl overflow-hidden"
        style={{
          padding: '2px',
          background: `conic-gradient(from ${glowPhase}deg, rgba(245,158,11,0.6), rgba(245,158,11,0.1), rgba(245,158,11,0.6))`,
        }}
      >
        <div className="bg-surface-900 rounded-2xl p-6 space-y-5">
          {/* Service header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-surface-800 border border-surface-700 flex items-center justify-center text-2xl">
              {serviceIcon(service)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{serviceName}</h3>
              <p className="text-xs text-surface-400">
                {isNewAccount ? 'New account setup' : 'Login required'}
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-3">
            {isNewAccount ? (
              <>
                <p className="text-sm text-surface-300 leading-relaxed">
                  Let's create your <span className="text-white font-medium">{serviceName}</span> account.
                  Enter your details in the browser panel on the right.
                </p>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                  <svg
                    className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                  <p className="text-xs text-cyan-300/80">
                    Autopilot will guide the browser through the sign-up flow.
                    You just need to fill in your personal details.
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-surface-300 leading-relaxed">
                  Please log in to <span className="text-white font-medium">{serviceName}</span> in the
                  browser panel, then click <span className="text-amber-400 font-medium">Resume</span> below.
                </p>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                  <svg
                    className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                  <p className="text-xs text-cyan-300/80">
                    If you have two-factor authentication enabled, complete it in the browser panel.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Security badge */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
            <svg
              className="w-4 h-4 text-emerald-400 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <p className="text-xs text-emerald-300/80">
              Your credentials are private &mdash; Nexus cannot see what you type
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={onResume}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 hover:text-amber-300 border border-amber-500/20 hover:border-amber-500/40 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6,4 20,12 6,20" />
              </svg>
              {isNewAccount ? "Resume - I've signed up" : "Resume - I've logged in"}
            </button>
            <button
              onClick={onCancel}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-surface-800 hover:bg-surface-700 text-surface-400 hover:text-surface-300 border border-surface-700 hover:border-surface-600 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CredentialPrompt
