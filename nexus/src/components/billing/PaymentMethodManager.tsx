/**
 * Payment Method Manager Component
 *
 * Payment method management with:
 * - List saved payment methods
 * - Add new card (Stripe Elements integration ready)
 * - Set default payment method
 * - Remove payment method
 * - Card brand icons (Visa, Mastercard, Amex)
 */

import React, { useState } from 'react';
import type { PaymentMethodManagerProps, PaymentMethod, CardBrandType } from './billing-types';
import { CardBrand } from './billing-types';

// Card brand icons (SVG paths)
const cardBrandIcons: Record<CardBrandType, React.ReactNode> = {
  [CardBrand.VISA]: (
    <svg viewBox="0 0 38 24" className="w-10 h-6">
      <rect width="38" height="24" rx="3" fill="#1434CB" />
      <path
        d="M16.53 15.24l1.04-6.43h1.67l-1.04 6.43h-1.67zm6.64-6.27c-.33-.13-.85-.27-1.5-.27-1.65 0-2.82.88-2.83 2.14-.01.93.83 1.45 1.47 1.76.65.32 1 .52 1 .81 0 .44-.6.64-1.15.64-.77 0-1.18-.11-1.81-.39l-.25-.12-.27 1.67c.45.21 1.28.39 2.14.4 1.76 0 2.9-.87 2.92-2.21.01-.74-.44-1.3-1.4-1.76-.58-.3-.94-.5-.94-.81 0-.27.3-.56.96-.56.55-.01 1.05.12 1.4.25l.17.08.26-1.63zm4.31-.16h-1.29c-.4 0-.7.11-.87.53l-2.48 5.9h1.76s.29-.8.35-.97h2.15c.05.23.2.97.2.97h1.55l-1.37-6.43zm-2.05 4.15c.14-.37.67-1.81.67-1.81-.01.02.14-.38.22-.62l.12.56s.32 1.55.39 1.87h-1.4zm-11.29-4.15l-1.64 4.38-.18-.89c-.3-1.03-1.24-2.15-2.29-2.71l1.5 5.65h1.77l2.63-6.43h-1.79z"
        fill="#fff"
      />
      <path d="M9.75 8.81H7.02l-.03.16c2.1.54 3.49 1.83 4.06 3.38l-.59-2.97c-.1-.41-.39-.54-.71-.57z" fill="#F9A533" />
    </svg>
  ),
  [CardBrand.MASTERCARD]: (
    <svg viewBox="0 0 38 24" className="w-10 h-6">
      <rect width="38" height="24" rx="3" fill="#000" />
      <circle cx="15" cy="12" r="7" fill="#EB001B" />
      <circle cx="23" cy="12" r="7" fill="#F79E1B" />
      <path d="M19 7.5a7 7 0 010 9 7 7 0 000-9z" fill="#FF5F00" />
    </svg>
  ),
  [CardBrand.AMEX]: (
    <svg viewBox="0 0 38 24" className="w-10 h-6">
      <rect width="38" height="24" rx="3" fill="#006FCF" />
      <text x="19" y="14" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="bold" fontFamily="Arial">AMEX</text>
    </svg>
  ),
  [CardBrand.DISCOVER]: (
    <svg viewBox="0 0 38 24" className="w-10 h-6">
      <rect width="38" height="24" rx="3" fill="#FF6600" />
      <text x="19" y="14" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold" fontFamily="Arial">DISCOVER</text>
    </svg>
  ),
  [CardBrand.DINERS]: (
    <svg viewBox="0 0 38 24" className="w-10 h-6">
      <rect width="38" height="24" rx="3" fill="#0079BE" />
      <circle cx="19" cy="12" r="6" fill="#fff" />
    </svg>
  ),
  [CardBrand.JCB]: (
    <svg viewBox="0 0 38 24" className="w-10 h-6">
      <rect width="38" height="24" rx="3" fill="#fff" />
      <rect x="4" y="4" width="10" height="16" rx="2" fill="#0E4C96" />
      <rect x="14" y="4" width="10" height="16" rx="2" fill="#E11837" />
      <rect x="24" y="4" width="10" height="16" rx="2" fill="#00A651" />
    </svg>
  ),
  [CardBrand.UNIONPAY]: (
    <svg viewBox="0 0 38 24" className="w-10 h-6">
      <rect width="38" height="24" rx="3" fill="#E21836" />
      <text x="19" y="14" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold" fontFamily="Arial">UnionPay</text>
    </svg>
  ),
  [CardBrand.UNKNOWN]: (
    <svg viewBox="0 0 38 24" className="w-10 h-6">
      <rect width="38" height="24" rx="3" fill="#64748B" />
      <path d="M14 8h10v8H14z" fill="none" stroke="#fff" strokeWidth="1.5" />
      <circle cx="19" cy="12" r="2" fill="#fff" />
    </svg>
  ),
};

interface PaymentMethodCardProps {
  method: PaymentMethod;
  onSetDefault?: () => void;
  onRemove?: () => void;
}

function PaymentMethodCard({ method, onSetDefault, onRemove }: PaymentMethodCardProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleRemove = () => {
    if (showConfirmDelete) {
      if (onRemove) {
        onRemove();
      }
      setShowConfirmDelete(false);
    } else {
      setShowConfirmDelete(true);
    }
  };

  const isExpiringSoon = () => {
    const expiry = new Date(method.card.expYear, method.card.expMonth - 1);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return expiry <= threeMonthsFromNow;
  };

  const isExpired = () => {
    const now = new Date();
    const expiry = new Date(method.card.expYear, method.card.expMonth);
    return expiry < now;
  };

  return (
    <div className={`
      relative p-4 rounded-xl border transition-all
      ${method.isDefault
        ? 'border-cyan-500/50 bg-cyan-500/5'
        : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
      }
    `}>
      {/* Default Badge */}
      {method.isDefault && (
        <div className="absolute -top-2 -right-2">
          <span className="px-2 py-0.5 rounded-full bg-cyan-500 text-white text-xs font-semibold">
            Default
          </span>
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Card Icon */}
        <div className="shrink-0">
          {cardBrandIcons[method.card.brand]}
        </div>

        {/* Card Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-200">
              {method.card.brand.charAt(0).toUpperCase() + method.card.brand.slice(1)} ending in {method.card.last4}
            </p>
            {isExpired() && (
              <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-xs border border-red-500/20">
                Expired
              </span>
            )}
            {!isExpired() && isExpiringSoon() && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs border border-amber-500/20">
                Expiring Soon
              </span>
            )}
          </div>
          <p className={`text-xs mt-1 ${isExpired() ? 'text-red-400' : 'text-slate-400'}`}>
            Expires {method.card.expMonth.toString().padStart(2, '0')}/{method.card.expYear}
          </p>
          {method.card.holderName && (
            <p className="text-xs text-slate-500 mt-0.5">{method.card.holderName}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {!method.isDefault && (
            <button
              onClick={onSetDefault}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors"
            >
              Set Default
            </button>
          )}
          <button
            onClick={handleRemove}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${showConfirmDelete
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
              }
            `}
          >
            {showConfirmDelete ? 'Confirm Delete' : 'Remove'}
          </button>
        </div>
      </div>

      {/* Cancel delete confirmation */}
      {showConfirmDelete && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <p className="text-xs text-slate-400 mb-2">
            Are you sure you want to remove this payment method?
          </p>
          <button
            onClick={() => setShowConfirmDelete(false)}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

interface AddCardFormProps {
  onCancel: () => void;
  onSubmit: () => void;
}

function AddCardForm({ onCancel, onSubmit }: AddCardFormProps) {
  // This is a placeholder for Stripe Elements integration
  // In production, you would mount Stripe Elements here

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-xl border border-slate-700 bg-slate-800/50">
      <h3 className="text-lg font-semibold text-slate-200 mb-4">Add Payment Method</h3>

      {/* Stripe Elements placeholder */}
      <div className="space-y-4">
        <div className="p-4 rounded-lg border border-dashed border-slate-600 bg-slate-900/50">
          <p className="text-sm text-slate-400 text-center">
            Stripe Elements Card Input will be mounted here
          </p>
          <p className="text-xs text-slate-500 text-center mt-2">
            Integration with @stripe/react-stripe-js required
          </p>
        </div>

        {/* Mock input fields for visualization */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Card Number
          </label>
          <input
            type="text"
            placeholder="4242 4242 4242 4242"
            className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            disabled
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Expiry Date
            </label>
            <input
              type="text"
              placeholder="MM/YY"
              className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              CVC
            </label>
            <input
              type="text"
              placeholder="123"
              className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              disabled
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Cardholder Name
          </label>
          <input
            type="text"
            placeholder="John Doe"
            className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            disabled
          />
        </div>
      </div>

      {/* Secure payment notice */}
      <div className="flex items-center gap-2 mt-4 text-xs text-slate-500">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>Your payment information is encrypted and secure</span>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          className="flex-1 py-3 px-4 rounded-lg font-medium bg-cyan-500 text-white hover:bg-cyan-400 transition-colors"
        >
          Add Card
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 rounded-lg font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function PaymentMethodManager({
  paymentMethods,
  onAddPaymentMethod,
  onRemovePaymentMethod,
  onSetDefault,
}: PaymentMethodManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddClick = () => {
    if (onAddPaymentMethod) {
      onAddPaymentMethod();
    } else {
      setShowAddForm(true);
    }
  };

  const handleAddCancel = () => {
    setShowAddForm(false);
  };

  const handleAddSubmit = () => {
    // In production, this would handle the Stripe token creation
    setShowAddForm(false);
    if (onAddPaymentMethod) {
      onAddPaymentMethod();
    }
  };

  const handleRemove = (methodId: string) => {
    if (onRemovePaymentMethod) {
      onRemovePaymentMethod(methodId);
    }
  };

  const handleSetDefault = (methodId: string) => {
    if (onSetDefault) {
      onSetDefault(methodId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-200">Payment Methods</h3>
          <p className="text-sm text-slate-400 mt-1">Manage your saved payment methods</p>
        </div>
        {!showAddForm && (
          <button
            onClick={handleAddClick}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-cyan-500 text-white hover:bg-cyan-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Card
          </button>
        )}
      </div>

      {/* Add Card Form */}
      {showAddForm && (
        <AddCardForm onCancel={handleAddCancel} onSubmit={handleAddSubmit} />
      )}

      {/* Payment Methods List */}
      {paymentMethods.length === 0 && !showAddForm ? (
        <div className="text-center py-12 px-4 border border-dashed border-slate-700 rounded-xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-slate-200 mb-2">No payment methods</h4>
          <p className="text-slate-400 text-sm mb-4">Add a payment method to subscribe to a plan</p>
          <button
            onClick={handleAddClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Payment Method
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              method={method}
              onSetDefault={() => handleSetDefault(method.id)}
              onRemove={() => handleRemove(method.id)}
            />
          ))}
        </div>
      )}

      {/* Security Note */}
      {paymentMethods.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
          <svg className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div>
            <p className="text-sm text-slate-300">Your payment information is secure</p>
            <p className="text-xs text-slate-500 mt-1">
              We use Stripe for payment processing and never store your full card details on our servers.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentMethodManager;
