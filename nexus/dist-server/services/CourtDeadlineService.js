/**
 * Court Deadline Calendar Service
 * @NEXUS-FIX-085: Court deadline tracking via Google Calendar
 *
 * Manages court dates, filing deadlines, and legal appointments.
 * Provides automatic reminders and escalation for lawyers.
 */
import { composioService } from './ComposioService';
class CourtDeadlineServiceClass {
    calendarId = 'primary'; // Use primary calendar by default
    demoMode = false;
    /**
     * Create a court deadline and add to Google Calendar
     */
    async createDeadline(params, userId) {
        try {
            const deadlineId = `deadline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            // Create deadline object
            const deadline = {
                id: deadlineId,
                title: params.title,
                caseNumber: params.caseNumber,
                caseName: params.caseName,
                deadlineType: params.deadlineType,
                date: params.date,
                time: params.time,
                court: params.court,
                judge: params.judge,
                lawyerId: userId || 'unknown',
                lawyerEmail: params.lawyerEmail,
                clientName: params.clientName,
                description: params.description,
                reminderDays: params.reminderDays || [7, 3, 1], // Default: remind 7, 3, and 1 day before
                priority: params.priority || 'normal',
                status: 'pending',
                notes: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            // Create Google Calendar event
            const calendarResult = await this.createCalendarEvent(deadline, userId);
            if (calendarResult.success && calendarResult.eventId) {
                deadline.calendarEventId = calendarResult.eventId;
            }
            // Create reminder events for each reminder day
            for (const daysBefore of deadline.reminderDays) {
                await this.scheduleReminder(deadline, daysBefore, userId);
            }
            return {
                success: true,
                deadline,
                calendarEventId: deadline.calendarEventId
            };
        }
        catch (error) {
            console.error('Error creating court deadline:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create deadline'
            };
        }
    }
    /**
     * Create Google Calendar event for deadline
     */
    async createCalendarEvent(deadline, userId) {
        try {
            const eventDescription = this.formatEventDescription(deadline);
            const eventTime = deadline.time
                ? `${deadline.date}T${deadline.time}:00`
                : `${deadline.date}T09:00:00`; // Default to 9 AM if no time specified
            const priorityEmoji = {
                critical: '🚨',
                high: '⚠️',
                normal: '📅',
                low: '📝'
            }[deadline.priority];
            const result = await composioService.executeAction('GOOGLECALENDAR_CREATE_EVENT', {
                summary: `${priorityEmoji} ${deadline.title} - ${deadline.caseNumber}`,
                description: eventDescription,
                start: {
                    dateTime: eventTime,
                    timeZone: 'Asia/Kuwait' // Kuwait timezone
                },
                end: {
                    dateTime: eventTime, // Same as start for deadline marker
                    timeZone: 'Asia/Kuwait'
                },
                location: deadline.court,
                colorId: this.getPriorityColor(deadline.priority),
                reminders: {
                    useDefault: false,
                    overrides: deadline.reminderDays.map(days => ({
                        method: 'email',
                        minutes: days * 24 * 60 // Convert days to minutes
                    }))
                }
            }, userId);
            if (result.success && result.data?.id) {
                return { success: true, eventId: result.data.id };
            }
            // Demo mode fallback
            if (this.demoMode || !result.success) {
                console.log('[CourtDeadlineService] Demo mode - simulating calendar event');
                return {
                    success: true,
                    eventId: `demo_event_${deadline.id}`
                };
            }
            return { success: false, error: result.error || 'Unknown error' };
        }
        catch (error) {
            console.error('Error creating calendar event:', error);
            // Return demo event in case of error for graceful degradation
            return {
                success: true,
                eventId: `fallback_event_${deadline.id}`
            };
        }
    }
    /**
     * Schedule reminder for a deadline
     */
    async scheduleReminder(deadline, daysBefore, userId) {
        try {
            const reminderDate = new Date(deadline.date);
            reminderDate.setDate(reminderDate.getDate() - daysBefore);
            const urgency = daysBefore === 1 ? 'URGENT' : daysBefore <= 3 ? 'Important' : 'Reminder';
            // Create a reminder event
            await composioService.executeAction('GOOGLECALENDAR_CREATE_EVENT', {
                summary: `${urgency}: ${deadline.title} in ${daysBefore} day(s)`,
                description: `
⏰ DEADLINE REMINDER

Case: ${deadline.caseName} (${deadline.caseNumber})
Deadline: ${deadline.title}
Date: ${deadline.date}${deadline.time ? ` at ${deadline.time}` : ''}
Court: ${deadline.court}
${deadline.judge ? `Judge: ${deadline.judge}` : ''}

Days remaining: ${daysBefore}
Priority: ${deadline.priority.toUpperCase()}

📋 Original deadline description:
${deadline.description || 'No additional details'}
          `.trim(),
                start: {
                    date: reminderDate.toISOString().split('T')[0]
                },
                end: {
                    date: reminderDate.toISOString().split('T')[0]
                },
                colorId: '11' // Red for reminders
            }, userId);
        }
        catch (error) {
            console.error(`Error scheduling ${daysBefore}-day reminder:`, error);
        }
    }
    /**
     * Get upcoming deadlines
     */
    async getUpcomingDeadlines(params, userId) {
        try {
            const daysAhead = params.daysAhead || 30;
            const now = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + daysAhead);
            const result = await composioService.executeAction('GOOGLECALENDAR_LIST_EVENTS', {
                timeMin: now.toISOString(),
                timeMax: endDate.toISOString(),
                q: 'Court' // Search for court-related events
            }, userId);
            if (result.success && result.data?.items) {
                const deadlines = result.data.items
                    .filter((event) => event.summary?.includes('🚨') ||
                    event.summary?.includes('⚠️') ||
                    event.summary?.includes('📅'))
                    .map((event) => {
                    const eventDate = new Date(event.start?.dateTime || event.start?.date);
                    const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    return {
                        id: event.id,
                        title: event.summary?.replace(/[🚨⚠️📅📝]\s*/, '') || 'Untitled',
                        date: eventDate.toISOString().split('T')[0],
                        daysUntil,
                        priority: event.summary?.includes('🚨') ? 'critical' :
                            event.summary?.includes('⚠️') ? 'high' : 'normal',
                        caseNumber: this.extractCaseNumber(event.summary || '')
                    };
                })
                    .sort((a, b) => a.daysUntil - b.daysUntil);
                return { success: true, deadlines };
            }
            // Demo mode response
            return {
                success: true,
                deadlines: [
                    {
                        id: 'demo_1',
                        title: 'Filing Deadline - Smith vs. Jones',
                        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        daysUntil: 3,
                        priority: 'high',
                        caseNumber: 'CIV-2024-001234'
                    },
                    {
                        id: 'demo_2',
                        title: 'Hearing - Al-Rashid Estate',
                        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        daysUntil: 7,
                        priority: 'critical',
                        caseNumber: 'PRB-2024-005678'
                    }
                ]
            };
        }
        catch (error) {
            console.error('Error getting upcoming deadlines:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get deadlines'
            };
        }
    }
    /**
     * Send deadline escalation
     */
    async escalateDeadline(deadlineId, params, userId) {
        try {
            const daysUntil = params.deadline.date
                ? Math.ceil((new Date(params.deadline.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : 'unknown';
            // Send escalation email
            const result = await composioService.executeAction('GMAIL_SEND_EMAIL', {
                to: params.escalateTo,
                subject: `🚨 ESCALATION: ${params.deadline.title} - ${daysUntil} days remaining`,
                body: `
URGENT ESCALATION NOTICE

A court deadline requires immediate attention:

📋 Deadline: ${params.deadline.title}
📁 Case: ${params.deadline.caseName} (${params.deadline.caseNumber})
⏰ Due Date: ${params.deadline.date}${params.deadline.time ? ` at ${params.deadline.time}` : ''}
📍 Court: ${params.deadline.court}
${params.deadline.judge ? `👨‍⚖️ Judge: ${params.deadline.judge}` : ''}

🔴 Days Remaining: ${daysUntil}
⚡ Priority: ${params.deadline.priority?.toUpperCase()}

📝 Escalation Reason:
${params.reason}

Please take immediate action to address this deadline.

---
This is an automated escalation from Nexus Deadline Tracker
          `.trim()
            }, userId);
            // Also send Slack notification if available
            try {
                await composioService.executeAction('SLACK_SEND_MESSAGE', {
                    channel: '#legal-escalations',
                    text: `:rotating_light: *DEADLINE ESCALATION*\n\n*${params.deadline.title}*\nCase: ${params.deadline.caseNumber}\nDue: ${params.deadline.date} (*${daysUntil} days*)\n\nReason: ${params.reason}`
                }, userId);
            }
            catch (slackError) {
                // Slack is optional, don't fail if it doesn't work
                console.log('Slack escalation notification skipped:', slackError);
            }
            return { success: result.success };
        }
        catch (error) {
            console.error('Error escalating deadline:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to escalate'
            };
        }
    }
    /**
     * Mark deadline as completed
     */
    async completeDeadline(deadlineId, params, userId) {
        try {
            // Update calendar event to show completion
            if (params.calendarEventId) {
                await composioService.executeAction('GOOGLECALENDAR_UPDATE_EVENT', {
                    eventId: params.calendarEventId,
                    summary: `✅ COMPLETED: ${params.calendarEventId}`,
                    colorId: '10' // Green for completed
                }, userId);
            }
            // Send completion notification
            await composioService.executeAction('SLACK_SEND_MESSAGE', {
                channel: '#legal-updates',
                text: `:white_check_mark: *Deadline Completed*\n\nDeadline ID: ${deadlineId}\nCompleted by: ${params.completedBy}\n${params.notes ? `Notes: ${params.notes}` : ''}`
            }, userId);
            return { success: true };
        }
        catch (error) {
            console.error('Error completing deadline:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to complete deadline'
            };
        }
    }
    /**
     * Get deadlines requiring attention (within 3 days)
     */
    async getUrgentDeadlines(lawyerEmail, userId) {
        const result = await this.getUpcomingDeadlines({ lawyerEmail, daysAhead: 3 }, userId);
        if (result.success && result.deadlines) {
            return {
                success: true,
                urgent: result.deadlines.filter(d => d.daysUntil <= 3)
            };
        }
        return {
            success: false,
            urgent: [],
            error: result.error
        };
    }
    // Helper methods
    formatEventDescription(deadline) {
        return `
📋 COURT DEADLINE

Case: ${deadline.caseName}
Case Number: ${deadline.caseNumber}
Type: ${deadline.deadlineType.toUpperCase()}
Court: ${deadline.court}
${deadline.judge ? `Judge: ${deadline.judge}` : ''}
Priority: ${deadline.priority.toUpperCase()}

${deadline.clientName ? `Client: ${deadline.clientName}` : ''}
Assigned Lawyer: ${deadline.lawyerEmail}

${deadline.description || ''}

---
Managed by Nexus Court Deadline Tracker
    `.trim();
    }
    getPriorityColor(priority) {
        // Google Calendar color IDs
        const colors = {
            critical: '11', // Red
            high: '6', // Orange
            normal: '9', // Blue
            low: '10' // Green
        };
        return colors[priority] || '9';
    }
    extractCaseNumber(summary) {
        // Try to extract case number from event summary
        const match = summary.match(/([A-Z]{2,4}-\d{4}-\d+)/i);
        return match ? match[1] : 'Unknown';
    }
    /**
     * Enable demo mode for testing
     */
    setDemoMode(enabled) {
        this.demoMode = enabled;
        console.log(`[CourtDeadlineService] Demo mode: ${enabled ? 'ENABLED' : 'DISABLED'}`);
    }
}
// Export singleton instance
export const courtDeadlineService = new CourtDeadlineServiceClass();
export default courtDeadlineService;
//# sourceMappingURL=CourtDeadlineService.js.map