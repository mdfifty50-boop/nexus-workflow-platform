/**
 * OrderSheetSyncService - Google Sheets Sync for WhatsApp Orders
 *
 * Syncs order data to Google Sheets via Composio integration.
 * Handles:
 * - Appending new order rows
 * - Updating order status in existing rows
 * - Creating header row on first sync
 * - Graceful fallback when Composio connection is unavailable
 *
 * Sheet columns:
 * Order ID | Date | Customer Name | Phone | Items | Quantity | Total | Currency | Address | Status | Notes
 */

import { composioService, ToolExecutionResult } from './ComposioService.js'
import { Order, OrderStatus } from './OrderService.js'

// =============================================================================
// TYPES
// =============================================================================

export interface SheetSyncResult {
  success: boolean
  rowId?: number
  error?: string
  spreadsheetId?: string
}

export interface SheetSyncConfig {
  spreadsheetId: string
  sheetName?: string
}

// =============================================================================
// SHEET COLUMN DEFINITIONS
// =============================================================================

const SHEET_HEADERS = [
  'Order ID',
  'Date',
  'Customer Name',
  'Phone',
  'Items',
  'Quantity',
  'Total',
  'Currency',
  'Address',
  'Status',
  'Notes',
]

// Status display names (for sheet)
const STATUS_DISPLAY: Record<OrderStatus, string> = {
  new: 'New',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

// =============================================================================
// ORDER SHEET SYNC SERVICE
// =============================================================================

class OrderSheetSyncServiceClass {
  // Track which spreadsheets have been initialized with headers
  private initializedSheets = new Set<string>()

  // Per-user/business sheet config (keyed by phone or business ID)
  private sheetConfigs = new Map<string, SheetSyncConfig>()

  // Row tracking: orderId -> row number (1-indexed from data, not headers)
  private orderRowMap = new Map<string, number>()
  private nextRowNumber = 2 // Start after header row

  /**
   * Set the Google Sheet configuration for a business
   */
  setSheetConfig(businessId: string, config: SheetSyncConfig): void {
    this.sheetConfigs.set(businessId, config)
    console.log(`[OrderSheetSync] Sheet config set for ${businessId}: ${config.spreadsheetId}`)
  }

  /**
   * Get the configured spreadsheet ID for a business
   * Falls back to environment variable
   */
  getSpreadsheetId(businessId?: string): string | null {
    if (businessId) {
      const config = this.sheetConfigs.get(businessId)
      if (config?.spreadsheetId) return config.spreadsheetId
    }

    // Fallback to env var
    return process.env.WHATSAPP_ORDERS_SPREADSHEET_ID || null
  }

  /**
   * Get the configured sheet name
   */
  getSheetName(businessId?: string): string {
    if (businessId) {
      const config = this.sheetConfigs.get(businessId)
      if (config?.sheetName) return config.sheetName
    }
    return process.env.WHATSAPP_ORDERS_SHEET_NAME || 'Orders'
  }

  /**
   * Ensure the sheet has headers (only done once per spreadsheet)
   */
  private async ensureHeaders(spreadsheetId: string, sheetName: string): Promise<void> {
    if (this.initializedSheets.has(spreadsheetId)) return

    try {
      // Check if headers exist by reading the first row
      const readResult = await composioService.readSpreadsheet({
        spreadsheetId,
        range: `${sheetName}!A1:K1`,
      })

      // If we got data and it looks like headers, skip
      if (readResult.success && readResult.data) {
        const data = readResult.data as Record<string, unknown>
        const values = data?.values as unknown[][] | undefined
        if (values && values.length > 0 && values[0].length >= SHEET_HEADERS.length) {
          this.initializedSheets.add(spreadsheetId)
          console.log(`[OrderSheetSync] Headers already exist in ${spreadsheetId}`)
          return
        }
      }

      // Write headers
      const headerResult = await composioService.executeTool('GOOGLESHEETS_BATCH_UPDATE', {
        spreadsheet_id: spreadsheetId,
        sheet_name: sheetName,
        first_cell_location: 'A1',
        values: [SHEET_HEADERS],
      })

      if (headerResult.success) {
        this.initializedSheets.add(spreadsheetId)
        console.log(`[OrderSheetSync] Headers written to ${spreadsheetId}`)
      } else {
        console.warn(`[OrderSheetSync] Failed to write headers:`, headerResult.error)
      }
    } catch (error) {
      console.warn(`[OrderSheetSync] Error ensuring headers:`, error)
      // Don't block order sync if header check fails
    }
  }

  /**
   * Format order data as a sheet row
   */
  private orderToRow(order: Order): string[] {
    const itemsStr = order.items.map(i => i.name).join(', ')
    const quantityStr = order.items.map(i => `${i.quantity}`).join(', ')
    const dateStr = order.createdAt.toISOString().slice(0, 19).replace('T', ' ')

    return [
      order.orderId,
      dateStr,
      order.customerName,
      order.customerPhone,
      itemsStr,
      quantityStr,
      order.totalAmount != null ? String(order.totalAmount) : '',
      order.currency,
      order.deliveryAddress || '',
      STATUS_DISPLAY[order.status],
      order.notes || '',
    ]
  }

  /**
   * Sync an order to Google Sheets (append as new row)
   */
  async syncOrderToSheet(order: Order, businessId?: string): Promise<SheetSyncResult> {
    const spreadsheetId = this.getSpreadsheetId(businessId)

    if (!spreadsheetId) {
      console.warn('[OrderSheetSync] No spreadsheet ID configured - skipping sync')
      return {
        success: false,
        error: 'No spreadsheet ID configured. Set WHATSAPP_ORDERS_SPREADSHEET_ID env var or configure via API.',
      }
    }

    const sheetName = this.getSheetName(businessId)

    try {
      // Ensure headers exist
      await this.ensureHeaders(spreadsheetId, sheetName)

      // Convert order to row data
      const row = this.orderToRow(order)

      // Append row to sheet
      const result = await composioService.appendToSpreadsheet({
        spreadsheetId,
        range: `${sheetName}!A:K`,
        values: [row],
      })

      if (result.success) {
        // Track row number for future status updates
        const rowNumber = this.nextRowNumber++
        this.orderRowMap.set(order.orderId, rowNumber)

        console.log(`[OrderSheetSync] Order ${order.orderId} synced to row ${rowNumber}`)

        return {
          success: true,
          rowId: rowNumber,
          spreadsheetId,
        }
      } else {
        console.error(`[OrderSheetSync] Failed to sync order ${order.orderId}:`, result.error)
        return {
          success: false,
          error: result.error || 'Failed to append row to sheet',
          spreadsheetId,
        }
      }
    } catch (error) {
      console.error(`[OrderSheetSync] Error syncing order ${order.orderId}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        spreadsheetId,
      }
    }
  }

  /**
   * Update order status in the Google Sheet
   */
  async updateOrderStatusInSheet(
    orderId: string,
    newStatus: OrderStatus,
    businessId?: string
  ): Promise<SheetSyncResult> {
    const spreadsheetId = this.getSpreadsheetId(businessId)

    if (!spreadsheetId) {
      return {
        success: false,
        error: 'No spreadsheet ID configured',
      }
    }

    const sheetName = this.getSheetName(businessId)
    const rowNumber = this.orderRowMap.get(orderId)

    if (!rowNumber) {
      console.warn(`[OrderSheetSync] Row not found for order ${orderId} - searching sheet`)

      // Try to find the order by searching the sheet
      const found = await this.findOrderRow(orderId, spreadsheetId, sheetName)
      if (!found) {
        return {
          success: false,
          error: `Order ${orderId} not found in sheet`,
        }
      }
    }

    const targetRow = this.orderRowMap.get(orderId)
    if (!targetRow) {
      return {
        success: false,
        error: `Could not determine row for order ${orderId}`,
      }
    }

    try {
      // Update the Status column (column J = index 10)
      const result = await composioService.executeTool('GOOGLESHEETS_BATCH_UPDATE', {
        spreadsheet_id: spreadsheetId,
        sheet_name: sheetName,
        first_cell_location: `J${targetRow}`,
        values: [[STATUS_DISPLAY[newStatus]]],
      })

      if (result.success) {
        console.log(`[OrderSheetSync] Updated status for ${orderId} to ${newStatus} at row ${targetRow}`)
        return { success: true, rowId: targetRow, spreadsheetId }
      } else {
        return {
          success: false,
          error: result.error || 'Failed to update status in sheet',
          spreadsheetId,
        }
      }
    } catch (error) {
      console.error(`[OrderSheetSync] Error updating status for ${orderId}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        spreadsheetId,
      }
    }
  }

  /**
   * Search sheet for an order ID to find its row number
   */
  private async findOrderRow(
    orderId: string,
    spreadsheetId: string,
    sheetName: string
  ): Promise<boolean> {
    try {
      // Read column A (Order IDs) to find the row
      const result = await composioService.readSpreadsheet({
        spreadsheetId,
        range: `${sheetName}!A:A`,
      })

      if (result.success && result.data) {
        const data = result.data as Record<string, unknown>
        const values = data?.values as string[][] | undefined

        if (values) {
          for (let i = 0; i < values.length; i++) {
            if (values[i][0] === orderId) {
              const rowNumber = i + 1 // 1-indexed
              this.orderRowMap.set(orderId, rowNumber)
              console.log(`[OrderSheetSync] Found order ${orderId} at row ${rowNumber}`)
              return true
            }
          }
        }
      }

      return false
    } catch (error) {
      console.error(`[OrderSheetSync] Error searching for order ${orderId}:`, error)
      return false
    }
  }

  /**
   * Check if Google Sheets connection is available
   */
  async isSheetConnectionActive(): Promise<boolean> {
    try {
      const status = await composioService.checkConnection('googlesheets')
      return status.connected
    } catch {
      return false
    }
  }
}

// Singleton export
export const orderSheetSyncService = new OrderSheetSyncServiceClass()
export default orderSheetSyncService
