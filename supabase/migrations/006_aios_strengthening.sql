-- =============================================================
-- Migration: 006_aios_strengthening.sql
-- Description: Provisioning advanced CEO OS features
-- =============================================================

-- 1. Alter strategy_opportunities to add advanced scoring columns
ALTER TABLE strategy_opportunities ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(5,2);
ALTER TABLE strategy_opportunities ADD COLUMN IF NOT EXISTS expected_revenue DECIMAL(15,2);
ALTER TABLE strategy_opportunities ADD COLUMN IF NOT EXISTS priority_score DECIMAL(5,2);

-- 2. KPI Registry (no current_value column as requested)
CREATE TABLE IF NOT EXISTS kpi_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  formula TEXT NOT NULL,
  target DECIMAL(15,2) NOT NULL,
  owner_department TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Preseed default KPIs definitions
INSERT INTO kpi_registry (name, formula, target, owner_department)
VALUES
  ('Monthly Revenue', 'SUM(amount) from transactions WHERE status = success', 50000.00, 'Finance'),
  ('Active Bookings', 'COUNT(id) from bookings WHERE status IN (pending, assigned, in_progress)', 100.00, 'Operations'),
  ('Customer Satisfaction', 'AVG(feedback_rating) from feedback_queue', 4.80, 'Operations'),
  ('System Sync Success Rate', '100 - (COUNT(failed_sync) / TOTAL_SYNCS * 100)', 99.00, 'Management'),
  ('AMC Subscription Rate', 'COUNT(amc) / TOTAL_VEHICLES * 100', 60.00, 'Revenue')
ON CONFLICT (name) DO NOTHING;

-- 3. Daily Briefings Cache
CREATE TABLE IF NOT EXISTS daily_briefings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  summary TEXT NOT NULL,
  revenue_summary TEXT,
  booking_summary TEXT,
  complaint_summary TEXT,
  goal_summary TEXT,
  alerts_summary TEXT,
  opps_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Reporting Engine Templates & Snapshots
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'investor'
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed basic reporting templates
INSERT INTO report_templates (name, description, category, config)
VALUES
  ('Daily Operations Brief', 'Daily summary of bookings, telemetry anomalies, and capacity utilization.', 'daily', '{"metrics": ["bookings", "telemetry_alerts"]}'::jsonb),
  ('Weekly Financial Snapshot', 'Weekly billing aggregates, AMC acquisitions, and refund rates.', 'weekly', '{"metrics": ["revenue", "amc_sales", "refunds"]}'::jsonb),
  ('Monthly Shareholder Update', 'Full monthly P&L, customer satisfaction indices, and fleet expansions.', 'monthly', '{"metrics": ["revenue", "csat", "fleet_growth", "growth_rate"]}'::jsonb),
  ('Quarterly Investor Pitch deck', 'LPs aggregate cohort performance, LTV, CAC, and operational expansion charts.', 'investor', '{"metrics": ["revenue", "cohort_analysis", "funding_milestones"]}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 5. Executive Memory System
CREATE TABLE IF NOT EXISTS executive_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS board_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  meeting_date DATE NOT NULL DEFAULT CURRENT_DATE,
  resolutions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS strategic_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  rationale TEXT,
  expected_impact TEXT,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'implemented', 'deferred')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed initial executive memory records
INSERT INTO strategic_decisions (title, description, rationale, expected_impact, status)
VALUES
  ('AMC Pricing Realignment', 'Increase Q3 AMC plan pricing by 12% for commercial fleet clients.', 'Current margin on mobile technician travel is too low. High demand allows pricing leverage.', 'Boost AMC contribution margin by 4.5%.', 'active'),
  ('Deploy Out-of-Warranty Auto Reminder', 'Automate WhatsApp notices to customers 30 days before factory warranty expires.', 'LTV expansion. Capture service revenue before they switch to local garages.', 'Increase service retention rate by 8%.', 'planned')
ON CONFLICT DO NOTHING;

-- Disable RLS for developer preview flexibility
ALTER TABLE kpi_registry DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_briefings DISABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE report_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE executive_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE board_decisions DISABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_decisions DISABLE ROW LEVEL SECURITY;
