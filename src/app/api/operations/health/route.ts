import { NextResponse } from "next/server";
import { getOperationsHealthReport } from "@/lib/operations-health";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const report = await getOperationsHealthReport();
    return NextResponse.json({ ok: true, report });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
