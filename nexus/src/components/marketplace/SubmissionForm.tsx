/**
 * SubmissionForm Component
 * Multi-step wizard for submitting templates to the marketplace
 */

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type {
  SubmissionFormData,
  TemplateCategoryType,
  PricingConfig,
  PublishingOptions,
} from '@/lib/marketplace/submission-types'
import {
  TemplateCategory,
  PricingModel,
} from '@/lib/marketplace/submission-types'
import { createSubmission, updateSubmission, submitForReview } from '@/lib/marketplace/submission-service'

// Step definitions
const FORM_STEPS = [
  { id: 'basics', title: 'Basic Info', description: 'Name and description' },
  { id: 'configuration', title: 'Configuration', description: 'Template setup' },
  { id: 'pricing', title: 'Pricing', description: 'Set your price' },
  { id: 'publishing', title: 'Publishing', description: 'Visibility options' },
  { id: 'preview', title: 'Preview', description: 'Review and submit' },
]

// Common integrations for selection
const COMMON_INTEGRATIONS = [
  'Slack', 'Gmail', 'Google Sheets', 'Google Drive', 'Salesforce', 'HubSpot',
  'Notion', 'Trello', 'Jira', 'GitHub', 'Zoom', 'Teams', 'Calendar',
  'Dropbox', 'LinkedIn', 'Twitter', 'WhatsApp', 'Stripe', 'QuickBooks',
]

// Available agents
const AVAILABLE_AGENTS = [
  { id: 'nexus', name: 'Nexus AI', icon: '🤖' },
  { id: 'larry', name: 'Larry', icon: '👔' },
  { id: 'mary', name: 'Mary', icon: '👩' },
  { id: 'sam', name: 'Sam', icon: '👨' },
  { id: 'emma', name: 'Emma', icon: '👩‍💼' },
  { id: 'alex', name: 'Alex', icon: '🧑‍💻' },
  { id: 'olivia', name: 'Olivia', icon: '👩‍🔬' },
]

// Category icons
const CATEGORY_ICONS: Record<string, string> = {
  marketing: '📢',
  sales: '💼',
  operations: '⚙️',
  hr: '👥',
  development: '💻',
  finance: '💰',
  customer: '🎯',
  meetings: '📝',
  healthcare: '🏥',
  legal: '⚖️',
  'real-estate': '🏠',
  education: '📖',
  devops: '🚀',
  other: '📦',
}

// Template icons
const TEMPLATE_ICONS = [
  '📦', '🚀', '⚙️', '📊', '💡', '🎯', '📈', '🔄', '⚡', '🛠️',
  '📋', '✅', '🔔', '📧', '💬', '📱', '🖥️', '🌐', '🔗', '📁',
]

interface SubmissionFormProps {
  onSuccess: (submissionId: string) => void
  onCancel: () => void
  existingSubmissionId?: string
  initialData?: Partial<SubmissionFormData>
}

export function SubmissionForm({
  onSuccess,
  onCancel,
  existingSubmissionId,
  initialData,
}: SubmissionFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submissionId, setSubmissionId] = useState<string | undefined>(existingSubmissionId)

  // Form data state
  const [formData, setFormData] = useState<SubmissionFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || TemplateCategory.Other,
    icon: initialData?.icon || '📦',
    tags: initialData?.tags || [],
    integrations: initialData?.integrations || [],
    agents: initialData?.agents || [],
    steps: initialData?.steps || 1,
    estimatedTimeSaved: initialData?.estimatedTimeSaved || '',
    estimatedSuccessRate: initialData?.estimatedSuccessRate || 90,
    pricing: initialData?.pricing || {
      model: PricingModel.Free,
    },
    publishingOptions: initialData?.publishingOptions || {
      visibility: 'public',
      allowCloning: true,
      showAuthor: true,
      enableRatings: true,
      enableComments: true,
      featuredRequest: false,
      targetAudience: [],
      promotionalTags: [],
    },
    metadata: initialData?.metadata || {
      version: '1.0.0',
      estimatedSetupTime: 15,
      difficulty: 'beginner',
      prerequisites: [],
      screenshots: [],
    },
  })

  // Update form field
  const updateField = useCallback(<K extends keyof SubmissionFormData>(
    field: K,
    value: SubmissionFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  // Update nested pricing
  const updatePricing = useCallback((updates: Partial<PricingConfig>) => {
    setFormData(prev => ({
      ...prev,
      pricing: { ...prev.pricing, ...updates },
    }))
  }, [])

  // Update nested publishing options
  const updatePublishingOptions = useCallback((updates: Partial<PublishingOptions>) => {
    setFormData(prev => ({
      ...prev,
      publishingOptions: { ...prev.publishingOptions, ...updates },
    }))
  }, [])

  // Toggle integration selection
  const toggleIntegration = useCallback((integration: string) => {
    setFormData(prev => ({
      ...prev,
      integrations: prev.integrations.includes(integration)
        ? prev.integrations.filter(i => i !== integration)
        : [...prev.integrations, integration],
    }))
  }, [])

  // Toggle agent selection
  const toggleAgent = useCallback((agentId: string) => {
    setFormData(prev => ({
      ...prev,
      agents: prev.agents.includes(agentId)
        ? prev.agents.filter(a => a !== agentId)
        : [...prev.agents, agentId],
    }))
  }, [])

  // Save draft
  const saveDraft = useCallback(async () => {
    setError(null)

    if (submissionId) {
      const result = updateSubmission(submissionId, formData)
      if (!result.success) {
        setError(result.error || 'Failed to save draft')
        return null
      }
      return submissionId
    } else {
      const result = createSubmission(formData)
      if (!result.success) {
        setError(result.error || 'Failed to create draft')
        return null
      }
      setSubmissionId(result.submission?.id)
      return result.submission?.id
    }
  }, [submissionId, formData])

  // Navigate to next step
  const handleNext = useCallback(async () => {
    setError(null)

    // Save draft before proceeding
    const savedId = await saveDraft()
    if (!savedId) return

    if (currentStep < FORM_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }, [currentStep, saveDraft])

  // Navigate to previous step
  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  // Submit for review
  const handleSubmit = useCallback(async () => {
    setError(null)
    setIsSubmitting(true)

    try {
      // Save final draft
      const savedId = await saveDraft()
      if (!savedId) {
        setIsSubmitting(false)
        return
      }

      // Submit for review
      const result = submitForReview(savedId)
      if (!result.success) {
        if (result.validationResult && !result.validationResult.isValid) {
          const errorMessages = result.validationResult.errors.map(e => e.message).join(', ')
          setError(`Validation failed: ${errorMessages}`)
        } else {
          setError(result.error || 'Failed to submit for review')
        }
        setIsSubmitting(false)
        return
      }

      onSuccess(savedId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }, [saveDraft, onSuccess])

  // Step 1: Basic Info
  const renderBasicInfoStep = () => (
    <div className="space-y-6">
      {/* Template Name */}
      <div>
        <label htmlFor="template-name" className="block text-sm font-medium text-white mb-2">
          Template Name *
        </label>
        <input
          id="template-name"
          type="text"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="e.g., Smart Lead Scoring Pipeline"
          className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          required
        />
        <p className="mt-1 text-xs text-slate-500">Choose a clear, descriptive name</p>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="template-description" className="block text-sm font-medium text-white mb-2">
          Description *
        </label>
        <textarea
          id="template-description"
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Describe what this template does and who it's for..."
          rows={4}
          className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
          required
        />
        <p className="mt-1 text-xs text-slate-500">{formData.description.length}/500 characters</p>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Category *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {Object.entries(TemplateCategory).map(([key, value]) => (
            <button
              key={value}
              type="button"
              onClick={() => updateField('category', value as TemplateCategoryType)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm',
                formData.category === value
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
              )}
            >
              <span>{CATEGORY_ICONS[value] || '📦'}</span>
              <span>{key}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Icon Selection */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Icon
        </label>
        <div className="flex flex-wrap gap-2">
          {TEMPLATE_ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => updateField('icon', icon)}
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all',
                formData.icon === icon
                  ? 'bg-cyan-500/20 border-2 border-cyan-500'
                  : 'bg-slate-800 border border-slate-700 hover:border-slate-600'
              )}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="template-tags" className="block text-sm font-medium text-white mb-2">
          Tags (comma-separated)
        </label>
        <input
          id="template-tags"
          type="text"
          value={formData.tags.join(', ')}
          onChange={(e) => updateField('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
          placeholder="e.g., automation, sales, crm"
          className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
        />
      </div>
    </div>
  )

  // Step 2: Configuration
  const renderConfigurationStep = () => (
    <div className="space-y-6">
      {/* Integrations */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Integrations
        </label>
        <p className="text-xs text-slate-500 mb-3">Select the integrations your template uses</p>
        <div className="flex flex-wrap gap-2">
          {COMMON_INTEGRATIONS.map((integration) => (
            <button
              key={integration}
              type="button"
              onClick={() => toggleIntegration(integration)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm transition-all',
                formData.integrations.includes(integration)
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
              )}
            >
              {integration}
              {formData.integrations.includes(integration) && (
                <span className="ml-1.5">x</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* AI Agents */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          AI Agents
        </label>
        <p className="text-xs text-slate-500 mb-3">Select the AI agents involved in your workflow</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {AVAILABLE_AGENTS.map((agent) => (
            <button
              key={agent.id}
              type="button"
              onClick={() => toggleAgent(agent.id)}
              className={cn(
                'flex items-center gap-2 p-3 rounded-lg border transition-all',
                formData.agents.includes(agent.id)
                  ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
              )}
            >
              <span className="text-xl">{agent.icon}</span>
              <span className="font-medium">{agent.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Steps Count */}
      <div>
        <label htmlFor="steps-count" className="block text-sm font-medium text-white mb-2">
          Number of Steps
        </label>
        <input
          id="steps-count"
          type="number"
          min={1}
          max={20}
          value={formData.steps}
          onChange={(e) => updateField('steps', parseInt(e.target.value, 10) || 1)}
          className="w-24 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Estimated Time Saved */}
      <div>
        <label htmlFor="time-saved" className="block text-sm font-medium text-white mb-2">
          Estimated Time Saved
        </label>
        <input
          id="time-saved"
          type="text"
          value={formData.estimatedTimeSaved}
          onChange={(e) => updateField('estimatedTimeSaved', e.target.value)}
          placeholder="e.g., 8 hours/week"
          className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Success Rate */}
      <div>
        <label htmlFor="success-rate" className="block text-sm font-medium text-white mb-2">
          Estimated Success Rate: {formData.estimatedSuccessRate}%
        </label>
        <input
          id="success-rate"
          type="range"
          min={50}
          max={100}
          value={formData.estimatedSuccessRate}
          onChange={(e) => updateField('estimatedSuccessRate', parseInt(e.target.value, 10))}
          className="w-full accent-cyan-500"
        />
      </div>
    </div>
  )

  // Step 3: Pricing
  const renderPricingStep = () => (
    <div className="space-y-6">
      {/* Pricing Model */}
      <div>
        <label className="block text-sm font-medium text-white mb-3">
          Pricing Model
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { value: PricingModel.Free, label: 'Free', icon: '🎁', desc: 'Share with the community' },
            { value: PricingModel.OneTime, label: 'One-Time', icon: '💵', desc: 'Single purchase' },
            { value: PricingModel.Subscription, label: 'Subscription', icon: '🔄', desc: 'Recurring payment' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updatePricing({ model: option.value })}
              className={cn(
                'flex flex-col items-center p-4 rounded-xl border-2 transition-all',
                formData.pricing.model === option.value
                  ? 'bg-cyan-500/10 border-cyan-500 text-white'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
              )}
            >
              <span className="text-3xl mb-2">{option.icon}</span>
              <span className="font-semibold">{option.label}</span>
              <span className="text-xs opacity-70 text-center">{option.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Input (for paid models) */}
      {formData.pricing.model !== PricingModel.Free && (
        <div className="space-y-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-white mb-2">
              Price (USD) *
            </label>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">$</span>
              <input
                id="price"
                type="number"
                min={0}
                step={0.01}
                value={formData.pricing.price || ''}
                onChange={(e) => updatePricing({ price: parseFloat(e.target.value) || 0 })}
                placeholder="29.99"
                className="w-32 px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              />
              <span className="text-slate-400">USD</span>
            </div>
          </div>

          {formData.pricing.model === PricingModel.Subscription && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Billing Period
              </label>
              <div className="flex gap-4">
                {['monthly', 'yearly'].map((period) => (
                  <label key={period} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="billing-period"
                      value={period}
                      checked={formData.pricing.subscriptionPeriod === period}
                      onChange={() => updatePricing({ subscriptionPeriod: period as 'monthly' | 'yearly' })}
                      className="text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="capitalize text-slate-300">{period}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pricing Tips */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <h4 className="font-medium text-amber-400 mb-2">Pricing Tips</h4>
        <ul className="text-sm text-slate-400 space-y-1">
          <li>- Free templates get 3x more visibility in search</li>
          <li>- Most successful paid templates are priced $19-$49</li>
          <li>- Consider offering a free version with limited features</li>
        </ul>
      </div>
    </div>
  )

  // Step 4: Publishing Options
  const renderPublishingStep = () => (
    <div className="space-y-6">
      {/* Visibility */}
      <div>
        <label className="block text-sm font-medium text-white mb-3">
          Visibility
        </label>
        <div className="space-y-2">
          {[
            { value: 'public', label: 'Public', desc: 'Visible to everyone in the marketplace' },
            { value: 'unlisted', label: 'Unlisted', desc: 'Only accessible via direct link' },
            { value: 'private', label: 'Private', desc: 'Only visible to you' },
          ].map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                formData.publishingOptions.visibility === option.value
                  ? 'bg-cyan-500/10 border-cyan-500'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
              )}
            >
              <input
                type="radio"
                name="visibility"
                value={option.value}
                checked={formData.publishingOptions.visibility === option.value}
                onChange={() => updatePublishingOptions({ visibility: option.value as 'public' | 'private' | 'unlisted' })}
                className="mt-1 text-cyan-500 focus:ring-cyan-500"
              />
              <div>
                <span className="font-medium text-white">{option.label}</span>
                <p className="text-xs text-slate-500">{option.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <label className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700 cursor-pointer">
          <div>
            <span className="font-medium text-white">Allow Cloning</span>
            <p className="text-xs text-slate-500">Let users clone and modify this template</p>
          </div>
          <input
            type="checkbox"
            checked={formData.publishingOptions.allowCloning}
            onChange={(e) => updatePublishingOptions({ allowCloning: e.target.checked })}
            className="h-5 w-5 rounded text-cyan-500 focus:ring-cyan-500"
          />
        </label>

        <label className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700 cursor-pointer">
          <div>
            <span className="font-medium text-white">Show Author</span>
            <p className="text-xs text-slate-500">Display your name as the creator</p>
          </div>
          <input
            type="checkbox"
            checked={formData.publishingOptions.showAuthor}
            onChange={(e) => updatePublishingOptions({ showAuthor: e.target.checked })}
            className="h-5 w-5 rounded text-cyan-500 focus:ring-cyan-500"
          />
        </label>

        <label className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700 cursor-pointer">
          <div>
            <span className="font-medium text-white">Enable Ratings</span>
            <p className="text-xs text-slate-500">Allow users to rate your template</p>
          </div>
          <input
            type="checkbox"
            checked={formData.publishingOptions.enableRatings}
            onChange={(e) => updatePublishingOptions({ enableRatings: e.target.checked })}
            className="h-5 w-5 rounded text-cyan-500 focus:ring-cyan-500"
          />
        </label>

        <label className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700 cursor-pointer">
          <div>
            <span className="font-medium text-white">Enable Comments</span>
            <p className="text-xs text-slate-500">Allow users to leave comments</p>
          </div>
          <input
            type="checkbox"
            checked={formData.publishingOptions.enableComments}
            onChange={(e) => updatePublishingOptions({ enableComments: e.target.checked })}
            className="h-5 w-5 rounded text-cyan-500 focus:ring-cyan-500"
          />
        </label>

        <label className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 cursor-pointer">
          <div>
            <span className="font-medium text-purple-400">Request Featured Status</span>
            <p className="text-xs text-slate-500">Apply for featured placement (requires review)</p>
          </div>
          <input
            type="checkbox"
            checked={formData.publishingOptions.featuredRequest}
            onChange={(e) => updatePublishingOptions({ featuredRequest: e.target.checked })}
            className="h-5 w-5 rounded text-purple-500 focus:ring-purple-500"
          />
        </label>
      </div>
    </div>
  )

  // Step 5: Preview
  const renderPreviewStep = () => (
    <div className="space-y-6">
      {/* Template Preview Card */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-2xl">
                {formData.icon}
              </div>
              <div>
                <h3 className="font-semibold text-white">{formData.name || 'Untitled Template'}</h3>
                <span className="text-xs text-cyan-400 capitalize">{formData.category}</span>
              </div>
            </div>
            {formData.pricing.model !== PricingModel.Free && (
              <span className="px-2 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 text-xs font-medium border border-amber-500/30">
                ${formData.pricing.price || 0}
              </span>
            )}
          </div>

          <p className="text-sm text-slate-400 mb-4 line-clamp-2">
            {formData.description || 'No description provided'}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-2 rounded-lg bg-slate-900/50">
              <div className="text-sm font-semibold text-cyan-400">{formData.estimatedTimeSaved || 'N/A'}</div>
              <div className="text-xs text-slate-500">Saved</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-slate-900/50">
              <div className="text-sm font-semibold text-emerald-400">{formData.estimatedSuccessRate}%</div>
              <div className="text-xs text-slate-500">Success</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-slate-900/50">
              <div className="text-sm font-semibold text-purple-400">{formData.steps}</div>
              <div className="text-xs text-slate-500">Steps</div>
            </div>
          </div>

          {/* Integrations */}
          {formData.integrations.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {formData.integrations.slice(0, 4).map(integration => (
                <span key={integration} className="px-2 py-1 rounded bg-slate-700/50 text-xs text-slate-400">
                  {integration}
                </span>
              ))}
              {formData.integrations.length > 4 && (
                <span className="px-2 py-1 rounded bg-slate-700/50 text-xs text-slate-400">
                  +{formData.integrations.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Agents */}
          {formData.agents.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Agents:</span>
              <span className="text-slate-300">{formData.agents.join(', ')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
        <h4 className="font-medium text-white mb-3">Submission Summary</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-slate-500">Category:</span>
            <span className="text-white ml-2 capitalize">{formData.category}</span>
          </div>
          <div>
            <span className="text-slate-500">Pricing:</span>
            <span className="text-white ml-2">
              {formData.pricing.model === PricingModel.Free
                ? 'Free'
                : `$${formData.pricing.price} ${formData.pricing.model === PricingModel.Subscription ? `/${formData.pricing.subscriptionPeriod}` : ''}`}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Visibility:</span>
            <span className="text-white ml-2 capitalize">{formData.publishingOptions.visibility}</span>
          </div>
          <div>
            <span className="text-slate-500">Featured Request:</span>
            <span className="text-white ml-2">{formData.publishingOptions.featuredRequest ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </div>

      {/* Submit Notice */}
      <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
        <p className="text-sm text-slate-300">
          By submitting, your template will be reviewed by our team. This typically takes 1-2 business days.
          You will be notified once the review is complete.
        </p>
      </div>
    </div>
  )

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInfoStep()
      case 1:
        return renderConfigurationStep()
      case 2:
        return renderPricingStep()
      case 3:
        return renderPublishingStep()
      case 4:
        return renderPreviewStep()
      default:
        return null
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Submit Template</h1>
        <p className="text-slate-400">Share your workflow with the community</p>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {FORM_STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                type="button"
                onClick={() => index < currentStep && setCurrentStep(index)}
                disabled={index > currentStep}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                  index === currentStep && 'bg-cyan-500/20 text-cyan-400',
                  index < currentStep && 'bg-emerald-500/20 text-emerald-400 cursor-pointer hover:bg-emerald-500/30',
                  index > currentStep && 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
                )}
              >
                <span className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                  index === currentStep && 'bg-cyan-500/30',
                  index < currentStep && 'bg-emerald-500/30',
                  index > currentStep && 'bg-slate-700'
                )}>
                  {index < currentStep ? '✓' : index + 1}
                </span>
                <span className="hidden sm:inline">{step.title}</span>
              </button>
              {index < FORM_STEPS.length - 1 && (
                <div className={cn(
                  'w-8 h-0.5 mx-2',
                  index < currentStep ? 'bg-emerald-500' : 'bg-slate-700'
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
          {error}
        </div>
      )}

      {/* Step Content */}
      <div className="mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-700">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          <Button
            variant="ghost"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={saveDraft}
          >
            Save Draft
          </Button>
          {currentStep < FORM_STEPS.length - 1 ? (
            <Button onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              loading={isSubmitting}
              className="bg-gradient-to-r from-cyan-500 to-purple-500"
            >
              Submit for Review
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
