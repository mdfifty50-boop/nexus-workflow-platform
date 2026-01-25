/**
 * E-commerce Workflow Templates
 *
 * Production-ready workflow templates for e-commerce automation:
 * - Order fulfillment pipeline
 * - Inventory alert workflow
 * - Customer onboarding flow
 * - Abandoned cart recovery
 * - Refund processing flow
 *
 * All templates use real Composio tool slugs for actual execution.
 */

import type { EcommerceWorkflowTemplate } from './ecommerce-template-types'

// ========================================
// 1. Order Fulfillment Pipeline
// ========================================

export const orderFulfillmentPipeline: EcommerceWorkflowTemplate = {
  id: 'order-fulfillment-pipeline',
  name: 'Order Fulfillment Pipeline',
  description: 'Complete order processing: Order received -> Pack -> Ship -> Notify customer -> Track delivery. Automates the entire fulfillment lifecycle.',
  category: 'order-management',
  icon: '📦',
  tags: ['orders', 'fulfillment', 'shipping', 'tracking', 'automation'],
  version: '1.0.0',
  isPopular: true,
  isNew: false,

  requiredIntegrations: [
    { name: 'Shopify', slug: 'shopify', required: false, description: 'E-commerce platform for orders' },
    { name: 'WooCommerce', slug: 'woocommerce', required: false, description: 'Alternative e-commerce platform' },
    { name: 'ShipStation', slug: 'shipstation', required: true, description: 'Shipping label generation' },
    { name: 'Gmail', slug: 'gmail', required: true, description: 'Customer notifications' },
    { name: 'Slack', slug: 'slack', required: false, description: 'Team notifications' },
    { name: 'Google Sheets', slug: 'googlesheets', required: true, description: 'Order tracking log' },
  ],

  composioTools: [
    'SHOPIFY_GET_ORDER',
    'SHOPIFY_UPDATE_ORDER',
    'SHIPSTATION_CREATE_LABEL',
    'SHIPSTATION_GET_TRACKING',
    'GMAIL_SEND_EMAIL',
    'SLACK_SEND_MESSAGE',
    'GOOGLESHEETS_APPEND_DATA',
  ],

  trigger: {
    type: 'webhook',
    config: {
      source: 'ecommerce_platform',
      event: 'order.created',
      filter: { status: 'paid' },
    },
  },

  inputMappings: [
    { field: 'order_id', source: 'trigger', path: 'order.id', default: null },
    { field: 'customer_email', source: 'trigger', path: 'order.customer.email', default: null },
    { field: 'customer_name', source: 'trigger', path: 'order.customer.name', default: 'Customer' },
    { field: 'shipping_address', source: 'trigger', path: 'order.shipping_address', default: null },
    { field: 'items', source: 'trigger', path: 'order.line_items', default: [] },
    { field: 'total', source: 'trigger', path: 'order.total_price', default: '0.00' },
  ],

  outputMappings: [
    { field: 'tracking_number', destination: 'result', path: 'shipment.tracking_number' },
    { field: 'carrier', destination: 'result', path: 'shipment.carrier' },
    { field: 'estimated_delivery', destination: 'result', path: 'shipment.estimated_delivery' },
    { field: 'fulfillment_status', destination: 'result', path: 'status' },
  ],

  estimatedExecutionTime: '2-5 minutes',
  complexity: 'intermediate',
  setupTimeMinutes: 20,

  definition: {
    nodes: [
      {
        id: 'start',
        type: 'start',
        label: 'New Order Received',
        config: {
          trigger: 'webhook',
          source: 'ecommerce_platform',
          event: 'order.created',
        },
        position: { x: 50, y: 200 },
      },
      {
        id: 'validate-order',
        type: 'condition',
        label: 'Validate Order',
        config: {
          conditions: [
            { if: 'order.status === "paid" && order.shipping_address !== null', then: 'prepare-packing' },
            { else: 'order-invalid' },
          ],
        },
        position: { x: 200, y: 200 },
      },
      {
        id: 'prepare-packing',
        type: 'transform',
        label: 'Prepare Packing List',
        config: {
          operations: [
            { type: 'pick', config: { fields: ['order_id', 'items', 'shipping_address', 'special_instructions'] } },
            { type: 'map', config: { field: 'items', template: '{{qty}}x {{name}} (SKU: {{sku}})' } },
          ],
        },
        position: { x: 350, y: 150 },
      },
      {
        id: 'order-invalid',
        type: 'notification',
        label: 'Flag Invalid Order',
        config: {
          channel: 'slack',
          template: 'order_validation_failed',
          parameters: {
            channel: '{{config.alerts_channel}}',
            text: '⚠️ Order #{{order.id}} failed validation: {{validation.reason}}',
          },
        },
        position: { x: 350, y: 300 },
      },
      {
        id: 'create-shipment',
        type: 'integration',
        label: 'Create Shipping Label',
        config: {
          tool: 'SHIPSTATION_CREATE_LABEL',
          parameters: {
            order_id: '{{order.id}}',
            carrier_code: '{{config.preferred_carrier}}',
            service_code: '{{config.shipping_service}}',
            ship_to: {
              name: '{{order.customer_name}}',
              street1: '{{order.shipping_address.address1}}',
              street2: '{{order.shipping_address.address2}}',
              city: '{{order.shipping_address.city}}',
              state: '{{order.shipping_address.province}}',
              postal_code: '{{order.shipping_address.zip}}',
              country: '{{order.shipping_address.country}}',
            },
            weight: '{{calculated.package_weight}}',
            dimensions: '{{calculated.package_dimensions}}',
          },
        },
        position: { x: 500, y: 150 },
      },
      {
        id: 'update-order-status',
        type: 'integration',
        label: 'Update Order to Shipped',
        config: {
          tool: 'SHOPIFY_UPDATE_ORDER',
          fallback: 'WOOCOMMERCE_UPDATE_ORDER',
          parameters: {
            order_id: '{{order.id}}',
            fulfillment_status: 'shipped',
            tracking_number: '{{shipment.tracking_number}}',
            tracking_company: '{{shipment.carrier}}',
          },
        },
        position: { x: 650, y: 150 },
      },
      {
        id: 'notify-customer',
        type: 'integration',
        label: 'Send Shipping Notification',
        config: {
          tool: 'GMAIL_SEND_EMAIL',
          parameters: {
            to: '{{order.customer_email}}',
            subject: 'Your order #{{order.id}} has shipped!',
            body: `Hi {{order.customer_name}},

Great news! Your order has been shipped and is on its way.

📦 Order: #{{order.id}}
🚚 Carrier: {{shipment.carrier}}
📍 Tracking Number: {{shipment.tracking_number}}
📅 Estimated Delivery: {{shipment.estimated_delivery}}

Track your package: {{shipment.tracking_url}}

Items in your order:
{{#each order.items}}
- {{this.name}} x {{this.quantity}}
{{/each}}

Thank you for your order!

Best regards,
{{config.store_name}}`,
          },
        },
        position: { x: 800, y: 100 },
      },
      {
        id: 'log-fulfillment',
        type: 'integration',
        label: 'Log to Tracking Sheet',
        config: {
          tool: 'GOOGLESHEETS_APPEND_DATA',
          parameters: {
            spreadsheet_id: '{{config.tracking_spreadsheet_id}}',
            range: 'Fulfillment!A:H',
            values: [[
              '{{order.id}}',
              '{{order.customer_name}}',
              '{{order.customer_email}}',
              '{{shipment.tracking_number}}',
              '{{shipment.carrier}}',
              '{{shipment.estimated_delivery}}',
              '{{timestamp}}',
              'shipped',
            ]],
          },
        },
        position: { x: 800, y: 200 },
      },
      {
        id: 'notify-team',
        type: 'integration',
        label: 'Notify Fulfillment Team',
        config: {
          tool: 'SLACK_SEND_MESSAGE',
          parameters: {
            channel: '{{config.fulfillment_channel}}',
            text: `✅ *Order Shipped*\n\n📦 Order: #{{order.id}}\n👤 Customer: {{order.customer_name}}\n🚚 Tracking: {{shipment.tracking_number}} ({{shipment.carrier}})\n📅 ETA: {{shipment.estimated_delivery}}`,
          },
        },
        position: { x: 800, y: 300 },
      },
      {
        id: 'end',
        type: 'end',
        label: 'Order Fulfilled',
        config: {},
        position: { x: 950, y: 200 },
      },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'validate-order' },
      { id: 'e2', source: 'validate-order', target: 'prepare-packing', condition: 'valid' },
      { id: 'e3', source: 'validate-order', target: 'order-invalid', condition: 'invalid' },
      { id: 'e4', source: 'prepare-packing', target: 'create-shipment' },
      { id: 'e5', source: 'create-shipment', target: 'update-order-status' },
      { id: 'e6', source: 'update-order-status', target: 'notify-customer' },
      { id: 'e7', source: 'update-order-status', target: 'log-fulfillment' },
      { id: 'e8', source: 'update-order-status', target: 'notify-team' },
      { id: 'e9', source: 'notify-customer', target: 'end' },
      { id: 'e10', source: 'log-fulfillment', target: 'end' },
      { id: 'e11', source: 'notify-team', target: 'end' },
      { id: 'e12', source: 'order-invalid', target: 'end' },
    ],
  },

  exampleInput: {
    order: {
      id: 'ORD-98765',
      status: 'paid',
      customer: {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
      },
      shipping_address: {
        address1: '456 Oak Avenue',
        address2: 'Apt 12',
        city: 'Austin',
        province: 'TX',
        zip: '78701',
        country: 'US',
      },
      line_items: [
        { name: 'Wireless Earbuds', quantity: 1, sku: 'WE-001', price: 79.99 },
        { name: 'Phone Case', quantity: 2, sku: 'PC-005', price: 19.99 },
      ],
      total_price: '119.97',
    },
  },
  expectedOutput: 'Order packed, shipping label created, customer notified, tracking logged',

  businessValue: {
    estimatedTimeSavedPerMonth: '60+ hours',
    estimatedMoneySavedPerMonth: '$1,200',
    replacesManualProcess: 'Manual order fulfillment and tracking',
  },
}

// ========================================
// 2. Inventory Alert Workflow
// ========================================

export const inventoryAlertWorkflow: EcommerceWorkflowTemplate = {
  id: 'inventory-alert-workflow',
  name: 'Inventory Alert Workflow',
  description: 'Monitor inventory levels and automatically trigger reorder alerts, create purchase orders, and notify the team when stock is low.',
  category: 'inventory',
  icon: '📊',
  tags: ['inventory', 'stock', 'alerts', 'reorder', 'supply-chain'],
  version: '1.0.0',
  isPopular: true,
  isNew: false,

  requiredIntegrations: [
    { name: 'Shopify', slug: 'shopify', required: false, description: 'Inventory source' },
    { name: 'Google Sheets', slug: 'googlesheets', required: true, description: 'Inventory tracking' },
    { name: 'Gmail', slug: 'gmail', required: true, description: 'Supplier notifications' },
    { name: 'Slack', slug: 'slack', required: true, description: 'Team alerts' },
    { name: 'Airtable', slug: 'airtable', required: false, description: 'Purchase order management' },
  ],

  composioTools: [
    'SHOPIFY_LIST_PRODUCTS',
    'SHOPIFY_GET_INVENTORY_LEVELS',
    'GOOGLESHEETS_GET_DATA',
    'GOOGLESHEETS_UPDATE_DATA',
    'GMAIL_SEND_EMAIL',
    'SLACK_SEND_MESSAGE',
    'AIRTABLE_CREATE_RECORD',
  ],

  trigger: {
    type: 'schedule',
    config: {
      cron: '0 9 * * *', // Daily at 9 AM
      timezone: 'UTC',
      allowManual: true,
    },
  },

  inputMappings: [
    { field: 'low_stock_threshold', source: 'config', path: 'thresholds.low_stock', default: 10 },
    { field: 'critical_threshold', source: 'config', path: 'thresholds.critical', default: 5 },
    { field: 'reorder_quantity', source: 'config', path: 'reorder.default_quantity', default: 50 },
  ],

  outputMappings: [
    { field: 'low_stock_items', destination: 'result', path: 'alerts.low_stock' },
    { field: 'critical_items', destination: 'result', path: 'alerts.critical' },
    { field: 'reorders_created', destination: 'result', path: 'actions.reorders' },
  ],

  estimatedExecutionTime: '1-3 minutes',
  complexity: 'beginner',
  setupTimeMinutes: 15,

  definition: {
    nodes: [
      {
        id: 'start',
        type: 'start',
        label: 'Inventory Check Triggered',
        config: {
          trigger: 'schedule',
          cron: '0 9 * * *',
        },
        position: { x: 50, y: 200 },
      },
      {
        id: 'fetch-inventory',
        type: 'integration',
        label: 'Fetch Current Inventory',
        config: {
          tool: 'SHOPIFY_GET_INVENTORY_LEVELS',
          fallback: 'GOOGLESHEETS_GET_DATA',
          parameters: {
            location_ids: '{{config.warehouse_locations}}',
          },
        },
        position: { x: 200, y: 200 },
      },
      {
        id: 'analyze-levels',
        type: 'ai-agent',
        label: 'Analyze Stock Levels',
        config: {
          prompt: `Analyze the following inventory data and identify:
1. Items below critical threshold ({{config.critical_threshold}} units)
2. Items below low stock threshold ({{config.low_stock_threshold}} units)
3. Items with high turnover that may need priority reorder
4. Estimated days until stockout for each low item

Inventory Data: {{inventory}}

Return a structured JSON with:
- critical_items: [{sku, name, current_stock, days_to_stockout, recommended_reorder_qty}]
- low_stock_items: [{sku, name, current_stock, days_to_stockout, recommended_reorder_qty}]
- summary: {total_items_checked, critical_count, low_stock_count, healthy_count}`,
          model: 'claude-3-5-haiku-20241022',
          outputFormat: 'json',
        },
        position: { x: 350, y: 200 },
      },
      {
        id: 'check-critical',
        type: 'condition',
        label: 'Check for Critical Items',
        config: {
          conditions: [
            { if: 'analysis.critical_items.length > 0', then: 'create-urgent-reorder' },
            { else: 'check-low-stock' },
          ],
        },
        position: { x: 500, y: 200 },
      },
      {
        id: 'create-urgent-reorder',
        type: 'integration',
        label: 'Create Urgent Purchase Order',
        config: {
          tool: 'AIRTABLE_CREATE_RECORD',
          fallback: 'GOOGLESHEETS_APPEND_DATA',
          parameters: {
            base_id: '{{config.airtable_base}}',
            table: 'Purchase Orders',
            fields: {
              order_type: 'URGENT',
              items: '{{analysis.critical_items}}',
              status: 'pending_approval',
              created_at: '{{timestamp}}',
              priority: 'high',
            },
          },
        },
        position: { x: 650, y: 100 },
      },
      {
        id: 'notify-urgent',
        type: 'integration',
        label: 'Send Urgent Alert',
        config: {
          tool: 'SLACK_SEND_MESSAGE',
          parameters: {
            channel: '{{config.urgent_alerts_channel}}',
            text: `🚨 *URGENT INVENTORY ALERT*\n\n{{analysis.summary.critical_count}} items are critically low!\n\n{{#each analysis.critical_items}}\n• *{{this.name}}* ({{this.sku}}): {{this.current_stock}} units left (~{{this.days_to_stockout}} days)\n{{/each}}\n\n⚡ Purchase order created: {{purchase_order.id}}`,
          },
        },
        position: { x: 800, y: 100 },
      },
      {
        id: 'check-low-stock',
        type: 'condition',
        label: 'Check for Low Stock Items',
        config: {
          conditions: [
            { if: 'analysis.low_stock_items.length > 0', then: 'create-standard-reorder' },
            { else: 'all-healthy' },
          ],
        },
        position: { x: 650, y: 250 },
      },
      {
        id: 'create-standard-reorder',
        type: 'integration',
        label: 'Create Standard Reorder',
        config: {
          tool: 'GMAIL_SEND_EMAIL',
          parameters: {
            to: '{{config.supplier_email}}',
            subject: 'Reorder Request - {{config.store_name}}',
            body: `Hello,

We need to reorder the following items:

{{#each analysis.low_stock_items}}
- {{this.name}} (SKU: {{this.sku}}): {{this.recommended_reorder_qty}} units
{{/each}}

Please confirm availability and expected delivery date.

Thank you,
{{config.store_name}} Inventory Team`,
          },
        },
        position: { x: 800, y: 250 },
      },
      {
        id: 'all-healthy',
        type: 'notification',
        label: 'Log Healthy Status',
        config: {
          channel: 'slack',
          parameters: {
            channel: '{{config.inventory_channel}}',
            text: `✅ *Daily Inventory Check Complete*\n\n📊 {{analysis.summary.total_items_checked}} items checked\n🟢 All items are adequately stocked\n\n_Next check scheduled for tomorrow at 9 AM_`,
          },
        },
        position: { x: 800, y: 350 },
      },
      {
        id: 'update-tracking',
        type: 'integration',
        label: 'Update Inventory Log',
        config: {
          tool: 'GOOGLESHEETS_APPEND_DATA',
          parameters: {
            spreadsheet_id: '{{config.inventory_log_spreadsheet}}',
            range: 'Daily Checks!A:F',
            values: [[
              '{{timestamp}}',
              '{{analysis.summary.total_items_checked}}',
              '{{analysis.summary.critical_count}}',
              '{{analysis.summary.low_stock_count}}',
              '{{analysis.summary.healthy_count}}',
              '{{#if purchase_order}}{{purchase_order.id}}{{else}}N/A{{/if}}',
            ]],
          },
        },
        position: { x: 950, y: 200 },
      },
      {
        id: 'end',
        type: 'end',
        label: 'Inventory Check Complete',
        config: {},
        position: { x: 1100, y: 200 },
      },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'fetch-inventory' },
      { id: 'e2', source: 'fetch-inventory', target: 'analyze-levels' },
      { id: 'e3', source: 'analyze-levels', target: 'check-critical' },
      { id: 'e4', source: 'check-critical', target: 'create-urgent-reorder', condition: 'critical' },
      { id: 'e5', source: 'check-critical', target: 'check-low-stock', condition: 'not_critical' },
      { id: 'e6', source: 'create-urgent-reorder', target: 'notify-urgent' },
      { id: 'e7', source: 'notify-urgent', target: 'check-low-stock' },
      { id: 'e8', source: 'check-low-stock', target: 'create-standard-reorder', condition: 'low_stock' },
      { id: 'e9', source: 'check-low-stock', target: 'all-healthy', condition: 'healthy' },
      { id: 'e10', source: 'create-standard-reorder', target: 'update-tracking' },
      { id: 'e11', source: 'all-healthy', target: 'update-tracking' },
      { id: 'e12', source: 'update-tracking', target: 'end' },
    ],
  },

  exampleInput: {
    config: {
      low_stock_threshold: 10,
      critical_threshold: 5,
      warehouse_locations: ['loc_main', 'loc_secondary'],
    },
  },
  expectedOutput: 'Inventory analyzed, low stock alerts sent, reorder requests created',

  businessValue: {
    estimatedTimeSavedPerMonth: '20+ hours',
    estimatedMoneySavedPerMonth: '$500',
    replacesManualProcess: 'Manual inventory monitoring and reorder management',
  },
}

// ========================================
// 3. Customer Onboarding Flow
// ========================================

export const customerOnboardingFlow: EcommerceWorkflowTemplate = {
  id: 'customer-onboarding-flow',
  name: 'Customer Onboarding Flow',
  description: 'Automated new customer welcome journey: Welcome email -> Segment customer -> Add to CRM -> Trigger personalized follow-up sequence.',
  category: 'customer-lifecycle',
  icon: '👋',
  tags: ['customers', 'onboarding', 'email', 'crm', 'segmentation'],
  version: '1.0.0',
  isPopular: true,
  isNew: false,

  requiredIntegrations: [
    { name: 'Shopify', slug: 'shopify', required: false, description: 'Customer data source' },
    { name: 'Gmail', slug: 'gmail', required: true, description: 'Welcome emails' },
    { name: 'HubSpot', slug: 'hubspot', required: false, description: 'CRM management' },
    { name: 'Mailchimp', slug: 'mailchimp', required: false, description: 'Email marketing' },
    { name: 'Google Sheets', slug: 'googlesheets', required: true, description: 'Customer tracking' },
    { name: 'Slack', slug: 'slack', required: false, description: 'Team notifications' },
  ],

  composioTools: [
    'SHOPIFY_GET_CUSTOMER',
    'GMAIL_SEND_EMAIL',
    'HUBSPOT_CREATE_CONTACT',
    'HUBSPOT_UPDATE_CONTACT',
    'MAILCHIMP_ADD_SUBSCRIBER',
    'GOOGLESHEETS_APPEND_DATA',
    'SLACK_SEND_MESSAGE',
  ],

  trigger: {
    type: 'webhook',
    config: {
      source: 'ecommerce_platform',
      event: 'customer.created',
    },
  },

  inputMappings: [
    { field: 'customer_id', source: 'trigger', path: 'customer.id', default: null },
    { field: 'email', source: 'trigger', path: 'customer.email', default: null },
    { field: 'first_name', source: 'trigger', path: 'customer.first_name', default: 'Customer' },
    { field: 'last_name', source: 'trigger', path: 'customer.last_name', default: '' },
    { field: 'first_order', source: 'trigger', path: 'customer.orders[0]', default: null },
  ],

  outputMappings: [
    { field: 'crm_contact_id', destination: 'result', path: 'crm.contact_id' },
    { field: 'segment', destination: 'result', path: 'segmentation.segment' },
    { field: 'onboarding_status', destination: 'result', path: 'status' },
  ],

  estimatedExecutionTime: '30-60 seconds',
  complexity: 'beginner',
  setupTimeMinutes: 15,

  definition: {
    nodes: [
      {
        id: 'start',
        type: 'start',
        label: 'New Customer Created',
        config: {
          trigger: 'webhook',
          source: 'ecommerce_platform',
          event: 'customer.created',
        },
        position: { x: 50, y: 200 },
      },
      {
        id: 'enrich-customer',
        type: 'ai-agent',
        label: 'Analyze & Segment Customer',
        config: {
          prompt: `Analyze this new customer and determine their segment based on their first order and profile:

Customer Data:
- Name: {{customer.first_name}} {{customer.last_name}}
- Email: {{customer.email}}
- First Order Value: {{customer.first_order.total}}
- Products Purchased: {{customer.first_order.items}}
- Location: {{customer.default_address.city}}, {{customer.default_address.country}}

Determine:
1. Customer Segment: (vip, standard, budget, first_timer)
2. Interest Categories based on products purchased
3. Personalized welcome message angle
4. Recommended follow-up products
5. Best email sequence to enroll in

Return JSON with: {segment, interests, welcome_angle, recommended_products, email_sequence}`,
          model: 'claude-3-5-haiku-20241022',
          outputFormat: 'json',
        },
        position: { x: 200, y: 200 },
      },
      {
        id: 'send-welcome',
        type: 'integration',
        label: 'Send Welcome Email',
        config: {
          tool: 'GMAIL_SEND_EMAIL',
          parameters: {
            to: '{{customer.email}}',
            subject: 'Welcome to {{config.store_name}}, {{customer.first_name}}! 🎉',
            body: `Hi {{customer.first_name}},

Welcome to the {{config.store_name}} family! We're thrilled to have you.

{{segmentation.welcome_angle}}

Here's what you can expect:
✓ Exclusive access to new arrivals
✓ Member-only discounts
✓ Priority customer support

As a thank you for your first order, here's a special 10% off code for your next purchase: WELCOME10

{{#if segmentation.recommended_products}}
Based on your recent purchase, you might also love:
{{#each segmentation.recommended_products}}
- {{this.name}}
{{/each}}
{{/if}}

Questions? Just reply to this email - we're here to help!

Cheers,
The {{config.store_name}} Team

P.S. Follow us on social media for inspiration and sneak peeks!`,
          },
        },
        position: { x: 350, y: 100 },
      },
      {
        id: 'add-to-crm',
        type: 'integration',
        label: 'Add to CRM',
        config: {
          tool: 'HUBSPOT_CREATE_CONTACT',
          fallback: 'GOOGLESHEETS_APPEND_DATA',
          parameters: {
            email: '{{customer.email}}',
            firstname: '{{customer.first_name}}',
            lastname: '{{customer.last_name}}',
            phone: '{{customer.phone}}',
            customer_segment: '{{segmentation.segment}}',
            interests: '{{segmentation.interests}}',
            first_order_value: '{{customer.first_order.total}}',
            source: 'ecommerce',
            lifecycle_stage: 'customer',
          },
        },
        position: { x: 350, y: 200 },
      },
      {
        id: 'add-to-email-list',
        type: 'integration',
        label: 'Add to Email Sequence',
        config: {
          tool: 'MAILCHIMP_ADD_SUBSCRIBER',
          parameters: {
            list_id: '{{config.mailchimp_list_id}}',
            email_address: '{{customer.email}}',
            merge_fields: {
              FNAME: '{{customer.first_name}}',
              LNAME: '{{customer.last_name}}',
              SEGMENT: '{{segmentation.segment}}',
            },
            tags: ['new_customer', '{{segmentation.segment}}', '{{segmentation.email_sequence}}'],
          },
        },
        position: { x: 350, y: 300 },
      },
      {
        id: 'log-onboarding',
        type: 'integration',
        label: 'Log to Tracking Sheet',
        config: {
          tool: 'GOOGLESHEETS_APPEND_DATA',
          parameters: {
            spreadsheet_id: '{{config.customer_tracking_spreadsheet}}',
            range: 'New Customers!A:H',
            values: [[
              '{{customer.id}}',
              '{{customer.email}}',
              '{{customer.first_name}} {{customer.last_name}}',
              '{{segmentation.segment}}',
              '{{customer.first_order.total}}',
              '{{segmentation.interests}}',
              '{{timestamp}}',
              'onboarded',
            ]],
          },
        },
        position: { x: 500, y: 200 },
      },
      {
        id: 'check-vip',
        type: 'condition',
        label: 'Check if VIP Customer',
        config: {
          conditions: [
            { if: 'segmentation.segment === "vip"', then: 'notify-sales' },
            { else: 'end' },
          ],
        },
        position: { x: 650, y: 200 },
      },
      {
        id: 'notify-sales',
        type: 'integration',
        label: 'Alert Sales Team',
        config: {
          tool: 'SLACK_SEND_MESSAGE',
          parameters: {
            channel: '{{config.sales_channel}}',
            text: `🌟 *New VIP Customer Alert*\n\n👤 {{customer.first_name}} {{customer.last_name}}\n📧 {{customer.email}}\n💰 First Order: {{customer.first_order.total}}\n🏷️ Interests: {{segmentation.interests}}\n\n_Consider reaching out with a personal welcome!_`,
          },
        },
        position: { x: 800, y: 150 },
      },
      {
        id: 'end',
        type: 'end',
        label: 'Onboarding Complete',
        config: {},
        position: { x: 950, y: 200 },
      },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'enrich-customer' },
      { id: 'e2', source: 'enrich-customer', target: 'send-welcome' },
      { id: 'e3', source: 'enrich-customer', target: 'add-to-crm' },
      { id: 'e4', source: 'enrich-customer', target: 'add-to-email-list' },
      { id: 'e5', source: 'send-welcome', target: 'log-onboarding' },
      { id: 'e6', source: 'add-to-crm', target: 'log-onboarding' },
      { id: 'e7', source: 'add-to-email-list', target: 'log-onboarding' },
      { id: 'e8', source: 'log-onboarding', target: 'check-vip' },
      { id: 'e9', source: 'check-vip', target: 'notify-sales', condition: 'vip' },
      { id: 'e10', source: 'check-vip', target: 'end', condition: 'not_vip' },
      { id: 'e11', source: 'notify-sales', target: 'end' },
    ],
  },

  exampleInput: {
    customer: {
      id: 'cust_123456',
      email: 'john.doe@example.com',
      first_name: 'John',
      last_name: 'Doe',
      first_order: {
        total: '$249.99',
        items: [{ name: 'Premium Wireless Headphones', quantity: 1 }],
      },
      default_address: {
        city: 'New York',
        country: 'US',
      },
    },
  },
  expectedOutput: 'Welcome email sent, customer added to CRM, enrolled in email sequence',

  businessValue: {
    estimatedTimeSavedPerMonth: '30+ hours',
    estimatedMoneySavedPerMonth: '$600',
    replacesManualProcess: 'Manual customer onboarding and CRM data entry',
  },
}

// ========================================
// 4. Abandoned Cart Recovery
// ========================================

export const abandonedCartRecovery: EcommerceWorkflowTemplate = {
  id: 'abandoned-cart-recovery',
  name: 'Abandoned Cart Recovery',
  description: 'Recover lost sales: Cart abandoned -> Wait period -> Send reminder email -> Offer discount -> Track recovery rate.',
  category: 'marketing',
  icon: '🛒',
  tags: ['cart', 'recovery', 'email', 'discount', 'conversion'],
  version: '1.0.0',
  isPopular: true,
  isNew: true,

  requiredIntegrations: [
    { name: 'Shopify', slug: 'shopify', required: false, description: 'Cart data source' },
    { name: 'Gmail', slug: 'gmail', required: true, description: 'Recovery emails' },
    { name: 'Google Sheets', slug: 'googlesheets', required: true, description: 'Recovery tracking' },
    { name: 'Slack', slug: 'slack', required: false, description: 'Recovery notifications' },
  ],

  composioTools: [
    'SHOPIFY_GET_ABANDONED_CHECKOUTS',
    'SHOPIFY_GET_CHECKOUT',
    'SHOPIFY_CREATE_DISCOUNT',
    'GMAIL_SEND_EMAIL',
    'GOOGLESHEETS_APPEND_DATA',
    'GOOGLESHEETS_UPDATE_DATA',
    'SLACK_SEND_MESSAGE',
  ],

  trigger: {
    type: 'event',
    config: {
      source: 'ecommerce_platform',
      event: 'checkout.abandoned',
      filter: {
        abandoned_duration_hours: { gte: 1 },
      },
    },
  },

  inputMappings: [
    { field: 'checkout_id', source: 'trigger', path: 'checkout.id', default: null },
    { field: 'customer_email', source: 'trigger', path: 'checkout.email', default: null },
    { field: 'customer_name', source: 'trigger', path: 'checkout.customer.first_name', default: 'there' },
    { field: 'cart_items', source: 'trigger', path: 'checkout.line_items', default: [] },
    { field: 'cart_total', source: 'trigger', path: 'checkout.total_price', default: '0.00' },
    { field: 'recovery_url', source: 'trigger', path: 'checkout.abandoned_checkout_url', default: null },
  ],

  outputMappings: [
    { field: 'emails_sent', destination: 'result', path: 'recovery.emails_sent' },
    { field: 'discount_code', destination: 'result', path: 'recovery.discount_code' },
    { field: 'recovered', destination: 'result', path: 'recovery.status' },
  ],

  estimatedExecutionTime: '72+ hours (3-email sequence)',
  complexity: 'intermediate',
  setupTimeMinutes: 25,

  definition: {
    nodes: [
      {
        id: 'start',
        type: 'start',
        label: 'Cart Abandoned Detected',
        config: {
          trigger: 'event',
          source: 'ecommerce_platform',
          event: 'checkout.abandoned',
        },
        position: { x: 50, y: 200 },
      },
      {
        id: 'wait-1h',
        type: 'wait',
        label: 'Wait 1 Hour',
        config: {
          duration: '1h',
          durationMs: 3600000,
        },
        position: { x: 150, y: 200 },
      },
      {
        id: 'check-purchased',
        type: 'condition',
        label: 'Check if Purchased',
        config: {
          conditions: [
            { if: 'checkout.completed_at !== null', then: 'already-purchased' },
            { else: 'send-reminder-1' },
          ],
        },
        position: { x: 250, y: 200 },
      },
      {
        id: 'already-purchased',
        type: 'end',
        label: 'Already Converted',
        config: {},
        position: { x: 350, y: 100 },
      },
      {
        id: 'send-reminder-1',
        type: 'integration',
        label: 'Send Reminder Email #1',
        config: {
          tool: 'GMAIL_SEND_EMAIL',
          parameters: {
            to: '{{checkout.email}}',
            subject: 'Did you forget something, {{checkout.customer.first_name}}?',
            body: `Hi {{checkout.customer.first_name}},

We noticed you left some great items in your cart! Don't worry - we saved them for you.

🛒 Your Cart:
{{#each checkout.line_items}}
- {{this.title}} ({{this.quantity}}x) - {{this.price}}
{{/each}}

💰 Total: {{checkout.total_price}}

[Complete Your Order]({{checkout.abandoned_checkout_url}})

Your items are waiting! Complete your order before they sell out.

Questions? Just reply to this email.

Best,
{{config.store_name}}`,
          },
        },
        position: { x: 400, y: 200 },
      },
      {
        id: 'log-email-1',
        type: 'integration',
        label: 'Log Email Sent',
        config: {
          tool: 'GOOGLESHEETS_APPEND_DATA',
          parameters: {
            spreadsheet_id: '{{config.recovery_tracking_spreadsheet}}',
            range: 'Recovery Emails!A:F',
            values: [[
              '{{checkout.id}}',
              '{{checkout.email}}',
              '{{checkout.total_price}}',
              '1',
              '{{timestamp}}',
              'sent',
            ]],
          },
        },
        position: { x: 550, y: 200 },
      },
      {
        id: 'wait-24h',
        type: 'wait',
        label: 'Wait 24 Hours',
        config: {
          duration: '24h',
          durationMs: 86400000,
        },
        position: { x: 700, y: 200 },
      },
      {
        id: 'check-purchased-2',
        type: 'condition',
        label: 'Check if Purchased',
        config: {
          conditions: [
            { if: 'checkout.completed_at !== null', then: 'mark-recovered' },
            { else: 'create-discount' },
          ],
        },
        position: { x: 850, y: 200 },
      },
      {
        id: 'mark-recovered',
        type: 'notification',
        label: 'Cart Recovered!',
        config: {
          channel: 'slack',
          parameters: {
            channel: '{{config.sales_channel}}',
            text: `🎉 *Cart Recovered!*\n\n💰 Value: {{checkout.total_price}}\n👤 Customer: {{checkout.email}}\n📧 Recovered via: Email #1`,
          },
        },
        position: { x: 950, y: 100 },
      },
      {
        id: 'create-discount',
        type: 'integration',
        label: 'Create Personal Discount',
        config: {
          tool: 'SHOPIFY_CREATE_DISCOUNT',
          parameters: {
            code: 'COMEBACK-{{checkout.id}}',
            type: 'percentage',
            value: 10,
            usage_limit: 1,
            expires_at: '{{date.add(3, "days")}}',
          },
        },
        position: { x: 950, y: 200 },
      },
      {
        id: 'send-reminder-2',
        type: 'integration',
        label: 'Send Discount Email #2',
        config: {
          tool: 'GMAIL_SEND_EMAIL',
          parameters: {
            to: '{{checkout.email}}',
            subject: '10% OFF just for you, {{checkout.customer.first_name}}! ⭐',
            body: `Hi {{checkout.customer.first_name}},

We really want you to have those items in your cart, so here's a special offer just for you!

🎁 *Your Exclusive Code: {{discount.code}}*
💰 *Save 10% on your order!*

🛒 Your Cart:
{{#each checkout.line_items}}
- {{this.title}} ({{this.quantity}}x) - {{this.price}}
{{/each}}

Original Total: {{checkout.total_price}}
*With Discount: {{calculated.discounted_total}}*

[Claim Your Discount]({{checkout.abandoned_checkout_url}}?discount={{discount.code}})

⏰ This code expires in 3 days - don't miss out!

Cheers,
{{config.store_name}}

P.S. This offer was made just for you and can only be used once.`,
          },
        },
        position: { x: 1100, y: 200 },
      },
      {
        id: 'wait-48h',
        type: 'wait',
        label: 'Wait 48 Hours',
        config: {
          duration: '48h',
          durationMs: 172800000,
        },
        position: { x: 1250, y: 200 },
      },
      {
        id: 'check-purchased-3',
        type: 'condition',
        label: 'Final Check',
        config: {
          conditions: [
            { if: 'checkout.completed_at !== null', then: 'recovered-with-discount' },
            { else: 'send-final-reminder' },
          ],
        },
        position: { x: 1400, y: 200 },
      },
      {
        id: 'recovered-with-discount',
        type: 'notification',
        label: 'Recovered with Discount!',
        config: {
          channel: 'slack',
          parameters: {
            channel: '{{config.sales_channel}}',
            text: `🎉 *Cart Recovered with Discount!*\n\n💰 Value: {{calculated.discounted_total}}\n👤 Customer: {{checkout.email}}\n🎁 Code Used: {{discount.code}}`,
          },
        },
        position: { x: 1500, y: 100 },
      },
      {
        id: 'send-final-reminder',
        type: 'integration',
        label: 'Send Final Email #3',
        config: {
          tool: 'GMAIL_SEND_EMAIL',
          parameters: {
            to: '{{checkout.email}}',
            subject: 'Last chance: Your cart is expiring ⏰',
            body: `Hi {{checkout.customer.first_name}},

This is our last reminder - your cart (and your 10% discount) will expire soon!

🛒 Your Saved Items:
{{#each checkout.line_items}}
- {{this.title}}
{{/each}}

🎁 Your Code: {{discount.code}} (10% OFF)
⏰ Expires: Tomorrow!

[Complete Your Order Now]({{checkout.abandoned_checkout_url}}?discount={{discount.code}})

After this, your cart will be cleared and the discount will expire.

No pressure - but we'd hate for you to miss out!

Best,
{{config.store_name}}`,
          },
        },
        position: { x: 1500, y: 200 },
      },
      {
        id: 'log-final',
        type: 'integration',
        label: 'Log Final Status',
        config: {
          tool: 'GOOGLESHEETS_UPDATE_DATA',
          parameters: {
            spreadsheet_id: '{{config.recovery_tracking_spreadsheet}}',
            range: 'Recovery Summary!A:E',
            values: [[
              '{{checkout.id}}',
              '{{checkout.email}}',
              '{{checkout.total_price}}',
              '{{recovery.status}}',
              '{{timestamp}}',
            ]],
          },
        },
        position: { x: 1650, y: 200 },
      },
      {
        id: 'end',
        type: 'end',
        label: 'Recovery Sequence Complete',
        config: {},
        position: { x: 1800, y: 200 },
      },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'wait-1h' },
      { id: 'e2', source: 'wait-1h', target: 'check-purchased' },
      { id: 'e3', source: 'check-purchased', target: 'already-purchased', condition: 'purchased' },
      { id: 'e4', source: 'check-purchased', target: 'send-reminder-1', condition: 'not_purchased' },
      { id: 'e5', source: 'send-reminder-1', target: 'log-email-1' },
      { id: 'e6', source: 'log-email-1', target: 'wait-24h' },
      { id: 'e7', source: 'wait-24h', target: 'check-purchased-2' },
      { id: 'e8', source: 'check-purchased-2', target: 'mark-recovered', condition: 'purchased' },
      { id: 'e9', source: 'check-purchased-2', target: 'create-discount', condition: 'not_purchased' },
      { id: 'e10', source: 'create-discount', target: 'send-reminder-2' },
      { id: 'e11', source: 'send-reminder-2', target: 'wait-48h' },
      { id: 'e12', source: 'wait-48h', target: 'check-purchased-3' },
      { id: 'e13', source: 'check-purchased-3', target: 'recovered-with-discount', condition: 'purchased' },
      { id: 'e14', source: 'check-purchased-3', target: 'send-final-reminder', condition: 'not_purchased' },
      { id: 'e15', source: 'send-final-reminder', target: 'log-final' },
      { id: 'e16', source: 'mark-recovered', target: 'end' },
      { id: 'e17', source: 'recovered-with-discount', target: 'end' },
      { id: 'e18', source: 'log-final', target: 'end' },
    ],
  },

  exampleInput: {
    checkout: {
      id: 'chk_789012',
      email: 'jane@example.com',
      customer: { first_name: 'Jane' },
      line_items: [
        { title: 'Yoga Mat', quantity: 1, price: '$49.99' },
        { title: 'Water Bottle', quantity: 2, price: '$24.99' },
      ],
      total_price: '$99.97',
      abandoned_checkout_url: 'https://store.com/checkout/chk_789012',
    },
  },
  expectedOutput: '3-email sequence sent, discount offered, recovery tracked',

  businessValue: {
    estimatedTimeSavedPerMonth: '25+ hours',
    estimatedMoneySavedPerMonth: '$2,000+ in recovered revenue',
    replacesManualProcess: 'Manual cart recovery and discount management',
  },
}

// ========================================
// 5. Refund Processing Flow
// ========================================

export const refundProcessingFlow: EcommerceWorkflowTemplate = {
  id: 'refund-processing-flow',
  name: 'Refund Processing Flow',
  description: 'Streamlined refund handling: Refund request -> Validate eligibility -> Process refund -> Notify customer -> Update records.',
  category: 'returns-refunds',
  icon: '💸',
  tags: ['refunds', 'returns', 'customer-service', 'processing'],
  version: '1.0.0',
  isPopular: false,
  isNew: true,

  requiredIntegrations: [
    { name: 'Shopify', slug: 'shopify', required: false, description: 'Order and refund management' },
    { name: 'Stripe', slug: 'stripe', required: true, description: 'Payment processing' },
    { name: 'Gmail', slug: 'gmail', required: true, description: 'Customer notifications' },
    { name: 'Google Sheets', slug: 'googlesheets', required: true, description: 'Refund tracking' },
    { name: 'Slack', slug: 'slack', required: true, description: 'Team notifications' },
  ],

  composioTools: [
    'SHOPIFY_GET_ORDER',
    'SHOPIFY_CREATE_REFUND',
    'STRIPE_CREATE_REFUND',
    'STRIPE_GET_CHARGE',
    'GMAIL_SEND_EMAIL',
    'GOOGLESHEETS_APPEND_DATA',
    'SLACK_SEND_MESSAGE',
  ],

  trigger: {
    type: 'webhook',
    config: {
      source: 'support_platform',
      event: 'refund.requested',
    },
  },

  inputMappings: [
    { field: 'order_id', source: 'trigger', path: 'refund_request.order_id', default: null },
    { field: 'customer_email', source: 'trigger', path: 'refund_request.customer_email', default: null },
    { field: 'reason', source: 'trigger', path: 'refund_request.reason', default: 'Customer request' },
    { field: 'amount', source: 'trigger', path: 'refund_request.amount', default: null },
    { field: 'full_refund', source: 'trigger', path: 'refund_request.full_refund', default: true },
  ],

  outputMappings: [
    { field: 'refund_id', destination: 'result', path: 'refund.id' },
    { field: 'refund_status', destination: 'result', path: 'refund.status' },
    { field: 'refund_amount', destination: 'result', path: 'refund.amount' },
  ],

  estimatedExecutionTime: '1-2 minutes',
  complexity: 'intermediate',
  setupTimeMinutes: 20,

  definition: {
    nodes: [
      {
        id: 'start',
        type: 'start',
        label: 'Refund Requested',
        config: {
          trigger: 'webhook',
          source: 'support_platform',
          event: 'refund.requested',
        },
        position: { x: 50, y: 200 },
      },
      {
        id: 'fetch-order',
        type: 'integration',
        label: 'Fetch Order Details',
        config: {
          tool: 'SHOPIFY_GET_ORDER',
          parameters: {
            order_id: '{{refund_request.order_id}}',
          },
        },
        position: { x: 200, y: 200 },
      },
      {
        id: 'validate-eligibility',
        type: 'ai-agent',
        label: 'Validate Refund Eligibility',
        config: {
          prompt: `Analyze this refund request and determine eligibility:

Order Details:
- Order ID: {{order.id}}
- Order Date: {{order.created_at}}
- Order Status: {{order.fulfillment_status}}
- Order Total: {{order.total_price}}
- Items: {{order.line_items}}

Refund Request:
- Reason: {{refund_request.reason}}
- Amount Requested: {{refund_request.amount}}
- Full Refund: {{refund_request.full_refund}}

Refund Policy:
- Refund window: {{config.refund_window_days}} days
- Eligible statuses: unfulfilled, partially_fulfilled, delivered
- Excluded items: {{config.non_refundable_skus}}

Determine:
1. Is the request within the refund window?
2. Is the order status eligible?
3. Are all items eligible for refund?
4. Calculate the approved refund amount
5. Provide approval recommendation (APPROVED / NEEDS_REVIEW / DENIED)
6. Reason for decision

Return JSON: {eligible, within_window, status_eligible, approved_amount, recommendation, reason}`,
          model: 'claude-3-5-haiku-20241022',
          outputFormat: 'json',
        },
        position: { x: 350, y: 200 },
      },
      {
        id: 'check-eligibility',
        type: 'condition',
        label: 'Check Eligibility',
        config: {
          conditions: [
            { if: 'validation.recommendation === "APPROVED"', then: 'process-refund' },
            { if: 'validation.recommendation === "NEEDS_REVIEW"', then: 'escalate-review' },
            { else: 'deny-refund' },
          ],
        },
        position: { x: 500, y: 200 },
      },
      {
        id: 'process-refund',
        type: 'integration',
        label: 'Process Refund in Stripe',
        config: {
          tool: 'STRIPE_CREATE_REFUND',
          parameters: {
            charge: '{{order.payment.charge_id}}',
            amount: '{{validation.approved_amount}}',
            reason: 'requested_by_customer',
            metadata: {
              order_id: '{{order.id}}',
              original_reason: '{{refund_request.reason}}',
            },
          },
        },
        position: { x: 650, y: 100 },
      },
      {
        id: 'update-order',
        type: 'integration',
        label: 'Update Order in Shopify',
        config: {
          tool: 'SHOPIFY_CREATE_REFUND',
          parameters: {
            order_id: '{{order.id}}',
            note: 'Refund processed: {{refund_request.reason}}',
            notify: false,
            refund_line_items: '{{#if refund_request.full_refund}}{{order.line_items}}{{else}}{{refund_request.items}}{{/if}}',
          },
        },
        position: { x: 800, y: 100 },
      },
      {
        id: 'notify-customer-approved',
        type: 'integration',
        label: 'Notify Customer - Approved',
        config: {
          tool: 'GMAIL_SEND_EMAIL',
          parameters: {
            to: '{{refund_request.customer_email}}',
            subject: 'Your refund has been processed - Order #{{order.id}}',
            body: `Hi {{order.customer.first_name}},

Good news! Your refund request has been approved and processed.

📋 *Refund Details:*
- Order: #{{order.id}}
- Refund Amount: {{validation.approved_amount}}
- Refund ID: {{refund.id}}

💳 The refund will appear in your original payment method within 5-10 business days, depending on your bank.

We're sorry to see these items go! If there's anything we can do to make your next experience better, please let us know.

Thank you for your patience.

Best regards,
{{config.store_name}} Customer Support`,
          },
        },
        position: { x: 950, y: 100 },
      },
      {
        id: 'escalate-review',
        type: 'integration',
        label: 'Escalate for Review',
        config: {
          tool: 'SLACK_SEND_MESSAGE',
          parameters: {
            channel: '{{config.support_escalation_channel}}',
            text: `⚠️ *Refund Review Required*\n\n📋 Order: #{{order.id}}\n👤 Customer: {{refund_request.customer_email}}\n💰 Amount: {{refund_request.amount}}\n📝 Reason: {{refund_request.reason}}\n\n🔍 *Review Notes:*\n{{validation.reason}}\n\n_Please review and take action:_\n• React with ✅ to approve\n• React with ❌ to deny`,
          },
        },
        position: { x: 650, y: 200 },
      },
      {
        id: 'deny-refund',
        type: 'integration',
        label: 'Notify Customer - Denied',
        config: {
          tool: 'GMAIL_SEND_EMAIL',
          parameters: {
            to: '{{refund_request.customer_email}}',
            subject: 'Update on your refund request - Order #{{order.id}}',
            body: `Hi {{order.customer.first_name}},

Thank you for contacting us about your refund request for order #{{order.id}}.

After reviewing your request, we're unable to process a refund at this time.

📋 *Details:*
- Order: #{{order.id}}
- Requested Amount: {{refund_request.amount}}
- Reason: {{validation.reason}}

Our refund policy allows returns within {{config.refund_window_days}} days of purchase for eligible items.

If you believe this decision was made in error, or if you'd like to discuss alternatives, please reply to this email and our team will be happy to help.

We value your business and hope to serve you again soon.

Best regards,
{{config.store_name}} Customer Support`,
          },
        },
        position: { x: 650, y: 300 },
      },
      {
        id: 'log-refund',
        type: 'integration',
        label: 'Log Refund Record',
        config: {
          tool: 'GOOGLESHEETS_APPEND_DATA',
          parameters: {
            spreadsheet_id: '{{config.refund_log_spreadsheet}}',
            range: 'Refunds!A:I',
            values: [[
              '{{order.id}}',
              '{{refund_request.customer_email}}',
              '{{refund_request.reason}}',
              '{{refund_request.amount}}',
              '{{validation.approved_amount}}',
              '{{validation.recommendation}}',
              '{{#if refund}}{{refund.id}}{{else}}N/A{{/if}}',
              '{{timestamp}}',
              '{{validation.reason}}',
            ]],
          },
        },
        position: { x: 1100, y: 200 },
      },
      {
        id: 'notify-team',
        type: 'integration',
        label: 'Notify Finance Team',
        config: {
          tool: 'SLACK_SEND_MESSAGE',
          parameters: {
            channel: '{{config.finance_channel}}',
            text: `💸 *Refund Processed*\n\n📋 Order: #{{order.id}}\n💰 Amount: {{validation.approved_amount}}\n🔖 Refund ID: {{refund.id}}\n📝 Reason: {{refund_request.reason}}`,
          },
        },
        position: { x: 1100, y: 100 },
      },
      {
        id: 'end',
        type: 'end',
        label: 'Refund Flow Complete',
        config: {},
        position: { x: 1250, y: 200 },
      },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'fetch-order' },
      { id: 'e2', source: 'fetch-order', target: 'validate-eligibility' },
      { id: 'e3', source: 'validate-eligibility', target: 'check-eligibility' },
      { id: 'e4', source: 'check-eligibility', target: 'process-refund', condition: 'approved' },
      { id: 'e5', source: 'check-eligibility', target: 'escalate-review', condition: 'needs_review' },
      { id: 'e6', source: 'check-eligibility', target: 'deny-refund', condition: 'denied' },
      { id: 'e7', source: 'process-refund', target: 'update-order' },
      { id: 'e8', source: 'update-order', target: 'notify-customer-approved' },
      { id: 'e9', source: 'notify-customer-approved', target: 'notify-team' },
      { id: 'e10', source: 'notify-team', target: 'log-refund' },
      { id: 'e11', source: 'escalate-review', target: 'log-refund' },
      { id: 'e12', source: 'deny-refund', target: 'log-refund' },
      { id: 'e13', source: 'log-refund', target: 'end' },
    ],
  },

  exampleInput: {
    refund_request: {
      order_id: 'ORD-456789',
      customer_email: 'customer@example.com',
      reason: 'Item arrived damaged',
      amount: 89.99,
      full_refund: true,
    },
  },
  expectedOutput: 'Refund validated, processed via Stripe, customer notified, records updated',

  businessValue: {
    estimatedTimeSavedPerMonth: '35+ hours',
    estimatedMoneySavedPerMonth: '$700',
    replacesManualProcess: 'Manual refund processing and customer communication',
  },
}

// ========================================
// Template Collection Export
// ========================================

/**
 * All e-commerce workflow templates
 */
export const ecommerceTemplates: EcommerceWorkflowTemplate[] = [
  orderFulfillmentPipeline,
  inventoryAlertWorkflow,
  customerOnboardingFlow,
  abandonedCartRecovery,
  refundProcessingFlow,
]

/**
 * Get template by ID
 */
export function getEcommerceTemplateById(id: string): EcommerceWorkflowTemplate | undefined {
  return ecommerceTemplates.find(t => t.id === id)
}

/**
 * Get templates by category
 */
export function getEcommerceTemplatesByCategory(category: string): EcommerceWorkflowTemplate[] {
  return ecommerceTemplates.filter(t => t.category === category)
}

/**
 * Get popular templates
 */
export function getPopularEcommerceTemplates(): EcommerceWorkflowTemplate[] {
  return ecommerceTemplates.filter(t => t.isPopular)
}

/**
 * Get new templates
 */
export function getNewEcommerceTemplates(): EcommerceWorkflowTemplate[] {
  return ecommerceTemplates.filter(t => t.isNew)
}

/**
 * Search templates by tag or keyword
 */
export function searchEcommerceTemplates(query: string): EcommerceWorkflowTemplate[] {
  const lowerQuery = query.toLowerCase()
  return ecommerceTemplates.filter(t =>
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}
