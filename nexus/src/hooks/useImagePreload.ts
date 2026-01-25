import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Image preload state for individual images
 */
interface ImageState {
  src: string
  loaded: boolean
  error: boolean
  loading: boolean
}

/**
 * Hook return type for useImagePreload
 */
interface UseImagePreloadReturn {
  /** Whether all images have been loaded */
  allLoaded: boolean
  /** Whether any image is currently loading */
  isLoading: boolean
  /** Whether any image has failed to load */
  hasErrors: boolean
  /** Progress percentage (0-100) */
  progress: number
  /** Individual image states */
  images: Map<string, ImageState>
  /** Number of successfully loaded images */
  loadedCount: number
  /** Total number of images */
  totalCount: number
  /** Manually preload additional images */
  preload: (urls: string[]) => void
  /** Reset the preloader state */
  reset: () => void
  /** Check if a specific image is loaded */
  isImageLoaded: (src: string) => boolean
}

/**
 * Hook options for useImagePreload
 */
interface UseImagePreloadOptions {
  /** Whether to start preloading immediately (default: true) */
  immediate?: boolean
  /** Callback when all images are loaded */
  onComplete?: () => void
  /** Callback when an image fails to load */
  onError?: (src: string, error: Error) => void
  /** Callback for progress updates */
  onProgress?: (loaded: number, total: number) => void
  /** Maximum concurrent image loads (default: 4) */
  concurrency?: number
  /** Timeout for each image in ms (default: 30000) */
  timeout?: number
}

/**
 * useImagePreload - Preload critical images for improved LCP
 *
 * This hook helps reduce Largest Contentful Paint (LCP) by preloading
 * critical images before they appear in the viewport.
 *
 * @example
 * ```tsx
 * // Preload critical hero images
 * const { allLoaded, progress } = useImagePreload([
 *   '/images/hero.webp',
 *   '/images/logo.png'
 * ]);
 *
 * // Show loading state while critical images load
 * if (!allLoaded) return <LoadingScreen progress={progress} />;
 * ```
 */
export function useImagePreload(
  urls: string[],
  options: UseImagePreloadOptions = {}
): UseImagePreloadReturn {
  const {
    immediate = true,
    onComplete,
    onError,
    onProgress,
    concurrency = 4,
    timeout = 30000,
  } = options

  const [images, setImages] = useState<Map<string, ImageState>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const loadQueueRef = useRef<string[]>([])
  const activeLoadsRef = useRef(0)
  const onCompleteRef = useRef(onComplete)
  const onErrorRef = useRef(onError)
  const onProgressRef = useRef(onProgress)

  // Keep callback refs updated
  useEffect(() => {
    onCompleteRef.current = onComplete
    onErrorRef.current = onError
    onProgressRef.current = onProgress
  }, [onComplete, onError, onProgress])

  // Initialize image states
  useEffect(() => {
    if (!immediate) return

    const initialState = new Map<string, ImageState>()
    urls.forEach(src => {
      if (!initialState.has(src)) {
        initialState.set(src, {
          src,
          loaded: false,
          error: false,
          loading: false,
        })
      }
    })
    setImages(initialState)
    loadQueueRef.current = [...urls]
  }, [urls, immediate])

  // Load a single image
  const loadImage = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      let timeoutId: NodeJS.Timeout | null = null

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId)
        img.onload = null
        img.onerror = null
      }

      img.onload = () => {
        cleanup()
        resolve()
      }

      img.onerror = () => {
        cleanup()
        reject(new Error(`Failed to load image: ${src}`))
      }

      // Set timeout
      timeoutId = setTimeout(() => {
        cleanup()
        reject(new Error(`Image load timeout: ${src}`))
      }, timeout)

      img.src = src
    })
  }, [timeout])

  // Process the load queue
  const processQueue = useCallback(async () => {
    while (loadQueueRef.current.length > 0 && activeLoadsRef.current < concurrency) {
      const src = loadQueueRef.current.shift()
      if (!src) continue

      activeLoadsRef.current++

      // Mark as loading
      setImages(prev => {
        const next = new Map(prev)
        const existing = next.get(src)
        if (existing) {
          next.set(src, { ...existing, loading: true })
        }
        return next
      })

      try {
        await loadImage(src)

        // Mark as loaded
        setImages(prev => {
          const next = new Map(prev)
          const existing = next.get(src)
          if (existing) {
            next.set(src, { ...existing, loaded: true, loading: false })
          }
          return next
        })
      } catch (err) {
        // Mark as error
        setImages(prev => {
          const next = new Map(prev)
          const existing = next.get(src)
          if (existing) {
            next.set(src, { ...existing, error: true, loading: false })
          }
          return next
        })

        onErrorRef.current?.(src, err as Error)
      }

      activeLoadsRef.current--

      // Continue processing queue
      if (loadQueueRef.current.length > 0) {
        processQueue()
      }
    }
  }, [concurrency, loadImage])

  // Start preloading
  useEffect(() => {
    if (!immediate || images.size === 0) return

    setIsLoading(true)
    processQueue()
  }, [immediate, images.size, processQueue])

  // Calculate derived state
  const loadedCount = Array.from(images.values()).filter(img => img.loaded).length
  const errorCount = Array.from(images.values()).filter(img => img.error).length
  const totalCount = images.size
  const allLoaded = totalCount > 0 && loadedCount + errorCount >= totalCount
  const progress = totalCount > 0 ? Math.round((loadedCount / totalCount) * 100) : 0
  const hasErrors = errorCount > 0

  // Update loading state and trigger callbacks
  useEffect(() => {
    if (totalCount > 0) {
      onProgressRef.current?.(loadedCount, totalCount)

      if (allLoaded) {
        setIsLoading(false)
        onCompleteRef.current?.()
      }
    }
  }, [loadedCount, totalCount, allLoaded])

  // Manual preload function
  const preload = useCallback((newUrls: string[]) => {
    setImages(prev => {
      const next = new Map(prev)
      newUrls.forEach(src => {
        if (!next.has(src)) {
          next.set(src, {
            src,
            loaded: false,
            error: false,
            loading: false,
          })
          loadQueueRef.current.push(src)
        }
      })
      return next
    })

    setIsLoading(true)
    processQueue()
  }, [processQueue])

  // Reset function
  const reset = useCallback(() => {
    setImages(new Map())
    setIsLoading(false)
    loadQueueRef.current = []
    activeLoadsRef.current = 0
  }, [])

  // Check if specific image is loaded
  const isImageLoaded = useCallback((src: string): boolean => {
    const state = images.get(src)
    return state?.loaded ?? false
  }, [images])

  return {
    allLoaded,
    isLoading,
    hasErrors,
    progress,
    images,
    loadedCount,
    totalCount,
    preload,
    reset,
    isImageLoaded,
  }
}

/**
 * usePreloadCriticalImages - Preload images that affect LCP
 *
 * A simplified hook for preloading above-the-fold images.
 *
 * @example
 * ```tsx
 * const isReady = usePreloadCriticalImages([
 *   '/images/hero.webp',
 *   '/images/logo.png'
 * ]);
 * ```
 */
export function usePreloadCriticalImages(urls: string[]): boolean {
  const { allLoaded } = useImagePreload(urls, {
    immediate: true,
    concurrency: 6, // Higher concurrency for critical images
  })
  return allLoaded
}

/**
 * useLazyImagePreload - Preload images when triggered
 *
 * Useful for preloading images that will be needed soon
 * (e.g., next page in a gallery).
 *
 * @example
 * ```tsx
 * const { preload, isLoading } = useLazyImagePreload();
 *
 * // Preload when user hovers over "next" button
 * const handleHover = () => preload([nextPageImages]);
 * ```
 */
export function useLazyImagePreload() {
  return useImagePreload([], { immediate: false })
}

/**
 * Preload a single image imperatively
 * Useful outside of React components or in event handlers
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to load: ${src}`))
    img.src = src
  })
}

/**
 * Preload multiple images imperatively with concurrency control
 */
export async function preloadImages(
  urls: string[],
  concurrency = 4
): Promise<{ loaded: string[]; failed: string[] }> {
  const loaded: string[] = []
  const failed: string[] = []
  const queue = [...urls]

  const loadNext = async (): Promise<void> => {
    const src = queue.shift()
    if (!src) return

    try {
      await preloadImage(src)
      loaded.push(src)
    } catch {
      failed.push(src)
    }

    if (queue.length > 0) {
      await loadNext()
    }
  }

  // Start concurrent loads
  const workers = Array(Math.min(concurrency, urls.length))
    .fill(null)
    .map(() => loadNext())

  await Promise.all(workers)

  return { loaded, failed }
}

export default useImagePreload
