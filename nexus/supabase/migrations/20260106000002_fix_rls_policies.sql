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
