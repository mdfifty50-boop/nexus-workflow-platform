# Workflow Specification Rules (MANDATORY)

## AI Response Format

When Nexus AI receives a workflow request, it MUST return valid JSON.

### For Non-Workflow Requests
```json
{
  "message": "Response text here",
  "shouldGenerateWorkflow": false,
  "intent": "greeting|question|clarification"
}
```

### For Workflow Requests
```json
{
  "message": "Brief explanation",
  "shouldGenerateWorkflow": true,
  "intent": "workflow",
  "confidence": 0.85,
  "workflowSpec": {
    "name": "Descriptive Workflow Name",
    "description": "What this workflow does",
    "steps": [
      {"id": "step_1", "name": "Trigger: Event Name", "tool": "integration", "type": "trigger"},
      {"id": "step_2", "name": "Action: Task Name", "tool": "integration", "type": "action"}
    ],
    "requiredIntegrations": ["integration1", "integration2"],
    "estimatedTimeSaved": "X hours/week"
  }
}
```

## Step Requirements

Each step in `workflowSpec.steps` MUST have:

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| id | YES | string | Unique step identifier (step_1, step_2...) |
| name | YES | string | User-friendly step name |
| tool | YES | string | Integration toolkit name (lowercase) |
| type | YES | string | "trigger" or "action" |

## Confidence Levels

| Confidence | Meaning | Display |
|------------|---------|---------|
| 0.9+ | High confidence, ready to execute | Green badge |
| 0.7-0.89 | Good match, may need clarification | Yellow badge |
| 0.5-0.69 | Possible match, needs confirmation | Orange badge |
| <0.5 | Low confidence, ask for details | Show questions |

## Integration Names

Use lowercase integration names matching Composio toolkit:

| User Says | Use |
|-----------|-----|
| Gmail, email, Google Mail | gmail |
| Slack, slack message | slack |
| Google Sheets, spreadsheet | googlesheets |
| Dropbox, dropbox file | dropbox |
| GitHub, git | github |
| Notion, notion page | notion |
| Discord, discord message | discord |

## Step Type Guidelines

### Triggers (type: "trigger")
- Events that START the workflow
- One trigger per workflow (first step)
- Examples: "When email arrives", "When file uploaded", "On schedule"

### Actions (type: "action")
- Tasks the workflow PERFORMS
- Can have multiple actions
- Examples: "Send message", "Create file", "Update record"

## Response Generation Rules

1. **ALWAYS** return valid JSON - never plain text for automation requests
2. **ALWAYS** include `shouldGenerateWorkflow` field
3. **ALWAYS** include `workflowSpec` when `shouldGenerateWorkflow: true`
4. **NEVER** include triple backticks in JSON (breaks parsing)
5. **NEVER** recommend external tools (Zapier, Make, n8n)
6. **ALWAYS** use integration names, not tool slugs in `tool` field

## Validation Checklist

Before returning workflow JSON:
- [ ] All required fields present
- [ ] Integration names are lowercase
- [ ] At least one trigger step
- [ ] At least one action step
- [ ] Step IDs are unique
- [ ] JSON is valid (no trailing commas, proper quotes)
