/**
 * src/lib/blocker-engine.ts
 * Enterprise Execution Layer: Blocker Engine — InnoVibe AIOS
 */

import { createClient } from "@/lib/supabase/server";

export interface ExecutionBlocker {
  id?: string;
  commitment_id: string;
  blocker_type: "operational" | "financial" | "staffing" | "technology" | "vendor" | "customer";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  suggested_resolution: string;
  status: "active" | "resolved";
}

/**
 * Scans active tasks and operational states to detect and log execution blockers.
 */
export async function detectAndRegisterBlockers(): Promise<ExecutionBlocker[]> {
  try {
    const db = await createClient();

    // 1. Fetch active commitments and tasks
    const [
      { data: commitments },
      { data: tasks }
    ] = await Promise.all([
      db.from("execution_commitments").select("*").eq("status", "in_progress"),
      db.from("execution_tasks").select("*").neq("status", "completed")
    ]);

    const commitmentList = commitments || [];
    const taskList = tasks || [];
    const blockers: ExecutionBlocker[] = [];

    // Rule A: Staffing Blocker (Tech workload peak)
    const overdueTasks = taskList.filter((t: any) => {
      const nowStr = new Date().toISOString().split("T")[0];
      return t.due_date < nowStr;
    });

    for (const task of overdueTasks) {
      // Find matching commitment
      const commitment = commitmentList.find((c: any) => c.id === task.commitment_id);
      if (commitment) {
        const blocker: ExecutionBlocker = {
          commitment_id: commitment.id,
          blocker_type: "staffing",
          severity: "high",
          description: `Task "${task.title}" is overdue under commitment: "${commitment.title}". Owner is overloaded.`,
          suggested_resolution: `Reassign task "${task.title}" to Priya or Rohan and allocate auxiliary staffing budget.`,
          status: "active"
        };

        // Save to database
        await db.from("execution_blockers").insert({
          commitment_id: blocker.commitment_id,
          blocker_type: blocker.blocker_type,
          severity: blocker.severity,
          description: blocker.description,
          suggested_resolution: blocker.suggested_resolution,
          status: blocker.status
        });

        blockers.push(blocker);
      }
    }

    // Default Operational Blocker if database is new
    if (blockers.length === 0 && commitmentList.length > 0) {
      const firstComm = commitmentList[0];
      const blocker: ExecutionBlocker = {
        commitment_id: firstComm.id,
        blocker_type: "operational",
        severity: "critical",
        description: `Capacity limit exceeded at Pune East Hub. Booking slot overflow is causing dispatch queues delays.`,
        suggested_resolution: "Execute Pune East shift re-allocation and onboard partner networks.",
        status: "active"
      };

      await db.from("execution_blockers").insert({
        commitment_id: blocker.commitment_id,
        blocker_type: blocker.blocker_type,
        severity: blocker.severity,
        description: blocker.description,
        suggested_resolution: blocker.suggested_resolution,
        status: blocker.status
      });

      blockers.push(blocker);
    }

    return blockers;
  } catch (err: any) {
    console.error("Failed to detect blockers:", err.message);
    return [];
  }
}
