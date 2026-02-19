/**
 * WhatsApp Approval Delivery
 * Formats and sends approval requests via WhatsApp
 * Users can respond from their phone without opening Nexus
 * @NEXUS-FIX-183: WhatsApp approval delivery - DO NOT REMOVE
 */

import type { ApprovalRequest } from './hitl-types'

// ============================================================================
// Types
// ============================================================================

export interface WhatsAppApprovalConfig {
  mode?: 'binary' | 'review_edit' | 'choose_path'
  approvalReason?: string
  approvalMessage?: string
  riskLevel?: string
  editableFields?: Array<{
    field: string
    label: string
    currentValue: unknown
    type: string
  }>
  pathOptions?: Array<{
    id: string
    label: string
    description?: string
  }>
}

export interface WhatsAppApprovalMessage {
  text: string
  mode: string
}

// ============================================================================
// Response Normalization (Arabic + English)
// ============================================================================

const APPROVAL_RESPONSES = new Set([
  'yes', 'y', 'approve', 'approved', 'ok', 'confirm', 'go', 'proceed',
  'نعم', 'اي', 'موافق', 'تمام', 'اوكي', 'صح',
])

const REJECTION_RESPONSES = new Set([
  'no', 'n', 'reject', 'rejected', 'cancel', 'stop', 'deny',
  'لا', 'رفض', 'الغاء', 'وقف',
])

/**
 * Normalize a WhatsApp response body for matching
 */
export function normalizeResponse(body: string): string {
  return body.trim().toLowerCase()
}

/**
 * Check if a response indicates approval
 */
export function isApprovalResponse(body: string): boolean {
  return APPROVAL_RESPONSES.has(normalizeResponse(body))
}

/**
 * Check if a response indicates rejection
 */
export function isRejectionResponse(body: string): boolean {
  return REJECTION_RESPONSES.has(normalizeResponse(body))
}

// ============================================================================
// Message Formatting
// ============================================================================

/**
 * Format an approval request as a WhatsApp message
 */
export function formatApprovalMessage(
  request: Partial<ApprovalRequest> & { workflowName?: string; stepName?: string },
  config: WhatsAppApprovalConfig,
  nexusUrl?: string
): WhatsAppApprovalMessage {
  const mode = config.mode || 'binary'
  const workflowName = request.workflowName || 'Workflow'
  const stepName = request.stepName || 'Step'
  const requestId = (request as any).id || (request as any).requestId || 'unknown'
  const approveUrl = nexusUrl ? `${nexusUrl}/approve/${requestId}` : ''

  switch (mode) {
    case 'choose_path':
      return formatChoosePathMessage(workflowName, stepName, config, approveUrl)
    case 'review_edit':
      return formatReviewEditMessage(workflowName, stepName, config, approveUrl)
    case 'binary':
    default:
      return formatBinaryMessage(workflowName, stepName, config, approveUrl)
  }
}

function formatBinaryMessage(
  workflowName: string,
  stepName: string,
  config: WhatsAppApprovalConfig,
  approveUrl: string
): WhatsAppApprovalMessage {
  const reason = config.approvalReason || config.approvalMessage || 'Review required'

  let text = `Nexus Approval Required\n\n`
  text += `Workflow: ${workflowName}\n`
  text += `Step: ${stepName}\n`
  text += `Reason: ${reason}\n\n`
  text += `Reply:\n`
  text += `  YES / نعم - Approve\n`
  text += `  NO / لا - Reject\n`
  if (approveUrl) {
    text += `\nFor more options: ${approveUrl}`
  }

  return { text, mode: 'binary' }
}

function formatChoosePathMessage(
  workflowName: string,
  stepName: string,
  config: WhatsAppApprovalConfig,
  approveUrl: string
): WhatsAppApprovalMessage {
  let text = `Nexus: Choose Next Step\n\n`
  text += `Workflow: ${workflowName}\n`
  text += `Decision: ${stepName}\n\n`
  text += `Reply with number:\n`

  if (config.pathOptions) {
    config.pathOptions.forEach((opt, idx) => {
      text += `  ${idx + 1}. ${opt.label}`
      if (opt.description) text += ` - ${opt.description}`
      text += `\n`
    })
    text += `  0. Cancel workflow\n`
  }

  if (approveUrl) {
    text += `\nFull details: ${approveUrl}`
  }

  return { text, mode: 'choose_path' }
}

function formatReviewEditMessage(
  workflowName: string,
  stepName: string,
  config: WhatsAppApprovalConfig,
  approveUrl: string
): WhatsAppApprovalMessage {
  let text = `Nexus Approval Required\n\n`
  text += `Workflow: ${workflowName}\n`
  text += `Step: ${stepName}\n`

  if (config.editableFields && config.editableFields.length > 0) {
    text += `Details:\n`
    for (const field of config.editableFields) {
      text += `  ${field.label}: ${field.currentValue}\n`
    }
  }

  text += `\nReply YES to approve as-is, or open Nexus to modify:\n`
  if (approveUrl) {
    text += approveUrl
  }

  return { text, mode: 'review_edit' }
}

// ============================================================================
// WhatsApp Response Parsing
// ============================================================================

export interface ParsedApprovalResponse {
  decision: 'approved' | 'rejected'
  additionalData?: Record<string, unknown>
  raw: string
}

/**
 * Parse a WhatsApp response into an approval decision
 */
export function parseWhatsAppResponse(
  body: string,
  mode: string,
  config?: WhatsAppApprovalConfig
): ParsedApprovalResponse {
  const normalized = normalizeResponse(body)

  if (mode === 'choose_path' && config?.pathOptions) {
    // Try to parse as a number (option selection)
    const optionIndex = parseInt(normalized) - 1
    if (optionIndex >= 0 && optionIndex < config.pathOptions.length) {
      return {
        decision: 'approved',
        additionalData: { selectedPath: config.pathOptions[optionIndex].id },
        raw: body,
      }
    }
    // Not a valid number - check for cancel/reject
    if (isRejectionResponse(body) || normalized === 'cancel' || normalized === '0') {
      return { decision: 'rejected', raw: body }
    }
    // Invalid input - default to reject
    return { decision: 'rejected', raw: body }
  }

  // Binary and review_edit modes
  if (isApprovalResponse(body)) {
    return { decision: 'approved', raw: body }
  }
  if (isRejectionResponse(body)) {
    return { decision: 'rejected', raw: body }
  }

  // Unknown response - default to reject for safety
  return { decision: 'rejected', raw: body }
}

/**
 * Generate a confirmation message after decision
 */
export function getConfirmationMessage(decision: 'approved' | 'rejected'): string {
  return decision === 'approved'
    ? 'Approved! Workflow continuing...'
    : 'Rejected. Workflow stopped.'
}
