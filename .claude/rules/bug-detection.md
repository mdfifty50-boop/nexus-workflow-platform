# Bug Detection Rules (MANDATORY)

**CRITICAL:** These rules override any tendency to mark tasks "complete" prematurely.

## Definition of "Complete"

A workflow task is ONLY complete when:
- ✅ ALL nodes execute successfully (green checkmarks)
- ✅ No error messages shown to user
- ✅ No technical jargon exposed to user
- ✅ User did NOT need to provide IDs, slugs, or technical values
- ✅ Final node produces expected output

## Automatic Bug Detection

### 🚨 TECHNICAL PARAMETER LEAK (Critical Bug)

If user sees ANY of these, it's a BUG to fix immediately:

| Technical Term | Should Be |
|----------------|-----------|
| `spreadsheet_id` | "Which Google Sheet?" + picker/link option |
| `channel_id` | "Which Slack channel?" + list |
| `user_id` | "Which user?" + search/list |
| `folder_id` | "Which folder?" + browser |
| `file_id` | "Which file?" + picker |
| `thread_id` | "Which conversation?" |
| `message_id` | "Which message?" |
| `repo` or `repository` | "Which repository?" + list |
| `owner` | Auto-detect from repo URL |
| Any `*_id` parameter | User-friendly alternative |

**Action:** Do NOT mark complete. Fix the parameter translation.

### 🚨 WORKFLOW STOPS MID-EXECUTION (Critical Bug)

Any of these = BUG:
- Node shows "error" status
- "Missing required parameters: X"
- "Tool not found"
- "Execution failed"
- "Unable to retrieve"
- Workflow stuck on "connecting" indefinitely

**Action:** Do NOT mark complete. Diagnose and fix root cause.

### 🚨 USER NEEDS TECHNICAL KNOWLEDGE (UX Bug)

If user would need to:
- Look up an ID in another app
- Read API documentation
- Understand what a "slug" is
- Know the difference between LIST_FILES vs LIST_FOLDER
- Provide JSON or structured data

**Action:** Do NOT mark complete. Add user-friendly abstraction.

### 🚨 RAW ERROR EXPOSURE (UX Bug)

If user sees:
- Stack traces
- Raw API error responses
- HTTP status codes without explanation
- "undefined" or "null" values
- Technical exception messages

**Action:** Do NOT mark complete. Add proper error handling.

## Bug Severity Levels

| Level | Description | Action |
|-------|-------------|--------|
| P0 | Workflow cannot complete at all | Fix immediately |
| P1 | Workflow completes but with technical jargon | Fix before marking complete |
| P2 | Workflow completes but UX is confusing | Log and fix in next iteration |
| P3 | Minor polish issues | Add to backlog |

## On Bug Detection Protocol

```
1. STOP - Do not mark task complete
2. LOG - Record the exact error/issue
3. DIAGNOSE - Find root cause in code
4. CHECK - Verify fix won't break existing @NEXUS-FIX markers
5. FIX - Implement with new @NEXUS-FIX marker
6. REGISTER - Add to FIX_REGISTRY.json
7. TEST - Re-run the same workflow
8. LOOP - If still failing, go to step 2
9. COMPLETE - Only when workflow passes end-to-end
```

## Test Scenarios (Must All Pass)

These represent real user requests. ALL must complete without technical leaks:

1. "Save my Gmail emails to a Google Sheet"
2. "When I get a Slack message, save it to Notion"
3. "Monitor my Dropbox and notify me on Discord"
4. "Summarize my calendar events and email me"
5. "Track GitHub issues in a spreadsheet"
6. "Post my new blog posts to Twitter"
7. "Sync Trello cards to Asana tasks"
8. "Alert me on Slack when Stripe payment fails"
9. "Backup Google Drive files to Dropbox"
10. "Create Jira tickets from support emails"

## Regression Protection

Before ANY fix:
1. Search for existing `@NEXUS-FIX-XXX` markers in the file
2. Run `/validate` to check all fixes still present
3. Ensure new fix doesn't modify protected code blocks
4. Add new fix to FIX_REGISTRY.json with marker

## Remember

**"It compiles" ≠ Complete**
**"Feature exists" ≠ Complete**
**"User can finish workflow without confusion" = Complete**
