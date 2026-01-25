# Nexus - Quick Start (5 Minutes)

## 🚀 Get Running in 5 Minutes

### Step 1: Install Dependencies (1 min)
```bash
cd nexus
npm install
```

### Step 2: Set Up Supabase (2 min)
1. Go to [https://supabase.com](https://supabase.com) → New Project
2. Copy your **Project URL** and **Anon Key** from Settings > API
3. Open SQL Editor and paste content from `supabase/migrations/20260106000001_initial_setup.sql`
4. Click **Run** to create tables

### Step 3: Configure Environment (30 sec)
```bash
# Copy template
cp .env.example .env

# Edit .env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

### Step 4: Start Development (30 sec)
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Step 5: Create Account (1 min)
1. Click "Sign up"
2. Enter email/password
3. Verify email (check inbox)
4. Sign in
5. Start creating projects!

---

## 🎉 You're Done!

Now you can:
- ✅ Create projects
- ✅ Build workflows
- ✅ Manage integrations
- ✅ Execute AI workflows
- ✅ Monitor executions

---

## 📝 Next Steps

### For Development
```bash
npm run build    # Test production build
npm run preview  # Preview production
```

### For Production
See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment guide.

### Quick Deploy
```bash
npm i -g vercel
vercel --prod
```

---

## 🆘 Need Help?

- **Setup Issues?** → Read [SETUP-GUIDE.md](./SETUP-GUIDE.md)
- **Deployment?** → Read [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Features?** → Read [PROJECT-SUMMARY.md](./PROJECT-SUMMARY.md)

---

## 🔗 Important Links

- **Supabase Dashboard:** [https://app.supabase.com](https://app.supabase.com)
- **Vercel Dashboard:** [https://vercel.com/dashboard](https://vercel.com/dashboard)
- **GitHub Repo:** (your-repo-url)

---

**Happy Building! 🚀**
