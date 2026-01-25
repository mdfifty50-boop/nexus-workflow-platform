import { createClient } from '@supabase/supabase-js';
// Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
// =============================================================================
// Pricing (per 1M tokens as of 2024)
// =============================================================================
const MODEL_PRICING = {
    'claude-3-opus-20240229': { input: 15.0, output: 75.0 },
    'claude-3-sonnet-20240229': { input: 3.0, output: 15.0 },
    'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 },
    'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
    'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
    'claude-opus-4-5-20251101': { input: 15.0, output: 75.0 },
    'gpt-4-turbo': { input: 10.0, output: 30.0 },
    'gpt-4': { input: 30.0, output: 60.0 },
    'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
    whisper: { input: 0.006, output: 0 }, // Per minute, not tokens
};
// Efficiency thresholds (cost per successful operation)
const EFFICIENCY_THRESHOLDS = {
    excellent: 0.01, // < $0.01 per operation
    good: 0.05, // < $0.05 per operation
    average: 0.15, // < $0.15 per operation
    // poor: > $0.15
};
// =============================================================================
// Token Service
// =============================================================================
export const tokenService = {
    // ---------------------------------------------------------------------------
    // Calculate Cost
    // ---------------------------------------------------------------------------
    calculateCost(model, inputTokens, outputTokens) {
        const pricing = MODEL_PRICING[model] || MODEL_PRICING['claude-sonnet-4-20250514'];
        const inputCost = (inputTokens / 1_000_000) * pricing.input;
        const outputCost = (outputTokens / 1_000_000) * pricing.output;
        return Math.round((inputCost + outputCost) * 10000) / 10000; // 4 decimal places
    },
    // ---------------------------------------------------------------------------
    // Track Token Usage (Story 9.1)
    // ---------------------------------------------------------------------------
    async trackUsage(projectId, clerkUserId, model, inputTokens, outputTokens, operation, workflowId) {
        try {
            const cost = this.calculateCost(model, inputTokens, outputTokens);
            const { data, error } = await supabase
                .from('token_usage')
                .insert({
                workflow_id: workflowId || null,
                project_id: projectId,
                clerk_user_id: clerkUserId,
                model,
                input_tokens: inputTokens,
                output_tokens: outputTokens,
                total_tokens: inputTokens + outputTokens,
                cost_usd: cost,
                operation,
            })
                .select()
                .single();
            if (error) {
                console.error('Failed to track token usage:', error);
                return null;
            }
            return data;
        }
        catch (err) {
            console.error('Token tracking error:', err);
            return null;
        }
    },
    // ---------------------------------------------------------------------------
    // Get Usage Summary (Story 9.2)
    // ---------------------------------------------------------------------------
    async getUsageSummary(clerkUserId, projectId, startDate, endDate) {
        let query = supabase
            .from('token_usage')
            .select('*')
            .eq('clerk_user_id', clerkUserId);
        if (projectId) {
            query = query.eq('project_id', projectId);
        }
        if (startDate) {
            query = query.gte('created_at', startDate.toISOString());
        }
        if (endDate) {
            query = query.lte('created_at', endDate.toISOString());
        }
        const { data } = await query;
        const usage = data || [];
        // Calculate totals
        let totalTokens = 0;
        let totalCost = 0;
        let inputTokens = 0;
        let outputTokens = 0;
        const byModel = {};
        const byOperation = {};
        let operationCount = 0;
        usage.forEach((u) => {
            totalTokens += u.total_tokens;
            totalCost += u.cost_usd;
            inputTokens += u.input_tokens;
            outputTokens += u.output_tokens;
            operationCount++;
            // By model
            if (!byModel[u.model]) {
                byModel[u.model] = { tokens: 0, cost: 0 };
            }
            byModel[u.model].tokens += u.total_tokens;
            byModel[u.model].cost += u.cost_usd;
            // By operation
            if (!byOperation[u.operation]) {
                byOperation[u.operation] = { tokens: 0, cost: 0 };
            }
            byOperation[u.operation].tokens += u.total_tokens;
            byOperation[u.operation].cost += u.cost_usd;
        });
        // Calculate efficiency (Story 9.3)
        const avgCostPerOperation = operationCount > 0 ? totalCost / operationCount : 0;
        let efficiency;
        let efficiencyScore;
        if (avgCostPerOperation < EFFICIENCY_THRESHOLDS.excellent) {
            efficiency = 'excellent';
            efficiencyScore = 100;
        }
        else if (avgCostPerOperation < EFFICIENCY_THRESHOLDS.good) {
            efficiency = 'good';
            efficiencyScore = 75;
        }
        else if (avgCostPerOperation < EFFICIENCY_THRESHOLDS.average) {
            efficiency = 'average';
            efficiencyScore = 50;
        }
        else {
            efficiency = 'poor';
            efficiencyScore = 25;
        }
        return {
            totalTokens,
            totalCost: Math.round(totalCost * 100) / 100,
            inputTokens,
            outputTokens,
            byModel,
            byOperation,
            efficiency,
            efficiencyScore,
        };
    },
    // ---------------------------------------------------------------------------
    // Check Budget (Story 9.4)
    // ---------------------------------------------------------------------------
    async checkBudget(clerkUserId, projectId, budgetLimit) {
        // Get current month's usage
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const summary = await this.getUsageSummary(clerkUserId, projectId, startOfMonth);
        const percentUsed = (summary.totalCost / budgetLimit) * 100;
        const remaining = budgetLimit - summary.totalCost;
        if (percentUsed >= 100) {
            return {
                type: 'critical',
                message: `Budget exceeded! You've used $${summary.totalCost.toFixed(2)} of your $${budgetLimit.toFixed(2)} limit.`,
                percentUsed,
                remaining,
            };
        }
        if (percentUsed >= 80) {
            return {
                type: 'warning',
                message: `Approaching budget limit: ${percentUsed.toFixed(0)}% used ($${summary.totalCost.toFixed(2)} of $${budgetLimit.toFixed(2)}).`,
                percentUsed,
                remaining,
            };
        }
        if (percentUsed >= 50) {
            return {
                type: 'info',
                message: `Budget status: ${percentUsed.toFixed(0)}% used this month.`,
                percentUsed,
                remaining,
            };
        }
        return null;
    },
    // ---------------------------------------------------------------------------
    // Get Optimization Recommendations (Story 9.5)
    // ---------------------------------------------------------------------------
    async getOptimizationRecommendations(clerkUserId, projectId) {
        const recommendations = [];
        // Get last 30 days of usage
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const summary = await this.getUsageSummary(clerkUserId, projectId, thirtyDaysAgo);
        // Analyze model usage
        const models = Object.entries(summary.byModel);
        const opusUsage = models.find(([m]) => m.includes('opus'));
        const _sonnetUsage = models.find(([m]) => m.includes('sonnet'));
        const haikuUsage = models.find(([m]) => m.includes('haiku'));
        // High Opus usage recommendation
        if (opusUsage && opusUsage[1].cost > summary.totalCost * 0.5) {
            recommendations.push('Consider using Claude Sonnet for routine tasks. Opus is best reserved for complex reasoning tasks.');
        }
        // Low Haiku usage recommendation
        if (!haikuUsage || haikuUsage[1].cost < summary.totalCost * 0.1) {
            recommendations.push('Claude Haiku is great for simple classifications and extractions at 1/12th the cost of Sonnet.');
        }
        // High input/output ratio
        if (summary.inputTokens > summary.outputTokens * 3) {
            recommendations.push('High input token usage detected. Consider summarizing context or using RAG to reduce input size.');
        }
        // Efficiency recommendations
        if (summary.efficiency === 'poor') {
            recommendations.push('Your cost per operation is high. Review workflow complexity and consider batching similar operations.');
        }
        // Operation-specific recommendations
        const operations = Object.entries(summary.byOperation);
        operations.forEach(([op, usage]) => {
            if (usage.cost > summary.totalCost * 0.3) {
                recommendations.push(`The "${op}" operation accounts for ${((usage.cost / summary.totalCost) * 100).toFixed(0)}% of costs. Consider optimizing this workflow.`);
            }
        });
        // If no recommendations, provide positive feedback
        if (recommendations.length === 0) {
            recommendations.push('Your token usage is well-optimized. Keep up the efficient workflows!');
        }
        return recommendations;
    },
    // ---------------------------------------------------------------------------
    // Get Daily Usage Trend
    // ---------------------------------------------------------------------------
    async getDailyUsageTrend(clerkUserId, projectId, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        let query = supabase
            .from('token_usage')
            .select('created_at, total_tokens, cost_usd')
            .eq('clerk_user_id', clerkUserId)
            .gte('created_at', startDate.toISOString());
        if (projectId) {
            query = query.eq('project_id', projectId);
        }
        const { data } = await query.order('created_at', { ascending: true });
        // Aggregate by day
        const dailyData = {};
        data?.forEach((u) => {
            const date = new Date(u.created_at).toISOString().split('T')[0];
            if (!dailyData[date]) {
                dailyData[date] = { tokens: 0, cost: 0 };
            }
            dailyData[date].tokens += u.total_tokens;
            dailyData[date].cost += u.cost_usd;
        });
        return Object.entries(dailyData).map(([date, usage]) => ({
            date,
            tokens: usage.tokens,
            cost: Math.round(usage.cost * 100) / 100,
        }));
    },
    // ---------------------------------------------------------------------------
    // Format Cost Display (Story 9.2)
    // ---------------------------------------------------------------------------
    formatCost(costUsd) {
        if (costUsd < 0.01) {
            return `$${(costUsd * 100).toFixed(2)}¢`;
        }
        if (costUsd < 1) {
            return `$${costUsd.toFixed(2)}`;
        }
        return `$${costUsd.toFixed(2)}`;
    },
    // ---------------------------------------------------------------------------
    // Get Efficiency Badge (Story 9.3)
    // ---------------------------------------------------------------------------
    getEfficiencyBadge(efficiency) {
        switch (efficiency) {
            case 'excellent':
                return { emoji: '🌟', color: 'green', label: 'Excellent Efficiency' };
            case 'good':
                return { emoji: '✨', color: 'blue', label: 'Good Efficiency' };
            case 'average':
                return { emoji: '📊', color: 'yellow', label: 'Average Efficiency' };
            case 'poor':
                return { emoji: '⚠️', color: 'red', label: 'Needs Optimization' };
        }
    },
};
//# sourceMappingURL=tokenService.js.map