/**
 * FirstWorkflowStep Component
 *
 * Third step of the onboarding flow (~2 minutes).
 * Shows a pre-filled template based on business type selection.
 * Allows natural language input to customize the workflow.
 * Displays a visual preview of the generated workflow.
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/i18n/useLanguage'
import type { WorkflowPreview } from '@/hooks/useOnboarding'
import { motion, AnimatePresence } from 'framer-motion'

interface FirstWorkflowStepProps {
  templateWorkflow: WorkflowPreview
  workflowDescription: string
  workflowName: string
  onDescriptionChange: (description: string) => void
  onNameChange: (name: string) => void
  onNext: () => void
}

export function FirstWorkflowStep({
  templateWorkflow,
  workflowDescription,
  workflowName,
  onDescriptionChange,
  onNameChange,
  onNext,
}: FirstWorkflowStepProps) {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Auto-populate with template
  useEffect(() => {
    if (!workflowName && templateWorkflow) {
      onNameChange(templateWorkflow.name)
    }
    if (!workflowDescription && templateWorkflow) {
      onDescriptionChange(templateWorkflow.description)
    }
  }, [templateWorkflow, workflowName, workflowDescription, onNameChange, onDescriptionChange])

  const handleGenerate = async () => {
    if (!workflowDescription.trim()) return

    setIsGenerating(true)
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsGenerating(false)
    setShowPreview(true)
  }

  const handleContinue = () => {
    if (showPreview || workflowDescription.trim()) {
      onNext()
    }
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
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          {t('onboarding.workflow.title')}
        </h2>
        <p className="text-lg text-slate-400 max-w-md mx-auto">
          {t('onboarding.workflow.subtitle')}
        </p>
      </motion.div>

      <div className="w-full max-w-2xl">
        {/* Workflow Name Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mb-4"
        >
          <label className="block text-sm font-medium text-slate-400 mb-2">
            {t('onboarding.workflow.nameLabel')}
          </label>
          <input
            type="text"
            value={workflowName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={t('onboarding.workflow.namePlaceholder')}
            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </motion.div>

        {/* Description Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mb-6"
        >
          <label className="block text-sm font-medium text-slate-400 mb-2">
            {t('onboarding.workflow.descriptionLabel')}
          </label>
          <div className="relative">
            <textarea
              value={workflowDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder={t('onboarding.workflow.descriptionPlaceholder')}
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all resize-none"
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            {/* AI indicator */}
            <div className={`absolute ${isRTL ? 'left-3' : 'right-3'} bottom-3 flex items-center gap-1 text-xs text-slate-500`}>
              <span>✨</span>
              <span>{t('onboarding.workflow.aiPowered')}</span>
            </div>
          </div>
        </motion.div>

        {/* Generate Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="flex justify-center mb-6"
        >
          <button
            onClick={handleGenerate}
            disabled={!workflowDescription.trim() || isGenerating}
            className={`
              px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2
              ${workflowDescription.trim() && !isGenerating
                ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-400 hover:to-purple-400'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }
            `}
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('onboarding.workflow.generating')}
              </>
            ) : (
              <>
                <span>✨</span>
                {t('onboarding.workflow.generateButton')}
              </>
            )}
          </button>
        </motion.div>

        {/* Workflow Preview */}
        <AnimatePresence>
          {(showPreview || templateWorkflow) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-8"
            >
              <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
                {/* Preview Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="text-cyan-400">⚡</span>
                    {t('onboarding.workflow.previewTitle')}
                  </h3>
                  {showPreview && (
                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
                      {t('onboarding.workflow.generated')}
                    </span>
                  )}
                </div>

                {/* Workflow Visualization */}
                <div className="space-y-3">
                  {/* Trigger */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm">
                      1
                    </div>
                    <div className="flex-1 p-3 rounded-lg bg-slate-900 border border-slate-700">
                      <div className="text-xs text-cyan-400 mb-1">{t('onboarding.workflow.trigger')}</div>
                      <div className="text-sm text-white">{templateWorkflow.trigger}</div>
                    </div>
                  </div>

                  {/* Connection Line */}
                  <div className={`${isRTL ? 'mr-5' : 'ml-5'} w-0.5 h-4 bg-gradient-to-b from-cyan-500 to-purple-500`} />

                  {/* Actions */}
                  {templateWorkflow.actions.map((action, index) => (
                    <div key={index}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                          {index + 2}
                        </div>
                        <div className="flex-1 p-3 rounded-lg bg-slate-900 border border-slate-700">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-purple-400">{action.app}</span>
                            <span className="text-xs text-slate-600">•</span>
                            <span className="text-xs text-slate-500">{action.action}</span>
                          </div>
                          <div className="text-sm text-white">{action.description}</div>
                        </div>
                      </div>
                      {index < templateWorkflow.actions.length - 1 && (
                        <div className={`${isRTL ? 'mr-5' : 'ml-5'} w-0.5 h-4 bg-gradient-to-b from-purple-500 to-purple-400`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="flex justify-center"
        >
          <button
            onClick={handleContinue}
            disabled={!workflowDescription.trim()}
            className={`
              px-8 py-3 rounded-xl font-semibold transition-all
              ${workflowDescription.trim()
                ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-400 hover:to-purple-400'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }
            `}
          >
            {t('onboarding.workflow.continueButton')}
          </button>
        </motion.div>
      </div>
    </div>
  )
}
