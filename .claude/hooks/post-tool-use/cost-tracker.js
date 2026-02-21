#!/usr/bin/env node
/**
 * PostToolUse Hook: Session Cost Tracker
 *
 * Estimates token usage and dollar cost per tool call.
 * Accumulates metrics in .claude/session-metrics.json.
 * Outputs a brief cost summary every 20 tool calls.
 *
 * Claude hook protocol: reads JSON from stdin, writes to stdout, exit 0 always.
 */

const fs = require('fs');
const path = require('path');

// Metrics file lives at .claude/session-metrics.json
// Use process.cwd() for reliable resolution regardless of hook execution context
const CLAUDE_DIR = path.join(process.cwd(), '.claude');
const METRICS_FILE = path.join(CLAUDE_DIR, 'session-metrics.json');

// Token estimates per tool type (weighted by typical payload size)
const TOKEN_ESTIMATES = {
  Read:       { input: 500,  output: 3000, weight: 1.5 },
  Grep:       { input: 500,  output: 2500, weight: 1.3 },
  Glob:       { input: 300,  output: 1000, weight: 0.5 },
  Edit:       { input: 1000, output: 500,  weight: 0.8 },
  Write:      { input: 1000, output: 500,  weight: 0.8 },
  Bash:       { input: 500,  output: 1500, weight: 1.0 },
  Task:       { input: 5000, output: 10000, weight: 5.0 },
  WebFetch:   { input: 1000, output: 5000, weight: 3.0 },
  WebSearch:  { input: 500,  output: 3000, weight: 2.0 },
};

// Default for unrecognized tools
const DEFAULT_ESTIMATE = { input: 500, output: 1000, weight: 1.0 };

// Model detection and pricing (per million tokens)
const MODEL_PRICING = {
  'opus':   { input: 15.0, output: 75.0,  label: 'Opus' },
  'sonnet': { input: 3.0,  output: 15.0,  label: 'Sonnet' },
  'haiku':  { input: 0.80, output: 4.0,   label: 'Haiku' },
};

function detectModelPricing() {
  const modelHint = (process.env.CLAUDE_MODEL || process.env.ANTHROPIC_MODEL || '').toLowerCase();
  if (modelHint.includes('opus'))   return MODEL_PRICING['opus'];
  if (modelHint.includes('haiku'))  return MODEL_PRICING['haiku'];
  return MODEL_PRICING['sonnet']; // default
}

const activeModel = detectModelPricing();
const PRICE_INPUT_PER_M  = activeModel.input;
const PRICE_OUTPUT_PER_M = activeModel.output;

// Summary interval
const SUMMARY_INTERVAL = 20;

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
    totalToolCalls: 0,
    estimatedTokens: { input: 0, output: 0 },
    estimatedCostUSD: 0.0,
    byTool: {},
  };
}

function saveMetrics(metrics) {
  try {
    // Ensure directory exists
    const dir = path.dirname(METRICS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2), 'utf8');
  } catch (err) {
    // Silently fail - never block the session
    process.stderr.write(`[cost-tracker] Failed to save metrics: ${err.message}\n`);
  }
}

function calculateCost(inputTokens, outputTokens) {
  return (inputTokens / 1_000_000) * PRICE_INPUT_PER_M
       + (outputTokens / 1_000_000) * PRICE_OUTPUT_PER_M;
}

function formatCost(usd) {
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}

function getToolEstimate(toolName) {
  // Try exact match first
  if (TOKEN_ESTIMATES[toolName]) return TOKEN_ESTIMATES[toolName];

  // Try prefix match (e.g., "mcp__*" tools)
  if (toolName.startsWith('mcp__')) return { input: 1000, output: 3000 };
  if (toolName.startsWith('NotebookEdit')) return { input: 1000, output: 500 };

  return DEFAULT_ESTIMATE;
}

async function main() {
  let input = '';
  try {
    input = fs.readFileSync(0, 'utf8');
  } catch (_) {
    // No stdin available
    process.exit(0);
  }

  let toolData;
  try {
    toolData = JSON.parse(input);
  } catch (_) {
    // Invalid JSON on stdin - nothing to do
    process.exit(0);
  }

  const toolName = toolData.tool_name || 'Unknown';
  const estimate = getToolEstimate(toolName);

  // Load current metrics
  const metrics = loadMetrics();

  // Update totals
  metrics.totalToolCalls += 1;
  metrics.estimatedTokens.input += estimate.input;
  metrics.estimatedTokens.output += estimate.output;
  metrics.estimatedCostUSD = calculateCost(
    metrics.estimatedTokens.input,
    metrics.estimatedTokens.output
  );
  metrics.lastUpdated = new Date().toISOString();

  // Update per-tool breakdown
  if (!metrics.byTool[toolName]) {
    metrics.byTool[toolName] = { calls: 0, inputTokens: 0, outputTokens: 0 };
  }
  metrics.byTool[toolName].calls += 1;
  metrics.byTool[toolName].inputTokens += estimate.input;
  metrics.byTool[toolName].outputTokens += estimate.output;

  // Save
  saveMetrics(metrics);

  // Output summary every N calls
  if (metrics.totalToolCalls % SUMMARY_INTERVAL === 0) {
    const elapsed = getElapsed(metrics.sessionStarted);
    const topTools = Object.entries(metrics.byTool)
      .sort((a, b) => b[1].calls - a[1].calls)
      .slice(0, 5)
      .map(([name, data]) => `${name}: ${data.calls} calls`)
      .join(', ');

    process.stdout.write(
      `[Cost ~${activeModel.label}] ${metrics.totalToolCalls} calls | ` +
      `~${(metrics.estimatedTokens.input / 1000).toFixed(0)}K in / ` +
      `~${(metrics.estimatedTokens.output / 1000).toFixed(0)}K out | ` +
      `Est. ${formatCost(metrics.estimatedCostUSD)} (approx) | ` +
      `${elapsed} elapsed | ` +
      `Top: ${topTools}\n`
    );
  }

  process.exit(0);
}

function getElapsed(startISO) {
  try {
    const start = new Date(startISO);
    const now = new Date();
    const diffMs = now - start;
    const mins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0) return `${hrs}h ${remMins}m`;
    return `${mins}m`;
  } catch (_) {
    return '?m';
  }
}

main();
