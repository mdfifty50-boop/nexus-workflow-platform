/**
 * BusinessProfileStep Component
 *
 * Collects essential business information during onboarding to
 * personalize the Nexus experience. Features:
 * - Business name and industry selection
 * - Company size and role selection
 * - Industry-specific questions (e-commerce, SaaS, agency)
 * - Automation priorities and pain points
 * - Real-time validation and auto-save
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Building2,
  Check,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  Target,
  Clock,
  AlertCircle,
  Sparkles,
} from 'lucide-react'

import type {
  Industry,
  CompanySize,
  PrimaryRole,
  AutomationPriority,
  PainPoint,
  TimeSavingsGoal,
  BudgetRange,
  EcommercePlatform,
  OrderVolume,
  UserBaseSize,
  TechStack,
  ClientCount,
  ServiceType,
  BusinessProfileData,
  ValidationErrors,
} from './business-profile-types'

import {
  INDUSTRIES,
  COMPANY_SIZES,
  COMPANY_SIZE_LABELS,
  PRIMARY_ROLES,
  PRIMARY_ROLE_LABELS,
  AUTOMATION_PRIORITIES,
  AUTOMATION_PRIORITY_LABELS,
  PAIN_POINTS,
  PAIN_POINT_LABELS,
  TIME_SAVINGS_GOALS,
  TIME_SAVINGS_LABELS,
  BUDGET_RANGES,
  BUDGET_RANGE_LABELS,
  ECOMMERCE_PLATFORMS,
  ECOMMERCE_PLATFORM_LABELS,
  ORDER_VOLUMES,
  ORDER_VOLUME_LABELS,
  USER_BASE_SIZES,
  USER_BASE_SIZE_LABELS,
  TECH_STACKS,
  TECH_STACK_LABELS,
  CLIENT_COUNTS,
  CLIENT_COUNT_LABELS,
  SERVICE_TYPES,
  SERVICE_TYPE_LABELS,
  DEFAULT_BUSINESS_PROFILE,
  validateBusinessProfile,
} from './business-profile-types'

import {
  INDUSTRY_CONFIGS,
  COMMON_TIMEZONES,
  getSuggestedPriorities,
  getCommonPainPoints,
  hasCustomFields,
  getCustomFieldsComponent,
} from './industry-config'

// ============================================================================
// STORAGE
// ============================================================================

const STORAGE_KEY = 'nexus_business_profile'

function loadProfile(): BusinessProfileData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as BusinessProfileData
      return { ...DEFAULT_BUSINESS_PROFILE, ...parsed }
    }
  } catch {
    // Ignore parse errors
  }
  return { ...DEFAULT_BUSINESS_PROFILE }
}

function saveProfile(data: BusinessProfileData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Ignore storage errors
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface BusinessProfileStepProps {
  onNext: () => void
  onBack?: () => void
  onProfileChange?: (profile: BusinessProfileData) => void
  initialData?: Partial<BusinessProfileData>
}

type ProfileSection = 'basic' | 'industry' | 'goals'

// ============================================================================
// SUB-STEP COMPONENTS
// ============================================================================

interface BasicInfoSectionProps {
  data: BusinessProfileData
  errors: ValidationErrors
  onUpdate: (updates: Partial<BusinessProfileData>) => void
  onNext: () => void
}

function BasicInfoSection({ data, errors, onUpdate, onNext }: BasicInfoSectionProps) {
  const { t } = useTranslation()

  const canProceed = data.businessName.trim().length >= 2 &&
    data.industry !== null &&
    data.companySize !== null &&
    data.primaryRole !== null

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Business Name */}
      <div className="space-y-2">
        <label
          htmlFor="business-name"
          className="block text-sm font-medium text-slate-300"
        >
          {t('onboarding.businessProfile.businessName', 'Business Name')} *
        </label>
        <Input
          id="business-name"
          type="text"
          value={data.businessName}
          onChange={(e) => onUpdate({ businessName: e.target.value })}
          placeholder={t('onboarding.businessProfile.businessNamePlaceholder', 'e.g., Acme Inc.')}
          className={cn(
            'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500',
            errors.businessName && 'border-red-500 focus:border-red-500'
          )}
          maxLength={100}
          autoFocus
        />
        {errors.businessName && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.businessName}
          </p>
        )}
      </div>

      {/* Industry Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-300">
          {t('onboarding.businessProfile.industry', 'Industry')} *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(INDUSTRIES).map(([_key, value]) => {
            void _key // Mark as intentionally unused
            const config = INDUSTRY_CONFIGS[value as Industry]
            const isSelected = data.industry === value

            return (
              <button
                key={value}
                type="button"
                onClick={() => onUpdate({ industry: value as Industry })}
                className={cn(
                  'relative p-3 rounded-lg border-2 text-left transition-all duration-200',
                  'hover:scale-[1.02] hover:shadow-md',
                  isSelected
                    ? `border-transparent bg-gradient-to-br ${config.gradient} text-white shadow-lg`
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                )}
              >
                {isSelected && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-emerald-500" />
                  </div>
                )}
                <span className={cn(
                  'text-xs font-medium truncate block',
                  isSelected ? 'text-white' : 'text-slate-300'
                )}>
                  {config.name.split(' / ')[0]}
                </span>
              </button>
            )
          })}
        </div>
        {errors.industry && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.industry}
          </p>
        )}
      </div>

      {/* Company Size */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-300">
          {t('onboarding.businessProfile.companySize', 'Company Size')} *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(COMPANY_SIZES).map(([_key, value]) => {
            void _key // Mark as intentionally unused
            const isSelected = data.companySize === value

            return (
              <button
                key={value}
                type="button"
                onClick={() => onUpdate({ companySize: value as CompanySize })}
                className={cn(
                  'p-3 rounded-lg border-2 text-center transition-all duration-200',
                  'hover:scale-[1.02]',
                  isSelected
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                    : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                )}
              >
                <span className="text-xs font-medium">
                  {COMPANY_SIZE_LABELS[value as CompanySize]}
                </span>
              </button>
            )
          })}
        </div>
        {errors.companySize && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.companySize}
          </p>
        )}
      </div>

      {/* Primary Role */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-300">
          {t('onboarding.businessProfile.primaryRole', 'Your Role')} *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(PRIMARY_ROLES).map(([_key, value]) => {
            void _key // Mark as intentionally unused
            const isSelected = data.primaryRole === value

            return (
              <button
                key={value}
                type="button"
                onClick={() => onUpdate({ primaryRole: value as PrimaryRole })}
                className={cn(
                  'p-3 rounded-lg border-2 text-center transition-all duration-200',
                  'hover:scale-[1.02]',
                  isSelected
                    ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                    : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                )}
              >
                <span className="text-xs font-medium">
                  {PRIMARY_ROLE_LABELS[value as PrimaryRole]}
                </span>
              </button>
            )
          })}
        </div>
        {errors.primaryRole && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.primaryRole}
          </p>
        )}
      </div>

      {/* Timezone */}
      <div className="space-y-2">
        <label
          htmlFor="timezone"
          className="block text-sm font-medium text-slate-300"
        >
          {t('onboarding.businessProfile.timezone', 'Timezone')}
        </label>
        <select
          id="timezone"
          value={data.timezone}
          onChange={(e) => onUpdate({ timezone: e.target.value })}
          className="w-full h-10 px-3 py-2 rounded-md border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          {COMMON_TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>

      {/* Next Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={onNext}
          disabled={!canProceed}
          variant={canProceed ? 'default' : 'secondary'}
        >
          Continue
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </motion.div>
  )
}

// Industry-specific fields component
interface IndustryFieldsSectionProps {
  data: BusinessProfileData
  onUpdate: (updates: Partial<BusinessProfileData>) => void
  onNext: () => void
  onBack: () => void
}

function IndustryFieldsSection({ data, onUpdate, onNext, onBack }: IndustryFieldsSectionProps) {
  const { t } = useTranslation()
  const customFieldsType = getCustomFieldsComponent(data.industry)

  // E-commerce specific fields
  const renderEcommerceFields = () => (
    <div className="space-y-4">
      {/* Platform */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">
          {t('onboarding.businessProfile.ecommerce.platform', 'E-commerce Platform')}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(ECOMMERCE_PLATFORMS).map(([_key, value]) => {
            void _key // Mark as intentionally unused
            const isSelected = data.ecommerceFields.platform === value

            return (
              <button
                key={value}
                type="button"
                onClick={() => onUpdate({
                  ecommerceFields: { ...data.ecommerceFields, platform: value as EcommercePlatform }
                })}
                className={cn(
                  'p-2 rounded-lg border-2 text-center transition-all duration-200 text-xs',
                  isSelected
                    ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                    : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                )}
              >
                {ECOMMERCE_PLATFORM_LABELS[value as EcommercePlatform]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Order Volume */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">
          {t('onboarding.businessProfile.ecommerce.orderVolume', 'Monthly Order Volume')}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(ORDER_VOLUMES).map(([_key, value]) => {
            void _key // Mark as intentionally unused
            const isSelected = data.ecommerceFields.orderVolume === value

            return (
              <button
                key={value}
                type="button"
                onClick={() => onUpdate({
                  ecommerceFields: { ...data.ecommerceFields, orderVolume: value as OrderVolume }
                })}
                className={cn(
                  'p-3 rounded-lg border-2 text-center transition-all duration-200 text-xs',
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                    : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                )}
              >
                {ORDER_VOLUME_LABELS[value as OrderVolume]}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )

  // SaaS specific fields
  const renderSaasFields = () => (
    <div className="space-y-4">
      {/* User Base Size */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">
          {t('onboarding.businessProfile.saas.userBase', 'User Base Size')}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(USER_BASE_SIZES).map(([_key, value]) => {
            void _key // Mark as intentionally unused
            const isSelected = data.saasFields.userBaseSize === value

            return (
              <button
                key={value}
                type="button"
                onClick={() => onUpdate({
                  saasFields: { ...data.saasFields, userBaseSize: value as UserBaseSize }
                })}
                className={cn(
                  'p-2 rounded-lg border-2 text-center transition-all duration-200 text-xs',
                  isSelected
                    ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                    : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                )}
              >
                {USER_BASE_SIZE_LABELS[value as UserBaseSize]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tech Stack (multi-select) */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">
          {t('onboarding.businessProfile.saas.techStack', 'Tech Stack')}
          <span className="text-slate-500 ml-1">(select all that apply)</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(TECH_STACKS).map(([_key, value]) => {
            void _key // Mark as intentionally unused
            const isSelected = data.saasFields.techStack.includes(value as TechStack)

            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  const current = data.saasFields.techStack
                  const updated = isSelected
                    ? current.filter(t => t !== value)
                    : [...current, value as TechStack]
                  onUpdate({
                    saasFields: { ...data.saasFields, techStack: updated }
                  })
                }}
                className={cn(
                  'p-2 rounded-lg border-2 text-center transition-all duration-200 text-xs',
                  isSelected
                    ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                    : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                )}
              >
                {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                {TECH_STACK_LABELS[value as TechStack]}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )

  // Agency specific fields
  const renderAgencyFields = () => (
    <div className="space-y-4">
      {/* Client Count */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">
          {t('onboarding.businessProfile.agency.clientCount', 'Number of Active Clients')}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(CLIENT_COUNTS).map(([_key, value]) => {
            void _key // Mark as intentionally unused
            const isSelected = data.agencyFields.clientCount === value

            return (
              <button
                key={value}
                type="button"
                onClick={() => onUpdate({
                  agencyFields: { ...data.agencyFields, clientCount: value as ClientCount }
                })}
                className={cn(
                  'p-3 rounded-lg border-2 text-center transition-all duration-200 text-xs',
                  isSelected
                    ? 'border-pink-500 bg-pink-500/10 text-pink-400'
                    : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                )}
              >
                {CLIENT_COUNT_LABELS[value as ClientCount]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Service Types (multi-select) */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">
          {t('onboarding.businessProfile.agency.serviceTypes', 'Services Offered')}
          <span className="text-slate-500 ml-1">(select all that apply)</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(SERVICE_TYPES).map(([_key, value]) => {
            void _key // Mark as intentionally unused
            const isSelected = data.agencyFields.serviceTypes.includes(value as ServiceType)

            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  const current = data.agencyFields.serviceTypes
                  const updated = isSelected
                    ? current.filter(s => s !== value)
                    : [...current, value as ServiceType]
                  onUpdate({
                    agencyFields: { ...data.agencyFields, serviceTypes: updated }
                  })
                }}
                className={cn(
                  'p-2 rounded-lg border-2 text-center transition-all duration-200 text-xs',
                  isSelected
                    ? 'border-rose-500 bg-rose-500/10 text-rose-400'
                    : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                )}
              >
                {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                {SERVICE_TYPE_LABELS[value as ServiceType]}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )

  // Custom industry description for "Other"
  const renderOtherFields = () => (
    <div className="space-y-2">
      <label
        htmlFor="custom-industry"
        className="block text-sm font-medium text-slate-300"
      >
        {t('onboarding.businessProfile.other.description', 'Tell us about your business')}
      </label>
      <textarea
        id="custom-industry"
        value={data.customIndustryDescription}
        onChange={(e) => onUpdate({ customIndustryDescription: e.target.value })}
        placeholder={t('onboarding.businessProfile.other.placeholder', 'Briefly describe your industry or business type...')}
        className="w-full h-24 px-3 py-2 rounded-md border border-slate-700 bg-slate-800 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
        maxLength={500}
      />
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Section Header */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-white">
          {t('onboarding.businessProfile.industryDetails', 'Tell us more about your business')}
        </h3>
        <p className="text-sm text-slate-400">
          {t('onboarding.businessProfile.industryDetailsSubtitle', 'This helps us personalize your experience')}
        </p>
      </div>

      {/* Industry-specific fields */}
      <Card className="p-4 bg-slate-800/50 border-slate-700">
        {customFieldsType === 'ecommerce' && renderEcommerceFields()}
        {customFieldsType === 'saas' && renderSaasFields()}
        {customFieldsType === 'agency' && renderAgencyFields()}
        {(!customFieldsType || data.industry === 'other') && renderOtherFields()}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <Button onClick={onNext}>
          Continue
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </motion.div>
  )
}

// Goals & Priorities section
interface GoalsSectionProps {
  data: BusinessProfileData
  errors: ValidationErrors
  onUpdate: (updates: Partial<BusinessProfileData>) => void
  onComplete: () => void
  onBack: () => void
}

function GoalsSection({ data, errors, onUpdate, onComplete, onBack }: GoalsSectionProps) {
  const { t } = useTranslation()
  const suggestedPriorities = getSuggestedPriorities(data.industry)
  const commonPainPoints = getCommonPainPoints(data.industry)

  const canComplete = data.automationPriorities.length > 0

  // Toggle functions for multi-select
  const togglePriority = (priority: AutomationPriority) => {
    const current = data.automationPriorities
    const updated = current.includes(priority)
      ? current.filter(p => p !== priority)
      : [...current, priority]
    onUpdate({ automationPriorities: updated })
  }

  const togglePainPoint = (painPoint: PainPoint) => {
    const current = data.painPoints
    const updated = current.includes(painPoint)
      ? current.filter(p => p !== painPoint)
      : [...current, painPoint]
    onUpdate({ painPoints: updated })
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Section Header */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-white">
          {t('onboarding.businessProfile.goals', 'What are your automation goals?')}
        </h3>
        <p className="text-sm text-slate-400">
          {t('onboarding.businessProfile.goalsSubtitle', "Select what you'd like to automate")}
        </p>
      </div>

      {/* Automation Priorities */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <Target className="w-4 h-4 text-cyan-400" />
          {t('onboarding.businessProfile.automationPriorities', 'Automation Priorities')} *
        </label>

        {/* Suggested priorities first */}
        {suggestedPriorities.length > 0 && (
          <div className="mb-2">
            <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Recommended for your industry
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedPriorities.map((priority) => {
                const isSelected = data.automationPriorities.includes(priority)
                return (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => togglePriority(priority)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
                      'border-2 hover:scale-105',
                      isSelected
                        ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                        : 'border-cyan-500/30 bg-cyan-500/5 text-cyan-400 hover:border-cyan-500/50'
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                    {AUTOMATION_PRIORITY_LABELS[priority]}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* All priorities */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(AUTOMATION_PRIORITIES)
            .filter(([_key, value]) => {
              void _key // Mark as intentionally unused
              return !suggestedPriorities.includes(value as AutomationPriority)
            })
            .map(([_key, value]) => {
              void _key // Mark as intentionally unused
              const isSelected = data.automationPriorities.includes(value as AutomationPriority)

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => togglePriority(value as AutomationPriority)}
                  className={cn(
                    'p-2 rounded-lg border-2 text-center transition-all duration-200 text-xs',
                    isSelected
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                      : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                  {AUTOMATION_PRIORITY_LABELS[value as AutomationPriority]}
                </button>
              )
            })}
        </div>

        {errors.automationPriorities && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.automationPriorities}
          </p>
        )}
      </div>

      {/* Pain Points */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          {t('onboarding.businessProfile.painPoints', 'Current Pain Points')}
          <span className="text-slate-500">(optional)</span>
        </label>

        {/* Common pain points highlighted */}
        {commonPainPoints.length > 0 && (
          <div className="mb-2">
            <p className="text-xs text-slate-500 mb-2">Common in your industry</p>
            <div className="flex flex-wrap gap-2">
              {commonPainPoints.map((painPoint) => {
                const isSelected = data.painPoints.includes(painPoint)
                return (
                  <button
                    key={painPoint}
                    type="button"
                    onClick={() => togglePainPoint(painPoint)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
                      'border-2 hover:scale-105',
                      isSelected
                        ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                        : 'border-amber-500/30 bg-amber-500/5 text-amber-400 hover:border-amber-500/50'
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                    {PAIN_POINT_LABELS[painPoint]}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* All pain points */}
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(PAIN_POINTS)
            .filter(([_key, value]) => {
              void _key // Mark as intentionally unused
              return !commonPainPoints.includes(value as PainPoint)
            })
            .map(([_key, value]) => {
              void _key // Mark as intentionally unused
              const isSelected = data.painPoints.includes(value as PainPoint)

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => togglePainPoint(value as PainPoint)}
                  className={cn(
                    'p-2 rounded-lg border-2 text-center transition-all duration-200 text-xs',
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                      : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                  {PAIN_POINT_LABELS[value as PainPoint]}
                </button>
              )
            })}
        </div>
      </div>

      {/* Time Savings Goal */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <Clock className="w-4 h-4 text-emerald-400" />
          {t('onboarding.businessProfile.timeSavings', 'Time Savings Goal')}
          <span className="text-slate-500">(optional)</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(TIME_SAVINGS_GOALS).map(([_key, value]) => {
            void _key // Mark as intentionally unused
            const isSelected = data.timeSavingsGoal === value

            return (
              <button
                key={value}
                type="button"
                onClick={() => onUpdate({ timeSavingsGoal: value as TimeSavingsGoal })}
                className={cn(
                  'p-2 rounded-lg border-2 text-center transition-all duration-200 text-xs',
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                )}
              >
                {TIME_SAVINGS_LABELS[value as TimeSavingsGoal]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Budget Range (optional) */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <Briefcase className="w-4 h-4 text-purple-400" />
          {t('onboarding.businessProfile.budget', 'Budget Range')}
          <span className="text-slate-500">(optional)</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(BUDGET_RANGES).map(([_key, value]) => {
            void _key // Mark as intentionally unused
            const isSelected = data.budgetRange === value

            return (
              <button
                key={value}
                type="button"
                onClick={() => onUpdate({ budgetRange: value as BudgetRange })}
                className={cn(
                  'p-2 rounded-lg border-2 text-center transition-all duration-200 text-xs',
                  isSelected
                    ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                    : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                )}
              >
                {BUDGET_RANGE_LABELS[value as BudgetRange]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <Button
          onClick={onComplete}
          disabled={!canComplete}
          variant={canComplete ? 'default' : 'secondary'}
          className={canComplete ? 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600' : ''}
        >
          Complete Profile
          <Check className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </motion.div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BusinessProfileStep({
  onNext,
  onBack,
  onProfileChange,
  initialData,
}: BusinessProfileStepProps) {
  const { t } = useTranslation()

  // Initialize state from storage or props
  const [data, setData] = useState<BusinessProfileData>(() => {
    const loaded = loadProfile()
    return { ...loaded, ...initialData }
  })

  const [currentSection, setCurrentSection] = useState<ProfileSection>('basic')
  const [errors, setErrors] = useState<ValidationErrors>({})

  // Auto-save ref for debouncing
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Update handler with auto-save
  const handleUpdate = useCallback((updates: Partial<BusinessProfileData>) => {
    setData(prev => {
      const updated = { ...prev, ...updates }

      // Clear any existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Auto-save after 500ms of no changes
      saveTimeoutRef.current = setTimeout(() => {
        saveProfile(updated)
        onProfileChange?.(updated)
      }, 500)

      return updated
    })

    // Clear errors for updated fields
    setErrors(prev => {
      const newErrors = { ...prev }
      Object.keys(updates).forEach(key => {
        delete newErrors[key as keyof ValidationErrors]
      })
      return newErrors
    })
  }, [onProfileChange])

  // Section navigation
  const handleBasicNext = useCallback(() => {
    const validationErrors = validateBusinessProfile(data)
    // Only check basic fields
    const basicErrors: ValidationErrors = {}
    if (validationErrors.businessName) basicErrors.businessName = validationErrors.businessName
    if (validationErrors.industry) basicErrors.industry = validationErrors.industry
    if (validationErrors.companySize) basicErrors.companySize = validationErrors.companySize
    if (validationErrors.primaryRole) basicErrors.primaryRole = validationErrors.primaryRole

    if (Object.keys(basicErrors).length > 0) {
      setErrors(basicErrors)
      return
    }

    // If industry has custom fields, go to industry section, otherwise skip to goals
    if (hasCustomFields(data.industry) || data.industry === 'other') {
      setCurrentSection('industry')
    } else {
      setCurrentSection('goals')
    }
  }, [data])

  const handleIndustryNext = useCallback(() => {
    setCurrentSection('goals')
  }, [])

  const handleIndustryBack = useCallback(() => {
    setCurrentSection('basic')
  }, [])

  const handleGoalsBack = useCallback(() => {
    if (hasCustomFields(data.industry) || data.industry === 'other') {
      setCurrentSection('industry')
    } else {
      setCurrentSection('basic')
    }
  }, [data.industry])

  const handleComplete = useCallback(() => {
    const validationErrors = validateBusinessProfile(data)

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      // Go back to section with errors
      if (validationErrors.businessName || validationErrors.industry ||
          validationErrors.companySize || validationErrors.primaryRole) {
        setCurrentSection('basic')
      }
      return
    }

    // Final save
    saveProfile(data)
    onProfileChange?.(data)
    onNext()
  }, [data, onProfileChange, onNext])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Progress indicator
  const sections: ProfileSection[] = ['basic', 'industry', 'goals']
  const currentSectionIndex = sections.indexOf(currentSection)
  const showIndustrySection = hasCustomFields(data.industry) || data.industry === 'other'
  const totalSections = showIndustrySection ? 3 : 2
  const adjustedIndex = currentSection === 'goals' && !showIndustrySection ? 1 : currentSectionIndex
  const progress = ((adjustedIndex + 1) / totalSections) * 100

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          {t('onboarding.businessProfile.title', 'Tell us about your business')}
        </h2>
        <p className="text-slate-400 text-sm sm:text-base">
          {t('onboarding.businessProfile.subtitle', "We'll personalize Nexus based on your answers")}
        </p>
      </motion.div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2 text-xs text-slate-500">
          <span>Step {adjustedIndex + 1} of {totalSections}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Section Content */}
      <AnimatePresence mode="wait">
        {currentSection === 'basic' && (
          <BasicInfoSection
            key="basic"
            data={data}
            errors={errors}
            onUpdate={handleUpdate}
            onNext={handleBasicNext}
          />
        )}
        {currentSection === 'industry' && (
          <IndustryFieldsSection
            key="industry"
            data={data}
            onUpdate={handleUpdate}
            onNext={handleIndustryNext}
            onBack={handleIndustryBack}
          />
        )}
        {currentSection === 'goals' && (
          <GoalsSection
            key="goals"
            data={data}
            errors={errors}
            onUpdate={handleUpdate}
            onComplete={handleComplete}
            onBack={handleGoalsBack}
          />
        )}
      </AnimatePresence>

      {/* Back to previous onboarding step */}
      {onBack && currentSection === 'basic' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center"
        >
          <button
            onClick={onBack}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            {t('onboarding.businessProfile.back', 'Back to previous step')}
          </button>
        </motion.div>
      )}
    </div>
  )
}

export default BusinessProfileStep
