# Nexus Component Documentation

This document provides an overview of all major components in the Nexus application.

## Table of Contents

- [Core Components](#core-components)
- [Workflow Components](#workflow-components)
- [AI Components](#ai-components)
- [UI Components](#ui-components)
- [Layout Components](#layout-components)
- [Mobile Components](#mobile-components)
- [Error Handling Components](#error-handling-components)

---

## Core Components

### Layout (`Layout.tsx`)
The main application layout wrapper providing consistent structure across pages.

```tsx
import { Layout } from '@/components/Layout'

function App() {
  return (
    <Layout>
      <YourPageContent />
    </Layout>
  )
}
```

### Navbar (`Navbar.tsx`)
Top navigation bar with user menu, notifications, and navigation links.

```tsx
import { Navbar } from '@/components/Navbar'

<Navbar />
```

### ProtectedRoute (`ProtectedRoute.tsx`)
Route wrapper that requires authentication before rendering children.

```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute'

<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>
```

---

## Workflow Components

### WorkflowCanvas (`WorkflowCanvas.tsx`)
Interactive n8n-style workflow visualization using ReactFlow. Supports drag-and-drop node editing, real-time status updates, and agent avatars.

**Features:**
- Custom agent nodes with status indicators
- Animated edge connections
- Zoom and pan controls
- Status-based styling (idle, pending, connecting, success, error, retrying)

```tsx
import { WorkflowCanvas } from '@/components/WorkflowCanvas'

<WorkflowCanvas
  nodes={workflowNodes}
  edges={workflowEdges}
  onNodesChange={handleNodesChange}
  onEdgesChange={handleEdgesChange}
/>
```

### WorkflowExecutor (`WorkflowExecutor.tsx`)
Manages workflow execution lifecycle with real-time progress tracking.

```tsx
import { WorkflowExecutor } from '@/components/WorkflowExecutor'

<WorkflowExecutor
  workflowId="workflow-123"
  onComplete={handleComplete}
  onError={handleError}
/>
```

### WorkflowFlowChart (`WorkflowFlowChart.tsx`)
Simplified workflow visualization for previews and read-only views.

```tsx
import { WorkflowFlowChart } from '@/components/WorkflowFlowChart'

<WorkflowFlowChart workflow={workflowDefinition} />
```

### WorkflowPreview (`WorkflowPreview.tsx`)
Quick preview card for workflow listings.

```tsx
import { WorkflowPreview } from '@/components/WorkflowPreview'

<WorkflowPreview
  workflow={workflow}
  onClick={handleClick}
/>
```

### WorkflowPreviewModal (`WorkflowPreviewModal.tsx`)
Modal dialog for detailed workflow preview with execution options.

```tsx
import { WorkflowPreviewModal } from '@/components/WorkflowPreviewModal'

<WorkflowPreviewModal
  workflow={workflow}
  isOpen={isOpen}
  onClose={handleClose}
  onExecute={handleExecute}
/>
```

### LiveWorkflowVisualization (`LiveWorkflowVisualization.tsx`)
Real-time workflow execution visualization with SSE updates.

```tsx
import { LiveWorkflowVisualization } from '@/components/LiveWorkflowVisualization'

<LiveWorkflowVisualization
  workflowId="workflow-123"
  executionId="exec-456"
/>
```

### WorkflowHistory (`WorkflowHistory.tsx`)
Displays execution history for a workflow with filtering and search.

```tsx
import { WorkflowHistory } from '@/components/WorkflowHistory'

<WorkflowHistory workflowId="workflow-123" />
```

### WorkflowMap (`WorkflowMap.tsx`)
Visual map representation of workflow dependencies.

```tsx
import { WorkflowMap } from '@/components/WorkflowMap'

<WorkflowMap workflows={workflows} />
```

### ToolChainVisualization (`ToolChainVisualization.tsx`)
Shows the tool chain and integrations used in a workflow.

```tsx
import { ToolChainVisualization } from '@/components/ToolChainVisualization'

<ToolChainVisualization tools={workflowTools} />
```

---

## AI Components

### SmartAIChatbot (`SmartAIChatbot.tsx`)
Nexus-powered intelligent workflow generator with conversational interface.

**Features:**
- AI-driven intent understanding
- Dynamic question generation
- Real-time workflow building
- Integration with Composio/Rube OAuth
- Browser automation via Playwright

```tsx
import { SmartAIChatbot } from '@/components/SmartAIChatbot'

<SmartAIChatbot position="bottom-right" />
```

### AgentChatbot (`AgentChatbot.tsx`)
Direct chat interface with Nexus AI agents.

```tsx
import { AgentChatbot } from '@/components/AgentChatbot'

<AgentChatbot
  agentId="analyst"
  onMessage={handleMessage}
/>
```

### AIChatAssistant (`AIChatAssistant.tsx`)
General-purpose AI chat assistant component.

```tsx
import { AIChatAssistant } from '@/components/AIChatAssistant'

<AIChatAssistant
  systemPrompt="You are a helpful assistant."
/>
```

### ChatInterface (`ChatInterface.tsx`)
Reusable chat UI component with message history and input.

```tsx
import { ChatInterface } from '@/components/ChatInterface'

<ChatInterface
  messages={messages}
  onSendMessage={handleSend}
  isLoading={isLoading}
/>
```

### AISuggestionsPanel (`AISuggestionsPanel.tsx`)
Displays AI-generated workflow suggestions based on user patterns.

**Note:** Uses `useAISuggestions` hook with infinite loop protection.

```tsx
import { AISuggestionsPanel } from '@/components/AISuggestionsPanel'

<AISuggestionsPanel onSuggestionClick={handleSuggestionClick} />
```

### AIMeetingRoom (`AIMeetingRoom.tsx`)
Virtual AI meeting room for multi-agent discussions.

```tsx
import { AIMeetingRoom } from '@/components/AIMeetingRoom'

<AIMeetingRoom
  participants={agents}
  topic="Project Planning"
/>
```

### VoiceInput (`VoiceInput.tsx`)
Voice-to-text input component using Web Speech API.

```tsx
import { VoiceInput } from '@/components/VoiceInput'

<VoiceInput
  onTranscript={handleTranscript}
  isListening={isListening}
/>
```

---

## UI Components

### Avatars

#### ProfessionalAvatar (`ProfessionalAvatar.tsx`)
Renders professional agent avatars with activity indicators.

```tsx
import { ProfessionalAvatar } from '@/components/ProfessionalAvatar'

<ProfessionalAvatar
  agentId="analyst"
  size={48}
  isActive={true}
/>
```

#### AnimatedAvatar (`AnimatedAvatar.tsx`)
Avatar with animations for speaking/thinking states.

```tsx
import { AnimatedAvatar } from '@/components/AnimatedAvatar'

<AnimatedAvatar
  agentId="pm"
  isSpeaking={isSpeaking}
/>
```

#### HeyGenAvatar (`HeyGenAvatar.tsx`)
Integration with HeyGen streaming avatar API.

```tsx
import { HeyGenAvatar } from '@/components/HeyGenAvatar'

<HeyGenAvatar
  avatarId="avatar-123"
  onReady={handleReady}
/>
```

### Feedback

#### Toast (`Toast.tsx`)
Toast notification component for user feedback.

```tsx
import { Toast } from '@/components/Toast'

<Toast
  message="Workflow saved successfully"
  type="success"
  duration={3000}
/>
```

#### Confetti (`Confetti.tsx`)
Celebration animation component.

```tsx
import { Confetti } from '@/components/Confetti'

<Confetti isActive={showCelebration} />
```

#### GlobalConfetti (`GlobalConfetti.tsx`)
Global confetti overlay for achievements.

```tsx
import { GlobalConfetti } from '@/components/GlobalConfetti'

<GlobalConfetti trigger={achievementUnlocked} />
```

#### CelebrationOverlay (`CelebrationOverlay.tsx`)
Full-screen celebration for major achievements.

```tsx
import { CelebrationOverlay } from '@/components/CelebrationOverlay'

<CelebrationOverlay
  title="Achievement Unlocked!"
  subtitle="Workflow Master"
/>
```

### Input Components

#### Button (`ui/button.tsx`)
Styled button component with variants.

```tsx
import { Button } from '@/components/ui/button'

<Button variant="default" size="lg" onClick={handleClick}>
  Click Me
</Button>
```

#### Input (`ui/input.tsx`)
Styled text input component.

```tsx
import { Input } from '@/components/ui/input'

<Input
  placeholder="Enter text..."
  value={value}
  onChange={handleChange}
/>
```

#### Textarea (`ui/textarea.tsx`)
Styled multi-line text input.

```tsx
import { Textarea } from '@/components/ui/textarea'

<Textarea
  placeholder="Enter description..."
  rows={4}
/>
```

#### Label (`ui/label.tsx`)
Form label component.

```tsx
import { Label } from '@/components/ui/label'

<Label htmlFor="email">Email Address</Label>
```

### Display Components

#### Skeleton (`Skeleton.tsx`)
Loading skeleton placeholder.

```tsx
import { Skeleton } from '@/components/Skeleton'

<Skeleton className="h-4 w-[200px]" />
```

#### EmptyState (`EmptyState.tsx`)
Empty state illustration with action button.

```tsx
import { EmptyState } from '@/components/EmptyState'

<EmptyState
  title="No workflows yet"
  description="Create your first workflow to get started"
  actionLabel="Create Workflow"
  onAction={handleCreate}
/>
```

#### LoadingSpinner (`LoadingSpinner.tsx`)
Animated loading indicator.

```tsx
import { LoadingSpinner } from '@/components/LoadingSpinner'

<LoadingSpinner size="lg" />
```

#### Tooltip (`Tooltip.tsx`)
Hover tooltip component.

```tsx
import { Tooltip } from '@/components/Tooltip'

<Tooltip content="More information">
  <InfoIcon />
</Tooltip>
```

#### HelpTooltip (`HelpTooltip.tsx`)
Help icon with tooltip for contextual help.

```tsx
import { HelpTooltip } from '@/components/HelpTooltip'

<HelpTooltip content="This field is required" />
```

#### Breadcrumb (`Breadcrumb.tsx`)
Navigation breadcrumb trail.

```tsx
import { Breadcrumb } from '@/components/Breadcrumb'

<Breadcrumb
  items={[
    { label: 'Home', href: '/' },
    { label: 'Workflows', href: '/workflows' },
    { label: 'Edit' }
  ]}
/>
```

---

## Gamification Components

### AchievementSystem (`AchievementSystem.tsx`)
Manages user achievements and progress tracking.

**Features:**
- Achievement categories (workflows, time, integrations, special)
- Progress tracking
- Tier system (bronze, silver, gold, platinum)
- Reward unlocks

```tsx
import { AchievementSystem, useAchievements } from '@/components/AchievementSystem'

// Hook usage
const { achievements, userStats, checkAchievements } = useAchievements(userId)

// Component usage
<AchievementSystem userId={userId} />
```

### UsageStats (`UsageStats.tsx`)
Displays user usage statistics and metrics.

```tsx
import { UsageStats } from '@/components/UsageStats'

<UsageStats userId={userId} />
```

---

## Integration Components

### IntegrationManager (`IntegrationManager.tsx`)
Manages third-party service integrations.

```tsx
import { IntegrationManager } from '@/components/IntegrationManager'

<IntegrationManager
  onConnect={handleConnect}
  onDisconnect={handleDisconnect}
/>
```

### ConnectionWizard (`ConnectionWizard.tsx`)
Step-by-step wizard for connecting new integrations.

```tsx
import { ConnectionWizard } from '@/components/ConnectionWizard'

<ConnectionWizard
  integration="hubspot"
  onComplete={handleComplete}
/>
```

### WhatsAppIntegration (`WhatsAppIntegration.tsx`)
WhatsApp Business API integration component.

```tsx
import { WhatsAppIntegration } from '@/components/WhatsAppIntegration'

<WhatsAppIntegration
  onConnect={handleConnect}
/>
```

### WebhookConfig (`WebhookConfig.tsx`)
Webhook configuration interface.

```tsx
import { WebhookConfig } from '@/components/WebhookConfig'

<WebhookConfig
  webhookUrl={url}
  onSave={handleSave}
/>
```

---

## Layout Components

### EnhancedDashboard (`EnhancedDashboard.tsx`)
Main dashboard layout with widgets and statistics.

```tsx
import { EnhancedDashboard } from '@/components/EnhancedDashboard'

<EnhancedDashboard />
```

### QuickActions (`QuickActions.tsx`)
Quick action buttons for common tasks.

```tsx
import { QuickActions } from '@/components/QuickActions'

<QuickActions actions={commonActions} />
```

### CommandPalette (`CommandPalette.tsx`)
Keyboard-driven command palette (Cmd+K).

```tsx
import { CommandPalette } from '@/components/CommandPalette'

<CommandPalette
  isOpen={isOpen}
  onClose={handleClose}
  commands={commands}
/>
```

### KeyboardShortcutsHelp (`KeyboardShortcutsHelp.tsx`)
Help modal showing available keyboard shortcuts.

```tsx
import { KeyboardShortcutsHelp } from '@/components/KeyboardShortcutsHelp'

<KeyboardShortcutsHelp isOpen={isOpen} onClose={handleClose} />
```

---

## Mobile Components

### MobileNav (`MobileNav.tsx`)
Mobile navigation drawer.

```tsx
import { MobileNav } from '@/components/MobileNav'

<MobileNav isOpen={isOpen} onClose={handleClose} />
```

### FloatingActionButton (`mobile/FloatingActionButton.tsx`)
Material Design-style FAB for mobile.

```tsx
import { FloatingActionButton } from '@/components/mobile/FloatingActionButton'

<FloatingActionButton
  icon={<PlusIcon />}
  onClick={handleClick}
/>
```

### BottomSheet (`BottomSheet.tsx`)
Mobile-friendly bottom sheet modal.

```tsx
import { BottomSheet } from '@/components/BottomSheet'

<BottomSheet isOpen={isOpen} onClose={handleClose}>
  <SheetContent />
</BottomSheet>
```

### ThumbZoneOptimizer (`ThumbZoneOptimizer.tsx`)
Optimizes touch targets for one-handed mobile use.

```tsx
import { ThumbZoneOptimizer } from '@/components/ThumbZoneOptimizer'

<ThumbZoneOptimizer>
  <MobileContent />
</ThumbZoneOptimizer>
```

---

## Error Handling Components

### ErrorBoundary (`ErrorBoundary.tsx`)
Generic React error boundary.

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary'

<ErrorBoundary fallback={<ErrorFallback />}>
  <RiskyComponent />
</ErrorBoundary>
```

### BaseErrorBoundary (`error-boundaries/BaseErrorBoundary.tsx`)
Base class for specialized error boundaries.

### WorkflowErrorBoundary (`error-boundaries/WorkflowErrorBoundary.tsx`)
Specialized error boundary for workflow components.

```tsx
import { WorkflowErrorBoundary } from '@/components/error-boundaries/WorkflowErrorBoundary'

<WorkflowErrorBoundary>
  <WorkflowCanvas />
</WorkflowErrorBoundary>
```

### ChatErrorBoundary (`error-boundaries/ChatErrorBoundary.tsx`)
Error boundary for chat components.

### IntegrationErrorBoundary (`error-boundaries/IntegrationErrorBoundary.tsx`)
Error boundary for integration components.

### ErrorRecovery (`ErrorRecovery.tsx`)
User-facing error recovery UI with retry options.

```tsx
import { ErrorRecovery } from '@/components/ErrorRecovery'

<ErrorRecovery
  error={error}
  onRetry={handleRetry}
  onDismiss={handleDismiss}
/>
```

---

## Onboarding Components

### OnboardingWizard (`OnboardingWizard.tsx`)
Multi-step onboarding flow for new users.

**Features:**
- Persona selection
- Goal selection
- Integration setup
- Animated progress

```tsx
import { OnboardingWizard } from '@/components/OnboardingWizard'

<OnboardingWizard
  onComplete={handleComplete}
  onSkip={handleSkip}
/>
```

### OnboardingTour (`OnboardingTour.tsx`)
Interactive product tour with highlights.

```tsx
import { OnboardingTour } from '@/components/OnboardingTour'

<OnboardingTour
  steps={tourSteps}
  onComplete={handleComplete}
/>
```

### TutorialCard (`TutorialCard.tsx`)
Tutorial card with video/GIF support.

```tsx
import { TutorialCard } from '@/components/TutorialCard'

<TutorialCard
  title="Create Your First Workflow"
  description="Learn how to create automated workflows"
  mediaUrl="/tutorials/first-workflow.gif"
/>
```

---

## Marketplace Components

### TemplatesMarketplace (`TemplatesMarketplace.tsx`)
Workflow template marketplace with search and filters.

```tsx
import { TemplatesMarketplace } from '@/components/TemplatesMarketplace'

<TemplatesMarketplace
  onSelectTemplate={handleSelect}
/>
```

### QuickTemplates (`QuickTemplates.tsx`)
Quick-start templates for common workflows.

```tsx
import { QuickTemplates } from '@/components/QuickTemplates'

<QuickTemplates onSelect={handleSelect} />
```

---

## Payment Components

### CheckoutFlow (`CheckoutFlow.tsx`)
Multi-step checkout process.

```tsx
import { CheckoutFlow } from '@/components/CheckoutFlow'

<CheckoutFlow
  plan={selectedPlan}
  onComplete={handleComplete}
/>
```

### StripeCheckout (`StripeCheckout.tsx`)
Stripe Elements integration for payments.

```tsx
import { StripeCheckout } from '@/components/StripeCheckout'

<StripeCheckout
  amount={2999}
  onSuccess={handleSuccess}
/>
```

---

## Utility Components

### PasswordStrengthMeter (`PasswordStrengthMeter.tsx`)
Visual password strength indicator.

```tsx
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter'

<PasswordStrengthMeter password={password} />
```

### SessionTimeoutWarning (`SessionTimeoutWarning.tsx`)
Warns users before session timeout.

```tsx
import { SessionTimeoutWarning } from '@/components/SessionTimeoutWarning'

<SessionTimeoutWarning
  timeoutMinutes={30}
  warningMinutes={5}
/>
```

### LiveRegion (`LiveRegion.tsx`)
ARIA live region for accessibility announcements.

```tsx
import { LiveRegion } from '@/components/LiveRegion'

<LiveRegion message={announcement} />
```

### VirtualList (`VirtualList.tsx`)
Virtualized list for large datasets.

```tsx
import { VirtualList } from '@/components/VirtualList'

<VirtualList
  items={largeDataset}
  itemHeight={50}
  renderItem={renderItem}
/>
```

### OptimizedImage (`OptimizedImage.tsx`)
Lazy-loaded image with placeholder.

```tsx
import { OptimizedImage } from '@/components/OptimizedImage'

<OptimizedImage
  src="/images/hero.png"
  alt="Hero image"
  width={800}
  height={600}
/>
```

---

## Internationalization Components

### LanguageSwitcher (`LanguageSwitcher.tsx`)
Language selection dropdown.

```tsx
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

<LanguageSwitcher />
```

### RTLProvider (`RTLProvider.tsx`)
Right-to-left text direction support.

```tsx
import { RTLProvider } from '@/components/RTLProvider'

<RTLProvider>
  <App />
</RTLProvider>
```

---

## Admin Components

### AuditLog (`AuditLog.tsx`)
Displays system audit log entries.

```tsx
import { AuditLog } from '@/components/AuditLog'

<AuditLog
  filters={filters}
  onFilterChange={handleFilterChange}
/>
```

### BulkActionsBar (`BulkActionsBar.tsx`)
Bulk action toolbar for selected items.

```tsx
import { BulkActionsBar } from '@/components/BulkActionsBar'

<BulkActionsBar
  selectedCount={selectedItems.length}
  actions={bulkActions}
/>
```

### ShareWorkflowModal (`ShareWorkflowModal.tsx`)
Modal for sharing workflows with team members.

```tsx
import { ShareWorkflowModal } from '@/components/ShareWorkflowModal'

<ShareWorkflowModal
  workflow={workflow}
  isOpen={isOpen}
  onClose={handleClose}
/>
```

---

## Analytics Components

### ProjectAnalytics (`ProjectAnalytics.tsx`)
Project-level analytics dashboard.

```tsx
import { ProjectAnalytics } from '@/components/ProjectAnalytics'

<ProjectAnalytics projectId={projectId} />
```

### MeetingManager (`MeetingManager.tsx`)
Meeting scheduling and management.

```tsx
import { MeetingManager } from '@/components/MeetingManager'

<MeetingManager
  meetings={meetings}
  onSchedule={handleSchedule}
/>
```

### CreateProjectModal (`CreateProjectModal.tsx`)
Modal for creating new projects.

```tsx
import { CreateProjectModal } from '@/components/CreateProjectModal'

<CreateProjectModal
  isOpen={isOpen}
  onClose={handleClose}
  onCreate={handleCreate}
/>
```

---

## Icon Components

### AgentAvatars (`icons/AgentAvatars.tsx`)
SVG icons for all Nexus agent avatars.

```tsx
import { AgentAvatars } from '@/components/icons/AgentAvatars'

<AgentAvatars.Analyst size={32} />
<AgentAvatars.Developer size={32} />
<AgentAvatars.Designer size={32} />
```

### CompetitiveAdvantages (`CompetitiveAdvantages.tsx`)
Visual comparison component for marketing pages.

```tsx
import { CompetitiveAdvantages } from '@/components/CompetitiveAdvantages'

<CompetitiveAdvantages />
```
