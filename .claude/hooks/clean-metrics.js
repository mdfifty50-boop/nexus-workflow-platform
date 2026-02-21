#!/usr/bin/env node
/**
 * Metrics Cleanup Script
 * Removes stale .claude/ metrics files older than 7 days.
 * Run manually or on session start to prevent unbounded disk growth.
 *
 * Usage: node .claude/hooks/clean-metrics.js
 */
const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.cwd(), '.claude');
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const METRICS_FILES = [
  'session-metrics.json',
  'agent-metrics.json',
  'self-heal-log.json',
  'pending-build-check.json',
  'context-usage.json',
];

let cleaned = 0;
let kept = 0;

for (const file of METRICS_FILES) {
  const filePath = path.join(CLAUDE_DIR, file);
  try {
    if (!fs.existsSync(filePath)) continue;
    const stat = fs.statSync(filePath);
    const ageMs = Date.now() - stat.mtimeMs;
    if (ageMs > MAX_AGE_MS) {
      fs.unlinkSync(filePath);
      cleaned++;
      console.log(`  Cleaned: ${file} (${Math.round(ageMs / 86400000)}d old)`);
    } else {
      kept++;
    }
  } catch (e) {
    console.warn(`  Skip: ${file} - ${e.message}`);
  }
}

if (cleaned > 0) {
  console.log(`[Metrics Cleanup] Removed ${cleaned} stale file(s), kept ${kept}.`);
} else {
  console.log(`[Metrics Cleanup] All ${kept} file(s) are fresh. Nothing to clean.`);
}
