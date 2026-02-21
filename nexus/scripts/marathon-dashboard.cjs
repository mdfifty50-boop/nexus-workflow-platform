#!/usr/bin/env node
/**
 * Marathon E2E Test Dashboard — Live Implementation Monitor
 *
 * Run: node scripts/marathon-dashboard.cjs
 * Opens: http://localhost:3456
 *
 * Auto-scans the codebase every 30 seconds to detect implementation status.
 * No manual status updates needed — reads fix markers, file existence, and code patterns.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = 3456;

// ═══════════════════════════════════════════════════════
// ALL ITEMS FROM MARATHON E2E TEST LOG
// ═══════════════════════════════════════════════════════

const ALL_ITEMS = [
  // ── BATCH 0: BRANCH SYNC ──
  {
    id: 'SYNC-001',
    batch: 0,
    batchName: 'Branch Sync (Pre-requisite)',
    title: 'Sync main with golden-path branch',
    description: 'Production (golden-path) is 17 commits ahead of main. Must sync before implementing new features.',
    priority: 'P0',
    type: 'infra',
    effort: '30 min',
    detection: { type: 'playwright-check', note: 'Verified via git: 17 commits behind. Will re-check with git log after sync.' },
  },

  // ── BATCH 1: DEPLOYED FIXES (Verify) ──
  {
    id: 'FIX-187',
    batch: 1,
    batchName: 'Deployed Fixes (Verify)',
    title: 'Tool-Aware Discovery Gate — unnecessary clarifying Qs',
    description: 'AI brain was asking unnecessary clarifying questions when tools explicitly mentioned in first message. Fixed in chat.ts.',
    priority: 'P0',
    type: 'fix-deployed',
    effort: 'Done',
    detection: { type: 'grep', pattern: 'FIX-187', files: ['server/routes/chat.ts'] },
  },
  {
    id: 'FIX-190',
    batch: 1,
    batchName: 'Deployed Fixes (Verify)',
    title: 'Context bridge for multi-turn follow-ups',
    description: 'Robust message extraction when Claude returns empty message in multi-turn conversations. Short follow-ups now maintain context.',
    priority: 'P0',
    type: 'fix-deployed',
    effort: 'Done',
    detection: { type: 'grep', pattern: 'FIX-190', files: ['server/routes/chat.ts'] },
  },
  {
    id: 'FIX-191',
    batch: 1,
    batchName: 'Deployed Fixes (Verify)',
    title: 'Mid-stream JSON detection',
    description: 'Prevents raw JSON when Claude outputs text preamble before JSON in SSE streaming.',
    priority: 'P1',
    type: 'fix-deployed',
    effort: 'Done',
    detection: { type: 'grep', pattern: 'FIX-191', files: ['server/routes/chat.ts', 'src/components/chat/ChatContainer.tsx'] },
  },
  {
    id: 'FIX-192',
    batch: 1,
    batchName: 'Deployed Fixes (Verify)',
    title: 'Permissive B64 regex for clarifying options',
    description: 'CLARIFYING_OPTIONS_B64 regex was too strict ([A-Za-z0-9+/=]+). Changed to permissive [^\\]]+. Arabic B64 encoding now works.',
    priority: 'P1',
    type: 'fix-deployed',
    effort: 'Done',
    detection: { type: 'grep', pattern: 'FIX-192', files: ['src/components/chat/ChatMessage.tsx'] },
  },
  {
    id: 'FIX-197',
    batch: 1,
    batchName: 'Deployed Fixes (Verify)',
    title: 'AIConsultancy StrictMode double-mount context loss',
    description: 'useRef instead of useMemo to survive React StrictMode double-mount. Context from chat Deep Dive button was lost.',
    priority: 'P1',
    type: 'fix-deployed',
    effort: 'Done',
    detection: { type: 'grep', pattern: 'FIX-197', files: ['src/pages/AIConsultancy.tsx'] },
  },
  {
    id: 'FIX-196',
    batch: 1,
    batchName: 'Deployed Fixes (Verify)',
    title: 'Stream Health — SSE consecutive failure tracking',
    description: 'Tracks SSE consecutive failures and skips streaming after 3 failures, falling back to non-streaming. Prevents double-billing on persistent SSE issues.',
    priority: 'P1',
    type: 'fix-deployed',
    effort: 'Done',
    detection: { type: 'grep', pattern: 'FIX-196|streamConsecutiveFailures|consecutiveFailures', files: ['src/services/NexusAIService.ts'] },
  },
  {
    id: 'FIX-189',
    batch: 1,
    batchName: 'Deployed Fixes (Verify)',
    title: 'Unicode/Arabic btoa() crash fix',
    description: 'btoa() crashes on non-Latin1 characters in Arabic text. Fixed with encodeURIComponent + unescape wrapper for safe B64 encoding.',
    priority: 'P1',
    type: 'fix-deployed',
    effort: 'Done',
    detection: { type: 'grep', pattern: 'FIX-189|encodeURIComponent.*btoa|safeBtoa|unicode.*btoa', files: ['src/components/chat/ChatContainer.tsx', 'src/components/chat/ChatMessage.tsx'] },
  },

  // ── BATCH 2: LOCALDEV BUGS FIXED (Verify in code) ──
  {
    id: 'BUG-AP-001',
    batch: 2,
    batchName: 'Autopilot Bugs Fixed (Verify)',
    title: 'Empty Autopilot Panel — no idle view',
    description: 'Clicking robot button before discussion showed empty panel. Fixed with "Autopilot Ready" placeholder.',
    priority: 'P2',
    type: 'bug-fixed',
    effort: 'Done',
    detection: { type: 'grep', pattern: 'Autopilot Ready|Listening to discussion', files: ['src/components/autopilot/AutopilotPanel.tsx'] },
  },
  {
    id: 'BUG-AP-002',
    batch: 2,
    batchName: 'Autopilot Bugs Fixed (Verify)',
    title: 'Stale closure in hint detection',
    description: 'messages in finally block used stale closure from function call time. Fixed with messagesRef.current.',
    priority: 'P1',
    type: 'bug-fixed',
    effort: 'Done',
    detection: { type: 'grep', pattern: 'messagesRef', files: ['src/components/AIMeetingRoomV2.tsx'] },
  },
  {
    id: 'BUG-AP-003',
    batch: 2,
    batchName: 'Autopilot Bugs Fixed (Verify)',
    title: 'Undefined Session ID — response shape mismatch',
    description: 'Backend returns { session: { id } } but frontend expected { sessionId }. AutopilotService mapping fixed.',
    priority: 'P0',
    type: 'bug-fixed',
    effort: 'Done',
    detection: { type: 'grep', pattern: 'session\\.id|session\\.state', files: ['src/services/AutopilotService.ts'] },
  },
  {
    id: 'BUG-AP-004',
    batch: 2,
    batchName: 'Autopilot Bugs Fixed (Verify)',
    title: 'prev.map crash on HMR state corruption',
    description: 'React HMR corrupted useState arrays. Added safeArr() utility to coerce unknown to array.',
    priority: 'P1',
    type: 'bug-fixed',
    effort: 'Done',
    detection: { type: 'grep', pattern: 'safeArr', files: ['src/components/autopilot/AutopilotPanel.tsx'] },
  },
  {
    id: 'UX-AP-001',
    batch: 2,
    batchName: 'Autopilot Bugs Fixed (Verify)',
    title: 'Autopilot hint triggers too aggressively',
    description: 'Threshold raised from 3 agent responses to 3+ user messages AND 6+ agent responses (2-3 full discussion rounds).',
    priority: 'P2',
    type: 'bug-fixed',
    effort: 'Done',
    detection: { type: 'grep', pattern: 'userMessages >= 3|agentResponses >= 6|userMessageCount >= 3', files: ['src/components/AIMeetingRoomV2.tsx'] },
  },

  // ── BATCH 3: NEW FEATURES (Verify files exist) ──
  {
    id: 'FEAT-HITL',
    batch: 3,
    batchName: 'New Features (LocalDev → Production)',
    title: 'Human-in-the-Loop (HITL) Approval Gates',
    description: 'Workflow execution pauses at HITL-flagged nodes. Shows Approve/Reject/Escalate UI. Tested in T4 and T11.',
    priority: 'P0',
    type: 'feature',
    effort: '2 days',
    detection: { type: 'grep', pattern: 'awaiting_approval|ApprovalCard|approval.*gate', files: ['src/components/chat/WorkflowPreviewCard.tsx'] },
  },
  {
    id: 'FEAT-AUTOPILOT',
    batch: 3,
    batchName: 'New Features (LocalDev → Production)',
    title: 'Nexus Autopilot — AI browser configuration assistant',
    description: '11 new files: Playwright-based browser automation in AI Consultancy room. Live screenshots, credential prompts, session lifecycle.',
    priority: 'P1',
    type: 'feature',
    effort: '3 days',
    detection: { type: 'file-exists', files: [
      'server/services/AutopilotEngine.ts',
      'server/services/AutopilotPageDetector.ts',
      'server/routes/autopilot.ts',
      'src/config/feature-flags.ts',
      'src/services/AutopilotService.ts',
      'src/services/AutopilotActionPlanner.ts',
      'src/components/autopilot/AutopilotPanel.tsx',
      'src/components/autopilot/AutopilotControls.tsx',
      'src/components/autopilot/AutopilotProgress.tsx',
      'src/components/autopilot/CredentialPrompt.tsx',
      'src/components/autopilot/GuidedInstructions.tsx',
    ]},
  },
  {
    id: 'FEAT-CLICKABLE-LINK',
    batch: 3,
    batchName: 'New Features (LocalDev → Production)',
    title: 'Clickable AI Consultancy Link with Context Handoff',
    description: 'AUTOPILOT_CONSULTANCY_LINK marker in ChatMessage.tsx renders clickable button. Stores context to localStorage, navigates to /ai-consultancy.',
    priority: 'P1',
    type: 'feature',
    effort: 'Done',
    detection: { type: 'grep', pattern: 'AUTOPILOT_CONSULTANCY_LINK', files: ['src/components/chat/ChatMessage.tsx'] },
  },

  // ── BATCH 4: P2 BUGS (Not yet fixed) ──
  {
    id: 'P2-JSON-STREAM',
    batch: 4,
    batchName: 'P2 Bugs (Open)',
    title: 'Raw JSON briefly visible during Arabic SSE streaming',
    description: 'Brief raw JSON visible during streaming before workflow card renders. Cosmetic but visible to users.',
    priority: 'P2',
    type: 'bug-open',
    effort: '2 hours',
    detection: { type: 'grep', pattern: 'FIX-188|isThinking|Nexus is thinking', files: ['src/components/chat/ChatContainer.tsx', 'src/components/chat/ChatMessage.tsx'] },
  },
  {
    id: 'P2-USER-PROFILE-404',
    batch: 4,
    batchName: 'P2 Bugs (Open)',
    title: '/api/user-profile/context recurring 404',
    description: 'Every chat interaction triggers 404 on /api/user-profile/context. Endpoint missing or Supabase credentials not configured.',
    priority: 'P2',
    type: 'bug-open',
    effort: '1 hour',
    detection: { type: 'grep', pattern: 'user-profile/context', files: ['server/routes/*.ts', 'server/index.ts'] },
  },
  {
    id: 'P2-SERVICE-STATUS-404',
    batch: 4,
    batchName: 'P2 Bugs (Open)',
    title: '/api/services/*-status endpoints missing',
    description: 'user-preferences-status and chat-persistence-status endpoints return 404. Missing route definitions.',
    priority: 'P2',
    type: 'bug-open',
    effort: '1 hour',
    detection: { type: 'grep', pattern: 'preferences-status|persistence-status', files: ['server/routes/*.ts', 'server/index.ts'] },
  },
  {
    id: 'P2-SEND-TO-MYSELF',
    batch: 4,
    batchName: 'P2 Bugs (Open)',
    title: '"Send to Myself" button shows validation error',
    description: 'Quick Setup "Send to Myself" shortcut shows validation error instead of auto-filling logged-in user email.',
    priority: 'P2',
    type: 'bug-open',
    effort: '1 hour',
    detection: { type: 'grep', pattern: 'getUserEmail|autoFillEmail|currentUser.*email.*sendToMyself', files: ['src/components/chat/WorkflowPreviewCard.tsx'] },
    detectionNote: 'Button text exists but handler must auto-fill email — grep for handler logic, not button label',
  },
  {
    id: 'P2-SSE-503',
    batch: 4,
    batchName: 'P2 Bugs (Open)',
    title: 'Streaming SSE returns 503 intermittently',
    description: 'SSE endpoint returns 503 sometimes, falls back to non-streaming. Adds latency but no double cost.',
    priority: 'P2',
    type: 'bug-open',
    effort: '2 hours',
    detection: { type: 'grep', pattern: 'stream.*503|503.*stream|SSE.*fallback|fallback.*stream', files: ['server/routes/chat.ts', 'src/lib/api-client.ts'] },
  },
  {
    id: 'P3-CONTEXT-TRUNCATE',
    batch: 4,
    batchName: 'P2 Bugs (Open)',
    title: 'Consulting room context truncated on handoff',
    description: 'Context from chat to AI Consultancy occasionally truncated ("all thre" instead of "all three"). Minor P3.',
    priority: 'P3',
    type: 'bug-open',
    effort: '30 min',
    detection: { type: 'grep', pattern: 'FIX-CONTEXT-TRUNCATE|expandedContext|fullContext.*handoff', files: ['src/pages/AIConsultancy.tsx', 'src/components/chat/ChatContainer.tsx'] },
    detectionNote: 'Old detection found substring(0,N) which IS the bug. New detection looks for explicit fix marker or expanded context logic.',
  },

  // ── BATCH 5: UX GAPS ──
  {
    id: 'UX-CLERK-BLANK',
    batch: 5,
    batchName: 'UX Gaps (Open)',
    title: 'Clerk login 2-3 second blank screen before render',
    description: 'Login page shows blank for 2-3 seconds while Clerk JS initializes. Add loading spinner or skeleton.',
    priority: 'P3',
    type: 'ux-gap',
    effort: '1 hour',
    detection: { type: 'grep', pattern: 'ClerkLoading|clerk.*loading|SignIn.*loading', files: ['src/pages/*.tsx', 'src/components/*.tsx'] },
  },
  {
    id: 'UX-DISCOVERY-PROGRESS',
    batch: 5,
    batchName: 'UX Gaps (Open)',
    title: '"Discovering required fields..." needs progress bar',
    description: 'Beta Test discovery spinner shows generic message. Should show service names being discovered and progress indicator.',
    priority: 'P2',
    type: 'ux-gap',
    effort: '2 hours',
    detection: { type: 'grep', pattern: 'Discovering.*service|discovery.*progress|discoveryProgress', files: ['src/components/chat/WorkflowPreviewCard.tsx'] },
  },
  {
    id: 'UX-BACK-TO-CHAT',
    batch: 5,
    batchName: 'UX Gaps (Open)',
    title: 'No "Back to Chat" navigation from AI Consultancy',
    description: 'User must use sidebar to return to chat from AI Consultancy page. Should have explicit back button.',
    priority: 'P2',
    type: 'ux-gap',
    effort: '30 min',
    detection: { type: 'grep', pattern: 'Back to Chat|backToChat|navigate.*\\/chat', files: ['src/pages/AIConsultancy.tsx', 'src/components/AIMeetingRoomV2.tsx'] },
  },

  // ── BATCH 6: AI INTELLIGENCE GAPS ──
  {
    id: 'GAP-1',
    batch: 6,
    batchName: 'AI Intelligence Gaps',
    title: 'Universal App Comprehension Prompt',
    description: 'Add UNKNOWN APP COMPREHENSION PROTOCOL to agents/index.ts system prompt. Claude reasons about ANY non-Composio app using training knowledge. Zero extra cost.',
    priority: 'P0',
    type: 'gap',
    effort: '1 hour',
    detection: { type: 'grep', pattern: 'UNKNOWN APP COMPREHENSION|appProfile|APP COMPREHENSION PROTOCOL', files: ['server/agents/index.ts'] },
  },
  {
    id: 'GAP-2',
    batch: 6,
    batchName: 'AI Intelligence Gaps',
    title: 'Per-Node Integration Confidence Tiers',
    description: 'Each workflow node shows tier: verified (Composio), ai_comprehended (Claude-known), discovery (unknown). UI badges on nodes.',
    priority: 'P2',
    type: 'gap',
    effort: '4 hours',
    detection: { type: 'grep', pattern: 'integrationTier|ai_comprehended|tier.*verified', files: ['server/agents/index.ts', 'src/components/chat/WorkflowPreviewCard.tsx'] },
  },
  {
    id: 'GAP-3',
    batch: 6,
    batchName: 'AI Intelligence Gaps',
    title: 'Persistent Self-Learning App Profiles',
    description: 'Auto-cache app profiles from Claude responses to server/data/app-profiles/. Self-growing knowledge base, no manual maintenance.',
    priority: 'P2',
    type: 'gap',
    effort: '6 hours',
    detection: { type: 'file-exists', files: ['server/data/app-profiles'] },
  },
  {
    id: 'GAP-4',
    batch: 6,
    batchName: 'AI Intelligence Gaps',
    title: 'Universal App Mention Detection (Catch-All)',
    description: 'Generic heuristic regex to detect ANY app mention ("using X", "X app", "my X account"). Replaces per-app regex expansion.',
    priority: 'P1',
    type: 'gap',
    effort: '3 hours',
    detection: { type: 'grep', pattern: 'GENERIC_APP_PATTERN|universal.*detect|catch.*all.*app|heuristic.*app', files: ['server/services/AppDetectionService.ts'] },
  },
  {
    id: 'GAP-5',
    batch: 6,
    batchName: 'AI Intelligence Gaps',
    title: 'Workflow Card Collapse After "Skip for Now"',
    description: 'Skip handler sets phase to "ready" which collapses card. Should preserve expanded state with "Some connections skipped" banner.',
    priority: 'P1',
    type: 'bug-open',
    effort: '2 hours',
    detection: { type: 'grep', pattern: 'skipped.*connection|connections.*skipped|skipAuth.*preserve|onSkip.*expanded', files: ['src/components/chat/WorkflowPreviewCard.tsx'] },
    detectionNote: 'Old detection matched onSkip.*ready which IS the buggy code. New detection looks for skip logic that preserves expanded state.',
  },

  // ── BATCH 7: COST OPTIMIZATION ──
  {
    id: 'COST-PROMPT-CACHE',
    batch: 7,
    batchName: 'Cost Optimization',
    title: 'Prompt Caching (50-60% savings)',
    description: '15K-token system prompt cached via Anthropic prompt caching. 90% discount on cache hits. Biggest single cost reduction.',
    priority: 'P0',
    type: 'optimization',
    effort: '2 hours',
    detection: { type: 'grep', pattern: 'cache_control|ephemeral.*cache|FIX-193|prompt.*cach', files: ['server/services/claudeProxy.ts'] },
  },
  {
    id: 'COST-MODEL-TIER-CHAT',
    batch: 7,
    batchName: 'Cost Optimization',
    title: 'Model Tiering for Chat Route',
    description: 'Route simple greetings to Haiku (~75% savings). Currently chat.ts sends everything to Sonnet. claudeProxy has tiering but chat doesnt use it.',
    priority: 'P1',
    type: 'optimization',
    effort: '2 hours',
    detection: { type: 'grep', pattern: 'FIX-194|selectModel|model.*tier|haiku.*greeting|greeting.*haiku', files: ['server/routes/chat.ts', 'server/services/claudeProxy.ts'] },
  },
  {
    id: 'COST-HISTORY-TRIM',
    batch: 7,
    batchName: 'Cost Optimization',
    title: 'Conversation History Trimming',
    description: 'Summarize old messages after 10+ turns. Currently sends ALL messages growing per-turn cost.',
    priority: 'P1',
    type: 'optimization',
    effort: '3 hours',
    detection: { type: 'grep', pattern: 'FIX-195|trimHistory|summarize.*history|history.*trim', files: ['server/routes/chat.ts'] },
  },
  {
    id: 'COST-PROMPT-MODULAR',
    batch: 7,
    batchName: 'Cost Optimization',
    title: 'System Prompt Modularization',
    description: 'Split 60K-char monolith into sections. Only send relevant sections based on detected intent (dont send financial patterns for greetings).',
    priority: 'P2',
    type: 'optimization',
    effort: '4 hours',
    detection: { type: 'grep', pattern: 'modular.*prompt|prompt.*section|selectPromptSections|promptModule', files: ['server/agents/index.ts', 'server/services/claudeProxy.ts'] },
  },

  // ── BATCH 8: PRODUCTION DEPLOYMENT ──
  {
    id: 'DEPLOY-FEATURES',
    batch: 8,
    batchName: 'Production Deployment',
    title: 'Deploy all localdev features to production',
    description: 'HITL, Autopilot, Clickable Link, all marathon bug fixes. Requires branch sync first (SYNC-001).',
    priority: 'P0',
    type: 'deploy',
    effort: '2 hours',
    detection: { type: 'playwright-check', note: 'Playwright: navigate to production /ai-consultancy, check for Autopilot robot button in header' },
  },
  {
    id: 'DEPLOY-FLAGS',
    batch: 8,
    batchName: 'Production Deployment',
    title: 'Configure feature flags for production',
    description: 'Set VITE_AUTOPILOT_ENABLED=true and any other feature flags in Vercel/Northflank environment.',
    priority: 'P0',
    type: 'deploy',
    effort: '15 min',
    detection: { type: 'playwright-check', note: 'Vercel CLI: vercel env ls — check VITE_AUTOPILOT_ENABLED exists in production' },
  },
  {
    id: 'DEPLOY-ENV',
    batch: 8,
    batchName: 'Production Deployment',
    title: 'Set environment variables for new services',
    description: 'Ensure all env vars for Autopilot, HITL, and new routes are set in production.',
    priority: 'P0',
    type: 'deploy',
    effort: '15 min',
    detection: { type: 'playwright-check', note: 'Vercel CLI: vercel env ls — check all Autopilot/HITL env vars present' },
  },
  {
    id: 'DEPLOY-REGRESSION',
    batch: 8,
    batchName: 'Production Deployment',
    title: 'Full regression test after deployment',
    description: 'Re-run marathon tests T1-T12 on production after deploying all changes.',
    priority: 'P0',
    type: 'deploy',
    effort: '4 hours',
    detection: { type: 'playwright-check', note: 'Playwright: run test suite on production URL, verify all 12 tests pass' },
  },

  // ── BATCH 9: E2E JOURNEY COMPLETION ──
  {
    id: 'E2E-PT-PHASE4',
    batch: 9,
    batchName: 'Personal Trainer E2E Journey',
    title: 'Phase 4: Run Beta Test execution',
    description: 'Blocked by GAP-5 (card collapse). After fix, re-run Beta Test for Personal Trainer workflow.',
    priority: 'P1',
    type: 'testing',
    effort: '1 hour',
    detection: { type: 'playwright-check', note: 'Playwright: run Beta Test on localdev, verify all nodes green. Depends on GAP-5 fix.' },
  },
  {
    id: 'E2E-PT-PHASE5',
    batch: 9,
    batchName: 'Personal Trainer E2E Journey',
    title: 'Phase 5: AI Consultancy for Personal Trainer',
    description: 'Navigate to AI Consultancy via clickable link, test context handoff with personal trainer workflow.',
    priority: 'P2',
    type: 'testing',
    effort: '30 min',
    detection: { type: 'playwright-check', note: 'Playwright: click consultancy link, verify context arrives in AI Consultancy welcome message' },
  },
  {
    id: 'E2E-PT-PHASE6',
    batch: 9,
    batchName: 'Personal Trainer E2E Journey',
    title: 'Phase 6: Autopilot for Personal Trainer',
    description: 'Open Autopilot panel, start session, test live screenshots, credential wait, cancel.',
    priority: 'P2',
    type: 'testing',
    effort: '1 hour',
    detection: { type: 'playwright-check', note: 'Playwright: open Autopilot panel, start session, verify screenshot streaming, cancel cleanly' },
  },
  {
    id: 'E2E-PT-PHASE7',
    batch: 9,
    batchName: 'Personal Trainer E2E Journey',
    title: 'Phase 7: Dashboard workflow management',
    description: 'Edit, pause, delete the personal trainer workflow on dashboard. Requires auth.',
    priority: 'P2',
    type: 'testing',
    effort: '1 hour',
    detection: { type: 'playwright-check', note: 'Playwright: requires Clerk auth. Test edit/pause/delete on dashboard after login.' },
  },
];

// ═══════════════════════════════════════════════════════
// CODEBASE SCANNER
// ═══════════════════════════════════════════════════════

function fileExists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function grepFile(filePath, pattern) {
  const fullPath = path.join(ROOT, filePath);
  if (!fs.existsSync(fullPath)) return false;
  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    return new RegExp(pattern, 'i').test(content);
  } catch { return false; }
}

function grepGlob(globPattern, searchPattern) {
  // Simple glob: handle server/routes/*.ts
  const dir = path.dirname(globPattern);
  const ext = path.extname(globPattern);
  const fullDir = path.join(ROOT, dir);
  if (!fs.existsSync(fullDir)) return false;
  try {
    const files = fs.readdirSync(fullDir).filter(f => f.endsWith(ext));
    for (const file of files) {
      const content = fs.readFileSync(path.join(fullDir, file), 'utf-8');
      if (new RegExp(searchPattern, 'i').test(content)) return true;
    }
  } catch {}
  return false;
}

function detectStatus(item) {
  const det = item.detection;
  if (!det) return 'unknown';

  if (det.type === 'manual') return 'manual';
  if (det.type === 'playwright-check') return 'playwright-check';

  if (det.type === 'file-exists') {
    const allExist = det.files.every(f => fileExists(f));
    const someExist = det.files.some(f => fileExists(f));
    if (allExist) return 'done';
    if (someExist) return 'partial';
    return 'not-started';
  }

  if (det.type === 'grep') {
    let found = false;
    for (const f of det.files) {
      if (f.includes('*')) {
        if (grepGlob(f, det.pattern)) { found = true; break; }
      } else {
        if (grepFile(f, det.pattern)) { found = true; break; }
      }
    }
    return found ? 'done' : 'not-started';
  }

  return 'unknown';
}

function scanAll() {
  const results = ALL_ITEMS.map(item => ({
    ...item,
    status: detectStatus(item),
    scannedAt: new Date().toISOString(),
  }));
  return results;
}

// ═══════════════════════════════════════════════════════
// HTML DASHBOARD
// ═══════════════════════════════════════════════════════

function generateHTML(items) {
  const batches = {};
  for (const item of items) {
    if (!batches[item.batch]) batches[item.batch] = { name: item.batchName, items: [] };
    batches[item.batch].items.push(item);
  }

  const totalItems = items.length;
  const doneItems = items.filter(i => i.status === 'done').length;
  const partialItems = items.filter(i => i.status === 'partial').length;
  const notStarted = items.filter(i => i.status === 'not-started').length;
  const manualItems = items.filter(i => i.status === 'manual').length;
  const playwrightItems = items.filter(i => i.status === 'playwright-check').length;
  const pct = Math.round((doneItems / totalItems) * 100);

  const typeColors = {
    'fix-deployed': '#10b981',
    'bug-fixed': '#06b6d4',
    'feature': '#8b5cf6',
    'bug-open': '#ef4444',
    'ux-gap': '#f59e0b',
    'gap': '#3b82f6',
    'optimization': '#14b8a6',
    'deploy': '#f97316',
    'testing': '#a855f7',
    'infra': '#6b7280',
  };

  const statusIcons = {
    'done': '&#x2705;',
    'partial': '&#x1F7E1;',
    'not-started': '&#x26D4;',
    'manual': '&#x1F50D;',
    'playwright-check': '&#x1F3AD;',
    'unknown': '&#x2753;',
  };

  const statusLabels = {
    'done': 'Implemented',
    'partial': 'Partial',
    'not-started': 'Not Started',
    'manual': 'Manual Check',
    'playwright-check': 'Playwright Check',
    'unknown': 'Unknown',
  };

  const priorityColors = {
    'P0': '#dc2626',
    'P1': '#ea580c',
    'P2': '#ca8a04',
    'P3': '#65a30d',
  };

  let batchHTML = '';
  for (const [batchNum, batch] of Object.entries(batches).sort((a, b) => a[0] - b[0])) {
    const batchDone = batch.items.filter(i => i.status === 'done').length;
    const batchTotal = batch.items.length;
    const batchPct = Math.round((batchDone / batchTotal) * 100);
    const batchBarColor = batchPct === 100 ? '#10b981' : batchPct > 50 ? '#f59e0b' : '#ef4444';

    batchHTML += `
      <div class="batch-section">
        <div class="batch-header">
          <div class="batch-title">
            <span class="batch-num">BATCH ${batchNum}</span>
            <span class="batch-name">${batch.name}</span>
          </div>
          <div class="batch-progress">
            <div class="batch-bar-bg">
              <div class="batch-bar-fill" style="width:${batchPct}%;background:${batchBarColor}"></div>
            </div>
            <span class="batch-pct">${batchDone}/${batchTotal}</span>
          </div>
        </div>
        <div class="batch-items">
          ${batch.items.map(item => `
            <div class="item-row ${item.status}">
              <div class="item-status">${statusIcons[item.status] || '?'}</div>
              <div class="item-id" style="color:${typeColors[item.type] || '#888'}">${item.id}</div>
              <div class="item-priority" style="background:${priorityColors[item.priority] || '#888'}">${item.priority}</div>
              <div class="item-content">
                <div class="item-title">${item.title}</div>
                <div class="item-desc">${item.description}</div>
              </div>
              <div class="item-effort">${item.effort}</div>
              <div class="item-status-label ${item.status}">${statusLabels[item.status] || item.status}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Marathon E2E — Implementation Dashboard</title>
  <meta http-equiv="refresh" content="30">
  <style>
    :root {
      --bg: #0a0a0f;
      --surface: #12121a;
      --surface2: #1a1a28;
      --border: #2a2a3a;
      --text: #e4e4ef;
      --text-dim: #8888a0;
      --accent: #6366f1;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }

    .dashboard { max-width: 1400px; margin: 0 auto; padding: 24px; }

    .header { text-align: center; margin-bottom: 32px; padding: 32px 0; border-bottom: 1px solid var(--border); }
    .header h1 { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 8px; background: linear-gradient(135deg, #6366f1, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .header .subtitle { color: var(--text-dim); font-size: 14px; }
    .header .scan-time { color: var(--text-dim); font-size: 12px; margin-top: 8px; opacity: 0.6; }

    .stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 32px; }
    .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; text-align: center; }
    .stat-value { font-size: 36px; font-weight: 800; }
    .stat-label { font-size: 12px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
    .stat-done .stat-value { color: #10b981; }
    .stat-partial .stat-value { color: #f59e0b; }
    .stat-open .stat-value { color: #ef4444; }
    .stat-manual .stat-value { color: #8b5cf6; }
    .stat-playwright .stat-value { color: #ec4899; }
    .stat-pct .stat-value { color: #6366f1; }

    .progress-bar-main { width: 100%; height: 12px; background: var(--surface2); border-radius: 6px; margin-bottom: 32px; overflow: hidden; }
    .progress-fill-main { height: 100%; background: linear-gradient(90deg, #10b981, #6366f1); border-radius: 6px; transition: width 0.5s; }

    .batch-section { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; margin-bottom: 20px; overflow: hidden; }
    .batch-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: var(--surface2); border-bottom: 1px solid var(--border); }
    .batch-title { display: flex; align-items: center; gap: 12px; }
    .batch-num { font-size: 11px; font-weight: 700; background: var(--accent); color: white; padding: 3px 8px; border-radius: 4px; letter-spacing: 0.5px; }
    .batch-name { font-size: 15px; font-weight: 600; }
    .batch-progress { display: flex; align-items: center; gap: 12px; }
    .batch-bar-bg { width: 120px; height: 6px; background: var(--bg); border-radius: 3px; overflow: hidden; }
    .batch-bar-fill { height: 100%; border-radius: 3px; transition: width 0.5s; }
    .batch-pct { font-size: 13px; font-weight: 600; color: var(--text-dim); min-width: 40px; text-align: right; }

    .batch-items { padding: 8px 0; }
    .item-row { display: grid; grid-template-columns: 36px 100px 36px 1fr 80px 110px; align-items: center; gap: 12px; padding: 10px 20px; border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.15s; }
    .item-row:hover { background: rgba(99, 102, 241, 0.05); }
    .item-row:last-child { border-bottom: none; }
    .item-row.done { opacity: 0.65; }

    .item-status { font-size: 16px; text-align: center; }
    .item-id { font-size: 11px; font-weight: 700; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.3px; }
    .item-priority { font-size: 10px; font-weight: 800; color: white; padding: 2px 6px; border-radius: 3px; text-align: center; }
    .item-content { min-width: 0; }
    .item-title { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .item-desc { font-size: 11px; color: var(--text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
    .item-effort { font-size: 11px; color: var(--text-dim); text-align: right; }
    .item-status-label { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 4px; text-align: center; }
    .item-status-label.done { background: rgba(16,185,129,0.15); color: #10b981; }
    .item-status-label.partial { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .item-status-label.not-started { background: rgba(239,68,68,0.15); color: #ef4444; }
    .item-status-label.manual { background: rgba(139,92,246,0.15); color: #a78bfa; }
    .item-status-label.playwright-check { background: rgba(236,72,153,0.15); color: #ec4899; }

    .legend { display: flex; gap: 20px; justify-content: center; margin-bottom: 24px; flex-wrap: wrap; }
    .legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-dim); }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; }

    .footer { text-align: center; padding: 24px; color: var(--text-dim); font-size: 12px; border-top: 1px solid var(--border); margin-top: 32px; }

    @media (max-width: 900px) {
      .stats-grid { grid-template-columns: repeat(3, 1fr); }
      .item-row { grid-template-columns: 30px 80px 32px 1fr 70px 90px; gap: 8px; padding: 8px 12px; }
      .item-desc { display: none; }
    }
  </style>
</head>
<body>
  <div class="dashboard">
    <div class="header">
      <h1>Marathon E2E — Implementation Dashboard</h1>
      <div class="subtitle">All bugs, fixes, gaps, features, and notes from the Marathon E2E Test Log</div>
      <div class="scan-time">Last scan: ${new Date().toLocaleString()} — Auto-refreshes every 30s</div>
    </div>

    <div class="stats-grid">
      <div class="stat-card stat-pct"><div class="stat-value">${pct}%</div><div class="stat-label">Overall</div></div>
      <div class="stat-card stat-done"><div class="stat-value">${doneItems}</div><div class="stat-label">Implemented</div></div>
      <div class="stat-card stat-partial"><div class="stat-value">${partialItems}</div><div class="stat-label">Partial</div></div>
      <div class="stat-card stat-open"><div class="stat-value">${notStarted}</div><div class="stat-label">Not Started</div></div>
      <div class="stat-card stat-playwright"><div class="stat-value">${playwrightItems}</div><div class="stat-label">Playwright Check</div></div>
    </div>

    <div class="progress-bar-main"><div class="progress-fill-main" style="width:${pct}%"></div></div>

    <div class="legend">
      <div class="legend-item"><div class="legend-dot" style="background:#10b981"></div> Implemented (code detected)</div>
      <div class="legend-item"><div class="legend-dot" style="background:#f59e0b"></div> Partial (some files exist)</div>
      <div class="legend-item"><div class="legend-dot" style="background:#ef4444"></div> Not Started (no code found)</div>
      <div class="legend-item"><div class="legend-dot" style="background:#ec4899"></div> Playwright Check (verified during batch)</div>
    </div>

    ${batchHTML}

    <div class="footer">
      Nexus Marathon E2E Dashboard — Scans codebase for fix markers, file existence, and code patterns<br>
      Run <code>node scripts/marathon-dashboard.cjs</code> to refresh — ${totalItems} items tracked across ${Object.keys(batches).length} batches
    </div>
  </div>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════
// HTTP SERVER
// ═══════════════════════════════════════════════════════

const server = http.createServer((req, res) => {
  if (req.url === '/api/scan') {
    const items = scanAll();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(items, null, 2));
    return;
  }

  const items = scanAll();
  const html = generateHTML(items);
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

server.listen(PORT, () => {
  console.log(`\n  ╔══════════════════════════════════════════════════════╗`);
  console.log(`  ║   Marathon E2E — Implementation Dashboard            ║`);
  console.log(`  ║   http://localhost:${PORT}                            ║`);
  console.log(`  ║   Auto-refreshes every 30 seconds                   ║`);
  console.log(`  ║   ${ALL_ITEMS.length} items tracked across ${new Set(ALL_ITEMS.map(i => i.batch)).size} batches                  ║`);
  console.log(`  ╚══════════════════════════════════════════════════════╝\n`);

  // Auto-open in browser on Windows
  const { exec } = require('child_process');
  exec(`start http://localhost:${PORT}`);
});
