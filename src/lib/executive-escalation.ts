/**
 * src/lib/executive-escalation.ts
 * Module 2: Executive Escalation Engine — InnoVibe AIOS
 */

import { createClient } from "@/lib/supabase/server";
import { getOperationsHealthReport } from "@/lib/operations-health";
import { detectBottlenecks } from "@/lib/bottleneck-intelligence";

export interface Escalation {
  id?: string;
  issue: string;
  impact_desc: string;
  urgency: "low" | "medium" | "high" | "critical";
  status: "active" | "resolved";
  actions?: EscalationAction[];
}

export interface EscalationAction {
  id?: string;
  escalation_id?: string;
  action_text: string;
  expected_recovery: string;
  status: "pending" | "executed";
}

/**
 * Checks all metrics and creates escalations if critical thresholds are crossed.
 */
export async function checkAndTriggerEscalations(
  preFetched?: {
    opsHealth?: number;
    bottlenecks?: any[];
    profiles?: any[];
    goalProbabilities?: any[];
  }
): Promise<Escalation[]> {
  try {
    const db = await createClient();

    // 1. Gather all trigger variables
    const opsHealth = preFetched?.opsHealth !== undefined
      ? preFetched.opsHealth
      : (await getOperationsHealthReport().catch(() => ({ overall: 85 }))).overall;

    const bottlenecks = preFetched?.bottlenecks
      ? preFetched.bottlenecks
      : await detectBottlenecks().catch(() => []);

    const profileList = preFetched?.profiles
      ? preFetched.profiles
      : (await db.from("customer_revenue_profiles").select("*")).data || [];

    const goalProbs = preFetched?.goalProbabilities
      ? preFetched.goalProbabilities
      : (await db.from("goal_probability_scores").select("*, goals(*)").order("calculated_at", { ascending: false })).data || [];

    const totalBottleneckImpact = bottlenecks.reduce((sum, b) => sum + (b.revenue_impact || 0), 0);
    const highChurnCount = profileList.filter((p: any) => Number(p.churn_risk_score || 0) > 50).length;

    // Filter latest goal probabilities
    const latestProbs = new Map<string, any>();
    for (const gp of goalProbs) {
      if (!latestProbs.has(gp.goal_id)) {
        latestProbs.set(gp.goal_id, gp);
      }
    }

    let revenueRiskFailureProb = 0;
    for (const gp of latestProbs.values()) {
      if (gp.goals?.category === "revenue") {
        revenueRiskFailureProb = Number(gp.probability_of_failure);
        break;
      }
    }

    const escalations: Escalation[] = [];

    // Rule A: Revenue Goal Failure Risk > 30%
    if (revenueRiskFailureProb > 30) {
      const issue = "Revenue Target Achievement Failure Risk Exceeds 30%";
      const impact_desc = `Current revenue velocity indicates a failure probability of ${revenueRiskFailureProb.toFixed(1)}% to meet the target.`;
      
      const { data: existing } = await db
        .from("executive_escalations")
        .select("*")
        .eq("issue", issue)
        .eq("status", "active")
        .maybeSingle();

      if (existing) {
        const { data: acts } = await db
          .from("escalation_actions")
          .select("*")
          .eq("escalation_id", existing.id);

        escalations.push({
          id: existing.id,
          issue: existing.issue,
          impact_desc: existing.impact_desc,
          urgency: existing.urgency as any,
          status: existing.status as any,
          actions: acts || []
        });
      } else {
        const { data: esc, error } = await db
          .from("executive_escalations")
          .insert({
            issue,
            impact_desc,
            urgency: "high",
            status: "active"
          })
          .select("id")
          .maybeSingle();

        if (!error && esc) {
          const actions = [
            { action_text: "Upgrade checkout webhooks and activate checkout retry logic.", expected_recovery: "Recover ₹20,000+ in checkouts." },
            { action_text: "Launch AMC campaign discounts for high-churn risk corporate accounts.", expected_recovery: "Secure ₹15,000+ incremental AMC sales." }
          ];

          const insertedActions: EscalationAction[] = [];
          for (const act of actions) {
            const { data: insertedAct } = await db.from("escalation_actions").insert({
              escalation_id: esc.id,
              action_text: act.action_text,
              expected_recovery: act.expected_recovery,
              status: "pending"
            }).select("*").maybeSingle();
            if (insertedAct) insertedActions.push(insertedAct);
          }

          escalations.push({
            id: esc.id,
            issue,
            impact_desc,
            urgency: "high",
            status: "active",
            actions: insertedActions
          });
        }
      }
    }

    // Rule B: Operations Health < 60
    if (opsHealth < 60) {
      const prefix = "Operations Health Index Critical";
      const issue = `Operations Health Index Critical: ${opsHealth}%`;
      const impact_desc = `Operational performance has degraded below acceptable thresholds (60%), threatening overall customer satisfaction.`;
      
      const { data: existing } = await db
        .from("executive_escalations")
        .select("*")
        .eq("status", "active")
        .like("issue", `${prefix}%`)
        .maybeSingle();

      if (existing) {
        await db.from("executive_escalations").update({ issue }).eq("id", existing.id);
        const { data: acts } = await db
          .from("escalation_actions")
          .select("*")
          .eq("escalation_id", existing.id);

        escalations.push({
          id: existing.id,
          issue,
          impact_desc: existing.impact_desc,
          urgency: existing.urgency as any,
          status: existing.status as any,
          actions: acts || []
        });
      } else {
        const { data: esc, error } = await db
          .from("executive_escalations")
          .insert({
            issue,
            impact_desc,
            urgency: "critical",
            status: "active"
          })
          .select("id")
          .maybeSingle();

        if (!error && esc) {
          const actions = [
            { action_text: "Reallocate mechanic shifts from West Hub into East Hub slots.", expected_recovery: "Bring SLA compliance back above 90%." },
            { action_text: "Deploy backup partner garages to handle booking backlog peaks.", expected_recovery: "Unblock active booking queues." }
          ];

          const insertedActions: EscalationAction[] = [];
          for (const act of actions) {
            const { data: insertedAct } = await db.from("escalation_actions").insert({
              escalation_id: esc.id,
              action_text: act.action_text,
              expected_recovery: act.expected_recovery,
              status: "pending"
            }).select("*").maybeSingle();
            if (insertedAct) insertedActions.push(insertedAct);
          }

          escalations.push({
            id: esc.id,
            issue,
            impact_desc,
            urgency: "critical",
            status: "active",
            actions: insertedActions
          });
        }
      }
    }

    // Rule C: Bottleneck Revenue Impact > ₹25,000
    if (totalBottleneckImpact > 25000) {
      const prefix = "Severe Operational Bottleneck Revenue Leakage";
      const issue = `Severe Operational Bottleneck Revenue Leakage: ₹${totalBottleneckImpact.toLocaleString("en-IN")}`;
      const impact_desc = `Aggregated operational bottlenecks across garage slots and technician dispatches are costing the company ₹${totalBottleneckImpact.toLocaleString("en-IN")}.`;

      const { data: existing } = await db
        .from("executive_escalations")
        .select("*")
        .eq("status", "active")
        .like("issue", `${prefix}%`)
        .maybeSingle();

      if (existing) {
        await db.from("executive_escalations").update({ issue, impact_desc }).eq("id", existing.id);
        const { data: acts } = await db
          .from("escalation_actions")
          .select("*")
          .eq("escalation_id", existing.id);

        escalations.push({
          id: existing.id,
          issue,
          impact_desc,
          urgency: existing.urgency as any,
          status: existing.status as any,
          actions: acts || []
        });
      } else {
        const { data: esc, error } = await db
          .from("executive_escalations")
          .insert({
            issue,
            impact_desc,
            urgency: "high",
            status: "active"
          })
          .select("id")
          .maybeSingle();

        if (!error && esc) {
          const actions = [
            { action_text: "Onboard new partner mechanics on freelance service SLAs.", expected_recovery: "Expand dispatch capacity by 40%." },
            { action_text: "Open up night-shift options at Pune Central garage.", expected_recovery: "Resolve slot backlog overflow." }
          ];

          const insertedActions: EscalationAction[] = [];
          for (const act of actions) {
            const { data: insertedAct } = await db.from("escalation_actions").insert({
              escalation_id: esc.id,
              action_text: act.action_text,
              expected_recovery: act.expected_recovery,
              status: "pending"
            }).select("*").maybeSingle();
            if (insertedAct) insertedActions.push(insertedAct);
          }

          escalations.push({
            id: esc.id,
            issue,
            impact_desc,
            urgency: "high",
            status: "active",
            actions: insertedActions
          });
        }
      }
    }

    // Rule D: Customer Churn Spike (High churn profile count > 5)
    if (highChurnCount > 5) {
      const prefix = "Spike in High Churn Risk Accounts";
      const issue = `Spike in High Churn Risk Accounts: ${highChurnCount} Customers at Risk`;
      const impact_desc = `Multiple accounts are flagged with high churn indicators due to repeated support complaint delays and rating dips.`;

      const { data: existing } = await db
        .from("executive_escalations")
        .select("*")
        .eq("status", "active")
        .like("issue", `${prefix}%`)
        .maybeSingle();

      if (existing) {
        await db.from("executive_escalations").update({ issue }).eq("id", existing.id);
        const { data: acts } = await db
          .from("escalation_actions")
          .select("*")
          .eq("escalation_id", existing.id);

        escalations.push({
          id: existing.id,
          issue,
          impact_desc,
          urgency: existing.urgency as any,
          status: existing.status as any,
          actions: acts || []
        });
      } else {
        const { data: esc, error } = await db
          .from("executive_escalations")
          .insert({
            issue,
            impact_desc,
            urgency: "medium",
            status: "active"
          })
          .select("id")
          .maybeSingle();

        if (!error && esc) {
          const actions = [
            { action_text: "Broadcast automated support satisfaction emails offering wallet credits.", expected_recovery: "Recover 4+ churn risk accounts." },
            { action_text: "Deploy priority dispatch flag for bookings from previously unsatisfied accounts.", expected_recovery: "Fast-track resolution." }
          ];

          const insertedActions: EscalationAction[] = [];
          for (const act of actions) {
            const { data: insertedAct } = await db.from("escalation_actions").insert({
              escalation_id: esc.id,
              action_text: act.action_text,
              expected_recovery: act.expected_recovery,
              status: "pending"
            }).select("*").maybeSingle();
            if (insertedAct) insertedActions.push(insertedAct);
          }

          escalations.push({
            id: esc.id,
            issue,
            impact_desc,
            urgency: "medium",
            status: "active",
            actions: insertedActions
          });
        }
      }
    }

    return escalations;
  } catch (err: any) {
    console.error("Failed to check and trigger escalations:", err.message);
    return [];
  }
}

/**
 * Executes a proposed escalation recovery action.
 */
export async function executeEscalationAction(actionId: string): Promise<boolean> {
  try {
    const db = await createClient();
    const { error } = await db
      .from("escalation_actions")
      .update({ status: "executed" })
      .eq("id", actionId);

    if (error) throw error;
    return true;
  } catch (err: any) {
    console.error(`Failed to execute escalation action ${actionId}:`, err.message);
    return false;
  }
}
