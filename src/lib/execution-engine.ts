/**
 * src/lib/execution-engine.ts
 * Enterprise Execution Layer — InnoVibe AIOS
 */

import { createClient } from "@/lib/supabase/server";

export interface ExecutionCommitment {
  id?: string;
  initiative_id: string;
  title: string;
  owner_department: string;
  owner_user: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  priority: "low" | "medium" | "high" | "critical";
  target_date: string;
  completion_date?: string;
  expected_impact: number;
  actual_impact: number;
}

export interface ExecutionTask {
  id?: string;
  commitment_id: string;
  title: string;
  description: string;
  assigned_to: string;
  status: "pending" | "in_progress" | "completed" | "blocked";
  progress: number;
  due_date: string;
  completed_at?: string;
}

export interface ExecutionHealth {
  execution_score: number;
  completion_rate: number;
  blocked_rate: number;
  overdue_rate: number;
}

/**
 * Creates an execution commitment from an approved initiative and populates granular tasks.
 */
export async function createCommitmentFromInitiative(
  initiativeId: string,
  title: string,
  department: string,
  expectedImpact: number
): Promise<{ success: boolean; commitmentId?: string }> {
  try {
    const db = await createClient();

    // 1. Insert commitment record
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 30); // 30 days default target

    const { data: commitment, error } = await db
      .from("execution_commitments")
      .insert({
        initiative_id: initiativeId,
        title,
        owner_department: department,
        owner_user: department === "Revenue" ? "Siddharth (Revenue Head)" : "Deepak (Ops Manager)",
        status: "in_progress",
        priority: expectedImpact >= 25000 ? "high" : "medium",
        target_date: targetDate.toISOString().split("T")[0],
        expected_impact: expectedImpact,
        actual_impact: 0.00
      })
      .select("id")
      .maybeSingle();

    if (error || !commitment) throw error || new Error("Insert failed");

    // 2. Generate standard execution tasks for the commitment
    const tasks = [
      {
        title: "Define operational checklist & playbook rules",
        description: "Specify thresholds, regional coordinators, and telemetry filters.",
        assigned_to: "Deepak (Ops Manager)",
        due_date: 7
      },
      {
        title: "Deploy automation campaign templates",
        description: "Configure SMS, WhatsApp API payload, and gateway webhook checks.",
        assigned_to: "Rohan (Tech Lead)",
        due_date: 14
      },
      {
        title: "Run pilot verification cycles",
        description: "Verify that test executions match target SLA bounds.",
        assigned_to: "Priya (QA Engineer)",
        due_date: 21
      }
    ];

    for (const task of tasks) {
      const taskDueDate = new Date();
      taskDueDate.setDate(taskDueDate.getDate() + task.due_date);

      await db.from("execution_tasks").insert({
        commitment_id: commitment.id,
        title: task.title,
        description: task.description,
        assigned_to: task.assigned_to,
        status: "pending",
        progress: 0.00,
        due_date: taskDueDate.toISOString().split("T")[0]
      });
    }

    return { success: true, commitmentId: commitment.id };
  } catch (err: any) {
    console.error("Failed to create execution commitment:", err.message);
    return { success: false };
  }
}

/**
 * Calculates current execution health scores based on task statuses and targets.
 */
export async function calculateExecutionScore(): Promise<ExecutionHealth> {
  try {
    const db = await createClient();

    // 1. Fetch all tasks
    const { data: dbTasks } = await db.from("execution_tasks").select("*");
    const tasks: ExecutionTask[] = dbTasks || [];

    if (tasks.length === 0) {
      return { execution_score: 95.00, completion_rate: 0.00, blocked_rate: 0.00, overdue_rate: 0.00 };
    }

    const completed = tasks.filter((t: any) => t.status === "completed").length;
    const blocked = tasks.filter((t: any) => t.status === "blocked").length;
    
    const nowStr = new Date().toISOString().split("T")[0];
    const overdue = tasks.filter((t: any) => t.status !== "completed" && t.due_date < nowStr).length;

    const completionRate = (completed / tasks.length) * 100;
    const blockedRate = (blocked / tasks.length) * 100;
    const overdueRate = (overdue / tasks.length) * 100;

    // Execution score deductions: -1.5 per blocked%, -2.0 per overdue%
    const score = Math.max(0, Math.min(100, 100 - (blockedRate * 1.5) - (overdueRate * 2.0)));

    const result = {
      execution_score: Number(score.toFixed(2)),
      completion_rate: Number(completionRate.toFixed(2)),
      blocked_rate: Number(blockedRate.toFixed(2)),
      overdue_rate: Number(overdueRate.toFixed(2))
    };

    // Log snapshot
    await db.from("execution_health_snapshots").insert({
      execution_score: result.execution_score,
      completion_rate: result.completion_rate,
      blocked_rate: result.blocked_rate,
      overdue_rate: result.overdue_rate
    });

    return result;
  } catch (err: any) {
    console.error("Failed to calculate execution health score:", err.message);
    return { execution_score: 95.00, completion_rate: 0.00, blocked_rate: 0.00, overdue_rate: 0.00 };
  }
}

/**
 * Audits commitments and identifies stalled strategic initiatives.
 */
export async function detectStalledInitiatives(): Promise<any[]> {
  try {
    const db = await createClient();

    // Query commitments with critical parameters
    const { data: commitments } = await db
      .from("execution_commitments")
      .select("*, tasks:execution_tasks(*)");

    if (!commitments) return [];

    return commitments.filter((c: any) => {
      const tasksList = c.tasks || [];
      const hasBlocked = tasksList.some((t: any) => t.status === "blocked");
      
      const nowStr = new Date().toISOString().split("T")[0];
      const hasOverdue = tasksList.some((t: any) => t.status !== "completed" && t.due_date < nowStr);
      
      return hasBlocked || hasOverdue || c.status === "failed";
    });
  } catch (err: any) {
    console.error("Failed to audit stalled initiatives:", err.message);
    return [];
  }
}
