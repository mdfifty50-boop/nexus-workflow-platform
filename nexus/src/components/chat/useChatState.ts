/**
 * useChatState Hook
 *
 * Manages chat state including messages, sessions, and persistence.
 * Uses localStorage for local persistence with optional Supabase cloud sync.
 *
 * Plan B: User Account System - Updated for dual-write persistence
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { chatPersistenceService } from '@/services/ChatPersistenceService'
import type {
  ChatMessage,
  ChatSession,
  MessageRole,
  UseChatStateReturn,
} from './types'

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'nexus-chat-sessions'
const CURRENT_SESSION_KEY = 'nexus-current-session'

// ============================================================================
// Utility Functions
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

function generateSessionTitle(messages: ChatMessage[]): string {
  const firstUserMessage = messages.find((m) => m.role === 'user')
  if (firstUserMessage) {
    const content = firstUserMessage.content.trim()
    if (content.length <= 50) return content
    return content.substring(0, 47) + '...'
  }
  return 'New Chat'
}

// ============================================================================
// localStorage Helpers (kept for fallback compatibility)
// ============================================================================

function loadSessionsFromStorage(): ChatSession[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored) as ChatSession[]
    // Restore Date objects
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
    void 0
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
    void 0
  }
}

// ============================================================================
// Hook Configuration
// ============================================================================

export interface UseChatStateConfig {
  /** Clerk user ID for cloud sync. If not provided, localStorage-only mode. */
  userId?: string | null
  /** Enable cloud sync when userId is available. Default: true */
  enableCloudSync?: boolean
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useChatState(config: UseChatStateConfig = {}): UseChatStateReturn {
  const { userId = null, enableCloudSync = true } = config

  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const isInitializedRef = useRef(false)
  const userIdRef = useRef(userId)

  // Update persistence service when userId changes
  useEffect(() => {
    if (enableCloudSync) {
      chatPersistenceService.setUserId(userId)
      userIdRef.current = userId
    }
  }, [userId, enableCloudSync])

  // Create new session helper
  function createNewSession(): ChatSession {
    return {
      id: generateId(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  // Initialize from storage on mount (with optional cloud sync)
  useEffect(() => {
    if (isInitializedRef.current) return
    isInitializedRef.current = true

    const initializeSessions = async () => {
      setIsLoading(true)

      try {
        // Use persistence service for loading (handles merge if cloud enabled)
        if (enableCloudSync && userId) {
          const { sessions: loadedSessions, syncResult } = await chatPersistenceService.loadSessions()

          if (syncResult.source === 'merged') {
            console.log(`[useChatState] Merged ${syncResult.sessionsLoaded} sessions from cloud`)
          }

          if (loadedSessions.length > 0) {
            setSessions(loadedSessions)
            const currentSessionId = chatPersistenceService.loadCurrentSessionId()
            const sessionToLoad = currentSessionId
              ? loadedSessions.find((s) => s.id === currentSessionId)
              : loadedSessions[0]

            if (sessionToLoad) {
              setCurrentSession(sessionToLoad)
            } else {
              const newSession = createNewSession()
              setSessions((prev) => [newSession, ...prev])
              setCurrentSession(newSession)
              chatPersistenceService.saveSession(newSession)
            }
          } else {
            // No sessions, create a new one
            const newSession = createNewSession()
            setSessions([newSession])
            setCurrentSession(newSession)
            chatPersistenceService.saveSession(newSession)
          }
        } else {
          // Fallback: localStorage only (original behavior)
          const storedSessions = loadSessionsFromStorage()
          const currentSessionId = loadCurrentSessionIdFromStorage()

          if (storedSessions.length > 0) {
            setSessions(storedSessions)
            const sessionToLoad = currentSessionId
              ? storedSessions.find((s) => s.id === currentSessionId)
              : storedSessions[0]
            if (sessionToLoad) {
              setCurrentSession(sessionToLoad)
            } else {
              // Start a new session if current not found
              const newSession = createNewSession()
              setSessions((prev) => [newSession, ...prev])
              setCurrentSession(newSession)
            }
          } else {
            // No sessions, create a new one
            const newSession = createNewSession()
            setSessions([newSession])
            setCurrentSession(newSession)
          }
        }
      } catch (err) {
        console.error('[useChatState] Initialization error:', err)
        // Fallback to localStorage on any error
        const storedSessions = loadSessionsFromStorage()
        if (storedSessions.length > 0) {
          setSessions(storedSessions)
          setCurrentSession(storedSessions[0])
        } else {
          const newSession = createNewSession()
          setSessions([newSession])
          setCurrentSession(newSession)
        }
      } finally {
        setIsLoading(false)
      }
    }

    initializeSessions()
  }, []) // Only run once on mount

  // Save sessions to localStorage when they change (always, for local backup)
  useEffect(() => {
    if (sessions.length > 0) {
      saveSessionsToStorage(sessions)
    }
  }, [sessions])

  // Save current session ID when it changes
  useEffect(() => {
    if (currentSession) {
      saveCurrentSessionIdToStorage(currentSession.id)
      chatPersistenceService.saveCurrentSessionId(currentSession.id)
    }
  }, [currentSession?.id])

  const addMessage = useCallback(
    (content: string, role: MessageRole): ChatMessage => {
      const newMessage: ChatMessage = {
        id: generateId(),
        role,
        content,
        timestamp: new Date(),
        isStreaming: false,
      }

      setCurrentSession((prev) => {
        if (!prev) return prev
        const updatedMessages = [...prev.messages, newMessage]
        const updatedSession: ChatSession = {
          ...prev,
          messages: updatedMessages,
          title: generateSessionTitle(updatedMessages),
          updatedAt: new Date(),
        }

        // Update in sessions list
        setSessions((sessions) =>
          sessions.map((s) => (s.id === updatedSession.id ? updatedSession : s))
        )

        // Dual-write to persistence service (async, non-blocking)
        chatPersistenceService.addMessage(updatedSession.id, newMessage).catch((err) => {
          console.warn('[useChatState] Message persistence failed:', err)
        })

        return updatedSession
      })

      return newMessage
    },
    []
  )

  const updateMessage = useCallback(
    (id: string, updates: Partial<ChatMessage>): void => {
      setCurrentSession((prev) => {
        if (!prev) return prev
        const updatedMessages = prev.messages.map((msg) =>
          msg.id === id ? { ...msg, ...updates } : msg
        )
        const updatedSession: ChatSession = {
          ...prev,
          messages: updatedMessages,
          updatedAt: new Date(),
        }

        setSessions((sessions) =>
          sessions.map((s) => (s.id === updatedSession.id ? updatedSession : s))
        )

        // Sync updated session to cloud
        chatPersistenceService.saveSession(updatedSession).catch((err) => {
          console.warn('[useChatState] Session update persistence failed:', err)
        })

        return updatedSession
      })
    },
    []
  )

  const deleteMessage = useCallback((id: string): void => {
    setCurrentSession((prev) => {
      if (!prev) return prev
      const updatedMessages = prev.messages.filter((msg) => msg.id !== id)
      const updatedSession: ChatSession = {
        ...prev,
        messages: updatedMessages,
        title: generateSessionTitle(updatedMessages),
        updatedAt: new Date(),
      }

      setSessions((sessions) =>
        sessions.map((s) => (s.id === updatedSession.id ? updatedSession : s))
      )

      // Sync to cloud
      chatPersistenceService.saveSession(updatedSession).catch((err) => {
        console.warn('[useChatState] Delete persistence failed:', err)
      })

      return updatedSession
    })
  }, [])

  const clearMessages = useCallback((): void => {
    setCurrentSession((prev) => {
      if (!prev) return prev
      const updatedSession: ChatSession = {
        ...prev,
        messages: [],
        title: 'New Chat',
        updatedAt: new Date(),
      }

      setSessions((sessions) =>
        sessions.map((s) => (s.id === updatedSession.id ? updatedSession : s))
      )

      // Sync to cloud
      chatPersistenceService.saveSession(updatedSession).catch((err) => {
        console.warn('[useChatState] Clear persistence failed:', err)
      })

      return updatedSession
    })
  }, [])

  const startNewSession = useCallback((): void => {
    const newSession = createNewSession()
    setSessions((prev) => [newSession, ...prev])
    setCurrentSession(newSession)

    // Persist new session
    chatPersistenceService.saveSession(newSession).catch((err) => {
      console.warn('[useChatState] New session persistence failed:', err)
    })
  }, [])

  const loadSession = useCallback(
    (sessionId: string): void => {
      const session = sessions.find((s) => s.id === sessionId)
      if (session) {
        setCurrentSession(session)
      }
    },
    [sessions]
  )

  const getSessions = useCallback((): ChatSession[] => {
    return sessions
  }, [sessions])

  const deleteSession = useCallback(
    (sessionId: string): void => {
      setSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== sessionId)

        // If deleting current session, switch to another
        if (currentSession?.id === sessionId) {
          if (filtered.length > 0) {
            setCurrentSession(filtered[0])
          } else {
            // Create a new session if all deleted
            const newSession = createNewSession()
            setCurrentSession(newSession)
            return [newSession]
          }
        }

        return filtered
      })

      // Delete from cloud
      chatPersistenceService.deleteSession(sessionId).catch((err) => {
        console.warn('[useChatState] Delete session persistence failed:', err)
      })
    },
    [currentSession?.id]
  )

  return {
    messages: currentSession?.messages ?? [],
    isLoading,
    currentSession,
    addMessage,
    updateMessage,
    deleteMessage,
    clearMessages,
    startNewSession,
    loadSession,
    getSessions,
    setIsLoading,
    deleteSession,
  }
}

export default useChatState
