/**
 * src/app/api/eos/horizons/route.ts
 * EOS API: Strategic Horizons
 *
 * GET  /api/eos/horizons       — returns current horizon projections (30d/90d/365d)
 * POST /api/eos/horizons       — re-generates all horizon projections
 */

import { NextResponse } from "next/server";
import {
  generateStrategicHorizon,
  getHorizonSummary,
} from "@/lib/strategic-horizon";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const summary = await getHorizonSummary();
    return NextResponse.json({ success: true, data: summary });
  } catch (err: any) {
    console.error("[EOS/horizons] GET Error:", err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const result = await generateStrategicHorizon();
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error("[EOS/horizons] POST Error:", err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
