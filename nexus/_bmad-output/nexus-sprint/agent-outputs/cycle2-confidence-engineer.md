# Confidence Engineer Report: Unified Confidence Gating System

## Executive Summary

Nexus currently has THREE independent confidence systems that never interact:
1. **IntentResolver** (`IntentResolver.ts:418-444`) - Deterministic regex-based, outputs 0.1-0.95
2. **Claude self-report** (`NexusAIService.ts:559`) - Stochastic AI judgment, passed through unvalidated
3. **Template score** (in `SmartWorkflowEngine`) - Keyword-matching confidence

The confidence value currently:
- Colors a progress bar (lines 3380-3402 of WorkflowPreviewCard.tsx)
- Changes CTA text (lines 1101-1127 of ChatContainer.tsx)
- Was REMOVED as an execution gate (line 3694 of WorkflowPreviewCard.tsx: "Removed low confidence blocker")
- Never prevents card creation regardless of value

**RESULT:** A user saying "my sales are dropping" can trigger a workflow card with fabricated confidence.

---

## Current Flow Analysis

```
User types message
    |
    v
IntentResolver.resolve(message) -----> confidence: 0.1 - 0.95
    |                                       (DISCARDED - only used for debug log)
    v
NexusAIService.chat() sends to Claude ---> Claude returns confidence: X.XX
    |                                       (SELF-REPORTED - no validation)
    v
ChatContainer.tsx:1060-1074
    |-- workflowSpec exists? --> CREATE CARD (always, no gate)
    |-- confidence < 0.85?  --> change CTA text (cosmetic only)
    v
WorkflowPreviewCard.tsx:3380-3402
    |-- confidence < 0.85? --> show progress bar (decorative)
    |-- line 3694: REMOVED confidence gate (was once blocking)
    v
Execute button: ALWAYS enabled regardless of confidence
```

**Key evidence of intentional removal:**
```typescript
// Line 3694-3695:
{/* NOTE: Removed low confidence blocker - intent-driven system handles everything
    User can always execute, AI determines optimal approach at runtime */}
```

---

## Unified Confidence System Design

### Architecture: `ConversationConfidenceEngine`

A new service that computes an **enforced confidence** from multiple signals, replacing the current decorative system.

### The Confidence Formula

```
enforcedConfidence = clamp(
  (intentResolverScore * 0.25) +
  (claudeScore * 0.20) +
  (toolSpecificityScore * 0.25) +
  (conversationDepthScore * 0.15) +
  (requestSpecificityScore * 0.15),
  0.0, 1.0
)
```

### Signal Definitions

#### 1. Tool Specificity Score (weight: 0.25)
How many concrete tools did the user mention?

| Condition | Score |
|-----------|-------|
| 0 tools mentioned | 0.00 |
| 1 tool mentioned | 0.40 |
| 2+ tools mentioned | 0.80 |
| 2+ tools + trigger/action pattern ("when X then Y") | 1.00 |

**Source:** `IntentResolverService.resolve(input).integrations.length`

#### 2. IntentResolver Confidence (weight: 0.25)
Deterministic pattern-matching score from `IntentResolver.ts:418-444`.

| Condition | Score |
|-----------|-------|
| No integrations found | 0.10 |
| 1 integration, no action | 0.50 |
| 2+ integrations | 0.70 |
| 2+ integrations + native support + detected action | 0.95 |

**Source:** `IntentResolverService.resolve(input).confidence`

#### 3. Claude Self-Report (weight: 0.20)
AI-judged confidence from the `confidence` field in Claude's JSON response.

Applied with dampening: `min(claudeReported, 0.90)` -- Claude is never trusted above 0.90 because it tends to over-report confidence.

**Source:** `aiResponse.confidence` from `NexusAIService.parseResponse()`

#### 4. Conversation Depth Score (weight: 0.15)
How much back-and-forth has occurred to refine the request?

| Condition | Score |
|-----------|-------|
| First message (0 prior exchanges) | 0.20 |
| 1 exchange (user asked, AI asked back, user answered) | 0.50 |
| 2 exchanges | 0.70 |
| 3+ exchanges on same topic | 0.90 |
| Clarifying questions answered | +0.20 bonus |

**Source:** Count of `messages` in `conversationHistory` where topic is related (not a new conversation thread). Topic continuity detected by checking if IntentResolver finds the same integrations across messages.

#### 5. Request Specificity Score (weight: 0.15)
How detailed and actionable is the request?

| Signal | Score Contribution |
|--------|-------------------|
| Contains action verb (send, save, create, etc.) | +0.20 |
| Contains trigger pattern (when, every time, if) | +0.20 |
| Contains specific parameters (email, phone, channel) | +0.15 |
| Contains 2+ action verbs (multi-step) | +0.15 |
| Message length > 20 words | +0.10 |
| Message length > 40 words with detail | +0.20 |
| Vague/complaint pattern ("help me", "struggling", "my X is bad") | -0.30 |

**Source:** Regex analysis of user message using existing patterns from `IntentResolver.ts`

---

### Gating Rules

```typescript
enum ConfidenceGate {
  NO_CARD = 'no_card',           // < 0.50: No workflow card shown
  CARD_DISABLED = 'card_disabled', // 0.50-0.69: Card shown, Execute disabled
  CARD_ENABLED = 'card_enabled',  // >= 0.70: Card shown, Execute enabled
}
```

| Enforced Confidence | Gate | User Experience |
|---------------------|------|-----------------|
| < 0.30 | NO_CARD | AI responds conversationally, asks clarifying questions |
| 0.30 - 0.49 | NO_CARD | AI acknowledges intent, asks "Which apps?" or "What should happen?" |
| 0.50 - 0.69 | CARD_DISABLED | Card appears with preview, Execute button grayed out + "Tell me more to enable" |
| 0.70 - 0.84 | CARD_ENABLED | Card with yellow confidence bar, Execute enabled, "May need adjustments" |
| 0.85 - 1.00 | CARD_ENABLED | Card with green confidence, "Ready to execute!" |

### User Override: "Just Build It" Button

When gate is `CARD_DISABLED` (0.50-0.69), show a small secondary action:

```tsx
<button className="text-xs text-slate-500 underline mt-1">
  Just build it anyway
</button>
```

This overrides the gate for THIS workflow only, setting `userOverride: true` on the workflow object. Does NOT change the confidence score.

---

## Example Scenario Calculations

### Scenario 1: "my sales are dropping"
```
intentResolver: 0 tools found -> confidence: 0.10
  toolSpecificity: 0 tools -> 0.00
  intentResolver: 0.10
  claude: likely 0.30 (vague complaint) -> dampened: 0.30
  conversationDepth: first message -> 0.20
  requestSpecificity:
    - no action verb: 0
    - no trigger: 0
    - no params: 0
    - complaint pattern ("dropping"): -0.30 -> clamp(0, -0.30) = 0.00

enforcedConfidence =
  (0.00 * 0.25) + (0.10 * 0.25) + (0.30 * 0.20) + (0.20 * 0.15) + (0.00 * 0.15)
= 0.00 + 0.025 + 0.06 + 0.03 + 0.00
= 0.115 -> ~0.12

Gate: NO_CARD (< 0.30)
Result: Nexus responds conversationally. "Tell me more about what's happening with your sales..."
```

### Scenario 2: "send my Gmail to Slack"
```
intentResolver: 2 tools (gmail, slack) -> confidence: 0.85
  toolSpecificity: 2 tools -> 0.80
  intentResolver: 0.85
  claude: likely 0.85 -> dampened: 0.85
  conversationDepth: first message -> 0.20
  requestSpecificity:
    - action verb "send": +0.20
    - 2 tools specific: (covered in toolSpecificity)
    - message clear but short: 0.00
    = 0.20

enforcedConfidence =
  (0.80 * 0.25) + (0.85 * 0.25) + (0.85 * 0.20) + (0.20 * 0.15) + (0.20 * 0.15)
= 0.20 + 0.2125 + 0.17 + 0.03 + 0.03
= 0.6425 -> ~0.64

Gate: CARD_DISABLED (0.50-0.69)
But this seems low for a clear request! The user SAID specific tools.
After one exchange (Claude asks "Forward all emails or just certain ones?", user answers "all"):
  conversationDepth: 1 exchange -> 0.50
  requestSpecificity: now has clarification answered -> 0.40

enforcedConfidence =
  (0.80 * 0.25) + (0.85 * 0.25) + (0.85 * 0.20) + (0.50 * 0.15) + (0.40 * 0.15)
= 0.20 + 0.2125 + 0.17 + 0.075 + 0.06
= 0.7175 -> ~0.72

Gate: CARD_ENABLED (>= 0.70)
Result: Card appears with Execute enabled.
```

**However**, since "send my Gmail to Slack" is quite clear on first message, we should allow a **first-message fast-track**: if IntentResolver confidence >= 0.80 AND toolSpecificity >= 0.80 AND Claude confidence >= 0.80, apply a +0.15 bonus for "high agreement across all signals."

With fast-track:
```
0.6425 + 0.15 = 0.79 -> CARD_ENABLED on first message
```

### Scenario 3: "help me onboard clients"
```
intentResolver: 0 tools -> confidence: 0.10
  toolSpecificity: 0 tools -> 0.00
  intentResolver: 0.10
  claude: likely 0.40 (understands intent, no specifics) -> dampened: 0.40
  conversationDepth: first message -> 0.20
  requestSpecificity:
    - action verb "help": +0.10 (weak verb)
    - "onboard" is domain-specific, not a trigger: 0
    - no params: 0
    = 0.10

enforcedConfidence =
  (0.00 * 0.25) + (0.10 * 0.25) + (0.40 * 0.20) + (0.20 * 0.15) + (0.10 * 0.15)
= 0.00 + 0.025 + 0.08 + 0.03 + 0.015
= 0.15 -> ~0.15

Gate: NO_CARD (< 0.30)
Result: "That's a great goal! Let me understand your onboarding process. What apps do you currently use?"
```

### Scenario 4: "when a new order comes in on Shopify, send WhatsApp confirmation"
```
intentResolver: 2 tools (whatsapp found; shopify may not be in patterns but detected by Claude)
  Let's say 1 found by IntentResolver (whatsapp) -> confidence: 0.60
  But Claude detects shopify too, so claude confidence: 0.90

  toolSpecificity: 1 detected by IntentResolver, but Claude's spec has 2 -> use max(IR, Claude): 2 tools
    2 tools + trigger pattern -> 1.00
  intentResolver: 0.60
  claude: 0.90 -> dampened: 0.90
  conversationDepth: first message -> 0.20
  requestSpecificity:
    - trigger pattern "when": +0.20
    - action verb "send": +0.20
    - specific context "new order", "confirmation": +0.15
    - multi-step (trigger + action): +0.15
    = 0.70

enforcedConfidence =
  (1.00 * 0.25) + (0.60 * 0.25) + (0.90 * 0.20) + (0.20 * 0.15) + (0.70 * 0.15)
= 0.25 + 0.15 + 0.18 + 0.03 + 0.105
= 0.715 -> ~0.72

Plus fast-track bonus (tool score 1.0, claude 0.90 >= 0.80): +0.15
= 0.865 -> ~0.87

Gate: CARD_ENABLED with green confidence bar
Result: "Ready to execute!" on first message.
```

---

## Complete TypeScript Implementation

### File: `src/services/ConversationConfidenceEngine.ts`

```typescript
/**
 * ConversationConfidenceEngine
 *
 * Unified confidence system that merges deterministic (IntentResolver),
 * stochastic (Claude), and conversational signals into an enforced
 * confidence score that GATES card creation and execution.
 *
 * Replaces the current decorative confidence display.
 */

import { IntentResolverService, type ResolvedIntent } from './IntentResolver'

// ================================
// TYPES
// ================================

export enum ConfidenceGate {
  NO_CARD = 'no_card',            // < 0.50
  CARD_DISABLED = 'card_disabled', // 0.50 - 0.69
  CARD_ENABLED = 'card_enabled',   // >= 0.70
}

export interface ConfidenceSignals {
  toolSpecificity: number      // 0-1: How many concrete tools were mentioned
  intentResolverScore: number  // 0-1: Deterministic pattern confidence
  claudeScore: number          // 0-1: AI self-reported confidence (dampened)
  conversationDepth: number    // 0-1: How many exchanges have refined this request
  requestSpecificity: number   // 0-1: How detailed/actionable the request is
}

export interface ConfidenceResult {
  enforcedConfidence: number   // 0-1: The final computed score
  gate: ConfidenceGate         // Which gate applies
  signals: ConfidenceSignals   // Individual signal breakdowns (for debug/display)
  fastTrackApplied: boolean    // Whether high-agreement bonus was applied
  reasoning: string            // Human-readable explanation of the score
}

export interface ConversationState {
  messageCount: number              // Total messages in conversation
  exchangeCount: number             // User-AI round-trips
  clarifyingQuestionsAnswered: number  // How many clarifying Qs were answered
  mentionedToolsAcrossConversation: Set<string>  // Cumulative tools mentioned
  topicContinuity: boolean          // Are recent messages about the same topic?
}

// ================================
// WEIGHTS
// ================================

const WEIGHTS = {
  toolSpecificity: 0.25,
  intentResolver: 0.25,
  claude: 0.20,
  conversationDepth: 0.15,
  requestSpecificity: 0.15,
} as const

// Fast-track bonus when all three main signals agree (>= 0.80)
const FAST_TRACK_BONUS = 0.15
const FAST_TRACK_THRESHOLD = 0.80

// Gate thresholds
const GATE_THRESHOLDS = {
  NO_CARD_MAX: 0.50,
  CARD_DISABLED_MAX: 0.70,
} as const

// Claude dampening ceiling
const CLAUDE_CONFIDENCE_CEILING = 0.90

// ================================
// VAGUE/COMPLAINT PATTERNS
// ================================

const COMPLAINT_PATTERNS = [
  /\b(help me|struggling|having trouble|can't|cannot|difficult|confused)\b/i,
  /\b(my .+ (is|are) (dropping|falling|bad|broken|slow|failing))\b/i,
  /\b(how (do|can) I|what should I|where do I)\b/i,
  /\b(need help|assist me|guidance|advice)\b/i,
]

const WEAK_VERBS = ['help', 'assist', 'need', 'want', 'try', 'figure']

// ================================
// ENGINE
// ================================

export class ConversationConfidenceEngine {
  private conversationState: ConversationState = {
    messageCount: 0,
    exchangeCount: 0,
    clarifyingQuestionsAnswered: 0,
    mentionedToolsAcrossConversation: new Set(),
    topicContinuity: true,
  }

  /**
   * Compute enforced confidence from all available signals.
   *
   * @param userMessage - The current user message
   * @param claudeConfidence - Claude's self-reported confidence (from AI response)
   * @param claudeWorkflowSpec - Whether Claude returned a workflowSpec
   * @param intentResolution - Pre-computed IntentResolver result (optional, computed if not provided)
   */
  compute(
    userMessage: string,
    claudeConfidence: number | undefined,
    claudeWorkflowSpec: boolean,
    intentResolution?: ResolvedIntent
  ): ConfidenceResult {
    // Resolve intent if not pre-computed
    const resolved = intentResolution ?? IntentResolverService.resolve(userMessage)

    // Update conversation state
    this.conversationState.messageCount++
    if (this.conversationState.messageCount % 2 === 0) {
      this.conversationState.exchangeCount++
    }
    for (const integration of resolved.integrations) {
      this.conversationState.mentionedToolsAcrossConversation.add(integration.normalizedName)
    }

    // Compute individual signals
    const signals: ConfidenceSignals = {
      toolSpecificity: this.computeToolSpecificity(resolved, userMessage),
      intentResolverScore: resolved.confidence,
      claudeScore: Math.min(claudeConfidence ?? 0.3, CLAUDE_CONFIDENCE_CEILING),
      conversationDepth: this.computeConversationDepth(),
      requestSpecificity: this.computeRequestSpecificity(userMessage, resolved),
    }

    // Weighted sum
    let enforcedConfidence =
      (signals.toolSpecificity * WEIGHTS.toolSpecificity) +
      (signals.intentResolverScore * WEIGHTS.intentResolver) +
      (signals.claudeScore * WEIGHTS.claude) +
      (signals.conversationDepth * WEIGHTS.conversationDepth) +
      (signals.requestSpecificity * WEIGHTS.requestSpecificity)

    // Fast-track bonus: when all major signals strongly agree
    let fastTrackApplied = false
    if (
      signals.toolSpecificity >= FAST_TRACK_THRESHOLD &&
      signals.intentResolverScore >= FAST_TRACK_THRESHOLD &&
      signals.claudeScore >= FAST_TRACK_THRESHOLD
    ) {
      enforcedConfidence += FAST_TRACK_BONUS
      fastTrackApplied = true
    }

    // If Claude did NOT return a workflowSpec, cap confidence at 0.49
    // (no spec = no card, regardless of signals)
    if (!claudeWorkflowSpec) {
      enforcedConfidence = Math.min(enforcedConfidence, 0.49)
    }

    enforcedConfidence = Math.max(0, Math.min(1, enforcedConfidence))

    // Determine gate
    const gate = enforcedConfidence < GATE_THRESHOLDS.NO_CARD_MAX
      ? ConfidenceGate.NO_CARD
      : enforcedConfidence < GATE_THRESHOLDS.CARD_DISABLED_MAX
        ? ConfidenceGate.CARD_DISABLED
        : ConfidenceGate.CARD_ENABLED

    // Generate reasoning
    const reasoning = this.generateReasoning(signals, enforcedConfidence, gate, fastTrackApplied)

    return {
      enforcedConfidence,
      gate,
      signals,
      fastTrackApplied,
      reasoning,
    }
  }

  /**
   * Record that a clarifying question was answered.
   * Call this when the user responds to a clarifying question prompt.
   */
  recordClarifyingAnswer(): void {
    this.conversationState.clarifyingQuestionsAnswered++
  }

  /**
   * Reset conversation state (for new chat sessions).
   */
  reset(): void {
    this.conversationState = {
      messageCount: 0,
      exchangeCount: 0,
      clarifyingQuestionsAnswered: 0,
      mentionedToolsAcrossConversation: new Set(),
      topicContinuity: true,
    }
  }

  /**
   * Signal that the topic has changed (e.g., user started asking about something unrelated).
   */
  markTopicChange(): void {
    this.conversationState.topicContinuity = false
    this.conversationState.exchangeCount = 0
    this.conversationState.clarifyingQuestionsAnswered = 0
    this.conversationState.mentionedToolsAcrossConversation.clear()
  }

  // ---- Private computation methods ----

  private computeToolSpecificity(resolved: ResolvedIntent, message: string): number {
    const toolCount = resolved.integrations.length

    // Also check for tools mentioned across the conversation
    const cumulativeToolCount = this.conversationState.mentionedToolsAcrossConversation.size

    const effectiveCount = Math.max(toolCount, cumulativeToolCount)

    if (effectiveCount === 0) return 0.00
    if (effectiveCount === 1) return 0.40

    // 2+ tools
    const lower = message.toLowerCase()
    const hasTriggerActionPattern =
      /\b(when|whenever|every time|if|once)\b/.test(lower) &&
      /\b(then|send|save|notify|create|add|update|post|upload|forward)\b/.test(lower)

    return hasTriggerActionPattern ? 1.00 : 0.80
  }

  private computeConversationDepth(): number {
    const { exchangeCount, clarifyingQuestionsAnswered, topicContinuity } = this.conversationState

    if (!topicContinuity) return 0.20 // Topic changed, reset depth

    let score = 0.20 // Base for first message

    if (exchangeCount >= 1) score = 0.50
    if (exchangeCount >= 2) score = 0.70
    if (exchangeCount >= 3) score = 0.90

    // Bonus for answered clarifying questions
    score += Math.min(clarifyingQuestionsAnswered * 0.10, 0.20)

    return Math.min(score, 1.0)
  }

  private computeRequestSpecificity(message: string, resolved: ResolvedIntent): number {
    const lower = message.toLowerCase()
    const words = lower.split(/\s+/)
    let score = 0

    // Check for action verbs (strong indicators)
    const strongVerbs = ['send', 'save', 'create', 'upload', 'notify', 'post', 'forward', 'sync', 'backup', 'export']
    if (strongVerbs.some(v => lower.includes(v))) {
      score += 0.20
    } else if (WEAK_VERBS.some(v => lower.includes(v))) {
      score += 0.10
    }

    // Check for trigger patterns
    if (/\b(when|whenever|every time|each time|if|once)\b/.test(lower)) {
      score += 0.20
    }

    // Check for extracted parameters (email, phone, channel, etc.)
    if (resolved.extractedParams.length > 0) {
      score += 0.15
    }

    // Multi-step indicator (multiple action verbs)
    const actionVerbCount = strongVerbs.filter(v => lower.includes(v)).length
    if (actionVerbCount >= 2) {
      score += 0.15
    }

    // Message length/detail
    if (words.length > 20) {
      score += 0.10
    }
    if (words.length > 40) {
      score += 0.10 // Additional for very detailed
    }

    // Penalty for complaint/vague patterns
    if (COMPLAINT_PATTERNS.some(p => p.test(lower))) {
      score -= 0.30
    }

    return Math.max(0, Math.min(score, 1.0))
  }

  private generateReasoning(
    signals: ConfidenceSignals,
    enforcedConfidence: number,
    gate: ConfidenceGate,
    fastTrack: boolean
  ): string {
    const parts: string[] = []

    if (signals.toolSpecificity === 0) {
      parts.push('No specific tools mentioned')
    } else if (signals.toolSpecificity >= 0.80) {
      parts.push('Clear tool references detected')
    }

    if (signals.requestSpecificity < 0.20) {
      parts.push('Request is vague - needs more detail')
    }

    if (signals.conversationDepth < 0.30) {
      parts.push('First message in conversation')
    } else if (signals.conversationDepth >= 0.70) {
      parts.push('Multiple exchanges have refined the request')
    }

    if (fastTrack) {
      parts.push('High agreement bonus applied')
    }

    const gateLabel = gate === ConfidenceGate.NO_CARD ? 'No card'
      : gate === ConfidenceGate.CARD_DISABLED ? 'Card preview only'
      : 'Ready to execute'

    return `${gateLabel} (${Math.round(enforcedConfidence * 100)}%): ${parts.join('. ')}`
  }
}

// Singleton
export const confidenceEngine = new ConversationConfidenceEngine()
```

---

## Integration Points

### 1. ChatContainer.tsx - Card Creation Gate

**Location:** Lines 1060-1074 (where `aiResponse.workflowSpec` triggers card creation)

**Current code (lines 1060-1061):**
```typescript
// Claude indicated workflow generation - use the workflowSpec if provided
if (aiResponse.workflowSpec) {
```

**New code:**
```typescript
// Compute enforced confidence BEFORE deciding whether to show card
import { confidenceEngine, ConfidenceGate } from '@/services/ConversationConfidenceEngine'

const confidenceResult = confidenceEngine.compute(
  userMessage,
  aiResponse.confidence,
  aiResponse.shouldGenerateWorkflow && !!aiResponse.workflowSpec,
  // intentResolution could be passed from earlier in the flow
)

console.log('[ChatContainer] Enforced confidence:', confidenceResult)

// GATE: If confidence is too low, suppress the card entirely
if (confidenceResult.gate === ConfidenceGate.NO_CARD) {
  // Show text response only - do NOT create workflow card
  const displayText = aiResponse.text || "Tell me more about what you'd like to automate."
  updateMessage(streamingMsg.id, { content: displayText, isStreaming: false })
  setIsLoading(false)
  return
}

// Claude indicated workflow generation - use the workflowSpec if provided
if (aiResponse.workflowSpec) {
  // ... existing card creation code ...

  // Add enforced confidence to workflow object (replaces Claude's self-report)
  const workflow = {
    ...baseWorkflow,
    confidence: confidenceResult.enforcedConfidence,  // ENFORCED, not Claude's
    assumptions: aiResponse.assumptions,
    missingInfo: aiResponse.missingInfo,
    confidenceGate: confidenceResult.gate,  // New field for WorkflowPreviewCard
    userOverride: false,  // Can be set by "Just build it" button
  }
```

### 2. WorkflowPreviewCard.tsx - Execute Button Gate

**Location:** Lines 3694-3695 (removed blocker) and the Execute button

**Restore gating with new system:**
```typescript
// In the Execute button area, check confidenceGate
const isExecuteDisabled =
  workflow.confidenceGate === 'card_disabled' && !workflow.userOverride

// Render:
{workflow.confidenceGate === 'card_disabled' && !workflow.userOverride && (
  <div className="px-4 pb-2 space-y-2">
    <p className="text-xs text-amber-400">
      Tell me a bit more to enable execution, or:
    </p>
    <button
      className="text-xs text-slate-500 underline hover:text-slate-300 transition-colors"
      onClick={() => {
        // Update workflow to set userOverride
        setWorkflow(prev => ({ ...prev, userOverride: true, confidenceGate: 'card_enabled' }))
      }}
    >
      Just build it anyway
    </button>
  </div>
)}

// Execute button:
<button
  disabled={isExecuteDisabled || isExecuting || isChecking}
  className={cn(
    isExecuteDisabled ? 'opacity-50 cursor-not-allowed' : '',
    // ... existing classes
  )}
>
  {isExecuteDisabled ? 'Tell me more...' : 'Execute Workflow'}
</button>
```

### 3. WorkflowPreviewCard.tsx - Confidence Display Update

**Location:** Lines 3380-3402 (confidence bar)

No changes needed -- the existing confidence display already shows the value correctly. The difference is now it shows the **enforced** confidence (computed by the engine) rather than Claude's self-reported value.

### 4. NexusAIService.ts - Pass Intent Resolution Through

**Location:** Lines 293-311 (IntentResolver pre-parse)

Save the `resolved` object so it can be passed to `ConversationConfidenceEngine.compute()`:

```typescript
// In chat() and chatStream(), after IntentResolver runs:
let lastIntentResolution: ResolvedIntent | undefined

try {
  const resolved = IntentResolverService.resolve(userMessage)
  lastIntentResolution = resolved  // Save for confidence engine
  // ... existing intentContext building ...
}
```

Then expose it in the response or pass it to ChatContainer via a new field.

### 5. ChatContainer.tsx - Conversation State Tracking

When the user answers a clarifying question:
```typescript
// In the handler for clarifying question answers:
confidenceEngine.recordClarifyingAnswer()
```

When a new chat session starts:
```typescript
// In clearHistory / new chat handler:
confidenceEngine.reset()
```

---

## Type Changes Required

### GeneratedWorkflow (SmartWorkflowEngine.ts)

Add two new optional fields:

```typescript
export interface GeneratedWorkflow {
  // ... existing fields ...
  confidence?: number
  assumptions?: string[]
  missingInfo?: MissingInfoItem[]
  confidenceGate?: 'no_card' | 'card_disabled' | 'card_enabled'  // NEW
  userOverride?: boolean  // NEW
}
```

---

## Summary of Changes

| File | Change | Lines Affected |
|------|--------|----------------|
| **NEW** `src/services/ConversationConfidenceEngine.ts` | Complete new service | ~250 lines |
| `src/components/chat/ChatContainer.tsx` | Gate card creation with enforced confidence | ~1060-1074 |
| `src/components/chat/WorkflowPreviewCard.tsx` | Restore execution gate, add "Just build it" button | ~3694, Execute button area |
| `src/services/NexusAIService.ts` | Expose IntentResolver result for confidence engine | ~293-311 |
| `src/services/SmartWorkflowEngine.ts` | Add `confidenceGate` and `userOverride` to GeneratedWorkflow type | ~331-334 |

---

## Testing Matrix

| Input | Expected Enforced Confidence | Expected Gate |
|-------|------------------------------|---------------|
| "my sales are dropping" | ~0.12 | NO_CARD |
| "help me onboard clients" | ~0.15 | NO_CARD |
| "I need a workflow" | ~0.20 | NO_CARD |
| "send email" | ~0.35 | NO_CARD |
| "send my Gmail to Slack" | ~0.79 (with fast-track) | CARD_ENABLED |
| "when new order on Shopify, send WhatsApp confirmation" | ~0.87 (with fast-track) | CARD_ENABLED |
| "save Slack messages to Google Sheets" | ~0.75 | CARD_ENABLED |
| "help me manage my team better" | ~0.10 | NO_CARD |
| After 2 exchanges refining "onboard clients" | ~0.55-0.65 | CARD_DISABLED |
| After "Just build it" override | previous + override | CARD_ENABLED |

---

## Why This Design Works

1. **No single system dominates.** Claude can say confidence: 0.95 but if the user said nothing specific, enforced confidence will be ~0.35.

2. **Conversation rewards depth.** Answering clarifying questions genuinely increases confidence, encouraging the designed two-phase flow.

3. **The gate is real.** Unlike the current decorative bar, this actually prevents card creation for vague requests.

4. **User override exists.** Power users who know what they want can bypass the gate, preserving the "zero friction" principle for experienced users.

5. **Fast-track prevents over-gating.** Clear requests like "send Gmail to Slack" don't get punished by the conversation depth requirement -- the high agreement bonus kicks in.

6. **Deterministic + stochastic merge.** IntentResolver provides a reliable floor; Claude provides nuance; conversation state provides progression. None can be gamed alone.
