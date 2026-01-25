/**
 * CommentThread Component
 *
 * Threaded comments system for workflows with @mentions support.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { OptimizedAvatar } from '@/components/OptimizedAvatar'

// =============================================================================
// TYPES
// =============================================================================

export interface User {
  id: string
  name: string
  avatarUrl?: string
}

export interface Comment {
  id: string
  content: string
  author: User
  createdAt: Date
  updatedAt?: Date
  replies?: Comment[]
  mentions?: string[] // User IDs mentioned
}

export interface CommentThreadProps {
  /** List of comments */
  comments: Comment[]
  /** Current user */
  currentUser: User
  /** Callback when a new comment is added */
  onAddComment: (content: string, parentId?: string) => Promise<void>
  /** Callback when a comment is edited */
  onEditComment?: (commentId: string, content: string) => Promise<void>
  /** Callback when a comment is deleted */
  onDeleteComment?: (commentId: string) => Promise<void>
  /** Users available for @mentions */
  mentionableUsers?: User[]
  /** Callback to search for mentionable users */
  onSearchUsers?: (query: string) => Promise<User[]>
  /** Optional class name */
  className?: string
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CommentThread({
  comments,
  currentUser,
  onAddComment,
  onEditComment,
  onDeleteComment,
  mentionableUsers = [],
  onSearchUsers,
  className = ''
}: CommentThreadProps) {
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = useCallback(async (parentId?: string) => {
    const content = parentId ? newComment : newComment
    if (!content.trim()) return

    setLoading(true)
    try {
      await onAddComment(content.trim(), parentId)
      setNewComment('')
      setReplyingTo(null)
    } catch (err) {
      console.error('Failed to add comment:', err)
    } finally {
      setLoading(false)
    }
  }, [newComment, onAddComment])

  const handleEdit = useCallback(async (commentId: string) => {
    if (!editContent.trim() || !onEditComment) return

    setLoading(true)
    try {
      await onEditComment(commentId, editContent.trim())
      setEditingId(null)
      setEditContent('')
    } catch (err) {
      console.error('Failed to edit comment:', err)
    } finally {
      setLoading(false)
    }
  }, [editContent, onEditComment])

  const handleDelete = useCallback(async (commentId: string) => {
    if (!onDeleteComment) return

    try {
      await onDeleteComment(commentId)
    } catch (err) {
      console.error('Failed to delete comment:', err)
    }
  }, [onDeleteComment])

  const startEditing = useCallback((comment: Comment) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }, [])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Comment input */}
      <CommentInput
        value={newComment}
        onChange={setNewComment}
        onSubmit={() => handleSubmit()}
        loading={loading}
        placeholder="Add a comment..."
        currentUser={currentUser}
        mentionableUsers={mentionableUsers}
        onSearchUsers={onSearchUsers}
      />

      {/* Comments list */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              onReply={(id) => setReplyingTo(id)}
              onEdit={startEditing}
              onDelete={handleDelete}
              isEditing={editingId === comment.id}
              editContent={editContent}
              setEditContent={setEditContent}
              onSaveEdit={() => handleEdit(comment.id)}
              onCancelEdit={() => {
                setEditingId(null)
                setEditContent('')
              }}
              replyingTo={replyingTo}
              onSubmitReply={() => handleSubmit(comment.id)}
              replyValue={replyingTo === comment.id ? newComment : ''}
              setReplyValue={setNewComment}
              onCancelReply={() => setReplyingTo(null)}
              loading={loading}
              mentionableUsers={mentionableUsers}
              onSearchUsers={onSearchUsers}
            />
          ))
        )}
      </div>
    </div>
  )
}

// =============================================================================
// COMMENT INPUT
// =============================================================================

interface CommentInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  loading: boolean
  placeholder?: string
  currentUser: User
  mentionableUsers?: User[]
  onSearchUsers?: (query: string) => Promise<User[]>
  autoFocus?: boolean
}

function CommentInput({
  value,
  onChange,
  onSubmit,
  loading,
  placeholder = 'Write a comment...',
  currentUser,
  mentionableUsers = [],
  onSearchUsers,
  autoFocus = false
}: CommentInputProps) {
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionResults, setMentionResults] = useState<User[]>([])
  const [mentionIndex, setMentionIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Search for mentions
  useEffect(() => {
    if (!showMentions || !mentionQuery) {
      setMentionResults([])
      return
    }

    const searchMentions = async () => {
      if (onSearchUsers) {
        const results = await onSearchUsers(mentionQuery)
        setMentionResults(results)
      } else {
        const filtered = mentionableUsers.filter((user) =>
          user.name.toLowerCase().includes(mentionQuery.toLowerCase())
        )
        setMentionResults(filtered)
      }
    }

    const timer = setTimeout(searchMentions, 200)
    return () => clearTimeout(timer)
  }, [mentionQuery, showMentions, mentionableUsers, onSearchUsers])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    onChange(newValue)

    // Check for @mention trigger
    const cursorPos = e.target.selectionStart
    const textBeforeCursor = newValue.slice(0, cursorPos)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)

    if (mentionMatch) {
      setShowMentions(true)
      setMentionQuery(mentionMatch[1])
      setMentionIndex(0)
    } else {
      setShowMentions(false)
      setMentionQuery('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && mentionResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMentionIndex((i) => (i + 1) % mentionResults.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMentionIndex((i) => (i - 1 + mentionResults.length) % mentionResults.length)
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        insertMention(mentionResults[mentionIndex])
      } else if (e.key === 'Escape') {
        setShowMentions(false)
      }
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      onSubmit()
    }
  }

  const insertMention = (user: User) => {
    const cursorPos = textareaRef.current?.selectionStart || 0
    const textBeforeCursor = value.slice(0, cursorPos)
    const textAfterCursor = value.slice(cursorPos)
    const mentionStart = textBeforeCursor.lastIndexOf('@')
    const newText = textBeforeCursor.slice(0, mentionStart) + `@${user.name} ` + textAfterCursor

    onChange(newText)
    setShowMentions(false)
    setMentionQuery('')

    // Focus and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = mentionStart + user.name.length + 2
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)
  }

  return (
    <div className="relative">
      <div className="flex gap-3">
        <Avatar name={currentUser.name} avatarUrl={currentUser.avatarUrl} size="sm" />
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus={autoFocus}
            rows={2}
            className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
          />

          {/* Mention dropdown */}
          {showMentions && mentionResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-lg z-10 max-h-48 overflow-auto">
              {mentionResults.map((user, index) => (
                <button
                  key={user.id}
                  onClick={() => insertMention(user)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    index === mentionIndex ? 'bg-muted' : 'hover:bg-muted/50'
                  }`}
                >
                  <Avatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />
                  <span className="text-sm font-medium">{user.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <Button onClick={onSubmit} disabled={loading || !value.trim()} size="sm">
          {loading ? <LoadingSpinner className="w-4 h-4" /> : 'Post'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2 ml-11">
        Use @name to mention someone. Press Ctrl+Enter to submit.
      </p>
    </div>
  )
}

// =============================================================================
// COMMENT ITEM
// =============================================================================

interface CommentItemProps {
  comment: Comment
  currentUser: User
  onReply: (id: string) => void
  onEdit: (comment: Comment) => void
  onDelete: (id: string) => void
  isEditing: boolean
  editContent: string
  setEditContent: (content: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  replyingTo: string | null
  onSubmitReply: () => void
  replyValue: string
  setReplyValue: (value: string) => void
  onCancelReply: () => void
  loading: boolean
  mentionableUsers?: User[]
  onSearchUsers?: (query: string) => Promise<User[]>
  depth?: number
}

function CommentItem({
  comment,
  currentUser,
  onReply,
  onEdit,
  onDelete,
  isEditing,
  editContent,
  setEditContent,
  onSaveEdit,
  onCancelEdit,
  replyingTo,
  onSubmitReply,
  replyValue,
  setReplyValue,
  onCancelReply,
  loading,
  mentionableUsers,
  onSearchUsers,
  depth = 0
}: CommentItemProps) {
  const isAuthor = currentUser.id === comment.author.id
  const isReplying = replyingTo === comment.id

  // Format content with mentions highlighted
  const formattedContent = comment.content.replace(
    /@(\w+)/g,
    '<span class="text-primary font-medium">@$1</span>'
  )

  return (
    <div className={depth > 0 ? 'ml-11 mt-3' : ''}>
      <div className="flex gap-3">
        <Avatar name={comment.author.name} avatarUrl={comment.author.avatarUrl} size="sm" />
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={onSaveEdit} disabled={loading || !editContent.trim()}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={onCancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-muted/30 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{comment.author.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                  {comment.updatedAt && (
                    <span className="text-xs text-muted-foreground">(edited)</span>
                  )}
                </div>
                <p
                  className="text-sm text-foreground"
                  dangerouslySetInnerHTML={{ __html: formattedContent }}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 mt-2 ml-1">
                <button
                  onClick={() => onReply(comment.id)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Reply
                </button>
                {isAuthor && (
                  <>
                    <button
                      onClick={() => onEdit(comment)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(comment.id)}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {/* Reply input */}
          {isReplying && !isEditing && (
            <div className="mt-3">
              <CommentInput
                value={replyValue}
                onChange={setReplyValue}
                onSubmit={onSubmitReply}
                loading={loading}
                placeholder={`Reply to ${comment.author.name}...`}
                currentUser={currentUser}
                mentionableUsers={mentionableUsers}
                onSearchUsers={onSearchUsers}
                autoFocus
              />
              <button
                onClick={onCancelReply}
                className="text-xs text-muted-foreground hover:text-foreground mt-2"
              >
                Cancel reply
              </button>
            </div>
          )}

          {/* Nested replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3 border-l-2 border-border pl-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUser={currentUser}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isEditing={false}
                  editContent=""
                  setEditContent={() => {}}
                  onSaveEdit={() => {}}
                  onCancelEdit={() => {}}
                  replyingTo={replyingTo}
                  onSubmitReply={onSubmitReply}
                  replyValue={replyValue}
                  setReplyValue={setReplyValue}
                  onCancelReply={onCancelReply}
                  loading={loading}
                  mentionableUsers={mentionableUsers}
                  onSearchUsers={onSearchUsers}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// HELPERS
// =============================================================================

interface AvatarProps {
  name: string
  avatarUrl?: string
  size?: 'sm' | 'md'
}

function Avatar({ name, avatarUrl, size = 'md' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const sizes = {
    sm: { class: 'w-8 h-8 text-xs', px: 32 },
    md: { class: 'w-10 h-10 text-sm', px: 40 }
  }

  if (avatarUrl) {
    return (
      <OptimizedAvatar
        src={avatarUrl}
        alt={name}
        size={sizes[size].px}
        className={`${sizes[size].class} flex-shrink-0`}
      />
    )
  }

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
    'bg-indigo-500',
    'bg-rose-500'
  ]
  const colorIndex = name.charCodeAt(0) % colors.length

  return (
    <div
      className={`${sizes[size].class} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-medium flex-shrink-0`}
    >
      {initials}
    </div>
  )
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`

  return new Date(date).toLocaleDateString()
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

export default CommentThread
