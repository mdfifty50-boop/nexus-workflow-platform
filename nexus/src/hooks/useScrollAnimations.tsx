import { useEffect } from 'react'

/**
 * Hook to initialize scroll-triggered animations on the page.
 * Add data-scroll="fade-up|fade-down|fade-left|fade-right|zoom-in" to elements.
 * Optionally add data-scroll-delay="1-6" for staggered animations.
 *
 * Usage:
 * 1. Call useScrollAnimations() in your component
 * 2. Add data-scroll="fade-up" to elements you want to animate
 *
 * Example:
 * <div data-scroll="fade-up" data-scroll-delay="2">
 *   This will fade up with a 0.2s delay when scrolled into view
 * </div>
 */
export function useScrollAnimations() {
  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      // If user prefers reduced motion, show all elements immediately
      document.querySelectorAll('[data-scroll]').forEach(el => {
        el.classList.add('scroll-visible')
      })
      return
    }

    // Create Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('scroll-visible')
            // Optionally unobserve after animation (better performance)
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.1, // Trigger when 10% of element is visible
        rootMargin: '0px 0px -50px 0px' // Trigger slightly before element is fully in view
      }
    )

    // Observe all elements with data-scroll attribute
    const elements = document.querySelectorAll('[data-scroll]')
    elements.forEach(el => observer.observe(el))

    // Cleanup
    return () => {
      elements.forEach(el => observer.unobserve(el))
    }
  }, [])
}

/**
 * Re-trigger scroll animations for dynamically loaded content.
 * Call this after new content is added to the DOM.
 */
export function refreshScrollAnimations() {
  const elements = document.querySelectorAll('[data-scroll]:not(.scroll-visible)')

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('scroll-visible')
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  )

  elements.forEach(el => observer.observe(el))
}
