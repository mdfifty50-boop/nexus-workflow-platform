import { cn } from "@/lib/utils"

/**
 * Base Skeleton component following shadcn/ui patterns
 * Provides smooth shimmer animation for perceived instant loading
 */
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Width of skeleton - accepts CSS values or numbers (px) */
  width?: string | number
  /** Height of skeleton - accepts CSS values or numbers (px) */
  height?: string | number
  /** Shape variant */
  variant?: 'default' | 'circular' | 'rounded'
  /** Animation style - 'shimmer' (default), 'pulse', 'wave', or 'none' */
  animation?: 'shimmer' | 'pulse' | 'wave' | 'none'
}

function Skeleton({
  className,
  width,
  height,
  variant = 'default',
  animation = 'shimmer',
  ...props
}: SkeletonProps) {
  const variantStyles = {
    default: 'rounded-md',
    circular: 'rounded-full',
    rounded: 'rounded-xl',
  }

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  // Wave animation has inline shimmer gradient
  if (animation === 'wave') {
    return (
      <div
        className={cn(
          "relative overflow-hidden bg-slate-700/40",
          variantStyles[variant],
          className
        )}
        style={style}
        {...props}
      >
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(148, 163, 184, 0.15) 20%, rgba(148, 163, 184, 0.25) 50%, rgba(148, 163, 184, 0.15) 80%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'skeletonWave 1.5s ease-in-out infinite',
          }}
        />
        <style>{`
          @keyframes skeletonWave {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    )
  }

  const animationStyles = {
    shimmer: 'skeleton-shimmer',
    pulse: 'animate-pulse',
    none: '',
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-slate-700/40",
        variantStyles[variant],
        animationStyles[animation],
        className
      )}
      style={style}
      {...props}
    />
  )
}

/**
 * SkeletonText - Multiple lines of text skeleton
 */
function SkeletonText({
  lines = 3,
  lastLineWidth = '60%',
  gap = 8,
  animation = 'shimmer',
  className
}: {
  lines?: number
  lastLineWidth?: string
  gap?: number
  animation?: 'shimmer' | 'pulse' | 'wave' | 'none'
  className?: string
}) {
  return (
    <div className={cn("flex flex-col", className)} style={{ gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={14}
          width={i === lines - 1 ? lastLineWidth : '100%'}
          animation={animation}
        />
      ))}
    </div>
  )
}

/**
 * SkeletonAvatar - Circular avatar placeholder
 */
function SkeletonAvatar({
  size = 40,
  animation = 'shimmer'
}: {
  size?: number
  animation?: 'shimmer' | 'pulse' | 'wave' | 'none'
}) {
  return (
    <Skeleton
      variant="circular"
      width={size}
      height={size}
      animation={animation}
    />
  )
}

/**
 * SkeletonCard - Card-shaped skeleton with header and content
 */
function SkeletonCard({
  hasAvatar = true,
  lines = 2,
  animation = 'shimmer',
  className
}: {
  hasAvatar?: boolean
  lines?: number
  animation?: 'shimmer' | 'pulse' | 'wave' | 'none'
  className?: string
}) {
  return (
    <div className={cn("p-4 rounded-xl border border-slate-700/50 bg-slate-800/50", className)}>
      <div className="flex items-start gap-3">
        {hasAvatar && <SkeletonAvatar animation={animation} />}
        <div className="flex-1 space-y-2">
          <Skeleton height={18} width="70%" animation={animation} />
          <Skeleton height={14} width="50%" animation={animation} />
        </div>
      </div>
      {lines > 0 && (
        <div className="mt-4">
          <SkeletonText lines={lines} animation={animation} />
        </div>
      )}
    </div>
  )
}

/**
 * SkeletonButton - Button-shaped skeleton
 */
function SkeletonButton({
  size = 'default',
  animation = 'shimmer'
}: {
  size?: 'sm' | 'default' | 'lg'
  animation?: 'shimmer' | 'pulse' | 'wave' | 'none'
}) {
  const sizes = {
    sm: { width: 80, height: 32 },
    default: { width: 100, height: 40 },
    lg: { width: 120, height: 48 }
  }

  return (
    <Skeleton
      variant="rounded"
      width={sizes[size].width}
      height={sizes[size].height}
      animation={animation}
    />
  )
}

export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonButton
}
