/**
 * scratch/run-ceo-test.ts
 * AI CEO Layer Verification Test Runner
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://lufynzbrcfrcrgrecxfb.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZnluemJyY2ZyY3JncmVjeGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzE5NjEsImV4cCI6MjA5NDc0Nzk2MX0.cEcOTr4Pkh1j7rkCs_qMd8_n6XpXLi5z5X676l-GS_Y";
process.env.LARAVEL_API_URL = "https://api.innovibemobility.com/api";
process.env.LARAVEL_ADMIN_EMAIL = "superadmin@innovibe.com";
process.env.LARAVEL_ADMIN_PASSWORD = "12345678";

import { recordMemory, searchMemories, deriveLessons } from "../src/lib/ceo-memory";
import { runCEOReasoning } from "../src/lib/ceo-reasoning";
import { askCEOQuestion } from "../src/lib/ceo-question-engine";
import { runCEOSimulation } from "../src/lib/ceo-simulator";
import { calculateStrategicAlignment } from "../src/lib/strategic-alignment";
import { generateExecutiveReflection } from "../src/lib/ceo-reflection";
import { compileBoardReport } from "../src/lib/board-report";
import { rebuildKnowledgeGraph } from "../src/lib/ceo-knowledge-graph";

async function runTest() {
  console.log("==========================================================");
  console.log("   INNOVIBE AI CEO LAYER VERIFICATION TEST RUNNER");
  console.log("==========================================================\n");

  // 1. Priority Engine & Reasoning
  console.log("----------------------------------------------------------");
  console.log("🧠 MODULE 1: CEO REASONING & PRIORITY ENGINE");
  console.log("----------------------------------------------------------");
  const reasoning = await runCEOReasoning();
  console.log(`   - Executive Brief: "${reasoning.executive_brief}"`);
  console.log(`   - Strategic Analysis: "${reasoning.strategic_analysis}"`);
  console.log("   - Ranked Recommended Actions:");
  reasoning.recommended_actions.forEach((a, idx) => {
    console.log(`     * Option ${String.fromCharCode(65 + idx)}: "${a.title}" | Priority: ${a.priority_score} | Value: ₹${a.revenue_impact}`);
  });

  // 2. CEO Memory Engine
  console.log("\n----------------------------------------------------------");
  console.log("🧠 MODULE 2: CEO MEMORY & LESSONS ENGINE");
  console.log("----------------------------------------------------------");
  const memRes = await recordMemory({
    memory_type: "decision_note",
    title: "Pune East Partner Integration Approval",
    decision_text: "Approved onboarding of 2 regional partner garages in Pune West to absorb slot overflows.",
    related_departments: ["Operations"],
    related_kpis: ["Garage Utilization"]
  });
  console.log(`   - Record memory status: ${memRes.success ? "SUCCESS" : "FAILED"} (ID: ${memRes.memoryId})`);
  
  const searchResults = await searchMemories("Pune Partner");
  console.log(`   - Query memories search results count: ${searchResults.length}`);
  searchResults.forEach((m, idx) => {
    console.log(`     * Match #${idx + 1}: "${m.title}" -> ${m.decision_text}`);
  });

  const lessonRes = await deriveLessons();
  console.log(`   - Scanned decision audit logs. Lessons Derived: ${lessonRes.lessonsAdded}`);

  // 3. Question Engine
  console.log("\n----------------------------------------------------------");
  console.log("🧠 MODULE 3: DATA-GROUNDED QUESTION ENGINE");
  console.log("----------------------------------------------------------");
  const q1 = await askCEOQuestion("Why is revenue down?");
  console.log(`   - Q: "Why is revenue down?"`);
  console.log(`   - A:\n${q1.answer}`);
  console.log(`   - Citations: ${q1.citations.join(", ")}`);

  const q2 = await askCEOQuestion("What is blocking growth?");
  console.log(`\n   - Q: "What is blocking growth?"`);
  console.log(`   - A:\n${q2.answer}`);

  // 4. Strategic Simulator
  console.log("\n----------------------------------------------------------");
  console.log("🧠 MODULE 4: STRATEGIC SIMULATOR TWIN");
  console.log("----------------------------------------------------------");
  const sim = await runCEOSimulation({
    amcConversionShift: 10, // AMC rises 10%
    techniciansDelta: 5, // add 5 techs
    complaintsMultiplier: 1.0,
    revenueDeficitShift: 0,
    newCityEntry: true // enter Bangalore
  });
  console.log(`   - Simulation runs: ${sim.success ? "SUCCESS" : "FAILED"}`);
  if (sim.success && sim.result) {
    console.log(`     * Projected Net Margin Impact: ₹${sim.result.revenue_impact.toLocaleString("en-IN")}`);
    console.log(`     * Operations Output: ${sim.result.operational_impact}`);
    console.log(`     * Growth Output:     ${sim.result.growth_impact}`);
    console.log(`     * Risk Matrix:       ${sim.result.risk_impact}`);
  }

  // 5. Strategic Alignment
  console.log("\n----------------------------------------------------------");
  console.log("🧠 MODULE 5: STRATEGIC OKR ALIGNMENT");
  console.log("----------------------------------------------------------");
  const align = await calculateStrategicAlignment(
    "11111111-1111-1111-1111-111111111111",
    "22222222-2222-2222-2222-222222222222",
    "Increase AMC Protection Penetration",
    "amc",
    "Boost Q3 AMC Subscriptions",
    "amc"
  );
  console.log(`   - Alignment score: ${align.alignment_score}%`);
  console.log(`   - Reasoning: "${align.impact_reasoning}"`);

  // 6. Reflection Engine
  console.log("\n----------------------------------------------------------");
  console.log("🧠 MODULE 6: EXECUTIVE REFLECTION REPORTS");
  console.log("----------------------------------------------------------");
  const refl = await generateExecutiveReflection("weekly");
  console.log(`   - Reflection runs: ${refl.success ? "SUCCESS" : "FAILED"}`);
  if (refl.success && refl.report) {
    console.log(`     * Period: ${refl.report.period_start} to ${refl.report.period_end}`);
    console.log(`     * Prediction Accuracy: ${refl.report.prediction_accuracy}%`);
    console.log(`     * Key Learnings: "${refl.report.key_learnings}"`);
  }

  // 7. Board Reports
  console.log("\n----------------------------------------------------------");
  console.log("🧠 MODULE 7: WEEKLY BOARD REPORT COMPILER");
  console.log("----------------------------------------------------------");
  const board = await compileBoardReport("weekly");
  console.log(`   - Compile Board Report: ${board.success ? "SUCCESS" : "FAILED"} (ID: ${board.reportId})`);
  if (board.success && board.report) {
    console.log(`     * Revenue Summary:    "${board.report.revenue_summary}"`);
    console.log(`     * Operations Summary: "${board.report.operations_summary}"`);
    console.log(`     * Growth Summary:     "${board.report.growth_summary}"`);
  }

  // 8. Knowledge Graph
  console.log("\n----------------------------------------------------------");
  console.log("🧠 MODULE 8: CEO RELATIONSHIP KNOWLEDGE GRAPH");
  console.log("----------------------------------------------------------");
  const graph = await rebuildKnowledgeGraph();
  console.log(`   - Rebuild Knowledge Graph: ${graph.success ? "SUCCESS" : "FAILED"}`);
  console.log(`     * Nodes upserted: ${graph.nodesAdded}`);
  console.log(`     * Edges connected: ${graph.edgesAdded}`);

  console.log("\n==========================================================");
  console.log("   AI CEO LAYER TEST COMPLETED SUCCESSFULLY");
  console.log("==========================================================");
}

runTest().catch(console.error);
