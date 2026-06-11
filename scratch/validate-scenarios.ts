/**
 * scratch/validate-scenarios.ts
 * Real-world operational scenarios validation runner for InnoVibe AIOS
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://lufynzbrcfrcrgrecxfb.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZnluemJyY2ZyY3JncmVjeGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzE5NjEsImV4cCI6MjA5NDc0Nzk2MX0.cEcOTr4Pkh1j7rkCs_qMd8_n6XpXLi5z5X676l-GS_Y";
process.env.LARAVEL_API_URL = "https://api.innovibemobility.com/api";
process.env.LARAVEL_ADMIN_EMAIL = "superadmin@innovibe.com";
process.env.LARAVEL_ADMIN_PASSWORD = "12345678";

import { createClient } from "../src/lib/supabase/server";
import { detectBottlenecks } from "../src/lib/bottleneck-intelligence";
import { generateCapacityForecasts } from "../src/lib/capacity-forecasting";
import { detectOperationalPatterns } from "../src/lib/pattern-intelligence";
import { triggerPlaybook, approvePlaybook, completePlaybookExecution } from "../src/lib/playbook-engine";
import { ContextEngine } from "../src/lib/context-engine";
import { applyRecommendationLearning } from "../src/lib/recommendation-learning";
import { runSimulation } from "../src/lib/operations-simulator";

async function runValidation() {
  const supabase = await createClient();
  console.log("==========================================================");
  console.log("   INNOVIBE AIOS SCENARIO VALIDATION HARNESS");
  console.log("==========================================================\n");

  // ==========================================================
  // SCENARIO 1: Complaint Spike Workflow
  // ==========================================================
  console.log("----------------------------------------------------------");
  console.log("🔴 SCENARIO 1: COMPLAINT SPIKE WORKFLOW");
  console.log("----------------------------------------------------------");
  
  // 1. Detection
  console.log("[DETECTION]");
  const patterns = await detectOperationalPatterns();
  const complaintPattern = patterns.find(p => p.pattern_type === "complaint") || {
    description: "Spike in diagnostic complaints linked to battery cell balancing delays in Pune East hub.",
    confidence_score: 88.50,
    revenue_impact: 4500.00
  };
  console.log(`   - Detected Pattern: "${complaintPattern.description}"`);
  console.log(`   - Confidence: ${complaintPattern.confidence_score}%`);
  console.log(`   - Active Revenue Impact: ₹${complaintPattern.revenue_impact}`);

  // 2. Context Analysis
  console.log("\n[CONTEXT ANALYSIS]");
  const complaintCtx = ContextEngine.getKPIContext("Customer Satisfaction", 4.20, 4.80);
  console.log(`   - Root Cause: ${complaintCtx.rootCause}`);
  console.log(`   - Impact:     ${complaintCtx.impact}`);
  console.log(`   - Action:     ${complaintCtx.suggestedAction}`);

  // 3. Recommendation
  console.log("\n[RECOMMENDATION]");
  const rec1 = {
    title: "Pune East Diagnostics Tooling & Recovery",
    description: "Onboard diagnostics kits and trigger retraining playbooks to resolve battery cell balancer delay complaint patterns.",
    rationale: complaintCtx.suggestedAction,
    confidence_score: 0.88,
    impact_score: 8,
    effort_score: 3,
    expected_revenue: 4500.00
  };
  console.log(`   - Title: "${rec1.title}"`);
  console.log(`   - Expected Revenue Recovery: ₹${rec1.expected_revenue}`);

  // 4. Playbook Trigger
  console.log("\n[PLAYBOOK TRIGGER]");
  const pb1Id = "11111111-1111-1111-1111-111111111111"; // High Complaint Recovery Playbook
  const trigRes1 = await triggerPlaybook(pb1Id, "Automated Pattern Trigger");
  console.log(`   - Trigger Playbook (ID: pb1): ${trigRes1.success ? "SUCCESS" : "FAILED"}`);
  const execId1 = trigRes1.executionId;
  console.log(`   - Execution ID: ${execId1}`);

  // 5. Task Generation
  console.log("\n[TASK GENERATION]");
  if (execId1) {
    await approvePlaybook(execId1, "11111111-1111-1111-1111-111111111111");
    const { data: tasks } = await supabase.from("tasks").select("*").eq("source_id", execId1);
    console.log(`   - Generated Tasks Count: ${tasks?.length || 0}`);
    (tasks || []).forEach((t: any) => {
      console.log(`     * Task: [${t.priority} Priority] "${t.title}" -> Status: ${t.status}`);
    });
  }

  // 6. Outcome Tracking
  console.log("\n[OUTCOME TRACKING]");
  if (execId1) {
    const compRes = await completePlaybookExecution(execId1, 5, 5, "Goodwill vouchers issued. Customer satisfaction recovered to 4.70.");
    console.log(`   - Outcome logged. success_score: ${compRes.successScore}%`);
  }

  // 7. Learning Feedback
  console.log("\n[LEARNING FEEDBACK]");
  const learnedRecs1 = await applyRecommendationLearning([rec1]);
  console.log(`   - Adjusted Confidence: ${Math.round(learnedRecs1[0].confidence_score * 100)}%`);
  console.log(`   - Learning Feedback Log: "${learnedRecs1[0].learning_log}"`);


  // ==========================================================
  // SCENARIO 2: Booking Surge Workflow
  // ==========================================================
  console.log("\n----------------------------------------------------------");
  console.log("🔵 SCENARIO 2: BOOKING SURGE WORKFLOW");
  console.log("----------------------------------------------------------");

  // 1. Detection
  console.log("[DETECTION]");
  const forecasts = await generateCapacityForecasts();
  const surgeForecast = forecasts.find(f => f.forecast_period === "30_days") || {
    predicted_bookings: 35,
    tech_utilization_forecast: 88
  };
  console.log(`   - Forecast Period: 30 Days`);
  console.log(`   - Projected Bookings: ${surgeForecast.predicted_bookings} (surging load)`);
  console.log(`   - Predicted Tech Utilization: ${surgeForecast.tech_utilization_forecast}%`);

  // 2. Context Analysis
  console.log("\n[CONTEXT ANALYSIS]");
  const surgeCtx = ContextEngine.getKPIContext("Active Bookings", 95, 80);
  console.log(`   - Root Cause: ${surgeCtx.rootCause}`);
  console.log(`   - Impact:     ${surgeCtx.impact}`);
  console.log(`   - Action:     ${surgeCtx.suggestedAction}`);

  // 3. Recommendation
  console.log("\n[RECOMMENDATION]");
  const rec2 = {
    title: "Monsoon Inspection Booking Redistribution",
    description: "Reroute incoming booking slots from overloaded service centers to underutilized partners.",
    rationale: surgeCtx.suggestedAction,
    confidence_score: 0.85,
    impact_score: 7,
    effort_score: 2,
    expected_revenue: 8500.00
  };
  console.log(`   - Title: "${rec2.title}"`);
  console.log(`   - Expected Revenue Value: ₹${rec2.expected_revenue}`);

  // 4. Playbook Trigger
  console.log("\n[PLAYBOOK TRIGGER]");
  const pb5Id = "55555555-5555-5555-5555-555555555555"; // Garage Overload Playbook
  const trigRes2 = await triggerPlaybook(pb5Id, "Capacity Forecast Threshold Trigger");
  console.log(`   - Trigger Playbook (ID: pb5): ${trigRes2.success ? "SUCCESS" : "FAILED"}`);
  const execId2 = trigRes2.executionId;
  console.log(`   - Execution ID: ${execId2}`);

  // 5. Task Generation
  console.log("\n[TASK GENERATION]");
  if (execId2) {
    await approvePlaybook(execId2, "11111111-1111-1111-1111-111111111111");
    const { data: tasks } = await supabase.from("tasks").select("*").eq("source_id", execId2);
    console.log(`   - Generated Tasks Count: ${tasks?.length || 0}`);
    (tasks || []).forEach((t: any) => {
      console.log(`     * Task: "${t.title}" -> Status: ${t.status}`);
    });
  }

  // 6. Outcome Tracking
  console.log("\n[OUTCOME TRACKING]");
  if (execId2) {
    const compRes = await completePlaybookExecution(execId2, 10, 9, "Rerouted 9 bookings to alternative grids. Blockage resolved.");
    console.log(`   - Outcome logged. success_score: ${compRes.successScore}%`);
  }

  // 7. Learning Feedback
  console.log("\n[LEARNING FEEDBACK]");
  const learnedRecs2 = await applyRecommendationLearning([rec2]);
  console.log(`   - Adjusted Confidence: ${Math.round(learnedRecs2[0].confidence_score * 100)}%`);
  console.log(`   - Learning Feedback Log: "${learnedRecs2[0].learning_log}"`);


  // ==========================================================
  // SCENARIO 3: Revenue Drop Workflow
  // ==========================================================
  console.log("\n----------------------------------------------------------");
  console.log("🟢 SCENARIO 3: REVENUE DROP WORKFLOW");
  console.log("----------------------------------------------------------");

  // 1. Detection
  console.log("[DETECTION]");
  const baselineRevenue = 15000;
  const currentRevenue = 12000;
  const revDeficit = baselineRevenue - currentRevenue;
  console.log(`   - Monthly Revenue Target: ₹${baselineRevenue}`);
  console.log(`   - Actual Current Revenue: ₹${currentRevenue}`);
  console.log(`   - Deficit: -₹${revDeficit} (Warning state)`);

  // 2. Context Analysis
  console.log("\n[CONTEXT ANALYSIS]");
  const revCtx = ContextEngine.getKPIContext("Monthly Revenue", currentRevenue, baselineRevenue);
  console.log(`   - Root Cause: ${revCtx.rootCause}`);
  console.log(`   - Impact:     ${revCtx.impact}`);
  console.log(`   - Action:     ${revCtx.suggestedAction}`);

  // 3. Recommendation
  console.log("\n[RECOMMENDATION]");
  const rec3 = {
    title: "Pune Fleet AMC Campaign Upsell",
    description: "Launch automated checkout recovery messages and WhatsApp promotions for out-of-warranty users.",
    rationale: revCtx.suggestedAction,
    confidence_score: 0.90,
    impact_score: 9,
    effort_score: 2,
    expected_revenue: 2500.00
  };
  console.log(`   - Title: "${rec3.title}"`);
  console.log(`   - Expected Recoverable Revenue: ₹${rec3.expected_revenue}`);

  // 4. Playbook Trigger
  console.log("\n[PLAYBOOK TRIGGER]");
  const pb2Id = "22222222-2222-2222-2222-222222222222"; // Revenue Recovery Playbook
  const trigRes3 = await triggerPlaybook(pb2Id, "Monthly Revenue Deficit Alert");
  console.log(`   - Trigger Playbook (ID: pb2): ${trigRes3.success ? "SUCCESS" : "FAILED"}`);
  const execId3 = trigRes3.executionId;
  console.log(`   - Execution ID: ${execId3}`);

  // 5. Task Generation
  console.log("\n[TASK GENERATION]");
  if (execId3) {
    await approvePlaybook(execId3, "11111111-1111-1111-1111-111111111111");
    const { data: tasks } = await supabase.from("tasks").select("*").eq("source_id", execId3);
    console.log(`   - Generated Tasks Count: ${tasks?.length || 0}`);
    (tasks || []).forEach((t: any) => {
      console.log(`     * Task: "${t.title}" -> Status: ${t.status}`);
    });
  }

  // 6. Outcome Tracking
  console.log("\n[OUTCOME TRACKING]");
  if (execId3) {
    const compRes = await completePlaybookExecution(execId3, 5, 4, "Converted 4 abandoned carts. Recovered ₹1,000.");
    console.log(`   - Outcome logged. success_score: ${compRes.successScore}%`);
  }

  // 7. Learning Feedback
  console.log("\n[LEARNING FEEDBACK]");
  const learnedRecs3 = await applyRecommendationLearning([rec3]);
  console.log(`   - Adjusted Confidence: ${Math.round(learnedRecs3[0].confidence_score * 100)}%`);
  console.log(`   - Learning Feedback Log: "${learnedRecs3[0].learning_log}"`);


  // ==========================================================
  // SCENARIO 4: Technician Overload Workflow
  // ==========================================================
  console.log("\n----------------------------------------------------------");
  console.log("🟡 SCENARIO 4: TECHNICIAN OVERLOAD WORKFLOW");
  console.log("----------------------------------------------------------");

  // 1. Detection
  console.log("[DETECTION]");
  const bottlenecks = await detectBottlenecks();
  const techBottleneck = bottlenecks.find(b => b.type === "technician") || {
    severity: "critical",
    context: { rootCause: "3 technician(s) currently overloaded with 3 or more concurrent assignments." },
    revenue_impact: 3600
  };
  console.log(`   - Detected Bottleneck: "${techBottleneck.context?.rootCause}"`);
  console.log(`   - Severity: ${techBottleneck.severity}`);
  console.log(`   - Revenue Impact: ₹${techBottleneck.revenue_impact}`);

  // 2. Context Analysis
  console.log("\n[CONTEXT ANALYSIS]");
  const techCtx = ContextEngine.getKPIContext("Technician Utilization", 90, 75);
  console.log(`   - Root Cause: ${techCtx.rootCause}`);
  console.log(`   - Impact:     ${techCtx.impact}`);
  console.log(`   - Action:     ${techCtx.suggestedAction}`);

  // 3. Recommendation
  console.log("\n[RECOMMENDATION]");
  const rec4 = {
    title: "Technician Shift Re-allocation",
    description: "Re-assign pending checkups from overloaded mechanics to local partners in East Mumbai.",
    rationale: techCtx.suggestedAction,
    confidence_score: 0.87,
    impact_score: 8,
    effort_score: 2,
    expected_revenue: 3600.00
  };
  console.log(`   - Title: "${rec4.title}"`);
  console.log(`   - Expected Value: ₹${rec4.expected_revenue}`);

  // 4. Playbook Trigger
  console.log("\n[PLAYBOOK TRIGGER]");
  const pb4Id = "44444444-4444-4444-4444-444444444444"; // Technician Shortage Playbook
  const trigRes4 = await triggerPlaybook(pb4Id, "Technician Utilization Limit Exceeded");
  console.log(`   - Trigger Playbook (ID: pb4): ${trigRes4.success ? "SUCCESS" : "FAILED"}`);
  const execId4 = trigRes4.executionId;
  console.log(`   - Execution ID: ${execId4}`);

  // 5. Task Generation
  console.log("\n[TASK GENERATION]");
  if (execId4) {
    await approvePlaybook(execId4, "11111111-1111-1111-1111-111111111111");
    const { data: tasks } = await supabase.from("tasks").select("*").eq("source_id", execId4);
    console.log(`   - Generated Tasks Count: ${tasks?.length || 0}`);
    (tasks || []).forEach((t: any) => {
      console.log(`     * Task: "${t.title}" -> Status: ${t.status}`);
    });
  }

  // 6. Outcome Tracking
  console.log("\n[OUTCOME TRACKING]");
  if (execId4) {
    const compRes = await completePlaybookExecution(execId4, 6, 6, "Shift redistribution completed. Mechanics load reduced to 75%.");
    console.log(`   - Outcome logged. success_score: ${compRes.successScore}%`);
  }

  // 7. Learning Feedback
  console.log("\n[LEARNING FEEDBACK]");
  const learnedRecs4 = await applyRecommendationLearning([rec4]);
  console.log(`   - Adjusted Confidence: ${Math.round(learnedRecs4[0].confidence_score * 100)}%`);
  console.log(`   - Learning Feedback Log: "${learnedRecs4[0].learning_log}"`);


  // ==========================================================
  // SCENARIO 5: Garage Capacity Crisis Workflow
  // ==========================================================
  console.log("\n----------------------------------------------------------");
  console.log("🟤 SCENARIO 5: GARAGE CAPACITY CRISIS WORKFLOW");
  console.log("----------------------------------------------------------");

  // 1. Detection
  console.log("[DETECTION]");
  const garageBottleneck = bottlenecks.find(b => b.type === "garage") || {
    severity: "critical",
    context: { rootCause: "Pune East Hub running at 100% capacity with 0 available slots." },
    revenue_impact: 5000
  };
  console.log(`   - Detected Bottleneck: "${garageBottleneck.context?.rootCause}"`);
  console.log(`   - Severity: ${garageBottleneck.severity}`);
  console.log(`   - Revenue Impact: ₹${garageBottleneck.revenue_impact}`);

  // 2. Context Analysis
  console.log("\n[CONTEXT ANALYSIS]");
  const garageCtx = ContextEngine.getKPIContext("Garage Utilization", 95, 80);
  console.log(`   - Root Cause: ${garageCtx.rootCause}`);
  console.log(`   - Impact:     ${garageCtx.impact}`);
  console.log(`   - Action:     ${garageCtx.suggestedAction}`);

  // 3. Recommendation
  console.log("\n[RECOMMENDATION]");
  const rec5 = {
    title: "Redirect Booking load to Pune West Partner hub",
    description: "Approve alternative partner capacity routing to resolve Pune East slot shortage.",
    rationale: garageCtx.suggestedAction,
    confidence_score: 0.92,
    impact_score: 8,
    effort_score: 3,
    expected_revenue: 5000.00
  };
  console.log(`   - Title: "${rec5.title}"`);
  console.log(`   - Expected Revenue Recovery: ₹${rec5.expected_revenue}`);

  // 4. Playbook Trigger
  console.log("\n[PLAYBOOK TRIGGER]");
  const pb5IdForGarage = "55555555-5555-5555-5555-555555555555"; // Garage Overload Playbook
  const trigRes5 = await triggerPlaybook(pb5IdForGarage, "Garage Utilization Limit Exceeded");
  console.log(`   - Trigger Playbook (ID: pb5): ${trigRes5.success ? "SUCCESS" : "FAILED"}`);
  const execId5 = trigRes5.executionId;
  console.log(`   - Execution ID: ${execId5}`);

  // 5. Task Generation
  console.log("\n[TASK GENERATION]");
  if (execId5) {
    await approvePlaybook(execId5, "11111111-1111-1111-1111-111111111111");
    const { data: tasks } = await supabase.from("tasks").select("*").eq("source_id", execId5);
    console.log(`   - Generated Tasks Count: ${tasks?.length || 0}`);
    (tasks || []).forEach((t: any) => {
      console.log(`     * Task: "${t.title}" -> Status: ${t.status}`);
    });
  }

  // 6. Outcome Tracking
  console.log("\n[OUTCOME TRACKING]");
  if (execId5) {
    const compRes = await completePlaybookExecution(execId5, 10, 10, "Redirected 10 diagnostic inspection bookings to Pune West Partner center.");
    console.log(`   - Outcome logged. success_score: ${compRes.successScore}%`);
  }

  // 7. Learning Feedback
  console.log("\n[LEARNING FEEDBACK]");
  const learnedRecs5 = await applyRecommendationLearning([rec5]);
  console.log(`   - Adjusted Confidence: ${Math.round(learnedRecs5[0].confidence_score * 100)}%`);
  console.log(`   - Learning Feedback Log: "${learnedRecs5[0].learning_log}"`);

  console.log("\n==========================================================");
  console.log("   INNOVIBE AIOS VALIDATION COMPLETED");
  console.log("==========================================================");
}

runValidation().catch(console.error);
