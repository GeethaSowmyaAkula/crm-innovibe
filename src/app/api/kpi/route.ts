import { NextResponse } from "next/server";
import { getDynamicKPIs } from "@/lib/kpi";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const kpis = await getDynamicKPIs();
    return NextResponse.json({ ok: true, kpis }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
