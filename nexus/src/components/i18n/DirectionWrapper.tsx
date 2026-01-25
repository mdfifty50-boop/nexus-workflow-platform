/**
 * DirectionWrapper Component
 *
 * A wrapper component that applies text direction (RTL/LTR) to its children.
 * Supports CSS logical properties and nested direction contexts.
 *
 * Usage:
 *   // Use current context direction
 *   <DirectionWrapper>
 *     <Content />
 *   </DirectionWrapper>
 *
 *   // Force specific direction
 *   <DirectionWrapper dir="rtl">
 *     <ArabicContent />
 *   </DirectionWrapper>
 *
 *   // Force LTR for code blocks within RTL context
 *   <DirectionWrapper dir="ltr">
 *     <CodeBlock />
 *   </DirectionWrapper>
 */

import {
  createContext,
  useContext,
  useMemo,
  forwardRef,
  type ReactNode,
  type HTMLAttributes
} from 'react'
import { useRTLContext } from '@/lib/i18n/rtl-provider'

// Direction type
type Direction = 'ltr' | 'rtl'

// Local direction context for nested wrappers
interface DirectionContextValue {
  dir: Direction
  isRTL: boolean
  isNested: boolean
}

const DirectionContext = createContext<DirectionContextValue | null>(null)

/**
 * Hook to get the nearest direction context
 * Falls back to RTLContext if no DirectionWrapper parent exists
 */
export function useDirection(): DirectionContextValue {
  const localContext = useContext(DirectionContext)
  const rtlContext = useRTLContext()

  if (localContext) {
    return localContext
  }

  return {
    dir: rtlContext.dir,
    isRTL: rtlContext.isRTL,
    isNested: false
  }
}

// DirectionWrapper props
interface DirectionWrapperProps extends Omit<HTMLAttributes<HTMLDivElement>, 'dir'> {
  /** Children to wrap */
  children: ReactNode
  /** Override direction (uses context direction if not specified) */
  dir?: Direction
  /** Element tag to render */
  as?: 'div' | 'span' | 'section' | 'article' | 'main' | 'aside' | 'nav'
  /** Additional class names */
  className?: string
  /** Whether to use CSS logical properties mode */
  useLogicalProps?: boolean
  /** Whether to isolate this subtree's direction from parent */
  isolate?: boolean
}

/**
 * DirectionWrapper Component
 *
 * Wraps content with appropriate text direction.
 * Can override the global direction for specific sections.
 */
export const DirectionWrapper = forwardRef<HTMLDivElement, DirectionWrapperProps>(
  function DirectionWrapper(
    {
      children,
      dir,
      as: Component = 'div',
      className = '',
      useLogicalProps = true,
      isolate = false,
      style,
      ...rest
    },
    ref
  ) {
    const parentDirection = useDirection()
    const rtlContext = useRTLContext()

    // Determine final direction
    const finalDir = dir ?? rtlContext.dir
    const isRTL = finalDir === 'rtl'
    const isNested = parentDirection.isNested || Boolean(dir)

    // Build context value
    const contextValue = useMemo<DirectionContextValue>(() => ({
      dir: finalDir,
      isRTL,
      isNested
    }), [finalDir, isRTL, isNested])

    // Build class names
    const classes = [
      'direction-wrapper',
      isRTL ? 'direction-rtl' : 'direction-ltr',
      isNested ? 'direction-nested' : '',
      isolate ? 'direction-isolate' : '',
      useLogicalProps ? 'use-logical-props' : '',
      className
    ].filter(Boolean).join(' ')

    // Build inline styles
    const wrapperStyle: React.CSSProperties = {
      ...style,
      // Use unicode-bidi for proper text isolation when needed
      ...(isolate && {
        unicodeBidi: 'isolate'
      })
    }

    return (
      <DirectionContext.Provider value={contextValue}>
        <Component
          ref={ref}
          dir={finalDir}
          className={classes}
          style={wrapperStyle}
          {...rest}
        >
          {children}
        </Component>
      </DirectionContext.Provider>
    )
  }
)

// ============================================================
// CONVENIENCE COMPONENTS
// ============================================================

/**
 * LTRWrapper - Forces LTR direction
 *
 * Useful for code blocks, numbers, or other content that should
 * always be displayed left-to-right regardless of page direction.
 */
interface LTRWrapperProps extends Omit<DirectionWrapperProps, 'dir'> {}

export const LTRWrapper = forwardRef<HTMLDivElement, LTRWrapperProps>(
  function LTRWrapper(props, ref) {
    return <DirectionWrapper {...props} dir="ltr" ref={ref} />
  }
)

/**
 * RTLWrapper - Forces RTL direction
 *
 * Useful for Arabic/Hebrew content blocks within LTR pages.
 */
interface RTLWrapperProps extends Omit<DirectionWrapperProps, 'dir'> {}

export const RTLWrapper = forwardRef<HTMLDivElement, RTLWrapperProps>(
  function RTLWrapper(props, ref) {
    return <DirectionWrapper {...props} dir="rtl" ref={ref} />
  }
)

/**
 * BidirectionalText - For text that contains both LTR and RTL content
 *
 * Uses unicode-bidi: embed to properly handle mixed-direction text.
 */
interface BidirectionalTextProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'dir'> {
  children: ReactNode
  /** Primary direction of this text segment */
  primaryDir: Direction
}

export function BidirectionalText({
  children,
  primaryDir,
  style,
  className = '',
  ...rest
}: BidirectionalTextProps) {
  return (
    <span
      dir={primaryDir}
      className={`bidi-text ${className}`}
      style={{
        ...style,
        unicodeBidi: 'embed'
      }}
      {...rest}
    >
      {children}
    </span>
  )
}

/**
 * IsolatedText - Isolates text direction from surrounding content
 *
 * Useful for user-generated content or dynamic text that might
 * have a different direction than the page.
 */
interface IsolatedTextProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'dir'> {
  children: ReactNode
  /** Direction to use (auto-detected if not specified) */
  dir?: Direction | 'auto'
}

export function IsolatedText({
  children,
  dir = 'auto',
  style,
  className = '',
  ...rest
}: IsolatedTextProps) {
  return (
    <span
      dir={dir}
      className={`isolated-text ${className}`}
      style={{
        ...style,
        unicodeBidi: 'isolate'
      }}
      {...rest}
    >
      {children}
    </span>
  )
}

/**
 * NumericText - Forces LTR for numeric content
 *
 * Numbers and mathematical expressions should always be LTR.
 */
interface NumericTextProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'dir'> {
  children: ReactNode
}

export function NumericText({
  children,
  style,
  className = '',
  ...rest
}: NumericTextProps) {
  return (
    <span
      dir="ltr"
      className={`numeric-text ${className}`}
      style={{
        ...style,
        unicodeBidi: 'embed'
      }}
      {...rest}
    >
      {children}
    </span>
  )
}

/**
 * CodeText - Forces LTR for code content
 *
 * Code should always be displayed left-to-right.
 */
interface CodeTextProps extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {
  children: ReactNode
  /** Whether to render as block (pre) or inline (code) */
  block?: boolean
}

export function CodeText({
  children,
  block = false,
  style,
  className = '',
  ...rest
}: CodeTextProps) {
  const Component = block ? 'pre' : 'code'

  return (
    <Component
      dir="ltr"
      className={`code-text ${className}`}
      style={{
        ...style,
        unicodeBidi: 'embed',
        textAlign: 'left'
      }}
      {...rest}
    >
      {children}
    </Component>
  )
}

// Export context for advanced use cases
export { DirectionContext }

// Default export
export default DirectionWrapper
