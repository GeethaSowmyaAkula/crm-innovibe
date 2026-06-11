/**
 * scratch/run-strengthening-test.ts
 * Live verification test runner for AIOS Strengthening Updates
 */

// Setup environment variables first before loading any modules
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://lufynzbrcfrcrgrecxfb.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZnluemJyY2ZyY3JncmVjeGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzE5NjEsImV4cCI6MjA5NDc0Nzk2MX0.cEcOTr4Pkh1j7rkCs_qMd8_n6XpXLi5z5X676l-GS_Y";
process.env.LARAVEL_API_URL = "https://api.innovibemobility.com/api";
process.env.LARAVEL_ADMIN_EMAIL = "superadmin@innovibe.com";
process.env.LARAVEL_ADMIN_PASSWORD = "12345678";

async function runStrengtheningTests() {
  console.log("🚀 Starting Strengthening Integration Tests...\n");
  
  const { getDynamicKPIs } = await import("../src/lib/kpi");
  const { runOpportunityScan } = await import("../src/lib/opportunity-engine");
  const { getOrCreateDailyBriefing } = await import("../src/lib/briefing");
  const { generateReportSnapshot, getHistoricalSnapshots } = await import("../src/lib/reports");
  const { createClient } = await import("../src/lib/supabase/server");

  const supabase = await createClient();

  // Test 1: Dynamic KPIs Calculation
  console.log("=== 1. Testing Centralized Dynamic KPI Registry ===");
  try {
    const kpis = await getDynamicKPIs();
    console.log("✅ getDynamicKPIs completed successfully. Calculated values:");
    kpis.forEach(k => {
      console.log(`   - [${k.owner_department}] ${k.name}: Current: ${k.current_value} (Target: ${k.target}, Trend: ${k.trend})`);
    });
  } catch (err: any) {
    console.error("❌ Failed to calculate dynamic KPIs:", err.message);
  }

  // Test 2: Opportunity Scan
  console.log("\n=== 2. Testing Opportunity Detection Engine ===");
  try {
    const result = await runOpportunityScan();
    console.log("✅ runOpportunityScan completed successfully:");
    console.log(`   - Detected: ${result.detected} opportunities`);
    console.log(`   - Inserted: ${result.inserted} new opportunities`);

    // Fetch from database to verify
    const { data: dbOpps } = await supabase
      .from("strategy_opportunities")
      .select("title, impact_score, confidence_score, effort_score, expected_revenue, priority_score")
      .order("priority_score", { ascending: false })
      .limit(3);

    console.log("   - Top 3 Scored Opportunities in Database:");
    dbOpps?.forEach((o: any) => {
      console.log(`     * ${o.title} (Priority: ${o.priority_score}, Revenue: ₹${o.expected_revenue}, RICE elements: Impact ${o.impact_score}, Conf ${o.confidence_score}, Effort ${o.effort_score})`);
    });
  } catch (err: any) {
    console.error("❌ Failed to execute Opportunity Engine:", err.message);
  }

  // Test 3: Daily Briefing
  console.log("\n=== 3. Testing CEO Daily Briefing cache ===");
  try {
    const briefing = await getOrCreateDailyBriefing();
    console.log("✅ getOrCreateDailyBriefing completed successfully. Briefing preview:");
    console.log(`   - Summary: "${briefing.summary}"`);
    console.log(`   - Revenue Summary: "${briefing.revenue_summary}"`);
    console.log(`   - Bookings Summary: "${briefing.booking_summary}"`);
    console.log(`   - Opportunities Summary: "${briefing.opps_summary}"`);
  } catch (err: any) {
    console.error("❌ Failed to compile Daily Briefing:", err.message);
  }

  // Test 4: Historical Reporting Engine
  console.log("\n=== 4. Testing Historical Reporting Engine ===");
  try {
    // Fetch templates first
    const { data: templates } = await supabase
      .from("report_templates")
      .select("*");

    if (templates && templates.length > 0) {
      console.log(`   - Found ${templates.length} templates. Compiling snapshot for the first template: "${templates[0].name}"...`);
      const snapshot = await generateReportSnapshot(templates[0].id, `Audit Test Snapshot - ${new Date().toLocaleDateString("en-IN")}`);
      if (snapshot) {
        console.log("✅ Snapshot compiled and saved successfully:");
        console.log(`     * Snapshot Name: "${snapshot.name}"`);
        console.log(`     * Data Payload:`, JSON.stringify(snapshot.data, null, 2));

        // Read all snapshots
        const history = await getHistoricalSnapshots();
        console.log(`   - Total snapshots in history: ${history.length}`);
      } else {
        console.error("❌ Snapshot compilation returned null.");
      }
    } else {
      console.error("❌ No report templates found in database.");
    }
  } catch (err: any) {
    console.error("❌ Failed in Reporting Engine test:", err.message);
  }

  console.log("\n🏁 Integration Tests Completed.");
}

runStrengtheningTests().catch(console.error);
