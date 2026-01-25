# Nexus API Documentation

This document covers all API client methods, services, and utilities in the Nexus application.

## Table of Contents

- [API Client](#api-client)
- [Services](#services)
- [Utilities](#utilities)
- [Types](#types)

---

## API Client

Location: `src/lib/api-client.ts`

The API client provides secure communication with backend endpoints. All AI and integration calls go through the server, not directly from the browser.

### Initialization

```typescript
import { apiClient } from '@/lib/api-client'
```

The client is a singleton instance with built-in retry logic and error handling.

### Configuration

| Config | Default | Description |
|--------|---------|-------------|
| `maxRetries` | 3 | Maximum retry attempts |
| `baseDelay` | 1000ms | Initial retry delay |
| `maxDelay` | 10000ms | Maximum retry delay |
| `timeout` | 30000ms | Request timeout |

---

### Chat Methods

#### `chat(request: ChatRequest): Promise<ChatResponse>`

Send a chat message to Claude through the secure backend.

```typescript
const response = await apiClient.chat({
  messages: [
    { role: 'user', content: 'Hello, how can you help me today?' }
  ],
  systemPrompt: 'You are a helpful workflow assistant.',
  model: 'claude-sonnet-4-20250514',
  maxTokens: 1024,
  agentId: 'analyst',     // Optional: specific Nexus agent
  autoRoute: true,        // Optional: auto-route to best agent
  images: []              // Optional: attached images
})

if (response.success) {
  console.log('AI Response:', response.output)
  console.log('Tokens used:', response.usage?.totalTokens)
  console.log('Cost:', response.costUSD)
}
```

**ChatRequest Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `messages` | `Array<{role, content}>` | Yes | Conversation history |
| `systemPrompt` | `string` | No | System prompt for AI |
| `model` | `string` | No | Model ID (haiku, sonnet, opus) |
| `maxTokens` | `number` | No | Maximum output tokens |
| `agentId` | `string` | No | Specific Nexus agent ID |
| `autoRoute` | `boolean` | No | Auto-route to best agent |
| `images` | `ImageContent[]` | No | Images to analyze |

**ChatResponse:**

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Request success status |
| `output` | `string` | AI response text |
| `tokensUsed` | `number` | Total tokens consumed |
| `agent` | `NexusAgent` | Responding agent info |
| `usage` | `object` | Detailed token usage |
| `costUSD` | `number` | Estimated cost in USD |

#### `runPrompt(prompt: string, options?): Promise<string>`

Quick helper for single-prompt requests.

```typescript
const result = await apiClient.runPrompt(
  'Summarize this document: ...',
  {
    model: 'claude-3-5-haiku-20241022',
    maxTokens: 500,
    systemPrompt: 'You are a summarization expert.'
  }
)
```

#### `getAgents(): Promise<{success, agents}>`

Get list of available Nexus agents.

```typescript
const { agents } = await apiClient.getAgents()
// Returns: [{ id, name, title, avatar, color }, ...]
```

---

### Workflow Methods

#### `createNexusWorkflow(request): Promise<Response>`

Create a new Nexus workflow.

```typescript
const response = await apiClient.createNexusWorkflow({
  name: 'Email Processing Pipeline',
  description: 'Automatically categorize and respond to emails',
  workflow_definition: {
    nodes: [...],
    edges: [...]
  },
  autonomyLevel: 'semi'  // 'supervised' | 'semi' | 'autonomous' | 'ultimate'
})

if (response.success) {
  console.log('Created workflow:', response.data?.id)
}
```

#### `startNexusWorkflow(workflowId: string): Promise<Response>`

Start workflow planning stage.

```typescript
const response = await apiClient.startNexusWorkflow('workflow-123')
// Returns: { success, data: { stage, tasks } }
```

#### `approveNexusWorkflow(workflowId: string): Promise<Response>`

Approve workflow plan for execution.

```typescript
const response = await apiClient.approveNexusWorkflow('workflow-123')
// Returns: { success, data: { status } }
```

#### `executeNexusWorkflow(workflowId, options?): Promise<Response>`

Execute a workflow.

```typescript
const response = await apiClient.executeNexusWorkflow('workflow-123', {
  autonomyLevel: 'autonomous'
})
// Returns: { success, data: { status, executionId } }
```

#### `executeNexusWorkflowCoordinated(workflowId, options?): Promise<Response>`

Execute with multi-agent coordination.

```typescript
const response = await apiClient.executeNexusWorkflowCoordinated('workflow-123', {
  autonomyLevel: 'ultimate'
})
// Returns: { success, data: { status, agents, executionId } }
```

#### `getNexusWorkflowStatus(workflowId: string): Promise<Response>`

Get current workflow status.

```typescript
const response = await apiClient.getNexusWorkflowStatus('workflow-123')

if (response.success) {
  const { status, stage, totalTokensUsed, totalCostUsd, nodes, checkpoints } = response.data
}
```

#### `listNexusWorkflows(): Promise<Response>`

Get all user workflows.

```typescript
const response = await apiClient.listNexusWorkflows()
// Returns: { success, data: [{ id, name, status, created_at, updated_at }, ...] }
```

#### `recoverNexusWorkflow(workflowId, checkpointName?): Promise<Response>`

Recover workflow from checkpoint.

```typescript
const response = await apiClient.recoverNexusWorkflow('workflow-123', 'checkpoint-5')
// Returns: { success, data: { status, recoveredFrom } }
```

---

### SSE (Server-Sent Events)

#### `getSSETicket(workflowId, userId?): Promise<Response>`

Request a secure SSE ticket for real-time updates.

```typescript
const { ticket, expiresIn } = await apiClient.getSSETicket('workflow-123', 'user-456')
```

#### `getSecureSSEConnectionUrl(workflowId, ticket): string`

Get secure SSE connection URL using ticket.

```typescript
const ticket = await apiClient.getSSETicket('workflow-123')
const url = apiClient.getSecureSSEConnectionUrl('workflow-123', ticket.ticket)

const eventSource = new EventSource(url)
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log('Workflow update:', data)
}
```

---

### Email Methods

#### `sendEmail(request: EmailRequest): Promise<EmailResponse>`

Send an email through the backend.

```typescript
const response = await apiClient.sendEmail({
  to: ['user@example.com'],
  subject: 'Workflow Complete',
  body: 'Your workflow has finished executing.',
  from: 'noreply@nexus.app',
  replyTo: 'support@nexus.app'
})

if (response.success) {
  console.log('Email sent:', response.emailId)
}
```

#### `sendEmailViaIntegrations(request): Promise<EmailResponse>`

Send email through integrations API.

```typescript
const response = await apiClient.sendEmailViaIntegrations({
  to: 'user@example.com',
  subject: 'Test',
  body: 'Hello!'
})
```

---

### Integration Methods

#### `hubspot(request: HubSpotRequest): Promise<HubSpotResponse>`

Perform HubSpot CRM operations.

```typescript
// Create contact
const response = await apiClient.hubspot({
  action: 'createContact',
  data: {
    email: 'john@example.com',
    firstname: 'John',
    lastname: 'Doe'
  }
})

// Search contacts
const searchResponse = await apiClient.hubspot({
  action: 'searchContacts',
  query: 'john',
  limit: 10
})

// Update contact
const updateResponse = await apiClient.hubspot({
  action: 'updateContact',
  contactId: 'contact-123',
  data: { company: 'Acme Inc' }
})
```

**Available Actions:**
- `createContact` - Create a new contact
- `updateContact` - Update existing contact
- `getContact` - Get contact by ID
- `searchContacts` - Search contacts by query
- `createDeal` - Create a new deal
- `listContacts` - List all contacts

#### `extractYouTube(url: string): Promise<Response>`

Extract YouTube video information.

```typescript
const response = await apiClient.extractYouTube('https://youtube.com/watch?v=...')

if (response.success) {
  const { videoId, title, author, thumbnail } = response.video
}
```

---

### Admin Methods

#### `vercelAdmin(request: VercelAdminRequest): Promise<Response>`

Vercel admin operations.

```typescript
// Get deployments
const deployments = await apiClient.getDeployments()

// Trigger redeploy
await apiClient.redeploy('deployment-id')

// Get environment variables
const envVars = await apiClient.getEnvVars()

// Set environment variable
await apiClient.setEnvVar('API_KEY', 'new-value')
```

#### `supabaseAdmin(request: SupabaseAdminRequest): Promise<Response>`

Supabase admin operations.

```typescript
// Get tables
const tables = await apiClient.getTables()

// Run SQL query
const result = await apiClient.runSql('SELECT * FROM workflows LIMIT 10')
```

---

### Health Check

#### `healthCheck(): Promise<{chat, email, hubspot}>`

Check backend API availability.

```typescript
const health = await apiClient.healthCheck()
console.log('Chat API:', health.chat ? 'Available' : 'Unavailable')
console.log('Email API:', health.email ? 'Available' : 'Unavailable')
console.log('HubSpot API:', health.hubspot ? 'Available' : 'Unavailable')
```

---

### Error Handling

The API client includes the `APIError` class for structured error handling.

```typescript
import { APIError } from '@/lib/api-client'

try {
  await apiClient.chat({ messages: [...] })
} catch (error) {
  if (error instanceof APIError) {
    console.log('Status Code:', error.statusCode)
    console.log('Error Type:', error.errorType)  // 'network' | 'auth' | 'rate_limit' | 'server' | 'client' | 'timeout' | 'unknown'
    console.log('Retryable:', error.retryable)
    console.log('Retry After:', error.retryAfter)  // milliseconds
  }
}
```

---

## Services

### Nexus Service

Location: `src/lib/nexus-service.ts`

Workflow execution service with Claude Code Proxy integration.

```typescript
import { nexusService } from '@/lib/nexus-service'

const result = await nexusService.execute({
  type: 'Nexus',
  prompt: 'Analyze this data...',
  model: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
  temperature: 0.7
})

if (result.success) {
  console.log('Output:', result.output)
  console.log('Tokens:', result.tokensUsed)
  console.log('Cost:', result.costUSD)
  console.log('Source:', result.source)  // 'proxy' | 'api' | 'simulation'
}
```

### Workflow Engine

Location: `src/lib/workflow-engine.ts`

Multi-step workflow execution with auto-recovery.

```typescript
import { WorkflowEngine } from '@/lib/workflow-engine'

const engine = new WorkflowEngine(
  'workflow-id',
  'execution-id',
  workflowDefinition,
  (state) => console.log('Progress:', state),
  { maxRetries: 3, autoRecoveryEnabled: true }
)

const result = await engine.execute({ initialData: {...} })
```

**WorkflowNode Types:**
- `ai-agent` - AI processing node
- `condition` - Conditional branching
- `loop` - Loop/iteration node
- `data-transform` - Data transformation
- `api-call` - External API call
- `start` - Workflow start
- `end` - Workflow end

---

## Utilities

### Supabase Client

Location: `src/lib/supabase.ts`

```typescript
import { supabase } from '@/lib/supabase'

// Query data
const { data, error } = await supabase
  .from('workflows')
  .select('*')
  .eq('user_id', userId)

// Insert data
const { data, error } = await supabase
  .from('workflows')
  .insert({ name: 'New Workflow', ... })
  .select()
  .single()
```

### Validation

Location: `src/lib/validation.ts`

```typescript
import { validateEmail, validatePassword, sanitizeInput } from '@/lib/validation'

const isValidEmail = validateEmail('user@example.com')
const { isValid, errors } = validatePassword('MyPassword123!')
const cleanInput = sanitizeInput(userInput)
```

### Analytics

Location: `src/lib/analytics.ts`

```typescript
import { trackEvent, trackPageView, setUserProperties } from '@/lib/analytics'

trackEvent('workflow_created', { name: 'My Workflow', nodeCount: 5 })
trackPageView('/dashboard')
setUserProperties({ plan: 'pro', company: 'Acme' })
```

### Cache

Location: `src/lib/cache.ts`

```typescript
import { cache } from '@/lib/cache'

// Set with TTL
cache.set('key', value, 60000)  // 60 second TTL

// Get value
const value = cache.get('key')

// Delete
cache.delete('key')

// Clear all
cache.clear()
```

### Rate Limiter

Location: `src/lib/rate-limiter.ts`

```typescript
import { rateLimiter } from '@/lib/rate-limiter'

const canProceed = rateLimiter.check('api-calls', {
  maxRequests: 100,
  windowMs: 60000
})

if (!canProceed) {
  console.log('Rate limited, try again later')
}
```

### Cost Estimator

Location: `src/lib/cost-estimator.ts`

```typescript
import { estimateCost, formatCost } from '@/lib/cost-estimator'

const cost = estimateCost({
  model: 'claude-sonnet-4-20250514',
  inputTokens: 1000,
  outputTokens: 500
})

console.log('Estimated cost:', formatCost(cost))
```

### Sanitization

Location: `src/lib/sanitize.ts`

```typescript
import { sanitizeHtml, sanitizeUrl, sanitizeFileName } from '@/lib/sanitize'

const cleanHtml = sanitizeHtml(userHtml)
const cleanUrl = sanitizeUrl(userUrl)
const cleanFileName = sanitizeFileName(userFileName)
```

### Error Logger

Location: `src/lib/error-logger.ts`

```typescript
import { logError, logWarning, logInfo } from '@/lib/error-logger'

logError(new Error('Something failed'), { context: 'workflow-execution' })
logWarning('Rate limit approaching', { currentUsage: 95 })
logInfo('User logged in', { userId: '123' })
```

### Workflow I/O

Location: `src/lib/workflow-io.ts`

```typescript
import { exportWorkflow, importWorkflow, validateWorkflowJson } from '@/lib/workflow-io'

// Export to JSON
const json = exportWorkflow(workflow)

// Import from JSON
const workflow = importWorkflow(jsonString)

// Validate JSON structure
const { valid, errors } = validateWorkflowJson(jsonString)
```

### Batch API

Location: `src/lib/batch-api.ts`

```typescript
import { batchRequest, batchProcess } from '@/lib/batch-api'

// Batch multiple API requests
const results = await batchRequest([
  { endpoint: '/workflows', method: 'GET' },
  { endpoint: '/templates', method: 'GET' },
  { endpoint: '/integrations', method: 'GET' }
])

// Process items in batches
await batchProcess(items, 10, async (batch) => {
  // Process batch of 10 items
})
```

---

## Types

### Core Types

```typescript
// Nexus Agent
interface NexusAgent {
  id: string
  name: string
  title: string
  avatar: string
  color: string
}

// Workflow Step
interface WorkflowStep {
  id: string
  type: 'ai-agent' | 'email' | 'http' | 'data-transform' | 'condition'
  config: Record<string, any>
  label: string
}

// Workflow Node
interface WorkflowNode {
  id: string
  type: 'ai-agent' | 'condition' | 'loop' | 'data-transform' | 'api-call' | 'start' | 'end'
  label: string
  config: {
    prompt?: string
    model?: string
    condition?: string
    transformOperations?: TransformOperation[]
    apiUrl?: string
    loopCount?: number
  }
  position: { x: number; y: number }
}

// Execution Step
interface ExecutionStep {
  nodeId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retrying'
  input: any
  output: any
  error?: string
  startTime?: Date
  endTime?: Date
  tokensUsed?: number
  costUSD?: number
  retryCount?: number
}
```

### Request/Response Types

```typescript
// Chat Request
interface ChatRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  systemPrompt?: string
  model?: 'claude-3-5-haiku-20241022' | 'claude-sonnet-4-20250514' | 'claude-opus-4-5-20251101'
  maxTokens?: number
  agentId?: string
  autoRoute?: boolean
  images?: ImageContent[]
}

// Chat Response
interface ChatResponse {
  success: boolean
  output: string
  tokensUsed?: number
  agent?: NexusAgent
  usage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
    cacheCreationInputTokens?: number
    cacheReadInputTokens?: number
  }
  costUSD?: number
  error?: string
}

// Email Request
interface EmailRequest {
  to: string | string[]
  subject: string
  body: string
  from?: string
  replyTo?: string
}

// HubSpot Request
interface HubSpotRequest {
  action: 'createContact' | 'updateContact' | 'getContact' | 'searchContacts' | 'createDeal' | 'listContacts'
  data?: Record<string, any>
  contactId?: string
  query?: string
  limit?: number
}
```

### Error Types

```typescript
class APIError extends Error {
  readonly statusCode: number
  readonly errorType: 'network' | 'auth' | 'rate_limit' | 'server' | 'client' | 'timeout' | 'unknown'
  readonly retryable: boolean
  readonly retryAfter?: number
}
```

---

## Environment Variables

Required environment variables for API functionality:

```env
# API Configuration
VITE_API_URL=                      # Backend API URL (optional, defaults to relative)
VITE_ANTHROPIC_API_KEY=            # Direct Anthropic API key (optional)

# Supabase
VITE_SUPABASE_URL=                 # Supabase project URL
VITE_SUPABASE_ANON_KEY=            # Supabase anonymous key

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=        # Clerk publishable key

# Stripe (optional)
VITE_STRIPE_PUBLISHABLE_KEY=       # Stripe publishable key
```

---

## Rate Limits

Default rate limits enforced by the API:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/chat` | 100 requests | 1 minute |
| `/api/workflows` | 50 requests | 1 minute |
| `/api/send-email` | 20 requests | 1 minute |
| `/api/integrations/*` | 30 requests | 1 minute |

---

## Best Practices

1. **Error Handling**: Always wrap API calls in try-catch and handle `APIError` specifically.

2. **Loading States**: Show loading indicators during API calls.

3. **Retries**: The client handles retries automatically for transient errors.

4. **Caching**: Use the cache utility for frequently accessed data.

5. **Rate Limiting**: Check rate limiter before bulk operations.

6. **Token Tracking**: Monitor token usage via response.usage for cost management.

7. **SSE Security**: Always use ticket-based SSE authentication, never expose tokens in URLs.
