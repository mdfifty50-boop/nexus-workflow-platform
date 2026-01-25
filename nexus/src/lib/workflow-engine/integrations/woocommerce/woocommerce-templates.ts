/**
 * WooCommerce Workflow Templates
 *
 * Pre-built workflow templates for common WooCommerce automation scenarios.
 * Users can install these with one click to automate their WordPress e-commerce operations.
 *
 * Categories:
 * - Order: Order notifications, fulfillment, high-value alerts, abandoned cart recovery
 * - Inventory: Low stock alerts, sync to sheets, out-of-stock handling
 * - Customer: Welcome sequences, VIP tagging, CRM sync
 * - Fulfillment: Shipping notifications, tracking updates
 *
 * @module WooCommerceTemplates
 */

import type { WorkflowTrigger } from '../../../../services/NLWorkflowEngine'

// ============================================================================
// Types
// ============================================================================

export type WooCommerceTemplateCategory = 'order' | 'inventory' | 'customer' | 'fulfillment'
export type WooCommerceTemplateDifficulty = 'beginner' | 'intermediate' | 'advanced'

export interface WooCommerceTemplateStep {
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

export interface WooCommerceTemplate {
  id: string
  name: string
  description: string
  category: WooCommerceTemplateCategory
  difficulty: WooCommerceTemplateDifficulty
  trigger: WorkflowTrigger
  steps: WooCommerceTemplateStep[]
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

const ORDER_TEMPLATES: WooCommerceTemplate[] = [
  // 1. New Order Slack/Email Notification
  {
    id: 'woocommerce-new-order-notification',
    name: 'New Order Notification',
    description: 'Get instant Slack and email notifications when you receive a new WooCommerce order. Never miss a sale from your WordPress store.',
    category: 'order',
    difficulty: 'beginner',
    trigger: {
      type: 'webhook',
      source: 'woocommerce',
      event: 'new_order',
      composioTool: 'WOOCOMMERCE_ORDER_CREATED_TRIGGER',
      config: {
        webhookTopics: ['order.created'],
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
          template: `New WooCommerce Order #{{order.number}}
Customer: {{order.billing.first_name}} {{order.billing.last_name}}
Email: {{order.billing.email}}
Total: {{order.total}} {{order.currency}}
Payment Method: {{order.payment_method_title}}
Items: {{order.line_items.length}}
{{#each order.line_items}}
  - {{this.name}} x {{this.quantity}} ({{this.total}})
{{/each}}
Shipping: {{order.shipping.address_1}}, {{order.shipping.city}}, {{order.shipping.state}} {{order.shipping.postcode}}`,
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
                text: 'New WooCommerce Order',
              },
            },
            {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: '*Order:* #{{order.number}}' },
                { type: 'mrkdwn', text: '*Total:* {{order.total}} {{order.currency}}' },
                { type: 'mrkdwn', text: '*Customer:* {{order.billing.first_name}} {{order.billing.last_name}}' },
                { type: 'mrkdwn', text: '*Payment:* {{order.payment_method_title}}' },
              ],
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: { type: 'plain_text', text: 'View Order' },
                  url: '{{config.store_url}}/wp-admin/post.php?post={{order.id}}&action=edit',
                },
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
          subject: 'New WooCommerce Order #{{order.number}} - {{order.total}} {{order.currency}}',
          body: '{{steps.format-order-message.output}}',
        },
        dependsOn: ['format-order-message'],
        retryConfig: { maxRetries: 2, retryDelayMs: 3000 },
      },
    ],
    requiredConnections: ['woocommerce', 'slack', 'gmail'],
    estimatedSavings: {
      hours: 5,
      perMonth: 'Save ~5 hours/month on manual order checking',
    },
    tags: ['notification', 'slack', 'email', 'real-time', 'wordpress'],
  },

  // 2. Order Processing Automation
  {
    id: 'woocommerce-order-processing-automation',
    name: 'Order Processing Automation',
    description: 'Automatically process paid orders: update status, notify customer with shipping details, and log to tracking sheet.',
    category: 'order',
    difficulty: 'intermediate',
    trigger: {
      type: 'webhook',
      source: 'woocommerce',
      event: 'order_paid',
      composioTool: 'WOOCOMMERCE_ORDER_UPDATED_TRIGGER',
      config: {
        webhookTopics: ['order.updated'],
        filter: { status: 'processing' },
      },
    },
    steps: [
      {
        id: 'verify-payment-complete',
        name: 'Verify Payment Complete',
        description: 'Check that payment has been received',
        tool: 'COMPOSIO_CONDITION',
        toolkit: 'nexus',
        inputs: {
          condition: '{{order.status === "processing" && order.date_paid !== null}}',
          onTrue: 'continue',
          onFalse: 'skip',
        },
        dependsOn: [],
      },
      {
        id: 'update-order-status',
        name: 'Update Order Status',
        description: 'Move order to processing/shipped status',
        tool: 'WOOCOMMERCE_UPDATE_ORDER',
        toolkit: 'woocommerce',
        inputs: {
          order_id: '{{order.id}}',
          status: 'completed',
          customer_note: 'Your order has been processed and will ship soon!',
        },
        dependsOn: ['verify-payment-complete'],
        retryConfig: { maxRetries: 2, retryDelayMs: 5000 },
      },
      {
        id: 'send-processing-notification',
        name: 'Notify Customer',
        description: 'Send order processing notification to customer',
        tool: 'GMAIL_SEND_EMAIL',
        toolkit: 'gmail',
        inputs: {
          to: '{{order.billing.email}}',
          subject: 'Your Order #{{order.number}} is Being Processed!',
          body: `Hi {{order.billing.first_name}},

Great news! Your order #{{order.number}} has been received and is now being processed.

Order Summary:
{{#each order.line_items}}
- {{this.name}} x {{this.quantity}} - {{this.total}} {{order.currency}}
{{/each}}

Total: {{order.total}} {{order.currency}}

Shipping Address:
{{order.shipping.first_name}} {{order.shipping.last_name}}
{{order.shipping.address_1}}
{{order.shipping.city}}, {{order.shipping.state}} {{order.shipping.postcode}}
{{order.shipping.country}}

We'll send you tracking information once your order ships.

Thank you for shopping with us!

Best regards,
{{config.store_name}}`,
        },
        dependsOn: ['update-order-status'],
        retryConfig: { maxRetries: 2, retryDelayMs: 3000 },
      },
      {
        id: 'log-to-sheets',
        name: 'Log Order Processing',
        description: 'Record order processing in Google Sheets',
        tool: 'GOOGLESHEETS_APPEND_ROW',
        toolkit: 'googlesheets',
        inputs: {
          spreadsheet_id: '{{config.orders_sheet_id}}',
          range: 'ProcessedOrders!A:G',
          values: [
            '{{order.number}}',
            '{{order.billing.email}}',
            '{{order.billing.first_name}} {{order.billing.last_name}}',
            '{{order.total}}',
            '{{order.currency}}',
            '{{new Date().toISOString()}}',
            'Processed',
          ],
        },
        dependsOn: ['update-order-status'],
      },
      {
        id: 'notify-team-slack',
        name: 'Notify Fulfillment Team',
        description: 'Alert fulfillment team via Slack',
        tool: 'SLACK_SEND_MESSAGE',
        toolkit: 'slack',
        inputs: {
          channel: '{{config.fulfillment_channel}}',
          text: `Order #{{order.number}} ready for fulfillment

Customer: {{order.billing.first_name}} {{order.billing.last_name}}
Items: {{order.line_items.length}}
Ship to: {{order.shipping.city}}, {{order.shipping.state}}`,
        },
        dependsOn: ['update-order-status'],
      },
    ],
    requiredConnections: ['woocommerce', 'gmail', 'googlesheets', 'slack'],
    estimatedSavings: {
      hours: 15,
      perMonth: 'Save ~15 hours/month on manual order processing',
    },
    tags: ['fulfillment', 'automation', 'processing', 'customer-notification'],
  },

  // 3. High-Value Order Alert
  {
    id: 'woocommerce-high-value-order-alert',
    name: 'High-Value Order Alert',
    description: 'Get priority Slack alerts and CRM tasks for orders above your specified threshold. Never miss a VIP customer.',
    category: 'order',
    difficulty: 'intermediate',
    trigger: {
      type: 'webhook',
      source: 'woocommerce',
      event: 'new_order',
      composioTool: 'WOOCOMMERCE_ORDER_CREATED_TRIGGER',
      config: {
        webhookTopics: ['order.created'],
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
          condition: '{{parseFloat(order.total) >= config.high_value_threshold}}',
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
                text: `*Order #{{order.number}}* - *{{order.total}} {{order.currency}}*

Customer: {{order.billing.first_name}} {{order.billing.last_name}}
Email: {{order.billing.email}}
Phone: {{order.billing.phone || 'Not provided'}}
Company: {{order.billing.company || 'N/A'}}`,
              },
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: 'Threshold: {{config.high_value_threshold}} {{order.currency}} | This order exceeds by {{parseFloat(order.total) - config.high_value_threshold}} {{order.currency}}',
                },
              ],
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: { type: 'plain_text', text: 'View Order' },
                  url: '{{config.store_url}}/wp-admin/post.php?post={{order.id}}&action=edit',
                  style: 'primary',
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
          subject: 'VIP Follow-up: WooCommerce Order #{{order.number}} - {{order.total}} {{order.currency}}',
          body: `High-value order requires personal follow-up.

Customer: {{order.billing.first_name}} {{order.billing.last_name}}
Email: {{order.billing.email}}
Phone: {{order.billing.phone}}
Company: {{order.billing.company}}
Order Total: {{order.total}} {{order.currency}}

Items:
{{#each order.line_items}}
- {{this.name}} ({{this.quantity}})
{{/each}}`,
          due_date: '{{addDays(new Date(), 1).toISOString()}}',
          priority: 'HIGH',
          owner_id: '{{config.sales_rep_id}}',
        },
        dependsOn: ['check-order-value'],
      },
      {
        id: 'add-customer-note',
        name: 'Add VIP Note to Order',
        description: 'Add VIP note to the WooCommerce order',
        tool: 'WOOCOMMERCE_CREATE_ORDER_NOTE',
        toolkit: 'woocommerce',
        inputs: {
          order_id: '{{order.id}}',
          note: 'HIGH VALUE ORDER - VIP follow-up required. CRM task created.',
          customer_note: false,
        },
        dependsOn: ['check-order-value'],
      },
      {
        id: 'log-high-value-order',
        name: 'Log High-Value Order',
        description: 'Record high-value order in tracking sheet',
        tool: 'GOOGLESHEETS_APPEND_ROW',
        toolkit: 'googlesheets',
        inputs: {
          spreadsheet_id: '{{config.vip_sheet_id}}',
          range: 'HighValueOrders!A:F',
          values: [
            '{{new Date().toISOString()}}',
            '{{order.number}}',
            '{{order.billing.email}}',
            '{{order.total}}',
            '{{order.currency}}',
            'Alert Sent',
          ],
        },
        dependsOn: ['send-priority-slack'],
      },
    ],
    requiredConnections: ['woocommerce', 'slack', 'hubspot', 'googlesheets'],
    estimatedSavings: {
      hours: 8,
      perMonth: 'Save ~8 hours/month on VIP order tracking',
    },
    tags: ['vip', 'high-value', 'crm', 'priority', 'sales'],
  },

  // 4. Abandoned Cart Recovery (requires WooCommerce Cart Abandonment plugin)
  {
    id: 'woocommerce-abandoned-cart-recovery',
    name: 'Abandoned Cart Recovery',
    description: 'Automatically send recovery emails for abandoned carts. Requires WooCommerce Cart Abandonment Recovery plugin or similar.',
    category: 'order',
    difficulty: 'advanced',
    trigger: {
      type: 'webhook',
      source: 'woocommerce',
      event: 'cart_abandoned',
      composioTool: 'WOOCOMMERCE_CART_ABANDONED_TRIGGER',
      config: {
        webhookTopics: ['cart.abandoned'],
        delay_minutes: 60, // Wait 1 hour before triggering
      },
    },
    steps: [
      {
        id: 'validate-cart-data',
        name: 'Validate Cart Data',
        description: 'Ensure cart has valid email and items',
        tool: 'COMPOSIO_CONDITION',
        toolkit: 'nexus',
        inputs: {
          condition: '{{cart.email && cart.line_items && cart.line_items.length > 0}}',
          onTrue: 'continue',
          onFalse: 'skip',
        },
        dependsOn: [],
      },
      {
        id: 'check-not-converted',
        name: 'Verify Cart Not Converted',
        description: 'Check if the cart was converted to an order',
        tool: 'WOOCOMMERCE_LIST_ORDERS',
        toolkit: 'woocommerce',
        inputs: {
          customer: '{{cart.email}}',
          after: '{{cart.created_at}}',
          status: ['pending', 'processing', 'completed'],
        },
        dependsOn: ['validate-cart-data'],
      },
      {
        id: 'skip-if-converted',
        name: 'Skip If Converted',
        description: 'Skip recovery if customer already placed an order',
        tool: 'COMPOSIO_CONDITION',
        toolkit: 'nexus',
        inputs: {
          condition: '{{steps.check-not-converted.output.length === 0}}',
          onTrue: 'continue',
          onFalse: 'skip',
        },
        dependsOn: ['check-not-converted'],
      },
      {
        id: 'generate-recovery-email',
        name: 'Generate Recovery Email',
        description: 'Create personalized recovery email content',
        tool: 'COMPOSIO_AI_GENERATE',
        toolkit: 'nexus',
        inputs: {
          prompt: `Generate a friendly, personalized abandoned cart recovery email for a WooCommerce store.

Customer Email: {{cart.email}}
Customer Name: {{cart.billing_first_name || 'Valued Customer'}}
Store Name: {{config.store_name}}

Cart Contents:
{{#each cart.line_items}}
- {{this.name}} (Qty: {{this.quantity}}) - {{this.price}} {{cart.currency}}
{{/each}}

Cart Total: {{cart.total}} {{cart.currency}}
Recovery Link: {{cart.recovery_url}}

Write a compelling email that:
1. Reminds them of what they left behind
2. Creates urgency without being pushy
3. Includes a friendly CTA to complete their purchase
4. Mentions items are still available (reserved for them)`,
          tone: 'friendly and helpful',
          max_length: 500,
        },
        dependsOn: ['skip-if-converted'],
      },
      {
        id: 'send-recovery-email',
        name: 'Send Recovery Email',
        description: 'Send first abandoned cart recovery email',
        tool: 'GMAIL_SEND_EMAIL',
        toolkit: 'gmail',
        inputs: {
          to: '{{cart.email}}',
          subject: 'You left something behind at {{config.store_name}}!',
          body: '{{steps.generate-recovery-email.output}}',
          html: true,
        },
        dependsOn: ['generate-recovery-email'],
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
          range: 'CartRecovery!A:G',
          values: [
            '{{cart.id}}',
            '{{cart.email}}',
            '{{cart.total}}',
            '{{cart.currency}}',
            '{{new Date().toISOString()}}',
            'Email 1 Sent',
            '{{cart.recovery_url}}',
          ],
        },
        dependsOn: ['send-recovery-email'],
      },
      {
        id: 'schedule-followup',
        name: 'Schedule Follow-up Email',
        description: 'Schedule second recovery email for 24 hours later',
        tool: 'COMPOSIO_SCHEDULE_WORKFLOW',
        toolkit: 'nexus',
        inputs: {
          workflow_id: 'woocommerce-recovery-followup',
          delay_hours: 24,
          context: {
            cart_id: '{{cart.id}}',
            email: '{{cart.email}}',
            cart_value: '{{cart.total}}',
            recovery_url: '{{cart.recovery_url}}',
          },
        },
        dependsOn: ['log-recovery-attempt'],
      },
    ],
    requiredConnections: ['woocommerce', 'gmail', 'googlesheets'],
    estimatedSavings: {
      hours: 20,
      perMonth: 'Recover ~10-15% of abandoned carts, potentially thousands in revenue',
    },
    tags: ['recovery', 'email', 'revenue', 'automation', 'marketing', 'cart'],
  },

  // 5. Order to QuickBooks/Xero Invoice
  {
    id: 'woocommerce-order-to-accounting',
    name: 'Order to QuickBooks Invoice',
    description: 'Automatically create invoices in QuickBooks when WooCommerce orders are placed and paid.',
    category: 'order',
    difficulty: 'intermediate',
    trigger: {
      type: 'webhook',
      source: 'woocommerce',
      event: 'order_completed',
      composioTool: 'WOOCOMMERCE_ORDER_UPDATED_TRIGGER',
      config: {
        webhookTopics: ['order.updated'],
        filter: { status: 'completed' },
      },
    },
    steps: [
      {
        id: 'verify-order-paid',
        name: 'Verify Order is Paid',
        description: 'Confirm order has been paid before creating invoice',
        tool: 'COMPOSIO_CONDITION',
        toolkit: 'nexus',
        inputs: {
          condition: '{{order.status === "completed" && order.date_paid !== null}}',
          onTrue: 'continue',
          onFalse: 'skip',
        },
        dependsOn: [],
      },
      {
        id: 'find-or-create-customer',
        name: 'Find/Create Customer in QuickBooks',
        description: 'Find existing customer or create new one in QuickBooks',
        tool: 'QUICKBOOKS_FIND_OR_CREATE_CUSTOMER',
        toolkit: 'quickbooks',
        inputs: {
          email: '{{order.billing.email}}',
          display_name: '{{order.billing.first_name}} {{order.billing.last_name}}',
          given_name: '{{order.billing.first_name}}',
          family_name: '{{order.billing.last_name}}',
          primary_email: '{{order.billing.email}}',
          primary_phone: '{{order.billing.phone}}',
          company_name: '{{order.billing.company}}',
          billing_address: {
            line1: '{{order.billing.address_1}}',
            line2: '{{order.billing.address_2}}',
            city: '{{order.billing.city}}',
            country: '{{order.billing.country}}',
            postal_code: '{{order.billing.postcode}}',
            state: '{{order.billing.state}}',
          },
        },
        dependsOn: ['verify-order-paid'],
      },
      {
        id: 'create-invoice',
        name: 'Create Invoice',
        description: 'Create invoice in QuickBooks with line items',
        tool: 'QUICKBOOKS_CREATE_INVOICE',
        toolkit: 'quickbooks',
        inputs: {
          customer_id: '{{steps.find-or-create-customer.output.customer_id}}',
          invoice_date: '{{order.date_created}}',
          due_date: '{{order.date_paid}}',
          line_items: '{{order.line_items.map(item => ({ description: item.name, quantity: item.quantity, unit_price: item.price, item_ref: item.sku || item.product_id }))}}',
          shipping_amount: '{{order.shipping_total}}',
          tax_amount: '{{order.total_tax}}',
          discount_amount: '{{order.discount_total}}',
          memo: 'WooCommerce Order #{{order.number}}',
          external_ref: 'WC-{{order.number}}',
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
          amount: '{{order.total}}',
          payment_date: '{{order.date_paid}}',
          payment_method: '{{order.payment_method_title}}',
          memo: 'WooCommerce payment for Order #{{order.number}} via {{order.payment_method_title}}',
        },
        dependsOn: ['create-invoice'],
      },
      {
        id: 'add-order-note',
        name: 'Add Invoice Note to Order',
        description: 'Add QuickBooks invoice reference to WooCommerce order',
        tool: 'WOOCOMMERCE_CREATE_ORDER_NOTE',
        toolkit: 'woocommerce',
        inputs: {
          order_id: '{{order.id}}',
          note: 'QuickBooks Invoice Created: {{steps.create-invoice.output.invoice_id}}',
          customer_note: false,
        },
        dependsOn: ['record-payment'],
      },
      {
        id: 'send-confirmation',
        name: 'Send Confirmation to Finance',
        description: 'Notify finance team of new invoice',
        tool: 'SLACK_SEND_MESSAGE',
        toolkit: 'slack',
        inputs: {
          channel: '{{config.finance_channel}}',
          text: `Invoice created for WooCommerce Order #{{order.number}}

Amount: {{order.total}} {{order.currency}}
Customer: {{order.billing.first_name}} {{order.billing.last_name}}
QuickBooks Invoice: {{steps.create-invoice.output.invoice_id}}
Payment Method: {{order.payment_method_title}}`,
        },
        dependsOn: ['record-payment'],
      },
    ],
    requiredConnections: ['woocommerce', 'quickbooks', 'slack'],
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

const INVENTORY_TEMPLATES: WooCommerceTemplate[] = [
  // 1. Low Stock Alert
  {
    id: 'woocommerce-low-stock-alert',
    name: 'Low Stock Alert',
    description: 'Get notified when product inventory drops below threshold. Automatically send reorder requests to suppliers.',
    category: 'inventory',
    difficulty: 'beginner',
    trigger: {
      type: 'webhook',
      source: 'woocommerce',
      event: 'product_low_stock',
      composioTool: 'WOOCOMMERCE_PRODUCT_UPDATED_TRIGGER',
      config: {
        webhookTopics: ['product.updated'],
        filter: { low_stock: true },
      },
    },
    steps: [
      {
        id: 'check-threshold',
        name: 'Check Low Stock Threshold',
        description: 'Determine if stock is below threshold',
        tool: 'COMPOSIO_CONDITION',
        toolkit: 'nexus',
        inputs: {
          condition: '{{product.stock_quantity <= config.low_stock_threshold}}',
          onTrue: 'continue',
          onFalse: 'skip',
        },
        dependsOn: [],
      },
      {
        id: 'get-product-details',
        name: 'Get Full Product Details',
        description: 'Fetch complete product information',
        tool: 'WOOCOMMERCE_GET_PRODUCT',
        toolkit: 'woocommerce',
        inputs: {
          product_id: '{{product.id}}',
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
                { type: 'mrkdwn', text: '*Product:* {{product.name}}' },
                { type: 'mrkdwn', text: '*SKU:* {{product.sku || "N/A"}}' },
                { type: 'mrkdwn', text: '*Current Stock:* {{product.stock_quantity}}' },
                { type: 'mrkdwn', text: '*Threshold:* {{config.low_stock_threshold}}' },
                { type: 'mrkdwn', text: '*Price:* {{product.price}} {{config.currency}}' },
              ],
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: { type: 'plain_text', text: 'View Product' },
                  url: '{{config.store_url}}/wp-admin/post.php?post={{product.id}}&action=edit',
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
          subject: 'Reorder Request: {{product.name}} - SKU {{product.sku || product.id}}',
          body: `Dear Supplier,

We need to reorder the following item:

Product: {{product.name}}
SKU: {{product.sku || "N/A"}}
Current Stock: {{product.stock_quantity}}
Suggested Order Quantity: {{config.reorder_quantity}}

Product Details:
- Regular Price: {{product.regular_price}}
- Sale Price: {{product.sale_price || "N/A"}}
- Weight: {{product.weight || "N/A"}}
- Dimensions: {{product.dimensions.length || "N/A"}} x {{product.dimensions.width || "N/A"}} x {{product.dimensions.height || "N/A"}}

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
            '{{product.name}}',
            '{{product.sku || product.id}}',
            '{{product.stock_quantity}}',
            '{{config.low_stock_threshold}}',
            'Alert Sent',
          ],
        },
        dependsOn: ['send-slack-alert'],
      },
    ],
    requiredConnections: ['woocommerce', 'slack', 'gmail', 'googlesheets'],
    estimatedSavings: {
      hours: 10,
      perMonth: 'Prevent stockouts and save ~10 hours/month on inventory monitoring',
    },
    tags: ['inventory', 'alert', 'reorder', 'supplier', 'low-stock'],
  },

  // 2. Daily Inventory Report to Google Sheets
  {
    id: 'woocommerce-daily-inventory-sync',
    name: 'Daily Inventory Sync to Sheets',
    description: 'Automatically sync your entire WooCommerce inventory to Google Sheets daily for reporting and analysis.',
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
        description: 'Get all products with inventory from WooCommerce',
        tool: 'WOOCOMMERCE_LIST_PRODUCTS',
        toolkit: 'woocommerce',
        inputs: {
          per_page: 100,
          status: 'publish',
          stock_status: 'instock,outofstock,onbackorder',
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
          data: '{{steps.fetch-all-products.output}}',
          transformation: `products.map(p => [
            new Date().toISOString().split('T')[0],
            p.name,
            p.sku || 'N/A',
            p.type,
            p.stock_quantity || 0,
            p.stock_status,
            p.regular_price || '0',
            p.sale_price || '',
            (p.stock_quantity || 0) * parseFloat(p.regular_price || '0'),
            (p.stock_quantity || 0) <= ${('{{config.low_stock_threshold}}')} ? 'LOW' : 'OK',
            p.categories.map(c => c.name).join(', ')
          ])`,
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
          range: 'DailyInventory!A2:K',
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
        id: 'calculate-summary',
        name: 'Calculate Summary Stats',
        description: 'Calculate inventory summary statistics',
        tool: 'COMPOSIO_DATA_TRANSFORM',
        toolkit: 'nexus',
        inputs: {
          calculation: `{
            totalProducts: products.length,
            totalStock: products.reduce((sum, p) => sum + (p.stock_quantity || 0), 0),
            lowStockCount: products.filter(p => (p.stock_quantity || 0) <= ${('{{config.low_stock_threshold}}')}).length,
            outOfStockCount: products.filter(p => p.stock_status === 'outofstock').length,
            totalValue: products.reduce((sum, p) => sum + ((p.stock_quantity || 0) * parseFloat(p.regular_price || '0')), 0).toFixed(2)
          }`,
        },
        dependsOn: ['fetch-all-products'],
      },
      {
        id: 'send-summary',
        name: 'Send Daily Summary',
        description: 'Send inventory summary to Slack',
        tool: 'SLACK_SEND_MESSAGE',
        toolkit: 'slack',
        inputs: {
          channel: '{{config.inventory_channel}}',
          text: 'Daily WooCommerce Inventory Report',
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: 'Daily Inventory Report - {{new Date().toLocaleDateString()}}',
              },
            },
            {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: '*Total Products:* {{steps.calculate-summary.output.totalProducts}}' },
                { type: 'mrkdwn', text: '*Total Stock Units:* {{steps.calculate-summary.output.totalStock}}' },
                { type: 'mrkdwn', text: '*Low Stock Items:* {{steps.calculate-summary.output.lowStockCount}}' },
                { type: 'mrkdwn', text: '*Out of Stock:* {{steps.calculate-summary.output.outOfStockCount}}' },
                { type: 'mrkdwn', text: '*Total Inventory Value:* {{config.currency}}{{steps.calculate-summary.output.totalValue}}' },
              ],
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: { type: 'plain_text', text: 'View Full Report' },
                  url: '{{config.sheet_url}}',
                },
              ],
            },
          ],
        },
        dependsOn: ['update-inventory-sheet', 'calculate-summary'],
      },
    ],
    requiredConnections: ['woocommerce', 'googlesheets', 'slack'],
    estimatedSavings: {
      hours: 8,
      perMonth: 'Save ~8 hours/month on manual inventory reporting',
    },
    tags: ['inventory', 'reporting', 'google-sheets', 'daily', 'sync'],
  },

  // 3. Out-of-Stock Product Status Update
  {
    id: 'woocommerce-out-of-stock-handler',
    name: 'Out-of-Stock Product Handler',
    description: 'Automatically handle out-of-stock products: hide from catalog, notify team, and track for restocking.',
    category: 'inventory',
    difficulty: 'intermediate',
    trigger: {
      type: 'webhook',
      source: 'woocommerce',
      event: 'product_out_of_stock',
      composioTool: 'WOOCOMMERCE_PRODUCT_UPDATED_TRIGGER',
      config: {
        webhookTopics: ['product.updated'],
        filter: { stock_status: 'outofstock' },
      },
    },
    steps: [
      {
        id: 'check-stock-status',
        name: 'Verify Out of Stock',
        description: 'Confirm product is actually out of stock',
        tool: 'COMPOSIO_CONDITION',
        toolkit: 'nexus',
        inputs: {
          condition: '{{product.stock_status === "outofstock" || product.stock_quantity <= 0}}',
          onTrue: 'continue',
          onFalse: 'skip',
        },
        dependsOn: [],
      },
      {
        id: 'get-product-details',
        name: 'Get Product Details',
        description: 'Fetch full product information',
        tool: 'WOOCOMMERCE_GET_PRODUCT',
        toolkit: 'woocommerce',
        inputs: {
          product_id: '{{product.id}}',
        },
        dependsOn: ['check-stock-status'],
      },
      {
        id: 'update-product-visibility',
        name: 'Update Product Visibility',
        description: 'Hide product from catalog or mark as out of stock',
        tool: 'WOOCOMMERCE_UPDATE_PRODUCT',
        toolkit: 'woocommerce',
        inputs: {
          product_id: '{{product.id}}',
          catalog_visibility: '{{config.hide_out_of_stock ? "hidden" : "visible"}}',
          stock_status: 'outofstock',
          meta_data: [
            { key: '_out_of_stock_date', value: '{{new Date().toISOString()}}' },
          ],
        },
        dependsOn: ['get-product-details'],
      },
      {
        id: 'notify-team',
        name: 'Notify Inventory Team',
        description: 'Alert team about out-of-stock product',
        tool: 'SLACK_SEND_MESSAGE',
        toolkit: 'slack',
        inputs: {
          channel: '{{config.inventory_channel}}',
          text: 'Product Out of Stock',
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: 'Product Out of Stock',
              },
            },
            {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: '*Product:* {{product.name}}' },
                { type: 'mrkdwn', text: '*SKU:* {{product.sku || "N/A"}}' },
                { type: 'mrkdwn', text: '*Price:* {{product.regular_price}} {{config.currency}}' },
                { type: 'mrkdwn', text: '*Status:* {{config.hide_out_of_stock ? "Hidden from catalog" : "Marked out of stock"}}' },
              ],
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: 'Categories: {{product.categories.map(c => c.name).join(", ") || "Uncategorized"}}',
                },
              ],
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: { type: 'plain_text', text: 'View Product' },
                  url: '{{config.store_url}}/wp-admin/post.php?post={{product.id}}&action=edit',
                },
                {
                  type: 'button',
                  text: { type: 'plain_text', text: 'Restock Request' },
                  style: 'primary',
                  action_id: 'restock_{{product.id}}',
                },
              ],
            },
          ],
        },
        dependsOn: ['update-product-visibility'],
        retryConfig: { maxRetries: 2, retryDelayMs: 2000 },
      },
      {
        id: 'log-out-of-stock',
        name: 'Log Out-of-Stock Event',
        description: 'Record out-of-stock event for tracking',
        tool: 'GOOGLESHEETS_APPEND_ROW',
        toolkit: 'googlesheets',
        inputs: {
          spreadsheet_id: '{{config.inventory_sheet_id}}',
          range: 'OutOfStock!A:F',
          values: [
            '{{new Date().toISOString()}}',
            '{{product.name}}',
            '{{product.sku || product.id}}',
            '{{product.regular_price}}',
            '{{config.hide_out_of_stock ? "Hidden" : "Visible"}}',
            'Pending Restock',
          ],
        },
        dependsOn: ['update-product-visibility'],
      },
      {
        id: 'send-supplier-notification',
        name: 'Notify Supplier',
        description: 'Send restock notification to supplier',
        tool: 'GMAIL_SEND_EMAIL',
        toolkit: 'gmail',
        inputs: {
          to: '{{config.supplier_email}}',
          subject: 'URGENT: Product Out of Stock - {{product.name}}',
          body: `Dear Supplier,

The following product has gone out of stock and requires immediate restocking:

Product: {{product.name}}
SKU: {{product.sku || "N/A"}}
Regular Price: {{product.regular_price}} {{config.currency}}

This product is now {{config.hide_out_of_stock ? "hidden from our catalog" : "marked as out of stock"}}.

Please advise on:
1. Current availability
2. Lead time for restocking
3. Minimum order quantity

Thank you for your prompt attention.

Best regards,
{{config.store_name}}`,
        },
        dependsOn: ['update-product-visibility'],
      },
    ],
    requiredConnections: ['woocommerce', 'slack', 'googlesheets', 'gmail'],
    estimatedSavings: {
      hours: 12,
      perMonth: 'Prevent customer frustration and save ~12 hours/month on inventory management',
    },
    tags: ['inventory', 'automation', 'out-of-stock', 'product-status'],
  },
]

// ============================================================================
// Customer Templates (3 templates)
// ============================================================================

const CUSTOMER_TEMPLATES: WooCommerceTemplate[] = [
  // 1. New Customer Welcome Email
  {
    id: 'woocommerce-new-customer-welcome',
    name: 'New Customer Welcome Email',
    description: 'Automatically send personalized welcome emails to new WooCommerce customers with discount codes and product recommendations.',
    category: 'customer',
    difficulty: 'beginner',
    trigger: {
      type: 'webhook',
      source: 'woocommerce',
      event: 'customer_created',
      composioTool: 'WOOCOMMERCE_CUSTOMER_CREATED_TRIGGER',
      config: {
        webhookTopics: ['customer.created'],
      },
    },
    steps: [
      {
        id: 'create-welcome-coupon',
        name: 'Create Welcome Coupon',
        description: 'Generate unique discount coupon for new customer',
        tool: 'WOOCOMMERCE_CREATE_COUPON',
        toolkit: 'woocommerce',
        inputs: {
          code: 'WELCOME{{customer.id}}',
          discount_type: 'percent',
          amount: '{{config.welcome_discount_percent}}',
          individual_use: true,
          usage_limit: 1,
          usage_limit_per_user: 1,
          date_expires: '{{addDays(new Date(), 30).toISOString().split("T")[0]}}',
          email_restrictions: ['{{customer.email}}'],
          description: 'Welcome discount for new customer {{customer.email}}',
        },
        dependsOn: [],
      },
      {
        id: 'get-popular-products',
        name: 'Get Popular Products',
        description: 'Fetch popular products for recommendations',
        tool: 'WOOCOMMERCE_LIST_PRODUCTS',
        toolkit: 'woocommerce',
        inputs: {
          per_page: 4,
          orderby: 'popularity',
          status: 'publish',
          stock_status: 'instock',
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
          body: `Hi {{customer.first_name || "there"}},

Welcome to {{config.store_name}}! We're thrilled to have you join our community.

As a special welcome gift, here's your exclusive discount code:

WELCOME{{customer.id}} - {{config.welcome_discount_percent}}% OFF

This code is valid for 30 days on your first purchase.

Here are some of our bestsellers you might love:
{{#each steps.get-popular-products.output}}
- {{this.name}} - {{this.price}} {{config.currency}}
{{/each}}

Shop now: {{config.store_url}}

If you have any questions, just reply to this email - we're here to help!

Happy shopping!

{{config.store_name}} Team`,
        },
        dependsOn: ['create-welcome-coupon', 'get-popular-products'],
        retryConfig: { maxRetries: 2, retryDelayMs: 3000 },
      },
      {
        id: 'update-customer-meta',
        name: 'Update Customer Meta',
        description: 'Add welcome email tracking to customer',
        tool: 'WOOCOMMERCE_UPDATE_CUSTOMER',
        toolkit: 'woocommerce',
        inputs: {
          customer_id: '{{customer.id}}',
          meta_data: [
            { key: 'welcome_email_sent', value: 'true' },
            { key: 'welcome_email_date', value: '{{new Date().toISOString()}}' },
            { key: 'welcome_coupon_code', value: 'WELCOME{{customer.id}}' },
          ],
        },
        dependsOn: ['send-welcome-email'],
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
    requiredConnections: ['woocommerce', 'gmail', 'googlesheets'],
    estimatedSavings: {
      hours: 6,
      perMonth: 'Boost first purchases by 15-25% with automated welcome sequence',
    },
    tags: ['customer', 'welcome', 'email', 'discount', 'onboarding'],
  },

  // 2. Repeat Customer VIP Tagging
  {
    id: 'woocommerce-repeat-customer-vip',
    name: 'Repeat Customer VIP Tagging',
    description: 'Automatically identify and tag VIP customers based on order count and total spending.',
    category: 'customer',
    difficulty: 'intermediate',
    trigger: {
      type: 'webhook',
      source: 'woocommerce',
      event: 'order_completed',
      composioTool: 'WOOCOMMERCE_ORDER_UPDATED_TRIGGER',
      config: {
        webhookTopics: ['order.updated'],
        filter: { status: 'completed' },
      },
    },
    steps: [
      {
        id: 'get-customer-orders',
        name: 'Get Customer Order History',
        description: 'Fetch all orders for this customer',
        tool: 'WOOCOMMERCE_LIST_ORDERS',
        toolkit: 'woocommerce',
        inputs: {
          customer: '{{order.customer_id}}',
          status: ['completed', 'processing'],
        },
        dependsOn: [],
      },
      {
        id: 'calculate-customer-stats',
        name: 'Calculate Customer Stats',
        description: 'Calculate total spending and order statistics',
        tool: 'COMPOSIO_DATA_TRANSFORM',
        toolkit: 'nexus',
        inputs: {
          calculation: `{
            totalSpent: orders.reduce((sum, o) => sum + parseFloat(o.total), 0),
            orderCount: orders.length,
            avgOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + parseFloat(o.total), 0) / orders.length : 0,
            firstOrderDate: orders.length > 0 ? orders[orders.length - 1].date_created : null,
            daysSinceFirstOrder: orders.length > 0 ? Math.floor((new Date() - new Date(orders[orders.length - 1].date_created)) / (1000 * 60 * 60 * 24)) : 0,
            tier: this.totalSpent >= ${('{{config.vip_gold_threshold}}')} ? 'VIP-Gold' :
                  this.totalSpent >= ${('{{config.vip_silver_threshold}}')} ? 'VIP-Silver' :
                  this.totalSpent >= ${('{{config.vip_bronze_threshold}}')} ? 'VIP-Bronze' :
                  orders.length >= ${('{{config.repeat_customer_orders}}')} ? 'Repeat-Customer' : 'Regular'
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
          condition: '{{steps.calculate-customer-stats.output.tier !== "Regular"}}',
          onTrue: 'continue',
          onFalse: 'skip',
        },
        dependsOn: ['calculate-customer-stats'],
      },
      {
        id: 'update-customer',
        name: 'Update Customer with VIP Status',
        description: 'Add VIP tier and stats to customer profile',
        tool: 'WOOCOMMERCE_UPDATE_CUSTOMER',
        toolkit: 'woocommerce',
        inputs: {
          customer_id: '{{order.customer_id}}',
          meta_data: [
            { key: 'vip_tier', value: '{{steps.calculate-customer-stats.output.tier}}' },
            { key: 'lifetime_value', value: '{{steps.calculate-customer-stats.output.totalSpent}}' },
            { key: 'total_orders', value: '{{steps.calculate-customer-stats.output.orderCount}}' },
            { key: 'avg_order_value', value: '{{steps.calculate-customer-stats.output.avgOrderValue.toFixed(2)}}' },
            { key: 'vip_status_updated', value: '{{new Date().toISOString()}}' },
          ],
        },
        dependsOn: ['check-vip-status'],
      },
      {
        id: 'notify-sales-team',
        name: 'Notify Sales Team',
        description: 'Alert sales team about VIP customer',
        tool: 'SLACK_SEND_MESSAGE',
        toolkit: 'slack',
        inputs: {
          channel: '{{config.sales_channel}}',
          text: 'VIP Customer Update',
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: 'Customer Status: {{steps.calculate-customer-stats.output.tier}}',
              },
            },
            {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: '*Customer:* {{order.billing.first_name}} {{order.billing.last_name}}' },
                { type: 'mrkdwn', text: '*Email:* {{order.billing.email}}' },
                { type: 'mrkdwn', text: '*Total Spent:* {{config.currency}}{{steps.calculate-customer-stats.output.totalSpent.toFixed(2)}}' },
                { type: 'mrkdwn', text: '*Order Count:* {{steps.calculate-customer-stats.output.orderCount}}' },
                { type: 'mrkdwn', text: '*Avg Order:* {{config.currency}}{{steps.calculate-customer-stats.output.avgOrderValue.toFixed(2)}}' },
                { type: 'mrkdwn', text: '*Customer Since:* {{steps.calculate-customer-stats.output.daysSinceFirstOrder}} days' },
              ],
            },
          ],
        },
        dependsOn: ['update-customer'],
      },
      {
        id: 'send-vip-email',
        name: 'Send VIP Welcome Email',
        description: 'Send special VIP welcome email to customer',
        tool: 'GMAIL_SEND_EMAIL',
        toolkit: 'gmail',
        inputs: {
          to: '{{order.billing.email}}',
          subject: 'You\'re now a {{steps.calculate-customer-stats.output.tier}} member at {{config.store_name}}!',
          body: `Dear {{order.billing.first_name}},

Congratulations! You've been upgraded to {{steps.calculate-customer-stats.output.tier}} status at {{config.store_name}}!

Your Stats:
- Total Orders: {{steps.calculate-customer-stats.output.orderCount}}
- Lifetime Value: {{config.currency}}{{steps.calculate-customer-stats.output.totalSpent.toFixed(2)}}
- Customer Since: {{steps.calculate-customer-stats.output.daysSinceFirstOrder}} days

As a valued VIP member, you'll enjoy:
- Early access to sales and new products
- Exclusive VIP-only discounts
- Priority customer support
- Special birthday rewards

Thank you for being such a loyal customer. We truly appreciate your continued support!

Best regards,
{{config.store_name}} VIP Team`,
        },
        dependsOn: ['update-customer'],
      },
    ],
    requiredConnections: ['woocommerce', 'slack', 'gmail'],
    estimatedSavings: {
      hours: 10,
      perMonth: 'Increase VIP retention by 20-30% with automated recognition',
    },
    tags: ['customer', 'vip', 'loyalty', 'tagging', 'segmentation', 'repeat'],
  },

  // 3. Customer to HubSpot/Pipedrive Sync
  {
    id: 'woocommerce-customer-crm-sync',
    name: 'Customer to HubSpot CRM Sync',
    description: 'Automatically sync new WooCommerce customers to HubSpot CRM with full purchase history.',
    category: 'customer',
    difficulty: 'intermediate',
    trigger: {
      type: 'webhook',
      source: 'woocommerce',
      event: 'customer_created',
      composioTool: 'WOOCOMMERCE_CUSTOMER_CREATED_TRIGGER',
      config: {
        webhookTopics: ['customer.created'],
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
          phone: '{{customer.billing.phone}}',
          address: '{{customer.billing.address_1}}',
          city: '{{customer.billing.city}}',
          state: '{{customer.billing.state}}',
          zip: '{{customer.billing.postcode}}',
          country: '{{customer.billing.country}}',
          company: '{{customer.billing.company}}',
          lifecyclestage: 'customer',
          hs_lead_status: 'NEW',
          woocommerce_customer_id: '{{customer.id}}',
          source: 'WooCommerce',
          woocommerce_store_url: '{{config.store_url}}',
        },
        dependsOn: ['determine-action'],
        retryConfig: { maxRetries: 2, retryDelayMs: 3000 },
      },
      {
        id: 'update-hubspot-contact',
        name: 'Update HubSpot Contact',
        description: 'Update existing contact with WooCommerce data',
        tool: 'HUBSPOT_UPDATE_CONTACT',
        toolkit: 'hubspot',
        inputs: {
          contact_id: '{{steps.check-existing-contact.output.results[0].id}}',
          properties: {
            phone: '{{customer.billing.phone}}',
            address: '{{customer.billing.address_1}}',
            city: '{{customer.billing.city}}',
            state: '{{customer.billing.state}}',
            zip: '{{customer.billing.postcode}}',
            lifecyclestage: 'customer',
            woocommerce_customer_id: '{{customer.id}}',
            woocommerce_synced: '{{new Date().toISOString()}}',
          },
        },
        dependsOn: ['determine-action'],
      },
      {
        id: 'add-to-list',
        name: 'Add to WooCommerce Customers List',
        description: 'Add contact to WooCommerce customers list in HubSpot',
        tool: 'HUBSPOT_ADD_CONTACT_TO_LIST',
        toolkit: 'hubspot',
        inputs: {
          list_id: '{{config.woocommerce_customers_list_id}}',
          contact_id: '{{steps.create-hubspot-contact.output.id || steps.check-existing-contact.output.results[0].id}}',
        },
        dependsOn: ['create-hubspot-contact', 'update-hubspot-contact'],
      },
      {
        id: 'update-woo-customer',
        name: 'Update WooCommerce Customer',
        description: 'Add HubSpot ID to WooCommerce customer',
        tool: 'WOOCOMMERCE_UPDATE_CUSTOMER',
        toolkit: 'woocommerce',
        inputs: {
          customer_id: '{{customer.id}}',
          meta_data: [
            { key: 'hubspot_contact_id', value: '{{steps.create-hubspot-contact.output.id || steps.check-existing-contact.output.results[0].id}}' },
            { key: 'hubspot_synced', value: '{{new Date().toISOString()}}' },
          ],
        },
        dependsOn: ['add-to-list'],
      },
      {
        id: 'log-sync',
        name: 'Log CRM Sync',
        description: 'Record sync in Google Sheets',
        tool: 'GOOGLESHEETS_APPEND_ROW',
        toolkit: 'googlesheets',
        inputs: {
          spreadsheet_id: '{{config.crm_sync_sheet_id}}',
          range: 'CRMSync!A:F',
          values: [
            '{{new Date().toISOString()}}',
            '{{customer.email}}',
            '{{customer.id}}',
            '{{steps.create-hubspot-contact.output.id || steps.check-existing-contact.output.results[0].id}}',
            '{{steps.determine-action.output === "create" ? "Created" : "Updated"}}',
            'HubSpot',
          ],
        },
        dependsOn: ['update-woo-customer'],
      },
    ],
    requiredConnections: ['woocommerce', 'hubspot', 'googlesheets'],
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

const ALL_WOOCOMMERCE_TEMPLATES: WooCommerceTemplate[] = [
  ...ORDER_TEMPLATES,
  ...INVENTORY_TEMPLATES,
  ...CUSTOMER_TEMPLATES,
]

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Get all WooCommerce workflow templates
 */
export function getWooCommerceTemplates(): WooCommerceTemplate[] {
  return ALL_WOOCOMMERCE_TEMPLATES
}

/**
 * Get templates filtered by category
 */
export function getTemplatesByCategory(category: WooCommerceTemplateCategory): WooCommerceTemplate[] {
  return ALL_WOOCOMMERCE_TEMPLATES.filter(template => template.category === category)
}

/**
 * Get a single template by ID
 */
export function getTemplateById(id: string): WooCommerceTemplate | undefined {
  return ALL_WOOCOMMERCE_TEMPLATES.find(template => template.id === id)
}

/**
 * Get templates filtered by difficulty level
 */
export function getTemplatesByDifficulty(difficulty: WooCommerceTemplateDifficulty): WooCommerceTemplate[] {
  return ALL_WOOCOMMERCE_TEMPLATES.filter(template => template.difficulty === difficulty)
}

/**
 * Get templates that match specific tags
 */
export function getTemplatesByTags(tags: string[]): WooCommerceTemplate[] {
  return ALL_WOOCOMMERCE_TEMPLATES.filter(template =>
    tags.some(tag => template.tags.includes(tag.toLowerCase()))
  )
}

/**
 * Search templates by name or description
 */
export function searchTemplates(query: string): WooCommerceTemplate[] {
  const lowerQuery = query.toLowerCase()
  return ALL_WOOCOMMERCE_TEMPLATES.filter(template =>
    template.name.toLowerCase().includes(lowerQuery) ||
    template.description.toLowerCase().includes(lowerQuery) ||
    template.tags.some(tag => tag.includes(lowerQuery))
  )
}

/**
 * Get template count by category
 */
export function getTemplateCounts(): Record<WooCommerceTemplateCategory, number> {
  return {
    order: ORDER_TEMPLATES.length,
    inventory: INVENTORY_TEMPLATES.length,
    customer: CUSTOMER_TEMPLATES.length,
    fulfillment: ALL_WOOCOMMERCE_TEMPLATES.filter(t => t.category === 'fulfillment').length,
  }
}

/**
 * Get all unique required connections across templates
 */
export function getAllRequiredConnections(): string[] {
  const connections = new Set<string>()
  ALL_WOOCOMMERCE_TEMPLATES.forEach(template => {
    template.requiredConnections.forEach(conn => connections.add(conn))
  })
  return Array.from(connections).sort()
}

/**
 * Get total estimated hours saved per month across all templates
 */
export function getTotalEstimatedSavings(): { hours: number; description: string } {
  const totalHours = ALL_WOOCOMMERCE_TEMPLATES.reduce(
    (sum, template) => sum + template.estimatedSavings.hours,
    0
  )
  return {
    hours: totalHours,
    description: `Save approximately ${totalHours} hours per month with all WooCommerce automations`,
  }
}

// Default export for convenience
export default {
  getWooCommerceTemplates,
  getTemplatesByCategory,
  getTemplateById,
  getTemplatesByDifficulty,
  getTemplatesByTags,
  searchTemplates,
  getTemplateCounts,
  getAllRequiredConnections,
  getTotalEstimatedSavings,
}
