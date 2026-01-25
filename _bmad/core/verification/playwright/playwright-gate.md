# Playwright MCP Gate Integration

## Purpose

Use Playwright MCP to verify UI features actually render and work in the browser, not just compile.

## The Problem

Code can:
- ✅ Compile (TypeScript passes)
- ✅ Pass unit tests (mocked components)
- ❌ Not actually render in the browser
- ❌ Have runtime errors
- ❌ Look completely wrong visually

## The Solution

**Browser verification gates** using Playwright MCP:

```
Agent implements feature
    ↓
TypeScript compiles ✅
    ↓
Unit tests pass ✅
    ↓
Playwright MCP:
  1. Navigate to page
  2. Take snapshot (accessibility tree)
  3. Check for element presence
  4. Check console for errors
  5. Optionally take screenshot
    ↓
ALL pass? → Feature actually works ✅
```

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `browser_navigate` | Load the page |
| `browser_snapshot` | Get accessibility tree (DOM structure) |
| `browser_console_messages` | Check for errors |
| `browser_click` | Test interactivity |
| `browser_take_screenshot` | Visual evidence |
| `browser_wait_for` | Wait for dynamic content |

## Gate Definitions

### Basic Page Load Gate

```yaml
- name: "Page Loads Without Errors"
  type: playwright
  steps:
    - action: navigate
      url: "http://localhost:5173/dashboard"
    - action: wait_for
      time: 2
    - action: console_messages
      level: error
      assert: empty
```

### Element Presence Gate

```yaml
- name: "Delete Button Visible"
  type: playwright
  steps:
    - action: navigate
      url: "http://localhost:5173/workflows"
    - action: snapshot
    - action: assert
      condition: "snapshot contains 'Delete' button"
```

### Interactive Gate

```yaml
- name: "Delete Confirmation Works"
  type: playwright
  steps:
    - action: navigate
      url: "http://localhost:5173/workflows"
    - action: click
      element: "Delete button"
    - action: wait_for
      text: "Are you sure"
    - action: snapshot
    - action: assert
      condition: "confirmation dialog visible"
```

## Integration with Gate Runner

The gate runner calls Playwright MCP tools via Claude's tool interface:

```bash
run_playwright_gate() {
    local gate_config="$1"

    # Parse gate steps
    # For each step, invoke corresponding MCP tool
    # Collect results
    # Return pass/fail
}
```

## Verification Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ PLAYWRIGHT VERIFICATION                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Start dev server (if not running)                          │
│     └─ npm run dev (background)                                 │
│                                                                 │
│  2. Wait for server ready                                       │
│     └─ Poll http://localhost:5173 until 200                    │
│                                                                 │
│  3. Navigate to target page                                     │
│     └─ mcp__playwright__browser_navigate                       │
│                                                                 │
│  4. Wait for content                                            │
│     └─ mcp__playwright__browser_wait_for                       │
│                                                                 │
│  5. Check console errors                                        │
│     └─ mcp__playwright__browser_console_messages               │
│     └─ FAIL if any error-level messages                        │
│                                                                 │
│  6. Get page structure                                          │
│     └─ mcp__playwright__browser_snapshot                       │
│                                                                 │
│  7. Assert expected elements                                    │
│     └─ Parse snapshot for required elements                    │
│     └─ FAIL if missing                                          │
│                                                                 │
│  8. Optional: Take screenshot                                   │
│     └─ mcp__playwright__browser_take_screenshot                │
│     └─ Save to .bmad-screenshots/                              │
│                                                                 │
│  9. Report results                                              │
│     └─ PASS or FAIL with details                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Common Assertions

| Assertion | How to Check |
|-----------|--------------|
| Element exists | Snapshot contains element text/role |
| No console errors | Console messages at error level is empty |
| Text visible | Snapshot contains expected text |
| Button clickable | Click doesn't throw error |
| Dialog appears | After action, snapshot contains dialog |
| Navigation works | URL changes after click |

## Error Handling

| Error | Action |
|-------|--------|
| Server not running | Start it, wait, retry |
| Navigation timeout | Increase wait, check URL |
| Element not found | Check selector, wait longer |
| Console errors | Log errors, fail gate |
| Screenshot fails | Continue (non-blocking) |

## Best Practices

1. **Always check console errors first** - catches runtime issues
2. **Use snapshots over screenshots** - more reliable assertions
3. **Wait adequately** - dynamic content needs time
4. **Keep gates focused** - one feature per gate
5. **Screenshot on failure** - helps debugging

## Example: Full Verification Sequence

```yaml
verification:
  gates:
    # Gate 1: Code compiles
    - name: "TypeScript Compiles"
      type: command
      command: "npm run type-check"

    # Gate 2: Tests pass
    - name: "Unit Tests Pass"
      type: command
      command: "npm test"

    # Gate 3: Page loads
    - name: "Dashboard Loads"
      type: playwright
      steps:
        - action: navigate
          url: "http://localhost:5173/dashboard"
        - action: console_messages
          level: error
          assert: empty

    # Gate 4: Feature renders
    - name: "New Widget Visible"
      type: playwright
      steps:
        - action: navigate
          url: "http://localhost:5173/dashboard"
        - action: snapshot
        - action: assert
          condition: "contains 'MyNewWidget'"

    # Gate 5: Feature works
    - name: "Widget Interaction Works"
      type: playwright
      steps:
        - action: click
          element: "MyNewWidget button"
        - action: wait_for
          text: "Widget activated"
```
