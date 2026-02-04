/**
 * Admin Analytics API Routes
 *
 * Plan 2: Admin Dashboard - Real Analytics
 *
 * Handles:
 * - GET /users - Get all users with workflow counts
 * - GET /metrics - Get usage metrics
 * - GET /time-series - Get time series data for charts
 * - GET /top-workflows - Get top workflows by execution
 * - GET /audit-log - Get audit log entries
 * - POST /audit-log - Create audit log entry
 * - PATCH /users/:id/role - Update user role
 */

import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { adminDataService } from '../services/AdminDataService.js'

const router = Router()

// ============================================================================
// ADMIN AUTH MIDDLEWARE
// ============================================================================

/**
 * Middleware to verify admin access
 * In development mode, allows access with dev-user or missing auth
 * In production, requires valid clerk_user_id with admin role
 */
const requireAdminAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clerkUserId = req.headers['x-clerk-user-id'] as string

    // Development mode bypass
    if (process.env.NODE_ENV !== 'production') {
      // Allow dev user or missing auth in development
      if (!clerkUserId || clerkUserId === 'dev-user-local') {
        return next()
      }
    }

    // Check if user exists and has admin role
    if (!clerkUserId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      })
    }

    // Get user status from database
    const userStatus = await adminDataService.getUserStatus(clerkUserId)

    if (!userStatus.exists) {
      return res.status(403).json({
        success: false,
        error: 'User not found'
      })
    }

    if (userStatus.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      })
    }

    // User is authenticated and is admin - proceed
    next()
  } catch (error) {
    console.error('Admin auth middleware error:', error)
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    })
  }
}

// Apply admin auth to all routes except /status
router.use((req, res, next) => {
  // /status endpoint is public (used to check if admin features are configured)
  if (req.path === '/status') {
    return next()
  }
  return requireAdminAuth(req, res, next)
})

// ============================================================================
// GET /users - Get all users with workflow counts
// ============================================================================

router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await adminDataService.getUsers()

    res.json({
      success: true,
      data: users,
      total: users.length
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    })
  }
})

// ============================================================================
// GET /metrics - Get usage metrics
// ============================================================================

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await adminDataService.getUsageMetrics()

    res.json({
      success: true,
      data: metrics
    })
  } catch (error) {
    console.error('Error fetching metrics:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metrics'
    })
  }
})

// ============================================================================
// GET /time-series - Get time series data for charts
// ============================================================================

router.get('/time-series', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7
    const timeSeries = await adminDataService.getTimeSeries(days)

    res.json({
      success: true,
      data: timeSeries
    })
  } catch (error) {
    console.error('Error fetching time series:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch time series data'
    })
  }
})

// ============================================================================
// GET /top-workflows - Get top workflows by execution count
// ============================================================================

router.get('/top-workflows', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5
    const topWorkflows = await adminDataService.getTopWorkflows(limit)

    res.json({
      success: true,
      data: topWorkflows
    })
  } catch (error) {
    console.error('Error fetching top workflows:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top workflows'
    })
  }
})

// ============================================================================
// GET /audit-log - Get audit log entries with filtering
// ============================================================================

router.get('/audit-log', async (req: Request, res: Response) => {
  try {
    const {
      limit,
      offset,
      userId,
      action,
      status,
      startDate,
      endDate
    } = req.query

    const result = await adminDataService.getAuditLog({
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      userId: userId as string,
      action: action as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string
    })

    res.json({
      success: true,
      data: result.entries,
      total: result.total
    })
  } catch (error) {
    console.error('Error fetching audit log:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit log'
    })
  }
})

// ============================================================================
// POST /audit-log - Create audit log entry
// ============================================================================

router.post('/audit-log', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      userName,
      userEmail,
      action,
      resource,
      resourceId,
      details,
      status,
      metadata
    } = req.body

    if (!userId || !action || !resource) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, action, resource'
      })
    }

    // Get IP and user agent from request
    const ipAddress = req.headers['x-forwarded-for'] as string || req.ip || 'unknown'
    const userAgent = req.headers['user-agent'] || 'unknown'

    const created = await adminDataService.createAuditLog({
      userId,
      userName,
      userEmail,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      status,
      metadata
    })

    if (created) {
      res.json({
        success: true,
        message: 'Audit log entry created'
      })
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create audit log entry'
      })
    }
  } catch (error) {
    console.error('Error creating audit log:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create audit log entry'
    })
  }
})

// ============================================================================
// PATCH /users/:id/role - Update user role
// ============================================================================

router.patch('/users/:id/role', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { role } = req.body

    if (!role || !['admin', 'user', 'viewer'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be admin, user, or viewer'
      })
    }

    const updated = await adminDataService.updateUserRole(id, role)

    if (updated) {
      res.json({
        success: true,
        message: 'User role updated'
      })
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update user role'
      })
    }
  } catch (error) {
    console.error('Error updating user role:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update user role'
    })
  }
})

// ============================================================================
// GET /status - Check if admin analytics is configured
// ============================================================================

router.get('/status', async (req: Request, res: Response) => {
  res.json({
    success: true,
    configured: adminDataService.isConfigured()
  })
})

export default router
