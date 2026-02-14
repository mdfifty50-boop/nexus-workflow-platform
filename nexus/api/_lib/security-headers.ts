// Security Headers Module - OWASP Compliant
// Centralized security header configuration for all API endpoints

import type { VercelResponse } from '@vercel/node'

/**
 * Allowed origins for CORS - production and development
 * SECURITY: No wildcard (*) - explicit origin whitelist only
 */
const ALLOWED_ORIGINS = [
  // Production - @NEXUS-FIX-105: Use actual Vercel-assigned URL
  'https://nexus-theta-peach.vercel.app',
  // Custom domains (add your production domain here)
  process.env.ALLOWED_ORIGIN,
  // Development - only in non-production
  ...(process.env.NODE_ENV !== 'production'
    ? ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://127.0.0.1:5173']
    : [])
].filter(Boolean) as string[]

/**
 * Content Security Policy directives
 * OWASP: Prevents XSS, clickjacking, and data injection attacks
 */
const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"], // Required for some frameworks; tighten in production
  'style-src': ["'self'", "'unsafe-inline'"], // Required for inline styles
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'connect-src': ["'self'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com', 'https://api.anthropic.com', 'https://*.supabase.co', 'wss://*.supabase.co', 'https://api.composio.dev', 'https://app.composio.dev', 'https://*.composio.dev', 'https://prod.spline.design', 'https://*.spline.design'],
  'frame-ancestors': ["'none'"], // Prevents clickjacking
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'object-src': ["'none'"],
  'upgrade-insecure-requests': [],
}

/**
 * Build CSP header string from directives
 */
function buildCSPHeader(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, values]) => {
      if (values.length === 0) return directive
      return `${directive} ${values.join(' ')}`
    })
    .join('; ')
}

/**
 * Security headers based on OWASP guidelines
 * Reference: https://owasp.org/www-project-secure-headers/
 */
export interface SecurityHeadersConfig {
  enableHSTS?: boolean // HTTP Strict Transport Security
  enableCSP?: boolean  // Content Security Policy
  allowCredentials?: boolean
}

const DEFAULT_CONFIG: SecurityHeadersConfig = {
  enableHSTS: process.env.NODE_ENV === 'production',
  enableCSP: true,
  allowCredentials: true,
}

/**
 * Set comprehensive security headers on response
 *
 * @param res - Vercel response object
 * @param origin - Request origin header
 * @param config - Optional configuration overrides
 */
export function setSecurityHeaders(
  res: VercelResponse,
  origin: string | undefined,
  config: SecurityHeadersConfig = {}
): void {
  const cfg = { ...DEFAULT_CONFIG, ...config }

  // ===================
  // CORS Headers
  // ===================

  // Only allow specific origins - NO WILDCARDS
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]

  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  }

  if (cfg.allowCredentials) {
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  )
  res.setHeader('Access-Control-Max-Age', '86400') // Cache preflight for 24 hours

  // ===================
  // Security Headers (OWASP)
  // ===================

  // X-Content-Type-Options: Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff')

  // X-Frame-Options: Prevent clickjacking (legacy, CSP frame-ancestors is preferred)
  res.setHeader('X-Frame-Options', 'DENY')

  // X-XSS-Protection: Enable browser XSS filtering (legacy, but still useful)
  res.setHeader('X-XSS-Protection', '1; mode=block')

  // Referrer-Policy: Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions-Policy: Restrict browser features
  res.setHeader('Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  )

  // Cache-Control: Prevent caching of sensitive API responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')

  // ===================
  // HSTS (Production Only)
  // ===================
  if (cfg.enableHSTS) {
    // Strict-Transport-Security: Force HTTPS
    // max-age=31536000 = 1 year
    // includeSubDomains: Apply to all subdomains
    // preload: Allow inclusion in browser preload lists
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  // ===================
  // CSP (Content Security Policy)
  // ===================
  if (cfg.enableCSP) {
    res.setHeader('Content-Security-Policy', buildCSPHeader())
  }
}

/**
 * Handle OPTIONS preflight request
 * Returns true if request was an OPTIONS request (and response was sent)
 */
export function handlePreflight(res: VercelResponse, method: string | undefined): boolean {
  if (method === 'OPTIONS') {
    res.status(204).end()
    return true
  }
  return false
}

/**
 * Convenience wrapper for API handlers
 * Sets security headers and handles OPTIONS preflight
 *
 * @example
 * ```ts
 * export default async function handler(req, res) {
 *   if (withSecurityHeaders(req, res)) return; // Returns true for OPTIONS
 *
 *   // Your handler logic here
 * }
 * ```
 */
export function withSecurityHeaders(
  req: { method?: string; headers: { origin?: string } },
  res: VercelResponse,
  config?: SecurityHeadersConfig
): boolean {
  const origin = req.headers.origin
  setSecurityHeaders(res, origin, config)
  return handlePreflight(res, req.method)
}

/**
 * Get the list of allowed origins (for documentation/debugging)
 */
export function getAllowedOrigins(): string[] {
  return [...ALLOWED_ORIGINS]
}
