import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await createClient();

    const { data: blockers, error } = await db
      .from("execution_blockers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, blockers: blockers || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const db = await createClient();
    const body = await req.json();

    const { data: newBlocker, error } = await db
      .from("execution_blockers")
      .insert({
        commitment_id: body.commitment_id,
        blocker_type: body.blocker_type || "operational",
        severity: body.severity || "medium",
        description: body.description,
        suggested_resolution: body.suggested_resolution || "Escalate for manual dispatch rebalancing.",
        status: "active"
      })
      .select("*")
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ success: true, blocker: newBlocker });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
