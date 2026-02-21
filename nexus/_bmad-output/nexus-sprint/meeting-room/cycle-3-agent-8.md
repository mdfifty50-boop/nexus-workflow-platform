# Cycle 3, Agent 8: Execution Pipeline -- Concrete Rube MCP Call Patterns for `resolveIds`

**Agent:** 8 (Workflow Execution Pipeline Analyst)
**Cycle:** 3 of 20
**Date:** 2026-02-15
**Scope:** Design actual API call sequences for ParamResolutionPipeline.resolveIds
**Prerequisite:** Cycle 2 Agent 8 report (wiring plan), Boardroom #2 Question #8

---

## 1. Executive Summary

The `resolveIds` method in `ParamResolutionPipeline.ts` (line 468) is currently a stub that logs intent but makes zero API calls. This report designs the concrete Rube MCP call sequences needed to convert human-friendly parameter values (e.g., "general", "My Project", "nexus") into API-consumable IDs (e.g., `C0123456789`, `abc123-page-id`, `owner/nexus`).

**Key finding:** Of the 47 toolkits in TOOL_SLUGS, only 12 require ID resolution. The remaining 35 either accept human-readable values directly or use values that cannot be resolved (freeform text, email addresses, file content). This dramatically reduces the scope of the resolveIds implementation.

**Estimated total latency budget:** 800ms-2500ms per resolution, with 5-second timeout per individual call. Caching reduces repeat resolutions to <1ms.

---

## 2. Current State of resolveIds

### 2.1 The Stub (lines 468-513 of ParamResolutionPipeline.ts)

```typescript
static async resolveIds(
  steps: Map<string, ResolutionStep>,
  toolkit: string
): Promise<Map<string, ResolutionStep>> {
  const resolvedSteps = new Map(steps);

  for (const [paramName, step] of resolvedSteps) {
    if (step.source === 'auto_resolved' || step.source === 'missing') continue;

    const resolverType = PARAM_TO_RESOLVER[paramName];
    if (!resolverType) continue;

    const resolver = ID_RESOLVERS[resolverType];
    if (!resolver || resolver.toolkit !== toolkit) continue;

    const originalValue = step.resolvedValue;
    if (typeof originalValue !== 'string') continue;

    if (this.looksLikeId(originalValue)) continue;

    const cacheKey = resolver.cacheKey(originalValue);
    const cached = getCachedResolution(cacheKey);
    if (cached !== null) {
      // Use cached value
      continue;
    }

    // *** STUB: Only logs, does not call Rube ***
    console.log(`[ParamResolutionPipeline] Would resolve ${paramName}: "${originalValue}" via ${resolver.searchTool}`);
  }

  return resolvedSteps;
}
```

### 2.2 Existing ID_RESOLVERS (lines 120-174)

Six resolvers are defined but none make actual API calls:

| Key | searchTool | Issue |
|-----|-----------|-------|
| `slack_channel` | `SLACK_LIST_CHANNELS` | Tool slug may not be exact Composio name |
| `googlesheets_id` | `GOOGLESHEETS_FIND_SPREADSHEET` | Tool slug likely does not exist in Composio |
| `notion_page` | `NOTION_SEARCH_PAGES` | Tool slug likely wrong -- Composio uses `NOTION_SEARCH_NOTION_PAGE` |
| `github_repo` | `GITHUB_LIST_USER_REPOS` | Tool slug likely wrong -- Composio uses `GITHUB_LIST_REPOS_FOR_AUTHENTICATED_USER` or similar |
| `trello_board` | `TRELLO_LIST_BOARDS` | May need Composio verification |
| `discord_channel` | `DISCORD_LIST_CHANNELS` | Requires guild_id context |

**Critical problem:** The searchTool values in ID_RESOLVERS were guessed, not verified against actual Composio tool slugs. We need to discover the real tool slugs for each resolution operation.

---

## 3. Resolution Strategies by Integration Type

### 3.1 Slack Channel Resolution

**User says:** "general", "#marketing-alerts", "my-team"

**Resolution strategy: List + Filter**

```
Step 1: RUBE_SEARCH_TOOLS
  Query: { use_case: "list slack channels", known_fields: "channel_name: general" }
  Session: { generate_id: true }
  Purpose: Discover the correct tool slug for listing channels
  Expected result: Tool slug like SLACK_LIST_CHANNELS or SLACK_CHANNELS_LIST

Step 2: RUBE_GET_TOOL_SCHEMAS
  tool_slugs: [discovered_slug]
  session_id: from step 1
  Purpose: Confirm input schema (does it take a search query?)

Step 3: RUBE_MULTI_EXECUTE_TOOL
  tools: [{
    tool_slug: "SLACK_LIST_CHANNELS",  // or discovered slug
    arguments: {}  // Most list operations need no arguments, or possibly { limit: 200 }
  }]
  session_id: from step 1
  memory: {}

Step 4: Client-side filter
  Parse response.data.channels (array of {id, name, ...})
  Find channel where name matches input (case-insensitive, strip # prefix)
  Return channel.id (e.g., "C0123456789")
```

**Edge cases:**
- **No match:** User typed "marketting" (typo). Apply fuzzy matching (Levenshtein distance <= 2). If still no match, return the original value and let Composio's own resolution try. Add a warning: "Could not find channel 'marketting'. Did you mean 'marketing'?"
- **Multiple matches:** "team" could match "team-engineering", "team-design", "team-sales". Return all matches with a disambiguation prompt: "Which channel? team-engineering, team-design, or team-sales?"
- **Private channels:** SLACK_LIST_CHANNELS may not return private channels the bot is not in. If no match in public channels, try SLACK_LIST_CONVERSATIONS (includes private channels the bot has joined).
- **Channel already an ID:** `looksLikeId()` catches IDs starting with C/G followed by 10+ alphanumeric chars. Skip resolution.

**Latency estimate:** 800-1500ms (search: 200ms cached / 500ms cold + execute: 300-1000ms for channel list)

### 3.2 Google Sheets Resolution

**User says:** "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit", "My Q1 Budget Sheet", or "1BxiMVs0XRA..."

**Resolution strategy: URL Parse > Name Search > Direct Pass**

```
Path A: URL Detection (ZERO API calls -- pure regex)
  Regex: /\/d\/([a-zA-Z0-9-_]+)/
  Input: "https://docs.google.com/spreadsheets/d/1BxiMVs0X.../edit"
  Output: "1BxiMVs0X..."
  Note: The TRANSFORMS.spreadsheet_url transform (line 228) already does this!
  This should be applied BEFORE resolveIds, in the findParamValues step.

Path B: Looks like an ID (20+ alphanumeric chars)
  looksLikeId() returns true. Skip resolution. Pass directly.

Path C: Human name ("My Q1 Budget Sheet")
  Step 1: RUBE_SEARCH_TOOLS
    Query: { use_case: "search google sheets spreadsheets by name" }
    Purpose: Find the correct search/list tool
    Expected: GOOGLESHEETS_LIST_SPREADSHEETS or GOOGLEDRIVE_SEARCH_FILES

  Step 2: RUBE_MULTI_EXECUTE_TOOL
    tools: [{
      tool_slug: "GOOGLEDRIVE_SEARCH_FILES",
      arguments: {
        q: "name contains 'My Q1 Budget Sheet' and mimeType='application/vnd.google-apps.spreadsheet'"
      }
    }]

  Step 3: Client-side extract
    Parse response.data.files[0].id
    Return spreadsheet_id

  Alternative approach (if no search tool exists):
    Use GOOGLESHEETS_BATCH_GET with a trial spreadsheet_id
    If it fails, the value was not a valid ID
```

**Edge cases:**
- **URL with gid parameter:** "https://...spreadsheets/d/ID/edit#gid=123" -- extract ID only, ignore gid (sheet tab). The gid could be used for `sheet_name` param separately.
- **Name matches multiple sheets:** Return the most recently modified. Or disambiguate: "Found 3 sheets matching 'Budget'. Which one? Budget 2025, Budget 2026, Budget Template?"
- **No match:** "I couldn't find a sheet called 'My Q1 Budget Sheet'. Please paste the full URL from your browser's address bar."
- **Shared sheet user cannot access:** API returns 403. Surface: "You don't have access to this sheet. Ask the owner to share it with the connected Google account."

**Latency estimate:**
- Path A (URL): 0ms (pure regex, already handled by TRANSFORMS)
- Path B (ID): 0ms (looksLikeId skip)
- Path C (name search): 1000-2500ms (search + execute)

### 3.3 Notion Page/Database Resolution

**User says:** "My Project", "Meeting Notes", "Engineering Wiki"

**Resolution strategy: Search API**

```
Step 1: RUBE_SEARCH_TOOLS
  Query: { use_case: "search notion pages by name" }
  Expected: NOTION_SEARCH_NOTION_PAGE (verified in TOOL_SLUGS line 599)

Step 2: RUBE_MULTI_EXECUTE_TOOL
  tools: [{
    tool_slug: "NOTION_SEARCH_NOTION_PAGE",
    arguments: { query: "My Project" }
  }]

Step 3: Client-side extract
  Parse response.data.results (array of Notion page objects)
  Extract first result's id
  Note: Notion IDs are 32-hex-char UUIDs (with or without dashes)
  Return page_id
```

**Edge cases:**
- **Database vs Page:** User says "my tasks database". Need to check result type. If `object === 'database'`, return as `database_id`. If `object === 'page'`, return as `page_id`. The PARAM_TO_RESOLVER maps both `page_id` and `database_id` to `notion_page` resolver -- this is correct because the search tool returns both.
- **No results:** "I couldn't find a Notion page called 'My Project'. Make sure it's shared with the connected Notion integration."
- **Multiple results:** Show top 3 with parent context: "Found multiple pages: 'My Project' in Engineering space, 'My Project' in Personal space. Which one?"
- **ID already provided:** 32 hex chars or UUID format -- `looksLikeId()` catches this. Skip resolution.

**Latency estimate:** 800-1500ms

### 3.4 Gmail / Email Resolution

**User says:** "john@gmail.com", "my email", "Send to Myself"

**Resolution strategy: Direct pass-through (NO API call needed)**

```
Path A: Valid email format
  Regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  Action: Pass directly. No resolution needed.

Path B: "me" / "myself" / "my email"
  Action: Map to {{user_email}} placeholder.
  The runtime will resolve this from the OAuth connection metadata.
  This is handled by the QuickAction "Send to Myself" in UXPatterns.

Path C: Contact name ("John Smith")
  Step 1: RUBE_SEARCH_TOOLS
    Query: { use_case: "search gmail contacts by name" }
    Expected: GMAIL_SEARCH_CONTACTS or GOOGLE_CONTACTS_SEARCH

  Step 2: RUBE_MULTI_EXECUTE_TOOL
    tools: [{
      tool_slug: "GOOGLE_CONTACTS_SEARCH",
      arguments: { query: "John Smith" }
    }]

  Step 3: Extract email from contact result
    Return first matching contact's email address

  NOTE: Contact name resolution is a STRETCH GOAL. For MVP, if the value
  is not a valid email and not "me/myself", return it as-is and let the
  API fail with a clear error. The UX should then prompt: "Please enter a
  valid email address."
```

**Edge cases:**
- **Multiple emails for contact:** "John Smith has 2 email addresses: john@work.com, john@personal.com. Which one?"
- **No contact found:** "I couldn't find a contact named 'John'. Please enter the full email address."

**Latency estimate:** 0ms for valid email, 0ms for placeholder, 800-1500ms for contact search (stretch goal)

### 3.5 GitHub Repository Resolution

**User says:** "nexus", "composio", "my-app", "facebook/react"

**Resolution strategy: Owner/Repo Parse > Authenticated User Repos Search**

```
Path A: Full owner/repo format ("facebook/react")
  Regex: /^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/
  Action: Split into owner="facebook", repo="react". Pass directly.
  No API call needed.

Path B: Repo name only ("nexus")
  Step 1: RUBE_SEARCH_TOOLS
    Query: { use_case: "list github repositories for authenticated user" }
    Expected: GITHUB_LIST_REPOS_FOR_AUTHENTICATED_USER or GITHUB_LIST_USER_REPOS

  Step 2: RUBE_MULTI_EXECUTE_TOOL
    tools: [{
      tool_slug: "GITHUB_LIST_REPOS_FOR_AUTHENTICATED_USER",
      arguments: { per_page: 100, sort: "updated" }
    }]

  Step 3: Client-side filter
    Find repo where name matches (case-insensitive)
    Return full_name (e.g., "user123/nexus")
    Also split into { owner: "user123", repo: "nexus" } for tools
    that take separate owner/repo params

Path C: Org/repo ambiguity ("composio")
  User might mean composio org, or composio repo.
  Step 1: Search authenticated user's repos first (Path B)
  Step 2: If no match, search by name:
    RUBE_MULTI_EXECUTE_TOOL with GITHUB_SEARCH_REPOSITORIES
    arguments: { query: "composio in:name" }
  Step 3: Return best match or disambiguate
```

**Edge cases:**
- **No match in user repos:** "I couldn't find a repository called 'nexus' in your GitHub account. Enter the full path like 'owner/repo-name'."
- **Multiple matches:** "Found 2 repos matching 'api': my-api (yours) and company/api (organization). Which one?"
- **Owner param vs Repo param:** GitHub tools like GITHUB_CREATE_ISSUE take separate `owner` and `repo` params. The resolver needs to return BOTH values, not just the full_name. This requires extending the ResolutionStep to support multi-value resolution.

**Multi-value resolution design:**
```typescript
// Current: resolveIds returns one value per param
resolvedSteps.set('repo', { resolvedValue: 'owner/repo', ... })

// Needed: resolveIds returns MULTIPLE params from one resolution
resolvedSteps.set('repo', { resolvedValue: 'nexus', ... })
resolvedSteps.set('owner', { resolvedValue: 'user123', source: 'auto_resolved', ... })
```

This is a design change to the current architecture. The `resolveIds` method needs the ability to INSERT new resolution steps, not just UPDATE existing ones.

**Latency estimate:** 0ms for owner/repo format, 800-2000ms for name search

### 3.6 Dropbox / OneDrive / Google Drive Path Resolution

**User says:** "Documents/reports", "/my-folder", "resume.pdf"

**Resolution strategy: Direct pass-through with normalization**

```
Action: Apply TRANSFORMS.file_path (line 282)
  Ensure path starts with /
  "/Documents/reports" -> pass directly
  "Documents/reports" -> "/Documents/reports"

No API call needed for paths. Cloud storage APIs accept path strings.
The API itself will return 404 if the path doesn't exist.
```

**Edge cases:**
- **File vs Folder ambiguity:** "documents" could be /documents (folder) or documents (file). For upload operations, treat as folder path. For download, try as file first.
- **Special characters:** Encode spaces and special chars per API requirements.

**Latency estimate:** 0ms (pure string normalization)

### 3.7 Discord Channel Resolution

**User says:** "#general", "announcements"

**Resolution strategy: List + Filter (requires guild context)**

```
IMPORTANT: Discord channels exist within guilds (servers). Unlike Slack
where channels are workspace-scoped, Discord requires a guild_id to list
channels. This means we need TWO resolution steps.

Step 1: Get Guild ID
  RUBE_MULTI_EXECUTE_TOOL with DISCORD_LIST_GUILDS (or similar)
  arguments: {}
  If user is in ONE guild: use that guild_id automatically
  If multiple guilds: ask "Which Discord server?"

Step 2: Get Channel ID
  RUBE_MULTI_EXECUTE_TOOL with DISCORD_LIST_CHANNELS
  arguments: { guild_id: resolved_guild_id }

Step 3: Client-side filter
  Find channel where name matches (strip # prefix)
  Return channel.id
```

**Edge cases:**
- **User not in any guild:** "Your Discord account isn't connected to any servers. Join a server first."
- **Bot not in guild:** "I don't have access to that Discord server. Add the Nexus bot to your server first."

**Latency estimate:** 1200-2500ms (two sequential API calls)

### 3.8 Trello Board Resolution

**User says:** "My Project Board", "Sprint Planning"

**Resolution strategy: List + Filter**

```
Step 1: RUBE_MULTI_EXECUTE_TOOL
  tools: [{
    tool_slug: "TRELLO_LIST_BOARDS",
    arguments: {}
  }]

Step 2: Client-side filter
  Find board where name matches (case-insensitive)
  Return board.id

For TRELLO_CREATE_CARD, also need list_id:
Step 3: RUBE_MULTI_EXECUTE_TOOL
  tools: [{
    tool_slug: "TRELLO_LIST_BOARD_LISTS",
    arguments: { board_id: resolved_board_id }
  }]
  Use first list or ask "Which list in the board?"
```

**Latency estimate:** 800-1500ms for board, +800-1500ms if list resolution needed

---

## 4. Toolkit Classification: ID Resolution Required vs Direct Pass-Through

### 4.1 Toolkits Requiring ID Resolution (12 of 47)

| Toolkit | Param(s) Needing Resolution | Resolution Type | Priority |
|---------|---------------------------|-----------------|----------|
| **slack** | channel -> channel_id | List + Filter | HIGH |
| **googlesheets** | spreadsheet_id | URL Parse / Name Search | HIGH |
| **notion** | page_id, database_id | Search API | HIGH |
| **github** | owner + repo (from repo name) | Authenticated Repos Search | HIGH |
| **discord** | channel -> channel_id (needs guild) | Two-step List + Filter | MEDIUM |
| **trello** | board_id, list_id | List + Filter | MEDIUM |
| **clickup** | list_id, folder_id | List + Filter | MEDIUM |
| **asana** | project_id, workspace_id | List + Filter | MEDIUM |
| **linear** | team_id, project_id | List + Filter | LOW |
| **jira** | project_key | List + Filter | LOW |
| **monday** | board_id, group_id | List + Filter | LOW |
| **airtable** | base_id, table_id | List + Filter | LOW |

### 4.2 Toolkits Accepting Direct Values (24 of 47)

| Toolkit | Why No Resolution Needed |
|---------|------------------------|
| **gmail** | Email addresses are direct values |
| **sendgrid** | Email addresses are direct values |
| **mailchimp** | Email addresses / campaign names |
| **sendinblue** | Email addresses |
| **whatsapp** | Phone numbers are direct values |
| **telegram** | Chat IDs or usernames are direct |
| **twilio** | Phone numbers are direct values |
| **teams** | Uses channel names directly (MS Graph resolves internally) |
| **zoom** | Creates new meetings (no ID resolution) |
| **googlecalendar** | Creates events, lists by date (no ID param) |
| **googledrive** | Accepts file paths or creates new |
| **dropbox** | Accepts file paths directly |
| **onedrive** | Accepts file paths directly |
| **box** | Accepts file paths directly |
| **twitter** | Creates tweets (no ID resolution) |
| **linkedin** | Creates posts (no ID resolution) |
| **instagram** | Creates posts (no ID resolution) |
| **facebook** | Creates posts (no ID resolution) |
| **stripe** | Creates customers/charges (email as input) |
| **quickbooks** | Creates invoices |
| **xero** | Creates invoices |
| **freshbooks** | Creates invoices |
| **openai** | Prompt text (no ID) |
| **anthropic** | Prompt text (no ID) |

### 4.3 Toolkits Needing Verification (11 of 47)

| Toolkit | Uncertain Param | Question |
|---------|----------------|----------|
| **hubspot** | contact_id vs email | Does HubSpot accept email directly or need contact_id? |
| **salesforce** | record_id | Create operations may not need IDs, but update/delete do |
| **pipedrive** | deal_id | Create operations may not need IDs |
| **zendesk** | ticket_id (for updates) | Only needed for update, not create |
| **freshdesk** | ticket_id (for updates) | Only needed for update, not create |
| **intercom** | conversation_id | Only needed for replies |
| **helpscout** | conversation_id | Only needed for replies |
| **shopify** | product_id (for updates) | Only needed for update |
| **woocommerce** | product_id (for updates) | Only needed for update |
| **square** | customer_id | May accept email directly |
| **calendly** | event_type_uuid | May need resolution from name |

**Recommendation:** For these 11, implement as direct pass-through for create operations (most common in workflows). Add resolution only for update/delete operations in a future iteration.

---

## 5. Resolution Priority Algorithm

When a human-friendly value arrives, apply resolution strategies in this order:

```
Priority 1: URL PARSING (0ms, zero API calls)
  - Google Sheets URL -> spreadsheet_id (regex)
  - Notion URL -> page_id (regex)
  - GitHub URL -> owner/repo (regex)
  - Trello URL -> board_id (regex)

Priority 2: FORMAT DETECTION (0ms, zero API calls)
  - Email format -> pass directly
  - Phone format -> pass directly
  - UUID/ID format -> looksLikeId() -> pass directly
  - File path format -> normalize and pass

Priority 3: CACHE LOOKUP (< 1ms)
  - Check resolutionCache (5-min TTL)
  - If hit, return cached ID

Priority 4: NAME-TO-ID API RESOLUTION (800-2500ms)
  - Call appropriate list/search tool
  - Filter results client-side
  - If exactly 1 match: resolve automatically
  - If 0 matches: return original value + warning
  - If 2+ matches: return disambiguation prompt

Priority 5: FUZZY SEARCH (1000-3000ms, only if Priority 4 returns 0 matches)
  - Apply Levenshtein distance matching
  - Suggest closest match: "Did you mean 'marketing'?"

Priority 6: ASK USER (Infinity -- blocks execution)
  - Return as missing param with user-friendly prompt
  - "I couldn't find a Slack channel called 'xyz'. Which channel should I use?"
```

---

## 6. Concrete Implementation Design

### 6.1 New Resolver Interface

The current `IdResolver` interface needs expansion:

```typescript
interface IdResolver {
  toolkit: string;
  // Discovery phase
  discoveryQuery: string;         // Natural language for RUBE_SEARCH_TOOLS
  fallbackToolSlug: string;       // Tool slug to try if discovery fails
  // Execution phase
  buildArguments: (input: string) => Record<string, unknown>;
  // Result extraction
  extractResults: (response: unknown) => Array<{ id: string; name: string; extra?: Record<string, unknown> }>;
  // Matching
  matchStrategy: 'exact' | 'fuzzy' | 'contains';
  // Multi-value support (e.g., GitHub owner + repo)
  additionalParams?: (match: { id: string; name: string; extra?: Record<string, unknown> }) => Record<string, unknown>;
  // Cache
  cacheKey: (input: string) => string;
  cacheTTL?: number;  // Override default 5-min TTL
}
```

### 6.2 Revised ID_RESOLVERS

```typescript
const ID_RESOLVERS: Record<string, IdResolver> = {
  slack_channel: {
    toolkit: 'slack',
    discoveryQuery: 'list slack channels',
    fallbackToolSlug: 'SLACK_LIST_CHANNELS',
    buildArguments: () => ({}),  // No args needed for listing
    extractResults: (response: unknown) => {
      const data = (response as any)?.data || response;
      const channels = data?.channels || data?.data?.channels || [];
      return channels.map((ch: any) => ({
        id: ch.id,
        name: ch.name || ch.name_normalized,
        extra: { is_private: ch.is_private, num_members: ch.num_members }
      }));
    },
    matchStrategy: 'fuzzy',
    cacheKey: (name) => `slack_channel_${name.toLowerCase().replace('#', '')}`,
    cacheTTL: 5 * 60 * 1000,
  },

  googlesheets_id: {
    toolkit: 'googlesheets',
    discoveryQuery: 'search google drive files by name spreadsheet',
    fallbackToolSlug: 'GOOGLEDRIVE_SEARCH_FILES',
    buildArguments: (input: string) => ({
      q: `name contains '${input}' and mimeType='application/vnd.google-apps.spreadsheet'`,
      pageSize: 10
    }),
    extractResults: (response: unknown) => {
      const data = (response as any)?.data || response;
      const files = data?.files || data?.data?.files || [];
      return files.map((f: any) => ({
        id: f.id,
        name: f.name,
        extra: { webViewLink: f.webViewLink, modifiedTime: f.modifiedTime }
      }));
    },
    matchStrategy: 'contains',
    cacheKey: (input) => `gsheet_${input.substring(0, 50).toLowerCase()}`,
    cacheTTL: 10 * 60 * 1000,  // Sheets don't change names often
  },

  notion_page: {
    toolkit: 'notion',
    discoveryQuery: 'search notion pages',
    fallbackToolSlug: 'NOTION_SEARCH_NOTION_PAGE',
    buildArguments: (input: string) => ({ query: input }),
    extractResults: (response: unknown) => {
      const data = (response as any)?.data || response;
      const results = data?.results || data?.data?.results || [];
      return results.map((r: any) => ({
        id: r.id,
        name: r.properties?.title?.title?.[0]?.plain_text ||
              r.properties?.Name?.title?.[0]?.plain_text ||
              r.title?.[0]?.plain_text ||
              'Untitled',
        extra: { object: r.object, url: r.url }
      }));
    },
    matchStrategy: 'contains',
    cacheKey: (name) => `notion_page_${name.toLowerCase()}`,
  },

  github_repo: {
    toolkit: 'github',
    discoveryQuery: 'list github repositories for authenticated user',
    fallbackToolSlug: 'GITHUB_LIST_REPOS_FOR_AUTHENTICATED_USER',
    buildArguments: () => ({ per_page: 100, sort: 'updated' }),
    extractResults: (response: unknown) => {
      const data = (response as any)?.data || response;
      const repos = data?.repositories || data?.data || [];
      return (Array.isArray(repos) ? repos : []).map((r: any) => ({
        id: r.full_name || `${r.owner?.login}/${r.name}`,
        name: r.name,
        extra: { owner: r.owner?.login, full_name: r.full_name }
      }));
    },
    matchStrategy: 'exact',  // Repo names must match exactly
    additionalParams: (match) => ({
      // GitHub tools take separate owner and repo params
      owner: match.extra?.owner || match.id.split('/')[0],
      repo: match.name
    }),
    cacheKey: (name) => `github_repo_${name.toLowerCase()}`,
    cacheTTL: 10 * 60 * 1000,
  },

  trello_board: {
    toolkit: 'trello',
    discoveryQuery: 'list trello boards',
    fallbackToolSlug: 'TRELLO_LIST_BOARDS',
    buildArguments: () => ({}),
    extractResults: (response: unknown) => {
      const data = (response as any)?.data || response;
      const boards = data?.boards || data?.data?.boards || [];
      return boards.map((b: any) => ({
        id: b.id,
        name: b.name,
        extra: { url: b.url, closed: b.closed }
      }));
    },
    matchStrategy: 'fuzzy',
    cacheKey: (name) => `trello_board_${name.toLowerCase()}`,
  },

  discord_channel: {
    toolkit: 'discord',
    discoveryQuery: 'list discord guild channels',
    fallbackToolSlug: 'DISCORD_LIST_CHANNELS',
    buildArguments: (_input: string) => {
      // NOTE: Requires guild_id. In practice, this will need a two-phase approach.
      // Phase 1: List guilds, pick the user's primary guild.
      // Phase 2: List channels within that guild.
      // For MVP: return empty args and handle the error.
      return {};
    },
    extractResults: (response: unknown) => {
      const data = (response as any)?.data || response;
      const channels = data?.channels || data?.data?.channels || [];
      return channels.map((ch: any) => ({
        id: ch.id,
        name: ch.name,
        extra: { type: ch.type, guild_id: ch.guild_id }
      }));
    },
    matchStrategy: 'fuzzy',
    cacheKey: (name) => `discord_channel_${name.toLowerCase()}`,
  }
};
```

### 6.3 The resolveIds Implementation

```typescript
static async resolveIds(
  steps: Map<string, ResolutionStep>,
  toolkit: string,
  sessionId?: string  // NEW: Pass session for Rube calls
): Promise<Map<string, ResolutionStep>> {
  const resolvedSteps = new Map(steps);

  for (const [paramName, step] of resolvedSteps) {
    // Skip already-resolved, missing, or non-string values
    if (step.source === 'auto_resolved' || step.source === 'missing') continue;
    const resolverType = PARAM_TO_RESOLVER[paramName];
    if (!resolverType) continue;
    const resolver = ID_RESOLVERS[resolverType];
    if (!resolver || resolver.toolkit !== toolkit) continue;
    const originalValue = step.resolvedValue;
    if (typeof originalValue !== 'string') continue;

    // Priority 1: URL parsing (handled by TRANSFORMS before this point)
    // Priority 2: Format detection
    if (this.looksLikeId(originalValue)) continue;

    // Priority 3: Cache lookup
    const cacheKey = resolver.cacheKey(originalValue);
    const cached = getCachedResolution(cacheKey);
    if (cached !== null) {
      resolvedSteps.set(paramName, {
        ...step,
        source: 'auto_resolved',
        resolvedValue: cached,
        wasTransformed: true,
        transformType: 'id_resolution_cached'
      });
      continue;
    }

    // Priority 4: API resolution
    try {
      const resolvedId = await this.callResolver(
        resolver, originalValue, sessionId
      );

      if (resolvedId.match) {
        // Single match -- auto-resolve
        setCachedResolution(cacheKey, resolvedId.match.id);
        resolvedSteps.set(paramName, {
          ...step,
          source: 'auto_resolved',
          resolvedValue: resolvedId.match.id,
          wasTransformed: true,
          transformType: 'id_resolution'
        });

        // Handle multi-value resolution (e.g., GitHub owner + repo)
        if (resolver.additionalParams) {
          const extraParams = resolver.additionalParams(resolvedId.match);
          for (const [extraKey, extraValue] of Object.entries(extraParams)) {
            if (!resolvedSteps.has(extraKey) ||
                resolvedSteps.get(extraKey)?.source === 'missing') {
              resolvedSteps.set(extraKey, {
                paramName: extraKey,
                displayName: extraKey,
                source: 'auto_resolved',
                originalValue: originalValue,
                resolvedValue: extraValue,
                wasTransformed: true,
                transformType: 'id_resolution_derived',
                required: false
              });
            }
          }
        }
      } else if (resolvedId.ambiguous && resolvedId.ambiguous.length > 1) {
        // Multiple matches -- add warning for disambiguation
        console.log(`[resolveIds] Ambiguous: "${originalValue}" matched ${resolvedId.ambiguous.length} items`);
        // Keep original value, add warning
        // The UI layer should present disambiguation to user
      }
      // If no match: keep original value, let API try it
    } catch (error) {
      // Resolution failed -- keep original value, do not block execution
      console.warn(`[resolveIds] Failed to resolve ${paramName}="${originalValue}":`, error);
    }
  }

  return resolvedSteps;
}

/**
 * Execute the actual Rube MCP call for ID resolution
 */
private static async callResolver(
  resolver: IdResolver,
  input: string,
  sessionId?: string
): Promise<{
  match?: { id: string; name: string; extra?: Record<string, unknown> };
  ambiguous?: Array<{ id: string; name: string }>;
}> {
  const TIMEOUT_MS = 5000;

  // Build arguments for the tool call
  const args = resolver.buildArguments(input);

  // Execute via rubeClient (frontend) or direct API call (backend)
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const result = await rubeClient.executeTool(
      resolver.fallbackToolSlug,
      args
    );

    clearTimeout(timeout);

    if (!result.success) {
      console.warn(`[resolveIds] Tool execution failed: ${result.error}`);
      return {};
    }

    // Extract results from response
    const candidates = resolver.extractResults(result.data);

    if (candidates.length === 0) {
      return {};
    }

    // Apply matching strategy
    const normalizedInput = input.toLowerCase().replace(/^#/, '').trim();

    // Exact match first
    const exact = candidates.find(c => c.name.toLowerCase() === normalizedInput);
    if (exact) {
      return { match: exact };
    }

    // Contains match
    if (resolver.matchStrategy === 'contains' || resolver.matchStrategy === 'fuzzy') {
      const contains = candidates.filter(c =>
        c.name.toLowerCase().includes(normalizedInput) ||
        normalizedInput.includes(c.name.toLowerCase())
      );
      if (contains.length === 1) {
        return { match: contains[0] };
      }
      if (contains.length > 1) {
        return { ambiguous: contains };
      }
    }

    // Fuzzy match (Levenshtein)
    if (resolver.matchStrategy === 'fuzzy') {
      const fuzzy = candidates
        .map(c => ({
          ...c,
          distance: levenshteinDistance(c.name.toLowerCase(), normalizedInput)
        }))
        .filter(c => c.distance <= 2)  // Max 2 char difference
        .sort((a, b) => a.distance - b.distance);

      if (fuzzy.length >= 1) {
        return { match: fuzzy[0] };
      }
    }

    return {};
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}
```

---

## 7. Latency Budget Analysis

### 7.1 Per-Resolution-Type Latency

| Resolution Type | P50 Latency | P95 Latency | API Calls |
|----------------|-------------|-------------|-----------|
| URL parsing | < 1ms | < 1ms | 0 |
| Email validation | < 1ms | < 1ms | 0 |
| looksLikeId skip | < 1ms | < 1ms | 0 |
| Cache hit | < 1ms | < 5ms | 0 |
| Path normalization | < 1ms | < 1ms | 0 |
| Slack channel | 600ms | 1500ms | 1 |
| Google Sheets (name) | 800ms | 2500ms | 1 |
| Notion page | 600ms | 1500ms | 1 |
| GitHub repo | 800ms | 2000ms | 1 |
| Discord channel | 1200ms | 2500ms | 2 |
| Trello board | 600ms | 1500ms | 1 |

### 7.2 Workflow-Level Latency Impact

For a typical 3-step workflow (e.g., Gmail trigger -> process -> Slack send):
- Step 1 (Gmail trigger): email param -> 0ms (direct pass)
- Step 2 (process): no resolution needed -> 0ms
- Step 3 (Slack send): channel param -> 600ms (API call, first time) or 0ms (cached)

**Total overhead:** 0-600ms for first execution, 0ms for subsequent executions (cached).

For a complex workflow with 5 steps needing resolution:
- Worst case: 5 x 1500ms = 7500ms (serial)
- With parallelization: ~2000ms (batch all resolutions)

**Recommendation:** Batch all resolutions for a workflow into a single phase BEFORE step-by-step execution begins. This avoids serial latency accumulation.

### 7.3 Parallelization Strategy

```typescript
// Instead of resolving per-node during execution:
for (const node of nodes) {
  await resolveIds(nodeParams, toolkit);  // SERIAL: 600ms per node
}

// Pre-resolve ALL nodes before execution:
const resolutionPromises = nodes.map(node =>
  resolveIds(nodeParams, toolkit)  // PARALLEL: all at once
);
await Promise.all(resolutionPromises);  // Total: ~max single resolution time
```

This parallelization should happen in the pre-flight phase, not during `executeWorkflow`.

---

## 8. Error Handling Design

### 8.1 Error Classification

| Error Type | Severity | User Message | Action |
|-----------|----------|-------------|--------|
| Tool not found in Rube | Warning | (silent -- pass original value) | Fallback to direct pass |
| API timeout (5s) | Warning | (silent -- pass original value) | Fallback to direct pass |
| No match found | Info | "Could not find '{name}'. Using as-is." | Pass original, may fail at execution |
| Multiple matches | Blocking | "Found multiple matches. Which one?" | Present disambiguation UI |
| Connection not active | Blocking | "Please connect {toolkit} first" | Redirect to OAuth flow |
| Rate limited | Warning | (silent -- add 1s delay) | Retry after backoff |

### 8.2 Graceful Degradation

The golden rule: **resolveIds must NEVER block execution or make things worse than the current stub behavior.**

```
If resolution succeeds: Use resolved ID (better than current)
If resolution fails:    Keep original value (same as current)
If resolution times out: Keep original value (same as current)
If Rube unavailable:    Keep original value (same as current)
```

The only case where resolution can "block" is disambiguation (multiple matches). Even then, the system should have a default behavior: pick the first/most recent match and add a warning.

### 8.3 Disambiguation UI Integration

When resolveIds returns ambiguous results, the UI needs to present choices. This integrates with the existing pre-flight question system:

```typescript
// In the pre-flight phase, after resolveIds:
if (resolutionResult.ambiguous) {
  // Generate a pre-flight question
  preFlightQuestions.push({
    id: `resolve_${paramName}`,
    nodeId: node.id,
    label: `Which ${humanize(paramName)}?`,
    type: 'select',
    options: resolutionResult.ambiguous.map(a => ({
      value: a.id,
      label: a.name
    })),
    required: true
  });
}
```

---

## 9. Session ID Threading

### 9.1 Current Problem

The `resolveIds` method does not receive a Rube session ID. The current signature is:
```typescript
static async resolveIds(steps, toolkit)
```

But all Rube MCP operations require a `session_id`. The existing orchestration layer manages sessions via `GenericToolDiscovery` which stores `sessionId` on its instance.

### 9.2 Solution

Thread the session ID through the resolution pipeline:

```
WorkflowPreviewCard.executeWorkflow
  -> gets sessionId from orchestrationResults or rubeClient.getSessionId()
  -> passes to resolveParamsWithPipeline(toolSlug, toolkit, node, collectedParams, workflowContext, sessionId)
    -> passes to ParamResolutionPipeline.resolve(contract, sources, sessionId)
      -> passes to resolveIds(steps, toolkit, sessionId)
        -> passes to rubeClient.executeTool() which uses the session
```

This requires adding `sessionId?: string` parameter to:
1. `resolve()` method (main entry point)
2. `resolveIds()` method (the one making API calls)
3. `resolveParamsWithPipeline()` wrapper in WorkflowPreviewCard

---

## 10. Implementation Phases

### Phase 1: MVP (4 hours) -- HIGH PRIORITY resolvers only

Implement actual API calls for the 4 most common integrations:
1. **Slack channel** resolution (covers "Post to Slack" workflows)
2. **Google Sheets URL/name** resolution (covers "Save to Sheet" workflows)
3. **Notion page** resolution (covers "Add to Notion" workflows)
4. **GitHub repo** resolution (covers "Track GitHub Issues" workflows)

### Phase 2: Extended Coverage (3 hours)

Add resolvers for:
5. **Discord channel** (two-step with guild)
6. **Trello board + list** (two-step)
7. **ClickUp list** resolution
8. **Asana project** resolution

### Phase 3: Advanced (2 hours)

Add:
9. **Fuzzy matching** with Levenshtein distance
10. **Disambiguation UI** integration with pre-flight
11. **Batch parallelization** of multi-node resolution
12. **Contact name to email** resolution for Gmail (stretch)

### Phase 4: Observability (1 hour)

Add:
13. Resolution success/failure metrics
14. Cache hit rate tracking
15. Latency measurement per resolver
16. Dashboard showing resolution statistics

---

## 11. Dependency on Other Improvements

| Dependency | Why Needed | Status |
|-----------|-----------|--------|
| **Rank 2: Security hardening** | resolveIds makes authenticated API calls that should go through rate-limited endpoints | Agent 9 designing |
| **Rank 5: Phase 1-2 WPC extraction** | Clean insertion point for the resolver wiring | Agent 4 designing |
| **Rank 6: Pipeline wiring (Phase A+B)** | resolveIds only runs if pipeline is wired in | My Cycle 2 design |
| **PARAM_ALIASES consolidation** | Ensures consistent param-to-resolver mapping | Part of Phase D |
| **Session ID availability** | Rube calls need session_id from orchestration | Available via orchestrationResults |

**Recommended sequence:**
1. Pipeline wiring (Phase A+B) -- enables the resolve path
2. Security hardening -- protects the API calls
3. resolveIds MVP (this design, Phase 1) -- actual API calls for top 4 toolkits
4. PARAM_ALIASES consolidation -- ensures consistency
5. resolveIds extended coverage (Phase 2-3)

---

## 12. Verified Tool Slugs vs Assumed Tool Slugs

### 12.1 Verified (from TOOL_SLUGS in WorkflowPreviewCard)

These slugs are confirmed to work with Composio/Rube:

| Tool Slug | Action | Verified |
|-----------|--------|----------|
| `SLACK_LIST_CHANNELS` | List channels | YES (line 453) |
| `NOTION_SEARCH_NOTION_PAGE` | Search pages | YES (line 599) |
| `GITHUB_LIST_REPOSITORY_ISSUES` | List issues | YES (line 551) |
| `TRELLO_GET_BOARD_CARDS` | List cards | YES (line 612) |

### 12.2 Assumed (need verification via RUBE_SEARCH_TOOLS)

| Assumed Slug | Purpose | Verification Needed |
|-------------|---------|-------------------|
| `GOOGLEDRIVE_SEARCH_FILES` | Search Sheets by name | Needs discovery |
| `GITHUB_LIST_REPOS_FOR_AUTHENTICATED_USER` | List user repos | Needs discovery |
| `DISCORD_LIST_CHANNELS` | List Discord channels | Needs discovery |
| `DISCORD_LIST_GUILDS` | List Discord servers | Needs discovery |
| `TRELLO_LIST_BOARDS` | List Trello boards | Needs discovery |
| `TRELLO_LIST_BOARD_LISTS` | List lists in board | Needs discovery |
| `CLICKUP_GET_FOLDERS` | List ClickUp folders | Exists (line 565) |
| `ASANA_GET_TASKS` | List Asana tasks | Exists (line 617) |

### 12.3 Verification Protocol

Before implementing each resolver, execute this verification sequence:

```
1. RUBE_SEARCH_TOOLS with query matching the action
2. Verify returned tool_slug matches our assumption
3. RUBE_GET_TOOL_SCHEMAS to confirm input/output schema
4. Test with RUBE_MULTI_EXECUTE_TOOL and sample data
5. Document the verified slug in ID_RESOLVERS
```

This verification MUST happen at development time, not runtime. We should not discover tool slugs on every user request.

---

## 13. Summary

**Core insight:** ID resolution is only needed for 12 of 47 toolkits. The majority accept human-readable values directly. The implementation should prioritize the 4 highest-frequency resolution types (Slack, Google Sheets, Notion, GitHub) which cover 80%+ of workflow scenarios.

**Architecture:** The resolution follows a strict priority chain: URL parsing (0ms) > format detection (0ms) > cache (0ms) > API call (800-2500ms) > fuzzy match (1000-3000ms) > ask user. The fallback is always to keep the original value, ensuring resolveIds never makes things worse.

**Key design change:** The `resolveIds` method needs a `sessionId` parameter, and the `IdResolver` interface needs expansion to support multi-value resolution (GitHub owner+repo from a single repo name).

**Estimated implementation:** 4 hours for MVP (top 4 toolkits), 10 total hours for full coverage including disambiguation UI and observability.
