import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

interface PageTransitionProps {
  children: ReactNode
  /** Transition type */
  type?: 'fade' | 'slide-up' | 'slide-left' | 'scale' | 'blur'
  /** Duration in ms */
  duration?: number
  /** Show loading skeleton during transition */
  showSkeleton?: boolean
}

/**
 * Check if user prefers reduced motion (accessibility)
 */
function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const listener = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', listener)
    return () => mediaQuery.removeEventListener('change', listener)
  }, [])

  return prefersReducedMotion
}

/**
 * LoadingSkeleton - Displayed during page transitions
 * Mobile-optimized with GPU acceleration
 */
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Header skeleton */}
      <div className="mb-8 space-y-4">
        <div className="h-8 w-48 bg-slate-800/50 rounded-lg animate-pulse"
          style={{ transform: 'translateZ(0)' }}
        />
        <div className="h-4 w-64 bg-slate-800/30 rounded animate-pulse"
          style={{ transform: 'translateZ(0)' }}
        />
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-slate-800/30 rounded-xl p-6 space-y-3"
            style={{
              transform: 'translateZ(0)',
              animationDelay: `${i * 50}ms`
            }}
          >
            <div className="h-6 w-3/4 bg-slate-700/50 rounded animate-pulse" />
            <div className="h-4 w-full bg-slate-700/30 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-slate-700/30 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * PageTransition - Smooth page transitions between routes
 * Features:
 * - Smooth fade/slide transitions
 * - Loading skeleton states
 * - 60fps mobile performance (GPU-accelerated)
 * - Reduced motion support for accessibility
 * - React Router integration
 */
export function PageTransition({
  children,
  type = 'fade',
  duration = 300,
  showSkeleton = false
}: PageTransitionProps) {
  const location = useLocation()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [transitionStage, setTransitionStage] = useState<'enter' | 'exit' | 'idle'>('idle')
  const [isLoading, setIsLoading] = useState(false)
  const prefersReducedMotion = usePrefersReducedMotion()

  // Use simpler transitions if reduced motion is preferred
  const effectiveType = prefersReducedMotion ? 'fade' : type
  const effectiveDuration = prefersReducedMotion ? 150 : duration

  useEffect(() => {
    // Start exit animation
    setTransitionStage('exit')
    if (showSkeleton) {
      setIsLoading(true)
    }

    const exitTimeout = setTimeout(() => {
      // Update children after exit
      setDisplayChildren(children)
      // Start enter animation
      setTransitionStage('enter')
    }, effectiveDuration / 2)

    const enterTimeout = setTimeout(() => {
      setTransitionStage('idle')
      setIsLoading(false)
    }, effectiveDuration)

    return () => {
      clearTimeout(exitTimeout)
      clearTimeout(enterTimeout)
    }
  }, [location.pathname, children, effectiveDuration, showSkeleton])

  const transitionStyles = {
    fade: {
      exit: 'opacity-0',
      enter: 'opacity-0',
      idle: 'opacity-100'
    },
    'slide-up': {
      exit: 'opacity-0 translate-y-4',
      enter: 'opacity-0 -translate-y-4',
      idle: 'opacity-100 translate-y-0'
    },
    'slide-left': {
      exit: 'opacity-0 translate-x-8',
      enter: 'opacity-0 -translate-x-8',
      idle: 'opacity-100 translate-x-0'
    },
    scale: {
      exit: 'opacity-0 scale-95',
      enter: 'opacity-0 scale-105',
      idle: 'opacity-100 scale-100'
    },
    blur: {
      exit: 'opacity-0 blur-sm',
      enter: 'opacity-0 blur-sm',
      idle: 'opacity-100 blur-0'
    }
  }

  return (
    <>
      {isLoading && showSkeleton && transitionStage === 'exit' && <LoadingSkeleton />}
      <div
        className={`page-transition-wrapper transition-all ${transitionStyles[effectiveType][transitionStage]}`}
        style={{
          transitionDuration: `${effectiveDuration / 2}ms`,
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
          // GPU acceleration for 60fps on mobile
          transform: 'translateZ(0)',
          willChange: transitionStage !== 'idle' ? 'opacity, transform' : 'auto',
          display: isLoading && showSkeleton ? 'none' : 'block'
        }}
      >
        {displayChildren}
      </div>
    </>
  )
}

/**
 * AnimatedPage - Simple wrapper that animates on mount
 * Use for pages that don't need route-aware transitions
 * Features:
 * - Staggered entrance animations
 * - Reduced motion support
 * - GPU acceleration for mobile performance
 */
export function AnimatedPage({
  children,
  animation = 'fade-up',
  delay = 0,
  className = ''
}: {
  children: ReactNode
  animation?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'scale-up' | 'blur-in'
  delay?: number
  className?: string
}) {
  const [mounted, setMounted] = useState(false)
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 10 + delay)
    return () => clearTimeout(timer)
  }, [delay])

  // Simplify animations if reduced motion is preferred
  const effectiveAnimation = prefersReducedMotion ? 'fade-up' : animation

  const animationClasses = {
    'fade-up': mounted
      ? 'opacity-100 translate-y-0'
      : 'opacity-0 translate-y-6',
    'fade-down': mounted
      ? 'opacity-100 translate-y-0'
      : 'opacity-0 -translate-y-6',
    'fade-left': mounted
      ? 'opacity-100 translate-x-0'
      : 'opacity-0 translate-x-6',
    'fade-right': mounted
      ? 'opacity-100 translate-x-0'
      : 'opacity-0 -translate-x-6',
    'scale-up': mounted
      ? 'opacity-100 scale-100'
      : 'opacity-0 scale-95',
    'blur-in': mounted
      ? 'opacity-100 blur-0'
      : 'opacity-0 blur-sm'
  }

  return (
    <div
      className={`transition-all ${prefersReducedMotion ? 'duration-200' : 'duration-500'} ease-out ${animationClasses[effectiveAnimation]} ${className}`}
      style={{
        // GPU acceleration for smooth 60fps animations
        transform: 'translateZ(0)',
        willChange: mounted ? 'auto' : 'opacity, transform'
      }}
    >
      {children}
    </div>
  )
}

/**
 * PageFadeIn - Minimal fade-in for route content
 * Lightweight alternative when you just need a simple fade
 * Includes reduced motion and GPU acceleration support
 */
export function PageFadeIn({ children, className = '' }: { children: ReactNode; className?: string }) {
  const prefersReducedMotion = usePrefersReducedMotion()

  return (
    <div className={`animate-page-fade-in ${className}`}>
      {children}
      <style>{`
        @keyframes pageFadeIn {
          from {
            opacity: 0;
            transform: ${prefersReducedMotion ? 'translateY(0)' : 'translateY(8px)'} translateZ(0);
          }
          to {
            opacity: 1;
            transform: translateY(0) translateZ(0);
          }
        }
        .animate-page-fade-in {
          animation: pageFadeIn ${prefersReducedMotion ? '0.2s' : '0.4s'} cubic-bezier(0.4, 0, 0.2, 1) forwards;
          will-change: opacity, transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-page-fade-in {
            animation-duration: 0.2s;
          }
          @keyframes pageFadeIn {
            from {
              opacity: 0;
              transform: translateY(0) translateZ(0);
            }
          }
        }
      `}</style>
    </div>
  )
}

/**
 * CrossfadeTransition - Smooth crossfade between route changes
 * Maintains previous content during transition
 * Features:
 * - Seamless crossfade effect
 * - Reduced motion support
 * - GPU-accelerated for mobile performance
 */
export function CrossfadeTransition({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [current, setCurrent] = useState({ key: location.key, children })
  const [isTransitioning, setIsTransitioning] = useState(false)
  const prefersReducedMotion = usePrefersReducedMotion()

  const duration = prefersReducedMotion ? 100 : 200

  useEffect(() => {
    if (location.key !== current.key) {
      setIsTransitioning(true)

      const timeout = setTimeout(() => {
        setCurrent({ key: location.key, children })
        setIsTransitioning(false)
      }, duration)

      return () => clearTimeout(timeout)
    }
  }, [location.key, children, current.key, duration])

  return (
    <div className="relative">
      {/* Outgoing content */}
      {isTransitioning && (
        <div
          className="absolute inset-0 transition-opacity pointer-events-none"
          style={{
            opacity: 0.5,
            transitionDuration: `${duration}ms`,
            transform: 'translateZ(0)',
            willChange: 'opacity'
          }}
        >
          {current.children}
        </div>
      )}
      {/* Incoming content */}
      <div
        className={`transition-opacity ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          transitionDuration: `${duration}ms`,
          transform: 'translateZ(0)',
          willChange: isTransitioning ? 'opacity' : 'auto'
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default PageTransition
