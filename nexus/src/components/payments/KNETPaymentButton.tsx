/**
 * KNET Payment Button Component
 *
 * A KNET-branded payment button with:
 * - Official KNET branding/colors
 * - Loading/processing states
 * - Error display
 * - Automatic payment flow handling
 */

import React, { useState, useCallback } from 'react';
import type {
  KNETPaymentButtonProps,
  KNETErrorCodeType,
} from '../../lib/payments/knet-types';
import {
  KNETService,
  formatKWD,
  generateTrackId,
  buildPaymentRequest,
  getErrorMessage,
} from '../../lib/payments/knet-service';
import { isMockMode } from '../../lib/payments/knet-config';

/**
 * KNET Logo SVG Component
 */
const KNETLogo: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none">
    {/* KNET Blue background circle */}
    <circle cx="20" cy="20" r="20" fill="#003B5C" />
    {/* K letter stylized */}
    <path
      d="M12 10v20h4v-8l8 8h5l-9-9 9-11h-5l-8 10V10h-4z"
      fill="#FFFFFF"
    />
    {/* Accent stripe */}
    <rect x="28" y="10" width="3" height="20" rx="1.5" fill="#00A3E0" />
  </svg>
);

/**
 * Loading Spinner Component
 */
const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

/**
 * KNET Payment Button
 *
 * @example
 * <KNETPaymentButton
 *   amount={5000}
 *   description="Premium Plan Subscription"
 *   onSuccess={(response) => console.log('Payment successful:', response)}
 *   onError={(error) => console.error('Payment failed:', error)}
 * />
 */
export const KNETPaymentButton: React.FC<KNETPaymentButtonProps> = ({
  amount,
  trackId,
  description,
  customerEmail,
  customerMobile,
  onSuccess,
  onError,
  onCancel,
  disabled = false,
  buttonText,
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format amount for display
  const formattedAmount = formatKWD(amount);

  /**
   * Handle payment button click
   */
  const handlePayment = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build payment request
      const request = buildPaymentRequest(amount, {
        trackId: trackId || generateTrackId('NEXUS'),
        description,
        customerEmail,
        customerMobile,
      });

      // Initialize payment
      const initResponse = await KNETService.initializePayment(request);

      if (!initResponse.success) {
        const errorMsg = initResponse.errorMessage ||
          getErrorMessage(initResponse.errorCode as KNETErrorCodeType);
        setError(errorMsg);
        onError?.({
          code: initResponse.errorCode as KNETErrorCodeType,
          message: errorMsg,
        });
        return;
      }

      // In mock mode, simulate the payment flow
      if (isMockMode() && initResponse.paymentId) {
        // Simulate user completing payment
        const mockResult = await KNETService.simulateMockPaymentCompletion(
          initResponse.paymentId,
          true
        );
        onSuccess?.(mockResult);
        return;
      }

      // In real mode, redirect to KNET payment page
      if (initResponse.paymentUrl) {
        window.location.href = initResponse.paymentUrl;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Payment initialization failed';
      setError(errorMsg);
      onError?.({
        code: 'E011' as KNETErrorCodeType,
        message: errorMsg,
      });
    } finally {
      setIsLoading(false);
    }
  }, [amount, trackId, description, customerEmail, customerMobile, onSuccess, onError]);

  /**
   * Handle cancel action
   */
  const handleCancel = useCallback(() => {
    setError(null);
    onCancel?.();
  }, [onCancel]);

  const isDisabled = disabled || isLoading;
  const defaultButtonText = `Pay ${formattedAmount.formatted}`;

  return (
    <div className="flex flex-col gap-2">
      {/* Main Payment Button */}
      <button
        onClick={handlePayment}
        disabled={isDisabled}
        className={`
          relative flex items-center justify-center gap-3
          px-6 py-4 rounded-xl font-semibold
          transition-all duration-200 ease-out
          ${isDisabled
            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-[#003B5C] to-[#00557A] text-white hover:from-[#004A73] hover:to-[#006B99] hover:shadow-lg hover:shadow-[#003B5C]/25 active:scale-[0.98]'
          }
          ${className}
        `}
        aria-label={buttonText || defaultButtonText}
      >
        {/* KNET Logo */}
        {!isLoading && (
          <KNETLogo className="w-7 h-7" />
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <LoadingSpinner size="md" />
        )}

        {/* Button Text */}
        <span className="text-base">
          {isLoading ? 'Processing...' : (buttonText || defaultButtonText)}
        </span>

        {/* KNET Badge */}
        <span className="absolute top-1 right-2 text-[10px] text-[#00A3E0] font-medium opacity-75">
          KNET
        </span>
      </button>

      {/* Error Display */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <svg
            className="w-5 h-5 text-red-400 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={handleCancel}
              className="mt-1 text-xs text-red-400/70 hover:text-red-400 underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Security Badge */}
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
        <span>Secured by Kuwait National Payment System</span>
      </div>

      {/* Mock Mode Indicator */}
      {isMockMode() && (
        <div className="flex items-center justify-center gap-1 text-xs text-amber-500/70">
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
          <span>Test Mode - No real charges</span>
        </div>
      )}
    </div>
  );
};

export default KNETPaymentButton;
