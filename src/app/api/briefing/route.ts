import { NextResponse } from "next/server";
import { getOrCreateExecutiveBriefing } from "@/lib/briefing";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const typeQuery = url.searchParams.get("type") || "daily";
    const type = ["daily", "weekly", "monthly"].includes(typeQuery) 
      ? (typeQuery as "daily" | "weekly" | "monthly") 
      : "daily";

    const briefing = await getOrCreateExecutiveBriefing(type);
    return NextResponse.json({ ok: true, briefing }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
