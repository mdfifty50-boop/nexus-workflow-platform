# Archaeologist Report: What Changed in the Nexus AI Brain (Feb 16-18, 2026)

## EXECUTIVE SUMMARY

**YES, the CEO added a fundamentally new AI workflow creation path around Feb 16-17, 2026.** Specifically:

1. **A new "AI node" was added as a real execution node inside workflows** (commit `ca89e7d`, Feb 16) -- this is the "AI brain as a node that generates things by itself."
2. **This did NOT replace the existing Claude-based workflow creation path** -- it added a PARALLEL execution capability inside workflow steps.
3. **Five bugs caused by this new path were fixed on Feb 18** (commit `5bbb179`), confirming it was breaking things.

There are now **THREE distinct workflow creation/execution paths** in Nexus, which is important context for the brain audit.

---

## TIMELINE OF CHANGES

### Feb 16, 2026 (16:39 AST) -- `8bab91a`
**"Implement batches 1-7: 34 findings across AI intelligence, execution pipeline, streaming/UX, Arabic/bilingual, WhatsApp commerce"**

MASSIVE commit (76 files, +14,802 / -3,531 lines). Key changes:
- Enhanced NexusAIService with 5-layer intelligence architecture
- Added 115+ workflow pattern mappings with regional context
- Implemented IntentResolver, ParamResolutionPipeline, ToolRegistry
- Added UserMemoryService and DailyAdviceService
- Streaming AI responses with progressive disclosure
- Chat persistence service
- WhatsApp Web integration via Baileys (QR + pairing code)
- Refactored WorkflowPreviewCard into multiple sub-modules (wpc-*.tsx)

**This commit established the MAIN workflow creation path** via Claude's system prompt returning JSON with `workflowSpec`.

### Feb 16, 2026 (23:30 AST) -- `ca89e7d` [THE KEY COMMIT]
**"Universal Workflow Execution Engine: real AI generation + native WhatsApp + model tiering"**

6 files changed, +375 / -26 lines. This commit introduced:

#### FIX-144: AI Node as Real Execution Step
- **BEFORE**: AI nodes in workflows were FAKE -- they did a `setTimeout(500)` and logged "AI analysis complete" with no actual generation.
- **AFTER**: AI nodes now call `POST /api/workflow/ai-step` which invokes `callClaudeWithTiering()` with real Claude models.
- Added `AI_INTERNAL_TOOLKITS` set to detect AI nodes: `'ai', 'nexus-ai', 'claude', 'anthropic', 'openai', 'generate', 'summarize', 'translate', 'transform', 'analyze', 'filter', 'condition', 'format'`
- Added regex catch-all: `/\b(generat|compose|write|summariz|analyz|translat|classify|extract text|draft|creat)\b/i`
- AI node output now flows to downstream steps as `type: 'ai_output'` with `generated` and `text` fields

#### FIX-145: AI Output Data Flow
- Previous step results are gathered and passed as context to the AI step
- Auto-gauges complexity (simple/moderate/complex) to select model tier

#### FIX-146: Native WhatsApp via Baileys
- `tool: "whatsapp"` now routes to native Baileys API (NOT Composio)
- `tool: "whatsapp-business"` still routes to Composio
- Default changed from "whatsapp-business" to "whatsapp" for all WhatsApp mentions

#### FIX-147: Backend /ai-step Endpoint
- New `POST /api/workflow/ai-step` route in `server/routes/workflow.ts`
- Uses `callClaudeWithTiering()` with model tiering:
  - `simple` -> Haiku ($0.80/1M tokens) -- quotes, greetings, one-liners
  - `moderate` -> Sonnet ($3/1M tokens) -- summaries, reports, email drafts
  - `complex` -> Opus ($15/1M tokens) -- business analysis, strategic planning
- System prompt: "You are an AI step in a workflow automation pipeline. Produce the requested output directly."

#### Changes to System Prompt (`server/agents/index.ts`)
- Added `## AI-POWERED STEPS (CRITICAL - READ CAREFULLY)` section
- Instructs Claude to use `tool: "ai"` (not "generate" or "openai") for AI-powered steps
- Added complexity guide in the prompt
- Added `## WHATSAPP PERSONAL (CRITICAL)` section
- Changed WhatsApp default from "whatsapp-business" to "whatsapp"

### Feb 17, 2026 -- `0c01550`, `b18bb88`
Bug fixes: onboarding issues, UX bugs from marathon testing (FIX-148 to FIX-150, FIX-158, FIX-159). Not directly AI-brain related.

### Feb 18, 2026 (08:40 AST) -- `5bbb179` [THE BUG FIX COMMIT]
**"Fix 5 AI brain bugs: premature workflow card, JSON leak, race condition (FIX-163 to FIX-167)"**

Root cause: User typed "my sales are dropping" -> Claude immediately generated "Gmail to Google Sheets" workflow with raw JSON visible, ignoring the three-phase discovery system. Five compounding bugs:

#### FIX-163: JSON Flash During Streaming
- **Before**: `trimmed.length > 3` check allowed 1-3 raw JSON tokens to flash on screen
- **After**: Detection starts from first `{` character

#### FIX-164: Safe Server Complete Event
- Never dump raw `fullText` to frontend when streaming completes

#### FIX-165: Complaint/Problem Pattern Detection
- Added business problem patterns to vagueness triggers: "dropping", "declining", "going down", "struggling"
- Added Arabic equivalents: "تنخفض", "ينخفض", "تراجع"
- These now force diagnostic questions BEFORE workflow generation
- Confidence forced below 0.40 for complaint patterns

#### FIX-166: Double Conversation History Push
- Guard against `chatStream()` pushing user message twice into Claude's context

#### FIX-167: Clarifying Questions Gate
- If Claude returns BOTH `shouldGenerateWorkflow: true` AND `clarifyingQuestions`, suppress the workflow card
- Display questions first, generate workflow only after answers

---

## THE THREE WORKFLOW CREATION/EXECUTION PATHS

### Path 1: Claude System Prompt -> JSON WorkflowSpec (MAIN PATH)
**Files**: `server/agents/index.ts`, `server/routes/chat.ts`, `src/components/chat/ChatContainer.tsx`

1. User types message in chat
2. Message goes to Claude via `chatStream()` in `server/routes/chat.ts`
3. Claude's system prompt (in `server/agents/index.ts`) instructs it to return JSON with `shouldGenerateWorkflow: true` + `workflowSpec`
4. `ChatContainer.tsx` parses the JSON response
5. If `shouldGenerateWorkflow: true` AND no pending clarifying questions (FIX-167), creates `WorkflowPreviewCard`
6. User clicks Execute -> `WorkflowPreviewCard` handles execution via Composio + AI nodes + WhatsApp

**This is the "AI brain that creates the workflow."** Claude decides the workflow structure, steps, and integrations.

### Path 2: Workflow Engine (Intent Parser -> Workflow Generator -> Orchestrator)
**Files**: `src/lib/workflow-engine/intent-parser.ts`, `src/lib/workflow-engine/workflow-generator.ts`, `src/lib/workflow-engine/orchestrator.ts`

1. Natural language input goes to `IntentParser.parse()`
2. Intent matched against `WORKFLOW_TEMPLATES` (food delivery, document analysis, communication)
3. If no template match, `WorkflowGenerator.generateWithAI()` calls Claude API to generate steps
4. `WorkflowOrchestrator` executes the workflow steps (AI reasoning, API calls, user confirmations)

**This is a SEPARATE, more structured engine** with templates, context management, service integrations, and Composio execution. It's NOT the same as Path 1.

### Path 3: AI Node Inside Workflow Steps (NEW -- Feb 16)
**Files**: `src/components/chat/WorkflowPreviewCard.tsx`, `server/routes/workflow.ts`

1. A workflow (from Path 1 or 2) contains a step with `tool: "ai"`
2. During execution, `WorkflowPreviewCard` detects this as an AI node via `AI_INTERNAL_TOOLKITS`
3. Calls `POST /api/workflow/ai-step` on the backend
4. Backend uses `callClaudeWithTiering()` to run the AI step with appropriate model
5. Output flows to downstream steps (WhatsApp message, email, etc.)

**This is the "AI brain as a node that generates things by itself."** It's an execution-time capability, not a workflow creation path.

---

## DO THESE PATHS CONFLICT?

### Potential Conflict Points

1. **Path 1 vs Path 2**: These are DIFFERENT entry points. Path 1 uses the chat interface and Claude's system prompt. Path 2 uses `NexusWorkflowEngine.execute()` which goes through intent parsing and template matching. Currently, Path 2 seems DORMANT -- it's fully implemented but the chat UI (Path 1) is the primary interface users interact with. The `WorkflowOrchestrator` from Path 2 is exported and available but not wired into the chat flow.

2. **Path 1 + Path 3 work TOGETHER**: When Claude (Path 1) generates a workflow with `tool: "ai"` steps, Path 3 executes those steps. This is the intended design.

3. **The Feb 18 bugs (FIX-163 to FIX-167) were caused by Path 1** -- Claude's system prompt was too aggressive in generating workflows for complaint/problem descriptions, and the streaming system wasn't properly hiding the JSON response.

### Key Finding: Dual Brain Issue

The "brain" of Nexus operates at TWO levels:
- **Level 1 (Workflow DESIGN brain)**: Claude's system prompt in `server/agents/index.ts` decides WHAT workflow to create
- **Level 2 (Workflow EXECUTION brain)**: The `/api/workflow/ai-step` endpoint runs Claude INSIDE workflow steps

These are appropriately separated. Level 1 decides the structure. Level 2 generates content within that structure.

**However**, the system prompt for Level 1 is ~500+ lines and includes hardcoded workflow patterns, regional knowledge, and execution hints. This is where most "brain" behavior comes from.

---

## FILES MODIFIED IN THE KEY COMMITS

### ca89e7d (Universal Workflow Execution Engine)
| File | Changes | Impact |
|------|---------|--------|
| `server/agents/index.ts` | +40 lines | New AI step and WhatsApp instructions in system prompt |
| `server/routes/workflow.ts` | +51 lines | New `/ai-step` endpoint with model tiering |
| `src/components/chat/WorkflowPreviewCard.tsx` | +170 lines | Real AI execution, WhatsApp Baileys routing |
| `src/components/chat/wpc-helpers.ts` | +17 lines | Helper additions |
| `FIX_REGISTRY.json` | +88 lines | FIX-144 through FIX-147 registered |
| `api/_lib/agents.ts` | +29 lines | Vercel serverless agent support |

### 5bbb179 (AI Brain Bug Fixes)
| File | Changes | Impact |
|------|---------|--------|
| `server/agents/index.ts` | +15 lines | Complaint/problem patterns (FIX-165) |
| `server/routes/chat.ts` | +4 lines | Double-push guard (FIX-166) |
| `src/components/chat/ChatContainer.tsx` | +31 lines | Clarifying questions gate (FIX-167), JSON detection fix (FIX-163) |
| `src/services/NexusAIService.ts` | +16 lines | Double-push guard, safe fallback (FIX-164, FIX-166) |
| `FIX_REGISTRY.json` | +66 lines | FIX-163 through FIX-167 registered |

---

## ANSWER TO CEO'S QUESTION

> "Two days ago I added an AI brain to be a node that can generate things by itself as a node. Could it be that I also added an AI that creates the workflow in a different way that was before?"

**YES and NO:**

- **YES**: You added a NEW AI execution capability (Path 3) where AI nodes inside workflows actually call Claude to generate content (quotes, summaries, translations, etc.) instead of faking it. This is the "AI brain as a node."

- **The workflow CREATION method (Path 1) was NOT changed** -- Claude still creates workflows by returning JSON with `workflowSpec`. What changed was the SYSTEM PROMPT was updated to teach Claude about the new `tool: "ai"` step type and WhatsApp routing.

- **There IS a second workflow creation engine (Path 2)** in `src/lib/workflow-engine/` but this was added in the `8bab91a` commit as part of the 34-findings batch, NOT in the AI node commit. Path 2 is a structured template+AI generation pipeline that's separate from the chat-based Claude workflow creation.

- **The Feb 18 bugs** were caused by the system prompt changes making Claude too eager to generate workflows for complaint/problem descriptions, combined with streaming display issues.
