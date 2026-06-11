import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();

    const [notesRes, boardRes, strategyRes] = await Promise.all([
      supabase.from("executive_notes").select("*").order("created_at", { ascending: false }),
      supabase.from("board_decisions").select("*").order("created_at", { ascending: false }),
      supabase.from("strategic_decisions").select("*").order("created_at", { ascending: false })
    ]);

    return NextResponse.json({
      ok: true,
      notes: notesRes.data || [],
      boardDecisions: boardRes.data || [],
      strategicDecisions: strategyRes.data || []
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, payload } = body;

    if (!type || !payload) {
      return NextResponse.json({ ok: false, error: "Missing type or payload" }, { status: 400 });
    }

    const supabase = await createClient();

    if (type === "note") {
      const { data, error } = await supabase
        .from("executive_notes")
        .insert({
          title: payload.title || "Executive Note",
          content: payload.content || ""
        })
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ ok: true, message: "Executive Note saved.", data });
    } 
    
    if (type === "board") {
      const { data, error } = await supabase
        .from("board_decisions")
        .insert({
          title: payload.title || "Board Resolution",
          description: payload.description || "",
          meeting_date: payload.meeting_date || new Date().toISOString().split("T")[0],
          resolutions: payload.resolutions || []
        })
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ ok: true, message: "Board Decision recorded.", data });
    }

    if (type === "strategy") {
      const { data, error } = await supabase
        .from("strategic_decisions")
        .insert({
          title: payload.title || "Strategic Initiative",
          description: payload.description || "",
          rationale: payload.rationale || "",
          expected_impact: payload.expected_impact || "",
          status: payload.status || "planned"
        })
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ ok: true, message: "Strategic Decision implemented.", data });
    }

    return NextResponse.json({ ok: false, error: "Invalid memory type" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
