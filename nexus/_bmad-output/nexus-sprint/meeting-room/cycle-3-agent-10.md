# Cycle 3 - Agent 10: Progressive Disclosure System & Power User Shortcuts

**Agent:** UX Specialist
**Mission:** Design progressive disclosure UI levels and keyboard shortcuts for power users
**Status:** RESEARCH COMPLETE
**Date:** 2026-02-15

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Progressive Disclosure: Three UI Levels](#2-progressive-disclosure-three-ui-levels)
3. [Cmd+K Command Palette Design](#3-cmdk-command-palette-design)
4. [Keyboard Shortcuts System](#4-keyboard-shortcuts-system)
5. [Magic Moment Flows per User Level](#5-magic-moment-flows-per-user-level)
6. [Implementation Architecture](#6-implementation-architecture)
7. [Recommended Libraries & Dependencies](#7-recommended-libraries--dependencies)
8. [Migration Path from Current UI](#8-migration-path-from-current-ui)

---

## 1. Current State Analysis

### What Nexus Has Today

**Chat Interface (`ChatContainer.tsx`):**
- Single-mode chat with suggestion cards on empty state (3 suggestion tiles: Create Workflow, Connect Apps, Explore Templates)
- Clarifying question flow with clickable option chips
- "Think with me" mode (focused problem-solving via sidebar)
- Workflow preview cards rendered inline in chat
- Voice input with multi-language support (Arabic dialects, English)
- Node edit commands via text ("remove gmail", "add slack")

**Input Handling (`ChatInput.tsx`):**
- Auto-expanding textarea
- Enter to send, Shift+Enter for newline
- Voice recording with waveform visualization
- Language selector dropdown
- No keyboard shortcut system beyond basic Enter/Shift+Enter

**Dashboard (`Dashboard.tsx`):**
- Stats grid, recent workflows, AI suggestions, achievements, recommended integrations
- No progressive disclosure; all sections visible to all users regardless of experience
- Quick actions: "Build a Workflow" (main CTA) + "AI Consultancy" (secondary)

**Sidebar Navigation (`SidebarNavigation.tsx`):**
- Flat navigation: Chat, Dashboard, Workflows, Templates, Integrations, WhatsApp, AI Consultancy, Settings
- Chat dropdown with: New Chat, Think with Me, Recent Chats
- No collapsing/expansion based on user level
- No command palette

**Onboarding (`OnboardingWizard.tsx`):**
- 7-step wizard: Welcome, Business Profile, Goals, Integrations, Templates, First Workflow, Completion
- Collects: industry, company size, role, automation goals
- Persistent progress in localStorage
- Keyboard navigation support within wizard

**User Memory (`UserMemoryService.ts`):**
- Tracks: total workflows, chat sessions, top integrations, maturity level, peak usage time
- `maturityLevel` field exists but is not used for UI adaptation
- `preferredWorkflowComplexity` field exists but is display-only

### Key Gap

Nexus has the raw data to classify users into experience levels (via `UserMemoryService.maturityLevel`, `totalWorkflows`, `totalChatSessions`) but **never uses this data to adapt the UI**. Every user sees the exact same interface regardless of whether they created their first workflow 5 minutes ago or have built 50 automations.

---

## 2. Progressive Disclosure: Three UI Levels

### Level Detection Algorithm

```typescript
type UserLevel = 'beginner' | 'intermediate' | 'power_user'

function detectUserLevel(profile: UserMemoryProfile): UserLevel {
  const {
    totalWorkflows,
    totalChatSessions,
    topIntegrations,
    workflowSuccessRate,
  } = profile

  // Power User: 10+ workflows, 3+ integrations, 80%+ success rate
  if (
    totalWorkflows >= 10 &&
    topIntegrations.length >= 3 &&
    workflowSuccessRate >= 80
  ) {
    return 'power_user'
  }

  // Intermediate: 3+ workflows OR 10+ chat sessions OR 2+ integrations
  if (
    totalWorkflows >= 3 ||
    totalChatSessions >= 10 ||
    topIntegrations.length >= 2
  ) {
    return 'intermediate'
  }

  // Beginner: everyone else
  return 'beginner'
}
```

Users can also manually override their level in Settings (e.g., a developer who skips onboarding should be able to jump to power user mode immediately).

---

### Level 1: Beginner

**Philosophy:** Guided hand-holding. Reduce choices. Celebrate every win.

**Chat Interface Changes:**
- **Simplified empty state** with exactly 2 suggestion cards (not 3):
  - "Automate something" (primary, large card)
  - "Help me decide" (secondary, smaller)
- **Guided prompts** appear as contextual tooltip: "Try saying: When I get an email, save the attachment to Dropbox"
- **Progress indicator** in header: "Step 1 of 3 to your first workflow" (disappears after first workflow created)
- **Larger, more prominent suggestion chips** during clarifying questions (44px+ touch targets)
- **Animated visual feedback** when a workflow card generates (confetti-like particle burst on the card)
- **No "Think with me" mode** -- hidden entirely; this is an advanced concept

**Dashboard Changes:**
- **Hide achievements section** entirely (no progress bars to confuse new users)
- **Hide recommended integrations** (too many choices)
- **Enlarge "Build a Workflow" CTA** to take full width instead of 2/3
- **Replace stats grid** with a single "Getting Started" checklist:
  1. Create your first workflow (checkbox)
  2. Connect an app (checkbox)
  3. Run your first automation (checkbox)
- **Show a guided tooltip** pointing to the chat button: "This is where the magic happens"

**Sidebar Changes:**
- **Show only 4 items:** Chat, Dashboard, Settings, Help (new)
- **Hide:** Workflows, Templates, Integrations, WhatsApp, AI Consultancy
- These hidden items appear as they become relevant (e.g., after first workflow created, Workflows nav appears)

**Input Area Changes:**
- **Placeholder text** rotates through examples every 5 seconds:
  - "Send me a daily weather summary..."
  - "When I get a new lead, add it to my spreadsheet..."
  - "Remind my team about standup every morning..."
- **Hide voice button** initially (fewer controls = less overwhelm)
- Voice button appears after 5+ chat sessions

---

### Level 2: Intermediate

**Philosophy:** Unlock the tools. Show the ecosystem. Encourage exploration.

**Chat Interface Changes:**
- **Full 3-card empty state** (current design works well here)
- **"Think with me" mode accessible** from sidebar dropdown
- **Template quick-picks** appear below the chat input as horizontal scrollable chips:
  - "Email to Sheets" / "Slack Notification" / "Calendar Sync" / "Report Builder"
  - Clicking a chip pre-fills the chat with that template's description
- **Workflow history panel** accessible via sidebar (already exists but becomes more prominent)
- **"Favorites" system**: Star a workflow to pin it to the top of history

**Dashboard Changes:**
- **Full stats grid** visible (4 cards)
- **Recent workflows** section visible
- **AI Suggestions** section visible
- **Achievements visible** but with "unlock" animations when earned
- **Recommended integrations** appear
- **New "Quick Actions" row** below hero:
  - "Run Last Workflow" button (one-click re-execute)
  - "Duplicate & Edit" button
  - "Browse Templates" button

**Sidebar Changes:**
- **All 8 navigation items visible**
- **Chat dropdown shows full history** (up to 10 sessions, already implemented)
- **Badge system**: Show "3 new" badge on Templates if new ones match user's profile

**Input Area Changes:**
- **Voice button always visible**
- **Language selector visible**
- **Hint text**: Show keyboard shortcuts hint: "Ctrl+K to quick-search"

---

### Level 3: Power User

**Philosophy:** Maximum efficiency. Keyboard-first. Batch operations. Full control.

**Chat Interface Changes:**
- **Cmd+K Command Palette** (see Section 3 below)
- **Slash commands in chat input:**
  - `/run [workflow-name]` -- Execute a saved workflow
  - `/edit [workflow-name]` -- Open workflow in editor
  - `/connect [app-name]` -- Initiate OAuth for an app
  - `/template [name]` -- Load a template
  - `/batch` -- Enter batch execution mode
  - `/history` -- Show recent workflow runs with status
- **Multi-workflow management:** Select multiple workflows for batch operations
- **Inline code blocks** in chat for advanced configuration (JSON editor for node params)
- **Workflow diff view:** When refining, show what changed (added nodes in green, removed in red)

**Dashboard Changes:**
- **Compact stats** (single-row inline numbers, not cards)
- **Workflow queue panel:** Show running/scheduled workflows with real-time status
- **Quick terminal:** Small command input at top of dashboard for rapid actions
- **Keyboard shortcut cheat sheet** accessible via `?` key
- **Drag-and-drop workflow ordering**

**Sidebar Changes:**
- **Collapsible sidebar** via `[` key
- **Pin/unpin items** to customize navigation order
- **Quick-jump numbers:** Press 1-9 to jump to nav items directly

**Input Area Changes:**
- **Auto-complete for slash commands** (dropdown appears when typing `/`)
- **Command history** via Up/Down arrow keys (like a terminal)
- **Multi-line mode** toggle for complex prompts
- **Variable insertion:** Type `{{` to insert variables from previous workflow outputs

---

## 3. Cmd+K Command Palette Design

### Library Recommendation

**cmdk by Paco Coursey** (https://cmdk.paco.me/) -- the library that powers command palettes in Linear, Raycast, and Vercel. It integrates naturally with **shadcn/ui's Command component** which Nexus already has access to since the project uses shadcn/ui.

Alternatively, **kbar** (https://github.com/timc1/kbar) is a viable option if a more opinionated, plug-and-play solution is preferred.

### Palette Structure

```
+------------------------------------------------------------+
|  [Search icon]  Type a command or search...        Ctrl+K  |
+------------------------------------------------------------+
|                                                            |
|  QUICK ACTIONS                                             |
|  > New Workflow              Ctrl+N                        |
|  > Run Last Workflow         Ctrl+Shift+R                  |
|  > New Chat Session          Ctrl+Shift+N                  |
|                                                            |
|  NAVIGATION                                                |
|  > Go to Dashboard           Ctrl+1                        |
|  > Go to Workflows           Ctrl+2                        |
|  > Go to Integrations        Ctrl+3                        |
|  > Go to Settings            Ctrl+4                        |
|                                                            |
|  WORKFLOWS (recent)                                        |
|  > Email to Sheets Sync      Last run: 2h ago              |
|  > Slack Daily Standup       Last run: 1d ago              |
|  > Client Invoice Generator  Last run: 3d ago              |
|                                                            |
|  INTEGRATIONS                                              |
|  > Connect Gmail             [Connected]                   |
|  > Connect Slack             [Not connected]               |
|  > Connect Google Sheets     [Connected]                   |
|                                                            |
|  TEMPLATES                                                 |
|  > Browse all templates                                    |
|  > Email Automation Pack                                   |
|  > Sales Pipeline Starter                                  |
|                                                            |
+------------------------------------------------------------+
```

### Command Categories

| Category | Commands | Behavior |
|----------|----------|----------|
| **Quick Actions** | New Workflow, Run Last, New Chat, Think with Me | Immediate action |
| **Navigation** | Go to Dashboard/Workflows/Templates/Integrations/Settings/Profile | Route change |
| **Workflows** | Search by name, run, edit, duplicate, delete | Workflow operations |
| **Integrations** | Connect [app], Disconnect [app], Check status | OAuth management |
| **Templates** | Browse, filter by category, preview | Template browsing |
| **Settings** | Toggle dark mode, change language, keyboard shortcuts | Settings shortcuts |
| **Advanced** | Export workflows, Import config, API access, Batch mode | Power features |

### Search Behavior

1. **Fuzzy matching** on command names and descriptions
2. **Context-aware ranking:** If user is on /workflows page, workflow-related commands rank higher
3. **Recent commands** appear first when palette opens with empty query
4. **Inline preview:** Hovering a workflow command shows step count and last run info
5. **Keyboard navigation:** Up/Down arrows, Enter to select, Esc to close

### Implementation Sketch

```typescript
// CommandPalette.tsx - wraps cmdk
import { Command } from 'cmdk'

interface CommandItem {
  id: string
  label: string
  category: string
  icon: React.ReactNode
  shortcut?: string
  action: () => void
  keywords?: string[]     // additional search terms
  disabled?: boolean
  badge?: string           // e.g., "Connected", "3 runs"
}

function useCommandPalette() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return { open, setOpen }
}
```

### When to Show the Palette

- **Beginner:** Hidden. No Ctrl+K hint shown anywhere.
- **Intermediate:** Ctrl+K hint shown in chat input area. Palette available but with reduced command set (navigation + quick actions only).
- **Power User:** Full palette with all categories. Shown on every page. Ctrl+K hint prominent.

---

## 4. Keyboard Shortcuts System

### Global Shortcuts (available on every page)

| Shortcut | Action | User Level |
|----------|--------|------------|
| `Ctrl+K` / `Cmd+K` | Open command palette | Intermediate+ |
| `Ctrl+N` / `Cmd+N` | New chat / New workflow | Intermediate+ |
| `Ctrl+Shift+N` | New chat session | Power |
| `/` | Focus chat input | All (when on chat page) |
| `Esc` | Close modal/panel/palette | All |
| `?` | Show keyboard shortcut cheat sheet | Power |
| `[` | Toggle sidebar collapsed/expanded | Power |
| `1-9` | Jump to Nth sidebar nav item | Power |

### Chat Page Shortcuts

| Shortcut | Action | User Level |
|----------|--------|------------|
| `Enter` | Send message | All |
| `Shift+Enter` | New line in input | All |
| `Ctrl+Shift+R` | Run last workflow | Intermediate+ |
| `Up Arrow` | (in empty input) Recall last message | Power |
| `Ctrl+E` | Execute current workflow card | Intermediate+ |
| `Ctrl+H` | Toggle history panel | Intermediate+ |

### Dashboard Shortcuts

| Shortcut | Action | User Level |
|----------|--------|------------|
| `N` | Navigate to new workflow (chat) | Intermediate+ |
| `W` | Go to Workflows page | Intermediate+ |
| `T` | Go to Templates page | Intermediate+ |
| `I` | Go to Integrations page | Power |
| `R` | Refresh dashboard data | Power |

### Workflow Page Shortcuts

| Shortcut | Action | User Level |
|----------|--------|------------|
| `Enter` | Open selected workflow | Intermediate+ |
| `D` | Duplicate selected workflow | Power |
| `Backspace` / `Delete` | Delete selected workflow (with confirm) | Power |
| `E` | Edit selected workflow | Power |
| `Ctrl+A` | Select all workflows | Power |
| `Space` | Toggle workflow active/paused | Power |

### Implementation Pattern

```typescript
// useKeyboardShortcuts.ts
interface ShortcutConfig {
  key: string
  modifiers?: ('ctrl' | 'shift' | 'alt' | 'meta')[]
  action: () => void
  scope?: 'global' | 'chat' | 'dashboard' | 'workflows'
  minLevel: UserLevel
  description: string
}

function useKeyboardShortcuts(
  shortcuts: ShortcutConfig[],
  userLevel: UserLevel,
  currentScope: string
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Only allow Esc and Ctrl+K when in input
        if (e.key !== 'Escape' && !(e.ctrlKey && e.key === 'k')) return
      }

      for (const shortcut of shortcuts) {
        if (shortcut.key !== e.key) continue
        if (shortcut.modifiers?.includes('ctrl') && !e.ctrlKey) continue
        if (shortcut.modifiers?.includes('shift') && !e.shiftKey) continue
        if (shortcut.modifiers?.includes('alt') && !e.altKey) continue
        if (shortcut.modifiers?.includes('meta') && !e.metaKey) continue

        // Check user level
        const levelOrder: UserLevel[] = ['beginner', 'intermediate', 'power_user']
        if (levelOrder.indexOf(userLevel) < levelOrder.indexOf(shortcut.minLevel)) continue

        // Check scope
        if (shortcut.scope && shortcut.scope !== 'global' && shortcut.scope !== currentScope) continue

        e.preventDefault()
        shortcut.action()
        break
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [shortcuts, userLevel, currentScope])
}
```

### Shortcut Cheat Sheet Modal

Triggered by `?` key (power users only). Displays a modal with all available shortcuts organized by page/context. Design:

```
+------------------------------------------------------------+
|  Keyboard Shortcuts                                   [X]  |
+------------------------------------------------------------+
|                                                            |
|  GLOBAL                          CHAT                      |
|  Ctrl+K   Command palette       Enter     Send message     |
|  Ctrl+N   New workflow           Shift+Enter  New line      |
|  Esc      Close panel            Ctrl+E    Execute          |
|  ?        This cheat sheet       Ctrl+H    History          |
|  [        Toggle sidebar         Up        Recall message   |
|                                                            |
|  DASHBOARD                       WORKFLOWS                  |
|  N        New workflow           Enter     Open selected    |
|  W        Go to Workflows        D         Duplicate        |
|  T        Go to Templates        E         Edit             |
|  R        Refresh                Space     Toggle status    |
|                                                            |
+------------------------------------------------------------+
```

---

## 5. Magic Moment Flows per User Level

### Beginner: "My First Automation" (Target: < 3 minutes)

**Trigger:** User completes onboarding OR first visit to /chat

**Flow:**

```
Step 1: Welcoming Empty State
  - Large hero: "What do you want to automate?"
  - Two suggestion tiles, one is highlighted with a pulsing border
  - Example prompt pre-filled (grayed out) in the input: "When I get an email..."

Step 2: User Types or Clicks Suggestion
  - AI responds with clarifying question (1-2 max for beginners)
  - Options appear as large, colorful cards (not small chips)
  - "Custom..." option present but de-emphasized

Step 3: Workflow Card Appears
  - CELEBRATION: Subtle confetti animation on the card
  - Card has pulsing "Execute" button with a tooltip: "Click to make it real!"
  - Step counter: "Your first workflow has 3 steps"

Step 4: User Clicks Execute
  - OAuth popup if needed (guided: "We'll connect your Gmail -- just click Allow")
  - Execution with real-time log animation
  - SUCCESS: Full-screen celebration overlay:
    "You just automated your first task!
     You'll save ~2 hours/week. What else should we automate?"

Step 5: Post-Success Nudge
  - Getting Started checklist updates (1/3 complete)
  - New suggestion appears: "Want to also get a Slack notification when this runs?"
  - Achievement unlocked: "First Automation" badge (visible on profile)
```

**Magic Moment:** The instant the workflow executes successfully and the user realizes "I just built something that will work for me forever, in under 3 minutes."

---

### Intermediate: "The Ecosystem Click" (Target: < 60 seconds per new workflow)

**Trigger:** User has 3+ workflows and returns to the app

**Flow:**

```
Step 1: Contextual Dashboard
  - Dashboard shows REAL stats: "You've saved 4.5 hours this week"
  - AI Suggestion card is personalized: "Your email workflow ran 12 times.
    Want to add a Google Sheets log?"
  - Quick action: "Run Last Workflow" button prominent

Step 2: Template Quick-Picks
  - Below chat input, horizontal scroll of relevant templates
  - Templates filtered by user's industry + connected integrations
  - One template marked "Recommended for you" with a star

Step 3: User Picks a Template
  - Template auto-fills the chat: pre-written workflow description
  - Workflow generates in < 2 seconds (from template, no AI delay)
  - User sees: "Based on your Gmail + Sheets setup, here's your workflow"

Step 4: One-Click Customization
  - Inline editing: Click a node to change the action
  - "Add a step" button at the bottom of the workflow card
  - Confidence badge: "98% ready -- all your apps are connected"

Step 5: Execution with Learning
  - Real-time execution log
  - Post-execution: "Tip: You can schedule this to run daily.
    Type /schedule to set it up."
  - Keyboard shortcut hint: "Press Ctrl+K to search your workflows anytime"
```

**Magic Moment:** The realization that templates + connected integrations = workflows that practically build themselves. The ecosystem compounds.

---

### Power User: "The 10x Operator" (Target: < 10 seconds per action)

**Trigger:** User has 10+ workflows and high success rate

**Flow:**

```
Step 1: Cmd+K as Home Base
  - User presses Ctrl+K immediately
  - Recent workflows shown first
  - Types: "run email" -- fuzzy matches "Email to Sheets Sync"
  - Enter -- workflow begins executing

Step 2: Slash Command Workflow
  - In chat: /batch
  - System: "Batch mode active. Describe operations:"
  - User: "Run all daily workflows, then send me a summary on Slack"
  - System orchestrates: parallel execution + summary generation

Step 3: Keyboard-Only Navigation
  - Press [ to collapse sidebar
  - Press 2 to jump to Workflows
  - Arrow keys to select workflow
  - E to edit, Enter to run, D to duplicate
  - Never touches the mouse

Step 4: Advanced Configuration
  - In workflow editor: JSON mode toggle for node parameters
  - Variable insertion: {{previous_step.output}} syntax
  - Conditional logic: "If email has attachment, save to Dropbox; else, skip"
  - Cron scheduling via slash command: /schedule "every weekday at 9am"

Step 5: Analytics & Optimization
  - Dashboard compact mode: all stats in one row
  - Workflow performance heatmap: which steps are slow
  - Optimization suggestions: "Step 3 takes 4s avg.
    Switch to batch API to cut to 0.5s"
```

**Magic Moment:** The feeling of operating a powerful system entirely through keyboard commands, where thought and execution have zero friction. "I just orchestrated 5 automations in 30 seconds without clicking anything."

---

## 6. Implementation Architecture

### New Files to Create

```
src/
  contexts/
    UserLevelContext.tsx          -- React context providing current user level
  hooks/
    useUserLevel.ts              -- Hook to detect/override user level
    useKeyboardShortcuts.ts      -- Global keyboard shortcut manager
    useCommandPalette.ts         -- Command palette state/commands
  components/
    CommandPalette.tsx            -- Cmd+K palette UI (wraps cmdk)
    ShortcutCheatSheet.tsx        -- ? key modal
    ProgressiveContainer.tsx      -- Wrapper that shows/hides children by level
    SlashCommandAutocomplete.tsx  -- Autocomplete dropdown for /commands
    GettingStartedChecklist.tsx   -- Beginner checklist component
    TemplateQuickPicks.tsx        -- Horizontal scroll template chips
```

### Files to Modify

| File | Changes |
|------|---------|
| `ChatContainer.tsx` | Wrap in `ProgressiveContainer`, add slash command detection, import `CommandPalette` |
| `ChatInput.tsx` | Add slash command autocomplete, command history (Up arrow), variable insertion |
| `Dashboard.tsx` | Conditional rendering by user level, compact stats mode, getting started checklist |
| `SidebarNavigation.tsx` | Conditional nav items by level, collapsible via `[` key, number shortcuts |
| `App.tsx` (or root layout) | Wrap app in `UserLevelContext.Provider`, mount `CommandPalette` globally |
| `UserMemoryService.ts` | Add `getUserLevel()` method using detection algorithm |
| `Settings.tsx` | Add "Experience Level" toggle (Beginner/Intermediate/Power User) |

### State Management

```typescript
// UserLevelContext.tsx
interface UserLevelState {
  detectedLevel: UserLevel        // Auto-detected from usage data
  overrideLevel: UserLevel | null // Manual override from settings
  effectiveLevel: UserLevel       // overrideLevel ?? detectedLevel
  isTransitioning: boolean        // True when user just leveled up
  lastLevelChange: Date | null
}
```

### Level-Up Notifications

When a user's detected level changes (e.g., beginner -> intermediate), show a celebration toast:

```
"You've leveled up! New features unlocked:
 - Template quick-picks in chat
 - Ctrl+K command palette
 - Workflow favorites

[Explore New Features]  [Dismiss]"
```

---

## 7. Recommended Libraries & Dependencies

| Library | Purpose | Size | Notes |
|---------|---------|------|-------|
| `cmdk` | Command palette (headless) | ~5KB | Used by shadcn/ui Command component |
| `tinykeys` | Keyboard shortcut binding | ~1KB | Lightweight alternative to hotkeys-js |
| `canvas-confetti` | Celebration animations | ~5KB | For beginner magic moments |

All three are lightweight. `cmdk` may already be available via the shadcn/ui dependency tree. `tinykeys` is preferred over `hotkeys-js` because it is 1/10th the size and handles modifier keys correctly on both Mac and Windows.

---

## 8. Migration Path from Current UI

### Phase 1: Foundation (No visible changes)

1. Create `UserLevelContext` and `useUserLevel` hook
2. Add `getUserLevel()` to `UserMemoryService`
3. Add "Experience Level" setting to Settings page
4. Wire up `UserLevelContext.Provider` in app root

### Phase 2: Progressive Dashboard (Beginner improvements)

1. Create `GettingStartedChecklist` component
2. Modify `Dashboard.tsx` to conditionally show checklist vs. stats
3. Conditionally hide/show sidebar nav items based on level
4. Add level-up toast notification system

### Phase 3: Command Palette (Power user unlock)

1. Install `cmdk` (or use existing shadcn Command)
2. Create `CommandPalette.tsx` with workflow search, navigation, quick actions
3. Create `useKeyboardShortcuts.ts` global hook
4. Create `ShortcutCheatSheet.tsx` modal
5. Add keyboard shortcut hints to existing UI elements

### Phase 4: Chat Enhancements (All levels)

1. Add slash command detection to `ChatInput.tsx`
2. Create `SlashCommandAutocomplete.tsx`
3. Add template quick-picks below chat input (intermediate+)
4. Add command history via Up arrow (power+)
5. Add `ProgressiveContainer` wrappers throughout `ChatContainer.tsx`

### Phase 5: Polish

1. Confetti animation on first workflow success
2. Transition animations between levels
3. A/B testing for suggestion card layouts
4. Analytics tracking for which level features are used most

---

## Summary of Research Sources

- [Progressive Disclosure AI Design Patterns](https://www.aiuxdesign.guide/patterns/progressive-disclosure) - Comprehensive pattern library for AI UX
- [Progressive Disclosure in UX Design - LogRocket](https://blog.logrocket.com/ux-design/progressive-disclosure-ux-types-use-cases/) - Types and use cases
- [Progressive Disclosure Examples - Userpilot](https://userpilot.com/blog/progressive-disclosure-examples/) - SaaS-specific examples
- [Progressive Disclosure Matters: 90s UX Wisdom for 2026 AI](https://aipositive.substack.com/p/progressive-disclosure-matters) - Applying to modern AI agents
- [B2B SaaS UX Design in 2026](https://www.onething.design/post/b2b-saas-ux-design) - Current SaaS UX trends
- [cmdk - Command Menu React Component](https://cmdk.paco.me/) - Headless command palette by Paco Coursey
- [shadcn/ui Command Component](https://www.shadcn.io/ui/command) - Built on cmdk, ready to use
- [kbar - Cmd+K Interface](https://github.com/timc1/kbar) - Alternative command palette
- [react-cmdk](https://react-cmdk.com/) - Full-featured command palette with dark mode
- [How Top AI Tools Onboard New Users in 2026](https://userguiding.com/blog/how-top-ai-tools-onboard-new-users) - Industry benchmarks
- [SaaS User Activation Strategies](https://www.saasfactor.co/blogs/saas-user-activation-proven-onboarding-strategies-to-increase-retention-and-mrr) - Activation metrics
- [Product-Led Growth in SaaS 2026](https://userguiding.com/blog/state-of-plg-in-saas) - PLG trends and time-to-value
- [React Command Palette with Tailwind - LogRocket](https://blog.logrocket.com/react-command-palette-tailwind-css-headless-ui/) - Implementation guide

---

## Key Design Principles

1. **Never subtract, only add.** Each level adds capabilities; nothing is taken away when users level up.
2. **The transition between levels should feel like a reward,** not a configuration change.
3. **Keyboard shortcuts must coexist with mouse users.** Every keyboard action has a mouse equivalent.
4. **Progressive disclosure is about timing, not hiding.** Features appear when the user is ready, not when they search.
5. **The command palette is the power user's home screen.** If Ctrl+K can do it, that is the fastest path.
6. **Beginners need fewer choices, not fewer capabilities.** The full system is always there; the UI just reveals it gradually.
7. **Measure level transitions.** Track how long it takes users to move beginner -> intermediate -> power. Optimize the bottlenecks.

---

*Agent 10 (UX Specialist) -- Cycle 3 Research Complete*
