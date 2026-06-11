-- =============================================================
-- Migration: 009_intelligence_confidence_and_audit.sql
-- Description: Provisioning Confidence Registry and Strategic Decision Audit Trail
-- =============================================================

-- 1. Create intelligence_confidence_registry
CREATE TABLE IF NOT EXISTS intelligence_confidence_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engine_name TEXT UNIQUE NOT NULL,
  confidence_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Preseed default confidence metrics for core engines
INSERT INTO intelligence_confidence_registry (engine_name, confidence_score)
VALUES
  ('Capacity Forecast', 88.00),
  ('Revenue Impact', 92.50),
  ('Pattern Detection', 85.00),
  ('Bottleneck Detection', 94.00)
ON CONFLICT (engine_name) DO UPDATE SET confidence_score = EXCLUDED.confidence_score;

-- 2. Create decision_audit_trail
CREATE TABLE IF NOT EXISTS decision_audit_trail (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recommendation_id UUID REFERENCES decision_recommendations(id) ON DELETE SET NULL,
  recommendation_title TEXT NOT NULL,
  decision_maker TEXT NOT NULL DEFAULT 'CEO',
  approval_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT,
  expected_outcome TEXT,
  actual_outcome TEXT,
  success_score DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for developer preview flexibility
ALTER TABLE intelligence_confidence_registry DISABLE ROW LEVEL SECURITY;
ALTER TABLE decision_audit_trail DISABLE ROW LEVEL SECURITY;
