-- =============================================================
-- Migration: 011_ai_ceo_layer.sql
-- Description: Provisioning AI CEO Layer (Memory, Reasoning, Planner, Simulator, Reports, Graph, Reflection, Alignment)
-- =============================================================

-- 1. Create ceo_memory
CREATE TABLE IF NOT EXISTS ceo_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  memory_type TEXT NOT NULL, -- 'decision_note', 'board_resolution', 'playbook_outcome', 'lesson_learned'
  title TEXT NOT NULL,
  decision_text TEXT,
  reasoning TEXT,
  expected_outcome TEXT,
  actual_outcome TEXT,
  success_score DECIMAL(5,2),
  lessons_learned TEXT,
  related_kpis JSONB DEFAULT '[]'::jsonb,
  related_departments JSONB DEFAULT '[]'::jsonb,
  related_decisions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create ceo_memory_embeddings
CREATE TABLE IF NOT EXISTS ceo_memory_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  memory_id UUID REFERENCES ceo_memory(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create ceo_memory_links
CREATE TABLE IF NOT EXISTS ceo_memory_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_memory_id UUID REFERENCES ceo_memory(id) ON DELETE CASCADE,
  target_memory_id UUID REFERENCES ceo_memory(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL, -- 'caused_by', 'superseded_by', 'related_to'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create ceo_lessons
CREATE TABLE IF NOT EXISTS ceo_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  memory_id UUID REFERENCES ceo_memory(id) ON DELETE CASCADE,
  failure_signature TEXT NOT NULL, -- e.g. 'technician_delay_overload', 'failed_payment_unbilled'
  lesson TEXT NOT NULL,
  preventative_action TEXT NOT NULL,
  frequency_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create ceo_reasoning_sessions
CREATE TABLE IF NOT EXISTS ceo_reasoning_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic TEXT NOT NULL,
  trigger_event TEXT,
  session_status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create ceo_reasoning_outputs
CREATE TABLE IF NOT EXISTS ceo_reasoning_outputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES ceo_reasoning_sessions(id) ON DELETE CASCADE,
  executive_brief TEXT NOT NULL,
  strategic_analysis TEXT NOT NULL,
  recommended_actions JSONB DEFAULT '[]'::jsonb,
  risk_analysis TEXT NOT NULL,
  growth_opportunities JSONB DEFAULT '[]'::jsonb,
  confidence_score DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create ceo_questions
CREATE TABLE IF NOT EXISTS ceo_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create ceo_answers
CREATE TABLE IF NOT EXISTS ceo_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES ceo_questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  cited_sources JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Create ceo_decision_scores
CREATE TABLE IF NOT EXISTS ceo_decision_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  decision_id UUID REFERENCES decision_recommendations(id) ON DELETE CASCADE,
  option_name TEXT NOT NULL,
  revenue_impact DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  risk_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  confidence_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  implementation_difficulty TEXT NOT NULL, -- 'easy', 'medium', 'hard'
  expected_timeline TEXT NOT NULL,
  priority_rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Create strategic_initiatives
CREATE TABLE IF NOT EXISTS strategic_initiatives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- 'revenue', 'amc', 'customer_growth', 'fleet_expansion', 'operations'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'paused', 'completed'
  progress DECIMAL(5,2) DEFAULT 0.00,
  expected_impact TEXT,
  actual_impact TEXT,
  budget DECIMAL(12,2) DEFAULT 0.00,
  owner TEXT DEFAULT 'CEO',
  success_probability DECIMAL(5,2) DEFAULT 90.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Create initiative_tracking
CREATE TABLE IF NOT EXISTS initiative_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID REFERENCES strategic_initiatives(id) ON DELETE CASCADE,
  update_notes TEXT NOT NULL,
  progress_change DECIMAL(5,2) NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Create initiative_forecasts
CREATE TABLE IF NOT EXISTS initiative_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID REFERENCES strategic_initiatives(id) ON DELETE CASCADE,
  forecast_period TEXT NOT NULL, -- '30_days', '90_days', '1_year'
  projected_impact_amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Create board_reports
CREATE TABLE IF NOT EXISTS board_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_type TEXT NOT NULL, -- 'weekly', 'monthly', 'quarterly'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  revenue_summary TEXT,
  operations_summary TEXT,
  growth_summary TEXT,
  risks_summary TEXT,
  major_decisions JSONB DEFAULT '[]'::jsonb,
  lessons_learned JSONB DEFAULT '[]'::jsonb,
  strategic_recommendations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Create board_report_snapshots
CREATE TABLE IF NOT EXISTS board_report_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES board_reports(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Create ceo_simulations
CREATE TABLE IF NOT EXISTS ceo_simulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  simulation_query TEXT NOT NULL,
  variables_modeled JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. Create ceo_simulation_results
CREATE TABLE IF NOT EXISTS ceo_simulation_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  simulation_id UUID REFERENCES ceo_simulations(id) ON DELETE CASCADE,
  revenue_impact DECIMAL(12,2) NOT NULL,
  operational_impact TEXT NOT NULL,
  growth_impact TEXT NOT NULL,
  risk_impact TEXT NOT NULL,
  confidence_score DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. Create ceo_knowledge_graph_nodes
CREATE TABLE IF NOT EXISTS ceo_knowledge_graph_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL, -- 'customer', 'booking', 'revenue', 'decision', 'initiative', 'outcome'
  entity_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 18. Create ceo_knowledge_graph_edges
CREATE TABLE IF NOT EXISTS ceo_knowledge_graph_edges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_node_id UUID REFERENCES ceo_knowledge_graph_nodes(id) ON DELETE CASCADE,
  target_node_id UUID REFERENCES ceo_knowledge_graph_nodes(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL, -- 'ordered', 'paid_for', 'resolved_by', 'targeted_at', 'contributed_to'
  properties JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 19. Create ceo_reflections
CREATE TABLE IF NOT EXISTS ceo_reflections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reflection_type TEXT NOT NULL, -- 'weekly', 'monthly'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  prediction_accuracy DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  key_learnings TEXT NOT NULL,
  strategic_pivots TEXT,
  success_metrics JSONB DEFAULT '{}'::jsonb,
  failure_signatures JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 20. Create ceo_reflection_sessions
CREATE TABLE IF NOT EXISTS ceo_reflection_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_notes TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 21. Create strategic_alignment_scores
CREATE TABLE IF NOT EXISTS strategic_alignment_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID REFERENCES strategic_initiatives(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  alignment_score DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- 0 to 100
  impact_reasoning TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for developer preview flexibility
ALTER TABLE ceo_memory DISABLE ROW LEVEL SECURITY;
ALTER TABLE ceo_memory_embeddings DISABLE ROW LEVEL SECURITY;
ALTER TABLE ceo_memory_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE ceo_lessons DISABLE ROW LEVEL SECURITY;
ALTER TABLE ceo_reasoning_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE ceo_reasoning_outputs DISABLE ROW LEVEL SECURITY;
ALTER TABLE ceo_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE ceo_answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE ceo_decision_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_initiatives DISABLE ROW LEVEL SECURITY;
ALTER TABLE initiative_tracking DISABLE ROW LEVEL SECURITY;
ALTER TABLE initiative_forecasts DISABLE ROW LEVEL SECURITY;
ALTER TABLE board_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE board_report_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE ceo_simulations DISABLE ROW LEVEL SECURITY;
ALTER TABLE ceo_simulation_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE ceo_knowledge_graph_nodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE ceo_knowledge_graph_edges DISABLE ROW LEVEL SECURITY;
ALTER TABLE ceo_reflections DISABLE ROW LEVEL SECURITY;
ALTER TABLE ceo_reflection_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_alignment_scores DISABLE ROW LEVEL SECURITY;
