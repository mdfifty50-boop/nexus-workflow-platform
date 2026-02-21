# Session Metrics Dashboard

Read and display the current session cost and agent performance metrics.

## Instructions

1. Read the file `.claude/session-metrics.json` (relative to the project root). If it does not exist, report "No session metrics recorded yet."

2. Read the file `.claude/agent-metrics.json` (relative to the project root). If it does not exist, report "No agent delegations recorded yet."

3. Display the results in this format:

```
+=====================================================+
|            SESSION METRICS DASHBOARD                |
+=====================================================+

SESSION INFO
  Started:       [sessionStarted timestamp]
  Last Activity: [lastUpdated timestamp]
  Duration:      [calculated from started to now]

COST SUMMARY
  Total Tool Calls:  [totalToolCalls]
  Estimated Tokens:  [input]K input / [output]K output
  Estimated Cost:    $[estimatedCostUSD]

TOOL BREAKDOWN (sorted by calls, descending)
  [ToolName]      [calls] calls   ~[inputTokens] in / ~[outputTokens] out
  [ToolName]      [calls] calls   ~[inputTokens] in / ~[outputTokens] out
  ...

AGENT SCOREBOARD
  [agentType]     [totalTasks] delegations
    - [task desc 1]
    - [task desc 2]
  ...

RECOMMENDATIONS
  - If Read/Grep/Glob calls dominate: "Heavy search usage - consider narrowing search scope or using targeted file reads."
  - If Task calls > 10: "High agent delegation count - review if subtasks could be consolidated."
  - If estimated cost > $5: "Session cost is elevated - consider using /compact or starting a fresh session."
  - If one tool has >50% of all calls: "[Tool] accounts for >50% of calls - check if there is a more efficient approach."
  - If no agent delegations: "No agent delegations this session - consider using @explorer or @coder for parallel work."
```

4. Keep the output concise. Round token counts to nearest K. Round costs to 2 decimal places (or 4 if under $0.01).

5. If both files are missing, say: "No metrics data found. Metrics are recorded automatically as you use tools. Run some commands and try `/metrics` again."
