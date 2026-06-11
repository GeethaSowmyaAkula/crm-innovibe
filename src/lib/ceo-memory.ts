/**
 * src/lib/ceo-memory.ts
 * AI CEO Memory Engine — InnoVibe AIOS
 */

import { createClient } from "@/lib/supabase/server";

export interface CEOMemory {
  id?: string;
  memory_type: "decision_note" | "board_resolution" | "playbook_outcome" | "lesson_learned";
  title: string;
  decision_text: string;
  reasoning?: string;
  expected_outcome?: string;
  actual_outcome?: string;
  success_score?: number;
  lessons_learned?: string;
  related_kpis?: string[];
  related_departments?: string[];
  related_decisions?: string[];
}

/**
 * Records a new executive decision or board resolution into CEO memory.
 */
export async function recordMemory(m: CEOMemory): Promise<{ success: boolean; memoryId?: string }> {
  try {
    const db = await createClient();
    const { data, error } = await db
      .from("ceo_memory")
      .insert({
        memory_type: m.memory_type,
        title: m.title,
        decision_text: m.decision_text,
        reasoning: m.reasoning || "",
        expected_outcome: m.expected_outcome || "",
        actual_outcome: m.actual_outcome || "",
        success_score: m.success_score || 100.00,
        lessons_learned: m.lessons_learned || "",
        related_kpis: m.related_kpis || [],
        related_departments: m.related_departments || [],
        related_decisions: m.related_decisions || []
      })
      .select("id")
      .maybeSingle();

    if (error) throw error;
    return { success: true, memoryId: data?.id };
  } catch (err: any) {
    console.error("Failed to record CEO Memory:", err.message);
    return { success: false };
  }
}

/**
 * Performs key-phrase search and tag queries over stored executive memories.
 */
export async function searchMemories(
  query: string,
  filter?: { department?: string; kpi?: string }
): Promise<CEOMemory[]> {
  try {
    const db = await createClient();
    let q = db.from("ceo_memory").select("*");

    if (filter?.department) {
      q = q.filter("related_departments", "cs", `["${filter.department}"]`);
    }
    if (filter?.kpi) {
      q = q.filter("related_kpis", "cs", `["${filter.kpi}"]`);
    }

    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) throw error;

    const memories: CEOMemory[] = data || [];
    
    // Apply local word-matching search filter if query is provided
    if (query && query.trim() !== "") {
      const words = query.toLowerCase().split(" ").filter(w => w.length > 2);
      return memories.filter(m => 
        words.some(w => 
          m.title.toLowerCase().includes(w) || 
          m.decision_text.toLowerCase().includes(w) ||
          m.lessons_learned?.toLowerCase().includes(w)
        )
      );
    }

    return memories;
  } catch (err: any) {
    console.error("Failed to query CEO Memories:", err.message);
    return [];
  }
}

/**
 * Scans previous decisions in the audit trail. For any outcome where success_score < 70%,
 * it registers a learning card in ceo_lessons to prevent repeating past mistakes.
 */
export async function deriveLessons(): Promise<{ success: boolean; lessonsAdded: number }> {
  try {
    const db = await createClient();

    // Query decisions with low success scores
    const [
      { data: auditLogs },
      { data: existingLessons }
    ] = await Promise.all([
      db.from("decision_audit_trail").select("*").lt("success_score", 70.00),
      db.from("ceo_lessons").select("failure_signature")
    ]);

    const logs = auditLogs || [];
    const currentLessons = existingLessons || [];
    const activeSignatures = new Set(currentLessons.map((l: any) => l.failure_signature));

    let lessonsAdded = 0;

    for (const log of logs) {
      // Create a unique failure signature based on recommendation title
      const sig = log.recommendation_title.toLowerCase().replace(/[^a-z0-9]/g, "_");
      
      if (!activeSignatures.has(sig)) {
        // 1. Create a memory entry for this lesson
        const memoryRes = await recordMemory({
          memory_type: "lesson_learned",
          title: `Failure Audit: ${log.recommendation_title}`,
          decision_text: `Decision approved by ${log.decision_maker} resulted in a low success score (${log.success_score}%).`,
          reasoning: log.reason || "Underperformed expected targets.",
          expected_outcome: log.expected_outcome || "Positive target growth",
          actual_outcome: log.actual_outcome || "KPI target missed",
          success_score: log.success_score,
          lessons_learned: `Avoid waves or waivers in target execution without securing gateway confirmations first. Retrain mechanics to avoid regional bottlenecks.`,
          related_departments: ["Operations", "Finance"],
          related_kpis: ["Customer Satisfaction", "Monthly Revenue"]
        });

        if (memoryRes.success && memoryRes.memoryId) {
          // 2. Insert into ceo_lessons
          const { error } = await db
            .from("ceo_lessons")
            .insert({
              memory_id: memoryRes.memoryId,
              failure_signature: sig,
              lesson: `Avoid launching campaigns without securing active slots capacity. Waiving fees on cancellations without gatelocks leads to leakage.`,
              preventative_action: `Enforce mandatory capacity forecast checks and gateway checkout retry rules.`,
              frequency_count: 1
            });

          if (!error) lessonsAdded++;
        }
      } else {
        // Increment frequency count of existing failure signature
        try {
          await db.rpc("increment_lesson_frequency", { signature: sig });
        } catch {
          // Fallback if RPC doesn't exist
          await db.from("ceo_lessons")
            .update({ frequency_count: 2 })
            .eq("failure_signature", sig);
        }
      }
    }

    return { success: true, lessonsAdded };
  } catch (err: any) {
    console.error("Failed to derive CEO lessons:", err.message);
    return { success: false, lessonsAdded: 0 };
  }
}
