# Supabase Setup Instructions

## 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in the project details:
   - **Name:** Nexus
   - **Database Password:** (generate a strong password)
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Free tier (for development)

## 2. Get Your Credentials

1. Once your project is created, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)

## 3. Configure Environment Variables

1. In the `nexus` directory, create a `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJxxx...
   ```

## 4. Run Database Migrations

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy the contents of `supabase/migrations/20260106000001_initial_setup.sql`
5. Paste it into the SQL editor
6. Click **Run** to execute the migration

## 5. Configure Authentication Providers

### Email/Password (Default - Already Enabled)
No additional configuration needed.

### Google OAuth (Optional)

1. Go to **Authentication** > **Providers** in Supabase dashboard
2. Enable **Google** provider
3. Follow instructions to create OAuth credentials in Google Cloud Console
4. Add your Google OAuth credentials to Supabase

### Magic Link (Passwordless)

1. Go to **Authentication** > **Providers**
2. Email provider is enabled by default with magic links
3. Configure email templates under **Authentication** > **Email Templates**

## 6. Test Authentication

1. Start the dev server: `npm run dev`
2. Navigate to the app and try signing up
3. Check the **Authentication** > **Users** tab in Supabase dashboard to verify user creation

## 7. Database Schema

The migration creates the following tables:
- `users` - User profiles (extends auth.users)
- `projects` - User projects
- `project_members` - Project collaboration
- `workflows` - Workflow definitions
- `workflow_executions` - Workflow execution history
- `integration_credentials` - External service credentials (encrypted)

All tables have Row Level Security (RLS) enabled with appropriate policies.

## 8. Development Tips

- Use the **Table Editor** in Supabase dashboard to view/edit data
- Use the **SQL Editor** to run custom queries
- Monitor real-time changes in **Database** > **Realtime**
- Check logs in **Logs** > **Database Logs** for debugging

## 9. Production Checklist

- [ ] Enable email confirmation in Authentication settings
- [ ] Configure custom SMTP for production emails
- [ ] Set up database backups
- [ ] Review and audit RLS policies
- [ ] Enable database point-in-time recovery
- [ ] Set up monitoring and alerts
