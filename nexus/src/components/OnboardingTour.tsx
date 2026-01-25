import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from './ui/button'

// =============================================================================
// ONBOARDING TOUR COMPONENT
// =============================================================================
// Provides a step-by-step guided tour highlighting key features of the app.
// Tour progress is saved to localStorage so users only see it once.
// =============================================================================

const TOUR_COMPLETED_KEY = 'nexus_tour_completed'
const TOUR_STEP_KEY = 'nexus_tour_step'

interface TourStep {
  id: string
  title: string
  description: string
  target: string // CSS selector for the element to highlight
  position: 'top' | 'bottom' | 'left' | 'right'
  spotlightPadding?: number
  route?: string // Optional route to navigate to for this step
}

const DEFAULT_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Nexus!',
    description: 'Let me show you around. This quick tour will help you get started with workflow automation.',
    target: 'body',
    position: 'bottom',
    spotlightPadding: 0,
  },
  {
    id: 'sidebar',
    title: 'Navigation Sidebar',
    description: 'Access all your projects, workflows, templates, and settings from the sidebar. Everything is just one click away.',
    target: '[data-tour="sidebar"]',
    position: 'right',
    spotlightPadding: 10,
  },
  {
    id: 'dashboard-stats',
    title: 'Dashboard Overview',
    description: 'See your workflow statistics at a glance - active workflows, executions, and time saved.',
    target: '[data-tour="dashboard-stats"]',
    position: 'bottom',
    spotlightPadding: 20,
  },
  {
    id: 'create-workflow',
    title: 'Create Your First Workflow',
    description: 'Click here to create a new workflow. You can start from scratch or use a template.',
    target: '[data-tour="create-workflow"]',
    position: 'bottom',
    spotlightPadding: 10,
  },
  {
    id: 'templates',
    title: 'Workflow Templates',
    description: 'Browse pre-built templates for common automation tasks. Save hours of setup time!',
    target: '[data-tour="templates"]',
    position: 'left',
    spotlightPadding: 10,
  },
  {
    id: 'ai-assistant',
    title: 'AI Assistant',
    description: 'Need help? Chat with the AI assistant for workflow suggestions, troubleshooting, and guidance.',
    target: '[data-tour="ai-assistant"]',
    position: 'left',
    spotlightPadding: 10,
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    description: 'Press ? anytime to see all available keyboard shortcuts. Power users love this!',
    target: 'body',
    position: 'bottom',
    spotlightPadding: 0,
  },
]

interface OnboardingTourProps {
  /** Custom tour steps. Uses default steps if not provided */
  steps?: TourStep[]
  /** Called when tour is completed or skipped */
  onComplete?: () => void
  /** Force show tour even if completed before */
  forceShow?: boolean
  /** Allow skipping the tour */
  allowSkip?: boolean
}

export function OnboardingTour({
  steps = DEFAULT_TOUR_STEPS,
  onComplete,
  forceShow = false,
  allowSkip = true,
}: OnboardingTourProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const tooltipRef = useRef<HTMLDivElement>(null)

  const currentStep = steps[currentStepIndex]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === steps.length - 1

  // Check if tour should be shown
  useEffect(() => {
    const completed = localStorage.getItem(TOUR_COMPLETED_KEY) === 'true'
    const savedStep = parseInt(localStorage.getItem(TOUR_STEP_KEY) || '0', 10)

    if (forceShow || !completed) {
      setIsVisible(true)
      if (savedStep > 0 && savedStep < steps.length) {
        setCurrentStepIndex(savedStep)
      }
    }
  }, [forceShow, steps.length])

  // Update spotlight position when step changes
  const updateSpotlight = useCallback(() => {
    if (!currentStep) return

    const targetElement = document.querySelector(currentStep.target)

    if (targetElement && currentStep.target !== 'body') {
      const rect = targetElement.getBoundingClientRect()
      const padding = currentStep.spotlightPadding || 0

      setSpotlightRect(new DOMRect(
        rect.left - padding,
        rect.top - padding,
        rect.width + padding * 2,
        rect.height + padding * 2
      ))

      // Calculate tooltip position
      const tooltipWidth = 320
      const tooltipHeight = 180
      let top = 0
      let left = 0

      switch (currentStep.position) {
        case 'top':
          top = rect.top - tooltipHeight - 20
          left = rect.left + rect.width / 2 - tooltipWidth / 2
          break
        case 'bottom':
          top = rect.bottom + 20
          left = rect.left + rect.width / 2 - tooltipWidth / 2
          break
        case 'left':
          top = rect.top + rect.height / 2 - tooltipHeight / 2
          left = rect.left - tooltipWidth - 20
          break
        case 'right':
          top = rect.top + rect.height / 2 - tooltipHeight / 2
          left = rect.right + 20
          break
      }

      // Keep tooltip in viewport
      top = Math.max(20, Math.min(window.innerHeight - tooltipHeight - 20, top))
      left = Math.max(20, Math.min(window.innerWidth - tooltipWidth - 20, left))

      setTooltipPosition({ top, left })
    } else {
      // Center tooltip for body target
      setSpotlightRect(null)
      setTooltipPosition({
        top: window.innerHeight / 2 - 90,
        left: window.innerWidth / 2 - 160,
      })
    }
  }, [currentStep])

  useEffect(() => {
    if (isVisible) {
      updateSpotlight()
      window.addEventListener('resize', updateSpotlight)
      window.addEventListener('scroll', updateSpotlight)
    }

    return () => {
      window.removeEventListener('resize', updateSpotlight)
      window.removeEventListener('scroll', updateSpotlight)
    }
  }, [isVisible, updateSpotlight])

  // Save progress
  useEffect(() => {
    if (isVisible) {
      localStorage.setItem(TOUR_STEP_KEY, currentStepIndex.toString())
    }
  }, [currentStepIndex, isVisible])

  const handleNext = () => {
    if (isLastStep) {
      handleComplete()
    } else {
      setCurrentStepIndex(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }

  const handleComplete = () => {
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true')
    localStorage.removeItem(TOUR_STEP_KEY)
    setIsVisible(false)
    onComplete?.()
  }

  const handleSkip = () => {
    handleComplete()
  }

  if (!isVisible || !currentStep) return null

  return (
    <div className="fixed inset-0 z-[100]" aria-modal="true" role="dialog">
      {/* Overlay with spotlight cutout */}
      <div className="absolute inset-0">
        <svg className="w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {spotlightRect && (
                <rect
                  x={spotlightRect.x}
                  y={spotlightRect.y}
                  width={spotlightRect.width}
                  height={spotlightRect.height}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-mask)"
          />
        </svg>
      </div>

      {/* Spotlight border */}
      {spotlightRect && (
        <div
          className="absolute border-2 border-primary rounded-lg pointer-events-none animate-pulse"
          style={{
            top: spotlightRect.y,
            left: spotlightRect.x,
            width: spotlightRect.width,
            height: spotlightRect.height,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute w-80 animate-in fade-in zoom-in-95 duration-200"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
              style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Header */}
          <div className="p-4 pb-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  Step {currentStepIndex + 1} of {steps.length}
                </div>
                <h3 className="font-bold">{currentStep.title}</h3>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 pb-4">
            <p className="text-sm text-muted-foreground">{currentStep.description}</p>
          </div>

          {/* Actions */}
          <div className="p-4 pt-0 flex items-center justify-between gap-3">
            <div className="flex gap-2">
              {!isFirstStep && (
                <Button variant="outline" size="sm" onClick={handlePrev}>
                  Back
                </Button>
              )}
              {allowSkip && isFirstStep && (
                <Button variant="ghost" size="sm" onClick={handleSkip}>
                  Skip tour
                </Button>
              )}
            </div>
            <Button size="sm" onClick={handleNext}>
              {isLastStep ? 'Get Started' : 'Next'}
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Arrow pointing to target */}
        {spotlightRect && (
          <div
            className={`absolute w-3 h-3 bg-card border-border rotate-45 ${
              currentStep.position === 'top' ? 'bottom-[-6px] border-b border-r left-1/2 -translate-x-1/2' :
              currentStep.position === 'bottom' ? 'top-[-6px] border-t border-l left-1/2 -translate-x-1/2' :
              currentStep.position === 'left' ? 'right-[-6px] border-r border-t top-1/2 -translate-y-1/2' :
              'left-[-6px] border-l border-b top-1/2 -translate-y-1/2'
            }`}
          />
        )}
      </div>

      {/* Keyboard hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/60">
        Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Esc</kbd> to exit tour
      </div>

      {/* Handle escape key */}
      <KeyHandler onEscape={handleSkip} />
    </div>
  )
}

// Key handler component
function KeyHandler({ onEscape }: { onEscape: () => void }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onEscape])

  return null
}

// =============================================================================
// TOUR TRIGGER BUTTON
// =============================================================================

interface TourTriggerProps {
  onClick: () => void
  className?: string
}

export function TourTriggerButton({ onClick, className = '' }: TourTriggerProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground
        hover:text-foreground hover:bg-muted rounded-lg transition-colors
        ${className}
      `}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Take a Tour
    </button>
  )
}

// =============================================================================
// HOOK FOR MANAGING TOUR STATE
// =============================================================================

export function useTour() {
  const [showTour, setShowTour] = useState(false)

  const startTour = () => {
    localStorage.removeItem(TOUR_COMPLETED_KEY)
    localStorage.removeItem(TOUR_STEP_KEY)
    setShowTour(true)
  }

  const resetTour = () => {
    localStorage.removeItem(TOUR_COMPLETED_KEY)
    localStorage.removeItem(TOUR_STEP_KEY)
  }

  const isTourCompleted = () => {
    return localStorage.getItem(TOUR_COMPLETED_KEY) === 'true'
  }

  return {
    showTour,
    setShowTour,
    startTour,
    resetTour,
    isTourCompleted,
  }
}
