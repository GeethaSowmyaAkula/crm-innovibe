/**
 * POST /api/sync-reminders
 * Triggers a sync of completed Laravel bookings → Supabase reminder_queue.
 * 
 * Called by:
 * - n8n cron workflow (before processing reminders)
 * - Manual trigger from CRM settings / dashboard
 * - Future: Next.js cron route (vercel cron / etc.)
 * 
 * GET /api/sync-reminders  → returns last sync result from Supabase metadata
 */

import { NextResponse } from "next/server";
import { syncCompletedBookingsToReminders } from "@/lib/sync/booking-reminder";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // allow up to 60s for large booking sets

export async function POST() {
  try {
    const result = await syncCompletedBookingsToReminders();

    return NextResponse.json(
      {
        ok: true,
        message: `Sync complete. Created ${result.created} new reminders.`,
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
  // Allow a quick health-check / dry-run info response
  return NextResponse.json({
    ok: true,
    info: "POST to this endpoint to trigger booking → reminder sync.",
    endpoint: "/api/sync-reminders",
  });
}
