# Playwright MCP Testing Procedures

**Last Updated:** 2026-01-08
**Purpose:** Standardized procedures for verifying web application functionality before marking tasks complete.

---

## CRITICAL RULE: Always Verify Before Delivering

**NEVER mark a task as "complete" without actually testing it in the browser.**

The Playwright MCP server provides browser automation capabilities that MUST be used to verify:
1. UI renders correctly
2. Buttons and interactions work
3. No console errors
4. Data flows correctly

---

## 1. Starting the Development Server

### Nexus Application

```bash
# Navigate to nexus directory
cd C:\Users\PC\Documents\Autoclaude 2D workflow office\nexus

# Start dev server
npm run dev
```

**Expected Output:**
```
VITE v5.x.x ready in XXX ms
  -> Local:   http://localhost:5173/
```

**Note:** If port 5173 is in use, Vite will auto-increment (5174, 5175, 5176, etc.)

### Check Dev Server Status

```bash
# Read the background task output to find the actual port
# Look for the "Local:" line in the Vite output
```

---

## 2. Playwright MCP Browser Commands

### Navigate to a Page

```
mcp__playwright__browser_navigate
- url: "http://localhost:5176/dashboard"
```

### Take a Snapshot (Preferred for Analysis)

```
mcp__playwright__browser_snapshot
```

Returns accessibility tree with element references (ref=eXXX) for interaction.

### Take a Screenshot (Visual Record)

```
mcp__playwright__browser_take_screenshot
- fullPage: true
- filename: "test-results/page-name.png"
```

### Click an Element

```
mcp__playwright__browser_click
- element: "Human-readable description"
- ref: "eXXX"  # From snapshot
```

### Type Text

```
mcp__playwright__browser_type
- element: "Description"
- ref: "eXXX"
- text: "Text to type"
- submit: true  # Optional: press Enter after
```

### Check Console for Errors

```
mcp__playwright__browser_console_messages
- level: "error"
```

### Wait for Content

```
mcp__playwright__browser_wait_for
- text: "Expected text"
- time: 2  # seconds
```

---

## 3. Pre-Delivery Verification Checklist

### Before Marking ANY UI Task Complete:

- [ ] **Start dev server** and confirm it's running
- [ ] **Navigate to the relevant page** using `browser_navigate`
- [ ] **Take a snapshot** to verify page structure
- [ ] **Check console for errors** using `browser_console_messages`
- [ ] **Test the specific feature** you implemented
- [ ] **Verify no infinite loops** (watch for "Maximum update depth exceeded")
- [ ] **Test on key routes:**
  - `/` - Landing page
  - `/dashboard` - Main dashboard
  - `/workflows` - Workflows list
  - `/workflow-demo` - Workflow visualization
  - `/templates` - Templates gallery
  - `/integrations` - Integration management
  - `/settings` - User settings
  - `/profile` - User profile

### For Bug Fixes:

- [ ] **Reproduce the bug first** (before fixing)
- [ ] **Apply the fix**
- [ ] **Verify the fix works** via browser testing
- [ ] **Check for regressions** on related features

### For New Features:

- [ ] **Navigate to the feature location**
- [ ] **Verify UI renders correctly**
- [ ] **Test all interactive elements** (buttons, forms, links)
- [ ] **Check state management** (data persists, updates correctly)
- [ ] **Test edge cases** (empty states, error states)

---

## 4. Common Issues and Fixes

### Issue: "Maximum update depth exceeded"

**Cause:** Infinite loop in React hooks (useEffect, useState)

**Fix Pattern:**
```typescript
// BAD - Creates new reference each render
useEffect(() => {
  // This runs infinitely
}, [objectThatChangesEachRender])

// GOOD - Use refs to track previous state
const lastValueRef = useRef<string | null>(null)

useEffect(() => {
  const key = JSON.stringify(value)
  if (lastValueRef.current === key) return
  lastValueRef.current = key
  // Now safe to update
}, [value])
```

**Also wrap callbacks:**
```typescript
const callback = useCallback(() => {
  // Function body
}, []) // Empty deps = stable reference
```

### Issue: Port Already in Use

**Solution:** Check which port Vite is actually using in the output, or kill processes:
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Issue: Page Not Loading

**Checklist:**
1. Is dev server running?
2. Correct port number?
3. Check browser console for errors
4. Try hard refresh (Ctrl+Shift+R)

### Issue: SSE Connection Errors

**Cause:** Server-Sent Events disconnect on mobile/unstable networks

**Verify:** Check if reconnection logic works:
```
browser_console_messages level: "warning"
```

---

## 5. Testing Workflow Execution

### Verify End-to-End Workflow:

1. **Navigate to workflow demo:**
   ```
   browser_navigate url: "http://localhost:5176/workflow-demo"
   ```

2. **Click Execute button:**
   ```
   browser_click element: "Execute Workflow" ref: "eXXX"
   ```

3. **Monitor progress:**
   - Take snapshots every few seconds
   - Look for progress indicators (e.g., "1/14 nodes")
   - Watch for status changes

4. **Verify completion:**
   - Final status shows "Workflow completed successfully!"
   - All nodes show "Complete" status
   - No error messages in log

5. **Check error recovery:**
   - If errors occur, verify recovery messages appear
   - Confirm "Issue FIXED" messages show

---

## 6. Routes Reference (Nexus)

| Route | Description | Key Elements to Test |
|-------|-------------|---------------------|
| `/` | Landing page | Hero, CTA buttons, navigation |
| `/dashboard` | Main dashboard | Stats, achievements, suggestions |
| `/workflows` | Workflow list | Create button, workflow cards |
| `/workflow-demo` | n8n-style visualization | Execute button, node states, progress |
| `/templates` | Template gallery | Preview, Use Template buttons |
| `/integrations` | Integration management | Connect buttons, status indicators |
| `/settings` | User settings | Tabs, form fields, Save button |
| `/profile` | User profile | Avatar, achievements, activity |
| `/projects` | Project list | Create, archive, settings |

---

## 7. Quick Reference Commands

```yaml
# Start testing session
1. Start dev server: npm run dev (in nexus folder)
2. Navigate: browser_navigate url: "http://localhost:5176"
3. Snapshot: browser_snapshot
4. Check errors: browser_console_messages level: "error"

# Interact with page
- Click: browser_click element: "Description" ref: "eXXX"
- Type: browser_type element: "Input field" ref: "eXXX" text: "value"
- Wait: browser_wait_for text: "Expected content"

# Document results
- Screenshot: browser_take_screenshot fullPage: true
```

---

## 8. Integration with BMAD Workflow

When working on BMAD tasks:

1. **Before starting implementation:**
   - Review the story acceptance criteria
   - Identify testable outcomes

2. **During implementation:**
   - Make incremental changes
   - Test frequently

3. **Before marking complete:**
   - Run full verification checklist
   - Document test results
   - Capture screenshots as evidence

4. **If bugs found:**
   - Fix immediately
   - Re-verify
   - Check for related issues

---

**Remember: Untested code is broken code. Always verify in the browser.**
