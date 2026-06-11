/**
 * GET/POST /api/settings
 * Interacts with settings_store in Supabase.
 * Degrades gracefully with empty defaults if migration is not yet run.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("settings_store")
      .select("*");

    if (error) {
      // Graceful degradation when table doesn't exist yet
      if (error.code === "42P01" || error.message.includes("does not exist")) {
        return NextResponse.json({ ok: true, settings: {} }, { status: 200 });
      }
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const settings: Record<string, any> = {};
    (data ?? []).forEach((row: any) => {
      settings[row.key] = row.value;
    });

    return NextResponse.json({ ok: true, settings }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ ok: false, error: "Missing key" }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Log setting modification in audit log if audit_logs table exists
    try {
      await supabase.from("audit_logs").insert({
        action: `UPDATE_SETTING_${key.toUpperCase()}`,
        entity: "settings_store",
        entity_id: null,
      });
    } catch {
      // ignore log failure if table not present yet
    }

    const { error } = await supabase
      .from("settings_store")
      .upsert({ key, value, updated_at: new Date().toISOString() });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { ok: true, message: `Setting '${key}' saved.` },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
