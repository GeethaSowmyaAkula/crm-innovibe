/**
 * src/app/api/technician-productivity/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * REST API — GET /api/technician-productivity
 *
 * Query params:
 *   period  — "today" | "week" | "month"  (default: "week")
 *
 * Response: FleetProductivitySummary JSON
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import { getTechnicianProductivity } from "@/lib/technician-productivity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawPeriod = searchParams.get("period") ?? "week";

    const period =
      rawPeriod === "today" || rawPeriod === "week" || rawPeriod === "month"
        ? rawPeriod
        : "week";

    const data = await getTechnicianProductivity(period);

    return NextResponse.json(data, {
      status: 200,
      headers: {
        // Light cache: revalidate every 2 minutes in production
        "Cache-Control": "s-maxage=120, stale-while-revalidate=60",
      },
    });
  } catch (error: any) {
    console.error("[/api/technician-productivity] Error:", error);
    return NextResponse.json(
      { error: "Failed to compute productivity metrics", detail: error?.message },
      { status: 500 }
    );
  }
}
