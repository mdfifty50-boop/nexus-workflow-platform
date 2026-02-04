/**
 * Appointment Scheduling Service
 * @NEXUS-FIX-087: Appointment management via Calendly/Cal.com
 *
 * Manages medical/professional appointments with:
 * - Booking link generation
 * - WhatsApp confirmation
 * - Multi-level reminders
 * - Cancellation handling
 * - Google Calendar sync
 */

import { composioService } from './ComposioService'

// Types for appointment management
export interface Appointment {
  id: string
  schedulingProvider: 'calendly' | 'calcom' | 'google' // Which service hosts booking
  patientName: string
  patientPhone?: string // WhatsApp number
  patientEmail?: string
  doctorName: string
  doctorEmail: string
  clinicName?: string
  appointmentType: 'consultation' | 'followup' | 'procedure' | 'checkup' | 'other'
  date: string // ISO date
  time: string // HH:mm format
  duration: number // minutes
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'no-show' | 'completed'
  location?: string
  meetingLink?: string // For telehealth
  notes?: string
  remindersSent: {
    immediate: boolean
    day_before: boolean
    hours_before: boolean
    post_appointment: boolean
  }
  createdAt: string
  updatedAt: string
}

export interface CreateAppointmentParams {
  patientName: string
  patientPhone?: string
  patientEmail?: string
  doctorEmail: string
  doctorName: string
  clinicName?: string
  appointmentType: Appointment['appointmentType']
  date: string
  time: string
  duration?: number // Default 30 minutes
  location?: string
  notes?: string
}

export interface BookingLink {
  url: string
  provider: 'calendly' | 'calcom' | 'google'
  expiresAt?: string
}

class AppointmentServiceClass {
  private provider: 'calendly' | 'calcom' | 'google' = 'calendly' // Default to Calendly
  private appointments: Map<string, Appointment> = new Map()
  private demoMode: boolean = true

  /**
   * Set preferred scheduling provider
   */
  setProvider(provider: 'calendly' | 'calcom' | 'google'): void {
    this.provider = provider
    console.log(`[AppointmentService] Provider set to: ${provider}`)
  }

  /**
   * Generate booking link for a specific doctor/appointment type
   */
  async generateBookingLink(
    params: {
      doctorEmail: string
      appointmentType: Appointment['appointmentType']
      duration?: number
    },
    userId?: string
  ): Promise<{ success: boolean; link?: BookingLink; error?: string }> {
    try {
      let result
      const duration = params.duration || 30

      if (this.provider === 'calendly') {
        result = await composioService.executeAction(
          'CALENDLY_GET_USER_BUSY_TIMES',
          {
            user: params.doctorEmail
          },
          userId
        )

        // Generate Calendly link format
        const calendlyLink = `https://calendly.com/${params.doctorEmail.split('@')[0]}/${params.appointmentType}`

        return {
          success: true,
          link: {
            url: calendlyLink,
            provider: 'calendly'
          }
        }
      } else if (this.provider === 'calcom') {
        result = await composioService.executeAction(
          'CAL_CREATE_BOOKING_LINK',
          {
            eventTypeSlug: params.appointmentType,
            duration
          },
          userId
        )

        if (result.success && result.data?.link) {
          return {
            success: true,
            link: {
              url: result.data.link,
              provider: 'calcom'
            }
          }
        }
      }

      // Fallback demo link
      return {
        success: true,
        link: {
          url: `https://book.nexus.app/${params.doctorEmail.split('@')[0]}/${params.appointmentType}`,
          provider: this.provider
        }
      }
    } catch (error) {
      console.error('Error generating booking link:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate booking link'
      }
    }
  }

  /**
   * Create appointment and send confirmation
   */
  async createAppointment(
    params: CreateAppointmentParams,
    userId?: string
  ): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
    try {
      const appointmentId = `appt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date().toISOString()

      const appointment: Appointment = {
        id: appointmentId,
        schedulingProvider: this.provider,
        patientName: params.patientName,
        patientPhone: params.patientPhone,
        patientEmail: params.patientEmail,
        doctorName: params.doctorName,
        doctorEmail: params.doctorEmail,
        clinicName: params.clinicName,
        appointmentType: params.appointmentType,
        date: params.date,
        time: params.time,
        duration: params.duration || 30,
        status: 'scheduled',
        location: params.location,
        notes: params.notes,
        remindersSent: {
          immediate: false,
          day_before: false,
          hours_before: false,
          post_appointment: false
        },
        createdAt: now,
        updatedAt: now
      }

      // Create Google Calendar event
      await this.syncToCalendar(appointment, userId)

      // Send immediate confirmation
      await this.sendConfirmation(appointment, userId)

      // Schedule reminders
      await this.scheduleReminders(appointment, userId)

      this.appointments.set(appointmentId, appointment)

      return { success: true, appointment }
    } catch (error) {
      console.error('Error creating appointment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create appointment'
      }
    }
  }

  /**
   * Send appointment confirmation via WhatsApp/Email
   */
  async sendConfirmation(
    appointment: Appointment,
    userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const dateFormatted = new Date(appointment.date).toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      const message = `
✅ Appointment Confirmed!

Dear ${appointment.patientName},

Your appointment has been scheduled:

📅 Date: ${dateFormatted}
⏰ Time: ${appointment.time}
👨‍⚕️ Doctor: ${appointment.doctorName}
${appointment.clinicName ? `🏥 Clinic: ${appointment.clinicName}` : ''}
${appointment.location ? `📍 Location: ${appointment.location}` : ''}
⏱️ Duration: ${appointment.duration} minutes

${appointment.appointmentType === 'consultation' ? '📋 Please bring any relevant medical records or test results.' : ''}

You will receive reminders:
- 24 hours before
- 2 hours before

To reschedule or cancel, reply "CANCEL" or "RESCHEDULE".

Thank you for choosing ${appointment.clinicName || 'our clinic'}!
      `.trim()

      // Send via WhatsApp if phone available
      if (appointment.patientPhone) {
        await composioService.executeAction(
          'WHATSAPP_SEND_MESSAGE',
          {
            to: appointment.patientPhone,
            message
          },
          userId
        )
      }

      // Also send email if available
      if (appointment.patientEmail) {
        await composioService.executeAction(
          'GMAIL_SEND_EMAIL',
          {
            to: appointment.patientEmail,
            subject: `Appointment Confirmed - ${dateFormatted} at ${appointment.time}`,
            body: message.replace(/✅|📅|⏰|👨‍⚕️|🏥|📍|⏱️|📋/g, '') // Remove emojis for email
          },
          userId
        )
      }

      appointment.remindersSent.immediate = true
      appointment.status = 'confirmed'
      appointment.updatedAt = new Date().toISOString()

      return { success: true }
    } catch (error) {
      console.error('Error sending confirmation:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send confirmation'
      }
    }
  }

  /**
   * Send reminder (24h or 2h before)
   */
  async sendReminder(
    appointmentId: string,
    type: 'day_before' | 'hours_before',
    userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const appointment = this.appointments.get(appointmentId)
      if (!appointment) {
        return { success: false, error: 'Appointment not found' }
      }

      if (appointment.status === 'cancelled') {
        return { success: true } // Don't send reminders for cancelled appointments
      }

      const dateFormatted = new Date(appointment.date).toLocaleDateString('en-GB', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      })

      const isUrgent = type === 'hours_before'
      const timeframe = isUrgent ? '2 hours' : '24 hours'

      const message = `
${isUrgent ? '⏰ APPOINTMENT REMINDER' : '📅 Appointment Tomorrow'}

Dear ${appointment.patientName},

Your appointment is in ${timeframe}:

📅 ${dateFormatted}
⏰ ${appointment.time}
👨‍⚕️ ${appointment.doctorName}
${appointment.location ? `📍 ${appointment.location}` : ''}

${isUrgent ? '🚗 Please start heading to the clinic now if you haven\'t already.' : '📋 Remember to bring any required documents.'}

Reply "CONFIRM" to confirm, or "CANCEL" to cancel.
      `.trim()

      if (appointment.patientPhone) {
        await composioService.executeAction(
          'WHATSAPP_SEND_MESSAGE',
          {
            to: appointment.patientPhone,
            message
          },
          userId
        )
      }

      appointment.remindersSent[type] = true
      appointment.updatedAt = new Date().toISOString()

      return { success: true }
    } catch (error) {
      console.error('Error sending reminder:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send reminder'
      }
    }
  }

  /**
   * Send post-appointment feedback request
   */
  async sendFeedbackRequest(
    appointmentId: string,
    userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const appointment = this.appointments.get(appointmentId)
      if (!appointment) {
        return { success: false, error: 'Appointment not found' }
      }

      const message = `
🌟 How was your visit?

Dear ${appointment.patientName},

Thank you for visiting ${appointment.clinicName || 'our clinic'} today!

We'd love to hear about your experience with Dr. ${appointment.doctorName.split(' ')[0]}.

Rate your visit (reply with a number):
1️⃣ ⭐ - Needs Improvement
2️⃣ ⭐⭐ - Fair
3️⃣ ⭐⭐⭐ - Good
4️⃣ ⭐⭐⭐⭐ - Very Good
5️⃣ ⭐⭐⭐⭐⭐ - Excellent

Your feedback helps us improve!
      `.trim()

      if (appointment.patientPhone) {
        await composioService.executeAction(
          'WHATSAPP_SEND_MESSAGE',
          {
            to: appointment.patientPhone,
            message
          },
          userId
        )
      }

      appointment.remindersSent.post_appointment = true
      appointment.status = 'completed'
      appointment.updatedAt = new Date().toISOString()

      return { success: true }
    } catch (error) {
      console.error('Error sending feedback request:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send feedback request'
      }
    }
  }

  /**
   * Handle patient reply (confirm/cancel/reschedule)
   */
  async handlePatientReply(
    patientPhone: string,
    message: string,
    userId?: string
  ): Promise<{
    success: boolean
    action: 'confirmed' | 'cancelled' | 'reschedule_requested' | 'feedback_received' | 'unknown'
    response?: string
    error?: string
  }> {
    try {
      const normalizedMessage = message.toLowerCase().trim()

      // Find patient's upcoming appointment
      const appointment = Array.from(this.appointments.values()).find(
        a => a.patientPhone === patientPhone && ['scheduled', 'confirmed'].includes(a.status)
      )

      if (!appointment) {
        return {
          success: false,
          action: 'unknown',
          error: 'No upcoming appointment found'
        }
      }

      // Handle confirmation
      if (normalizedMessage.includes('confirm') || normalizedMessage === 'yes') {
        appointment.status = 'confirmed'
        appointment.updatedAt = new Date().toISOString()

        return {
          success: true,
          action: 'confirmed',
          response: `✅ Thank you! Your appointment on ${appointment.date} at ${appointment.time} is confirmed. See you then!`
        }
      }

      // Handle cancellation
      if (normalizedMessage.includes('cancel') || normalizedMessage === 'no') {
        appointment.status = 'cancelled'
        appointment.updatedAt = new Date().toISOString()

        // Notify doctor
        await composioService.executeAction(
          'GMAIL_SEND_EMAIL',
          {
            to: appointment.doctorEmail,
            subject: `Appointment Cancelled: ${appointment.patientName}`,
            body: `${appointment.patientName} has cancelled their appointment on ${appointment.date} at ${appointment.time}.`
          },
          userId
        )

        return {
          success: true,
          action: 'cancelled',
          response: `Your appointment has been cancelled. Would you like to schedule a new appointment? Reply "YES" to receive a booking link.`
        }
      }

      // Handle reschedule
      if (normalizedMessage.includes('reschedule') || normalizedMessage.includes('change')) {
        const link = await this.generateBookingLink(
          {
            doctorEmail: appointment.doctorEmail,
            appointmentType: appointment.appointmentType
          },
          userId
        )

        return {
          success: true,
          action: 'reschedule_requested',
          response: `To reschedule, please use this link:\n${link.link?.url}\n\nYour current appointment will be cancelled once you book a new time.`
        }
      }

      // Handle feedback rating (1-5)
      const rating = parseInt(normalizedMessage)
      if (rating >= 1 && rating <= 5) {
        // Log feedback
        await composioService.executeAction(
          'SLACK_SEND_MESSAGE',
          {
            channel: '#patient-feedback',
            text: `⭐ New Feedback\n\nPatient: ${appointment.patientName}\nDoctor: ${appointment.doctorName}\nRating: ${'⭐'.repeat(rating)}\nDate: ${appointment.date}`
          },
          userId
        )

        return {
          success: true,
          action: 'feedback_received',
          response: `Thank you for your feedback! ${rating >= 4 ? 'We\'re glad you had a great experience!' : 'We\'re sorry to hear that. We\'ll work to improve.'}`
        }
      }

      return {
        success: true,
        action: 'unknown',
        response: 'I didn\'t understand your message. Reply with:\n- CONFIRM to confirm\n- CANCEL to cancel\n- RESCHEDULE to reschedule'
      }
    } catch (error) {
      console.error('Error handling patient reply:', error)
      return {
        success: false,
        action: 'unknown',
        error: error instanceof Error ? error.message : 'Failed to process reply'
      }
    }
  }

  /**
   * Get appointments for a doctor
   */
  getAppointments(doctorEmail: string, status?: Appointment['status']): Appointment[] {
    return Array.from(this.appointments.values())
      .filter(a => a.doctorEmail === doctorEmail && (!status || a.status === status))
      .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())
  }

  /**
   * Get today's appointments
   */
  getTodayAppointments(doctorEmail: string): Appointment[] {
    const today = new Date().toISOString().split('T')[0]
    return this.getAppointments(doctorEmail).filter(a => a.date === today)
  }

  /**
   * Mark appointment as no-show
   */
  markNoShow(appointmentId: string): Appointment | undefined {
    const appointment = this.appointments.get(appointmentId)
    if (appointment) {
      appointment.status = 'no-show'
      appointment.updatedAt = new Date().toISOString()
    }
    return appointment
  }

  // Helper: Sync to Google Calendar
  private async syncToCalendar(
    appointment: Appointment,
    userId?: string
  ): Promise<void> {
    try {
      await composioService.executeAction(
        'GOOGLECALENDAR_CREATE_EVENT',
        {
          summary: `${appointment.appointmentType.toUpperCase()}: ${appointment.patientName}`,
          description: `
Patient: ${appointment.patientName}
Phone: ${appointment.patientPhone || 'N/A'}
Email: ${appointment.patientEmail || 'N/A'}
Type: ${appointment.appointmentType}
Notes: ${appointment.notes || 'None'}

Managed by Nexus Appointment Service
          `.trim(),
          start: {
            dateTime: `${appointment.date}T${appointment.time}:00`,
            timeZone: 'Asia/Kuwait'
          },
          end: {
            dateTime: this.calculateEndTime(appointment.date, appointment.time, appointment.duration),
            timeZone: 'Asia/Kuwait'
          },
          location: appointment.location,
          attendees: appointment.patientEmail ? [{ email: appointment.patientEmail }] : undefined,
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 60 },
              { method: 'email', minutes: 1440 } // 24 hours
            ]
          }
        },
        userId
      )
    } catch (error) {
      console.error('Error syncing to calendar:', error)
    }
  }

  // Helper: Schedule reminders
  private async scheduleReminders(
    appointment: Appointment,
    userId?: string
  ): Promise<void> {
    // In a real implementation, this would schedule jobs via a task queue
    // For now, we'll rely on the daily check to send reminders
    console.log(`[AppointmentService] Reminders scheduled for appointment ${appointment.id}`)
  }

  // Helper: Calculate end time
  private calculateEndTime(date: string, time: string, duration: number): string {
    const [hours, minutes] = time.split(':').map(Number)
    const endMinutes = hours * 60 + minutes + duration
    const endHours = Math.floor(endMinutes / 60)
    const endMins = endMinutes % 60
    return `${date}T${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}:00`
  }

  /**
   * Run daily reminder check
   */
  async runDailyReminderCheck(userId?: string): Promise<{
    dayBeforeReminders: number
    hoursBeforeReminders: number
    feedbackRequests: number
  }> {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const today = now.toISOString().split('T')[0]

    let dayBeforeReminders = 0
    let hoursBeforeReminders = 0
    let feedbackRequests = 0

    for (const appointment of this.appointments.values()) {
      // 24-hour reminders
      if (appointment.date === tomorrow && !appointment.remindersSent.day_before) {
        await this.sendReminder(appointment.id, 'day_before', userId)
        dayBeforeReminders++
      }

      // 2-hour reminders
      if (appointment.date === today && !appointment.remindersSent.hours_before) {
        const appointmentTime = new Date(`${appointment.date}T${appointment.time}:00`)
        const hoursUntil = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60)
        if (hoursUntil <= 2 && hoursUntil > 0) {
          await this.sendReminder(appointment.id, 'hours_before', userId)
          hoursBeforeReminders++
        }
      }

      // Post-appointment feedback (after appointment time)
      if (
        appointment.date === today &&
        appointment.status === 'confirmed' &&
        !appointment.remindersSent.post_appointment
      ) {
        const appointmentTime = new Date(`${appointment.date}T${appointment.time}:00`)
        const endTime = new Date(appointmentTime.getTime() + appointment.duration * 60 * 1000)
        if (now > endTime) {
          await this.sendFeedbackRequest(appointment.id, userId)
          feedbackRequests++
        }
      }
    }

    return { dayBeforeReminders, hoursBeforeReminders, feedbackRequests }
  }

  setDemoMode(enabled: boolean): void {
    this.demoMode = enabled
    console.log(`[AppointmentService] Demo mode: ${enabled ? 'ENABLED' : 'DISABLED'}`)
  }
}

// Export singleton instance
export const appointmentService = new AppointmentServiceClass()
export default appointmentService
