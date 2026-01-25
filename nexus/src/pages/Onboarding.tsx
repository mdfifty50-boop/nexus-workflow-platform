/**
 * Onboarding Page
 *
 * Main onboarding flow page that orchestrates the 4-step process:
 * 1. Welcome - Select business type
 * 2. Connect - Connect first app
 * 3. Workflow - Create first workflow
 * 4. Success - Test run and celebration
 *
 * Target: Users complete their first workflow in under 5 minutes.
 * Supports English and Arabic with RTL layout.
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/i18n/useLanguage'
import { useOnboarding } from '@/hooks/useOnboarding'
import { WelcomeStep } from '@/components/onboarding/WelcomeStep'
import { ConnectAppStep } from '@/components/onboarding/ConnectAppStep'
import { FirstWorkflowStep } from '@/components/onboarding/FirstWorkflowStep'
import { SuccessStep } from '@/components/onboarding/SuccessStep'
import { motion, AnimatePresence } from 'framer-motion'

export function Onboarding() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { isRTL, toggleLanguage, language } = useLanguage()

  const {
    currentStep,
    currentStepIndex,
    totalSteps,
    businessType,
    connectedApps,
    workflowDescription,
    workflowName,
    formattedTime,
    nextStep,
    prevStep,
    selectBusinessType,
    addConnectedApp,
    skipConnect,
    setWorkflowDescription,
    setWorkflowName,
    completeOnboarding,
    getRecommendedApps,
    getTemplateWorkflow,
    startOnboarding,
  } = useOnboarding()

  // Start the onboarding timer
  useEffect(() => {
    startOnboarding()
  }, [startOnboarding])

  // Handle navigation to dashboard
  const handleGoToDashboard = () => {
    navigate('/dashboard')
  }

  // Step labels for progress indicator
  const stepLabels = [
    t('onboarding.steps.welcome'),
    t('onboarding.steps.connect'),
    t('onboarding.steps.workflow'),
    t('onboarding.steps.success'),
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 py-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
              <span className="text-xl font-bold text-white">N</span>
            </div>
            <span className="text-xl font-bold text-white hidden sm:block">Nexus</span>
          </div>

          {/* Right side: Timer + Language Toggle */}
          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className="text-sm text-slate-500 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formattedTime}</span>
            </div>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 transition-colors flex items-center gap-2"
            >
              <span>{language === 'en' ? '🇺🇸' : '🇰🇼'}</span>
              <span>{language === 'en' ? 'العربية' : 'English'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="relative z-10 px-4 py-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          {/* Step Numbers */}
          <div className="flex items-center justify-between mb-2">
            {stepLabels.map((label, index) => {
              const stepNumber = index + 1
              const isActive = stepNumber === currentStepIndex
              const isCompleted = stepNumber < currentStepIndex

              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300
                    ${isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                      : isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-700 text-slate-400'
                    }
                  `}>
                    {isCompleted ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      stepNumber
                    )}
                  </div>
                  <span className={`
                    text-xs mt-1 hidden sm:block transition-colors
                    ${isActive ? 'text-white' : 'text-slate-500'}
                  `}>
                    {label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Progress Bar */}
          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStepIndex - 1) / (totalSteps - 1)) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl">
          <AnimatePresence mode="wait">
            {currentStep === 'welcome' && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, x: isRTL ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? 50 : -50 }}
                transition={{ duration: 0.3 }}
              >
                <WelcomeStep
                  selectedType={businessType}
                  onSelectType={selectBusinessType}
                  onNext={nextStep}
                />
              </motion.div>
            )}

            {currentStep === 'connect' && (
              <motion.div
                key="connect"
                initial={{ opacity: 0, x: isRTL ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? 50 : -50 }}
                transition={{ duration: 0.3 }}
              >
                <ConnectAppStep
                  businessType={businessType}
                  connectedApps={connectedApps}
                  recommendedApps={getRecommendedApps()}
                  onConnect={addConnectedApp}
                  onSkip={skipConnect}
                  onNext={nextStep}
                />
              </motion.div>
            )}

            {currentStep === 'workflow' && (
              <motion.div
                key="workflow"
                initial={{ opacity: 0, x: isRTL ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? 50 : -50 }}
                transition={{ duration: 0.3 }}
              >
                <FirstWorkflowStep
                  templateWorkflow={getTemplateWorkflow()}
                  workflowDescription={workflowDescription}
                  workflowName={workflowName}
                  onDescriptionChange={setWorkflowDescription}
                  onNameChange={setWorkflowName}
                  onNext={nextStep}
                />
              </motion.div>
            )}

            {currentStep === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, x: isRTL ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? 50 : -50 }}
                transition={{ duration: 0.3 }}
              >
                <SuccessStep
                  workflowName={workflowName}
                  templateWorkflow={getTemplateWorkflow()}
                  onComplete={completeOnboarding}
                  onGoToDashboard={handleGoToDashboard}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="relative z-10 px-4 py-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Back Button */}
          {currentStepIndex > 1 && currentStep !== 'success' && (
            <button
              onClick={prevStep}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <svg className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">{t('common.back')}</span>
            </button>
          )}

          {/* Spacer */}
          {(currentStepIndex === 1 || currentStep === 'success') && <div />}

          {/* Step Indicator */}
          <div className="text-sm text-slate-500">
            {t('onboarding.stepOf', { current: currentStepIndex, total: totalSteps })}
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Onboarding
