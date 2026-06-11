/**
 * src/lib/ceo-planner.ts
 * CEO Strategic Planner V3 — InnoVibe AIOS
 */

import { createClient } from "@/lib/supabase/server";
import { calculateStrategicAlignment } from "@/lib/strategic-alignment";
import { createCommitmentFromInitiative } from "@/lib/execution-engine";
import { trackValueRealization } from "@/lib/value-realization";

export interface Initiative {
  id?: string;
  title: string;
  category: "revenue" | "amc" | "customer_growth" | "fleet_expansion" | "operations";
  status: "active" | "paused" | "completed";
  progress: number;
  expected_impact: string;
  actual_impact?: string;
  budget: number;
  owner: string;
  success_probability: number;
}

/**
 * Initializes a new strategic initiative based on an approved recommendation, routing it to execution.
 */
export async function createStrategicInitiative(init: Initiative): Promise<{ success: boolean; initiativeId?: string }> {
  try {
    const db = await createClient();
    const { data, error } = await db
      .from("strategic_initiatives")
      .insert({
        title: init.title,
        category: init.category,
        status: init.status,
        progress: init.progress || 0.00,
        expected_impact: init.expected_impact,
        actual_impact: init.actual_impact || "",
        budget: init.budget || 0.00,
        owner: init.owner || "CEO",
        success_probability: init.success_probability || 90.00
      })
      .select("id")
      .maybeSingle();

    if (error || !data) throw error || new Error("Failed to insert initiative");

    // 1. Calculate alignment scores against active goals
    const { data: activeGoals } = await db.from("goals").select("id, title, category");
    if (activeGoals) {
      for (const g of activeGoals) {
        await calculateStrategicAlignment(
          data.id,
          g.id,
          init.title,
          init.category,
          g.title,
          g.category
        );
      }
    }

    // 2. Automate creation of execution commitment and granular task checklists
    const expectedImpactVal = init.title.toLowerCase().includes("amc") ? 25000 : init.title.toLowerCase().includes("webhook") ? 28000 : 3600;
    await createCommitmentFromInitiative(
      data.id,
      init.title,
      init.category === "revenue" ? "Revenue" : "Operations",
      expectedImpactVal
    );

    return { success: true, initiativeId: data.id };
  } catch (err: any) {
    console.error("Failed to create strategic initiative:", err.message);
    return { success: false };
  }
}

/**
 * Logs progress updates and runs outcome value verification upon completion.
 */
export async function trackInitiativeProgress(
  initiativeId: string,
  progressChange: number,
  notes: string
): Promise<boolean> {
  try {
    const db = await createClient();

    // 1. Log tracking update
    const { error: logErr } = await db
      .from("initiative_tracking")
      .insert({
        initiative_id: initiativeId,
        update_notes: notes,
        progress_change: progressChange
      });

    if (logErr) throw logErr;

    // 2. Fetch current progress
    const { data: current, error: getErr } = await db
      .from("strategic_initiatives")
      .select("progress")
      .eq("id", initiativeId)
      .maybeSingle();

    if (getErr || !current) throw getErr || new Error("Initiative not found");

    const newProgress = Math.min(100, Math.max(0, Number(current.progress || 0) + progressChange));

    // 3. Update initiative
    const { error: updErr } = await db
      .from("strategic_initiatives")
      .update({ 
        progress: newProgress,
        status: newProgress >= 100 ? "completed" : "active"
      })
      .eq("id", initiativeId);

    if (updErr) throw updErr;

    // 4. If initiative is completed, run value realization audits
    if (newProgress >= 100) {
      await trackValueRealization(initiativeId);
    }

    return true;
  } catch (err: any) {
    console.error("Failed to track initiative progress:", err.message);
    return false;
  }
}
