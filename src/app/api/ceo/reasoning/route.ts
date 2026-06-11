/**
 * src/app/api/ceo/reasoning/route.ts
 * API Endpoint for CEO Reasoning Engine
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runCEOReasoning } from "@/lib/ceo-reasoning";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await createClient();

    // Fetch latest reasoning output from DB if it exists, otherwise compute on the fly
    const { data: stored } = await db
      .from("ceo_reasoning_outputs")
      .select("*, session:ceo_reasoning_sessions(*)")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (stored) {
      return NextResponse.json({
        success: true,
        reasoning: stored
      });
    }

    const computed = await runCEOReasoning();
    return NextResponse.json({
      success: true,
      reasoning: computed
    });
  } catch (err: any) {
    console.error("CEO Reasoning GET Error:", err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const db = await createClient();

    // 1. Calculate fresh reasoning output
    const computed = await runCEOReasoning();

    // 2. Log reasoning session
    const { data: session, error: sessErr } = await db
      .from("ceo_reasoning_sessions")
      .insert({
        topic: "Weekly Executive Reasoning Audit",
        trigger_event: "Manual Refresh"
      })
      .select("id")
      .maybeSingle();

    if (sessErr) throw sessErr;

    // 3. Save reasoning output
    if (session) {
      await db
        .from("ceo_reasoning_outputs")
        .insert({
          session_id: session.id,
          executive_brief: computed.executive_brief,
          strategic_analysis: computed.strategic_analysis,
          recommended_actions: computed.recommended_actions,
          risk_analysis: computed.risk_analysis,
          growth_opportunities: computed.growth_opportunities,
          confidence_score: computed.confidence_score
        });
    }

    return NextResponse.json({
      success: true,
      message: "CEO Reasoning session completed and archived successfully.",
      reasoning: computed
    });
  } catch (err: any) {
    console.error("CEO Reasoning POST Error:", err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
