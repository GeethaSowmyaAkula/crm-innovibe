-- =============================================================
-- Migration: 001_extend_reminder_queue.sql
-- InnoVibe CRM — Phase 2 Automation Backbone
-- Run once in Supabase SQL Editor
-- =============================================================

-- 1. Add booking_id column (links reminder to Laravel booking)
ALTER TABLE reminder_queue
  ADD COLUMN IF NOT EXISTS booking_id TEXT;

-- 2. Add customer denormalised fields (so n8n doesn't need a join)
ALTER TABLE reminder_queue
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- 3. Add vehicle / service context
ALTER TABLE reminder_queue
  ADD COLUMN IF NOT EXISTS vehicle_name TEXT,
  ADD COLUMN IF NOT EXISTS service_type TEXT;

-- 4. Add trigger metadata
ALTER TABLE reminder_queue
  ADD COLUMN IF NOT EXISTS trigger_type TEXT DEFAULT 'service_followup',
  ADD COLUMN IF NOT EXISTS trigger_date TIMESTAMP WITH TIME ZONE;

-- 5. Add due_at (when reminder should fire)
ALTER TABLE reminder_queue
  ADD COLUMN IF NOT EXISTS due_at TIMESTAMP WITH TIME ZONE;

-- 6. Replace sent_status with status (keep backward compat alias)
--    We keep sent_status for old code but add a proper status column.
ALTER TABLE reminder_queue
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'ready_to_send', 'sent', 'failed'));

-- 7. Add automation_status (tracks n8n workflow state)
ALTER TABLE reminder_queue
  ADD COLUMN IF NOT EXISTS automation_status TEXT DEFAULT 'waiting'
    CHECK (automation_status IN ('waiting', 'picked_by_n8n', 'completed'));

-- 8. Add updated_at
ALTER TABLE reminder_queue
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 9. Unique constraint to prevent duplicate reminders per booking
ALTER TABLE reminder_queue
  DROP CONSTRAINT IF EXISTS unique_booking_trigger;

ALTER TABLE reminder_queue
  ADD CONSTRAINT unique_booking_trigger UNIQUE (booking_id, trigger_type);

-- 10. Backfill status from sent_status for existing rows
UPDATE reminder_queue
SET status = sent_status
WHERE status IS NULL AND sent_status IS NOT NULL;

-- 11. Index for n8n query performance
CREATE INDEX IF NOT EXISTS idx_reminder_queue_status_due
  ON reminder_queue (status, due_at);

CREATE INDEX IF NOT EXISTS idx_reminder_queue_booking_id
  ON reminder_queue (booking_id);

-- 12. auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_reminder_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reminder_queue_updated_at ON reminder_queue;

CREATE TRIGGER reminder_queue_updated_at
  BEFORE UPDATE ON reminder_queue
  FOR EACH ROW EXECUTE FUNCTION update_reminder_updated_at();
