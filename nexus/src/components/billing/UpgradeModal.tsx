/**
 * Upgrade Modal Component
 *
 * Upgrade flow modal with:
 * - Plan selection
 * - Price confirmation
 * - Pro-rated billing explanation
 * - Stripe checkout integration
 * - Success/error states
 */

import { useState } from 'react';
import type { UpgradeModalProps, Plan } from './billing-types';
import { formatCurrency, formatDate } from './billing-types';

// Modal state constants
const ModalState = {
  CONFIRM: 'confirm',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

type ModalStateType = typeof ModalState[keyof typeof ModalState];

interface PlanChangeDetailsProps {
  currentPlan?: Plan;
  targetPlan?: Plan;
  proratedAmount?: number;
  effectiveDate?: Date;
  immediateCharge?: number;
  credit?: number;
}

function PlanChangeDetails({
  currentPlan,
  targetPlan,
  proratedAmount,
  effectiveDate,
  immediateCharge,
  credit,
}: PlanChangeDetailsProps) {
  if (!targetPlan) return null;

  const isUpgrade = currentPlan && targetPlan.monthlyPrice > currentPlan.monthlyPrice;
  const isDowngrade = currentPlan && targetPlan.monthlyPrice < currentPlan.monthlyPrice;

  return (
    <div className="space-y-4">
      {/* Plan Change Summary */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
        {currentPlan && (
          <>
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-1">Current Plan</p>
              <p className="text-lg font-semibold text-slate-300">{currentPlan.name}</p>
              <p className="text-sm text-slate-400">{formatCurrency(currentPlan.monthlyPrice * 100)}/mo</p>
            </div>
            <div className="flex items-center px-4">
              <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </>
        )}
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-1">New Plan</p>
          <p className={`text-lg font-semibold ${isUpgrade ? 'text-cyan-400' : isDowngrade ? 'text-amber-400' : 'text-slate-200'}`}>
            {targetPlan.name}
          </p>
          <p className="text-sm text-slate-400">{formatCurrency(targetPlan.monthlyPrice * 100)}/mo</p>
        </div>
      </div>

      {/* Billing Details */}
      <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/50 space-y-3">
        <h4 className="text-sm font-semibold text-slate-300">Billing Details</h4>

        {effectiveDate && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Effective Date</span>
            <span className="text-slate-200">{formatDate(effectiveDate)}</span>
          </div>
        )}

        {proratedAmount !== undefined && proratedAmount !== 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Pro-rated adjustment</span>
            <span className={proratedAmount >= 0 ? 'text-slate-200' : 'text-emerald-400'}>
              {proratedAmount >= 0 ? formatCurrency(proratedAmount) : `-${formatCurrency(Math.abs(proratedAmount))}`}
            </span>
          </div>
        )}

        {credit !== undefined && credit > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Account credit applied</span>
            <span className="text-emerald-400">-{formatCurrency(credit)}</span>
          </div>
        )}

        {immediateCharge !== undefined && (
          <div className="flex justify-between text-sm pt-2 border-t border-slate-700">
            <span className="text-slate-300 font-medium">Charge today</span>
            <span className="text-slate-100 font-semibold">{formatCurrency(immediateCharge)}</span>
          </div>
        )}
      </div>

      {/* Pro-rated Explanation */}
      {isUpgrade && proratedAmount !== undefined && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
          <svg className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-cyan-300">Pro-rated Billing</p>
            <p className="text-xs text-cyan-400/80 mt-1">
              You'll only be charged for the remaining days in your current billing period.
              Your new plan will take effect immediately.
            </p>
          </div>
        </div>
      )}

      {isDowngrade && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm text-amber-300">Downgrade Notice</p>
            <p className="text-xs text-amber-400/80 mt-1">
              Your current plan benefits will continue until the end of your billing period.
              The downgrade will take effect on your next billing date.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function SuccessState({ targetPlan }: { targetPlan?: Plan }) {
  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
        <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-slate-100 mb-2">Plan Updated Successfully!</h3>
      <p className="text-slate-400 mb-4">
        You are now on the <span className="text-cyan-400 font-medium">{targetPlan?.name}</span> plan.
      </p>
      <p className="text-sm text-slate-500">
        Your new plan features are available immediately.
      </p>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-slate-100 mb-2">Something went wrong</h3>
      <p className="text-slate-400 mb-6">{error}</p>
      <button
        onClick={onRetry}
        className="px-6 py-2 rounded-lg font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}

function ProcessingState() {
  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
        <svg className="w-10 h-10 text-cyan-400 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-slate-100 mb-2">Processing your upgrade...</h3>
      <p className="text-slate-400">This may take a few moments.</p>
    </div>
  );
}

export function UpgradeModal({
  isOpen,
  onClose,
  currentPlan,
  targetPlan,
  preview,
  onConfirm,
  isLoading = false,
}: UpgradeModalProps) {
  const [modalState, setModalState] = useState<ModalStateType>(ModalState.CONFIRM);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!onConfirm) return;

    setModalState(ModalState.PROCESSING);
    setError('');

    try {
      await onConfirm();
      setModalState(ModalState.SUCCESS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update plan. Please try again.');
      setModalState(ModalState.ERROR);
    }
  };

  const handleRetry = () => {
    setModalState(ModalState.CONFIRM);
    setError('');
  };

  const handleClose = () => {
    // Reset state on close
    setModalState(ModalState.CONFIRM);
    setError('');
    onClose();
  };

  const isUpgrade = currentPlan && targetPlan && targetPlan.monthlyPrice > currentPlan.monthlyPrice;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={modalState === ModalState.PROCESSING ? undefined : handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-slate-100">
            {modalState === ModalState.SUCCESS
              ? 'Success!'
              : modalState === ModalState.ERROR
                ? 'Error'
                : isUpgrade
                  ? 'Upgrade Plan'
                  : 'Change Plan'}
          </h2>
          {modalState !== ModalState.PROCESSING && (
            <button
              onClick={handleClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {modalState === ModalState.CONFIRM && (
            <PlanChangeDetails
              currentPlan={currentPlan}
              targetPlan={targetPlan}
              proratedAmount={preview?.proratedAmount}
              effectiveDate={preview?.effectiveDate}
              immediateCharge={preview?.immediateCharge}
              credit={preview?.credit}
            />
          )}

          {modalState === ModalState.PROCESSING && <ProcessingState />}
          {modalState === ModalState.SUCCESS && <SuccessState targetPlan={targetPlan} />}
          {modalState === ModalState.ERROR && <ErrorState error={error} onRetry={handleRetry} />}
        </div>

        {/* Footer */}
        {modalState === ModalState.CONFIRM && (
          <div className="flex items-center justify-between p-6 border-t border-slate-700">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="px-6 py-2.5 rounded-lg font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading || !targetPlan}
              className={`
                flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isUpgrade
                  ? 'bg-cyan-500 text-white hover:bg-cyan-400'
                  : 'bg-amber-500 text-white hover:bg-amber-400'
                }
              `}
            >
              {isLoading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  {isUpgrade ? 'Confirm Upgrade' : 'Confirm Change'}
                </>
              )}
            </button>
          </div>
        )}

        {modalState === ModalState.SUCCESS && (
          <div className="flex justify-center p-6 border-t border-slate-700">
            <button
              onClick={handleClose}
              className="px-8 py-2.5 rounded-lg font-medium bg-cyan-500 text-white hover:bg-cyan-400 transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {/* Stripe Checkout Integration Notice */}
        {modalState === ModalState.CONFIRM && (
          <div className="px-6 pb-6">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Secured by Stripe</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UpgradeModal;
