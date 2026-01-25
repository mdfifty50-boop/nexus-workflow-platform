/**
 * SuccessStep Component
 *
 * Final step of the onboarding flow (~30 seconds).
 * Shows a dry run/test execution of the workflow.
 * Celebrates with confetti animation on success.
 * Provides clear next steps to the dashboard.
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/i18n/useLanguage'
import type { WorkflowPreview } from '@/hooks/useOnboarding'
import { motion, AnimatePresence } from 'framer-motion'
import { triggerGlobalConfetti } from '@/components/Confetti'

interface SuccessStepProps {
  workflowName: string
  templateWorkflow: WorkflowPreview
  onComplete: () => void
  onGoToDashboard: () => void
}

type ExecutionStatus = 'idle' | 'running' | 'success' | 'celebrating'

interface ExecutionStep {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed'
}

export function SuccessStep({
  workflowName,
  templateWorkflow,
  onComplete,
  onGoToDashboard,
}: SuccessStepProps) {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>('idle')
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([])

  // Initialize execution steps from workflow
  useEffect(() => {
    const steps: ExecutionStep[] = [
      { id: 'trigger', name: templateWorkflow.trigger, status: 'pending' },
      ...templateWorkflow.actions.map((action, index) => ({
        id: `action-${index}`,
        name: `${action.app}: ${action.action}`,
        status: 'pending' as const,
      })),
    ]
    setExecutionSteps(steps)
  }, [templateWorkflow])

  const runTestExecution = async () => {
    setExecutionStatus('running')

    // Simulate step-by-step execution
    for (let i = 0; i < executionSteps.length; i++) {
      // Mark current step as running
      setExecutionSteps(prev => prev.map((step, idx) => ({
        ...step,
        status: idx === i ? 'running' : idx < i ? 'completed' : 'pending',
      })))

      // Wait for step to "complete"
      await new Promise(resolve => setTimeout(resolve, 600))

      // Mark step as completed
      setExecutionSteps(prev => prev.map((step, idx) => ({
        ...step,
        status: idx <= i ? 'completed' : 'pending',
      })))
    }

    // Execution complete
    setExecutionStatus('success')

    // Trigger celebration after a short delay
    setTimeout(() => {
      setExecutionStatus('celebrating')
      triggerGlobalConfetti()
      onComplete()
    }, 500)
  }

  return (
    <div className="flex flex-col items-center px-4 py-6 sm:py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        {executionStatus === 'celebrating' ? (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="text-6xl mb-4"
            >
              🎉
            </motion.div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              {t('onboarding.success.congratsTitle')}
            </h2>
            <p className="text-lg text-slate-400 max-w-md mx-auto">
              {t('onboarding.success.congratsSubtitle')}
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              {t('onboarding.success.title')}
            </h2>
            <p className="text-lg text-slate-400 max-w-md mx-auto">
              {t('onboarding.success.subtitle')}
            </p>
          </>
        )}
      </motion.div>

      {/* Workflow Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="w-full max-w-lg mb-8"
      >
        <div className={`
          p-6 rounded-2xl border transition-all duration-500
          ${executionStatus === 'celebrating'
            ? 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-emerald-500/50'
            : 'bg-slate-800/50 border-slate-700'
          }
        `}>
          {/* Workflow Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">{workflowName || templateWorkflow.name}</h3>
              <p className="text-sm text-slate-400">{templateWorkflow.description}</p>
            </div>
            {executionStatus === 'celebrating' && (
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center"
              >
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}
          </div>

          {/* Execution Steps */}
          <div className="space-y-3">
            {executionSteps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                className="flex items-center gap-3"
              >
                {/* Status Indicator */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                  ${step.status === 'completed'
                    ? 'bg-emerald-500'
                    : step.status === 'running'
                      ? 'bg-cyan-500'
                      : 'bg-slate-700'
                  }
                `}>
                  {step.status === 'completed' ? (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : step.status === 'running' ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="text-xs text-slate-400">{index + 1}</span>
                  )}
                </div>

                {/* Step Name */}
                <div className={`
                  flex-1 py-2 px-3 rounded-lg transition-all duration-300
                  ${step.status === 'running'
                    ? 'bg-cyan-500/10 border border-cyan-500/30'
                    : step.status === 'completed'
                      ? 'bg-emerald-500/10 border border-emerald-500/30'
                      : 'bg-slate-900 border border-slate-700'
                  }
                `}>
                  <span className={`
                    text-sm transition-colors
                    ${step.status === 'completed' ? 'text-emerald-400' : step.status === 'running' ? 'text-cyan-400' : 'text-slate-400'}
                  `}>
                    {step.name}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <AnimatePresence mode="wait">
          {executionStatus === 'idle' && (
            <motion.button
              key="test"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onClick={runTestExecution}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold hover:from-cyan-400 hover:to-purple-400 transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('onboarding.success.runTest')}
            </motion.button>
          )}

          {executionStatus === 'running' && (
            <motion.div
              key="running"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-8 py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 font-semibold flex items-center gap-2"
            >
              <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              {t('onboarding.success.running')}
            </motion.div>
          )}

          {(executionStatus === 'success' || executionStatus === 'celebrating') && (
            <motion.button
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onClick={onGoToDashboard}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:from-emerald-400 hover:to-cyan-400 transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              {t('onboarding.success.goToDashboard')}
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Time Stats */}
      {executionStatus === 'celebrating' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-slate-500">
            {t('onboarding.success.completedIn')}
          </p>
        </motion.div>
      )}
    </div>
  )
}
