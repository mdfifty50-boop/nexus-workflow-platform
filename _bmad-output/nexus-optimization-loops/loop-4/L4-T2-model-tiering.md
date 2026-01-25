# L4-T2: Intelligent Model Tiering for Cost Reduction

**Agent:** Nova (AI/ML Engineer)
**Status:** IMPLEMENTED
**Date:** 2026-01-12

## Executive Summary

Implemented intelligent model tiering system that routes AI requests to the most cost-effective model based on task complexity. Projected cost reduction: **60-80%** for typical workloads.

## Problem Statement

**Before:** All Claude API calls defaulted to Sonnet ($3/1M tokens), regardless of task complexity. Simple classification tasks that could run on Haiku ($0.25/1M tokens) were consuming expensive Sonnet capacity.

**Impact:** Unnecessary AI costs of 12x for simple tasks.

## Solution Architecture

### Three-Tier Model System

| Tier | Model | Input Cost | Output Cost | Use Cases |
|------|-------|------------|-------------|-----------|
| **Haiku** | claude-3-5-haiku-20241022 | $0.25/1M | $1.25/1M | Classification, extraction, status updates, simple Q&A |
| **Sonnet** | claude-sonnet-4-20250514 | $3.00/1M | $15.00/1M | Workflow planning, code generation, content creation, translation |
| **Opus** | claude-opus-4-20250514 | $15.00/1M | $75.00/1M | Complex reasoning, critical decisions, multi-step analysis |

### Cost Savings Projection

| Task Type | Before (Sonnet) | After (Tiered) | Savings |
|-----------|-----------------|----------------|---------|
| Supervisor Review | $3/1M | $0.25/1M | **92%** |
| Error Translation | $3/1M | $0.25/1M | **92%** |
| Status Updates | $3/1M | $0.25/1M | **92%** |
| Data Extraction | $3/1M | $0.25/1M | **92%** |
| Workflow Planning | $3/1M | $3/1M | 0% |
| Code Generation | $3/1M | $3/1M | 0% |
| SOP Extraction | $3/1M | $15/1M | -400% (quality justified) |

**Net Estimated Savings:** 60-80% for typical workflow execution

## Implementation Details

### Core Files Modified

#### 1. `nexus/server/services/claudeProxy.ts`
Added complete model tiering system:
- `classifyTask()` - Automatic task classification based on prompt analysis
- `getModelForTask()` - Maps task types to appropriate model tiers
- `callClaudeWithTiering()` - Main entry point with automatic routing
- `tieredCalls` - Pre-configured calls for common task types:
  - `tieredCalls.classify()` - Haiku tier
  - `tieredCalls.extract()` - Haiku tier
  - `tieredCalls.statusUpdate()` - Haiku tier
  - `tieredCalls.planWorkflow()` - Sonnet tier
  - `tieredCalls.generateCode()` - Sonnet tier
  - `tieredCalls.generateContent()` - Sonnet tier
  - `tieredCalls.complexReasoning()` - Opus tier
  - `tieredCalls.criticalDecision()` - Opus tier

#### 2. `nexus/server/services/errorRecoveryService.ts`
- Error translation now uses `tieredCalls.extract()` (Haiku)
- 12x cost reduction for error handling

#### 3. `nexus/server/services/agentCoordinator.ts`
- Agent task execution uses `callClaudeWithTiering()` with automatic classification
- Supervisor reviews use `tieredCalls.classify()` (Haiku)
- Pass/fail decisions don't need expensive models

#### 4. `nexus/server/services/bmadOrchestrator.ts`
- Workflow planning uses `tieredCalls.planWorkflow()` (Sonnet)
- Agent task execution uses intelligent auto-classification
- Metrics recorded for all tiered calls

#### 5. `nexus/server/services/meetingService.ts`
- Translation uses `callClaudeWithTiering()` with `taskType: 'translation'` (Sonnet)
- SOP extraction uses `tieredCalls.complexReasoning()` (Opus) - quality-critical task

### Task Classification Algorithm

```typescript
// Keyword-based scoring with heuristics
const scores = {
  classification: 0,  // Haiku
  simple_qa: 0,       // Haiku
  status_update: 0,   // Haiku
  data_extraction: 0, // Haiku
  workflow_planning: 0,   // Sonnet
  code_generation: 0,     // Sonnet
  content_generation: 0,  // Sonnet
  translation: 0,         // Sonnet
  complex_reasoning: 0,    // Opus
  critical_decision: 0,    // Opus
  multi_step_analysis: 0   // Opus
}

// Heuristics applied:
// - Short prompts (<200 chars) → simple_qa boost
// - JSON in prompt → data_extraction boost
// - Multiple step keywords → workflow_planning boost
// - Long prompts (>2000 chars) with analysis → complex_reasoning boost
```

### Metrics Tracking

Built-in metrics system tracks:
- Total calls per tier
- Cost per tier
- Savings vs Sonnet baseline
- Task type distribution

```typescript
// Get metrics
const metrics = getTieringMetrics()
// {
//   totalCalls: 150,
//   callsByTier: { haiku: 95, sonnet: 50, opus: 5 },
//   totalCostUSD: 0.45,
//   totalSavingsUSD: 2.80,
//   savingsPercentage: 86.1,
//   tierDistribution: { haiku: "63.3%", sonnet: "33.3%", opus: "3.3%" }
// }
```

## Usage Examples

### Explicit Tier Selection
```typescript
// Force Haiku for simple task
const result = await tieredCalls.classify(systemPrompt, userMessage)

// Force Opus for critical decision
const result = await tieredCalls.criticalDecision(systemPrompt, userMessage)
```

### Automatic Classification
```typescript
// Let the system decide based on content
const result = await callClaudeWithTiering({
  systemPrompt: "...",
  userMessage: "Classify this customer intent: ...",
  maxTokens: 500
})
// Will automatically route to Haiku based on "classify" keyword
```

### Override When Needed
```typescript
// Force specific model despite classification
const result = await callClaudeWithTiering({
  systemPrompt: "...",
  userMessage: "...",
  forceModel: 'claude-opus-4-20250514'  // Override
})
```

## Backward Compatibility

- `callClaude()` function unchanged - existing code continues to work
- `callClaudeWithCaching()` function unchanged
- Services can gradually migrate to tiered calls

## Monitoring & Observability

Console logging shows routing decisions:
```
[ModelTiering] Task: classification → Model: haiku (claude-3-5-haiku-20241022)
[ModelTiering] Savings: $0.000825 (vs Sonnet baseline)
```

## Future Enhancements

1. **Learning from feedback** - Adjust routing based on task success rates
2. **User preference override** - Allow users to set quality vs cost preference
3. **A/B testing** - Compare model quality for borderline tasks
4. **Cost budgets** - Per-workflow cost limits that influence tier selection
5. **Batch optimization** - Aggregate small tasks for efficient batching

## Files Changed

| File | Lines Added | Lines Removed |
|------|-------------|---------------|
| `server/services/claudeProxy.ts` | +420 | 0 |
| `server/services/errorRecoveryService.ts` | +12 | -8 |
| `server/services/agentCoordinator.ts` | +18 | -10 |
| `server/services/bmadOrchestrator.ts` | +15 | -8 |
| `server/services/meetingService.ts` | +20 | -12 |

## Verification

To verify the implementation:
1. Run any workflow and check console logs for `[ModelTiering]` messages
2. Call `getTieringMetrics()` to see tier distribution
3. Compare costs before/after for similar workloads

---

**Implementation complete. Estimated 60-80% cost reduction for typical AI workloads.**
