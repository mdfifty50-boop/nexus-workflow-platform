import { Router, Request, Response } from 'express'
import { meetingService } from '../services/meetingService.js'

const router = Router()

// Middleware to extract Clerk user ID
const extractClerkUserId = (req: Request, _res: Response, next: () => void) => {
  const userId = req.headers['x-clerk-user-id'] as string
  if (userId) {
    req.body.clerk_user_id = userId
  }
  next()
}

// =============================================================================
// Meeting CRUD Routes
// =============================================================================

/**
 * POST /api/meetings
 * Create a new meeting
 */
router.post('/', extractClerkUserId, async (req: Request, res: Response) => {
  const { project_id, title, recording_url, clerk_user_id } = req.body

  if (!clerk_user_id) {
    return res.status(401).json({ success: false, error: 'Authentication required' })
  }

  if (!project_id || !title) {
    return res.status(400).json({ success: false, error: 'project_id and title are required' })
  }

  const result = await meetingService.createMeeting(project_id, clerk_user_id, title, recording_url)

  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error })
  }

  res.json({ success: true, data: result.data })
})

/**
 * GET /api/meetings/project/:projectId
 * Get all meetings for a project
 */
router.get('/project/:projectId', extractClerkUserId, async (req: Request, res: Response) => {
  const { projectId } = req.params
  const clerkUserId = req.body.clerk_user_id

  if (!clerkUserId) {
    return res.status(401).json({ success: false, error: 'Authentication required' })
  }

  const meetings = await meetingService.getProjectMeetings(clerkUserId, projectId)

  res.json({ success: true, data: meetings })
})

/**
 * GET /api/meetings/:meetingId
 * Get a specific meeting
 */
router.get('/:meetingId', async (req: Request, res: Response) => {
  const { meetingId } = req.params

  const meeting = await meetingService.getMeeting(meetingId)

  if (!meeting) {
    return res.status(404).json({ success: false, error: 'Meeting not found' })
  }

  res.json({ success: true, data: meeting })
})

/**
 * DELETE /api/meetings/:meetingId
 * Delete a meeting
 */
router.delete('/:meetingId', extractClerkUserId, async (req: Request, res: Response) => {
  const { meetingId } = req.params
  const clerkUserId = req.body.clerk_user_id

  if (!clerkUserId) {
    return res.status(401).json({ success: false, error: 'Authentication required' })
  }

  const result = await meetingService.deleteMeeting(meetingId)

  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error })
  }

  res.json({ success: true, message: 'Meeting deleted' })
})

// =============================================================================
// Transcript Routes (Story 7.1, 7.3, 7.4)
// =============================================================================

/**
 * PUT /api/meetings/:meetingId/transcript
 * Update meeting with manual transcript
 */
router.put('/:meetingId/transcript', async (req: Request, res: Response) => {
  const { meetingId } = req.params
  const { transcript } = req.body

  if (!transcript) {
    return res.status(400).json({ success: false, error: 'transcript is required' })
  }

  const result = await meetingService.updateTranscript(meetingId, transcript)

  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error })
  }

  res.json({ success: true, message: 'Transcript updated' })
})

/**
 * POST /api/meetings/:meetingId/transcribe
 * Trigger transcription for a meeting with audio
 */
router.post('/:meetingId/transcribe', async (req: Request, res: Response) => {
  const { meetingId } = req.params

  const meeting = await meetingService.getMeeting(meetingId)

  if (!meeting) {
    return res.status(404).json({ success: false, error: 'Meeting not found' })
  }

  if (!meeting.recording_url) {
    return res.status(400).json({ success: false, error: 'No recording URL available' })
  }

  const result = await meetingService.transcribeAudio(meetingId, meeting.recording_url)

  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error })
  }

  res.json({ success: true, data: result.result })
})

/**
 * POST /api/meetings/:meetingId/translate
 * Trigger translation for a meeting with Arabic transcript
 */
router.post('/:meetingId/translate', async (req: Request, res: Response) => {
  const { meetingId } = req.params

  const meeting = await meetingService.getMeeting(meetingId)

  if (!meeting) {
    return res.status(404).json({ success: false, error: 'Meeting not found' })
  }

  if (!meeting.transcript) {
    return res.status(400).json({ success: false, error: 'No transcript available' })
  }

  if (meeting.transcript_language === 'en') {
    return res.status(400).json({ success: false, error: 'Transcript is already in English' })
  }

  const result = await meetingService.translateToEnglish(
    meetingId,
    meeting.transcript,
    meeting.transcript_language as 'ar' | 'ar-kw'
  )

  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error })
  }

  res.json({ success: true, data: { translation: result.translation } })
})

// =============================================================================
// SOP Extraction Routes (Story 7.5, 7.6)
// =============================================================================

/**
 * POST /api/meetings/:meetingId/extract-sops
 * Extract SOPs from meeting transcript
 */
router.post('/:meetingId/extract-sops', async (req: Request, res: Response) => {
  const { meetingId } = req.params

  const meeting = await meetingService.getMeeting(meetingId)

  if (!meeting) {
    return res.status(404).json({ success: false, error: 'Meeting not found' })
  }

  // Use translation if available, otherwise transcript
  const text = meeting.translation || meeting.transcript

  if (!text) {
    return res.status(400).json({ success: false, error: 'No transcript or translation available' })
  }

  const result = await meetingService.extractSOPs(meetingId, text)

  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error })
  }

  res.json({ success: true, data: { sops: result.sops } })
})

/**
 * POST /api/meetings/:meetingId/generate-workflow
 * Generate a workflow from an extracted SOP
 */
router.post('/:meetingId/generate-workflow', extractClerkUserId, async (req: Request, res: Response) => {
  const { meetingId } = req.params
  const { sop_id, clerk_user_id } = req.body

  if (!clerk_user_id) {
    return res.status(401).json({ success: false, error: 'Authentication required' })
  }

  const meeting = await meetingService.getMeeting(meetingId)

  if (!meeting) {
    return res.status(404).json({ success: false, error: 'Meeting not found' })
  }

  if (!meeting.extracted_sops || meeting.extracted_sops.length === 0) {
    return res.status(400).json({ success: false, error: 'No SOPs extracted from this meeting' })
  }

  // Find the specific SOP or use the first one
  const sop = sop_id
    ? meeting.extracted_sops.find(s => s.id === sop_id)
    : meeting.extracted_sops[0]

  if (!sop) {
    return res.status(404).json({ success: false, error: 'SOP not found' })
  }

  const result = await meetingService.generateWorkflowFromSOP(
    meeting.project_id,
    clerk_user_id,
    sop
  )

  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error })
  }

  res.json({
    success: true,
    data: { workflowId: result.workflowId },
    message: `Workflow "${sop.title}" created from SOP`,
  })
})

/**
 * POST /api/meetings/:meetingId/process
 * Run the full processing pipeline (transcribe → translate → extract)
 */
router.post('/:meetingId/process', async (req: Request, res: Response) => {
  const { meetingId } = req.params

  const result = await meetingService.processMeeting(meetingId)

  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error })
  }

  const meeting = await meetingService.getMeeting(meetingId)

  res.json({
    success: true,
    data: meeting,
    message: 'Meeting processed successfully',
  })
})

// =============================================================================
// Search Routes (Story 7.7)
// =============================================================================

/**
 * GET /api/meetings/search
 * Search across meeting transcripts
 */
router.get('/search', extractClerkUserId, async (req: Request, res: Response) => {
  const { q, project_id } = req.query
  const clerkUserId = req.body.clerk_user_id

  if (!clerkUserId) {
    return res.status(401).json({ success: false, error: 'Authentication required' })
  }

  if (!q || typeof q !== 'string') {
    return res.status(400).json({ success: false, error: 'Search query (q) is required' })
  }

  const results = await meetingService.searchTranscripts(
    clerkUserId,
    q,
    project_id as string | undefined
  )

  res.json({
    success: true,
    data: results,
    count: results.meetings.length,
  })
})

export default router
