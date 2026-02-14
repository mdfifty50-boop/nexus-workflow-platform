/**
 * Spline3DAvatar - Interactive 3D Robot Avatar
 *
 * Primary: Uses React Three Fiber (@react-three/fiber + @react-three/drei)
 * for a self-contained 3D robot that doesn't depend on external CDN.
 *
 * Features:
 * - Metallic robot head with glowing purple eyes
 * - Head follows mouse cursor
 * - Floating/bobbing animation
 * - Ambient particle effects
 * - Lazy-loaded with ErrorBoundary to never crash the page
 */

import { Component, Suspense, lazy, type ReactElement, type ReactNode, type ErrorInfo } from 'react'

const Robot3DScene = lazy(() => import('./Robot3DScene'))

interface Spline3DAvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZE_MAP = {
  xs: { width: 40, height: 40 },
  sm: { width: 80, height: 80 },
  md: { width: 120, height: 120 },
  lg: { width: 180, height: 180 },
  xl: { width: 260, height: 260 },
}

// ============================================================================
// Error Boundary - catches ANY error from Three.js (WebGL, render, etc.)
// ============================================================================

interface EBProps {
  fallback: ReactNode
  children: ReactNode
}

interface EBState {
  hasError: boolean
}

class RobotErrorBoundary extends Component<EBProps, EBState> {
  constructor(props: EBProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): EBState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.warn('[Spline3DAvatar] 3D render failed, using fallback:', error.message, info.componentStack)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

// ============================================================================
// Animated CSS fallback - used when WebGL isn't available
// ============================================================================

function AnimatedFallback({ size, className }: { size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; className: string }): ReactElement {
  const dims = SIZE_MAP[size]
  const isLarge = size === 'lg' || size === 'xl'
  const eyeSize = size === 'xs' ? 5 : size === 'sm' ? 8 : size === 'md' ? 12 : size === 'lg' ? 16 : 20
  const eyeGap = size === 'xs' ? 8 : size === 'sm' ? 12 : size === 'md' ? 18 : 26
  const headW = dims.width * 0.55
  const headH = dims.height * 0.45

  return (
    <div
      className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{ width: dims.width, height: dims.height }}
    >
      {/* Deep space background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0d0524] via-[#1a0a3e] to-[#0f0630]" />

      {/* Ambient glow behind robot */}
      <div
        className="absolute rounded-full"
        style={{
          width: dims.width * 0.7,
          height: dims.height * 0.7,
          top: '15%',
          left: '15%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, rgba(139,92,246,0.08) 40%, transparent 70%)',
          animation: 'avatar-pulse 3s ease-in-out infinite',
        }}
      />

      {/* Scan line */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-purple-400/40 to-transparent"
          style={{ animation: 'scan-line 3s ease-in-out infinite' }}
        />
      </div>

      {/* Robot head outline */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ animation: 'float-orb 3s ease-in-out infinite' }}>
        <div
          className="relative rounded-xl border border-purple-500/20"
          style={{
            width: headW,
            height: headH,
            background: 'linear-gradient(160deg, rgba(30,17,69,0.9) 0%, rgba(15,6,48,0.95) 100%)',
            boxShadow: '0 4px 30px rgba(139,92,246,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* Visor */}
          <div
            className="absolute rounded-lg"
            style={{
              top: '25%',
              left: '12%',
              right: '12%',
              height: '35%',
              background: 'linear-gradient(180deg, rgba(10,10,26,0.95), rgba(20,10,40,0.9))',
              border: '1px solid rgba(139,92,246,0.15)',
            }}
          >
            {/* Eyes inside visor */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ gap: eyeGap }}>
              <div
                className="rounded-full"
                style={{
                  width: eyeSize,
                  height: eyeSize,
                  background: 'radial-gradient(circle, #c084fc 20%, #8b5cf6 60%, #6d28d9 100%)',
                  boxShadow: `0 0 ${eyeSize}px rgba(168,85,247,0.9), 0 0 ${eyeSize * 2}px rgba(168,85,247,0.4)`,
                  animation: 'eye-pulse 2s ease-in-out infinite',
                }}
              />
              <div
                className="rounded-full"
                style={{
                  width: eyeSize,
                  height: eyeSize,
                  background: 'radial-gradient(circle, #c084fc 20%, #8b5cf6 60%, #6d28d9 100%)',
                  boxShadow: `0 0 ${eyeSize}px rgba(168,85,247,0.9), 0 0 ${eyeSize * 2}px rgba(168,85,247,0.4)`,
                  animation: 'eye-pulse 2s ease-in-out infinite',
                  animationDelay: '0.15s',
                }}
              />
            </div>
          </div>

          {/* Mouth grille */}
          <div className="absolute flex flex-col gap-[2px] items-center" style={{ bottom: '15%', left: '30%', right: '30%' }}>
            <div className="w-full h-[2px] rounded-full bg-purple-500/25" />
            {isLarge && <div className="w-[70%] h-[2px] rounded-full bg-purple-500/15" />}
          </div>

          {/* Ear modules */}
          <div
            className="absolute rounded-sm"
            style={{
              left: -4,
              top: '30%',
              width: 4,
              height: '30%',
              background: 'linear-gradient(180deg, #6d28d9, #4c1d95)',
              boxShadow: '0 0 6px rgba(109,40,217,0.5)',
            }}
          />
          <div
            className="absolute rounded-sm"
            style={{
              right: -4,
              top: '30%',
              width: 4,
              height: '30%',
              background: 'linear-gradient(180deg, #6d28d9, #4c1d95)',
              boxShadow: '0 0 6px rgba(109,40,217,0.5)',
            }}
          />

          {/* Antenna */}
          {isLarge && (
            <>
              <div
                className="absolute left-1/2 -translate-x-1/2"
                style={{
                  top: -12,
                  width: 2,
                  height: 12,
                  background: 'linear-gradient(180deg, #8b5cf6, #4c1d95)',
                }}
              />
              <div
                className="absolute left-1/2 -translate-x-1/2 rounded-full"
                style={{
                  top: -17,
                  width: 6,
                  height: 6,
                  background: '#c084fc',
                  boxShadow: '0 0 8px rgba(192,132,252,0.8)',
                  animation: 'eye-pulse 1.5s ease-in-out infinite',
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* Corner accent dots */}
      {isLarge && (
        <>
          <div className="absolute top-3 right-3 w-1 h-1 rounded-full bg-purple-400/40" />
          <div className="absolute bottom-3 left-3 w-1 h-1 rounded-full bg-purple-400/40" />
          <div className="absolute top-3 left-3 w-0.5 h-0.5 rounded-full bg-blue-400/30" />
        </>
      )}

      {/* Vignette + border */}
      <div className="absolute inset-0 rounded-2xl ring-1 ring-purple-500/15 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)]" />
    </div>
  )
}

function LoadingFallback({ size }: { size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }): ReactElement {
  const dims = SIZE_MAP[size]
  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{ width: dims.width, height: dims.height }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 via-purple-800/30 to-indigo-900/40 animate-pulse rounded-2xl" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function Spline3DAvatar({ size = 'lg', className = '' }: Spline3DAvatarProps): ReactElement {
  const dims = SIZE_MAP[size]
  const fallback = <AnimatedFallback size={size} className={className} />

  return (
    <RobotErrorBoundary fallback={fallback}>
      <div
        className={`relative rounded-2xl overflow-hidden ${className}`}
        style={{ width: dims.width, height: dims.height }}
      >
        <Suspense fallback={<LoadingFallback size={size} />}>
          <Robot3DScene width={dims.width} height={dims.height} />
        </Suspense>
      </div>
    </RobotErrorBoundary>
  )
}

export default Spline3DAvatar
