/**
 * Payments Library - Index
 *
 * Re-exports all payment-related types, services, and utilities.
 */

// KNET Types
export type {
  KNETPaymentRequest,
  KNETPaymentInitResponse,
  KNETPaymentResponse,
  KNETTransactionDetails,
  KNETVerificationRequest,
  KNETVerificationResponse,
  KNETRefundRequest,
  KNETRefundResponse,
  KNETCallbackData,
  KNETPaymentState,
  KNETPaymentButtonProps,
  KNETPaymentFormProps,
  KWDAmount,
  KWDFormatOptions,
  KNETTransactionStatusType,
  KNETErrorCodeType,
} from './knet-types';

export {
  KNETTransactionStatus,
  KNETErrorCodes,
  KNETErrorMessages,
} from './knet-types';

// KNET Configuration
export type {
  KNETMerchantConfig,
  KNETCallbackConfig,
  KNETConfig,
} from './knet-config';

export {
  KNET_ENDPOINTS,
  CURRENCY_CONFIG,
  KNET_LANGUAGES,
  KNET_TIMEOUTS,
  getKNETEndpoints,
  getMerchantConfig,
  getCallbackConfig,
  getKNETConfig,
  getDefaultLanguage,
  isMockMode,
  kwdToFils,
  filsToKwd,
  validateAmount,
  buildCallbackUrl,
} from './knet-config';

// KNET Service
export {
  KNETService,
  initializePayment,
  verifyPayment,
  getTransactionDetails,
  refundPayment,
  formatKWD,
  parseKWD,
  formatAmountDisplay,
  generateTrackId,
  buildPaymentRequest,
  getErrorMessage,
  isSuccessStatus,
  canRefund,
  simulateMockPaymentCompletion,
} from './knet-service';

// Default export
export { KNETService as default } from './knet-service';
