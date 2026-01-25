# OAuth Security Rules (MANDATORY)

## Popup Blocker Bypass (FIX-001 Pattern)

**CRITICAL:** OAuth popups MUST open BEFORE any async calls.

### Correct Pattern
```typescript
// 1. Open popup IMMEDIATELY (sync)
const popup = window.open('about:blank', 'oauth', 'width=600,height=700')

// 2. Then make async call
const { redirect_url } = await initiateOAuth(toolkit)

// 3. Navigate popup to OAuth URL
popup.location.href = redirect_url
```

### Wrong Pattern (NEVER DO THIS)
```typescript
// BAD: Popup opens after await - WILL BE BLOCKED
const { redirect_url } = await initiateOAuth(toolkit)
window.open(redirect_url) // BLOCKED!
```

## Polling for Connection Status

### Standard Polling Pattern
```typescript
const pollInterval = 3000 // 3 seconds
const maxWait = 60000 // 60 seconds timeout

const checkConnection = async () => {
  const start = Date.now()

  while (Date.now() - start < maxWait) {
    const status = await getConnectionStatus(toolkit)

    if (status === 'ACTIVE') {
      return true // Success
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval))
  }

  return false // Timeout
}
```

### Polling Requirements
- Interval: 3-5 seconds (not too fast, not too slow)
- Timeout: 60 seconds (user may take time to auth)
- Clear timeout handling
- User feedback during wait

## Token Management

### Never Store Tokens Client-Side
- Tokens managed by Composio/Rube backend
- Frontend only stores connection status
- No localStorage for OAuth tokens

### Token Refresh
- Handled automatically by Composio
- Frontend should handle 401 errors gracefully
- Re-initiate OAuth if token expired (FIX-002)

## Parallel OAuth Connections

When multiple integrations need connection:

```typescript
// 1. Initiate all connections at once (FIX-002 pattern)
const connections = await Promise.all(
  missingIntegrations.map(toolkit => initiateConnection(toolkit))
)

// 2. Open popups in sequence (user experience)
for (const conn of connections) {
  // Wait for user to complete each
  await waitForConnection(conn.toolkit)
}
```

## Security Checklist

Before implementing OAuth flows:

- [ ] Popup opens before await (FIX-001)
- [ ] Polling has timeout (60s max)
- [ ] Expired token detection exists (FIX-002)
- [ ] No tokens stored in localStorage
- [ ] Error messages are user-friendly
- [ ] Failed auth can be retried

## Error Handling

### Connection Failed
```typescript
{
  type: 'error',
  message: 'Unable to connect to Gmail. Please try again.',
  action: 'retry' // or 'contact_support'
}
```

### Token Expired
```typescript
{
  type: 'expired',
  message: 'Your connection to Gmail needs to be refreshed.',
  action: 'reconnect'
}
```

### User Cancelled
```typescript
{
  type: 'cancelled',
  message: 'Connection cancelled. Click "Connect" when ready.',
  action: 'none'
}
```

## Protected Code Markers

These OAuth-related fixes are CRITICAL - never remove:

| Marker | Description | File |
|--------|-------------|------|
| @NEXUS-FIX-001 | Popup blocker bypass | WorkflowPreviewCard.tsx |
| @NEXUS-FIX-002 | Expired connection detection | WorkflowPreviewCard.tsx |
| @NEXUS-FIX-003 | Parallel OAuth | WorkflowPreviewCard.tsx |

## Testing OAuth Changes

After any OAuth-related change:

1. Run `/validate` to check markers
2. Test popup opens immediately
3. Test timeout handling (wait 70+ seconds)
4. Test expired token scenario
5. Test parallel connections
6. Verify no console errors
