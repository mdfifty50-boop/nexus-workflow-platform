# AI Agency Consultancy Methodology Research
## Comparative Analysis: BMAD Method vs Spec Kit vs Optimal AI Agency Practices

**Date:** 2026-02-14
**Purpose:** Compare three methodologies for how an AI agency consultancy should handle conversations and provide value
**Scope:** Discovery, orchestration, multi-domain expertise, service delivery

---

## Table of Contents

1. [Methodology 1: BMAD Method](#1-bmad-method)
2. [Methodology 2: Spec Kit (Spec-Driven Development)](#2-spec-kit)
3. [Methodology 3: Optimal AI Agency Method (Industry Best Practices)](#3-optimal-ai-agency-method)
4. [Comparative Analysis](#4-comparative-analysis)
5. [Recommended Hybrid Approach](#5-recommended-hybrid-approach)
6. [Agent Orchestration Recommendations](#6-agent-orchestration-recommendations)
7. [Sources](#7-sources)

---

## 1. BMAD Method

### Full Name
**Breakthrough Method of Agile AI-Driven Development**

### What It Is
BMAD is an open-source (MIT license) AI-driven agile development framework created by BMad Code, featuring 21+ specialized AI agents, 50+ guided workflows, and scale-adaptive intelligence. It is designed to move projects through an end-to-end lifecycle from ideation through planning, solutioning, implementation, and quality assurance. The framework treats documentation and specifications -- not code -- as the source of truth.

### Core Philosophy
- AI agents are disciplined participants inside an agile lifecycle, not ad hoc assistants
- Two-phase approach: **Agentic Planning** followed by **Context-Engineered Development**
- Docs-as-code: documentation (PRDs, architecture, user stories) is the source of truth; code is a downstream derivative
- Human-in-the-loop refinement at every planning gate

### Workflow Phases (As Implemented in This Codebase)

**Phase 1 -- Analysis:**
- Create Product Brief (conversational discovery with user)
- Research: Domain analysis, market research, technical feasibility
- Output: Product brief document with problem definition, goals, constraints

**Phase 2 -- Planning:**
- PRD (Product Requirements Document) creation with domain complexity analysis
- UX Design workflows
- Output: Detailed PRD and UX specifications

**Phase 3 -- Solutioning:**
- Architecture creation (with architecture decision records)
- Epics and stories generation
- Implementation readiness check
- Output: Architecture docs, epics, stories with acceptance criteria

**Phase 4 -- Implementation:**
- Sprint planning and story creation
- Development stories with full context
- Code review workflows
- Sprint status tracking and retrospectives
- Course correction workflows

**Quick Flow (Lightweight Path):**
- Tech Spec creation through conversational discovery and code investigation
- Direct implementation from spec
- Bypasses full ceremony for smaller features

### CEO-Director-Agent Model (Orchestration)

The codebase implements a sophisticated orchestration model:

```
CEO (Human) --> Director (Claude Orchestrator) --> Specialized Agents (Parallel Workers)
```

**Hierarchy:**
- **CEO**: Sets vision, approves scope, intervenes only when needed
- **Director**: Translates vision into scope, assigns work, validates alignment, blocks drift
- **Agents**: Execute within locked scope, no autonomous drift allowed

**Key Mechanisms:**
- Scope Lock: Every agent receives explicit file lists, feature boundaries, and forbidden actions
- Anti-Hallucination Guardrails: Context anchoring, output validation, rejection protocol
- Wave-Based Execution: Group tasks into Planning > Documentation > Implementation > Quality waves
- Parallel execution with 5-10 agents per loop
- Context Window Protection: Sub-agents run in isolated 200K token windows; only summaries return to Director
- Model Tiering: Opus for architecture, Sonnet for code, Haiku for validation (cost optimization)

**Named Agent Roles:**
| Agent | Role | Model |
|-------|------|-------|
| BMad Master | Workflow orchestration | -- |
| Winston (Architect) | Technical design | Opus |
| Amelia (Dev) | Implementation | Sonnet |
| Sally (UX) | Design tasks | Opus |
| John (PM) | Requirements | -- |
| Ralph (QA) | Validation | Haiku |
| Ava (HR) | Gap analysis, hire recommendations | Haiku |
| Marcus (GM) | Strategic review, competitive analysis | Opus |
| Zara (UI) | UI implementation | -- |

**Validation Layer:**
- Ralph QA validates every loop output
- Marcus GM conducts strategic review every 5 loops
- Ava HR does gap analysis after each loop
- Director validates every deliverable against scope document

### Strengths
1. **Deep orchestration model** -- the CEO-Director-Agent hierarchy with scope locking is highly mature
2. **Anti-hallucination guardrails** are explicit and enforced (scope binding, output validation, context anchoring, rejection protocol)
3. **Parallel execution** with wave-based gating provides both speed and quality
4. **Context window protection** via sub-agent isolation prevents long-session degradation
5. **Cost optimization** through model tiering (haiku/sonnet/opus per task complexity)
6. **Recovery mechanisms** -- session files, progress trackers, checkpoint protocols survive compaction
7. **Named agent personas** make team coordination intuitive and auditable
8. **Full lifecycle coverage** from product brief through deployment and retrospective

### Weaknesses
1. **Heavy ceremony for small tasks** -- even the "Quick Flow" requires tech spec creation first
2. **Tightly coupled to software development** -- the phases, stories, and sprint structures assume you are building software, not consulting
3. **No explicit client conversation management** -- designed for internal team execution, not client-facing consultation
4. **Rigid phase gates** can slow down when discovery and implementation need to interleave
5. **Complexity overhead** -- 21 agents, 50+ workflows, extensive configuration files create a steep learning curve
6. **Single-user CEO model** -- assumes one decision-maker; does not model multi-stakeholder client environments
7. **No pricing/engagement model** -- built for product development, not for selling consulting services

---

## 2. Spec Kit (Spec-Driven Development)

### Full Name
**GitHub Spec Kit -- Specification-Driven Development Toolkit**

### What It Is
Spec Kit is an open-source toolkit (MIT license) created by GitHub in 2025 that formalizes Spec-Driven Development (SDD) for AI coding agents. It provides a CLI, templates, and prompts that center work around four gated phases: Specify, Plan, Tasks, Implement. The specification -- not code -- is the source of truth.

### Core Philosophy
- Specifications are executable blueprints for AI code generation
- The developer's role shifts from typist to architect/validator
- "Every hour spent on planning saves 10 hours of rework"
- Human insight drives AI coding, not the other way around
- Built-in quality checkpoints catch misalignments before they become bugs

### The Four Gated Phases

**Phase 1 -- Specify (`/specify`):**
- Developer writes high-level description of what needs to be built and why
- AI agent drafts a detailed spec (goals, user journeys, constraints)
- Iterative refinement with human feedback
- Output: `spec.md` -- the single source of truth

**Phase 2 -- Plan (`/plan`):**
- Declare architecture, stack, and constraints
- AI proposes technical plan respecting organizational patterns
- Automatic feature numbering, branch creation, template-based generation
- Output: `plan.md` with architecture decisions, data models, contracts

**Phase 3 -- Tasks (`/tasks`):**
- AI breaks work into small, reviewable, testable units
- Tasks organized by user story with dependency management
- Parallel execution markers (`[P]`) for concurrent work
- File path specifications for each task
- TDD structure: test tasks before implementation tasks
- Checkpoint validation per user story phase
- Output: `tasks.md` -- implementation roadmap

**Phase 4 -- Implement:**
- AI tackles tasks sequentially or in parallel
- Human verifies at each checkpoint
- Incremental delivery of user stories

### Directory Structure
```
specs/[###-feature]/
  spec.md          # Specification (source of truth)
  plan.md          # Technical plan
  research.md      # Research findings
  data-model.md    # Data model definitions
  quickstart.md    # Quick start guide
  contracts/       # API contracts
  tasks.md         # Implementation tasks
```

### Evolving Specifications
Community consensus supports adjusting non-constitutional spec documents during manual testing and acceptance phases. Specs evolve based on reviewer feedback, and only requirements where idea and implementation align are considered accepted.

### Strengths
1. **Extreme simplicity** -- four clear phases with three commands (`/specify`, `/plan`, `/tasks`)
2. **Specification as source of truth** -- prevents AI-generated code drift from actual requirements
3. **Tool-agnostic** -- works with Claude Code, GitHub Copilot, Gemini CLI, Cursor, and others
4. **Built-in quality gates** at each phase transition
5. **Structured task decomposition** with dependency ordering, parallel markers, and TDD support
6. **Lightweight directory structure** keeps everything organized and discoverable
7. **Active community** with GitHub discussions driving methodology evolution
8. **Low barrier to entry** -- just markdown files and a CLI

### Weaknesses
1. **Single-developer focus** -- designed for one developer working with one AI agent; no multi-agent orchestration
2. **No team coordination model** -- lacks equivalent of BMAD's Director or CEO-Agent hierarchy
3. **No validation or QA phase** -- the four phases end at "Implement" with no explicit testing/review stage
4. **"Sea of markdown" problem** -- practitioners report drowning in markdown documents and long agent run-times
5. **Criticized as "reinvented waterfall"** -- the rigid Specify > Plan > Tasks > Implement sequence mirrors waterfall methodology with all its rigidity
6. **No client-facing layer** -- purely a development methodology, not a consultation framework
7. **No cost optimization** -- no model tiering or resource management
8. **Immature ecosystem** -- relatively new (2025), still evolving rapidly
9. **No recovery/session management** -- lacks BMAD's checkpoint and compaction recovery mechanisms

---

## 3. Optimal AI Agency Method (Industry Best Practices)

### What It Is
A synthesis of how leading AI consulting firms (BCG, McKinsey, Deloitte, AWS Professional Services) and top AI agencies structure client engagements in 2025-2026. This is not a single framework but a composite of proven patterns from the industry.

### Core Philosophy
- Asset-based consulting: create reusable tools, models, and frameworks across engagements
- Lean teams with specialized roles: AI facilitators, engagement architects, client leaders
- Outcome-based pricing over time-and-materials billing
- Progressive autonomy spectrum: human-in-the-loop > human-on-the-loop > human-out-of-the-loop
- Multi-agent orchestration with role-based design mirrors human team structures

### The Engagement Lifecycle

**Phase 1 -- Discovery & Assessment:**
- Readiness assessment (data quality, infrastructure, workforce skills, leadership alignment)
- Process mining and workflow analysis
- Identify where AI adds the most value (typically repetitive tasks first)
- Stakeholder interviews and pain point mapping
- Output: Current-state assessment, opportunity map, prioritized use cases

**Phase 2 -- Solution Design:**
- Map business problems to feasible AI solutions
- Score use cases by business impact, feasibility, and urgency
- Design optimized future-state leveraging AI capabilities
- Define governance, compliance, and oversight models
- Output: Solution architecture, AI strategy roadmap, pilot selection

**Phase 3 -- Implementation:**
- Phased approach with parallel deployment alongside existing processes
- Modular integration (middleware bridges between legacy and AI)
- Agile sprints with stakeholder reviews
- Change management and user training
- Output: Deployed AI solutions, training materials, integration documentation

**Phase 4 -- Optimization & Continuous Improvement:**
- Real-time monitoring with model retraining
- Process simulation to predict impact of changes
- Continuous performance measurement against KPIs
- SLA-backed uptime and regulatory compliance updates
- Output: Optimization reports, updated models, evolved governance policies

### Multi-Agent Orchestration Patterns (From Industry Leaders)

The autonomous AI agent market is projected to reach $8.5B by 2026 and $35B by 2030 (Deloitte). Gartner reported a 1,445% surge in inquiries about multi-agent systems from early 2024 to mid-2025.

**Role-Based Agent Design (Most Common Pattern):**
- **Planner Agent**: Translates high-level objectives into structured plans
- **Executor Agent**: Carries out actions (API calls, code, queries)
- **Critic Agent**: Intentionally adversarial, challenges assumptions
- **Validator Agent**: Enforces constraints and compliance
- **Red-team Agent**: Simulates failure modes

**Orchestration Architectures:**
| Architecture | Best For |
|-------------|----------|
| Centralized | Consistency, compliance, audit trails |
| Decentralized | Resilience, horizontal scaling |
| Hierarchical | Strategic oversight + tactical autonomy |
| Federated | Regulation-restricted data sharing |

**Key Industry Frameworks:**
- **BCG's DRI (Deploy, Reshape, Invent)**: Three value plays for scaling AI
- **McKinsey's AI-Augmented Consulting**: Fuse AI speed with consultant interpretation
- **AWS Professional Services Agents**: Central delivery agent delegates to specialized agents
- **Deloitte's Autonomy Spectrum**: Progressive human oversight reduction based on task criticality

### The "Obelisk" Consulting Model (HBR, 2025)
Traditional pyramid (many juniors, few partners) is being replaced by an "obelisk" -- fewer layers, smaller teams, with three key roles:
1. **AI Facilitators**: Trained in latest AI tools and data pipelines
2. **Engagement Architects**: Lead projects, define problems, interpret AI output, translate to strategy
3. **Client Leaders**: Cultivate deep, trusted relationships with senior executives

### What Makes the Best AI Agencies Better

1. **Strategic depth over surface tactics** -- explain what they deliberately do NOT do and why
2. **Genuine multi-domain expertise** -- not just rebranding existing services with AI buzzwords
3. **Proven results with third-party validation** -- 3.4x higher AI visibility with combined approaches
4. **Asset-based methodology** -- reusable frameworks that scale across engagements
5. **Revenue-focused, not activity-focused** -- measure impact, not effort
6. **Hybrid human-AI workflow** -- senior expertise for strategy, AI for analysis and execution
7. **Continuous optimization clauses** in contracts -- not one-shot deployments
8. **Change management capability** -- user adoption is as important as technical implementation

### Pricing Models
| Model | Description |
|-------|-------------|
| Subscription | Ongoing access to AI platforms/tools |
| Outcome-based | Payment tied to measurable results |
| AI-as-a-Service | Hosted AI solutions with SLA guarantees |
| Hybrid | Fixed discovery + variable implementation |

### Strengths
1. **Client-centric** -- designed around client relationships, not just internal execution
2. **Multi-stakeholder model** -- handles complex organizational dynamics
3. **Pricing innovation** -- outcome-based and subscription models align incentives
4. **Continuous optimization** -- not a one-shot engagement
5. **Change management built in** -- addresses adoption, not just technology
6. **Governance and compliance** -- enterprise-ready with audit trails and policy gates
7. **Asset reusability** -- build once, deploy across clients
8. **Progressive autonomy** -- appropriate human oversight for each situation

### Weaknesses
1. **Generic frameworks** -- BCG/McKinsey approaches are designed for large enterprises, may not fit smaller consultancies
2. **No specific tooling** -- these are conceptual frameworks, not runnable systems like BMAD or Spec Kit
3. **Expensive to operationalize** -- requires significant investment in tools, training, and governance
4. **Consulting firm bias** -- oriented toward traditional consulting models rather than AI-native agencies
5. **Slow ramp-up** -- readiness assessments and change management add weeks before value delivery
6. **Less prescriptive** -- tells you WHAT to do but not precisely HOW to implement it
7. **No code-level methodology** -- handles strategy and process but not the technical implementation workflow

---

## 4. Comparative Analysis

### Feature Matrix

| Feature | BMAD | Spec Kit | AI Agency Best Practices |
|---------|------|----------|-------------------------|
| **Client Discovery** | Product brief (internal) | Specify phase | Readiness assessment + stakeholder mapping |
| **Multi-Agent Orchestration** | 21 agents, CEO-Director-Agent | Single agent | Role-based (Planner, Executor, Critic) |
| **Scope Control** | Scope Lock + Anti-hallucination | Spec as source of truth | Governance + compliance gates |
| **Quality Assurance** | Ralph QA every loop | No explicit QA phase | Continuous monitoring + SLA |
| **Client Communication** | CEO briefing format | Developer checkpoints | Client Leader role + structured updates |
| **Cost Optimization** | Model tiering (opus/sonnet/haiku) | None | Outcome-based pricing |
| **Recovery/Resilience** | Session files, checkpoints | None | SLA-backed uptime |
| **Phase Structure** | 4 phases + Quick Flow | 4 gated phases | 4-phase lifecycle |
| **Lightweight Path** | Quick Flow (tech spec + implement) | Core workflow IS lightweight | Pilot/MVP approach |
| **Multi-Stakeholder** | Single CEO model | Single developer | Multi-stakeholder, multi-domain |
| **Asset Reusability** | Templates and workflows | Spec templates | Reusable models and frameworks |
| **Change Management** | None | None | Built-in |
| **Governance/Compliance** | Fix registry + hooks | None | Enterprise governance models |
| **Pricing Support** | None | None | Multiple pricing models |
| **Maturity** | Mature (v5+) | New (2025) | Mature (decades of consulting) |

### Dimension Analysis

**For Conversation Handling:**
- BMAD: Structured through agent personas but designed for internal teams
- Spec Kit: Conversational discovery in Specify phase, but single-thread
- AI Agency: Richest -- multi-stakeholder engagement with structured discovery

**For Value Delivery:**
- BMAD: High for software development projects with full lifecycle coverage
- Spec Kit: High for spec-to-code delivery with quality checkpoints
- AI Agency: Highest for business impact -- outcome-based, ROI-measured

**For Multi-Domain Expertise:**
- BMAD: Strong -- named agents represent different domains (architecture, UX, PM, QA, HR, strategy)
- Spec Kit: Weak -- single-agent, single-domain
- AI Agency: Strongest -- engagement architects + AI facilitators + domain experts

**For Scalability:**
- BMAD: Medium -- complex setup but parallelized execution
- Spec Kit: High -- lightweight, easy to adopt
- AI Agency: High -- asset-based models scale across clients

---

## 5. Recommended Hybrid Approach

### The "Nexus Consultancy Method" -- Best of All Three

The recommended hybrid takes specific strengths from each methodology:

```
FROM BMAD:
  - CEO-Director-Agent hierarchy (renamed for consultancy)
  - Multi-agent orchestration with scope locking
  - Anti-hallucination guardrails
  - Model tiering for cost optimization
  - Wave-based execution with parallel agents
  - Named agent personas for domain expertise

FROM SPEC KIT:
  - Specification as source of truth principle
  - Four gated phases with explicit checkpoints
  - Structured task decomposition with dependency ordering
  - Lightweight markdown-based artifact system
  - Evolving specifications based on feedback

FROM AI AGENCY BEST PRACTICES:
  - Client-centric engagement lifecycle
  - Discovery/readiness assessment phase
  - Multi-stakeholder communication
  - Outcome-based success metrics
  - Continuous optimization (not one-shot)
  - Change management integration
  - Asset-based reusable frameworks
  - Progressive autonomy spectrum
```

### Proposed Engagement Lifecycle

```
Phase 0: DISCOVERY (AI Agency)
  |
  v
Phase 1: SPECIFICATION (Spec Kit + BMAD Analysis)
  |
  v
Phase 2: SOLUTION DESIGN (BMAD Solutioning + AI Agency Design)
  |
  v
Phase 3: IMPLEMENTATION (BMAD CEO-Director-Agent + Spec Kit Tasks)
  |
  v
Phase 4: OPTIMIZATION (AI Agency Continuous Improvement)
```

### Phase 0 -- Discovery & Assessment
**Source:** AI Agency Best Practices
**Duration:** 1-3 sessions

- Readiness assessment: data quality, existing systems, team capabilities
- Stakeholder mapping: who makes decisions, who uses the output
- Pain point analysis: what hurts most, where is time wasted
- Use case prioritization: score by impact, feasibility, urgency
- Engagement model selection: subscription, project, outcome-based

**Agent Involvement:**
- **Engagement Architect Agent**: Leads discovery, asks probing questions
- **Domain Expert Agent(s)**: Provide industry-specific context (finance, operations, marketing, etc.)
- **Compliance Agent**: Flags regulatory considerations early

**Output:** Discovery Report with prioritized opportunities, recommended approach, and success metrics.

### Phase 1 -- Specification
**Source:** Spec Kit (primary) + BMAD Analysis phase
**Duration:** 1-2 sessions

- Formalize requirements into specification documents
- Define goals, user journeys, constraints, and acceptance criteria
- Spec becomes the single source of truth for all subsequent work
- Research phase: domain analysis, technical feasibility, competitive landscape

**Agent Involvement:**
- **Spec Engineer Agent**: Creates detailed specifications from discovery findings
- **Research Agent**: Performs domain/market/technical research
- **Critic Agent**: Challenges assumptions, identifies gaps in specs

**Output:** Specification document(s) with acceptance criteria, research findings.

### Phase 2 -- Solution Design
**Source:** BMAD Solutioning + AI Agency Design patterns
**Duration:** 1-3 sessions

- Architecture decisions with explicit decision records
- Technical plan with dependency analysis
- Task decomposition with parallel execution markers
- Governance model definition
- Change management plan

**Agent Involvement:**
- **Architect Agent**: Technical design and architecture decisions
- **UX/CX Agent**: Customer experience design
- **Strategy Agent**: Business alignment, competitive positioning
- **PM Agent**: Requirements clarification, priority ordering

**Output:** Solution architecture, task roadmap, governance model, change management plan.

### Phase 3 -- Implementation
**Source:** BMAD CEO-Director-Agent model + Spec Kit task execution
**Duration:** Iterative sprints

- CEO-Director-Agent orchestration with scope locking
- Wave-based parallel execution (Planning > Implementation > Quality)
- Ralph-style QA validation every iteration
- Spec Kit's task-by-task checkpoint verification
- Model tiering for cost optimization

**Agent Involvement:**
- **Director Agent**: Orchestrates all work, validates alignment
- **Coder Agent(s)**: Implementation tasks (Sonnet-tier)
- **QA Agent**: Validation after each wave (Haiku-tier)
- **Architect Agent**: Complex decisions only (Opus-tier)

**Output:** Deployed solutions, validated against specifications.

### Phase 4 -- Optimization & Continuous Value
**Source:** AI Agency Best Practices
**Duration:** Ongoing

- Performance monitoring against KPIs defined in Phase 0
- Model retraining and optimization
- Process simulation for change impact prediction
- Regular strategic reviews (a la Marcus GM review)
- Evolving specifications based on production feedback

**Agent Involvement:**
- **Monitor Agent**: Tracks performance metrics
- **Optimizer Agent**: Identifies improvement opportunities
- **Strategy Agent**: Periodic business alignment review
- **Client Leader Agent**: Relationship management, satisfaction checks

**Output:** Optimization reports, updated specifications, evolving roadmap.

---

## 6. Agent Orchestration Recommendations

### Recommendation 1: Adopt a Three-Tier Agent Hierarchy for Consultancy

```
Tier 1: CLIENT-FACING AGENTS (the consultancy's "voice")
  - Engagement Architect: Leads discovery, translates client language to technical
  - Client Leader: Relationship management, satisfaction, escalations
  - Domain Experts: Finance, Operations, Marketing, Legal, CX (activated per engagement)

Tier 2: ORCHESTRATION AGENTS (the consultancy's "brain")
  - Director: Scope management, agent coordination, quality gates
  - Strategy Agent: Business alignment, competitive analysis
  - Compliance Agent: Regulatory, governance, risk assessment

Tier 3: EXECUTION AGENTS (the consultancy's "hands")
  - Spec Engineer: Specification creation and maintenance
  - Architect: Technical design
  - Coder(s): Implementation
  - QA: Validation and testing
  - Research: Domain, market, and technical research
```

### Recommendation 2: Structured Conversation Protocol

For AI consultancy agents handling discussions, use this protocol:

**Opening (Discovery):**
1. Greet and establish context
2. Ask about current situation, pain points, goals
3. Assess readiness (data, systems, team)
4. Map stakeholders and decision-making process
5. Summarize understanding, confirm alignment

**Middle (Specification + Design):**
1. Present prioritized opportunities based on discovery
2. Collaboratively refine specifications
3. Present solution options with trade-offs
4. Validate understanding at each checkpoint
5. Create living specification document

**Closing (Commitment + Next Steps):**
1. Summarize agreed scope and approach
2. Define success metrics and measurement plan
3. Outline implementation timeline
4. Establish communication cadence
5. Define escalation triggers and review points

### Recommendation 3: Anti-Hallucination for Consultancy

Adapt BMAD's guardrails for consulting:

| Guardrail | Consulting Adaptation |
|-----------|----------------------|
| Scope Lock | Engagement scope document, signed off by client stakeholders |
| Context Anchoring | Begin each session with client goals + agreed scope + progress summary |
| Output Validation | Verify every recommendation against client's stated constraints and priorities |
| Rejection Protocol | Flag and redirect when conversation drifts outside engagement scope |
| Critic Agent | Dedicated agent that challenges recommendations before presenting to client |

### Recommendation 4: Progressive Autonomy Model

Match agent autonomy to engagement maturity:

| Stage | Autonomy Level | Description |
|-------|---------------|-------------|
| Discovery | Human-in-the-loop | Every insight confirmed with client |
| Specification | Human-in-the-loop | Spec evolves through collaborative refinement |
| Design | Human-on-the-loop | Agents propose, client reviews and approves |
| Implementation | Human-on-the-loop | Agents execute within approved scope, periodic reviews |
| Optimization | Human-out-of-the-loop | Agents monitor and optimize within defined parameters |

### Recommendation 5: Cost-Aware Model Selection

Extend BMAD's model tiering for consultancy:

| Task Type | Model Tier | Cost | Examples |
|-----------|-----------|------|----------|
| Discovery questions | Medium (Sonnet) | $$ | Client interviews, requirement elicitation |
| Research and analysis | Low (Haiku) | $ | Market research, competitive analysis |
| Strategy and architecture | High (Opus) | $$$ | Business strategy, solution architecture |
| Implementation | Medium (Sonnet) | $$ | Code generation, workflow configuration |
| QA and validation | Low (Haiku) | $ | Testing, compliance checks |
| Client communication | High (Opus) | $$$ | Proposals, executive summaries |

### Recommendation 6: Asset Library for Reusability

Build a consultancy asset library:

| Asset Type | Description | Reuse Pattern |
|-----------|-------------|---------------|
| Discovery Templates | Structured questionnaires by industry/domain | Per engagement kickoff |
| Spec Templates | Specification formats for common use cases | Per feature/project |
| Architecture Patterns | Proven solution architectures | Per solution design |
| Implementation Playbooks | Step-by-step guides for common integrations | Per implementation |
| Governance Models | Compliance and oversight frameworks | Per regulated industry |
| ROI Calculators | Impact measurement tools | Per optimization review |

---

## 7. Sources

### BMAD Method
- [BMAD Method GitHub Repository](https://github.com/bmad-code-org/BMAD-METHOD)
- [What is BMAD-METHOD? (Medium)](https://medium.com/@visrow/what-is-bmad-method-a-simple-guide-to-the-future-of-ai-driven-development-412274f91419)
- [BMAD Method Official Docs](https://docs.bmad-method.org/)
- [Applied BMAD - Reclaiming Control in AI Development](https://bennycheung.github.io/bmad-reclaiming-control-in-ai-dev)
- [Mastering the BMAD Method (Medium)](https://medium.com/@courtlinholt/mastering-the-bmad-method-a-revolutionary-approach-to-agile-ai-driven-development-for-modern-e7be588b8d94)
- [BMAD Method Guide (Redreamality)](https://redreamality.com/garden/notes/bmad-method-guide/)
- Local codebase: `_bmad/` directory with full agent definitions, workflows, and orchestration model

### Spec Kit / Spec-Driven Development
- [GitHub Spec Kit Repository](https://github.com/github/spec-kit)
- [Spec-Driven Development Methodology (GitHub)](https://github.com/github/spec-kit/blob/main/spec-driven.md)
- [Spec Kit Official Site](https://speckit.org/)
- [ThoughtWorks: Spec-Driven Development](https://www.thoughtworks.com/en-us/insights/blog/agile-engineering-practices/spec-driven-development-unpacking-2025-new-engineering-practices)
- [Scott Logic: Putting Spec Kit Through Its Paces](https://blog.scottlogic.com/2025/11/26/putting-spec-kit-through-its-paces-radical-idea-or-reinvented-waterfall.html)
- [Microsoft Developer Blog: Diving Into Spec-Driven Development](https://developer.microsoft.com/blog/spec-driven-development-spec-kit)
- [EPAM: Inside Spec-Driven Development](https://www.epam.com/insights/ai/blogs/inside-spec-driven-development-what-githubspec-kit-makes-possible-for-ai-engineering)
- [SoftwareSeni: Complete Guide](https://www.softwareseni.com/spec-driven-development-in-2025-the-complete-guide-to-using-ai-to-write-production-code/)

### AI Agency Best Practices
- [HBR: AI Is Changing the Structure of Consulting Firms](https://hbr.org/2025/09/ai-is-changing-the-structure-of-consulting-firms)
- [BCG: AI @ Scale Consulting](https://www.bcg.com/capabilities/artificial-intelligence)
- [McKinsey, BCG, Bain AI Consulting (Medium)](https://medium.com/@takafumi.endo/how-ai-is-redefining-strategy-consulting-insights-from-mckinsey-bcg-and-bain-69d6d82f1bab)
- [AWS Professional Service Agents](https://aws.amazon.com/blogs/machine-learning/accelerate-enterprise-solutions-with-agentic-ai-powered-consulting-introducing-aws-professional-service-agents/)
- [Deloitte: AI Agent Orchestration Predictions](https://www.deloitte.com/us/en/insights/industry/technology/technology-media-and-telecom-predictions/2026/ai-agent-orchestration.html)
- [Lazarev Agency: AI Strategy Consulting 101](https://www.lazarev.agency/articles/ai-strategy-consulting)
- [AI in Client Delivery (Digital PM)](https://thedigitalprojectmanager.com/project-management/ai-in-client-delivery/)
- [CX Today: Multi-Agent AI Orchestration for Enterprise CX](https://www.cxtoday.com/crm/how-can-multi-agent-ai-orchestration-optimize-customer-interactions/)

### Multi-Agent Orchestration
- [Multi-Agent AI Orchestration: Enterprise Strategy 2025-2026](https://www.onabout.ai/p/mastering-multi-agent-orchestration-architectures-patterns-roi-benchmarks-for-2025-2026)
- [8 Best Multi-Agent AI Frameworks for 2026](https://www.multimodal.dev/post/best-multi-agent-ai-frameworks)
- [Multi-Agent System Architecture Guide 2026](https://www.clickittech.com/ai/multi-agent-system-architecture/)
- [Kanerika: AI Agent Orchestration in 2026](https://kanerika.com/blogs/ai-agent-orchestration/)
- [n8n Blog: AI Agent Orchestration Frameworks](https://blog.n8n.io/ai-agent-orchestration-frameworks/)

---

*Research compiled 2026-02-14. All sources accessed February 2026.*
