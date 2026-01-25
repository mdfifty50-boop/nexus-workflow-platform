/**
 * Progressive Disclosure Form Components
 * Breaks long forms into steps/sections with collapsible advanced options
 */

import { useState, useCallback, createContext, useContext, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// Types
interface FormStep {
  id: string
  title: string
  description?: string
  isOptional?: boolean
  isAdvanced?: boolean
}

interface ProgressiveFormContextType {
  currentStep: number
  totalSteps: number
  completedSteps: Set<number>
  goToStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  markComplete: (step: number) => void
  isStepAccessible: (step: number) => boolean
}

const ProgressiveFormContext = createContext<ProgressiveFormContextType | null>(null)

// Hook to access form context
export function useProgressiveForm() {
  const context = useContext(ProgressiveFormContext)
  if (!context) {
    throw new Error('useProgressiveForm must be used within ProgressiveFormProvider')
  }
  return context
}

// Provider component
interface ProgressiveFormProviderProps {
  children: ReactNode
  totalSteps: number
  initialStep?: number
  onStepChange?: (step: number) => void
  allowSkip?: boolean
}

export function ProgressiveFormProvider({
  children,
  totalSteps,
  initialStep = 0,
  onStepChange,
  allowSkip = false,
}: ProgressiveFormProviderProps) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < totalSteps) {
      if (allowSkip || step <= Math.max(...completedSteps, currentStep) + 1) {
        setCurrentStep(step)
        onStepChange?.(step)
      }
    }
  }, [totalSteps, allowSkip, completedSteps, currentStep, onStepChange])

  const nextStep = useCallback(() => {
    goToStep(currentStep + 1)
  }, [currentStep, goToStep])

  const prevStep = useCallback(() => {
    goToStep(currentStep - 1)
  }, [currentStep, goToStep])

  const markComplete = useCallback((step: number) => {
    setCompletedSteps(prev => new Set([...prev, step]))
  }, [])

  const isStepAccessible = useCallback((step: number) => {
    if (allowSkip) return true
    return step <= Math.max(...completedSteps, -1) + 1
  }, [allowSkip, completedSteps])

  return (
    <ProgressiveFormContext.Provider
      value={{
        currentStep,
        totalSteps,
        completedSteps,
        goToStep,
        nextStep,
        prevStep,
        markComplete,
        isStepAccessible,
      }}
    >
      {children}
    </ProgressiveFormContext.Provider>
  )
}

// Step indicator component
interface StepIndicatorProps {
  steps: FormStep[]
  className?: string
  orientation?: 'horizontal' | 'vertical'
}

export function StepIndicator({ steps, className, orientation = 'horizontal' }: StepIndicatorProps) {
  const { currentStep, completedSteps, goToStep, isStepAccessible } = useProgressiveForm()

  return (
    <nav
      className={cn(
        'flex',
        orientation === 'vertical' ? 'flex-col space-y-2' : 'items-center justify-between',
        className
      )}
      aria-label="Form progress"
    >
      {steps.map((step, index) => {
        const isCompleted = completedSteps.has(index)
        const isCurrent = currentStep === index
        const isAccessible = isStepAccessible(index)

        return (
          <div
            key={step.id}
            className={cn(
              'flex items-center',
              orientation === 'horizontal' && index < steps.length - 1 && 'flex-1'
            )}
          >
            <button
              type="button"
              onClick={() => isAccessible && goToStep(index)}
              disabled={!isAccessible}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                isCurrent && 'bg-primary text-primary-foreground',
                isCompleted && !isCurrent && 'bg-emerald-500/20 text-emerald-400',
                !isCurrent && !isCompleted && isAccessible && 'bg-muted hover:bg-muted/80',
                !isAccessible && 'cursor-not-allowed opacity-50'
              )}
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={`Step ${index + 1}: ${step.title}${isCompleted ? ' (completed)' : ''}${step.isOptional ? ' (optional)' : ''}`}
            >
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                  isCurrent && 'bg-white/20',
                  isCompleted && !isCurrent && 'bg-emerald-500/30',
                  !isCurrent && !isCompleted && 'bg-muted-foreground/20'
                )}
              >
                {isCompleted && !isCurrent ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </span>
              <span className="hidden sm:inline">{step.title}</span>
              {step.isOptional && (
                <span className="text-xs opacity-60">(optional)</span>
              )}
            </button>

            {/* Connector line */}
            {orientation === 'horizontal' && index < steps.length - 1 && (
              <div
                className={cn(
                  'mx-2 h-0.5 flex-1',
                  isCompleted ? 'bg-emerald-500' : 'bg-border'
                )}
                aria-hidden="true"
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}

// Form step content wrapper
interface FormStepProps {
  step: number
  children: ReactNode
  className?: string
}

export function FormStep({ step, children, className }: FormStepProps) {
  const { currentStep } = useProgressiveForm()

  if (currentStep !== step) return null

  return (
    <div
      className={cn('animate-in fade-in slide-in-from-right-4 duration-300', className)}
      role="tabpanel"
      aria-label={`Step ${step + 1} content`}
    >
      {children}
    </div>
  )
}

// Collapsible section for advanced options
interface CollapsibleSectionProps {
  title: string
  description?: string
  children: ReactNode
  defaultOpen?: boolean
  className?: string
}

export function CollapsibleSection({
  title,
  description,
  children,
  defaultOpen = false,
  className,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={cn('rounded-lg border border-border', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/50"
        aria-expanded={isOpen}
        aria-controls={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <div>
          <h3 className="font-medium">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <svg
          className={cn(
            'h-5 w-5 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        id={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}
        className={cn(
          'overflow-hidden transition-all duration-300',
          isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        )}
        aria-hidden={!isOpen}
      >
        <div className="border-t border-border p-4">
          {children}
        </div>
      </div>
    </div>
  )
}

// Form navigation buttons
interface FormNavigationProps {
  onSubmit?: () => void
  submitLabel?: string
  showSkip?: boolean
  onSkip?: () => void
  isSubmitting?: boolean
  canSubmit?: boolean
  className?: string
}

export function FormNavigation({
  onSubmit,
  submitLabel = 'Submit',
  showSkip = false,
  onSkip,
  isSubmitting = false,
  canSubmit = true,
  className,
}: FormNavigationProps) {
  const { currentStep, totalSteps, nextStep, prevStep, markComplete } = useProgressiveForm()
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1

  const handleNext = () => {
    markComplete(currentStep)
    if (isLastStep && onSubmit) {
      onSubmit()
    } else {
      nextStep()
    }
  }

  return (
    <div className={cn('flex items-center justify-between pt-6', className)}>
      <Button
        type="button"
        variant="outline"
        onClick={prevStep}
        disabled={isFirstStep}
        aria-label="Go to previous step"
      >
        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Previous
      </Button>

      <div className="flex items-center gap-2">
        {showSkip && !isLastStep && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              onSkip?.()
              nextStep()
            }}
            aria-label="Skip this step"
          >
            Skip
          </Button>
        )}

        <Button
          type="button"
          onClick={handleNext}
          disabled={isSubmitting || (isLastStep && !canSubmit)}
          aria-label={isLastStep ? submitLabel : 'Go to next step'}
        >
          {isSubmitting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Processing...
            </>
          ) : isLastStep ? (
            submitLabel
          ) : (
            <>
              Next
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// Progress bar component
interface FormProgressBarProps {
  className?: string
}

export function FormProgressBar({ className }: FormProgressBarProps) {
  const { currentStep, totalSteps, completedSteps } = useProgressiveForm()
  const progress = ((completedSteps.size + (currentStep === completedSteps.size ? 0.5 : 0)) / totalSteps) * 100

  return (
    <div className={cn('w-full', className)} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-muted-foreground">
          Step {currentStep + 1} of {totalSteps}
        </span>
        <span className="text-muted-foreground">
          {Math.round(progress)}% complete
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

// Example workflow creation form with progressive disclosure
export function WorkflowCreationForm({
  onSubmit,
  onCancel,
  initialData,
}: {
  onSubmit: (data: WorkflowFormData) => void
  onCancel: () => void
  initialData?: Partial<WorkflowFormData>
}) {
  const [formData, setFormData] = useState<WorkflowFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || 'general',
    trigger: initialData?.trigger || 'manual',
    scheduleExpression: initialData?.scheduleExpression || '',
    retryEnabled: initialData?.retryEnabled ?? true,
    maxRetries: initialData?.maxRetries ?? 3,
    notifyOnFailure: initialData?.notifyOnFailure ?? true,
    notifyOnSuccess: initialData?.notifyOnSuccess ?? false,
    timeout: initialData?.timeout ?? 300,
    tags: initialData?.tags || [],
  })

  const steps: FormStep[] = [
    { id: 'basics', title: 'Basic Info', description: 'Name and description' },
    { id: 'trigger', title: 'Trigger', description: 'When to run' },
    { id: 'settings', title: 'Settings', description: 'Advanced options', isAdvanced: true },
    { id: 'review', title: 'Review', description: 'Confirm and create' },
  ]

  const updateField = <K extends keyof WorkflowFormData>(
    field: K,
    value: WorkflowFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    onSubmit(formData)
  }

  return (
    <ProgressiveFormProvider totalSteps={steps.length} onStepChange={() => {}}>
      <div className="space-y-6">
        <FormProgressBar />
        <StepIndicator steps={steps} />

        {/* Step 1: Basic Info */}
        <FormStep step={0}>
          <div className="space-y-4">
            <div>
              <label htmlFor="workflow-name" className="block text-sm font-medium mb-1">
                Workflow Name *
              </label>
              <input
                id="workflow-name"
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g., Daily Report Generator"
                className="w-full rounded-lg border border-border bg-background px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
                aria-required="true"
                aria-describedby="name-hint"
              />
              <p id="name-hint" className="mt-1 text-xs text-muted-foreground">
                Choose a descriptive name for your workflow
              </p>
            </div>

            <div>
              <label htmlFor="workflow-description" className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                id="workflow-description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="What does this workflow do?"
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                aria-describedby="description-hint"
              />
              <p id="description-hint" className="mt-1 text-xs text-muted-foreground">
                Optional: Describe the purpose of this workflow
              </p>
            </div>

            <div>
              <label htmlFor="workflow-category" className="block text-sm font-medium mb-1">
                Category
              </label>
              <select
                id="workflow-category"
                value={formData.category}
                onChange={(e) => updateField('category', e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Select workflow category"
              >
                <option value="general">General</option>
                <option value="marketing">Marketing</option>
                <option value="sales">Sales</option>
                <option value="support">Customer Support</option>
                <option value="operations">Operations</option>
                <option value="finance">Finance</option>
              </select>
            </div>
          </div>
        </FormStep>

        {/* Step 2: Trigger Configuration */}
        <FormStep step={1}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-3">
                How should this workflow be triggered?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Trigger type">
                {[
                  { value: 'manual', label: 'Manual', icon: '👆', desc: 'Run on demand' },
                  { value: 'schedule', label: 'Scheduled', icon: '🕐', desc: 'Run on a schedule' },
                  { value: 'webhook', label: 'Webhook', icon: '🔗', desc: 'Triggered by API' },
                ].map(option => (
                  <label
                    key={option.value}
                    className={cn(
                      'flex cursor-pointer flex-col items-center rounded-lg border-2 p-4 transition-all',
                      formData.trigger === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <input
                      type="radio"
                      name="trigger"
                      value={option.value}
                      checked={formData.trigger === option.value}
                      onChange={(e) => updateField('trigger', e.target.value)}
                      className="sr-only"
                      aria-label={`${option.label}: ${option.desc}`}
                    />
                    <span className="text-2xl mb-2" aria-hidden="true">{option.icon}</span>
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            {formData.trigger === 'schedule' && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <label htmlFor="schedule-expression" className="block text-sm font-medium mb-1">
                  Schedule (Cron Expression)
                </label>
                <input
                  id="schedule-expression"
                  type="text"
                  value={formData.scheduleExpression}
                  onChange={(e) => updateField('scheduleExpression', e.target.value)}
                  placeholder="0 9 * * MON-FRI"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  aria-describedby="schedule-hint"
                />
                <p id="schedule-hint" className="mt-1 text-xs text-muted-foreground">
                  Example: &quot;0 9 * * MON-FRI&quot; runs at 9 AM on weekdays
                </p>
              </div>
            )}
          </div>
        </FormStep>

        {/* Step 3: Advanced Settings */}
        <FormStep step={2}>
          <div className="space-y-4">
            <CollapsibleSection
              title="Retry Configuration"
              description="Configure automatic retry behavior"
              defaultOpen={true}
            >
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.retryEnabled}
                    onChange={(e) => updateField('retryEnabled', e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    aria-label="Enable automatic retries"
                  />
                  <span>Enable automatic retries on failure</span>
                </label>

                {formData.retryEnabled && (
                  <div>
                    <label htmlFor="max-retries" className="block text-sm font-medium mb-1">
                      Maximum Retries
                    </label>
                    <input
                      id="max-retries"
                      type="number"
                      min={1}
                      max={10}
                      value={formData.maxRetries}
                      onChange={(e) => updateField('maxRetries', parseInt(e.target.value, 10))}
                      className="w-24 rounded-lg border border-border bg-background px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Notifications"
              description="Configure notification preferences"
            >
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.notifyOnFailure}
                    onChange={(e) => updateField('notifyOnFailure', e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    aria-label="Notify on failure"
                  />
                  <span>Notify me when workflow fails</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.notifyOnSuccess}
                    onChange={(e) => updateField('notifyOnSuccess', e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    aria-label="Notify on success"
                  />
                  <span>Notify me when workflow succeeds</span>
                </label>
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Execution Settings"
              description="Configure timeout and performance options"
            >
              <div>
                <label htmlFor="timeout" className="block text-sm font-medium mb-1">
                  Timeout (seconds)
                </label>
                <input
                  id="timeout"
                  type="number"
                  min={30}
                  max={3600}
                  value={formData.timeout}
                  onChange={(e) => updateField('timeout', parseInt(e.target.value, 10))}
                  className="w-32 rounded-lg border border-border bg-background px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Maximum execution time before timeout (30-3600 seconds)
                </p>
              </div>
            </CollapsibleSection>
          </div>
        </FormStep>

        {/* Step 4: Review */}
        <FormStep step={3}>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Review Your Workflow</h3>

            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{formData.name || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category:</span>
                <span className="font-medium capitalize">{formData.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trigger:</span>
                <span className="font-medium capitalize">{formData.trigger}</span>
              </div>
              {formData.trigger === 'schedule' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Schedule:</span>
                  <span className="font-medium font-mono">{formData.scheduleExpression || 'Not set'}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Retries:</span>
                <span className="font-medium">
                  {formData.retryEnabled ? `Up to ${formData.maxRetries}` : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Timeout:</span>
                <span className="font-medium">{formData.timeout} seconds</span>
              </div>
            </div>

            {formData.description && (
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <span className="text-sm text-muted-foreground">Description:</span>
                <p className="mt-1">{formData.description}</p>
              </div>
            )}
          </div>
        </FormStep>

        <FormNavigation
          onSubmit={handleSubmit}
          submitLabel="Create Workflow"
          canSubmit={!!formData.name}
        />

        <div className="flex justify-center pt-4 border-t border-border">
          <Button variant="ghost" onClick={onCancel} aria-label="Cancel workflow creation">
            Cancel
          </Button>
        </div>
      </div>
    </ProgressiveFormProvider>
  )
}

// Types
export interface WorkflowFormData {
  name: string
  description: string
  category: string
  trigger: string
  scheduleExpression: string
  retryEnabled: boolean
  maxRetries: number
  notifyOnFailure: boolean
  notifyOnSuccess: boolean
  timeout: number
  tags: string[]
}
