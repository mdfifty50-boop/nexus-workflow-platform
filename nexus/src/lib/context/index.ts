/**
 * User Context Module - Main Export
 *
 * Provides unified exports for user context extraction and storage.
 */

// Extractor
export { extractUserContext, extractUserContextFromHistory } from './user-context-extractor'

// Store
export {
  storeUserContext,
  loadUserContext,
  clearUserContext,
  queryUserContexts,
  getUserContextSummary,
  updateContextField,
  hasUserContext,
  exportUserContext,
  importUserContext,
} from './context-store'

// Hooks
export {
  useUserContext,
  useHasContextField,
  usePrimaryAddress,
  usePreferredLanguage,
  useUserTimezone,
} from './useUserContext'

// Re-export types for convenience
export type {
  UserContext,
  PartialUserContext,
  UserAddress,
  FrequentContact,
  FoodPreference,
  CommunicationPreferences,
  ContextExtractionResult,
  StoreContextRequest,
  StoreContextResponse,
} from '@/types/user-context'
