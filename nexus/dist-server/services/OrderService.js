/**
 * OrderService - WhatsApp Order Extraction and Management
 *
 * Extracts order details from WhatsApp messages using pattern matching
 * and Claude AI. Manages order lifecycle with in-memory storage.
 *
 * Features:
 * - Bilingual order detection (English + Arabic)
 * - Claude AI-powered extraction for complex messages
 * - Pattern matching for structured order messages
 * - Auto-generated order IDs (ORD-YYYYMMDD-XXXX)
 * - In-memory Map-based storage (production: use database)
 * - Order status lifecycle management
 */
import { callClaude } from './claudeProxy.js';
// =============================================================================
// ORDER DETECTION KEYWORDS
// =============================================================================
// English order keywords
const ORDER_KEYWORDS_EN = [
    'order', 'buy', 'purchase', 'want', 'need', 'get me',
    'i want', 'i need', 'can i get', 'i\'d like', 'send me',
    'deliver', 'delivery', 'add to cart', 'checkout',
];
// Arabic order keywords
const ORDER_KEYWORDS_AR = [
    'أريد', 'اطلب', 'شراء', 'اشتري', 'ابي', 'ابغى',
    'طلب', 'اطلبلي', 'ابيها', 'ارسلي', 'ارسللي',
    'توصيل', 'طلبية', 'اريد شراء', 'بغيت',
    'عطني', 'ابي اطلب', 'حق التوصيل',
];
// Quantity patterns
const QUANTITY_PATTERNS = [
    /(\d+)\s*(?:x|×|pieces?|pcs?|units?|items?)/i,
    /(\d+)\s*(?:حبة|حبات|قطعة|قطع|عدد)/,
    /(?:x|×)\s*(\d+)/i,
];
// =============================================================================
// ORDER SERVICE
// =============================================================================
class OrderServiceClass {
    // In-memory order storage (keyed by orderId)
    orders = new Map();
    // Counter for today's orders (reset daily)
    dailyCounter = 0;
    counterDate = '';
    /**
     * Generate a unique order ID: ORD-YYYYMMDD-XXXX
     */
    generateOrderId() {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        // Reset counter if new day
        if (dateStr !== this.counterDate) {
            this.dailyCounter = 0;
            this.counterDate = dateStr;
        }
        this.dailyCounter++;
        const seq = String(this.dailyCounter).padStart(4, '0');
        return `ORD-${dateStr}-${seq}`;
    }
    /**
     * Check if a message looks like an order
     */
    isOrderMessage(message) {
        const lower = message.toLowerCase();
        // Check English keywords
        for (const kw of ORDER_KEYWORDS_EN) {
            if (lower.includes(kw))
                return true;
        }
        // Check Arabic keywords
        for (const kw of ORDER_KEYWORDS_AR) {
            if (message.includes(kw))
                return true;
        }
        // Check for quantity patterns (e.g., "3x", "2 pieces")
        for (const pattern of QUANTITY_PATTERNS) {
            if (pattern.test(message))
                return true;
        }
        return false;
    }
    /**
     * Extract order details from a message using Claude AI
     */
    async extractOrderFromMessage(message, customerPhone, customerName, catalogueItems) {
        try {
            const catalogueContext = catalogueItems && catalogueItems.length > 0
                ? `\n\nAvailable catalogue items:\n${catalogueItems.map(i => `- ${i.name}${i.price ? ` (${i.price} ${i.currency || 'KWD'})` : ''}`).join('\n')}`
                : '';
            const systemPrompt = `You are an order extraction AI. Extract order details from the customer message.
The message may be in English or Arabic (Gulf dialect).
${catalogueContext}

RESPOND WITH VALID JSON ONLY. No explanation text.

JSON format:
{
  "isOrder": true/false,
  "confidence": 0.0-1.0,
  "items": [
    {"name": "product name", "quantity": 1, "unitPrice": null, "currency": "KWD"}
  ],
  "deliveryAddress": "address if mentioned or null",
  "notes": "any special instructions or null",
  "totalAmount": null
}

Rules:
- isOrder: true if message contains a product order request
- confidence: how confident you are this is an order (0.0-1.0)
- items: extract product names and quantities. Default quantity to 1 if not specified.
- If catalogue items provided, match against them for correct names and prices
- deliveryAddress: extract if mentioned
- notes: any special instructions (e.g., "no onions", "extra spicy", "gift wrap")
- totalAmount: calculate if prices are known, otherwise null
- Currency defaults to KWD (Kuwaiti Dinar)`;
            const response = await callClaude({
                systemPrompt,
                userMessage: message,
                maxTokens: 512,
                model: 'claude-3-5-haiku-20241022', // Fast + cheap for extraction
            });
            const parsed = JSON.parse(response.text);
            if (!parsed.isOrder) {
                return {
                    isOrder: false,
                    confidence: parsed.confidence || 0,
                    rawMessage: message,
                };
            }
            return {
                isOrder: true,
                confidence: parsed.confidence || 0.8,
                order: {
                    customerPhone,
                    customerName: customerName || 'Unknown',
                    items: (parsed.items || []).map((item) => ({
                        name: String(item.name || 'Unknown item'),
                        quantity: Number(item.quantity) || 1,
                        unitPrice: item.unitPrice != null ? Number(item.unitPrice) : undefined,
                        currency: String(item.currency || 'KWD'),
                    })),
                    totalAmount: parsed.totalAmount != null ? Number(parsed.totalAmount) : undefined,
                    currency: 'KWD',
                    deliveryAddress: parsed.deliveryAddress || undefined,
                    notes: parsed.notes || undefined,
                    source: 'whatsapp',
                },
                rawMessage: message,
            };
        }
        catch (error) {
            console.error('[OrderService] Extraction failed:', error);
            // Fallback: basic pattern extraction
            return this.basicExtraction(message, customerPhone, customerName);
        }
    }
    /**
     * Basic pattern-based extraction fallback (no AI required)
     */
    basicExtraction(message, customerPhone, customerName) {
        const items = [];
        // Try to extract items with quantities
        const lines = message.split(/[,\n;]+/).map(l => l.trim()).filter(Boolean);
        for (const line of lines) {
            let quantity = 1;
            let name = line;
            // Try quantity patterns
            for (const pattern of QUANTITY_PATTERNS) {
                const match = line.match(pattern);
                if (match) {
                    quantity = parseInt(match[1], 10);
                    name = line.replace(pattern, '').trim();
                    break;
                }
            }
            // Try "N <item>" pattern (e.g., "3 burgers")
            const numFirst = line.match(/^(\d+)\s+(.+)/);
            if (numFirst) {
                quantity = parseInt(numFirst[1], 10);
                name = numFirst[2].trim();
            }
            // Clean up the name - remove order keywords
            const allKeywords = [...ORDER_KEYWORDS_EN, ...ORDER_KEYWORDS_AR];
            for (const kw of allKeywords) {
                name = name.replace(new RegExp(kw, 'gi'), '').trim();
            }
            if (name.length > 1) {
                items.push({ name, quantity, currency: 'KWD' });
            }
        }
        if (items.length === 0) {
            return {
                isOrder: false,
                confidence: 0.3,
                rawMessage: message,
            };
        }
        return {
            isOrder: true,
            confidence: 0.5,
            order: {
                customerPhone,
                customerName: customerName || 'Unknown',
                items,
                currency: 'KWD',
                source: 'whatsapp',
            },
            rawMessage: message,
        };
    }
    /**
     * Create a new order from extracted data
     */
    createOrder(orderData) {
        const orderId = this.generateOrderId();
        const now = new Date();
        const order = {
            orderId,
            customerPhone: orderData.customerPhone || '',
            customerName: orderData.customerName || 'Unknown',
            items: orderData.items || [],
            totalAmount: orderData.totalAmount,
            currency: orderData.currency || 'KWD',
            deliveryAddress: orderData.deliveryAddress,
            status: 'new',
            notes: orderData.notes,
            createdAt: now,
            updatedAt: now,
            source: 'whatsapp',
        };
        // Calculate total if prices are available
        if (!order.totalAmount && order.items.some(i => i.unitPrice != null)) {
            order.totalAmount = order.items.reduce((sum, item) => sum + (item.unitPrice || 0) * item.quantity, 0);
        }
        this.orders.set(orderId, order);
        console.log(`[OrderService] Created order ${orderId} for ${order.customerPhone} with ${order.items.length} items`);
        return order;
    }
    /**
     * Get an order by ID
     */
    getOrder(orderId) {
        return this.orders.get(orderId);
    }
    /**
     * Update order status
     */
    updateOrderStatus(orderId, status) {
        const order = this.orders.get(orderId);
        if (!order)
            return undefined;
        // Validate status transitions
        const validTransitions = {
            new: ['confirmed', 'cancelled'],
            confirmed: ['preparing', 'cancelled'],
            preparing: ['shipped', 'cancelled'],
            shipped: ['delivered', 'cancelled'],
            delivered: [],
            cancelled: [],
        };
        if (!validTransitions[order.status].includes(status)) {
            console.warn(`[OrderService] Invalid status transition: ${order.status} -> ${status} for ${orderId}`);
            return undefined;
        }
        order.status = status;
        order.updatedAt = new Date();
        this.orders.set(orderId, order);
        console.log(`[OrderService] Updated order ${orderId} status to: ${status}`);
        return order;
    }
    /**
     * Update order's sheet row ID (after syncing to Google Sheets)
     */
    updateSheetRowId(orderId, rowId) {
        const order = this.orders.get(orderId);
        if (order) {
            order.sheetRowId = rowId;
            this.orders.set(orderId, order);
        }
    }
    /**
     * List orders with optional filters
     */
    listOrders(filters) {
        let orders = Array.from(this.orders.values());
        if (filters) {
            if (filters.status) {
                orders = orders.filter(o => o.status === filters.status);
            }
            if (filters.customerPhone) {
                orders = orders.filter(o => o.customerPhone === filters.customerPhone);
            }
            if (filters.fromDate) {
                orders = orders.filter(o => o.createdAt >= filters.fromDate);
            }
            if (filters.toDate) {
                orders = orders.filter(o => o.createdAt <= filters.toDate);
            }
        }
        // Sort by creation date, newest first
        orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const offset = filters?.offset || 0;
        const limit = filters?.limit || 50;
        return orders.slice(offset, offset + limit);
    }
    /**
     * Get order statistics
     */
    getStats() {
        const orders = Array.from(this.orders.values());
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const byStatus = {
            new: 0,
            confirmed: 0,
            preparing: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0,
        };
        let totalRevenue = 0;
        let todayCount = 0;
        for (const order of orders) {
            byStatus[order.status]++;
            if (order.totalAmount && order.status !== 'cancelled') {
                totalRevenue += order.totalAmount;
            }
            if (order.createdAt >= today) {
                todayCount++;
            }
        }
        return {
            total: orders.length,
            byStatus,
            totalRevenue,
            currency: 'KWD',
            todayCount,
        };
    }
    /**
     * Format order confirmation for WhatsApp (bilingual)
     */
    formatOrderConfirmation(order, lang = 'en') {
        if (lang === 'ar') {
            let msg = `✅ *تم استلام طلبك!*\n\n`;
            msg += `🆔 *رقم الطلب:* ${order.orderId}\n`;
            msg += `📋 *المنتجات:*\n`;
            for (const item of order.items) {
                msg += `  • ${item.name} × ${item.quantity}`;
                if (item.unitPrice != null) {
                    msg += ` (${item.unitPrice} ${item.currency || 'KWD'})`;
                }
                msg += '\n';
            }
            if (order.totalAmount != null) {
                msg += `\n💰 *المجموع:* ${order.totalAmount} ${order.currency}\n`;
            }
            if (order.deliveryAddress) {
                msg += `📍 *عنوان التوصيل:* ${order.deliveryAddress}\n`;
            }
            if (order.notes) {
                msg += `📝 *ملاحظات:* ${order.notes}\n`;
            }
            msg += `\n📦 *الحالة:* جديد - بانتظار التأكيد`;
            msg += `\nسنؤكد طلبك قريباً! 🙏`;
            return msg;
        }
        // English
        let msg = `✅ *Order Received!*\n\n`;
        msg += `🆔 *Order ID:* ${order.orderId}\n`;
        msg += `📋 *Items:*\n`;
        for (const item of order.items) {
            msg += `  • ${item.name} × ${item.quantity}`;
            if (item.unitPrice != null) {
                msg += ` (${item.unitPrice} ${item.currency || 'KWD'})`;
            }
            msg += '\n';
        }
        if (order.totalAmount != null) {
            msg += `\n💰 *Total:* ${order.totalAmount} ${order.currency}\n`;
        }
        if (order.deliveryAddress) {
            msg += `📍 *Delivery Address:* ${order.deliveryAddress}\n`;
        }
        if (order.notes) {
            msg += `📝 *Notes:* ${order.notes}\n`;
        }
        msg += `\n📦 *Status:* New - Awaiting Confirmation`;
        msg += `\nWe'll confirm your order shortly! 🙏`;
        return msg;
    }
}
// Singleton export
export const orderService = new OrderServiceClass();
export default orderService;
//# sourceMappingURL=OrderService.js.map