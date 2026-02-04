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
import { LandingPage } from '@/pages/LandingPage'
import { Dashboard } from '@/pages/Dashboard'
import { Profile } from '@/pages/Profile'
import { Projects } from '@/pages/Projects'
import { ProjectDetail } from '@/pages/ProjectDetail'
import { ProjectSettings } from '@/pages/ProjectSettings'
import { WorkflowDetail } from '@/pages/WorkflowDetail'
import { WorkflowBuilder } from '@/pages/WorkflowBuilder'
import { Integrations } from '@/pages/Integrations'
import { AdminPanel } from '@/pages/AdminPanel'
import { WorkflowTemplates } from '@/pages/WorkflowTemplates'
import { AdvancedWorkflows } from '@/pages/AdvancedWorkflows'
import { WorkflowExecutionResults } from '@/pages/WorkflowExecutionResults'
import { IntegrationCallback } from '@/pages/IntegrationCallback'
import { OAuthCallback } from '@/pages/OAuthCallback'
import { WorkflowDemo } from '@/pages/WorkflowDemo'
import { Privacy } from '@/pages/Privacy'
import { Terms } from '@/pages/Terms'
import { Workflows } from '@/pages/Workflows'
import { Settings } from '@/pages/Settings'
import { Analytics } from '@/pages/Analytics'
import { MyConnectedApps } from '@/pages/MyConnectedApps'
import { Try } from '@/pages/Try'
import { Onboarding } from '@/pages/Onboarding'
import { NotFound } from '@/pages/NotFound'
import MeetingRoomDemo from '@/pages/MeetingRoomDemo'
import VoiceDemo from '@/pages/VoiceDemo'
import { ChatDemo } from '@/pages/ChatDemo'

// WhatsApp Business Pages (AiSensy Integration)
import { WhatsApp } from '@/pages/WhatsApp'
import { WhatsAppInbox } from '@/pages/whatsapp/Inbox'
import { WhatsAppBroadcasts } from '@/pages/whatsapp/Broadcasts'
import { WhatsAppContacts } from '@/pages/whatsapp/Contacts'
import { WhatsAppChatbots } from '@/pages/whatsapp/Chatbots'
import { WhatsAppAnalytics } from '@/pages/whatsapp/Analytics'
import { WhatsAppCatalogue } from '@/pages/whatsapp/Catalogue'

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
            {/* Dev mode banner */}
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              backgroundColor: '#f59e0b',
              color: '#000',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: 500,
              textAlign: 'center',
              zIndex: 9999,
            }}>
              DEV MODE - No Authentication (Add VITE_CLERK_PUBLISHABLE_KEY for full auth)
            </div>
            <div style={{ paddingTop: '28px' }}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<MinimalLayout><LandingPage /></MinimalLayout>} />
            {/* In dev mode, auto-redirect to dashboard (no auth required) */}
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="/signup" element={<Navigate to="/dashboard" replace />} />
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
            </div>
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
