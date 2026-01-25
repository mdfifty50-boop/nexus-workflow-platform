# OpenAI UI Engineer Mobile UX Specification
## Nexus AI Workflow Platform - Consultant Report

**Document Version:** 1.0
**Date:** January 2026
**Author:** OpenAI UI Engineering Consultant
**Scope:** Workflow Demo Page & AI Meeting Room Mobile Experience

---

## Executive Summary

This specification document provides a comprehensive audit of Nexus's mobile UX for two critical pages: the **Workflow Demo** (`/workflow-demo`) and the **AI Meeting Room**. After analyzing the current implementation, I've identified both strengths and opportunities for improvement, guided by OpenAI's interface design principles.

### Current State Assessment

| Component | Mobile Readiness | Key Issues |
|-----------|------------------|------------|
| Workflow Demo | 70% | Overlapping controls, complex canvas on small screens, too many actions visible |
| AI Meeting Room | 85% | Good foundation with bottom sheet pattern, but multi-agent visualization needs refinement |

### Recommended Priority Actions

1. **P0 (Critical):** Implement progressive disclosure on Workflow Demo mobile
2. **P1 (High):** Reduce visual complexity through mode-based UI states
3. **P2 (Medium):** Enhance AI Meeting Room visual hierarchy
4. **P3 (Low):** Add calm animations and transitions

---

## Part 1: Workflow Demo Page Audit

### 1.1 Current Implementation Analysis

The Workflow Demo page (`/workflow-demo`) is a complex n8n-style workflow visualization built on ReactFlow. Let me break down what exists:

#### Existing Mobile Features (Positive)
```
- MobileWelcomeScreen component with persona-based onboarding
- MobileZoomControls floating in bottom-right (fixed position)
- useIsMobile() hook for responsive detection at 768px breakpoint
- touch-manipulation CSS classes on interactive elements
- min-h-[48px] on buttons for touch targets
- safe-area-inset-bottom support via env()
- Quick starter cards with 60px min-height
- Textarea with base text size (16px prevents iOS zoom)
```

#### Current Issues Identified

**Issue 1: Control Panel Overlap**
```tsx
// Current positioning - too many elements competing for attention
className="top-2 sm:top-4 left-2 sm:left-4"
className="fixed bottom-24 right-4 z-20" // MobileZoomControls
className="bottom-0 left-0 right-0"      // Control panel
```
On mobile, the control panel, zoom controls, and navigation button all occupy the bottom 120px of the screen, creating visual clutter.

**Issue 2: ReactFlow Canvas Complexity**
The workflow visualization shows 10-14 nodes simultaneously with connecting edges, error states, and agent avatars. This works on desktop but overwhelms on mobile.

**Issue 3: Multiple Action States**
The demo page handles too many states simultaneously:
- AI Building Overlay
- Template selection
- Workflow visualization
- Control panels
- Meeting room modal
- Execution logs

### 1.2 OpenAI Design Principles Application

#### Principle: One Primary Action Per Screen State

**Current Problem:** Mobile users see workflow canvas + zoom controls + control panel + navigation all at once.

**Recommended Solution - Mode-Based Mobile UI:**

```tsx
// Proposed: MobileWorkflowModes
type MobileMode = 'view' | 'edit' | 'run' | 'discuss'

function MobileWorkflowPage() {
  const [mode, setMode] = useState<MobileMode>('view')

  return (
    <div className="h-screen flex flex-col">
      {/* Mode determines what's visible */}
      {mode === 'view' && <WorkflowCanvas simplified />}
      {mode === 'edit' && <NodeEditor />}
      {mode === 'run' && <ExecutionPanel />}
      {mode === 'discuss' && <AIMeetingRoom />}

      {/* Single bottom action bar */}
      <MobileActionBar mode={mode} onModeChange={setMode} />
    </div>
  )
}
```

#### Principle: Progressive Disclosure

**Implementation Strategy - Three-Level Hierarchy:**

```
Level 1 (Always Visible):
  - Simplified workflow preview (max 5 nodes collapsed into groups)
  - Single "Optimize" or "Run" CTA button
  - Mode switcher (4 icons max)

Level 2 (On Tap - Bottom Sheet):
  - Node details
  - Quick actions (duplicate, delete, configure)
  - Agent selection

Level 3 (On Deep Dive - Full Screen):
  - Full workflow canvas (pinch-to-zoom)
  - Complete node configuration
  - Execution logs
```

### 1.3 Specific Component Recommendations

#### 1.3.1 MobileWorkflowPreview (New Component)

Replace the full ReactFlow canvas on mobile with a simplified preview:

```tsx
/**
 * MobileWorkflowPreview
 *
 * Simplified workflow visualization for mobile:
 * - Collapsed groups instead of individual nodes
 * - Linear flow representation
 * - Tap to expand into full canvas mode
 */
interface MobileWorkflowPreviewProps {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  onNodeTap: (nodeId: string) => void
  onExpandCanvas: () => void
}

// Visual Design Spec:
// - Horizontal scrolling flow
// - 64px circle nodes (vs current ~150px)
// - Simple connector lines (no bezier curves)
// - Group similar nodes: "3 API Calls" collapsed
// - Max 5 visible items, "View All" for more
```

**Visual Reference:**
```
[Trigger] ---> [Data Sources (3)] ---> [AI Agent] ---> [Output]
   64px           64px + badge           64px          64px
```

#### 1.3.2 Floating Action Button (FAB) Enhancement

Current MobileZoomControls occupy bottom-right. Consolidate into single FAB:

```tsx
/**
 * MobileWorkflowFAB
 *
 * Single floating action button that expands on tap:
 * - Primary state: Shows mode icon
 * - Expanded: Radial menu with zoom/fit/settings
 * - Positioned bottom-right, 16px from edges
 * - Respects safe-area-inset-bottom
 */
function MobileWorkflowFAB() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="fixed bottom-24 right-4" style={{
      paddingBottom: 'env(safe-area-inset-bottom, 16px)'
    }}>
      {expanded && (
        <div className="absolute bottom-16 right-0 flex flex-col gap-2">
          <FABAction icon="zoom-in" onPress={zoomIn} />
          <FABAction icon="zoom-out" onPress={zoomOut} />
          <FABAction icon="fit" onPress={fitView} />
        </div>
      )}
      <button
        onClick={() => {
          triggerHaptic('light')
          setExpanded(!expanded)
        }}
        className="w-14 h-14 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/25 flex items-center justify-center active:scale-95 transition-transform"
      >
        <MenuIcon />
      </button>
    </div>
  )
}
```

#### 1.3.3 Touch Target Audit

Current minimum touch targets are inconsistent. Standardize:

| Element | Current | Recommended | Notes |
|---------|---------|-------------|-------|
| Zoom buttons | 48px | 48px | OK |
| Quick starter cards | 60px | 52px | Can reduce slightly |
| Node configuration buttons | varies | 48px | Needs fixing |
| Tab buttons | 44px | 48px | Increase for consistency |
| Close buttons | 44px | 48px | Match iOS guidelines |

### 1.4 Spacing System Refinement

Current spacing uses Tailwind defaults inconsistently. Implement design tokens:

```tsx
// mobile-spacing.ts
export const MOBILE_SPACING = {
  // Touch-safe spacing
  tap: {
    min: 44,      // Apple HIG minimum
    comfortable: 48, // Recommended
    large: 56,    // For primary actions
  },

  // Content spacing
  content: {
    xs: 4,   // 1rem = 16px / 4
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },

  // Safe area padding
  safeArea: {
    top: 'env(safe-area-inset-top, 0px)',
    bottom: 'env(safe-area-inset-bottom, 0px)',
    left: 'env(safe-area-inset-left, 0px)',
    right: 'env(safe-area-inset-right, 0px)',
  }
}
```

---

## Part 2: AI Meeting Room Audit

### 2.1 Current Implementation Analysis

The AI Meeting Room is a multi-agent conversation interface that shows 8 AI agents discussing workflow optimization. Current mobile implementation is more mature.

#### Existing Mobile Features (Positive)
```tsx
// Strong foundation already in place:
- Bottom sheet pattern on mobile (rounded-t-3xl, drag handle)
- useKeyboardVisible() hook with transform adjustment
- useSwipeToSwitchTabs() for Chat <-> Agents navigation
- usePullToRefresh() for familiar mobile gesture
- triggerHaptic() feedback on interactions
- Tab-based view switching
- 44-48px touch targets on buttons
- Keyboard avoidance with proper transform
```

#### Current Issues Identified

**Issue 1: Visual Hierarchy in Multi-Agent View**
When multiple agents are visible, the visual hierarchy is flat. Users can't easily distinguish:
- Who spoke most recently
- Who is currently active
- Who is typing

**Issue 2: Agent Grid Density**
Current 2-column grid with 80px avatars is good, but the status indicators (typing, speaking) are too subtle.

**Issue 3: Chat Message Differentiation**
All messages look similar. Need stronger visual distinction between:
- User messages
- Agent messages (vary by agent)
- System messages
- Errors

### 2.2 Visual Hierarchy Improvements

#### 2.2.1 Agent Status Prominence

**Current Implementation:**
```tsx
// Current: Small status dot, hard to see
<div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${
  isActive ? 'bg-green-500' : isTyping ? 'bg-yellow-500 animate-pulse' : 'bg-slate-600'
}`} />
```

**Recommended Enhancement:**
```tsx
/**
 * Enhanced Agent Status Indicator
 *
 * Three states with high visibility:
 * - Idle: Subtle ring
 * - Typing: Pulsing glow + animated dots
 * - Speaking: Full border animation + sound waves
 */
function AgentStatusIndicator({
  status,
  agentColor
}: {
  status: 'idle' | 'typing' | 'speaking'
  agentColor: string
}) {
  if (status === 'idle') {
    return <div className="w-3 h-3 rounded-full bg-slate-600 border-2 border-slate-800" />
  }

  if (status === 'typing') {
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-800/90 border border-slate-700">
        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    )
  }

  // Speaking state
  return (
    <div
      className="absolute inset-0 rounded-full animate-pulse"
      style={{
        boxShadow: `0 0 20px ${agentColor}, 0 0 40px ${agentColor}40`,
        border: `3px solid ${agentColor}`
      }}
    />
  )
}
```

#### 2.2.2 Message Card Differentiation

**Design System for Message Types:**

```tsx
// message-styles.ts
export const MESSAGE_STYLES = {
  user: {
    wrapper: 'ml-8 bg-cyan-500/10 border-cyan-500/30 rounded-2xl rounded-br-sm',
    avatar: 'hidden', // No avatar for user
    alignment: 'justify-end',
    text: 'text-white',
  },
  agent: (color: string) => ({
    wrapper: `mr-8 bg-slate-800/50 border-l-4 rounded-xl`,
    borderColor: color,
    avatar: 'visible',
    alignment: 'justify-start',
    text: 'text-slate-200',
  }),
  system: {
    wrapper: 'mx-auto max-w-sm bg-slate-900/50 border-slate-700/50 rounded-lg text-center',
    text: 'text-slate-400 text-sm',
    icon: 'hidden',
  },
  error: {
    wrapper: 'mx-auto max-w-sm bg-red-500/10 border-red-500/30 rounded-lg',
    text: 'text-red-400',
    icon: 'text-2xl',
  }
}
```

**Visual Spec:**
```
User Message:
+----------------------------------------+
|                    "What should we do?" |
|                                 [cyan] --|-- no avatar, right-aligned
+----------------------------------------+

Agent Message:
+----------------------------------------+
| [Avatar] Agent Name        12:34 PM     |
| +------------------------------------+  |
| | Message content here with proper   |  |
| | padding and readable line height.  |  |
| +------------------------------------+  |
|         [emotion emoji if detected]     |
+----------------------------------------+
  ^-- left-aligned with colored left border
```

### 2.3 Swipe Gesture Refinements

#### 2.3.1 Swipe-to-Reply Enhancement

Current implementation has `replyToMessage` state but limited UX. Enhance:

```tsx
/**
 * SwipeableMessage
 *
 * Swipe right to reply, with visual feedback:
 * - Threshold: 50px to trigger
 * - Visual: Arrow icon appears during swipe
 * - Haptic: Light feedback at threshold
 * - Action: Populates input with @mention
 */
function SwipeableMessage({
  message,
  onReply
}: {
  message: PartyModeMessage
  onReply: (message: PartyModeMessage) => void
}) {
  const [swipeX, setSwipeX] = useState(0)
  const threshold = 50

  return (
    <div
      className="relative overflow-hidden"
      style={{ transform: `translateX(${Math.min(swipeX, 60)}px)` }}
    >
      {/* Reply indicator */}
      {swipeX > 0 && (
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 transition-opacity ${
          swipeX > threshold ? 'opacity-100' : 'opacity-50'
        }`}>
          <ReplyIcon className="w-6 h-6 text-cyan-400" />
        </div>
      )}

      <MessageCard message={message} />
    </div>
  )
}
```

#### 2.3.2 Swipe Tab Indicator

Add visual feedback during tab swipe:

```tsx
/**
 * Tab Swipe Progress Indicator
 *
 * Shows progress during swipe gesture:
 * - Dots under tabs animate
 * - Background tint shifts
 */
function TabSwipeIndicator({ progress }: { progress: number }) {
  // progress: -1 (full left) to 1 (full right)
  return (
    <div className="flex justify-center gap-2 py-1">
      <div className={`w-2 h-2 rounded-full transition-colors ${
        progress < 0 ? 'bg-cyan-400' : 'bg-slate-600'
      }`} />
      <div className={`w-2 h-2 rounded-full transition-colors ${
        Math.abs(progress) < 0.3 ? 'bg-cyan-400' : 'bg-slate-600'
      }`} />
      <div className={`w-2 h-2 rounded-full transition-colors ${
        progress > 0 ? 'bg-cyan-400' : 'bg-slate-600'
      }`} />
    </div>
  )
}
```

### 2.4 Audio Feedback Patterns

The AI Meeting Room already has TTS integration. Enhance with additional audio cues:

#### 2.4.1 Audio Feedback Matrix

| Event | Sound Type | Duration | When |
|-------|------------|----------|------|
| New message arrives | Soft chime | 200ms | Always (if not muted) |
| Agent starts speaking | None | - | TTS handles |
| Agent finishes speaking | Subtle click | 50ms | After TTS ends |
| User sends message | Whoosh | 150ms | On send |
| Error occurs | Low tone | 300ms | On error |
| Discussion complete | Success tone | 400ms | When all agents done |

#### 2.4.2 Haptic Pattern Specification

```tsx
// haptic-patterns.ts
export const HAPTICS = {
  // Light - Navigation, selections
  light: [10],

  // Medium - Actions, confirms
  medium: [20],

  // Heavy - Completions, errors
  heavy: [30, 10, 30],

  // Custom patterns
  agentSpeaking: [10], // When agent starts
  messageReceived: [15],
  error: [50, 20, 50],
  success: [10, 20, 40],
}

function triggerHaptic(pattern: keyof typeof HAPTICS | number[]) {
  if ('vibrate' in navigator) {
    const vibration = typeof pattern === 'string' ? HAPTICS[pattern] : pattern
    navigator.vibrate(vibration)
  }
}
```

### 2.5 Bottom Sheet Refinements

Current bottom sheet is functional but can be enhanced:

#### 2.5.1 Snap Points

```tsx
/**
 * Bottom Sheet Snap Points
 *
 * Three snap positions for different content needs:
 * - Peek (25%): Just input visible, chat collapsed
 * - Half (50%): Comfortable chat viewing
 * - Full (95%): Maximum chat real estate
 */
const SNAP_POINTS = {
  peek: 0.25,
  half: 0.5,
  full: 0.95,
}

function useBottomSheetSnap(containerRef: RefObject<HTMLDivElement>) {
  const [snapPoint, setSnapPoint] = useState<keyof typeof SNAP_POINTS>('half')

  const handleDragEnd = useCallback((velocity: number, position: number) => {
    const viewportHeight = window.innerHeight
    const ratio = position / viewportHeight

    // Velocity-aware snapping
    if (velocity > 500) {
      setSnapPoint('full')
    } else if (velocity < -500) {
      setSnapPoint('peek')
    } else if (ratio > 0.7) {
      setSnapPoint('full')
    } else if (ratio > 0.35) {
      setSnapPoint('half')
    } else {
      setSnapPoint('peek')
    }

    triggerHaptic('light')
  }, [])

  return { snapPoint, handleDragEnd }
}
```

#### 2.5.2 Drag Handle Enhancement

```tsx
/**
 * Enhanced Drag Handle
 *
 * Visual feedback during drag:
 * - Grows slightly when touched
 * - Shows directional hint on hover
 */
function DragHandle({ isDragging }: { isDragging: boolean }) {
  return (
    <div className="flex flex-col items-center py-3 cursor-grab active:cursor-grabbing">
      <div className={`rounded-full bg-slate-600 transition-all ${
        isDragging
          ? 'w-12 h-1.5 bg-cyan-400'
          : 'w-10 h-1 hover:bg-slate-500'
      }`} />
      {isDragging && (
        <span className="text-[10px] text-slate-500 mt-1">
          Drag to resize
        </span>
      )}
    </div>
  )
}
```

---

## Part 3: OpenAI Design Principles Applied

### 3.1 Whitespace: Give Elements Breathing Room

**Current Issue:** Mobile cards and buttons are packed tight.

**Recommendation:**
```css
/* Increase padding in mobile contexts */
.mobile-card {
  padding: 16px;        /* Current: 12px */
  margin-bottom: 12px;  /* Current: 8px */
}

.mobile-button {
  padding: 14px 20px;   /* Current: 12px 16px */
  gap: 12px;            /* Current: 8px */
}

/* Add breathing room between sections */
.mobile-section {
  margin-top: 24px;     /* Current: 16px */
  margin-bottom: 24px;
}
```

### 3.2 One Primary Action Per Screen State

**Implementation Map:**

| Screen State | Primary Action | Secondary (Hidden) |
|--------------|----------------|-------------------|
| Workflow View | "Optimize with AI" button | Settings, Export, Share |
| AI Building | Cancel button only | Nothing else |
| Meeting Room Chat | Send message | Mute, Close, Agents tab |
| Meeting Room Agents | Switch to chat | Agent details |
| Execution | Stop button | Logs, Details |

### 3.3 Progressive Disclosure

**Three-Tap Rule:** Any action should be reachable within 3 taps.

```
Tap 1: Primary screen (view workflow)
Tap 2: Action category (e.g., "Edit" bottom sheet)
Tap 3: Specific action (e.g., "Configure Node")
```

**Information Hierarchy:**
```
Visible by Default:
  - Workflow name
  - Status (running/idle/error)
  - Primary action button

Tap to Reveal (Bottom Sheet):
  - Node list
  - Quick actions
  - Agent assignments

Swipe/Navigate to Access:
  - Full canvas
  - Execution logs
  - Settings
```

### 3.4 Calm Aesthetics

**Color Palette Refinement:**
```tsx
// calm-palette.ts
export const CALM_COLORS = {
  // Soften the current cyan
  primary: {
    DEFAULT: '#22d3ee',    // Current
    soft: '#67e8f9',       // Recommended for backgrounds
    muted: '#164e63',      // For subtle accents
  },

  // Reduce harsh contrast
  background: {
    dark: '#0f172a',       // slate-900 - keep
    medium: '#1e293b',     // slate-800 - keep
    elevated: '#334155',   // slate-700 - for cards
  },

  // Error states less alarming
  error: {
    DEFAULT: '#f87171',    // Current red
    soft: '#fca5a5',       // Softer alternative
    background: 'rgba(248, 113, 113, 0.1)', // Subtle bg
  }
}
```

**Animation Timing:**
```tsx
// calm-animations.ts
export const CALM_TRANSITIONS = {
  // Slower, more intentional
  page: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',

  // Smooth micro-interactions
  button: 'all 150ms ease-out',

  // Gentle hover states
  hover: 'all 200ms ease-in-out',

  // Relaxed loading states
  pulse: 'opacity 2s ease-in-out infinite', // vs 1s
}
```

### 3.5 Clear Affordances

**Button State Matrix:**

| State | Visual Treatment | Feedback |
|-------|------------------|----------|
| Default | Solid fill, slight shadow | - |
| Hover | Brighten 10%, lift shadow | - |
| Active | Scale 95%, deepen shadow | Haptic light |
| Disabled | 50% opacity, no shadow | - |
| Loading | Pulse animation, spinner | - |

**Touch Target Visualization (Debug Mode):**
```tsx
// Enable in dev to audit touch targets
function TouchTargetOverlay() {
  return process.env.NODE_ENV === 'development' && (
    <style>{`
      button, a, [role="button"] {
        outline: 2px dashed rgba(0, 255, 0, 0.3) !important;
        min-width: 44px !important;
        min-height: 44px !important;
      }
    `}</style>
  )
}
```

### 3.6 Reduced Cognitive Load

**Simplification Checklist:**

- [ ] Workflow canvas: Collapse nodes into groups on mobile
- [ ] Control panel: Max 4 visible actions, overflow in menu
- [ ] Agent grid: Show 4 initially, "View all 8" expand
- [ ] Message thread: Auto-collapse old messages
- [ ] Status indicators: Combine into single badge
- [ ] Error handling: One error message at a time

**Information Density Targets:**
```
Mobile Viewport (375px width):
  - Max visible buttons: 4
  - Max visible cards: 3 (full) or 4 (compact)
  - Max text characters per line: 45-50
  - Max items in a list before collapse: 5
```

---

## Part 4: Implementation Roadmap

### Phase 1: Quick Wins (1-2 days)

| Task | File | Effort |
|------|------|--------|
| Standardize touch targets to 48px | `BottomNav.tsx`, `MobileZoomControls` | 2h |
| Increase button padding | Global Tailwind config | 1h |
| Add haptic feedback to missing interactions | `WorkflowDemo.tsx` | 2h |
| Soften animation timing | Create `calm-animations.css` | 1h |

### Phase 2: Progressive Disclosure (3-5 days)

| Task | File | Effort |
|------|------|--------|
| Create MobileWorkflowPreview component | New file | 8h |
| Implement mode-based mobile UI | `WorkflowDemo.tsx` | 6h |
| Add bottom sheet for node details | New component | 4h |
| Consolidate FAB menu | `MobileZoomControls` refactor | 3h |

### Phase 3: Visual Hierarchy (3-4 days)

| Task | File | Effort |
|------|------|--------|
| Enhanced agent status indicators | `AIMeetingRoom.tsx` | 4h |
| Message card differentiation | New MessageCard component | 6h |
| Swipe-to-reply enhancement | `AIMeetingRoom.tsx` | 4h |
| Tab swipe indicator | `AIMeetingRoom.tsx` | 2h |

### Phase 4: Polish (2-3 days)

| Task | File | Effort |
|------|------|--------|
| Bottom sheet snap points | New hook | 4h |
| Audio feedback patterns | `human-tts-service.ts` | 3h |
| Calm color palette | Tailwind config | 2h |
| Touch target debug overlay | Dev utility | 1h |

---

## Appendix A: Component Specifications

### A.1 MobileWorkflowPreview Detailed Spec

```tsx
/**
 * Component: MobileWorkflowPreview
 * Purpose: Simplified workflow visualization for mobile screens
 *
 * Props:
 *   nodes: WorkflowNode[] - All workflow nodes
 *   edges: WorkflowEdge[] - All connections
 *   activeNode: string | null - Currently executing node
 *   onNodeTap: (nodeId: string) => void - Node selection handler
 *   onExpandCanvas: () => void - Switch to full canvas view
 *
 * Behavior:
 *   - Groups nodes by type (triggers, data sources, agents, outputs)
 *   - Shows max 5 items horizontally scrollable
 *   - Tapping a group expands it to show individual nodes
 *   - Active nodes pulse with glow effect
 *   - Error nodes show red indicator
 *
 * Dimensions:
 *   - Container: 100% width, 120px height
 *   - Node circles: 64px diameter
 *   - Connectors: 2px lines, bezier curves
 *   - Group badges: 20px diameter
 *
 * Animations:
 *   - Enter: Fade in from left, 300ms stagger
 *   - Active: Pulse glow 2s infinite
 *   - Error: Shake 300ms, persist red border
 */
```

### A.2 MobileActionBar Detailed Spec

```tsx
/**
 * Component: MobileActionBar
 * Purpose: Context-aware bottom action bar for workflow page
 *
 * Props:
 *   mode: 'view' | 'edit' | 'run' | 'discuss'
 *   onModeChange: (mode) => void
 *   isExecuting: boolean
 *   hasErrors: boolean
 *
 * States:
 *   View Mode:
 *     - [View] [Edit] [Run] [Discuss]
 *     - Primary action: "Optimize" button above bar
 *
 *   Edit Mode:
 *     - [Cancel] [Add Node] [Save]
 *     - Primary action: "Save Changes"
 *
 *   Run Mode:
 *     - [Stop] button only
 *     - Progress indicator
 *
 *   Discuss Mode:
 *     - [Back to Workflow]
 *     - Meeting room takes over
 *
 * Dimensions:
 *   - Bar height: 64px + safe-area-inset-bottom
 *   - Button width: Flex equal distribution
 *   - Icon size: 24px
 *   - Label size: 10px
 */
```

---

## Appendix B: Accessibility Checklist

### WCAG 2.1 Mobile Compliance

| Criterion | Current | Target | Action Needed |
|-----------|---------|--------|---------------|
| 2.5.5 Target Size | 44px min | 48px | Increase all buttons |
| 1.4.11 Non-text Contrast | Pass | Pass | OK |
| 2.1.1 Keyboard | Partial | Full | Add focus management |
| 2.4.7 Focus Visible | Partial | Full | Add focus rings |
| 1.4.3 Contrast | Pass | Pass | OK |

### Screen Reader Compatibility

```tsx
// Required ARIA attributes
<button
  aria-label="Zoom in workflow canvas"
  aria-pressed={isZoomed}
  role="button"
>

<div
  role="region"
  aria-label="Workflow visualization"
  aria-live="polite"
>

<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="meeting-room-title"
>
```

---

## Appendix C: Testing Requirements

### Mobile Device Matrix

| Device | Resolution | Test Priority |
|--------|------------|---------------|
| iPhone SE | 375x667 | P0 |
| iPhone 14 Pro | 393x852 | P0 |
| iPhone 14 Pro Max | 430x932 | P1 |
| Pixel 7 | 412x915 | P1 |
| Samsung S23 | 360x780 | P1 |
| iPad Mini | 768x1024 | P2 |

### Test Scenarios

1. **Workflow Demo - Mobile Welcome**
   - Quick starter card tap responsiveness
   - Keyboard appearance doesn't obscure input
   - Template browsing scrolls smoothly

2. **Workflow Demo - Canvas View**
   - Pinch-to-zoom works correctly
   - Nodes are tappable without mis-taps
   - FAB menu expands/collapses properly

3. **AI Meeting Room - Chat**
   - Messages scroll to bottom on new message
   - Keyboard avoidance works
   - Swipe-to-reply triggers correctly

4. **AI Meeting Room - Agents**
   - Agent status updates are visible
   - Swipe tab switching is smooth
   - Pull-to-refresh triggers haptic

---

## Conclusion

The Nexus application has a solid foundation for mobile UX, particularly in the AI Meeting Room. The primary opportunities for improvement are:

1. **Workflow Demo complexity reduction** through progressive disclosure and simplified preview mode
2. **Visual hierarchy enhancement** in multi-agent views with clearer status indicators
3. **Consistent touch targets** and interaction patterns across all components
4. **Calm, intentional animations** that reduce cognitive load

By following OpenAI's interface design principles - whitespace, one primary action, progressive disclosure, calm aesthetics, clear affordances, and reduced cognitive load - the Nexus mobile experience can become more intuitive and enjoyable for users managing complex AI workflows on their phones.

---

*Document prepared by OpenAI UI Engineering Consultant*
*For implementation questions, refer to component specifications in Appendix A*
