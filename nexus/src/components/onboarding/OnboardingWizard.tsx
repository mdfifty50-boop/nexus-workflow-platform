/**
 * OnboardingWizard - Comprehensive New User Onboarding Experience
 *
 * A multi-step wizard that guides new users through Nexus setup:
 * 1. Welcome/Introduction
 * 2. Business Profile (name, industry, size)
 * 3. Goals Selection (automation priorities)
 * 4. Integration Selection (which apps to connect)
 * 5. Template Recommendations
 * 6. First Workflow Creation
 * 7. Completion/Tour offer
 *
 * Features:
 * - Step indicator with progress bar
 * - Navigation (Next, Back, Skip)
 * - Step validation before proceeding
 * - Persistent progress (localStorage)
 * - Completion celebration
 * - Smooth animations between steps
 * - Keyboard navigation support
 * - Mobile-responsive design
 * - Skip individual steps option
 * - Resume from where left off
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// Types
import type {
  OnboardingWizardProps,
  OnboardingWizardState,
  OnboardingStepProps,
  BusinessTypeIdType,
  CompanySizeType,
  IndustryType,
  PrimaryRoleType,
  AutomationGoalType,
} from './onboarding-types'

import {
  StepStatus,
} from './onboarding-types'

// Utilities
import {
  STEP_CONFIGS,
  BUSINESS_TYPE_OPTIONS,
  COMPANY_SIZE_OPTIONS,
  INDUSTRY_OPTIONS,
  ROLE_OPTIONS,
  GOAL_OPTIONS,
  TEMPLATE_OPTIONS,
  createInitialState,
  saveWizardState,
  loadWizardState,
  markWizardCompleted,
  markWizardSkipped,
  syncWizardToBusinessProfile,
  canStepProceed,
  calculateProgress,
  getRecommendedIntegrations,
  getRecommendedTemplates,
  getEstimatedTimeRemaining,
  KEYBOARD_KEYS,
} from './onboarding-utils'

// =============================================================================
// ICON COMPONENT
// =============================================================================

interface IconProps {
  name: string
  className?: string
}

function Icon({ name, className = '' }: IconProps) {
  const icons: Record<string, React.ReactElement> = {
    Rocket: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
    ),
    Building2: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    Target: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeWidth={2} />
        <circle cx="12" cy="12" r="6" strokeWidth={2} />
        <circle cx="12" cy="12" r="2" strokeWidth={2} />
      </svg>
    ),
    Plug: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5v14M3 9l3 3-3 3M21 9l-3 3 3 3" />
      </svg>
    ),
    LayoutTemplate: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9h18M9 21V9" />
      </svg>
    ),
    Workflow: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
    PartyPopper: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 19.5l15-15M9 15l-4.5 4.5M15 9l4.5-4.5M7 8l1-1M17 16l-1 1M11 12l1-1" />
      </svg>
    ),
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
    Cloud: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    ),
    User: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    Sparkles: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
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
    Clock: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
    ShoppingBag: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    FileText: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    CreditCard: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="1" y="4" width="22" height="16" rx="2" strokeWidth={2} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 10h22" />
      </svg>
    ),
    CheckSquare: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
    Trello: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
        <rect x="6" y="6" width="4" height="10" rx="1" strokeWidth={2} />
        <rect x="14" y="6" width="4" height="6" rx="1" strokeWidth={2} />
      </svg>
    ),
    Star: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    ShieldCheck: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    TrendingUp: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    Smile: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeWidth={2} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
      </svg>
    ),
    Database: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <ellipse cx="12" cy="5" rx="9" ry="3" strokeWidth={2} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12c0 1.657-4.03 3-9 3s-9-1.343-9-3M3 5v14c0 1.657 4.03 3 9 3s9-1.343 9-3V5" />
      </svg>
    ),
    BarChart: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    Share2: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="18" cy="5" r="3" strokeWidth={2} />
        <circle cx="6" cy="12" r="3" strokeWidth={2} />
        <circle cx="18" cy="19" r="3" strokeWidth={2} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
      </svg>
    ),
    UserPlus: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 11a4 4 0 100-8 4 4 0 000 8zM20 8v6M23 11h-6" />
      </svg>
    ),
    Kanban: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v18M15 3v18M3 9h18M3 15h18" />
      </svg>
    ),
    Play: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <polygon points="5,3 19,12 5,21" strokeWidth={2} strokeLinejoin="round" />
      </svg>
    ),
    Eye: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" strokeWidth={2} />
      </svg>
    ),
  }

  return icons[name] || icons.Zap
}

// =============================================================================
// STEP 1: WELCOME
// =============================================================================

function WelcomeStep({ navigation }: OnboardingStepProps) {
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
          Your AI-powered workflow automation platform. Let's personalize your experience in just a few steps.
        </p>
      </div>

      {/* Value Props */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
        {[
          { icon: 'Zap', text: 'Save 10+ hours/week', color: 'text-yellow-500' },
          { icon: 'Users', text: 'AI-powered agents', color: 'text-cyan-500' },
          { icon: 'Clock', text: `~${getEstimatedTimeRemaining(0)} setup`, color: 'text-purple-500' },
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
          onClick={navigation.onNext}
          size="xl"
          variant="cta"
          className="w-full sm:w-auto px-12"
        >
          Get Started
          <Icon name="ArrowRight" className="w-5 h-5 ml-2" />
        </Button>
        <p className="text-sm text-muted-foreground">
          Already know your way around?{' '}
          <button onClick={navigation.onSkip} className="text-primary hover:underline">
            Skip setup
          </button>
        </p>
      </div>
    </div>
  )
}

// =============================================================================
// STEP 2: BUSINESS PROFILE
// =============================================================================

function BusinessProfileStep({ state, updateState, navigation }: OnboardingStepProps) {
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const gridRef = useRef<HTMLDivElement>(null)

  const handleBusinessTypeSelect = (typeId: BusinessTypeIdType) => {
    updateState({
      businessProfile: {
        ...state.businessProfile,
        businessType: typeId,
      },
    })
  }

  const handleCompanySizeSelect = (sizeId: CompanySizeType) => {
    updateState({
      businessProfile: {
        ...state.businessProfile,
        companySize: sizeId,
      },
    })
  }

  const handleIndustrySelect = (industryId: IndustryType) => {
    updateState({
      businessProfile: {
        ...state.businessProfile,
        industry: industryId,
      },
    })
  }

  const handleRoleSelect = (roleId: PrimaryRoleType) => {
    updateState({
      businessProfile: {
        ...state.businessProfile,
        primaryRole: roleId,
      },
    })
  }

  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateState({
      businessProfile: {
        ...state.businessProfile,
        companyName: e.target.value,
      },
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent, index: number, total: number, onSelect: (idx: number) => void) => {
    const columns = 2
    let newIndex = index

    switch (e.key) {
      case KEYBOARD_KEYS.ARROW_RIGHT:
        newIndex = Math.min(index + 1, total - 1)
        break
      case KEYBOARD_KEYS.ARROW_LEFT:
        newIndex = Math.max(index - 1, 0)
        break
      case KEYBOARD_KEYS.ARROW_DOWN:
        newIndex = Math.min(index + columns, total - 1)
        break
      case KEYBOARD_KEYS.ARROW_UP:
        newIndex = Math.max(index - columns, 0)
        break
      case KEYBOARD_KEYS.ENTER:
      case KEYBOARD_KEYS.SPACE:
        onSelect(index)
        e.preventDefault()
        return
      default:
        return
    }

    if (newIndex !== index) {
      e.preventDefault()
      setFocusedIndex(newIndex)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold">Tell us about your business</h2>
        <p className="text-muted-foreground">
          This helps us recommend the right templates and integrations.
        </p>
      </div>

      {/* Company Name */}
      <div className="max-w-md mx-auto space-y-2">
        <label htmlFor="company-name" className="block text-sm font-medium">
          Company Name <span className="text-destructive">*</span>
        </label>
        <Input
          id="company-name"
          type="text"
          placeholder="Acme Inc."
          value={state.businessProfile.companyName}
          onChange={handleCompanyNameChange}
          className="text-center"
          autoFocus
        />
      </div>

      {/* Business Type Selection */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-center">What type of business? <span className="text-destructive">*</span></h3>
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl mx-auto"
          role="radiogroup"
          aria-label="Business type selection"
        >
          {BUSINESS_TYPE_OPTIONS.map((type, index) => (
            <button
              key={type.id}
              onClick={() => handleBusinessTypeSelect(type.id)}
              onKeyDown={(e) => handleKeyDown(e, index, BUSINESS_TYPE_OPTIONS.length, (idx) => handleBusinessTypeSelect(BUSINESS_TYPE_OPTIONS[idx].id))}
              onFocus={() => setFocusedIndex(index)}
              tabIndex={focusedIndex === -1 ? (index === 0 ? 0 : -1) : (focusedIndex === index ? 0 : -1)}
              role="radio"
              aria-checked={state.businessProfile.businessType === type.id}
              className={cn(
                'relative p-4 rounded-xl border-2 text-left transition-all duration-200',
                'hover:scale-[1.02] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                state.businessProfile.businessType === type.id
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border hover:border-primary/50 bg-card'
              )}
            >
              {state.businessProfile.businessType === type.id && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Icon name="Check" className="w-3 h-3 text-white" />
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br', type.gradient)}>
                  <Icon name={type.icon} className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{type.name}</h4>
                  <p className="text-xs text-muted-foreground truncate">{type.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Company Size Selection */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-center">Company size <span className="text-destructive">*</span></h3>
        <div className="flex flex-wrap justify-center gap-2">
          {COMPANY_SIZE_OPTIONS.map((size) => (
            <button
              key={size.id}
              onClick={() => handleCompanySizeSelect(size.id)}
              className={cn(
                'px-4 py-2 rounded-full border-2 transition-all duration-200',
                'hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                state.businessProfile.companySize === size.id
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <span className="font-medium">{size.name}</span>
              <span className="text-xs text-muted-foreground ml-1">({size.employeeRange})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Industry Selection */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-center">Industry <span className="text-destructive">*</span></h3>
        <div className="flex flex-wrap justify-center gap-2">
          {INDUSTRY_OPTIONS.map((industry) => (
            <button
              key={industry.id}
              onClick={() => handleIndustrySelect(industry.id)}
              className={cn(
                'px-3 py-1.5 rounded-full border text-sm transition-all duration-200',
                'hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                state.businessProfile.industry === industry.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50'
              )}
            >
              {industry.name}
            </button>
          ))}
        </div>
      </div>

      {/* Role Selection */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-center">Your role <span className="text-destructive">*</span></h3>
        <div className="flex flex-wrap justify-center gap-2">
          {ROLE_OPTIONS.map((role) => (
            <button
              key={role.id}
              onClick={() => handleRoleSelect(role.id)}
              className={cn(
                'px-3 py-1.5 rounded-full border text-sm transition-all duration-200',
                'hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                state.businessProfile.primaryRole === role.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50'
              )}
            >
              {role.name}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <StepNavigation {...navigation} />
    </div>
  )
}

// =============================================================================
// STEP 3: GOALS SELECTION
// =============================================================================

function GoalsStep({ state, updateState, navigation }: OnboardingStepProps) {
  const toggleGoal = (goalId: AutomationGoalType) => {
    const currentGoals = state.goalsSelection.primaryGoals
    let newGoals: AutomationGoalType[]

    if (currentGoals.includes(goalId)) {
      newGoals = currentGoals.filter((g) => g !== goalId)
    } else {
      newGoals = [...currentGoals, goalId]
    }

    // Set top priority as first selected goal
    const topPriority = newGoals.length > 0 ? newGoals[0] : null

    updateState({
      goalsSelection: {
        ...state.goalsSelection,
        primaryGoals: newGoals,
        topPriority,
      },
    })
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold">What do you want to automate?</h2>
        <p className="text-muted-foreground">
          Select all that apply - we'll recommend templates based on your goals.
        </p>
      </div>

      {/* Goal Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
        {GOAL_OPTIONS.map((goal) => {
          const isSelected = state.goalsSelection.primaryGoals.includes(goal.id)
          const selectionIndex = state.goalsSelection.primaryGoals.indexOf(goal.id)

          return (
            <button
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              className={cn(
                'relative p-4 rounded-xl border-2 text-left transition-all duration-200',
                'hover:scale-[1.02] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border hover:border-primary/50 bg-card'
              )}
            >
              {/* Selection badge */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white">
                  {selectionIndex + 1}
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center bg-muted', isSelected && 'bg-primary/20')}>
                  <Icon name={goal.icon} className={cn('w-5 h-5', goal.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium">{goal.name}</h4>
                  <p className="text-xs text-muted-foreground">{goal.description}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Selection summary */}
      {state.goalsSelection.primaryGoals.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {state.goalsSelection.primaryGoals.length} goal{state.goalsSelection.primaryGoals.length > 1 ? 's' : ''} selected
            {state.goalsSelection.topPriority && (
              <span className="text-primary">
                {' '}- Top priority: {GOAL_OPTIONS.find((g) => g.id === state.goalsSelection.topPriority)?.name}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Navigation */}
      <StepNavigation {...navigation} />
    </div>
  )
}

// =============================================================================
// STEP 4: INTEGRATIONS
// =============================================================================

function IntegrationsStep({ state, updateState, navigation }: OnboardingStepProps) {
  const [connecting, setConnecting] = useState<string | null>(null)

  const recommendedIntegrations = useMemo(
    () => getRecommendedIntegrations(state.businessProfile.businessType),
    [state.businessProfile.businessType]
  )

  const handleConnect = (integrationId: string) => {
    setConnecting(integrationId)
    // Simulate OAuth flow - in production this would trigger actual OAuth
    setTimeout(() => {
      const newConnected = [...state.integrationSelection.connectedIntegrations, integrationId]
      const newSelected = state.integrationSelection.selectedIntegrations.includes(integrationId)
        ? state.integrationSelection.selectedIntegrations
        : [...state.integrationSelection.selectedIntegrations, integrationId]

      updateState({
        integrationSelection: {
          ...state.integrationSelection,
          connectedIntegrations: newConnected,
          selectedIntegrations: newSelected,
        },
      })
      setConnecting(null)
    }, 1500)
  }

  const toggleSelection = (integrationId: string) => {
    const currentSelected = state.integrationSelection.selectedIntegrations
    const newSelected = currentSelected.includes(integrationId)
      ? currentSelected.filter((id) => id !== integrationId)
      : [...currentSelected, integrationId]

    updateState({
      integrationSelection: {
        ...state.integrationSelection,
        selectedIntegrations: newSelected,
      },
    })
  }

  const popularIntegrations = recommendedIntegrations.filter((i) => i.popular)
  const otherIntegrations = recommendedIntegrations.filter((i) => !i.popular)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold">Connect your apps</h2>
        <p className="text-muted-foreground">
          Select apps to connect now, or add them later from the integrations page.
        </p>
      </div>

      {/* Popular Integrations */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Icon name="Star" className="w-4 h-4 text-yellow-500" />
          Recommended for {BUSINESS_TYPE_OPTIONS.find((b) => b.id === state.businessProfile.businessType)?.name || 'you'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {popularIntegrations.map((integration) => {
            const isConnected = state.integrationSelection.connectedIntegrations.includes(integration.id)
            const isSelected = state.integrationSelection.selectedIntegrations.includes(integration.id)
            const isConnecting = connecting === integration.id

            return (
              <div
                key={integration.id}
                className={cn(
                  'relative p-4 rounded-xl border-2 transition-all duration-200',
                  isConnected
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/50'
                )}
              >
                {/* Status indicator */}
                {isConnected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Icon name="Check" className="w-3 h-3 text-white" />
                  </div>
                )}

                <div className="flex items-center gap-3 mb-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br', integration.gradient)}>
                    {isConnecting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Icon name={integration.icon} className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium">{integration.name}</h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : integration.description}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {!isConnected && (
                    <>
                      <Button
                        size="sm"
                        variant={isSelected ? 'secondary' : 'outline'}
                        className="flex-1"
                        onClick={() => toggleSelection(integration.id)}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleConnect(integration.id)}
                        disabled={isConnecting}
                      >
                        Connect
                      </Button>
                    </>
                  )}
                  {isConnected && (
                    <span className="text-sm text-emerald-600 font-medium">Ready to use</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Other Integrations */}
      {otherIntegrations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">More Options</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {otherIntegrations.map((integration) => {
              const isSelected = state.integrationSelection.selectedIntegrations.includes(integration.id)

              return (
                <button
                  key={integration.id}
                  onClick={() => toggleSelection(integration.id)}
                  className={cn(
                    'p-3 rounded-lg border transition-all duration-200 flex items-center gap-2',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className={cn('w-8 h-8 rounded-md flex items-center justify-center bg-gradient-to-br', integration.gradient)}>
                    <Icon name={integration.icon} className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium truncate">{integration.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Skip option */}
      <div className="text-center">
        <button
          onClick={() => {
            updateState({
              integrationSelection: {
                ...state.integrationSelection,
                skippedForLater: true,
              },
            })
            navigation.onNext()
          }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip for now - I'll connect apps later
        </button>
      </div>

      {/* Navigation */}
      <StepNavigation {...navigation} />
    </div>
  )
}

// =============================================================================
// STEP 5: TEMPLATES
// =============================================================================

function TemplatesStep({ state, updateState, navigation }: OnboardingStepProps) {
  const recommendedTemplates = useMemo(
    () => getRecommendedTemplates(
      state.businessProfile.businessType,
      state.goalsSelection.primaryGoals
    ),
    [state.businessProfile.businessType, state.goalsSelection.primaryGoals]
  )

  const handleSelect = (templateId: string) => {
    updateState({
      templateSelection: {
        ...state.templateSelection,
        selectedTemplateId: templateId,
      },
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold">Choose a starting template</h2>
        <p className="text-muted-foreground">
          Personalized recommendations based on your goals
        </p>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {recommendedTemplates.slice(0, 6).map((template) => {
          const isSelected = state.templateSelection.selectedTemplateId === template.id

          return (
            <button
              key={template.id}
              onClick={() => handleSelect(template.id)}
              className={cn(
                'relative p-5 rounded-xl border-2 text-left transition-all duration-200',
                'hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-lg'
                  : 'border-border hover:border-primary/50 bg-card'
              )}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Icon name="Check" className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Popularity badge */}
              {template.popularity >= 90 && (
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 text-xs font-medium">
                  Popular
                </div>
              )}

              {/* Icon */}
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br', template.gradient)}>
                <Icon name={template.icon} className="w-6 h-6 text-white" />
              </div>

              {/* Content */}
              <h3 className="font-semibold mb-1">{template.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{template.description}</p>

              {/* Meta */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Icon name="Clock" className="w-3 h-3" />
                  <span>{template.estimatedSetupTime}</span>
                </div>
                <span className="capitalize">{template.category}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Browse all templates */}
      <div className="text-center">
        <button className="text-sm text-primary hover:underline">
          Browse all templates
        </button>
      </div>

      {/* Navigation */}
      <StepNavigation {...navigation} />
    </div>
  )
}

// =============================================================================
// STEP 6: FIRST WORKFLOW
// =============================================================================

function FirstWorkflowStep({ state, updateState, navigation }: OnboardingStepProps) {
  const [isCreating, setIsCreating] = useState(false)
  const selectedTemplate = TEMPLATE_OPTIONS.find((t) => t.id === state.templateSelection.selectedTemplateId)

  const handleCreateWorkflow = () => {
    setIsCreating(true)
    // Simulate workflow creation
    setTimeout(() => {
      updateState({
        firstWorkflow: {
          ...state.firstWorkflow,
          workflowName: selectedTemplate?.name || 'My First Workflow',
          workflowDescription: selectedTemplate?.description || 'Created during onboarding',
          workflowCreated: true,
          workflowId: `wf_${Date.now()}`,
        },
      })
      setIsCreating(false)
    }, 2000)
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateState({
      firstWorkflow: {
        ...state.firstWorkflow,
        workflowName: e.target.value,
      },
    })
  }

  if (state.firstWorkflow.workflowCreated) {
    return (
      <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Icon name="Check" className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-emerald-600">Workflow Created!</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            "{state.firstWorkflow.workflowName}" is ready. You can customize it after completing setup.
          </p>
        </div>

        {/* Workflow Preview Card */}
        <div className="max-w-md mx-auto p-6 rounded-xl border bg-card">
          <div className="flex items-center gap-3 mb-4">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br', selectedTemplate?.gradient || 'from-cyan-500 to-blue-500')}>
              <Icon name={selectedTemplate?.icon || 'Workflow'} className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">{state.firstWorkflow.workflowName}</h3>
              <p className="text-sm text-muted-foreground">Ready to activate</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Icon name="Eye" className="w-4 h-4 mr-1" />
              Preview
            </Button>
            <Button variant="default" size="sm" className="flex-1">
              <Icon name="Play" className="w-4 h-4 mr-1" />
              Activate
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <StepNavigation {...navigation} />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold">Create your first workflow</h2>
        <p className="text-muted-foreground">
          {selectedTemplate
            ? `We'll set up "${selectedTemplate.name}" for you`
            : 'Start automating with a custom workflow'}
        </p>
      </div>

      {/* Workflow Creator */}
      <div className="max-w-md mx-auto space-y-6">
        {/* Template Preview */}
        {selectedTemplate && (
          <div className="p-6 rounded-xl border bg-card">
            <div className="flex items-center gap-4 mb-4">
              <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br', selectedTemplate.gradient)}>
                <Icon name={selectedTemplate.icon} className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{selectedTemplate.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Icon name="Clock" className="w-4 h-4" />
                <span>~{selectedTemplate.estimatedSetupTime} setup</span>
              </div>
              <span className="capitalize">{selectedTemplate.category}</span>
            </div>
          </div>
        )}

        {/* Custom Name */}
        <div className="space-y-2">
          <label htmlFor="workflow-name" className="block text-sm font-medium">
            Workflow Name
          </label>
          <Input
            id="workflow-name"
            type="text"
            placeholder={selectedTemplate?.name || 'My Workflow'}
            value={state.firstWorkflow.workflowName}
            onChange={handleNameChange}
          />
        </div>

        {/* Create Button */}
        <Button
          onClick={handleCreateWorkflow}
          disabled={isCreating}
          loading={isCreating}
          variant="cta"
          size="lg"
          className="w-full"
        >
          {isCreating ? 'Creating...' : 'Create Workflow'}
          {!isCreating && <Icon name="ArrowRight" className="w-5 h-5 ml-2" />}
        </Button>
      </div>

      {/* Skip option */}
      <div className="text-center">
        <button
          onClick={navigation.onSkip}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip - I'll create workflows later
        </button>
      </div>
    </div>
  )
}

// =============================================================================
// STEP 7: COMPLETION
// =============================================================================

function CompletionStep({ state, updateState, navigation }: OnboardingStepProps & { onTourStart?: () => void }) {
  const [showCelebration, setShowCelebration] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShowCelebration(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  const handleStartTour = () => {
    updateState({
      tourOffered: true,
      tourAccepted: true,
    })
    navigation.onNext()
  }

  const handleSkipTour = () => {
    updateState({
      tourOffered: true,
      tourAccepted: false,
    })
    navigation.onNext()
  }

  const selectedTemplate = TEMPLATE_OPTIONS.find((t) => t.id === state.templateSelection.selectedTemplateId)
  const connectedCount = state.integrationSelection.connectedIntegrations.length
  const goalsCount = state.goalsSelection.primaryGoals.length

  return (
    <div className="text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
      {/* Celebration */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {/* Confetti-like elements */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 40}%`,
                animationDelay: `${i * 100}ms`,
                animationDuration: `${1000 + Math.random() * 500}ms`,
              }}
            >
              <div
                className={cn(
                  'w-3 h-3 rounded-full',
                  ['bg-cyan-500', 'bg-purple-500', 'bg-pink-500', 'bg-yellow-500', 'bg-emerald-500'][i % 5]
                )}
              />
            </div>
          ))}
        </div>
      )}

      {/* Success Icon */}
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
      <div className="flex flex-wrap justify-center gap-3 max-w-lg mx-auto">
        {state.businessProfile.companyName && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border text-sm">
            <Icon name="Building2" className="w-4 h-4 text-muted-foreground" />
            <span>{state.businessProfile.companyName}</span>
          </div>
        )}
        {goalsCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border text-sm">
            <Icon name="Target" className="w-4 h-4 text-primary" />
            <span>{goalsCount} goal{goalsCount > 1 ? 's' : ''}</span>
          </div>
        )}
        {connectedCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-sm text-emerald-600">
            <Icon name="Check" className="w-4 h-4" />
            <span>{connectedCount} app{connectedCount > 1 ? 's' : ''} connected</span>
          </div>
        )}
        {selectedTemplate && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-sm text-primary">
            <Icon name={selectedTemplate.icon} className="w-4 h-4" />
            <span>{selectedTemplate.name}</span>
          </div>
        )}
      </div>

      {/* Tour Offer */}
      <div className="pt-4 space-y-4">
        <p className="text-muted-foreground">
          Would you like a quick tour of Nexus?
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={handleStartTour} size="lg" variant="default">
            <Icon name="Eye" className="w-5 h-5 mr-2" />
            Take the Tour
          </Button>
          <Button onClick={handleSkipTour} size="lg" variant="outline">
            Go to Dashboard
            <Icon name="ArrowRight" className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// STEP NAVIGATION COMPONENT
// =============================================================================

interface StepNavigationPropsExtended {
  onNext: () => void
  onBack: () => void
  onSkip: () => void
  isFirstStep: boolean
  isLastStep: boolean
  canProceed: boolean
  currentStepIndex: number
  totalSteps: number
}

function StepNavigation({
  onNext,
  onBack,
  onSkip,
  isFirstStep,
  isLastStep,
  canProceed,
  currentStepIndex,
  totalSteps,
}: StepNavigationPropsExtended) {
  const currentConfig = STEP_CONFIGS[currentStepIndex]

  return (
    <div className="flex justify-between items-center pt-6">
      <div className="flex items-center gap-2">
        {!isFirstStep && (
          <Button variant="ghost" onClick={onBack}>
            <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        {currentConfig?.skippable && !isLastStep && (
          <Button variant="ghost" onClick={onSkip} className="text-muted-foreground">
            Skip
          </Button>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground hidden sm:inline">
          {currentStepIndex + 1} of {totalSteps}
        </span>
        {!isLastStep && (
          <Button
            onClick={onNext}
            disabled={!canProceed}
            variant={canProceed ? 'default' : 'secondary'}
          >
            {currentStepIndex === totalSteps - 2 ? 'Complete' : 'Continue'}
            <Icon name="ArrowRight" className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function OnboardingWizard({
  onComplete,
  onSkip,
  initialStep = 0,
  showTourOffer: _showTourOffer = true,
  onTourStart,
}: OnboardingWizardProps) {
  void _showTourOffer // Reserved for tour offer UI
  // Initialize state from localStorage or defaults
  const [state, setState] = useState<OnboardingWizardState>(() => {
    if (typeof window === 'undefined') {
      return { ...createInitialState(), currentStepIndex: initialStep }
    }

    const saved = loadWizardState()
    if (saved) {
      return { ...saved, currentStepIndex: initialStep || saved.currentStepIndex }
    }

    return { ...createInitialState(), currentStepIndex: initialStep }
  })

  // Persist state to localStorage
  useEffect(() => {
    saveWizardState(state)
  }, [state])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === KEYBOARD_KEYS.ESCAPE) {
        handleSkip()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Update state helper
  const updateState = useCallback((updates: Partial<OnboardingWizardState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }, [])

  // Navigation handlers
  const handleNext = useCallback(() => {
    const nextIndex = state.currentStepIndex + 1

    if (nextIndex >= STEP_CONFIGS.length) {
      // Complete wizard
      const completedState: OnboardingWizardState = {
        ...state,
        completedAt: new Date().toISOString(),
        stepStatuses: {
          ...state.stepStatuses,
          [STEP_CONFIGS[state.currentStepIndex].id]: StepStatus.COMPLETED,
        },
      }
      syncWizardToBusinessProfile(completedState)
      markWizardCompleted()
      onComplete(completedState)
      return
    }

    // Update step statuses
    const newStatuses = { ...state.stepStatuses }
    newStatuses[STEP_CONFIGS[state.currentStepIndex].id] = StepStatus.COMPLETED
    newStatuses[STEP_CONFIGS[nextIndex].id] = StepStatus.ACTIVE

    setState((prev) => ({
      ...prev,
      currentStepIndex: nextIndex,
      stepStatuses: newStatuses,
    }))
  }, [state, onComplete])

  const handleBack = useCallback(() => {
    if (state.currentStepIndex > 0) {
      const prevIndex = state.currentStepIndex - 1
      const newStatuses = { ...state.stepStatuses }
      newStatuses[STEP_CONFIGS[state.currentStepIndex].id] = StepStatus.PENDING
      newStatuses[STEP_CONFIGS[prevIndex].id] = StepStatus.ACTIVE

      setState((prev) => ({
        ...prev,
        currentStepIndex: prevIndex,
        stepStatuses: newStatuses,
      }))
    }
  }, [state.currentStepIndex, state.stepStatuses])

  const handleSkip = useCallback(() => {
    markWizardSkipped()
    onSkip?.()
  }, [onSkip])

  const handleStepSkip = useCallback(() => {
    const nextIndex = state.currentStepIndex + 1

    if (nextIndex >= STEP_CONFIGS.length) {
      handleSkip()
      return
    }

    // Mark current step as skipped
    const newStatuses = { ...state.stepStatuses }
    newStatuses[STEP_CONFIGS[state.currentStepIndex].id] = StepStatus.SKIPPED
    newStatuses[STEP_CONFIGS[nextIndex].id] = StepStatus.ACTIVE

    setState((prev) => ({
      ...prev,
      currentStepIndex: nextIndex,
      stepStatuses: newStatuses,
    }))
  }, [state, handleSkip])

  // Calculate progress
  const progress = calculateProgress(state)
  const currentStepConfig = STEP_CONFIGS[state.currentStepIndex]
  const canProceed = canStepProceed(currentStepConfig.id, state)

  // Navigation props
  const navigationProps: StepNavigationPropsExtended = {
    onNext: handleNext,
    onBack: handleBack,
    onSkip: handleStepSkip,
    isFirstStep: state.currentStepIndex === 0,
    isLastStep: state.currentStepIndex === STEP_CONFIGS.length - 1,
    canProceed,
    currentStepIndex: state.currentStepIndex,
    totalSteps: STEP_CONFIGS.length,
  }

  // Step props
  const stepProps: OnboardingStepProps = {
    state,
    updateState,
    navigation: navigationProps,
  }

  // Render current step
  const renderStep = () => {
    switch (state.currentStepIndex) {
      case 0:
        return <WelcomeStep {...stepProps} />
      case 1:
        return <BusinessProfileStep {...stepProps} />
      case 2:
        return <GoalsStep {...stepProps} />
      case 3:
        return <IntegrationsStep {...stepProps} />
      case 4:
        return <TemplatesStep {...stepProps} />
      case 5:
        return <FirstWorkflowStep {...stepProps} />
      case 6:
        return <CompletionStep {...stepProps} onTourStart={onTourStart} />
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
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-cyan-500 to-purple-500')}>
                <Icon name={currentStepConfig.icon} className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-sm font-medium">
                  Step {state.currentStepIndex + 1}: {currentStepConfig.title}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                ~{currentStepConfig.estimatedTime}
              </span>
              {state.currentStepIndex > 0 && (
                <button
                  onClick={handleSkip}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Exit
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative">
            <Progress value={progress} className="h-2" />
            {/* Step dots */}
            <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between px-0">
              {STEP_CONFIGS.map((step, _index) => {
                void _index // Used for step ordering
                const status = state.stepStatuses[step.id]
                return (
                  <div
                    key={step.id}
                    className={cn(
                      'w-3 h-3 rounded-full border-2 transition-all duration-300',
                      status === StepStatus.COMPLETED
                        ? 'bg-primary border-primary'
                        : status === StepStatus.ACTIVE
                        ? 'bg-primary border-primary scale-125'
                        : status === StepStatus.SKIPPED
                        ? 'bg-muted border-muted-foreground/30'
                        : 'bg-background border-muted-foreground/30'
                    )}
                    title={step.title}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-4xl border-0 shadow-none bg-transparent">
          <CardContent className="p-0 sm:p-6">{renderStep()}</CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground">
        <p>
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Esc</kbd> to exit setup
          {' | '}
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">?</kbd> for help
        </p>
      </footer>
    </div>
  )
}

// =============================================================================
// HOOK FOR MANAGING ONBOARDING WIZARD STATE
// =============================================================================

export function useOnboardingWizard() {
  const [showWizard, setShowWizard] = useState(false)

  const isCompleted = useCallback(() => {
    if (typeof window === 'undefined') return true
    const { isWizardCompleted } = require('./onboarding-utils')
    return isWizardCompleted()
  }, [])

  const isSkipped = useCallback(() => {
    if (typeof window === 'undefined') return false
    const { isWizardSkipped } = require('./onboarding-utils')
    return isWizardSkipped()
  }, [])

  const reset = useCallback(() => {
    const { resetWizard } = require('./onboarding-utils')
    resetWizard()
  }, [])

  const start = useCallback(() => {
    reset()
    setShowWizard(true)
  }, [reset])

  // Auto-show wizard on mount if not completed or skipped
  useEffect(() => {
    if (!isCompleted() && !isSkipped()) {
      setShowWizard(true)
    }
  }, [isCompleted, isSkipped])

  return {
    showWizard,
    setShowWizard,
    isCompleted,
    isSkipped,
    reset,
    start,
  }
}

export default OnboardingWizard
