# End-to-End Execution Flow: User Input → Workflow Execution

Complete chain of execution from user typing in AgentChatbot to workflow execution and results return.

---

## 1. USER INPUT → AGENT CHATBOT

**Component:** `nexus/src/components/AgentChatbot.tsx` (lines 602-630)

```
User Types Message
    ↓
Input captured in <Input> field (line 1731)
    ↓
handleSendOrEdit() or handleSend() triggered on Enter (line 1014 / 602)
    ↓
Message Object Created:
  - id: timestamp
  - role: 'user'
  - content: input text
  - images: [] (if any attached)
    ↓
User message added to UI (line 627)
Input cleared (line 628)
Loading state activated (line 630)
```

**Key Properties:**
- Image support: Up to 4 images (base64 encoded)
- Message history: Last 8 messages sent for context
- Edit capability: Users can re-send edited messages

---

## 2. API REQUEST → BACKEND

**Component:** `nexus/src/lib/api-client.ts` (lines 380-385)

```typescript
const response = await apiClient.chat({
  messages: conversationMessages,           // Array of {role, content}
  systemPrompt: selectedAgent ? undefined : SYSTEM_PROMPT,
  model: 'claude-sonnet-4-20250514',
  maxTokens: 2048,
  agentId: selectedAgent || undefined,      // null = auto-route
  autoRoute: !selectedAgent,
  images: imagesToSend.length > 0 ? imagesToSend : undefined
})
```

**Request Flow:**
```
Browser (AgentChatbot)
    ↓
apiClient.chat(ChatRequest)
    ↓
Fetch POST to /api/chat (line 381)
    ↓
Request Headers:
  Content-Type: application/json
    ↓
Request Body:
  {
    messages: [{role, content}, ...],
    agentId?: string,
    autoRoute?: boolean,
    model?: string,
    maxTokens?: number,
    images?: ImageContent[]
  }
```

**Network Configuration:**
- Endpoint: `${API_BASE}/api/chat`
- Base URL: `VITE_API_URL` or empty (relative)
- Timeout: 30 seconds (line 283, api-client.ts)
- Retries: 3 attempts with exponential backoff

---

## 3. INTENT PARSING & AGENT ROUTING

**Component:** `nexus/api/chat.ts` (lines 92-108)

```typescript
// Step 1: Determine Which Agent to Use
if (agentId) {
  agent = getAgent(agentId)  // Use specific agent
} else if (autoRoute) {
  agent = routeToAgent(lastUserMessage?.content)  // Auto-route
} else {
  agent = getAgent('nexus')!  // Default to Nexus
}
```

**Routing Logic:** `nexus/api/_lib/agents.ts` (lines 177-203)

```typescript
// Keywords trigger specific agents:
routeToAgent(query: string): Agent {
  if (query.includes('requirement') || query.includes('user stor'))
    → Larry (Business Analyst)
  if (query.includes('roadmap') || query.includes('priorit'))
    → Mary (Product Manager)
  if (query.includes('architect') || query.includes('design system'))
    → Alex (Solutions Architect)
  if (query.includes('code') || query.includes('implement'))
    → Sam (Senior Developer)
  if (query.includes('ux') || query.includes('design'))
    → Emma (UX Designer)
  if (query.includes('deploy') || query.includes('devops'))
    → David (DevOps Engineer)
  if (query.includes('test') || query.includes('qa'))
    → Olivia (QA Lead)
  else
    → Nexus (AI Orchestrator)
}
```

**Agent Details:**
| Agent | ID | Role | Keywords |
|-------|-----|------|----------|
| Larry | larry | Business Analyst | requirements, user stories |
| Mary | mary | Product Manager | roadmap, prioritization |
| Alex | alex | Solutions Architect | architecture, integration |
| Sam | sam | Senior Developer | code, implementation |
| Emma | emma | UX Designer | design, wireframes |
| David | david | DevOps Engineer | deployment, CI/CD |
| Olivia | olivia | QA Lead | testing, quality |
| Nexus | nexus | AI Orchestrator | general coordination |

---

## 4. SYSTEM PROMPT ASSEMBLY & PROMPT CACHING

**Component:** `nexus/api/chat.ts` (lines 40-54)

```typescript
function buildCachedSystemPrompt(agent: Agent): TextBlockParam[] {
  return [
    {
      type: 'text',
      text: agent.personality  // Agent-specific personality (1000+ tokens)
    },
    {
      type: 'text',
      text: TEAM_CONTEXT,  // Static team context
      cache_control: { type: 'ephemeral' }  // Mark for caching
    }
  ]
}
```

**Caching Strategy:**
- **Cache Write Cost:** +25% tokens (first request)
- **Cache Hit Cost:** -90% tokens (subsequent requests, 10% of base)
- **TTL:** 5 minutes (refreshes on use)
- **Benefit:** Reduces input token costs by 90% on cache hits

**Agent Personalities:**
- Each agent has distinct communication style defined in `BMAD_AGENTS`
- Personalities are cached separately per agent
- Team context is shared and cached once

---

## 5. MESSAGE FORMATTING

**Component:** `nexus/api/chat.ts` (lines 114-145)

```typescript
// Format messages with image support
const formattedMessages = messages.map((m, index) => {
  const isLastMessage = index === messages.length - 1
  const hasImages = images && images.length > 0

  if (isLastMessage && m.role === 'user' && hasImages) {
    // Attach images to last message only
    const contentBlocks = []
    for (const img of images) {
      contentBlocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: img.source.media_type,  // jpeg, png, gif, webp
          data: img.source.data
        }
      })
    }
    // Add text after images
    if (m.content) {
      contentBlocks.push({ type: 'text', text: m.content })
    }
    return { role: m.role, content: contentBlocks }
  }

  return { role: m.role, content: m.content }
})
```

**Image Requirements:**
- Formats: JPEG, PNG, GIF, WebP
- Max Size: 10 MB per image
- Max Count: 4 images per message
- Encoding: Base64 (browser → server)

---

## 6. ANTHROPIC API CALL

**Component:** `nexus/api/chat.ts` (lines 148-153)

```typescript
const response = await client.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 2048,
  system: systemBlocks,  // With cache_control
  messages: formattedMessages
})
```

**Models Available:**
- `claude-3-5-haiku-20241022` - Fast, cheaper
- `claude-sonnet-4-20250514` - Default, balanced
- `claude-opus-4-5-20251101` - Most powerful

**API Features:**
- Prompt caching enabled via `systemBlocks`
- Image vision support built-in
- Token counting for monitoring
- Cache metrics returned

---

## 7. INTENT & ACTION PARSING

**Component:** `nexus/src/components/AgentChatbot.tsx` (lines 659-682)

```typescript
let assistantContent = response.output

// Check 1: Extract ACTION_REQUEST (immediate execution)
const actionRequest = parseActionRequest(assistantContent)
if (actionRequest) {
  setPendingAction({
    type: actionRequest.type,           // 'email', 'crm', 'slack', etc.
    data: actionRequest.data,
    description: getActionDescription(...)
  })
  // Clean content to show without raw format
  assistantContent = assistantContent.replace(/ACTION_REQUEST:[\s\S]*$/m, '')
}

// Check 2: Extract WORKFLOW_PROPOSAL (for workflow creation)
const proposal = parseWorkflowProposal(assistantContent)
if (proposal) {
  setWorkflowProposal(proposal)
  assistantContent = assistantContent.replace(/WORKFLOW_PROPOSAL:[\s\S]*$/m, '')
}
```

**Action Format Parsing:** (lines 350-381)
```
ACTION_REQUEST:
type: [email|crm|slack|calendar|github|sheets|workflow]
data: {JSON object with action details}
```

**Workflow Proposal Format:** (lines 383-418)
```
WORKFLOW_PROPOSAL:
Name: [descriptive name]
Description: [what it does]
Type: [BMAD/Simple/Scheduled]
Complexity: [simple/medium/complex]
```

---

## 8. TOOL SELECTION & COMPOSIO INTEGRATION

**Component:** `nexus/src/components/AgentChatbot.tsx` (lines 449-600)

Tool selection happens in `executeAction()` based on action type:

```typescript
switch (type) {
  case 'email':
    // Use Composio for Gmail/Outlook
    await composioClient.sendEmail({to, subject, body})
    break

  case 'crm':
    // Use Composio for HubSpot/Salesforce
    const toolSlug = data.action === 'createContact'
      ? TOOL_SLUGS.hubspot.createContact
      : TOOL_SLUGS.hubspot.searchContacts
    await composioClient.executeTool(toolSlug, params)
    break

  case 'slack':
    // Use Composio for Slack messaging
    await composioClient.sendSlackMessage({channel, text})
    break

  case 'calendar':
    // Use Composio for Google Calendar
    await composioClient.createCalendarEvent({title, startTime, endTime})
    break

  case 'github':
    // Use Composio for GitHub
    await composioClient.createGitHubIssue({owner, repo, title, body})
    break

  case 'sheets':
    // Use Composio for Google Sheets
    data.action === 'read'
      ? await composioClient.readSpreadsheet(...)
      : await composioClient.appendToSpreadsheet(...)
    break

  case 'workflow':
    // Execute multi-step workflow
    const tools = data.steps.map(step => ({toolSlug: step.toolSlug, params}))
    await composioClient.executeBatch(tools)
    break
}
```

**Composio Client:**
- Location: `nexus/src/services/ComposioClient.ts`
- Integration: 500+ app integrations
- Tool Slugs: `TOOL_SLUGS` constant defines available tools
- Execution: Direct API calls with authentication

---

## 9. WORKFLOW GENERATION & PLANNING

**Component:** `nexus/src/components/AgentChatbot.tsx` (lines 778-907)

When user clicks "Approve & Run" on workflow proposal:

```typescript
const handleCreateWorkflow = async () => {
  // Step 1: Create project (if needed)
  const projectResponse = await fetch('/api/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: `${workflowProposal.name} Project`,
      description: workflowProposal.description
    })
  })
  const targetProjectId = projectResult.data.id

  // Step 2: Create workflow in database
  const createResponse = await fetch('/api/workflows', {
    method: 'POST',
    body: JSON.stringify({
      project_id: targetProjectId,
      name: workflowProposal.name,
      description: workflowProposal.description,
      workflow_type: workflowProposal.type,
      user_input: userInput,
      config: {
        prompt: workflowProposal.description,
        complexity: workflowProposal.complexity,
        steps: workflowProposal.steps,
        integrations: workflowProposal.integrations,
        estimatedTokens: workflowProposal.estimatedTokens,
        estimatedCostUSD: workflowProposal.estimatedCostUSD
      }
    })
  })

  // Step 3: Start planning (BMAD Director analyzes)
  const planResponse = await fetch(`/api/workflows/${workflow.id}/start`, {
    method: 'POST'
  })

  // Step 4: Show execution plan for approval
  setPendingWorkflow({
    id: workflow.id,
    plan: planResult.plan
  })
}
```

**Planning Output:**
```typescript
ExecutionPlan {
  tasks: [
    {
      id: string
      name: string
      type: 'agent' | 'integration' | 'transform' | 'condition'
      agentId?: string
      description: string
      dependencies: string[]
      config: Record<string, unknown>
      estimatedTokens: number
    }
  ]
  requiredIntegrations: string[]
  totalEstimatedTokens: number
  totalEstimatedCostUSD: number
  complexity: 'simple' | 'medium' | 'complex'
}
```

---

## 10. WORKFLOW EXECUTION

**Component:** `nexus/src/components/AgentChatbot.tsx` (lines 909-985)

When user clicks "Approve & Execute":

```typescript
const handleApproveWorkflow = async () => {
  // Step 1: Approve the plan
  const approveResponse = await fetch(`/api/workflows/${pendingWorkflow.id}/approve`, {
    method: 'POST'
  })

  // Step 2: Execute the workflow
  const executeResponse = await fetch(`/api/workflows/${pendingWorkflow.id}/execute`, {
    method: 'POST'
  })
  const executeResult = await executeResponse.json()

  // Step 3: Show success
  if (executeResult.success) {
    // Add success message to chat
    // Link to workflow results page
  }
}
```

**Execution Path:**
1. `POST /api/workflows/{id}/approve` - Transitions to orchestrating → building
2. `POST /api/workflows/{id}/execute` - Starts parallel execution
3. SSE connection opened for real-time updates
4. Results aggregated and returned

---

## 11. REAL-TIME UPDATES (SSE)

**Component:** `nexus/src/contexts/WorkflowChatContext.tsx` (lines 377-457)

```typescript
const connectSSE = (workflowId: string) => {
  const sseUrl = `${API_URL}/api/sse/workflow/${workflowId}`
  const eventSource = new EventSource(sseUrl)

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data)

    switch (data.type) {
      case 'step_started':
        updateStepStatus(data.stepId, 'running')
        addExecutionLog(`Step ${data.stepId} started`)
        break

      case 'step_completed':
        updateStepStatus(data.stepId, 'completed')
        setExecutionState(prev => ({
          ...prev,
          tokensUsed: prev.tokensUsed + data.data?.tokensUsed,
          costUsd: prev.costUsd + data.data?.costUsd
        }))
        break

      case 'workflow_completed':
        setExecutionState(prev => ({
          ...prev,
          status: 'completed',
          tokensUsed: data.data?.totalTokens,
          costUsd: data.data?.totalCost
        }))
        break

      case 'workflow_failed':
        // Handle failure
        break
    }
  }
}
```

**SSE Event Types:**
- `step_started` - Task execution began
- `step_completed` - Task finished successfully
- `step_failed` - Task failed with error
- `workflow_completed` - All tasks complete
- `workflow_failed` - Workflow execution failed

---

## 12. RESULTS RETURNED TO UI

**Component:** `nexus/src/components/AgentChatbot.tsx` (lines 687-699)

```typescript
const assistantMessage: Message = {
  id: (Date.now() + 1).toString(),
  role: 'assistant',
  content: assistantContent || response.output,
  timestamp: new Date(),
  agent: respondingAgent,
  metadata: {
    tokensUsed: response.usage?.totalTokens || 0,
    costUSD: calculateCost(response.usage?.totalTokens || 0)
  }
}

setMessages((prev) => [...prev, assistantMessage])
```

**Response Structure:**
```typescript
{
  success: boolean
  output: string                    // Main response text
  agent: {
    id: string
    name: string
    title: string
    avatar: string
    color: string
  }
  usage: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
    cacheCreationInputTokens?: number    // Tokens written to cache
    cacheReadInputTokens?: number        // Tokens read from cache
    totalInputTokens?: number            // Total including cached
  }
  model: string
}
```

**UI Display:**
- Message bubble with agent avatar and name
- Markdown formatting applied to content
- Token count and cost metadata shown
- Edit option available for user messages
- Workflow proposal card if detected
- Action confirmation panel if needed

---

## 13. ACTION EXECUTION FLOW

**When user confirms pending action:**

```
User sees confirmation prompt
    ↓
User clicks "Execute" button
    ↓
handleConfirmAction() triggered (line 742)
    ↓
executeAction(type, data) called (line 449)
    ↓
Composio client executes tool
    ↓
Result returned:
  - success: boolean
  - result: {data or error}
  - isDemoMode: boolean (if no COMPOSIO_API_KEY)
    ↓
UI shows result message:
  - ✅ Success: Display result data
  - ❌ Failure: Display error message
    ↓
pendingAction cleared
```

**Demo Mode:**
- Falls back to demo responses if `COMPOSIO_API_KEY` not configured
- Indicates "⚠️ Demo Mode" in results
- Helps users test without real credentials

---

## 14. ERROR HANDLING & RETRY

**API Client Retry Logic:** `nexus/src/lib/api-client.ts` (lines 263-375)

```typescript
private async request<T>(endpoint, options, retryConfig) {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig }

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      if (!navigator.onLine) throw APIError.networkError()

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(url, {...options, signal})
      clearTimeout(timeoutId)

      if (!response.ok) throw APIError.fromResponse(response, data)

      monitoring.trackAPIRequest({endpoint, status, success: true})
      return data
    } catch (error) {
      const shouldRetry = attempt < config.maxRetries &&
                          error.retryable &&
                          config.retryOn.includes(error.errorType)

      if (!shouldRetry) throw error

      const delay = Math.min(
        error.retryAfter || config.baseDelay * Math.pow(2, attempt),
        config.maxDelay
      )
      await new Promise(r => setTimeout(r, delay))
    }
  }
}
```

**Retry Configuration:**
- Max retries: 3 attempts
- Base delay: 1000ms
- Max delay: 10000ms
- Exponential backoff: baseDelay * 2^attempt
- Retryable errors: network, timeout, server, rate_limit

**Error Types:**
- `network` - Connection failed
- `auth` - Authentication error (401)
- `rate_limit` - API rate limited (429)
- `server` - Server error (5xx)
- `client` - Client error (4xx)
- `timeout` - Request timed out
- `unknown` - Unknown error

---

## 15. COMPLETE REQUEST/RESPONSE CYCLE

### Full Timeline

```
T+0ms     User types message and presses Enter
T+10ms    Message displayed in chat (optimistic update)
T+50ms    HTTP request sent to /api/chat
T+100ms   Backend receives request
T+150ms   Intent parsed, agent selected
T+200ms   System prompt assembled with caching
T+250ms   Anthropic API called
T+1500ms  Claude response received
T+1510ms  Response parsed for actions/workflows
T+1520ms  Response sent back to frontend
T+1550ms  Message displayed in chat with agent info
T+1600ms  Action confirmation prompt OR workflow proposal shown
T+N000ms  User confirms action/workflow
T+N100ms  Tool execution begins via Composio
T+N200ms  SSE connection opened for real-time updates
T+N300ms  Steps execute in parallel
T+N+2000ms  First SSE update received
...
T+N+Xms   Final completion event received
```

---

## 16. DATA FLOW SUMMARY

```
┌─────────────────────────────────────────────────────────────────┐
│ USER INPUT LAYER                                                 │
├─────────────────────────────────────────────────────────────────┤
│ AgentChatbot Component                                            │
│ - Text input + optional images                                   │
│ - Agent selection (auto or specific)                             │
│ - Edit & retry capability                                        │
└──────────────────────┬──────────────────────────────────────────┘
                       │ POST /api/chat
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ API LAYER (Vercel Serverless)                                    │
├─────────────────────────────────────────────────────────────────┤
│ /api/chat endpoint (nexus/api/chat.ts)                           │
│ - Request validation                                              │
│ - Agent routing logic                                             │
│ - Prompt caching setup                                            │
│ - Message formatting with images                                  │
└──────────────────────┬──────────────────────────────────────────┘
                       │ Anthropic API Call
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ AI INFERENCE LAYER (Claude)                                      │
├─────────────────────────────────────────────────────────────────┤
│ - Receives cached system prompt (agent personality + context)    │
│ - Analyzes conversation history                                  │
│ - Processes attached images if any                               │
│ - Generates response with special markers                        │
│ - Returns token usage + cache metrics                            │
└──────────────────────┬──────────────────────────────────────────┘
                       │ JSON response
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ PARSING LAYER (Frontend)                                         │
├─────────────────────────────────────────────────────────────────┤
│ - Extract ACTION_REQUEST → Composio tool execution              │
│ - Extract WORKFLOW_PROPOSAL → User approval flow                │
│ - Clean content for display                                      │
│ - Add message to UI with agent info                             │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ↓                             ↓
   ┌────────────┐            ┌─────────────────┐
   │ Immediate  │            │ Workflow        │
   │ Action     │            │ Planning &      │
   │ Execution  │            │ Execution       │
   └────────────┘            └─────────────────┘
        │                             │
        ↓                             ↓
   ┌────────────┐            ┌─────────────────┐
   │ Composio   │            │ Create workflow │
   │ Tool Call  │            │ in database     │
   │ (Single)   │            │ (Story 4.1)     │
   └────────────┘            │                 │
        │                     │ Start planning  │
        │                     │ (Story 4.2)     │
        ↓                     │                 │
   ┌────────────┐            │ Show plan for   │
   │ Integration│            │ user approval   │
   │ Executes   │            │                 │
   │ Action     │            │ ↓               │
   │ Result     │            └─────────────────┘
   │ shown      │                    │
   │ in chat    │                    │ User approves
   └────────────┘                    ↓
                            ┌─────────────────┐
                            │ Execute workflow│
                            │ with agents     │
                            │ (Story 4.4)     │
                            │                 │
                            │ SSE connection  │
                            │ opened for live │
                            │ updates         │
                            │                 │
                            │ Results returned│
                            │ to UI           │
                            └─────────────────┘
```

---

## 17. VERIFICATION CHECKLIST

To verify the chain is complete:

- [x] **User Input:** AgentChatbot captures text and images
- [x] **API Routing:** Messages sent to `/api/chat` with proper structure
- [x] **Intent Parsing:** Agent auto-routing based on keywords
- [x] **Tool Selection:** Composio client maps actions to 500+ integrations
- [x] **Workflow Generation:** WORKFLOW_PROPOSAL format extracted and processed
- [x] **Planning:** BMAD Director analyzes and creates execution plans
- [x] **Execution:** Multi-step workflows execute via agents
- [x] **Real-time Updates:** SSE connection provides live status
- [x] **Results Return:** Chat UI displays completion with metrics
- [x] **Error Handling:** Retry logic with exponential backoff
- [x] **Caching:** Prompt caching reduces costs 90% on cache hits

---

## 18. CHAIN COMPLETION STATUS

The end-to-end chain is **COMPLETE** with all major components:

1. ✅ User input capture (AgentChatbot)
2. ✅ API transport (secure backend)
3. ✅ Intent parsing (keyword-based routing)
4. ✅ Tool selection (Composio 500+ apps)
5. ✅ Workflow generation (BMAD Director)
6. ✅ Execution engine (parallel task execution)
7. ✅ Real-time updates (SSE streaming)
8. ✅ Results display (UI message bubbles)

**No gaps detected.** The chain flows seamlessly from user typing to workflow completion with proper error handling, caching, and user confirmation gates.
