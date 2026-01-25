# Nexus Platform - Monitoring Requirements

**Version:** 1.0.0
**Date:** January 12, 2026
**Status:** Production Ready

---

## Overview

This document outlines the monitoring, observability, and alerting requirements for the Nexus AI Workflow Automation Platform. Proper monitoring is critical for maintaining platform reliability, identifying issues before users report them, and ensuring optimal performance.

---

## 1. Error Tracking

### 1.1 Recommended Tool: Sentry

**Why Sentry:**
- Real-time error detection
- Source map support for meaningful stack traces
- Release tracking
- Performance monitoring built-in
- Excellent React integration

### 1.2 Implementation

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  tracesSampleRate: 0.1, // 10% of transactions for performance
  replaysSessionSampleRate: 0.1, // 10% session replays
  replaysOnErrorSampleRate: 1.0, // 100% replays on error
})
```

### 1.3 Error Categories to Track

| Category | Severity | Alert Threshold |
|----------|----------|-----------------|
| Authentication failures | High | > 10/min |
| API errors (5xx) | Critical | > 5/min |
| Payment processing errors | Critical | Any |
| Workflow execution failures | Medium | > 20/hour |
| Integration connection failures | Medium | > 10/hour |
| Client-side exceptions | Low | > 100/hour |

### 1.4 Error Context to Capture

```typescript
// Capture user context
Sentry.setUser({
  id: user.id,
  email: user.email,
  plan: user.subscription_tier,
})

// Capture workflow context
Sentry.setContext('workflow', {
  workflowId: workflow.id,
  workflowType: workflow.type,
  projectId: workflow.project_id,
})
```

---

## 2. Analytics

### 2.1 Vercel Analytics (Built-in)

**Enable in Vercel Dashboard:**
1. Go to Project Settings
2. Enable Analytics
3. Enable Web Vitals

**Metrics Tracked:**
- Page views
- Unique visitors
- Geographic distribution
- Device types
- Web Vitals (LCP, FID, CLS, TTFB)

### 2.2 Custom Analytics Events

```typescript
// src/lib/analytics.ts
export const analytics = {
  // User events
  userSignedUp: (method: 'email' | 'google' | 'magic_link') => {
    track('user_signed_up', { method })
  },

  // Project events
  projectCreated: (projectId: string) => {
    track('project_created', { projectId })
  },

  // Workflow events
  workflowCreated: (workflowType: string) => {
    track('workflow_created', { type: workflowType })
  },

  workflowExecuted: (workflowId: string, duration: number, success: boolean) => {
    track('workflow_executed', { workflowId, duration, success })
  },

  // Conversion events
  upgradeStarted: (fromPlan: string, toPlan: string) => {
    track('upgrade_started', { fromPlan, toPlan })
  },

  upgradeCompleted: (plan: string, amount: number) => {
    track('upgrade_completed', { plan, amount })
  },

  // Feature usage
  featureUsed: (featureName: string) => {
    track('feature_used', { feature: featureName })
  },
}
```

### 2.3 Key Metrics to Track

**Acquisition Metrics:**
- Daily/Weekly/Monthly Active Users (DAU/WAU/MAU)
- Sign-up conversion rate
- Traffic sources
- Landing page bounce rate

**Engagement Metrics:**
- Workflows created per user
- Workflows executed per day
- Average session duration
- Feature adoption rates

**Business Metrics:**
- Free to paid conversion rate
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Customer Lifetime Value (LTV)
- Churn rate

---

## 3. Performance Monitoring

### 3.1 Frontend Performance

**Web Vitals Targets:**

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | < 2.5s | 2.5s - 4s | > 4s |
| FID | < 100ms | 100ms - 300ms | > 300ms |
| CLS | < 0.1 | 0.1 - 0.25 | > 0.25 |
| TTFB | < 800ms | 800ms - 1800ms | > 1800ms |

**Implementation:**

```typescript
// src/lib/performance.ts
import { onCLS, onFID, onLCP, onTTFB, onFCP } from 'web-vitals'

function sendToAnalytics(metric: Metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    id: metric.id,
    page: window.location.pathname,
  })

  // Use sendBeacon for reliability
  navigator.sendBeacon('/api/analytics/vitals', body)
}

onCLS(sendToAnalytics)
onFID(sendToAnalytics)
onLCP(sendToAnalytics)
onTTFB(sendToAnalytics)
onFCP(sendToAnalytics)
```

### 3.2 Backend Performance

**API Response Time Targets:**

| Endpoint Category | p50 | p95 | p99 |
|-------------------|-----|-----|-----|
| Authentication | < 200ms | < 500ms | < 1s |
| CRUD operations | < 100ms | < 300ms | < 500ms |
| Workflow execution (start) | < 500ms | < 1s | < 2s |
| Complex queries | < 300ms | < 800ms | < 1.5s |

**Database Query Monitoring:**

```sql
-- Enable pg_stat_statements in Supabase
-- Monitor slow queries (> 100ms)
SELECT
  query,
  calls,
  mean_exec_time,
  max_exec_time,
  rows
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### 3.3 Workflow Execution Performance

```typescript
interface WorkflowMetrics {
  workflowId: string
  startTime: Date
  endTime: Date
  totalDuration: number
  stepDurations: Record<string, number>
  tokensUsed: number
  estimatedCost: number
  success: boolean
  errorDetails?: string
}

// Track in workflow execution
const metrics: WorkflowMetrics = {
  workflowId: workflow.id,
  startTime: new Date(),
  // ... populated during execution
}

// Send to monitoring
await trackWorkflowExecution(metrics)
```

---

## 4. Infrastructure Monitoring

### 4.1 Uptime Monitoring

**Recommended Tool:** Better Uptime, Pingdom, or UptimeRobot

**Endpoints to Monitor:**

| Endpoint | Check Interval | Alert After |
|----------|----------------|-------------|
| `https://nexus-platform.com` | 1 min | 2 failures |
| `https://nexus-platform.com/api/health` | 1 min | 2 failures |
| `https://[project].supabase.co/rest/v1/` | 1 min | 2 failures |

**Health Check Endpoint:**

```typescript
// server/routes/health.ts
router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      anthropic: await checkAnthropicAPI(),
    }
  }

  const isHealthy = Object.values(health.checks).every(c => c.status === 'ok')
  res.status(isHealthy ? 200 : 503).json(health)
})
```

### 4.2 Database Monitoring

**Supabase Dashboard Metrics:**
- Active connections
- Queries per second
- Database size
- Replication lag (if applicable)
- Storage usage

**Custom Alerts:**

| Metric | Warning | Critical |
|--------|---------|----------|
| Connection count | > 80% pool | > 95% pool |
| Query time (avg) | > 200ms | > 500ms |
| Database size | > 80% limit | > 95% limit |
| Failed queries | > 10/min | > 50/min |

### 4.3 Vercel Monitoring

**Available Metrics:**
- Function invocations
- Function duration
- Function errors
- Bandwidth usage
- Edge cache hit ratio

**Alerts to Configure:**
- Function timeout rate > 1%
- Function error rate > 0.5%
- Edge function duration p95 > 1s

---

## 5. Alerting Strategy

### 5.1 Alert Severity Levels

| Level | Response Time | Examples |
|-------|---------------|----------|
| P1 - Critical | < 15 min | Site down, payment processing failed, data breach |
| P2 - High | < 1 hour | Major feature broken, high error rate, degraded performance |
| P3 - Medium | < 4 hours | Non-critical feature issue, elevated error rate |
| P4 - Low | < 24 hours | UI bugs, minor issues, monitoring alerts |

### 5.2 Alert Channels

**P1 - Critical:**
- PagerDuty/Opsgenie immediate notification
- SMS to on-call engineer
- Slack #incidents channel

**P2 - High:**
- PagerDuty/Opsgenie
- Slack #alerts channel
- Email to engineering team

**P3/P4 - Medium/Low:**
- Slack #alerts channel
- Email digest (daily)

### 5.3 Alert Rules

```yaml
# Example Prometheus AlertManager rules (conceptual)
groups:
  - name: nexus-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"

      - alert: SlowResponseTime
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 2
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "95th percentile response time > 2s"

      - alert: WorkflowFailureRate
        expr: rate(workflow_executions_total{status="failed"}[1h]) > 0.1
        for: 30m
        labels:
          severity: warning
        annotations:
          summary: "Workflow failure rate > 10%"
```

---

## 6. Logging Strategy

### 6.1 Log Format

```typescript
interface LogEntry {
  timestamp: string        // ISO 8601
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  service: string          // 'frontend' | 'backend' | 'workflow-engine'
  traceId?: string         // For distributed tracing
  userId?: string          // Redacted/hashed if needed
  metadata?: Record<string, any>
}

// Example
{
  "timestamp": "2026-01-12T10:30:00.000Z",
  "level": "error",
  "message": "Workflow execution failed",
  "service": "workflow-engine",
  "traceId": "abc123",
  "userId": "usr_hash_xxx",
  "metadata": {
    "workflowId": "wf_123",
    "step": "api_call",
    "errorCode": "TIMEOUT"
  }
}
```

### 6.2 Log Levels

| Level | Use Case | Retention |
|-------|----------|-----------|
| DEBUG | Development troubleshooting | 1 day |
| INFO | Normal operations, audit trail | 30 days |
| WARN | Potential issues, degraded state | 90 days |
| ERROR | Failures requiring attention | 1 year |

### 6.3 Sensitive Data Handling

**Always Redact:**
- Full email addresses (show: `j***@example.com`)
- API keys and tokens
- Passwords (never log)
- Credit card numbers
- Personal identification numbers

```typescript
function sanitizeLog(data: any): any {
  const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'authorization']

  if (typeof data === 'object') {
    return Object.entries(data).reduce((acc, [key, value]) => {
      if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
        acc[key] = '[REDACTED]'
      } else {
        acc[key] = sanitizeLog(value)
      }
      return acc
    }, {} as Record<string, any>)
  }
  return data
}
```

---

## 7. Dashboard Requirements

### 7.1 Operations Dashboard

**Real-time Metrics:**
- Active users (current)
- Requests per second
- Error rate (%)
- Average response time
- Active workflow executions

**Charts:**
- Request volume (24h, by hour)
- Error rate trend (7d)
- Response time percentiles (p50, p95, p99)
- User signups (30d)

### 7.2 Business Dashboard

**Key Metrics:**
- Total users
- Monthly active users (MAU)
- Workflows executed (monthly)
- Revenue (MRR)
- Conversion rate (free to paid)

**Charts:**
- User growth trend
- Revenue growth
- Plan distribution
- Feature usage heatmap

### 7.3 Workflow Performance Dashboard

**Metrics:**
- Workflows executed (daily)
- Success rate
- Average execution time
- Token usage (daily)
- Estimated AI costs

**Charts:**
- Execution volume by workflow type
- Failure reasons breakdown
- Cost per workflow trend
- Integration usage distribution

---

## 8. Implementation Checklist

### Phase 1: Essential (Pre-Launch)
- [ ] Sentry error tracking configured
- [ ] Basic uptime monitoring
- [ ] Health check endpoint
- [ ] Critical alert rules (P1)
- [ ] Vercel Analytics enabled

### Phase 2: Enhanced (Week 2)
- [ ] Custom analytics events
- [ ] Performance monitoring (Web Vitals)
- [ ] Database query monitoring
- [ ] Medium priority alerts (P2/P3)
- [ ] Operations dashboard

### Phase 3: Advanced (Month 1)
- [ ] Full distributed tracing
- [ ] Business metrics dashboard
- [ ] Workflow performance dashboard
- [ ] Automated anomaly detection
- [ ] Log aggregation service

---

## 9. Recommended Tools Stack

| Category | Recommended | Alternatives |
|----------|-------------|--------------|
| Error Tracking | Sentry | Bugsnag, Rollbar |
| Analytics | Vercel Analytics + Mixpanel | Amplitude, PostHog |
| Uptime Monitoring | Better Uptime | Pingdom, UptimeRobot |
| Log Aggregation | Datadog | Loggly, Papertrail |
| Alerting | PagerDuty | Opsgenie, VictorOps |
| Dashboards | Grafana | Datadog, New Relic |

---

## 10. Cost Estimates

| Tool | Tier | Monthly Cost |
|------|------|--------------|
| Sentry | Team | $26/month |
| Vercel Analytics | Pro (included) | $0 |
| Better Uptime | Starter | $20/month |
| Datadog (logs) | Free tier | $0 (15 days retention) |
| PagerDuty | Starter | $0 (limited) |

**Total Minimum:** ~$46/month

---

**Document Version:** 1.0
**Last Updated:** January 12, 2026
**Owner:** Engineering Team
