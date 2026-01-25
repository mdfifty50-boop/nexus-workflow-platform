import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'

// Types
interface Meeting {
  id: string
  project_id: string
  title: string
  recording_url: string | null
  recording_duration: number | null
  transcript: string | null
  transcript_language: 'en' | 'ar' | 'ar-kw' | null
  translation: string | null
  extracted_sops: SOP[] | null
  status: 'uploading' | 'transcribing' | 'translating' | 'extracting' | 'complete' | 'error'
  error_message: string | null
  created_at: string
}

interface SOP {
  id: string
  title: string
  description: string
  steps: SOPStep[]
  triggers: string[]
  frequency: string | null
  department: string | null
  confidence: number
}

interface SOPStep {
  order: number
  action: string
  responsible: string | null
  tools: string[]
  duration: string | null
}

interface MeetingManagerProps {
  projectId: string
}

// Status styling
const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  uploading: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Uploading' },
  transcribing: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Transcribing' },
  translating: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', label: 'Translating' },
  extracting: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-400', label: 'Extracting SOPs' },
  complete: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Complete' },
  error: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Error' },
}

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  ar: 'Arabic',
  'ar-kw': 'Kuwaiti Arabic',
}

export function MeetingManager({ projectId }: MeetingManagerProps) {
  const { userId } = useAuth()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create meeting state
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newTranscript, setNewTranscript] = useState('')
  const [creating, setCreating] = useState(false)

  // Selected meeting for detail view
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [processing, setProcessing] = useState(false)
  const [generatingWorkflow, setGeneratingWorkflow] = useState<string | null>(null)

  // Fetch meetings
  const fetchMeetings = useCallback(async () => {
    if (!userId) return

    try {
      const response = await fetch(`/api/meetings/project/${projectId}`, {
        headers: { 'X-Clerk-User-Id': userId },
      })
      const data = await response.json()

      if (data.success) {
        setMeetings(data.data)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId, projectId])

  useEffect(() => {
    fetchMeetings()
  }, [fetchMeetings])

  // Create meeting with transcript
  const handleCreate = async () => {
    if (!userId || !newTitle.trim()) return

    setCreating(true)
    setError(null)

    try {
      // Create meeting
      const createRes = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': userId,
        },
        body: JSON.stringify({
          project_id: projectId,
          title: newTitle,
        }),
      })

      const createData = await createRes.json()
      if (!createData.success) throw new Error(createData.error)

      const meetingId = createData.data.id

      // If transcript provided, add it
      if (newTranscript.trim()) {
        await fetch(`/api/meetings/${meetingId}/transcript`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: newTranscript }),
        })
      }

      // Reset form and refresh
      setNewTitle('')
      setNewTranscript('')
      setShowCreate(false)
      await fetchMeetings()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  // Process meeting (translate + extract SOPs)
  const handleProcess = async (meetingId: string) => {
    setProcessing(true)
    setError(null)

    try {
      const response = await fetch(`/api/meetings/${meetingId}/process`, {
        method: 'POST',
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      await fetchMeetings()

      // Update selected meeting if viewing it
      if (selectedMeeting?.id === meetingId) {
        const updated = await fetch(`/api/meetings/${meetingId}`)
        const updatedData = await updated.json()
        if (updatedData.success) {
          setSelectedMeeting(updatedData.data)
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  // Generate workflow from SOP
  const handleGenerateWorkflow = async (meetingId: string, sopId: string) => {
    if (!userId) return

    setGeneratingWorkflow(sopId)
    setError(null)

    try {
      const response = await fetch(`/api/meetings/${meetingId}/generate-workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': userId,
        },
        body: JSON.stringify({ sop_id: sopId }),
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      // Navigate to workflow (or show success message)
      window.location.href = `/workflows/${data.data.workflowId}`
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGeneratingWorkflow(null)
    }
  }

  // Delete meeting
  const handleDelete = async (meetingId: string) => {
    if (!userId || !confirm('Delete this meeting and all its data?')) return

    try {
      await fetch(`/api/meetings/${meetingId}`, {
        method: 'DELETE',
        headers: { 'X-Clerk-User-Id': userId },
      })

      if (selectedMeeting?.id === meetingId) {
        setSelectedMeeting(null)
      }

      await fetchMeetings()
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Format duration
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Meeting detail view
  if (selectedMeeting) {
    const status = STATUS_STYLES[selectedMeeting.status] || STATUS_STYLES.error

    return (
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => setSelectedMeeting(null)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Meetings
        </button>

        {/* Meeting header */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">{selectedMeeting.title}</h2>
              <p className="text-sm text-muted-foreground">
                Created {new Date(selectedMeeting.created_at).toLocaleDateString()}
                {selectedMeeting.recording_duration && (
                  <span className="ml-2">
                    Duration: {formatDuration(selectedMeeting.recording_duration)}
                  </span>
                )}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm ${status.bg} ${status.text}`}>
              {status.label}
            </span>
          </div>

          {selectedMeeting.error_message && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-700 dark:text-red-400 text-sm mb-4">
              {selectedMeeting.error_message}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {selectedMeeting.status !== 'complete' && selectedMeeting.transcript && (
              <Button
                onClick={() => handleProcess(selectedMeeting.id)}
                disabled={processing}
              >
                {processing ? 'Processing...' : 'Process Meeting'}
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => handleDelete(selectedMeeting.id)}
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Transcript */}
        {selectedMeeting.transcript && (
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Transcript</h3>
              {selectedMeeting.transcript_language && (
                <span className="text-sm text-muted-foreground">
                  {LANGUAGE_LABELS[selectedMeeting.transcript_language]}
                </span>
              )}
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-sm">{selectedMeeting.transcript}</p>
            </div>
          </div>
        )}

        {/* Translation */}
        {selectedMeeting.translation && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold mb-4">English Translation</h3>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-sm">{selectedMeeting.translation}</p>
            </div>
          </div>
        )}

        {/* Extracted SOPs */}
        {selectedMeeting.extracted_sops && selectedMeeting.extracted_sops.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold mb-4">
              Extracted SOPs ({selectedMeeting.extracted_sops.length})
            </h3>
            <div className="space-y-4">
              {selectedMeeting.extracted_sops.map((sop) => (
                <div key={sop.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{sop.title}</h4>
                      <p className="text-sm text-muted-foreground">{sop.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        {Math.round(sop.confidence * 100)}% confidence
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleGenerateWorkflow(selectedMeeting.id, sop.id)}
                        disabled={generatingWorkflow === sop.id}
                      >
                        {generatingWorkflow === sop.id ? 'Creating...' : 'Create Workflow'}
                      </Button>
                    </div>
                  </div>

                  {/* SOP Details */}
                  <div className="mt-3 space-y-2">
                    {sop.department && (
                      <p className="text-xs text-muted-foreground">
                        Department: {sop.department}
                      </p>
                    )}
                    {sop.frequency && (
                      <p className="text-xs text-muted-foreground">
                        Frequency: {sop.frequency}
                      </p>
                    )}
                    {sop.triggers.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Triggers: {sop.triggers.join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Steps */}
                  <div className="mt-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Steps ({sop.steps.length})
                    </p>
                    <ol className="space-y-1">
                      {sop.steps.map((step) => (
                        <li key={step.order} className="text-sm flex gap-2">
                          <span className="text-muted-foreground">{step.order}.</span>
                          <span>{step.action}</span>
                          {step.responsible && (
                            <span className="text-muted-foreground">({step.responsible})</span>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Meetings list view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Meeting Intelligence</h2>
          <p className="text-sm text-muted-foreground">
            Upload meetings to extract SOPs and generate workflows
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          New Meeting
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold mb-4">New Meeting</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Meeting title"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Transcript (paste meeting notes or transcript)
              </label>
              <textarea
                value={newTranscript}
                onChange={(e) => setNewTranscript(e.target.value)}
                placeholder="Paste meeting transcript here... (supports English, Arabic, and Kuwaiti Arabic)"
                rows={6}
                className="w-full px-3 py-2 border border-input rounded-md bg-background resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Tip: Kuwaiti Arabic dialect will be automatically detected and translated
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={creating || !newTitle.trim()}>
                {creating ? 'Creating...' : 'Create Meeting'}
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Meetings list */}
      {meetings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-4">📋</p>
          <p>No meetings yet</p>
          <p className="text-sm">Upload meeting recordings or paste transcripts to extract SOPs</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {meetings.map((meeting) => {
            const status = STATUS_STYLES[meeting.status] || STATUS_STYLES.error

            return (
              <div
                key={meeting.id}
                onClick={() => setSelectedMeeting(meeting)}
                className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{meeting.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(meeting.created_at).toLocaleDateString()}
                      {meeting.transcript_language && (
                        <span className="ml-2">
                          {LANGUAGE_LABELS[meeting.transcript_language]}
                        </span>
                      )}
                      {meeting.extracted_sops && meeting.extracted_sops.length > 0 && (
                        <span className="ml-2">
                          {meeting.extracted_sops.length} SOP{meeting.extracted_sops.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs ${status.bg} ${status.text}`}>
                    {status.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
