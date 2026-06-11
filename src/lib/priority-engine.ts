/**
 * src/lib/priority-engine.ts
 * Priority Engine — InnoVibe AIOS
 * Computes priority rankings for decisions, opportunities, and initiatives.
 */

export interface PriorityInput {
  revenueImpact: number; // Potential monetary recovery / growth (₹)
  operationalImpactScore: number; // 1 to 10 based on bottleneck severity
  urgencyScore: number; // 1 to 10 based on SLA breach or target deficit
  confidenceScore: number; // 0 to 100 based on engine confidence
  difficulty: "easy" | "medium" | "hard";
}

/**
 * Standardized score calculation formula:
 * Score = (RevenueImpactWeight * 0.4 + OperationalImpact * 0.2 + Urgency * 0.3 + Confidence * 0.1) / DifficultyFactor
 */
export function calculatePriorityScore(input: PriorityInput): number {
  // Normalize revenue impact logarithmically to a 1-100 scale (handling ₹0 up to ₹1,000,000+)
  const normalizedRevenue = input.revenueImpact <= 0 
    ? 0 
    : Math.min(100, Math.round(10 * Math.log10(input.revenueImpact + 1)));

  // Map operational & urgency scores (1-10 scale) to 1-100 scale
  const opScore = Math.max(0, Math.min(100, input.operationalImpactScore * 10));
  const urgScore = Math.max(0, Math.min(100, input.urgencyScore * 10));
  const confScore = Math.max(0, Math.min(100, input.confidenceScore));

  // Weighted baseline score (max 100)
  const baseScore = (normalizedRevenue * 0.4) + (opScore * 0.2) + (urgScore * 0.3) + (confScore * 0.1);

  // Difficulty divisor mappings: Easy = 1.0, Medium = 1.5, Hard = 2.0
  const difficultyDivisor = 
    input.difficulty === "easy" 
      ? 1.0 
      : input.difficulty === "medium" 
        ? 1.5 
        : 2.0;

  const score = baseScore / difficultyDivisor;

  // Round and clamp between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)));
}
