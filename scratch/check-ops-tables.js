const SUPABASE_URL = "https://lufynzbrcfrcrgrecxfb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZnluemJyY2ZyY3JncmVjeGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzE5NjEsImV4cCI6MjA5NDc0Nzk2MX0.cEcOTr4Pkh1j7rkCs_qMd8_n6XpXLi5z5X676l-GS_Y";

const TABLES = [
  "decision_outcomes",
  "campaign_outcomes",
  "automation_outcomes",
  "operations_health_rules",
  "operations_health_snapshots",
  "technician_metrics",
  "technician_insights",
  "garage_metrics",
  "garage_insights",
  "booking_insights",
  "complaint_insights",
  "playbooks",
  "playbook_steps",
  "playbook_executions",
  "bottleneck_intelligence",
  "bottleneck_snapshots",
  "operational_cost_metrics",
  "cost_insights",
  "capacity_forecasts",
  "capacity_models",
  "operations_simulations",
  "simulation_results",
  "operational_patterns",
  "intelligence_confidence_registry",
  "decision_audit_trail"
];

async function checkTable(table) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=0`, {
      method: "GET",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Accept": "application/json"
      }
    });

    if (res.ok) {
      return { table, exists: true };
    } else {
      const errorText = await res.text();
      return { table, exists: false, error: `${res.status}: ${errorText}` };
    }
  } catch (err) {
    return { table, exists: false, error: err.message };
  }
}

async function main() {
  console.log("🔍 Checking Operations & Strategic tables on Supabase...");
  const results = await Promise.all(TABLES.map(checkTable));
  const active = results.filter(r => r.exists);
  const missing = results.filter(r => !r.exists);

  console.log(`\n📊 Status: ${active.length} / ${TABLES.length} tables verified.`);

  if (missing.length === 0) {
    console.log("✅ All tables exist!");
  } else {
    console.log("❌ The following tables are missing:");
    missing.forEach(m => {
      console.log(`   - ${m.table} (${m.error})`);
    });
  }
}

main().catch(console.error);
