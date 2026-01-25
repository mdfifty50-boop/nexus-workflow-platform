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

## Playwright MCP Testing
```
mcp__playwright__browser_navigate → Load page
mcp__playwright__browser_snapshot → Get accessibility tree
mcp__playwright__browser_console_messages → Check for errors
mcp__playwright__browser_click → Interact with elements
```

## Test Coverage
- Unit tests for utilities
- Integration tests for API endpoints
- E2E tests for critical user flows
