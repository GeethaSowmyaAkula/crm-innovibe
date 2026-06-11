/**
 * src/lib/ceo-simulator.ts
 * CEO Simulation Engine V2 — InnoVibe AIOS
 */

import { createClient } from "@/lib/supabase/server";

export interface SimulationScenario {
  amcConversionShift: number; // percentage change (e.g. +10, -5)
  techniciansDelta: number; // count change (e.g. +5, -2)
  complaintsMultiplier: number; // multiplier (e.g. 1.0, 2.0)
  revenueDeficitShift: number; // percentage change (e.g. -20, +10)
  newCityEntry: boolean;
  newServiceLaunch?: boolean;
  amcPricingChange?: number; // pricing change delta (e.g. +500, -200)
  marketingBudgetIncrease?: number; // budget delta (e.g. +10000)
  garageNetworkExpansion?: number; // number of garages added (e.g. +2)
  acquisitionScenario?: boolean;
}

export interface HorizonMetrics {
  revenue: number;
  profit: number;
  operations_health: number;
  capacity: number;
  churn: number;
  growth: number;
  risk: number;
}

export interface SimulationResult {
  revenue_impact: number;
  operational_impact: string;
  growth_impact: string;
  risk_impact: string;
  confidence_score: number;
  horizons: {
    "30d": HorizonMetrics;
    "90d": HorizonMetrics;
    "365d": HorizonMetrics;
  };
}

/**
 * Runs a simulated digital twin calculation modeling high-level strategic changes.
 */
export async function runCEOSimulation(
  s: SimulationScenario
): Promise<{ success: boolean; result?: SimulationResult }> {
  try {
    const db = await createClient();

    const baselineRevenue = 12000;
    let simulatedRevenue = baselineRevenue;
    let opsImpact = "Operations stable inside standard dispatch SLA timelines.";
    let groImpact = "Growth trajectory normal (+3.2% month-on-month).";
    let riskImpact = "Risk index low (Green). No critical bottlenecks.";
    let confidence = 92.00;

    // 1. Process standard variables
    if (s.amcConversionShift !== 0) {
      const shiftValue = (baselineRevenue * 0.15) * (s.amcConversionShift / 100);
      simulatedRevenue += shiftValue;
      groImpact = `AMC Protection rate shifts, projecting ${s.amcConversionShift > 0 ? "+" : ""}${s.amcConversionShift}% covered vehicles. Adds ₹${Math.abs(shiftValue).toFixed(0)} recurring value.`;
    }

    if (s.techniciansDelta !== 0) {
      const costChange = s.techniciansDelta * 3000;
      simulatedRevenue -= costChange;
      if (s.techniciansDelta > 0) {
        opsImpact = `Adding ${s.techniciansDelta} technicians reduces Pune East dispatch delays by 45%.`;
        riskImpact = "Technician assignment bottlenecks resolved (Green).";
      } else {
        opsImpact = `Reducing ${Math.abs(s.techniciansDelta)} technicians increases ticket queue density.`;
        riskImpact = "Critical technician overload risk flagged (Crimson).";
      }
    }

    if (s.complaintsMultiplier > 1.0) {
      const churnRateIncrease = (s.complaintsMultiplier - 1.0) * 15;
      const churnLoss = baselineRevenue * (churnRateIncrease / 100) * 0.8;
      simulatedRevenue -= churnLoss;
      opsImpact += ` Support tickets surge by ${((s.complaintsMultiplier - 1) * 100).toFixed(0)}%.`;
      riskImpact = `Customer churn risk climbs by ${churnRateIncrease.toFixed(1)}%. Projected loss of -₹${churnLoss.toFixed(0)}.`;
      confidence -= 10;
    }

    if (s.revenueDeficitShift < 0) {
      const dropAmount = baselineRevenue * (Math.abs(s.revenueDeficitShift) / 100);
      simulatedRevenue -= dropAmount;
      riskImpact += ` Severe transaction decline matches target deficits. Triggers immediate Revenue War Room Mode.`;
      confidence -= 5;
    }

    if (s.newCityEntry) {
      const setupBudget = 50000;
      const predictedInflow = 65000;
      simulatedRevenue += (predictedInflow - setupBudget);
      groImpact += " Market expansion to Bangalore active. Adds +120 new fleet leads.";
      opsImpact += " Requires dispatch routing configuration for regional partner garages.";
      confidence -= 8;
    }

    // 2. Process V2 variables
    if (s.newServiceLaunch) {
      const devCost = 15000;
      const inflow = 30000;
      simulatedRevenue += (inflow - devCost);
      groImpact += " New emergency roadside assistance service launch. Promotes +15% conversion.";
      confidence -= 5;
    }

    if (s.amcPricingChange && s.amcPricingChange !== 0) {
      const amcUserCount = 42;
      const deltaVal = amcUserCount * s.amcPricingChange;
      simulatedRevenue += deltaVal;
      groImpact += ` AMC pricing modified by ₹${s.amcPricingChange > 0 ? "+" : ""}${s.amcPricingChange} per contract.`;
      if (s.amcPricingChange > 0) {
        riskImpact += " Higher pricing could cause a slight churn increase (approx 4%).";
      }
    }

    if (s.marketingBudgetIncrease && s.marketingBudgetIncrease > 0) {
      const acqRevenue = s.marketingBudgetIncrease * 2.2; // 2.2x marketing ROI
      simulatedRevenue += (acqRevenue - s.marketingBudgetIncrease);
      groImpact += ` Marketing budget increased by ₹${s.marketingBudgetIncrease.toLocaleString("en-IN")}. Adds booking inflow.`;
    }

    if (s.garageNetworkExpansion && s.garageNetworkExpansion > 0) {
      const setupCost = s.garageNetworkExpansion * 8000;
      const capRevenue = s.garageNetworkExpansion * 15000;
      simulatedRevenue += (capRevenue - setupCost);
      opsImpact += ` Onboarding ${s.garageNetworkExpansion} new partner garages. Increases diagnostic capacity by ${s.garageNetworkExpansion * 20} slots/day.`;
    }

    if (s.acquisitionScenario) {
      const cost = 80000;
      const inflow = 120000;
      simulatedRevenue += (inflow - cost);
      groImpact += " Strategic acquisition of regional fleet repair competitor. Expands market size.";
      confidence -= 12;
    }

    const netImpact = simulatedRevenue - baselineRevenue;

    // 3. Compute Horizon Projections (30d, 90d, 365d)
    const calculateHorizon = (days: number): HorizonMetrics => {
      const factor = days / 30;
      const growthRate = 1.03; // 3% monthly compounding growth base
      const timeCompoundedRevenue = simulatedRevenue * Math.pow(growthRate, factor);
      const profitMargin = 0.35 - (s.newCityEntry ? 0.05 : 0) + (s.amcConversionShift > 0 ? 0.03 : 0);
      
      let opsHealth = Math.max(40, 85 - (s.complaintsMultiplier > 1.0 ? 15 : 0) + (s.techniciansDelta > 0 ? 10 : 0));
      let capacity = Math.max(30, 80 + (s.garageNetworkExpansion ? s.garageNetworkExpansion * 5 : 0) - (s.complaintsMultiplier > 1.0 ? 12 : 0));
      let churn = Math.min(60, 15 + (s.complaintsMultiplier > 1.0 ? 15 : 0) - (s.amcConversionShift > 0 ? 5 : 0));
      
      return {
        revenue: Math.round(timeCompoundedRevenue),
        profit: Math.round(timeCompoundedRevenue * profitMargin),
        operations_health: Number(opsHealth.toFixed(1)),
        capacity: Number(capacity.toFixed(1)),
        churn: Number(churn.toFixed(1)),
        growth: Number((growthRate * 100 - 100).toFixed(1)),
        risk: Number((churn * 1.5).toFixed(1))
      };
    };

    const result: SimulationResult = {
      revenue_impact: Number(netImpact.toFixed(2)),
      operational_impact: opsImpact,
      growth_impact: groImpact,
      risk_impact: riskImpact,
      confidence_score: Number(Math.max(40, confidence).toFixed(2)),
      horizons: {
        "30d": calculateHorizon(30),
        "90d": calculateHorizon(90),
        "365d": calculateHorizon(365)
      }
    };

    // Store in database
    const { data: stored, error } = await db
      .from("ceo_simulations")
      .insert({
        simulation_query: `Sim V2: AMC=${s.amcConversionShift}%, Techs=${s.techniciansDelta}, Price=${s.amcPricingChange || 0}, Mkt=${s.marketingBudgetIncrease || 0}, Garages=${s.garageNetworkExpansion || 0}`,
        variables_modeled: s
      })
      .select("id")
      .maybeSingle();

    if (error) throw error;

    if (stored) {
      await db
        .from("ceo_simulation_results")
        .insert({
          simulation_id: stored.id,
          revenue_impact: result.revenue_impact,
          operational_impact: result.operational_impact,
          growth_impact: result.growth_impact,
          risk_impact: result.risk_impact,
          confidence_score: result.confidence_score
        });
    }

    return { success: true, result };
  } catch (err: any) {
    console.error("Failed to run CEO Simulation V2:", err.message);
    return { success: false };
  }
}
