-- ============================================================
-- Migration 015: EOS Completion Layer
-- InnoVibe AIOS — Enterprise Operating System
-- ============================================================

-- 1. Enterprise Knowledge Graph — Nodes
CREATE TABLE IF NOT EXISTS knowledge_nodes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_type         TEXT NOT NULL,
  -- 'Goal' | 'Initiative' | 'Commitment' | 'Task' | 'Customer'
  -- 'Vehicle' | 'Booking' | 'Complaint' | 'RevenueEvent'
  -- 'Decision' | 'Outcome' | 'Lesson'
  node_name         TEXT NOT NULL,
  reference_id      UUID,
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Enterprise Knowledge Graph — Edges
CREATE TABLE IF NOT EXISTS knowledge_edges (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_node_id    UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  target_node_id    UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  -- 'goal_owns_initiative' | 'initiative_generates_commitment'
  -- 'commitment_blocks_task' | 'customer_generates_booking'
  -- 'booking_triggers_revenue' | 'complaint_impacts_goal'
  -- 'decision_drives_outcome' | 'lesson_informs_decision'
  weight            DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Strategic Horizons — 30d / 90d / 365d Projections
CREATE TABLE IF NOT EXISTS strategic_horizons (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type       TEXT NOT NULL,
  entity_id         UUID,
  horizon           TEXT NOT NULL CHECK (horizon IN ('30d','90d','365d')),
  expected_impact   JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- { revenue_impact, operations_impact, goal_impact, risk_level, confidence }
  confidence_score  DECIMAL(5,2) NOT NULL DEFAULT 90.00,
  generated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for traversal performance
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_source ON knowledge_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_target ON knowledge_edges(target_node_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_type   ON knowledge_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_strategic_horizons_entity ON strategic_horizons(entity_id, horizon);

-- Disable Row Level Security for developer flexibility
ALTER TABLE knowledge_nodes      DISABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_edges      DISABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_horizons   DISABLE ROW LEVEL SECURITY;
