# L1-T5: Critical Bugs Report - Nexus Production Readiness

**Generated:** 2026-01-12
**Scan Scope:** `nexus/src/` - Full codebase analysis
**Authors:** Amelia (Senior Dev) + Barry (Quick Flow Solo Dev)

---

## CRITICAL BUGS (Block Launch)

### 1. Code Injection via `new Function()` - SECURITY VULNERABILITY

**File:** `nexus/src/lib/workflow-engine.ts`
**Lines:** 363, 377

```typescript
// Line 363 - executeCondition
const result = new Function('input', `return ${condition}`)(input)

// Line 377 - executeDataTransform
const result = new Function('input', transformCode)(input)
```

**Risk:** Remote code execution. User-provided workflow conditions/transforms are executed directly without sanitization.

**Impact:** Attacker can inject malicious JavaScript through workflow configuration. Full client-side compromise possible.

**Fix:**
- Use a sandboxed expression evaluator (e.g., `safe-eval`, `expr-eval`)
- Whitelist allowed operations
- Parse AST and validate before execution

---

### 2. XSS via `dangerouslySetInnerHTML`

**File:** `nexus/src/components/SmartAIChatbot.tsx`
**Line:** 1114

```typescript
dangerouslySetInnerHTML={{ __html: boldFormatted }}
```

Where `boldFormatted` comes from:
```typescript
const boldFormatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
```

**Risk:** User/AI-generated message content with markdown can inject arbitrary HTML/JS.

**Impact:** Session hijacking, credential theft, UI defacement.

**Fix:**
- Use DOMPurify to sanitize before rendering
- Or use a React markdown library (react-markdown) with proper escaping

---

### 3. API Key Exposure in Client Bundle

**Files:** Multiple services expose API keys in client-side code:

| File | Line | Key |
|------|------|-----|
| `lib/bmad-service.ts` | 33 | `VITE_ANTHROPIC_API_KEY` |
| `lib/nexus-service.ts` | 33 | `VITE_ANTHROPIC_API_KEY` |
| `lib/nexus-party-mode-service.ts` | 401 | `VITE_ANTHROPIC_API_KEY` |
| `lib/bmad-party-mode-service.ts` | 370 | `VITE_ANTHROPIC_API_KEY` |
| `services/BMADWorkflowEngine.ts` | 110 | `VITE_ANTHROPIC_API_KEY` |
| `services/heygen.ts` | 4 | `VITE_HEYGEN_API_KEY` |
| `lib/human-tts-service.ts` | 152-153 | `VITE_ELEVENLABS_API_KEY`, `VITE_OPENAI_API_KEY` |

**Risk:** API keys bundled into client JavaScript are extractable. Direct API billing fraud possible.

**Impact:** Financial loss from API abuse. Potential data exfiltration via Anthropic/OpenAI APIs.

**Fix:**
- Route ALL API calls through backend proxy endpoints
- Never expose `VITE_*` keys that are sensitive
- Use server-side API routes with proper auth

---

### 4. SSE Token in URL Query Parameter

**File:** `nexus/src/contexts/WorkflowContext.tsx`
**Line:** 251-252

```typescript
const eventSource = new EventSource(
  `${API_URL}/api/sse/workflow/${workflowId}?token=${token}&userId=${userId}`
)
```

**Risk:** Authentication tokens appear in server logs, browser history, and referrer headers.

**Impact:** Token leakage enables session hijacking.

**Fix:**
- Use fetch with ReadableStream for SSE with headers
- Or implement a short-lived token exchange endpoint

---

## HIGH PRIORITY BUGS (User-Facing Issues)

### 5. Unprotected JSON.parse Without Try-Catch

**Multiple locations parsing localStorage/SSE data without error handling:**

| File | Line | Context |
|------|------|---------|
| `components/AISuggestionsPanel.tsx` | 419 | `JSON.parse(localStorage...)` |
| `components/AgentChatbot.tsx` | 912, 942, 969 | Conversation parsing |
| `components/WorkflowPreviewModal.tsx` | 437 | Project parsing |
| `pages/ProjectDetail.tsx` | 46, 85 | Stored projects |
| `services/IntegrationService.ts` | 103 | Saved integrations |
| `contexts/WorkflowChatContext.tsx` | 168 | Chat state |
| `components/SmartAIChatbot.tsx` | 80, 299 | Workflow parsing |

**Risk:** Malformed localStorage data crashes the app.

**Impact:** White screen of death for users with corrupted local storage.

**Fix:**
```typescript
function safeJsonParse<T>(str: string | null, fallback: T): T {
  if (!str) return fallback
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}
```

---

### 6. SSE Connection Memory Leak Risk

**Files:**
- `contexts/WorkflowContext.tsx` - lines 244-356
- `contexts/WorkflowChatContext.tsx` - line 383
- `hooks/useRealWorkflowExecution.ts` - line 140
- `components/LiveWorkflowVisualization.tsx` - line 147

**Issue:** EventSource connections created on component mount. If component unmounts during async operations before `eventSourceRef.current` is set, cleanup may fail.

**Impact:** Zombie SSE connections accumulate, causing memory leaks and connection pool exhaustion.

**Fix:** Add connection status tracking and ensure cleanup runs in all code paths.

---

### 7. Missing Return Type `any[]` Leaks Type Safety

**File:** `nexus/src/services/heygen.ts`
**Line:** 86

```typescript
export async function listHeyGenAvatars(): Promise<any[]> {
```

**Plus 60+ instances of `as any` type assertions across codebase.** Major files:
- `lib/workflow-engine.ts`
- `services/WorkflowExecutionEngine.ts`
- `components/AgentChatbot.tsx`
- `components/WorkflowCanvasLegacy.tsx`
- `pages/WorkflowDetail.tsx`

**Impact:** Runtime type errors slip through. Debugging becomes harder in production.

**Fix:** Define proper interfaces and remove `any` casts.

---

### 8. Error Boundary Only at App Root

**Files:**
- `DevApp.tsx` - Line 37 (wraps entire app)
- `components/ErrorBoundary.tsx` - Single global boundary

**Issue:** One error boundary means any component error crashes the entire app.

**Impact:** A single failing component (e.g., workflow visualization) takes down the whole dashboard.

**Fix:** Add localized error boundaries around:
- Workflow visualizations
- Chat interfaces
- Integration panels
- Dashboard widgets

---

### 9. console.error Logging Sensitive Data

**100+ `console.error` calls logging full error objects:**

Notable examples:
- `contexts/AuthContext.tsx:78` - Auth errors
- `contexts/WorkflowContext.tsx:338` - SSE messages
- `services/ComposioClient.ts:196` - API failures
- `components/StripeCheckout.tsx` - Payment errors

**Impact:** Sensitive data (tokens, user info, API responses) logged to browser console in production.

**Fix:**
- Implement structured error logging service
- Sanitize errors before logging
- Use `process.env.NODE_ENV` checks

---

## TECHNICAL DEBT (Should Fix Before Scale)

### 10. TODO Comments Indicating Incomplete Features

| File | Line | TODO |
|------|------|------|
| `components/AgentChatbot.tsx` | 466 | `// TODO: Execute workflow steps through backend` |
| `services/IntegrationSchemaAnalyzerService.ts` | 974 | `// TODO: Implement transformation` |

---

### 11. Inconsistent Error Handling Patterns

**Three different patterns used across codebase:**

1. **Throw pattern** (84 instances): `throw new Error(...)`
2. **Console + state pattern**: `console.error(...); setError(...)`
3. **Silent fail pattern**: `catch (e) { /* empty */ }` (none found - good)

**Recommendation:** Standardize on a single error handling utility.

---

### 12. localStorage Keys Not Centralized

**16+ different localStorage key strings hardcoded:**
- `nexus_workflow_demo_prefill`
- `nexus_onboarding_complete`
- `nexus_user_goal`
- `nexus_conversations`
- `nexus_dismissed_suggestions`
- `nexus_integrations`
- `nexus_projects`
- `nexus_focus_mode`
- `nexus_profile`
- etc.

**Fix:** Create `constants/storage-keys.ts` with all keys.

---

### 13. useEffect Dependency Array Patterns (Fixed)

**Note:** CLAUDE.md mentioned infinite loop patterns. Checked `AchievementSystem.tsx` and `AISuggestionsPanel.tsx` - both now use proper `useRef` tracking pattern to prevent loops. This has been fixed.

---

## Summary

| Severity | Count | Blocks Launch? |
|----------|-------|----------------|
| CRITICAL | 4 | YES |
| HIGH | 5 | Recommended |
| TECH DEBT | 4 | No |

**Recommendation:** Fix CRITICAL #1-4 before any production deployment. They represent security vulnerabilities that would be embarrassing (and potentially costly) in production.

---

*Report generated by scanning TypeScript files, grep patterns for anti-patterns, and manual review of critical paths.*
