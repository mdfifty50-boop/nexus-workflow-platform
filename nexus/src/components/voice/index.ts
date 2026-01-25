/**
 * Voice Components
 *
 * Export all voice-related components for easy import
 */

export { ContinuousMic } from './ContinuousMic'
export { VoiceWorkflow } from './VoiceWorkflow'
export { MicButtonStates } from './MicButtonStates'

export type { Dialect, Language, DialectDetectionResult } from '@/lib/voice/dialect-detector'
export {
  detectDialect,
  getDialectDisplayName,
  getDialectFlag,
  SUPPORTED_DIALECTS,
} from '@/lib/voice/dialect-detector'
