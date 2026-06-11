/**
 * scratch/run-execution-test.ts
 * Verification script for InnoVibe CRM Phase 6 / 6.1 Enterprise Execution Layer
 */

import { getEnterpriseHealth } from "../src/lib/enterprise-health";
import { calculateExecutionProbability } from "../src/lib/execution-probability";
import { trackValueRealization } from "../src/lib/value-realization";
import { runAutonomousFollowups } from "../src/lib/followup-engine";
import { getDailyCEOPriorities } from "../src/lib/executive-focus";
import { getOrganizationalCapacity } from "../src/lib/organizational-capacity";
import { analyzePortfolio } from "../src/lib/portfolio-engine";
import { createClient } from "../src/lib/supabase/server";

async function runTest() {
  console.log("==========================================================");
  console.log("   INNOVIBE ENTERPRISE EXECUTION LAYER VERIFICATION TEST  ");
  console.log("==========================================================");

  try {
    const db = await createClient();

    // 1. Fetch some test data identifiers
    console.log("\n🔍 Fetching active strategic initiatives...");
    const { data: initiatives, error: initErr } = await db.from("strategic_initiatives").select("id, title");
    if (initErr) {
      console.log("⚠️ Could not load initiatives:", initErr.message);
    } else {
      console.log(`✅ Loaded ${initiatives?.length || 0} initiatives.`);
    }

    const testInitId = initiatives && initiatives.length > 0 ? initiatives[0].id : "00000000-0000-0000-0000-000000000000";

    console.log("\n🔍 Fetching active execution commitments...");
    const { data: commitments } = await db.from("execution_commitments").select("id, title");
    const testCommitmentId = commitments && commitments.length > 0 ? commitments[0].id : "00000000-0000-0000-0000-000000000000";

    // 2. Test Enterprise Health Score
    console.log("\n----------------------------------------------------------");
    console.log("🧠 1. ENTERPRISE HEALTH INDEX");
    console.log("----------------------------------------------------------");
    const health = await getEnterpriseHealth();
    console.log(`   - Unified Company Score: ${health.unified_score}%`);
    console.log(`   - Health Category: ${health.category}`);
    console.log(`   - Breakdown:`);
    console.log(`     * Revenue Health: ${health.revenue_health}%`);
    console.log(`     * Operations Health: ${health.operations_health}%`);
    console.log(`     * Execution Health: ${health.execution_health}%`);
    console.log(`     * Goal Achievement: ${health.goal_achievement}%`);
    console.log(`     * Trust Index: ${health.trust_index}%`);

    // 3. Test Execution Probability Score
    console.log("\n----------------------------------------------------------");
    console.log("📈 2. EXECUTION PROBABILITY ENGINE");
    console.log("----------------------------------------------------------");
    const probability = await calculateExecutionProbability(testCommitmentId);
    if (probability) {
      console.log(`   - Commitment ID: ${probability.commitment_id}`);
      console.log(`   - Completion Probability: ${probability.completion_probability}%`);
      console.log(`   - Delay Probability: ${probability.delay_probability}%`);
      console.log(`   - Failure Probability: ${probability.failure_probability}%`);
      console.log(`   - Status Ranging: ${probability.status}`);
      console.log(`   - Model Confidence: ${probability.confidence_score}%`);
    } else {
      console.log("⚠️ No active commitments to calculate execution probability.");
    }

    // 4. Test Value Realization
    console.log("\n----------------------------------------------------------");
    console.log("📊 3. VALUE REALIZATION ENGINE");
    console.log("----------------------------------------------------------");
    const realization = await trackValueRealization(testInitId);
    if (realization) {
      console.log(`   - Initiative ID: ${realization.initiative_id}`);
      console.log(`   - Expected Revenue: ₹${realization.expected_revenue}`);
      console.log(`   - Actual Revenue: ₹${realization.actual_revenue}`);
      console.log(`   - Expected Savings: ₹${realization.expected_savings}`);
      console.log(`   - Actual Savings: ₹${realization.actual_savings}`);
      console.log(`   - CSAT Realization: ${realization.actual_csat} vs ${realization.expected_csat}`);
      console.log(`   - Value Realization Score: ${realization.realization_score}%`);
    } else {
      console.log("⚠️ No active initiatives to track value realization.");
    }

    // 5. Test Autonomous Follow-ups
    console.log("\n----------------------------------------------------------");
    console.log("🚨 4. AUTONOMOUS FOLLOW-UP ENGINE");
    console.log("----------------------------------------------------------");
    const followups = await runAutonomousFollowups();
    console.log(`   - Dispatched ${followups.length} automated alerts:`);
    followups.forEach((f, index) => {
      console.log(`     [${index + 1}] Urgency: ${f.urgency.toUpperCase()} | Target: ${f.target}`);
      console.log(`         Action Required: ${f.action_required}`);
    });

    // 6. Test Strategic Portfolio Management
    console.log("\n----------------------------------------------------------");
    console.log("💼 5. STRATEGIC INITIATIVE PORTFOLIO RANKING");
    console.log("----------------------------------------------------------");
    const { data: portfolios } = await db.from("initiative_portfolios").select("id, name");
    const testPortId = portfolios && portfolios.length > 0 ? portfolios[0].id : "00000000-0000-0000-0000-000000000000";
    const rankings = await analyzePortfolio(testPortId);
    console.log(`   - Evaluated ${rankings.length} allocations in portfolio:`);
    rankings.forEach((r, index) => {
      console.log(`     [${index + 1}] Initiative: "${r.title}"`);
      console.log(`         ROI Yield: ${r.roi.toFixed(1)}% | Risk Score: ${r.risk_score.toFixed(1)}%`);
      console.log(`         Pivoting Recommendation: ${r.acceleration_recommendation.toUpperCase()}`);
      console.log(`         Rationale: ${r.rationale}`);
    });

    // 7. Test Organizational Capacity
    console.log("\n----------------------------------------------------------");
    console.log("⚙️ 6. ORGANIZATIONAL CAPACITY LOADS");
    console.log("----------------------------------------------------------");
    const capacities = await getOrganizationalCapacity();
    capacities.forEach((c) => {
      console.log(`   - ${c.name} Division capacity: ${c.current_capacity}% (Forecast 30d: ${c.forecast_capacity}%)`);
      console.log(`     Breaking Point triggered: ${c.is_breaking_point ? "⚠️ YES" : "✅ NO"}`);
      console.log(`     Scaling Recommendation: ${c.scaling_recommendation}`);
    });

    // 8. Test Executive Priorities Focus
    console.log("\n----------------------------------------------------------");
    console.log("🎯 7. DAILY EXECUTIVE focus (TOP 3 CEO PRIORITIES)");
    console.log("----------------------------------------------------------");
    const priorities = await getDailyCEOPriorities();
    priorities.forEach((p) => {
      console.log(`   [Rank ${p.rank}] ${p.title} (${p.urgency} Urgency | score ${p.composite_score})`);
      console.log(`       Rationale: ${p.rationale}`);
      console.log(`       Action Step: ${p.actionable_step}`);
    });

    console.log("\n==========================================================");
    console.log("   ✅ ALL VERIFICATION CHECKS SUCCESSFULLY EXECUTED!     ");
    console.log("==========================================================");
  } catch (err: any) {
    console.error("\n❌ Test execution failed with error:", err.message);
  }
}

runTest();
