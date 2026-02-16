/**
 * WhatsApp Campaign & Contact Routes
 *
 * Broadcast campaign management and contact CRUD for WhatsApp Business.
 * Extends the existing /api/whatsapp-business/ namespace.
 *
 * Campaign Endpoints:
 * - POST   /api/whatsapp-business/campaigns            - Create campaign
 * - GET    /api/whatsapp-business/campaigns             - List campaigns
 * - GET    /api/whatsapp-business/campaigns/:id         - Get campaign details
 * - POST   /api/whatsapp-business/campaigns/:id/execute - Execute/send campaign
 * - POST   /api/whatsapp-business/campaigns/:id/schedule - Schedule campaign
 * - DELETE /api/whatsapp-business/campaigns/:id         - Delete campaign
 *
 * Contact Endpoints:
 * - GET    /api/whatsapp-business/contacts              - List contacts
 * - POST   /api/whatsapp-business/contacts              - Add contact
 * - POST   /api/whatsapp-business/contacts/import       - Bulk import (CSV)
 * - DELETE /api/whatsapp-business/contacts/:phone       - Delete contact
 * - GET    /api/whatsapp-business/contacts/tags         - List all tags
 */

import { Router, Request, Response } from 'express'
import { campaignService } from '../services/CampaignService.js'
import { contactService } from '../services/ContactService.js'

const router = Router()

// =============================================================================
// CAMPAIGN ROUTES
// =============================================================================

/**
 * POST /campaigns
 * Create a new broadcast campaign
 *
 * Body: {
 *   name: string,
 *   templateId: string,           // Template name (used as templateName)
 *   recipients: string[],         // Phone numbers
 *   variables?: Record<string, string>,  // Global template variables
 *   scheduleTime?: string         // ISO datetime for scheduled send
 * }
 */
router.post('/campaigns', (req: Request, res: Response) => {
  try {
    const { name, templateId, recipients, variables, scheduleTime } = req.body

    if (!name || !templateId) {
      return res.status(400).json({
        success: false,
        error: 'name and templateId are required',
      })
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'recipients must be a non-empty array of phone numbers',
      })
    }

    const campaign = campaignService.createCampaign({
      name,
      templateName: templateId,
      recipients,
      variables: variables || {},
      scheduleTime,
    })

    // If scheduleTime was not provided and there is no explicit schedule,
    // auto-execute immediately
    if (!scheduleTime) {
      campaignService.executeCampaign(campaign.id).catch(error => {
        console.error(`[Campaigns Route] Auto-execute error for ${campaign.id}:`, error)
      })
    }

    res.status(201).json({
      success: true,
      campaign: campaignService.serializeCampaign(campaign),
    })
  } catch (error: unknown) {
    console.error('[Campaigns Route] Create error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create campaign',
    })
  }
})

/**
 * GET /campaigns
 * List all campaigns
 */
router.get('/campaigns', (_req: Request, res: Response) => {
  try {
    const campaigns = campaignService.listCampaigns()

    res.json({
      success: true,
      campaigns: campaigns.map(c => campaignService.serializeCampaign(c)),
      count: campaigns.length,
    })
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list campaigns',
    })
  }
})

/**
 * GET /campaigns/:id
 * Get campaign details including recipient-level results
 */
router.get('/campaigns/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const campaign = campaignService.getCampaign(id)

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found',
      })
    }

    res.json({
      success: true,
      campaign: campaignService.serializeCampaignDetails(campaign),
    })
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get campaign',
    })
  }
})

/**
 * POST /campaigns/:id/execute
 * Execute a campaign immediately
 */
router.post('/campaigns/:id/execute', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const campaign = await campaignService.executeCampaign(id)

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found',
      })
    }

    res.json({
      success: true,
      message: `Campaign "${campaign.name}" is now sending to ${campaign.stats.target} recipients`,
      campaign: campaignService.serializeCampaign(campaign),
    })
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute campaign',
    })
  }
})

/**
 * POST /campaigns/:id/schedule
 * Schedule a campaign for later
 *
 * Body: { scheduledAt: string }  (ISO datetime)
 */
router.post('/campaigns/:id/schedule', (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { scheduledAt } = req.body

    if (!scheduledAt) {
      return res.status(400).json({
        success: false,
        error: 'scheduledAt is required (ISO datetime string)',
      })
    }

    const scheduleDate = new Date(scheduledAt)
    if (isNaN(scheduleDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid datetime format',
      })
    }

    if (scheduleDate <= new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Schedule time must be in the future',
      })
    }

    const campaign = campaignService.scheduleCampaign(id, scheduleDate)

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found or cannot be scheduled',
      })
    }

    res.json({
      success: true,
      message: `Campaign "${campaign.name}" scheduled for ${scheduleDate.toISOString()}`,
      campaign: campaignService.serializeCampaign(campaign),
    })
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to schedule campaign',
    })
  }
})

/**
 * DELETE /campaigns/:id
 * Delete a campaign
 */
router.delete('/campaigns/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const deleted = campaignService.deleteCampaign(id)

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found or currently sending',
      })
    }

    res.json({
      success: true,
      message: 'Campaign deleted',
    })
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete campaign',
    })
  }
})

// =============================================================================
// CONTACT ROUTES
// =============================================================================

/**
 * GET /contacts
 * List contacts with optional filters
 *
 * Query params:
 * - tags: comma-separated tag filter
 * - search: search by name/phone
 * - limit: page size (default 100)
 * - offset: pagination offset
 */
router.get('/contacts', (req: Request, res: Response) => {
  try {
    const tags = req.query.tags
      ? (req.query.tags as string).split(',').filter(Boolean)
      : undefined

    const search = req.query.search as string | undefined
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined
    const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined

    const result = contactService.listContacts({ tags, search, limit, offset })

    // Map to frontend-expected format
    const contacts = result.contacts.map(c => ({
      id: c.phone,
      name: c.name,
      phoneNumber: c.phone,
      tags: c.tags,
      addedAt: c.addedAt.toISOString(),
      lastMessageAt: c.lastMessageAt?.toISOString() || null,
    }))

    res.json({
      success: true,
      contacts,
      total: result.total,
      count: contacts.length,
    })
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list contacts',
    })
  }
})

/**
 * POST /contacts
 * Add a new contact
 *
 * Body: { phone: string, name: string, tags?: string[] }
 */
router.post('/contacts', (req: Request, res: Response) => {
  try {
    const { phone, name, tags } = req.body

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'phone is required',
      })
    }

    const contact = contactService.addContact({
      phone,
      name: name || '',
      tags: tags || [],
    })

    res.status(201).json({
      success: true,
      contact: {
        id: contact.phone,
        name: contact.name,
        phoneNumber: contact.phone,
        tags: contact.tags,
        addedAt: contact.addedAt.toISOString(),
      },
    })
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add contact',
    })
  }
})

/**
 * POST /contacts/import
 * Bulk import contacts from CSV
 *
 * Body: { csvData: string }
 *
 * Expected CSV format:
 * phone,name,tags
 * +96550123456,Ahmed,customer;vip
 * +96551234567,Sara,lead
 */
router.post('/contacts/import', (req: Request, res: Response) => {
  try {
    const { csvData } = req.body

    if (!csvData || typeof csvData !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'csvData is required (string of CSV content)',
      })
    }

    const result = contactService.importContacts(csvData)

    res.json({
      success: true,
      imported: result.imported,
      skipped: result.skipped,
      errors: result.errors,
      totalContacts: contactService.getCount(),
    })
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import contacts',
    })
  }
})

/**
 * DELETE /contacts/:phone
 * Delete a contact by phone number
 */
router.delete('/contacts/:phone', (req: Request, res: Response) => {
  try {
    const { phone } = req.params
    const deleted = contactService.deleteContact(decodeURIComponent(phone))

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found',
      })
    }

    res.json({
      success: true,
      message: 'Contact deleted',
    })
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete contact',
    })
  }
})

/**
 * GET /contacts/tags
 * Get all unique tags across all contacts
 */
router.get('/contacts/tags', (_req: Request, res: Response) => {
  try {
    const tags = contactService.getAllTags()

    res.json({
      success: true,
      tags,
      count: tags.length,
    })
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list tags',
    })
  }
})

export default router
