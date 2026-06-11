import { NextResponse } from "next/server";
import { getRelationshipInsights } from "@/lib/relationship-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const insights = await getRelationshipInsights();
    return NextResponse.json({ ok: true, insights }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
