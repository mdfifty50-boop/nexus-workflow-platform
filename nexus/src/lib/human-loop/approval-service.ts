/**
 * Approval Workflow Service
 *
 * Comprehensive service for managing approval requests and multi-step approval flows.
 * Supports single approver, multi-approver, sequential chains, and auto-escalation.
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type ApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'escalated'
  | 'expired'
  | 'cancelled';

export type ApprovalType =
  | 'single'           // One approver needed
  | 'multi_all'        // All approvers must approve
  | 'multi_any'        // Any one approver can approve
  | 'sequential'       // Approvers in order
  | 'threshold';       // Based on voting threshold

export type ApprovalPriority = 'low' | 'medium' | 'high' | 'critical';

export type RiskLevel = 'minimal' | 'low' | 'medium' | 'high' | 'critical';

export type EscalationReason =
  | 'timeout'
  | 'manual'
  | 'policy_violation'
  | 'high_risk'
  | 'approver_unavailable';

export interface ApprovalMetadata {
  workflowId?: string;
  workflowName?: string;
  nodeId?: string;
  nodeName?: string;
  executionId?: string;
  amount?: number;
  currency?: string;
  riskScore?: number;
  customFields?: Record<string, unknown>;
}

export interface ApprovalDecision {
  deciderId: string;
  deciderName: string;
  deciderEmail?: string;
  decision: 'approved' | 'rejected';
  comment?: string;
  decidedAt: Date;
  conditions?: string[];
}

export interface EscalationRecord {
  escalatedAt: Date;
  escalatedBy: string;
  reason: EscalationReason;
  fromApproverId?: string;
  toApproverId: string;
  comment?: string;
}

export interface ApprovalSLA {
  expectedResponseTime: number;  // in minutes
  warningThreshold: number;      // in minutes (trigger warning)
  escalationThreshold: number;   // in minutes (auto-escalate)
  expirationTime?: number;       // in minutes (auto-expire)
}

export interface Approver {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  delegateTo?: string;           // Delegate approvals to another user
  isAvailable: boolean;
  maxApprovalAmount?: number;    // Maximum amount this approver can approve
}

export interface ApprovalRequest {
  id: string;
  title: string;
  description: string;
  type: ApprovalType;
  status: ApprovalStatus;
  priority: ApprovalPriority;
  riskLevel: RiskLevel;

  // Requester info
  requesterId: string;
  requesterName: string;
  requesterEmail?: string;

  // Approvers
  approverIds: string[];
  currentApproverIndex: number;  // For sequential approvals

  // Decisions
  decisions: ApprovalDecision[];
  requiredApprovals: number;     // For threshold-based

  // Timing
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  completedAt?: Date;

  // SLA tracking
  sla?: ApprovalSLA;
  slaStatus: 'on_track' | 'at_risk' | 'breached';

  // Escalation
  escalationHistory: EscalationRecord[];
  escalationLevel: number;

  // Metadata
  metadata: ApprovalMetadata;

  // Policy reference
  policyId?: string;
  policyName?: string;
}

export interface ApprovalStep {
  stepNumber: number;
  name: string;
  description?: string;
  approverIds: string[];
  type: ApprovalType;
  requiredApprovals: number;
  status: ApprovalStatus;
  decisions: ApprovalDecision[];
  sla?: ApprovalSLA;
  conditions?: ApprovalCondition[];
}

export interface ApprovalCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
  value: unknown;
}

export interface ApprovalWorkflow {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  version: number;

  // Steps
  steps: ApprovalStep[];
  currentStepIndex: number;

  // Overall status
  status: ApprovalStatus;

  // Timing
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;

  // Context
  requestId: string;
  metadata: ApprovalMetadata;

  // Tracking
  totalApproversRequired: number;
  totalApprovalsReceived: number;
}

export interface ApprovalPolicy {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  priority: number;  // Higher priority policies evaluated first

  // Conditions for when this policy applies
  conditions: ApprovalPolicyCondition[];

  // What happens when policy matches
  approvalType: ApprovalType;
  approverRoles: string[];
  specificApproverIds?: string[];
  requiredApprovals: number;
  sla: ApprovalSLA;

  // Auto-actions
  autoApproveBelow?: number;     // Auto-approve amounts below this
  autoRejectAbove?: number;      // Auto-reject amounts above this

  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalPolicyCondition {
  type: 'amount' | 'workflow_type' | 'risk_level' | 'user_role' | 'department' | 'custom';
  field?: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'in' | 'contains';
  value: unknown;
}

export interface ApprovalStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  escalatedRequests: number;
  expiredRequests: number;
  averageResponseTime: number;   // in minutes
  slaComplianceRate: number;     // percentage
  approvalRate: number;          // percentage
}

export interface CreateApprovalOptions {
  title: string;
  description: string;
  requesterId: string;
  requesterName: string;
  requesterEmail?: string;
  approverIds: string[];
  type?: ApprovalType;
  priority?: ApprovalPriority;
  riskLevel?: RiskLevel;
  dueDate?: Date;
  sla?: ApprovalSLA;
  metadata?: ApprovalMetadata;
  policyId?: string;
}

export interface ApprovalFilter {
  status?: ApprovalStatus[];
  type?: ApprovalType[];
  priority?: ApprovalPriority[];
  riskLevel?: RiskLevel[];
  requesterId?: string;
  approverId?: string;
  workflowId?: string;
  fromDate?: Date;
  toDate?: Date;
  slaStatus?: ('on_track' | 'at_risk' | 'breached')[];
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockApprovers: Map<string, Approver> = new Map([
  ['approver-1', {
    id: 'approver-1',
    name: 'Alice Manager',
    email: 'alice@example.com',
    role: 'manager',
    department: 'Engineering',
    isAvailable: true,
    maxApprovalAmount: 10000
  }],
  ['approver-2', {
    id: 'approver-2',
    name: 'Bob Director',
    email: 'bob@example.com',
    role: 'director',
    department: 'Engineering',
    isAvailable: true,
    maxApprovalAmount: 50000
  }],
  ['approver-3', {
    id: 'approver-3',
    name: 'Carol VP',
    email: 'carol@example.com',
    role: 'vp',
    department: 'Engineering',
    isAvailable: true,
    maxApprovalAmount: 100000
  }],
  ['approver-4', {
    id: 'approver-4',
    name: 'David Finance',
    email: 'david@example.com',
    role: 'finance_manager',
    department: 'Finance',
    isAvailable: true,
    maxApprovalAmount: 25000
  }],
  ['approver-5', {
    id: 'approver-5',
    name: 'Eve Legal',
    email: 'eve@example.com',
    role: 'legal_counsel',
    department: 'Legal',
    isAvailable: false,
    delegateTo: 'approver-2'
  }]
]);

const mockPolicies: Map<string, ApprovalPolicy> = new Map([
  ['policy-low-amount', {
    id: 'policy-low-amount',
    name: 'Low Amount Auto-Approve',
    description: 'Auto-approve requests under $100',
    isActive: true,
    priority: 100,
    conditions: [
      { type: 'amount', operator: 'less_than', value: 100 }
    ],
    approvalType: 'single',
    approverRoles: [],
    requiredApprovals: 0,
    sla: { expectedResponseTime: 0, warningThreshold: 0, escalationThreshold: 0 },
    autoApproveBelow: 100,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }],
  ['policy-medium-amount', {
    id: 'policy-medium-amount',
    name: 'Medium Amount Single Approval',
    description: 'Single manager approval for $100-$5000',
    isActive: true,
    priority: 90,
    conditions: [
      { type: 'amount', operator: 'greater_than', value: 100 },
      { type: 'amount', operator: 'less_than', value: 5000 }
    ],
    approvalType: 'single',
    approverRoles: ['manager'],
    requiredApprovals: 1,
    sla: {
      expectedResponseTime: 60,
      warningThreshold: 45,
      escalationThreshold: 120,
      expirationTime: 1440
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }],
  ['policy-high-amount', {
    id: 'policy-high-amount',
    name: 'High Amount Multi-Approval',
    description: 'Manager and Director approval for $5000-$25000',
    isActive: true,
    priority: 80,
    conditions: [
      { type: 'amount', operator: 'greater_than', value: 5000 },
      { type: 'amount', operator: 'less_than', value: 25000 }
    ],
    approvalType: 'sequential',
    approverRoles: ['manager', 'director'],
    requiredApprovals: 2,
    sla: {
      expectedResponseTime: 120,
      warningThreshold: 90,
      escalationThreshold: 240,
      expirationTime: 2880
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }],
  ['policy-critical-amount', {
    id: 'policy-critical-amount',
    name: 'Critical Amount Full Chain',
    description: 'Full approval chain for amounts over $25000',
    isActive: true,
    priority: 70,
    conditions: [
      { type: 'amount', operator: 'greater_than', value: 25000 }
    ],
    approvalType: 'sequential',
    approverRoles: ['manager', 'director', 'vp', 'finance_manager'],
    requiredApprovals: 4,
    sla: {
      expectedResponseTime: 240,
      warningThreshold: 180,
      escalationThreshold: 480,
      expirationTime: 4320
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }],
  ['policy-high-risk', {
    id: 'policy-high-risk',
    name: 'High Risk Multi-Department',
    description: 'Multi-department approval for high-risk workflows',
    isActive: true,
    priority: 95,
    conditions: [
      { type: 'risk_level', operator: 'in', value: ['high', 'critical'] }
    ],
    approvalType: 'multi_all',
    approverRoles: ['director', 'legal_counsel', 'finance_manager'],
    requiredApprovals: 3,
    sla: {
      expectedResponseTime: 180,
      warningThreshold: 120,
      escalationThreshold: 360,
      expirationTime: 2880
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }]
]);

// In-memory storage for development
const approvalRequests: Map<string, ApprovalRequest> = new Map();
const approvalWorkflows: Map<string, ApprovalWorkflow> = new Map();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a unique ID
 */
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get approver by ID with delegation handling
 */
export function getApprover(approverId: string): Approver | null {
  const approver = mockApprovers.get(approverId);
  if (!approver) return null;

  // Handle delegation if approver is unavailable
  if (!approver.isAvailable && approver.delegateTo) {
    return mockApprovers.get(approver.delegateTo) || null;
  }

  return approver;
}

/**
 * Get all approvers
 */
export function getAllApprovers(): Approver[] {
  return Array.from(mockApprovers.values());
}

/**
 * Get approvers by role
 */
export function getApproversByRole(role: string): Approver[] {
  return Array.from(mockApprovers.values()).filter(a => a.role === role);
}

/**
 * Get available approvers
 */
export function getAvailableApprovers(): Approver[] {
  return Array.from(mockApprovers.values()).filter(a => a.isAvailable);
}

/**
 * Calculate SLA status based on creation time and SLA config
 */
function calculateSLAStatus(
  createdAt: Date,
  sla?: ApprovalSLA
): 'on_track' | 'at_risk' | 'breached' {
  if (!sla) return 'on_track';

  const elapsedMinutes = (Date.now() - createdAt.getTime()) / (1000 * 60);

  if (elapsedMinutes >= sla.escalationThreshold) {
    return 'breached';
  } else if (elapsedMinutes >= sla.warningThreshold) {
    return 'at_risk';
  }

  return 'on_track';
}

/**
 * Find matching policy for an approval request
 */
export function findMatchingPolicy(
  amount?: number,
  riskLevel?: RiskLevel,
  workflowType?: string,
  userRole?: string
): ApprovalPolicy | null {
  const policies = Array.from(mockPolicies.values())
    .filter(p => p.isActive)
    .sort((a, b) => b.priority - a.priority);

  for (const policy of policies) {
    let matches = true;

    for (const condition of policy.conditions) {
      switch (condition.type) {
        case 'amount':
          if (amount === undefined) {
            matches = false;
            break;
          }
          matches = evaluateCondition(amount, condition.operator, condition.value as number);
          break;
        case 'risk_level':
          if (!riskLevel) {
            matches = false;
            break;
          }
          matches = evaluateCondition(riskLevel, condition.operator, condition.value);
          break;
        case 'workflow_type':
          if (!workflowType) {
            matches = false;
            break;
          }
          matches = evaluateCondition(workflowType, condition.operator, condition.value);
          break;
        case 'user_role':
          if (!userRole) {
            matches = false;
            break;
          }
          matches = evaluateCondition(userRole, condition.operator, condition.value);
          break;
      }

      if (!matches) break;
    }

    if (matches) return policy;
  }

  return null;
}

/**
 * Evaluate a condition
 */
function evaluateCondition(
  fieldValue: unknown,
  operator: string,
  conditionValue: unknown
): boolean {
  switch (operator) {
    case 'equals':
      return fieldValue === conditionValue;
    case 'not_equals':
      return fieldValue !== conditionValue;
    case 'greater_than':
      return (fieldValue as number) > (conditionValue as number);
    case 'less_than':
      return (fieldValue as number) < (conditionValue as number);
    case 'in':
      return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
    case 'contains':
      return String(fieldValue).includes(String(conditionValue));
    default:
      return false;
  }
}

/**
 * Get approvers for a policy
 */
function getApproversForPolicy(policy: ApprovalPolicy): string[] {
  if (policy.specificApproverIds && policy.specificApproverIds.length > 0) {
    return policy.specificApproverIds;
  }

  const approvers: string[] = [];
  for (const role of policy.approverRoles) {
    const roleApprovers = getApproversByRole(role);
    if (roleApprovers.length > 0) {
      // Get first available approver for each role
      const available = roleApprovers.find(a => a.isAvailable);
      if (available) {
        approvers.push(available.id);
      } else if (roleApprovers[0].delegateTo) {
        approvers.push(roleApprovers[0].delegateTo);
      }
    }
  }

  return approvers;
}

/**
 * Check if approval request is complete based on type
 */
function checkApprovalCompletion(request: ApprovalRequest): ApprovalStatus {
  const approvedCount = request.decisions.filter(d => d.decision === 'approved').length;
  const rejectedCount = request.decisions.filter(d => d.decision === 'rejected').length;

  switch (request.type) {
    case 'single':
      if (approvedCount >= 1) return 'approved';
      if (rejectedCount >= 1) return 'rejected';
      break;

    case 'multi_all':
      if (rejectedCount >= 1) return 'rejected';
      if (approvedCount >= request.approverIds.length) return 'approved';
      break;

    case 'multi_any':
      if (approvedCount >= 1) return 'approved';
      if (rejectedCount >= request.approverIds.length) return 'rejected';
      break;

    case 'sequential':
      if (rejectedCount >= 1) return 'rejected';
      if (approvedCount >= request.approverIds.length) return 'approved';
      break;

    case 'threshold':
      if (approvedCount >= request.requiredApprovals) return 'approved';
      const remainingApprovers = request.approverIds.length - (approvedCount + rejectedCount);
      if (approvedCount + remainingApprovers < request.requiredApprovals) return 'rejected';
      break;
  }

  return 'pending';
}

// ============================================================================
// CORE APPROVAL REQUEST FUNCTIONS
// ============================================================================

/**
 * Create a new approval request
 */
export async function createApprovalRequest(
  options: CreateApprovalOptions
): Promise<ApprovalRequest> {
  const {
    title,
    description,
    requesterId,
    requesterName,
    requesterEmail,
    approverIds,
    type = 'single',
    priority = 'medium',
    riskLevel = 'low',
    dueDate,
    sla,
    metadata = {},
    policyId
  } = options;

  // Check for matching policy if not specified
  let appliedPolicy: ApprovalPolicy | null = null;
  let finalApproverIds = approverIds;
  let finalType = type;
  let finalSla = sla;

  if (policyId) {
    appliedPolicy = mockPolicies.get(policyId) || null;
  } else {
    appliedPolicy = findMatchingPolicy(
      metadata.amount,
      riskLevel,
      metadata.workflowName,
      undefined
    );
  }

  if (appliedPolicy) {
    // Check for auto-approve
    if (appliedPolicy.autoApproveBelow !== undefined &&
        metadata.amount !== undefined &&
        metadata.amount < appliedPolicy.autoApproveBelow) {
      const request: ApprovalRequest = {
        id: generateId('apr'),
        title,
        description,
        type: 'single',
        status: 'approved',
        priority,
        riskLevel,
        requesterId,
        requesterName,
        requesterEmail,
        approverIds: [],
        currentApproverIndex: 0,
        decisions: [{
          deciderId: 'system',
          deciderName: 'Auto-Approval System',
          decision: 'approved',
          decidedAt: new Date(),
          comment: `Auto-approved: Amount $${metadata.amount} below threshold $${appliedPolicy.autoApproveBelow}`
        }],
        requiredApprovals: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
        slaStatus: 'on_track',
        escalationHistory: [],
        escalationLevel: 0,
        metadata,
        policyId: appliedPolicy.id,
        policyName: appliedPolicy.name
      };

      approvalRequests.set(request.id, request);
      return request;
    }

    // Check for auto-reject
    if (appliedPolicy.autoRejectAbove !== undefined &&
        metadata.amount !== undefined &&
        metadata.amount > appliedPolicy.autoRejectAbove) {
      const request: ApprovalRequest = {
        id: generateId('apr'),
        title,
        description,
        type: 'single',
        status: 'rejected',
        priority,
        riskLevel,
        requesterId,
        requesterName,
        requesterEmail,
        approverIds: [],
        currentApproverIndex: 0,
        decisions: [{
          deciderId: 'system',
          deciderName: 'Auto-Rejection System',
          decision: 'rejected',
          decidedAt: new Date(),
          comment: `Auto-rejected: Amount $${metadata.amount} exceeds threshold $${appliedPolicy.autoRejectAbove}`
        }],
        requiredApprovals: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
        slaStatus: 'on_track',
        escalationHistory: [],
        escalationLevel: 0,
        metadata,
        policyId: appliedPolicy.id,
        policyName: appliedPolicy.name
      };

      approvalRequests.set(request.id, request);
      return request;
    }

    // Apply policy settings
    if (finalApproverIds.length === 0) {
      finalApproverIds = getApproversForPolicy(appliedPolicy);
    }
    finalType = appliedPolicy.approvalType;
    finalSla = appliedPolicy.sla;
  }

  const request: ApprovalRequest = {
    id: generateId('apr'),
    title,
    description,
    type: finalType,
    status: 'pending',
    priority,
    riskLevel,
    requesterId,
    requesterName,
    requesterEmail,
    approverIds: finalApproverIds,
    currentApproverIndex: 0,
    decisions: [],
    requiredApprovals: finalType === 'threshold'
      ? Math.ceil(finalApproverIds.length / 2)
      : finalApproverIds.length,
    createdAt: new Date(),
    updatedAt: new Date(),
    dueDate,
    sla: finalSla,
    slaStatus: 'on_track',
    escalationHistory: [],
    escalationLevel: 0,
    metadata,
    policyId: appliedPolicy?.id,
    policyName: appliedPolicy?.name
  };

  approvalRequests.set(request.id, request);
  return request;
}

/**
 * Approve an approval request
 */
export async function approveRequest(
  requestId: string,
  approverId: string,
  comment?: string,
  conditions?: string[]
): Promise<ApprovalRequest> {
  const request = approvalRequests.get(requestId);
  if (!request) {
    throw new Error(`Approval request ${requestId} not found`);
  }

  if (request.status !== 'pending') {
    throw new Error(`Cannot approve request with status: ${request.status}`);
  }

  // Validate approver
  const approver = getApprover(approverId);
  if (!approver) {
    throw new Error(`Approver ${approverId} not found`);
  }

  // For sequential approvals, check if it's this approver's turn
  if (request.type === 'sequential') {
    const currentApproverId = request.approverIds[request.currentApproverIndex];
    const effectiveApproverId = getApprover(currentApproverId)?.id;
    if (effectiveApproverId !== approverId) {
      throw new Error(`Not this approver's turn. Current approver: ${currentApproverId}`);
    }
  } else if (!request.approverIds.includes(approverId)) {
    // Check if this approver is a delegate
    const isDelegate = request.approverIds.some(aid => {
      const originalApprover = mockApprovers.get(aid);
      return originalApprover?.delegateTo === approverId;
    });
    if (!isDelegate) {
      throw new Error(`Approver ${approverId} is not authorized for this request`);
    }
  }

  // Check if already decided
  if (request.decisions.some(d => d.deciderId === approverId)) {
    throw new Error(`Approver ${approverId} has already made a decision`);
  }

  // Check amount limits
  if (approver.maxApprovalAmount !== undefined &&
      request.metadata.amount !== undefined &&
      request.metadata.amount > approver.maxApprovalAmount) {
    throw new Error(
      `Amount $${request.metadata.amount} exceeds approver's limit of $${approver.maxApprovalAmount}`
    );
  }

  // Record the decision
  const decision: ApprovalDecision = {
    deciderId: approverId,
    deciderName: approver.name,
    deciderEmail: approver.email,
    decision: 'approved',
    comment,
    decidedAt: new Date(),
    conditions
  };

  request.decisions.push(decision);
  request.updatedAt = new Date();

  // For sequential, move to next approver
  if (request.type === 'sequential') {
    request.currentApproverIndex++;
  }

  // Check completion
  const newStatus = checkApprovalCompletion(request);
  request.status = newStatus;

  if (newStatus === 'approved' || newStatus === 'rejected') {
    request.completedAt = new Date();
  }

  // Update SLA status
  request.slaStatus = calculateSLAStatus(request.createdAt, request.sla);

  approvalRequests.set(requestId, request);
  return request;
}

/**
 * Reject an approval request
 */
export async function rejectRequest(
  requestId: string,
  approverId: string,
  comment?: string,
  reason?: string
): Promise<ApprovalRequest> {
  const request = approvalRequests.get(requestId);
  if (!request) {
    throw new Error(`Approval request ${requestId} not found`);
  }

  if (request.status !== 'pending') {
    throw new Error(`Cannot reject request with status: ${request.status}`);
  }

  // Validate approver
  const approver = getApprover(approverId);
  if (!approver) {
    throw new Error(`Approver ${approverId} not found`);
  }

  // For sequential approvals, check if it's this approver's turn
  if (request.type === 'sequential') {
    const currentApproverId = request.approverIds[request.currentApproverIndex];
    const effectiveApproverId = getApprover(currentApproverId)?.id;
    if (effectiveApproverId !== approverId) {
      throw new Error(`Not this approver's turn. Current approver: ${currentApproverId}`);
    }
  } else if (!request.approverIds.includes(approverId)) {
    // Check if this approver is a delegate
    const isDelegate = request.approverIds.some(aid => {
      const originalApprover = mockApprovers.get(aid);
      return originalApprover?.delegateTo === approverId;
    });
    if (!isDelegate) {
      throw new Error(`Approver ${approverId} is not authorized for this request`);
    }
  }

  // Check if already decided
  if (request.decisions.some(d => d.deciderId === approverId)) {
    throw new Error(`Approver ${approverId} has already made a decision`);
  }

  // Record the decision
  const decision: ApprovalDecision = {
    deciderId: approverId,
    deciderName: approver.name,
    deciderEmail: approver.email,
    decision: 'rejected',
    comment: comment || reason,
    decidedAt: new Date()
  };

  request.decisions.push(decision);
  request.updatedAt = new Date();

  // Check completion
  const newStatus = checkApprovalCompletion(request);
  request.status = newStatus;

  if (newStatus === 'approved' || newStatus === 'rejected') {
    request.completedAt = new Date();
  }

  approvalRequests.set(requestId, request);
  return request;
}

/**
 * Escalate an approval request
 */
export async function escalateRequest(
  requestId: string,
  escalatedBy: string,
  reason: EscalationReason,
  toApproverId: string,
  comment?: string
): Promise<ApprovalRequest> {
  const request = approvalRequests.get(requestId);
  if (!request) {
    throw new Error(`Approval request ${requestId} not found`);
  }

  if (request.status !== 'pending') {
    throw new Error(`Cannot escalate request with status: ${request.status}`);
  }

  // Validate new approver
  const newApprover = getApprover(toApproverId);
  if (!newApprover) {
    throw new Error(`New approver ${toApproverId} not found`);
  }

  // Record escalation
  const escalation: EscalationRecord = {
    escalatedAt: new Date(),
    escalatedBy,
    reason,
    fromApproverId: request.approverIds[request.currentApproverIndex],
    toApproverId,
    comment
  };

  request.escalationHistory.push(escalation);
  request.escalationLevel++;
  request.status = 'escalated';
  request.updatedAt = new Date();

  // For sequential approvals, replace current approver
  if (request.type === 'sequential') {
    request.approverIds[request.currentApproverIndex] = toApproverId;
  } else {
    // For other types, add new approver if not already present
    if (!request.approverIds.includes(toApproverId)) {
      request.approverIds.push(toApproverId);
    }
  }

  // Set status back to pending after escalation
  request.status = 'pending';

  approvalRequests.set(requestId, request);
  return request;
}

/**
 * Cancel an approval request
 */
export async function cancelRequest(
  requestId: string,
  cancelledBy: string,
  reason?: string
): Promise<ApprovalRequest> {
  const request = approvalRequests.get(requestId);
  if (!request) {
    throw new Error(`Approval request ${requestId} not found`);
  }

  if (request.status !== 'pending' && request.status !== 'escalated') {
    throw new Error(`Cannot cancel request with status: ${request.status}`);
  }

  request.status = 'cancelled';
  request.updatedAt = new Date();
  request.completedAt = new Date();

  // Add cancellation as a decision for audit trail
  request.decisions.push({
    deciderId: cancelledBy,
    deciderName: 'System',
    decision: 'rejected',
    comment: `Cancelled: ${reason || 'No reason provided'}`,
    decidedAt: new Date()
  });

  approvalRequests.set(requestId, request);
  return request;
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Get approval request by ID
 */
export function getApprovalRequest(requestId: string): ApprovalRequest | null {
  return approvalRequests.get(requestId) || null;
}

/**
 * Get approvals by user (as requester)
 */
export function getApprovalsByUser(userId: string): ApprovalRequest[] {
  return Array.from(approvalRequests.values())
    .filter(r => r.requesterId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Get approvals by workflow
 */
export function getApprovalsByWorkflow(workflowId: string): ApprovalRequest[] {
  return Array.from(approvalRequests.values())
    .filter(r => r.metadata.workflowId === workflowId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Get pending approvals for an approver
 */
export function getPendingApprovals(approverId: string): ApprovalRequest[] {
  return Array.from(approvalRequests.values())
    .filter(r => {
      if (r.status !== 'pending') return false;

      // Check if approver is in the list
      if (r.approverIds.includes(approverId)) {
        // For sequential, check if it's their turn
        if (r.type === 'sequential') {
          const currentApproverId = r.approverIds[r.currentApproverIndex];
          const effectiveApprover = getApprover(currentApproverId);
          return effectiveApprover?.id === approverId;
        }
        // Check if already decided
        return !r.decisions.some(d => d.deciderId === approverId);
      }

      // Check if approver is a delegate for any pending approver
      return r.approverIds.some(aid => {
        const originalApprover = mockApprovers.get(aid);
        return originalApprover?.delegateTo === approverId &&
               !r.decisions.some(d => d.deciderId === approverId);
      });
    })
    .sort((a, b) => {
      // Sort by priority first, then by creation date
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
}

/**
 * Get approvals with filters
 */
export function getApprovals(filter?: ApprovalFilter): ApprovalRequest[] {
  let results = Array.from(approvalRequests.values());

  if (filter) {
    if (filter.status && filter.status.length > 0) {
      results = results.filter(r => filter.status!.includes(r.status));
    }
    if (filter.type && filter.type.length > 0) {
      results = results.filter(r => filter.type!.includes(r.type));
    }
    if (filter.priority && filter.priority.length > 0) {
      results = results.filter(r => filter.priority!.includes(r.priority));
    }
    if (filter.riskLevel && filter.riskLevel.length > 0) {
      results = results.filter(r => filter.riskLevel!.includes(r.riskLevel));
    }
    if (filter.requesterId) {
      results = results.filter(r => r.requesterId === filter.requesterId);
    }
    if (filter.approverId) {
      results = results.filter(r => r.approverIds.includes(filter.approverId!));
    }
    if (filter.workflowId) {
      results = results.filter(r => r.metadata.workflowId === filter.workflowId);
    }
    if (filter.fromDate) {
      results = results.filter(r => r.createdAt >= filter.fromDate!);
    }
    if (filter.toDate) {
      results = results.filter(r => r.createdAt <= filter.toDate!);
    }
    if (filter.slaStatus && filter.slaStatus.length > 0) {
      results = results.filter(r => filter.slaStatus!.includes(r.slaStatus));
    }
  }

  return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Get approval requests at risk of SLA breach
 */
export function getAtRiskApprovals(): ApprovalRequest[] {
  // Update SLA status for all pending requests
  for (const request of approvalRequests.values()) {
    if (request.status === 'pending') {
      request.slaStatus = calculateSLAStatus(request.createdAt, request.sla);
      approvalRequests.set(request.id, request);
    }
  }

  return Array.from(approvalRequests.values())
    .filter(r => r.status === 'pending' && (r.slaStatus === 'at_risk' || r.slaStatus === 'breached'))
    .sort((a, b) => {
      // Breached first, then at_risk
      if (a.slaStatus === 'breached' && b.slaStatus !== 'breached') return -1;
      if (b.slaStatus === 'breached' && a.slaStatus !== 'breached') return 1;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
}

// ============================================================================
// APPROVAL WORKFLOW FUNCTIONS
// ============================================================================

/**
 * Create a multi-step approval workflow
 */
export async function createApprovalWorkflow(
  name: string,
  description: string,
  steps: Omit<ApprovalStep, 'stepNumber' | 'status' | 'decisions'>[],
  requestId: string,
  metadata: ApprovalMetadata = {}
): Promise<ApprovalWorkflow> {
  const workflow: ApprovalWorkflow = {
    id: generateId('awf'),
    name,
    description,
    isActive: true,
    version: 1,
    steps: steps.map((step, index) => ({
      ...step,
      stepNumber: index + 1,
      status: index === 0 ? 'pending' : 'pending',
      decisions: []
    })),
    currentStepIndex: 0,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
    startedAt: new Date(),
    requestId,
    metadata,
    totalApproversRequired: steps.reduce((sum, s) => sum + s.requiredApprovals, 0),
    totalApprovalsReceived: 0
  };

  approvalWorkflows.set(workflow.id, workflow);
  return workflow;
}

/**
 * Get approval workflow by ID
 */
export function getApprovalWorkflow(workflowId: string): ApprovalWorkflow | null {
  return approvalWorkflows.get(workflowId) || null;
}

/**
 * Approve a step in a workflow
 */
export async function approveWorkflowStep(
  workflowId: string,
  approverId: string,
  comment?: string
): Promise<ApprovalWorkflow> {
  const workflow = approvalWorkflows.get(workflowId);
  if (!workflow) {
    throw new Error(`Approval workflow ${workflowId} not found`);
  }

  if (workflow.status !== 'pending') {
    throw new Error(`Cannot approve step in workflow with status: ${workflow.status}`);
  }

  const currentStep = workflow.steps[workflow.currentStepIndex];
  if (!currentStep) {
    throw new Error('No current step in workflow');
  }

  // Validate approver
  const approver = getApprover(approverId);
  if (!approver) {
    throw new Error(`Approver ${approverId} not found`);
  }

  if (!currentStep.approverIds.includes(approverId)) {
    throw new Error(`Approver ${approverId} is not authorized for this step`);
  }

  // Record decision
  currentStep.decisions.push({
    deciderId: approverId,
    deciderName: approver.name,
    deciderEmail: approver.email,
    decision: 'approved',
    comment,
    decidedAt: new Date()
  });

  workflow.totalApprovalsReceived++;
  workflow.updatedAt = new Date();

  // Check if step is complete
  const approvedCount = currentStep.decisions.filter(d => d.decision === 'approved').length;
  if (approvedCount >= currentStep.requiredApprovals) {
    currentStep.status = 'approved';

    // Move to next step or complete workflow
    if (workflow.currentStepIndex < workflow.steps.length - 1) {
      workflow.currentStepIndex++;
    } else {
      workflow.status = 'approved';
      workflow.completedAt = new Date();
    }
  }

  approvalWorkflows.set(workflowId, workflow);
  return workflow;
}

/**
 * Reject a step in a workflow
 */
export async function rejectWorkflowStep(
  workflowId: string,
  approverId: string,
  comment?: string
): Promise<ApprovalWorkflow> {
  const workflow = approvalWorkflows.get(workflowId);
  if (!workflow) {
    throw new Error(`Approval workflow ${workflowId} not found`);
  }

  if (workflow.status !== 'pending') {
    throw new Error(`Cannot reject step in workflow with status: ${workflow.status}`);
  }

  const currentStep = workflow.steps[workflow.currentStepIndex];
  if (!currentStep) {
    throw new Error('No current step in workflow');
  }

  // Validate approver
  const approver = getApprover(approverId);
  if (!approver) {
    throw new Error(`Approver ${approverId} not found`);
  }

  // Record decision
  currentStep.decisions.push({
    deciderId: approverId,
    deciderName: approver.name,
    deciderEmail: approver.email,
    decision: 'rejected',
    comment,
    decidedAt: new Date()
  });

  currentStep.status = 'rejected';
  workflow.status = 'rejected';
  workflow.completedAt = new Date();
  workflow.updatedAt = new Date();

  approvalWorkflows.set(workflowId, workflow);
  return workflow;
}

// ============================================================================
// STATISTICS AND REPORTING
// ============================================================================

/**
 * Get approval statistics
 */
export function getApprovalStats(filter?: ApprovalFilter): ApprovalStats {
  const requests = getApprovals(filter);

  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const approvedRequests = requests.filter(r => r.status === 'approved').length;
  const rejectedRequests = requests.filter(r => r.status === 'rejected').length;
  const escalatedRequests = requests.filter(r => r.escalationHistory.length > 0).length;
  const expiredRequests = requests.filter(r => r.status === 'expired').length;

  // Calculate average response time (only for completed requests)
  const completedRequests = requests.filter(r => r.completedAt);
  const totalResponseTime = completedRequests.reduce((sum, r) => {
    return sum + (r.completedAt!.getTime() - r.createdAt.getTime()) / (1000 * 60);
  }, 0);
  const averageResponseTime = completedRequests.length > 0
    ? totalResponseTime / completedRequests.length
    : 0;

  // Calculate SLA compliance rate
  const requestsWithSLA = requests.filter(r => r.sla && r.completedAt);
  const compliantRequests = requestsWithSLA.filter(r => {
    const responseTime = (r.completedAt!.getTime() - r.createdAt.getTime()) / (1000 * 60);
    return responseTime <= r.sla!.expectedResponseTime;
  });
  const slaComplianceRate = requestsWithSLA.length > 0
    ? (compliantRequests.length / requestsWithSLA.length) * 100
    : 100;

  // Calculate approval rate
  const decidedRequests = approvedRequests + rejectedRequests;
  const approvalRate = decidedRequests > 0
    ? (approvedRequests / decidedRequests) * 100
    : 0;

  return {
    totalRequests,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    escalatedRequests,
    expiredRequests,
    averageResponseTime,
    slaComplianceRate,
    approvalRate
  };
}

/**
 * Get approver statistics
 */
export function getApproverStats(approverId: string): {
  totalDecisions: number;
  approvals: number;
  rejections: number;
  averageResponseTime: number;
} {
  const allRequests = Array.from(approvalRequests.values());

  let totalDecisions = 0;
  let approvals = 0;
  let rejections = 0;
  let totalResponseTime = 0;

  for (const request of allRequests) {
    for (const decision of request.decisions) {
      if (decision.deciderId === approverId) {
        totalDecisions++;
        if (decision.decision === 'approved') approvals++;
        else rejections++;

        // Calculate response time from request creation to decision
        totalResponseTime += (decision.decidedAt.getTime() - request.createdAt.getTime()) / (1000 * 60);
      }
    }
  }

  return {
    totalDecisions,
    approvals,
    rejections,
    averageResponseTime: totalDecisions > 0 ? totalResponseTime / totalDecisions : 0
  };
}

// ============================================================================
// POLICY MANAGEMENT
// ============================================================================

/**
 * Get all approval policies
 */
export function getApprovalPolicies(): ApprovalPolicy[] {
  return Array.from(mockPolicies.values()).sort((a, b) => b.priority - a.priority);
}

/**
 * Get approval policy by ID
 */
export function getApprovalPolicy(policyId: string): ApprovalPolicy | null {
  return mockPolicies.get(policyId) || null;
}

// ============================================================================
// AUTO-ESCALATION HANDLER
// ============================================================================

/**
 * Process auto-escalation for all pending requests
 * This should be called periodically (e.g., every minute)
 */
export async function processAutoEscalation(): Promise<ApprovalRequest[]> {
  const escalatedRequests: ApprovalRequest[] = [];

  for (const request of approvalRequests.values()) {
    if (request.status !== 'pending' || !request.sla) continue;

    const elapsedMinutes = (Date.now() - request.createdAt.getTime()) / (1000 * 60);

    // Check for expiration
    if (request.sla.expirationTime && elapsedMinutes >= request.sla.expirationTime) {
      request.status = 'expired';
      request.completedAt = new Date();
      request.updatedAt = new Date();
      approvalRequests.set(request.id, request);
      continue;
    }

    // Check for auto-escalation
    if (elapsedMinutes >= request.sla.escalationThreshold && request.escalationLevel < 3) {
      // Find next level approver
      const currentApprover = getApprover(request.approverIds[request.currentApproverIndex]);
      if (!currentApprover) continue;

      // Find a higher-level approver
      const higherApprovers = Array.from(mockApprovers.values())
        .filter(a => {
          if (!a.isAvailable) return false;
          if (a.id === currentApprover.id) return false;
          // Simple role hierarchy check
          const roleOrder = ['manager', 'director', 'vp'];
          const currentIndex = roleOrder.indexOf(currentApprover.role);
          const approverIndex = roleOrder.indexOf(a.role);
          return approverIndex > currentIndex;
        });

      if (higherApprovers.length > 0) {
        const newApprover = higherApprovers[0];
        await escalateRequest(
          request.id,
          'system',
          'timeout',
          newApprover.id,
          `Auto-escalated due to SLA breach (${Math.round(elapsedMinutes)} minutes elapsed)`
        );
        escalatedRequests.push(request);
      }
    }
  }

  return escalatedRequests;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the current approver for a request
 */
export function getCurrentApprover(requestId: string): Approver | null {
  const request = approvalRequests.get(requestId);
  if (!request || request.status !== 'pending') return null;

  if (request.type === 'sequential') {
    const approverId = request.approverIds[request.currentApproverIndex];
    return getApprover(approverId);
  }

  // For non-sequential, return first pending approver
  for (const approverId of request.approverIds) {
    if (!request.decisions.some(d => d.deciderId === approverId)) {
      return getApprover(approverId);
    }
  }

  return null;
}

/**
 * Check if a user can approve a request
 */
export function canUserApprove(requestId: string, userId: string): boolean {
  const request = approvalRequests.get(requestId);
  if (!request || request.status !== 'pending') return false;

  // Check if already decided
  if (request.decisions.some(d => d.deciderId === userId)) return false;

  // For sequential, check if it's their turn
  if (request.type === 'sequential') {
    const currentApproverId = request.approverIds[request.currentApproverIndex];
    const effectiveApprover = getApprover(currentApproverId);
    return effectiveApprover?.id === userId;
  }

  // Check direct assignment
  if (request.approverIds.includes(userId)) return true;

  // Check delegation
  return request.approverIds.some(aid => {
    const originalApprover = mockApprovers.get(aid);
    return originalApprover?.delegateTo === userId;
  });
}

/**
 * Get time remaining before SLA breach
 */
export function getTimeToSLABreach(requestId: string): number | null {
  const request = approvalRequests.get(requestId);
  if (!request || !request.sla || request.status !== 'pending') return null;

  const elapsedMinutes = (Date.now() - request.createdAt.getTime()) / (1000 * 60);
  const remaining = request.sla.escalationThreshold - elapsedMinutes;

  return Math.max(0, remaining);
}

/**
 * Format approval request for display
 */
export function formatApprovalSummary(request: ApprovalRequest): string {
  const approvedCount = request.decisions.filter(d => d.decision === 'approved').length;
  const rejectedCount = request.decisions.filter(d => d.decision === 'rejected').length;
  const pendingCount = request.approverIds.length - approvedCount - rejectedCount;

  return `[${request.status.toUpperCase()}] ${request.title} - ` +
    `Approved: ${approvedCount}, Rejected: ${rejectedCount}, Pending: ${pendingCount}`;
}

// ============================================================================
// SEED DATA FOR DEVELOPMENT
// ============================================================================

/**
 * Initialize with sample approval requests (for development)
 */
export async function seedApprovalData(): Promise<void> {
  // Clear existing data
  approvalRequests.clear();
  approvalWorkflows.clear();

  // Create sample requests
  await createApprovalRequest({
    title: 'Budget Increase for Marketing Campaign',
    description: 'Request to increase Q1 marketing budget by $15,000 for social media ads',
    requesterId: 'user-1',
    requesterName: 'John Smith',
    requesterEmail: 'john@example.com',
    approverIds: ['approver-1', 'approver-2'],
    type: 'sequential',
    priority: 'high',
    riskLevel: 'medium',
    metadata: {
      amount: 15000,
      currency: 'USD',
      workflowId: 'wf-1',
      workflowName: 'Budget Approval'
    }
  });

  await createApprovalRequest({
    title: 'New Vendor Contract',
    description: 'Approval needed for new software vendor contract - 3 year term',
    requesterId: 'user-2',
    requesterName: 'Jane Doe',
    approverIds: ['approver-2', 'approver-3', 'approver-4'],
    type: 'multi_all',
    priority: 'critical',
    riskLevel: 'high',
    metadata: {
      amount: 75000,
      currency: 'USD',
      workflowId: 'wf-2',
      workflowName: 'Vendor Onboarding'
    }
  });

  await createApprovalRequest({
    title: 'Travel Expense Report',
    description: 'Travel expenses for client meeting in NYC',
    requesterId: 'user-3',
    requesterName: 'Bob Wilson',
    approverIds: ['approver-1'],
    type: 'single',
    priority: 'low',
    riskLevel: 'minimal',
    metadata: {
      amount: 850,
      currency: 'USD',
      workflowId: 'wf-3',
      workflowName: 'Expense Report'
    }
  });

  // Create a sample workflow
  await createApprovalWorkflow(
    'Enterprise License Renewal',
    'Multi-step approval for enterprise software license renewal',
    [
      {
        name: 'Department Manager Review',
        description: 'Initial review by department manager',
        approverIds: ['approver-1'],
        type: 'single',
        requiredApprovals: 1,
        sla: {
          expectedResponseTime: 60,
          warningThreshold: 45,
          escalationThreshold: 120
        }
      },
      {
        name: 'Finance Review',
        description: 'Financial approval and budget verification',
        approverIds: ['approver-4'],
        type: 'single',
        requiredApprovals: 1,
        sla: {
          expectedResponseTime: 120,
          warningThreshold: 90,
          escalationThreshold: 240
        }
      },
      {
        name: 'Executive Approval',
        description: 'Final executive sign-off',
        approverIds: ['approver-3'],
        type: 'single',
        requiredApprovals: 1,
        sla: {
          expectedResponseTime: 240,
          warningThreshold: 180,
          escalationThreshold: 480
        }
      }
    ],
    'request-license-renewal',
    {
      amount: 120000,
      currency: 'USD',
      workflowId: 'wf-license',
      workflowName: 'License Management'
    }
  );
}
