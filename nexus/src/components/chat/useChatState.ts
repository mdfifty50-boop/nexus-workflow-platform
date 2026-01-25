/**
 * useChatState Hook
 *
 * Manages chat state including messages, sessions, and persistence.
 * Uses localStorage for session persistence.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
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
// Hook Implementation
// ============================================================================

export function useChatState(): UseChatStateReturn {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const isInitializedRef = useRef(false)

  // Initialize from localStorage on mount
  useEffect(() => {
    if (isInitializedRef.current) return
    isInitializedRef.current = true

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
  }, [])

  // Save sessions to localStorage when they change
  useEffect(() => {
    if (sessions.length > 0) {
      saveSessionsToStorage(sessions)
    }
  }, [sessions])

  // Save current session ID when it changes
  useEffect(() => {
    if (currentSession) {
      saveCurrentSessionIdToStorage(currentSession.id)
    }
  }, [currentSession?.id])

  function createNewSession(): ChatSession {
    return {
      id: generateId(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

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

      return updatedSession
    })
  }, [])

  const startNewSession = useCallback((): void => {
    const newSession = createNewSession()
    setSessions((prev) => [newSession, ...prev])
    setCurrentSession(newSession)
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
  }
}

export default useChatState
