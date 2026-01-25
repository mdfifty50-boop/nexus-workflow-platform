/**
 * KNET Configuration
 *
 * Configuration for KNET payment gateway including:
 * - API endpoints (sandbox/production)
 * - Merchant configuration
 * - Currency settings (KWD with 3 decimal places)
 * - Callback URL configuration
 */

// =============================================================================
// ENVIRONMENT DETECTION
// =============================================================================

/**
 * Determine if we're in production mode
 */
const isProduction = (): boolean => {
  return import.meta.env.PROD || import.meta.env.VITE_KNET_ENV === 'production';
};

/**
 * Check if mock mode is enabled (for development without KNET sandbox)
 */
export const isMockMode = (): boolean => {
  return import.meta.env.VITE_KNET_MOCK === 'true' || import.meta.env.DEV;
};

// =============================================================================
// API ENDPOINTS
// =============================================================================

/**
 * KNET API Endpoints
 */
export const KNET_ENDPOINTS = {
  /** Sandbox (test) environment endpoints */
  sandbox: {
    /** Payment gateway URL */
    gateway: 'https://kpaytest.com.kw/kpg/PaymentHTTP.htm',
    /** Payment page URL */
    paymentPage: 'https://kpaytest.com.kw/kpg/payment.htm',
    /** Inquiry endpoint */
    inquiry: 'https://kpaytest.com.kw/kpg/tranPipe.htm',
    /** Refund endpoint */
    refund: 'https://kpaytest.com.kw/kpg/tranPipe.htm',
  },
  /** Production environment endpoints */
  production: {
    /** Payment gateway URL */
    gateway: 'https://kpay.com.kw/kpg/PaymentHTTP.htm',
    /** Payment page URL */
    paymentPage: 'https://kpay.com.kw/kpg/payment.htm',
    /** Inquiry endpoint */
    inquiry: 'https://kpay.com.kw/kpg/tranPipe.htm',
    /** Refund endpoint */
    refund: 'https://kpay.com.kw/kpg/tranPipe.htm',
  },
} as const;

/**
 * Get the appropriate endpoints based on environment
 */
export const getKNETEndpoints = () => {
  return isProduction() ? KNET_ENDPOINTS.production : KNET_ENDPOINTS.sandbox;
};

// =============================================================================
// MERCHANT CONFIGURATION
// =============================================================================

/**
 * KNET Merchant Configuration Type
 */
export interface KNETMerchantConfig {
  /** Merchant ID provided by KNET */
  merchantId: string;
  /** Transport password for authentication */
  transportPassword: string;
  /** Resource key for encryption */
  resourceKey: string;
  /** Terminal ID */
  terminalId: string;
  /** Merchant name for display */
  merchantName: string;
}

/**
 * Get merchant configuration from environment variables
 */
export const getMerchantConfig = (): KNETMerchantConfig => {
  return {
    merchantId: import.meta.env.VITE_KNET_MERCHANT_ID || 'TEST_MERCHANT',
    transportPassword: import.meta.env.VITE_KNET_TRANSPORT_PASSWORD || 'TEST_PASSWORD',
    resourceKey: import.meta.env.VITE_KNET_RESOURCE_KEY || 'TEST_RESOURCE_KEY',
    terminalId: import.meta.env.VITE_KNET_TERMINAL_ID || 'TEST_TERMINAL',
    merchantName: import.meta.env.VITE_KNET_MERCHANT_NAME || 'Nexus',
  };
};

/**
 * Mock merchant configuration for development
 */
export const MOCK_MERCHANT_CONFIG: KNETMerchantConfig = {
  merchantId: 'MOCK_MERCHANT_001',
  transportPassword: 'mock_transport_password',
  resourceKey: 'mock_resource_key_12345',
  terminalId: 'MOCK_TERMINAL_001',
  merchantName: 'Nexus (Test Mode)',
};

// =============================================================================
// CURRENCY CONFIGURATION
// =============================================================================

/**
 * Currency Configuration
 * KWD uses 3 decimal places (1 KWD = 1000 fils)
 */
export const CURRENCY_CONFIG = {
  /** Currency code */
  code: 'KWD' as const,
  /** Currency symbol */
  symbol: 'KD',
  /** Arabic currency name */
  nameAr: 'دينار كويتي',
  /** English currency name */
  nameEn: 'Kuwaiti Dinar',
  /** Number of decimal places */
  decimals: 3,
  /** Smallest unit name */
  smallestUnit: 'fils',
  /** Conversion factor (1 KWD = 1000 fils) */
  conversionFactor: 1000,
  /** Minimum transaction amount in fils */
  minAmount: 100, // 0.100 KWD
  /** Maximum transaction amount in fils */
  maxAmount: 10000000, // 10,000 KWD
} as const;

/**
 * Convert KWD to fils (smallest unit)
 * @param kwd Amount in KWD (e.g., 1.500)
 * @returns Amount in fils (e.g., 1500)
 */
export const kwdToFils = (kwd: number): number => {
  return Math.round(kwd * CURRENCY_CONFIG.conversionFactor);
};

/**
 * Convert fils to KWD
 * @param fils Amount in fils (e.g., 1500)
 * @returns Amount in KWD (e.g., 1.500)
 */
export const filsToKwd = (fils: number): number => {
  return fils / CURRENCY_CONFIG.conversionFactor;
};

/**
 * Validate transaction amount
 * @param fils Amount in fils
 * @returns Object with validation result and message
 */
export const validateAmount = (
  fils: number
): { valid: boolean; message?: string } => {
  if (!Number.isInteger(fils)) {
    return { valid: false, message: 'Amount must be a whole number (in fils)' };
  }
  if (fils < CURRENCY_CONFIG.minAmount) {
    return {
      valid: false,
      message: `Minimum amount is ${filsToKwd(CURRENCY_CONFIG.minAmount).toFixed(3)} KWD`,
    };
  }
  if (fils > CURRENCY_CONFIG.maxAmount) {
    return {
      valid: false,
      message: `Maximum amount is ${filsToKwd(CURRENCY_CONFIG.maxAmount).toFixed(3)} KWD`,
    };
  }
  return { valid: true };
};

// =============================================================================
// CALLBACK URL CONFIGURATION
// =============================================================================

/**
 * Callback URL Configuration Type
 */
export interface KNETCallbackConfig {
  /** Base URL for callbacks */
  baseUrl: string;
  /** Success callback path */
  successPath: string;
  /** Error callback path */
  errorPath: string;
  /** Cancel callback path */
  cancelPath: string;
  /** Webhook path for server-side notifications */
  webhookPath: string;
}

/**
 * Get callback URL configuration
 */
export const getCallbackConfig = (): KNETCallbackConfig => {
  const baseUrl =
    import.meta.env.VITE_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173');

  return {
    baseUrl,
    successPath: '/payments/knet/success',
    errorPath: '/payments/knet/error',
    cancelPath: '/payments/knet/cancel',
    webhookPath: '/api/webhooks/knet',
  };
};

/**
 * Build full callback URL
 */
export const buildCallbackUrl = (
  type: 'success' | 'error' | 'cancel' | 'webhook',
  params?: Record<string, string>
): string => {
  const config = getCallbackConfig();
  const pathMap = {
    success: config.successPath,
    error: config.errorPath,
    cancel: config.cancelPath,
    webhook: config.webhookPath,
  };

  let url = `${config.baseUrl}${pathMap[type]}`;

  if (params) {
    const queryString = new URLSearchParams(params).toString();
    url += `?${queryString}`;
  }

  return url;
};

// =============================================================================
// LANGUAGE CONFIGURATION
// =============================================================================

/**
 * Supported languages for KNET payment page
 */
export const KNET_LANGUAGES = {
  ARABIC: 'AR',
  ENGLISH: 'EN',
} as const;

export type KNETLanguage = (typeof KNET_LANGUAGES)[keyof typeof KNET_LANGUAGES];

/**
 * Get default language based on user preferences
 */
export const getDefaultLanguage = (): KNETLanguage => {
  // Check if user has set a preference
  const savedLang = localStorage.getItem('nexus_language');
  if (savedLang === 'ar') return KNET_LANGUAGES.ARABIC;

  // Check browser language
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('ar')) return KNET_LANGUAGES.ARABIC;

  return KNET_LANGUAGES.ENGLISH;
};

// =============================================================================
// TIMEOUT CONFIGURATION
// =============================================================================

/**
 * Timeout settings for KNET operations
 */
export const KNET_TIMEOUTS = {
  /** Session timeout in milliseconds (15 minutes) */
  sessionTimeout: 15 * 60 * 1000,
  /** API request timeout in milliseconds */
  requestTimeout: 30 * 1000,
  /** Payment page redirect timeout */
  redirectTimeout: 60 * 1000,
  /** Verification poll interval */
  verificationPollInterval: 2 * 1000,
  /** Maximum verification attempts */
  maxVerificationAttempts: 30,
} as const;

// =============================================================================
// FULL CONFIGURATION OBJECT
// =============================================================================

/**
 * KNET Endpoints type
 */
export type KNETEndpointsType = typeof KNET_ENDPOINTS.sandbox | typeof KNET_ENDPOINTS.production;

/**
 * Complete KNET Configuration
 */
export interface KNETConfig {
  /** Current environment */
  environment: 'sandbox' | 'production';
  /** Whether mock mode is enabled */
  mockMode: boolean;
  /** API endpoints */
  endpoints: KNETEndpointsType;
  /** Merchant configuration */
  merchant: KNETMerchantConfig;
  /** Currency configuration */
  currency: typeof CURRENCY_CONFIG;
  /** Callback URLs */
  callbacks: KNETCallbackConfig;
  /** Default language */
  language: KNETLanguage;
  /** Timeout settings */
  timeouts: typeof KNET_TIMEOUTS;
}

/**
 * Get complete KNET configuration
 */
export const getKNETConfig = (): KNETConfig => {
  const isProd = isProduction();
  const mockMode = isMockMode();

  return {
    environment: isProd ? 'production' : 'sandbox',
    mockMode,
    endpoints: getKNETEndpoints(),
    merchant: mockMode ? MOCK_MERCHANT_CONFIG : getMerchantConfig(),
    currency: CURRENCY_CONFIG,
    callbacks: getCallbackConfig(),
    language: getDefaultLanguage(),
    timeouts: KNET_TIMEOUTS,
  };
};

// =============================================================================
// ENVIRONMENT VARIABLE TEMPLATE
// =============================================================================

/**
 * Required environment variables for KNET integration
 *
 * Add these to your .env file:
 *
 * # KNET Configuration
 * VITE_KNET_ENV=sandbox                    # or 'production'
 * VITE_KNET_MOCK=true                      # Set to 'false' for real integration
 * VITE_KNET_MERCHANT_ID=your_merchant_id
 * VITE_KNET_TRANSPORT_PASSWORD=your_transport_password
 * VITE_KNET_RESOURCE_KEY=your_resource_key
 * VITE_KNET_TERMINAL_ID=your_terminal_id
 * VITE_KNET_MERCHANT_NAME=Your Store Name
 * VITE_APP_URL=https://your-domain.com
 */
export const ENV_TEMPLATE = `
# KNET Configuration
VITE_KNET_ENV=sandbox
VITE_KNET_MOCK=true
VITE_KNET_MERCHANT_ID=
VITE_KNET_TRANSPORT_PASSWORD=
VITE_KNET_RESOURCE_KEY=
VITE_KNET_TERMINAL_ID=
VITE_KNET_MERCHANT_NAME=Nexus
VITE_APP_URL=http://localhost:5173
`.trim();
