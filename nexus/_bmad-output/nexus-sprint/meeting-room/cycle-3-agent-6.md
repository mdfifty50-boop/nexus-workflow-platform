# Cycle 3 - Agent 6: Memory Analyst Report
## Conversation Persistence Architecture Design

**Date:** 2026-02-15
**Mission:** Design complete IndexedDB schema, localStorage migration, and cross-device sync strategy.

---

## 1. Current State Audit

### 1.1 Existing Storage Landscape

The codebase has **four separate storage mechanisms** in varying states of maturity:

| Layer | File | Purpose | Backend |
|-------|------|---------|---------|
| `StorageManager` | `src/lib/state-persistence.ts` | General-purpose persistence abstraction | localStorage / sessionStorage / in-memory |
| `ChatPersistenceService` | `src/services/ChatPersistenceService.ts` | Dual-write chat sessions (localStorage + Supabase cloud) | localStorage + Supabase via server API |
| `UserMemoryService` | `src/services/UserMemoryService.ts` | Aggregates all user data into AI-ready context string | Read-only aggregator over 7 localStorage sources |
| `UserContextService` | `src/services/UserContextService.ts` | Auto-inference engine with cloud sync | localStorage + server API |

### 1.2 localStorage Keys Inventory (Comprehensive)

**Chat & Conversations:**
- `nexus-chat-sessions` -- Full session array with messages (heaviest key)
- `nexus-current-session` -- Current active session ID
- `nexus-chat-sync-status` -- Last cloud sync timestamp
- `nexus_conversations` -- Legacy AgentChatbot conversations (separate from chat sessions)

**User Profile & Business:**
- `nexus_business_profile` -- Onboarding wizard output (industry, role, priorities)
- `nexus_user_context` -- Auto-inferred context (emails, channels, regional defaults)
- `nexus_profile` -- AccountSettings profile data
- `nexus_onboarding_wizard_completed` -- Boolean flag

**Workflows:**
- `nexus-user-workflows` -- Full workflow array with specs
- `nexus_memory_events` -- Event log (last 200 events with types and timestamps)

**Preferences & UI:**
- `nexus_theme`, `nexus_fontSize`, `nexus_density`, `nexus_accentColor`
- `nexus_dismissed_suggestions`
- `nexus-user-preferences`, `i18nextLng`

**StorageManager Wrapped Keys (nexus_ prefix):**
- `user_preferences`, `theme`, `sidebar_collapsed`, `persona`, `custom_persona_label`
- `onboarding_complete`, `user_goal`, `connected_integrations`
- `chatbot_open`, `chatbot_messages`, `chatbot_state`, `chatbot_intent`, `chatbot_info`
- `chatbot_questions`, `chatbot_question_index`, `chatbot_user_id`
- `active_workflow_id`, `pending_workflow`, `workflow_drafts`, `recent_workflows`
- `session_token`, `last_activity`, `template_cache`, `integration_cache`

### 1.3 Existing Supabase Schema

Already deployed (migration `20260204_001`):

```sql
chat_conversations (id TEXT PK, clerk_user_id TEXT, title TEXT, created_at, updated_at)
chat_messages (id TEXT PK, conversation_id TEXT FK, role TEXT, content TEXT, embedded_content JSONB, created_at)
```

Also deployed (migration `20260215_001`):

```sql
user_business_profiles (clerk_user_id TEXT PK, business_name, industry, company_size, ...)
user_contexts (clerk_user_id TEXT PK, context_data JSONB, ...)
```

### 1.4 Current NexusAIService Conversation History

`NexusAIService` maintains an **in-memory** `conversationHistory: ChatMessage[]` array, trimmed to the last 10 messages. This is completely separate from the persisted chat sessions -- it is ephemeral and lost on page reload. The `useChatState` hook manages the persistent sessions but the AI service does not read from them.

**Gap identified:** There is no mechanism connecting the persisted sessions back into the AI conversation context on session resume. When a user reloads the page and picks a session, the AI has no memory of that conversation.

### 1.5 Identified Problems with Current Approach

| Problem | Severity | Detail |
|---------|----------|--------|
| **localStorage 5MB limit** | P0 | Chat sessions with embedded workflow specs will hit the limit at ~200-500 conversations. Each message averages 500-2000 bytes; workflow specs can be 2-5KB each. |
| **Blocking JSON.parse** | P1 | `loadSessionsFromStorage()` does `JSON.parse(localStorage.getItem('nexus-chat-sessions'))` which blocks the main thread. At 500+ conversations this causes 100-300ms jank. |
| **No entity extraction persistence** | P1 | `UserMemoryService.loadChatHistory()` counts sessions but never indexes entities from messages. Mentioned emails/channels come only from `nexus_user_context`, not from conversation mining. |
| **Duplicate storage paths** | P2 | `nexus_conversations` (AgentChatbot) vs `nexus-chat-sessions` (useChatState) -- two parallel conversation stores. |
| **No full-text search** | P2 | Users cannot search past conversations. localStorage offers no indexing. |
| **AI context gap** | P1 | `NexusAIService.conversationHistory` is ephemeral; resuming a session does not restore AI context. |

---

## 2. IndexedDB Schema Design

### 2.1 Database: `nexus-db`, Version 1

```typescript
// Database name: 'nexus-db'
// Version: 1

interface NexusDBSchema {
  conversations: ConversationRecord
  messages: MessageRecord
  entities: EntityRecord
  workflows: WorkflowRecord
  syncQueue: SyncQueueRecord
}
```

### 2.2 Store: `conversations`

```typescript
interface ConversationRecord {
  // Key path: 'id'
  id: string                    // e.g. "1708012345678-abc123x"
  userId: string                // Clerk user ID or 'local-anonymous'
  title: string                 // Auto-generated from first user message
  messageCount: number          // Denormalized for sidebar display
  firstMessagePreview: string   // First 100 chars of first user message
  lastMessagePreview: string    // First 100 chars of last message
  createdAt: number             // Unix timestamp (ms) -- indexed
  lastMessageAt: number         // Unix timestamp (ms) -- indexed, primary sort
  syncedAt: number | null       // Last successful Supabase sync timestamp
  syncStatus: 'synced' | 'pending' | 'conflict' | 'local-only'
  metadata: {
    integrations: string[]      // Integrations mentioned in this conversation
    hasWorkflow: boolean        // Quick filter: does this conversation contain workflows?
    tags: string[]              // User or auto-applied tags
    source: 'chat' | 'agent-chatbot' | 'migrated'  // Origin of conversation
  }
}

// Indexes:
// - 'userId'          -- Filter by user
// - 'lastMessageAt'   -- Sort conversations (most recent first)
// - 'syncStatus'      -- Find unsynced records
// - ['userId', 'lastMessageAt'] -- Compound: user's recent conversations
```

### 2.3 Store: `messages`

```typescript
interface MessageRecord {
  // Key path: 'id'
  id: string                         // e.g. "1708012345999-xyz789w"
  conversationId: string             // Foreign key to conversations store
  role: 'user' | 'assistant' | 'system'
  content: string                    // Message text
  timestamp: number                  // Unix timestamp (ms) -- indexed

  // Optional rich content
  workflowSpec: WorkflowSpec | null  // Embedded workflow specification
  embeddedContent: unknown[] | null  // Other embedded content (templates, etc.)

  // Entity extraction results (populated by background extraction)
  extractedEntities: ExtractedEntity[] | null

  // Sync metadata
  syncedAt: number | null
}

interface ExtractedEntity {
  type: 'email' | 'channel' | 'app' | 'date' | 'person' | 'url'
  value: string
  confidence: number  // 0-1
}

// Indexes:
// - 'conversationId'                -- Get all messages for a conversation
// - ['conversationId', 'timestamp'] -- Messages in order within a conversation
// - 'timestamp'                     -- Global message timeline
```

### 2.4 Store: `entities`

```typescript
interface EntityRecord {
  // Key path: 'id' (auto-increment)
  id?: number                   // Auto-generated
  userId: string                // Which user this entity belongs to
  type: 'email' | 'slack_channel' | 'person' | 'app' | 'spreadsheet' | 'repository' | 'url'
  value: string                 // The entity value (e.g. "john@company.com")
  displayName: string | null    // Human-friendly name (e.g. "John Doe")
  extractedFrom: string         // Conversation ID where first seen
  firstSeenAt: number           // Unix timestamp
  lastSeenAt: number            // Unix timestamp
  frequency: number             // How many times mentioned
  confidence: number            // 0-1, averaged across extractions
  context: string | null        // Short context snippet showing how it was used

  // Sync
  syncedAt: number | null
}

// Indexes:
// - 'userId'                   -- All entities for a user
// - ['userId', 'type']         -- Filter by entity type
// - ['userId', 'frequency']    -- Most mentioned entities
// - ['userId', 'lastSeenAt']   -- Recently referenced entities
// - 'value'                    -- Look up by value (for dedup)
```

### 2.5 Store: `workflows`

```typescript
interface WorkflowRecord {
  // Key path: 'id'
  id: string                    // e.g. "workflow-1708012345678"
  conversationId: string | null // Which conversation generated it (nullable for standalone)
  userId: string
  name: string
  description: string
  spec: WorkflowSpec            // Full workflow specification
  status: 'draft' | 'ready' | 'executed' | 'failed' | 'archived'
  executedAt: number | null
  executionResult: unknown | null
  requiredIntegrations: string[]
  estimatedTimeSaved: string
  createdAt: number
  updatedAt: number

  // Sync
  syncedAt: number | null
}

// Indexes:
// - 'userId'                    -- All workflows for a user
// - 'conversationId'            -- Find workflow from conversation
// - ['userId', 'status']        -- Filter by status
// - ['userId', 'updatedAt']     -- Sort by recent
```

### 2.6 Store: `syncQueue`

```typescript
interface SyncQueueRecord {
  // Key path: 'id' (auto-increment)
  id?: number
  store: 'conversations' | 'messages' | 'entities' | 'workflows'
  recordId: string
  operation: 'upsert' | 'delete'
  payload: unknown              // The data to sync
  createdAt: number
  attempts: number              // Retry count
  lastError: string | null
  status: 'pending' | 'in-flight' | 'failed'
}

// Indexes:
// - 'status'                    -- Find pending items to sync
// - ['store', 'recordId']       -- Find queue entry for specific record
```

---

## 3. Migration Strategy: localStorage to IndexedDB

### 3.1 Migration Flow

```
App Boot
  |
  v
[1] Check: Does IndexedDB 'nexus-db' exist?
  |
  +--> YES: Open db, proceed normally
  |
  +--> NO (first run or fresh install):
         |
         v
       [2] Check: Does localStorage have nexus data?
         |
         +--> YES: Run migration pipeline
         |         |
         |         v
         |       [2a] Open/create IndexedDB 'nexus-db' v1
         |         |
         |         v
         |       [2b] Migrate 'nexus-chat-sessions' --> conversations + messages stores
         |         |
         |         v
         |       [2c] Migrate 'nexus_conversations' --> conversations + messages (source: 'agent-chatbot')
         |         |
         |         v
         |       [2d] Migrate 'nexus-user-workflows' --> workflows store
         |         |
         |         v
         |       [2e] Migrate 'nexus_user_context' entities --> entities store
         |         |
         |         v
         |       [2f] Migrate 'nexus_memory_events' --> extract entities from event log
         |         |
         |         v
         |       [2g] Set localStorage flag: 'nexus_idb_migration_v1' = timestamp
         |         |
         |         v
         |       [2h] Clear migrated localStorage keys (keep preferences/theme)
         |
         +--> NO: Fresh install, just open IndexedDB
```

### 3.2 Migration Code Pattern

```typescript
const MIGRATION_FLAG = 'nexus_idb_migration_v1'

async function runMigrationIfNeeded(db: IDBDatabase): Promise<void> {
  // Skip if already migrated
  if (localStorage.getItem(MIGRATION_FLAG)) return

  const tx = db.transaction(
    ['conversations', 'messages', 'workflows', 'entities'],
    'readwrite'
  )

  // --- Migrate chat sessions ---
  const rawSessions = localStorage.getItem('nexus-chat-sessions')
  if (rawSessions) {
    const sessions: ChatSession[] = JSON.parse(rawSessions)
    const convStore = tx.objectStore('conversations')
    const msgStore = tx.objectStore('messages')

    for (const session of sessions) {
      // Write conversation record
      convStore.put({
        id: session.id,
        userId: 'local-anonymous',  // Will be updated when user authenticates
        title: session.title,
        messageCount: session.messages.length,
        firstMessagePreview: session.messages[0]?.content?.substring(0, 100) || '',
        lastMessagePreview: session.messages[session.messages.length - 1]?.content?.substring(0, 100) || '',
        createdAt: new Date(session.createdAt).getTime(),
        lastMessageAt: new Date(session.updatedAt).getTime(),
        syncedAt: null,
        syncStatus: 'local-only',
        metadata: {
          integrations: [],
          hasWorkflow: session.messages.some(m => m.embeddedContent?.length),
          tags: [],
          source: 'migrated'
        }
      })

      // Write individual messages
      for (const msg of session.messages) {
        msgStore.put({
          id: msg.id,
          conversationId: session.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp).getTime(),
          workflowSpec: null,
          embeddedContent: msg.embeddedContent || null,
          extractedEntities: null,
          syncedAt: null
        })
      }
    }
  }

  // --- Migrate workflows ---
  const rawWorkflows = localStorage.getItem('nexus-user-workflows')
  if (rawWorkflows) {
    const workflows = JSON.parse(rawWorkflows)
    const wfStore = tx.objectStore('workflows')
    for (const wf of workflows) {
      wfStore.put({
        id: wf.id || `workflow-migrated-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        conversationId: null,
        userId: 'local-anonymous',
        name: wf.name || 'Unnamed Workflow',
        description: wf.description || '',
        spec: wf.spec || wf,
        status: wf.status || 'draft',
        executedAt: wf.executedAt ? new Date(wf.executedAt).getTime() : null,
        executionResult: null,
        requiredIntegrations: wf.requiredIntegrations || wf.integrations || [],
        estimatedTimeSaved: wf.estimatedTimeSaved || 'Unknown',
        createdAt: wf.createdAt ? new Date(wf.createdAt).getTime() : Date.now(),
        updatedAt: wf.updatedAt ? new Date(wf.updatedAt).getTime() : Date.now(),
        syncedAt: null
      })
    }
  }

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })

  // Mark migration complete
  localStorage.setItem(MIGRATION_FLAG, new Date().toISOString())

  // Clear migrated keys (keep UI preferences)
  const keysToRemove = [
    'nexus-chat-sessions',
    'nexus-current-session',
    'nexus_conversations',
    'nexus-user-workflows',
    'nexus_memory_events',
    // Keep: nexus_business_profile, nexus_user_context, theme, preferences
  ]
  keysToRemove.forEach(k => localStorage.removeItem(k))

  console.log('[Migration] localStorage -> IndexedDB migration complete')
}
```

### 3.3 Keys Preserved in localStorage (Post-Migration)

These stay in localStorage because they are small, frequently accessed, and needed before IndexedDB opens:

| Key | Reason |
|-----|--------|
| `nexus_theme` | Needed at CSS paint time, before JS fully loads |
| `nexus_fontSize`, `nexus_density`, `nexus_accentColor` | Same: immediate visual rendering |
| `nexus-user-preferences`, `i18nextLng` | Needed before React mounts |
| `nexus_onboarding_wizard_completed` | Route guard check |
| `nexus_business_profile` | Read by UserMemoryService (small, <2KB) |
| `nexus_user_context` | Read by UserContextService (small, <5KB) |
| `nexus_idb_migration_v1` | Migration flag |

---

## 4. Cross-Device Sync Architecture

### 4.1 Sync Strategy: IndexedDB <--> Supabase

```
                  +-----------+
                  |  Browser  |
                  |  IndexedDB|
                  +-----+-----+
                        |
           write-through (immediate local)
           async background sync (batched)
                        |
                  +-----v-----+
                  | SyncQueue  |
                  | (IndexedDB)|
                  +-----+-----+
                        |
            every 30s or on visibility change
                        |
                  +-----v-----+
                  |  Express   |
                  |  Server    |
                  +-----+-----+
                        |
                  +-----v-----+
                  |  Supabase  |
                  |  PostgreSQL|
                  +-----------+
```

### 4.2 What Syncs to Supabase

| Store | Fields Synced | Fields Local-Only |
|-------|---------------|-------------------|
| `conversations` | id, userId, title, messageCount, createdAt, lastMessageAt, metadata.integrations, metadata.hasWorkflow | firstMessagePreview, lastMessagePreview, syncStatus, syncedAt |
| `messages` | id, conversationId, role, content, timestamp, embeddedContent | extractedEntities, syncedAt |
| `entities` | All fields except syncedAt | syncedAt |
| `workflows` | id, userId, name, description, spec, status, executedAt, requiredIntegrations, createdAt, updatedAt | executionResult (too large; summarize instead), syncedAt |
| `syncQueue` | NEVER (local orchestration only) | Everything |

### 4.3 Conflict Resolution

**Strategy: Last-Writer-Wins (LWW) with per-field granularity for conversations, per-message for messages.**

```typescript
interface SyncConflictResolution {
  conversations: 'last_updated_wins'  // Compare updatedAt timestamps
  messages: 'immutable_append_only'   // Messages are never modified after creation; only new messages sync
  entities: 'highest_frequency_wins'  // Merge: take highest frequency, most recent lastSeenAt
  workflows: 'last_updated_wins'      // Compare updatedAt timestamps
}
```

**Detailed rules:**

1. **Conversations:** Server and client both have `updated_at`/`lastMessageAt`. On load, compare timestamps. Newer wins. If equal, server wins (canonical source).

2. **Messages:** Messages are append-only and immutable (content never changes after creation). Sync is a simple set-union on message IDs. No conflicts possible except for the `delete` case, which uses tombstones.

3. **Entities:** Merged additively. If same entity exists on both sides, take the higher `frequency` and more recent `lastSeenAt`. Confidence is averaged.

4. **Workflows:** LWW on `updatedAt`. Status transitions are one-directional (draft -> ready -> executed is never reversed).

### 4.4 Sync Triggers

| Event | Sync Action |
|-------|-------------|
| New message added | Enqueue to syncQueue, attempt immediate push |
| New conversation created | Enqueue, batch with other pending |
| App becomes visible (`visibilitychange`) | Full pull-sync from Supabase |
| Every 30 seconds (if pending items) | Flush syncQueue |
| User logs in / userId changes | Full bidirectional sync |
| Manual "Sync Now" button | Full bidirectional sync |
| App going to background | Flush all pending |

### 4.5 Required Supabase Schema Changes

The existing `chat_conversations` and `chat_messages` tables are sufficient for conversations and messages. New tables needed for entities and workflows:

```sql
-- Entities table (NEW)
CREATE TABLE IF NOT EXISTS user_entities (
  id SERIAL PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  value TEXT NOT NULL,
  display_name TEXT,
  extracted_from TEXT,  -- conversation_id
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  frequency INTEGER NOT NULL DEFAULT 1,
  confidence REAL NOT NULL DEFAULT 0.5,
  context TEXT,
  UNIQUE(clerk_user_id, entity_type, value)  -- Dedup constraint
);

CREATE INDEX idx_user_entities_user ON user_entities(clerk_user_id);
CREATE INDEX idx_user_entities_type ON user_entities(clerk_user_id, entity_type);
CREATE INDEX idx_user_entities_freq ON user_entities(clerk_user_id, frequency DESC);

-- Workflows table (NEW -- extends beyond chat-generated workflows)
CREATE TABLE IF NOT EXISTS user_workflows (
  id TEXT PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  conversation_id TEXT REFERENCES chat_conversations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  spec JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  executed_at TIMESTAMPTZ,
  required_integrations JSONB DEFAULT '[]'::jsonb,
  estimated_time_saved TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_workflows_user ON user_workflows(clerk_user_id);
CREATE INDEX idx_user_workflows_status ON user_workflows(clerk_user_id, status);
```

---

## 5. Storage Requirements Calculation

### 5.1 Per-Record Size Estimates

| Record Type | Average Size (bytes) | Min | Max |
|-------------|---------------------|-----|-----|
| Conversation (metadata only) | 350 | 200 | 600 |
| Message (user, text only) | 400 | 50 | 2,000 |
| Message (assistant, with workflow) | 3,500 | 200 | 10,000 |
| Entity | 250 | 100 | 500 |
| Workflow | 4,000 | 1,500 | 15,000 |
| SyncQueue entry | 200 | 100 | 500 |

### 5.2 Scenario: 1000 Conversations x 50 Messages Each

```
Conversations:   1,000 x 350 bytes    =     350 KB
Messages:       50,000 x 1,200 bytes  =  60,000 KB  (60 MB)
  - User messages:   25,000 x 400     =  10,000 KB
  - Assistant msgs:  25,000 x 2,000   =  50,000 KB
Entities:          500 x 250 bytes     =     125 KB  (deduped)
Workflows:         200 x 4,000 bytes   =     800 KB  (not every conversation has one)
Indexes (overhead ~15%):               =   9,191 KB

TOTAL ESTIMATED: ~70.5 MB (IndexedDB)
```

### 5.3 Comparison: localStorage vs IndexedDB Limits

| Storage | Limit | 1000x50 Scenario | Fits? |
|---------|-------|-------------------|-------|
| localStorage | 5 MB (hard limit) | 60 MB (messages alone) | NO -- fails at ~80-100 conversations |
| sessionStorage | 5 MB | N/A | NO |
| IndexedDB | Typically 50% of free disk space (hundreds of GB) | 70 MB | YES, trivially |
| Supabase (free tier) | 500 MB database | 70 MB raw data | YES, with room to grow |

### 5.4 IndexedDB Quota by Browser

| Browser | Default Quota | Eviction Policy |
|---------|--------------|-----------------|
| Chrome | 80% of total disk / profile | LRU eviction in Incognito only |
| Firefox | 50% of disk, max 2GB per origin | LRU eviction under storage pressure |
| Safari | 1GB per origin (prompt at threshold) | 7-day ITP eviction if no user interaction |
| Edge | Same as Chrome (Blink) | Same as Chrome |

**Safari warning:** Safari's Intelligent Tracking Prevention can evict IndexedDB after 7 days without user interaction. This makes Supabase sync essential for Safari users. The architecture should treat IndexedDB as a **fast local cache** and Supabase as the **canonical store**.

---

## 6. Implementation Recommendations

### 6.1 Service Architecture

```typescript
// New unified service replacing multiple fragmented services
class NexusStorageService {
  private db: IDBDatabase
  private syncQueue: SyncQueueManager
  private userId: string | null

  // Public API
  async getConversations(limit: number, offset: number): Promise<ConversationRecord[]>
  async getMessages(conversationId: string): Promise<MessageRecord[]>
  async addMessage(conversationId: string, message: Omit<MessageRecord, 'id'>): Promise<string>
  async createConversation(title?: string): Promise<ConversationRecord>
  async deleteConversation(id: string): Promise<void>
  async searchMessages(query: string): Promise<MessageRecord[]>  // Full-text via cursor scan
  async getEntities(type?: string): Promise<EntityRecord[]>
  async saveWorkflow(workflow: WorkflowRecord): Promise<void>
  async getAIContext(conversationId: string): Promise<ChatMessage[]>  // Last N messages for AI
  async forceSyncNow(): Promise<SyncResult>

  // Migration
  async migrateFromLocalStorage(): Promise<void>

  // Stats
  async getStorageStats(): Promise<{ conversations: number; messages: number; sizeBytes: number }>
}
```

### 6.2 Integration Points with Existing Code

| Existing Code | Change Required |
|--------------|-----------------|
| `NexusAIService.conversationHistory` | Replace in-memory array with `storageService.getAIContext(sessionId)` call on session resume |
| `useChatState.ts` | Replace `loadSessionsFromStorage()` / `saveSessionsToStorage()` with `NexusStorageService` methods |
| `ChatPersistenceService.ts` | **Replace entirely** -- its dual-write pattern is subsumed by NexusStorageService + SyncQueue |
| `UserMemoryService.loadChatHistory()` | Read from IndexedDB `conversations` store instead of parsing `nexus-chat-sessions` |
| `UserMemoryService.loadWorkflows()` | Read from IndexedDB `workflows` store instead of parsing `nexus-user-workflows` |
| `state-persistence.ts` (`StorageManager`) | **Keep** for preferences/UI state (small, sync-access). Not for conversations. |
| `state-reset.ts` | Add `clearIndexedDB: true` to the `resetAll()` and `factoryReset()` paths (already has the flag) |

### 6.3 Background Entity Extraction Pipeline

When a new message is stored, enqueue a background extraction job:

```typescript
// After storing a message
async function extractEntitiesFromMessage(message: MessageRecord): Promise<void> {
  const patterns = {
    email: /[\w.-]+@[\w.-]+\.\w+/g,
    slack_channel: /#[\w-]+/g,
    url: /https?:\/\/[\w.-]+(?:\/[\w./?#%&=-]*)?/g,
    person: null,  // Requires NLP; defer to AI extraction
  }

  const entities: ExtractedEntity[] = []
  for (const [type, regex] of Object.entries(patterns)) {
    if (!regex) continue
    const matches = message.content.match(regex)
    if (matches) {
      for (const value of new Set(matches)) {
        entities.push({ type: type as any, value, confidence: 0.95 })
      }
    }
  }

  // Update message record with extracted entities
  // Upsert into entities store (increment frequency if exists)
}
```

### 6.4 Pagination Strategy for Large Datasets

For the sidebar conversation list, use cursor-based pagination over the `['userId', 'lastMessageAt']` compound index:

```typescript
async function getConversationPage(
  userId: string,
  cursor: number | null,  // lastMessageAt of last item in previous page
  pageSize: number = 20
): Promise<ConversationRecord[]> {
  const tx = db.transaction('conversations', 'readonly')
  const index = tx.objectStore('conversations').index('userId_lastMessageAt')
  const range = cursor
    ? IDBKeyRange.bound([userId, 0], [userId, cursor], false, true)
    : IDBKeyRange.bound([userId, 0], [userId, Date.now()])

  // Iterate in reverse (most recent first)
  const results: ConversationRecord[] = []
  let cursorObj = await index.openCursor(range, 'prev')
  while (cursorObj && results.length < pageSize) {
    results.push(cursorObj.value)
    cursorObj = await cursorObj.continue()
  }
  return results
}
```

---

## 7. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Safari 7-day ITP eviction | Medium (affects all Safari users) | High (data loss) | Supabase sync is the canonical store; IndexedDB is cache. Show "Sync" badge in Safari. |
| Migration corrupts data | Low | High | Keep localStorage backup for 30 days after migration; add rollback path. |
| IndexedDB blocked (private browsing) | Low | Medium | Fall back to in-memory + Supabase only (existing `MemoryStorage` pattern). |
| syncQueue grows unbounded | Low | Medium | Cap at 500 entries; drop oldest on overflow; periodic flush. |
| Large conversations slow down UI | Medium | Medium | Paginate message loading (50 per page); use cursor-based reads; virtual scrolling in chat. |

---

## 8. Summary

The current system stores approximately 15-20 distinct localStorage keys with chat sessions being the heaviest. At scale (1000+ conversations), localStorage will fail. IndexedDB provides 1000x more capacity with indexed queries, while the dual-write pattern to Supabase ensures cross-device persistence. The migration is a one-time, non-destructive operation that preserves all existing data and clears localStorage afterward to reclaim space. The syncQueue pattern ensures no data loss even with intermittent connectivity.

**Priority order for implementation:**
1. IndexedDB schema creation with `conversations` + `messages` stores (unblocks the 5MB ceiling)
2. Migration from localStorage (one-time, idempotent)
3. Integration with `useChatState` and `NexusAIService` (restore AI context on session resume)
4. SyncQueue + Supabase sync (cross-device)
5. Entity extraction pipeline (enriches AI memory over time)
6. `workflows` and `entities` stores (lower priority, smaller datasets)
