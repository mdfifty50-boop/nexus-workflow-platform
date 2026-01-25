# Nexus - Complete Setup Guide

## Table of Contents
1. [Quick Start](#quick-start)
2. [Detailed Setup](#detailed-setup)
3. [Development Workflow](#development-workflow)
4. [Production Deployment](#production-deployment)
5. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Prerequisites
- Node.js 20+ installed
- npm or yarn
- Git

### 2. Clone and Install
```bash
git clone <repository-url>
cd nexus
npm install
```

### 3. Set Up Supabase

#### Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Click "New Project"
3. Enter project details:
   - **Name:** Nexus
   - **Database Password:** (save this securely)
   - **Region:** Choose closest to you
4. Wait for project to be created (~2 minutes)

#### Get Your Credentials
1. In Supabase dashboard, go to **Settings** > **API**
2. Copy these values:
   - **Project URL**
   - **Anon public key**

#### Run Database Migration
1. In Supabase dashboard, click **SQL Editor**
2. Click **New query**
3. Copy content from `supabase/migrations/20260106000001_initial_setup.sql`
4. Paste and click **Run**
5. Verify tables were created in **Table Editor**

### 4. Configure Environment
```bash
# Create environment file
cp .env.example .env

# Edit .env and add your credentials
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

### 5. Start Development Server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 6. Create Your First Account
1. Click "Sign up"
2. Enter email and password
3. Check your email for verification (Supabase sends confirmation)
4. Click verification link
5. Sign in and start using Nexus!

---

## Detailed Setup

### Database Schema Overview

The migration creates these tables:

#### Core Tables
- **users** - User profiles (extends Supabase auth.users)
- **projects** - User projects
- **workflows** - Workflow definitions
- **workflow_executions** - Execution history
- **integration_credentials** - OAuth tokens (encrypted)

#### Security Features
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Encrypted integration credentials
- Automatic timestamp tracking

### Authentication Setup

#### Email/Password (Default)
Already configured. Users can:
- Sign up with email/password
- Receive email verification
- Reset password via email

#### Google OAuth (Optional)
1. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com)
2. Configure authorized redirect URI:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
3. In Supabase:
   - **Authentication** > **Providers** > **Google**
   - Enable and add Client ID + Secret

#### Magic Links (Passwordless)
1. In Supabase: **Authentication** > **Email Templates**
2. Customize "Magic Link" template
3. Users can sign in via email link only

### Storage Setup (Avatar Uploads)

1. In Supabase: **Storage**
2. Create new bucket: `avatars`
3. Make bucket **Public**
4. Set policies:
   ```sql
   -- Users can upload their own avatars
   CREATE POLICY "Users can upload own avatar"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

   -- Users can update their own avatars
   CREATE POLICY "Users can update own avatar"
   ON storage.objects FOR UPDATE
   TO authenticated
   USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
   ```

---

## Development Workflow

### Project Structure
```
nexus/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── CreateProjectModal.tsx
│   │   └── ProtectedRoute.tsx
│   ├── contexts/         # React contexts
│   │   └── AuthContext.tsx
│   ├── hooks/            # Custom hooks
│   │   ├── useProjects.ts
│   │   └── useWorkflows.ts
│   ├── lib/              # Utilities
│   │   ├── supabase.ts   # Supabase client
│   │   └── utils.ts      # Helper functions
│   ├── pages/            # Page components
│   │   ├── Login.tsx
│   │   ├── SignUp.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Profile.tsx
│   │   ├── Projects.tsx
│   │   ├── ProjectDetail.tsx
│   │   ├── ProjectSettings.tsx
│   │   ├── WorkflowDetail.tsx
│   │   └── Integrations.tsx
│   ├── types/            # TypeScript types
│   │   └── database.ts
│   └── App.tsx           # Main app component
├── supabase/
│   ├── migrations/       # Database migrations
│   └── README.md         # Supabase setup guide
└── public/               # Static assets
```

### Available Scripts

```bash
# Development
npm run dev              # Start dev server (port 5173)
npm run build           # Build for production
npm run preview         # Preview production build
npm run lint            # Run ESLint

# Type checking
npx tsc --noEmit        # Check TypeScript types
```

### Code Style
- Use TypeScript for all new files
- Follow existing code patterns
- Use Tailwind CSS for styling
- Prefer functional components with hooks

### Adding New Features

#### 1. Create Database Schema
```sql
-- Add to new migration file
CREATE TABLE my_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  -- ... other fields
);

-- Enable RLS
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view own data"
ON my_table FOR SELECT
TO authenticated
USING (user_id = auth.uid());
```

#### 2. Create TypeScript Types
```typescript
// src/types/database.ts
export interface MyTable {
  id: string
  created_at: string
  // ... other fields
}
```

#### 3. Create Custom Hook
```typescript
// src/hooks/useMyFeature.ts
export function useMyFeature() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    const { data, error } = await supabase
      .from('my_table')
      .select('*')

    if (!error) setData(data)
    setLoading(false)
  }

  return { data, loading, loadData }
}
```

#### 4. Create Page Component
```typescript
// src/pages/MyFeature.tsx
export function MyFeature() {
  const { data, loading } = useMyFeature()

  if (loading) return <div>Loading...</div>

  return <div>{/* Your UI */}</div>
}
```

#### 5. Add Route
```typescript
// src/App.tsx
<Route path="/my-feature" element={
  <ProtectedRoute>
    <MyFeature />
  </ProtectedRoute>
} />
```

---

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables (Production)
Set these in Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Troubleshooting

### Build Errors

#### "Cannot find module '@/...'"
- Check `tsconfig.json` has path aliases configured
- Verify `vite.config.ts` has resolve aliases

#### "Type error in components"
- Run `npx tsc --noEmit` to see all type errors
- Check Supabase types match database schema

### Runtime Errors

#### "Failed to fetch"
- Verify `.env` file exists with correct values
- Check Supabase project URL is correct
- Ensure you're not in incognito mode (blocks local storage)

#### "User is not authenticated"
- Clear browser local storage
- Sign out and sign in again
- Check Supabase authentication is enabled

#### "Row Level Security policy violation"
- Verify RLS policies in Supabase
- Check you're signed in as correct user
- Review SQL Editor logs in Supabase

### Development Issues

#### Hot reload not working
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

#### Port already in use
```bash
# Kill process on port 5173
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5173 | xargs kill
```

### Database Issues

#### Migration failed
1. Go to Supabase SQL Editor
2. Check error message
3. Fix SQL syntax
4. Re-run migration

#### Data not appearing
1. Check **Table Editor** in Supabase
2. Verify data exists in database
3. Check RLS policies allow SELECT
4. Review browser console for errors

---

## Next Steps

### Recommended Order
1. Complete Supabase setup ✓
2. Configure authentication ✓
3. Test user signup/signin ✓
4. Create a test project ✓
5. Create a test workflow ✓
6. Connect an integration
7. Execute a workflow
8. Deploy to production

### Learning Resources
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide)

### Support
- GitHub Issues: Report bugs
- Discussions: Ask questions
- Email: support@nexus-platform.com

---

**Happy coding! 🚀**
