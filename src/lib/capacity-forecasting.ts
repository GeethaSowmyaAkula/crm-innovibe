import { createClient } from "@/lib/supabase/server";
import { getBookings } from "@/lib/laravel/api";

export interface CapacityForecast {
  id?: string;
  forecast_period: "7_days" | "30_days" | "90_days";
  predicted_bookings: number;
  predicted_complaints: number;
  tech_utilization_forecast: number;
  garage_utilization_forecast: number;
  revenue_impact: number;
}

/**
 * Capacity Forecasting Engine applies demand projection rules on booking schedules
 * to forecast utilization limits and revenue impact from capacity bottlenecks.
 */
export async function generateCapacityForecasts(): Promise<CapacityForecast[]> {
  const supabase = await createClient();

  // Load datasets
  const [
    bookingsRaw,
    { data: complaints },
    { data: technicians },
    { data: garages }
  ] = await Promise.all([
    getBookings().catch(() => []),
    supabase.from("complaints").select("*"),
    supabase.from("technicians").select("*"),
    supabase.from("garages").select("*")
  ]);

  const bookings = bookingsRaw || [];
  const complaintList = complaints || [];
  const technicianList = technicians || [];
  const garageList = garages || [];

  // Calculate current counts
  const totalTechnicians = technicianList.length || 10;
  const totalGaragesCapacity = garageList.reduce((acc: number, curr: any) => acc + (curr.capacity || 5), 0) || 50;

  // Let's compute average booking frequency (bookings/day) over the last 30 days
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  
  const last30dBookings = bookings.filter((b: any) => {
    const created = new Date(b.created_at).getTime();
    return (now - created) <= 30 * dayMs;
  });
  
  const baseBookingsPerDay = Math.max(1, last30dBookings.length / 30);
  
  const last30dComplaints = complaintList.filter((c: any) => {
    const created = new Date(c.created_at).getTime();
    return (now - created) <= 30 * dayMs;
  });
  const baseComplaintsPerDay = Math.max(0.1, last30dComplaints.length / 30);

  // Apply growth trends (e.g., monsoon seasonal multiplier + organic growth of 5% monthly)
  const growthRate = 0.05; // 5% growth per 30 days
  const AVG_BOOKING_VAL = 2500;

  const periods: Array<"7_days" | "30_days" | "90_days"> = ["7_days", "30_days", "90_days"];
  const forecasts: CapacityForecast[] = [];

  for (const period of periods) {
    let days = 7;
    let growthFactor = 1.0;
    
    if (period === "7_days") {
      days = 7;
      growthFactor = 1.01; // minimal compounding
    } else if (period === "30_days") {
      days = 30;
      growthFactor = 1.0 + growthRate;
    } else if (period === "90_days") {
      days = 90;
      growthFactor = 1.0 + (growthRate * 3.1); // compounding over 3 months
    }

    // Projections
    const predictedBookings = Math.round(baseBookingsPerDay * days * growthFactor);
    const predictedComplaints = Math.round(baseComplaintsPerDay * days * growthFactor);

    // Dynamic slot capacity utilization projections
    // Total technician capacity: 1 tech can handle ~2.5 jobs per day
    const techCapacityPerDay = totalTechnicians * 2.5;
    const totalTechCapacityForPeriod = techCapacityPerDay * days;
    const techUtilizationForecast = Math.min(100, Math.round((predictedBookings / totalTechCapacityForPeriod) * 100));

    // Total garage capacity: slots limit per day
    const totalGarageCapacityForPeriod = totalGaragesCapacity * days;
    const garageUtilizationForecast = Math.min(100, Math.round((predictedBookings / totalGarageCapacityForPeriod) * 100));

    // Calculate Revenue Impact
    // If utilization forecast is > 85%, bookings overflow capacity limits and are lost
    let revenueImpact = 0;
    const capacityThreshold = 85;
    
    if (techUtilizationForecast > capacityThreshold) {
      const overflowRatio = (techUtilizationForecast - capacityThreshold) / 100;
      const lostBookings = predictedBookings * overflowRatio;
      revenueImpact += Math.round(lostBookings * AVG_BOOKING_VAL);
    }
    
    if (garageUtilizationForecast > capacityThreshold) {
      const overflowRatio = (garageUtilizationForecast - capacityThreshold) / 100;
      const lostBookings = predictedBookings * overflowRatio;
      revenueImpact += Math.round(lostBookings * AVG_BOOKING_VAL * 0.5); // overlapping lost bookings
    }

    forecasts.push({
      forecast_period: period,
      predicted_bookings: predictedBookings,
      predicted_complaints: predictedComplaints,
      tech_utilization_forecast: techUtilizationForecast,
      garage_utilization_forecast: garageUtilizationForecast,
      revenue_impact: revenueImpact
    });
  }

  // Save forecasts to Supabase
  if (forecasts.length > 0) {
    const toInsert = forecasts.map(f => ({
      forecast_period: f.forecast_period,
      predicted_bookings: f.predicted_bookings,
      predicted_complaints: f.predicted_complaints,
      tech_utilization_forecast: f.tech_utilization_forecast,
      garage_utilization_forecast: f.garage_utilization_forecast,
      revenue_impact: f.revenue_impact
    }));
    try {
      await supabase.from("capacity_forecasts").insert(toInsert);
    } catch (e) {
      // Graceful degradation
    }
  }

  return forecasts;
}
