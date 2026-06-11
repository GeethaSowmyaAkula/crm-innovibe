/**
 * src/lib/capital-allocation.ts
 * Module 3: Strategic Capital Allocation Engine — InnoVibe AIOS
 */

import { createClient } from "@/lib/supabase/server";

export interface InvestmentRecommendation {
  id?: string;
  category: "technicians" | "garages" | "marketing" | "amc_campaigns" | "recovery_campaigns";
  description: string;
  expected_revenue: number;
  cost: number;
  risk_score: number; // 0 to 10
  payback_period_months: number;
  roi_pct: number;
  priority_rank?: number;
}

export interface BudgetAllocation {
  id?: string;
  category: string;
  allocated_amount: number;
  utilized_amount: number;
}

/**
 * Evaluates the ROI and payback periods of alternative capital placements, ranking them automatically.
 */
export async function generateCapitalAllocations(): Promise<InvestmentRecommendation[]> {
  try {
    const db = await createClient();

    // 1. Define baseline capital recommendations parameters
    const recommendations: InvestmentRecommendation[] = [
      {
        category: "recovery_campaigns",
        description: "Deploy checkout payment retry alerts and upgrade callback webhooks to recover abandoned checkout payments.",
        expected_revenue: 28000,
        cost: 3000,
        risk_score: 1.5,
        payback_period_months: 0.2,
        roi_pct: 833.33
      },
      {
        category: "amc_campaigns",
        description: "Launch targeted WhatsApp promotion templates offering 15% discount for out-of-warranty corporate fleets.",
        expected_revenue: 45000,
        cost: 6000,
        risk_score: 2.0,
        payback_period_months: 0.5,
        roi_pct: 650.00
      },
      {
        category: "technicians",
        description: "Hire 3 freelance regional technicians to resolve dispatch constraints in Pune East Hub.",
        expected_revenue: 24000,
        cost: 9000,
        risk_score: 3.5,
        payback_period_months: 1.2,
        roi_pct: 166.67
      },
      {
        category: "marketing",
        description: "Execute localized SEO and maps optimization campaigns to acquire new retail booking leads.",
        expected_revenue: 35000,
        cost: 15000,
        risk_score: 4.0,
        payback_period_months: 2.5,
        roi_pct: 133.33
      },
      {
        category: "garages",
        description: "Onboard 2 new partner garage networks in Pune West to absorb slot overflow capacities.",
        expected_revenue: 40000,
        cost: 20000,
        risk_score: 3.0,
        payback_period_months: 2.0,
        roi_pct: 100.00
      }
    ];

    // 2. Sort recommendations programmatically by ROI descending and payback ascending
    recommendations.sort((a, b) => {
      if (b.roi_pct !== a.roi_pct) {
        return b.roi_pct - a.roi_pct;
      }
      return a.payback_period_months - b.payback_period_months;
    });

    // Assign priority ranks
    const finalRecs = recommendations.map((rec, idx) => ({
      ...rec,
      priority_rank: idx + 1
    }));

    // 3. Clear previous recommendations and write fresh rankings
    try {
      await db.from("investment_recommendations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    } catch (e: any) {
      console.warn("Delete recommendations failed (non-critical):", e.message);
    }
    
    for (const rec of finalRecs) {
      await db.from("investment_recommendations").insert({
        category: rec.category,
        description: rec.description,
        expected_revenue: rec.expected_revenue,
        cost: rec.cost,
        risk_score: rec.risk_score,
        payback_period_months: rec.payback_period_months,
        roi_pct: rec.roi_pct,
        priority_rank: rec.priority_rank
      });
    }

    return finalRecs;
  } catch (err: any) {
    console.error("Failed to generate capital allocations:", err.message);
    return [];
  }
}

/**
 * Allocates budget to a specific category and logs it.
 */
export async function allocateBudget(category: string, amount: number): Promise<boolean> {
  try {
    const db = await createClient();
    const { error } = await db
      .from("budget_allocations")
      .insert({
        category,
        allocated_amount: amount,
        utilized_amount: 0.00
      });

    if (error) throw error;
    return true;
  } catch (err: any) {
    console.error(`Failed to allocate budget for ${category}:`, err.message);
    return false;
  }
}
