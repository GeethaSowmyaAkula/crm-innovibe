-- =============================================================
-- Migration: 004_aios_phase1_5_and_2.sql
-- Description: Provisioning hardening and company cockpit scoring tables
-- =============================================================

-- 1. Company Cockpit Health Score Rules
CREATE TABLE IF NOT EXISTS health_score_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name TEXT UNIQUE NOT NULL, -- 'revenue', 'operations', 'automation', 'customer', 'growth', 'hardware'
  display_name TEXT NOT NULL,
  weight DECIMAL(5,2) NOT NULL, -- e.g., 30.00 for 30%
  target_value DECIMAL(15,2) NOT NULL,
  current_value DECIMAL(15,2) DEFAULT 0,
  formula TEXT NOT NULL DEFAULT 'current_value / target_value * 100',
  status TEXT DEFAULT 'optimal' CHECK (status IN ('optimal', 'warning', 'critical')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Failed Sync Records Log
CREATE TABLE IF NOT EXISTS failed_sync_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL, -- 'booking', 'customer', 'vehicle', 'garage'
  entity_id TEXT NOT NULL,
  raw_data JSONB NOT NULL DEFAULT '{}',
  error_message TEXT NOT NULL,
  retry_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'failed' CHECK (status IN ('failed', 'retrying', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Failed Events Log
CREATE TABLE IF NOT EXISTS failed_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  error_message TEXT NOT NULL,
  retry_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'failed' CHECK (status IN ('failed', 'retrying', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prepopulate health score rules with directive defaults
INSERT INTO health_score_rules (metric_name, display_name, weight, target_value, current_value, formula, status)
VALUES
  ('revenue', 'Revenue Health', 30.00, 50000.00, 14820.00, 'current_value / target_value * 100', 'warning'),
  ('operations', 'Operations Health', 20.00, 20.00, 18.00, 'current_value / target_value * 100', 'optimal'),
  ('automation', 'Automation Health', 15.00, 100.00, 88.00, 'current_value / target_value * 100', 'optimal'),
  ('customer', 'Customer Satisfaction', 15.00, 5.00, 4.20, 'current_value / target_value * 100', 'optimal'),
  ('growth', 'Growth Rate', 10.00, 25.00, 12.00, 'current_value / target_value * 100', 'warning'),
  ('hardware', 'Hardware Health', 10.00, 100.00, 96.40, 'current_value / target_value * 100', 'optimal')
ON CONFLICT (metric_name) DO NOTHING;

-- Disable RLS for local development flexibility
ALTER TABLE health_score_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE failed_sync_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE failed_events DISABLE ROW LEVEL SECURITY;
