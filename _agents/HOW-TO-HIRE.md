# How to Hire New Agents

This guide explains how to hire new researched agents with real expertise.

---

## Quick Command

Say to Claude:
```
"Hire a [Role Title] agent"
```

Examples:
- "Hire a Google Material Design Engineer"
- "Hire a Stripe API Developer"
- "Hire a Senior React Architect"
- "Hire an AWS Solutions Architect"

---

## Automatic Name Assignment

Every hired agent receives a **human name** automatically based on:
- Common names in that industry/region
- Cultural alignment with the company/role
- Easy pronunciation and memorability

| Role | Example Auto-Name |
|------|-------------------|
| OpenAI UI Engineer | Zara (after real OpenAI designers) |
| Google Material Design Engineer | Priya |
| AWS Solutions Architect | Marcus |
| Stripe API Developer | Elena |

Names are assigned in Phase 3 and appear in:
- The agent's `.md` file metadata
- The BMAD agent-manifest.csv `displayName` field
- All Party Mode discussions

---

## What Happens When You Hire

### Phase 1: Deep Research (3-5 minutes)

**Standard Research (25-30% capture):**
1. **LinkedIn** - Find real people in that role, their backgrounds, skills
2. **Job Postings** - Extract required skills, qualifications, responsibilities
3. **Official Docs** - Company design systems, guidelines, principles

**Enhanced Research (35-45% capture):**
4. **Case Studies** - Real-world examples of their work
5. **Interviews/Talks** - Public statements, conference talks, podcasts
6. **GitHub/Open Source** - Code patterns, PR reviews, issue discussions
7. **Blog Posts/Medium** - Personal insights, tutorials, opinions
8. **Academic Papers** - If applicable, research methodologies
9. **Tool Documentation** - Deep dive into tools they use
10. **Community Forums** - Stack Overflow, Discord, Slack discussions

**Maximum Research (45-55% capture):**
11. **Video Tutorials** - YouTube channels, course content
12. **Books Authored** - If they've written technical books
13. **Patent Filings** - For innovative roles (if applicable)
14. **Company Engineering Blogs** - Internal culture, decision-making
15. **Competitor Analysis** - How their company differs from others

### Phase 2: Synthesis (2-3 minutes)
Claude extracts:
- Core expertise areas with sources
- Decision-making frameworks with examples
- Guardrails (what they NEVER do) with reasoning
- Quality criteria with thresholds
- Communication style patterns
- 5+ example scenarios with detailed responses
- Common mistakes they'd catch
- Tools/libraries they prefer and why

### Phase 3: Configuration
Claude creates:
- `_agents/[role-slug].md` - Full agent configuration (500+ lines)
- Updates `_agents/AGENTS.md` - Registry entry
- **Auto-assigns human name** in metadata and manifest

### Phase 4: BMAD Integration
Claude adds the agent to:
- `_bmad/_config/agent-manifest.csv` - Official BMAD agent roster

**This ensures the hired agent joins EVERY Party Mode session automatically.**

### Phase 5: Ready to Use
The agent is now available:

**In Party Mode:**
```
"Launch BMAD Party Mode"
→ Hired agents automatically appear and participate
```

**Direct invocation:**
```
"Get the [Agent Name] to [task]"
```

### Persistence Guarantee
Hired agents are stored in FILES, not memory:
- Survive PC restarts
- Survive Claude context resets
- Survive session changes
- Available forever (until manually deleted)

---

## Recommended Agents to Hire

### Design & UX
| Agent | Best For |
|-------|----------|
| Google Material Design Engineer | Android apps, Material 3, design tokens |
| Apple Human Interface Designer | iOS apps, SF Symbols, platform conventions |
| Figma Design Systems Architect | Component libraries, design tokens, variants |
| Framer Motion Specialist | Animations, transitions, micro-interactions |

### Frontend Engineering
| Agent | Best For |
|-------|----------|
| Vercel Frontend Engineer | Next.js, edge functions, deployment |
| Senior React Architect | Large-scale React apps, state management |
| Tailwind CSS Expert | Utility-first CSS, responsive design |
| TypeScript Strict Mode Engineer | Type safety, generics, advanced patterns |

### Backend & Infrastructure
| Agent | Best For |
|-------|----------|
| AWS Solutions Architect | Cloud architecture, serverless, scaling |
| Supabase Engineer | PostgreSQL, RLS, real-time subscriptions |
| Stripe Integration Developer | Payments, subscriptions, webhooks |
| Auth0 Security Engineer | Authentication, OAuth, identity management |

### Specialized Roles
| Agent | Best For |
|-------|----------|
| Accessibility (a11y) Specialist | WCAG compliance, screen readers, ARIA |
| Performance Engineer | Core Web Vitals, bundle optimization |
| Security Penetration Tester | Vulnerability assessment, OWASP |
| Technical Writer | Documentation, API docs, user guides |

---

## What You Get vs. What's Missing

### Captured (~25-30%)
- Official documentation and guidelines
- Public job requirements
- Documented best practices
- Known patterns and anti-patterns
- Tools and technologies used
- Communication style from public content

### Not Captured (~70-75%)
- Tacit knowledge from years of experience
- Internal company processes
- Unpublished lessons from failures
- Creative problem-solving in novel situations
- Political/organizational navigation
- The "gut feeling" from thousands of decisions

---

## Tips for Best Results

### 1. Be Specific About the Role
```
Good: "Hire a Stripe Payments Integration Engineer"
Okay: "Hire a Stripe Developer"
Poor: "Hire a payments person"
```

### 2. Specify Company When Relevant
```
"Hire an engineer who works at [Company]"
```
This focuses research on that company's specific standards.

### 3. Combine Agents for Complex Tasks
```
"Get the OpenAI UI Engineer and the React Architect to review this component"
```

### 4. Update Agents Periodically
```
"Update the OpenAI UI Engineer with latest 2026 guidelines"
```
Re-research to capture new documentation.

---

## File Structure

```
_agents/
├── AGENTS.md              # Master registry of all agents
├── HOW-TO-HIRE.md         # This guide
├── openai-ui-engineer.md  # First hired agent
├── [future-agent].md      # Future agents go here
└── ...
```

---

## Limitations to Understand

1. **Not a Clone** - You're getting a well-researched character, not the actual person
2. **Public Knowledge Only** - Can't access private/internal information
3. **No Novel Creativity** - Can apply known patterns, not invent new ones
4. **Static Expertise** - Doesn't learn from your project over time
5. **~25-30% Capture** - Significant but not complete expertise

Despite limitations, this is **infinitely better** than generic prompts with no research backing.
