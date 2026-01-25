# /features Command - Feature Regression Manager

## Purpose
Manage feature_list.json for autonomous runs and regression testing (Leon van Zyl methodology).

## Usage

### Check Status
```
/features check
```
Shows all 16 features with PASS/FAIL status.

### Show Feature Details
```
/features show epic-3
```
Shows verification steps and critical paths for a specific feature.

### Mark Feature as Passing
```
/features pass epic-3
```
After verifying a feature works, mark it as passing.

### Mark Feature as Failing
```
/features fail epic-3
```
When a feature breaks, mark it as failing.

### Get Next Feature to Verify
```
/features next
```
Shows the next failing feature (by priority) to verify.

### Reset All (Start Regression Run)
```
/features reset
```
Marks all features as failing to begin a full regression test.

## Verification Workflow

1. **Start regression run:**
   ```
   /features reset
   ```

2. **Get next feature:**
   ```
   /features next
   ```

3. **Verify using Playwright MCP:**
   ```
   mcp__playwright__browser_navigate url: "http://localhost:5173/[path]"
   mcp__playwright__browser_snapshot
   mcp__playwright__browser_console_messages level: "error"
   ```

4. **If passes, mark it:**
   ```
   /features pass epic-X
   ```

5. **Repeat until all pass**

## Integration with Marathon Mode

In marathon/sprint mode, the Director uses feature_list.json to:
- Track which features need work
- Prioritize tasks by feature priority
- Run regression after each loop
- Ensure no regressions introduced

## File Locations

- **Feature List:** `feature_list.json` (project root)
- **Script:** `.claude/scripts/feature-regression.ps1`

## Feature Structure

Each feature has:
- `id`: Unique identifier (epic-1, epic-2, etc.)
- `name`: Human-readable name
- `description`: What the feature does
- `priority`: Execution order (1 = highest)
- `passes`: Boolean (true = verified working)
- `steps`: Verification steps to execute
- `testFile`: E2E test file (if exists)
- `criticalPaths`: Routes to test
