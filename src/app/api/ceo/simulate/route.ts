/**
 * src/app/api/ceo/simulate/route.ts
 * API Endpoint for CEO Simulation Engine
 */

import { NextResponse } from "next/server";
import { runCEOSimulation } from "@/lib/ceo-simulator";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const scenario = {
      amcConversionShift: Number(body.amcConversionShift ?? 0),
      techniciansDelta: Number(body.techniciansDelta ?? 0),
      complaintsMultiplier: Number(body.complaintsMultiplier ?? 1.0),
      revenueDeficitShift: Number(body.revenueDeficitShift ?? 0),
      newCityEntry: Boolean(body.newCityEntry ?? false),
      newServiceLaunch: Boolean(body.newServiceLaunch ?? false),
      amcPricingChange: Number(body.amcPricingChange ?? 0),
      marketingBudgetIncrease: Number(body.marketingBudgetIncrease ?? 0),
      garageNetworkExpansion: Number(body.garageNetworkExpansion ?? 0),
      acquisitionScenario: Boolean(body.acquisitionScenario ?? false)
    };

    const res = await runCEOSimulation(scenario);
    
    if (!res.success || !res.result) {
      throw new Error("Simulation run failed");
    }

    return NextResponse.json({
      success: true,
      result: res.result
    });
  } catch (err: any) {
    console.error("CEO Simulation API Error:", err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
