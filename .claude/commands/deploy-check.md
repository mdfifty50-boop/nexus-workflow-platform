# /deploy-check - Deployment Readiness Check

Verify the project is ready for deployment.

## Steps

### 1. Build Status
```bash
cd nexus && npm run build 2>&1 | tail -20
```

### 2. Environment Check
Verify required env vars exist (check .env.example vs .env):
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- ANTHROPIC_API_KEY (or CLAUDE_CODE_PROXY)
- COMPOSIO_API_KEY

### 3. Git Status
```bash
git status --short
git log --oneline -5
```

### 4. Fix Registry
Run /fix-check inline.

### 5. Report

```
DEPLOYMENT READINESS
═══════════════════════════════════════════
Build:        [PASS/FAIL]
Environment:  [X/Y vars configured]
Git Status:   [clean/X uncommitted changes]
Fix Registry: [PASS/FAIL]
Branch:       [current branch]
Last Commit:  [hash] [message]

VERDICT: [READY TO DEPLOY / NOT READY - fix above]
═══════════════════════════════════════════
```
