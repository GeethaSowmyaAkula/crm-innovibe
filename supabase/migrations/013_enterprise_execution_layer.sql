-- =============================================================
-- Migration: 013_enterprise_execution_layer.sql
-- Description: Provisioning Enterprise Execution Layer Tables
-- =============================================================

-- 1. Create execution_commitments
CREATE TABLE IF NOT EXISTS execution_commitments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID REFERENCES strategic_initiatives(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  owner_department TEXT NOT NULL,
  owner_user TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
  priority TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  target_date DATE NOT NULL,
  completion_date DATE,
  expected_impact DECIMAL(12,2) NOT NULL,
  actual_impact DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create execution_tasks
CREATE TABLE IF NOT EXISTS execution_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commitment_id UUID REFERENCES execution_commitments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'blocked'
  progress DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  due_date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 3. Create execution_blockers
CREATE TABLE IF NOT EXISTS execution_blockers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commitment_id UUID REFERENCES execution_commitments(id) ON DELETE CASCADE,
  blocker_type TEXT NOT NULL, -- 'operational', 'financial', 'staffing', 'technology', 'vendor', 'customer'
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  description TEXT NOT NULL,
  suggested_resolution TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'resolved'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create execution_dependencies
CREATE TABLE IF NOT EXISTS execution_dependencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_task_id UUID REFERENCES execution_tasks(id) ON DELETE CASCADE,
  dependent_task_id UUID REFERENCES execution_tasks(id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL -- 'finish_to_start', 'start_to_start'
);

-- 5. Create execution_health_snapshots
CREATE TABLE IF NOT EXISTS execution_health_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  execution_score DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  completion_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  blocked_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  overdue_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create department_coordination
CREATE TABLE IF NOT EXISTS department_coordination (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID REFERENCES strategic_initiatives(id) ON DELETE CASCADE,
  participating_departments JSONB NOT NULL DEFAULT '[]'::jsonb,
  alignment_score DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  risk_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create execution_probability_scores
CREATE TABLE IF NOT EXISTS execution_probability_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commitment_id UUID REFERENCES execution_commitments(id) ON DELETE CASCADE,
  completion_probability DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  delay_probability DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  failure_probability DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  confidence_score DECIMAL(5,2) NOT NULL DEFAULT 90.00,
  status TEXT NOT NULL DEFAULT 'On Track', -- 'On Track', 'At Risk', 'Likely Delayed', 'Critical'
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create value_realization
CREATE TABLE IF NOT EXISTS value_realization (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID REFERENCES strategic_initiatives(id) ON DELETE CASCADE,
  expected_revenue DECIMAL(12,2) DEFAULT 0.00,
  actual_revenue DECIMAL(12,2) DEFAULT 0.00,
  expected_savings DECIMAL(12,2) DEFAULT 0.00,
  actual_savings DECIMAL(12,2) DEFAULT 0.00,
  expected_csat DECIMAL(4,2) DEFAULT 0.00,
  actual_csat DECIMAL(4,2) DEFAULT 0.00,
  expected_sla_compliance DECIMAL(5,2) DEFAULT 0.00,
  actual_sla_compliance DECIMAL(5,2) DEFAULT 0.00,
  realization_score DECIMAL(5,2) DEFAULT 100.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for developer preview flexibility
ALTER TABLE execution_commitments DISABLE ROW LEVEL SECURITY;
ALTER TABLE execution_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE execution_blockers DISABLE ROW LEVEL SECURITY;
ALTER TABLE execution_dependencies DISABLE ROW LEVEL SECURITY;
ALTER TABLE execution_health_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE department_coordination DISABLE ROW LEVEL SECURITY;
ALTER TABLE execution_probability_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE value_realization DISABLE ROW LEVEL SECURITY;
