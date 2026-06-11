/**
 * /api/feedback
 * 
 * GET  — list feedback survey queue items
 * PATCH — update survey details, responses, ratings, status, and automation state
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const status = searchParams.get("status");
  const automation_status = searchParams.get("automation_status");
  const escalation_required = searchParams.get("escalation_required");
  const limit = parseInt(searchParams.get("limit") ?? "100", 10);

  let query = supabase
    .from("feedback_queue")
    .select("*")
    .order("due_at", { ascending: true })
    .limit(limit);

  if (status) query = query.eq("status", status);
  if (automation_status) query = query.eq("automation_status", automation_status);
  
  if (escalation_required !== null && escalation_required !== undefined) {
    query = query.eq("escalation_required", escalation_required === "true");
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing feedback record id" }, { status: 400 });
  }

  // ── AI/Rating logic ───────────────────────────────────────────────────
  // If feedback_rating is provided in the updates, automatically:
  // 1. Set replied_at timestamp
  // 2. Determine escalation_required based on rating
  if (updates.feedback_rating !== undefined && updates.feedback_rating !== null) {
    const rating = Number(updates.feedback_rating);
    updates.replied_at = new Date().toISOString();
    
    if (rating <= 3) {
      updates.escalation_required = true;
    } else {
      updates.escalation_required = false;
    }
  }

  const { data, error } = await supabase
    .from("feedback_queue")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
