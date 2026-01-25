/**
 * WelcomeStep Component
 *
 * First step of the onboarding flow (~30 seconds).
 * Asks users what they want to automate with 4 quick options:
 * - E-commerce (orders, inventory, shipping)
 * - CRM (leads, contacts, sales)
 * - Support (tickets, customer service)
 * - Custom (build your own)
 */

import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/i18n/useLanguage'
import type { BusinessType } from '@/hooks/useOnboarding'
import { motion } from 'framer-motion'

interface WelcomeStepProps {
  selectedType: BusinessType | null
  onSelectType: (type: BusinessType) => void
  onNext: () => void
}

interface BusinessOption {
  type: BusinessType
  icon: string
  gradient: string
  examples: string[]
}

const businessOptions: BusinessOption[] = [
  {
    type: 'ecommerce',
    icon: '🛒',
    gradient: 'from-orange-500 to-amber-500',
    examples: ['orders', 'inventory', 'shipping'],
  },
  {
    type: 'crm',
    icon: '👥',
    gradient: 'from-blue-500 to-cyan-500',
    examples: ['leads', 'contacts', 'sales'],
  },
  {
    type: 'support',
    icon: '🎧',
    gradient: 'from-purple-500 to-pink-500',
    examples: ['tickets', 'helpdesk', 'chat'],
  },
  {
    type: 'custom',
    icon: '⚡',
    gradient: 'from-emerald-500 to-teal-500',
    examples: ['email', 'files', 'tasks'],
  },
]

export function WelcomeStep({ selectedType, onSelectType, onNext }: WelcomeStepProps) {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()

  const handleSelect = (type: BusinessType) => {
    onSelectType(type)
    // Auto-advance after a short delay for better UX
    setTimeout(() => {
      onNext()
    }, 300)
  }

  return (
    <div className="flex flex-col items-center px-4 py-6 sm:py-8">
      {/* Welcome Message */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8 sm:mb-12"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          {t('onboarding.welcome.title')}
        </h1>
        <p className="text-lg sm:text-xl text-slate-400 max-w-md mx-auto">
          {t('onboarding.welcome.subtitle')}
        </p>
      </motion.div>

      {/* Question */}
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-xl sm:text-2xl font-semibold text-white mb-6 text-center"
      >
        {t('onboarding.welcome.question')}
      </motion.h2>

      {/* Business Type Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        {businessOptions.map((option, index) => (
          <motion.button
            key={option.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
            onClick={() => handleSelect(option.type)}
            className={`
              relative group p-6 rounded-2xl border-2 transition-all duration-300
              ${selectedType === option.type
                ? `border-transparent bg-gradient-to-br ${option.gradient} text-white shadow-lg scale-[1.02]`
                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
              }
            `}
          >
            {/* Selected indicator */}
            {selectedType === option.type && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} w-6 h-6 rounded-full bg-white flex items-center justify-center`}
              >
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}

            {/* Icon */}
            <div className="text-4xl mb-3">{option.icon}</div>

            {/* Title */}
            <h3 className={`text-lg font-semibold mb-2 ${selectedType === option.type ? 'text-white' : 'text-white'}`}>
              {t(`onboarding.welcome.options.${option.type}.title`)}
            </h3>

            {/* Examples */}
            <div className="flex flex-wrap gap-2">
              {option.examples.map(example => (
                <span
                  key={example}
                  className={`
                    text-xs px-2 py-1 rounded-full
                    ${selectedType === option.type
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-700 text-slate-300'
                    }
                  `}
                >
                  {t(`onboarding.welcome.examples.${example}`)}
                </span>
              ))}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Helper text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="text-sm text-slate-500 mt-8 text-center"
      >
        {t('onboarding.welcome.helper')}
      </motion.p>
    </div>
  )
}
