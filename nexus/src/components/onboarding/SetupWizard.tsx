/**
 * SetupWizard - 5-Minute Guided Onboarding Experience
 *
 * A comprehensive multi-step wizard that guides new users through:
 * 1. Welcome & Value Proposition (30 sec)
 * 2. Business Type Selection (e-commerce, services, agency)
 * 3. Connect First Integration (OAuth flow trigger)
 * 4. Select First Template (from category matching business)
 * 5. Success & Dashboard Access
 *
 * Features:
 * - Progress persistence in localStorage
 * - Resume from where left off
 * - Animated transitions between steps
 * - Mobile responsive design
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

export interface SetupWizardProps {
  onComplete: () => void
  onSkip?: () => void
  initialStep?: number
}

type BusinessType = 'ecommerce' | 'services' | 'agency' | 'other'

interface WizardState {
  currentStep: number
  businessType: BusinessType | null
  selectedIntegration: string | null
  selectedTemplate: string | null
  completedSteps: number[]
}

interface Integration {
  id: string
  name: string
  icon: string
  description: string
  gradient: string
  popular?: boolean
}

interface Template {
  id: string
  name: string
  description: string
  icon: string
  gradient: string
  businessTypes: BusinessType[]
  estimatedTime: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const WIZARD_STORAGE_KEY = 'nexus_setup_wizard'
const WIZARD_COMPLETED_KEY = 'nexus_setup_wizard_completed'

const STEPS = [
  { id: 'welcome', title: 'Welcome', duration: '30 sec' },
  { id: 'business', title: 'Business Type', duration: '1 min' },
  { id: 'integration', title: 'First Connection', duration: '2 min' },
  { id: 'template', title: 'First Template', duration: '1 min' },
  { id: 'success', title: 'All Set!', duration: '30 sec' },
]

const BUSINESS_TYPES = [
  {
    id: 'ecommerce',
    name: 'E-commerce',
    icon: 'ShoppingCart',
    description: 'Online stores, marketplaces, product sales',
    gradient: 'from-orange-500 to-pink-500',
    examples: 'Shopify, WooCommerce, Amazon sellers',
  },
  {
    id: 'services',
    name: 'Professional Services',
    icon: 'Briefcase',
    description: 'Consulting, freelancing, client work',
    gradient: 'from-blue-500 to-cyan-500',
    examples: 'Consultants, lawyers, accountants',
  },
  {
    id: 'agency',
    name: 'Agency',
    icon: 'Building2',
    description: 'Marketing, creative, digital agencies',
    gradient: 'from-purple-500 to-pink-500',
    examples: 'Marketing agencies, design studios',
  },
  {
    id: 'other',
    name: 'Other',
    icon: 'Sparkles',
    description: 'SaaS, startups, personal use',
    gradient: 'from-emerald-500 to-teal-500',
    examples: 'Tech companies, solo entrepreneurs',
  },
] as const

const INTEGRATIONS: Integration[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    icon: 'Mail',
    description: 'Connect your Google email',
    gradient: 'from-red-500 to-yellow-500',
    popular: true,
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: 'MessageSquare',
    description: 'Connect your Slack workspace',
    gradient: 'from-purple-500 to-pink-500',
    popular: true,
  },
  {
    id: 'calendar',
    name: 'Google Calendar',
    icon: 'Calendar',
    description: 'Sync your calendar events',
    gradient: 'from-blue-500 to-cyan-500',
    popular: true,
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    icon: 'Users',
    description: 'Connect your CRM',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    icon: 'Cloud',
    description: 'Connect Salesforce CRM',
    gradient: 'from-blue-400 to-blue-600',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    icon: 'ShoppingBag',
    description: 'Connect your store',
    gradient: 'from-green-500 to-emerald-500',
  },
]

const TEMPLATES: Template[] = [
  {
    id: 'email-summary',
    name: 'Daily Email Summary',
    description: 'Get AI-powered summaries of your inbox',
    icon: 'Mail',
    gradient: 'from-blue-500 to-cyan-500',
    businessTypes: ['ecommerce', 'services', 'agency', 'other'],
    estimatedTime: '45s',
  },
  {
    id: 'meeting-scheduler',
    name: 'Smart Meeting Scheduler',
    description: 'AI finds optimal times and sends invites',
    icon: 'Calendar',
    gradient: 'from-purple-500 to-pink-500',
    businessTypes: ['services', 'agency', 'other'],
    estimatedTime: '30s',
  },
  {
    id: 'order-notifications',
    name: 'Order Notifications',
    description: 'Instant alerts for new orders',
    icon: 'ShoppingCart',
    gradient: 'from-orange-500 to-pink-500',
    businessTypes: ['ecommerce'],
    estimatedTime: '20s',
  },
  {
    id: 'crm-sync',
    name: 'CRM Activity Sync',
    description: 'Auto-log emails and calls to CRM',
    icon: 'Users',
    gradient: 'from-emerald-500 to-teal-500',
    businessTypes: ['services', 'agency'],
    estimatedTime: '60s',
  },
  {
    id: 'lead-capture',
    name: 'Lead Capture Pipeline',
    description: 'Auto-qualify and route leads',
    icon: 'Target',
    gradient: 'from-amber-500 to-orange-500',
    businessTypes: ['agency', 'ecommerce', 'services'],
    estimatedTime: '45s',
  },
  {
    id: 'invoice-processor',
    name: 'Invoice Processor',
    description: 'Extract data from invoices automatically',
    icon: 'FileText',
    gradient: 'from-pink-500 to-rose-500',
    businessTypes: ['services', 'agency', 'other'],
    estimatedTime: '75s',
  },
]

// ============================================================================
// ICON COMPONENTS
// ============================================================================

function Icon({ name, className = '' }: { name: string; className?: string }) {
  const icons: Record<string, React.ReactElement> = {
    ShoppingCart: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    Briefcase: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    Building2: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    Sparkles: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    Mail: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    MessageSquare: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    Calendar: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    Users: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    Cloud: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    ),
    ShoppingBag: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    Target: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    FileText: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    Check: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    ArrowRight: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
      </svg>
    ),
    ArrowLeft: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
    ),
    Zap: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    Rocket: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
    ),
    Star: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    PartyPopper: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 19.5l15-15M9 15l-4.5 4.5M15 9l4.5-4.5M7 8l1-1M17 16l-1 1M11 12l1-1" />
      </svg>
    ),
    Clock: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  }

  return icons[name] || icons.Zap
}

// ============================================================================
// STEP COMPONENTS
// ============================================================================

interface StepProps {
  onNext: () => void
  onBack?: () => void
  onSkip?: () => void
  state: WizardState
  updateState: (updates: Partial<WizardState>) => void
}

// Step 1: Welcome
function WelcomeStep({ onNext, onSkip }: StepProps) {
  return (
    <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero Icon */}
      <div className="relative mx-auto w-24 h-24">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl blur-xl opacity-50 animate-pulse" />
        <div className="relative w-full h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl flex items-center justify-center">
          <Icon name="Rocket" className="w-12 h-12 text-white" />
        </div>
      </div>

      {/* Welcome Text */}
      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Welcome to Nexus!
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Your AI-powered workflow automation platform. Let's get you set up in under 5 minutes.
        </p>
      </div>

      {/* Value Props */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
        {[
          { icon: 'Zap', text: 'Save 10+ hours/week', color: 'text-yellow-500' },
          { icon: 'Users', text: 'AI-powered agents', color: 'text-cyan-500' },
          { icon: 'Clock', text: 'Set up in 5 min', color: 'text-purple-500' },
        ].map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50"
          >
            <Icon name={item.icon} className={cn('w-5 h-5', item.color)} />
            <span className="text-sm font-medium">{item.text}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="space-y-3 pt-4">
        <Button
          onClick={onNext}
          size="xl"
          variant="cta"
          className="w-full sm:w-auto px-12"
        >
          Get Started
          <Icon name="ArrowRight" className="w-5 h-5 ml-2" />
        </Button>
        {onSkip && (
          <p className="text-sm text-muted-foreground">
            Already know your way around?{' '}
            <button onClick={onSkip} className="text-primary hover:underline">
              Skip setup
            </button>
          </p>
        )}
      </div>
    </div>
  )
}

// Step 2: Business Type Selection
function BusinessTypeStep({ onNext, onBack, state, updateState }: StepProps) {
  const handleSelect = (type: BusinessType) => {
    updateState({ businessType: type })
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold">What best describes your business?</h2>
        <p className="text-muted-foreground">
          This helps us recommend the right templates and integrations for you.
        </p>
      </div>

      {/* Business Type Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {BUSINESS_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => handleSelect(type.id as BusinessType)}
            className={cn(
              'relative p-6 rounded-xl border-2 text-left transition-all duration-200',
              'hover:scale-[1.02] hover:shadow-lg',
              state.businessType === type.id
                ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20'
                : 'border-border hover:border-primary/50 bg-card'
            )}
          >
            {/* Selection indicator */}
            {state.businessType === type.id && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Icon name="Check" className="w-4 h-4 text-white" />
              </div>
            )}

            {/* Icon */}
            <div
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                'bg-gradient-to-br',
                type.gradient
              )}
            >
              <Icon name={type.icon} className="w-6 h-6 text-white" />
            </div>

            {/* Content */}
            <h3 className="font-semibold text-lg mb-1">{type.name}</h3>
            <p className="text-sm text-muted-foreground mb-2">{type.description}</p>
            <p className="text-xs text-muted-foreground/70">{type.examples}</p>
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4">
        <Button variant="ghost" onClick={onBack}>
          <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!state.businessType}
          variant={state.businessType ? 'default' : 'secondary'}
        >
          Continue
          <Icon name="ArrowRight" className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

// Step 3: Integration Selection
function IntegrationStep({ onNext, onBack, state, updateState }: StepProps) {
  const [connecting, setConnecting] = useState<string | null>(null)

  const handleConnect = (integrationId: string) => {
    setConnecting(integrationId)
    // Simulate OAuth flow - in production this would trigger actual OAuth
    setTimeout(() => {
      updateState({ selectedIntegration: integrationId })
      setConnecting(null)
    }, 1500)
  }

  const popularIntegrations = INTEGRATIONS.filter((i) => i.popular)
  const otherIntegrations = INTEGRATIONS.filter((i) => !i.popular)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold">Connect your first app</h2>
        <p className="text-muted-foreground">
          Start with one integration - you can add more anytime.
        </p>
      </div>

      {/* Popular Integrations */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Icon name="Star" className="w-4 h-4 text-yellow-500" />
          Most Popular
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {popularIntegrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              selected={state.selectedIntegration === integration.id}
              connecting={connecting === integration.id}
              onConnect={() => handleConnect(integration.id)}
            />
          ))}
        </div>
      </div>

      {/* Other Integrations */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">More Options</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {otherIntegrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              selected={state.selectedIntegration === integration.id}
              connecting={connecting === integration.id}
              onConnect={() => handleConnect(integration.id)}
            />
          ))}
        </div>
      </div>

      {/* Skip option */}
      <div className="text-center">
        <button
          onClick={onNext}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip for now - I'll connect later
        </button>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4">
        <Button variant="ghost" onClick={onBack}>
          <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!state.selectedIntegration}
          variant={state.selectedIntegration ? 'default' : 'secondary'}
        >
          {state.selectedIntegration ? 'Continue' : 'Skip'}
          <Icon name="ArrowRight" className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

// Integration Card Component
function IntegrationCard({
  integration,
  selected,
  connecting,
  onConnect,
}: {
  integration: Integration
  selected: boolean
  connecting: boolean
  onConnect: () => void
}) {
  return (
    <button
      onClick={onConnect}
      disabled={connecting || selected}
      className={cn(
        'relative p-4 rounded-xl border-2 text-left transition-all duration-200',
        'hover:scale-[1.02] disabled:hover:scale-100',
        selected
          ? 'border-emerald-500 bg-emerald-500/10'
          : 'border-border hover:border-primary/50 bg-card'
      )}
    >
      {/* Status indicator */}
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
          <Icon name="Check" className="w-3 h-3 text-white" />
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            'bg-gradient-to-br',
            integration.gradient
          )}
        >
          {connecting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Icon name={integration.icon} className="w-5 h-5 text-white" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{integration.name}</h4>
          <p className="text-xs text-muted-foreground truncate">
            {selected ? 'Connected' : connecting ? 'Connecting...' : integration.description}
          </p>
        </div>
      </div>
    </button>
  )
}

// Step 4: Template Selection
function TemplateStep({ onNext, onBack, state, updateState }: StepProps) {
  // Filter templates based on business type
  const relevantTemplates = useMemo(() => {
    if (!state.businessType) return TEMPLATES.slice(0, 4)
    return TEMPLATES.filter((t) =>
      t.businessTypes.includes(state.businessType as BusinessType)
    ).slice(0, 6)
  }, [state.businessType])

  const handleSelect = (templateId: string) => {
    updateState({ selectedTemplate: templateId })
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold">Choose your first workflow</h2>
        <p className="text-muted-foreground">
          {state.businessType
            ? `Recommended for ${BUSINESS_TYPES.find((b) => b.id === state.businessType)?.name}`
            : 'Select a template to get started'}
        </p>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {relevantTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => handleSelect(template.id)}
            className={cn(
              'relative p-5 rounded-xl border-2 text-left transition-all duration-200',
              'hover:scale-[1.02] hover:shadow-lg',
              state.selectedTemplate === template.id
                ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20'
                : 'border-border hover:border-primary/50 bg-card'
            )}
          >
            {/* Selection indicator */}
            {state.selectedTemplate === template.id && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Icon name="Check" className="w-4 h-4 text-white" />
              </div>
            )}

            {/* Icon */}
            <div
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center mb-3',
                'bg-gradient-to-br',
                template.gradient
              )}
            >
              <Icon name={template.icon} className="w-6 h-6 text-white" />
            </div>

            {/* Content */}
            <h3 className="font-semibold mb-1">{template.name}</h3>
            <p className="text-sm text-muted-foreground mb-2">{template.description}</p>

            {/* Time estimate */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Icon name="Clock" className="w-3 h-3" />
              <span>{template.estimatedTime}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4">
        <Button variant="ghost" onClick={onBack}>
          <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!state.selectedTemplate}
          variant={state.selectedTemplate ? 'default' : 'secondary'}
        >
          Complete Setup
          <Icon name="ArrowRight" className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

// Step 5: Success
function SuccessStep({ onNext, state }: StepProps) {
  const selectedTemplate = TEMPLATES.find((t) => t.id === state.selectedTemplate)
  const selectedIntegration = INTEGRATIONS.find((i) => i.id === state.selectedIntegration)

  return (
    <div className="text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
      {/* Success Icon with Confetti Effect */}
      <div className="relative mx-auto w-24 h-24">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur-xl opacity-50 animate-pulse" />
        <div className="relative w-full h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center">
          <Icon name="Check" className="w-12 h-12 text-white" />
        </div>
        {/* Decorative elements */}
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full animate-bounce" />
        <div className="absolute -bottom-1 -left-3 w-4 h-4 bg-pink-500 rounded-full animate-bounce delay-100" />
        <div className="absolute top-0 -left-4 w-3 h-3 bg-purple-500 rounded-full animate-bounce delay-200" />
      </div>

      {/* Success Message */}
      <div className="space-y-3">
        <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          You're All Set!
        </h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Your workspace is ready. Let's start automating!
        </p>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap justify-center gap-4 max-w-md mx-auto">
        {selectedIntegration && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border">
            <div
              className={cn(
                'w-6 h-6 rounded-md flex items-center justify-center',
                'bg-gradient-to-br',
                selectedIntegration.gradient
              )}
            >
              <Icon name={selectedIntegration.icon} className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium">{selectedIntegration.name}</span>
            <Icon name="Check" className="w-4 h-4 text-emerald-500" />
          </div>
        )}
        {selectedTemplate && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border">
            <div
              className={cn(
                'w-6 h-6 rounded-md flex items-center justify-center',
                'bg-gradient-to-br',
                selectedTemplate.gradient
              )}
            >
              <Icon name={selectedTemplate.icon} className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium">{selectedTemplate.name}</span>
            <Icon name="Check" className="w-4 h-4 text-emerald-500" />
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="pt-4">
        <Button onClick={onNext} size="xl" variant="success" className="px-12">
          Go to Dashboard
          <Icon name="ArrowRight" className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SetupWizard({ onComplete, onSkip, initialStep = 0 }: SetupWizardProps) {
  // Initialize state from localStorage or defaults
  const [state, setState] = useState<WizardState>(() => {
    if (typeof window === 'undefined') {
      return {
        currentStep: initialStep,
        businessType: null,
        selectedIntegration: null,
        selectedTemplate: null,
        completedSteps: [],
      }
    }

    const saved = localStorage.getItem(WIZARD_STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return {
          ...parsed,
          currentStep: initialStep || parsed.currentStep,
        }
      } catch {
        // Invalid saved state, use defaults
      }
    }

    return {
      currentStep: initialStep,
      businessType: null,
      selectedIntegration: null,
      selectedTemplate: null,
      completedSteps: [],
    }
  })

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(state))
  }, [state])

  // Update state helper
  const updateState = useCallback((updates: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }, [])

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (state.currentStep >= STEPS.length - 1) {
      // Complete wizard
      localStorage.setItem(WIZARD_COMPLETED_KEY, 'true')
      localStorage.removeItem(WIZARD_STORAGE_KEY)
      onComplete()
    } else {
      updateState({
        currentStep: state.currentStep + 1,
        completedSteps: [...state.completedSteps, state.currentStep],
      })
    }
  }, [state.currentStep, state.completedSteps, onComplete, updateState])

  const handleBack = useCallback(() => {
    if (state.currentStep > 0) {
      updateState({ currentStep: state.currentStep - 1 })
    }
  }, [state.currentStep, updateState])

  const handleSkip = useCallback(() => {
    localStorage.setItem(WIZARD_COMPLETED_KEY, 'true')
    localStorage.removeItem(WIZARD_STORAGE_KEY)
    onSkip?.()
  }, [onSkip])

  // Calculate progress
  const progress = ((state.currentStep + 1) / STEPS.length) * 100

  // Step props
  const stepProps: StepProps = {
    onNext: handleNext,
    onBack: handleBack,
    onSkip: handleSkip,
    state,
    updateState,
  }

  // Render current step
  const renderStep = () => {
    switch (state.currentStep) {
      case 0:
        return <WelcomeStep {...stepProps} />
      case 1:
        return <BusinessTypeStep {...stepProps} />
      case 2:
        return <IntegrationStep {...stepProps} />
      case 3:
        return <TemplateStep {...stepProps} />
      case 4:
        return <SuccessStep {...stepProps} />
      default:
        return <WelcomeStep {...stepProps} />
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with Progress */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Step indicators */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                Step {state.currentStep + 1} of {STEPS.length}
              </span>
              <span className="text-xs text-muted-foreground">
                ({STEPS[state.currentStep].title})
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              ~{STEPS[state.currentStep].duration}
            </span>
          </div>

          {/* Progress bar */}
          <div className="relative">
            <Progress value={progress} className="h-2" />
            {/* Step dots */}
            <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between px-0">
              {STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className={cn(
                    'w-3 h-3 rounded-full border-2 transition-all duration-300',
                    index < state.currentStep
                      ? 'bg-primary border-primary'
                      : index === state.currentStep
                      ? 'bg-primary border-primary scale-125'
                      : 'bg-background border-muted-foreground/30'
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-3xl border-0 shadow-none bg-transparent">
          <CardContent className="p-0 sm:p-6">{renderStep()}</CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground">
        <p>Need help? Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">?</kbd> or contact support</p>
      </footer>
    </div>
  )
}

// ============================================================================
// HOOK FOR MANAGING SETUP WIZARD STATE
// ============================================================================

export function useSetupWizard() {
  const [showWizard, setShowWizard] = useState(false)

  const isCompleted = useCallback(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem(WIZARD_COMPLETED_KEY) === 'true'
  }, [])

  const reset = useCallback(() => {
    localStorage.removeItem(WIZARD_COMPLETED_KEY)
    localStorage.removeItem(WIZARD_STORAGE_KEY)
  }, [])

  const start = useCallback(() => {
    reset()
    setShowWizard(true)
  }, [reset])

  // Auto-show wizard on mount if not completed
  useEffect(() => {
    if (!isCompleted()) {
      setShowWizard(true)
    }
  }, [isCompleted])

  return {
    showWizard,
    setShowWizard,
    isCompleted,
    reset,
    start,
  }
}

export default SetupWizard
