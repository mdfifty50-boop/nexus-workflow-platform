# Story 16.2: Dynamic Tool Discovery Engine

Status: done

## Story

As a **Nexus user**,
I want **agents to discover new tools beyond the pre-approved catalog when my workflow requires specialized capabilities**,
So that **I'm not limited to pre-configured integrations**.

## Acceptance Criteria

### AC1: Public API Discovery
**Given** a user workflow requires a capability not in the catalog
**When** the agent searches for tools
**Then** the agent queries public API directories (RapidAPI, ProgrammableWeb, etc.) and AI tool aggregators
**And** returns results within 5 seconds (NFR-16.1.1)

### AC2: Tool Presentation with Trust Score
**Given** the agent discovers a tool outside the pre-approved catalog
**When** presenting the tool for approval
**Then** display: tool name, one-liner capability, Trust Score (0-100), and Recommendation badge (✅ Recommended / ⚠️ Use with caution / ❌ Not recommended)
**And** provide one-tap approve button for streamlined UX

### AC3: Discovery Caching
**Given** a discovered tool is approved by user
**When** the workflow completes successfully
**Then** the tool is cached for 24 hours (NFR-16.1.3) and optionally added to catalog

### AC4: Integration with Tool Catalog
**Given** the discovery engine finds tools
**When** searching for capabilities
**Then** it first checks the local tool catalog before querying external sources
**And** seamlessly combines local and discovered results

## Tasks / Subtasks

- [x] Task 1: Tool Discovery Service (AC: 1, 4)
  - [x] 1.1: Create `src/services/ToolDiscoveryService.ts`
  - [x] 1.2: Implement capability-to-tool matching algorithm
  - [x] 1.3: Integrate with local ToolCatalogService as primary source
  - [x] 1.4: Add external API discovery fallback (Rube SEARCH_TOOLS)
  - [x] 1.5: Implement 5-second timeout with partial results

- [x] Task 2: Trust Score Calculator (AC: 2)
  - [x] 2.1: Define `ToolTrustScore` algorithm in `src/services/TrustScoreService.ts`
  - [x] 2.2: Implement scoring components: security (OAuth, HTTPS), reliability (uptime, error rates), performance (latency), community (usage count)
  - [x] 2.3: Generate recommendation badge based on score thresholds (≥70 Recommended, 40-69 Caution, <40 Not recommended)
  - [x] 2.4: Cache trust scores per tool for 24 hours

- [x] Task 3: Discovered Tool Types (AC: 2, 3)
  - [x] 3.1: Define `DiscoveredTool` interface extending `Tool`
  - [x] 3.2: Add `trustScore`, `recommendationBadge`, `discoverySource`, `discoveredAt` fields
  - [x] 3.3: Define `ToolApprovalRequest` and `ToolApprovalStatus` types

- [x] Task 4: Discovery Cache System (AC: 3)
  - [x] 4.1: Create `tool_discovery_cache` table in Supabase
  - [x] 4.2: Implement 24-hour TTL cache for discovered tools
  - [x] 4.3: Add user approval status tracking
  - [x] 4.4: Create cache invalidation logic

- [x] Task 5: Tool Approval Flow (AC: 2, 3)
  - [x] 5.1: Create `approveDiscoveredTool()` method
  - [x] 5.2: Implement one-tap approval with audit trail
  - [x] 5.3: Add option to persist approved tool to catalog
  - [x] 5.4: Track user approval history per project

- [x] Task 6: React Hook for Discovery (AC: 1, 2, 4)
  - [x] 6.1: Create `useToolDiscovery` hook
  - [x] 6.2: Handle loading states and timeout handling
  - [x] 6.3: Provide trust score display utilities
  - [x] 6.4: Integrate approval flow into hook

- [x] Task 7: Unit Tests (Target: 80%)
  - [x] 7.1: Test trust score calculation with various inputs
  - [x] 7.2: Test discovery timeout handling
  - [x] 7.3: Test cache expiration logic
  - [x] 7.4: Test approval flow with edge cases

## Dev Notes

### Existing Patterns to Follow

**ToolCatalogService Pattern** [Source: nexus/src/services/ToolCatalogService.ts]
- Follow singleton pattern with class instance export
- Use same caching approach (5-minute TTL for local, 24-hour for external)
- Integrate with Supabase for persistence
- Mirror search API signature for consistency

**Trust Score Components** (from types/tools.ts ToolTrustScore)
```typescript
interface ToolTrustScore {
  overall: number // 0-100
  components: {
    security: number
    reliability: number
    performance: number
    community: number
  }
  breakdown: {
    hasOAuth: boolean
    httpsOnly: boolean
    rateLimited: boolean
    documentedApi: boolean
    activelyMaintained: boolean
  }
}
```

### External Discovery Sources

**Primary: Rube MCP SEARCH_TOOLS**
- Use existing MCP integration for tool discovery
- Session-based queries with caching
- Returns tool schemas and capabilities

**Secondary: Direct API Search** (if MCP unavailable)
- Query public API directories
- Parse OpenAPI/Swagger specs
- Extract capability metadata

### Performance Requirements (NFR-16.1)

- Discovery queries: < 5 seconds
- Trust score calculation: < 100ms
- Cache lookup: < 50ms
- Results limit: Top 10 most relevant

### Security Considerations (NFR-16.5)

- Only access publicly available API documentation
- Validate discovered tool endpoints
- Sanitize tool metadata before storage
- Audit all approval actions

## Technical Design

### Discovery Flow
```
1. User requests capability →
2. Check local catalog (ToolCatalogService) →
3. If not found, query Rube MCP SEARCH_TOOLS →
4. Calculate Trust Score for each result →
5. Return combined results sorted by relevance →
6. User approves/rejects discovered tools →
7. Cache approved tools for 24 hours
```

### Trust Score Algorithm
```
overall = (security * 0.35) + (reliability * 0.30) + (performance * 0.20) + (community * 0.15)

security = sum([
  hasOAuth ? 25 : 0,
  httpsOnly ? 25 : 0,
  rateLimited ? 25 : 0,
  encryptedTransit ? 25 : 0
])

reliability = (successRate * 100)  // from usage metrics

performance = 100 - min(avgLatencyMs / 50, 100)  // 0ms = 100, 5000ms = 0

community = min(usageCount / 100, 100)  // 10000 uses = 100
```

### Recommendation Thresholds
- ✅ Recommended: Trust Score ≥ 70
- ⚠️ Use with caution: Trust Score 40-69
- ❌ Not recommended: Trust Score < 40

## Completion Notes

**Completed:** 2026-01-09

### Files Created/Modified

**Services:**
- `nexus/src/services/ToolDiscoveryService.ts` - Main discovery engine with local + external search
- `nexus/src/services/TrustScoreService.ts` - Trust score calculator with weighted algorithm
- `nexus/src/services/index.ts` - Updated exports

**Types:**
- `nexus/src/types/tools.ts` - Extended with discovery types (DiscoveredTool, ToolTrustScore, etc.)

**Hooks:**
- `nexus/src/hooks/useToolDiscovery.ts` - React hooks for discovery, search, and approval
- `nexus/src/hooks/index.ts` - Updated exports

**Database:**
- `nexus/supabase/migrations/20260109_003_tool_discovery_cache.sql` - Cache and audit tables with RLS

**Tests:**
- `nexus/tests/unit/services/ToolDiscoveryService.test.ts` - 19 tests
- `nexus/tests/unit/services/TrustScoreService.test.ts` - 21 tests
- `nexus/tests/unit/services/ToolCatalogService.test.ts` - 12 tests (fixed)

### Test Results
- **52 tests passing** across all three service test files
- Trust score calculation validated against algorithm
- Discovery timeout and caching tested
- Approval flow data structures validated

### Key Implementation Details
- Local catalog searched first with 1.2x relevance boost
- External discovery via Rube MCP SEARCH_TOOLS (when MCP available)
- 5-second timeout on discovery operations
- 24-hour TTL cache for discovered tools and trust scores
- Full audit trail for approval actions
