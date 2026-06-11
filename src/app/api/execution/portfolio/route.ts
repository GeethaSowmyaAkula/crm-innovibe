import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzePortfolio } from "@/lib/portfolio-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await createClient();

    // 1. Fetch portfolios
    let { data: portfolios } = await db
      .from("initiative_portfolios")
      .select("*")
      .order("created_at", { ascending: false });

    if (!portfolios || portfolios.length === 0) {
      portfolios = [];
    }

    const portList = portfolios || [];
    const fullPortfolios = [];

    for (const port of portList) {
      const rankings = await analyzePortfolio(port.id);
      fullPortfolios.push({
        ...port,
        rankings
      });
    }

    return NextResponse.json({ success: true, portfolios: fullPortfolios });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
