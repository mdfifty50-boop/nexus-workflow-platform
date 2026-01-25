/**
 * Chat Component Types
 *
 * TypeScript types for the ChatGPT-style chat interface components.
 */

// ============================================================================
// Message Roles
// ============================================================================

export const MESSAGE_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
} as const

export type MessageRole = (typeof MESSAGE_ROLES)[keyof typeof MESSAGE_ROLES]

// ============================================================================
// Embedded Content Types
// ============================================================================

export const EMBEDDED_CONTENT_TYPES = {
  WORKFLOW_PREVIEW: 'workflow-preview',
  TEMPLATE: 'template',
  INTEGRATION: 'integration',
  FILE: 'file',
} as const

export type EmbeddedContentType = (typeof EMBEDDED_CONTENT_TYPES)[keyof typeof EMBEDDED_CONTENT_TYPES]

export interface EmbeddedContent {
  type: EmbeddedContentType
  id: string
  title: string
  data: unknown
}

// ============================================================================
// Chat Message
// ============================================================================

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  embeddedContent?: EmbeddedContent[]
  isStreaming?: boolean
}

// ============================================================================
// Chat Session
// ============================================================================

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// Component Props
// ============================================================================

export interface ChatContainerProps {
  className?: string
  onToggleDashboard?: () => void
  showDashboardButton?: boolean
}

export interface ChatMessageProps {
  message: ChatMessage
  onCopy?: (content: string) => void
  renderEmbeddedContent?: (content: EmbeddedContent) => React.ReactNode
}

export interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
  maxLength?: number
  showCharacterCount?: boolean
}

export interface ChatHeaderProps {
  onNewChat?: () => void
  onToggleDashboard?: () => void
  onOpenSettings?: () => void
  showDashboardButton?: boolean
  sessionTitle?: string
}

// ============================================================================
// Hook Types
// ============================================================================

export interface UseChatStateReturn {
  messages: ChatMessage[]
  isLoading: boolean
  currentSession: ChatSession | null
  addMessage: (content: string, role: MessageRole) => ChatMessage
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void
  deleteMessage: (id: string) => void
  clearMessages: () => void
  startNewSession: () => void
  loadSession: (sessionId: string) => void
  getSessions: () => ChatSession[]
  setIsLoading: (loading: boolean) => void
}
