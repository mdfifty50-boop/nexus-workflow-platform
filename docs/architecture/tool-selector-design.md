# Tool Selector Design - Optimal Composio Tool Selection

## Overview

The Tool Selector is a critical component of the Nexus workflow engine that intelligently selects the best Composio tools (from 500+ available) for a given user intent and automatically chains them together with proper input/output mappings.

**Location:** `nexus/src/lib/workflow-engine/tool-selector.ts`

## Architecture

```
┌─────────────────────┐
│   Parsed Intent     │
│  (from parser)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│              Tool Selector Pipeline                     │
│                                                         │
│  1. Identify Candidate Toolkits                        │
│     └─> Category mappings + Entity analysis            │
│                                                         │
│  2. Search for Relevant Tools                          │
│     └─> Semantic search via Rube MCP                   │
│                                                         │
│  3. Rank Tools by Relevance                            │
│     └─> Confidence scoring + Intent matching           │
│                                                         │
│  4. Build Tool Dependencies                            │
│     └─> Read tools → Write tools chain                 │
│                                                         │
│  5. Create Input Mappings                              │
│     └─> Intent entities → Tool parameters              │
│     └─> Context fields → Tool parameters               │
│     └─> Previous step outputs → Next step inputs       │
│                                                         │
│  6. Generate Execution Plan                            │
│     └─> Parallel stages where possible                 │
│     └─> Sequential ordering for dependencies           │
│                                                         │
│  7. Identify Missing Information                       │
│     └─> Required params without mappings               │
│                                                         │
└─────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────┐
│ ToolSelectionResult │
│  - Selected tools   │
│  - Execution plan   │
│  - Input mappings   │
│  - Missing info     │
└─────────────────────┘
```

## Core Types

### ToolSelectionRequest

```typescript
interface ToolSelectionRequest {
  intent: ParsedIntent           // From intent-parser
  userEmail?: string             // For auto-OAuth matching
  maxTools?: number              // Default: 10
  enableParallel?: boolean       // Default: true
  knownFields?: Record<string, unknown>  // From context
}
```

### SelectedTool

```typescript
interface SelectedTool {
  slug: string                   // e.g., GMAIL_SEND_EMAIL
  toolkit: string                // e.g., gmail
  name: string                   // Display name
  description: string
  inputSchema: ToolInputSchema   // Required/optional params
  confidence: number             // 0-1 match quality
  reason: string                 // Why this tool was selected
  stepId: string                 // Unique step identifier
  dependsOn: string[]            // Prerequisite steps
  inputMappings: InputMapping[]  // How to populate inputs
  canRunParallel: boolean        // Can execute in parallel
}
```

### InputMapping

Maps tool parameters to their data sources:

```typescript
interface InputMapping {
  targetParam: string            // Tool's parameter name
  source: 'intent' | 'context' | 'step_output'
  sourcePath: string             // Path to the data
  transform?: string             // Optional transformation
}
```

**Examples:**

1. **From Intent Entity:**
   ```typescript
   {
     targetParam: 'to',
     source: 'intent',
     sourcePath: 'entities.person'
   }
   ```

2. **From User Context:**
   ```typescript
   {
     targetParam: 'location',
     source: 'context',
     sourcePath: 'defaultAddress'
   }
   ```

3. **From Previous Step:**
   ```typescript
   {
     targetParam: 'restaurant_id',
     source: 'step_output',
     sourcePath: 'step_1.data.id'
   }
   ```

## Tool Selection Strategy

### 1. Category-to-Toolkit Mapping

Intent categories map to likely toolkits:

```typescript
const CATEGORY_TO_TOOLKITS = {
  communication: ['gmail', 'slack', 'discord', 'whatsapp'],
  scheduling: ['googlecalendar', 'outlook', 'calendly'],
  shopping: ['shopify', 'amazon', 'stripe'],
  document_analysis: ['claude', 'openai', 'anthropic'],
  // ... more categories
}
```

### 2. Action-to-Operation Mapping

Intent actions map to tool operation types:

```typescript
const ACTION_TO_OPERATIONS = {
  send: ['send', 'create', 'post', 'publish'],
  search: ['search', 'find', 'query', 'list'],
  fetch: ['get', 'fetch', 'retrieve', 'read'],
  // ... more actions
}
```

### 3. Semantic Tool Search

In production, uses Rube MCP's `RUBE_SEARCH_TOOLS`:

```typescript
const result = await mcpClient.call('RUBE_SEARCH_TOOLS', {
  queries: [{
    use_case: 'send email to someone',
    known_fields: 'recipient_email:john@example.com'
  }]
})
```

### 4. Tool Ranking Algorithm

```typescript
function rankTools(tools: SelectedTool[], intent: ParsedIntent) {
  return tools.sort((a, b) => {
    // Primary: Confidence score
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence
    }

    // Secondary: Entity match count
    // Tertiary: Action alignment
    // ...
  })
}
```

## Execution Planning

### Dependency Graph

Tools are organized into stages based on dependencies:

```
Stage 0: [SearchTool, FetchTool]        ← Can run in parallel
         ↓
Stage 1: [FilterTool]                   ← Depends on Stage 0
         ↓
Stage 2: [CreateTool, NotifyTool]      ← Can run in parallel
```

### Parallel Execution

Tools can run in parallel if:
- They have no mutual dependencies
- They don't modify shared resources
- `canRunParallel` flag is true

**Example:**

```typescript
{
  stages: [
    { stage: 0, tools: ['step_1', 'step_2'], parallel: true },
    { stage: 1, tools: ['step_3'], parallel: false },
  ],
  estimatedTimeMs: 4000,
  hasParallelExecution: true
}
```

## Input Mapping Algorithm

### Parameter Mapping Priority

1. **Known Fields** (highest priority)
   - User context values
   - Pre-filled form data

2. **Intent Entities**
   - Extracted from user input
   - High confidence values

3. **Previous Step Outputs**
   - Chained tool results
   - Dynamic values

4. **Default Values** (lowest priority)
   - Tool schema defaults
   - Fallback values

### Common Parameter Patterns

```typescript
// Email parameters
'to', 'recipient', 'recipient_email' → entities.person

// Location parameters
'location', 'address', 'place' → entities.location

// Date/time parameters
'date', 'time', 'datetime', 'start_datetime' → entities.date/time

// Message parameters
'message', 'body', 'content', 'text' → intent.rawInput

// Title parameters
'title', 'subject', 'summary' → intent.rawInput (summarized)
```

## Integration with Workflow Engine

### Usage in Workflow Generation

```typescript
// In workflow-generator.ts
import { toolSelector } from './tool-selector'

async function generateWorkflow(intent: ParsedIntent) {
  // Select optimal tools
  const selection = await toolSelector.selectTools({
    intent,
    userEmail: user.email,
    maxTools: 5,
    enableParallel: true,
  })

  if (!selection.success) {
    throw new Error(selection.error)
  }

  // Convert to workflow steps
  const steps = selection.tools.map(tool => ({
    id: tool.stepId,
    type: 'api_call',
    name: tool.name,
    config: {
      composioTool: tool.slug,
      toolkit: tool.toolkit,
      inputs: resolveInputs(tool.inputMappings, intent),
    },
    dependsOn: tool.dependsOn,
  }))

  return { steps, executionPlan: selection.executionPlan }
}
```

### Usage with Composio Executor

```typescript
// Execute selected tools
for (const stage of executionPlan.stages) {
  if (stage.parallel) {
    // Execute tools in parallel
    await Promise.all(
      stage.tools.map(stepId =>
        composioExecutor.executeTool({
          tool: getToolByStepId(stepId).slug,
          toolkit: getToolByStepId(stepId).toolkit,
          inputs: resolveInputs(stepId, context),
        })
      )
    )
  } else {
    // Execute sequentially
    for (const stepId of stage.tools) {
      await composioExecutor.executeTool({ ... })
    }
  }
}
```

## Error Handling

### Missing Information Detection

```typescript
interface ToolSelectionResult {
  missingInfo: string[]  // e.g., ['Send Email: recipient_email']
}
```

If required parameters have no mapping:
1. Add to `missingInfo` array
2. Set workflow status to 'draft'
3. Prompt user for missing values

### Fallback Strategies

1. **No tools found:** Return error with suggestion
2. **Low confidence:** Add confirmation step
3. **Missing connection:** Provide OAuth URL
4. **Circular dependencies:** Break with heuristics

## Performance Optimization

### Caching Strategy

```typescript
class ToolSelector {
  private mcpTools: Map<string, SelectedTool>  // Tool catalog cache
  private searchCache: Map<string, ToolSelectionResult>  // Query cache
}
```

### Batch Processing

```typescript
// Search multiple toolkits in single MCP call
const results = await mcpClient.call('RUBE_SEARCH_TOOLS', {
  queries: toolkits.map(tk => ({
    use_case: intent.action,
    known_fields: extractKnownFields(intent),
  }))
})
```

## Testing

**Test Coverage:** 10/10 tests passing

Key test scenarios:
- ✅ Email communication intent → Gmail tools
- ✅ Calendar scheduling → Google Calendar tools
- ✅ Document analysis → Claude AI tools
- ✅ Input mapping creation
- ✅ Execution plan generation
- ✅ Missing info detection
- ✅ Known fields integration
- ✅ Tool ranking by confidence
- ✅ Parallel execution planning
- ✅ Toolkit identification from entities

**Run tests:**
```bash
npm test tool-selector
```

## Future Enhancements

### Phase 2 (Production)

1. **Real Rube MCP Integration**
   - Replace mock tools with live RUBE_SEARCH_TOOLS
   - Dynamic tool discovery
   - Real-time schema fetching

2. **Machine Learning Ranking**
   - User preference learning
   - Success rate tracking
   - Semantic similarity scores

3. **Advanced Chaining**
   - Multi-step workflows (3+ tools)
   - Conditional branching
   - Loop detection and handling

4. **Cost Optimization**
   - Tool execution cost estimation
   - Alternative tool suggestions
   - Batch operation optimization

### Phase 3 (Advanced)

1. **Natural Language Explanations**
   - Why each tool was selected
   - Alternative options available
   - Expected outcomes

2. **Visual Workflow Builder**
   - Drag-and-drop tool arrangement
   - Visual dependency graph
   - Live preview

3. **A/B Testing**
   - Multiple execution strategies
   - Performance comparison
   - Success rate optimization

## Related Documentation

- [Intent Parser](./intent-parser-design.md)
- [Workflow Generator](./workflow-generator-design.md)
- [Composio Executor](./composio-executor-design.md)
- [Error Recovery System](./error-recovery-design.md)

## API Reference

See [Tool Selector API](../api/tool-selector.md) for complete API documentation.
