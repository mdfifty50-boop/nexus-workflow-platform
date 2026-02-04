# Workflow Template Implementation Priorities

## Quick Reference Guide for Development Team

---

## TOP 10 HIGHEST ROI TEMPLATES (Build First)

| Rank | Template ID | Name | Domain | Annual Value | Composio Ready |
|------|-------------|------|--------|--------------|----------------|
| 1 | WF-HOSP-001 | Daily ED Briefing Report | Hospital | $130,000 | 50% (needs EHR) |
| 2 | WF-LAW-002 | After-Hours Lead Response | Lawyers | $78,000 | 100% |
| 3 | WF-CLINIC-002 | Insurance Pre-Authorization | Clinic | $78,000 | 35% (needs insurance API) |
| 4 | WF-LAW-004 | Automatic Time Entry | Lawyers | $78,000 | 85% (needs Clio) |
| 5 | WF-LAW-001 | Signature Chase | Lawyers | $27,450 | 100% EXISTS |
| 6 | WF-CLINIC-001 | Appointment Reminders | Clinic | $53,040 | 100% EXISTS |
| 7 | WF-SME-001 | Invoice Payment Chase | SME | $19,968 | 92% |
| 8 | WF-SME-002 | Instant Lead Response | SME | $33,280 | 100% EXISTS |
| 9 | WF-LAW-005 | Client Billing Reminder | Lawyers | $31,200 | 92% |
| 10 | WF-CLINIC-003 | Lab Result Escalation | Clinic | Safety Critical | 40% (needs lab API) |

---

## SPRINT 1: Quick Wins (100% Composio Ready)

### Week 1: Lawyer Templates
```
WF-LAW-002: After-Hours Lead Response     [NEW]
├── Trigger: WhatsApp message after hours
├── Integrations: WhatsApp, HubSpot, Calendar, Gmail
└── Est. Dev Time: 8 hours

WF-LAW-006: Case Status Update            [NEW]
├── Trigger: Case milestone OR weekly schedule
├── Integrations: Notion, Gmail, WhatsApp
└── Est. Dev Time: 6 hours

WF-LAW-010: Email to Task Converter       [NEW]
├── Trigger: Email with action keywords
├── Integrations: Gmail, Asana/Notion, WhatsApp
└── Est. Dev Time: 6 hours
```

### Week 2: SME Templates
```
WF-SME-009: Daily Sales Report            [NEW]
├── Trigger: Daily at 9 PM
├── Integrations: Shopify/Stripe, Gmail, WhatsApp
└── Est. Dev Time: 4 hours

WF-SME-010: Customer Birthday Messages    [NEW]
├── Trigger: Birthday match in CRM
├── Integrations: HubSpot, WhatsApp, Gmail
└── Est. Dev Time: 3 hours

WF-SME-013: Meeting Scheduler with Prep   [NEW]
├── Trigger: New meeting booked
├── Integrations: Calendly, Calendar, Gmail, WhatsApp
└── Est. Dev Time: 4 hours
```

### Week 3: Clinic Templates
```
WF-CLINIC-005: Patient Follow-Up Chain    [NEW]
├── Trigger: X days post-visit
├── Integrations: WhatsApp, Gmail, Calendar
└── Est. Dev Time: 5 hours

WF-CLINIC-006: Patient Intake Form        [NEW]
├── Trigger: Appointment scheduled
├── Integrations: Typeform, WhatsApp, Notion
└── Est. Dev Time: 4 hours

WF-CLINIC-008: Waitlist Management        [NEW]
├── Trigger: Cancellation received
├── Integrations: Calendar, WhatsApp, Gmail
└── Est. Dev Time: 5 hours
```

---

## SPRINT 2: Enhance Existing Templates

### Existing Template Updates
```
signature_chase_workflow.json
├── ADD: Arabic message templates
├── ADD: KNET payment link generation (when ready)
├── ADD: Custom escalation intervals
└── Est. Dev Time: 3 hours

court_deadline_workflow.json
├── ADD: Kuwait court types (Civil, Criminal, Commercial)
├── ADD: Arabic notifications
├── ADD: Holiday awareness (Kuwait calendar)
└── Est. Dev Time: 2 hours

appointment_reminder_workflow.json
├── ADD: Arabic message templates
├── ADD: Waitlist backfill logic
├── ADD: No-show tracking
└── Est. Dev Time: 3 hours
```

---

## SPRINT 3: High-Value Custom Integrations

### Integration Development Priority

#### 1. KNET Payment Gateway (Kuwait Essential)
```
Business Value: Unlocks payment workflows for ALL Kuwait customers
Complexity: Medium (well-documented API)
Timeline: 2-3 weeks

Templates Enabled:
- WF-SME-001: Invoice Payment Chase
- WF-LAW-005: Client Billing Reminder
- All payment-related workflows
```

#### 2. ZATCA E-Invoicing (Saudi Essential)
```
Business Value: Mandatory for Saudi market entry
Complexity: Medium (government API)
Timeline: 3-4 weeks

Templates Enabled:
- WF-SME-003: ZATCA E-Invoice Generator
- All Saudi invoice workflows
```

#### 3. Clio Integration (Legal Billing)
```
Business Value: Law firm time/billing automation
Complexity: Low-Medium (OAuth + REST)
Timeline: 2 weeks

Templates Enabled:
- WF-LAW-004: Automatic Time Entry
- WF-LAW-015: Weekly KPI Dashboard
```

---

## SPRINT 4: Healthcare Integrations

### Insurance Portal Integration
```
Priority Insurers (GCC):
1. BUPA Arabia - Largest in Saudi
2. GIG Gulf - Multi-country
3. Allianz - International coverage

Approach: Build middleware that normalizes different portal APIs

Templates Enabled:
- WF-CLINIC-002: Insurance Pre-Authorization
```

### Lab System Integration
```
Priority Labs:
1. Al Borg Labs - Largest in GCC
2. Gulf Labs - Kuwait dominant

Approach: FHIR-based for standardization

Templates Enabled:
- WF-CLINIC-003: Lab Result Escalation
- WF-HOSP-007: Lab Result Routing
```

---

## BLOCKED TEMPLATES (Require Custom Integration)

| Template | Blocking Integration | Unblock Strategy |
|----------|---------------------|------------------|
| WF-HOSP-001 | EHR (Epic/Cerner) | Partner with certified integrator |
| WF-HOSP-003 | EHR | Same as above |
| WF-HOSP-006 | Bed Management | Hospital-specific integration |
| WF-CLINIC-002 | Insurance APIs | Build middleware |
| WF-CLINIC-003 | Lab Systems | FHIR integration |
| WF-CLINIC-009 | MOH Portal | Government API access |
| WF-SME-003 | ZATCA | Build custom integration |

---

## METRICS TO TRACK

### Template Adoption
- Templates created
- Templates with >5 active users
- Template completion rate (started vs finished)

### User Value
- Estimated hours saved per week (from template config)
- User-reported time savings
- Workflow success rate

### Integration Coverage
- % of templates fully Composio-ready
- Custom integration usage
- Failed execution by integration

---

## DEVELOPMENT GUIDELINES

### Template Structure (JSON)
```json
{
  "id": "wf-domain-nnn",
  "name": "Human Readable Name",
  "description": "What problem this solves",
  "domain": "lawyers|sme|clinic|hospital",
  "roiTier": 1|2|3,
  "annualValue": "$X,XXX - $XX,XXX",

  "requiredIntegrations": ["integration1", "integration2"],
  "optionalIntegrations": ["integration3"],

  "dynamicParameters": {
    "param_name": {
      "type": "string|number|boolean|array|select",
      "default": "default_value",
      "options": ["if", "select", "type"],
      "required": true|false,
      "description": "User-facing description"
    }
  },

  "executionPlan": {
    "tasks": [
      {
        "id": "task_1",
        "name": "Step Name",
        "type": "trigger|action|condition",
        "integrationId": "integration_name",
        "dependencies": [],
        "config": {
          "toolSlug": "INTEGRATION_ACTION",
          "params": {}
        }
      }
    ]
  },

  "keywords": ["search", "keywords", "for", "matching"],
  "exampleUserInput": "Natural language that should trigger this template"
}
```

### Localization Requirements
- All user-facing messages: English + Arabic
- Date/time: Respect timezone (default: Asia/Kuwait)
- Currency: KWD for Kuwait, SAR for Saudi
- Work week: Sunday-Thursday (GCC default)

### Testing Checklist
- [ ] Template loads in workflow builder
- [ ] All integrations connect successfully
- [ ] Dynamic parameters render correctly
- [ ] Arabic messages display properly
- [ ] Timezone calculations correct
- [ ] Execution completes end-to-end

---

## NEXT STEPS

1. **Immediate**: Implement Sprint 1 templates (all 100% Composio ready)
2. **Week 2**: Enhance existing templates with Arabic + regional config
3. **Month 1**: Begin KNET integration development
4. **Month 2**: ZATCA integration for Saudi expansion
5. **Month 3**: Insurance portal middleware

---

**Document Owner:** Engineering Team
**Last Updated:** 2026-02-03
**Review Frequency:** Weekly during active development
