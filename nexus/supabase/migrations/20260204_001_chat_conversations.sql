-- Migration: Chat Persistence Tables
-- Plan B: User Account System - Chat History Persistence
-- Date: 2026-02-04
--
-- Purpose: Enable cross-device chat persistence by storing conversations in Supabase
-- Design: Matches TypeScript types (ChatSession, ChatMessage) for seamless integration
-- Security: All access through server API using service_role key
--           RLS is disabled since server handles authorization

-- ============================================================================
-- CHAT CONVERSATIONS TABLE
-- Maps to TypeScript: ChatSession
-- ============================================================================

CREATE TABLE IF NOT EXISTS chat_conversations (
  -- Primary key - use TEXT to match frontend-generated IDs
  id TEXT PRIMARY KEY,

  -- User reference (using clerk_user_id to match user_profiles table)
  clerk_user_id TEXT NOT NULL,

  -- Session metadata (matches ChatSession interface)
  title TEXT NOT NULL DEFAULT 'New Chat',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient user queries
CREATE INDEX IF NOT EXISTS idx_chat_conversations_clerk_user_id
  ON chat_conversations(clerk_user_id);

-- Index for sorting by recent activity
CREATE INDEX IF NOT EXISTS idx_chat_conversations_updated_at
  ON chat_conversations(updated_at DESC);

-- ============================================================================
-- CHAT MESSAGES TABLE
-- Maps to TypeScript: ChatMessage
-- ============================================================================

CREATE TABLE IF NOT EXISTS chat_messages (
  -- Primary key - use TEXT to match frontend-generated IDs
  id TEXT PRIMARY KEY,

  -- Foreign key to conversation (CASCADE delete for data cleanup)
  conversation_id TEXT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,

  -- Message content (matches ChatMessage interface)
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,

  -- Embedded content (workflow previews, etc.) - stored as JSONB for flexibility
  -- Matches: embeddedContent?: EmbeddedContent[]
  embedded_content JSONB DEFAULT NULL,

  -- Timestamp (matches ChatMessage.timestamp)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()

  -- Note: isStreaming is ephemeral and not persisted
);

-- Index for efficient message retrieval by conversation
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id
  ON chat_messages(conversation_id);

-- Index for chronological ordering
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at
  ON chat_messages(conversation_id, created_at);

-- ============================================================================
-- AUTOMATIC UPDATED_AT TRIGGER
-- ============================================================================

-- Reuse existing function if available, otherwise create it
CREATE OR REPLACE FUNCTION update_chat_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for chat_conversations
DROP TRIGGER IF EXISTS update_chat_conversations_updated_at ON chat_conversations;
CREATE TRIGGER update_chat_conversations_updated_at
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- Disabled: All access via server with service_role key
-- Server validates clerk_user_id before all operations
-- ============================================================================

-- RLS is intentionally NOT enabled for these tables
-- Access control is handled at the application layer (server/routes/chat-persistence.ts)
-- The server validates clerk_user_id from authenticated requests
-- and filters queries accordingly using the service_role key

-- If you need to enable RLS in the future for direct client access:
-- 1. Enable RLS: ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
-- 2. Create policies using Supabase Auth or custom JWT claims
-- 3. Update the frontend to use authenticated Supabase client

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE chat_conversations IS 'User chat sessions for cross-device persistence (Plan B: User Account System)';
COMMENT ON COLUMN chat_conversations.id IS 'Frontend-generated ID (timestamp-based)';
COMMENT ON COLUMN chat_conversations.clerk_user_id IS 'Clerk user ID - links to user_profiles.clerk_user_id';
COMMENT ON COLUMN chat_conversations.title IS 'Auto-generated from first user message or "New Chat"';

COMMENT ON TABLE chat_messages IS 'Individual messages within chat conversations';
COMMENT ON COLUMN chat_messages.id IS 'Frontend-generated ID (timestamp-based)';
COMMENT ON COLUMN chat_messages.role IS 'Message author: user, assistant, or system';
COMMENT ON COLUMN chat_messages.embedded_content IS 'JSONB array of embedded content (workflow previews, templates, etc.)';
