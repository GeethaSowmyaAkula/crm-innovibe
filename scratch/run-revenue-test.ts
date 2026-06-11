/**
 * scratch/run-revenue-test.ts
 * Revenue Intelligence Verification Test Runner
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://lufynzbrcfrcrgrecxfb.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZnluemJyY2ZyY3JncmVjeGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzE5NjEsImV4cCI6MjA5NDc0Nzk2MX0.cEcOTr4Pkh1j7rkCs_qMd8_n6XpXLi5z5X676l-GS_Y";
process.env.LARAVEL_API_URL = "https://api.innovibemobility.com/api";
process.env.LARAVEL_ADMIN_EMAIL = "superadmin@innovibe.com";
process.env.LARAVEL_ADMIN_PASSWORD = "12345678";

import { createClient } from "../src/lib/supabase/server";
import { getBookings, getTransactions } from "../src/lib/laravel/api";
import {
  calculateRevenueLeakages,
  calculateRevenueAttributions,
  calculateRevenueForecasts,
  calculateCustomerValueMatrix,
  runRevenueSimulation,
  evaluateRevenueWarRoom,
  calculateRevenueFlywheel,
  refreshRevenueIntelligence
} from "../src/lib/revenue-intelligence";

async function runTest() {
  console.log("==========================================================");
  console.log("   INNOVIBE REVENUE INTELLIGENCE VERIFICATION TEST");
  console.log("==========================================================\n");

  const db = await createClient();

  // 1. Revenue Leakage
  console.log("----------------------------------------------------------");
  console.log("🔍 MODULE 1: REVENUE LEAKAGE DETECTION");
  console.log("----------------------------------------------------------");
  const leakages = await calculateRevenueLeakages();
  console.log(`   - Detected Leakage Events: ${leakages.length}`);
  leakages.slice(0, 3).forEach((l, idx) => {
    console.log(`     [Leakage #${idx + 1}] Type: "${l.leakage_type}" | Value: ₹${l.amount}`);
    console.log(`       * Root Cause: ${l.root_cause}`);
  });

  // 2. Churn & AMC conversion are internal components of Value Matrix, let's look at attributions
  console.log("\n----------------------------------------------------------");
  console.log("🔍 MODULE 2: REVENUE ATTRIBUTION ENGINE");
  console.log("----------------------------------------------------------");
  const atts = await calculateRevenueAttributions();
  atts.forEach((a, idx) => {
    console.log(`     [Attribution #${idx + 1}] Driver: "${a.driver_name}" | Impact: ₹${a.impact_amount} (${a.factor_type})`);
  });

  // 3. Forecasting
  console.log("\n----------------------------------------------------------");
  console.log("🔍 MODULE 3: REVENUE FORECASTING ENGINE");
  console.log("----------------------------------------------------------");
  const forecasts = await calculateRevenueForecasts();
  const future = forecasts.filter(f => f.type === "forecast");
  const actuals = forecasts.filter(f => f.type === "actual");
  console.log(`   - Historical Actuals Count: ${actuals.length}`);
  console.log(`   - Projected Forecast months:`);
  future.forEach(f => {
    console.log(`     * Month: ${f.month} -> Predicted Revenue: ₹${f.revenue}`);
  });

  // 4. Customer Value Matrix
  console.log("\n----------------------------------------------------------");
  console.log("🔍 MODULE 4: CUSTOMER VALUE MATRIX & CLV");
  console.log("----------------------------------------------------------");
  const [
    { data: customers },
    { data: vehicles },
    { data: complaints },
    { data: feedback },
    bookings,
    transactions
  ] = await Promise.all([
    db.from("customers").select("*"),
    db.from("vehicles").select("*"),
    db.from("complaints").select("*"),
    db.from("feedback_queue").select("*"),
    getBookings().catch(() => []),
    getTransactions().catch(() => [])
  ]);

  const matrix = await calculateCustomerValueMatrix(
    customers || [],
    vehicles || [],
    bookings || [],
    transactions || [],
    complaints || [],
    feedback || []
  );

  console.log(`   - Computed Customer Profiles: ${matrix.length}`);
  matrix.slice(0, 3).forEach((p, idx) => {
    console.log(`     [Customer Profile #${idx + 1}] ID: ${p.customer_id.substring(0, 8)}...`);
    console.log(`       * CLV: ₹${p.clv.toFixed(2)} | Segment: ${p.segment}`);
    console.log(`       * Value Score: ${p.revenue_value} | Retention Probability: ${p.retention_probability}%`);
  });

  // 5. Strategic Revenue Simulator
  console.log("\n----------------------------------------------------------");
  console.log("🔍 MODULE 5: STRATEGIC REVENUE SIMULATOR");
  console.log("----------------------------------------------------------");
  const simulated = runRevenueSimulation(12000, 4500, 28.5, 45, {
    bookingGrowthPct: 15,
    amcGrowthPct: 20,
    churnReductionPct: 30,
    recoveryImprovementPct: 50
  });
  console.log(`   - Base Revenue: ₹12,000`);
  console.log(`   - Simulated Output Revenue: ₹${simulated.simulatedRevenue}`);
  console.log(`   - Net Saved Recovery: ₹${simulated.netRecoveryValue} (${simulated.variancePct}% Growth)`);
  console.log(`   - Projected CSAT Out-turn: ${simulated.simulatedCSAT} / 5.0`);

  // 6. Revenue Flywheel Analysis
  console.log("\n----------------------------------------------------------");
  console.log("🔍 MODULE 6: REVENUE FLYWHEEL ANALYSIS");
  console.log("----------------------------------------------------------");
  const flywheel = await calculateRevenueFlywheel();
  console.log(`   - Customer Acquisition Rate: ${flywheel.customer_acquisition_rate}%`);
  console.log(`   - Booking Frequency Index: ${flywheel.booking_frequency} bookings/user`);
  console.log(`   - Payment Checkout Rate: ${flywheel.payment_success_rate}%`);
  console.log(`   - AMC Coverage Penetration: ${flywheel.amc_penetration_rate}%`);
  console.log(`   - Customer Retention Rate: ${flywheel.retention_rate}%`);
  console.log(`   - Referral Promoter Rate: ${flywheel.referral_rate}%`);
  console.log(`   - Identified Flywheel Weakest Link: "${flywheel.weak_link}"`);
  console.log(`   - weak link recovery opportunity: "${flywheel.opportunity_description}"`);

  // 7. War Room Trigger Evaluation
  console.log("\n----------------------------------------------------------");
  console.log("🔍 MODULE 7: REVENUE WAR ROOM TRIGGERS");
  console.log("----------------------------------------------------------");
  const warRoom = await evaluateRevenueWarRoom();
  console.log(`   - War Room Mode Active: ${warRoom.active ? "YES 🔴" : "NO 🟢"}`);
  if (warRoom.active) {
    console.log(`   - Trigger Conditions Met:`);
    warRoom.triggers.forEach(t => console.log(`     * ${t}`));
  }

  console.log("\n==========================================================");
  console.log("   REVENUE INTELLIGENCE TEST COMPLETED");
  console.log("==========================================================");
}

runTest().catch(console.error);
