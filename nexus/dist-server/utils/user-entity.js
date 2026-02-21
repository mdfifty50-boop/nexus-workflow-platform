/**
 * Derive a Composio entity ID from user authentication.
 * Uses Clerk user ID when available, falls back to 'default' for unauthenticated requests.
 *
 * Finding #22: Multi-tenant identity - per-user Composio entities
 * @NEXUS-FIX-022: Multi-tenant identity isolation - DO NOT REMOVE
 *
 * Priority order for user ID resolution:
 * 1. x-clerk-user-id header (Clerk auth middleware)
 * 2. x-user-id header (generic auth header)
 * 3. userId in request body (explicit parameter)
 * 4. auth.userId from Clerk middleware (if applied)
 * 5. 'default' fallback (unauthenticated/demo mode)
 */
export function getUserEntityId(req) {
    // Try multiple auth sources in priority order
    const userId = req.headers?.['x-clerk-user-id']
        || req.headers?.['x-user-id']
        || req.body?.userId
        || req.auth?.userId;
    // Return user-specific entity or 'default' for unauthenticated/demo mode
    return userId || 'default';
}
//# sourceMappingURL=user-entity.js.map