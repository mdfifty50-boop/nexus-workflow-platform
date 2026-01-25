# L1-T3: Nexus Performance Baseline Report

**Date:** 2026-01-12
**Author:** Dash (Performance Engineer)
**Sprint:** Loop 1 - Foundation Assessment

---

## Executive Summary

This report establishes performance baselines for Nexus before optimizations. Current state analysis reveals **no lazy loading implemented**, **large bundle with heavy dependencies**, and **robust SSE infrastructure for real-time updates**. The codebase has TypeScript errors blocking production build, which must be resolved before bundle size can be accurately measured.

### NFR-P1 Requirements Reference

| Requirement | Target | Current Status |
|------------|--------|----------------|
| NFR-P1.3: Workflow visualization latency | <500ms | SSE implemented, pending measurement |
| NFR-P2.1: Avg workflow cost | <$0.50 | Token tracking in place |
| NFR-P3.1: Mobile responsiveness | 375px baseline | Responsive CSS, no code splitting |
| NFR-SC2.3: 500-node graphs | No degradation | ReactFlow used, untested at scale |

---

## 1. Bundle Size Analysis

### 1.1 Current Build Status

**BUILD FAILED** - TypeScript errors prevent production bundle generation.

**Error Categories:**
- 75+ TypeScript compilation errors
- Missing exports from `@/lib/api-client`
- Type-only imports violating `verbatimModuleSyntax`
- Unused variable/import warnings treated as errors

**Action Required:** Fix TypeScript errors before measuring production bundle.

### 1.2 Dependency Size Analysis (node_modules)

| Dependency | Size | Usage | Optimization Potential |
|-----------|------|-------|----------------------|
| **@clerk/clerk-react** | 7.4 MB | Auth | Lazy load post-auth routes |
| **recharts** | 7.5 MB | Analytics page only | Lazy load Analytics |
| **@supabase/supabase-js** | 5.3 MB | Database | Core dependency |
| **@xyflow/react** | 3.8 MB | Workflow visualization | Lazy load WorkflowDemo |
| **@anthropic-ai/sdk** | 3.8 MB | Backend only | Exclude from client bundle |
| **@stripe/stripe-js** | 2.0 MB | Checkout only | Lazy load CheckoutFlow |
| **@heygen/streaming-avatar** | 226 KB | HeyGen demo | Lazy load HeyGenDemo |
| **reactflow** | 194 KB | Legacy | Remove if unused |

**Total Heavy Dependencies:** ~30 MB raw (before tree-shaking/minification)

### 1.3 Estimated Bundle Impact

Without build output, estimates based on similar React apps:

| Chunk | Estimated Size | Notes |
|-------|---------------|-------|
| Main bundle (unoptimized) | ~800KB-1.2MB gzipped | No code splitting |
| CSS | ~50-80KB | Tailwind with purging |
| Vendor chunk | ~400-600KB | React, ReactDOM, router |

**Architecture Target:** <500KB gzipped main bundle (per architecture.md)

---

## 2. Components Needing Optimization

### 2.1 File Size Analysis (Lines of Code)

| Component | Lines | Concern Level | Issue |
|-----------|-------|--------------|-------|
| `pages/WorkflowDemo.tsx` | 2,857 | **CRITICAL** | Massive file, ReactFlow + AI building overlay |
| `components/EnhancedDashboard.tsx` | 1,702 | **HIGH** | Dashboard loaded on every login |
| `contexts/PersonalizationContext.tsx` | 1,029 | **MEDIUM** | Large context, always loaded |
| `components/AIMeetingRoom.tsx` | 830 | **HIGH** | HeyGen integration, rarely used |
| `contexts/WorkflowContext.tsx` | 739 | **MEDIUM** | SSE management, needed globally |
| `components/LiveWorkflowVisualization.tsx` | 710 | **HIGH** | Heavy visualization |
| `lib/api-client.ts` | 684 | **MEDIUM** | API client, tree-shakeable |

### 2.2 No Lazy Loading Detected

**Current State:** All 20+ routes eagerly loaded in `App.tsx`

```typescript
// App.tsx - Current (Anti-pattern)
import { WorkflowDemo } from '@/pages/WorkflowDemo'  // 2,857 lines loaded immediately
import { Dashboard } from '@/pages/Dashboard'
import { Analytics } from '@/pages/Analytics'  // Loads 7.5MB recharts
// ... 20+ more eager imports
```

**Architecture Mandates (architecture.md line 680):**
> Route-based lazy loading for faster initial load (NFR-P3.1: mobile performance)

### 2.3 Memoization Patterns

**Good:** Extensive use of `useCallback` and `useMemo` found in:
- WorkflowContext (14 useCallback calls)
- WorkflowChatContext (8 useCallback calls)
- EnhancedDashboard (10 useMemo, 2 useCallback)
- CommandPalette (4 useMemo, 1 useCallback)

**Missing:** No `React.memo` usage detected for preventing re-renders.

**Risk:** Components like `EnhancedDashboard` have many internal memoized values but may still re-render on parent state changes.

---

## 3. Real-Time Update Implementation (Epic 5-2)

### 3.1 SSE Architecture - WELL IMPLEMENTED

**SSE Connection Points Found:**

| Location | Purpose | Implementation Quality |
|----------|---------|----------------------|
| `WorkflowContext.tsx` | Global workflow state | Robust with auto-reconnect |
| `WorkflowChatContext.tsx` | Chat execution updates | Full event handling |
| `LiveWorkflowVisualization.tsx` | Visual node updates | Comprehensive SSE types |
| `WorkflowPreviewModal.tsx` | Modal execution | SSE for live preview |
| `WorkflowMap.tsx` | Map visualization | Real-time node status |
| `useRealWorkflowExecution.ts` | Hook for execution | SSE with reconnection logic |

### 3.2 SSE Event Types (Well-Defined)

```typescript
// From LiveWorkflowVisualization.tsx
type SSEEvent =
  | SSENodeUpdate        // Individual node status
  | SSEWorkflowStatus    // Overall workflow state
  | SSECheckpoint        // Checkpoint created
  | SSEStepStarted       // Step execution began
  | SSEStepCompleted     // Step finished successfully
  | SSEStepFailed        // Step encountered error
  | SSEWorkflowStarted   // Workflow execution began
  | SSEWorkflowCompleted // Workflow finished
  | SSEWorkflowFailed    // Workflow error
```

### 3.3 SSE Connection Pattern

```typescript
// Pattern from WorkflowContext.tsx (lines 242-357)
const connectSSE = useCallback(async (workflowId: string) => {
  // Close existing connection
  if (eventSourceRef.current) {
    eventSourceRef.current.close()
  }

  // Create new EventSource
  const eventSource = new EventSource(
    `${API_URL}/api/sse/workflow/${workflowId}?token=${token}&userId=${userId}`
  )

  eventSource.onmessage = (event) => {
    // Parse and handle all SSE event types
    const data = JSON.parse(event.data)
    // Update workflow state based on event type
  }

  eventSource.onerror = (error) => {
    // Auto-reconnect after 3 seconds
    setTimeout(() => connectSSE(workflowId), 3000)
  }
}, [/* dependencies */])
```

### 3.4 SSE Latency Assessment

**Architecture Requirement:** <500ms latency (NFR-P1.3)

**Current Implementation Strengths:**
- Direct EventSource connection (no polling)
- Auto-reconnection with configurable retry delay
- Granular event types for minimal data transfer
- Multiple SSE consumers share workflow state via context

**Potential Bottlenecks:**
- Token/userId passed in URL query params (not headers - EventSource limitation)
- No connection pooling/multiplexing for multiple workflow monitoring
- Each component may create its own EventSource (redundant connections)

**Recommendation:** Implement SSE connection singleton in WorkflowContext to prevent duplicate connections.

---

## 4. Recommended Performance Instrumentation

### 4.1 Frontend Performance Monitoring

```typescript
// Recommended: Add to main.tsx or App.tsx
import { reportWebVitals } from './lib/web-vitals'

// Core Web Vitals measurement
reportWebVitals({
  onLCP: (metric) => console.log('LCP:', metric.value, 'ms'),  // Target: <2.5s
  onFID: (metric) => console.log('FID:', metric.value, 'ms'),  // Target: <100ms
  onCLS: (metric) => console.log('CLS:', metric.value),        // Target: <0.1
  onTTFB: (metric) => console.log('TTFB:', metric.value, 'ms'),
  onINP: (metric) => console.log('INP:', metric.value, 'ms'),
})
```

### 4.2 Component Render Tracking

```typescript
// Recommended: React DevTools Profiler integration
import { Profiler } from 'react'

function onRenderCallback(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) {
  if (actualDuration > 16) {  // Longer than 60fps frame
    console.warn(`Slow render: ${id} took ${actualDuration.toFixed(2)}ms`)
  }
}

// Wrap heavy components
<Profiler id="EnhancedDashboard" onRender={onRenderCallback}>
  <EnhancedDashboard />
</Profiler>
```

### 4.3 SSE Latency Measurement

```typescript
// Add to SSE event handler in WorkflowContext.tsx
eventSource.onmessage = (event) => {
  const receiveTime = performance.now()
  const data = JSON.parse(event.data)

  // Server should include timestamp in event
  if (data.serverTimestamp) {
    const latency = Date.now() - data.serverTimestamp
    if (latency > 500) {  // NFR-P1.3 threshold
      console.warn(`SSE latency exceeded: ${latency}ms`)
    }
  }

  // Track processing time
  // ... handle event ...
  const processingTime = performance.now() - receiveTime
  console.debug(`SSE processing: ${processingTime.toFixed(2)}ms`)
}
```

### 4.4 Bundle Analysis Configuration

```typescript
// vite.config.ts - Add for bundle visualization
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-flow': ['@xyflow/react'],
          'vendor-charts': ['recharts'],
          'vendor-auth': ['@clerk/clerk-react'],
        },
      },
    },
  },
})
```

---

## 5. Specific Bottleneck Locations

### 5.1 Critical Path Analysis

| Bottleneck | File | Line | Impact | Priority |
|-----------|------|------|--------|----------|
| No lazy loading | `App.tsx` | 1-31 | All 20+ pages loaded on initial render | **P0** |
| WorkflowDemo size | `WorkflowDemo.tsx` | All | 2,857 lines in single file | **P1** |
| ReactFlow always loaded | `WorkflowDemo.tsx` | 1-17 | @xyflow/react (3.8MB) in main bundle | **P1** |
| recharts always loaded | `Analytics.tsx` | 1-20 | 7.5MB dependency on first load | **P1** |
| HeyGen in bundle | `HeyGenAvatar.tsx` | 1-5 | Streaming avatar SDK rarely used | **P2** |
| Stripe always loaded | `CheckoutFlow.tsx` | varies | Payment SDK loaded for all users | **P2** |

### 5.2 Context Provider Nesting

```typescript
// App.tsx current structure - Deep nesting
<BrowserRouter>
  <AuthProvider>
    <WorkflowProvider>           // SSE connections managed here
      <WorkflowChatProvider>     // More SSE connections
        <PersonalizationProvider> // 1,029 lines of context
          <ToastProvider>
            <Routes>...</Routes>
          </ToastProvider>
        </PersonalizationProvider>
      </WorkflowChatProvider>
    </WorkflowProvider>
  </AuthProvider>
</BrowserRouter>
```

**Risk:** All providers initialize on app load regardless of route.

---

## 6. Optimization Roadmap

### Phase 1: Build Fixes (BLOCKING)
1. Fix 75+ TypeScript errors
2. Enable production build
3. Measure actual bundle size

### Phase 2: Code Splitting (NFR-P3.1)
1. Implement `React.lazy()` for all route components
2. Add `Suspense` boundaries per route
3. Split vendor chunks (react, flow, charts, auth)
4. Target: Main bundle <200KB gzipped

### Phase 3: Heavy Component Optimization (NFR-P1.3)
1. Virtualize large lists (workflow nodes)
2. Add `React.memo` to frequently re-rendering components
3. Implement skeleton loading states
4. Target: <16ms render time (60fps)

### Phase 4: SSE Optimization
1. Consolidate SSE connections to single manager
2. Add server-side timestamp for latency tracking
3. Implement connection multiplexing
4. Target: <500ms latency (measured)

### Phase 5: Mobile Performance (NFR-P3.1)
1. Lighthouse audit on 375px viewport
2. Critical CSS extraction
3. Font subsetting
4. Image lazy loading
5. Target: Lighthouse score >90

---

## 7. Metrics to Track Post-Optimization

| Metric | Current Baseline | Target | Tool |
|--------|------------------|--------|------|
| Initial bundle size | Unknown (build fails) | <500KB gzipped | Vite build output |
| LCP (desktop) | Unknown | <2.5s | Web Vitals |
| LCP (mobile 3G) | Unknown | <3.0s | Lighthouse |
| SSE latency | Unknown | <500ms | Custom instrumentation |
| Time to Interactive | Unknown | <3.5s | Lighthouse |
| 500-node render | Unknown | <100ms | React Profiler |

---

## Appendix A: Files Analyzed

```
nexus/
├── src/
│   ├── App.tsx                    # No lazy loading
│   ├── main.tsx                   # Entry point, conditional auth
│   ├── pages/
│   │   ├── WorkflowDemo.tsx       # 2,857 lines - CRITICAL
│   │   ├── Analytics.tsx          # recharts dependency
│   │   └── [18 more pages]        # All eagerly loaded
│   ├── components/
│   │   ├── EnhancedDashboard.tsx  # 1,702 lines
│   │   ├── LiveWorkflowVisualization.tsx  # SSE consumer
│   │   └── [70+ components]
│   ├── contexts/
│   │   ├── WorkflowContext.tsx    # SSE management
│   │   ├── WorkflowChatContext.tsx
│   │   └── PersonalizationContext.tsx  # 1,029 lines
│   └── hooks/
│       └── useRealWorkflowExecution.ts  # SSE consumer
├── vite.config.ts                 # No bundle optimization
└── package.json                   # Heavy dependencies
```

---

## Appendix B: SSE Infrastructure Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │ WorkflowContext  │    │WorkflowChatContext│                  │
│  │   (SSE #1)       │    │    (SSE #2)       │                  │
│  └────────┬─────────┘    └────────┬──────────┘                  │
│           │                       │                              │
│  ┌────────┴───────────────────────┴──────────┐                  │
│  │              EventSource Manager           │                  │
│  │  - Auto-reconnect (3s delay)               │                  │
│  │  - Event type routing                      │                  │
│  │  - State updates                           │                  │
│  └────────────────────┬──────────────────────┘                  │
└───────────────────────┼─────────────────────────────────────────┘
                        │
                        ▼ SSE Connection
┌───────────────────────────────────────────────────────────────┐
│                     Server (Express)                           │
│  GET /api/sse/workflow/:id?token=&userId=                     │
│                                                                │
│  Events:                                                       │
│  - node_update      (individual node status)                   │
│  - workflow_status  (overall state)                            │
│  - checkpoint       (save point created)                       │
│  - step_started/completed/failed                               │
│  - workflow_started/completed/failed                           │
└───────────────────────────────────────────────────────────────┘
```

---

**Next Steps:**
1. Resolve TypeScript build errors (separate task)
2. Implement lazy loading for routes (highest ROI)
3. Add bundle analyzer to CI pipeline
4. Establish measurement baseline with working build
