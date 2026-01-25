/**
 * ChatMessage Component
 *
 * Displays individual chat messages with support for:
 * - User and assistant message styling
 * - Markdown rendering for AI responses
 * - Copy to clipboard functionality
 * - Embedded content slots (workflow previews, etc.)
 * - Streaming indicator
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Copy, Check, User, Sparkles } from 'lucide-react'
import type { ChatMessage as ChatMessageType, EmbeddedContent } from './types'

// ============================================================================
// Types
// ============================================================================

// Clarifying options data structure
interface ClarifyingOptionsData {
  field: string
  options: string[]
  remainingQuestions: Array<{ question: string; options: string[]; field: string }>
}

interface ChatMessageProps {
  message: ChatMessageType
  onCopy?: (content: string) => void
  renderEmbeddedContent?: (content: EmbeddedContent) => React.ReactNode
  renderWorkflowPreview?: (workflowId: string) => React.ReactNode
  renderCustomIntegration?: (appName: string) => React.ReactNode
  renderClarifyingOptions?: (data: ClarifyingOptionsData) => React.ReactNode
  className?: string
}

// ============================================================================
// Markdown Renderer (Basic)
// ============================================================================

function renderMarkdown(content: string): React.ReactNode {
  // Split by code blocks first
  const parts = content.split(/(```[\s\S]*?```)/g)

  return parts.map((part, index) => {
    // Code block
    if (part.startsWith('```') && part.endsWith('```')) {
      const codeContent = part.slice(3, -3)
      const firstNewline = codeContent.indexOf('\n')
      const language = firstNewline > 0 ? codeContent.slice(0, firstNewline).trim() : ''
      const code = firstNewline > 0 ? codeContent.slice(firstNewline + 1) : codeContent

      return (
        <pre
          key={index}
          className="my-3 rounded-xl bg-surface-900 dark:bg-surface-950 p-4 overflow-x-auto border border-surface-700/50"
        >
          {language && (
            <div className="text-xs text-surface-400 mb-2 uppercase tracking-wide font-medium">
              {language}
            </div>
          )}
          <code className="text-sm text-surface-100 font-mono whitespace-pre">
            {code}
          </code>
        </pre>
      )
    }

    // Regular text - process inline markdown
    return (
      <span key={index}>
        {part.split('\n').map((line, lineIndex, lines) => (
          <React.Fragment key={lineIndex}>
            {renderInlineMarkdown(line)}
            {lineIndex < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </span>
    )
  })
}

function renderInlineMarkdown(text: string): React.ReactNode {
  // Process inline markdown: bold, italic, inline code
  // Order matters: process bold (**) before italic (*) to avoid conflicts

  type Segment = { type: 'text' | 'bold' | 'italic' | 'code'; content: string; key: number }
  const segments: Segment[] = []

  // Combined regex to match bold (**text**), italic (*text*), or inline code (`text`)
  // Bold must be matched before italic
  const combinedRegex = /(\*\*[^*]+\*\*)|(`[^`]+`)|(\*[^*]+\*)/g

  let lastIndex = 0
  let keyCounter = 0
  let match: RegExpExecArray | null

  while ((match = combinedRegex.exec(text)) !== null) {
    // Add preceding plain text
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
        key: keyCounter++
      })
    }

    const matchedText = match[0]

    if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
      // Bold
      segments.push({
        type: 'bold',
        content: matchedText.slice(2, -2),
        key: keyCounter++
      })
    } else if (matchedText.startsWith('`') && matchedText.endsWith('`')) {
      // Inline code
      segments.push({
        type: 'code',
        content: matchedText.slice(1, -1),
        key: keyCounter++
      })
    } else if (matchedText.startsWith('*') && matchedText.endsWith('*')) {
      // Italic
      segments.push({
        type: 'italic',
        content: matchedText.slice(1, -1),
        key: keyCounter++
      })
    }

    lastIndex = match.index + matchedText.length
  }

  // Add remaining plain text
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex),
      key: keyCounter++
    })
  }

  // Render segments
  if (segments.length === 0) {
    return text
  }

  return segments.map((segment) => {
    switch (segment.type) {
      case 'bold':
        return <strong key={segment.key} className="font-semibold">{segment.content}</strong>
      case 'italic':
        return <em key={segment.key}>{segment.content}</em>
      case 'code':
        return (
          <code
            key={segment.key}
            className="px-1.5 py-0.5 rounded-md bg-surface-200 dark:bg-surface-700 text-sm font-mono text-nexus-600 dark:text-nexus-400"
          >
            {segment.content}
          </code>
        )
      default:
        return <React.Fragment key={segment.key}>{segment.content}</React.Fragment>
    }
  })
}

// ============================================================================
// Streaming Indicator
// ============================================================================

function StreamingIndicator(): React.ReactElement {
  return (
    <span className="inline-flex items-center gap-1 ml-1">
      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </span>
  )
}

// ============================================================================
// ChatMessage Component
// ============================================================================

// Regex to match workflow preview markers
const WORKFLOW_PREVIEW_REGEX = /\[WORKFLOW_PREVIEW:([^\]]+)\]/g
// Regex to match custom integration markers
const CUSTOM_INTEGRATION_REGEX = /\[CUSTOM_INTEGRATION:([^\]]+)\]/g
// Regex to match clarifying options markers (Base64 encoded to avoid parsing issues)
const CLARIFYING_OPTIONS_REGEX = /\[CLARIFYING_OPTIONS_B64:([A-Za-z0-9+/=]+)\]/g

export function ChatMessage({
  message,
  onCopy,
  renderEmbeddedContent,
  renderWorkflowPreview,
  renderCustomIntegration,
  renderClarifyingOptions,
  className,
}: ChatMessageProps): React.ReactElement {
  const [copied, setCopied] = React.useState(false)
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  // Process content to extract and render workflow previews, custom integrations, and clarifying options
  const renderContentWithEmbedded = React.useCallback((content: string): React.ReactNode => {
    // Combined regex to match all types of markers (clarifying options use Base64 encoding)
    const COMBINED_REGEX = /\[WORKFLOW_PREVIEW:([^\]]+)\]|\[CUSTOM_INTEGRATION:([^\]]+)\]|\[CLARIFYING_OPTIONS_B64:([A-Za-z0-9+/=]+)\]/g

    // Remove markers if no renderers provided
    if (!renderWorkflowPreview && !renderCustomIntegration && !renderClarifyingOptions) {
      return renderMarkdown(
        content
          .replace(WORKFLOW_PREVIEW_REGEX, '')
          .replace(CUSTOM_INTEGRATION_REGEX, '')
          .replace(CLARIFYING_OPTIONS_REGEX, '')
      )
    }

    // Split content by markers
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null
    let partKey = 0

    // Reset regex lastIndex
    COMBINED_REGEX.lastIndex = 0

    while ((match = COMBINED_REGEX.exec(content)) !== null) {
      // Add text before the marker
      if (match.index > lastIndex) {
        parts.push(
          <React.Fragment key={`text-${partKey++}`}>
            {renderMarkdown(content.slice(lastIndex, match.index))}
          </React.Fragment>
        )
      }

      // Check which type of marker was matched
      if (match[1] && renderWorkflowPreview) {
        // Workflow preview marker
        const workflowId = match[1]
        parts.push(
          <div key={`workflow-${partKey++}`} className="my-4">
            {renderWorkflowPreview(workflowId)}
          </div>
        )
      } else if (match[2] && renderCustomIntegration) {
        // Custom integration marker
        const appName = match[2]
        parts.push(
          <div key={`integration-${partKey++}`} className="my-4">
            {renderCustomIntegration(appName)}
          </div>
        )
      } else if (match[3] && renderClarifyingOptions) {
        // Clarifying options marker (Base64 encoded)
        try {
          // Decode Base64, then parse JSON
          const decodedJson = atob(match[3])
          const optionsData = JSON.parse(decodedJson) as ClarifyingOptionsData
          parts.push(
            <div key={`clarifying-${partKey++}`} className="my-4">
              {renderClarifyingOptions(optionsData)}
            </div>
          )
        } catch (e) {
          console.error('[ChatMessage] Failed to parse clarifying options:', e)
        }
      }

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <React.Fragment key={`text-${partKey++}`}>
          {renderMarkdown(content.slice(lastIndex))}
        </React.Fragment>
      )
    }

    return parts.length > 0 ? parts : renderMarkdown(content)
  }, [renderWorkflowPreview, renderCustomIntegration, renderClarifyingOptions])

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      onCopy?.(message.content)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      void 0
    }
  }, [message.content, onCopy])

  const formattedTime = React.useMemo(() => {
    return message.timestamp.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [message.timestamp])

  return (
    <div
      className={cn(
        'group flex gap-3 sm:gap-4 px-3 sm:px-4 py-4 sm:py-6 transition-all duration-200',
        isUser
          ? 'bg-transparent'
          : 'bg-surface-800/30 dark:bg-surface-900/50 border-l-2 border-nexus-500/30',
        className
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div
          className={cn(
            'w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg',
            isUser
              ? 'bg-gradient-to-br from-blue-500 to-purple-600'
              : 'bg-gradient-to-br from-nexus-500 to-accent-nexus-500'
          )}
        >
          {isUser ? (
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          ) : (
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          )}
        </div>
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-surface-100">
            {isUser ? 'You' : 'Nexus AI'}
          </span>
          <span className="text-xs text-surface-400">
            {formattedTime}
          </span>
          {isAssistant && (
            <span className="flex items-center gap-1 text-xs text-nexus-400">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Online
            </span>
          )}
        </div>

        {/* Content */}
        <div
          className={cn(
            'text-surface-200 leading-relaxed',
            isAssistant && 'prose prose-invert max-w-none prose-sm prose-p:text-surface-200 prose-headings:text-surface-100 prose-strong:text-surface-100 prose-a:text-nexus-400 hover:prose-a:text-nexus-300'
          )}
        >
          {isAssistant ? renderContentWithEmbedded(message.content) : message.content}
          {message.isStreaming && <StreamingIndicator />}
        </div>

        {/* Embedded Content */}
        {message.embeddedContent && message.embeddedContent.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.embeddedContent.map((content) => (
              <div key={content.id}>
                {renderEmbeddedContent ? (
                  renderEmbeddedContent(content)
                ) : (
                  <div className="p-3 rounded-xl border border-surface-600/50 bg-surface-800/50 backdrop-blur-sm">
                    <div className="text-sm font-medium text-surface-100">
                      {content.title}
                    </div>
                    <div className="text-xs text-surface-400 mt-1">
                      {content.type}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Copy Button */}
        {!message.isStreaming && (
          <button
            onClick={handleCopy}
            className={cn(
              'flex items-center gap-1.5 text-xs text-surface-400',
              'hover:text-surface-200',
              'opacity-0 group-hover:opacity-100 transition-all duration-200',
              'mt-2 px-2 py-1 -ml-1 rounded-lg hover:bg-surface-700/50'
            )}
            aria-label={copied ? 'Copied' : 'Copy message'}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

export default ChatMessage
