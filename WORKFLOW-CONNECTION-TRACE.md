# Workflow Connection Trace & Fix Report

**Date:** 2026-01-13
**Task:** Verify chat interface connects to workflow backend
**Goal:** User types "Send email to X" → System ACTUALLY sends email

---

## ISSUE IDENTIFIED: BROKEN CONNECTION CHAIN

### Current Flow (BROKEN)

```
User Input: "Send email to john@example.com"
    ↓
AgentChatbot.tsx (line 643)
    ↓
apiClient.chat() → /api/chat
    ↓
/api/chat.ts (Claude AI call only)
    ↓
Claude AI returns TEXT response
    ↓
❌ NO EXECUTION - Just text suggestion
```

### What's Missing

The chat interface has detection logic for action requests:
- Line 660: Parses `ACTION_REQUEST:` format
- Line 675: Parses `WORKFLOW_PROPOSAL:` format

**BUT**: The backend `/api/chat` endpoint ONLY calls Claude AI. It does NOT:
1. Parse user intent
2. Call the orchestrator
3. Execute workflows
4. Actually send emails/perform actions

### Available But Unused Components

**Workflow Engine exists at:**
- `nexus/src/lib/workflow-engine/orchestrator.ts` - Main coordinator
- `nexus/src/lib/workflow-engine/intent-parser.ts` - Parses natural language
- `nexus/src/lib/workflow-engine/workflow-generator.ts` - Creates workflows
- `nexus/src/lib/workflow-engine/composio-executor.ts` - Executes via Composio

**Key Method Available:**
```typescript
// Line 365 in orchestrator.ts
async executeCommand(
  input: string,
  options: { userId?: string; autoExecute?: boolean }
): Promise<OrchestratorSession>
```

This method:
1. Parses natural language intent
2. Generates workflow
3. Can auto-execute if `autoExecute: true`
4. Returns execution results

---

## THE FIX

### Option 1: Backend-Side Execution (Recommended)

Create `/api/execute-command.ts` that:
1. Receives natural language command
2. Calls `workflowOrchestrator.executeCommand()`
3. Returns execution results

**Frontend Change:**
```typescript
// In AgentChatbot.tsx, add:
const response = await apiClient.executeCommand({
  command: userMessage,
  userId: user.id,
  autoExecute: true
})
```

**Backend New File:**
```typescript
// nexus/api/execute-command.ts
import { workflowOrchestrator } from '../src/lib/workflow-engine/orchestrator'

export default async function handler(req, res) {
  const { command, userId, autoExecute } = req.body

  const session = await workflowOrchestrator.executeCommand(command, {
    userId,
    autoExecute: autoExecute !== false
  })

  return res.json({ success: true, session })
}
```

### Option 2: Enhance `/api/chat` (Alternative)

Modify `/api/chat.ts` to:
1. Detect action requests from user input
2. Route to orchestrator if action detected
3. Return execution results instead of just text

---

## COMPOSIO INTEGRATION STATUS

The orchestrator is already integrated with Composio:
- `composio-executor.ts` handles Composio tool execution
- `executeNLWorkflow()` method at line 1224
- Connection checking at line 1245
- OAuth handling at line 1345

**What Composio Can Do:**
- Email (Gmail, Outlook)
- Calendar events
- CRM operations (HubSpot, Salesforce)
- File operations (Drive, Dropbox)
- Communications (Slack, Discord)

---

## VERIFICATION STEPS

After implementing fix:

1. **Start dev server:**
   ```bash
   cd nexus && npm run dev
   ```

2. **Test in chat:**
   - Type: "Send email to test@example.com with subject 'Hello' and body 'Test'"
   - Expected: Email actually sent (or connection request if not authenticated)
   - NOT expected: Just text response suggesting how to send email

3. **Check console for:**
   - `[Orchestrator] Workflow started`
   - `[Composio] Executing tool: GMAIL_SEND_EMAIL`
   - Execution results, not just Claude AI text

4. **Browser verification:**
   ```
   mcp__playwright__browser_navigate url: "http://localhost:5173"
   mcp__playwright__browser_snapshot
   mcp__playwright__browser_console_messages level: "error"
   ```

---

## FILES TO MODIFY

### Required:
1. `nexus/src/lib/api-client.ts` - Add `executeCommand()` method
2. `nexus/api/execute-command.ts` - Create new endpoint (NEW FILE)
3. `nexus/src/components/AgentChatbot.tsx` - Call executeCommand for actions

### Optional (if enhancing chat instead):
1. `nexus/api/chat.ts` - Add orchestrator integration

---

## CURRENT STATUS

❌ **Chat interface is disconnected from workflow engine**
- Chat calls Claude AI only
- No actual execution occurs
- Orchestrator exists but unused

✅ **Workflow engine is complete and ready**
- Intent parser implemented
- Workflow generator implemented
- Composio executor implemented
- Error recovery implemented

**Next Step:** Implement Option 1 (backend execute-command endpoint) to connect the two systems.

---

## ESTIMATED FIX TIME

- Add API client method: 5 minutes
- Create backend endpoint: 10 minutes
- Update chat component: 10 minutes
- Testing & verification: 15 minutes
- **Total: ~40 minutes**
