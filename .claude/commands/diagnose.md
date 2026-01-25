# /diagnose - Nexus Self-Healing Diagnostic Loop

## Purpose
Automatically test Nexus workflows, find bugs, fix them, and repeat until all workflows complete successfully.

## Execution Protocol

### Phase 1: Setup
```bash
# Ensure dev server is running
cd nexus && npm run dev
```

Verify server at http://localhost:5173 (or next available port)

### Phase 2: Test Scenarios

Run these scenarios in order. Each must complete ALL nodes without errors:

| # | Test Prompt | Expected Integrations | Success Criteria |
|---|-------------|----------------------|------------------|
| 1 | "Save my Gmail emails to a Google Sheet" | Gmail, Google Sheets | All nodes green, no spreadsheet_id asked |
| 2 | "When I get a Slack message, save it to Notion" | Slack, Notion | Trigger configured, action completes |
| 3 | "Monitor my Dropbox and notify me on Discord" | Dropbox, Discord | File monitoring + notification works |
| 4 | "Summarize my calendar events and email me" | Google Calendar, Gmail | AI summary + email sent |
| 5 | "Track GitHub issues in a spreadsheet" | GitHub, Google Sheets | Issues fetched, sheet populated |
| 6 | "Post updates to Slack when Stripe payment comes in" | Stripe, Slack | Webhook + message works |
| 7 | "Backup important emails to Dropbox" | Gmail, Dropbox | Emails saved as files |
| 8 | "Create tasks from emails" | Gmail, Todoist/Asana | Task created from email content |
| 9 | "Send daily calendar summary to Slack" | Google Calendar, Slack | Summary generated, posted |
| 10 | "Alert me when GitHub PR is opened" | GitHub, Slack/Discord | Webhook triggers notification |

### Phase 3: For Each Test

```
┌─────────────────────────────────────────────────────────────┐
│ DIAGNOSTIC LOOP - TEST #[N]                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  STEP 1: Navigate to Nexus chat                             │
│  ─────────────────────────────────                          │
│  mcp__playwright__browser_navigate                          │
│    url: "http://localhost:5173/dashboard"                   │
│                                                             │
│  STEP 2: Send test prompt                                   │
│  ─────────────────────────────                              │
│  mcp__playwright__browser_snapshot (find chat input)        │
│  mcp__playwright__browser_type                              │
│    text: "[TEST PROMPT]"                                    │
│    submit: true                                             │
│                                                             │
│  STEP 3: Wait for response                                  │
│  ─────────────────────────────                              │
│  mcp__playwright__browser_wait_for                          │
│    time: 5                                                  │
│  mcp__playwright__browser_snapshot                          │
│                                                             │
│  STEP 4: Check for workflow card                            │
│  ─────────────────────────────────                          │
│  Look for: WorkflowPreviewCard with nodes                   │
│  If missing: BUG - workflow not generated                   │
│                                                             │
│  STEP 5: Attempt execution                                  │
│  ─────────────────────────────                              │
│  Click "Execute Workflow" or "Connect All"                  │
│  Wait for OAuth if needed                                   │
│  Observe each node status                                   │
│                                                             │
│  STEP 6: Capture result                                     │
│  ─────────────────────────────                              │
│  mcp__playwright__browser_snapshot                          │
│  mcp__playwright__browser_console_messages level: "error"   │
│                                                             │
│  STEP 7: Analyze                                            │
│  ─────────────────────────────                              │
│  □ All nodes green? → PASS, next test                       │
│  □ Error on node? → Capture error, go to FIX PHASE          │
│  □ Technical param asked? → BUG, go to FIX PHASE            │
│  □ Workflow stuck? → BUG, go to FIX PHASE                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Phase 4: Fix Protocol (When Bug Found)

```
┌─────────────────────────────────────────────────────────────┐
│ FIX PROTOCOL                                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. DOCUMENT THE BUG                                        │
│     ────────────────────                                    │
│     - Test #: [N]                                           │
│     - Prompt: "[exact prompt]"                              │
│     - Error: "[exact error message]"                        │
│     - Node: "[which node failed]"                           │
│     - Type: [PARAM_LEAK | TOOL_ERROR | UX_BUG | OTHER]      │
│                                                             │
│  2. DIAGNOSE ROOT CAUSE                                     │
│     ────────────────────────                                │
│     Search codebase for:                                    │
│     - Parameter name in error                               │
│     - Tool slug mentioned                                   │
│     - Node type handling                                    │
│                                                             │
│  3. CHECK EXISTING FIXES                                    │
│     ────────────────────────                                │
│     Run: /validate                                          │
│     Read: nexus/FIX_REGISTRY.json                           │
│     Ensure fix won't conflict                               │
│                                                             │
│  4. IMPLEMENT FIX                                           │
│     ─────────────────                                       │
│     - Add @NEXUS-FIX-XXX marker                             │
│     - Use next available fix number                         │
│     - Keep fix minimal and focused                          │
│                                                             │
│  5. REGISTER FIX                                            │
│     ─────────────                                           │
│     Add to FIX_REGISTRY.json:                               │
│     {                                                       │
│       "id": "FIX-0XX",                                      │
│       "name": "[descriptive name]",                         │
│       "description": "[what it fixes]",                     │
│       "file": "[file path]",                                │
│       "marker": "@NEXUS-FIX-0XX",                           │
│       "testScenario": "[prompt that triggered bug]"         │
│     }                                                       │
│                                                             │
│  6. REBUILD                                                 │
│     ───────                                                 │
│     npm run build                                           │
│     Verify no TypeScript errors                             │
│                                                             │
│  7. RE-TEST                                                 │
│     ───────                                                 │
│     Run exact same test prompt                              │
│     If still fails → back to step 2                         │
│     If passes → next test                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Phase 5: Progress Tracking

Update `.claude-session.md` after each loop:

```markdown
## DIAGNOSTIC LOOP STATUS

| Test | Status | Bugs Found | Bugs Fixed |
|------|--------|------------|------------|
| 1. Gmail → Sheets | 🔄 IN PROGRESS | 2 | 1 |
| 2. Slack → Notion | ⏳ PENDING | - | - |
| ...

### Current Bug Being Fixed
- **Test:** #1 - "Save my Gmail emails to a Google Sheet"
- **Error:** "Missing required parameters: spreadsheet_id"
- **Root Cause:** getDefaultParams not translating spreadsheet_id to friendly prompt
- **Fix:** FIX-021 - Add spreadsheet URL/name to friendly param translation

### Bugs Fixed This Session
- FIX-021: spreadsheet_id → "Which Google Sheet?"
- FIX-022: ...
```

### Phase 6: Completion Criteria

**A test PASSES when:**
- ✅ Workflow generates with correct nodes
- ✅ All OAuth connections succeed (or use test mode)
- ✅ ALL nodes show green/success status
- ✅ No technical parameters exposed to user
- ✅ No console errors related to execution
- ✅ Final output is user-friendly

**Session COMPLETES when:**
- All 10 test scenarios pass
- OR context is 70% full (save state, continue next session)

### Loop Count Commitment

**Target:** Unlimited loops until all tests pass
**Per Session:** ~10-20 fix iterations before context limit
**Resumption:** State saved in .claude-session.md for continuation

## Quick Start

To run diagnostics:
```
User: /diagnose
```

Claude will:
1. Start dev server if needed
2. Run test #1
3. Fix any bugs found
4. Repeat until pass
5. Move to test #2
6. Continue until all pass or context limit
