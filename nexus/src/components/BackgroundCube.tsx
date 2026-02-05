/**
 * BackgroundCube - 3D Rubik's Cube Background Element
 *
 * Uses Spline to render a high-quality 3D Rubik's cube
 * similar to Resend's landing page.
 *
 * Features:
 * - High-resolution 3D Rubik's cube model (from Spline)
 * - Video fallback for performance
 * - Image fallback for non-WebGL browsers
 */

import { Suspense, lazy, useState, useEffect } from 'react'

// Lazy load Spline to reduce initial bundle size
const Spline = lazy(() => import('@splinetool/react-spline'))

// Configuration
const CUBE_CONFIG = {
  // Spline scene URL - using local copy of Resend's cube
  splineUrl: '/static/cube.splinecode',
  // Video fallback URL
  videoUrl: '/static/cube.mp4',
  // Image fallback URL
  imageUrl: '/static/cube-fallback.jpg',
  // Opacity for subtle background effect
  opacity: 0.85,
}

/**
 * Check if WebGL is supported
 */
function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}

/**
 * Video fallback component for when Spline fails or for low-end devices
 */
function VideoFallback() {
  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      className="w-full h-full object-contain"
      poster={CUBE_CONFIG.imageUrl}
    >
      <source src={CUBE_CONFIG.videoUrl} type="video/mp4" />
      {/* Ultimate fallback to static image */}
      <img
        src={CUBE_CONFIG.imageUrl}
        alt="3D Cube"
        className="w-full h-full object-contain"
      />
    </video>
  )
}

/**
 * Image fallback for no-JS or failed video
 */
function ImageFallback() {
  return (
    <img
      src={CUBE_CONFIG.imageUrl}
      alt="3D Cube"
      className="w-full h-full object-contain"
    />
  )
}

/**
 * Spline 3D Cube component
 */
function SplineCube() {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return <VideoFallback />
  }

  return (
    <Spline
      scene={CUBE_CONFIG.splineUrl}
      onError={() => setHasError(true)}
      style={{
        width: '100%',
        height: '100%',
      }}
    />
  )
}

/**
 * Main BackgroundCube component
 *
 * Renders the high-quality 3D Rubik's cube.
 * Automatically falls back to video or image if WebGL is not supported.
 */
export function BackgroundCube() {
  const [useSpline, setUseSpline] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Check WebGL support on mount
    if (!isWebGLSupported()) {
      setUseSpline(false)
    }
    setIsLoaded(true)
  }, [])

  // Don't render until we've checked WebGL support
  if (!isLoaded) {
    return null
  }

  return (
    <div
      className="absolute top-0 right-0 pointer-events-none overflow-visible"
      style={{
        zIndex: 0,
        // Use absolute positioning relative to the parent's content flow
        // This allows the cube to scroll with the page
        position: 'absolute',
      }}
      aria-hidden="true"
    >
      {/* Container for the cube - positioned to match Resend's layout */}
      <div
        style={{
          width: '650px',
          height: '550px',
          marginRight: '5%',
          marginTop: '80px', // Account for nav bar
          opacity: CUBE_CONFIG.opacity,
        }}
      >
        <div className="relative w-full h-full">
          {useSpline ? (
            <Suspense fallback={<VideoFallback />}>
              <SplineCube />
            </Suspense>
          ) : (
            <VideoFallback />
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Lightweight version - just uses video
 * For lower-end devices or when Spline is not needed
 */
export function BackgroundCubeLite() {
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{
        zIndex: 0,
      }}
      aria-hidden="true"
    >
      <div
        className="absolute"
        style={{
          width: '650px',
          height: '550px',
          right: '5%',
          top: '15%',
          opacity: CUBE_CONFIG.opacity,
        }}
      >
        <div className="relative w-full h-full">
          <VideoFallback />
        </div>
      </div>
    </div>
  )
}

/**
 * Static version - just uses image
 * For maximum performance or accessibility
 */
export function BackgroundCubeStatic() {
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{
        zIndex: 0,
      }}
      aria-hidden="true"
    >
      <div
        className="absolute"
        style={{
          width: '650px',
          height: '550px',
          right: '5%',
          top: '15%',
          opacity: CUBE_CONFIG.opacity,
        }}
      >
        <div className="relative w-full h-full">
          <ImageFallback />
        </div>
      </div>
    </div>
  )
}

export default BackgroundCube
