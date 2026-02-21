#!/usr/bin/env node
/**
 * Build Verifier Hook (PostToolUse)
 * Tracks TypeScript file modifications and reminds to build-check.
 * Exit 0 always (post-tool hooks cannot block).
 */
const fs = require('fs');
const path = require('path');

const TRACKER_FILE = path.join(process.cwd(), '.claude', 'pending-build-check.json');

async function main() {
  let input = '';
  try {
    input = fs.readFileSync(0, 'utf8');
  } catch (_) {
    process.exit(0);
  }

  const data = JSON.parse(input);

  if (!['Edit', 'Write'].includes(data.tool_name)) process.exit(0);

  const filePath = data.tool_input?.file_path || '';

  if (!/\.(ts|tsx)$/.test(filePath)) process.exit(0);

  // Track modified files
  let tracker = { files: [], lastReminder: 0 };
  try {
    if (fs.existsSync(TRACKER_FILE)) {
      tracker = JSON.parse(fs.readFileSync(TRACKER_FILE, 'utf-8'));
    }
  } catch (e) { /* use defaults */ }

  // Normalize to forward slashes before splitting for Windows consistency
  const normalizedPath = filePath.replace(/\\/g, '/');
  const shortPath = normalizedPath.split('/').slice(-2).join('/');
  if (!tracker.files.includes(shortPath)) {
    tracker.files.push(shortPath);
  }

  // Remind every 5 file modifications
  if (tracker.files.length >= 5 && Date.now() - tracker.lastReminder > 60000) {
    console.log(
      `[BUILD CHECK] ${tracker.files.length} TypeScript files modified since last build. ` +
      `Run \`npm run build\` in nexus/ to verify no type errors.`
    );
    tracker.lastReminder = Date.now();
  }

  try {
    fs.mkdirSync(path.dirname(TRACKER_FILE), { recursive: true });
    fs.writeFileSync(TRACKER_FILE, JSON.stringify(tracker, null, 2));
  } catch (e) { /* non-critical */ }

  process.exit(0);
}

main().catch(e => { process.exit(0); });
