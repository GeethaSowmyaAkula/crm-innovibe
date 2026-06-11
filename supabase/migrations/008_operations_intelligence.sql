-- =============================================================
-- Migration: 008_operations_intelligence.sql
-- Description: Provisioning Operations Intelligence, Playbooks, Costs, Simulation & Forecasting
-- =============================================================

-- 1. Operations Health Schema
CREATE TABLE IF NOT EXISTS operations_health_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name TEXT UNIQUE NOT NULL,
  weight DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  target_value DECIMAL(15,2) NOT NULL,
  critical_threshold DECIMAL(15,2) NOT NULL,
  warning_threshold DECIMAL(15,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS operations_health_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  overall_score DECIMAL(5,2) NOT NULL,
  metrics_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Preseed default Operations Health Rules
INSERT INTO operations_health_rules (metric_name, weight, target_value, critical_threshold, warning_threshold)
VALUES
  ('Response Time', 1.00, 15.00, 45.00, 30.00),
  ('Assignment Time', 1.20, 30.00, 90.00, 60.00),
  ('Completion Rate', 1.50, 90.00, 70.00, 80.00),
  ('Customer Satisfaction', 1.50, 4.80, 4.00, 4.40),
  ('Complaint Resolution Rate', 1.30, 95.00, 75.00, 85.00),
  ('Technician Utilization', 0.80, 75.00, 40.00, 60.00),
  ('Garage Utilization', 0.80, 80.00, 50.00, 70.00),
  ('SLA Compliance', 1.40, 95.00, 80.00, 90.00)
ON CONFLICT (metric_name) DO NOTHING;

-- 2. Technician Metrics & Insights
CREATE TABLE IF NOT EXISTS technician_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
  period_key TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  jobs_assigned INT DEFAULT 0,
  jobs_completed INT DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0.00,
  customer_rating DECIMAL(3,2) DEFAULT 0.00,
  response_time_minutes INT DEFAULT 0,
  revenue_generated DECIMAL(15,2) DEFAULT 0.00,
  utilization_rate DECIMAL(5,2) DEFAULT 0.00,
  complaints_linked INT DEFAULT 0,
  sla_performance_rate DECIMAL(5,2) DEFAULT 0.00,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS technician_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
  classification TEXT NOT NULL, -- 'Top Performer', 'High Performer', 'Average Performer', 'Needs Attention', 'At Risk'
  recommendation_type TEXT, -- 'Training Needed', 'Underutilized', 'Overloaded', 'High Complaint Risk', 'Promotion Candidate'
  context JSONB NOT NULL DEFAULT '{}',
  revenue_impact DECIMAL(15,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Garage Metrics & Insights
CREATE TABLE IF NOT EXISTS garage_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  garage_id UUID REFERENCES garages(id) ON DELETE CASCADE,
  period_key TEXT NOT NULL,
  capacity INT DEFAULT 0,
  current_workload INT DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0.00,
  revenue_generated DECIMAL(15,2) DEFAULT 0.00,
  customer_rating DECIMAL(3,2) DEFAULT 0.00,
  complaint_count INT DEFAULT 0,
  sla_compliance_rate DECIMAL(5,2) DEFAULT 0.00,
  utilization_rate DECIMAL(5,2) DEFAULT 0.00,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS garage_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  garage_id UUID REFERENCES garages(id) ON DELETE CASCADE,
  classification TEXT NOT NULL, -- 'Top Garage', 'Underutilized', 'Overloaded', 'High Revenue', 'High Risk'
  recommendation_type TEXT, -- 'Increase Capacity', 'Reduce Workload', 'Quality Improvement', 'Expansion', 'Partner Review'
  context JSONB NOT NULL DEFAULT '{}',
  revenue_impact DECIMAL(15,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Booking & Complaint Anomaly Insights
CREATE TABLE IF NOT EXISTS booking_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  anomaly_type TEXT NOT NULL, -- 'assignment_delay', 'completion_delay', 'repeat_repair', 'cancellation_pattern'
  context JSONB NOT NULL DEFAULT '{}',
  revenue_impact DECIMAL(15,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS complaint_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  category TEXT,
  alert_type TEXT NOT NULL, -- 'risk_alert', 'quality_alert', 'recurring_issue'
  details TEXT,
  technician_id UUID REFERENCES technicians(id),
  garage_id UUID REFERENCES garages(id),
  revenue_impact DECIMAL(15,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Playbooks Architecture
CREATE TABLE IF NOT EXISTS playbooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  trigger_condition TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS playbook_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playbook_id UUID REFERENCES playbooks(id) ON DELETE CASCADE,
  step_number INT NOT NULL,
  action_type TEXT NOT NULL, -- 'generate_task', 'send_notification', 'trigger_api', 'request_approval'
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS playbook_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playbook_id UUID REFERENCES playbooks(id) ON DELETE RESTRICT,
  status TEXT DEFAULT 'suggested' CHECK (status IN ('suggested', 'pending_approval', 'approved', 'running', 'completed', 'failed', 'cancelled')),
  current_step INT DEFAULT 1,
  triggered_by TEXT,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  tasks_created UUID[] DEFAULT '{}',
  expected_outcome TEXT,
  actual_outcome TEXT,
  success_score DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Preseed Generic Reusable Playbooks
INSERT INTO playbooks (id, name, description, trigger_condition)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'High Complaint Recovery Playbook', 'Standard SOP executed on support complaints spikes. Audits diagnostic processes and issues goodwill coupons.', 'complaints.rate > 0.08'),
  ('22222222-2222-2222-2222-222222222222', 'Revenue Recovery Playbook', 'Automated campaign to recover checkouts with abandoned cart/Laravel billing failures.', 'transactions.failure_rate > 0.15'),
  ('33333333-3333-3333-3333-333333333333', 'AMC Subscription Upsell Playbook', 'Automates notices to out-of-warranty users with active vehicle registration cache.', 'vehicles.uncovered_amc_count > 10'),
  ('44444444-4444-4444-4444-444444444444', 'Technician Shortage Playbook', 'Redistributes booking slots and schedules overtime/ Bangalore East garage manager alerts.', 'technicians.utilization > 0.90'),
  ('55555555-5555-5555-5555-555555555555', 'Garage Overload Playbook', 'Reroutes pending inspection bookings to nearby Bangalore partner service centers.', 'garages.utilization > 0.85'),
  ('66666666-6666-6666-6666-666666666666', 'Service Quality Recovery Playbook', 'Triggers technical staff retraining and Diagnostic SOP verification guidelines.', 'history.repeat_repair_rate > 0.10')
ON CONFLICT (name) DO NOTHING;

-- Preseed Steps for Garage Overload Playbook (pb5)
INSERT INTO playbook_steps (playbook_id, step_number, action_type, config)
VALUES
  ('55555555-5555-5555-5555-555555555555', 1, 'trigger_api', '{"endpoint": "/api/relationship", "description": "Identify alternate available resource hubs"}'::jsonb),
  ('55555555-5555-5555-5555-555555555555', 2, 'trigger_api', '{"endpoint": "/api/operations/health", "description": "Evaluate capacity metrics at alternate hubs"}'::jsonb),
  ('55555555-5555-5555-5555-555555555555', 3, 'generate_recommendation', '{"description": "Recommend booking rerouting to Bangalore Partner Garages"}'::jsonb),
  ('55555555-5555-5555-5555-555555555555', 4, 'request_approval', '{"role": "CEO", "description": "Create approval task for rerouting bookings"}'::jsonb),
  ('55555555-5555-5555-5555-555555555555', 5, 'generate_task', '{"role": "Operations", "description": "Execute approved booking reallocations"}'::jsonb),
  ('55555555-5555-5555-5555-555555555555', 6, 'trigger_api', '{"endpoint": "/api/outcomes", "description": "Measure and log success score outcomes"}'::jsonb)
ON CONFLICT DO NOTHING;

-- 6. Bottleneck Intelligence Schema
CREATE TABLE IF NOT EXISTS bottleneck_intelligence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL, -- 'technician', 'garage', 'booking', 'complaint', 'approval', 'assignment'
  severity TEXT NOT NULL, -- 'critical', 'warning', 'info'
  context JSONB NOT NULL DEFAULT '{}',
  affected_entities TEXT[] DEFAULT '{}',
  confidence_score DECIMAL(5,2) DEFAULT 0.00,
  revenue_impact DECIMAL(15,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bottleneck_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bottlenecks_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed an initial active bottleneck
INSERT INTO bottleneck_intelligence (type, severity, context, affected_entities, confidence_score, revenue_impact)
VALUES (
  'garage', 
  'critical', 
  '{"rootCause": "Technician shortage at Bangalore East Garage", "impact": "Booking completion delays causing SLA breach", "suggestedAction": "Approve Garage Overload Playbook to redirect Bangalore East capacity"}'::jsonb,
  ARRAY['Bangalore East Garage', 'Booking #101', 'Booking #102'],
  92.00,
  1200.00
) ON CONFLICT DO NOTHING;

-- 7. Operational Cost Intelligence
CREATE TABLE IF NOT EXISTS operational_cost_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_key TEXT UNIQUE NOT NULL, -- 'daily', 'weekly', 'monthly'
  cost_per_booking DECIMAL(15,2) DEFAULT 0.00,
  cost_per_technician DECIMAL(15,2) DEFAULT 0.00,
  cost_per_garage DECIMAL(15,2) DEFAULT 0.00,
  complaint_cost DECIMAL(15,2) DEFAULT 0.00,
  rework_cost DECIMAL(15,2) DEFAULT 0.00,
  cancellation_cost DECIMAL(15,2) DEFAULT 0.00,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cost_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  expected_savings DECIMAL(15,2) DEFAULT 0.00,
  expected_roi DECIMAL(5,2) DEFAULT 0.00,
  implementation_effort TEXT, -- 'low', 'medium', 'high'
  root_cause TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed initial cost metrics
INSERT INTO operational_cost_metrics (period_key, cost_per_booking, cost_per_technician, cost_per_garage, complaint_cost, rework_cost, cancellation_cost)
VALUES ('monthly', 450.00, 18000.00, 35000.00, 1500.00, 800.00, 600.00)
ON CONFLICT (period_key) DO NOTHING;

-- 8. Capacity Forecasting Schema
CREATE TABLE IF NOT EXISTS capacity_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  forecast_period TEXT NOT NULL, -- '7_days', '30_days', '90_days'
  predicted_bookings DECIMAL(10,2) DEFAULT 0.00,
  predicted_complaints DECIMAL(10,2) DEFAULT 0.00,
  tech_utilization_forecast DECIMAL(5,2) DEFAULT 0.00,
  garage_utilization_forecast DECIMAL(5,2) DEFAULT 0.00,
  revenue_impact DECIMAL(15,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS capacity_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_name TEXT UNIQUE NOT NULL,
  coefficients JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Operations Simulator (Digital Twin Lite)
CREATE TABLE IF NOT EXISTS operations_simulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scenario_name TEXT NOT NULL,
  inputs JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS simulation_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  simulation_id UUID REFERENCES operations_simulations(id) ON DELETE CASCADE,
  metrics JSONB NOT NULL DEFAULT '{}',
  revenue_impact DECIMAL(15,2) DEFAULT 0.00,
  csat_impact DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Operational Pattern Intelligence
CREATE TABLE IF NOT EXISTS operational_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_type TEXT NOT NULL, -- 'complaint', 'demand_seasonal', 'technician_performance', 'garage_utilization', 'booking_demand'
  description TEXT NOT NULL,
  confidence_score DECIMAL(5,2) DEFAULT 0.00,
  revenue_impact DECIMAL(15,2) DEFAULT 0.00,
  context JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Preseed default operational patterns for CEO review
INSERT INTO operational_patterns (pattern_type, description, confidence_score, revenue_impact, context)
VALUES
  ('complaint', 'Spike in diagnostic complaints linked to battery cell balancing delays in Pune East hub.', 88.50, 4500.00, '{"rootCause": "Pune Hub technicians lack specialized cell diagnostic tools.", "impact": "Booking repeat repairs and lower regional rating.", "suggestedAction": "Purchase diagnostic toolkits and authorize pb6 Playbook execution."}'::jsonb),
  ('demand_seasonal', 'Monsoon season inspections trigger a 22% spike in electrical booking checkups in Mumbai/Pune.', 95.00, 8500.00, '{"rootCause": "Heavy rainfall causes motor short-circuits and telemetry controller humidity spikes.", "impact": "Backlog queues peak by mid-July.", "suggestedAction": "Pre-arrange slot capacities at partner garages in Pune/Mumbai."}'::jsonb)
ON CONFLICT DO NOTHING;

-- Disable RLS for developer preview flexibility
ALTER TABLE operations_health_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE operations_health_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE technician_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE technician_insights DISABLE ROW LEVEL SECURITY;
ALTER TABLE garage_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE garage_insights DISABLE ROW LEVEL SECURITY;
ALTER TABLE booking_insights DISABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_insights DISABLE ROW LEVEL SECURITY;
ALTER TABLE playbooks DISABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_steps DISABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_executions DISABLE ROW LEVEL SECURITY;
ALTER TABLE bottleneck_intelligence DISABLE ROW LEVEL SECURITY;
ALTER TABLE bottleneck_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE operational_cost_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE cost_insights DISABLE ROW LEVEL SECURITY;
ALTER TABLE capacity_forecasts DISABLE ROW LEVEL SECURITY;
ALTER TABLE capacity_models DISABLE ROW LEVEL SECURITY;
ALTER TABLE operations_simulations DISABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE operational_patterns DISABLE ROW LEVEL SECURITY;
