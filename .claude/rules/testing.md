---
paths:
  - "nexus/**/*"
  - "tests/**/*"
---

# Testing Rules

## Test-Driven Development
1. Write failing tests FIRST
2. Implement to pass tests
3. Refactor with green tests

## Before Marking Complete
- [ ] Dev server running
- [ ] No console errors
- [ ] No "Maximum update depth exceeded" errors
- [ ] Feature works as expected
- [ ] Build passes (`npm run build`)

## Playwright MCP Testing (DEFERRED TOOLS - MUST LOAD FIRST)

**CRITICAL:** Playwright tools are **deferred** and MUST be loaded before use.
Before ANY Playwright call, run `ToolSearch` to load the tools:

```
ToolSearch query: "playwright" → Loads all browser tools
```

Only AFTER loading, use these tools:
```
mcp__playwright__browser_navigate → Load page
mcp__playwright__browser_snapshot → Get accessibility tree
mcp__playwright__browser_console_messages → Check for errors
mcp__playwright__browser_click → Interact with elements
mcp__playwright__browser_take_screenshot → Capture visual state
```

**When to load Playwright proactively:**
- Before ANY frontend verification task
- At the start of any session that involves UI work
- Before running `/deploy-check` or `/repo-guard` with UI verification
- When the CLAUDE.md "MANDATORY VERIFICATION PROCEDURES" section applies

**Autonomous loading pattern:**
1. `ToolSearch("playwright")` — loads all browser tools in one call
2. Then proceed with `mcp__playwright__browser_navigate`, etc.
3. No need to call ToolSearch again within the same session

## Test Coverage
- Unit tests for utilities
- Integration tests for API endpoints
- E2E tests for critical user flows
