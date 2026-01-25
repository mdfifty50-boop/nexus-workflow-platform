/**
 * Tool Catalog Types for Epic 16: Intelligent Agent Skills
 *
 * These types define the structure for the searchable tool catalog,
 * usage metrics, and knowledge base learning system.
 */

// Authentication methods supported by tools
export type ToolAuthMethod = 'oauth2' | 'api_key' | 'bearer' | 'none' | 'mcp'

// Cost tiers for tool pricing
export type ToolCostTier = 'free' | 'freemium' | 'paid' | 'enterprise'

// Tool categories
export type ToolCategory =
  | 'communication'
  | 'productivity'
  | 'development'
  | 'finance'
  | 'travel'
  | 'crm'
  | 'marketing'
  | 'ai'
  | 'data'
  | 'automation'
  | 'social'
  | 'analytics'
  | 'storage'
  | 'other'

// Data formats supported by a tool
export type DataFormat = 'json' | 'xml' | 'csv' | 'html' | 'text' | 'binary' | 'multipart'

// Cost estimate structure
export interface ToolCostEstimate {
  perCall?: number      // Cost per API call in USD
  perMonth?: number     // Monthly subscription cost in USD
  tier: ToolCostTier
  freeQuota?: number    // Free calls per month (for freemium)
  notes?: string
}

// Tool capabilities/actions
export interface ToolCapability {
  action: string        // e.g., 'send_email', 'create_issue'
  description: string
  inputSchema?: Record<string, unknown>
  outputSchema?: Record<string, unknown>
}

/**
 * Core Tool interface representing a catalog entry
 */
export interface Tool {
  id: string
  createdAt: string
  updatedAt: string

  // Basic info
  name: string
  category: ToolCategory
  description: string | null

  // API details
  apiDocUrl: string | null
  authMethod: ToolAuthMethod
  dataFormats: DataFormat[]

  // Cost and reliability
  costEstimate: ToolCostEstimate | null
  reliabilityRating: number  // 0.00 - 1.00

  // MCP/Integration mapping
  toolkitSlug: string | null  // Rube/Composio toolkit identifier
  provider: 'rube' | 'composio' | 'custom' | 'native'

  // Capabilities
  capabilities?: ToolCapability[]

  // Schema definitions for data flow
  inputSchema?: Record<string, unknown>   // Expected input data schema
  outputSchema?: Record<string, unknown>  // Output data schema

  // Approval status
  isApproved: boolean
  approvedBy: string | null
  approvedAt: string | null

  // Flexible metadata
  metadata: Record<string, unknown>
}

/**
 * Tool usage metric for learning patterns
 */
export interface ToolUsageMetric {
  id: string
  createdAt: string

  toolId: string
  projectId: string
  workflowId: string

  // Execution details
  success: boolean
  executionTimeMs: number | null
  tokensUsed: number | null
  costUsd: number | null

  // Error tracking
  errorType: string | null
  errorMessage: string | null

  // Learning patterns
  learnedPatterns: LearnedPattern
}

/**
 * Patterns learned from tool usage
 */
export interface LearnedPattern {
  // Optimal parameter combinations
  recommendedParams?: Record<string, unknown>

  // Common failure scenarios
  knownFailures?: Array<{
    errorType: string
    resolution: string
  }>

  // Data transformation hints
  transformationHints?: Array<{
    sourceField: string
    targetField: string
    transformFn: string
  }>

  // Performance insights
  avgExecutionTimeMs?: number
  avgCostUsd?: number
  successRate?: number
}

/**
 * Tool search filters
 */
export interface ToolSearchFilters {
  query?: string           // Full-text search
  category?: ToolCategory
  authMethod?: ToolAuthMethod
  costTier?: ToolCostTier
  minReliability?: number
  provider?: string
  hasCapability?: string   // Filter by specific action
  limit?: number
  offset?: number
}

/**
 * Tool search result with relevance scoring
 */
export interface ToolSearchResult {
  tool: Tool
  relevanceScore: number   // 0-100
  matchReason: string      // Why this tool matched
}

/**
 * Tool catalog statistics
 */
export interface ToolCatalogStats {
  totalTools: number
  approvedTools: number
  byCategory: Record<ToolCategory, number>
  byAuthMethod: Record<ToolAuthMethod, number>
  avgReliability: number
}

/**
 * Request to add a new tool to the catalog
 */
export interface AddToolRequest {
  name: string
  category: ToolCategory
  description?: string
  apiDocUrl?: string
  authMethod: ToolAuthMethod
  dataFormats?: DataFormat[]
  costEstimate?: ToolCostEstimate
  toolkitSlug?: string
  provider?: 'rube' | 'composio' | 'custom' | 'native'
  capabilities?: ToolCapability[]
  metadata?: Record<string, unknown>
}

/**
 * Trust Score for dynamic tool discovery (Story 16.2)
 * Used when tools are discovered outside the pre-approved catalog
 */
export interface ToolTrustScore {
  overall: number  // 0-100
  components: {
    security: number     // 0-100: OAuth, HTTPS, rate limiting
    reliability: number  // 0-100: Success rate, uptime
    performance: number  // 0-100: Latency-based
    community: number    // 0-100: Usage count, reviews
  }
  breakdown: {
    hasOAuth: boolean
    httpsOnly: boolean
    rateLimited: boolean
    documentedApi: boolean
    activelyMaintained: boolean
    encryptedTransit?: boolean
    successRate?: number
    avgLatencyMs?: number
    usageCount?: number
  }
  lastEvaluated: string
}

/**
 * Recommendation badge based on trust score
 */
export type RecommendationBadge = 'recommended' | 'caution' | 'not_recommended'

/**
 * Discovery source for tools found outside the catalog
 */
export type DiscoverySource = 'rube' | 'composio' | 'rapidapi' | 'programmableweb' | 'openapi_directory' | 'user_submitted'

/**
 * Extended Tool with trust score for discovered tools
 */
export interface DiscoveredTool extends Tool {
  trustScore: ToolTrustScore
  recommendationBadge: RecommendationBadge
  discoverySource: DiscoverySource
  discoveredAt: string
  userApprovalRequired: boolean
}

/**
 * Tool approval request for discovered tools
 */
export interface ToolApprovalRequest {
  discoveredTool: DiscoveredTool
  projectId: string
  userId: string
  approvalReason?: string
}

/**
 * Tool approval status
 */
export type ToolApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired'

/**
 * Tool approval record
 */
export interface ToolApproval {
  id: string
  toolId: string
  projectId: string
  userId: string
  status: ToolApprovalStatus
  trustScoreAtApproval: number
  approvalReason?: string
  rejectionReason?: string
  expiresAt: string
  createdAt: string
  updatedAt: string
}

/**
 * Discovery search request
 */
export interface DiscoverySearchRequest {
  capability: string           // Natural language capability description
  category?: ToolCategory
  minTrustScore?: number       // Minimum trust score to include
  includeUnapproved?: boolean  // Include tools requiring approval
  limit?: number
}

/**
 * Discovery search result
 */
export interface DiscoverySearchResult {
  tool: Tool | DiscoveredTool
  relevanceScore: number        // 0-100
  matchReason: string
  source: 'catalog' | 'discovered'
  requiresApproval: boolean
}

/**
 * Discovery cache entry for database
 */
export interface ToolDiscoveryCacheRow {
  id: string
  tool_data: DiscoveredTool
  capability_hash: string       // Hash of the search capability
  project_id: string | null
  user_id: string
  approval_status: ToolApprovalStatus
  expires_at: string
  created_at: string
  updated_at: string
}

// Database row types (snake_case for Supabase)
export interface ToolCatalogRow {
  id: string
  created_at: string
  updated_at: string
  name: string
  category: string
  description: string | null
  api_doc_url: string | null
  auth_method: string
  data_formats: string[]
  cost_estimate: ToolCostEstimate | null
  reliability_rating: number
  toolkit_slug: string | null
  provider: string
  capabilities: ToolCapability[] | null
  is_approved: boolean
  approved_by: string | null
  approved_at: string | null
  metadata: Record<string, unknown>
}

export interface ToolUsageMetricRow {
  id: string
  created_at: string
  tool_id: string
  project_id: string
  workflow_id: string
  success: boolean
  execution_time_ms: number | null
  tokens_used: number | null
  cost_usd: number | null
  error_type: string | null
  error_message: string | null
  learned_patterns: LearnedPattern
}

// Utility functions to convert between camelCase and snake_case
export function toolFromRow(row: ToolCatalogRow): Tool {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    name: row.name,
    category: row.category as ToolCategory,
    description: row.description,
    apiDocUrl: row.api_doc_url,
    authMethod: row.auth_method as ToolAuthMethod,
    dataFormats: row.data_formats as DataFormat[],
    costEstimate: row.cost_estimate,
    reliabilityRating: row.reliability_rating,
    toolkitSlug: row.toolkit_slug,
    provider: row.provider as Tool['provider'],
    capabilities: row.capabilities || undefined,
    isApproved: row.is_approved,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    metadata: row.metadata
  }
}

export function toolToRow(tool: Partial<Tool>): Partial<ToolCatalogRow> {
  const row: Partial<ToolCatalogRow> = {}

  if (tool.name !== undefined) row.name = tool.name
  if (tool.category !== undefined) row.category = tool.category
  if (tool.description !== undefined) row.description = tool.description
  if (tool.apiDocUrl !== undefined) row.api_doc_url = tool.apiDocUrl
  if (tool.authMethod !== undefined) row.auth_method = tool.authMethod
  if (tool.dataFormats !== undefined) row.data_formats = tool.dataFormats
  if (tool.costEstimate !== undefined) row.cost_estimate = tool.costEstimate
  if (tool.reliabilityRating !== undefined) row.reliability_rating = tool.reliabilityRating
  if (tool.toolkitSlug !== undefined) row.toolkit_slug = tool.toolkitSlug
  if (tool.provider !== undefined) row.provider = tool.provider
  if (tool.capabilities !== undefined) row.capabilities = tool.capabilities
  if (tool.isApproved !== undefined) row.is_approved = tool.isApproved
  if (tool.metadata !== undefined) row.metadata = tool.metadata

  return row
}

// =============================================================================
// Tool Chain Types (Story 16.3: Tool Chain Optimizer Agent)
// =============================================================================

/**
 * A single step in a tool chain
 */
export interface ChainStep {
  order: number                    // Position in chain (1-based)
  tool: Tool | DiscoveredTool      // The tool for this step
  capability: string               // The capability being fulfilled
  capabilityDescription?: string   // Human-readable description
  inputSchema?: Record<string, unknown>   // Expected input from previous step
  outputSchema?: Record<string, unknown>  // Output to next step
  estimatedTimeMs: number          // Estimated execution time
  estimatedCostUsd: number         // Estimated cost for this step
  requiresTransformation: boolean  // Needs data transformation from previous step
  transformationNotes?: string     // Notes about required transformation
}

/**
 * A complete tool chain representing a workflow solution
 */
export interface ToolChain {
  id: string
  name: string                     // Human-readable chain name
  description: string              // What this chain accomplishes
  steps: ChainStep[]               // Ordered list of steps
  totalEstimatedTimeMs: number     // Sum of step times + parallelization
  totalEstimatedCostUsd: number    // Sum of step costs + buffer
  reliabilityScore: number         // 0-100 based on tool trust scores
  optimizationScore: number        // 0-100 overall optimization score
  canParallelize: boolean          // Whether steps can run in parallel
  parallelGroups?: number[][]      // Groups of step indices that can run together
  metadata: ChainMetadata
}

/**
 * Metadata about chain generation and characteristics
 */
export interface ChainMetadata {
  generatedAt: string
  optimizationType: ChainOptimizationType
  complexityLevel: 'simple' | 'moderate' | 'complex'
  capabilitiesCovered: string[]
  toolCount: number
  hasExternalTools: boolean        // Contains tools outside catalog
  requiresApproval: boolean        // Any step requires user approval
}

/**
 * Type of optimization applied to chain
 */
export type ChainOptimizationType = 'balanced' | 'cost_optimized' | 'speed_optimized' | 'reliability_optimized'

/**
 * Cost and time estimates for a chain
 */
export interface ChainEstimate {
  costUsd: number
  costBreakdown: Array<{
    stepIndex: number
    toolName: string
    cost: number
  }>
  timeMs: number
  timeBreakdown: Array<{
    stepIndex: number
    toolName: string
    timeMs: number
  }>
  confidenceLevel: 'high' | 'medium' | 'low'
  assumptions: string[]            // What assumptions were made
}

/**
 * Optimization criteria weights (should sum to 1.0)
 */
export interface ChainOptimizationCriteria {
  costWeight: number       // Default: 0.35
  speedWeight: number      // Default: 0.30
  reliabilityWeight: number // Default: 0.25
  simplicityWeight: number  // Default: 0.10
}

/**
 * Default optimization criteria
 */
export const DEFAULT_OPTIMIZATION_CRITERIA: ChainOptimizationCriteria = {
  costWeight: 0.35,
  speedWeight: 0.30,
  reliabilityWeight: 0.25,
  simplicityWeight: 0.10
}

/**
 * Comparison between two or more chains
 */
export interface ChainComparison {
  chains: ToolChain[]
  recommendedIndex: number         // Index of recommended chain
  comparisonMatrix: ChainComparisonRow[]
  tradeOffExplanations: string[]   // Plain-English trade-off explanations
}

/**
 * A row in the chain comparison matrix
 */
export interface ChainComparisonRow {
  metric: string                   // 'Cost', 'Speed', 'Reliability', etc.
  values: Array<{
    chainIndex: number
    value: string | number
    isWinner: boolean
  }>
}

/**
 * Result from the chain optimizer
 */
export interface ChainOptimizationResult {
  // Primary recommendation
  recommendedChain: ToolChain

  // Alternative chains (minimum 2 for complex workflows)
  alternatives: ToolChain[]

  // Comparison data for UI
  comparison: ChainComparison

  // Workflow analysis
  workflowAnalysis: WorkflowAnalysis

  // Generation metadata
  generatedAt: string
  generationTimeMs: number
  criteria: ChainOptimizationCriteria
}

/**
 * Analysis of the user's workflow goal
 */
export interface WorkflowAnalysis {
  originalGoal: string             // User's original description
  extractedCapabilities: ExtractedCapability[]
  workflowType: string             // e.g., 'data-pipeline', 'notification', 'automation'
  complexityScore: number          // 1-10
  estimatedSteps: number
  warnings: string[]               // Potential issues or limitations
}

/**
 * A capability extracted from workflow goal
 */
export interface ExtractedCapability {
  name: string                     // e.g., 'data_fetch', 'transform', 'notify'
  description: string              // What this capability does
  category: ToolCategory           // Best matching category
  priority: 'required' | 'optional'
  suggestedTools: string[]         // Tool IDs that could fulfill this
}

/**
 * Chain pattern stored for learning (from successful executions)
 */
export interface ChainPattern {
  id: string
  createdAt: string
  updatedAt: string

  // Pattern identification
  capabilitySignature: string      // Hash of sorted capabilities
  workflowType: string

  // Chain structure
  chainSteps: Array<{
    toolId: string
    toolName: string
    capability: string
    order: number
  }>

  // Success metrics
  successCount: number
  failureCount: number
  avgExecutionTimeMs: number | null
  avgCostUsd: number | null

  // User preference tracking
  userId: string | null
  projectId: string | null

  // Usage tracking
  lastUsedAt: string | null

  // Flexible metadata
  metadata: Record<string, unknown>
}

/**
 * Database row for chain patterns
 */
export interface ChainPatternRow {
  id: string
  created_at: string
  updated_at: string
  capability_signature: string
  workflow_type: string | null
  chain_steps: ChainPattern['chainSteps']
  success_count: number
  failure_count: number
  avg_execution_time_ms: number | null
  avg_cost_usd: number | null
  user_id: string | null
  project_id: string | null
  last_used_at: string | null
  metadata: Record<string, unknown>
}

/**
 * Convert chain pattern from database row
 */
export function chainPatternFromRow(row: ChainPatternRow): ChainPattern {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    capabilitySignature: row.capability_signature,
    workflowType: row.workflow_type || 'unknown',
    chainSteps: row.chain_steps,
    successCount: row.success_count,
    failureCount: row.failure_count,
    avgExecutionTimeMs: row.avg_execution_time_ms,
    avgCostUsd: row.avg_cost_usd,
    userId: row.user_id,
    projectId: row.project_id,
    lastUsedAt: row.last_used_at,
    metadata: row.metadata
  }
}

/**
 * Data flow compatibility check result
 */
export interface DataFlowCompatibility {
  isCompatible: boolean
  sourceSchema: Record<string, unknown>
  targetSchema: Record<string, unknown>
  missingFields: string[]
  typeConflicts: Array<{
    field: string
    sourceType: string
    targetType: string
  }>
  transformationRequired: boolean
  suggestedTransformations: Array<{
    sourceField: string
    targetField: string
    transformType: 'direct' | 'type_cast' | 'format' | 'compute'
    notes?: string
  }>
}

/**
 * Request to optimize a tool chain
 */
export interface ChainOptimizationRequest {
  workflowGoal: string             // Natural language description
  userId: string
  projectId?: string
  criteria?: Partial<ChainOptimizationCriteria>
  maxSteps?: number                // Maximum chain length
  preferredTools?: string[]        // Tool IDs to prioritize
  excludedTools?: string[]         // Tool IDs to exclude
  budgetLimitUsd?: number          // Maximum acceptable cost
  timeLimitMs?: number             // Maximum acceptable time
}

// ============================================================================
// Story 16.4: Integration Schema Analyzer Types
// ============================================================================

/**
 * Field type in a schema
 */
export type SchemaFieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'date'
  | 'null'
  | 'unknown'

/**
 * A field definition in a schema
 */
export interface SchemaField {
  name: string
  type: SchemaFieldType
  required: boolean
  description?: string
  format?: string                    // e.g., 'email', 'date-time', 'uri'
  default?: unknown
  nested?: SchemaField[]             // For object types
  items?: SchemaField                // For array types
  enum?: unknown[]                   // Possible values
}

/**
 * A complete schema definition for a tool input/output
 */
export interface ToolSchema {
  toolId: string
  direction: 'input' | 'output'
  fields: SchemaField[]
  version?: string                   // Schema version if available
  examples?: Record<string, unknown>[] // Example data matching schema
}

/**
 * Type of transformation between fields
 */
export type TransformationType =
  | 'direct'           // No conversion needed
  | 'type_cast'        // Type conversion (string -> number)
  | 'format'           // Format conversion (date -> timestamp)
  | 'compute'          // Computed from multiple fields
  | 'extract'          // Extract from nested object
  | 'template'         // String template with variables
  | 'lookup'           // Value lookup/mapping
  | 'default'          // Default value assignment
  | 'flatten'          // Flatten nested structure
  | 'nest'             // Create nested structure

/**
 * A single field mapping between source and target
 */
export interface FieldMapping {
  sourceField: string              // Path to source field (e.g., 'customer.email')
  targetField: string              // Path to target field
  transformationType: TransformationType
  confidence: number               // 0-1 confidence score
  matchType: 'exact' | 'fuzzy' | 'semantic' | 'manual'
  conversionRule?: string          // Description of conversion
  defaultValue?: unknown           // Default if source is missing
  template?: string                // For template transformations
  notes?: string
}

/**
 * Type conversion rule
 */
export interface TypeConversionRule {
  sourceType: SchemaFieldType
  targetType: SchemaFieldType
  conversionFunction: string       // TypeScript code for conversion
  validationFunction?: string      // Code to validate before conversion
  fallbackValue?: unknown          // Value if conversion fails
}

/**
 * A complete transformation map between two tools
 */
export interface TransformationMap {
  id: string
  createdAt: string
  updatedAt: string

  // Tool pair
  sourceToolId: string
  sourceToolName: string
  targetToolId: string
  targetToolName: string

  // Mappings
  fieldMappings: FieldMapping[]
  typeConversions: TypeConversionRule[]
  defaultValues: Record<string, unknown>

  // Generated code
  transformFunction: string        // TypeScript transformation function
  reverseFunction?: string         // Reverse transformation if bidirectional

  // Analysis metrics
  confidenceScore: number          // Overall confidence 0-1
  coverageScore: number            // % of target fields mapped
  complexityScore: number          // Transformation complexity 0-1

  // Metadata
  usageCount: number
  successRate: number
  lastUsedAt?: string
}

/**
 * Result of analyzing a single tool pair
 */
export interface ToolPairAnalysis {
  sourceToolId: string
  targetToolId: string
  sourceSchema: ToolSchema
  targetSchema: ToolSchema

  // Compatibility assessment
  isCompatible: boolean
  requiresTransformation: boolean

  // Mapping details
  fieldMappings: FieldMapping[]
  unmappedSourceFields: string[]
  unmappedTargetFields: string[]
  requiredButMissing: string[]     // Required target fields without mapping

  // Transformation details
  transformationMap?: TransformationMap

  // Scores
  compatibilityScore: number       // 0-1
  dataIntegrityRisk: 'none' | 'low' | 'medium' | 'high'

  // Warnings and notes
  warnings: string[]
  suggestions: string[]
}

/**
 * Complete schema analysis result for a tool chain
 */
export interface SchemaAnalysisResult {
  chainId: string
  analyzedAt: string

  // Chain-level assessment
  isChainCompatible: boolean
  requiresTransformations: boolean
  totalTransformations: number

  // Per-step analysis
  pairAnalyses: ToolPairAnalysis[]

  // Aggregated scores
  overallCompatibilityScore: number
  overallComplexityScore: number
  overallDataIntegrityRisk: 'none' | 'low' | 'medium' | 'high'

  // Generated transformations
  transformationMaps: TransformationMap[]

  // Summary
  warnings: string[]
  recommendations: string[]
  estimatedTransformationTimeMs: number
}

/**
 * Request to analyze a tool chain's schemas
 */
export interface SchemaAnalysisRequest {
  chain: ToolChain
  generateCode?: boolean           // Generate transformation code (default: true)
  strictMode?: boolean             // Fail on any unmapped required field (default: false)
  includeExamples?: boolean        // Include example transformations
}

/**
 * Database row for transformation_maps table
 */
export interface TransformationMapRow {
  id: string
  created_at: string
  updated_at: string
  source_tool_id: string
  target_tool_id: string
  field_mappings: FieldMapping[]
  type_conversions: TypeConversionRule[]
  default_values: Record<string, unknown>
  transform_function: string | null
  reverse_function: string | null
  confidence_score: number | null
  usage_count: number
  success_rate: number
  metadata: Record<string, unknown>
}

/**
 * Convert database row to TransformationMap
 */
export function transformationMapFromRow(row: TransformationMapRow): TransformationMap {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sourceToolId: row.source_tool_id,
    sourceToolName: '', // Will be populated from tool lookup
    targetToolId: row.target_tool_id,
    targetToolName: '', // Will be populated from tool lookup
    fieldMappings: row.field_mappings,
    typeConversions: row.type_conversions,
    defaultValues: row.default_values,
    transformFunction: row.transform_function || '',
    reverseFunction: row.reverse_function || undefined,
    confidenceScore: row.confidence_score || 0,
    coverageScore: 0, // Calculated from field mappings
    complexityScore: 0, // Calculated from transformations
    usageCount: row.usage_count,
    successRate: row.success_rate,
    lastUsedAt: row.updated_at
  }
}

/**
 * Fuzzy field name variations for matching
 */
export const FIELD_NAME_VARIATIONS: Record<string, string[]> = {
  email: ['email', 'emailAddress', 'email_address', 'e_mail', 'userEmail', 'mail'],
  firstName: ['firstName', 'first_name', 'firstname', 'fname', 'givenName', 'given_name'],
  lastName: ['lastName', 'last_name', 'lastname', 'lname', 'familyName', 'family_name', 'surname'],
  fullName: ['fullName', 'full_name', 'name', 'displayName', 'display_name'],
  phone: ['phone', 'phoneNumber', 'phone_number', 'tel', 'telephone', 'mobile', 'cell'],
  address: ['address', 'streetAddress', 'street_address', 'street', 'location'],
  city: ['city', 'town', 'locality'],
  state: ['state', 'province', 'region'],
  country: ['country', 'countryCode', 'country_code'],
  zip: ['zip', 'zipCode', 'zip_code', 'postalCode', 'postal_code', 'postcode'],
  createdAt: ['createdAt', 'created_at', 'createDate', 'dateCreated', 'timestamp', 'created'],
  updatedAt: ['updatedAt', 'updated_at', 'updateDate', 'dateUpdated', 'modified', 'modifiedAt'],
  id: ['id', 'identifier', 'uid', 'uuid', 'key', 'primaryKey'],
  amount: ['amount', 'total', 'sum', 'value', 'price', 'cost'],
  currency: ['currency', 'currencyCode', 'currency_code'],
  status: ['status', 'state', 'condition'],
  description: ['description', 'desc', 'details', 'summary', 'text', 'body', 'content'],
  title: ['title', 'name', 'subject', 'heading', 'label'],
  url: ['url', 'link', 'href', 'uri', 'website'],
  image: ['image', 'imageUrl', 'image_url', 'photo', 'picture', 'avatar', 'thumbnail']
}

/**
 * Default type conversion functions
 */
export const DEFAULT_TYPE_CONVERSIONS: Record<string, TypeConversionRule> = {
  'string_to_number': {
    sourceType: 'string',
    targetType: 'number',
    conversionFunction: 'const result = parseFloat(value); return isNaN(result) ? fallback : result;',
    validationFunction: 'return !isNaN(parseFloat(value));',
    fallbackValue: 0
  },
  'number_to_string': {
    sourceType: 'number',
    targetType: 'string',
    conversionFunction: 'return String(value);'
  },
  'string_to_boolean': {
    sourceType: 'string',
    targetType: 'boolean',
    conversionFunction: 'return value === "true" || value === "1" || value === "yes";',
    validationFunction: 'return ["true", "false", "1", "0", "yes", "no"].includes(value.toLowerCase());'
  },
  'boolean_to_string': {
    sourceType: 'boolean',
    targetType: 'string',
    conversionFunction: 'return String(value);'
  },
  'string_to_date': {
    sourceType: 'string',
    targetType: 'date',
    conversionFunction: 'const date = new Date(value); return isNaN(date.getTime()) ? fallback : date;',
    validationFunction: 'return !isNaN(new Date(value).getTime());',
    fallbackValue: null
  },
  'date_to_string': {
    sourceType: 'date',
    targetType: 'string',
    conversionFunction: 'return value instanceof Date ? value.toISOString() : String(value);'
  },
  'object_to_string': {
    sourceType: 'object',
    targetType: 'string',
    conversionFunction: 'return JSON.stringify(value);'
  },
  'string_to_object': {
    sourceType: 'string',
    targetType: 'object',
    conversionFunction: 'try { return JSON.parse(value); } catch { return fallback; }',
    validationFunction: 'try { JSON.parse(value); return true; } catch { return false; }',
    fallbackValue: {}
  }
}

// ============================================================================
// Story 16.5: Dynamic Integration Connector Types
// ============================================================================

/**
 * State of an integration connection
 */
export type ConnectionState =
  | 'disconnected'    // No connection
  | 'connecting'      // Establishing connection
  | 'authenticating'  // Validating credentials
  | 'testing'         // Running health check
  | 'connected'       // Ready for data flow
  | 'active'          // Currently executing
  | 'error'           // Connection failed
  | 'stale'           // Needs reconnection

/**
 * Authentication type for connections
 */
export type ConnectionAuthType = 'oauth2' | 'api_key' | 'bearer' | 'basic' | 'mcp' | 'none'

/**
 * Error type classification for connection errors
 */
export type ConnectionErrorType =
  | 'AUTH_EXPIRED'      // 401 - Token/key expired
  | 'AUTH_INVALID'      // 401 - Invalid credentials
  | 'RATE_LIMITED'      // 429 - Too many requests
  | 'SERVICE_DOWN'      // 503 - Service unavailable
  | 'INVALID_CONFIG'    // 400 - Configuration error
  | 'SCHEMA_MISMATCH'   // 422 - Data format error
  | 'NETWORK_ERROR'     // 0 - Network connectivity
  | 'TIMEOUT'           // Request timeout
  | 'PERMISSION_DENIED' // 403 - Insufficient permissions
  | 'NOT_FOUND'         // 404 - Resource not found
  | 'INTERNAL_ERROR'    // 500 - Internal server error
  | 'UNKNOWN'           // Unknown error

/**
 * Classification of whether an error is transient (retryable) or permanent
 */
export interface ErrorClassification {
  errorType: ConnectionErrorType
  isTransient: boolean
  isRetryable: boolean
  suggestedAction: 'retry' | 'refresh_auth' | 'user_intervention' | 'abort'
  userMessage: string
  technicalMessage: string
  httpStatus?: number
}

/**
 * OAuth2 configuration for connections
 */
export interface OAuth2Config {
  clientId?: string
  clientSecret?: string
  accessToken: string
  refreshToken?: string
  tokenType: string
  expiresAt?: string
  scope?: string[]
  authorizationUrl?: string
  tokenUrl?: string
}

/**
 * API Key configuration for connections
 */
export interface ApiKeyConfig {
  apiKey: string
  keyLocation: 'header' | 'query' | 'body'
  keyName: string    // e.g., 'X-API-Key', 'api_key', 'Authorization'
}

/**
 * Bearer token configuration
 */
export interface BearerConfig {
  token: string
  prefix?: string    // Default 'Bearer'
}

/**
 * Basic auth configuration
 */
export interface BasicAuthConfig {
  username: string
  password: string
}

/**
 * MCP configuration for connections
 */
export interface MCPConfig {
  server: 'rube' | 'composio'
  toolkitSlug: string
  connectionId?: string
}

/**
 * Connection configuration (union of auth types)
 */
export interface ConnectionConfig {
  authType: ConnectionAuthType
  oauth2?: OAuth2Config
  apiKey?: ApiKeyConfig
  bearer?: BearerConfig
  basic?: BasicAuthConfig
  mcp?: MCPConfig
  baseUrl?: string
  timeout?: number           // Request timeout in ms
  retryConfig?: {
    maxRetries: number
    initialDelayMs: number
    maxDelayMs: number
    backoffMultiplier: number
  }
  headers?: Record<string, string>
}

/**
 * Endpoint configuration for a connection
 */
export interface ConnectionEndpoint {
  name: string               // e.g., 'getData', 'sendData', 'healthCheck'
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string               // Relative path from baseUrl
  headers?: Record<string, string>
  queryParams?: Record<string, string>
  bodyTemplate?: string      // JSON template with placeholders
}

/**
 * An established integration connection
 */
export interface IntegrationConnection {
  id: string
  createdAt: string
  updatedAt: string

  // Tool identification
  toolId: string
  toolName: string

  // Auth type (convenience accessor for config.authType)
  authType?: ConnectionAuthType

  // Connection configuration
  config: ConnectionConfig
  endpoints: Record<string, ConnectionEndpoint>

  // Connection state
  status: ConnectionState
  lastConnectedAt: string | null
  lastTestedAt: string | null
  lastError?: ErrorClassification

  // Health metrics
  metrics: ConnectionMetrics

  // Ownership
  projectId: string | null
  userId: string

  // Metadata
  metadata: Record<string, unknown>
}

/**
 * Metrics for a connection
 */
export interface ConnectionMetrics {
  successCount: number
  failureCount: number
  totalRequests: number
  avgLatencyMs: number | null
  lastLatencyMs: number | null
  successRate: number        // 0-1
  uptime: number            // Percentage 0-100
  lastSuccessAt: string | null
  lastFailureAt: string | null
}

/**
 * Result of attempting to establish a connection
 */
export interface ConnectionResult {
  success: boolean
  connection?: IntegrationConnection
  error?: ErrorClassification
  establishTimeMs: number
  requiresUserAuth?: boolean   // Need user to authorize
  authUrl?: string             // URL for user authorization
}

/**
 * Result of testing a connection
 */
export interface ConnectionTestResult {
  success: boolean
  connectionId: string
  toolId: string
  toolName: string

  // Test details
  testsRun: ConnectionTestCase[]
  passedCount: number
  failedCount: number

  // Timing
  totalTimeMs: number

  // If failed
  error?: ErrorClassification
  recommendations?: string[]
}

/**
 * A single test case for connection testing
 */
export interface ConnectionTestCase {
  name: string                 // e.g., 'authentication', 'schema_validation', 'endpoint_health'
  passed: boolean
  timeMs: number
  message?: string             // Human-readable result
  details?: Record<string, unknown>
}

/**
 * Result of executing data flow between two tools
 */
export interface DataFlowExecution {
  id: string
  startedAt: string
  completedAt: string | null

  // Source and target
  sourceToolId: string
  sourceToolName: string
  targetToolId: string
  targetToolName: string

  // Execution status
  status: 'pending' | 'extracting' | 'transforming' | 'injecting' | 'completed' | 'failed'

  // Metrics
  recordsExtracted: number
  recordsTransformed: number
  recordsInjected: number
  recordsFailed: number

  // Timing
  extractTimeMs: number | null
  transformTimeMs: number | null
  injectTimeMs: number | null
  totalTimeMs: number | null

  // Data integrity
  dataIntegrityValid: boolean
  integrityErrors: string[]

  // Error handling
  error?: ErrorClassification
  retryCount: number

  // Results
  sourceData?: Record<string, unknown>[]
  transformedData?: Record<string, unknown>[]
  result?: Record<string, unknown>
}

/**
 * Request to establish a connection to a tool
 */
export interface EstablishConnectionRequest {
  toolId: string
  config?: Partial<ConnectionConfig>
  projectId?: string
  userId: string
  testAfterConnect?: boolean   // Default: true
}

/**
 * Request to execute data flow between tools
 */
export interface DataFlowRequest {
  sourceConnection: IntegrationConnection
  targetConnection: IntegrationConnection
  transformationMap?: TransformationMap
  sourceData?: Record<string, unknown>[]   // Explicit source data (optional)
  extractionQuery?: Record<string, unknown>  // Query to extract from source
  options?: {
    validateIntegrity?: boolean    // Default: true
    batchSize?: number             // Default: 100
    retryOnFailure?: boolean       // Default: true
    timeout?: number               // Default: 30000
  }
}

/**
 * Result of chain execution pipeline
 */
export interface ChainExecutionResult {
  id: string
  chainId: string
  startedAt: string
  completedAt: string | null

  // Status
  status: 'pending' | 'testing' | 'executing' | 'completed' | 'partial' | 'failed'

  // Step execution
  stepResults: ChainStepExecutionResult[]
  completedSteps: number
  totalSteps: number

  // Overall metrics
  totalTimeMs: number | null
  totalCostUsd: number
  totalRecordsProcessed: number

  // Errors
  errors: ChainExecutionError[]
  hasRecoverableError: boolean

  // Final output
  finalOutput?: Record<string, unknown>
}

/**
 * Result of executing a single step in a chain
 */
export interface ChainStepExecutionResult {
  stepIndex: number
  toolId: string
  toolName: string

  // Status
  status: 'pending' | 'connecting' | 'executing' | 'completed' | 'failed' | 'skipped'

  // Data flow (if applicable)
  dataFlowExecution?: DataFlowExecution

  // Timing
  startedAt: string | null
  completedAt: string | null
  executionTimeMs: number | null

  // Cost
  estimatedCostUsd: number
  actualCostUsd: number | null

  // Error handling
  error?: ErrorClassification
  retryCount: number

  // Output
  output?: Record<string, unknown>
}

/**
 * Error during chain execution
 */
export interface ChainExecutionError {
  stepIndex: number
  toolId: string
  errorClassification: ErrorClassification
  timestamp: string
  resolved: boolean
  resolution?: string
}

/**
 * Pre-flight check result before chain execution
 */
export interface ChainPreflightResult {
  chainId: string
  success: boolean

  // Connection tests
  connectionTests: ConnectionTestResult[]
  allConnectionsValid: boolean

  // Schema validations
  schemaValidations: SchemaValidationResult[]
  allSchemasCompatible: boolean

  // Estimates
  estimatedTimeMs: number
  estimatedCostUsd: number

  // Warnings
  warnings: string[]
  recommendations: string[]

  // Ready to execute?
  readyForExecution: boolean
  blockers: string[]
}

/**
 * Schema validation result between two tools
 */
export interface SchemaValidationResult {
  sourceToolId: string
  targetToolId: string
  isValid: boolean
  hasTransformationMap: boolean
  coveragePercentage: number
  missingMappings: string[]
  warnings: string[]
}

/**
 * Database row for integration_connections table
 */
export interface IntegrationConnectionRow {
  id: string
  created_at: string
  updated_at: string
  tool_id: string
  tool_name: string
  auth_type: string
  config: ConnectionConfig
  endpoints: Record<string, ConnectionEndpoint>
  status: string
  last_connected_at: string | null
  last_tested_at: string | null
  last_error: ErrorClassification | null
  success_count: number
  failure_count: number
  total_requests: number
  avg_latency_ms: number | null
  success_rate: number
  project_id: string | null
  user_id: string
  metadata: Record<string, unknown>
}

/**
 * Convert database row to IntegrationConnection
 */
export function integrationConnectionFromRow(row: IntegrationConnectionRow): IntegrationConnection {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    toolId: row.tool_id,
    toolName: row.tool_name,
    authType: row.auth_type as ConnectionAuthType,
    config: row.config,
    endpoints: row.endpoints,
    status: row.status as ConnectionState,
    lastConnectedAt: row.last_connected_at,
    lastTestedAt: row.last_tested_at,
    lastError: row.last_error || undefined,
    metrics: {
      successCount: row.success_count,
      failureCount: row.failure_count,
      totalRequests: row.total_requests,
      avgLatencyMs: row.avg_latency_ms,
      lastLatencyMs: null,
      successRate: row.success_rate,
      uptime: row.success_rate * 100,
      lastSuccessAt: null,
      lastFailureAt: null
    },
    projectId: row.project_id,
    userId: row.user_id,
    metadata: row.metadata
  }
}

/**
 * Convert IntegrationConnection to database row
 */
export function integrationConnectionToRow(connection: Partial<IntegrationConnection>): Partial<IntegrationConnectionRow> {
  const row: Partial<IntegrationConnectionRow> = {}

  if (connection.toolId !== undefined) row.tool_id = connection.toolId
  if (connection.toolName !== undefined) row.tool_name = connection.toolName
  if (connection.authType !== undefined) row.auth_type = connection.authType
  if (connection.config !== undefined) {
    row.auth_type = connection.config.authType
    row.config = connection.config
  }
  if (connection.endpoints !== undefined) row.endpoints = connection.endpoints
  if (connection.status !== undefined) row.status = connection.status
  if (connection.lastConnectedAt !== undefined) row.last_connected_at = connection.lastConnectedAt
  if (connection.lastTestedAt !== undefined) row.last_tested_at = connection.lastTestedAt
  if (connection.lastError !== undefined) row.last_error = connection.lastError || null
  if (connection.metrics !== undefined) {
    row.success_count = connection.metrics.successCount
    row.failure_count = connection.metrics.failureCount
    row.total_requests = connection.metrics.totalRequests
    row.avg_latency_ms = connection.metrics.avgLatencyMs
    row.success_rate = connection.metrics.successRate
  }
  if (connection.projectId !== undefined) row.project_id = connection.projectId
  if (connection.userId !== undefined) row.user_id = connection.userId
  if (connection.metadata !== undefined) row.metadata = connection.metadata

  return row
}

/**
 * Default retry configuration for connections
 */
export const DEFAULT_CONNECTION_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2
}

/**
 * Map of HTTP status codes to error types
 */
export const HTTP_STATUS_TO_ERROR_TYPE: Record<number, ConnectionErrorType> = {
  400: 'INVALID_CONFIG',
  401: 'AUTH_EXPIRED',
  403: 'PERMISSION_DENIED',
  404: 'NOT_FOUND',
  422: 'SCHEMA_MISMATCH',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_ERROR',
  502: 'SERVICE_DOWN',
  503: 'SERVICE_DOWN',
  504: 'TIMEOUT'
}

/**
 * Error messages for user display
 */
export const CONNECTION_ERROR_MESSAGES: Record<ConnectionErrorType, string> = {
  'AUTH_EXPIRED': 'Your authorization has expired. Reconnecting...',
  'AUTH_INVALID': 'Invalid credentials. Please check your authentication settings.',
  'RATE_LIMITED': 'Service is busy. Retrying in a moment...',
  'SERVICE_DOWN': 'Service temporarily unavailable. Retrying...',
  'INVALID_CONFIG': 'Configuration error. Please check your settings.',
  'SCHEMA_MISMATCH': 'Data format mismatch. Unable to process the response.',
  'NETWORK_ERROR': 'Network issue. Checking connection...',
  'TIMEOUT': 'Request timed out. Retrying...',
  'PERMISSION_DENIED': 'Permission denied. Please check your access rights.',
  'NOT_FOUND': 'Resource not found. Please verify the endpoint.',
  'INTERNAL_ERROR': 'Internal server error. Please try again later.',
  'UNKNOWN': 'An unexpected error occurred. Please try again.'
}

/**
 * Classify an error based on HTTP status or error type
 */
export function classifyConnectionError(
  error: Error | unknown,
  httpStatus?: number
): ErrorClassification {
  const errorType = httpStatus
    ? HTTP_STATUS_TO_ERROR_TYPE[httpStatus] || 'UNKNOWN'
    : 'UNKNOWN'

  const isTransient = [
    'RATE_LIMITED',
    'SERVICE_DOWN',
    'NETWORK_ERROR',
    'TIMEOUT'
  ].includes(errorType)

  const isRetryable = isTransient || errorType === 'AUTH_EXPIRED'

  let suggestedAction: ErrorClassification['suggestedAction'] = 'abort'
  if (isTransient) suggestedAction = 'retry'
  else if (errorType === 'AUTH_EXPIRED') suggestedAction = 'refresh_auth'
  else if (['INVALID_CONFIG', 'SCHEMA_MISMATCH', 'PERMISSION_DENIED'].includes(errorType)) {
    suggestedAction = 'user_intervention'
  }

  return {
    errorType,
    isTransient,
    isRetryable,
    suggestedAction,
    userMessage: CONNECTION_ERROR_MESSAGES[errorType],
    technicalMessage: error instanceof Error ? error.message : String(error),
    httpStatus
  }
}

// ============================================================================
// Story 16.6: Integration Self-Healing System Types
// ============================================================================

/**
 * Healing strategy types for different error scenarios
 */
export type HealingStrategy =
  | 'retry'           // Exponential backoff retry
  | 'refresh_auth'    // OAuth token refresh
  | 'rate_limit_wait' // Wait for rate limit window
  | 'schema_adapt'    // Adapt to schema changes
  | 'circuit_break'   // Circuit breaker pattern
  | 'reroute'         // Try alternative tool/endpoint
  | 'escalate'        // Request human decision

/**
 * Circuit breaker states
 */
export type CircuitBreakerState =
  | 'closed'     // Normal operation, allow requests
  | 'open'       // Too many failures, block requests (fail fast)
  | 'half_open'  // Testing recovery, allow limited requests

/**
 * Healing attempt status
 */
export type HealingAttemptStatus =
  | 'pending'
  | 'in_progress'
  | 'succeeded'
  | 'failed'
  | 'escalated'

/**
 * Represents a single healing attempt
 */
export interface HealingAttempt {
  id: string
  createdAt: string
  completedAt: string | null

  // Error context
  originalError: ErrorClassification
  toolId: string
  toolName: string
  operationId: string

  // Healing details
  strategy: HealingStrategy
  attemptNumber: number
  maxAttempts: number

  // Timing
  delayMs: number
  timeoutMs: number
  durationMs: number | null

  // Result
  status: HealingAttemptStatus
  resolution: string | null
  newError: ErrorClassification | null
}

/**
 * Result of a healing operation
 */
export interface HealingResult {
  success: boolean
  totalAttempts: number
  totalDurationMs: number

  // Original and final state
  originalError: ErrorClassification
  finalError: ErrorClassification | null

  // All attempts made
  attempts: HealingAttempt[]

  // Resolution details
  resolvedBy: HealingStrategy | null
  resolution: string | null

  // Escalation (if needed)
  escalated: boolean
  escalationReason: string | null
  userOptions: HealingUserOption[] | null

  // Learning
  patternId: string | null
  confidenceScore: number | null
}

/**
 * User option when escalation is needed
 */
export interface HealingUserOption {
  id: string
  label: string
  description: string
  action: 'retry' | 'skip' | 'cancel' | 'reconfigure' | 'alternative'
  isRecommended: boolean
  metadata?: Record<string, unknown>
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  // Thresholds
  failureThreshold: number      // Failures before opening (default: 5)
  successThreshold: number      // Successes to close from half-open (default: 2)

  // Timing
  openDurationMs: number        // Time circuit stays open (default: 30000)
  halfOpenRequestLimit: number  // Requests allowed in half-open (default: 3)

  // Scope
  toolId: string
  operationType?: string
}

/**
 * Circuit breaker instance state
 */
export interface CircuitBreaker {
  config: CircuitBreakerConfig
  state: CircuitBreakerState

  // Counters
  failureCount: number
  successCount: number
  halfOpenRequestCount: number

  // Timing
  lastFailureAt: string | null
  lastSuccessAt: string | null
  openedAt: string | null
  nextHalfOpenAt: string | null

  // Statistics
  totalRequests: number
  totalFailures: number
  avgRecoveryTimeMs: number | null
}

/**
 * Learned error pattern for future healing
 */
export interface ErrorPattern {
  id: string
  createdAt: string
  updatedAt: string

  // Pattern identification
  errorType: ConnectionErrorType
  toolId: string | null          // null = applies to all tools
  operationType: string | null   // null = applies to all operations

  // Pattern signature (what to match)
  errorMessagePattern: string | null  // Regex pattern
  httpStatusPattern: number[] | null  // Status codes that match
  contextPattern: Record<string, unknown> | null

  // Resolution learned
  bestStrategy: HealingStrategy
  strategyConfig: Record<string, unknown>

  // Effectiveness
  successCount: number
  failureCount: number
  successRate: number
  avgResolutionTimeMs: number

  // Confidence
  confidence: number  // 0-1, increases with successful matches
  lastUsedAt: string | null
}

/**
 * Self-healing operation request
 */
export interface SelfHealingRequest {
  // Error context
  error: ErrorClassification
  toolId: string
  toolName: string
  operationId: string
  operationType: string

  // Connection context
  connection?: IntegrationConnection

  // Execution context
  workflowId?: string
  chainId?: string
  stepIndex?: number

  // Configuration
  maxAttempts?: number
  maxDurationMs?: number
  allowedStrategies?: HealingStrategy[]

  // Callback for operation retry
  retryOperation?: () => Promise<unknown>
}

/**
 * Self-healing session tracking
 */
export interface SelfHealingSession {
  id: string
  startedAt: string
  completedAt: string | null

  // Request
  request: SelfHealingRequest

  // Progress
  currentStrategy: HealingStrategy | null
  currentAttempt: number

  // Result
  result: HealingResult | null

  // State
  isActive: boolean
  isPaused: boolean
}

/**
 * Retry configuration with exponential backoff
 */
export interface RetryConfig {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  jitterPercent: number  // 0-100, adds randomness to prevent thundering herd
}

/**
 * Default retry configuration for self-healing
 */
export const DEFAULT_HEALING_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitterPercent: 20
}

/**
 * Default circuit breaker configuration
 */
export const DEFAULT_CIRCUIT_BREAKER_CONFIG: Omit<CircuitBreakerConfig, 'toolId'> = {
  failureThreshold: 5,
  successThreshold: 2,
  openDurationMs: 30000,
  halfOpenRequestLimit: 3
}

/**
 * Strategy configurations for different error types
 */
export const ERROR_TYPE_HEALING_STRATEGIES: Record<ConnectionErrorType, {
  primaryStrategy: HealingStrategy
  fallbackStrategies: HealingStrategy[]
  maxAttempts: number
  canAutoResolve: boolean
}> = {
  'TIMEOUT': {
    primaryStrategy: 'retry',
    fallbackStrategies: ['circuit_break', 'escalate'],
    maxAttempts: 3,
    canAutoResolve: true
  },
  'RATE_LIMITED': {
    primaryStrategy: 'rate_limit_wait',
    fallbackStrategies: ['circuit_break', 'reroute'],
    maxAttempts: 3,
    canAutoResolve: true
  },
  'SERVICE_DOWN': {
    primaryStrategy: 'retry',
    fallbackStrategies: ['reroute', 'escalate'],
    maxAttempts: 3,
    canAutoResolve: true
  },
  'NETWORK_ERROR': {
    primaryStrategy: 'retry',
    fallbackStrategies: ['circuit_break', 'escalate'],
    maxAttempts: 3,
    canAutoResolve: true
  },
  'AUTH_EXPIRED': {
    primaryStrategy: 'refresh_auth',
    fallbackStrategies: ['escalate'],
    maxAttempts: 2,
    canAutoResolve: true
  },
  'AUTH_INVALID': {
    primaryStrategy: 'escalate',
    fallbackStrategies: [],
    maxAttempts: 0,
    canAutoResolve: false
  },
  'SCHEMA_MISMATCH': {
    primaryStrategy: 'schema_adapt',
    fallbackStrategies: ['escalate'],
    maxAttempts: 2,
    canAutoResolve: true
  },
  'INVALID_CONFIG': {
    primaryStrategy: 'escalate',
    fallbackStrategies: [],
    maxAttempts: 0,
    canAutoResolve: false
  },
  'PERMISSION_DENIED': {
    primaryStrategy: 'escalate',
    fallbackStrategies: [],
    maxAttempts: 0,
    canAutoResolve: false
  },
  'NOT_FOUND': {
    primaryStrategy: 'escalate',
    fallbackStrategies: [],
    maxAttempts: 0,
    canAutoResolve: false
  },
  'INTERNAL_ERROR': {
    primaryStrategy: 'retry',
    fallbackStrategies: ['circuit_break', 'escalate'],
    maxAttempts: 2,
    canAutoResolve: true
  },
  'UNKNOWN': {
    primaryStrategy: 'retry',
    fallbackStrategies: ['escalate'],
    maxAttempts: 1,
    canAutoResolve: false
  }
}

/**
 * User-friendly messages for healing strategies
 */
export const HEALING_STRATEGY_MESSAGES: Record<HealingStrategy, {
  inProgress: string
  succeeded: string
  failed: string
}> = {
  'retry': {
    inProgress: 'Retrying operation...',
    succeeded: 'Operation succeeded on retry',
    failed: 'Retry attempts exhausted'
  },
  'refresh_auth': {
    inProgress: 'Refreshing authentication...',
    succeeded: 'Authentication refreshed successfully',
    failed: 'Unable to refresh authentication'
  },
  'rate_limit_wait': {
    inProgress: 'Waiting for rate limit to reset...',
    succeeded: 'Rate limit cleared, resuming',
    failed: 'Rate limit wait exceeded maximum time'
  },
  'schema_adapt': {
    inProgress: 'Adapting to schema changes...',
    succeeded: 'Successfully adapted to new schema',
    failed: 'Unable to adapt to schema changes'
  },
  'circuit_break': {
    inProgress: 'Circuit breaker engaged, protecting system...',
    succeeded: 'Circuit recovered, resuming operations',
    failed: 'Circuit remains open, service unavailable'
  },
  'reroute': {
    inProgress: 'Finding alternative route...',
    succeeded: 'Using alternative tool/endpoint',
    failed: 'No alternative routes available'
  },
  'escalate': {
    inProgress: 'Preparing for human review...',
    succeeded: 'Human decision received',
    failed: 'Escalation required - awaiting input'
  }
}

/**
 * Calculate delay for exponential backoff with jitter
 */
export function calculateBackoffDelay(
  attemptNumber: number,
  config: RetryConfig = DEFAULT_HEALING_RETRY_CONFIG
): number {
  // Exponential backoff: delay = initialDelay * (multiplier ^ attempt)
  const exponentialDelay = config.initialDelayMs * Math.pow(
    config.backoffMultiplier,
    attemptNumber - 1
  )

  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs)

  // Add jitter to prevent thundering herd
  const jitterRange = cappedDelay * (config.jitterPercent / 100)
  const jitter = (Math.random() * 2 - 1) * jitterRange // ±jitterRange

  return Math.max(0, Math.round(cappedDelay + jitter))
}

/**
 * Determine if an error can potentially be auto-resolved
 */
export function canAutoResolve(error: ErrorClassification): boolean {
  const strategyConfig = ERROR_TYPE_HEALING_STRATEGIES[error.errorType]
  return strategyConfig?.canAutoResolve ?? false
}

/**
 * Get recommended healing strategy for an error
 */
export function getRecommendedStrategy(error: ErrorClassification): HealingStrategy {
  const strategyConfig = ERROR_TYPE_HEALING_STRATEGIES[error.errorType]
  return strategyConfig?.primaryStrategy ?? 'escalate'
}

/**
 * Self-healing metrics for monitoring
 */
export interface SelfHealingMetrics {
  // Overall stats
  totalHealingAttempts: number
  successfulHealings: number
  failedHealings: number
  escalations: number

  // Success rate (NFR-16.2.2 target: 95%)
  transientErrorResolutionRate: number

  // By strategy
  strategyStats: Record<HealingStrategy, {
    attempts: number
    successes: number
    failures: number
    avgDurationMs: number
  }>

  // Circuit breaker stats
  circuitBreakerTrips: number
  avgRecoveryTimeMs: number

  // Pattern learning
  patternsLearned: number
  patternMatchRate: number
}

// ============================================================================
// MCP SERVER INTEGRATION TYPES (Story 16.7)
// ============================================================================

/**
 * MCP Server Provider Types
 */
export type MCPProvider = 'rube' | 'composio' | 'google' | 'zapier' | 'custom'

/**
 * MCP Server Configuration
 */
export interface MCPServerConfig {
  id: string
  provider: MCPProvider
  name: string
  endpoint: string
  description: string
  capabilities: MCPCapability[]
  authMethod: MCPAuthMethod
  isEnabled: boolean
  healthCheckUrl?: string
  rateLimits?: {
    requestsPerMinute: number
    requestsPerHour: number
  }
  timeout?: number // ms, default 30000
  retryConfig?: {
    maxRetries: number
    backoffMultiplier: number
  }
}

/**
 * MCP Authentication Methods
 */
export type MCPAuthMethod = 'oauth' | 'api_key' | 'bearer_token' | 'none'

/**
 * MCP Server Capabilities
 */
export type MCPCapability =
  | 'tool_execution'
  | 'oauth_management'
  | 'token_refresh'
  | 'connection_pooling'
  | 'batch_operations'
  | 'streaming'
  | 'webhooks'

/**
 * MCP Connection State
 */
export type MCPConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'authenticated'
  | 'error'
  | 'rate_limited'

/**
 * Active MCP Connection
 */
export interface MCPConnection {
  id: string
  serverId: string
  provider: MCPProvider
  state: MCPConnectionState
  connectedAt: string
  lastActivityAt: string
  expiresAt?: string

  // Authentication info
  authState: MCPAuthState
  tokenInfo?: MCPTokenInfo

  // Connection metrics
  requestCount: number
  errorCount: number
  avgLatencyMs: number

  // Cost tracking (NFR-16.4.2)
  totalCostUsd: number
  requestCosts: MCPRequestCost[]
}

/**
 * MCP Authentication State
 */
export interface MCPAuthState {
  isAuthenticated: boolean
  method: MCPAuthMethod
  scope?: string[]
  expiresAt?: string
  needsRefresh: boolean
  lastRefreshed?: string
}

/**
 * MCP Token Information
 */
export interface MCPTokenInfo {
  accessToken: string
  refreshToken?: string
  tokenType: string
  expiresIn: number // seconds
  scope?: string
  issuedAt: string
}

/**
 * MCP Request Cost Tracking
 */
export interface MCPRequestCost {
  requestId: string
  toolId: string
  costUsd: number
  timestamp: string
  durationMs: number
}

/**
 * MCP Tool Mapping - Maps catalog tools to MCP tool identifiers
 */
export interface MCPToolMapping {
  catalogToolId: string
  mcpToolSlug: string
  provider: MCPProvider
  serverId: string

  // Mapping metadata
  confidence: number // 0-1, how confident we are in this mapping
  isVerified: boolean
  lastVerified?: string

  // Parameter transformations
  parameterMappings?: MCPParameterMapping[]

  // Response transformations
  responseMapping?: MCPResponseMapping
}

/**
 * Parameter Mapping for MCP tools
 */
export interface MCPParameterMapping {
  catalogParam: string
  mcpParam: string
  transform?: 'none' | 'stringify' | 'parse_json' | 'encode_uri' | 'custom'
  customTransform?: string // Function body for custom transform
  isRequired: boolean
  defaultValue?: unknown
}

/**
 * Response Mapping from MCP tools
 */
export interface MCPResponseMapping {
  // Path to extract data from MCP response
  dataPath?: string
  // Field mappings
  fieldMappings?: Record<string, string>
  // Transform function
  transform?: 'none' | 'flatten' | 'wrap_array' | 'custom'
  customTransform?: string
}

/**
 * MCP Tool Execution Request
 */
export interface MCPExecutionRequest {
  toolMapping: MCPToolMapping
  parameters: Record<string, unknown>
  context: {
    workflowId?: string
    operationId: string
    userId?: string
    priority?: 'low' | 'normal' | 'high'
  }
  options?: {
    timeout?: number
    retryOnFailure?: boolean
    trackCost?: boolean
  }
}

/**
 * MCP Tool Execution Result
 */
export interface MCPExecutionResult {
  success: boolean
  requestId: string
  toolSlug: string
  provider: MCPProvider

  // Result data
  data?: unknown
  error?: MCPExecutionError

  // Execution metrics
  durationMs: number
  costUsd: number
  retryCount: number

  // For chaining
  outputSchema?: Record<string, unknown>

  // Metadata
  timestamp: string
  serverResponseTime?: number
}

/**
 * MCP Execution Error
 */
export interface MCPExecutionError {
  code: MCPErrorCode
  message: string
  details?: unknown
  isRetryable: boolean
  suggestedAction?: string
  fallbackAvailable: boolean
}

/**
 * MCP Error Codes
 */
export type MCPErrorCode =
  | 'CONNECTION_FAILED'
  | 'AUTH_EXPIRED'
  | 'AUTH_INVALID'
  | 'TOOL_NOT_FOUND'
  | 'PARAMETER_INVALID'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'SERVER_ERROR'
  | 'QUOTA_EXCEEDED'
  | 'PERMISSION_DENIED'
  | 'NETWORK_ERROR'
  | 'RESPONSE_INVALID'
  | 'UNKNOWN'

/**
 * MCP Fallback Strategy
 */
export interface MCPFallbackStrategy {
  type: 'direct_oauth' | 'dynamic_api' | 'manual' | 'skip'
  priority: number

  // For direct_oauth
  oauthConfig?: {
    provider: string
    clientId?: string
    scopes?: string[]
  }

  // For dynamic_api
  apiDiscoveryConfig?: {
    baseUrl?: string
    documentationUrl?: string
  }

  // Conditions for when to use this fallback
  conditions?: {
    errorCodes?: MCPErrorCode[]
    maxAttempts?: number
  }
}

/**
 * MCP Server Health Status
 */
export interface MCPServerHealth {
  serverId: string
  provider: MCPProvider
  isHealthy: boolean
  lastCheck: string
  responseTimeMs: number
  errorRate: number
  availableTools: number
  activeConnections: number

  // Issues
  issues?: MCPHealthIssue[]
}

/**
 * MCP Health Issue
 */
export interface MCPHealthIssue {
  severity: 'info' | 'warning' | 'error' | 'critical'
  code: string
  message: string
  since: string
  affectedTools?: string[]
}

/**
 * MCP Tool Discovery Result
 */
export interface MCPToolDiscoveryResult {
  provider: MCPProvider
  serverId: string
  tools: MCPDiscoveredTool[]
  totalCount: number
  discoveredAt: string
  nextRefresh?: string
  discoveryDurationMs?: number
}

/**
 * Discovered MCP Tool
 */
export interface MCPDiscoveredTool {
  slug: string
  name: string
  description: string
  category: string

  // Schema
  inputSchema: Record<string, unknown>
  outputSchema?: Record<string, unknown>

  // Authentication requirements
  authRequired: boolean
  requiredScopes?: string[]

  // Usage info
  isAvailable: boolean
  rateLimits?: {
    requestsPerMinute: number
    requestsPerDay: number
  }

  // Mapping hints
  possibleCatalogMatches?: string[]
  mappingConfidence?: number
}

/**
 * MCP Integration Metrics
 */
export interface MCPIntegrationMetrics {
  // Connection stats
  totalConnections: number
  activeConnections: number
  failedConnections: number
  avgConnectionTimeMs: number

  // Execution stats
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  avgExecutionTimeMs: number

  // Cost stats (NFR-16.4.2)
  totalCostUsd: number
  avgCostPerConnection: number
  costByProvider: Record<MCPProvider, number>

  // Fallback stats
  fallbacksTriggered: number
  fallbackSuccessRate: number

  // Tool stats
  toolsDiscovered: number
  toolsMapped: number
  toolsExecuted: number
}

/**
 * MCP Session for managing multi-step operations
 */
export interface MCPSession {
  id: string
  connectionId: string
  startedAt: string
  lastActivityAt: string

  // Session state
  isActive: boolean
  operationCount: number

  // Cost tracking
  sessionCostUsd: number

  // Results
  results: MCPExecutionResult[]
}

/**
 * MCP Tool Availability Check Result
 */
export interface MCPAvailabilityCheck {
  toolId: string
  isAvailable: boolean
  providers: MCPProviderAvailability[]
  recommendedProvider?: MCPProvider
  fallbackRequired: boolean
  fallbackStrategy?: MCPFallbackStrategy
}

/**
 * MCP Provider Availability
 */
export interface MCPProviderAvailability {
  provider: MCPProvider
  serverId: string
  isAvailable: boolean
  toolSlug?: string
  confidence: number
  estimatedLatencyMs?: number
  estimatedCostUsd?: number
}

/**
 * MCP Connection Request
 */
export interface MCPConnectionRequest {
  provider: MCPProvider
  serverId?: string
  toolIds?: string[]
  options?: {
    forceRefresh?: boolean
    timeout?: number
    priority?: 'low' | 'normal' | 'high'
  }
}

/**
 * MCP Connection Result
 */
export interface MCPConnectionResult {
  success: boolean
  connection?: MCPConnection
  error?: MCPExecutionError
  durationMs: number
  fallbackUsed?: boolean
  fallbackType?: MCPFallbackStrategy['type']
}

/**
 * Messages for MCP operations
 */
export const MCP_OPERATION_MESSAGES = {
  connecting: {
    rube: 'Connecting via Rube MCP server...',
    composio: 'Connecting via Composio MCP server...',
    google: 'Connecting via Google MCP server...',
    zapier: 'Connecting via Zapier MCP server...',
    custom: 'Connecting via custom MCP server...'
  },
  connected: {
    rube: 'Connected to Rube - OAuth ready',
    composio: 'Connected to Composio - 500+ apps available',
    google: 'Connected to Google - Workspace ready',
    zapier: 'Connected to Zapier - Automations available',
    custom: 'Connected to custom MCP server'
  },
  executing: {
    rube: 'Executing tool via Rube...',
    composio: 'Executing tool via Composio...',
    google: 'Executing tool via Google...',
    zapier: 'Executing tool via Zapier...',
    custom: 'Executing tool via MCP...'
  },
  fallback: {
    direct_oauth: 'MCP unavailable - falling back to direct OAuth',
    dynamic_api: 'MCP unavailable - using dynamic API discovery',
    manual: 'MCP unavailable - manual setup required',
    skip: 'MCP unavailable - skipping operation'
  },
  errors: {
    CONNECTION_FAILED: 'Failed to connect to MCP server',
    AUTH_EXPIRED: 'Authentication expired - refreshing...',
    AUTH_INVALID: 'Invalid authentication credentials',
    TOOL_NOT_FOUND: 'Tool not available via MCP',
    PARAMETER_INVALID: 'Invalid parameters for MCP tool',
    RATE_LIMITED: 'Rate limit reached - waiting...',
    TIMEOUT: 'MCP operation timed out',
    SERVER_ERROR: 'MCP server error',
    QUOTA_EXCEEDED: 'MCP usage quota exceeded',
    PERMISSION_DENIED: 'Permission denied for this operation',
    NETWORK_ERROR: 'Network error connecting to MCP',
    RESPONSE_INVALID: 'Invalid response from MCP server',
    UNKNOWN: 'Unknown MCP error occurred'
  }
} as const

/**
 * Default MCP Server Configurations
 */
export const DEFAULT_MCP_SERVERS: MCPServerConfig[] = [
  {
    id: 'rube-default',
    provider: 'rube',
    name: 'Rube MCP Server',
    endpoint: 'https://rube.app/mcp',
    description: 'OAuth-authenticated web access with automatic token management',
    capabilities: ['tool_execution', 'oauth_management', 'token_refresh'],
    authMethod: 'oauth',
    isEnabled: true,
    healthCheckUrl: 'https://rube.app/health',
    rateLimits: {
      requestsPerMinute: 60,
      requestsPerHour: 1000
    },
    timeout: 30000,
    retryConfig: {
      maxRetries: 3,
      backoffMultiplier: 2
    }
  },
  {
    id: 'composio-default',
    provider: 'composio',
    name: 'Composio MCP Server',
    endpoint: 'https://mcp.composio.dev',
    description: '500+ app integrations with pre-built tools',
    capabilities: ['tool_execution', 'oauth_management', 'token_refresh', 'batch_operations'],
    authMethod: 'oauth',
    isEnabled: true,
    healthCheckUrl: 'https://mcp.composio.dev/health',
    rateLimits: {
      requestsPerMinute: 100,
      requestsPerHour: 2000
    },
    timeout: 30000,
    retryConfig: {
      maxRetries: 3,
      backoffMultiplier: 2
    }
  },
  {
    id: 'google-mcp',
    provider: 'google',
    name: 'Google Cloud MCP Server',
    endpoint: 'https://mcp.googleapis.com',
    description: 'Fully-managed MCP for Google services: Maps, BigQuery, Compute Engine, Kubernetes, and more. Enterprise-ready, no extra cost for GCP customers.',
    capabilities: ['tool_execution', 'oauth_management', 'token_refresh', 'batch_operations'],
    authMethod: 'oauth',
    isEnabled: true,
    healthCheckUrl: 'https://mcp.googleapis.com/health',
    rateLimits: {
      requestsPerMinute: 120,
      requestsPerHour: 5000
    },
    timeout: 30000,
    retryConfig: {
      maxRetries: 3,
      backoffMultiplier: 2
    }
  },
  {
    id: 'zapier-mcp',
    provider: 'zapier',
    name: 'Zapier MCP Server',
    endpoint: 'https://mcp.zapier.com',
    description: '8,000+ app integrations with 30,000+ actions. Battle-tested automation platform with 12+ years of reliability.',
    capabilities: ['tool_execution', 'oauth_management', 'token_refresh', 'batch_operations', 'webhooks'],
    authMethod: 'oauth',
    isEnabled: true,
    healthCheckUrl: 'https://mcp.zapier.com/health',
    rateLimits: {
      requestsPerMinute: 100,
      requestsPerHour: 3000
    },
    timeout: 30000,
    retryConfig: {
      maxRetries: 3,
      backoffMultiplier: 2
    }
  }
]

/**
 * Cost thresholds for MCP operations (NFR-16.4.2)
 */
export const MCP_COST_THRESHOLDS = {
  maxCostPerConnection: 0.25, // $0.25 max per connection
  warningThreshold: 0.20, // Warn at 80% of max
  budgetCheckInterval: 1000, // Check every second during operations
} as const

/**
 * Timing thresholds for MCP operations
 */
export const MCP_TIMING_THRESHOLDS = {
  connectionTimeout: 2000, // 2 seconds for connection (AC3)
  toolDiscoveryTimeout: 5000, // 5 seconds for discovery
  availabilityCheckTimeout: 500, // 500ms for availability check
  executionTimeout: 30000, // 30 seconds for tool execution
  healthCheckTimeout: 5000, // 5 seconds for health check
} as const

// ============================================================================
// AUTONOMOUS EXECUTION CONTROLLER TYPES (Epic 16, Story 16.8)
// ============================================================================

/**
 * Execution phases during autonomous workflow execution
 */
export type ExecutionPhase =
  | 'initialization'      // Validate workflow, prepare agents
  | 'tool_resolution'     // Research and select tools
  | 'chain_optimization'  // Optimize tool chain
  | 'connection_setup'    // Connect tools via integrations
  | 'execution'           // Run workflow steps
  | 'completion'          // Deliver results and notify
  | 'paused'              // Paused for critical error
  | 'cancelled'           // Cancelled by user
  | 'failed'              // Failed with unrecoverable error

/**
 * Priority levels for execution events
 */
export type ExecutionPriority = 'critical' | 'high' | 'normal' | 'low'

/**
 * Error severity classification
 */
export type ErrorSeverity = 'critical' | 'non_critical'

/**
 * Types of critical errors that require user decision
 */
export type CriticalErrorType =
  | 'authentication_failure'  // OAuth revoked or invalid
  | 'budget_exceeded'         // Cost limit reached
  | 'data_loss_risk'          // Risk of losing data
  | 'service_permanent_failure' // External service down permanently
  | 'security_violation'      // Security policy violated
  | 'permission_denied'       // Insufficient permissions
  | 'resource_exhausted'      // Resources exhausted
  | 'configuration_invalid'   // Invalid configuration detected

/**
 * Types of non-critical errors that self-healing can handle
 */
export type NonCriticalErrorType =
  | 'network_transient'       // Temporary network issues
  | 'rate_limited'            // Rate limiting (can retry)
  | 'service_temporary'       // Temporary service unavailability
  | 'schema_mismatch'         // Schema can be transformed
  | 'token_expired'           // Token can be refreshed
  | 'timeout'                 // Can retry
  | 'connection_reset'        // Connection can be re-established

/**
 * Configuration for autonomous execution
 */
export interface AutonomousExecutionConfig {
  workflowId: string
  userId: string
  projectId: string

  // Execution settings
  maxRetries: number
  timeoutMs: number
  enableSelfHealing: boolean

  // Budget constraints
  maxBudget: number
  warningThreshold: number

  // Notification settings
  notifyOnCompletion: boolean
  notifyOnCriticalError: boolean
  notificationChannels: NotificationChannel[]

  // Agent settings
  enableToolResearchAgent: boolean
  enableIntegrationEngineerAgent: boolean

  // Logging settings
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  retainLogsForDays: number
}

/**
 * Notification channel configuration
 */
export interface NotificationChannel {
  type: 'email' | 'push' | 'webhook' | 'in_app'
  enabled: boolean
  target?: string // email address, webhook URL, etc.
}

/**
 * Runtime state of autonomous execution
 */
export interface AutonomousExecutionState {
  executionId: string
  workflowId: string
  config: AutonomousExecutionConfig

  // Current state
  phase: ExecutionPhase
  status: 'running' | 'paused' | 'completed' | 'cancelled' | 'failed'
  progress: number // 0-100

  // Phase tracking
  currentPhaseProgress: number
  phasesCompleted: ExecutionPhase[]

  // Step tracking
  currentStepIndex: number
  totalSteps: number
  currentStepName: string

  // Timing
  startedAt: Date
  lastActivityAt: Date
  estimatedCompletionAt?: Date
  completedAt?: Date

  // Error state
  criticalError?: CriticalError
  nonCriticalErrors: NonCriticalError[]
  healingAttempts: HealingAttempt[]

  // Results
  partialResults: PartialResult[]
  finalResults?: ExecutionResult

  // Cost tracking
  currentCost: number
  estimatedTotalCost: number

  // Metadata
  metadata: Record<string, unknown>
}

/**
 * Critical error requiring user decision
 */
export interface CriticalError {
  id: string
  type: CriticalErrorType
  message: string
  details: string
  occurredAt: Date
  stepIndex: number
  stepName: string
  possibleActions: CriticalErrorAction[]
  userDecision?: CriticalErrorDecision
}

/**
 * Possible actions for critical error
 */
export interface CriticalErrorAction {
  id: string
  label: string
  description: string
  requiresInput: boolean
  inputType?: 'text' | 'select' | 'oauth'
  inputOptions?: string[]
}

/**
 * User decision for critical error
 */
export interface CriticalErrorDecision {
  actionId: string
  inputValue?: string
  decidedAt: Date
  decidedBy: string
}

/**
 * Non-critical error handled by self-healing
 */
export interface NonCriticalError {
  id: string
  type: NonCriticalErrorType
  message: string
  occurredAt: Date
  stepIndex: number
  resolved: boolean
  resolutionMethod?: string
  resolvedAt?: Date
}

// HealingAttempt is defined above (line ~1601) - removed duplicate

/**
 * Partial result from cancelled or failed execution
 */
export interface PartialResult {
  stepIndex: number
  stepName: string
  status: 'completed' | 'partial' | 'skipped'
  output?: unknown
  artifacts?: ExecutionArtifact[]
  completedAt?: Date
}

/**
 * Execution artifact (files, data, etc.)
 */
export interface ExecutionArtifact {
  id: string
  type: 'file' | 'data' | 'link' | 'image' | 'document'
  name: string
  url?: string
  data?: unknown
  mimeType?: string
  size?: number
  createdAt: Date
}

/**
 * Final execution result
 */
export interface ExecutionResult {
  executionId: string
  workflowId: string
  status: 'success' | 'partial_success' | 'failed'

  // Results
  outputs: Record<string, unknown>
  artifacts: ExecutionArtifact[]

  // Summary
  summary: string
  stepsCompleted: number
  totalSteps: number

  // Metrics
  totalDuration: number
  totalCost: number
  tokensUsed: number

  // Timestamps
  startedAt: Date
  completedAt: Date
}

/**
 * Execution log entry
 */
export interface ExecutionLogEntry {
  id: string
  executionId: string
  timestamp: Date
  level: 'debug' | 'info' | 'warn' | 'error'
  phase: ExecutionPhase
  stepIndex?: number
  stepName?: string
  message: string
  details?: Record<string, unknown>
  duration?: number
  cost?: number
}

/**
 * Completion notification payload
 */
export interface CompletionNotification {
  executionId: string
  workflowId: string
  workflowName: string
  userId: string

  // Status
  status: 'success' | 'partial_success' | 'failed' | 'cancelled'
  summary: string

  // Metrics
  duration: number
  cost: number
  stepsCompleted: number
  totalSteps: number

  // Links
  resultsUrl: string
  logsUrl: string

  // Artifacts summary
  artifactCount: number
  artifactTypes: string[]

  // Timestamps
  startedAt: Date
  completedAt: Date
  notifiedAt: Date
}

/**
 * Request to start autonomous execution
 */
export interface StartExecutionRequest {
  workflowId: string
  userId: string
  projectId: string
  config?: Partial<AutonomousExecutionConfig>
  initialInputs?: Record<string, unknown>
}

/**
 * Result of starting execution
 */
export interface StartExecutionResult {
  success: boolean
  executionId?: string
  state?: AutonomousExecutionState
  error?: string
  validationErrors?: string[]
}

/**
 * Request to cancel execution
 */
export interface CancelExecutionRequest {
  executionId: string
  reason: string
  cancelledBy: string
  savePartialResults: boolean
}

/**
 * Result of cancellation
 */
export interface CancelExecutionResult {
  success: boolean
  partialResults?: PartialResult[]
  error?: string
  cancelledAt?: Date
}

/**
 * Request to resume paused execution
 */
export interface ResumeExecutionRequest {
  executionId: string
  decision: CriticalErrorDecision
}

/**
 * Result of resuming execution
 */
export interface ResumeExecutionResult {
  success: boolean
  state?: AutonomousExecutionState
  error?: string
}

/**
 * Execution progress update (for real-time updates)
 */
export interface ExecutionProgressUpdate {
  executionId: string
  timestamp: Date

  // Progress
  phase: ExecutionPhase
  progress: number
  stepIndex: number
  stepName: string

  // Status
  status: 'running' | 'paused' | 'completed' | 'cancelled' | 'failed'
  message: string

  // Optional details
  estimatedTimeRemaining?: number
  currentCost?: number
}

/**
 * Agent task delegation request
 */
export interface AgentTaskRequest {
  agentType: 'tool_research' | 'integration_engineer'
  taskType: string
  inputs: Record<string, unknown>
  context: {
    executionId: string
    workflowId: string
    stepIndex: number
  }
}

/**
 * Agent task result
 */
export interface AgentTaskResult {
  success: boolean
  agentType: 'tool_research' | 'integration_engineer'
  taskType: string
  outputs: Record<string, unknown>
  duration: number
  cost: number
  error?: string
}

/**
 * Execution metrics for monitoring
 */
export interface AutonomousExecutionMetrics {
  // Execution counts
  totalExecutions: number
  runningExecutions: number
  completedExecutions: number
  failedExecutions: number
  cancelledExecutions: number

  // Success rates
  successRate: number
  partialSuccessRate: number

  // Timing
  averageExecutionTime: number
  medianExecutionTime: number

  // Cost
  totalCost: number
  averageCost: number

  // Self-healing
  totalHealingAttempts: number
  healingSuccessRate: number

  // Error distribution
  criticalErrorCount: number
  nonCriticalErrorCount: number
  errorsByType: Record<string, number>

  // Agent usage
  toolResearchAgentInvocations: number
  integrationEngineerAgentInvocations: number
}

/**
 * Callbacks for autonomous execution events
 */
export interface AutonomousExecutionCallbacks {
  onProgress?: (update: ExecutionProgressUpdate) => void
  onPhaseChange?: (phase: ExecutionPhase, state: AutonomousExecutionState) => void
  onStepComplete?: (stepIndex: number, result: PartialResult) => void
  onCriticalError?: (error: CriticalError) => void
  onNonCriticalError?: (error: NonCriticalError) => void
  onHealingAttempt?: (attempt: HealingAttempt) => void
  onCompletion?: (notification: CompletionNotification) => void
  onCancellation?: (result: CancelExecutionResult) => void
}

/**
 * Default autonomous execution configuration
 */
export const DEFAULT_AUTONOMOUS_EXECUTION_CONFIG: AutonomousExecutionConfig = {
  workflowId: '',
  userId: '',
  projectId: '',
  maxRetries: 3,
  timeoutMs: 3600000, // 1 hour
  enableSelfHealing: true,
  maxBudget: 10.00, // $10 max per execution
  warningThreshold: 8.00, // Warn at $8
  notifyOnCompletion: true,
  notifyOnCriticalError: true,
  notificationChannels: [
    { type: 'in_app', enabled: true },
    { type: 'email', enabled: false }
  ],
  enableToolResearchAgent: true,
  enableIntegrationEngineerAgent: true,
  logLevel: 'info',
  retainLogsForDays: 30
}

/**
 * Execution timing thresholds
 */
export const AUTONOMOUS_EXECUTION_THRESHOLDS = {
  phaseTimeouts: {
    initialization: 30000,      // 30 seconds
    tool_resolution: 60000,     // 1 minute
    chain_optimization: 30000,  // 30 seconds
    connection_setup: 120000,   // 2 minutes
    execution: 3600000,         // 1 hour (step-level timeout applies)
    completion: 30000           // 30 seconds
  },
  stepTimeout: 300000,          // 5 minutes per step
  healingTimeout: 60000,        // 1 minute for healing attempt
  decisionTimeout: 86400000,    // 24 hours for user decision
  progressUpdateInterval: 1000, // 1 second
  costCheckInterval: 5000       // 5 seconds
} as const

/**
 * Error messages for autonomous execution
 */
export const AUTONOMOUS_EXECUTION_ERROR_MESSAGES = {
  critical: {
    AUTHENTICATION_FAILURE: 'Authentication failed. Please re-authorize the connection.',
    BUDGET_EXCEEDED: 'Budget limit exceeded. Please increase budget or optimize workflow.',
    DATA_LOSS_RISK: 'Operation may result in data loss. Please confirm or cancel.',
    SERVICE_PERMANENT_FAILURE: 'External service is permanently unavailable.',
    SECURITY_VIOLATION: 'Security policy violation detected.',
    PERMISSION_DENIED: 'Insufficient permissions for this operation.',
    RESOURCE_EXHAUSTED: 'System resources exhausted.',
    CONFIGURATION_INVALID: 'Invalid configuration detected.'
  },
  nonCritical: {
    NETWORK_TRANSIENT: 'Temporary network issue. Retrying...',
    RATE_LIMITED: 'Rate limited. Waiting before retry...',
    SERVICE_TEMPORARY: 'Service temporarily unavailable. Retrying...',
    SCHEMA_MISMATCH: 'Schema mismatch detected. Transforming data...',
    TOKEN_EXPIRED: 'Token expired. Refreshing...',
    TIMEOUT: 'Operation timed out. Retrying...',
    CONNECTION_RESET: 'Connection reset. Re-establishing...'
  }
} as const

// ============================================================================
// TOOL CHAIN VISUALIZATION TYPES (Epic 16, Story 16.9)
// ============================================================================

/**
 * Node types for tool chain visualization
 */
export type ToolChainNodeType =
  | 'tool'           // Standard tool node (rounded rectangle)
  | 'transform'      // Data transformation node (diamond)
  | 'mcp_connector'  // MCP connection node (with lightning badge)
  | 'input'          // Workflow input node
  | 'output'         // Workflow output node
  | 'condition'      // Conditional branching node
  | 'parallel'       // Parallel execution group

/**
 * Node execution status
 */
export type ToolChainNodeStatus =
  | 'pending'        // Not yet started (gray)
  | 'queued'         // Queued for execution (gray)
  | 'running'        // Currently executing (blue)
  | 'self_healing'   // Self-healing in progress (amber)
  | 'completed'      // Successfully completed (green)
  | 'failed'         // Failed with error (red)
  | 'skipped'        // Skipped during execution
  | 'cancelled'      // Cancelled by user

/**
 * MCP provider type for connector badge
 */
export type MCPProviderType = 'rube' | 'composio' | 'google' | 'zapier' | 'custom' | 'none'

/**
 * Position coordinates for layout
 */
export interface NodePosition {
  x: number
  y: number
}

/**
 * Node dimensions
 */
export interface NodeDimensions {
  width: number
  height: number
}

/**
 * Tool chain node for visualization
 */
export interface ToolChainNode {
  id: string
  type: ToolChainNodeType

  // Display properties
  name: string
  description?: string
  icon?: string

  // Tool reference (for tool nodes)
  toolId?: string
  toolCategory?: string

  // MCP properties (for mcp_connector nodes)
  mcpProvider?: MCPProviderType
  mcpServerId?: string

  // Transform properties (for transform nodes)
  transformType?: 'map' | 'filter' | 'reduce' | 'merge' | 'split' | 'custom'
  schemaMapping?: Record<string, string>

  // Execution state
  status: ToolChainNodeStatus
  progress: number // 0-100
  statusMessage?: string

  // Self-healing state
  isHealing?: boolean
  healingAttempt?: number
  healingMaxAttempts?: number
  healingMessage?: string

  // Timing
  startedAt?: Date
  completedAt?: Date
  duration?: number

  // Cost
  cost?: number
  estimatedCost?: number

  // Error state
  error?: {
    type: 'critical' | 'non_critical'
    message: string
    details?: string
  }

  // Layout
  position: NodePosition
  dimensions: NodeDimensions

  // Connection points
  inputPorts: string[]
  outputPorts: string[]

  // Connection references (for layout graph building)
  connections: {
    inputs: string[]   // IDs of nodes providing input
    outputs: string[]  // IDs of nodes receiving output
  }

  // Metadata
  metadata?: Record<string, unknown>

  // Visual styling (for component rendering)
  style?: {
    backgroundColor?: string
    borderColor?: string
    borderRadius?: number
  }

  // Execution timing (aliases for component compatibility)
  startTime?: Date
  endTime?: Date
  actualDuration?: number
  expectedDuration?: number

  // Execution results
  executionResult?: unknown
  errorMessage?: string
  executionLogs?: ExecutionLogEntry[]

  // Cost tracking
  actualCost?: number
}

/**
 * Edge type for connections
 */
export type ToolChainEdgeType =
  | 'data_flow'      // Standard data flow
  | 'control_flow'   // Control/sequence flow
  | 'error_flow'     // Error handling path
  | 'conditional'    // Conditional branch

/**
 * Edge status
 */
export type ToolChainEdgeStatus =
  | 'inactive'       // Not yet traversed
  | 'pending'        // Waiting to be traversed
  | 'active'         // Data currently flowing
  | 'completed'      // Successfully traversed
  | 'error'          // Error occurred during transfer

/**
 * Tool chain edge (connection between nodes)
 */
export interface ToolChainEdge {
  id: string
  type: ToolChainEdgeType

  // Connection
  sourceNodeId: string
  sourcePort: string
  targetNodeId: string
  targetPort: string

  // Status
  status: ToolChainEdgeStatus

  // Data flow info
  dataType?: string
  dataSize?: number

  // Visual properties
  label?: string
  animated?: boolean

  // Routing
  waypoints?: NodePosition[]

  // Path for rendering
  path?: {
    points: NodePosition[]
    controlPoints?: NodePosition[]
  }

  // Visual styling
  style?: {
    color?: string
    width?: number
    dashPattern?: string
  }

  // Data flow animation
  dataFlowing?: boolean

  // Metadata
  metadata?: Record<string, unknown>
}

/**
 * Complete tool chain layout for visualization
 */
export interface ToolChainLayout {
  id: string
  name: string
  description?: string

  // Nodes and edges
  nodes: ToolChainNode[]
  edges: ToolChainEdge[]

  // Layout bounds
  bounds: {
    width: number
    height: number
    minX: number
    minY: number
    maxX: number
    maxY: number
  }

  // Execution state
  executionId?: string
  overallStatus: ToolChainNodeStatus
  overallProgress: number

  // Active path highlighting
  activeNodeIds: string[]
  activeEdgeIds: string[]

  // Statistics
  statistics: ChainStatistics

  // Timestamps
  createdAt: Date
  updatedAt: Date
}

/**
 * Configuration for visualization rendering
 */
export interface VisualizationConfig {
  // Layout settings
  nodeSpacing: number
  levelSpacing: number
  direction: 'horizontal' | 'vertical'

  // Node styling
  nodeStyles: {
    tool: NodeStyleConfig
    transform: NodeStyleConfig
    mcp_connector: NodeStyleConfig
    input: NodeStyleConfig
    output: NodeStyleConfig
    condition: NodeStyleConfig
    parallel: NodeStyleConfig
  }

  // Edge styling
  edgeStyles: {
    data_flow: EdgeStyleConfig
    control_flow: EdgeStyleConfig
    error_flow: EdgeStyleConfig
    conditional: EdgeStyleConfig
  }

  // Status colors
  statusColors: Record<ToolChainNodeStatus, string>

  // Animation
  enableAnimations: boolean
  animationDuration: number

  // Interactivity
  enableZoom: boolean
  enablePan: boolean
  enableNodeSelection: boolean

  // Performance
  maxVisibleNodes: number
  updateThrottleMs: number
}

/**
 * Node style configuration
 */
export interface NodeStyleConfig {
  shape: 'rectangle' | 'rounded' | 'diamond' | 'circle' | 'hexagon'
  defaultWidth: number
  defaultHeight: number
  backgroundColor: string
  borderColor: string
  borderWidth: number
  borderRadius?: number
  iconSize: number
  fontSize: number
  fontColor: string
}

/**
 * Edge style configuration
 */
export interface EdgeStyleConfig {
  strokeColor: string
  strokeWidth: number
  strokeDasharray?: string
  arrowSize: number
  animated: boolean
}

/**
 * Real-time update event for visualization
 */
export interface VisualizationUpdateEvent {
  type: 'node_status' | 'edge_status' | 'progress' | 'healing' | 'error' | 'completion'
  timestamp: Date

  // Node update
  nodeId?: string
  nodeStatus?: ToolChainNodeStatus
  nodeProgress?: number
  nodeMessage?: string

  // Edge update
  edgeId?: string
  edgeStatus?: ToolChainEdgeStatus

  // Healing update
  healingAttempt?: number
  healingMaxAttempts?: number
  healingMessage?: string

  // Error update
  errorType?: 'critical' | 'non_critical'
  errorMessage?: string

  // Overall progress
  overallProgress?: number

  // Metadata
  metadata?: Record<string, unknown>
}

/**
 * Node detail information for detail panel
 */
export interface NodeDetailInfo {
  node: ToolChainNode

  // Execution log
  executionLog: Array<{
    timestamp: Date
    level: 'debug' | 'info' | 'warn' | 'error'
    message: string
    details?: Record<string, unknown>
  }>

  // Input/output data
  inputData?: Record<string, unknown>
  outputData?: Record<string, unknown>

  // Schema information
  inputSchema?: Record<string, unknown>
  outputSchema?: Record<string, unknown>

  // Performance metrics
  metrics: {
    executionTime: number
    dataProcessed: number
    cost: number
    retryCount: number
  }

  // Tool information (for tool nodes)
  toolInfo?: {
    name: string
    version: string
    provider: string
    documentation?: string
  }

  // MCP information (for mcp_connector nodes)
  mcpInfo?: {
    provider: MCPProviderType
    serverName: string
    connectionStatus: 'connected' | 'disconnected' | 'reconnecting'
    lastActivity: Date
  }
}

/**
 * Subscription for real-time updates
 */
export interface VisualizationSubscription {
  id: string
  executionId: string
  callback: (event: VisualizationUpdateEvent) => void
  filter?: {
    nodeIds?: string[]
    eventTypes?: VisualizationUpdateEvent['type'][]
  }
}

/**
 * Build layout request
 */
export interface BuildLayoutRequest {
  chainId: string
  executionId?: string
  config?: Partial<VisualizationConfig>
}

/**
 * Build layout result
 */
export interface BuildLayoutResult {
  success: boolean
  layout?: ToolChainLayout
  error?: string
}

/**
 * Default visualization configuration
 */
export const DEFAULT_VISUALIZATION_CONFIG: VisualizationConfig = {
  nodeSpacing: 80,
  levelSpacing: 150,
  direction: 'horizontal',

  nodeStyles: {
    tool: {
      shape: 'rounded',
      defaultWidth: 180,
      defaultHeight: 80,
      backgroundColor: '#ffffff',
      borderColor: '#e2e8f0',
      borderWidth: 2,
      borderRadius: 12,
      iconSize: 24,
      fontSize: 14,
      fontColor: '#1e293b'
    },
    transform: {
      shape: 'diamond',
      defaultWidth: 100,
      defaultHeight: 100,
      backgroundColor: '#fef3c7',
      borderColor: '#f59e0b',
      borderWidth: 2,
      iconSize: 20,
      fontSize: 12,
      fontColor: '#92400e'
    },
    mcp_connector: {
      shape: 'rounded',
      defaultWidth: 180,
      defaultHeight: 80,
      backgroundColor: '#ede9fe',
      borderColor: '#8b5cf6',
      borderWidth: 2,
      borderRadius: 12,
      iconSize: 24,
      fontSize: 14,
      fontColor: '#5b21b6'
    },
    input: {
      shape: 'rounded',
      defaultWidth: 120,
      defaultHeight: 60,
      backgroundColor: '#ecfdf5',
      borderColor: '#10b981',
      borderWidth: 2,
      borderRadius: 30,
      iconSize: 20,
      fontSize: 12,
      fontColor: '#065f46'
    },
    output: {
      shape: 'rounded',
      defaultWidth: 120,
      defaultHeight: 60,
      backgroundColor: '#fef2f2',
      borderColor: '#ef4444',
      borderWidth: 2,
      borderRadius: 30,
      iconSize: 20,
      fontSize: 12,
      fontColor: '#991b1b'
    },
    condition: {
      shape: 'diamond',
      defaultWidth: 80,
      defaultHeight: 80,
      backgroundColor: '#f0f9ff',
      borderColor: '#0ea5e9',
      borderWidth: 2,
      iconSize: 20,
      fontSize: 12,
      fontColor: '#0369a1'
    },
    parallel: {
      shape: 'rectangle',
      defaultWidth: 200,
      defaultHeight: 120,
      backgroundColor: '#f8fafc',
      borderColor: '#94a3b8',
      borderWidth: 2,
      iconSize: 20,
      fontSize: 12,
      fontColor: '#475569'
    }
  },

  edgeStyles: {
    data_flow: {
      strokeColor: '#94a3b8',
      strokeWidth: 2,
      arrowSize: 8,
      animated: false
    },
    control_flow: {
      strokeColor: '#64748b',
      strokeWidth: 2,
      strokeDasharray: '5,5',
      arrowSize: 8,
      animated: false
    },
    error_flow: {
      strokeColor: '#ef4444',
      strokeWidth: 2,
      strokeDasharray: '3,3',
      arrowSize: 8,
      animated: false
    },
    conditional: {
      strokeColor: '#0ea5e9',
      strokeWidth: 2,
      arrowSize: 8,
      animated: false
    }
  },

  statusColors: {
    pending: '#9ca3af',      // Gray
    queued: '#9ca3af',       // Gray
    running: '#3b82f6',      // Blue
    self_healing: '#f59e0b', // Amber
    completed: '#10b981',    // Green
    failed: '#ef4444',       // Red
    skipped: '#6b7280',      // Gray
    cancelled: '#6b7280'     // Gray
  },

  enableAnimations: true,
  animationDuration: 300,
  enableZoom: true,
  enablePan: true,
  enableNodeSelection: true,
  maxVisibleNodes: 50,
  updateThrottleMs: 100 // < 500ms as per NFR
}

/**
 * Visualization timing thresholds
 */
export const VISUALIZATION_THRESHOLDS = {
  maxUpdateLatency: 500,    // NFR: < 500ms update latency
  throttleInterval: 100,    // Throttle updates to 100ms
  animationFps: 60,         // Target 60fps for animations
  maxChainNodes: 100,       // Max nodes for performance
  detailPanelDebounce: 200  // Debounce detail panel updates
} as const

/**
 * Status display messages
 */
export const NODE_STATUS_MESSAGES: Record<ToolChainNodeStatus, string> = {
  pending: 'Waiting to start',
  queued: 'Queued for execution',
  running: 'Executing...',
  self_healing: 'Optimizing connection...',
  completed: 'Completed successfully',
  failed: 'Failed',
  skipped: 'Skipped',
  cancelled: 'Cancelled'
}

/**
 * Self-healing status messages
 */
export const HEALING_STATUS_MESSAGES = {
  retry: 'Retrying operation...',
  refresh_auth: 'Refreshing authentication...',
  rate_limit_wait: 'Waiting for rate limit...',
  schema_adapt: 'Adapting data schema...',
  reroute: 'Finding alternative route...'
} as const

// ============================================================================
// Additional Types for Tool Chain Visualization
// ============================================================================

/**
 * Layout direction for tool chain visualization
 */
export type LayoutDirection = 'horizontal' | 'vertical'

/**
 * Node details panel data structure
 */
export interface NodeDetailsPanel {
  nodeId: string
  nodeName: string
  nodeType: ToolChainNodeType
  status: ToolChainNodeStatus
  progress: number
  startTime?: Date
  endTime?: Date
  duration?: number
  estimatedDuration?: number
  input?: unknown
  output?: unknown
  error?: string
  logs: ExecutionLogEntry[]
  metrics?: {
    tokensUsed?: number
    cost?: number
    retryCount?: number
  }
  isHealing?: boolean
  healingAttempt?: number
  healingMaxAttempts?: number
  healingMessage?: string
}

/**
 * Tool chain update event types
 */
export type ToolChainUpdateEventType =
  | 'node_status_changed'
  | 'node_status_change'
  | 'node_progress_updated'
  | 'node_completed'
  | 'node_failed'
  | 'edge_status_changed'
  | 'chain_completed'
  | 'chain_failed'
  | 'healing_started'
  | 'healing_completed'
  | 'batch_update'

/**
 * Tool chain update event
 */
export interface ToolChainUpdateEvent {
  type: ToolChainUpdateEventType
  layoutId: string
  nodeId?: string
  edgeId?: string
  timestamp: Date
  // Node status change details
  previousStatus?: ToolChainNodeStatus
  newStatus?: ToolChainNodeStatus
  progress?: number
  message?: string
  error?: string
  // Healing details
  healingAttempt?: number
  healingMaxAttempts?: number
  healingMessage?: string
  // Batch updates
  events?: ToolChainUpdateEvent[]
  data?: {
    status?: ToolChainNodeStatus
    progress?: number
    message?: string
    error?: string
  }
}

/**
 * Chain statistics for progress tracking
 */
export interface ChainStatistics {
  totalNodes: number
  completedNodes: number
  failedNodes: number
  skippedNodes: number
  activeNodes: number
  healingNodes: number
  overallProgress: number
  estimatedTimeRemaining?: number
  totalDuration?: number
  totalCost?: number
}

/**
 * Optimized chain representation for layout building
 */
export interface OptimizedChain {
  id: string
  name: string
  description?: string
  nodes: Array<{
    id: string
    type: ToolChainNodeType
    name: string
    description?: string
    icon?: string
    toolId?: string
    config?: Record<string, unknown>
  }>
  edges: Array<{
    id: string
    sourceId: string
    targetId: string
    type?: ToolChainEdgeType
    label?: string
  }>
  metadata?: Record<string, unknown>
}

// ============================================================================
// Story 16.9: Tool Chain Visualization Service Types
// ============================================================================

/**
 * Layout bounds for visualization canvas
 */
export interface LayoutBounds {
  width: number
  height: number
  minX: number
  minY: number
  maxX: number
  maxY: number
}

/**
 * Edge path with bezier curve points
 */
export interface EdgePath {
  points: NodePosition[]
  controlPoints?: NodePosition[]
}

/**
 * Full visualization state for a tool chain layout
 */
export interface ToolChainVisualizationState {
  layout: ToolChainLayout
  config: VisualizationConfig
  subscriptionCount: number
  pendingUpdates: number
  lastUpdateTime: number
}
