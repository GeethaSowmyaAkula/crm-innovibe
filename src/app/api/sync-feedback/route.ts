/**
 * POST /api/sync-feedback
 * Triggers a sync of completed Laravel bookings → Supabase feedback_queue.
 * 
 * Called by:
 * - n8n cron workflow (before checking feedback queue)
 * - Manual trigger from CRM settings / dashboard / feedback console
 */

import { NextResponse } from "next/server";
import { syncCompletedBookingsToFeedback } from "@/lib/sync/feedback-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // allow up to 60s for large booking sets

export async function POST() {
  try {
    const result = await syncCompletedBookingsToFeedback();

    return NextResponse.json(
      {
        ok: true,
        message: `Sync complete. Created ${result.created} new feedback tasks.`,
        result,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    info: "POST to this endpoint to trigger booking → feedback survey sync.",
    endpoint: "/api/sync-feedback",
  });
}
