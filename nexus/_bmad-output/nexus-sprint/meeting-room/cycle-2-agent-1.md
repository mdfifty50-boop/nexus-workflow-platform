# Cycle 2 - Agent 1: Interface Contract Analysis

## Mission: Investigate IntentResolver <-> WorkflowIntelligence Compatibility & Insertion Points

**Agent:** Intent Recognition Specialist
**Date:** 2026-02-15
**Files Analyzed:**
- `nexus/src/services/IntentResolver.ts` (546 lines)
- `nexus/src/lib/workflow-engine/workflow-intelligence.ts` (865 lines)
- `nexus/server/routes/chat.ts` (493 lines)
- `nexus/src/services/NexusAIService.ts` (311 lines)
- `nexus/src/components/chat/ChatContainer.tsx` (key sections around lines 630-920)
- `nexus/src/services/NexusWorkflowEngine.ts` (first 120 lines for interface definitions)
- `nexus/src/services/ToolRegistry.ts` (SupportResolution interface)

---

## 1. IntentResolver: Complete Interface Contract

### Location
`nexus/src/services/IntentResolver.ts` (line 1-546)

### INPUT Contract

The primary entry point is `IntentResolverService.resolve(input: string)` (line 158). It takes a **single raw string** -- the user's natural language message.

```typescript
// INPUT: A plain string
IntentResolverService.resolve(input: string): ResolvedIntent
```

Additional utility methods also accept raw strings:
- `isWorkflowRequest(input: string): boolean` (line 487) -- quick check, no full resolution
- `getPrimaryIntentType(input: string): 'trigger' | 'action' | 'mixed'` (line 509)
- `getMentionedIntegrations(input: string): string[]` (line 533) -- lightweight extraction

### OUTPUT Contract

```typescript
export interface ResolvedIntent {
  success: boolean;             // Whether any integrations were detected
  rawInput: string;             // The original user input, trimmed
  integrations: IntegrationIntent[];  // Detected integrations with resolved actions
  extractedParams: ExtractedParam[];  // Emails, phones, URLs, dates, channels, paths
  unsupportedTools: UnsupportedToolIntent[];  // Tools user wants but aren't available
  confidence: number;           // 0.1 to 0.95 (capped)
  interpretation: string;       // Human-readable sentence describing intent
}
```

Where the sub-types are:

```typescript
export interface IntegrationIntent {
  name: string;                          // Raw integration name (e.g., "gmail")
  normalizedName: string;                // Normalized via ToolRegistry (e.g., "gmail")
  action: string;                        // Standardized action: send|save|read|list|create|update|delete|default
  actionVerb: string;                    // Original verb found in text (e.g., "email")
  supportLevel: 'native' | 'api_key' | 'alternative' | 'unsupported';
  suggestedSlug?: string;                // Composio tool slug (e.g., "GMAIL_SEND_EMAIL")
  suggestedTool?: ToolDefinition;        // Full tool definition from ToolRegistry
}

export interface ExtractedParam {
  type: 'email' | 'phone' | 'url' | 'date' | 'time' | 'number' | 'channel' | 'path';
  value: string;
  context: string;             // 20 chars surrounding the match
  forIntegration?: string;     // Assigned integration (e.g., "gmail" for emails)
}

export interface UnsupportedToolIntent {
  requested: string;
  alternatives: Array<{ toolkit: string; name: string; confidence: number }>;
  hasAPIKeyOption: boolean;
  apiKeySetup?: { displayName: string; apiDocsUrl: string; steps: string[] };
}
```

### Dependencies
- `ToolRegistryService` from `./ToolRegistry` -- for `resolveSupportLevel()`, `resolveToolSlug()`, `normalizeIntegration()`
- All methods are **static** -- no instantiation needed, no constructor, no state.
- **Purely synchronous** -- `resolve()` returns immediately, no async/await.

### Key Observations
1. It operates entirely client-side with regex pattern matching. No AI/LLM calls.
2. Confidence calculation ranges from 0.1 (no integrations found) to 0.95 max.
3. It handles 30+ integrations via INTEGRATION_PATTERNS and maps 7 action verb categories.
4. The interpretation string is human-readable and could be shown in UI.
5. The `isWorkflowRequest()` utility is useful for early routing before full resolution.

---

## 2. WorkflowIntelligence: Complete Interface Contract

### Location
`nexus/src/lib/workflow-engine/workflow-intelligence.ts` (line 1-865)

### INPUT Contract

The primary entry point is `WorkflowIntelligence.analyzeRequest(userRequest: string)` (line 423). It takes a **single raw string**.

```typescript
// Constructor: optional region string
const intelligence = new WorkflowIntelligence(region?: string);

// INPUT: A plain string
intelligence.analyzeRequest(userRequest: string): IntelligenceAnalysis
```

There are also convenience functions exported:
```typescript
export function analyzeUserRequest(request: string, region?: string): IntelligenceAnalysis
export function getIntelligenceSummary(request: string, region?: string): string
```

### OUTPUT Contract

```typescript
export interface IntelligenceAnalysis {
  surfaceRequest: string;                         // Original user request
  implicitRequirements: ImplicitRequirement[];    // What's needed but not stated
  clarifyingQuestions: ClarifyingQuestion[];       // Smart questions to ask
  recommendedTools: ToolRecommendation[];          // Optimal tool picks
  workflowChain: WorkflowChainStep[];             // Complete chain of steps
  regionalContext: RegionalContext | null;          // Kuwait/Gulf context
  confidenceScore: number;                         // 0-100 scale (NOT 0-1)
}
```

Where the sub-types are:

```typescript
export interface ImplicitRequirement {
  category: string;           // Layer: 'input' | 'processing' | 'output' | 'notification'
  description: string;        // What's needed
  reason: string;             // Why it's needed
  priority: 'critical' | 'important' | 'optional';
  suggestedTools: string[];   // Human-readable tool names (NOT Composio slugs)
}

export interface ClarifyingQuestion {
  id: string;                 // e.g., "q1", "q2"
  question: string;           // The question text
  category: 'language' | 'frequency' | 'audience' | 'format' | 'platform' | 'region' | 'integration';
  options: QuestionOption[];  // Multiple choice options
  required: boolean;
  relevanceScore: number;     // 0-100
}

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
  implications?: string[];
}

export interface ToolRecommendation {
  toolSlug: string;           // Composio-style slug (e.g., "ELEVENLABS_SCRIBE")
  toolName: string;           // Human-readable name
  score: number;              // 0-100
  reasons: string[];          // Why recommended
  regionalFit: number;        // 0-100
  accuracyRating?: string;    // e.g., "96.9%"
  dialectSupport?: string[];  // e.g., ["Gulf Arabic", "Kuwaiti"]
  alternatives: AlternativeTool[];
}

export interface WorkflowChainStep {
  step: number;
  layer: 'input' | 'processing' | 'output' | 'notification';
  description: string;
  requiredCapability: string;
  suggestedTools: string[];
  isResolved: boolean;
}

export interface RegionalContext {
  region: string;
  language: string;
  dialect?: string;
  businessHours: string;
  preferredChannels: string[];
  paymentMethods: string[];
  complianceRequirements: string[];
}
```

### Additional Methods
- `isExecutionReady(analysis: IntelligenceAnalysis): { ready: boolean; missingPieces: string[]; recommendations: string[] }` (line 743)
- `getSummary(analysis: IntelligenceAnalysis): string` (line 787) -- Markdown-formatted summary

### Key Observations
1. **Purely synchronous** -- no async, no LLM calls. All pattern/keyword matching.
2. Requires **instantiation** with optional region -- `new WorkflowIntelligence('kuwait')`.
3. Confidence is on a **0-100 scale** (vs IntentResolver's 0-1 scale).
4. Focuses on **higher-level intelligence**: workflow patterns (7 domain patterns), implicit requirements, dialect-aware tool recommendations, and regional context.
5. It does NOT detect specific integrations by name like IntentResolver does. It detects _workflow categories_ (meeting_documentation, email_automation, crm_pipeline, etc.).
6. Tool recommendations are primarily about **language/transcription tools** currently. General tool resolution is thin.

---

## 3. Compatibility Analysis: Can IntentResolver Feed Into WorkflowIntelligence?

### Direct Feed Assessment: NO -- They Are Complementary, Not Sequential

These two modules solve **different problems** at **different abstraction levels**:

| Dimension | IntentResolver | WorkflowIntelligence |
|-----------|---------------|---------------------|
| **Abstraction** | Low-level: specific integrations + actions | High-level: workflow patterns + intelligence |
| **Detects** | "Gmail + Slack + send action" | "This is a meeting_documentation workflow" |
| **Parameters** | Extracts emails, phones, URLs, channels | Identifies implicit needs (recording, transcription) |
| **Confidence scale** | 0.0 - 0.95 | 0 - 100 |
| **Tool resolution** | Composio slugs via ToolRegistry | Human-readable tool names + dialect-aware |
| **Questions** | None (no question generation) | Smart clarifying questions with options |
| **Regional** | No regional awareness | Full Kuwait/Gulf context |
| **State** | Stateless (all static methods) | Stateful (constructor takes region) |
| **Sync/Async** | Synchronous | Synchronous |

### The Gap: Neither Module's Output Maps to the Other's Input

Both modules accept `string` as input (the user message). IntentResolver's `ResolvedIntent` output has no direct consumer in WorkflowIntelligence -- WorkflowIntelligence does not accept a `ResolvedIntent`. They both independently analyze the same raw string.

### The Opportunity: They Should Be COMBINED, Not Chained

The ideal architecture is to run **both in parallel** on the same user message and then **merge their results** into a unified analysis. Here is why:

1. IntentResolver provides **specific integration detection** that WorkflowIntelligence lacks (it doesn't know the user mentioned "Gmail" vs "Slack").
2. WorkflowIntelligence provides **domain pattern detection** and **implicit requirement surfacing** that IntentResolver lacks (it doesn't know about workflow chain patterns or regional context).
3. IntentResolver provides **extracted parameters** (emails, phone numbers) that WorkflowIntelligence should use to pre-fill its workflow chain steps.
4. WorkflowIntelligence provides **clarifying questions** that IntentResolver could benefit from to increase its confidence.

### Recommended Adapter: `UnifiedIntentAnalysis`

A new adapter layer should merge both outputs:

```typescript
interface UnifiedIntentAnalysis {
  // From IntentResolver
  detectedIntegrations: IntegrationIntent[];
  extractedParams: ExtractedParam[];
  unsupportedTools: UnsupportedToolIntent[];
  isWorkflowRequest: boolean;
  primaryIntentType: 'trigger' | 'action' | 'mixed';

  // From WorkflowIntelligence
  workflowPattern: string | null;  // e.g., "meeting_documentation"
  implicitRequirements: ImplicitRequirement[];
  clarifyingQuestions: ClarifyingQuestion[];
  recommendedTools: ToolRecommendation[];
  workflowChain: WorkflowChainStep[];
  regionalContext: RegionalContext | null;

  // Merged
  unifiedConfidence: number;  // Normalized 0-1 from both signals
  interpretation: string;     // Best interpretation from either module
  readyToGenerate: boolean;   // Can we generate a workflow without more questions?
}
```

---

## 4. Insertion Point Analysis: Server-Side (chat.ts)

### Current Flow (chat.ts, lines 157-464)

```
POST /api/chat
  |
  v
[1] Rate limiter (line 159)
  |
  v
[2] Template matching (lines 202-219) -- bypasses Claude for exact matches
  |
  v
[3] Agent routing (lines 222-238) -- selects which agent personality
  |
  v
[4] App detection via appDetectionService (lines 252-298) -- detects tools, custom integrations
  |
  v
[5] Build system prompt (line 307) -- injects user context + tool context
  |
  v
[6] Call Claude via callClaudeWithCaching (lines 311-351)
  |
  v
[7] Return response with custom integrations
```

### WHERE to Insert IntentResolver (Server-Side)

**Recommended: Between steps [2] and [3], at approximately line 220.**

Rationale:
- After template matching fails (templates handle exact matches), IntentResolver can perform client-side-quality intent parsing on the server.
- IntentResolver's `isWorkflowRequest()` could replace or supplement the template matching threshold check.
- The `ResolvedIntent` can enrich the Claude system prompt with structured intent data, making Claude's responses more accurate and structured.

**Specific insertion:**

```typescript
// After line 219 (template matching block):

// === NEW: Intent pre-analysis ===
import { IntentResolverService } from '../services/IntentResolver.js'

if (lastUserMessage?.content) {
  const resolvedIntent = IntentResolverService.resolve(lastUserMessage.content);
  if (resolvedIntent.success) {
    // Inject resolved intent into system prompt context
    const intentContext = `
## PRE-ANALYZED USER INTENT
Integrations detected: ${resolvedIntent.integrations.map(i => `${i.normalizedName}(${i.action})`).join(', ')}
Extracted params: ${resolvedIntent.extractedParams.map(p => `${p.type}=${p.value}`).join(', ')}
Confidence: ${resolvedIntent.confidence}
Interpretation: ${resolvedIntent.interpretation}
`;
    enrichedUserContext = (enrichedUserContext || '') + intentContext;
  }
}
```

### Risk Assessment (Server-Side Insertion)
- **LOW RISK:** IntentResolver is purely synchronous, stateless, and has no side effects.
- **DEPENDENCY:** It imports from `ToolRegistryService` which is a client-side service. Moving IntentResolver to the server would require also making ToolRegistry available server-side, or creating a server-side copy.
- **CRITICAL ISSUE:** IntentResolver currently lives in `src/services/` (frontend). The server runs from `server/`. There is a module boundary to cross. Two options:
  1. Duplicate IntentResolver into `server/services/` (quick but creates drift)
  2. Move it to a `shared/` directory importable by both (correct but more refactoring)
- **FIX PROTECTION:** chat.ts has `@NEXUS-FIX-102` (rate limiter) and `@NEXUS-FIX-126` (template-first). Neither would be affected by adding a new code block between them and the Claude call.

---

## 5. Insertion Point Analysis: Frontend (NexusAIService.ts & ChatContainer.tsx)

### Current Frontend Flow (ChatContainer.tsx)

```
User sends message
  |
  v
[A] If conversation state is 'asking_questions' --> collect answer, loop or build workflow (lines 615-689)
  |
  v
[B] Call nexusAIService.chat(content, { chatMode }) --> Claude API (line 703)
  |
  v
[C] Parse response:
    - If NOT shouldGenerateWorkflow --> display text + clarifying questions (lines 716-766)
    - If shouldGenerateWorkflow --> convert spec to visual workflow (lines 769-851)
  |
  v
[D] FALLBACK: If Claude fails --> nexusWorkflowEngine.analyzeIntent() template system (lines 857-920+)
```

### WHERE to Insert WorkflowIntelligence (Frontend)

**Recommended: Between steps [A] and [B], at approximately line 695-700, BEFORE the Claude call.**

This is where WorkflowIntelligence adds the most value: by analyzing the request BEFORE sending it to Claude, the system can:
1. Detect implicit requirements and include them in the Claude prompt
2. Generate clarifying questions locally (without an API call) for obvious patterns
3. Decide whether to ask clarifying questions FIRST or go straight to Claude

**Specific insertion in ChatContainer.tsx:**

```typescript
// Around line 695, before the Claude call:

// === NEW: Local intelligence analysis (runs before Claude) ===
import { WorkflowIntelligence } from '@/lib/workflow-engine/workflow-intelligence'

const intelligence = new WorkflowIntelligence('kuwait');  // Or from user profile
const localAnalysis = intelligence.analyzeRequest(content);

// If local analysis found a clear workflow pattern with required questions,
// ask them BEFORE calling Claude (saves an API call)
if (localAnalysis.confidenceScore >= 60 &&
    localAnalysis.clarifyingQuestions.filter(q => q.required).length > 0 &&
    conversationState === 'idle') {
  // Route to question-asking flow without calling Claude
  const questions = localAnalysis.clarifyingQuestions
    .filter(q => q.required)
    .map((q, i) => ({
      id: q.id,
      question: q.question,
      purpose: q.category,
      type: 'choice' as const,
      options: q.options.map(o => ({ value: o.value, label: o.label })),
      required: q.required
    }));

  if (questions.length > 0) {
    setConversationState('asking_questions');
    setPendingQuestions(questions);
    addMessage(questions[0].question, 'assistant');
    setIsLoading(false);
    return;
  }
}
```

### Alternative Insertion in NexusAIService.ts

WorkflowIntelligence could also be inserted into `NexusAIService.chat()` at line 136 (after building user context, before the fetch call):

```typescript
// In NexusAIService.chat(), around line 136:
import { analyzeUserRequest } from '@/lib/workflow-engine/workflow-intelligence'

const intelligence = analyzeUserRequest(userMessage, 'kuwait');
// Append intelligence summary to the request body sent to server
body: JSON.stringify({
  messages: this.conversationHistory,
  agentId: 'nexus',
  model: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
  chatMode: context?.chatMode || 'standard',
  userContext: userContext || undefined,
  intelligenceContext: intelligence  // NEW: pre-analyzed intelligence
})
```

**This is the LESS invasive option** -- it enriches the data sent to the server without changing the ChatContainer's flow control logic.

### Risk Assessment (Frontend Insertion)

| Risk | Severity | Mitigation |
|------|----------|------------|
| Question format mismatch | MEDIUM | WorkflowIntelligence's `ClarifyingQuestion` has a different shape than `SmartNexusQuestion` used by ChatContainer. Needs adapter. |
| Confidence scale conflict | LOW | IntentResolver uses 0-1, WorkflowIntelligence uses 0-100. Normalize in adapter. |
| Region detection | LOW | WorkflowIntelligence needs region at construction. Can pull from `userMemoryService` or `localStorage('nexus_business_profile')`. |
| Duplicate analysis | LOW | If both IntentResolver AND WorkflowIntelligence run, the user message is analyzed twice by two different pattern matchers. This is fine -- they detect different things. |
| Fix marker protection | NONE | No `@NEXUS-FIX-*` markers in the insertion zones. Safe to add new code. |
| Performance | VERY LOW | Both modules are synchronous regex-based. Sub-millisecond execution. No concern. |

---

## 6. Question Format Adapter Needed

ChatContainer uses `SmartNexusQuestion` from NexusWorkflowEngine:

```typescript
// NexusWorkflowEngine.ts (line 30-38)
export interface SmartNexusQuestion {
  id: string;
  question: string;
  purpose: string;
  type: 'text' | 'choice' | 'multi-select' | 'date' | 'number';
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  required: boolean;
}
```

WorkflowIntelligence uses its own `ClarifyingQuestion`:

```typescript
// workflow-intelligence.ts (line 26-33)
export interface ClarifyingQuestion {
  id: string;
  question: string;
  category: 'language' | 'frequency' | 'audience' | 'format' | 'platform' | 'region' | 'integration';
  options: QuestionOption[];   // { value, label, description?, implications? }
  required: boolean;
  relevanceScore: number;
}
```

**Adapter function needed:**

```typescript
function adaptClarifyingQuestion(q: ClarifyingQuestion): SmartNexusQuestion {
  return {
    id: q.id,
    question: q.question,
    purpose: q.category,
    type: q.options.length > 0 ? 'choice' : 'text',
    options: q.options.map(o => ({ value: o.value, label: o.label })),
    required: q.required,
  };
}
```

This is a straightforward mapping. The only information lost is `description`, `implications`, and `relevanceScore` -- none of which the current ChatContainer uses.

---

## 7. Confidence Normalization

| Module | Scale | Current Range | Notes |
|--------|-------|---------------|-------|
| IntentResolver | 0.0 - 0.95 | Hard-capped at 0.95 | Based on integration count + action detection |
| WorkflowIntelligence | 0 - 100 | Typically 30-90 | Based on pattern + region - unanswered questions |
| NexusAIResponse (from Claude) | 0.0 - 1.0 | AI-determined | From Claude's JSON response |
| ChatContainer threshold | -- | 0.3 minimum for template system | Line 869 |

**Recommendation:** Normalize all confidences to 0.0 - 1.0 in the unified adapter:
- IntentResolver: use as-is (already 0-1)
- WorkflowIntelligence: divide by 100
- Combined: weighted average (e.g., 0.6 * IntentResolver + 0.4 * WorkflowIntelligence)

---

## 8. Summary of Findings

### Key Conclusions

1. **IntentResolver and WorkflowIntelligence are COMPLEMENTARY, not sequential.** They analyze the same input string at different abstraction levels. IntentResolver finds specific tools and actions; WorkflowIntelligence finds workflow patterns, implicit needs, and generates questions.

2. **Both are currently UNUSED in the live system.** Neither is imported by ChatContainer, NexusAIService, or chat.ts. They are fully implemented but disconnected.

3. **No adapter exists today.** A `UnifiedIntentAnalysis` adapter layer is needed to merge their outputs.

4. **Server-side insertion requires module boundary crossing.** IntentResolver lives in `src/services/` (frontend). Using it in `server/routes/chat.ts` requires either duplicating it or creating a shared module.

5. **Frontend insertion is cleaner.** WorkflowIntelligence can be inserted in ChatContainer before the Claude API call, or in NexusAIService to enrich the request context.

6. **Question format adapter is trivial.** The `ClarifyingQuestion` to `SmartNexusQuestion` mapping is a simple field rename.

7. **No fix markers at risk.** The recommended insertion points are in blank zones between existing features. No `@NEXUS-FIX-*` markers would be disturbed.

### Recommended Wiring Priority

| Priority | Action | Effort | Impact |
|----------|--------|--------|--------|
| 1 | Insert IntentResolver in ChatContainer before Claude call (line ~695) | Low (10 lines) | Pre-filters workflow vs chat, saves API calls |
| 2 | Insert WorkflowIntelligence in ChatContainer for local question generation | Medium (30 lines + adapter) | Generates clarifying questions without Claude |
| 3 | Create UnifiedIntentAnalysis adapter merging both outputs | Medium (new file, ~80 lines) | Single analysis object for all consumers |
| 4 | Enrich server-side Claude prompt with IntentResolver data | High (module boundary) | Better Claude responses with pre-analyzed intent |
| 5 | Use IntentResolver.isWorkflowRequest() to short-circuit non-workflow chat | Low (5 lines) | Avoids unnecessary workflow analysis on greetings |

### Architecture Diagram

```
User Message (string)
    |
    +---> IntentResolver.resolve()          [SYNC, client-side]
    |        |
    |        +---> ResolvedIntent
    |                 - integrations[]
    |                 - extractedParams[]
    |                 - confidence (0-1)
    |
    +---> WorkflowIntelligence.analyzeRequest()  [SYNC, client-side]
    |        |
    |        +---> IntelligenceAnalysis
    |                 - workflowChain[]
    |                 - clarifyingQuestions[]
    |                 - implicitRequirements[]
    |                 - confidenceScore (0-100)
    |
    +---> [NEW] UnifiedIntentAnalysis adapter    [SYNC, client-side]
    |        |
    |        +---> Merged analysis
    |                 - ready to route?
    |                 - need questions first?
    |                 - enriched context for Claude
    |
    v
  Decision Router:
    - If NOT workflow request --> Claude for conversational response
    - If workflow + low confidence --> Ask clarifying questions locally
    - If workflow + high confidence --> Claude with enriched context --> WorkflowPreviewCard
```

---

*Report complete. No code was modified during this analysis.*
