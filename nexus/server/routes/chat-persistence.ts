/**
 * Chat Persistence API Routes
 *
 * Plan B: User Account System - Server-side chat persistence
 *
 * Security: All routes require clerk_user_id in headers or body
 * Uses service_role key for Supabase to bypass RLS safely
 */

import { Router, Request, Response, NextFunction } from 'express'
import { createClient } from '@supabase/supabase-js'

const router = Router()

// ============================================================================
// Supabase Client (Service Role for server-side access)
// ============================================================================

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Create service role client (bypasses RLS)
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

// ============================================================================
// Types
// ============================================================================

interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  embeddedContent?: unknown[]
  isStreaming?: boolean
}

// ============================================================================
// Middleware: Extract clerk_user_id
// ============================================================================

function extractUserId(req: Request, res: Response, next: NextFunction): void {
  const clerkUserId = req.headers['x-clerk-user-id'] as string || req.body?.clerk_user_id

  // Dev mode fallback
  if (!clerkUserId && process.env.NODE_ENV !== 'production') {
    req.body = req.body || {}
    req.body.clerk_user_id = 'dev-user-local'
    console.log('[chat-persistence] DEV MODE: Using dev-user-local')
    return next()
  }

  if (!clerkUserId) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  req.body = req.body || {}
  req.body.clerk_user_id = clerkUserId
  next()
}

// Apply to all routes
router.use(extractUserId)

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /api/chat-persistence/sessions
 * Load all sessions for the authenticated user
 */
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.body.clerk_user_id

    if (!supabase) {
      // Supabase not configured - return empty (frontend will use localStorage)
      return res.json({ sessions: [], source: 'localStorage' })
    }

    // Fetch conversations
    const { data: conversations, error: convError } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .order('updated_at', { ascending: false })
      .limit(100)

    if (convError) {
      console.error('[chat-persistence] Fetch conversations error:', convError)
      return res.json({ sessions: [], source: 'localStorage', error: convError.message })
    }

    if (!conversations || conversations.length === 0) {
      return res.json({ sessions: [], source: 'supabase' })
    }

    // Fetch messages for all conversations
    const convIds = conversations.map(c => c.id)
    const { data: messages, error: msgError } = await supabase
      .from('chat_messages')
      .select('*')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: true })

    if (msgError) {
      console.error('[chat-persistence] Fetch messages error:', msgError)
    }

    // Group messages by conversation
    const messagesByConv = new Map<string, typeof messages>()
    for (const msg of messages || []) {
      const existing = messagesByConv.get(msg.conversation_id) || []
      existing.push(msg)
      messagesByConv.set(msg.conversation_id, existing)
    }

    // Convert to ChatSession format
    const sessions: ChatSession[] = conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      createdAt: new Date(conv.created_at),
      updatedAt: new Date(conv.updated_at),
      messages: (messagesByConv.get(conv.id) || []).map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        embeddedContent: msg.embedded_content || undefined,
        isStreaming: false,
      })),
    }))

    res.json({ sessions, source: 'supabase' })
  } catch (error) {
    console.error('[chat-persistence] Error loading sessions:', error)
    res.status(500).json({ error: 'Failed to load sessions', sessions: [] })
  }
})

/**
 * POST /api/chat-persistence/sessions
 * Save or update a session
 */
router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.body.clerk_user_id
    const session: ChatSession = req.body.session

    if (!session || !session.id) {
      return res.status(400).json({ error: 'Session data required' })
    }

    if (!supabase) {
      return res.json({ success: true, source: 'localStorage' })
    }

    // Upsert conversation
    const { error: convError } = await supabase
      .from('chat_conversations')
      .upsert({
        id: session.id,
        clerk_user_id: clerkUserId,
        title: session.title,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

    if (convError) {
      console.error('[chat-persistence] Save conversation error:', convError)
      return res.status(500).json({ error: convError.message })
    }

    // Upsert messages if any
    if (session.messages && session.messages.length > 0) {
      const messagesToUpsert = session.messages.map(m => ({
        id: m.id,
        conversation_id: session.id,
        role: m.role,
        content: m.content,
        embedded_content: m.embeddedContent || null,
        created_at: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
      }))

      const { error: msgError } = await supabase
        .from('chat_messages')
        .upsert(messagesToUpsert, { onConflict: 'id' })

      if (msgError) {
        console.warn('[chat-persistence] Save messages warning:', msgError)
        // Don't fail - conversation is saved
      }
    }

    res.json({ success: true, source: 'supabase' })
  } catch (error) {
    console.error('[chat-persistence] Error saving session:', error)
    res.status(500).json({ error: 'Failed to save session' })
  }
})

/**
 * POST /api/chat-persistence/messages
 * Add a single message to a session (optimized for real-time)
 */
router.post('/messages', async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.body.clerk_user_id
    const { sessionId, message } = req.body

    if (!sessionId || !message) {
      return res.status(400).json({ error: 'sessionId and message required' })
    }

    if (!supabase) {
      return res.json({ success: true, source: 'localStorage' })
    }

    // Ensure conversation exists
    const { error: convError } = await supabase
      .from('chat_conversations')
      .upsert({
        id: sessionId,
        clerk_user_id: clerkUserId,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

    if (convError) {
      console.error('[chat-persistence] Ensure conversation error:', convError)
    }

    // Insert message
    const { error: msgError } = await supabase
      .from('chat_messages')
      .upsert({
        id: message.id,
        conversation_id: sessionId,
        role: message.role,
        content: message.content,
        embedded_content: message.embeddedContent || null,
        created_at: message.timestamp instanceof Date ? message.timestamp.toISOString() : message.timestamp,
      }, { onConflict: 'id' })

    if (msgError) {
      console.error('[chat-persistence] Save message error:', msgError)
      return res.status(500).json({ error: msgError.message })
    }

    // Update conversation title if this is first user message
    if (message.role === 'user') {
      const title = message.content.trim().substring(0, 50)
      await supabase
        .from('chat_conversations')
        .update({
          title: title.length < message.content.trim().length ? title + '...' : title,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('title', 'New Chat') // Only update if still default
    }

    res.json({ success: true, source: 'supabase' })
  } catch (error) {
    console.error('[chat-persistence] Error adding message:', error)
    res.status(500).json({ error: 'Failed to add message' })
  }
})

/**
 * DELETE /api/chat-persistence/sessions/:id
 * Delete a session
 */
router.delete('/sessions/:id', async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.body.clerk_user_id
    const sessionId = req.params.id

    if (!supabase) {
      return res.json({ success: true, source: 'localStorage' })
    }

    // Delete conversation (messages cascade)
    const { error } = await supabase
      .from('chat_conversations')
      .delete()
      .eq('id', sessionId)
      .eq('clerk_user_id', clerkUserId)

    if (error) {
      console.error('[chat-persistence] Delete error:', error)
      return res.status(500).json({ error: error.message })
    }

    res.json({ success: true, source: 'supabase' })
  } catch (error) {
    console.error('[chat-persistence] Error deleting session:', error)
    res.status(500).json({ error: 'Failed to delete session' })
  }
})

/**
 * GET /api/chat-persistence/status
 * Check if cloud persistence is available
 */
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    supabaseConfigured: !!supabase,
    cloudEnabled: !!supabase,
  })
})

export default router
