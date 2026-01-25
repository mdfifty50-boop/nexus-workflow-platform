/**
 * Claude Code Proxy Utility for Backend Server
 *
 * Uses Claude Code Max subscription (FREE) via proxy at localhost:4568
 * Falls back to direct Anthropic API if proxy unavailable
 * Falls back to OpenAI if Anthropic unavailable
 *
 * INTELLIGENT MODEL TIERING:
 * - Haiku ($0.25/1M): Intent classification, simple Q&A, status updates
 * - Sonnet ($3/1M): Workflow planning, code generation, general tasks
 * - Opus ($15/1M): Complex multi-step reasoning, critical decisions
 *
 * FALLBACK CHAIN:
 * 1. Claude Code Proxy (FREE via Max subscription) - with retry logic
 * 2. Direct Anthropic API (requires credits)
 * 3. OpenAI API (requires credits) - as emergency fallback
 */
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
const PROXY_URL = 'http://localhost:4568';
const PROXY_CHECK_INTERVAL = 30000; // 30 seconds
let proxyAvailable = null;
let lastProxyCheck = 0;
// Model IDs for each tier
const MODEL_IDS = {
    haiku: 'claude-3-5-haiku-20241022',
    sonnet: 'claude-sonnet-4-20250514',
    opus: 'claude-opus-4-20250514'
};
// Pricing per 1M tokens (input/output)
const MODEL_PRICING = {
    haiku: { input: 0.25, output: 1.25 }, // Haiku 3.5 pricing
    sonnet: { input: 3.0, output: 15.0 }, // Sonnet 4 pricing
    opus: { input: 15.0, output: 75.0 } // Opus 4 pricing
};
// Task type to model tier mapping
const TASK_TO_TIER = {
    // Haiku tier tasks - simple, fast, cheap
    classification: 'haiku',
    simple_qa: 'haiku',
    status_update: 'haiku',
    data_extraction: 'haiku',
    // Sonnet tier tasks - balanced
    workflow_planning: 'sonnet',
    code_generation: 'sonnet',
    content_generation: 'sonnet',
    translation: 'sonnet',
    // Opus tier tasks - complex, expensive
    complex_reasoning: 'opus',
    critical_decision: 'opus',
    multi_step_analysis: 'opus'
};
// Keywords for automatic task classification
const TASK_KEYWORDS = {
    classification: ['classify', 'categorize', 'intent', 'type of', 'which category', 'label'],
    simple_qa: ['what is', 'who is', 'when', 'where', 'how many', 'define', 'explain briefly'],
    status_update: ['status', 'update', 'progress', 'notify', 'inform'],
    data_extraction: ['extract', 'parse', 'get the', 'find the', 'list all'],
    workflow_planning: ['plan', 'workflow', 'steps', 'process', 'sequence', 'orchestrate'],
    code_generation: ['code', 'function', 'implement', 'program', 'script', 'api'],
    content_generation: ['write', 'compose', 'draft', 'create content', 'generate text', 'email'],
    translation: ['translate', 'convert language', 'arabic to english', 'localize'],
    complex_reasoning: ['analyze', 'evaluate', 'compare', 'assess', 'review thoroughly', 'deep analysis'],
    critical_decision: ['decide', 'recommend', 'choose between', 'critical', 'important decision'],
    multi_step_analysis: ['multi-step', 'comprehensive', 'end-to-end', 'full analysis', 'investigate']
};
/**
 * Classify a task based on the prompt content
 */
export function classifyTask(systemPrompt, userMessage) {
    const combinedText = `${systemPrompt} ${userMessage}`.toLowerCase();
    // Score each task type based on keyword matches
    const scores = {
        classification: 0,
        simple_qa: 0,
        status_update: 0,
        data_extraction: 0,
        workflow_planning: 0,
        code_generation: 0,
        content_generation: 0,
        translation: 0,
        complex_reasoning: 0,
        critical_decision: 0,
        multi_step_analysis: 0
    };
    for (const [taskType, keywords] of Object.entries(TASK_KEYWORDS)) {
        for (const keyword of keywords) {
            if (combinedText.includes(keyword)) {
                scores[taskType] += 1;
            }
        }
    }
    // Additional heuristics based on prompt characteristics
    const promptLength = combinedText.length;
    const hasJson = combinedText.includes('json') || combinedText.includes('{');
    const hasMultipleSteps = (combinedText.match(/step|then|next|after|finally/g) || []).length > 3;
    // Short prompts are likely simple
    if (promptLength < 200 && !hasMultipleSteps) {
        scores.simple_qa += 2;
    }
    // JSON output suggests structured extraction
    if (hasJson && promptLength < 500) {
        scores.data_extraction += 2;
        scores.classification += 1;
    }
    // Multiple steps suggest workflow or complex task
    if (hasMultipleSteps) {
        scores.workflow_planning += 2;
        scores.complex_reasoning += 1;
    }
    // Long prompts with analysis keywords suggest complex reasoning
    if (promptLength > 2000 && scores.complex_reasoning > 0) {
        scores.complex_reasoning += 2;
        scores.multi_step_analysis += 1;
    }
    // Find the highest scoring task type
    let maxScore = 0;
    let bestTask = 'content_generation'; // Default to Sonnet-level
    for (const [taskType, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            bestTask = taskType;
        }
    }
    return bestTask;
}
/**
 * Get the appropriate model for a task type
 */
export function getModelForTask(taskType) {
    const tier = TASK_TO_TIER[taskType];
    return {
        model: MODEL_IDS[tier],
        tier
    };
}
/**
 * Calculate cost for a model based on token usage
 */
export function calculateModelCost(tier, inputTokens, outputTokens) {
    const pricing = MODEL_PRICING[tier];
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    return Number((inputCost + outputCost).toFixed(6));
}
/**
 * Get tier from model ID
 */
export function getTierFromModel(modelId) {
    if (modelId.includes('haiku'))
        return 'haiku';
    if (modelId.includes('opus'))
        return 'opus';
    return 'sonnet'; // Default
}
/**
 * Check if Claude Code proxy is available
 * Set FORCE_DIRECT_API=true to skip proxy and use direct API
 */
export async function checkProxyHealth() {
    // Skip proxy if FORCE_DIRECT_API is set
    if (process.env.FORCE_DIRECT_API === 'true') {
        console.log('[Backend] FORCE_DIRECT_API=true - skipping proxy, using direct API');
        return false;
    }
    const now = Date.now();
    if (proxyAvailable !== null && (now - lastProxyCheck) < PROXY_CHECK_INTERVAL) {
        return proxyAvailable;
    }
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(`${PROXY_URL}/health`, {
            signal: controller.signal
        });
        clearTimeout(timeout);
        proxyAvailable = response.ok;
        lastProxyCheck = now;
        if (proxyAvailable) {
            console.log('[Backend] Claude Code Proxy available - using Max subscription (FREE)');
        }
        return proxyAvailable;
    }
    catch {
        proxyAvailable = false;
        lastProxyCheck = now;
        return false;
    }
}
/**
 * Call Claude via proxy with retry logic for transient failures
 * Supports full conversation history for context
 */
export async function callViaProxy(systemPrompt, messages, maxTokens = 4096, maxRetries = 3) {
    let lastError = null;
    // Build conversation context from history
    const conversationContext = messages.map(m => `${m.role === 'user' ? 'Human' : 'Assistant'}: ${m.content}`).join('\n\n');
    // The prompt includes full conversation for context
    const fullPrompt = conversationContext;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(`${PROXY_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: fullPrompt,
                    systemPrompt,
                    maxTokens
                })
            });
            if (!response.ok) {
                // Retry on 5xx errors (server errors are often transient)
                if (response.status >= 500 && attempt < maxRetries) {
                    console.log(`[Backend] Proxy returned ${response.status}, retrying (${attempt}/${maxRetries})...`);
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
                    continue;
                }
                throw new Error(`Proxy error: ${response.status}`);
            }
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Proxy execution failed');
            }
            // Estimate tokens from response length + conversation history
            const inputLength = messages.reduce((acc, m) => acc + m.content.length, 0);
            const estimatedTokens = Math.ceil(result.output.length / 4) + Math.ceil(inputLength / 4);
            return { text: result.output, tokensUsed: estimatedTokens };
        }
        catch (error) {
            lastError = error;
            if (attempt < maxRetries && (error.message?.includes('500') || error.message?.includes('502') || error.message?.includes('503'))) {
                console.log(`[Backend] Proxy error, retrying (${attempt}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                continue;
            }
            throw error;
        }
    }
    throw lastError || new Error('Proxy call failed after retries');
}
/**
 * Smart Claude call - tries proxy first, then direct API
 * Returns response text and cost info
 */
export async function callClaude(options) {
    const { systemPrompt, userMessage, maxTokens = 4096 } = options;
    // Try 1: Claude Code Proxy (FREE via Max subscription)
    const isProxyAvailable = await checkProxyHealth();
    if (isProxyAvailable) {
        try {
            console.log('[Backend] Calling Claude via proxy (FREE)...');
            // Wrap single message into messages array format
            const messagesArray = [{ role: 'user', content: userMessage }];
            const result = await callViaProxy(systemPrompt, messagesArray, maxTokens);
            return {
                text: result.text,
                tokensUsed: result.tokensUsed,
                costUSD: 0, // FREE via Max subscription
                viaProxy: true
            };
        }
        catch (error) {
            console.warn('[Backend] Proxy failed:', error.message);
        }
    }
    // Try 2: Direct Anthropic API (uses credits)
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
        try {
            console.log('[Backend] Calling Claude via direct API (paid)...');
            const client = new Anthropic({ apiKey });
            const response = await client.messages.create({
                model: options.model || 'claude-sonnet-4-20250514',
                max_tokens: maxTokens,
                system: systemPrompt,
                messages: [{ role: 'user', content: userMessage }]
            });
            const text = response.content[0].type === 'text' ? response.content[0].text : '';
            const inputTokens = response.usage.input_tokens;
            const outputTokens = response.usage.output_tokens;
            // Calculate cost (Sonnet 4 pricing)
            const costUSD = (inputTokens * 0.003 + outputTokens * 0.015) / 1000;
            return {
                text,
                tokensUsed: inputTokens + outputTokens,
                costUSD,
                viaProxy: false
            };
        }
        catch (error) {
            console.error('[Backend] Direct API failed:', error.message);
            throw error;
        }
    }
    throw new Error('No Claude access available - proxy down and no API key');
}
/**
 * Claude call with prompt caching support for direct API calls
 * Uses cache_control blocks for system prompts to reduce token costs
 * NOW SUPPORTS FULL CONVERSATION HISTORY FOR CONTEXT
 *
 * Pricing impact:
 * - Cache write: 25% extra (first request)
 * - Cache read: 90% savings (subsequent requests within 5 min)
 *
 * @param systemBlocks - Array of text blocks with optional cache_control
 * @param messages - Full conversation history (user + assistant messages)
 * @param maxTokens - Max tokens for response
 * @param model - Model to use
 */
export async function callClaudeWithCaching(options) {
    const { systemBlocks, messages, maxTokens = 4096, model = 'claude-sonnet-4-20250514' } = options;
    // For proxy, combine system blocks into single prompt (no caching benefit)
    const combinedSystemPrompt = systemBlocks.map(b => b.text).join('\n\n');
    // Try 1: Claude Code Proxy (FREE via Max subscription)
    const isProxyAvailable = await checkProxyHealth();
    if (isProxyAvailable) {
        try {
            console.log('[Backend] Calling Claude via proxy (FREE, no caching)...');
            const result = await callViaProxy(combinedSystemPrompt, messages, maxTokens);
            return {
                text: result.text,
                tokensUsed: result.tokensUsed,
                costUSD: 0, // FREE via Max subscription
                viaProxy: true,
                cacheMetrics: {
                    cacheCreationInputTokens: 0,
                    cacheReadInputTokens: 0,
                    uncachedInputTokens: result.tokensUsed
                }
            };
        }
        catch (error) {
            console.warn('[Backend] Proxy failed:', error.message);
        }
    }
    // Try 2: Direct Anthropic API with prompt caching
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
        try {
            console.log('[Backend] Calling Claude via direct API with prompt caching...');
            const client = new Anthropic({ apiKey });
            const response = await client.messages.create({
                model,
                max_tokens: maxTokens,
                system: systemBlocks,
                messages: messages // Full conversation history for context
            });
            const text = response.content[0].type === 'text' ? response.content[0].text : '';
            const usage = response.usage;
            // Extract cache metrics
            const cacheCreationInputTokens = usage.cache_creation_input_tokens || 0;
            const cacheReadInputTokens = usage.cache_read_input_tokens || 0;
            const uncachedInputTokens = usage.input_tokens;
            // Calculate total input tokens
            const totalInputTokens = cacheCreationInputTokens + cacheReadInputTokens + uncachedInputTokens;
            const outputTokens = usage.output_tokens;
            // Calculate cost with caching pricing
            // Cache writes: 125% of base ($0.00375/1K for Sonnet 4)
            // Cache reads: 10% of base ($0.0003/1K for Sonnet 4)
            // Uncached: base price ($0.003/1K for Sonnet 4)
            const cacheWriteCost = (cacheCreationInputTokens * 0.00375) / 1000;
            const cacheReadCost = (cacheReadInputTokens * 0.0003) / 1000;
            const uncachedCost = (uncachedInputTokens * 0.003) / 1000;
            const outputCost = (outputTokens * 0.015) / 1000;
            const costUSD = cacheWriteCost + cacheReadCost + uncachedCost + outputCost;
            // Log cache performance
            if (cacheReadInputTokens > 0) {
                console.log(`[Backend] Cache HIT: ${cacheReadInputTokens} tokens (90% savings)`);
            }
            else if (cacheCreationInputTokens > 0) {
                console.log(`[Backend] Cache WRITE: ${cacheCreationInputTokens} tokens`);
            }
            return {
                text,
                tokensUsed: totalInputTokens + outputTokens,
                costUSD,
                viaProxy: false,
                cacheMetrics: {
                    cacheCreationInputTokens,
                    cacheReadInputTokens,
                    uncachedInputTokens
                }
            };
        }
        catch (error) {
            console.error('[Backend] Direct API with caching failed:', error.message);
            // Don't throw yet - try OpenAI fallback
        }
    }
    // Try 3: OpenAI as emergency fallback
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
        try {
            console.log('[Backend] Trying OpenAI as emergency fallback...');
            const openai = new OpenAI({ apiKey: openaiKey });
            // Convert system blocks to string for OpenAI
            const systemPrompt = systemBlocks.map(b => b.text).join('\n\n');
            // Build OpenAI messages with full conversation history
            const openaiMessages = [
                { role: 'system', content: systemPrompt },
                ...messages
            ];
            const response = await openai.chat.completions.create({
                model: 'gpt-4o', // Fast and capable
                max_tokens: maxTokens,
                messages: openaiMessages
            });
            const text = response.choices[0]?.message?.content || '';
            const inputTokens = response.usage?.prompt_tokens || 0;
            const outputTokens = response.usage?.completion_tokens || 0;
            // GPT-4o pricing: $2.50/1M input, $10/1M output
            const costUSD = (inputTokens * 0.0025 + outputTokens * 0.01) / 1000;
            console.log('[Backend] OpenAI fallback succeeded');
            return {
                text,
                tokensUsed: inputTokens + outputTokens,
                costUSD,
                viaProxy: false,
                cacheMetrics: {
                    cacheCreationInputTokens: 0,
                    cacheReadInputTokens: 0,
                    uncachedInputTokens: inputTokens
                }
            };
        }
        catch (error) {
            console.error('[Backend] OpenAI fallback failed:', error.message);
        }
    }
    throw new Error('No AI access available - all providers failed (proxy, Anthropic API, OpenAI)');
}
/**
 * Create a Claude client that uses proxy when available
 * This is for compatibility with existing code that uses the Anthropic client directly
 */
export function getClaudeClient() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey)
        return null;
    return new Anthropic({ apiKey });
}
// =============================================================================
// INTELLIGENT MODEL TIERING - MAIN ENTRY POINT
// =============================================================================
/**
 * Call Claude with intelligent model tiering
 *
 * Automatically selects the most cost-effective model based on task analysis:
 * - Haiku ($0.25/1M): Intent classification, simple Q&A, status updates, data extraction
 * - Sonnet ($3/1M): Workflow planning, code generation, content generation, translation
 * - Opus ($15/1M): Complex reasoning, critical decisions, multi-step analysis
 *
 * Cost savings projection:
 * - 70% of requests can use Haiku (12x cheaper than Sonnet)
 * - 25% use Sonnet (balanced)
 * - 5% use Opus (only when truly needed)
 *
 * @param options.systemPrompt - System prompt for the model
 * @param options.userMessage - User message/task
 * @param options.maxTokens - Maximum tokens for response
 * @param options.forceModel - Override automatic selection (optional)
 * @param options.forceTier - Force a specific tier (optional)
 * @param options.taskType - Explicitly specify task type (optional)
 */
export async function callClaudeWithTiering(options) {
    const { systemPrompt, userMessage, maxTokens = 4096, forceModel, forceTier, taskType: explicitTaskType } = options;
    // Step 1: Classify the task (unless explicitly provided)
    const taskType = explicitTaskType || classifyTask(systemPrompt, userMessage);
    // Step 2: Determine the model to use
    let model;
    let tier;
    if (forceModel) {
        model = forceModel;
        tier = getTierFromModel(forceModel);
    }
    else if (forceTier) {
        tier = forceTier;
        model = MODEL_IDS[tier];
    }
    else {
        const modelInfo = getModelForTask(taskType);
        model = modelInfo.model;
        tier = modelInfo.tier;
    }
    // Step 3: Log the routing decision
    console.log(`[ModelTiering] Task: ${taskType} → Model: ${tier} (${model})`);
    // Step 4: Call Claude with the selected model
    const result = await callClaude({
        systemPrompt,
        userMessage,
        maxTokens,
        model
    });
    // Step 5: Calculate actual cost based on tier
    // Estimate token split (30% input, 70% output is typical)
    const estimatedInputTokens = Math.ceil(result.tokensUsed * 0.3);
    const estimatedOutputTokens = Math.ceil(result.tokensUsed * 0.7);
    // Cost if we had used Sonnet
    const sonnetCost = calculateModelCost('sonnet', estimatedInputTokens, estimatedOutputTokens);
    // Actual cost with tiered model
    const actualCost = result.viaProxy ? 0 : calculateModelCost(tier, estimatedInputTokens, estimatedOutputTokens);
    // Savings calculation
    const savingsVsSonnet = result.viaProxy ? sonnetCost : Math.max(0, sonnetCost - actualCost);
    if (savingsVsSonnet > 0 && !result.viaProxy) {
        console.log(`[ModelTiering] Savings: $${savingsVsSonnet.toFixed(6)} (vs Sonnet baseline)`);
    }
    return {
        text: result.text,
        tokensUsed: result.tokensUsed,
        costUSD: actualCost,
        viaProxy: result.viaProxy,
        model,
        tier,
        taskType,
        savingsVsSonnet
    };
}
/**
 * Pre-defined tiered call for common task types
 */
export const tieredCalls = {
    /**
     * Use Haiku for simple classification tasks
     */
    classify: (systemPrompt, userMessage, maxTokens = 500) => callClaudeWithTiering({
        systemPrompt,
        userMessage,
        maxTokens,
        forceTier: 'haiku',
        taskType: 'classification'
    }),
    /**
     * Use Haiku for data extraction
     */
    extract: (systemPrompt, userMessage, maxTokens = 1000) => callClaudeWithTiering({
        systemPrompt,
        userMessage,
        maxTokens,
        forceTier: 'haiku',
        taskType: 'data_extraction'
    }),
    /**
     * Use Haiku for status updates
     */
    statusUpdate: (systemPrompt, userMessage, maxTokens = 500) => callClaudeWithTiering({
        systemPrompt,
        userMessage,
        maxTokens,
        forceTier: 'haiku',
        taskType: 'status_update'
    }),
    /**
     * Use Sonnet for workflow planning
     */
    planWorkflow: (systemPrompt, userMessage, maxTokens = 4096) => callClaudeWithTiering({
        systemPrompt,
        userMessage,
        maxTokens,
        forceTier: 'sonnet',
        taskType: 'workflow_planning'
    }),
    /**
     * Use Sonnet for code generation
     */
    generateCode: (systemPrompt, userMessage, maxTokens = 4096) => callClaudeWithTiering({
        systemPrompt,
        userMessage,
        maxTokens,
        forceTier: 'sonnet',
        taskType: 'code_generation'
    }),
    /**
     * Use Sonnet for content generation
     */
    generateContent: (systemPrompt, userMessage, maxTokens = 4096) => callClaudeWithTiering({
        systemPrompt,
        userMessage,
        maxTokens,
        forceTier: 'sonnet',
        taskType: 'content_generation'
    }),
    /**
     * Use Opus for complex reasoning
     */
    complexReasoning: (systemPrompt, userMessage, maxTokens = 8192) => callClaudeWithTiering({
        systemPrompt,
        userMessage,
        maxTokens,
        forceTier: 'opus',
        taskType: 'complex_reasoning'
    }),
    /**
     * Use Opus for critical decisions
     */
    criticalDecision: (systemPrompt, userMessage, maxTokens = 8192) => callClaudeWithTiering({
        systemPrompt,
        userMessage,
        maxTokens,
        forceTier: 'opus',
        taskType: 'critical_decision'
    })
};
const metrics = {
    totalCalls: 0,
    callsByTier: { haiku: 0, sonnet: 0, opus: 0 },
    totalCostUSD: 0,
    totalSavingsUSD: 0,
    callsByTaskType: {
        classification: 0,
        simple_qa: 0,
        status_update: 0,
        data_extraction: 0,
        workflow_planning: 0,
        code_generation: 0,
        content_generation: 0,
        translation: 0,
        complex_reasoning: 0,
        critical_decision: 0,
        multi_step_analysis: 0
    }
};
/**
 * Record tiering metrics for analytics
 */
export function recordTieringMetrics(tier, taskType, costUSD, savingsUSD) {
    metrics.totalCalls++;
    metrics.callsByTier[tier]++;
    metrics.callsByTaskType[taskType]++;
    metrics.totalCostUSD += costUSD;
    metrics.totalSavingsUSD += savingsUSD;
}
/**
 * Get current tiering metrics
 */
export function getTieringMetrics() {
    const avgCostPerCall = metrics.totalCalls > 0 ? metrics.totalCostUSD / metrics.totalCalls : 0;
    const baselineCost = metrics.totalCostUSD + metrics.totalSavingsUSD;
    const savingsPercentage = baselineCost > 0 ? (metrics.totalSavingsUSD / baselineCost) * 100 : 0;
    const tierDistribution = {
        haiku: metrics.totalCalls > 0 ? `${((metrics.callsByTier.haiku / metrics.totalCalls) * 100).toFixed(1)}%` : '0%',
        sonnet: metrics.totalCalls > 0 ? `${((metrics.callsByTier.sonnet / metrics.totalCalls) * 100).toFixed(1)}%` : '0%',
        opus: metrics.totalCalls > 0 ? `${((metrics.callsByTier.opus / metrics.totalCalls) * 100).toFixed(1)}%` : '0%'
    };
    return {
        ...metrics,
        avgCostPerCall,
        savingsPercentage,
        tierDistribution
    };
}
/**
 * Reset tiering metrics
 */
export function resetTieringMetrics() {
    metrics.totalCalls = 0;
    metrics.callsByTier = { haiku: 0, sonnet: 0, opus: 0 };
    metrics.totalCostUSD = 0;
    metrics.totalSavingsUSD = 0;
    metrics.callsByTaskType = {
        classification: 0,
        simple_qa: 0,
        status_update: 0,
        data_extraction: 0,
        workflow_planning: 0,
        code_generation: 0,
        content_generation: 0,
        translation: 0,
        complex_reasoning: 0,
        critical_decision: 0,
        multi_step_analysis: 0
    };
}
export default {
    // Core functions
    checkProxyHealth,
    callViaProxy,
    callClaude,
    callClaudeWithCaching,
    getClaudeClient,
    // Model tiering functions
    callClaudeWithTiering,
    tieredCalls,
    classifyTask,
    getModelForTask,
    calculateModelCost,
    getTierFromModel,
    // Metrics
    recordTieringMetrics,
    getTieringMetrics,
    resetTieringMetrics,
    // Constants
    MODEL_IDS,
    MODEL_PRICING,
    TASK_TO_TIER
};
//# sourceMappingURL=claudeProxy.js.map