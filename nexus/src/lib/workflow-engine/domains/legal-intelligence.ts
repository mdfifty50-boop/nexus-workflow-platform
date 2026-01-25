/**
 * Nexus Legal Domain Intelligence Module
 *
 * Provides comprehensive legal workflow intelligence including:
 * - Contract drafting and lifecycle management
 * - Contract review and negotiation workflows
 * - Compliance assessment and documentation
 * - Intellectual property management
 * - Privacy compliance (GDPR/Kuwait requirements)
 * - Dispute resolution workflows
 * - Legal research automation
 *
 * Regional Focus: Kuwait/Gulf with Civil Law system based on Egyptian/French model,
 * Kuwait Commercial Companies Law, and specific court system requirements.
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

export interface LegalWorkflowPattern {
  name: string;
  description: string;
  layers: ('input' | 'processing' | 'output' | 'notification')[];
  steps: string[];
  implicitNeeds: string[];
  questions: string[];
  complianceRequirements: string[];
  estimatedROI: string;
}

export interface LegalRegionalContext {
  region: string;
  legalSystem: string;
  contractLanguage: string;
  commercialLaw: string;
  laborLaw: string;
  dataProtection: string;
  arbitration: string;
  courtSystem: string;
  notarization: string;
  trademarkAuthority: string;
  statuteOfLimitations: Record<string, number>;
  businessDays: string;
  complianceRequirements: string[];
}

export interface ContractExpiryAlert {
  contractId?: string;
  expiryDate: Date;
  noticePeriodDays: number;
  alertDate: Date;
  daysUntilExpiry: number;
  daysUntilNoticeDeadline: number;
  urgencyLevel: 'critical' | 'warning' | 'normal';
  recommendedActions: string[];
}

export interface StatuteOfLimitationsResult {
  claimType: string;
  jurisdiction: string;
  limitationPeriodYears: number;
  deadlineDate: Date;
  daysRemaining: number;
  notes: string[];
}

export interface LegalAnalysisResult {
  pattern: string | null;
  requirements: ImplicitRequirement[];
  tools: ToolRecommendation[];
  questions: ClarifyingQuestion[];
  regionalContext: LegalRegionalContext | null;
  riskAssessment: LegalRiskAssessment | null;
}

export interface LegalRiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  mitigationRecommendations: string[];
}

export interface RiskFactor {
  category: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigationStrategy: string;
}

// ============================================================================
// LEGAL WORKFLOW PATTERNS
// ============================================================================

export const LEGAL_WORKFLOW_PATTERNS: Record<string, LegalWorkflowPattern> = {
  // Contract Drafting Pattern
  contract_drafting: {
    name: 'Contract Drafting',
    description: 'End-to-end contract creation from template selection to finalization',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'select_template',
      'gather_requirements',
      'customize_clauses',
      'review_legal_terms',
      'verify_compliance',
      'generate_draft',
      'internal_review',
      'finalize_document',
    ],
    implicitNeeds: [
      'Contract template library with jurisdiction-specific templates',
      'Clause library with approved language variations',
      'Jurisdiction and governing law verification',
      'Party information validation',
      'Compliance checklist generation',
      'Legal review workflow routing',
      'Version control and audit trail',
      'Bilingual support (Arabic/English for Kuwait)',
    ],
    questions: [
      'What type of contract are you drafting?',
      'Which jurisdiction governs this contract?',
      'What language(s) should the contract be in?',
      'Who needs to approve the draft?',
      'Are there specific compliance requirements?',
    ],
    complianceRequirements: [
      'Arabic language requirement for Kuwait courts',
      'Notarization requirements per contract type',
      'Commercial registration reference',
      'Proper identification of contracting parties',
    ],
    estimatedROI: 'Reduces contract drafting time by 60%, ensures consistency across agreements',
  },

  // Contract Review Pattern
  contract_review: {
    name: 'Contract Review',
    description: 'Comprehensive review of contracts for risks, compliance, and favorable terms',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'receive_contract',
      'extract_key_terms',
      'identify_risks',
      'compare_standards',
      'flag_deviations',
      'generate_redlines',
      'route_approval',
      'complete_review',
    ],
    implicitNeeds: [
      'Contract intake mechanism (email, upload)',
      'AI/ML term extraction and analysis',
      'Risk identification engine',
      'Standard terms comparison database',
      'Redline generation capability',
      'Multi-tier approval workflow',
      'Comment and annotation system',
      'Deadline and SLA tracking',
    ],
    questions: [
      'Is this a new contract or renewal?',
      'What is your role (buyer/seller/service provider)?',
      'What are the key terms to focus on?',
      'What risk tolerance level is acceptable?',
      'Who needs to review the redlines?',
    ],
    complianceRequirements: [
      'Verify proper Arabic translation if required',
      'Check governing law alignment with business',
      'Validate dispute resolution mechanism',
      'Ensure commercial registration validity',
    ],
    estimatedROI: 'Reduces review time by 70%, identifies 95% more risks than manual review',
  },

  // Contract Negotiation Pattern
  contract_negotiation: {
    name: 'Contract Negotiation',
    description: 'Structured negotiation workflow with position tracking and approval gates',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'receive_counterparty_version',
      'compare_versions',
      'identify_changes',
      'assess_acceptability',
      'prepare_response',
      'track_positions',
      'escalate_if_needed',
      'finalize_agreement',
    ],
    implicitNeeds: [
      'Version comparison engine',
      'Change tracking and highlighting',
      'Position tracking database',
      'Approval authority matrix',
      'Negotiation playbook integration',
      'Communication templates',
      'Deadline management',
      'Deal terms database',
    ],
    questions: [
      'What negotiation round is this?',
      'What are the non-negotiable terms?',
      'What is the maximum acceptable deviation?',
      'Who has authority to accept terms?',
      'What is the deadline for agreement?',
    ],
    complianceRequirements: [
      'Document all negotiation communications',
      'Maintain clear authority records',
      'Track changes per negotiation round',
    ],
    estimatedROI: 'Accelerates negotiation cycles by 50%, improves outcome tracking',
  },

  // Contract Signature Pattern
  contract_signature: {
    name: 'Contract Signature',
    description: 'Digital and wet signature collection workflow with authentication',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'prepare_final_document',
      'identify_signatories',
      'verify_authority',
      'send_for_signature',
      'collect_signatures',
      'authenticate_signatures',
      'distribute_executed_copy',
      'archive_document',
    ],
    implicitNeeds: [
      'E-signature platform integration',
      'Signatory verification system',
      'Authority validation',
      'Signature routing logic',
      'Authentication mechanisms',
      'Document finalization',
      'Distribution system',
      'Secure archival',
    ],
    questions: [
      'How many signatories are required?',
      'Is e-signature acceptable or wet signature required?',
      'What authentication level is needed?',
      'Where should executed copies be stored?',
      'Who should receive notifications?',
    ],
    complianceRequirements: [
      'E-signature validity per Kuwait law',
      'Notarization if required by contract type',
      'Proper witness requirements',
      'Authentication for government filings',
    ],
    estimatedROI: 'Reduces signature cycle from days to hours, eliminates lost documents',
  },

  // Contract Storage Pattern
  contract_storage: {
    name: 'Contract Storage',
    description: 'Secure contract repository with metadata, search, and lifecycle management',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'receive_executed_contract',
      'extract_metadata',
      'classify_contract',
      'index_key_terms',
      'set_obligations',
      'configure_alerts',
      'store_securely',
      'enable_search',
    ],
    implicitNeeds: [
      'Secure document repository',
      'OCR/AI metadata extraction',
      'Classification taxonomy',
      'Full-text search capability',
      'Obligation tracking system',
      'Alert configuration',
      'Access control management',
      'Retention policy enforcement',
    ],
    questions: [
      'What classification categories do you use?',
      'What metadata fields are required?',
      'What are your retention requirements?',
      'Who should have access to contracts?',
      'What obligations need tracking?',
    ],
    complianceRequirements: [
      'Minimum 10-year retention for commercial contracts',
      'Secure access controls',
      'Audit trail requirements',
      'Arabic document handling',
    ],
    estimatedROI: 'Enables instant contract retrieval, ensures 100% obligation compliance',
  },

  // Compliance Assessment Pattern
  compliance_assessment: {
    name: 'Compliance Assessment',
    description: 'Systematic evaluation of regulatory compliance status and gaps',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'identify_requirements',
      'gather_evidence',
      'assess_controls',
      'identify_gaps',
      'calculate_risk_scores',
      'generate_findings',
      'create_remediation_plan',
      'track_progress',
    ],
    implicitNeeds: [
      'Regulatory requirements database',
      'Evidence collection system',
      'Control assessment framework',
      'Gap analysis engine',
      'Risk scoring methodology',
      'Findings documentation',
      'Remediation tracking',
      'Progress reporting',
    ],
    questions: [
      'What regulations need to be assessed?',
      'What is the assessment scope?',
      'Who are the control owners?',
      'What evidence is available?',
      'What is the remediation timeline?',
    ],
    complianceRequirements: [
      'Kuwait Commercial Companies Law compliance',
      'Ministry of Commerce requirements',
      'Industry-specific regulations',
      'Labor law compliance',
    ],
    estimatedROI: 'Reduces compliance assessment time by 60%, ensures comprehensive coverage',
  },

  // Compliance Documentation Pattern
  compliance_documentation: {
    name: 'Compliance Documentation',
    description: 'Creation and maintenance of compliance policies, procedures, and records',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'identify_documentation_needs',
      'draft_policies',
      'review_approve_policies',
      'publish_documentation',
      'train_stakeholders',
      'maintain_records',
      'version_control',
      'audit_readiness',
    ],
    implicitNeeds: [
      'Policy template library',
      'Approval workflow engine',
      'Document management system',
      'Training tracking',
      'Record retention system',
      'Version control',
      'Audit support tools',
      'Bilingual documentation',
    ],
    questions: [
      'What compliance areas need documentation?',
      'Who approves policies?',
      'What format should documents be in?',
      'Who needs access to documentation?',
      'What is the review frequency?',
    ],
    complianceRequirements: [
      'Arabic documentation for local filings',
      'Proper authorization records',
      'Evidence of communication/training',
      'Retention per regulatory requirements',
    ],
    estimatedROI: 'Ensures audit readiness, reduces documentation creation by 50%',
  },

  // Audit Preparation Pattern
  audit_preparation: {
    name: 'Audit Preparation',
    description: 'Systematic preparation for internal, external, or regulatory audits',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'receive_audit_scope',
      'identify_requirements',
      'gather_documentation',
      'validate_completeness',
      'organize_materials',
      'brief_stakeholders',
      'manage_requests',
      'track_findings',
    ],
    implicitNeeds: [
      'Audit scope management',
      'Request tracking system',
      'Document collection workflow',
      'Completeness checklist',
      'Stakeholder communication',
      'Finding tracking',
      'Response management',
      'Remediation tracking',
    ],
    questions: [
      'What type of audit is being conducted?',
      'What is the audit timeline?',
      'Who is the audit lead?',
      'What documentation is typically requested?',
      'Are there prior audit findings to address?',
    ],
    complianceRequirements: [
      'Maintain complete audit trails',
      'Ensure document authenticity',
      'Proper authorization documentation',
      'Timely response protocols',
    ],
    estimatedROI: 'Reduces audit preparation time by 70%, improves audit outcomes',
  },

  // IP Registration Pattern
  ip_registration: {
    name: 'IP Registration',
    description: 'Intellectual property registration workflow including trademarks and patents',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'identify_ip_asset',
      'conduct_search',
      'prepare_application',
      'file_application',
      'respond_to_office_actions',
      'track_prosecution',
      'receive_registration',
      'maintain_records',
    ],
    implicitNeeds: [
      'IP asset identification',
      'Prior art/trademark search',
      'Application preparation tools',
      'Filing system integration',
      'Docket management',
      'Deadline tracking',
      'Response generation',
      'Portfolio management',
    ],
    questions: [
      'What type of IP are you registering?',
      'In which jurisdictions?',
      'Has a prior search been conducted?',
      'What is the priority claim basis?',
      'Who manages IP prosecution?',
    ],
    complianceRequirements: [
      'Ministry of Commerce and Industry filing',
      'Arabic translation requirements',
      'GCC trademark registration process',
      'Proper power of attorney',
    ],
    estimatedROI: 'Ensures deadline compliance, accelerates registration by 30%',
  },

  // Trademark Renewal Pattern
  trademark_renewal: {
    name: 'Trademark Renewal',
    description: 'Automated trademark renewal tracking and filing workflow',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'monitor_deadlines',
      'identify_due_renewals',
      'verify_use_status',
      'prepare_renewal',
      'file_renewal',
      'pay_fees',
      'confirm_renewal',
      'update_records',
    ],
    implicitNeeds: [
      'Deadline monitoring system',
      'Use verification workflow',
      'Renewal preparation tools',
      'Filing integration',
      'Payment processing',
      'Confirmation tracking',
      'Portfolio update',
      'Multi-jurisdiction support',
    ],
    questions: [
      'How many trademarks need monitoring?',
      'Which jurisdictions are involved?',
      'What is the advance notice period needed?',
      'Who approves renewal decisions?',
      'Are any marks subject to non-use cancellation risk?',
    ],
    complianceRequirements: [
      'Kuwait 10-year renewal period',
      'GCC harmonized renewal process',
      'Use affidavit requirements',
      'Proper fee payment documentation',
    ],
    estimatedROI: 'Prevents 100% of missed renewal deadlines, reduces renewal costs by 20%',
  },

  // Patent Filing Pattern
  patent_filing: {
    name: 'Patent Filing',
    description: 'Patent application preparation and prosecution workflow',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'receive_invention_disclosure',
      'conduct_patentability_search',
      'assess_patentability',
      'draft_application',
      'file_application',
      'prosecute_application',
      'respond_to_examination',
      'obtain_grant',
    ],
    implicitNeeds: [
      'Invention disclosure system',
      'Prior art search tools',
      'Patentability assessment',
      'Application drafting support',
      'Filing system integration',
      'Prosecution tracking',
      'Deadline management',
      'Cost estimation',
    ],
    questions: [
      'What is the invention field?',
      'Which jurisdictions are priority?',
      'What is the prior art landscape?',
      'What is the filing strategy (PCT, national)?',
      'What budget is available?',
    ],
    complianceRequirements: [
      'Kuwait Industrial Property Law compliance',
      'GCC Patent Office filing requirements',
      'Arabic translation for regional filing',
      'Inventor declaration requirements',
    ],
    estimatedROI: 'Reduces filing preparation time by 40%, improves examination success',
  },

  // Dispute Resolution Pattern
  dispute_resolution: {
    name: 'Dispute Resolution',
    description: 'Structured workflow for managing legal disputes and resolution processes',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'receive_dispute_notice',
      'assess_dispute',
      'gather_facts',
      'evaluate_options',
      'engage_resolution',
      'negotiate_settlement',
      'escalate_if_needed',
      'document_resolution',
    ],
    implicitNeeds: [
      'Dispute intake system',
      'Case assessment framework',
      'Evidence management',
      'Legal research access',
      'Settlement negotiation tools',
      'Arbitration/litigation support',
      'Resolution tracking',
      'Outcome documentation',
    ],
    questions: [
      'What is the nature of the dispute?',
      'What is the dispute value?',
      'What resolution mechanism is specified?',
      'What is the preferred outcome?',
      'What documentation is available?',
    ],
    complianceRequirements: [
      'Kuwait court procedural requirements',
      'KCCI arbitration rules',
      'Limitation period compliance',
      'Proper legal representation requirements',
    ],
    estimatedROI: 'Improves resolution outcomes by 40%, reduces dispute cycle time by 50%',
  },

  // Legal Research Pattern
  legal_research: {
    name: 'Legal Research',
    description: 'Automated legal research and analysis workflow',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'receive_research_request',
      'identify_issues',
      'search_authorities',
      'analyze_findings',
      'synthesize_results',
      'draft_memo',
      'review_quality',
      'deliver_research',
    ],
    implicitNeeds: [
      'Research request intake',
      'Issue identification',
      'Legal database access',
      'AI-powered analysis',
      'Citation management',
      'Memo drafting tools',
      'Quality review workflow',
      'Knowledge management',
    ],
    questions: [
      'What is the research question?',
      'Which jurisdictions are relevant?',
      'What is the required depth?',
      'What format should the output be?',
      'What is the deadline?',
    ],
    complianceRequirements: [
      'Access to Kuwait legal database',
      'GCC regional law coverage',
      'Citation verification',
      'Confidentiality requirements',
    ],
    estimatedROI: 'Reduces research time by 70%, improves research comprehensiveness',
  },

  // Privacy Compliance Pattern
  privacy_compliance: {
    name: 'Privacy Compliance',
    description: 'Data privacy compliance management including GDPR and regional requirements',
    layers: ['input', 'processing', 'processing', 'output', 'notification'],
    steps: [
      'identify_data_processing',
      'map_data_flows',
      'assess_legal_basis',
      'implement_controls',
      'document_compliance',
      'manage_requests',
      'monitor_compliance',
      'report_incidents',
    ],
    implicitNeeds: [
      'Data inventory system',
      'Data flow mapping tools',
      'Legal basis assessment',
      'Control implementation tracking',
      'Documentation repository',
      'DSR management system',
      'Compliance monitoring',
      'Incident response system',
    ],
    questions: [
      'What personal data is processed?',
      'Which regulations apply (GDPR, local)?',
      'What is the data processing volume?',
      'How are data subject requests handled?',
      'What incident response process exists?',
    ],
    complianceRequirements: [
      'GDPR compliance for EU data subjects',
      'Kuwait data localization (pending law)',
      'Cross-border transfer requirements',
      'Consent management requirements',
    ],
    estimatedROI: 'Reduces privacy incident risk by 80%, ensures regulatory compliance',
  },

  // Consent Management Pattern
  consent_management: {
    name: 'Consent Management',
    description: 'Systematic collection, tracking, and management of user consents',
    layers: ['input', 'processing', 'output', 'notification'],
    steps: [
      'define_consent_requirements',
      'design_consent_flows',
      'collect_consents',
      'record_consents',
      'manage_preferences',
      'process_withdrawals',
      'audit_consents',
      'report_status',
    ],
    implicitNeeds: [
      'Consent requirements definition',
      'Consent collection UI/UX',
      'Consent database',
      'Preference management',
      'Withdrawal processing',
      'Audit trail maintenance',
      'Reporting capabilities',
      'Integration with data systems',
    ],
    questions: [
      'What types of consent are needed?',
      'What channels collect consent?',
      'How should preferences be managed?',
      'What is the consent validity period?',
      'How should withdrawals be processed?',
    ],
    complianceRequirements: [
      'Granular consent capture',
      'Withdrawal mechanism required',
      'Evidence preservation',
      'Integration with marketing systems',
    ],
    estimatedROI: 'Ensures 100% consent compliance, reduces legal exposure',
  },
};

// ============================================================================
// LEGAL KEYWORDS FOR PATTERN DETECTION
// ============================================================================

export const LEGAL_KEYWORDS: Record<string, string[]> = {
  contract_drafting: [
    'contract', 'draft', 'drafting', 'agreement', 'create agreement',
    'new contract', 'template', 'clause', 'terms', 'conditions',
    'عقد', 'صياغة', 'اتفاقية', 'شروط'
  ],

  contract_review: [
    'review', 'analyze', 'check contract', 'risk assessment', 'redline',
    'review agreement', 'contract analysis', 'due diligence', 'examine',
    'مراجعة', 'تحليل', 'فحص'
  ],

  contract_negotiation: [
    'negotiate', 'negotiation', 'counteroffer', 'terms discussion',
    'bargain', 'settlement', 'compromise', 'position', 'concession',
    'تفاوض', 'مفاوضة'
  ],

  contract_signature: [
    'sign', 'signature', 'execute', 'e-sign', 'esign', 'docusign',
    'wet signature', 'signatory', 'countersign', 'authentication',
    'توقيع', 'إمضاء'
  ],

  contract_storage: [
    'store', 'storage', 'repository', 'archive', 'clm', 'contract management',
    'organize contracts', 'contract database', 'filing', 'retention',
    'حفظ', 'أرشفة', 'تخزين'
  ],

  compliance_assessment: [
    'compliance', 'assess', 'assessment', 'audit', 'regulation',
    'regulatory', 'gap analysis', 'controls', 'requirements',
    'امتثال', 'تقييم', 'رقابة'
  ],

  compliance_documentation: [
    'policy', 'policies', 'procedure', 'procedures', 'documentation',
    'compliance documents', 'handbook', 'guidelines', 'standards',
    'سياسة', 'سياسات', 'إجراءات'
  ],

  audit_preparation: [
    'audit', 'auditor', 'examination', 'inspection', 'audit preparation',
    'audit readiness', 'audit response', 'findings', 'remediation',
    'تدقيق', 'مراجعة حسابات', 'فحص'
  ],

  ip_registration: [
    'ip', 'intellectual property', 'register', 'registration',
    'trademark', 'patent', 'copyright', 'trade secret', 'filing',
    'ملكية فكرية', 'علامة تجارية', 'براءة اختراع'
  ],

  trademark_renewal: [
    'trademark', 'renewal', 'renew', 'trademark renewal', 'maintain',
    'maintenance', 'deadline', 'expiration', 'fee',
    'تجديد', 'علامة تجارية'
  ],

  patent_filing: [
    'patent', 'invention', 'file patent', 'patent application',
    'prior art', 'claims', 'prosecution', 'grant',
    'براءة', 'اختراع', 'طلب براءة'
  ],

  dispute_resolution: [
    'dispute', 'litigation', 'arbitration', 'mediation', 'lawsuit',
    'claim', 'settlement', 'court', 'tribunal', 'resolution',
    'نزاع', 'تحكيم', 'وساطة', 'دعوى'
  ],

  legal_research: [
    'research', 'legal research', 'case law', 'precedent', 'statute',
    'regulation', 'memo', 'analysis', 'opinion', 'jurisdiction',
    'بحث قانوني', 'سوابق قضائية'
  ],

  privacy_compliance: [
    'privacy', 'data protection', 'gdpr', 'personal data', 'data privacy',
    'data subject', 'dpo', 'data breach', 'pii', 'sensitive data',
    'خصوصية', 'حماية البيانات'
  ],

  consent_management: [
    'consent', 'permission', 'opt-in', 'opt-out', 'preference',
    'consent management', 'withdrawal', 'cookie', 'marketing consent',
    'موافقة', 'إذن'
  ],
};

// ============================================================================
// LEGAL IMPLICIT REQUIREMENTS
// ============================================================================

export const LEGAL_IMPLICIT_REQUIREMENTS: Record<string, ImplicitRequirement[]> = {
  contract_drafting: [
    {
      category: 'input',
      description: 'Contract template library with jurisdiction-specific templates',
      reason: 'Ensures contracts comply with local law requirements and include standard provisions',
      priority: 'critical',
      suggestedTools: ['ContractPodAi', 'Ironclad', 'Juro', 'PandaDoc'],
    },
    {
      category: 'input',
      description: 'Clause library with pre-approved language variations',
      reason: 'Accelerates drafting and ensures consistent, approved language across contracts',
      priority: 'critical',
      suggestedTools: ['ContractPodAi', 'Clause Library', 'Kira Systems'],
    },
    {
      category: 'processing',
      description: 'Jurisdiction and governing law verification',
      reason: 'Contract enforceability depends on proper governing law selection',
      priority: 'critical',
      suggestedTools: ['Legal research tools', 'Jurisdiction mapping'],
    },
    {
      category: 'processing',
      description: 'Party information validation',
      reason: 'Valid contracts require proper party identification and capacity verification',
      priority: 'important',
      suggestedTools: ['CRM integration', 'Company registry lookup'],
    },
    {
      category: 'processing',
      description: 'Bilingual contract generation (Arabic/English)',
      reason: 'Kuwait courts require Arabic; business often conducted in English',
      priority: 'important',
      suggestedTools: ['Translation services', 'Bilingual templates'],
    },
    {
      category: 'output',
      description: 'Version control and audit trail',
      reason: 'Track changes and maintain complete drafting history for compliance',
      priority: 'important',
      suggestedTools: ['Document management system', 'Git-like versioning'],
    },
    {
      category: 'notification',
      description: 'Review and approval workflow notifications',
      reason: 'Ensures timely review and prevents bottlenecks in contract approval',
      priority: 'optional',
      suggestedTools: ['Slack', 'Email', 'Microsoft Teams'],
    },
  ],

  contract_review: [
    {
      category: 'input',
      description: 'Contract intake mechanism (email, upload)',
      reason: 'Centralized contract submission for consistent review process',
      priority: 'critical',
      suggestedTools: ['Email parser', 'Upload portal', 'Ironclad'],
    },
    {
      category: 'processing',
      description: 'AI/ML term extraction and analysis',
      reason: 'Automates identification of key terms and reduces manual review time',
      priority: 'critical',
      suggestedTools: ['Kira Systems', 'Luminance', 'Evisort', 'LawGeex'],
    },
    {
      category: 'processing',
      description: 'Risk identification engine',
      reason: 'Flags potentially problematic clauses and deviations from standards',
      priority: 'critical',
      suggestedTools: ['LawGeex', 'Luminance', 'ContractPodAi'],
    },
    {
      category: 'processing',
      description: 'Standard terms comparison database',
      reason: 'Compares incoming terms against organizational standards and playbook',
      priority: 'important',
      suggestedTools: ['Playbook database', 'Clause comparison tools'],
    },
    {
      category: 'output',
      description: 'Redline generation capability',
      reason: 'Produces marked-up documents showing requested changes',
      priority: 'critical',
      suggestedTools: ['Word Track Changes', 'DocuSign CLM', 'Ironclad'],
    },
    {
      category: 'notification',
      description: 'Deadline and SLA tracking',
      reason: 'Ensures contracts are reviewed within required timeframes',
      priority: 'important',
      suggestedTools: ['Task management', 'Calendar integration'],
    },
  ],

  contract_negotiation: [
    {
      category: 'input',
      description: 'Version comparison engine',
      reason: 'Quickly identifies changes between contract versions',
      priority: 'critical',
      suggestedTools: ['Compare tools', 'Document comparison', 'Litera'],
    },
    {
      category: 'processing',
      description: 'Position tracking database',
      reason: 'Maintains record of negotiation positions and outcomes',
      priority: 'important',
      suggestedTools: ['CRM', 'Deal tracking', 'Notion'],
    },
    {
      category: 'processing',
      description: 'Approval authority matrix',
      reason: 'Ensures proper approval for negotiated terms based on authority levels',
      priority: 'critical',
      suggestedTools: ['Approval workflow', 'Authority database'],
    },
    {
      category: 'processing',
      description: 'Negotiation playbook integration',
      reason: 'Guides negotiators with approved fallback positions and limits',
      priority: 'important',
      suggestedTools: ['Playbook system', 'Knowledge base'],
    },
    {
      category: 'output',
      description: 'Communication templates',
      reason: 'Standardizes negotiation communications and maintains professionalism',
      priority: 'optional',
      suggestedTools: ['Email templates', 'Response library'],
    },
    {
      category: 'notification',
      description: 'Deadline management alerts',
      reason: 'Prevents missed negotiation deadlines and response windows',
      priority: 'important',
      suggestedTools: ['Calendar', 'Task management', 'Slack reminders'],
    },
  ],

  contract_signature: [
    {
      category: 'input',
      description: 'E-signature platform integration',
      reason: 'Enables efficient digital signature collection',
      priority: 'critical',
      suggestedTools: ['DocuSign', 'Adobe Sign', 'SignNow', 'HelloSign'],
    },
    {
      category: 'processing',
      description: 'Signatory verification system',
      reason: 'Confirms identity and authority of signatories',
      priority: 'critical',
      suggestedTools: ['ID verification', 'KYC tools', 'Authority database'],
    },
    {
      category: 'processing',
      description: 'Authority validation',
      reason: 'Ensures signatories have proper authority to bind organization',
      priority: 'critical',
      suggestedTools: ['Board resolution lookup', 'Delegation matrix'],
    },
    {
      category: 'processing',
      description: 'Signature routing logic',
      reason: 'Routes document to signatories in correct order',
      priority: 'important',
      suggestedTools: ['Workflow engine', 'DocuSign routing'],
    },
    {
      category: 'output',
      description: 'Document finalization',
      reason: 'Locks document and prevents post-signature modifications',
      priority: 'critical',
      suggestedTools: ['PDF security', 'Document sealing'],
    },
    {
      category: 'notification',
      description: 'Signature status notifications',
      reason: 'Keeps parties informed of signature progress',
      priority: 'important',
      suggestedTools: ['Email', 'Slack', 'SMS notifications'],
    },
  ],

  contract_storage: [
    {
      category: 'input',
      description: 'Secure document repository',
      reason: 'Protects contracts with appropriate access controls and encryption',
      priority: 'critical',
      suggestedTools: ['Ironclad', 'ContractPodAi', 'SharePoint', 'Google Drive'],
    },
    {
      category: 'processing',
      description: 'OCR/AI metadata extraction',
      reason: 'Automatically extracts key data points from stored contracts',
      priority: 'important',
      suggestedTools: ['Kira Systems', 'Evisort', 'Luminance'],
    },
    {
      category: 'processing',
      description: 'Classification taxonomy',
      reason: 'Organizes contracts by type, party, and other dimensions',
      priority: 'important',
      suggestedTools: ['Document management', 'Taxonomy configuration'],
    },
    {
      category: 'processing',
      description: 'Obligation tracking system',
      reason: 'Monitors contract obligations and deadlines',
      priority: 'critical',
      suggestedTools: ['ContractPodAi', 'Concord', 'Agiloft'],
    },
    {
      category: 'output',
      description: 'Full-text search capability',
      reason: 'Enables rapid location of contracts and specific terms',
      priority: 'important',
      suggestedTools: ['Elasticsearch', 'CLM search'],
    },
    {
      category: 'notification',
      description: 'Expiry and obligation alerts',
      reason: 'Proactively notifies of upcoming deadlines and required actions',
      priority: 'critical',
      suggestedTools: ['Calendar', 'Email alerts', 'Slack'],
    },
  ],

  compliance_assessment: [
    {
      category: 'input',
      description: 'Regulatory requirements database',
      reason: 'Maintains current view of applicable regulatory requirements',
      priority: 'critical',
      suggestedTools: ['LogicGate', 'OneTrust', 'SAI360', 'ServiceNow GRC'],
    },
    {
      category: 'input',
      description: 'Evidence collection system',
      reason: 'Systematically gathers compliance evidence from control owners',
      priority: 'critical',
      suggestedTools: ['GRC platform', 'Evidence repository'],
    },
    {
      category: 'processing',
      description: 'Control assessment framework',
      reason: 'Standardizes how controls are evaluated for effectiveness',
      priority: 'critical',
      suggestedTools: ['Assessment templates', 'Control library'],
    },
    {
      category: 'processing',
      description: 'Gap analysis engine',
      reason: 'Identifies gaps between requirements and current state',
      priority: 'critical',
      suggestedTools: ['LogicGate', 'SAI360', 'Gap analysis tools'],
    },
    {
      category: 'processing',
      description: 'Risk scoring methodology',
      reason: 'Quantifies compliance risk for prioritization',
      priority: 'important',
      suggestedTools: ['Risk scoring models', 'GRC platform'],
    },
    {
      category: 'output',
      description: 'Remediation tracking',
      reason: 'Monitors progress on identified compliance gaps',
      priority: 'important',
      suggestedTools: ['Task management', 'Project tracking'],
    },
    {
      category: 'notification',
      description: 'Assessment status updates',
      reason: 'Keeps stakeholders informed of assessment progress',
      priority: 'optional',
      suggestedTools: ['Email', 'Dashboard', 'Slack'],
    },
  ],

  compliance_documentation: [
    {
      category: 'input',
      description: 'Policy template library',
      reason: 'Provides starting point for policy creation with best practices',
      priority: 'important',
      suggestedTools: ['Policy management tools', 'Template library'],
    },
    {
      category: 'processing',
      description: 'Approval workflow engine',
      reason: 'Routes policies through required approval process',
      priority: 'critical',
      suggestedTools: ['Approval workflow', 'ServiceNow', 'PolicyTech'],
    },
    {
      category: 'processing',
      description: 'Version control',
      reason: 'Tracks policy changes and maintains audit history',
      priority: 'critical',
      suggestedTools: ['Document management', 'Git-like versioning'],
    },
    {
      category: 'output',
      description: 'Document management system',
      reason: 'Stores and distributes policies with proper access controls',
      priority: 'critical',
      suggestedTools: ['SharePoint', 'Confluence', 'PolicyTech'],
    },
    {
      category: 'notification',
      description: 'Training and acknowledgment tracking',
      reason: 'Ensures stakeholders are trained on policies',
      priority: 'important',
      suggestedTools: ['LMS integration', 'Acknowledgment system'],
    },
  ],

  audit_preparation: [
    {
      category: 'input',
      description: 'Audit scope management',
      reason: 'Clearly defines and tracks audit scope and objectives',
      priority: 'critical',
      suggestedTools: ['Audit management', 'GRC platform'],
    },
    {
      category: 'input',
      description: 'Document collection workflow',
      reason: 'Systematically gathers required documentation from owners',
      priority: 'critical',
      suggestedTools: ['Request management', 'Document collection'],
    },
    {
      category: 'processing',
      description: 'Completeness checklist',
      reason: 'Ensures all required documentation is collected',
      priority: 'important',
      suggestedTools: ['Checklist tools', 'Task tracking'],
    },
    {
      category: 'processing',
      description: 'Request tracking system',
      reason: 'Manages auditor requests and response status',
      priority: 'critical',
      suggestedTools: ['AuditBoard', 'Request management'],
    },
    {
      category: 'output',
      description: 'Finding tracking',
      reason: 'Documents and tracks audit findings and responses',
      priority: 'important',
      suggestedTools: ['Finding database', 'Remediation tracking'],
    },
    {
      category: 'notification',
      description: 'Stakeholder communication',
      reason: 'Keeps audit team and stakeholders aligned',
      priority: 'optional',
      suggestedTools: ['Email', 'Slack', 'Teams'],
    },
  ],

  ip_registration: [
    {
      category: 'input',
      description: 'IP asset identification',
      reason: 'Systematically identifies registrable IP assets',
      priority: 'critical',
      suggestedTools: ['IP docket', 'Innovation management'],
    },
    {
      category: 'processing',
      description: 'Prior art/trademark search',
      reason: 'Assesses registerability and potential conflicts',
      priority: 'critical',
      suggestedTools: ['TrademarkNow', 'Anaqua', 'CPA Global', 'Clarivate'],
    },
    {
      category: 'processing',
      description: 'Application preparation tools',
      reason: 'Streamlines preparation of registration applications',
      priority: 'important',
      suggestedTools: ['IP management system', 'Form preparation'],
    },
    {
      category: 'processing',
      description: 'Docket management',
      reason: 'Tracks all IP matters and associated deadlines',
      priority: 'critical',
      suggestedTools: ['Anaqua', 'CPA Global', 'IPfolio', 'Dennemeyer'],
    },
    {
      category: 'output',
      description: 'Filing system integration',
      reason: 'Enables efficient filing with IP offices',
      priority: 'important',
      suggestedTools: ['e-Filing systems', 'IP office portals'],
    },
    {
      category: 'notification',
      description: 'Deadline alerts',
      reason: 'Prevents missed filing and response deadlines',
      priority: 'critical',
      suggestedTools: ['Calendar', 'Docket alerts'],
    },
  ],

  trademark_renewal: [
    {
      category: 'input',
      description: 'Deadline monitoring system',
      reason: 'Tracks trademark renewal deadlines across jurisdictions',
      priority: 'critical',
      suggestedTools: ['Anaqua', 'CPA Global', 'Dennemeyer'],
    },
    {
      category: 'processing',
      description: 'Use verification workflow',
      reason: 'Confirms trademark is in use before renewal',
      priority: 'important',
      suggestedTools: ['Use evidence collection', 'Marketing integration'],
    },
    {
      category: 'processing',
      description: 'Renewal preparation tools',
      reason: 'Streamlines renewal application preparation',
      priority: 'important',
      suggestedTools: ['IP management', 'Form automation'],
    },
    {
      category: 'output',
      description: 'Filing integration',
      reason: 'Enables efficient renewal filing',
      priority: 'important',
      suggestedTools: ['e-Filing', 'IP office portals'],
    },
    {
      category: 'notification',
      description: 'Renewal status updates',
      reason: 'Keeps stakeholders informed of renewal status',
      priority: 'optional',
      suggestedTools: ['Email', 'Dashboard'],
    },
  ],

  patent_filing: [
    {
      category: 'input',
      description: 'Invention disclosure system',
      reason: 'Captures invention disclosures from inventors',
      priority: 'critical',
      suggestedTools: ['Anaqua', 'PatSnap', 'Innovation management'],
    },
    {
      category: 'processing',
      description: 'Prior art search tools',
      reason: 'Assesses patentability through comprehensive search',
      priority: 'critical',
      suggestedTools: ['PatSnap', 'Clarivate', 'Orbit Intelligence'],
    },
    {
      category: 'processing',
      description: 'Patentability assessment',
      reason: 'Evaluates invention against patentability criteria',
      priority: 'critical',
      suggestedTools: ['Patent attorney review', 'Assessment framework'],
    },
    {
      category: 'processing',
      description: 'Application drafting support',
      reason: 'Assists in preparing patent application documents',
      priority: 'important',
      suggestedTools: ['Drafting tools', 'Claim analysis'],
    },
    {
      category: 'output',
      description: 'Filing system integration',
      reason: 'Enables efficient patent application filing',
      priority: 'important',
      suggestedTools: ['PCT e-Filing', 'National office portals'],
    },
    {
      category: 'notification',
      description: 'Prosecution tracking',
      reason: 'Monitors patent prosecution status and deadlines',
      priority: 'critical',
      suggestedTools: ['Docket management', 'Status alerts'],
    },
  ],

  dispute_resolution: [
    {
      category: 'input',
      description: 'Dispute intake system',
      reason: 'Standardizes dispute capture and initial assessment',
      priority: 'critical',
      suggestedTools: ['Case management', 'Intake forms'],
    },
    {
      category: 'processing',
      description: 'Case assessment framework',
      reason: 'Evaluates dispute merits and potential outcomes',
      priority: 'critical',
      suggestedTools: ['Assessment tools', 'Legal analysis'],
    },
    {
      category: 'processing',
      description: 'Evidence management',
      reason: 'Organizes and preserves relevant evidence',
      priority: 'critical',
      suggestedTools: ['eDiscovery', 'Document management', 'Relativity'],
    },
    {
      category: 'processing',
      description: 'Legal research access',
      reason: 'Provides access to relevant legal authorities',
      priority: 'important',
      suggestedTools: ['LexisNexis', 'Westlaw', 'Practical Law'],
    },
    {
      category: 'output',
      description: 'Resolution tracking',
      reason: 'Documents resolution process and outcomes',
      priority: 'important',
      suggestedTools: ['Case management', 'Outcome database'],
    },
    {
      category: 'notification',
      description: 'Deadline and hearing alerts',
      reason: 'Ensures no missed court or arbitration deadlines',
      priority: 'critical',
      suggestedTools: ['Calendar', 'Docket management'],
    },
  ],

  legal_research: [
    {
      category: 'input',
      description: 'Research request intake',
      reason: 'Standardizes research requests and requirements',
      priority: 'important',
      suggestedTools: ['Request forms', 'Task management'],
    },
    {
      category: 'processing',
      description: 'Legal database access',
      reason: 'Provides access to comprehensive legal resources',
      priority: 'critical',
      suggestedTools: ['LexisNexis', 'Westlaw', 'Practical Law'],
    },
    {
      category: 'processing',
      description: 'AI-powered analysis',
      reason: 'Accelerates research through AI-assisted analysis',
      priority: 'important',
      suggestedTools: ['CoCounsel', 'Harvey', 'Casetext'],
    },
    {
      category: 'processing',
      description: 'Citation management',
      reason: 'Ensures accurate legal citations',
      priority: 'important',
      suggestedTools: ['Citation tools', 'Bluebook'],
    },
    {
      category: 'output',
      description: 'Memo drafting tools',
      reason: 'Streamlines legal memo preparation',
      priority: 'important',
      suggestedTools: ['Word', 'Legal templates'],
    },
    {
      category: 'notification',
      description: 'Research completion alerts',
      reason: 'Notifies requestors when research is complete',
      priority: 'optional',
      suggestedTools: ['Email', 'Task management'],
    },
  ],

  privacy_compliance: [
    {
      category: 'input',
      description: 'Data inventory system',
      reason: 'Maintains comprehensive view of personal data processed',
      priority: 'critical',
      suggestedTools: ['OneTrust', 'TrustArc', 'BigID'],
    },
    {
      category: 'processing',
      description: 'Data flow mapping tools',
      reason: 'Visualizes how personal data moves through systems',
      priority: 'critical',
      suggestedTools: ['OneTrust', 'TrustArc', 'DataGrail'],
    },
    {
      category: 'processing',
      description: 'Legal basis assessment',
      reason: 'Documents legal basis for each processing activity',
      priority: 'critical',
      suggestedTools: ['Privacy management platform', 'Assessment tools'],
    },
    {
      category: 'processing',
      description: 'DSR management system',
      reason: 'Processes data subject access, deletion, and other requests',
      priority: 'critical',
      suggestedTools: ['OneTrust', 'DataGrail', 'Mine'],
    },
    {
      category: 'output',
      description: 'Compliance documentation',
      reason: 'Maintains required privacy documentation',
      priority: 'important',
      suggestedTools: ['Policy management', 'Document repository'],
    },
    {
      category: 'notification',
      description: 'Incident response system',
      reason: 'Manages data breach notification and response',
      priority: 'critical',
      suggestedTools: ['Incident management', 'OneTrust'],
    },
  ],

  consent_management: [
    {
      category: 'input',
      description: 'Consent collection UI/UX',
      reason: 'Captures consent through clear, compliant interfaces',
      priority: 'critical',
      suggestedTools: ['OneTrust', 'Cookiebot', 'TrustArc'],
    },
    {
      category: 'processing',
      description: 'Consent database',
      reason: 'Records and maintains consent status',
      priority: 'critical',
      suggestedTools: ['OneTrust', 'Preference management'],
    },
    {
      category: 'processing',
      description: 'Preference management',
      reason: 'Allows users to manage their consent preferences',
      priority: 'important',
      suggestedTools: ['Preference center', 'OneTrust'],
    },
    {
      category: 'processing',
      description: 'Withdrawal processing',
      reason: 'Handles consent withdrawal requests',
      priority: 'critical',
      suggestedTools: ['Consent management platform'],
    },
    {
      category: 'output',
      description: 'Audit trail maintenance',
      reason: 'Preserves evidence of consent for compliance',
      priority: 'critical',
      suggestedTools: ['Consent logging', 'Audit system'],
    },
    {
      category: 'notification',
      description: 'Consent status integration',
      reason: 'Syncs consent status with marketing and data systems',
      priority: 'important',
      suggestedTools: ['API integration', 'Marketing platforms'],
    },
  ],
};

// ============================================================================
// LEGAL TOOL RECOMMENDATIONS
// ============================================================================

export const LEGAL_TOOL_RECOMMENDATIONS: Record<string, ToolRecommendation[]> = {
  // Contract Lifecycle Management (CLM)
  clm: [
    {
      toolSlug: 'CONTRACTPODAI',
      toolName: 'ContractPodAi',
      score: 95,
      reasons: [
        'AI-powered contract lifecycle management',
        'Strong clause library and playbook features',
        'Excellent analytics and reporting',
        'Good Middle East market presence',
      ],
      regionalFit: 85,
      alternatives: [
        {
          toolSlug: 'IRONCLAD',
          toolName: 'Ironclad',
          reason: 'Modern workflow-first CLM with strong integrations',
          tradeoff: 'Less established in Middle East region',
        },
      ],
    },
    {
      toolSlug: 'IRONCLAD',
      toolName: 'Ironclad',
      score: 94,
      reasons: [
        'Intuitive workflow-first approach',
        'Strong Salesforce and Slack integrations',
        'Excellent user experience',
        'Growing enterprise adoption',
      ],
      regionalFit: 75,
      alternatives: [],
    },
    {
      toolSlug: 'JURO',
      toolName: 'Juro',
      score: 92,
      reasons: [
        'Browser-native contract editor',
        'Fast implementation and ease of use',
        'Good for high-volume contracts',
        'Strong API capabilities',
      ],
      regionalFit: 70,
      alternatives: [],
    },
    {
      toolSlug: 'AGILOFT',
      toolName: 'Agiloft',
      score: 90,
      reasons: [
        'Highly configurable platform',
        'Strong obligation management',
        'Good for complex contract portfolios',
        'No-code customization',
      ],
      regionalFit: 80,
      alternatives: [],
    },
  ],

  // E-Signature
  esignature: [
    {
      toolSlug: 'DOCUSIGN',
      toolName: 'DocuSign',
      score: 96,
      reasons: [
        'Industry-leading e-signature platform',
        'Global legal validity',
        'Excellent enterprise integrations',
        'Strong mobile experience',
      ],
      regionalFit: 90,
      alternatives: [
        {
          toolSlug: 'ADOBE_SIGN',
          toolName: 'Adobe Sign',
          reason: 'Deep Adobe ecosystem integration',
          tradeoff: 'Smaller market share than DocuSign',
        },
      ],
    },
    {
      toolSlug: 'ADOBE_SIGN',
      toolName: 'Adobe Sign',
      score: 92,
      reasons: [
        'Adobe ecosystem integration',
        'Strong PDF handling',
        'Enterprise-grade security',
        'Good workflow capabilities',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'SIGNNOW',
      toolName: 'SignNow',
      score: 88,
      reasons: [
        'Cost-effective solution',
        'Good SMB fit',
        'Easy to use interface',
        'Solid feature set',
      ],
      regionalFit: 80,
      alternatives: [],
    },
    {
      toolSlug: 'HELLOSIGN',
      toolName: 'HelloSign (Dropbox Sign)',
      score: 86,
      reasons: [
        'Dropbox integration',
        'Simple, clean interface',
        'Good API',
        'Developer-friendly',
      ],
      regionalFit: 75,
      alternatives: [],
    },
  ],

  // Compliance Management (GRC)
  compliance: [
    {
      toolSlug: 'LOGICGATE',
      toolName: 'LogicGate',
      score: 94,
      reasons: [
        'Flexible GRC platform',
        'Strong workflow automation',
        'Good risk quantification',
        'Modern user interface',
      ],
      regionalFit: 80,
      alternatives: [],
    },
    {
      toolSlug: 'ONETRUST',
      toolName: 'OneTrust',
      score: 96,
      reasons: [
        'Comprehensive privacy and compliance platform',
        'Strong GDPR and global privacy compliance',
        'Excellent data mapping capabilities',
        'Industry leader in privacy tech',
      ],
      regionalFit: 85,
      alternatives: [
        {
          toolSlug: 'TRUSTARCL',
          toolName: 'TrustArc',
          reason: 'Strong privacy expertise and consulting',
          tradeoff: 'Smaller platform than OneTrust',
        },
      ],
    },
    {
      toolSlug: 'SAI360',
      toolName: 'SAI360',
      score: 90,
      reasons: [
        'Integrated GRC platform',
        'Strong learning management',
        'Good ethics and compliance features',
        'Enterprise focus',
      ],
      regionalFit: 82,
      alternatives: [],
    },
    {
      toolSlug: 'SERVICENOW_GRC',
      toolName: 'ServiceNow GRC',
      score: 92,
      reasons: [
        'Strong IT integration',
        'Excellent workflow automation',
        'Unified platform approach',
        'Enterprise-grade',
      ],
      regionalFit: 78,
      alternatives: [],
    },
  ],

  // IP Management
  ip_management: [
    {
      toolSlug: 'ANAQUA',
      toolName: 'Anaqua',
      score: 95,
      reasons: [
        'Leading IP management platform',
        'Comprehensive docket management',
        'Strong analytics',
        'Global portfolio support',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'CPA_GLOBAL',
      toolName: 'CPA Global (Clarivate)',
      score: 93,
      reasons: [
        'Comprehensive IP services',
        'Strong renewal services',
        'Global coverage',
        'Patent analytics',
      ],
      regionalFit: 88,
      alternatives: [],
    },
    {
      toolSlug: 'TRADEMARKNOW',
      toolName: 'TrademarkNow',
      score: 91,
      reasons: [
        'AI-powered trademark screening',
        'Fast clearance searches',
        'Good brand protection features',
        'Modern interface',
      ],
      regionalFit: 80,
      alternatives: [],
    },
    {
      toolSlug: 'DENNEMEYER',
      toolName: 'Dennemeyer',
      score: 89,
      reasons: [
        'Full-service IP management',
        'Strong Middle East presence',
        'Renewal and annuity services',
        'IP consulting',
      ],
      regionalFit: 92,
      alternatives: [],
    },
  ],

  // Legal Research
  legal_research: [
    {
      toolSlug: 'LEXISNEXIS',
      toolName: 'LexisNexis',
      score: 96,
      reasons: [
        'Comprehensive legal research platform',
        'Strong case law coverage',
        'Good Middle East content',
        'AI-powered research tools',
      ],
      regionalFit: 85,
      alternatives: [
        {
          toolSlug: 'WESTLAW',
          toolName: 'Westlaw',
          reason: 'Excellent US law coverage and analytics',
          tradeoff: 'Less Middle East focus',
        },
      ],
    },
    {
      toolSlug: 'WESTLAW',
      toolName: 'Westlaw',
      score: 95,
      reasons: [
        'Industry-leading legal research',
        'Strong analytics and citing references',
        'Practical Law integration',
        'AI-powered research',
      ],
      regionalFit: 75,
      alternatives: [],
    },
    {
      toolSlug: 'PRACTICAL_LAW',
      toolName: 'Practical Law',
      score: 92,
      reasons: [
        'Excellent practice guides and templates',
        'Time-saving standard documents',
        'Good GCC coverage',
        'Expert-maintained content',
      ],
      regionalFit: 88,
      alternatives: [],
    },
    {
      toolSlug: 'CASETEXT',
      toolName: 'Casetext (CoCounsel)',
      score: 90,
      reasons: [
        'AI-powered legal research',
        'GPT-4 powered CoCounsel',
        'Fast research capabilities',
        'Innovative interface',
      ],
      regionalFit: 70,
      alternatives: [],
    },
  ],

  // Document Review / AI Contract Analysis
  contract_ai: [
    {
      toolSlug: 'LUMINANCE',
      toolName: 'Luminance',
      score: 94,
      reasons: [
        'AI-powered document review',
        'Strong due diligence capabilities',
        'Contract analysis features',
        'Good language support',
      ],
      regionalFit: 82,
      alternatives: [],
    },
    {
      toolSlug: 'KIRA_SYSTEMS',
      toolName: 'Kira Systems',
      score: 93,
      reasons: [
        'Leading contract analysis AI',
        'Strong M&A due diligence',
        'Excellent extraction accuracy',
        'Custom model training',
      ],
      regionalFit: 78,
      alternatives: [],
    },
    {
      toolSlug: 'EVISORT',
      toolName: 'Evisort',
      score: 91,
      reasons: [
        'AI contract intelligence',
        'Strong metadata extraction',
        'Good CLM integration',
        'Modern platform',
      ],
      regionalFit: 75,
      alternatives: [],
    },
    {
      toolSlug: 'LAWGEEX',
      toolName: 'LawGeex',
      score: 89,
      reasons: [
        'AI contract review automation',
        'Playbook-based analysis',
        'Good for high-volume review',
        'Fast turnaround',
      ],
      regionalFit: 72,
      alternatives: [],
    },
  ],

  // Privacy Management
  privacy: [
    {
      toolSlug: 'ONETRUST_PRIVACY',
      toolName: 'OneTrust',
      score: 97,
      reasons: [
        'Industry-leading privacy management',
        'Comprehensive GDPR compliance',
        'Strong consent management',
        'Excellent data mapping',
      ],
      regionalFit: 85,
      alternatives: [],
    },
    {
      toolSlug: 'TRUSTARC',
      toolName: 'TrustArc',
      score: 92,
      reasons: [
        'Privacy expertise and consulting',
        'Good compliance tools',
        'Strong assessments',
        'Certifications support',
      ],
      regionalFit: 80,
      alternatives: [],
    },
    {
      toolSlug: 'BIGID',
      toolName: 'BigID',
      score: 90,
      reasons: [
        'AI-powered data discovery',
        'Strong data classification',
        'Good for complex data environments',
        'Privacy by design',
      ],
      regionalFit: 75,
      alternatives: [],
    },
    {
      toolSlug: 'DATAGRAIL',
      toolName: 'DataGrail',
      score: 88,
      reasons: [
        'Automated DSR fulfillment',
        'Good integration ecosystem',
        'Modern interface',
        'Quick implementation',
      ],
      regionalFit: 72,
      alternatives: [],
    },
  ],

  // eDiscovery
  ediscovery: [
    {
      toolSlug: 'RELATIVITY',
      toolName: 'Relativity',
      score: 96,
      reasons: [
        'Industry-leading eDiscovery platform',
        'Strong analytics and AI',
        'Comprehensive case management',
        'Large ecosystem',
      ],
      regionalFit: 75,
      alternatives: [],
    },
    {
      toolSlug: 'NUIX',
      toolName: 'Nuix',
      score: 92,
      reasons: [
        'Fast data processing',
        'Strong investigation capabilities',
        'Good unstructured data handling',
        'Forensic features',
      ],
      regionalFit: 78,
      alternatives: [],
    },
    {
      toolSlug: 'LOGIKCULL',
      toolName: 'Logikcull',
      score: 88,
      reasons: [
        'Cloud-native eDiscovery',
        'Easy to use',
        'Good for smaller matters',
        'Predictable pricing',
      ],
      regionalFit: 70,
      alternatives: [],
    },
  ],

  // Kuwait/GCC Specific
  kuwait_legal: [
    {
      toolSlug: 'KUWAIT_MOCI_PORTAL',
      toolName: 'Kuwait MOCI e-Services',
      score: 98,
      reasons: [
        'Official government portal',
        'Required for commercial registrations',
        'Trademark and IP filings',
        'Business licensing',
      ],
      regionalFit: 100,
      alternatives: [],
    },
    {
      toolSlug: 'KCCI_ARBITRATION',
      toolName: 'KCCI Arbitration Center',
      score: 95,
      reasons: [
        'Kuwait Chamber of Commerce arbitration',
        'Local dispute resolution',
        'Arabic proceedings',
        'Recognized by courts',
      ],
      regionalFit: 100,
      alternatives: [],
    },
    {
      toolSlug: 'KUWAIT_COURTS_PORTAL',
      toolName: 'Kuwait Courts e-Services',
      score: 96,
      reasons: [
        'Official court filing system',
        'Case status tracking',
        'Document submission',
        'Required for litigation',
      ],
      regionalFit: 100,
      alternatives: [],
    },
  ],
};

// ============================================================================
// LEGAL REGIONAL CONTEXT
// ============================================================================

export const LEGAL_REGIONAL_CONTEXT: Record<string, LegalRegionalContext> = {
  kuwait: {
    region: 'Kuwait',
    legalSystem: 'Civil law based on Egyptian/French model',
    contractLanguage: 'Arabic (official), English (business common)',
    commercialLaw: 'Kuwait Commercial Companies Law (No. 1/2016)',
    laborLaw: 'Kuwait Labor Law (No. 6/2010)',
    dataProtection: 'No comprehensive data protection law yet (draft pending)',
    arbitration: 'Kuwait Chamber of Commerce and Industry (KCCI)',
    courtSystem: 'Courts of First Instance → Appeals → Cassation',
    notarization: 'Ministry of Justice Authentication Department',
    trademarkAuthority: 'Ministry of Commerce and Industry',
    statuteOfLimitations: {
      commercial_contract: 10,
      civil_contract: 15,
      labor_claim: 1,
      tort: 3,
      insurance: 3,
      cheque: 6, // months
      promissory_note: 3,
      trademark_infringement: 10,
      debt_collection: 15,
    },
    businessDays: 'Sunday-Thursday',
    complianceRequirements: [
      'Arabic language for court filings and official contracts',
      'Commercial registration with Ministry of Commerce',
      'Civil ID for individual parties',
      'Commercial registration number for companies',
      'Notarization for certain contract types',
      'Power of attorney for legal representation',
      'Stamp duty on certain documents',
    ],
  },
  uae: {
    region: 'United Arab Emirates',
    legalSystem: 'Civil law based on Egyptian/French model with federal structure',
    contractLanguage: 'Arabic (official), English (widely used)',
    commercialLaw: 'UAE Commercial Companies Law (Federal Law No. 2/2015)',
    laborLaw: 'UAE Labor Law (Federal Decree-Law No. 33/2021)',
    dataProtection: 'DIFC Data Protection Law, ADGM Data Protection Regulations',
    arbitration: 'DIAC, ADCCAC, DIFC-LCIA',
    courtSystem: 'Court of First Instance → Court of Appeal → Court of Cassation',
    notarization: 'Notary Public offices in each emirate',
    trademarkAuthority: 'Ministry of Economy',
    statuteOfLimitations: {
      commercial_contract: 10,
      civil_contract: 15,
      labor_claim: 1,
      tort: 3,
      insurance: 3,
    },
    businessDays: 'Monday-Friday',
    complianceRequirements: [
      'Arabic for court filings',
      'Trade license requirements',
      'Emirates ID for individuals',
      'Free zone specific regulations',
    ],
  },
  saudi: {
    region: 'Saudi Arabia',
    legalSystem: 'Based on Sharia law with civil law influences',
    contractLanguage: 'Arabic (required), English (business use)',
    commercialLaw: 'Saudi Companies Law (Royal Decree M/3)',
    laborLaw: 'Saudi Labor Law (Royal Decree M/51)',
    dataProtection: 'Personal Data Protection Law (Royal Decree M/19)',
    arbitration: 'Saudi Center for Commercial Arbitration (SCCA)',
    courtSystem: 'First Degree Courts → Appellate Courts → Supreme Court',
    notarization: 'Ministry of Justice notarization services',
    trademarkAuthority: 'Saudi Authority for Intellectual Property (SAIP)',
    statuteOfLimitations: {
      commercial_contract: 10,
      civil_contract: 5,
      labor_claim: 1,
      tort: 3,
    },
    businessDays: 'Sunday-Thursday',
    complianceRequirements: [
      'Arabic mandatory for all contracts',
      'Commercial registration (CR)',
      'Saudization requirements',
      'PDPL compliance',
    ],
  },
};

// ============================================================================
// LEGAL DOMAIN INTELLIGENCE CLASS
// ============================================================================

export class LegalDomainIntelligence {
  private region: string;
  private regionalContext: LegalRegionalContext | null;

  constructor(region: string = 'kuwait') {
    this.region = region.toLowerCase();
    this.regionalContext = LEGAL_REGIONAL_CONTEXT[this.region] || null;
  }

  /**
   * Detect legal workflow pattern from user request
   */
  detectLegalPattern(request: string): string | null {
    const normalizedRequest = request.toLowerCase();
    let bestMatch: string | null = null;
    let highestScore = 0;

    for (const [pattern, keywords] of Object.entries(LEGAL_KEYWORDS)) {
      const score = keywords.filter(kw =>
        normalizedRequest.includes(kw.toLowerCase())
      ).length;

      if (score > highestScore) {
        highestScore = score;
        bestMatch = pattern;
      }
    }

    // Require at least 1 keyword match for legal patterns
    return highestScore >= 1 ? bestMatch : null;
  }

  /**
   * Get implicit requirements for a legal pattern
   */
  getImplicitRequirements(pattern: string): ImplicitRequirement[] {
    const requirements = [...(LEGAL_IMPLICIT_REQUIREMENTS[pattern] || [])];

    // Add regional compliance requirements
    if (this.regionalContext && pattern) {
      const patternDef = LEGAL_WORKFLOW_PATTERNS[pattern];
      if (patternDef?.complianceRequirements) {
        patternDef.complianceRequirements.forEach((req, index) => {
          requirements.push({
            category: 'processing',
            description: req,
            reason: `Required for ${this.regionalContext!.region} legal compliance`,
            priority: index === 0 ? 'critical' : 'important',
            suggestedTools: ['Local legal counsel', 'Compliance module'],
          });
        });
      }
    }

    return requirements;
  }

  /**
   * Get tool recommendations for a legal pattern
   */
  getToolRecommendations(pattern: string, region?: string): ToolRecommendation[] {
    const effectiveRegion = region || this.region;
    const recommendations: ToolRecommendation[] = [];

    // Map pattern to tool category
    const categoryMapping: Record<string, string[]> = {
      contract_drafting: ['clm', 'contract_ai'],
      contract_review: ['clm', 'contract_ai'],
      contract_negotiation: ['clm'],
      contract_signature: ['esignature', 'clm'],
      contract_storage: ['clm'],
      compliance_assessment: ['compliance'],
      compliance_documentation: ['compliance'],
      audit_preparation: ['compliance'],
      ip_registration: ['ip_management'],
      trademark_renewal: ['ip_management'],
      patent_filing: ['ip_management'],
      dispute_resolution: ['legal_research', 'ediscovery'],
      legal_research: ['legal_research', 'contract_ai'],
      privacy_compliance: ['privacy', 'compliance'],
      consent_management: ['privacy'],
    };

    const categories = categoryMapping[pattern] || ['clm'];

    // Get tools from each category
    categories.forEach(category => {
      const categoryTools = LEGAL_TOOL_RECOMMENDATIONS[category] || [];
      recommendations.push(...categoryTools);
    });

    // Add Kuwait-specific tools if region is Kuwait
    if (effectiveRegion === 'kuwait') {
      const kuwaitTools = LEGAL_TOOL_RECOMMENDATIONS.kuwait_legal || [];
      recommendations.push(...kuwaitTools);
    }

    // Sort by score and regional fit
    return recommendations
      .sort((a, b) => {
        const scoreA = a.score * (effectiveRegion === 'kuwait' ? a.regionalFit / 100 : 1);
        const scoreB = b.score * (effectiveRegion === 'kuwait' ? b.regionalFit / 100 : 1);
        return scoreB - scoreA;
      })
      .slice(0, 10); // Return top 10
  }

  /**
   * Get clarifying questions for a legal pattern
   */
  getClarifyingQuestions(pattern: string): ClarifyingQuestion[] {
    const questions: ClarifyingQuestion[] = [];
    const patternDef = LEGAL_WORKFLOW_PATTERNS[pattern];
    let questionId = 1;

    if (!patternDef) return questions;

    // Pattern-specific questions from the pattern definition
    patternDef.questions.forEach((questionText, index) => {
      questions.push({
        id: `legal_q${questionId++}`,
        question: questionText,
        category: this.categorizeQuestion(questionText),
        options: this.generateOptionsForQuestion(questionText, pattern),
        required: index < 3, // First 3 questions are required
        relevanceScore: 100 - (index * 10),
      });
    });

    // Add regional-specific questions for Kuwait
    if (this.region === 'kuwait') {
      questions.push({
        id: `legal_q${questionId++}`,
        question: 'Is an Arabic translation required for this matter?',
        category: 'region',
        options: [
          { value: 'yes', label: 'Yes', description: 'Arabic required for courts/officials', implications: ['Will include certified Arabic translation'] },
          { value: 'no', label: 'No', description: 'English only sufficient' },
          { value: 'bilingual', label: 'Bilingual', description: 'Both Arabic and English versions' },
        ],
        required: true,
        relevanceScore: 95,
      });

      if (pattern === 'contract_signature') {
        questions.push({
          id: `legal_q${questionId++}`,
          question: 'Is notarization required for this contract?',
          category: 'region',
          options: [
            { value: 'yes', label: 'Yes', description: 'Ministry of Justice notarization', implications: ['Will route to notary'] },
            { value: 'no', label: 'No', description: 'No notarization required' },
            { value: 'authentication', label: 'Authentication Only', description: 'Embassy/Ministry authentication' },
          ],
          required: true,
          relevanceScore: 90,
        });
      }

      if (pattern === 'dispute_resolution') {
        questions.push({
          id: `legal_q${questionId++}`,
          question: 'What is the preferred dispute resolution mechanism?',
          category: 'integration',
          options: [
            { value: 'kcci', label: 'KCCI Arbitration', description: 'Kuwait Chamber of Commerce arbitration', implications: ['Arabic proceedings'] },
            { value: 'courts', label: 'Kuwait Courts', description: 'Formal court litigation', implications: ['Arabic required, longer timeline'] },
            { value: 'mediation', label: 'Mediation', description: 'Mediated settlement', implications: ['Non-binding, flexible'] },
            { value: 'international', label: 'International Arbitration', description: 'ICC or LCIA arbitration', implications: ['May allow English proceedings'] },
          ],
          required: true,
          relevanceScore: 95,
        });
      }

      if (pattern === 'ip_registration' || pattern === 'trademark_renewal') {
        questions.push({
          id: `legal_q${questionId++}`,
          question: 'Which IP office(s) should be involved?',
          category: 'region',
          options: [
            { value: 'kuwait_moci', label: 'Kuwait MOCI', description: 'Ministry of Commerce and Industry', implications: ['Local Kuwait registration'] },
            { value: 'gcc', label: 'GCC Trademark Office', description: 'Regional GCC filing', implications: ['Coverage across Gulf states'] },
            { value: 'both', label: 'Both', description: 'Kuwait and GCC filings' },
          ],
          required: false,
          relevanceScore: 85,
        });
      }
    }

    return questions;
  }

  /**
   * Get the workflow chain for a legal pattern
   */
  getWorkflowChain(pattern: string): WorkflowChainStep[] {
    const patternDef = LEGAL_WORKFLOW_PATTERNS[pattern];
    if (!patternDef) return [];

    const chain: WorkflowChainStep[] = [];

    patternDef.steps.forEach((stepName, index) => {
      const layer = patternDef.layers[Math.min(index, patternDef.layers.length - 1)];
      const implicitReq = LEGAL_IMPLICIT_REQUIREMENTS[pattern]?.[index];

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
   * Get regional context for legal operations
   */
  getRegionalContext(): LegalRegionalContext | null {
    return this.regionalContext;
  }

  /**
   * Get contract expiry alert with notice period calculation
   */
  getContractExpiryAlert(
    contractDate: Date,
    noticePeriodDays: number = 90,
    contractId?: string
  ): ContractExpiryAlert {
    const now = new Date();
    const expiryDate = new Date(contractDate);
    const alertDate = new Date(expiryDate);
    alertDate.setDate(alertDate.getDate() - noticePeriodDays);

    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysUntilNoticeDeadline = Math.ceil(
      (alertDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    let urgencyLevel: 'critical' | 'warning' | 'normal';
    const recommendedActions: string[] = [];

    if (daysUntilNoticeDeadline <= 0) {
      urgencyLevel = 'critical';
      recommendedActions.push('URGENT: Notice period has passed or expires soon');
      recommendedActions.push('Contact counterparty immediately');
      recommendedActions.push('Review auto-renewal terms');
    } else if (daysUntilNoticeDeadline <= 30) {
      urgencyLevel = 'warning';
      recommendedActions.push('Review contract terms for renewal decision');
      recommendedActions.push('Prepare renewal or termination notice');
      recommendedActions.push('Schedule stakeholder review meeting');
    } else {
      urgencyLevel = 'normal';
      recommendedActions.push('Monitor for upcoming notice deadline');
      recommendedActions.push('Begin renewal planning process');
    }

    return {
      contractId,
      expiryDate,
      noticePeriodDays,
      alertDate,
      daysUntilExpiry,
      daysUntilNoticeDeadline,
      urgencyLevel,
      recommendedActions,
    };
  }

  /**
   * Calculate statute of limitations deadline for a claim
   */
  calculateStatuteOfLimitations(
    claimType: string,
    jurisdiction?: string,
    incidentDate?: Date
  ): StatuteOfLimitationsResult {
    const effectiveJurisdiction = jurisdiction || this.region;
    const context = LEGAL_REGIONAL_CONTEXT[effectiveJurisdiction.toLowerCase()];
    const baseDate = incidentDate || new Date();

    // Default limitation period if not found
    let limitationPeriodYears = 10;
    const normalizedClaimType = claimType.toLowerCase().replace(/\s+/g, '_');

    if (context?.statuteOfLimitations) {
      limitationPeriodYears = context.statuteOfLimitations[normalizedClaimType] ||
        context.statuteOfLimitations.commercial_contract ||
        10;
    }

    // Special handling for short periods (months instead of years)
    let deadlineDate: Date;
    if (['cheque', 'promissory_note'].includes(normalizedClaimType)) {
      // These are in months
      deadlineDate = new Date(baseDate);
      deadlineDate.setMonth(deadlineDate.getMonth() + limitationPeriodYears);
    } else {
      deadlineDate = new Date(baseDate);
      deadlineDate.setFullYear(deadlineDate.getFullYear() + limitationPeriodYears);
    }

    const now = new Date();
    const daysRemaining = Math.ceil(
      (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    const notes: string[] = [
      `Based on ${context?.region || effectiveJurisdiction} law`,
      `Limitation period: ${limitationPeriodYears} ${['cheque', 'promissory_note'].includes(normalizedClaimType) ? 'months' : 'years'}`,
    ];

    if (daysRemaining <= 365) {
      notes.push('WARNING: Less than one year remaining - take action promptly');
    }
    if (daysRemaining <= 0) {
      notes.push('EXPIRED: Limitation period may have passed - consult legal counsel');
    }

    return {
      claimType,
      jurisdiction: effectiveJurisdiction,
      limitationPeriodYears,
      deadlineDate,
      daysRemaining,
      notes,
    };
  }

  /**
   * Assess legal risk for a given matter
   */
  assessLegalRisk(
    _pattern: string,
    factors: {
      contractValue?: number;
      jurisdictionComplexity?: 'low' | 'medium' | 'high';
      counterpartyRisk?: 'low' | 'medium' | 'high';
      regulatoryExposure?: 'low' | 'medium' | 'high';
    }
  ): LegalRiskAssessment {
    const riskFactors: RiskFactor[] = [];
    let totalRiskScore = 0;

    // Contract value risk
    if (factors.contractValue) {
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (factors.contractValue > 1000000) {
        severity = 'critical';
        totalRiskScore += 40;
      } else if (factors.contractValue > 100000) {
        severity = 'high';
        totalRiskScore += 30;
      } else if (factors.contractValue > 10000) {
        severity = 'medium';
        totalRiskScore += 20;
      } else {
        totalRiskScore += 10;
      }

      riskFactors.push({
        category: 'Financial',
        description: `Contract value: ${factors.contractValue.toLocaleString()}`,
        severity,
        mitigationStrategy: severity === 'critical' || severity === 'high'
          ? 'Require senior legal review and board approval'
          : 'Standard review process',
      });
    }

    // Jurisdiction complexity
    if (factors.jurisdictionComplexity) {
      const severityMap: Record<string, number> = { low: 10, medium: 20, high: 30 };
      totalRiskScore += severityMap[factors.jurisdictionComplexity];

      riskFactors.push({
        category: 'Jurisdictional',
        description: `Jurisdiction complexity: ${factors.jurisdictionComplexity}`,
        severity: factors.jurisdictionComplexity as 'low' | 'medium' | 'high',
        mitigationStrategy: factors.jurisdictionComplexity === 'high'
          ? 'Engage local counsel in each jurisdiction'
          : 'Review local law requirements',
      });
    }

    // Counterparty risk
    if (factors.counterpartyRisk) {
      const severityMap: Record<string, number> = { low: 10, medium: 20, high: 30 };
      totalRiskScore += severityMap[factors.counterpartyRisk];

      riskFactors.push({
        category: 'Counterparty',
        description: `Counterparty risk level: ${factors.counterpartyRisk}`,
        severity: factors.counterpartyRisk as 'low' | 'medium' | 'high',
        mitigationStrategy: factors.counterpartyRisk === 'high'
          ? 'Require enhanced due diligence and credit checks'
          : 'Standard counterparty screening',
      });
    }

    // Regulatory exposure
    if (factors.regulatoryExposure) {
      const severityMap: Record<string, number> = { low: 10, medium: 25, high: 35 };
      totalRiskScore += severityMap[factors.regulatoryExposure];

      riskFactors.push({
        category: 'Regulatory',
        description: `Regulatory exposure: ${factors.regulatoryExposure}`,
        severity: factors.regulatoryExposure as 'low' | 'medium' | 'high',
        mitigationStrategy: factors.regulatoryExposure === 'high'
          ? 'Conduct regulatory compliance review before execution'
          : 'Monitor regulatory requirements',
      });
    }

    // Determine overall risk
    let overallRisk: 'low' | 'medium' | 'high' | 'critical';
    if (totalRiskScore >= 100) {
      overallRisk = 'critical';
    } else if (totalRiskScore >= 60) {
      overallRisk = 'high';
    } else if (totalRiskScore >= 30) {
      overallRisk = 'medium';
    } else {
      overallRisk = 'low';
    }

    // Generate mitigation recommendations
    const mitigationRecommendations: string[] = [];
    if (overallRisk === 'critical' || overallRisk === 'high') {
      mitigationRecommendations.push('Require executive and legal department approval');
      mitigationRecommendations.push('Conduct comprehensive due diligence');
      mitigationRecommendations.push('Consider legal insurance or guarantees');
    }
    if (factors.jurisdictionComplexity === 'high') {
      mitigationRecommendations.push('Engage qualified local counsel');
    }
    if (factors.regulatoryExposure === 'high') {
      mitigationRecommendations.push('Complete regulatory compliance checklist');
    }

    return {
      overallRisk,
      riskFactors,
      mitigationRecommendations,
    };
  }

  /**
   * Get compliance requirements for the current region
   */
  getComplianceRequirements(): string[] {
    return this.regionalContext?.complianceRequirements || [];
  }

  /**
   * Get the court system structure for the current region
   */
  getCourtSystemInfo(): {
    courtSystem: string;
    arbitration: string;
    notarization: string;
  } | null {
    if (!this.regionalContext) return null;

    return {
      courtSystem: this.regionalContext.courtSystem,
      arbitration: this.regionalContext.arbitration,
      notarization: this.regionalContext.notarization,
    };
  }

  /**
   * Get statute of limitations periods for all claim types in current region
   */
  getStatuteOfLimitationsPeriods(): Record<string, number> | null {
    return this.regionalContext?.statuteOfLimitations || null;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private categorizeQuestion(questionText: string): ClarifyingQuestion['category'] {
    const text = questionText.toLowerCase();

    if (text.includes('how often') || text.includes('frequency') || text.includes('timeline')) {
      return 'frequency';
    }
    if (text.includes('who') || text.includes('team') || text.includes('approves') || text.includes('review')) {
      return 'audience';
    }
    if (text.includes('format') || text.includes('template') || text.includes('language')) {
      return 'format';
    }
    if (text.includes('platform') || text.includes('software') || text.includes('system') || text.includes('tool')) {
      return 'platform';
    }
    if (text.includes('jurisdiction') || text.includes('region') || text.includes('country') || text.includes('local')) {
      return 'region';
    }

    return 'integration';
  }

  private generateOptionsForQuestion(questionText: string, pattern: string): QuestionOption[] {
    const text = questionText.toLowerCase();

    // Contract type questions
    if (text.includes('type of contract') || text.includes('what type')) {
      return [
        { value: 'service', label: 'Service Agreement', description: 'Professional or consulting services' },
        { value: 'sales', label: 'Sales/Purchase Agreement', description: 'Sale of goods' },
        { value: 'nda', label: 'NDA/Confidentiality', description: 'Non-disclosure agreement' },
        { value: 'employment', label: 'Employment Contract', description: 'Employee agreement' },
        { value: 'lease', label: 'Lease/Rental Agreement', description: 'Property or equipment lease' },
        { value: 'partnership', label: 'Partnership/JV', description: 'Business partnership or joint venture' },
        { value: 'licensing', label: 'License Agreement', description: 'IP or software licensing' },
        { value: 'other', label: 'Other', description: 'Different contract type' },
      ];
    }

    // Jurisdiction questions
    if (text.includes('jurisdiction') || text.includes('governing')) {
      return [
        { value: 'kuwait', label: 'Kuwait', description: 'Kuwait law and courts' },
        { value: 'uae', label: 'UAE', description: 'UAE law' },
        { value: 'saudi', label: 'Saudi Arabia', description: 'Saudi law' },
        { value: 'uk', label: 'England & Wales', description: 'English law' },
        { value: 'us_ny', label: 'New York', description: 'New York law' },
        { value: 'other', label: 'Other', description: 'Different jurisdiction' },
      ];
    }

    // Language questions
    if (text.includes('language') && !text.includes('programming')) {
      return [
        { value: 'arabic', label: 'Arabic Only', description: 'Arabic version only' },
        { value: 'english', label: 'English Only', description: 'English version only' },
        { value: 'bilingual', label: 'Bilingual', description: 'Both Arabic and English' },
      ];
    }

    // Approval questions
    if (text.includes('approve') || text.includes('approval')) {
      return [
        { value: 'legal', label: 'Legal Department', description: 'Legal team approval' },
        { value: 'management', label: 'Management', description: 'Department manager approval' },
        { value: 'executive', label: 'Executive', description: 'C-level or board approval' },
        { value: 'multi_tier', label: 'Multi-tier', description: 'Multiple approval levels' },
      ];
    }

    // Risk tolerance questions
    if (text.includes('risk') && text.includes('tolerance')) {
      return [
        { value: 'low', label: 'Low Risk Tolerance', description: 'Strict adherence to standards' },
        { value: 'medium', label: 'Medium Risk Tolerance', description: 'Some flexibility on minor terms' },
        { value: 'high', label: 'High Risk Tolerance', description: 'Willing to accept non-standard terms' },
      ];
    }

    // Deadline questions
    if (text.includes('deadline') || text.includes('timeline')) {
      return [
        { value: 'urgent', label: 'Urgent (< 1 week)', description: 'Immediate attention required' },
        { value: 'normal', label: 'Normal (1-4 weeks)', description: 'Standard timeline' },
        { value: 'flexible', label: 'Flexible (> 1 month)', description: 'No rush' },
      ];
    }

    // IP type questions
    if (text.includes('type of ip') || (text.includes('ip') && text.includes('registering'))) {
      return [
        { value: 'trademark', label: 'Trademark', description: 'Brand name, logo, or slogan' },
        { value: 'patent', label: 'Patent', description: 'Invention or process' },
        { value: 'copyright', label: 'Copyright', description: 'Creative work' },
        { value: 'trade_secret', label: 'Trade Secret', description: 'Confidential business information' },
      ];
    }

    // Dispute nature questions
    if (text.includes('nature of') && pattern === 'dispute_resolution') {
      return [
        { value: 'contract', label: 'Contract Dispute', description: 'Breach of contract' },
        { value: 'commercial', label: 'Commercial Dispute', description: 'Business/commercial disagreement' },
        { value: 'employment', label: 'Employment Dispute', description: 'Labor/employment matter' },
        { value: 'ip', label: 'IP Dispute', description: 'Intellectual property issue' },
        { value: 'debt', label: 'Debt Collection', description: 'Unpaid amounts' },
      ];
    }

    // Regulations questions
    if (text.includes('regulation') || text.includes('compliance area')) {
      return [
        { value: 'commercial', label: 'Commercial/Corporate', description: 'Commercial Companies Law' },
        { value: 'labor', label: 'Labor/Employment', description: 'Labor law compliance' },
        { value: 'privacy', label: 'Data Privacy', description: 'Privacy and data protection' },
        { value: 'industry', label: 'Industry-Specific', description: 'Sector-specific regulations' },
        { value: 'aml', label: 'AML/KYC', description: 'Anti-money laundering' },
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
      // Contract Drafting
      select_template: 'Select appropriate contract template',
      gather_requirements: 'Gather contract requirements and party information',
      customize_clauses: 'Customize clauses based on requirements',
      review_legal_terms: 'Review legal terms for compliance',
      verify_compliance: 'Verify regulatory and policy compliance',
      generate_draft: 'Generate contract draft',
      internal_review: 'Route for internal review and approval',
      finalize_document: 'Finalize contract document',

      // Contract Review
      receive_contract: 'Receive contract for review',
      extract_key_terms: 'Extract and analyze key terms',
      identify_risks: 'Identify potential risks and issues',
      compare_standards: 'Compare against standard terms and playbook',
      flag_deviations: 'Flag deviations from standards',
      generate_redlines: 'Generate redlined markup',
      route_approval: 'Route for approval',
      complete_review: 'Complete review and document findings',

      // Contract Negotiation
      receive_counterparty_version: 'Receive counterparty version',
      compare_versions: 'Compare contract versions',
      identify_changes: 'Identify and categorize changes',
      assess_acceptability: 'Assess acceptability of changes',
      prepare_response: 'Prepare negotiation response',
      track_positions: 'Track negotiation positions',
      escalate_if_needed: 'Escalate to appropriate authority',
      finalize_agreement: 'Finalize agreed terms',

      // Contract Signature
      prepare_final_document: 'Prepare final document for signature',
      identify_signatories: 'Identify required signatories',
      verify_authority: 'Verify signatory authority',
      send_for_signature: 'Send document for signature',
      collect_signatures: 'Collect all required signatures',
      authenticate_signatures: 'Authenticate signatures',
      distribute_executed_copy: 'Distribute executed copies',
      archive_document: 'Archive executed document',

      // Contract Storage
      receive_executed_contract: 'Receive executed contract',
      extract_metadata: 'Extract contract metadata',
      classify_contract: 'Classify contract by type/category',
      index_key_terms: 'Index key terms for searchability',
      set_obligations: 'Set up obligation tracking',
      configure_alerts: 'Configure expiry and deadline alerts',
      store_securely: 'Store in secure repository',
      enable_search: 'Enable full-text search',

      // Compliance Assessment
      identify_requirements: 'Identify applicable requirements',
      gather_evidence: 'Gather compliance evidence',
      assess_controls: 'Assess control effectiveness',
      identify_gaps: 'Identify compliance gaps',
      calculate_risk_scores: 'Calculate risk scores',
      generate_findings: 'Generate assessment findings',
      create_remediation_plan: 'Create remediation plan',
      track_progress: 'Track remediation progress',

      // Compliance Documentation
      identify_documentation_needs: 'Identify documentation requirements',
      draft_policies: 'Draft policies and procedures',
      review_approve_policies: 'Review and approve policies',
      publish_documentation: 'Publish documentation',
      train_stakeholders: 'Train stakeholders',
      maintain_compliance_records: 'Maintain compliance records',
      version_control: 'Manage document versions',
      audit_readiness: 'Ensure audit readiness',

      // Audit Preparation
      receive_audit_scope: 'Receive and understand audit scope',
      organize_materials: 'Organize required materials',
      brief_stakeholders: 'Brief relevant stakeholders',
      manage_requests: 'Manage auditor requests',
      track_findings: 'Track audit findings',

      // IP Registration
      identify_ip_asset: 'Identify IP asset for registration',
      conduct_search: 'Conduct prior art/trademark search',
      prepare_application: 'Prepare registration application',
      file_application: 'File application with IP office',
      respond_to_office_actions: 'Respond to office actions',
      track_prosecution: 'Track prosecution status',
      receive_registration: 'Receive registration certificate',
      maintain_ip_records: 'Maintain IP records',

      // Trademark Renewal
      monitor_deadlines: 'Monitor renewal deadlines',
      identify_due_renewals: 'Identify marks due for renewal',
      verify_use_status: 'Verify trademark use status',
      prepare_renewal: 'Prepare renewal application',
      file_renewal: 'File renewal with IP office',
      pay_fees: 'Pay renewal fees',
      confirm_renewal: 'Confirm successful renewal',
      update_portfolio_records: 'Update portfolio records',

      // Patent Filing
      receive_invention_disclosure: 'Receive invention disclosure',
      conduct_patentability_search: 'Conduct patentability search',
      assess_patentability: 'Assess patentability',
      draft_application: 'Draft patent application',
      prosecute_application: 'Prosecute patent application',
      respond_to_examination: 'Respond to examination reports',
      obtain_grant: 'Obtain patent grant',

      // Dispute Resolution
      receive_dispute_notice: 'Receive dispute notice',
      assess_dispute: 'Assess dispute merits',
      gather_facts: 'Gather facts and evidence',
      evaluate_options: 'Evaluate resolution options',
      engage_resolution: 'Engage resolution process',
      negotiate_settlement: 'Negotiate settlement',
      document_resolution: 'Document resolution outcome',

      // Legal Research
      receive_research_request: 'Receive research request',
      identify_issues: 'Identify legal issues',
      search_authorities: 'Search legal authorities',
      analyze_findings: 'Analyze research findings',
      synthesize_results: 'Synthesize research results',
      draft_memo: 'Draft legal memorandum',
      review_quality: 'Review memo quality',
      deliver_research: 'Deliver research to requestor',

      // Privacy Compliance
      identify_data_processing: 'Identify data processing activities',
      map_data_flows: 'Map personal data flows',
      assess_legal_basis: 'Assess legal basis for processing',
      implement_controls: 'Implement privacy controls',
      document_compliance: 'Document compliance measures',
      manage_dsr_requests: 'Manage data subject requests',
      monitor_compliance: 'Monitor ongoing compliance',
      report_incidents: 'Report and manage incidents',

      // Consent Management
      define_consent_requirements: 'Define consent requirements',
      design_consent_flows: 'Design consent collection flows',
      collect_consents: 'Collect user consents',
      record_consents: 'Record consent records',
      manage_preferences: 'Manage user preferences',
      process_withdrawals: 'Process consent withdrawals',
      audit_consents: 'Audit consent records',
      report_status: 'Report consent status',
    };

    return mapping[stepName] || stepName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default LegalDomainIntelligence;

// Convenience functions
export function createLegalIntelligence(region: string = 'kuwait'): LegalDomainIntelligence {
  return new LegalDomainIntelligence(region);
}

export function detectLegalWorkflow(request: string, region: string = 'kuwait'): string | null {
  const intelligence = new LegalDomainIntelligence(region);
  return intelligence.detectLegalPattern(request);
}

export function analyzeLegalRequest(request: string, region: string = 'kuwait'): LegalAnalysisResult {
  const intelligence = new LegalDomainIntelligence(region);
  const pattern = intelligence.detectLegalPattern(request);

  return {
    pattern,
    requirements: pattern ? intelligence.getImplicitRequirements(pattern) : [],
    tools: pattern ? intelligence.getToolRecommendations(pattern) : [],
    questions: pattern ? intelligence.getClarifyingQuestions(pattern) : [],
    regionalContext: intelligence.getRegionalContext(),
    riskAssessment: null,
  };
}

/**
 * Get contract expiry alert for a specific contract
 */
export function getContractExpiryAlert(
  expiryDate: Date,
  noticePeriodDays: number = 90,
  contractId?: string
): ContractExpiryAlert {
  const intelligence = new LegalDomainIntelligence('kuwait');
  return intelligence.getContractExpiryAlert(expiryDate, noticePeriodDays, contractId);
}

/**
 * Calculate statute of limitations for a claim
 */
export function calculateStatuteOfLimitations(
  claimType: string,
  jurisdiction: string = 'kuwait',
  incidentDate?: Date
): StatuteOfLimitationsResult {
  const intelligence = new LegalDomainIntelligence(jurisdiction);
  return intelligence.calculateStatuteOfLimitations(claimType, jurisdiction, incidentDate);
}

/**
 * Get legal compliance requirements for a region
 */
export function getLegalComplianceRequirements(region: string = 'kuwait'): string[] {
  const intelligence = new LegalDomainIntelligence(region);
  return intelligence.getComplianceRequirements();
}

/**
 * Get court system information for a region
 */
export function getCourtSystemInfo(region: string = 'kuwait'): {
  courtSystem: string;
  arbitration: string;
  notarization: string;
} | null {
  const intelligence = new LegalDomainIntelligence(region);
  return intelligence.getCourtSystemInfo();
}
