#!/usr/bin/env node
/**
 * Session Context Loader Hook (UserPromptSubmit)
 * Automatically reminds Claude to load session context.
 * Outputs context loading instructions on session start.
 * Exit 0 always.
 */
const fs = require('fs');
const path = require('path');

const SESSION_FILE = path.join(process.cwd(), '.claude-session.md');
const STATE_FILE = path.join(process.cwd(), '.claude', 'session-loader-state.json');

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  // Track if we've already loaded this session
  let state = { loaded: false, timestamp: 0 };
  try {
    if (fs.existsSync(STATE_FILE)) {
      state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    }
  } catch (e) { /* use defaults */ }

  // Only output on first prompt of session (or after 2 hours)
  const twoHours = 2 * 60 * 60 * 1000;
  if (state.loaded && (Date.now() - state.timestamp) < twoHours) {
    process.exit(0);
  }

  const contextFiles = [];

  if (fs.existsSync(SESSION_FILE)) {
    contextFiles.push('.claude-session.md');
  }

  const registryPath = path.join(process.cwd(), 'nexus', 'FIX_REGISTRY.json');
  if (fs.existsSync(registryPath)) {
    let fixCount = '?';
    try {
      const reg = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
      fixCount = Array.isArray(reg.fixes) ? reg.fixes.length : '?';
    } catch (e) { /* use default */ }
    contextFiles.push(`nexus/FIX_REGISTRY.json (${fixCount} fixes)`);
  }

  const progressPath = path.join(process.cwd(), 'nexus', 'sprint-progress.json');
  if (fs.existsSync(progressPath)) {
    contextFiles.push('nexus/sprint-progress.json');
  }

  if (contextFiles.length > 0) {
    console.log(
      `[SESSION CONTEXT] Load these files for current state:\n` +
      contextFiles.map(f => `  - ${f}`).join('\n') +
      `\n[DEFERRED TOOLS] Playwright MCP tools require loading before use. ` +
      `Run ToolSearch("playwright") before any browser testing.`
    );
  }

  // Mark as loaded
  state = { loaded: true, timestamp: Date.now() };
  try {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) { /* non-critical */ }

  process.exit(0);
}

main().catch(e => { process.exit(0); });
