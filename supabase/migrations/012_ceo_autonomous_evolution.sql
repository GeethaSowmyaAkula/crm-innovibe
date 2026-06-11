-- =============================================================
-- Migration: 012_ceo_autonomous_evolution.sql
-- Description: Provisioning Phase 5.5 Autonomous CEO Evolution Layer Tables
-- =============================================================

-- 1. Create goal_probability_scores
CREATE TABLE IF NOT EXISTS goal_probability_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  probability_of_success DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  probability_of_failure DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  confidence_score DECIMAL(5,2) NOT NULL DEFAULT 90.00,
  velocity DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  remaining_days INTEGER NOT NULL DEFAULT 90,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create goal_risk_alerts
CREATE TABLE IF NOT EXISTS goal_risk_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  risk_level TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  root_cause TEXT NOT NULL,
  expected_deficit DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create goal_recovery_plans
CREATE TABLE IF NOT EXISTS goal_recovery_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  recovery_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  expected_improvement_pct DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create executive_escalations
CREATE TABLE IF NOT EXISTS executive_escalations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue TEXT NOT NULL,
  impact_desc TEXT NOT NULL,
  urgency TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'resolved'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create escalation_actions
CREATE TABLE IF NOT EXISTS escalation_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escalation_id UUID REFERENCES executive_escalations(id) ON DELETE CASCADE,
  action_text TEXT NOT NULL,
  expected_recovery TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'executed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create budget_allocations
CREATE TABLE IF NOT EXISTS budget_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL, -- 'technicians', 'garages', 'marketing', 'amc_campaigns', 'recovery_campaigns'
  allocated_amount DECIMAL(12,2) NOT NULL,
  utilized_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  allocated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create investment_recommendations
CREATE TABLE IF NOT EXISTS investment_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL, -- 'technicians', 'garages', 'marketing', 'amc_campaigns', 'recovery_campaigns'
  description TEXT NOT NULL,
  expected_revenue DECIMAL(12,2) NOT NULL,
  cost DECIMAL(12,2) NOT NULL,
  risk_score DECIMAL(5,2) NOT NULL,
  payback_period_months DECIMAL(5,2) NOT NULL,
  roi_pct DECIMAL(5,2) NOT NULL,
  priority_rank INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create learning_patterns
CREATE TABLE IF NOT EXISTS learning_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_type TEXT NOT NULL, -- 'best_practice', 'failure_pattern', 'strategic_lesson'
  description TEXT NOT NULL,
  impact_score DECIMAL(5,2) NOT NULL,
  suggestion TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Create learning_models
CREATE TABLE IF NOT EXISTS learning_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_name TEXT NOT NULL UNIQUE,
  rules_applied JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Create recommendation_accuracy
CREATE TABLE IF NOT EXISTS recommendation_accuracy (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recommendation_id UUID REFERENCES decision_recommendations(id) ON DELETE CASCADE,
  predicted_outcome TEXT NOT NULL,
  actual_outcome TEXT,
  variance DECIMAL(5,2),
  accuracy_score DECIMAL(5,2),
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Create forecast_accuracy
CREATE TABLE IF NOT EXISTS forecast_accuracy (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  forecast_month DATE NOT NULL UNIQUE,
  predicted_revenue DECIMAL(12,2) NOT NULL,
  actual_revenue DECIMAL(12,2),
  variance_pct DECIMAL(5,2),
  accuracy_score DECIMAL(5,2),
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Create simulation_accuracy
CREATE TABLE IF NOT EXISTS simulation_accuracy (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  simulation_id UUID REFERENCES ceo_simulations(id) ON DELETE CASCADE,
  predicted_impact DECIMAL(12,2) NOT NULL,
  actual_impact DECIMAL(12,2),
  variance_pct DECIMAL(5,2),
  accuracy_score DECIMAL(5,2),
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Create self_improvement_logs
CREATE TABLE IF NOT EXISTS self_improvement_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL, -- 'confidence_weight', 'forecasting_model', 'playbook_threshold', 'escalation_limit'
  previous_setting TEXT NOT NULL,
  new_setting TEXT NOT NULL,
  rationale TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for developer preview flexibility
ALTER TABLE goal_probability_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE goal_risk_alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE goal_recovery_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE executive_escalations DISABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_actions DISABLE ROW LEVEL SECURITY;
ALTER TABLE budget_allocations DISABLE ROW LEVEL SECURITY;
ALTER TABLE investment_recommendations DISABLE ROW LEVEL SECURITY;
ALTER TABLE learning_patterns DISABLE ROW LEVEL SECURITY;
ALTER TABLE learning_models DISABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_accuracy DISABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_accuracy DISABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_accuracy DISABLE ROW LEVEL SECURITY;
ALTER TABLE self_improvement_logs DISABLE ROW LEVEL SECURITY;

-- 14. Create ceo_autonomy_policies
CREATE TABLE IF NOT EXISTS ceo_autonomy_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_type TEXT UNIQUE NOT NULL,
  autonomy_level INTEGER NOT NULL DEFAULT 1, -- 0=Observe, 1=Recommend, 2=Create Tasks, 3=Execute Playbooks, 4=Execute Low-Risk, 5=Fully Autonomous
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Create ceo_constitution
CREATE TABLE IF NOT EXISTS ceo_constitution (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  principle_name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  constraint_type TEXT NOT NULL, -- 'max_budget', 'min_margin', 'min_csat', 'prevent_leakage'
  constraint_value DECIMAL(12,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. Create decision_replay_sessions
CREATE TABLE IF NOT EXISTS decision_replay_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  decision_id UUID REFERENCES decision_recommendations(id) ON DELETE SET NULL,
  alternative_chosen TEXT NOT NULL,
  actual_revenue_impact DECIMAL(12,2),
  actual_operational_impact TEXT,
  hypothetical_revenue_impact DECIMAL(12,2),
  hypothetical_operational_impact TEXT,
  variance DECIMAL(12,2),
  insights TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE ceo_autonomy_policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE ceo_constitution DISABLE ROW LEVEL SECURITY;
ALTER TABLE decision_replay_sessions DISABLE ROW LEVEL SECURITY;

