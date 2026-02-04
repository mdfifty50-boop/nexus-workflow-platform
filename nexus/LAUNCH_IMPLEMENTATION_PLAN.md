# Nexus Launch Implementation Plan

**Generated:** 2026-02-03
**Status:** Pre-Launch Analysis Complete

---

## Executive Summary

After deep analysis of your codebase, I've identified **what exists** vs **what needs to be built** for each of the 4 major launch requirements.

| Feature | Current State | Work Required |
|---------|--------------|---------------|
| 1. User Account System | **70% Complete** - Clerk + Supabase schema exists | Connect chat/workflow storage to Supabase |
| 2. Admin Dashboard | **40% Complete** - UI exists with MOCK data | Replace mock data with real Supabase queries |
| 3. Mobile UX | **20% Complete** - Overlapping components | Build separate mobile components |
| 4. Production Readiness | **60% Complete** - Good foundation | Fix localhost refs, add monitoring |

---

# PLAN 1: User Account System

## Current State Analysis

### What EXISTS (Already Built)

| Component | File | Status |
|-----------|------|--------|
| Clerk Auth Integration | `src/App.tsx`, `src/main.tsx` | Fully integrated |
| User Profiles Table | `supabase/migrations/20260107_001_user_profiles.sql` | Schema ready |
| RLS Policies | `supabase/migrations/20260106000001_initial_setup.sql` | 20+ policies |
| Workflows Table | Initial migration | Schema ready |
| Encrypted Credentials | `integration_credentials` table | Schema ready |
| Privacy Settings | `user_profiles.privacy_settings` JSONB | Schema ready |

### What's MISSING (Needs Building)

| Issue | Current | Required |
|-------|---------|----------|
| **Chat History** | localStorage only | Persist to Supabase |
| **Workflow Drafts** | localStorage only | Persist to Supabase |
| **User Preferences** | Scattered localStorage | Unified Supabase storage |
| **Cross-Device Sync** | None | Real-time sync via Supabase |

## Implementation Architecture

### Phase 1.1: Chat History Persistence (CRITICAL)

**Problem:** Chats stored in `localStorage` - lost when user clears browser.

```sql
-- New migration: 20260204_001_chat_conversations.sql
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,  -- clerk_user_id
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  workflow_data JSONB,  -- If message includes workflow
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Users see only their conversations
CREATE POLICY "Users view own conversations" ON chat_conversations
  FOR ALL USING (user_id = current_setting('app.clerk_user_id', true));
```

**Files to Modify:**
1. `src/components/chat/ChatContainer.tsx` - Add auto-save on message
2. `src/services/NexusAIService.ts` - Add conversation sync
3. New: `server/services/ChatPersistenceService.ts`

### Phase 1.2: Workflow Persistence

**Problem:** Workflow drafts in localStorage.

```typescript
// server/services/WorkflowPersistenceService.ts
export class WorkflowPersistenceService {
  async saveWorkflowDraft(userId: string, workflow: WorkflowDraft) {
    return supabase.from('workflow_drafts').upsert({
      user_id: userId,
      workflow_id: workflow.id,
      data: workflow,
      updated_at: new Date()
    });
  }
}
```

### Phase 1.3: Professional Account Flow

**Current:** Clerk handles sign-up/sign-in well.

**Add:**
1. **Welcome Onboarding** - Capture industry, use case, team size
2. **Email Verification Badge** - Show verified status
3. **Account Settings Page** - Already exists at `/settings`

### Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss during migration | HIGH | Keep localStorage as fallback during transition |
| Performance on large histories | MEDIUM | Paginate message loading (50 at a time) |
| Supabase rate limits | LOW | Batch saves, debounce |

### Implementation Order

```
Week 1: Chat persistence (highest user value)
Week 2: Workflow persistence
Week 3: Cross-device sync testing
```

---

# PLAN 2: Admin Dashboard

## Current State Analysis

### What EXISTS

| Component | File | Issue |
|-----------|------|-------|
| Admin Page | `src/pages/Admin.tsx` | Uses MOCK_USERS array! |
| Usage Stats Component | `src/components/AdminUsageStats.tsx` | Needs real data |
| Audit Log Component | `src/components/AdminAuditLog.tsx` | Needs real data |
| Feature Flags | `src/components/FeatureFlags.tsx` | Local state only |

**Critical Issue Found (Line 25-76 of Admin.tsx):**
```typescript
const MOCK_USERS: User[] = [
  { id: '1', email: 'admin@nexus.app', name: 'Admin User', ... },
  // ... ALL FAKE DATA
]
```

### What's MISSING

| Feature | Description |
|---------|-------------|
| Real User Data | Query actual Supabase users |
| LLM Error Tracker | AI that analyzes user errors |
| Feature Usage Analytics | Track which features users use |
| User Feedback System | Collect improvement suggestions |

## Implementation Architecture

### Phase 2.1: Real User Analytics

```sql
-- New migration: 20260204_002_admin_analytics.sql
CREATE TABLE user_activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,  -- 'workflow_created', 'chat_started', 'error', etc.
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  error_type TEXT NOT NULL,
  error_message TEXT,
  stack_trace TEXT,
  user_context JSONB,  -- What were they trying to do
  resolved BOOLEAN DEFAULT false,
  ai_analysis TEXT,  -- LLM-generated analysis
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE feature_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name TEXT NOT NULL,
  user_id TEXT NOT NULL,
  usage_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(feature_name, user_id)
);

-- Admin view (no RLS - admin only via server)
CREATE VIEW admin_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM user_profiles) as total_users,
  (SELECT COUNT(*) FROM user_profiles WHERE last_active_at > now() - interval '7 days') as active_users_7d,
  (SELECT COUNT(*) FROM workflows) as total_workflows,
  (SELECT COUNT(*) FROM workflow_executions WHERE status = 'completed') as successful_executions,
  (SELECT COUNT(*) FROM user_errors WHERE resolved = false) as unresolved_errors;
```

### Phase 2.2: LLM Error Analyzer

```typescript
// server/services/AdminAIAnalyzer.ts
export class AdminAIAnalyzer {
  async analyzeUserErrors(): Promise<ErrorAnalysis> {
    // Collect recent unanalyzed errors
    const errors = await supabase
      .from('user_errors')
      .select('*')
      .is('ai_analysis', null)
      .limit(50);

    // Use Haiku (cheap) for batch analysis
    const analysis = await callClaudeWithTiering({
      tier: 'haiku',
      prompt: `Analyze these user errors and categorize them:
        ${JSON.stringify(errors)}

        Return JSON with:
        - patterns: common error patterns
        - recommendations: what to fix
        - priority: high/medium/low for each`
    });

    return analysis;
  }

  async generateWeeklyReport(): Promise<AdminReport> {
    // Use Sonnet for comprehensive report
    const stats = await getWeeklyStats();

    return callClaudeWithTiering({
      tier: 'sonnet',
      prompt: `Generate an admin report for Nexus:
        Stats: ${JSON.stringify(stats)}

        Include:
        - Key metrics summary
        - User behavior insights
        - Feature recommendations
        - Error patterns to address`
    });
  }
}
```

### Phase 2.3: Admin API Routes

```typescript
// server/routes/admin-analytics.ts (NEW)
router.get('/users', adminAuth, async (req, res) => {
  const users = await supabase
    .from('user_profiles')
    .select('*, workflow_count:workflows(count)')
    .order('created_at', { ascending: false });

  res.json({ users: users.data });
});

router.get('/errors', adminAuth, async (req, res) => {
  const errors = await supabase
    .from('user_errors')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  res.json({ errors: errors.data });
});

router.get('/ai-report', adminAuth, async (req, res) => {
  const report = await adminAIAnalyzer.generateWeeklyReport();
  res.json({ report });
});
```

### Admin Security

```typescript
// Middleware: Only your email can access admin
const adminAuth = async (req, res, next) => {
  const user = await clerk.users.getUser(req.auth.userId);
  const ADMIN_EMAILS = ['your-email@domain.com'];

  if (!ADMIN_EMAILS.includes(user.email)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
```

### Implementation Order

```
Phase 1: Replace mock data with real Supabase queries
Phase 2: Add event tracking to key user actions
Phase 3: Build LLM error analyzer
Phase 4: Create weekly AI report generation
```

---

# PLAN 3: Mobile UX (Separate App Architecture)

## Current Problem Analysis

**Root Cause:** The current UI uses desktop-first components that don't adapt well to mobile. Fixing overlaps one-by-one is a losing battle.

### Identified Overlap Issues

| Component | Problem |
|-----------|---------|
| SidebarNavigation | Fixed sidebar overlaps chat on mobile |
| ChatContainer | Messages overflow viewport |
| WorkflowPreviewCard | Nodes too wide for mobile |
| Header + Navigation | Multiple fixed headers compete |

## Recommended Architecture: Conditional Mobile App

Instead of fixing responsive issues, **detect mobile and render entirely different components**.

### Phase 3.1: Mobile Detection System

```typescript
// src/hooks/usePlatform.ts (NEW)
export function usePlatform() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 ||
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return { isMobile, isDesktop: !isMobile };
}
```

### Phase 3.2: Mobile Component Architecture

```
src/
├── components/           # Desktop components (existing)
│   ├── chat/
│   ├── dashboard/
│   └── ...
├── mobile/               # NEW: Mobile-specific components
│   ├── MobileApp.tsx     # Mobile app shell
│   ├── MobileChat.tsx    # Full-screen chat
│   ├── MobileNav.tsx     # Bottom tab navigation
│   ├── MobileWorkflow.tsx# Vertical workflow cards
│   └── MobileSettings.tsx
```

### Phase 3.3: Mobile App Shell

```tsx
// src/mobile/MobileApp.tsx
export function MobileApp() {
  const [activeTab, setActiveTab] = useState<'chat' | 'workflows' | 'settings'>('chat');

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      {/* Content Area - Full screen, no sidebar */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'chat' && <MobileChat />}
        {activeTab === 'workflows' && <MobileWorkflows />}
        {activeTab === 'settings' && <MobileSettings />}
      </main>

      {/* Bottom Tab Navigation */}
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
```

### Phase 3.4: Mobile Chat (Full-Screen)

```tsx
// src/mobile/MobileChat.tsx
export function MobileChat() {
  return (
    <div className="h-full flex flex-col">
      {/* Minimal header */}
      <header className="px-4 py-3 border-b border-slate-800 flex items-center">
        <BotIcon className="w-6 h-6 text-cyan-400" />
        <span className="ml-2 font-medium">Nexus</span>
      </header>

      {/* Messages - scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <MobileChatBubble key={msg.id} message={msg} />
        ))}
      </div>

      {/* Input - fixed at bottom */}
      <div className="p-4 border-t border-slate-800">
        <MobileChatInput onSend={handleSend} />
      </div>
    </div>
  );
}
```

### Phase 3.5: Mobile Workflow Cards (Vertical)

```tsx
// src/mobile/MobileWorkflowCard.tsx
export function MobileWorkflowCard({ workflow }: Props) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
      <h3 className="font-semibold">{workflow.name}</h3>

      {/* Vertical steps instead of horizontal */}
      <div className="space-y-2">
        {workflow.steps.map((step, i) => (
          <div key={step.id} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
              {step.icon}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{step.name}</div>
              <div className="text-xs text-slate-400">{step.tool}</div>
            </div>
            {step.status === 'connected' && (
              <CheckCircle className="w-5 h-5 text-green-400" />
            )}
          </div>
        ))}
      </div>

      {/* Full-width execute button */}
      <button className="w-full py-3 bg-cyan-600 rounded-lg font-medium">
        Execute Workflow
      </button>
    </div>
  );
}
```

### Phase 3.6: App.tsx Conditional Rendering

```tsx
// src/App.tsx
import { usePlatform } from './hooks/usePlatform';
import { MobileApp } from './mobile/MobileApp';
import { DesktopApp } from './DesktopApp';

function App() {
  const { isMobile } = usePlatform();

  return isMobile ? <MobileApp /> : <DesktopApp />;
}
```

### Testing Strategy

1. **Install Phone Simulator Extension** (as you mentioned)
2. Test at exact breakpoints: 375px (iPhone SE), 390px (iPhone 14), 412px (Pixel)
3. Test touch interactions (no hover states on mobile)

### Implementation Order

```
Week 1: Set up mobile component structure + MobileApp shell
Week 2: Build MobileChat (most important)
Week 3: Build MobileWorkflows + MobileSettings
Week 4: Polish + test on real devices
```

---

# PLAN 4: Production Readiness

## Audit Results

### CRITICAL Issues (Must Fix Before Launch)

| Issue | Location | Risk |
|-------|----------|------|
| Localhost hardcoded | `vite.config.ts:95-96`, `server/routes/whatsapp-business.ts:96` | BREAKS IN PROD |
| Admin uses mock data | `src/pages/Admin.tsx:25-76` | Admin panel useless |
| No error tracking | Scattered console.error | Can't debug prod issues |
| Chat in localStorage | `src/components/chat/` | Data loss on browser clear |

### HIGH Issues

| Issue | Location | Risk |
|-------|----------|------|
| Some routes lack auth | Various server routes | Security vulnerability |
| No rate limiting on AI routes | `/api/chat` | Cost explosion |
| CORS allows many origins | `vite.config.ts` | Dev config in prod |

### MEDIUM Issues

| Issue | Location | Fix |
|-------|----------|-----|
| Bundle size | 1MB+ main bundle | Already has chunking |
| No health check endpoint | - | Add for monitoring |
| No graceful shutdown | Server | Handle SIGTERM |

## Production Checklist

### Environment Variables (REQUIRED for Production)

```bash
# .env.production
NODE_ENV=production

# Auth (REQUIRED)
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx

# Database (REQUIRED)
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# AI (REQUIRED)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# Integrations (REQUIRED for workflows)
COMPOSIO_API_KEY=xxxxx

# App URL (REQUIRED - update!)
VITE_APP_URL=https://nexus.yourdomain.com
APP_URL=https://nexus.yourdomain.com

# Security
ENCRYPTION_KEY=<64-char-random-string>
```

### Files to Modify for Production

#### 1. Remove Localhost References

```typescript
// vite.config.ts - Change line 95-96
cors: {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://nexus.yourdomain.com']
    : ['http://localhost:5173', 'http://localhost:5174', ...],
  credentials: true,
}
```

#### 2. Add Production API URL

```typescript
// src/lib/api-client.ts
const API_BASE = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '' : '/api');
```

#### 3. Add Error Tracking

```typescript
// src/lib/error-tracking.ts (NEW)
export function initErrorTracking() {
  window.onerror = (message, source, line, col, error) => {
    fetch('/api/errors/report', {
      method: 'POST',
      body: JSON.stringify({
        message,
        source,
        line,
        col,
        stack: error?.stack,
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    });
  };
}
```

#### 4. Add Rate Limiting to AI Routes

```typescript
// server/routes/chat.ts - Add at top
import rateLimit from 'express-rate-limit';

const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute per user
  keyGenerator: (req) => req.auth?.userId || req.ip,
  message: { error: 'Too many requests, please slow down' }
});

router.post('/', chatLimiter, async (req, res) => { ... });
```

#### 5. Add Health Check

```typescript
// server/routes/health.ts - Already exists, verify it works
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: process.env.npm_package_version,
    timestamp: new Date().toISOString(),
    services: {
      database: supabaseHealthy ? 'up' : 'down',
      ai: process.env.ANTHROPIC_API_KEY ? 'configured' : 'not configured'
    }
  });
});
```

### Deployment Recommendations

| Platform | Pros | Cons |
|----------|------|------|
| **Vercel** (Recommended) | Easy, auto-scaling, good for React | Function cold starts |
| Railway | Full Node.js support, easy | Costs scale with usage |
| Render | Good free tier | Slower cold starts |
| AWS Amplify | Scalable | More complex setup |

### Pre-Launch Checklist

```
[ ] All env vars set in production
[ ] Supabase project configured (not localhost)
[ ] Clerk production keys (not test keys)
[ ] Custom domain configured
[ ] SSL certificate active
[ ] Rate limiting enabled
[ ] Error tracking active
[ ] Admin email whitelist set
[ ] Backup strategy in place
[ ] Monitoring alerts configured
```

---

# Implementation Priority Matrix

| Priority | Task | Time Estimate | Impact |
|----------|------|---------------|--------|
| **P0** | Fix localhost references | 1 day | BLOCKING |
| **P0** | Set up production env vars | 1 day | BLOCKING |
| **P1** | Chat persistence to Supabase | 3 days | HIGH |
| **P1** | Replace Admin mock data | 2 days | HIGH |
| **P2** | Mobile app architecture | 2 weeks | MEDIUM |
| **P2** | Error tracking system | 2 days | MEDIUM |
| **P3** | LLM admin analyzer | 1 week | LOW |
| **P3** | Weekly AI reports | 3 days | LOW |

---

# Recommended Launch Sequence

```
Day 1-2:   Production environment setup
Day 3-5:   Chat persistence migration
Day 6-7:   Admin dashboard real data
Day 8-9:   Testing + bug fixes
Day 10:    Soft launch (invite-only)
Day 11-14: Monitor + fix issues
Day 15:    Public launch

Mobile UX: Parallel track, launch as v1.1 update
```

---

# Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Supabase connection fails | LOW | HIGH | Add connection retry + fallback UI |
| Claude API rate limited | MEDIUM | HIGH | Implement queue + backoff |
| User data loss | LOW | CRITICAL | Dual-write to localStorage during transition |
| Mobile UX delays launch | HIGH | MEDIUM | Launch desktop-first, mobile in v1.1 |

---

**Document prepared by:** Claude (Opus 4.5)
**For:** Nexus Launch Planning
**Next Action:** Review and approve priority sequence
