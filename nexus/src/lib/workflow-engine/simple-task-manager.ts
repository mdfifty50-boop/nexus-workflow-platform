/**
 * Simple Task Manager
 *
 * Handles simple one-step tasks that don't require complex workflow execution.
 * Provides fast path for common operations like food ordering, quick messages, etc.
 */

import { apiClient } from '../api-client'
import { serviceIntegrations } from './service-integrations'
import type {
  SimpleTask,
  SimpleTaskType,
  SimpleTaskParseResult,
  SimpleTaskExecutionResult,
  SimpleTaskConfirmation,
  FoodOrderTask,
  RideRequestTask,
  QuickMessageTask,
  ReminderTask,
  CalendarEventTask,
} from '../../types/simple-task'

// ============================================================================
// Simple Task Manager Class
// ============================================================================

export class SimpleTaskManager {
  private tasks: Map<string, SimpleTask> = new Map()

  // ========================================
  // Detection & Parsing
  // ========================================

  /**
   * Detect if user input is a simple task (vs complex workflow)
   *
   * @param input - Natural language input from user
   * @returns Detection result with confidence score
   */
  async detectSimpleTask(input: string): Promise<SimpleTaskParseResult> {
    // startTime intentionally removed - timing not needed for detection

    try {
      // Use AI to detect task type and extract details
      const response = await apiClient.chat({
        messages: [
          {
            role: 'user',
            content: input,
          },
        ],
        systemPrompt: `You are a task classifier. Determine if the user's request is a simple one-step task.

Simple tasks include:
- food-order: "Order food to my home", "Get me pizza"
- ride-request: "Book a ride home", "Get me an Uber"
- quick-message: "Text John", "Email the team"
- reminder: "Remind me to call Sarah tomorrow"
- calendar-event: "Add meeting to calendar"
- note-creation: "Create a note about this"
- email-quick-send: "Send quick email to boss"
- payment-request: "Send $50 to John"
- quick-search: "Search my emails for contract"
- translation: "Translate this to Spanish"

Respond with JSON:
{
  "isSimpleTask": boolean,
  "taskType": "food-order" | "ride-request" | etc,
  "confidence": 0.0 to 1.0,
  "details": { extracted details },
  "requiresClarification": boolean,
  "clarificationQuestions": [{ "field": "...", "question": "...", "options": [...] }]
}

If the request is complex (multiple steps, conditional logic, data processing), set isSimpleTask to false.`,
        model: 'claude-3-5-haiku-20241022',
        maxTokens: 1000,
      })

      if (!response.success || !response.output) {
        return {
          isSimpleTask: false,
          confidence: 0,
          requiresClarification: false,
        }
      }

      // Parse AI response
      const jsonMatch = response.output.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return {
          isSimpleTask: false,
          confidence: 0,
          requiresClarification: false,
        }
      }

      const result = JSON.parse(jsonMatch[0])

      // If simple task detected, create task object
      if (result.isSimpleTask && result.taskType) {
        const task = this.createTaskFromDetection(input, result.taskType, result.details)
        return {
          isSimpleTask: true,
          taskType: result.taskType,
          confidence: result.confidence || 0.8,
          task,
          requiresClarification: result.requiresClarification || false,
          clarificationQuestions: result.clarificationQuestions || [],
        }
      }

      return {
        isSimpleTask: false,
        confidence: result.confidence || 0,
        requiresClarification: false,
      }
    } catch (error) {
      console.error('[SimpleTaskManager] Detection error:', error)
      return {
        isSimpleTask: false,
        confidence: 0,
        requiresClarification: false,
      }
    }
  }

  /**
   * Create a task object from detection results
   */
  private createTaskFromDetection(
    input: string,
    taskType: SimpleTaskType,
    details: Record<string, unknown>
  ): SimpleTask {
    const taskId = `stask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    const baseTask = {
      id: taskId,
      type: taskType,
      status: 'pending' as const,
      originalInput: input,
      createdAt: now,
      updatedAt: now,
    }

    // Type-specific task creation
    switch (taskType) {
      case 'food-order':
        return {
          ...baseTask,
          type: 'food-order',
          details: {
            restaurant: details.restaurant || { name: 'Unknown Restaurant' },
            items: details.items || [],
            deliveryAddress: details.deliveryAddress || { street: '', city: '' },
            totalPrice: details.totalPrice || 0,
            currency: details.currency || 'AED',
            specialInstructions: details.specialInstructions,
            paymentMethod: details.paymentMethod,
          },
        } as FoodOrderTask

      case 'ride-request':
        return {
          ...baseTask,
          type: 'ride-request',
          details: {
            pickup: details.pickup || { address: '' },
            destination: details.destination || { address: '' },
            rideType: (details.rideType as 'economy' | 'comfort' | 'premium') || 'economy',
            estimatedPrice: details.estimatedPrice,
            estimatedTime: details.estimatedTime,
            notes: details.notes,
          },
        } as RideRequestTask

      case 'quick-message':
        return {
          ...baseTask,
          type: 'quick-message',
          details: {
            recipient: details.recipient || { contact: '', type: 'phone' },
            message: details.message || '',
            scheduled: details.scheduled,
            priority: (details.priority as 'normal' | 'high' | 'urgent') || 'normal',
          },
        } as QuickMessageTask

      case 'reminder':
        return {
          ...baseTask,
          type: 'reminder',
          details: {
            title: details.title || '',
            description: details.description,
            scheduledFor: details.scheduledFor || new Date().toISOString(),
            repeatPattern: (details.repeatPattern as 'once' | 'daily' | 'weekly' | 'monthly') || 'once',
            notificationChannels: (details.notificationChannels as Array<'app' | 'email' | 'sms'>) || ['app'],
          },
        } as ReminderTask

      case 'calendar-event':
        return {
          ...baseTask,
          type: 'calendar-event',
          details: {
            title: details.title || '',
            description: details.description,
            startTime: details.startTime || new Date().toISOString(),
            endTime: details.endTime || new Date(Date.now() + 3600000).toISOString(),
            location: details.location,
            attendees: details.attendees as string[],
            reminder: details.reminder as number,
          },
        } as CalendarEventTask

      default:
        // Generic task for other types
        return {
          ...baseTask,
          details: details,
        } as SimpleTask
    }
  }

  // ========================================
  // Confirmation Generation
  // ========================================

  /**
   * Generate a user-friendly confirmation for a simple task
   *
   * @param task - The simple task to confirm
   * @returns Confirmation object for UI display
   */
  generateConfirmation(task: SimpleTask): SimpleTaskConfirmation {
    const confirmation: SimpleTaskConfirmation = {
      taskId: task.id,
      taskType: task.type,
      summary: {
        title: '',
        description: '',
        keyDetails: [],
      },
    }

    // Type-specific confirmation
    switch (task.type) {
      case 'food-order': {
        const foodTask = task as FoodOrderTask
        confirmation.summary = {
          title: `Order from ${foodTask.details.restaurant.name}`,
          description: `${foodTask.details.items.length} items will be delivered to ${foodTask.details.deliveryAddress.street}`,
          keyDetails: [
            {
              label: 'Restaurant',
              value: foodTask.details.restaurant.name,
            },
            {
              label: 'Items',
              value: foodTask.details.items.map(i => `${i.quantity}x ${i.name}`).join(', '),
            },
            {
              label: 'Delivery Address',
              value: `${foodTask.details.deliveryAddress.street}, ${foodTask.details.deliveryAddress.city}`,
            },
            {
              label: 'Total',
              value: `${foodTask.details.currency} ${foodTask.details.totalPrice.toFixed(2)}`,
            },
          ],
        }
        confirmation.estimatedCost = {
          amount: foodTask.details.totalPrice,
          currency: foodTask.details.currency,
        }
        confirmation.estimatedTime = foodTask.details.restaurant.estimatedDeliveryTime || '30-45 minutes'
        confirmation.requiresAuth = true
        confirmation.authService = 'talabat'
        break
      }

      case 'ride-request': {
        const rideTask = task as RideRequestTask
        confirmation.summary = {
          title: `Book ${rideTask.details.rideType} ride`,
          description: `From ${rideTask.details.pickup.address} to ${rideTask.details.destination.address}`,
          keyDetails: [
            {
              label: 'Pickup',
              value: rideTask.details.pickup.address,
            },
            {
              label: 'Destination',
              value: rideTask.details.destination.address,
            },
            {
              label: 'Ride Type',
              value: rideTask.details.rideType.charAt(0).toUpperCase() + rideTask.details.rideType.slice(1),
            },
          ],
        }
        if (rideTask.details.estimatedPrice) {
          confirmation.estimatedCost = {
            amount: rideTask.details.estimatedPrice,
            currency: 'AED',
          }
        }
        confirmation.estimatedTime = rideTask.details.estimatedTime || '5-10 minutes'
        confirmation.requiresAuth = true
        confirmation.authService = 'uber'
        break
      }

      case 'quick-message': {
        const msgTask = task as QuickMessageTask
        confirmation.summary = {
          title: 'Send message',
          description: `Send ${msgTask.details.recipient.type} message to ${msgTask.details.recipient.name || msgTask.details.recipient.contact}`,
          keyDetails: [
            {
              label: 'Recipient',
              value: msgTask.details.recipient.name || msgTask.details.recipient.contact,
            },
            {
              label: 'Method',
              value: msgTask.details.recipient.type.toUpperCase(),
            },
            {
              label: 'Message',
              value: msgTask.details.message,
            },
          ],
        }
        confirmation.estimatedTime = 'Instant'
        confirmation.requiresAuth = msgTask.details.recipient.type === 'whatsapp' || msgTask.details.recipient.type === 'email'
        break
      }

      case 'reminder': {
        const reminderTask = task as ReminderTask
        confirmation.summary = {
          title: 'Set reminder',
          description: reminderTask.details.title,
          keyDetails: [
            {
              label: 'Reminder',
              value: reminderTask.details.title,
            },
            {
              label: 'When',
              value: new Date(reminderTask.details.scheduledFor).toLocaleString(),
            },
            {
              label: 'Repeat',
              value: reminderTask.details.repeatPattern || 'Once',
            },
          ],
        }
        confirmation.estimatedTime = 'Instant'
        break
      }

      case 'calendar-event': {
        const calTask = task as CalendarEventTask
        confirmation.summary = {
          title: 'Add calendar event',
          description: calTask.details.title,
          keyDetails: [
            {
              label: 'Event',
              value: calTask.details.title,
            },
            {
              label: 'Start',
              value: new Date(calTask.details.startTime).toLocaleString(),
            },
            {
              label: 'End',
              value: new Date(calTask.details.endTime).toLocaleString(),
            },
          ],
        }
        if (calTask.details.location) {
          confirmation.summary.keyDetails.push({
            label: 'Location',
            value: calTask.details.location,
          })
        }
        confirmation.estimatedTime = 'Instant'
        confirmation.requiresAuth = true
        confirmation.authService = 'google_calendar'
        break
      }

      default:
        confirmation.summary = {
          title: `Execute ${task.type}`,
          description: task.originalInput,
          keyDetails: [],
        }
    }

    return confirmation
  }

  // ========================================
  // Execution
  // ========================================

  /**
   * Execute a confirmed simple task
   *
   * @param taskId - ID of the task to execute
   * @returns Execution result
   */
  async executeTask(taskId: string): Promise<SimpleTaskExecutionResult> {
    const startTime = Date.now()
    const task = this.tasks.get(taskId)

    if (!task) {
      return {
        success: false,
        taskId,
        status: 'failed',
        error: 'Task not found',
        userMessage: 'Task not found. It may have expired or been cancelled.',
        executionTimeMs: Date.now() - startTime,
      }
    }

    // Update task status
    task.status = 'executing'
    task.updatedAt = new Date().toISOString()
    this.tasks.set(taskId, task)

    try {
      let result: unknown
      let userMessage = ''

      // Execute based on task type
      switch (task.type) {
        case 'food-order':
          result = await this.executeFoodOrder(task as FoodOrderTask)
          userMessage = `Order placed successfully! Your food will arrive in approximately ${(task as FoodOrderTask).details.restaurant.estimatedDeliveryTime || '30-45 minutes'}.`
          break

        case 'ride-request':
          result = await this.executeRideRequest(task as RideRequestTask)
          userMessage = `Ride booked successfully! Your driver will arrive in approximately ${(task as RideRequestTask).details.estimatedTime || '5-10 minutes'}.`
          break

        case 'quick-message':
          result = await this.executeQuickMessage(task as QuickMessageTask)
          userMessage = `Message sent successfully!`
          break

        case 'reminder':
          result = await this.executeReminder(task as ReminderTask)
          userMessage = `Reminder set for ${new Date((task as ReminderTask).details.scheduledFor).toLocaleString()}.`
          break

        case 'calendar-event':
          result = await this.executeCalendarEvent(task as CalendarEventTask)
          userMessage = `Calendar event created successfully!`
          break

        default:
          throw new Error(`Unsupported task type: ${task.type}`)
      }

      // Update task status
      task.status = 'completed'
      task.completedAt = new Date().toISOString()
      this.tasks.set(taskId, task)

      return {
        success: true,
        taskId,
        status: 'completed',
        result,
        userMessage,
        executionTimeMs: Date.now() - startTime,
      }
    } catch (error) {
      task.status = 'failed'
      task.error = error instanceof Error ? error.message : String(error)
      task.updatedAt = new Date().toISOString()
      this.tasks.set(taskId, task)

      return {
        success: false,
        taskId,
        status: 'failed',
        error: task.error,
        userMessage: `Failed to execute task: ${task.error}`,
        executionTimeMs: Date.now() - startTime,
      }
    }
  }

  // ========================================
  // Task-Specific Execution Methods
  // ========================================

  private async executeFoodOrder(task: FoodOrderTask): Promise<unknown> {
    // Use service integrations to place order
    const result = await serviceIntegrations.executeAction(
      'talabat',
      'place_order',
      {
        restaurantId: task.details.restaurant.id,
        items: task.details.items,
        deliveryAddress: task.details.deliveryAddress,
        paymentMethodId: task.details.paymentMethod || 'default',
        instructions: task.details.specialInstructions,
      }
    )

    if (!result.success) {
      throw new Error(result.error || 'Failed to place order')
    }

    // Update task with confirmation
    task.confirmation = {
      orderId: (result.data as any)?.orderId,
      estimatedDelivery: (result.data as any)?.estimatedDelivery,
      trackingUrl: (result.data as any)?.trackingUrl,
    }

    return result.data
  }

  private async executeRideRequest(task: RideRequestTask): Promise<unknown> {
    // Simulate ride booking API call
    return {
      rideId: `ride_${Date.now()}`,
      driverName: 'Ahmed',
      vehicleInfo: 'Toyota Camry - ABC 1234',
      eta: task.details.estimatedTime || '8 minutes',
    }
  }

  private async executeQuickMessage(task: QuickMessageTask): Promise<unknown> {
    const { recipient, message } = task.details

    switch (recipient.type) {
      case 'whatsapp':
        return await serviceIntegrations.executeAction('whatsapp', 'send_message', {
          to: recipient.contact,
          message,
        })

      case 'email':
        return await serviceIntegrations.executeAction('email', 'send_email', {
          to: recipient.contact,
          subject: 'Quick message',
          body: message,
        })

      case 'phone':
        return await serviceIntegrations.executeAction('sms', 'send_sms', {
          to: recipient.contact,
          body: message,
        })

      default:
        throw new Error(`Unsupported message type: ${recipient.type}`)
    }
  }

  private async executeReminder(task: ReminderTask): Promise<unknown> {
    // Store reminder in system (would integrate with notification service)
    return {
      reminderId: `reminder_${Date.now()}`,
      scheduledFor: task.details.scheduledFor,
      channels: task.details.notificationChannels,
    }
  }

  private async executeCalendarEvent(_task: CalendarEventTask): Promise<unknown> {
    // Would integrate with Google Calendar or other calendar service
    return {
      eventId: `event_${Date.now()}`,
      calendarLink: `https://calendar.google.com/event?id=event_${Date.now()}`,
    }
  }

  // ========================================
  // Task Management
  // ========================================

  /**
   * Store a task for later execution
   */
  storeTask(task: SimpleTask): void {
    this.tasks.set(task.id, task)
  }

  /**
   * Get a task by ID
   */
  getTask(taskId: string): SimpleTask | undefined {
    return this.tasks.get(taskId)
  }

  /**
   * Cancel a pending task
   */
  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId)
    if (task && task.status === 'pending') {
      task.status = 'cancelled'
      task.updatedAt = new Date().toISOString()
      this.tasks.set(taskId, task)
      return true
    }
    return false
  }

  /**
   * Get all tasks
   */
  getAllTasks(): SimpleTask[] {
    return Array.from(this.tasks.values())
  }

  /**
   * Clear completed/cancelled tasks older than specified time
   */
  clearOldTasks(olderThanMs: number = 86400000): number {
    const now = Date.now()
    let cleared = 0

    for (const [id, task] of this.tasks.entries()) {
      if (
        (task.status === 'completed' || task.status === 'cancelled') &&
        now - new Date(task.updatedAt).getTime() > olderThanMs
      ) {
        this.tasks.delete(id)
        cleared++
      }
    }

    return cleared
  }
}

// ========================================
// Singleton Export
// ========================================

export const simpleTaskManager = new SimpleTaskManager()
