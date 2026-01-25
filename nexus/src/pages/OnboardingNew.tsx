/**
 * OnboardingNew Page (Enhanced)
 *
 * Full-screen onboarding experience with the following features:
 * - Checks if user already completed onboarding (redirects to dashboard)
 * - Fetches user profile for personalization
 * - Saves completion status to database/localStorage
 * - Handles OAuth callbacks from integration connections
 * - Clean centered wizard layout
 * - Skip/exit option
 * - Auto-redirect to dashboard on completion
 *
 * This is an enhanced version of the original Onboarding page with
 * better OAuth handling, personalization, and completion tracking.
 */

import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/i18n/useLanguage'
import { useAuth } from '@/contexts/AuthContext'
import { useOnboarding } from '@/hooks/useOnboarding'
import { WelcomeStep } from '@/components/onboarding/WelcomeStep'
import { ConnectAppStep } from '@/components/onboarding/ConnectAppStep'
import { FirstWorkflowStep } from '@/components/onboarding/FirstWorkflowStep'
import { SuccessStep } from '@/components/onboarding/SuccessStep'
import { motion, AnimatePresence } from 'framer-motion'

// OAuth callback state key
const OAUTH_STATE_KEY = 'nexus_oauth_state'
const ONBOARDING_COMPLETED_KEY = 'nexus_onboarding_completed'

interface OAuthCallbackState {
  provider: string
  returnTo: 'onboarding'
  timestamp: number
}

export function OnboardingNew() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { t } = useTranslation()
  const { isRTL, toggleLanguage, language } = useLanguage()
  const { userProfile, loading: authLoading } = useAuth()

  const [isCheckingCompletion, setIsCheckingCompletion] = useState(true)
  const [oauthProcessing, setOauthProcessing] = useState(false)
  const [oauthMessage, setOauthMessage] = useState<string | null>(null)

  const {
    currentStep,
    currentStepIndex,
    totalSteps,
    businessType,
    connectedApps,
    workflowDescription,
    workflowName,
    formattedTime,
    isCompleted,
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

  // Check if user already completed onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      setIsCheckingCompletion(true)

      // Check localStorage first (fast check)
      const localCompleted = localStorage.getItem(ONBOARDING_COMPLETED_KEY)
      if (localCompleted === 'true') {
        navigate('/dashboard', { replace: true })
        return
      }

      // Check user profile if available
      if (userProfile?.preferences?.onboardingCompleted) {
        localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true')
        navigate('/dashboard', { replace: true })
        return
      }

      // Check the hook's internal state
      if (isCompleted) {
        localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true')
        navigate('/dashboard', { replace: true })
        return
      }

      setIsCheckingCompletion(false)
    }

    // Wait for auth loading to complete before checking
    if (!authLoading) {
      checkOnboardingStatus()
    }
  }, [authLoading, userProfile, isCompleted, navigate])

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Check for OAuth callback parameters
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const error = searchParams.get('error')
      const provider = searchParams.get('provider')

      if (error) {
        setOauthMessage(`Connection failed: ${error}`)
        // Clear URL params
        navigate(location.pathname, { replace: true })
        return
      }

      if (code && state) {
        setOauthProcessing(true)
        setOauthMessage('Completing connection...')

        try {
          // Retrieve saved state
          const savedStateStr = sessionStorage.getItem(OAUTH_STATE_KEY)
          if (savedStateStr) {
            const savedState: OAuthCallbackState = JSON.parse(savedStateStr)

            // Validate state hasn't expired (15 minute window)
            const isExpired = Date.now() - savedState.timestamp > 15 * 60 * 1000
            if (!isExpired && savedState.returnTo === 'onboarding') {
              // Add the connected app
              addConnectedApp(savedState.provider)
              setOauthMessage(`${savedState.provider} connected successfully!`)

              // Clear the saved state
              sessionStorage.removeItem(OAUTH_STATE_KEY)

              // Auto-advance after successful connection
              setTimeout(() => {
                setOauthMessage(null)
                if (currentStep === 'connect' && connectedApps.length === 0) {
                  nextStep()
                }
              }, 1500)
            } else {
              setOauthMessage('Connection timed out. Please try again.')
            }
          }
        } catch (err) {
          console.error('OAuth callback error:', err)
          setOauthMessage('Connection failed. Please try again.')
        } finally {
          setOauthProcessing(false)
          // Clear URL params
          navigate(location.pathname, { replace: true })
        }
      } else if (provider) {
        // Direct provider connection request (e.g., from Rube/Composio)
        setOauthProcessing(true)
        setOauthMessage(`Connecting ${provider}...`)

        // Simulate connection - in production, this would initiate OAuth flow
        setTimeout(() => {
          addConnectedApp(provider)
          setOauthMessage(`${provider} connected!`)
          setOauthProcessing(false)
          navigate(location.pathname, { replace: true })
        }, 1500)
      }
    }

    handleOAuthCallback()
  }, [searchParams, location.pathname, navigate, addConnectedApp, currentStep, connectedApps.length, nextStep])

  // Start the onboarding timer when component mounts
  useEffect(() => {
    if (!isCheckingCompletion) {
      startOnboarding()
    }
  }, [isCheckingCompletion, startOnboarding])

  // Handle navigation to dashboard
  const handleGoToDashboard = useCallback(() => {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true')
    navigate('/dashboard', { replace: true })
  }, [navigate])

  // Handle skip/exit onboarding
  const handleSkipOnboarding = useCallback(() => {
    // Mark as completed even when skipping (so they don't see it again)
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true')
    navigate('/dashboard', { replace: true })
  }, [navigate])

  // Handle complete onboarding
  const handleCompleteOnboarding = useCallback(async () => {
    await completeOnboarding()
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true')
  }, [completeOnboarding])

  // Handle OAuth connection initiation (saves state for callback)
  const handleInitiateOAuth = useCallback((provider: string) => {
    const state: OAuthCallbackState = {
      provider,
      returnTo: 'onboarding',
      timestamp: Date.now(),
    }
    sessionStorage.setItem(OAUTH_STATE_KEY, JSON.stringify(state))

    // In production, this would redirect to OAuth provider
    // For now, simulate the connection
    addConnectedApp(provider)
  }, [addConnectedApp])

  // Step labels for progress indicator
  const stepLabels = [
    t('onboarding.steps.welcome'),
    t('onboarding.steps.connect'),
    t('onboarding.steps.workflow'),
    t('onboarding.steps.success'),
  ]

  // Show loading while checking completion status
  if (authLoading || isCheckingCompletion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center animate-pulse">
            <span className="text-xl font-bold text-white">N</span>
          </div>
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        {/* Additional subtle gradient orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-slate-800/20 to-transparent rounded-full" />
      </div>

      {/* OAuth Processing Overlay */}
      <AnimatePresence>
        {oauthProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-slate-900 border border-slate-700">
              <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-white font-medium">{oauthMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OAuth Message Toast */}
      <AnimatePresence>
        {oauthMessage && !oauthProcessing && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-40 px-6 py-3 rounded-xl bg-slate-800 border border-slate-700 shadow-lg"
          >
            <p className="text-white text-sm">{oauthMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

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

          {/* Right side: Timer + Language Toggle + Skip */}
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
              <span>{language === 'en' ? 'EN' : 'AR'}</span>
              <span>{language === 'en' ? 'العربية' : 'English'}</span>
            </button>

            {/* Skip Onboarding */}
            <button
              onClick={handleSkipOnboarding}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
              title={t('onboarding.skipAll')}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
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
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/25'
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

      {/* Personalized Welcome (shows user's name if available) */}
      {currentStep === 'welcome' && userProfile?.full_name && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10 text-center px-4"
        >
          <span className="text-sm text-cyan-400">
            {t('onboarding.welcome.greeting', { name: userProfile.full_name.split(' ')[0] })}
          </span>
        </motion.div>
      )}

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
                  onConnect={handleInitiateOAuth}
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
                  onComplete={handleCompleteOnboarding}
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

export default OnboardingNew
