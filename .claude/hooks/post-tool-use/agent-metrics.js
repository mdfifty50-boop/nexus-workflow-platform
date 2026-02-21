#!/usr/bin/env node
/**
 * PostToolUse Hook: Agent Performance Metrics
 *
 * Tracks agent (Task tool) delegations: which agents are spawned,
 * how often, and what they work on.
 *
 * Only activates when tool_name === "Task".
 * Claude hook protocol: reads JSON from stdin, writes to stdout, exit 0 always.
 */

const fs = require('fs');
const path = require('path');

// Metrics file lives at .claude/agent-metrics.json
// Use process.cwd() for reliable resolution regardless of hook execution context
const CLAUDE_DIR = path.join(process.cwd(), '.claude');
const METRICS_FILE = path.join(CLAUDE_DIR, 'agent-metrics.json');

// Max task descriptions to keep per agent (prevent unbounded growth)
const MAX_TASKS_PER_AGENT = 50;

function loadMetrics() {
  try {
    if (fs.existsSync(METRICS_FILE)) {
      const raw = fs.readFileSync(METRICS_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (_) {
    // Corrupted file; start fresh
  }
  return {
    sessionStarted: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    totalDelegations: 0,
    agents: {},
  };
}

function saveMetrics(metrics) {
  try {
    const dir = path.dirname(METRICS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2), 'utf8');
  } catch (err) {
    process.stderr.write(`[agent-metrics] Failed to save: ${err.message}\n`);
  }
}

/**
 * Extract agent type from task description or input.
 * Looks for patterns like "@coder", "@explorer", "L1-T2:", agent names, etc.
 */
function extractAgentType(toolInput) {
  const description = toolInput.description || toolInput.prompt || '';

  // Check for @agent mentions
  const atMatch = description.match(/@(\w[\w-]*)/);
  if (atMatch) return atMatch[1];

  // Check for loop-task format: "L1-T2: TaskName"
  const loopMatch = description.match(/^L\d+-T\d+:\s*(.+)/);
  if (loopMatch) {
    const taskDesc = loopMatch[1].trim();
    // Try to extract agent name from task description
    const agentHint = taskDesc.match(/^(\w+[\w-]*?)[\s:]/);
    if (agentHint) return agentHint[1];
    return 'marathon-agent';
  }

  // Check for known agent keywords
  const knownAgents = [
    'explorer', 'coder', 'architect', 'ralph', 'winston',
    'marcus', 'ava', 'director', 'qa', 'ux',
  ];
  const lowerDesc = description.toLowerCase();
  for (const agent of knownAgents) {
    if (lowerDesc.includes(agent)) return agent;
  }

  // Default
  return 'general-purpose';
}

/**
 * Extract a short task description (max 120 chars).
 */
function extractTaskDescription(toolInput) {
  const desc = toolInput.description || toolInput.prompt || '';
  const firstLine = desc.split('\n')[0].trim();
  if (firstLine.length > 120) return firstLine.substring(0, 117) + '...';
  return firstLine || '(no description)';
}

async function main() {
  let input = '';
  try {
    input = fs.readFileSync(0, 'utf8');
  } catch (_) {
    process.exit(0);
  }

  let toolData;
  try {
    toolData = JSON.parse(input);
  } catch (_) {
    process.exit(0);
  }

  // Only process Task tool calls
  if (toolData.tool_name !== 'Task') {
    process.exit(0);
  }

  const toolInput = toolData.tool_input || {};
  const agentType = extractAgentType(toolInput);
  const taskDesc = extractTaskDescription(toolInput);

  // Load and update metrics
  const metrics = loadMetrics();
  metrics.totalDelegations += 1;
  metrics.lastUpdated = new Date().toISOString();

  if (!metrics.agents[agentType]) {
    metrics.agents[agentType] = {
      totalTasks: 0,
      tasks: [],
    };
  }

  const agent = metrics.agents[agentType];
  agent.totalTasks += 1;
  agent.tasks.push(taskDesc);

  // Trim to prevent unbounded growth
  if (agent.tasks.length > MAX_TASKS_PER_AGENT) {
    agent.tasks = agent.tasks.slice(-MAX_TASKS_PER_AGENT);
  }

  saveMetrics(metrics);

  // Brief notification for agent spawns
  process.stdout.write(
    `[Agent] Delegated to "${agentType}" (${metrics.totalDelegations} total): ${taskDesc}\n`
  );

  process.exit(0);
}

main();
