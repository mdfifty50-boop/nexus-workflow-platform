# Nexus Workflow Template Catalog

## Strategic Workflow Analysis Based on NEXUS-DEFINITIVE-BUSINESS-STRATEGY Research

**Generated:** 2026-02-03
**Based On:** 10 Consulting Firms Research + GCC Market Analysis
**Total Pain Points Covered:** 67
**Composio Integration Coverage:** 85%+

---

## Executive Summary

This catalog defines **67 dynamic workflow templates** across 4 primary domains, prioritized by ROI within each domain. Each template is designed to be **flexible** (parameterized) rather than fixed, allowing users with different scenarios to customize to their needs.

### Coverage Status

| Domain | Pain Points | Templates Needed | Existing | New Required | Composio Coverage |
|--------|-------------|------------------|----------|--------------|-------------------|
| **Lawyers** | 18 | 18 | 3 | 15 | 94% |
| **SME Owners** | 22 | 22 | 3 | 19 | 89% |
| **Clinic Doctors** | 15 | 15 | 1 | 14 | 82% |
| **Hospital/ER** | 12 | 12 | 0 | 12 | 71% |
| **TOTAL** | 67 | 67 | 7 | 60 | 85% |

---

# DOMAIN 1: LAWYERS

## Annual Pain Value: $97,500 - $195,000/year per lawyer
## Primary Channel: WhatsApp + Email
## Regional Context: Kuwait Civil Code, Sunday-Thursday work week

### ROI Tier 1: CRITICAL (Immediate Revenue/Risk Impact)

---

#### WF-LAW-001: Signature Chase Automation
**Status:** EXISTS - `signature_chase_workflow.json`
**Annual Value:** $27,450/lawyer (18.3 hrs/week × $30/hr saved)
**Composio Coverage:** 100%

**Pain Point:** Lawyers waste 18.3 hours/week chasing signatures. 40% of documents remain unsigned for 7+ days.

**Dynamic Parameters:**
- `reminder_days`: Days before first reminder (default: 3)
- `escalation_days`: Days before escalation (default: 7)
- `reminder_channels`: [whatsapp, email, sms] - user selects
- `escalation_recipients`: [supervisor, partner, client_manager]
- `message_tone`: [formal, friendly, urgent]
- `language`: [english, arabic, bilingual]

**Integrations:** DocuSign, WhatsApp, Gmail, Slack

---

#### WF-LAW-002: After-Hours Lead Response
**Status:** NEW REQUIRED
**Annual Value:** $39,000 - $78,000/lawyer (40% lead recovery)
**Composio Coverage:** 100%

**Pain Point:** 40% of legal leads are lost because they arrive after 5 PM when office is closed. Average response time of 30 minutes drops conversion 391%.

**Dynamic Parameters:**
- `office_hours`: { start: "08:00", end: "17:00", timezone: "Asia/Kuwait" }
- `work_days`: [0,1,2,3,4] (Sunday-Thursday for Kuwait)
- `response_template`: User-customizable auto-response
- `qualification_questions`: Array of intake questions
- `priority_keywords`: ["urgent", "emergency", "court", "deadline"]
- `escalation_phone`: Partner's mobile for urgent matters
- `crm_integration`: [hubspot, salesforce, pipedrive, notion]

**Workflow Steps:**
1. TRIGGER: WhatsApp message received after hours
2. AI: Classify urgency (urgent/normal/inquiry)
3. If urgent: Escalate immediately to partner's phone
4. If normal: Send acknowledgment + intake questions
5. ACTION: Create lead in CRM with full context
6. ACTION: Schedule morning follow-up task
7. ACTION: Send confirmation to sender

**Integrations:** WhatsApp, Gmail, HubSpot, Google Calendar, Slack

---

#### WF-LAW-003: Court Deadline Tracker
**Status:** EXISTS - `court_deadline_workflow.json`
**Annual Value:** Risk Mitigation ($100K+ malpractice prevention)
**Composio Coverage:** 100%

**Pain Point:** Missing court deadlines = malpractice liability. Manual tracking leads to 8% error rate.

**Dynamic Parameters:**
- `reminder_intervals`: [7, 3, 1] days before deadline
- `escalation_threshold`: Days before supervisor alert
- `court_types`: [civil, criminal, commercial, family, appeals]
- `priority_levels`: [routine, important, critical, emergency]
- `team_channels`: Slack/Teams channel per case type
- `calendar_colors`: Color coding by priority

**Integrations:** Google Calendar, Gmail, Slack, WhatsApp

---

#### WF-LAW-004: Automatic Time Entry
**Status:** NEW REQUIRED
**Annual Value:** $39,000 - $78,000/lawyer (3-5 hours/day recovered)
**Composio Coverage:** 85% (Clio API via custom)

**Pain Point:** Lawyers spend 3-5 hours/day on non-billable admin. Only 70% of billable time gets logged.

**Dynamic Parameters:**
- `billing_increments`: [6, 10, 15] minutes
- `default_rate`: Hourly rate per matter type
- `auto_categories`: {email: "correspondence", call: "consultation", doc: "drafting"}
- `matter_detection`: Auto-detect matter from email subject/contact
- `minimum_entry`: Minimum time to log (e.g., 6 minutes)
- `approval_required`: boolean - require lawyer approval before sync

**Workflow Steps:**
1. TRIGGER: Calendar event ends (meeting/call)
2. ANALYZE: Duration, attendees, matter context
3. ENRICH: Pull email threads related to same matter
4. DRAFT: Create time entry with description
5. PROMPT: WhatsApp approval request to lawyer
6. If approved: Sync to billing system
7. AGGREGATE: Daily time entry summary

**Integrations:** Google Calendar, Gmail, Clio (custom), WhatsApp, Notion

---

#### WF-LAW-005: Client Billing Reminder Chain
**Status:** NEW REQUIRED
**Annual Value:** $15,600 - $31,200/lawyer (reduce AR by 50%)
**Composio Coverage:** 92%

**Pain Point:** Law firms have 60-90 day average AR. 30% of invoices go 90+ days unpaid.

**Dynamic Parameters:**
- `reminder_schedule`: [7, 14, 30, 45, 60] days post-invoice
- `payment_methods`: [knet, bank_transfer, credit_card, cash]
- `escalation_levels`: [friendly, firm, legal, collections]
- `discount_offer`: Optional early payment discount %
- `payment_plan_threshold`: Amount above which to offer payment plan
- `final_notice_cc`: Partner/collections team email

**Workflow Steps:**
1. TRIGGER: Invoice created in billing system
2. ACTION: Send invoice via email + WhatsApp
3. MONITOR: Check payment status daily
4. If unpaid Day 7: Send friendly reminder
5. If unpaid Day 14: Firm reminder with payment link
6. If unpaid Day 30: Escalate to partner
7. If unpaid Day 45: Formal demand letter
8. If unpaid Day 60: Collections/legal action prompt

**Integrations:** Stripe, KNET (custom), Gmail, WhatsApp, Slack

---

### ROI Tier 2: HIGH (Significant Time Savings)

---

#### WF-LAW-006: Case Status Update Automation
**Status:** NEW REQUIRED
**Annual Value:** $7,800/lawyer (5 hrs/week client updates)
**Composio Coverage:** 100%

**Pain Point:** Clients constantly call asking "what's the status?" Average lawyer spends 5 hours/week on status update calls.

**Dynamic Parameters:**
- `update_frequency`: [weekly, biweekly, milestone-only]
- `update_channels`: [whatsapp, email, portal]
- `include_next_steps`: boolean
- `include_documents`: boolean - attach recent filings
- `language`: [english, arabic, bilingual]
- `summary_style`: [detailed, brief, bullet_points]

**Workflow Steps:**
1. TRIGGER: Case milestone updated in system
2. OR: Scheduled weekly summary
3. GENERATE: AI summarizes case status + next steps
4. FORMAT: User's preferred language/style
5. SEND: Via preferred channel(s)
6. LOG: Record contact in CRM

**Integrations:** Notion/ClickUp, Gmail, WhatsApp, Slack

---

#### WF-LAW-007: Document Assembly from Template
**Status:** NEW REQUIRED
**Annual Value:** $10,400/lawyer (8 hrs/week document prep)
**Composio Coverage:** 78% (requires document merge API)

**Pain Point:** Lawyers spend 8+ hours/week on document preparation that could be templated.

**Dynamic Parameters:**
- `template_library`: [contracts, pleadings, letters, memos]
- `variable_sources`: [crm, intake_form, manual]
- `approval_workflow`: boolean - require partner review
- `output_format`: [pdf, docx, both]
- `watermark`: Draft watermark until finalized
- `signature_integration`: [docusign, hellosign, manual]

**Workflow Steps:**
1. TRIGGER: User selects template + provides variables
2. FETCH: Pull client data from CRM
3. MERGE: Populate template with variables
4. REVIEW: Notify lawyer for review (if enabled)
5. FINALIZE: Convert to PDF with firm branding
6. SEND: To client for signature (if contract)
7. FILE: Archive in document management

**Integrations:** Google Docs, DocuSign, Gmail, Google Drive, Notion

---

#### WF-LAW-008: New Client Intake Automation
**Status:** PARTIAL - `client_onboarding_full.json` exists
**Annual Value:** $5,200/lawyer (4 hrs/week intake)
**Composio Coverage:** 100%

**Pain Point:** Client intake takes 45+ minutes per client. Information gets entered multiple times.

**Dynamic Parameters:**
- `intake_fields`: Customizable field list per practice area
- `conflict_check`: Auto-check against existing clients
- `document_requests`: List of docs to request
- `fee_agreement_template`: Auto-generate engagement letter
- `payment_setup`: KNET/card authorization
- `assignment_rules`: Auto-assign to appropriate lawyer

**Integrations:** Typeform, Notion, Gmail, DocuSign, WhatsApp

---

#### WF-LAW-009: Client Follow-Up Tracker
**Status:** EXISTS - `client_followup_workflow.json`
**Annual Value:** $3,900/lawyer (relationship retention)
**Composio Coverage:** 100%

**Dynamic Parameters:**
- `inactivity_threshold`: Days before follow-up alert
- `auto_message_enabled`: boolean - auto-send check-in
- `priority_clients`: VIP client list for priority handling
- `follow_up_channels`: [whatsapp, email, call_reminder]
- `escalation_days`: Days before supervisor notified

**Integrations:** Notion, Gmail, WhatsApp, Slack

---

#### WF-LAW-010: Email to Task Converter
**Status:** NEW REQUIRED
**Annual Value:** $5,200/lawyer (reduce email overwhelm)
**Composio Coverage:** 100%

**Pain Point:** Important action items buried in email. Lawyers miss tasks hidden in long email threads.

**Dynamic Parameters:**
- `trigger_keywords`: ["please", "need", "deadline", "by tomorrow", "urgent"]
- `auto_assign`: Assign to mentioned team member
- `matter_detection`: Auto-link to case/matter
- `priority_rules`: Rules for auto-prioritization
- `confirmation_required`: boolean - confirm before creating

**Workflow Steps:**
1. TRIGGER: Email received with action keywords
2. ANALYZE: AI extracts action items + deadline
3. CREATE: Task in project management
4. LINK: Associate with client/matter
5. NOTIFY: WhatsApp alert to assigned person
6. OPTIONAL: Reply to sender confirming receipt

**Integrations:** Gmail, Asana/Notion/ClickUp, WhatsApp, Slack

---

#### WF-LAW-011: Meeting Brief Generator
**Status:** NEW REQUIRED
**Annual Value:** $3,120/lawyer (prep time savings)
**Composio Coverage:** 95%

**Pain Point:** Lawyers spend 30 min+ preparing for each client meeting by reviewing files.

**Dynamic Parameters:**
- `brief_length`: [short, detailed]
- `include_history`: Last N communications
- `include_billing`: Outstanding invoices
- `include_documents`: Recent document activity
- `delivery_time`: Hours before meeting

**Workflow Steps:**
1. TRIGGER: Calendar event (client meeting) in 2 hours
2. FETCH: Client data from CRM
3. FETCH: Recent emails/messages with client
4. FETCH: Case status + pending tasks
5. FETCH: Billing status
6. GENERATE: AI summary brief
7. SEND: To lawyer via email/Slack

**Integrations:** Google Calendar, Gmail, Notion, Slack

---

### ROI Tier 3: MODERATE (Quality of Life)

---

#### WF-LAW-012: Expense Tracking for Matters
**Status:** NEW REQUIRED
**Annual Value:** $2,600/lawyer (expense recovery)
**Composio Coverage:** 88%

**Dynamic Parameters:**
- `expense_categories`: [filing_fees, courier, printing, travel]
- `receipt_required`: boolean per category
- `auto_tag_matter`: boolean - AI detect matter from receipt
- `approval_threshold`: Amount requiring partner approval
- `reimbursement_tracking`: Track client reimbursement

**Integrations:** Gmail (receipt scanning), Google Drive, Notion, Stripe

---

#### WF-LAW-013: Court Date Conflict Checker
**Status:** NEW REQUIRED
**Annual Value:** Risk mitigation + scheduling efficiency
**Composio Coverage:** 100%

**Dynamic Parameters:**
- `lawyers`: List of firm lawyers to check
- `travel_buffer`: Minutes between appearances
- `conflict_alert_to`: [lawyer, secretary, partner]
- `auto_request_continuance`: boolean - draft motion

**Integrations:** Google Calendar, Gmail, Slack

---

#### WF-LAW-014: Research Request Router
**Status:** NEW REQUIRED
**Annual Value:** $2,080/lawyer (paralegal efficiency)
**Composio Coverage:** 100%

**Dynamic Parameters:**
- `research_categories`: [case_law, statutes, regulations, precedent]
- `assign_to`: Paralegal/junior associate pool
- `deadline_rules`: Default turnaround by type
- `format_requirements`: Citation style, length

**Integrations:** Gmail, Asana/Notion, Slack

---

#### WF-LAW-015: Weekly KPI Dashboard
**Status:** NEW REQUIRED
**Annual Value:** Partner visibility + decision making
**Composio Coverage:** 85%

**Dynamic Parameters:**
- `metrics`: [billable_hours, collections, new_matters, pending_tasks]
- `report_day`: Day of week for report
- `recipients`: [partners, practice_group_heads]
- `comparison`: Week-over-week, month-over-month

**Integrations:** Clio (custom), Google Sheets, Gmail, Slack

---

#### WF-LAW-016: Document Expiry Tracker
**Status:** NEW REQUIRED
**Annual Value:** Compliance + client service
**Composio Coverage:** 100%

**Dynamic Parameters:**
- `document_types`: [contracts, licenses, permits, certificates]
- `reminder_intervals`: [90, 60, 30, 14, 7] days before expiry
- `notify_client`: boolean - send client reminder
- `renewal_workflow`: Auto-initiate renewal process

**Integrations:** Google Calendar, Gmail, WhatsApp, Notion

---

#### WF-LAW-017: Legal Hold Management
**Status:** NEW REQUIRED
**Annual Value:** Litigation risk mitigation
**Composio Coverage:** 75%

**Dynamic Parameters:**
- `hold_scope`: [email, files, messages, all]
- `custodians`: List of people under hold
- `reminder_frequency`: Periodic hold reminder
- `release_approval`: Required approvers for release

**Integrations:** Gmail, Google Drive, Slack

---

#### WF-LAW-018: Pro Bono Hours Tracker
**Status:** NEW REQUIRED
**Annual Value:** Firm reporting + lawyer satisfaction
**Composio Coverage:** 100%

**Dynamic Parameters:**
- `annual_goal`: Firm's pro bono target hours
- `eligible_matters`: Categories that count
- `reporting_frequency`: [monthly, quarterly]
- `recognition_threshold`: Hours for firm recognition

**Integrations:** Notion, Gmail, Slack

---

# DOMAIN 2: SME OWNERS

## Annual Pain Value: $33,280 - $66,560/year per business
## Primary Channel: WhatsApp (99% penetration in GCC)
## Regional Context: ZATCA compliance, KNET payments, Arabic support

### ROI Tier 1: CRITICAL (Cash Flow & Revenue)

---

#### WF-SME-001: Invoice Payment Chase
**Status:** PARTIAL - `invoice_payment_update_accounting.json` exists
**Annual Value:** $9,984 - $19,968/business (reduce AR by 50%)
**Composio Coverage:** 92%

**Pain Point:** SME owners spend 12+ hours/month chasing payments. Average DSO is 45+ days.

**Dynamic Parameters:**
- `invoice_source`: [stripe, quickbooks, xero, manual]
- `payment_methods`: [knet, bank_transfer, card, cash]
- `chase_schedule`: [3, 7, 14, 21, 30] days
- `message_escalation`: [friendly, reminder, urgent, final]
- `knet_link_generation`: Auto-generate payment link
- `partial_payment_handling`: Accept or reject partials
- `late_fee_policy`: Auto-apply late fees (optional)
- `language`: [english, arabic, bilingual]

**Workflow Steps:**
1. TRIGGER: Invoice created/due date passed
2. MONITOR: Check payment status daily
3. Day 3: WhatsApp friendly reminder + KNET link
4. Day 7: Email reminder with PDF invoice
5. Day 14: WhatsApp urgent reminder
6. Day 21: Phone call reminder to owner
7. Day 30: Final notice + late fee applied
8. ESCALATE: Flag for legal action

**Integrations:** Stripe, KNET (custom), Gmail, WhatsApp, Google Sheets

---

#### WF-SME-002: Instant Lead Response
**Status:** EXISTS - `whatsapp_lead_followup_to_crm.json`
**Annual Value:** $16,640 - $33,280/business (391% more conversions)
**Composio Coverage:** 100%

**Pain Point:** Leads who get response within 5 minutes are 391% more likely to convert than 30-minute responses.

**Dynamic Parameters:**
- `response_template`: Customizable by lead source
- `qualification_questions`: Industry-specific intake
- `calendar_booking_link`: Auto-include booking link
- `crm_fields`: Map to custom CRM fields
- `assignment_rules`: Round-robin or territory based
- `business_hours_only`: Optional quiet hours

**Integrations:** WhatsApp, HubSpot, Google Calendar, Gmail

---

#### WF-SME-003: ZATCA E-Invoice Generator
**Status:** NEW REQUIRED
**Annual Value:** Compliance + 2 hrs/week time savings
**Composio Coverage:** 45% (requires ZATCA API - custom integration)

**Pain Point:** Saudi Arabia mandates ZATCA e-invoicing. Non-compliance = penalties. Manual compliance is time-consuming.

**Dynamic Parameters:**
- `business_vat_number`: Company VAT registration
- `invoice_template`: ZATCA-compliant template
- `qr_code_inclusion`: Required QR for B2C
- `xml_generation`: ZATCA XML format
- `portal_submission`: Auto-submit to ZATCA portal
- `retention_period`: Document retention rules

**Workflow Steps:**
1. TRIGGER: Invoice created in system
2. VALIDATE: Check ZATCA required fields
3. GENERATE: Create ZATCA-compliant invoice
4. QR: Generate ZATCA QR code
5. XML: Create XML for portal submission
6. SUBMIT: Submit to ZATCA portal (if enabled)
7. ARCHIVE: Store with retention tracking
8. NOTIFY: Send to customer

**Integrations:** Custom ZATCA API, Gmail, WhatsApp, Google Drive

**Gap Solution:** Build custom ZATCA integration using their API. Priority: HIGH for Saudi market.

---

#### WF-SME-004: Quotation to Invoice Pipeline
**Status:** NEW REQUIRED
**Annual Value:** $4,160 - $8,320/business (sales efficiency)
**Composio Coverage:** 95%

**Pain Point:** Quotes get lost, follow-up is manual, conversion tracking is poor.

**Dynamic Parameters:**
- `quote_validity_days`: Default quote expiry
- `follow_up_schedule`: [3, 7, 14] days post-quote
- `discount_authority`: Who can approve discounts
- `auto_convert_on_accept`: Convert to invoice automatically
- `version_tracking`: Track quote revisions

**Workflow Steps:**
1. TRIGGER: Quote created
2. SEND: Email/WhatsApp to customer
3. TRACK: Monitor for acceptance
4. Day 3: Follow-up if no response
5. Day 7: Second follow-up with urgency
6. If accepted: Convert to invoice automatically
7. If rejected: Log reason, notify sales

**Integrations:** Google Docs, Gmail, WhatsApp, Stripe, Notion

---

#### WF-SME-005: Inventory Low Stock Alert
**Status:** NEW REQUIRED
**Annual Value:** Prevent stockouts + overstock
**Composio Coverage:** 70% (varies by inventory system)

**Dynamic Parameters:**
- `inventory_source`: [shopify, woocommerce, custom_sheet]
- `reorder_points`: Per-product thresholds
- `supplier_auto_order`: Auto-generate PO
- `lead_time_buffer`: Days for reorder calculation
- `alert_channels`: [whatsapp, email, slack]

**Workflow Steps:**
1. TRIGGER: Daily inventory check
2. ANALYZE: Compare stock vs reorder points
3. If low: Generate reorder alert
4. OPTIONAL: Auto-create purchase order
5. SEND: Alert to owner/manager
6. TRACK: Monitor supplier response

**Integrations:** Shopify, Google Sheets, Gmail, WhatsApp

---

### ROI Tier 2: HIGH (Operational Efficiency)

---

#### WF-SME-006: Employee Leave Management
**Status:** NEW REQUIRED
**Annual Value:** $2,080/business (HR time savings)
**Composio Coverage:** 85%

**Dynamic Parameters:**
- `leave_types`: [annual, sick, personal, maternity]
- `approval_chain`: [manager, hr, owner]
- `balance_tracking`: Auto-update balances
- `overlap_check`: Check team availability
- `calendar_block`: Auto-block calendar

**Workflow Steps:**
1. TRIGGER: Leave request submitted (WhatsApp or form)
2. CHECK: Balance available
3. CHECK: Team overlap conflicts
4. ROUTE: To appropriate approver
5. If approved: Update balance + calendar
6. NOTIFY: Employee + team

**Integrations:** Google Calendar, Slack, WhatsApp, Notion

---

#### WF-SME-007: Expense Approval Workflow
**Status:** NEW REQUIRED
**Annual Value:** $1,560/business (financial control)
**Composio Coverage:** 90%

**Dynamic Parameters:**
- `expense_categories`: [travel, supplies, software, misc]
- `approval_thresholds`: {under_100: auto, under_500: manager, above: owner}
- `receipt_required_above`: Amount requiring receipt
- `budget_tracking`: Check against department budget
- `reimbursement_method`: [payroll, direct, petty_cash]

**Integrations:** Gmail, Google Sheets, Slack, WhatsApp

---

#### WF-SME-008: Supplier Payment Scheduler
**Status:** NEW REQUIRED
**Annual Value:** $1,040/business (cash flow optimization)
**Composio Coverage:** 88%

**Dynamic Parameters:**
- `payment_terms`: Days from invoice (net 30, etc.)
- `early_payment_discounts`: Auto-flag discounts
- `payment_batch_day`: Weekly payment batch day
- `approval_required_above`: Threshold for approval
- `bank_integration`: [manual, auto_initiate]

**Integrations:** Gmail, Google Sheets, Slack

---

#### WF-SME-009: Daily Sales Report
**Status:** NEW REQUIRED
**Annual Value:** Business visibility + decision making
**Composio Coverage:** 95%

**Dynamic Parameters:**
- `data_sources`: [shopify, stripe, square, manual]
- `metrics`: [revenue, orders, top_products, refunds]
- `report_time`: Daily delivery time
- `comparison`: Day-over-day, week-over-week
- `delivery_channel`: [email, whatsapp, slack]

**Integrations:** Shopify, Stripe, Gmail, WhatsApp

---

#### WF-SME-010: Customer Birthday/Anniversary Messages
**Status:** NEW REQUIRED
**Annual Value:** Customer retention + repeat business
**Composio Coverage:** 100%

**Dynamic Parameters:**
- `occasion_types`: [birthday, signup_anniversary, first_purchase]
- `message_template`: Customizable per occasion
- `offer_inclusion`: Optional discount/offer
- `send_time`: Time of day to send
- `channel`: [whatsapp, email, sms]

**Integrations:** HubSpot, WhatsApp, Gmail

---

#### WF-SME-011: Social Media Review Monitor
**Status:** NEW REQUIRED
**Annual Value:** Reputation management
**Composio Coverage:** 80%

**Dynamic Parameters:**
- `platforms`: [google, facebook, instagram, yelp]
- `alert_threshold`: Star rating to alert on
- `response_template`: Auto-response for positive
- `escalation_for_negative`: Alert owner for negative
- `weekly_digest`: Summary of new reviews

**Integrations:** Google My Business (custom), Slack, Gmail

---

#### WF-SME-012: Contract Renewal Tracker
**Status:** NEW REQUIRED
**Annual Value:** Prevent lapses + renewals
**Composio Coverage:** 100%

**Dynamic Parameters:**
- `contract_types`: [lease, vendor, service, license]
- `reminder_intervals`: [90, 60, 30, 14, 7] days
- `auto_renewal_alert`: Alert before auto-renewal
- `renegotiation_trigger`: Flag for renegotiation

**Integrations:** Google Calendar, Gmail, WhatsApp, Notion

---

### ROI Tier 3: MODERATE (Quality Improvements)

---

#### WF-SME-013: Meeting Scheduler with Prep
**Status:** NEW REQUIRED
**Annual Value:** Time savings + professionalism
**Composio Coverage:** 100%

**Dynamic Parameters:**
- `booking_link`: Calendly/Cal.com integration
- `prep_time_buffer`: Minutes before meeting blocked
- `reminder_schedule`: [24h, 2h, 15m]
- `meeting_brief`: Auto-generate context brief
- `post_meeting_followup`: Auto-send notes

**Integrations:** Calendly, Google Calendar, Gmail, WhatsApp

---

#### WF-SME-014: Employee Onboarding Checklist
**Status:** NEW REQUIRED
**Annual Value:** Consistent onboarding experience
**Composio Coverage:** 100%

**Dynamic Parameters:**
- `onboarding_tasks`: Customizable checklist
- `document_requests`: [id, bank, emergency_contact]
- `access_provisioning`: [email, slack, tools]
- `training_schedule`: Auto-schedule training
- `buddy_assignment`: Assign onboarding buddy

**Integrations:** Notion, Gmail, Slack, Google Workspace

---

#### WF-SME-015: Customer Feedback Collection
**Status:** NEW REQUIRED
**Annual Value:** Service improvement
**Composio Coverage:** 100%

**Dynamic Parameters:**
- `trigger_event`: [purchase, service_complete, X_days_after]
- `survey_type`: [nps, csat, custom]
- `follow_up_for_low_scores`: Auto-escalate negative
- `review_request`: Ask happy customers for reviews
- `aggregate_reporting`: Weekly summary

**Integrations:** Typeform, WhatsApp, Gmail, Google Sheets

---

#### WF-SME-016: Project Milestone Tracker
**Status:** NEW REQUIRED
**Annual Value:** Client communication + project control
**Composio Coverage:** 100%

**Dynamic Parameters:**
- `milestone_notifications`: [start, progress, complete]
- `client_visibility`: Share progress with client
- `delay_escalation`: Alert on missed milestones
- `invoice_trigger`: Auto-invoice on milestone

**Integrations:** Asana/Notion, Gmail, WhatsApp, Stripe

---

#### WF-SME-017: Weekly Team Standup Collector
**Status:** NEW REQUIRED
**Annual Value:** Team visibility without meetings
**Composio Coverage:** 100%

**Dynamic Parameters:**
- `standup_questions`: [done, doing, blockers]
- `collection_time`: When to prompt team
- `summary_delivery`: When to deliver digest
- `blocker_escalation`: Flag blockers to manager

**Integrations:** Slack, Notion, Gmail

---

#### WF-SME-018: Vendor Comparison Database
**Status:** NEW REQUIRED
**Annual Value:** Procurement efficiency
**Composio Coverage:** 95%

**Dynamic Parameters:**
- `vendor_categories`: [supplies, services, materials]
- `comparison_fields`: [price, quality, lead_time]
- `review_frequency`: Quarterly vendor review
- `reorder_automation`: Preferred vendor auto-order

**Integrations:** Google Sheets, Gmail, Notion

---

#### WF-SME-019: Office/Shop Opening Checklist
**Status:** NEW REQUIRED
**Annual Value:** Operational consistency
**Composio Coverage:** 100%

**Dynamic Parameters:**
- `checklist_items`: Daily opening tasks
- `completion_tracking`: Who completed what
- `exception_escalation`: Alert for missed items
- `photo_verification`: Optional photo proof

**Integrations:** WhatsApp, Slack, Google Sheets

---

#### WF-SME-020: Utility Bill Tracker
**Status:** NEW REQUIRED
**Annual Value:** Cost control + no late fees
**Composio Coverage:** 85%

**Dynamic Parameters:**
- `utility_types`: [electricity, water, internet, phone]
- `due_date_tracking`: Parse from emails/photos
- `payment_reminders`: Days before due
- `expense_categorization`: Auto-categorize

**Integrations:** Gmail, Google Sheets, WhatsApp

---

#### WF-SME-021: Customer Complaint Handler
**Status:** NEW REQUIRED
**Annual Value:** Customer retention
**Composio Coverage:** 100%

**Dynamic Parameters:**
- `intake_channels`: [whatsapp, email, form]
- `priority_rules`: Urgency classification
- `escalation_time`: Hours before escalation
- `resolution_tracking`: SLA monitoring
- `follow_up_survey`: Post-resolution feedback

**Integrations:** WhatsApp, Gmail, Notion, Slack

---

#### WF-SME-022: Annual Compliance Reminder
**Status:** NEW REQUIRED
**Annual Value:** Avoid penalties
**Composio Coverage:** 100%

**Dynamic Parameters:**
- `compliance_items`: [license_renewal, tax_filing, insurance]
- `jurisdiction`: Country-specific requirements
- `reminder_intervals`: [60, 30, 14, 7] days
- `document_preparation`: Checklist for each item

**Integrations:** Google Calendar, Gmail, WhatsApp

---

# DOMAIN 3: CLINIC DOCTORS

## Annual Pain Value: $78,000 - $176,800/year per doctor
## Primary Channel: WhatsApp (patient preference in GCC)
## Regional Context: MOH compliance, Arabic patient communication

### ROI Tier 1: CRITICAL (Revenue & Patient Safety)

---

#### WF-CLINIC-001: Appointment Reminder Chain
**Status:** EXISTS - `appointment_reminder_workflow.json`
**Annual Value:** $23,400 - $53,040/doctor (25% no-show reduction)
**Composio Coverage:** 100%

**Pain Point:** 25-30% no-show rate in GCC clinics. Each no-show = $100-300 lost revenue.

**Dynamic Parameters:**
- `reminder_schedule`: [24h, 2h] before appointment
- `confirmation_required`: boolean - ask for confirm/cancel
- `waitlist_backfill`: Auto-fill from waitlist if cancelled
- `no_show_tracking`: Flag repeat no-shows
- `deposit_for_high_risk`: Require deposit from frequent no-shows
- `language`: [english, arabic, bilingual]
- `message_tone`: [formal, friendly]

**Integrations:** Google Calendar, WhatsApp, Gmail, Slack

---

#### WF-CLINIC-002: Insurance Pre-Authorization
**Status:** NEW REQUIRED
**Annual Value:** $39,000 - $78,000/doctor (20 min/patient saved)
**Composio Coverage:** 35% (requires insurance API - custom)

**Pain Point:** Doctors spend 20 minutes per patient on insurance pre-auth. Delays lead to patient frustration.

**Dynamic Parameters:**
- `insurance_providers`: [bupa, gig, allianz, axa, etc.]
- `procedure_codes`: Common procedure CPT codes
- `auto_submit`: boolean - auto-submit to portal
- `approval_tracking`: Monitor approval status
- `escalation_time`: Hours before escalation
- `patient_notification`: Notify patient of status

**Workflow Steps:**
1. TRIGGER: Appointment scheduled for procedure
2. FETCH: Patient insurance details from EMR
3. PREPARE: Pre-auth request with procedure codes
4. SUBMIT: To insurance portal (if API available)
5. TRACK: Monitor for approval
6. NOTIFY: Doctor/staff of approval status
7. NOTIFY: Patient of coverage confirmation

**Integrations:** Custom Insurance APIs, Gmail, WhatsApp, Notion

**Gap Solution:** Build insurance portal integrations. Major opportunity but complex. Consider middleware approach.

---

#### WF-CLINIC-003: Lab Result Escalation
**Status:** NEW REQUIRED
**Annual Value:** Patient safety + liability reduction
**Composio Coverage:** 40% (requires lab system API - custom)

**Pain Point:** Critical lab results can get missed. Delayed action on critical values = patient harm.

**Dynamic Parameters:**
- `critical_values`: Define critical thresholds per test
- `escalation_levels`: [nurse, doctor, on-call, admin]
- `acknowledgment_required`: Must acknowledge within X minutes
- `patient_notification`: When to notify patient
- `documentation`: Auto-document notification chain

**Workflow Steps:**
1. TRIGGER: Lab result received
2. ANALYZE: Check against critical value thresholds
3. If critical: Immediate escalation
4. NOTIFY: Doctor via WhatsApp + call
5. TRACK: Wait for acknowledgment
6. If no ack: Escalate to backup
7. DOCUMENT: Record notification chain

**Integrations:** Lab system (custom), WhatsApp, Gmail, Slack

**Gap Solution:** Build lab system integrations. Start with major lab providers in GCC.

---

#### WF-CLINIC-004: Prescription Refill Request
**Status:** NEW REQUIRED
**Annual Value:** $7,800/doctor (staff time savings)
**Composio Coverage:** 45% (requires pharmacy API - custom)

**Pain Point:** Phone calls for refill requests consume staff time. Patients wait on hold.

**Dynamic Parameters:**
- `eligible_medications`: List of refillable medications
- `refill_limit`: Max refills before review
- `auto_approve_criteria`: Conditions for auto-approval
- `pharmacy_integration`: Send directly to pharmacy
- `patient_pickup_notice`: Notify when ready

**Workflow Steps:**
1. TRIGGER: Patient WhatsApp request "refill [medication]"
2. VERIFY: Patient identity + medication eligibility
3. CHECK: Refill count within limit
4. If eligible: Auto-approve and send to pharmacy
5. If review needed: Queue for doctor review
6. NOTIFY: Patient of status + pickup info

**Integrations:** WhatsApp, Custom Pharmacy API, Gmail

---

### ROI Tier 2: HIGH (Efficiency & Patient Experience)

---

#### WF-CLINIC-005: Patient Follow-Up Chain
**Status:** NEW REQUIRED
**Annual Value:** $5,200/doctor (improved outcomes)
**Composio Coverage:** 100%

**Dynamic Parameters:**
- `follow_up_schedule`: Days post-visit by visit type
- `check_in_questions`: Symptom check questions
- `escalation_triggers`: Responses that trigger callback
- `satisfaction_survey`: Include satisfaction questions
- `rebooking_prompt`: Suggest next appointment

**Integrations:** WhatsApp, Gmail, Google Calendar, Notion

---

#### WF-CLINIC-006: Patient Intake Form Automation
**Status:** NEW REQUIRED
**Annual Value:** $3,900/doctor (10 min/patient saved)
**Composio Coverage:** 95%

**Dynamic Parameters:**
- `form_type`: By appointment type
- `pre_appointment_send`: Hours before appointment
- `required_fields`: Mandatory vs optional
- `insurance_verification`: Capture insurance details
- `consent_collection`: Digital consent forms

**Workflow Steps:**
1. TRIGGER: Appointment scheduled
2. SEND: Intake form link via WhatsApp
3. REMIND: If not completed by X hours before
4. RECEIVE: Completed form
5. POPULATE: Patient record in EMR
6. ALERT: Staff of new/changed information

**Integrations:** Typeform, WhatsApp, Gmail, Notion

---

#### WF-CLINIC-007: Post-Procedure Care Instructions
**Status:** NEW REQUIRED
**Annual Value:** Reduced complications + calls
**Composio Coverage:** 100%

**Dynamic Parameters:**
- `procedure_library`: Instructions per procedure type
- `delivery_timing`: Immediately after or next day
- `check_in_schedule`: Follow-up check points
- `warning_signs`: When to seek immediate care
- `emergency_contact`: Clinic emergency line

**Integrations:** Gmail, WhatsApp, Google Docs

---

#### WF-CLINIC-008: Waitlist Management
**Status:** NEW REQUIRED
**Annual Value:** Fill cancelled slots = recovered revenue
**Composio Coverage:** 100%

**Dynamic Parameters:**
- `waitlist_criteria`: Patient preferences for time/doctor
- `notification_order`: Priority order for contact
- `response_deadline`: Minutes to respond
- `auto_book_if_accepted`: Auto-update calendar
- `confirmation_required`: Double-confirm before booking

**Integrations:** Google Calendar, WhatsApp, Gmail

---

#### WF-CLINIC-009: MOH Reporting Automation
**Status:** NEW REQUIRED
**Annual Value:** Compliance + staff time savings
**Composio Coverage:** 30% (requires MOH API - custom)

**Pain Point:** Ministry of Health requires specific reports. Manual compilation is time-consuming.

**Dynamic Parameters:**
- `report_types`: [patient_stats, disease_reporting, quality_metrics]
- `report_frequency`: Daily, weekly, monthly
- `data_sources`: EMR + lab + pharmacy
- `submission_method`: [portal, email, manual]
- `archive_retention`: Document retention

**Gap Solution:** Build MOH integration. High value for compliance-focused clinics.

**Integrations:** Custom MOH API, Google Sheets, Gmail

---

#### WF-CLINIC-010: Doctor Schedule Optimization
**Status:** NEW REQUIRED
**Annual Value:** Reduced gaps, better utilization
**Composio Coverage:** 85%

**Dynamic Parameters:**
- `appointment_types`: Duration per type
- `buffer_time`: Minutes between appointments
- `lunch_block`: Protected lunch time
- `overbooking_rules`: When to allow overbooking
- `utilization_target`: Target % booked

**Integrations:** Google Calendar, Slack, Gmail

---

### ROI Tier 3: MODERATE (Quality & Convenience)

---

#### WF-CLINIC-011: Patient Birthday Messages
**Status:** NEW REQUIRED
**Annual Value:** Patient loyalty
**Composio Coverage:** 100%

**Dynamic Parameters:**
- `message_template`: Customizable by clinic
- `health_tip_inclusion`: Optional health tip
- `offer_inclusion`: Optional discount/checkup offer
- `send_time`: Morning or specific time

**Integrations:** HubSpot/Notion, WhatsApp, Gmail

---

#### WF-CLINIC-012: Referral Thank You & Tracking
**Status:** NEW REQUIRED
**Annual Value:** Referral growth
**Composio Coverage:** 100%

**Dynamic Parameters:**
- `referral_sources`: [patient, doctor, walk_in]
- `thank_you_message`: Template by source
- `referral_tracking`: Track referral conversions
- `referral_incentive`: Optional program

**Integrations:** WhatsApp, Gmail, Notion

---

#### WF-CLINIC-013: Equipment Maintenance Scheduler
**Status:** NEW REQUIRED
**Annual Value:** Prevent downtime
**Composio Coverage:** 100%

**Dynamic Parameters:**
- `equipment_list`: Clinic equipment inventory
- `maintenance_intervals`: Per equipment type
- `vendor_contacts`: Maintenance provider info
- `service_tracking`: Log maintenance history
- `certification_tracking`: Track calibration certs

**Integrations:** Google Calendar, Gmail, Google Sheets

---

#### WF-CLINIC-014: Staff Credential Tracker
**Status:** NEW REQUIRED
**Annual Value:** Compliance + risk management
**Composio Coverage:** 100%

**Dynamic Parameters:**
- `credential_types`: [license, certification, cpr, malpractice]
- `staff_list`: All clinical staff
- `reminder_intervals`: [90, 60, 30, 14] days
- `verification_required`: Proof of renewal
- `suspension_alert`: Alert if expired

**Integrations:** Google Calendar, Gmail, Notion, Slack

---

#### WF-CLINIC-015: Daily Clinic Stats Dashboard
**Status:** NEW REQUIRED
**Annual Value:** Operations visibility
**Composio Coverage:** 90%

**Dynamic Parameters:**
- `metrics`: [patients_seen, no_shows, revenue, wait_time]
- `report_time`: End of day delivery
- `comparison`: Day vs week average
- `alert_thresholds`: Unusual patterns

**Integrations:** Google Sheets, Gmail, Slack

---

# DOMAIN 4: HOSPITAL / ER DIRECTORS

## Annual Pain Value: $650,000+ per ER (burnout-related costs)
## Primary Channel: Slack/Teams + SMS for critical
## Regional Context: Multi-hospital systems, shift-based staffing

### ROI Tier 1: CRITICAL (Patient Safety & Staff Burnout)

---

#### WF-HOSP-001: Daily ED Briefing Report
**Status:** NEW REQUIRED
**Annual Value:** $130,000+ (reduce 5.8 hrs/shift → 1 hr)
**Composio Coverage:** 50% (requires EHR API - custom)

**Pain Point:** ER doctors spend 5.8 hours/shift on EHR documentation. 63% experience burnout.

**Dynamic Parameters:**
- `data_sources`: [ehr, bed_management, labs, admissions]
- `report_time`: Shift start (6AM, 2PM, 10PM)
- `include_sections`: [census, critical_patients, pending_labs, bed_status]
- `delivery_channels`: [slack, email, dashboard]
- `night_shift_summary`: Handoff summary for incoming

**Workflow Steps:**
1. TRIGGER: 30 min before shift start
2. FETCH: Current ED census from bed management
3. FETCH: Critical patient list from EHR
4. FETCH: Pending labs/imaging
5. FETCH: Admission/discharge status
6. COMPILE: AI-generated shift briefing
7. SEND: To incoming shift staff
8. POST: To ED Slack channel

**Integrations:** Custom EHR API, Slack, Gmail

**Gap Solution:** Build EHR integration (Epic, Cerner). Major project but highest value. Consider FHIR standardized approach.

---

#### WF-HOSP-002: Staffing Gap Alert
**Status:** NEW REQUIRED
**Annual Value:** Prevent understaffing + overtime costs
**Composio Coverage:** 60% (scheduling system API - varies)

**Pain Point:** Last-minute callouts create gaps. Finding coverage is manual and slow.

**Dynamic Parameters:**
- `staff_categories`: [physician, nurse, tech, admin]
- `minimum_ratios`: Required staff per shift
- `callout_tracking`: Monitor call-in patterns
- `coverage_pool`: Available on-call staff
- `auto_notify`: Auto-contact coverage pool
- `overtime_authorization`: Approval threshold

**Workflow Steps:**
1. TRIGGER: Callout received or shift unfilled
2. ANALYZE: Check against minimum ratios
3. If gap: Identify coverage pool
4. NOTIFY: Auto-contact potential coverage (priority order)
5. TRACK: Responses and acceptances
6. ESCALATE: To supervisor if no coverage
7. DOCUMENT: Log for pattern analysis

**Integrations:** Custom Scheduling API, WhatsApp, Slack, Gmail

---

#### WF-HOSP-003: Shift Handoff Automation
**Status:** NEW REQUIRED
**Annual Value:** Reduce errors, save 30 min/handoff
**Composio Coverage:** 45% (requires EHR - custom)

**Pain Point:** Poor handoffs cause 80% of serious medical errors. Manual handoffs take 30+ minutes.

**Dynamic Parameters:**
- `handoff_format`: [SBAR, I-PASS, custom]
- `required_sections`: [patient_list, critical_updates, pending_tasks]
- `acknowledgment_required`: Receiving must acknowledge
- `verbal_required`: Flag for verbal handoff needed
- `documentation`: Auto-document in EHR

**Workflow Steps:**
1. TRIGGER: 30 min before shift end
2. FETCH: Current patient assignments
3. GENERATE: AI summary per patient (SBAR format)
4. FLAG: Critical patients requiring verbal handoff
5. SEND: To incoming staff
6. TRACK: Acknowledgment receipt
7. DOCUMENT: Log handoff in EHR

**Integrations:** Custom EHR API, Slack, Gmail

---

#### WF-HOSP-004: Family Status Notification
**Status:** NEW REQUIRED
**Annual Value:** Patient satisfaction + reduced calls
**Composio Coverage:** 85%

**Pain Point:** Families call constantly for updates. Staff time spent on phone instead of care.

**Dynamic Parameters:**
- `update_types`: [admitted, in_procedure, in_recovery, ready_for_discharge]
- `notification_timing`: Automatic after status change
- `message_templates`: HIPAA-compliant templates
- `contact_verification`: Verify family member identity
- `language_preference`: [english, arabic]

**Workflow Steps:**
1. TRIGGER: Patient status changes in system
2. VERIFY: Family contact on file
3. GENERATE: Status update message
4. SEND: Via WhatsApp or SMS
5. LOG: Communication in patient record
6. HANDLE: Family replies/questions

**Integrations:** WhatsApp, SMS (Twilio), Custom EHR API

---

#### WF-HOSP-005: Violence Incident Reporting
**Status:** NEW REQUIRED
**Annual Value:** Staff safety + legal compliance
**Composio Coverage:** 75%

**Pain Point:** Healthcare workplace violence increasing. Underreporting due to complex forms.

**Dynamic Parameters:**
- `incident_types`: [verbal, physical, threat, weapon]
- `immediate_alert_for`: High-severity incidents
- `report_fields`: Required documentation
- `escalation_chain`: Security → Admin → Legal
- `follow_up_tracking`: Support for affected staff
- `pattern_analysis`: Track repeat offenders

**Workflow Steps:**
1. TRIGGER: Staff WhatsApp "incident" or panic button
2. IMMEDIATE: Alert security for active situations
3. COLLECT: Incident details via guided form
4. DOCUMENT: Create formal incident report
5. NOTIFY: Appropriate chain of command
6. FOLLOW-UP: Check on affected staff
7. ANALYZE: Add to pattern database

**Integrations:** WhatsApp, Slack, Gmail, Google Forms

---

### ROI Tier 2: HIGH (Operations & Efficiency)

---

#### WF-HOSP-006: Bed Management Dashboard
**Status:** NEW REQUIRED
**Annual Value:** Reduce boarding time, improve throughput
**Composio Coverage:** 40% (requires bed mgmt system - custom)

**Dynamic Parameters:**
- `bed_categories`: [icu, step_down, med_surg, er_hold]
- `status_tracking`: [available, occupied, cleaning, pending_discharge]
- `alert_thresholds`: Capacity alerts at X%
- `discharge_prediction`: AI predict discharge times
- `escalation_for_boarding`: Alert when boarding > X hours

**Integrations:** Custom Bed Mgmt API, Slack, Gmail

---

#### WF-HOSP-007: Lab Result Routing
**Status:** NEW REQUIRED
**Annual Value:** Faster results, better care
**Composio Coverage:** 45% (requires lab system - custom)

**Dynamic Parameters:**
- `critical_values`: Auto-escalate critical results
- `routing_rules`: Route to ordering physician
- `acknowledgment_tracking`: Track result acknowledgment
- `pending_alerts`: Alert for overdue results
- `stat_prioritization`: Flag STAT orders

**Integrations:** Custom Lab API, Slack, Gmail

---

#### WF-HOSP-008: Pharmacy Stock Alert
**Status:** NEW REQUIRED
**Annual Value:** Prevent medication stockouts
**Composio Coverage:** 55% (requires pharmacy system - custom)

**Dynamic Parameters:**
- `critical_medications`: Priority medication list
- `par_levels`: Minimum stock thresholds
- `auto_order`: Auto-generate orders
- `expiration_tracking`: Alert for expiring meds
- `recall_handling`: Process for recalls

**Integrations:** Custom Pharmacy API, Slack, Gmail

---

#### WF-HOSP-009: Department Meeting Scheduler
**Status:** NEW REQUIRED
**Annual Value:** Coordination efficiency
**Composio Coverage:** 100%

**Dynamic Parameters:**
- `meeting_types`: [huddle, staff_meeting, quality_review]
- `recurring_schedule`: Weekly/monthly patterns
- `attendance_tracking`: Track who attends
- `agenda_distribution`: Auto-send agenda
- `minutes_collection`: Capture action items

**Integrations:** Google Calendar, Slack, Gmail, Notion

---

#### WF-HOSP-010: Quality Metric Tracker
**Status:** NEW REQUIRED
**Annual Value:** Accreditation + quality improvement
**Composio Coverage:** 50% (varies by metric source)

**Dynamic Parameters:**
- `metrics`: [door_to_doc, readmission, patient_satisfaction, wait_time]
- `data_sources`: Multiple system integration
- `benchmark_comparison`: Compare to goals/national
- `report_frequency`: Daily, weekly, monthly
- `alert_for_outliers`: Flag concerning trends

**Integrations:** Custom APIs, Google Sheets, Slack

---

### ROI Tier 3: MODERATE (Support Functions)

---

#### WF-HOSP-011: Equipment Location Tracking
**Status:** NEW REQUIRED
**Annual Value:** Reduce time finding equipment
**Composio Coverage:** 35% (requires RTLS - custom)

**Dynamic Parameters:**
- `equipment_types`: [wheelchairs, IV_pumps, monitors]
- `zone_tracking`: Last known location
- `checkout_system`: Who has equipment
- `maintenance_status`: Available vs out of service
- `search_function`: Find equipment requests

**Integrations:** Custom RTLS API, Slack

---

#### WF-HOSP-012: Visitor Management
**Status:** NEW REQUIRED
**Annual Value:** Security + COVID-era protocols
**Composio Coverage:** 80%

**Dynamic Parameters:**
- `visitor_limits`: Max visitors per patient
- `check_in_process`: Digital check-in
- `screening_questions`: Health screening
- `badge_printing`: Visitor badge generation
- `time_tracking`: Visit duration limits

**Integrations:** Custom visitor system, SMS, Slack

---

# COMPOSIO COVERAGE SUMMARY

## Full Coverage (90%+ via Composio)

| Integration | Status | Key Tools |
|-------------|--------|-----------|
| Gmail | FULL | Send, receive, search, labels |
| Slack | FULL | Messages, channels, threads |
| WhatsApp (Business) | FULL | Send, templates, receive webhook |
| Google Calendar | FULL | Create, update, list, watch |
| Google Sheets | FULL | Read, write, append, batch |
| Google Drive | FULL | Upload, download, search |
| Notion | FULL | Pages, databases, queries |
| HubSpot | FULL | Contacts, deals, companies |
| DocuSign | FULL | Send, status, download |
| Stripe | FULL | Payments, customers, invoices |
| Asana | FULL | Tasks, projects, sections |
| Trello | FULL | Cards, boards, lists |
| Calendly | FULL | Scheduling, invitees |
| Typeform | FULL | Responses, webhooks |

## Partial Coverage (50-89% via Composio)

| Integration | Status | Gap |
|-------------|--------|-----|
| Shopify | PARTIAL | Some advanced order management |
| QuickBooks | PARTIAL | Some reporting features |
| Xero | PARTIAL | Bank reconciliation |
| Twilio SMS | PARTIAL | Some advanced features |
| LinkedIn | PARTIAL | Limited posting features |

## Requires Custom Integration (Below 50%)

| Integration | Coverage | Priority | Solution |
|-------------|----------|----------|----------|
| ZATCA | 0% | HIGH (Saudi) | Build custom API integration |
| KNET | 0% | HIGH (Kuwait) | Build payment gateway integration |
| MOH (GCC) | 0% | MEDIUM | Build ministry integration |
| Insurance Portals | 0% | HIGH | Multiple provider integrations |
| EHR Systems | 0% | CRITICAL | Epic/Cerner FHIR integration |
| Lab Systems | 0% | HIGH | LabCorp/Quest integration |
| Pharmacy Systems | 0% | MEDIUM | Pharmacy chain APIs |
| Bed Management | 0% | HIGH | Hospital system integration |
| Clio (Legal) | 30% | HIGH | Build billing sync |

---

# GAP CLOSURE STRATEGY

## Phase 1: High-ROI Custom Integrations (Months 1-3)

### 1. KNET Payment Gateway
**Value:** Enables payment workflows for ALL Kuwait businesses
**Complexity:** Medium
**Approach:** Direct API integration with KNET

### 2. ZATCA E-Invoicing
**Value:** Mandatory for Saudi businesses (huge market)
**Complexity:** Medium
**Approach:** Build ZATCA-compliant invoice generator

### 3. DocuSign Advanced
**Value:** Better signature tracking beyond basic
**Complexity:** Low
**Approach:** Expand existing Composio integration

## Phase 2: Healthcare Focus (Months 3-6)

### 4. Insurance Pre-Auth Portals
**Value:** $78K/year per doctor
**Complexity:** High (multiple providers)
**Approach:** Start with top 3 GCC insurers (BUPA, GIG, Allianz)

### 5. Lab System Integration
**Value:** Patient safety + efficiency
**Complexity:** High
**Approach:** FHIR-based for standardization

### 6. MOH Reporting
**Value:** Compliance automation
**Complexity:** Medium
**Approach:** Kuwait MOH first, then expand

## Phase 3: Enterprise Healthcare (Months 6-12)

### 7. EHR Integration (Epic/Cerner)
**Value:** Transforms hospital workflow
**Complexity:** Very High
**Approach:** Partner with Epic/Cerner certified integrators

### 8. Bed Management Systems
**Value:** ED throughput optimization
**Complexity:** High
**Approach:** Start with one hospital system

---

# TEMPLATE FLEXIBILITY PATTERNS

All templates follow these flexibility principles:

## 1. Channel Agnostic
```json
{
  "notification_channels": {
    "type": "array",
    "options": ["whatsapp", "email", "slack", "sms"],
    "default": ["whatsapp"]
  }
}
```

## 2. Timing Configurable
```json
{
  "schedule": {
    "reminder_intervals": [7, 3, 1],
    "timezone": "Asia/Kuwait",
    "business_hours": { "start": "08:00", "end": "17:00" },
    "work_days": [0, 1, 2, 3, 4]
  }
}
```

## 3. Language Adaptive
```json
{
  "language": {
    "type": "select",
    "options": ["english", "arabic", "bilingual"],
    "default": "bilingual"
  }
}
```

## 4. Escalation Customizable
```json
{
  "escalation": {
    "thresholds": { "warn": 3, "escalate": 7, "critical": 14 },
    "recipients_by_level": {
      "warn": ["assigned_user"],
      "escalate": ["manager"],
      "critical": ["owner", "partner"]
    }
  }
}
```

## 5. Integration Swappable
```json
{
  "crm_integration": {
    "type": "select",
    "options": ["hubspot", "salesforce", "pipedrive", "notion"],
    "required": true
  }
}
```

---

# IMPLEMENTATION PRIORITY MATRIX

## Immediate (Week 1-2): Extend Existing Templates

| Template | Action |
|----------|--------|
| signature_chase_workflow | Add Arabic support, KNET link |
| court_deadline_workflow | Add Kuwait court types |
| appointment_reminder_workflow | Add Arabic messages |
| client_followup_workflow | Add WhatsApp as primary |

## Short-Term (Month 1): High-ROI New Templates

| Template | Domain | ROI |
|----------|--------|-----|
| WF-LAW-002 | Lawyers | $78K/year |
| WF-SME-001 | SME | $20K/year |
| WF-CLINIC-002 | Doctors | $78K/year |
| WF-HOSP-001 | Hospital | $130K/year |

## Medium-Term (Months 2-3): Core Workflow Library

- Complete all Tier 1 templates across domains
- Build KNET and ZATCA integrations
- Launch top 20 templates

## Long-Term (Months 4-6): Enterprise & Healthcare

- EHR integrations
- Insurance portal integrations
- Lab system integrations
- Full hospital workflow suite

---

# APPENDIX: EXISTING TEMPLATE STATUS

| Template File | Domain | Status | Updates Needed |
|---------------|--------|--------|----------------|
| signature_chase_workflow.json | Lawyers | ACTIVE | Add Arabic, KNET |
| court_deadline_workflow.json | Lawyers | ACTIVE | Add Kuwait courts |
| client_followup_workflow.json | Lawyers | ACTIVE | WhatsApp primary |
| appointment_reminder_workflow.json | Clinic | ACTIVE | Add Arabic |
| whatsapp_lead_followup_to_crm.json | SME | ACTIVE | Add qualification |
| invoice_payment_update_accounting.json | SME | ACTIVE | Add KNET |
| client_onboarding_full.json | All | ACTIVE | Add DocuSign |

---

**Document Version:** 1.0
**Last Updated:** 2026-02-03
**Total Templates Defined:** 67
**Existing Templates:** 7
**New Templates Required:** 60
**Composio Coverage:** 85%
**Custom Integration Required:** 15%

---

## Sources

- [Composio Tool Catalog](https://composio.dev/tools)
- [Composio Integrations List](https://composio.dev/toolkits)
- NEXUS-DEFINITIVE-BUSINESS-STRATEGY.md (Internal Research)
