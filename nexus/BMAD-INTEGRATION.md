# BMAD Integration with Claude AI

## Overview

Nexus now includes **real Claude AI integration** for executing BMAD (Business, Modular, Actionable, Data-driven) workflows using the Anthropic API.

## Setup

### 1. Get Your Anthropic API Key

1. Visit [console.anthropic.com](https://console.anthropic.com)
2. Create an account or sign in
3. Navigate to **API Keys**
4. Click **Create Key**
5. Copy your API key

### 2. Configure Environment

Add your API key to your `.env` file:

```env
VITE_ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

Restart your development server or redeploy to production.

### 3. Update Vercel Environment Variables

If you're using Vercel:

1. Go to your project → **Settings** → **Environment Variables**
2. Add:
   - Name: `VITE_ANTHROPIC_API_KEY`
   - Value: Your Anthropic API key
3. Redeploy your application

## How It Works

### Workflow Execution

When you execute a workflow:

1. **With API Key**: Uses real Claude AI (Sonnet 4.5 by default)
   - Sends structured BMAD prompts to Claude
   - Receives intelligent, context-aware responses
   - Tracks actual token usage and costs
   - Stores execution results in Supabase

2. **Without API Key**: Simulation mode
   - Provides example outputs
   - Estimates token usage and costs
   - Shows instructions for enabling real integration

### BMAD Methodology

The integration follows BMAD principles:

- **Business-focused**: Aligns outputs with business objectives
- **Modular**: Breaks tasks into reusable components
- **Actionable**: Provides clear, executable steps
- **Data-driven**: Bases decisions on concrete metrics

### Workflow Types

#### 1. BMAD Workflow
```json
{
  "type": "BMAD",
  "prompt": "Analyze customer churn data and provide retention strategies",
  "model": "claude-sonnet-4-20250514",
  "maxTokens": 4096,
  "temperature": 1.0
}
```

Structured for business analysis with BMAD framework.

#### 2. Simple Workflow
```json
{
  "type": "Simple",
  "prompt": "Summarize this quarterly report",
  "model": "claude-haiku-4-20250514",
  "maxTokens": 2048
}
```

Direct Claude interaction without BMAD structure.

#### 3. Scheduled Workflow
```json
{
  "type": "Scheduled",
  "prompt": "Generate daily sales summary",
  "model": "claude-sonnet-4-20250514"
}
```

Automated execution with result summaries.

## Model Selection

Available models:

| Model | Speed | Quality | Input Cost | Output Cost | Best For |
|-------|-------|---------|------------|-------------|----------|
| **Claude Opus 4** | Slow | Highest | $15/MTok | $75/MTok | Complex analysis |
| **Claude Sonnet 4** | Medium | High | $3/MTok | $15/MTok | Most workflows (default) |
| **Claude Haiku 4** | Fast | Good | $0.25/MTok | $1.25/MTok | Simple tasks |

Configure in workflow settings or leave blank for Sonnet (recommended).

## Cost Tracking

Every execution tracks:

- **Input tokens**: Tokens sent to Claude
- **Output tokens**: Tokens received from Claude
- **Total cost**: Calculated based on model pricing
- **Execution time**: Duration of the workflow

View cost analytics in:
- Workflow detail page
- Execution history
- Dashboard metrics (coming soon)

## Example Workflows

### Customer Analysis
```
Type: BMAD
Prompt: Analyze top 100 customers by revenue. Identify patterns, segment customers, and recommend upsell strategies.
Model: claude-sonnet-4-20250514
```

### Email Automation
```
Type: Simple
Prompt: Generate a professional follow-up email for leads who attended our webinar yesterday.
Model: claude-haiku-4-20250514
```

### Daily Reports
```
Type: Scheduled
Prompt: Summarize today's support tickets, categorize by issue type, and flag urgent items.
Model: claude-sonnet-4-20250514
```

## Best Practices

### 1. Choose the Right Model
- **Opus**: Complex multi-step analysis, strategic planning
- **Sonnet**: General workflows, data analysis, recommendations
- **Haiku**: Quick summaries, simple classifications

### 2. Optimize Token Usage
- Be specific in prompts (avoid unnecessary context)
- Use `maxTokens` to limit output length
- Monitor costs in execution history

### 3. BMAD Structure
For best results with BMAD workflows:
- Define clear business objectives
- Specify expected deliverables
- Include relevant data/metrics
- Ask for actionable next steps

### 4. Error Handling
- Check execution status in history
- Review error messages for API issues
- Ensure API key is valid and has credits

## Troubleshooting

### "Simulated Execution" Message
**Cause**: No API key configured
**Solution**: Add `VITE_ANTHROPIC_API_KEY` to `.env` and restart

### "Authentication Error"
**Cause**: Invalid API key
**Solution**: Verify key in console.anthropic.com and update `.env`

### "Rate Limit Exceeded"
**Cause**: Too many requests
**Solution**: Wait or upgrade Anthropic plan

### "Insufficient Credits"
**Cause**: API credit balance low
**Solution**: Add credits at console.anthropic.com

## Security Notes

- **Never commit** API keys to Git
- Use environment variables only
- For production, consider backend proxy
- The `dangerouslyAllowBrowser: true` flag is set for client-side usage
  - For enterprise: Move execution to backend API
  - Protects API key and improves security

## Cost Management

### Estimate Costs

Average workflow costs:

- **Simple (Haiku)**: $0.001 - $0.01 per execution
- **Standard (Sonnet)**: $0.01 - $0.10 per execution
- **Complex (Opus)**: $0.10 - $1.00 per execution

### Monitor Spend

1. Check execution history for cumulative costs
2. Set up alerts in Anthropic console
3. Use workflow analytics (coming soon)

### Optimize Spending

- Use Haiku for simple tasks
- Limit `maxTokens` appropriately
- Archive unused workflows
- Review high-cost executions

## API Reference

### BMAD Service

```typescript
import { bmadService } from '@/lib/bmad-service'

const result = await bmadService.executeWorkflow({
  type: 'BMAD',
  prompt: 'Your task here',
  model: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
  temperature: 1.0
})

console.log(result.output)
console.log(`Cost: $${result.costUSD}`)
console.log(`Tokens: ${result.tokensUsed}`)
```

### Check Configuration

```typescript
if (bmadService.isConfigured()) {
  console.log('Claude AI integration active')
} else {
  console.log('Running in simulation mode')
}
```

## Roadmap

Coming features:

- [ ] Workflow templates library
- [ ] Advanced cost analytics dashboard
- [ ] Scheduled execution (cron-like)
- [ ] Multi-model comparison
- [ ] Streaming responses
- [ ] Conversation threads
- [ ] Custom prompt templates
- [ ] Team usage quotas

## Support

- **Documentation**: See README.md and DEPLOY-NOW.md
- **Anthropic Docs**: [docs.anthropic.com](https://docs.anthropic.com)
- **API Status**: [status.anthropic.com](https://status.anthropic.com)

---

**Ready to scale your AI workflows with BMAD + Claude!** 🚀
