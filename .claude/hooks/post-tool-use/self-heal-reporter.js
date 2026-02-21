#!/usr/bin/env node
/**
 * Self-Heal Reporter Hook (PostToolUse)
 * Tracks self-healing suggestions from other hooks and provides periodic summaries.
 * Reads/maintains .claude/self-heal-log.json for cross-invocation state.
 * Every 15 tool calls, outputs a brief summary of pending suggestions.
 * Exit 0 always (post-tool hooks are informational).
 */
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(process.cwd(), '.claude', 'self-heal-log.json');
const SUMMARY_INTERVAL = 15;

function loadLog() {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const raw = fs.readFileSync(LOG_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.suggestions) && typeof parsed.toolCallCount === 'number') {
        return parsed;
      }
    }
  } catch (e) { /* corrupted or missing - start fresh */ }
  return { suggestions: [], toolCallCount: 0 };
}

function saveLog(log) {
  try {
    const dir = path.dirname(LOG_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2), 'utf-8');
  } catch (e) { /* best effort */ }
}

async function main() {
  let input = '';
  try {
    input = fs.readFileSync(0, 'utf8');
  } catch (_) {
    process.exit(0);
  }

  const data = JSON.parse(input);

  // Only track after file modifications
  if (!['Edit', 'Write'].includes(data.tool_name)) process.exit(0);

  const log = loadLog();
  log.toolCallCount = (log.toolCallCount || 0) + 1;

  // Reset counter if it grows excessively (prevents summary spam in long sessions)
  if (log.toolCallCount > 500) {
    log.toolCallCount = 1;
  }

  // Check tool output for self-heal markers from other hooks
  const toolOutput = data.tool_output || '';
  const filePath = data.tool_input?.file_path || '';

  // Parse SELF-HEAL directives from hook output
  const selfHealPattern = /SELF-HEAL(?:\sREQUIRED)?:\s*(.+)/g;
  let match;
  while ((match = selfHealPattern.exec(toolOutput)) !== null) {
    log.suggestions.push({
      timestamp: new Date().toISOString(),
      hook: 'detected-from-output',
      message: match[1].trim(),
      file: filePath || 'unknown',
      acted: false,
    });
  }

  // Also detect fix marker alerts as self-heal suggestions
  const markerPattern = /Marker\s+(@NEXUS-FIX-\d+)\s+missing\s+from\s+(\S+)/g;
  while ((match = markerPattern.exec(toolOutput)) !== null) {
    const alreadyLogged = log.suggestions.some(
      s => s.message.includes(match[1]) && s.file.includes(match[2]) && !s.acted
    );
    if (!alreadyLogged) {
      log.suggestions.push({
        timestamp: new Date().toISOString(),
        hook: 'fix-marker-checker',
        message: `Restore ${match[1]} in ${match[2]}`,
        file: match[2],
        acted: false,
      });
    }
  }

  // Prune old acted suggestions (keep last 100 max)
  if (log.suggestions.length > 100) {
    const pending = log.suggestions.filter(s => !s.acted);
    const acted = log.suggestions.filter(s => s.acted);
    // Keep all pending + most recent 20 acted
    log.suggestions = [...pending, ...acted.slice(-20)];
  }

  saveLog(log);

  // Every SUMMARY_INTERVAL tool calls, output a summary
  if (log.toolCallCount % SUMMARY_INTERVAL === 0) {
    const pending = log.suggestions.filter(s => !s.acted);
    if (pending.length > 0) {
      const byFile = {};
      for (const s of pending) {
        const key = s.file || 'unknown';
        if (!byFile[key]) byFile[key] = [];
        byFile[key].push(s.message);
      }
      const fileList = Object.entries(byFile)
        .map(([file, msgs]) => `  ${file}: ${msgs.length} suggestion(s)`)
        .join('\n');
      console.log(
        `[SELF-HEAL SUMMARY] ${pending.length} suggestion(s) pending after ${log.toolCallCount} tool calls:\n${fileList}`
      );
    } else {
      console.log(
        `[SELF-HEAL SUMMARY] No pending suggestions after ${log.toolCallCount} tool calls. All clear.`
      );
    }
  }

  process.exit(0);
}

main().catch(e => { process.exit(0); });
