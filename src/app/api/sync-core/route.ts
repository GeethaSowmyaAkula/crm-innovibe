/**
 * POST /api/sync-core
 * Triggers the master sync cache layer updating all customers, vehicles, bookings, and garages.
 */

import { NextResponse } from "next/server";
import { runMasterSync } from "@/lib/sync/core-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // 2 minute timeout limit for full fetch upsert runs

export async function POST() {
  try {
    const report = await runMasterSync();
    
    return NextResponse.json({
      ok: true,
      message: "Master sync execution complete.",
      report
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err.message
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    info: "POST to this route to run the Laravel -> AIOS master sync daemon."
  });
}
