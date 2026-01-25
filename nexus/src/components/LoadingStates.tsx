/**
 * LoadingStates - Comprehensive loading state components
 *
 * This module provides various loading state components including:
 * - Page loading with animated logo
 * - Skeleton loaders for different content types
 * - Progress indicators for multi-step processes
 * - Inline loading states for buttons and forms
 * - Mobile-optimized loading overlays
 */

import { memo, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

// =============================================================================
// ANIMATED LOGO LOADER
// =============================================================================

interface LogoLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  className?: string
}

export const LogoLoader = memo(function LogoLoader({
  size = 'md',
  message,
  className = ''
}: LogoLoaderProps) {
  const sizes = {
    sm: { logo: 'w-8 h-8', ring: 'w-12 h-12', text: 'text-xs' },
    md: { logo: 'w-12 h-12', ring: 'w-16 h-16', text: 'text-sm' },
    lg: { logo: 'w-16 h-16', ring: 'w-24 h-24', text: 'text-base' }
  }

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div className="relative">
        {/* Outer spinning ring */}
        <div
          className={cn(
            sizes[size].ring,
            'absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-500 border-r-purple-500 animate-spin'
          )}
          style={{ animationDuration: '1s' }}
        />
        {/* Inner pulsing logo */}
        <div className={cn(
          sizes[size].logo,
          'relative flex items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 animate-pulse'
        )}>
          <span className="text-2xl">✨</span>
        </div>
      </div>
      {message && (
        <p className={cn(sizes[size].text, 'text-slate-400 animate-pulse')}>
          {message}
        </p>
      )}
    </div>
  )
})

// =============================================================================
// PAGE LOADING
// =============================================================================

interface PageLoadingProps {
  message?: string
  variant?: 'default' | 'minimal' | 'branded'
}

export const PageLoading = memo(function PageLoading({
  message = 'Loading...',
  variant = 'default'
}: PageLoadingProps) {
  if (variant === 'minimal') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    )
  }

  if (variant === 'branded') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <LogoLoader size="lg" message={message} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/30 rounded-full" />
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
        </div>
        <p className="text-muted-foreground animate-pulse">{message}</p>
      </div>
    </div>
  )
})

// =============================================================================
// PAGE TRANSITION
// =============================================================================

interface PageTransitionProps {
  children: ReactNode
  isLoading?: boolean
  fallback?: ReactNode
}

export const PageTransition = memo(function PageTransition({
  children,
  isLoading = false,
  fallback
}: PageTransitionProps) {
  if (isLoading) {
    return fallback || <PageLoading variant="branded" />
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      {children}
    </div>
  )
})

// =============================================================================
// SKELETON COMPONENTS
// =============================================================================

interface SkeletonBaseProps {
  className?: string
  animation?: 'shimmer' | 'pulse' | 'wave'
}

const SkeletonBase = memo(function SkeletonBase({
  className = '',
  animation = 'shimmer'
}: SkeletonBaseProps) {
  const animationClasses = {
    shimmer: 'skeleton-shimmer',
    pulse: 'animate-pulse',
    wave: 'skeleton-wave'
  }

  return (
    <div className={cn(
      'relative overflow-hidden bg-slate-700/40 rounded-md',
      animationClasses[animation],
      className
    )}>
      {animation === 'wave' && (
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(148, 163, 184, 0.15) 20%, rgba(148, 163, 184, 0.25) 50%, rgba(148, 163, 184, 0.15) 80%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'skeletonWave 1.5s ease-in-out infinite'
          }}
        />
      )}
    </div>
  )
})

// Project Card Skeleton - Mobile-optimized with touch-friendly sizing
export const ProjectCardSkeleton = memo(function ProjectCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-3 sm:space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <SkeletonBase className="h-5 sm:h-6 w-3/4" animation="wave" />
          <SkeletonBase className="h-3.5 sm:h-4 w-full" animation="wave" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <SkeletonBase className="h-3.5 sm:h-4 w-20 sm:w-24" animation="wave" />
      </div>
      <div className="flex gap-2">
        <SkeletonBase className="h-9 sm:h-10 flex-1 rounded-md" animation="wave" />
        <SkeletonBase className="h-9 sm:h-10 w-9 sm:w-10 rounded-md" animation="wave" />
        <SkeletonBase className="h-9 sm:h-10 w-9 sm:w-10 rounded-md" animation="wave" />
      </div>
    </div>
  )
})

// Template Card Skeleton - Mobile-optimized
export const TemplateCardSkeleton = memo(function TemplateCardSkeleton() {
  return (
    <div className="bg-card rounded-xl sm:rounded-2xl border border-border overflow-hidden">
      <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
        {/* Agent avatars */}
        <div className="flex items-center">
          {[0, 1, 2].map((i) => (
            <div key={i} className={i > 0 ? '-ml-1.5' : ''}>
              <SkeletonBase
                className="w-7 h-7 sm:w-9 sm:h-9 rounded-full"
                animation="wave"
              />
            </div>
          ))}
          <SkeletonBase className="h-3 w-10 sm:w-12 ml-2" animation="wave" />
        </div>
        {/* Title and description */}
        <div className="space-y-2">
          <SkeletonBase className="h-5 sm:h-6 w-2/3" animation="wave" />
          <SkeletonBase className="h-3.5 sm:h-4 w-full" animation="wave" />
          <SkeletonBase className="h-3.5 sm:h-4 w-3/4 hidden sm:block" animation="wave" />
        </div>
        {/* Meta info */}
        <div className="flex items-center gap-3 sm:gap-4">
          <SkeletonBase className="h-3.5 sm:h-4 w-14 sm:w-16" animation="wave" />
          <SkeletonBase className="h-3.5 sm:h-4 w-16 sm:w-20" animation="wave" />
        </div>
        {/* Buttons - Stack on mobile */}
        <div className="flex flex-col sm:flex-row gap-2">
          <SkeletonBase className="h-9 sm:h-10 flex-1 rounded-lg" animation="wave" />
          <SkeletonBase className="h-9 sm:h-10 w-full sm:w-24 rounded-lg" animation="wave" />
        </div>
      </div>
    </div>
  )
})

// Workflow Card Skeleton - Mobile-optimized
export const WorkflowCardSkeleton = memo(function WorkflowCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-3 sm:space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2 min-w-0">
          <SkeletonBase className="h-4 sm:h-5 w-1/2" animation="wave" />
          <SkeletonBase className="h-3.5 sm:h-4 w-3/4" animation="wave" />
        </div>
        <SkeletonBase className="h-5 sm:h-6 w-14 sm:w-16 rounded-full flex-shrink-0" animation="wave" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <SkeletonBase className="h-3.5 sm:h-4 w-10 sm:w-12" animation="wave" />
          <SkeletonBase className="h-3.5 sm:h-4 w-14 sm:w-16" animation="wave" />
        </div>
        <div className="flex justify-between">
          <SkeletonBase className="h-3.5 sm:h-4 w-16 sm:w-20" animation="wave" />
          <SkeletonBase className="h-3.5 sm:h-4 w-6 sm:w-8" animation="wave" />
        </div>
      </div>
      <SkeletonBase className="h-9 sm:h-10 w-full rounded-md" animation="wave" />
    </div>
  )
})

// Dashboard Stats Skeleton - Mobile-optimized
export const DashboardStatsSkeleton = memo(function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <SkeletonBase className="h-3.5 sm:h-4 w-16 sm:w-20 md:w-24" animation="wave" />
            <SkeletonBase className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-md sm:rounded-lg" animation="wave" />
          </div>
          <div className="flex items-end justify-between">
            <SkeletonBase className="h-5 sm:h-6 md:h-7 w-12 sm:w-14 md:w-16" animation="wave" />
            <SkeletonBase className="h-3 sm:h-3.5 md:h-4 w-8 sm:w-10 md:w-12 hidden sm:block" animation="wave" />
          </div>
        </div>
      ))}
    </div>
  )
})

// Activity Feed Skeleton - Mobile-optimized
export const ActivityFeedSkeleton = memo(function ActivityFeedSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-1.5 sm:space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-slate-800/30">
          <SkeletonBase className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex-shrink-0" animation="wave" />
          <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
            <SkeletonBase className="h-3.5 sm:h-4 w-3/4" animation="wave" />
            <SkeletonBase className="h-2.5 sm:h-3 w-1/2" animation="wave" />
          </div>
          <SkeletonBase className="h-2.5 sm:h-3 w-10 sm:w-12 hidden sm:block" animation="wave" />
        </div>
      ))}
    </div>
  )
})

// Integration Card Skeleton - Mobile-optimized
export const IntegrationCardSkeleton = memo(function IntegrationCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
      <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <SkeletonBase className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex-shrink-0" animation="wave" />
          <div className="space-y-1.5 sm:space-y-2">
            <SkeletonBase className="h-4 sm:h-5 w-20 sm:w-24" animation="wave" />
            <SkeletonBase className="h-3.5 sm:h-4 w-24 sm:w-32 hidden sm:block" animation="wave" />
          </div>
        </div>
        <SkeletonBase className="h-5 sm:h-6 w-16 sm:w-20 rounded-full flex-shrink-0" animation="wave" />
      </div>
      <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-3 sm:mb-4">
        {[0, 1, 2].map((i) => (
          <SkeletonBase key={i} className="h-5 sm:h-6 w-12 sm:w-16 rounded-full" animation="wave" />
        ))}
      </div>
      <SkeletonBase className="h-9 sm:h-10 w-full rounded-md" animation="wave" />
    </div>
  )
})

// =============================================================================
// MULTI-STEP PROGRESS
// =============================================================================

interface MultiStepProgressProps {
  steps: string[]
  currentStep: number
  className?: string
}

export const MultiStepProgress = memo(function MultiStepProgress({
  steps,
  currentStep,
  className = ''
}: MultiStepProgressProps) {
  return (
    <div className={cn('space-y-3 sm:space-y-4', className)}>
      {/* Progress bar */}
      <div className="relative h-1.5 sm:h-2 bg-slate-700/50 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, ((currentStep + 1) / steps.length) * 100)}%` }}
        >
          {/* Animated shimmer */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            style={{ animation: 'shimmerProgress 1.5s ease-in-out infinite' }}
          />
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isPending = index > currentStep

          return (
            <div key={index} className="flex flex-col items-center gap-1 sm:gap-2">
              <div className={cn(
                'w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300',
                isCompleted && 'bg-emerald-500 text-white',
                isCurrent && 'bg-cyan-500 text-white ring-2 sm:ring-4 ring-cyan-500/30',
                isPending && 'bg-slate-700 text-slate-400'
              )}>
                {isCompleted ? (
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : isCurrent ? (
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="text-xs sm:text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <span className={cn(
                'text-[10px] sm:text-xs font-medium text-center max-w-[50px] sm:max-w-[80px] truncate',
                isCompleted && 'text-emerald-400',
                isCurrent && 'text-cyan-400',
                isPending && 'text-slate-500'
              )}>
                {step}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
})

// =============================================================================
// WORKFLOW CREATION PROGRESS
// =============================================================================

interface WorkflowCreationProgressProps {
  status: 'idle' | 'creating' | 'configuring' | 'validating' | 'complete' | 'error'
  workflowName?: string
  error?: string
  className?: string
}

export const WorkflowCreationProgress = memo(function WorkflowCreationProgress({
  status,
  workflowName = 'Workflow',
  error,
  className = ''
}: WorkflowCreationProgressProps) {
  const steps = ['Creating', 'Configuring', 'Validating', 'Complete']
  const stepMap = {
    idle: -1,
    creating: 0,
    configuring: 1,
    validating: 2,
    complete: 3,
    error: -1
  }
  const currentStep = stepMap[status]

  if (status === 'idle') return null

  return (
    <div className={cn(
      'p-4 sm:p-6 rounded-lg sm:rounded-xl border backdrop-blur-sm transition-all duration-300',
      status === 'error' ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-800/50 border-slate-700/50',
      className
    )}>
      {status === 'error' ? (
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-red-400 text-sm sm:text-base">Failed to create workflow</p>
            <p className="text-xs sm:text-sm text-slate-400 truncate">{error || 'An unexpected error occurred'}</p>
          </div>
        </div>
      ) : status === 'complete' ? (
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-emerald-400 text-sm sm:text-base">Workflow created successfully!</p>
            <p className="text-xs sm:text-sm text-slate-400 truncate">{workflowName} is ready to use</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-white text-sm sm:text-base truncate">Creating {workflowName}</p>
              <p className="text-xs sm:text-sm text-slate-400">{steps[currentStep]}...</p>
            </div>
          </div>
          <MultiStepProgress steps={steps} currentStep={currentStep} />
        </div>
      )}
    </div>
  )
})

// =============================================================================
// BUTTON LOADING STATE
// =============================================================================

interface ButtonLoadingProps {
  loading: boolean
  children: ReactNode
  loadingText?: string
  className?: string
}

export const ButtonLoading = memo(function ButtonLoading({
  loading,
  children,
  loadingText,
  className = ''
}: ButtonLoadingProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {loading && loadingText ? loadingText : children}
    </span>
  )
})

// =============================================================================
// CONTENT LOADING OVERLAY
// =============================================================================

interface ContentOverlayProps {
  loading: boolean
  children: ReactNode
  message?: string
  blur?: boolean
  className?: string
}

export const ContentOverlay = memo(function ContentOverlay({
  loading,
  children,
  message = 'Loading...',
  blur = true,
  className = ''
}: ContentOverlayProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {loading && (
        <div className={cn(
          'absolute inset-0 flex items-center justify-center z-10 rounded-lg',
          'bg-slate-900/80',
          blur && 'backdrop-blur-sm'
        )}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-300">{message}</p>
          </div>
        </div>
      )}
    </div>
  )
})

// =============================================================================
// INLINE PROGRESS
// =============================================================================

interface InlineProgressProps {
  progress: number
  label?: string
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'success' | 'warning' | 'error'
  animated?: boolean
  className?: string
}

export const InlineProgress = memo(function InlineProgress({
  progress,
  label,
  showPercentage = true,
  size = 'md',
  color = 'primary',
  animated = true,
  className = ''
}: InlineProgressProps) {
  const sizeStyles = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  const colorStyles = {
    primary: 'from-cyan-500 to-purple-500',
    success: 'from-emerald-500 to-green-500',
    warning: 'from-amber-500 to-orange-500',
    error: 'from-red-500 to-pink-500'
  }

  const clampedProgress = Math.min(100, Math.max(0, progress))

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm text-slate-400">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-medium text-slate-300">
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-slate-700/50 rounded-full overflow-hidden', sizeStyles[size])}>
        <div
          className={cn(
            'h-full bg-gradient-to-r rounded-full transition-all duration-500 ease-out',
            colorStyles[color],
            animated && 'relative overflow-hidden'
          )}
          style={{ width: `${clampedProgress}%` }}
        >
          {animated && clampedProgress < 100 && (
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              style={{ animation: 'shimmerProgress 1.5s ease-in-out infinite' }}
            />
          )}
        </div>
      </div>
    </div>
  )
})

// =============================================================================
// PULSING DOT INDICATOR
// =============================================================================

interface PulsingDotsProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  className?: string
}

export const PulsingDots = memo(function PulsingDots({
  size = 'md',
  color = 'bg-cyan-500',
  className = ''
}: PulsingDotsProps) {
  const sizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(sizes[size], color, 'rounded-full animate-bounce')}
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.6s' }}
        />
      ))}
    </div>
  )
})

// =============================================================================
// STYLES (Add to your CSS)
// =============================================================================

// Add these styles to your global CSS or create a style tag
export const LoadingStyles = `
  @keyframes skeletonWave {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  @keyframes shimmerProgress {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  .skeleton-shimmer {
    background: linear-gradient(
      90deg,
      rgba(71, 85, 105, 0.4) 0%,
      rgba(100, 116, 139, 0.5) 50%,
      rgba(71, 85, 105, 0.4) 100%
    );
    background-size: 200% 100%;
    animation: skeletonWave 1.5s ease-in-out infinite;
  }

  .skeleton-wave::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(148, 163, 184, 0.15) 20%,
      rgba(148, 163, 184, 0.25) 50%,
      rgba(148, 163, 184, 0.15) 80%,
      transparent 100%
    );
    background-size: 200% 100%;
    animation: skeletonWave 1.5s ease-in-out infinite;
  }
`

export default {
  LogoLoader,
  PageLoading,
  PageTransition,
  ProjectCardSkeleton,
  TemplateCardSkeleton,
  WorkflowCardSkeleton,
  DashboardStatsSkeleton,
  ActivityFeedSkeleton,
  IntegrationCardSkeleton,
  MultiStepProgress,
  WorkflowCreationProgress,
  ButtonLoading,
  ContentOverlay,
  InlineProgress,
  PulsingDots
}
