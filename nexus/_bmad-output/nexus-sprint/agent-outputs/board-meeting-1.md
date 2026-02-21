# BOARD MEETING 1: Cycle 1 Findings Synthesis

## Date: 2026-02-19
## Attendees: Brain Surgeon (absent - no report), Signal Tracer, Archaeologist, Confidence Auditor, Memory Specialist, Phase Inspector

---

## TOP 7 CRITICAL FINDINGS

### Finding 1: CONFIDENCE IS DECORATIVE (Confidence Auditor + Signal Tracer)
- Claude's self-reported confidence has ZERO code enforcement
- A response with `confidence: 0.1` and valid `workflowSpec` WILL create a workflow card
- **SMOKING GUN**: A low-confidence blocker was INTENTIONALLY REMOVED (WorkflowPreviewCard.tsx:3694)
- Three independent confidence systems (IntentResolver, Claude self-report, Template score) never interact
- Code only checks: (1) workflowSpec exists, (2) spec is structurally valid, (3) FIX-167 clarifying questions gate

### Finding 2: PHASE SYSTEM IS PROMPT-ONLY (Phase Inspector)
- Three phases defined in prompt: Discovery (<0.60), Generation (0.60-0.84), Refinement (>=0.85)
- ZERO code enforcement: no `conversationPhase` variable, no state machine, no phase transitions
- FIX-165 adds complaint patterns to prompt but Claude can still ignore them
- FIX-167 is the ONLY code-level safety net (blocks card when BOTH spec + questions present)
- The system is a speed limit sign with no radar gun

### Finding 3: MEMORY IS AMNESIAC (Memory Specialist)
- Hard 10-message cap (5 user + 5 assistant exchanges)
- NO summarization before truncation - oldest messages simply vanish
- By message 11, the original problem statement is LOST
- Dual memory disconnect: UI shows all messages, AI only receives last 10
- The cap is ARTIFICIAL - Claude Sonnet has 200k context, could handle 30-50 messages at negligible cost

### Finding 4: THREE WORKFLOW PATHS COEXIST (Archaeologist)
- Path 1: Claude system prompt → JSON workflowSpec (MAIN - chat interface)
- Path 2: IntentParser → WorkflowGenerator → Orchestrator (DORMANT - fully implemented but not wired)
- Path 3: AI Node inside workflow steps (NEW Feb 16 - execution only, not creation)
- Path 2 is a ghost - a complete workflow engine nobody uses

### Finding 5: TEMPLATE SERVICE CAN BYPASS CLAUDE (Signal Tracer)
- For first messages with keyword match score >= 0.8, templates return INSTANTLY without calling Claude
- Template confidence is synthetic (score + 0.4), not AI-determined
- This means some users get template responses and others get Claude responses for similar inputs
- FIX-126 restricts templates to first message only

### Finding 6: AI NODES NOW REAL (Archaeologist)
- Feb 16 commit: AI workflow steps changed from fake (setTimeout 500ms) to real (callClaudeWithTiering)
- Model tiering: simple→Haiku, moderate→Sonnet, complex→Opus
- New /api/workflow/ai-step endpoint
- This is the "brain as a node" the CEO added - it's working as intended

### Finding 7: THE "FORM BUILDER VS CONSULTANT" CORE PROBLEM (Phase Inspector)
- When user says "my sales are dropping", the IDEAL flow is: Listen → Diagnose → Recommend → Build
- Current flow relies ENTIRELY on Claude following prompt instructions
- No code prevents Claude from skipping straight to "here's a CRM workflow"
- The conversation should ACCUMULATE understanding before generating anything

---

## DIMENSION SCORES EXPLAINED (Why Each is What It Is)

### Tool Wiring Accuracy: 8/10
- TOOL_SLUGS mapping works well
- FIX-017/018/019/020 provide solid fallback
- Works when user names tools explicitly
- Gap: AI sometimes invents tool names Claude hallucinates

### Business Diagnosis: 2/10
- FIX-165 adds complaint patterns to PROMPT only
- No code forces diagnostic mode
- Claude CAN still skip diagnosis and generate workflow
- No diagnostic framework (root cause analysis, metric tracking)

### Regional Intelligence: 9/10
- Kuwait context is excellent (KWD, Sun-Thu, KNET, WhatsApp, Gulf Arabic)
- ElevenLabs/Deepgram preference for Arabic
- Arabic dialect support documented
- Minor gap: no live currency/market data

### Phase Enforcement: 2/10
- Phases exist in prompt text only
- Zero code enforcement
- No state machine, no transitions, no persistence
- FIX-167 is a band-aid, not a real phase system

### Strategic Consulting: 2/10
- No framework for non-workflow questions
- CEO notes: "Handled in AI Consultancy" (separate feature)
- The main chat brain has no consulting capability
- "Should I invest in email or social?" → brain tries to build a workflow

### Conversation Depth: 3/10
- 10-message cap kills diagnostic conversations
- No summarization preserves earlier context
- Confidence not based on accumulated understanding
- By message 11, the brain forgets why it's talking to you

---

## CYCLE 2 INVESTIGATION PRIORITIES

Based on these findings, Cycle 2 should investigate:

1. **The Full System Prompt** - Brain surgeon didn't deliver. Need complete anatomy.
2. **ConversationPhaseManager Design** - Concrete code for phase enforcement
3. **Confidence as Real Gate** - Exact code changes to make confidence meaningful
4. **Memory Architecture v2** - What happens at 30 messages? Summarization design.
5. **Path 2 Assessment** - Should the dormant workflow engine be activated or removed?
6. **End-to-End Test Scenarios** - What does 10/10 look like for each dimension?

---

## BOARD DECISION: PROCEED TO CYCLE 2
All agents agree: The brain is a skilled electrician (good at wiring tools) but a poor consultant (can't diagnose problems). The fix requires both PROMPT improvements AND CODE enforcement. Prompt-only fixes are insufficient - Claude can always ignore instructions.
