/**
 * src/lib/ceo-control-tower.ts
 * CEO Control Tower Engine — InnoVibe AIOS EOS Completion Layer
 *
 * Master Company State Machine.
 * Aggregates all health signals into a single enterprise status color:
 *
 *   GREEN  — All systems optimal          (score >= 88)
 *   YELLOW — Minor warnings detected      (score >= 72)
 *   ORANGE — Multiple warnings, act now   (score >= 58)
 *   RED    — Critical failures, escalate  (score >= 40)
 *   BLACK  — System failure, war-room     (score <  40)
 *
 * Returns: status, reasons[], required_actions[], critical_metrics
 */

import { getEnterpriseHealth, EnterpriseHealthBreakdown } from "@/lib/enterprise-health";
import { calculateExecutionScore, detectStalledInitiatives } from "@/lib/execution-engine";
import { calculateRevenueLeakages } from "@/lib/revenue-intelligence";
import { detectBottlenecks } from "@/lib/bottleneck-intelligence";
import { evaluateAllGoalProbabilities } from "@/lib/goal-probability-engine";
import { checkAndTriggerEscalations } from "@/lib/executive-escalation";

// ─── Types ───────────────────────────────────────────────────────────────────

export type TowerStatus = "GREEN" | "YELLOW" | "ORANGE" | "RED" | "BLACK";

export interface ControlTowerSignal {
  /** Category of the signal */
  category:
    | "Revenue"
    | "Operations"
    | "Execution"
    | "Goals"
    | "Escalations"
    | "Leakage";
  /** Short descriptive label */
  label: string;
  /** Numeric metric value */
  value: number;
  /** Threshold at which this becomes a warning */
  warning_threshold: number;
  /** Threshold at which this becomes critical */
  critical_threshold: number;
  /** Resolved status of the signal */
  severity: "ok" | "warning" | "critical";
}

export interface ControlTowerOutput {
  status: TowerStatus;
  composite_score: number;
  reasons: string[];
  required_actions: string[];
  signals: ControlTowerSignal[];
  critical_metrics: {
    enterprise_health_score: number;
    revenue_health: number;
    operations_health: number;
    execution_health: number;
    goal_achievement: number;
    active_escalations: number;
    stalled_initiatives: number;
    revenue_leakage: number;
    critical_bottlenecks: number;
  };
  evaluated_at: string;
}

// ─── Thresholds ───────────────────────────────────────────────────────────────

const THRESHOLDS = {
  revenue_health:      { warn: 70, crit: 50 },
  operations_health:   { warn: 65, crit: 45 },
  execution_health:    { warn: 75, crit: 55 },
  goal_achievement:    { warn: 60, crit: 40 },
  enterprise_score:    { warn: 72, crit: 58 },
  escalations:         { warn: 2,  crit: 5  },
  stalled_initiatives: { warn: 2,  crit: 4  },
  revenue_leakage_k:   { warn: 20, crit: 50 }, // in thousands
  critical_bottlenecks:{ warn: 1,  crit: 3  },
};

// ─── Status Classifier ────────────────────────────────────────────────────────

function classifyStatus(score: number): TowerStatus {
  if (score >= 88) return "GREEN";
  if (score >= 72) return "YELLOW";
  if (score >= 58) return "ORANGE";
  if (score >= 40) return "RED";
  return "BLACK";
}

function signalSeverity(value: number, warn: number, crit: number): "ok" | "warning" | "critical" {
  // For most metrics, lower is worse
  if (value <= crit) return "critical";
  if (value <= warn) return "warning";
  return "ok";
}

function counterSeverity(value: number, warn: number, crit: number): "ok" | "warning" | "critical" {
  // For counts, higher is worse
  if (value >= crit) return "critical";
  if (value >= warn) return "warning";
  return "ok";
}

// ─── Main Engine ──────────────────────────────────────────────────────────────

/**
 * Evaluates all enterprise health signals and returns the master control tower state.
 */
export async function evaluateControlTower(
  preFetched?: {
    health?: EnterpriseHealthBreakdown;
    execScore?: any;
    stalledRaw?: any[];
    leakages?: any[];
    bottlenecks?: any[];
    goalProbs?: any[];
    escalations?: any[];
  }
): Promise<ControlTowerOutput> {
  // Gather all signals concurrently
  const health = preFetched?.health || await getEnterpriseHealth().catch(
    (): EnterpriseHealthBreakdown => ({
      revenue_health: 80,
      operations_health: 85,
      execution_health: 95,
      goal_achievement: 70,
      trust_index: 89,
      unified_score: 83.9,
      category: "Strong",
    })
  );

  const execScore = preFetched?.execScore || await calculateExecutionScore().catch(() => ({
    execution_score: 95,
    completion_rate: 0,
    blocked_rate: 0,
    overdue_rate: 0,
  }));

  const stalledRaw = preFetched?.stalledRaw || await detectStalledInitiatives().catch(() => []);
  const leakages = preFetched?.leakages || await calculateRevenueLeakages().catch(() => []);
  const bottlenecks = preFetched?.bottlenecks || await detectBottlenecks().catch(() => []);
  const goalProbs = preFetched?.goalProbs || await evaluateAllGoalProbabilities().catch(() => []);
  const escalations = preFetched?.escalations || await checkAndTriggerEscalations().catch(() => []);

  // Derived metrics
  const totalLeakageK = leakages.reduce((s: number, l: any) => s + l.amount, 0) / 1000;
  const criticalBottlenecks = bottlenecks.filter(
    (b: any) => b.severity === "critical"
  ).length;
  const activeEscalations = escalations.length;
  const stalledCount = stalledRaw.length;
  const avgGoalProb =
    goalProbs.length > 0
      ? goalProbs.reduce((s: number, g: any) => s + g.probability_of_success, 0) /
        goalProbs.length
      : 70;

  // Build signals array
  const signals: ControlTowerSignal[] = [
    {
      category: "Revenue",
      label: "Revenue Health Index",
      value: health.revenue_health,
      warning_threshold: THRESHOLDS.revenue_health.warn,
      critical_threshold: THRESHOLDS.revenue_health.crit,
      severity: signalSeverity(health.revenue_health, THRESHOLDS.revenue_health.warn, THRESHOLDS.revenue_health.crit),
    },
    {
      category: "Operations",
      label: "Operations Health Index",
      value: health.operations_health,
      warning_threshold: THRESHOLDS.operations_health.warn,
      critical_threshold: THRESHOLDS.operations_health.crit,
      severity: signalSeverity(health.operations_health, THRESHOLDS.operations_health.warn, THRESHOLDS.operations_health.crit),
    },
    {
      category: "Execution",
      label: "Execution Health Score",
      value: execScore.execution_score,
      warning_threshold: THRESHOLDS.execution_health.warn,
      critical_threshold: THRESHOLDS.execution_health.crit,
      severity: signalSeverity(execScore.execution_score, THRESHOLDS.execution_health.warn, THRESHOLDS.execution_health.crit),
    },
    {
      category: "Goals",
      label: "Average Goal Achievement Probability",
      value: avgGoalProb,
      warning_threshold: THRESHOLDS.goal_achievement.warn,
      critical_threshold: THRESHOLDS.goal_achievement.crit,
      severity: signalSeverity(avgGoalProb, THRESHOLDS.goal_achievement.warn, THRESHOLDS.goal_achievement.crit),
    },
    {
      category: "Escalations",
      label: "Active Escalation Count",
      value: activeEscalations,
      warning_threshold: THRESHOLDS.escalations.warn,
      critical_threshold: THRESHOLDS.escalations.crit,
      severity: counterSeverity(activeEscalations, THRESHOLDS.escalations.warn, THRESHOLDS.escalations.crit),
    },
    {
      category: "Execution",
      label: "Stalled Initiatives",
      value: stalledCount,
      warning_threshold: THRESHOLDS.stalled_initiatives.warn,
      critical_threshold: THRESHOLDS.stalled_initiatives.crit,
      severity: counterSeverity(stalledCount, THRESHOLDS.stalled_initiatives.warn, THRESHOLDS.stalled_initiatives.crit),
    },
    {
      category: "Leakage",
      label: "Revenue Leakage (₹K)",
      value: totalLeakageK,
      warning_threshold: THRESHOLDS.revenue_leakage_k.warn,
      critical_threshold: THRESHOLDS.revenue_leakage_k.crit,
      severity: counterSeverity(totalLeakageK, THRESHOLDS.revenue_leakage_k.warn, THRESHOLDS.revenue_leakage_k.crit),
    },
    {
      category: "Operations",
      label: "Critical Bottlenecks",
      value: criticalBottlenecks,
      warning_threshold: THRESHOLDS.critical_bottlenecks.warn,
      critical_threshold: THRESHOLDS.critical_bottlenecks.crit,
      severity: counterSeverity(criticalBottlenecks, THRESHOLDS.critical_bottlenecks.warn, THRESHOLDS.critical_bottlenecks.crit),
    },
  ];

  // Composite score: penalize warnings and criticals
  const criticalSignals = signals.filter((s) => s.severity === "critical");
  const warningSignals = signals.filter((s) => s.severity === "warning");
  const compositeScore = Math.max(
    0,
    health.unified_score -
      criticalSignals.length * 10 -
      warningSignals.length * 3
  );

  const status = classifyStatus(compositeScore);

  // Build reason strings
  const reasons: string[] = [];
  for (const sig of criticalSignals) {
    reasons.push(`🔴 CRITICAL — ${sig.label}: ${sig.value.toFixed(1)} (threshold: ${sig.critical_threshold})`);
  }
  for (const sig of warningSignals) {
    reasons.push(`🟡 WARNING — ${sig.label}: ${sig.value.toFixed(1)} (threshold: ${sig.warning_threshold})`);
  }
  if (reasons.length === 0) {
    reasons.push("✅ All enterprise systems are operating within optimal parameters.");
  }

  // Build required actions
  const required_actions: string[] = [];
  if (criticalSignals.some((s) => s.category === "Revenue")) {
    required_actions.push("Escalate revenue recovery — activate payment retry and leakage patch SOPs immediately.");
  }
  if (criticalSignals.some((s) => s.category === "Operations")) {
    required_actions.push("Dispatch operations war-room — resolve critical bottlenecks within 24h.");
  }
  if (criticalSignals.some((s) => s.category === "Execution")) {
    required_actions.push("CEO must personally review and unblock stalled strategic commitments.");
  }
  if (criticalSignals.some((s) => s.category === "Leakage")) {
    required_actions.push("Initiate emergency leakage audit — revenue at critical loss threshold.");
  }
  if (activeEscalations >= THRESHOLDS.escalations.crit) {
    required_actions.push("War-room required — 5+ escalations active concurrently.");
  }
  if (required_actions.length === 0) {
    required_actions.push("Continue monitoring. No emergency actions required at this time.");
  }

  return {
    status,
    composite_score: Number(compositeScore.toFixed(2)),
    reasons,
    required_actions,
    signals,
    critical_metrics: {
      enterprise_health_score: health.unified_score,
      revenue_health: health.revenue_health,
      operations_health: health.operations_health,
      execution_health: execScore.execution_score,
      goal_achievement: avgGoalProb,
      active_escalations: activeEscalations,
      stalled_initiatives: stalledCount,
      revenue_leakage: totalLeakageK * 1000,
      critical_bottlenecks: criticalBottlenecks,
    },
    evaluated_at: new Date().toISOString(),
  };
}
