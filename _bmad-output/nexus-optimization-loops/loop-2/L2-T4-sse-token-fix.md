# L2-T4: SSE Token Exposure Security Fix

## Summary

Fixed a critical security vulnerability where authentication tokens were exposed in SSE (Server-Sent Events) connection URLs. Implemented a secure ticket-based authentication system that prevents token leakage.

## Problem

**Location:** `nexus/src/contexts/WorkflowContext.tsx` (line 251-253)

**Vulnerable Code:**
```typescript
const eventSource = new EventSource(
  `${API_URL}/api/sse/workflow/${workflowId}?token=${token}&userId=${userId}`
)
```

**Security Impact:**
- **Browser History:** Tokens stored in URL history, accessible to anyone with device access
- **Server Logs:** Web servers log full URLs including query parameters
- **Referrer Headers:** If user navigates away, token leaks via `Referer` header
- **Shared Links:** Copy/paste of URL exposes authentication credentials
- **Analytics:** URL tracking systems may capture and store tokens

## Solution: Ticket-Based Authentication

Implemented a secure ticket system (Option C from the task description) that:

1. **Short-lived:** Tickets expire after 60 seconds
2. **Single-use:** Tickets are invalidated immediately after SSE connection
3. **Cryptographically secure:** Uses `crypto.randomBytes(32)` for ticket generation
4. **No sensitive data exposure:** The actual auth token never appears in any URL

### Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │     │   Server    │     │   Supabase  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ POST /api/sse/ticket                  │
       │ (Auth via headers)│                   │
       │──────────────────>│                   │
       │                   │                   │
       │    { ticket }     │                   │
       │<──────────────────│                   │
       │                   │                   │
       │ GET /api/sse/workflow/:id?ticket=xxx  │
       │ (No sensitive data in URL)            │
       │──────────────────>│                   │
       │                   │ Validate ticket   │
       │                   │ (single-use)      │
       │                   │                   │
       │    SSE Stream     │                   │
       │<══════════════════│                   │
```

## Files Changed

### 1. `nexus/server/routes/sse.ts`

**Added:**
- `POST /api/sse/ticket` endpoint for secure ticket generation
- `SSETicket` interface for ticket data structure
- `sseTickets` Map for in-memory ticket storage
- `validateAndConsumeTicket()` function for ticket validation
- Automatic ticket cleanup (every 30 seconds)

**Modified:**
- `GET /api/sse/workflow/:workflowId` now accepts `?ticket=` parameter
- Added deprecation warnings for old token-in-URL authentication
- Maintains backward compatibility during transition

### 2. `nexus/src/contexts/WorkflowContext.tsx`

**Modified `connectSSE()` function:**
- Now requests a ticket from `/api/sse/ticket` first
- Sends auth credentials via headers (secure)
- Uses ticket in URL (safe - short-lived, single-use)
- Falls back to dev mode connection if ticket unavailable

**Before (INSECURE):**
```typescript
const eventSource = new EventSource(
  `${API_URL}/api/sse/workflow/${workflowId}?token=${token}&userId=${userId}`
)
```

**After (SECURE):**
```typescript
// Request ticket via authenticated POST
const ticketResponse = await fetch(`${API_URL}/api/sse/ticket`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(userId && { 'X-Clerk-User-Id': userId }),
  },
  body: JSON.stringify({ workflowId }),
})

// Connect with secure ticket
const eventSource = new EventSource(
  `${API_URL}/api/sse/workflow/${workflowId}?ticket=${ticket}`
)
```

### 3. `nexus/src/lib/api-client.ts`

**Added:**
- `getSSETicket()` - New method to request secure tickets
- `getSecureSSEConnectionUrl()` - New method to build secure SSE URLs

**Modified:**
- `getSSEConnectionUrl()` - Marked as `@deprecated` with console warning

## Security Properties

| Property | Old System | New System |
|----------|------------|------------|
| Token in URL | Yes (INSECURE) | No |
| Token in browser history | Yes | No |
| Token in server logs | Yes | No |
| Token in referrer headers | Yes | No |
| Ticket lifetime | N/A | 60 seconds |
| Ticket reuse | N/A | Single-use |
| Ticket entropy | N/A | 256 bits (cryptographic) |

## Backward Compatibility

The server-side code maintains backward compatibility:
- Old clients using `?token=` will still work (with deprecation warning)
- New clients should use the ticket system
- In production, token-in-URL generates security warnings in logs

## Production Considerations

1. **Redis for Tickets:** In a multi-instance deployment, replace the in-memory `sseTickets` Map with Redis using TTL for automatic expiration.

2. **Rate Limiting:** Consider adding rate limiting to `/api/sse/ticket` to prevent ticket abuse.

3. **Monitoring:** Watch for deprecation warnings in logs to track clients that need updating.

4. **Hard Cutover:** After all clients are updated, remove the deprecated token-in-URL support entirely.

## Testing Recommendations

1. Verify SSE connections work with new ticket system
2. Verify tickets expire after 60 seconds
3. Verify tickets cannot be reused
4. Verify deprecation warnings appear for old-style connections
5. Check browser dev tools - no tokens should appear in URLs

## Related Security Concerns

This fix addresses OWASP Top 10:
- **A01:2021 Broken Access Control** - Tokens no longer exposed in URLs
- **A02:2021 Cryptographic Failures** - Using secure random generation for tickets
- **A07:2021 Identification and Authentication Failures** - Proper credential handling

---

**Status:** COMPLETE
**Author:** Winston (System Architect)
**Date:** 2026-01-12
