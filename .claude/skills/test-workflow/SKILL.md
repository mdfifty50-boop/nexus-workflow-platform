---
name: test-workflow
description: End-to-end workflow testing using Playwright. Use when you need to test workflow execution in the browser.
tools: Bash, Read, mcp__playwright__browser_navigate, mcp__playwright__browser_snapshot, mcp__playwright__browser_click, mcp__playwright__browser_console_messages, mcp__playwright__browser_wait_for
allowed-tools: Bash, Read, Glob, Grep, mcp__playwright__*
---

# End-to-End Workflow Testing Skill

Test workflow execution in the Nexus application.

## Instructions

When invoked with $ARGUMENTS (workflow description or test scenario):

### Step 1: Ensure Dev Server Running
```bash
# Check if dev server is running on any common port
curl -s http://localhost:5173 || curl -s http://localhost:5174 || curl -s http://localhost:5175 || curl -s http://localhost:5176
```
If not running, inform user to start with `cd nexus && npm run dev`

### Step 2: Navigate to Chat
Use Playwright MCP to navigate to the chat interface:
- Navigate to http://localhost:5175/dashboard (or active port)
- Take snapshot to verify page loaded

### Step 3: Test Workflow Creation
If $ARGUMENTS provided:
- Find chat input field
- Type the workflow request
- Submit and wait for response
- Verify WorkflowPreviewCard appears

### Step 4: Check for Errors
- Get console messages with level "error"
- Check for "Maximum update depth exceeded"
- Check for React hydration errors
- Check for failed network requests

### Step 5: Test Execution (if requested)
- Click "Execute" button
- Monitor node status changes
- Check for OAuth prompts
- Verify completion or capture error

### Step 6: Report Results
Output a structured report:
```
## Workflow Test Results

**Test:** [description]
**Status:** PASS/FAIL
**Time:** [timestamp]

### Checks
- [ ] Page loaded correctly
- [ ] Chat responded
- [ ] Workflow card displayed
- [ ] No console errors
- [ ] Execution completed (if tested)

### Issues Found
[List any issues]

### Console Errors
[List any errors]
```

## Example Usage

```
/test-workflow "Send me an email when I get a Slack message"
/test-workflow oauth-flow
/test-workflow error-handling
```
