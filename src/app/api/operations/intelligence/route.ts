import { NextResponse } from "next/server";
import { detectBottlenecks } from "@/lib/bottleneck-intelligence";
import { detectOperationalPatterns } from "@/lib/pattern-intelligence";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [bottlenecks, patterns] = await Promise.all([
      detectBottlenecks(),
      detectOperationalPatterns()
    ]);

    return NextResponse.json({
      ok: true,
      bottlenecks,
      patterns
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
