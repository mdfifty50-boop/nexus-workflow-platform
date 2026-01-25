---
paths:
  - "nexus/**/*.ts"
  - "nexus/**/*.tsx"
---

# Nexus Architecture Rules

## Core Principle
Nexus IS the workflow engine. NEVER recommend external tools like n8n, Zapier, or Make.

## Response Format
All AI responses MUST return valid JSON:
- `shouldGenerateWorkflow: true` + `workflowSpec` → Visual workflow
- `shouldGenerateWorkflow: false` → Text only

## Integration Layer
- Use Composio for all 500+ app integrations
- OAuth handled via WorkflowPreviewCard polling
- Real-time execution via Composio MCP

## State Management
- Zustand for global state
- React Query for server state
- localStorage for workflow persistence

## Key Files (Do Not Break)
- `nexus/server/agents/index.ts` - Nexus personality
- `nexus/src/services/NexusAIService.ts` - Response parsing
- `nexus/src/components/chat/WorkflowPreviewCard.tsx` - Visual workflow
