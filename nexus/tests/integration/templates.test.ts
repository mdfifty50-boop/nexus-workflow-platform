/**
 * Templates Integration Test (Move 6.7)
 *
 * Tests the verified workflow templates:
 * 1. Load both templates successfully
 * 2. Assert requiredIntegrations not empty
 * 3. Assert every task has integrationId + toolSlug + params
 * 4. Assert toolSlug validates using the same TOOL_SLUGS mapping
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

// TOOL_SLUGS mapping (same as in workflows.ts for validation consistency)
const TOOL_SLUGS: Record<string, Record<string, string>> = {
  gmail: { send: 'GMAIL_SEND_EMAIL', fetch: 'GMAIL_FETCH_EMAILS', default: 'GMAIL_SEND_EMAIL' },
  slack: { send: 'SLACK_SEND_MESSAGE', message: 'SLACK_SEND_MESSAGE', default: 'SLACK_SEND_MESSAGE' },
  googlesheets: { read: 'GOOGLESHEETS_BATCH_GET', write: 'GOOGLESHEETS_BATCH_UPDATE', append: 'GOOGLESHEETS_BATCH_UPDATE', default: 'GOOGLESHEETS_BATCH_GET' },
  sheets: { read: 'GOOGLESHEETS_BATCH_GET', append: 'GOOGLESHEETS_BATCH_UPDATE', default: 'GOOGLESHEETS_BATCH_GET' },
  googlecalendar: { create: 'GOOGLECALENDAR_CREATE_EVENT', list: 'GOOGLECALENDAR_EVENTS_LIST', default: 'GOOGLECALENDAR_CREATE_EVENT' },
  calendar: { create: 'GOOGLECALENDAR_CREATE_EVENT', list: 'GOOGLECALENDAR_EVENTS_LIST', default: 'GOOGLECALENDAR_CREATE_EVENT' },
  github: { issue: 'GITHUB_CREATE_ISSUE', create: 'GITHUB_CREATE_ISSUE', list: 'GITHUB_LIST_REPOSITORY_ISSUES', default: 'GITHUB_CREATE_ISSUE' },
  notion: { create: 'NOTION_CREATE_PAGE', page: 'NOTION_CREATE_PAGE', update: 'NOTION_UPDATE_PAGE', default: 'NOTION_CREATE_PAGE' },
  discord: { send: 'DISCORD_SEND_MESSAGE', message: 'DISCORD_SEND_MESSAGE', default: 'DISCORD_SEND_MESSAGE' },
  trello: { card: 'TRELLO_CREATE_CARD', create: 'TRELLO_CREATE_CARD', default: 'TRELLO_CREATE_CARD' },
  stripe: { customer: 'STRIPE_CREATE_CUSTOMER', charge: 'STRIPE_CREATE_CHARGE', default: 'STRIPE_CREATE_CUSTOMER' },
  twitter: { post: 'TWITTER_CREATE_TWEET', tweet: 'TWITTER_CREATE_TWEET', default: 'TWITTER_CREATE_TWEET' },
  whatsapp: { send: 'WHATSAPP_SEND_MESSAGE', message: 'WHATSAPP_SEND_MESSAGE', default: 'WHATSAPP_SEND_MESSAGE' },
  hubspot: { contact: 'HUBSPOT_CREATE_CONTACT', create: 'HUBSPOT_CREATE_CONTACT', default: 'HUBSPOT_CREATE_CONTACT' },
  linear: { create: 'LINEAR_CREATE_ISSUE', issue: 'LINEAR_CREATE_ISSUE', default: 'LINEAR_CREATE_ISSUE' },
  jira: { create: 'JIRA_CREATE_ISSUE', issue: 'JIRA_CREATE_ISSUE', default: 'JIRA_CREATE_ISSUE' },
}

/**
 * Validate a tool slug using the same logic as workflows.ts
 */
function validateToolSlug(toolSlug: string, integrationId: string): boolean {
  // If toolSlug already looks valid (uppercase with underscores), accept it
  if (/^[A-Z]+_[A-Z_]+$/.test(toolSlug)) {
    return true
  }

  // Try to resolve from integration
  const integration = integrationId.toLowerCase()
  if (TOOL_SLUGS[integration]) {
    const action = 'default'
    const resolved = TOOL_SLUGS[integration][action]
    return !!resolved
  }

  return false
}

interface WorkflowTemplate {
  id: string
  name: string
  description: string
  requiredIntegrations: string[]
  exampleUserInput: string
  keywords: string[]
  executionPlan: {
    tasks: Array<{
      id: string
      name: string
      type: string
      integrationId: string
      dependencies: string[]
      config: {
        toolSlug: string
        action?: string
        params: Record<string, unknown>
      }
    }>
    requiredIntegrations: string[]
  }
}

describe('Verified Workflow Templates (Move 6.7)', () => {
  let templates: WorkflowTemplate[] = []
  const templatesDir = join(__dirname, '../../src/workflows/templates')

  beforeAll(() => {
    // Load all template files
    const files = readdirSync(templatesDir).filter(f => f.endsWith('.json'))
    expect(files.length).toBeGreaterThanOrEqual(2)

    for (const file of files) {
      const content = readFileSync(join(templatesDir, file), 'utf-8')
      templates.push(JSON.parse(content))
    }
  })

  it('should load both templates successfully', () => {
    expect(templates.length).toBe(2)

    const templateIds = templates.map(t => t.id)
    expect(templateIds).toContain('whatsapp_lead_followup_to_crm')
    expect(templateIds).toContain('invoice_payment_update_accounting')
  })

  it('should have requiredIntegrations not empty for all templates', () => {
    for (const template of templates) {
      expect(template.requiredIntegrations).toBeDefined()
      expect(Array.isArray(template.requiredIntegrations)).toBe(true)
      expect(template.requiredIntegrations.length).toBeGreaterThan(0)
    }
  })

  it('should have every task with integrationId, toolSlug, and params', () => {
    for (const template of templates) {
      expect(template.executionPlan).toBeDefined()
      expect(template.executionPlan.tasks).toBeDefined()
      expect(template.executionPlan.tasks.length).toBeGreaterThan(0)

      for (const task of template.executionPlan.tasks) {
        expect(task.id).toBeDefined()
        expect(task.integrationId).toBeDefined()
        expect(task.config).toBeDefined()
        expect(task.config.toolSlug).toBeDefined()
        expect(task.config.params).toBeDefined()
        expect(typeof task.config.params).toBe('object')
      }
    }
  })

  it('should have valid toolSlugs that pass validation', () => {
    for (const template of templates) {
      for (const task of template.executionPlan.tasks) {
        const isValid = validateToolSlug(task.config.toolSlug, task.integrationId)
        expect(isValid).toBe(true)
      }
    }
  })

  it('should have matching requiredIntegrations in executionPlan', () => {
    for (const template of templates) {
      // All integrations used in tasks should be in requiredIntegrations
      const taskIntegrations = [...new Set(template.executionPlan.tasks.map(t => t.integrationId))]

      for (const integration of taskIntegrations) {
        expect(template.requiredIntegrations).toContain(integration)
      }
    }
  })
})
