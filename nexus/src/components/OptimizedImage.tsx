import { useState, useRef, useEffect, memo } from 'react'
import type { ImgHTMLAttributes } from 'react'

/**
 * Srcset entry for responsive images
 */
interface SrcsetEntry {
  /** Image URL for this size */
  src: string
  /** Width descriptor (e.g., '640w') or pixel density (e.g., '2x') */
  descriptor: string
}

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'loading'> {
  /** Image source URL */
  src: string
  /** Fallback image URL if main image fails to load */
  fallbackSrc?: string
  /** Alt text for accessibility */
  alt: string
  /** Image width (required for layout stability) */
  width: number
  /** Image height (required for layout stability) */
  height: number
  /** Enable lazy loading (default: true) */
  lazy?: boolean
  /** Root margin for intersection observer (default: '100px') */
  rootMargin?: string
  /** Show placeholder while loading (default: true) */
  showPlaceholder?: boolean
  /** Custom placeholder component */
  placeholder?: React.ReactNode
  /** Callback when image loads successfully */
  onLoad?: () => void
  /** Callback when image fails to load */
  onError?: () => void
  /** Object fit style (default: 'cover') */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  /** Priority loading - skips lazy loading (default: false) */
  priority?: boolean
  /** Responsive image srcset for different viewport sizes */
  srcset?: SrcsetEntry[]
  /** Sizes attribute for responsive images (e.g., '(max-width: 640px) 100vw, 50vw') */
  sizes?: string
  /** Low-quality placeholder image URL for blur-up effect */
  placeholderSrc?: string
  /** Enable blur-up placeholder effect (default: false) */
  blurUp?: boolean
}

/**
 * OptimizedImage Component
 *
 * A performance-optimized image component with:
 * - Native lazy loading with fallback to Intersection Observer
 * - Automatic width/height for preventing CLS
 * - Skeleton placeholder while loading
 * - Blur-up placeholder effect for improved perceived performance
 * - Error fallback handling
 * - Responsive srcset support for different viewport sizes
 * - WebP/AVIF support detection (future enhancement)
 * - Memoized to prevent unnecessary re-renders
 */
const OptimizedImage = memo(function OptimizedImage({
  src,
  fallbackSrc,
  alt,
  width,
  height,
  lazy = true,
  rootMargin = '100px',
  showPlaceholder = true,
  placeholder,
  onLoad,
  onError,
  objectFit = 'cover',
  priority = false,
  srcset,
  sizes,
  placeholderSrc,
  blurUp = false,
  className = '',
  style,
  ...rest
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isVisible, setIsVisible] = useState(!lazy || priority)
  const [placeholderLoaded, setPlaceholderLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Check if native lazy loading is supported
  const supportsLazyLoading = 'loading' in HTMLImageElement.prototype

  // Use Intersection Observer for browsers without native lazy loading
  useEffect(() => {
    if (!lazy || priority || supportsLazyLoading) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin,
        threshold: 0,
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [lazy, priority, rootMargin, supportsLazyLoading])

  const handleLoad = () => {
    setIsLoaded(true)
    setHasError(false)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    if (!fallbackSrc) {
      onError?.()
    }
  }

  const handleFallbackError = () => {
    onError?.()
  }

  // Calculate aspect ratio for the container
  const aspectRatio = height / width

  // Determine which source to use
  const imageSrc = hasError && fallbackSrc ? fallbackSrc : src

  // Generate srcset string from array
  const srcsetString = srcset?.map(entry => `${entry.src} ${entry.descriptor}`).join(', ')

  // Preload placeholder for blur-up effect
  useEffect(() => {
    if (blurUp && placeholderSrc) {
      const img = new Image()
      img.src = placeholderSrc
      img.onload = () => setPlaceholderLoaded(true)
    }
  }, [blurUp, placeholderSrc])

  // Placeholder component
  const renderPlaceholder = () => {
    if (!showPlaceholder) return null

    // Custom placeholder takes priority
    if (placeholder) {
      return placeholder
    }

    // Blur-up placeholder with low-quality image
    if (blurUp && placeholderSrc) {
      return (
        <div className="absolute inset-0 overflow-hidden">
          {placeholderLoaded && (
            <img
              src={placeholderSrc}
              alt=""
              aria-hidden="true"
              className="w-full h-full transition-opacity duration-500"
              style={{
                objectFit,
                filter: 'blur(20px)',
                transform: 'scale(1.1)', // Prevent blur edge artifacts
                opacity: isLoaded ? 0 : 1,
              }}
            />
          )}
          {/* Overlay gradient for smooth transition */}
          <div
            className="absolute inset-0 transition-opacity duration-300"
            style={{
              background: 'linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.3) 100%)',
              opacity: isLoaded ? 0 : 1,
            }}
          />
        </div>
      )
    }

    // Default skeleton shimmer
    return (
      <div
        className="absolute inset-0 animate-pulse"
        style={{
          background: 'linear-gradient(90deg, #1e293b 0%, #334155 50%, #1e293b 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }}
      >
        <style>
          {`
            @keyframes shimmer {
              0% { background-position: 200% center; }
              100% { background-position: -200% center; }
            }
          `}
        </style>
      </div>
    )
  }

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        width,
        height,
        aspectRatio: `${width} / ${height}`,
        ...style,
      }}
    >
      {/* Placeholder shown while loading */}
      {!isLoaded && renderPlaceholder()}

      {/* Main image */}
      {isVisible && (
        <img
          src={imageSrc}
          srcSet={srcsetString}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          loading={lazy && !priority ? 'lazy' : undefined}
          decoding="async"
          fetchPriority={priority ? 'high' : undefined}
          onLoad={handleLoad}
          onError={hasError && fallbackSrc ? handleFallbackError : handleError}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            objectFit,
            width: '100%',
            height: '100%',
            display: 'block',
          }}
          {...rest}
        />
      )}

      {/* Error state when no fallback available */}
      {hasError && !fallbackSrc && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-slate-800/80 text-slate-400"
          style={{ aspectRatio: `${1 / aspectRatio}` }}
        >
          <svg
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
    </div>
  )
})

/**
 * Avatar-optimized image component
 * Pre-configured for circular avatar images
 */
export const OptimizedAvatar = memo(function OptimizedAvatar({
  src,
  alt,
  size = 48,
  fallbackSrc,
  className = '',
  ...rest
}: Omit<OptimizedImageProps, 'width' | 'height' | 'objectFit'> & { size?: number }) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      fallbackSrc={fallbackSrc}
      objectFit="cover"
      className={`rounded-full ${className}`}
      {...rest}
    />
  )
})

/**
 * Thumbnail-optimized image component
 * Pre-configured for card thumbnails
 */
export const OptimizedThumbnail = memo(function OptimizedThumbnail({
  src,
  alt,
  width = 320,
  height = 180,
  fallbackSrc,
  className = '',
  ...rest
}: OptimizedImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      fallbackSrc={fallbackSrc}
      objectFit="cover"
      className={`rounded-lg ${className}`}
      {...rest}
    />
  )
})

/**
 * Background image component with gradient overlay
 */
export const OptimizedBackgroundImage = memo(function OptimizedBackgroundImage({
  src,
  alt,
  children,
  overlayGradient = 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%)',
  className = '',
  ...rest
}: OptimizedImageProps & {
  children?: React.ReactNode
  overlayGradient?: string
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <OptimizedImage
        src={src}
        alt={alt}
        objectFit="cover"
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
        {...rest}
      />
      <div
        className="absolute inset-0"
        style={{ background: overlayGradient }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
})

export default OptimizedImage
