import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await createClient();

    const [
      { data: commitments, error: commError },
      { data: tasks, error: taskError },
      { data: probabilities, error: probError }
    ] = await Promise.all([
      db.from("execution_commitments").select("*").order("created_at", { ascending: false }),
      db.from("execution_tasks").select("*"),
      db.from("execution_probability_scores").select("*").order("calculated_at", { ascending: false })
    ]);

    if (commError) throw commError;
    if (taskError) throw taskError;
    if (probError) throw probError;

    const commList = commitments || [];
    const taskList = tasks || [];
    const probList = probabilities || [];

    const fullCommitments = commList.map((comm: any) => {
      const commTasks = taskList.filter((t: any) => t.commitment_id === comm.id);
      const latestProb = probList.find((p: any) => p.commitment_id === comm.id);

      return {
        ...comm,
        tasks: commTasks,
        probability: latestProb || {
          completion_probability: 75.00,
          delay_probability: 15.00,
          failure_probability: 10.00,
          confidence_score: 90.00,
          status: "On Track"
        }
      };
    });

    return NextResponse.json({ success: true, commitments: fullCommitments });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
