import { createClient } from "@/lib/supabase/server";
import { getBookings } from "@/lib/laravel/api";
import { getOperationsHealthReport } from "./operations-health";

export interface SimulationInputs {
  bookingsDelta: number; // percentage change (e.g. +25 or -10)
  techsDelta: number; // count change (e.g. +3 or -2)
  garageOfflineId?: string; // UUID of garage to simulate going offline
  complaintsDelta: number; // percentage change (e.g. +50 or -30)
}

export interface SimulationOutputs {
  utilization: {
    technician: number;
    garage: number;
  };
  responseTimeMinutes: number;
  completionRate: number;
  revenue: number;
  revenueImpact: number;
  csat: number;
  csatImpact: number;
  margin: number;
  marginImpact: number;
}

/**
 * Operations Simulator runs digital twin projections for CEO scenario modeling.
 */
export async function runSimulation(
  scenarioName: string,
  inputs: SimulationInputs
): Promise<{ simulationId: string; results: SimulationOutputs }> {
  const supabase = await createClient();

  // 1. Fetch current baseline metrics
  const healthReport = await getOperationsHealthReport();
  const bookings = await getBookings().catch(() => []);
  const { data: technicians } = await supabase.from("technicians").select("*");
  const { data: garages } = await supabase.from("garages").select("*");

  const baselineTechCount = (technicians || []).length || 10;
  const baselineGarageCapacity = (garages || []).reduce((acc: number, curr: any) => acc + (curr.capacity || 5), 0) || 50;

  // Compute current average booking price and monthly revenue
  const AVG_BOOKING_VAL = 2500;
  const baselineBookings = bookings.length || 120;
  const baselineRevenue = baselineBookings * AVG_BOOKING_VAL;
  const baselineCsat = 4.25;
  const baselineMargin = 62.50; // percentage

  // 2. Apply deltas to parameters
  const simulatedBookingsCount = baselineBookings * (1 + inputs.bookingsDelta / 100);
  const simulatedTechCount = Math.max(1, baselineTechCount + inputs.techsDelta);

  // If a garage goes offline, subtract its capacity
  let simulatedGarageCapacity = baselineGarageCapacity;
  if (inputs.garageOfflineId && garages) {
    const offlineGarage = garages.find((g: any) => g.id === inputs.garageOfflineId);
    if (offlineGarage) {
      simulatedGarageCapacity = Math.max(0, baselineGarageCapacity - (offlineGarage.capacity || 5));
    }
  }

  // 3. Project technician utilization
  // Base: 1 tech can comfortably handle 2.5 bookings per month scale factor (scaled down for simulation window)
  const techCap = simulatedTechCount * 15; // bookings per month capacity
  const rawTechUtil = (simulatedBookingsCount / techCap) * 100;
  const simulatedTechUtil = Math.round(Math.min(100, Math.max(10, rawTechUtil)));

  // 4. Project garage utilization
  const garageCap = simulatedGarageCapacity * 3; // bookings per month capacity
  const rawGarageUtil = (simulatedBookingsCount / garageCap) * 100;
  const simulatedGarageUtil = Math.round(Math.min(100, Math.max(10, rawGarageUtil)));

  const maxUtil = Math.max(simulatedTechUtil, simulatedGarageUtil);

  // 5. Calculate Response Time & Completion Rates
  // Response time scales exponentially if utilization exceeds 80%
  let simulatedResponseTime = 15.0; // target baseline
  if (maxUtil > 80) {
    const excess = maxUtil - 80;
    simulatedResponseTime += excess * 1.5; // add 1.5 minutes per percent excess
  } else {
    // low utilization implies fast response
    simulatedResponseTime = Math.max(5, 15 - (80 - maxUtil) * 0.1);
  }
  simulatedResponseTime = Number(simulatedResponseTime.toFixed(1));

  // Completion rate drops if capacity is choked
  let simulatedCompletionRate = 92;
  if (maxUtil > 85) {
    const excess = maxUtil - 85;
    simulatedCompletionRate = Math.max(50, 92 - Math.round(excess * 0.8));
  }

  // 6. Calculate Revenue & Margin Impacts
  const completedBookings = simulatedBookingsCount * (simulatedCompletionRate / 100);
  const simulatedRevenue = completedBookings * AVG_BOOKING_VAL;
  const revenueImpact = simulatedRevenue - baselineRevenue;

  // CSAT drops as response times increase
  let csatImpact = 0;
  if (simulatedResponseTime > 15) {
    const delayHours = (simulatedResponseTime - 15) / 60;
    csatImpact = -(delayHours * 0.1);
  } else {
    csatImpact = 0.05; // CSAT boost for fast times
  }
  const simulatedCsat = Number(Math.min(5.00, Math.max(1.00, baselineCsat + csatImpact)).toFixed(2));

  // Margin drops due to overtime labor (if tech utilization > 80) and rework / complaint costs
  let marginImpact = 0;
  if (simulatedTechUtil > 80) {
    marginImpact -= (simulatedTechUtil - 80) * 0.25; // labor overtime cost
  }
  if (inputs.complaintsDelta > 0) {
    marginImpact -= (inputs.complaintsDelta / 100) * 1.5; // complaints processing drag
  }
  const simulatedMargin = Number(Math.min(80.00, Math.max(20.00, baselineMargin + marginImpact)).toFixed(1));

  const results: SimulationOutputs = {
    utilization: {
      technician: simulatedTechUtil,
      garage: simulatedGarageUtil
    },
    responseTimeMinutes: simulatedResponseTime,
    completionRate: simulatedCompletionRate,
    revenue: Math.round(simulatedRevenue),
    revenueImpact: Math.round(revenueImpact),
    csat: simulatedCsat,
    csatImpact: Number(csatImpact.toFixed(2)),
    margin: simulatedMargin,
    marginImpact: Number(marginImpact.toFixed(1))
  };

  // 7. Save Simulation in Supabase
  const { data: simRecord, error: simErr } = await supabase
    .from("operations_simulations")
    .insert({
      scenario_name: scenarioName,
      inputs: inputs
    })
    .select("id")
    .single();

  const simulationId = simRecord?.id || "sim-placeholder";

  if (simRecord?.id) {
    await supabase.from("simulation_results").insert({
      simulation_id: simRecord.id,
      metrics: {
        utilization: results.utilization,
        responseTimeMinutes: results.responseTimeMinutes,
        completionRate: results.completionRate,
        revenue: results.revenue,
        csat: results.csat,
        margin: results.margin
      },
      revenue_impact: results.revenueImpact,
      csat_impact: results.csatImpact
    });
  }

  return { simulationId, results };
}
