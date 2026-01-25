/**
 * Shopify Workflow Templates
 *
 * Pre-built workflow templates for common Shopify automation scenarios.
 * Users can install these with one click to automate their e-commerce operations.
 *
 * Categories:
 * - Order: Order notifications, fulfillment, high-value alerts, abandoned checkout
 * - Inventory: Low stock alerts, sync to sheets, out-of-stock handling
 * - Customer: Welcome sequences, VIP tagging, CRM sync
 * - Fulfillment: Shipping notifications, tracking updates
 *
 * @module ShopifyTemplates
 */

import type { WorkflowTrigger } from '../../../../services/NLWorkflowEngine'

// ============================================================================
// Types
// ============================================================================

export type ShopifyTemplateCategory = 'order' | 'inventory' | 'customer' | 'fulfillment'
export type ShopifyTemplateDifficulty = 'beginner' | 'intermediate' | 'advanced'

export interface ShopifyTemplateStep {
  id: string
  name: string
  description: string
  tool: string
  toolkit: string
  inputs: Record<string, unknown>
  dependsOn: string[]
  retryConfig?: {
    maxRetries: number
    retryDelayMs: number
  }
}

export interface ShopifyTemplate {
  id: string
  name: string
  description: string
  category: ShopifyTemplateCategory
  difficulty: ShopifyTemplateDifficulty
  trigger: WorkflowTrigger
  steps: ShopifyTemplateStep[]
  requiredConnections: string[]
  estimatedSavings: {
    hours: number
    perMonth: string
  }
  tags: string[]
  previewImageUrl?: string
}

// ============================================================================
// Order Templates (5 templates)
// ============================================================================

const ORDER_TEMPLATES: ShopifyTemplate[] = [
  // 1. New Order Notification
  {
    id: 'shopify-new-order-notification',
    name: 'New Order Notification',
    description: 'Get instant Slack and email notifications when you receive a new Shopify order. Never miss a sale again.',
    category: 'order',
    difficulty: 'beginner',
    trigger: {
      type: 'webhook',
      source: 'shopify',
      event: 'new_order',
      composioTool: 'SHOPIFY_NEW_ORDER_TRIGGER',
      config: {
        webhookTopics: ['orders/create'],
      },
    },
    steps: [
      {
        id: 'format-order-message',
        name: 'Format Order Details',
        description: 'Format order information into a readable message',
        tool: 'COMPOSIO_DATA_TRANSFORM',
        toolkit: 'nexus',
        inputs: {
          template: `New Order #{{order.order_number}}
Customer: {{order.customer.first_name}} {{order.customer.last_name}}
Email: {{order.email}}
Total: {{order.total_price}} {{order.currency}}
Items: {{order.line_items.length}}
{{#each order.line_items}}
  - {{this.title}} x {{this.quantity}} ({{this.price}})
{{/each}}`,
        },
        dependsOn: [],
      },
      {
        id: 'send-slack-notification',
        name: 'Send Slack Notification',
        description: 'Post order notification to Slack channel',
        tool: 'SLACK_SEND_MESSAGE',
        toolkit: 'slack',
        inputs: {
          channel: '{{config.slack_channel}}',
          text: '{{steps.format-order-message.output}}',
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: 'New Shopify Order',
              },
            },
            {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: '*Order:* #{{order.order_number}}' },
                { type: 'mrkdwn', text: '*Total:* {{order.total_price}} {{order.currency}}' },
              ],
            },
          ],
        },
        dependsOn: ['format-order-message'],
        retryConfig: { maxRetries: 3, retryDelayMs: 2000 },
      },
      {
        id: 'send-email-notification',
        name: 'Send Email Notification',
        description: 'Send order notification email to admin',
        tool: 'GMAIL_SEND_EMAIL',
        toolkit: 'gmail',
        inputs: {
          to: '{{config.admin_email}}',
          subject: 'New Order #{{order.order_number}} - {{order.total_price}} {{order.currency}}',
          body: '{{steps.format-order-message.output}}',
        },
        dependsOn: ['format-order-message'],
        retryConfig: { maxRetries: 2, retryDelayMs: 3000 },
      },
    ],
    requiredConnections: ['shopify', 'slack', 'gmail'],
    estimatedSavings: {
      hours: 5,
      perMonth: 'Save ~5 hours/month on manual order checking',
    },
    tags: ['notification', 'slack', 'email', 'real-time'],
  },

  // 2. Order Fulfillment Automation
  {
    id: 'shopify-order-fulfillment-automation',
    name: 'Order Fulfillment Automation',
    description: 'Automatically create fulfillments for paid orders and notify customers with tracking info.',
    category: 'order',
    difficulty: 'intermediate',
    trigger: {
      type: 'webhook',
      source: 'shopify',
      event: 'order_paid',
      composioTool: 'SHOPIFY_ORDER_PAID_TRIGGER',
      config: {
        webhookTopics: ['orders/paid'],
      },
    },
    steps: [
      {
        id: 'check-inventory',
        name: 'Verify Inventory',
        description: 'Check if all items are in stock before fulfillment',
        tool: 'SHOPIFY_GET_INVENTORY_LEVELS',
        toolkit: 'shopify',
        inputs: {
          inventory_item_ids: '{{order.line_items.map(item => item.variant_id)}}',
        },
        dependsOn: [],
      },
      {
        id: 'create-fulfillment',
        name: 'Create Fulfillment',
        description: 'Create fulfillment record in Shopify',
        tool: 'SHOPIFY_CREATE_FULFILLMENT',
        toolkit: 'shopify',
        inputs: {
          order_id: '{{order.id}}',
          location_id: '{{config.fulfillment_location_id}}',
          notify_customer: true,
          tracking_info: {
            company: '{{config.shipping_carrier}}',
            number: '{{steps.generate-tracking.output.tracking_number}}',
          },
        },
        dependsOn: ['check-inventory'],
        retryConfig: { maxRetries: 2, retryDelayMs: 5000 },
      },
      {
        id: 'send-customer-notification',
        name: 'Notify Customer',
        description: 'Send personalized shipping notification to customer',
        tool: 'GMAIL_SEND_EMAIL',
        toolkit: 'gmail',
        inputs: {
          to: '{{order.email}}',
          subject: 'Your order #{{order.order_number}} has shipped!',
          body: `Hi {{order.customer.first_name}},

Great news! Your order has been shipped and is on its way.

Order Details:
- Order Number: #{{order.order_number}}
- Tracking Number: {{steps.create-fulfillment.output.tracking_number}}
- Carrier: {{config.shipping_carrier}}

Track your package: {{steps.create-fulfillment.output.tracking_url}}

Thank you for shopping with us!

Best regards,
{{config.store_name}}`,
        },
        dependsOn: ['create-fulfillment'],
      },
      {
        id: 'log-to-sheets',
        name: 'Log Fulfillment',
        description: 'Record fulfillment in Google Sheets for tracking',
        tool: 'GOOGLESHEETS_APPEND_ROW',
        toolkit: 'googlesheets',
        inputs: {
          spreadsheet_id: '{{config.fulfillment_sheet_id}}',
          range: 'Fulfillments!A:F',
          values: [
            '{{order.order_number}}',
            '{{order.email}}',
            '{{steps.create-fulfillment.output.tracking_number}}',
            '{{config.shipping_carrier}}',
            '{{new Date().toISOString()}}',
            'Fulfilled',
          ],
        },
        dependsOn: ['create-fulfillment'],
      },
    ],
    requiredConnections: ['shopify', 'gmail', 'googlesheets'],
    estimatedSavings: {
      hours: 15,
      perMonth: 'Save ~15 hours/month on manual fulfillment',
    },
    tags: ['fulfillment', 'automation', 'shipping', 'customer-notification'],
  },

  // 3. High-Value Order Alert
  {
    id: 'shopify-high-value-order-alert',
    name: 'High-Value Order Alert',
    description: 'Get priority alerts for orders above a specified threshold. Create CRM tasks for VIP follow-up.',
    category: 'order',
    difficulty: 'intermediate',
    trigger: {
      type: 'webhook',
      source: 'shopify',
      event: 'new_order',
      composioTool: 'SHOPIFY_NEW_ORDER_TRIGGER',
      config: {
        webhookTopics: ['orders/create'],
      },
    },
    steps: [
      {
        id: 'check-order-value',
        name: 'Check Order Value',
        description: 'Evaluate if order meets high-value threshold',
        tool: 'COMPOSIO_CONDITION',
        toolkit: 'nexus',
        inputs: {
          condition: '{{parseFloat(order.total_price) >= config.high_value_threshold}}',
          onTrue: 'continue',
          onFalse: 'skip',
        },
        dependsOn: [],
      },
      {
        id: 'send-priority-slack',
        name: 'Send Priority Slack Alert',
        description: 'Send high-priority Slack notification to sales team',
        tool: 'SLACK_SEND_MESSAGE',
        toolkit: 'slack',
        inputs: {
          channel: '{{config.vip_channel}}',
          text: 'HIGH VALUE ORDER ALERT',
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: 'HIGH VALUE ORDER',
                emoji: true,
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Order #{{order.order_number}}* - *{{order.total_price}} {{order.currency}}*\n\nCustomer: {{order.customer.first_name}} {{order.customer.last_name}}\nEmail: {{order.email}}\nPhone: {{order.phone || 'Not provided'}}`,
              },
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: 'Threshold: {{config.high_value_threshold}} {{order.currency}}',
                },
              ],
            },
          ],
        },
        dependsOn: ['check-order-value'],
        retryConfig: { maxRetries: 3, retryDelayMs: 1000 },
      },
      {
        id: 'create-hubspot-task',
        name: 'Create CRM Follow-up Task',
        description: 'Create task in HubSpot for VIP customer follow-up',
        tool: 'HUBSPOT_CREATE_TASK',
        toolkit: 'hubspot',
        inputs: {
          subject: 'VIP Follow-up: Order #{{order.order_number}} - {{order.total_price}} {{order.currency}}',
          body: `High-value order requires personal follow-up.\n\nCustomer: {{order.customer.first_name}} {{order.customer.last_name}}\nEmail: {{order.email}}\nOrder Total: {{order.total_price}} {{order.currency}}`,
          due_date: '{{addDays(new Date(), 1).toISOString()}}',
          priority: 'HIGH',
          owner_id: '{{config.sales_rep_id}}',
        },
        dependsOn: ['check-order-value'],
      },
      {
        id: 'tag-customer-vip',
        name: 'Tag Customer as VIP',
        description: 'Add VIP tag to customer in Shopify',
        tool: 'SHOPIFY_UPDATE_CUSTOMER',
        toolkit: 'shopify',
        inputs: {
          customer_id: '{{order.customer.id}}',
          tags: '{{order.customer.tags}}, VIP, high-value-customer',
        },
        dependsOn: ['check-order-value'],
      },
    ],
    requiredConnections: ['shopify', 'slack', 'hubspot'],
    estimatedSavings: {
      hours: 8,
      perMonth: 'Save ~8 hours/month on VIP order tracking',
    },
    tags: ['vip', 'high-value', 'crm', 'priority', 'sales'],
  },

  // 4. Abandoned Checkout Recovery
  {
    id: 'shopify-abandoned-checkout-recovery',
    name: 'Abandoned Checkout Recovery',
    description: 'Automatically send personalized email sequences to recover abandoned checkouts and boost revenue.',
    category: 'order',
    difficulty: 'advanced',
    trigger: {
      type: 'webhook',
      source: 'shopify',
      event: 'checkout_abandoned',
      composioTool: 'SHOPIFY_CHECKOUT_ABANDONED_TRIGGER',
      config: {
        webhookTopics: ['checkouts/create'],
        delay_minutes: 60, // Wait 1 hour before triggering
      },
    },
    steps: [
      {
        id: 'check-not-completed',
        name: 'Verify Checkout Not Completed',
        description: 'Check if the checkout was eventually completed',
        tool: 'SHOPIFY_GET_CHECKOUT',
        toolkit: 'shopify',
        inputs: {
          checkout_id: '{{checkout.id}}',
        },
        dependsOn: [],
      },
      {
        id: 'prepare-recovery-email',
        name: 'Prepare Recovery Email',
        description: 'Generate personalized recovery email content',
        tool: 'COMPOSIO_AI_GENERATE',
        toolkit: 'nexus',
        inputs: {
          prompt: `Generate a friendly, personalized abandoned cart recovery email for {{checkout.email}}.

Cart items:
{{#each checkout.line_items}}
- {{this.title}} ({{this.quantity}}) - {{this.price}}
{{/each}}

Total: {{checkout.total_price}} {{checkout.currency}}

Include a compelling reason to complete the purchase and mention their items are reserved.`,
          tone: 'friendly and helpful',
          max_length: 500,
        },
        dependsOn: ['check-not-completed'],
      },
      {
        id: 'send-recovery-email-1',
        name: 'Send First Recovery Email',
        description: 'Send first abandoned cart recovery email',
        tool: 'GMAIL_SEND_EMAIL',
        toolkit: 'gmail',
        inputs: {
          to: '{{checkout.email}}',
          subject: 'Did you forget something? Your cart is waiting!',
          body: '{{steps.prepare-recovery-email.output}}',
          html: true,
        },
        dependsOn: ['prepare-recovery-email'],
        retryConfig: { maxRetries: 2, retryDelayMs: 5000 },
      },
      {
        id: 'log-recovery-attempt',
        name: 'Log Recovery Attempt',
        description: 'Track recovery email in Google Sheets',
        tool: 'GOOGLESHEETS_APPEND_ROW',
        toolkit: 'googlesheets',
        inputs: {
          spreadsheet_id: '{{config.recovery_sheet_id}}',
          range: 'Recovery!A:G',
          values: [
            '{{checkout.id}}',
            '{{checkout.email}}',
            '{{checkout.total_price}}',
            '{{checkout.currency}}',
            '{{new Date().toISOString()}}',
            'Email 1 Sent',
            '{{checkout.abandoned_checkout_url}}',
          ],
        },
        dependsOn: ['send-recovery-email-1'],
      },
      {
        id: 'schedule-followup',
        name: 'Schedule Follow-up Email',
        description: 'Schedule second recovery email for 24 hours later',
        tool: 'COMPOSIO_SCHEDULE_WORKFLOW',
        toolkit: 'nexus',
        inputs: {
          workflow_id: 'shopify-recovery-followup',
          delay_hours: 24,
          context: {
            checkout_id: '{{checkout.id}}',
            email: '{{checkout.email}}',
            cart_value: '{{checkout.total_price}}',
          },
        },
        dependsOn: ['log-recovery-attempt'],
      },
    ],
    requiredConnections: ['shopify', 'gmail', 'googlesheets'],
    estimatedSavings: {
      hours: 20,
      perMonth: 'Recover ~10-15% of abandoned carts, potentially thousands in revenue',
    },
    tags: ['recovery', 'email', 'revenue', 'automation', 'marketing'],
  },

  // 5. Order to Accounting
  {
    id: 'shopify-order-to-accounting',
    name: 'Order to Accounting Sync',
    description: 'Automatically create invoices in QuickBooks or Xero when orders are placed.',
    category: 'order',
    difficulty: 'intermediate',
    trigger: {
      type: 'webhook',
      source: 'shopify',
      event: 'order_paid',
      composioTool: 'SHOPIFY_ORDER_PAID_TRIGGER',
      config: {
        webhookTopics: ['orders/paid'],
      },
    },
    steps: [
      {
        id: 'find-or-create-customer',
        name: 'Find/Create Customer in QuickBooks',
        description: 'Find existing customer or create new one in QuickBooks',
        tool: 'QUICKBOOKS_FIND_OR_CREATE_CUSTOMER',
        toolkit: 'quickbooks',
        inputs: {
          email: '{{order.email}}',
          display_name: '{{order.customer.first_name}} {{order.customer.last_name}}',
          given_name: '{{order.customer.first_name}}',
          family_name: '{{order.customer.last_name}}',
          primary_email: '{{order.email}}',
          billing_address: {
            line1: '{{order.billing_address.address1}}',
            city: '{{order.billing_address.city}}',
            country: '{{order.billing_address.country}}',
            postal_code: '{{order.billing_address.zip}}',
          },
        },
        dependsOn: [],
      },
      {
        id: 'create-invoice',
        name: 'Create Invoice',
        description: 'Create invoice in QuickBooks with line items',
        tool: 'QUICKBOOKS_CREATE_INVOICE',
        toolkit: 'quickbooks',
        inputs: {
          customer_id: '{{steps.find-or-create-customer.output.customer_id}}',
          invoice_date: '{{order.created_at}}',
          due_date: '{{order.created_at}}', // Paid orders
          line_items: '{{order.line_items.map(item => ({ description: item.title, quantity: item.quantity, unit_price: item.price, item_ref: item.sku }))}}',
          shipping_amount: '{{order.total_shipping_price_set.shop_money.amount}}',
          tax_amount: '{{order.total_tax}}',
          memo: 'Shopify Order #{{order.order_number}}',
          external_ref: '{{order.order_number}}',
        },
        dependsOn: ['find-or-create-customer'],
        retryConfig: { maxRetries: 3, retryDelayMs: 5000 },
      },
      {
        id: 'record-payment',
        name: 'Record Payment',
        description: 'Record payment against the invoice',
        tool: 'QUICKBOOKS_RECEIVE_PAYMENT',
        toolkit: 'quickbooks',
        inputs: {
          customer_id: '{{steps.find-or-create-customer.output.customer_id}}',
          invoice_id: '{{steps.create-invoice.output.invoice_id}}',
          amount: '{{order.total_price}}',
          payment_date: '{{order.created_at}}',
          payment_method: '{{order.gateway}}',
          memo: 'Shopify payment for Order #{{order.order_number}}',
        },
        dependsOn: ['create-invoice'],
      },
      {
        id: 'send-confirmation',
        name: 'Send Confirmation',
        description: 'Notify finance team of new invoice',
        tool: 'SLACK_SEND_MESSAGE',
        toolkit: 'slack',
        inputs: {
          channel: '{{config.finance_channel}}',
          text: 'Invoice created for Shopify Order #{{order.order_number}} - {{order.total_price}} {{order.currency}}',
        },
        dependsOn: ['record-payment'],
      },
    ],
    requiredConnections: ['shopify', 'quickbooks', 'slack'],
    estimatedSavings: {
      hours: 25,
      perMonth: 'Save ~25 hours/month on manual invoice creation',
    },
    tags: ['accounting', 'quickbooks', 'xero', 'invoice', 'finance'],
  },
]

// ============================================================================
// Inventory Templates (3 templates)
// ============================================================================

const INVENTORY_TEMPLATES: ShopifyTemplate[] = [
  // 1. Low Stock Alert
  {
    id: 'shopify-low-stock-alert',
    name: 'Low Stock Alert',
    description: 'Get notified when inventory drops below threshold. Automatically send reorder requests to suppliers.',
    category: 'inventory',
    difficulty: 'beginner',
    trigger: {
      type: 'webhook',
      source: 'shopify',
      event: 'inventory_level_update',
      composioTool: 'SHOPIFY_INVENTORY_LEVEL_UPDATE_TRIGGER',
      config: {
        webhookTopics: ['inventory_levels/update'],
      },
    },
    steps: [
      {
        id: 'check-threshold',
        name: 'Check Low Stock Threshold',
        description: 'Determine if inventory is below threshold',
        tool: 'COMPOSIO_CONDITION',
        toolkit: 'nexus',
        inputs: {
          condition: '{{inventory_level.available <= config.low_stock_threshold}}',
          onTrue: 'continue',
          onFalse: 'skip',
        },
        dependsOn: [],
      },
      {
        id: 'get-product-details',
        name: 'Get Product Details',
        description: 'Fetch product information for the low stock item',
        tool: 'SHOPIFY_GET_PRODUCT',
        toolkit: 'shopify',
        inputs: {
          product_id: '{{inventory_level.inventory_item_id}}',
        },
        dependsOn: ['check-threshold'],
      },
      {
        id: 'send-slack-alert',
        name: 'Send Slack Alert',
        description: 'Alert inventory team via Slack',
        tool: 'SLACK_SEND_MESSAGE',
        toolkit: 'slack',
        inputs: {
          channel: '{{config.inventory_channel}}',
          text: 'Low Stock Alert',
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: 'Low Stock Warning',
              },
            },
            {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: '*Product:* {{steps.get-product-details.output.title}}' },
                { type: 'mrkdwn', text: '*SKU:* {{steps.get-product-details.output.variants[0].sku}}' },
                { type: 'mrkdwn', text: '*Current Stock:* {{inventory_level.available}}' },
                { type: 'mrkdwn', text: '*Threshold:* {{config.low_stock_threshold}}' },
              ],
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: { type: 'plain_text', text: 'View in Shopify' },
                  url: '{{steps.get-product-details.output.admin_url}}',
                },
              ],
            },
          ],
        },
        dependsOn: ['get-product-details'],
        retryConfig: { maxRetries: 2, retryDelayMs: 2000 },
      },
      {
        id: 'send-reorder-email',
        name: 'Send Reorder Email to Supplier',
        description: 'Email supplier with reorder request',
        tool: 'GMAIL_SEND_EMAIL',
        toolkit: 'gmail',
        inputs: {
          to: '{{config.supplier_email}}',
          subject: 'Reorder Request: {{steps.get-product-details.output.title}} - SKU {{steps.get-product-details.output.variants[0].sku}}',
          body: `Dear Supplier,

We need to reorder the following item:

Product: {{steps.get-product-details.output.title}}
SKU: {{steps.get-product-details.output.variants[0].sku}}
Current Stock: {{inventory_level.available}}
Suggested Order Quantity: {{config.reorder_quantity}}

Please confirm availability and estimated delivery date.

Best regards,
{{config.store_name}}`,
        },
        dependsOn: ['get-product-details'],
      },
      {
        id: 'log-to-sheets',
        name: 'Log Low Stock Event',
        description: 'Record low stock event in tracking sheet',
        tool: 'GOOGLESHEETS_APPEND_ROW',
        toolkit: 'googlesheets',
        inputs: {
          spreadsheet_id: '{{config.inventory_sheet_id}}',
          range: 'LowStock!A:F',
          values: [
            '{{new Date().toISOString()}}',
            '{{steps.get-product-details.output.title}}',
            '{{steps.get-product-details.output.variants[0].sku}}',
            '{{inventory_level.available}}',
            '{{config.low_stock_threshold}}',
            'Alert Sent',
          ],
        },
        dependsOn: ['send-slack-alert'],
      },
    ],
    requiredConnections: ['shopify', 'slack', 'gmail', 'googlesheets'],
    estimatedSavings: {
      hours: 10,
      perMonth: 'Prevent stockouts and save ~10 hours/month on inventory monitoring',
    },
    tags: ['inventory', 'alert', 'reorder', 'supplier'],
  },

  // 2. Inventory Sync to Sheet
  {
    id: 'shopify-inventory-sync-sheets',
    name: 'Daily Inventory Sync to Sheets',
    description: 'Automatically sync your entire inventory to Google Sheets daily for reporting and analysis.',
    category: 'inventory',
    difficulty: 'beginner',
    trigger: {
      type: 'schedule',
      source: 'scheduler',
      event: 'daily',
      config: {
        cron: '0 6 * * *', // Every day at 6 AM
        timezone: '{{config.timezone}}',
      },
    },
    steps: [
      {
        id: 'fetch-all-products',
        name: 'Fetch All Products',
        description: 'Get all products with inventory from Shopify',
        tool: 'SHOPIFY_LIST_PRODUCTS',
        toolkit: 'shopify',
        inputs: {
          limit: 250,
          status: 'active',
          fields: 'id,title,variants,inventory_quantity',
        },
        dependsOn: [],
      },
      {
        id: 'transform-inventory-data',
        name: 'Transform Inventory Data',
        description: 'Format inventory data for spreadsheet',
        tool: 'COMPOSIO_DATA_TRANSFORM',
        toolkit: 'nexus',
        inputs: {
          data: '{{steps.fetch-all-products.output.products}}',
          transformation: `products.flatMap(p => p.variants.map(v => [
            new Date().toISOString().split('T')[0],
            p.title,
            v.sku || 'N/A',
            v.title,
            v.inventory_quantity,
            v.price,
            v.inventory_quantity * parseFloat(v.price),
            v.inventory_quantity <= ${('{{config.low_stock_threshold}}')} ? 'LOW' : 'OK'
          ]))`,
        },
        dependsOn: ['fetch-all-products'],
      },
      {
        id: 'clear-existing-data',
        name: 'Clear Previous Data',
        description: 'Clear the current inventory sheet before updating',
        tool: 'GOOGLESHEETS_CLEAR_RANGE',
        toolkit: 'googlesheets',
        inputs: {
          spreadsheet_id: '{{config.inventory_sheet_id}}',
          range: 'DailyInventory!A2:H',
        },
        dependsOn: [],
      },
      {
        id: 'update-inventory-sheet',
        name: 'Update Inventory Sheet',
        description: 'Write inventory data to Google Sheets',
        tool: 'GOOGLESHEETS_BATCH_UPDATE',
        toolkit: 'googlesheets',
        inputs: {
          spreadsheet_id: '{{config.inventory_sheet_id}}',
          range: 'DailyInventory!A2',
          values: '{{steps.transform-inventory-data.output}}',
        },
        dependsOn: ['transform-inventory-data', 'clear-existing-data'],
        retryConfig: { maxRetries: 3, retryDelayMs: 5000 },
      },
      {
        id: 'send-summary',
        name: 'Send Daily Summary',
        description: 'Send inventory summary to Slack',
        tool: 'SLACK_SEND_MESSAGE',
        toolkit: 'slack',
        inputs: {
          channel: '{{config.inventory_channel}}',
          text: `Daily Inventory Report - ${new Date().toLocaleDateString()}

Total Products: {{steps.fetch-all-products.output.products.length}}
Low Stock Items: {{steps.transform-inventory-data.output.filter(row => row[7] === 'LOW').length}}
Total Inventory Value: \${{steps.transform-inventory-data.output.reduce((sum, row) => sum + row[6], 0).toFixed(2)}}

View full report: {{config.sheet_url}}`,
        },
        dependsOn: ['update-inventory-sheet'],
      },
    ],
    requiredConnections: ['shopify', 'googlesheets', 'slack'],
    estimatedSavings: {
      hours: 8,
      perMonth: 'Save ~8 hours/month on manual inventory reporting',
    },
    tags: ['inventory', 'reporting', 'google-sheets', 'daily', 'sync'],
  },

  // 3. Out-of-Stock Product Hide
  {
    id: 'shopify-out-of-stock-hide',
    name: 'Auto-Hide Out-of-Stock Products',
    description: 'Automatically hide products when they go out of stock and restore them when restocked.',
    category: 'inventory',
    difficulty: 'intermediate',
    trigger: {
      type: 'webhook',
      source: 'shopify',
      event: 'inventory_level_update',
      composioTool: 'SHOPIFY_INVENTORY_LEVEL_UPDATE_TRIGGER',
      config: {
        webhookTopics: ['inventory_levels/update'],
      },
    },
    steps: [
      {
        id: 'get-variant-info',
        name: 'Get Variant Information',
        description: 'Get full product and variant details',
        tool: 'SHOPIFY_GET_VARIANT',
        toolkit: 'shopify',
        inputs: {
          variant_id: '{{inventory_level.inventory_item_id}}',
        },
        dependsOn: [],
      },
      {
        id: 'check-if-all-variants-out',
        name: 'Check All Variants Stock',
        description: 'Check if all variants of the product are out of stock',
        tool: 'SHOPIFY_GET_PRODUCT_VARIANTS',
        toolkit: 'shopify',
        inputs: {
          product_id: '{{steps.get-variant-info.output.product_id}}',
        },
        dependsOn: ['get-variant-info'],
      },
      {
        id: 'evaluate-stock-status',
        name: 'Evaluate Stock Status',
        description: 'Determine if product should be hidden or shown',
        tool: 'COMPOSIO_DATA_TRANSFORM',
        toolkit: 'nexus',
        inputs: {
          calculation: `{
            totalStock: variants.reduce((sum, v) => sum + v.inventory_quantity, 0),
            shouldHide: variants.every(v => v.inventory_quantity <= 0),
            action: variants.every(v => v.inventory_quantity <= 0) ? 'hide' : (inventory_level.available > 0 ? 'show' : 'no-change')
          }`,
        },
        dependsOn: ['check-if-all-variants-out'],
      },
      {
        id: 'update-product-status',
        name: 'Update Product Status',
        description: 'Hide or show product based on stock status',
        tool: 'SHOPIFY_UPDATE_PRODUCT',
        toolkit: 'shopify',
        inputs: {
          product_id: '{{steps.get-variant-info.output.product_id}}',
          status: '{{steps.evaluate-stock-status.output.shouldHide ? "draft" : "active"}}',
        },
        dependsOn: ['evaluate-stock-status'],
      },
      {
        id: 'notify-team',
        name: 'Notify Team',
        description: 'Alert team about product status change',
        tool: 'SLACK_SEND_MESSAGE',
        toolkit: 'slack',
        inputs: {
          channel: '{{config.inventory_channel}}',
          text: `Product {{steps.evaluate-stock-status.output.action === 'hide' ? 'HIDDEN' : 'RESTORED'}}: {{steps.get-variant-info.output.product_title}}

Current Stock: {{steps.evaluate-stock-status.output.totalStock}} units
Action: {{steps.evaluate-stock-status.output.action}}`,
        },
        dependsOn: ['update-product-status'],
      },
      {
        id: 'log-status-change',
        name: 'Log Status Change',
        description: 'Record status change in tracking sheet',
        tool: 'GOOGLESHEETS_APPEND_ROW',
        toolkit: 'googlesheets',
        inputs: {
          spreadsheet_id: '{{config.inventory_sheet_id}}',
          range: 'StatusChanges!A:E',
          values: [
            '{{new Date().toISOString()}}',
            '{{steps.get-variant-info.output.product_title}}',
            '{{steps.evaluate-stock-status.output.action}}',
            '{{steps.evaluate-stock-status.output.totalStock}}',
            '{{steps.evaluate-stock-status.output.shouldHide ? "Draft" : "Active"}}',
          ],
        },
        dependsOn: ['update-product-status'],
      },
    ],
    requiredConnections: ['shopify', 'slack', 'googlesheets'],
    estimatedSavings: {
      hours: 12,
      perMonth: 'Prevent customer frustration and save ~12 hours/month',
    },
    tags: ['inventory', 'automation', 'product-status', 'out-of-stock'],
  },
]

// ============================================================================
// Customer Templates (3 templates)
// ============================================================================

const CUSTOMER_TEMPLATES: ShopifyTemplate[] = [
  // 1. New Customer Welcome
  {
    id: 'shopify-new-customer-welcome',
    name: 'New Customer Welcome Sequence',
    description: 'Automatically send personalized welcome emails to new customers with discount codes and product recommendations.',
    category: 'customer',
    difficulty: 'beginner',
    trigger: {
      type: 'webhook',
      source: 'shopify',
      event: 'customer_created',
      composioTool: 'SHOPIFY_CUSTOMER_CREATED_TRIGGER',
      config: {
        webhookTopics: ['customers/create'],
      },
    },
    steps: [
      {
        id: 'create-welcome-discount',
        name: 'Create Welcome Discount',
        description: 'Generate unique discount code for new customer',
        tool: 'SHOPIFY_CREATE_DISCOUNT_CODE',
        toolkit: 'shopify',
        inputs: {
          code: 'WELCOME{{customer.id}}',
          discount_type: 'percentage',
          value: '{{config.welcome_discount_percent}}',
          usage_limit: 1,
          expires_at: '{{addDays(new Date(), 30).toISOString()}}',
        },
        dependsOn: [],
      },
      {
        id: 'get-popular-products',
        name: 'Get Popular Products',
        description: 'Fetch popular products for recommendations',
        tool: 'SHOPIFY_LIST_PRODUCTS',
        toolkit: 'shopify',
        inputs: {
          limit: 4,
          sort_key: 'BEST_SELLING',
          status: 'active',
        },
        dependsOn: [],
      },
      {
        id: 'send-welcome-email',
        name: 'Send Welcome Email',
        description: 'Send personalized welcome email',
        tool: 'GMAIL_SEND_EMAIL',
        toolkit: 'gmail',
        inputs: {
          to: '{{customer.email}}',
          subject: 'Welcome to {{config.store_name}}! Here\'s {{config.welcome_discount_percent}}% off your first order',
          body: `Hi {{customer.first_name}},

Welcome to {{config.store_name}}! We're thrilled to have you join our community.

As a special welcome gift, here's your exclusive discount code:

WELCOME{{customer.id}} - {{config.welcome_discount_percent}}% OFF

This code is valid for 30 days on your first purchase.

Here are some of our bestsellers you might love:
{{#each steps.get-popular-products.output.products}}
- {{this.title}} - {{this.variants[0].price}}
{{/each}}

Happy shopping!

{{config.store_name}}`,
        },
        dependsOn: ['create-welcome-discount', 'get-popular-products'],
        retryConfig: { maxRetries: 2, retryDelayMs: 3000 },
      },
      {
        id: 'tag-customer',
        name: 'Tag New Customer',
        description: 'Add tags to customer for segmentation',
        tool: 'SHOPIFY_UPDATE_CUSTOMER',
        toolkit: 'shopify',
        inputs: {
          customer_id: '{{customer.id}}',
          tags: 'new-customer, welcome-email-sent, {{new Date().getFullYear()}}-signup',
        },
        dependsOn: [],
      },
      {
        id: 'log-welcome-sent',
        name: 'Log Welcome Email',
        description: 'Track welcome email in Google Sheets',
        tool: 'GOOGLESHEETS_APPEND_ROW',
        toolkit: 'googlesheets',
        inputs: {
          spreadsheet_id: '{{config.customer_sheet_id}}',
          range: 'WelcomeEmails!A:E',
          values: [
            '{{new Date().toISOString()}}',
            '{{customer.email}}',
            '{{customer.first_name}} {{customer.last_name}}',
            'WELCOME{{customer.id}}',
            'Sent',
          ],
        },
        dependsOn: ['send-welcome-email'],
      },
    ],
    requiredConnections: ['shopify', 'gmail', 'googlesheets'],
    estimatedSavings: {
      hours: 6,
      perMonth: 'Boost first purchases by 15-25% with automated welcome sequence',
    },
    tags: ['customer', 'welcome', 'email', 'discount', 'onboarding'],
  },

  // 2. VIP Customer Tagging
  {
    id: 'shopify-vip-customer-tagging',
    name: 'VIP Customer Auto-Tagging',
    description: 'Automatically identify and tag VIP customers based on total spending thresholds.',
    category: 'customer',
    difficulty: 'intermediate',
    trigger: {
      type: 'webhook',
      source: 'shopify',
      event: 'order_paid',
      composioTool: 'SHOPIFY_ORDER_PAID_TRIGGER',
      config: {
        webhookTopics: ['orders/paid'],
      },
    },
    steps: [
      {
        id: 'get-customer-orders',
        name: 'Get Customer Order History',
        description: 'Fetch all orders for this customer',
        tool: 'SHOPIFY_LIST_CUSTOMER_ORDERS',
        toolkit: 'shopify',
        inputs: {
          customer_id: '{{order.customer.id}}',
          status: 'any',
          financial_status: 'paid',
        },
        dependsOn: [],
      },
      {
        id: 'calculate-total-spent',
        name: 'Calculate Total Spent',
        description: 'Sum up all customer spending',
        tool: 'COMPOSIO_DATA_TRANSFORM',
        toolkit: 'nexus',
        inputs: {
          calculation: `{
            totalSpent: orders.reduce((sum, o) => sum + parseFloat(o.total_price), 0),
            orderCount: orders.length,
            avgOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + parseFloat(o.total_price), 0) / orders.length : 0,
            tier: this.totalSpent >= ${('{{config.vip_gold_threshold}}')} ? 'VIP-Gold' :
                  this.totalSpent >= ${('{{config.vip_silver_threshold}}')} ? 'VIP-Silver' :
                  this.totalSpent >= ${('{{config.vip_bronze_threshold}}')} ? 'VIP-Bronze' : 'Regular'
          }`,
        },
        dependsOn: ['get-customer-orders'],
      },
      {
        id: 'check-vip-status',
        name: 'Check VIP Qualification',
        description: 'Determine if customer qualifies for VIP status',
        tool: 'COMPOSIO_CONDITION',
        toolkit: 'nexus',
        inputs: {
          condition: '{{steps.calculate-total-spent.output.totalSpent >= config.vip_bronze_threshold}}',
          onTrue: 'continue',
          onFalse: 'skip',
        },
        dependsOn: ['calculate-total-spent'],
      },
      {
        id: 'update-customer-tags',
        name: 'Update Customer Tags',
        description: 'Add VIP tier tag to customer',
        tool: 'SHOPIFY_UPDATE_CUSTOMER',
        toolkit: 'shopify',
        inputs: {
          customer_id: '{{order.customer.id}}',
          tags: '{{order.customer.tags}}, {{steps.calculate-total-spent.output.tier}}, lifetime-value-{{Math.round(steps.calculate-total-spent.output.totalSpent)}}',
          note: 'VIP Status: {{steps.calculate-total-spent.output.tier}} | Total Spent: {{steps.calculate-total-spent.output.totalSpent}} | Orders: {{steps.calculate-total-spent.output.orderCount}}',
        },
        dependsOn: ['check-vip-status'],
      },
      {
        id: 'notify-vip-upgrade',
        name: 'Notify Sales Team',
        description: 'Alert sales team about new VIP customer',
        tool: 'SLACK_SEND_MESSAGE',
        toolkit: 'slack',
        inputs: {
          channel: '{{config.sales_channel}}',
          text: 'New VIP Customer!',
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: 'Customer Upgraded to {{steps.calculate-total-spent.output.tier}}',
              },
            },
            {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: '*Customer:* {{order.customer.first_name}} {{order.customer.last_name}}' },
                { type: 'mrkdwn', text: '*Email:* {{order.customer.email}}' },
                { type: 'mrkdwn', text: '*Total Spent:* {{steps.calculate-total-spent.output.totalSpent}} {{order.currency}}' },
                { type: 'mrkdwn', text: '*Order Count:* {{steps.calculate-total-spent.output.orderCount}}' },
              ],
            },
          ],
        },
        dependsOn: ['update-customer-tags'],
      },
      {
        id: 'send-vip-email',
        name: 'Send VIP Welcome Email',
        description: 'Send special VIP welcome email to customer',
        tool: 'GMAIL_SEND_EMAIL',
        toolkit: 'gmail',
        inputs: {
          to: '{{order.customer.email}}',
          subject: 'You\'re now a {{steps.calculate-total-spent.output.tier}} member!',
          body: `Dear {{order.customer.first_name}},

Congratulations! You've been upgraded to {{steps.calculate-total-spent.output.tier}} status at {{config.store_name}}!

As a valued VIP member, you'll enjoy:
- Early access to new products
- Exclusive VIP-only discounts
- Priority customer support
- Special birthday rewards

Thank you for being such a loyal customer. Your total lifetime value with us is now {{steps.calculate-total-spent.output.totalSpent}} {{order.currency}}.

We truly appreciate your continued support!

Best regards,
{{config.store_name}} VIP Team`,
        },
        dependsOn: ['update-customer-tags'],
      },
    ],
    requiredConnections: ['shopify', 'slack', 'gmail'],
    estimatedSavings: {
      hours: 10,
      perMonth: 'Increase VIP retention by 20-30% with automated recognition',
    },
    tags: ['customer', 'vip', 'loyalty', 'tagging', 'segmentation'],
  },

  // 3. Customer to CRM Sync
  {
    id: 'shopify-customer-crm-sync',
    name: 'Customer to CRM Sync',
    description: 'Automatically sync new Shopify customers to HubSpot or Pipedrive CRM.',
    category: 'customer',
    difficulty: 'intermediate',
    trigger: {
      type: 'webhook',
      source: 'shopify',
      event: 'customer_created',
      composioTool: 'SHOPIFY_CUSTOMER_CREATED_TRIGGER',
      config: {
        webhookTopics: ['customers/create'],
      },
    },
    steps: [
      {
        id: 'check-existing-contact',
        name: 'Check Existing Contact',
        description: 'Search for existing contact in HubSpot',
        tool: 'HUBSPOT_SEARCH_CONTACTS',
        toolkit: 'hubspot',
        inputs: {
          email: '{{customer.email}}',
        },
        dependsOn: [],
      },
      {
        id: 'determine-action',
        name: 'Determine Action',
        description: 'Decide whether to create or update contact',
        tool: 'COMPOSIO_CONDITION',
        toolkit: 'nexus',
        inputs: {
          condition: '{{steps.check-existing-contact.output.results.length === 0}}',
          onTrue: 'create',
          onFalse: 'update',
        },
        dependsOn: ['check-existing-contact'],
      },
      {
        id: 'create-hubspot-contact',
        name: 'Create HubSpot Contact',
        description: 'Create new contact in HubSpot',
        tool: 'HUBSPOT_CREATE_CONTACT',
        toolkit: 'hubspot',
        inputs: {
          email: '{{customer.email}}',
          firstname: '{{customer.first_name}}',
          lastname: '{{customer.last_name}}',
          phone: '{{customer.phone}}',
          address: '{{customer.default_address.address1}}',
          city: '{{customer.default_address.city}}',
          state: '{{customer.default_address.province}}',
          zip: '{{customer.default_address.zip}}',
          country: '{{customer.default_address.country}}',
          company: '{{customer.default_address.company}}',
          lifecyclestage: 'customer',
          hs_lead_status: 'NEW',
          shopify_customer_id: '{{customer.id}}',
          source: 'Shopify',
        },
        dependsOn: ['determine-action'],
        retryConfig: { maxRetries: 2, retryDelayMs: 3000 },
      },
      {
        id: 'update-hubspot-contact',
        name: 'Update HubSpot Contact',
        description: 'Update existing contact with Shopify data',
        tool: 'HUBSPOT_UPDATE_CONTACT',
        toolkit: 'hubspot',
        inputs: {
          contact_id: '{{steps.check-existing-contact.output.results[0].id}}',
          properties: {
            phone: '{{customer.phone}}',
            address: '{{customer.default_address.address1}}',
            lifecyclestage: 'customer',
            shopify_customer_id: '{{customer.id}}',
          },
        },
        dependsOn: ['determine-action'],
      },
      {
        id: 'add-to-list',
        name: 'Add to Shopify Customers List',
        description: 'Add contact to Shopify customers list in HubSpot',
        tool: 'HUBSPOT_ADD_CONTACT_TO_LIST',
        toolkit: 'hubspot',
        inputs: {
          list_id: '{{config.shopify_customers_list_id}}',
          contact_id: '{{steps.create-hubspot-contact.output.id || steps.check-existing-contact.output.results[0].id}}',
        },
        dependsOn: ['create-hubspot-contact', 'update-hubspot-contact'],
      },
      {
        id: 'log-sync',
        name: 'Log CRM Sync',
        description: 'Record sync in Google Sheets',
        tool: 'GOOGLESHEETS_APPEND_ROW',
        toolkit: 'googlesheets',
        inputs: {
          spreadsheet_id: '{{config.crm_sync_sheet_id}}',
          range: 'CRMSync!A:E',
          values: [
            '{{new Date().toISOString()}}',
            '{{customer.email}}',
            '{{customer.id}}',
            '{{steps.create-hubspot-contact.output.id || steps.check-existing-contact.output.results[0].id}}',
            '{{steps.determine-action.output === "create" ? "Created" : "Updated"}}',
          ],
        },
        dependsOn: ['add-to-list'],
      },
    ],
    requiredConnections: ['shopify', 'hubspot', 'googlesheets'],
    estimatedSavings: {
      hours: 15,
      perMonth: 'Save ~15 hours/month on manual CRM data entry',
    },
    tags: ['customer', 'crm', 'hubspot', 'pipedrive', 'sync'],
  },
]

// ============================================================================
// Combined Templates Array
// ============================================================================

const ALL_SHOPIFY_TEMPLATES: ShopifyTemplate[] = [
  ...ORDER_TEMPLATES,
  ...INVENTORY_TEMPLATES,
  ...CUSTOMER_TEMPLATES,
]

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Get all Shopify workflow templates
 */
export function getShopifyTemplates(): ShopifyTemplate[] {
  return ALL_SHOPIFY_TEMPLATES
}

/**
 * Get templates filtered by category
 */
export function getTemplatesByCategory(category: ShopifyTemplateCategory): ShopifyTemplate[] {
  return ALL_SHOPIFY_TEMPLATES.filter(template => template.category === category)
}

/**
 * Get a single template by ID
 */
export function getTemplateById(id: string): ShopifyTemplate | undefined {
  return ALL_SHOPIFY_TEMPLATES.find(template => template.id === id)
}

/**
 * Get templates filtered by difficulty level
 */
export function getTemplatesByDifficulty(difficulty: ShopifyTemplateDifficulty): ShopifyTemplate[] {
  return ALL_SHOPIFY_TEMPLATES.filter(template => template.difficulty === difficulty)
}

/**
 * Get templates that match specific tags
 */
export function getTemplatesByTags(tags: string[]): ShopifyTemplate[] {
  return ALL_SHOPIFY_TEMPLATES.filter(template =>
    tags.some(tag => template.tags.includes(tag.toLowerCase()))
  )
}

/**
 * Search templates by name or description
 */
export function searchTemplates(query: string): ShopifyTemplate[] {
  const lowerQuery = query.toLowerCase()
  return ALL_SHOPIFY_TEMPLATES.filter(template =>
    template.name.toLowerCase().includes(lowerQuery) ||
    template.description.toLowerCase().includes(lowerQuery) ||
    template.tags.some(tag => tag.includes(lowerQuery))
  )
}

/**
 * Get template count by category
 */
export function getTemplateCounts(): Record<ShopifyTemplateCategory, number> {
  return {
    order: ORDER_TEMPLATES.length,
    inventory: INVENTORY_TEMPLATES.length,
    customer: CUSTOMER_TEMPLATES.length,
    fulfillment: ALL_SHOPIFY_TEMPLATES.filter(t => t.category === 'fulfillment').length,
  }
}

/**
 * Get all unique required connections across templates
 */
export function getAllRequiredConnections(): string[] {
  const connections = new Set<string>()
  ALL_SHOPIFY_TEMPLATES.forEach(template => {
    template.requiredConnections.forEach(conn => connections.add(conn))
  })
  return Array.from(connections).sort()
}

/**
 * Get total estimated hours saved per month across all templates
 */
export function getTotalEstimatedSavings(): { hours: number; description: string } {
  const totalHours = ALL_SHOPIFY_TEMPLATES.reduce(
    (sum, template) => sum + template.estimatedSavings.hours,
    0
  )
  return {
    hours: totalHours,
    description: `Save approximately ${totalHours} hours per month with all Shopify automations`,
  }
}

// Default export for convenience
export default {
  getShopifyTemplates,
  getTemplatesByCategory,
  getTemplateById,
  getTemplatesByDifficulty,
  getTemplatesByTags,
  searchTemplates,
  getTemplateCounts,
  getAllRequiredConnections,
  getTotalEstimatedSavings,
}
