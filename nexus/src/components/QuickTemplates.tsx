/**
 * QuickTemplates - TikTok-style Instant Workflow Execution
 *
 * Design principles:
 * - One-tap execution (instant gratification)
 * - Visual progress indicators
 * - Minimal required inputs
 * - Swipeable card interface
 * - Real-time step visualization
 *
 * Loop 8: Consumer-first quick templates for immediate value
 */

import { useState, useCallback } from 'react'
import { Button } from './ui/button'
import { ProfessionalAvatar, getAvatarConfig } from './ProfessionalAvatar'
import {
  QUICK_TEMPLATES,
  formatEstimatedTime,
  getPopularQuickTemplates,
} from '@/data/quick-templates'
import type {
  QuickTemplate,
  QuickTemplateInput,
} from '@/data/quick-templates'

// Icons
const Icons = {
  Mail: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Users: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Plane: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  FileText: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Zap: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Play: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Sparkles: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
}

const getIcon = (iconName: string) => {
  const iconMap: Record<string, React.FC> = {
    mail: Icons.Mail,
    calendar: Icons.Calendar,
    users: Icons.Users,
    plane: Icons.Plane,
    'file-text': Icons.FileText,
  }
  return iconMap[iconName] || Icons.Zap
}

interface QuickTemplateCardProps {
  template: QuickTemplate
  onExecute: (template: QuickTemplate) => void
  isExecuting?: boolean
  variant?: 'default' | 'compact' | 'featured'
}

function QuickTemplateCard({
  template,
  onExecute,
  isExecuting = false,
  variant = 'default',
}: QuickTemplateCardProps) {
  const IconComponent = getIcon(template.icon)

  if (variant === 'compact') {
    return (
      <button
        onClick={() => onExecute(template)}
        disabled={isExecuting}
        className={`
          group relative w-full p-4 rounded-2xl border transition-all duration-300
          ${isExecuting
            ? 'bg-slate-800/80 border-cyan-500/50 cursor-wait'
            : 'bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/50 hover:bg-slate-800/80 active:scale-[0.98]'
          }
        `}
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${template.gradient} text-white shadow-lg`}
          >
            <IconComponent />
          </div>

          {/* Content */}
          <div className="flex-1 text-left">
            <h4 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
              {template.shortName}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Icons.Clock />
              <span>{formatEstimatedTime(template.estimatedSeconds)}</span>
            </div>
          </div>

          {/* Execute indicator */}
          <div
            className={`
              w-10 h-10 rounded-full flex items-center justify-center transition-all
              ${isExecuting
                ? 'bg-cyan-500/20 animate-pulse'
                : 'bg-slate-700/50 group-hover:bg-cyan-500/20'
              }
            `}
          >
            {isExecuting ? (
              <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icons.Play />
            )}
          </div>
        </div>
      </button>
    )
  }

  if (variant === 'featured') {
    return (
      <div
        className={`
          group relative overflow-hidden rounded-3xl border transition-all duration-300
          bg-gradient-to-br ${template.gradient} bg-opacity-10
          ${isExecuting
            ? 'border-white/30 cursor-wait'
            : 'border-white/20 hover:border-white/40 hover:shadow-xl hover:shadow-cyan-500/10'
          }
        `}
      >
        {/* Background glow effect */}
        <div className={`absolute inset-0 bg-gradient-to-br ${template.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />

        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${template.gradient} text-white shadow-lg`}
            >
              <IconComponent />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 text-white text-xs">
              <Icons.Sparkles />
              <span>{template.popularity}% popular</span>
            </div>
          </div>

          {/* Title & Description */}
          <h3 className="text-xl font-bold text-white mb-2">{template.name}</h3>
          <p className="text-sm text-white/70 mb-4 line-clamp-2">{template.description}</p>

          {/* Stats */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5 text-white/60 text-sm">
              <Icons.Clock />
              <span>{formatEstimatedTime(template.estimatedSeconds)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/60 text-sm">
              <Icons.Check />
              <span>{template.successRate}% success</span>
            </div>
          </div>

          {/* Agent avatars */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex -space-x-2">
              {template.steps.slice(0, 4).map((step, i) => (
                <div key={step.id} className="relative" style={{ zIndex: 4 - i }}>
                  <ProfessionalAvatar agentId={step.agentId} size={28} />
                </div>
              ))}
            </div>
            <span className="text-xs text-white/50">{template.steps.length} steps</span>
          </div>

          {/* Execute button */}
          <Button
            onClick={() => onExecute(template)}
            disabled={isExecuting}
            className={`
              w-full py-3 rounded-xl font-semibold transition-all
              ${isExecuting
                ? 'bg-white/20 cursor-wait'
                : 'bg-white text-slate-900 hover:bg-white/90 hover:shadow-lg active:scale-[0.98]'
              }
            `}
          >
            {isExecuting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                <span>Running...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Icons.Play />
                <span>Run Now</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div
      className={`
        group relative overflow-hidden rounded-2xl border transition-all duration-300
        ${isExecuting
          ? 'bg-slate-800/80 border-cyan-500/50 cursor-wait'
          : 'bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/50 hover:bg-slate-800/80'
        }
      `}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${template.gradient} text-white shadow-lg`}
          >
            <IconComponent />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
              {template.name}
            </h3>
            <p className="text-sm text-slate-400 line-clamp-2 mt-1">
              {template.description}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Icons.Clock />
            <span>{formatEstimatedTime(template.estimatedSeconds)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Icons.Check />
            <span>{template.successRate}%</span>
          </div>
          <div className="text-slate-500">
            {template.usageCount.toLocaleString()} runs
          </div>
        </div>

        {/* Workflow steps preview */}
        <div className="flex items-center gap-1 mb-4 overflow-hidden">
          {template.steps.map((step, i) => (
            <div key={step.id} className="flex items-center">
              <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-slate-700">
                <ProfessionalAvatar agentId={step.agentId} size={24} />
              </div>
              {i < template.steps.length - 1 && (
                <div className="w-4 h-0.5 bg-slate-700" />
              )}
            </div>
          ))}
        </div>

        {/* Execute button */}
        <Button
          onClick={() => onExecute(template)}
          disabled={isExecuting}
          className="w-full"
        >
          {isExecuting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Running...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Icons.Zap />
              <span>Run Instantly</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  )
}

interface QuickTemplateInputModalProps {
  template: QuickTemplate
  onClose: () => void
  onExecute: (template: QuickTemplate, inputs: Record<string, string>) => void
}

function QuickTemplateInputModal({
  template,
  onClose,
  onExecute,
}: QuickTemplateInputModalProps) {
  const [inputs, setInputs] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {}
    template.requiredInputs.forEach(input => {
      defaults[input.id] = input.defaultValue || ''
    })
    return defaults
  })

  const handleSubmit = useCallback(() => {
    onExecute(template, inputs)
  }, [template, inputs, onExecute])

  const isValid = template.requiredInputs
    .filter(i => i.required)
    .every(i => inputs[i.id]?.trim())

  const IconComponent = getIcon(template.icon)

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-3xl border border-slate-700 max-w-lg w-full overflow-hidden">
        {/* Header with gradient */}
        <div className={`relative p-6 bg-gradient-to-br ${template.gradient}`}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white">
              <IconComponent />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{template.name}</h2>
              <div className="flex items-center gap-2 text-sm text-white/70 mt-1">
                <Icons.Clock />
                <span>{formatEstimatedTime(template.estimatedSeconds)}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="p-6 space-y-4">
          <p className="text-slate-400 text-sm">{template.description}</p>

          {template.requiredInputs.map(input => (
            <div key={input.id}>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {input.label}
                {input.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              {input.type === 'select' ? (
                <select
                  value={inputs[input.id] || ''}
                  onChange={(e) => setInputs(prev => ({ ...prev, [input.id]: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  {input.options?.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={input.type}
                  value={inputs[input.id] || ''}
                  onChange={(e) => setInputs(prev => ({ ...prev, [input.id]: e.target.value }))}
                  placeholder={input.placeholder}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              )}
            </div>
          ))}

          {/* Workflow preview */}
          <div className="pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">Workflow Steps</p>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {template.steps.map((step, i) => {
                const agentConfig = getAvatarConfig(step.agentId)
                return (
                  <div key={step.id} className="flex items-center shrink-0">
                    <div className="flex flex-col items-center">
                      <ProfessionalAvatar agentId={step.agentId} size={32} />
                      <span className="text-[10px] text-slate-500 mt-1 truncate max-w-[60px]">
                        {agentConfig.name.split(' ')[0]}
                      </span>
                    </div>
                    {i < template.steps.length - 1 && (
                      <div className="mx-1 text-slate-600">
                        <Icons.ChevronRight />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            className="flex-1"
          >
            <Icons.Zap />
            <span>Execute Now</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

interface ExecutionProgressModalProps {
  template: QuickTemplate
  currentStep: number
  onClose: () => void
  isComplete: boolean
}

function ExecutionProgressModal({
  template,
  currentStep,
  onClose,
  isComplete,
}: ExecutionProgressModalProps) {
  const IconComponent = getIcon(template.icon)
  const progress = ((currentStep + 1) / template.steps.length) * 100

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-3xl border border-slate-700 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className={`relative p-6 bg-gradient-to-br ${template.gradient}`}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white ${!isComplete ? 'animate-pulse' : ''}`}>
              {isComplete ? <Icons.Check /> : <IconComponent />}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">
                {isComplete ? 'Complete!' : 'Running...'}
              </h2>
              <p className="text-sm text-white/70">{template.name}</p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="p-6">
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Progress</span>
              <span className="text-cyan-400 font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${template.gradient} transition-all duration-500`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {template.steps.map((step, i) => {
              const agentConfig = getAvatarConfig(step.agentId)
              const status = i < currentStep ? 'complete' : i === currentStep ? 'running' : 'pending'

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    status === 'running'
                      ? 'bg-cyan-500/10 border border-cyan-500/30'
                      : status === 'complete'
                      ? 'bg-emerald-500/10 border border-emerald-500/30'
                      : 'bg-slate-800/50 border border-transparent'
                  }`}
                >
                  {/* Status indicator */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      status === 'complete'
                        ? 'bg-emerald-500 text-white'
                        : status === 'running'
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-slate-700 text-slate-500'
                    }`}
                  >
                    {status === 'complete' ? (
                      <Icons.Check />
                    ) : status === 'running' ? (
                      <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="text-sm">{i + 1}</span>
                    )}
                  </div>

                  {/* Agent avatar */}
                  <ProfessionalAvatar
                    agentId={step.agentId}
                    size={36}
                    isActive={status === 'running'}
                  />

                  {/* Step info */}
                  <div className="flex-1">
                    <p className={`font-medium ${
                      status === 'complete' ? 'text-emerald-400' :
                      status === 'running' ? 'text-cyan-400' : 'text-slate-400'
                    }`}>
                      {step.name}
                    </p>
                    <p className="text-xs text-slate-500">{agentConfig.name}</p>
                  </div>

                  {/* Time estimate */}
                  <span className="text-xs text-slate-500">
                    {formatEstimatedTime(step.estimatedSeconds)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        {isComplete && (
          <div className="p-6 pt-0">
            <Button onClick={onClose} className="w-full">
              View Results
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

interface QuickTemplatesProps {
  onExecuteTemplate?: (template: QuickTemplate, inputs: Record<string, string>) => Promise<void>
  variant?: 'grid' | 'horizontal' | 'compact'
  showFeatured?: boolean
  limit?: number
}

export function QuickTemplates({
  onExecuteTemplate,
  variant = 'grid',
  showFeatured = true,
  limit,
}: QuickTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<QuickTemplate | null>(null)
  const [executingTemplate, setExecutingTemplate] = useState<QuickTemplate | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const templates = limit ? QUICK_TEMPLATES.slice(0, limit) : QUICK_TEMPLATES
  const popularTemplates = getPopularQuickTemplates(3)

  const handleExecute = useCallback(async (template: QuickTemplate, inputs: Record<string, string>) => {
    setSelectedTemplate(null)
    setExecutingTemplate(template)
    setCurrentStep(0)
    setIsComplete(false)

    // Simulate step-by-step execution
    for (let i = 0; i < template.steps.length; i++) {
      setCurrentStep(i)
      await new Promise(resolve => setTimeout(resolve, template.steps[i].estimatedSeconds * 100)) // 10x faster for demo
    }

    setIsComplete(true)

    // Call external handler if provided
    if (onExecuteTemplate) {
      await onExecuteTemplate(template, inputs)
    }
  }, [onExecuteTemplate])

  const handleQuickExecute = useCallback((template: QuickTemplate) => {
    // If template has required inputs without defaults, show modal
    const needsInput = template.requiredInputs.some(i => i.required && !i.defaultValue)
    if (needsInput) {
      setSelectedTemplate(template)
    } else {
      // Execute with defaults
      const defaults: Record<string, string> = {}
      template.requiredInputs.forEach(input => {
        defaults[input.id] = input.defaultValue || ''
      })
      handleExecute(template, defaults)
    }
  }, [handleExecute])

  if (variant === 'horizontal') {
    return (
      <div className="space-y-4">
        {showFeatured && (
          <div className="flex items-center gap-2 mb-2">
            <Icons.Sparkles />
            <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
          </div>
        )}
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
          {templates.map(template => (
            <div key={template.id} className="shrink-0 w-[280px]">
              <QuickTemplateCard
                template={template}
                onExecute={handleQuickExecute}
                isExecuting={executingTemplate?.id === template.id}
              />
            </div>
          ))}
        </div>

        {selectedTemplate && (
          <QuickTemplateInputModal
            template={selectedTemplate}
            onClose={() => setSelectedTemplate(null)}
            onExecute={handleExecute}
          />
        )}

        {executingTemplate && (
          <ExecutionProgressModal
            template={executingTemplate}
            currentStep={currentStep}
            isComplete={isComplete}
            onClose={() => {
              setExecutingTemplate(null)
              setIsComplete(false)
            }}
          />
        )}
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className="space-y-2">
        {templates.map(template => (
          <QuickTemplateCard
            key={template.id}
            template={template}
            onExecute={handleQuickExecute}
            isExecuting={executingTemplate?.id === template.id}
            variant="compact"
          />
        ))}

        {selectedTemplate && (
          <QuickTemplateInputModal
            template={selectedTemplate}
            onClose={() => setSelectedTemplate(null)}
            onExecute={handleExecute}
          />
        )}

        {executingTemplate && (
          <ExecutionProgressModal
            template={executingTemplate}
            currentStep={currentStep}
            isComplete={isComplete}
            onClose={() => {
              setExecutingTemplate(null)
              setIsComplete(false)
            }}
          />
        )}
      </div>
    )
  }

  // Grid variant (default)
  return (
    <div className="space-y-8">
      {/* Featured templates */}
      {showFeatured && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Icons.Sparkles />
            <h2 className="text-xl font-bold text-white">Most Popular</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {popularTemplates.map(template => (
              <QuickTemplateCard
                key={template.id}
                template={template}
                onExecute={handleQuickExecute}
                isExecuting={executingTemplate?.id === template.id}
                variant="featured"
              />
            ))}
          </div>
        </div>
      )}

      {/* All templates */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">All Quick Templates</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <QuickTemplateCard
              key={template.id}
              template={template}
              onExecute={handleQuickExecute}
              isExecuting={executingTemplate?.id === template.id}
            />
          ))}
        </div>
      </div>

      {/* Input modal */}
      {selectedTemplate && (
        <QuickTemplateInputModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onExecute={handleExecute}
        />
      )}

      {/* Execution progress */}
      {executingTemplate && (
        <ExecutionProgressModal
          template={executingTemplate}
          currentStep={currentStep}
          isComplete={isComplete}
          onClose={() => {
            setExecutingTemplate(null)
            setIsComplete(false)
          }}
        />
      )}
    </div>
  )
}

export { QUICK_TEMPLATES, getPopularQuickTemplates, formatEstimatedTime }
export type { QuickTemplate, QuickTemplateInput }
