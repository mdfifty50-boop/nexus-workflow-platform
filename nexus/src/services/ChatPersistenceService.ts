/**
 * ChatPersistenceService - Dual-write localStorage + Cloud persistence
 *
 * Plan B: User Account System - Chat History Persistence
 *
 * Philosophy:
 * - DUAL-WRITE: Always save to localStorage (fast) + server API (cloud backup)
 * - GRACEFUL DEGRADATION: Works with localStorage only if server unavailable
 * - NON-BLOCKING: Server writes are async, don't block UI
 * - SYNC ON LOAD: Merge server data with localStorage on app start
 *
 * Architecture:
 * - Frontend calls this service
 * - Service writes to localStorage immediately (fast)
 * - Service calls server API async (cloud persistence)
 * - Server uses service_role key for Supabase (secure)
 */

import type { ChatMessage, ChatSession } from '@/components/chat/types'

// ============================================================================
// Types
// ============================================================================

interface SyncResult {
  success: boolean
  sessionsLoaded: number
  source: 'supabase' | 'localStorage' | 'merged'
  error?: string
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'nexus-chat-sessions'
const CURRENT_SESSION_KEY = 'nexus-current-session'
const SYNC_STATUS_KEY = 'nexus-chat-sync-status'
const API_BASE = '/api/chat-persistence'

// ============================================================================
// localStorage Helpers (unchanged from useChatState for compatibility)
// ============================================================================

function loadSessionsFromStorage(): ChatSession[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored) as ChatSession[]
    return parsed.map((session) => ({
      ...session,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
      messages: session.messages.map((msg) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })),
    }))
  } catch {
    return []
  }
}

function saveSessionsToStorage(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  } catch {
    // Storage might be full, silently fail
    console.warn('[ChatPersistence] localStorage save failed - storage may be full')
  }
}

function loadCurrentSessionIdFromStorage(): string | null {
  try {
    return localStorage.getItem(CURRENT_SESSION_KEY)
  } catch {
    return null
  }
}

function saveCurrentSessionIdToStorage(sessionId: string): void {
  try {
    localStorage.setItem(CURRENT_SESSION_KEY, sessionId)
  } catch {
    // Silent fail
  }
}

// ============================================================================
// API Helpers
// ============================================================================

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  userId: string | null
): Promise<T | null> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }

    // Add user ID header if available
    if (userId) {
      headers['x-clerk-user-id'] = userId
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      console.warn(`[ChatPersistence] API call failed: ${response.status}`)
      return null
    }

    return await response.json() as T
  } catch (error) {
    console.warn('[ChatPersistence] API call error:', error)
    return null
  }
}

// ============================================================================
// ChatPersistenceService
// ============================================================================

class ChatPersistenceService {
  private userId: string | null = null
  private cloudEnabled: boolean = false

  constructor() {
    // Check if server API is available
    this.checkCloudStatus()
  }

  /**
   * Check cloud status from server
   */
  private async checkCloudStatus(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/status`)
      if (response.ok) {
        const data = await response.json()
        this.cloudEnabled = data.cloudEnabled
        if (this.cloudEnabled) {
          console.log('[ChatPersistence] Cloud persistence available')
        } else {
          console.log('[ChatPersistence] Cloud not configured - localStorage only')
        }
      }
    } catch {
      console.log('[ChatPersistence] Server unavailable - localStorage only mode')
      this.cloudEnabled = false
    }
  }

  /**
   * Initialize with user ID for cloud operations
   */
  setUserId(userId: string | null): void {
    this.userId = userId
    if (userId) {
      console.log('[ChatPersistence] User ID set - cloud sync available')
    }
  }

  /**
   * Check if cloud persistence is available
   */
  isCloudEnabled(): boolean {
    return this.cloudEnabled && !!this.userId
  }

  // ==========================================================================
  // Session Operations (Dual-Write)
  // ==========================================================================

  /**
   * Save a session - dual-write to localStorage + server
   */
  async saveSession(session: ChatSession): Promise<void> {
    // Step 1: Always save to localStorage first (fast, reliable)
    const sessions = loadSessionsFromStorage()
    const existingIndex = sessions.findIndex((s) => s.id === session.id)
    if (existingIndex >= 0) {
      sessions[existingIndex] = session
    } else {
      sessions.unshift(session) // New sessions at the top
    }
    saveSessionsToStorage(sessions)

    // Step 2: Async write to server (non-blocking)
    if (this.isCloudEnabled()) {
      apiCall('/sessions', {
        method: 'POST',
        body: JSON.stringify({ session }),
      }, this.userId).catch((err) => {
        console.warn('[ChatPersistence] Server sync failed (will retry):', err)
      })
    }
  }

  /**
   * Save all sessions - dual-write
   */
  async saveSessions(sessions: ChatSession[]): Promise<void> {
    // Step 1: localStorage
    saveSessionsToStorage(sessions)

    // Step 2: Server (async, non-blocking)
    if (this.isCloudEnabled()) {
      // Only sync the most recent 50 sessions to avoid overwhelming
      const recentSessions = sessions.slice(0, 50)
      Promise.all(
        recentSessions.map((s) =>
          apiCall('/sessions', {
            method: 'POST',
            body: JSON.stringify({ session: s }),
          }, this.userId)
        )
      ).catch((err) => {
        console.warn('[ChatPersistence] Batch server sync failed:', err)
      })
    }
  }

  /**
   * Add a message to a session - dual-write
   */
  async addMessage(sessionId: string, message: ChatMessage): Promise<void> {
    // Step 1: Update localStorage
    const sessions = loadSessionsFromStorage()
    const session = sessions.find((s) => s.id === sessionId)
    if (session) {
      session.messages.push(message)
      session.updatedAt = new Date()
      // Update title from first user message if still default
      if (session.title === 'New Chat' && message.role === 'user') {
        const content = message.content.trim()
        session.title = content.length <= 50 ? content : content.substring(0, 47) + '...'
      }
      saveSessionsToStorage(sessions)
    }

    // Step 2: Sync to server (async)
    if (this.isCloudEnabled()) {
      apiCall('/messages', {
        method: 'POST',
        body: JSON.stringify({ sessionId, message }),
      }, this.userId).then(() => {
        this.updateSyncStatus()
      }).catch((err) => {
        console.warn('[ChatPersistence] Message sync failed:', err)
      })
    }
  }

  /**
   * Delete a session - dual-write
   */
  async deleteSession(sessionId: string): Promise<void> {
    // Step 1: Remove from localStorage
    const sessions = loadSessionsFromStorage()
    const filtered = sessions.filter((s) => s.id !== sessionId)
    saveSessionsToStorage(filtered)

    // Step 2: Remove from server
    if (this.isCloudEnabled()) {
      apiCall(`/sessions/${sessionId}`, {
        method: 'DELETE',
      }, this.userId).catch((err) => {
        console.warn('[ChatPersistence] Server delete failed:', err)
      })
    }
  }

  // ==========================================================================
  // Current Session Tracking
  // ==========================================================================

  saveCurrentSessionId(sessionId: string): void {
    saveCurrentSessionIdToStorage(sessionId)
  }

  loadCurrentSessionId(): string | null {
    return loadCurrentSessionIdFromStorage()
  }

  // ==========================================================================
  // Load Operations (Merge Strategy)
  // ==========================================================================

  /**
   * Load all sessions with smart merge
   *
   * Strategy:
   * 1. Load from localStorage (always available, fast)
   * 2. If server enabled, fetch cloud sessions
   * 3. Merge: Cloud sessions override local if newer, keep local-only sessions
   */
  async loadSessions(): Promise<{ sessions: ChatSession[]; syncResult: SyncResult }> {
    const localSessions = loadSessionsFromStorage()

    // If no cloud enabled, just return localStorage
    if (!this.isCloudEnabled()) {
      return {
        sessions: localSessions,
        syncResult: {
          success: true,
          sessionsLoaded: localSessions.length,
          source: 'localStorage',
        },
      }
    }

    // Try to fetch from server
    try {
      const response = await apiCall<{ sessions: ChatSession[]; source: string }>(
        '/sessions',
        { method: 'GET' },
        this.userId
      )

      if (!response || !response.sessions || response.sessions.length === 0) {
        // No cloud data - upload local to cloud
        if (localSessions.length > 0) {
          this.saveSessions(localSessions) // Async upload
        }
        return {
          sessions: localSessions,
          syncResult: {
            success: true,
            sessionsLoaded: localSessions.length,
            source: 'localStorage',
          },
        }
      }

      // Convert server response to proper Date objects
      const cloudSessions: ChatSession[] = response.sessions.map((s) => ({
        ...s,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
        messages: s.messages.map((m) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        })),
      }))

      // Merge strategy
      const merged = this.mergeSessions(localSessions, cloudSessions)
      saveSessionsToStorage(merged) // Update localStorage with merged data

      this.updateSyncStatus()

      return {
        sessions: merged,
        syncResult: {
          success: true,
          sessionsLoaded: merged.length,
          source: 'merged',
        },
      }
    } catch (err: any) {
      console.warn('[ChatPersistence] Cloud fetch failed, using localStorage:', err?.message)
      return {
        sessions: localSessions,
        syncResult: {
          success: false,
          sessionsLoaded: localSessions.length,
          source: 'localStorage',
          error: err?.message,
        },
      }
    }
  }

  /**
   * Merge local and cloud sessions
   *
   * Rules:
   * - Sessions with same ID: Keep the one with newer updatedAt
   * - Sessions only in local: Keep (not yet synced)
   * - Sessions only in cloud: Add (from another device)
   */
  private mergeSessions(local: ChatSession[], cloud: ChatSession[]): ChatSession[] {
    const merged = new Map<string, ChatSession>()

    // Add all cloud sessions first
    for (const session of cloud) {
      merged.set(session.id, session)
    }

    // Merge local sessions
    for (const localSession of local) {
      const cloudSession = merged.get(localSession.id)
      if (!cloudSession) {
        // Local-only session - keep it
        merged.set(localSession.id, localSession)
      } else {
        // Exists in both - keep newer
        if (localSession.updatedAt > cloudSession.updatedAt) {
          merged.set(localSession.id, localSession)
        }
        // else keep cloud version (already in map)
      }
    }

    // Sort by updatedAt descending
    return Array.from(merged.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    )
  }

  // ==========================================================================
  // Sync Status
  // ==========================================================================

  getSyncStatus(): { lastSync: Date | null; enabled: boolean } {
    const lastSyncStr = localStorage.getItem(SYNC_STATUS_KEY)
    return {
      lastSync: lastSyncStr ? new Date(lastSyncStr) : null,
      enabled: this.isCloudEnabled(),
    }
  }

  private updateSyncStatus(): void {
    localStorage.setItem(SYNC_STATUS_KEY, new Date().toISOString())
  }
}

// Singleton instance
export const chatPersistenceService = new ChatPersistenceService()
export default chatPersistenceService
