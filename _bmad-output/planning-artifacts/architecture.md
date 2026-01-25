---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - "C:\\Users\\PC\\Documents\\Autoclaude 2D workflow office\\_bmad-output\\planning-artifacts\\prd.md"
  - "C:\\Users\\PC\\Documents\\Autoclaude 2D workflow office\\_bmad-output\\planning-artifacts\\ux-design-specification.md"
  - "C:\\Users\\PC\\Documents\\Autoclaude 2D workflow office\\docs\\research\\3d-office-technology-stack.md"
workflowType: 'architecture'
project_name: 'Nexus'
user_name: 'Mohammed'
date: '2026-01-05'
lastStep: 6
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
The platform encompasses **148 specific requirements** across 14 categories, representing a comprehensive agentic AI workflow execution system. Core capabilities include:

- **Workflow Orchestration (FR-3)**: BMAD Method orchestrates specialized agents through stages (Planning → Orchestrating → Building → Reviewing → Completed) with state persistence and resume capability
- **Live Visualization (FR-4)**: n8n-style node-based workflow map with real-time updates (<500ms latency), responsive mobile/desktop support, workflow preview before execution
- **Meeting Intelligence (FR-2A)**: Record client meetings, detect/translate Kuwaiti Arabic dialect, transcribe, extract SOPs - critical for Kuwait market where companies lack documented processes
- **Token Management (FR-7)**: Real-time tracking, dollar-based display (not token counts), efficiency indicators, budget warnings, optimization
- **Cloud Execution (FR-14)**: Server-side code generation and terminal execution - users never need VS Code or local terminal
- **Cross-Project Intelligence (FR-8)**: User profile backend stores thinking methodologies, behavior patterns, emotional responses across all projects for personalization

**Architectural Implications:**
- Multi-tenant architecture with isolated project workspaces
- Real-time bi-directional communication (WebSockets or Server-Sent Events)
- Cloud code execution infrastructure (sandboxed environments)
- Persistent workflow state management (checkpoint/resume capability)
- Plugin/adapter architecture for integrations and orchestration swappability
- Voice processing pipeline (detection → transcription → dialect translation)

**Non-Functional Requirements:**

**Performance (Business-Critical):**
- **Token Efficiency**: Average workflow cost must stay under $0.50 (NFR-P2.1)
- **Real-Time Updates**: Workflow visualization updates with max 500ms latency (NFR-P1.3)
- **Mobile Responsiveness**: Fully functional on 375px screens (iPhone SE baseline) (NFR-P3.1)
- **Meeting Transcription**: Process at minimum 2x real-time speed (NFR-P1.5)

**Security & Compliance:**
- **Multi-Tenant Isolation**: Row-level security, isolated database schemas per project (NFR-S1)
- **Encryption**: TLS 1.3 in transit, AES-256 at rest, meeting recordings encrypted with audit logs (NFR-S3)
- **Kuwait Compliance**: Support Kuwaiti Arabic, configurable data residency, e-commerce law compliance (NFR-S4)
- **Authentication**: OAuth 2.0 for integrations, MFA support, secure vault for API keys (NFR-S2)

**Reliability (Zero-Failure Tolerance):**
- **BMAD Orchestration**: Workflow state persists after each step, automatic resume from checkpoint, never lose progress (NFR-R2)
- **99.5% Uptime**: Automatic failover to backup region within 60 seconds (NFR-R1.2)
- **Data Durability**: 11 nines (99.999999999%) for meeting recordings using cloud object storage (NFR-R3.1)

**Scalability:**
- **User Growth**: Support 10x growth (1→5→50 users) with <10% performance degradation (NFR-SC1.1)
- **Concurrent Workflows**: Minimum 100 concurrent workflow executions per user (NFR-SC2.1)
- **Workflow Visualization**: Render graphs with up to 500 nodes without degradation (NFR-SC2.3)

**Integration (Backend Swappability):**
- **Adapter Pattern**: Orchestration layer must enable BMAD replacement without rewriting UI/data (NFR-I3.1)
- **Orchestration-Agnostic State**: Workflow state format uses JSON schema with version metadata (NFR-I3.2)
- **Zero-Downtime Migration**: Blue-green deployment for orchestration framework swap (NFR-I3.3)

### Scale & Complexity

**Complexity Level:** **HIGH** (Enterprise-grade SaaS platform)

**Primary Domain:** **Full-Stack Multi-Tenant SaaS**
- React frontend (mobile-first responsive)
- react-three-fiber for 3D/2D workflow visualization
- Node.js/Python backend (BMAD orchestration, cloud execution)
- Real-time communication (WebSockets/SSE)
- Cloud infrastructure (AWS/Azure/GCP)
- Database with multi-tenant isolation
- Voice processing pipeline
- Integration plugin framework

**Estimated Architectural Components:** **25-30 major components**

**Component Categories:**
1. **Frontend Layer** (5-7 components): Mobile UI, workflow visualization, chat interface, token dashboard, meeting recorder
2. **API Gateway Layer** (2-3 components): Authentication, rate limiting, request routing
3. **Orchestration Layer** (4-5 components): BMAD adapter, workflow state manager, agent coordinator, task queue
4. **Execution Layer** (3-4 components): Cloud code executor, sandbox manager, terminal emulator
5. **Integration Layer** (5-6 components): Plugin registry, CRM connectors, email providers, calendar integrations
6. **Voice Processing** (3-4 components): Audio recorder, transcription service, dialect translator, SOP extractor
7. **Data Layer** (4-5 components): Multi-tenant database, user profile storage, meeting recordings, workflow logs
8. **Infrastructure Layer** (3-4 components): Load balancer, auto-scaling, failover, monitoring

### Technical Constraints & Dependencies

**Hard Constraints:**
- **BMAD Method**: Current orchestration framework (must be swappable via adapter pattern)
- **Claude API**: Primary LLM provider for agents
- **Mobile-First**: All features must work on 375px screens with touch optimization
- **Token Budget**: $0.50 average per workflow (business viability constraint)
- **Zero Data Loss**: BMAD workflows cannot lose state - append-only log required

**Technology Stack (Pre-Selected from Research):**
- **Frontend**: React + react-three-fiber + drei
- **Avatars**: Ready Player Me + Mixamo animations
- **State Management**: Zustand
- **3D Assets**: Sketchfab + Poly Haven
- **Voice**: Web Speech API (fallback: ElevenLabs)

**External Dependencies:**
- Claude API (LLM provider)
- CRM APIs (Salesforce, HubSpot, Pipedrive)
- Email providers (Gmail, Outlook, SMTP)
- Zoom API (meeting recording integration)
- Arabic dialect translation service (specialized, not generic Google Translate)
- Cloud infrastructure (compute for code execution)
- Object storage (meeting recordings with 11 nines durability)

**Compliance Requirements:**
- Kuwait cybersecurity framework (GCC standards)
- Per-project compliance checking (not global)
- ISO 27001 principles
- Phase 3: GDPR, CCPA, HIPAA, SOC 2 readiness

### Cross-Cutting Concerns Identified

**1. Token Usage Tracking & Optimization**
- Affects: All AI agent interactions, debugging loops, cross-project intelligence queries
- Architecture Need: Central token accounting service, per-project budgets, real-time cost tracking, optimization middleware

**2. Multi-Tenant Data Isolation**
- Affects: All data access patterns, queries, file storage, workflow state
- Architecture Need: Row-level security, tenant_id on all tables, isolated BMAD instances per project, cross-project intelligence with metadata-only access

**3. Real-Time State Synchronization**
- Affects: Workflow visualization, debugging status, token dashboard, agent progress
- Architecture Need: WebSocket/SSE connections, state broadcasting, optimistic UI updates, conflict resolution

**4. User-Friendly Error Translation**
- Affects: All error handling, debugging messages, API failures, integration issues
- Architecture Need: Error translation layer converting technical errors to plain English (e.g., "API rate limit exceeded" → "Waiting for CRM system. Auto-retry in progress 2/5")

**5. Audit Logging & Compliance**
- Affects: All operations (meeting recordings, workflow executions, data access, compliance checks)
- Architecture Need: Append-only audit log, per-project compliance checker, meeting recording access logs, workflow state history

**6. Authentication & Authorization (RBAC)**
- Affects: API endpoints, database queries, UI components, integration credentials
- Architecture Need: JWT tokens, role enforcement at all layers (API/database/UI), OAuth 2.0 for third-party integrations, secure vault for API keys

**7. Integration Plugin Architecture**
- Affects: CRM connectors, email providers, calendar integrations, future extensibility
- Architecture Need: Standard connector interface, plugin registry, isolated credentials, retry logic per service, health monitoring

**8. Meeting Recording Pipeline**
- Affects: Voice input, meeting analysis, SOP extraction (Kuwait market critical feature)
- Architecture Need: Audio recorder → transcription service → Kuwaiti dialect translator → AI analysis → SOP extractor → project storage, per-project linking

**9. Workflow Preview Before Execution**
- Affects: Initial chat UX, workflow proposal, user approval flow, token cost estimation
- Architecture Need: Workflow planner that generates execution graph without executing, cost estimator, approval mechanism, modification interface

**10. BMAD Orchestration Swappability**
- Affects: Agent coordination, workflow execution, state management, future framework migration
- Architecture Need: Adapter pattern interface, orchestration-agnostic state format (JSON schema), blue-green deployment capability for zero-downtime swap

## Starter Template Evaluation

### Primary Technology Domain

**Full-Stack Multi-Tenant SaaS** with specialized agentic AI orchestration, real-time workflow visualization, and cloud code execution.

### Starter Options Considered

**Evaluated Options:**

1. **Full SaaS Boilerplates** (TurboStarter, ixartz/SaaS-Boilerplate, Makerkit)
   - **Pros:** Multi-tenancy, authentication, team management, payments out-of-the-box
   - **Cons:** Opinionated architecture conflicts with BMAD orchestration requirements; includes unnecessary features (payments, CRUD scaffolding); Next.js may constrain react-three-fiber optimization
   - **Verdict:** Not suitable - too many conflicting opinions for our unique requirements

2. **Vite + React + TypeScript** (Official Template)
   - **Pros:** Minimal, fast, perfect for react-three-fiber integration; mobile-first friendly; no routing/state opinions
   - **Cons:** No authentication, multi-tenancy, or backend included (must build custom)
   - **Verdict:** **RECOMMENDED for frontend** - lightweight foundation that doesn't constrain

3. **Custom Backend Architecture**
   - **Rationale:** BMAD orchestration, cloud execution infrastructure, meeting recording pipeline, and token accounting are too specialized for boilerplates
   - **Approach:** Build modular backend services that integrate authentication (Clerk/Auth0), multi-tenant PostgreSQL, and WebSocket/SSE for real-time updates

### Selected Starter: **Vite + React + TypeScript** (Frontend Only)

**Rationale for Selection:**

This project requires a **hybrid approach**:
- **Simple frontend starter** (Vite) for react-three-fiber flexibility
- **Custom backend architecture** due to BMAD orchestration uniqueness

**Why NOT a full SaaS boilerplate:**
- BMAD Method orchestration with swappable adapter pattern is unprecedented
- Cloud code execution infrastructure (sandboxed environments) is specialized
- Meeting recording pipeline (Kuwaiti dialect translation → SOP extraction) is custom
- Token-efficient auto-debugging with plain-English error translation is unique business logic
- react-three-fiber + drei for 3D/2D workflow visualization requires build optimization freedom

**Why Vite:**
- Fastest build tool for React (optimized for HMR and production builds)
- Zero configuration for TypeScript + React
- Compatible with react-three-fiber ecosystem (pmndrs tools)
- Mobile-first friendly (works seamlessly with Tailwind CSS)
- No opinionated routing or state management (we're using Zustand per research doc)

**Initialization Command:**

```bash
# Frontend
npm create vite@latest 3d-office-frontend -- --template react-ts
cd 3d-office-frontend
npm install

# Add project dependencies
npm install three @react-three/fiber @react-three/drei zustand
npm install --save-dev @types/three

# Add mobile-first styling
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Architectural Decisions Provided by Starter

**Language & Runtime:**
- **TypeScript 5+** with strict mode enabled
- **React 18+** with modern hooks API
- **ES2020** target for modern JavaScript features
- **Vite 8.x** as build tool and dev server

**Styling Solution:**
- **Base:** CSS Modules support built-in (scoped styles)
- **Recommended Addition:** Tailwind CSS for mobile-first responsive design
- **Rationale:** Tailwind's utility-first approach perfect for rapid mobile-first prototyping

**Build Tooling:**
- **Vite** - Lightning-fast HMR (<50ms updates)
- **esbuild** - Dependency pre-bundling (10-100x faster than Webpack)
- **Rollup** - Production bundling with tree-shaking and code splitting
- **Optimized for react-three-fiber:** Vite handles Three.js large dependencies efficiently

**Testing Framework:**
- **Not Included** - Intentionally minimal
- **Recommended Addition:** Vitest (Vite-native testing) + React Testing Library
- **Command:** `npm install -D vitest @testing-library/react @testing-library/jest-dom`

**Code Organization:**
- **Minimal structure:**
  ```
  src/
    ├── App.tsx          (root component)
    ├── main.tsx         (entry point)
    ├── index.css        (global styles)
    └── vite-env.d.ts    (TypeScript declarations)
  ```
- **Flexible:** No enforced folder structure - can organize per architecture decisions

**Development Experience:**
- **Hot Module Replacement (HMR):** Instant updates without full page reload
- **TypeScript:** Full type-checking in IDE and build
- **Fast Refresh:** React state preservation during HMR
- **Import Aliases:** Can configure `@/` aliases via `tsconfig.json` and `vite.config.ts`
- **Debugging:** Source maps enabled by default

**Deployment:**
- **Static Build:** `npm run build` generates optimized static assets
- **Preview Server:** `npm run preview` tests production build locally
- **Compatible With:** Vercel, Netlify, Cloudflare Pages, AWS S3 + CloudFront

### Backend Architecture Strategy

**Custom Services Required:**
1. **BMAD Orchestration Service** (Node.js/Python)
   - Swappable adapter pattern for orchestration framework
   - Workflow state persistence (checkpoint/resume)
   - Agent coordination and task queue

2. **Cloud Execution Service** (Sandboxed Environments)
   - Code generation and execution infrastructure
   - Terminal emulator for user commands
   - Security isolation per project/user

3. **Meeting Intelligence Service** (Voice Processing Pipeline)
   - Audio recording and storage
   - Transcription (Whisper API or similar)
   - Kuwaiti dialect translation (specialized service)
   - SOP extraction via Claude API

4. **Token Accounting Service** (Cost Optimization)
   - Real-time token tracking per project
   - Budget warnings and optimization middleware
   - Cross-project intelligence caching

5. **Multi-Tenant Database** (PostgreSQL + Row-Level Security)
   - Use Supabase for managed PostgreSQL with built-in RLS
   - Or custom PostgreSQL with tenant_id column on all tables
   - Authentication via Clerk or Auth0

6. **Real-Time Communication** (WebSocket/SSE)
   - Workflow visualization updates (<500ms latency)
   - Token dashboard live updates
   - Debugging status broadcasting

**Note:** Project initialization using Vite command should be the first implementation story. Backend services will be architected as microservices or modular monolith based on architecture decisions in next step.

## Core Architectural Decisions

_This section documents critical architectural choices that define the system's structure, technology stack, and operational characteristics._

### 1. Data Architecture

#### Primary Database: **PostgreSQL via Supabase**

**Decision:** Use Supabase-managed PostgreSQL with built-in Row-Level Security (RLS).

**Rationale:**
- **Multi-Tenant Isolation (NFR-S1):** Supabase provides native RLS policies enforced at database layer - no application-level tenant filtering bugs
- **Real-Time Subscriptions:** Built-in PostgreSQL replication for live workflow state updates (NFR-P1.3: <500ms latency)
- **Zero-Configuration Auth:** Integrates seamlessly with Clerk/Auth0 via JWT verification
- **Developer Experience:** Instant API generation, TypeScript types auto-generated from schema
- **Audit Logging:** PostgreSQL triggers for append-only audit trail (NFR-S3, NFR-R2)
- **Managed Service:** Automated backups, point-in-time recovery, automatic failover (NFR-R1.2: 99.5% uptime)

**Schema Design Pattern:**
```sql
-- Multi-tenant with row-level security
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policy example
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

-- Workflow state with append-only pattern
CREATE TABLE workflow_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  workflow_id UUID NOT NULL,
  state_snapshot JSONB NOT NULL, -- Orchestration-agnostic format
  version INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Alternative Considered:** Custom PostgreSQL on AWS RDS
- **Rejected:** More operational overhead, no built-in RLS UI, manual auth integration

#### Caching Layer: **Redis (Upstash)**

**Decision:** Use Upstash Redis for serverless-friendly caching with global replication.

**Rationale:**
- **Token Accounting Cache:** Real-time cost tracking without hitting database (NFR-P2.1: $0.50 average workflow cost)
- **Cross-Project Intelligence:** Cache user behavior patterns, thinking methodologies for instant retrieval (FR-8)
- **Workflow State Hot Storage:** Recently accessed workflow states cached for <100ms retrieval
- **Rate Limiting:** API rate limit counters with TTL expiration
- **Serverless-Friendly:** HTTP-based API (no persistent connections), pay-per-request pricing
- **Global Replication:** Multi-region deployment for failover (NFR-R1.2)

**Cache Strategy:**
- **Token Usage:** `project:{projectId}:tokens` → Real-time cost accumulation, 1-hour TTL
- **User Profile:** `user:{userId}:profile` → Cross-project intelligence metadata, 24-hour TTL
- **Workflow State:** `workflow:{workflowId}:state` → Latest checkpoint, 1-hour TTL (PostgreSQL is source of truth)

**Alternative Considered:** AWS ElastiCache
- **Rejected:** Requires VPC configuration, not serverless-friendly, higher operational cost for small scale

#### Object Storage: **AWS S3 Standard (11 Nines Durability)**

**Decision:** Use AWS S3 Standard class for meeting recordings with lifecycle policies.

**Rationale:**
- **11 Nines Durability:** Meets NFR-R3.1 (99.999999999% durability) out-of-the-box
- **Encryption:** AES-256 at rest, TLS 1.3 in transit (NFR-S3)
- **Access Logging:** S3 access logs for meeting recording audit trail (NFR-S3: audit logs)
- **Lifecycle Policies:** Auto-transition to S3 Glacier after 90 days (cost optimization)
- **Presigned URLs:** Secure temporary access for meeting playback without exposing keys
- **CDN Integration:** CloudFront for global meeting playback performance

**Storage Structure:**
```
s3://3d-office-recordings/
  ├── {user_id}/
  │   ├── {project_id}/
  │   │   ├── {meeting_id}.webm (original audio)
  │   │   ├── {meeting_id}_transcript.json
  │   │   ├── {meeting_id}_translation.json
  │   │   └── {meeting_id}_sop.json
```

**Alternative Considered:** Cloudflare R2
- **Rejected:** Lower maturity, less tooling support for lifecycle management, no guaranteed 11 nines durability SLA

#### Database Migrations: **Supabase SQL Migrations**

**Decision:** Use Supabase's migration system with version-controlled SQL files.

**Rationale:**
- **Git-Based:** Migrations stored in repository, reviewed in pull requests
- **Automatic Deployment:** Supabase CLI applies migrations on deploy
- **Rollback Support:** Down migrations for schema changes
- **Multi-Tenant Safe:** Migrations respect RLS policies, tested against tenant isolation

**Migration Workflow:**
```bash
# Create new migration
supabase migration new add_workflow_checkpoints

# Write SQL in migrations/{timestamp}_add_workflow_checkpoints.sql
# Apply locally
supabase db reset

# Deploy to production
supabase db push
```

### 2. Authentication & Security

#### Authentication Provider: **Clerk**

**Decision:** Use Clerk for user authentication and session management.

**Rationale:**
- **Superior Developer Experience:** React components for sign-in/sign-up, pre-built UI matches mobile-first design
- **MFA Built-In:** Multi-factor authentication out-of-the-box (NFR-S2)
- **OAuth 2.0 Integrations:** Pre-configured Google, Microsoft, GitHub OAuth providers (NFR-S2)
- **Mobile-Optimized:** Touch-friendly authentication flows, biometric support
- **User Metadata Storage:** Custom user properties for cross-project intelligence (FR-8)
- **Webhook Events:** Real-time user lifecycle events for profile creation
- **JWT Verification:** Works seamlessly with Supabase RLS policies

**Authentication Flow:**
1. User signs in via Clerk UI component
2. Clerk issues JWT token with user ID
3. Frontend includes JWT in `Authorization: Bearer {token}` header
4. Backend validates JWT via Clerk public key
5. Supabase RLS policies enforce `auth.uid()` from JWT

**Alternative Considered:** Auth0
- **Rejected:** More complex pricing, less React-friendly components, heavier bundle size for mobile

#### Authorization Pattern: **RBAC with Database-Level Enforcement**

**Decision:** Role-Based Access Control (RBAC) enforced at PostgreSQL RLS layer.

**Rationale:**
- **Defense in Depth:** Authorization enforced at database, impossible to bypass via API bugs
- **Per-Project Roles:** Users can be owner/collaborator per project (not global)
- **RLS Policy Enforcement:** PostgreSQL checks permissions before query execution
- **Zero Trust:** API layer never queries across tenants, database guarantees isolation

**Role Schema:**
```sql
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('owner', 'collaborator', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- RLS policy: Users only access projects they're members of
CREATE POLICY "Project member access" ON workflows
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = workflows.project_id
        AND user_id = auth.uid()
    )
  );
```

#### API Key Management: **Clerk Secure Storage + HashiCorp Vault (Phase 2)**

**Decision:** Phase 1 uses Clerk metadata encryption, Phase 2 migrates to HashiCorp Vault.

**Rationale:**
- **Phase 1 (MVP):** Store encrypted third-party API keys in Clerk user metadata
  - Simple integration, encrypted at rest by Clerk
  - Per-user CRM credentials, email provider OAuth tokens
  - Acceptable for <50 users (NFR-SC1.1)
- **Phase 2 (Scale):** Migrate to HashiCorp Vault for centralized secret management
  - Dynamic credentials with TTL expiration
  - Audit logging for all secret access
  - Secret rotation without code deployment

**Key Storage Pattern (Phase 1):**
```typescript
// Encrypt and store in Clerk metadata
await clerk.users.updateUserMetadata(userId, {
  privateMetadata: {
    integrations: {
      salesforce: {
        accessToken: encrypt(token), // AES-256 encryption
        refreshToken: encrypt(refreshToken),
        expiresAt: timestamp
      }
    }
  }
})
```

### 3. API & Communication Layer

#### API Pattern: **REST with OpenAPI Specification**

**Decision:** Use RESTful APIs with OpenAPI 3.1 documentation and TypeScript SDK generation.

**Rationale:**
- **Simplicity:** REST easier to debug than GraphQL for workflow orchestration use case
- **Caching:** HTTP caching headers work natively (GET /workflows/{id} cached by CDN)
- **Streaming Support:** Chunked transfer encoding for workflow logs, SSE for real-time updates
- **Code Generation:** OpenAPI spec generates TypeScript client SDK automatically
- **Mobile-Friendly:** Less overhead than GraphQL for mobile networks (NFR-P3.1)

**API Structure:**
```
POST   /api/workflows                    # Create workflow from chat input
GET    /api/workflows/{id}               # Get workflow state
GET    /api/workflows/{id}/stream        # SSE stream for real-time updates
POST   /api/workflows/{id}/approve       # Approve workflow preview
DELETE /api/workflows/{id}               # Cancel workflow

POST   /api/meetings                     # Upload meeting recording
GET    /api/meetings/{id}/transcript     # Get transcript with translation
GET    /api/meetings/{id}/sop            # Get extracted SOP

GET    /api/projects/{id}/tokens         # Real-time token usage
```

**Alternative Considered:** GraphQL
- **Rejected:** Over-engineering for use case; workflow orchestration is command-driven (POST) not query-driven; SSE easier with REST

#### Real-Time Communication: **Server-Sent Events (SSE)**

**Decision:** Use SSE for uni-directional real-time updates from server to client.

**Rationale:**
- **Workflow Visualization (NFR-P1.3):** Stream workflow node status updates (<500ms latency)
- **Simpler than WebSockets:** No bi-directional need - client sends commands via REST, receives updates via SSE
- **Auto-Reconnect:** Browser handles reconnection automatically with Last-Event-ID
- **HTTP/2 Multiplexing:** Single connection for multiple SSE streams (token dashboard + workflow updates)
- **Mobile-Friendly:** Lower battery drain than WebSocket ping/pong
- **CDN Compatible:** CloudFlare supports SSE pass-through

**SSE Implementation Pattern:**
```typescript
// Client (React)
useEffect(() => {
  const eventSource = new EventSource(`/api/workflows/${workflowId}/stream`)

  eventSource.onmessage = (event) => {
    const update = JSON.parse(event.data)
    updateWorkflowState(update) // Zustand state update
  }

  return () => eventSource.close()
}, [workflowId])

// Server (Node.js)
app.get('/api/workflows/:id/stream', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  })

  // Subscribe to workflow updates from Redis pub/sub
  const subscriber = redis.subscribe(`workflow:${req.params.id}`)

  subscriber.on('message', (channel, message) => {
    res.write(`data: ${message}\n\n`)
  })
})
```

**Alternative Considered:** WebSockets
- **Rejected:** Over-engineering for uni-directional updates; requires sticky sessions for load balancing; more complex mobile reconnection handling

#### API Gateway: **Cloudflare Workers**

**Decision:** Use Cloudflare Workers for edge API gateway (rate limiting, auth validation, routing).

**Rationale:**
- **Edge Computing:** Run at 285+ Cloudflare locations globally (low latency for Middle East/Kuwait)
- **Built-In Rate Limiting:** DDoS protection, per-user rate limits
- **JWT Validation:** Validate Clerk JWTs at edge before hitting backend
- **Request Routing:** Route to appropriate backend service (orchestration vs execution vs voice)
- **Zero Cold Start:** Always warm, <1ms startup time
- **Cost-Effective:** 100k requests/day free tier, $0.50 per million after

**Worker Example:**
```typescript
// cloudflare-worker.ts
export default {
  async fetch(request: Request, env: Env) {
    // Validate JWT
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    const user = await verifyClerkJWT(token, env.CLERK_PUBLIC_KEY)

    // Rate limiting
    const rateLimitKey = `ratelimit:${user.id}`
    const count = await env.KV.get(rateLimitKey)
    if (count > 100) return new Response('Rate limit exceeded', { status: 429 })

    // Route to backend
    if (request.url.includes('/api/workflows')) {
      return fetch(`${env.BACKEND_URL}/workflows`, request)
    }
  }
}
```

**Alternative Considered:** AWS API Gateway
- **Rejected:** Higher latency (single region deployment), more expensive at scale, less developer-friendly than Workers

### 4. Frontend Architecture

#### State Management: **Zustand**

**Decision:** Already selected from technology research - Zustand for global state management.

**Rationale:**
- **Minimal Boilerplate:** No providers, actions, reducers - just hooks
- **Mobile Performance:** Tiny bundle size (1KB gzipped), fast re-renders
- **TypeScript-First:** Full type inference without manual typing
- **DevTools Support:** Redux DevTools integration for debugging
- **Middleware Support:** Persistence middleware for offline-first workflows

**State Structure:**
```typescript
// stores/workflowStore.ts
interface WorkflowState {
  workflows: Map<string, Workflow>
  activeWorkflowId: string | null
  updateWorkflow: (id: string, update: Partial<Workflow>) => void
  subscribeToWorkflow: (id: string) => void
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflows: new Map(),
  activeWorkflowId: null,

  updateWorkflow: (id, update) => set((state) => {
    const workflows = new Map(state.workflows)
    workflows.set(id, { ...workflows.get(id), ...update })
    return { workflows }
  }),

  subscribeToWorkflow: (id) => {
    const eventSource = new EventSource(`/api/workflows/${id}/stream`)
    eventSource.onmessage = (event) => {
      get().updateWorkflow(id, JSON.parse(event.data))
    }
  }
}))
```

#### Routing: **React Router v6**

**Decision:** Use React Router v6 for client-side routing with code splitting.

**Rationale:**
- **Industry Standard:** Most mature React routing library, extensive documentation
- **Mobile-Optimized:** Touch gesture support, scroll restoration
- **Code Splitting:** Route-based lazy loading for faster initial load (NFR-P3.1: mobile performance)
- **Nested Routes:** Natural fit for project → workflow → task hierarchy
- **Loader Pattern:** Data fetching before route render (UX: no loading spinners)

**Route Structure:**
```typescript
// App.tsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <ChatInterface /> },
      { path: 'projects/:projectId', element: <ProjectView /> },
      { path: 'workflows/:workflowId', element: <WorkflowVisualization /> },
      { path: 'meetings', element: <MeetingList /> },
      { path: 'settings', element: <Settings /> }
    ]
  }
])
```

**Alternative Considered:** TanStack Router
- **Rejected:** Too new (less mature), smaller community, overkill type-safety for this use case

#### Code Splitting: **React.lazy + Route-Based Splitting**

**Decision:** Use React.lazy for component-level code splitting with route-based strategy.

**Rationale:**
- **Mobile Performance (NFR-P3.1):** Reduce initial JavaScript bundle for 375px screens
- **Progressive Loading:** Load workflow visualization only when user accesses workflow
- **Suspense Boundaries:** Graceful loading states per route
- **Three.js Chunking:** Separate bundle for react-three-fiber (largest dependency)

**Splitting Strategy:**
```typescript
// Lazy load heavy 3D visualization
const WorkflowVisualization = lazy(() => import('./components/WorkflowVisualization'))
const Office3D = lazy(() => import('./components/Office3D'))

// Route with suspense
<Route
  path="/workflows/:id"
  element={
    <Suspense fallback={<LoadingSpinner />}>
      <WorkflowVisualization />
    </Suspense>
  }
/>
```

**Bundle Targets:**
- **Main Chunk:** Chat interface, authentication (~150KB gzipped)
- **Workflow Chunk:** react-three-fiber + drei (~280KB gzipped)
- **Meeting Chunk:** Audio recorder, transcript viewer (~80KB gzipped)

#### API Client: **TanStack Query (React Query)**

**Decision:** Use TanStack Query for server state management with optimistic updates.

**Rationale:**
- **Automatic Caching:** Workflow state cached in memory, background revalidation
- **Optimistic Updates (UX):** Update UI immediately, sync in background (UX Principle: Effortless complexity)
- **SSE Integration:** Streaming support for real-time workflow updates
- **Mobile-Optimized:** Retry logic for flaky mobile networks, offline persistence
- **DevTools:** Query inspector for debugging API state

**Query Configuration:**
```typescript
// queries/workflows.ts
export const useWorkflow = (workflowId: string) => {
  return useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: () => fetch(`/api/workflows/${workflowId}`).then(r => r.json()),
    refetchInterval: false, // Use SSE for real-time, not polling
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export const useApproveWorkflow = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (workflowId: string) =>
      fetch(`/api/workflows/${workflowId}/approve`, { method: 'POST' }),

    // Optimistic update
    onMutate: async (workflowId) => {
      await queryClient.cancelQueries(['workflow', workflowId])
      const previous = queryClient.getQueryData(['workflow', workflowId])

      queryClient.setQueryData(['workflow', workflowId], (old: any) => ({
        ...old,
        status: 'approved'
      }))

      return { previous }
    },

    onError: (err, workflowId, context) => {
      queryClient.setQueryData(['workflow', workflowId], context.previous)
    }
  })
}
```

**Alternative Considered:** SWR
- **Rejected:** TanStack Query has better TypeScript support, more flexible caching strategies, better DevTools

#### Form Handling: **React Hook Form**

**Decision:** Use React Hook Form for all form inputs (chat, settings, integrations).

**Rationale:**
- **Performance:** Uncontrolled components, minimal re-renders (mobile battery optimization)
- **Mobile-Friendly:** Touch-optimized validation, accessible error messages
- **TypeScript:** Full type inference for form values
- **Validation:** Zod schema validation integration

**Form Example:**
```typescript
// ChatInput.tsx
const schema = z.object({
  message: z.string().min(1, 'Message required').max(5000)
})

const ChatInput = () => {
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(schema)
  })

  const createWorkflow = useMutation(...)

  const onSubmit = (data) => {
    createWorkflow.mutate(data.message)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <textarea {...register('message')} />
      <button type="submit">Send</button>
    </form>
  )
}
```

### 5. Infrastructure & Deployment

#### Cloud Provider: **AWS (Multi-Region)**

**Decision:** Use AWS as primary cloud provider with multi-region deployment (us-east-1 primary, eu-west-1 failover).

**Rationale:**
- **Sandboxed Execution (FR-14):** AWS Fargate provides isolated container execution for code generation
- **11 Nines Durability (NFR-R3.1):** S3 Standard meets durability requirement for meeting recordings
- **Failover (NFR-R1.2):** Route 53 health checks with automatic failover within 60 seconds
- **Maturity:** Most mature cloud ecosystem, extensive documentation, largest community
- **Cost Explorer API:** Programmatic access to cost data for token optimization tracking
- **Regional Compliance:** Can deploy to Middle East region (me-south-1) for Kuwait data residency if required

**Architecture Diagram:**
```
┌─────────────────────────────────────────────────────────────┐
│ Cloudflare Workers (Edge API Gateway)                      │
│ - JWT validation                                            │
│ - Rate limiting                                             │
│ - Request routing                                           │
└─────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼──────┐  ┌──────▼───────┐  ┌──────▼──────┐
│ Vercel       │  │ AWS Fargate  │  │ Supabase    │
│ (Frontend)   │  │ (Backend)    │  │ (Database)  │
│              │  │ - Orchestr.  │  │ - PostgreSQL│
│ - React      │  │ - Execution  │  │ - RLS       │
│ - SSE client │  │ - Voice      │  │ - Real-time │
└──────────────┘  └──────────────┘  └─────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼──────┐  ┌──────▼───────┐  ┌──────▼──────┐
│ Upstash      │  │ AWS S3       │  │ Clerk       │
│ (Redis Cache)│  │ (Recordings) │  │ (Auth)      │
└──────────────┘  └──────────────┘  └─────────────┘
```

**Alternative Considered:** Azure, GCP
- **Rejected:** AWS has better sandbox execution options (Fargate vs Azure Container Instances), S3 is industry standard for object storage

#### Frontend Hosting: **Vercel**

**Decision:** Host React frontend on Vercel with edge CDN.

**Rationale:**
- **Vite Optimization:** Native Vite support, instant deployments
- **Edge Network:** Global CDN for fast asset delivery to Kuwait/Middle East
- **Preview Deployments:** Every pull request gets preview URL for testing
- **Automatic SSL:** HTTPS by default with auto-renewal
- **GitHub Integration:** Auto-deploy on merge to main
- **Web Vitals:** Built-in performance monitoring for mobile metrics (NFR-P3.1)

**Deployment Config:**
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://api.3d-office.com/:path*" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}
```

**Alternative Considered:** Netlify, Cloudflare Pages
- **Rejected:** Vercel has better Vite integration, superior preview deployment UX

#### Backend Hosting: **AWS ECS Fargate**

**Decision:** Use AWS ECS Fargate for containerized backend services with auto-scaling.

**Rationale:**
- **Serverless Containers:** No EC2 instance management, pay per second of compute
- **Isolated Execution (FR-14):** Each workflow execution runs in ephemeral container
- **Auto-Scaling (NFR-SC2.1):** Scale to 100+ concurrent workflows automatically
- **Health Checks:** ECS monitors container health, restarts on failure (NFR-R1.2)
- **Blue-Green Deployment (NFR-I3.3):** Zero-downtime orchestration framework swap
- **VPC Isolation:** Backend services in private subnet, only API gateway exposed

**Service Architecture:**
```yaml
# docker-compose.yml (local development)
services:
  orchestration:
    build: ./services/orchestration
    environment:
      - DATABASE_URL=${SUPABASE_URL}
      - REDIS_URL=${UPSTASH_REDIS_URL}
      - CLAUDE_API_KEY=${CLAUDE_API_KEY}

  execution:
    build: ./services/execution
    cap_drop:
      - ALL  # Security: Drop all Linux capabilities
    security_opt:
      - no-new-privileges:true

  voice:
    build: ./services/voice
    environment:
      - S3_BUCKET=3d-office-recordings
      - WHISPER_API_KEY=${OPENAI_API_KEY}
```

**Container Images:**
- **Orchestration Service:** Node.js + BMAD Method adapter (~200MB)
- **Execution Service:** Python + sandboxed runtime (~300MB)
- **Voice Service:** Python + audio processing libraries (~400MB)

**Alternative Considered:** AWS Lambda
- **Rejected:** 15-minute timeout limit insufficient for long-running workflows; cold start latency conflicts with <500ms real-time requirement

#### CI/CD Pipeline: **GitHub Actions**

**Decision:** Use GitHub Actions for continuous integration and deployment.

**Rationale:**
- **Integrated:** Built into GitHub, no external service needed
- **Matrix Builds:** Test frontend + backend in parallel
- **Secrets Management:** GitHub Secrets for API keys, deployment credentials
- **Free Tier:** 2,000 minutes/month free for private repos
- **Docker Support:** Build and push container images to AWS ECR

**Workflow Configuration:**
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}

  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - run: docker build -t orchestration ./services/orchestration
      - run: docker push ${{ secrets.ECR_REGISTRY }}/orchestration:latest
      - run: aws ecs update-service --cluster 3d-office --service orchestration --force-new-deployment
```

**Alternative Considered:** GitLab CI, CircleCI
- **Rejected:** GitHub Actions has better integration with GitHub repo, simpler secrets management

#### Monitoring & Observability

**Decision:** Multi-tool approach - Sentry (errors) + Axiom (logs) + AWS CloudWatch (infrastructure).

**Rationale:**
- **Sentry (Error Tracking):**
  - Frontend: React error boundary integration, source map upload
  - Backend: Automatic exception capture, breadcrumb tracking
  - Mobile-Optimized: Device context, network conditions, battery level
  - Alerts: Slack notifications for new errors (>10 occurrences in 1 hour)

- **Axiom (Log Aggregation):**
  - Workflow Logs: All BMAD orchestration steps, agent outputs
  - Token Usage: Per-workflow cost tracking for optimization analysis
  - Audit Trail: Meeting recording access, integration credential usage
  - Query Language: SQL-like queries for debugging (e.g., "Find all workflows that exceeded $1 cost")

- **AWS CloudWatch (Infrastructure):**
  - Fargate Metrics: CPU, memory, network utilization
  - ECS Alarms: Container restart count, unhealthy task threshold
  - S3 Metrics: Meeting recording storage growth, download bandwidth

**Monitoring Dashboard:**
```typescript
// Key metrics tracked
interface MetricsDashboard {
  tokenCost: {
    averagePerWorkflow: number // Target: <$0.50 (NFR-P2.1)
    top10ExpensiveWorkflows: Workflow[]
  }

  performance: {
    workflowVisualizationLatency: number // Target: <500ms (NFR-P1.3)
    mobilePageLoadTime: number // Target: <3s on 3G
  }

  reliability: {
    uptime: number // Target: 99.5% (NFR-R1.2)
    workflowFailureRate: number
    failoverEvents: number
  }

  scale: {
    concurrentWorkflows: number // Target: 100+ per user (NFR-SC2.1)
    activeUsers: number
  }
}
```

#### Cost Tracking Service

**Decision:** Custom service using Claude API usage + AWS Cost Explorer API.

**Rationale:**
- **Token Accounting (NFR-P2.1):** Track Claude API costs per workflow in real-time
- **Infrastructure Costs:** AWS Cost Explorer API provides daily cost breakdown
- **Budget Alerts:** Notify user when project approaches 80% of budget
- **Optimization Recommendations:** Suggest caching for repeated cross-project intelligence queries

**Implementation:**
```typescript
// services/cost-tracking/index.ts
class CostTracker {
  async trackWorkflowCost(workflowId: string, tokens: number, model: string) {
    const costPerToken = this.getModelCost(model) // e.g., $0.003 per 1k tokens
    const cost = (tokens / 1000) * costPerToken

    await redis.incrby(`workflow:${workflowId}:cost`, cost)
    await redis.incrby(`project:${projectId}:cost`, cost)

    // Check budget threshold
    const projectCost = await redis.get(`project:${projectId}:cost`)
    const budget = await db.getProjectBudget(projectId)

    if (projectCost > budget * 0.8) {
      await sendBudgetAlert(projectId, projectCost, budget)
    }
  }
}
```

### Architecture Decision Summary

**Technology Stack Finalized:**

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Vite + React + TypeScript | Fastest build, mobile-optimized, react-three-fiber compatible |
| **State Management** | Zustand | Minimal boilerplate, 1KB bundle, TypeScript-first |
| **Routing** | React Router v6 | Industry standard, code splitting, mobile gestures |
| **API Client** | TanStack Query | Caching, optimistic updates, SSE integration |
| **Database** | Supabase (PostgreSQL) | RLS for multi-tenancy, real-time, managed service |
| **Caching** | Upstash Redis | Serverless-friendly, token tracking, global replication |
| **Object Storage** | AWS S3 Standard | 11 nines durability, encryption, lifecycle policies |
| **Authentication** | Clerk | Mobile-optimized, MFA, OAuth 2.0, superior DX |
| **API Pattern** | REST + OpenAPI 3.1 | Simple, cacheable, streaming support |
| **Real-Time** | Server-Sent Events (SSE) | Uni-directional, auto-reconnect, mobile-friendly |
| **API Gateway** | Cloudflare Workers | Edge computing, rate limiting, JWT validation |
| **Cloud Provider** | AWS (multi-region) | Fargate sandboxing, S3 durability, failover |
| **Frontend Hosting** | Vercel | Vite-native, edge CDN, preview deployments |
| **Backend Hosting** | AWS ECS Fargate | Serverless containers, auto-scaling, blue-green |
| **CI/CD** | GitHub Actions | Integrated, matrix builds, free tier |
| **Monitoring** | Sentry + Axiom + CloudWatch | Error tracking, log aggregation, infrastructure |

**Key Architectural Patterns:**
1. **Multi-Tenancy:** Row-level security (RLS) enforced at database layer
2. **Orchestration Adapter:** BMAD Method swappable via interface pattern
3. **Real-Time Updates:** SSE for uni-directional streaming (<500ms latency)
4. **Optimistic UI:** TanStack Query optimistic updates for instant feedback
5. **Sandboxed Execution:** AWS Fargate ephemeral containers per workflow
6. **Token Optimization:** Redis caching + cross-project intelligence reuse
7. **Mobile-First:** Code splitting, lazy loading, touch-optimized UI
8. **Audit Logging:** Append-only PostgreSQL triggers + S3 access logs
9. **Failover:** Multi-region AWS deployment with Route 53 health checks
10. **Error Translation:** Middleware layer converting technical errors to plain English

**Next Steps:**
- Step 5: Data Model & Schema Design (database tables, relationships, indexes)
- Step 6: Deployment Strategy & DevOps (infrastructure as code, monitoring setup)

---

## Data Model & Schema Design

_This section defines the PostgreSQL database schema, relationships, indexes, Row-Level Security (RLS) policies, and caching strategies._

### Schema Overview

**Database:** PostgreSQL 15+ (via Supabase)
**Multi-Tenancy:** Row-Level Security (RLS) with `user_id` / `project_id` on all tables
**Audit Strategy:** Append-only patterns with PostgreSQL triggers

**Key Design Principles:**
1. **Orchestration-Agnostic:** Workflow state stored as JSONB (swappable BMAD backend)
2. **Zero Data Loss:** Append-only workflow checkpoints, never update in place
3. **Multi-Tenant Isolation:** RLS enforced at database layer (not application)
4. **Cross-Project Intelligence:** User profile metadata separate from project data
5. **Performance:** Strategic indexes for real-time queries (<500ms latency requirement)

### Core Schema

#### Users (Clerk-Managed)

**Note:** User authentication is handled by Clerk. This table references Clerk user IDs.

```sql
-- This table is managed by Supabase Auth / Clerk integration
-- No manual INSERT/UPDATE needed
CREATE TABLE auth.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profile with cross-project intelligence metadata
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Cross-project intelligence (FR-8)
  thinking_patterns JSONB DEFAULT '{}',  -- E.g., {"prefers_detailed_plans": true, "risk_tolerance": "low"}
  behavior_patterns JSONB DEFAULT '{}',  -- E.g., {"typical_workflow_complexity": "medium", "avg_approval_time": "5min"}
  emotional_responses JSONB DEFAULT '{}', -- E.g., {"frustrated_by": ["slow_integrations"], "delighted_by": ["efficiency_metrics"]}

  -- Preferences
  preferred_language TEXT DEFAULT 'en',
  default_budget_per_workflow DECIMAL(10,2) DEFAULT 0.50,

  -- Metadata
  total_workflows_executed INTEGER DEFAULT 0,
  total_tokens_used BIGINT DEFAULT 0,
  total_cost_usd DECIMAL(10,2) DEFAULT 0.00,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- RLS: Users only see their own profile
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile" ON user_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Index for fast profile lookups
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
```

#### Projects (Multi-Tenant Workspaces)

```sql
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Project details
  name TEXT NOT NULL,
  description TEXT,

  -- Budget tracking (NFR-P2.1: $0.50 avg per workflow)
  budget_per_workflow DECIMAL(10,2) DEFAULT 0.50,
  total_budget_usd DECIMAL(10,2),

  -- Compliance (NFR-S4: Kuwait per-project compliance)
  compliance_framework TEXT, -- E.g., 'kuwait_gcc', 'gdpr', 'hipaa'
  data_residency_region TEXT, -- E.g., 'me-south-1' for Kuwait

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- RLS: Users see projects they own or are members of
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project owner access" ON projects
  FOR ALL USING (auth.uid() = owner_id AND deleted_at IS NULL);

CREATE POLICY "Project member access" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = projects.id
        AND user_id = auth.uid()
        AND deleted_at IS NULL
    )
  );

-- Indexes
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_deleted_at ON projects(deleted_at) WHERE deleted_at IS NULL;
```

#### Project Members (RBAC)

```sql
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role-based access control
  role TEXT NOT NULL CHECK (role IN ('owner', 'collaborator', 'viewer')),

  -- Permissions override (future: granular permissions)
  permissions JSONB DEFAULT '{}',

  -- Metadata
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  UNIQUE(project_id, user_id)
);

-- RLS: Project members see other members
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members visible to members" ON project_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
        AND pm.deleted_at IS NULL
    )
  );

-- Indexes
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
```

#### Workflows (BMAD Orchestration)

```sql
CREATE TABLE public.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Workflow metadata
  name TEXT NOT NULL,
  description TEXT,

  -- User input (chat message that initiated workflow)
  user_input TEXT NOT NULL,

  -- Workflow status (FR-3: BMAD stages)
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN (
    'planning',      -- Generating execution plan
    'pending_approval', -- Waiting for user approval
    'orchestrating', -- Coordinating agents
    'building',      -- Executing tasks
    'reviewing',     -- Reviewing results
    'completed',     -- Successfully finished
    'failed',        -- Encountered unrecoverable error
    'cancelled'      -- User cancelled
  )),

  -- Orchestration-agnostic state (NFR-I3.2: JSON schema with version)
  orchestration_framework TEXT DEFAULT 'bmad',
  orchestration_version TEXT DEFAULT '1.0.0',

  -- Token tracking (NFR-P2.1: $0.50 avg cost)
  total_tokens_used BIGINT DEFAULT 0,
  total_cost_usd DECIMAL(10,2) DEFAULT 0.00,
  efficiency_score DECIMAL(5,2), -- E.g., 8.5/10 (for "Efficient!" gamification)

  -- Result data
  result_summary TEXT,
  result_artifacts JSONB DEFAULT '[]', -- E.g., [{"type": "email", "id": "msg_123", "url": "https://..."}]

  -- Metadata
  created_by UUID NOT NULL REFERENCES auth.users(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Workflows belong to project (enforced via project membership)
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members access workflows" ON workflows
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = workflows.project_id
        AND user_id = auth.uid()
        AND deleted_at IS NULL
    )
  );

-- Indexes for real-time queries
CREATE INDEX idx_workflows_project_id ON workflows(project_id);
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_workflows_created_at ON workflows(created_at DESC);

-- Composite index for project workflows dashboard
CREATE INDEX idx_workflows_project_status_created
  ON workflows(project_id, status, created_at DESC);
```

#### Workflow States (Append-Only Checkpoints)

**Design:** Append-only log for workflow state transitions (NFR-R2: never lose progress, automatic resume).

```sql
CREATE TABLE public.workflow_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,

  -- Checkpoint metadata
  version INTEGER NOT NULL, -- Incremental version (1, 2, 3...)
  checkpoint_name TEXT NOT NULL, -- E.g., "agent_director_completed", "task_salesforce_update_started"

  -- Orchestration-agnostic state snapshot (JSONB for flexibility)
  state_snapshot JSONB NOT NULL,
  -- Example structure:
  -- {
  --   "agents": [{"name": "director", "status": "completed", "output": "..."}],
  --   "tasks": [{"id": "task_1", "status": "running", "progress": 0.6}],
  --   "variables": {"customer_email": "test@example.com"}
  -- }

  -- Performance metadata
  tokens_used_in_step BIGINT DEFAULT 0,
  cost_usd_in_step DECIMAL(10,2) DEFAULT 0.00,

  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Workflow states inherit workflow access
ALTER TABLE workflow_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workflow members access states" ON workflow_states
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workflows w
      JOIN project_members pm ON w.project_id = pm.project_id
      WHERE w.id = workflow_states.workflow_id
        AND pm.user_id = auth.uid()
        AND pm.deleted_at IS NULL
    )
  );

-- Indexes
CREATE INDEX idx_workflow_states_workflow_id ON workflow_states(workflow_id);
CREATE INDEX idx_workflow_states_version ON workflow_states(workflow_id, version DESC);
```

#### Workflow Nodes (Visualization Data)

**Design:** Stores node-based visualization data for n8n-style workflow map (FR-4: live visualization).

```sql
CREATE TABLE public.workflow_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,

  -- Node identification
  node_id TEXT NOT NULL, -- Unique within workflow (e.g., "agent_director", "task_salesforce_update")
  node_type TEXT NOT NULL CHECK (node_type IN ('agent', 'task', 'integration', 'decision')),

  -- Visual properties
  label TEXT NOT NULL,
  position_x INTEGER,
  position_y INTEGER,

  -- Node status (for real-time updates)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',  -- Not started
    'running',  -- In progress
    'success',  -- Completed successfully
    'error',    -- Failed
    'warning'   -- Needs attention
  )),

  -- Progress tracking
  progress_percent DECIMAL(5,2) DEFAULT 0.00, -- 0.00 to 100.00
  status_message TEXT, -- E.g., "Connecting to Salesforce..." (plain English)

  -- Connections (for graph visualization)
  connected_to UUID[], -- Array of node IDs

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workflow_id, node_id)
);

-- RLS: Workflow nodes inherit workflow access
ALTER TABLE workflow_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workflow members access nodes" ON workflow_nodes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workflows w
      JOIN project_members pm ON w.project_id = pm.project_id
      WHERE w.id = workflow_nodes.workflow_id
        AND pm.user_id = auth.uid()
        AND pm.deleted_at IS NULL
    )
  );

-- Indexes
CREATE INDEX idx_workflow_nodes_workflow_id ON workflow_nodes(workflow_id);
CREATE INDEX idx_workflow_nodes_status ON workflow_nodes(workflow_id, status);
```

#### Meetings (Voice Recordings)

**Design:** Metadata for meeting recordings stored in S3 (FR-2A: Kuwaiti Arabic transcription).

```sql
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Meeting metadata
  title TEXT NOT NULL,
  description TEXT,
  duration_seconds INTEGER,

  -- File storage (S3)
  s3_bucket TEXT NOT NULL,
  s3_key TEXT NOT NULL, -- E.g., "{user_id}/{project_id}/{meeting_id}.webm"
  file_size_bytes BIGINT,

  -- Processing status
  transcription_status TEXT DEFAULT 'pending' CHECK (transcription_status IN (
    'pending',      -- Uploaded, not processed
    'transcribing', -- Whisper API processing
    'translating',  -- Kuwaiti dialect → English translation
    'extracting',   -- SOP extraction via Claude
    'completed',    -- All processing done
    'failed'        -- Processing error
  )),

  -- Language detection (NFR-S4: Kuwaiti Arabic support)
  detected_language TEXT,
  has_kuwaiti_dialect BOOLEAN DEFAULT FALSE,

  -- Metadata
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Project members access meetings
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members access meetings" ON meetings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = meetings.project_id
        AND user_id = auth.uid()
        AND deleted_at IS NULL
    )
  );

-- Indexes
CREATE INDEX idx_meetings_project_id ON meetings(project_id);
CREATE INDEX idx_meetings_status ON meetings(transcription_status);
```

#### Meeting Transcripts

```sql
CREATE TABLE public.meeting_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,

  -- Transcript data
  transcript_original TEXT, -- Raw transcript (Arabic if detected)
  transcript_translated TEXT, -- English translation (if Kuwaiti dialect)

  -- Extracted SOPs (FR-2A: SOP extraction)
  sop_extracted JSONB DEFAULT '[]',
  -- Example: [
  --   {"step": 1, "description": "Client sends invoice screenshot via WhatsApp"},
  --   {"step": 2, "description": "Extract invoice details manually into spreadsheet"}
  -- ]

  -- Processing metadata
  transcription_model TEXT, -- E.g., "whisper-1"
  translation_model TEXT,   -- E.g., "kuwaiti-dialect-translator-v1"
  sop_extraction_model TEXT, -- E.g., "claude-opus-4-5"

  -- Confidence scores
  transcription_confidence DECIMAL(5,2),
  translation_confidence DECIMAL(5,2),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(meeting_id)
);

-- RLS: Transcripts inherit meeting access
ALTER TABLE meeting_transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Meeting transcript access" ON meeting_transcripts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM meetings m
      JOIN project_members pm ON m.project_id = pm.project_id
      WHERE m.id = meeting_transcripts.meeting_id
        AND pm.user_id = auth.uid()
        AND pm.deleted_at IS NULL
    )
  );

-- Index
CREATE INDEX idx_meeting_transcripts_meeting_id ON meeting_transcripts(meeting_id);
```

#### Integrations (CRM, Email, Calendar)

```sql
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Integration details
  integration_type TEXT NOT NULL CHECK (integration_type IN (
    'salesforce', 'hubspot', 'pipedrive', -- CRM
    'gmail', 'outlook', 'smtp',           -- Email
    'google_calendar', 'outlook_calendar', -- Calendar
    'zoom', 'teams'                        -- Meeting platforms
  )),

  name TEXT NOT NULL, -- E.g., "Production Salesforce", "Support Email"

  -- OAuth credentials (encrypted by Clerk in Phase 1, Vault in Phase 2)
  -- NOTE: Sensitive data stored in Clerk privateMetadata, this table only references
  credential_id TEXT NOT NULL, -- Reference to Clerk metadata key

  -- Connection status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'error', 'disconnected')),
  last_sync_at TIMESTAMPTZ,
  last_error TEXT, -- Plain-English error message

  -- Health monitoring
  health_check_interval_minutes INTEGER DEFAULT 60,
  consecutive_failures INTEGER DEFAULT 0,

  -- Metadata
  connected_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(project_id, integration_type, name)
);

-- RLS: Project members access integrations
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members access integrations" ON integrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = integrations.project_id
        AND user_id = auth.uid()
        AND deleted_at IS NULL
    )
  );

-- Indexes
CREATE INDEX idx_integrations_project_id ON integrations(project_id);
CREATE INDEX idx_integrations_status ON integrations(status);
```

#### Token Usage (Cost Tracking)

**Design:** Real-time token tracking per workflow for budget monitoring (NFR-P2.1: $0.50 avg cost).

```sql
CREATE TABLE public.token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Token details
  model TEXT NOT NULL, -- E.g., "claude-opus-4-5", "claude-sonnet-4-5"
  operation TEXT NOT NULL, -- E.g., "chat", "code_generation", "sop_extraction"

  -- Token counts
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,

  -- Cost calculation
  cost_per_1k_input DECIMAL(10,6), -- E.g., 0.015 for Opus input
  cost_per_1k_output DECIMAL(10,6), -- E.g., 0.075 for Opus output
  total_cost_usd DECIMAL(10,6) GENERATED ALWAYS AS (
    (input_tokens / 1000.0) * cost_per_1k_input +
    (output_tokens / 1000.0) * cost_per_1k_output
  ) STORED,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Project members access token usage
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members access token usage" ON token_usage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = token_usage.project_id
        AND user_id = auth.uid()
        AND deleted_at IS NULL
    )
  );

-- Indexes for real-time cost tracking
CREATE INDEX idx_token_usage_workflow_id ON token_usage(workflow_id);
CREATE INDEX idx_token_usage_project_id ON token_usage(project_id);
CREATE INDEX idx_token_usage_created_at ON token_usage(created_at DESC);

-- Aggregate view for project-level cost tracking
CREATE VIEW project_token_summary AS
SELECT
  project_id,
  SUM(total_tokens) AS total_tokens,
  SUM(total_cost_usd) AS total_cost_usd,
  AVG(total_cost_usd) FILTER (WHERE workflow_id IS NOT NULL) AS avg_cost_per_workflow,
  COUNT(DISTINCT workflow_id) AS total_workflows
FROM token_usage
GROUP BY project_id;
```

#### Audit Logs (Compliance)

**Design:** Append-only audit trail for compliance (NFR-S3: audit logs, NFR-S4: per-project compliance).

```sql
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL, -- E.g., "workflow_created", "meeting_accessed", "integration_connected"
  event_category TEXT NOT NULL CHECK (event_category IN (
    'workflow',
    'meeting',
    'integration',
    'authentication',
    'data_access',
    'compliance'
  )),

  -- Actor information
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,

  -- Event payload
  event_data JSONB NOT NULL,
  -- Example: {"workflow_id": "uuid", "status_change": "planning -> orchestrating"}

  -- Compliance metadata
  compliance_framework TEXT, -- E.g., "kuwait_gcc", "gdpr"
  is_sensitive_data BOOLEAN DEFAULT FALSE,

  -- Timestamp (immutable)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Project members access audit logs for their projects
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members access audit logs" ON audit_logs
  FOR SELECT USING (
    project_id IS NULL OR -- Global events (auth)
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = audit_logs.project_id
        AND user_id = auth.uid()
        AND deleted_at IS NULL
    )
  );

-- Indexes for audit log queries
CREATE INDEX idx_audit_logs_project_id ON audit_logs(project_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

### Database Triggers (Automation)

#### Auto-Update Workflow Status

```sql
-- Trigger: Update workflow status when all nodes complete
CREATE OR REPLACE FUNCTION update_workflow_status_on_node_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- If all nodes are success, mark workflow as completed
  IF NOT EXISTS (
    SELECT 1 FROM workflow_nodes
    WHERE workflow_id = NEW.workflow_id
      AND status NOT IN ('success', 'warning')
  ) THEN
    UPDATE workflows
    SET status = 'completed',
        completed_at = NOW()
    WHERE id = NEW.workflow_id
      AND status NOT IN ('completed', 'failed', 'cancelled');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_workflow_status
AFTER UPDATE OF status ON workflow_nodes
FOR EACH ROW
EXECUTE FUNCTION update_workflow_status_on_node_completion();
```

#### Audit Log Trigger

```sql
-- Trigger: Auto-log workflow creations
CREATE OR REPLACE FUNCTION log_workflow_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (project_id, event_type, event_category, user_id, event_data)
  VALUES (
    NEW.project_id,
    'workflow_created',
    'workflow',
    NEW.created_by,
    jsonb_build_object(
      'workflow_id', NEW.id,
      'workflow_name', NEW.name,
      'user_input', NEW.user_input
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_workflow_creation
AFTER INSERT ON workflows
FOR EACH ROW
EXECUTE FUNCTION log_workflow_creation();
```

### Redis Caching Strategy

**Design:** Upstash Redis for real-time token tracking, workflow state hot storage, cross-project intelligence caching.

#### Cache Key Patterns

```typescript
// Token usage caching (1-hour TTL)
const tokenCacheKey = (projectId: string) => `project:${projectId}:tokens`
// Value: { total_tokens: 50000, total_cost_usd: 0.75, avg_per_workflow: 0.25 }

const workflowTokenKey = (workflowId: string) => `workflow:${workflowId}:tokens`
// Value: { total_tokens: 5000, total_cost_usd: 0.05, efficiency_score: 8.5 }

// Workflow state hot storage (30-min TTL, PostgreSQL is source of truth)
const workflowStateKey = (workflowId: string) => `workflow:${workflowId}:state`
// Value: Latest workflow_states.state_snapshot JSONB

// User profile intelligence (24-hour TTL)
const userProfileKey = (userId: string) => `user:${userId}:profile`
// Value: user_profiles.thinking_patterns + behavior_patterns + emotional_responses

// Real-time workflow updates (Pub/Sub for SSE)
const workflowUpdatesChannel = (workflowId: string) => `workflow:${workflowId}:updates`
// Published JSON: { node_id: "agent_director", status: "running", progress: 0.6, message: "Analyzing requirements..." }
```

#### Cache Invalidation Strategy

```typescript
// Invalidate on workflow completion
await redis.del(`workflow:${workflowId}:state`)
await redis.del(`workflow:${workflowId}:tokens`)

// Invalidate project-level cache on new workflow
await redis.del(`project:${projectId}:tokens`)

// Background job: Sync Redis → PostgreSQL every 5 minutes (for token usage)
```

### S3 Storage Structure

**Design:** AWS S3 Standard for meeting recordings with lifecycle policies (NFR-R3.1: 11 nines durability).

```
s3://3d-office-recordings/
  ├── {user_id}/
  │   ├── {project_id}/
  │   │   ├── meetings/
  │   │   │   ├── {meeting_id}.webm           # Original audio recording
  │   │   │   ├── {meeting_id}_metadata.json  # Duration, file size, upload time
  │   │   │   ├── {meeting_id}_transcript.json # Original transcript (Arabic if detected)
  │   │   │   ├── {meeting_id}_translation.json # English translation (if Kuwaiti)
  │   │   │   └── {meeting_id}_sop.json       # Extracted SOP steps
  │   │   ├── workflow_artifacts/
  │   │   │   ├── {workflow_id}_result_{timestamp}.pdf # Generated documents
  │   │   │   └── {workflow_id}_logs_{timestamp}.txt   # Execution logs
```

**Lifecycle Policy:**
- **0-90 days:** S3 Standard (frequent access)
- **91-365 days:** S3 Standard-IA (infrequent access, 99.9% availability)
- **365+ days:** S3 Glacier Flexible Retrieval (compliance archival, <$1/TB/month)

**Access Control:**
- **Presigned URLs:** Temporary access (15-minute expiration) for meeting playback
- **CloudFront CDN:** Global distribution for low-latency playback
- **Access Logging:** S3 access logs → audit_logs table daily sync

### Performance Optimization

#### Strategic Indexes

```sql
-- Most critical indexes (already defined above):
-- 1. idx_workflows_project_status_created - Project dashboard query
-- 2. idx_workflow_states_version - Latest checkpoint retrieval
-- 3. idx_token_usage_workflow_id - Real-time cost display

-- Additional performance indexes
CREATE INDEX idx_workflows_user_created
  ON workflows(created_by, created_at DESC); -- User's workflow history

CREATE INDEX idx_workflow_nodes_status_updated
  ON workflow_nodes(workflow_id, updated_at DESC)
  WHERE status = 'running'; -- Real-time visualization query
```

#### Query Performance Targets

```sql
-- Dashboard: User's active workflows (<100ms)
SELECT id, name, status, total_cost_usd, created_at
FROM workflows
WHERE project_id = $1 AND status NOT IN ('completed', 'failed', 'cancelled')
ORDER BY created_at DESC
LIMIT 10;

-- Workflow visualization: All nodes with latest status (<200ms)
SELECT node_id, label, status, progress_percent, status_message, position_x, position_y
FROM workflow_nodes
WHERE workflow_id = $1
ORDER BY created_at;

-- Real-time token tracking: Project total cost (<50ms via Redis cache)
-- Cache hit: O(1) Redis GET
-- Cache miss: Aggregate query with materialized view

-- Meeting transcript search: Full-text search on SOPs (<500ms)
CREATE INDEX idx_meeting_transcripts_sop_gin
  ON meeting_transcripts USING GIN (sop_extracted jsonb_path_ops);
```

### Data Migration Strategy

**Schema Versioning:** Supabase migrations with version-controlled SQL files.

```bash
# Create migration
supabase migration new initial_schema

# Migration file: migrations/20260105000000_initial_schema.sql
# Contains all CREATE TABLE, CREATE INDEX, CREATE POLICY statements

# Apply migration (development)
supabase db reset

# Apply migration (production)
supabase db push
```

**Migration Safety:**
1. **Backwards Compatibility:** New columns with DEFAULT values (no breaking changes)
2. **RLS Testing:** Unit tests for RLS policies before production deploy
3. **Zero-Downtime:** Blue-green database deployment for major schema changes
4. **Rollback Plan:** Down migrations for every up migration

### Data Model Summary

**Total Tables:** 11 core tables
- **Auth & Users:** users, user_profiles (2)
- **Multi-Tenancy:** projects, project_members (2)
- **Workflows:** workflows, workflow_states, workflow_nodes (3)
- **Meetings:** meetings, meeting_transcripts (2)
- **Operations:** integrations, token_usage, audit_logs (3)

**Multi-Tenant Isolation:** RLS on all tables (user_id / project_id enforcement)
**Audit Trail:** append-only patterns (workflow_states, audit_logs)
**Performance:** Strategic indexes for <500ms queries
**Compliance:** Per-project compliance tracking, meeting recording access logs

**Next Step:**
- Step 6: Deployment Strategy & DevOps (infrastructure as code, environment setup, monitoring configuration)

---

## Deployment Strategy & DevOps

_This section defines the deployment pipeline, infrastructure provisioning, environment management, and operational procedures for production readiness._

### Environment Strategy

**Three-Tier Environment Architecture:**

```
┌────────────────────────────────────────────────────────┐
│ Development (Local)                                    │
│ - Local Vite dev server (localhost:5173)              │
│ - Supabase local instance (Docker)                    │
│ - Upstash Redis local (Docker or cloud free tier)     │
│ - Mock S3 (LocalStack or Supabase Storage)            │
│ - Claude API (real, development key with limits)      │
└────────────────────────────────────────────────────────┘
              ↓ Push to feature branch
┌────────────────────────────────────────────────────────┐
│ Staging (Preview Deployments)                         │
│ - Vercel preview deployment (unique URL per PR)       │
│ - Supabase staging project                            │
│ - Upstash Redis staging instance                      │
│ - AWS S3 staging bucket                               │
│ - AWS Fargate staging cluster                         │
│ - Claude API (staging key with moderate limits)       │
└────────────────────────────────────────────────────────┘
              ↓ Merge to main (after approval)
┌────────────────────────────────────────────────────────┐
│ Production (Multi-Region)                             │
│ - Vercel production (3d-office.com)                   │
│ - Supabase production (primary: us-east-1)            │
│ - Upstash Redis (global replication)                  │
│ - AWS S3 production (multi-region replication)        │
│ - AWS Fargate production (us-east-1 + eu-west-1)     │
│ - Cloudflare Workers (edge gateway, 285+ locations)   │
│ - Claude API (production key, full limits)            │
└────────────────────────────────────────────────────────┘
```

**Environment Variable Management:**

```bash
# .env.local (Development - NOT committed to git)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbG...
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
UPSTASH_REDIS_REST_URL=http://localhost:6379
CLAUDE_API_KEY=sk-ant-dev-...
AWS_REGION=us-east-1

# .env.staging (Staging - stored in GitHub Secrets)
VITE_SUPABASE_URL=https://staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
UPSTASH_REDIS_REST_URL=https://staging-redis.upstash.io
CLAUDE_API_KEY=sk-ant-staging-...
AWS_S3_BUCKET=3d-office-staging-recordings

# .env.production (Production - stored in GitHub Secrets + Vercel Secrets)
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
UPSTASH_REDIS_REST_URL=https://global-redis.upstash.io
CLAUDE_API_KEY=sk-ant-prod-...
AWS_S3_BUCKET=3d-office-recordings
```

### Infrastructure as Code

**Tool Selection: Terraform** (over Pulumi/CDK for wider team familiarity)

**Directory Structure:**
```
infrastructure/
├── terraform/
│   ├── environments/
│   │   ├── development/
│   │   │   ├── main.tf
│   │   │   └── terraform.tfvars
│   │   ├── staging/
│   │   │   ├── main.tf
│   │   │   └── terraform.tfvars
│   │   └── production/
│   │       ├── main.tf
│   │       ├── terraform.tfvars
│   │       └── terraform.tfvars.example
│   ├── modules/
│   │   ├── ecs-fargate/       # Backend services
│   │   ├── s3-storage/        # Meeting recordings
│   │   ├── cloudfront-cdn/    # CDN for S3 playback
│   │   └── route53/           # DNS + health checks
│   └── backend.tf             # Terraform state storage (S3 + DynamoDB)
└── supabase/
    ├── config.toml            # Supabase project config
    ├── migrations/            # Database migrations
    │   ├── 20260105000000_initial_schema.sql
    │   └── 20260106000000_add_workflow_triggers.sql
    └── seed.sql               # Dev seed data
```

**Example Terraform Module - ECS Fargate:**

```hcl
# modules/ecs-fargate/main.tf
resource "aws_ecs_cluster" "main" {
  name = "${var.environment}-3d-office-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_task_definition" "orchestration_service" {
  family                   = "${var.environment}-orchestration"
  requires_compatibilities = ["FARGATE"]
  network_mode            = "awsvpc"
  cpu                     = 1024  # 1 vCPU
  memory                  = 2048  # 2 GB
  execution_role_arn      = aws_iam_role.ecs_execution_role.arn
  task_role_arn           = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([{
    name  = "orchestration"
    image = "${var.ecr_repository_url}:${var.image_tag}"

    environment = [
      { name = "DATABASE_URL", value = var.supabase_url },
      { name = "REDIS_URL", value = var.upstash_redis_url },
      { name = "ENVIRONMENT", value = var.environment }
    ]

    secrets = [
      { name = "CLAUDE_API_KEY", valueFrom = aws_secretsmanager_secret_version.claude_api_key.arn }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/${var.environment}/orchestration"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])
}

resource "aws_ecs_service" "orchestration" {
  name            = "${var.environment}-orchestration"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.orchestration_service.arn
  desired_count   = var.environment == "production" ? 3 : 1

  launch_type = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.orchestration.arn
    container_name   = "orchestration"
    container_port   = 3000
  }

  # Auto-scaling configuration
  enable_ecs_managed_tags = true
  propagate_tags          = "SERVICE"
}

# Auto-scaling policy
resource "aws_appautoscaling_target" "ecs_target" {
  max_capacity       = var.environment == "production" ? 10 : 3
  min_capacity       = var.environment == "production" ? 3 : 1
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.orchestration.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_policy_cpu" {
  name               = "${var.environment}-cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0  # Scale up at 70% CPU
  }
}
```

### CI/CD Pipeline

**GitHub Actions Workflow:**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Staging/Production

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  TERRAFORM_VERSION: '1.6.0'

jobs:
  # Job 1: Linting & Type Checking
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: TypeScript type check
        run: npm run type-check

  # Job 2: Unit & Integration Tests
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run Vitest unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
        env:
          VITE_SUPABASE_URL: ${{ secrets.STAGING_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.STAGING_SUPABASE_ANON_KEY }}

  # Job 3: Build Frontend
  build-frontend:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build frontend
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.PRODUCTION_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.PRODUCTION_SUPABASE_ANON_KEY }}
          VITE_CLERK_PUBLISHABLE_KEY: ${{ secrets.PRODUCTION_CLERK_KEY }}

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: frontend-build
          path: dist/

  # Job 4: Build & Push Backend Docker Images
  build-backend:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build orchestration service image
        run: |
          docker build -t orchestration:${{ github.sha }} ./services/orchestration
          docker tag orchestration:${{ github.sha }} ${{ steps.login-ecr.outputs.registry }}/orchestration:${{ github.sha }}
          docker tag orchestration:${{ github.sha }} ${{ steps.login-ecr.outputs.registry }}/orchestration:latest
          docker push ${{ steps.login-ecr.outputs.registry }}/orchestration:${{ github.sha }}
          docker push ${{ steps.login-ecr.outputs.registry }}/orchestration:latest

      - name: Build execution service image
        run: |
          docker build -t execution:${{ github.sha }} ./services/execution
          docker tag execution:${{ github.sha }} ${{ steps.login-ecr.outputs.registry }}/execution:${{ github.sha }}
          docker push ${{ steps.login-ecr.outputs.registry }}/execution:${{ github.sha }}

      - name: Build voice service image
        run: |
          docker build -t voice:${{ github.sha }} ./services/voice
          docker tag voice:${{ github.sha }} ${{ steps.login-ecr.outputs.registry }}/voice:${{ github.sha }}
          docker push ${{ steps.login-ecr.outputs.registry }}/voice:${{ github.sha }}

  # Job 5: Database Migrations
  migrate-database:
    runs-on: ubuntu-latest
    needs: [test]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1

      - name: Run migrations (Production)
        run: |
          supabase db push --db-url ${{ secrets.PRODUCTION_SUPABASE_DB_URL }}

  # Job 6: Deploy Frontend to Vercel
  deploy-frontend:
    runs-on: ubuntu-latest
    needs: [build-frontend]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: frontend-build
          path: dist/

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  # Job 7: Deploy Backend to AWS Fargate
  deploy-backend:
    runs-on: ubuntu-latest
    needs: [build-backend, migrate-database]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Update ECS service (orchestration)
        run: |
          aws ecs update-service \
            --cluster production-3d-office-cluster \
            --service production-orchestration \
            --force-new-deployment

      - name: Wait for deployment to complete
        run: |
          aws ecs wait services-stable \
            --cluster production-3d-office-cluster \
            --services production-orchestration

      - name: Update ECS service (execution)
        run: |
          aws ecs update-service \
            --cluster production-3d-office-cluster \
            --service production-execution \
            --force-new-deployment

      - name: Update ECS service (voice)
        run: |
          aws ecs update-service \
            --cluster production-3d-office-cluster \
            --service production-voice \
            --force-new-deployment

  # Job 8: Smoke Tests (Production)
  smoke-tests:
    runs-on: ubuntu-latest
    needs: [deploy-frontend, deploy-backend]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install dependencies
        run: npm ci

      - name: Run smoke tests
        run: npm run test:smoke
        env:
          BASE_URL: https://3d-office.com
          HEALTH_CHECK_TIMEOUT: 30000

  # Job 9: Notify Deployment
  notify:
    runs-on: ubuntu-latest
    needs: [smoke-tests]
    if: always()
    steps:
      - name: Send Slack notification
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Deployment ${{ needs.smoke-tests.result }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "🚀 *Deployment to Production*\n*Status:* ${{ needs.smoke-tests.result }}\n*Branch:* ${{ github.ref }}\n*Commit:* ${{ github.sha }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Local Development Setup

**Prerequisites:**
```bash
# Required tools
- Node.js 20+
- Docker Desktop
- Supabase CLI
- Git

# Optional (for backend development)
- Python 3.11+
- AWS CLI
- Terraform
```

**Setup Script:**

```bash
#!/bin/bash
# scripts/dev-setup.sh

echo "🚀 Setting up Nexus development environment..."

# 1. Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# 2. Start Supabase local instance
echo "🗄️  Starting local Supabase..."
supabase start

# 3. Run database migrations
echo "🔄 Running database migrations..."
supabase db reset

# 4. Start Redis (Docker)
echo "📮 Starting local Redis..."
docker run -d -p 6379:6379 redis:7-alpine

# 5. Generate environment file
echo "⚙️  Generating .env.local..."
cat > .env.local <<EOF
VITE_SUPABASE_URL=$(supabase status | grep "API URL" | awk '{print $3}')
VITE_SUPABASE_ANON_KEY=$(supabase status | grep "anon key" | awk '{print $3}')
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
UPSTASH_REDIS_REST_URL=http://localhost:6379
CLAUDE_API_KEY=sk-ant-dev-YOUR_KEY_HERE
EOF

echo "✅ Setup complete! Run 'npm run dev' to start the development server."
```

**Development Commands:**

```json
// package.json scripts
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit",
    "test:unit": "vitest run",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:smoke": "playwright test smoke",
    "db:reset": "supabase db reset",
    "db:migrate": "supabase migration new",
    "db:push": "supabase db push"
  }
}
```

### Monitoring & Observability

**Monitoring Stack Configuration:**

```typescript
// services/orchestration/src/monitoring.ts
import * as Sentry from '@sentry/node'
import { createClient } from '@axiom-co/js'
import { CloudWatch } from '@aws-sdk/client-cloudwatch'

// 1. Sentry Error Tracking
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.ENVIRONMENT,
  tracesSampleRate: process.env.ENVIRONMENT === 'production' ? 0.1 : 1.0,

  beforeSend(event) {
    // Scrub sensitive data
    if (event.request?.headers) {
      delete event.request.headers['Authorization']
      delete event.request.headers['Cookie']
    }
    return event
  },

  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
  ],
})

// 2. Axiom Log Aggregation
const axiom = createClient({
  token: process.env.AXIOM_API_TOKEN,
  orgId: process.env.AXIOM_ORG_ID,
})

export function logWorkflowEvent(workflowId: string, event: string, metadata: object) {
  axiom.ingest('workflow-events', [{
    workflow_id: workflowId,
    event,
    metadata,
    timestamp: new Date().toISOString(),
    environment: process.env.ENVIRONMENT,
  }])
}

export function logTokenUsage(projectId: string, tokens: number, cost: number) {
  axiom.ingest('token-usage', [{
    project_id: projectId,
    tokens,
    cost_usd: cost,
    timestamp: new Date().toISOString(),
  }])
}

// 3. CloudWatch Metrics
const cloudwatch = new CloudWatch({ region: 'us-east-1' })

export async function publishMetric(metricName: string, value: number, unit: string) {
  await cloudwatch.putMetricData({
    Namespace: '3D-Office',
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Unit: unit,
      Timestamp: new Date(),
      Dimensions: [
        { Name: 'Environment', Value: process.env.ENVIRONMENT },
        { Name: 'Service', Value: 'orchestration' },
      ],
    }],
  })
}
```

**CloudWatch Alarms (Terraform):**

```hcl
# infrastructure/terraform/modules/cloudwatch-alarms/main.tf

resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "${var.environment}-ecs-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "60"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "ECS CPU utilization above 80%"

  alarm_actions = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.orchestration.name
  }
}

resource "aws_cloudwatch_metric_alarm" "workflow_failure_rate_high" {
  alarm_name          = "${var.environment}-workflow-failure-rate-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "WorkflowFailureRate"
  namespace           = "3D-Office"
  period              = "300"  # 5 minutes
  statistic           = "Average"
  threshold           = "10"   # More than 10% failure rate
  alarm_description   = "Workflow failure rate above 10%"

  alarm_actions = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "token_cost_spike" {
  alarm_name          = "${var.environment}-token-cost-spike"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "AverageWorkflowCost"
  namespace           = "3D-Office"
  period              = "900"  # 15 minutes
  statistic           = "Average"
  threshold           = "1.0"  # Average workflow cost > $1.00 (target is $0.50)
  alarm_description   = "Average workflow cost exceeding $1.00"

  alarm_actions = [aws_sns_topic.alerts.arn]
}
```

### Disaster Recovery & Backup Strategy

**Database Backups (Supabase):**
- **Automatic Daily Backups:** Retained for 7 days (Supabase Pro plan)
- **Point-in-Time Recovery (PITR):** Up to 7 days historical restore
- **Manual Backups:** Before major migrations via `pg_dump`

```bash
# Manual backup script
#!/bin/bash
# scripts/backup-database.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${TIMESTAMP}.sql"

echo "🔄 Starting database backup..."
pg_dump $DATABASE_URL > backups/$BACKUP_FILE

# Upload to S3 for long-term storage
aws s3 cp backups/$BACKUP_FILE s3://3d-office-backups/database/$BACKUP_FILE

echo "✅ Backup completed: $BACKUP_FILE"
```

**S3 Versioning & Cross-Region Replication:**

```hcl
# infrastructure/terraform/modules/s3-storage/main.tf

resource "aws_s3_bucket" "recordings" {
  bucket = "3d-office-recordings"

  lifecycle {
    prevent_destroy = true  # Protect production bucket
  }
}

# Enable versioning (protect against accidental deletes)
resource "aws_s3_bucket_versioning" "recordings" {
  bucket = aws_s3_bucket.recordings.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Cross-region replication (us-east-1 → eu-west-1)
resource "aws_s3_bucket_replication_configuration" "recordings" {
  bucket = aws_s3_bucket.recordings.id
  role   = aws_iam_role.replication.arn

  rule {
    id     = "replicate-all"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.recordings_replica.arn
      storage_class = "STANDARD_IA"  # Cheaper storage for replica
    }
  }
}

resource "aws_s3_bucket" "recordings_replica" {
  bucket = "3d-office-recordings-replica"
  provider = aws.eu-west-1

  lifecycle {
    prevent_destroy = true
  }
}
```

**Multi-Region Failover (Route 53):**

```hcl
# infrastructure/terraform/modules/route53/main.tf

resource "aws_route53_health_check" "primary_api" {
  fqdn              = "api.3d-office.com"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = "3"
  request_interval  = "30"

  tags = {
    Name = "primary-api-health-check"
  }
}

resource "aws_route53_record" "api" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.3d-office.com"
  type    = "A"

  set_identifier = "primary"
  health_check_id = aws_route53_health_check.primary_api.id

  alias {
    name                   = aws_lb.primary.dns_name
    zone_id                = aws_lb.primary.zone_id
    evaluate_target_health = true
  }

  failover_routing_policy {
    type = "PRIMARY"
  }
}

resource "aws_route53_record" "api_failover" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.3d-office.com"
  type    = "A"

  set_identifier = "failover"

  alias {
    name                   = aws_lb.failover.dns_name  # eu-west-1
    zone_id                = aws_lb.failover.zone_id
    evaluate_target_health = true
  }

  failover_routing_policy {
    type = "SECONDARY"
  }
}
```

### Production Readiness Checklist

**Pre-Launch Checklist:**

- [ ] **Infrastructure**
  - [ ] Terraform state backend configured (S3 + DynamoDB)
  - [ ] All environments provisioned (dev, staging, production)
  - [ ] Multi-region failover tested (Route 53 health checks)
  - [ ] Auto-scaling policies configured and tested
  - [ ] Security groups properly restricted (least privilege)

- [ ] **Database**
  - [ ] All migrations applied successfully
  - [ ] RLS policies tested for multi-tenant isolation
  - [ ] Database indexes created for performance
  - [ ] Backup strategy validated (restore test completed)
  - [ ] Connection pooling configured (PgBouncer via Supabase)

- [ ] **Application**
  - [ ] Environment variables set in all environments
  - [ ] API keys rotated to production keys
  - [ ] Error tracking configured (Sentry)
  - [ ] Log aggregation configured (Axiom)
  - [ ] CloudWatch alarms created and tested

- [ ] **Security**
  - [ ] SSL/TLS certificates configured (auto-renewed)
  - [ ] CORS policies restrictive (only allow 3d-office.com)
  - [ ] Rate limiting enabled (Cloudflare Workers)
  - [ ] Secrets stored in AWS Secrets Manager
  - [ ] Security headers configured (CSP, HSTS, X-Frame-Options)

- [ ] **Monitoring**
  - [ ] Uptime monitoring (99.5% SLA target)
  - [ ] Error rate dashboard (Sentry)
  - [ ] Token cost tracking dashboard (Axiom)
  - [ ] Workflow failure alerts configured
  - [ ] Slack/email notifications for critical alerts

- [ ] **Performance**
  - [ ] CDN configured for static assets (Vercel Edge)
  - [ ] S3 CloudFront distribution for meeting recordings
  - [ ] Database query performance tested (<500ms target)
  - [ ] Frontend bundle size optimized (<500KB gzipped)
  - [ ] Lighthouse score >90 on mobile

- [ ] **Compliance**
  - [ ] Audit logging enabled (meeting access, workflow execution)
  - [ ] Data residency configuration tested (Kuwait me-south-1)
  - [ ] GDPR-ready (data export, deletion capabilities)
  - [ ] Terms of Service + Privacy Policy published

- [ ] **Testing**
  - [ ] Unit tests passing (>80% coverage)
  - [ ] Integration tests passing
  - [ ] Smoke tests passing in production
  - [ ] Load testing completed (100 concurrent workflows)
  - [ ] Failover testing completed (primary → secondary region)

### Deployment Strategy Summary

**Key Infrastructure Components:**
- **Frontend:** Vercel (edge CDN, automatic SSL, preview deployments)
- **Backend:** AWS ECS Fargate (auto-scaling containers, blue-green deployment)
- **Database:** Supabase (managed PostgreSQL, automatic backups, PITR)
- **Caching:** Upstash Redis (global replication, serverless-friendly)
- **Storage:** AWS S3 (11 nines durability, cross-region replication)
- **CDN:** Cloudflare Workers (edge API gateway, 285+ locations)

**Deployment Pipeline:**
1. **Developer pushes to feature branch** → GitHub Actions runs lint/test
2. **PR created** → Vercel creates preview deployment with unique URL
3. **PR approved + merged to main** → GitHub Actions runs full deployment:
   - Database migrations (Supabase)
   - Frontend build + deploy (Vercel production)
   - Backend Docker build + push (AWS ECR)
   - ECS service update (rolling deployment, zero-downtime)
   - Smoke tests (verify production health)
   - Slack notification (deployment success/failure)

**Monitoring & Alerting:**
- **Sentry:** Error tracking, performance monitoring, release tracking
- **Axiom:** Log aggregation, workflow analytics, token cost tracking
- **CloudWatch:** Infrastructure metrics, ECS health, auto-scaling triggers

**Disaster Recovery:**
- **RTO (Recovery Time Objective):** 60 seconds (multi-region failover)
- **RPO (Recovery Point Objective):** 0 seconds (real-time replication)
- **Database Backups:** Daily automatic + manual pre-migration
- **S3 Replication:** us-east-1 → eu-west-1 cross-region replication

**Compliance & Security:**
- **Data Residency:** Configurable per-project (Kuwait: me-south-1)
- **Encryption:** TLS 1.3 in transit, AES-256 at rest
- **Audit Logs:** Append-only PostgreSQL tables + S3 access logs
- **Secrets Management:** AWS Secrets Manager + GitHub Secrets

---

## Architecture Document Complete

**Total Architecture Decisions:** 6 comprehensive steps completed

This architecture document provides a production-ready blueprint for the **Autoclaude 2D Workflow Office** platform, covering:

1. ✅ **Project Context Analysis** - Requirements, scale, constraints, cross-cutting concerns
2. ✅ **Starter Template Evaluation** - Vite + React + TypeScript (frontend), custom backend
3. ✅ **Core Architectural Decisions** - Data, auth, API, frontend, infrastructure (14 technology decisions)
4. ✅ **Data Model & Schema Design** - 11 database tables, RLS policies, Redis caching, S3 structure
5. ✅ **Deployment Strategy & DevOps** - CI/CD pipeline, infrastructure as code, monitoring, disaster recovery

**Key Architectural Patterns:**
1. **Multi-Tenancy:** Row-level security enforced at database layer (PostgreSQL RLS)
2. **Orchestration Adapter:** BMAD Method swappable via interface pattern (NFR-I3.1)
3. **Real-Time Updates:** Server-Sent Events for <500ms workflow visualization latency
4. **Optimistic UI:** TanStack Query optimistic updates for instant user feedback
5. **Sandboxed Execution:** AWS Fargate ephemeral containers per workflow
6. **Token Optimization:** Redis caching + cross-project intelligence reuse
7. **Mobile-First:** Code splitting, lazy loading, 44x44px touch targets
8. **Audit Logging:** Append-only PostgreSQL triggers + S3 access logs
9. **Multi-Region Failover:** Route 53 health checks with 60-second automatic failover
10. **Error Translation:** Middleware layer converting technical errors to plain English

**Non-Functional Requirements Addressed:**
- ✅ **Performance:** <500ms workflow updates, <$0.50 avg workflow cost, mobile 375px baseline
- ✅ **Security:** Multi-tenant RLS, TLS 1.3, AES-256, MFA, Kuwait compliance per-project
- ✅ **Reliability:** 99.5% uptime, zero data loss (append-only), 11 nines S3 durability
- ✅ **Scalability:** 100+ concurrent workflows, 10x user growth support
- ✅ **Integration:** Orchestration-agnostic state, blue-green deployment for framework swap

**Ready for Implementation:** This architecture document provides complete technical specifications for development teams to begin building the platform.
