/**
 * src/lib/strategic-alignment.ts
 * Strategic Alignment Engine — InnoVibe AIOS
 */

import { createClient } from "@/lib/supabase/server";

export interface AlignmentScore {
  initiative_id: string;
  goal_id: string;
  alignment_score: number;
  impact_reasoning: string;
}

/**
 * Computes alignment scores between initiatives and strategic goals.
 */
export async function calculateStrategicAlignment(
  initiativeId: string,
  goalId: string,
  initiativeTitle: string,
  initiativeCategory: string,
  goalTitle: string,
  goalCategory: string
): Promise<AlignmentScore> {
  let score = 30; // Baseline score
  let reasoning = `The initiative '${initiativeTitle}' has indirect alignment with the goal '${goalTitle}'.`;

  // Category matching
  const categoryMatch = initiativeCategory.toLowerCase() === goalCategory.toLowerCase();
  if (categoryMatch) {
    score += 40;
    reasoning = `Direct department alignment: both target ${goalCategory} growth paths.`;
  }

  // Keyword intersection matching
  const initWords = initiativeTitle.toLowerCase().split(" ").filter(w => w.length > 3);
  const goalWords = goalTitle.toLowerCase().split(" ").filter(w => w.length > 3);

  const intersection = initWords.filter(w => goalWords.includes(w));
  if (intersection.length > 0) {
    score += 30;
    reasoning += ` Shared objectives detected around keywords: [${intersection.join(", ")}].`;
  }

  // Cap score at 100
  const finalScore = Math.min(100, score);

  // Store in database if possible
  try {
    const db = await createClient();
    await db
      .from("strategic_alignment_scores")
      .upsert({
        initiative_id: initiativeId,
        goal_id: goalId,
        alignment_score: finalScore,
        impact_reasoning: reasoning
      }, { onConflict: "initiative_id,goal_id" });
  } catch (err: any) {
    console.error("Failed to store strategic alignment score:", err.message);
  }

  return {
    initiative_id: initiativeId,
    goal_id: goalId,
    alignment_score: finalScore,
    impact_reasoning: reasoning
  };
}
