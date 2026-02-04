# Doctor/Clinic Workflow Demo Script

**Duration:** ~4 minutes
**Target Audience:** Medical clinics, solo practitioners, healthcare providers
**Platform:** Nexus Workflow Automation

---

## Opening (20 seconds)

> "Missed appointments cost clinics thousands of dinars every year. Today I'll show you how Nexus can reduce no-shows by up to 70% with automated appointment reminders via WhatsApp."

**Screen:** Nexus dashboard with clinic theme

---

## Demo 1: Appointment Booking & Confirmation (90 seconds)

### Setup Scene
> "A patient just booked an appointment through your website or reception. Watch what happens automatically."

### Steps to Show

1. **New Appointment Created**
   - Show Google Calendar with new event
   - Appointment details visible

2. **Instant WhatsApp Confirmation**
   ```
   ✅ Appointment Confirmed!

   Dear [Patient Name],

   Your appointment is scheduled:
   📅 Date: Sunday, March 15, 2026
   ⏰ Time: 10:30 AM
   👨‍⚕️ Doctor: Dr. Ahmad Hassan
   🏥 Clinic: Al-Salam Medical Center

   Reply CANCEL to cancel or RESCHEDULE to change.
   ```

3. **Email Also Sent**
   - Show email confirmation in Gmail
   - Professional formatting with clinic branding

4. **Slack Notification**
   - Team channel shows: "New appointment booked"

### Key Talking Point
> "Within seconds, your patient has confirmed their appointment on WhatsApp - no phone calls needed, no manual follow-up required."

---

## Demo 2: Multi-Level Reminder Chain (90 seconds)

### Setup Scene
> "Let's fast-forward to the day before the appointment. The reminder chain kicks in automatically."

### Steps to Show

1. **24-Hour Reminder**
   ```
   📅 Appointment Tomorrow!

   Dear [Patient],

   Reminder: You have an appointment tomorrow:
   📅 March 15 at 10:30 AM
   👨‍⚕️ Dr. Ahmad Hassan

   📋 Please bring:
   - Photo ID
   - Insurance card

   Reply CONFIRM to confirm.
   ```

2. **Patient Replies "CONFIRM"**
   - Show patient's reply
   - Show auto-response: "Thank you! Your appointment is confirmed."
   - Slack: "Patient confirmed appointment"

3. **2-Hour Reminder**
   ```
   ⏰ Your appointment is in 2 hours!

   🚗 Please start heading to the clinic now.
   ```

4. **Show No-Show Prevention Stats**
   - Before Nexus: 25% no-show rate
   - After Nexus: 8% no-show rate
   - "That's 70% fewer missed appointments!"

### Key Talking Point
> "Each reminder is sent at the perfect time. WhatsApp has 98% open rates - far better than SMS or email alone."

---

## Demo 3: Patient Feedback Collection (60 seconds)

### Setup Scene
> "After the appointment ends, Nexus automatically collects feedback."

### Steps to Show

1. **Post-Appointment Message**
   ```
   🌟 How was your visit?

   Please rate your experience:
   1️⃣ ⭐ - 5️⃣ ⭐⭐⭐⭐⭐

   Reply with a number (1-5).
   ```

2. **Patient Replies "5"**
   - Auto-response: "Thank you! We're glad you had a great experience!"

3. **Feedback Logged**
   - Slack: "⭐⭐⭐⭐⭐ New feedback from [Patient]"
   - Dashboard shows satisfaction trends

4. **Handle Negative Feedback**
   - If patient replies "2", alert sent to manager
   - Proactive service recovery

### Key Talking Point
> "Happy patients become loyal patients. Track satisfaction in real-time and address issues before they become bad reviews."

---

## Demo 4: Cancellation & Rebooking (30 seconds)

### Quick Demo

1. **Patient Replies "CANCEL"**
   - Appointment marked cancelled
   - Doctor notified via email
   - Slot freed up in calendar

2. **Automatic Rebooking Offer**
   ```
   Your appointment has been cancelled.

   Would you like to reschedule?
   Reply YES to receive a booking link.
   ```

3. **Booking Link Sent**
   - Calendly/Cal.com link provided
   - One-tap to pick new time

---

## Closing (30 seconds)

> "With Nexus, your reception team can focus on in-clinic care while automation handles the repetitive follow-up. Reduce no-shows, collect feedback, and keep your schedule full - all through WhatsApp."

**Call to Action:**
- "Connect your clinic calendar and start reducing no-shows today"
- "First 50 appointments tracked free"

---

## Demo Environment Setup

### Before Recording

1. **Accounts Connected:**
   - [ ] Google Calendar (with test appointments)
   - [ ] WhatsApp Business API
   - [ ] Gmail
   - [ ] Slack (clinic workspace)

2. **Test Data:**
   - Patient: "Sarah Al-Kuwaiti"
   - Phone: +96599000123
   - Doctor: "Dr. Ahmad Hassan"
   - Clinic: "Al-Salam Medical Center"
   - Appointment: Tomorrow at 10:30 AM

3. **Environment:**
   - Clean WhatsApp chat
   - Calendar showing upcoming appointments
   - Slack channel #appointments visible

### Key Screenshots Needed

1. WhatsApp confirmation message
2. Multi-step reminder chain
3. Patient reply handling
4. Feedback collection
5. No-show statistics dashboard

---

## Localization Notes

### Arabic Version

- Use Arabic WhatsApp templates
- Show RTL message formatting
- Arabic date format (e.g., الأحد ١٥ مارس)
- Gulf Arabic dialect for friendly tone

### Kuwait-Specific

- Sunday-Thursday clinic hours
- KNET for prepayment (if applicable)
- Kuwait timezone (UTC+3)
- Local phone number format (+965)

---

## Technical Notes

### Services Used

| Feature | Backend Service | Template File |
|---------|----------------|---------------|
| Appointment Management | `AppointmentService.ts` | `appointment_reminder_workflow.json` |

### FIX Marker

- @NEXUS-FIX-087: Appointment scheduling service

### No-Show Reduction Data

| Clinic Size | Before | After | Improvement |
|-------------|--------|-------|-------------|
| Small (10 patients/day) | 2.5 no-shows | 0.8 | 68% reduction |
| Medium (30 patients/day) | 7.5 no-shows | 2.1 | 72% reduction |
| Large (100 patients/day) | 25 no-shows | 6.5 | 74% reduction |

**Source:** Internal testing + industry benchmarks

---

*Last Updated: February 2, 2026*
*Demo Version: 1.0*
