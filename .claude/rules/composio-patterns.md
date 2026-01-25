# Composio Integration Patterns (MANDATORY)

## Tool Slug Resolution

### The TOOL_SLUGS Object (FIX-017)

All tool slugs MUST be resolved through the TOOL_SLUGS mapping:

```typescript
const TOOL_SLUGS: Record<string, Record<string, string>> = {
  gmail: {
    send: 'GMAIL_SEND_EMAIL',
    read: 'GMAIL_GET_MESSAGE',
    list: 'GMAIL_LIST_MESSAGES',
  },
  slack: {
    send: 'SLACK_SEND_MESSAGE',
    read: 'SLACK_GET_MESSAGE',
    list: 'SLACK_LIST_MESSAGES',
  },
  dropbox: {
    upload: 'DROPBOX_UPLOAD_FILE',
    download: 'DROPBOX_DOWNLOAD_FILE',
    list: 'DROPBOX_LIST_FOLDER',
  },
  // ... more integrations
}
```

### Action Verb Mapping

Map natural language to Composio actions:

| User Verb | Maps To | Example |
|-----------|---------|---------|
| save, store, upload | upload | "Save file to Dropbox" → DROPBOX_UPLOAD_FILE |
| send, deliver | send | "Send email" → GMAIL_SEND_EMAIL |
| read, fetch, get | read/get | "Get email" → GMAIL_GET_MESSAGE |
| list, show, display | list | "Show files" → DROPBOX_LIST_FOLDER |
| create, add, new | create | "Create task" → ASANA_CREATE_TASK |
| update, modify, edit | update | "Update issue" → GITHUB_UPDATE_ISSUE |
| delete, remove | delete | "Delete file" → DROPBOX_DELETE_FILE |

### Default Actions (FIX-018)

When action is ambiguous, use defaults:

```typescript
const defaultActions: Record<string, string> = {
  gmail: 'send',
  slack: 'send',
  dropbox: 'upload',  // NOT 'list'
  onedrive: 'upload', // NOT 'list'
  googlesheets: 'update',
  notion: 'create',
  github: 'create',
}
```

## Parameter Resolution (FIX-029)

### User Input → Tool Parameters

The system collects params under integration names but tools expect specific param names:

```typescript
// User provides via UI
collectedParams = { gmail: 'user@email.com' }

// Tool expects
toolParams = { to: 'user@email.com' }

// Mapping function
const integrationToPrimaryParam: Record<string, string> = {
  gmail: 'to',
  slack: 'channel',
  googlesheets: 'spreadsheet_id',
  dropbox: 'path',
  googledrive: 'file_id',
  github: 'repo',
  notion: 'page_id',
}
```

### Getting Default Parameters

```typescript
function getDefaultParams(
  toolSlug: string,
  node: WorkflowNode,
  connectionData?: ConnectionData,
  workflowContext?: WorkflowContext
): Record<string, unknown> {
  // Extract from node configuration
  // Merge with workflow context
  // Apply integration-specific defaults
}
```

## Pre-Execution Validation (FIX-019)

### Validate Before Execute

```typescript
function validateToolSlug(toolSlug: string): boolean {
  // Check if tool exists in Composio
  // Return false if tool not found
  // Log warning for debugging
}
```

### Fallback System (FIX-020)

```typescript
function getFallbackTools(toolkit: string, action: string): string[] {
  // When exact tool not found, suggest alternatives
  // e.g., DROPBOX_SAVE_FILE not found → suggest DROPBOX_UPLOAD_FILE
}
```

## Rube MCP Tool Calls

### Search for Tools
```typescript
RUBE_SEARCH_TOOLS({
  queries: [{
    use_case: "send email via gmail",
    known_fields: "recipient: john@example.com"
  }],
  session: { generate_id: true }
})
```

### Get Tool Schema
```typescript
RUBE_GET_TOOL_SCHEMAS({
  tool_slugs: ["GMAIL_SEND_EMAIL"],
  session_id: "<session_id>"
})
```

### Execute Tool
```typescript
RUBE_MULTI_EXECUTE_TOOL({
  tools: [{
    tool_slug: "GMAIL_SEND_EMAIL",
    arguments: {
      to: "recipient@email.com",
      subject: "Subject",
      body: "Email body"
    }
  }],
  session_id: "<session_id>",
  sync_response_to_workbench: false,
  memory: {}
})
```

## Error Patterns

### Tool Not Found
```
Error: Tool DROPBOX_SAVE_FILE not found
```
→ Use `getFallbackTools()` to suggest DROPBOX_UPLOAD_FILE

### Missing Parameters
```
Error: Missing required parameters: to
```
→ Show user-friendly collection modal
→ Map collected value via `mapCollectedParamsToToolParams()`

### Connection Not Active
```
Error: No active connection for toolkit gmail
```
→ Initiate OAuth flow
→ Auto-retry after connection

## Protected Fix Markers

Never remove code with these markers:

| Marker | Purpose | File |
|--------|---------|------|
| @NEXUS-FIX-017 | Storage action mappings | WorkflowPreviewCard.tsx |
| @NEXUS-FIX-018 | Default actions | WorkflowPreviewCard.tsx |
| @NEXUS-FIX-019 | Tool validation | WorkflowPreviewCard.tsx |
| @NEXUS-FIX-020 | Fallback suggestions | WorkflowPreviewCard.tsx |
| @NEXUS-FIX-029 | Param mapping | WorkflowPreviewCard.tsx |

## Adding New Integrations

### Checklist
1. [ ] Add to TOOL_SLUGS mapping
2. [ ] Add to defaultActions
3. [ ] Add to integrationToPrimaryParam
4. [ ] Update AI knowledge (agents/index.ts)
5. [ ] Test with `/test-workflow`
6. [ ] Run `/validate`

### Example: Adding Trello
```typescript
// 1. TOOL_SLUGS
trello: {
  create: 'TRELLO_CREATE_CARD',
  update: 'TRELLO_UPDATE_CARD',
  list: 'TRELLO_LIST_CARDS',
}

// 2. defaultActions
trello: 'create',

// 3. paramMapping
trello: 'board_id',

// 4. Test
"Create a Trello card when I get an email" → GMAIL → TRELLO_CREATE_CARD
```
