/**
 * Feature flags for Nexus
 * Autopilot is disabled by default - enable via VITE_AUTOPILOT_ENABLED=true
 */
export const FEATURE_FLAGS = {
  /** Enable Autopilot browser automation panel in AI Consultancy */
  AUTOPILOT_ENABLED: import.meta.env.VITE_AUTOPILOT_ENABLED === 'true' ||
    import.meta.env.DEV, // Auto-enable in dev mode for testing
  /** Enable browser-mode Autopilot (vs API-only) */
  AUTOPILOT_BROWSER_MODE: import.meta.env.VITE_AUTOPILOT_BROWSER !== 'false', // Default true
} as const
