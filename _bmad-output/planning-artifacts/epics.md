---
stepsCompleted: [1, 2, 3, 4]
workflowComplete: true
validationPassed: true
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/architecture.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
  - "_bmad-output/planning-artifacts/epics-and-stories.md"
workflowType: 'epic-addition'
project_name: 'Nexus'
user_name: 'Mohammed'
date: '2026-01-09'
context: 'Adding Epic 16 to completed 15-epic implementation'
---

# Nexus - Epic 16 Addition: Intelligent Agent Skills

## Overview

This document provides the epic and story breakdown for **Epic 16: Intelligent Agent Skills**, adding two powerful AI agent capabilities to the existing Nexus platform. This builds upon the completed Epics 1-15 infrastructure.

## Requirements Inventory

### Functional Requirements

**FR-16.1: Tool Research & Discovery**
FR-16.1.1: System SHALL research and discover available tools/services from pre-approved catalog
FR-16.1.2: System SHALL dynamically discover public APIs and AI services beyond the catalog
FR-16.1.3: System SHALL analyze user workflow goals to determine optimal tool requirements
FR-16.1.4: System SHALL evaluate tools based on: reliability, cost, API quality, user reviews, and compatibility
FR-16.1.5: System SHALL maintain an evolving knowledge base of tools and their capabilities
FR-16.1.6: System SHALL request user approval for tools discovered outside pre-approved catalog

**FR-16.2: Tool Chain Optimization**
FR-16.2.1: System SHALL design optimal chains of tools to achieve user's workflow goals
FR-16.2.2: System SHALL consider data flow compatibility between tools when designing chains
FR-16.2.3: System SHALL optimize chains for cost efficiency (minimize API costs across chain)
FR-16.2.4: System SHALL optimize chains for speed (minimize latency across chain)
FR-16.2.5: System SHALL provide alternative chain options with trade-off explanations
FR-16.2.6: System SHALL predict and display estimated cost and time for proposed chains
FR-16.2.7: System SHALL learn from successful chains to improve future recommendations

**FR-16.3: Dynamic Integration Engineering**
FR-16.3.1: System SHALL automatically connect disparate tools/APIs without manual configuration
FR-16.3.2: System SHALL handle data transformation between services with different schemas
FR-16.3.3: System SHALL detect and resolve integration conflicts automatically
FR-16.3.4: System SHALL implement error handling for each integration point
FR-16.3.5: System SHALL self-heal when integration issues arise during execution
FR-16.3.6: System SHALL ensure zero bugs between any two connected tools
FR-16.3.7: System SHALL test integration connections before workflow execution begins

**FR-16.4: MCP Server Integration**
FR-16.4.1: System SHALL integrate with Rube/Composio MCP servers for 500+ app connectivity
FR-16.4.2: System SHALL leverage existing OAuth connections from MCP servers
FR-16.4.3: System SHALL fall back to direct OAuth when MCP connection unavailable
FR-16.4.4: System SHALL automatically handle token management via MCP

**FR-16.5: Autonomous Execution**
FR-16.5.1: System SHALL execute approved workflows autonomously without further user intervention
FR-16.5.2: System SHALL only pause execution for critical errors requiring human decision
FR-16.5.3: System SHALL provide real-time progress updates during autonomous execution
FR-16.5.4: System SHALL allow user to cancel autonomous execution at any point

### Non-Functional Requirements

**NFR-16.1: Tool Discovery Performance**
NFR-16.1.1: Tool research queries SHALL return results within 5 seconds
NFR-16.1.2: Tool catalog search SHALL support minimum 10,000 indexed tools
NFR-16.1.3: Dynamic API discovery SHALL cache results for 24 hours to minimize redundant searches

**NFR-16.2: Integration Reliability**
NFR-16.2.1: Dynamic integrations SHALL achieve 99% success rate on first connection attempt
NFR-16.2.2: Integration self-healing SHALL resolve 95% of transient errors automatically
NFR-16.2.3: Data transformation between tools SHALL preserve data integrity with zero loss

**NFR-16.3: Chain Optimization Quality**
NFR-16.3.1: Recommended tool chains SHALL be within 20% of optimal cost efficiency
NFR-16.3.2: Chain recommendations SHALL consider user's historical preferences
NFR-16.3.3: System SHALL provide at least 2 alternative chains for complex workflows

**NFR-16.4: Token Efficiency**
NFR-16.4.1: Tool research operations SHALL stay within $0.50 per research session
NFR-16.4.2: Integration engineering operations SHALL stay within $0.25 per connection
NFR-16.4.3: System SHALL cache tool knowledge to minimize repeated LLM queries

**NFR-16.5: Security**
NFR-16.5.1: Tool discovery SHALL only access publicly available API documentation
NFR-16.5.2: Dynamic integrations SHALL use secure OAuth 2.0 or API key authentication
NFR-16.5.3: All integration credentials SHALL be encrypted at rest and in transit

### Additional Requirements

**From Existing Architecture (architecture.md):**
- Must integrate with existing BMAD orchestration adapter pattern (NFR-I3.1)
- Must use orchestration-agnostic workflow state format (NFR-I3.2)
- Must integrate with existing Supabase multi-tenant database with RLS
- Must integrate with existing token accounting service
- Must use existing SSE infrastructure for real-time updates
- Must follow existing error translation pattern (technical → plain English)
- Must integrate with existing Integration Plugin Architecture

**From PRD (prd.md):**
- Must support mobile-first responsive design (375px minimum)
- Must display tool chain visualization in n8n-style workflow map
- Must integrate with existing cross-project intelligence (FR-8)
- Must support user preference learning for tool recommendations
- Results-driven execution (not conversational suggestions)

**From User Requirements (conversation):**
- Primary integration method: MCP servers (Rube/Composio) for user-friendly experience
- Secondary: Direct OAuth for major platforms
- Tertiary: Dynamic API discovery for niche tools
- Tool discovery scope: Both pre-approved catalog AND public APIs dynamically
- User control: Autonomous after workflow approval (minimal intervention)

### FR Coverage Map

| FR | Epic | Story | Description |
|----|------|-------|-------------|
| FR-16.1.1 | Epic 16 | Story 1 | Pre-approved tool catalog |
| FR-16.1.2 | Epic 16 | Story 2 | Dynamic tool discovery |
| FR-16.1.3 | Epic 16 | Story 3 | Analyze workflow goals |
| FR-16.1.4 | Epic 16 | Story 2 | Evaluate tools |
| FR-16.1.5 | Epic 16 | Story 1 | Tool knowledge base |
| FR-16.1.6 | Epic 16 | Story 2 | User approval for new tools |
| FR-16.2.1 | Epic 16 | Story 3 | Design optimal chains |
| FR-16.2.2 | Epic 16 | Story 4 | Data flow compatibility |
| FR-16.2.3 | Epic 16 | Story 3 | Cost optimization |
| FR-16.2.4 | Epic 16 | Story 3 | Speed optimization |
| FR-16.2.5 | Epic 16 | Story 3 | Alternative options |
| FR-16.2.6 | Epic 16 | Story 3 | Cost/time estimates |
| FR-16.2.7 | Epic 16 | Story 3 | Learn from success |
| FR-16.3.1 | Epic 16 | Story 5 | Auto-connect tools |
| FR-16.3.2 | Epic 16 | Story 4 | Data transformation |
| FR-16.3.3 | Epic 16 | Story 6 | Resolve conflicts |
| FR-16.3.4 | Epic 16 | Story 6 | Error handling |
| FR-16.3.5 | Epic 16 | Story 6 | Self-heal |
| FR-16.3.6 | Epic 16 | Story 5 | Zero bugs guarantee |
| FR-16.3.7 | Epic 16 | Story 5 | Test before execution |
| FR-16.4.1 | Epic 16 | Story 7 | MCP server integration |
| FR-16.4.2 | Epic 16 | Story 7 | MCP OAuth leverage |
| FR-16.4.3 | Epic 16 | Story 7 | OAuth fallback |
| FR-16.4.4 | Epic 16 | Story 7 | Token management |
| FR-16.5.1 | Epic 16 | Story 8 | Autonomous execution |
| FR-16.5.2 | Epic 16 | Story 8 | Pause for critical errors |
| FR-16.5.3 | Epic 16 | Story 9 | Real-time progress |
| FR-16.5.4 | Epic 16 | Story 8 | Cancel option |

## Epic List

### Epic 16: Intelligent Agent Skills

**Goal:** Enable Nexus agents to autonomously research optimal tools, design intelligent tool chains, and dynamically integrate those tools bug-free - all executing autonomously after user workflow approval.

**User Outcome:** Users describe their workflow goal once, and Nexus agents:
1. Research the best tools (from catalog + public APIs)
2. Design optimal chains maximizing value while minimizing cost
3. Automatically connect all tools without bugs
4. Execute the entire workflow autonomously

**FRs Covered:** FR-16.1.1 through FR-16.5.4 (all 19 FRs)

**NFRs Addressed:** NFR-16.1 through NFR-16.5 (all 13 NFRs)

**Stories:**
1. Tool Catalog & Knowledge Base Setup
2. Dynamic Tool Discovery Engine
3. Tool Chain Optimizer Agent
4. Integration Schema Analyzer
5. Dynamic Integration Connector
6. Integration Self-Healing System
7. MCP Server Integration (Rube/Composio)
8. Autonomous Execution Controller
9. Tool Chain Visualization in Workflow Map

**Architecture Decision (from Party Mode):**
Epic 16 extends BMAD with two new specialized agents:
- **ToolResearchAgent** (Stories 1-3): Handles tool discovery and chain optimization
- **IntegrationEngineerAgent** (Stories 4-7): Handles schema analysis, connection, and self-healing
- **Autonomous Controller** (Story 8): Orchestrates both agents
- **Visualization** (Story 9): Renders tool chains in workflow map

**Recommended Implementation Order:**
1. Story 1 (catalog + test framework foundation)
2. Story 4 (schema analyzer - data backbone)
3. Story 7 (MCP integration - external dependency early)
4. Stories 2, 3 (research + optimizer)
5. Stories 5, 6 (connector + self-healing)
6. Story 8 (controller)
7. Story 9 (visualization - can parallel earlier)

**Test Coverage Targets:**
| Story | Target | Rationale |
|-------|--------|-----------|
| Story 1 | 90% | Core data layer |
| Story 2 | 80% | External APIs |
| Story 3 | 85% | Algorithm-heavy |
| Story 4 | 95% | Data integrity critical |
| Story 5 | 90% | 99% success NFR |
| Story 6 | 85% | Chaos testing |
| Story 7 | 75% | External dependency |
| Story 8 | 80% | Orchestration |
| Story 9 | 70% | UI/visual |

---

## Epic 16: Intelligent Agent Skills

### Story 16.1: Tool Catalog & Knowledge Base Setup

As a **Nexus platform operator**,
I want **a structured catalog of pre-approved tools with their capabilities, APIs, and integration patterns**,
So that **agents can quickly reference trusted tools without researching from scratch each time**.

**Acceptance Criteria:**

**Given** the system is initialized
**When** an agent needs to find tools for a workflow
**Then** the agent can query a searchable tool catalog with 100+ pre-approved tools
**And** each tool entry contains: name, category, API documentation URL, authentication method, data formats, cost estimates, reliability rating

**Given** a tool is used successfully in a workflow
**When** the workflow completes
**Then** the system updates the tool's knowledge base with learned patterns and success metrics

**Given** a new tool needs to be added to the catalog
**When** an admin approves the tool
**Then** the tool is indexed with full metadata and available for agent queries

**Given** this is the first story in Epic 16
**When** implementing the catalog
**Then** establish greenfield integration test framework under `tests/integration/`
**And** subsequent stories inherit this test structure

---

### Story 16.2: Dynamic Tool Discovery Engine

As a **Nexus user**,
I want **agents to discover new tools beyond the pre-approved catalog when my workflow requires specialized capabilities**,
So that **I'm not limited to pre-configured integrations**.

**Acceptance Criteria:**

**Given** a user workflow requires a capability not in the catalog
**When** the agent searches for tools
**Then** the agent queries public API directories (RapidAPI, ProgrammableWeb, etc.) and AI tool aggregators
**And** returns results within 5 seconds (NFR-16.1.1)

**Given** the agent discovers a tool outside the pre-approved catalog
**When** presenting the tool for approval
**Then** display: tool name, one-liner capability, Trust Score (0-100), and Recommendation badge (✅ Recommended / ⚠️ Use with caution / ❌ Not recommended)
**And** provide one-tap approve button for streamlined UX

**Given** a discovered tool is approved by user
**When** the workflow completes successfully
**Then** the tool is cached for 24 hours (NFR-16.1.3) and optionally added to catalog

---

### Story 16.3: Tool Chain Optimizer Agent

As a **Nexus user**,
I want **an intelligent agent that designs the optimal chain of tools to achieve my workflow goal**,
So that **I get maximum value with minimum cost and time**.

**Acceptance Criteria:**

**Given** a user describes a workflow goal
**When** the optimizer agent analyzes the goal
**Then** the agent identifies required capabilities and maps them to available tools
**And** designs at least 2 alternative chains for complex workflows (NFR-16.3.3)

**Given** the optimizer designs multiple chain alternatives
**When** presenting options to user
**Then** display recommended chain prominently with full details (estimated cost, time, trade-offs)
**And** collapse alternative chains under 'See other options' expandable section
**And** power users can expand to compare all chains side-by-side
**And** recommendations are within 20% of optimal cost efficiency (NFR-16.3.1)

**Given** a chain is selected and executed successfully
**When** the workflow completes
**Then** the system stores the chain pattern for future recommendations (FR-16.2.7)
**And** considers user's historical preferences for similar future workflows (NFR-16.3.2)

---

### Story 16.4: Integration Schema Analyzer

As a **Nexus system**,
I want **to analyze data schemas between tools in a chain and plan transformations**,
So that **data flows correctly between services with different formats**.

**Acceptance Criteria:**

**Given** a tool chain with two or more tools
**When** the schema analyzer examines the chain
**Then** it identifies input/output schemas for each tool
**And** detects schema mismatches that require transformation

**Given** schemas are incompatible between two tools
**When** the analyzer plans the transformation
**Then** it generates a transformation map (field mappings, type conversions, default values)
**And** preserves data integrity with zero loss (NFR-16.2.3)

**Given** a transformation is planned
**When** the chain is approved for execution
**Then** transformation logic is generated and ready for the Dynamic Integration Connector

**Test Coverage:** 95% (data integrity critical)

---

### Story 16.5: Dynamic Integration Connector

As a **Nexus system**,
I want **to automatically connect tools in a chain without manual configuration**,
So that **integrations work bug-free on first attempt**.

**Acceptance Criteria:**

**Given** an approved tool chain with schema transformations planned
**When** the connector establishes integrations
**Then** it connects each tool pair using appropriate authentication (OAuth 2.0 or API key)
**And** achieves 99% success rate on first connection attempt (NFR-16.2.1)

**Given** a connection is established
**When** data flows between tools
**Then** the connector applies schema transformations automatically
**And** ensures zero bugs between any two connected tools (FR-16.3.6)

**Given** a tool chain is ready for execution
**When** the connector prepares the workflow
**Then** it tests all integration connections before execution begins (FR-16.3.7)
**And** reports any connection failures with plain-English explanations

---

### Story 16.6: Integration Self-Healing System

As a **Nexus system**,
I want **to automatically detect and resolve integration issues during execution**,
So that **workflows complete successfully without user intervention for transient errors**.

**Acceptance Criteria:**

**Given** an integration error occurs during workflow execution
**When** the self-healing system detects the error
**Then** it classifies the error (transient vs permanent, authentication vs data vs rate-limit)
**And** attempts automatic resolution based on error type

**Given** a transient error (timeout, rate limit, temporary unavailability)
**When** the system attempts resolution
**Then** it implements exponential backoff retry (max 3 attempts)
**And** resolves 95% of transient errors automatically (NFR-16.2.2)

**Given** an authentication error occurs
**When** the system detects token expiration
**Then** it automatically refreshes OAuth tokens via MCP or direct OAuth
**And** retries the failed operation

**Given** error resolution fails after max retries
**When** the system cannot self-heal
**Then** it pauses execution and requests human decision (FR-16.5.2)
**And** provides clear explanation of what went wrong and options available

**Chaos Testing Required:**
- Network timeouts (simulate slow APIs)
- Auth token expiration mid-workflow
- Schema drift (API returns unexpected fields)
- Rate limit triggers
- Partial response handling

---

### Story 16.7: MCP Server Integration (Rube/Composio)

As a **Nexus system**,
I want **to leverage MCP servers for 500+ pre-authenticated app connections**,
So that **users get seamless integrations without manual OAuth setup**.

**Acceptance Criteria:**

**Given** a tool in the chain is available via Rube/Composio MCP
**When** the connector needs to establish integration
**Then** it uses MCP server connection with existing OAuth tokens
**And** handles token management automatically (FR-16.4.4)

**Given** a tool is not available via MCP
**When** integration is required
**Then** the system falls back to direct OAuth flow (FR-16.4.3)
**And** guides user through authorization if needed

**Given** MCP connection is available
**When** the user has previously authorized the app
**Then** no additional authentication is required
**And** integration connects within 2 seconds

**Given** the system uses MCP for integration
**When** tracking costs
**Then** integration engineering operations stay within $0.25 per connection (NFR-16.4.2)

---

### Story 16.8: Autonomous Execution Controller

As a **Nexus user**,
I want **my approved workflows to execute autonomously without requiring my attention**,
So that **I can focus on other work while Nexus delivers results**.

**Acceptance Criteria:**

**Given** a user approves a workflow with tool chain
**When** execution begins
**Then** the workflow runs autonomously without further user intervention (FR-16.5.1)
**And** only pauses for critical errors requiring human decision (FR-16.5.2)

**Given** a workflow is executing autonomously
**When** the user wants to stop it
**Then** they can cancel execution at any point (FR-16.5.4)
**And** the system gracefully terminates and reports partial results

**Given** autonomous execution encounters a non-critical issue
**When** the self-healing system resolves it
**Then** execution continues without user notification
**And** the resolution is logged for post-execution review

**Given** a workflow completes autonomously
**When** results are ready
**Then** user receives notification with tangible evidence of completion
**And** full execution log is available for review

---

### Story 16.9: Tool Chain Visualization in Workflow Map

As a **Nexus user**,
I want **to see my tool chain visualized in the n8n-style workflow map with real-time progress**,
So that **I understand what's happening during autonomous execution**.

**Acceptance Criteria:**

**Given** a tool chain is designed by the optimizer
**When** the workflow map renders
**Then** each tool appears as a node with: tool name, icon, expected action
**And** connections between tools show data flow direction

**Given** a tool chain is rendered in the workflow map
**When** displaying nodes
**Then** use new node types: Tool Node (rounded rectangle), Transform Node (diamond), MCP Connector (lightning badge)

**Given** a workflow is executing autonomously
**When** progress updates occur
**Then** the map updates in real-time (< 500ms latency per existing NFR)
**And** active nodes show progress percentage and plain-English status messages

**Given** an integration issue occurs during execution
**When** the self-healing system is working
**Then** the affected node shows amber "self-healing" status with reassuring language ('Optimizing connection...')
**And** displays: "Resolving connection issue... Attempt 2/3"

**Given** execution completes successfully
**When** user views the workflow map
**Then** all nodes show green "completed" status
**And** user can tap any node to see detailed execution log

**UX Design Task (Parallel):**
- Wireframes for new Tool/Transform/MCP node types
- Trust Score badge component designs
- 'Recommended chain' UI with collapsed alternatives
- Self-healing status animation specs
- Mobile-responsive considerations

---

## Epic 16 Summary

| Metric | Value |
|--------|-------|
| Total Stories | 9 |
| FRs Covered | 19/19 (100%) |
| NFRs Addressed | 13/13 (100%) |
| New BMAD Agents | 2 (ToolResearchAgent, IntegrationEngineerAgent) |
| Parallel Tracks | UX Design can run alongside Stories 1-8 |
