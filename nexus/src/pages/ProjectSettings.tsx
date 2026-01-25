import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { IntegrationManager } from '@/components/IntegrationManager'
import { MeetingManager } from '@/components/MeetingManager'
import type { Project } from '@/types/database'

type SettingsTab = 'general' | 'team' | 'integrations' | 'meetings' | 'danger'

interface ProjectMember {
  id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  created_at: string
  user: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
}

export function ProjectSettings() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { userId } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Tab state from URL
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    const tab = searchParams.get('tab')
    if (tab === 'team' || tab === 'integrations' || tab === 'meetings' || tab === 'danger') return tab
    return 'general'
  })

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  // Member management state
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'member' | 'viewer'>('member')
  const [addingMember, setAddingMember] = useState(false)
  const [memberError, setMemberError] = useState<string | null>(null)

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab)
    setSearchParams({ tab })
  }

  useEffect(() => {
    if (projectId && userId) {
      loadProject()
      loadMembers()
    }
  }, [projectId, userId])

  const loadProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: {
          'X-Clerk-User-Id': userId || '',
        },
      })
      const result = await response.json()

      if (!result.success) {
        navigate('/projects')
        return
      }

      setProject(result.data)
      setName(result.data.name)
      setDescription(result.data.description || '')
    } catch (err) {
      console.error('Error loading project:', err)
      navigate('/projects')
    } finally {
      setLoading(false)
    }
  }

  const loadMembers = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        headers: {
          'X-Clerk-User-Id': userId || '',
        },
      })
      const result = await response.json()

      if (result.success) {
        setMembers(result.data || [])
      }
    } catch (err) {
      console.error('Error loading members:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': userId || '',
        },
        body: JSON.stringify({ name, description }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      setProject(result.data)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error('Error updating project:', err)
      setError(err.message || 'Failed to update project')
    } finally {
      setSaving(false)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingMember(true)
    setMemberError(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': userId || '',
        },
        body: JSON.stringify({ email: newMemberEmail, role: newMemberRole }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      setNewMemberEmail('')
      setNewMemberRole('member')
      loadMembers()
    } catch (err: any) {
      console.error('Error adding member:', err)
      setMemberError(err.message || 'Failed to add member')
    } finally {
      setAddingMember(false)
    }
  }

  const handleUpdateMemberRole = async (memberId: string, newRole: 'admin' | 'member' | 'viewer') => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': userId || '',
        },
        body: JSON.stringify({ role: newRole }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      loadMembers()
    } catch (err: any) {
      console.error('Error updating member:', err)
      setMemberError(err.message || 'Failed to update member')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'X-Clerk-User-Id': userId || '',
        },
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      loadMembers()
    } catch (err: any) {
      console.error('Error removing member:', err)
      setMemberError(err.message || 'Failed to remove member')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'X-Clerk-User-Id': userId || '',
        },
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      navigate('/projects')
    } catch (err: any) {
      console.error('Error deleting project:', err)
      setError(err.message || 'Failed to delete project')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
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
              onClick={() => navigate(`/projects/${projectId}`)}
              className="text-muted-foreground hover:text-foreground"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold">Project Settings</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Tab Navigation */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <button
              onClick={() => handleTabChange('general')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'general'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              General
            </button>
            <button
              onClick={() => handleTabChange('team')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'team'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Team
            </button>
            <button
              onClick={() => handleTabChange('integrations')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'integrations'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Integrations
            </button>
            <button
              onClick={() => handleTabChange('meetings')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'meetings'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Meetings
            </button>
            <button
              onClick={() => handleTabChange('danger')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'danger'
                  ? 'bg-destructive text-destructive-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Danger Zone
            </button>
          </div>

          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-md text-green-700 dark:text-green-400">
              Project updated successfully!
            </div>
          )}

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive-foreground">
              {error}
            </div>
          )}

          {/* General Settings Tab */}
          {activeTab === 'general' && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">General Settings</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Project Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
          )}

          {/* Team Members Tab */}
          {activeTab === 'team' && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Team Members</h2>

            {memberError && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive-foreground">
                {memberError}
              </div>
            )}

            {/* Add Member Form */}
            <form onSubmit={handleAddMember} className="mb-6 p-4 bg-muted/50 rounded-lg">
              <h3 className="text-sm font-medium mb-3">Add Team Member</h3>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="flex-1 px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as 'admin' | 'member' | 'viewer')}
                  className="px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button
                  type="submit"
                  disabled={addingMember}
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {addingMember ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>

            {/* Members List */}
            <div className="space-y-3">
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No team members yet</p>
              ) : (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {member.user?.avatar_url ? (
                        <img
                          src={member.user.avatar_url}
                          alt=""
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                          {member.user?.full_name?.[0] || member.user?.email?.[0] || '?'}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{member.user?.full_name || 'Unnamed'}</p>
                        <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.role === 'owner' ? (
                        <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-md">
                          Owner
                        </span>
                      ) : (
                        <>
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleUpdateMemberRole(member.id, e.target.value as 'admin' | 'member' | 'viewer')
                            }
                            className="px-2 py-1 text-xs border border-input rounded-md bg-background"
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-1 text-muted-foreground hover:text-destructive"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && projectId && (
            <IntegrationManager projectId={projectId} />
          )}

          {/* Meetings Tab */}
          {activeTab === 'meetings' && projectId && (
            <MeetingManager projectId={projectId} />
          )}

          {/* Danger Zone Tab */}
          {activeTab === 'danger' && (
          <div className="bg-card border border-destructive/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2 text-destructive">Danger Zone</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Once you delete a project, there is no going back. Please be certain.
            </p>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
            >
              Delete Project
            </button>
          </div>
          )}
        </div>
      </main>
    </div>
  )
}
