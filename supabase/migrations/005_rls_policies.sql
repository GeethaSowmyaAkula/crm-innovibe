-- =============================================================
-- Migration: 005_rls_policies.sql
-- Description: Provisioning Row Level Security (RLS) policies for role-based access control.
-- =============================================================

-- Helper function to fetch the current authenticated user's corporate role
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.user_roles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 1. Enable RLS on User Roles table
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read user_roles" 
ON user_roles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow CEOs and Admins full access to user_roles" 
ON user_roles FOR ALL 
TO authenticated 
USING (public.get_auth_user_role() IN ('CEO', 'Admin'))
WITH CHECK (public.get_auth_user_role() IN ('CEO', 'Admin'));

-- 2. Enable RLS on Settings Store
ALTER TABLE settings_store ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read settings" 
ON settings_store FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow CEOs and Admins to modify settings" 
ON settings_store FOR ALL 
TO authenticated 
USING (public.get_auth_user_role() IN ('CEO', 'Admin'))
WITH CHECK (public.get_auth_user_role() IN ('CEO', 'Admin'));

-- 3. Enable RLS on Health Score Rules
ALTER TABLE health_score_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read health scores" 
ON health_score_rules FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow CEOs and Admins to modify health scores" 
ON health_score_rules FOR ALL 
TO authenticated 
USING (public.get_auth_user_role() IN ('CEO', 'Admin'))
WITH CHECK (public.get_auth_user_role() IN ('CEO', 'Admin'));

-- 4. Enable RLS on Failed Sync Records
ALTER TABLE failed_sync_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow operations and executives to view failed syncs" 
ON failed_sync_records FOR SELECT 
TO authenticated 
USING (public.get_auth_user_role() IN ('CEO', 'Admin', 'Operations'));

CREATE POLICY "Allow operations and executives to write/retry failed syncs" 
ON failed_sync_records FOR ALL 
TO authenticated 
USING (public.get_auth_user_role() IN ('CEO', 'Admin', 'Operations'))
WITH CHECK (public.get_auth_user_role() IN ('CEO', 'Admin', 'Operations'));

-- 5. Enable RLS on Failed Events
ALTER TABLE failed_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow operations and executives to view failed events" 
ON failed_events FOR SELECT 
TO authenticated 
USING (public.get_auth_user_role() IN ('CEO', 'Admin', 'Operations'));

CREATE POLICY "Allow operations and executives to write/retry failed events" 
ON failed_events FOR ALL 
TO authenticated 
USING (public.get_auth_user_role() IN ('CEO', 'Admin', 'Operations'))
WITH CHECK (public.get_auth_user_role() IN ('CEO', 'Admin', 'Operations'));

-- 6. Enable RLS on Tasks & Workflows
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read assigned or executive tasks" 
ON tasks FOR SELECT 
TO authenticated 
USING (
  public.get_auth_user_role() IN ('CEO', 'Admin') OR
  EXISTS (
    SELECT 1 FROM task_assignments 
    WHERE task_assignments.task_id = tasks.id 
    AND task_assignments.user_id = auth.uid()
  )
);

CREATE POLICY "Allow CEOs and Admins full access to tasks" 
ON tasks FOR ALL 
TO authenticated 
USING (public.get_auth_user_role() IN ('CEO', 'Admin'))
WITH CHECK (public.get_auth_user_role() IN ('CEO', 'Admin'));
