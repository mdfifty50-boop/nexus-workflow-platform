/**
 * useOnboarding Hook
 *
 * Manages the onboarding flow state, including:
 * - Current step tracking
 * - User selections (business type, connected apps, workflow description)
 * - Persistence to localStorage and user profile
 * - Navigation between steps
 *
 * The onboarding flow has 4 steps:
 * 1. Welcome - Select business type (E-commerce, CRM, Support, Custom)
 * 2. Connect App - Connect first relevant app via OAuth
 * 3. First Workflow - Describe and preview workflow
 * 4. Success - Test run and celebration
 */

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export type BusinessType = 'ecommerce' | 'crm' | 'support' | 'custom'

export type OnboardingStep = 'welcome' | 'connect' | 'workflow' | 'success'

export interface OnboardingState {
  currentStep: OnboardingStep
  businessType: BusinessType | null
  connectedApps: string[]
  workflowDescription: string
  workflowName: string
  isCompleted: boolean
  skippedConnect: boolean
  startedAt: number | null
}

export interface WorkflowPreview {
  id: string
  name: string
  description: string
  trigger: string
  actions: Array<{
    app: string
    action: string
    description: string
  }>
}

const STORAGE_KEY = 'nexus_onboarding'

const defaultState: OnboardingState = {
  currentStep: 'welcome',
  businessType: null,
  connectedApps: [],
  workflowDescription: '',
  workflowName: '',
  isCompleted: false,
  skippedConnect: false,
  startedAt: null,
}

// Step order for navigation
const stepOrder: OnboardingStep[] = ['welcome', 'connect', 'workflow', 'success']

// Recommended apps per business type
export const recommendedApps: Record<BusinessType, string[]> = {
  ecommerce: ['shopify', 'woocommerce', 'stripe', 'gmail', 'slack'],
  crm: ['salesforce', 'hubspot', 'gmail', 'slack', 'sheets'],
  support: ['zendesk', 'intercom', 'slack', 'gmail', 'notion'],
  custom: ['gmail', 'slack', 'sheets', 'notion', 'trello'],
}

// Template workflows per business type
export const templateWorkflows: Record<BusinessType, WorkflowPreview> = {
  ecommerce: {
    id: 'ecommerce-order-notify',
    name: 'Order Notification',
    description: 'Notify team when new orders arrive',
    trigger: 'New order received',
    actions: [
      { app: 'shopify', action: 'Get order details', description: 'Fetch order information' },
      { app: 'slack', action: 'Send message', description: 'Notify sales channel' },
      { app: 'gmail', action: 'Send email', description: 'Send confirmation to customer' },
    ],
  },
  crm: {
    id: 'crm-lead-followup',
    name: 'Lead Follow-up',
    description: 'Automatically follow up with new leads',
    trigger: 'New lead created',
    actions: [
      { app: 'salesforce', action: 'Get lead info', description: 'Retrieve lead details' },
      { app: 'gmail', action: 'Send email', description: 'Send welcome email' },
      { app: 'slack', action: 'Notify team', description: 'Alert sales team' },
    ],
  },
  support: {
    id: 'support-ticket-triage',
    name: 'Ticket Auto-Triage',
    description: 'Automatically categorize and route support tickets',
    trigger: 'New support ticket',
    actions: [
      { app: 'zendesk', action: 'Get ticket', description: 'Fetch ticket details' },
      { app: 'ai', action: 'Analyze sentiment', description: 'Determine urgency' },
      { app: 'slack', action: 'Route to team', description: 'Notify appropriate team' },
    ],
  },
  custom: {
    id: 'custom-email-notify',
    name: 'Email Notification',
    description: 'Get notified about important emails',
    trigger: 'New email received',
    actions: [
      { app: 'gmail', action: 'Filter email', description: 'Check if matches criteria' },
      { app: 'slack', action: 'Send notification', description: 'Notify in Slack' },
      { app: 'sheets', action: 'Log entry', description: 'Add to tracking sheet' },
    ],
  },
}

export function useOnboarding() {
  const { userProfile, updateProfile } = useAuth()
  const [state, setState] = useState<OnboardingState>(() => {
    // Try to restore from localStorage
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        return JSON.parse(saved) as OnboardingState
      } catch {
        // Invalid data, use default
      }
    }
    return defaultState
  })

  // Track time spent in onboarding
  const [timeElapsed, setTimeElapsed] = useState(0)

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  // Start timer when onboarding begins
  useEffect(() => {
    if (state.startedAt && !state.isCompleted) {
      const interval = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - state.startedAt!) / 1000))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [state.startedAt, state.isCompleted])

  // Initialize start time when entering onboarding
  const startOnboarding = useCallback(() => {
    if (!state.startedAt) {
      setState(prev => ({ ...prev, startedAt: Date.now() }))
    }
  }, [state.startedAt])

  // Select business type
  const selectBusinessType = useCallback((type: BusinessType) => {
    setState(prev => ({
      ...prev,
      businessType: type,
    }))
  }, [])

  // Add connected app
  const addConnectedApp = useCallback((appId: string) => {
    setState(prev => ({
      ...prev,
      connectedApps: [...prev.connectedApps, appId],
    }))
  }, [])

  // Remove connected app
  const removeConnectedApp = useCallback((appId: string) => {
    setState(prev => ({
      ...prev,
      connectedApps: prev.connectedApps.filter(id => id !== appId),
    }))
  }, [])

  // Set workflow description
  const setWorkflowDescription = useCallback((description: string) => {
    setState(prev => ({
      ...prev,
      workflowDescription: description,
    }))
  }, [])

  // Set workflow name
  const setWorkflowName = useCallback((name: string) => {
    setState(prev => ({
      ...prev,
      workflowName: name,
    }))
  }, [])

  // Skip connect step
  const skipConnect = useCallback(() => {
    setState(prev => ({
      ...prev,
      skippedConnect: true,
    }))
  }, [])

  // Navigate to next step
  const nextStep = useCallback(() => {
    const currentIndex = stepOrder.indexOf(state.currentStep)
    if (currentIndex < stepOrder.length - 1) {
      setState(prev => ({
        ...prev,
        currentStep: stepOrder[currentIndex + 1],
      }))
    }
  }, [state.currentStep])

  // Navigate to previous step
  const prevStep = useCallback(() => {
    const currentIndex = stepOrder.indexOf(state.currentStep)
    if (currentIndex > 0) {
      setState(prev => ({
        ...prev,
        currentStep: stepOrder[currentIndex - 1],
      }))
    }
  }, [state.currentStep])

  // Go to specific step
  const goToStep = useCallback((step: OnboardingStep) => {
    setState(prev => ({
      ...prev,
      currentStep: step,
    }))
  }, [])

  // Complete onboarding
  const completeOnboarding = useCallback(async () => {
    const completedState = {
      ...state,
      isCompleted: true,
    }
    setState(completedState)

    // Also save to user profile if available
    if (userProfile && updateProfile) {
      try {
        await updateProfile({
          preferences: {
            ...userProfile.preferences,
            onboardingCompleted: true,
            businessType: state.businessType,
            onboardingCompletedAt: new Date().toISOString(),
            onboardingDuration: timeElapsed,
          },
        })
      } catch (error) {
        console.error('Failed to save onboarding status to profile:', error)
      }
    }

    // Clear localStorage after completion
    localStorage.removeItem(STORAGE_KEY)
  }, [state, userProfile, updateProfile, timeElapsed])

  // Reset onboarding (for testing or restarting)
  const resetOnboarding = useCallback(() => {
    setState(defaultState)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // Get current step index (1-based for display)
  const currentStepIndex = stepOrder.indexOf(state.currentStep) + 1
  const totalSteps = stepOrder.length

  // Check if we can proceed to next step
  const canProceed = useCallback(() => {
    switch (state.currentStep) {
      case 'welcome':
        return state.businessType !== null
      case 'connect':
        return state.connectedApps.length > 0 || state.skippedConnect
      case 'workflow':
        return state.workflowDescription.trim().length > 0
      case 'success':
        return true
      default:
        return false
    }
  }, [state])

  // Get recommended apps for current business type
  const getRecommendedApps = useCallback(() => {
    if (!state.businessType) return recommendedApps.custom
    return recommendedApps[state.businessType]
  }, [state.businessType])

  // Get template workflow for current business type
  const getTemplateWorkflow = useCallback(() => {
    if (!state.businessType) return templateWorkflows.custom
    return templateWorkflows[state.businessType]
  }, [state.businessType])

  // Format time elapsed as MM:SS
  const formattedTime = `${Math.floor(timeElapsed / 60)}:${(timeElapsed % 60).toString().padStart(2, '0')}`

  return {
    // State
    ...state,
    timeElapsed,
    formattedTime,
    currentStepIndex,
    totalSteps,

    // Navigation
    nextStep,
    prevStep,
    goToStep,
    canProceed,

    // Actions
    startOnboarding,
    selectBusinessType,
    addConnectedApp,
    removeConnectedApp,
    setWorkflowDescription,
    setWorkflowName,
    skipConnect,
    completeOnboarding,
    resetOnboarding,

    // Helpers
    getRecommendedApps,
    getTemplateWorkflow,
  }
}
