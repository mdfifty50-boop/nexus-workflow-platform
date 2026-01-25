import { useEffect, useState } from 'react'

type StatusType = 'success' | 'error' | 'warning' | 'info' | 'loading'

interface StatusAnimationProps {
  /** Status type determines the animation and icon */
  status: StatusType
  /** Size of the animation */
  size?: 'sm' | 'md' | 'lg'
  /** Show the animation */
  show?: boolean
  /** Callback when animation completes */
  onComplete?: () => void
  /** Custom className */
  className?: string
  /** Optional text below icon */
  text?: string
}

/**
 * StatusAnimation - Animated success checkmark, error shake, and other status indicators
 * Pure CSS animations for performant feedback
 */
export function StatusAnimation({
  status,
  size = 'md',
  show = true,
  onComplete,
  className = '',
  text
}: StatusAnimationProps) {
  const [_animationComplete, setAnimationComplete] = useState(false)

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  const iconSizes = {
    sm: { stroke: 2.5, viewBox: 24 },
    md: { stroke: 2, viewBox: 24 },
    lg: { stroke: 1.5, viewBox: 24 }
  }

  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(() => {
        setAnimationComplete(true)
        onComplete()
      }, status === 'success' ? 800 : status === 'error' ? 600 : 500)
      return () => clearTimeout(timer)
    }
  }, [show, status, onComplete])

  if (!show) return null

  const { stroke, viewBox } = iconSizes[size]

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        {status === 'success' && (
          <SuccessCheckmark size={size} stroke={stroke} viewBox={viewBox} />
        )}
        {status === 'error' && (
          <ErrorCross size={size} stroke={stroke} viewBox={viewBox} />
        )}
        {status === 'warning' && (
          <WarningIcon size={size} stroke={stroke} viewBox={viewBox} />
        )}
        {status === 'info' && (
          <InfoIcon size={size} stroke={stroke} viewBox={viewBox} />
        )}
        {status === 'loading' && (
          <LoadingSpinner size={size} />
        )}
      </div>
      {text && (
        <p
          className={`text-center animate-fade-in ${
            size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
          } ${
            status === 'success' ? 'text-green-400' :
            status === 'error' ? 'text-red-400' :
            status === 'warning' ? 'text-yellow-400' :
            'text-slate-400'
          }`}
        >
          {text}
        </p>
      )}
    </div>
  )
}

function SuccessCheckmark({ size, stroke, viewBox }: { size: string; stroke: number; viewBox: number }) {
  const sizeClass = size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-12 h-12' : 'w-16 h-16'

  return (
    <>
      <svg
        className={`${sizeClass} success-checkmark`}
        viewBox={`0 0 ${viewBox} ${viewBox}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Circle */}
        <circle
          className="success-circle"
          cx="12"
          cy="12"
          r="10"
          stroke="#22c55e"
          strokeWidth={stroke}
          fill="none"
        />
        {/* Checkmark */}
        <path
          className="success-check"
          d="M7 12.5L10 15.5L17 8.5"
          stroke="#22c55e"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <style>{`
        .success-checkmark {
          animation: successPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .success-circle {
          stroke-dasharray: 63;
          stroke-dashoffset: 63;
          animation: circleStroke 0.5s ease-out 0.1s forwards;
        }

        .success-check {
          stroke-dasharray: 20;
          stroke-dashoffset: 20;
          animation: checkStroke 0.3s ease-out 0.4s forwards;
        }

        @keyframes successPop {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes circleStroke {
          to { stroke-dashoffset: 0; }
        }

        @keyframes checkStroke {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </>
  )
}

function ErrorCross({ size, stroke, viewBox }: { size: string; stroke: number; viewBox: number }) {
  const sizeClass = size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-12 h-12' : 'w-16 h-16'

  return (
    <>
      <svg
        className={`${sizeClass} error-cross`}
        viewBox={`0 0 ${viewBox} ${viewBox}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Circle */}
        <circle
          className="error-circle"
          cx="12"
          cy="12"
          r="10"
          stroke="#ef4444"
          strokeWidth={stroke}
          fill="none"
        />
        {/* X lines */}
        <path
          className="error-x error-x-1"
          d="M8 8L16 16"
          stroke="#ef4444"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <path
          className="error-x error-x-2"
          d="M16 8L8 16"
          stroke="#ef4444"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      </svg>
      <style>{`
        .error-cross {
          animation: errorShake 0.5s ease-in-out;
        }

        .error-circle {
          stroke-dasharray: 63;
          stroke-dashoffset: 63;
          animation: circleStroke 0.4s ease-out forwards;
        }

        .error-x {
          stroke-dasharray: 12;
          stroke-dashoffset: 12;
        }

        .error-x-1 {
          animation: xStroke 0.2s ease-out 0.3s forwards;
        }

        .error-x-2 {
          animation: xStroke 0.2s ease-out 0.4s forwards;
        }

        @keyframes errorShake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
          20%, 40%, 60%, 80% { transform: translateX(3px); }
        }

        @keyframes xStroke {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </>
  )
}

function WarningIcon({ size, stroke, viewBox }: { size: string; stroke: number; viewBox: number }) {
  const sizeClass = size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-12 h-12' : 'w-16 h-16'

  return (
    <>
      <svg
        className={`${sizeClass} warning-icon`}
        viewBox={`0 0 ${viewBox} ${viewBox}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Triangle */}
        <path
          className="warning-triangle"
          d="M12 3L22 20H2L12 3Z"
          stroke="#eab308"
          strokeWidth={stroke}
          strokeLinejoin="round"
          fill="none"
        />
        {/* Exclamation */}
        <path
          className="warning-exclaim"
          d="M12 9V13"
          stroke="#eab308"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <circle
          className="warning-dot"
          cx="12"
          cy="16.5"
          r="0.5"
          fill="#eab308"
        />
      </svg>
      <style>{`
        .warning-icon {
          animation: warningBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .warning-triangle {
          stroke-dasharray: 60;
          stroke-dashoffset: 60;
          animation: triangleStroke 0.4s ease-out forwards;
        }

        .warning-exclaim {
          stroke-dasharray: 6;
          stroke-dashoffset: 6;
          animation: exclaimStroke 0.2s ease-out 0.3s forwards;
        }

        .warning-dot {
          opacity: 0;
          animation: dotAppear 0.2s ease-out 0.4s forwards;
        }

        @keyframes warningBounce {
          0% { transform: scale(0) rotate(-10deg); }
          50% { transform: scale(1.1) rotate(5deg); }
          100% { transform: scale(1) rotate(0); }
        }

        @keyframes triangleStroke {
          to { stroke-dashoffset: 0; }
        }

        @keyframes exclaimStroke {
          to { stroke-dashoffset: 0; }
        }

        @keyframes dotAppear {
          to { opacity: 1; }
        }
      `}</style>
    </>
  )
}

function InfoIcon({ size, stroke, viewBox }: { size: string; stroke: number; viewBox: number }) {
  const sizeClass = size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-12 h-12' : 'w-16 h-16'

  return (
    <>
      <svg
        className={`${sizeClass} info-icon`}
        viewBox={`0 0 ${viewBox} ${viewBox}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="info-circle"
          cx="12"
          cy="12"
          r="10"
          stroke="#3b82f6"
          strokeWidth={stroke}
          fill="none"
        />
        <path
          className="info-i-line"
          d="M12 11V16"
          stroke="#3b82f6"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <circle
          className="info-i-dot"
          cx="12"
          cy="8"
          r="0.5"
          fill="#3b82f6"
        />
      </svg>
      <style>{`
        .info-icon {
          animation: infoAppear 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .info-circle {
          stroke-dasharray: 63;
          stroke-dashoffset: 63;
          animation: circleStroke 0.5s ease-out forwards;
        }

        .info-i-line {
          stroke-dasharray: 6;
          stroke-dashoffset: 6;
          animation: lineStroke 0.2s ease-out 0.3s forwards;
        }

        .info-i-dot {
          opacity: 0;
          animation: dotAppear 0.2s ease-out 0.4s forwards;
        }

        @keyframes infoAppear {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        @keyframes lineStroke {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </>
  )
}

function LoadingSpinner({ size }: { size: string }) {
  const sizeClass = size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-12 h-12' : 'w-16 h-16'

  return (
    <div className={`${sizeClass} relative`}>
      <div className="absolute inset-0 rounded-full border-2 border-slate-700" />
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
    </div>
  )
}

/**
 * AnimatedCheck - Standalone animated checkmark
 */
export function AnimatedCheck({
  className = '',
  color = '#22c55e',
  size = 24,
  delay = 0
}: {
  className?: string
  color?: string
  size?: number
  delay?: number
}) {
  return (
    <>
      <svg
        className={`animated-check ${className}`}
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        style={{ animationDelay: `${delay}ms` }}
      >
        <path
          className="animated-check-path"
          d="M4 12.5L9 17.5L20 6.5"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <style>{`
        .animated-check {
          opacity: 0;
          animation: checkAppear 0.3s ease-out forwards;
        }

        .animated-check-path {
          stroke-dasharray: 24;
          stroke-dashoffset: 24;
          animation: checkDraw 0.4s ease-out 0.15s forwards;
        }

        @keyframes checkAppear {
          to { opacity: 1; }
        }

        @keyframes checkDraw {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </>
  )
}

/**
 * AnimatedX - Standalone animated X/cross
 */
export function AnimatedX({
  className = '',
  color = '#ef4444',
  size = 24,
  shake = true
}: {
  className?: string
  color?: string
  size?: number
  shake?: boolean
}) {
  return (
    <>
      <svg
        className={`animated-x ${shake ? 'animated-x-shake' : ''} ${className}`}
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
      >
        <path
          className="animated-x-line-1"
          d="M6 6L18 18"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <path
          className="animated-x-line-2"
          d="M18 6L6 18"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      </svg>
      <style>{`
        .animated-x-shake {
          animation: xShake 0.5s ease-in-out;
        }

        .animated-x-line-1,
        .animated-x-line-2 {
          stroke-dasharray: 17;
          stroke-dashoffset: 17;
        }

        .animated-x-line-1 {
          animation: xLineDraw 0.2s ease-out forwards;
        }

        .animated-x-line-2 {
          animation: xLineDraw 0.2s ease-out 0.1s forwards;
        }

        @keyframes xShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-3px); }
          40%, 80% { transform: translateX(3px); }
        }

        @keyframes xLineDraw {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </>
  )
}

/**
 * SuccessOverlay - Full screen success animation overlay
 */
export function SuccessOverlay({
  show,
  message = 'Success!',
  onComplete,
  duration = 1500
}: {
  show: boolean
  message?: string
  onComplete?: () => void
  duration?: number
}) {
  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, duration)
      return () => clearTimeout(timer)
    }
  }, [show, onComplete, duration])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-slate-800/90 border border-slate-700 animate-scale-up">
        <StatusAnimation status="success" size="lg" />
        <p className="text-lg font-medium text-white">{message}</p>
      </div>
      <style>{`
        @keyframes scaleUp {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up {
          animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  )
}

export default StatusAnimation
