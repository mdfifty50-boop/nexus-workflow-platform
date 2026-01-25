# Nexus - AI-Powered Workflow Automation Platform

Nexus is an AI-powered workflow automation platform that enables business users to create, execute, and monitor complex multi-agent AI workflows without coding. Build automations like "When I get an email from a client, create a task in ClickUp and notify me on Slack" - all through natural language.

---

## Local Dev (Quick Start)

### Prerequisites
- **Node.js 20+** - Check with `node -v`
- **Claude API key** - Get from [console.anthropic.com](https://console.anthropic.com)

### One-Command Setup

```bash
# 1. Clone and enter directory
git clone <repository-url>
cd nexus

# 2. Install dependencies
npm install

# 3. Set up environment (only ANTHROPIC_API_KEY required)
cp .env.example .env
# Edit .env: Add your ANTHROPIC_API_KEY

# 4. Start everything
npm run dev:all
```

**Open [http://localhost:5173](http://localhost:5173)** - That's it!

> **Note:** Auth is bypassed in dev mode. For production, configure Clerk credentials.

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev:all` | **Start frontend + backend** (recommended) |
| `npm run dev` | Frontend only (port 5173) |
| `npm run dev:server` | Backend only (port 4567) |
| `npm run build` | Build for production |
| `npm run start` | Run production server |

### Minimum .env for Development

```env
# Only this is required to run locally:
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# Add this for app integrations (Gmail, Slack, etc.):
COMPOSIO_API_KEY=your_composio_key
```

See `.env.example` for all 40+ optional variables.

---

## Features

- **Natural Language Workflows** - Describe what you want, Nexus builds it
- **500+ App Integrations** - Gmail, Slack, Google Sheets, Dropbox, GitHub via Composio
- **Visual Workflow Builder** - See your automation as connected nodes
- **One-Click OAuth** - Connect apps without leaving the chat
- **Real-time Execution** - Watch workflows run step-by-step
- **Kuwait Region Support** - Arabic, KWD currency, Sunday-Thursday week

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Node.js/Express, Supabase (PostgreSQL) |
| AI Engine | Claude API (Opus 4.5, Sonnet 4.5) |
| Integrations | Composio MCP (500+ apps) |
| Auth | Clerk (production) / Bypass (development) |
| Payments | Stripe |

## Project Structure

```
nexus/
├── src/                    # Frontend React app
│   ├── components/         # UI components
│   │   └── chat/           # Chat & workflow preview
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilities
│   ├── pages/              # Route pages
│   └── services/           # API services
├── server/                 # Backend Express server
│   ├── routes/             # API endpoints
│   ├── services/           # Business logic
│   └── agents/             # AI personality definitions
├── supabase/               # Database migrations
└── tests/                  # Test suites
```

## API Routes

| Route | Purpose |
|-------|---------|
| `/api/chat` | AI conversation endpoint |
| `/api/workflow` | Workflow execution |
| `/api/workflows` | CRUD for workflows |
| `/api/composio` | Integration OAuth & execution |
| `/api/oauth` | White-label OAuth flows |
| `/api/preflight` | Pre-execution parameter validation |

## Environment Variables

### Required for Production

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Claude AI (core engine) |
| `VITE_CLERK_PUBLISHABLE_KEY` | Frontend auth |
| `CLERK_SECRET_KEY` | Backend auth |
| `VITE_SUPABASE_URL` | Database URL |
| `VITE_SUPABASE_ANON_KEY` | Database public key |

### Recommended

| Variable | Purpose |
|----------|---------|
| `COMPOSIO_API_KEY` | App integrations (Gmail, Slack, etc.) |
| `STRIPE_SECRET_KEY` | Payment processing |

See `.env.example` for complete list with setup URLs.

## Database

Uses Supabase (PostgreSQL) with Row-Level Security.

Key tables: `user_profiles`, `workflows`, `workflow_executions`, `user_integrations`

## Testing

```bash
npm run test           # Unit tests
npm run test:e2e       # E2E tests (Playwright)
npm run test:e2e:headed # E2E with visible browser
```

## Deployment

### Vercel (Recommended)
```bash
vercel --prod
```
Set env vars in Vercel Dashboard → Settings → Environment Variables.

## Pricing

| Tier | Workflows/Month | Price |
|------|-----------------|-------|
| Free | 3 | $0 |
| Launch | 50 | $79 |
| Professional | 200 | $149 |
| Business | Unlimited | $299 |

## License

Proprietary - All rights reserved

## Support

Email: support@nexus-platform.com
