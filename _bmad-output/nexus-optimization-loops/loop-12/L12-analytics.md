# L12: Analytics Infrastructure

**Date:** 2026-01-12
**Agent:** Dana (Data Analyst)
**Status:** Complete

---

## Summary

Created a comprehensive, provider-agnostic analytics infrastructure for tracking user behavior, conversion funnels, and feature engagement in the Nexus application.

---

## Files Created

| File | Purpose |
|------|---------|
| `nexus/src/lib/analytics.ts` | Core analytics infrastructure with provider adapters |

---

## Architecture Overview

### Provider-Agnostic Design

The analytics system uses an adapter pattern that allows switching between providers without code changes:

```
┌─────────────────────────────────────────────────────────┐
│                    Analytics API                         │
│  trackEvent() | trackPageView() | identifyUser()        │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Adapter Layer                          │
├──────────┬──────────┬──────────┬──────────┬────────────┤
│ Mixpanel │ Amplitude│ PostHog  │ Custom   │ Console    │
│ Adapter  │ Adapter  │ Adapter  │ Adapter  │ (Debug)    │
└──────────┴──────────┴──────────┴──────────┴────────────┘
```

---

## Key Features

### 1. Event Tracking (`trackEvent`)

Track any user action with custom properties:

```typescript
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics';

// Track workflow creation
trackEvent(ANALYTICS_EVENTS.WORKFLOW_CREATED, {
  workflow_name: 'My Workflow',
  node_count: 5,
  source: 'template'
});
```

### 2. Page View Tracking (`trackPageView`)

Automatic and manual page view tracking:

```typescript
import { trackPageView } from '@/lib/analytics';

// Manual tracking
trackPageView('/dashboard', 'Dashboard - Nexus');

// Or use the hook for automatic tracking
function MyComponent() {
  useAnalytics(); // Auto-tracks on route change
}
```

### 3. User Identification (`identifyUser`)

Link events to specific users:

```typescript
import { identifyUser } from '@/lib/analytics';

identifyUser({
  userId: 'user_123',
  email: 'user@example.com',
  name: 'John Doe',
  plan: 'pro',
  createdAt: '2026-01-01'
});
```

### 4. Conversion Tracking (`trackConversion`, `trackFunnelStep`)

Track users through predefined funnels:

```typescript
import { trackFunnelStep } from '@/lib/analytics';

// Track signup funnel progression
trackFunnelStep('SIGNUP', 3, { source: 'google_ads' });
trackFunnelStep('SIGNUP', 4, { verification_method: 'email' });

// Track onboarding completion
trackFunnelStep('ONBOARDING', 5);
```

---

## Predefined Events

### Workflow Events
- `workflow_created` - User creates a new workflow
- `workflow_executed` - Workflow runs successfully
- `workflow_saved` - Workflow is saved
- `workflow_deleted` - Workflow is deleted
- `workflow_shared` - Workflow is shared with others

### User Events
- `signup_started` - User begins signup flow
- `signup_completed` - User completes registration
- `login_completed` - User logs in
- `profile_updated` - User updates profile

### Feature Usage Events
- `voice_input_used` - User activates voice input
- `voice_input_success` - Voice command processed successfully
- `template_selected` - User selects a template
- `ai_suggestion_accepted` - User accepts AI recommendation

### Onboarding Events
- `onboarding_started` - User begins onboarding
- `onboarding_step_completed` - User completes an onboarding step
- `onboarding_completed` - User finishes all onboarding
- `onboarding_skipped` - User skips onboarding

---

## Predefined Conversion Funnels

### Signup Funnel
1. Landing page viewed
2. Signup CTA clicked
3. Signup form started
4. Signup form completed
5. Email verified
6. First login

### Onboarding Funnel
1. Welcome screen
2. Use case selected
3. First workflow created
4. First execution
5. Onboarding complete

### Workflow Creation Funnel
1. Editor opened
2. First node added
3. Nodes connected
4. Workflow configured
5. Workflow tested
6. Workflow activated

### Upgrade Funnel
1. Pricing page viewed
2. Plan selected
3. Checkout started
4. Payment completed
5. Pro features accessed

---

## Configuration Examples

### Mixpanel Setup
```typescript
import { initializeAnalytics } from '@/lib/analytics';

initializeAnalytics({
  provider: 'mixpanel',
  debug: process.env.NODE_ENV === 'development',
  options: {
    mixpanel: {
      token: process.env.VITE_MIXPANEL_TOKEN,
      trackPageViews: true
    }
  }
});
```

### Amplitude Setup
```typescript
initializeAnalytics({
  provider: 'amplitude',
  options: {
    amplitude: {
      apiKey: process.env.VITE_AMPLITUDE_KEY,
      serverUrl: 'https://api.amplitude.com'
    }
  }
});
```

### PostHog Setup
```typescript
initializeAnalytics({
  provider: 'posthog',
  options: {
    posthog: {
      apiKey: process.env.VITE_POSTHOG_KEY,
      apiHost: 'https://app.posthog.com'
    }
  }
});
```

### Self-Hosted/Custom Setup
```typescript
initializeAnalytics({
  provider: 'custom',
  options: {
    custom: {
      endpoint: 'https://analytics.yourcompany.com/api',
      headers: {
        'Authorization': 'Bearer token123'
      }
    }
  }
});
```

---

## React Hook Usage

The `useAnalytics` hook provides automatic page tracking and convenient methods:

```typescript
import { useAnalytics } from '@/lib/analytics';

function Dashboard() {
  const { track, identify, trackFunnel, EVENTS } = useAnalytics();

  // Page views are automatically tracked on route change

  const handleWorkflowCreate = () => {
    track(EVENTS.WORKFLOW_CREATED, { source: 'dashboard' });
  };

  const handleOnboardingComplete = () => {
    trackFunnel('ONBOARDING', 5);
  };

  return (/* ... */);
}
```

---

## Implementation Notes

### Event Queue
Events tracked before initialization are queued and sent once the provider is ready.

### Error Handling
Failed analytics calls are logged but don't throw - ensuring analytics issues never break the app.

### Privacy Considerations
- No PII in event names
- User identification is opt-in
- Easy to disable: `analytics.setEnabled(false)`
- Reset on logout: `resetAnalytics()`

### Performance
- Async event sending
- Batching handled by providers
- Minimal bundle impact (~3KB gzipped)

---

## Metrics to Track

### Key Performance Indicators (KPIs)

| Metric | Event(s) | Formula |
|--------|----------|---------|
| Signup Rate | `signup_started`, `signup_completed` | completed / started |
| Activation Rate | `signup_completed`, `workflow_executed` | executed / signed_up |
| Voice Adoption | `voice_input_used`, DAU | voice_users / total_users |
| Template Usage | `template_selected` | templates_used / workflows_created |
| AI Engagement | `ai_suggestion_shown`, `ai_suggestion_accepted` | accepted / shown |

### Funnel Metrics

| Funnel | Target Conversion Rate |
|--------|----------------------|
| Signup | > 60% (CTA to complete) |
| Onboarding | > 80% (start to finish) |
| Workflow Creation | > 40% (start to activate) |
| Upgrade | > 5% (view to purchase) |

---

## Next Steps

1. **Initialize in App Entry** - Add analytics initialization to `main.tsx`
2. **Instrument Key Features** - Add tracking calls to critical user flows
3. **Set Up Provider** - Configure Mixpanel/Amplitude/PostHog account
4. **Create Dashboards** - Build analytics dashboards for monitoring
5. **Define Goals** - Set up conversion goals in analytics provider

---

## Related Documents

- L01: Core Platform Implementation
- L10: Onboarding Flow (uses analytics for step tracking)
- Business metrics documentation
