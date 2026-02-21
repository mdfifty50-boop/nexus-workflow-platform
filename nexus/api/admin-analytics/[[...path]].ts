import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withSecurityHeaders } from '../_lib/security-headers.js'
import { supabase, isAdmin } from '../_lib/supabase-admin.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (withSecurityHeaders(req, res)) return

  // Parse route from URL - extract everything after /api/admin-analytics/
  const urlPath = (req.url || '').split('?')[0]
  const prefix = '/api/admin-analytics/'
  const idx = urlPath.indexOf(prefix)
  const route = idx >= 0 ? urlPath.slice(idx + prefix.length) : ''

  // /status is public (and base path with no route)
  if (route === 'status' || route === '') {
    return res.json({ success: true, configured: supabase !== null })
  }


  // All other routes require admin auth
  if (!isAdmin(req.headers)) {
    return res.status(401).json({ success: false, error: 'Authentication required' })
  }

  if (!supabase) {
    return res.json({ success: true, data: [], total: 0 })
  }

  try {
    // Route dispatch
    if (route === 'metrics' && req.method === 'GET') return await handleMetrics(res)
    if (route === 'users' && req.method === 'GET') return await handleUsers(res)
    if (route === 'time-series' && req.method === 'GET') return await handleTimeSeries(req, res)
    if (route === 'top-workflows' && req.method === 'GET') return await handleTopWorkflows(req, res)
    if (route === 'activity-feed' && req.method === 'GET') return await handleActivityFeed(req, res)
    if (route === 'ai-insights' && req.method === 'POST') return await handleAIInsights(req, res)

    // User detail routes: users/{id}, users/{id}/conversations, etc.
    const userDetailMatch = route.match(/^users\/([^/]+)$/)
    if (userDetailMatch && req.method === 'GET') {
      return await handleUserDetail(userDetailMatch[1], res)
    }

    const userSubMatch = route.match(/^users\/([^/]+)\/(conversations|workflows|errors)$/)
    if (userSubMatch && req.method === 'GET') {
      const [, userId, sub] = userSubMatch
      if (sub === 'conversations') return await handleUserConversations(userId, res)
      if (sub === 'workflows') return await handleUserWorkflows(userId, res)
      if (sub === 'errors') return await handleUserErrors(userId, res)
    }

    return res.status(404).json({ success: false, error: 'Not found' })
  } catch (error) {
    console.error('Admin analytics error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

// ============================================================================
// METRICS
// ============================================================================

async function handleMetrics(res: VercelResponse) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    { count: totalUsers },
    { count: activeToday },
    { count: totalWorkflows },
    { count: executionsThisWeek },
    { count: totalExecutions },
    { count: successfulExecs },
  ] = await Promise.all([
    supabase!.from('users').select('*', { count: 'exact', head: true }),
    supabase!.from('users').select('*', { count: 'exact', head: true }).gte('updated_at', today.toISOString()),
    supabase!.from('user_workflows').select('*', { count: 'exact', head: true }),
    supabase!.from('user_workflow_executions').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
    supabase!.from('user_workflow_executions').select('*', { count: 'exact', head: true }),
    supabase!.from('user_workflow_executions').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
  ])

  const { count: errorCount } = await supabase!
    .from('user_workflow_executions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'failed')

  const successRate =
    totalExecutions && totalExecutions > 0
      ? Math.round(((successfulExecs || 0) / totalExecutions) * 1000) / 10
      : 0

  return res.json({
    success: true,
    data: {
      totalUsers: totalUsers || 0,
      activeToday: activeToday || 0,
      totalWorkflows: totalWorkflows || 0,
      executionsThisWeek: executionsThisWeek || 0,
      successRate,
      errorCount: errorCount || 0,
    },
  })
}

// ============================================================================
// USERS
// ============================================================================

async function handleUsers(res: VercelResponse) {
  const { data: profiles, error } = await supabase!
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !profiles) return res.json({ success: true, data: [], total: 0 })

  const { data: wfCounts } = await supabase!.from('user_workflows').select('clerk_user_id')
  const wfMap: Record<string, number> = {}
  if (wfCounts) {
    for (const wf of wfCounts) {
      wfMap[wf.clerk_user_id] = (wfMap[wf.clerk_user_id] || 0) + 1
    }
  }

  const users = profiles.map((p: any) => {
    const id = p.clerk_user_id || p.id
    return {
      id,
      email: p.email || '',
      name: p.full_name || p.email?.split('@')[0] || 'Unknown',
      role: p.role || 'user',
      status: getActivityStatus(p.last_active_at || p.updated_at),
      createdAt: p.created_at?.split('T')[0] || '-',
      lastActive: (p.last_active_at || p.updated_at)?.split('T')[0] || '-',
      workflowsCreated: wfMap[id] || 0,
    }
  })

  return res.json({ success: true, data: users, total: users.length })
}

// ============================================================================
// TIME SERIES
// ============================================================================

async function handleTimeSeries(req: VercelRequest, res: VercelResponse) {
  const days = parseInt(req.query.days as string) || 14
  const result = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)

    const [{ count: executions }, { count: users }] = await Promise.all([
      supabase!.from('user_workflow_executions').select('*', { count: 'exact', head: true })
        .gte('created_at', startOfDay.toISOString()).lt('created_at', endOfDay.toISOString()),
      supabase!.from('users').select('*', { count: 'exact', head: true })
        .gte('updated_at', startOfDay.toISOString()).lt('updated_at', endOfDay.toISOString()),
    ])

    result.push({
      date: startOfDay.toISOString().split('T')[0],
      executions: executions || 0,
      users: users || 0,
      workflows: 0,
    })
  }

  return res.json({ success: true, data: result })
}

// ============================================================================
// TOP WORKFLOWS
// ============================================================================

async function handleTopWorkflows(req: VercelRequest, res: VercelResponse) {
  const limit = parseInt(req.query.limit as string) || 5

  const { data: workflows } = await supabase!
    .from('user_workflows')
    .select('id, name, user_workflow_executions(id, status)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!workflows) return res.json({ success: true, data: [] })

  const result = workflows.map((wf: any) => {
    const execs = wf.user_workflow_executions || []
    const successful = execs.filter((e: any) => e.status === 'completed').length
    return {
      id: wf.id,
      name: wf.name || 'Unnamed Workflow',
      executions: execs.length,
      successRate: execs.length > 0 ? Math.round((successful / execs.length) * 100) : 0,
    }
  })

  return res.json({ success: true, data: result })
}

// ============================================================================
// ACTIVITY FEED
// ============================================================================

async function handleActivityFeed(req: VercelRequest, res: VercelResponse) {
  const limit = parseInt(req.query.limit as string) || 50
  const activities: any[] = []

  // Build user map
  const { data: profiles } = await supabase!.from('users').select('id, clerk_user_id, full_name, email')
  const userMap: Record<string, { name: string; email: string }> = {}
  if (profiles) {
    for (const p of profiles) {
      const name = p.full_name || p.email?.split('@')[0] || 'Unknown'
      const email = p.email || ''
      if (p.clerk_user_id) userMap[p.clerk_user_id] = { name, email }
      userMap[p.id] = { name, email }
    }
  }

  // Recent signups
  const { data: signups } = await supabase!.from('users')
    .select('id, clerk_user_id, full_name, email, created_at')
    .order('created_at', { ascending: false }).limit(20)

  if (signups) {
    for (const u of signups) {
      const id = u.clerk_user_id || u.id
      activities.push({
        id: `signup-${id}`, type: 'signup',
        user: { id, name: u.full_name || u.email?.split('@')[0] || 'Unknown', email: u.email || '' },
        description: 'Signed up for Nexus', timestamp: u.created_at,
      })
    }
  }

  // Recent conversations
  const { data: chats } = await supabase!.from('chat_conversations')
    .select('id, clerk_user_id, title, created_at')
    .order('created_at', { ascending: false }).limit(20)

  if (chats) {
    for (const c of chats) {
      const user = userMap[c.clerk_user_id] || { name: 'Unknown', email: '' }
      activities.push({
        id: `chat-${c.id}`, type: 'chat',
        user: { id: c.clerk_user_id, ...user },
        description: `Started conversation: "${c.title || 'New Chat'}"`, timestamp: c.created_at,
      })
    }
  }

  // Recent workflows
  const { data: wfs } = await supabase!.from('user_workflows')
    .select('id, clerk_user_id, name, created_at')
    .order('created_at', { ascending: false }).limit(20)

  if (wfs) {
    for (const w of wfs) {
      const user = userMap[w.clerk_user_id] || { name: 'Unknown', email: '' }
      activities.push({
        id: `wf-${w.id}`, type: 'workflow_created',
        user: { id: w.clerk_user_id, ...user },
        description: `Created workflow: "${w.name || 'Untitled'}"`, timestamp: w.created_at,
      })
    }
  }

  // Sort and limit
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return res.json({ success: true, data: activities.slice(0, limit) })
}

// ============================================================================
// AI INSIGHTS
// ============================================================================

async function handleAIInsights(_req: VercelRequest, res: VercelResponse) {
  const Anthropic = await import('@anthropic-ai/sdk').then(m => m.default).catch(() => null)
  if (!Anthropic || !process.env.ANTHROPIC_API_KEY) {
    return res.json({
      success: true,
      data: {
        segments: [], featureAdoption: [], churnRisks: [],
        marketingInsights: [{ category: 'System', insight: 'ANTHROPIC_API_KEY not configured', priority: 'high', actionItems: ['Set ANTHROPIC_API_KEY env var'] }],
        generatedAt: new Date().toISOString(), cachedUntil: new Date().toISOString(),
      },
    })
  }

  // Aggregate data
  const { count: totalUsers } = await supabase!.from('users').select('*', { count: 'exact', head: true })
  const { count: totalWorkflows } = await supabase!.from('user_workflows').select('*', { count: 'exact', head: true })
  const { count: totalExecs } = await supabase!.from('user_workflow_executions').select('*', { count: 'exact', head: true })
  const { count: totalConvos } = await supabase!.from('chat_conversations').select('*', { count: 'exact', head: true })

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const prompt = `You are a marketing analytics AI for Nexus, an AI workflow automation platform. Analyze:
- Total users: ${totalUsers || 0}
- Total workflows: ${totalWorkflows || 0}
- Total executions: ${totalExecs || 0}
- Total conversations: ${totalConvos || 0}

Return JSON (no markdown): {"segments":[],"featureAdoption":[],"churnRisks":[],"marketingInsights":[{"category":"string","insight":"string","priority":"high|medium|low","actionItems":["string"]}]}
Provide 2-3 items per category. Be specific.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6', max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content.find((b: any) => b.type === 'text')
    if (text && text.type === 'text') {
      const parsed = JSON.parse(text.text)
      const now = new Date()
      return res.json({
        success: true,
        data: {
          ...parsed,
          generatedAt: now.toISOString(),
          cachedUntil: new Date(now.getTime() + 3600000).toISOString(),
        },
      })
    }
  } catch (e) {
    console.error('AI insights error:', e)
  }

  return res.json({
    success: true,
    data: {
      segments: [], featureAdoption: [], churnRisks: [],
      marketingInsights: [{ category: 'System', insight: 'AI analysis failed', priority: 'high', actionItems: ['Check ANTHROPIC_API_KEY'] }],
      generatedAt: new Date().toISOString(), cachedUntil: new Date().toISOString(),
    },
  })
}

// ============================================================================
// USER DETAIL
// ============================================================================

async function handleUserDetail(userId: string, res: VercelResponse) {
  let profile: any = null
  const { data: p1 } = await supabase!.from('users').select('*').eq('clerk_user_id', userId).single()
  if (p1) { profile = p1 } else {
    const { data: p2 } = await supabase!.from('users').select('*').eq('id', userId).single()
    profile = p2
  }

  if (!profile) return res.status(404).json({ success: false, error: 'User not found' })
  const id = profile.clerk_user_id || profile.id

  const [{ count: convos }, { count: wfCount }] = await Promise.all([
    supabase!.from('chat_conversations').select('*', { count: 'exact', head: true }).eq('clerk_user_id', id),
    supabase!.from('user_workflows').select('*', { count: 'exact', head: true }).eq('clerk_user_id', id),
  ])

  const { data: bizProfile } = await supabase!.from('user_business_profiles').select('*').eq('clerk_user_id', id).single()

  return res.json({
    success: true,
    data: {
      id, email: profile.email || '', name: profile.full_name || profile.email?.split('@')[0] || 'Unknown',
      avatarUrl: profile.avatar_url, role: profile.role || 'user',
      status: getActivityStatus(profile.last_active_at || profile.updated_at),
      createdAt: profile.created_at, lastActive: profile.last_active_at || profile.updated_at || profile.created_at,
      workflowsCreated: wfCount || 0, conversationCount: convos || 0,
      executionCount: 0, errorCount: 0, businessProfile: bizProfile || null,
    },
  })
}

// ============================================================================
// USER CONVERSATIONS
// ============================================================================

async function handleUserConversations(userId: string, res: VercelResponse) {
  const { data: conversations } = await supabase!.from('chat_conversations')
    .select('*').eq('clerk_user_id', userId).order('updated_at', { ascending: false }).limit(50)

  if (!conversations) return res.json({ success: true, data: [] })

  const result = []
  for (const conv of conversations) {
    const { data: messages, count } = await supabase!.from('chat_messages')
      .select('id, role, content, created_at', { count: 'exact' })
      .eq('conversation_id', conv.id).order('created_at', { ascending: true }).limit(100)

    result.push({
      id: conv.id, title: conv.title || 'Untitled', messageCount: count || 0,
      createdAt: conv.created_at, updatedAt: conv.updated_at,
      messages: (messages || []).map((m: any) => ({
        id: m.id, role: m.role, content: m.content, createdAt: m.created_at,
      })),
    })
  }

  return res.json({ success: true, data: result })
}

// ============================================================================
// USER WORKFLOWS
// ============================================================================

async function handleUserWorkflows(userId: string, res: VercelResponse) {
  const { data: workflows } = await supabase!.from('user_workflows')
    .select('*').eq('clerk_user_id', userId).order('updated_at', { ascending: false })

  if (!workflows) return res.json({ success: true, data: [] })

  const result = []
  for (const wf of workflows) {
    const { data: execs } = await supabase!.from('user_workflow_executions')
      .select('id, status, created_at, error_message')
      .eq('workflow_id', wf.id).order('created_at', { ascending: false }).limit(10)

    result.push({
      id: wf.id, name: wf.name || 'Unnamed', description: wf.description,
      status: wf.status, executionCount: wf.execution_count || 0,
      lastExecutedAt: wf.last_executed_at, createdAt: wf.created_at,
      executions: (execs || []).map((e: any) => ({
        id: e.id, status: e.status, createdAt: e.created_at, errorMessage: e.error_message,
      })),
    })
  }

  return res.json({ success: true, data: result })
}

// ============================================================================
// USER ERRORS
// ============================================================================

async function handleUserErrors(userId: string, res: VercelResponse) {
  const { data: workflows } = await supabase!.from('user_workflows')
    .select('id, name').eq('clerk_user_id', userId)

  if (!workflows || workflows.length === 0) return res.json({ success: true, data: [] })

  const wfMap: Record<string, string> = {}
  for (const wf of workflows) wfMap[wf.id] = wf.name || 'Unnamed'

  const { data: errors } = await supabase!.from('user_workflow_executions')
    .select('*').in('workflow_id', workflows.map(w => w.id)).eq('status', 'failed')
    .order('created_at', { ascending: false }).limit(50)

  if (!errors) return res.json({ success: true, data: [] })

  return res.json({
    success: true,
    data: errors.map((e: any) => ({
      id: e.id, workflowId: e.workflow_id, workflowName: wfMap[e.workflow_id] || 'Unknown',
      status: e.status, errorMessage: e.error_message || 'Unknown error', createdAt: e.created_at,
    })),
  })
}

// ============================================================================
// HELPERS
// ============================================================================

function getActivityStatus(lastActive: string | null): 'active' | 'inactive' | 'pending' {
  if (!lastActive) return 'pending'
  const days = (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24)
  if (days <= 7) return 'active'
  return 'inactive'
}
