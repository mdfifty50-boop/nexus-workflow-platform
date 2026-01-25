/**
 * Simple Task Manager Tests
 *
 * Verify that simple tasks execute properly:
 * 1. Quick task detection works
 * 2. Direct execution path exists
 * 3. Results are returned promptly
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SimpleTaskManager } from './simple-task-manager'
import type { SimpleTask } from '../../types/simple-task'

// Mock the API client
vi.mock('../api-client', () => ({
  apiClient: {
    chat: vi.fn(),
  },
}))

// Mock service integrations
vi.mock('./service-integrations', () => ({
  serviceIntegrations: {
    executeAction: vi.fn(),
  },
}))

describe('SimpleTaskManager', () => {
  let manager: SimpleTaskManager

  beforeEach(() => {
    manager = new SimpleTaskManager()
    vi.clearAllMocks()
  })

  describe('Quick Task Detection', () => {
    it('should detect simple email task with high confidence', async () => {
      const { apiClient } = await import('../api-client')

      // Mock AI detection response
      vi.mocked(apiClient.chat).mockResolvedValue({
        success: true,
        output: JSON.stringify({
          isSimpleTask: true,
          taskType: 'email-quick-send',
          confidence: 0.95,
          details: {
            to: 'john@example.com',
            subject: 'Quick hello',
            body: 'Hi John, just saying hello!',
          },
          requiresClarification: false,
        }),
      })

      const result = await manager.detectSimpleTask('Send email to john@example.com saying hello')

      expect(result.isSimpleTask).toBe(true)
      expect(result.taskType).toBe('email-quick-send')
      expect(result.confidence).toBeGreaterThan(0.7)
      expect(result.task).toBeDefined()
      expect(result.requiresClarification).toBe(false)
    })

    it('should detect food order task', async () => {
      const { apiClient } = await import('../api-client')

      vi.mocked(apiClient.chat).mockResolvedValue({
        success: true,
        output: JSON.stringify({
          isSimpleTask: true,
          taskType: 'food-order',
          confidence: 0.9,
          details: {
            restaurant: { name: 'Pizza Place' },
            items: [{ name: 'Pepperoni Pizza', quantity: 1, price: 15 }],
            deliveryAddress: { street: '123 Main St', city: 'Dubai' },
            totalPrice: 15,
            currency: 'AED',
          },
          requiresClarification: false,
        }),
      })

      const result = await manager.detectSimpleTask('Order pizza to my home')

      expect(result.isSimpleTask).toBe(true)
      expect(result.taskType).toBe('food-order')
      expect(result.task).toBeDefined()
    })

    it('should detect reminder task', async () => {
      const { apiClient } = await import('../api-client')

      vi.mocked(apiClient.chat).mockResolvedValue({
        success: true,
        output: JSON.stringify({
          isSimpleTask: true,
          taskType: 'reminder',
          confidence: 0.92,
          details: {
            title: 'Call Sarah',
            scheduledFor: new Date(Date.now() + 86400000).toISOString(),
            repeatPattern: 'once',
            notificationChannels: ['app'],
          },
          requiresClarification: false,
        }),
      })

      const result = await manager.detectSimpleTask('Remind me to call Sarah tomorrow')

      expect(result.isSimpleTask).toBe(true)
      expect(result.taskType).toBe('reminder')
      expect(result.confidence).toBeGreaterThan(0.7)
    })

    it('should reject complex multi-step workflows', async () => {
      const { apiClient } = await import('../api-client')

      vi.mocked(apiClient.chat).mockResolvedValue({
        success: true,
        output: JSON.stringify({
          isSimpleTask: false,
          confidence: 0.3,
          requiresClarification: false,
        }),
      })

      const result = await manager.detectSimpleTask(
        'Search my emails, extract all invoice numbers, create a spreadsheet, and email it to my boss'
      )

      expect(result.isSimpleTask).toBe(false)
      expect(result.confidence).toBeLessThan(0.5)
    })

    it('should handle low confidence with fallback to workflow', async () => {
      const { apiClient } = await import('../api-client')

      vi.mocked(apiClient.chat).mockResolvedValue({
        success: true,
        output: JSON.stringify({
          isSimpleTask: true,
          taskType: 'quick-message',
          confidence: 0.6, // Below 0.7 threshold
          details: {
            recipient: { contact: 'john@example.com', type: 'email' },
            message: 'Hello',
          },
          requiresClarification: false,
        }),
      })

      const result = await manager.detectSimpleTask('Maybe send something to John?')

      expect(result.isSimpleTask).toBe(true)
      expect(result.confidence).toBeLessThan(0.7)
      // Task is still created but caller should fall back to workflow
    })
  })

  describe('Direct Execution Path', () => {
    it('should execute reminder task immediately', async () => {
      const task: SimpleTask = {
        id: 'task_123',
        type: 'reminder',
        status: 'pending',
        originalInput: 'Remind me to call Sarah tomorrow',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        details: {
          title: 'Call Sarah',
          scheduledFor: new Date(Date.now() + 86400000).toISOString(),
          repeatPattern: 'once',
          notificationChannels: ['app'],
        },
      }

      manager.storeTask(task)

      const result = await manager.executeTask(task.id)

      expect(result.success).toBe(true)
      expect(result.status).toBe('completed')
      expect(result.executionTimeMs).toBeLessThan(1000) // Should be fast
      expect(result.userMessage).toContain('Reminder set')
    })

    it('should execute quick message task', async () => {
      const { serviceIntegrations } = await import('./service-integrations')

      vi.mocked(serviceIntegrations.executeAction).mockResolvedValue({
        success: true,
        data: { messageId: 'msg_123' },
      })

      const task: SimpleTask = {
        id: 'task_456',
        type: 'quick-message',
        status: 'pending',
        originalInput: 'Text John that I will be late',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        details: {
          recipient: {
            name: 'John',
            contact: '+1234567890',
            type: 'phone',
          },
          message: 'I will be late',
          priority: 'normal',
        },
      }

      manager.storeTask(task)

      const result = await manager.executeTask(task.id)

      expect(result.success).toBe(true)
      expect(result.status).toBe('completed')
      expect(result.userMessage).toBe('Message sent successfully!')
      expect(serviceIntegrations.executeAction).toHaveBeenCalledWith(
        'sms',
        'send_sms',
        {
          to: '+1234567890',
          body: 'I will be late',
        }
      )
    })

    it('should execute calendar event task', async () => {
      const task: SimpleTask = {
        id: 'task_789',
        type: 'calendar-event',
        status: 'pending',
        originalInput: 'Add meeting tomorrow at 10am',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        details: {
          title: 'Team Meeting',
          startTime: new Date(Date.now() + 86400000).toISOString(),
          endTime: new Date(Date.now() + 90000000).toISOString(),
        },
      }

      manager.storeTask(task)

      const result = await manager.executeTask(task.id)

      expect(result.success).toBe(true)
      expect(result.status).toBe('completed')
      expect(result.executionTimeMs).toBeLessThan(1000)
      expect(result.result).toHaveProperty('eventId')
    })

    it('should handle execution errors gracefully', async () => {
      const { serviceIntegrations } = await import('./service-integrations')

      // Mock service to throw an error
      vi.mocked(serviceIntegrations.executeAction).mockRejectedValue(
        new Error('API rate limit exceeded')
      )

      const task: SimpleTask = {
        id: 'task_error',
        type: 'quick-message',
        status: 'pending',
        originalInput: 'Send message',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        details: {
          recipient: { contact: 'test@example.com', type: 'email' },
          message: 'Test',
          priority: 'normal',
        },
      }

      manager.storeTask(task)

      const result = await manager.executeTask(task.id)

      expect(result.success).toBe(false)
      expect(result.status).toBe('failed')
      expect(result.error).toContain('API rate limit exceeded')
    })
  })

  describe('Prompt Result Returns', () => {
    it('should return results within 2 seconds for simple tasks', async () => {
      const task: SimpleTask = {
        id: 'task_fast',
        type: 'reminder',
        status: 'pending',
        originalInput: 'Remind me',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        details: {
          title: 'Test',
          scheduledFor: new Date().toISOString(),
          repeatPattern: 'once',
          notificationChannels: ['app'],
        },
      }

      manager.storeTask(task)

      const startTime = Date.now()
      const result = await manager.executeTask(task.id)
      const executionTime = Date.now() - startTime

      expect(executionTime).toBeLessThan(2000) // 2 seconds max
      expect(result.executionTimeMs).toBeLessThan(2000)
    })

    it('should include execution time in result', async () => {
      const { serviceIntegrations } = await import('./service-integrations')

      // Mock service with a small delay to ensure execution time > 0
      vi.mocked(serviceIntegrations.executeAction).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: {} }), 10))
      )

      const task: SimpleTask = {
        id: 'task_timing',
        type: 'quick-message',
        status: 'pending',
        originalInput: 'Send message',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        details: {
          recipient: { contact: 'test@example.com', type: 'email' },
          message: 'Test',
          priority: 'normal',
        },
      }

      manager.storeTask(task)

      const result = await manager.executeTask(task.id)

      expect(result).toHaveProperty('executionTimeMs')
      expect(typeof result.executionTimeMs).toBe('number')
      expect(result.executionTimeMs).toBeGreaterThan(0)
    })
  })

  describe('Confirmation Generation', () => {
    it('should generate user-friendly confirmation for food order', () => {
      const task: SimpleTask = {
        id: 'task_food',
        type: 'food-order',
        status: 'pending',
        originalInput: 'Order pizza',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        details: {
          restaurant: { name: 'Pizza Hut', estimatedDeliveryTime: '30-45 minutes' },
          items: [
            { name: 'Pepperoni Pizza', quantity: 1, price: 15 },
            { name: 'Garlic Bread', quantity: 1, price: 5 },
          ],
          deliveryAddress: { street: '123 Main St', city: 'Dubai' },
          totalPrice: 20,
          currency: 'AED',
        },
      }

      const confirmation = manager.generateConfirmation(task)

      expect(confirmation.taskId).toBe(task.id)
      expect(confirmation.taskType).toBe('food-order')
      expect(confirmation.summary.title).toContain('Pizza Hut')
      expect(confirmation.summary.keyDetails).toHaveLength(4)
      expect(confirmation.estimatedCost).toEqual({ amount: 20, currency: 'AED' })
      expect(confirmation.estimatedTime).toBe('30-45 minutes')
      expect(confirmation.requiresAuth).toBe(true)
    })

    it('should generate confirmation for quick message', () => {
      const task: SimpleTask = {
        id: 'task_msg',
        type: 'quick-message',
        status: 'pending',
        originalInput: 'Text John',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        details: {
          recipient: { name: 'John', contact: '+1234567890', type: 'phone' },
          message: 'Hello!',
          priority: 'normal',
        },
      }

      const confirmation = manager.generateConfirmation(task)

      expect(confirmation.summary.title).toBe('Send message')
      expect(confirmation.summary.keyDetails.some(d => d.label === 'Recipient')).toBe(true)
      expect(confirmation.summary.keyDetails.some(d => d.value === 'Hello!')).toBe(true)
      expect(confirmation.estimatedTime).toBe('Instant')
    })
  })

  describe('Task Management', () => {
    it('should store and retrieve tasks', () => {
      const task: SimpleTask = {
        id: 'task_store',
        type: 'reminder',
        status: 'pending',
        originalInput: 'Test',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        details: {
          title: 'Test',
          scheduledFor: new Date().toISOString(),
          repeatPattern: 'once',
          notificationChannels: ['app'],
        },
      }

      manager.storeTask(task)

      const retrieved = manager.getTask(task.id)
      expect(retrieved).toEqual(task)
    })

    it('should cancel pending tasks', () => {
      const task: SimpleTask = {
        id: 'task_cancel',
        type: 'reminder',
        status: 'pending',
        originalInput: 'Test',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        details: {
          title: 'Test',
          scheduledFor: new Date().toISOString(),
          repeatPattern: 'once',
          notificationChannels: ['app'],
        },
      }

      manager.storeTask(task)

      const cancelled = manager.cancelTask(task.id)
      expect(cancelled).toBe(true)

      const retrieved = manager.getTask(task.id)
      expect(retrieved?.status).toBe('cancelled')
    })

    it('should clear old completed tasks', async () => {
      const oldTask: SimpleTask = {
        id: 'task_old',
        type: 'reminder',
        status: 'completed',
        originalInput: 'Old task',
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        updatedAt: new Date(Date.now() - 172800000).toISOString(),
        details: {
          title: 'Old',
          scheduledFor: new Date().toISOString(),
          repeatPattern: 'once',
          notificationChannels: ['app'],
        },
      }

      manager.storeTask(oldTask)

      const cleared = manager.clearOldTasks(86400000) // Clear tasks older than 1 day

      expect(cleared).toBe(1)
      expect(manager.getTask(oldTask.id)).toBeUndefined()
    })
  })
})
