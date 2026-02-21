# /context-audit - Context Window Usage Analysis

Analyze current context window usage and provide optimization recommendations.

## Steps

### 1. Check Context Tracker
Read `.claude/context-usage.json` if it exists.

### 2. Analyze Loaded Files
List files that have been read in this session (approximate from conversation).

### 3. Calculate Usage Estimate

```
CONTEXT AUDIT
═══════════════════════════════════════════
Estimated Usage: [X]% of 200K tokens
Tool Calls This Session: [count]

LARGEST CONTEXT CONSUMERS:
1. CLAUDE.md files (~15K tokens)
2. Rules files (~8K tokens)
3. [other loaded files]

RECOMMENDATIONS:
- [Use agent delegation for remaining work]
- [Consider /compact if > 70%]
- [Save state to .claude-session.md if > 80%]

CONTEXT HEALTH: [GREEN/YELLOW/RED]
═══════════════════════════════════════════
```

### 4. If RED status
Automatically update `.claude-session.md` with current work state and recommend fresh session.
