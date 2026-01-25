/**
 * RTL-Aware Components & Language Switcher
 *
 * React components for handling RTL (Right-to-Left) layouts
 * and language/locale switching.
 *
 * Usage:
 *   import {
 *     DirectionWrapper,
 *     RTLAwareIcon,
 *     LTRWrapper,
 *     NumericText,
 *     LanguageSwitcher,
 *     useLanguageSwitcher
 *   } from '@/components/i18n'
 */

// Direction Wrapper exports
export {
  DirectionWrapper,
  LTRWrapper,
  RTLWrapper,
  BidirectionalText,
  IsolatedText,
  NumericText,
  CodeText,
  useDirection,
  DirectionContext
} from './DirectionWrapper'

// RTL-Aware Icon exports
export {
  RTLAwareIcon,
  FlippableIcon,
  StaticIcon,
  NavigationIcon,
  ChevronIcon,
  useIconFlip,
  useIconFlipStyle
} from './RTLAwareIcon'

// Language Switcher exports
export {
  LanguageSwitcher,
  CompactLanguageSwitcher,
  TextOnlyLanguageSwitcher,
  useLanguageSwitcher
} from './LanguageSwitcher'

export type { LanguageSwitcherProps } from './LanguageSwitcher'

// Default export is DirectionWrapper for convenience
export { default } from './DirectionWrapper'
