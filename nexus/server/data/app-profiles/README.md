# App Profiles Cache

Self-growing knowledge base of app/tool profiles discovered during workflow generation.

When Claude encounters an unknown app, it builds a mental profile (category, actions, fields, auth type).
These profiles are cached here for future reference, reducing latency on repeat requests.

## Structure

Each profile is a JSON file named `{app-name}.json`:

```json
{
  "name": "AppName",
  "category": "CRM|STORAGE|EMAIL|etc.",
  "actions": ["create", "read", "update", "delete"],
  "fields": ["name", "email", "phone"],
  "authType": "oauth2|api_key|none",
  "tier": "verified|ai_comprehended|discovery",
  "discoveredAt": "2026-02-22T00:00:00Z",
  "usageCount": 1
}
```

## Auto-population

Profiles are created automatically when AppDetectionService encounters unknown apps.
No manual maintenance required.
