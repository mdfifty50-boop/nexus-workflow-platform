/**
 * BusinessTypeSelector Component
 *
 * A business type selection component for the onboarding wizard.
 * Displays business types as large clickable cards with icons,
 * descriptions, and recommended templates/integrations.
 *
 * Business Types:
 * - E-commerce (online store, dropshipping)
 * - Professional Services (consulting, agency)
 * - SaaS/Technology (software, apps)
 * - Real Estate (property, rentals)
 * - Marketing Agency (campaigns, content)
 * - Other (custom input)
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/i18n/useLanguage'
import { cn } from '@/lib/utils'
import {
  Store,
  Building,
  Code,
  Home,
  Megaphone,
  MoreHorizontal,
  Check,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export interface BusinessType {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  recommendedTemplates: string[]
  recommendedIntegrations: string[]
}

export interface BusinessTypeSelectorProps {
  selectedType?: string
  onSelect: (type: BusinessType) => void
}

const businessTypes: BusinessType[] = [
  {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'Online store, dropshipping, retail',
    icon: <Store className="w-8 h-8" />,
    recommendedTemplates: ['order-notification', 'inventory-sync', 'shipping-updates'],
    recommendedIntegrations: ['shopify', 'woocommerce', 'stripe', 'gmail', 'slack'],
  },
  {
    id: 'professional-services',
    name: 'Professional Services',
    description: 'Consulting, agency, freelance',
    icon: <Building className="w-8 h-8" />,
    recommendedTemplates: ['client-onboarding', 'invoice-reminders', 'meeting-scheduler'],
    recommendedIntegrations: ['calendly', 'gmail', 'slack', 'notion', 'quickbooks'],
  },
  {
    id: 'saas',
    name: 'SaaS / Technology',
    description: 'Software, apps, tech products',
    icon: <Code className="w-8 h-8" />,
    recommendedTemplates: ['user-onboarding', 'churn-prevention', 'feature-announcements'],
    recommendedIntegrations: ['stripe', 'intercom', 'slack', 'github', 'linear'],
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    description: 'Property, rentals, management',
    icon: <Home className="w-8 h-8" />,
    recommendedTemplates: ['lead-followup', 'property-alerts', 'tenant-reminders'],
    recommendedIntegrations: ['gmail', 'calendly', 'google-sheets', 'docusign', 'zillow'],
  },
  {
    id: 'marketing-agency',
    name: 'Marketing Agency',
    description: 'Campaigns, content, social media',
    icon: <Megaphone className="w-8 h-8" />,
    recommendedTemplates: ['campaign-reports', 'content-calendar', 'social-scheduler'],
    recommendedIntegrations: ['hubspot', 'mailchimp', 'slack', 'google-analytics', 'meta'],
  },
  {
    id: 'other',
    name: 'Other',
    description: 'Custom business type',
    icon: <MoreHorizontal className="w-8 h-8" />,
    recommendedTemplates: ['email-automation', 'task-management', 'data-sync'],
    recommendedIntegrations: ['gmail', 'slack', 'notion', 'google-sheets', 'trello'],
  },
]

// Gradient colors for each business type
const gradientMap: Record<string, string> = {
  'ecommerce': 'from-orange-500 to-amber-500',
  'professional-services': 'from-blue-500 to-cyan-500',
  'saas': 'from-violet-500 to-purple-500',
  'real-estate': 'from-emerald-500 to-teal-500',
  'marketing-agency': 'from-pink-500 to-rose-500',
  'other': 'from-slate-500 to-slate-600',
}

export function BusinessTypeSelector({
  selectedType,
  onSelect,
}: BusinessTypeSelectorProps) {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const [customInput, setCustomInput] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  const handleSelect = (type: BusinessType) => {
    if (type.id === 'other') {
      setShowCustomInput(true)
    } else {
      setShowCustomInput(false)
    }
    onSelect(type)
  }

  const handleCustomInputChange = (value: string) => {
    setCustomInput(value)
    // Update the 'other' type with custom description
    const otherType = businessTypes.find(t => t.id === 'other')
    if (otherType) {
      onSelect({
        ...otherType,
        description: value || 'Custom business type',
      })
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* Section Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          {t('onboarding.businessType.title', 'What type of business do you run?')}
        </h2>
        <p className="text-slate-400 text-sm sm:text-base">
          {t('onboarding.businessType.subtitle', "We'll customize your experience based on your selection")}
        </p>
      </motion.div>

      {/* Business Type Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {businessTypes.map((type, index) => {
          const isSelected = selectedType === type.id
          const gradient = gradientMap[type.id] || 'from-slate-500 to-slate-600'

          return (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
            >
              <Card
                onClick={() => handleSelect(type)}
                className={cn(
                  'relative cursor-pointer p-4 sm:p-6 h-full transition-all duration-300',
                  'border-2 hover:shadow-lg hover:scale-[1.02]',
                  isSelected
                    ? `border-transparent bg-gradient-to-br ${gradient} text-white shadow-xl scale-[1.02]`
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
                )}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSelect(type)
                  }
                }}
              >
                {/* Selected Indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={cn(
                      'absolute top-2 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md',
                      isRTL ? 'left-2' : 'right-2'
                    )}
                  >
                    <Check className="w-4 h-4 text-emerald-500" />
                  </motion.div>
                )}

                {/* Icon */}
                <div
                  className={cn(
                    'mb-3 sm:mb-4 p-2 sm:p-3 rounded-xl w-fit',
                    isSelected
                      ? 'bg-white/20'
                      : 'bg-slate-700/50'
                  )}
                >
                  <div className={isSelected ? 'text-white' : 'text-slate-300'}>
                    {type.icon}
                  </div>
                </div>

                {/* Title */}
                <h3
                  className={cn(
                    'text-base sm:text-lg font-semibold mb-1 sm:mb-2',
                    isSelected ? 'text-white' : 'text-white'
                  )}
                >
                  {t(`onboarding.businessType.types.${type.id}.name`, type.name)}
                </h3>

                {/* Description */}
                <p
                  className={cn(
                    'text-xs sm:text-sm line-clamp-2',
                    isSelected ? 'text-white/80' : 'text-slate-400'
                  )}
                >
                  {t(`onboarding.businessType.types.${type.id}.description`, type.description)}
                </p>

                {/* Recommended Tags - Hidden on mobile for space */}
                <div className="hidden sm:flex flex-wrap gap-1.5 mt-3">
                  {type.recommendedIntegrations.slice(0, 3).map((integration) => (
                    <span
                      key={integration}
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full capitalize',
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-700 text-slate-400'
                      )}
                    >
                      {integration}
                    </span>
                  ))}
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Custom Input for "Other" */}
      {showCustomInput && selectedType === 'other' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-6"
        >
          <label
            htmlFor="custom-business-type"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            {t('onboarding.businessType.customLabel', 'Tell us about your business')}
          </label>
          <Input
            id="custom-business-type"
            type="text"
            value={customInput}
            onChange={(e) => handleCustomInputChange(e.target.value)}
            placeholder={t('onboarding.businessType.customPlaceholder', 'e.g., Non-profit, Education, Healthcare...')}
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
            maxLength={100}
          />
        </motion.div>
      )}

      {/* Selection Preview */}
      {selectedType && selectedType !== 'other' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mt-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700"
        >
          <h4 className="text-sm font-medium text-slate-300 mb-2">
            {t('onboarding.businessType.recommendations', 'Recommended for you:')}
          </h4>
          <div className="flex flex-wrap gap-2">
            {businessTypes
              .find(t => t.id === selectedType)
              ?.recommendedIntegrations.map((integration) => (
                <span
                  key={integration}
                  className="text-xs px-3 py-1.5 rounded-full bg-slate-700 text-slate-300 capitalize"
                >
                  {integration}
                </span>
              ))}
          </div>
        </motion.div>
      )}

      {/* Helper Text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="text-xs sm:text-sm text-slate-500 text-center mt-6"
      >
        {t('onboarding.businessType.helper', 'You can always change this later in settings')}
      </motion.p>
    </div>
  )
}

export { businessTypes }
