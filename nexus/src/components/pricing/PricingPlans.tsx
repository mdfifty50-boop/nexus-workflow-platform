/**
 * PricingPlans - Production-ready pricing component
 *
 * Displays three pricing tiers with monthly/annual toggle,
 * feature comparison, and checkout integration.
 */

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// Plan types
export interface PlanFeature {
  name: string
  included: boolean
  highlight?: boolean
}

export interface PricingPlan {
  id: string
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  features: PlanFeature[]
  popular?: boolean
  cta: string
}

export interface PricingPlansProps {
  currentPlan?: string
  onSelectPlan: (planId: string, interval: 'month' | 'year') => void
  showComparison?: boolean
  className?: string
}

// Default pricing plans data
const DEFAULT_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'For individuals getting started',
    monthlyPrice: 29,
    yearlyPrice: 278, // 20% discount = 29 * 12 * 0.8
    cta: 'Start Free Trial',
    features: [
      { name: '10 workflows', included: true },
      { name: '1,000 executions/month', included: true },
      { name: 'Email support', included: true },
      { name: 'Basic integrations', included: true },
      { name: 'API access', included: true },
      { name: 'Advanced analytics', included: false },
      { name: 'Priority support', included: false },
      { name: 'Custom integrations', included: false },
      { name: 'SLA guarantee', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For growing businesses',
    monthlyPrice: 79,
    yearlyPrice: 758, // 20% discount = 79 * 12 * 0.8
    popular: true,
    cta: 'Start Free Trial',
    features: [
      { name: '50 workflows', included: true, highlight: true },
      { name: '10,000 executions/month', included: true, highlight: true },
      { name: 'Priority support', included: true, highlight: true },
      { name: 'Advanced analytics', included: true, highlight: true },
      { name: 'All integrations', included: true },
      { name: 'API access', included: true },
      { name: 'Team collaboration', included: true },
      { name: 'Custom integrations', included: false },
      { name: 'SLA guarantee', included: false },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    description: 'For teams and enterprises',
    monthlyPrice: 199,
    yearlyPrice: 1910, // 20% discount = 199 * 12 * 0.8
    cta: 'Contact Sales',
    features: [
      { name: 'Unlimited workflows', included: true, highlight: true },
      { name: '100,000 executions/month', included: true, highlight: true },
      { name: '24/7 support', included: true, highlight: true },
      { name: 'Custom integrations', included: true, highlight: true },
      { name: 'SLA guarantee', included: true, highlight: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Team collaboration', included: true },
      { name: 'Dedicated account manager', included: true },
      { name: 'Custom onboarding', included: true },
    ],
  },
]

// Check icon component
const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn('w-5 h-5', className)}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

// X icon component
const XIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn('w-5 h-5', className)}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

// Billing toggle component
interface BillingToggleProps {
  interval: 'month' | 'year'
  onToggle: (interval: 'month' | 'year') => void
}

const BillingToggle = ({ interval, onToggle }: BillingToggleProps) => {
  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      <span
        className={cn(
          'text-sm font-medium transition-colors cursor-pointer',
          interval === 'month' ? 'text-foreground' : 'text-muted-foreground'
        )}
        onClick={() => onToggle('month')}
      >
        Monthly
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={interval === 'year'}
        onClick={() => onToggle(interval === 'month' ? 'year' : 'month')}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
          'transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          interval === 'year' ? 'bg-primary' : 'bg-muted'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0',
            'transform transition duration-200 ease-in-out',
            interval === 'year' ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>

      <div className="flex items-center gap-2">
        <span
          className={cn(
            'text-sm font-medium transition-colors cursor-pointer',
            interval === 'year' ? 'text-foreground' : 'text-muted-foreground'
          )}
          onClick={() => onToggle('year')}
        >
          Annual
        </span>
        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          Save 20%
        </Badge>
      </div>
    </div>
  )
}

// Single pricing card component
interface PricingCardProps {
  plan: PricingPlan
  interval: 'month' | 'year'
  isCurrentPlan: boolean
  onSelect: () => void
}

const PricingCard = ({ plan, interval, isCurrentPlan, onSelect }: PricingCardProps) => {
  const price = interval === 'month' ? plan.monthlyPrice : plan.yearlyPrice
  const perMonth = interval === 'year' ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice

  return (
    <Card
      className={cn(
        'relative flex flex-col transition-all duration-300 hover:shadow-xl',
        plan.popular && 'border-primary shadow-lg shadow-primary/10 scale-[1.02] z-10',
        isCurrentPlan && 'ring-2 ring-emerald-500'
      )}
    >
      {/* Popular badge */}
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-1 shadow-lg">
            Most Popular
          </Badge>
        </div>
      )}

      {/* Current plan badge */}
      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <Badge className="bg-emerald-500 text-white px-3 py-1">
            Current Plan
          </Badge>
        </div>
      )}

      <CardHeader className={cn('text-center', plan.popular && 'pt-8')}>
        <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        {/* Price display */}
        <div className="text-center mb-6">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold tracking-tight">
              ${perMonth}
            </span>
            <span className="text-muted-foreground">/month</span>
          </div>
          {interval === 'year' && (
            <p className="text-sm text-muted-foreground mt-1">
              ${price} billed annually
            </p>
          )}
        </div>

        {/* Features list */}
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li
              key={index}
              className={cn(
                'flex items-center gap-3 text-sm',
                !feature.included && 'text-muted-foreground'
              )}
            >
              {feature.included ? (
                <CheckIcon
                  className={cn(
                    'text-emerald-500 shrink-0',
                    feature.highlight && 'text-primary'
                  )}
                />
              ) : (
                <XIcon className="text-muted-foreground/50 shrink-0" />
              )}
              <span className={cn(feature.highlight && 'font-medium')}>
                {feature.name}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          onClick={onSelect}
          variant={plan.popular ? 'cta' : 'outline'}
          size="lg"
          className="w-full"
          disabled={isCurrentPlan}
        >
          {isCurrentPlan ? 'Current Plan' : plan.cta}
        </Button>
      </CardFooter>
    </Card>
  )
}

// Feature comparison table
interface FeatureComparisonProps {
  plans: PricingPlan[]
}

const FeatureComparison = ({ plans }: FeatureComparisonProps) => {
  // Collect all unique features
  const allFeatures = Array.from(
    new Set(plans.flatMap((plan) => plan.features.map((f) => f.name)))
  )

  return (
    <div className="mt-16">
      <h3 className="text-2xl font-bold text-center mb-8">Feature Comparison</h3>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-4 px-4 font-medium text-muted-foreground">
                Features
              </th>
              {plans.map((plan) => (
                <th
                  key={plan.id}
                  className={cn(
                    'text-center py-4 px-4 font-semibold',
                    plan.popular && 'bg-primary/5'
                  )}
                >
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allFeatures.map((featureName, index) => (
              <tr
                key={featureName}
                className={cn(
                  'border-b border-border/50',
                  index % 2 === 0 && 'bg-muted/30'
                )}
              >
                <td className="py-3 px-4 text-sm">{featureName}</td>
                {plans.map((plan) => {
                  const feature = plan.features.find((f) => f.name === featureName)
                  return (
                    <td
                      key={plan.id}
                      className={cn(
                        'text-center py-3 px-4',
                        plan.popular && 'bg-primary/5'
                      )}
                    >
                      {feature?.included ? (
                        <CheckIcon className="w-5 h-5 text-emerald-500 mx-auto" />
                      ) : (
                        <XIcon className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Main PricingPlans component
export function PricingPlans({
  currentPlan,
  onSelectPlan,
  showComparison = false,
  className,
}: PricingPlansProps) {
  const [interval, setInterval] = useState<'month' | 'year'>('month')

  const handleToggle = useCallback((newInterval: 'month' | 'year') => {
    setInterval(newInterval)
  }, [])

  const handleSelectPlan = useCallback(
    (planId: string) => {
      onSelectPlan(planId, interval)
    },
    [onSelectPlan, interval]
  )

  return (
    <section className={cn('py-12', className)}>
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Choose the plan that fits your needs. All plans include a 14-day free trial.
          No credit card required.
        </p>
      </div>

      {/* Billing toggle */}
      <BillingToggle interval={interval} onToggle={handleToggle} />

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto px-4">
        {DEFAULT_PLANS.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            interval={interval}
            isCurrentPlan={currentPlan === plan.id}
            onSelect={() => handleSelectPlan(plan.id)}
          />
        ))}
      </div>

      {/* Feature comparison table */}
      {showComparison && <FeatureComparison plans={DEFAULT_PLANS} />}

      {/* Trust badges / guarantee */}
      <div className="mt-12 text-center">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-emerald-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span>14-day free trial</span>
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-emerald-500"
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
            <span>Secure payment</span>
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-emerald-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-emerald-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            <span>No credit card required</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PricingPlans
