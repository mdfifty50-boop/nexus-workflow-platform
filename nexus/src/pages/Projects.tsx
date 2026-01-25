import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useProjects } from '@/hooks/useProjects'
import { CreateProjectModal } from '@/components/CreateProjectModal'
import { SmartAIChatbot } from '@/components/SmartAIChatbot'
import { Button } from '@/components/ui/button'
import { ProjectCardSkeleton } from '@/components/LoadingStates'

export function Projects() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const { projects, loading, createProject, deleteProject } = useProjects()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const handleCreateProject = async (name: string, description: string) => {
    const { data, error } = await createProject(name, description)

    // Navigate to project detail page after successful creation
    if (!error && data) {
      setTimeout(() => {
        navigate(`/projects/${data.id}`)
      }, 500)
    }

    return { error }
  }

  const handleDeleteProject = async (id: string) => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      setDeletingId(id)
      await deleteProject(id)
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border sticky top-0 z-40 bg-background">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold">Projects</h1>
            <div className="hidden sm:flex items-center gap-2 sm:gap-4">
              <div className="h-9 w-20 sm:w-24 bg-secondary/50 rounded-md animate-pulse" />
              <div className="h-9 w-16 sm:w-20 bg-secondary/50 rounded-md animate-pulse" />
              <div className="h-9 w-20 sm:w-24 bg-secondary/50 rounded-md animate-pulse" />
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 hover:bg-secondary/50 rounded-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 sm:py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col gap-4 mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold">Your Projects</h2>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  Manage and organize your AI workflow projects
                </p>
              </div>
              <div className="h-12 w-full sm:w-44 bg-primary/20 rounded-md animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <ProjectCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 z-40 bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold">Projects</h1>
          <div className="hidden sm:flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
            >
              Profile
            </button>
            <button
              onClick={handleSignOut}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
            >
              Sign Out
            </button>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 hover:bg-secondary/50 rounded-md transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-border bg-background">
            <div className="container mx-auto px-4 py-4 space-y-2">
              <button
                onClick={() => {
                  navigate('/dashboard')
                  setMobileMenuOpen(false)
                }}
                className="w-full px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-left"
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  navigate('/profile')
                  setMobileMenuOpen(false)
                }}
                className="w-full px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-left"
              >
                Profile
              </button>
              <button
                onClick={() => {
                  handleSignOut()
                  setMobileMenuOpen(false)
                }}
                className="w-full px-4 py-2 text-sm bg-destructive/10 text-destructive rounded-md hover:bg-destructive/20 transition-colors text-left"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Your Projects</h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Manage and organize your AI workflow projects
              </p>
            </div>
            <Button
              variant="cta"
              size="lg"
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full sm:w-auto"
              leftIcon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              }
            >
              Create New Project
            </Button>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-12 sm:py-20">
              <div className="w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 sm:w-12 h-10 sm:h-12 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">No projects yet</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-md mx-auto px-4">
                Create your first project to organize and manage your AI workflows
              </p>
              <Button
                variant="cta"
                size="lg"
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full sm:w-auto mx-4 sm:mx-0"
              >
                Create Your First Project
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-card border border-border rounded-lg p-4 sm:p-6 hover:shadow-lg hover:border-primary/50 transition-all flex flex-col"
                >
                  <div className="flex-1 mb-4">
                    <h3 className="text-lg sm:text-xl font-semibold mb-2 line-clamp-1">{project.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                      {project.description || 'No description'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 pb-4 border-b border-border/50">
                    <span className="whitespace-nowrap">
                      Created {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:flex gap-2 sm:gap-2">
                    <Button
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="col-span-2 sm:flex-1 text-xs sm:text-sm py-2 sm:py-2"
                      rightIcon={
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      }
                    >
                      Open
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigate(`/projects/${project.id}/settings`)}
                      aria-label="Settings"
                      className="h-10 w-10"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteProject(project.id)}
                      loading={deletingId === project.id}
                      aria-label="Delete project"
                      className="h-10 w-10"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProject}
      />

      {/* Smart AI Chatbot */}
      <SmartAIChatbot position="bottom-right" />
    </div>
  )
}
