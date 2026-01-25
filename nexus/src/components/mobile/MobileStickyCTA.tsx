import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface MobileStickyCTAProps {
  /** Primary CTA text */
  primaryText: string
  /** Primary CTA action */
  onPrimaryClick: () => void
  /** Optional secondary CTA text */
  secondaryText?: string
  /** Secondary CTA action */
  onSecondaryClick?: () => void
  /** Show loading state on primary button */
  loading?: boolean
  /** Show success state on primary button */
  success?: boolean
  /** Whether the CTA should be visible - controlled externally */
  visible?: boolean
  /** Scroll threshold before showing (default: 200px) */
  scrollThreshold?: number
  /** Left icon for primary button */
  primaryIcon?: React.ReactNode
  /** Hide on scroll down (show on scroll up) */
  hideOnScrollDown?: boolean
  /** Additional info text above buttons */
  infoText?: string
}

export function MobileStickyCTA({
  primaryText,
  onPrimaryClick,
  secondaryText,
  onSecondaryClick,
  loading = false,
  success = false,
  visible,
  scrollThreshold = 200,
  primaryIcon,
  hideOnScrollDown = false,
  infoText,
}: MobileStickyCTAProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [_scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up')
  void _scrollDirection // Reserved for hideOnScrollDown feature

  useEffect(() => {
    // If visibility is controlled externally, use that
    if (visible !== undefined) {
      setIsVisible(visible)
      return
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Determine scroll direction
      if (currentScrollY > lastScrollY) {
        setScrollDirection('down')
      } else {
        setScrollDirection('up')
      }
      setLastScrollY(currentScrollY)

      // Show after scrolling past threshold
      if (currentScrollY > scrollThreshold) {
        if (hideOnScrollDown) {
          // Hide when scrolling down, show when scrolling up
          setIsVisible(currentScrollY < lastScrollY)
        } else {
          setIsVisible(true)
        }
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [visible, scrollThreshold, lastScrollY, hideOnScrollDown])

  // Only show on mobile/tablet
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!isMobile) return null

  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 z-40
        bg-background/95 backdrop-blur-xl
        border-t border-border/50
        px-4 py-3
        transition-all duration-300 ease-out
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
      `}
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
      }}
    >
      {/* Info text */}
      {infoText && (
        <p className="text-xs text-muted-foreground text-center mb-2">
          {infoText}
        </p>
      )}

      {/* CTA Buttons */}
      <div className="flex gap-3 max-w-lg mx-auto">
        {secondaryText && onSecondaryClick && (
          <Button
            variant="outline"
            size="lg"
            onClick={onSecondaryClick}
            className="flex-1"
          >
            {secondaryText}
          </Button>
        )}
        <Button
          variant="cta"
          size="lg"
          onClick={onPrimaryClick}
          loading={loading}
          success={success}
          leftIcon={!loading && !success ? primaryIcon : undefined}
          className={`${secondaryText ? 'flex-1' : 'w-full'}`}
        >
          {primaryText}
        </Button>
      </div>
    </div>
  )
}

// Pre-built variants for common use cases
export function CreateWorkflowStickyCTA({
  onClick,
  loading,
  success,
}: {
  onClick: () => void
  loading?: boolean
  success?: boolean
}) {
  return (
    <MobileStickyCTA
      primaryText="Create Workflow"
      onPrimaryClick={onClick}
      loading={loading}
      success={success}
      infoText="Ready to automate? Get started now"
      primaryIcon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      }
    />
  )
}

export function GetStartedStickyCTA({
  onGetStarted,
  onLearnMore,
}: {
  onGetStarted: () => void
  onLearnMore?: () => void
}) {
  return (
    <MobileStickyCTA
      primaryText="Get Started Free"
      onPrimaryClick={onGetStarted}
      secondaryText={onLearnMore ? "Learn More" : undefined}
      onSecondaryClick={onLearnMore}
      infoText="No credit card required"
      primaryIcon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      }
    />
  )
}

export function SaveChangesStickyCTA({
  onSave,
  onCancel,
  loading,
  success,
  hasChanges = true,
}: {
  onSave: () => void
  onCancel?: () => void
  loading?: boolean
  success?: boolean
  hasChanges?: boolean
}) {
  return (
    <MobileStickyCTA
      primaryText={success ? "Saved!" : "Save Changes"}
      onPrimaryClick={onSave}
      secondaryText={onCancel ? "Cancel" : undefined}
      onSecondaryClick={onCancel}
      loading={loading}
      success={success}
      visible={hasChanges}
      primaryIcon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      }
    />
  )
}

export default MobileStickyCTA
