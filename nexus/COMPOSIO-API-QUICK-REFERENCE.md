# Composio API Quick Reference

Quick reference for all Composio API endpoints in Nexus.

---

## Base URL
- **Production:** `https://nexus-theta-peach.vercel.app/api/composio`
- **Local:** `http://localhost:5173/api/composio`

---

## Endpoints

### 1. Check Configuration Status
```bash
GET /api/composio/status
```

**Response:**
```json
{
  "success": true,
  "status": "configured",
  "isDemoMode": false,
  "message": "Composio is configured and ready.",
  "timestamp": "2026-01-13T..."
}
```

---

### 2. Execute Single Tool
```bash
POST /api/composio/execute
Content-Type: application/json
```

**Request:**
```json
{
  "toolSlug": "GMAIL_SEND_EMAIL",
  "params": {
    "to": "user@example.com",
    "subject": "Hello",
    "body": "Test message"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "msg_123...",
    "status": "sent"
  },
  "toolSlug": "GMAIL_SEND_EMAIL",
  "isDemoMode": false
}
```

---

### 3. Execute Multiple Tools (Batch)
```bash
POST /api/composio/execute-batch
Content-Type: application/json
```

**Request:**
```json
{
  "tools": [
    {
      "toolSlug": "GMAIL_SEND_EMAIL",
      "params": { "to": "test@example.com", "subject": "Hi", "body": "Hello" }
    },
    {
      "toolSlug": "SLACK_SEND_MESSAGE",
      "params": { "channel": "#general", "text": "New email sent!" }
    }
  ],
  "sequential": true
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    { "toolSlug": "GMAIL_SEND_EMAIL", "success": true, "data": {...} },
    { "toolSlug": "SLACK_SEND_MESSAGE", "success": true, "data": {...} }
  ],
  "totalExecuted": 2,
  "successCount": 2,
  "isDemoMode": false
}
```

---

### 4. List Available Tools
```bash
GET /api/composio/tools?toolkit=gmail
```

**Response:**
```json
{
  "success": true,
  "toolkit": "gmail",
  "tools": [
    {
      "slug": "GMAIL_SEND_EMAIL",
      "name": "Send Email",
      "description": "Send an email via Gmail"
    },
    {
      "slug": "GMAIL_FETCH_EMAILS",
      "name": "Fetch Emails",
      "description": "Get emails from inbox"
    }
  ],
  "totalTools": 4,
  "isDemoMode": false
}
```

**List All Toolkits:**
```bash
GET /api/composio/tools
```

---

### 5. Check Connection Status
```bash
GET /api/composio/connection?toolkit=gmail
```

**Response (Connected):**
```json
{
  "success": true,
  "connected": true,
  "toolkit": "gmail",
  "isDemoMode": false,
  "authUrl": null
}
```

**Response (Not Connected):**
```json
{
  "success": true,
  "connected": false,
  "toolkit": "gmail",
  "isDemoMode": false,
  "authUrl": "https://app.composio.dev/apps/gmail"
}
```

---

### 6. Initiate OAuth Connection
```bash
POST /api/composio/connect
Content-Type: application/json
```

**Request:**
```json
{
  "toolkit": "gmail",
  "userId": "user_123"
}
```

**Response:**
```json
{
  "success": true,
  "authUrl": "https://oauth.composio.dev/gmail/...",
  "connectionId": "conn_abc123",
  "toolkit": "gmail",
  "isDemoMode": false
}
```

**Usage:**
```javascript
// Redirect user to authUrl
window.location.href = response.authUrl
```

---

### 7. Create Session
```bash
POST /api/composio/session
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "isDemoMode": false,
  "availableToolkits": [
    "gmail", "slack", "googlecalendar", "googlesheets",
    "github", "notion", "hubspot", "shopify", "stripe"
  ]
}
```

---

### 8. User Operations

#### List User's Connected Apps
```bash
GET /api/composio/user?userId=user_123&action=apps
```

**Response:**
```json
{
  "success": true,
  "userId": "user_123",
  "apps": [
    { "id": "gmail", "name": "Gmail", "connected": true },
    { "id": "slack", "name": "Slack", "connected": true }
  ],
  "isDemoMode": false
}
```

#### Connect App for User
```bash
POST /api/composio/user?userId=user_123&action=connect&appId=gmail
```

#### Disconnect App for User
```bash
DELETE /api/composio/user?userId=user_123&action=disconnect&appId=gmail
```

#### Execute Tool for User
```bash
POST /api/composio/user?userId=user_123&action=execute
Content-Type: application/json

{
  "toolSlug": "GMAIL_SEND_EMAIL",
  "params": {...}
}
```

---

## Frontend Usage Examples

### Using Fetch API

```typescript
// Check status
async function checkComposioStatus() {
  const response = await fetch('/api/composio/status')
  const data = await response.json()
  console.log('Composio status:', data.status)
  return data
}

// Execute tool
async function sendEmail(to: string, subject: string, body: string) {
  const response = await fetch('/api/composio/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      toolSlug: 'GMAIL_SEND_EMAIL',
      params: { to, subject, body }
    })
  })

  const result = await response.json()
  if (result.success) {
    console.log('Email sent:', result.data)
  } else {
    console.error('Failed:', result.error)
  }
  return result
}

// List tools for toolkit
async function getToolsForGmail() {
  const response = await fetch('/api/composio/tools?toolkit=gmail')
  const data = await response.json()
  console.log('Available tools:', data.tools)
  return data.tools
}

// Check connection
async function checkGmailConnection() {
  const response = await fetch('/api/composio/connection?toolkit=gmail')
  const data = await response.json()

  if (!data.connected) {
    console.log('Not connected. Auth URL:', data.authUrl)
    // Redirect to OAuth flow
    window.location.href = data.authUrl
  }
  return data
}

// Initiate connection
async function connectGmail(userId: string) {
  const response = await fetch('/api/composio/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toolkit: 'gmail', userId })
  })

  const data = await response.json()
  if (data.authUrl) {
    window.location.href = data.authUrl
  }
  return data
}

// Batch execution
async function executeWorkflow() {
  const response = await fetch('/api/composio/execute-batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tools: [
        { toolSlug: 'GMAIL_FETCH_EMAILS', params: { maxResults: 10 } },
        { toolSlug: 'SLACK_SEND_MESSAGE', params: { channel: '#general', text: 'New emails fetched' } }
      ],
      sequential: true
    })
  })

  const result = await response.json()
  console.log('Workflow results:', result.results)
  return result
}
```

---

## Using API Client (Recommended)

```typescript
import apiClient from '@/lib/api-client'

// The API client has built-in methods for Composio
// Check nexus/src/lib/api-client.ts for all available methods

// Example: Execute tool
const result = await apiClient.composio.execute({
  toolSlug: 'GMAIL_SEND_EMAIL',
  params: { to: 'user@example.com', subject: 'Hi', body: 'Hello' }
})

// Example: Check connection
const status = await apiClient.composio.checkConnection('gmail')
```

---

## Available Toolkits (Demo Mode)

1. **Gmail** - Email operations
2. **Slack** - Team messaging
3. **Google Calendar** - Calendar management
4. **Google Sheets** - Spreadsheet operations
5. **GitHub** - Repository management
6. **Notion** - Note-taking and databases
7. **HubSpot** - CRM operations
8. **Shopify** - E-commerce operations
9. **Stripe** - Payment processing

---

## Common Tool Slugs

### Gmail
- `GMAIL_SEND_EMAIL`
- `GMAIL_FETCH_EMAILS`
- `GMAIL_CREATE_DRAFT`
- `GMAIL_SEARCH_EMAILS`

### Slack
- `SLACK_SEND_MESSAGE`
- `SLACK_LIST_CHANNELS`
- `SLACK_CREATE_CHANNEL`

### Google Calendar
- `GOOGLECALENDAR_CREATE_EVENT`
- `GOOGLECALENDAR_GET_EVENTS`
- `GOOGLECALENDAR_UPDATE_EVENT`

### Google Sheets
- `GOOGLESHEETS_APPEND_DATA`
- `GOOGLESHEETS_GET_DATA`
- `GOOGLESHEETS_UPDATE_CELL`

### GitHub
- `GITHUB_CREATE_ISSUE`
- `GITHUB_LIST_ISSUES`
- `GITHUB_CREATE_PR`

### Notion
- `NOTION_CREATE_PAGE`
- `NOTION_UPDATE_PAGE`
- `NOTION_SEARCH`

---

## Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error message here",
  "hint": "Optional suggestion"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad request (missing parameters)
- `405` - Method not allowed
- `500` - Server error

**Handle Errors:**
```typescript
try {
  const response = await fetch('/api/composio/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toolSlug: 'GMAIL_SEND_EMAIL', params: {...} })
  })

  const data = await response.json()

  if (!response.ok || !data.success) {
    console.error('API Error:', data.error)
    // Show user-friendly error
    alert(data.error || 'Something went wrong')
    return
  }

  console.log('Success:', data.data)
} catch (error) {
  console.error('Network error:', error)
  alert('Network error. Please try again.')
}
```

---

## Demo Mode vs Real Mode

### Demo Mode (COMPOSIO_API_KEY not set)
- ✅ Returns mock data
- ✅ No external API calls
- ✅ Perfect for testing UI
- ✅ Instant responses
- ✅ All responses include `isDemoMode: true`

### Real Mode (COMPOSIO_API_KEY set)
- ✅ Actual API calls to Composio
- ✅ Real OAuth flows
- ✅ Live data from connected services
- ✅ Rate limits apply
- ✅ All responses include `isDemoMode: false`

**Check Mode:**
```typescript
const status = await fetch('/api/composio/status').then(r => r.json())
if (status.isDemoMode) {
  console.log('Running in demo mode')
} else {
  console.log('Running with real API')
}
```

---

## Environment Variables

### Required for Real Mode
```env
COMPOSIO_API_KEY=your_api_key_here
```

### Optional
```env
COMPOSIO_REDIRECT_URL=https://your-domain.com/oauth/callback
```

---

## Testing Checklist

- [ ] Test status endpoint
- [ ] Test tool listing
- [ ] Test connection check
- [ ] Test demo mode execution
- [ ] Test batch execution
- [ ] Test error handling
- [ ] Test with real API key
- [ ] Test OAuth flow
- [ ] Test user-specific operations

---

## Support

- **Composio Docs:** https://docs.composio.dev
- **Composio Dashboard:** https://app.composio.dev
- **API Reference:** See COMPOSIO-API-VERIFICATION-REPORT.md
