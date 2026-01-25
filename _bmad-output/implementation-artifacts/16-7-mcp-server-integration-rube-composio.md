# Story 16.7: MCP Server Integration (Rube/Composio)

## Story

As a **Nexus system**,
I want **to leverage MCP servers for 500+ pre-authenticated app connections**,
So that **users get seamless integrations without manual OAuth setup**.

## Status

**Status:** Done
**Epic:** Epic 16 - Intelligent Agent Skills
**Created:** 2026-01-09
**Completed:** 2026-01-09

## Acceptance Criteria

### AC1: MCP Server Connection
**Given** a tool in the chain is available via Rube/Composio MCP
**When** the connector needs to establish integration
**Then** it uses MCP server connection with existing OAuth tokens
**And** handles token management automatically (FR-16.4.4)

### AC2: OAuth Fallback
**Given** a tool is not available via MCP
**When** integration is required
**Then** the system falls back to direct OAuth flow (FR-16.4.3)
**And** guides user through authorization if needed

### AC3: Seamless Re-authentication
**Given** MCP connection is available
**When** the user has previously authorized the app
**Then** no additional authentication is required
**And** integration connects within 2 seconds

### AC4: Cost Efficiency
**Given** the system uses MCP for integration
**When** tracking costs
**Then** integration engineering operations stay within $0.25 per connection (NFR-16.4.2)

## Tasks

### Task 1: MCP Integration Types & Interfaces
- [ ] Define `MCPServerConfig` interface for server configuration
- [ ] Define `MCPConnection` interface for active connections
- [ ] Define `MCPToolMapping` interface for tool-to-MCP mapping
- [ ] Define `MCPExecutionResult` interface for operation results
- [ ] Define `MCPAuthState` type for authentication states
- [ ] Define `MCPFallbackStrategy` for when MCP unavailable

### Task 2: MCPServerIntegrationService Implementation
- [ ] Implement `discoverMCPTools()` - Discover available tools from MCP servers
- [ ] Implement `checkMCPAvailability()` - Check if tool available via MCP
- [ ] Implement `connectViaMCP()` - Establish MCP connection
- [ ] Implement `executeTool()` - Execute tool via MCP server
- [ ] Implement `fallbackToDirectOAuth()` - Handle OAuth fallback
- [ ] Implement `refreshMCPToken()` - Handle MCP token refresh
- [ ] Implement `trackConnectionCost()` - Track cost per connection
- [ ] Implement `validateMCPConnection()` - Validate connection health
- [ ] Implement `mapToolToMCP()` - Map catalog tools to MCP tools

### Task 3: useMCPIntegration React Hook
- [ ] Implement `useMCPIntegration` hook for MCP connection management
- [ ] Implement `useMCPTools` hook for available MCP tools
- [ ] Implement `useMCPConnectionStatus` hook for connection monitoring
- [ ] Add real-time MCP status updates

### Task 4: Unit Tests
- [ ] Test MCP tool discovery
- [ ] Test MCP connection establishment
- [ ] Test MCP tool execution
- [ ] Test OAuth fallback mechanism
- [ ] Test token refresh flow
- [ ] Test cost tracking
- [ ] Test connection timeout (2 second SLA)
- [ ] Test connection validation
- [ ] Test tool mapping accuracy

### Task 5: Exports & Integration
- [ ] Export service from services/index.ts
- [ ] Export hooks from hooks/index.ts
- [ ] Integrate with DynamicIntegrationConnectorService

## Dev Notes

### Architecture
```
MCPServerIntegrationService
├── Discovery Layer
│   ├── discoverMCPTools() - Query MCP servers for available tools
│   ├── mapToolToMCP() - Map tool catalog to MCP tool names
│   └── validateToolMapping() - Ensure mapping accuracy
├── Connection Layer
│   ├── connectViaMCP() - Establish MCP connection
│   ├── checkMCPAvailability() - Check tool availability
│   ├── validateMCPConnection() - Health check
│   └── refreshMCPToken() - Token management
├── Execution Layer
│   ├── executeTool() - Execute via MCP
│   ├── handleMCPResponse() - Process results
│   └── trackConnectionCost() - Cost tracking
└── Fallback Layer
    ├── fallbackToDirectOAuth() - Direct OAuth flow
    ├── guideUserAuth() - User authorization
    └── syncAuthState() - Sync auth across methods
```

### MCP Server Integration

**Rube MCP (rube.app/mcp)**
- OAuth-authenticated web access
- Automatic OAuth flows for connected services
- Token management handled automatically

**Composio MCP**
- 500+ app integrations
- Pre-built tool definitions
- Standardized authentication

### Connection Priority
1. **Primary**: Rube/Composio MCP (fastest, most reliable)
2. **Secondary**: Direct OAuth via existing IntegrationService
3. **Tertiary**: Dynamic API discovery (DynamicIntegrationConnector)

### NFR Targets
- NFR-16.4.2: $0.25 max cost per connection
- Connection establishment: < 2 seconds
- Tool discovery: < 5 seconds
- MCP availability check: < 500ms

### Integration Points
- Extends `DynamicIntegrationConnectorService` with MCP support
- Uses `ToolCatalogService` for tool definitions
- Integrates with `IntegrationSelfHealingService` for error recovery
- Reports via existing SSE infrastructure

## Dependencies

- Story 16.5: Dynamic Integration Connector (completed)
- Story 16.6: Integration Self-Healing System (completed)
- Story 16.1: Tool Catalog Knowledge Base (completed)
- Rube MCP server configuration
- Composio MCP server configuration
