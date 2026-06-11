-- =============================================================
-- Migration: 014_executive_systems.sql
-- Description: Provisioning Strategic Initiative Portfolio Tables
-- =============================================================

-- 1. Create initiative_portfolios
CREATE TABLE IF NOT EXISTS initiative_portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  target_budget DECIMAL(12,2) DEFAULT 0.00,
  allocated_budget DECIMAL(12,2) DEFAULT 0.00,
  risk_profile TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create portfolio_allocations
CREATE TABLE IF NOT EXISTS portfolio_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID REFERENCES initiative_portfolios(id) ON DELETE CASCADE,
  initiative_id UUID REFERENCES strategic_initiatives(id) ON DELETE CASCADE,
  allocated_budget DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'paused', 'completed', 'terminated'
  acceleration_status TEXT NOT NULL DEFAULT 'none', -- 'none', 'accelerated', 'decelerated'
  impact_rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable Row Level Security for developer flexibility
ALTER TABLE initiative_portfolios DISABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_allocations DISABLE ROW LEVEL SECURITY;
