/**
 * Workflow Templates Index
 *
 * Central export point for all workflow template modules
 */

// Core templates for small business automation
export {
  coreWorkflowTemplates,
  getCoreTemplateById,
  getCoreTemplatesByCategory,
  getPopularCoreTemplates,
  getNewCoreTemplates,
  getCoreTemplatesByComplexity,
  searchCoreTemplates,
  getCoreTemplatesRequiringIntegration,
  getAllCoreTemplateCategories,
  calculateTotalTimeSaved,
  calculateTotalMoneySaved,
} from './core-templates'

export type { CoreWorkflowTemplate } from './core-templates'
