# Cycle 2: Concrete Test Scenarios for 10/10 AI Quality

**Author:** Scenario Tester Agent
**Date:** 2026-02-19
**Purpose:** Define pass/fail criteria for each AI quality dimension
**Baseline:** Board Meeting 1 Opus verdict = 5/10 overall

---

## DIMENSION 1: Tool Wiring Accuracy (8/10 -> 10/10)

### Current State Analysis
The prompt already has strong tool-fidelity rules (@NEXUS-FIX-121, @NEXUS-FIX-123, @NEXUS-FIX-125). The 2/10 gap comes from edge cases where the AI still silently adds tools or picks wrong tool variants.

---

### TEST-01: Notification Channel Assumption
**Input:** "When a new lead comes into my HubSpot, log it somewhere"
**Current behavior (failing):** AI adds a Slack or Google Sheets step without asking, because "log it" triggers a default assumption.
**Expected behavior (10/10):**
- AI returns `shouldGenerateWorkflow: false`, `intent: "clarifying"`
- Asks: "Where should I log the lead?" with options like Google Sheets, Notion, Airtable, Excel, Custom...
- Does NOT generate a workflow until user answers
**Phase:** Discovery (Phase 1)
**Expected confidence:** 0.45
**Acceptance criteria:**
- [ ] No `workflowSpec` in response
- [ ] `clarifyingQuestions` array has question about destination tool
- [ ] No tool other than `hubspot` appears anywhere in the response
- [ ] After user answers "Google Sheets", workflow contains ONLY hubspot + googlesheets

### TEST-02: WhatsApp Personal vs Business Ambiguity
**Input:** "Send a WhatsApp reminder to my client every Monday"
**Current behavior (failing):** AI sometimes uses `whatsapp-business` because "client" implies business context, even though user didn't say "WhatsApp Business."
**Expected behavior (10/10):**
- AI uses `tool: "whatsapp"` (personal) per the default rule in the prompt
- Only uses `whatsapp-business` if user explicitly says "WhatsApp Business" or "WA Business"
- Workflow has `config: { "executorHint": "native-whatsapp" }` on the WhatsApp step
**Phase:** Generation (Phase 2) - user specified enough (WhatsApp + Monday + reminder)
**Expected confidence:** 0.72
**Acceptance criteria:**
- [ ] WhatsApp step uses `tool: "whatsapp"`, NOT `tool: "whatsapp-business"`
- [ ] `config.executorHint` is `"native-whatsapp"`
- [ ] `requiredIntegrations` includes `"whatsapp"`, not `"whatsapp-business"`
- [ ] `missingInfo` asks about client's phone number or contact selection

### TEST-03: AI Step vs External Tool Confusion
**Input:** "Summarize my daily emails and send me the summary on Slack"
**Current behavior (failing):** AI sometimes adds a tool like `deepgram` or `fireflies` for summarization instead of using the `ai` tool type. Or it uses `tool: "summarize"` instead of `tool: "ai"`.
**Expected behavior (10/10):**
- Step 1: `tool: "gmail"`, `type: "trigger"` (watch for emails)
- Step 2: `tool: "ai"`, `type: "action"`, `config: { "executorHint": "ai", "complexity": "moderate" }` (summarize)
- Step 3: `tool: "slack"`, `type: "action"` (send summary)
- All three tools were explicitly mentioned or are the obvious direct choice
**Phase:** Generation (Phase 2) - user named Gmail + Slack + "summarize" maps to AI
**Expected confidence:** 0.82
**Acceptance criteria:**
- [ ] Summarization step uses `tool: "ai"` with `executorHint: "ai"`
- [ ] `complexity` is `"moderate"` (not simple, not complex)
- [ ] No external transcription/summarization tools added
- [ ] Exactly 3 steps, no extras
- [ ] `requiredIntegrations` is `["gmail", "slack"]` (AI step doesn't need integration)

---

## DIMENSION 2: Business Diagnosis (2/10 -> 10/10)

### Current State Analysis
The prompt has @NEXUS-FIX-165 for complaint patterns, but the instructions are thin: just "ask diagnostic questions." There's no framework for HOW to diagnose, what questions to ask for different problem types, or when to transition from diagnosis to workflow suggestion. The AI currently either (a) immediately suggests a workflow for the complaint, or (b) asks one generic question and then suggests a workflow.

### Gap Identified in Prompt
Lines 253-264 say "ask diagnostic questions" but give only 3 example questions ("What changed?", "When did this start?", "What metrics are you tracking?"). There's no depth. A 10/10 business diagnosis needs:
1. Problem categorization (revenue, retention, operations, cost)
2. Root cause exploration (2-3 targeted questions per category)
3. Data/metric assessment ("What are you currently measuring?")
4. Only THEN suggest automation as part of a solution

---

### TEST-04: Revenue Decline Diagnosis
**Input:** "my sales are dropping"
**Current behavior (failing):** AI either generates a CRM workflow immediately or asks one question and then generates a sales tracking workflow.
**Expected behavior (10/10):**
- Message 1 (AI): Acknowledges the concern. Asks 2-3 diagnostic questions:
  - "When did you first notice the decline - sudden drop or gradual?"
  - "Which sales channels are affected - online, in-store, specific products?"
  - "Are you tracking sales data somewhere currently?"
- Message 2 (User): Answers questions
- Message 3 (AI): Digs deeper based on answers. Asks about:
  - Lead volume vs conversion rate (is the problem top-of-funnel or bottom?)
  - Recent changes (pricing, team, marketing, competition)
  - What tools they use for sales (CRM, spreadsheets, manual)
- Message 4 (User): Provides more context
- Message 5 (AI): NOW proposes a targeted solution. Could be:
  - A lead tracking workflow if the problem is pipeline visibility
  - An alert system if the problem is follow-up gaps
  - A reporting dashboard if the problem is no data
  - Strategic advice if the problem isn't automation-solvable
- TOTAL: 4-5 exchanges minimum before any workflow suggestion
**Phase:** Extended Discovery (complaint-driven)
**Expected confidence:** < 0.40 on messages 1-3, building to 0.60-0.75 on message 5
**Acceptance criteria:**
- [ ] First response has NO `workflowSpec`
- [ ] First response has `intent: "clarifying"` or a diagnostic intent
- [ ] Questions are specific to revenue/sales, not generic
- [ ] AI does not suggest a workflow until at least message 5
- [ ] When workflow IS suggested, it addresses the DIAGNOSED root cause, not a generic sales automation
- [ ] AI remembers all context from earlier messages when suggesting the workflow

### TEST-05: Customer Churn Diagnosis
**Input:** "I'm losing customers"
**Current behavior (failing):** AI suggests a customer feedback survey workflow or a CRM automation immediately.
**Expected behavior (10/10):**
- Message 1 (AI): Empathetic acknowledgment. Diagnostic questions:
  - "Do you know why they're leaving - have any given feedback?"
  - "Is this recent or a long-term trend?"
  - "How are you currently tracking customer retention?"
- Message 2 (User): "They just stop reordering. No feedback. Started about 2 months ago."
- Message 3 (AI): Deeper diagnosis:
  - "Did anything change 2 months ago - pricing, product, service, team?"
  - "Do you have their contact info to reach out?"
  - "What's your current follow-up process when someone stops ordering?"
- Message 4 (User): "We raised prices slightly. Yes we have emails. No follow-up process."
- Message 5 (AI): Root cause identified (price increase + no retention system). Proposes:
  - A re-engagement workflow: detect inactive customers -> send personalized email -> offer incentive -> track response
  - Uses ONLY tools user confirms (asks about email system, CRM, etc.)
**Phase:** Extended Discovery -> Targeted Generation
**Expected confidence:** < 0.35 on messages 1-3, 0.55-0.70 on message 5
**Acceptance criteria:**
- [ ] No workflow generated in first 3 exchanges
- [ ] AI identifies price increase as potential root cause
- [ ] AI asks about existing tools before building workflow
- [ ] Final workflow addresses retention specifically, not generic CRM automation
- [ ] Conversation flows naturally, not like a checklist

### TEST-06: Team Overwhelm Diagnosis
**Input:** "my team is overwhelmed"
**Current behavior (failing):** AI suggests a project management workflow with Asana/Trello immediately.
**Expected behavior (10/10):**
- Message 1 (AI): Empathetic. Diagnostic questions:
  - "What kind of work is overwhelming them - too many tasks, too many tools, too many meetings?"
  - "How big is your team and what do they spend most time on?"
  - "What are they using to manage work currently?"
- Message 2 (User): "5 people, they spend half their day on manual data entry and email"
- Message 3 (AI): Targeted follow-up:
  - "What data are they entering manually - where does it come from and where does it go?"
  - "What email tasks are most repetitive - responses, forwarding, filing?"
  - "How many hours per day would you estimate is spent on these manual tasks?"
- Message 4 (User): Answers
- Message 5 (AI): Proposes automation targeting the SPECIFIC manual tasks identified, not a generic PM tool
**Phase:** Extended Discovery -> Targeted Generation
**Expected confidence:** < 0.35 initially, building to 0.65-0.80 after diagnosis
**Acceptance criteria:**
- [ ] AI does NOT suggest Asana/Trello/project management in first response
- [ ] AI identifies the actual bottleneck (data entry + email) before suggesting solutions
- [ ] Workflow targets the diagnosed problem (automate data entry, not add another tool)
- [ ] AI asks what tools they currently use for data entry before choosing tools

### TEST-07: Slow Response Time Diagnosis
**Input:** "our response time is too slow"
**Current behavior (failing):** AI suggests a Slack notification or ticket routing workflow.
**Expected behavior (10/10):**
- Message 1 (AI): Clarifying questions:
  - "Response time for what - customer support, sales inquiries, internal requests?"
  - "What's the current response time and what's your target?"
  - "Where do these requests come in - email, chat, form, phone?"
- Message 2 (User): "Customer support via email. Currently 24-48 hours, want under 4 hours."
- Message 3 (AI): Deeper:
  - "How many support requests do you get per day?"
  - "Who handles them - dedicated team or everyone?"
  - "What email system are you using for support?"
- Message 4 (User): "About 30/day. Shared Gmail inbox. Everyone chips in."
- Message 5 (AI): Diagnosis complete. Root cause: shared inbox with no routing = requests fall through cracks. Proposes:
  - Auto-categorize incoming emails (AI step)
  - Route to specific team member based on category
  - Auto-respond with acknowledgment
  - Escalation alert if no response in 2 hours
  - Uses Gmail (confirmed) + asks where to route/notify
**Phase:** Extended Discovery -> Targeted Generation
**Expected confidence:** < 0.40 initially, 0.70-0.85 after diagnosis
**Acceptance criteria:**
- [ ] AI identifies shared inbox as root cause
- [ ] Does NOT suggest Zendesk/Freshdesk/Intercom unless user mentions them
- [ ] Workflow uses Gmail (user's confirmed tool) as the base
- [ ] AI step for categorization uses `tool: "ai"` with appropriate complexity
- [ ] Solution addresses the actual gap (routing + accountability + SLA tracking)

### TEST-08: High Support Cost Diagnosis
**Input:** "we're spending too much on customer support"
**Current behavior (failing):** AI suggests a chatbot or FAQ automation immediately.
**Expected behavior (10/10):**
- Message 1 (AI): Diagnostic questions:
  - "What's driving the cost - headcount, tools, outsourcing?"
  - "What are the most common support requests you get?"
  - "How are you handling support now - email, phone, chat, ticketing system?"
- Message 2 (User): "We have 3 people answering the same questions over and over via email"
- Message 3 (AI): Follow-up:
  - "What are the top 5 questions they answer repeatedly?"
  - "Do you have documentation or FAQ anywhere currently?"
  - "Would your customers be okay with automated responses for common questions?"
- Message 4 (User): Answers
- Message 5 (AI): Root cause = repetitive questions handled manually. Proposes:
  - Auto-detect common questions in incoming emails (AI classification)
  - Auto-send templated responses for known questions
  - Only escalate novel questions to humans
  - Weekly report on question categories and deflection rate
**Phase:** Extended Discovery -> Targeted Generation
**Expected confidence:** < 0.35 initially, 0.70-0.80 after diagnosis
**Acceptance criteria:**
- [ ] AI does NOT suggest "add a chatbot" in first response
- [ ] AI identifies repetitive questions as the cost driver
- [ ] Proposed workflow reduces manual work on KNOWN questions, doesn't add new tools unnecessarily
- [ ] Uses email system user confirmed (not assumed ticketing platform)
- [ ] Includes measurement step (deflection rate) so user can track ROI

---

## DIMENSION 3: Phase Enforcement (2/10 -> 10/10)

### Current State Analysis
The prompt defines 3 phases (Discovery, Generation, Refinement) with confidence thresholds. The problem: the AI doesn't actually enforce phase transitions. It often jumps straight to workflow generation regardless of confidence, or generates a card AND asks clarifying questions simultaneously (which @NEXUS-FIX-167 attempts to fix in ChatContainer).

### Gap Identified in Prompt
- No explicit "state machine" behavior - the AI doesn't track which phase it's in
- No rules for transitioning BETWEEN phases
- The confidence thresholds exist but aren't tied to specific conversational behaviors
- "Extended Discovery" for complaints exists but has no structure

---

### TEST-09: Vague Request -> Full Discovery -> Generation Pipeline
**Input:** "help me with client onboarding"
**Current behavior (failing):** AI sometimes generates a workflow immediately with assumed tools (HubSpot + Slack + Gmail) instead of asking what tools the user has.
**Expected behavior (10/10):**
- **Turn 1 (AI - DISCOVERY):**
  - `shouldGenerateWorkflow: false`
  - `intent: "clarifying"`
  - `clarifyingQuestions` with 2-3 questions about: current tools, main pain point, trigger event
  - confidence: 0.35
- **Turn 2 (User):** "I use Pipedrive for CRM, and clients come from website forms"
- **Turn 3 (AI - STILL DISCOVERY):**
  - May ask 1 more clarifying question: "What should happen after onboarding - how do you want to be notified when it's complete?"
  - `shouldGenerateWorkflow: false`
  - confidence: 0.55
- **Turn 4 (User):** "Email me a summary"
- **Turn 5 (AI - GENERATION):**
  - NOW generates workflow with: Webhook (form) -> Pipedrive (create contact) -> Gmail (send welcome) -> Gmail (notify user)
  - `shouldGenerateWorkflow: true`
  - `missingInfo` with 2-3 refinement questions
  - confidence: 0.75
  - ONLY uses tools user mentioned: webhook, pipedrive, gmail
- **Turn 6 (User):** Answers missingInfo questions
- **Turn 7 (AI - REFINEMENT):**
  - Updated workflow with answers applied
  - confidence: 0.90
  - `missingInfo: []`
**Phase transitions:** Discovery (0.35) -> Discovery (0.55) -> Generation (0.75) -> Refinement (0.90)
**Acceptance criteria:**
- [ ] No workflow card appears until Turn 5
- [ ] clarifyingQuestions appear in Turns 1 and 3
- [ ] Turn 5 workflow uses ONLY user-confirmed tools
- [ ] Confidence increases monotonically across turns
- [ ] Turn 7 has higher confidence than Turn 5
- [ ] No assumed tools at any point

### TEST-10: Specific Request -> Skip to Generation
**Input:** "When I get a Gmail from a VIP client, forward it to Slack #sales and log it in my Google Sheet"
**Current behavior (failing):** AI sometimes still asks clarifying questions even though the user specified everything.
**Expected behavior (10/10):**
- **Turn 1 (AI - GENERATION, skip Discovery):**
  - `shouldGenerateWorkflow: true`
  - confidence: 0.88 (user specified all tools and actions)
  - Steps: Gmail (trigger) -> Slack (forward to #sales) -> Google Sheets (log)
  - `missingInfo` may ask: "Which Google Sheet?" or "What info to log?"
  - Message is short: "Here's your workflow:"
  - NO clarifying questions phase - user was specific enough
**Phase transitions:** Straight to Generation (0.88)
**Acceptance criteria:**
- [ ] First response IS the workflow card
- [ ] No unnecessary clarifying questions
- [ ] All 3 tools match what user said (gmail, slack, googlesheets)
- [ ] Slack channel is set to "sales" (user said "#sales")
- [ ] Confidence >= 0.85
- [ ] Message text is 1 sentence max ("Here's your workflow:")

### TEST-11: Complaint -> Extended Discovery -> Diagnosis -> Targeted Workflow
**Input:** "my invoicing process is a nightmare"
**Current behavior (failing):** AI generates an invoicing workflow with Stripe/QuickBooks immediately.
**Expected behavior (10/10):**
- **Turn 1 (AI - EXTENDED DISCOVERY):**
  - `shouldGenerateWorkflow: false`
  - Diagnostic questions about what makes it a nightmare
  - confidence: 0.25
- **Turn 2 (User):** "I manually create invoices in Word, copy-paste client details from email, then email it. Takes forever."
- **Turn 3 (AI - DISCOVERY):**
  - Now understands the problem. Asks about tools:
  - "What do you want to use for invoicing - do you have accounting software?"
  - "Where's your client list - email contacts, a spreadsheet, CRM?"
  - confidence: 0.45
- **Turn 4 (User):** "No accounting software. Client list is in Google Sheets. I just want to email invoices faster."
- **Turn 5 (AI - GENERATION):**
  - Workflow: Google Sheets (get client data) -> AI (generate invoice content) -> Gmail (send invoice)
  - Uses ONLY: googlesheets, ai, gmail (tools user confirmed)
  - `missingInfo` about invoice template, payment terms, etc.
  - confidence: 0.72
**Phase transitions:** Extended Discovery (0.25) -> Discovery (0.45) -> Generation (0.72)
**Acceptance criteria:**
- [ ] No workflow in Turns 1 or 3
- [ ] AI diagnoses the bottleneck (manual copy-paste) before suggesting solution
- [ ] Does NOT add Stripe/QuickBooks/Xero unless user mentions them
- [ ] Final workflow uses Google Sheets + AI + Gmail (user's actual tools)
- [ ] Complaint is treated as a problem to diagnose, not a feature request

### TEST-12: "Just Build It" Override -> Skip to Generation
**Input 1:** "automate my lead follow-up"
**Turn 1 (AI):** Asks clarifying questions (correct - vague request)
**Input 2:** "just use HubSpot and Gmail, don't overthink it"
**Current behavior (failing):** AI asks MORE questions despite user explicitly saying to just build it.
**Expected behavior (10/10):**
- **Turn 2 (AI - GENERATION, forced by user override):**
  - `shouldGenerateWorkflow: true`
  - Builds with HubSpot + Gmail only
  - confidence: 0.70 (user specified tools but not all details)
  - `missingInfo` for remaining details (follow-up timing, email template, etc.)
  - Respects user's desire for speed
**Acceptance criteria:**
- [ ] AI stops asking questions and generates immediately
- [ ] Uses ONLY hubspot + gmail (as user specified)
- [ ] Doesn't add assumed tools
- [ ] missingInfo handles remaining unknowns (doesn't block generation)
- [ ] Message is short, respecting user's "don't overthink" directive

### TEST-13: Mixed - Starts Vague, Gets Specific Mid-Conversation
**Input 1:** "I need to improve my team's productivity"
**Turn 1 (AI):** Discovery questions (correct - very vague)
**Input 2:** "Specifically, I want to auto-assign Asana tasks when someone sends a Gmail with [ACTION] in the subject"
**Current behavior (failing):** AI continues asking generic questions about productivity instead of pivoting to the specific request.
**Expected behavior (10/10):**
- **Turn 2 (AI - GENERATION, pivot to specific):**
  - `shouldGenerateWorkflow: true`
  - Recognizes user shifted from vague to very specific
  - Builds: Gmail (trigger, filter subject "[ACTION]") -> Asana (create task)
  - confidence: 0.85 (user specified both tools and the trigger condition)
  - Abandons the productivity diagnostic and addresses the concrete request
**Acceptance criteria:**
- [ ] AI pivots from Discovery to Generation in the same turn
- [ ] Does NOT continue asking about "team productivity" generically
- [ ] Workflow matches the specific request exactly
- [ ] Gmail trigger has subject filter for "[ACTION]"
- [ ] Only gmail + asana in the workflow
- [ ] Confidence is high because user was very specific

---

## DIMENSION 4: Conversation Depth (3/10 -> 10/10)

### Current State Analysis
The prompt has `CONVERSATION MEMORY` section but it's just 4 lines saying "remember things." There's no structured memory system, no rules about what to track, and no validation that memory persists across many turns.

### Gap Identified in Prompt
- No memory structure (the AI relies on raw conversation history, which is fine for Claude, but needs explicit instructions to USE that memory proactively)
- No rules about maintaining context when user switches topics
- No rules about referencing earlier context naturally

---

### TEST-14: Deep Diagnostic Conversation (15 messages)
**Scenario:** User has a complex operations problem requiring extended diagnosis.

**Turn 1 (User):** "Hi, I'm Sarah. I run a small e-commerce store selling handmade jewelry."
**Turn 2 (AI):** Warm greeting, stores: name=Sarah, industry=ecommerce, product=handmade jewelry
**Turn 3 (User):** "I'm getting about 50 orders a day but my fulfillment is a mess"
**Turn 4 (AI):** Diagnostic questions about fulfillment process. Stores: order volume=50/day, problem=fulfillment
**Turn 5 (User):** "Orders come in through Shopify, I manually check inventory in a Google Sheet, then create shipping labels"
**Turn 6 (AI):** Follow-up questions. Stores: tools=Shopify+Sheets, process=manual inventory check+manual labels
**Turn 7 (User):** "Shipping is via Aramex since I'm in Kuwait"
**Turn 8 (AI):** Acknowledges Kuwait context. Stores: location=Kuwait, shipping=Aramex
**Turn 9 (User):** "Sometimes I oversell because the sheet isn't updated fast enough"
**Turn 10 (AI):** Identifies root cause. Stores: root_cause=inventory sync lag
**Turn 11 (User):** "Also my WhatsApp is blowing up with order status questions"
**Turn 12 (AI):** Second pain point identified. Stores: pain_2=manual order status on WhatsApp
**Turn 13 (User):** "What do you think I should automate first?"
**Turn 14 (AI):** Strategic recommendation referencing ALL context:
  - "Sarah, with 50 orders/day and the overselling problem, I'd prioritize inventory sync first..."
  - References: her name, volume, Shopify, Sheets, Kuwait, Aramex, WhatsApp, overselling
  - Suggests 2 workflows in priority order
**Turn 15 (User):** "what's my name and what did I tell you about my business?"

**Expected Turn 15 response:**
"You're Sarah. You run an e-commerce store selling handmade jewelry in Kuwait. You get about 50 orders a day through Shopify, track inventory in Google Sheets, ship via Aramex, and you're struggling with overselling due to slow inventory updates. Your customers are also messaging you on WhatsApp for order status updates."

**Acceptance criteria:**
- [ ] AI remembers name at Turn 15
- [ ] AI remembers industry (e-commerce, handmade jewelry) at Turn 15
- [ ] AI remembers location (Kuwait) at Turn 15
- [ ] AI remembers all tools mentioned (Shopify, Google Sheets, Aramex, WhatsApp)
- [ ] AI remembers both pain points (overselling + WhatsApp overload)
- [ ] AI remembers order volume (50/day)
- [ ] Turn 14 recommendation references at least 5 pieces of prior context
- [ ] Tone remains warm and personalized throughout (not robotic)
- [ ] When workflow is finally generated, it uses ONLY tools Sarah mentioned

### TEST-15: Iterative Workflow Refinement (12 messages)
**Scenario:** User builds a workflow, then iterates on it across many turns.

**Turn 1 (User):** "When I get a new Shopify order, notify me on Slack"
**Turn 2 (AI):** Generates workflow: Shopify -> Slack. confidence: 0.82
**Turn 3 (User):** "Actually, also log it in my Google Sheet"
**Turn 4 (AI):** REFINES workflow: Shopify -> Slack + Google Sheets. Should include `refiningWorkflowId`. confidence: 0.85
**Turn 5 (User):** "Change the Slack channel to #orders instead of #general"
**Turn 6 (AI):** REFINES: Updates Slack channel config. Should include `refiningWorkflowId`. confidence: 0.88
**Turn 7 (User):** "Add a step to check if inventory is low and alert me separately"
**Turn 8 (AI):** REFINES: Adds AI check step + conditional alert. confidence: 0.83 (new complexity)
**Turn 9 (User):** "Remove the Slack notification, I'll just use WhatsApp"
**Turn 10 (AI):** REFINES: Replaces Slack with WhatsApp. confidence: 0.85
**Turn 11 (User):** "Can you show me what we have so far?"
**Turn 12 (AI):** Shows current workflow state: Shopify -> Google Sheets + AI (inventory check) -> WhatsApp

**Expected final workflow:**
- Step 1: Shopify (trigger - new order)
- Step 2: Google Sheets (log order)
- Step 3: AI (check inventory level)
- Step 4: WhatsApp (notify if low inventory)
- NO Slack (was removed in Turn 9)

**Acceptance criteria:**
- [ ] Each refinement uses `refiningWorkflowId` to update, not create new card
- [ ] Slack is correctly REMOVED after Turn 9 (not just hidden)
- [ ] WhatsApp replaces Slack (using `tool: "whatsapp"`, personal)
- [ ] Google Sheet step persists from Turn 3 through all subsequent turns
- [ ] AI step for inventory check is added and persists
- [ ] Turn 12 accurately describes the current state of the workflow
- [ ] No "ghost" steps from earlier iterations remain
- [ ] Confidence fluctuates appropriately (drops when new complexity added, rises when refined)

### TEST-16: Multi-Topic with Context Switch
**Scenario:** User discusses one topic, switches to another, then refers back to the first.

**Turn 1 (User):** "I need to automate my email marketing. We use Mailchimp."
**Turn 2 (AI):** Discovery questions about email marketing goals. Stores: topic_1=email marketing, tool=Mailchimp
**Turn 3 (User):** "Hold on, different question - what's the best way to track expenses?"
**Turn 4 (AI):** Correctly switches context. Asks about expense tracking tools and process. Does NOT generate email marketing workflow.
**Turn 5 (User):** "We use QuickBooks for accounting"
**Turn 6 (AI):** Stores QuickBooks. Asks about expense sources.
**Turn 7 (User):** "Ok go back to the email thing - I want to send a welcome series when someone joins my Mailchimp list"
**Turn 8 (AI):** Returns to email marketing context. Remembers Mailchimp. Generates workflow:
  - Mailchimp (new subscriber trigger) -> Gmail or Mailchimp (send welcome series)
  - Does NOT confuse with expense tracking context
  - Remembers this was about email marketing from Turn 1

**Acceptance criteria:**
- [ ] AI handles topic switch gracefully (Turn 3-4)
- [ ] AI doesn't generate email marketing workflow during expense tracking discussion
- [ ] AI correctly returns to email marketing context in Turn 7-8
- [ ] AI remembers Mailchimp from Turn 1 when returning to topic
- [ ] QuickBooks doesn't leak into the email marketing workflow
- [ ] Both topics remain addressable throughout the conversation

---

## DIMENSION 5: Confidence System (NEW)

### Current State Analysis
The prompt defines confidence thresholds (< 0.60, 0.60-0.84, >= 0.85) but the enforcement is weak. The AI sometimes returns confidence: 0.95 for vague requests, or generates workflows with confidence: 0.45 (which should trigger questions instead).

### Gap Identified in Prompt
- No explicit rules saying "if you return confidence >= X, you MUST also do Y"
- No enforcement that confidence < 0.60 BLOCKS workflow generation
- No rules about confidence INCREASING across conversation turns

---

### TEST-17: Vague Request Must Have Low Confidence
**Input:** "automate my business"
**Expected behavior:**
- confidence: 0.20-0.35 (extremely vague)
- `shouldGenerateWorkflow: false`
- `intent: "clarifying"`
- `clarifyingQuestions` present
- NO workflow card displayed
**Acceptance criteria:**
- [ ] confidence < 0.40
- [ ] No `workflowSpec` in response
- [ ] clarifyingQuestions has 2-3 items
- [ ] UI shows questions, not a workflow card

### TEST-18: Specific Request Must Have High Confidence
**Input:** "When I receive a Gmail from john@acme.com, forward it to Slack #vip-clients"
**Expected behavior:**
- confidence: 0.90-0.95 (user specified everything: trigger, filter, destination, channel)
- `shouldGenerateWorkflow: true`
- Workflow card displayed with green "ready to execute" indicator
- Minimal or no `missingInfo`
**Acceptance criteria:**
- [ ] confidence >= 0.88
- [ ] Workflow card appears immediately
- [ ] Execute button is ENABLED (not grayed out)
- [ ] missingInfo has 0-1 items max (maybe schedule preference)

### TEST-19: Confidence Must Increase After Answering Questions
**Turn 1 (User):** "I need to manage my leads better"
**Turn 1 (AI):** confidence: 0.30, clarifying questions
**Turn 2 (User):** Answers - "I use HubSpot, leads come from website forms"
**Turn 2 (AI):** confidence: 0.55-0.65, maybe more questions or initial workflow
**Turn 3 (User):** Answers remaining questions
**Turn 3 (AI):** confidence: 0.80-0.90, refined workflow
**Expected behavior:**
- confidence ALWAYS increases after user provides information
- confidence NEVER decreases unless user introduces new uncertainty
**Acceptance criteria:**
- [ ] Turn 1 confidence < 0.40
- [ ] Turn 2 confidence > Turn 1 confidence
- [ ] Turn 3 confidence > Turn 2 confidence
- [ ] Final confidence >= 0.80

### TEST-20: Complaint Must Have Very Low Confidence
**Input:** "my customers keep complaining about late deliveries"
**Expected behavior:**
- confidence: 0.20-0.35 (this is a problem report, not a workflow request)
- `shouldGenerateWorkflow: false`
- `intent: "clarifying"` (diagnostic mode)
- Asks diagnostic questions about the delivery process
- Does NOT suggest a workflow
**Acceptance criteria:**
- [ ] confidence < 0.40 (per @NEXUS-FIX-165)
- [ ] No workflowSpec
- [ ] Questions are diagnostic ("What's causing the delays?") not tool-oriented
- [ ] AI acts as consultant, not automation builder

### TEST-21: Confidence-Execute Button Mapping
**Scenario:** Verify UI correctly maps confidence to execute button state.
**Test matrix:**

| Confidence | Execute Button | Card Color | Behavior |
|-----------|---------------|------------|----------|
| 0.92 | Enabled (green) | Green border | Click to execute |
| 0.75 | Enabled (yellow) | Yellow border | Click to execute, missingInfo shown |
| 0.55 | Disabled (gray) | Orange border | Must answer questions first |
| 0.30 | No card shown | N/A | Only questions displayed |

**Acceptance criteria:**
- [ ] 0.92 confidence -> execute button is clickable
- [ ] 0.75 confidence -> execute button exists but missingInfo questions visible
- [ ] 0.55 confidence -> if card appears, execute is disabled until questions answered
- [ ] 0.30 confidence -> no workflow card at all, only clarifying questions

---

## DIMENSION 6: Strategic Consulting (2/10, handled by AI Consultancy)

### Current State Analysis
The CEO says strategic consulting is handled by the AI Consultancy feature. However, users may ask strategic questions in the MAIN chat. The current behavior is to either generate an irrelevant workflow or give a thin one-sentence answer.

---

### TEST-22: Strategic Question in Main Chat - Investment Decision
**Input:** "should I invest more in email marketing or social media?"
**Current behavior (failing):** AI either generates a workflow for email marketing, or asks which one to automate, missing the strategic nature of the question entirely.
**Expected behavior (10/10):**
- Recognizes this as a STRATEGIC question, not a workflow request
- `shouldGenerateWorkflow: false`
- `intent: "question"` or `"consulting"`
- Provides thoughtful strategic analysis:
  - Asks about current results from each channel
  - Asks about their audience and industry
  - Mentions that the AI Consultancy room has deeper analysis if they want a full strategic session
- Does NOT generate a workflow
- confidence: < 0.30 (this isn't an automation request)
**Acceptance criteria:**
- [ ] No workflowSpec generated
- [ ] Response provides actual strategic value, not just "it depends"
- [ ] AI asks diagnostic questions about their current marketing performance
- [ ] Mentions AI Consultancy for deeper analysis
- [ ] Does NOT try to automate something they didn't ask to automate

### TEST-23: Strategic Question - Scaling Support
**Input:** "what's the best way to scale my customer support?"
**Current behavior (failing):** AI generates a Zendesk/Intercom workflow immediately.
**Expected behavior (10/10):**
- Recognizes strategic question
- `shouldGenerateWorkflow: false`
- Asks: "What's your current support volume and how are you handling it today?"
- Explores: team size, current tools, ticket types, SLAs
- THEN offers to build automation based on their answers
- Transitions to workflow ONLY after understanding the situation
**Acceptance criteria:**
- [ ] First response has no workflow
- [ ] AI asks about current state before suggesting solutions
- [ ] Response treats this as a consulting question, not "which tool should I wire up"
- [ ] Eventually transitions to actionable automation once context is gathered

---

## CROSS-CUTTING: Arabic Language Tests

### TEST-24: Arabic Complaint Diagnosis
**Input:** "مبيعاتي تنخفض وما أدري ليش" (My sales are declining and I don't know why)
**Expected behavior:**
- Responds in Gulf Arabic dialect
- Asks diagnostic questions in Arabic
- confidence < 0.40 (complaint pattern detected per @NEXUS-FIX-165)
- `shouldGenerateWorkflow: false`
- Diagnostic questions are culturally appropriate
**Acceptance criteria:**
- [ ] Response is in Gulf Arabic, not MSA (e.g., uses "شلون" not "كيف")
- [ ] Complaint pattern detected (Arabic patterns: "تنخفض", "انخفاض")
- [ ] No workflow generated
- [ ] Questions are diagnostic, not tool-oriented
- [ ] English tech terms used naturally where appropriate

### TEST-25: Arabic Specific Workflow Request
**Input:** "أبي workflow يرسل رسالة WhatsApp لكل عميل يدي بGmail" (I want a workflow that sends a WhatsApp message to every client that emails me on Gmail)
**Expected behavior:**
- Responds in mixed Arabic/English (matching user's code-switching style)
- `shouldGenerateWorkflow: true` (specific request with named tools)
- Workflow: Gmail (trigger) -> WhatsApp (action)
- Uses `tool: "whatsapp"` (personal, default)
- confidence: 0.78 (user specified both tools)
- workflowSpec fields are in English (system requirement)
- Message field is in Arabic
**Acceptance criteria:**
- [ ] Response message is in Arabic/English mix
- [ ] workflowSpec.name and step names are in English
- [ ] Gmail + WhatsApp correctly wired
- [ ] WhatsApp uses personal (`tool: "whatsapp"`, `executorHint: "native-whatsapp"`)
- [ ] confidence >= 0.70
- [ ] missingInfo questions are in Arabic

---

## SUMMARY: Test Coverage Matrix

| Dimension | Tests | Key Metric | Current | Target |
|-----------|-------|------------|---------|--------|
| Tool Wiring | TEST-01, 02, 03 | Zero assumed tools | 8/10 | 10/10 |
| Business Diagnosis | TEST-04, 05, 06, 07, 08 | 4+ exchanges before workflow | 2/10 | 10/10 |
| Phase Enforcement | TEST-09, 10, 11, 12, 13 | Correct phase transitions | 2/10 | 10/10 |
| Conversation Depth | TEST-14, 15, 16 | Memory at msg 15 | 3/10 | 10/10 |
| Confidence System | TEST-17, 18, 19, 20, 21 | Confidence <-> behavior mapping | NEW | 10/10 |
| Strategic Consulting | TEST-22, 23 | Consult first, automate later | 2/10 | 10/10 |
| Arabic Support | TEST-24, 25 | Dialect + wiring accuracy | N/A | 10/10 |

**Total: 25 test scenarios across 7 dimensions**

---

## PROMPT GAP ANALYSIS

Based on reading `server/agents/index.ts`, these are the gaps between current prompt instructions and 10/10 behavior:

### Gap 1: Business Diagnosis Framework (CRITICAL)
**Current:** 3 example questions in @NEXUS-FIX-165 ("What changed?", "When did this start?", "What metrics?")
**Needed:** A structured diagnostic framework per problem category:
- Revenue decline -> ask about channels, conversion, pricing, competition
- Customer churn -> ask about feedback, recent changes, follow-up process
- Team overwhelm -> ask about task types, time allocation, current tools
- Slow response -> ask about volume, channels, routing, SLAs
- High costs -> ask about cost drivers, repetitive work, automation potential

### Gap 2: Phase State Machine (CRITICAL)
**Current:** 3 phases defined with confidence ranges, but no explicit transition rules
**Needed:** Explicit rules like:
- "You MUST NOT generate workflowSpec if confidence < 0.60 - this is a HARD BLOCK, not a suggestion"
- "After user answers clarifying questions, re-evaluate confidence and transition"
- "If user says 'just build it' or gives explicit override, jump to Generation"
- "Complaints ALWAYS start in Extended Discovery (confidence < 0.40)"

### Gap 3: Memory Instructions (MODERATE)
**Current:** "ALWAYS remember and reference the user's details"
**Needed:** Explicit tracking list:
- User name, role, industry, location
- Tools they've mentioned
- Pain points they've described
- Preferences stated
- Context from all previous messages
- "When asked 'what do you know about me?', list ALL stored context"

### Gap 4: Confidence Enforcement (CRITICAL)
**Current:** Thresholds defined but not enforced with hard rules
**Needed:**
- "confidence < 0.40 = MUST NOT include workflowSpec"
- "confidence 0.40-0.59 = MUST ask clarifying questions, MAY include tentative workflowSpec"
- "confidence >= 0.60 = MAY include workflowSpec with missingInfo"
- "confidence >= 0.85 = workflowSpec should be execution-ready"
- "confidence MUST increase when user provides information"
- "Complaint/problem inputs cap confidence at 0.40 until diagnosis complete"

### Gap 5: Strategic Question Detection (MODERATE)
**Current:** @NEXUS-FIX-165 mentions "how do I", "what should I", "should I" but doesn't define what to DO with strategic questions beyond "ask diagnostic questions"
**Needed:**
- "Strategic questions get consulting-grade responses, not workflow cards"
- "Refer to AI Consultancy for deep strategic sessions"
- "Provide initial strategic analysis with 2-3 follow-up questions"
- "Only transition to workflow when user asks for automation, not strategy"
