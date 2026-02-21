#!/usr/bin/env node
/**
 * Fix Marker Checker Hook (PostToolUse)
 * After file edits, verifies @NEXUS-FIX markers weren't accidentally removed.
 * Exit 0 always (post-tool hooks are informational).
 */
const fs = require('fs');
const path = require('path');

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
  if (!fs.existsSync(filePath)) process.exit(0);

  // Load registry to know expected markers
  const registryPaths = [
    path.join(process.cwd(), 'nexus', 'FIX_REGISTRY.json'),
    path.join(process.cwd(), 'FIX_REGISTRY.json'),
  ];

  let registry = null;
  for (const rp of registryPaths) {
    try {
      if (fs.existsSync(rp)) {
        registry = JSON.parse(fs.readFileSync(rp, 'utf-8'));
        break;
      }
    } catch (e) { /* try next */ }
  }

  if (!registry || !registry.fixes) process.exit(0);

  // Find fixes that reference this file
  // Normalize to forward slashes and use case-insensitive matching for Windows
  const fileName = path.basename(filePath).toLowerCase();
  const normalizedPath = filePath.replace(/\\/g, '/').toLowerCase();
  const relevantFixes = registry.fixes.filter(fix =>
    fix.files && fix.files.some(f => {
      const fLower = f.toLowerCase();
      const fBase = path.basename(f).toLowerCase();
      // Match by basename or by path segment
      return fBase === fileName || normalizedPath.includes(fLower);
    })
  );

  if (relevantFixes.length === 0) process.exit(0);

  // Check current file content for expected markers
  const content = fs.readFileSync(filePath, 'utf-8');
  const missingMarkers = [];

  for (const fix of relevantFixes) {
    if (fix.codeMarker && !content.includes(fix.codeMarker)) {
      missingMarkers.push({ id: fix.id, marker: fix.codeMarker, title: fix.title });
    }
  }

  if (missingMarkers.length > 0) {
    // Build self-healing instructions from registry entries
    const healInstructions = missingMarkers.map(m => {
      const registryEntry = registry.fixes.find(f => f.id === m.id);
      const solution = registryEntry?.solution || 'See FIX_REGISTRY.json for details';
      const marker = registryEntry?.codeMarker || m.marker;
      return [
        `SELF-HEAL REQUIRED: Marker ${marker} missing from ${fileName}.`,
        `  Fix title: ${m.title}`,
        `  Solution: ${solution}`,
        `  Action: Re-add the comment "// ${marker}: ${m.title} - DO NOT REMOVE" near the relevant code section.`,
      ].join('\n');
    });

    console.log(
      `[FIX MARKER ALERT] ${missingMarkers.length} fix markers missing from ${fileName}:\n\n` +
      healInstructions.join('\n\n')
    );
  }

  process.exit(0);
}

main().catch(e => { process.exit(0); });
