---
name: mcp-ecosystem-monitor
description: Weekly automated monitoring of MCP ecosystem for new providers, updates, and better alternatives
schedule: weekly
---

# MCP Ecosystem Monitor Workflow

**Goal:** Automatically monitor the MCP ecosystem for new providers, major updates, and better alternatives to current integrations. Runs weekly to ensure Nexus stays competitive.

**Your Role:** You are a Technology Radar analyst specializing in MCP (Model Context Protocol) ecosystem monitoring. You research, evaluate, and recommend MCP provider changes to keep Nexus at the cutting edge.

---

## WORKFLOW ARCHITECTURE

This workflow uses **automated research + evaluation + reporting**:

- Step 01: Web research for MCP ecosystem updates
- Step 02: Evaluate new providers against current stack
- Step 03: Generate recommendations report
- Step 04: Update tech radar and notify stakeholders

---

## INITIALIZATION

### Configuration

```yaml
project_name: Nexus
monitoring_scope:
  - MCP protocol updates
  - New MCP providers
  - Existing provider updates (Rube, Composio, Google, Zapier)
  - Cost changes
  - API coverage expansions
  - Security advisories

current_providers:
  - name: Rube
    endpoint: https://rube.app/mcp
    apps: OAuth web access
  - name: Composio
    endpoint: https://mcp.composio.dev
    apps: 500+
  - name: Google Cloud MCP
    endpoint: https://mcp.googleapis.com
    apps: Google services (Maps, BigQuery, Compute, K8s)
  - name: Zapier MCP
    endpoint: https://mcp.zapier.com
    apps: 8,000+

evaluation_criteria:
  - app_coverage: Weight 30%
  - reliability: Weight 25%
  - cost_efficiency: Weight 20%
  - ease_of_integration: Weight 15%
  - security: Weight 10%
```

---

## STEP 01: RESEARCH

### Web Search Queries

Execute the following searches to gather ecosystem intelligence:

1. **Protocol Updates**
   - "Model Context Protocol MCP updates {current_year}"
   - "MCP specification changes Anthropic"
   - "MCP server security advisories"

2. **New Providers**
   - "new MCP server providers {current_year}"
   - "MCP integration platforms launched"
   - "alternative to Composio MCP"
   - "alternative to Zapier MCP"

3. **Existing Provider Updates**
   - "Zapier MCP new features"
   - "Google Cloud MCP expansion"
   - "Composio MCP updates"
   - "Rube MCP changelog"

4. **Industry Analysis**
   - "MCP adoption enterprise"
   - "best MCP servers comparison {current_year}"
   - "MCP vs direct API integration"

### Data Collection

For each discovery, capture:
- Provider name
- Announcement date
- Key capabilities
- App/action count
- Pricing model
- Integration complexity
- Source URL

---

## STEP 02: EVALUATION

### Scoring Matrix

For each new or updated provider, score against criteria:

| Criteria | Weight | Score (1-10) | Weighted |
|----------|--------|--------------|----------|
| App Coverage | 30% | ? | ? |
| Reliability | 25% | ? | ? |
| Cost Efficiency | 20% | ? | ? |
| Ease of Integration | 15% | ? | ? |
| Security | 10% | ? | ? |
| **TOTAL** | 100% | - | **?** |

### Comparison Logic

```
IF new_provider.score > current_best.score + 15%:
  recommendation = "STRONGLY CONSIDER migration"
ELIF new_provider.score > current_best.score + 5%:
  recommendation = "EVALUATE for future sprint"
ELIF new_provider.score > current_best.score:
  recommendation = "MONITOR development"
ELSE:
  recommendation = "NO ACTION needed"
```

### Risk Assessment

For any recommended changes, assess:
- Migration complexity (Low/Medium/High)
- Breaking changes risk
- User impact
- Rollback capability
- Timeline estimate

---

## STEP 03: GENERATE REPORT

### Report Template

```markdown
# MCP Ecosystem Monitor Report
**Generated:** {date}
**Period:** {last_week} to {current_date}

## Executive Summary
{2-3 sentence overview of findings}

## Current Stack Health
| Provider | Status | Issues | Score |
|----------|--------|--------|-------|
| Rube | ✅/⚠️/❌ | {issues} | {score}/100 |
| Composio | ✅/⚠️/❌ | {issues} | {score}/100 |
| Google Cloud MCP | ✅/⚠️/❌ | {issues} | {score}/100 |
| Zapier MCP | ✅/⚠️/❌ | {issues} | {score}/100 |

## New Discoveries
{list of new providers/features discovered}

## Recommendations
1. **{recommendation_1}** - {priority}
   - Impact: {description}
   - Effort: {estimate}

2. **{recommendation_2}** - {priority}
   ...

## Action Items
- [ ] {action_1}
- [ ] {action_2}

## Sources
- {source_urls}
```

### Output Location

Save report to: `_bmad-output/tech-radar/mcp-monitor-{date}.md`

---

## STEP 04: NOTIFICATIONS

### Stakeholder Alerts

If HIGH priority recommendations exist:
1. Create GitHub issue in Nexus repo
2. Send summary to configured notification channel
3. Add to next sprint planning consideration

### Tech Radar Update

Update `_bmad-output/tech-radar/current-status.yaml`:
```yaml
mcp_providers:
  last_reviewed: {date}
  current_best: {provider_name}
  pending_evaluation: [{providers}]
  next_review: {date + 7 days}
```

---

## AUTOMATION HOOKS

### Schedule Trigger

```yaml
schedule:
  cron: "0 9 * * 1"  # Every Monday at 9 AM
  timezone: UTC

on_trigger:
  - run: mcp-ecosystem-monitor
  - notify: tech-lead
```

### Manual Trigger

Can be invoked manually with:
```
/bmad:bmm:workflows:mcp-ecosystem-monitor
```

---

## WORKFLOW STATES

```yaml
---
stepsCompleted: []
workflowType: 'mcp-ecosystem-monitor'
lastRun: null
discoveries: []
recommendations: []
---
```

---

## EXIT CONDITIONS

- Complete when report is generated and saved
- Auto-complete after notifications sent
- Can be cancelled mid-run if needed

---

## INTEGRATION NOTES

This workflow integrates with:
- **Web Search** for research
- **GitHub** for issue creation
- **Slack/Email** for notifications (if configured)
- **Tech Radar** documentation system
