/**
 * ShareModal Component
 *
 * Modal for sharing workflows with team members.
 * Supports permission levels: view, edit, admin.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OptimizedAvatar } from '@/components/OptimizedImage'

// =============================================================================
// TYPES
// =============================================================================

export type PermissionLevel = 'view' | 'edit' | 'admin'

export interface TeamMember {
  id: string
  name: string
  email: string
  avatarUrl?: string
  permission?: PermissionLevel
}

export interface ShareModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback to close the modal */
  onClose: () => void
  /** Workflow being shared */
  workflow: {
    id: string
    name: string
  }
  /** Current shared members */
  sharedWith?: TeamMember[]
  /** Callback when permissions are updated */
  onShare?: (email: string, permission: PermissionLevel) => Promise<void>
  /** Callback when member is removed */
  onRemove?: (memberId: string) => Promise<void>
  /** Callback to search for team members */
  onSearch?: (query: string) => Promise<TeamMember[]>
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ShareModal({
  isOpen,
  onClose,
  workflow,
  sharedWith = [],
  onShare,
  onRemove,
  onSearch
}: ShareModalProps) {
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState<PermissionLevel>('view')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<TeamMember[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Generate shareable link
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const shareableLink = `${baseUrl}/workflows/${workflow.id}`

  // Handle search
  useEffect(() => {
    if (!email || email.length < 2 || !onSearch) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    const timer = setTimeout(async () => {
      try {
        const results = await onSearch(email)
        setSearchResults(results)
        setShowDropdown(results.length > 0)
      } catch {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [email, onSearch])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEmail('')
      setError(null)
      setSearchResults([])
      setShowDropdown(false)
    }
  }, [isOpen])

  const handleShare = useCallback(async () => {
    if (!email.trim()) {
      setError('Please enter an email address')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await onShare?.(email.trim(), permission)
      setEmail('')
      setShowDropdown(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share workflow')
    } finally {
      setLoading(false)
    }
  }, [email, permission, onShare])

  const handleRemove = useCallback(async (memberId: string) => {
    try {
      await onRemove?.(memberId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member')
    }
  }, [onRemove])

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareableLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const textarea = document.createElement('textarea')
      textarea.value = shareableLink
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [shareableLink])

  const selectMember = useCallback((member: TeamMember) => {
    setEmail(member.email)
    setShowDropdown(false)
    inputRef.current?.focus()
  }, [])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 id="share-modal-title" className="text-xl font-bold">
              Share with Team
            </h2>
            <p className="text-sm text-muted-foreground mt-1 truncate max-w-[300px]">
              {workflow.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] p-2 hover:bg-muted rounded-lg transition-colors flex items-center justify-center touch-manipulation active:scale-95"
            aria-label="Close"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error message */}
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
              {error}
            </div>
          )}

          {/* Invite section */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Invite people</label>
            <div className="flex gap-2">
              <div className="relative flex-1" ref={dropdownRef}>
                <Input
                  ref={inputRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="pr-4"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleShare()
                    }
                  }}
                />

                {/* Search dropdown */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-10 max-h-48 overflow-auto">
                    {searchResults.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => selectMember(member)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left"
                      >
                        <Avatar name={member.name} avatarUrl={member.avatarUrl} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{member.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Permission select */}
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value as PermissionLevel)}
                className="px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="view">Can view</option>
                <option value="edit">Can edit</option>
                <option value="admin">Admin</option>
              </select>

              <Button onClick={handleShare} disabled={loading || !email.trim()}>
                {loading ? (
                  <LoadingSpinner className="w-4 h-4" />
                ) : (
                  'Invite'
                )}
              </Button>
            </div>
          </div>

          {/* Shared members list */}
          {sharedWith.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-medium">People with access</label>
              <div className="space-y-2 max-h-48 overflow-auto">
                {sharedWith.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                  >
                    <Avatar name={member.name} avatarUrl={member.avatarUrl} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <PermissionBadge permission={member.permission || 'view'} />
                      <button
                        onClick={() => handleRemove(member.id)}
                        className="min-w-[44px] min-h-[44px] p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors flex items-center justify-center touch-manipulation active:scale-95"
                        aria-label={`Remove ${member.name}`}
                      >
                        <CloseIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Copy link section */}
          <div className="pt-4 border-t border-border space-y-3">
            <label className="text-sm font-medium">Or share via link</label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={shareableLink}
                readOnly
                className="font-mono text-sm"
              />
              <Button variant="outline" onClick={handleCopyLink}>
                {copied ? (
                  <>
                    <CheckIcon className="w-4 h-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <CopyIcon className="w-4 h-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can view the workflow
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

interface AvatarProps {
  name: string
  avatarUrl?: string
  size?: 'sm' | 'md' | 'lg'
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
    md: { class: 'w-10 h-10 text-sm', px: 40 },
    lg: { class: 'w-12 h-12 text-base', px: 48 }
  }

  if (avatarUrl) {
    return (
      <OptimizedAvatar
        src={avatarUrl}
        alt={name}
        size={sizes[size].px}
        className={sizes[size].class}
      />
    )
  }

  // Generate consistent color from name
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
      className={`${sizes[size].class} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-medium`}
    >
      {initials}
    </div>
  )
}

interface PermissionBadgeProps {
  permission: PermissionLevel
}

function PermissionBadge({ permission }: PermissionBadgeProps) {
  const styles = {
    view: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    edit: 'bg-green-500/10 text-green-500 border-green-500/20',
    admin: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
  }

  const labels = {
    view: 'Viewer',
    edit: 'Editor',
    admin: 'Admin'
  }

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${styles[permission]}`}>
      {labels[permission]}
    </span>
  )
}

// =============================================================================
// ICONS
// =============================================================================

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

export default ShareModal
