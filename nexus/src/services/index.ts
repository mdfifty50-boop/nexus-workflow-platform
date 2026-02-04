/**
 * Nexus Services - Real-World Workflow Execution
 *
 * This module exports all services required for autonomous workflow execution:
 *
 * - WorkflowExecutionService: Simplified execution via Composio/Rube (ACTIVE)
 * - AIOrchestrator: Smart model selection and cost optimization
 * - BookingService: Travel and restaurant booking (flights, hotels, restaurants, cars)
 * - PaymentService: Payment processing (Stripe, Apple Pay, Google Pay)
 * - BrowserAutomationService: Complex web automation via Playwright
 * - SmartWorkflowEngine: AI-powered workflow generation
 * - NexusWorkflowEngine: Nexus AI methodology implementation
 *
 * ARCHIVED (see src/_archived/):
 * - WorkflowExecutionEngine: Full-featured engine (payments, bookings, retries)
 */

// Workflow execution service (simplified, uses Composio directly)
export { workflowExecutionService } from './WorkflowExecutionService'
export type { ExecutionConfig, ExecutionResult, ExecutionCallbacks } from './WorkflowExecutionService'
export type { WorkflowNode as ExecutionWorkflowNode } from './WorkflowExecutionService'

// AI orchestration and model routing
export {
  AIOrchestrator,
  aiOrchestrator
} from './AIOrchestrator'

// Booking services (travel, restaurants)
export { BookingService, bookingService } from './BookingService'
export type { FlightSearchParams, FlightResult, HotelSearchParams, HotelResult, RestaurantSearchParams, RestaurantResult, CarRentalSearchParams, CarRentalResult, BookingConfirmation } from './BookingService'

// Payment processing
export { PaymentService, paymentService } from './PaymentService'
export type { PaymentMethod, PaymentIntent, PaymentStatus, PaymentResult, RefundResult, SharedPaymentToken, PaymentLink } from './PaymentService'

// Browser automation
export { BrowserAutomationService, browserAutomationService } from './BrowserAutomationService'
export type { AutomationTask, AutomationTaskType, AutomationStep, AutomationAction, AutomationResult, BookingFlowConfig, PassengerDetails, PaymentFormData } from './BrowserAutomationService'

// Workflow generation
export { SmartWorkflowEngine, smartWorkflowEngine, EMBEDDED_TOOLS } from './SmartWorkflowEngine'
export type { GeneratedWorkflow, WorkflowNode } from './SmartWorkflowEngine'

// Nexus AI methodology
export { NexusWorkflowEngine, nexusWorkflowEngine } from './NexusWorkflowEngine'
export type { IntentAnalysis, SmartNexusQuestion } from './NexusWorkflowEngine'

// Integration service
export {
  IntegrationService
} from './IntegrationService'

// Tool Catalog (Epic 16)
export {
  ToolCatalogService,
  toolCatalogService
} from './ToolCatalogService'

// Trust Score Service (Epic 16, Story 16.2)
export {
  TrustScoreService,
  trustScoreService
} from './TrustScoreService'
export type { TrustScoreInput } from './TrustScoreService'

// Tool Discovery Service (Epic 16, Story 16.2)
export {
  ToolDiscoveryService,
  toolDiscoveryService
} from './ToolDiscoveryService'

// Tool Chain Optimizer Service (Epic 16, Story 16.3)
export {
  ToolChainOptimizerService,
  toolChainOptimizerService
} from './ToolChainOptimizerService'

// Integration Schema Analyzer Service (Epic 16, Story 16.4)
export {
  integrationSchemaAnalyzerService
} from './IntegrationSchemaAnalyzerService'

// Dynamic Integration Connector Service (Epic 16, Story 16.5)
export {
  dynamicIntegrationConnectorService
} from './DynamicIntegrationConnectorService'

// Integration Self-Healing Service (Epic 16, Story 16.6)
export {
  IntegrationSelfHealingService,
  integrationSelfHealingService
} from './IntegrationSelfHealingService'

// MCP Server Integration Service (Epic 16, Story 16.7)
export {
  MCPServerIntegrationService,
  mcpServerIntegrationService
} from './MCPServerIntegrationService'

// Autonomous Execution Controller Service (Epic 16, Story 16.8)
export {
  AutonomousExecutionControllerService,
  autonomousExecutionControllerService
} from './AutonomousExecutionControllerService'

// Tool Chain Visualization Service (Epic 16, Story 16.9)
export {
  ToolChainVisualizationService,
  ToolChainVisualizationServiceImpl
} from './ToolChainVisualizationService'

// Composio Client - Frontend API client for Composio MCP integration
export {
  composioClient,
  TOOL_SLUGS
} from './ComposioClient'
export type {
  ComposioToolResult,
  ComposioSession,
  ComposioConnectionStatus
} from './ComposioClient'

// NL Workflow Engine - Natural Language to Workflow JSON
// Converts English/Arabic commands to executable workflow JSON with Composio tool references
export {
  NLWorkflowEngine,
  nlWorkflowEngine
} from './NLWorkflowEngine'
export type {
  WorkflowTrigger,
  WorkflowAction,
  GeneratedWorkflowJSON,
  NLParseResult
} from './NLWorkflowEngine'

// Voice Configuration Service - AI Voice Call Settings
export {
  VoiceConfigService,
  getVoiceProfiles,
  getFilteredVoiceProfiles,
  getDomains,
  getUserVoiceConfig,
  saveUserVoiceConfig,
  getWorkflowVoiceConfig,
  saveWorkflowVoiceConfig,
  detectLanguage,
  previewVoice,
  getDomainDisplayName,
  getLanguageDisplayName,
  getGenderDisplayName
} from './VoiceConfigService'
export type {
  VoiceProfile,
  DomainOption,
  UserVoicePreferences,
  VoiceRecommendation,
  UserVoiceConfig,
  WorkflowVoiceConfig
} from './VoiceConfigService'

// Chat Persistence Service - Dual-write Supabase + localStorage
// Plan B: User Account System - Cross-device chat history sync
export {
  chatPersistenceService
} from './ChatPersistenceService'

// Workflow Persistence Service - Dual-write Supabase + localStorage
// Plan B: User Account System - Cross-device workflow sync
export {
  workflowPersistenceService
} from './WorkflowPersistenceService'

// User Preferences Service - Dual-write Supabase + localStorage
// Plan B: User Account System - Cross-device preferences sync
export {
  userPreferencesService
} from './UserPreferencesService'
export type {
  UserPreferences,
  PreferenceKey
} from './UserPreferencesService'
