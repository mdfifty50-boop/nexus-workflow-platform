# Story 16.4: Integration Schema Analyzer

Status: done

## Story

As a **Nexus system**,
I want **to analyze data schemas between tools in a chain and plan transformations**,
So that **data flows correctly between services with different formats**.

## Acceptance Criteria

### AC1: Schema Analysis
**Given** a tool chain with two or more tools
**When** the schema analyzer examines the chain
**Then** it identifies input/output schemas for each tool
**And** detects schema mismatches that require transformation

### AC2: Transformation Planning
**Given** schemas are incompatible between two tools
**When** the analyzer plans the transformation
**Then** it generates a transformation map (field mappings, type conversions, default values)
**And** preserves data integrity with zero loss (NFR-16.2.3)

### AC3: Transformation Generation
**Given** a transformation is planned
**When** the chain is approved for execution
**Then** transformation logic is generated and ready for the Dynamic Integration Connector

## Tasks / Subtasks

- [x] Task 1: Schema Analysis Types & Interfaces (AC: 1, 2, 3)
  - [x] 1.1: Define `SchemaAnalysisResult` interface
  - [x] 1.2: Define `TransformationMap` interface
  - [x] 1.3: Define `FieldMapping` interface with conversion types
  - [x] 1.4: Define `TransformationRule` interface
  - [x] 1.5: Add types to `src/types/tools.ts`

- [x] Task 2: Integration Schema Analyzer Service (AC: 1, 2)
  - [x] 2.1: Create `src/services/IntegrationSchemaAnalyzerService.ts`
  - [x] 2.2: Implement schema extraction from tool definitions
  - [x] 2.3: Implement schema comparison algorithm
  - [x] 2.4: Detect type mismatches, missing fields, format differences
  - [x] 2.5: Generate confidence scores for transformations

- [x] Task 3: Transformation Planner (AC: 2)
  - [x] 3.1: Implement field mapping discovery (exact match, fuzzy match, semantic match)
  - [x] 3.2: Generate type conversion rules
  - [x] 3.3: Generate format transformation rules (date formats, currency, etc.)
  - [x] 3.4: Handle nested object transformations
  - [x] 3.5: Generate default values for missing required fields

- [x] Task 4: Transformation Code Generator (AC: 3)
  - [x] 4.1: Generate TypeScript transformation functions
  - [x] 4.2: Include type guards and validation
  - [x] 4.3: Add error handling for invalid data
  - [x] 4.4: Generate bidirectional transformations where applicable

- [x] Task 5: Chain Analysis Pipeline (AC: 1, 2, 3)
  - [x] 5.1: Analyze entire chain in sequence
  - [x] 5.2: Propagate schema changes through chain
  - [x] 5.3: Generate comprehensive transformation report
  - [x] 5.4: Calculate transformation complexity score

- [ ] Task 6: Database Schema for Transformation Maps (AC: 3)
  - [ ] 6.1: Create `transformation_maps` Supabase table
  - [ ] 6.2: Store transformation rules with tool pair associations
  - [ ] 6.3: Cache successful transformations for reuse
  - [ ] 6.4: Add RLS policies

- [ ] Task 7: React Hook for Schema Analysis (AC: 1, 2)
  - [ ] 7.1: Create `useSchemaAnalyzer` hook
  - [ ] 7.2: Provide analysis results with loading states
  - [ ] 7.3: Expose transformation preview functionality
  - [ ] 7.4: Handle error states

- [ ] Task 8: Unit Tests (Target: 95%)
  - [ ] 8.1: Test schema extraction from various tool types
  - [ ] 8.2: Test transformation planning accuracy
  - [ ] 8.3: Test code generation correctness
  - [ ] 8.4: Test data integrity preservation
  - [ ] 8.5: Test nested object handling
  - [ ] 8.6: Test edge cases (empty schemas, circular references)

## Dev Notes

### Existing Patterns to Follow

**ToolChainOptimizerService Pattern** [Source: nexus/src/services/ToolChainOptimizerService.ts]
- Follow singleton pattern with class instance export
- Use same caching approach
- Integrate with existing DataFlowCompatibility type
- Extend existing transformation detection

**Tool Types** [Source: nexus/src/types/tools.ts]
- Extend existing DataFlowCompatibility interface
- Follow naming conventions (camelCase properties)
- Use Supabase row converters pattern

### Schema Analysis Algorithm

```
1. Extract schemas from tool definitions:
   a. Parse tool inputSchema and outputSchema
   b. Handle nested objects recursively
   c. Detect required vs optional fields

2. Compare source and target schemas:
   a. Exact field name matches
   b. Fuzzy matches (case-insensitive, underscore vs camelCase)
   c. Semantic matches (e.g., 'email' -> 'emailAddress')

3. Generate transformation rules:
   a. Direct mappings (same name, same type)
   b. Type conversions (string -> number, date -> timestamp)
   c. Format transforms (ISO date -> Unix timestamp)
   d. Default value assignments
   e. Computed fields (concatenation, extraction)

4. Validate transformation completeness:
   a. All required target fields must be mapped
   b. No data loss for critical fields
   c. Type safety guaranteed
```

### Type Conversion Rules

| Source Type | Target Type | Conversion Method |
|-------------|-------------|-------------------|
| string | number | parseFloat/parseInt with NaN handling |
| number | string | toString() |
| string | boolean | 'true'/'1' -> true |
| boolean | string | toString() |
| string | Date | new Date(string) with validation |
| Date | string | toISOString() |
| object | string | JSON.stringify() |
| string | object | JSON.parse() with error handling |

### Fuzzy Matching Rules

```typescript
// Field name variations to consider
const variations = [
  'email' -> ['email', 'emailAddress', 'email_address', 'e_mail', 'userEmail'],
  'firstName' -> ['firstName', 'first_name', 'firstname', 'fname', 'givenName'],
  'createdAt' -> ['createdAt', 'created_at', 'createDate', 'dateCreated', 'timestamp']
]
```

### Performance Requirements

- Schema analysis: < 500ms per tool pair
- Transformation generation: < 200ms per rule
- Full chain analysis: < 2 seconds for 10-step chain
- Cache hit ratio: > 80% for repeated tool pairs

### Database Schema (transformation_maps)

```sql
CREATE TABLE transformation_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Tool pair identification
  source_tool_id TEXT NOT NULL,
  target_tool_id TEXT NOT NULL,

  -- Transformation data
  field_mappings JSONB NOT NULL,        -- Array of {source, target, type}
  type_conversions JSONB DEFAULT '[]',  -- Array of conversion rules
  default_values JSONB DEFAULT '{}',    -- Default values for missing fields

  -- Generated code
  transform_function TEXT,              -- Generated TypeScript code
  reverse_function TEXT,                -- Reverse transformation if available

  -- Metrics
  confidence_score NUMERIC(3,2),        -- 0.00-1.00
  usage_count INTEGER DEFAULT 0,
  success_rate NUMERIC(3,2) DEFAULT 1.00,

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

CREATE UNIQUE INDEX idx_transform_maps_pair ON transformation_maps(source_tool_id, target_tool_id);
CREATE INDEX idx_transform_maps_confidence ON transformation_maps(confidence_score DESC);
```

### Integration Points

- **ToolChainOptimizerService**: Receives chain for analysis
- **ToolCatalogService**: Gets tool schema definitions
- **Story 16.5 (Dynamic Connector)**: Consumes transformation maps for execution
- **Story 16.6 (Self-Healing)**: Notifies of schema drift issues

## Technical Design

### Schema Analysis Flow

```
Tool Chain: [Shopify Orders] -> [Data Transform] -> [Slack Message]
    |
    v
Schema Extraction:
  Shopify Output: { orderId: string, customer: { email: string, name: string }, total: number }
  Slack Input: { channel: string, text: string, attachments: object[] }
    |
    v
Transformation Planning:
  Field Mappings:
    - customer.email -> (computed in text template)
    - customer.name -> (computed in text template)
    - total -> (computed in text template)
  Generated Template:
    text: "New order from {{customer.name}} ({{customer.email}}) - ${{total}}"
    |
    v
Transformation Code:
  function transform(shopifyOrder) {
    return {
      channel: '#sales',
      text: `New order from ${shopifyOrder.customer.name} (${shopifyOrder.customer.email}) - $${shopifyOrder.total}`,
      attachments: [{
        title: `Order #${shopifyOrder.orderId}`,
        fields: [...]
      }]
    }
  }
```

### Confidence Score Calculation

```
confidence = (
  exactMatches * 1.0 +
  fuzzyMatches * 0.8 +
  semanticMatches * 0.6 +
  typeConversions * 0.4
) / totalTargetFields

// Penalties
confidence -= missingRequiredFields * 0.2
confidence -= typeConflicts * 0.1
```

## References

- [Source: nexus/src/services/ToolChainOptimizerService.ts] - Data flow compatibility
- [Source: nexus/src/types/tools.ts] - Tool and chain types
- [Source: _bmad-output/planning-artifacts/epics.md#Story-16.4] - Acceptance criteria

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

### Completion Notes List

### File List

