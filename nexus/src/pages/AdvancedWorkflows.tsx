import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { advancedWorkflowTemplates } from '@/lib/advanced-workflow-templates'
import { supabase } from '@/lib/supabase'
import { WorkflowEngine } from '@/lib/workflow-engine'
import { SmartAIChatbot } from '@/components/SmartAIChatbot'
import { useToast } from '@/contexts/ToastContext'

export function AdvancedWorkflows() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [runningTemplate, setRunningTemplate] = useState<string | null>(null)

  const runAdvancedWorkflow = async (templateId: string) => {
    if (!user) {
      navigate('/login')
      return
    }

    setRunningTemplate(templateId)

    try {
      const template = advancedWorkflowTemplates.find(t => t.id === templateId)
      if (!template) return

      // Create or get demo project
      let projectId: string

      const { data: existingProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('owner_id', user.id)
        .eq('name', 'Advanced Workflows Demo')
        .limit(1)

      if (existingProjects && existingProjects.length > 0) {
        projectId = existingProjects[0].id
      } else {
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!userData) {
          await supabase.from('users').insert({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || null,
          })
        }

        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .insert({
            name: 'Advanced Workflows Demo',
            description: 'Demo project for advanced multi-agent workflows',
            owner_id: user.id,
          })
          .select()
          .single()

        if (projectError) throw projectError
        projectId = newProject.id
      }

      // Create workflow
      const { data: workflow, error: workflowError } = await supabase
        .from('workflows')
        .insert({
          project_id: projectId,
          name: template.name,
          description: template.description,
          workflow_type: 'BMAD',
          status: 'active',
          config: {
            definition: template.definition,
            template_id: template.id,
          },
        })
        .select()
        .single()

      if (workflowError) throw workflowError

      // Create execution
      const { data: execution, error: execError } = await supabase
        .from('workflow_executions')
        .insert({
          workflow_id: workflow.id,
          status: 'running',
          started_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (execError) throw execError

      // Execute in background
      setTimeout(async () => {
        const engine = new WorkflowEngine(
          workflow.id,
          execution.id,
          template.definition
        )

        const finalState = await engine.execute()

        await supabase
          .from('workflow_executions')
          .update({
            status: finalState.status,
            completed_at: new Date().toISOString(),
            token_usage: finalState.totalTokens,
            cost_usd: finalState.totalCost,
          })
          .eq('id', execution.id)

        await supabase
          .from('workflows')
          .update({
            execution_count: 1,
            last_executed_at: new Date().toISOString(),
          })
          .eq('id', workflow.id)
      }, 100)

      // Navigate to workflow builder to watch execution
      navigate(`/workflows/${workflow.id}/builder`)
    } catch (error: any) {
      console.error('Error running advanced workflow:', error)
      toast.error(`Failed to start workflow: ${error.message}`)
    } finally {
      setRunningTemplate(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border glass">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold gradient-text">Advanced Multi-Agent Workflows</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-4">
            <span className="gradient-text">Real Multi-Agent Workflows</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            These are ACTUAL multi-step workflows with multiple AI agents working together.
            Watch the visual workflow execute in real-time!
          </p>
        </div>

        {/* Templates Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {advancedWorkflowTemplates.map(template => (
            <div
              key={template.id}
              className="glass rounded-xl p-6 border-2 border-border hover:border-primary transition-all"
            >
              <div className="flex items-start gap-4 mb-4">
                <span className="text-5xl">{template.icon}</span>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 gradient-text">
                    {template.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 bg-primary/20 text-primary rounded">
                      {template.category}
                    </span>
                    <span className="text-muted-foreground">
                      {template.definition.nodes.length} nodes
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. Cost:</span>
                  <span className="font-medium text-green-500">{template.estimatedCost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. Time:</span>
                  <span className="font-medium">{template.estimatedTime}</span>
                </div>
              </div>

              <div className="mb-4 p-3 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Workflow Steps:</p>
                <div className="flex flex-wrap gap-1">
                  {template.definition.nodes
                    .filter(n => n.type !== 'start' && n.type !== 'end')
                    .map(n => (
                      <span key={n.id} className="text-xs px-2 py-1 bg-primary/10 rounded">
                        {n.label}
                      </span>
                    ))}
                </div>
              </div>

              <Button
                onClick={() => runAdvancedWorkflow(template.id)}
                disabled={runningTemplate === template.id}
                className="w-full"
              >
                {runningTemplate === template.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Launching...
                  </>
                ) : (
                  <>▶ Execute Multi-Agent Workflow</>
                )}
              </Button>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-12 max-w-4xl mx-auto p-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl border-2 border-primary/20">
          <h3 className="text-xl font-bold mb-4">What Makes These Workflows Special?</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔗</span>
              <div>
                <div className="font-bold">Multi-Step Execution</div>
                <div className="text-muted-foreground">
                  Multiple AI agents execute sequentially, passing data between steps
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">👀</span>
              <div>
                <div className="font-bold">Real-Time Visualization</div>
                <div className="text-muted-foreground">
                  Watch the workflow execute on the visual canvas with live updates
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">💰</span>
              <div>
                <div className="font-bold">Cost Tracking</div>
                <div className="text-muted-foreground">
                  See token usage and costs for each step and total workflow
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <div className="font-bold">Actual AI Processing</div>
                <div className="text-muted-foreground">
                  Real Claude API calls - not simulated data!
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Smart AI Chatbot for assistance */}
      <SmartAIChatbot position="bottom-right" />
    </div>
  )
}
