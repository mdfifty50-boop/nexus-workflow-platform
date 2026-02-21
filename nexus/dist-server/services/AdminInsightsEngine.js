import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
// Initialize Supabase client with service role for backend operations
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseServiceKey && supabaseUrl
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;
// Initialize Anthropic client
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
const anthropic = anthropicApiKey
    ? new Anthropic({ apiKey: anthropicApiKey })
    : null;
// =============================================================================
// CACHE
// =============================================================================
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour
let cachedInsights = null;
let cacheExpiresAt = 0;
async function aggregateUserData() {
    if (!supabase)
        return null;
    try {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        // Fetch user profiles from 'users' table (production schema)
        const { data: profiles, error: profileErr } = await supabase
            .from('users')
            .select('id, clerk_user_id, email, full_name, created_at, updated_at, last_active_at')
            .order('created_at', { ascending: false });
        if (profileErr) {
            console.error('AdminInsightsEngine: Error fetching users:', profileErr);
            return null;
        }
        const userProfiles = (profiles || []).map((p) => ({
            id: p.clerk_user_id || p.id,
            email: p.email || '',
            fullName: p.full_name,
            createdAt: p.created_at,
            lastActiveAt: p.last_active_at || p.updated_at,
            industry: null,
            companySize: null,
        }));
        const totalUsers = userProfiles.length;
        const activeUsersLast7d = userProfiles.filter(u => u.lastActiveAt && new Date(u.lastActiveAt) >= sevenDaysAgo).length;
        const activeUsersLast30d = userProfiles.filter(u => u.lastActiveAt && new Date(u.lastActiveAt) >= thirtyDaysAgo).length;
        // Fetch business profiles
        const { data: bizProfiles, error: bizErr } = await supabase
            .from('user_business_profiles')
            .select('clerk_user_id, industry, company_name, company_size, country');
        if (bizErr) {
            console.warn('AdminInsightsEngine: Error fetching user_business_profiles:', bizErr);
        }
        const businessProfiles = (bizProfiles || []).map((b) => ({
            userId: b.clerk_user_id,
            industry: b.industry,
            companyName: b.company_name,
            companySize: b.company_size,
            country: b.country,
        }));
        // Merge industry info into user profiles
        const bizMap = new Map(businessProfiles.map(b => [b.userId, b]));
        for (const u of userProfiles) {
            const biz = bizMap.get(u.id);
            if (biz) {
                u.industry = biz.industry;
                u.companySize = biz.companySize;
            }
        }
        // Conversation stats
        const { count: totalConversations } = await supabase
            .from('chat_conversations')
            .select('*', { count: 'exact', head: true });
        const { data: convUsers } = await supabase
            .from('chat_conversations')
            .select('clerk_user_id');
        const uniqueConvUsers = new Set((convUsers || []).map((c) => c.clerk_user_id));
        const usersWithConversations = uniqueConvUsers.size;
        const avgMessagesPerUser = usersWithConversations > 0
            ? Math.round((totalConversations || 0) / usersWithConversations * 10) / 10
            : 0;
        // Workflow stats
        const { count: totalWorkflows } = await supabase
            .from('user_workflows')
            .select('*', { count: 'exact', head: true });
        const { data: wfData } = await supabase
            .from('user_workflows')
            .select('clerk_user_id, integrations');
        const uniqueWfUsers = new Set((wfData || []).map((w) => w.clerk_user_id));
        const usersWithWorkflows = uniqueWfUsers.size;
        const avgWorkflowsPerUser = usersWithWorkflows > 0
            ? Math.round((totalWorkflows || 0) / usersWithWorkflows * 10) / 10
            : 0;
        // Count integration usage
        const integrationCounts = {};
        for (const w of (wfData || [])) {
            const integrations = w.integrations;
            if (Array.isArray(integrations)) {
                for (const i of integrations) {
                    integrationCounts[i] = (integrationCounts[i] || 0) + 1;
                }
            }
        }
        const topIntegrations = Object.entries(integrationCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([name]) => name);
        // Execution stats
        const { count: totalExecutions } = await supabase
            .from('user_workflow_executions')
            .select('*', { count: 'exact', head: true });
        const { count: successfulExecutions } = await supabase
            .from('user_workflow_executions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed');
        const { count: executionsLast7d } = await supabase
            .from('user_workflow_executions')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', sevenDaysAgo.toISOString());
        const { count: executionsLast30d } = await supabase
            .from('user_workflow_executions')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', thirtyDaysAgo.toISOString());
        const successRate = (totalExecutions && totalExecutions > 0)
            ? Math.round((successfulExecutions || 0) / totalExecutions * 1000) / 10
            : 0;
        return {
            totalUsers,
            activeUsersLast7d,
            activeUsersLast30d,
            userProfiles,
            businessProfiles,
            conversationStats: {
                totalConversations: totalConversations || 0,
                avgMessagesPerUser,
                usersWithConversations,
            },
            workflowStats: {
                totalWorkflows: totalWorkflows || 0,
                usersWithWorkflows,
                avgWorkflowsPerUser,
                topIntegrations,
            },
            executionStats: {
                totalExecutions: totalExecutions || 0,
                successRate,
                executionsLast7d: executionsLast7d || 0,
                executionsLast30d: executionsLast30d || 0,
            },
        };
    }
    catch (error) {
        console.error('AdminInsightsEngine: Error aggregating data:', error);
        return null;
    }
}
// =============================================================================
// AI ANALYSIS
// =============================================================================
async function analyzeWithClaude(data) {
    if (!anthropic) {
        return emptyInsights('Anthropic API key not configured');
    }
    const prompt = `You are a marketing analytics AI for Nexus, an AI-powered workflow automation platform (like Zapier but AI-native). Analyze this aggregated user data and return actionable insights.

USER DATA SUMMARY:
- Total users: ${data.totalUsers}
- Active last 7 days: ${data.activeUsersLast7d}
- Active last 30 days: ${data.activeUsersLast30d}
- Users with conversations: ${data.conversationStats.usersWithConversations}
- Avg messages per user: ${data.conversationStats.avgMessagesPerUser}
- Total workflows created: ${data.workflowStats.totalWorkflows}
- Users with workflows: ${data.workflowStats.usersWithWorkflows}
- Avg workflows per user: ${data.workflowStats.avgWorkflowsPerUser}
- Top integrations: ${data.workflowStats.topIntegrations.join(', ') || 'none yet'}
- Total executions: ${data.executionStats.totalExecutions}
- Success rate: ${data.executionStats.successRate}%
- Executions last 7d: ${data.executionStats.executionsLast7d}
- Executions last 30d: ${data.executionStats.executionsLast30d}

INDUSTRIES REPRESENTED:
${data.businessProfiles.map(b => b.industry).filter(Boolean).join(', ') || 'No industry data yet'}

COMPANY SIZES:
${data.businessProfiles.map(b => b.companySize).filter(Boolean).join(', ') || 'No company size data yet'}

USER ACTIVITY DISTRIBUTION:
- Signed up but never active: ${data.userProfiles.filter(u => !u.lastActiveAt).length}
- Active in last 7 days: ${data.activeUsersLast7d}
- Active 8-30 days ago: ${data.activeUsersLast30d - data.activeUsersLast7d}
- Inactive 30+ days: ${data.totalUsers - data.activeUsersLast30d}

Return a JSON object with exactly this structure (no markdown, no code fences, just raw JSON):
{
  "segments": [
    {
      "name": "segment name",
      "description": "who they are",
      "userCount": <estimated number>,
      "characteristics": ["trait1", "trait2"],
      "recommendations": ["action1", "action2"]
    }
  ],
  "featureAdoption": [
    {
      "feature": "feature name",
      "adoptionRate": <0-100>,
      "trend": "up|down|stable",
      "userCount": <number>
    }
  ],
  "churnRisks": [
    {
      "userId": "user_id or 'segment'",
      "email": "email or segment description",
      "riskLevel": "high|medium|low",
      "signals": ["signal1", "signal2"],
      "recommendedAction": "what to do"
    }
  ],
  "marketingInsights": [
    {
      "category": "Acquisition|Activation|Retention|Revenue|Referral",
      "insight": "the insight",
      "priority": "high|medium|low",
      "actionItems": ["item1", "item2"]
    }
  ]
}

Provide 2-4 items per category. Be specific and actionable. Base everything on the actual data above. If data is sparse, note that and provide recommendations for getting more data.`;
    try {
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 2000,
            messages: [{ role: 'user', content: prompt }],
        });
        const textBlock = response.content.find(b => b.type === 'text');
        if (!textBlock || textBlock.type !== 'text') {
            console.error('AdminInsightsEngine: No text in Claude response');
            return emptyInsights('AI returned no text response');
        }
        const parsed = JSON.parse(textBlock.text);
        const now = new Date();
        const cachedUntil = new Date(now.getTime() + CACHE_DURATION_MS);
        return {
            segments: parsed.segments || [],
            featureAdoption: parsed.featureAdoption || [],
            churnRisks: parsed.churnRisks || [],
            marketingInsights: parsed.marketingInsights || [],
            generatedAt: now.toISOString(),
            cachedUntil: cachedUntil.toISOString(),
        };
    }
    catch (error) {
        console.error('AdminInsightsEngine: Claude analysis failed:', error);
        return emptyInsights('AI analysis failed - check ANTHROPIC_API_KEY');
    }
}
// =============================================================================
// EMPTY INSIGHTS HELPER
// =============================================================================
function emptyInsights(reason) {
    const now = new Date();
    return {
        segments: [],
        featureAdoption: [],
        churnRisks: [],
        marketingInsights: [{
                category: 'System',
                insight: reason,
                priority: 'high',
                actionItems: ['Configure required environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY)'],
            }],
        generatedAt: now.toISOString(),
        cachedUntil: now.toISOString(),
    };
}
// =============================================================================
// ADMIN INSIGHTS ENGINE (SINGLETON)
// =============================================================================
export const adminInsightsEngine = {
    /**
     * Get insights - returns cached version if available, otherwise generates fresh
     */
    async getInsights(forceRefresh = false) {
        if (!forceRefresh && cachedInsights && Date.now() < cacheExpiresAt) {
            return cachedInsights;
        }
        return this.generateInsights();
    },
    /**
     * Generate fresh insights - always fetches new data and runs AI analysis
     */
    async generateInsights() {
        if (!supabase) {
            return emptyInsights('Supabase not configured - set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
        }
        if (!anthropic) {
            return emptyInsights('Anthropic not configured - set ANTHROPIC_API_KEY');
        }
        const data = await aggregateUserData();
        if (!data) {
            return emptyInsights('Failed to aggregate user data from Supabase');
        }
        const insights = await analyzeWithClaude(data);
        // Cache the result
        cachedInsights = insights;
        cacheExpiresAt = Date.now() + CACHE_DURATION_MS;
        return insights;
    },
};
export default adminInsightsEngine;
//# sourceMappingURL=AdminInsightsEngine.js.map