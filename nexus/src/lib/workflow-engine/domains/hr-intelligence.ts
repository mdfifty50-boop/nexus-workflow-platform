/**
 * Nexus HR Domain Intelligence Module
 *
 * Comprehensive HR workflow patterns, requirements, and intelligence for:
 * - Recruitment & Hiring
 * - Employee Onboarding
 * - Performance Management
 * - Leave Management
 * - Offboarding
 * - Training & Development
 *
 * Includes Kuwait Labor Law compliance and regional considerations.
 */

import type {
  ImplicitRequirement,
  ClarifyingQuestion,
  ToolRecommendation,
} from '../workflow-intelligence';

// ============================================================================
// HR-SPECIFIC TYPES
// ============================================================================

export interface HRWorkflowPattern {
  id: string;
  name: string;
  description: string;
  stages: HRWorkflowStage[];
  implicitNeeds: string[];
  complianceRequirements: string[];
  typicalDuration: string;
  stakeholders: string[];
}

export interface HRWorkflowStage {
  order: number;
  name: string;
  description: string;
  requiredCapabilities: string[];
  automationPotential: 'high' | 'medium' | 'low';
  typicalTools: string[];
}

export interface HRRegionalRequirement {
  region: string;
  category: string;
  requirement: string;
  legalReference: string;
  automationSupport: boolean;
  details: string;
}

export interface HRToolRecommendation extends ToolRecommendation {
  hrCategory: string;
  companySize: ('small' | 'medium' | 'large')[];
  kuwaitCompliant: boolean;
  arabicSupport: boolean;
  pricingTier: 'free' | 'starter' | 'professional' | 'enterprise';
}

// ============================================================================
// HR WORKFLOW PATTERNS
// ============================================================================

export const HR_WORKFLOW_PATTERNS: Record<string, HRWorkflowPattern> = {
  recruitment: {
    id: 'recruitment',
    name: 'Recruitment Pipeline',
    description: 'End-to-end hiring process from job posting to offer acceptance',
    stages: [
      {
        order: 1,
        name: 'Job Posting',
        description: 'Create and distribute job listings across platforms',
        requiredCapabilities: ['job_posting', 'multi_platform_distribution', 'employer_branding'],
        automationPotential: 'high',
        typicalTools: ['LinkedIn', 'Indeed', 'Bayt.com', 'GulfTalent', 'Greenhouse', 'Lever'],
      },
      {
        order: 2,
        name: 'Application Screening',
        description: 'Review resumes and filter candidates based on criteria',
        requiredCapabilities: ['resume_parsing', 'keyword_matching', 'scoring', 'bulk_processing'],
        automationPotential: 'high',
        typicalTools: ['Greenhouse', 'Lever', 'Workday', 'AI Resume Screeners'],
      },
      {
        order: 3,
        name: 'Interview Scheduling',
        description: 'Coordinate interviews with candidates and hiring managers',
        requiredCapabilities: ['calendar_integration', 'availability_matching', 'reminder_system'],
        automationPotential: 'high',
        typicalTools: ['Calendly', 'GoodTime', 'Google Calendar', 'Outlook'],
      },
      {
        order: 4,
        name: 'Offer Generation',
        description: 'Create and send offer letters with compensation details',
        requiredCapabilities: ['document_generation', 'esignature', 'compensation_calculation'],
        automationPotential: 'medium',
        typicalTools: ['DocuSign', 'HelloSign', 'Greenhouse Offers', 'PandaDoc'],
      },
      {
        order: 5,
        name: 'Onboarding Handoff',
        description: 'Transfer hired candidate to onboarding process',
        requiredCapabilities: ['data_transfer', 'task_assignment', 'notification'],
        automationPotential: 'high',
        typicalTools: ['BambooHR', 'Workday', 'Rippling', 'Gusto'],
      },
    ],
    implicitNeeds: [
      'Applicant tracking system',
      'Calendar scheduling integration',
      'Offer letter templates',
      'Background check service',
      'Reference check tracking',
      'Candidate communication system',
      'Interview feedback collection',
      'Compensation benchmarking data',
    ],
    complianceRequirements: [
      'Equal opportunity employment',
      'Data privacy for candidate information',
      'Work authorization verification',
      'Kuwaitization quota tracking (Kuwait)',
    ],
    typicalDuration: '2-8 weeks',
    stakeholders: ['HR Manager', 'Hiring Manager', 'Recruiter', 'Interview Panel'],
  },

  onboarding: {
    id: 'onboarding',
    name: 'Employee Onboarding',
    description: 'New hire integration from day one to full productivity',
    stages: [
      {
        order: 1,
        name: 'Document Collection',
        description: 'Gather required employment documents and information',
        requiredCapabilities: ['form_generation', 'document_upload', 'verification'],
        automationPotential: 'high',
        typicalTools: ['BambooHR', 'Workday', 'DocuSign', 'Jotform'],
      },
      {
        order: 2,
        name: 'System Provisioning',
        description: 'Set up accounts, access, and equipment for new employee',
        requiredCapabilities: ['identity_management', 'access_provisioning', 'asset_tracking'],
        automationPotential: 'high',
        typicalTools: ['Okta', 'Azure AD', 'Google Workspace Admin', 'Rippling'],
      },
      {
        order: 3,
        name: 'Training Assignment',
        description: 'Assign required training modules and compliance courses',
        requiredCapabilities: ['lms_integration', 'course_assignment', 'progress_tracking'],
        automationPotential: 'high',
        typicalTools: ['Lessonly', 'TalentLMS', 'Cornerstone', 'LinkedIn Learning'],
      },
      {
        order: 4,
        name: 'Buddy Assignment',
        description: 'Match new hire with mentor or buddy for guidance',
        requiredCapabilities: ['matching_algorithm', 'communication_facilitation'],
        automationPotential: 'medium',
        typicalTools: ['Donut', 'Slack', 'Microsoft Teams', 'BambooHR'],
      },
      {
        order: 5,
        name: 'Check-in Scheduling',
        description: 'Schedule regular check-ins for first 30/60/90 days',
        requiredCapabilities: ['calendar_scheduling', 'reminder_system', 'feedback_collection'],
        automationPotential: 'high',
        typicalTools: ['Lattice', '15Five', 'Culture Amp', 'Google Calendar'],
      },
    ],
    implicitNeeds: [
      'Employee information system',
      'Document storage and management',
      'IT ticket system for provisioning',
      'Training management system',
      'Employee directory',
      'Welcome email templates',
      'First day checklist',
      'Manager notification system',
    ],
    complianceRequirements: [
      'I-9 or equivalent work authorization',
      'Tax form collection',
      'Policy acknowledgment signatures',
      'Safety training certification',
      'Civil ID registration (Kuwait)',
    ],
    typicalDuration: '1-90 days',
    stakeholders: ['HR Manager', 'IT Admin', 'Direct Manager', 'Buddy/Mentor', 'New Employee'],
  },

  performance_management: {
    id: 'performance_management',
    name: 'Performance Management',
    description: 'Continuous performance tracking and review cycle',
    stages: [
      {
        order: 1,
        name: 'Goal Setting',
        description: 'Define and align individual goals with company objectives',
        requiredCapabilities: ['okr_tracking', 'goal_cascade', 'alignment_visualization'],
        automationPotential: 'medium',
        typicalTools: ['Lattice', '15Five', 'Betterworks', 'Workday'],
      },
      {
        order: 2,
        name: 'Continuous Feedback',
        description: 'Enable ongoing feedback between managers and employees',
        requiredCapabilities: ['feedback_collection', 'notification', 'tracking'],
        automationPotential: 'high',
        typicalTools: ['Lattice', '15Five', 'Culture Amp', 'Slack integrations'],
      },
      {
        order: 3,
        name: 'Performance Review',
        description: 'Conduct formal periodic performance evaluations',
        requiredCapabilities: ['review_forms', 'multi_rater_feedback', 'scheduling'],
        automationPotential: 'medium',
        typicalTools: ['Lattice', '15Five', 'BambooHR', 'Workday'],
      },
      {
        order: 4,
        name: 'Rating & Calibration',
        description: 'Calibrate ratings across teams for fairness',
        requiredCapabilities: ['rating_system', 'calibration_sessions', 'analytics'],
        automationPotential: 'low',
        typicalTools: ['Lattice', 'Workday', 'Custom spreadsheets'],
      },
      {
        order: 5,
        name: 'Development Planning',
        description: 'Create individual development plans based on review',
        requiredCapabilities: ['development_tracking', 'learning_recommendations', 'career_pathing'],
        automationPotential: 'medium',
        typicalTools: ['Lattice', 'LinkedIn Learning', 'Cornerstone', 'Degreed'],
      },
    ],
    implicitNeeds: [
      'Goal tracking system',
      'Feedback collection mechanism',
      'Review cycle automation',
      '360-degree feedback capability',
      'Rating calibration tools',
      'Development plan templates',
      'Manager training on feedback',
      'Performance analytics dashboard',
    ],
    complianceRequirements: [
      'Documentation for termination defense',
      'Non-discriminatory evaluation criteria',
      'Consistent rating application',
      'Performance improvement plan process',
    ],
    typicalDuration: 'Annual cycle with quarterly checkpoints',
    stakeholders: ['Employee', 'Direct Manager', 'HR Business Partner', 'Skip-level Manager'],
  },

  leave_management: {
    id: 'leave_management',
    name: 'Leave Management',
    description: 'Handle all types of employee leave requests and tracking',
    stages: [
      {
        order: 1,
        name: 'Leave Request',
        description: 'Employee submits leave request with dates and type',
        requiredCapabilities: ['request_form', 'balance_check', 'policy_validation'],
        automationPotential: 'high',
        typicalTools: ['BambooHR', 'Gusto', 'Workday', 'Timetastic'],
      },
      {
        order: 2,
        name: 'Manager Approval',
        description: 'Manager reviews and approves/rejects leave request',
        requiredCapabilities: ['approval_workflow', 'delegation', 'notification'],
        automationPotential: 'high',
        typicalTools: ['BambooHR', 'Slack', 'Microsoft Teams', 'Email'],
      },
      {
        order: 3,
        name: 'Balance Tracking',
        description: 'Update and track leave balances automatically',
        requiredCapabilities: ['balance_calculation', 'accrual_rules', 'carryover_logic'],
        automationPotential: 'high',
        typicalTools: ['BambooHR', 'Gusto', 'Workday', 'Custom HRIS'],
      },
      {
        order: 4,
        name: 'Team Notification',
        description: 'Notify relevant team members and update calendars',
        requiredCapabilities: ['calendar_sync', 'team_notification', 'coverage_planning'],
        automationPotential: 'high',
        typicalTools: ['Google Calendar', 'Outlook', 'Slack', 'Microsoft Teams'],
      },
    ],
    implicitNeeds: [
      'Leave policy configuration',
      'Balance calculation engine',
      'Approval workflow system',
      'Calendar integration',
      'Payroll system integration',
      'Public holiday calendar',
      'Coverage planning tools',
      'Audit trail for compliance',
    ],
    complianceRequirements: [
      'Statutory leave entitlements',
      'Leave accrual accuracy',
      'Record keeping requirements',
      'Kuwait Labor Law annual leave (30 days)',
      'Sick leave documentation',
    ],
    typicalDuration: 'Minutes to 2 days for approval',
    stakeholders: ['Employee', 'Direct Manager', 'HR Admin', 'Payroll'],
  },

  offboarding: {
    id: 'offboarding',
    name: 'Employee Offboarding',
    description: 'Structured process for employee separation',
    stages: [
      {
        order: 1,
        name: 'Notice Processing',
        description: 'Process resignation or termination notice',
        requiredCapabilities: ['document_processing', 'policy_validation', 'notification'],
        automationPotential: 'medium',
        typicalTools: ['BambooHR', 'Workday', 'DocuSign'],
      },
      {
        order: 2,
        name: 'Knowledge Handover',
        description: 'Facilitate knowledge transfer to remaining team',
        requiredCapabilities: ['task_assignment', 'documentation', 'meeting_scheduling'],
        automationPotential: 'medium',
        typicalTools: ['Notion', 'Confluence', 'Google Docs', 'Asana'],
      },
      {
        order: 3,
        name: 'Clearance Process',
        description: 'Collect assets, revoke access, settle dues',
        requiredCapabilities: ['checklist_tracking', 'asset_management', 'access_revocation'],
        automationPotential: 'high',
        typicalTools: ['BambooHR', 'Okta', 'Azure AD', 'IT ticketing'],
      },
      {
        order: 4,
        name: 'Exit Interview',
        description: 'Conduct exit interview to gather feedback',
        requiredCapabilities: ['survey_generation', 'scheduling', 'data_collection'],
        automationPotential: 'high',
        typicalTools: ['SurveyMonkey', 'Typeform', 'Culture Amp', 'BambooHR'],
      },
      {
        order: 5,
        name: 'Alumni Network',
        description: 'Add to alumni network and maintain relationship',
        requiredCapabilities: ['contact_management', 'communication', 'referral_tracking'],
        automationPotential: 'medium',
        typicalTools: ['LinkedIn', 'Mailchimp', 'Custom CRM', 'Slack alumni channel'],
      },
    ],
    implicitNeeds: [
      'Offboarding checklist',
      'Asset tracking system',
      'Access revocation automation',
      'Final pay calculation',
      'End of service benefit calculation (Kuwait)',
      'Exit interview scheduling',
      'Reference letter generation',
      'Clearance certificate issuance',
    ],
    complianceRequirements: [
      'Final pay within legal timeframe',
      'End of service gratuity (Kuwait)',
      'Certificate of employment',
      'Visa cancellation (expats in Kuwait)',
      'GOSI/PASI deregistration',
    ],
    typicalDuration: '2-4 weeks (notice period)',
    stakeholders: ['HR Manager', 'Direct Manager', 'IT Admin', 'Finance', 'Departing Employee'],
  },

  training_development: {
    id: 'training_development',
    name: 'Training & Development',
    description: 'Employee skill development and training management',
    stages: [
      {
        order: 1,
        name: 'Training Needs Identification',
        description: 'Identify skill gaps and training requirements',
        requiredCapabilities: ['skill_assessment', 'gap_analysis', 'competency_mapping'],
        automationPotential: 'medium',
        typicalTools: ['Lattice', 'LinkedIn Learning', 'Skills mapping tools'],
      },
      {
        order: 2,
        name: 'Training Assignment',
        description: 'Assign relevant courses and learning paths',
        requiredCapabilities: ['course_catalog', 'assignment_engine', 'personalization'],
        automationPotential: 'high',
        typicalTools: ['LinkedIn Learning', 'Udemy Business', 'Coursera', 'TalentLMS'],
      },
      {
        order: 3,
        name: 'Progress Tracking',
        description: 'Monitor completion and engagement with training',
        requiredCapabilities: ['progress_tracking', 'reminder_system', 'reporting'],
        automationPotential: 'high',
        typicalTools: ['LMS platforms', 'LinkedIn Learning Admin', 'Custom dashboards'],
      },
      {
        order: 4,
        name: 'Certification Management',
        description: 'Track certifications and renewals',
        requiredCapabilities: ['certification_tracking', 'expiry_alerts', 'verification'],
        automationPotential: 'high',
        typicalTools: ['BambooHR', 'Workday', 'Certemy', 'Custom tracking'],
      },
    ],
    implicitNeeds: [
      'Learning management system',
      'Course content library',
      'Skill assessment tools',
      'Certification tracking',
      'Budget tracking for training',
      'Manager approval workflow',
      'Training calendar',
      'ROI measurement',
    ],
    complianceRequirements: [
      'Mandatory compliance training',
      'Safety certifications',
      'Professional license renewals',
      'Documentation for audit',
    ],
    typicalDuration: 'Ongoing',
    stakeholders: ['Employee', 'Manager', 'L&D Team', 'HR'],
  },
};

// ============================================================================
// HR DETECTION KEYWORDS
// ============================================================================

export const HR_KEYWORDS: Record<string, string[]> = {
  recruitment: [
    'recruit', 'recruiting', 'recruitment', 'hire', 'hiring', 'job posting',
    'job post', 'vacancy', 'vacancies', 'candidate', 'candidates', 'applicant',
    'applicants', 'resume', 'cv', 'interview', 'interviews', 'offer letter',
    'background check', 'reference check', 'talent acquisition', 'headhunting',
    'screening', 'shortlist', 'job board', 'ats', 'applicant tracking',
  ],
  onboarding: [
    'onboard', 'onboarding', 'new hire', 'new employee', 'new joiner',
    'first day', 'orientation', 'induction', 'welcome', 'joining',
    'new starter', 'probation', 'training', 'buddy', 'mentor',
    'provisioning', 'access setup', 'account creation', 'equipment',
  ],
  performance_management: [
    'performance', 'review', 'appraisal', 'evaluation', 'feedback',
    'goal', 'goals', 'okr', 'okrs', 'kpi', 'kpis', 'rating',
    '360', 'calibration', 'development', 'improvement', 'pip',
    'performance improvement', 'career', 'promotion', 'raise',
  ],
  leave_management: [
    'leave', 'vacation', 'pto', 'time off', 'sick', 'sick leave',
    'annual leave', 'holiday', 'holidays', 'absence', 'absent',
    'maternity', 'paternity', 'sabbatical', 'bereavement',
    'leave balance', 'accrual', 'approval', 'time away',
  ],
  offboarding: [
    'offboard', 'offboarding', 'resign', 'resignation', 'termination',
    'terminate', 'exit', 'leaving', 'departure', 'last day',
    'final pay', 'clearance', 'handover', 'end of service',
    'severance', 'alumni', 'exit interview', 'notice period',
  ],
  training_development: [
    'training', 'development', 'learning', 'course', 'courses',
    'certification', 'certificate', 'skill', 'skills', 'upskill',
    'reskill', 'workshop', 'webinar', 'e-learning', 'lms',
    'competency', 'capability', 'professional development',
  ],
};

// ============================================================================
// HR IMPLICIT REQUIREMENTS
// ============================================================================

export const HR_IMPLICIT_REQUIREMENTS: Record<string, ImplicitRequirement[]> = {
  recruitment: [
    {
      category: 'system',
      description: 'Applicant Tracking System (ATS)',
      reason: 'Central system to manage all candidates through the hiring pipeline',
      priority: 'critical',
      suggestedTools: ['Greenhouse', 'Lever', 'Workday Recruiting', 'BambooHR'],
    },
    {
      category: 'scheduling',
      description: 'Calendar scheduling integration',
      reason: 'Automated interview scheduling reduces coordination overhead by 80%',
      priority: 'critical',
      suggestedTools: ['Calendly', 'GoodTime', 'Google Calendar', 'Outlook'],
    },
    {
      category: 'documents',
      description: 'Offer letter templates and e-signature',
      reason: 'Standardized offers ensure compliance and speed up acceptance',
      priority: 'important',
      suggestedTools: ['DocuSign', 'HelloSign', 'PandaDoc', 'Greenhouse Offers'],
    },
    {
      category: 'verification',
      description: 'Background check service integration',
      reason: 'Required for due diligence on final candidates',
      priority: 'important',
      suggestedTools: ['Checkr', 'GoodHire', 'Sterling', 'HireRight'],
    },
    {
      category: 'communication',
      description: 'Candidate communication automation',
      reason: 'Timely updates improve candidate experience and employer brand',
      priority: 'important',
      suggestedTools: ['Greenhouse', 'Lever', 'Gmail templates', 'Gem'],
    },
    {
      category: 'analytics',
      description: 'Recruitment analytics and reporting',
      reason: 'Track time-to-hire, cost-per-hire, and source effectiveness',
      priority: 'optional',
      suggestedTools: ['Greenhouse Analytics', 'LinkedIn Talent Insights', 'Custom dashboards'],
    },
  ],

  onboarding: [
    {
      category: 'documents',
      description: 'Document collection and storage system',
      reason: 'Collect and securely store employment documents digitally',
      priority: 'critical',
      suggestedTools: ['BambooHR', 'Workday', 'DocuSign', 'Google Drive'],
    },
    {
      category: 'access',
      description: 'System provisioning automation',
      reason: 'New employees need Day 1 access to email, tools, and systems',
      priority: 'critical',
      suggestedTools: ['Okta', 'Azure AD', 'Rippling', 'Google Workspace Admin'],
    },
    {
      category: 'learning',
      description: 'Training assignment and tracking',
      reason: 'Ensure compliance training and role-specific learning is completed',
      priority: 'important',
      suggestedTools: ['TalentLMS', 'Lessonly', 'LinkedIn Learning', 'Cornerstone'],
    },
    {
      category: 'integration',
      description: 'Buddy/mentor matching system',
      reason: 'Buddy programs improve new hire retention by 25%',
      priority: 'important',
      suggestedTools: ['Donut', 'Slack', 'BambooHR', 'Manual matching'],
    },
    {
      category: 'communication',
      description: 'Welcome email and checklist automation',
      reason: 'Structured onboarding ensures nothing falls through the cracks',
      priority: 'important',
      suggestedTools: ['BambooHR', 'Notion', 'Trello', 'Asana'],
    },
    {
      category: 'scheduling',
      description: '30/60/90 day check-in scheduling',
      reason: 'Regular touchpoints identify and address issues early',
      priority: 'optional',
      suggestedTools: ['Google Calendar', 'Lattice', '15Five', 'Calendly'],
    },
  ],

  performance_management: [
    {
      category: 'goals',
      description: 'Goal tracking and OKR system',
      reason: 'Align individual goals with company objectives for clarity',
      priority: 'critical',
      suggestedTools: ['Lattice', '15Five', 'Betterworks', 'Workday'],
    },
    {
      category: 'feedback',
      description: '360-degree feedback capability',
      reason: 'Multi-source feedback provides comprehensive performance view',
      priority: 'important',
      suggestedTools: ['Lattice', 'Culture Amp', '15Five', 'SurveyMonkey'],
    },
    {
      category: 'calibration',
      description: 'Rating calibration and analytics',
      reason: 'Ensure fair and consistent ratings across teams',
      priority: 'important',
      suggestedTools: ['Lattice', 'Workday', 'Custom spreadsheets'],
    },
    {
      category: 'development',
      description: 'Individual development plan templates',
      reason: 'Structured development plans increase employee growth',
      priority: 'important',
      suggestedTools: ['Lattice', 'LinkedIn Learning', 'Cornerstone'],
    },
    {
      category: 'documentation',
      description: 'Performance documentation for compliance',
      reason: 'Written records protect against wrongful termination claims',
      priority: 'critical',
      suggestedTools: ['BambooHR', 'Workday', 'HRIS systems'],
    },
  ],

  leave_management: [
    {
      category: 'calculation',
      description: 'Leave balance calculation engine',
      reason: 'Accurate accruals and balance tracking per policy',
      priority: 'critical',
      suggestedTools: ['BambooHR', 'Gusto', 'Workday', 'Custom HRIS'],
    },
    {
      category: 'workflow',
      description: 'Approval chain and workflow',
      reason: 'Multi-level approval for certain leave types',
      priority: 'critical',
      suggestedTools: ['BambooHR', 'Slack workflows', 'Microsoft Power Automate'],
    },
    {
      category: 'calendar',
      description: 'Calendar blocking and sync',
      reason: 'Approved leave automatically reflects on team calendars',
      priority: 'important',
      suggestedTools: ['Google Calendar', 'Outlook', 'Slack status'],
    },
    {
      category: 'policy',
      description: 'Leave policy configuration',
      reason: 'Different policies for different employee types and regions',
      priority: 'critical',
      suggestedTools: ['BambooHR', 'Gusto', 'Workday'],
    },
    {
      category: 'payroll',
      description: 'Payroll integration for leave deductions',
      reason: 'Unpaid leave must reflect in payroll calculations',
      priority: 'important',
      suggestedTools: ['Gusto', 'ADP', 'Payroll systems'],
    },
  ],

  offboarding: [
    {
      category: 'checklist',
      description: 'Offboarding checklist automation',
      reason: 'Ensure nothing is missed during employee separation',
      priority: 'critical',
      suggestedTools: ['BambooHR', 'Notion', 'Trello', 'Asana'],
    },
    {
      category: 'access',
      description: 'Access revocation automation',
      reason: 'Immediately revoke system access on termination',
      priority: 'critical',
      suggestedTools: ['Okta', 'Azure AD', 'Google Workspace Admin', 'IT ticket system'],
    },
    {
      category: 'assets',
      description: 'Asset return tracking',
      reason: 'Track company equipment return',
      priority: 'important',
      suggestedTools: ['Asset management systems', 'Spreadsheets', 'BambooHR'],
    },
    {
      category: 'calculation',
      description: 'End of service benefit calculation (Kuwait)',
      reason: 'Calculate gratuity per Kuwait Labor Law',
      priority: 'critical',
      suggestedTools: ['Custom calculators', 'Payroll systems', 'HRIS'],
    },
    {
      category: 'feedback',
      description: 'Exit interview scheduling and survey',
      reason: 'Gather insights to improve retention',
      priority: 'important',
      suggestedTools: ['SurveyMonkey', 'Typeform', 'Culture Amp', 'BambooHR'],
    },
    {
      category: 'documents',
      description: 'Clearance certificate generation',
      reason: 'Required document for employee to prove no dues',
      priority: 'critical',
      suggestedTools: ['Document templates', 'DocuSign', 'HRIS'],
    },
  ],

  training_development: [
    {
      category: 'assessment',
      description: 'Skill gap assessment tools',
      reason: 'Identify what training is actually needed',
      priority: 'important',
      suggestedTools: ['Lattice', 'LinkedIn Skills', 'Custom assessments'],
    },
    {
      category: 'content',
      description: 'Learning content library',
      reason: 'Access to quality training content',
      priority: 'critical',
      suggestedTools: ['LinkedIn Learning', 'Udemy Business', 'Coursera', 'Skillshare'],
    },
    {
      category: 'tracking',
      description: 'Learning progress tracking',
      reason: 'Monitor completion rates and engagement',
      priority: 'important',
      suggestedTools: ['LMS platforms', 'Custom dashboards'],
    },
    {
      category: 'certification',
      description: 'Certification tracking and renewal alerts',
      reason: 'Ensure certifications dont lapse',
      priority: 'important',
      suggestedTools: ['BambooHR', 'Certemy', 'Custom tracking'],
    },
    {
      category: 'budget',
      description: 'Training budget tracking',
      reason: 'Track spend per employee and department',
      priority: 'optional',
      suggestedTools: ['Excel', 'Finance systems', 'HRIS'],
    },
  ],
};

// ============================================================================
// HR TOOL RECOMMENDATIONS
// ============================================================================

export const HR_TOOL_RECOMMENDATIONS: Record<string, HRToolRecommendation[]> = {
  hris: [
    {
      toolSlug: 'BAMBOOHR',
      toolName: 'BambooHR',
      score: 95,
      reasons: [
        'Complete HRIS with excellent UX',
        'Strong onboarding and offboarding workflows',
        'Good reporting and analytics',
        'Self-service employee portal',
      ],
      regionalFit: 85,
      alternatives: [
        {
          toolSlug: 'GUSTO',
          toolName: 'Gusto',
          reason: 'Better for US payroll integration',
          tradeoff: 'Less international support',
        },
        {
          toolSlug: 'RIPPLING',
          toolName: 'Rippling',
          reason: 'Better IT integration',
          tradeoff: 'More complex setup',
        },
      ],
      hrCategory: 'HRIS',
      companySize: ['small', 'medium'],
      kuwaitCompliant: true,
      arabicSupport: false,
      pricingTier: 'professional',
    },
    {
      toolSlug: 'WORKDAY',
      toolName: 'Workday',
      score: 90,
      reasons: [
        'Enterprise-grade HCM suite',
        'Strong analytics and reporting',
        'Global compliance support',
        'Robust security features',
      ],
      regionalFit: 90,
      alternatives: [
        {
          toolSlug: 'SAP_SUCCESSFACTORS',
          toolName: 'SAP SuccessFactors',
          reason: 'Strong in MENA region',
          tradeoff: 'Steeper learning curve',
        },
      ],
      hrCategory: 'HRIS',
      companySize: ['large'],
      kuwaitCompliant: true,
      arabicSupport: true,
      pricingTier: 'enterprise',
    },
    {
      toolSlug: 'GUSTO',
      toolName: 'Gusto',
      score: 88,
      reasons: [
        'Excellent for small businesses',
        'Easy payroll processing',
        'Good benefits administration',
        'Affordable pricing',
      ],
      regionalFit: 60,
      alternatives: [],
      hrCategory: 'HRIS',
      companySize: ['small'],
      kuwaitCompliant: false,
      arabicSupport: false,
      pricingTier: 'starter',
    },
  ],

  ats: [
    {
      toolSlug: 'GREENHOUSE',
      toolName: 'Greenhouse',
      score: 96,
      reasons: [
        'Industry-leading ATS',
        'Structured hiring process',
        'Extensive integrations',
        'Great candidate experience',
      ],
      regionalFit: 80,
      alternatives: [
        {
          toolSlug: 'LEVER',
          toolName: 'Lever',
          reason: 'Better CRM functionality',
          tradeoff: 'Less structured approach',
        },
      ],
      hrCategory: 'ATS',
      companySize: ['medium', 'large'],
      kuwaitCompliant: true,
      arabicSupport: false,
      pricingTier: 'professional',
    },
    {
      toolSlug: 'LEVER',
      toolName: 'Lever',
      score: 92,
      reasons: [
        'Combined ATS and CRM',
        'Excellent sourcing tools',
        'Good analytics',
        'Clean UI',
      ],
      regionalFit: 80,
      alternatives: [],
      hrCategory: 'ATS',
      companySize: ['small', 'medium'],
      kuwaitCompliant: true,
      arabicSupport: false,
      pricingTier: 'professional',
    },
  ],

  performance: [
    {
      toolSlug: 'LATTICE',
      toolName: 'Lattice',
      score: 95,
      reasons: [
        'Complete performance management',
        'OKR tracking built-in',
        'Continuous feedback features',
        'Engagement surveys included',
      ],
      regionalFit: 85,
      alternatives: [
        {
          toolSlug: '15FIVE',
          toolName: '15Five',
          reason: 'Simpler setup',
          tradeoff: 'Less customizable',
        },
      ],
      hrCategory: 'Performance',
      companySize: ['small', 'medium', 'large'],
      kuwaitCompliant: true,
      arabicSupport: false,
      pricingTier: 'professional',
    },
    {
      toolSlug: '15FIVE',
      toolName: '15Five',
      score: 90,
      reasons: [
        'Easy weekly check-ins',
        'Good 1-on-1 meeting tools',
        'Recognition features',
        'Simple goal tracking',
      ],
      regionalFit: 85,
      alternatives: [],
      hrCategory: 'Performance',
      companySize: ['small', 'medium'],
      kuwaitCompliant: true,
      arabicSupport: false,
      pricingTier: 'starter',
    },
    {
      toolSlug: 'CULTURE_AMP',
      toolName: 'Culture Amp',
      score: 88,
      reasons: [
        'Excellent engagement surveys',
        'Strong analytics',
        'Science-backed approach',
        'Good benchmarking data',
      ],
      regionalFit: 75,
      alternatives: [],
      hrCategory: 'Performance',
      companySize: ['medium', 'large'],
      kuwaitCompliant: true,
      arabicSupport: false,
      pricingTier: 'professional',
    },
  ],

  learning: [
    {
      toolSlug: 'LINKEDIN_LEARNING',
      toolName: 'LinkedIn Learning',
      score: 92,
      reasons: [
        'Vast content library',
        'Professional skills focus',
        'Certificate programs',
        'LinkedIn integration',
      ],
      regionalFit: 90,
      alternatives: [
        {
          toolSlug: 'UDEMY_BUSINESS',
          toolName: 'Udemy Business',
          reason: 'More diverse content',
          tradeoff: 'Variable quality',
        },
      ],
      hrCategory: 'Learning',
      companySize: ['small', 'medium', 'large'],
      kuwaitCompliant: true,
      arabicSupport: true,
      pricingTier: 'professional',
    },
    {
      toolSlug: 'TALENTLMS',
      toolName: 'TalentLMS',
      score: 88,
      reasons: [
        'Easy to set up',
        'Good for custom content',
        'Affordable pricing',
        'SCORM compliant',
      ],
      regionalFit: 85,
      alternatives: [],
      hrCategory: 'Learning',
      companySize: ['small', 'medium'],
      kuwaitCompliant: true,
      arabicSupport: true,
      pricingTier: 'starter',
    },
  ],

  regional_kuwait: [
    {
      toolSlug: 'BAYT_RECRUITING',
      toolName: 'Bayt.com',
      score: 90,
      reasons: [
        'Leading MENA job board',
        'Strong Kuwait presence',
        'Arabic and English support',
        'Local candidate database',
      ],
      regionalFit: 100,
      alternatives: [
        {
          toolSlug: 'GULFTALENT',
          toolName: 'GulfTalent',
          reason: 'Strong in Gulf region',
          tradeoff: 'Smaller database than Bayt',
        },
      ],
      hrCategory: 'Recruitment',
      companySize: ['small', 'medium', 'large'],
      kuwaitCompliant: true,
      arabicSupport: true,
      pricingTier: 'professional',
    },
    {
      toolSlug: 'GULFTALENT',
      toolName: 'GulfTalent',
      score: 85,
      reasons: [
        'Gulf-focused job board',
        'Quality candidates',
        'Good employer branding',
        'Regional expertise',
      ],
      regionalFit: 95,
      alternatives: [],
      hrCategory: 'Recruitment',
      companySize: ['small', 'medium', 'large'],
      kuwaitCompliant: true,
      arabicSupport: true,
      pricingTier: 'professional',
    },
  ],
};

// ============================================================================
// KUWAIT REGIONAL CONTEXT
// ============================================================================

export const HR_REGIONAL_CONTEXT: Record<string, HRRegionalRequirement[]> = {
  kuwait: [
    // Annual Leave
    {
      region: 'Kuwait',
      category: 'leave',
      requirement: 'Annual leave entitlement: 30 working days per year',
      legalReference: 'Kuwait Labor Law Article 70',
      automationSupport: true,
      details: 'After 9 months of service, employees entitled to 30 days paid annual leave. Fraction of year calculated proportionally.',
    },
    {
      region: 'Kuwait',
      category: 'leave',
      requirement: 'Sick leave entitlement structure',
      legalReference: 'Kuwait Labor Law Article 69',
      automationSupport: true,
      details: 'First 15 days: full pay. Next 10 days: 75% pay. Next 10 days: 50% pay. Next 10 days: 25% pay. Next 30 days: unpaid.',
    },
    {
      region: 'Kuwait',
      category: 'leave',
      requirement: 'Public holidays: 13 official holidays per year',
      legalReference: 'Amiri Decree',
      automationSupport: true,
      details: 'Includes Islamic holidays (Eid al-Fitr, Eid al-Adha, Islamic New Year, Prophet Birthday) and national holidays.',
    },
    {
      region: 'Kuwait',
      category: 'leave',
      requirement: 'Maternity leave: 70 days (30 before, 40 after delivery)',
      legalReference: 'Kuwait Labor Law Article 24',
      automationSupport: true,
      details: 'Full pay during maternity leave. Additional unpaid leave may be granted.',
    },

    // Working Hours
    {
      region: 'Kuwait',
      category: 'working_hours',
      requirement: 'Maximum working hours: 48 hours per week',
      legalReference: 'Kuwait Labor Law Article 64',
      automationSupport: true,
      details: 'Maximum 8 hours per day, 48 hours per week. During Ramadan, Muslim employees work 6 hours/day.',
    },
    {
      region: 'Kuwait',
      category: 'working_hours',
      requirement: 'Friday is the weekly rest day',
      legalReference: 'Kuwait Labor Law Article 67',
      automationSupport: true,
      details: 'Friday is the official weekly rest day. If work required on Friday, alternative rest day or overtime pay.',
    },
    {
      region: 'Kuwait',
      category: 'working_hours',
      requirement: 'Overtime rate: 125% plus 25% additional',
      legalReference: 'Kuwait Labor Law Article 66',
      automationSupport: true,
      details: 'Overtime paid at base rate plus 25% additional. Maximum overtime: 2 hours/day, 3 days/week.',
    },

    // End of Service
    {
      region: 'Kuwait',
      category: 'end_of_service',
      requirement: 'End of Service Indemnity (Gratuity) calculation',
      legalReference: 'Kuwait Labor Law Articles 51-53',
      automationSupport: true,
      details: 'First 5 years: 15 days salary per year. After 5 years: 1 month salary per year. Prorated for partial years.',
    },
    {
      region: 'Kuwait',
      category: 'end_of_service',
      requirement: 'Notice period requirements',
      legalReference: 'Kuwait Labor Law Article 45',
      automationSupport: true,
      details: 'Minimum 3 months notice for monthly-paid employees. Can be waived by mutual agreement.',
    },
    {
      region: 'Kuwait',
      category: 'end_of_service',
      requirement: 'Final settlement within 7 days',
      legalReference: 'Kuwait Labor Law Article 54',
      automationSupport: true,
      details: 'All dues must be paid within 7 days of termination. Includes unused leave, gratuity, pending salary.',
    },

    // Kuwaitization
    {
      region: 'Kuwait',
      category: 'compliance',
      requirement: 'Kuwaitization quotas by sector',
      legalReference: 'Ministerial Decision 1985',
      automationSupport: true,
      details: 'Private sector must meet Kuwaiti national hiring quotas. Varies by industry (Banking: 70%, Oil: 80%, etc.).',
    },
    {
      region: 'Kuwait',
      category: 'compliance',
      requirement: 'Work permit requirements for expats',
      legalReference: 'Residency Law',
      automationSupport: true,
      details: 'Expats need valid residency (iqama), work permit, and sponsor (kafeel). Renewal required annually.',
    },

    // Probation
    {
      region: 'Kuwait',
      category: 'employment',
      requirement: 'Probation period: maximum 100 working days',
      legalReference: 'Kuwait Labor Law Article 35',
      automationSupport: true,
      details: 'Maximum 100 working days probation. Cannot be repeated with same employer. Either party can terminate with no notice.',
    },

    // Social Security
    {
      region: 'Kuwait',
      category: 'benefits',
      requirement: 'PIFSS contributions for Kuwaiti employees',
      legalReference: 'Social Insurance Law',
      automationSupport: true,
      details: 'Public Institution for Social Security contributions required for Kuwaiti nationals. Employee: 7.5%, Employer: 11%.',
    },
  ],
};

// ============================================================================
// HR DOMAIN INTELLIGENCE CLASS
// ============================================================================

export class HRDomainIntelligence {
  private region: string;

  constructor(region: string = 'kuwait') {
    this.region = region.toLowerCase();
  }

  /**
   * Detect HR workflow pattern from user request
   */
  detectHRPattern(request: string): string | null {
    const normalizedRequest = request.toLowerCase();
    let bestMatch: string | null = null;
    let highestScore = 0;

    for (const [pattern, keywords] of Object.entries(HR_KEYWORDS)) {
      const matchedKeywords = keywords.filter(kw => normalizedRequest.includes(kw));
      const score = matchedKeywords.length;

      // Weight by keyword specificity (longer keywords = more specific)
      const weightedScore = matchedKeywords.reduce((sum, kw) => sum + kw.length, 0);

      if (score >= 2 && weightedScore > highestScore) {
        highestScore = weightedScore;
        bestMatch = pattern;
      }
    }

    return bestMatch;
  }

  /**
   * Get implicit requirements for an HR pattern
   */
  getImplicitRequirements(pattern: string): ImplicitRequirement[] {
    const requirements = HR_IMPLICIT_REQUIREMENTS[pattern] || [];

    // Add regional requirements for Kuwait
    if (this.region === 'kuwait') {
      const regionalReqs = this.getKuwaitSpecificRequirements(pattern);
      return [...requirements, ...regionalReqs];
    }

    return requirements;
  }

  /**
   * Get Kuwait-specific requirements for a pattern
   */
  private getKuwaitSpecificRequirements(pattern: string): ImplicitRequirement[] {
    const kuwaitReqs: ImplicitRequirement[] = [];

    if (pattern === 'offboarding') {
      kuwaitReqs.push({
        category: 'calculation',
        description: 'End of Service Indemnity calculator (Kuwait Labor Law)',
        reason: 'Legal requirement: 15 days/year for first 5 years, 1 month/year after',
        priority: 'critical',
        suggestedTools: ['Custom calculator', 'Payroll system', 'Excel template'],
      });
      kuwaitReqs.push({
        category: 'compliance',
        description: 'Visa cancellation process for expat employees',
        reason: 'Legal requirement to cancel residency permit within timeframe',
        priority: 'critical',
        suggestedTools: ['MOI e-services', 'PRO services', 'Manual process'],
      });
    }

    if (pattern === 'leave_management') {
      kuwaitReqs.push({
        category: 'policy',
        description: 'Kuwait Labor Law leave policy configuration',
        reason: '30 days annual leave mandatory, sick leave tiered structure',
        priority: 'critical',
        suggestedTools: ['BambooHR', 'Custom HRIS', 'Policy document'],
      });
      kuwaitReqs.push({
        category: 'calendar',
        description: 'Kuwait public holiday calendar integration',
        reason: '13 official holidays including Islamic holidays (variable dates)',
        priority: 'important',
        suggestedTools: ['Google Calendar', 'Custom calendar', 'HRIS'],
      });
    }

    if (pattern === 'recruitment') {
      kuwaitReqs.push({
        category: 'compliance',
        description: 'Kuwaitization quota tracking',
        reason: 'Legal requirement to meet national hiring quotas by sector',
        priority: 'critical',
        suggestedTools: ['Custom tracker', 'HRIS reporting', 'Excel'],
      });
      kuwaitReqs.push({
        category: 'sourcing',
        description: 'MENA job board integration',
        reason: 'Bayt.com and GulfTalent are primary sources in Kuwait',
        priority: 'important',
        suggestedTools: ['Bayt.com', 'GulfTalent', 'LinkedIn'],
      });
    }

    if (pattern === 'performance_management') {
      kuwaitReqs.push({
        category: 'compliance',
        description: 'Arabic documentation capability',
        reason: 'Performance records may be needed in Arabic for legal proceedings',
        priority: 'important',
        suggestedTools: ['Bilingual templates', 'Translation services'],
      });
    }

    return kuwaitReqs;
  }

  /**
   * Get tool recommendations for an HR pattern and region
   */
  getToolRecommendations(pattern: string, region?: string): HRToolRecommendation[] {
    const targetRegion = region || this.region;
    const recommendations: HRToolRecommendation[] = [];

    // Get category-specific tools
    const categoryMap: Record<string, string> = {
      recruitment: 'ats',
      onboarding: 'hris',
      performance_management: 'performance',
      leave_management: 'hris',
      offboarding: 'hris',
      training_development: 'learning',
    };

    const category = categoryMap[pattern];
    if (category && HR_TOOL_RECOMMENDATIONS[category]) {
      recommendations.push(...HR_TOOL_RECOMMENDATIONS[category]);
    }

    // Add regional tools for Kuwait
    if (targetRegion === 'kuwait' && HR_TOOL_RECOMMENDATIONS.regional_kuwait) {
      recommendations.push(...HR_TOOL_RECOMMENDATIONS.regional_kuwait);
    }

    // Sort by regional fit and score
    return recommendations.sort((a, b) => {
      if (targetRegion === 'kuwait') {
        // Prioritize Kuwait-compliant tools
        if (a.kuwaitCompliant && !b.kuwaitCompliant) return -1;
        if (!a.kuwaitCompliant && b.kuwaitCompliant) return 1;
        // Then by Arabic support
        if (a.arabicSupport && !b.arabicSupport) return -1;
        if (!a.arabicSupport && b.arabicSupport) return 1;
      }
      return b.score - a.score;
    });
  }

  /**
   * Generate clarifying questions for an HR pattern
   */
  getClarifyingQuestions(pattern: string): ClarifyingQuestion[] {
    const questions: ClarifyingQuestion[] = [];
    let questionId = 1;

    // Common HR questions
    questions.push({
      id: `hr_q${questionId++}`,
      question: 'What is your company size?',
      category: 'audience',
      options: [
        { value: 'small', label: 'Small (1-50 employees)', description: 'Startup or small business' },
        { value: 'medium', label: 'Medium (51-500 employees)', description: 'Growing company' },
        { value: 'large', label: 'Large (500+ employees)', description: 'Enterprise organization' },
      ],
      required: true,
      relevanceScore: 95,
    });

    // Pattern-specific questions
    if (pattern === 'recruitment') {
      questions.push({
        id: `hr_q${questionId++}`,
        question: 'What type of roles are you hiring for?',
        category: 'audience',
        options: [
          { value: 'technical', label: 'Technical/Engineering', description: 'Software, IT, Engineering roles' },
          { value: 'business', label: 'Business/Operations', description: 'Sales, Marketing, Finance, HR' },
          { value: 'executive', label: 'Executive/Leadership', description: 'C-level, VP, Director roles' },
          { value: 'entry', label: 'Entry Level', description: 'Fresh graduates, interns' },
          { value: 'mixed', label: 'Mixed', description: 'Various role types' },
        ],
        required: true,
        relevanceScore: 90,
      });

      questions.push({
        id: `hr_q${questionId++}`,
        question: 'What is your hiring volume?',
        category: 'frequency',
        options: [
          { value: 'low', label: 'Low (1-5 hires/month)', description: 'Occasional hiring' },
          { value: 'medium', label: 'Medium (6-20 hires/month)', description: 'Regular hiring activity' },
          { value: 'high', label: 'High (20+ hires/month)', description: 'High-volume recruiting' },
        ],
        required: true,
        relevanceScore: 85,
      });

      if (this.region === 'kuwait') {
        questions.push({
          id: `hr_q${questionId++}`,
          question: 'Do you need to track Kuwaitization quotas?',
          category: 'region',
          options: [
            { value: 'yes', label: 'Yes', description: 'Track national hiring requirements', implications: ['Will add quota tracking features'] },
            { value: 'no', label: 'No', description: 'Not applicable or already handled separately' },
          ],
          required: true,
          relevanceScore: 95,
        });
      }
    }

    if (pattern === 'onboarding') {
      questions.push({
        id: `hr_q${questionId++}`,
        question: 'Do you need IT system provisioning automation?',
        category: 'integration',
        options: [
          { value: 'yes', label: 'Yes', description: 'Auto-create accounts (Google, Slack, etc.)', implications: ['Will integrate identity management'] },
          { value: 'manual', label: 'Manual via IT', description: 'IT team handles separately' },
          { value: 'minimal', label: 'Minimal IT needs', description: 'Few systems to provision' },
        ],
        required: true,
        relevanceScore: 90,
      });

      questions.push({
        id: `hr_q${questionId++}`,
        question: 'Do you have compliance training requirements?',
        category: 'integration',
        options: [
          { value: 'yes', label: 'Yes', description: 'Mandatory training on policies, safety, etc.', implications: ['Will integrate LMS'] },
          { value: 'no', label: 'No', description: 'No mandatory compliance training' },
        ],
        required: false,
        relevanceScore: 75,
      });
    }

    if (pattern === 'performance_management') {
      questions.push({
        id: `hr_q${questionId++}`,
        question: 'What is your review cycle?',
        category: 'frequency',
        options: [
          { value: 'annual', label: 'Annual', description: 'Once per year formal reviews' },
          { value: 'biannual', label: 'Bi-annual', description: 'Twice per year formal reviews' },
          { value: 'quarterly', label: 'Quarterly', description: 'Four times per year' },
          { value: 'continuous', label: 'Continuous', description: 'Ongoing feedback, no fixed cycle' },
        ],
        required: true,
        relevanceScore: 90,
      });

      questions.push({
        id: `hr_q${questionId++}`,
        question: 'Do you use OKRs or KPIs for goal tracking?',
        category: 'format',
        options: [
          { value: 'okr', label: 'OKRs', description: 'Objectives and Key Results', implications: ['Will prioritize OKR-capable tools'] },
          { value: 'kpi', label: 'KPIs', description: 'Key Performance Indicators' },
          { value: 'goals', label: 'Simple Goals', description: 'Basic goal setting without framework' },
          { value: 'none', label: 'No formal system', description: 'Looking to implement' },
        ],
        required: true,
        relevanceScore: 85,
      });
    }

    if (pattern === 'leave_management') {
      questions.push({
        id: `hr_q${questionId++}`,
        question: 'What leave types do you need to track?',
        category: 'format',
        options: [
          { value: 'basic', label: 'Basic (Annual, Sick)', description: 'Standard leave types' },
          { value: 'standard', label: 'Standard + Parental', description: 'Including maternity/paternity' },
          { value: 'comprehensive', label: 'Comprehensive', description: 'All leave types including sabbatical, study leave, etc.' },
        ],
        required: true,
        relevanceScore: 90,
      });

      if (this.region === 'kuwait') {
        questions.push({
          id: `hr_q${questionId++}`,
          question: 'Do you need Kuwait Labor Law compliant leave policies?',
          category: 'region',
          options: [
            { value: 'yes', label: 'Yes', description: '30 days annual, tiered sick leave structure', implications: ['Will configure Kuwait-compliant policies'] },
            { value: 'custom', label: 'Custom policies', description: 'We have our own enhanced policies' },
          ],
          required: true,
          relevanceScore: 95,
        });
      }
    }

    if (pattern === 'offboarding') {
      questions.push({
        id: `hr_q${questionId++}`,
        question: 'What is your typical notice period?',
        category: 'format',
        options: [
          { value: '2_weeks', label: '2 weeks', description: 'Standard US practice' },
          { value: '1_month', label: '1 month', description: 'Common in many regions' },
          { value: '3_months', label: '3 months', description: 'Kuwait Labor Law standard' },
          { value: 'varies', label: 'Varies by role', description: 'Different periods for different levels' },
        ],
        required: true,
        relevanceScore: 85,
      });

      if (this.region === 'kuwait') {
        questions.push({
          id: `hr_q${questionId++}`,
          question: 'Do you need End of Service Indemnity calculation?',
          category: 'region',
          options: [
            { value: 'yes', label: 'Yes', description: 'Calculate gratuity per Kuwait Labor Law', implications: ['Will integrate EOSI calculator'] },
            { value: 'manual', label: 'Manual/Payroll handles', description: 'Already handled by payroll or finance' },
          ],
          required: true,
          relevanceScore: 95,
        });
      }
    }

    if (pattern === 'training_development') {
      questions.push({
        id: `hr_q${questionId++}`,
        question: 'What type of training content do you need?',
        category: 'format',
        options: [
          { value: 'general', label: 'General business skills', description: 'Communication, leadership, productivity' },
          { value: 'technical', label: 'Technical skills', description: 'Software, engineering, data' },
          { value: 'compliance', label: 'Compliance/Safety', description: 'Mandatory regulatory training' },
          { value: 'custom', label: 'Custom/Internal', description: 'Company-specific training content' },
          { value: 'mixed', label: 'Mixed', description: 'All of the above' },
        ],
        required: true,
        relevanceScore: 90,
      });

      questions.push({
        id: `hr_q${questionId++}`,
        question: 'Do you need Arabic language training content?',
        category: 'language',
        options: [
          { value: 'required', label: 'Required', description: 'Must have Arabic content', implications: ['Will prioritize Arabic-supported platforms'] },
          { value: 'preferred', label: 'Preferred', description: 'Nice to have but not required' },
          { value: 'english_only', label: 'English only', description: 'Team is English-proficient' },
        ],
        required: false,
        relevanceScore: 80,
      });
    }

    return questions;
  }

  /**
   * Get the full HR workflow pattern definition
   */
  getWorkflowPattern(patternId: string): HRWorkflowPattern | null {
    return HR_WORKFLOW_PATTERNS[patternId] || null;
  }

  /**
   * Get regional HR requirements
   */
  getRegionalRequirements(category?: string): HRRegionalRequirement[] {
    const allRequirements = HR_REGIONAL_CONTEXT[this.region] || [];

    if (category) {
      return allRequirements.filter(req => req.category === category);
    }

    return allRequirements;
  }

  /**
   * Calculate End of Service Indemnity for Kuwait
   * Based on Kuwait Labor Law Articles 51-53
   */
  calculateKuwaitEOSI(
    monthlyBaseSalary: number,
    yearsOfService: number,
    resignationType: 'resignation' | 'termination' | 'expiry'
  ): {
    amount: number;
    breakdown: string;
    legalReference: string;
  } {
    let amount = 0;
    const breakdownParts: string[] = [];

    // First 5 years: 15 days salary per year
    const yearsFirst5 = Math.min(yearsOfService, 5);
    const first5Amount = (monthlyBaseSalary / 30) * 15 * yearsFirst5;
    if (yearsFirst5 > 0) {
      breakdownParts.push(`First ${yearsFirst5} years: ${first5Amount.toFixed(3)} KWD (15 days/year)`);
    }
    amount += first5Amount;

    // After 5 years: 1 month salary per year
    if (yearsOfService > 5) {
      const yearsAfter5 = yearsOfService - 5;
      const after5Amount = monthlyBaseSalary * yearsAfter5;
      breakdownParts.push(`Next ${yearsAfter5} years: ${after5Amount.toFixed(3)} KWD (1 month/year)`);
      amount += after5Amount;
    }

    // Resignation penalty (if less than 5 years and resignation)
    if (resignationType === 'resignation' && yearsOfService < 5 && yearsOfService >= 3) {
      amount = amount * 0.5; // 50% if 3-5 years
      breakdownParts.push('Resignation penalty (3-5 years): 50% of calculated amount');
    } else if (resignationType === 'resignation' && yearsOfService < 3) {
      amount = 0; // No indemnity if less than 3 years and resignation
      breakdownParts.push('Resignation before 3 years: No indemnity entitled');
    }

    return {
      amount: Math.round(amount * 1000) / 1000, // Round to 3 decimal places (fils)
      breakdown: breakdownParts.join('\n'),
      legalReference: 'Kuwait Labor Law Articles 51-53',
    };
  }

  /**
   * Get leave entitlement summary for Kuwait
   */
  getKuwaitLeaveEntitlements(): {
    annual: { days: number; description: string };
    sick: { structure: string; description: string };
    maternity: { days: number; description: string };
    hajj: { days: number; description: string };
    publicHolidays: { days: number; description: string };
  } {
    return {
      annual: {
        days: 30,
        description: '30 working days per year after 9 months of service. Full pay.',
      },
      sick: {
        structure: '15 days full pay, 10 days 75%, 10 days 50%, 10 days 25%, 30 days unpaid',
        description: 'Tiered structure based on Kuwait Labor Law Article 69. Medical certificate required after 3 days.',
      },
      maternity: {
        days: 70,
        description: '70 days total (30 before delivery, 40 after). Full pay. Additional unpaid leave may be granted.',
      },
      hajj: {
        days: 21,
        description: '21 days paid leave for Hajj pilgrimage. Once during employment.',
      },
      publicHolidays: {
        days: 13,
        description: '13 official public holidays including Islamic holidays (dates vary by lunar calendar).',
      },
    };
  }

  /**
   * Get a comprehensive analysis summary for an HR request
   */
  getHRAnalysisSummary(request: string): string {
    const pattern = this.detectHRPattern(request);
    if (!pattern) {
      return 'No specific HR workflow pattern detected. Please provide more details about your HR automation needs.';
    }

    const workflowPattern = this.getWorkflowPattern(pattern);
    const requirements = this.getImplicitRequirements(pattern);
    const tools = this.getToolRecommendations(pattern);
    const questions = this.getClarifyingQuestions(pattern);

    const lines: string[] = [];

    lines.push(`## HR Workflow Analysis: ${workflowPattern?.name || pattern}\n`);

    if (workflowPattern) {
      lines.push(`**Description:** ${workflowPattern.description}`);
      lines.push(`**Typical Duration:** ${workflowPattern.typicalDuration}`);
      lines.push(`**Key Stakeholders:** ${workflowPattern.stakeholders.join(', ')}\n`);

      lines.push('### Workflow Stages');
      workflowPattern.stages.forEach(stage => {
        lines.push(`${stage.order}. **${stage.name}** (Automation: ${stage.automationPotential})`);
        lines.push(`   ${stage.description}`);
        lines.push(`   Tools: ${stage.typicalTools.slice(0, 3).join(', ')}`);
      });
    }

    if (requirements.length > 0) {
      lines.push('\n### Implicit Requirements');
      requirements.slice(0, 5).forEach(req => {
        lines.push(`- **${req.description}** (${req.priority})`);
        lines.push(`  Reason: ${req.reason}`);
      });
    }

    if (tools.length > 0) {
      lines.push('\n### Recommended Tools');
      tools.slice(0, 3).forEach(tool => {
        const kuwaitBadge = tool.kuwaitCompliant ? ' [Kuwait Compliant]' : '';
        const arabicBadge = tool.arabicSupport ? ' [Arabic Support]' : '';
        lines.push(`- **${tool.toolName}** (Score: ${tool.score})${kuwaitBadge}${arabicBadge}`);
        lines.push(`  ${tool.reasons[0]}`);
      });
    }

    if (this.region === 'kuwait') {
      lines.push('\n### Kuwait Labor Law Considerations');
      const regionalReqs = this.getRegionalRequirements().slice(0, 3);
      regionalReqs.forEach(req => {
        lines.push(`- **${req.requirement}**`);
        lines.push(`  Reference: ${req.legalReference}`);
      });
    }

    if (questions.length > 0) {
      lines.push('\n### Questions to Clarify');
      questions.filter(q => q.required).slice(0, 3).forEach(q => {
        lines.push(`- ${q.question}`);
      });
    }

    return lines.join('\n');
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default HRDomainIntelligence;

// Convenience functions
export function detectHRPattern(request: string, region?: string): string | null {
  const intelligence = new HRDomainIntelligence(region);
  return intelligence.detectHRPattern(request);
}

export function getHRImplicitRequirements(pattern: string, region?: string): ImplicitRequirement[] {
  const intelligence = new HRDomainIntelligence(region);
  return intelligence.getImplicitRequirements(pattern);
}

export function getHRToolRecommendations(pattern: string, region?: string): HRToolRecommendation[] {
  const intelligence = new HRDomainIntelligence(region);
  return intelligence.getToolRecommendations(pattern, region);
}

export function getHRClarifyingQuestions(pattern: string, region?: string): ClarifyingQuestion[] {
  const intelligence = new HRDomainIntelligence(region);
  return intelligence.getClarifyingQuestions(pattern);
}

export function analyzeHRRequest(request: string, region?: string): string {
  const intelligence = new HRDomainIntelligence(region);
  return intelligence.getHRAnalysisSummary(request);
}

export function calculateKuwaitEOSI(
  monthlyBaseSalary: number,
  yearsOfService: number,
  resignationType: 'resignation' | 'termination' | 'expiry' = 'termination'
): { amount: number; breakdown: string; legalReference: string } {
  const intelligence = new HRDomainIntelligence('kuwait');
  return intelligence.calculateKuwaitEOSI(monthlyBaseSalary, yearsOfService, resignationType);
}
