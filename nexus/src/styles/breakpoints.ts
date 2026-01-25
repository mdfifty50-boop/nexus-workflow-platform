/**
 * Breakpoints Configuration for Nexus
 *
 * Standard Tailwind CSS breakpoints for consistent responsive design.
 * All components should use these breakpoints for consistency.
 *
 * Usage in Tailwind classes:
 * - Mobile-first: default styles apply to all screen sizes
 * - sm: applies at 640px and above
 * - md: applies at 768px and above
 * - lg: applies at 1024px and above
 * - xl: applies at 1280px and above
 * - 2xl: applies at 1536px and above
 */

// Breakpoint values in pixels (matching Tailwind defaults)
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

// Breakpoint values as CSS strings
export const breakpointsPx = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// Media query strings for use in CSS-in-JS or custom styles
export const mediaQueries = {
  sm: `@media (min-width: ${breakpointsPx.sm})`,
  md: `@media (min-width: ${breakpointsPx.md})`,
  lg: `@media (min-width: ${breakpointsPx.lg})`,
  xl: `@media (min-width: ${breakpointsPx.xl})`,
  '2xl': `@media (min-width: ${breakpointsPx['2xl']})`,
  // Max-width queries for targeting specific ranges
  maxSm: `@media (max-width: ${breakpoints.sm - 1}px)`,
  maxMd: `@media (max-width: ${breakpoints.md - 1}px)`,
  maxLg: `@media (max-width: ${breakpoints.lg - 1}px)`,
  maxXl: `@media (max-width: ${breakpoints.xl - 1}px)`,
} as const

/**
 * Helper to check if current viewport matches a breakpoint
 * Use with window.matchMedia() or for SSR-safe checks
 */
export function isBreakpoint(bp: keyof typeof breakpoints): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth >= breakpoints[bp]
}

/**
 * Get current breakpoint name based on window width
 */
export function getCurrentBreakpoint(): keyof typeof breakpoints | 'xs' {
  if (typeof window === 'undefined') return 'xs'
  const width = window.innerWidth

  if (width >= breakpoints['2xl']) return '2xl'
  if (width >= breakpoints.xl) return 'xl'
  if (width >= breakpoints.lg) return 'lg'
  if (width >= breakpoints.md) return 'md'
  if (width >= breakpoints.sm) return 'sm'
  return 'xs'
}

/**
 * Responsive grid column configurations
 * Common patterns used throughout the app
 */
export const gridColumns = {
  // Standard responsive grid: 1 col -> 2 cols -> 3 cols -> 4 cols
  standard: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  // Two-column layout: 1 col -> 2 cols
  twoCol: 'grid-cols-1 sm:grid-cols-2',
  // Three-column layout: 1 col -> 2 cols -> 3 cols
  threeCol: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  // Four-column layout: 1 col -> 2 cols -> 4 cols
  fourCol: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  // Six-column stats grid: 2 cols -> 3 cols -> 6 cols
  stats: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  // Dashboard cards: 1 col -> 2 cols -> 3 cols
  dashboard: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
} as const

/**
 * Fluid typography using clamp()
 * Provides smooth scaling between breakpoints
 *
 * Format: clamp(min, preferred, max)
 * - min: Minimum size (for smallest screens)
 * - preferred: Scales with viewport (using vw units)
 * - max: Maximum size (for largest screens)
 */
export const fluidTypography = {
  // Headings
  h1: 'clamp(1.875rem, 4vw + 1rem, 3.5rem)', // 30px to 56px
  h2: 'clamp(1.5rem, 3vw + 0.75rem, 2.5rem)', // 24px to 40px
  h3: 'clamp(1.25rem, 2vw + 0.5rem, 1.875rem)', // 20px to 30px
  h4: 'clamp(1.125rem, 1.5vw + 0.5rem, 1.5rem)', // 18px to 24px
  // Body text
  body: 'clamp(0.875rem, 1vw + 0.5rem, 1rem)', // 14px to 16px
  bodyLarge: 'clamp(1rem, 1.25vw + 0.5rem, 1.125rem)', // 16px to 18px
  // Small text
  small: 'clamp(0.75rem, 0.8vw + 0.4rem, 0.875rem)', // 12px to 14px
  xs: 'clamp(0.625rem, 0.7vw + 0.3rem, 0.75rem)', // 10px to 12px
} as const

/**
 * CSS custom properties for fluid typography
 * Add these to your global CSS to use throughout the app
 */
export const fluidTypographyCSS = `
  :root {
    --text-h1: ${fluidTypography.h1};
    --text-h2: ${fluidTypography.h2};
    --text-h3: ${fluidTypography.h3};
    --text-h4: ${fluidTypography.h4};
    --text-body: ${fluidTypography.body};
    --text-body-lg: ${fluidTypography.bodyLarge};
    --text-small: ${fluidTypography.small};
    --text-xs: ${fluidTypography.xs};
  }
`

/**
 * Container max-widths for different breakpoints
 * Matches Tailwind's container configuration
 */
export const containerMaxWidths = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// Type exports
export type Breakpoint = keyof typeof breakpoints
export type MediaQuery = keyof typeof mediaQueries
