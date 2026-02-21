#!/usr/bin/env node
/**
 * Fix Registry Guard Hook (PreToolUse)
 * Blocks edits that would remove @NEXUS-FIX markers from protected code.
 * Also warns about cascade risks when modifying fixes with dependents.
 * Exit 0 = allow, Exit 2 = block
 */
const fs = require('fs');
const path = require('path');

/**
 * Load fix-dependencies.json and check cascade risk for markers being modified.
 * Outputs warnings to stdout (non-blocking). Returns nothing.
 */
function checkCascadeRisk(markersInEdit) {
  if (markersInEdit.length === 0) return;

  // Resolve path to fix-dependencies.json relative to this hook's location
  const depsPath = path.resolve(__dirname, '..', '..', '..', 'nexus', 'config', 'fix-dependencies.json');
  if (!fs.existsSync(depsPath)) return;

  let deps;
  try {
    deps = JSON.parse(fs.readFileSync(depsPath, 'utf-8'));
  } catch {
    return; // Silently skip if file is malformed
  }

  if (!deps || !deps.dependencies) return;

  const warnings = [];

  for (const marker of markersInEdit) {
    // Extract fix ID from marker: @NEXUS-FIX-029 -> FIX-029
    const fixId = marker.replace('@NEXUS-', '');
    const fixDep = deps.dependencies[fixId];
    if (!fixDep) continue;

    const blocks = fixDep.blocks || [];
    if (blocks.length === 0) continue;

    // Determine cascade risk level
    let riskLevel = 'LOW';
    if (deps.cascadeRisk && deps.cascadeRisk.high) {
      const isHigh = deps.cascadeRisk.high.some(
        entry => (typeof entry === 'string' ? entry : entry.fix) === fixId
      );
      if (isHigh) riskLevel = 'HIGH';
    }
    if (riskLevel !== 'HIGH' && deps.cascadeRisk && deps.cascadeRisk.medium) {
      const isMedium = deps.cascadeRisk.medium.some(
        entry => (typeof entry === 'string' ? entry : entry.fix) === fixId
      );
      if (isMedium) riskLevel = 'MEDIUM';
    }

    if (riskLevel === 'HIGH') {
      warnings.push(
        `[CASCADE WARNING - HIGH RISK] ${fixId} (${fixDep.description || fixDep.category}) ` +
        `blocks ${blocks.length} downstream fixes: ${blocks.join(', ')}. ` +
        `Modifying this fix can break dependent functionality. Run /fix-deps ${fixId} for full dependency tree.`
      );
    } else if (riskLevel === 'MEDIUM') {
      warnings.push(
        `[CASCADE WARNING - MEDIUM RISK] ${fixId} blocks: ${blocks.join(', ')}. ` +
        `Verify dependent fixes still work after modification.`
      );
    }
  }

  // Also check if the fix has upstream dependencies that might be relevant
  for (const marker of markersInEdit) {
    const fixId = marker.replace('@NEXUS-', '');
    const fixDep = deps.dependencies[fixId];
    if (!fixDep) continue;

    const dependsOn = fixDep.dependsOn || [];
    if (dependsOn.length > 0) {
      warnings.push(
        `[DEPENDENCY NOTE] ${fixId} depends on: ${dependsOn.join(', ')}. ` +
        `Ensure upstream fixes remain intact.`
      );
    }
  }

  if (warnings.length > 0) {
    process.stdout.write('\n' + warnings.join('\n') + '\n');
  }
}

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  const data = JSON.parse(input);
  const toolName = data.tool_name;
  const toolInput = data.tool_input || {};

  if (!['Edit', 'Write'].includes(toolName)) {
    process.exit(0);
  }

  const filePath = toolInput.file_path;
  if (!filePath) process.exit(0);

  // Only check files that exist (Write to new files is fine)
  if (!fs.existsSync(filePath)) process.exit(0);

  const currentContent = fs.readFileSync(filePath, 'utf-8');
  const fixMarkers = currentContent.match(/@NEXUS-FIX-\d+/g) || [];

  if (fixMarkers.length === 0) process.exit(0);

  // For Edit tool, check if old_string contains markers that new_string removes
  if (toolName === 'Edit') {
    const oldStr = toolInput.old_string || '';
    const newStr = toolInput.new_string || '';

    const markersInOld = oldStr.match(/@NEXUS-FIX-\d+/g) || [];
    const markersInNew = newStr.match(/@NEXUS-FIX-\d+/g) || [];

    const removedMarkers = markersInOld.filter(m => !markersInNew.includes(m));

    if (removedMarkers.length > 0) {
      // Check cascade risk for removed markers before blocking
      checkCascadeRisk(removedMarkers);
      process.stderr.write(
        `BLOCKED: Edit would remove protected fix markers: ${removedMarkers.join(', ')}. ` +
        `These markers protect critical bug fixes in FIX_REGISTRY.json. ` +
        `If you need to modify this code, preserve the @NEXUS-FIX markers.`
      );
      process.exit(2);
    }

    // Even if markers are preserved, warn about cascade risk for markers being touched
    if (markersInOld.length > 0) {
      const uniqueMarkers = [...new Set(markersInOld)];
      checkCascadeRisk(uniqueMarkers);
    }
  }

  // For Write tool (full file overwrite), check all markers are preserved
  if (toolName === 'Write') {
    const newContent = toolInput.content || '';
    const missingMarkers = fixMarkers.filter(m => !newContent.includes(m));
    const uniqueMissing = [...new Set(missingMarkers)];

    if (uniqueMissing.length > 0) {
      // Check cascade risk for missing markers before blocking
      checkCascadeRisk(uniqueMissing);
      process.stderr.write(
        `BLOCKED: Full file write would remove ${uniqueMissing.length} protected fix markers: ` +
        `${uniqueMissing.join(', ')}. Use Edit tool with targeted changes instead, ` +
        `or ensure all @NEXUS-FIX markers are preserved in the new content.`
      );
      process.exit(2);
    }

    // Warn about cascade risk for all markers in the file being overwritten
    const uniqueExisting = [...new Set(fixMarkers)];
    if (uniqueExisting.length > 0) {
      checkCascadeRisk(uniqueExisting);
    }
  }

  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(0); });
