import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useWorkflows } from '@/hooks/useWorkflows'
import { AgentChatbot } from '@/components/AgentChatbot'
import { LiveWorkflowVisualization } from '@/components/LiveWorkflowVisualization'
import { usePersonalization } from '@/contexts/PersonalizationContext'
import { SmartAIChatbot } from '@/components/SmartAIChatbot'
import { WorkflowCardSkeleton } from '@/components/LoadingStates'
import type { Project } from '@/types/database'
import type { SuggestionWorkflow } from '@/lib/workflow-templates'

// Type for AI-generated projects stored in localStorage
interface AIGeneratedProject {
  id: string
  name: string
  description: string
  workflow: SuggestionWorkflow
  status: 'running' | 'completed' | 'paused'
  createdAt: string
  stepStatuses?: Record<string, string>
}

export function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { term } = usePersonalization()
  const { workflows, loading: workflowsLoading, createWorkflow } = useWorkflows(projectId)
  const [project, setProject] = useState<Project | null>(null)
  const [aiProject, setAIProject] = useState<AIGeneratedProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateWorkflow, setShowCreateWorkflow] = useState(false)
  const [showBMADChat, setShowBMADChat] = useState(false)
  const [workflowName, setWorkflowName] = useState('')
  const [workflowType, setWorkflowType] = useState('bmad')

  useEffect(() => {
    if (projectId) {
      loadProject()
    }
  }, [projectId, user?.id])

  const loadProject = async () => {
    try {
      // First check if this is an AI-generated project from localStorage
      const storedProjects = JSON.parse(localStorage.getItem('nexus_projects') || '[]') as AIGeneratedProject[]
      const aiGeneratedProject = storedProjects.find(p => p.id === projectId)

      if (aiGeneratedProject) {
        setAIProject(aiGeneratedProject)
        setLoading(false)
        return
      }

      // Load from API (supports both Supabase and dev store)
      const userId = user?.id || 'dev-user-123'
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: {
          'x-clerk-user-id': userId,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load project')
      }

      const result = await response.json()

      if (result.success && result.data) {
        setProject(result.data)
      } else {
        throw new Error(result.error || 'Project not found')
      }
    } catch (err) {
      console.error('Error loading project:', err)
      navigate('/projects')
    } finally {
      setLoading(false)
    }
  }

  const handleWorkflowComplete = () => {
    if (aiProject) {
      // Update project status in localStorage
      const storedProjects = JSON.parse(localStorage.getItem('nexus_projects') || '[]') as AIGeneratedProject[]
      const updatedProjects = storedProjects.map(p =>
        p.id === projectId ? { ...p, status: 'completed' as const } : p
      )
      localStorage.setItem('nexus_projects', JSON.stringify(updatedProjects))
      setAIProject(prev => prev ? { ...prev, status: 'completed' } : null)
    }
  }

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await createWorkflow(workflowName, workflowType)
    if (!error) {
      setWorkflowName('')
      setShowCreateWorkflow(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 bg-muted-foreground/20 rounded animate-pulse" />
              <div>
                <div className="h-7 w-48 bg-muted-foreground/20 rounded mb-2 animate-pulse" />
                <div className="h-4 w-32 bg-muted-foreground/20 rounded animate-pulse" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-9 w-24 bg-secondary/50 rounded-md animate-pulse" />
              <div className="h-9 w-20 bg-secondary/50 rounded-md animate-pulse" />
              <div className="h-9 w-24 bg-secondary/50 rounded-md animate-pulse" />
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* AI Assistant Skeleton */}
            <div className="mb-8 p-6 bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/10 border border-primary/20 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted-foreground/20 rounded-full animate-pulse" />
                  <div>
                    <div className="h-6 w-40 bg-muted-foreground/20 rounded mb-2 animate-pulse" />
                    <div className="h-4 w-64 bg-muted-foreground/20 rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-10 w-28 bg-primary/20 rounded-lg animate-pulse" />
              </div>
            </div>
            {/* Section Title */}
            <div className="flex items-center justify-between mb-6">
              <div className="h-8 w-32 bg-muted-foreground/20 rounded animate-pulse" />
              <div className="h-10 w-36 bg-primary/20 rounded-md animate-pulse" />
            </div>
            {/* Workflow Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0, 1, 2].map((i) => (
                <WorkflowCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Handle AI-generated projects with live visualization
  if (aiProject) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/projects')}
                className="text-muted-foreground hover:text-foreground"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold">{aiProject.name}</h1>
                <p className="text-sm text-muted-foreground">{aiProject.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                aiProject.status === 'running' ? 'bg-cyan-500/20 text-cyan-400' :
                aiProject.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                'bg-amber-500/20 text-amber-400'
              }`}>
                {aiProject.status === 'running' ? '⚡ Running' :
                 aiProject.status === 'completed' ? '✓ Completed' : '⏸ Paused'}
              </span>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
              >
                Dashboard
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* AI Project Info Banner */}
            <div className="mb-6 p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <h3 className="font-semibold text-white">AI-Generated {term('workflow')}</h3>
                  <p className="text-sm text-slate-400">
                    Created from AI suggestion on {new Date(aiProject.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Live Workflow Visualization */}
            <LiveWorkflowVisualization
              workflow={aiProject.workflow}
              autoStart={aiProject.status === 'running'}
              onComplete={handleWorkflowComplete}
            />

            {/* Completion Actions */}
            {aiProject.status === 'completed' && (
              <div className="mt-6 p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🎉</span>
                    <div>
                      <h3 className="font-semibold text-emerald-400">{term('workflow')} Completed Successfully!</h3>
                      <p className="text-sm text-slate-400">
                        All steps have been executed. You can now review the results or create a new {term('workflow')}.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Smart AI Chatbot for workflow assistance */}
        <SmartAIChatbot position="bottom-right" />
      </div>
    )
  }

  if (!project) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/projects')}
              className="text-muted-foreground hover:text-foreground"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <p className="text-sm text-muted-foreground">{project.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate(`/projects/${projectId}/settings`)}
              className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
            >
              Settings
            </button>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* AI Chatbot for project-specific workflow creation */}
          {user && <AgentChatbot userId={user.id} projectId={projectId} />}

          {/* BMAD Conversation Section */}
          <div className="mb-8 p-6 bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/20 border-2 border-primary/40 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">🤖</span>
                <div>
                  <h3 className="text-xl font-bold gradient-text">BMAD AI Assistant</h3>
                  <p className="text-sm text-foreground/80">
                    Chat with AI to design and create workflows for this project
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBMADChat(!showBMADChat)}
                className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium hover:opacity-90"
              >
                {showBMADChat ? 'Hide Chat' : 'Open Chat'}
              </button>
            </div>
            {showBMADChat && (
              <div className="mt-4 p-4 bg-background/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  💡 <strong>How to use:</strong> Click the floating chat button (bottom-right) to talk with the AI assistant about workflows for "{project?.name}".
                </p>
                <p className="text-sm text-muted-foreground">
                  The AI will ask you questions, understand your needs, and help you create the perfect automated workflow.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Workflows</h2>
            <button
              onClick={() => setShowCreateWorkflow(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Workflow
            </button>
          </div>

          {showCreateWorkflow && (
            <div className="mb-6 bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Create New Workflow</h3>
              <form onSubmit={handleCreateWorkflow} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Workflow Name</label>
                  <input
                    type="text"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Lead Generation Workflow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Workflow Type</label>
                  <select
                    value={workflowType}
                    onChange={(e) => setWorkflowType(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="bmad">BMAD Multi-Agent</option>
                    <option value="simple">Simple Automation</option>
                    <option value="scheduled">Scheduled Task</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    Create Workflow
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateWorkflow(false)}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {workflowsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0, 1, 2].map((i) => (
                <WorkflowCardSkeleton key={i} />
              ))}
            </div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">No workflows yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first AI workflow to automate your business processes
              </p>
              <button
                onClick={() => setShowCreateWorkflow(true)}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Create Your First Workflow
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workflows.map((workflow) => (
                <div key={workflow.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{workflow.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {workflow.description || 'No description'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      workflow.status === 'active' ? 'bg-green-500/10 text-green-700 dark:text-green-400' :
                      workflow.status === 'draft' ? 'bg-gray-500/10 text-gray-700 dark:text-gray-400' :
                      workflow.status === 'paused' ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' :
                      'bg-red-500/10 text-red-700 dark:text-red-400'
                    }`}>
                      {workflow.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="font-medium">{workflow.workflow_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Executions:</span>
                      <span className="font-medium">{workflow.execution_count || 0}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/workflows/${workflow.id}`)}
                    className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    View Workflow
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Smart AI Chatbot for workflow assistance */}
      <SmartAIChatbot position="bottom-right" />
    </div>
  )
}
