-- =============================================================
-- Migration: 007_aios_strategic_layers.sql
-- Description: Provisioning Outcome Tracking tables and Briefing changes
-- =============================================================

-- 1. Alter daily_briefings table to support type-based briefings (daily, weekly, monthly)
ALTER TABLE daily_briefings ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'daily' CHECK (type IN ('daily', 'weekly', 'monthly'));
ALTER TABLE daily_briefings ADD COLUMN IF NOT EXISTS period_key TEXT;

-- Update existing rows to populate default values
UPDATE daily_briefings SET type = 'daily', period_key = date::text WHERE period_key IS NULL;

-- Make date nullable since weekly and monthly briefs represent periods
ALTER TABLE daily_briefings ALTER COLUMN date DROP NOT NULL;

-- Drop old date unique constraint if exists
ALTER TABLE daily_briefings DROP CONSTRAINT IF EXISTS daily_briefings_date_key;

-- Add new unique constraint for type + period_key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'daily_briefings_type_period_key_key'
  ) THEN
    ALTER TABLE daily_briefings ADD CONSTRAINT daily_briefings_type_period_key_key UNIQUE (type, period_key);
  END IF;
END $$;

-- 2. Create decision_outcomes table to track recommendation execution results
CREATE TABLE IF NOT EXISTS decision_outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recommendation_id UUID REFERENCES decision_recommendations(id) ON DELETE CASCADE,
  expected_result TEXT NOT NULL,
  actual_result TEXT,
  variance TEXT,
  success_score DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create campaign_outcomes table to track results of marketing campaigns
CREATE TABLE IF NOT EXISTS campaign_outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_name TEXT NOT NULL,
  expected_result TEXT NOT NULL,
  actual_result TEXT,
  variance TEXT,
  success_score DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create automation_outcomes table to track outcomes of automation rules
CREATE TABLE IF NOT EXISTS automation_outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  execution_id UUID REFERENCES automation_executions(id) ON DELETE CASCADE,
  expected_result TEXT NOT NULL,
  actual_result TEXT,
  variance TEXT,
  success_score DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed basic campaign outcomes for testing learning engines
INSERT INTO campaign_outcomes (campaign_name, expected_result, actual_result, variance, success_score)
VALUES
  ('Pune Fleet AMC Promotion', 'Convert 5 vehicles. Expected revenue: ₹1250', 'Converted 4 vehicles. Actual revenue: ₹1000', '-₹250 deficit', 80.00),
  ('Inactive Customer Re-engagement', 'Re-engage 3 customers. Expected revenue: ₹1500', 'Re-engaged 1 customer. Actual revenue: ₹500', '-₹1000 deficit', 33.33)
ON CONFLICT DO NOTHING;

-- Disable RLS for developer preview flexibility
ALTER TABLE decision_outcomes DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_outcomes DISABLE ROW LEVEL SECURITY;
ALTER TABLE automation_outcomes DISABLE ROW LEVEL SECURITY;
