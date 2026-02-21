# Phase Inspector Report: "Three Phases Described, Zero Code Enforcement"

**Inspector:** phase-inspector agent
**Date:** 2026-02-19
**Scope:** Full investigation of phase enforcement gap in Nexus AI conversation system

---

## 1. EXACT PHASE DEFINITIONS (From System Prompt)

The three phases are defined in `server/agents/index.ts` lines 204-310 inside the Nexus agent's personality string, under the heading `## THREE-PHASE WORKFLOW GENERATION` (marked with `@NEXUS-FIX-012`):

### Phase 1 - DISCOVERY (confidence < 0.60)

> **PHASE 1 - DISCOVERY (confidence < 0.60):**
> For vague requests like "help me onboard clients" or "automate my business":
> - DO NOT generate a workflow yet
> - Ask 2-3 targeted clarifying questions to understand:
>   1. **Source Tools** - What apps/tools they ALREADY use for the INPUT data
>   2. **Destination Tools** - How they want to be NOTIFIED or where they want OUTPUT to go
>   3. **Specific Pain Point** - What exact problem they want solved
> - Return: shouldGenerateWorkflow: false, intent: "clarifying", clarifyingQuestions: [...]

### Phase 2 - GENERATION (confidence 0.60-0.84)

> **PHASE 2 - GENERATION (confidence 0.60-0.84):**
> Once you have enough info from Phase 1:
> - Generate the workflow using ONLY their MENTIONED tools
> - Every tool in workflowSpec.steps MUST have been explicitly stated or confirmed by the user
> - ALWAYS include 2-3 "missingInfo" questions for post-workflow refinement

### Phase 3 - REFINEMENT (confidence >= 0.85)

> **PHASE 3 - REFINEMENT (confidence >= 0.85):**
> After user answers missingInfo questions:
> - Update the workflow with their answers
> - Confidence should now be high enough to execute

### FIX-165 Addition (Complaint/Problem Patterns)

Lines 253-264 add a special sub-case to Phase 1:

> **@NEXUS-FIX-165:** Business problem descriptions (user is reporting an issue, NOT requesting a specific workflow):
> - "dropping", "declining", "going down", "losing", etc.
> - When user describes a PROBLEM or asks a STRATEGIC QUESTION:
>   - This is NOT a workflow request - do NOT generate shouldGenerateWorkflow: true
>   - Instead, ask DIAGNOSTIC questions
>   - Think like a business consultant FIRST
>   - confidence MUST be < 0.40 for complaint/problem patterns

---

## 2. PHASE-RELATED CODE IN THE CODEBASE

### What EXISTS:

#### A. System Prompt Instructions (Prompt-Only, No Code)
- `server/agents/index.ts:204-310` - Phase definitions in natural language
- These are instructions TO Claude, not executable logic

#### B. Confidence Field Passing
- `src/services/NexusAIService.ts:69` - `confidence?: number` in `NexusAIResponse` interface
- `src/components/chat/ChatContainer.tsx:1071` - Passes `confidence` from AI response to workflow object
- `src/components/chat/WorkflowPreviewCard.tsx:3379-3399` - Displays confidence indicator visually

#### C. Intent-Based Branching in ChatContainer (THE CLOSEST THING TO ENFORCEMENT)
- `ChatContainer.tsx:939` - `if (!aiResponse.shouldGenerateWorkflow)` - shows text response
- `ChatContainer.tsx:978` - `if (aiResponse.intent === 'clarifying' && aiResponse.clarifyingQuestions)` - displays clickable options
- `ChatContainer.tsx:1037-1058` - `@NEXUS-FIX-167`: If Claude returns BOTH `workflowSpec` AND `clarifyingQuestions`, suppress the card and show questions first

#### D. "Think With Me" Mode (Separate Feature, Not Phase Enforcement)
- `server/routes/chat.ts:55-81` - `THINK_WITH_ME_DIRECTIVE` - a separate mode that forces Claude to ask questions first
- This is user-toggled, not automatic phase enforcement

#### E. WorkflowPreviewCard's Internal Phases (DIFFERENT from conversation phases)
- `src/components/chat/wpc-types.ts:15` - `type CardPhase = 'ready' | 'checking' | 'needs_auth' | 'executing' | 'complete' | 'error'`
- These are EXECUTION phases (what happens AFTER the card is shown), NOT conversation phases
- The card's `phase` tracks: "are we authenticating? executing? done?" - NOT "are we in discovery vs refinement?"

#### F. conversationState in ChatContainer
- `ChatContainer.tsx:393` - `const [conversationState, setConversationState] = React.useState<'idle' | 'asking_questions' | 'generating'>('idle')`
- This tracks the template-based question-asking flow (the FALLBACK path, not the Claude AI path)
- Used at `ChatContainer.tsx:775-831` for the NexusWorkflowEngine (template) path
- NOT used in the Claude AI path (the main path)

### What DOES NOT EXIST (The Gap):

1. **No `conversationPhase` state variable** - There is NO variable tracking "we are in Phase 1 (Discovery)" vs "Phase 2 (Generation)" vs "Phase 3 (Refinement)"

2. **No phase state machine** - There is no code that says:
   ```typescript
   // THIS DOES NOT EXIST
   if (conversationPhase === 'discovery') {
     // Force Claude to ask questions, block workflow generation
   } else if (conversationPhase === 'generation') {
     // Allow workflow card, require missingInfo
   } else if (conversationPhase === 'refinement') {
     // Allow high-confidence execution
   }
   ```

3. **No phase transitions** - There is no code that detects "user answered questions, move from Phase 1 to Phase 2"

4. **No confidence validation** - There is no code that checks Claude's self-reported confidence against the phase thresholds (< 0.60, 0.60-0.84, >= 0.85) and blocks inappropriate responses

5. **No phase persistence** - If the page refreshes mid-conversation, there's no stored phase state

6. **No server-side phase tracking** - `server/routes/chat.ts` sends messages to Claude and returns the response. It does NOT track what phase the conversation is in or validate that Claude's response matches the expected phase.

---

## 3. WHAT FIX-165 DOES FOR PHASE ENFORCEMENT

FIX-165 (lines 253-264 of `agents/index.ts`) adds **complaint/problem pattern detection** to the system prompt. It tells Claude:

- When user says things like "my sales are dropping" or "struggling with X"
- Treat it as a PROBLEM description, not a workflow request
- Ask DIAGNOSTIC questions first
- Set confidence < 0.40

**How it's enforced:** It's NOT enforced by code. It's a prompt instruction. Claude may or may not follow it. There is ONE piece of code that partially enforces it:

- `ChatContainer.tsx:1037-1058` (`@NEXUS-FIX-167`): If Claude returns both `workflowSpec` AND `clarifyingQuestions`, the card is suppressed. This is a safety net for when Claude ignores the phase instructions and generates a workflow prematurely while also asking questions.

**What FIX-165 does NOT do:**
- It does not add any keyword detection code on the client/server
- It does not force the confidence to be < 0.40 in code
- If Claude assigns confidence 0.70 to a complaint, nothing stops the workflow from generating

---

## 4. HOW THE WORKFLOWPREVIEWCARD QUESTION SYSTEM RELATES TO PHASES

The WorkflowPreviewCard has TWO question systems:

### A. Pre-Flight Questions (Inside the Card)
- `WorkflowPreviewCard.tsx:1467-3577` region - "Quick Question" pre-flight system
- These are questions about PARAMETERS (e.g., "Which Slack channel?", "What email address?")
- They appear AFTER the card is already shown
- They are Phase 2/3 concerns (refining an already-generated workflow)
- They are NOT Phase 1 questions (understanding the problem)

### B. missingInfo Questions (From AI Response)
- Defined in the AI response JSON: `missingInfo: [{ question, options, field }]`
- Displayed inside the WorkflowPreviewCard
- These increase confidence from 0.60-0.84 to 0.85+
- Also Phase 2/3 (post-generation refinement)

### C. clarifyingQuestions (Pre-Card, in Chat)
- Defined in the AI response JSON: `clarifyingQuestions: [{ question, options, field }]`
- Displayed in the CHAT as clickable options (NOT inside a card)
- These are the Phase 1 questions
- Handled by `ChatContainer.tsx:978-996`

**The Relationship:**
- `clarifyingQuestions` = Phase 1 (Discovery) - shown in chat before any card
- `missingInfo` + pre-flight = Phase 2/3 (Generation/Refinement) - shown inside the card
- The card's own `phase` state (ready/checking/executing/etc.) = Execution lifecycle, orthogonal to conversation phases

---

## 5. THE "FORM BUILDER MASQUERADING AS CONSULTANT" PROBLEM

When a user says "my sales are dropping":

### What SHOULD Happen (Ideal Phase 1):
1. AI asks diagnostic questions: "When did this start?", "What channels are you selling through?", "What metrics are you tracking?"
2. User answers, building understanding
3. AI identifies root cause or area of concern
4. AI suggests a specific automation: "Let me set up a daily sales analytics workflow"
5. NOW generate a workflow card

### What ACTUALLY Happens (Current System):
1. Claude receives the system prompt with FIX-165 instructions
2. Claude is supposed to set confidence < 0.40 and return `clarifyingQuestions`
3. **But there is NO CODE to verify this.** Claude could:
   - Return `shouldGenerateWorkflow: true` with confidence 0.75 - the card would appear
   - Return a workflow asking "What CRM do you use?" as a missingInfo question INSIDE the card
   - Skip diagnostic questions entirely and jump to "Here's a CRM integration workflow"

4. The ONLY safety net is FIX-167 (`ChatContainer.tsx:1037`): if Claude returns BOTH a workflowSpec AND clarifyingQuestions, the card is suppressed. But if Claude returns ONLY a workflowSpec with no clarifyingQuestions, the card appears immediately.

### The Core Problem:
**Phase enforcement is 100% reliant on Claude following prompt instructions.** There is no programmatic guardrail that says "if the conversation has had < 3 exchanges and the first message is vague, BLOCK workflow generation regardless of what Claude returns."

---

## 6. WHAT 10/10 PHASE ENFORCEMENT WOULD LOOK LIKE

### Architecture: Client-Side Phase State Machine

```typescript
// NEW: ConversationPhaseManager.ts

type ConversationPhase = 'discovery' | 'generation' | 'refinement' | 'execution'

interface PhaseState {
  currentPhase: ConversationPhase
  messageCount: number
  userToolsMentioned: string[]       // Tools user explicitly named
  questionAsked: number              // How many clarifying questions were asked
  questionsAnswered: number          // How many user answered
  aiReportedConfidence: number       // Last confidence from Claude
  enforcedConfidence: number         // Code-validated confidence
  canGenerateWorkflow: boolean       // Gate for card creation
  phaseTransitionHistory: Array<{
    from: ConversationPhase
    to: ConversationPhase
    reason: string
    timestamp: number
  }>
}

class ConversationPhaseManager {
  private state: PhaseState

  constructor() {
    this.state = {
      currentPhase: 'discovery',
      messageCount: 0,
      userToolsMentioned: [],
      questionAsked: 0,
      questionsAnswered: 0,
      aiReportedConfidence: 0,
      enforcedConfidence: 0,
      canGenerateWorkflow: false,
      phaseTransitionHistory: []
    }
  }

  // Called BEFORE sending user message to Claude
  processUserMessage(message: string): void {
    this.state.messageCount++
    // Extract tool mentions from user text
    const tools = this.extractToolMentions(message)
    this.state.userToolsMentioned.push(...tools)
    // If user answered a clarifying question
    if (this.state.questionAsked > this.state.questionsAnswered) {
      this.state.questionsAnswered++
    }
    this.evaluatePhaseTransition()
  }

  // Called AFTER receiving Claude's response, BEFORE displaying it
  validateAIResponse(response: NexusAIResponse): NexusAIResponse {
    this.state.aiReportedConfidence = response.confidence ?? 0

    // ENFORCE: Calculate real confidence based on conversation state
    this.state.enforcedConfidence = this.calculateEnforcedConfidence()

    // ENFORCE: Block premature workflow generation
    if (this.state.currentPhase === 'discovery') {
      if (response.shouldGenerateWorkflow) {
        console.warn('[PhaseEnforcer] BLOCKED: Workflow generation in discovery phase')
        response.shouldGenerateWorkflow = false
        // Force clarifying questions if Claude didn't provide any
        if (!response.clarifyingQuestions || response.clarifyingQuestions.length === 0) {
          response.clarifyingQuestions = this.generateFallbackQuestions()
        }
        response.intent = 'clarifying'
      }
    }

    // ENFORCE: In generation phase, verify all tools were user-mentioned
    if (this.state.currentPhase === 'generation' && response.workflowSpec) {
      const specTools = response.workflowSpec.steps.map(s => s.tool)
      const unmentioned = specTools.filter(t => !this.state.userToolsMentioned.includes(t))
      if (unmentioned.length > 0) {
        // Remove unmentioned tools from spec, add as questions
        response.workflowSpec.steps = response.workflowSpec.steps.filter(
          s => this.state.userToolsMentioned.includes(s.tool)
        )
        if (!response.missingInfo) response.missingInfo = []
        for (const tool of unmentioned) {
          response.missingInfo.push({
            question: `Would you like to add ${tool} to this workflow?`,
            options: ['Yes', 'No, use something else', 'Skip this step'],
            field: `confirm_${tool}`
          })
        }
      }
    }

    // ENFORCE: Override Claude's confidence with enforced value
    if (response.confidence !== undefined) {
      response.confidence = Math.min(response.confidence, this.state.enforcedConfidence)
    }

    // Track questions Claude asked
    if (response.clarifyingQuestions) {
      this.state.questionAsked += response.clarifyingQuestions.length
    }

    return response
  }

  private calculateEnforcedConfidence(): number {
    let confidence = 0

    // Base: start at 0.20
    confidence = 0.20

    // +0.10 for each tool mentioned by user
    confidence += Math.min(0.30, this.state.userToolsMentioned.length * 0.10)

    // +0.15 for each clarifying question answered
    confidence += Math.min(0.30, this.state.questionsAnswered * 0.15)

    // +0.05 for each message exchanged
    confidence += Math.min(0.20, this.state.messageCount * 0.05)

    return Math.min(1.0, confidence)
  }

  private evaluatePhaseTransition(): void {
    const prev = this.state.currentPhase

    if (this.state.enforcedConfidence >= 0.85) {
      this.state.currentPhase = 'refinement'
      this.state.canGenerateWorkflow = true
    } else if (this.state.enforcedConfidence >= 0.60 || this.state.userToolsMentioned.length >= 2) {
      this.state.currentPhase = 'generation'
      this.state.canGenerateWorkflow = true
    } else {
      this.state.currentPhase = 'discovery'
      this.state.canGenerateWorkflow = false
    }

    if (prev !== this.state.currentPhase) {
      this.state.phaseTransitionHistory.push({
        from: prev,
        to: this.state.currentPhase,
        reason: `confidence=${this.state.enforcedConfidence}, tools=${this.state.userToolsMentioned.length}, questions=${this.state.questionsAnswered}`,
        timestamp: Date.now()
      })
    }
  }

  // Detect explicit tool names in user message
  private extractToolMentions(message: string): string[] {
    const toolPatterns = [
      'gmail', 'slack', 'sheets', 'calendar', 'drive', 'notion',
      'hubspot', 'github', 'trello', 'asana', 'zoom', 'discord',
      'whatsapp', 'stripe', 'dropbox', 'linear', 'jira', 'knet',
      'salesforce', 'excel', 'outlook', 'teams'
    ]
    const lower = message.toLowerCase()
    return toolPatterns.filter(t => lower.includes(t))
  }

  // Fallback questions when Claude fails to ask
  private generateFallbackQuestions(): ClarifyingQuestion[] {
    return [
      {
        question: 'What tools or apps do you currently use for this?',
        options: ['Gmail', 'Slack', 'Google Sheets', 'Notion', 'Custom...'],
        field: 'current_tools'
      },
      {
        question: 'How would you like to be notified?',
        options: ['Email', 'Slack message', 'WhatsApp', 'No notification needed', 'Custom...'],
        field: 'notification_preference'
      }
    ]
  }
}
```

### Integration Points (Where to Wire It In):

1. **ChatContainer.tsx** - Create `ConversationPhaseManager` instance as state/ref
2. **Before sending to Claude** - Call `phaseManager.processUserMessage(content)` to update state
3. **After receiving Claude's response** - Call `phaseManager.validateAIResponse(aiResponse)` to enforce phase rules
4. **Display phase indicator** - Show user which phase they're in (small indicator in chat header)
5. **Persist phase state** - Save to localStorage so it survives refresh

### What This Achieves:

| Scenario | Current (2/10) | With Phase Enforcement (10/10) |
|----------|----------------|-------------------------------|
| User says "automate my business" | Claude might generate card immediately | BLOCKED in Phase 1. Must ask clarifying questions first. |
| User says "my sales are dropping" | Claude might generate CRM workflow | BLOCKED. Diagnostic questions forced. |
| User says "Send Gmail to Slack" | Card appears (correct) | Card appears (correct - user named both tools) |
| Claude assigns confidence 0.80 to vague request | Card appears with that confidence | Enforced confidence overrides: calculated as 0.30 (only 1 exchange, no tools mentioned) |
| Claude adds Slack to workflow user didn't mention | Card shows with Slack step | Slack step REMOVED, added as missingInfo question |
| Page refreshes mid-conversation | Phase lost, starts over | Phase state restored from localStorage |

### Server-Side Enhancement (Optional but Recommended):

Add phase validation to `server/routes/chat.ts`:

```typescript
// After receiving Claude's response, before sending to client
const phaseCheck = {
  messageCount: messages.filter(m => m.role === 'user').length,
  hasWorkflowSpec: !!parsedResponse.workflowSpec,
  hasClarifyingQuestions: !!parsedResponse.clarifyingQuestions?.length,
  reportedConfidence: parsedResponse.confidence
}

// Server-side guardrail: if first message and vague, force discovery
if (phaseCheck.messageCount <= 1 && phaseCheck.hasWorkflowSpec) {
  const isSpecific = phaseCheck.reportedConfidence > 0.85
  if (!isSpecific) {
    console.warn('[Chat][PhaseGuard] Suppressing premature workflow on first message')
    parsedResponse.shouldGenerateWorkflow = false
    // Let Claude's clarifying questions through, or add defaults
  }
}
```

---

## 7. SUMMARY: THE GAP

| Aspect | Current State | What 10/10 Requires |
|--------|---------------|---------------------|
| Phase definitions | In prompt text only | In prompt + code state machine |
| Phase tracking | None | `ConversationPhaseManager` with persisted state |
| Phase transitions | Claude decides implicitly | Code calculates based on conversation metrics |
| Confidence validation | Trust Claude's self-report | Code-calculated confidence overrides Claude |
| Workflow generation gate | FIX-167 (partial: blocks if BOTH spec + questions) | Full gate: blocks if phase === 'discovery' |
| Tool verification | Prompt instructions only | Code checks every step's tool against user-mentioned list |
| Problem/complaint handling | FIX-165 prompt instruction | Code-level keyword detection + forced diagnostic mode |
| Phase persistence | None | localStorage + session recovery |
| Phase visibility to user | None | UI indicator showing current phase |

**The fundamental problem:** The current system tells Claude "you should follow these phases" but has NO CODE to verify or enforce that Claude actually does. It's like writing a speed limit sign but having no radar gun or police officer.

**The fix:** Add a `ConversationPhaseManager` that acts as a programmatic layer between Claude's response and the UI, with the authority to BLOCK or MODIFY Claude's response when it violates phase rules.
