import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { initErrorTracking, setUserId } from '@/lib/errorTracking'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
// @NEXUS-FIX-104: Import directly from file, NOT from barrel export (@/services)
// Barrel import triggers ALL 80+ services to load at parse time, causing circular
// dependency in vendor-core chunk → ReferenceError: Cannot access 'ao' before initialization
import { userPreferencesService } from '@/services/UserPreferencesService'

// Initialize theme immediately on app load (before first paint)
userPreferencesService.initializeTheme()
import { SubscriptionProvider, SubscriptionWarningBanner } from '@/contexts/SubscriptionContext'
import { PersonalizationProvider } from '@/contexts/PersonalizationContext'
import { WorkflowProvider } from '@/contexts/WorkflowContext'
import { WorkflowChatProvider } from '@/contexts/WorkflowChatContext'
import { ToastProvider } from '@/components/Toast'
import { GlobalConfetti } from '@/components/GlobalConfetti'
import { AchievementsProvider } from '@/contexts/AchievementsContext'
import { AchievementNotification } from '@/components/AchievementNotification'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import {
  BaseErrorBoundary,
  WorkflowErrorBoundary,
  IntegrationErrorBoundary,
} from '@/components/error-boundaries'
import { NetworkStatusBanner } from '@/components/NetworkStatusBanner'
import { PageTransition } from '@/components/PageTransition'
import { SmartAIChatbot } from '@/components/SmartAIChatbot'
import { AITeamChatButton } from '@/components/AITeamChatButton'

// =============================================================================
// LAZY-LOADED ROUTES
// =============================================================================
// ALL routes are code-split using React.lazy() for optimal bundle splitting.
// This ensures the initial bundle is as small as possible (<500KB target).
//
// Chunk groups:
// - Core: React, router, contexts (always loaded)
// - Auth: Login, SignUp pages
// - Landing: LandingPage (marketing heavy)
// - Dashboard: Main app shell
// - Workflows: Workflow builder, canvas, detail
// - Analytics: Charts and reporting (recharts heavy)
// - Admin: Admin panel, settings
// - Static: Privacy, Terms, Help pages
// =============================================================================

// =============================================================================
// AUTH PAGES - Lazy loaded (small, focused pages)
// =============================================================================
const Login = lazy(() => import('@/pages/Login').then(m => ({ default: m.Login })))
const SignUp = lazy(() => import('@/pages/SignUp').then(m => ({ default: m.SignUp })))
const SSOCallback = lazy(() => import('@/pages/SSOCallback').then(m => ({ default: m.SSOCallback })))

// =============================================================================
// LANDING PAGE - Lazy loaded (large marketing page with animations)
// =============================================================================
const LandingPage = lazy(() => import('@/pages/LandingPage').then(m => ({ default: m.LandingPage })))

// =============================================================================
// WORKFLOW PAGES - Heavy components with React Flow, lazy loaded
// =============================================================================
// WorkflowDemo: 2857 lines - largest component, rarely accessed
const WorkflowDemo = lazy(() => import('@/pages/WorkflowDemo').then(m => ({ default: m.WorkflowDemo })))
const WorkflowDetail = lazy(() => import('@/pages/WorkflowDetail').then(m => ({ default: m.WorkflowDetail })))
const WorkflowBuilder = lazy(() => import('@/pages/WorkflowBuilder').then(m => ({ default: m.WorkflowBuilder })))
const Workflows = lazy(() => import('@/pages/Workflows').then(m => ({ default: m.Workflows })))
const WorkflowTemplates = lazy(() => import('@/pages/WorkflowTemplates').then(m => ({ default: m.WorkflowTemplates })))
const AdvancedWorkflows = lazy(() => import('@/pages/AdvancedWorkflows').then(m => ({ default: m.AdvancedWorkflows })))
const WorkflowExecutionResults = lazy(() => import('@/pages/WorkflowExecutionResults').then(m => ({ default: m.WorkflowExecutionResults })))

// =============================================================================
// DASHBOARD & MAIN APP PAGES
// =============================================================================
const Dashboard = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })))
const Profile = lazy(() => import('@/pages/Profile').then(m => ({ default: m.Profile })))
const Projects = lazy(() => import('@/pages/Projects').then(m => ({ default: m.Projects })))
const ProjectDetail = lazy(() => import('@/pages/ProjectDetail').then(m => ({ default: m.ProjectDetail })))
const ProjectSettings = lazy(() => import('@/pages/ProjectSettings').then(m => ({ default: m.ProjectSettings })))
const Settings = lazy(() => import('@/pages/Settings').then(m => ({ default: m.Settings })))

// =============================================================================
// ANALYTICS - Heavy with Recharts, lazy loaded
// =============================================================================
const Analytics = lazy(() => import('@/pages/Analytics').then(m => ({ default: m.Analytics })))

// =============================================================================
// INTEGRATIONS - OAuth flows, external APIs
// =============================================================================
const Integrations = lazy(() => import('@/pages/Integrations').then(m => ({ default: m.Integrations })))
const IntegrationCallback = lazy(() => import('@/pages/IntegrationCallback').then(m => ({ default: m.IntegrationCallback })))
const OAuthCallback = lazy(() => import('@/pages/OAuthCallback').then(m => ({ default: m.OAuthCallback })))
const MyConnectedApps = lazy(() => import('@/pages/MyConnectedApps').then(m => ({ default: m.MyConnectedApps })))

// =============================================================================
// ADMIN PAGES
// =============================================================================
const AdminPanel = lazy(() => import('@/pages/AdminPanel').then(m => ({ default: m.AdminPanel })))
const Monitoring = lazy(() => import('@/pages/admin/Monitoring').then(m => ({ default: m.Monitoring })))

// =============================================================================
// STATIC PAGES - Small, lazy loaded
// =============================================================================
const Privacy = lazy(() => import('@/pages/Privacy').then(m => ({ default: m.Privacy })))
const Terms = lazy(() => import('@/pages/Terms').then(m => ({ default: m.Terms })))
const Help = lazy(() => import('@/pages/Help').then(m => ({ default: m.Help })))

// =============================================================================
// CHECKOUT PAGES - Stripe subscription flow
// =============================================================================
const Checkout = lazy(() => import('@/pages/Checkout').then(m => ({ default: m.Checkout })))
const CheckoutSuccess = lazy(() => import('@/pages/Checkout').then(m => ({ default: m.CheckoutSuccess })))
const CheckoutCancel = lazy(() => import('@/pages/Checkout').then(m => ({ default: m.CheckoutCancel })))

// =============================================================================
// PUBLIC TRY PAGE - Instant demo without signup
// =============================================================================
const Try = lazy(() => import('@/pages/Try').then(m => ({ default: m.Try })))

// =============================================================================
// ONBOARDING - New user onboarding flow (<5 min to first workflow)
// =============================================================================
const Onboarding = lazy(() => import('@/pages/Onboarding').then(m => ({ default: m.Onboarding })))
const OnboardingNew = lazy(() => import('@/pages/OnboardingNew').then(m => ({ default: m.OnboardingNew })))

// =============================================================================
// DEMO PAGES - Meeting room and component showcases
// =============================================================================
const MeetingRoomDemo = lazy(() => import('@/pages/MeetingRoomDemo'))
const VoiceDemo = lazy(() => import('@/pages/VoiceDemo'))
const AvatarDemo = lazy(() => import('@/pages/AvatarDemo'))
const ChatDemo = lazy(() => import('@/pages/ChatDemo'))
const MobileChat = lazy(() => import('@/pages/Chat'))

// =============================================================================
// WHATSAPP BUSINESS PAGES - AiSensy Integration
// =============================================================================
const WhatsApp = lazy(() => import('@/pages/WhatsApp').then(m => ({ default: m.WhatsApp })))
const WhatsAppInbox = lazy(() => import('@/pages/whatsapp/Inbox').then(m => ({ default: m.WhatsAppInbox })))
const WhatsAppBroadcasts = lazy(() => import('@/pages/whatsapp/Broadcasts').then(m => ({ default: m.WhatsAppBroadcasts })))
const WhatsAppContacts = lazy(() => import('@/pages/whatsapp/Contacts').then(m => ({ default: m.WhatsAppContacts })))
const WhatsAppChatbots = lazy(() => import('@/pages/whatsapp/Chatbots').then(m => ({ default: m.WhatsAppChatbots })))
const WhatsAppAnalytics = lazy(() => import('@/pages/whatsapp/Analytics').then(m => ({ default: m.WhatsAppAnalytics })))
const WhatsAppCatalogue = lazy(() => import('@/pages/whatsapp/Catalogue').then(m => ({ default: m.WhatsAppCatalogue })))

// =============================================================================
// ERROR PAGES
// =============================================================================
const NotFound = lazy(() => import('@/pages/NotFound').then(m => ({ default: m.NotFound })))

// =============================================================================
// ERROR TRACKING INITIALIZATION
// =============================================================================
// Initialize production error tracking on app startup
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0'
const BUILD_ID = import.meta.env.VITE_BUILD_ID

initErrorTracking({
  enabled: true,
  environment: import.meta.env.DEV ? 'development' : 'production',
  appVersion: APP_VERSION,
  buildId: BUILD_ID,
  maxStoredErrors: 100,
  maxErrorsPerMinute: 10,
  enableConsoleLogging: import.meta.env.DEV,
  sampleRate: import.meta.env.DEV ? 1.0 : 0.1, // 10% sampling in production
  // Configure reporting endpoint when available:
  // reportingEndpoint: import.meta.env.VITE_ERROR_REPORTING_ENDPOINT,
  beforeSend: (error) => {
    // Filter out certain errors if needed
    // Example: Don't report ResizeObserver errors
    if (error.error.message.includes('ResizeObserver')) {
      return null
    }
    return error
  },
})

/**
 * Component to sync user ID with error tracking
 */
function ErrorTrackingUserSync() {
  const { user } = useAuth()

  useEffect(() => {
    setUserId(user?.id)
  }, [user?.id])

  return null
}

// =============================================================================
// LOADING FALLBACK COMPONENT
// =============================================================================
// Lightweight loading state - no external dependencies
function RouteLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-6">
        {/* Animated logo loader - pure CSS, no framer-motion */}
        <div className="relative">
          {/* Outer spinning gradient ring */}
          <div
            className="w-20 h-20 rounded-full border-4 border-transparent animate-spin"
            style={{
              borderTopColor: 'rgb(6, 182, 212)',
              borderRightColor: 'rgb(168, 85, 247)',
              animationDuration: '1s'
            }}
          />
          {/* Inner pulsing logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center animate-pulse">
              <span className="text-2xl">N</span>
            </div>
          </div>
        </div>

        {/* Loading text with shimmer */}
        <div className="text-center">
          <p className="text-slate-400 text-sm animate-pulse">Loading...</p>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
            style={{
              animation: 'loadingProgress 1.5s ease-in-out infinite'
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes loadingProgress {
          0% { width: 0%; transform: translateX(0); }
          50% { width: 70%; transform: translateX(0); }
          100% { width: 100%; transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorTrackingUserSync />
        <SubscriptionProvider>
        <WorkflowProvider>
          <WorkflowChatProvider>
          <PersonalizationProvider>
          <ToastProvider>
          <AchievementsProvider>
          <AchievementNotification />
          <GlobalConfetti />
          <NetworkStatusBanner />
          <SubscriptionWarningBanner />
          {/* AI Team Chat Button - Desktop only, positioned above chatbot */}
          <AITeamChatButton />
          {/* Global chatbot available on ALL pages */}
          <SmartAIChatbot position="bottom-right" />
          {/* 3D Avatar moved to top of App for debugging */}
          <BaseErrorBoundary variant="full-page" severity="critical">
          <Suspense fallback={<RouteLoadingFallback />}>
          <PageTransition type="fade" duration={300}>
          <Routes>
          {/* Chat route - main Nexus chat interface (mobile-first design) */}
          <Route path="/chat" element={<MobileChat />} />
          {/* Legacy chat demo with sidebar */}
          <Route path="/chat-legacy" element={<ChatDemo />} />

          {/* Landing page - lazy loaded for smaller initial bundle */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth routes - lazy loaded */}
          <Route path="/login" element={<Login />} />
          <Route path="/login/sso-callback" element={<SSOCallback />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/sign-up/sso-callback" element={<SSOCallback />} />

          {/* Onboarding - new user flow (<5 min to first workflow) */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          {/* Enhanced Onboarding - new version with OAuth handling */}
          <Route
            path="/onboarding-new"
            element={
              <ProtectedRoute>
                <OnboardingNew />
              </ProtectedRoute>
            }
          />

          {/* Main Chat Interface - moved to public routes section below for proper routing */}

          {/* Protected routes - all lazy loaded */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId"
            element={
              <ProtectedRoute>
                <ProjectDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/settings"
            element={
              <ProtectedRoute>
                <ProjectSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workflows/:workflowId"
            element={
              <ProtectedRoute>
                <WorkflowErrorBoundary>
                  <WorkflowDetail />
                </WorkflowErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/workflows/:workflowId/builder"
            element={
              <ProtectedRoute>
                <WorkflowErrorBoundary>
                  <WorkflowBuilder />
                </WorkflowErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/integrations"
            element={
              <ProtectedRoute>
                <IntegrationErrorBoundary>
                  <Integrations />
                </IntegrationErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/integrations/callback"
            element={
              <ProtectedRoute>
                <IntegrationErrorBoundary>
                  <IntegrationCallback />
                </IntegrationErrorBoundary>
              </ProtectedRoute>
            }
          />
          {/* OAuth callback - handles Composio and other OAuth provider redirects */}
          {/* NOT protected - needs to work in popup windows without auth context */}
          <Route
            path="/oauth/callback"
            element={
              <IntegrationErrorBoundary>
                <OAuthCallback />
              </IntegrationErrorBoundary>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/monitoring"
            element={
              <ProtectedRoute>
                <Monitoring />
              </ProtectedRoute>
            }
          />
          <Route
            path="/templates"
            element={
              <ProtectedRoute>
                <WorkflowErrorBoundary>
                  <WorkflowTemplates />
                </WorkflowErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/advanced-workflows"
            element={
              <ProtectedRoute>
                <WorkflowErrorBoundary>
                  <AdvancedWorkflows />
                </WorkflowErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/execution/:executionId"
            element={
              <ProtectedRoute>
                <WorkflowErrorBoundary>
                  <WorkflowExecutionResults />
                </WorkflowErrorBoundary>
              </ProtectedRoute>
            }
          />

          {/* Public lazy-loaded routes */}
          <Route path="/workflow-demo" element={<WorkflowErrorBoundary><WorkflowDemo /></WorkflowErrorBoundary>} />
          <Route path="/try" element={<Try />} />
          <Route path="/meeting-room-demo" element={<MeetingRoomDemo />} />
          <Route path="/voice-demo" element={<VoiceDemo />} />
          <Route path="/avatar-demo" element={<AvatarDemo />} />
          {/* Original ChatDemo route moved above */}
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/help" element={<Help />} />

          {/* Checkout routes - subscription flow */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout/success"
            element={
              <ProtectedRoute>
                <CheckoutSuccess />
              </ProtectedRoute>
            }
          />
          <Route path="/checkout/cancel" element={<CheckoutCancel />} />

          {/* Additional protected routes */}
          <Route
            path="/workflows"
            element={
              <ProtectedRoute>
                <WorkflowErrorBoundary>
                  <Workflows />
                </WorkflowErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-apps"
            element={
              <ProtectedRoute>
                <IntegrationErrorBoundary>
                  <MyConnectedApps />
                </IntegrationErrorBoundary>
              </ProtectedRoute>
            }
          />

          {/* WhatsApp Business Routes - AiSensy Integration */}
          <Route
            path="/whatsapp"
            element={
              <ProtectedRoute>
                <WhatsApp />
              </ProtectedRoute>
            }
          />
          <Route
            path="/whatsapp/inbox"
            element={
              <ProtectedRoute>
                <WhatsAppInbox />
              </ProtectedRoute>
            }
          />
          <Route
            path="/whatsapp/broadcasts"
            element={
              <ProtectedRoute>
                <WhatsAppBroadcasts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/whatsapp/contacts"
            element={
              <ProtectedRoute>
                <WhatsAppContacts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/whatsapp/chatbots"
            element={
              <ProtectedRoute>
                <WhatsAppChatbots />
              </ProtectedRoute>
            }
          />
          <Route
            path="/whatsapp/analytics"
            element={
              <ProtectedRoute>
                <WhatsAppAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/whatsapp/catalogue"
            element={
              <ProtectedRoute>
                <WhatsAppCatalogue />
              </ProtectedRoute>
            }
          />

          {/* Redirects for legacy routes */}
          <Route path="/agents" element={<Navigate to="/dashboard" replace />} />
          <Route path="/history" element={<Navigate to="/workflows" replace />} />

          {/* 404 - catch all unmatched routes */}
          <Route path="*" element={<NotFound />} />
          </Routes>
          </PageTransition>
          </Suspense>
          </BaseErrorBoundary>
          </AchievementsProvider>
          </ToastProvider>
          </PersonalizationProvider>
          </WorkflowChatProvider>
        </WorkflowProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
