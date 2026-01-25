# Story 16.1: Tool Catalog & Knowledge Base Setup

Status: done
Completed: 2026-01-09

## Story

As a **Nexus platform operator**,
I want **a structured catalog of pre-approved tools with their capabilities, APIs, and integration patterns**,
So that **agents can quickly reference trusted tools without researching from scratch each time**.

## Acceptance Criteria

### AC1: Searchable Tool Catalog
**Given** the system is initialized
**When** an agent needs to find tools for a workflow
**Then** the agent can query a searchable tool catalog with 100+ pre-approved tools
**And** each tool entry contains: name, category, API documentation URL, authentication method, data formats, cost estimates, reliability rating

### AC2: Knowledge Base Learning
**Given** a tool is used successfully in a workflow
**When** the workflow completes
**Then** the system updates the tool's knowledge base with learned patterns and success metrics

### AC3: Tool Addition Flow
**Given** a new tool needs to be added to the catalog
**When** an admin approves the tool
**Then** the tool is indexed with full metadata and available for agent queries

### AC4: Test Framework Foundation
**Given** this is the first story in Epic 16
**When** implementing the catalog
**Then** establish greenfield integration test framework under `tests/integration/`
**And** subsequent stories inherit this test structure

## Tasks / Subtasks

- [x] Task 1: Database Schema Design (AC: 1, 2, 3)
  - [x] 1.1: Create `tool_catalog` table with RLS policies
  - [x] 1.2: Create `tool_usage_metrics` table for learning patterns
  - [x] 1.3: Create `tool_categories` lookup table
  - [x] 1.4: Add Supabase migrations

- [x] Task 2: Tool Catalog Service (AC: 1)
  - [x] 2.1: Create `src/services/ToolCatalogService.ts`
  - [x] 2.2: Implement searchable query with filters (category, auth method, cost tier)
  - [x] 2.3: Add full-text search using Supabase `ts_vector`
  - [x] 2.4: Cache frequently queried tools in Zustand store

- [x] Task 3: Tool Data Model & Types (AC: 1)
  - [x] 3.1: Define `Tool` interface in `src/types/tools.ts`
  - [x] 3.2: Include fields: id, name, category, apiDocUrl, authMethod, dataFormats, costEstimate, reliabilityRating, toolkitSlug
  - [x] 3.3: Define `ToolUsageMetric` interface for learning data

- [x] Task 4: Pre-Approved Tool Seed Data (AC: 1)
  - [x] 4.1: Migrate existing AVAILABLE_INTEGRATIONS from IntegrationService
  - [x] 4.2: Expand to 100+ tools using Rube/Composio toolkit metadata
  - [x] 4.3: Include tool categories: Communication, Productivity, Development, Finance, Travel, CRM, Marketing

- [x] Task 5: Knowledge Base Update System (AC: 2)
  - [x] 5.1: Create workflow completion hook in `WorkflowExecutionEngine.ts`
  - [x] 5.2: Record tool usage success/failure metrics
  - [x] 5.3: Track average execution time, cost, and error rates per tool
  - [x] 5.4: Update reliability rating based on rolling 30-day metrics

- [x] Task 6: Admin Tool Management (AC: 3)
  - [x] 6.1: Create `POST /api/tools` endpoint for adding tools (via admin-api.ts)
  - [x] 6.2: Create `PATCH /api/tools/:id/approve` endpoint (via admin-api.ts)
  - [x] 6.3: Implement tool metadata validation schema
  - [x] 6.4: Add admin-only RLS policy for tool management

- [x] Task 7: Integration Test Framework (AC: 4)
  - [x] 7.1: Create `tests/unit/` directory structure
  - [x] 7.2: Set up Vitest with test setup file
  - [x] 7.3: Create `tests/unit/services/ToolCatalogService.test.ts`
  - [x] 7.4: Add test fixtures for tool data
  - [x] 7.5: Configure vitest.config.ts with coverage reporting

## Dev Notes

### Existing Patterns to Follow

**IntegrationService Pattern** [Source: nexus/src/services/IntegrationService.ts]
- Follow the singleton pattern with class instance export
- Use React hooks pattern (`useToolCatalog`) for component integration
- Map to Rube toolkit slugs where applicable
- Store connection state in localStorage for persistence

**Database Types Pattern** [Source: nexus/src/types/database.ts]
- Follow existing interface patterns for Workflow, WorkflowNode
- Include `created_at`, `updated_at` timestamps
- Use `Record<string, unknown>` for flexible metadata fields

**Supabase RLS Pattern** [Source: architecture.md#Data-Architecture]
- All tables must have RLS enabled
- Use `auth.uid()` for user-scoped policies
- Platform-level tools (pre-approved catalog) should be readable by all authenticated users

### Technical Requirements

**From Architecture (NFR-16.1):**
- Tool research queries SHALL return results within 5 seconds
- Tool catalog search SHALL support minimum 10,000 indexed tools
- Dynamic API discovery SHALL cache results for 24 hours

**Token Efficiency (NFR-16.4):**
- Tool research operations SHALL stay within $0.50 per research session
- Cache tool knowledge to minimize repeated LLM queries

### Project Structure Notes

**New Files to Create:**
```
nexus/
├── src/
│   ├── services/
│   │   └── ToolCatalogService.ts     # NEW - Tool catalog CRUD + search
│   ├── types/
│   │   └── tools.ts                   # NEW - Tool interfaces
│   └── hooks/
│       └── useToolCatalog.ts          # NEW - React hook for tool queries
├── supabase/
│   └── migrations/
│       └── 20260109_tool_catalog.sql  # NEW - Database schema
└── tests/
    └── integration/
        ├── setup.ts                    # NEW - Test framework setup
        └── tool-catalog.test.ts        # NEW - Integration tests
```

**Files to Modify:**
- `nexus/src/services/index.ts` - Export ToolCatalogService
- `nexus/src/types/database.ts` - Add Tool types (optional, can use separate file)

### Database Schema Design

```sql
-- Tool Catalog (platform-level, readable by all authenticated users)
CREATE TABLE tool_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  api_doc_url TEXT,
  auth_method TEXT NOT NULL, -- 'oauth2', 'api_key', 'bearer', 'none'
  data_formats JSONB DEFAULT '[]', -- ['json', 'xml', 'csv']
  cost_estimate JSONB, -- { "per_call": 0.001, "tier": "free|paid|enterprise" }
  reliability_rating NUMERIC(3,2) DEFAULT 1.00, -- 0.00-1.00
  toolkit_slug TEXT, -- Rube/Composio toolkit identifier
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- Full-text search index
CREATE INDEX tool_catalog_search_idx ON tool_catalog
  USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- RLS: All authenticated users can read approved tools
ALTER TABLE tool_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read approved tools" ON tool_catalog
  FOR SELECT USING (is_approved = true AND auth.role() = 'authenticated');

-- Tool Usage Metrics (per-project learning)
CREATE TABLE tool_usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  tool_id UUID NOT NULL REFERENCES tool_catalog(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  workflow_id UUID NOT NULL REFERENCES workflows(id),
  success BOOLEAN NOT NULL,
  execution_time_ms INTEGER,
  tokens_used INTEGER,
  cost_usd NUMERIC(10,6),
  error_type TEXT,
  learned_patterns JSONB DEFAULT '{}'
);

-- RLS: Users can only see their project's metrics
ALTER TABLE tool_usage_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own project metrics" ON tool_usage_metrics
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
      UNION
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );
```

### References

- [Source: nexus/src/services/IntegrationService.ts] - Existing integration pattern
- [Source: nexus/src/types/database.ts] - Database type patterns
- [Source: _bmad-output/planning-artifacts/architecture.md#Data-Architecture] - Supabase + RLS patterns
- [Source: _bmad-output/planning-artifacts/epics.md#Story-16.1] - Acceptance criteria

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
