---
name: audit-oauth
description: Audit OAuth flows and integration connections. Use when verifying OAuth implementation or debugging connection issues.
tools: Read, Grep, Glob
allowed-tools: Read, Grep, Glob
---

# OAuth Flow Audit Skill

Comprehensive audit of OAuth implementation in Nexus.

## Instructions

When invoked (with optional $ARGUMENTS for specific integration):

### Step 1: Inventory OAuth Integrations

Search for all OAuth-related code:
```
Grep pattern: "initiateConnection|checkConnection|OAuth|authUrl|redirect_url"
Files: nexus/src/**/*.{ts,tsx}, nexus/server/**/*.ts
```

### Step 2: Check RubeClient Implementation

Read and analyze:
- `nexus/src/services/RubeClient.ts` - OAuth initiation
- `nexus/src/components/chat/WorkflowPreviewCard.tsx` - OAuth UI flow

Verify:
- [ ] Popup opened BEFORE async calls (popup blocker bypass)
- [ ] Polling interval is reasonable (3-5 seconds)
- [ ] Timeout handling exists
- [ ] Error states are handled

### Step 3: Check Fix Registry for OAuth Fixes

Read `nexus/FIX_REGISTRY.json` and list all OAuth-related fixes:
- FIX-001: Popup blocker bypass
- FIX-002: Expired connection detection
- Any others with "OAuth" in description

### Step 4: Verify Protected Code Markers

Search for OAuth fix markers:
```
Grep pattern: "@NEXUS-FIX-001|@NEXUS-FIX-002"
```

Ensure these markers still exist in the code.

### Step 5: Check Integration List

Identify all supported integrations:
```
Grep pattern: "toolkit.*=|integration.*:"
File: WorkflowPreviewCard.tsx
```

### Step 6: Report

Output structured audit report:
```
## OAuth Audit Report

**Date:** [timestamp]
**Scope:** [all integrations or specific one]

### Integrations Found
| Integration | Has OAuth | Toolkit Name |
|-------------|-----------|--------------|
| Gmail | Yes | gmail |
| Slack | Yes | slack |
...

### OAuth Flow Checks
- [ ] Popup blocker bypass implemented (FIX-001)
- [ ] Polling with timeout exists
- [ ] Expired token detection (FIX-002)
- [ ] Error handling for failed auth
- [ ] UI feedback during OAuth

### Protected Code Status
| Fix | Marker Present | File |
|-----|----------------|------|
| FIX-001 | Yes/No | WorkflowPreviewCard.tsx |
| FIX-002 | Yes/No | WorkflowPreviewCard.tsx |

### Issues Found
[List any issues]

### Recommendations
[List improvements if any]
```

## Example Usage

```
/audit-oauth
/audit-oauth gmail
/audit-oauth slack
```
