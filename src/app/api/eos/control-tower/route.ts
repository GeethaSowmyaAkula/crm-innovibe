/**
 * src/app/api/eos/control-tower/route.ts
 * EOS API: CEO Control Tower
 */

import { NextResponse } from "next/server";
import { evaluateControlTower } from "@/lib/ceo-control-tower";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await evaluateControlTower();
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error("[EOS/control-tower] Error:", err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
