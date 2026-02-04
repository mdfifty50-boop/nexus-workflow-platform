/**
 * WhatsAppComposioService Unit Tests
 *
 * Tests for the WhatsApp Business API integration via Composio
 * @see server/services/WhatsAppComposioService.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest'
import {
  whatsAppComposioService,
  SendMessageParams,
  SendButtonsParams,
  SendListParams,
  IncomingMessageWebhook,
  NEXUS_TEMPLATES
} from '../../../server/services/WhatsAppComposioService'
import { composioService } from '../../../server/services/ComposioService'

// Mock the ComposioService
vi.mock('../../../server/services/ComposioService', () => ({
  composioService: {
    executeTool: vi.fn(),
    checkConnection: vi.fn(),
    initiateConnection: vi.fn(),
  },
}))

describe('WhatsAppComposioService', () => {
  const mockExecuteTool = composioService.executeTool as Mock
  const mockCheckConnection = composioService.checkConnection as Mock

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset service state by accessing internal method
    // Open a session window for test phone number
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('sendMessage', () => {
    const testPhone = '+96550123456'
    const testMessage = 'Hello, this is a test message'

    it('should send message successfully when session window is open', async () => {
      // Open session window first (simulate customer message)
      whatsAppComposioService.openSessionWindow(testPhone)

      mockExecuteTool.mockResolvedValueOnce({
        success: true,
        data: { messages: [{ id: 'msg_123' }] },
      })

      const params: SendMessageParams = {
        to: testPhone,
        text: testMessage,
      }

      const result = await whatsAppComposioService.sendMessage(params)

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('msg_123')
      expect(mockExecuteTool).toHaveBeenCalledWith(
        'WHATSAPP_SEND_MESSAGE',
        expect.objectContaining({
          to: testPhone,
          text: testMessage,
        })
      )
    })

    it('should fail when session window is expired', async () => {
      // Don't open session window - it should be closed by default
      const params: SendMessageParams = {
        to: '+96599999999', // Different phone, no open window
        text: testMessage,
      }

      const result = await whatsAppComposioService.sendMessage(params)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Session window expired')
      expect(mockExecuteTool).not.toHaveBeenCalled()
    })

    it('should truncate messages exceeding 4096 characters', async () => {
      whatsAppComposioService.openSessionWindow(testPhone)

      mockExecuteTool.mockResolvedValueOnce({
        success: true,
        data: { messages: [{ id: 'msg_456' }] },
      })

      const longMessage = 'A'.repeat(5000) // Exceeds 4096 limit
      const params: SendMessageParams = {
        to: testPhone,
        text: longMessage,
      }

      await whatsAppComposioService.sendMessage(params)

      expect(mockExecuteTool).toHaveBeenCalledWith(
        'WHATSAPP_SEND_MESSAGE',
        expect.objectContaining({
          text: expect.stringMatching(/^A{4096}$/),
        })
      )
    })
  })

  describe('sendButtons', () => {
    const testPhone = '+96550123456'

    it('should send buttons successfully with valid count', async () => {
      mockExecuteTool.mockResolvedValueOnce({
        success: true,
        data: { messages: [{ id: 'msg_btn_123' }] },
      })

      const params: SendButtonsParams = {
        to: testPhone,
        bodyText: 'Choose an option:',
        buttons: [
          { id: 'btn_1', title: 'Option 1' },
          { id: 'btn_2', title: 'Option 2' },
          { id: 'btn_3', title: 'Option 3' },
        ],
      }

      const result = await whatsAppComposioService.sendButtons(params)

      expect(result.success).toBe(true)
      expect(mockExecuteTool).toHaveBeenCalledWith(
        'WHATSAPP_SEND_INTERACTIVE_BUTTONS',
        expect.anything()
      )
    })

    it('should fail when more than 3 buttons provided', async () => {
      const params: SendButtonsParams = {
        to: testPhone,
        bodyText: 'Choose an option:',
        buttons: [
          { id: 'btn_1', title: 'Option 1' },
          { id: 'btn_2', title: 'Option 2' },
          { id: 'btn_3', title: 'Option 3' },
          { id: 'btn_4', title: 'Option 4' }, // 4th button - exceeds limit
        ],
      }

      const result = await whatsAppComposioService.sendButtons(params)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Maximum 3 buttons allowed')
      expect(mockExecuteTool).not.toHaveBeenCalled()
    })

    it('should fail when button title exceeds 20 characters', async () => {
      const params: SendButtonsParams = {
        to: testPhone,
        bodyText: 'Choose an option:',
        buttons: [
          { id: 'btn_1', title: 'This title is way too long for WhatsApp' }, // >20 chars
        ],
      }

      const result = await whatsAppComposioService.sendButtons(params)

      expect(result.success).toBe(false)
      expect(result.error).toContain('exceeds 20 character limit')
      expect(mockExecuteTool).not.toHaveBeenCalled()
    })
  })

  describe('sendList', () => {
    const testPhone = '+96550123456'

    it('should send list successfully with valid sections', async () => {
      mockExecuteTool.mockResolvedValueOnce({
        success: true,
        data: { messages: [{ id: 'msg_list_123' }] },
      })

      const params: SendListParams = {
        to: testPhone,
        bodyText: 'Select from menu:',
        buttonText: 'View Menu',
        sections: [
          {
            title: 'Section 1',
            rows: [
              { id: 'row_1', title: 'Item 1' },
              { id: 'row_2', title: 'Item 2' },
            ],
          },
        ],
      }

      const result = await whatsAppComposioService.sendList(params)

      expect(result.success).toBe(true)
      expect(mockExecuteTool).toHaveBeenCalledWith(
        'WHATSAPP_SEND_INTERACTIVE_LIST',
        expect.anything()
      )
    })

    it('should fail when more than 10 sections provided', async () => {
      const sections = Array.from({ length: 11 }, (_, i) => ({
        title: `Section ${i + 1}`,
        rows: [{ id: `row_${i}`, title: `Item ${i}` }],
      }))

      const params: SendListParams = {
        to: testPhone,
        bodyText: 'Select from menu:',
        buttonText: 'View Menu',
        sections,
      }

      const result = await whatsAppComposioService.sendList(params)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Maximum 10 sections allowed')
      expect(mockExecuteTool).not.toHaveBeenCalled()
    })

    it('should fail when section has more than 10 rows', async () => {
      const rows = Array.from({ length: 11 }, (_, i) => ({
        id: `row_${i}`,
        title: `Item ${i}`,
      }))

      const params: SendListParams = {
        to: testPhone,
        bodyText: 'Select from menu:',
        buttonText: 'View Menu',
        sections: [{ title: 'Section 1', rows }],
      }

      const result = await whatsAppComposioService.sendList(params)

      expect(result.success).toBe(false)
      expect(result.error).toContain('exceeds 10 row limit')
      expect(mockExecuteTool).not.toHaveBeenCalled()
    })

    it('should fail when row title exceeds 24 characters', async () => {
      const params: SendListParams = {
        to: testPhone,
        bodyText: 'Select from menu:',
        buttonText: 'View Menu',
        sections: [
          {
            title: 'Section 1',
            rows: [
              { id: 'row_1', title: 'This title is definitely too long for row' },
            ],
          },
        ],
      }

      const result = await whatsAppComposioService.sendList(params)

      expect(result.success).toBe(false)
      expect(result.error).toContain('exceeds 24 character limit')
      expect(mockExecuteTool).not.toHaveBeenCalled()
    })
  })

  describe('getConversationWindow', () => {
    it('should return closed window for unknown phone', () => {
      const window = whatsAppComposioService.getConversationWindow('+96511111111')

      expect(window.isOpen).toBe(false)
      expect(window.recipientPhone).toBe('+96511111111')
    })

    it('should return open window after openSessionWindow', () => {
      const phone = '+96522222222'
      whatsAppComposioService.openSessionWindow(phone)

      const window = whatsAppComposioService.getConversationWindow(phone)

      expect(window.isOpen).toBe(true)
      expect(window.recipientPhone).toBe(phone)
      // Window should expire in ~24 hours
      const hoursUntilExpiry = (window.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)
      expect(hoursUntilExpiry).toBeGreaterThan(23)
      expect(hoursUntilExpiry).toBeLessThanOrEqual(24)
    })
  })

  describe('phone number normalization', () => {
    it('should normalize Kuwait local number to E.164', async () => {
      whatsAppComposioService.openSessionWindow('50123456')

      mockExecuteTool.mockResolvedValueOnce({
        success: true,
        data: { messages: [{ id: 'msg_norm' }] },
      })

      await whatsAppComposioService.sendMessage({
        to: '50123456',
        text: 'Test',
      })

      expect(mockExecuteTool).toHaveBeenCalledWith(
        'WHATSAPP_SEND_MESSAGE',
        expect.objectContaining({
          to: '+96550123456',
        })
      )
    })

    it('should preserve valid E.164 format', async () => {
      const e164Phone = '+96550123456'
      whatsAppComposioService.openSessionWindow(e164Phone)

      mockExecuteTool.mockResolvedValueOnce({
        success: true,
        data: { messages: [{ id: 'msg_e164' }] },
      })

      await whatsAppComposioService.sendMessage({
        to: e164Phone,
        text: 'Test',
      })

      expect(mockExecuteTool).toHaveBeenCalledWith(
        'WHATSAPP_SEND_MESSAGE',
        expect.objectContaining({
          to: e164Phone,
        })
      )
    })

    it('should handle 00 prefix international format', async () => {
      const phone = '0096550123456'
      whatsAppComposioService.openSessionWindow(phone)

      mockExecuteTool.mockResolvedValueOnce({
        success: true,
        data: { messages: [{ id: 'msg_00' }] },
      })

      await whatsAppComposioService.sendMessage({
        to: phone,
        text: 'Test',
      })

      expect(mockExecuteTool).toHaveBeenCalledWith(
        'WHATSAPP_SEND_MESSAGE',
        expect.objectContaining({
          to: '+96550123456',
        })
      )
    })
  })

  describe('checkConnection', () => {
    it('should return connected status with business info', async () => {
      mockCheckConnection.mockResolvedValueOnce({
        connected: true,
        accountId: 'acc_123',
      })

      mockExecuteTool.mockResolvedValueOnce({
        success: true,
        data: { name: 'Test Business', description: 'Test Desc' },
      })

      const status = await whatsAppComposioService.checkConnection()

      expect(status.connected).toBe(true)
      expect(status.businessName).toBe('Test Business')
    })

    it('should return disconnected status', async () => {
      mockCheckConnection.mockResolvedValueOnce({
        connected: false,
      })

      const status = await whatsAppComposioService.checkConnection()

      expect(status.connected).toBe(false)
      expect(status.businessName).toBeUndefined()
    })
  })

  describe('handleWebhook', () => {
    it('should process incoming message and open session window', async () => {
      const phone = '+96533333333'
      const webhook: IncomingMessageWebhook = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'entry_123',
            changes: [
              {
                field: 'messages',
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '+96512345678',
                    phone_number_id: 'phone_123',
                  },
                  messages: [
                    {
                      from: phone,
                      id: 'msg_incoming',
                      timestamp: '1234567890',
                      type: 'text',
                      text: { body: 'Hello from customer' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      }

      await whatsAppComposioService.handleWebhook(webhook)

      // Session window should now be open for this customer
      const window = whatsAppComposioService.getConversationWindow(phone)
      expect(window.isOpen).toBe(true)
    })

    it('should ignore unknown webhook objects', async () => {
      const webhook = {
        object: 'unknown_object',
        entry: [],
      } as unknown as IncomingMessageWebhook

      // Should not throw
      await expect(
        whatsAppComposioService.handleWebhook(webhook)
      ).resolves.not.toThrow()
    })
  })

  describe('smartSend', () => {
    const testPhone = '+96544444444'

    it('should use session message when window is open', async () => {
      whatsAppComposioService.openSessionWindow(testPhone)

      mockExecuteTool.mockResolvedValueOnce({
        success: true,
        data: { messages: [{ id: 'msg_smart_session' }] },
      })

      const result = await whatsAppComposioService.smartSend(
        testPhone,
        'Direct message',
        'PAYMENT_REMINDER',
        { amount: '100 KWD' }
      )

      expect(result.success).toBe(true)
      expect(mockExecuteTool).toHaveBeenCalledWith(
        'WHATSAPP_SEND_MESSAGE',
        expect.anything()
      )
    })

    it('should use template when window is closed and template provided', async () => {
      const closedPhone = '+96555555555' // No open window

      mockExecuteTool.mockResolvedValueOnce({
        success: true,
        data: { messages: [{ id: 'msg_smart_template' }] },
      })

      const result = await whatsAppComposioService.smartSend(
        closedPhone,
        'Reminder message',
        'PAYMENT_REMINDER',
        { amount: '100 KWD', due_date: '2026-02-15' }
      )

      expect(result.success).toBe(true)
      expect(mockExecuteTool).toHaveBeenCalledWith(
        'WHATSAPP_SEND_TEMPLATE_MESSAGE',
        expect.anything()
      )
    })

    it('should fail when window is closed and no template provided', async () => {
      const closedPhone = '+96566666666' // No open window

      const result = await whatsAppComposioService.smartSend(
        closedPhone,
        'Direct message without fallback'
        // No template or variables provided
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Session window expired')
      expect(mockExecuteTool).not.toHaveBeenCalled()
    })
  })

  describe('error formatting', () => {
    it('should return user-friendly error for rate limiting', async () => {
      whatsAppComposioService.openSessionWindow('+96577777777')

      mockExecuteTool.mockResolvedValueOnce({
        success: false,
        error: 'Error 130429: Rate limit exceeded',
      })

      const result = await whatsAppComposioService.sendMessage({
        to: '+96577777777',
        text: 'Test',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Too many messages sent')
    })

    it('should return user-friendly error for window expiry', async () => {
      whatsAppComposioService.openSessionWindow('+96588888888')

      mockExecuteTool.mockResolvedValueOnce({
        success: false,
        error: 'Error 131051: 24-hour window has expired',
      })

      const result = await whatsAppComposioService.sendMessage({
        to: '+96588888888',
        text: 'Test',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('24-hour messaging window has expired')
    })
  })

  describe('NEXUS_TEMPLATES', () => {
    it('should have all expected template keys', () => {
      // Lawyer templates
      expect(NEXUS_TEMPLATES.SIGNATURE_REMINDER).toBeDefined()
      expect(NEXUS_TEMPLATES.COURT_REMINDER).toBeDefined()
      expect(NEXUS_TEMPLATES.DOCUMENT_READY).toBeDefined()
      expect(NEXUS_TEMPLATES.PAYMENT_REMINDER_LEGAL).toBeDefined()

      // Doctor templates
      expect(NEXUS_TEMPLATES.APPOINTMENT_CONFIRM).toBeDefined()
      expect(NEXUS_TEMPLATES.APPOINTMENT_REMINDER).toBeDefined()
      expect(NEXUS_TEMPLATES.LAB_RESULTS_READY).toBeDefined()
      expect(NEXUS_TEMPLATES.PRESCRIPTION_READY).toBeDefined()

      // SME templates
      expect(NEXUS_TEMPLATES.INVOICE_SENT).toBeDefined()
      expect(NEXUS_TEMPLATES.PAYMENT_REMINDER).toBeDefined()
      expect(NEXUS_TEMPLATES.ORDER_CONFIRMATION).toBeDefined()
      expect(NEXUS_TEMPLATES.SHIPPING_UPDATE).toBeDefined()
    })
  })
})
