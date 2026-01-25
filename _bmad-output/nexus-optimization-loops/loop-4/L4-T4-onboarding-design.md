# L4-T4: 60-Second Onboarding Flow Design

**Author:** Luna (Growth Hacker)
**Date:** 2026-01-12
**Focus:** Conversion optimization and time-to-value reduction

---

## Executive Summary

Current onboarding flow requires 4-6 steps and takes 2-5+ minutes before users create their first workflow. This design proposes a radical 60-second "Instant Magic" onboarding that lets users experience value BEFORE account creation, dramatically improving conversion rates and time-to-value.

---

## 1. Current Flow Analysis

### 1.1 Current User Journey Map

```
Landing Page ─────> SignUp Page ─────> Clerk Auth ─────> Onboarding Wizard ─────> Dashboard ─────> Create Workflow
     │                  │                  │                    │                    │                  │
     └─────────────────┴──────────────────┴────────────────────┴────────────────────┴──────────────────┘
                                    TOTAL TIME: 2-5+ minutes
                                    TOTAL STEPS: 6-8 actions
                                    FRICTION POINTS: 5
```

### 1.2 Current Step-by-Step Breakdown

| Step | Page | Time (avg) | Friction Level | Description |
|------|------|------------|----------------|-------------|
| 1 | Landing Page | 30-60s | Low | User reads hero, enters workflow description |
| 2 | SignUp Page | 15-30s | **HIGH** | User clicks "Create Workflow" -> redirected to signup |
| 3 | Clerk Auth | 45-90s | **HIGH** | Email/password or OAuth flow (5+ fields) |
| 4 | Email Verify | 30-120s | **CRITICAL** | Check email, click link (many users abandon) |
| 5 | Onboarding Wizard | 60-120s | Medium | Welcome -> Persona -> Goal -> First Workflow (4 screens) |
| 6 | Dashboard | 15-30s | Low | Land on dashboard, find workflow builder |
| 7 | Workflow Builder | 30-60s | Medium | Finally enter workflow description |

**Total Time:** 225-510 seconds (3.75-8.5 minutes)
**Total Clicks/Actions:** 12-20
**Major Abandonment Points:** 3 (signup wall, email verification, onboarding length)

### 1.3 Current Code Analysis

**LandingPage.tsx (Lines 292-303):**
```typescript
const handleWorkflowSubmit = () => {
  // Save workflow to localStorage, then REDIRECT TO SIGNUP
  localStorage.setItem('nexus_pending_workflow', trimmedInput)
  localStorage.setItem('nexus_signup_source', 'landing_workflow_input')
  navigate('/signup')  // <-- FRICTION: User can't see value yet
}
```

**OnboardingWizard.tsx:**
- 4 steps for new users (welcome, persona, goal, first-workflow)
- 2 steps for users with pending workflow (welcome, first-workflow)
- Still requires account creation before any of this

**Problem:** User describes their dream workflow on landing page, then hits a brick wall of authentication before seeing ANY value delivered.

---

## 2. Proposed 60-Second "Instant Magic" Flow

### 2.1 Core Philosophy

> "Show the magic BEFORE asking for commitment."

Users should experience their workflow being built and see a live preview BEFORE creating an account. The account creation happens AFTER they're emotionally invested in the result.

### 2.2 New User Journey

```
Landing Page ───> Instant Build Mode ───> Live Preview ───> "Save Your Workflow" ───> Quick Auth ───> Dashboard
     │                    │                    │                      │                    │              │
     │                    │                    │                      │                    │              │
   10 sec              15 sec               25 sec                  5 sec              5 sec          0 sec
     │                    │                    │                      │                    │              │
     └────────────────────┴────────────────────┴──────────────────────┴────────────────────┴──────────────┘
                                        TOTAL TIME: 60 seconds
                                        VALUE SHOWN: Before signup
```

### 2.3 Detailed Step Breakdown

#### Step 1: Landing Page Input (0-10 seconds)
**What:** User types their workflow description in the existing hero input field.

**Key Changes:**
- Keep current animated placeholder suggestions (excellent engagement)
- Add "Build for Free" primary CTA instead of "Create Workflow"
- Show WorkflowPreview component inline as they type (already exists!)

**Wireframe Description:**
```
┌─────────────────────────────────────────────────────────────┐
│  NEXUS                                      [Sign In] [Try Free] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│              Tell Us What to Automate                       │
│                  We'll Build It                             │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Text me a summary of my unread emails every morning  │   │
│  │ so I never miss anything urgent...                    │   │
│  │                                                      │   │
│  │                                     [Build for Free] │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ LIVE PREVIEW ──────────────────────────────────────┐   │
│  │  Nexus is building your workflow...                 │   │
│  │  📧 Gmail → 🤖 AI Analysis → 📱 SMS                 │   │
│  │  Schedule: Daily at 9:00 AM  ✓ Ready in 30 seconds  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

#### Step 2: Instant Build Mode (10-25 seconds)
**What:** Full-screen AI building animation showing workflow creation.

**Key Changes:**
- Navigate to `/try?workflow={encoded_description}` (new GUEST route)
- Show AIBuildingOverlay (already exists in WorkflowDemo.tsx!)
- No authentication required - pure demo mode
- Generate real-looking workflow in 10-15 seconds

**Wireframe Description:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                 🤖                                          │
│           Nexus is Building Your Workflow                   │
│                                                             │
│     "Text me a summary of unread emails every morning"      │
│                                                             │
│           ●─────●─────●─────○─────○                         │
│       Analyzing  Planning  Building  Connecting  Ready      │
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │ ⚡ Gmail Trigger       ✓ Ready                      │     │
│  │ 🤖 Email Summarizer    ✓ Ready                      │     │
│  │ 🔌 Twilio SMS          ● Building...                │     │
│  │ ✅ Daily Schedule      ○ Pending                    │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
│                                               [Cancel]      │
└─────────────────────────────────────────────────────────────┘
```

#### Step 3: Live Interactive Preview (25-50 seconds)
**What:** User sees their completed workflow in the visual editor.

**Key Changes:**
- Show ReactFlow canvas with generated workflow
- Allow limited interaction (drag nodes, zoom, explore)
- Prominent "Run Test" button (simulated execution)
- Show execution animation with sample data

**Wireframe Description:**
```
┌─────────────────────────────────────────────────────────────┐
│  Your Workflow: Email Morning Summary          [Run Test]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│    ┌─────────┐    ┌─────────────┐    ┌──────────┐          │
│    │ 📧      │───▶│ 🤖 AI      │───▶│ 📱       │          │
│    │ Gmail   │    │ Summarizer │    │ SMS      │          │
│    │ Trigger │    │            │    │ Output   │          │
│    └─────────┘    └─────────────┘    └──────────┘          │
│                                                             │
│  ──────────────────────────────────────────────────────    │
│  Test Execution ✓ Complete                                  │
│  ├─ Fetched 12 unread emails                               │
│  ├─ AI Summary: "3 urgent: meeting rescheduled..."         │
│  └─ SMS would be sent to: [Your Phone]                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│    This workflow will run daily at 9:00 AM                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🎉 Save this workflow to activate it!              │   │
│  │                                                      │   │
│  │  [Save & Activate - Free]  or  [Continue Exploring] │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Step 4: Quick Save Prompt (50-55 seconds)
**What:** Gentle nudge to save their workflow.

**Key Changes:**
- Modal overlay with emotional hook ("Don't lose your workflow!")
- Single-field email capture OR OAuth buttons
- Optional: "Continue as Guest" for extended exploration

**Wireframe Description:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│     ┌────────────────────────────────────────────┐         │
│     │                                            │         │
│     │    🎉 Your Workflow is Ready!              │         │
│     │                                            │         │
│     │    Save it now to:                         │         │
│     │    ✓ Activate automated execution          │         │
│     │    ✓ Connect your real Gmail & SMS         │         │
│     │    ✓ Customize triggers and timing         │         │
│     │                                            │         │
│     │    ┌───────────────────────────────────┐   │         │
│     │    │ 📧 Enter your email                │   │         │
│     │    └───────────────────────────────────┘   │         │
│     │                                            │         │
│     │    [Continue with Google]  [Continue with GitHub]    │
│     │                                            │         │
│     │    ─────── or ───────                      │         │
│     │                                            │         │
│     │    [Save with Email]                       │         │
│     │                                            │         │
│     │    Keep exploring without account?         │         │
│     │    [Continue as Guest]                     │         │
│     │                                            │         │
│     └────────────────────────────────────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Step 5: Instant Authentication (55-60 seconds)
**What:** Streamlined OAuth or magic link.

**Key Changes:**
- OAuth popup (no redirect, no page refresh)
- OR magic link sent to email (login with one click)
- Pre-created account with workflow already attached
- Skip onboarding wizard entirely (we learned their intent!)

**Post-Auth State:**
- User lands on Dashboard with workflow already created
- First workflow shows "Pending Setup" state
- Guided tooltip: "Connect Gmail to activate"

---

## 3. Technical Implementation

### 3.1 New Routes Required

| Route | Type | Description |
|-------|------|-------------|
| `/try` | Public | Guest workflow builder (no auth required) |
| `/try?workflow={encoded}` | Public | Pre-filled guest workflow builder |
| `/save-workflow` | Mixed | Auth wall with workflow preservation |

### 3.2 New Components

#### GuestWorkflowBuilder.tsx
```typescript
// Key features:
// 1. Uses existing WorkflowDemo components
// 2. Saves workflow to localStorage with UUID
// 3. Shows "Save" prompt after 30 seconds of interaction
// 4. Limits guest features (no actual integrations)
```

#### QuickAuthModal.tsx
```typescript
// Key features:
// 1. Single email field + OAuth buttons
// 2. Magic link option (passwordless)
// 3. Preserves workflow UUID during auth
// 4. Creates account + workflow in single transaction
```

### 3.3 localStorage Keys (Guest Mode)

```typescript
const GUEST_KEYS = {
  WORKFLOW_UUID: 'nexus_guest_workflow_id',
  WORKFLOW_DATA: 'nexus_guest_workflow_data',
  WORKFLOW_NAME: 'nexus_guest_workflow_name',
  FIRST_INTERACTION: 'nexus_guest_first_interaction',
  ENGAGEMENT_TIME: 'nexus_guest_engagement_time',
}
```

### 3.4 Migration Path for Existing Flow

1. **Phase 1 (Week 1):** Add `/try` route alongside existing flow
2. **Phase 2 (Week 2):** A/B test `/try` vs current SignUp redirect
3. **Phase 3 (Week 3):** Based on data, make `/try` the default
4. **Phase 4 (Week 4):** Simplify OnboardingWizard for users who came via `/try`

---

## 4. Key Metrics to Track

### 4.1 Primary Metrics (North Star)

| Metric | Current (Est.) | Target | Measurement |
|--------|----------------|--------|-------------|
| Time to First Workflow | 3-5 minutes | < 60 seconds | Timer from landing to workflow preview |
| Signup Conversion | ~15% | 35%+ | Users who sign up / users who click "Build" |
| Activation Rate | ~40% | 70%+ | Users who create first workflow / signups |

### 4.2 Secondary Metrics

| Metric | Description |
|--------|-------------|
| Workflow Completion Rate | % of users who finish building workflow in guest mode |
| Guest-to-Signup Rate | % of guest mode users who create accounts |
| Time on Try Page | Engagement time before signup prompt |
| Auth Method Distribution | Google vs GitHub vs Email vs Magic Link |
| Skip Rate | % who skip save and continue exploring |
| Return Rate | Guest users who return within 24/48/72 hours |

### 4.3 Event Tracking Schema

```javascript
// Key events to track
analytics.track('guest_workflow_started', {
  source: 'landing_page' | 'direct_link',
  workflow_description_length: number,
  timestamp: Date
})

analytics.track('guest_workflow_completed', {
  workflow_id: string,
  build_time_seconds: number,
  nodes_count: number,
  timestamp: Date
})

analytics.track('save_prompt_shown', {
  workflow_id: string,
  engagement_time_seconds: number,
  trigger: 'auto' | 'manual'
})

analytics.track('save_prompt_response', {
  workflow_id: string,
  action: 'signup' | 'continue_guest' | 'dismiss',
  auth_method?: 'google' | 'github' | 'email' | 'magic_link'
})

analytics.track('guest_to_signup_conversion', {
  workflow_id: string,
  total_guest_time_seconds: number,
  workflows_created_as_guest: number
})
```

---

## 5. A/B Test Recommendations

### 5.1 Test 1: Try Page vs Signup Wall

**Hypothesis:** Showing workflow value before signup increases conversion.

| Variant | Flow |
|---------|------|
| Control (A) | Landing -> Signup -> Onboarding -> Dashboard |
| Treatment (B) | Landing -> Try Page -> Quick Auth -> Dashboard |

**Success Criteria:** Treatment increases signup rate by 20%+

### 5.2 Test 2: Save Prompt Timing

**Hypothesis:** Optimal save prompt timing exists between too-early (annoying) and too-late (lost interest).

| Variant | Prompt Timing |
|---------|---------------|
| A | After 15 seconds on preview |
| B | After 30 seconds on preview |
| C | After first interaction (node click/drag) |
| D | After "Run Test" button clicked |

**Success Criteria:** Find timing with highest conversion + lowest annoyance

### 5.3 Test 3: Auth Method Priority

**Hypothesis:** Visual order of auth options affects choice and completion rate.

| Variant | Auth Order |
|---------|------------|
| A | Google -> GitHub -> Email |
| B | Email -> Google -> GitHub |
| C | Magic Link -> Google -> GitHub |
| D | "Continue with Google" as single prominent option |

**Success Criteria:** Highest auth completion rate

### 5.4 Test 4: Value Proposition Copy

**Hypothesis:** Different save prompt messages drive different conversion rates.

| Variant | Copy |
|---------|------|
| A | "Save your workflow" (neutral) |
| B | "Don't lose your work!" (loss aversion) |
| C | "Activate your automation now" (action-oriented) |
| D | "Join 10,000+ teams saving 20hrs/week" (social proof) |

---

## 6. Mobile-Specific Considerations

### 6.1 Touch-Optimized Build Animation
- Larger progress indicators (48px minimum)
- Full-screen phases instead of inline
- Haptic feedback on step completion

### 6.2 Simplified Preview
- Single-column workflow view
- Swipe to see different nodes
- "Tap to Run Test" prominent button

### 6.3 Quick Auth Optimizations
- Face ID / Touch ID where available
- Google One Tap on Android
- Deep linking from magic link emails

---

## 7. Edge Cases & Error Handling

### 7.1 Browser Storage Disabled
- Detect localStorage availability
- Fall back to session-based storage
- Warn user: "Your workflow won't be saved if you close this tab"

### 7.2 Network Interruption
- Offline-capable preview (cache assets)
- Queue save requests
- "Your workflow is safe" reassurance

### 7.3 Existing Account Detection
- If email matches existing account, show "Welcome back!"
- Pre-fill login instead of signup
- Merge guest workflow with existing account

### 7.4 Workflow Complexity Limits
- Guest mode limited to 5 nodes
- Show upgrade prompt for complex workflows
- "Create account to add more steps"

---

## 8. Success Criteria Summary

### Must-Have for Launch
- [ ] `/try` route accessible without authentication
- [ ] Workflow preview renders within 15 seconds
- [ ] Guest workflow data persists through signup
- [ ] All tracking events firing correctly
- [ ] Mobile-responsive at all breakpoints

### Nice-to-Have
- [ ] Magic link authentication
- [ ] Workflow sharing (public preview links)
- [ ] Template quick-start from `/try?template={id}`

---

## 9. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Users explore forever without signing up | Medium | Medium | Time-limited guest features, save prompts |
| Spam/abuse of guest workflow creation | Medium | Low | Rate limiting, honeypot fields |
| Lost workflows due to storage issues | Low | High | Cloud backup before OAuth redirect |
| OAuth popup blockers | Medium | Medium | Fallback to redirect flow |

---

## 10. Appendix: Existing Components to Reuse

These components from the current codebase can be reused for the new flow:

1. **WorkflowPreview (LandingPage.tsx:54-210)** - Real-time workflow preview as user types
2. **AIBuildingOverlay (WorkflowDemo.tsx:38-250)** - Animated build phases
3. **ReactFlow Canvas (WorkflowDemo.tsx)** - Visual workflow editor
4. **QuickAuthModal** - New, but can base on existing OnboardingWizard modal pattern
5. **ProfessionalAvatar** - Agent avatars for build animation

---

## 11. Implementation Priority

### Sprint 1: Core Guest Flow
1. Create `/try` route and GuestWorkflowBuilder
2. Adapt AIBuildingOverlay for guest mode
3. Basic save prompt modal

### Sprint 2: Authentication Integration
1. QuickAuthModal with OAuth
2. Magic link authentication
3. Workflow migration on signup

### Sprint 3: Tracking & Optimization
1. Full analytics implementation
2. A/B test framework setup
3. First round of tests

### Sprint 4: Polish & Edge Cases
1. Mobile optimization
2. Error handling
3. Performance optimization

---

*This design prioritizes showing value before asking for commitment. Every second of friction we remove translates to higher conversion rates and happier users.*
