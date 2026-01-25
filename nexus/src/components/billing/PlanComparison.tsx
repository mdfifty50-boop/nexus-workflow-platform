/**
 * Plan Comparison Component
 *
 * Side-by-side plan comparison with:
 * - Feature matrix display
 * - Current plan highlighted
 * - Upgrade/downgrade buttons
 * - Price display with annual savings
 * - Popular plan badge
 */

import React from 'react';
import type { PlanComparisonProps, Plan, PlanFeature } from './billing-types';
import { BillingCycle, formatCurrency, getAnnualSavingsPercentage } from './billing-types';

interface BillingToggleProps {
  billingCycle: typeof BillingCycle[keyof typeof BillingCycle];
  onToggle: (cycle: typeof BillingCycle[keyof typeof BillingCycle]) => void;
}

function BillingToggle({ billingCycle, onToggle }: BillingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      <span className={`text-sm ${billingCycle === BillingCycle.MONTHLY ? 'text-slate-200' : 'text-slate-400'}`}>
        Monthly
      </span>
      <button
        onClick={() => onToggle(billingCycle === BillingCycle.MONTHLY ? BillingCycle.ANNUAL : BillingCycle.MONTHLY)}
        className="relative w-14 h-7 rounded-full bg-slate-700 transition-colors hover:bg-slate-600"
      >
        <div
          className={`
            absolute top-1 w-5 h-5 rounded-full bg-cyan-500 transition-transform duration-200
            ${billingCycle === BillingCycle.ANNUAL ? 'left-8' : 'left-1'}
          `}
        />
      </button>
      <div className="flex items-center gap-2">
        <span className={`text-sm ${billingCycle === BillingCycle.ANNUAL ? 'text-slate-200' : 'text-slate-400'}`}>
          Annual
        </span>
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
          Save 20%
        </span>
      </div>
    </div>
  );
}

interface PlanCardProps {
  plan: Plan;
  billingCycle: typeof BillingCycle[keyof typeof BillingCycle];
  isCurrentPlan: boolean;
  onSelect?: (plan: Plan) => void;
}

function PlanCard({ plan, billingCycle, isCurrentPlan, onSelect }: PlanCardProps) {
  const price = billingCycle === BillingCycle.MONTHLY ? plan.monthlyPrice : plan.annualPrice / 12;
  const annualSavings = getAnnualSavingsPercentage(plan.monthlyPrice, plan.annualPrice);

  const handleSelect = () => {
    if (onSelect && !isCurrentPlan) {
      onSelect(plan);
    }
  };

  const formatLimit = (value: number | 'unlimited'): string => {
    if (value === 'unlimited' || value === -1) return 'Unlimited';
    if (typeof value === 'number') {
      if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
      return value.toString();
    }
    return String(value);
  };

  return (
    <div
      className={`
        relative flex flex-col rounded-2xl border transition-all
        ${plan.isPopular
          ? 'border-cyan-500 bg-gradient-to-b from-cyan-500/10 to-slate-900'
          : isCurrentPlan
            ? 'border-slate-500 bg-slate-800/50'
            : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
        }
      `}
    >
      {/* Popular Badge */}
      {plan.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 rounded-full bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/25">
            Most Popular
          </span>
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrentPlan && !plan.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 rounded-full bg-slate-600 text-slate-200 text-xs font-semibold">
            Current Plan
          </span>
        </div>
      )}

      <div className="p-6 pb-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-slate-200">{plan.name}</h3>
          <p className="text-sm text-slate-400 mt-1">{plan.description}</p>
        </div>

        {/* Price */}
        <div className="text-center mb-6">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold text-slate-100">
              {plan.monthlyPrice === 0 ? 'Free' : formatCurrency(price * 100)}
            </span>
            {plan.monthlyPrice > 0 && (
              <span className="text-slate-400">/mo</span>
            )}
          </div>
          {billingCycle === BillingCycle.ANNUAL && plan.monthlyPrice > 0 && (
            <p className="text-sm text-slate-500 mt-1">
              {formatCurrency(plan.annualPrice)} billed annually
              {annualSavings > 0 && (
                <span className="text-emerald-400 ml-1">
                  (Save {annualSavings}%)
                </span>
              )}
            </p>
          )}
        </div>

        {/* CTA Button */}
        <button
          onClick={handleSelect}
          disabled={isCurrentPlan}
          className={`
            w-full py-3 px-4 rounded-lg font-medium transition-all
            ${isCurrentPlan
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : plan.isPopular
                ? 'bg-cyan-500 text-white hover:bg-cyan-400 shadow-lg shadow-cyan-500/25'
                : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
            }
          `}
        >
          {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
        </button>
      </div>

      {/* Features Divider */}
      <div className="border-t border-slate-700/50" />

      {/* Features List */}
      <div className="p-6 pt-4 flex-1">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          What's included
        </h4>
        <ul className="space-y-3">
          {plan.features.map((feature) => (
            <li key={feature.id} className="flex items-start gap-3">
              {feature.included ? (
                <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className={`text-sm ${feature.included ? 'text-slate-300' : 'text-slate-500'}`}>
                {feature.name}
                {feature.limit !== undefined && (
                  <span className="text-slate-400 ml-1">
                    ({formatLimit(feature.limit)})
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>

        {/* Limits Summary */}
        <div className="mt-6 pt-4 border-t border-slate-700/50">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Limits
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500">Workflows:</span>
              <span className="text-slate-300 ml-1">{formatLimit(plan.limits.workflows)}</span>
            </div>
            <div>
              <span className="text-slate-500">Executions:</span>
              <span className="text-slate-300 ml-1">{formatLimit(plan.limits.executions)}/mo</span>
            </div>
            <div>
              <span className="text-slate-500">Integrations:</span>
              <span className="text-slate-300 ml-1">{formatLimit(plan.limits.integrations)}</span>
            </div>
            <div>
              <span className="text-slate-500">Team:</span>
              <span className="text-slate-300 ml-1">{formatLimit(plan.limits.teamMembers)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Feature matrix view for detailed comparison
interface FeatureMatrixProps {
  plans: Plan[];
  currentPlanId?: string;
}

function FeatureMatrix({ plans, currentPlanId }: FeatureMatrixProps) {
  // Get unique features across all plans
  const allFeatures = new Map<string, PlanFeature>();
  plans.forEach(plan => {
    plan.features.forEach(feature => {
      if (!allFeatures.has(feature.id)) {
        allFeatures.set(feature.id, feature);
      }
    });
  });

  const formatLimit = (value: number | 'unlimited' | undefined): string => {
    if (value === undefined) return '-';
    if (value === 'unlimited' || value === -1) return 'Unlimited';
    if (typeof value === 'number') {
      if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
      return value.toString();
    }
    return String(value);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="py-4 px-4 text-left text-sm font-semibold text-slate-300">Feature</th>
            {plans.map(plan => (
              <th
                key={plan.id}
                className={`
                  py-4 px-4 text-center text-sm font-semibold
                  ${plan.id === currentPlanId ? 'text-cyan-400' : 'text-slate-300'}
                `}
              >
                {plan.name}
                {plan.id === currentPlanId && (
                  <span className="ml-2 text-xs text-slate-500">(Current)</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from(allFeatures.values()).map(feature => (
            <tr key={feature.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
              <td className="py-3 px-4 text-sm text-slate-400">{feature.name}</td>
              {plans.map(plan => {
                const planFeature = plan.features.find(f => f.id === feature.id);
                return (
                  <td key={plan.id} className="py-3 px-4 text-center">
                    {planFeature?.included ? (
                      planFeature.limit !== undefined ? (
                        <span className="text-sm text-slate-300">{formatLimit(planFeature.limit)}</span>
                      ) : (
                        <svg className="w-5 h-5 text-emerald-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )
                    ) : (
                      <svg className="w-5 h-5 text-slate-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PlanComparison({
  plans,
  currentPlanId,
  billingCycle,
  onBillingCycleChange,
  onSelectPlan,
}: PlanComparisonProps) {
  const [viewMode, setViewMode] = React.useState<'cards' | 'matrix'>('cards');

  const handleBillingCycleToggle = (cycle: typeof BillingCycle[keyof typeof BillingCycle]) => {
    if (onBillingCycleChange) {
      onBillingCycleChange(cycle);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-100">Choose Your Plan</h2>
        <p className="text-slate-400 mt-2">Select the plan that best fits your needs</p>
      </div>

      {/* Billing Toggle */}
      <BillingToggle billingCycle={billingCycle} onToggle={handleBillingCycleToggle} />

      {/* View Toggle */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setViewMode('cards')}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${viewMode === 'cards'
              ? 'bg-slate-700 text-slate-200'
              : 'text-slate-400 hover:text-slate-200'
            }
          `}
        >
          Card View
        </button>
        <button
          onClick={() => setViewMode('matrix')}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${viewMode === 'matrix'
              ? 'bg-slate-700 text-slate-200'
              : 'text-slate-400 hover:text-slate-200'
            }
          `}
        >
          Compare All Features
        </button>
      </div>

      {/* Plans Display */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
          {plans.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              billingCycle={billingCycle}
              isCurrentPlan={plan.id === currentPlanId}
              onSelect={onSelectPlan}
            />
          ))}
        </div>
      ) : (
        <div className="bg-slate-800/30 rounded-xl border border-slate-700 p-4">
          <FeatureMatrix plans={plans} currentPlanId={currentPlanId} />
        </div>
      )}

      {/* Enterprise CTA */}
      <div className="text-center pt-6">
        <p className="text-slate-400 text-sm mb-2">Need a custom solution?</p>
        <button className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
          Contact Sales for Enterprise Pricing
        </button>
      </div>
    </div>
  );
}

export default PlanComparison;
