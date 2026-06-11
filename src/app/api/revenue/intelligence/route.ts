/**
 * src/app/api/revenue/intelligence/route.ts
 * API Endpoint for Revenue Intelligence
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  calculateRevenueLeakages,
  calculateRevenueAttributions,
  calculateRevenueForecasts,
  calculateRevenueFlywheel,
  evaluateRevenueWarRoom,
  refreshRevenueIntelligence
} from "@/lib/revenue-intelligence";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await createClient();

    // 1. Fetch profiles
    const { data: profiles } = await db
      .from("customer_revenue_profiles")
      .select(`
        customer_id,
        total_spent,
        booking_count,
        clv,
        churn_risk_score,
        segment,
        amc_conversion_probability,
        revenue_value,
        growth_potential,
        referral_potential,
        retention_probability,
        customers (
          full_name,
          email,
          phone
        )
      `)
      .order("clv", { ascending: false });

    // 2. Fetch leakages
    const { data: leakages } = await db
      .from("revenue_leakage_detections")
      .select("*")
      .order("amount", { ascending: false });

    // 3. Fetch attributions
    const { data: attributions } = await db
      .from("revenue_attribution_metrics")
      .select("*")
      .order("impact_amount", { ascending: false });

    // 4. Fetch forecasts
    const forecasts = await calculateRevenueForecasts();

    // 5. Fetch flywheel state
    const flywheel = await calculateRevenueFlywheel();

    // 6. Evaluate War Room
    const warRoom = await evaluateRevenueWarRoom();

    return NextResponse.json({
      success: true,
      profiles: profiles || [],
      leakages: leakages || [],
      attributions: attributions || [],
      forecasts,
      flywheel,
      warRoom
    });
  } catch (err: any) {
    console.error("Revenue Intelligence GET Error:", err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const result = await refreshRevenueIntelligence();
    return NextResponse.json({
      success: true,
      message: "Revenue Intelligence metrics refreshed successfully.",
      details: result
    });
  } catch (err: any) {
    console.error("Revenue Intelligence POST Error:", err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
