# Story 16.6: Integration Self-Healing System

## Story

As a **Nexus system**,
I want **to automatically detect and resolve integration issues during execution**,
So that **workflows complete successfully without user intervention for transient errors**.

## Status

**Status:** Done
**Epic:** Epic 16 - Intelligent Agent Skills
**Created:** 2026-01-09
**Completed:** 2026-01-09

## Acceptance Criteria

### AC1: Error Detection and Classification
**Given** an integration error occurs during workflow execution
**When** the self-healing system detects the error
**Then** it classifies the error (transient vs permanent, authentication vs data vs rate-limit)
**And** attempts automatic resolution based on error type

### AC2: Transient Error Resolution
**Given** a transient error (timeout, rate limit, temporary unavailability)
**When** the system attempts resolution
**Then** it implements exponential backoff retry (max 3 attempts)
**And** resolves 95% of transient errors automatically (NFR-16.2.2)

### AC3: Authentication Error Handling
**Given** an authentication error occurs
**When** the system detects token expiration
**Then** it automatically refreshes OAuth tokens via MCP or direct OAuth
**And** retries the failed operation

### AC4: Human Escalation
**Given** error resolution fails after max retries
**When** the system cannot self-heal
**Then** it pauses execution and requests human decision (FR-16.5.2)
**And** provides clear explanation of what went wrong and options available

## Tasks

### Task 1: Self-Healing Types & Interfaces
- [ ] Define `HealingAttempt` interface for tracking healing operations
- [ ] Define `HealingResult` interface for resolution outcomes
- [ ] Define `HealingStrategy` type for different healing approaches
- [ ] Define `CircuitBreakerState` for circuit breaker pattern
- [ ] Define `ErrorPattern` for learned error patterns
- [ ] Add healing-specific error classification extensions

### Task 2: IntegrationSelfHealingService Implementation
- [ ] Implement `detectError()` - Error detection from execution results
- [ ] Implement `classifyError()` - Enhanced error classification
- [ ] Implement `attemptHealing()` - Main healing orchestration
- [ ] Implement `executeWithRetry()` - Exponential backoff retry logic
- [ ] Implement `refreshAuthentication()` - OAuth token refresh
- [ ] Implement `handleRateLimit()` - Rate limit specific handling
- [ ] Implement `handleSchemaError()` - Schema drift recovery
- [ ] Implement `circuitBreaker()` - Circuit breaker pattern implementation
- [ ] Implement `learnFromResolution()` - Pattern learning for future healing
- [ ] Implement `escalateToHuman()` - Human decision request

### Task 3: useSelfHealing React Hook
- [ ] Implement `useSelfHealing` hook for monitoring healing status
- [ ] Implement `useHealingProgress` hook for UI updates
- [ ] Add real-time healing status updates

### Task 4: Unit Tests with Chaos Testing
- [ ] Test transient error detection and classification
- [ ] Test exponential backoff retry logic
- [ ] Test OAuth token refresh flow
- [ ] Test rate limit handling with backoff
- [ ] Test schema drift recovery
- [ ] Test circuit breaker patterns
- [ ] Test human escalation trigger
- [ ] Chaos test: Network timeouts
- [ ] Chaos test: Auth token expiration mid-workflow
- [ ] Chaos test: Schema drift (unexpected fields)
- [ ] Chaos test: Rate limit triggers
- [ ] Chaos test: Partial response handling

### Task 5: Exports & Integration
- [ ] Export service from services/index.ts
- [ ] Export hooks from hooks/index.ts
- [ ] Integrate with DynamicIntegrationConnectorService

## Dev Notes

### Architecture
```
IntegrationSelfHealingService
├── Error Detection Layer
│   ├── detectError() - Identify errors from responses
│   ├── classifyError() - Categorize by type and recoverability
│   └── analyzeErrorPattern() - Match to known patterns
├── Healing Strategy Layer
│   ├── selectStrategy() - Choose appropriate healing approach
│   ├── retryStrategy - Exponential backoff retries
│   ├── refreshStrategy - Token/credential refresh
│   ├── reroute Strategy - Alternative tool selection
│   └── schemaStrategy - Schema adaptation
├── Execution Layer
│   ├── executeWithRetry() - Managed retry execution
│   ├── circuitBreaker() - Prevent cascade failures
│   └── timeout management - Prevent hanging operations
├── Learning Layer
│   ├── learnFromResolution() - Store successful patterns
│   ├── patternMatching() - Apply learned solutions
│   └── confidenceScoring() - Rate pattern matches
└── Escalation Layer
    ├── shouldEscalate() - Determine when human needed
    ├── buildEscalation() - Create user-friendly explanation
    └── presentOptions() - Actionable choices for user
```

### Healing Strategies

1. **Retry Strategy** (for transient errors)
   - Initial delay: 1 second
   - Backoff multiplier: 2x
   - Max retries: 3
   - Max delay: 30 seconds
   - Jitter: ±20% to prevent thundering herd

2. **Token Refresh Strategy** (for auth errors)
   - Detect token expiration
   - Use refresh token if available
   - Fall back to MCP re-auth
   - Cache new tokens

3. **Rate Limit Strategy**
   - Parse Retry-After header
   - Respect rate limit windows
   - Implement sliding window tracking
   - Queue requests when near limit

4. **Schema Drift Strategy**
   - Detect unexpected fields
   - Map to closest known schema
   - Use flexible parsing
   - Log drift for catalog update

### Circuit Breaker States
- **Closed**: Normal operation, allow requests
- **Open**: Too many failures, block requests (fail fast)
- **Half-Open**: Testing recovery, allow limited requests

### Error Classification Matrix

| Error Type | Transient | Retryable | Strategy | Max Attempts |
|------------|-----------|-----------|----------|--------------|
| TIMEOUT | Yes | Yes | Retry with backoff | 3 |
| RATE_LIMITED | Yes | Yes | Wait + Retry | 3 |
| SERVICE_DOWN | Yes | Yes | Retry + Reroute | 3 |
| AUTH_EXPIRED | No | Yes | Token refresh | 2 |
| AUTH_INVALID | No | No | Escalate | 0 |
| SCHEMA_MISMATCH | No | Yes | Schema adapt | 2 |
| NETWORK_ERROR | Yes | Yes | Retry with backoff | 3 |
| PERMISSION_DENIED | No | No | Escalate | 0 |
| NOT_FOUND | No | No | Escalate | 0 |
| INTERNAL_ERROR | Maybe | Yes | Retry | 2 |

### NFR Targets
- NFR-16.2.2: 95% transient error auto-resolution
- Circuit breaker: 5 failures in 60s triggers open
- Half-open recovery: 30 seconds
- Max healing time: 120 seconds before escalation

### Integration Points
- Uses `classifyConnectionError()` from tools.ts
- Extends `DynamicIntegrationConnectorService` healing capabilities
- Reports healing events via existing SSE infrastructure
- Logs healing patterns to Supabase for learning

## Dependencies

- Story 16.5: Dynamic Integration Connector (completed)
- Story 16.4: Integration Schema Analyzer (completed)
- Existing error classification system in tools.ts
