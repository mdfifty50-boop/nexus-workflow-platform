/**
 * WhatsApp Business Catalogue Service
 *
 * In-memory product catalogue management for WhatsApp Business.
 * Follows the same Map-based pattern as AiSensyService and WhatsAppComposioService.
 *
 * Features:
 * - CRUD operations for products
 * - Category management (auto-derived from products)
 * - Search and filter by name, category, status, visibility
 * - Stats: total products, in-stock, categories count, visible count
 * - Seed data for demo mode
 *
 * In production, replace in-memory Maps with database persistence.
 */
// =============================================================================
// SERVICE
// =============================================================================
class CatalogueService {
    // In-memory storage keyed by product ID
    products = new Map();
    idCounter = 100;
    constructor() {
        this.seedDemoData();
    }
    // ---------------------------------------------------------------------------
    // CRUD Operations
    // ---------------------------------------------------------------------------
    /**
     * Create a new product
     */
    createProduct(input) {
        const id = `prod_${++this.idCounter}`;
        const now = new Date().toISOString();
        const product = {
            id,
            name: input.name,
            description: input.description || '',
            price: input.price,
            currency: input.currency || 'KWD',
            imageUrl: input.imageUrl || '',
            category: input.category,
            availability: input.availability || 'in_stock',
            isVisible: input.isVisible !== undefined ? input.isVisible : true,
            url: input.url,
            sku: input.sku,
            createdAt: now,
            updatedAt: now,
        };
        this.products.set(id, product);
        console.log(`[CatalogueService] Created product: ${id} - ${product.name}`);
        return product;
    }
    /**
     * Get a single product by ID
     */
    getProduct(id) {
        return this.products.get(id);
    }
    /**
     * Update an existing product
     */
    updateProduct(id, input) {
        const existing = this.products.get(id);
        if (!existing)
            return undefined;
        const updated = {
            ...existing,
            ...input,
            id: existing.id, // prevent ID override
            createdAt: existing.createdAt, // preserve original creation date
            updatedAt: new Date().toISOString(),
        };
        this.products.set(id, updated);
        console.log(`[CatalogueService] Updated product: ${id} - ${updated.name}`);
        return updated;
    }
    /**
     * Delete a product by ID
     */
    deleteProduct(id) {
        const existed = this.products.has(id);
        if (existed) {
            this.products.delete(id);
            console.log(`[CatalogueService] Deleted product: ${id}`);
        }
        return existed;
    }
    // ---------------------------------------------------------------------------
    // Query Operations
    // ---------------------------------------------------------------------------
    /**
     * List products with optional filters
     */
    listProducts(filter) {
        let results = Array.from(this.products.values());
        if (filter) {
            // Search by name or description
            if (filter.search) {
                const searchLower = filter.search.toLowerCase();
                results = results.filter((p) => p.name.toLowerCase().includes(searchLower) ||
                    p.description.toLowerCase().includes(searchLower) ||
                    (p.sku && p.sku.toLowerCase().includes(searchLower)));
            }
            // Filter by category
            if (filter.category && filter.category !== 'all') {
                results = results.filter((p) => p.category === filter.category);
            }
            // Filter by availability
            if (filter.availability) {
                results = results.filter((p) => p.availability === filter.availability);
            }
            // Filter by visibility
            if (filter.isVisible !== undefined) {
                results = results.filter((p) => p.isVisible === filter.isVisible);
            }
        }
        // Sort by updatedAt descending (most recently modified first)
        results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        return results;
    }
    /**
     * Get all products (unfiltered). Convenience alias for listProducts().
     */
    getAllProducts() {
        return Array.from(this.products.values());
    }
    /**
     * Get all unique categories with item counts
     */
    getCategories() {
        const categoryMap = new Map();
        for (const product of this.products.values()) {
            const count = categoryMap.get(product.category) || 0;
            categoryMap.set(product.category, count + 1);
        }
        const categories = [];
        let catId = 1;
        for (const [name, itemCount] of categoryMap) {
            categories.push({
                id: `cat_${catId++}`,
                name,
                itemCount,
            });
        }
        // Sort alphabetically
        categories.sort((a, b) => a.name.localeCompare(b.name));
        return categories;
    }
    /**
     * Get products by category
     */
    getProductsByCategory(category) {
        return this.listProducts({ category });
    }
    /**
     * Get catalogue statistics
     */
    getStats() {
        const products = Array.from(this.products.values());
        return {
            totalProducts: products.length,
            inStock: products.filter((p) => p.availability === 'in_stock').length,
            outOfStock: products.filter((p) => p.availability === 'out_of_stock').length,
            preorder: products.filter((p) => p.availability === 'preorder').length,
            categories: this.getCategories().length,
            visible: products.filter((p) => p.isVisible).length,
            hidden: products.filter((p) => !p.isVisible).length,
        };
    }
    // ---------------------------------------------------------------------------
    // WhatsApp AI Context
    // ---------------------------------------------------------------------------
    /**
     * Get a summary of the catalogue suitable for AI context injection.
     * Used when a WhatsApp customer asks about products.
     */
    getCatalogueContext() {
        const products = this.listProducts({ isVisible: true });
        if (products.length === 0) {
            return 'No products are currently available in the catalogue.';
        }
        const categories = this.getCategories();
        let context = `Product Catalogue (${products.length} products in ${categories.length} categories):\n\n`;
        // Group by category
        for (const cat of categories) {
            const catProducts = products.filter((p) => p.category === cat.name);
            if (catProducts.length === 0)
                continue;
            context += `**${cat.name}:**\n`;
            for (const p of catProducts) {
                const availLabel = p.availability === 'in_stock'
                    ? 'Available'
                    : p.availability === 'preorder'
                        ? 'Pre-order'
                        : 'Out of Stock';
                context += `- ${p.name}: ${p.price} ${p.currency} (${availLabel})\n`;
                if (p.description) {
                    context += `  ${p.description}\n`;
                }
            }
            context += '\n';
        }
        return context;
    }
    /**
     * Search catalogue for products matching a customer query.
     * Returns a formatted string for WhatsApp AI responses.
     */
    searchForCustomer(query) {
        const results = this.listProducts({ search: query, isVisible: true });
        if (results.length === 0) {
            return `No products found matching "${query}".`;
        }
        let response = `Found ${results.length} product${results.length > 1 ? 's' : ''}:\n\n`;
        for (const p of results.slice(0, 5)) {
            const availLabel = p.availability === 'in_stock'
                ? 'Available'
                : p.availability === 'preorder'
                    ? 'Pre-order'
                    : 'Out of Stock';
            response += `*${p.name}*\n`;
            response += `${p.price} ${p.currency} - ${availLabel}\n`;
            if (p.description) {
                response += `${p.description}\n`;
            }
            if (p.url) {
                response += `${p.url}\n`;
            }
            response += '\n';
        }
        if (results.length > 5) {
            response += `...and ${results.length - 5} more products.`;
        }
        return response;
    }
    // ---------------------------------------------------------------------------
    // Demo Seed Data
    // ---------------------------------------------------------------------------
    seedDemoData() {
        const demoProducts = [
            {
                name: 'Premium Business Consultation',
                description: 'One-hour consultation session with our expert business advisors.',
                price: 75,
                currency: 'KWD',
                imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
                category: 'Services',
                availability: 'in_stock',
                url: 'https://example.com/consultation',
                sku: 'SRV-001',
            },
            {
                name: 'Digital Marketing Package',
                description: 'Complete digital marketing solution including social media management.',
                price: 250,
                currency: 'KWD',
                imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
                category: 'Services',
                availability: 'in_stock',
                sku: 'SRV-002',
            },
            {
                name: 'Website Development',
                description: 'Professional website development with modern design.',
                price: 500,
                currency: 'KWD',
                imageUrl: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=400',
                category: 'Development',
                availability: 'in_stock',
                sku: 'DEV-001',
            },
            {
                name: 'Mobile App Development',
                description: 'Cross-platform mobile application development.',
                price: 1500,
                currency: 'KWD',
                imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400',
                category: 'Development',
                availability: 'preorder',
                sku: 'DEV-002',
            },
        ];
        for (const input of demoProducts) {
            this.createProduct(input);
        }
        console.log(`[CatalogueService] Seeded ${demoProducts.length} demo products`);
    }
}
// Singleton export (same pattern as AiSensyService)
export const catalogueService = new CatalogueService();
//# sourceMappingURL=CatalogueService.js.map