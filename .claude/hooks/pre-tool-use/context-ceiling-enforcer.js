#!/usr/bin/env node
/**
 * Context Ceiling Enforcer Hook (PreToolUse)
 * Tracks approximate context usage and warns/blocks when ceiling approached.
 * Uses session file tracking as proxy for context usage.
 * Exit 0 = allow with optional stdout warning
 */
const fs = require('fs');
const path = require('path');

const SESSION_FILE = path.join(process.cwd(), '.claude-session.md');
const CONTEXT_TRACKER = path.join(process.cwd(), '.claude', 'context-usage.json');

// Weighted cost per tool type (heavier tools consume more context)
const TOOL_WEIGHTS = {
  Read: 1.5,       // File content fills context
  Grep: 1.3,       // Search results can be large
  Glob: 0.5,       // Just file paths, lightweight
  WebFetch: 3.0,   // Web pages are large
  WebSearch: 2.0,  // Search results moderate
};
const DEFAULT_WEIGHT = 1.0;

async function main() {
  let input = '';
  try {
    input = fs.readFileSync(0, 'utf8');
  } catch (_) {
    process.exit(0);
  }

  const data = JSON.parse(input);

  // Only check on heavy operations
  const heavyTools = ['Read', 'Grep', 'Glob', 'WebFetch', 'WebSearch'];
  if (!heavyTools.includes(data.tool_name)) process.exit(0);

  // Track weighted tool call score as proxy for context growth
  let tracker = { toolCalls: 0, weightedScore: 0, startTime: Date.now(), warnings: 0 };
  try {
    if (fs.existsSync(CONTEXT_TRACKER)) {
      const loaded = JSON.parse(fs.readFileSync(CONTEXT_TRACKER, 'utf-8'));
      tracker = { ...tracker, ...loaded };
      // Migrate old trackers that lack weightedScore
      if (typeof tracker.weightedScore !== 'number') tracker.weightedScore = tracker.toolCalls;
    }
  } catch (e) { /* use defaults */ }

  const weight = TOOL_WEIGHTS[data.tool_name] || DEFAULT_WEIGHT;
  tracker.toolCalls++;
  tracker.weightedScore += weight;

  // Weighted heuristic: ~200 weighted points ≈ 100% context
  // This is more accurate than flat counting since Read/WebFetch consume more context
  const estimatedUsage = Math.min(tracker.weightedScore / 200, 1.0);

  if (estimatedUsage > 0.8 && tracker.warnings < 5) {
    tracker.warnings++;
    console.log(
      `[CONTEXT CEILING] Estimated ${Math.round(estimatedUsage * 100)}% context used ` +
      `(${tracker.toolCalls} calls, ${tracker.weightedScore.toFixed(0)} weighted). ` +
      `CRITICAL: Delegate ALL work to background agents. Consider /compact or fresh session.`
    );
  } else if (estimatedUsage > 0.6 && tracker.warnings < 3) {
    tracker.warnings++;
    console.log(
      `[CONTEXT CEILING] Estimated ${Math.round(estimatedUsage * 100)}% context used ` +
      `(${tracker.toolCalls} calls, ${tracker.weightedScore.toFixed(0)} weighted). ` +
      `Prefer agent delegation over direct tool calls.`
    );
  }

  try {
    fs.mkdirSync(path.dirname(CONTEXT_TRACKER), { recursive: true });
    fs.writeFileSync(CONTEXT_TRACKER, JSON.stringify(tracker, null, 2));
  } catch (e) { /* non-critical */ }

  process.exit(0);
}

main().catch(e => { process.exit(0); });
