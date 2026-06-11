import { createClient } from "@/lib/supabase/server";

export interface LearnedRecommendation {
  id: string;
  title: string;
  description: string;
  rationale: string;
  confidence_score: number;
  priority_score?: number;
  proposed_action: any;
  status: "pending" | "approved" | "dismissed" | "executed";
  learning_log?: string;
  learning_adjusted?: boolean;
}

/**
 * Recommendation Learning Engine implements a feedback loop.
 * It analyzes past outcomes to adjust scores of pending recommendations.
 */
export async function applyRecommendationLearning(
  recommendations: any[],
  preFetchedDecisionOutcomes?: any[],
  preFetchedCampaignOutcomes?: any[],
  preFetchedAutomationOutcomes?: any[]
): Promise<LearnedRecommendation[]> {
  const supabase = await createClient();

  let decisionOutcomes: any[] = preFetchedDecisionOutcomes ?? [];
  let campaignOutcomes: any[] = preFetchedCampaignOutcomes ?? [];
  let automationOutcomes: any[] = preFetchedAutomationOutcomes ?? [];

  if (!preFetchedDecisionOutcomes || !preFetchedCampaignOutcomes || !preFetchedAutomationOutcomes) {
    const [
      { data: dbDecisionOutcomes },
      { data: dbCampaignOutcomes },
      { data: dbAutomationOutcomes }
    ] = await Promise.all([
      supabase.from("decision_outcomes").select("*, decision_recommendations(title, proposed_action)"),
      supabase.from("campaign_outcomes").select("*"),
      supabase.from("automation_outcomes").select("*, automation_executions(automation_rules(name))")
    ]);
    if (!preFetchedDecisionOutcomes) decisionOutcomes = dbDecisionOutcomes || [];
    if (!preFetchedCampaignOutcomes) campaignOutcomes = dbCampaignOutcomes || [];
    if (!preFetchedAutomationOutcomes) automationOutcomes = dbAutomationOutcomes || [];
  }

  return recommendations.map((rec: any) => {
    let matchesCount = 0;
    let totalSuccessScore = 0;
    let matchingLogs: string[] = [];

    const recTitleLower = rec.title.toLowerCase();
    const recActionType = rec.proposed_action?.type || "";

    // 1. Check similar past Decision outcomes
    decisionOutcomes.forEach((out: any) => {
      const outTitle = out.decision_recommendations?.title || "";
      const outActionType = out.decision_recommendations?.proposed_action?.type || "";

      if (
        (outTitle && outTitle.toLowerCase() === recTitleLower) ||
        (outActionType && outActionType === recActionType)
      ) {
        matchesCount++;
        totalSuccessScore += Number(out.success_score || 0);
        matchingLogs.push(`decision outcome (Score: ${out.success_score}%)`);
      }
    });

    // 2. Check similar past Campaign outcomes
    campaignOutcomes.forEach((out: any) => {
      const campaignLower = out.campaign_name.toLowerCase();
      // Match if campaign name overlaps with recommendation title
      if (
        recTitleLower.includes(campaignLower) ||
        campaignLower.includes(recTitleLower) ||
        (recTitleLower.includes("amc") && campaignLower.includes("amc")) ||
        (recTitleLower.includes("pune") && campaignLower.includes("pune"))
      ) {
        matchesCount++;
        totalSuccessScore += Number(out.success_score || 0);
        matchingLogs.push(`campaign '${out.campaign_name}' (Score: ${out.success_score}%)`);
      }
    });

    // 3. Check similar past Automation outcomes
    automationOutcomes.forEach((out: any) => {
      const ruleName = out.automation_executions?.automation_rules?.name || "";
      if (
        ruleName && (
          recTitleLower.includes(ruleName.toLowerCase()) ||
          ruleName.toLowerCase().includes(recTitleLower)
        )
      ) {
        matchesCount++;
        totalSuccessScore += Number(out.success_score || 0);
        matchingLogs.push(`automation '${ruleName}' (Score: ${out.success_score}%)`);
      }
    });

    // Calculate learning adjustments
    if (matchesCount > 0) {
      const avgSuccess = totalSuccessScore / matchesCount;
      let adjustedConfidence = Number(rec.confidence_score);
      let adjustmentText = "";

      // If past success score was high, boost confidence
      if (avgSuccess >= 75) {
        const boost = 0.05; // 5% boost
        adjustedConfidence = Math.min(1.0, adjustedConfidence + boost);
        adjustmentText = `[Learned Feedback Loop] Boosted confidence to ${Math.round(adjustedConfidence * 100)}% based on ${matchesCount} past successful outcomes (avg success: ${avgSuccess.toFixed(1)}%).`;
      } 
      // If past success was low, decrease confidence
      else if (avgSuccess < 50) {
        const penalty = 0.15; // 15% reduction
        adjustedConfidence = Math.max(0.1, adjustedConfidence - penalty);
        adjustmentText = `[Learned Feedback Loop] Adjusted confidence down to ${Math.round(adjustedConfidence * 100)}% due to low success history in similar runs (avg success: ${avgSuccess.toFixed(1)}%).`;
      } 
      // Moderate success
      else {
        adjustmentText = `[Learned Feedback Loop] Confidence remained stable at ${Math.round(adjustedConfidence * 100)}% based on moderate past performance (avg success: ${avgSuccess.toFixed(1)}%).`;
      }

      // Re-calculate Priority score if it exists (Priority = (Impact * Confidence) / Effort)
      const impact = Number(rec.impact_score || 7);
      const effort = Number(rec.effort_score || 2);
      const priority_score = Number(((impact * adjustedConfidence) / effort).toFixed(2));

      return {
        ...rec,
        confidence_score: Number(adjustedConfidence.toFixed(2)),
        priority_score,
        learning_log: adjustmentText,
        learning_adjusted: true
      };
    }

    // No historical learning match found
    return {
      ...rec,
      learning_log: "[Learning Engine] No historical outcome logs matched. Serving default scores.",
      learning_adjusted: false
    };
  });
}
