/**
 * Data Audit Script — InnoVibe CRM
 * Queries both Supabase and Laravel API to show real data counts
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://lufynzbrcfrcrgrecxfb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZnluemJyY2ZyY3JncmVjeGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzE5NjEsImV4cCI6MjA5NDc0Nzk2MX0.cEcOTr4Pkh1j7rkCs_qMd8_n6XpXLi5z5X676l-GS_Y";
const LARAVEL_API = "https://api.innovibemobility.com/api";
const LARAVEL_EMAIL = "superadmin@innovibe.com";
const LARAVEL_PASSWORD = "12345678";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getToken() {
  const res = await fetch(`${LARAVEL_API}/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: LARAVEL_EMAIL, password: LARAVEL_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const data = await res.json();
  return data.auth_token;
}

async function laravelCount(token, path, params = {}) {
  try {
    const url = new URL(`${LARAVEL_API}/admin/${path}`);
    Object.entries({ per_page: "1", page: "1", ...params }).forEach(([k, v]) =>
      url.searchParams.set(k, v)
    );
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!res.ok) return { count: "❌ API error", sample: null };
    const data = await res.json();
    const total = data.meta?.total ?? data.meta?.total_count ?? "?";
    const dataKey = Object.keys(data.data || {})[0];
    const sample = dataKey ? (data.data[dataKey]?.[0] ?? null) : null;
    return { count: total, sample };
  } catch (e) {
    return { count: `❌ ${e.message}`, sample: null };
  }
}

async function sbCount(table, filter = null) {
  try {
    let q = supabase.from(table).select("*", { count: "exact", head: true });
    if (filter) q = q.eq(filter.col, filter.val);
    const { count, error } = await q;
    if (error) return { count: `❌ ${error.message}`, sample: null };
    
    // Fetch 1 sample row
    let sq = supabase.from(table).select("*").limit(1);
    if (filter) sq = sq.eq(filter.col, filter.val);
    const { data: sample } = await sq;
    return { count: count ?? 0, sample: sample?.[0] ?? null };
  } catch (e) {
    return { count: `❌ ${e.message}`, sample: null };
  }
}

console.log("\n🔍  InnoVibe CRM — Real Data Audit\n" + "=".repeat(50));

// ── LARAVEL API ──────────────────────────────────────────
console.log("\n📡  LARAVEL API (api.innovibemobility.com)\n" + "-".repeat(40));
let token;
try {
  token = await getToken();
  console.log("✅  Authenticated to Laravel API");
} catch (e) {
  console.log(`❌  Laravel login failed: ${e.message}`);
  token = null;
}

if (token) {
  const laravelTables = [
    ["users", "Users / Customers"],
    ["bookings", "Bookings"],
    ["transactions", "Transactions"],
    ["service-centers", "Service Centers / Garages"],
    ["brands", "Vehicle Brands"],
    ["vehicle-model", "Vehicle Models"],
    ["service", "Services"],
    ["plans", "Membership Plans"],
    ["announcements", "Announcements"],
    ["recommendations", "Recommendations"],
  ];

  for (const [path, label] of laravelTables) {
    const { count, sample } = await laravelCount(token, path);
    const sampleText = sample
      ? `  → sample: ${JSON.stringify(sample).slice(0, 80)}...`
      : "";
    console.log(`  ${label.padEnd(30)} ${String(count).padStart(6)} records${sampleText}`);
  }

  // Also check transactions specifically for revenue
  try {
    const txRes = await fetch(`${LARAVEL_API}/admin/transactions?per_page=500&page=1`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const txData = await txRes.json();
    const txns = txData.data?.transactions ?? [];
    const success = txns.filter(t => t.status === "success");
    const revenue = success.reduce((acc, t) => acc + Number(t.amount), 0);
    console.log(`\n  💰 Revenue from ${success.length} successful txns: ₹${revenue.toLocaleString("en-IN")}`);
    const statuses = [...new Set(txns.map(t => t.status))];
    console.log(`  📊 Transaction statuses found: ${statuses.join(", ")}`);
  } catch (e) {}
}

// ── SUPABASE ─────────────────────────────────────────────
console.log("\n\n🗄️   SUPABASE (lufynzbrcfrcrgrecxfb.supabase.co)\n" + "-".repeat(40));

const sbTables = [
  ["customers", "Customers"],
  ["vehicles", "Vehicles"],
  ["bookings", "Bookings"],
  ["transactions", "Transactions"],
  ["complaints", "Complaints"],
  ["feedback", "Feedback / Reviews"],
  ["technicians", "Technicians"],
  ["garages", "Garages"],
  ["goals", "Goals / OKRs"],
  ["device_alerts", "Device Alerts"],
  ["activity_feed", "Activity Feed"],
  ["decision_recommendations", "AI Recommendations"],
  ["strategy_opportunities", "Strategy Opportunities"],
  ["tasks", "Tasks"],
  ["executive_notes", "Executive Notes"],
  ["board_decisions", "Board Decisions"],
  ["strategic_decisions", "Strategic Decisions"],
  ["kpi_registry", "KPI Registry"],
  ["daily_briefings", "Cached Briefings"],
  ["failed_sync_records", "Failed Sync Records"],
  ["failed_events", "Failed Events"],
  ["amc_plans", "AMC Plans"],
  ["leads", "Leads"],
  ["report_templates", "Report Templates"],
  ["report_snapshots", "Report Snapshots"],
  ["health_score_rules", "Health Score Rules"],
  ["automation_rules", "Automation Rules"],
  ["decision_outcomes", "Decision Outcomes"],
  ["campaign_outcomes", "Campaign Outcomes"],
  ["automation_outcomes", "Automation Outcomes"],
];

for (const [table, label] of sbTables) {
  const { count, sample } = await sbCount(table);
  const sampleText = sample
    ? `  → ${Object.keys(sample).slice(0, 4).join(", ")}...`
    : "";
  console.log(`  ${label.padEnd(32)} ${String(count).padStart(6)} rows${sampleText}`);
}

// AMC breakdown
const amcStatuses = ["active", "expiring", "expired"];
console.log("\n  📋  Customer AMC Breakdown:");
for (const status of amcStatuses) {
  const { count } = await sbCount("customers", { col: "amc_status", val: status });
  console.log(`      amc_status = '${status}': ${count}`);
}

console.log("\n" + "=".repeat(50));
console.log("✅  Audit complete.\n");
