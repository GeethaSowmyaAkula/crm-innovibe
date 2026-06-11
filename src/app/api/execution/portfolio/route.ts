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

    // Seed default portfolio if empty
    if (!portfolios || portfolios.length === 0) {
      // Fetch some strategic initiatives to allocate
      const { data: initiatives } = await db.from("strategic_initiatives").select("id, budget");
      
      const { data: newPortfolio, error: portErr } = await db
        .from("initiative_portfolios")
        .insert({
          name: "Global Strategic Portfolio V1",
          description: "Primary corporate budget allocation tracking all CRM and marketing automation pipelines.",
          target_budget: 150000.00,
          allocated_budget: 65000.00,
          risk_profile: "medium"
        })
        .select("*")
        .maybeSingle();

      if (!portErr && newPortfolio) {
        portfolios = [newPortfolio];

        // Seed allocations
        if (initiatives && initiatives.length > 0) {
          for (let index = 0; index < initiatives.length; index++) {
            const init = initiatives[index];
            await db.from("portfolio_allocations").insert({
              portfolio_id: newPortfolio.id,
              initiative_id: init.id,
              allocated_budget: Number(init.budget || 5000.00),
              status: "active",
              acceleration_status: "none",
              impact_rank: index + 1
            });
          }
        }
      }
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
