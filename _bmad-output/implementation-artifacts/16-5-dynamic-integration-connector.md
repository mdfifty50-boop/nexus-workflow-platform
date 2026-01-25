# Story 16.5: Dynamic Integration Connector

Status: in-progress

## Story

As a **Nexus system**,
I want **to automatically connect tools in a chain without manual configuration**,
So that **integrations work bug-free on first attempt**.

## Acceptance Criteria

### AC1: Automatic Connection Establishment
**Given** an approved tool chain with schema transformations planned
**When** the connector establishes integrations
**Then** it connects each tool pair using appropriate authentication (OAuth 2.0 or API key)
**And** achieves 99% success rate on first connection attempt (NFR-16.2.1)

### AC2: Data Flow Transformation
**Given** a connection is established
**When** data flows between tools
**Then** the connector applies schema transformations automatically
**And** ensures zero bugs between any two connected tools (FR-16.3.6)

### AC3: Pre-Execution Testing
**Given** a tool chain is ready for execution
**When** the connector prepares the workflow
**Then** it tests all integration connections before execution begins (FR-16.3.7)
**And** reports any connection failures with plain-English explanations

## Tasks / Subtasks

- [ ] Task 1: Connection Types & Interfaces (AC: 1, 2, 3)
  - [ ] 1.1: Define `IntegrationConnection` interface
  - [ ] 1.2: Define `ConnectionConfig` interface
  - [ ] 1.3: Define `ConnectionResult` interface
  - [ ] 1.4: Define `ConnectionTestResult` interface
  - [ ] 1.5: Define `DataFlowExecution` interface
  - [ ] 1.6: Add types to `src/types/tools.ts`

- [ ] Task 2: Dynamic Integration Connector Service (AC: 1, 2)
  - [ ] 2.1: Create `src/services/DynamicIntegrationConnectorService.ts`
  - [ ] 2.2: Implement connection establishment logic
  - [ ] 2.3: Implement OAuth 2.0 connection handling
  - [ ] 2.4: Implement API key connection handling
  - [ ] 2.5: Implement connection pooling and caching
  - [ ] 2.6: Implement connection health monitoring

- [ ] Task 3: Data Flow Executor (AC: 2)
  - [ ] 3.1: Implement data extraction from source tool
  - [ ] 3.2: Apply transformation maps from Schema Analyzer
  - [ ] 3.3: Implement data injection to target tool
  - [ ] 3.4: Validate data integrity after transformation
  - [ ] 3.5: Handle streaming data flows for large payloads

- [ ] Task 4: Connection Testing Framework (AC: 3)
  - [ ] 4.1: Implement connection health check
  - [ ] 4.2: Implement authentication validation
  - [ ] 4.3: Implement schema compatibility verification
  - [ ] 4.4: Generate plain-English error explanations
  - [ ] 4.5: Implement parallel connection testing

- [ ] Task 5: Chain Execution Pipeline (AC: 1, 2, 3)
  - [ ] 5.1: Orchestrate multi-tool chain connections
  - [ ] 5.2: Manage execution order and dependencies
  - [ ] 5.3: Handle partial execution and rollback
  - [ ] 5.4: Track execution metrics (latency, success rate)
  - [ ] 5.5: Generate execution report

- [ ] Task 6: Database Schema for Connections (AC: 1, 3)
  - [ ] 6.1: Create `integration_connections` Supabase table
  - [ ] 6.2: Store connection configurations
  - [ ] 6.3: Track connection health metrics
  - [ ] 6.4: Add RLS policies

- [ ] Task 7: React Hook for Dynamic Connector (AC: 1, 2, 3)
  - [ ] 7.1: Create `useDynamicConnector` hook
  - [ ] 7.2: Provide connection status and progress
  - [ ] 7.3: Expose connection testing functionality
  - [ ] 7.4: Handle error states with user-friendly messages

- [ ] Task 8: Unit Tests (Target: 90%)
  - [ ] 8.1: Test connection establishment for OAuth
  - [ ] 8.2: Test connection establishment for API key
  - [ ] 8.3: Test data transformation application
  - [ ] 8.4: Test connection testing framework
  - [ ] 8.5: Test chain execution pipeline
  - [ ] 8.6: Test error handling and recovery

## Dev Notes

### Existing Patterns to Follow

**IntegrationSchemaAnalyzerService Pattern** [Source: nexus/src/services/IntegrationSchemaAnalyzerService.ts]
- Follow singleton pattern with class instance export
- Use same caching approach for connections
- Consume TransformationMap from schema analyzer
- Follow error handling patterns

**Tool Types** [Source: nexus/src/types/tools.ts]
- Extend existing connection types
- Follow naming conventions (camelCase properties)
- Use Supabase row converters pattern

### Connection Architecture

```
Tool Chain: [Shopify] -> [Transform] -> [Slack]
    |
    v
Connection Manager:
  1. Establish Shopify connection (OAuth)
  2. Validate authentication
  3. Test data extraction
    |
    v
Data Flow Executor:
  1. Extract data from Shopify
  2. Apply transformation map
  3. Inject data to Slack
    |
    v
Execution Complete with metrics
```

### Authentication Methods

| Auth Type | Implementation | Priority |
|-----------|----------------|----------|
| OAuth 2.0 | Token refresh, PKCE flow | Primary |
| API Key | Header injection | Secondary |
| Bearer Token | Authorization header | Tertiary |
| Basic Auth | Base64 encoding | Fallback |
| MCP Server | Delegate to Story 16.7 | Future |

### Connection States

```typescript
type ConnectionState =
  | 'disconnected'    // No connection
  | 'connecting'      // Establishing connection
  | 'authenticating'  // Validating credentials
  | 'testing'         // Running health check
  | 'connected'       // Ready for data flow
  | 'active'          // Currently executing
  | 'error'           // Connection failed
  | 'stale'           // Needs reconnection
```

### Performance Requirements

- Connection establishment: < 2 seconds per tool
- Data transformation: < 100ms per record
- Chain execution: < 5 seconds overhead for 5-tool chain
- Connection test: < 500ms per tool
- First attempt success rate: 99% (NFR-16.2.1)

### Error Classification

| Error Type | Code | Retry | User Message |
|------------|------|-------|--------------|
| AUTH_EXPIRED | 401 | Yes | "Your authorization has expired. Reconnecting..." |
| RATE_LIMITED | 429 | Yes | "Service is busy. Retrying in a moment..." |
| SERVICE_DOWN | 503 | Yes | "Service temporarily unavailable. Retrying..." |
| INVALID_CONFIG | 400 | No | "Configuration error: [details]" |
| SCHEMA_MISMATCH | 422 | No | "Data format mismatch: [details]" |
| NETWORK_ERROR | 0 | Yes | "Network issue. Checking connection..." |

### Database Schema (integration_connections)

```sql
CREATE TABLE integration_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Tool identification
  tool_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,

  -- Connection configuration
  auth_type TEXT NOT NULL,        -- 'oauth2', 'api_key', 'bearer', 'basic'
  config JSONB NOT NULL,          -- Auth config (encrypted)
  endpoints JSONB DEFAULT '{}',   -- API endpoints

  -- Connection state
  status TEXT DEFAULT 'disconnected',
  last_connected_at TIMESTAMPTZ,
  last_tested_at TIMESTAMPTZ,

  -- Health metrics
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  avg_latency_ms INTEGER,

  -- Ownership
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES auth.users(id),

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_connections_tool ON integration_connections(tool_id);
CREATE INDEX idx_connections_project ON integration_connections(project_id);
CREATE INDEX idx_connections_status ON integration_connections(status);
```

### Integration Points

- **IntegrationSchemaAnalyzerService**: Receives TransformationMaps for data flow
- **ToolCatalogService**: Gets tool authentication requirements
- **Story 16.6 (Self-Healing)**: Reports errors for automatic resolution
- **Story 16.7 (MCP)**: Delegates MCP-available tools for seamless auth
- **Story 16.8 (Controller)**: Provides execution callbacks

## Technical Design

### Connection Establishment Flow

```
1. Load tool configuration from catalog
2. Determine auth type (OAuth, API key, etc.)
3. Validate existing credentials (if any)
4. Establish new connection if needed:
   a. OAuth: Initiate flow or refresh token
   b. API Key: Validate key format
   c. Basic: Encode credentials
5. Test connection with health check
6. Cache connection for reuse
7. Return connection handle
```

### Data Flow Execution

```typescript
async function executeDataFlow(
  sourceConnection: IntegrationConnection,
  targetConnection: IntegrationConnection,
  transformationMap: TransformationMap
): Promise<DataFlowResult> {
  // 1. Extract data from source
  const sourceData = await extractData(sourceConnection)

  // 2. Apply transformations
  const transformedData = applyTransformations(sourceData, transformationMap)

  // 3. Validate transformed data
  validateDataIntegrity(transformedData, targetConnection.schema)

  // 4. Inject to target
  const result = await injectData(targetConnection, transformedData)

  return {
    success: true,
    recordsProcessed: sourceData.length,
    latencyMs: endTime - startTime
  }
}
```

### Chain Execution Strategy

```
Chain: [A] -> [B] -> [C] -> [D]

1. Pre-flight checks:
   - Test all connections in parallel
   - Validate all transformation maps
   - Estimate total execution time

2. Execution phases:
   Phase 1: A -> B (connection 1)
   Phase 2: B -> C (connection 2)
   Phase 3: C -> D (connection 3)

3. Error handling:
   - Transient: Retry with exponential backoff
   - Permanent: Stop, notify, return partial results

4. Completion:
   - Generate execution report
   - Update success metrics
   - Clean up temporary data
```

## References

- [Source: nexus/src/services/IntegrationSchemaAnalyzerService.ts] - TransformationMap consumption
- [Source: nexus/src/types/tools.ts] - Tool and chain types
- [Source: _bmad-output/planning-artifacts/epics.md#Story-16.5] - Acceptance criteria

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

### Completion Notes List

### File List

