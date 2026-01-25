/**
 * DecisionButtons Component
 * Action buttons for making approval decisions in HITL workflows
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { APPROVAL_STATUS } from '@/lib/hitl/hitl-types';
import type { DecisionButtonsProps, ConfirmationDialogState } from './hitl-component-types';
import { DECISION_TYPE } from './hitl-component-types';
import type { DecisionType } from './hitl-component-types';

/**
 * Icons for decision actions
 */
const CheckIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ArrowUpIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
  </svg>
);

const QuestionIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

/**
 * Confirmation Dialog Component
 */
interface ConfirmDialogProps {
  state: ConfirmationDialogState;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function ConfirmDialog({ state, onConfirm, onCancel, isLoading }: ConfirmDialogProps) {
  const [reason, setReason] = useState(state.reason ?? '');

  const handleConfirm = useCallback(() => {
    onConfirm(state.requiresReason ? reason : undefined);
  }, [onConfirm, reason, state.requiresReason]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey && reason.trim()) {
      handleConfirm();
    }
  }, [handleConfirm, reason]);

  if (!state.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
        onKeyDown={(e) => e.key === 'Escape' && onCancel()}
        role="button"
        tabIndex={0}
        aria-label="Close dialog"
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-slate-800 border border-slate-700 rounded-lg shadow-xl">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-2">
            {state.title}
          </h3>
          <p className="text-slate-400 text-sm mb-4">
            {state.message}
          </p>

          {state.requiresReason && (
            <div className="mb-4">
              <label htmlFor="reason-input" className="block text-sm font-medium text-slate-300 mb-2">
                {state.action === DECISION_TYPE.REJECT && 'Reason for rejection'}
                {state.action === DECISION_TYPE.ESCALATE && 'Reason for escalation'}
                {state.action === DECISION_TYPE.REQUEST_INFO && 'Questions to ask'}
              </label>
              <textarea
                id="reason-input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  state.action === DECISION_TYPE.REJECT
                    ? 'Please provide a reason for rejecting this request...'
                    : state.action === DECISION_TYPE.ESCALATE
                    ? 'Please explain why this needs to be escalated...'
                    : 'What additional information do you need?'
                }
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                rows={3}
                autoFocus
              />
              <p className="text-xs text-slate-500 mt-1">
                Press Ctrl+Enter to confirm
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isLoading}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              variant={state.action === DECISION_TYPE.APPROVE ? 'success' : 'destructive'}
              size="sm"
              onClick={handleConfirm}
              disabled={state.requiresReason && !reason.trim()}
              loading={isLoading}
              className={cn(
                state.action === DECISION_TYPE.ESCALATE && 'bg-amber-600 hover:bg-amber-700',
                state.action === DECISION_TYPE.REQUEST_INFO && 'bg-blue-600 hover:bg-blue-700'
              )}
            >
              Confirm
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * DecisionButtons Component
 * Provides action buttons for making approval decisions
 */
export function DecisionButtons({
  requestId,
  status,
  onApprove,
  onReject,
  onEscalate,
  onRequestInfo,
  isLoading = false,
  loadingAction = null,
  requireConfirmation = true,
  disabled = false,
  compact = false,
  className,
}: DecisionButtonsProps) {
  const [dialogState, setDialogState] = useState<ConfirmationDialogState>({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    requiresReason: false,
  });

  // Check if the request can be acted upon
  const canAct = status === APPROVAL_STATUS.PENDING || status === APPROVAL_STATUS.ESCALATED;

  /**
   * Opens confirmation dialog for an action
   */
  const openConfirmDialog = useCallback((action: DecisionType) => {
    const configs: Record<DecisionType, Omit<ConfirmationDialogState, 'isOpen'>> = {
      [DECISION_TYPE.APPROVE]: {
        title: 'Approve Request',
        message: 'Are you sure you want to approve this request? This action will allow the workflow to continue.',
        action: DECISION_TYPE.APPROVE,
        requiresReason: false,
      },
      [DECISION_TYPE.REJECT]: {
        title: 'Reject Request',
        message: 'Are you sure you want to reject this request? Please provide a reason for rejection.',
        action: DECISION_TYPE.REJECT,
        requiresReason: true,
      },
      [DECISION_TYPE.ESCALATE]: {
        title: 'Escalate Request',
        message: 'This will escalate the request to a higher authority. Please provide a reason for escalation.',
        action: DECISION_TYPE.ESCALATE,
        requiresReason: true,
      },
      [DECISION_TYPE.REQUEST_INFO]: {
        title: 'Request More Information',
        message: 'What additional information do you need to make a decision?',
        action: DECISION_TYPE.REQUEST_INFO,
        requiresReason: true,
      },
    };

    setDialogState({
      ...configs[action],
      isOpen: true,
    });
  }, []);

  /**
   * Handles direct action execution (without confirmation)
   */
  const executeAction = useCallback((action: DecisionType, reason?: string) => {
    switch (action) {
      case DECISION_TYPE.APPROVE:
        onApprove?.(requestId, reason);
        break;
      case DECISION_TYPE.REJECT:
        if (reason) onReject?.(requestId, reason);
        break;
      case DECISION_TYPE.ESCALATE:
        if (reason) onEscalate?.(requestId, reason);
        break;
      case DECISION_TYPE.REQUEST_INFO:
        if (reason) onRequestInfo?.(requestId, reason);
        break;
    }
  }, [requestId, onApprove, onReject, onEscalate, onRequestInfo]);

  /**
   * Handles button click - either opens dialog or executes directly
   */
  const handleAction = useCallback((action: DecisionType) => {
    if (requireConfirmation) {
      openConfirmDialog(action);
    } else if (action === DECISION_TYPE.APPROVE) {
      executeAction(action);
    } else {
      // Actions requiring reason still need dialog even without confirmation
      openConfirmDialog(action);
    }
  }, [requireConfirmation, openConfirmDialog, executeAction]);

  /**
   * Handles dialog confirmation
   */
  const handleDialogConfirm = useCallback((reason?: string) => {
    if (dialogState.action) {
      executeAction(dialogState.action, reason);
    }
    setDialogState(prev => ({ ...prev, isOpen: false }));
  }, [dialogState.action, executeAction]);

  /**
   * Handles dialog cancellation
   */
  const handleDialogCancel = useCallback(() => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
  }, []);

  /**
   * Determines if a specific button is loading
   */
  const isButtonLoading = useCallback((action: DecisionType) => {
    return isLoading && loadingAction === action;
  }, [isLoading, loadingAction]);

  // Compact layout for inline display
  if (compact) {
    return (
      <>
        <div className={cn('flex items-center gap-1', className)}>
          {/* Approve Button */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleAction(DECISION_TYPE.APPROVE)}
            disabled={disabled || !canAct || isLoading}
            loading={isButtonLoading(DECISION_TYPE.APPROVE)}
            className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
            title="Approve"
          >
            <CheckIcon />
          </Button>

          {/* Reject Button */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleAction(DECISION_TYPE.REJECT)}
            disabled={disabled || !canAct || isLoading}
            loading={isButtonLoading(DECISION_TYPE.REJECT)}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            title="Reject"
          >
            <XIcon />
          </Button>

          {/* Escalate Button */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleAction(DECISION_TYPE.ESCALATE)}
            disabled={disabled || !canAct || isLoading}
            loading={isButtonLoading(DECISION_TYPE.ESCALATE)}
            className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
            title="Escalate"
          >
            <ArrowUpIcon />
          </Button>

          {/* Request Info Button */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleAction(DECISION_TYPE.REQUEST_INFO)}
            disabled={disabled || !canAct || isLoading}
            loading={isButtonLoading(DECISION_TYPE.REQUEST_INFO)}
            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
            title="Request More Info"
          >
            <QuestionIcon />
          </Button>
        </div>

        {/* Confirmation Dialog */}
        <ConfirmDialog
          state={dialogState}
          onConfirm={handleDialogConfirm}
          onCancel={handleDialogCancel}
          isLoading={isLoading}
        />
      </>
    );
  }

  // Full layout with labels
  return (
    <>
      <div className={cn('flex flex-wrap items-center gap-3', className)}>
        {/* Approve Button - Green Gradient */}
        <Button
          variant="success"
          size="default"
          onClick={() => handleAction(DECISION_TYPE.APPROVE)}
          disabled={disabled || !canAct || isLoading}
          loading={isButtonLoading(DECISION_TYPE.APPROVE)}
          leftIcon={<CheckIcon />}
          className="bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 shadow-lg shadow-emerald-500/25"
        >
          Approve
        </Button>

        {/* Reject Button - Red */}
        <Button
          variant="destructive"
          size="default"
          onClick={() => handleAction(DECISION_TYPE.REJECT)}
          disabled={disabled || !canAct || isLoading}
          loading={isButtonLoading(DECISION_TYPE.REJECT)}
          leftIcon={<XIcon />}
          className="bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 shadow-lg shadow-red-500/25"
        >
          Reject
        </Button>

        {/* Escalate Button - Amber */}
        <Button
          variant="secondary"
          size="default"
          onClick={() => handleAction(DECISION_TYPE.ESCALATE)}
          disabled={disabled || !canAct || isLoading}
          loading={isButtonLoading(DECISION_TYPE.ESCALATE)}
          leftIcon={<ArrowUpIcon />}
          className="bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white shadow-lg shadow-amber-500/25"
        >
          Escalate
        </Button>

        {/* Request More Info Button - Blue */}
        <Button
          variant="outline"
          size="default"
          onClick={() => handleAction(DECISION_TYPE.REQUEST_INFO)}
          disabled={disabled || !canAct || isLoading}
          loading={isButtonLoading(DECISION_TYPE.REQUEST_INFO)}
          leftIcon={<QuestionIcon />}
          className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:border-blue-400"
        >
          Request Info
        </Button>
      </div>

      {/* Status message when request cannot be acted upon */}
      {!canAct && (
        <p className="mt-2 text-sm text-slate-500">
          This request has already been {status}. No further action is required.
        </p>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        state={dialogState}
        onConfirm={handleDialogConfirm}
        onCancel={handleDialogCancel}
        isLoading={isLoading}
      />
    </>
  );
}

export default DecisionButtons;
