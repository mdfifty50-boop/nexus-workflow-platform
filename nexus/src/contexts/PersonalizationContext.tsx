import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'

// ============================================================================
// PERSONA TYPES & DEFINITIONS
// ============================================================================

export type PersonaType =
  | 'creator'        // Content creators, YouTubers, streamers, artists
  | 'founder'        // Startup founders, CEOs, entrepreneurs
  | 'developer'      // Software engineers, programmers
  | 'marketer'       // Marketing professionals, growth hackers
  | 'freelancer'     // Freelancers, consultants, solopreneurs
  | 'executive'      // C-suite, VPs, directors
  | 'manager'        // Team leads, project managers
  | 'student'        // Students, learners, educators
  // Healthcare
  | 'doctor'         // Physicians, surgeons, specialists
  | 'nurse'          // Nurses, nurse practitioners
  | 'therapist'      // Therapists, psychologists, counselors
  // Legal
  | 'lawyer'         // Attorneys, legal professionals
  | 'paralegal'      // Paralegals, legal assistants
  // Finance
  | 'accountant'     // CPAs, bookkeepers, financial controllers
  | 'financial_advisor' // Financial planners, wealth managers
  | 'banker'         // Banking professionals, loan officers
  // Real Estate
  | 'realtor'        // Real estate agents, brokers
  | 'property_manager' // Property managers
  // Education
  | 'teacher'        // K-12 teachers
  | 'professor'      // University professors, academics
  // Sales & Service
  | 'sales'          // Sales representatives, account executives
  | 'recruiter'      // HR recruiters, talent acquisition
  | 'consultant'     // Business consultants, advisors
  // Creative
  | 'designer'       // Graphic designers, UX/UI designers
  | 'photographer'   // Photographers, videographers
  | 'writer'         // Authors, journalists, copywriters
  // Other Professionals
  | 'engineer'       // Non-software engineers
  | 'scientist'      // Researchers, lab scientists
  | 'chef'           // Chefs, restaurant owners
  | 'fitness'        // Personal trainers, gym owners
  | 'ecommerce'      // E-commerce store owners
  // Custom & Default
  | 'custom'         // User-defined custom persona
  | 'general'        // Default fallback

export interface PersonaInfo {
  id: PersonaType
  label: string
  description: string
  icon: string
  tagline: string
  workflowTerm: string        // What they call automated processes
  taskTerm: string            // What they call individual tasks
  teamTerm: string            // What they call the AI agents collectively
  resultsTerm: string         // What they call outputs/results
}

// ============================================================================
// PERSONA DEFINITIONS
// ============================================================================

export const PERSONA_DEFINITIONS: Record<PersonaType, PersonaInfo> = {
  creator: {
    id: 'creator',
    label: 'Creator',
    description: 'Content creator, YouTuber, streamer, or digital artist',
    icon: '🎨',
    tagline: 'Focus on creating, let AI handle the rest',
    workflowTerm: 'Automations',
    taskTerm: 'Tasks',
    teamTerm: 'Creative Crew',
    resultsTerm: 'Content',
  },
  founder: {
    id: 'founder',
    label: 'Founder / CEO',
    description: 'Running a startup or building a company',
    icon: '🚀',
    tagline: 'Scale your vision with AI-powered operations',
    workflowTerm: 'Systems',
    taskTerm: 'Initiatives',
    teamTerm: 'Executive Team',
    resultsTerm: 'Outcomes',
  },
  developer: {
    id: 'developer',
    label: 'Developer',
    description: 'Building software, apps, or technical products',
    icon: '💻',
    tagline: 'Automate the boring stuff, ship faster',
    workflowTerm: 'Pipelines',
    taskTerm: 'Jobs',
    teamTerm: 'Agents',
    resultsTerm: 'Outputs',
  },
  marketer: {
    id: 'marketer',
    label: 'Marketer',
    description: 'Driving growth, campaigns, and brand awareness',
    icon: '📈',
    tagline: 'Amplify your campaigns with intelligent automation',
    workflowTerm: 'Campaigns',
    taskTerm: 'Actions',
    teamTerm: 'Marketing Squad',
    resultsTerm: 'Metrics',
  },
  freelancer: {
    id: 'freelancer',
    label: 'Freelancer',
    description: 'Independent professional or consultant',
    icon: '🎯',
    tagline: 'Work smarter, deliver faster, earn more',
    workflowTerm: 'Workflows',
    taskTerm: 'Tasks',
    teamTerm: 'Virtual Team',
    resultsTerm: 'Deliverables',
  },
  executive: {
    id: 'executive',
    label: 'Executive',
    description: 'C-suite, VP, or senior leadership role',
    icon: '👔',
    tagline: 'Strategic automation for enterprise impact',
    workflowTerm: 'Processes',
    taskTerm: 'Directives',
    teamTerm: 'Executive Assistants',
    resultsTerm: 'Reports',
  },
  manager: {
    id: 'manager',
    label: 'Manager',
    description: 'Team lead, project manager, or coordinator',
    icon: '📋',
    tagline: 'Empower your team with AI-driven efficiency',
    workflowTerm: 'Processes',
    taskTerm: 'Tasks',
    teamTerm: 'Support Team',
    resultsTerm: 'Updates',
  },
  student: {
    id: 'student',
    label: 'Student / Learner',
    description: 'Learning, researching, or in education',
    icon: '📚',
    tagline: 'Learn faster, automate smarter',
    workflowTerm: 'Automations',
    taskTerm: 'Assignments',
    teamTerm: 'Study Buddies',
    resultsTerm: 'Work',
  },
  // Healthcare Personas
  doctor: {
    id: 'doctor',
    label: 'Doctor / Physician',
    description: 'Physician, surgeon, or medical specialist',
    icon: '🩺',
    tagline: 'More time for patients, less time on paperwork',
    workflowTerm: 'Clinical Protocols',
    taskTerm: 'Patient Cases',
    teamTerm: 'Care Team',
    resultsTerm: 'Patient Outcomes',
  },
  nurse: {
    id: 'nurse',
    label: 'Nurse',
    description: 'RN, nurse practitioner, or nursing professional',
    icon: '💉',
    tagline: 'Streamline patient care with intelligent automation',
    workflowTerm: 'Care Protocols',
    taskTerm: 'Patient Tasks',
    teamTerm: 'Nursing Team',
    resultsTerm: 'Care Reports',
  },
  therapist: {
    id: 'therapist',
    label: 'Therapist / Counselor',
    description: 'Psychologist, therapist, or mental health professional',
    icon: '🧠',
    tagline: 'Focus on healing while AI handles admin',
    workflowTerm: 'Therapy Protocols',
    taskTerm: 'Sessions',
    teamTerm: 'Practice Team',
    resultsTerm: 'Progress Notes',
  },
  // Legal Personas
  lawyer: {
    id: 'lawyer',
    label: 'Lawyer / Attorney',
    description: 'Attorney, legal counsel, or law firm partner',
    icon: '⚖️',
    tagline: 'Bill more hours by automating the unbillable',
    workflowTerm: 'Legal Processes',
    taskTerm: 'Matters',
    teamTerm: 'Legal Team',
    resultsTerm: 'Case Outcomes',
  },
  paralegal: {
    id: 'paralegal',
    label: 'Paralegal',
    description: 'Paralegal, legal assistant, or legal support',
    icon: '📜',
    tagline: 'Accelerate legal research and document prep',
    workflowTerm: 'Legal Workflows',
    taskTerm: 'Assignments',
    teamTerm: 'Support Team',
    resultsTerm: 'Documents',
  },
  // Finance Personas
  accountant: {
    id: 'accountant',
    label: 'Accountant / CPA',
    description: 'CPA, bookkeeper, or financial controller',
    icon: '📊',
    tagline: 'Automate reconciliation, focus on advisory',
    workflowTerm: 'Financial Processes',
    taskTerm: 'Entries',
    teamTerm: 'Accounting Team',
    resultsTerm: 'Financial Reports',
  },
  financial_advisor: {
    id: 'financial_advisor',
    label: 'Financial Advisor',
    description: 'Financial planner, wealth manager, or investment advisor',
    icon: '💹',
    tagline: 'Scale your practice with AI-powered insights',
    workflowTerm: 'Advisory Workflows',
    taskTerm: 'Client Plans',
    teamTerm: 'Advisory Team',
    resultsTerm: 'Portfolio Reports',
  },
  banker: {
    id: 'banker',
    label: 'Banking Professional',
    description: 'Banker, loan officer, or financial services',
    icon: '🏦',
    tagline: 'Accelerate approvals and compliance',
    workflowTerm: 'Banking Processes',
    taskTerm: 'Applications',
    teamTerm: 'Banking Team',
    resultsTerm: 'Approvals',
  },
  // Real Estate Personas
  realtor: {
    id: 'realtor',
    label: 'Real Estate Agent',
    description: 'Realtor, broker, or real estate professional',
    icon: '🏠',
    tagline: 'Close more deals with automated follow-ups',
    workflowTerm: 'Deal Pipelines',
    taskTerm: 'Listings',
    teamTerm: 'Real Estate Team',
    resultsTerm: 'Closings',
  },
  property_manager: {
    id: 'property_manager',
    label: 'Property Manager',
    description: 'Property manager or facility manager',
    icon: '🏢',
    tagline: 'Automate tenant management and maintenance',
    workflowTerm: 'Property Processes',
    taskTerm: 'Work Orders',
    teamTerm: 'Property Team',
    resultsTerm: 'Property Reports',
  },
  // Education Personas
  teacher: {
    id: 'teacher',
    label: 'Teacher',
    description: 'K-12 teacher or educational professional',
    icon: '🍎',
    tagline: 'Spend more time teaching, less on grading',
    workflowTerm: 'Lesson Plans',
    taskTerm: 'Assignments',
    teamTerm: 'Teaching Team',
    resultsTerm: 'Student Progress',
  },
  professor: {
    id: 'professor',
    label: 'Professor / Academic',
    description: 'University professor, researcher, or academic',
    icon: '🎓',
    tagline: 'Automate admin, amplify research impact',
    workflowTerm: 'Academic Workflows',
    taskTerm: 'Research Tasks',
    teamTerm: 'Research Team',
    resultsTerm: 'Publications',
  },
  // Sales & Service Personas
  sales: {
    id: 'sales',
    label: 'Sales Representative',
    description: 'Sales rep, account executive, or business development',
    icon: '🤝',
    tagline: 'Hit quota faster with AI-powered sales automation',
    workflowTerm: 'Sales Pipelines',
    taskTerm: 'Deals',
    teamTerm: 'Sales Team',
    resultsTerm: 'Revenue',
  },
  recruiter: {
    id: 'recruiter',
    label: 'Recruiter / HR',
    description: 'Recruiter, talent acquisition, or HR professional',
    icon: '👥',
    tagline: 'Find top talent faster with automated screening',
    workflowTerm: 'Hiring Pipelines',
    taskTerm: 'Candidates',
    teamTerm: 'HR Team',
    resultsTerm: 'Hires',
  },
  consultant: {
    id: 'consultant',
    label: 'Consultant',
    description: 'Business consultant, strategy advisor, or expert',
    icon: '💼',
    tagline: 'Deliver more value with scalable automation',
    workflowTerm: 'Engagement Workflows',
    taskTerm: 'Deliverables',
    teamTerm: 'Consulting Team',
    resultsTerm: 'Recommendations',
  },
  // Creative Personas
  designer: {
    id: 'designer',
    label: 'Designer',
    description: 'Graphic designer, UX/UI designer, or creative',
    icon: '🎨',
    tagline: 'Design more, admin less',
    workflowTerm: 'Design Workflows',
    taskTerm: 'Projects',
    teamTerm: 'Design Team',
    resultsTerm: 'Deliverables',
  },
  photographer: {
    id: 'photographer',
    label: 'Photographer',
    description: 'Photographer, videographer, or visual artist',
    icon: '📷',
    tagline: 'Capture moments, automate the business',
    workflowTerm: 'Shoot Workflows',
    taskTerm: 'Shoots',
    teamTerm: 'Creative Team',
    resultsTerm: 'Galleries',
  },
  writer: {
    id: 'writer',
    label: 'Writer / Author',
    description: 'Author, journalist, copywriter, or content writer',
    icon: '✍️',
    tagline: 'Write more, research faster',
    workflowTerm: 'Writing Workflows',
    taskTerm: 'Pieces',
    teamTerm: 'Editorial Team',
    resultsTerm: 'Publications',
  },
  // Other Professionals
  engineer: {
    id: 'engineer',
    label: 'Engineer',
    description: 'Mechanical, electrical, civil, or other engineer',
    icon: '⚙️',
    tagline: 'Engineer solutions, automate documentation',
    workflowTerm: 'Engineering Processes',
    taskTerm: 'Projects',
    teamTerm: 'Engineering Team',
    resultsTerm: 'Specs',
  },
  scientist: {
    id: 'scientist',
    label: 'Scientist / Researcher',
    description: 'Research scientist, lab professional, or academic researcher',
    icon: '🔬',
    tagline: 'Accelerate discovery with automated analysis',
    workflowTerm: 'Research Protocols',
    taskTerm: 'Experiments',
    teamTerm: 'Research Team',
    resultsTerm: 'Findings',
  },
  chef: {
    id: 'chef',
    label: 'Chef / Restaurant Owner',
    description: 'Chef, restaurateur, or food service professional',
    icon: '👨‍🍳',
    tagline: 'Run your kitchen smarter, not harder',
    workflowTerm: 'Kitchen Workflows',
    taskTerm: 'Orders',
    teamTerm: 'Kitchen Team',
    resultsTerm: 'Service Reports',
  },
  fitness: {
    id: 'fitness',
    label: 'Fitness Professional',
    description: 'Personal trainer, gym owner, or fitness coach',
    icon: '💪',
    tagline: 'Scale your fitness business with automation',
    workflowTerm: 'Training Programs',
    taskTerm: 'Sessions',
    teamTerm: 'Fitness Team',
    resultsTerm: 'Client Progress',
  },
  ecommerce: {
    id: 'ecommerce',
    label: 'E-commerce Owner',
    description: 'Online store owner, dropshipper, or e-commerce entrepreneur',
    icon: '🛒',
    tagline: 'Automate your store, scale your revenue',
    workflowTerm: 'Store Automations',
    taskTerm: 'Orders',
    teamTerm: 'Store Team',
    resultsTerm: 'Sales',
  },
  // Custom & Default
  custom: {
    id: 'custom',
    label: 'Custom Profession',
    description: 'Your unique professional role',
    icon: '🌟',
    tagline: 'AI automation tailored to your unique needs',
    workflowTerm: 'Workflows',
    taskTerm: 'Tasks',
    teamTerm: 'AI Team',
    resultsTerm: 'Results',
  },
  general: {
    id: 'general',
    label: 'Just Exploring',
    description: 'Checking things out, no specific role',
    icon: '✨',
    tagline: 'Discover what AI automation can do for you',
    workflowTerm: 'Workflows',
    taskTerm: 'Tasks',
    teamTerm: 'AI Team',
    resultsTerm: 'Results',
  },
}

// ============================================================================
// AGENT NAME MAPPINGS BY PERSONA
// ============================================================================

export interface AgentNames {
  larry: { name: string; title: string; description: string }
  mary: { name: string; title: string; description: string }
  sam: { name: string; title: string; description: string }
  emma: { name: string; title: string; description: string }
  alex: { name: string; title: string; description: string }
  pat: { name: string; title: string; description: string }
  jordan: { name: string; title: string; description: string }
  nexus: { name: string; title: string; description: string }
}

export const AGENT_NAMES_BY_PERSONA: Record<PersonaType, AgentNames> = {
  creator: {
    larry: { name: 'Larry', title: 'Content Strategist', description: 'Plans your content calendar and strategy' },
    mary: { name: 'Mary', title: 'Social Media Manager', description: 'Handles all your social media tasks' },
    sam: { name: 'Sam', title: 'Video Editor Assistant', description: 'Helps with video editing workflows' },
    emma: { name: 'Emma', title: 'Community Manager', description: 'Engages with your audience' },
    alex: { name: 'Alex', title: 'Analytics Guru', description: 'Tracks your content performance' },
    pat: { name: 'Pat', title: 'Sponsorship Coordinator', description: 'Manages brand deals and sponsorships' },
    jordan: { name: 'Jordan', title: 'Thumbnail Designer', description: 'Creates eye-catching visuals' },
    nexus: { name: 'Nexus', title: 'Your Creative Director', description: 'Orchestrates your entire creative team' },
  },
  founder: {
    larry: { name: 'Larry', title: 'Chief of Staff', description: 'Manages day-to-day operations' },
    mary: { name: 'Mary', title: 'Head of Growth', description: 'Drives user acquisition and retention' },
    sam: { name: 'Sam', title: 'Technical Advisor', description: 'Handles technical decisions and reviews' },
    emma: { name: 'Emma', title: 'People Operations', description: 'Manages team and culture initiatives' },
    alex: { name: 'Alex', title: 'Data Analyst', description: 'Provides insights and metrics' },
    pat: { name: 'Pat', title: 'Investor Relations', description: 'Manages funding and investor comms' },
    jordan: { name: 'Jordan', title: 'Product Lead', description: 'Oversees product development' },
    nexus: { name: 'Nexus', title: 'Your AI Co-founder', description: 'Strategic partner for scaling your vision' },
  },
  developer: {
    larry: { name: 'Larry', title: 'DevOps Engineer', description: 'Manages CI/CD and infrastructure' },
    mary: { name: 'Mary', title: 'QA Specialist', description: 'Handles testing and quality assurance' },
    sam: { name: 'Sam', title: 'Code Reviewer', description: 'Reviews PRs and maintains code quality' },
    emma: { name: 'Emma', title: 'Documentation Writer', description: 'Keeps docs up to date' },
    alex: { name: 'Alex', title: 'Performance Analyst', description: 'Monitors and optimizes performance' },
    pat: { name: 'Pat', title: 'Security Auditor', description: 'Handles security reviews and compliance' },
    jordan: { name: 'Jordan', title: 'API Architect', description: 'Designs and maintains APIs' },
    nexus: { name: 'Nexus', title: 'Your AI Pair Programmer', description: 'Orchestrates your development workflow' },
  },
  marketer: {
    larry: { name: 'Larry', title: 'Campaign Manager', description: 'Orchestrates multi-channel campaigns' },
    mary: { name: 'Mary', title: 'Content Writer', description: 'Creates compelling copy and content' },
    sam: { name: 'Sam', title: 'SEO Specialist', description: 'Optimizes for search and discovery' },
    emma: { name: 'Emma', title: 'Email Marketer', description: 'Manages email campaigns and automation' },
    alex: { name: 'Alex', title: 'Analytics Lead', description: 'Tracks ROI and campaign performance' },
    pat: { name: 'Pat', title: 'Paid Ads Manager', description: 'Handles PPC and paid social' },
    jordan: { name: 'Jordan', title: 'Creative Director', description: 'Designs marketing assets' },
    nexus: { name: 'Nexus', title: 'Your Marketing Brain', description: 'Coordinates your entire marketing stack' },
  },
  freelancer: {
    larry: { name: 'Larry', title: 'Project Manager', description: 'Keeps your projects on track' },
    mary: { name: 'Mary', title: 'Client Success', description: 'Manages client communications' },
    sam: { name: 'Sam', title: 'Research Assistant', description: 'Gathers information and resources' },
    emma: { name: 'Emma', title: 'Admin Assistant', description: 'Handles invoicing and scheduling' },
    alex: { name: 'Alex', title: 'Time Tracker', description: 'Monitors time and productivity' },
    pat: { name: 'Pat', title: 'Proposal Writer', description: 'Helps craft winning proposals' },
    jordan: { name: 'Jordan', title: 'Portfolio Manager', description: 'Showcases your best work' },
    nexus: { name: 'Nexus', title: 'Your Virtual Partner', description: 'Your complete business support system' },
  },
  executive: {
    larry: { name: 'Larry', title: 'Executive Assistant', description: 'Manages your schedule and priorities' },
    mary: { name: 'Mary', title: 'Communications Director', description: 'Handles internal and external comms' },
    sam: { name: 'Sam', title: 'Strategy Analyst', description: 'Provides strategic insights and research' },
    emma: { name: 'Emma', title: 'Board Secretary', description: 'Prepares board materials and minutes' },
    alex: { name: 'Alex', title: 'Business Intelligence', description: 'Delivers executive dashboards and KPIs' },
    pat: { name: 'Pat', title: 'Legal Liaison', description: 'Coordinates legal and compliance matters' },
    jordan: { name: 'Jordan', title: 'Innovation Lead', description: 'Scouts new opportunities and trends' },
    nexus: { name: 'Nexus', title: 'Your Chief of AI', description: 'Your strategic AI leadership partner' },
  },
  manager: {
    larry: { name: 'Larry', title: 'Task Coordinator', description: 'Assigns and tracks team tasks' },
    mary: { name: 'Mary', title: 'Team Communicator', description: 'Facilitates team communication' },
    sam: { name: 'Sam', title: 'Resource Planner', description: 'Manages resource allocation' },
    emma: { name: 'Emma', title: 'Meeting Scheduler', description: 'Coordinates meetings and agendas' },
    alex: { name: 'Alex', title: 'Progress Tracker', description: 'Monitors project progress and blockers' },
    pat: { name: 'Pat', title: 'HR Coordinator', description: 'Handles team HR requests' },
    jordan: { name: 'Jordan', title: 'Process Designer', description: 'Optimizes team workflows' },
    nexus: { name: 'Nexus', title: 'Your Team Multiplier', description: 'Amplifies your management capabilities' },
  },
  student: {
    larry: { name: 'Larry', title: 'Study Planner', description: 'Organizes your study schedule' },
    mary: { name: 'Mary', title: 'Research Helper', description: 'Finds sources and references' },
    sam: { name: 'Sam', title: 'Note Taker', description: 'Summarizes and organizes notes' },
    emma: { name: 'Emma', title: 'Writing Tutor', description: 'Helps with essays and papers' },
    alex: { name: 'Alex', title: 'Quiz Master', description: 'Creates practice questions and flashcards' },
    pat: { name: 'Pat', title: 'Citation Manager', description: 'Formats citations and bibliographies' },
    jordan: { name: 'Jordan', title: 'Presentation Coach', description: 'Helps with slides and presentations' },
    nexus: { name: 'Nexus', title: 'Your Study Squad Leader', description: 'Coordinates all your academic support' },
  },
  // Healthcare
  doctor: {
    larry: { name: 'Larry', title: 'Medical Scribe', description: 'Documents patient encounters and notes' },
    mary: { name: 'Mary', title: 'Patient Coordinator', description: 'Manages patient scheduling and follow-ups' },
    sam: { name: 'Sam', title: 'Lab Results Analyst', description: 'Organizes and summarizes lab results' },
    emma: { name: 'Emma', title: 'Insurance Liaison', description: 'Handles prior authorizations and claims' },
    alex: { name: 'Alex', title: 'Clinical Data Analyst', description: 'Tracks patient outcomes and metrics' },
    pat: { name: 'Pat', title: 'Compliance Officer', description: 'Ensures HIPAA and regulatory compliance' },
    jordan: { name: 'Jordan', title: 'Referral Manager', description: 'Coordinates specialist referrals' },
    nexus: { name: 'Nexus', title: 'Your Clinical Assistant', description: 'Orchestrates your entire practice workflow' },
  },
  nurse: {
    larry: { name: 'Larry', title: 'Shift Coordinator', description: 'Manages shift schedules and handoffs' },
    mary: { name: 'Mary', title: 'Patient Communicator', description: 'Handles patient and family updates' },
    sam: { name: 'Sam', title: 'Medication Tracker', description: 'Tracks medication schedules and alerts' },
    emma: { name: 'Emma', title: 'Care Plan Assistant', description: 'Helps document care plans' },
    alex: { name: 'Alex', title: 'Vitals Monitor', description: 'Tracks and alerts on vital signs' },
    pat: { name: 'Pat', title: 'Documentation Helper', description: 'Assists with nursing documentation' },
    jordan: { name: 'Jordan', title: 'Training Coordinator', description: 'Manages CE and training requirements' },
    nexus: { name: 'Nexus', title: 'Your Nursing Assistant', description: 'Supports your patient care workflow' },
  },
  therapist: {
    larry: { name: 'Larry', title: 'Session Scheduler', description: 'Manages appointment scheduling' },
    mary: { name: 'Mary', title: 'Intake Coordinator', description: 'Handles new patient intake' },
    sam: { name: 'Sam', title: 'Progress Notes Writer', description: 'Helps with session documentation' },
    emma: { name: 'Emma', title: 'Resource Curator', description: 'Finds worksheets and resources' },
    alex: { name: 'Alex', title: 'Outcome Tracker', description: 'Tracks treatment progress and outcomes' },
    pat: { name: 'Pat', title: 'Insurance Biller', description: 'Handles billing and superbills' },
    jordan: { name: 'Jordan', title: 'Crisis Protocol Manager', description: 'Maintains safety protocols' },
    nexus: { name: 'Nexus', title: 'Your Practice Manager', description: 'Orchestrates your therapy practice' },
  },
  // Legal
  lawyer: {
    larry: { name: 'Larry', title: 'Case Manager', description: 'Tracks case timelines and deadlines' },
    mary: { name: 'Mary', title: 'Client Communicator', description: 'Manages client communications' },
    sam: { name: 'Sam', title: 'Legal Researcher', description: 'Conducts legal research and citations' },
    emma: { name: 'Emma', title: 'Document Drafter', description: 'Helps draft legal documents' },
    alex: { name: 'Alex', title: 'Billing Tracker', description: 'Tracks billable hours and invoicing' },
    pat: { name: 'Pat', title: 'Court Filing Coordinator', description: 'Manages court filings and deadlines' },
    jordan: { name: 'Jordan', title: 'Discovery Manager', description: 'Organizes discovery documents' },
    nexus: { name: 'Nexus', title: 'Your Legal Partner', description: 'Orchestrates your legal practice' },
  },
  paralegal: {
    larry: { name: 'Larry', title: 'File Organizer', description: 'Keeps case files organized' },
    mary: { name: 'Mary', title: 'Client Scheduler', description: 'Schedules client meetings' },
    sam: { name: 'Sam', title: 'Research Assistant', description: 'Assists with legal research' },
    emma: { name: 'Emma', title: 'Document Formatter', description: 'Formats legal documents' },
    alex: { name: 'Alex', title: 'Deadline Tracker', description: 'Tracks all case deadlines' },
    pat: { name: 'Pat', title: 'E-filing Helper', description: 'Assists with electronic filings' },
    jordan: { name: 'Jordan', title: 'Evidence Cataloger', description: 'Catalogs and organizes evidence' },
    nexus: { name: 'Nexus', title: 'Your Legal Assistant Lead', description: 'Coordinates your legal support' },
  },
  // Finance
  accountant: {
    larry: { name: 'Larry', title: 'Bookkeeper', description: 'Manages day-to-day bookkeeping' },
    mary: { name: 'Mary', title: 'Client Communicator', description: 'Handles client queries' },
    sam: { name: 'Sam', title: 'Tax Researcher', description: 'Researches tax regulations' },
    emma: { name: 'Emma', title: 'Report Generator', description: 'Creates financial reports' },
    alex: { name: 'Alex', title: 'Reconciliation Specialist', description: 'Handles account reconciliation' },
    pat: { name: 'Pat', title: 'Audit Preparer', description: 'Prepares audit documentation' },
    jordan: { name: 'Jordan', title: 'Tax Filing Assistant', description: 'Assists with tax filings' },
    nexus: { name: 'Nexus', title: 'Your Accounting Partner', description: 'Orchestrates your accounting workflow' },
  },
  financial_advisor: {
    larry: { name: 'Larry', title: 'Portfolio Analyst', description: 'Analyzes portfolio performance' },
    mary: { name: 'Mary', title: 'Client Relations', description: 'Manages client relationships' },
    sam: { name: 'Sam', title: 'Market Researcher', description: 'Researches market trends' },
    emma: { name: 'Emma', title: 'Plan Generator', description: 'Creates financial plans' },
    alex: { name: 'Alex', title: 'Performance Tracker', description: 'Tracks investment performance' },
    pat: { name: 'Pat', title: 'Compliance Checker', description: 'Ensures regulatory compliance' },
    jordan: { name: 'Jordan', title: 'Rebalancing Assistant', description: 'Helps with portfolio rebalancing' },
    nexus: { name: 'Nexus', title: 'Your Advisory Partner', description: 'Orchestrates your advisory practice' },
  },
  banker: {
    larry: { name: 'Larry', title: 'Loan Processor', description: 'Processes loan applications' },
    mary: { name: 'Mary', title: 'Customer Service', description: 'Handles customer inquiries' },
    sam: { name: 'Sam', title: 'Credit Analyst', description: 'Analyzes creditworthiness' },
    emma: { name: 'Emma', title: 'Document Collector', description: 'Gathers required documents' },
    alex: { name: 'Alex', title: 'Rate Analyst', description: 'Compares rates and options' },
    pat: { name: 'Pat', title: 'Compliance Monitor', description: 'Monitors regulatory compliance' },
    jordan: { name: 'Jordan', title: 'Underwriting Assistant', description: 'Assists with underwriting' },
    nexus: { name: 'Nexus', title: 'Your Banking Partner', description: 'Orchestrates your banking workflow' },
  },
  // Real Estate
  realtor: {
    larry: { name: 'Larry', title: 'Listing Manager', description: 'Manages property listings' },
    mary: { name: 'Mary', title: 'Client Communicator', description: 'Handles buyer/seller communications' },
    sam: { name: 'Sam', title: 'Market Analyst', description: 'Provides market analysis' },
    emma: { name: 'Emma', title: 'Showing Scheduler', description: 'Schedules property showings' },
    alex: { name: 'Alex', title: 'Lead Tracker', description: 'Tracks leads and conversions' },
    pat: { name: 'Pat', title: 'Contract Coordinator', description: 'Coordinates contracts and closings' },
    jordan: { name: 'Jordan', title: 'Marketing Specialist', description: 'Creates listing marketing' },
    nexus: { name: 'Nexus', title: 'Your Real Estate Partner', description: 'Orchestrates your real estate business' },
  },
  property_manager: {
    larry: { name: 'Larry', title: 'Maintenance Coordinator', description: 'Manages maintenance requests' },
    mary: { name: 'Mary', title: 'Tenant Communicator', description: 'Handles tenant communications' },
    sam: { name: 'Sam', title: 'Lease Administrator', description: 'Manages leases and renewals' },
    emma: { name: 'Emma', title: 'Rent Collector', description: 'Tracks rent payments' },
    alex: { name: 'Alex', title: 'Property Analyst', description: 'Analyzes property performance' },
    pat: { name: 'Pat', title: 'Vendor Manager', description: 'Coordinates with vendors' },
    jordan: { name: 'Jordan', title: 'Inspection Scheduler', description: 'Schedules property inspections' },
    nexus: { name: 'Nexus', title: 'Your Property Partner', description: 'Orchestrates your property management' },
  },
  // Education
  teacher: {
    larry: { name: 'Larry', title: 'Lesson Planner', description: 'Helps plan lessons and curriculum' },
    mary: { name: 'Mary', title: 'Parent Communicator', description: 'Manages parent communications' },
    sam: { name: 'Sam', title: 'Grading Assistant', description: 'Helps with grading and feedback' },
    emma: { name: 'Emma', title: 'Resource Finder', description: 'Finds teaching resources' },
    alex: { name: 'Alex', title: 'Progress Tracker', description: 'Tracks student progress' },
    pat: { name: 'Pat', title: 'Accommodation Manager', description: 'Manages student accommodations' },
    jordan: { name: 'Jordan', title: 'Activity Designer', description: 'Creates classroom activities' },
    nexus: { name: 'Nexus', title: 'Your Teaching Assistant', description: 'Orchestrates your classroom workflow' },
  },
  professor: {
    larry: { name: 'Larry', title: 'Syllabus Manager', description: 'Manages course syllabi' },
    mary: { name: 'Mary', title: 'Student Advisor', description: 'Handles student advising' },
    sam: { name: 'Sam', title: 'Research Assistant', description: 'Assists with research tasks' },
    emma: { name: 'Emma', title: 'Grant Writer', description: 'Helps with grant applications' },
    alex: { name: 'Alex', title: 'Publication Tracker', description: 'Tracks publications and citations' },
    pat: { name: 'Pat', title: 'Peer Review Coordinator', description: 'Manages peer review process' },
    jordan: { name: 'Jordan', title: 'Lecture Designer', description: 'Helps design lectures and slides' },
    nexus: { name: 'Nexus', title: 'Your Academic Partner', description: 'Orchestrates your academic workflow' },
  },
  // Sales & Service
  sales: {
    larry: { name: 'Larry', title: 'CRM Manager', description: 'Manages CRM and pipeline' },
    mary: { name: 'Mary', title: 'Lead Qualifier', description: 'Qualifies and scores leads' },
    sam: { name: 'Sam', title: 'Proposal Writer', description: 'Creates proposals and quotes' },
    emma: { name: 'Emma', title: 'Follow-up Specialist', description: 'Manages follow-up sequences' },
    alex: { name: 'Alex', title: 'Sales Analyst', description: 'Tracks sales metrics and forecasts' },
    pat: { name: 'Pat', title: 'Contract Specialist', description: 'Handles contracts and negotiations' },
    jordan: { name: 'Jordan', title: 'Demo Coordinator', description: 'Schedules and prepares demos' },
    nexus: { name: 'Nexus', title: 'Your Sales Partner', description: 'Orchestrates your sales workflow' },
  },
  recruiter: {
    larry: { name: 'Larry', title: 'Sourcing Specialist', description: 'Sources and finds candidates' },
    mary: { name: 'Mary', title: 'Candidate Communicator', description: 'Manages candidate communications' },
    sam: { name: 'Sam', title: 'Resume Screener', description: 'Screens and ranks resumes' },
    emma: { name: 'Emma', title: 'Interview Scheduler', description: 'Schedules interviews' },
    alex: { name: 'Alex', title: 'Pipeline Tracker', description: 'Tracks hiring pipeline metrics' },
    pat: { name: 'Pat', title: 'Offer Coordinator', description: 'Coordinates job offers' },
    jordan: { name: 'Jordan', title: 'Onboarding Assistant', description: 'Manages new hire onboarding' },
    nexus: { name: 'Nexus', title: 'Your Recruiting Partner', description: 'Orchestrates your recruiting workflow' },
  },
  consultant: {
    larry: { name: 'Larry', title: 'Project Coordinator', description: 'Coordinates consulting projects' },
    mary: { name: 'Mary', title: 'Client Manager', description: 'Manages client relationships' },
    sam: { name: 'Sam', title: 'Research Analyst', description: 'Conducts research and analysis' },
    emma: { name: 'Emma', title: 'Deliverable Creator', description: 'Creates presentations and reports' },
    alex: { name: 'Alex', title: 'Data Analyst', description: 'Analyzes client data' },
    pat: { name: 'Pat', title: 'Proposal Developer', description: 'Develops proposals and SOWs' },
    jordan: { name: 'Jordan', title: 'Workshop Facilitator', description: 'Prepares workshop materials' },
    nexus: { name: 'Nexus', title: 'Your Consulting Partner', description: 'Orchestrates your consulting practice' },
  },
  // Creative
  designer: {
    larry: { name: 'Larry', title: 'Project Manager', description: 'Manages design projects' },
    mary: { name: 'Mary', title: 'Client Liaison', description: 'Handles client feedback' },
    sam: { name: 'Sam', title: 'Asset Organizer', description: 'Organizes design assets' },
    emma: { name: 'Emma', title: 'Mood Board Creator', description: 'Creates inspiration boards' },
    alex: { name: 'Alex', title: 'Analytics Tracker', description: 'Tracks design performance' },
    pat: { name: 'Pat', title: 'Brand Guardian', description: 'Ensures brand consistency' },
    jordan: { name: 'Jordan', title: 'Mockup Generator', description: 'Creates mockups and prototypes' },
    nexus: { name: 'Nexus', title: 'Your Design Partner', description: 'Orchestrates your design workflow' },
  },
  photographer: {
    larry: { name: 'Larry', title: 'Booking Manager', description: 'Manages photo bookings' },
    mary: { name: 'Mary', title: 'Client Communicator', description: 'Handles client communications' },
    sam: { name: 'Sam', title: 'Photo Curator', description: 'Curates and selects photos' },
    emma: { name: 'Emma', title: 'Gallery Organizer', description: 'Organizes client galleries' },
    alex: { name: 'Alex', title: 'Business Tracker', description: 'Tracks bookings and revenue' },
    pat: { name: 'Pat', title: 'Contract Manager', description: 'Manages photo contracts' },
    jordan: { name: 'Jordan', title: 'Editing Assistant', description: 'Assists with photo editing' },
    nexus: { name: 'Nexus', title: 'Your Photography Partner', description: 'Orchestrates your photography business' },
  },
  writer: {
    larry: { name: 'Larry', title: 'Editor', description: 'Edits and proofreads content' },
    mary: { name: 'Mary', title: 'Publisher Liaison', description: 'Manages publisher relationships' },
    sam: { name: 'Sam', title: 'Research Assistant', description: 'Researches topics and facts' },
    emma: { name: 'Emma', title: 'Outline Creator', description: 'Helps structure content' },
    alex: { name: 'Alex', title: 'Analytics Tracker', description: 'Tracks content performance' },
    pat: { name: 'Pat', title: 'Rights Manager', description: 'Manages copyright and rights' },
    jordan: { name: 'Jordan', title: 'Idea Generator', description: 'Brainstorms content ideas' },
    nexus: { name: 'Nexus', title: 'Your Writing Partner', description: 'Orchestrates your writing workflow' },
  },
  // Other Professionals
  engineer: {
    larry: { name: 'Larry', title: 'Project Coordinator', description: 'Coordinates engineering projects' },
    mary: { name: 'Mary', title: 'Stakeholder Communicator', description: 'Manages stakeholder updates' },
    sam: { name: 'Sam', title: 'Calculations Checker', description: 'Verifies engineering calculations' },
    emma: { name: 'Emma', title: 'Drawing Organizer', description: 'Organizes CAD and drawings' },
    alex: { name: 'Alex', title: 'Data Analyst', description: 'Analyzes engineering data' },
    pat: { name: 'Pat', title: 'Compliance Checker', description: 'Ensures code compliance' },
    jordan: { name: 'Jordan', title: 'Spec Writer', description: 'Writes technical specifications' },
    nexus: { name: 'Nexus', title: 'Your Engineering Partner', description: 'Orchestrates your engineering workflow' },
  },
  scientist: {
    larry: { name: 'Larry', title: 'Lab Manager', description: 'Manages lab schedules and inventory' },
    mary: { name: 'Mary', title: 'Collaboration Coordinator', description: 'Coordinates research collaborations' },
    sam: { name: 'Sam', title: 'Literature Reviewer', description: 'Reviews scientific literature' },
    emma: { name: 'Emma', title: 'Data Recorder', description: 'Records and organizes data' },
    alex: { name: 'Alex', title: 'Statistical Analyst', description: 'Performs statistical analysis' },
    pat: { name: 'Pat', title: 'Protocol Writer', description: 'Documents research protocols' },
    jordan: { name: 'Jordan', title: 'Visualization Creator', description: 'Creates data visualizations' },
    nexus: { name: 'Nexus', title: 'Your Research Partner', description: 'Orchestrates your research workflow' },
  },
  chef: {
    larry: { name: 'Larry', title: 'Inventory Manager', description: 'Manages food inventory' },
    mary: { name: 'Mary', title: 'Reservation Handler', description: 'Manages reservations' },
    sam: { name: 'Sam', title: 'Recipe Developer', description: 'Helps develop recipes' },
    emma: { name: 'Emma', title: 'Menu Planner', description: 'Plans menus and specials' },
    alex: { name: 'Alex', title: 'Cost Analyst', description: 'Tracks food costs and margins' },
    pat: { name: 'Pat', title: 'Supplier Coordinator', description: 'Manages supplier relationships' },
    jordan: { name: 'Jordan', title: 'Plating Designer', description: 'Designs plate presentations' },
    nexus: { name: 'Nexus', title: 'Your Kitchen Partner', description: 'Orchestrates your kitchen operations' },
  },
  fitness: {
    larry: { name: 'Larry', title: 'Schedule Manager', description: 'Manages class and session schedules' },
    mary: { name: 'Mary', title: 'Client Communicator', description: 'Handles client communications' },
    sam: { name: 'Sam', title: 'Workout Designer', description: 'Designs workout programs' },
    emma: { name: 'Emma', title: 'Nutrition Advisor', description: 'Provides nutrition guidance' },
    alex: { name: 'Alex', title: 'Progress Tracker', description: 'Tracks client progress and goals' },
    pat: { name: 'Pat', title: 'Membership Manager', description: 'Manages memberships and payments' },
    jordan: { name: 'Jordan', title: 'Content Creator', description: 'Creates fitness content' },
    nexus: { name: 'Nexus', title: 'Your Fitness Partner', description: 'Orchestrates your fitness business' },
  },
  ecommerce: {
    larry: { name: 'Larry', title: 'Order Manager', description: 'Manages orders and fulfillment' },
    mary: { name: 'Mary', title: 'Customer Support', description: 'Handles customer inquiries' },
    sam: { name: 'Sam', title: 'Product Lister', description: 'Creates product listings' },
    emma: { name: 'Emma', title: 'Inventory Tracker', description: 'Tracks inventory levels' },
    alex: { name: 'Alex', title: 'Sales Analyst', description: 'Analyzes sales and trends' },
    pat: { name: 'Pat', title: 'Shipping Coordinator', description: 'Coordinates shipping and returns' },
    jordan: { name: 'Jordan', title: 'Marketing Assistant', description: 'Creates marketing content' },
    nexus: { name: 'Nexus', title: 'Your E-commerce Partner', description: 'Orchestrates your online store' },
  },
  // Custom & Default
  custom: {
    larry: { name: 'Larry', title: 'Task Manager', description: 'Helps organize and complete tasks' },
    mary: { name: 'Mary', title: 'Communications', description: 'Handles emails and messages' },
    sam: { name: 'Sam', title: 'Research Assistant', description: 'Finds information and answers' },
    emma: { name: 'Emma', title: 'Scheduler', description: 'Manages calendar and appointments' },
    alex: { name: 'Alex', title: 'Data Analyst', description: 'Analyzes data and creates reports' },
    pat: { name: 'Pat', title: 'Document Manager', description: 'Organizes files and documents' },
    jordan: { name: 'Jordan', title: 'Creative Assistant', description: 'Helps with creative projects' },
    nexus: { name: 'Nexus', title: 'Your AI Partner', description: 'Tailored to your unique needs' },
  },
  general: {
    larry: { name: 'Larry', title: 'Task Manager', description: 'Helps organize and complete tasks' },
    mary: { name: 'Mary', title: 'Communications', description: 'Handles emails and messages' },
    sam: { name: 'Sam', title: 'Research Assistant', description: 'Finds information and answers' },
    emma: { name: 'Emma', title: 'Scheduler', description: 'Manages calendar and appointments' },
    alex: { name: 'Alex', title: 'Data Analyst', description: 'Analyzes data and creates reports' },
    pat: { name: 'Pat', title: 'Document Manager', description: 'Organizes files and documents' },
    jordan: { name: 'Jordan', title: 'Creative Assistant', description: 'Helps with creative projects' },
    nexus: { name: 'Nexus', title: 'Your AI Team Lead', description: 'Orchestrates your entire AI team' },
  },
}

// ============================================================================
// CONTEXT DEFINITION
// ============================================================================

interface PersonalizationContextType {
  // Current persona
  persona: PersonaType
  personaInfo: PersonaInfo
  setPersona: (persona: PersonaType, customLabel?: string) => void

  // Custom persona support
  customPersonaLabel: string | null
  setCustomPersonaLabel: (label: string) => void

  // Agent names based on persona
  getAgentInfo: (agentId: string) => { name: string; title: string; description: string }
  agentNames: AgentNames

  // Terminology helpers
  term: (key: 'workflow' | 'task' | 'team' | 'results') => string

  // Convenience methods
  isOnboarded: boolean
  setOnboarded: (value: boolean) => void
  resetPersonalization: () => void
}

const PersonalizationContext = createContext<PersonalizationContextType | null>(null)

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface PersonalizationProviderProps {
  children: ReactNode
}

const STORAGE_KEY = 'nexus_persona'
const ONBOARDED_KEY = 'nexus_onboarding_complete'
const CUSTOM_PERSONA_KEY = 'nexus_custom_persona_label'

export function PersonalizationProvider({ children }: PersonalizationProviderProps) {
  const [persona, setPersonaState] = useState<PersonaType>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return (stored as PersonaType) || 'general'
  })

  const [customPersonaLabel, setCustomPersonaLabelState] = useState<string | null>(() => {
    return localStorage.getItem(CUSTOM_PERSONA_KEY)
  })

  const [isOnboarded, setIsOnboarded] = useState(() => {
    return localStorage.getItem(ONBOARDED_KEY) === 'true'
  })

  // Get personaInfo with custom label override for custom persona
  const personaInfo = persona === 'custom' && customPersonaLabel
    ? { ...PERSONA_DEFINITIONS[persona], label: customPersonaLabel, description: `Professional: ${customPersonaLabel}` }
    : PERSONA_DEFINITIONS[persona]
  const agentNames = AGENT_NAMES_BY_PERSONA[persona]

  const setPersona = useCallback((newPersona: PersonaType, customLabel?: string) => {
    setPersonaState(newPersona)
    localStorage.setItem(STORAGE_KEY, newPersona)
    if (newPersona === 'custom' && customLabel) {
      setCustomPersonaLabelState(customLabel)
      localStorage.setItem(CUSTOM_PERSONA_KEY, customLabel)
    }
  }, [])

  const setCustomPersonaLabel = useCallback((label: string) => {
    setCustomPersonaLabelState(label)
    localStorage.setItem(CUSTOM_PERSONA_KEY, label)
  }, [])

  const setOnboarded = useCallback((value: boolean) => {
    setIsOnboarded(value)
    localStorage.setItem(ONBOARDED_KEY, String(value))
  }, [])

  const getAgentInfo = useCallback((agentId: string) => {
    const names = AGENT_NAMES_BY_PERSONA[persona]
    const key = agentId.toLowerCase() as keyof AgentNames
    return names[key] || {
      name: agentId,
      title: 'AI Assistant',
      description: 'Your helpful AI assistant'
    }
  }, [persona])

  const term = useCallback((key: 'workflow' | 'task' | 'team' | 'results'): string => {
    const info = PERSONA_DEFINITIONS[persona]
    switch (key) {
      case 'workflow': return info.workflowTerm
      case 'task': return info.taskTerm
      case 'team': return info.teamTerm
      case 'results': return info.resultsTerm
      default: return key
    }
  }, [persona])

  const resetPersonalization = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(ONBOARDED_KEY)
    localStorage.removeItem(CUSTOM_PERSONA_KEY)
    localStorage.removeItem('nexus_user_goal')
    localStorage.removeItem('nexus_connected_integrations')
    setPersonaState('general')
    setCustomPersonaLabelState(null)
    setIsOnboarded(false)
  }, [])

  // Sync with localStorage on mount
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setPersonaState(e.newValue as PersonaType)
      }
      if (e.key === ONBOARDED_KEY) {
        setIsOnboarded(e.newValue === 'true')
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  return (
    <PersonalizationContext.Provider value={{
      persona,
      personaInfo,
      setPersona,
      customPersonaLabel,
      setCustomPersonaLabel,
      getAgentInfo,
      agentNames,
      term,
      isOnboarded,
      setOnboarded,
      resetPersonalization,
    }}>
      {children}
    </PersonalizationContext.Provider>
  )
}

// ============================================================================
// HOOK
// ============================================================================

export function usePersonalization() {
  const context = useContext(PersonalizationContext)
  if (!context) {
    throw new Error('usePersonalization must be used within a PersonalizationProvider')
  }
  return context
}

// ============================================================================
// SELECTABLE PERSONAS FOR ONBOARDING (organized by category)
// ============================================================================

export interface PersonaCategory {
  id: string
  label: string
  icon: string
  personas: PersonaType[]
}

export const PERSONA_CATEGORIES: PersonaCategory[] = [
  {
    id: 'tech',
    label: 'Tech & Business',
    icon: '💻',
    personas: ['developer', 'founder', 'executive', 'manager', 'consultant'],
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    icon: '🏥',
    personas: ['doctor', 'nurse', 'therapist'],
  },
  {
    id: 'legal_finance',
    label: 'Legal & Finance',
    icon: '⚖️',
    personas: ['lawyer', 'paralegal', 'accountant', 'financial_advisor', 'banker'],
  },
  {
    id: 'sales_service',
    label: 'Sales & Service',
    icon: '🤝',
    personas: ['sales', 'recruiter', 'realtor', 'property_manager'],
  },
  {
    id: 'creative',
    label: 'Creative',
    icon: '🎨',
    personas: ['creator', 'designer', 'photographer', 'writer'],
  },
  {
    id: 'education',
    label: 'Education',
    icon: '📚',
    personas: ['teacher', 'professor', 'student'],
  },
  {
    id: 'other',
    label: 'Other Professionals',
    icon: '🌟',
    personas: ['engineer', 'scientist', 'chef', 'fitness', 'ecommerce', 'marketer', 'freelancer'],
  },
]

// All selectable personas (flat list for backward compatibility)
export const ONBOARDING_PERSONAS: PersonaType[] = [
  // Tech & Business
  'developer', 'founder', 'executive', 'manager', 'consultant',
  // Healthcare
  'doctor', 'nurse', 'therapist',
  // Legal & Finance
  'lawyer', 'paralegal', 'accountant', 'financial_advisor', 'banker',
  // Sales & Service
  'sales', 'recruiter', 'realtor', 'property_manager',
  // Creative
  'creator', 'designer', 'photographer', 'writer',
  // Education
  'teacher', 'professor', 'student',
  // Other
  'engineer', 'scientist', 'chef', 'fitness', 'ecommerce', 'marketer', 'freelancer',
]
