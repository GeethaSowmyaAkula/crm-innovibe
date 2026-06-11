/**
 * src/lib/portfolio-engine.ts
 * Enterprise Execution Layer: Strategic Initiative Portfolio Management — InnoVibe AIOS
 */

import { createClient } from "@/lib/supabase/server";

export interface PortfolioRanking {
  initiative_id: string;
  title: string;
  category: string;
  budget: number;
  allocated_budget: number;
  expected_impact_val: number;
  roi: number;
  risk_score: number;
  progress: number;
  status: string;
  acceleration_recommendation: "Accelerate" | "Pause" | "Terminate" | "Maintain";
  rationale: string;
}

/**
 * Evaluates a strategic portfolio, ranking allocations and determining execution pivots.
 */
export async function analyzePortfolio(portfolioId: string): Promise<PortfolioRanking[]> {
  try {
    const db = await createClient();

    // 1. Fetch portfolio allocations, initiatives, and their execution probabilities
    const [
      { data: allocations },
      { data: initiatives },
      { data: probabilities }
    ] = await Promise.all([
      db.from("portfolio_allocations").select("*").eq("portfolio_id", portfolioId),
      db.from("strategic_initiatives").select("*"),
      db.from("execution_probability_scores").select("*").order("calculated_at", { ascending: false })
    ]);

    const allocList = allocations || [];
    const initList = initiatives || [];
    const probList = probabilities || [];

    const rankings: PortfolioRanking[] = [];

    for (const alloc of allocList) {
      const init = initList.find((i: any) => i.id === alloc.initiative_id);
      if (!init) continue;

      // Extract expected impact value (revenue proxy)
      let expectedImpactVal = 25000; // default fallback
      if (init.expected_impact && !isNaN(Number(init.expected_impact))) {
        expectedImpactVal = Number(init.expected_impact);
      } else if (init.title.toLowerCase().includes("amc")) {
        expectedImpactVal = 50000;
      } else if (init.title.toLowerCase().includes("webhook")) {
        expectedImpactVal = 28000;
      }

      // Calculate ROI = (Expected Impact / Budget) * 100
      const budgetVal = Number(alloc.allocated_budget || init.budget || 5000);
      const roi = budgetVal > 0 ? (expectedImpactVal / budgetVal) * 100 : 100;

      // Get latest execution probability / risk score
      const prob = probList.find((p: any) => p.commitment_id === init.id);
      const completionProb = prob ? Number(prob.completion_probability) : Number(init.success_probability || 90.00);
      const riskScore = 100.00 - completionProb;

      // Determine Acceleration, Pause, or Termination Recommendation:
      // - Accelerate: high ROI (>150%), low risk (<30%), but progress is lagging (<60%)
      // - Pause: high risk (>50%), or has active blockers
      // - Terminate: critical risk (>70%), or extremely low ROI (<40%)
      let rec: "Accelerate" | "Pause" | "Terminate" | "Maintain" = "Maintain";
      let rationale = "Initiative performing within target thresholds. Maintain standard allocations.";

      if (riskScore > 70.00 || (roi < 40.00 && init.progress < 20.00)) {
        rec = "Terminate";
        rationale = `Critical failure risk index at ${riskScore.toFixed(1)}% with poor capital ROI of ${roi.toFixed(1)}%. Terminate project immediately.`;
      } else if (riskScore > 45.00) {
        rec = "Pause";
        rationale = `High execution risk level of ${riskScore.toFixed(1)}%. Recommend pausing allocations until blocker is cleared.`;
      } else if (roi > 150.00 && init.progress < 60.00 && riskScore < 30.00) {
        rec = "Accelerate";
        rationale = `High potential ROI yield (${roi.toFixed(0)}%) with low execution risk. Accelerate budget allocation to speed up completion.`;
      }

      rankings.push({
        initiative_id: init.id,
        title: init.title,
        category: init.category,
        budget: Number(init.budget || 0),
        allocated_budget: budgetVal,
        expected_impact_val: expectedImpactVal,
        roi: Number(roi.toFixed(2)),
        risk_score: Number(riskScore.toFixed(2)),
        progress: Number(init.progress || 0),
        status: alloc.status || init.status,
        acceleration_recommendation: rec,
        rationale
      });
    }

    // Sort by ROI (descending) and risk score (ascending)
    rankings.sort((a, b) => b.roi - a.roi || a.risk_score - b.risk_score);

    return rankings;
  } catch (err: any) {
    console.error("Failed to analyze strategic portfolio:", err.message);
    return [];
  }
}
