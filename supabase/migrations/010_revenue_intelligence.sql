-- =============================================================
-- Migration: 010_revenue_intelligence.sql
-- Description: Provisioning Revenue Intelligence Analytics & War Room Layers
-- =============================================================

-- 1. Create customer_revenue_profiles (incorporating Customer Value Matrix)
CREATE TABLE IF NOT EXISTS customer_revenue_profiles (
  customer_id UUID PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
  total_spent DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  booking_count INTEGER NOT NULL DEFAULT 0,
  clv DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  churn_risk_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  segment TEXT NOT NULL DEFAULT 'New Prospects',
  amc_conversion_probability DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  -- Customer Value Matrix Attributes
  revenue_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  growth_potential DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- 0-100
  referral_potential DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- 0-100
  retention_probability DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- 0-100
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create revenue_leakage_detections
CREATE TABLE IF NOT EXISTS revenue_leakage_detections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leakage_type TEXT NOT NULL, -- 'unbilled_service', 'payment_failure', 'cancelled_no_fee', 'underpriced_service'
  amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  root_cause TEXT NOT NULL,
  affected_entity TEXT NOT NULL,
  suggested_action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'detected', -- 'detected', 'actioned', 'resolved', 'ignored'
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create revenue_forecast_snapshots
CREATE TABLE IF NOT EXISTS revenue_forecast_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  forecast_month DATE NOT NULL UNIQUE,
  predicted_total_revenue DECIMAL(12,2) NOT NULL,
  predicted_amc_revenue DECIMAL(12,2) NOT NULL,
  predicted_booking_revenue DECIMAL(12,2) NOT NULL,
  confidence_score DECIMAL(5,2) NOT NULL,
  growth_rate_pct DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create revenue_attribution_metrics (growth/decline drivers)
CREATE TABLE IF NOT EXISTS revenue_attribution_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_name TEXT NOT NULL,
  impact_amount DECIMAL(12,2) NOT NULL,
  factor_type TEXT NOT NULL CHECK (factor_type IN ('growth', 'decline')),
  category TEXT NOT NULL, -- e.g. 'AMC Sales', 'Abandoned Bookings', 'Payment Failures', 'SLA Delay Churn'
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create revenue_flywheel_snapshots
CREATE TABLE IF NOT EXISTS revenue_flywheel_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  measured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  customer_acquisition_rate DECIMAL(5,2) NOT NULL,
  booking_frequency DECIMAL(5,2) NOT NULL,
  payment_success_rate DECIMAL(5,2) NOT NULL,
  amc_penetration_rate DECIMAL(5,2) NOT NULL,
  retention_rate DECIMAL(5,2) NOT NULL,
  referral_rate DECIMAL(5,2) NOT NULL,
  weak_link TEXT NOT NULL,
  opportunity_description TEXT NOT NULL
);

-- Disable RLS for developer preview flexibility
ALTER TABLE customer_revenue_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_leakage_detections DISABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_forecast_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_attribution_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_flywheel_snapshots DISABLE ROW LEVEL SECURITY;
