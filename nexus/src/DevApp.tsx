import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DevAuthProvider } from '@/contexts/DevAuthContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { PersonalizationProvider } from '@/contexts/PersonalizationContext'
import { WorkflowProvider } from '@/contexts/WorkflowContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import {
  BaseErrorBoundary,
  WorkflowErrorBoundary,
  IntegrationErrorBoundary,
} from '@/components/error-boundaries'
import { CommandPalette } from '@/components/CommandPalette'
import { MinimalLayout } from '@/components/Layout'
import { NetworkStatusBanner } from '@/components/NetworkStatusBanner'

// =============================================================================
// LAZY-LOADED ROUTES — mirrors App.tsx to enable proper code-splitting
// Static imports here defeat lazy() in App.tsx when both share an entry point
// =============================================================================

const LandingPage = lazy(() => import('@/pages/LandingPage').then(m => ({ default: m.LandingPage })))
const Dashboard = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })))
const Profile = lazy(() => import('@/pages/Profile').then(m => ({ default: m.Profile })))
const Projects = lazy(() => import('@/pages/Projects').then(m => ({ default: m.Projects })))
const ProjectDetail = lazy(() => import('@/pages/ProjectDetail').then(m => ({ default: m.ProjectDetail })))
const ProjectSettings = lazy(() => import('@/pages/ProjectSettings').then(m => ({ default: m.ProjectSettings })))
const WorkflowDetail = lazy(() => import('@/pages/WorkflowDetail').then(m => ({ default: m.WorkflowDetail })))
const WorkflowBuilder = lazy(() => import('@/pages/WorkflowBuilder').then(m => ({ default: m.WorkflowBuilder })))
const Integrations = lazy(() => import('@/pages/Integrations').then(m => ({ default: m.Integrations })))
const AdminPanel = lazy(() => import('@/pages/AdminPanel').then(m => ({ default: m.AdminPanel })))
const WorkflowTemplates = lazy(() => import('@/pages/WorkflowTemplates').then(m => ({ default: m.WorkflowTemplates })))
const AdvancedWorkflows = lazy(() => import('@/pages/AdvancedWorkflows').then(m => ({ default: m.AdvancedWorkflows })))
const WorkflowExecutionResults = lazy(() => import('@/pages/WorkflowExecutionResults').then(m => ({ default: m.WorkflowExecutionResults })))
const IntegrationCallback = lazy(() => import('@/pages/IntegrationCallback').then(m => ({ default: m.IntegrationCallback })))
const OAuthCallback = lazy(() => import('@/pages/OAuthCallback').then(m => ({ default: m.OAuthCallback })))
const WorkflowDemo = lazy(() => import('@/pages/WorkflowDemo').then(m => ({ default: m.WorkflowDemo })))
const Privacy = lazy(() => import('@/pages/Privacy').then(m => ({ default: m.Privacy })))
const Terms = lazy(() => import('@/pages/Terms').then(m => ({ default: m.Terms })))
const Workflows = lazy(() => import('@/pages/Workflows').then(m => ({ default: m.Workflows })))
const Settings = lazy(() => import('@/pages/Settings').then(m => ({ default: m.Settings })))
const Analytics = lazy(() => import('@/pages/Analytics').then(m => ({ default: m.Analytics })))
const MyConnectedApps = lazy(() => import('@/pages/MyConnectedApps').then(m => ({ default: m.MyConnectedApps })))
const Try = lazy(() => import('@/pages/Try').then(m => ({ default: m.Try })))
const Onboarding = lazy(() => import('@/pages/Onboarding').then(m => ({ default: m.Onboarding })))
const NotFound = lazy(() => import('@/pages/NotFound').then(m => ({ default: m.NotFound })))
const MeetingRoomDemo = lazy(() => import('@/pages/MeetingRoomDemo'))
const VoiceDemo = lazy(() => import('@/pages/VoiceDemo'))
const ChatDemo = lazy(() => import('@/pages/ChatDemo').then(m => ({ default: m.ChatDemo })))

// WhatsApp Business Pages (AiSensy Integration)
const WhatsApp = lazy(() => import('@/pages/WhatsApp').then(m => ({ default: m.WhatsApp })))
const WhatsAppInbox = lazy(() => import('@/pages/whatsapp/Inbox').then(m => ({ default: m.WhatsAppInbox })))
const WhatsAppBroadcasts = lazy(() => import('@/pages/whatsapp/Broadcasts').then(m => ({ default: m.WhatsAppBroadcasts })))
const WhatsAppContacts = lazy(() => import('@/pages/whatsapp/Contacts').then(m => ({ default: m.WhatsAppContacts })))
const WhatsAppChatbots = lazy(() => import('@/pages/whatsapp/Chatbots').then(m => ({ default: m.WhatsAppChatbots })))
const WhatsAppAnalytics = lazy(() => import('@/pages/whatsapp/Analytics').then(m => ({ default: m.WhatsAppAnalytics })))
const WhatsAppCatalogue = lazy(() => import('@/pages/whatsapp/Catalogue').then(m => ({ default: m.WhatsAppCatalogue })))

// Development App - runs without Clerk authentication
// Uses mock auth for local testing

function DevApp() {
  return (
    <>
      <BaseErrorBoundary variant="full-page" severity="critical">
      <BrowserRouter>
        <DevAuthProvider>
          <WorkflowProvider>
          <PersonalizationProvider>
          <ToastProvider>
            {/* Command palette (Ctrl+K) */}
            <CommandPalette />
            {/* Network status banner for offline detection */}
            <NetworkStatusBanner />
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">Loading...</div>}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<MinimalLayout><LandingPage /></MinimalLayout>} />
            {/* In dev mode, auto-redirect to dashboard (no auth required) */}
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="/signup" element={<Navigate to="/dashboard" replace />} />
            <Route path="/sign-up" element={<Navigate to="/dashboard" replace />} />
            <Route path="/try" element={<Try />} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />

            {/* Protected routes - pages include their own Layout */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/projects/:projectId" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
            <Route path="/projects/:projectId/settings" element={<ProtectedRoute><ProjectSettings /></ProtectedRoute>} />
            <Route path="/workflows" element={<ProtectedRoute><WorkflowErrorBoundary><Workflows /></WorkflowErrorBoundary></ProtectedRoute>} />
            <Route path="/workflows/:workflowId" element={<ProtectedRoute><WorkflowErrorBoundary><WorkflowDetail /></WorkflowErrorBoundary></ProtectedRoute>} />
            <Route path="/workflows/:workflowId/builder" element={<ProtectedRoute><WorkflowErrorBoundary><WorkflowBuilder /></WorkflowErrorBoundary></ProtectedRoute>} />
            <Route path="/integrations" element={<ProtectedRoute><IntegrationErrorBoundary><Integrations /></IntegrationErrorBoundary></ProtectedRoute>} />
            <Route path="/integrations/callback" element={<ProtectedRoute><IntegrationErrorBoundary><IntegrationCallback /></IntegrationErrorBoundary></ProtectedRoute>} />
            {/* OAuth callback - NOT protected, needs to work in popup windows */}
            <Route path="/oauth/callback" element={<IntegrationErrorBoundary><OAuthCallback /></IntegrationErrorBoundary>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
            <Route path="/templates" element={<ProtectedRoute><WorkflowErrorBoundary><WorkflowTemplates /></WorkflowErrorBoundary></ProtectedRoute>} />
            <Route path="/advanced-workflows" element={<ProtectedRoute><WorkflowErrorBoundary><AdvancedWorkflows /></WorkflowErrorBoundary></ProtectedRoute>} />
            <Route path="/execution/:executionId" element={<ProtectedRoute><WorkflowErrorBoundary><WorkflowExecutionResults /></WorkflowErrorBoundary></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/my-apps" element={<ProtectedRoute><IntegrationErrorBoundary><MyConnectedApps /></IntegrationErrorBoundary></ProtectedRoute>} />

            {/* Workflow demo without standard navbar (has its own) */}
            <Route path="/workflow-demo" element={<MinimalLayout><WorkflowErrorBoundary><WorkflowDemo /></WorkflowErrorBoundary></MinimalLayout>} />

            {/* Demo pages */}
            <Route path="/meeting-room-demo" element={<MeetingRoomDemo />} />
            <Route path="/voice-demo" element={<VoiceDemo />} />
            <Route path="/chat-demo" element={<ChatDemo />} />
            <Route path="/chat-legacy" element={<ChatDemo />} />
            <Route path="/chat" element={<ChatDemo />} />

            {/* WhatsApp Business Routes - AiSensy Integration */}
            <Route path="/whatsapp" element={<ProtectedRoute><WhatsApp /></ProtectedRoute>} />
            <Route path="/whatsapp/inbox" element={<ProtectedRoute><WhatsAppInbox /></ProtectedRoute>} />
            <Route path="/whatsapp/broadcasts" element={<ProtectedRoute><WhatsAppBroadcasts /></ProtectedRoute>} />
            <Route path="/whatsapp/contacts" element={<ProtectedRoute><WhatsAppContacts /></ProtectedRoute>} />
            <Route path="/whatsapp/chatbots" element={<ProtectedRoute><WhatsAppChatbots /></ProtectedRoute>} />
            <Route path="/whatsapp/analytics" element={<ProtectedRoute><WhatsAppAnalytics /></ProtectedRoute>} />
            <Route path="/whatsapp/catalogue" element={<ProtectedRoute><WhatsAppCatalogue /></ProtectedRoute>} />

            {/* Redirects for legacy routes */}
            <Route path="/agents" element={<Navigate to="/dashboard" replace />} />
            <Route path="/history" element={<Navigate to="/workflows" replace />} />

            {/* 404 - catch all unmatched routes */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          </ToastProvider>
          </PersonalizationProvider>
          </WorkflowProvider>
        </DevAuthProvider>
      </BrowserRouter>
    </BaseErrorBoundary>
    </>
  )
}

export default DevApp
