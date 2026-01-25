/**
 * Admin API Client - Tool Catalog Management
 *
 * Provides admin-level operations for managing the tool catalog:
 * - Add new tools
 * - Approve pending tools
 * - Update tool metadata
 * - View catalog statistics
 *
 * Part of Epic 16: Intelligent Agent Skills
 */

import { toolCatalogService } from '../services/ToolCatalogService'
import type {
  Tool,
  AddToolRequest,
  ToolSearchFilters,
  ToolSearchResult,
  ToolCatalogStats,
  ToolCategory,
  LearnedPattern
} from '../types/tools'

// Admin API Response wrapper
interface AdminApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}

// Tool approval request
interface ApproveToolRequest {
  toolId: string
  approvedBy: string
  notes?: string
}

// Tool update request
interface UpdateToolRequest {
  toolId: string
  updates: Partial<Tool>
}

// Bulk import request
interface BulkImportRequest {
  tools: AddToolRequest[]
  autoApprove?: boolean
  approvedBy?: string
}

// Bulk import result
interface BulkImportResult {
  total: number
  succeeded: number
  failed: number
  errors: Array<{ index: number; name: string; error: string }>
  toolIds: string[]
}

/**
 * Admin Tool Catalog API
 */
class AdminToolCatalogApi {
  /**
   * Search tools with admin visibility (includes unapproved)
   */
  async searchTools(filters: ToolSearchFilters & { includeUnapproved?: boolean }): Promise<AdminApiResponse<ToolSearchResult[]>> {
    try {
      const results = await toolCatalogService.searchTools(filters)
      return {
        success: true,
        data: results,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Get tool by ID
   */
  async getToolById(toolId: string): Promise<AdminApiResponse<Tool>> {
    try {
      const tool = await toolCatalogService.getToolById(toolId)
      if (!tool) {
        return {
          success: false,
          error: `Tool not found: ${toolId}`,
          timestamp: new Date().toISOString()
        }
      }
      return {
        success: true,
        data: tool,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get tool',
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Add a new tool to the catalog
   */
  async addTool(request: AddToolRequest): Promise<AdminApiResponse<Tool>> {
    try {
      // Validate required fields
      if (!request.name?.trim()) {
        return {
          success: false,
          error: 'Tool name is required',
          timestamp: new Date().toISOString()
        }
      }
      if (!request.category) {
        return {
          success: false,
          error: 'Tool category is required',
          timestamp: new Date().toISOString()
        }
      }
      if (!request.authMethod) {
        return {
          success: false,
          error: 'Auth method is required',
          timestamp: new Date().toISOString()
        }
      }

      const tool = await toolCatalogService.addTool(request)
      return {
        success: true,
        data: tool,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add tool',
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Approve a pending tool
   */
  async approveTool(request: ApproveToolRequest): Promise<AdminApiResponse<Tool>> {
    try {
      if (!request.toolId) {
        return {
          success: false,
          error: 'Tool ID is required',
          timestamp: new Date().toISOString()
        }
      }
      if (!request.approvedBy) {
        return {
          success: false,
          error: 'Approver ID is required',
          timestamp: new Date().toISOString()
        }
      }

      const tool = await toolCatalogService.approveTool(request.toolId, request.approvedBy)
      return {
        success: true,
        data: tool,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to approve tool',
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Update tool metadata
   */
  async updateTool(request: UpdateToolRequest): Promise<AdminApiResponse<Tool>> {
    try {
      if (!request.toolId) {
        return {
          success: false,
          error: 'Tool ID is required',
          timestamp: new Date().toISOString()
        }
      }

      const tool = await toolCatalogService.updateTool(request.toolId, request.updates)
      return {
        success: true,
        data: tool,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update tool',
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Bulk import tools
   */
  async bulkImport(request: BulkImportRequest): Promise<AdminApiResponse<BulkImportResult>> {
    try {
      const result: BulkImportResult = {
        total: request.tools.length,
        succeeded: 0,
        failed: 0,
        errors: [],
        toolIds: []
      }

      for (let i = 0; i < request.tools.length; i++) {
        const toolRequest = request.tools[i]
        try {
          const tool = await toolCatalogService.addTool(toolRequest)

          // Auto-approve if requested
          if (request.autoApprove && request.approvedBy) {
            await toolCatalogService.approveTool(tool.id, request.approvedBy)
          }

          result.succeeded++
          result.toolIds.push(tool.id)
        } catch (error) {
          result.failed++
          result.errors.push({
            index: i,
            name: toolRequest.name,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Bulk import failed',
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Get catalog statistics
   */
  async getCatalogStats(): Promise<AdminApiResponse<ToolCatalogStats>> {
    try {
      const stats = await toolCatalogService.getCatalogStats()
      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get stats',
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Get learned patterns for a tool
   */
  async getLearnedPatterns(toolId: string, projectId?: string): Promise<AdminApiResponse<LearnedPattern>> {
    try {
      const patterns = await toolCatalogService.getLearnedPatterns(toolId, projectId)
      return {
        success: true,
        data: patterns,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get patterns',
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Get tools by category
   */
  async getToolsByCategory(category: ToolCategory): Promise<AdminApiResponse<Tool[]>> {
    try {
      const tools = await toolCatalogService.getToolsByCategory(category)
      return {
        success: true,
        data: tools,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get tools',
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Get popular tools
   */
  async getPopularTools(limit = 10): Promise<AdminApiResponse<Tool[]>> {
    try {
      const tools = await toolCatalogService.getPopularTools(limit)
      return {
        success: true,
        data: tools,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get popular tools',
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Clear catalog cache (admin utility)
   */
  clearCache(): void {
    toolCatalogService.clearCache()
  }
}

// Export singleton instance
export const adminToolCatalogApi = new AdminToolCatalogApi()

// Export types
export type {
  AdminApiResponse,
  ApproveToolRequest,
  UpdateToolRequest,
  BulkImportRequest,
  BulkImportResult
}
