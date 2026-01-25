# Story 16.3: Tool Chain Optimizer Agent

Status: done

## Story

As a **Nexus user**,
I want **an intelligent agent that designs the optimal chain of tools to achieve my workflow goal**,
So that **I get maximum value with minimum cost and time**.

## Acceptance Criteria

### AC1: Capability Analysis
**Given** a user describes a workflow goal
**When** the optimizer agent analyzes the goal
**Then** the agent identifies required capabilities and maps them to available tools
**And** designs at least 2 alternative chains for complex workflows (NFR-16.3.3)

### AC2: Chain Presentation with Cost/Time Estimates
**Given** the optimizer designs multiple chain alternatives
**When** presenting options to user
**Then** display recommended chain prominently with full details (estimated cost, time, trade-offs)
**And** collapse alternative chains under 'See other options' expandable section
**And** power users can expand to compare all chains side-by-side
**And** recommendations are within 20% of optimal cost efficiency (NFR-16.3.1)

### AC3: Learning from Success
**Given** a chain is selected and executed successfully
**When** the workflow completes
**Then** the system stores the chain pattern for future recommendations (FR-16.2.7)
**And** considers user's historical preferences for similar future workflows (NFR-16.3.2)

### AC4: Data Flow Compatibility
**Given** a chain of tools is designed
**When** the optimizer validates the chain
**Then** it considers data flow compatibility between tools (FR-16.2.2)
**And** flags potential transformation requirements

## Tasks / Subtasks

- [x] Task 1: Tool Chain Optimizer Service (AC: 1, 2, 4)
  - [x] 1.1: Create `src/services/ToolChainOptimizerService.ts`
  - [x] 1.2: Implement workflow goal analysis (extract required capabilities)
  - [x] 1.3: Create capability-to-tool mapping algorithm
  - [x] 1.4: Integrate with ToolCatalogService and ToolDiscoveryService
  - [x] 1.5: Implement chain validation logic

- [x] Task 2: Chain Generation Algorithm (AC: 1, 2)
  - [x] 2.1: Define `ToolChain` and `ChainStep` types
  - [x] 2.2: Implement chain generation from capabilities
  - [x] 2.3: Generate minimum 2 alternative chains for complex workflows
  - [x] 2.4: Calculate estimated cost for each chain
  - [x] 2.5: Calculate estimated execution time for each chain
  - [x] 2.6: Score and rank chains by optimization criteria

- [x] Task 3: Chain Scoring & Optimization (AC: 2)
  - [x] 3.1: Define optimization criteria weights (cost, speed, reliability)
  - [x] 3.2: Implement cost optimization scoring (within 20% optimal)
  - [x] 3.3: Implement speed optimization scoring
  - [x] 3.4: Implement reliability scoring (based on tool trust scores)
  - [x] 3.5: Calculate trade-off explanations between chains

- [x] Task 4: Data Flow Analyzer (AC: 4)
  - [x] 4.1: Analyze input/output schemas between chain steps
  - [x] 4.2: Detect data format compatibility
  - [x] 4.3: Flag required transformations
  - [x] 4.4: Validate chain connectivity

- [x] Task 5: Chain Learning System (AC: 3)
  - [x] 5.1: Create `tool_chain_patterns` Supabase table
  - [x] 5.2: Store successful chain patterns with metadata
  - [x] 5.3: Implement pattern matching for similar workflows
  - [x] 5.4: Weight recommendations by user's historical preferences

- [x] Task 6: Chain Types & Interfaces (AC: 1, 2, 3, 4)
  - [x] 6.1: Define `ToolChain`, `ChainStep`, `ChainEstimate` interfaces
  - [x] 6.2: Define `ChainOptimizationCriteria` type
  - [x] 6.3: Define `ChainComparison` for side-by-side display
  - [x] 6.4: Add types to `src/types/tools.ts`

- [x] Task 7: React Hook for Chain Optimizer (AC: 1, 2)
  - [x] 7.1: Create `useToolChainOptimizer` hook
  - [x] 7.2: Provide chain generation with loading states
  - [x] 7.3: Expose comparison utilities for UI
  - [x] 7.4: Handle optimization criteria preferences

- [x] Task 8: Unit Tests (Target: 85%)
  - [x] 8.1: Test capability extraction from workflow goals
  - [x] 8.2: Test chain generation with various complexity levels
  - [x] 8.3: Test cost estimation accuracy
  - [x] 8.4: Test chain ranking algorithm
  - [x] 8.5: Test data flow compatibility detection
  - [x] 8.6: Test pattern learning and retrieval

## Dev Notes

### Existing Patterns to Follow

**ToolDiscoveryService Pattern** [Source: nexus/src/services/ToolDiscoveryService.ts]
- Follow singleton pattern with class instance export
- Use same caching approach
- Integrate with existing tool services
- Use TrustScoreService for reliability scoring

**Tool Types** [Source: nexus/src/types/tools.ts]
- Extend existing Tool and DiscoveredTool interfaces
- Follow naming conventions (camelCase properties)
- Use Supabase row converters pattern

### Chain Generation Algorithm

```
1. Parse workflow goal → extract required capabilities
2. For each capability:
   a. Search ToolCatalogService (approved tools)
   b. Search ToolDiscoveryService (discovered tools)
   c. Rank tools by trust score + cost + speed
3. Generate chains by combining tool alternatives:
   a. Primary chain: highest trust, reasonable cost
   b. Budget chain: lowest cost, acceptable trust
   c. Speed chain: fastest execution, acceptable trust
4. Validate data flow between steps
5. Calculate estimates for each chain
6. Return ranked chains with trade-off explanations
```

### Cost Estimation Formula

```typescript
chainCost = sum(steps.map(step => {
  const baseCost = step.tool.costEstimate.perCall || 0
  const volumeMultiplier = estimatedDataVolume / 1000
  return baseCost * volumeMultiplier
}))

// Add 10% buffer for retry overhead
totalEstimate = chainCost * 1.1
```

### Time Estimation Formula

```typescript
chainTime = sum(steps.map(step => {
  const avgLatency = step.tool.avgLatencyMs || 500
  const dataTransferTime = estimatedDataSize / networkSpeed
  return avgLatency + dataTransferTime
}))

// Add parallelization discount for independent steps
if (canParallelize(steps)) {
  chainTime = chainTime * 0.7
}
```

### Optimization Criteria Weights (Default)

| Criteria | Weight | Description |
|----------|--------|-------------|
| Cost | 0.35 | Minimize total API costs |
| Speed | 0.30 | Minimize execution time |
| Reliability | 0.25 | Maximize trust scores |
| Simplicity | 0.10 | Fewer steps preferred |

### Performance Requirements

- Chain generation: < 2 seconds
- Pattern matching: < 500ms
- Cost estimation: < 100ms per chain
- Minimum 2 alternatives for workflows with 3+ capabilities

### Database Schema (tool_chain_patterns)

```sql
CREATE TABLE tool_chain_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Pattern identification
  capability_signature TEXT NOT NULL,  -- Hash of sorted capabilities
  workflow_type TEXT,                  -- e.g., 'data-pipeline', 'notification'

  -- Chain data
  chain_steps JSONB NOT NULL,          -- Array of {toolId, capability, order}

  -- Success metrics
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  avg_execution_time_ms INTEGER,
  avg_cost_usd DECIMAL(10, 4),

  -- User preference tracking
  user_id UUID REFERENCES auth.users(id),
  project_id UUID REFERENCES projects(id),

  -- Metadata
  last_used_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_chain_patterns_capability ON tool_chain_patterns(capability_signature);
CREATE INDEX idx_chain_patterns_user ON tool_chain_patterns(user_id);
```

### Integration Points

- **ToolCatalogService**: Search approved tools by capability
- **ToolDiscoveryService**: Search discovered tools for gaps
- **TrustScoreService**: Get reliability ratings for tools
- **Story 16.4 (Schema Analyzer)**: Will consume chain output for transformation planning

## Technical Design

### Chain Generation Flow

```
User Goal: "Send daily sales report from Shopify to Slack"
    ↓
Capability Extraction:
  - data_fetch: shopify_orders
  - data_transform: aggregate_sales
  - notification: slack_message
    ↓
Tool Mapping:
  - shopify_orders → [Shopify API, CommerceJS]
  - aggregate_sales → [Internal Transform, Tray.io]
  - slack_message → [Slack API, Discord fallback]
    ↓
Chain Generation:
  Chain A (Recommended): Shopify → Transform → Slack
    Cost: $0.02/run, Time: 3s, Reliability: 95%
  Chain B (Budget): CommerceJS → Transform → Slack
    Cost: $0.005/run, Time: 5s, Reliability: 85%
    ↓
Validation: Check data compatibility between steps
    ↓
Return: Ranked chains with trade-offs
```

### Chain Scoring Formula

```
score = (cost_score * 0.35) + (speed_score * 0.30) +
        (reliability_score * 0.25) + (simplicity_score * 0.10)

Where:
- cost_score = 100 - (chain_cost / max_acceptable_cost * 100)
- speed_score = 100 - (chain_time / max_acceptable_time * 100)
- reliability_score = avg(tool_trust_scores)
- simplicity_score = 100 - (step_count * 10)
```

## Completion Notes

### Implementation Summary (2026-01-09)

**Files Created:**
- `nexus/src/services/ToolChainOptimizerService.ts` - Main optimization service (1119 lines)
- `nexus/src/hooks/useToolChainOptimizer.ts` - React hooks (347 lines)
- `nexus/supabase/migrations/20260109_004_tool_chain_patterns.sql` - Database migration
- `nexus/tests/unit/services/ToolChainOptimizerService.test.ts` - 33 unit tests

**Files Modified:**
- `nexus/src/types/tools.ts` - Added chain types (~280 lines of new interfaces)
- `nexus/src/services/index.ts` - Exported ToolChainOptimizerService
- `nexus/src/hooks/index.ts` - Exported chain optimizer hooks

**Key Features Implemented:**
1. **Workflow Goal Analysis**: Extracts capabilities from natural language goals
2. **Multi-Chain Generation**: Generates 2+ alternatives using different strategies (balanced, cost, speed, reliability)
3. **Chain Scoring**: Uses weighted formula (cost: 35%, speed: 30%, reliability: 25%, simplicity: 10%)
4. **Data Flow Validation**: Checks schema compatibility between chain steps
5. **Pattern Learning**: Stores successful chains for future recommendations
6. **React Hooks**: `useToolChainOptimizer`, `useWorkflowAnalysis`, `useChainComparison`

**Test Results:**
- 33 tests passing for ToolChainOptimizerService
- 85 total tests passing across all Epic 16 services

**Acceptance Criteria Met:**
- AC1: ✅ Capability analysis extracts required capabilities and maps to tools
- AC2: ✅ Chain presentation with cost/time estimates and trade-offs
- AC3: ✅ Learning system stores successful patterns
- AC4: ✅ Data flow compatibility validation with transformation flags
