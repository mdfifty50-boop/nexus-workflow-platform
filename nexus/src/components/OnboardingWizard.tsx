import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Button } from './ui/button'
import { ProfessionalAvatar } from './ProfessionalAvatar'
import {
  usePersonalization,
  PERSONA_DEFINITIONS,
  PERSONA_CATEGORIES,
  type PersonaType,
} from '@/contexts/PersonalizationContext'
import { useAuth } from '@/contexts/AuthContext'
import { useAutoOAuth } from '@/hooks/useAutoOAuth'

// ============================================================================
// DYNAMIC GOAL OPTIONS BY PERSONA
// ============================================================================

interface GoalOption {
  id: string
  label: string
  description: string
  icon: string
  templates: string[]
}

// Universal goals that work for everyone
const UNIVERSAL_GOALS: GoalOption[] = [
  {
    id: 'time-saving',
    label: 'Save Time on Repetitive Tasks',
    description: 'Automate the boring stuff so you can focus on what matters',
    icon: '⏰',
    templates: ['task-automation', 'batch-processing', 'auto-reminders'],
  },
  {
    id: 'communication',
    label: 'Streamline Communication',
    description: 'Email management, responses, and follow-ups',
    icon: '💬',
    templates: ['email-automation', 'auto-responses', 'follow-up-sequences'],
  },
  {
    id: 'organization',
    label: 'Stay Organized',
    description: 'Keep files, tasks, and schedules in sync automatically',
    icon: '📋',
    templates: ['file-organization', 'calendar-sync', 'task-management'],
  },
]

// Role-specific goals organized by persona category
const ROLE_SPECIFIC_GOALS: Record<string, GoalOption[]> = {
  // Tech & Business
  developer: [
    { id: 'ci-cd', label: 'CI/CD & DevOps', description: 'Automate deployments, testing, and code reviews', icon: '🔧', templates: ['github-actions', 'deploy-pipeline', 'pr-review'] },
    { id: 'monitoring', label: 'Monitoring & Alerts', description: 'Track errors, performance, and uptime', icon: '📊', templates: ['error-tracking', 'uptime-alerts', 'performance-reports'] },
  ],
  founder: [
    { id: 'investor-updates', label: 'Investor Updates', description: 'Automate reporting and communications', icon: '📈', templates: ['investor-reports', 'metrics-dashboard', 'board-updates'] },
    { id: 'team-ops', label: 'Team Operations', description: 'Hiring, onboarding, and team coordination', icon: '👥', templates: ['hiring-pipeline', 'onboarding-flows', 'team-sync'] },
  ],
  executive: [
    { id: 'executive-reporting', label: 'Executive Reporting', description: 'Automated dashboards and KPI tracking', icon: '📊', templates: ['executive-dashboard', 'kpi-reports', 'board-prep'] },
    { id: 'schedule-management', label: 'Schedule Management', description: 'Meeting prep, travel, and calendar optimization', icon: '📅', templates: ['calendar-optimization', 'meeting-prep', 'travel-coordination'] },
  ],
  manager: [
    { id: 'team-tracking', label: 'Team Progress Tracking', description: 'Status updates, blockers, and resource allocation', icon: '📋', templates: ['status-reports', 'blocker-alerts', 'resource-planning'] },
    { id: 'performance', label: 'Performance Reviews', description: 'Feedback collection and review preparation', icon: '⭐', templates: ['feedback-collection', 'review-prep', '1on1-notes'] },
  ],
  consultant: [
    { id: 'client-deliverables', label: 'Client Deliverables', description: 'Report generation and presentation creation', icon: '📑', templates: ['report-generation', 'presentation-builder', 'data-visualization'] },
    { id: 'billing', label: 'Time & Billing', description: 'Track time, generate invoices, follow up on payments', icon: '💰', templates: ['time-tracking', 'invoice-generation', 'payment-reminders'] },
  ],
  // Healthcare
  doctor: [
    { id: 'patient-follow-up', label: 'Patient Follow-ups', description: 'Automated check-ins and appointment reminders', icon: '🩺', templates: ['patient-reminders', 'follow-up-calls', 'care-coordination'] },
    { id: 'documentation', label: 'Documentation & Notes', description: 'Streamline clinical documentation', icon: '📝', templates: ['note-templates', 'referral-letters', 'chart-summaries'] },
  ],
  nurse: [
    { id: 'shift-coordination', label: 'Shift Coordination', description: 'Handoff notes and schedule management', icon: '⏰', templates: ['shift-handoff', 'schedule-alerts', 'care-notes'] },
    { id: 'patient-education', label: 'Patient Education', description: 'Automated care instructions and resources', icon: '📚', templates: ['education-materials', 'discharge-instructions', 'medication-guides'] },
  ],
  therapist: [
    { id: 'session-notes', label: 'Session Documentation', description: 'Progress notes and treatment plans', icon: '📝', templates: ['session-notes', 'treatment-plans', 'progress-tracking'] },
    { id: 'client-scheduling', label: 'Client Scheduling', description: 'Appointment reminders and rescheduling', icon: '📅', templates: ['appointment-reminders', 'waitlist-management', 'cancellation-handling'] },
  ],
  // Legal & Finance
  lawyer: [
    { id: 'case-management', label: 'Case Management', description: 'Deadlines, filings, and document tracking', icon: '⚖️', templates: ['deadline-tracking', 'filing-reminders', 'document-management'] },
    { id: 'client-intake', label: 'Client Intake', description: 'Forms, conflict checks, and onboarding', icon: '📋', templates: ['intake-forms', 'conflict-checks', 'client-onboarding'] },
  ],
  paralegal: [
    { id: 'research', label: 'Legal Research', description: 'Case law searches and citation management', icon: '🔍', templates: ['research-compilation', 'citation-formatting', 'case-summaries'] },
    { id: 'filing', label: 'Filing & Deadlines', description: 'Court filing tracking and deadline alerts', icon: '📁', templates: ['filing-tracker', 'deadline-alerts', 'document-prep'] },
  ],
  accountant: [
    { id: 'bookkeeping', label: 'Bookkeeping', description: 'Transaction categorization and reconciliation', icon: '📊', templates: ['transaction-categorization', 'reconciliation', 'bank-feeds'] },
    { id: 'tax-prep', label: 'Tax Preparation', description: 'Document collection and return preparation', icon: '📑', templates: ['document-collection', 'return-prep', 'deadline-tracking'] },
  ],
  financial_advisor: [
    { id: 'portfolio-reports', label: 'Portfolio Reports', description: 'Automated performance reports for clients', icon: '📈', templates: ['portfolio-reports', 'market-updates', 'rebalancing-alerts'] },
    { id: 'client-onboarding', label: 'Client Onboarding', description: 'Account setup and document collection', icon: '📋', templates: ['onboarding-forms', 'risk-assessment', 'document-collection'] },
  ],
  banker: [
    { id: 'loan-processing', label: 'Loan Processing', description: 'Application tracking and document collection', icon: '🏦', templates: ['application-tracking', 'document-requests', 'status-updates'] },
    { id: 'compliance', label: 'Compliance', description: 'Regulatory checks and reporting', icon: '✅', templates: ['compliance-checks', 'reporting', 'audit-prep'] },
  ],
  // Sales & Service
  sales: [
    { id: 'lead-management', label: 'Lead Management', description: 'Lead scoring, routing, and follow-ups', icon: '🎯', templates: ['lead-scoring', 'lead-routing', 'follow-up-sequences'] },
    { id: 'crm', label: 'CRM Automation', description: 'Keep your CRM updated automatically', icon: '💼', templates: ['crm-updates', 'activity-logging', 'deal-tracking'] },
  ],
  recruiter: [
    { id: 'candidate-pipeline', label: 'Candidate Pipeline', description: 'Sourcing, screening, and scheduling', icon: '👥', templates: ['candidate-sourcing', 'resume-screening', 'interview-scheduling'] },
    { id: 'hiring-comms', label: 'Hiring Communications', description: 'Candidate updates and offer letters', icon: '✉️', templates: ['status-updates', 'rejection-emails', 'offer-letters'] },
  ],
  realtor: [
    { id: 'listing-management', label: 'Listing Management', description: 'Property updates across platforms', icon: '🏠', templates: ['listing-syndication', 'price-updates', 'property-alerts'] },
    { id: 'client-nurture', label: 'Client Nurturing', description: 'Market updates and drip campaigns', icon: '💬', templates: ['market-updates', 'buyer-drip', 'seller-drip'] },
  ],
  property_manager: [
    { id: 'maintenance', label: 'Maintenance Requests', description: 'Work order tracking and vendor coordination', icon: '🔧', templates: ['work-order-tracking', 'vendor-dispatch', 'tenant-updates'] },
    { id: 'rent-collection', label: 'Rent Collection', description: 'Payment reminders and late notices', icon: '💰', templates: ['payment-reminders', 'late-notices', 'payment-tracking'] },
  ],
  // Creative
  creator: [
    { id: 'content-calendar', label: 'Content Calendar', description: 'Plan and schedule content across platforms', icon: '📅', templates: ['content-planning', 'social-scheduling', 'cross-posting'] },
    { id: 'engagement', label: 'Audience Engagement', description: 'Comment responses and community management', icon: '💬', templates: ['comment-management', 'dm-responses', 'community-updates'] },
  ],
  designer: [
    { id: 'project-management', label: 'Project Management', description: 'Client feedback and revision tracking', icon: '🎨', templates: ['feedback-collection', 'revision-tracking', 'delivery-automation'] },
    { id: 'asset-management', label: 'Asset Management', description: 'File organization and version control', icon: '📁', templates: ['file-organization', 'version-tracking', 'asset-delivery'] },
  ],
  photographer: [
    { id: 'booking-management', label: 'Booking Management', description: 'Inquiries, contracts, and scheduling', icon: '📸', templates: ['inquiry-responses', 'contract-sending', 'shoot-reminders'] },
    { id: 'delivery', label: 'Photo Delivery', description: 'Gallery delivery and client follow-ups', icon: '📤', templates: ['gallery-delivery', 'album-reminders', 'review-requests'] },
  ],
  writer: [
    { id: 'research', label: 'Research & Fact-Checking', description: 'Source gathering and verification', icon: '🔍', templates: ['source-collection', 'fact-checking', 'reference-management'] },
    { id: 'publishing', label: 'Publishing Workflow', description: 'Submissions, revisions, and promotion', icon: '📰', templates: ['submission-tracking', 'revision-management', 'promotion-scheduling'] },
  ],
  // Education
  teacher: [
    { id: 'grading', label: 'Grading & Feedback', description: 'Automated grading assistance and feedback', icon: '📝', templates: ['grade-tracking', 'feedback-templates', 'report-cards'] },
    { id: 'parent-communication', label: 'Parent Communication', description: 'Updates, newsletters, and conferences', icon: '👨‍👩‍👧', templates: ['progress-updates', 'newsletters', 'conference-scheduling'] },
  ],
  professor: [
    { id: 'course-management', label: 'Course Management', description: 'Syllabus updates and assignment tracking', icon: '📚', templates: ['syllabus-management', 'assignment-reminders', 'grade-posting'] },
    { id: 'research-admin', label: 'Research Admin', description: 'Grant tracking and publication management', icon: '🔬', templates: ['grant-tracking', 'publication-tracking', 'collaboration-management'] },
  ],
  student: [
    { id: 'study-planning', label: 'Study Planning', description: 'Assignment tracking and study schedules', icon: '📖', templates: ['assignment-tracker', 'study-scheduler', 'deadline-reminders'] },
    { id: 'note-organization', label: 'Note Organization', description: 'Notes, flashcards, and study materials', icon: '📝', templates: ['note-organization', 'flashcard-creation', 'study-guide-generation'] },
  ],
  // Other professionals
  engineer: [
    { id: 'project-tracking', label: 'Project Tracking', description: 'Milestones, specs, and documentation', icon: '⚙️', templates: ['milestone-tracking', 'spec-management', 'documentation'] },
    { id: 'calculations', label: 'Calculations & Reports', description: 'Automated calculations and technical reports', icon: '📐', templates: ['calculation-templates', 'report-generation', 'quality-checks'] },
  ],
  scientist: [
    { id: 'experiment-tracking', label: 'Experiment Tracking', description: 'Protocol management and data logging', icon: '🧪', templates: ['protocol-management', 'data-logging', 'result-tracking'] },
    { id: 'literature', label: 'Literature Management', description: 'Paper tracking and citation management', icon: '📚', templates: ['paper-tracking', 'citation-management', 'reading-lists'] },
  ],
  chef: [
    { id: 'inventory', label: 'Inventory Management', description: 'Stock tracking and ordering', icon: '📦', templates: ['stock-tracking', 'order-automation', 'waste-tracking'] },
    { id: 'menu-planning', label: 'Menu Planning', description: 'Recipe costing and menu updates', icon: '🍽️', templates: ['recipe-costing', 'menu-updates', 'special-planning'] },
  ],
  fitness: [
    { id: 'client-programs', label: 'Client Programs', description: 'Workout plans and progress tracking', icon: '💪', templates: ['program-delivery', 'progress-tracking', 'check-in-reminders'] },
    { id: 'class-management', label: 'Class Management', description: 'Scheduling, bookings, and waitlists', icon: '📅', templates: ['class-scheduling', 'booking-management', 'waitlist-handling'] },
  ],
  ecommerce: [
    { id: 'order-management', label: 'Order Management', description: 'Order processing and fulfillment', icon: '📦', templates: ['order-processing', 'fulfillment-tracking', 'shipping-updates'] },
    { id: 'customer-service', label: 'Customer Service', description: 'Support tickets and review management', icon: '💬', templates: ['support-automation', 'review-responses', 'refund-processing'] },
  ],
  marketer: [
    { id: 'campaigns', label: 'Campaign Management', description: 'Multi-channel campaign automation', icon: '📢', templates: ['campaign-scheduling', 'a-b-testing', 'performance-tracking'] },
    { id: 'analytics', label: 'Analytics & Reporting', description: 'Automated reporting and insights', icon: '📊', templates: ['report-generation', 'dashboard-updates', 'competitor-tracking'] },
  ],
  freelancer: [
    { id: 'client-management', label: 'Client Management', description: 'Proposals, contracts, and invoicing', icon: '💼', templates: ['proposal-templates', 'contract-sending', 'invoice-automation'] },
    { id: 'project-delivery', label: 'Project Delivery', description: 'Milestone tracking and deliverables', icon: '📤', templates: ['milestone-tracking', 'deliverable-reminders', 'feedback-collection'] },
  ],
}

// Function to get goals based on selected persona
function getGoalsForPersona(persona: PersonaType | null): GoalOption[] {
  if (!persona || persona === 'general' || persona === 'custom') {
    return UNIVERSAL_GOALS
  }

  const roleGoals = ROLE_SPECIFIC_GOALS[persona] || []
  // Combine role-specific goals with universal goals
  return [...roleGoals, ...UNIVERSAL_GOALS]
}

const INTEGRATIONS = [
  { id: 'gmail', name: 'Gmail', icon: '📧', connected: false },
  { id: 'salesforce', name: 'Salesforce', icon: '☁️', connected: false },
  { id: 'hubspot', name: 'HubSpot', icon: '🧡', connected: false },
  { id: 'slack', name: 'Slack', icon: '💬', connected: false },
  { id: 'calendar', name: 'Google Calendar', icon: '📅', connected: false },
  { id: 'zoom', name: 'Zoom', icon: '📹', connected: false },
]

interface OnboardingWizardProps {
  onComplete: () => void
  onSkip?: () => void
}

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const { setPersona, personaInfo, term, agentNames } = usePersonalization()
  const { userProfile, userId } = useAuth()

  // Auto-OAuth hook for seamless authentication
  const {
    suggestions: autoOAuthSuggestions,
    loading: _autoOAuthLoading,
    connectedServices,
    pendingServices,
    processAutoOAuth,
    initiateConnection,
  } = useAutoOAuth({
    autoFetch: true,
    autoInitiate: false, // We'll manually trigger on user action
  })
  void _autoOAuthLoading // Reserved for loading indicator UI

  // Check if user came from landing page with a workflow request
  const pendingWorkflow = localStorage.getItem('nexus_pending_workflow')
  const signupSource = localStorage.getItem('nexus_signup_source')
  const hasWorkflowRequest = Boolean(pendingWorkflow && signupSource === 'landing_workflow_input')

  const [currentStep, setCurrentStep] = useState(0)
  const [selectedPersona, setSelectedPersona] = useState<PersonaType | null>(null)
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)
  const [connectedIntegrations, setConnectedIntegrations] = useState<string[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [_timeSaved, setTimeSaved] = useState(0)
  void _timeSaved // Suppress unused variable warning - animated value for UI

  // Auto-OAuth state
  const [autoOAuthProcessed, setAutoOAuthProcessed] = useState(false)
  const [connectingService, setConnectingService] = useState<string | null>(null)

  // Custom persona state
  const [expandedCategory, setExpandedCategory] = useState<string | null>('tech')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customPersonaText, setCustomPersonaText] = useState('')
  const [customPersonaError, setCustomPersonaError] = useState<string | null>(null)
  const [customPersonaTouched, setCustomPersonaTouched] = useState(false)
  const customInputRef = useRef<HTMLInputElement>(null)

  // Custom goal state
  const [showCustomGoalInput, setShowCustomGoalInput] = useState(false)
  const [customGoalText, setCustomGoalText] = useState('')
  const [customGoalError, setCustomGoalError] = useState<string | null>(null)
  const [customGoalTouched, setCustomGoalTouched] = useState(false)
  const customGoalInputRef = useRef<HTMLInputElement>(null)

  // Get dynamic goals based on selected persona
  const dynamicGoals = useMemo(() => getGoalsForPersona(selectedPersona), [selectedPersona])

  // Note: auto-OAuth processing moved after currentStepId definition below

  // Handle auto-OAuth service connection
  const handleAutoOAuthConnect = useCallback(async (serviceId: string) => {
    setConnectingService(serviceId)
    try {
      const result = await initiateConnection(serviceId)
      if (result.authUrl) {
        // Open OAuth in popup or new tab
        window.open(result.authUrl, '_blank', 'width=600,height=700,popup=true')
      }
    } catch (error) {
      console.error('[Onboarding] Failed to initiate connection:', error)
    } finally {
      setConnectingService(null)
    }
  }, [initiateConnection])

  // Filter suggestions to show only high-confidence, unconnected services
  const relevantAutoOAuthSuggestions = useMemo(() => {
    return autoOAuthSuggestions.filter(s =>
      !s.isConnected &&
      s.confidence >= 0.7 &&
      s.supportsAutoConnect
    ).slice(0, 4) // Show max 4 suggestions
  }, [autoOAuthSuggestions])

  // Session 8: Accessibility - focus trap and modal ref
  const modalRef = useRef<HTMLDivElement>(null)

  // Focus trap for accessibility
  useEffect(() => {
    const modalElement = modalRef.current
    if (!modalElement) return

    const previouslyFocused = document.activeElement as HTMLElement

    // Focus modal on mount
    modalElement.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus trap
      if (e.key === 'Tab') {
        const focusableElements = modalElement.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [])

  // Simplified steps - if user has workflow, skip persona and goal selection
  const STEP_IDS = hasWorkflowRequest
    ? ['welcome', 'first-workflow'] // Only 2 steps for users with workflow
    : ['welcome', 'persona', 'goal', 'first-workflow'] // Removed integrations step (was fake)
  const currentStepId = STEP_IDS[currentStep]
  const progress = ((currentStep + 1) / STEP_IDS.length) * 100

  // Animate time saved counter on final step
  useEffect(() => {
    if (currentStepId === 'first-workflow') {
      const target = 2.5
      const duration = 2000
      const start = Date.now()

      const animate = () => {
        const elapsed = Date.now() - start
        const prog = Math.min(elapsed / duration, 1)
        setTimeSaved(target * prog)
        if (prog < 1) requestAnimationFrame(animate)
      }

      animate()
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
    }
  }, [currentStepId])

  // Process auto-OAuth when user profile is available and on first-workflow step
  useEffect(() => {
    if (
      userProfile?.email &&
      userId &&
      !autoOAuthProcessed &&
      currentStepId === 'first-workflow'
    ) {
      // Process auto-OAuth in the background
      processAutoOAuth(userProfile.email, {
        autoInitiate: false, // Don't auto-initiate, let user click
        role: selectedPersona || undefined,
      }).then(() => {
        setAutoOAuthProcessed(true)
      })
    }
  }, [userProfile?.email, userId, autoOAuthProcessed, currentStepId, selectedPersona, processAutoOAuth])

  const handleNext = () => {
    setIsAnimating(true)
    setTimeout(() => {
      if (currentStep < STEP_IDS.length - 1) {
        setCurrentStep(currentStep + 1)
      } else {
        localStorage.setItem('nexus_onboarding_complete', 'true')
        localStorage.setItem('nexus_user_goal', selectedGoal || 'general')
        localStorage.setItem('nexus_connected_integrations', JSON.stringify(connectedIntegrations))
        onComplete()
      }
      setIsAnimating(false)
    }, 300)
  }

  const handlePersonaSelect = (personaId: PersonaType, customLabel?: string) => {
    setSelectedPersona(personaId)
    setPersona(personaId, customLabel)
    setTimeout(handleNext, 500)
  }

  // Validate custom persona input
  const validateCustomPersona = (value: string): string | null => {
    const trimmed = value.trim()
    if (!trimmed) return 'Please enter your profession'
    if (trimmed.length < 2) return 'Please enter at least 2 characters'
    if (trimmed.length > 50) return 'Please keep it under 50 characters'
    return null
  }

  // Validate custom goal input
  const validateCustomGoal = (value: string): string | null => {
    const trimmed = value.trim()
    if (!trimmed) return 'Please describe what you want to automate'
    if (trimmed.length < 5) return 'Please provide more detail (at least 5 characters)'
    if (trimmed.length > 200) return 'Please keep it under 200 characters'
    return null
  }

  const handleCustomPersonaChange = (value: string) => {
    setCustomPersonaText(value)
    if (customPersonaTouched) {
      setCustomPersonaError(validateCustomPersona(value))
    }
  }

  const handleCustomPersonaBlur = () => {
    setCustomPersonaTouched(true)
    setCustomPersonaError(validateCustomPersona(customPersonaText))
  }

  const handleCustomPersonaSubmit = () => {
    const error = validateCustomPersona(customPersonaText)
    setCustomPersonaTouched(true)
    setCustomPersonaError(error)

    if (!error) {
      handlePersonaSelect('custom', customPersonaText.trim())
    }
  }

  // Focus custom input when shown
  useEffect(() => {
    if (showCustomInput && customInputRef.current) {
      customInputRef.current.focus()
    }
  }, [showCustomInput])

  // Focus custom goal input when shown
  useEffect(() => {
    if (showCustomGoalInput && customGoalInputRef.current) {
      customGoalInputRef.current.focus()
    }
  }, [showCustomGoalInput])

  const handleGoalSelect = (goalId: string) => {
    setSelectedGoal(goalId)
    setTimeout(handleNext, 500)
  }

  const handleCustomGoalChange = (value: string) => {
    setCustomGoalText(value)
    if (customGoalTouched) {
      setCustomGoalError(validateCustomGoal(value))
    }
  }

  const handleCustomGoalBlur = () => {
    setCustomGoalTouched(true)
    setCustomGoalError(validateCustomGoal(customGoalText))
  }

  const handleCustomGoalSubmit = () => {
    const error = validateCustomGoal(customGoalText)
    setCustomGoalTouched(true)
    setCustomGoalError(error)

    if (!error) {
      setSelectedGoal(`custom:${customGoalText.trim()}`)
      setTimeout(handleNext, 500)
    }
  }

  const handleIntegrationToggle = (integrationId: string) => {
    setConnectedIntegrations(prev =>
      prev.includes(integrationId)
        ? prev.filter(id => id !== integrationId)
        : [...prev, integrationId]
    )
  }

  const getStepInfo = () => {
    switch (currentStepId) {
      case 'welcome':
        return {
          title: hasWorkflowRequest ? 'Your Workflow is Ready!' : 'Welcome to Nexus',
          description: hasWorkflowRequest
            ? "Let's bring your automation to life"
            : "Let's get you automating in under 60 seconds",
          icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          ),
        }
      case 'persona':
        return {
          title: "What's your world like?",
          description: "Help us understand what you do so we can suggest the right automations",
          icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ),
        }
      case 'goal':
        return {
          title: selectedPersona && selectedPersona !== 'general' && selectedPersona !== 'custom'
            ? `What would help you most as ${PERSONA_DEFINITIONS[selectedPersona]?.label?.includes('a') ? 'a' : 'a'} ${PERSONA_DEFINITIONS[selectedPersona]?.label || 'professional'}?`
            : 'What would you like to automate first?',
          description: "Pick one to start - you can always add more later",
          icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        }
      case 'integrations':
        return {
          title: 'Connect your tools',
          description: 'One-click to connect your favorite apps',
          icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          ),
        }
      case 'first-workflow':
        return {
          title: `Your first ${term('workflow')} is ready!`,
          description: `Click to run your personalized ${term('workflow')}`,
          icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        }
      default:
        return { title: '', description: '', icon: null }
    }
  }

  const stepInfo = getStepInfo()

  const renderStepContent = () => {
    switch (currentStepId) {
      case 'welcome':
        return (
          <div className="text-center space-y-8">
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center animate-pulse">
                  <ProfessionalAvatar agentId="nexus" size={100} />
                </div>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-background">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-4">
                {hasWorkflowRequest ? 'Great Choice!' : "Hi! I'm Nexus"}
              </h2>
              {hasWorkflowRequest ? (
                <div className="space-y-4">
                  <p className="text-lg text-muted-foreground max-w-md mx-auto">
                    I've analyzed your workflow request:
                  </p>
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 max-w-md mx-auto">
                    <p className="text-primary font-medium italic">"{pendingWorkflow}"</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Click Continue to see how I'll build this for you.
                  </p>
                </div>
              ) : (
                <p className="text-lg text-muted-foreground max-w-md mx-auto">
                  Your AI team that <span className="text-primary font-semibold">executes</span> workflows,
                  not just suggests them. Let me show you.
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>8 AI Agents</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500" />
                <span>500+ Integrations</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span>Real Results</span>
              </div>
            </div>
          </div>
        )

      case 'persona':
        return (
          <div className="space-y-4">
            {/* Category tabs */}
            <div className="flex flex-wrap gap-2 justify-center">
              {PERSONA_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                  className={`
                    px-3 py-1.5 rounded-full text-sm font-medium transition-all
                    ${expandedCategory === category.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                    }
                  `}
                >
                  <span className="mr-1.5">{category.icon}</span>
                  {category.label}
                </button>
              ))}
            </div>

            {/* Personas for selected category */}
            <div className="max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
              {expandedCategory && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 animate-fadeIn">
                  {PERSONA_CATEGORIES.find(c => c.id === expandedCategory)?.personas.map((personaId) => {
                    const info = PERSONA_DEFINITIONS[personaId]
                    return (
                      <button
                        key={personaId}
                        onClick={() => handlePersonaSelect(personaId)}
                        className={`
                          p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 text-left transition-all hover:scale-[1.02] min-h-[60px] sm:min-h-[80px]
                          ${selectedPersona === personaId
                            ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                            : 'border-border hover:border-primary/50 bg-card'
                          }
                        `}
                      >
                        <div className="text-xl sm:text-2xl mb-1 sm:mb-2">{info.icon}</div>
                        <h3 className="font-bold text-xs sm:text-sm mb-0.5">{info.label}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 hidden sm:block">{info.description}</p>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Custom persona input */}
            <div className="border-t border-border pt-4">
              {!showCustomInput ? (
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors py-2 flex items-center justify-center gap-2"
                >
                  <span className="text-lg">+</span>
                  Don't see your profession? Add it here
                </button>
              ) : (
                <div className="animate-fadeIn space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        ref={customInputRef}
                        type="text"
                        value={customPersonaText}
                        onChange={(e) => handleCustomPersonaChange(e.target.value)}
                        onBlur={handleCustomPersonaBlur}
                        onKeyDown={(e) => e.key === 'Enter' && handleCustomPersonaSubmit()}
                        placeholder="e.g., Veterinarian, Architect, Pastor..."
                        aria-invalid={!!customPersonaError}
                        aria-describedby={customPersonaError ? 'persona-error' : undefined}
                        className={`w-full px-4 py-3 rounded-xl border-2 bg-background focus:outline-none transition-colors text-base ${
                          customPersonaError
                            ? 'border-destructive focus:border-destructive'
                            : 'border-border focus:border-primary'
                        }`}
                        inputMode="text"
                        autoComplete="off"
                      />
                    </div>
                    <Button
                      onClick={handleCustomPersonaSubmit}
                      className="px-4 h-[50px]"
                    >
                      Continue
                    </Button>
                  </div>
                  {customPersonaError && (
                    <p
                      id="persona-error"
                      role="alert"
                      className="text-sm text-destructive flex items-center gap-1.5 animate-fadeIn"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {customPersonaError}
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => handlePersonaSelect('general')}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              Just exploring, skip this step
            </button>
          </div>
        )

      case 'goal':
        return (
          <div className="space-y-4">
            {/* Personalized message based on role */}
            {selectedPersona && selectedPersona !== 'general' && selectedPersona !== 'custom' && (
              <p className="text-center text-sm text-muted-foreground mb-2">
                Recommended for {PERSONA_DEFINITIONS[selectedPersona]?.label || 'you'}:
              </p>
            )}

            {/* Dynamic goal options based on persona */}
            <div className="max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dynamicGoals.map((option, index) => (
                  <button
                    key={option.id}
                    onClick={() => handleGoalSelect(option.id)}
                    className={`
                      p-4 sm:p-5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02]
                      ${selectedGoal === option.id
                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                        : 'border-border hover:border-primary/50 bg-card'
                      }
                      ${index < 2 ? 'ring-1 ring-primary/20' : ''}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl sm:text-3xl flex-shrink-0">{option.icon}</div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm sm:text-base mb-0.5 leading-tight">{option.label}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{option.description}</p>
                      </div>
                    </div>
                    {index < 2 && (
                      <span className="inline-block mt-2 text-xs text-primary/80 font-medium">
                        Popular for your role
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom goal input - "Something else" option */}
            <div className="border-t border-border pt-4">
              {!showCustomGoalInput ? (
                <button
                  onClick={() => setShowCustomGoalInput(true)}
                  className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors py-2 flex items-center justify-center gap-2"
                >
                  <span className="text-lg">+</span>
                  Something else? Tell us what you want to automate
                </button>
              ) : (
                <div className="animate-fadeIn space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 relative">
                      <input
                        ref={customGoalInputRef}
                        type="text"
                        value={customGoalText}
                        onChange={(e) => handleCustomGoalChange(e.target.value)}
                        onBlur={handleCustomGoalBlur}
                        onKeyDown={(e) => e.key === 'Enter' && handleCustomGoalSubmit()}
                        placeholder="e.g., Manage my Etsy orders, Track student attendance..."
                        aria-invalid={!!customGoalError}
                        aria-describedby={customGoalError ? 'goal-error' : undefined}
                        className={`w-full px-4 py-3 rounded-xl border-2 bg-background focus:outline-none transition-colors text-base ${
                          customGoalError
                            ? 'border-destructive focus:border-destructive'
                            : 'border-border focus:border-primary'
                        }`}
                        inputMode="text"
                        autoComplete="off"
                      />
                    </div>
                    <Button
                      onClick={handleCustomGoalSubmit}
                      className="px-4 whitespace-nowrap h-[50px]"
                    >
                      Continue
                    </Button>
                  </div>
                  {customGoalError && (
                    <p
                      id="goal-error"
                      role="alert"
                      className="text-sm text-destructive flex items-center gap-1.5 animate-fadeIn"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {customGoalError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Skip option */}
            <button
              onClick={() => handleGoalSelect('explore')}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              I'll figure it out as I explore
            </button>
          </div>
        )

      case 'integrations':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {INTEGRATIONS.map((integration) => (
                <button
                  key={integration.id}
                  onClick={() => handleIntegrationToggle(integration.id)}
                  className={`
                    p-3 sm:p-4 rounded-xl border-2 transition-all hover:scale-[1.02] min-h-[80px] sm:min-h-[100px]
                    ${connectedIntegrations.includes(integration.id)
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-border hover:border-primary/50 bg-card'
                    }
                  `}
                >
                  <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{integration.icon}</div>
                  <div className="font-medium text-xs sm:text-sm">{integration.name}</div>
                  {connectedIntegrations.includes(integration.id) && (
                    <div className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Connected
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Select the tools you use. We'll pre-configure {term('workflow')}s for them.
            </p>
          </div>
        )

      case 'first-workflow':
        return (
          <div className="text-center space-y-8">
            {showConfetti && (
              <div className="fixed inset-0 pointer-events-none z-50">
                {[...Array(50)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute animate-confetti"
                    style={{
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                      backgroundColor: ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b'][Math.floor(Math.random() * 4)],
                    }}
                  />
                ))}
              </div>
            )}

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">You're All Set!</span>
            </div>

            {hasWorkflowRequest && pendingWorkflow && (
              <div className="space-y-4">
                <p className="text-lg font-medium text-white">Your First Workflow</p>
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 max-w-md mx-auto">
                  <p className="text-primary font-medium italic">"{pendingWorkflow}"</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Click "Start Automating" to configure and activate this workflow
                </p>
              </div>
            )}

            {selectedPersona && selectedPersona !== 'general' && !hasWorkflowRequest && (
              <p className="text-lg text-primary font-medium">
                {personaInfo.tagline}
              </p>
            )}

            {/* Auto-OAuth Suggestions - Connect apps based on email */}
            {relevantAutoOAuthSuggestions.length > 0 && (
              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl p-6 border border-cyan-500/20">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h4 className="font-semibold text-white">Quick Connect</h4>
                  <span className="text-xs text-cyan-400 bg-cyan-500/20 px-2 py-0.5 rounded-full">
                    Based on your email
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  We detected these apps from your email. Connect them now with one click!
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {relevantAutoOAuthSuggestions.map((suggestion) => {
                    const isConnected = connectedServices.includes(suggestion.serviceId)
                    const isPending = pendingServices.includes(suggestion.serviceId)
                    const isConnecting = connectingService === suggestion.serviceId

                    return (
                      <button
                        key={suggestion.serviceId}
                        onClick={() => !isConnected && !isConnecting && handleAutoOAuthConnect(suggestion.serviceId)}
                        disabled={isConnected || isConnecting}
                        className={`
                          p-3 rounded-xl border-2 transition-all text-left
                          ${isConnected
                            ? 'border-emerald-500 bg-emerald-500/10 cursor-default'
                            : isPending
                            ? 'border-yellow-500 bg-yellow-500/10'
                            : 'border-border hover:border-cyan-500/50 hover:bg-cyan-500/5 bg-card'
                          }
                          ${isConnecting ? 'opacity-75' : ''}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{suggestion.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{suggestion.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {isConnected ? (
                                <span className="text-emerald-400 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Connected
                                </span>
                              ) : isPending ? (
                                <span className="text-yellow-400">Waiting...</span>
                              ) : isConnecting ? (
                                <span className="text-cyan-400">Connecting...</span>
                              ) : (
                                <span className="text-cyan-400">Click to connect</span>
                              )}
                            </p>
                          </div>
                          {!isConnected && !isConnecting && (
                            <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 border border-primary/20">
              <h3 className="text-2xl font-bold mb-2">What Happens Next</h3>
              <div className="space-y-4 text-left max-w-md mx-auto">
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold ${connectedServices.length > 0 ? 'bg-emerald-500' : 'bg-cyan-500'}`}>
                    {connectedServices.length > 0 ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : '1'}
                  </div>
                  <div>
                    <p className="font-medium">Connect your apps</p>
                    <p className="text-sm text-muted-foreground">
                      {connectedServices.length > 0
                        ? `${connectedServices.length} app${connectedServices.length > 1 ? 's' : ''} connected!`
                        : 'One-click OAuth for Gmail, Slack, WhatsApp, etc.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">2</div>
                  <div>
                    <p className="font-medium">Customize your workflow</p>
                    <p className="text-sm text-muted-foreground">Adjust triggers, actions, and timing</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">3</div>
                  <div>
                    <p className="font-medium">Activate and relax</p>
                    <p className="text-sm text-muted-foreground">Your workflow runs automatically</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              {['larry', 'mary', 'sam', 'emma'].map((agentId, i) => (
                <div key={agentId} className="relative group" style={{ marginLeft: i > 0 ? '-10px' : 0 }}>
                  <ProfessionalAvatar agentId={agentId} size={40} />
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-xs bg-background/90 px-2 py-1 rounded border">
                    {agentNames[agentId as keyof typeof agentNames]?.title}
                  </div>
                </div>
              ))}
              <span className="text-sm text-muted-foreground ml-2">Your {term('team')} is ready</span>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const showContinueButton = currentStepId !== 'persona' && currentStepId !== 'goal'

  return (
    <div
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="w-full max-w-2xl outline-none my-auto"
      >
        {/* Progress bar - visible on all screens */}
        <div className="mb-4 sm:mb-8 px-2">
          <div className="h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 sm:mt-2 text-xs text-muted-foreground">
            <span>Step {currentStep + 1} of {STEP_IDS.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
        </div>

        <div className={`
          bg-card rounded-2xl sm:rounded-3xl border border-border shadow-2xl overflow-hidden
          transition-all duration-300 max-h-[85vh] sm:max-h-none overflow-y-auto
          ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
        `}>
          {/* Header - more compact on mobile */}
          <div className="p-4 sm:p-8 pb-2 sm:pb-4 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl mx-auto mb-3 sm:mb-4 flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 text-primary">
              {stepInfo.icon}
            </div>
            <h2 id="onboarding-title" className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2 px-2">{stepInfo.title}</h2>
            <p className="text-sm sm:text-base text-muted-foreground px-2">{stepInfo.description}</p>
          </div>

          {/* Content area - responsive padding */}
          <div className="p-4 sm:p-8 pt-2 sm:pt-4">
            {renderStepContent()}
          </div>

          {/* Footer - stack on very small screens */}
          <div className="p-4 sm:p-6 border-t border-border bg-muted/30 flex flex-col-reverse sm:flex-row justify-between items-center gap-3 sm:gap-0">
            {onSkip && currentStep === 0 ? (
              <button
                onClick={onSkip}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip for now
              </button>
            ) : (
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                disabled={currentStep === 0}
              >
                Back
              </button>
            )}

            {showContinueButton && (
              <Button onClick={handleNext} size="lg" className="min-w-[140px]">
                {currentStepId === 'first-workflow' ? (
                  <>
                    Start Automating
                    <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                ) : (
                  <>
                    Continue
                    <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes confetti {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          width: 10px;
          height: 10px;
          border-radius: 2px;
          animation: confetti 3s ease-in-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.3);
        }
      `}</style>
    </div>
  )
}
