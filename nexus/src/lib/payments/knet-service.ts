/**
 * KNET Payment Service
 *
 * Service for handling KNET payment operations including:
 * - Payment initialization
 * - Payment verification
 * - Transaction details retrieval
 * - KWD formatting utilities
 * - Mock mode for development
 */

import type {
  KNETPaymentRequest,
  KNETPaymentInitResponse,
  KNETPaymentResponse,
  KNETTransactionDetails,
  KNETVerificationRequest,
  KNETVerificationResponse,
  KNETRefundRequest,
  KNETRefundResponse,
  KWDAmount,
  KWDFormatOptions,
  KNETErrorCodeType,
} from './knet-types';
import {
  KNETTransactionStatus,
  KNETErrorCodes,
  KNETErrorMessages,
} from './knet-types';
import {
  getKNETConfig,
  isMockMode,
  CURRENCY_CONFIG,
  filsToKwd,
  kwdToFils,
  validateAmount,
  buildCallbackUrl,
} from './knet-config';

// =============================================================================
// MOCK DATA STORAGE
// =============================================================================

/** In-memory storage for mock transactions */
const mockTransactions = new Map<string, KNETTransactionDetails>();

/** Counter for generating mock IDs */
let mockIdCounter = 1000;

/**
 * Generate a unique mock ID
 */
const generateMockId = (prefix: string): string => {
  mockIdCounter += 1;
  return `${prefix}_MOCK_${Date.now()}_${mockIdCounter}`;
};

// =============================================================================
// CURRENCY FORMATTING
// =============================================================================

/**
 * Format amount in Kuwaiti Dinar (KWD)
 *
 * @param fils - Amount in fils (smallest unit)
 * @param options - Formatting options
 * @returns KWDAmount object with formatted value
 *
 * @example
 * formatKWD(1500) // { fils: 1500, kwd: 1.5, formatted: 'KD 1.500' }
 * formatKWD(1500, { locale: 'ar-KW' }) // { fils: 1500, kwd: 1.5, formatted: 'د.ك. ١٫٥٠٠' }
 */
export const formatKWD = (
  fils: number,
  options: KWDFormatOptions = {}
): KWDAmount => {
  const {
    includeSymbol = true,
    includeCurrencyCode = false,
    locale = 'en-KW',
    decimals = CURRENCY_CONFIG.decimals,
  } = options;

  const kwd = filsToKwd(fils);

  // Format the number
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  let formatted = formatter.format(kwd);

  // Add currency symbol/code
  if (includeSymbol) {
    formatted = locale === 'ar-KW' ? `د.ك. ${formatted}` : `KD ${formatted}`;
  } else if (includeCurrencyCode) {
    formatted = `${formatted} KWD`;
  }

  return {
    fils,
    kwd,
    formatted,
  };
};

/**
 * Parse a KWD string to fils
 *
 * @param value - KWD string (e.g., "1.500" or "KD 1.500")
 * @returns Amount in fils
 */
export const parseKWD = (value: string): number => {
  // Remove currency symbols and whitespace
  const cleaned = value
    .replace(/[KDد.ك.\s]/g, '')
    .replace(/,/g, '')
    .trim();

  const kwd = parseFloat(cleaned);
  if (isNaN(kwd)) {
    throw new Error(`Invalid KWD amount: ${value}`);
  }

  return kwdToFils(kwd);
};

/**
 * Format amount for display with proper Arabic/English formatting
 */
export const formatAmountDisplay = (
  fils: number,
  language: 'AR' | 'EN' = 'EN'
): string => {
  return formatKWD(fils, {
    locale: language === 'AR' ? 'ar-KW' : 'en-KW',
    includeSymbol: true,
  }).formatted;
};

// =============================================================================
// MOCK SERVICE IMPLEMENTATION
// =============================================================================

/**
 * Mock implementation of payment initialization
 */
const mockInitializePayment = async (
  request: KNETPaymentRequest
): Promise<KNETPaymentInitResponse> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Validate amount
  const amountValidation = validateAmount(request.amount);
  if (!amountValidation.valid) {
    return {
      success: false,
      errorCode: KNETErrorCodes.INVALID_AMOUNT,
      errorMessage: amountValidation.message,
    };
  }

  // Generate mock payment session
  const paymentId = generateMockId('PAY');
  const sessionToken = generateMockId('SESSION');
  const config = getKNETConfig();

  // Create mock payment URL (in real implementation, this redirects to KNET)
  const mockPaymentUrl = `${config.callbacks.baseUrl}/mock-knet-payment?paymentId=${paymentId}&amount=${request.amount}&trackId=${request.trackId}`;

  // Store transaction for later verification
  const transaction: KNETTransactionDetails = {
    paymentId,
    trackId: request.trackId,
    transactionId: generateMockId('TXN'),
    referenceId: generateMockId('REF'),
    status: KNETTransactionStatus.PENDING,
    amount: request.amount,
    currency: 'KWD',
    transactionDate: new Date(),
    canReverse: false,
    originalAmount: request.amount,
    customerEmail: request.customerEmail,
    customerMobile: request.customerMobile,
    description: request.description,
    metadata: {
      udf1: request.udf1 || '',
      udf2: request.udf2 || '',
      udf3: request.udf3 || '',
      udf4: request.udf4 || '',
      udf5: request.udf5 || '',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockTransactions.set(paymentId, transaction);

  return {
    success: true,
    paymentId,
    paymentUrl: mockPaymentUrl,
    sessionToken,
    sessionExpiry: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
  };
};

/**
 * Mock implementation of payment verification
 */
const mockVerifyPayment = async (
  request: KNETVerificationRequest
): Promise<KNETVerificationResponse> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const transaction = mockTransactions.get(request.paymentId);

  if (!transaction) {
    return {
      verified: false,
      errorCode: KNETErrorCodes.TRANSACTION_NOT_FOUND,
      errorMessage: KNETErrorMessages[KNETErrorCodes.TRANSACTION_NOT_FOUND],
    };
  }

  // Simulate successful payment (in real world, this would check with KNET)
  transaction.status = KNETTransactionStatus.CAPTURED;
  transaction.authCode = `AUTH_${Date.now()}`;
  transaction.canReverse = true;
  transaction.maskedCard = '****1234';
  transaction.cardType = 'KNET';
  transaction.postDate = new Date();
  transaction.updatedAt = new Date();

  mockTransactions.set(request.paymentId, transaction);

  return {
    verified: true,
    transaction,
  };
};

/**
 * Mock implementation of get transaction details
 */
const mockGetTransactionDetails = async (
  paymentId: string
): Promise<KNETTransactionDetails | null> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  return mockTransactions.get(paymentId) || null;
};

/**
 * Mock implementation of refund
 */
const mockRefundPayment = async (
  request: KNETRefundRequest
): Promise<KNETRefundResponse> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const transaction = mockTransactions.get(request.paymentId);

  if (!transaction) {
    return {
      success: false,
      errorCode: KNETErrorCodes.TRANSACTION_NOT_FOUND,
      errorMessage: KNETErrorMessages[KNETErrorCodes.TRANSACTION_NOT_FOUND],
    };
  }

  if (!transaction.canReverse) {
    return {
      success: false,
      errorCode: KNETErrorCodes.SYSTEM_ERROR,
      errorMessage: 'This transaction cannot be reversed',
    };
  }

  const maxRefundable = transaction.originalAmount - (transaction.reversedAmount || 0);
  if (request.amount > maxRefundable) {
    return {
      success: false,
      errorCode: KNETErrorCodes.INVALID_AMOUNT,
      errorMessage: `Maximum refundable amount is ${formatKWD(maxRefundable).formatted}`,
    };
  }

  // Update transaction
  transaction.reversedAmount = (transaction.reversedAmount || 0) + request.amount;
  transaction.amount = transaction.originalAmount - transaction.reversedAmount;

  if (transaction.reversedAmount >= transaction.originalAmount) {
    transaction.status = KNETTransactionStatus.REVERSED;
    transaction.canReverse = false;
  }

  transaction.updatedAt = new Date();
  mockTransactions.set(request.paymentId, transaction);

  return {
    success: true,
    refundTransactionId: generateMockId('REFUND_TXN'),
    refundReferenceId: generateMockId('REFUND_REF'),
    refundedAmount: request.amount,
    remainingAmount: transaction.amount,
    status: 'COMPLETED',
  };
};

/**
 * Simulate completing a mock payment (for testing UI flows)
 */
export const simulateMockPaymentCompletion = async (
  paymentId: string,
  success: boolean = true
): Promise<KNETPaymentResponse> => {
  const transaction = mockTransactions.get(paymentId);

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  if (success) {
    transaction.status = KNETTransactionStatus.CAPTURED;
    transaction.authCode = `AUTH_${Date.now()}`;
    transaction.canReverse = true;
    transaction.maskedCard = '****1234';
    transaction.cardType = 'KNET';
    transaction.postDate = new Date();
  } else {
    transaction.status = KNETTransactionStatus.FAILED;
  }

  transaction.updatedAt = new Date();
  mockTransactions.set(paymentId, transaction);

  return {
    paymentId: transaction.paymentId,
    trackId: transaction.trackId,
    transactionId: transaction.transactionId,
    referenceId: transaction.referenceId,
    result: transaction.status,
    authCode: transaction.authCode,
    amount: transaction.amount,
    currency: 'KWD',
    transactionDate: transaction.transactionDate,
    maskedCard: transaction.maskedCard,
    cardType: transaction.cardType,
    postDate: transaction.postDate,
    udf1: transaction.metadata?.udf1,
    udf2: transaction.metadata?.udf2,
    udf3: transaction.metadata?.udf3,
    udf4: transaction.metadata?.udf4,
    udf5: transaction.metadata?.udf5,
  };
};

// =============================================================================
// REAL SERVICE IMPLEMENTATION (PLACEHOLDER)
// =============================================================================

/**
 * Real implementation of payment initialization
 * NOTE: In production, this would make actual API calls to KNET
 */
const realInitializePayment = async (
  _request: KNETPaymentRequest
): Promise<KNETPaymentInitResponse> => {
  // TODO: Implement real KNET API integration
  // This would involve:
  // 1. Generate transaction signature using resourceKey
  // 2. POST to KNET gateway endpoint
  // 3. Parse response and return payment URL

  throw new Error(
    'Real KNET integration not implemented. Set VITE_KNET_MOCK=true for development.'
  );
};

/**
 * Real implementation of payment verification
 */
const realVerifyPayment = async (
  _request: KNETVerificationRequest
): Promise<KNETVerificationResponse> => {
  // TODO: Implement real KNET verification
  throw new Error(
    'Real KNET integration not implemented. Set VITE_KNET_MOCK=true for development.'
  );
};

/**
 * Real implementation of get transaction details
 */
const realGetTransactionDetails = async (
  _paymentId: string
): Promise<KNETTransactionDetails | null> => {
  // TODO: Implement real KNET inquiry
  throw new Error(
    'Real KNET integration not implemented. Set VITE_KNET_MOCK=true for development.'
  );
};

/**
 * Real implementation of refund
 */
const realRefundPayment = async (
  _request: KNETRefundRequest
): Promise<KNETRefundResponse> => {
  // TODO: Implement real KNET refund
  throw new Error(
    'Real KNET integration not implemented. Set VITE_KNET_MOCK=true for development.'
  );
};

// =============================================================================
// PUBLIC SERVICE API
// =============================================================================

/**
 * Initialize a KNET payment session
 *
 * @param request - Payment request details
 * @returns Payment initialization response with redirect URL
 *
 * @example
 * const response = await initializePayment({
 *   trackId: 'ORDER_123',
 *   amount: 5000, // 5.000 KWD
 *   currency: 'KWD',
 *   language: 'EN',
 *   responseUrl: 'https://example.com/payment/success',
 *   errorUrl: 'https://example.com/payment/error',
 * });
 *
 * if (response.success) {
 *   window.location.href = response.paymentUrl;
 * }
 */
export const initializePayment = async (
  request: KNETPaymentRequest
): Promise<KNETPaymentInitResponse> => {
  // Validate required fields
  if (!request.trackId) {
    return {
      success: false,
      errorCode: KNETErrorCodes.INVALID_MERCHANT,
      errorMessage: 'Track ID is required',
    };
  }

  if (!request.amount || request.amount <= 0) {
    return {
      success: false,
      errorCode: KNETErrorCodes.INVALID_AMOUNT,
      errorMessage: 'Valid amount is required',
    };
  }

  // Use mock or real implementation based on configuration
  if (isMockMode()) {
    return mockInitializePayment(request);
  }

  return realInitializePayment(request);
};

/**
 * Verify a KNET payment after completion
 *
 * @param request - Verification request with paymentId and trackId
 * @returns Verification response with transaction details
 */
export const verifyPayment = async (
  request: KNETVerificationRequest
): Promise<KNETVerificationResponse> => {
  if (!request.paymentId || !request.trackId) {
    return {
      verified: false,
      errorCode: KNETErrorCodes.INVALID_MERCHANT,
      errorMessage: 'Payment ID and Track ID are required',
    };
  }

  if (isMockMode()) {
    return mockVerifyPayment(request);
  }

  return realVerifyPayment(request);
};

/**
 * Get transaction details by payment ID
 *
 * @param paymentId - KNET payment ID
 * @returns Transaction details or null if not found
 */
export const getTransactionDetails = async (
  paymentId: string
): Promise<KNETTransactionDetails | null> => {
  if (!paymentId) {
    return null;
  }

  if (isMockMode()) {
    return mockGetTransactionDetails(paymentId);
  }

  return realGetTransactionDetails(paymentId);
};

/**
 * Process a refund for a KNET transaction
 *
 * @param request - Refund request details
 * @returns Refund response
 */
export const refundPayment = async (
  request: KNETRefundRequest
): Promise<KNETRefundResponse> => {
  if (!request.paymentId || !request.transactionId) {
    return {
      success: false,
      errorCode: KNETErrorCodes.INVALID_MERCHANT,
      errorMessage: 'Payment ID and Transaction ID are required',
    };
  }

  if (!request.amount || request.amount <= 0) {
    return {
      success: false,
      errorCode: KNETErrorCodes.INVALID_AMOUNT,
      errorMessage: 'Valid refund amount is required',
    };
  }

  if (isMockMode()) {
    return mockRefundPayment(request);
  }

  return realRefundPayment(request);
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate a unique track ID for a transaction
 *
 * @param prefix - Optional prefix for the track ID
 * @returns Unique track ID
 */
export const generateTrackId = (prefix: string = 'TRK'): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
};

/**
 * Build a payment request with default values
 *
 * @param amount - Amount in fils
 * @param options - Additional options
 * @returns Complete payment request
 */
export const buildPaymentRequest = (
  amount: number,
  options: Partial<Omit<KNETPaymentRequest, 'amount' | 'currency'>> = {}
): KNETPaymentRequest => {
  const config = getKNETConfig();

  return {
    trackId: options.trackId || generateTrackId(),
    amount,
    currency: 'KWD',
    language: options.language || config.language,
    responseUrl: options.responseUrl || buildCallbackUrl('success'),
    errorUrl: options.errorUrl || buildCallbackUrl('error'),
    udf1: options.udf1,
    udf2: options.udf2,
    udf3: options.udf3,
    udf4: options.udf4,
    udf5: options.udf5,
    customerEmail: options.customerEmail,
    customerMobile: options.customerMobile,
    description: options.description,
  };
};

/**
 * Get human-readable error message for an error code
 */
export const getErrorMessage = (errorCode: KNETErrorCodeType): string => {
  return KNETErrorMessages[errorCode] || 'An unknown error occurred';
};

/**
 * Check if a transaction status indicates success
 */
export const isSuccessStatus = (status: string): boolean => {
  return status === KNETTransactionStatus.CAPTURED;
};

/**
 * Check if a transaction can be refunded
 */
export const canRefund = (transaction: KNETTransactionDetails): boolean => {
  return (
    transaction.canReverse &&
    transaction.status === KNETTransactionStatus.CAPTURED &&
    transaction.amount > 0
  );
};

// =============================================================================
// SERVICE SINGLETON
// =============================================================================

/**
 * KNET Payment Service
 * Singleton service instance for payment operations
 */
export const KNETService = {
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
  isMockMode,
  // For testing
  simulateMockPaymentCompletion,
} as const;

export default KNETService;
