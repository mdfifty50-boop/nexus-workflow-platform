import { memo, type ReactNode } from 'react'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
}

export const Skeleton = memo(function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse'
}: SkeletonProps) {
  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg'
  }

  const style: React.CSSProperties = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'text' ? '1rem' : undefined)
  }

  // Enhanced skeleton with gradient shimmer effect
  return (
    <>
      <div
        className={`relative overflow-hidden ${variantStyles[variant]} ${className}`}
        style={style}
      >
        {/* Base layer with subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-700/40 via-slate-600/40 to-slate-700/40" />

        {/* Shimmer layer */}
        {animation !== 'none' && (
          <div
            className="absolute inset-0 skeleton-shimmer"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(148, 163, 184, 0.15) 20%, rgba(148, 163, 184, 0.25) 50%, rgba(148, 163, 184, 0.15) 80%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: animation === 'wave' ? 'skeletonShimmer 1.5s ease-in-out infinite' : 'skeletonPulse 2s ease-in-out infinite',
            }}
          />
        )}
      </div>
      <style>{`
        @keyframes skeletonShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </>
  )
})

// Card skeleton for project/workflow cards - enhanced with glow effect
export const CardSkeleton = memo(function CardSkeleton() {
  return (
    <div className="relative group">
      {/* Subtle glow background */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative bg-slate-800/60 rounded-xl p-6 border border-slate-700/40 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <Skeleton variant="circular" width={48} height={48} animation="wave" />
          <div className="flex-1 space-y-3">
            <Skeleton width="65%" height={20} animation="wave" />
            <Skeleton width="85%" height={14} animation="wave" />
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <Skeleton variant="rounded" width={70} height={26} animation="wave" />
          <Skeleton variant="rounded" width={90} height={26} animation="wave" />
        </div>
      </div>
    </div>
  )
})

// Table row skeleton
export const TableRowSkeleton = memo(function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="border-b border-slate-700/50">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton width={i === 0 ? '60%' : '80%'} />
        </td>
      ))}
    </tr>
  )
})

// Stat card skeleton - enhanced with icon placeholder and better spacing
export const StatSkeleton = memo(function StatSkeleton() {
  return (
    <div className="relative overflow-hidden bg-slate-800/60 rounded-xl p-6 border border-slate-700/40">
      {/* Animated gradient border effect */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: 'linear-gradient(135deg, transparent 0%, rgba(6, 182, 212, 0.1) 50%, transparent 100%)',
          animation: 'statGlow 3s ease-in-out infinite'
        }}
      />
      <div className="relative flex items-center gap-3 mb-3">
        <Skeleton variant="rounded" width={36} height={36} animation="wave" />
        <Skeleton width={90} height={14} animation="wave" />
      </div>
      <Skeleton width={100} height={36} className="mb-2" animation="wave" />
      <div className="flex items-center gap-2">
        <Skeleton variant="rounded" width={50} height={20} animation="wave" />
        <Skeleton width={70} height={12} animation="wave" />
      </div>
      <style>{`
        @keyframes statGlow {
          0%, 100% { opacity: 0.1; transform: translateX(-100%); }
          50% { opacity: 0.2; transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
})

// Dashboard skeleton
export const DashboardSkeleton = memo(function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton width={150} height={24} className="mb-4" />
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton width={120} height={24} className="mb-4" />
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b border-slate-700/50 last:border-0">
                <Skeleton variant="circular" width={32} height={32} />
                <div className="flex-1">
                  <Skeleton width="70%" height={14} />
                  <Skeleton width="40%" height={12} className="mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})

// Project list skeleton
export const ProjectListSkeleton = memo(function ProjectListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
})

// Loading overlay
interface LoadingOverlayProps {
  visible: boolean
  message?: string
  children?: ReactNode
}

export const LoadingOverlay = memo(function LoadingOverlay({ visible, message = 'Loading...', children }: LoadingOverlayProps) {
  if (!visible) return <>{children}</>

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-300">{message}</p>
        </div>
      </div>
    </div>
  )
})

// List item skeleton
export const ListItemSkeleton = memo(function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1">
        <Skeleton variant="text" width="60%" height={18} className="mb-2" />
        <Skeleton variant="text" width="40%" height={14} />
      </div>
      <Skeleton variant="rounded" width={80} height={28} />
    </div>
  )
})

// Full page loading spinner
export const PageLoading = memo(function PageLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400">{message}</p>
      </div>
    </div>
  )
})

// Inline loading spinner
export const Spinner = memo(function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-[3px]',
  }

  return (
    <div
      className={`${sizes[size]} border-cyan-500 border-t-transparent rounded-full animate-spin ${className}`}
    />
  )
})

// AI Suggestions skeleton
export const AISuggestionsSkeleton = memo(function AISuggestionsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-start gap-3">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="flex-1 space-y-2">
              <Skeleton width="70%" height={18} />
              <Skeleton width="100%" height={14} />
              <Skeleton width="80%" height={14} />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Skeleton variant="rounded" width={100} height={32} />
            <Skeleton variant="rounded" width={80} height={32} />
          </div>
        </div>
      ))}
    </div>
  )
})

// Stats card skeleton (enhanced)
export const StatsCardSkeleton = memo(function StatsCardSkeleton() {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton variant="rounded" width={48} height={48} />
          <div>
            <Skeleton width={80} height={14} className="mb-1" />
            <Skeleton width={60} height={12} />
          </div>
        </div>
        <Skeleton variant="circular" width={24} height={24} />
      </div>
      <Skeleton width={120} height={32} className="mb-2" />
      <div className="flex items-center gap-2">
        <Skeleton width={60} height={14} />
        <Skeleton width={40} height={14} />
      </div>
    </div>
  )
})

// Workflow Status Hero skeleton
export const WorkflowStatusSkeleton = memo(function WorkflowStatusSkeleton() {
  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton variant="rounded" width={40} height={40} />
          <div>
            <Skeleton width={180} height={20} className="mb-1" />
            <Skeleton width={100} height={14} />
          </div>
        </div>
        <Skeleton width={80} height={20} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl p-4 bg-slate-900/50 border border-slate-700/50 text-center">
            <Skeleton width={40} height={32} className="mx-auto mb-2" />
            <Skeleton width={60} height={12} className="mx-auto" />
          </div>
        ))}
      </div>
    </div>
  )
})

// Progress bar
interface ProgressBarProps {
  progress: number
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'success' | 'warning' | 'error'
  animated?: boolean
}

export const ProgressBar = memo(function ProgressBar({
  progress,
  showPercentage = false,
  size = 'md',
  color = 'primary',
  animated = true
}: ProgressBarProps) {
  const sizeStyles = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  const colorStyles = {
    primary: 'from-cyan-500 to-blue-500',
    success: 'from-green-500 to-emerald-500',
    warning: 'from-yellow-500 to-orange-500',
    error: 'from-red-500 to-pink-500'
  }

  const clampedProgress = Math.min(100, Math.max(0, progress))

  return (
    <div className="w-full">
      <div className={`w-full bg-slate-700/50 rounded-full overflow-hidden ${sizeStyles[size]}`}>
        <div
          className={`h-full bg-gradient-to-r ${colorStyles[color]} rounded-full transition-all duration-500 ease-out ${
            animated ? 'relative overflow-hidden' : ''
          }`}
          style={{ width: `${clampedProgress}%` }}
        >
          {animated && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          )}
        </div>
      </div>
      {showPercentage && (
        <p className="text-xs text-slate-400 mt-1 text-right">{Math.round(clampedProgress)}%</p>
      )}
    </div>
  )
})
