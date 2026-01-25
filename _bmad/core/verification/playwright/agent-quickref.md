# Playwright Verification Quick Reference for Agents

## When to Use

Use Playwright verification for ANY UI feature:
- New component renders
- Button appears and works
- Page loads without errors
- Feature is visually correct

## Basic Verification Sequence

### 1. Check Server Running
```bash
curl -s http://localhost:5173 > /dev/null && echo "OK" || echo "NOT RUNNING"
```

If not running:
```bash
cd nexus && npm run dev &
sleep 5
```

### 2. Navigate to Page
```
mcp__playwright__browser_navigate
  url: "http://localhost:5173/dashboard"
```

### 3. Wait for Load
```
mcp__playwright__browser_wait_for
  time: 2
```

### 4. Check for Errors (CRITICAL)
```
mcp__playwright__browser_console_messages
  level: "error"
```

**If ANY errors returned → GATE FAILS**

Common errors to watch for:
- `Maximum update depth exceeded` (infinite loop)
- `Cannot read property of undefined`
- `Failed to fetch`
- `TypeError`

### 5. Get Page Structure
```
mcp__playwright__browser_snapshot
```

Check the snapshot for:
- Expected component names
- Button/link text
- Headings and labels

### 6. Optional: Screenshot
```
mcp__playwright__browser_take_screenshot
  fullPage: true
```

## Common Patterns

### Verify New Component Exists
```
1. Navigate to page where component should appear
2. Get snapshot
3. Search snapshot for component text/role
4. PASS if found, FAIL if not
```

### Verify Button Works
```
1. Navigate to page
2. Get snapshot, find button ref
3. Click button
4. Wait for expected result
5. Get new snapshot
6. Verify expected change occurred
```

### Verify No Regressions
```
1. Navigate to affected pages
2. Check console for new errors
3. Get snapshot
4. Verify existing features still present
```

## Failure Response

If Playwright gate fails:

1. **Console error** → Fix the runtime bug
2. **Element missing** → Check component renders, check route
3. **Timeout** → Increase wait time, check for loading states
4. **Wrong content** → Check data flow, verify API responses

## Report Format

After verification, report:

```
### Playwright Verification Result

**URL:** http://localhost:5173/dashboard
**Console Errors:** None | [list errors]
**Expected Elements:**
  - ✅ Dashboard heading found
  - ✅ Stats cards present
  - ❌ New Widget NOT FOUND

**Result:** PLAYWRIGHT_GATE_PASSED | PLAYWRIGHT_GATE_FAILED: [reason]
```

## Quick Copy-Paste

For dashboard verification:
```
Navigate: http://localhost:5173/dashboard
Wait: 2 seconds
Console: Check for errors
Snapshot: Get accessibility tree
Assert: Expected elements visible
```

For any new feature:
```
1. Start server if needed
2. Navigate to feature location
3. Check console (MUST be clean)
4. Snapshot and verify element exists
5. Test interaction if applicable
6. Report result
```
