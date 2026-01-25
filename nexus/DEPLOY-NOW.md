# 🚀 Deploy Nexus to Production NOW

## ⚡ 15-Minute Deployment Checklist

Follow these steps **in order**. Each takes 2-3 minutes.

---

## ✅ Step 1: Create Supabase Project (3 minutes)

### 1.1 Create Account & Project
1. Go to **https://supabase.com**
2. Click **"Start your project"** (or Sign In if you have account)
3. Click **"New Project"**
4. Fill in:
   - **Name:** `nexus-production`
   - **Database Password:** (Generate strong password - SAVE THIS!)
   - **Region:** Choose closest to you
   - **Pricing Plan:** Free (for now)
5. Click **"Create new project"**
6. **WAIT** ~2 minutes for project to initialize

### 1.2 Get Your Credentials
1. Once ready, go to **Settings** (gear icon in sidebar)
2. Click **"API"**
3. Copy these values (you'll need them):
   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   anon public key: eyJhbGc...
   ```
4. **SAVE THESE** - you'll need them in Step 3

---

## ✅ Step 2: Run Database Migration (2 minutes)

### 2.1 Open SQL Editor
1. In your Supabase project, click **"SQL Editor"** in left sidebar
2. Click **"New query"**

### 2.2 Copy and Paste Migration
1. Open this file: `nexus/supabase/migrations/20260106000001_initial_setup.sql`
2. **Select ALL** the content (Ctrl+A)
3. **Copy** it (Ctrl+C)
4. **Paste** into Supabase SQL Editor (Ctrl+V)
5. Click **"Run"** button (or F5)
6. Wait for success message: ✓ Success. No rows returned

### 2.3 Verify Tables Created
1. Click **"Table Editor"** in left sidebar
2. You should see these tables:
   - users
   - projects
   - workflows
   - workflow_executions
   - integration_credentials
   - project_members

**If you see all 6 tables: ✅ Database ready!**

---

## ✅ Step 3: Configure Environment (1 minute)

### 3.1 Update .env File
1. Open `nexus/.env` in a text editor
2. Replace with your Supabase credentials from Step 1.2:
   ```env
   VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   ```
3. **Save** the file

---

## ✅ Step 4: Deploy to Vercel (5 minutes)

### Option A: Deploy via Vercel Website (Recommended)

#### 4.1 Create GitHub Repository
1. Go to **https://github.com/new**
2. Repository name: `nexus-platform`
3. Set to **Private** (recommended)
4. Click **"Create repository"**

#### 4.2 Push Code to GitHub
```bash
cd "C:\Users\PC\Documents\Autoclaude 2D workflow office\nexus"

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Nexus Platform v1.0"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/nexus-platform.git

# Push to GitHub
git branch -M main
git push -u origin main
```

#### 4.3 Deploy to Vercel
1. Go to **https://vercel.com/signup** (or login)
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Select your `nexus-platform` repository
5. Click **"Import"**
6. In **"Configure Project"**:
   - Framework Preset: **Vite**
   - Root Directory: **nexus** (if needed)
   - Build Command: `npm run build`
   - Output Directory: `dist`
7. Click **"Environment Variables"**
8. Add these two variables:
   - **Name:** `VITE_SUPABASE_URL`
   - **Value:** (your Supabase URL from Step 1.2)

   - **Name:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** (your Supabase anon key from Step 1.2)
9. Click **"Deploy"**
10. **WAIT** ~2 minutes for deployment

### Option B: Deploy via Vercel CLI (Alternative)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
cd "C:\Users\PC\Documents\Autoclaude 2D workflow office\nexus"
vercel --prod

# When prompted, answer:
# Set up and deploy? Y
# Which scope? (select your account)
# Link to existing project? N
# What's your project's name? nexus-platform
# In which directory is your code located? ./
# Want to override settings? N

# Add environment variables when prompted:
# VITE_SUPABASE_URL: (paste your URL)
# VITE_SUPABASE_ANON_KEY: (paste your key)
```

---

## ✅ Step 5: Configure Supabase for Production (2 minutes)

### 5.1 Add Vercel Domain to Supabase
1. Copy your Vercel URL (e.g., `https://nexus-platform.vercel.app`)
2. In Supabase, go to **Authentication** → **URL Configuration**
3. Add to **Site URL:** `https://nexus-platform.vercel.app`
4. Add to **Redirect URLs:** `https://nexus-platform.vercel.app/**`
5. Click **"Save"**

### 5.2 Configure Email Templates (Optional but Recommended)
1. Go to **Authentication** → **Email Templates**
2. Customize:
   - **Confirm signup** - Welcome email
   - **Magic Link** - Passwordless login
   - **Reset Password** - Password recovery
3. Replace `{{ .SiteURL }}` with your Vercel URL if needed

---

## ✅ Step 6: Test Your Live Application (2 minutes)

### 6.1 Open Your App
1. Go to your Vercel URL: `https://your-app.vercel.app`
2. You should see the Nexus login page

### 6.2 Create Test Account
1. Click **"Sign up"**
2. Enter:
   - Full Name: `Test User`
   - Email: `your-email@example.com`
   - Password: (choose a password)
3. Click **"Sign up"**

### 6.3 Verify Email
1. Check your email inbox
2. Click the confirmation link from Supabase
3. You'll be redirected back to login

### 6.4 Test Core Features
1. **Sign in** with your credentials
2. **Create a project** - Click "View Projects" → "New Project"
3. **Create a workflow** - Open project → "New Workflow"
4. **Execute workflow** - Open workflow → "Execute Now"
5. **Check profile** - Click "Profile" → Upload avatar

**If all 5 work: 🎉 YOUR APP IS LIVE!**

---

## ✅ Step 7: Configure Custom Domain (Optional, 5 minutes)

### If you have a domain:

#### 7.1 In Vercel
1. Go to your project → **"Settings"** → **"Domains"**
2. Click **"Add"**
3. Enter your domain: `nexus.yourdomain.com`
4. Click **"Add"**
5. Copy the DNS records shown

#### 7.2 In Your DNS Provider
1. Go to your domain registrar (e.g., Namecheap, GoDaddy)
2. Add DNS records as shown by Vercel:
   - Type: **CNAME**
   - Name: **nexus** (or @)
   - Value: **cname.vercel-dns.com**
3. **Save** DNS records
4. **Wait** 5-30 minutes for DNS propagation

#### 7.3 Update Supabase URLs
1. In Supabase → **Authentication** → **URL Configuration**
2. Update to: `https://nexus.yourdomain.com`

---

## ✅ Step 8: Enable OAuth (Optional, 10 minutes)

### Google OAuth Setup

#### 8.1 Create Google OAuth App
1. Go to **https://console.cloud.google.com**
2. Create new project: **"Nexus"**
3. Enable **Google+ API**
4. Go to **"Credentials"** → **"Create Credentials"** → **"OAuth 2.0 Client ID"**
5. Application type: **"Web application"**
6. Name: **"Nexus Production"**
7. Authorized redirect URIs:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
8. Click **"Create"**
9. **Copy** Client ID and Client Secret

#### 8.2 Configure in Supabase
1. Supabase → **Authentication** → **Providers**
2. Find **Google**
3. Toggle **"Enabled"**
4. Paste:
   - Client ID
   - Client Secret
5. Click **"Save"**

**Now users can sign in with Google!**

---

## 🎉 DEPLOYMENT COMPLETE!

Your Nexus platform is now live at:
**https://your-app.vercel.app**

### What You Can Do Now:
✅ Sign up users
✅ Create projects
✅ Build workflows
✅ Execute AI workflows
✅ Manage integrations
✅ Track costs and usage

### Next Steps:
1. **Share with users** - Send them your Vercel URL
2. **Monitor usage** - Check Supabase dashboard
3. **Add integrations** - Connect Salesforce, HubSpot, etc.
4. **Upgrade plan** - When you hit limits
5. **Custom domain** - Professional URL

---

## 🆘 Troubleshooting

### "Cannot connect to Supabase"
- Check `.env` variables are correct
- Verify Supabase project URL in environment variables
- Check Supabase project is not paused

### "Email confirmation not working"
- Check your email spam folder
- Verify email settings in Supabase
- Try "Resend confirmation" in Supabase dashboard

### "Build failed on Vercel"
- Check environment variables are set
- Verify build logs in Vercel
- Ensure all dependencies installed

### "RLS policy error"
- Check you're signed in
- Verify RLS policies in Supabase SQL Editor
- Review Supabase logs

---

## 📊 Post-Deployment Checklist

After deployment, set up:
- [ ] Vercel Analytics (free)
- [ ] Supabase monitoring alerts
- [ ] Error tracking (Sentry - optional)
- [ ] Backup strategy (Supabase Pro)
- [ ] Custom domain
- [ ] Google OAuth
- [ ] Team members (if applicable)

---

## 🎓 You Now Have:

✅ Production database (Supabase)
✅ Live application (Vercel)
✅ Authentication working
✅ All features functional
✅ Scalable infrastructure
✅ Monitoring ready

**Your app is ready for real users!**

---

## Support

**Issues?** Check:
1. [Supabase Status](https://status.supabase.com)
2. [Vercel Status](https://vercel-status.com)
3. Deployment logs in Vercel dashboard
4. Database logs in Supabase dashboard

**Questions?** Review:
- SETUP-GUIDE.md
- DEPLOYMENT.md
- PROJECT-SUMMARY.md

---

**Congratulations! You've successfully deployed Nexus! 🚀**
