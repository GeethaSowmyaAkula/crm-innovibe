-- =============================================================
-- Migration: 002_create_feedback_queue.sql
-- InnoVibe CRM — Phase 2B AI Feedback Agent
-- Run once in Supabase SQL Editor
-- =============================================================

CREATE TABLE IF NOT EXISTS feedback_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  booking_id TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  customer_name TEXT,
  customer_phone TEXT,

  service_type TEXT,
  vehicle_name TEXT,

  trigger_date TIMESTAMP WITH TIME ZONE NOT NULL,
  due_at TIMESTAMP WITH TIME ZONE NOT NULL,

  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'ready_to_send', 'sent', 'failed')),
    
  automation_status TEXT DEFAULT 'waiting'
    CHECK (automation_status IN ('waiting', 'picked_by_n8n', 'completed')),

  feedback_rating INTEGER CHECK (feedback_rating BETWEEN 1 AND 5),
  feedback_text TEXT,

  escalation_required BOOLEAN DEFAULT false,

  sent_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for n8n hourly polling performance
CREATE INDEX IF NOT EXISTS idx_feedback_due
ON feedback_queue(status, due_at);

-- Trigger to automatically keep updated_at current
CREATE OR REPLACE FUNCTION update_feedback_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Disable Row Level Security so Next.js anon client can perform sync/CRUD operations
ALTER TABLE feedback_queue DISABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_feedback_queue_modtime ON feedback_queue;
CREATE TRIGGER update_feedback_queue_modtime
BEFORE UPDATE ON feedback_queue
FOR EACH ROW
EXECUTE PROCEDURE update_feedback_modified_column();
