/**
 * Billing Dashboard Component
 *
 * Main billing overview showing:
 * - Current plan and status
 * - Usage overview
 * - Payment history summary
 * - Upgrade/downgrade options
 */

import { useState } from 'react';
import type {
  BillingDashboardProps,
  Plan,
  UsageMetric,
  BillingCycleType,
  Subscription,
  SubscriptionStatusType,
} from './billing-types';
import {
  SubscriptionStatus,
  BillingCycle,
  PlanTier,
  formatCurrency,
  formatDate,
} from './billing-types';
import { UsageMeters } from './UsageMeters';
import { PaymentHistory } from './PaymentHistory';
import { PlanComparison } from './PlanComparison';
import { PaymentMethodManager } from './PaymentMethodManager';
import { InvoiceDownload } from './InvoiceDownload';
import { UpgradeModal } from './UpgradeModal';

// Subscription status badge configuration
const subscriptionStatusConfig: Record<
  SubscriptionStatusType,
  { label: string; className: string }
> = {
  [SubscriptionStatus.ACTIVE]: {
    label: 'Active',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  [SubscriptionStatus.CANCELED]: {
    label: 'Canceled',
    className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  },
  [SubscriptionStatus.PAST_DUE]: {
    label: 'Past Due',
    className: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
  [SubscriptionStatus.TRIALING]: {
    label: 'Trial',
    className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
  [SubscriptionStatus.PAUSED]: {
    label: 'Paused',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
};

// Tab configuration
const tabs = [
  { id: 'overview', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'plans', label: 'Plans', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { id: 'payment-methods', label: 'Payment Methods', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { id: 'invoices', label: 'Invoices', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
] as const;

type TabId = typeof tabs[number]['id'];

interface CurrentPlanCardProps {
  subscription?: Subscription;
  onUpgrade?: () => void;
  onManagePayment?: () => void;
}

function CurrentPlanCard({ subscription, onUpgrade, onManagePayment }: CurrentPlanCardProps) {
  if (!subscription) {
    return (
      <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-200 mb-2">No Active Subscription</h3>
          <p className="text-slate-400 text-sm mb-4">Get started with a plan to unlock all features.</p>
          <button
            onClick={onUpgrade}
            className="px-6 py-2 rounded-lg font-medium bg-cyan-500 text-white hover:bg-cyan-400 transition-colors"
          >
            Choose a Plan
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = subscriptionStatusConfig[subscription.status];
  const daysUntilRenewal = Math.ceil(
    (new Date(subscription.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="p-6 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-2xl font-bold text-slate-100">{subscription.plan.name}</h3>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.className}`}>
              {statusConfig.label}
            </span>
          </div>
          <p className="text-slate-400">{subscription.plan.description}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-slate-100">
            {formatCurrency(
              subscription.billingCycle === BillingCycle.MONTHLY
                ? subscription.plan.monthlyPrice * 100
                : subscription.plan.annualPrice / 12 * 100
            )}
          </p>
          <p className="text-sm text-slate-400">
            per month, billed {subscription.billingCycle}
          </p>
        </div>
      </div>

      {/* Billing Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
          <p className="text-xs text-slate-500 mb-1">Current Period</p>
          <p className="text-sm text-slate-200">
            {formatDate(new Date(subscription.currentPeriodStart))}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
          <p className="text-xs text-slate-500 mb-1">Next Billing</p>
          <p className="text-sm text-slate-200">
            {formatDate(new Date(subscription.currentPeriodEnd))}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
          <p className="text-xs text-slate-500 mb-1">Days Until Renewal</p>
          <p className={`text-sm font-medium ${daysUntilRenewal <= 7 ? 'text-amber-400' : 'text-slate-200'}`}>
            {daysUntilRenewal} days
          </p>
        </div>
        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
          <p className="text-xs text-slate-500 mb-1">Billing Cycle</p>
          <p className="text-sm text-slate-200 capitalize">{subscription.billingCycle}</p>
        </div>
      </div>

      {/* Cancel at period end warning */}
      {subscription.cancelAtPeriodEnd && (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-6">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-400">Subscription Ending</p>
              <p className="text-xs text-amber-400/80">
                Your subscription will end on {formatDate(new Date(subscription.currentPeriodEnd))}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onUpgrade}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-cyan-500 text-white hover:bg-cyan-400 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          {subscription.plan.tier === PlanTier.ENTERPRISE ? 'Manage Plan' : 'Upgrade Plan'}
        </button>
        <button
          onClick={onManagePayment}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Manage Payment
        </button>
      </div>
    </div>
  );
}

interface QuickActionsProps {
  onViewPlans: () => void;
  onManagePayment: () => void;
  onDownloadInvoice: () => void;
}

function QuickActions({ onViewPlans, onManagePayment, onDownloadInvoice }: QuickActionsProps) {
  const actions = [
    {
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      label: 'View Plans',
      onClick: onViewPlans,
    },
    {
      icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
      label: 'Payment Methods',
      onClick: onManagePayment,
    },
    {
      icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      label: 'Download Invoice',
      onClick: onDownloadInvoice,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-800/30 border border-slate-700 hover:border-slate-600 hover:bg-slate-800/50 transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
            <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
            </svg>
          </div>
          <span className="text-sm text-slate-300">{action.label}</span>
        </button>
      ))}
    </div>
  );
}

// Mock data for demonstration
const mockPlans: Plan[] = [
  {
    id: 'free',
    tier: PlanTier.FREE,
    name: 'Free',
    description: 'For individuals getting started',
    monthlyPrice: 0,
    annualPrice: 0,
    isPopular: false,
    features: [
      { id: 'workflows', name: 'Workflows', included: true, limit: 3 },
      { id: 'executions', name: 'Executions', included: true, limit: 100 },
      { id: 'integrations', name: 'Basic Integrations', included: true, limit: 5 },
      { id: 'support', name: 'Community Support', included: true },
      { id: 'api', name: 'API Access', included: false },
      { id: 'team', name: 'Team Members', included: false },
    ],
    limits: { workflows: 3, executions: 100, integrations: 5, teamMembers: 1, storage: 1, apiCalls: 0 },
  },
  {
    id: 'starter',
    tier: PlanTier.STARTER,
    name: 'Starter',
    description: 'For small teams and projects',
    monthlyPrice: 29,
    annualPrice: 278,
    isPopular: false,
    features: [
      { id: 'workflows', name: 'Workflows', included: true, limit: 10 },
      { id: 'executions', name: 'Executions', included: true, limit: 1000 },
      { id: 'integrations', name: 'All Integrations', included: true, limit: 20 },
      { id: 'support', name: 'Email Support', included: true },
      { id: 'api', name: 'API Access', included: true, limit: 10000 },
      { id: 'team', name: 'Team Members', included: true, limit: 3 },
    ],
    limits: { workflows: 10, executions: 1000, integrations: 20, teamMembers: 3, storage: 5, apiCalls: 10000 },
  },
  {
    id: 'professional',
    tier: PlanTier.PROFESSIONAL,
    name: 'Professional',
    description: 'For growing businesses',
    monthlyPrice: 79,
    annualPrice: 758,
    isPopular: true,
    features: [
      { id: 'workflows', name: 'Workflows', included: true, limit: 'unlimited' },
      { id: 'executions', name: 'Executions', included: true, limit: 10000 },
      { id: 'integrations', name: 'All Integrations', included: true, limit: 'unlimited' },
      { id: 'support', name: 'Priority Support', included: true },
      { id: 'api', name: 'API Access', included: true, limit: 100000 },
      { id: 'team', name: 'Team Members', included: true, limit: 10 },
      { id: 'analytics', name: 'Advanced Analytics', included: true },
    ],
    limits: { workflows: -1, executions: 10000, integrations: -1, teamMembers: 10, storage: 25, apiCalls: 100000 },
  },
  {
    id: 'enterprise',
    tier: PlanTier.ENTERPRISE,
    name: 'Enterprise',
    description: 'For large organizations',
    monthlyPrice: 299,
    annualPrice: 2870,
    isPopular: false,
    features: [
      { id: 'workflows', name: 'Workflows', included: true, limit: 'unlimited' },
      { id: 'executions', name: 'Executions', included: true, limit: 'unlimited' },
      { id: 'integrations', name: 'All Integrations', included: true, limit: 'unlimited' },
      { id: 'support', name: 'Dedicated Support', included: true },
      { id: 'api', name: 'API Access', included: true, limit: 'unlimited' },
      { id: 'team', name: 'Team Members', included: true, limit: 'unlimited' },
      { id: 'analytics', name: 'Advanced Analytics', included: true },
      { id: 'sso', name: 'SSO & SAML', included: true },
      { id: 'audit', name: 'Audit Logs', included: true },
    ],
    limits: { workflows: -1, executions: -1, integrations: -1, teamMembers: -1, storage: -1, apiCalls: -1 },
  },
];

export function BillingDashboard({
  subscription,
  usage,
  recentPayments = [],
  onUpgrade,
  onManagePayment,
}: BillingDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [billingCycle, setBillingCycle] = useState<BillingCycleType>(BillingCycle.MONTHLY);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const handleUpgradeClick = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      setActiveTab('plans');
    }
  };

  const handleManagePaymentClick = () => {
    if (onManagePayment) {
      onManagePayment();
    } else {
      setActiveTab('payment-methods');
    }
  };

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
  };

  const handleMetricClick = (_metric: UsageMetric) => {
    // Void unused parameter to satisfy TypeScript
    void _metric;
    // Could show a detailed usage modal here
  };

  const handleDownloadInvoice = (_invoiceId: string) => {
    void _invoiceId;
    // Handle invoice download
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-slate-100">Billing & Subscription</h1>
            <p className="text-slate-400 mt-1">Manage your subscription, payment methods, and invoices</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 -mb-px overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-cyan-500 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }
                `}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Current Plan */}
            <section>
              <h2 className="text-lg font-semibold text-slate-200 mb-4">Current Plan</h2>
              <CurrentPlanCard
                subscription={subscription}
                onUpgrade={handleUpgradeClick}
                onManagePayment={handleManagePaymentClick}
              />
            </section>

            {/* Usage Overview */}
            {usage && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-200">Usage This Period</h2>
                  <p className="text-sm text-slate-400">
                    Last updated: {formatDate(new Date(usage.lastUpdated))}
                  </p>
                </div>
                <UsageMeters metrics={usage.metrics} onMetricClick={handleMetricClick} />
              </section>
            )}

            {/* Quick Actions */}
            <section>
              <h2 className="text-lg font-semibold text-slate-200 mb-4">Quick Actions</h2>
              <QuickActions
                onViewPlans={() => setActiveTab('plans')}
                onManagePayment={() => setActiveTab('payment-methods')}
                onDownloadInvoice={() => setActiveTab('invoices')}
              />
            </section>

            {/* Recent Payments */}
            {recentPayments.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-200">Recent Payments</h2>
                  <button
                    onClick={() => setActiveTab('invoices')}
                    className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    View All
                  </button>
                </div>
                <PaymentHistory
                  payments={recentPayments.slice(0, 5)}
                  onDownloadInvoice={handleDownloadInvoice}
                />
              </section>
            )}
          </div>
        )}

        {activeTab === 'plans' && (
          <PlanComparison
            plans={mockPlans}
            currentPlanId={subscription?.plan.id}
            billingCycle={billingCycle}
            onBillingCycleChange={setBillingCycle}
            onSelectPlan={handleSelectPlan}
          />
        )}

        {activeTab === 'payment-methods' && (
          <PaymentMethodManager
            paymentMethods={[]}
            onAddPaymentMethod={() => {}}
            onRemovePaymentMethod={() => {}}
            onSetDefault={() => {}}
          />
        )}

        {activeTab === 'invoices' && (
          <InvoiceDownload
            invoices={[]}
            onDownload={handleDownloadInvoice}
          />
        )}
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={subscription?.plan}
        targetPlan={selectedPlan || undefined}
        preview={selectedPlan ? {
          currentPlan: subscription?.plan || mockPlans[0],
          newPlan: selectedPlan,
          proratedAmount: 1500,
          newMonthlyAmount: selectedPlan.monthlyPrice * 100,
          effectiveDate: new Date(),
          immediateCharge: 1500,
        } : undefined}
        onConfirm={async () => {
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }}
      />
    </div>
  );
}

export default BillingDashboard;
