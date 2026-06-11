/**
 * /api/reminders
 * 
 * GET  — list reminders (with filters)
 * POST — create a reminder manually
 * PATCH — update status / automation_status (used by n8n)
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const status = searchParams.get("status");
  const automation_status = searchParams.get("automation_status");
  const limit = parseInt(searchParams.get("limit") ?? "100", 10);

  let query = supabase
    .from("reminder_queue")
    .select("*")
    .order("due_at", { ascending: true })
    .limit(limit);

  if (status) query = query.eq("status", status);
  if (automation_status) query = query.eq("automation_status", automation_status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from("reminder_queue")
    .insert([body])
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing reminder id" }, { status: 400 });
  }

  // Keep legacy sent_status in sync when status is updated
  if (updates.status && !updates.sent_status) {
    updates.sent_status = updates.status;
  }

  const { data, error } = await supabase
    .from("reminder_queue")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
