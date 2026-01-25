/**
 * Share Workflow Modal
 *
 * Modal for sharing workflows via link with copy-to-clipboard functionality.
 */

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'

// =============================================================================
// TYPES
// =============================================================================

export interface ShareWorkflowModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback to close the modal */
  onClose: () => void
  /** Workflow to share */
  workflow: {
    id: string
    name: string
    description?: string
  }
  /** Optional callback when link is copied */
  onCopied?: () => void
}

export type ShareOption = 'link' | 'email' | 'embed'

// =============================================================================
// COMPONENT
// =============================================================================

export function ShareWorkflowModal({
  isOpen,
  onClose,
  workflow,
  onCopied
}: ShareWorkflowModalProps) {
  const [copied, setCopied] = useState(false)
  const [shareOption, setShareOption] = useState<ShareOption>('link')
  const [includeDescription, setIncludeDescription] = useState(true)
  const [expiresIn, setExpiresIn] = useState<'never' | '1d' | '7d' | '30d'>('never')

  // Generate shareable link
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const shareableLink = `${baseUrl}/workflows/${workflow.id}${expiresIn !== 'never' ? `?expires=${expiresIn}` : ''}`

  // Reset copied state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCopied(false)
    }
  }, [isOpen])

  // Handle copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareableLink)
      setCopied(true)
      onCopied?.()

      // Reset after 3 seconds
      setTimeout(() => setCopied(false), 3000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = shareableLink
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }, [shareableLink, onCopied])

  // Handle email share
  const handleEmailShare = useCallback(() => {
    const subject = encodeURIComponent(`Check out this workflow: ${workflow.name}`)
    const body = encodeURIComponent(
      `I wanted to share this workflow with you:\n\n${workflow.name}${
        includeDescription && workflow.description ? `\n\n${workflow.description}` : ''
      }\n\nView it here: ${shareableLink}`
    )
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank')
  }, [workflow, shareableLink, includeDescription])

  // Generate embed code
  const embedCode = `<iframe src="${shareableLink}/embed" width="100%" height="400" frameborder="0" allowfullscreen></iframe>`

  // Handle embed copy
  const handleCopyEmbed = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(embedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      // Fallback
      const textarea = document.createElement('textarea')
      textarea.value = embedCode
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }, [embedCode])

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
              Share Workflow
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Share options tabs */}
          <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
            {[
              { id: 'link' as const, label: 'Link', icon: LinkIcon },
              { id: 'email' as const, label: 'Email', icon: EmailIcon },
              { id: 'embed' as const, label: 'Embed', icon: EmbedIcon }
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setShareOption(option.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  shareOption === option.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <option.icon className="w-4 h-4" />
                {option.label}
              </button>
            ))}
          </div>

          {/* Link sharing */}
          {shareOption === 'link' && (
            <div className="space-y-4">
              {/* Link input */}
              <div className="relative">
                <input
                  type="text"
                  value={shareableLink}
                  readOnly
                  className="w-full px-4 py-3 pr-24 bg-muted/50 border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <Button
                  size="sm"
                  onClick={handleCopy}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 ${
                    copied ? 'bg-green-500 hover:bg-green-600' : ''
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckIcon className="w-4 h-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <CopyIcon className="w-4 h-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              {/* Expiration setting */}
              <div>
                <label className="block text-sm font-medium mb-2">Link expires</label>
                <select
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value as typeof expiresIn)}
                  className="w-full px-4 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="never">Never</option>
                  <option value="1d">In 1 day</option>
                  <option value="7d">In 7 days</option>
                  <option value="30d">In 30 days</option>
                </select>
              </div>
            </div>
          )}

          {/* Email sharing */}
          {shareOption === 'email' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                <input
                  type="checkbox"
                  id="include-desc"
                  checked={includeDescription}
                  onChange={(e) => setIncludeDescription(e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor="include-desc" className="text-sm">
                  Include workflow description in email
                </label>
              </div>

              <Button onClick={handleEmailShare} className="w-full">
                <EmailIcon className="w-4 h-4 mr-2" />
                Open Email Client
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                This will open your default email client with a pre-filled message
              </p>
            </div>
          )}

          {/* Embed code */}
          {shareOption === 'embed' && (
            <div className="space-y-4">
              <div className="relative">
                <textarea
                  value={embedCode}
                  readOnly
                  rows={3}
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <Button onClick={handleCopyEmbed} variant="outline" className="w-full">
                {copied ? (
                  <>
                    <CheckIcon className="w-4 h-4 mr-2" />
                    Embed Code Copied!
                  </>
                ) : (
                  <>
                    <CopyIcon className="w-4 h-4 mr-2" />
                    Copy Embed Code
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Paste this code into your website to embed the workflow
              </p>
            </div>
          )}

          {/* Social share buttons */}
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">Or share via</p>
            <div className="flex gap-2">
              <SocialShareButton
                platform="twitter"
                url={shareableLink}
                title={workflow.name}
              />
              <SocialShareButton
                platform="linkedin"
                url={shareableLink}
                title={workflow.name}
              />
              <SocialShareButton
                platform="facebook"
                url={shareableLink}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// SOCIAL SHARE BUTTON
// =============================================================================

interface SocialShareButtonProps {
  platform: 'twitter' | 'linkedin' | 'facebook'
  url: string
  title?: string
}

function SocialShareButton({ platform, url, title }: SocialShareButtonProps) {
  const handleShare = () => {
    const encodedUrl = encodeURIComponent(url)
    const encodedTitle = encodeURIComponent(title || '')

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
    }

    window.open(shareUrls[platform], '_blank', 'width=600,height=400')
  }

  const icons = {
    twitter: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    linkedin: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    facebook: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    )
  }

  const colors = {
    twitter: 'hover:bg-sky-500/10 hover:text-sky-500 hover:border-sky-500/30',
    linkedin: 'hover:bg-blue-600/10 hover:text-blue-500 hover:border-blue-500/30',
    facebook: 'hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-600/30'
  }

  return (
    <button
      onClick={handleShare}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-lg transition-all ${colors[platform]}`}
      aria-label={`Share on ${platform}`}
    >
      {icons[platform]}
    </button>
  )
}

// =============================================================================
// ICONS
// =============================================================================

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  )
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function EmbedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
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

export default ShareWorkflowModal
