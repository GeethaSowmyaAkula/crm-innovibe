/**
 * scratch/run-strategic-test.ts
 * Live verification test runner for InnoVibe AIOS Strategic Layers
 */

// Setup environment variables first before loading any modules
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://lufynzbrcfrcrgrecxfb.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZnluemJyY2ZyY3JncmVjeGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzE5NjEsImV4cCI6MjA5NDc0Nzk2MX0.cEcOTr4Pkh1j7rkCs_qMd8_n6XpXLi5z5X676l-GS_Y";
process.env.LARAVEL_API_URL = "https://api.innovibemobility.com/api";
process.env.LARAVEL_ADMIN_EMAIL = "superadmin@innovibe.com";
process.env.LARAVEL_ADMIN_PASSWORD = "12345678";

async function runStrategicTests() {
  console.log("🚀 Starting InnoVibe AIOS Strategic Layers Tests...\n");
  
  const { ContextEngine } = await import("../src/lib/context-engine");
  const { applyRecommendationLearning } = await import("../src/lib/recommendation-learning");
  const { getOrCreateExecutiveBriefing } = await import("../src/lib/briefing");
  const { getRelationshipInsights } = await import("../src/lib/relationship-engine");
  const { createClient } = await import("../src/lib/supabase/server");

  const supabase = await createClient();

  // Test 1: Context Engine
  console.log("=== 1. Testing Context Engine Insights ===");
  try {
    const revenueKpiCtx = ContextEngine.getKPIContext("Monthly Revenue", 14000, 50000);
    console.log("✅ getKPIContext ('Monthly Revenue' under-performing):");
    console.log(`   - Root Cause: ${revenueKpiCtx.rootCause}`);
    console.log(`   - Impact:     ${revenueKpiCtx.impact}`);
    console.log(`   - Action:     ${revenueKpiCtx.suggestedAction}`);

    const alertCtx = ContextEngine.getAlertContext("Vehicle failure", "Battery SOH is 65% for vehicle MH-12", "critical");
    console.log("\n✅ getAlertContext (Critical Battery SOH):");
    console.log(`   - Root Cause: ${alertCtx.rootCause}`);
    console.log(`   - Impact:     ${alertCtx.impact}`);
    console.log(`   - Action:     ${alertCtx.suggestedAction}`);
  } catch (err: any) {
    console.error("❌ Failed in Context Engine check:", err.message);
  }

  // Test 2: Action Outcome Tracking & Capped Scores
  console.log("\n=== 2. Testing Outcome Tracking & Score Capping ===");
  try {
    // We insert a mock campaign outcome with expected: 5, actual: 8 (representing 160% success, should cap at 100%)
    const expected = 5;
    const actual = 8;
    const computedScore = Math.min(100.00, (actual / expected) * 100);

    const { data: campaignOut, error: campErr } = await supabase
      .from("campaign_outcomes")
      .insert({
        campaign_name: "Test Upsell Campaign",
        expected_result: `Expected ${expected} sales`,
        actual_result: `Achieved ${actual} sales`,
        variance: `+3 sales`,
        success_score: computedScore
      })
      .select()
      .single();

    if (campErr) throw campErr;

    console.log("✅ Campaign Outcome logged successfully:");
    console.log(`   - Expected/Actual: ${campaignOut.expected_result} / ${campaignOut.actual_result}`);
    console.log(`   - Computed Success Score: ${campaignOut.success_score}% (Capped at 100%)`);
  } catch (err: any) {
    console.error("❌ Failed in Outcome Tracking check:", err.message);
  }

  // Test 3: Recommendation Learning Feedback Loops
  console.log("\n=== 3. Testing Recommendation Learning Loop ===");
  try {
    const testRecs = [
      {
        id: "test-rec-101",
        title: "Pune Fleet AMC Campaign Promotion",
        description: "Promotional campaign offering a 10% discount on AMC subscriptions.",
        rationale: "Upsell out-of-warranty fleet vehicles.",
        confidence_score: 0.90,
        proposed_action: { type: "SEND_CAMPAIGN" },
        status: "pending"
      }
    ];

    const adjustedRecs = await applyRecommendationLearning(testRecs);
    console.log("✅ applyRecommendationLearning completed:");
    adjustedRecs.forEach(r => {
      console.log(`   - Recommendation: "${r.title}"`);
      console.log(`     * Default Confidence: 90%`);
      console.log(`     * Adjusted Confidence: ${Math.round(r.confidence_score * 100)}%`);
      console.log(`     * Learning Feedback Log: ${r.learning_log}`);
    });
  } catch (err: any) {
    console.error("❌ Failed in Recommendation Learning check:", err.message);
  }

  // Test 4: Multi-Scale Executive Briefings
  console.log("\n=== 4. Testing Multi-Scale Executive Briefing Delivery ===");
  try {
    console.log("Compiling Weekly Brief...");
    const weekly = await getOrCreateExecutiveBriefing("weekly");
    console.log(`✅ Weekly Brief compiled for Period: ${weekly.period_key}`);
    console.log(`   - Summary: "${weekly.summary.substring(0, 150)}..."`);

    console.log("\nCompiling Monthly Brief...");
    const monthly = await getOrCreateExecutiveBriefing("monthly");
    console.log(`✅ Monthly Brief compiled for Period: ${monthly.period_key}`);
    console.log(`   - Summary: "${monthly.summary.substring(0, 150)}..."`);
  } catch (err: any) {
    console.error("❌ Failed in Briefing Delivery check:", err.message);
  }

  // Test 5: Company Relationship Engine Insights
  console.log("\n=== 5. Testing Company Relationship Engine ===");
  try {
    const insights = await getRelationshipInsights();
    console.log("✅ getRelationshipInsights computed successfully:");
    
    console.log("\n   * Top Customers by Revenue:");
    insights.topRevenueCustomers.forEach((c, i) => {
      console.log(`     ${i+1}. ${c.fullName} - Spent: ₹${c.totalSpent} (Vehicles owned: ${c.vehicleCount})`);
    });

    console.log("\n   * Customers with High Complaint Density:");
    insights.highComplaintCustomers.forEach((c, i) => {
      console.log(`     ${i+1}. ${c.fullName} - Complaint count: ${c.complaintCount} (Last Severity: ${c.lastComplaintSeverity})`);
    });

    console.log("\n   * Fleet Clients with Expansion Potential:");
    insights.fleetExpansionPotential.forEach((c, i) => {
      console.log(`     ${i+1}. ${c.fullName} - Fleet size: ${c.vehicleCount} (Completed bookings: ${c.completedBookingsCount}, Expansion Score: ${c.expansionScore})`);
    });

    console.log("\n   * Fleet Clients with Low AMC Penetration:");
    insights.lowAmcPenetration.forEach((c, i) => {
      console.log(`     ${i+1}. ${c.fullName} - Uncovered: ${c.uncoveredVehicleCount}/${c.vehicleCount} (Coverage: ${c.amcPenetrationRate}%)`);
    });
  } catch (err: any) {
    console.error("❌ Failed in Relationship Engine check:", err.message);
  }

  console.log("\n🏁 Strategic Layers Integration Tests Completed.");
}

runStrategicTests().catch(console.error);
