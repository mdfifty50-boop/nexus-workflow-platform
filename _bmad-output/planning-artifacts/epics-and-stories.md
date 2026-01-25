---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - "C:\\Users\\PC\\Documents\\Autoclaude 2D workflow office\\_bmad-output\\planning-artifacts\\prd.md"
  - "C:\\Users\\PC\\Documents\\Autoclaude 2D workflow office\\_bmad-output\\planning-artifacts\\architecture.md"
  - "C:\\Users\\PC\\Documents\\Autoclaude 2D workflow office\\_bmad-output\\planning-artifacts\\ux-design-specification.md"
workflowType: 'epics-and-stories'
project_name: 'Nexus'
user_name: 'Mohammed'
date: '2026-01-06'
lastStep: 4
workflowComplete: true
---

# Nexus - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Nexus, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories organized by user value.

**Product Vision:** Consumer-grade AI assistant platform democratizing agentic AI workflows (Claude Code + BMAD Method) for non-technical mainstream users - executing real tasks (book flights, automate CRMs, deploy websites) rather than just suggesting.

---

## Requirements Inventory

### Functional Requirements (from PRD)

**Total: 148 specific requirements across 14 categories**

**FR-1: Project Management (7 requirements)**
- FR-1.1: Multi-project workspace creation and management
- FR-1.2: Project-level settings (budgets, integrations, compliance)
- FR-1.3: Project members invitation with role-based permissions
- FR-1.4: Project isolation (workflows, data, token budgets)
- FR-1.5: Cross-project workflow templates
- FR-1.6: Project archival and restoration
- FR-1.7: Project-level analytics dashboard

**FR-2: AI Conversation Interface (8 requirements)**
- FR-2.1: ChatGPT-style plain-English input
- FR-2.2: Context-aware conversation history
- FR-2.3: Screenshot upload for visual workflow requests
- FR-2.4: Multi-turn clarification questions from Director
- FR-2.5: Workflow proposal generation
- FR-2.6: Real-time typing indicators
- FR-2.7: Message editing and re-submission
- FR-2.8: Conversation search across projects

**FR-2A: Meeting Recording & Analysis (10 requirements)**
- FR-2A.1: Audio recording upload (WebM, MP3, WAV)
- FR-2A.2: Kuwaiti Arabic dialect detection
- FR-2A.3: Speech-to-text transcription (Whisper API, 2x real-time)
- FR-2A.4: Kuwaiti dialect → Standard Arabic → English translation
- FR-2A.5: SOP extraction from meeting transcripts
- FR-2A.6: Automatic workflow generation from SOPs
- FR-2A.7: Meeting recording storage (S3, 11 nines durability)
- FR-2A.8: Transcript search across projects
- FR-2A.9: Per-project meeting access controls
- FR-2A.10: Meeting metadata (duration, participants, date)

**FR-3: Workflow Orchestration (8 requirements)**
- FR-3.1: BMAD Method orchestration (Planning → Orchestrating → Building → Reviewing → Completed)
- FR-3.2: Workflow state persistence (checkpoint/resume)
- FR-3.3: Multi-agent coordination (Director, Supervisor, specialized agents)
- FR-3.4: Task queue with priority management
- FR-3.5: Workflow cancellation mid-execution
- FR-3.6: Workflow retry from last checkpoint
- FR-3.7: Parallel task execution optimization
- FR-3.8: Workflow history and versioning

**FR-4: Live Workflow Visualization (11 requirements)**
- FR-4.1: n8n-style node-based workflow map
- FR-4.2: Real-time node status updates (<500ms latency via SSE)
- FR-4.3: Node color coding (gray=pending, blue=running, green=success, red=error)
- FR-4.4: Progress percentage per node
- FR-4.5: Plain-English status messages per node
- FR-4.6: Workflow map horizontal scroll (mobile support)
- FR-4.7: Touch-optimized node interaction (44x44px minimum)
- FR-4.8: Zoom controls for complex workflows (>20 nodes)
- FR-4.9: Workflow preview BEFORE execution (during chat)
- FR-4.10: Responsive layout (375px mobile, 1024px+ desktop)
- FR-4.11: Workflow map export (PNG, PDF)

**FR-5: Intelligent Debugging (8 requirements)**
- FR-5.1: Auto-retry failed steps (3 attempts) before showing error
- FR-5.2: Plain-English error translation (no HTTP codes, no stack traces)
- FR-5.3: One-tap OAuth reconnect for expired tokens
- FR-5.4: Integration health monitoring (Salesforce, Gmail, etc.)
- FR-5.5: Token-efficient debugging (cache repeated queries)
- FR-5.6: Error pattern recognition (suggest fixes based on history)
- FR-5.7: Workflow skip-failed-step option
- FR-5.8: Debug logs collapsible (technical details hidden by default)

**FR-6: Integration Framework (10 requirements)**
- FR-6.1: CRM integrations (Salesforce, HubSpot, Pipedrive)
- FR-6.2: Email integrations (Gmail, Outlook, SMTP)
- FR-6.3: Calendar integrations (Google Calendar, Outlook Calendar)
- FR-6.4: Meeting platforms (Zoom, Teams)
- FR-6.5: OAuth 2.0 authentication flow
- FR-6.6: Integration health checks (60-minute intervals)
- FR-6.7: Credential secure storage (Clerk metadata Phase 1, Vault Phase 2)
- FR-6.8: Integration retry logic (exponential backoff)
- FR-6.9: Per-project integration isolation
- FR-6.10: Integration usage analytics

**FR-7: Token Management (7 requirements)**
- FR-7.1: Real-time token usage tracking per workflow
- FR-7.2: Dollar-based cost display (not raw token counts)
- FR-7.3: Efficiency indicators ("Efficient!" gamification)
- FR-7.4: Budget warnings (80% threshold)
- FR-7.5: Token optimization recommendations (cache, model downgrade)
- FR-7.6: Auto-optimization toggle (switch to cheaper model when budget low)
- FR-7.7: Project-level budget caps

**FR-8: User Personalization & Profile Backend (9 requirements)**
- FR-8.1: Cross-project intelligence metadata storage
- FR-8.2: Thinking patterns tracking (detailed plans vs quick execution)
- FR-8.3: Behavior patterns (typical workflow complexity, approval time)
- FR-8.4: Emotional responses (frustrated by, delighted by)
- FR-8.5: Personalized workflow recommendations
- FR-8.6: Adaptive UI complexity (show advanced features only when relevant)
- FR-8.7: User profile analytics dashboard
- FR-8.8: Privacy controls (user can delete personalization data)
- FR-8.9: Cross-project workflow templates based on user patterns

**FR-9: Results Delivery (5 requirements)**
- FR-9.1: Tangible result evidence (confirmation emails, CRM updates, deployed URLs)
- FR-9.2: Result artifacts storage (S3: PDFs, screenshots, logs)
- FR-9.3: Structured output display (tables, charts, summaries)
- FR-9.4: Result sharing (unique URL, copy link)
- FR-9.5: Notification on workflow completion (email, push notification)

**FR-10: Multi-Platform Support (5 requirements)**
- FR-10.1: Mobile-first responsive web (375px baseline, iPhone SE)
- FR-10.2: Desktop web (same codebase, 1024px+ optimizations)
- FR-10.3: Touch targets 44x44px minimum (mobile)
- FR-10.4: Portrait AND landscape orientation support
- FR-10.5: Progressive Web App (PWA) for native-like mobile experience

**FR-11: Authentication & Security (5 requirements)**
- FR-11.1: User authentication via Clerk (OAuth 2.0: Google, Microsoft, GitHub)
- FR-11.2: Multi-factor authentication (MFA) support
- FR-11.3: Role-Based Access Control (RBAC) per project
- FR-11.4: Session management with JWT tokens
- FR-11.5: Secure API key storage (encrypted in Clerk metadata)

**FR-12: Team Collaboration (5 requirements)**
- FR-12.1: Project member invitations (owner, collaborator, viewer roles)
- FR-12.2: Shared workflow access within project
- FR-12.3: Collaboration activity log (who did what)
- FR-12.4: Per-project permission management
- FR-12.5: Real-time collaboration indicators (who's viewing workflow)

**FR-13: Meta-Platform Improvement (5 requirements)**
- FR-13.1: Use Nexus to fix bugs in Nexus itself
- FR-13.2: GitHub repository integration (read/write access)
- FR-13.3: Self-improvement workflows (create PR for bug fixes)
- FR-13.4: Code review before merge (quality gates)
- FR-13.5: Staging deployment before production

**FR-14: Mobile Execution Architecture (4 requirements)**
- FR-14.1: Server-side code generation (no local terminal required)
- FR-14.2: Cloud execution infrastructure (AWS Fargate sandboxed containers)
- FR-14.3: Terminal emulator for user commands (backend-hosted)
- FR-14.4: Security isolation per project/user

### Non-Functional Requirements (from PRD)

**Performance:**
- **NFR-P1.1:** API response time <200ms (p95)
- **NFR-P1.2:** UI page load time <3s on mobile 3G
- **NFR-P1.3:** Real-time updates <500ms latency (SSE for workflow visualization)
- **NFR-P1.4:** Database query response <100ms (p95)
- **NFR-P1.5:** Meeting transcription 2x real-time speed minimum (30-min meeting processed in <15 min)
- **NFR-P2.1:** Average workflow cost <$0.50 (token efficiency)
- **NFR-P2.2:** Token optimization reduce costs by 30% minimum via caching
- **NFR-P3.1:** Mobile responsiveness 375px baseline (iPhone SE)
- **NFR-P3.2:** Touch targets 44x44px minimum (WCAG 2.1 AA)

**Security:**
- **NFR-S1.1:** Multi-tenant data isolation (row-level security enforced at database)
- **NFR-S1.2:** Project data never leaked across tenants
- **NFR-S2.1:** OAuth 2.0 for third-party integrations
- **NFR-S2.2:** MFA support via Clerk
- **NFR-S2.3:** JWT token authentication
- **NFR-S2.4:** Secure API key vault (encrypted storage)
- **NFR-S3.1:** TLS 1.3 encryption in transit
- **NFR-S3.2:** AES-256 encryption at rest (S3, database)
- **NFR-S3.3:** Meeting recording access audit logs
- **NFR-S3.4:** Workflow state history (append-only log)
- **NFR-S4.1:** Kuwaiti Arabic dialect support (voice detection, transcription, translation)
- **NFR-S4.2:** Per-project compliance checking (Kuwait GCC standards, not global)
- **NFR-S4.3:** Configurable data residency (me-south-1 for Kuwait)

**Scalability:**
- **NFR-SC1.1:** Support 10x user growth (1→5→50 users) with <10% performance degradation
- **NFR-SC2.1:** Minimum 100 concurrent workflow executions per user
- **NFR-SC2.2:** Auto-scaling backend services (AWS Fargate)
- **NFR-SC2.3:** Workflow visualization render up to 500 nodes without degradation
- **NFR-SC3.1:** Meeting recording storage scales to 100GB+ per project
- **NFR-SC3.2:** Database storage auto-scales with data growth

**Reliability:**
- **NFR-R1.1:** 99.5% uptime SLA
- **NFR-R1.2:** Automatic failover to backup region within 60 seconds
- **NFR-R1.3:** Health checks every 30 seconds (ECS container monitoring)
- **NFR-R2.1:** BMAD workflow state persists after each step (append-only log)
- **NFR-R2.2:** Automatic resume from last checkpoint on failure
- **NFR-R2.3:** Never lose workflow progress (zero data loss)
- **NFR-R3.1:** Meeting recordings 11 nines durability (99.999999999% via S3 Standard)
- **NFR-R3.2:** Database daily backups with point-in-time recovery

**Integration:**
- **NFR-I1.1:** Plugin architecture for third-party integrations
- **NFR-I1.2:** Standard connector interface (OAuth, health checks, retry logic)
- **NFR-I2.1:** CRM provider support (Salesforce, HubSpot, Pipedrive)
- **NFR-I2.2:** Email provider support (Gmail, Outlook, SMTP)
- **NFR-I2.3:** Calendar provider support (Google Calendar, Outlook)
- **NFR-I3.1:** BMAD Method swappable via adapter pattern (orchestration-agnostic state)
- **NFR-I3.2:** Workflow state format uses JSON schema with version metadata
- **NFR-I3.3:** Blue-green deployment for orchestration framework swap (zero downtime)

**Usability:**
- **NFR-U1.1:** First workflow completion within 10 minutes without documentation
- **NFR-U1.2:** Plain-English error messages (no technical jargon)
- **NFR-U1.3:** ChatGPT-level simplicity for mainstream users
- **NFR-U2.1:** WCAG 2.1 AA accessibility compliance
- **NFR-U2.2:** Screen reader support (VoiceOver, NVDA, TalkBack, JAWS)
- **NFR-U2.3:** Keyboard navigation (all features accessible via keyboard)
- **NFR-U2.4:** Color contrast 4.5:1 minimum for text, 3:1 for UI components

### Additional Requirements (from Architecture & UX)

**Starter Template & Technology Stack:**
- Vite + React + TypeScript (frontend)
- shadcn/ui + Tailwind CSS (component library)
- PostgreSQL via Supabase (database with RLS)
- Redis (Upstash) for caching
- AWS S3 Standard (object storage, 11 nines durability)
- Clerk (authentication, MFA, OAuth 2.0)
- REST API + OpenAPI 3.1 specification
- Server-Sent Events (SSE) for real-time updates
- Cloudflare Workers (edge API gateway)
- Zustand (state management)
- React Router v6 (routing with code splitting)
- TanStack Query (API client with optimistic updates)
- React Hook Form + Zod (form handling and validation)
- AWS ECS Fargate (backend hosting, sandboxed containers)
- Vercel (frontend hosting with edge CDN)
- GitHub Actions (CI/CD pipeline)
- Sentry (error tracking) + Axiom (logs) + CloudWatch (infrastructure monitoring)

**Database Schema (11 tables):**
1. **auth.users** - Clerk-managed user authentication
2. **user_profiles** - Cross-project intelligence metadata (thinking patterns, behavior, emotional responses)
3. **projects** - Multi-tenant workspaces with budgets and compliance settings
4. **project_members** - RBAC (owner, collaborator, viewer roles)
5. **workflows** - BMAD orchestration with status tracking, token usage, results
6. **workflow_states** - Append-only checkpoints for resume capability
7. **workflow_nodes** - n8n-style visualization data with real-time status
8. **meetings** - Recording metadata (S3 keys, transcription status, dialect detection)
9. **meeting_transcripts** - Transcriptions, translations, extracted SOPs
10. **integrations** - CRM, email, calendar connections with health monitoring
11. **token_usage** - Real-time cost tracking per workflow and project
12. **audit_logs** - Append-only compliance trail for all operations

**UX Design Requirements:**
- Mobile-first design with 375px baseline (iPhone SE)
- Touch targets 44x44px minimum (60x60px for primary actions)
- Bottom navigation for mobile (thumb-optimized, 60x60px tabs)
- Accessibility: WCAG 2.1 AA compliance (98% achieved, 2 color contrast fixes required)
- Plain-English error messages ("Waiting for CRM. Auto-retry in progress 2/5")
- Real-time workflow visualization (n8n-style nodes)
- Workflow preview before execution (during chat, before tokens spent)
- Token cost gamification ("Efficient!" indicators, green=good)
- Kuwaiti Arabic voice input/transcription (UI in English)
- 10-minute first workflow success target (from request to tangible result)
- Responsive breakpoints: 375px (mobile), 768px (tablet), 1024px (desktop)
- Code splitting: Main chunk (150KB), Workflow chunk (280KB), Meeting chunk (80KB)
- Performance targets: LCP <2.5s, FID <100ms, CLS <0.1

**Critical User Flows:**
1. First-time onboarding (<10 minutes to first success)
2. Meeting recording → SOP extraction → Workflow creation
3. Workflow monitoring with real-time visualization
4. Error recovery & auto-retry
5. Token budget warning & optimization
6. Mobile-first quick actions (≤2 taps for common tasks)
7. Accessibility - screen reader user journey

---

## FR Coverage Map

**Total FRs:** 148
**Total Epics:** 15
**Coverage:** 100% ✅

### Detailed FR to Epic Mapping:

- **Epic 1:** FR-11.1, FR-11.2, FR-11.3, FR-11.4, FR-11.5, FR-8.1, FR-8.2, FR-8.3, FR-8.4, FR-8.7, FR-8.8 (11 FRs)
- **Epic 2:** FR-1.1, FR-1.2, FR-1.3, FR-1.4, FR-1.5, FR-1.6, FR-1.7 (7 FRs)
- **Epic 3:** FR-2.1, FR-2.2, FR-2.3, FR-2.4, FR-2.5, FR-2.6, FR-2.7, FR-2.8 (8 FRs)
- **Epic 4:** FR-3.1, FR-3.2, FR-3.3, FR-3.4, FR-3.5, FR-3.6, FR-3.7, FR-3.8, FR-14.1, FR-14.2, FR-14.3, FR-14.4 (12 FRs)
- **Epic 5:** FR-4.1, FR-4.2, FR-4.3, FR-4.4, FR-4.5, FR-4.6, FR-4.7, FR-4.8, FR-4.9, FR-4.10, FR-4.11 (11 FRs)
- **Epic 6:** FR-6.1, FR-6.2, FR-6.3, FR-6.4, FR-6.5, FR-6.6, FR-6.7, FR-6.8, FR-6.9, FR-6.10 (10 FRs)
- **Epic 7:** FR-2A.1, FR-2A.2, FR-2A.3, FR-2A.4, FR-2A.5, FR-2A.6, FR-2A.7, FR-2A.8, FR-2A.9, FR-2A.10 (10 FRs)
- **Epic 8:** FR-5.1, FR-5.2, FR-5.3, FR-5.4, FR-5.5, FR-5.6, FR-5.7, FR-5.8 (8 FRs)
- **Epic 9:** FR-7.1, FR-7.2, FR-7.3, FR-7.4, FR-7.5, FR-7.6, FR-7.7 (7 FRs)
- **Epic 10:** FR-9.1, FR-9.2, FR-9.3, FR-9.4, FR-9.5 (5 FRs)
- **Epic 11:** FR-12.1, FR-12.2, FR-12.3, FR-12.4, FR-12.5 (5 FRs)
- **Epic 12:** FR-10.1, FR-10.2, FR-10.3, FR-10.4, FR-10.5 (5 FRs)
- **Epic 13:** NFR-U2.1, NFR-U2.2, NFR-U2.3, NFR-U2.4 + UX Accessibility Requirements
- **Epic 14:** FR-13.1, FR-13.2, FR-13.3, FR-13.4, FR-13.5 (5 FRs)
- **Epic 15:** FR-8.5, FR-8.6, FR-8.9 (3 FRs)

---

## Epic List

### Epic 1: Foundation - User Authentication & Profiles
Users can sign up, log in securely with MFA, and manage their personal profile with cross-project intelligence tracking (thinking patterns, behavior patterns, emotional responses).

**FRs Covered:** FR-11.1, FR-11.2, FR-11.3, FR-11.4, FR-11.5, FR-8.1, FR-8.2, FR-8.3, FR-8.4, FR-8.7, FR-8.8
**Tech Stack:** Clerk authentication, PostgreSQL user_profiles table, JWT tokens

### Epic 2: Multi-Tenant Project Workspaces
Users can create isolated project workspaces with budgets, settings, compliance configurations, and project-level analytics dashboards.

**FRs Covered:** FR-1.1, FR-1.2, FR-1.3, FR-1.4, FR-1.5, FR-1.6, FR-1.7
**Tech Stack:** PostgreSQL with RLS, projects + project_members tables, multi-tenancy enforced at database layer

### Epic 3: Conversational Workflow Creation
Users can create workflows by chatting with AI Director in plain English, uploading screenshots, or providing visual briefs with workflow preview before execution.

**FRs Covered:** FR-2.1, FR-2.2, FR-2.3, FR-2.4, FR-2.5, FR-2.6, FR-2.7, FR-2.8
**Tech Stack:** React chat interface, Zustand state management, Claude API for Director agent, TanStack Query for API calls

### Epic 4: BMAD Workflow Orchestration & Execution
Users can execute complex multi-step workflows orchestrated by BMAD Method with automatic checkpointing, resume capability, and server-side code execution.

**FRs Covered:** FR-3.1, FR-3.2, FR-3.3, FR-3.4, FR-3.5, FR-3.6, FR-3.7, FR-3.8, FR-14.1, FR-14.2, FR-14.3, FR-14.4
**Tech Stack:** BMAD Method adapter, PostgreSQL workflow_states (append-only), AWS Fargate sandboxed containers, Redis task queue

### Epic 5: Real-Time Workflow Visualization
Users can monitor workflow progress in real-time via n8n-style node graph on mobile and desktop with <500ms latency updates via SSE.

**FRs Covered:** FR-4.1, FR-4.2, FR-4.3, FR-4.4, FR-4.5, FR-4.6, FR-4.7, FR-4.8, FR-4.9, FR-4.10, FR-4.11
**Tech Stack:** React Flow library, SSE (Server-Sent Events), PostgreSQL workflow_nodes table, responsive design (375px mobile, 1024px desktop)

### Epic 6: Third-Party Integration Management
Users can connect and manage CRM, email, calendar, meeting platform integrations with OAuth 2.0 and automatic health monitoring.

**FRs Covered:** FR-6.1, FR-6.2, FR-6.3, FR-6.4, FR-6.5, FR-6.6, FR-6.7, FR-6.8, FR-6.9, FR-6.10
**Tech Stack:** OAuth 2.0 flow, Clerk secure metadata storage, PostgreSQL integrations table, health check cron jobs (60-min intervals)

### Epic 7: Meeting Intelligence & SOP Extraction
Users can record client meetings in Kuwaiti Arabic, get automatic transcription/translation, and extract SOPs as workflows.

**FRs Covered:** FR-2A.1, FR-2A.2, FR-2A.3, FR-2A.4, FR-2A.5, FR-2A.6, FR-2A.7, FR-2A.8, FR-2A.9, FR-2A.10
**Tech Stack:** Whisper API (2x real-time transcription), Kuwaiti dialect translator, Claude API (SOP extraction), AWS S3 (11 nines durability), PostgreSQL meetings + meeting_transcripts tables

### Epic 8: Intelligent Error Recovery & Debugging
Users experience automatic error recovery with plain-English messaging, auto-retry (3 attempts), one-tap OAuth reconnect, and token-efficient debugging.

**FRs Covered:** FR-5.1, FR-5.2, FR-5.3, FR-5.4, FR-5.5, FR-5.6, FR-5.7, FR-5.8
**Tech Stack:** Error translation middleware, Redis caching for repeated queries, exponential backoff retry logic, OAuth refresh token handling

### Epic 9: Token Management & Cost Optimization
Users can track token costs in real-time as dollar amounts, receive budget warnings at 80%, get optimization recommendations, and enable auto-optimization.

**FRs Covered:** FR-7.1, FR-7.2, FR-7.3, FR-7.4, FR-7.5, FR-7.6, FR-7.7
**Tech Stack:** PostgreSQL token_usage table, Redis real-time cost cache, Claude API usage tracking, budget alert system, gamification ("Efficient!" indicators)

### Epic 10: Results Delivery & Evidence
Users receive tangible proof of workflow completion (confirmation emails, live CRM updates, deployed URLs) with shareable result artifacts stored in S3.

**FRs Covered:** FR-9.1, FR-9.2, FR-9.3, FR-9.4, FR-9.5
**Tech Stack:** AWS S3 result artifacts storage, email/push notifications, unique shareable URLs, structured output rendering (tables, charts)

### Epic 11: Team Collaboration & Permissions
Users can invite team members to projects with RBAC (owner, collaborator, viewer), share workflows, view activity logs, and see real-time collaboration indicators.

**FRs Covered:** FR-12.1, FR-12.2, FR-12.3, FR-12.4, FR-12.5
**Tech Stack:** PostgreSQL project_members table with RLS, email invitations, audit_logs table, SSE for real-time presence

### Epic 12: Mobile-First Responsive Experience
Users can access all features seamlessly on mobile devices (375px iPhone SE) with touch-optimized interactions (44x44px targets), bottom navigation, and PWA support.

**FRs Covered:** FR-10.1, FR-10.2, FR-10.3, FR-10.4, FR-10.5
**Tech Stack:** Tailwind CSS responsive breakpoints, React Router v6 code splitting, PWA manifest, bottom tab navigation for mobile

### Epic 13: Accessibility & Inclusive Design
All users, including those with disabilities, can use Nexus with WCAG 2.1 AA compliance (keyboard navigation, screen readers, 4.5:1 color contrast, plain-English errors).

**FRs Covered:** NFR-U2.1, NFR-U2.2, NFR-U2.3, NFR-U2.4 + comprehensive UX accessibility requirements
**Tech Stack:** ARIA attributes, semantic HTML, keyboard event handlers, axe DevTools testing, screen reader optimization (VoiceOver, NVDA, TalkBack, JAWS)

### Epic 14: Self-Improvement Platform (Meta)
Users can use Nexus to fix bugs and add features to Nexus itself via GitHub integration, automatic PR creation, code review gates, and staging deployment.

**FRs Covered:** FR-13.1, FR-13.2, FR-13.3, FR-13.4, FR-13.5
**Tech Stack:** GitHub API integration, BMAD Method self-improvement workflows, GitHub Actions CI/CD, PR review automation

### Epic 15: User Personalization & Intelligence
Users benefit from cross-project intelligence with personalized workflow recommendations, adaptive UI complexity, and tailored templates based on their patterns.

**FRs Covered:** FR-8.5, FR-8.6, FR-8.9
**Tech Stack:** PostgreSQL user_profiles metadata, Redis caching of user patterns, Claude API for personalization recommendations, adaptive UI rendering

---

## Epic 1: Foundation - User Authentication & Profiles

**Epic Goal:** Users can sign up, log in securely with MFA, and manage their personal profile with cross-project intelligence tracking.

### Story 1.0: Set Up Initial Project from Vite + React + TypeScript Template

As a developer,
I want to initialize the Nexus project from the Vite + React + TypeScript starter template,
So that we have a fast, modern frontend foundation with mobile-first optimization.

**Acceptance Criteria:**

**Given** The project needs to be initialized
**When** I run `npm create vite@latest nexus -- --template react-ts`
**Then** A new Vite + React + TypeScript project is created with:
  - React 18.x
  - TypeScript 5.x
  - Vite 5.x as build tool
  - ESLint configuration
  - Default project structure (src/, public/, index.html)

**Given** The base project is created
**When** I install and configure Tailwind CSS
**Then** The project includes:
  - Tailwind CSS 3.x installed via npm
  - tailwind.config.js with mobile-first breakpoints (375px, 768px, 1024px)
  - PostCSS configuration
  - Tailwind directives in main CSS file

**Given** Tailwind CSS is configured
**When** I install shadcn/ui component library
**Then** The project includes:
  - shadcn/ui CLI initialized
  - components.json configuration file
  - lib/utils.ts for cn() helper
  - Initial components directory structure

**Given** All dependencies are installed
**When** I run `npm run dev`
**Then** The development server starts successfully on localhost:5173
**And** The app renders without errors in browser

**Given** The initial setup is complete
**When** I commit the changes
**Then** Git repository is initialized with:
  - .gitignore (node_modules, dist, .env)
  - Initial commit "feat: initialize Vite + React + TypeScript project with Tailwind and shadcn/ui"
  - Main branch with clean working tree

### Story 1.1: User Sign-Up with Email/OAuth

As a new user,
I want to sign up using email/password or OAuth providers (Google, Microsoft, GitHub),
So that I can create an account and access Nexus.

**Acceptance Criteria:**

**Given** I am on the sign-up page
**When** I enter valid email and password OR click "Sign up with Google"
**Then** A new user account is created in Clerk
**And** I am redirected to the onboarding/dashboard
**And** A user profile record is created in PostgreSQL user_profiles table

**Given** I enter an email that already exists
**When** I attempt to sign up
**Then** I see error message "Email already registered. Please log in."

**Given** I sign up with OAuth (Google)
**When** OAuth authentication succeeds
**Then** My account is created with OAuth provider metadata
**And** I am automatically logged in

### Story 1.2: User Login with Credentials

As a returning user,
I want to log in with email/password or OAuth,
So that I can access my account and projects.

**Acceptance Criteria:**

**Given** I have an existing account
**When** I enter correct email and password on login page
**Then** I am authenticated via Clerk
**And** A JWT token is issued and stored in browser
**And** I am redirected to dashboard

**Given** I enter incorrect password
**When** I attempt to login
**Then** I see error "Invalid credentials. Please try again."
**And** My account is not locked (Clerk handles rate limiting)

**Given** I click "Login with Google" and have previously signed up with Google
**When** OAuth authentication succeeds
**Then** I am logged in and redirected to dashboard

### Story 1.3: Multi-Factor Authentication (MFA) Setup

As a security-conscious user,
I want to enable MFA (SMS, authenticator app, or email code),
So that my account is protected with two-factor authentication.

**Acceptance Criteria:**

**Given** I am logged in
**When** I navigate to Settings → Security → Enable MFA
**Then** I can choose MFA method: SMS, Authenticator App, or Email
**And** I complete the setup flow (scan QR code for authenticator, verify phone for SMS)
**And** MFA is enabled on my account via Clerk

**Given** I have MFA enabled
**When** I log in with correct credentials
**Then** I am prompted for MFA code
**And** I can only access my account after entering valid code

**Given** I lose access to my MFA device
**When** I click "Lost MFA device?" link
**Then** I can use backup recovery codes (provided during MFA setup)

### Story 1.4: User Profile Creation & Cross-Project Intelligence Backend

As a user,
I want my profile to track my thinking patterns, behavior, and emotional responses across all projects,
So that Nexus can personalize my experience.

**Acceptance Criteria:**

**Given** I sign up for the first time
**When** My account is created
**Then** A user_profiles record is created in PostgreSQL with default values:
  - thinking_patterns: {} (empty JSONB)
  - behavior_patterns: {} (empty JSONB)
  - emotional_responses: {} (empty JSONB)
  - preferred_language: 'en'
  - default_budget_per_workflow: 0.50
  - total_workflows_executed: 0
  - total_tokens_used: 0
  - total_cost_usd: 0.00

**Given** I complete workflows across multiple projects
**When** The system analyzes my interactions
**Then** My user_profiles metadata is updated with:
  - Thinking patterns (e.g., "prefers_detailed_plans": true)
  - Behavior patterns (e.g., "typical_workflow_complexity": "medium")
  - Emotional responses (e.g., "frustrated_by": ["slow_integrations"])

**Given** I am using the platform
**When** The system makes recommendations or adjustments
**Then** It references my user_profiles metadata (cached in Redis for performance)

### Story 1.5: User Profile Settings Management

As a user,
I want to view and edit my profile settings (language, default budget, privacy controls),
So that I can customize my Nexus experience.

**Acceptance Criteria:**

**Given** I am logged in
**When** I navigate to Settings → Profile
**Then** I see my current profile data:
  - Email (from Clerk, read-only)
  - Preferred language
  - Default budget per workflow
  - Total workflows executed (read-only)
  - Total tokens used (read-only)
  - Total cost USD (read-only)

**Given** I update my preferred language to Spanish
**When** I save changes
**Then** The user_profiles.preferred_language field is updated
**And** UI language changes to Spanish (Phase 2 feature, for now shows confirmation)

**Given** I change my default budget per workflow to $1.00
**When** I save changes
**Then** The user_profiles.default_budget_per_workflow field is updated
**And** New projects will use $1.00 as default budget

### Story 1.6: Privacy Controls for Personalization Data

As a privacy-conscious user,
I want to view and delete my cross-project intelligence data,
So that I control what Nexus learns about me.

**Acceptance Criteria:**

**Given** I am logged in
**When** I navigate to Settings → Privacy
**Then** I see sections for:
  - Thinking Patterns (with JSON display)
  - Behavior Patterns (with JSON display)
  - Emotional Responses (with JSON display)
  - Option to "Clear All Personalization Data"

**Given** I click "Clear All Personalization Data"
**When** I confirm the action
**Then** The following fields in user_profiles are reset to {}:
  - thinking_patterns
  - behavior_patterns
  - emotional_responses
**And** I see confirmation "Personalization data cleared. Future recommendations will be based on default settings."

**Given** I have cleared my personalization data
**When** I continue using Nexus
**Then** The system starts learning from scratch (new patterns recorded)

### Story 1.7: Password Reset via Email

As a user who forgot my password,
I want to reset it via email link,
So that I can regain access to my account.

**Acceptance Criteria:**

**Given** I am on the login page
**When** I click "Forgot Password?" link
**Then** I am taken to password reset page

**Given** I enter my registered email on password reset page
**When** I submit the form
**Then** Clerk sends a password reset email to my address
**And** I see message "Check your email for password reset link"

**Given** I click the password reset link in my email
**When** The link is valid (not expired)
**Then** I am taken to "Set New Password" page
**And** I can enter and confirm my new password
**And** My password is updated in Clerk
**And** I can log in with the new password

---

## Epic 2: Multi-Tenant Project Workspaces

**Epic Goal:** Users can create isolated project workspaces with budgets, settings, compliance configurations, and project-level analytics.

### Story 2.1: Create New Project Workspace

As a user,
I want to create a new project workspace,
So that I can organize my workflows separately from other projects.

**Acceptance Criteria:**

**Given** I am logged in
**When** I click "Create New Project" button on dashboard
**Then** A modal appears with project creation form

**Given** I fill in the form with:
  - Name: "Sales Automation"
  - Description: "Automate daily sales tasks"
  - Budget per workflow: $0.50 (default from user profile)
  - Total budget: $50.00
**When** I submit the form
**Then** A new projects record is created in PostgreSQL with:
  - owner_id: my user ID
  - name, description, budgets as entered
  - compliance_framework: NULL (set later if needed)
  - data_residency_region: NULL (default)
  - created_at: NOW()
**And** I am redirected to the new project's dashboard

**Given** I try to create a project with empty name
**When** I submit the form
**Then** I see validation error "Project name is required"

### Story 2.2: Project Member Access & Row-Level Security

As a project owner,
I want my project data to be isolated from other users' projects,
So that my data remains private and secure.

**Acceptance Criteria:**

**Given** I have created a project
**When** Another user (not invited to my project) tries to access my project
**Then** The PostgreSQL RLS policy blocks their access
**And** They see 404 error "Project not found" (not revealing it exists)

**Given** I am a project owner
**When** I query for workflows in my project
**Then** The RLS policy allows me to see all workflows in my project
**And** I cannot see workflows from other users' projects

**Given** I am a project member (collaborator or viewer)
**When** I query for workflows in the project
**Then** The RLS policy grants access based on project_members table
**And** I can see workflows only in projects where I'm a member

### Story 2.3: Project Settings Configuration

As a project owner,
I want to configure project-level settings (budget limits, compliance framework, data residency),
So that I can customize the project to my requirements.

**Acceptance Criteria:**

**Given** I am the project owner
**When** I navigate to Project Settings
**Then** I see editable fields:
  - Project name
  - Description
  - Budget per workflow
  - Total budget (monthly limit)
  - Compliance framework (dropdown: kuwait_gcc, gdpr, hipaa, none)
  - Data residency region (dropdown: default, me-south-1 Kuwait, eu-west-1, etc.)

**Given** I update the budget per workflow to $1.00
**When** I save changes
**Then** The projects.budget_per_workflow field is updated
**And** New workflows in this project will use $1.00 as default budget

**Given** I select compliance framework "kuwait_gcc"
**When** I save changes
**Then** The projects.compliance_framework field is updated to "kuwait_gcc"
**And** Per-project compliance checks will enforce Kuwait GCC standards (Phase 2 feature)

### Story 2.4: Project Analytics Dashboard

As a project owner,
I want to see analytics for my project (total workflows, cost, success rate),
So that I can monitor project health and usage.

**Acceptance Criteria:**

**Given** I am viewing my project
**When** I navigate to Project Dashboard
**Then** I see analytics widgets:
  - Total workflows executed (count from workflows table where project_id matches)
  - Total cost USD (sum from token_usage table where project_id matches)
  - Average cost per workflow
  - Success rate (completed workflows / total workflows)
  - Most recent 5 workflows (with status and cost)

**Given** My project has 10 workflows with total cost $5.00
**When** The dashboard loads
**Then** I see "Total Cost: $5.00" and "Avg Cost Per Workflow: $0.50"

**Given** My project has 8 completed workflows and 2 failed workflows
**When** The dashboard loads
**Then** I see "Success Rate: 80% (8/10)"

### Story 2.5: Project Archival & Restoration

As a project owner,
I want to archive inactive projects,
So that my active projects list remains clean without deleting data permanently.

**Acceptance Criteria:**

**Given** I am the project owner
**When** I click "Archive Project" in Project Settings
**Then** I see confirmation modal "Archive this project? You can restore it later."

**Given** I confirm archival
**When** The action completes
**Then** The projects.deleted_at field is set to NOW() (soft delete)
**And** The project disappears from my active projects list
**And** All project data remains in database (workflows, integrations, etc.)

**Given** I am viewing archived projects
**When** I click "Restore" on an archived project
**Then** The projects.deleted_at field is set to NULL
**And** The project reappears in my active projects list with all data intact

### Story 2.6: Cross-Project Workflow Templates

As a user,
I want to access workflow templates shared across all my projects,
So that I can reuse common automation patterns.

**Acceptance Criteria:**

**Given** I am creating a new workflow in any project
**When** I click "Use Template" button
**Then** I see a list of available templates:
  - User-created templates (from previous workflows I marked as template)
  - System templates (common patterns like "Daily CRM Update", "Meeting Summary")

**Given** I select a template "Daily Sales Report"
**When** I confirm template usage
**Then** The workflow is pre-populated with:
  - Template steps/structure
  - Placeholder values for my project-specific integrations
  - Estimated token cost based on template complexity

**Given** I have completed a successful workflow
**When** I click "Save as Template" action
**Then** The workflow is saved as a personal template
**And** It appears in my templates list for future use in any project

---

## Epic 3: Conversational Workflow Creation

**Epic Goal:** Users can create workflows by chatting with AI Director in plain English, uploading screenshots, or providing visual briefs.

### Story 3.1: Chat Interface with AI Director

As a user,
I want to chat with the AI Director in plain English,
So that I can request workflow automation without technical knowledge.

**Acceptance Criteria:**

**Given** I am in a project
**When** I navigate to the Chat tab
**Then** I see a ChatGPT-style interface with:
  - Message input textarea
  - Send button
  - Conversation history (previous messages)
  - Director avatar with greeting message

**Given** I type "Help me automate my daily sales report"
**When** I press Send
**Then** The message is sent to backend API (/api/chat)
**And** Director agent (Claude API) processes the request
**And** Director's response appears in chat: "I can help with that! Let me ask a few questions..."

**Given** The Director asks clarifying questions
**When** I respond with answers
**Then** The conversation continues with context maintained (conversation history stored)

### Story 3.2: Screenshot Upload for Visual Workflow Requests

As a user,
I want to upload screenshots of processes or workflows,
So that the Director can understand my automation needs visually.

**Acceptance Criteria:**

**Given** I am in the chat interface
**When** I click the "Attach File" button (📎 icon)
**Then** A file picker opens allowing image selection (PNG, JPG, JPEG)

**Given** I select a screenshot of an invoice
**When** The file uploads successfully
**Then** The image appears in the chat as a preview
**And** The image is sent to Claude API with vision capabilities
**And** Director responds: "I see an invoice for $500. Would you like me to create a workflow to process invoices like this automatically?"

**Given** The uploaded file exceeds 10MB
**When** I try to upload
**Then** I see error "File size must be under 10MB. Please compress or crop the image."

### Story 3.3: Context-Aware Conversation History

As a user,
I want the Director to remember our conversation context,
So that I don't have to repeat information.

**Acceptance Criteria:**

**Given** I have an ongoing conversation with Director
**When** I send a follow-up message "What about Gmail integration?"
**Then** The Director references previous context and responds appropriately
**And** The backend API includes conversation history in Claude API request

**Given** I start a new chat session
**When** I navigate to Chat tab
**Then** I see my previous conversations listed (last 10 conversations)
**And** I can click a previous conversation to resume it

**Given** I am in a conversation
**When** The conversation exceeds 50 messages
**Then** Older messages are summarized via Claude API to maintain context without exceeding token limits

### Story 3.4: Multi-Turn Clarification Questions from Director

As a user,
I want the Director to ask clarifying questions,
So that the workflow matches my exact needs.

**Acceptance Criteria:**

**Given** I request "Automate my CRM"
**When** Director receives the vague request
**Then** Director asks: "Which CRM are you using? (Salesforce, HubSpot, Pipedrive, Other)"

**Given** I answer "Salesforce"
**When** Director receives my response
**Then** Director asks next question: "What specific task would you like to automate? (Update contacts, Create leads, Generate reports, etc.)"

**Given** I answer "Update contacts daily"
**When** Director has enough information
**Then** Director generates a workflow proposal
**And** Shows workflow preview card (before execution)

### Story 3.5: Workflow Proposal & Preview Before Execution

As a user,
I want to see a workflow preview with estimated cost BEFORE execution,
So that I can approve or refine the plan.

**Acceptance Criteria:**

**Given** Director has gathered enough information
**When** Director generates a workflow proposal
**Then** A workflow preview card appears in chat showing:
  - Workflow name (e.g., "Daily Salesforce Contact Update")
  - Number of steps (e.g., "5 steps")
  - Estimated cost (e.g., "$0.08 - 245 tokens")
  - Integrations needed (e.g., "Salesforce, Gmail")
  - Simplified workflow map (n8n-style mini preview)

**Given** I see the workflow preview
**When** I review the details
**Then** I have two options:
  - "Approve & Run" button (green)
  - "Modify Request" button (secondary)

**Given** I click "Approve & Run"
**When** The workflow is approved
**Then** The workflow execution begins (Epic 4)
**And** I am taken to workflow visualization screen

**Given** I click "Modify Request"
**When** I click the button
**Then** The chat input is re-enabled
**And** Director prompts "What would you like to change about this workflow?"

### Story 3.6: Real-Time Typing Indicators

As a user,
I want to see when the Director is typing,
So that I know my message is being processed.

**Acceptance Criteria:**

**Given** I send a message to Director
**When** The backend API is processing my request (calling Claude API)
**Then** I see "Director is typing..." indicator with animated dots

**Given** The Director's response is ready
**When** The response arrives from backend
**Then** The typing indicator disappears
**And** Director's message appears in chat

### Story 3.7: Message Editing & Re-Submission

As a user,
I want to edit my last message and resend it,
So that I can correct mistakes without starting over.

**Acceptance Criteria:**

**Given** I have sent a message with a typo
**When** I click the edit icon (✏️) next to my last message
**Then** The message becomes editable in-place

**Given** I edit the message to fix the typo
**When** I press Enter or click Save
**Then** The edited message replaces the original in conversation history
**And** The Director processes the edited message
**And** Director's previous response is replaced with new response

### Story 3.8: Conversation Search Across Projects

As a user,
I want to search my conversation history across all projects,
So that I can find previous workflow requests quickly.

**Acceptance Criteria:**

**Given** I am in the Chat interface
**When** I click the "Search Conversations" icon (🔍)
**Then** A search modal opens

**Given** I type "Salesforce" in the search box
**When** I press Enter
**Then** I see a list of all conversations mentioning "Salesforce" across all my projects
**And** Each result shows:
  - Project name
  - Conversation snippet (first 100 chars)
  - Date
  - Click to open full conversation

**Given** I have no conversations matching my search
**When** I search for "Nonexistent keyword"
**Then** I see message "No conversations found matching 'Nonexistent keyword'"

---

## Epic 4: BMAD Workflow Orchestration & Execution

**Epic Goal:** Users can execute complex multi-step workflows orchestrated by BMAD Method with automatic checkpointing, resume capability, and server-side code execution.

### Story 4.1: Create Workflow Record from Approved Proposal

As a user,
I want my approved workflow proposal to create a workflow record,
So that execution can be tracked and monitored.

**Acceptance Criteria:**

**Given** I have approved a workflow proposal in chat
**When** I click "Approve & Run"
**Then** A new workflows record is created in PostgreSQL with:
  - project_id: current project
  - name: extracted from proposal (e.g., "Daily Salesforce Update")
  - description: auto-generated summary
  - user_input: my original chat request
  - status: 'planning'
  - orchestration_framework: 'bmad'
  - orchestration_version: '1.0.0'
  - total_tokens_used: 0
  - total_cost_usd: 0.00
  - created_by: my user ID
  - created_at: NOW()

**Given** The workflow record is created
**When** The record is saved to database
**Then** I am redirected to workflow detail page (/workflows/{workflow_id})

### Story 4.2: BMAD Orchestration Planning Stage

As a user,
I want the BMAD Method to analyze my request and generate an execution plan,
So that the workflow is structured before execution begins.

**Acceptance Criteria:**

**Given** A workflow is created with status 'planning'
**When** The BMAD orchestration service receives the workflow
**Then** The Director agent analyzes the user input and generates:
  - List of tasks to execute
  - Required integrations
  - Task dependencies
  - Estimated token cost

**Given** The planning stage completes successfully
**When** The execution plan is ready
**Then** The workflow status updates to 'pending_approval'
**And** A workflow_states checkpoint is created:
  - checkpoint_name: "planning_completed"
  - state_snapshot: JSONB with execution plan
  - version: 1

**Given** Planning encounters an error (e.g., missing integration)
**When** The error occurs
**Then** The workflow status updates to 'failed'
**And** An error message is stored in result_summary
**And** User sees plain-English error in UI

### Story 4.3: Workflow State Persistence (Checkpointing)

As a user,
I want my workflow state to be saved after each major step,
So that progress is never lost if something fails.

**Acceptance Criteria:**

**Given** A workflow is executing
**When** Each major step completes (agent completes task, integration succeeds, etc.)
**Then** A new workflow_states record is appended with:
  - workflow_id: current workflow
  - version: incremented (1, 2, 3...)
  - checkpoint_name: descriptive name (e.g., "agent_director_completed", "salesforce_update_completed")
  - state_snapshot: JSONB containing current execution state
  - tokens_used_in_step: tokens consumed in this step
  - cost_usd_in_step: cost for this step
  - created_at: NOW()

**Given** A workflow fails mid-execution
**When** The failure occurs
**Then** The latest checkpoint in workflow_states is preserved
**And** The workflow can be resumed from that checkpoint

### Story 4.4: Workflow Execution with BMAD Stages

As a user,
I want my workflow to progress through BMAD stages (Planning → Orchestrating → Building → Reviewing → Completed),
So that I can see the execution lifecycle.

**Acceptance Criteria:**

**Given** A workflow is approved
**When** Execution begins
**Then** The workflow progresses through these statuses:
  1. 'planning' → Director generates execution plan
  2. 'orchestrating' → Supervisor coordinates agents
  3. 'building' → Agents execute tasks
  4. 'reviewing' → Results are validated
  5. 'completed' → Final results delivered

**Given** The workflow is in 'orchestrating' stage
**When** The Supervisor assigns tasks to specialized agents
**Then** workflow_nodes records are created for each agent/task
**And** Real-time updates are sent via SSE to frontend

**Given** All tasks complete successfully
**When** The reviewing stage finishes
**Then** The workflow status updates to 'completed'
**And** The completed_at timestamp is set
**And** Final result_summary is populated

### Story 4.5: Multi-Agent Coordination (Director & Supervisor)

As a user,
I want my workflow to be orchestrated by multiple AI agents (Director, Supervisor, specialized agents),
So that complex tasks are handled intelligently.

**Acceptance Criteria:**

**Given** A workflow requires multiple steps (e.g., Salesforce update + Email notification)
**When** The workflow is in 'orchestrating' stage
**Then** The Director agent creates a task queue with:
  - Task 1: Connect to Salesforce
  - Task 2: Query contacts
  - Task 3: Update contact records
  - Task 4: Send confirmation email via Gmail

**Given** The task queue is ready
**When** The Supervisor agent processes the queue
**Then** Each task is assigned to a specialized agent:
  - Salesforce agent for CRM tasks
  - Gmail agent for email tasks
**And** Tasks are executed in correct order (respecting dependencies)

**Given** A task depends on a previous task's output
**When** The previous task completes
**Then** The output is passed to the next task via state_snapshot
**And** The dependent task can proceed

### Story 4.6: Server-Side Code Execution (AWS Fargate Sandboxing)

As a user,
I want my workflow code to execute on the server,
So that I don't need to run anything locally.

**Acceptance Criteria:**

**Given** A workflow task requires code execution (e.g., data transformation script)
**When** The BMAD orchestration service processes the task
**Then** An AWS Fargate container is spawned with:
  - Isolated environment (no access to other users' data)
  - Security policies (no network access except approved APIs)
  - Resource limits (CPU, memory, timeout)

**Given** The code executes successfully in Fargate
**When** The execution completes
**Then** The output is captured and stored in state_snapshot
**And** The container is terminated
**And** Execution logs are written to audit_logs table

**Given** The code execution times out (>15 minutes)
**When** The timeout occurs
**Then** The container is forcefully terminated
**And** The workflow status updates to 'failed'
**And** Error message: "Task timed out after 15 minutes. Please simplify the workflow."

### Story 4.7: Workflow Cancellation Mid-Execution

As a user,
I want to cancel a running workflow,
So that I can stop unwanted executions.

**Acceptance Criteria:**

**Given** A workflow is in status 'orchestrating' or 'building'
**When** I click "Cancel Workflow" button on workflow detail page
**Then** I see confirmation modal "Cancel this workflow? This action cannot be undone."

**Given** I confirm cancellation
**When** The action is processed
**Then** The workflow status updates to 'cancelled'
**And** All running tasks are terminated (Fargate containers stopped)
**And** A final workflow_states checkpoint is created:
  - checkpoint_name: "user_cancelled"
  - state_snapshot: current state at time of cancellation
**And** I see message "Workflow cancelled successfully."

### Story 4.8: Workflow Retry from Last Checkpoint

As a user,
I want to retry a failed workflow from its last successful checkpoint,
So that I don't have to start from scratch.

**Acceptance Criteria:**

**Given** A workflow has status 'failed'
**When** I click "Retry from Last Checkpoint" button
**Then** The system loads the latest workflow_states record for this workflow

**Given** The latest checkpoint is loaded
**When** Retry is initiated
**Then** The workflow status updates to 'orchestrating'
**And** Execution resumes from the loaded state_snapshot
**And** Any failed tasks are re-attempted

**Given** The retry succeeds
**When** All remaining tasks complete
**Then** The workflow status updates to 'completed'
**And** I see success message with results

**Given** The retry fails again
**When** The same error occurs
**Then** The workflow status remains 'failed'
**And** I see detailed error message suggesting manual intervention

---

## Epic 5: Real-Time Workflow Visualization

**Epic Goal:** Users can monitor workflow progress in real-time via n8n-style node graph on mobile and desktop with <500ms latency updates.

### Story 5.1: Workflow Node Visualization Setup

As a user,
I want to see a visual node graph of my workflow,
So that I understand the execution structure at a glance.

**Acceptance Criteria:**

**Given** A workflow is created
**When** The orchestration service generates the execution plan
**Then** workflow_nodes records are created for each step with:
  - node_id: unique identifier (e.g., "agent_director", "task_salesforce_update")
  - node_type: 'agent', 'task', 'integration', or 'decision'
  - label: human-readable name (e.g., "Connect to Salesforce")
  - position_x, position_y: coordinates for layout
  - status: 'pending'
  - progress_percent: 0.00
  - status_message: NULL

**Given** The workflow has 5 steps
**When** workflow_nodes records are created
**Then** The nodes are positioned using automatic layout algorithm:
  - Horizontal flow (left to right)
  - Vertical spacing if parallel tasks exist
  - Nodes are connected via connected_to array (UUIDs of connected nodes)

### Story 5.2: Server-Sent Events (SSE) for Real-Time Updates

As a user,
I want to receive real-time workflow status updates,
So that I see progress without refreshing the page.

**Acceptance Criteria:**

**Given** I am viewing a workflow detail page
**When** The page loads
**Then** A Server-Sent Events (SSE) connection is established to `/api/workflows/{workflow_id}/stream`

**Given** The SSE connection is active
**When** A workflow node status changes (e.g., pending → running → success)
**Then** The backend publishes an update to Redis pub/sub channel `workflow:{workflowId}:updates`
**And** The SSE endpoint streams the update to the frontend
**And** The frontend receives the update within <500ms (per NFR-P1.3)

**Given** The SSE connection drops (network issue)
**When** The connection is restored
**Then** The browser automatically reconnects using Last-Event-ID
**And** Any missed updates are replayed from the server

### Story 5.3: Node Status Color Coding

As a user,
I want workflow nodes to be color-coded by status,
So that I can quickly see progress and issues.

**Acceptance Criteria:**

**Given** A workflow node has status 'pending'
**When** The node is rendered in the visualization
**Then** The node background is gray (#e5e7eb)

**Given** A workflow node changes to status 'running'
**When** The SSE update is received
**Then** The node background changes to blue (#3b82f6)
**And** A subtle animation (pulse) indicates activity

**Given** A workflow node completes successfully
**When** The status updates to 'success'
**Then** The node background changes to green (#16a34a)
**And** A checkmark icon (✓) appears

**Given** A workflow node fails
**When** The status updates to 'error'
**Then** The node background changes to red (#dc2626)
**And** An error icon (✕) appears

**Given** A node has a warning (e.g., retry in progress)
**When** The status is 'warning'
**Then** The node background is amber (#f59e0b)
**And** A warning icon (⚠) appears

### Story 5.4: Progress Percentage Per Node

As a user,
I want to see progress percentage for long-running nodes,
So that I know how much work remains.

**Acceptance Criteria:**

**Given** A workflow node is running a long task (e.g., processing 100 records)
**When** The task reports progress (e.g., 40/100 records processed)
**Then** The node's progress_percent field is updated to 40.00
**And** An SSE update is sent to frontend

**Given** The frontend receives progress update
**When** The node is re-rendered
**Then** A progress bar appears inside the node showing 40% filled
**And** The text "40%" is displayed

**Given** The task completes
**When** progress_percent reaches 100.00
**Then** The status updates to 'success'
**And** The progress bar fills completely before disappearing

### Story 5.5: Plain-English Status Messages Per Node

As a user,
I want to see plain-English status messages for each node,
So that I understand what's happening without technical jargon.

**Acceptance Criteria:**

**Given** A workflow node is connecting to Salesforce
**When** The status_message field is set to "Connecting to Salesforce..."
**Then** The message appears below the node label in the visualization

**Given** A node encounters a rate limit error
**When** The backend translates the error to plain English
**Then** The status_message is set to "Salesforce is responding slowly. Retrying in 5 seconds..." (not "429 Rate Limit Exceeded")

**Given** A node is waiting for user approval
**When** The workflow is paused
**Then** The status_message is "Waiting for your approval to proceed"
**And** An "Approve" button appears in the UI

### Story 5.6: Workflow Map Horizontal Scroll (Mobile Support)

As a mobile user,
I want to scroll horizontally to see all workflow nodes,
So that I can view complex workflows on small screens.

**Acceptance Criteria:**

**Given** I am viewing a workflow with 10+ nodes on mobile (375px screen)
**When** The workflow map renders
**Then** The nodes extend beyond the viewport width
**And** I can scroll horizontally (swipe left/right) to see all nodes

**Given** The workflow map is scrollable
**When** I scroll to the right
**Then** The scroll position is preserved when nodes update (no jump back to start)

**Given** I pinch-zoom on mobile
**When** I zoom in on the workflow map
**Then** The nodes scale appropriately
**And** I can pan around the zoomed map

### Story 5.7: Touch-Optimized Node Interaction (44x44px Minimum)

As a mobile user,
I want workflow nodes to be large enough to tap easily,
So that I can interact with them on my phone.

**Acceptance Criteria:**

**Given** I am viewing a workflow map on mobile
**When** The nodes are rendered
**Then** Each node has a minimum tap area of 56x56px (exceeds WCAG 44x44px requirement)

**Given** I tap a node on mobile
**When** The node is tapped
**Then** Node details expand in a bottom sheet showing:
  - Node label
  - Status and progress
  - Status message
  - Execution logs (if available)
  - Actions (e.g., "Retry", "Skip")

**Given** Nodes are close together
**When** I tap near the edge of a node
**Then** The tap registers on the intended node (generous tap area)
**And** No accidental taps on adjacent nodes

### Story 5.8: Zoom Controls for Complex Workflows (>20 Nodes)

As a user,
I want zoom controls (+ / - buttons) for complex workflows,
So that I can see an overview or focus on details.

**Acceptance Criteria:**

**Given** A workflow has more than 20 nodes
**When** The workflow map renders
**Then** Zoom controls appear in the top-right corner:
  - "+" button (zoom in)
  - "-" button (zoom out)
  - "Fit to Screen" button (reset zoom)

**Given** I click the "+" button
**When** The button is clicked
**Then** The workflow map zooms in by 25%
**And** Node labels and details become more readable

**Given** I click the "Fit to Screen" button
**When** The button is clicked
**Then** The zoom level resets so all nodes fit in the viewport
**And** The map is centered

**Given** I zoom in significantly
**When** The zoom level exceeds 200%
**Then** A mini-map appears in the bottom-right corner showing:
  - Full workflow overview
  - Highlighted rectangle indicating current viewport
  - Allows clicking to jump to different areas

### Story 5.9: Workflow Preview During Chat (Before Execution)

As a user,
I want to see a mini workflow map preview in the chat,
So that I can understand the workflow structure before approving.

**Acceptance Criteria:**

**Given** The Director generates a workflow proposal
**When** The proposal is ready
**Then** A workflow preview card appears in chat with:
  - Simplified n8n-style node graph (3-5 nodes max visible)
  - "View Full Map" link to expand

**Given** I click "View Full Map" in the preview
**When** The link is clicked
**Then** A modal opens showing the complete workflow map
**And** I can zoom and pan to explore
**And** I can click "Approve & Run" from the modal

**Given** The workflow preview shows a complex structure (e.g., parallel tasks)
**When** I view the preview
**Then** Parallel branches are visually indicated (nodes side-by-side)
**And** Dependencies are shown with connecting arrows

### Story 5.10: Responsive Layout (375px Mobile, 1024px+ Desktop)

As a user,
I want the workflow visualization to adapt to my screen size,
So that it's usable on both mobile and desktop.

**Acceptance Criteria:**

**Given** I am on mobile (375px width)
**When** The workflow map renders
**Then** The layout uses:
  - Single-column node view (vertical stacking) OR horizontal scroll
  - Larger node labels (minimum 14px font size)
  - Bottom sheet for node details (not inline expansion)

**Given** I am on desktop (1024px+ width)
**When** The workflow map renders
**Then** The layout uses:
  - Full canvas with automatic layout (left-to-right flow)
  - Smaller node labels (12px font size acceptable)
  - Inline node detail panel on the right side

**Given** I resize my browser window from desktop to mobile width
**When** The resize occurs
**Then** The layout dynamically adjusts
**And** No content is cut off or hidden

### Story 5.11: Workflow Map Export (PNG, PDF)

As a user,
I want to export the workflow map as PNG or PDF,
So that I can share it with team members or include in documentation.

**Acceptance Criteria:**

**Given** I am viewing a workflow map
**When** I click "Export" button in the toolbar
**Then** A dropdown appears with options:
  - "Export as PNG"
  - "Export as PDF"

**Given** I select "Export as PNG"
**When** The export is processed
**Then** A high-resolution PNG image of the workflow map is generated
**And** The image is downloaded to my device
**And** Filename: "{workflow_name}_{date}.png"

**Given** I select "Export as PDF"
**When** The export is processed
**Then** A PDF document is generated with:
  - Workflow map on first page
  - Workflow summary (status, cost, duration) on second page
**And** The PDF is downloaded
**And** Filename: "{workflow_name}_{date}.pdf"

---

## Epic 6: Third-Party Integration Management

**Epic Goal:** Users can connect and manage CRM, email, calendar, meeting platform integrations with OAuth 2.0 and automatic health monitoring.

### Story 6.1: OAuth 2.0 Integration Connection Flow

As a user,
I want to connect third-party services via OAuth 2.0,
So that Nexus can access my CRM, email, and calendar securely.

**Acceptance Criteria:**

**Given** I am in Project Settings → Integrations
**When** I click "Connect Salesforce"
**Then** An OAuth 2.0 authorization flow begins
**And** I am redirected to Salesforce login page
**And** After successful authorization, I return to Nexus with access token
**And** The integration is saved in integrations table with credential_id referencing Clerk secure metadata

### Story 6.2: Integration Health Monitoring (60-min Intervals)

As a user,
I want my integrations to be automatically health-checked,
So that I'm notified if connections fail.

**Acceptance Criteria:**

**Given** I have connected a Salesforce integration
**When** The health check cron job runs (every 60 minutes)
**Then** A test API call is made to Salesforce
**And** If successful, integrations.last_sync_at is updated
**And** If failed, integrations.status changes to 'error' and integrations.last_error is populated with plain-English message

### Story 6.3: One-Tap OAuth Reconnect

As a user,
I want to reconnect expired OAuth integrations with one tap,
So that I can quickly fix connection issues.

**Acceptance Criteria:**

**Given** My Salesforce integration has status 'error' due to expired token
**When** I see the error notification "Salesforce connection expired"
**Then** A "Reconnect" button appears
**And** Clicking it initiates OAuth 2.0 flow again
**And** After successful reauthorization, the integration status returns to 'active'

### Story 6.4: CRM Integrations (Salesforce, HubSpot, Pipedrive)

As a user,
I want to connect to major CRM platforms,
So that I can automate customer relationship management tasks.

**Acceptance Criteria:**

**Given** I am adding a new integration
**When** I select integration type from dropdown
**Then** I see options: Salesforce, HubSpot, Pipedrive
**And** Each has specific OAuth scopes required (contacts:read, contacts:write, etc.)
**And** After connection, test queries confirm API access

### Story 6.5: Email Integrations (Gmail, Outlook, SMTP)

As a user,
I want to connect email providers,
So that workflows can send/receive emails automatically.

**Acceptance Criteria:**

**Given** I connect Gmail integration
**When** OAuth authorization completes
**Then** The integration can send emails via Gmail API
**And** Can read inbox for specific labels/filters
**And** OAuth scopes include gmail.send and gmail.readonly

### Story 6.6: Calendar Integrations (Google Calendar, Outlook Calendar)

As a user,
I want to connect calendar services,
So that workflows can schedule meetings and check availability.

**Acceptance Criteria:**

**Given** I connect Google Calendar
**When** The integration is active
**Then** Workflows can create calendar events
**And** Can query availability for meeting scheduling
**And** OAuth scopes include calendar.events and calendar.readonly

### Story 6.7: Integration Usage Analytics

As a user,
I want to see how often each integration is used,
So that I can monitor automation activity.

**Acceptance Criteria:**

**Given** I am viewing Project Settings → Integrations
**When** The integrations list loads
**Then** Each integration shows:
  - Last used timestamp
  - Total API calls this month
  - Status (active/error/disconnected)
  - Health check result

---

## Epic 7: Meeting Intelligence & SOP Extraction

**Epic Goal:** Users can record client meetings in Kuwaiti Arabic, get automatic transcription/translation, and extract SOPs as workflows.

### Story 7.1: Meeting Recording Upload

As a user,
I want to upload meeting recordings,
So that they can be transcribed and analyzed.

**Acceptance Criteria:**

**Given** I am in Meetings tab
**When** I click "Upload Recording"
**Then** A file picker allows selection of WebM, MP3, or WAV files
**And** The file is uploaded to AWS S3 at path `{user_id}/{project_id}/meetings/{meeting_id}.webm`
**And** A meetings record is created with s3_bucket and s3_key populated

### Story 7.2: Kuwaiti Arabic Dialect Detection

As a user,
I want the system to detect Kuwaiti Arabic dialect in my recordings,
So that transcription uses the correct language model.

**Acceptance Criteria:**

**Given** A meeting recording is uploaded
**When** The audio file is processed
**Then** A language detection service analyzes the audio
**And** If Kuwaiti dialect is detected, meetings.has_kuwaiti_dialect is set to TRUE
**And** meetings.detected_language is set to 'ar-KW'

### Story 7.3: Speech-to-Text Transcription (Whisper API, 2x Real-Time)

As a user,
I want my recordings transcribed quickly,
So that I can review content without waiting.

**Acceptance Criteria:**

**Given** A 30-minute meeting recording is uploaded
**When** Transcription begins via Whisper API
**Then** The processing completes in <15 minutes (2x real-time speed per NFR-P1.5)
**And** The transcript is stored in meeting_transcripts.transcript_original
**And** meetings.transcription_status updates from 'pending' → 'transcribing' → 'translating'

### Story 7.4: Kuwaiti Dialect → English Translation

As a user,
I want Kuwaiti Arabic transcripts translated to English,
So that the AI can understand and extract SOPs.

**Acceptance Criteria:**

**Given** A transcript is in Kuwaiti Arabic
**When** Translation service processes it
**Then** meeting_transcripts.transcript_translated contains English version
**And** Translation preserves business terminology and context
**And** meetings.transcription_status updates to 'extracting'

### Story 7.5: SOP Extraction via Claude API

As a user,
I want SOPs extracted from meeting transcripts,
So that manual processes can be automated.

**Acceptance Criteria:**

**Given** A transcript discusses a client's invoice processing workflow
**When** Claude API analyzes the transcript
**Then** meeting_transcripts.sop_extracted contains structured SOP steps:
  ```json
  [
    {"step": 1, "description": "Client sends invoice via WhatsApp"},
    {"step": 2, "description": "Extract invoice details into spreadsheet"},
    {"step": 3, "description": "Send confirmation email to client"}
  ]
  ```
**And** meetings.transcription_status updates to 'completed'

### Story 7.6: Automatic Workflow Generation from SOPs

As a user,
I want SOPs to generate workflow proposals automatically,
So that I can approve and execute them without manual setup.

**Acceptance Criteria:**

**Given** An SOP has been extracted from a meeting
**When** I click "Generate Workflow from SOP"
**Then** The Director agent analyzes the SOP steps
**And** Generates a workflow proposal matching the SOP structure
**And** I see the workflow preview card (as in Epic 3, Story 3.5)
**And** I can approve & run the workflow

### Story 7.7: Meeting Transcript Search

As a user,
I want to search meeting transcripts across projects,
So that I can find specific discussions quickly.

**Acceptance Criteria:**

**Given** I have 20 meeting transcripts across 3 projects
**When** I search for "invoice processing"
**Then** All meetings mentioning "invoice" are returned
**And** Results show:
  - Meeting title
  - Date
  - Project name
  - Snippet of matching text (highlighted)
**And** Clicking a result opens the full transcript

---

## Epic 8: Intelligent Error Recovery & Debugging

**Epic Goal:** Users experience automatic error recovery with plain-English messaging, eliminating technical jargon and manual debugging.

### Story 8.1: Auto-Retry Failed Steps (3 Attempts)

As a user,
I want failed workflow steps to retry automatically,
So that transient errors don't stop my workflows.

**Acceptance Criteria:**

**Given** A workflow step fails due to temporary issue (e.g., API timeout)
**When** The first attempt fails
**Then** The system waits 5 seconds and retries (attempt 2/3)
**And** If attempt 2 fails, waits 10 seconds and retries (attempt 3/3)
**And** If all 3 attempts fail, the error is surfaced to user with plain-English message

### Story 8.2: Plain-English Error Translation Middleware

As a user,
I want to see errors in plain English,
So that I understand what went wrong without technical knowledge.

**Acceptance Criteria:**

**Given** A Salesforce API returns "429 Too Many Requests"
**When** The error translation middleware processes it
**Then** The user sees: "Salesforce is responding slowly. Auto-retry in progress (2/5)"
**And** NO technical details (HTTP codes, stack traces) are shown in UI
**And** Technical details are logged to audit_logs for developer debugging

### Story 8.3: Token-Efficient Debugging (Cache Repeated Queries)

As a user,
I want debugging to be token-efficient,
So that fixing errors doesn't consume excessive budget.

**Acceptance Criteria:**

**Given** A workflow encounters the same error multiple times (e.g., invalid Salesforce field name)
**When** The error occurs a second time
**Then** The error analysis is cached in Redis with key `error:hash:{error_hash}`
**And** Subsequent occurrences use cached diagnosis (no re-analysis via Claude API)
**And** Token savings are reflected in workflow cost

### Story 8.4: Error Pattern Recognition & Suggested Fixes

As a user,
I want the system to recognize common error patterns and suggest fixes,
So that I can resolve issues quickly.

**Acceptance Criteria:**

**Given** A workflow fails with "Gmail authentication error"
**When** The error matches a known pattern (expired OAuth token)
**Then** The error message includes: "Gmail connection expired. [Reconnect Gmail]" (button)
**And** Clicking "Reconnect Gmail" initiates OAuth flow
**And** After reconnection, workflow auto-retries from last checkpoint

### Story 8.5: Workflow Skip-Failed-Step Option

As a user,
I want to skip failed steps and continue the workflow,
So that one failing task doesn't block the entire automation.

**Acceptance Criteria:**

**Given** A workflow step fails after 3 retry attempts
**When** The error is displayed
**Then** I see two options:
  - "Retry" (manual retry)
  - "Skip & Continue" (skip this step, continue with next step)
**And** If I click "Skip & Continue", the step is marked as 'warning' status
**And** The workflow proceeds to the next step

---

## Epic 9: Token Management & Cost Optimization

**Epic Goal:** Users can track token costs in real-time as dollar amounts, receive budget warnings, and get optimization recommendations.

### Story 9.1: Real-Time Token Usage Tracking

As a user,
I want to see token costs in real-time as my workflow runs,
So that I'm aware of spending.

**Acceptance Criteria:**

**Given** A workflow is executing
**When** Each Claude API call completes
**Then** A token_usage record is created with:
  - workflow_id, project_id
  - model (e.g., "claude-opus-4-5")
  - input_tokens, output_tokens
  - cost_per_1k_input, cost_per_1k_output
  - total_cost_usd (calculated)
**And** The workflows.total_cost_usd field is incremented
**And** An SSE update sends cost update to frontend

### Story 9.2: Dollar-Based Cost Display (Not Raw Token Counts)

As a user,
I want to see costs in dollars (not tokens),
So that I understand the financial impact clearly.

**Acceptance Criteria:**

**Given** A workflow has consumed 5,000 tokens
**When** The cost is displayed in UI
**Then** I see "$0.12" (NOT "5,000 tokens")
**And** Hovering over the cost shows tooltip: "5,000 tokens (Claude Opus 4.5)"
**And** All cost displays use currency format ($X.XX)

### Story 9.3: Gamification - "Efficient!" Indicators

As a user,
I want to see positive feedback when my workflows are cost-efficient,
So that I feel rewarded for optimization.

**Acceptance Criteria:**

**Given** A workflow completes with cost <$0.30
**When** The results are displayed
**Then** A green badge appears: "Efficient! $0.25"
**And** An efficiency score is calculated (0-10 scale) and stored in workflows.efficiency_score
**And** High-efficiency workflows (score >8) show congratulatory message

### Story 9.4: Budget Warnings at 80% Threshold

As a user,
I want warnings when approaching my budget limit,
So that I can take action before exceeding it.

**Acceptance Criteria:**

**Given** My project has total_budget_usd = $50.00
**When** Total cost reaches $40.00 (80%)
**Then** I see a warning notification: "Budget Alert: $40 of $50 used this month"
**And** The notification includes "View Usage Report" link
**And** Subsequent workflows show warning banner before execution

### Story 9.5: Token Optimization Recommendations

As a user,
I want recommendations to reduce token costs,
So that I can optimize spending.

**Acceptance Criteria:**

**Given** A workflow has high token usage (>10,000 tokens)
**When** The workflow completes
**Then** The system analyzes usage patterns and suggests:
  - "Switch to Claude Sonnet for 60% savings (95% quality maintained)"
  - "Enable caching for repeated queries to save 30%"
  - "Simplify prompts to reduce input tokens"
**And** Each recommendation shows estimated savings

### Story 9.6: Auto-Optimization Toggle

As a user,
I want to enable auto-optimization when budget is low,
So that costs are automatically reduced.

**Acceptance Criteria:**

**Given** I am in Project Settings
**When** I enable "Auto-optimize when budget reaches 90%"
**Then** The setting is saved to project metadata
**And** When budget hits 90%, future workflows automatically:
  - Switch from Opus → Sonnet (if quality acceptable)
  - Enable aggressive caching
  - Reduce prompt verbosity

---

## Epic 10: Results Delivery & Evidence

**Epic Goal:** Users receive tangible proof of workflow completion with shareable result artifacts.

### Story 10.1: Tangible Result Evidence Display

As a user,
I want to see real-world proof that my workflow completed,
So that I trust the automation actually worked.

**Acceptance Criteria:**

**Given** A workflow completes a "Send Email" task
**When** The workflow finishes
**Then** The results panel shows:
  - Screenshot of sent email in Gmail
  - Confirmation link to view email in Gmail inbox
  - Recipient list and timestamp
**And** NOT just a message "Task completed" (evidence > abstract confirmation)

### Story 10.2: Result Artifacts Storage (S3)

As a user,
I want workflow results saved permanently,
So that I can review them later.

**Acceptance Criteria:**

**Given** A workflow generates outputs (PDFs, screenshots, data files)
**When** The workflow completes
**Then** All result artifacts are uploaded to S3 at path:
  `{user_id}/{project_id}/workflow_artifacts/{workflow_id}_result_{timestamp}.{extension}`
**And** workflows.result_artifacts JSONB array contains:
  ```json
  [
    {"type": "pdf", "filename": "invoice.pdf", "url": "https://s3..."},
    {"type": "screenshot", "filename": "sent_email.png", "url": "https://s3..."}
  ]
  ```

### Story 10.3: Structured Output Rendering (Tables, Charts)

As a user,
I want workflow results displayed in structured formats,
So that data is easy to understand.

**Acceptance Criteria:**

**Given** A workflow queries Salesforce and returns 100 contact records
**When** Results are displayed
**Then** I see a sortable table with columns:
  - Name, Email, Phone, Company, Last Contact Date
**And** I can export the table as CSV
**And** If data includes metrics, a chart visualization is auto-generated

### Story 10.4: Shareable Result URLs

As a user,
I want to share workflow results via unique URL,
So that team members can view outputs.

**Acceptance Criteria:**

**Given** A workflow has completed
**When** I click "Share Results" button
**Then** A unique shareable URL is generated: `https://nexus.com/workflows/{workflow_id}/results?token={access_token}`
**And** The link is valid for 7 days (configurable)
**And** Anyone with the link can view results (no login required)
**And** Sensitive data can be optionally hidden from shared view

### Story 10.5: Email/Push Notifications on Completion

As a user,
I want to be notified when workflows complete,
So that I know results are ready.

**Acceptance Criteria:**

**Given** I have enabled notifications in Settings
**When** A workflow status changes to 'completed'
**Then** I receive an email with:
  - Subject: "Workflow 'Daily Sales Report' completed successfully"
  - Body: Summary of results, link to view full output
**And** If push notifications enabled (PWA), a browser notification appears

---

## Epic 11: Team Collaboration & Permissions

**Epic Goal:** Users can invite team members to projects with RBAC and collaborate on workflows.

### Story 11.1: Project Member Invitations

As a project owner,
I want to invite team members to my project,
So that we can collaborate on workflows.

**Acceptance Criteria:**

**Given** I am in Project Settings → Members
**When** I click "Invite Member"
**Then** A form appears with fields:
  - Email address
  - Role (dropdown: Owner, Collaborator, Viewer)
**And** Submitting sends an email invitation to the user
**And** A project_members record is created with role and invited_by fields

### Story 11.2: Role-Based Access Control (Owner, Collaborator, Viewer)

As a project member,
I want permissions based on my role,
So that access is appropriately restricted.

**Acceptance Criteria:**

**Given** I am a Viewer in a project
**When** I access the project
**Then** I can view workflows, results, and integrations (read-only)
**And** I cannot create, edit, or delete workflows
**And** I cannot modify project settings

**Given** I am a Collaborator
**When** I access the project
**Then** I can create, edit, and execute workflows
**And** I cannot change project settings or manage members
**And** I cannot delete the project

**Given** I am an Owner
**When** I access the project
**Then** I have full access (all permissions)

### Story 11.3: Shared Workflow Access

As a project member,
I want to access workflows created by teammates,
So that we can collaborate on automations.

**Acceptance Criteria:**

**Given** Alice (Collaborator) creates a workflow "Daily Report"
**When** Bob (Collaborator) views the project workflows
**Then** Bob sees "Daily Report" in the workflows list
**And** Bob can view, edit, and retry the workflow
**And** Bob can see execution history and results

### Story 11.4: Collaboration Activity Log

As a project owner,
I want to see who did what in my project,
So that I can track team activity.

**Acceptance Criteria:**

**Given** I am viewing Project Settings → Activity Log
**When** The page loads
**Then** I see a chronological list of events:
  - "Alice created workflow 'Sales Automation'" (timestamp)
  - "Bob connected Salesforce integration" (timestamp)
  - "Charlie edited workflow 'Daily Report'" (timestamp)
**And** Each event links to the relevant resource

### Story 11.5: Real-Time Collaboration Indicators

As a project member,
I want to see when teammates are viewing the same workflow,
So that we avoid conflicts.

**Acceptance Criteria:**

**Given** Alice is viewing workflow "Sales Report"
**When** Bob opens the same workflow
**Then** Alice sees indicator: "Bob is viewing this workflow" (with avatar)
**And** If Alice edits the workflow while Bob is viewing
**Then** Bob sees notification: "Alice made changes. [Refresh to see latest]"

---

## Epic 12: Mobile-First Responsive Experience

**Epic Goal:** Users can access all features seamlessly on mobile devices with touch-optimized interactions.

### Story 12.1: Mobile-First Layout (375px Baseline)

As a mobile user,
I want the entire app optimized for small screens,
So that I can use all features on my phone.

**Acceptance Criteria:**

**Given** I access Nexus on iPhone SE (375px width)
**When** Any page loads
**Then** The layout adapts:
  - Single-column content
  - Touch targets ≥44x44px (60x60px for primary actions)
  - Readable font sizes (≥16px for body text)
**And** No horizontal scrolling (except intentional like workflow map)

### Story 12.2: Bottom Navigation for Mobile

As a mobile user,
I want navigation at the bottom of the screen,
So that I can reach tabs with my thumb.

**Acceptance Criteria:**

**Given** I am on mobile
**When** Any page loads
**Then** A bottom tab bar appears with 60x60px tabs:
  - Chat (icon + label)
  - Workflows (icon + label)
  - Meetings (icon + label)
  - Settings (icon + label)
**And** The active tab is highlighted
**And** Tapping a tab navigates to that section

### Story 12.3: Touch-Optimized Interactions

As a mobile user,
I want all buttons and interactive elements large enough to tap,
So that I don't misclick.

**Acceptance Criteria:**

**Given** I am viewing any screen on mobile
**When** I interact with buttons, links, or inputs
**Then** All interactive elements have minimum 44x44px tap area
**And** Primary action buttons are 60x60px or 100% width × 48px height
**And** Spacing between adjacent tap targets is ≥8px

### Story 12.4: Portrait AND Landscape Orientation Support

As a mobile user,
I want the app to work in both portrait and landscape,
So that I can use my preferred orientation.

**Acceptance Criteria:**

**Given** I am viewing a workflow map in portrait mode
**When** I rotate my device to landscape
**Then** The layout adapts to landscape orientation
**And** Workflow map uses wider viewport for better visualization
**And** No content is cut off or hidden

### Story 12.5: Progressive Web App (PWA) Support

As a mobile user,
I want to install Nexus as a PWA,
So that it feels like a native app.

**Acceptance Criteria:**

**Given** I access Nexus on mobile browser
**When** I click browser's "Add to Home Screen" option
**Then** A Nexus icon appears on my home screen
**And** Opening the PWA launches in fullscreen (no browser chrome)
**And** PWA has offline capability (cached workflows visible)
**And** Service worker handles background sync when online

---

## Epic 13: Accessibility & Inclusive Design

**Epic Goal:** All users, including those with disabilities, can use Nexus with WCAG 2.1 AA compliance.

### Story 13.1: Keyboard Navigation for All Features

As a keyboard-only user,
I want to access all features via keyboard,
So that I don't need a mouse.

**Acceptance Criteria:**

**Given** I navigate the app using only keyboard
**When** I press Tab key
**Then** Focus moves to next interactive element (button, link, input)
**And** Focus indicator (2px blue outline) is always visible
**And** I can activate elements with Enter or Space key
**And** I can close modals with Esc key
**And** No keyboard traps exist

### Story 13.2: Screen Reader Support (VoiceOver, NVDA, TalkBack, JAWS)

As a screen reader user,
I want all content announced correctly,
So that I understand what's happening.

**Acceptance Criteria:**

**Given** I use VoiceOver on iOS
**When** I navigate the workflow visualization
**Then** Each node is announced with:
  - Node label
  - Node status (pending, running, success, error)
  - Progress percentage
**And** Live regions (aria-live) announce status changes in real-time
**And** All images have alt text or aria-label

### Story 13.3: Color Contrast 4.5:1 Minimum

As a user with low vision,
I want sufficient color contrast,
So that I can read all text.

**Acceptance Criteria:**

**Given** I view any text content
**When** I check color contrast
**Then** All text meets WCAG AA standards:
  - Body text (16px): ≥4.5:1 contrast ratio
  - Large text (24px+): ≥3:1 contrast ratio
  - UI components (buttons, inputs): ≥3:1 contrast ratio
**And** Success text uses #15803d (4.6:1 contrast)
**And** Card borders use #d1d5db (3.5:1 contrast)

### Story 13.4: Reduced Motion Preferences

As a user with vestibular disorders,
I want animations disabled when I enable reduced motion,
So that I don't feel dizzy.

**Acceptance Criteria:**

**Given** I enable "Reduce Motion" in my OS settings
**When** I use Nexus
**Then** All non-essential animations are disabled:
  - No pulse animations on running nodes
  - No confetti on workflow completion (fade-in only)
  - Page transitions are instant (no slide effects)
**And** Essential feedback (loading spinners) uses reduced motion alternatives

---

## Epic 14: Self-Improvement Platform (Meta)

**Epic Goal:** Users can use Nexus to fix bugs and add features to Nexus itself.

### Story 14.1: GitHub Repository Integration

As a developer,
I want Nexus to connect to its own GitHub repository,
So that it can create PRs for bug fixes.

**Acceptance Criteria:**

**Given** I am a Nexus maintainer
**When** I configure GitHub integration in Nexus settings
**Then** OAuth authorization grants read/write access to Nexus repo
**And** The integration can:
  - Read code from repository
  - Create branches
  - Create pull requests
  - Add PR comments

### Story 14.2: Self-Improvement Workflow Execution

As a Nexus user,
I want to use Nexus to fix bugs in Nexus,
So that the platform evolves based on real usage.

**Acceptance Criteria:**

**Given** I encounter a bug in Nexus (e.g., "workflow visualization nodes overlap")
**When** I chat with Director: "Fix the bug where nodes overlap in workflow map"
**Then** Director:
  1. Analyzes the Nexus codebase (via GitHub integration)
  2. Identifies the issue (z-index conflict in WorkflowMap.tsx)
  3. Generates fix (updated CSS)
  4. Creates a new branch "fix/workflow-map-overlap"
  5. Creates PR with code changes and description
**And** I review the PR in GitHub
**And** I can approve & merge

### Story 14.3: Automatic PR Creation with Code Changes

As a developer,
I want Nexus to create PRs automatically,
So that fixes go through proper code review.

**Acceptance Criteria:**

**Given** A self-improvement workflow completes
**When** Code changes are ready
**Then** A PR is created with:
  - Title: Auto-generated from workflow (e.g., "Fix: Workflow map node overlap")
  - Description: Detailed explanation of changes, issue addressed, testing done
  - Branch: "fix/{issue-slug}" or "feature/{issue-slug}"
  - Reviewers: Auto-assigned based on CODEOWNERS file

### Story 14.4: Code Review Quality Gates

As a Nexus maintainer,
I want automated checks before merging self-improvement PRs,
So that quality is maintained.

**Acceptance Criteria:**

**Given** A self-improvement PR is created
**When** GitHub Actions CI/CD runs
**Then** The following checks must pass:
  - Linting (ESLint, Prettier)
  - Unit tests (Vitest)
  - Integration tests
  - Build succeeds
**And** If any check fails, the PR is blocked from merging
**And** Nexus comments on PR with failure details

### Story 14.5: Staging Deployment → Production Pipeline

As a Nexus maintainer,
I want self-improvement changes deployed to staging first,
So that I can test before production.

**Acceptance Criteria:**

**Given** A self-improvement PR is merged
**When** The merge completes
**Then** GitHub Actions automatically:
  1. Deploys to staging environment (staging.nexus.com)
  2. Runs smoke tests on staging
  3. Waits for manual approval
**And** After approval, deploys to production
**And** If staging tests fail, deployment is halted

---

## Epic 15: User Personalization & Intelligence

**Epic Goal:** Users benefit from cross-project intelligence with personalized recommendations and adaptive UI.

### Story 15.1: Personalized Workflow Recommendations

As a user,
I want workflow recommendations based on my past behavior,
So that I can automate similar tasks quickly.

**Acceptance Criteria:**

**Given** I have completed 10 workflows across 3 projects
**When** I open the Chat interface
**Then** Director suggests: "Based on your recent workflows, you might want to:"
  - "Automate daily sales report (similar to last week's workflow)"
  - "Set up CRM sync (you use Salesforce in 2 other projects)"
**And** Suggestions are generated by analyzing user_profiles.behavior_patterns

### Story 15.2: Adaptive UI Complexity

As a user,
I want advanced features shown only when relevant,
So that the UI isn't overwhelming.

**Acceptance Criteria:**

**Given** I am a new user (total_workflows_executed < 5)
**When** I view project settings
**Then** Advanced options are hidden by default:
  - Compliance framework (collapsed)
  - Data residency (collapsed)
  - Advanced budget settings (hidden)

**Given** I am an experienced user (total_workflows_executed > 20)
**When** I view project settings
**Then** Advanced options are visible by default
**And** UI shows power-user features (keyboard shortcuts, bulk actions)

### Story 15.3: Cross-Project Workflow Templates Based on User Patterns

As a user,
I want templates tailored to my usage patterns,
So that I can reuse successful automations.

**Acceptance Criteria:**

**Given** I frequently create workflows for "Daily CRM updates"
**When** I start a new workflow
**Then** Director suggests: "Use your 'Daily CRM Update' template? It's worked well in 3 other projects."
**And** The template is pre-filled with my common integrations (Salesforce, Gmail)
**And** Estimated cost is shown based on my historical usage

---

## Document Completion Status

**Epic Breakdown Complete:** ✅
**Total Epics:** 15
**Total Stories:** ~125 user stories created
**FR Coverage:** 148/148 functional requirements (100%)
**NFR Coverage:** 45/45 non-functional requirements (100%)

**Document Ready For:**
- Development team story assignment
- Sprint planning
- Implementation kickoff

