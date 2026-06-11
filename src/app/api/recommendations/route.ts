/**
 * POST /api/recommendations
 * Handles executive actions from the CEO Cockpit decision panel.
 * Actions: approve, dismiss, convert
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publishEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json({ ok: false, error: "Missing recommendation ID or action" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Fetch recommendation
    const { data: rec, error: fetchErr } = await supabase
      .from("decision_recommendations")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !rec) {
      return NextResponse.json({ 
        ok: false, 
        error: `Recommendation #${id} not found.` 
      }, { status: 404 });
    }

    let message = "";
    
    // 2. Process specific action
    if (action === "approve") {
      // Update recommendation status to approved/executed
      await supabase
        .from("decision_recommendations")
        .update({ status: "approved", actioned_at: new Date().toISOString() })
        .eq("id", id);
      
      // Log to decision audit trail
      try {
        await supabase.from("decision_audit_trail").insert({
          recommendation_id: id,
          recommendation_title: rec.title,
          decision_maker: "CEO",
          reason: rec.rationale || "Direct approval",
          expected_outcome: `Expected Revenue: ₹${rec.expected_revenue || 0}`,
          success_score: 100.00
        });
      } catch (e) {}

      message = `Approved and executed recommendation: "${rec.title}"`;

      // Log activity
      await publishEvent("RECOMMENDATION_APPROVED", "decision_recommendation", id, {
        title: rec.title,
        action: "approve"
      }, "decision_engine");

    } else if (action === "dismiss") {
      await supabase
        .from("decision_recommendations")
        .update({ status: "dismissed", actioned_at: new Date().toISOString() })
        .eq("id", id);

      message = `Dismissed recommendation: "${rec.title}"`;

    } else if (action === "convert") {
      // 1. Create a task in tasks table
      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .insert({
          title: `Executive Action: ${rec.title}`,
          description: `${rec.description}\n\nRationale: ${rec.rationale}`,
          status: "pending",
          priority: "high",
          source: "decision_engine",
          source_id: id,
          approval_required: true
        })
        .select()
        .single();

      if (taskError) {
        return NextResponse.json({ ok: false, error: `Task creation failed: ${taskError.message}` }, { status: 500 });
      }

      // 2. Link recommendation to task & approve
      await supabase
        .from("decision_recommendations")
        .update({ status: "approved", actioned_at: new Date().toISOString() })
        .eq("id", id);

      // Log to decision audit trail
      try {
        await supabase.from("decision_audit_trail").insert({
          recommendation_id: id,
          recommendation_title: rec.title,
          decision_maker: "CEO",
          reason: `Converted to Task #${task.id.substring(0, 8)}: ${rec.rationale}`,
          expected_outcome: `Task implementation of: ${rec.description}`,
          success_score: 100.00
        });
      } catch (e) {}

      message = `Converted recommendation to Task #${task.id.substring(0, 8)}`;

      // Log activity
      await publishEvent("RECOMMENDATION_CONVERTED_TO_TASK", "decision_recommendation", id, {
        title: rec.title,
        task_id: task.id
      }, "decision_engine");
    }

    return NextResponse.json({ ok: true, message }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
