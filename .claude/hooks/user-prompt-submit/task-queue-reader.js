/**
 * Claude Code UserPromptSubmit Hook: Task Queue Reader
 *
 * On every user prompt, checks nexus-tracker/public/task-queue.json for pending tasks.
 * If found, injects the task context into the prompt so Claude auto-picks it up.
 * Also checks nexus-tracker/tracker-bridge.json for active session marker.
 */

const fs = require('fs');
const path = require('path');

const QUEUE_PATH = path.resolve(__dirname, '..', '..', '..', 'nexus-tracker', 'public', 'task-queue.json');
const QUEUE_ROOT = path.resolve(__dirname, '..', '..', '..', 'nexus-tracker', 'task-queue.json');
const BRIDGE_PATH = path.resolve(__dirname, '..', '..', '..', 'nexus-tracker', 'public', 'tracker-bridge.json');

async function main() {
  // Read stdin cross-platform (works on Windows + Unix)
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  try {
    const parsed = JSON.parse(input);
  } catch {}

  // Read the task queue
  let queue = { pending: [], completed: [], lastUpdated: null };
  try {
    if (fs.existsSync(QUEUE_PATH)) {
      queue = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf-8'));
    }
  } catch {}

  // Check for pending tasks
  if (queue.pending && queue.pending.length > 0) {
    const task = queue.pending[0]; // Take the first pending task

    // Output context for Claude to see
    const output = {
      decision: "allow",
      message: `\n\n[TRACKER QUEUE] Finding #${task.findingId} queued for implementation from the dashboard.\n` +
        `Title: ${task.title}\n` +
        `Description: ${task.description}\n` +
        `Affected files: ${(task.affectedFiles || []).join(', ')}\n` +
        `Scanner check: ${task.scannerCheck || 'N/A'}\n` +
        `Priority: Tier ${task.tier} | Impact: ${task.impact} | ROI: ${task.roiScore}\n` +
        `\nIMPLEMENT THIS FINDING NOW. When done, run: node nexus-tracker/scripts/bridge-update.mjs done ${task.findingId}\n`
    };

    // Move task from pending to in-progress in the queue
    task.status = 'in_progress';
    task.startedAt = new Date().toISOString();
    queue.pending = queue.pending.slice(1);
    queue.lastUpdated = new Date().toISOString();

    const queueJson = JSON.stringify(queue, null, 2);
    try { fs.writeFileSync(QUEUE_PATH, queueJson); } catch {}
    try { fs.writeFileSync(QUEUE_ROOT, queueJson); } catch {}

    // Also mark as in_progress in the bridge
    try {
      let bridge = { updates: [], sessionActive: true, lastActivity: null, scanRequested: false };
      if (fs.existsSync(BRIDGE_PATH)) {
        bridge = JSON.parse(fs.readFileSync(BRIDGE_PATH, 'utf-8'));
      }
      bridge.updates.push({
        findingId: task.findingId,
        status: 'in_progress',
        timestamp: new Date().toISOString(),
        reason: `Queued from dashboard - implementation started`,
        source: 'dashboard',
      });
      bridge.sessionActive = true;
      bridge.lastActivity = new Date().toISOString();
      const bridgeJson = JSON.stringify(bridge, null, 2);
      try { fs.writeFileSync(BRIDGE_PATH, bridgeJson); } catch {}
    } catch {}

    process.stdout.write(JSON.stringify(output));
    process.exit(0);
  }

  // No pending tasks - pass through normally
  process.stdout.write(JSON.stringify({ decision: "allow" }));
}

main().catch(() => {
  // Silent fail - never block user prompts
  process.stdout.write(JSON.stringify({ decision: "allow" }));
});
