/**
 * Invoice Download Component
 *
 * Invoice download functionality with:
 * - List of invoices by month
 * - Download as PDF link
 * - Invoice preview modal
 * - Bulk download option
 */

import { useState } from 'react';
import type { InvoiceDownloadProps, Invoice } from './billing-types';
import { formatCurrency, formatDate } from './billing-types';

// Invoice status configuration
const invoiceStatusConfig: Record<Invoice['status'], { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  },
  open: {
    label: 'Open',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  paid: {
    label: 'Paid',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  void: {
    label: 'Void',
    className: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  },
  uncollectible: {
    label: 'Uncollectible',
    className: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
};

interface InvoiceRowProps {
  invoice: Invoice;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onDownload: () => void;
  onPreview: () => void;
}

function InvoiceRow({ invoice, isSelected, onSelect, onDownload, onPreview }: InvoiceRowProps) {
  const statusConfig = invoiceStatusConfig[invoice.status];

  return (
    <div className={`
      flex items-center gap-4 p-4 rounded-lg border transition-all
      ${isSelected
        ? 'border-cyan-500/50 bg-cyan-500/5'
        : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'
      }
    `}>
      {/* Checkbox */}
      <div className="shrink-0">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
        />
      </div>

      {/* Invoice Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-200">Invoice #{invoice.number}</p>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig.className}`}>
            {statusConfig.label}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {formatDate(new Date(invoice.periodStart))} - {formatDate(new Date(invoice.periodEnd))}
        </p>
      </div>

      {/* Amount */}
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-slate-200">
          {formatCurrency(invoice.amount, invoice.currency)}
        </p>
        {invoice.paidAt && (
          <p className="text-xs text-slate-500">
            Paid {formatDate(new Date(invoice.paidAt))}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onPreview}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
          title="Preview"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
        <button
          onClick={onDownload}
          className="p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
          title="Download PDF"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

interface InvoicePreviewModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
}

function InvoicePreviewModal({ invoice, isOpen, onClose, onDownload }: InvoicePreviewModalProps) {
  if (!isOpen || !invoice) return null;

  const statusConfig = invoiceStatusConfig[invoice.status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-slate-700 bg-slate-900">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Invoice #{invoice.number}</h2>
            <p className="text-sm text-slate-400 mt-1">
              {formatDate(new Date(invoice.createdAt))}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status and Amount */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.className}`}>
                {statusConfig.label}
              </span>
              {invoice.dueDate && invoice.status === 'open' && (
                <span className="text-sm text-slate-400">
                  Due {formatDate(new Date(invoice.dueDate))}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-slate-100">
              {formatCurrency(invoice.amount, invoice.currency)}
            </p>
          </div>

          {/* Invoice Period */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Billing Period</h3>
            <p className="text-slate-400">
              {formatDate(new Date(invoice.periodStart))} - {formatDate(new Date(invoice.periodEnd))}
            </p>
          </div>

          {/* Line Items */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Line Items</h3>
            <div className="space-y-2">
              {invoice.lineItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/50"
                >
                  <div>
                    <p className="text-sm text-slate-200">{item.description}</p>
                    {item.quantity > 1 && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {item.quantity} x {formatCurrency(item.unitAmount, invoice.currency)}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-200">
                    {formatCurrency(item.amount, invoice.currency)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <p className="text-lg font-semibold text-slate-200">Total</p>
            <p className="text-xl font-bold text-cyan-400">
              {formatCurrency(invoice.amount, invoice.currency)}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 flex items-center justify-between p-6 border-t border-slate-700 bg-slate-900">
          {invoice.hostedUrl && (
            <a
              href={invoice.hostedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View on Stripe
            </a>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors"
            >
              Close
            </button>
            <button
              onClick={onDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-cyan-500 text-white hover:bg-cyan-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function InvoiceDownload({
  invoices,
  onDownload,
  onPreview,
  onBulkDownload,
}: InvoiceDownloadProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedIds(new Set(invoices.map((inv) => inv.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (invoiceId: string, selected: boolean) => {
    const newSelected = new Set(selectedIds);
    if (selected) {
      newSelected.add(invoiceId);
    } else {
      newSelected.delete(invoiceId);
    }
    setSelectedIds(newSelected);
  };

  const handleDownload = (invoiceId: string) => {
    if (onDownload) {
      onDownload(invoiceId);
    }
  };

  const handlePreview = (invoice: Invoice) => {
    if (onPreview) {
      onPreview(invoice);
    } else {
      setPreviewInvoice(invoice);
    }
  };

  const handleBulkDownload = () => {
    if (onBulkDownload && selectedIds.size > 0) {
      onBulkDownload(Array.from(selectedIds));
    }
  };

  const isAllSelected = invoices.length > 0 && selectedIds.size === invoices.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < invoices.length;

  // Group invoices by year/month
  const groupedInvoices = invoices.reduce((groups, invoice) => {
    const date = new Date(invoice.createdAt);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (!groups[key]) {
      groups[key] = {
        label: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
        invoices: [],
      };
    }
    groups[key].invoices.push(invoice);
    return groups;
  }, {} as Record<string, { label: string; invoices: Invoice[] }>);

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-200 mb-2">No invoices yet</h3>
        <p className="text-slate-400 text-sm">Your invoices will appear here after your first payment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with bulk actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isAllSelected}
            ref={(el) => {
              if (el) {
                el.indeterminate = isSomeSelected;
              }
            }}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
          />
          <span className="text-sm text-slate-400">
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
          </span>
        </div>

        {selectedIds.size > 0 && (
          <button
            onClick={handleBulkDownload}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-cyan-500 text-white hover:bg-cyan-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download {selectedIds.size} Invoice{selectedIds.size > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Grouped Invoice List */}
      {Object.entries(groupedInvoices).map(([key, group]) => (
        <div key={key}>
          <h3 className="text-sm font-semibold text-slate-400 mb-3">{group.label}</h3>
          <div className="space-y-2">
            {group.invoices.map((invoice) => (
              <InvoiceRow
                key={invoice.id}
                invoice={invoice}
                isSelected={selectedIds.has(invoice.id)}
                onSelect={(selected) => handleSelectOne(invoice.id, selected)}
                onDownload={() => handleDownload(invoice.id)}
                onPreview={() => handlePreview(invoice)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Preview Modal */}
      <InvoicePreviewModal
        invoice={previewInvoice}
        isOpen={previewInvoice !== null}
        onClose={() => setPreviewInvoice(null)}
        onDownload={() => {
          if (previewInvoice) {
            handleDownload(previewInvoice.id);
          }
        }}
      />
    </div>
  );
}

export default InvoiceDownload;
