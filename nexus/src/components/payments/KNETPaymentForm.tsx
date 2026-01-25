/**
 * KNET Payment Form Component
 *
 * A comprehensive KNET checkout form with:
 * - Amount display in KWD
 * - Payment details summary
 * - Redirect to KNET gateway
 * - Return handling
 * - Arabic/English language support
 */

import React, { useState, useCallback, useMemo } from 'react';
import type {
  KNETPaymentFormProps,
  KNETErrorCodeType,
  KNETPaymentState,
} from '../../lib/payments/knet-types';
import {
  KNETService,
  formatAmountDisplay,
  generateTrackId,
  buildPaymentRequest,
  getErrorMessage,
} from '../../lib/payments/knet-service';
import { isMockMode } from '../../lib/payments/knet-config';

/**
 * KNET Logo SVG (larger version for form)
 */
const KNETLogoLarge: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 80 80" className={className} fill="none">
    <defs>
      <linearGradient id="knetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#003B5C" />
        <stop offset="100%" stopColor="#00557A" />
      </linearGradient>
    </defs>
    <circle cx="40" cy="40" r="40" fill="url(#knetGradient)" />
    <path
      d="M24 20v40h8v-16l16 16h10l-18-18 18-22h-10l-16 20V20h-8z"
      fill="#FFFFFF"
    />
    <rect x="56" y="20" width="6" height="40" rx="3" fill="#00A3E0" />
  </svg>
);

/**
 * Success Check Animation
 */
const SuccessIcon: React.FC = () => (
  <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center animate-scale-in">
    <svg
      className="w-10 h-10 text-green-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
        className="animate-check-draw"
      />
    </svg>
  </div>
);

/**
 * Error Icon
 */
const ErrorIcon: React.FC = () => (
  <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
    <svg
      className="w-10 h-10 text-red-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  </div>
);

/**
 * Loading Spinner
 */
const LoadingSpinner: React.FC = () => (
  <div className="w-20 h-20 relative">
    <div className="absolute inset-0 rounded-full border-4 border-slate-700" />
    <div className="absolute inset-0 rounded-full border-4 border-t-[#00A3E0] animate-spin" />
    <div className="absolute inset-0 flex items-center justify-center">
      <KNETLogoLarge className="w-10 h-10" />
    </div>
  </div>
);

/**
 * Language toggle labels
 */
const LANGUAGE_LABELS = {
  EN: { toggle: 'AR', label: 'English' },
  AR: { toggle: 'EN', label: 'العربية' },
};

/**
 * Form content translations
 */
const TRANSLATIONS = {
  EN: {
    paymentSummary: 'Payment Summary',
    amount: 'Amount',
    description: 'Description',
    payWith: 'Pay with KNET',
    processing: 'Processing Payment...',
    redirecting: 'Redirecting to KNET...',
    success: 'Payment Successful!',
    failed: 'Payment Failed',
    cancel: 'Cancel',
    tryAgain: 'Try Again',
    done: 'Done',
    securePayment: 'Secure Payment',
    poweredBy: 'Powered by Kuwait National Payment System',
    testMode: 'Test Mode - No real charges',
    transactionId: 'Transaction ID',
    referenceId: 'Reference ID',
    authCode: 'Authorization Code',
  },
  AR: {
    paymentSummary: 'ملخص الدفع',
    amount: 'المبلغ',
    description: 'الوصف',
    payWith: 'الدفع بواسطة كي نت',
    processing: 'جاري معالجة الدفع...',
    redirecting: 'جاري التحويل إلى كي نت...',
    success: 'تم الدفع بنجاح!',
    failed: 'فشل الدفع',
    cancel: 'إلغاء',
    tryAgain: 'حاول مرة أخرى',
    done: 'تم',
    securePayment: 'دفع آمن',
    poweredBy: 'مدعوم من نظام الدفع الوطني الكويتي',
    testMode: 'وضع الاختبار - لا رسوم حقيقية',
    transactionId: 'رقم المعاملة',
    referenceId: 'الرقم المرجعي',
    authCode: 'رمز التفويض',
  },
};

/**
 * KNET Payment Form Component
 *
 * @example
 * <KNETPaymentForm
 *   amount={5000}
 *   productName="Premium Plan"
 *   description="Monthly subscription"
 *   onSuccess={(response) => console.log('Paid:', response)}
 *   onError={(error) => console.error('Failed:', error)}
 *   onCancel={() => console.log('Cancelled')}
 * />
 */
export const KNETPaymentForm: React.FC<KNETPaymentFormProps> = ({
  amount,
  description,
  productName,
  customerEmail,
  customerMobile,
  onSuccess,
  onError,
  onCancel,
  isLoading: externalLoading = false,
  language: initialLanguage = 'EN',
}) => {
  // State
  const [paymentState, setPaymentState] = useState<KNETPaymentState>({
    step: 'idle',
    isLoading: false,
  });
  const [language, setLanguage] = useState<'AR' | 'EN'>(initialLanguage);

  // Memoized values
  const t = useMemo(() => TRANSLATIONS[language], [language]);
  const formattedAmount = useMemo(() => formatAmountDisplay(amount, language), [amount, language]);
  const isRTL = language === 'AR';

  /**
   * Toggle language
   */
  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === 'EN' ? 'AR' : 'EN'));
  }, []);

  /**
   * Handle payment submission
   */
  const handleSubmit = useCallback(async () => {
    setPaymentState({
      step: 'initializing',
      isLoading: true,
    });

    try {
      // Build payment request
      const request = buildPaymentRequest(amount, {
        trackId: generateTrackId('NEXUS'),
        language,
        description,
        customerEmail,
        customerMobile,
      });

      // Initialize payment
      const initResponse = await KNETService.initializePayment(request);

      if (!initResponse.success) {
        const errorMsg = initResponse.errorMessage ||
          getErrorMessage(initResponse.errorCode as KNETErrorCodeType);
        setPaymentState({
          step: 'failed',
          isLoading: false,
          error: {
            code: initResponse.errorCode as KNETErrorCodeType,
            message: errorMsg,
          },
        });
        onError?.({
          code: initResponse.errorCode as KNETErrorCodeType,
          message: errorMsg,
        });
        return;
      }

      // Update state with session info
      setPaymentState({
        step: 'redirecting',
        isLoading: true,
        session: initResponse.paymentId
          ? {
              paymentId: initResponse.paymentId,
              paymentUrl: initResponse.paymentUrl || '',
              sessionToken: initResponse.sessionToken || '',
              expiresAt: initResponse.sessionExpiry || new Date(),
            }
          : undefined,
      });

      // In mock mode, simulate the payment
      if (isMockMode() && initResponse.paymentId) {
        setPaymentState((prev) => ({
          ...prev,
          step: 'processing',
        }));

        // Simulate delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Complete mock payment
        const mockResult = await KNETService.simulateMockPaymentCompletion(
          initResponse.paymentId,
          true
        );

        setPaymentState({
          step: 'completed',
          isLoading: false,
          result: mockResult,
        });

        onSuccess?.(mockResult);
        return;
      }

      // Real mode: redirect to KNET
      if (initResponse.paymentUrl) {
        window.location.href = initResponse.paymentUrl;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Payment failed';
      setPaymentState({
        step: 'failed',
        isLoading: false,
        error: {
          code: 'E011' as KNETErrorCodeType,
          message: errorMsg,
        },
      });
      onError?.({
        code: 'E011' as KNETErrorCodeType,
        message: errorMsg,
      });
    }
  }, [amount, language, description, customerEmail, customerMobile, onSuccess, onError]);

  /**
   * Handle cancel
   */
  const handleCancel = useCallback(() => {
    setPaymentState({
      step: 'idle',
      isLoading: false,
    });
    onCancel?.();
  }, [onCancel]);

  /**
   * Handle retry
   */
  const handleRetry = useCallback(() => {
    setPaymentState({
      step: 'idle',
      isLoading: false,
    });
  }, []);

  /**
   * Handle done (after success)
   */
  const handleDone = useCallback(() => {
    if (paymentState.result) {
      onSuccess?.(paymentState.result);
    }
  }, [paymentState.result, onSuccess]);

  const isProcessing =
    paymentState.step === 'initializing' ||
    paymentState.step === 'redirecting' ||
    paymentState.step === 'processing' ||
    externalLoading;

  return (
    <div
      className={`w-full max-w-md mx-auto ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Card Container */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <KNETLogoLarge className="w-12 h-12" />
              <div>
                <h2 className="text-lg font-semibold text-slate-200">
                  {t.securePayment}
                </h2>
                <p className="text-sm text-slate-400">{t.poweredBy}</p>
              </div>
            </div>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
            >
              {LANGUAGE_LABELS[language].toggle}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Idle State - Payment Summary */}
          {paymentState.step === 'idle' && (
            <div className="space-y-6">
              {/* Payment Summary */}
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-4">
                  {t.paymentSummary}
                </h3>
                <div className="space-y-3">
                  {productName && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">{productName}</span>
                    </div>
                  )}
                  {description && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">{t.description}</span>
                      <span className="text-sm text-slate-300">{description}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-slate-200">
                        {t.amount}
                      </span>
                      <span className="text-2xl font-bold text-white">
                        {formattedAmount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pay Button */}
              <button
                onClick={handleSubmit}
                disabled={isProcessing}
                className={`
                  w-full flex items-center justify-center gap-3
                  px-6 py-4 rounded-xl font-semibold text-lg
                  transition-all duration-200
                  ${isProcessing
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#003B5C] to-[#00557A] text-white hover:from-[#004A73] hover:to-[#006B99] hover:shadow-lg hover:shadow-[#003B5C]/25'
                  }
                `}
              >
                <KNETLogoLarge className="w-6 h-6" />
                <span>{t.payWith}</span>
              </button>

              {/* Cancel Button */}
              {onCancel && (
                <button
                  onClick={handleCancel}
                  className="w-full py-3 text-slate-400 hover:text-slate-200 transition-colors text-sm"
                >
                  {t.cancel}
                </button>
              )}
            </div>
          )}

          {/* Processing States */}
          {(paymentState.step === 'initializing' ||
            paymentState.step === 'redirecting' ||
            paymentState.step === 'processing') && (
            <div className="py-8 flex flex-col items-center gap-6">
              <LoadingSpinner />
              <div className="text-center">
                <p className="text-lg font-medium text-slate-200">
                  {paymentState.step === 'redirecting'
                    ? t.redirecting
                    : t.processing}
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  {t.paymentSummary}: {formattedAmount}
                </p>
              </div>
            </div>
          )}

          {/* Success State */}
          {paymentState.step === 'completed' && paymentState.result && (
            <div className="py-8 flex flex-col items-center gap-6">
              <SuccessIcon />
              <div className="text-center">
                <p className="text-xl font-semibold text-green-500">{t.success}</p>
                <p className="text-2xl font-bold text-white mt-2">
                  {formattedAmount}
                </p>
              </div>

              {/* Transaction Details */}
              <div className="w-full space-y-2 p-4 rounded-lg bg-slate-900/50 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">{t.transactionId}</span>
                  <span className="text-slate-200 font-mono">
                    {paymentState.result.transactionId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t.referenceId}</span>
                  <span className="text-slate-200 font-mono">
                    {paymentState.result.referenceId}
                  </span>
                </div>
                {paymentState.result.authCode && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t.authCode}</span>
                    <span className="text-slate-200 font-mono">
                      {paymentState.result.authCode}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={handleDone}
                className="w-full py-3 px-6 rounded-xl font-medium bg-green-500 text-white hover:bg-green-400 transition-colors"
              >
                {t.done}
              </button>
            </div>
          )}

          {/* Error State */}
          {paymentState.step === 'failed' && paymentState.error && (
            <div className="py-8 flex flex-col items-center gap-6">
              <ErrorIcon />
              <div className="text-center">
                <p className="text-xl font-semibold text-red-400">{t.failed}</p>
                <p className="text-sm text-slate-400 mt-2">
                  {paymentState.error.message}
                </p>
              </div>

              <div className="w-full space-y-3">
                <button
                  onClick={handleRetry}
                  className="w-full py-3 px-6 rounded-xl font-medium bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                >
                  {t.tryAgain}
                </button>
                {onCancel && (
                  <button
                    onClick={handleCancel}
                    className="w-full py-3 text-slate-400 hover:text-slate-200 transition-colors text-sm"
                  >
                    {t.cancel}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700/50">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span>256-bit SSL Encrypted</span>
          </div>

          {/* Mock Mode Indicator */}
          {isMockMode() && (
            <div className="flex items-center justify-center gap-1 mt-2 text-xs text-amber-500/70">
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{t.testMode}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Add CSS animations via style injection
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes scale-in {
    0% { transform: scale(0); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }

  @keyframes check-draw {
    0% { stroke-dasharray: 0, 100; }
    100% { stroke-dasharray: 100, 100; }
  }

  .animate-scale-in {
    animation: scale-in 0.3s ease-out forwards;
  }

  .animate-check-draw {
    stroke-dasharray: 0, 100;
    animation: check-draw 0.5s 0.2s ease-out forwards;
  }
`;
if (typeof document !== 'undefined') {
  document.head.appendChild(styleSheet);
}

export default KNETPaymentForm;
