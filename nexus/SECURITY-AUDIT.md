# Security Audit Report

**Date:** January 12, 2026
**Auditors:** Victor, Murat (Security Team)
**Director:** BMad Master

---

## Executive Summary

This security audit covers five critical areas: dependency vulnerabilities, sensitive data handling, authentication flow, XSS prevention, and HTTPS/security headers. Overall, the Nexus application demonstrates strong security practices with a few areas requiring attention.

| Category | Status | Risk Level |
|----------|--------|------------|
| Dependency Vulnerabilities | Needs Attention | Medium |
| Sensitive Data Handling | CRITICAL ISSUE | High |
| Authentication Flow | Good | Low |
| XSS Prevention | Excellent | Low |
| HTTPS & Security Headers | Excellent | Low |

---

## 1. Dependency Audit

### npm audit Results

**Current Status:** 9 vulnerabilities (7 moderate, 2 high)

#### High Severity Issues

| Package | Vulnerability | Description |
|---------|--------------|-------------|
| `path-to-regexp` (4.0.0 - 6.2.2) | GHSA-9wv6-86v2-598j | Outputs backtracking regular expressions (ReDoS) |

#### Moderate Severity Issues

| Package | Vulnerability | Description |
|---------|--------------|-------------|
| `esbuild` (<=0.24.2) | GHSA-67mh-4wv8-2f99 | Dev server request spoofing (dev-only) |
| `undici` (<=5.28.5) | GHSA-c76h-2ccp-4975, GHSA-cxrh-j4jr-qwg3 | Insufficient randomness, DoS via bad certificates |

#### Affected Package Tree

```
esbuild
  -> vite (0.11.0 - 6.1.6)
    -> @vitest/mocker
    -> vite-node
    -> vitest
      -> @vitest/coverage-v8
  -> @vercel/node (>=2.3.1)
    -> path-to-regexp
    -> undici
```

### Resolution Plan

| Priority | Action | Breaking Change? | Timeline |
|----------|--------|------------------|----------|
| High | Update react-router to latest | No | Completed |
| Medium | Monitor Vite 7.x release | Yes | Q1 2026 |
| Low | esbuild vulnerability is dev-only | N/A | No action needed |
| Medium | Evaluate @vercel/node alternatives | Yes | Q2 2026 |

**Note:** Running `npm audit fix --force` would downgrade @vercel/node to 2.3.0 which may break Vercel serverless functions. Test thoroughly before upgrading.

---

## 2. Sensitive Data Check

### CRITICAL FINDING: Exposed API Keys in .env

**Location:** `nexus/.env`
**Severity:** CRITICAL
**Status:** Requires immediate attention

The `.env` file contains real API keys that appear to be production credentials:

| Service | Key Type | Status |
|---------|----------|--------|
| Anthropic | `sk-ant-api03-...` | EXPOSED |
| HeyGen | `sk_V2_hgu_...` | EXPOSED |
| Clerk Secret | `sk_test_...` | EXPOSED |
| Composio | `ak_Zcoy...` | EXPOSED |
| Google OAuth | Client ID + Secret | EXPOSED |
| Zapier | API Key + MCP URL | EXPOSED |

### Mitigations Already in Place

1. `.env` is in `.gitignore` - Will not be committed to git
2. Git status shows `.env` is NOT tracked

### Recommendations

1. **Immediate:** Rotate all exposed API keys
2. **Best Practice:** Use `.env.local` for local development (also gitignored)
3. **Production:** Store secrets in Vercel environment variables (already configured)
4. **Documentation:** `.env.example` correctly shows placeholder values only

### Codebase Secrets Scan

**Result:** PASS

No hardcoded secrets found in source code. All sensitive values properly use environment variables:

```typescript
// Good pattern found throughout codebase:
const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
const API_BASE = import.meta.env.VITE_API_URL || ''
```

**Note:** `VITE_` prefixed variables are intentionally public (publishable keys only):
- `VITE_CLERK_PUBLISHABLE_KEY` - Safe to expose
- `VITE_SUPABASE_URL` - Safe to expose
- `VITE_SUPABASE_ANON_KEY` - Safe to expose (RLS protected)

Server-side secrets correctly use non-VITE prefix:
- `ANTHROPIC_API_KEY` - Not exposed to browser
- `CLERK_SECRET_KEY` - Not exposed to browser
- `STRIPE_SECRET_KEY` - Not exposed to browser

---

## 3. Authentication Flow Review

### Architecture

**Provider:** Clerk (OAuth-based)
**Backend Sync:** Supabase user_profiles table

### Token Storage

**Result:** EXCELLENT

- Clerk manages token storage internally (secure httpOnly cookies)
- No manual localStorage/sessionStorage token storage found
- No `localStorage.setItem('token')` patterns detected

### Session Handling

**Files Reviewed:**
- `src/contexts/AuthContext.tsx`
- `src/contexts/DevAuthContext.tsx`
- `src/components/SessionTimeoutWarning.tsx`

**Findings:**

1. **Session Timeout:** Properly implemented with 30-minute default
2. **Activity Tracking:** Monitors mousedown, keydown, touchstart, scroll events
3. **Warning System:** 5-minute warning before timeout
4. **Extension Option:** Users can extend session via "Stay Logged In"

### Logout Implementation

**Result:** GOOD

```typescript
const signOut = async () => {
  // Clear chatbot localStorage to prevent conversations persisting across sessions
  const chatbotKeys = [
    'nexus_chatbot_open',
    'nexus_chatbot_messages',
    'nexus_chatbot_state',
    // ... etc
  ]
  chatbotKeys.forEach(key => localStorage.removeItem(key))

  await clerkSignOut()
  setUserProfile(null)
}
```

**Assessment:**
- Properly clears user-specific localStorage data on logout
- Delegates token cleanup to Clerk (handled automatically)
- Clears user profile state

### Security Recommendations

1. Consider adding CSRF protection for sensitive form submissions
2. Implement rate limiting on authentication endpoints
3. Add brute-force protection for login attempts (Clerk may handle this)

---

## 4. XSS Prevention Audit

### dangerouslySetInnerHTML Usage

**Files Found:** 1 instance

**Location:** `src/components/SmartAIChatbot.tsx:1137`

```typescript
// SECURITY: All HTML content is sanitized via DOMPurify before rendering
const sanitizeHTML = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['strong', 'em', 'b', 'i', 'span', 'br'],
    ALLOWED_ATTR: ['class'],
    KEEP_CONTENT: true,
    ALLOW_DATA_ATTR: false,
  })
}

// Usage:
const sanitized = sanitizeHTML(boldFormatted)
return (
  <p dangerouslySetInnerHTML={{ __html: sanitized }} />
)
```

**Result:** EXCELLENT - Properly sanitized with DOMPurify

### DOMPurify Configuration Review

| Setting | Value | Assessment |
|---------|-------|------------|
| ALLOWED_TAGS | `['strong', 'em', 'b', 'i', 'span', 'br']` | Minimal, safe |
| ALLOWED_ATTR | `['class']` | No event handlers, safe |
| ALLOW_DATA_ATTR | `false` | Prevents data-* injection |
| KEEP_CONTENT | `true` | Strips tags but keeps text |

### Comprehensive Sanitization Library

**Location:** `src/lib/sanitize.ts`

The codebase includes a comprehensive sanitization library with:

- `stripHtml()` - Removes HTML tags
- `escapeHtml()` - Escapes special characters
- `sanitizeString()` - General string sanitization
- `sanitizeEmail()` - Email validation
- `sanitizeUrl()` - URL validation (blocks javascript:, vbscript:)
- `sanitizeFilename()` - Path traversal prevention
- `sanitizeSearchQuery()` - SQL injection defense-in-depth
- `sanitizeId()` - Alphanumeric ID validation
- `sanitizeFormData()` - Form field sanitization

### eval() and new Function() Check

**Result:** SECURE

No direct `eval()` or `new Function()` calls found in source code.

A safe expression evaluator (`src/lib/safe-expression-evaluator.ts`) exists with:
- Whitelist-based token parsing
- Blocked dangerous identifiers (eval, Function, constructor, prototype, __proto__, etc.)
- Blocked dangerous patterns (template literals, import, require)
- Whitelisted methods only (length, includes, startsWith, etc.)

---

## 5. HTTPS & Security Headers

### Production Configuration (vercel.json)

**Result:** EXCELLENT

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {"key": "X-Content-Type-Options", "value": "nosniff"},
        {"key": "X-Frame-Options", "value": "DENY"},
        {"key": "X-XSS-Protection", "value": "1; mode=block"},
        {"key": "Referrer-Policy", "value": "strict-origin-when-cross-origin"},
        {"key": "Permissions-Policy", "value": "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"},
        {"key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains; preload"},
        {"key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.anthropic.com https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests"}
      ]
    }
  ]
}
```

### Header Analysis

| Header | Value | Purpose | Assessment |
|--------|-------|---------|------------|
| HSTS | `max-age=31536000; includeSubDomains; preload` | Force HTTPS | Excellent (1 year, preload ready) |
| X-Frame-Options | `DENY` | Clickjacking prevention | Excellent |
| X-Content-Type-Options | `nosniff` | MIME sniffing prevention | Correct |
| X-XSS-Protection | `1; mode=block` | Legacy XSS filter | Included for older browsers |
| Referrer-Policy | `strict-origin-when-cross-origin` | Privacy | Good balance |
| Permissions-Policy | Restrictive | Blocks unnecessary APIs | Excellent |
| CSP | Comprehensive | XSS/injection prevention | Good (see note) |

### CSP Analysis

**Strengths:**
- `default-src 'self'` - Restrictive base
- `frame-ancestors 'none'` - Clickjacking prevention
- `object-src 'none'` - Blocks plugins
- `upgrade-insecure-requests` - HTTP -> HTTPS

**Considerations:**
- `'unsafe-inline'` in script-src/style-src required for Vite/React
- `'unsafe-eval'` needed for some dependencies (consider SRI in future)

### Development Server (vite.config.ts)

**Result:** GOOD

Same security headers applied to dev server with proper CORS configuration:
- Explicit origins only (no wildcards)
- Credentials enabled
- Specific methods allowed

---

## Action Items

### Critical (Immediate)

- [ ] Rotate all API keys exposed in `.env` file
  - Anthropic API key
  - HeyGen API key
  - Clerk secret key
  - Composio API key
  - Google OAuth credentials
  - Zapier credentials

### High Priority (This Sprint)

- [ ] Monitor react-router security updates
- [ ] Document API key rotation procedure

### Medium Priority (Next Sprint)

- [ ] Evaluate Vite 7.x when stable
- [ ] Test @vercel/node alternatives for path-to-regexp fix
- [ ] Add rate limiting documentation
- [ ] Consider implementing SRI for third-party scripts

### Low Priority (Backlog)

- [ ] Remove `'unsafe-eval'` from CSP when possible
- [ ] Add security-focused integration tests
- [ ] Implement security headers for API routes

---

## Conclusion

The Nexus application demonstrates strong security practices overall:

1. **XSS Prevention:** Excellent - DOMPurify properly configured, comprehensive sanitization library
2. **Authentication:** Good - Clerk handles token management, proper session timeout
3. **Security Headers:** Excellent - All major headers configured correctly for production
4. **Code Injection:** Excellent - Safe expression evaluator replaces dangerous eval patterns

The main concern is the exposure of production API keys in the local `.env` file. While this file is gitignored and not committed, the keys should be rotated as a precaution.

**Overall Security Rating:** B+ (would be A with key rotation)
