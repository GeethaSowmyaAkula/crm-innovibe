import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { triggerPlaybook, approvePlaybook, completePlaybookExecution } from "@/lib/playbook-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();

    const [
      { data: playbooks },
      { data: executions }
    ] = await Promise.all([
      supabase.from("playbooks").select("*"),
      supabase
        .from("playbook_executions")
        .select(`
          *,
          playbook:playbooks(name, description)
        `)
        .order("created_at", { ascending: false })
    ]);

    return NextResponse.json({
      ok: true,
      playbooks: playbooks || [],
      executions: executions || []
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, playbookId, executionId, triggeredBy, approvedBy, expectedVal, actualVal, actualOutcome } = body;

    if (!action) {
      return NextResponse.json({ ok: false, error: "Missing action parameter" }, { status: 400 });
    }

    if (action === "trigger") {
      if (!playbookId || !triggeredBy) {
        return NextResponse.json({ ok: false, error: "Missing playbookId or triggeredBy" }, { status: 400 });
      }
      const res = await triggerPlaybook(playbookId, triggeredBy);
      return NextResponse.json(res);
    } 
    
    if (action === "approve") {
      if (!executionId || !approvedBy) {
        return NextResponse.json({ ok: false, error: "Missing executionId or approvedBy" }, { status: 400 });
      }
      const res = await approvePlaybook(executionId, approvedBy);
      return NextResponse.json(res);
    }

    if (action === "complete") {
      if (!executionId || expectedVal === undefined || actualVal === undefined) {
        return NextResponse.json({ ok: false, error: "Missing parameters for completion" }, { status: 400 });
      }
      const res = await completePlaybookExecution(executionId, expectedVal, actualVal, actualOutcome || "");
      return NextResponse.json(res);
    }

    return NextResponse.json({ ok: false, error: `Invalid action: ${action}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
