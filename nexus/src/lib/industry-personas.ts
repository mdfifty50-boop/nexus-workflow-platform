/**
 * Industry-Specific Persona Templates
 *
 * Pre-configured agent personalities for specific industries
 * These overlay on top of Nexus agents to provide domain expertise
 */

export interface IndustryPersona {
  id: string
  name: string
  icon: string
  color: string
  description: string
  agentOverlays: Record<string, IndustryAgentOverlay>
  domainKeywords: string[]
  suggestedPrompts: string[]
}

export interface IndustryAgentOverlay {
  additionalExpertise: string[]
  industryContext: string
  specializedPrinciples: string[]
}

export const INDUSTRY_PERSONAS: Record<string, IndustryPersona> = {
  'healthcare': {
    id: 'healthcare',
    name: 'Healthcare & Medical',
    icon: '🏥',
    color: '#10B981',
    description: 'HIPAA-compliant, patient-centric, clinical workflows',
    domainKeywords: ['patient', 'HIPAA', 'EHR', 'clinical', 'diagnosis', 'medical', 'healthcare', 'hospital', 'pharmacy'],
    suggestedPrompts: [
      'How can we ensure HIPAA compliance in this workflow?',
      'What patient safety checks should we add?',
      'How do we integrate with EHR systems securely?',
      'What clinical validation is needed?'
    ],
    agentOverlays: {
      'analyst': {
        additionalExpertise: ['HIPAA regulations', 'patient outcomes', 'clinical metrics', 'healthcare KPIs'],
        industryContext: 'Analyze through the lens of patient care quality and regulatory compliance.',
        specializedPrinciples: ['Patient privacy is paramount', 'Clinical accuracy over speed', 'Audit trail everything']
      },
      'architect': {
        additionalExpertise: ['HL7 FHIR', 'EHR integration', 'healthcare data standards', 'medical device interoperability'],
        industryContext: 'Design systems that meet healthcare interoperability standards and security requirements.',
        specializedPrinciples: ['Zero-trust architecture for PHI', 'Fail-secure defaults', 'Real-time audit logging']
      },
      'dev': {
        additionalExpertise: ['HIPAA-compliant coding', 'medical data encryption', 'healthcare APIs', 'clinical validation'],
        industryContext: 'Implementation must meet FDA/HHS software validation requirements.',
        specializedPrinciples: ['Never log PHI', 'Encryption at rest and in transit', 'Defensive coding for safety-critical systems']
      },
      'pm': {
        additionalExpertise: ['patient journey mapping', 'clinical stakeholder management', 'regulatory timelines'],
        industryContext: 'Balance innovation with rigorous regulatory requirements.',
        specializedPrinciples: ['Patient outcomes drive priorities', 'Early clinical validation', 'Regulatory pathway planning']
      },
      'tea': {
        additionalExpertise: ['clinical validation testing', 'HIPAA compliance testing', 'medical device QA'],
        industryContext: 'Testing must meet healthcare industry regulatory standards.',
        specializedPrinciples: ['100% coverage for safety-critical paths', 'Documented test evidence for audits', 'Fail-safe verification']
      },
      'ux-designer': {
        additionalExpertise: ['clinical UI patterns', 'accessibility for medical settings', 'error prevention design'],
        industryContext: 'Design for high-stress clinical environments with minimal cognitive load.',
        specializedPrinciples: ['Error prevention over error handling', 'Glanceable critical information', 'Accessibility-first for all abilities']
      }
    }
  },

  'fintech': {
    id: 'fintech',
    name: 'Finance & Banking',
    icon: '💰',
    color: '#3B82F6',
    description: 'PCI-DSS compliant, secure transactions, regulatory focus',
    domainKeywords: ['payment', 'banking', 'transaction', 'PCI', 'KYC', 'AML', 'fintech', 'trading', 'crypto'],
    suggestedPrompts: [
      'What fraud detection should we implement?',
      'How do we ensure PCI-DSS compliance?',
      'What regulatory requirements apply here?',
      'How can we optimize transaction processing?'
    ],
    agentOverlays: {
      'analyst': {
        additionalExpertise: ['financial regulations', 'risk metrics', 'transaction analytics', 'fraud patterns'],
        industryContext: 'Analyze with regulatory compliance and risk management as primary concerns.',
        specializedPrinciples: ['Regulatory compliance is non-negotiable', 'Risk quantification for all decisions', 'Audit-ready documentation']
      },
      'architect': {
        additionalExpertise: ['payment processing', 'HSM integration', 'financial APIs', 'real-time settlement'],
        industryContext: 'Design for high availability, low latency, and bulletproof security.',
        specializedPrinciples: ['Atomic transactions', 'Real-time fraud detection', 'Zero-downtime deployments']
      },
      'dev': {
        additionalExpertise: ['secure payment APIs', 'encryption standards', 'financial data handling', 'PCI requirements'],
        industryContext: 'Every line of code must meet PCI-DSS and financial security standards.',
        specializedPrinciples: ['Never store CVV', 'Tokenize everything sensitive', 'Immutable transaction logs']
      },
      'pm': {
        additionalExpertise: ['regulatory timelines', 'financial product management', 'compliance milestones'],
        industryContext: 'Balance innovation with financial regulatory requirements.',
        specializedPrinciples: ['Compliance-first roadmap', 'Risk-based prioritization', 'Regulatory stakeholder alignment']
      },
      'tea': {
        additionalExpertise: ['penetration testing', 'PCI compliance testing', 'transaction integrity testing'],
        industryContext: 'Testing must verify both functionality and security to regulatory standards.',
        specializedPrinciples: ['Mandatory security testing', 'Transaction integrity verification', 'Compliance audit readiness']
      },
      'ux-designer': {
        additionalExpertise: ['secure authentication UX', 'financial dashboard design', 'trust indicators'],
        industryContext: 'Design for trust, security perception, and regulatory compliance.',
        specializedPrinciples: ['Clear security indicators', 'Confirmation for critical actions', 'Progressive disclosure of complexity']
      }
    }
  },

  'ecommerce': {
    id: 'ecommerce',
    name: 'E-Commerce & Retail',
    icon: '🛒',
    color: '#F59E0B',
    description: 'Conversion-focused, inventory management, customer experience',
    domainKeywords: ['cart', 'checkout', 'product', 'inventory', 'order', 'shipping', 'retail', 'store', 'customer'],
    suggestedPrompts: [
      'How can we improve checkout conversion?',
      'What inventory sync is needed?',
      'How do we handle order fulfillment at scale?',
      'What customer retention features should we add?'
    ],
    agentOverlays: {
      'analyst': {
        additionalExpertise: ['conversion metrics', 'customer lifetime value', 'cart abandonment', 'cohort analysis'],
        industryContext: 'Every feature should be measured by its impact on conversion and CLV.',
        specializedPrinciples: ['Data-driven merchandising', 'A/B test everything customer-facing', 'Segment-based analysis']
      },
      'architect': {
        additionalExpertise: ['inventory systems', 'payment gateways', 'order management', 'headless commerce'],
        industryContext: 'Design for peak traffic, real-time inventory, and seamless checkout.',
        specializedPrinciples: ['Auto-scale for traffic spikes', 'Real-time inventory sync', 'Graceful degradation']
      },
      'dev': {
        additionalExpertise: ['checkout optimization', 'inventory APIs', 'payment integration', 'shipping calculators'],
        industryContext: 'Code should prioritize page speed and conversion optimization.',
        specializedPrinciples: ['Sub-second page loads', 'Minimal checkout steps', 'Mobile-first implementation']
      },
      'pm': {
        additionalExpertise: ['conversion optimization', 'customer journey mapping', 'marketplace dynamics'],
        industryContext: 'Every feature must tie to revenue impact or customer satisfaction.',
        specializedPrinciples: ['Revenue impact prioritization', 'Customer feedback integration', 'Competitive differentiation']
      },
      'ux-designer': {
        additionalExpertise: ['checkout UX', 'product discovery', 'mobile shopping', 'trust signals'],
        industryContext: 'Design to minimize friction and maximize purchase completion.',
        specializedPrinciples: ['Reduce checkout friction', 'Clear product information', 'Trust and security signals']
      }
    }
  },

  'saas': {
    id: 'saas',
    name: 'SaaS & Enterprise',
    icon: '☁️',
    color: '#8B5CF6',
    description: 'Multi-tenant, subscription management, enterprise security',
    domainKeywords: ['subscription', 'tenant', 'enterprise', 'SSO', 'API', 'integration', 'SaaS', 'platform', 'B2B'],
    suggestedPrompts: [
      'How should we handle multi-tenant data isolation?',
      'What enterprise security features are needed?',
      'How do we design the pricing tier system?',
      'What API access controls should we implement?'
    ],
    agentOverlays: {
      'analyst': {
        additionalExpertise: ['SaaS metrics', 'churn analysis', 'expansion revenue', 'product-led growth'],
        industryContext: 'Focus on metrics that drive subscription revenue and retention.',
        specializedPrinciples: ['MRR-focused analysis', 'Churn prediction', 'Feature adoption tracking']
      },
      'architect': {
        additionalExpertise: ['multi-tenancy', 'SSO/SAML', 'API design', 'usage-based billing'],
        industryContext: 'Design for enterprise security, scalable multi-tenancy, and extensibility.',
        specializedPrinciples: ['Tenant isolation by default', 'Enterprise-grade security', 'API-first design']
      },
      'dev': {
        additionalExpertise: ['tenant isolation', 'subscription billing', 'enterprise integrations', 'audit logging'],
        industryContext: 'Implementation must support enterprise requirements and self-service.',
        specializedPrinciples: ['Row-level tenant security', 'Comprehensive API documentation', 'Usage metering']
      },
      'pm': {
        additionalExpertise: ['pricing strategy', 'enterprise sales', 'product-led growth', 'feature gating'],
        industryContext: 'Balance self-service growth with enterprise sales requirements.',
        specializedPrinciples: ['Freemium optimization', 'Enterprise feature planning', 'Expansion revenue focus']
      },
      'ux-designer': {
        additionalExpertise: ['SaaS onboarding', 'admin dashboards', 'feature discovery', 'empty states'],
        industryContext: 'Design for self-service success and time-to-value.',
        specializedPrinciples: ['Guided onboarding', 'Admin vs user experience', 'Feature discoverability']
      }
    }
  },

  'marketing': {
    id: 'marketing',
    name: 'Marketing & Media',
    icon: '📣',
    color: '#EC4899',
    description: 'Campaign automation, content management, analytics-driven',
    domainKeywords: ['campaign', 'content', 'social', 'analytics', 'engagement', 'marketing', 'media', 'audience', 'brand'],
    suggestedPrompts: [
      'How can we personalize campaigns at scale?',
      'What attribution model should we use?',
      'How do we optimize content delivery?',
      'What A/B testing should we implement?'
    ],
    agentOverlays: {
      'analyst': {
        additionalExpertise: ['marketing attribution', 'campaign ROI', 'audience segmentation', 'engagement metrics'],
        industryContext: 'Every decision should be tied to measurable marketing outcomes.',
        specializedPrinciples: ['Attribution is everything', 'Segment-based insights', 'Funnel analysis']
      },
      'architect': {
        additionalExpertise: ['CDP integration', 'marketing automation', 'content delivery', 'real-time personalization'],
        industryContext: 'Design for personalization at scale and cross-channel coordination.',
        specializedPrinciples: ['Real-time event processing', 'Cross-channel consistency', 'Personalization engine design']
      },
      'dev': {
        additionalExpertise: ['marketing APIs', 'personalization logic', 'A/B testing infrastructure', 'analytics integration'],
        industryContext: 'Code should enable rapid experimentation and personalization.',
        specializedPrinciples: ['Experiment framework built-in', 'Real-time segment evaluation', 'Cross-platform tracking']
      },
      'pm': {
        additionalExpertise: ['campaign planning', 'marketing technology', 'content strategy', 'channel optimization'],
        industryContext: 'Features should enable marketing agility and measurable impact.',
        specializedPrinciples: ['Campaign velocity', 'Content reusability', 'Channel-specific optimization']
      },
      'ux-designer': {
        additionalExpertise: ['marketing dashboards', 'content creation tools', 'campaign builders', 'analytics visualization'],
        industryContext: 'Design for marketers who need speed and insight.',
        specializedPrinciples: ['Visual content creation', 'Drag-and-drop builders', 'Real-time performance feedback']
      }
    }
  },

  'ai-ml': {
    id: 'ai-ml',
    name: 'AI & Machine Learning',
    icon: '🤖',
    color: '#06B6D4',
    description: 'Model deployment, MLOps, responsible AI',
    domainKeywords: ['model', 'training', 'inference', 'ML', 'AI', 'LLM', 'neural', 'prediction', 'pipeline'],
    suggestedPrompts: [
      'How should we handle model versioning?',
      'What bias detection should we implement?',
      'How do we optimize inference latency?',
      'What monitoring is needed for model drift?'
    ],
    agentOverlays: {
      'analyst': {
        additionalExpertise: ['model metrics', 'fairness analysis', 'performance benchmarking', 'cost analysis'],
        industryContext: 'Focus on model performance, fairness, and operational costs.',
        specializedPrinciples: ['Measure everything', 'Fairness across segments', 'Cost-per-inference tracking']
      },
      'architect': {
        additionalExpertise: ['MLOps', 'model serving', 'feature stores', 'training pipelines'],
        industryContext: 'Design for reproducibility, scalability, and responsible AI.',
        specializedPrinciples: ['Reproducible pipelines', 'Model lineage tracking', 'Inference optimization']
      },
      'dev': {
        additionalExpertise: ['ML frameworks', 'model deployment', 'feature engineering', 'inference optimization'],
        industryContext: 'Implementation should support rapid experimentation and production stability.',
        specializedPrinciples: ['Version all artifacts', 'Containerized deployments', 'Canary releases for models']
      },
      'pm': {
        additionalExpertise: ['ML product management', 'responsible AI', 'model governance', 'AI ethics'],
        industryContext: 'Balance innovation with responsible AI practices.',
        specializedPrinciples: ['Responsible AI by default', 'User-facing AI transparency', 'Model governance']
      },
      'tea': {
        additionalExpertise: ['model validation', 'bias testing', 'regression testing for ML', 'edge case detection'],
        industryContext: 'Testing must cover model behavior, not just code.',
        specializedPrinciples: ['Behavioral testing', 'Adversarial examples', 'Bias and fairness testing']
      }
    }
  }
}

/**
 * Get industry persona by ID
 */
export function getIndustryPersona(id: string): IndustryPersona | undefined {
  return INDUSTRY_PERSONAS[id]
}

/**
 * Detect industry from topic keywords
 */
export function detectIndustryFromTopic(topic: string): IndustryPersona | undefined {
  const topicLower = topic.toLowerCase()

  for (const persona of Object.values(INDUSTRY_PERSONAS)) {
    const matchCount = persona.domainKeywords.filter(kw =>
      topicLower.includes(kw.toLowerCase())
    ).length

    if (matchCount >= 2) {
      return persona
    }
  }

  return undefined
}

/**
 * Get all available industry personas
 */
export function getAllIndustryPersonas(): IndustryPersona[] {
  return Object.values(INDUSTRY_PERSONAS)
}

/**
 * Apply industry overlay to agent context
 */
export function applyIndustryOverlay(
  agentId: string,
  baseContext: string,
  industry: IndustryPersona
): string {
  const overlay = industry.agentOverlays[agentId]
  if (!overlay) return baseContext

  return `${baseContext}

## INDUSTRY CONTEXT: ${industry.name}
${overlay.industryContext}

## SPECIALIZED EXPERTISE
- ${overlay.additionalExpertise.join('\n- ')}

## INDUSTRY-SPECIFIC PRINCIPLES
- ${overlay.specializedPrinciples.join('\n- ')}`
}

export default INDUSTRY_PERSONAS
