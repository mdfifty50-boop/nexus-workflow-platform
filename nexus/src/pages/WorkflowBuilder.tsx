/**
 * WorkflowBuilder - Simplified Page
 *
 * The visual Canvas Editor has been archived in favor of the Chat Cards interface
 * which is better suited for non-technical retail users.
 *
 * Users are now directed to use the AI chat to describe their workflows in natural language.
 * The AI generates and executes workflows via WorkflowPreviewCard.
 *
 * Archived: src/_archived/WorkflowCanvas.tsx, src/_archived/WorkflowCanvasLegacy.tsx
 */

import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { SmartAIChatbot } from '@/components/SmartAIChatbot'
// @NEXUS-FIX-090: Role-based avatar integration
import { Avatar } from '@/components/Avatar'

export function WorkflowBuilder() {
  const { workflowId } = useParams()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border glass">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-2xl font-bold gradient-text">Workflow Builder</h1>
                <p className="text-sm text-muted-foreground">
                  {workflowId ? `Editing workflow ${workflowId}` : 'Create a new workflow'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="max-w-lg text-center space-y-6">
          {/* @NEXUS-FIX-090: Animated Avatar */}
          <div className="mx-auto">
            <Avatar
              role="default"
              size="xl"
              state="listening"
              showName
              showTitle
            />
          </div>

          <h2 className="text-2xl font-bold text-foreground">
            Tell Nexus What You Need
          </h2>

          <p className="text-muted-foreground">
            Just describe your workflow in plain language. Nexus AI will understand what you need
            and create the perfect automation for you - no technical knowledge required.
          </p>

          <div className="bg-card/50 border border-border rounded-lg p-4 text-left">
            <p className="text-sm text-muted-foreground mb-2">Try saying something like:</p>
            <ul className="text-sm space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">•</span>
                <span>"When I get an email from a client, save it to my Google Sheet and notify me on Slack"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">•</span>
                <span>"Send a WhatsApp reminder to my team every Sunday at 9am"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">•</span>
                <span>"Track my Stripe payments and update my accounting spreadsheet"</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
            >
              Go to Dashboard
            </Button>
            <Button
              onClick={() => {
                // Open the chatbot
                const chatButton = document.querySelector('[data-chatbot-trigger]') as HTMLElement
                if (chatButton) chatButton.click()
              }}
              className="bg-gradient-to-r from-primary to-secondary"
            >
              Start with AI Chat
            </Button>
          </div>
        </div>
      </div>

      {/* Smart AI Chatbot - the main way to build workflows */}
      <SmartAIChatbot position="bottom-right" />
    </div>
  )
}
