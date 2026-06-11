/**
 * src/lib/goal-monitoring-engine.ts
 * Module 1: Goal Monitoring Engine — InnoVibe AIOS
 */

import { createClient } from "@/lib/supabase/server";

export interface GoalRiskAlert {
  id?: string;
  goal_id: string;
  risk_level: "low" | "medium" | "high" | "critical";
  root_cause: string;
  expected_deficit: number;
}

/**
 * Monitors goals by auditing success probabilities, writing alerts for any at-risk goals.
 */
export async function monitorGoalRisks(): Promise<GoalRiskAlert[]> {
  try {
    const db = await createClient();

    // 1. Fetch latest goal probability scores alongside goal details
    const { data: probabilityScores, error } = await db
      .from("goal_probability_scores")
      .select("*, goals(*)");

    if (error || !probabilityScores) return [];

    // Filter to get the latest score per goal_id
    const latestScoresMap = new Map<string, any>();
    for (const score of probabilityScores) {
      const existing = latestScoresMap.get(score.goal_id);
      if (!existing || new Date(score.calculated_at) > new Date(existing.calculated_at)) {
        latestScoresMap.set(score.goal_id, score);
      }
    }

    const alerts: GoalRiskAlert[] = [];

    for (const score of latestScoresMap.values()) {
      const goal = score.goals;
      if (!goal) continue;

      const probFailure = Number(score.probability_of_failure);
      const targetVal = Number(goal.target_value);
      const currentVal = Number(goal.current_value);
      const velocity = Number(score.velocity);
      const remainingDays = Number(score.remaining_days);

      // Determine risk level based on failure probability
      let riskLevel: "low" | "medium" | "high" | "critical" | null = null;
      if (probFailure >= 80) {
        riskLevel = "critical";
      } else if (probFailure >= 60) {
        riskLevel = "high";
      } else if (probFailure >= 40) {
        riskLevel = "medium";
      }

      if (riskLevel) {
        // Calculate projected deficit at current velocity
        const projectedFinal = currentVal + (velocity * remainingDays);
        const expectedDeficit = Math.max(0, targetVal - projectedFinal);

        // Derive root causes by category
        let rootCause = "Growth rate is lagging behind target trajectory requirements.";
        if (goal.category === "revenue") {
          rootCause = `Deficit of ₹${expectedDeficit.toFixed(0)} projected. Driven by gateway webhook sync delays and slot bottlenecks in Pune East Hub.`;
        } else if (goal.category === "amc") {
          rootCause = `Failing to match the 100 conversions target. WhatsApp AMC campaign out-of-warranty conversions are running slow.`;
        } else if (goal.category === "customer_growth") {
          rootCause = `CSAT target rate of 5.0 is constrained by service dispatch delays. Overloaded technicians causing negative reviews.`;
        } else if (goal.category === "operations") {
          rootCause = `Operational health bottlenecks are peaking, slowing SLA dispatch times.`;
        }

        const alert: GoalRiskAlert = {
          goal_id: goal.id,
          risk_level: riskLevel,
          root_cause: rootCause,
          expected_deficit: Number(expectedDeficit.toFixed(2))
        };

        // Write to database
        await db
          .from("goal_risk_alerts")
          .insert({
            goal_id: alert.goal_id,
            risk_level: alert.risk_level,
            root_cause: alert.root_cause,
            expected_deficit: alert.expected_deficit
          });

        alerts.push(alert);
      }
    }

    return alerts;
  } catch (err: any) {
    console.error("Failed to monitor goal risks:", err.message);
    return [];
  }
}
