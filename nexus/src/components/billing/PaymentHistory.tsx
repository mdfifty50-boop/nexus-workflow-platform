/**
 * Payment History Component
 *
 * Payment history list with:
 * - Date, amount, status
 * - Invoice download link
 * - Refund indicator
 * - Failed payment warning
 * - Pagination support
 */

// PaymentHistory component
import type { PaymentHistoryProps, Payment, PaymentStatusType } from './billing-types';
import { PaymentStatus, formatCurrency, formatDate } from './billing-types';

// Status badge configuration
const statusConfig: Record<PaymentStatusType, { label: string; className: string; icon: string }> = {
  [PaymentStatus.SUCCEEDED]: {
    label: 'Paid',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: '✓',
  },
  [PaymentStatus.PENDING]: {
    label: 'Pending',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: '○',
  },
  [PaymentStatus.FAILED]: {
    label: 'Failed',
    className: 'bg-red-500/10 text-red-400 border-red-500/20',
    icon: '✕',
  },
  [PaymentStatus.REFUNDED]: {
    label: 'Refunded',
    className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    icon: '↩',
  },
  [PaymentStatus.PARTIALLY_REFUNDED]: {
    label: 'Partial Refund',
    className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    icon: '↩',
  },
};

interface PaymentRowProps {
  payment: Payment;
  onDownloadInvoice?: (invoiceId: string) => void;
}

function PaymentRow({ payment, onDownloadInvoice }: PaymentRowProps) {
  const config = statusConfig[payment.status];

  const handleDownload = () => {
    if (payment.invoiceId && onDownloadInvoice) {
      onDownloadInvoice(payment.invoiceId);
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors">
      {/* Date */}
      <div className="w-24 shrink-0">
        <p className="text-sm font-medium text-slate-200">
          {formatDate(new Date(payment.createdAt))}
        </p>
        <p className="text-xs text-slate-500">
          {new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* Description */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 truncate">{payment.description}</p>
        {payment.failureReason && (
          <p className="text-xs text-red-400 mt-0.5 truncate">
            Failed: {payment.failureReason}
          </p>
        )}
        {payment.refundedAmount && payment.refundedAmount > 0 && (
          <p className="text-xs text-slate-400 mt-0.5">
            Refunded: {formatCurrency(payment.refundedAmount, payment.currency)}
          </p>
        )}
      </div>

      {/* Amount */}
      <div className="text-right shrink-0">
        <p className={`text-sm font-semibold ${
          payment.status === PaymentStatus.REFUNDED ? 'text-slate-400 line-through' :
          payment.status === PaymentStatus.FAILED ? 'text-red-400' :
          'text-slate-200'
        }`}>
          {formatCurrency(payment.amount, payment.currency)}
        </p>
        {payment.status === PaymentStatus.PARTIALLY_REFUNDED && payment.refundedAmount && (
          <p className="text-xs text-slate-400">
            Net: {formatCurrency(payment.amount - payment.refundedAmount, payment.currency)}
          </p>
        )}
      </div>

      {/* Status Badge */}
      <div className="shrink-0">
        <span className={`
          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
          border ${config.className}
        `}>
          <span>{config.icon}</span>
          {config.label}
        </span>
      </div>

      {/* Invoice Link */}
      <div className="shrink-0 w-20">
        {payment.invoiceId ? (
          <button
            onClick={handleDownload}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Invoice
          </button>
        ) : (
          <span className="text-xs text-slate-600">-</span>
        )}
      </div>
    </div>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {getPageNumbers().map((page, index) => (
        page === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className="px-2 text-slate-500">...</span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`
              w-10 h-10 rounded-lg text-sm font-medium transition-colors
              ${currentPage === page
                ? 'bg-cyan-500 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }
            `}
          >
            {page}
          </button>
        )
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

export function PaymentHistory({
  payments,
  totalCount,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  onDownloadInvoice,
}: PaymentHistoryProps) {
  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 1;

  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };

  // Separate failed payments for warning
  const failedPayments = payments.filter(p => p.status === PaymentStatus.FAILED);

  if (payments.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-200 mb-2">No payment history</h3>
        <p className="text-slate-400 text-sm">Your payment history will appear here once you make a purchase.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Failed Payment Warning */}
      {failedPayments.length > 0 && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-xs text-white">!</span>
            </div>
            <div>
              <h4 className="text-sm font-medium text-red-400">
                {failedPayments.length} Failed Payment{failedPayments.length > 1 ? 's' : ''}
              </h4>
              <p className="text-xs text-red-400/80 mt-1">
                Please update your payment method to avoid service interruption.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment List */}
      <div className="space-y-2">
        {payments.map((payment) => (
          <PaymentRow
            key={payment.id}
            payment={payment}
            onDownloadInvoice={onDownloadInvoice}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Summary */}
      {totalCount && totalCount > payments.length && (
        <p className="text-center text-xs text-slate-500 mt-4">
          Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalCount)} of {totalCount} payments
        </p>
      )}
    </div>
  );
}

export default PaymentHistory;
