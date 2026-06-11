/**
 * src/lib/followup-engine.ts
 * Enterprise Execution Layer: Autonomous Follow-Up Engine — InnoVibe AIOS
 */

import { createClient } from "@/lib/supabase/server";

export interface FollowupAction {
  target: string;
  action_required: string;
  urgency: "low" | "medium" | "high" | "critical";
  status: "pending" | "dispatched";
}

/**
 * Sweeps active execution states and triggers immediate escalations, recovery plans, and follow-ups.
 */
export async function runAutonomousFollowups(): Promise<FollowupAction[]> {
  try {
    const db = await createClient();

    // 1. Fetch tasks, active blockers, probability scores, and realization records
    const [
      { data: tasks },
      { data: blockers },
      { data: probabilities },
      { data: realizations }
    ] = await Promise.all([
      db.from("execution_tasks").select("*").neq("status", "completed"),
      db.from("execution_blockers").select("*").eq("status", "active"),
      db.from("execution_probability_scores").select("*").order("calculated_at", { ascending: false }),
      db.from("value_realization").select("*").order("created_at", { ascending: false })
    ]);

    const taskList = tasks || [];
    const blockerList = blockers || [];
    const probScores = probabilities || [];
    const realizationList = realizations || [];

    const followups: FollowupAction[] = [];

    // Rule A: Overdue tasks > 3 days -> Create follow-up
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const threeDaysAgoStr = threeDaysAgo.toISOString().split("T")[0];

    const overdueTasks = taskList.filter((t: any) => t.due_date < threeDaysAgoStr);
    for (const task of overdueTasks) {
      followups.push({
        target: task.assigned_to,
        action_required: `Automated Task Follow-up: Task "${task.title}" is overdue by more than 3 days. Please submit status update or re-allocate.`,
        urgency: "high",
        status: "pending"
      });
    }

    // Rule B: Blocker unresolved > 48h -> Escalate
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const fortyEightHoursAgoStr = fortyEightHoursAgo.toISOString();

    const oldBlockers = blockerList.filter((b: any) => b.created_at < fortyEightHoursAgoStr);
    for (const block of oldBlockers) {
      // Create executive escalation record
      await db.from("executive_escalations").insert({
        issue: `Critical Blocker Active > 48h: ${block.blocker_type}`,
        impact_desc: `Blocker on commitment #${block.commitment_id} unresolved for over 48 hours: ${block.description}.`,
        urgency: "critical",
        status: "active"
      });

      followups.push({
        target: "Deepak (Ops Manager)",
        action_required: `Escalation: Blocker unresolved for > 48h on commitment #${block.commitment_id}. suggested resolution: ${block.suggested_resolution}.`,
        urgency: "critical",
        status: "pending"
      });
    }

    // Rule C: Commitment probability < 60% -> Create recovery recommendation
    const lowProbScores = probScores.filter((p: any) => Number(p.completion_probability) < 60.00);
    if (lowProbScores.length > 0) {
      const latestLow = lowProbScores[0];
      
      // Auto-trigger recovery recommendation in database
      await db.from("goal_recovery_plans").insert({
        goal_id: null, // associated at initiative level
        recovery_actions: [
          {
            action: "Add backup technicians to balance dispatcher slot loads",
            impact_pct: 15.00
          },
          {
            action: "Upgrade payment gateways integration retry callback routines",
            impact_pct: 20.00
          }
        ],
        expected_improvement_pct: 35.00
      });

      followups.push({
        target: "Siddharth (Revenue Head)",
        action_required: `Recovery Trigger: Commitment #${latestLow.commitment_id} has < 60% completion probability (${latestLow.completion_probability}%). Initiating backup task plans.`,
        urgency: "high",
        status: "pending"
      });
    }

    // Rule D: Value Realization < 70% -> Generate investigation task
    const lowRealizations = realizationList.filter((r: any) => Number(r.realization_score) < 70.00);
    for (const real of lowRealizations) {
      // Generate investigation task in execution tasks
      await db.from("execution_tasks").insert({
        commitment_id: null, // strategic audit
        title: `Audit Value Leakage for Initiative #${real.initiative_id}`,
        description: `Value realization is at ${real.realization_score}%. Investigate variances in expected vs actual CSAT, SLA, or Revenue metrics.`,
        assigned_to: "Finance Auditor",
        status: "pending",
        progress: 0.00,
        due_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      });

      followups.push({
        target: "Finance Auditor",
        action_required: `Variance Investigation: Strategic Initiative #${real.initiative_id} under-delivered value with a realization score of ${real.realization_score}%. Audit required.`,
        urgency: "medium",
        status: "pending"
      });
    }

    // Standard default follow-up if none triggered
    if (followups.length === 0) {
      followups.push({
        target: "Operations Division",
        action_required: "All commitments on-track. Dispatch weekly review slides compile trigger.",
        urgency: "low",
        status: "pending"
      });
    }

    return followups;
  } catch (err: any) {
    console.error("Autonomous follow-up engine failed:", err.message);
    return [
      {
        target: "Operations Division",
        action_required: "Review slot utilization constraints at Pune East Hub.",
        urgency: "high",
        status: "pending"
      }
    ];
  }
}
