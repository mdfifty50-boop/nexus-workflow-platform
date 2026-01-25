import { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { validateProjectName, validateMaxLength } from '../lib/validation'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (name: string, description: string) => Promise<{ error: string | null }>
}

export function CreateProjectModal({ isOpen, onClose, onSubmit }: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; description?: string }>({})
  const modalRef = useRef<HTMLDivElement>(null)

  // Session 8: Accessibility - focus trap
  useEffect(() => {
    if (!isOpen) return
    const modalElement = modalRef.current
    if (!modalElement) return

    const previouslyFocused = document.activeElement as HTMLElement
    modalElement.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose()
      }
      if (e.key === 'Tab') {
        const focusableElements = modalElement.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [isOpen, loading, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Session 10: Client-side validation
    const errors: { name?: string; description?: string } = {}

    const nameValidation = validateProjectName(name)
    if (!nameValidation.valid) {
      errors.name = nameValidation.error
    }

    if (description) {
      const descValidation = validateMaxLength(description, 500, 'Description')
      if (!descValidation.valid) {
        errors.description = descValidation.error
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setLoading(true)
    setError(null)

    const { error } = await onSubmit(name.trim(), description.trim())

    if (error) {
      setError(error)
      setLoading(false)
    } else {
      setName('')
      setDescription('')
      setLoading(false)
      onClose()
    }
  }

  const handleClose = () => {
    if (!loading) {
      setName('')
      setDescription('')
      setError(null)
      setFieldErrors({})
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-project-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-card border-2 border-border rounded-xl p-8 w-full max-w-md shadow-2xl outline-none"
        style={{
          backgroundColor: 'hsl(var(--card))',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)'
        }}
      >
        <h2 id="create-project-title" className="text-3xl font-bold mb-6 gradient-text">Create New Project</h2>

        {error && (
          <div className="mb-4 p-4 text-sm text-destructive-foreground bg-destructive/20 border-2 border-destructive/40 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name" className="text-base mb-2">
              Project Name *
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: undefined }))
              }}
              placeholder="My AI Workflow"
              className={`mt-2 ${fieldErrors.name ? 'border-destructive focus:ring-destructive' : ''}`}
              aria-invalid={!!fieldErrors.name}
              aria-describedby={fieldErrors.name ? 'name-error' : undefined}
            />
            {fieldErrors.name && (
              <p id="name-error" className="mt-1.5 text-sm text-destructive" role="alert">
                {fieldErrors.name}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">2-50 characters</p>
          </div>

          <div>
            <Label htmlFor="description" className="text-base mb-2">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (fieldErrors.description) setFieldErrors(prev => ({ ...prev, description: undefined }))
              }}
              rows={3}
              placeholder="Describe your project..."
              className={`mt-2 resize-none ${fieldErrors.description ? 'border-destructive focus:ring-destructive' : ''}`}
              aria-invalid={!!fieldErrors.description}
              aria-describedby={fieldErrors.description ? 'desc-error' : undefined}
            />
            {fieldErrors.description && (
              <p id="desc-error" className="mt-1.5 text-sm text-destructive" role="alert">
                {fieldErrors.description}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">{description.length}/500 characters</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
              size="lg"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </span>
              ) : 'Create Project'}
            </Button>
            <Button
              type="button"
              onClick={handleClose}
              disabled={loading}
              variant="outline"
              size="lg"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
