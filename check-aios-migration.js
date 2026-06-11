#!/usr/bin/env node
/**
 * check-aios-migration.js
 * Verification script to confirm the new tables have been applied to Supabase.
 *
 * Usage: node check-aios-migration.js
 */

const SUPABASE_URL = "https://lufynzbrcfrcrgrecxfb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZnluemJyY2ZyY3JncmVjeGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzE5NjEsImV4cCI6MjA5NDc0Nzk2MX0.cEcOTr4Pkh1j7rkCs_qMd8_n6XpXLi5z5X676l-GS_Y";

const TABLES = [
  "user_roles",
  "events",
  "activity_feed",
  "automation_rules",
  "automation_executions",
  "automation_logs",
  "settings_store",
  "ai_conversations",
  "ai_actions",
  "notifications",
  "vehicles_telemetry",
  "vehicle_health",
  "device_alerts",
  "knowledge_base_articles",
  "investor_metrics",
  "company_metrics",
  "decision_recommendations",
  "strategy_opportunities",
  "tasks",
  "task_assignments",
  "task_comments",
  "okr_cycles",
  "goals",
  "goal_metrics",
  "ai_action_templates",
  "ai_execution_history",
  "health_score_rules",
  "failed_sync_records",
  "failed_events",
  "kpi_registry",
  "daily_briefings",
  "report_templates",
  "report_snapshots",
  "executive_notes",
  "board_decisions",
  "strategic_decisions",
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
  "decision_audit_trail",
  "customer_revenue_profiles",
  "revenue_leakage_detections",
  "revenue_forecast_snapshots",
  "revenue_attribution_metrics",
  "revenue_flywheel_snapshots",
  "ceo_memory",
  "ceo_memory_embeddings",
  "ceo_memory_links",
  "ceo_lessons",
  "ceo_reasoning_sessions",
  "ceo_reasoning_outputs",
  "ceo_questions",
  "ceo_answers",
  "ceo_decision_scores",
  "strategic_initiatives",
  "initiative_tracking",
  "initiative_forecasts",
  "board_reports",
  "board_report_snapshots",
  "ceo_simulations",
  "ceo_simulation_results",
  "ceo_knowledge_graph_nodes",
  "ceo_knowledge_graph_edges",
  "ceo_reflections",
  "ceo_reflection_sessions",
  "strategic_alignment_scores",
  "goal_probability_scores",
  "goal_risk_alerts",
  "goal_recovery_plans",
  "executive_escalations",
  "escalation_actions",
  "budget_allocations",
  "investment_recommendations",
  "learning_patterns",
  "learning_models",
  "recommendation_accuracy",
  "forecast_accuracy",
  "simulation_accuracy",
  "self_improvement_logs",
  "ceo_autonomy_policies",
  "ceo_constitution",
  "decision_replay_sessions",
  "execution_commitments",
  "execution_tasks",
  "execution_blockers",
  "execution_dependencies",
  "execution_health_snapshots",
  "department_coordination",
  "execution_probability_scores",
  "value_realization",
  "initiative_portfolios",
  "portfolio_allocations",
  // EOS Completion Layer (Phase 6.2)
  "knowledge_nodes",
  "knowledge_edges",
  "strategic_horizons"
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
  console.log("🔍 Checking AIOS foundation tables on Supabase...");
  
  const results = await Promise.all(TABLES.map(checkTable));
  const active = results.filter(r => r.exists);
  const missing = results.filter(r => !r.exists);

  console.log(`\n📊 Status: ${active.length} / ${TABLES.length} tables verified.`);

  if (missing.length === 0) {
    console.log("✅ All new tables exist! Migration successfully completed.");
  } else {
    console.log("❌ The following tables are missing or failed validation:");
    missing.forEach(m => {
      console.log(`   - ${m.table} (${m.error})`);
    });
    console.log("\n📋 Action Needed:");
    console.log("   1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/lufynzbrcfrcrgrecxfb/sql/new");
    console.log("   2. Copy the contents of: supabase/migrations/003_aios_master_evolution.sql");
    console.log("   3. Run the SQL script, then re-run this validation script.");
  }
}

main().catch(console.error);
