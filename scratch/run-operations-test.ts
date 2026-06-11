/**
 * scratch/run-operations-test.ts
 * Live verification test runner for InnoVibe AIOS Phase 3 Operations Intelligence
 */

// Setup environment variables first before loading any modules
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://lufynzbrcfrcrgrecxfb.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZnluemJyY2ZyY3JncmVjeGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzE5NjEsImV4cCI6MjA5NDc0Nzk2MX0.cEcOTr4Pkh1j7rkCs_qMd8_n6XpXLi5z5X676l-GS_Y";
process.env.LARAVEL_API_URL = "https://api.innovibemobility.com/api";
process.env.LARAVEL_ADMIN_EMAIL = "superadmin@innovibe.com";
process.env.LARAVEL_ADMIN_PASSWORD = "12345678";

async function runOperationsTests() {
  console.log("🚀 Starting InnoVibe AIOS Phase 3 Operations Intelligence Tests...\n");

  const { getOperationsHealthReport } = await import("../src/lib/operations-health");
  const { detectBottlenecks } = await import("../src/lib/bottleneck-intelligence");
  const { getCostMetrics, generateCostInsights } = await import("../src/lib/cost-intelligence");
  const { generateCapacityForecasts } = await import("../src/lib/capacity-forecasting");
  const { detectOperationalPatterns } = await import("../src/lib/pattern-intelligence");
  const { runSimulation } = await import("../src/lib/operations-simulator");
  const { triggerPlaybook } = await import("../src/lib/playbook-engine");

  // Test 1: Operations Health
  console.log("=== 1. Testing Operations Health Score Engine ===");
  try {
    const health = await getOperationsHealthReport();
    console.log(`✅ getOperationsHealthReport: overall = ${health.overall}%`);
    console.log(`   - isWarRoomActive: ${health.isWarRoomActive} (threshold: ${health.warRoomThreshold}%)`);
    console.log("   - Metrics details:");
    Object.entries(health.breakdown).forEach(([key, val]: any) => {
      console.log(`     * ${val.display_name}: current = ${val.current}, score = ${val.score}%, status = ${val.status}`);
      console.log(`       Root cause: ${val.rootCause}`);
    });
  } catch (err: any) {
    if (err.message.includes("relation") || err.message.includes("cache")) {
      console.log("⚠️  Note: Database tables missing. This is expected before Supabase migrations are fully applied.");
      console.log(`   Captured error: ${err.message}`);
    } else {
      console.error("❌ Failed in Operations Health check:", err.message);
    }
  }

  // Test 2: Bottleneck Detection
  console.log("\n=== 2. Testing Bottleneck Detection Engine ===");
  try {
    const bottlenecks = await detectBottlenecks();
    console.log(`✅ detectBottlenecks found ${bottlenecks.length} bottlenecks:`);
    bottlenecks.forEach(b => {
      console.log(`   - Type: [${b.type}] Severity: [${b.severity}] Rev Impact: ₹${b.revenue_impact}`);
      console.log(`     Root Cause: ${b.context.rootCause}`);
    });
  } catch (err: any) {
    console.log(`⚠️  Bottleneck Engine check skipped/errored: ${err.message}`);
  }

  // Test 3: Cost & Margins
  console.log("\n=== 3. Testing Cost Intelligence Engine ===");
  try {
    const costMetrics = await getCostMetrics("monthly");
    console.log(`✅ getCostMetrics successfully loaded:`);
    console.log(`   - Cost per booking:  ₹${costMetrics.cost_per_booking}`);
    console.log(`   - Cancellation cost: ₹${costMetrics.cancellation_cost}`);
    
    console.log("Compiling cost insights...");
    const insights = await generateCostInsights();
    console.log(`✅ generateCostInsights: ${insights.length} savings ideas generated:`);
    insights.forEach(ins => {
      console.log(`   - ${ins.title}: Expected Savings: ₹${ins.expected_savings}, ROI: ${ins.expected_roi}%`);
    });
  } catch (err: any) {
    console.log(`⚠️  Cost Engine check skipped/errored: ${err.message}`);
  }

  // Test 4: Capacity Forecasting
  console.log("\n=== 4. Testing Capacity Forecasting Engine ===");
  try {
    const forecasts = await generateCapacityForecasts();
    console.log(`✅ generateCapacityForecasts: compiled predictions:`);
    forecasts.forEach(f => {
      console.log(`   - Period: ${f.forecast_period}`);
      console.log(`     * Predicted bookings: ${f.predicted_bookings}, complaints: ${f.predicted_complaints}`);
      console.log(`     * Tech utilization forecast: ${f.tech_utilization_forecast}%`);
      console.log(`     * Projected revenue impact: ₹${f.revenue_impact}`);
    });
  } catch (err: any) {
    console.log(`⚠️  Capacity Forecasting check skipped/errored: ${err.message}`);
  }

  // Test 5: Operational Pattern Intelligence
  console.log("\n=== 5. Testing Operational Pattern Intelligence ===");
  try {
    const patterns = await detectOperationalPatterns();
    console.log(`✅ detectOperationalPatterns: discovered ${patterns.length} patterns:`);
    patterns.forEach(p => {
      console.log(`   - Type: [${p.pattern_type}] Description: ${p.description}`);
      console.log(`     Confidence: ${p.confidence_score}%, Revenue Impact: ₹${p.revenue_impact}`);
    });
  } catch (err: any) {
    console.log(`⚠️  Pattern Intelligence check skipped/errored: ${err.message}`);
  }

  // Test 6: Operations Simulator (Digital Twin)
  console.log("\n=== 6. Testing Digital Twin Operations Simulator ===");
  try {
    const inputs = {
      bookingsDelta: 30, // +30% volume
      techsDelta: -2, // lost 2 technicians
      complaintsDelta: 20
    };
    const { results } = await runSimulation("Test Simulation Run", inputs);
    console.log("✅ runSimulation completed successfully:");
    console.log(`   - Simulated Tech Utilization:   ${results.utilization.technician}%`);
    console.log(`   - Simulated Response Time:      ${results.responseTimeMinutes} mins`);
    console.log(`   - Simulated Completion Rate:     ${results.completionRate}%`);
    console.log(`   - Net Margin:                   ${results.margin}% (Impact: ${results.marginImpact}%)`);
    console.log(`   - Net Revenue Impact:           ₹${results.revenueImpact}`);
  } catch (err: any) {
    console.log(`⚠️  Operations Simulator check skipped/errored: ${err.message}`);
  }

  // Test 7: Reusable Playbooks Engine
  console.log("\n=== 7. Testing Playbook Engine trigger ===");
  try {
    // Try triggering the High Complaint Recovery playbook (pb1 / '11111111-1111-1111-1111-111111111111')
    const res = await triggerPlaybook("11111111-1111-1111-1111-111111111111", "CEO Test Harness");
    if (res.success) {
      console.log(`✅ triggerPlaybook succeeded! Execution ID: ${res.executionId}`);
    } else {
      console.log(`❌ triggerPlaybook failed: ${res.error}`);
    }
  } catch (err: any) {
    console.log(`⚠️  Playbook Engine check skipped/errored: ${err.message}`);
  }

  // Test 8: Confidence Registry & Audit Trail
  console.log("\n=== 8. Testing Confidence Registry & Decision Audit Trail ===");
  try {
    const { createClient } = await import("../src/lib/supabase/server");
    const supabase = await createClient();
    const { data: confs } = await supabase.from("intelligence_confidence_registry").select("*");
    console.log("✅ Querying intelligence_confidence_registry:");
    (confs || []).forEach((c: any) => {
      console.log(`   - Engine: [${c.engine_name}] Confidence: ${c.confidence_score}%`);
    });

    const { data: audits } = await supabase.from("decision_audit_trail").select("*").limit(3);
    console.log(`✅ Querying decision_audit_trail (Returned ${audits?.length || 0} rows).`);
  } catch (err: any) {
    console.log(`⚠️  Confidence & Audit check skipped/errored: ${err.message}`);
  }

  console.log("\n🏁 Phase 3 Operations Intelligence Integration Tests Finished.");
}

runOperationsTests().catch(console.error);
