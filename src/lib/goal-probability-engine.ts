/**
 * src/lib/goal-probability-engine.ts
 * Module 1: Goal Probability Engine — InnoVibe AIOS
 */

import { createClient } from "@/lib/supabase/server";

export interface GoalProbability {
  id?: string;
  goal_id: string;
  probability_of_success: number;
  probability_of_failure: number;
  confidence_score: number;
  velocity: number;
  remaining_days: number;
}

/**
 * Calculates success/failure probabilities and velocity for a specific goal.
 */
export async function calculateGoalProbability(goalId: string): Promise<GoalProbability | null> {
  try {
    const db = await createClient();

    // 1. Fetch Goal details
    const { data: goal, error: goalErr } = await db
      .from("goals")
      .select("*, okr_cycles(end_date)")
      .eq("id", goalId)
      .maybeSingle();

    if (goalErr || !goal) {
      throw new Error(goalErr?.message || "Goal not found");
    }

    const target = Number(goal.target_value);
    const current = Number(goal.current_value);

    // 2. Fetch Goal historical progression metrics
    const { data: metrics } = await db
      .from("goal_metrics")
      .select("*")
      .eq("goal_id", goalId)
      .order("recorded_at", { ascending: true });

    // 3. Compute Velocity (change per day)
    let velocity = 0;
    let daysElapsed = 30; // default assumptions
    if (metrics && metrics.length > 1) {
      const first = metrics[0];
      const last = metrics[metrics.length - 1];
      const timeDiff = new Date(last.recorded_at).getTime() - new Date(first.recorded_at).getTime();
      daysElapsed = Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
      velocity = (Number(last.recorded_value) - Number(first.recorded_value)) / daysElapsed;
    } else {
      // Fallback velocity: assume it took 30 days to get to current
      velocity = current / 30;
    }

    // Adjust velocity to ensure realistic margins
    if (velocity < 0) velocity = 0.1; // small positive base

    // 4. Calculate Remaining Days
    let remainingDays = 90;
    const cycleEndDate = (goal as any).okr_cycles?.end_date;
    if (cycleEndDate) {
      const diff = new Date(cycleEndDate).getTime() - Date.now();
      remainingDays = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    // 5. Calculate probabilities
    let probSuccess = 50.00;
    if (current >= target) {
      probSuccess = 100.00;
    } else {
      const needed = target - current;
      const projectedGrowth = velocity * remainingDays;
      
      // Calculate how close the projection gets to target
      if (projectedGrowth >= needed) {
        // Highly likely but capped for uncertainty
        probSuccess = Math.min(95, 70 + (projectedGrowth - needed) / needed * 25);
      } else {
        // Below target projection
        probSuccess = Math.max(5, (projectedGrowth / needed) * 70);
      }
    }

    const probFailure = 100 - probSuccess;
    
    // Confidence score based on historical data points
    const dataPointsCount = metrics?.length || 0;
    const confidence = Math.min(98.00, Math.max(60.00, 70.00 + dataPointsCount * 2.5));

    const result: GoalProbability = {
      goal_id: goalId,
      probability_of_success: Number(probSuccess.toFixed(2)),
      probability_of_failure: Number(probFailure.toFixed(2)),
      confidence_score: Number(confidence.toFixed(2)),
      velocity: Number(velocity.toFixed(2)),
      remaining_days: remainingDays
    };

    // 6. Write results to database
    await db
      .from("goal_probability_scores")
      .insert({
        goal_id: result.goal_id,
        probability_of_success: result.probability_of_success,
        probability_of_failure: result.probability_of_failure,
        confidence_score: result.confidence_score,
        velocity: result.velocity,
        remaining_days: result.remaining_days
      });

    return result;
  } catch (err: any) {
    console.error(`Failed to calculate goal probability for ${goalId}:`, err.message);
    return null;
  }
}

/**
 * Runs probability scoring across all active corporate goals.
 */
export async function evaluateAllGoalProbabilities(): Promise<GoalProbability[]> {
  try {
    const db = await createClient();
    const { data: activeGoals, error } = await db
      .from("goals")
      .select("id");

    if (error || !activeGoals) return [];

    const results: GoalProbability[] = [];
    for (const g of activeGoals) {
      const res = await calculateGoalProbability(g.id);
      if (res) results.push(res);
    }
    return results;
  } catch (err: any) {
    console.error("Failed to evaluate goal probabilities:", err.message);
    return [];
  }
}
