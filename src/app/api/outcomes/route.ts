import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();

    const [decisionRes, campaignRes, automationRes] = await Promise.all([
      supabase.from("decision_outcomes").select("*, decision_recommendations(title)").order("created_at", { ascending: false }),
      supabase.from("campaign_outcomes").select("*").order("created_at", { ascending: false }),
      supabase.from("automation_outcomes").select("*, automation_executions(automation_rules(name))").order("created_at", { ascending: false })
    ]);

    return NextResponse.json({
      ok: true,
      decisionOutcomes: decisionRes.data || [],
      campaignOutcomes: campaignRes.data || [],
      automationOutcomes: automationRes.data || []
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

    // Compute success score capped at 100
    // Success Score = Actual Result / Expected Result * 100
    let successScore = 0.00;
    if (payload.success_score !== undefined) {
      successScore = Math.min(100.00, Number(payload.success_score));
    } else if (payload.actual_numeric !== undefined && payload.expected_numeric !== undefined) {
      const expected = Number(payload.expected_numeric);
      if (expected > 0) {
        successScore = Math.min(100.00, (Number(payload.actual_numeric) / expected) * 100);
      }
    }

    const commonData = {
      expected_result: payload.expected_result || "N/A",
      actual_result: payload.actual_result || "N/A",
      variance: payload.variance || "N/A",
      success_score: Number(successScore.toFixed(2))
    };

    if (type === "decision") {
      if (!payload.recommendation_id) {
        return NextResponse.json({ ok: false, error: "Missing recommendation_id" }, { status: 400 });
      }
      const { data, error } = await supabase
        .from("decision_outcomes")
        .insert({
          recommendation_id: payload.recommendation_id,
          ...commonData
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ ok: true, message: "Decision Outcome recorded.", data });
    }

    if (type === "campaign") {
      if (!payload.campaign_name) {
        return NextResponse.json({ ok: false, error: "Missing campaign_name" }, { status: 400 });
      }
      const { data, error } = await supabase
        .from("campaign_outcomes")
        .insert({
          campaign_name: payload.campaign_name,
          ...commonData
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ ok: true, message: "Campaign Outcome recorded.", data });
    }

    if (type === "automation") {
      if (!payload.execution_id) {
        return NextResponse.json({ ok: false, error: "Missing execution_id" }, { status: 400 });
      }
      const { data, error } = await supabase
        .from("automation_outcomes")
        .insert({
          execution_id: payload.execution_id,
          ...commonData
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ ok: true, message: "Automation Outcome recorded.", data });
    }

    return NextResponse.json({ ok: false, error: "Invalid outcome type" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
