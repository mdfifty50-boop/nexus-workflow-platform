/**
 * Nexus Project Management Domain Intelligence Module
 *
 * Provides comprehensive project management workflow intelligence including:
 * - Project kickoff and initialization
 * - Sprint planning and execution
 * - Task assignment and tracking
 * - Status reporting and dashboards
 * - Risk escalation and mitigation
 * - Change request management
 * - Resource allocation and capacity planning
 * - Milestone tracking and delivery
 * - Project closure and handoff
 * - Retrospective and continuous improvement
 *
 * Supports multiple methodologies: Agile, Scrum, Kanban, Waterfall, Hybrid
 * Regional Focus: Global with Kuwait/Gulf cultural adaptations
 */

import type {
  ImplicitRequirement,
  ClarifyingQuestion,
  ToolRecommendation,
  WorkflowChainStep,
  QuestionOption,
} from '../workflow-intelligence';

// ============================================================================
// TYPES
// ============================================================================

export interface ProjectManagementWorkflowPattern {
  name: string;
  description: string;
  layers: ('input' | 'processing' | 'output' | 'notification')[];
  steps: string[];
  implicitNeeds: string[];
  questions: string[];
  methodology: string[];
  estimatedDuration: string;
  keyMetrics: string[];
}

export interface ProjectManagementRegionalContext {
  region: string;
  workWeek: string;
  workWeekAdjustment?: string;
  holidayBuffer?: string;
  culturalNotes: string[];
  preferredCommunicationStyle: string;
  decisionMakingStyle: string;
  meetingEtiquette: string[];
}

export interface BurndownData {
  totalPoints: number;
  completedPoints: number;
  remainingPoints: number;
  daysRemaining: number;
  idealBurnRate: number;
  actualBurnRate: number;
  projectedCompletion: Date | null;
  isOnTrack: boolean;
  recommendation: string;
}

export interface VelocityData {
  completedPoints: number;
  sprintDays: number;
  velocity: number;
  dailyVelocity: number;
  projectedCapacity: number;
  historicalComparison?: {
    average: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    percentChange: number;
  };
}

export interface ProjectCompletionEstimate {
  remainingPoints: number;
  velocity: number;
  estimatedSprints: number;
  estimatedDays: number;
  estimatedCompletionDate: Date;
  confidenceLevel: 'high' | 'medium' | 'low';
  assumptions: string[];
  risks: string[];
}

export interface ProjectManagementAnalysisResult {
  pattern: string | null;
  requirements: ImplicitRequirement[];
  tools: ToolRecommendation[];
  questions: ClarifyingQuestion[];
  methodology: string | null;
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedDuration: string | null;
}

// ============================================================================
// PROJECT MANAGEMENT WORKFLOW PATTERNS
// ============================================================================

export const PROJECT_MANAGEMENT_WORKFLOW_PATTERNS: Record<string, ProjectManagementWorkflowPattern> = {
  // Project Kickoff Pattern
  project_kickoff: {
    name: 'Project Kickoff',
    description: 'Initialize a new project with stakeholder alignment, scope definition, and team onboarding',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'define_vision_goals',
      'identify_stakeholders',
      'document_scope',
      'setup_timeline',
      'assign_team',
      'create_project_charter',
      'kickoff_meeting',
      'distribute_charter',
    ],
    implicitNeeds: [
      'Project charter template and documentation',
      'Stakeholder registry and communication matrix',
      'Scope documentation and boundary definition',
      'Timeline and milestone planning tool',
      'Team assignment and RACI matrix',
      'Project management platform setup',
      'Kickoff meeting scheduling and facilitation',
      'Document distribution and version control',
    ],
    questions: [
      'What is the project methodology (Agile, Waterfall, Hybrid)?',
      'Who are the key stakeholders and decision makers?',
      'What is the expected project duration?',
      'What are the success criteria and KPIs?',
      'Is there an existing PMO or governance structure?',
    ],
    methodology: ['Agile', 'Waterfall', 'Hybrid', 'PRINCE2'],
    estimatedDuration: '1-2 weeks for kickoff phase',
    keyMetrics: ['Stakeholder alignment score', 'Scope clarity index', 'Team readiness level'],
  },

  // Sprint Planning Pattern
  sprint_planning: {
    name: 'Sprint Planning',
    description: 'Plan and prepare for a development sprint with capacity calculation and story selection',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'review_backlog',
      'calculate_capacity',
      'estimate_stories',
      'select_sprint_items',
      'define_sprint_goal',
      'break_down_tasks',
      'commit_sprint_scope',
      'notify_team',
    ],
    implicitNeeds: [
      'Groomed product backlog with priorities',
      'Team capacity calculator (accounting for PTO, meetings)',
      'Story estimation system (points or hours)',
      'Sprint goal alignment with product roadmap',
      'Task breakdown and assignment capability',
      'Sprint backlog management tool',
      'Team commitment and alignment process',
      'Sprint kickoff communication',
    ],
    questions: [
      'What is your sprint duration (1, 2, 3, or 4 weeks)?',
      'How do you estimate work (story points, hours, t-shirt sizes)?',
      'What is your team average velocity?',
      'Are there any known blockers or dependencies?',
      'Who is the Product Owner for backlog prioritization?',
    ],
    methodology: ['Scrum', 'Agile', 'SAFe'],
    estimatedDuration: '2-4 hours per sprint planning session',
    keyMetrics: ['Velocity', 'Sprint commitment', 'Capacity utilization'],
  },

  // Task Assignment Pattern
  task_assignment: {
    name: 'Task Assignment',
    description: 'Assign and distribute work items to team members based on skills and capacity',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'identify_tasks',
      'assess_skills_required',
      'check_team_availability',
      'match_skills_to_tasks',
      'assign_tasks',
      'set_due_dates',
      'notify_assignees',
      'update_board',
    ],
    implicitNeeds: [
      'Task list with clear requirements',
      'Skill matrix and team capabilities database',
      'Team availability and workload visibility',
      'Intelligent matching algorithm or rules',
      'Assignment notification system',
      'Due date and deadline tracking',
      'Kanban board or task board update',
      'Workload balancing capability',
    ],
    questions: [
      'Do you have a skills matrix for your team?',
      'How do you track team availability and workload?',
      'Should assignments be automatic or require approval?',
      'What notification channels do assignees prefer?',
      'How do you handle task dependencies?',
    ],
    methodology: ['Agile', 'Kanban', 'Scrum', 'Traditional'],
    estimatedDuration: '15-30 minutes per assignment batch',
    keyMetrics: ['Assignment turnaround time', 'Skill match score', 'Workload balance'],
  },

  // Status Reporting Pattern
  status_reporting: {
    name: 'Status Reporting',
    description: 'Generate and distribute project status reports with metrics, risks, and highlights',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'collect_metrics_data',
      'gather_updates',
      'identify_risks_issues',
      'calculate_progress',
      'generate_report',
      'review_report',
      'distribute_report',
      'archive_report',
    ],
    implicitNeeds: [
      'Metrics aggregation from multiple sources',
      'Team update collection mechanism',
      'Risk and issue registry integration',
      'Progress calculation engine (% complete, burndown)',
      'Report template and generation tool',
      'Review and approval workflow',
      'Multi-channel distribution (email, Slack, portal)',
      'Report versioning and archival',
    ],
    questions: [
      'What is your reporting frequency (daily, weekly, bi-weekly)?',
      'Who are the report recipients (stakeholders, executives, team)?',
      'What metrics and KPIs should be included?',
      'What format do stakeholders prefer (deck, document, dashboard)?',
      'Should the report include risk highlights?',
    ],
    methodology: ['All methodologies'],
    estimatedDuration: '1-2 hours per report cycle',
    keyMetrics: ['Report timeliness', 'Stakeholder satisfaction', 'Issue resolution rate'],
  },

  // Risk Escalation Pattern
  risk_escalation: {
    name: 'Risk Escalation',
    description: 'Identify, assess, and escalate project risks through appropriate channels',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'identify_risk',
      'assess_impact_probability',
      'categorize_risk',
      'determine_escalation_path',
      'document_risk',
      'notify_stakeholders',
      'track_mitigation',
      'update_risk_register',
    ],
    implicitNeeds: [
      'Risk identification framework and triggers',
      'Impact and probability assessment matrix',
      'Risk categorization taxonomy',
      'Escalation path and authority matrix',
      'Risk documentation template',
      'Stakeholder notification with severity levels',
      'Mitigation tracking and follow-up',
      'Risk register maintenance',
    ],
    questions: [
      'What is your risk tolerance level (risk appetite)?',
      'Who has authority to accept different risk levels?',
      'What triggers automatic escalation?',
      'How quickly should critical risks be communicated?',
      'Do you have an existing risk register?',
    ],
    methodology: ['PRINCE2', 'PMI', 'Agile', 'All methodologies'],
    estimatedDuration: '30 minutes per risk assessment',
    keyMetrics: ['Risk response time', 'Risk closure rate', 'Mitigation effectiveness'],
  },

  // Change Request Pattern
  change_request: {
    name: 'Change Request',
    description: 'Manage project change requests through evaluation, approval, and implementation',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'submit_change_request',
      'assess_impact',
      'estimate_effort',
      'review_with_stakeholders',
      'approve_or_reject',
      'update_scope',
      'communicate_decision',
      'track_implementation',
    ],
    implicitNeeds: [
      'Change request form and submission portal',
      'Impact assessment framework (scope, schedule, cost)',
      'Effort estimation for change implementation',
      'Change Advisory Board (CAB) or review process',
      'Approval workflow with authority levels',
      'Scope baseline update mechanism',
      'Decision communication to all stakeholders',
      'Change implementation tracking',
    ],
    questions: [
      'Do you have a formal Change Control Board (CCB)?',
      'What is the approval threshold for different change sizes?',
      'How do you assess impact on scope, schedule, and cost?',
      'Should changes be auto-approved under certain thresholds?',
      'How do you communicate change decisions to the team?',
    ],
    methodology: ['ITIL', 'PRINCE2', 'PMI', 'Waterfall', 'Hybrid'],
    estimatedDuration: '1-5 days per change request depending on size',
    keyMetrics: ['Change approval rate', 'Average approval time', 'Change success rate'],
  },

  // Resource Allocation Pattern
  resource_allocation: {
    name: 'Resource Allocation',
    description: 'Plan and manage team resource allocation across projects and initiatives',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'identify_resource_needs',
      'assess_current_allocation',
      'check_availability',
      'optimize_allocation',
      'handle_conflicts',
      'allocate_resources',
      'notify_managers',
      'track_utilization',
    ],
    implicitNeeds: [
      'Resource requirement forecasting',
      'Current allocation visibility across projects',
      'Availability and capacity tracking',
      'Allocation optimization algorithm',
      'Conflict resolution process',
      'Resource assignment and booking system',
      'Manager notification and approval',
      'Utilization tracking and reporting',
    ],
    questions: [
      'How do you currently track resource availability?',
      'Are resources shared across multiple projects?',
      'What is your target utilization rate?',
      'How do you handle resource conflicts between projects?',
      'Do you need skills-based allocation?',
    ],
    methodology: ['All methodologies', 'Resource Management'],
    estimatedDuration: '2-4 hours per allocation cycle',
    keyMetrics: ['Utilization rate', 'Allocation accuracy', 'Conflict resolution time'],
  },

  // Milestone Tracking Pattern
  milestone_tracking: {
    name: 'Milestone Tracking',
    description: 'Track and monitor project milestones with progress updates and alerts',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'define_milestones',
      'set_target_dates',
      'track_progress',
      'calculate_variance',
      'generate_alerts',
      'update_dashboard',
      'notify_stakeholders',
      'document_completion',
    ],
    implicitNeeds: [
      'Milestone definition and breakdown structure',
      'Target date and baseline management',
      'Progress tracking against deliverables',
      'Variance calculation (schedule, scope)',
      'Alert rules and threshold configuration',
      'Executive dashboard with milestone view',
      'Stakeholder notification for slippage/completion',
      'Milestone completion documentation and sign-off',
    ],
    questions: [
      'How do you define project milestones?',
      'What variance threshold should trigger alerts?',
      'Who should be notified of milestone changes?',
      'Do milestones require formal sign-off?',
      'How do you handle milestone dependencies?',
    ],
    methodology: ['Waterfall', 'Hybrid', 'PRINCE2', 'PMI'],
    estimatedDuration: 'Ongoing throughout project lifecycle',
    keyMetrics: ['Milestone variance', 'On-time completion rate', 'Schedule performance index'],
  },

  // Project Closure Pattern
  project_closure: {
    name: 'Project Closure',
    description: 'Formally close a project with deliverable handoff, documentation, and lessons learned',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'verify_deliverables',
      'obtain_acceptance',
      'handoff_documentation',
      'release_resources',
      'close_contracts',
      'archive_project',
      'conduct_celebration',
      'distribute_closure_report',
    ],
    implicitNeeds: [
      'Deliverable verification checklist',
      'Formal acceptance process and sign-off',
      'Documentation handoff and knowledge transfer',
      'Resource release and transition planning',
      'Contract and vendor closure',
      'Project archive and document repository',
      'Team recognition and celebration',
      'Closure report generation and distribution',
    ],
    questions: [
      'What deliverables require formal sign-off?',
      'Who has authority to accept project completion?',
      'Where should project documentation be archived?',
      'How do you handle resource transition?',
      'Is there a formal lessons learned process?',
    ],
    methodology: ['All methodologies', 'PMI', 'PRINCE2'],
    estimatedDuration: '1-2 weeks for formal closure',
    keyMetrics: ['Deliverable acceptance rate', 'Documentation completeness', 'Resource release time'],
  },

  // Retrospective Pattern
  retrospective: {
    name: 'Retrospective',
    description: 'Conduct team retrospectives to capture learnings and drive continuous improvement',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'schedule_retrospective',
      'collect_feedback',
      'facilitate_discussion',
      'identify_improvements',
      'prioritize_actions',
      'assign_action_items',
      'track_retro_progress',
      'share_learnings',
    ],
    implicitNeeds: [
      'Retrospective scheduling and invitation',
      'Anonymous feedback collection mechanism',
      'Facilitation framework (Start/Stop/Continue, 4Ls, etc.)',
      'Improvement idea capture and voting',
      'Action item prioritization',
      'Action item assignment and ownership',
      'Progress tracking for improvement actions',
      'Learning sharing across teams/organization',
    ],
    questions: [
      'What retrospective format do you prefer (Start/Stop/Continue, 4Ls, Sailboat)?',
      'Should feedback be anonymous?',
      'How often do you run retrospectives?',
      'Who should facilitate the retrospective?',
      'How do you track action items from retrospectives?',
    ],
    methodology: ['Scrum', 'Agile', 'Kanban', 'Lean'],
    estimatedDuration: '1-2 hours per retrospective session',
    keyMetrics: ['Action item completion rate', 'Team satisfaction', 'Improvement velocity'],
  },
};

// ============================================================================
// PROJECT MANAGEMENT KEYWORDS FOR PATTERN DETECTION
// ============================================================================

export const PROJECT_MANAGEMENT_KEYWORDS: Record<string, string[]> = {
  project_kickoff: [
    'project', 'initiative', 'program', 'portfolio',
    'kickoff', 'kick-off', 'kick off', 'start', 'launch',
    'charter', 'initiation', 'initialize', 'new project',
    'stakeholder', 'scope definition', 'project setup',
    'مشروع', 'برنامج', 'مبادرة', 'انطلاقة'
  ],

  sprint_planning: [
    'sprint', 'iteration', 'milestone', 'deadline',
    'planning', 'plan sprint', 'sprint planning',
    'capacity', 'velocity', 'story points', 'estimation',
    'backlog grooming', 'refinement', 'sprint goal',
    'سبرنت', 'تخطيط', 'قدرة'
  ],

  task_assignment: [
    'task', 'ticket', 'issue', 'story', 'epic',
    'assign', 'assignment', 'allocate', 'delegate',
    'workload', 'distribute', 'assignee', 'owner',
    'مهمة', 'تذكرة', 'تكليف', 'توزيع'
  ],

  status_reporting: [
    'status', 'report', 'reporting', 'update',
    'progress', 'dashboard', 'metrics', 'kpi',
    'summary', 'weekly report', 'daily standup',
    'تقرير', 'حالة', 'تحديث', 'لوحة المعلومات'
  ],

  risk_escalation: [
    'risk', 'blocker', 'dependency', 'constraint',
    'escalate', 'escalation', 'issue', 'impediment',
    'risk register', 'mitigation', 'contingency',
    'مخاطر', 'تصعيد', 'عائق', 'قيد'
  ],

  change_request: [
    'change', 'change request', 'cr', 'modification',
    'scope change', 'requirement change', 'amendment',
    'ccb', 'change control', 'change advisory',
    'طلب تغيير', 'تعديل', 'تغيير النطاق'
  ],

  resource_allocation: [
    'resource', 'capacity', 'allocation', 'utilization',
    'staffing', 'team allocation', 'headcount',
    'availability', 'resource planning', 'bench',
    'موارد', 'تخصيص', 'استخدام', 'قدرة'
  ],

  milestone_tracking: [
    'milestone', 'checkpoint', 'gate', 'phase',
    'deliverable', 'deadline', 'target date',
    'schedule', 'timeline', 'gantt', 'critical path',
    'معلم', 'نقطة تحقق', 'مرحلة', 'جدول زمني'
  ],

  project_closure: [
    'closure', 'close', 'closeout', 'complete',
    'finish', 'handoff', 'hand-off', 'transition',
    'acceptance', 'sign-off', 'archive',
    'إغلاق', 'اكتمال', 'تسليم', 'قبول'
  ],

  retrospective: [
    'retrospective', 'retro', 'lessons learned',
    'improvement', 'feedback', 'reflection',
    'post-mortem', 'sprint review', 'what went well',
    'استعادة', 'دروس مستفادة', 'تحسين'
  ],
};

// ============================================================================
// PROJECT MANAGEMENT IMPLICIT REQUIREMENTS
// ============================================================================

export const PROJECT_MANAGEMENT_IMPLICIT_REQUIREMENTS: Record<string, ImplicitRequirement[]> = {
  project_kickoff: [
    {
      category: 'input',
      description: 'Stakeholder identification and registry',
      reason: 'Must identify all stakeholders for effective communication and alignment',
      priority: 'critical',
      suggestedTools: ['Notion', 'Confluence', 'Google Sheets', 'Stakeholder Mapping Tool'],
    },
    {
      category: 'processing',
      description: 'Scope documentation and boundary definition',
      reason: 'Clear scope prevents scope creep and sets expectations',
      priority: 'critical',
      suggestedTools: ['Notion', 'Confluence', 'Microsoft Word', 'Google Docs'],
    },
    {
      category: 'processing',
      description: 'Timeline and milestone setup',
      reason: 'Timeline provides structure and accountability',
      priority: 'critical',
      suggestedTools: ['Jira', 'Asana', 'Monday.com', 'Microsoft Project', 'Linear'],
    },
    {
      category: 'output',
      description: 'Project charter creation',
      reason: 'Charter formalizes project authorization and scope',
      priority: 'critical',
      suggestedTools: ['Notion', 'Confluence', 'Google Docs', 'Coda'],
    },
    {
      category: 'notification',
      description: 'Kickoff meeting coordination and communication',
      reason: 'Aligns team and stakeholders on project vision',
      priority: 'important',
      suggestedTools: ['Slack', 'Microsoft Teams', 'Email', 'Zoom'],
    },
    {
      category: 'processing',
      description: 'RACI matrix definition',
      reason: 'Clarifies roles and responsibilities for decision-making',
      priority: 'important',
      suggestedTools: ['Google Sheets', 'Notion', 'Confluence', 'RACI Template'],
    },
  ],

  sprint_planning: [
    {
      category: 'input',
      description: 'Groomed product backlog with priorities',
      reason: 'Cannot plan sprint without prioritized work items',
      priority: 'critical',
      suggestedTools: ['Jira', 'Linear', 'Shortcut', 'ClickUp', 'Azure DevOps'],
    },
    {
      category: 'processing',
      description: 'Capacity calculation accounting for PTO and meetings',
      reason: 'Overcommitment leads to sprint failure',
      priority: 'critical',
      suggestedTools: ['Jira', 'Linear', 'Capacity Calculator', 'Google Sheets'],
    },
    {
      category: 'processing',
      description: 'Story estimation system (points or hours)',
      reason: 'Consistent estimation enables accurate planning',
      priority: 'critical',
      suggestedTools: ['Planning Poker', 'Jira', 'Linear', 'Miro'],
    },
    {
      category: 'processing',
      description: 'Sprint goal definition aligned with product roadmap',
      reason: 'Sprint goal provides focus and success criteria',
      priority: 'important',
      suggestedTools: ['Jira', 'Linear', 'Notion', 'Confluence'],
    },
    {
      category: 'output',
      description: 'Sprint backlog with committed items',
      reason: 'Team commitment drives accountability',
      priority: 'critical',
      suggestedTools: ['Jira', 'Linear', 'Shortcut', 'ClickUp'],
    },
    {
      category: 'notification',
      description: 'Sprint kickoff communication',
      reason: 'Team alignment on sprint scope and goals',
      priority: 'important',
      suggestedTools: ['Slack', 'Microsoft Teams', 'Email'],
    },
  ],

  task_assignment: [
    {
      category: 'input',
      description: 'Task list with clear requirements and acceptance criteria',
      reason: 'Clear requirements prevent rework and confusion',
      priority: 'critical',
      suggestedTools: ['Jira', 'Linear', 'Asana', 'ClickUp', 'Notion'],
    },
    {
      category: 'processing',
      description: 'Skill matrix and team capabilities database',
      reason: 'Match tasks to appropriate skills for quality delivery',
      priority: 'important',
      suggestedTools: ['Notion', 'Confluence', 'Google Sheets', 'HR System'],
    },
    {
      category: 'processing',
      description: 'Team availability and workload visibility',
      reason: 'Prevent overload and ensure balanced distribution',
      priority: 'critical',
      suggestedTools: ['Jira', 'Linear', 'Float', 'Resource Guru', 'Harvest'],
    },
    {
      category: 'output',
      description: 'Updated task board with assignments',
      reason: 'Visibility into who owns what work',
      priority: 'critical',
      suggestedTools: ['Jira', 'Linear', 'Trello', 'Asana', 'Monday.com'],
    },
    {
      category: 'notification',
      description: 'Assignment notifications to team members',
      reason: 'Assignees need to know about new work',
      priority: 'important',
      suggestedTools: ['Slack', 'Microsoft Teams', 'Email', 'In-app notifications'],
    },
  ],

  status_reporting: [
    {
      category: 'input',
      description: 'Metrics aggregation from project management tools',
      reason: 'Data-driven reports require automated collection',
      priority: 'critical',
      suggestedTools: ['Jira', 'Linear', 'ClickUp', 'Power BI', 'Tableau'],
    },
    {
      category: 'processing',
      description: 'Progress calculation engine (% complete, burndown)',
      reason: 'Stakeholders need clear progress indicators',
      priority: 'critical',
      suggestedTools: ['Jira Reports', 'Linear Insights', 'Custom Dashboard'],
    },
    {
      category: 'processing',
      description: 'Risk and issue highlighting',
      reason: 'Leadership needs visibility into blockers',
      priority: 'important',
      suggestedTools: ['Jira', 'Risk Register', 'Notion', 'Confluence'],
    },
    {
      category: 'output',
      description: 'Report generation with consistent formatting',
      reason: 'Professional reports build stakeholder confidence',
      priority: 'important',
      suggestedTools: ['Google Slides', 'PowerPoint', 'Notion', 'Confluence'],
    },
    {
      category: 'notification',
      description: 'Multi-channel report distribution',
      reason: 'Reach stakeholders on preferred channels',
      priority: 'important',
      suggestedTools: ['Slack', 'Email', 'Microsoft Teams', 'SharePoint'],
    },
  ],

  risk_escalation: [
    {
      category: 'input',
      description: 'Risk identification framework and triggers',
      reason: 'Systematic identification catches risks early',
      priority: 'critical',
      suggestedTools: ['Risk Templates', 'Jira', 'Notion', 'Risk Assessment Tool'],
    },
    {
      category: 'processing',
      description: 'Impact and probability assessment matrix',
      reason: 'Prioritize risks based on severity',
      priority: 'critical',
      suggestedTools: ['Risk Matrix Template', 'Google Sheets', 'Jira'],
    },
    {
      category: 'processing',
      description: 'Escalation path and authority matrix',
      reason: 'Know who decides on risk responses',
      priority: 'critical',
      suggestedTools: ['RACI Matrix', 'Escalation Flowchart', 'Notion'],
    },
    {
      category: 'output',
      description: 'Risk register maintenance',
      reason: 'Central repository for risk tracking',
      priority: 'critical',
      suggestedTools: ['Jira', 'Risk Register Template', 'Notion', 'Confluence'],
    },
    {
      category: 'notification',
      description: 'Stakeholder notification with severity levels',
      reason: 'Critical risks need immediate attention',
      priority: 'critical',
      suggestedTools: ['Slack', 'Email', 'PagerDuty', 'Microsoft Teams'],
    },
  ],

  change_request: [
    {
      category: 'input',
      description: 'Change request form and submission process',
      reason: 'Standardized submission ensures complete information',
      priority: 'critical',
      suggestedTools: ['Jira Service Management', 'ServiceNow', 'Google Forms', 'Notion'],
    },
    {
      category: 'processing',
      description: 'Impact assessment framework (scope, schedule, cost)',
      reason: 'Understand full impact before approval',
      priority: 'critical',
      suggestedTools: ['Impact Assessment Template', 'Google Sheets', 'Jira'],
    },
    {
      category: 'processing',
      description: 'Change Advisory Board review process',
      reason: 'Governance ensures appropriate oversight',
      priority: 'important',
      suggestedTools: ['Meeting Tools', 'Jira', 'ServiceNow', 'Workflow Tool'],
    },
    {
      category: 'output',
      description: 'Scope baseline update mechanism',
      reason: 'Approved changes must update project baseline',
      priority: 'critical',
      suggestedTools: ['Jira', 'Microsoft Project', 'Asana', 'Monday.com'],
    },
    {
      category: 'notification',
      description: 'Decision communication to stakeholders',
      reason: 'All parties need to know outcomes',
      priority: 'important',
      suggestedTools: ['Slack', 'Email', 'Microsoft Teams'],
    },
  ],

  resource_allocation: [
    {
      category: 'input',
      description: 'Resource requirement forecasting',
      reason: 'Plan ahead for resource needs',
      priority: 'critical',
      suggestedTools: ['Resource Management Tool', 'Google Sheets', 'Float', 'Resource Guru'],
    },
    {
      category: 'processing',
      description: 'Current allocation visibility across projects',
      reason: 'Prevent overallocation and conflicts',
      priority: 'critical',
      suggestedTools: ['Float', 'Resource Guru', 'Jira Portfolio', 'Monday.com'],
    },
    {
      category: 'processing',
      description: 'Allocation optimization algorithm or rules',
      reason: 'Maximize utilization and skill matching',
      priority: 'important',
      suggestedTools: ['AI-powered allocator', 'Resource Management Tool'],
    },
    {
      category: 'output',
      description: 'Resource assignment and booking system',
      reason: 'Formal allocation prevents conflicts',
      priority: 'critical',
      suggestedTools: ['Float', 'Resource Guru', 'Teamdeck', 'Forecast'],
    },
    {
      category: 'notification',
      description: 'Manager notification and approval workflow',
      reason: 'Managers need visibility into team allocation',
      priority: 'important',
      suggestedTools: ['Slack', 'Email', 'Workflow Automation'],
    },
  ],

  milestone_tracking: [
    {
      category: 'input',
      description: 'Milestone definition linked to deliverables',
      reason: 'Milestones must map to concrete outputs',
      priority: 'critical',
      suggestedTools: ['Jira', 'Asana', 'Microsoft Project', 'Monday.com'],
    },
    {
      category: 'processing',
      description: 'Progress tracking against deliverables',
      reason: 'Track completion status of milestone components',
      priority: 'critical',
      suggestedTools: ['Jira', 'Linear', 'Asana', 'ClickUp'],
    },
    {
      category: 'processing',
      description: 'Variance calculation (schedule, scope)',
      reason: 'Identify slippage early for corrective action',
      priority: 'important',
      suggestedTools: ['Jira Reports', 'Microsoft Project', 'Custom Dashboard'],
    },
    {
      category: 'output',
      description: 'Executive dashboard with milestone view',
      reason: 'Leadership visibility into key dates',
      priority: 'important',
      suggestedTools: ['Jira Portfolio', 'Power BI', 'Tableau', 'Notion'],
    },
    {
      category: 'notification',
      description: 'Stakeholder alerts for slippage or completion',
      reason: 'Proactive communication prevents surprises',
      priority: 'important',
      suggestedTools: ['Slack', 'Email', 'Microsoft Teams'],
    },
  ],

  project_closure: [
    {
      category: 'input',
      description: 'Deliverable verification checklist',
      reason: 'Ensure all commitments are met',
      priority: 'critical',
      suggestedTools: ['Checklist Template', 'Notion', 'Confluence', 'Google Docs'],
    },
    {
      category: 'processing',
      description: 'Formal acceptance process and sign-off',
      reason: 'Document stakeholder acceptance',
      priority: 'critical',
      suggestedTools: ['DocuSign', 'Google Forms', 'Acceptance Template'],
    },
    {
      category: 'processing',
      description: 'Documentation handoff and knowledge transfer',
      reason: 'Enable operations and support teams',
      priority: 'critical',
      suggestedTools: ['Confluence', 'Notion', 'SharePoint', 'GitBook'],
    },
    {
      category: 'output',
      description: 'Project archive and document repository',
      reason: 'Preserve project history for future reference',
      priority: 'important',
      suggestedTools: ['Confluence', 'SharePoint', 'Google Drive', 'Notion'],
    },
    {
      category: 'notification',
      description: 'Closure report distribution',
      reason: 'Communicate completion to all stakeholders',
      priority: 'important',
      suggestedTools: ['Email', 'Slack', 'Microsoft Teams'],
    },
  ],

  retrospective: [
    {
      category: 'input',
      description: 'Anonymous feedback collection mechanism',
      reason: 'Psychological safety enables honest feedback',
      priority: 'critical',
      suggestedTools: ['Miro', 'Retrium', 'EasyRetro', 'Parabol', 'TeamRetro'],
    },
    {
      category: 'processing',
      description: 'Facilitation framework (Start/Stop/Continue, 4Ls, etc.)',
      reason: 'Structure drives productive discussion',
      priority: 'important',
      suggestedTools: ['Miro Templates', 'Retrium', 'FunRetro', 'Notion'],
    },
    {
      category: 'processing',
      description: 'Action item prioritization and voting',
      reason: 'Focus on highest-impact improvements',
      priority: 'important',
      suggestedTools: ['Miro', 'Retrium', 'Parabol', 'Voting Tool'],
    },
    {
      category: 'output',
      description: 'Action item tracking and ownership',
      reason: 'Improvements need follow-through',
      priority: 'critical',
      suggestedTools: ['Jira', 'Linear', 'Asana', 'Notion', 'Trello'],
    },
    {
      category: 'notification',
      description: 'Learning sharing across teams/organization',
      reason: 'Scale improvements beyond single team',
      priority: 'optional',
      suggestedTools: ['Confluence', 'Slack', 'Internal Wiki', 'Notion'],
    },
  ],
};

// ============================================================================
// PROJECT MANAGEMENT TOOL RECOMMENDATIONS
// ============================================================================

export const PROJECT_MANAGEMENT_TOOL_RECOMMENDATIONS: Record<string, ToolRecommendation[]> = {
  // Agile Tools
  agile: [
    {
      toolSlug: 'JIRA',
      toolName: 'Jira',
      score: 96,
      reasons: [
        'Industry-leading Agile project management',
        'Scrum and Kanban board support',
        'Advanced reporting and analytics',
        'Extensive integration ecosystem',
        'Enterprise-grade scalability',
      ],
      regionalFit: 90,
      alternatives: [
        {
          toolSlug: 'LINEAR',
          toolName: 'Linear',
          reason: 'Modern, faster interface, developer-focused',
          tradeoff: 'Less enterprise features, smaller ecosystem',
        },
        {
          toolSlug: 'SHORTCUT',
          toolName: 'Shortcut (formerly Clubhouse)',
          reason: 'Balance of simplicity and power',
          tradeoff: 'Less market penetration',
        },
      ],
    },
    {
      toolSlug: 'LINEAR',
      toolName: 'Linear',
      score: 94,
      reasons: [
        'Lightning-fast modern interface',
        'Keyboard-first design for efficiency',
        'Beautiful issue tracking',
        'Git-like branching for issues',
        'Cycles and roadmaps built-in',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'SHORTCUT',
      toolName: 'Shortcut',
      score: 90,
      reasons: [
        'Clean, intuitive interface',
        'Flexible workflow customization',
        'Good balance of features and simplicity',
        'Strong API for automation',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'CLICKUP',
      toolName: 'ClickUp',
      score: 88,
      reasons: [
        'All-in-one workspace',
        'Highly customizable views',
        'Docs, goals, and time tracking built-in',
        'Competitive pricing',
      ],
      regionalFit: 85,
      alternatives: [],
    },
  ],

  // Traditional Project Management
  traditional: [
    {
      toolSlug: 'ASANA',
      toolName: 'Asana',
      score: 94,
      reasons: [
        'Excellent for cross-functional teams',
        'Timeline and workload management',
        'Goals and portfolio features',
        'Strong automation (Rules)',
        'Clean, approachable interface',
      ],
      regionalFit: 90,
      alternatives: [
        {
          toolSlug: 'MONDAY_COM',
          toolName: 'Monday.com',
          reason: 'More visual, non-technical friendly',
          tradeoff: 'Less depth in project management features',
        },
      ],
    },
    {
      toolSlug: 'MONDAY_COM',
      toolName: 'Monday.com',
      score: 92,
      reasons: [
        'Visual, colorful interface',
        'Easy for non-technical users',
        'Flexible work management',
        'Good automation capabilities',
        'Strong marketing and sales team adoption',
      ],
      regionalFit: 88,
      alternatives: [],
    },
    {
      toolSlug: 'MICROSOFT_PROJECT',
      toolName: 'Microsoft Project',
      score: 90,
      reasons: [
        'Industry standard for waterfall',
        'Advanced scheduling and dependencies',
        'Resource management',
        'Gantt chart excellence',
        'Microsoft ecosystem integration',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'SMARTSHEET',
      toolName: 'Smartsheet',
      score: 88,
      reasons: [
        'Spreadsheet-familiar interface',
        'Powerful automation',
        'Resource management',
        'Dashboards and reporting',
      ],
      regionalFit: 85,
      alternatives: [],
    },
  ],

  // Collaboration Tools
  collaboration: [
    {
      toolSlug: 'NOTION',
      toolName: 'Notion',
      score: 95,
      reasons: [
        'All-in-one workspace',
        'Flexible database system',
        'Excellent documentation',
        'Project and wiki combined',
        'Strong template ecosystem',
      ],
      regionalFit: 88,
      alternatives: [
        {
          toolSlug: 'CONFLUENCE',
          toolName: 'Confluence',
          reason: 'Tighter Jira integration',
          tradeoff: 'Less flexible, older interface',
        },
      ],
    },
    {
      toolSlug: 'CONFLUENCE',
      toolName: 'Confluence',
      score: 90,
      reasons: [
        'Atlassian ecosystem integration',
        'Enterprise wiki standard',
        'Jira integration for requirements',
        'Spaces for team organization',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'CODA',
      toolName: 'Coda',
      score: 88,
      reasons: [
        'Doc-database hybrid',
        'Powerful automation (Packs)',
        'Flexible building blocks',
        'Good for custom workflows',
      ],
      regionalFit: 82,
      alternatives: [],
    },
  ],

  // Communication Tools
  communication: [
    {
      toolSlug: 'SLACK',
      toolName: 'Slack',
      score: 96,
      reasons: [
        'Industry-leading team communication',
        'Channels for organized conversations',
        'Extensive app integrations',
        'Huddles for quick calls',
        'Workflow Builder for automation',
      ],
      regionalFit: 90,
      alternatives: [
        {
          toolSlug: 'MICROSOFT_TEAMS',
          toolName: 'Microsoft Teams',
          reason: 'Better for Microsoft shops',
          tradeoff: 'Less polished UX, slower performance',
        },
      ],
    },
    {
      toolSlug: 'MICROSOFT_TEAMS',
      toolName: 'Microsoft Teams',
      score: 92,
      reasons: [
        'Microsoft 365 integration',
        'Video conferencing built-in',
        'Enterprise-grade security',
        'Good for large organizations',
      ],
      regionalFit: 88,
      alternatives: [],
    },
    {
      toolSlug: 'DISCORD',
      toolName: 'Discord',
      score: 85,
      reasons: [
        'Voice channels always-on',
        'Great for distributed teams',
        'Free tier very capable',
        'Popular with developer communities',
      ],
      regionalFit: 75,
      alternatives: [],
    },
  ],

  // Documentation Tools
  documentation: [
    {
      toolSlug: 'NOTION',
      toolName: 'Notion',
      score: 95,
      reasons: [
        'Flexible documentation',
        'Databases and pages combined',
        'Templates for everything',
        'Great for team wikis',
      ],
      regionalFit: 88,
      alternatives: [],
    },
    {
      toolSlug: 'GITBOOK',
      toolName: 'GitBook',
      score: 90,
      reasons: [
        'Developer documentation focus',
        'Git-based version control',
        'Clean, readable output',
        'API documentation support',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'SLITE',
      toolName: 'Slite',
      score: 86,
      reasons: [
        'Simple, focused on docs',
        'Good search functionality',
        'Clean editing experience',
        'Async-first design',
      ],
      regionalFit: 82,
      alternatives: [],
    },
  ],

  // Retrospective Tools
  retrospective: [
    {
      toolSlug: 'MIRO',
      toolName: 'Miro',
      score: 94,
      reasons: [
        'Visual collaboration whiteboard',
        'Retro templates built-in',
        'Voting and timer features',
        'Works for remote teams',
        'Extensive template library',
      ],
      regionalFit: 90,
      alternatives: [
        {
          toolSlug: 'RETRIUM',
          toolName: 'Retrium',
          reason: 'Purpose-built for retrospectives',
          tradeoff: 'Single-purpose tool, additional cost',
        },
      ],
    },
    {
      toolSlug: 'RETRIUM',
      toolName: 'Retrium',
      score: 92,
      reasons: [
        'Built specifically for retros',
        'Multiple formats (4Ls, Start/Stop/Continue, etc.)',
        'Anonymous feedback option',
        'Action item tracking',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'PARABOL',
      toolName: 'Parabol',
      score: 88,
      reasons: [
        'Free for small teams',
        'Structured meeting facilitation',
        'Integrates with Jira/GitHub',
        'Good async support',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'EASYRETRO',
      toolName: 'EasyRetro (FunRetro)',
      score: 86,
      reasons: [
        'Simple and easy to use',
        'Good free tier',
        'Multiple board templates',
        'Quick setup',
      ],
      regionalFit: 85,
      alternatives: [],
    },
  ],

  // Resource Management
  resource_management: [
    {
      toolSlug: 'FLOAT',
      toolName: 'Float',
      score: 92,
      reasons: [
        'Visual resource scheduling',
        'Capacity planning',
        'Time tracking integration',
        'Clean interface',
      ],
      regionalFit: 85,
      alternatives: [
        {
          toolSlug: 'RESOURCE_GURU',
          toolName: 'Resource Guru',
          reason: 'Good for agencies',
          tradeoff: 'Less development-focused',
        },
      ],
    },
    {
      toolSlug: 'RESOURCE_GURU',
      toolName: 'Resource Guru',
      score: 88,
      reasons: [
        'Leave management included',
        'Availability tracking',
        'Project scheduling',
        'Reports and forecasting',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'TEAMDECK',
      toolName: 'Teamdeck',
      score: 86,
      reasons: [
        'Resource planning',
        'Time tracking',
        'Availability management',
        'Good for agencies',
      ],
      regionalFit: 82,
      alternatives: [],
    },
  ],
};

// ============================================================================
// PROJECT MANAGEMENT REGIONAL CONTEXT
// ============================================================================

export const PROJECT_MANAGEMENT_REGIONAL_CONTEXT = {
  global: {
    methodologies: ['Agile', 'Scrum', 'Kanban', 'Waterfall', 'Hybrid', 'SAFe', 'PRINCE2', 'PMI/PMBOK'],
    sprintDurations: ['1 week', '2 weeks', '3 weeks', '4 weeks'],
    reportingCadences: ['Daily standup', 'Weekly status', 'Bi-weekly sprint review', 'Monthly steering', 'Quarterly business review'],
    commonMetrics: ['Velocity', 'Burndown', 'Burnup', 'Cycle time', 'Lead time', 'Throughput', 'WIP limits', 'Cumulative flow'],
    ceremonyDurations: {
      standup: '15 minutes',
      sprintPlanning: '2-4 hours (per 2-week sprint)',
      sprintReview: '1-2 hours',
      retrospective: '1-2 hours',
      backlogRefinement: '1-2 hours per week',
    },
  },
  kuwait: {
    workWeek: 'Sunday-Thursday',
    workWeekAdjustment: 'Sunday-Thursday sprints (avoid Friday-Saturday work)',
    holidayBuffer: 'Account for Islamic holidays in planning (Eid, Ramadan adjusted hours)',
    culturalNotes: [
      'Hierarchy respected in escalations - escalate to appropriate authority level',
      'Relationship building important - factor in time for rapport before meetings',
      'Written commitments valued - document agreements formally',
      'Consensus decision-making preferred - allow time for stakeholder alignment',
      'Hospitality customs - expect meeting refreshments and social time',
      'Prayer times respected - schedule around prayer breaks',
    ],
    preferredCommunicationStyle: 'Formal but warm, indirect feedback preferred',
    decisionMakingStyle: 'Consensus-driven, senior approval important',
    meetingEtiquette: [
      'Start with pleasantries and relationship building',
      'Respect for seniority in speaking order',
      'Avoid scheduling during prayer times',
      'Friday is a day of rest - no meetings',
      'Ramadan: shorter working hours, be mindful of fasting',
    ],
  },
  uae: {
    workWeek: 'Monday-Friday (changed from Sunday-Thursday in 2022)',
    workWeekAdjustment: 'Monday-Friday sprints aligned with global teams',
    holidayBuffer: 'Account for UAE public holidays and Islamic holidays',
    culturalNotes: [
      'Fast-paced business environment',
      'Innovation and technology adoption embraced',
      'Multicultural workforce - consider diverse perspectives',
      'Professional and formal communication expected',
    ],
    preferredCommunicationStyle: 'Professional, direct but respectful',
    decisionMakingStyle: 'Hierarchical but increasingly agile',
    meetingEtiquette: [
      'Punctuality valued',
      'Business cards exchanged with both hands',
      'Dress code: business formal',
    ],
  },
  saudi: {
    workWeek: 'Sunday-Thursday',
    workWeekAdjustment: 'Sunday-Thursday sprints',
    holidayBuffer: 'Account for Saudi National Day, Islamic holidays',
    culturalNotes: [
      'Vision 2030 driving modernization',
      'Increasing women workforce participation',
      'Government projects have specific compliance requirements',
      'Arabic often preferred for formal documentation',
    ],
    preferredCommunicationStyle: 'Formal, respect for authority',
    decisionMakingStyle: 'Hierarchical, senior approval required',
    meetingEtiquette: [
      'Separate meetings may be needed for men and women in some contexts',
      'Prayer times strictly observed',
      'Ramadan significantly impacts working hours',
    ],
  },
  us: {
    workWeek: 'Monday-Friday',
    workWeekAdjustment: 'Standard Monday-Friday sprints',
    holidayBuffer: 'Account for US federal holidays, company holidays',
    culturalNotes: [
      'Direct communication valued',
      'Fast decision-making expected',
      'Results-oriented culture',
      'Work-life balance increasingly important',
    ],
    preferredCommunicationStyle: 'Direct, informal, results-focused',
    decisionMakingStyle: 'Empowered teams, quick decisions',
    meetingEtiquette: [
      'Time is money - stay on agenda',
      'Come prepared with data',
      'Action items expected at meeting end',
    ],
  },
  europe: {
    workWeek: 'Monday-Friday',
    workWeekAdjustment: 'Monday-Friday sprints, consider time zones',
    holidayBuffer: 'Account for country-specific holidays, August vacations',
    culturalNotes: [
      'Work-life balance highly valued',
      'GDPR compliance for data handling',
      'Multiple languages and cultures to consider',
      'Strong labor laws and employee rights',
    ],
    preferredCommunicationStyle: 'Varies by country - formal in Germany, more relaxed in Netherlands',
    decisionMakingStyle: 'Consensus-building, thorough analysis',
    meetingEtiquette: [
      'Punctuality expected (especially Germany, Switzerland)',
      'August vacation season - limited availability',
      'Respect for work hours - avoid after-hours contact',
    ],
  },
};

// ============================================================================
// PROJECT MANAGEMENT DOMAIN INTELLIGENCE CLASS
// ============================================================================

type RegionalContextType = (typeof PROJECT_MANAGEMENT_REGIONAL_CONTEXT)[keyof typeof PROJECT_MANAGEMENT_REGIONAL_CONTEXT];

export class ProjectManagementDomainIntelligence {
  private region: string;
  private _methodology: string;
  private regionalContext: RegionalContextType | null;

  constructor(region: string = 'global', methodology: string = 'agile') {
    this.region = region.toLowerCase();
    this._methodology = methodology.toLowerCase();
    this.regionalContext = PROJECT_MANAGEMENT_REGIONAL_CONTEXT[this.region as keyof typeof PROJECT_MANAGEMENT_REGIONAL_CONTEXT] || null;
  }

  /**
   * Get the configured methodology
   */
  getMethodology(): string {
    return this._methodology;
  }

  /**
   * Detect project management workflow pattern from user request
   */
  detectProjectManagementPattern(request: string): string | null {
    const normalizedRequest = request.toLowerCase();
    let bestMatch: string | null = null;
    let highestScore = 0;

    for (const [pattern, keywords] of Object.entries(PROJECT_MANAGEMENT_KEYWORDS)) {
      const score = keywords.filter(kw =>
        normalizedRequest.includes(kw.toLowerCase())
      ).length;

      if (score > highestScore) {
        highestScore = score;
        bestMatch = pattern;
      }
    }

    // Require at least 1 keyword match for PM patterns
    return highestScore >= 1 ? bestMatch : null;
  }

  /**
   * Get implicit requirements for a project management pattern
   */
  getImplicitRequirements(pattern: string): ImplicitRequirement[] {
    const requirements = [...(PROJECT_MANAGEMENT_IMPLICIT_REQUIREMENTS[pattern] || [])];

    // Add regional-specific requirements
    if (this.regionalContext && pattern) {
      const patternDef = PROJECT_MANAGEMENT_WORKFLOW_PATTERNS[pattern];
      if (patternDef && this.region === 'kuwait') {
        requirements.push({
          category: 'processing',
          description: 'Sunday-Thursday work week alignment',
          reason: 'Kuwait business week differs from Western Monday-Friday',
          priority: 'important',
          suggestedTools: ['Calendar adjustment', 'Sprint calendar'],
        });

        if (pattern === 'sprint_planning' || pattern === 'project_kickoff') {
          requirements.push({
            category: 'processing',
            description: 'Islamic holiday buffer in timeline',
            reason: 'Account for Eid, Ramadan adjusted schedules',
            priority: 'important',
            suggestedTools: ['Holiday calendar integration', 'Buffer calculation'],
          });
        }
      }
    }

    return requirements;
  }

  /**
   * Get tool recommendations for a project management pattern
   */
  getToolRecommendations(pattern: string): ToolRecommendation[] {
    const recommendations: ToolRecommendation[] = [];

    // Map pattern to tool category
    const categoryMapping: Record<string, string[]> = {
      project_kickoff: ['collaboration', 'communication', 'documentation'],
      sprint_planning: ['agile', 'collaboration'],
      task_assignment: ['agile', 'traditional'],
      status_reporting: ['agile', 'traditional', 'collaboration'],
      risk_escalation: ['agile', 'communication'],
      change_request: ['traditional', 'collaboration'],
      resource_allocation: ['resource_management', 'traditional'],
      milestone_tracking: ['traditional', 'agile'],
      project_closure: ['documentation', 'collaboration'],
      retrospective: ['retrospective', 'collaboration'],
    };

    const categories = categoryMapping[pattern] || ['agile'];

    // Get tools from each category
    categories.forEach(category => {
      const categoryTools = PROJECT_MANAGEMENT_TOOL_RECOMMENDATIONS[category] || [];
      recommendations.push(...categoryTools);
    });

    // Sort by score and regional fit
    return recommendations
      .sort((a, b) => {
        const scoreA = a.score * (a.regionalFit / 100);
        const scoreB = b.score * (b.regionalFit / 100);
        return scoreB - scoreA;
      })
      .slice(0, 10); // Return top 10
  }

  /**
   * Get clarifying questions for a project management pattern
   */
  getClarifyingQuestions(pattern: string): ClarifyingQuestion[] {
    const questions: ClarifyingQuestion[] = [];
    const patternDef = PROJECT_MANAGEMENT_WORKFLOW_PATTERNS[pattern];
    let questionId = 1;

    if (!patternDef) return questions;

    // Pattern-specific questions from the pattern definition
    patternDef.questions.forEach((questionText, index) => {
      questions.push({
        id: `pm_q${questionId++}`,
        question: questionText,
        category: this.categorizeQuestion(questionText),
        options: this.generateOptionsForQuestion(questionText, pattern),
        required: index < 3, // First 3 questions are required
        relevanceScore: 100 - (index * 10),
      });
    });

    // Add methodology question if not already detected
    questions.push({
      id: `pm_q${questionId++}`,
      question: 'What project methodology do you follow?',
      category: 'platform',
      options: [
        { value: 'scrum', label: 'Scrum', description: 'Sprint-based Agile framework', implications: ['2-week sprints', 'Daily standups', 'Sprint ceremonies'] },
        { value: 'kanban', label: 'Kanban', description: 'Flow-based continuous delivery', implications: ['WIP limits', 'Continuous flow', 'Pull-based work'] },
        { value: 'waterfall', label: 'Waterfall', description: 'Sequential phase-based approach', implications: ['Phase gates', 'Milestone tracking', 'Change control'] },
        { value: 'hybrid', label: 'Hybrid', description: 'Mix of Agile and traditional', implications: ['Flexible approach', 'Customized ceremonies'] },
      ],
      required: true,
      relevanceScore: 95,
    });

    // Add regional-specific questions for Kuwait
    if (this.region === 'kuwait') {
      questions.push({
        id: `pm_q${questionId++}`,
        question: 'Do you need to account for Islamic holidays in planning?',
        category: 'region',
        options: [
          { value: 'yes', label: 'Yes', description: 'Include Eid, Ramadan buffers', implications: ['Holiday buffer in timelines', 'Adjusted capacity during Ramadan'] },
          { value: 'no', label: 'No', description: 'Standard planning' },
        ],
        required: false,
        relevanceScore: 80,
      });

      questions.push({
        id: `pm_q${questionId++}`,
        question: 'Is your team working Sunday-Thursday or Monday-Friday?',
        category: 'region',
        options: [
          { value: 'sun_thu', label: 'Sunday-Thursday', description: 'Kuwait standard work week' },
          { value: 'mon_fri', label: 'Monday-Friday', description: 'International work week' },
          { value: 'mixed', label: 'Mixed', description: 'Different teams have different schedules' },
        ],
        required: true,
        relevanceScore: 85,
      });
    }

    // Add tool-specific questions
    if (pattern === 'sprint_planning' || pattern === 'task_assignment') {
      questions.push({
        id: `pm_q${questionId++}`,
        question: 'What project management tool do you use?',
        category: 'platform',
        options: [
          { value: 'jira', label: 'Jira', description: 'Atlassian Jira Software' },
          { value: 'linear', label: 'Linear', description: 'Modern issue tracking' },
          { value: 'asana', label: 'Asana', description: 'Work management platform' },
          { value: 'monday', label: 'Monday.com', description: 'Work OS platform' },
          { value: 'clickup', label: 'ClickUp', description: 'All-in-one productivity' },
          { value: 'other', label: 'Other', description: 'Different tool' },
        ],
        required: true,
        relevanceScore: 90,
      });
    }

    return questions;
  }

  /**
   * Calculate team velocity from completed work
   */
  calculateVelocity(completedPoints: number, sprintDays: number): VelocityData {
    const velocity = completedPoints;
    const dailyVelocity = sprintDays > 0 ? completedPoints / sprintDays : 0;
    const projectedCapacity = dailyVelocity * 10; // Assuming 2-week sprints

    return {
      completedPoints,
      sprintDays,
      velocity,
      dailyVelocity: Math.round(dailyVelocity * 100) / 100,
      projectedCapacity: Math.round(projectedCapacity),
    };
  }

  /**
   * Calculate burndown data for sprint tracking
   */
  calculateBurndown(totalPoints: number, completedPoints: number, daysRemaining: number): BurndownData {
    const remainingPoints = totalPoints - completedPoints;
    const daysElapsed = this.getDefaultSprintDays() - daysRemaining;

    // Ideal burn rate: total points / total days
    const totalDays = this.getDefaultSprintDays();
    const idealBurnRate = totalDays > 0 ? totalPoints / totalDays : 0;

    // Actual burn rate: completed points / days elapsed
    const actualBurnRate = daysElapsed > 0 ? completedPoints / daysElapsed : 0;

    // Projected completion
    let projectedCompletion: Date | null = null;
    if (actualBurnRate > 0) {
      const daysToComplete = remainingPoints / actualBurnRate;
      projectedCompletion = new Date();
      projectedCompletion.setDate(projectedCompletion.getDate() + Math.ceil(daysToComplete));
    }

    // Is on track?
    const idealRemaining = totalPoints - (idealBurnRate * daysElapsed);
    const isOnTrack = remainingPoints <= idealRemaining;

    // Generate recommendation
    let recommendation: string;
    if (isOnTrack) {
      recommendation = 'Sprint is on track. Continue current pace.';
    } else {
      const pointsBehind = remainingPoints - idealRemaining;
      recommendation = `Sprint is ${Math.round(pointsBehind)} points behind ideal. Consider scope reduction or overtime.`;
    }

    return {
      totalPoints,
      completedPoints,
      remainingPoints,
      daysRemaining,
      idealBurnRate: Math.round(idealBurnRate * 100) / 100,
      actualBurnRate: Math.round(actualBurnRate * 100) / 100,
      projectedCompletion,
      isOnTrack,
      recommendation,
    };
  }

  /**
   * Estimate project completion based on velocity
   */
  estimateProjectCompletion(velocity: number, remainingPoints: number): ProjectCompletionEstimate {
    const sprintDays = this.getDefaultSprintDays();

    // Calculate sprints needed
    const estimatedSprints = velocity > 0 ? Math.ceil(remainingPoints / velocity) : Infinity;
    const estimatedDays = estimatedSprints * sprintDays;

    // Calculate completion date
    const estimatedCompletionDate = new Date();
    estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + estimatedDays);

    // Determine confidence level
    let confidenceLevel: 'high' | 'medium' | 'low';
    if (estimatedSprints <= 2) {
      confidenceLevel = 'high';
    } else if (estimatedSprints <= 5) {
      confidenceLevel = 'medium';
    } else {
      confidenceLevel = 'low';
    }

    // Generate assumptions and risks
    const assumptions = [
      `Velocity remains stable at ${velocity} points per sprint`,
      `No significant scope changes`,
      `Team capacity remains consistent`,
      `Dependencies are resolved on time`,
    ];

    const risks = [
      'Velocity may vary due to complexity of remaining work',
      'Unplanned work or bugs may reduce capacity',
      'Team availability changes (PTO, holidays)',
      'Technical debt may slow progress',
    ];

    return {
      remainingPoints,
      velocity,
      estimatedSprints,
      estimatedDays,
      estimatedCompletionDate,
      confidenceLevel,
      assumptions,
      risks,
    };
  }

  /**
   * Get the workflow chain for a project management pattern
   */
  getWorkflowChain(pattern: string): WorkflowChainStep[] {
    const patternDef = PROJECT_MANAGEMENT_WORKFLOW_PATTERNS[pattern];
    if (!patternDef) return [];

    const chain: WorkflowChainStep[] = [];

    patternDef.steps.forEach((stepName, index) => {
      const layer = patternDef.layers[Math.min(index, patternDef.layers.length - 1)];
      const implicitReq = PROJECT_MANAGEMENT_IMPLICIT_REQUIREMENTS[pattern]?.[index];

      chain.push({
        step: index + 1,
        layer,
        description: this.humanizeStepName(stepName),
        requiredCapability: implicitReq?.description || stepName,
        suggestedTools: implicitReq?.suggestedTools || [],
        isResolved: false,
      });
    });

    return chain;
  }

  /**
   * Get regional context for project management
   */
  getRegionalContext(): RegionalContextType | null {
    return this.regionalContext;
  }

  /**
   * Get global project management context
   */
  getGlobalContext(): typeof PROJECT_MANAGEMENT_REGIONAL_CONTEXT.global {
    return PROJECT_MANAGEMENT_REGIONAL_CONTEXT.global;
  }

  /**
   * Get recommended sprint duration based on methodology and team size
   */
  getRecommendedSprintDuration(teamSize: number): string {
    if (teamSize <= 3) {
      return '1 week';
    } else if (teamSize <= 7) {
      return '2 weeks';
    } else if (teamSize <= 12) {
      return '3 weeks';
    } else {
      return '4 weeks';
    }
  }

  /**
   * Calculate capacity for a sprint
   */
  calculateSprintCapacity(
    teamMembers: number,
    sprintDays: number,
    ptoHours: number = 0,
    meetingHours: number = 0
  ): {
    totalHours: number;
    availableHours: number;
    utilizationRate: number;
    focusHoursPerDay: number;
  } {
    const hoursPerDay = 8;
    const totalHours = teamMembers * sprintDays * hoursPerDay;
    const availableHours = totalHours - ptoHours - meetingHours;
    const utilizationRate = totalHours > 0 ? (availableHours / totalHours) * 100 : 0;
    const focusHoursPerDay = sprintDays > 0 ? availableHours / sprintDays : 0;

    return {
      totalHours,
      availableHours: Math.max(0, availableHours),
      utilizationRate: Math.round(utilizationRate),
      focusHoursPerDay: Math.round(focusHoursPerDay * 10) / 10,
    };
  }

  /**
   * Generate risk assessment score
   */
  assessRisk(
    impact: 'low' | 'medium' | 'high' | 'critical',
    probability: 'low' | 'medium' | 'high' | 'very_high'
  ): {
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    action: string;
    escalationRequired: boolean;
  } {
    const impactScores = { low: 1, medium: 2, high: 3, critical: 4 };
    const probabilityScores = { low: 1, medium: 2, high: 3, very_high: 4 };

    const score = impactScores[impact] * probabilityScores[probability];

    let level: 'low' | 'medium' | 'high' | 'critical';
    let action: string;
    let escalationRequired: boolean;

    if (score <= 3) {
      level = 'low';
      action = 'Monitor and document';
      escalationRequired = false;
    } else if (score <= 6) {
      level = 'medium';
      action = 'Develop mitigation plan';
      escalationRequired = false;
    } else if (score <= 12) {
      level = 'high';
      action = 'Immediate mitigation required';
      escalationRequired = true;
    } else {
      level = 'critical';
      action = 'Executive escalation and immediate action';
      escalationRequired = true;
    }

    return { score, level, action, escalationRequired };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private getDefaultSprintDays(): number {
    return 10; // 2-week sprint
  }

  private categorizeQuestion(questionText: string): ClarifyingQuestion['category'] {
    const text = questionText.toLowerCase();

    if (text.includes('how often') || text.includes('frequency') || text.includes('duration')) {
      return 'frequency';
    }
    if (text.includes('who') || text.includes('team') || text.includes('stakeholder')) {
      return 'audience';
    }
    if (text.includes('format') || text.includes('template')) {
      return 'format';
    }
    if (text.includes('platform') || text.includes('tool') || text.includes('software')) {
      return 'platform';
    }
    if (text.includes('region') || text.includes('holiday') || text.includes('work week')) {
      return 'region';
    }

    return 'integration';
  }

  private generateOptionsForQuestion(questionText: string, _pattern: string): QuestionOption[] {
    const text = questionText.toLowerCase();

    // Methodology question
    if (text.includes('methodology')) {
      return [
        { value: 'agile', label: 'Agile', description: 'Iterative, flexible approach' },
        { value: 'scrum', label: 'Scrum', description: 'Sprint-based Agile framework' },
        { value: 'kanban', label: 'Kanban', description: 'Flow-based continuous delivery' },
        { value: 'waterfall', label: 'Waterfall', description: 'Sequential phases' },
        { value: 'hybrid', label: 'Hybrid', description: 'Mix of approaches' },
      ];
    }

    // Sprint duration
    if (text.includes('sprint duration') || text.includes('sprint length')) {
      return [
        { value: '1_week', label: '1 Week', description: 'Fast feedback cycles' },
        { value: '2_weeks', label: '2 Weeks', description: 'Most common sprint length' },
        { value: '3_weeks', label: '3 Weeks', description: 'Balanced duration' },
        { value: '4_weeks', label: '4 Weeks', description: 'Larger increments' },
      ];
    }

    // Estimation approach
    if (text.includes('estimate') || text.includes('story points')) {
      return [
        { value: 'story_points', label: 'Story Points', description: 'Relative estimation' },
        { value: 'hours', label: 'Hours', description: 'Time-based estimation' },
        { value: 't_shirt', label: 'T-Shirt Sizes', description: 'S/M/L/XL sizing' },
        { value: 'no_estimates', label: 'No Estimates', description: '#NoEstimates approach' },
      ];
    }

    // Reporting frequency
    if (text.includes('reporting') || text.includes('how often')) {
      return [
        { value: 'daily', label: 'Daily', description: 'Daily status updates' },
        { value: 'weekly', label: 'Weekly', description: 'Weekly status reports' },
        { value: 'bi_weekly', label: 'Bi-weekly', description: 'Every two weeks' },
        { value: 'monthly', label: 'Monthly', description: 'Monthly summaries' },
      ];
    }

    // Stakeholders
    if (text.includes('stakeholder') || text.includes('decision maker')) {
      return [
        { value: 'executive', label: 'Executive Sponsors', description: 'C-level stakeholders' },
        { value: 'product_owner', label: 'Product Owner', description: 'Product decisions' },
        { value: 'team_leads', label: 'Team Leads', description: 'Technical leadership' },
        { value: 'all', label: 'All Stakeholders', description: 'Broad stakeholder group' },
      ];
    }

    // Format preferences
    if (text.includes('format') || text.includes('report')) {
      return [
        { value: 'dashboard', label: 'Dashboard', description: 'Real-time dashboard' },
        { value: 'deck', label: 'Slide Deck', description: 'PowerPoint/Slides' },
        { value: 'document', label: 'Document', description: 'Written report' },
        { value: 'email', label: 'Email Summary', description: 'Email digest' },
      ];
    }

    // Retrospective format
    if (text.includes('retrospective format')) {
      return [
        { value: 'start_stop_continue', label: 'Start/Stop/Continue', description: 'Simple three-column format' },
        { value: '4ls', label: '4Ls', description: 'Liked, Learned, Lacked, Longed For' },
        { value: 'sailboat', label: 'Sailboat', description: 'Visual metaphor with wind and anchors' },
        { value: 'mad_sad_glad', label: 'Mad/Sad/Glad', description: 'Emotion-based reflection' },
      ];
    }

    // Default yes/no options
    return [
      { value: 'yes', label: 'Yes', description: 'Enable this feature' },
      { value: 'no', label: 'No', description: 'Skip this feature' },
    ];
  }

  private humanizeStepName(stepName: string): string {
    const mapping: Record<string, string> = {
      // Project Kickoff
      define_vision_goals: 'Define project vision and goals',
      identify_stakeholders: 'Identify and map stakeholders',
      document_scope: 'Document project scope and boundaries',
      setup_timeline: 'Set up project timeline and milestones',
      assign_team: 'Assign team members and roles',
      create_project_charter: 'Create project charter document',
      kickoff_meeting: 'Conduct kickoff meeting',
      distribute_charter: 'Distribute charter to stakeholders',

      // Sprint Planning
      review_backlog: 'Review and prioritize product backlog',
      calculate_capacity: 'Calculate team capacity for sprint',
      estimate_stories: 'Estimate stories and tasks',
      select_sprint_items: 'Select items for sprint backlog',
      define_sprint_goal: 'Define sprint goal',
      break_down_tasks: 'Break down stories into tasks',
      commit_sprint_scope: 'Commit to sprint scope',
      notify_team: 'Notify team of sprint plan',

      // Task Assignment
      identify_tasks: 'Identify tasks to be assigned',
      assess_skills_required: 'Assess skills required for tasks',
      check_team_availability: 'Check team member availability',
      match_skills_to_tasks: 'Match skills to tasks',
      assign_tasks: 'Assign tasks to team members',
      set_due_dates: 'Set due dates and priorities',
      notify_assignees: 'Notify assignees of new tasks',
      update_board: 'Update task board',

      // Status Reporting
      collect_metrics_data: 'Collect metrics from project tools',
      gather_updates: 'Gather status updates from team',
      identify_risks_issues: 'Identify risks and issues',
      calculate_progress: 'Calculate overall progress',
      generate_report: 'Generate status report',
      review_report: 'Review report for accuracy',
      distribute_report: 'Distribute report to stakeholders',
      archive_report: 'Archive report for records',

      // Risk Escalation
      identify_risk: 'Identify potential risk',
      assess_impact_probability: 'Assess impact and probability',
      categorize_risk: 'Categorize risk by type',
      determine_escalation_path: 'Determine escalation path',
      document_risk: 'Document risk in register',
      notify_stakeholders: 'Notify appropriate stakeholders',
      track_mitigation: 'Track mitigation actions',
      update_risk_register: 'Update risk register status',

      // Change Request
      submit_change_request: 'Submit change request',
      assess_impact: 'Assess change impact',
      estimate_effort: 'Estimate implementation effort',
      review_with_stakeholders: 'Review with Change Advisory Board',
      approve_or_reject: 'Approve or reject change',
      update_scope: 'Update project scope baseline',
      communicate_decision: 'Communicate decision to team',
      track_implementation: 'Track change implementation',

      // Resource Allocation
      identify_resource_needs: 'Identify resource requirements',
      assess_current_allocation: 'Assess current allocations',
      check_availability: 'Check resource availability',
      optimize_allocation: 'Optimize resource allocation',
      handle_conflicts: 'Handle allocation conflicts',
      allocate_resources: 'Allocate resources to projects',
      notify_managers: 'Notify resource managers',
      track_utilization: 'Track utilization rates',

      // Milestone Tracking
      define_milestones: 'Define project milestones',
      set_target_dates: 'Set target dates',
      track_progress: 'Track milestone progress',
      calculate_variance: 'Calculate schedule variance',
      generate_alerts: 'Generate slippage alerts',
      update_dashboard: 'Update milestone dashboard',
      document_completion: 'Document milestone completion',

      // Project Closure
      verify_deliverables: 'Verify all deliverables complete',
      obtain_acceptance: 'Obtain stakeholder acceptance',
      handoff_documentation: 'Handoff project documentation',
      release_resources: 'Release project resources',
      close_contracts: 'Close vendor contracts',
      archive_project: 'Archive project files',
      conduct_celebration: 'Conduct team celebration',
      distribute_closure_report: 'Distribute closure report',

      // Retrospective
      schedule_retrospective: 'Schedule retrospective meeting',
      collect_feedback: 'Collect anonymous feedback',
      facilitate_discussion: 'Facilitate team discussion',
      identify_improvements: 'Identify improvement opportunities',
      prioritize_actions: 'Prioritize action items',
      assign_action_items: 'Assign action item owners',
      track_retro_progress: 'Track improvement progress',
      share_learnings: 'Share learnings across organization',
    };

    return mapping[stepName] || stepName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}

// ============================================================================
// EXPORTS - HELPER FUNCTIONS
// ============================================================================

export default ProjectManagementDomainIntelligence;

/**
 * Create a new Project Management Intelligence instance
 */
export function createProjectManagementIntelligence(
  region: string = 'global',
  methodology: string = 'agile'
): ProjectManagementDomainIntelligence {
  return new ProjectManagementDomainIntelligence(region, methodology);
}

/**
 * Detect project management workflow pattern from request
 */
export function detectProjectManagementWorkflow(request: string): string | null {
  const intelligence = new ProjectManagementDomainIntelligence();
  return intelligence.detectProjectManagementPattern(request);
}

/**
 * Analyze a project management request and return comprehensive analysis
 */
export function analyzeProjectManagementRequest(
  request: string,
  region: string = 'global'
): ProjectManagementAnalysisResult {
  const intelligence = new ProjectManagementDomainIntelligence(region);
  const pattern = intelligence.detectProjectManagementPattern(request);

  // Detect methodology from request
  const methodologyKeywords: Record<string, string[]> = {
    scrum: ['scrum', 'sprint', 'daily standup', 'sprint review'],
    kanban: ['kanban', 'wip', 'flow', 'pull'],
    waterfall: ['waterfall', 'phase', 'gate', 'sequential'],
    hybrid: ['hybrid', 'mix', 'combined'],
  };

  let methodology: string | null = null;
  const normalizedRequest = request.toLowerCase();
  for (const [method, keywords] of Object.entries(methodologyKeywords)) {
    if (keywords.some(kw => normalizedRequest.includes(kw))) {
      methodology = method;
      break;
    }
  }

  // Determine complexity
  let complexity: 'simple' | 'moderate' | 'complex' = 'moderate';
  const complexPatterns = ['project_kickoff', 'resource_allocation', 'change_request'];
  const simplePatterns = ['task_assignment', 'status_reporting'];

  if (pattern && complexPatterns.includes(pattern)) {
    complexity = 'complex';
  } else if (pattern && simplePatterns.includes(pattern)) {
    complexity = 'simple';
  }

  // Get estimated duration
  const patternDef = pattern ? PROJECT_MANAGEMENT_WORKFLOW_PATTERNS[pattern] : null;
  const estimatedDuration = patternDef?.estimatedDuration || null;

  return {
    pattern,
    requirements: pattern ? intelligence.getImplicitRequirements(pattern) : [],
    tools: pattern ? intelligence.getToolRecommendations(pattern) : [],
    questions: pattern ? intelligence.getClarifyingQuestions(pattern) : [],
    methodology,
    complexity,
    estimatedDuration,
  };
}

/**
 * Calculate sprint metrics
 */
export function calculateSprintMetrics(
  totalPoints: number,
  completedPoints: number,
  sprintDays: number,
  daysRemaining: number
): {
  velocity: VelocityData;
  burndown: BurndownData;
} {
  const intelligence = new ProjectManagementDomainIntelligence();
  const daysElapsed = sprintDays - daysRemaining;

  return {
    velocity: intelligence.calculateVelocity(completedPoints, daysElapsed),
    burndown: intelligence.calculateBurndown(totalPoints, completedPoints, daysRemaining),
  };
}

/**
 * Generate project health score
 */
export function generateProjectHealthScore(
  scheduleVariance: number, // negative = behind schedule
  budgetVariance: number, // negative = over budget
  riskCount: number, // number of open high/critical risks
  teamMorale: number // 1-10 scale
): {
  overallScore: number;
  status: 'green' | 'yellow' | 'red';
  factors: Array<{ name: string; score: number; weight: number }>;
  recommendations: string[];
} {
  // Calculate individual factor scores (0-100)
  const scheduleScore = Math.max(0, Math.min(100, 100 + scheduleVariance * 10));
  const budgetScore = Math.max(0, Math.min(100, 100 + budgetVariance * 10));
  const riskScore = Math.max(0, Math.min(100, 100 - riskCount * 15));
  const moraleScore = teamMorale * 10;

  // Weighted average
  const factors = [
    { name: 'Schedule', score: scheduleScore, weight: 0.30 },
    { name: 'Budget', score: budgetScore, weight: 0.25 },
    { name: 'Risk', score: riskScore, weight: 0.25 },
    { name: 'Team Morale', score: moraleScore, weight: 0.20 },
  ];

  const overallScore = factors.reduce((sum, f) => sum + f.score * f.weight, 0);

  // Determine status
  let status: 'green' | 'yellow' | 'red';
  if (overallScore >= 70) {
    status = 'green';
  } else if (overallScore >= 50) {
    status = 'yellow';
  } else {
    status = 'red';
  }

  // Generate recommendations
  const recommendations: string[] = [];
  if (scheduleScore < 70) {
    recommendations.push('Review scope for potential reduction or timeline extension');
  }
  if (budgetScore < 70) {
    recommendations.push('Conduct budget review and identify cost optimization opportunities');
  }
  if (riskScore < 70) {
    recommendations.push('Escalate high-priority risks and develop mitigation plans');
  }
  if (moraleScore < 70) {
    recommendations.push('Address team concerns and consider workload balancing');
  }

  return {
    overallScore: Math.round(overallScore),
    status,
    factors,
    recommendations,
  };
}
