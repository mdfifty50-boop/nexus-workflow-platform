# Story 16.9: Tool Chain Visualization in Workflow Map

## Story

As a **Nexus user**,
I want **to see my tool chain visualized in the n8n-style workflow map with real-time progress**,
So that **I understand what's happening during autonomous execution**.

## Status

**Status:** Done
**Epic:** Epic 16 - Intelligent Agent Skills
**Created:** 2026-01-09
**Completed:** 2026-01-09

## Acceptance Criteria

### AC1: Tool Chain Node Rendering
**Given** a tool chain is designed by the optimizer
**When** the workflow map renders
**Then** each tool appears as a node with: tool name, icon, expected action
**And** connections between tools show data flow direction

### AC2: New Node Types
**Given** a tool chain is rendered in the workflow map
**When** displaying nodes
**Then** use new node types: Tool Node (rounded rectangle), Transform Node (diamond), MCP Connector (lightning badge)

### AC3: Real-Time Progress Updates (FR-16.5.3)
**Given** a workflow is executing autonomously
**When** progress updates occur
**Then** the map updates in real-time (< 500ms latency per existing NFR)
**And** active nodes show progress percentage and plain-English status messages

### AC4: Self-Healing Status
**Given** an integration issue occurs during execution
**When** the self-healing system is working
**Then** the affected node shows amber "self-healing" status with reassuring language
**And** displays: "Resolving connection issue... Attempt 2/3"

### AC5: Completion Status
**Given** execution completes successfully
**When** user views the workflow map
**Then** all nodes show green "completed" status
**And** user can tap any node to see detailed execution log

## Tasks

### Task 1: Tool Chain Visualization Types & Interfaces
- [x] Define `ToolChainNode` interface for node representation
- [x] Define `ToolChainEdge` interface for connections
- [x] Define `ToolChainLayout` interface for positioning
- [x] Define `NodeStatus` type for execution states
- [x] Define `NodeType` type (tool, transform, mcp_connector)
- [x] Define `VisualizationConfig` interface for rendering options

### Task 2: ToolChainVisualizationService Implementation
- [x] Implement `buildChainLayout()` - Convert chain to visual layout
- [x] Implement `calculateNodePositions()` - Auto-layout algorithm
- [x] Implement `updateNodeStatus()` - Real-time status updates
- [x] Implement `getNodeDetails()` - Detailed node information
- [x] Implement `subscribeToUpdates()` - Real-time subscription
- [x] Implement `getExecutionPath()` - Highlight active path
- [x] Implement `calculateEdgeRoutes()` - Edge routing for connections

### Task 3: React Components
- [x] Create `ToolChainMap` - Main visualization container
- [x] Create `ToolNode` - Rounded rectangle tool node
- [x] Create `TransformNode` - Diamond-shaped transform node
- [x] Create `MCPConnectorBadge` - Lightning badge for MCP connections
- [x] Create `ChainEdge` - Data flow connection lines
- [x] Create `NodeStatusBadge` - Status indicator component
- [x] Create `NodeProgressBar` - Progress visualization
- [x] Create `NodeDetailsPanel` - Execution log panel

### Task 4: useToolChainVisualization React Hooks
- [x] Implement `useToolChainVisualization` hook for chain rendering
- [x] Implement `useNodeStatus` hook for real-time node status
- [x] Implement `useChainProgress` hook for overall progress
- [x] Implement `useNodeDetails` hook for detailed log viewing
- [x] Implement `useSelfHealingStatus` hook for healing visualization

### Task 5: Unit Tests
- [x] Test chain layout generation
- [x] Test node positioning algorithm
- [x] Test real-time status updates (< 500ms)
- [x] Test node type rendering
- [x] Test self-healing status display
- [x] Test completion status
- [x] Test edge routing
- [x] Test node detail panel

### Task 6: Exports & Integration
- [x] Export service from services/index.ts
- [x] Export hooks from hooks/index.ts
- [x] Export components from components/index.ts
- [x] Integrate with AutonomousExecutionControllerService

## Dev Notes

### Architecture
```
ToolChainVisualizationService
├── Layout Engine
│   ├── buildChainLayout() - Convert chain to visual format
│   ├── calculateNodePositions() - Auto-layout algorithm
│   ├── calculateEdgeRoutes() - Route edges between nodes
│   └── optimizeLayout() - Minimize edge crossings
├── Status Manager
│   ├── updateNodeStatus() - Update node execution status
│   ├── trackProgress() - Track execution progress
│   ├── showHealingStatus() - Self-healing visualization
│   └── markCompleted() - Completion status
├── Real-Time Updates
│   ├── subscribeToUpdates() - SSE subscription
│   ├── handleProgressUpdate() - Process progress events
│   └── throttleUpdates() - Ensure < 500ms latency
└── Detail Provider
    ├── getNodeDetails() - Execution logs for node
    ├── getExecutionPath() - Active execution path
    └── getChainStatistics() - Overall chain stats
```

### Node Types & Styling
```
Tool Node (Rounded Rectangle)
├── Icon (from tool catalog)
├── Name
├── Status badge
├── Progress bar (when active)
└── Cost indicator (optional)

Transform Node (Diamond)
├── Transform type icon
├── Schema indicator
└── Status badge

MCP Connector (Lightning Badge)
├── Provider icon (Rube/Composio)
├── Connection status
└── Auth indicator
```

### Status Colors
- **Gray**: Pending/Queued
- **Blue**: Active/Running
- **Amber**: Self-healing in progress
- **Green**: Completed successfully
- **Red**: Failed (critical error)

### NFR Targets
- FR-16.5.3: Real-time progress updates
- Update latency: < 500ms
- Smooth animations (60fps)
- Support 20+ node chains

### Integration Points
- Uses `AutonomousExecutionControllerService` for execution state
- Uses `IntegrationSelfHealingService` for healing status
- Uses `ToolCatalogService` for tool metadata
- Integrates with existing workflow map components (Epic 5)

## Dependencies

- Story 16.3: Tool Chain Optimizer (completed) - provides chain data
- Story 16.6: Integration Self-Healing (completed) - healing status
- Story 16.8: Autonomous Execution Controller (completed) - execution state
- Epic 5: Real-Time Workflow Visualization (completed) - base components
