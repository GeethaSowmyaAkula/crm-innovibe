/**
 * POST /api/sync-retry
 * Triggers retry execution on all failed sync records.
 */

import { NextResponse } from "next/server";
import { retryFailedSyncs } from "@/lib/sync/core-sync";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const report = await retryFailedSyncs();
    return NextResponse.json({
      ok: true,
      message: "Sync retry sequence completed.",
      report
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err.message
    }, { status: 500 });
  }
}
