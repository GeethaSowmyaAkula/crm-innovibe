/**
 * src/lib/goal-recovery-engine.ts
 * Module 1: Goal Recovery Engine — InnoVibe AIOS
 */

import { createClient } from "@/lib/supabase/server";

export interface RecoveryPlan {
  id?: string;
  goal_id: string;
  recovery_actions: Array<{ action: string; expected_benefit: string }>;
  expected_improvement_pct: number;
}

/**
 * Automatically creates recovery recipes for goals flagged with risk alerts.
 */
export async function generateRecoveryPlans(): Promise<RecoveryPlan[]> {
  try {
    const db = await createClient();

    // 1. Fetch latest goal risk alerts alongside goals
    const { data: alerts, error } = await db
      .from("goal_risk_alerts")
      .select("*, goals(*)");

    if (error || !alerts) return [];

    // Map unique goal risk alerts
    const uniqueAlertsMap = new Map<string, any>();
    for (const a of alerts) {
      const existing = uniqueAlertsMap.get(a.goal_id);
      if (!existing || new Date(a.created_at) > new Date(existing.created_at)) {
        uniqueAlertsMap.set(a.goal_id, a);
      }
    }

    const plans: RecoveryPlan[] = [];

    for (const alert of uniqueAlertsMap.values()) {
      const goal = alert.goals;
      if (!goal) continue;

      let actions: Array<{ action: string; expected_benefit: string }> = [];
      let expectedImprovement = 15.00;

      if (goal.category === "revenue") {
        actions = [
          {
            action: "Upgrade payment callback webhook thresholds and set up transactional retry triggers.",
            expected_benefit: "Recover ₹20,000+ in failed checkouts."
          },
          {
            action: "Launch target coupons to customers experiencing failed billing syncs.",
            expected_benefit: "Increase conversion rate by 12%."
          }
        ];
        expectedImprovement = 25.00;
      } else if (goal.category === "amc") {
        actions = [
          {
            action: "Initiate Out-of-Warranty fleets WhatsApp AMC promo broadcast with standard template discounts.",
            expected_benefit: "Secure 15+ new corporate annual memberships."
          },
          {
            action: "Train mechanics to upsell AMC packages during inspections.",
            expected_benefit: "Boost on-site upsell conversions by 8%."
          }
        ];
        expectedImprovement = 18.00;
      } else if (goal.category === "customer_growth" || goal.category === "operations") {
        actions = [
          {
            action: "Reallocate technician shift slots from West Hub partners into Pune East zone constraints.",
            expected_benefit: "Decrease average dispatch wait bottleneck times by 35%."
          },
          {
            action: "Introduce regional diagnostic garages to absorb booking overflow peaks.",
            expected_benefit: "Restore CSAT index compliance back to 4.70."
          }
        ];
        expectedImprovement = 20.00;
      } else {
        actions = [
          {
            action: "Conduct operational alignment reviews and modify team task lists.",
            expected_benefit: "Improve overall project milestones progress by 10%."
          }
        ];
      }

      const plan: RecoveryPlan = {
        goal_id: goal.id,
        recovery_actions: actions,
        expected_improvement_pct: expectedImprovement
      };

      // Write to database
      await db
        .from("goal_recovery_plans")
        .insert({
          goal_id: plan.goal_id,
          recovery_actions: plan.recovery_actions,
          expected_improvement_pct: plan.expected_improvement_pct
        });

      plans.push(plan);
    }

    return plans;
  } catch (err: any) {
    console.error("Failed to generate goal recovery plans:", err.message);
    return [];
  }
}
