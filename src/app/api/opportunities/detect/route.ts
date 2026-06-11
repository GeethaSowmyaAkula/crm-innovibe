import { NextResponse } from "next/server";
import { runOpportunityScan } from "@/lib/opportunity-engine";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const report = await runOpportunityScan();
    return NextResponse.json({
      ok: true,
      message: "Opportunity engine scan completed successfully.",
      report
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
