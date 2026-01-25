# Nexus Architecture Overview

This document provides a high-level overview of the Nexus application architecture.

## System Overview

Nexus is an AI-powered workflow automation platform built with React, TypeScript, and modern cloud services.

```
                                    NEXUS ARCHITECTURE

    +------------------------------------------------------------------+
    |                         CLIENT (Browser)                          |
    |  +------------------------------------------------------------+  |
    |  |                    React Application                        |  |
    |  |  +----------+  +----------+  +----------+  +----------+    |  |
    |  |  |  Pages   |  |Components|  | Contexts |  | Services |    |  |
    |  |  +----------+  +----------+  +----------+  +----------+    |  |
    |  |       |             |             |             |           |  |
    |  |  +----------------------------------------------------+    |  |
    |  |  |              State Management (Zustand)              |    |  |
    |  |  +----------------------------------------------------+    |  |
    |  +------------------------------------------------------------+  |
    +------------------------------------------------------------------+
                |                    |                    |
                v                    v                    v
    +------------------+   +------------------+   +------------------+
    |   Vercel Edge    |   |     Supabase     |   |     Clerk        |
    |   Functions      |   |   (PostgreSQL)   |   | (Authentication) |
    |   (API Routes)   |   |      + RLS       |   +------------------+
    +------------------+   +------------------+
           |                       |
           v                       v
    +------------------+   +------------------+
    |   Claude API     |   |   AWS Services   |
    |   (Anthropic)    |   |   (S3, Lambda)   |
    +------------------+   +------------------+
           |
           v
    +------------------+
    |  Third-Party     |
    |  Integrations    |
    |  (HubSpot, etc)  |
    +------------------+
```

---

## Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **State Management**: Zustand + React Context
- **Routing**: React Router 7
- **Workflow Visualization**: ReactFlow / XYFlow
- **Charts**: Recharts
- **Internationalization**: i18next

### Backend
- **API**: Vercel Edge Functions (serverless)
- **Database**: Supabase PostgreSQL with Row Level Security
- **Authentication**: Clerk
- **Real-time**: Server-Sent Events (SSE)
- **AI**: Anthropic Claude API

### Infrastructure
- **Hosting**: Vercel
- **Database**: Supabase
- **Storage**: AWS S3 / Supabase Storage
- **CDN**: Vercel Edge Network

---

## Data Flow

### User Authentication Flow

```
User -> Clerk SignIn -> JWT Token -> Supabase Auth -> RLS Policies
                                           |
                                           v
                                    User Profile (Supabase)
```

1. User authenticates via Clerk
2. Clerk issues JWT token
3. Token is used for Supabase authentication
4. Row Level Security (RLS) policies enforce data access

### Workflow Execution Flow

```
User Input -> Smart Chatbot -> Intent Analysis -> Workflow Generation
                                                        |
                                                        v
                                               Workflow Canvas
                                                        |
                                                        v
Execute -> API Client -> Vercel Function -> Claude API
                              |                    |
                              v                    v
                         Supabase              AI Response
                         (Save State)               |
                              |                     v
                              +--------> Execute Steps
                                              |
                                              v
                                    SSE Updates -> Client
```

### Real-time Update Flow

```
Workflow Execution -> Status Change -> SSE Event
                                           |
                                           v
                           Client EventSource -> State Update -> UI Render
```

---

## Component Architecture

### Layer Structure

```
+------------------+
|      Pages       |  Route-level components
+------------------+
         |
+------------------+
|    Components    |  Reusable UI components
+------------------+
         |
+------------------+
|    Contexts      |  Application state providers
+------------------+
         |
+------------------+
|    Services      |  Business logic & API calls
+------------------+
         |
+------------------+
|      Lib         |  Utilities & helpers
+------------------+
```

### Key Contexts

| Context | Purpose |
|---------|---------|
| `AuthContext` | User authentication state |
| `WorkflowContext` | Workflow management state |
| `PersonalizationContext` | User preferences & persona |
| `ToastContext` | Toast notifications |
| `HistoryContext` | Navigation history |
| `WorkflowChatContext` | Chat state for workflows |

### Component Categories

| Category | Examples | Description |
|----------|----------|-------------|
| Pages | Dashboard, Workflows, Settings | Route-level views |
| Layout | Navbar, Layout, MobileNav | Page structure |
| Workflow | WorkflowCanvas, WorkflowExecutor | Workflow visualization |
| AI | SmartAIChatbot, AgentChatbot | AI interfaces |
| UI | Button, Input, Toast | Basic UI elements |
| Error | ErrorBoundary, ErrorRecovery | Error handling |

---

## Database Schema

### Core Tables

```
user_profiles
├── id (uuid, PK)
├── clerk_user_id (text, unique)
├── email (text)
├── full_name (text)
├── avatar_url (text)
├── preferences (jsonb)
├── created_at (timestamp)
└── updated_at (timestamp)

workflows
├── id (uuid, PK)
├── user_id (uuid, FK -> user_profiles)
├── name (text)
├── description (text)
├── workflow_definition (jsonb)
├── status (text)
├── autonomy_level (text)
├── created_at (timestamp)
└── updated_at (timestamp)

workflow_executions
├── id (uuid, PK)
├── workflow_id (uuid, FK -> workflows)
├── status (text)
├── started_at (timestamp)
├── completed_at (timestamp)
├── result (jsonb)
├── tokens_used (integer)
└── cost_usd (decimal)

integrations
├── id (uuid, PK)
├── user_id (uuid, FK -> user_profiles)
├── provider (text)
├── access_token (text, encrypted)
├── refresh_token (text, encrypted)
├── expires_at (timestamp)
└── metadata (jsonb)

templates
├── id (uuid, PK)
├── name (text)
├── description (text)
├── category (text)
├── workflow_definition (jsonb)
├── is_public (boolean)
└── created_by (uuid, FK -> user_profiles)
```

### Row Level Security (RLS)

All tables implement RLS policies:

```sql
-- Users can only see their own data
CREATE POLICY "Users can view own workflows"
  ON workflows FOR SELECT
  USING (user_id = auth.uid());

-- Users can only modify their own data
CREATE POLICY "Users can update own workflows"
  ON workflows FOR UPDATE
  USING (user_id = auth.uid());
```

---

## API Architecture

### Endpoint Structure

```
/api
├── /chat                    # AI chat interactions
│   └── /agents              # List available agents
├── /workflows
│   ├── GET /                # List workflows
│   ├── POST /               # Create workflow
│   ├── GET /:id             # Get workflow
│   ├── POST /:id/start      # Start planning
│   ├── POST /:id/approve    # Approve plan
│   ├── POST /:id/execute    # Execute workflow
│   ├── POST /:id/execute-coordinated  # Multi-agent execution
│   └── POST /:id/recover    # Recover from checkpoint
├── /sse
│   ├── POST /ticket         # Get SSE ticket
│   └── GET /workflow/:id    # SSE stream
├── /integrations
│   ├── /hubspot             # HubSpot operations
│   ├── /email               # Email sending
│   └── /youtube             # YouTube extraction
├── /admin
│   ├── /vercel              # Vercel admin ops
│   └── /supabase            # Supabase admin ops
└── /webhooks
    └── /clerk               # Clerk webhooks
```

### Request/Response Pattern

```typescript
// Standard API Response
interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  metadata?: {
    page?: number
    totalPages?: number
    totalCount?: number
  }
}
```

---

## AI Integration

### Agent System

Nexus uses specialized AI agents for different tasks:

```
+-------------------+
|   Nexus Agents    |
+-------------------+
|                   |
|  +-----------+    |
|  |  Analyst  |-----> Data analysis, insights
|  +-----------+    |
|                   |
|  +-----------+    |
|  | Developer |-----> Code generation, tech tasks
|  +-----------+    |
|                   |
|  +-----------+    |
|  | Designer  |-----> UI/UX recommendations
|  +-----------+    |
|                   |
|  +-----------+    |
|  |    PM     |-----> Project management, planning
|  +-----------+    |
|                   |
+-------------------+
```

### Model Selection

| Model | Use Case | Cost |
|-------|----------|------|
| claude-3-5-haiku | Quick responses, simple tasks | Low |
| claude-sonnet-4 | General workflow tasks | Medium |
| claude-opus-4-5 | Complex reasoning, planning | High |

### Prompt Architecture

```
System Prompt
├── Agent Identity
├── Task Context
├── Output Format
└── Constraints

User Message
├── Current Intent
├── Collected Information
└── Previous Context
```

---

## Security Architecture

### Authentication Layers

1. **Clerk Authentication**: User identity verification
2. **JWT Tokens**: Secure API communication
3. **Supabase RLS**: Database-level access control
4. **API Rate Limiting**: Prevent abuse

### Data Protection

```
Sensitive Data -> Encryption -> Storage
                      |
                      v
              +-------+-------+
              |               |
          At Rest        In Transit
          (AES-256)      (TLS 1.3)
```

### Security Best Practices

- No API keys in client code
- Secure SSE with ticket-based authentication
- Input sanitization (DOMPurify)
- CSRF protection
- Content Security Policy (CSP)

---

## Performance Optimization

### Client-Side

| Technique | Implementation |
|-----------|----------------|
| Code Splitting | React.lazy + Suspense |
| Virtualization | react-window for large lists |
| Memoization | useMemo, useCallback, React.memo |
| Image Optimization | OptimizedImage component |
| Bundle Analysis | rollup-plugin-visualizer |

### Server-Side

| Technique | Implementation |
|-----------|----------------|
| Edge Functions | Vercel Edge Runtime |
| Caching | In-memory + Redis |
| Connection Pooling | Supabase pgbouncer |
| Batch Processing | batchApi utility |

### Caching Strategy

```
Request -> Memory Cache -> Edge Cache -> Origin
                |              |
                v              v
            Fast (ms)      Medium (100ms)
```

---

## Error Handling

### Error Boundary Hierarchy

```
App
├── BaseErrorBoundary (global)
│   ├── WorkflowErrorBoundary
│   │   └── WorkflowCanvas
│   ├── ChatErrorBoundary
│   │   └── SmartAIChatbot
│   └── IntegrationErrorBoundary
│       └── IntegrationManager
```

### Recovery Strategies

| Error Type | Strategy |
|------------|----------|
| Network Error | Retry with exponential backoff |
| Rate Limit | Wait and retry |
| AI Error | Simplify prompt, retry |
| Transform Error | Sanitize input, retry |
| Auth Error | Redirect to login |

---

## Deployment Architecture

### Vercel Deployment

```
GitHub Push -> Vercel Build -> Preview Deploy
                   |
                   v
            Production Deploy
                   |
                   v
            Edge Distribution
```

### Environment Configuration

| Environment | Purpose |
|-------------|---------|
| Development | Local development |
| Preview | PR previews |
| Production | Live application |

### Build Process

```
Source Code
     |
     v
TypeScript Compile -> ESLint Check -> Vite Build -> Deploy
                           |
                           v
                      Unit Tests
```

---

## Monitoring & Observability

### Logging

```typescript
// Error levels
logError(error, context)   // Critical errors
logWarning(message, data)  // Potential issues
logInfo(message, data)     // General info
```

### Analytics Events

```typescript
trackEvent('workflow_created', { name, nodeCount })
trackEvent('workflow_executed', { success, duration })
trackPageView('/dashboard')
```

### Health Checks

- `/api/health` - Overall system health
- Supabase connection status
- Claude API availability
- Integration status

---

## Scalability Considerations

### Horizontal Scaling

- Stateless API functions (Vercel auto-scales)
- Database connection pooling
- CDN for static assets

### Vertical Scaling

- Supabase plan upgrades for database
- Anthropic rate limit increases
- Vercel pro/enterprise features

### Future Considerations

- Multi-region deployment
- Read replicas for database
- Queue-based workflow execution
- Kubernetes for complex workloads

---

## Development Workflow

### Local Development

```bash
# Start development server
npm run dev

# Run with server
npm run dev:all

# Run tests
npm test

# E2E tests
npm run test:e2e
```

### Testing Strategy

| Type | Tool | Location |
|------|------|----------|
| Unit | Vitest | src/**/*.test.ts |
| E2E | Playwright | tests/e2e/ |
| Visual | Playwright MCP | Manual |

### Code Quality

- ESLint for linting
- TypeScript strict mode
- Prettier for formatting
- Husky for pre-commit hooks
