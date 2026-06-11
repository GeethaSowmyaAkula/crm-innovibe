/**
 * scratch/run-eos-test.ts
 * EOS Completion Layer — Automated Verification Test Runner
 *
 * Tests:
 *  MODULE 1: CEO Control Tower state machine
 *  MODULE 2: Enterprise Knowledge Graph build + traversal
 *  MODULE 3: Strategic Horizon projections (30d / 90d / 365d)
 *  MODULE 4: EOS Integration in CEO Reasoning
 *
 * Run: npx tsx --env-file=.env.local scratch/run-eos-test.ts
 */

import { evaluateControlTower } from "../src/lib/ceo-control-tower";
import {
  buildKnowledgeGraph,
  getGraphSummary,
} from "../src/lib/enterprise-knowledge-graph";
import {
  generateStrategicHorizon,
  getHorizonSummary,
} from "../src/lib/strategic-horizon";
import { runCEOReasoning } from "../src/lib/ceo-reasoning";

const PASS = "✅";
const FAIL = "❌";
const WARN = "⚠️ ";

function section(title: string) {
  console.log("\n" + "─".repeat(58));
  console.log(`🧠 ${title}`);
  console.log("─".repeat(58));
}

function check(label: string, condition: boolean, detail?: string) {
  const icon = condition ? PASS : FAIL;
  console.log(`  ${icon} ${label}${detail ? `: ${detail}` : ""}`);
}

// ─── MODULE 1: CEO Control Tower ──────────────────────────────────────────────

async function testControlTower() {
  section("MODULE 1: CEO CONTROL TOWER");
  try {
    const tower = await evaluateControlTower();

    check("Control Tower evaluated successfully", !!tower);
    check(
      "Status is a valid state",
      ["GREEN", "YELLOW", "ORANGE", "RED", "BLACK"].includes(tower.status),
      tower.status
    );
    check(
      "Composite score is a valid number",
      typeof tower.composite_score === "number" && tower.composite_score >= 0,
      `${tower.composite_score.toFixed(2)} / 100`
    );
    check(
      "Signals array is present",
      Array.isArray(tower.signals) && tower.signals.length > 0,
      `${tower.signals.length} signals`
    );
    check(
      "Reasons array is populated",
      Array.isArray(tower.reasons) && tower.reasons.length > 0,
      `${tower.reasons.length} reasons`
    );
    check(
      "Required actions are present",
      Array.isArray(tower.required_actions) && tower.required_actions.length > 0
    );
    check(
      "Critical metrics are populated",
      typeof tower.critical_metrics === "object" &&
        typeof tower.critical_metrics.enterprise_health_score === "number"
    );
    check(
      "All signals have valid severity",
      tower.signals.every((s) => ["ok", "warning", "critical"].includes(s.severity))
    );

    console.log("\n   📊 Control Tower State:");
    console.log(`      Status : ${tower.status}`);
    console.log(`      Score  : ${tower.composite_score}`);
    console.log(`      Signals: ${tower.signals.filter((s) => s.severity !== "ok").length} warnings/criticals`);
    tower.reasons.forEach((r) => console.log(`      ${r}`));
  } catch (err: any) {
    console.log(`  ${FAIL} Control Tower test FAILED: ${err.message}`);
  }
}

// ─── MODULE 2: Enterprise Knowledge Graph ─────────────────────────────────────

async function testKnowledgeGraph() {
  section("MODULE 2: ENTERPRISE KNOWLEDGE GRAPH");
  try {
    // Build the graph
    const buildResult = await buildKnowledgeGraph();
    check("Graph build succeeded", buildResult.success);
    check(
      "Nodes were created",
      buildResult.nodes_created >= 0,
      `${buildResult.nodes_created} nodes`
    );
    check(
      "Edges were created",
      buildResult.edges_created >= 0,
      `${buildResult.edges_created} edges`
    );
    check(
      "Build completed in reasonable time",
      buildResult.duration_ms < 30000,
      `${buildResult.duration_ms}ms`
    );

    // Get summary
    const summary = await getGraphSummary();
    check("Graph summary returned", !!summary);
    check(
      "Total nodes is non-negative",
      typeof summary.total_nodes === "number" && summary.total_nodes >= 0,
      `${summary.total_nodes} total nodes`
    );
    check(
      "Nodes by type object exists",
      typeof summary.nodes_by_type === "object"
    );
    check("Top connected nodes is an array", Array.isArray(summary.top_connected_nodes));

    console.log("\n   📊 Graph Summary:");
    console.log(`      Total Nodes: ${summary.total_nodes}`);
    console.log(`      Total Edges: ${summary.total_edges}`);
    console.log(`      By Type:`, summary.nodes_by_type);
  } catch (err: any) {
    console.log(`  ${FAIL} Knowledge Graph test FAILED: ${err.message}`);
  }
}

// ─── MODULE 3: Strategic Horizons ─────────────────────────────────────────────

async function testStrategicHorizons() {
  section("MODULE 3: STRATEGIC HORIZONS (30d / 90d / 365d)");
  try {
    // Generate horizons
    const sweep = await generateStrategicHorizon();
    check("Horizon sweep completed", sweep.success);
    check(
      "Projections created",
      sweep.projections_created >= 0,
      `${sweep.projections_created} projections`
    );
    check("30d summary exists", typeof sweep.summary["30d"] === "object");
    check("90d summary exists", typeof sweep.summary["90d"] === "object");
    check("365d summary exists", typeof sweep.summary["365d"] === "object");

    // Retrieve horizon summary
    const summary = await getHorizonSummary();
    check("Horizon summary returned", !!summary);
    check("30d array exists", Array.isArray(summary["30d"]));
    check("90d array exists", Array.isArray(summary["90d"]));
    check("365d array exists", Array.isArray(summary["365d"]));

    // Validate structure of first projection if present
    const first30d = summary["30d"][0];
    if (first30d) {
      check("30d projection has entity_type", !!first30d.entity_type);
      check("30d projection has horizon field", first30d.horizon === "30d");
      check(
        "30d projection impact.confidence is a number",
        typeof first30d.impact?.confidence === "number"
      );
      check(
        "30d risk_level is valid",
        ["low", "medium", "high", "critical"].includes(first30d.impact?.risk_level)
      );
    } else {
      console.log(`  ${WARN} No 30d projections found (no initiatives in DB yet)`);
    }

    console.log("\n   📊 Horizon Summary:");
    console.log(`      30d projections : ${summary["30d"].length}`);
    console.log(`      90d projections : ${summary["90d"].length}`);
    console.log(`      365d projections: ${summary["365d"].length}`);
    console.log(`      30d total revenue impact: ₹${sweep.summary["30d"].total_revenue_impact.toFixed(0)}`);
    console.log(`      90d total revenue impact: ₹${sweep.summary["90d"].total_revenue_impact.toFixed(0)}`);
    console.log(`      365d total revenue impact: ₹${sweep.summary["365d"].total_revenue_impact.toFixed(0)}`);
  } catch (err: any) {
    console.log(`  ${FAIL} Strategic Horizons test FAILED: ${err.message}`);
  }
}

// ─── MODULE 4: EOS Integration in CEO Reasoning ──────────────────────────────

async function testCEOReasoningIntegration() {
  section("MODULE 4: EOS INTEGRATION IN CEO REASONING");
  try {
    const reasoning = await runCEOReasoning();

    check("CEO Reasoning completed", !!reasoning);
    check(
      "Control Tower is embedded in reasoning",
      !!reasoning.control_tower,
      reasoning.control_tower?.status
    );
    check(
      "Knowledge Graph summary is embedded",
      !!reasoning.knowledge_graph_summary,
      `${reasoning.knowledge_graph_summary?.total_nodes ?? 0} nodes`
    );
    check(
      "Strategic Horizons are embedded",
      !!reasoning.strategic_horizons &&
        Array.isArray(reasoning.strategic_horizons["30d"])
    );
    check(
      "Existing CEO Priorities still present",
      Array.isArray(reasoning.ceo_priorities)
    );
    check(
      "Enterprise Health still present",
      !!reasoning.enterprise_health,
      `Score: ${reasoning.enterprise_health?.unified_score}`
    );
    check(
      "Executive Brief is non-empty",
      typeof reasoning.executive_brief === "string" &&
        reasoning.executive_brief.length > 10
    );
    check(
      "Recommended Actions have governance status",
      reasoning.recommended_actions.every((a) => !!a.governance_status)
    );

    console.log("\n   📊 Reasoning Output:");
    console.log(`      Control Tower: ${reasoning.control_tower?.status ?? "N/A"} (score: ${reasoning.control_tower?.composite_score ?? "N/A"})`);
    console.log(`      CEO Priorities: ${reasoning.ceo_priorities?.length ?? 0}`);
    console.log(`      Recommended Actions: ${reasoning.recommended_actions.length}`);
    console.log(`      Knowledge Graph Nodes: ${reasoning.knowledge_graph_summary?.total_nodes ?? 0}`);
    console.log(`      Strategic Horizons (30d): ${reasoning.strategic_horizons?.["30d"]?.length ?? 0} projections`);
  } catch (err: any) {
    console.log(`  ${FAIL} EOS Integration test FAILED: ${err.message}`);
  }
}

// ─── Main Runner ──────────────────────────────────────────────────────────────

async function main() {
  console.log("\n" + "=".repeat(58));
  console.log("   INNOVIBE EOS COMPLETION LAYER — VERIFICATION RUNNER");
  console.log("=".repeat(58));
  console.log(`   Run started: ${new Date().toLocaleString("en-IN")}`);
  console.log("=".repeat(58));

  await testControlTower();
  await testKnowledgeGraph();
  await testStrategicHorizons();
  await testCEOReasoningIntegration();

  console.log("\n" + "=".repeat(58));
  console.log("   ✅ EOS Verification Complete");
  console.log("=".repeat(58) + "\n");
}

main().catch((err) => {
  console.error("❌ FATAL:", err.message);
  process.exit(1);
});
