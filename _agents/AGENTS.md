# Agent Registry

This file tracks all researched and configured agents available for this project.

## BMAD Integration

**Hired agents are FULLY INTEGRATED with BMAD Party Mode.**

When Party Mode starts:
1. Standard BMAD agents load from `_bmad/_config/agent-manifest.csv`
2. Hired agents ALSO load from this registry
3. ALL agents (standard + hired) participate in discussions
4. Hired agents bring their researched expertise, guardrails, and decision frameworks

**Persistence Guarantee:**
- Agents persist in files (not memory)
- Survive PC restarts
- Survive Claude context resets
- Survive session changes
- Available in EVERY Party Mode session

## How This System Works

When an agent is "hired", we:
1. **Research** - Search LinkedIn, job postings, official docs, case studies
2. **Synthesize** - Extract skills, principles, frameworks, guardrails
3. **Configure** - Create a detailed `.md` file with the agent's expertise
4. **Register** - Add to this file AND to `_bmad/_config/agent-manifest.csv`
5. **Persist** - Agent is now available in ALL future sessions

## Invoking an Agent

**In Party Mode:** Hired agents automatically participate alongside standard BMAD agents.

**Direct invocation:**
```
"Get the [Agent Name] to work on [task]"
```

Claude will:
1. Read the agent's config file from `_agents/[agent-slug].md`
2. Inject the full configuration into the task prompt
3. The agent now operates with researched expertise

---

## Hired Agents

| Name | Agent | Role | Config File | Hired Date | Research Sources |
|------|-------|------|-------------|------------|------------------|
| Zara | OpenAI UI Engineer | UI/UX Design for AI Products | `openai-ui-engineer.md` | 2026-01-12 | 15+ sources |
| Ava | OpenAI HR Talent Strategist | Talent Strategy, Gap Analysis, Hiring Decisions | `openai-hr-talent-strategist.md` | 2026-01-12 | 25+ sources |
| Marcus | Zapier General Manager | Critical Thinker, Competitive Strategy, Enterprise Workflows | `zapier-gm.md` | 2026-01-12 | 20+ sources |
| Ralph Wiggum | QA Validation Specialist | 100% Task Validation, Build/Runtime/Browser Testing | `ralph-wiggum.md` | 2026-01-13 | QA best practices |

---

## Agent Details

### 1. Zara (OpenAI UI Engineer)
- **Name:** Zara
- **File:** `_agents/openai-ui-engineer.md`
- **Expertise:** ChatGPT interface design, AI-first UX, conversational UI
- **Research Sources:**
  - OpenAI official UI Guidelines
  - OpenAI official UX Principles
  - LinkedIn profiles: Shannon Jager (Design Director), Jakub Zegzulka, Zoe Zhang
  - OpenAI job postings: Product Designer ChatGPT, Platform & Tools, Design Director
- **Capture Rate:** ~25-30% of real expertise (public knowledge + official guidelines)
- **Best For:** Mobile UI, conversational interfaces, AI product design, design system decisions

### 2. Ava (OpenAI HR Talent Strategist)
- **Name:** Ava
- **File:** `_agents/openai-hr-talent-strategist.md`
- **Expertise:** Talent evaluation, team composition, role gap analysis, hiring decisions
- **Research Sources:**
  - OpenAI Recruiting Leadership: Jared Long, Veronica Gnaman, Lesley Griffin, Bobby Morgan
  - Sam Altman's hiring philosophy (Values > Aptitude > Skills)
  - OpenAI Interview Guide and job postings
  - AI industry talent landscape 2025-2026
  - Team structure research: 6-person pods, flat organization
  - HR frameworks: specialist vs generalist, skill gap analysis
- **Capture Rate:** ~38% of real expertise (exceeds 35% threshold)
- **Best For:** Marathon/Sprint HR reviews, gap detection, hire recommendations, team composition strategy

### 3. Marcus (Zapier General Manager - Critical Thinker)
- **Name:** Marcus
- **File:** `_agents/zapier-gm.md`
- **Expertise:** Workflow automation strategy, enterprise features, competitive analysis, pricing
- **Research Sources:**
  - Zapier Leadership: Wade Foster (CEO), Bryan Helmig (CTO), Kieran Flanagan (CMO)
  - Zapier pricing strategy and tier structure (Free/Pro/Team/Enterprise)
  - Enterprise case studies: Toyota, Remote, Grammarly, Okta
  - Competitive analysis: Make, n8n, Power Automate
  - Product launches: Tables, Interfaces, Canvas
  - Industry reviews and criticisms from Trustpilot, G2, Capterra
- **Capture Rate:** ~35% of real expertise (meets threshold)
- **Best For:** Challenging weak assumptions, competitive analysis, enterprise feature evaluation, pricing strategy, workflow architecture critique
- **Role in Party Mode:** Adversarial critical thinker who demands evidence and pushes back on weak ideas

### 4. Ralph Wiggum (QA Validation Specialist)
- **Name:** Ralph Wiggum
- **File:** `_agents/ralph-wiggum.md`
- **Expertise:** Task validation, build verification, browser testing, bug detection, fix suggestions
- **Core Responsibility:** 100% responsible for verifying ALL "completed" tasks actually work at human level
- **Validation Checklist:**
  1. Build passes (`npm run build`)
  2. No TypeScript errors (`npx tsc --noEmit`)
  3. Dev server runs (`npm run dev`)
  4. Feature visible in browser (Playwright MCP)
  5. No console errors (browser console clean)
  6. Functionality actually works
- **FAILURE Mode:** If ANY task fails validation, Ralph marks it as REJECTED (NOT DONE) with specific failure reason and suggested fix
- **Capture Rate:** N/A (internal QA role, not research-backed)
- **Best For:** Final validation of all completed work, catching bugs before users, ensuring code quality
- **Role in Party Mode:** Last line of defense - validates every "completed" task before loop continues
- **Personality:** Thorough but helpful - finds issues AND suggests fixes. "I'm helping!"

---

## How to Hire New Agents

Use the command:
```
"Hire a [Role Title] agent"
```

Claude will:
1. Research the role using WebSearch (LinkedIn, job postings, industry standards)
2. Fetch official documentation and guidelines
3. Create `_agents/[role-slug].md` with full configuration
4. Register the agent in this file

### Suggested Agents to Hire
- Google Material Design Engineer
- Apple Human Interface Designer
- Stripe API Developer
- Vercel Frontend Engineer
- Senior React Architect
- AWS Solutions Architect
- Security Penetration Tester

---

## Version History

| Date | Change |
|------|--------|
| 2026-01-12 | Initial system created, first agent hired (OpenAI UI Engineer) |
| 2026-01-12 | Second agent hired (OpenAI HR Talent Strategist - Ava) for Marathon/Sprint HR automation |
| 2026-01-12 | Third agent hired (Zapier GM - Marcus) for adversarial critical thinking and competitive analysis |
| 2026-01-13 | Fourth agent created (Ralph Wiggum - QA Validation Specialist) for 100% task validation with failure mode |
