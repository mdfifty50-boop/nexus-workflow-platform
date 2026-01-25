/**
 * SkipLink Component - Accessibility Skip Navigation
 *
 * Provides a "skip to main content" link that becomes visible on focus,
 * allowing keyboard users to bypass repetitive navigation elements.
 *
 * WCAG 2.1 AA Compliance:
 * - Success Criterion 2.4.1 (Bypass Blocks)
 * - Visible on focus for keyboard users
 * - Proper focus management
 */

import { forwardRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

export interface SkipLinkProps {
  /** Target element ID to skip to (without #) */
  targetId?: string
  /** Custom link text */
  children?: React.ReactNode
  /** Additional CSS classes */
  className?: string
  /** Inline styles */
  style?: React.CSSProperties
}

/**
 * Skip to main content link - appears on focus for keyboard navigation
 *
 * @example
 * ```tsx
 * <SkipLink targetId="main-content" />
 * <header>...</header>
 * <main id="main-content">...</main>
 * ```
 */
export const SkipLink = forwardRef<HTMLAnchorElement, SkipLinkProps>(
  ({ targetId = 'main-content', children = 'Skip to main content', className, style }, ref) => {
    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
        const target = document.getElementById(targetId)
        if (target) {
          // Set tabindex temporarily if not already focusable
          const originalTabIndex = target.getAttribute('tabindex')
          if (!originalTabIndex) {
            target.setAttribute('tabindex', '-1')
          }

          // Focus the target element
          target.focus({ preventScroll: false })

          // Scroll into view with smooth behavior
          target.scrollIntoView({ behavior: 'smooth', block: 'start' })

          // Remove temporary tabindex after focus
          if (!originalTabIndex) {
            // Remove tabindex after a small delay to ensure focus works
            setTimeout(() => {
              target.removeAttribute('tabindex')
            }, 100)
          }
        }
      },
      [targetId]
    )

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLAnchorElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick(e as unknown as React.MouseEvent<HTMLAnchorElement>)
        }
      },
      [handleClick]
    )

    return (
      <a
        ref={ref}
        href={`#${targetId}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          // Visually hidden by default
          'sr-only',
          // Show on focus with high-contrast styling
          'focus:not-sr-only focus:absolute focus:z-[9999]',
          'focus:top-4 focus:left-4',
          'focus:px-4 focus:py-3',
          'focus:text-sm focus:font-semibold',
          // High contrast background for visibility
          'focus:bg-primary focus:text-primary-foreground',
          'focus:rounded-lg focus:shadow-lg',
          // Visible focus ring
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
          // Animation for smooth appearance
          'focus:animate-in focus:fade-in focus:duration-200',
          className
        )}
        style={style}
      >
        {children}
      </a>
    )
  }
)

SkipLink.displayName = 'SkipLink'

/**
 * Multiple skip links for complex page structures
 */
export interface SkipLinksProps {
  links?: Array<{
    targetId: string
    label: string
  }>
  className?: string
}

export function SkipLinks({
  links = [
    { targetId: 'main-content', label: 'Skip to main content' },
    { targetId: 'main-navigation', label: 'Skip to navigation' },
  ],
  className,
}: SkipLinksProps) {
  return (
    <nav
      aria-label="Skip links"
      className={cn('skip-links-container', className)}
    >
      {links.map((link, index) => (
        <SkipLink
          key={link.targetId}
          targetId={link.targetId}
          className={cn(
            // Stack multiple skip links vertically when focused
            index > 0 && 'focus:top-[calc(1rem+3rem*var(--skip-link-index))]'
          )}
          style={{ '--skip-link-index': index } as React.CSSProperties}
        >
          {link.label}
        </SkipLink>
      ))}
    </nav>
  )
}

export default SkipLink
