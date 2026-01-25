# Fix "Infinite Recursion" Database Error

## Problem
When clicking "Create New Project" you see:
```
infinite recursion detected in policy for relation "projects"
```

## Solution

Run this SQL migration in your Supabase SQL Editor:

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com
2. Open your project
3. Click **SQL Editor** in the left sidebar
4. Click **New query**

### Step 2: Run This SQL

Copy and paste this entire code block:

```sql
-- Fix infinite recursion in RLS policies
-- This migration fixes the circular reference issue in project policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Project owners can update projects" ON public.projects;
DROP POLICY IF EXISTS "Project owners can delete projects" ON public.projects;

-- Recreate policies without circular references
-- Use auth.uid() directly instead of checking project_members

CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can create projects" ON public.projects
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Project owners can update projects" ON public.projects
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Project owners can delete projects" ON public.projects
  FOR DELETE USING (owner_id = auth.uid());

-- Note: Team member access will be handled separately when that feature is implemented
-- For now, only owners can access their projects
```

### Step 3: Execute
1. Click **Run** (or press F5)
2. Wait for "Success" message
3. Close SQL Editor

### Step 4: Test
1. Go back to your Nexus app
2. Click **"New Project"**
3. Fill in the form
4. Click **"Create Project"**
5. ✅ Should work now!

---

## What This Fixed

The original RLS policies had a circular reference:
- Projects policy checked `project_members` table
- But to check `project_members`, it needed to query projects first
- This created infinite recursion

The fix:
- Simplified policies to use `auth.uid()` directly
- No circular dependencies
- Projects work instantly

---

## Need Help?

If you still see errors:
1. Make sure you're signed in
2. Check browser console (F12) for errors
3. Verify SQL ran successfully in Supabase
4. Try signing out and back in

The database policies are now fixed!
