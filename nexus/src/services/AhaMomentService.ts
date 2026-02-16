/**
 * AhaMomentService.ts
 *
 * Persona-specific "aha moment" templates that demonstrate the magic
 * of Nexus workflow automation. When a user matches an industry persona,
 * they see a pre-built workflow scenario that immediately shows the value
 * of automation in THEIR specific context.
 *
 * Each AhaMoment includes a real, actionable demoPrompt that Nexus AI
 * can actually parse and execute via the standard workflowSpec pipeline.
 *
 * Integration points:
 * - Called by OnboardingPromptService or ChatContainer
 * - Reads industry from UserMemoryService (localStorage: nexus_business_profile)
 * - Persona IDs match industry-personas.ts keys
 */

// ============================================================================
// Types
// ============================================================================

export interface AhaMoment {
  /** Persona ID matching industry-personas.ts (e.g. 'ecommerce', 'oilandgas') */
  personaId: string
  /** Friendly persona name for display */
  personaName: string
  /** Short title for the scenario card */
  scenarioTitle: string
  /** One-sentence description of what happens */
  scenarioDescription: string
  /** The app that kicks off the workflow */
  triggerApp: string
  /** The apps that perform actions */
  actionApps: string[]
  /** The actual prompt to send to Nexus AI -- must produce a valid workflowSpec */
  demoPrompt: string
  /** Plain-language expected result */
  expectedOutcome: string
  /** The emotional "wow" line shown to the user */
  emotionalHook: string
  /** Estimated weekly time savings for credibility */
  estimatedTimeSaved: string
}

// ============================================================================
// Aha Moment Data (one per industry persona)
// ============================================================================

const AHA_MOMENTS: Record<string, AhaMoment> = {
  // --------------------------------------------------------------------------
  // E-Commerce & Online Retail
  // --------------------------------------------------------------------------
  ecommerce: {
    personaId: 'ecommerce',
    personaName: 'Nour',
    scenarioTitle: 'Auto-respond to Instagram DMs',
    scenarioDescription:
      'An Instagram DM comes in asking about products -- auto-reply with your catalog and draft an invoice row.',
    triggerApp: 'instagram',
    actionApps: ['googlesheets', 'gmail'],
    demoPrompt:
      'When I get an Instagram DM asking about products, send an auto-reply with my product catalog link and create a draft invoice row in my Sales Google Sheet',
    expectedOutcome:
      'Customer gets instant response, you get an invoice draft ready to send',
    emotionalHook: 'Customer served in seconds. Invoice ready.',
    estimatedTimeSaved: '5 hours/week',
  },

  // --------------------------------------------------------------------------
  // SaaS & Technology
  // --------------------------------------------------------------------------
  saas: {
    personaId: 'saas',
    personaName: 'Developer',
    scenarioTitle: 'Churn risk Slack alerts',
    scenarioDescription:
      'When a paying customer hasn\'t logged in for 7 days, get a Slack alert with their usage stats.',
    triggerApp: 'googlesheets',
    actionApps: ['slack', 'gmail'],
    demoPrompt:
      'Monitor my Customers Google Sheet for users whose last_login is more than 7 days ago. Post a Slack alert to my #churn-risk channel with the customer name, plan, and last login date, and send an automated re-engagement email to them',
    expectedOutcome:
      'At-risk customers surfaced daily before they churn, with auto-outreach sent',
    emotionalHook: 'Saved 3 accounts before they churned. Automatically.',
    estimatedTimeSaved: '4 hours/week',
  },

  // --------------------------------------------------------------------------
  // Agency & Creative
  // --------------------------------------------------------------------------
  agency: {
    personaId: 'agency',
    personaName: 'Creative Director',
    scenarioTitle: 'Client deliverable tracker',
    scenarioDescription:
      'When a designer uploads a file to Dropbox, auto-notify the client on email and log it in your project sheet.',
    triggerApp: 'dropbox',
    actionApps: ['gmail', 'googlesheets'],
    demoPrompt:
      'When a new file is uploaded to my Client Deliverables folder in Dropbox, send an email to the client with the file link and add a row to my Project Tracker Google Sheet with the file name, date, and status',
    expectedOutcome:
      'Client notified instantly, project tracker stays current with zero manual updates',
    emotionalHook: 'File uploaded. Client notified. Sheet updated. You did nothing.',
    estimatedTimeSaved: '3 hours/week',
  },

  // --------------------------------------------------------------------------
  // Consulting
  // --------------------------------------------------------------------------
  consulting: {
    personaId: 'consulting',
    personaName: 'Consultant',
    scenarioTitle: 'Morning briefing digest',
    scenarioDescription:
      'Start your day with an AI-summarized email digest posted to Slack.',
    triggerApp: 'gmail',
    actionApps: ['slack'],
    demoPrompt:
      'Every morning at 8am, summarize my unread emails from the last 12 hours and post the summary to my Slack channel',
    expectedOutcome:
      'Morning briefing ready when you open Slack -- zero inbox scrolling',
    emotionalHook: 'Your inbox, summarized. Zero scrolling.',
    estimatedTimeSaved: '3 hours/week',
  },

  // --------------------------------------------------------------------------
  // Healthcare
  // --------------------------------------------------------------------------
  healthcare: {
    personaId: 'healthcare',
    personaName: 'Clinic Manager',
    scenarioTitle: 'Patient appointment reminders',
    scenarioDescription:
      'Automatically send WhatsApp reminders to patients one day before their appointments.',
    triggerApp: 'googlecalendar',
    actionApps: ['whatsapp', 'googlesheets'],
    demoPrompt:
      'Check my Google Calendar every morning for appointments scheduled tomorrow. For each appointment, send a WhatsApp reminder to the patient with the date, time, and clinic address, and log the reminder in my Patient Communications Google Sheet',
    expectedOutcome:
      'Every patient reminded automatically -- fewer no-shows, no manual follow-up',
    emotionalHook: 'No-shows dropped 40%. You sent zero messages.',
    estimatedTimeSaved: '6 hours/week',
  },

  // --------------------------------------------------------------------------
  // Finance & Accounting
  // --------------------------------------------------------------------------
  finance: {
    personaId: 'finance',
    personaName: 'Accountant',
    scenarioTitle: 'Invoice receipt auto-filing',
    scenarioDescription:
      'When an invoice email arrives, extract the amount and vendor, log it to your sheet, and save the PDF to Dropbox.',
    triggerApp: 'gmail',
    actionApps: ['googlesheets', 'dropbox'],
    demoPrompt:
      'When I receive an email with an invoice attachment, extract the vendor name, invoice number, and amount, add a row to my Invoices Google Sheet, and save the attachment to my Invoices folder in Dropbox',
    expectedOutcome:
      'Every invoice auto-cataloged and filed -- no manual data entry',
    emotionalHook: 'Invoice arrived. Filed. Logged. You were in a meeting.',
    estimatedTimeSaved: '5 hours/week',
  },

  // --------------------------------------------------------------------------
  // Education
  // --------------------------------------------------------------------------
  education: {
    personaId: 'education',
    personaName: 'Instructor',
    scenarioTitle: 'Assignment submission tracker',
    scenarioDescription:
      'When a student submits an assignment via email, auto-log it and send a confirmation.',
    triggerApp: 'gmail',
    actionApps: ['googlesheets', 'gmail'],
    demoPrompt:
      'When I receive an email with the subject containing "assignment submission", extract the student name and attachment filename, add a row to my Submissions Google Sheet with the date and status, and send a confirmation reply to the student',
    expectedOutcome:
      'Every submission tracked and acknowledged -- no spreadsheet typing',
    emotionalHook: 'All 35 submissions logged. Every student confirmed. Automatically.',
    estimatedTimeSaved: '4 hours/week',
  },

  // --------------------------------------------------------------------------
  // Real Estate
  // --------------------------------------------------------------------------
  realestate: {
    personaId: 'realestate',
    personaName: 'Agent',
    scenarioTitle: 'Property inquiry auto-handler',
    scenarioDescription:
      'New inquiry arrives -- prospect gets instant WhatsApp response with viewing link.',
    triggerApp: 'gmail',
    actionApps: ['whatsapp', 'googlecalendar'],
    demoPrompt:
      'When I receive an email about a property inquiry, send a WhatsApp message to the prospect with property details and a link to book a viewing on my Google Calendar',
    expectedOutcome:
      'Prospect gets instant WhatsApp reply with a booking link within seconds',
    emotionalHook: 'Lead responded to in 30 seconds. Viewing booked.',
    estimatedTimeSaved: '7 hours/week',
  },

  // --------------------------------------------------------------------------
  // Manufacturing
  // --------------------------------------------------------------------------
  manufacturing: {
    personaId: 'manufacturing',
    personaName: 'Operations Manager',
    scenarioTitle: 'Machine downtime alerts',
    scenarioDescription:
      'When production data shows a machine offline, alert the maintenance team on Slack and log the incident.',
    triggerApp: 'googlesheets',
    actionApps: ['slack', 'gmail'],
    demoPrompt:
      'Monitor my Production Dashboard Google Sheet for any machine with status "offline". When detected, send a Slack alert to the #maintenance channel with the machine ID and location, and email the maintenance lead with the incident details',
    expectedOutcome:
      'Maintenance team mobilized within minutes of downtime -- zero delay',
    emotionalHook: 'Machine down at 2am. Team alerted at 2:01am. You slept.',
    estimatedTimeSaved: '3 hours/week',
  },

  // --------------------------------------------------------------------------
  // Retail
  // --------------------------------------------------------------------------
  retail: {
    personaId: 'retail',
    personaName: 'Retailer',
    scenarioTitle: 'Low stock WhatsApp alert',
    scenarioDescription:
      'Get alerted on WhatsApp when any product drops below reorder level.',
    triggerApp: 'googlesheets',
    actionApps: ['whatsapp'],
    demoPrompt:
      'Monitor my Inventory Google Sheet. When any product quantity drops below 10 units, send me a WhatsApp alert with the product name and current stock level',
    expectedOutcome:
      'Stock alerts before you run out -- reorder in time every time',
    emotionalHook: 'Reorder before stockout. Automatically.',
    estimatedTimeSaved: '2 hours/week',
  },

  // --------------------------------------------------------------------------
  // Nonprofit
  // --------------------------------------------------------------------------
  nonprofit: {
    personaId: 'nonprofit',
    personaName: 'Program Director',
    scenarioTitle: 'Donor thank-you automation',
    scenarioDescription:
      'When a new donation row appears in your sheet, auto-send a personalized thank-you email.',
    triggerApp: 'googlesheets',
    actionApps: ['gmail'],
    demoPrompt:
      'When a new row is added to my Donations Google Sheet, send a personalized thank-you email to the donor with their name, donation amount, and a receipt link',
    expectedOutcome:
      'Every donor thanked within minutes, with a receipt -- no manual emails',
    emotionalHook: 'Donor thanked in 60 seconds. Receipt attached. You were at an event.',
    estimatedTimeSaved: '4 hours/week',
  },

  // --------------------------------------------------------------------------
  // Oil & Gas
  // --------------------------------------------------------------------------
  oilandgas: {
    personaId: 'oilandgas',
    personaName: 'Ahmad',
    scenarioTitle: 'Overnight tender alerts',
    scenarioDescription:
      'Wake up to a WhatsApp summary of new KPC tenders matching your criteria.',
    triggerApp: 'gmail',
    actionApps: ['whatsapp', 'dropbox'],
    demoPrompt:
      'Monitor my Gmail for new tender notifications from KPC, KNPC, or KOC. When found, save the documents to my Dropbox and send me a WhatsApp summary of matching tenders',
    expectedOutcome:
      'Tender docs saved and WhatsApp briefing ready before you wake up',
    emotionalHook: '3 new tenders detected overnight. Files saved.',
    estimatedTimeSaved: '5 hours/week',
  },

  // --------------------------------------------------------------------------
  // Construction
  // --------------------------------------------------------------------------
  construction: {
    personaId: 'construction',
    personaName: 'Builder',
    scenarioTitle: 'Permit deadline tracker',
    scenarioDescription:
      'Never miss a Municipality permit deadline again -- WhatsApp and email reminders.',
    triggerApp: 'googlecalendar',
    actionApps: ['whatsapp', 'gmail'],
    demoPrompt:
      'Monitor my Google Calendar for permit-related deadlines. Send me a WhatsApp reminder 3 days before and an email reminder 1 day before each deadline',
    expectedOutcome:
      'Permit reminders on WhatsApp and email so you never miss a filing deadline',
    emotionalHook: 'Deadline in 3 days. You knew first.',
    estimatedTimeSaved: '2 hours/week',
  },

  // --------------------------------------------------------------------------
  // Food & Beverage (mapped to 'other' since no dedicated persona -- but
  // the Finding spec called it out, so we include it as 'food_beverage'
  // and the service also maps 'other' to this as a sensible default)
  // --------------------------------------------------------------------------
  food_beverage: {
    personaId: 'food_beverage',
    personaName: 'Fatima',
    scenarioTitle: 'Auto-capture WhatsApp orders',
    scenarioDescription:
      'A real WhatsApp order arrives and automatically appears in your Google Sheet.',
    triggerApp: 'whatsapp',
    actionApps: ['googlesheets'],
    demoPrompt:
      'When I receive a WhatsApp message containing a food order, extract the items and quantities and add them as a new row in my Orders Google Sheet',
    expectedOutcome:
      'Orders flow from WhatsApp to your spreadsheet without copy-pasting',
    emotionalHook: "You didn't copy it. It just appeared.",
    estimatedTimeSaved: '8 hours/week',
  },

  // --------------------------------------------------------------------------
  // Other / General (fallback)
  // --------------------------------------------------------------------------
  other: {
    personaId: 'other',
    personaName: 'Business Owner',
    scenarioTitle: 'Email-to-Slack daily digest',
    scenarioDescription:
      'Your important emails summarized and posted to Slack every morning.',
    triggerApp: 'gmail',
    actionApps: ['slack'],
    demoPrompt:
      'Every morning at 8am, summarize my unread emails from the last 12 hours and post the summary to my Slack channel',
    expectedOutcome:
      'A clean daily digest waiting in Slack when you start work',
    emotionalHook: '12 emails distilled into 5 bullets. Ready at 8am.',
    estimatedTimeSaved: '3 hours/week',
  },
}

// ============================================================================
// Service
// ============================================================================

const STORAGE_KEY_EXPERIENCED = 'nexus_aha_experienced'
const STORAGE_KEY_PROFILE = 'nexus_business_profile'

export class AhaMomentService {
  // --------------------------------------------------------------------------
  // Core API
  // --------------------------------------------------------------------------

  /**
   * Get the aha moment matching the user's industry profile.
   * Falls back to the generic "other" moment if no profile or no match.
   * Returns null only if the user has already experienced their moment.
   */
  static getAhaMoment(): AhaMoment | null {
    if (AhaMomentService.hasExperienced()) {
      return null
    }

    const industry = AhaMomentService.getUserIndustry()

    // Direct match
    if (industry && AHA_MOMENTS[industry]) {
      return AHA_MOMENTS[industry]
    }

    // Fallback to generic
    return AHA_MOMENTS['other']
  }

  /**
   * Get the aha moment for a specific persona (ignoring user profile).
   * Useful for browsing / demo mode.
   */
  static getAhaMomentForPersona(personaId: string): AhaMoment | null {
    return AHA_MOMENTS[personaId] ?? null
  }

  /**
   * Get all available aha moments (for gallery / browsing).
   */
  static getAllMoments(): AhaMoment[] {
    return Object.values(AHA_MOMENTS)
  }

  /**
   * Get moments grouped by category for display purposes.
   */
  static getMomentsByCategory(): {
    regional: AhaMoment[]
    operational: AhaMoment[]
    communication: AhaMoment[]
  } {
    return {
      // Kuwait-market-specific moments
      regional: [
        AHA_MOMENTS['oilandgas'],
        AHA_MOMENTS['construction'],
        AHA_MOMENTS['food_beverage'],
        AHA_MOMENTS['realestate'],
      ],
      // Operations & data flow moments
      operational: [
        AHA_MOMENTS['finance'],
        AHA_MOMENTS['manufacturing'],
        AHA_MOMENTS['retail'],
        AHA_MOMENTS['ecommerce'],
        AHA_MOMENTS['saas'],
      ],
      // Communication & outreach moments
      communication: [
        AHA_MOMENTS['consulting'],
        AHA_MOMENTS['healthcare'],
        AHA_MOMENTS['education'],
        AHA_MOMENTS['nonprofit'],
        AHA_MOMENTS['agency'],
        AHA_MOMENTS['other'],
      ],
    }
  }

  // --------------------------------------------------------------------------
  // State Management
  // --------------------------------------------------------------------------

  /**
   * Check if the user has already experienced their aha moment.
   */
  static hasExperienced(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY_EXPERIENCED) === 'true'
    } catch {
      return false
    }
  }

  /**
   * Mark the aha moment as experienced (won't be shown again).
   */
  static markExperienced(): void {
    try {
      localStorage.setItem(STORAGE_KEY_EXPERIENCED, 'true')
    } catch {
      // Silent fail -- non-critical
    }
  }

  /**
   * Reset the experienced flag (useful for demo / testing).
   */
  static resetExperienced(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_EXPERIENCED)
    } catch {
      // Silent fail
    }
  }

  // --------------------------------------------------------------------------
  // Internal Helpers
  // --------------------------------------------------------------------------

  /**
   * Read the user's industry from the business profile in localStorage.
   * Returns the industry ID string (e.g. 'ecommerce') or null.
   */
  private static getUserIndustry(): string | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PROFILE)
      if (!raw) return null
      const data = JSON.parse(raw)
      return data.industry ?? null
    } catch {
      return null
    }
  }
}

export default AhaMomentService
