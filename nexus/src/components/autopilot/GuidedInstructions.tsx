/**
 * GuidedInstructions - Fallback manual instruction list shown when browser
 * automation is unavailable.
 *
 * Renders numbered steps with expandable details, clickable URLs, per-step
 * "mark as done" checkboxes, and a global completion button that enables
 * only when every step is checked.
 */

import { useState, useMemo, useCallback } from 'react'

interface GuidedStep {
  title: string
  description: string
  url?: string
  screenshotUrl?: string
}

interface GuidedInstructionsProps {
  steps: GuidedStep[]
  service: string
  serviceName: string
  onComplete: () => void
  onCancel: () => void
}

/** Map common service slugs to a display-friendly emoji. */
function serviceIcon(service: string): string {
  const icons: Record<string, string> = {
    gmail: '📧',
    slack: '💬',
    googlesheets: '📊',
    googledrive: '📁',
    dropbox: '📦',
    github: '🐙',
    notion: '📝',
    discord: '🎮',
    trello: '📋',
    asana: '✅',
    linear: '🔵',
    hubspot: '🟠',
    stripe: '💳',
    zoom: '📹',
  }
  return icons[service.toLowerCase()] || '🔗'
}

export function GuidedInstructions({
  steps,
  service,
  serviceName,
  onComplete,
  onCancel,
}: GuidedInstructionsProps) {
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set())
  const [expandedStep, setExpandedStep] = useState<number | null>(0) // first step expanded by default

  const allChecked = useMemo(
    () => steps.length > 0 && checkedSteps.size === steps.length,
    [checkedSteps, steps.length]
  )

  const progressPct = useMemo(
    () => (steps.length > 0 ? Math.round((checkedSteps.size / steps.length) * 100) : 0),
    [checkedSteps, steps.length]
  )

  const toggleCheck = useCallback((index: number) => {
    setCheckedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }, [])

  const toggleExpand = useCallback((index: number) => {
    setExpandedStep((prev) => (prev === index ? null : index))
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-surface-700/50">
        <div className="w-10 h-10 rounded-xl bg-surface-800 border border-surface-700 flex items-center justify-center text-xl">
          {serviceIcon(service)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white">
            Set up {serviceName} manually
          </h3>
          <p className="text-xs text-surface-400">
            Follow these steps to configure the integration
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-1.5 rounded-lg hover:bg-surface-700 text-surface-500 hover:text-surface-300 transition-colors"
          aria-label="Close instructions"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress indicator */}
      <div className="px-4 py-2 border-b border-surface-800">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-surface-400">
            {checkedSteps.size} of {steps.length} steps completed
          </span>
          <span
            className={`font-medium ${
              allChecked ? 'text-emerald-400' : 'text-cyan-400'
            }`}
          >
            {progressPct}%
          </span>
        </div>
        <div className="h-1 bg-surface-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              allChecked
                ? 'bg-emerald-500'
                : 'bg-gradient-to-r from-cyan-500 to-purple-500'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Step list - scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {steps.map((step, index) => {
          const isChecked = checkedSteps.has(index)
          const isExpanded = expandedStep === index

          return (
            <div
              key={index}
              className={`rounded-xl border transition-all duration-200 ${
                isChecked
                  ? 'bg-emerald-500/5 border-emerald-500/15'
                  : isExpanded
                  ? 'bg-surface-800/50 border-surface-600'
                  : 'bg-surface-800/30 border-surface-700/50 hover:border-surface-600'
              }`}
            >
              {/* Step header - clickable to expand */}
              <div
                className="flex items-center gap-3 p-3 cursor-pointer select-none"
                onClick={() => toggleExpand(index)}
              >
                {/* Step number / check */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleCheck(index)
                  }}
                  className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    isChecked
                      ? 'bg-emerald-500 border-emerald-400 text-white'
                      : 'bg-surface-800 border-surface-600 text-surface-400 hover:border-surface-500'
                  }`}
                  aria-label={isChecked ? `Step ${index + 1} completed` : `Mark step ${index + 1} as done`}
                >
                  {isChecked ? (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>

                {/* Title */}
                <span
                  className={`flex-1 text-sm font-medium ${
                    isChecked ? 'text-emerald-400 line-through' : 'text-surface-200'
                  }`}
                >
                  {step.title}
                </span>

                {/* Expand chevron */}
                <svg
                  className={`w-4 h-4 text-surface-500 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-3 pb-3 space-y-3 border-t border-surface-700/30 pt-3 ml-10">
                  {/* Description */}
                  <p className="text-xs text-surface-400 leading-relaxed">
                    {step.description}
                  </p>

                  {/* URL link */}
                  {step.url && (
                    <a
                      href={step.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors group"
                    >
                      <svg
                        className="w-3 h-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                        <path d="M15 3h6v6" />
                        <path d="M10 14L21 3" />
                      </svg>
                      <span className="group-hover:underline">{step.url}</span>
                    </a>
                  )}

                  {/* Screenshot */}
                  {step.screenshotUrl && (
                    <div className="rounded-lg overflow-hidden border border-surface-700">
                      <img
                        src={step.screenshotUrl}
                        alt={`Step ${index + 1} reference`}
                        className="w-full h-auto"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Mark as done button (inline) */}
                  <button
                    onClick={() => toggleCheck(index)}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                      isChecked
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-surface-700 text-surface-300 hover:text-white border border-surface-600 hover:border-surface-500'
                    }`}
                  >
                    {isChecked ? (
                      <>
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Completed
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <circle cx="12" cy="12" r="8" />
                        </svg>
                        Mark as done
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer - completion button */}
      <div className="p-4 border-t border-surface-700/50">
        <button
          onClick={onComplete}
          disabled={!allChecked}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            allChecked
              ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 hover:border-emerald-500/40'
              : 'bg-surface-800 text-surface-500 border border-surface-700 cursor-not-allowed'
          }`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {allChecked
            ? "Done - I've completed these steps"
            : `Complete all ${steps.length} steps to continue`}
        </button>
      </div>
    </div>
  )
}

export default GuidedInstructions
