/**
 * ZoomControls - Zoom in/out controls for workflow canvas
 *
 * Features:
 * - Zoom in/out buttons
 * - Reset/fit to view
 * - Zoom percentage display
 * - Pinch-to-zoom support on mobile
 * - Keyboard shortcuts
 * - Customizable zoom levels
 */

import { useCallback, useEffect, useRef, useState } from 'react'

interface ZoomControlsProps {
  zoom: number
  onZoomChange: (zoom: number) => void
  minZoom?: number
  maxZoom?: number
  zoomStep?: number
  showPercentage?: boolean
  showFitButton?: boolean
  showResetButton?: boolean
  onFitToView?: () => void
  onReset?: () => void
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  orientation?: 'horizontal' | 'vertical'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Size configurations
const SIZE_CONFIG = {
  sm: {
    button: 'w-7 h-7',
    icon: 'w-4 h-4',
    text: 'text-xs',
    gap: 'gap-0.5',
  },
  md: {
    button: 'w-9 h-9',
    icon: 'w-5 h-5',
    text: 'text-sm',
    gap: 'gap-1',
  },
  lg: {
    button: 'w-11 h-11',
    icon: 'w-6 h-6',
    text: 'text-base',
    gap: 'gap-1.5',
  },
}

// Position classes
const POSITION_CLASSES = {
  'top-left': 'top-4 left-4',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-right': 'bottom-4 right-4',
}

export function ZoomControls({
  zoom,
  onZoomChange,
  minZoom = 0.25,
  maxZoom = 2,
  zoomStep = 0.25,
  showPercentage = true,
  showFitButton = true,
  showResetButton = true,
  onFitToView,
  onReset,
  position = 'bottom-right',
  orientation = 'vertical',
  size = 'md',
  className = '',
}: ZoomControlsProps) {
  const sizeConfig = SIZE_CONFIG[size]

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoom + zoomStep, maxZoom)
    onZoomChange(newZoom)
  }, [zoom, zoomStep, maxZoom, onZoomChange])

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoom - zoomStep, minZoom)
    onZoomChange(newZoom)
  }, [zoom, zoomStep, minZoom, onZoomChange])

  const handleReset = useCallback(() => {
    if (onReset) {
      onReset()
    } else {
      onZoomChange(1)
    }
  }, [onReset, onZoomChange])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault()
          handleZoomIn()
        } else if (e.key === '-') {
          e.preventDefault()
          handleZoomOut()
        } else if (e.key === '0') {
          e.preventDefault()
          handleReset()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleZoomIn, handleZoomOut, handleReset])

  const containerClasses = orientation === 'vertical'
    ? `flex flex-col ${sizeConfig.gap}`
    : `flex flex-row ${sizeConfig.gap}`

  const buttonClasses = `
    ${sizeConfig.button}
    flex items-center justify-center
    rounded-lg
    bg-slate-800 hover:bg-slate-700
    border border-slate-700 hover:border-slate-600
    text-slate-300 hover:text-white
    transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
  `

  return (
    <div
      className={`
        absolute ${POSITION_CLASSES[position]}
        ${containerClasses}
        bg-slate-900/90 backdrop-blur-sm
        p-1.5 rounded-xl
        border border-slate-700/50
        shadow-xl
        ${className}
      `}
      role="toolbar"
      aria-label="Zoom controls"
    >
      {/* Zoom In */}
      <button
        onClick={handleZoomIn}
        disabled={zoom >= maxZoom}
        className={buttonClasses}
        aria-label={`Zoom in (currently ${Math.round(zoom * 100)}%)`}
        title="Zoom in (Ctrl/Cmd +)"
      >
        <svg className={sizeConfig.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Zoom Percentage */}
      {showPercentage && (
        <div
          className={`
            ${sizeConfig.button}
            flex items-center justify-center
            ${sizeConfig.text} font-mono
            text-slate-400
            bg-slate-800/50
            rounded-lg
          `}
          role="status"
          aria-live="polite"
          aria-label={`Current zoom: ${Math.round(zoom * 100)} percent`}
        >
          {Math.round(zoom * 100)}%
        </div>
      )}

      {/* Zoom Out */}
      <button
        onClick={handleZoomOut}
        disabled={zoom <= minZoom}
        className={buttonClasses}
        aria-label={`Zoom out (currently ${Math.round(zoom * 100)}%)`}
        title="Zoom out (Ctrl/Cmd -)"
      >
        <svg className={sizeConfig.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
        </svg>
      </button>

      {/* Divider */}
      {(showFitButton || showResetButton) && (
        <div
          className={`
            ${orientation === 'vertical' ? 'w-full h-px' : 'w-px h-full'}
            bg-slate-700
            my-0.5
          `}
          role="separator"
          aria-hidden="true"
        />
      )}

      {/* Fit to View */}
      {showFitButton && onFitToView && (
        <button
          onClick={onFitToView}
          className={buttonClasses}
          aria-label="Fit content to view"
          title="Fit to view"
        >
          <svg className={sizeConfig.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
          </svg>
        </button>
      )}

      {/* Reset */}
      {showResetButton && (
        <button
          onClick={handleReset}
          className={buttonClasses}
          aria-label="Reset zoom to 100%"
          title="Reset zoom (Ctrl/Cmd 0)"
        >
          <svg className={sizeConfig.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      )}
    </div>
  )
}

// Hook for managing zoom and pan with touch support
export function useZoomPan({
  minZoom = 0.25,
  maxZoom = 2,
  initialZoom = 1,
  enablePinchZoom = true,
  enableWheelZoom = true,
  enablePan = true,
}: {
  minZoom?: number
  maxZoom?: number
  initialZoom?: number
  enablePinchZoom?: boolean
  enableWheelZoom?: boolean
  enablePan?: boolean
} = {}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(initialZoom)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const lastTouchDistance = useRef<number | null>(null)
  const lastPanPosition = useRef({ x: 0, y: 0 })

  // Wheel zoom handler
  useEffect(() => {
    if (!enableWheelZoom || !containerRef.current) return

    const container = containerRef.current
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        setZoom(prev => Math.min(maxZoom, Math.max(minZoom, prev + delta)))
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [enableWheelZoom, minZoom, maxZoom])

  // Touch handlers for pinch-to-zoom
  useEffect(() => {
    if (!enablePinchZoom || !containerRef.current) return

    const container = containerRef.current

    const getTouchDistance = (touches: TouchList): number => {
      if (touches.length < 2) return 0
      const dx = touches[0].clientX - touches[1].clientX
      const dy = touches[0].clientY - touches[1].clientY
      return Math.hypot(dx, dy)
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        lastTouchDistance.current = getTouchDistance(e.touches)
      } else if (e.touches.length === 1 && enablePan) {
        lastPanPosition.current = {
          x: e.touches[0].clientX - pan.x,
          y: e.touches[0].clientY - pan.y,
        }
        setIsPanning(true)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && lastTouchDistance.current !== null) {
        e.preventDefault()
        const currentDistance = getTouchDistance(e.touches)
        const delta = (currentDistance - lastTouchDistance.current) * 0.005
        setZoom(prev => Math.min(maxZoom, Math.max(minZoom, prev + delta)))
        lastTouchDistance.current = currentDistance
      } else if (e.touches.length === 1 && isPanning && enablePan) {
        setPan({
          x: e.touches[0].clientX - lastPanPosition.current.x,
          y: e.touches[0].clientY - lastPanPosition.current.y,
        })
      }
    }

    const handleTouchEnd = () => {
      lastTouchDistance.current = null
      setIsPanning(false)
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enablePinchZoom, enablePan, minZoom, maxZoom, pan, isPanning])

  // Mouse pan handlers
  useEffect(() => {
    if (!enablePan || !containerRef.current) return

    const container = containerRef.current

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // Left click
        setIsPanning(true)
        lastPanPosition.current = {
          x: e.clientX - pan.x,
          y: e.clientY - pan.y,
        }
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        setPan({
          x: e.clientX - lastPanPosition.current.x,
          y: e.clientY - lastPanPosition.current.y,
        })
      }
    }

    const handleMouseUp = () => {
      setIsPanning(false)
    }

    container.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      container.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [enablePan, pan, isPanning])

  const resetView = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const fitToView = useCallback((contentWidth: number, contentHeight: number) => {
    if (!containerRef.current) return

    const container = containerRef.current
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight

    const scaleX = containerWidth / contentWidth
    const scaleY = containerHeight / contentHeight
    const newZoom = Math.min(scaleX, scaleY, maxZoom) * 0.9 // 90% to add some padding

    setZoom(Math.max(minZoom, newZoom))
    setPan({ x: 0, y: 0 })
  }, [minZoom, maxZoom])

  return {
    containerRef,
    zoom,
    setZoom,
    pan,
    setPan,
    isPanning,
    resetView,
    fitToView,
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
  }
}

export default ZoomControls
