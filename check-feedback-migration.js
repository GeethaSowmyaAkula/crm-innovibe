#!/usr/bin/env node
/**
 * check-feedback-migration.js
 * Run this after pasting the migration in Supabase to confirm feedback_queue exists.
 * 
 * Usage:  node check-feedback-migration.js
 */

const SUPABASE_URL = "https://lufynzbrcfrcrgrecxfb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZnluemJyY2ZyY3JncmVjeGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzE5NjEsImV4cCI6MjA5NDc0Nzk2MX0.cEcOTr4Pkh1j7rkCs_qMd8_n6XpXLi5z5X676l-GS_Y";

async function main() {
  const testRes = await fetch(
    `${SUPABASE_URL}/rest/v1/feedback_queue?select=booking_id,automation_status,due_at,status,feedback_rating,escalation_required&limit=1`,
    {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Accept": "application/json"
      }
    }
  );
  const body = await testRes.text();
  
  if (testRes.ok) {
    console.log("✅ Phase 2B Migration applied! feedback_queue exists with all columns.");
    console.log("   Query response:", body.slice(0, 200));
  } else {
    console.log("❌ feedback_queue table or columns NOT found in Supabase.");
    console.log("   Error:", body);
    console.log("\n📋 Go to: https://supabase.com/dashboard/project/lufynzbrcfrcrgrecxfb/sql/new");
    console.log("   Paste the contents of: supabase/migrations/002_create_feedback_queue.sql");
    console.log("   Click RUN, then re-run this script.");
  }
}

main().catch(console.error);
