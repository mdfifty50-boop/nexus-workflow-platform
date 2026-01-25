import { useState, useEffect } from 'react'
import type { Project } from '@/types/database'
import { useAuth } from '@/contexts/AuthContext'

const API_BASE = '/api/projects'

export function useProjects() {
  const { userId, isSignedIn } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isSignedIn && userId) {
      loadProjects()
    }
  }, [isSignedIn, userId])

  const loadProjects = async () => {
    if (!userId) return

    try {
      setLoading(true)
      const response = await fetch(API_BASE, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': userId,
        },
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch projects')
      }

      setProjects(result.data || [])
      setError(null)
    } catch (err) {
      console.error('Error loading projects:', err)
      setError('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (name: string, description?: string) => {
    if (!userId) {
      return { data: null, error: 'Not authenticated' }
    }

    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': userId,
        },
        body: JSON.stringify({ name, description }),
      })

      const result = await response.json()

      if (!result.success) {
        return { data: null, error: result.error || 'Failed to create project' }
      }

      setProjects([result.data, ...projects])
      return { data: result.data, error: null }
    } catch (err: any) {
      console.error('Error creating project:', err)
      return { data: null, error: err.message || 'Failed to create project' }
    }
  }

  const updateProject = async (
    id: string,
    updates: Partial<Pick<Project, 'name' | 'description' | 'settings'>>
  ) => {
    if (!userId) {
      return { data: null, error: 'Not authenticated' }
    }

    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': userId,
        },
        body: JSON.stringify(updates),
      })

      const result = await response.json()

      if (!result.success) {
        return { data: null, error: result.error || 'Failed to update project' }
      }

      setProjects(projects.map((p) => (p.id === id ? result.data : p)))
      return { data: result.data, error: null }
    } catch (err) {
      console.error('Error updating project:', err)
      return { data: null, error: 'Failed to update project' }
    }
  }

  const deleteProject = async (id: string) => {
    if (!userId) {
      return { error: 'Not authenticated' }
    }

    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': userId,
        },
      })

      const result = await response.json()

      if (!result.success) {
        return { error: result.error || 'Failed to delete project' }
      }

      setProjects(projects.filter((p) => p.id !== id))
      return { error: null }
    } catch (err) {
      console.error('Error deleting project:', err)
      return { error: 'Failed to delete project' }
    }
  }

  const restoreProject = async (id: string) => {
    if (!userId) {
      return { error: 'Not authenticated' }
    }

    try {
      const response = await fetch(`${API_BASE}/${id}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': userId,
        },
      })

      const result = await response.json()

      if (!result.success) {
        return { error: result.error || 'Failed to restore project' }
      }

      // Refresh projects list
      await loadProjects()
      return { error: null }
    } catch (err) {
      console.error('Error restoring project:', err)
      return { error: 'Failed to restore project' }
    }
  }

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    restoreProject,
    refreshProjects: loadProjects,
  }
}
