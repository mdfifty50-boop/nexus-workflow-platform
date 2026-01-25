# NEXUS WORKFLOW INTEGRATION ARCHITECTURE - FINAL PLAN

**Version:** 2.0
**Author:** API Architect
**Date:** 2026-01-22
**Status:** DESIGN COMPLETE - Ready for Implementation

---

## EXECUTIVE SUMMARY

This architecture solves ALL edge cases across millions of workflow scenarios by implementing a **5-Layer Resolution System** that handles:
- Tool slug mapping for 500+ integrations
- Multi-parameter collection without conflicts
- Unsupported tool detection with alternatives
- Pre-flight validation before execution
- Graceful error recovery

---

## THE 5-LAYER ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 5: UI/UX LAYER                                           │
│  User-friendly prompts, error messages, visual feedback         │
│  Components: UnsupportedToolCard, APIKeyAcquisitionCard         │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 4: EXECUTION ENGINE                                      │
│  Rube/Composio calls, custom API execution, error recovery      │
│  Services: RubeMCPService, CustomIntegrationService             │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 3: PARAMETER RESOLUTION                                  │
│  Multi-param collection, validation, transformation             │
│  Services: ParameterResolutionService, PreFlightService         │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 2: TOOL RESOLUTION                                       │
│  Intent → Tool slug mapping, fallback chains                    │
│  Services: ToolRegistry, ToolDiscoveryService                   │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 1: INTENT RESOLUTION                                     │
│  Natural language → Action + Integration detection              │
│  Services: NexusAIService, IntentResolver                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## PROBLEM 1: MULTI-PARAMETER OVERWRITES

### The Issue (FIX-031)
WhatsApp needs `to` + `message`. Both were stored as `{whatsapp: value}`, causing the second to overwrite the first.

### Root Cause
```typescript
// BAD: Same key for different parameters
collectedParams = { whatsapp: '+965...' }  // phone
collectedParams = { whatsapp: 'Hello' }    // OVERWRITES phone!
```

### SOLUTION: Unique Parameter Keys

```typescript
// Parameter Collection Key Format: nodeId_paramName
interface CollectedParams {
  [key: `${string}_${string}`]: string;
}

// Example:
collectedParams = {
  'step_2_to': '+96512345678',
  'step_2_message': 'Hello from Nexus!'
}

// Resolution Function
function resolveParamsForNode(nodeId: string, params: CollectedParams): Record<string, string> {
  const prefix = `${nodeId}_`;
  return Object.entries(params)
    .filter(([key]) => key.startsWith(prefix))
    .reduce((acc, [key, value]) => {
      const paramName = key.slice(prefix.length);
      acc[paramName] = value;
      return acc;
    }, {} as Record<string, string>);
}
```

### Implementation
- Modify `WorkflowPreviewCard.tsx` line ~3600 where params are collected
- Update `onMissingInfoSelect` to use `${nodeId}_${paramName}` keys
- Update param resolution before tool execution

---

## PROBLEM 2: TOOL NOT FOUND ERRORS

### The Issue (FIX-019, FIX-020)
User says "save to Dropbox" but `DROPBOX_SAVE_FILE` doesn't exist in Composio. System crashes with technical error.

### Root Cause
- No standardized registry of valid tool slugs
- Action verb mapping is incomplete
- Fallback suggestions are logged but not shown visually

### SOLUTION: TOOL_REGISTRY with Rich Definitions

```typescript
// New file: nexus/src/services/ToolRegistry.ts

interface ToolDefinition {
  slug: string;                           // DROPBOX_UPLOAD_FILE
  integration: string;                    // dropbox
  category: 'storage' | 'communication' | 'productivity' | 'crm' | 'payment' | 'social';
  actions: string[];                      // ['upload', 'save', 'store', 'write', 'put']
  requiredParams: ParamDefinition[];      // [{name: 'path', friendly: 'Where to save?'}]
  optionalParams: ParamDefinition[];
  paramAliases: Record<string, string[]>; // {path: ['file_path', 'destination', 'folder']}
  isDefault: boolean;                     // true = use when action is ambiguous
  supportLevel: 'native' | 'api_key' | 'alternative' | 'unsupported';
}

interface ParamDefinition {
  name: string;           // 'path'
  friendly: string;       // 'Where should I save the file?'
  type: 'string' | 'email' | 'phone' | 'url' | 'number';
  validation?: RegExp;
  quickAction?: {         // For common scenarios
    label: string;        // 'Save to root folder'
    value: string;        // '/'
  };
}

const TOOL_REGISTRY: Record<string, ToolDefinition[]> = {
  dropbox: [
    {
      slug: 'DROPBOX_UPLOAD_FILE',
      integration: 'dropbox',
      category: 'storage',
      actions: ['upload', 'save', 'store', 'write', 'put', 'backup'],
      requiredParams: [
        { name: 'path', friendly: 'Where should I save the file?', type: 'string' },
        { name: 'content', friendly: 'What content to save?', type: 'string' }
      ],
      optionalParams: [],
      paramAliases: { path: ['file_path', 'destination', 'folder', 'location'] },
      isDefault: true,
      supportLevel: 'native'
    },
    {
      slug: 'DROPBOX_DOWNLOAD_FILE',
      integration: 'dropbox',
      category: 'storage',
      actions: ['download', 'get', 'fetch', 'retrieve', 'read'],
      requiredParams: [
        { name: 'path', friendly: 'Which file to download?', type: 'string' }
      ],
      optionalParams: [],
      paramAliases: { path: ['file_path', 'file', 'source'] },
      isDefault: false,
      supportLevel: 'native'
    },
    {
      slug: 'DROPBOX_LIST_FOLDER',
      integration: 'dropbox',
      category: 'storage',
      actions: ['list', 'show', 'display', 'browse'],
      requiredParams: [
        { name: 'path', friendly: 'Which folder to list?', type: 'string',
          quickAction: { label: 'Root folder', value: '' } }
      ],
      optionalParams: [],
      paramAliases: { path: ['folder', 'directory'] },
      isDefault: false,
      supportLevel: 'native'
    }
  ],

  whatsapp: [
    {
      slug: 'WHATSAPP_SEND_MESSAGE',
      integration: 'whatsapp',
      category: 'communication',
      actions: ['send', 'message', 'notify', 'text', 'alert'],
      requiredParams: [
        { name: 'to', friendly: 'Who should receive this message?', type: 'phone' },
        { name: 'message', friendly: 'What message should I send?', type: 'string' }
      ],
      optionalParams: [],
      paramAliases: {
        to: ['phone', 'number', 'recipient', 'phone_number'],
        message: ['text', 'body', 'content']
      },
      isDefault: true,
      supportLevel: 'native'
    }
  ],

  // ... 150+ more integrations
};
```

### Tool Resolution Algorithm

```typescript
function resolveToolSlug(
  integration: string,
  actionVerb: string,
  nodeName: string
): { slug: string; definition: ToolDefinition } | null {

  // Step 1: Get tools for this integration
  const tools = TOOL_REGISTRY[integration.toLowerCase()];
  if (!tools?.length) return null;

  // Step 2: Find tool by action verb
  const verbLower = actionVerb.toLowerCase();
  const matchByVerb = tools.find(t =>
    t.actions.some(a => a === verbLower || verbLower.includes(a))
  );
  if (matchByVerb) return { slug: matchByVerb.slug, definition: matchByVerb };

  // Step 3: Parse node name for action hints
  const nodeWords = nodeName.toLowerCase().split(/[\s_-]+/);
  for (const tool of tools) {
    if (tool.actions.some(a => nodeWords.includes(a))) {
      return { slug: tool.slug, definition: tool };
    }
  }

  // Step 4: Fall back to default tool for this integration
  const defaultTool = tools.find(t => t.isDefault);
  if (defaultTool) return { slug: defaultTool.slug, definition: defaultTool };

  // Step 5: Return first tool as last resort
  return { slug: tools[0].slug, definition: tools[0] };
}
```

---

## PROBLEM 3: UNSUPPORTED TOOLS

### The Issue
User requests Wave, Tally, KNET, or other tools not in Composio. System shows unhelpful "not supported" message.

### SOLUTION: 3-Tier Support Model

```typescript
type SupportLevel = 'native' | 'api_key' | 'alternative' | 'unsupported';

interface SupportResolution {
  level: SupportLevel;
  tool?: ToolDefinition;           // For native/api_key
  alternatives?: Alternative[];     // For alternative/unsupported
  apiKeyInfo?: AppAPIInfo;         // For api_key level
  message: string;                 // User-friendly explanation
}

function resolveSupportLevel(integration: string): SupportResolution {
  // Tier 1: Native Composio support
  const nativeTools = TOOL_REGISTRY[integration];
  if (nativeTools?.some(t => t.supportLevel === 'native')) {
    return {
      level: 'native',
      tool: nativeTools.find(t => t.isDefault && t.supportLevel === 'native'),
      message: `${integration} is fully supported with one-click connection.`
    };
  }

  // Tier 2: API Key support (CustomIntegrationService)
  const apiInfo = customIntegrationService.getAppAPIInfo(integration);
  if (apiInfo) {
    return {
      level: 'api_key',
      apiKeyInfo: apiInfo,
      message: `${apiInfo.displayName} can be connected with your API key.`
    };
  }

  // Tier 3: Alternatives available (NexusFallbackService)
  const alternatives = nexusFallbackService.getSuggestedAlternatives(integration);
  if (alternatives.length > 0) {
    return {
      level: 'alternative',
      alternatives,
      message: `${integration} isn't directly supported, but here are some alternatives...`
    };
  }

  // Tier 4: Unsupported
  return {
    level: 'unsupported',
    message: `${integration} isn't available yet. We're always adding new integrations!`,
    alternatives: [
      { toolkit: 'email', name: 'Email', description: 'Send data via email instead', confidence: 0.5 }
    ]
  };
}
```

### UI Component: UnsupportedToolCard

```tsx
// New file: nexus/src/components/chat/UnsupportedToolCard.tsx

interface UnsupportedToolCardProps {
  requestedTool: string;
  resolution: SupportResolution;
  onSelectAlternative: (toolkit: string) => void;
  onSetupAPIKey: () => void;
  onSkip: () => void;
}

function UnsupportedToolCard({
  requestedTool,
  resolution,
  onSelectAlternative,
  onSetupAPIKey,
  onSkip
}: UnsupportedToolCardProps) {
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          {resolution.level === 'api_key'
            ? `Connect ${requestedTool} with your API key`
            : `${requestedTool} needs a different approach`
          }
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">{resolution.message}</p>

        {/* Tier 2: API Key Option */}
        {resolution.level === 'api_key' && resolution.apiKeyInfo && (
          <div className="space-y-2">
            <Button onClick={onSetupAPIKey} className="w-full">
              <Key className="h-4 w-4 mr-2" />
              Set up {resolution.apiKeyInfo.displayName}
            </Button>
            <p className="text-xs text-gray-500">
              You'll need your API key from {resolution.apiKeyInfo.displayName}
            </p>
          </div>
        )}

        {/* Tier 3: Alternatives */}
        {resolution.alternatives && resolution.alternatives.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Try one of these instead:</p>
            <div className="grid grid-cols-2 gap-2">
              {resolution.alternatives.slice(0, 4).map(alt => (
                <Button
                  key={alt.toolkit}
                  variant="outline"
                  onClick={() => onSelectAlternative(alt.toolkit)}
                  className="justify-start"
                >
                  <IntegrationLogo toolkit={alt.toolkit} className="h-4 w-4 mr-2" />
                  {alt.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Skip Option */}
        <Button variant="ghost" onClick={onSkip} className="w-full">
          Skip this step
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

## PROBLEM 4: PRE-FLIGHT VALIDATION

### The Issue (FIX-033)
Workflow starts, fails at step 3 because a parameter is missing, user provides it, workflow restarts from step 1. This crash-and-retry loop is frustrating.

### SOLUTION: Pre-Flight Check Before Execution

```typescript
// Enhanced PreFlightService

interface PreFlightResult {
  ready: boolean;
  missingConnections: string[];
  missingParameters: MissingParam[];
  unsupportedTools: UnsupportedTool[];
  warnings: string[];
}

interface MissingParam {
  nodeId: string;
  nodeName: string;
  paramName: string;
  friendlyPrompt: string;
  type: 'string' | 'email' | 'phone' | 'url';
  quickAction?: { label: string; value: string };
}

interface UnsupportedTool {
  nodeId: string;
  nodeName: string;
  requestedTool: string;
  resolution: SupportResolution;
}

async function runPreFlight(workflow: WorkflowSpec): Promise<PreFlightResult> {
  const result: PreFlightResult = {
    ready: true,
    missingConnections: [],
    missingParameters: [],
    unsupportedTools: [],
    warnings: []
  };

  for (const step of workflow.steps) {
    // Check 1: Is tool supported?
    const support = resolveSupportLevel(step.tool);
    if (support.level === 'alternative' || support.level === 'unsupported') {
      result.ready = false;
      result.unsupportedTools.push({
        nodeId: step.id,
        nodeName: step.name,
        requestedTool: step.tool,
        resolution: support
      });
      continue;
    }

    // Check 2: Is connection active?
    const connected = await checkConnection(step.tool);
    if (!connected) {
      result.ready = false;
      result.missingConnections.push(step.tool);
    }

    // Check 3: Are required params available?
    const toolDef = resolveToolSlug(step.tool, step.action || '', step.name);
    if (toolDef) {
      for (const param of toolDef.definition.requiredParams) {
        const hasValue = step.params?.[param.name] ||
                         collectedParams[`${step.id}_${param.name}`];
        if (!hasValue) {
          result.ready = false;
          result.missingParameters.push({
            nodeId: step.id,
            nodeName: step.name,
            paramName: param.name,
            friendlyPrompt: param.friendly,
            type: param.type,
            quickAction: param.quickAction
          });
        }
      }
    }
  }

  return result;
}
```

### UI Flow for Pre-Flight

```tsx
// In WorkflowPreviewCard.tsx

const [preFlightResult, setPreFlightResult] = useState<PreFlightResult | null>(null);
const [preFlightStep, setPreFlightStep] = useState<'connections' | 'parameters' | 'unsupported' | 'ready'>('connections');

// Execute button state
const canExecute = preFlightResult?.ready === true;

return (
  <div>
    {/* Step 1: Connect missing integrations */}
    {preFlightStep === 'connections' && preFlightResult?.missingConnections.length > 0 && (
      <ConnectionsPanel
        missing={preFlightResult.missingConnections}
        onAllConnected={() => setPreFlightStep('parameters')}
      />
    )}

    {/* Step 2: Collect missing parameters */}
    {preFlightStep === 'parameters' && preFlightResult?.missingParameters.length > 0 && (
      <ParameterCollectionPanel
        params={preFlightResult.missingParameters}
        onAllCollected={() => setPreFlightStep('unsupported')}
      />
    )}

    {/* Step 3: Handle unsupported tools */}
    {preFlightStep === 'unsupported' && preFlightResult?.unsupportedTools.length > 0 && (
      <div className="space-y-4">
        {preFlightResult.unsupportedTools.map(tool => (
          <UnsupportedToolCard
            key={tool.nodeId}
            requestedTool={tool.requestedTool}
            resolution={tool.resolution}
            onSelectAlternative={(alt) => replaceNode(tool.nodeId, alt)}
            onSetupAPIKey={() => showAPIKeyCard(tool.requestedTool)}
            onSkip={() => removeNode(tool.nodeId)}
          />
        ))}
      </div>
    )}

    {/* Execute button - only enabled when ready */}
    <Button
      onClick={executeWorkflow}
      disabled={!canExecute}
      className="w-full"
    >
      {canExecute ? 'Execute Workflow' : 'Complete Setup First'}
    </Button>
  </div>
);
```

---

## PROBLEM 5: ERROR RECOVERY

### The Issue
Different errors need different recovery strategies. Currently all errors are treated the same.

### SOLUTION: Error Classification System

```typescript
type ErrorCategory =
  | 'missing_param'      // Need to collect a parameter
  | 'tool_not_found'     // Tool doesn't exist
  | 'connection_expired' // OAuth token expired
  | 'rate_limited'       // Too many requests
  | 'api_error'          // External API failed
  | 'network_error'      // Network issue
  | 'permission_denied'  // User lacks permission
  | 'unknown';           // Unexpected error

interface ClassifiedError {
  category: ErrorCategory;
  message: string;           // User-friendly message
  recoveryAction: RecoveryAction;
  canAutoRecover: boolean;
  technicalDetails?: string; // For logging only
}

type RecoveryAction =
  | { type: 'collect_param'; nodeId: string; paramName: string; prompt: string }
  | { type: 'show_alternatives'; nodeId: string; alternatives: Alternative[] }
  | { type: 'reconnect'; toolkit: string }
  | { type: 'retry'; delay: number }
  | { type: 'skip_node'; nodeId: string }
  | { type: 'abort'; message: string };

function classifyError(error: Error, context: ExecutionContext): ClassifiedError {
  const msg = error.message.toLowerCase();

  // Missing parameter
  if (msg.includes('missing required parameter') || msg.includes('required field')) {
    const paramMatch = error.message.match(/parameter[s]?:?\s*(\w+)/i);
    return {
      category: 'missing_param',
      message: 'Need a bit more information to continue...',
      recoveryAction: {
        type: 'collect_param',
        nodeId: context.currentNodeId,
        paramName: paramMatch?.[1] || 'value',
        prompt: getFriendlyPromptForParam(paramMatch?.[1] || 'value', context.toolkit)
      },
      canAutoRecover: false
    };
  }

  // Tool not found
  if (msg.includes('tool not found') || msg.includes('action not found')) {
    const alternatives = nexusFallbackService.getSuggestedAlternatives(context.toolkit);
    return {
      category: 'tool_not_found',
      message: `Let me find another way to do this...`,
      recoveryAction: {
        type: 'show_alternatives',
        nodeId: context.currentNodeId,
        alternatives
      },
      canAutoRecover: false
    };
  }

  // Connection expired
  if (msg.includes('unauthorized') || msg.includes('token expired') || msg.includes('401')) {
    return {
      category: 'connection_expired',
      message: `Need to reconnect to ${context.toolkit}...`,
      recoveryAction: {
        type: 'reconnect',
        toolkit: context.toolkit
      },
      canAutoRecover: true
    };
  }

  // Rate limited
  if (msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('429')) {
    return {
      category: 'rate_limited',
      message: 'Taking a short break, will retry shortly...',
      recoveryAction: {
        type: 'retry',
        delay: 5000
      },
      canAutoRecover: true
    };
  }

  // Default: unknown error
  return {
    category: 'unknown',
    message: 'Something unexpected happened. Let me try a different approach.',
    recoveryAction: {
      type: 'abort',
      message: 'Unable to complete this step. Please try again.'
    },
    canAutoRecover: false,
    technicalDetails: error.message
  };
}
```

---

## INTEGRATION COVERAGE

### Tier 1: Native Composio Support (150+)

| Category | Integrations |
|----------|--------------|
| Communication | Gmail, Slack, Discord, WhatsApp, Telegram, Microsoft Teams |
| Storage | Google Drive, Dropbox, OneDrive, Box |
| Productivity | Google Sheets, Notion, Airtable, Coda |
| Project | Trello, Asana, Linear, Jira, Monday, ClickUp |
| CRM | HubSpot, Salesforce, Pipedrive, Zoho CRM |
| Payments | Stripe, PayPal, Square |
| Social | Twitter/X, LinkedIn, Facebook, Instagram |
| Dev | GitHub, GitLab, Bitbucket |
| Calendar | Google Calendar, Outlook Calendar |

### Tier 2: API Key Support (100+)

From `CustomIntegrationService.ts`:
- **Accounting:** Wave, FreshBooks, Kashoo
- **CRM:** Pipeline CRM, Close, Copper, Insightly
- **ERP:** Odoo
- **Project:** Basecamp, Teamwork
- **And 90+ more...**

### Tier 3: Alternative Suggestions

| Requested | Alternatives |
|-----------|--------------|
| Tally | Zoho Books, Xero, QuickBooks |
| SAP | Browser automation |
| KNET | Tap Payments (supports KNET), Stripe |
| Wave | Zoho Books, Xero, QuickBooks |

---

## IMPLEMENTATION PHASES

### Phase 1: Core Infrastructure (3-5 files)

1. **Create `ToolRegistry.ts`** - Rich tool definitions with actions, params, aliases
2. **Create `IntentResolver.ts`** - Natural language → action mapping
3. **Modify `PreFlightService.ts`** - Add comprehensive pre-flight checks
4. **Create `ErrorClassifier.ts`** - Classify errors and determine recovery

### Phase 2: UI Components (2-3 files)

1. **Create `UnsupportedToolCard.tsx`** - Show alternatives and API key options
2. **Create `ParameterCollectionPanel.tsx`** - Collect all params before execution
3. **Modify `WorkflowPreviewCard.tsx`** - Integrate pre-flight flow

### Phase 3: Integration (2-3 files)

1. **Wire services together** in WorkflowPreviewCard
2. **Update NexusAIService** to detect unsupported tools early
3. **Add API routes** for tool discovery

### Phase 4: Testing & Polish

1. Test all integration categories
2. Verify no regressions (run `/validate`)
3. Test error recovery scenarios
4. Polish UX messaging

---

## PROTECTED CODE (DO NOT MODIFY)

All code with `@NEXUS-FIX-XXX` markers is PROTECTED:

| Fix | Purpose | File |
|-----|---------|------|
| FIX-001 | Popup blocker bypass | WorkflowPreviewCard.tsx |
| FIX-002 | Expired connection detection | WorkflowPreviewCard.tsx |
| FIX-003 | Parallel OAuth | WorkflowPreviewCard.tsx |
| FIX-004 | Custom integration handling | WorkflowPreviewCard.tsx |
| FIX-017 | Storage action mappings | WorkflowPreviewCard.tsx |
| FIX-018 | Default actions | WorkflowPreviewCard.tsx |
| FIX-019 | Tool validation | WorkflowPreviewCard.tsx |
| FIX-020 | Fallback suggestions | WorkflowPreviewCard.tsx |
| FIX-027 | Send to Myself button | WorkflowPreviewCard.tsx |
| FIX-028 | Semantic colors | WorkflowPreviewCard.tsx |
| FIX-029 | Param mapping | WorkflowPreviewCard.tsx |
| FIX-030 | Phone loop bug | WorkflowPreviewCard.tsx |
| FIX-031 | Multi-param collection | WorkflowPreviewCard.tsx |
| FIX-032 | Dynamic prompts | WorkflowPreviewCard.tsx |

**The new architecture ADDS to existing systems. It does NOT replace protected code.**

---

## VALIDATION CHECKLIST

Before deployment:

- [ ] Run `/validate` - all fix markers present
- [ ] Test: Gmail send workflow
- [ ] Test: Slack message workflow
- [ ] Test: WhatsApp with phone AND message
- [ ] Test: Wave API key collection
- [ ] Test: Dropbox "save" → upload mapping
- [ ] Test: Pre-flight questions before execute
- [ ] Test: Unsupported tool → alternatives flow
- [ ] Test: Error recovery for each error type
- [ ] No "Maximum update depth exceeded" errors
- [ ] No technical jargon visible to users
- [ ] Build passes: `npm run build`

---

## SUCCESS CRITERIA

The architecture is successful when:

1. **Tool Resolution:** Any user phrase maps to correct Composio slug
2. **Parameter Collection:** Multi-param integrations work without conflicts
3. **Pre-Flight:** No crash-and-retry loops, all questions asked upfront
4. **Unsupported Tools:** Clear path to alternatives or API key setup
5. **Error Recovery:** Graceful handling with user-friendly messages
6. **Zero Jargon:** Users never see technical errors or parameter names

---

## APPENDIX: Common Scenarios Solved

| User Says | Resolution |
|-----------|------------|
| "Save to Dropbox" | → DROPBOX_UPLOAD_FILE |
| "Notify on Slack" | → SLACK_SEND_MESSAGE |
| "Send WhatsApp to +965..." | → WHATSAPP_SEND_MESSAGE with to + message params |
| "Track in Wave" | → Show APIKeyAcquisitionCard for Wave |
| "Use Tally" | → Show alternatives (Zoho, Xero, QuickBooks) |
| "Email me when..." | → GMAIL_SEND_EMAIL with user's email auto-filled |
| "Store in Google Drive" | → GOOGLEDRIVE_UPLOAD_FILE |
| "Create Trello card" | → TRELLO_CREATE_CARD |
| "Alert on Discord" | → DISCORD_SEND_MESSAGE |
| "Backup to OneDrive" | → ONEDRIVE_UPLOAD_FILE |

---

**END OF ARCHITECTURE DOCUMENT**
