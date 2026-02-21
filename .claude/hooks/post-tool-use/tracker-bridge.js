/**
 * Claude Code Post-Tool-Use Hook: Tracker Bridge
 *
 * Fires after Edit/Write operations. If the edited file is in the nexus/ directory,
 * maps it to finding IDs and writes status updates to tracker-bridge.json.
 * The Nexus Investigation Tracker dashboard polls this file for live updates.
 */

const fs = require('fs');
const path = require('path');

const BRIDGE_PATH = path.resolve(__dirname, '..', '..', '..', 'nexus-tracker', 'public', 'tracker-bridge.json');
const BRIDGE_PATH_ROOT = path.resolve(__dirname, '..', '..', '..', 'nexus-tracker', 'tracker-bridge.json');

// File-to-finding mapping (mirrors nexus-tracker/src/data/file-finding-map.ts)
const FILE_FINDING_MAP = {
  'src/services/NexusAIService.ts': [1, 3, 4, 7, 13, 16, 19],
  'src/components/chat/WorkflowPreviewCard.tsx': [2, 6, 12, 18, 20],
  'server/agents/index.ts': [5, 9, 30],
  'api/_lib/agents.ts': [9],
  'src/lib/prompt-guard.ts': [10],
  'api/rube/[[...path]].ts': [11],
  'src/services/UserMemoryService.ts': [8, 13, 27, 28],
  'src/services/ChatPersistenceService.ts': [8, 13],
  'server/routes/chat.ts': [14],
  'src/lib/claudeProxy.ts': [14],
  'src/components/chat/ChatContainer.tsx': [14],
  'api/chat.ts': [14],
  'src/lib/error-messages.ts': [15],
  'src/lib/industry-personas.ts': [16, 17],
  'src/components/wpc-constants.ts': [18],
  'src/components/wpc-types.ts': [18],
  'src/components/wpc-tool-utils.ts': [18],
  'src/components/wpc-helpers.ts': [18],
  'src/lib/BMADWorkflowEngine.ts': [8],
  'src/services/DailyAdviceService.ts': [8],
  'src/lib/NexusWorkflowEngine.ts': [8],
  'src/lib/ParamResolutionPipeline.ts': [8],
  'src/services/RubeClient.ts': [8],
  'src/lib/retry-helper.ts': [19],
  'src/services/CustomIntegrationService.ts': [25],
  'src/lib/storage-manager.ts': [36],
  'src/services/StorageManager.ts': [36],
  'src/lib/hitl/index.ts': [24],
  'src/lib/human-loop/index.ts': [24],
};

function getFindingsForFile(filePath) {
  const normalized = filePath
    .replace(/\\/g, '/')
    .replace(/.*nexus\//, '');

  if (FILE_FINDING_MAP[normalized]) {
    return FILE_FINDING_MAP[normalized];
  }

  for (const [pattern, ids] of Object.entries(FILE_FINDING_MAP)) {
    if (normalized.includes(pattern) || pattern.includes(normalized)) {
      return ids;
    }
  }

  return [];
}

function readBridge() {
  try {
    if (fs.existsSync(BRIDGE_PATH)) {
      return JSON.parse(fs.readFileSync(BRIDGE_PATH, 'utf-8'));
    }
  } catch {}
  return { updates: [], sessionActive: true, lastActivity: null, scanRequested: false };
}

function writeBridge(data) {
  const json = JSON.stringify(data, null, 2);
  try { fs.writeFileSync(BRIDGE_PATH, json); } catch {}
  try { fs.writeFileSync(BRIDGE_PATH_ROOT, json); } catch {}
}

// Main hook logic
try {
  const input = JSON.parse(fs.readFileSync('/dev/stdin', 'utf-8'));

  // Only process Edit and Write tool uses
  const toolName = input.tool_name || '';
  if (toolName !== 'Edit' && toolName !== 'Write') {
    process.exit(0);
  }

  // Get the file path from tool input
  const filePath = input.tool_input?.file_path || '';

  // Only care about nexus/ files (not nexus-tracker or other dirs)
  if (!filePath.includes('nexus') || filePath.includes('nexus-tracker')) {
    process.exit(0);
  }

  // Find matching finding IDs
  const findingIds = getFindingsForFile(filePath);
  if (findingIds.length === 0) {
    process.exit(0);
  }

  // Read current bridge state
  const bridge = readBridge();
  const now = new Date().toISOString();

  // Add updates for each affected finding
  for (const findingId of findingIds) {
    // Don't add duplicate in_progress if already there recently (within 5 min)
    const recent = bridge.updates.find(
      u => u.findingId === findingId &&
           u.status === 'in_progress' &&
           (new Date(now) - new Date(u.timestamp)) < 300000
    );
    if (recent) continue;

    bridge.updates.push({
      findingId,
      status: 'in_progress',
      timestamp: now,
      reason: `Editing ${filePath.replace(/.*nexus\//, '')}`,
      source: 'claude-hook',
    });
  }

  // Keep only last 200 updates to prevent unbounded growth
  if (bridge.updates.length > 200) {
    bridge.updates = bridge.updates.slice(-200);
  }

  bridge.sessionActive = true;
  bridge.lastActivity = now;
  bridge.scanRequested = true; // Trigger a scan after edits

  writeBridge(bridge);
} catch (err) {
  // Silent fail - hooks should never block Claude Code
  process.exit(0);
}
