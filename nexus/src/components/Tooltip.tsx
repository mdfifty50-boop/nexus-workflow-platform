import { useState, useRef, useEffect, type ReactNode } from 'react'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  className?: string
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 300,
  className = ''
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [actualPosition, setActualPosition] = useState(position)
  const timeoutRef = useRef<number | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isVisible && tooltipRef.current && triggerRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let newPosition = position

      // Check if tooltip would go off screen and adjust
      if (position === 'top' && triggerRect.top - tooltipRect.height < 10) {
        newPosition = 'bottom'
      } else if (position === 'bottom' && triggerRect.bottom + tooltipRect.height > viewportHeight - 10) {
        newPosition = 'top'
      } else if (position === 'left' && triggerRect.left - tooltipRect.width < 10) {
        newPosition = 'right'
      } else if (position === 'right' && triggerRect.right + tooltipRect.width > viewportWidth - 10) {
        newPosition = 'left'
      }

      setActualPosition(newPosition)
    }
  }, [isVisible, position])

  const handleMouseEnter = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }

  const arrowStyles = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-800 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-800 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-800 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-800 border-y-transparent border-l-transparent'
  }

  return (
    <div
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 ${positionStyles[actualPosition]} pointer-events-none`}
          role="tooltip"
        >
          <div className="bg-slate-800 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
            {content}
            <div
              className={`absolute w-0 h-0 border-4 ${arrowStyles[actualPosition]}`}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Info tooltip with question mark icon
export function InfoTooltip({ content, className = '' }: { content: ReactNode, className?: string }) {
  return (
    <Tooltip content={content} className={className}>
      <span className="inline-flex items-center justify-center w-4 h-4 text-xs text-slate-400 bg-slate-700 rounded-full cursor-help hover:bg-slate-600 transition-colors">
        ?
      </span>
    </Tooltip>
  )
}

// Feature hint tooltip that shows once
interface FeatureHintProps {
  id: string
  content: ReactNode
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function FeatureHint({ id, content, children, position = 'bottom' }: FeatureHintProps) {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem(`hint-dismissed-${id}`) === 'true'
  })

  if (dismissed) {
    return <>{children}</>
  }

  const handleDismiss = () => {
    localStorage.setItem(`hint-dismissed-${id}`, 'true')
    setDismissed(true)
  }

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-3',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-3',
    left: 'right-full top-1/2 -translate-y-1/2 mr-3',
    right: 'left-full top-1/2 -translate-y-1/2 ml-3'
  }

  return (
    <div className="relative inline-block">
      {children}
      <div className={`absolute z-50 ${positionStyles[position]} animate-bounce-slow`}>
        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-sm px-4 py-3 rounded-xl shadow-lg shadow-cyan-500/20 max-w-xs">
          <div className="flex items-start gap-2">
            <span className="text-lg">💡</span>
            <div className="flex-1">
              <p>{content}</p>
              <button
                onClick={handleDismiss}
                className="mt-2 text-xs text-white/70 hover:text-white underline"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0) translateX(-50%); }
          50% { transform: translateY(-5px) translateX(-50%); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
