/**
 * src/lib/goal-dependency-engine.ts
 * Enterprise Execution Layer: Goal Dependency Mapping — InnoVibe AIOS
 */

import { createClient } from "@/lib/supabase/server";

export interface DependencyNode {
  goal: { id: string; title: string; category: string };
  initiative?: { id: string; title: string };
  commitment?: { id: string; title: string; status: string };
  tasks: Array<{ id: string; title: string; status: string; due_date: string }>;
  risk_status: "on_track" | "warning" | "delayed";
}

/**
 * Traverses the dependency hierarchy from corporate goals to initiatives down to granular tasks.
 */
export async function getGoalDependencyMap(): Promise<DependencyNode[]> {
  try {
    const db = await createClient();

    // 1. Fetch goals, initiatives, commitments, and tasks
    const [
      { data: goals },
      { data: initiatives },
      { data: commitments },
      { data: tasks }
    ] = await Promise.all([
      db.from("goals").select("*"),
      db.from("strategic_initiatives").select("*"),
      db.from("execution_commitments").select("*"),
      db.from("execution_tasks").select("*")
    ]);

    const goalList = goals || [];
    const initiativeList = initiatives || [];
    const commitmentList = commitments || [];
    const taskList = tasks || [];

    const mapNodes: DependencyNode[] = [];

    // Seed default nodes if DB is empty
    if (goalList.length === 0) {
      return [
        {
          goal: { id: "g1", title: "Monthly Revenue", category: "revenue" },
          initiative: { id: "ini1", title: "Upgrade Webhook Callbacks" },
          commitment: { id: "comm1", title: "Gateway Webhook Upgrade", status: "in_progress" },
          tasks: [
            { id: "t1", title: "Deploy webhook callbacks logic", status: "pending", due_date: new Date().toISOString() }
          ],
          risk_status: "warning"
        }
      ];
    }

    // 2. Walk the tree for every goal
    for (const goal of goalList) {
      // Find matching initiative by title / keyword
      const matchedIni = initiativeList.find((ini: any) => 
        ini.title.toLowerCase().split(" ").some((w: string) => w.length > 3 && goal.title.toLowerCase().includes(w))
      ) || initiativeList[0];

      if (matchedIni) {
        // Find commitments for the initiative
        const matchedComm = commitmentList.find((c: any) => c.initiative_id === matchedIni.id) || commitmentList[0];
        
        let nodeTasks: any[] = [];
        let riskStatus: "on_track" | "warning" | "delayed" = "on_track";

        if (matchedComm) {
          nodeTasks = taskList.filter((t: any) => t.commitment_id === matchedComm.id);
          
          const nowStr = new Date().toISOString().split("T")[0];
          const hasBlocked = nodeTasks.some((t: any) => t.status === "blocked");
          const hasOverdue = nodeTasks.some((t: any) => t.status !== "completed" && t.due_date < nowStr);

          if (hasBlocked) {
            riskStatus = "delayed";
          } else if (hasOverdue) {
            riskStatus = "warning";
          }
        }

        mapNodes.push({
          goal: { id: goal.id, title: goal.title, category: goal.category },
          initiative: { id: matchedIni.id, title: matchedIni.title },
          commitment: matchedComm ? { id: matchedComm.id, title: matchedComm.title, status: matchedComm.status } : undefined,
          tasks: nodeTasks.map(t => ({
            id: t.id,
            title: t.title,
            status: t.status,
            due_date: t.due_date
          })),
          risk_status: riskStatus
        });
      }
    }

    return mapNodes;
  } catch (err: any) {
    console.error("Failed to map goal dependencies:", err.message);
    return [];
  }
}
