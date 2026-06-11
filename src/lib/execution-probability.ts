/**
 * src/lib/execution-probability.ts
 * Enterprise Execution Layer: Execution Probability Engine — InnoVibe AIOS
 */

import { createClient } from "@/lib/supabase/server";

export interface ExecutionProbabilityResult {
  id?: string;
  commitment_id: string;
  completion_probability: number;
  delay_probability: number;
  failure_probability: number;
  confidence_score: number;
  status: "On Track" | "At Risk" | "Likely Delayed" | "Critical";
}

/**
 * Predicts the probability that a commitment will complete on time.
 */
export async function calculateExecutionProbability(commitmentId: string): Promise<ExecutionProbabilityResult | null> {
  try {
    const db = await createClient();

    // 1. Fetch tasks, blockers, historical decision outcomes, alignment, and resources
    const [
      { data: tasks },
      { data: blockers },
      { data: outcomes },
      { data: alignments },
      { data: telemetry }
    ] = await Promise.all([
      db.from("execution_tasks").select("*").eq("commitment_id", commitmentId),
      db.from("execution_blockers").select("*").eq("commitment_id", commitmentId).eq("status", "active"),
      db.from("decision_outcomes").select("*"),
      db.from("department_coordination").select("*"),
      db.from("vehicles_telemetry").select("*").limit(10) // proxy for active dispatches / resource loads
    ]);

    const taskList = tasks || [];
    const activeBlockers = blockers || [];
    const historicalOutcomes = outcomes || [];
    const alignmentRecords = alignments || [];

    // Inputs evaluation:
    // A. Progress Score (0-100)
    let progressScore = 50.00; // default
    if (taskList.length > 0) {
      const totalProgress = taskList.reduce((sum: number, t: any) => sum + Number(t.progress || 0), 0);
      progressScore = totalProgress / taskList.length;
    }

    // B. Historical success rate (0-100)
    const avgHistoricalSuccess = historicalOutcomes.length > 0
      ? historicalOutcomes.reduce((sum: number, o: any) => sum + Number(o.success_score || 0), 0) / historicalOutcomes.length
      : 85.00;

    // C. Department Alignment Score (0-100)
    const avgAlignmentScore = alignmentRecords.length > 0
      ? alignmentRecords.reduce((sum: number, a: any) => sum + Number(a.alignment_score || 0), 0) / alignmentRecords.length
      : 90.00;

    // D. Resource Score (0-100)
    // In CRM, high technician or garage utilization can cause delays. Standard load is 60%.
    // If telemetry shows high activity, we deduct from resource score.
    const telemetryLoad = (telemetry || []).length * 8; // dummy activity indicator
    const resourceScore = Math.max(30.00, Math.min(100.00, 100.00 - telemetryLoad));

    // E. Blocker Score (0-100)
    const criticalCount = activeBlockers.filter((b: any) => b.severity === "critical").length;
    const highCount = activeBlockers.filter((b: any) => b.severity === "high").length;
    const blockerScore = Math.max(0.00, 100.00 - (criticalCount * 25.00) - (highCount * 12.00) - (activeBlockers.length * 5.00));

    // Weighted Formula:
    // ExecutionProbability = (ProgressScore * 0.30) + (HistoricalSuccess * 0.20) + (AlignmentScore * 0.15) + (ResourceScore * 0.15) + (BlockerScore * 0.20)
    const executionProbability =
      (progressScore * 0.30) +
      (avgHistoricalSuccess * 0.20) +
      (avgAlignmentScore * 0.15) +
      (resourceScore * 0.15) +
      (blockerScore * 0.20);

    const completionProb = Number(executionProbability.toFixed(2));
    
    // Status classification:
    let status: "On Track" | "At Risk" | "Likely Delayed" | "Critical" = "On Track";
    if (completionProb >= 80.00) {
      status = "On Track";
    } else if (completionProb >= 65.00) {
      status = "At Risk";
    } else if (completionProb >= 50.00) {
      status = "Likely Delayed";
    } else {
      status = "Critical";
    }

    // Derive delay and failure probabilities based on blockers & progress
    const failureProb = Number(Math.min(100 - completionProb, 10 + (criticalCount * 30) + (highCount * 15)).toFixed(2));
    const delayProb = Number((100.00 - completionProb - failureProb).toFixed(2));

    const result: ExecutionProbabilityResult = {
      commitment_id: commitmentId,
      completion_probability: completionProb,
      delay_probability: delayProb,
      failure_probability: failureProb,
      confidence_score: Number(avgHistoricalSuccess.toFixed(2)),
      status
    };

    // Save to database execution_probability_scores
    await db.from("execution_probability_scores").insert({
      commitment_id: result.commitment_id,
      completion_probability: result.completion_probability,
      delay_probability: result.delay_probability,
      failure_probability: result.failure_probability,
      confidence_score: result.confidence_score,
      status: result.status
    });

    return result;
  } catch (err: any) {
    console.error(`Failed to calculate execution probability for ${commitmentId}:`, err.message);
    return null;
  }
}
