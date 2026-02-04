/**
 * Client Communication Tracker Service
 * @NEXUS-FIX-086: Client follow-up tracking and automation
 *
 * Tracks client communications, detects inactivity, and triggers
 * automated follow-ups via WhatsApp/Email.
 *
 * Storage Backends:
 * - 'memory': In-memory storage (demo/dev mode)
 * - 'notion': Notion database integration
 * - 'supabase': Supabase database (when available)
 */

import { composioService } from './ComposioService'

// Types for client tracking
export interface Client {
  id: string
  name: string
  email?: string
  phone?: string // WhatsApp number
  company?: string
  lawyerId: string
  lawyerEmail: string
  lawyerName: string
  lastContactDate: string // ISO date
  lastContactType: 'email' | 'phone' | 'whatsapp' | 'meeting' | 'other'
  lastContactSummary?: string
  status: 'active' | 'inactive' | 'new' | 'at-risk' | 'churned'
  followUpDays: number // Days of inactivity before follow-up
  autoFollowUp: boolean // Automatically send client check-in
  priority: 'high' | 'normal' | 'low'
  tags: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ClientContact {
  id: string
  clientId: string
  type: 'email' | 'phone' | 'whatsapp' | 'meeting' | 'other'
  direction: 'inbound' | 'outbound'
  summary: string
  date: string
  lawyerId: string
  metadata?: Record<string, unknown>
}

export interface InactiveClientAlert {
  client: Client
  daysSinceContact: number
  recommendedAction: string
  autoFollowUpSent: boolean
}

export interface CreateClientParams {
  name: string
  email?: string
  phone?: string
  company?: string
  lawyerEmail: string
  lawyerName: string
  followUpDays?: number
  autoFollowUp?: boolean
  priority?: Client['priority']
  tags?: string[]
}

export interface LogContactParams {
  clientId: string
  type: ClientContact['type']
  direction: ClientContact['direction']
  summary: string
  date?: string // Defaults to now
}

type StorageBackend = 'memory' | 'notion' | 'supabase'

class ClientCommunicationServiceClass {
  private backend: StorageBackend = 'memory'
  private clients: Map<string, Client> = new Map()
  private contacts: Map<string, ClientContact[]> = new Map() // clientId -> contacts
  private notionDatabaseId?: string

  constructor() {
    this.loadDemoData()
  }

  /**
   * Set storage backend
   */
  setBackend(backend: StorageBackend, config?: { notionDbId?: string }): void {
    this.backend = backend
    if (config?.notionDbId) {
      this.notionDatabaseId = config.notionDbId
    }
    console.log(`[ClientCommunicationService] Backend set to: ${backend}`)
  }

  /**
   * Add a new client to tracking
   */
  async addClient(
    params: CreateClientParams,
    userId?: string
  ): Promise<{ success: boolean; client?: Client; error?: string }> {
    try {
      const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date().toISOString()

      const client: Client = {
        id: clientId,
        name: params.name,
        email: params.email,
        phone: params.phone,
        company: params.company,
        lawyerId: userId || 'unknown',
        lawyerEmail: params.lawyerEmail,
        lawyerName: params.lawyerName,
        lastContactDate: now,
        lastContactType: 'other',
        lastContactSummary: 'Client added to system',
        status: 'new',
        followUpDays: params.followUpDays || 14, // Default: 2 weeks
        autoFollowUp: params.autoFollowUp || false,
        priority: params.priority || 'normal',
        tags: params.tags || [],
        createdAt: now,
        updatedAt: now
      }

      // Store based on backend
      if (this.backend === 'notion') {
        await this.syncToNotion(client, userId)
      }

      this.clients.set(clientId, client)
      this.contacts.set(clientId, [])

      return { success: true, client }
    } catch (error) {
      console.error('Error adding client:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add client'
      }
    }
  }

  /**
   * Log a contact/communication with client
   */
  async logContact(
    params: LogContactParams,
    userId?: string
  ): Promise<{ success: boolean; contact?: ClientContact; error?: string }> {
    try {
      const client = this.clients.get(params.clientId)
      if (!client) {
        return { success: false, error: 'Client not found' }
      }

      const contactId = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
      const contactDate = params.date || new Date().toISOString()

      const contact: ClientContact = {
        id: contactId,
        clientId: params.clientId,
        type: params.type,
        direction: params.direction,
        summary: params.summary,
        date: contactDate,
        lawyerId: userId || 'unknown'
      }

      // Update client's last contact info
      client.lastContactDate = contactDate
      client.lastContactType = params.type
      client.lastContactSummary = params.summary
      client.status = 'active'
      client.updatedAt = new Date().toISOString()

      // Store contact
      const clientContacts = this.contacts.get(params.clientId) || []
      clientContacts.push(contact)
      this.contacts.set(params.clientId, clientContacts)

      // Sync to Notion if using that backend
      if (this.backend === 'notion') {
        await this.syncToNotion(client, userId)
      }

      return { success: true, contact }
    } catch (error) {
      console.error('Error logging contact:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to log contact'
      }
    }
  }

  /**
   * Get clients who haven't been contacted in X days
   */
  async getInactiveClients(
    lawyerEmail: string,
    userId?: string
  ): Promise<{
    success: boolean
    inactive: InactiveClientAlert[]
    error?: string
  }> {
    try {
      const now = Date.now()
      const inactive: InactiveClientAlert[] = []

      for (const client of this.clients.values()) {
        if (client.lawyerEmail !== lawyerEmail) continue

        const lastContactMs = new Date(client.lastContactDate).getTime()
        const daysSinceContact = Math.floor((now - lastContactMs) / (1000 * 60 * 60 * 24))

        if (daysSinceContact >= client.followUpDays) {
          // Update status
          if (daysSinceContact >= client.followUpDays * 2) {
            client.status = 'at-risk'
          } else {
            client.status = 'inactive'
          }

          inactive.push({
            client,
            daysSinceContact,
            recommendedAction: this.getRecommendedAction(client, daysSinceContact),
            autoFollowUpSent: false
          })
        }
      }

      // Sort by days since contact (most inactive first)
      inactive.sort((a, b) => b.daysSinceContact - a.daysSinceContact)

      return { success: true, inactive }
    } catch (error) {
      console.error('Error getting inactive clients:', error)
      return {
        success: false,
        inactive: [],
        error: error instanceof Error ? error.message : 'Failed to get inactive clients'
      }
    }
  }

  /**
   * Send follow-up reminder to lawyer about inactive client
   */
  async sendLawyerReminder(
    clientId: string,
    userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const client = this.clients.get(clientId)
      if (!client) {
        return { success: false, error: 'Client not found' }
      }

      const daysSinceContact = Math.floor(
        (Date.now() - new Date(client.lastContactDate).getTime()) / (1000 * 60 * 60 * 24)
      )

      // Send WhatsApp reminder to lawyer
      if (client.phone) {
        await composioService.executeAction(
          'WHATSAPP_SEND_MESSAGE',
          {
            to: client.lawyerEmail.replace('@', '_whatsapp@'), // Assume lawyer WhatsApp
            message: `📋 Client Follow-Up Reminder

Client: ${client.name}
${client.company ? `Company: ${client.company}` : ''}
Last contact: ${daysSinceContact} days ago
Last interaction: ${client.lastContactSummary || 'N/A'}

⏰ This client is past their ${client.followUpDays}-day check-in threshold.

Reply with what you'd like to do:
1️⃣ I'll call them today
2️⃣ Send auto check-in message
3️⃣ Mark as contacted
4️⃣ Snooze for 7 days`
          },
          userId
        )
      }

      // Also send email
      await composioService.executeAction(
        'GMAIL_SEND_EMAIL',
        {
          to: client.lawyerEmail,
          subject: `⏰ Follow-up needed: ${client.name} (${daysSinceContact} days)`,
          body: `
Client Follow-Up Reminder

You haven't been in contact with this client for ${daysSinceContact} days:

Client: ${client.name}
${client.company ? `Company: ${client.company}` : ''}
Email: ${client.email || 'N/A'}
Phone: ${client.phone || 'N/A'}
Priority: ${client.priority.toUpperCase()}

Last Contact:
- Date: ${new Date(client.lastContactDate).toLocaleDateString()}
- Type: ${client.lastContactType}
- Summary: ${client.lastContactSummary || 'N/A'}

${client.autoFollowUp ? '✅ Auto follow-up is enabled. A check-in message will be sent if no action is taken within 24 hours.' : '❌ Auto follow-up is disabled.'}

---
Nexus Client Communication Tracker
          `.trim()
        },
        userId
      )

      return { success: true }
    } catch (error) {
      console.error('Error sending lawyer reminder:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send reminder'
      }
    }
  }

  /**
   * Send automated check-in message to client
   */
  async sendClientCheckIn(
    clientId: string,
    message?: string,
    userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const client = this.clients.get(clientId)
      if (!client) {
        return { success: false, error: 'Client not found' }
      }

      const checkInMessage = message || `
Hi ${client.name.split(' ')[0]},

I hope you're doing well! I wanted to check in and see how things are going.

Is there anything you need help with, or any updates on your matters that we should discuss?

Feel free to reach out if you have any questions or would like to schedule a call.

Best regards,
${client.lawyerName}
      `.trim()

      // Prefer WhatsApp if phone available
      if (client.phone) {
        await composioService.executeAction(
          'WHATSAPP_SEND_MESSAGE',
          {
            to: client.phone,
            message: checkInMessage
          },
          userId
        )
      } else if (client.email) {
        await composioService.executeAction(
          'GMAIL_SEND_EMAIL',
          {
            to: client.email,
            subject: `Checking In - ${client.lawyerName}`,
            body: checkInMessage
          },
          userId
        )
      } else {
        return { success: false, error: 'No contact method available for client' }
      }

      // Log the contact
      await this.logContact(
        {
          clientId,
          type: client.phone ? 'whatsapp' : 'email',
          direction: 'outbound',
          summary: 'Automated check-in message sent'
        },
        userId
      )

      return { success: true }
    } catch (error) {
      console.error('Error sending client check-in:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send check-in'
      }
    }
  }

  /**
   * Get all clients for a lawyer
   */
  getClients(lawyerEmail: string): Client[] {
    return Array.from(this.clients.values()).filter(c => c.lawyerEmail === lawyerEmail)
  }

  /**
   * Get client by ID
   */
  getClient(clientId: string): Client | undefined {
    return this.clients.get(clientId)
  }

  /**
   * Get contact history for a client
   */
  getContactHistory(clientId: string): ClientContact[] {
    return this.contacts.get(clientId) || []
  }

  /**
   * Update client settings
   */
  updateClient(
    clientId: string,
    updates: Partial<Pick<Client, 'followUpDays' | 'autoFollowUp' | 'priority' | 'tags' | 'notes'>>
  ): Client | undefined {
    const client = this.clients.get(clientId)
    if (!client) return undefined

    Object.assign(client, updates, { updatedAt: new Date().toISOString() })
    return client
  }

  /**
   * Run daily check for inactive clients
   */
  async runDailyCheck(userId?: string): Promise<{
    success: boolean
    remindersSet: number
    autoFollowUpsSent: number
    error?: string
  }> {
    try {
      let remindersSet = 0
      let autoFollowUpsSent = 0

      // Get unique lawyer emails
      const lawyerEmails = new Set(Array.from(this.clients.values()).map(c => c.lawyerEmail))

      for (const email of lawyerEmails) {
        const result = await this.getInactiveClients(email, userId)
        if (!result.success || !result.inactive.length) continue

        for (const alert of result.inactive) {
          // Send reminder to lawyer
          await this.sendLawyerReminder(alert.client.id, userId)
          remindersSet++

          // Send auto follow-up if enabled and very inactive
          if (alert.client.autoFollowUp && alert.daysSinceContact >= alert.client.followUpDays * 1.5) {
            await this.sendClientCheckIn(alert.client.id, undefined, userId)
            autoFollowUpsSent++
          }
        }
      }

      return { success: true, remindersSet, autoFollowUpsSent }
    } catch (error) {
      console.error('Error running daily check:', error)
      return {
        success: false,
        remindersSet: 0,
        autoFollowUpsSent: 0,
        error: error instanceof Error ? error.message : 'Failed to run daily check'
      }
    }
  }

  // Helper: Sync client to Notion
  private async syncToNotion(client: Client, userId?: string): Promise<void> {
    if (!this.notionDatabaseId) return

    try {
      await composioService.executeAction(
        'NOTION_CREATE_PAGE',
        {
          parent: { database_id: this.notionDatabaseId },
          properties: {
            Name: { title: [{ text: { content: client.name } }] },
            Email: { email: client.email },
            Phone: { phone_number: client.phone },
            Company: { rich_text: [{ text: { content: client.company || '' } }] },
            Status: { select: { name: client.status } },
            Priority: { select: { name: client.priority } },
            'Last Contact': { date: { start: client.lastContactDate } },
            Lawyer: { rich_text: [{ text: { content: client.lawyerName } }] }
          }
        },
        userId
      )
    } catch (error) {
      console.error('Error syncing to Notion:', error)
    }
  }

  // Helper: Get recommended action based on inactivity
  private getRecommendedAction(client: Client, daysSinceContact: number): string {
    if (daysSinceContact >= client.followUpDays * 3) {
      return '🚨 URGENT: Schedule call immediately - client at high churn risk'
    }
    if (daysSinceContact >= client.followUpDays * 2) {
      return '⚠️ HIGH PRIORITY: Personal outreach recommended'
    }
    if (client.priority === 'high') {
      return '📞 Call to check in - high priority client'
    }
    return '📧 Send check-in email or WhatsApp'
  }

  // Helper: Load demo data
  private loadDemoData(): void {
    const demoClients: CreateClientParams[] = [
      {
        name: 'Ahmed Al-Rashid',
        email: 'ahmed@alrashid-group.kw',
        phone: '+96599123456',
        company: 'Al-Rashid Group',
        lawyerEmail: 'lawyer@firm.com',
        lawyerName: 'Sarah Johnson',
        followUpDays: 14,
        autoFollowUp: true,
        priority: 'high',
        tags: ['corporate', 'vip']
      },
      {
        name: 'Fatima Hassan',
        email: 'fatima@hassan-legal.com',
        phone: '+96597654321',
        company: 'Hassan Legal Consultants',
        lawyerEmail: 'lawyer@firm.com',
        lawyerName: 'Sarah Johnson',
        followUpDays: 21,
        autoFollowUp: false,
        priority: 'normal',
        tags: ['litigation']
      }
    ]

    // Add demo clients with staggered last contact dates
    demoClients.forEach((params, i) => {
      const client: Client = {
        id: `demo_client_${i + 1}`,
        ...params,
        lawyerId: 'demo_lawyer',
        lastContactDate: new Date(Date.now() - (10 + i * 10) * 24 * 60 * 60 * 1000).toISOString(),
        lastContactType: 'email',
        lastContactSummary: 'Discussed contract renewal',
        status: i === 0 ? 'active' : 'inactive',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      this.clients.set(client.id, client)
      this.contacts.set(client.id, [])
    })

    console.log(`[ClientCommunicationService] Loaded ${demoClients.length} demo clients`)
  }
}

// Export singleton instance
export const clientCommunicationService = new ClientCommunicationServiceClass()
export default clientCommunicationService
