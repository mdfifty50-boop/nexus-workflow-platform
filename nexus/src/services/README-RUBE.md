# RubeExecutionService

Bridge between Nexus workflows and Rube MCP for real OAuth-authenticated execution.

## Overview

The RubeExecutionService translates Nexus workflow nodes into Rube MCP tool calls, handling:

- **OAuth authentication** - Check connections and initiate OAuth flows
- **Tool mapping** - Map Nexus integration slugs to Rube MCP tool names
- **Workflow execution** - Execute complete workflows via Rube MCP

## Usage

### 1. Check Connections

```typescript
import { rubeExecutionService } from '@/services/RubeExecutionService'

// Check which apps are connected
const connections = await rubeExecutionService.checkConnections(['gmail', 'slack'])

connections.forEach((status, toolkit) => {
  if (!status.connected) {
    console.log(`${toolkit} needs auth: ${status.authUrl}`)
  }
})
```

### 2. Initiate OAuth

```typescript
// Get OAuth URL for missing integration
const { authUrl, error } = await rubeExecutionService.initiateOAuth('gmail')

if (authUrl) {
  window.open(authUrl, '_blank')
}
```

### 3. Execute Workflow

```typescript
const nodes: WorkflowNode[] = [
  {
    id: 'node_1',
    name: 'Send email',
    type: 'action',
    integration: 'gmail',
    status: 'idle',
  },
  {
    id: 'node_2',
    name: 'Post to Slack',
    type: 'action',
    integration: 'slack',
    status: 'idle',
  },
]

const result = await rubeExecutionService.executeWorkflow(nodes)

if (result.success) {
  console.log('Workflow completed:', result.results)
} else {
  console.log('Failed nodes:', result.failedNodes)
}
```

## Tool Mappings

### Gmail
- `send` → `GMAIL_SEND_EMAIL`
- `fetch` → `GMAIL_FETCH_EMAILS`
- `draft` → `GMAIL_CREATE_EMAIL_DRAFT`
- `reply` → `GMAIL_REPLY_TO_THREAD`

### Slack
- `send` → `SLACK_SEND_MESSAGE`
- `findChannels` → `SLACK_FIND_CHANNELS`
- `listChannels` → `SLACK_LIST_ALL_CHANNELS`

### Google Sheets
- `read` → `GOOGLESHEETS_BATCH_GET`
- `write` → `GOOGLESHEETS_BATCH_UPDATE`
- `append` → `GOOGLESHEETS_BATCH_UPDATE`

### Google Calendar
- `create` → `GOOGLECALENDAR_CREATE_EVENT`
- `list` → `GOOGLECALENDAR_EVENTS_LIST`
- `update` → `GOOGLECALENDAR_UPDATE_EVENT`

### GitHub
- `issue` → `GITHUB_CREATE_ISSUE`
- `createIssue` → `GITHUB_CREATE_ISSUE`
- `listIssues` → `GITHUB_LIST_REPOSITORY_ISSUES`

## Server API Endpoints

The service communicates with these backend endpoints:

- `GET /api/rube/status` - Check if Rube MCP is available
- `POST /api/rube/connections` - Check connection status for toolkits
- `POST /api/rube/oauth/initiate` - Get OAuth URL for toolkit
- `POST /api/rube/execute` - Execute single tool
- `POST /api/rube/execute-batch` - Execute multiple tools
- `GET /api/rube/tools` - List available tools

## Integration with WorkflowPreviewCard

The service is designed to integrate seamlessly with `WorkflowPreviewCard.tsx`:

```typescript
import { rubeExecutionService } from '@/services/RubeExecutionService'

// In WorkflowPreviewCard component
const handleExecute = async () => {
  // 1. Check connections
  const integrations = workflow.nodes
    .filter(n => n.integration)
    .map(n => n.integration!)

  const connections = await rubeExecutionService.checkConnections(integrations)

  // 2. Handle missing connections
  for (const [toolkit, status] of connections) {
    if (!status.connected && status.authUrl) {
      // Trigger OAuth flow
      window.open(status.authUrl, '_blank')
      return // Wait for OAuth completion
    }
  }

  // 3. All connected - execute workflow
  const result = await rubeExecutionService.executeWorkflow(workflow.nodes)

  if (result.success) {
    onExecutionComplete?.(true, result.results)
  } else {
    onExecutionComplete?.(false, result.failedNodes)
  }
}
```

## Current Status

The service is implemented with:

✅ TypeScript interfaces defined
✅ Tool mapping logic complete
✅ OAuth flow structure in place
✅ Server routes registered
✅ Error handling implemented

🚧 TODO:
- [ ] Implement actual Rube MCP tool calls in server routes
- [ ] Add OAuth callback handling
- [ ] Integrate with WorkflowPreviewCard component
- [ ] Add polling for OAuth completion
- [ ] Add real execution logs

## Architecture

```
┌─────────────────────────────────────────────────┐
│          WorkflowPreviewCard (React)            │
│  - User clicks "Execute"                        │
│  - Shows visual workflow nodes                  │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│       RubeExecutionService (Client)             │
│  - checkConnections(toolkits)                   │
│  - initiateOAuth(toolkit)                       │
│  - executeWorkflow(nodes)                       │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│         /api/rube/* (Server)                    │
│  - Connection status checks                     │
│  - OAuth URL generation                         │
│  - Tool execution via Rube MCP                  │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│           Rube MCP Server                       │
│  - OAuth-authenticated API calls                │
│  - 500+ app integrations                        │
│  - Real tool execution                          │
└─────────────────────────────────────────────────┘
```

## Next Steps

1. **Test Connection Checking**: Verify connection status detection works
2. **Test OAuth Flow**: Complete OAuth cycle with real service
3. **Test Tool Execution**: Execute a simple workflow end-to-end
4. **Add to WorkflowPreviewCard**: Replace mock execution with real calls
5. **Add Real Logs**: Show execution progress in real-time

---

**Status**: ✅ Service created, ready for integration testing
**Created**: 2026-01-18
**Last Updated**: 2026-01-18
