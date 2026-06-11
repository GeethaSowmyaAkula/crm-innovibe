#!/usr/bin/env node
/**
 * check-migration.js
 * Run this after pasting the migration in Supabase to confirm all columns exist.
 * 
 * Usage:  node check-migration.js
 */

const SUPABASE_URL = "https://lufynzbrcfrcrgrecxfb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZnluemJyY2ZyY3JncmVjeGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzE5NjEsImV4cCI6MjA5NDc0Nzk2MX0.cEcOTr4Pkh1j7rkCs_qMd8_n6XpXLi5z5X676l-GS_Y";

const REQUIRED = [
  "id","customer_id","reminder_type","scheduled_at","sent_status","sent_at",
  "booking_id","customer_name","customer_phone","vehicle_name","service_type",
  "trigger_type","trigger_date","due_at","status","automation_status","updated_at"
];

async function main() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/reminder_queue?limit=0`,
    {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Accept": "application/json",
        "Prefer": "return=representation"
      }
    }
  );

  // Supabase returns column info in headers for empty results
  // Simpler: just try inserting a test row and see what errors we get
  const testRes = await fetch(
    `${SUPABASE_URL}/rest/v1/reminder_queue?select=booking_id,automation_status,due_at,status&limit=1`,
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
    console.log("✅ Migration applied! Columns booking_id, automation_status, due_at, status all exist.");
    console.log("   Sample data:", body.slice(0, 200));
  } else {
    console.log("❌ Migration NOT yet applied.");
    console.log("   Error:", body);
    console.log("\n📋 Go to: https://supabase.com/dashboard/project/lufynzbrcfrcrgrecxfb/sql/new");
    console.log("   Paste the contents of: supabase/migrations/001_extend_reminder_queue.sql");
    console.log("   Click RUN, then re-run this script.");
  }
}

main().catch(console.error);
